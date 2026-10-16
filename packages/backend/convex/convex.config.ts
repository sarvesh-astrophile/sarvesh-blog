import betterAuth from "@convex-dev/better-auth/convex.config";
import agent from "@convex-dev/agent/convex.config";
import rateLimiter from "@convex-dev/rate-limiter/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    RESUME_CHAT_MODEL: v.optional(v.string()),
  },
});
app.use(betterAuth);
app.use(agent);
app.use(rateLimiter);

export default app;
