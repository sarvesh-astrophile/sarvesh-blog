import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@sarvesh-blog/backend/convex/_generated/api";
import { Bubble, BubbleContent } from "@sarvesh-blog/ui/components/bubble";
import { Button } from "@sarvesh-blog/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@sarvesh-blog/ui/components/drawer";
import { Field, FieldLabel } from "@sarvesh-blog/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@sarvesh-blog/ui/components/input-group";
import { Message, MessageContent, MessageHeader } from "@sarvesh-blog/ui/components/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@sarvesh-blog/ui/components/message-scroller";
import { Trace, TraceIcon, TraceLine, TraceTitle } from "@sarvesh-blog/ui/components/trace";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { ArrowUp, LoaderCircle, Sparkles, Trash2, X } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

const Markdown = lazy(() =>
  import("@sarvesh-blog/ui/components/markdown").then((module) => ({ default: module.Markdown })),
);

function errorMessage(
  error: unknown,
  fallback = "Couldn't send your question. Please check your connection and try again.",
) {
  if (error instanceof ConvexError) {
    if (typeof error.data === "string") return error.data;
    const data: unknown = error.data;
    if (
      data &&
      typeof data === "object" &&
      "retryAfter" in data &&
      typeof data.retryAfter === "number"
    ) {
      return `Too many questions. Please try again in ${Math.max(1, Math.ceil(data.retryAfter / 1000))} seconds.`;
    }
  }
  return fallback;
}

