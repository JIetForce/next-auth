"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import {
  Bot,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  AlertCircle,
  RotateCcw,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const GUEST_STORAGE_KEY = "siftloom_chat_messages_v1";

const chatTransport = new DefaultChatTransport({ api: "/api/chat" });

const QUICK_PROMPTS = [
  "What is Siftloom?",
  "Which tool categories are there?",
  "Suggest free Zapier alternatives",
  "How do I add my tool to the catalog?",
];

/**
 * Extracts the text content of a UIMessage (AI SDK v5 `parts` structure).
 */
function getMessageText(message: UIMessage): string {
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )
      .map((part) => part.text)
      .join("");
  }
  return "";
}

// react-markdown custom components: internal site links render through
// next/link for client-side routing; external links open in a new tab with
// the standard safe rel. Never use dangerouslySetInnerHTML — react-markdown
// parses the Markdown to an AST and renders it as React elements.
const markdownComponents: Components = {
  // react-markdown forwards a `node` prop (the HAST element) to custom
  // components; it is not a valid DOM attribute, so destructure it out
  // before spreading the rest onto the underlying element.
  a({ href, node: _node, children, ...props }) {
    // `node` is react-markdown's HAST element, not a DOM attribute.
    void _node;
    if (href && href.startsWith("/")) {
      return (
        <Link href={href} {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  },
};

function ChatWidgetInner({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [isHydrated, setIsHydrated] = React.useState(false);
  const prevMessagesLengthRef = React.useRef(0);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // AI SDK v5 useChat: no built-in input state — the input is local state;
  // isLoading is derived from `status`; retry is `regenerate()`.
  const { messages, status, error, sendMessage, regenerate, setMessages } =
    useChat({ transport: chatTransport });

  const isLoading = status === "submitted" || status === "streaming";

  // 1. Hydrate the guest history from localStorage on first mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(GUEST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore localStorage unavailability or corruption
    } finally {
      setIsHydrated(true);
    }
  }, [setMessages]);

  // 2. Sync to localStorage ONLY after hydration has completed on subsequent renders —
  // without the guard the empty initial state would wipe saved messages.
  React.useEffect(() => {
    if (!isHydrated) return;

    try {
      if (messages.length > 0) {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(messages));
      } else if (prevMessagesLengthRef.current > 0) {
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
      prevMessagesLengthRef.current = messages.length;
    } catch {
      // Ignore localStorage quota errors
    }
  }, [messages, isHydrated]);

  // 3. Auto-scroll to the latest message while open
  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleClearHistory = () => {
    setMessages([]);
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      // Ignore localStorage unavailability
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    void sendMessage({ text });
  };

  const handleSelectQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    void sendMessage({ text: prompt });
  };

  return (
    <>
      {/* Floating launcher button in the bottom corner */}
      <div className="fixed right-6 bottom-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-siftloom-gradient text-[#06140F] font-bold shadow-lg shadow-siftloom-glow transition-all hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
          aria-label="Open the Siftloom assistant"
        >
          <MessageSquare className="h-6 w-6 transition-transform group-hover:scale-110" />
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 flex h-3.5 w-3.5"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-cyan-500" />
          </span>
        </button>
      </div>

      {/* Slide-out panel on the Base UI Sheet (@base-ui/react) */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col border-l bg-background p-0 shadow-2xl sm:max-w-md"
        >
          {/* Header with pr-10 so it clears the built-in close button */}
          <SheetHeader className="flex flex-row items-center justify-between border-b bg-muted/30 p-4 pr-10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="flex items-center gap-1.5 font-heading text-base font-semibold">
                  Siftloom Assistant
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Guide to the tool catalog and platform
                </SheetDescription>
              </div>
            </div>

            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleClearHistory}
                title="Clear message history"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </SheetHeader>

          {/* Context and auth bar */}
          <div className="flex items-center justify-between border-b bg-primary/5 px-4 py-2 text-xs text-muted-foreground">
            <span>AI, SaaS &amp; Workflows catalog</span>
            {!isAuthenticated && (
              <Link
                href="/login"
                className="flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <User className="h-3 w-3" /> Sign in
              </Link>
            )}
          </div>

          {/* Conversation area */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-4 p-4 text-center">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium">How can I help?</h3>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Ask about the Siftloom tool catalog, find services for your
                    task, or learn what the platform offers.
                  </p>
                </div>

                {/* Quick starter questions (chips) */}
                <div className="w-full space-y-2 pt-2">
                  <p className="text-left text-xs font-medium text-muted-foreground">
                    Popular questions:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        type="button"
                        key={prompt}
                        onClick={() => handleSelectQuickPrompt(prompt)}
                        disabled={isLoading}
                        className="cursor-pointer rounded-lg border bg-muted/50 p-2.5 text-left text-xs text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === "user";
                const messageText = getMessageText(m);

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex max-w-[85%] gap-2.5",
                      isUser ? "ml-auto flex-row-reverse" : "mr-auto",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full text-xs font-medium",
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "border bg-muted text-foreground",
                      )}
                    >
                      {isUser ? "You" : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed break-words",
                        isUser
                          ? "rounded-tr-none bg-primary text-primary-foreground"
                          : "rounded-tl-none border bg-muted/70 text-foreground",
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{messageText}</p>
                      ) : (
                        <div className="whitespace-pre-wrap [&_a]:font-medium [&_a]:underline [&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0 [&_li]:m-0">
                          <ReactMarkdown components={markdownComponents}>
                            {messageText}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Generation indicator via the project Spinner */}
            {isLoading && (
              <div className="mr-auto flex max-w-[85%] items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full border bg-muted text-xs">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border bg-muted/70 px-3.5 py-2.5 text-xs text-muted-foreground">
                  <Spinner className="size-3.5 text-primary" />
                  <span className="text-[11px]">Siftloom is thinking...</span>
                </div>
              </div>
            )}

            {/* Error block (e.g. HTTP 429 on quota exhaustion) */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="font-medium">Request failed</p>
                  <p className="text-[11px] leading-normal opacity-90">
                    {error.message ||
                      "Could not get a response. The request limit may be temporarily exceeded."}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => regenerate()}
                    disabled={isLoading}
                    className="mt-1 h-7 border-destructive/30 text-xs hover:bg-destructive/10"
                  >
                    <RotateCcw className="mr-1 h-3 w-3" /> Try again
                  </Button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message form */}
          <div className="border-t bg-background p-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about Siftloom or the tools..."
                aria-label="Ask about Siftloom or the tools..."
                disabled={isLoading}
                className="h-10 rounded-xl text-xs"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="h-10 w-10 shrink-0 rounded-xl"
                aria-label="Send message"
              >
                {isLoading ? (
                  <Spinner className="size-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <div className="mt-1.5 text-center">
              <span className="text-[10px] text-muted-foreground">
                The assistant only answers questions about the Siftloom catalog
                and platform.
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function ChatWidget({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <React.Suspense fallback={null}>
      <ChatWidgetInner isAuthenticated={isAuthenticated} />
    </React.Suspense>
  );
}
