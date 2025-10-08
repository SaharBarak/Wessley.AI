
# CLAUDE_TASKS.md

> **Role:** n8n pipeline implementor (LLM + data + 3D build)
> **Primary Goal:** Given `{brand, model, year}`, orchestrate an **n8n workflow** that:
>
> 1. **Researches** the vehicle online (web-LLM) for wiring/fuse/relay info,
> 2. **Normalizes** to a canonical electrical graph,
> 3. **Enriches** nodes safely with **GPT-powered metadata** (schema-strict, evidence-bound, confidence-gated),
> 4. **Spatializes** and **builds** a Three.js **GLB** with per-circuit grouping + rich `userData`,
> 5. **Emits** every step to a **data lake** (S3) via the **ingest** service,
> 6. Responds with `{ glbUrl, manifestUrl, viewerUrl }`.
>    **Do not:** Implement or prioritize frontend here (we already have a Next.js app elsewhere). Only return URLs.
>    **Source of truth:** This file.

---

## 0) Context: what we’re building (for Claude)

You are working inside the n8n_workflow folder of this monorepo
We are creating an **autonomous n8n pipeline** that transforms a simple vehicle descriptor (`brand, model, year`) into an explorable **3D electrical system**. The pipeline must:

* **Find & summarize** credible public information about the vehicle’s wiring (research phase).
* **Convert** sources (and/or parser output) into a **canonical graph** (`ElectroGraph@1`).
* **Enrich** each node with **LLM metadata** (strict JSON Schema, only evidence-backed, no guessing).
* **Generate** a **GLB** where every circuit is an addressable `Group("Circuit:ID")`, and components/wires have **pickable meshes** with **`userData`** (tooltips, ratings, pins, upstream/ground links).
* **Log everything** (inputs, outputs, errors, telemetry) to a **data lake** for analytics and future training.

**Quality rules**:

* LLM outputs must be **schema-valid**, **evidence-bound**, **confidence-scored**, and **gated** (low confidence → manual review).
* Every phase writes an event envelope to the lake.
* Idempotency and caching to reduce cost & duplication.
* No secrets in repo; env-driven configuration.

---

## 1) Repo layout (n8n-first)

```
/n8n-workflows/
  main.electro3d.json
  sub.research.json
  sub.normalize.json
  sub.validate.json
  sub.llm-metadata.json
  sub.spatializer.json
  sub.emit-lake-event.json
  sub.ajv-validate.json
  sub.error-handler.json
  sub.rate-limit.json
  sub.cache-lookup.json
  sub.cache-write.json

/schemas/
  EventEnvelope.schema.json
  ResearchManifest.schema.json
  ElectroGraph.schema.json
  NodeMetadata.schema.json
  ElectroGraph3D.schema.json
  Manifest.schema.json
  ViewerEvent.schema.json

/services/
  model-builder/
    package.json
    server.js
  layout/
    package.json
    server.js
  ingest/
    package.json
    server.js
    .env.example

/infra/
  docker-compose.n8n.yml
  n8n.env.example

/docs/
  acceptance.md
  runbook.md
  test-vectors.json
```

---

## 2) Environment (no secrets committed)

**`/infra/n8n.env.example`**

```
# n8n
N8N_PROTOCOL=http
N8N_HOST=localhost
N8N_PORT=5678
N8N_ENCRYPTION_KEY=changeme

# LLM + research
LLM_PROVIDER=openai
OPENAI_API_KEY=
SEARCH_API_KEY=
RESEARCH_RATE_LIMIT_RPM=20

# Services
MODEL_BUILDER_URL=http://localhost:3000
LAYOUT_URL=http://localhost:3003
INGEST_URL=http://localhost:3001

# Lake (AWS)
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=wessley-lake
S3_PREFIX=jobs
```

---

## 3) Local compose (n8n + helper services)

**`/infra/docker-compose.n8n.yml`**

