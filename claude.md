# CLAUDE.md – Fusebox.ai

## 📦 Project Overview

You are Claude Code operating inside the `fusebox.ai` monorepo.
Your job is to build a webapp that:

* Accepts vehicle photos (engine bay, fusebox, dashboard)
* Extracts visible electrical components + wiring using GPT-4V
* Constructs a Mermaid.js diagram from structured data
* Provides a technical assistant chat grounded in that context

## ✅ Absolute Rules

* All GPT-4V and OpenAI calls go through the backend
* API keys must never be exposed in frontend bundles
* Use monorepo structure with `/apps/web` and `/apps/api`
* Prompt logic lives in `/apps/api/services/`
* All wiring JSON must follow the defined schema in `/packages/types`
* All frontend state flows through Zustand
* Mermaid diagrams must be generated from backend JSON (not manually constructed)
* Use Tailwind + shadcn/ui for consistent styling
* All libraries must be resolved and documented, use context7 (resolve-library-id + get-library-docs)

## 🛠 Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| UI       | React, Tailwind, shadcn/ui       |
| State    | Zustand                          |
| Diagrams | Mermaid.js                       |
| Auth     | Google OAuth (client-only)       |
| AI Model | GPT-4 Vision API (OpenAI)        |
| Backend  | FastAPI or Node.js (proxy layer) |
| Hosting  | Vercel (web) + Railway (api)     |
| Secrets  | `.env` (never committed)         |

## 🧱 Project Milestones / PRs

You will create PRs in the following order:

* PR1: Monorepo setup with TurboRepo, Tailwind, Zustand, Google OAuth stub
* PR2: Upload component + preview UI + Zustand storage
* PR3: API route `/analyze-image` + GPT-4V prompt + basic image-to-JSON
* PR4: Mermaid diagram generation from JSON + rendering component
* PR5: Chat interface + `/ask-chat` API + context-enriched GPT prompts
* PR6: Node selection → side panel wiring view
* PR7: Export to PDF with diagram + chat + summary
* PR8: Garage view with recent projects, per-user history (optional)

Each PR must:

* Include a `Roadmap:` section in description
* Link updated wiring/component schemas
* List all props/state affected
* Include mock data files and at least one testable end-to-end image flow

## 🧠 GPT-4V Prompt Guide (for /analyze-image)

Prompts sent to GPT-4V must:

* Ask for all visible relays, fuses, terminals, sensors
* Estimate wire gauge (mm²) and color if visible
* Output `components[]` with id, label, wires[], notes

### Example Prompt

```txt
You are an expert automotive electrician. Given this vehicle image:
1. Identify visible components (starter, relays, fusebox, sensors)
2. For each component, list wires exiting it — include destination (if visible), wire gauge and color
3. Return data as JSON:
{
  components: [
    {
      id: "main_fuse",
      label: "Main 60A Fuse",
      wires: [
        { to: "starter", gauge: "6mm²", color: "red" }
      ],
      notes: "mounted near battery +"
    }
  ]
}
```

## 🔐 Key Handling

* All secrets live in `.env` and loaded via `dotenv`
* Backend is the only layer with access to `OPENAI_API_KEY`
* `.env` is git-ignored and must be configured per environment (local, staging, prod)

## 📤 Deployment

* Web: `apps/web` → deploy to Vercel
* API: `apps/api` → deploy to Railway or Cloudflare Workers

## ✅ Completion Criteria

* Users can upload a photo → see interactive diagram
* Clicking any node shows its wire context
* Asking a question gives a relevant, context-aware response
* All GPT keys protected in backend
* Diagram state persisted during session
* No client prompt ever leaves without diagram JSON attached

See `README.md` for dev instructions and `PRD` for product scope.
