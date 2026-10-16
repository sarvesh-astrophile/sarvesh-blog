# sarvesh-blog

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Convex, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Better-Auth
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Vite+** - Unified Vite toolchain, workspace task runner, linting, and formatting

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
bun run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy environment variables from `packages/backend/.env.local` to `apps/*/.env`.

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.

The root `dev`, `dev:web`, and `dev:server` scripts disable Node's network-family
autoselection to avoid Convex connection timeouts on this development network.
They preserve any existing `NODE_OPTIONS`; no extra startup flag is needed.

## Resume assistant

Submitting the homepage question opens a modal shadcn drawer on the right with a backdrop
and trapped focus. Escape, an outside press, or the close button dismisses it. There is no
separate Continue conversation link; submitting another question reopens the drawer.
The header's **Clear chat** action resets the conversation and input, and queues deletion
of the old Agent thread, messages, and streams. It is disabled during generation and does
not reset the visitor's rate limits.
The drawer uses the shared Message Scroller, Message, Bubble, Input Group, and Trace components.
Assistant replies use the lazy-loaded shared `Markdown` component (`Streamdown`), with
streaming-safe formatting and existing shadcn Code Blocks for fenced code. User messages
remain plain text, and raw HTML is disabled in assistant replies.

### Give the assistant context

Edit **`packages/backend/convex/resumeContext.ts`**. It contains the assistant's only factual
source, initially populated with facts already on the homepage. Add your verified skills,
project details, education, contact information, and pricing there. Don't put secrets in it.
Unknown details are explicitly marked as missing; the prompt instructs the model not to invent
answers. This is prompt-based grounding, not a guarantee of factual accuracy.
Context changes take effect on the next reply after syncing/deploying Convex.

### Configure the model

The assistant uses **Convex AI Gateway**, which manages provider credentials and authenticates
each action with a short-lived deployment token. No OpenAI or Anthropic API key is needed.
Your Convex team must be on a paid plan with gateway access. Use a Convex Cloud deployment
or a current local deployment linked to your project; anonymous local and self-hosted
deployments cannot use the gateway. Team spending limits also apply.

Run `bun run dev:server` to sync the components, schema, and functions. The default model is
**`anthropic/claude-sonnet-4.5`**. Optionally set **`RESUME_CHAT_MODEL`** in the Convex dashboard
to another supported gateway model ID, including its provider prefix (for example,
`openai/gpt-5-mini`). This is a server-only Convex deployment variable, not a `VITE_*` variable.
Production also needs the Convex backend deployed (run `bunx convex deploy` from
`packages/backend`); the Alchemy web deployment does not deploy Convex functions.
See the [gateway setup documentation](https://docs.convex.dev/ai-gateway/setup).

Convex Agent stores messages and stream deltas. `resumeChats` stores only the thread ID,
hashed anonymous session credential, pending request, and any recoverable error. The browser
keeps its bearer credential in session storage, so reloads in the same tab resume the chat.
No sign-in is needed; every message/stream read verifies the credential. A new tab/session
usually starts a new conversation. Stored histories currently have no automatic expiry.

Server-side transactional limits use `@convex-dev/rate-limiter`: 6 questions/minute per
session (burst of 3), 30/minute globally (burst of 10), and 300/day globally. Anonymous
sessions can be recreated, so the global limits protect the model budget as well.
Questions are capped at 2,000 characters and replies at 700 output tokens.
Generation runs in a scheduled internal action with a timeout and no automatic paid-call retries;
a separate Workflow component isn't needed for this single-response flow.

Run backend tests with `bun run --cwd packages/backend test`. Tests use convex-test and
mock generation; they don't call the AI Gateway or a model provider.

The AI SDK is pinned to the version used by the gateway provider to avoid incompatible
provider types. Check compatibility when upgrading the Agent or gateway provider.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@sarvesh-blog/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Environment Configuration

Each app owns its environment schema in `.env.schema`. Varlock generates `src/env.ts` during installation; run `bun run env:generate` after changing a schema. Commit schemas, and keep secrets in ignored env files or your deployment platform.

Import the generated `ENV` accessor in application code. Shared database and auth packages receive configuration or initialized clients from the application. See [Varlock's monorepo guide](https://varlock.dev/guides/monorepos/).

For Cloudflare, Alchemy loads and validates deployment inputs with `varlock/auto-load` in its Node/Bun deployment process. Worker code reads native bindings; web clients use the framework's public env API through `src/env.public.ts` where needed. Alchemy supplies resource URLs and managed database credentials. In-Worker Varlock protections are deferred until an official Alchemy integration is available; see [the non-Wrangler deployment guidance](https://varlock.dev/integrations/cloudflare/#non-wrangler-deploy-tools-alchemy-sst-pulumi).

Bun's automatic env loading is disabled in `bunfig.toml`; the framework integration or server bootstrap loads Varlock. Node deployments must include Varlock and its dependencies alongside the app schema.

Run standalone Node/Bun tools that use Varlock from the owning app directory so they load that app's schema and env files. `env:generate` only generates TypeScript files; it does not initialize environment values in a subsequent command.

## Deployment

### Alchemy

- Target: web on Cloudflare
- Configure provider accounts: `cd packages/infra && bunx alchemy profile edit`
- Dev: bun run dev:infra
- Deploy: bun run deploy
- Destroy: bun run destroy

`alchemy profile edit` stores the selected Axiom, Cloudflare, Neon, PlanetScale, and/or Prisma provider profiles under `~/.alchemy`; no provider-specific setup command is required by this scaffold.

Deploys are staged and default to a personal `dev_<username>` stage. For production, run the deploy with an explicit stage from `packages/infra`:

```bash
cd packages/infra && bunx alchemy deploy --stage production
```

## Git Hooks and Formatting

- Optional native Vite+ hooks: `bun run hooks:setup`
- Docs: [Vite+ commit hooks](https://viteplus.dev/guide/commit-hooks)
- Run checks: `bun run check`

## Project Structure

```
sarvesh-blog/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Start)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── backend/     # Convex backend functions and schema
```

## Available Scripts

- `bun run dev`: Start the Vite web app and Convex backend in parallel
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the Convex backend
- `bun run dev:infra`: Start Alchemy development for the Cloudflare deployment
- `bun run dev:setup`: Setup and configure your Convex project
- `bun run check-types`: Check TypeScript types across all apps
- `bun run check`: Run Vite+ format/lint checks and workspace TypeScript checks
- `bun run lint`: Run Vite+ lint checks
- `bun run format`: Run Vite+ formatting
- `bun run staged`: Run Vite+ checks against staged files
- `bun run hooks:setup`: Install Vite+ native Git hooks with `vp config`