```yaml
version: "3.9"
services:
  n8n:
    image: n8nio/n8n:latest
    ports: ["5678:5678"]
    env_file: ./n8n.env.example
    volumes:
      - ../n8n-workflows:/data/workflows
      - ../schemas:/data/schemas

  model-builder:
    build: ../services/model-builder
    ports: ["3000:3000"]

  layout:
    build: ../services/layout
    ports: ["3003:3003"]

  ingest:
    build: ../services/ingest
    ports: ["3001:3001"]
    env_file: ../services/ingest/.env
```

---

## 4) Main n8n flow (exact order & behavior)

**Name:** `main.electro3d`
**Webhook:** `POST /webhook/electro-3d/build`
**Body:** `{ brand, model, year, options? }`
**Headers:** optional `X-Idempotency-Key`

**Flow:**

```
Webhook
→ Function: ValidateInput (brand, model, year) + vehicleSig
→ Subflow: Research & Data Acquisition (sub.research)
→ Subflow: CacheLookup (vehicleSig) [if hit → short-circuit with cached artifact URLs]
→ Subflow: Normalize (sub.normalize) → AJV(ElectroGraph)
→ Subflow: Validate & Infer (sub.validate) → issues[]
→ Subflow: LLM Metadata Enrichment (sub.llm-metadata) → NodeMetadata (AJV, gated, cached)
→ Subflow: Spatializer (sub.spatializer) → ElectroGraph3D + manifest
→ HTTP: ModelBuilder (/build) → returns { glbUrl }
→ HTTP: Ingest (store manifest + link GLB) → curated/
→ Subflow: EmitLakeEvent at each phase
→ Response: { jobId, glbUrl, manifestUrl, viewerUrl }
```

**Global error:** any failure → `sub.error-handler` (EmitLakeEvent with `eventType='error'`) → safe JSON error.
**Rate limits:** wrap web-LLM + OpenAI calls via `sub.rate-limit`.
**Idempotency:** check `X-Idempotency-Key` or `payloadHash`; if seen, return previous artifacts.

---

## 5) Subflows (detailed)

### 5.1 `sub.research.json` — Research & Data Acquisition (web-LLM)

**Goal:** Gather public info (wiring/fuse/relay/components/circuits) to improve normalization & reduce hallucinations.

**Nodes:**

1. **Function: BuildQueries**
   Compose search strings from `{brand, model, year}` (OEM/workshop/manual domains).

2. **LLM (web-enabled): WebSearch+Summarize**
   Returns `{ sources: string[], notes: string }` (min 2 credible sources).

3. **LLM: StructuredExtract → `ResearchManifest@1`**
   Extract `components[]`, `circuits[]`, fuse/relay hints, and `confidence`.

4. **AJV Validate** against `ResearchManifest.schema.json` (fail soft).

5. **Gate: Confidence**
   If `confidence < 0.75` or `<2` sources → `requiresManualReview=true`.

6. **HTTP → Ingest**
   `POST /ingest/research` → `raw/research/{jobId}.json`.

7. **EmitLakeEvent**: `stage='raw' step='research'`.

8. **Output** to downstream (attach `researchManifest`).

### 5.2 `sub.normalize.json`

* Convert source (parser/OEM + `researchManifest`) → `ElectroGraph@1`.
* EmitLakeEvent: `stage='normalized'`.

### 5.3 `sub.validate.json`

* Graph checks (dangling, loops, essential paths), heuristics → `issues[]`.
* Fatal → error handler; else EmitLakeEvent `step='validate'`.

### 5.4 `sub.llm-metadata.json` — **GPT-powered Metadata Enrichment (safe)**

**Purpose:** For each node (fuse slots, relay sockets, connectors, splices, pins, lamps, motors, sensors, etc.) generate **strict, evidence-backed** metadata.

**Pipeline:**

1. **Function: Build Node Context** per component:

   * `node` (id, type, zone, circuits, known fields)
   * `neighborhood` (upstream fuse/relay/ground/ECU)
   * `evidence` (1–3 text snippets + refs)
   * `vehicle` signature (brand/model/year/trim/market)

2. **Split in Batches**: size **20**

