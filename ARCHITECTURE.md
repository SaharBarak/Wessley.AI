# Wessley.ai System Architecture

## Overview

Wessley.ai is a production-ready system for converting electrical system knowledge graphs into interactive 3D models with AI-powered assistance. The architecture is designed for scalability, modularity, and future ML integration.

## System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data Ingestion│───▶│  Knowledge Graph │───▶│  3D Model Gen   │
│     Service     │    │    (Neo4j)       │    │   (NestJS)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Semantic Search │◀───│  Learning/ML     │    │   S3 Storage    │
│   (Qdrant)      │    │   Service        │    │   (GLB Files)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Database    │  │ Auth/OAuth  │  │    Realtime             │  │
│  │ Storage     │  │ Users       │  │    WebSockets           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Web Application                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Chat Agent  │  │ 3D Viewer   │  │    User Interface       │  │
│  │ (AI)        │  │ (Three.js)  │  │   (React/Next.js)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Services

### 1. 3D Model Generation Service (NestJS + TypeScript)
**Primary Function**: Transform Neo4j knowledge graphs into GLB 3D models

**Key Responsibilities**:
- Query electrical system data from Neo4j
- Generate 3D component meshes using Three.js
- Route wire harnesses with physics-based algorithms
- Export optimized GLB files with embedded metadata
- Upload models to S3 with CDN distribution
- Provide real-time progress updates via Supabase

**Technology Stack**:
- NestJS for enterprise architecture
- Three.js for 3D mesh generation
- Redis Bull for job queues
- S3 for file storage
- Supabase for metadata and real-time updates

### 2. Learning/ML Service (Python + Ray)
**Primary Function**: Continuous improvement of 3D generation algorithms  
**Status**: 🔄 **Future Implementation**

For detailed architecture, see: [Learning Service Architecture](apps/services/learning-service/ARCHITECTURE.md)

**Key Responsibilities**:
- Analyze user interactions and feedback
- Optimize component placement algorithms using reinforcement learning
- Enhance wire routing strategies with physics-based ML models
- Train models for component recognition and classification
- Provide algorithmic improvements to 3D service via gRPC

### 3. Semantic Search Service (Python + Qdrant)
**Primary Function**: Vector-based search for components and documentation  
**Status**: 🔄 **Future Implementation**

For detailed architecture, see: [Semantic Service Architecture](apps/services/semantic-service/ARCHITECTURE.md)

**Key Responsibilities**:
- Store component embeddings for similarity search
- Enable natural language component queries with NLP
- Support documentation semantic search
- Provide recommendations for similar parts and systems
- Enrich chat context with relevant technical information

### 4. Knowledge Graph Service (Python + Neo4j)
**Primary Function**: Store and query electrical system relationships  
**Status**: 🔄 **Future Implementation** (Currently integrated with 3D Model Service)

For detailed architecture, see: [Graph Service Architecture](apps/services/graph-service/ARCHITECTURE.md)

**Key Responsibilities**:
- Store component specifications and electrical relationships
- Maintain circuit topology and connection data with vehicle isolation
- Provide graph traversal and electrical system analysis
- Support complex queries for 3D model generation
- Handle GraphML imports and data validation

## Data Stores

### Supabase (Primary Backend)
- **Database**: User accounts, projects, model metadata, job status
- **Auth**: OAuth integration (Google, GitHub, etc.)
- **Storage**: Small files and user uploads
- **Realtime**: WebSocket connections for live updates
- **API**: Auto-generated REST and GraphQL endpoints

### Neo4j (Knowledge Graph)
- Electrical component relationships
- Circuit topology and connections
- Component specifications and properties
- System-level electrical analysis

### Qdrant (Vector Database)
- Component semantic embeddings
- Documentation and manual vectors
- Similarity search indices
- Natural language query processing

### S3 (Object Storage)
- GLB 3D model files
- High-resolution textures and materials
- User-uploaded CAD files
- Backup and archival data

### Redis (Cache + Jobs)
- Job queues for async processing
- Session data and caching
- Real-time pub/sub messaging
- Temporary computation results

## Authentication & Authorization

