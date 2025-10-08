# CLAUDE.md – Wessley.ai

## 📦 Project Overview

You are Claude Code operating inside the `wessley.ai` monorepo.
Your job is to build a webapp that:

* Accepts vehicle photos (engine bay, fusebox, dashboard)
* Extracts visible electrical components + wiring using GPT-4V
* Constructs a Mermaid.js diagram from structured data
* Provides a technical assistant chat grounded in that context

## ✅ Absolute Rules

* All GPT-4V calls must be prompt-engineered and abstracted in `/api/analyzeImage.ts`
* All diagram logic must generate Mermaid syntax only — no SVG drawing
* No backend unless image processing requires it — client-first architecture
* Authentication must be via Google OAuth (Firebase or client-only)
* Context for chat must be persisted in `useVehicleContext.ts` and enriched progressively
* User interactions should never result in GPT prompts that lack diagram state
* Mermaid rendering must be interactive (node-click → right panel with info)
* Use `Zustand` for state, `React` with `Tailwind`, `shadcn/ui` components
* Host on Vercel; if backend is used, use Railway or Cloudflare Workers

## 🛠 Tech Stack

| Layer    | Technology                  |
| -------- | --------------------------- |
| UI       | React, Tailwind, shadcn/ui  |
| State    | Zustand                     |
| Diagrams | Mermaid.js                  |
| Auth     | Google OAuth (client-only)  |
| AI Model | GPT-4 Vision API (OpenAI)   |
| Hosting  | Vercel + (optional) Railway |

## 🚧 Project Milestones / PRs

You will create PRs in the following order:

* PR1: Workspace setup, Tailwind, Zustand, UI shell
* PR2: Google OAuth + `useVehicleContext.ts`
* PR3: Image upload flow + preview
* PR4: GPT-4V integration for component detection (`/api/analyzeImage.ts`)
* PR5: Mermaid diagram generation and rendering (`/DiagramViewer.tsx`)
* PR6: Context-aware chat assistant (`/ChatBox.tsx`, `/api/askChat.ts`)
* PR7: In-diagram node selection (click → explanation)
* PR8: Export + save: localStorage and optional PDF

Each PR must:

* Contain a `Roadmap:` section
* Include unit tests or mock flows for GPT endpoints
* Explicitly log which component props/state were changed
* Add stories or mock data for all component logic (even temporary)

## 🧠 Prompt Grounding (for GPT-4V)

All prompts for `analyze-image` must:

* Request JSON with `components[]` including ID, label, wires[], and notes
* Wire objects must contain: `to`, `gauge`, `color`
* Be aware of relative wire direction + thickness in image
* Use terminology grounded in automotive wiring diagrams

## 🧪 Example Prompt

```
You are an expert in vehicle electronics. Given this engine bay photo:
1. Identify all visible electrical components (relays, fuses, sensors, connectors)
2. For each, list the wires you see exiting it (estimate gauge, color, and direction)
3. Output JSON like:
{
  components: [
    {
      id: "main_fuse",
      label: "Main 60A Fuse",
      wires: [
        { to: "starter", gauge: "6mm²", color: "red" }
      ],
      notes: "Mounted near battery positive terminal"
    },
    ...
  ]
}
```

## 🧱 Do / Don’t

**✅ Do:**

* Write everything client-first unless image preprocessing mandates server
* Use interactive Mermaid elements, not static diagrams
* Pre-fill chat with context from diagram
* Use image filenames to retain association (e.g., IMG_1234 → parsed JSON)

**🚫 Don’t:**

* Don’t call GPT chat without including the latest diagram
* Don’t hardcode diagram strings – always generate from JSON
* Don’t allow unauthenticated users to persist anything

## 🔚 Completion Criteria

This system is considered production-ready when:

* A user can upload photos and get a functional diagram
* Nodes are clickable and open a side panel
* Chat responds with targeted advice referencing wiring context
* Diagram and chat remain in sync with session context
* All flows are tested with sample images + JSON mocks
* Users can export or save diagram + chat as PDF