3. **HTTP → OpenAI Responses API** (or provider):

   * `temperature: 0.1`, `top_p: 0.1`
   * **response_format:** JSON Schema (`NodeMetadata@1`)
   * System prompt (non-hallucination rule):

     ```
     You are an automotive wiring documentation expert. Extract structured metadata for vehicle electrical nodes.
     Use ONLY the provided evidence. If a field is not supported by evidence, set it to null and add a gap note.
     Return strict JSON matching the provided schema; no extra keys.
     ```
   * User content: the **node context** JSON.

4. **AJV Validate** result; if invalid → **Repair Prompt** once; if still invalid or `confidence<0.75` → **Manual Review** branch.

5. **Cache** hit/write (`vehicleSig:nodeId:evidenceHash`) via `sub.cache-lookup/write`.

6. **Merge** valid metadata into node:

   * attach as `userData` / glTF `extras`
   * append to `manifest.components[]`
   * EmitLakeEvent: `stage='enriched'`.

### 5.5 `sub.spatializer.json`

* Zones → 3D positions; wire **polylines**; outputs `ElectroGraph3D@1` and `manifest@1`.
* EmitLakeEvent: `stage='spatialized'`.

### 5.6 `sub.emit-lake-event.json`

* Ensures `EventEnvelope@1`: `{ eventId, jobId, ts, stage, step, eventType, payloadHash, payload }`
* Writes NDJSON via **ingest** → `raw/events/{dt}/{vehicleSig}/{uuid}.ndjson`.

### 5.7 `sub.ajv-validate.json`

* Shared AJV node: inputs `{ schemaName, json }` → throw if invalid.

### 5.8 `sub.rate-limit.json`

* Token bucket per `service` (LLM/search); backoff on 429/5xx.

### 5.9 `sub.cache-lookup.json` / `sub.cache-write.json`

* HTTP to ingest cache endpoints, keying by `vehicleSig`/`nodeId`/`evidenceHash`.

### 5.10 `sub.error-handler.json`

* Capture `{ message, node, stack }` → EmitLakeEvent(error) → safe failure JSON.

---

## 6) Schemas (generate in `/schemas`)

* **`EventEnvelope.schema.json`** — envelope for all events.
* **`ResearchManifest.schema.json`** — output of research phase:

  ```json
  {
    "$id": "ResearchManifest@1",
    "type": "object",
    "required": ["brand","model","year","sources","confidence"],
    "properties": {
      "brand":{"type":"string"},
      "model":{"type":"string"},
      "year":{"type":"integer"},
      "sources":{"type":"array","items":{"type":"string"},"minItems":1},
      "summary":{"type":"string"},
      "components":{"type":"array","items":{"type":"object"}},
      "circuits":{"type":"array","items":{"type":"object"}},
      "requiresManualReview":{"type":"boolean","default":false},
      "confidence":{"type":"number","minimum":0,"maximum":1}
    }
  }
  ```
* **`ElectroGraph.schema.json`** — canonical electrical graph.
* **`NodeMetadata.schema.json`** — **strict** schema for LLM metadata (the compact version we defined; ensure enums & required fields).
* **`ElectroGraph3D.schema.json`** — positioned nodes + routes.
* **`Manifest.schema.json`** — minimal viewer manifest (circuits/components, labels).
* **`ViewerEvent.schema.json`** — telemetry events (hover/select/trace).

*(Claude: generate all schemas with `$schema` and `$id` fields, and keep them consistent across flows.)*

---

## 7) Services (minimal, for pipeline only)

**Model Builder (`/services/model-builder/server.js`)**

* `POST /build` → input: `{ graph3d, manifest, jobId }` → output: `{ glbUrl }`
* **Group** per circuit: `Group("Circuit:<ID>")`
* Pickable meshes with **`userData`** from merged `NodeMetadata`.

**Layout (`/services/layout/server.js`)**

* `POST /positions` → zone → 3D coords
* `POST /routes` → path planning for wires (polyline arrays)

**Ingest (`/services/ingest/server.js`)**