### OAuth Integration via Supabase
```typescript
// OAuth providers supported
providers: [
  'google',
  'github', 
  'discord',
  'azure'
]

// Row Level Security (RLS) policies
- Users can only access their own projects
- Admin users can access system metrics
- Service-to-service authentication via API keys
```

### Service Authentication
- **API Gateway**: Kong/Traefik with JWT validation
- **Inter-service**: Service account tokens
- **Database**: Connection pooling with role-based access
- **Storage**: IAM roles for S3 access

## Data Flow Patterns

### Model Generation Workflow
1. **User Request**: Submits electrical system data via web app
2. **Authentication**: Supabase validates user session
3. **Job Creation**: 3D Model Service creates async job in Redis
4. **Graph Query**: Service queries Neo4j for component relationships
5. **3D Generation**: Three.js generates meshes and GLB export
6. **Storage**: GLB uploaded to S3 with CDN distribution
7. **Notification**: Supabase Realtime notifies web app of completion
8. **Learning**: ML Service analyzes generation patterns

### AI Chat Interaction
1. **User Query**: "Where is the starter relay?"
2. **Semantic Search**: Qdrant finds relevant components
3. **Graph Context**: Neo4j provides electrical relationships
4. **3D Context**: GLB metadata provides spatial information
5. **AI Response**: Chat agent combines all data sources
6. **Visual Guidance**: 3D viewer highlights components

### Real-time Updates
- **Progress Tracking**: Job status updates via Supabase channels
- **Collaborative Editing**: Multi-user project updates
- **System Health**: Service monitoring and alerting
- **Chat Notifications**: AI agent responses

## Deployment Architecture

### Containerization
- **Docker**: Multi-stage builds for each service
- **Kubernetes**: Auto-scaling and orchestration
- **Helm**: Environment-specific configuration
- **Istio**: Service mesh for communication

### Infrastructure
- **Cloud Provider**: AWS/GCP/Azure
- **CDN**: CloudFlare for global GLB distribution
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack with structured logging
- **Secrets**: Kubernetes secrets + Vault

### Environments
- **Development**: Local Docker Compose
- **Staging**: Minikube or managed K8s
- **Production**: Cloud-managed Kubernetes
- **CI/CD**: GitHub Actions with automated testing

## Security Considerations

### Data Protection
- **Encryption**: TLS 1.3 for all communications
- **At Rest**: S3 bucket encryption, database encryption
- **Secrets**: Vault/K8s secrets for API keys
- **Backup**: Automated encrypted backups

### Access Control
- **RBAC**: Role-based access in Supabase
- **API Security**: Rate limiting and input validation
- **Network**: VPC isolation and security groups
- **Audit**: Comprehensive logging and monitoring

## Scalability & Performance

### Horizontal Scaling
- **Stateless Services**: All services designed for horizontal scaling
- **Load Balancing**: Application and database load balancing
- **Queue Processing**: Redis Bull clusters for job distribution
- **CDN**: Global content delivery for GLB files

### Performance Optimization
- **Caching**: Multi-layer caching strategy
- **Database**: Query optimization and indexing
- **3D Models**: LOD generation and compression
- **API**: GraphQL for efficient data fetching

## Future Enhancements

### ML Integration Roadmap
- **Phase 1**: Basic pattern analysis and optimization
- **Phase 2**: Predictive component placement
- **Phase 3**: Generative 3D modeling
- **Phase 4**: Real-time collaborative AI assistance

### Feature Expansion
- **Mobile Support**: React Native companion app
- **VR/AR Integration**: Immersive 3D visualization
- **CAD Integration**: Direct import from major CAD systems
- **Marketplace**: Component and model sharing platform

## Monitoring & Observability

### Metrics
- **Application**: Request latency, error rates, throughput
- **Infrastructure**: CPU, memory, disk, network usage
- **Business**: Model generation times, user engagement
- **ML**: Model accuracy, training performance

### Alerting
- **Critical**: Service failures, data loss
- **Warning**: Performance degradation, capacity limits
- **Info**: Deployment notifications, scheduled maintenance

### Health Checks
- **Service**: HTTP health endpoints
- **Database**: Connection and query health
- **Storage**: S3 connectivity and performance
- **Queue**: Redis job processing status

---

This architecture provides a solid foundation for rapid development while maintaining the flexibility for future ML enhancements and scale.