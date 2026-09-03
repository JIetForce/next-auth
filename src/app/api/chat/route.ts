import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";

import { env } from "@/env";
import { isAiChatConfigured } from "@/lib/auth/environment";
import { verifyChatAccess } from "@/lib/ai/chat-guard";
import { buildSiftloomSystemPrompt } from "@/lib/ai/siftloom-prompt";
import { logger } from "@/lib/logger";

// Streaming endpoint max execution duration (Vercel / Next.js)
export const maxDuration = 30;

// Request validation: the client may send ONLY user or assistant roles —
// a client-supplied `system` role would be a prompt-injection vector.
// v5 UIMessages carry `parts` (not `content`); text parts are size-capped.
const chatRequestSchema = z.object({
  messages: z
    .array(
      z
        .object({
          id: z.string().min(1),
          role: z.enum(["user", "assistant"]),
          parts: z
            .array(
              z
                .object({
                  type: z.string(),
                  text: z.string().max(4000).optional(),
                })
                .passthrough(),
            )
            .min(1, "Message cannot be empty"),
        })
        .passthrough(),
    )
    .min(1, "Dialog cannot be empty")
    .max(50, "Maximum dialog context depth exceeded"),
});

function isQuotaError(message: string): boolean {
  return (
    message.includes("ResourceExhausted") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("quota") ||
    message.includes("429")
  );
}

export async function POST(req: Request) {
  // 1. Fail closed when the AI Studio key is not configured
  if (!isAiChatConfigured()) {
    return Response.json(
      { error: "AI chat is not configured." },
      { status: 503 },
    );
  }

  // 2. Session check and atomic quotas (PostgreSQL)
  const access = await verifyChatAccess(req.headers);
  if (!access.allowed) {
    return Response.json(
      { error: access.reason },
      {
        status: 429,
        headers: {
          "Retry-After": access.retryAfterSeconds.toString(),
          "Content-Type": "application/json",
        },
      },
    );
  }

  // 3. Validate the JSON body
  let rawJson: unknown;
  try {
    rawJson = await req.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON in the request body." },
      { status: 400 },
    );
  }

  const parsed = chatRequestSchema.safeParse(rawJson);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid message format.",
        details: parsed.error.format(),
      },
      { status: 400 },
    );
  }

  const { caller } = access;
  const isGuest = caller.kind === "guest";
  const userName = caller.kind === "authenticated" ? caller.viewer.name : null;

  // Created after the config guard so the optional env var type-checks.
  const google = createGoogleGenerativeAI({
    apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  try {
    // 4. System prompt with the knowledge base and guardrails
    const systemPrompt = buildSiftloomSystemPrompt({
      userName,
      isGuest,
    });

    // 5. Validated client UIMessages -> model messages (AI SDK v5)
    const modelMessages = convertToModelMessages(
      parsed.data.messages as UIMessage[],
    );

    // 6. Gemini 2.5 Flash via the Vercel AI SDK
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.3, // low temperature to suppress hallucinations
      maxOutputTokens: 4000,
      onError: ({ error }) => {
        logger.error(
          {
            err: error,
            callerKind: caller.kind,
            identifier: caller.identifier,
          },
          "Gemini 2.5 Flash streamText execution error",
        );
      },
    });

    // 7. UI message stream (AI SDK v5); quota/network errors are mapped to
    // friendly messages via onError (they surface in useChat's `error`).
    return result.toUIMessageStreamResponse({
      onError: (err) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (isQuotaError(errMsg)) {
          return "The AI service is temporarily overloaded because the free Google AI Studio request quota has been exhausted. Please try again in a minute.";
        }
        return "A temporary error occurred while the Siftloom assistant was replying. Please ask your question again.";
      },
    });
  } catch (error: unknown) {
    const errorStr = error instanceof Error ? error.message : String(error);

    if (isQuotaError(errorStr)) {
      logger.warn(
        { err: error, identifier: caller.identifier },
        "Google AI Studio 429 quota exhausted on init",
      );
      return Response.json(
        {
          error:
            "The Google AI Studio request quota has been exceeded. Please try again in 1 minute.",
        },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        },
      );
    }

    logger.error(
      { err: error, identifier: caller.identifier },
      "POST /api/chat unhandled initialization error",
    );

    return Response.json(
      {
        error:
          "An internal service error occurred while processing the dialog.",
      },
      { status: 500 },
    );
  }
}
