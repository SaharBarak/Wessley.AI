# Acceptance Criteria - N8N Electrical 3D Pipeline

This document defines the acceptance criteria for the complete n8n workflow system.

## 🎯 Primary Acceptance Criteria

### 1. End-to-End Pipeline Success
- **AC-001**: POST to `/webhook/electro-3d/build` with valid `{brand, model, year}` returns `{jobId, glbUrl, manifestUrl, viewerUrl}` 
- **AC-002**: Pipeline completes within 5 minutes for typical vehicle
- **AC-003**: All intermediate artifacts are written to data lake with proper structure

### 2. Research Phase Quality
- **AC-004**: Research produces minimum 2 credible sources with URLs
- **AC-005**: Research manifest includes confidence score ≥ 0.75 for automatic processing
- **AC-006**: Low confidence items (< 0.75) trigger manual review queue
- **AC-007**: Research manifest validates against `ResearchManifest@1` schema

### 3. Schema Validation
- **AC-008**: All schemas validate with AJV without errors
- **AC-009**: `ElectroGraph@1` output contains valid nodes, edges, and circuits
- **AC-010**: `NodeMetadata@1` follows evidence-only rule (no hallucinations)
- **AC-011**: `ElectroGraph3D@1` contains valid 3D positions and routing
- **AC-012**: `Manifest@1` enables interactive viewer functionality

### 4. GLB Model Quality  
- **AC-013**: Generated GLB loads successfully in Three.js viewer
- **AC-014**: All circuits grouped as `Group("Circuit:<ID>")`
- **AC-015**: Components have pickable meshes with `userData`
- **AC-016**: Wire routes are geometrically reasonable polylines
- **AC-017**: Model respects vehicle bounding box constraints

### 5. Data Lake Integrity
- **AC-018**: Complete event trail written for every pipeline run
- **AC-019**: Events follow `EventEnvelope@1` schema exactly
- **AC-020**: S3 structure matches specification:
  ```
  raw/events/{dt}/{vehicleSig}/{uuid}.ndjson
  raw/research/{jobId}.json
  normalized/electrograph/{jobId}.json
  enriched/node_metadata/{jobId}.json
  spatialized/electrograph3d/{jobId}.json
  curated/models_glb/{jobId}.glb
  curated/manifests/{jobId}.json
  ```

### 6. Error Handling
- **AC-021**: Pipeline failures write structured error events to data lake
- **AC-022**: Error handler captures `{message, node, stack}` information
- **AC-023**: Rate limit failures trigger exponential backoff
- **AC-024**: Invalid JSON responses attempt repair once before failing

### 7. Performance & Caching
- **AC-025**: Idempotency key prevents duplicate expensive operations
- **AC-026**: LLM metadata caching reduces API calls by ≥ 80% for repeated vehicles
- **AC-027**: Cache hits return previous artifact URLs within 5 seconds
- **AC-028**: Rate limiting respects API provider limits

### 8. AI Safety & Quality
- **AC-029**: LLM prompts enforce evidence-only rule
- **AC-030**: Structured outputs use strict JSON schema validation
- **AC-031**: Confidence gating prevents low-quality outputs
- **AC-032**: Manual review queue captures items needing human validation

## 🧪 Test Scenarios

### Test Vehicle 1: Well-Documented Vehicle
- **Input**: `{"brand": "Toyota", "model": "Camry", "year": 2020}`
- **Expected**: High confidence research, complete pipeline success
- **Validation**: All ACs must pass

### Test Vehicle 2: Obscure Vehicle  
- **Input**: `{"brand": "Hyundai", "model": "Galloper", "year": 2000}`
- **Expected**: Lower confidence, may trigger manual review
- **Validation**: AC-006 manual review trigger works correctly

### Test Vehicle 3: Invalid Input
- **Input**: `{"brand": "", "model": "InvalidModel", "year": 1800}`
- **Expected**: Input validation failure with structured error
- **Validation**: AC-021, AC-022 error handling works

### Test Vehicle 4: Idempotency
- **Input**: Same vehicle with same idempotency key twice
- **Expected**: Second call returns cached URLs instantly
- **Validation**: AC-025, AC-027 idempotency works

## 📊 Performance Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| Pipeline Duration | < 5 minutes | End-to-end time |
| Cache Hit Response | < 5 seconds | Idempotent requests |
| Research Sources | ≥ 2 credible | Source count & validation |
| Confidence Score | ≥ 0.75 | Automatic processing threshold |
| API Cost Reduction | ≥ 80% | Via caching effectiveness |
| GLB File Size | < 50MB | Model optimization |
| Schema Validation | 100% | All artifacts valid |

## ✅ Verification Checklist

### Infrastructure
- [ ] Docker Compose starts all services without errors
- [ ] n8n UI accessible at localhost:5678
- [ ] All microservices respond to health checks
- [ ] Environment variables loaded correctly

### Schemas
- [ ] All 7 schemas validate with test data
- [ ] AJV validation works in n8n subflows
- [ ] Schema versioning (`$id`) consistent across system

### Pipeline Integration
- [ ] Main workflow imports successfully in n8n
- [ ] All subflows can be executed independently
- [ ] Webhook endpoint responds to POST requests
- [ ] Error handling produces structured failures

### Data Lake
- [ ] S3 bucket structure created correctly
- [ ] Events written in proper NDJSON format
- [ ] All artifact types stored in correct prefixes
- [ ] Cache operations work with Redis

### Quality Gates
- [ ] Confidence scoring prevents low-quality outputs
- [ ] Evidence-only rule enforced in prompts
- [ ] Manual review queue captures edge cases
- [ ] Rate limiting prevents API exhaustion

## 🚫 Failure Conditions

The following conditions constitute acceptance failure:

1. **Pipeline Failure**: Any step crashes without structured error event
2. **Schema Violation**: Any artifact fails AJV validation
3. **Data Loss**: Missing events or artifacts in data lake
4. **Quality Breach**: LLM outputs contain hallucinations not supported by evidence
5. **Performance**: Pipeline takes > 10 minutes for standard vehicle
6. **Security**: API keys exposed in logs or client-side code
7. **Idempotency**: Same input produces different outputs

## 📋 Sign-off Requirements

- [ ] **Technical Lead**: All ACs verified with automated tests
- [ ] **Product Owner**: End-to-end user journey tested successfully  
- [ ] **Security Review**: No credentials exposed, proper error handling
- [ ] **DevOps**: Infrastructure deployable and monitorable
- [ ] **QA**: Test scenarios pass consistently

---

**Document Version**: 1.0  
**Last Updated**: Initial version for PR1  
**Next Review**: After each major PR milestone