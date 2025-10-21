# Wessley.ai Service Specifications

## Service Overview

The Wessley.ai platform consists of five core services designed for modularity, scalability, and clean separation of concerns. Each service has a specific responsibility and communicates through well-defined interfaces.

## Service Inventory

| Service | Technology | Primary Function | Port | Status |
|---------|------------|------------------|------|--------|
| 3D Model Generation | NestJS + TypeScript | Graph → GLB conversion | 3001 | ✅ **Production Ready** |
| Learning/ML Service | Python + Ray | Algorithm optimization | 3002 | 🔄 **Future Implementation** |
| Semantic Search | Python + Qdrant | Vector-based search | 3003 | 🔄 **Future Implementation** |
| Knowledge Graph | Python + Neo4j | Graph data management | 3004 | 🔄 **Future Implementation** |
| Web Application | Next.js + React | User interface | 3000 | ✅ **Existing** |

---

## 1. 3D Model Generation Service

### Overview
**Language**: TypeScript (NestJS)  
**Primary Function**: Transform Neo4j knowledge graphs into production-quality GLB 3D models  
**Repository**: `apps/services/3d-model-service`

### Core Responsibilities
- Query electrical system data from Neo4j knowledge graphs
- Generate component meshes using Three.js with realistic geometries
- Implement physics-based wire harness routing algorithms
- Export optimized GLB files with embedded AI-ready metadata
- Upload models to S3 with CDN distribution
- Provide real-time progress updates via Supabase channels

### Technology Stack
```json
{
  "framework": "NestJS 10.x",
  "language": "TypeScript 5.x",
  "3d_engine": "Three.js",
  "database": "Neo4j (via neo4j-driver)",
  "cache": "Redis (via ioredis)",
  "queue": "Bull Queue",
  "storage": "AWS S3",
  "realtime": "Supabase",
  "validation": "class-validator",
  "testing": "Jest + Supertest"
}
```

### Module Architecture
```
src/
├── modules/
│   ├── graph/              # Neo4j integration
│   │   ├── graph.service.ts
│   │   ├── query.builder.ts
│   │   └── transformer.service.ts
│   ├── spatial/            # 3D positioning algorithms
│   │   ├── layout.service.ts
│   │   ├── routing.service.ts
│   │   └── optimization.service.ts
│   ├── geometry/           # Three.js mesh generation
│   │   ├── component-factory.service.ts
│   │   ├── wire-factory.service.ts
│   │   ├── material.service.ts
│   │   └── scene-composer.service.ts
│   ├── export/             # GLB generation
│   │   ├── gltf-exporter.service.ts
│   │   ├── optimizer.service.ts
│   │   └── metadata.service.ts
│   ├── storage/            # S3 integration
│   │   ├── s3.service.ts
│   │   ├── cdn.service.ts
│   │   └── upload.service.ts
│   └── jobs/               # Async processing
│       ├── queue.service.ts
│       ├── worker.service.ts
│       └── progress.service.ts
├── common/
│   ├── dto/               # Data transfer objects
│   ├── entities/          # Domain models
│   ├── interfaces/        # Service contracts
│   └── utils/            # Shared utilities
└── config/               # Environment configuration
```

### API Endpoints
```typescript
POST   /api/v1/models/generate     # Generate 3D model from graph
GET    /api/v1/models/:id          # Get model information
GET    /api/v1/models/:id/download # Download GLB file
GET    /api/v1/models/:id/progress # Get generation progress
DELETE /api/v1/models/:id          # Delete model
GET    /api/v1/health              # Health check
GET    /api/v1/metrics             # Service metrics
```

### Environment Variables
```bash
# Database
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password

# Cache & Queue
REDIS_URL=redis://localhost:6379

# Storage
S3_BUCKET=wessley-3d-models
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
CDN_BASE_URL=https://cdn.wessley.ai

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx

# Service
PORT=3001
NODE_ENV=production
LOG_LEVEL=info
```

### Performance Requirements
- **Model Generation**: < 30 seconds for typical electrical systems
- **Memory Usage**: < 2GB per worker process
- **Concurrent Jobs**: 10+ simultaneous GLB generations
- **File Size**: Optimized GLB files < 50MB
- **Uptime**: 99.9% availability

---

## 2. Learning/ML Service

