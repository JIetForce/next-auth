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
            .min(1, "Сообщение не может быть пустым"),
        })
        .passthrough(),
    )
    .min(1, "Диалог не может быть пустым")
    .max(50, "Превышена максимальная глубина контекста диалога"),
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
      { error: "Некорректный JSON в теле запроса." },
      { status: 400 },
    );
  }

  const parsed = chatRequestSchema.safeParse(rawJson);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Неверный формат сообщений.",
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

    // 6. Gemini 2.0 Flash via the Vercel AI SDK
    const result = streamText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.3, // low temperature to suppress hallucinations
      maxOutputTokens: 1000,
      onError: ({ error }) => {
        logger.error(
          {
            err: error,
            callerKind: caller.kind,
            identifier: caller.identifier,
          },
          "Gemini 2.0 Flash streamText execution error",
        );
      },
    });

    // 7. UI message stream (AI SDK v5); quota/network errors are mapped to
    // friendly messages via onError (they surface in useChat's `error`).
    return result.toUIMessageStreamResponse({
      onError: (err) => {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (isQuotaError(errMsg)) {
          return "Сервис ИИ временно перегружен из-за исчерпания бесплатной квоты запросов Google AI Studio. Пожалуйста, повторите попытку через минуту.";
        }
        return "Произошла временная ошибка при ответе ассистента Siftloom. Пожалуйста, повторите вопрос.";
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
            "Превышена квота запросов к Google AI Studio. Повторите попытку через 1 минуту.",
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
      { error: "Внутренняя ошибка сервиса при обработке диалога." },
      { status: 500 },
    );
  }
}