* `POST /events` — append NDJSON to `raw/events/...`
* `POST /research` — write `raw/research/{jobId}.json`
* `POST /viewer` — write `analytics/viewer_events/{dt}/...`
* `GET/PUT /cache/:key` — tiny KV for LLM metadata caching
* All S3 writes use env: `S3_BUCKET`, `S3_PREFIX`, `AWS_REGION`, creds from environment.

---

## 8) Lake writing policy (S3 prefixes)

```
raw/events/{dt}/{vehicleSig}/{uuid}.ndjson
raw/research/{jobId}.json
normalized/electrograph/{jobId}.json
enriched/node_metadata/{jobId}.json
spatialized/electrograph3d/{jobId}.json
curated/models_glb/{jobId}.glb
curated/manifests/{jobId}.json
analytics/viewer_events/{dt}/{uuid}.ndjson
```

> All writes go **through ingest** (no direct S3 from n8n).

---

## 9) Prompts & OpenAI call (drop-in)

**System prompt (LLM metadata):**

```
You are an automotive wiring documentation expert. Extract structured metadata for vehicle electrical nodes.
Use ONLY the provided evidence. If a field is not supported by evidence, set it to null and add a gap note.
Prefer OEM terminology. Return strict JSON that matches the provided JSON Schema, with no extra keys.
```

**Responses API body (example):**

```json
{
  "model": "gpt-4.1",
  "temperature": 0.1,
  "top_p": 0.1,
  "response_format": { "type": "json_schema", "json_schema": { /* NodeMetadata schema here */ } },
  "input": [
    { "role": "system", "content": "<system prompt above>" },
    { "role": "user", "content": "<node-context JSON string>" }
  ]
}
```

**Repair loop:** If AJV fails, send the invalid JSON + schema back with “repair to valid schema” instruction (1 attempt).

**Gate:** If `confidence < 0.75` or `gaps.length > 2`, route item to Manual Review branch (EmitLakeEvent + queue).

---

## 10) Acceptance (write `/docs/acceptance.md`)

* `/webhook/electro-3d/build` → returns `{ glbUrl, manifestUrl, viewerUrl }`.
* `raw/research/{jobId}.json` exists; `sources.length>=2`; `confidence` present.
* `ElectroGraph@1`, `NodeMetadata@1`, `ElectroGraph3D@1`, `Manifest@1` all AJV-valid.
* GLB has `Group("Circuit:*")`; pickable meshes have `userData` (metadata present).
* Events written for each stage; error path writes error event.
* Cache hit avoids re-calling LLM for identical evidence hash.
* Idempotency returns same artifact URLs for same key/payload.

*(Claude: generate `docs/runbook.md` and `docs/test-vectors.json` with 2–3 sample vehicles.)*

---

## 11) Local run

```bash
# 1) start services + n8n
docker compose -f infra/docker-compose.n8n.yml up --build -d

# 2) import all JSON flows in /n8n-workflows via n8n UI
#    set creds per /infra/n8n.env.example

# 3) trigger a build
curl -XPOST http://localhost:5678/webhook/electro-3d/build \
  -H 'Content-Type: application/json' \
  -H 'X-Idempotency-Key: demo-1' \
  -d '{"brand":"Hyundai","model":"Galloper","year":2000}'
```

---

## 12) Guardrails

* **Evidence-only** rule enforced in prompts + schema validation.
* **Confidence gating** to Manual Review.
* **Cross-check**: circuits/pins must exist in `ElectroGraph`; else add to `gaps[]`.
* **Rate limits & retries** on all LLM/search calls.
* **All phases** emit events to lake with `payloadHash` for dedupe.
* **No secrets** in repo.

---

### Deliverables checklist (Claude, mark done)

* [ ] `/n8n-workflows/*.json` — all subflows wired exactly as specified
* [ ] `/schemas/*.schema.json` — all JSON Schemas with `$id` and required fields
* [ ] `/services/*/server.js` — minimal endpoints implemented
* [ ] `/infra/docker-compose.n8n.yml` + `/infra/n8n.env.example`
* [ ] `/docs/acceptance.md`, `/docs/runbook.md`, `/docs/test-vectors.json`
* [ ] End-to-end run produces valid GLB/manifest and lake events

---

**End of file**
