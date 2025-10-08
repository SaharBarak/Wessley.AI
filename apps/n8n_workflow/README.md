# N8N Electrical 3D Pipeline

**An autonomous n8n workflow system that transforms vehicle specifications (`brand, model, year`) into explorable 3D electrical systems.**

## 🎯 Overview

This n8n pipeline orchestrates the complete transformation from simple vehicle descriptors to rich 3D electrical diagrams:

1. **Research Phase**: Web-LLM powered research for vehicle-specific wiring/fuse/relay information
2. **Normalization**: Convert sources into canonical electrical graph (`ElectroGraph@1`)
3. **Enrichment**: GPT-powered metadata enhancement with strict schema validation
4. **Spatialization**: Generate 3D positioned electrical graph (`ElectroGraph3D@1`)
5. **3D Building**: Create Three.js GLB with pickable meshes and rich `userData`
6. **Data Lake**: Log all steps to S3 for analytics and training

## 🏗️ Architecture

```
Vehicle Input → Research → Normalize → Validate → Enrich → Spatialize → 3D Build → URLs
     ↓              ↓         ↓         ↓        ↓         ↓           ↓
  Data Lake    Data Lake  Data Lake  Data Lake Data Lake Data Lake  Data Lake
```

### Core Components

- **Main Pipeline**: `main.electro3d.json` - orchestrates the entire flow
- **Subflows**: 10 specialized workflows for specific tasks
- **Microservices**: 3 supporting services (model-builder, layout, ingest)
- **Schemas**: 7 JSON schemas for strict data validation
- **Infrastructure**: Docker Compose setup with n8n + services

## 🚀 Quick Start

```bash
# 1. Start all services
docker compose -f infra/docker-compose.n8n.yml up --build -d

# 2. Configure n8n (import workflows from /n8n-workflows)
# Set credentials per /infra/n8n.env.example

# 3. Trigger a build
curl -XPOST http://localhost:5678/webhook/electro-3d/build \
  -H 'Content-Type: application/json' \
  -H 'X-Idempotency-Key: demo-1' \
  -d '{"brand":"Hyundai","model":"Galloper","year":2000}'
```

**Expected Response:**
```json
{
  "jobId": "uuid",
  "glbUrl": "https://s3.../curated/models_glb/{jobId}.glb",
  "manifestUrl": "https://s3.../curated/manifests/{jobId}.json",
  "viewerUrl": "https://wessley.ai/viewer/{jobId}"
}
```

## 📁 Project Structure

```
/n8n-workflows/           # n8n workflow definitions
  main.electro3d.json     # Main orchestration workflow
  sub.*.json              # 10 specialized subflows

/schemas/                 # JSON Schema definitions
  EventEnvelope.schema.json
  ResearchManifest.schema.json
  ElectroGraph.schema.json
  NodeMetadata.schema.json
  ElectroGraph3D.schema.json
  Manifest.schema.json
  ViewerEvent.schema.json

/services/                # Supporting microservices
  model-builder/          # GLB generation service
  layout/                 # 3D positioning service
  ingest/                 # Data lake writing service

/infra/                   # Infrastructure setup
  docker-compose.n8n.yml  # Complete stack definition
  n8n.env.example         # Environment template

/docs/                    # Documentation
  acceptance.md           # Acceptance criteria
  runbook.md              # Operations guide
  test-vectors.json       # Sample test data
```

## 🔄 Pipeline Flow Details

### Main Workflow: `main.electro3d`
**Endpoint**: `POST /webhook/electro-3d/build`

1. **Input Validation**: Validate `{brand, model, year}` + generate `vehicleSig`
2. **Cache Check**: Look for existing artifacts (idempotency)
3. **Research**: Web-LLM powered vehicle research
4. **Normalize**: Convert to canonical `ElectroGraph@1`
5. **Validate**: Graph integrity checks
6. **Enrich**: GPT metadata enhancement (evidence-bound, confidence-gated)
7. **Spatialize**: 3D positioning and routing
8. **Build**: Generate GLB with Three.js
9. **Store**: Write to data lake
10. **Response**: Return artifact URLs

### Key Subflows

- **`sub.research`**: Web research with confidence scoring
- **`sub.llm-metadata`**: Safe GPT enrichment with schema validation
- **`sub.spatializer`**: 3D coordinate assignment
- **`sub.emit-lake-event`**: Structured logging to S3
- **`sub.error-handler`**: Centralized error management

## 🛡️ Safety & Quality

### LLM Safety
- **Evidence-only prompts**: No hallucination allowed
- **Strict schema validation**: AJV validation at every step
- **Confidence gating**: Low confidence → manual review
- **Repair loops**: Automatic JSON repair attempts
- **Rate limiting**: Token bucket per service

### Data Integrity
- **Idempotency**: Same input → same output URLs
- **Event logging**: Complete audit trail in data lake
- **Schema versioning**: All schemas have `$id` and version
- **Error recovery**: Graceful failures with structured error events

## 🔧 Services

### Model Builder (`localhost:3000`)
- `POST /build` - Generate GLB from `ElectroGraph3D`
- Creates pickable meshes with `userData`
- Groups circuits as `Group("Circuit:<ID>")`

### Layout Service (`localhost:3003`)
- `POST /positions` - Zone to 3D coordinate mapping
- `POST /routes` - Wire path planning (polylines)

### Ingest Service (`localhost:3001`)
- `POST /events` - Append NDJSON events to S3
- `POST /research` - Store research manifests
- `GET/PUT /cache/:key` - LLM metadata caching

## 📊 Data Lake Structure

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

## 🎯 Acceptance Criteria

- ✅ Returns `{glbUrl, manifestUrl, viewerUrl}` for valid input
- ✅ Research phase produces ≥2 credible sources with confidence score
- ✅ All schemas validate with AJV
- ✅ GLB contains grouped circuits with pickable meshes
- ✅ Complete event trail in data lake
- ✅ Idempotency works correctly
- ✅ Error handling produces structured error events

## 🔑 Environment Setup

Copy `/infra/n8n.env.example` and configure:

```env
# n8n
N8N_ENCRYPTION_KEY=your-secret-key

# LLM & Research
OPENAI_API_KEY=your-openai-key
SEARCH_API_KEY=your-search-key

# AWS Data Lake
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
S3_BUCKET=wessley-lake
```

## 📋 Development Status

This is a complete implementation plan ready for development. See the PR plan below for implementation phases.

---

## 🚧 Implementation Roadmap

**Current Status**: 📋 Planning Phase Complete - Ready for Implementation

**Next Step**: Begin PR1 - Foundation Setup