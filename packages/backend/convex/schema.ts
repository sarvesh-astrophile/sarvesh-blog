import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Messages and streaming deltas belong to the Agent component, not this table.
  resumeChats: defineTable({
    sessionHash: v.string(),
    threadId: v.string(),
    pendingMessageId: v.optional(v.string()),
    error: v.optional(v.string()),
  }).index("by_sessionHash", ["sessionHash"]),
});
