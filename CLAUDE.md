# CLAUDE.md

<!-- BEGIN:aixyz-agent-rules -->

# aixyz: ALWAYS read docs before coding

Before any aixyz work, find and read the relevant doc in `node_modules/aixyz/docs/`.
And you can read `node_modules/aixyz/examples/` for examples that you can reference.
Your training data is outdated — the docs are the source of truth.

<!-- END:aixyz-agent-rules -->

## Project Overview

Monorepo for AI security agents deployed on **[aixyz.sh](https://aixyz.sh)**, using Bun workspaces and Turborepo for orchestration.
All agents are built with the **aixyz** framework and deployed to **Railway** (production) using Docker.

### Key Skills (Claude Code)

Use these skills to understand and work with the framework:

- `/aixyz` — The agent SDK/framework for building agents
- `/use-agently` — How to test agents via the Agently marketplace

### Learning-by-Example

When creating new agents, **always study existing agents first**. Look at how they are structured, how pricing is set, how tools are defined, and replicate the patterns. Improve on them where possible.
ALWAYS USE create-aixyz-app TO GENERATE NEW AGENTS TO ENSURE CONSISTENCY!
DO NOT copy-paste code without understanding it.
If you don't understand how an agent works, ask for clarification or review the aixyz documentation and existing agents until you do.

## Commands

```bash
bun install                              # Install dependencies
bun turbo run build                      # Build all agents
bun turbo run dev                        # Dev mode (watches for changes)
bun turbo run build --filter=<agent>     # Build a specific agent
bun turbo run dev --filter=<agent>       # Dev a specific agent
bun run format                           # Format code (prettier)
```

### Testing with use-agently (THIS IS A MUST, DO NOT SKIP THIS)

Start a local dev server first, then use `use-agently` to test:

```bash
# Start agent locally on a random port (always use --port with a random number, never default 3000)
bun turbo run dev --filter=@agents/<name> -- --port 3847

# A2A: send a message (for real LLM agents)
use-agently a2a send --uri http://localhost:3847 -m "your message" --pay

# A2A: fetch agent card
use-agently a2a card --uri http://localhost:3847

# MCP: list available tools
use-agently mcp tools --uri http://localhost:3847/mcp

# MCP: call a specific tool (for fake-model / tool-only agents)
use-agently mcp call --uri http://localhost:3847/mcp --tool <tool-name> --args '{"key":"value"}' --pay
```

> **Note:** `use-agently` is a global CLI — do NOT prefix with `bun`. Always start dev servers with `--port <random>` to avoid port conflicts.

**Important:** Fake-model agents only work via MCP tool calls. A2A messages will just return the help text. Always use `--pay` to authorize payment when testing paid tools.

## Architecture

```
agents/              # Headless agents (no UI, API-only)
packages/            # Shared packages
```

- **agents/** — Headless agents. No UI, just an aixyz A2A endpoint deployed to Railway.

Workspaces are defined in root `package.json`: `agents/*`, `packages/*`.

### Agent Structure (aixyz framework)

Each agent under `agents/` follows this structure:

- `aixyz.config.ts` — Agent metadata: name, description, version, x402 payment config, and **skills** (each skill has an id, name, description, tags, and examples that guide callers on how to use the agent)
- `app/agent.ts` — Main agent entry point. Exports a default `ToolLoopAgent` and an `accepts` config for pricing
- `app/erc-8004.ts` — ERC-8004 on-chain registration metadata (required — always include when creating agents)
- `app/tools/` — Optional directory for custom tool definitions (using `tool()` from `ai` SDK)
- `Dockerfile` — Railway deployment config (standalone Bun build)
- `package.json` — Agent-specific dependencies; build/dev via `aixyz build` / `aixyz dev`

### Key Dependencies

- **ai** (v6) — Vercel AI SDK: `ToolLoopAgent`, `tool`, `stepCountIs`
- **zod** (v4) — Schema validation for tool inputs/outputs
- **aixyz** — Agent framework handling build, dev server, and deployment

## Agent Design Patterns

### Fake model for tool-only agents

Agents that don't require reasoning (MCP-focused, API wrappers) should use `fake(() => help)` from `aixyz/model` instead of a real LLM. The A2A endpoint returns a help message directing callers to use the MCP tools. No LLM provider dependencies needed, zero LLM cost.

```ts
// app/agent.ts — fake model pattern
import { fake } from "aixyz/model";

const help = `This agent provides the following MCP tools:
- \`tool-name\`: Description of what it does`;

export default {
  model: fake(() => help),
  tools: { ...tools },
} satisfies ToolLoopAgent;
```

### Tool name casing

Tool names are derived from their file names in `app/tools/`. Always use **kebab-case** file names (e.g. `web-search.ts`, `find-content.ts`, `deep-scan.ts`). When referencing tools in help text, use the same kebab-case names.

### stepCountIs limits

Use `stopWhen: stepCountIs(N)` to cap LLM loop iterations and prevent runaway costs/timeouts:

- **5** — Single-purpose agents
- **10** — Standard agents
- **15** — Multi-step agents
- **16** — Complex multi-tool agents

### Response Formats

- Default to **Markdown** responses (tables, bullet points)
- Support **JSON** output when the caller requests it
- Use Markdown tables for structured data (search results, price data)

## Code Style

- Pre-commit hook (husky + lint-staged) auto-formats staged files via Prettier
- TypeScript: strict mode, ESNext target, bundler module resolution
- Prettier: 120 char line width, prettier-plugin-packagejson
