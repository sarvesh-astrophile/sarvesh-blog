/// <reference types="vite/client" />
import agent from "@convex-dev/agent/test";
import { Agent } from "@convex-dev/agent";
import { convexGateway } from "@convex-dev/ai-sdk-provider";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

vi.mock("@convex-dev/ai-sdk-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@convex-dev/ai-sdk-provider")>();
  return { ...actual, convexGateway: vi.fn(actual.convexGateway) };
});

const modules = import.meta.glob("./**/*.ts");
const sessionToken = "a".repeat(64);

function setup() {
  const t = convexTest(schema, modules);
  agent.register(t);
  rateLimiter.register(t);
  return t;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

test.each([
  [undefined, "anthropic/claude-sonnet-4.5"],
  ["openai/gpt-5-mini", "openai/gpt-5-mini"],
])(
  "uses the gateway model override %s and recovers from generation failure",
  async (override, expected) => {
    vi.stubEnv("RESUME_CHAT_MODEL", override);
    const stream = vi
      .spyOn(Agent.prototype, "streamText")
      .mockRejectedValueOnce(new Error("AiGatewayDisabled"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const t = setup();
    const threadId = await t.mutation(api.resumeChat.send, { sessionToken, prompt: "Hello" });
    const chat = await t.run(async (ctx) => (await ctx.db.query("resumeChats").take(1))[0]!);
    await t.action(internal.resumeChat.reply, {
      chatId: chat._id,
      threadId,
      messageId: chat.pendingMessageId!,
    });
    expect(convexGateway).toHaveBeenCalledWith(expected);
    expect(stream).toHaveBeenCalledOnce();
    expect(await t.query(api.resumeChat.status, { sessionToken })).toMatchObject({
      pending: false,
      error: "I couldn't complete that reply. Please try asking again.",
    });
  },
);

test("rejects blank, oversized, and malformed-session requests", async () => {
  const t = setup();
  await expect(t.mutation(api.resumeChat.send, { sessionToken, prompt: " " })).rejects.toThrow(
    "2,000",
  );
  await expect(
    t.mutation(api.resumeChat.send, { sessionToken, prompt: "x".repeat(2001) }),
  ).rejects.toThrow("2,000");
  await expect(
    t.mutation(api.resumeChat.send, { sessionToken: "not-a-token", prompt: "Hello" }),
  ).rejects.toThrow("Invalid chat session");
});

test("accepts questions without provider API keys", async () => {
  vi.stubEnv("OPENAI_API_KEY", "");
  const t = setup();
  const threadId = await t.mutation(api.resumeChat.send, { sessionToken, prompt: "Hello" });
  expect(await t.query(api.resumeChat.status, { sessionToken })).toMatchObject({
    threadId,
    pending: true,
  });
});

test("persists the question and prevents concurrent replies", async () => {
  const t = setup();
  const threadId = await t.mutation(api.resumeChat.send, {
    sessionToken,
    prompt: "  Who is Sarvesh?  ",
  });
  expect(await t.query(api.resumeChat.status, { sessionToken })).toMatchObject({
    threadId,
    pending: true,
  });
  const result = await t.query(api.resumeChat.messages, {
    sessionToken,
    threadId,
    paginationOpts: { cursor: null, numItems: 20 },
  });
  expect(result.page[0]?.parts).toContainEqual(
    expect.objectContaining({ type: "text", text: "Who is Sarvesh?" }),
  );
  await expect(
    t.mutation(api.resumeChat.send, { sessionToken, prompt: "Another question" }),
  ).rejects.toThrow("wait for the current reply");
});

test("other anonymous visitors cannot read a conversation or its streams", async () => {
  const t = setup();
  const threadId = await t.mutation(api.resumeChat.send, { sessionToken, prompt: "Hello" });
  const stranger = "b".repeat(64);
  expect(await t.query(api.resumeChat.status, { sessionToken: stranger })).toBeNull();
  await expect(
    t.query(api.resumeChat.messages, {
      sessionToken: stranger,
      threadId,
      paginationOpts: { cursor: null, numItems: 20 },
    }),
  ).rejects.toThrow("Conversation not found");
});

test("completion ignores stale requests and clears pending with a recoverable error", async () => {
  const t = setup();
  await t.mutation(api.resumeChat.send, { sessionToken, prompt: "Hello" });
  const chat = await t.run(async (ctx) => (await ctx.db.query("resumeChats").take(1))[0]!);
  await t.mutation(internal.resumeChat.finish, { chatId: chat._id, messageId: "stale" });
  expect(await t.query(api.resumeChat.status, { sessionToken })).toMatchObject({ pending: true });
  await t.mutation(internal.resumeChat.finish, {
    chatId: chat._id,
    messageId: chat.pendingMessageId!,
    error: "Please try again",
  });
  expect(await t.query(api.resumeChat.status, { sessionToken })).toMatchObject({
    pending: false,
    error: "Please try again",
  });
});

test("clearing chats does not bypass the per-session burst limit", async () => {
  const t = setup();
  for (let i = 0; i < 3; i++) {
    await t.mutation(api.resumeChat.send, { sessionToken, prompt: `Question ${i}` });
    const chat = await t.run(async (ctx) => (await ctx.db.query("resumeChats").take(1))[0]!);
    await t.mutation(internal.resumeChat.finish, {
      chatId: chat._id,
      messageId: chat.pendingMessageId!,
    });
    await t.mutation(api.resumeChat.clear, { sessionToken });
  }
  await expect(
    t.mutation(api.resumeChat.send, { sessionToken, prompt: "One too many" }),
  ).rejects.toThrow();
});

test("clears only the visitor's completed chat and starts a fresh thread", async () => {
  const t = setup();
  const threadId = await t.mutation(api.resumeChat.send, { sessionToken, prompt: "Hello" });
  await t.mutation(api.resumeChat.clear, { sessionToken: "b".repeat(64) });
  expect(await t.query(api.resumeChat.status, { sessionToken })).toMatchObject({ threadId });
  await expect(t.mutation(api.resumeChat.clear, { sessionToken })).rejects.toThrow(
    "wait for the current reply",
  );
  const chat = await t.run(async (ctx) => (await ctx.db.query("resumeChats").take(1))[0]!);
  await t.mutation(internal.resumeChat.finish, {
    chatId: chat._id,
    messageId: chat.pendingMessageId!,
  });
  await t.mutation(api.resumeChat.clear, { sessionToken });
  expect(await t.query(api.resumeChat.status, { sessionToken })).toBeNull();
  await expect(
    t.query(api.resumeChat.messages, {
      sessionToken,
      threadId,
      paginationOpts: { cursor: null, numItems: 20 },
    }),
  ).rejects.toThrow("Conversation not found");
  await t.mutation(api.resumeChat.clear, { sessionToken });
  const nextThread = await t.mutation(api.resumeChat.send, { sessionToken, prompt: "Start again" });
  expect(nextThread).not.toBe(threadId);
});

test("global burst limits still apply when visitors create new sessions", async () => {
  const t = setup();
  for (let i = 0; i < 10; i++) {
    await t.mutation(api.resumeChat.send, {
      sessionToken: i.toString(16).padStart(64, "0"),
      prompt: "Hello",
    });
  }
  await expect(
    t.mutation(api.resumeChat.send, {
      sessionToken: "f".repeat(64),
      prompt: "Hello",
    }),
  ).rejects.toThrow();
});

test("later questions reuse the thread and clear the previous error", async () => {
  const t = setup();
  const threadId = await t.mutation(api.resumeChat.send, { sessionToken, prompt: "Hello" });
  const chat = await t.run(async (ctx) => (await ctx.db.query("resumeChats").take(1))[0]!);
  await t.mutation(internal.resumeChat.finish, {
    chatId: chat._id,
    messageId: chat.pendingMessageId!,
    error: "Temporary failure",
  });
  expect(await t.mutation(api.resumeChat.send, { sessionToken, prompt: "Try again" })).toBe(
    threadId,
  );
  expect(await t.query(api.resumeChat.status, { sessionToken })).toEqual({
    threadId,
    pending: true,
  });
});
