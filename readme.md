# Wessley.ai: Automotive Intelligence Platform

**Multi-Modal AI System for Vehicle Electrical Analysis and Community Discovery**

I'm building an automotive diagnostics platform that integrates computer vision, deep learning, and knowledge graph technologies. Wessley.ai uses convolutional neural networks (CNNs), vector databases, and large language models for vehicle electrical system analysis while providing a collaborative community for automotive professionals and enthusiasts.

---

## ✨ Core Features

### Deep Learning Vehicle Analysis
* **Computer Vision Pipeline** - Photo upload system designed for convolutional neural network processing with planned OCR and component detection capabilities
* **Knowledge Graph Architecture** - Neo4j database integration with vector embedding infrastructure for automotive electrical component relationships
* **3D Model Generation** - Framework for converting 2D vehicle photos into interactive 3D electrical system representations using computer vision algorithms
* **AI Chat Interface** - Natural language processing system with planned integration to vehicle-specific electrical data and technical knowledge base

### Social Platform Architecture
* **Workspace-Centric Design** - Database schema supporting project-based vehicle workspaces with comprehensive data models
* **Social Infrastructure** - Complete database foundation for user interactions, follows, likes, comments, and content sharing
* **Community Features** - Planned Pinterest-style discovery feed for automotive projects and electrical modifications
* **Collaboration Tools** - Framework for sharing diagnostics, repairs, and technical documentation within the community

### Financial & Marketplace Infrastructure
* **Expense Tracking System** - Database schema with AI-powered categorization for parts, labor, and maintenance costs
* **Marketplace Foundation** - Complete data models for parts catalog, supplier integration, and transaction processing
* **Budget Management** - Project-level financial tracking with expense allocation and reporting capabilities

### Data Architecture
* **Hybrid Database Design** - Supabase for application data with Neo4j integration for electrical system graphs
* **Vehicle Signature System** - Unique identifiers linking web application data to specialized AI services
* **Row-Level Security** - Multi-tenant data isolation with comprehensive access control policies

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