export function useResumeChat() {
  const [sessionToken, setSessionToken] = useState<string>();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string>();
  const sendingRef = useRef(false);
  const send = useMutation(api.resumeChat.send);
  const clearChat = useMutation(api.resumeChat.clear);
  const chat = useQuery(api.resumeChat.status, sessionToken ? { sessionToken } : "skip");

  useEffect(() => {
    let token: string | null = null;
    try {
      token = sessionStorage.getItem("resume-chat-session");
    } catch {
      /* Storage can be disabled. */
    }
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
      try {
        sessionStorage.setItem("resume-chat-session", token);
      } catch {
        /* Keep an in-memory session. */
      }
    }
    setSessionToken(token);
  }, []);

  async function submit() {
    const prompt = question.trim();
    if (!prompt || !sessionToken || sendingRef.current || chat?.pending) return;
    sendingRef.current = true;
    setSending(true);
    setError(undefined);
    setOpen(true);
    try {
      await send({ sessionToken, prompt });
      setQuestion((current) => (current.trim() === prompt ? "" : current));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function clear() {
    if (!sessionToken || sendingRef.current || chat?.pending) return;
    sendingRef.current = true;
    setClearing(true);
    setError(undefined);
    try {
      await clearChat({ sessionToken });
      setQuestion("");
    } catch (cause) {
      setError(
        errorMessage(cause, "Couldn't clear the chat. Please check your connection and try again."),
      );
    } finally {
      sendingRef.current = false;
      setClearing(false);
    }
  }

  return {
    sessionToken,
    open,
    setOpen,
    question,
    setQuestion,
    submit,
    clear,
    clearing,
    threadId: chat?.threadId,
    busy: sending || clearing || Boolean(chat?.pending),
    ready: Boolean(sessionToken) && chat !== undefined,
    error: error ?? chat?.error,
  };
}

type ResumeChat = ReturnType<typeof useResumeChat>;

function ChatMessages({ chat }: { chat: ResumeChat }) {
  const {
    results: messages,
    status,
    loadMore,
  } = useUIMessages(
    api.resumeChat.messages,
    chat.sessionToken && chat.threadId
      ? { sessionToken: chat.sessionToken, threadId: chat.threadId }
      : "skip",
    { initialNumItems: 20, stream: true },
  );
  return (
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1">
        <MessageScrollerViewport>
          <MessageScrollerContent className="gap-5 p-4">
            {status === "CanLoadMore" && (
              <Button variant="ghost" onClick={() => loadMore(20)}>
                Load earlier messages
              </Button>
            )}
            {status === "LoadingMore" && (
              <p role="status" className="text-sm text-muted-foreground">
                Loading earlier messages…
              </p>
            )}
            {messages
              .filter((message) => message.role === "user" || message.role === "assistant")
              .map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === "user"}
                >
                  <Message align={message.role === "user" ? "end" : "start"}>
                    <MessageContent>
                      <MessageHeader>
                        {message.role === "user" ? "You" : "Sarvesh's assistant"}
                      </MessageHeader>
                      {message.role === "user" ? (
                        <Bubble align="end" variant="muted">
                          <BubbleContent className="whitespace-pre-wrap">
                            {message.parts
                              .filter((part) => part.type === "text")
                              .map((part) => part.text)
                              .join("")}
                          </BubbleContent>
                        </Bubble>
                      ) : (
                        <Suspense
                          fallback={
                            <p role="status" className="text-sm text-muted-foreground">
                              Loading reply…
                            </p>
                          }
                        >
                          <Markdown isAnimating={message.status === "streaming"}>
                            {message.parts
                              .filter((part) => part.type === "text")
                              .map((part) => part.text)
                              .join("")}
                          </Markdown>
                        </Suspense>
                      )}
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            {chat.busy && (
              <div role="status">
                <Trace>
                  <TraceLine status="running">
                    <TraceIcon>
                      <LoaderCircle className="motion-safe:animate-spin" />
                    </TraceIcon>
                    <TraceTitle>Preparing a reply from Sarvesh's resume</TraceTitle>
                  </TraceLine>
                </Trace>
              </div>
            )}
            {!messages.length && !chat.busy && !chat.error && (
              <p className="text-sm text-muted-foreground">
                Ask about Sarvesh's work, projects, or experience. Answers use his provided resume
                context.
              </p>
            )}
            {chat.error && (
              <p role="alert" className="text-sm text-destructive">
                {chat.error}
              </p>
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

export function ResumeChatDrawer({ chat }: { chat: ResumeChat }) {
  return (
    <Drawer modal swipeDirection="right" open={chat.open} onOpenChange={chat.setOpen}>
      <DrawerContent className="w-[calc(100vw-1rem)] font-[Geist,sans-serif] sm:w-[28rem]">
        <DrawerHeader className="border-b pb-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <DrawerTitle className="flex items-center gap-2">
              <Sparkles className="size-4" /> Ask about Sarvesh
            </DrawerTitle>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void chat.clear()}
                disabled={!chat.ready || !chat.threadId || chat.busy}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {chat.clearing ? "Clearing…" : "Clear chat"}
              </Button>
              <DrawerClose
                render={<Button variant="ghost" size="icon-sm" aria-label="Close resume chat" />}
              >
                <X className="size-4" />
              </DrawerClose>
            </div>
          </div>
          <DrawerDescription>
            Ask about his work, projects, and experience. Answers use his resume context.
          </DrawerDescription>
        </DrawerHeader>
        {chat.clearing ? (
          <p role="status" className="flex-1 p-4 text-sm text-muted-foreground">
            Clearing chat…
          </p>
        ) : (
          <ChatMessages key={chat.threadId ?? "empty"} chat={chat} />
        )}
        <DrawerFooter className="border-t pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void chat.submit();
            }}
          >
            <Field>
              <FieldLabel htmlFor="resume-chat-question" className="sr-only">
                Ask a follow-up about Sarvesh
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="resume-chat-question"
                  placeholder="Ask a follow-up…"
                  value={chat.question}
                  maxLength={2000}
                  onChange={(event) => chat.setQuestion(event.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="submit"
                    variant="default"
                    size="icon-sm"
                    aria-label="Send question"
                    disabled={!chat.ready || chat.busy || !chat.question.trim()}
                  >
                    <ArrowUp className="size-4" />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </form>
          <p className="text-xs text-muted-foreground">
            AI can make mistakes. Missing details aren't guessed. Questions are stored to maintain
            this conversation.
          </p>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