### Overview
**Language**: Python (FastAPI + Ray)  
**Primary Function**: Continuous improvement of 3D generation algorithms  
**Repository**: `apps/services/learning-service`  
**Status**: 🔄 **Future Implementation**

For detailed architecture, see: [Learning Service Architecture](apps/services/learning-service/ARCHITECTURE.md)

### Core Responsibilities
- Analyze user interactions and model generation patterns
- Optimize component placement algorithms using reinforcement learning
- Enhance wire routing strategies with physics-based ML models
- Train models for component recognition and classification
- Provide algorithmic improvements to 3D Model Service via gRPC

---

## 3. Semantic Search Service

### Overview
**Language**: Python (FastAPI + Qdrant)  
**Primary Function**: Vector-based search for components and documentation  
**Repository**: `apps/services/semantic-service`  
**Status**: 🔄 **Future Implementation**

For detailed architecture, see: [Semantic Service Architecture](apps/services/semantic-service/ARCHITECTURE.md)

### Core Responsibilities
- Store component embeddings for similarity search
- Enable natural language component queries
- Support documentation semantic search
- Provide recommendations for similar parts and systems

---

## 4. Knowledge Graph Service

### Overview
**Language**: Python (FastAPI + Neo4j)  
**Primary Function**: Store and query electrical system relationships  
**Repository**: `apps/services/graph-service`  
**Status**: 🔄 **Future Implementation** (Currently integrated with 3D Model Service)

For detailed architecture, see: [Graph Service Architecture](apps/services/graph-service/ARCHITECTURE.md)

### Core Responsibilities
- Store component specifications and electrical relationships
- Maintain circuit topology and connection data
- Provide graph traversal and electrical system analysis
- Support complex queries for 3D model generation

---

## 5. Web Application

### Overview
**Language**: TypeScript (Next.js)  
**Primary Function**: User interface and AI chat integration  
**Repository**: `apps/web`

### Core Responsibilities
- User authentication via Supabase OAuth
- 3D model visualization using Three.js/React Three Fiber
- AI chat agent for technical assistance
- Project management and collaboration features

### Technology Stack
```json
{
  "framework": "Next.js 14",
  "language": "TypeScript",
  "ui": "React + Tailwind CSS",
  "3d": "React Three Fiber",
  "auth": "Supabase Auth",
  "state": "Zustand",
  "ai": "OpenAI API"
}
```

---

## Service Communication

### Synchronous Communication
- **HTTP/REST**: External API calls and web client communication
- **GraphQL**: Flexible data fetching for complex queries
- **gRPC**: High-performance service-to-service communication

### Asynchronous Communication
- **Redis Pub/Sub**: Real-time notifications and events
- **Supabase Realtime**: WebSocket connections to web clients
- **Message Queues**: Background job processing

### Data Consistency
- **Event Sourcing**: Critical state changes logged as events
- **CQRS**: Separate read/write models for complex queries
- **Saga Pattern**: Distributed transaction management

---

## Development Guidelines

### Code Standards
- **TypeScript**: Strict mode with comprehensive type coverage
- **Python**: Black formatter with mypy type checking
- **Testing**: Minimum 80% code coverage for all services
- **Documentation**: OpenAPI specs for all REST endpoints

### Git Workflow
- **Branching**: Feature branches with pull request reviews
- **Conventional Commits**: Standardized commit message format
- **CI/CD**: Automated testing and deployment via GitHub Actions
- **Versioning**: Semantic versioning for all services

### Monitoring
- **Health Checks**: HTTP endpoints for service health monitoring
- **Metrics**: Prometheus metrics for performance monitoring
- **Logging**: Structured JSON logging with correlation IDs
- **Tracing**: Distributed tracing for request flow analysis

---

## Deployment Strategy

### Containerization
```dockerfile
# Multi-stage builds for all services
FROM node:18-alpine AS builder
FROM node:18-alpine AS runtime
```

### Orchestration
- **Kubernetes**: Production deployment with auto-scaling
- **Docker Compose**: Local development environment
- **Helm Charts**: Environment-specific configuration

### Scaling Policies
- **CPU-based**: Scale when CPU usage > 70%
- **Memory-based**: Scale when memory usage > 80%
- **Queue-based**: Scale based on Redis queue depth
- **Custom**: Business logic-based scaling triggers