# 🧰 Wessley.ai

AI-powered web app for reverse engineering vehicle electrical systems using photos.

---

## ✨ Features

* Upload engine bay / fusebox / dash photos
* Detect relays, wires, gauges, colors using GPT-4 Vision
* Generate interactive Mermaid wiring diagrams
* Ask tech questions to a chat assistant grounded in your actual diagram
* Fully client-first UI + secure backend for GPT-4 / Claude API routing

---

## 🧱 Monorepo Structure

```
/apps
  /web        → React + Tailwind + Zustand frontend
  /api        → FastAPI (Python) or Node.js backend
/packages
  /types      → Shared component/wiring type definitions
  /schemas    → Zod (frontend) and Pydantic (backend) contracts
.env          → Never committed; holds OpenAI API keys, Firebase config, etc.
```

---

## 🚀 Getting Started

### 1. Clone and install:

```bash
git clone git@github.com:wessley-ai/wessley.git
cd wessley
pnpm install  # uses workspaces
```

### 2. Setup your `.env`

```bash
# .env (DO NOT COMMIT THIS)
OPENAI_API_KEY=sk-...
FIREBASE_API_KEY=...
FIREBASE_PROJECT_ID=...
```

### 3. Start dev servers

```bash
pnpm dev:web     # starts frontend (Vite or Next.js)
pnpm dev:api     # starts backend (FastAPI or Node)
```

---

## 🛠 Tech Stack

| Area       | Technology                   |
| ---------- | ---------------------------- |
| Frontend   | React + Zustand + Tailwind   |
| Diagrams   | Mermaid.js                   |
| Auth       | Google OAuth (client-side)   |
| AI Backend | GPT-4V via OpenAI API        |
| Server     | FastAPI (or Node alt)        |
| Hosting    | Vercel (web) + Railway (api) |

---

## 🔐 API Keys & Security

* All keys stored in `.env` (never in code)
* Backend acts as secure proxy for OpenAI, Claude, Firebase
* Client never touches secrets directly

---

## 📦 Commands (via Turbo or pnpm)

```bash
pnpm dev:web       # Start frontend locally
pnpm dev:api       # Start backend API
pnpm lint          # Check code style
pnpm build         # Full project build
```

---

## 📬 Contributions

PRs welcome. Please keep commits atomic and document logic-heavy modules.

See `CLAUDE.md` for agent-based architecture and PR roadmap.

---

## 🧑‍🔧 Maintainers

* [@yourname](https://github.com/yourname)
* [@claude-code](https://claude.ai)

---

## 📄 License

MIT
