# Operations Runbook - N8N Electrical 3D Pipeline

This runbook provides operational procedures for the n8n electrical pipeline system.

## 🚀 Quick Start

### Local Development Setup
```bash
# 1. Clone and navigate to project
cd apps/n8n_workflow

# 2. Copy environment templates
cp infra/n8n.env.example infra/n8n.env
cp services/ingest/.env.example services/ingest/.env

# 3. Configure credentials (see Configuration section)
vim infra/n8n.env

# 4. Start all services
docker compose -f infra/docker-compose.n8n.yml up --build -d

# 5. Wait for services to be healthy
docker compose -f infra/docker-compose.n8n.yml ps

# 6. Access n8n UI
open http://localhost:5678
```

### First-Time n8n Setup
1. Access n8n at http://localhost:5678
2. Login with credentials from `n8n.env`
3. Import workflows from `/n8n-workflows/` directory
4. Configure credentials (OpenAI, AWS, etc.)
5. Activate main workflow: `main.electro3d`

## ⚙️ Configuration

### Required Environment Variables

#### n8n Core (`infra/n8n.env`)
```bash
# Generate secure encryption key
N8N_ENCRYPTION_KEY=$(openssl rand -hex 32)

# OpenAI API
OPENAI_API_KEY=sk-your-key-here

# AWS for data lake
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=wessley-lake

# Search API
SEARCH_API_KEY=your-search-key
```

#### Ingest Service (`services/ingest/.env`)
```bash
# Copy AWS credentials from n8n.env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=wessley-lake
```

### Service URLs (Docker Internal)
- n8n: `http://n8n:5678`
- Model Builder: `http://model-builder:3000`
- Layout Service: `http://layout:3003` 
- Ingest Service: `http://ingest:3001`
- Redis: `redis://redis:6379`

## 🔧 Common Operations

### Trigger Pipeline
```bash
# Basic vehicle build
curl -XPOST http://localhost:5678/webhook/electro-3d/build \
  -H 'Content-Type: application/json' \
  -H 'X-Idempotency-Key: demo-$(date +%s)' \
  -d '{"brand":"Toyota","model":"Camry","year":2020}'

# Expected response
{
  "jobId": "uuid-here",
  "glbUrl": "https://s3.../curated/models_glb/{jobId}.glb",
  "manifestUrl": "https://s3.../curated/manifests/{jobId}.json", 
  "viewerUrl": "https://wessley.ai/viewer/{jobId}"
}
```

### Monitor Pipeline Status
```bash
# Check n8n executions
curl http://localhost:5678/api/executions \
  -H 'Authorization: Basic base64(admin:password)'

# Check service health
curl http://localhost:3000/health  # model-builder
curl http://localhost:3001/health  # ingest
curl http://localhost:3003/health  # layout

# Check data lake contents (requires AWS CLI)
aws s3 ls s3://wessley-lake/jobs/ --recursive
```

### Clear Cache
```bash
# Connect to Redis
docker exec -it wessley-redis redis-cli

# Clear all cache
FLUSHALL

# Clear specific vehicle cache
DEL "cache:Toyota:Camry:2020:*"
```

## 🔍 Troubleshooting

### Pipeline Failures

#### Symptom: "Research phase failed"
```bash
# Check OpenAI API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Check search API key
curl "https://api.serpapi.com/search?q=test&api_key=$SEARCH_API_KEY"

# Check rate limits in logs
docker logs wessley-n8n | grep "rate"
```

#### Symptom: "Schema validation failed"
```bash
# Test schema validation
docker exec wessley-n8n node -e "
  const Ajv = require('ajv');
  const schema = require('/data/schemas/ElectroGraph.schema.json');
  console.log(ajv.validateSchema(schema));
"

# Check for schema mismatches
grep -r "schema" /apps/n8n_workflow/n8n-workflows/
```

#### Symptom: "S3 upload failed"
```bash
# Test AWS credentials
aws s3 ls s3://wessley-lake/

# Check ingest service logs
docker logs wessley-ingest | tail -50

# Test ingest service directly
curl -XPOST http://localhost:3001/events \
  -H 'Content-Type: application/json' \
  -d '{"test": "event"}'
```

### Performance Issues

#### High API Costs
```bash
# Check cache hit rate
docker exec wessley-redis redis-cli info stats

# Review expensive operations
aws s3 ls s3://wessley-lake/jobs/raw/events/ | \
  grep "$(date +%Y-%m-%d)" | wc -l

# Enable debug mode
echo "DEBUG_MODE=true" >> infra/n8n.env
docker compose restart n8n
```

#### Slow Pipeline Execution
```bash
# Check service response times
time curl http://localhost:3000/health
time curl http://localhost:3001/health  
time curl http://localhost:3003/health

# Monitor resource usage
docker stats

# Check for deadlocks
docker logs wessley-n8n | grep -i timeout
```

### Data Quality Issues

#### Low Confidence Scores
```bash
# Check manual review queue
aws s3 ls s3://wessley-lake/jobs/manual_review/

# Review research quality
aws s3 cp s3://wessley-lake/jobs/raw/research/latest.json - | \
  jq '.confidence, .sources | length'

# Adjust confidence threshold
echo "CONFIDENCE_THRESHOLD=0.65" >> infra/n8n.env
```

#### Missing Components
```bash
# Check research manifest
aws s3 cp s3://wessley-lake/jobs/raw/research/{jobId}.json - | \
  jq '.components | length'

# Review normalization logs
docker logs wessley-n8n | grep "normalize"

# Validate graph integrity
aws s3 cp s3://wessley-lake/jobs/normalized/electrograph/{jobId}.json - | \
  jq '.nodes | length, .edges | length'
```

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| Pipeline Success Rate | < 90% | Warning |
| Average Duration | > 5 min | Warning |
| API Error Rate | > 5% | Critical |
| Cache Hit Rate | < 70% | Warning |
| S3 Upload Failures | > 0 | Critical |
| Memory Usage | > 80% | Warning |

### Health Check Endpoints
```bash
# Service health
GET /health  # All services

# n8n status  
GET /healthz

# Data lake connectivity
GET /ingest/health

# Cache connectivity
redis-cli ping
```

### Log Locations
```bash
# Application logs
docker logs wessley-n8n
docker logs wessley-ingest
docker logs wessley-model-builder
docker logs wessley-layout

# Data lake events
aws s3 ls s3://wessley-lake/jobs/raw/events/$(date +%Y-%m-%d)/

# Pipeline execution history
curl http://localhost:5678/api/executions
```

## 🚨 Emergency Procedures

### Pipeline Stuck/Hanging
```bash
# Stop all executions
curl -XPOST http://localhost:5678/api/executions/stop-all

# Restart n8n service
docker restart wessley-n8n

# Clear stuck workflows
docker exec wessley-n8n rm -rf /tmp/n8n-*
```

### Data Lake Corruption
```bash
# List recent corrupted files
aws s3 ls s3://wessley-lake/jobs/ --recursive | \
  grep "$(date +%Y-%m-%d)" | sort -r

# Backup before cleanup
aws s3 sync s3://wessley-lake/jobs/ ./backup/

# Remove corrupted artifacts
aws s3 rm s3://wessley-lake/jobs/corrupted/ --recursive
```

### Service Recovery
```bash
# Nuclear option - restart everything
docker compose -f infra/docker-compose.n8n.yml down
docker compose -f infra/docker-compose.n8n.yml up --build -d

# Verify recovery
./scripts/health-check.sh
```

## 📋 Maintenance

### Daily Tasks
- [ ] Check pipeline success rate
- [ ] Review error logs for patterns
- [ ] Monitor API usage and costs
- [ ] Verify data lake integrity

### Weekly Tasks  
- [ ] Clear old cache entries (> 7 days)
- [ ] Review manual review queue
- [ ] Update test vectors with new vehicles
- [ ] Backup critical configurations

### Monthly Tasks
- [ ] Rotate API keys
- [ ] Review and optimize cache settings
- [ ] Update service dependencies
- [ ] Performance benchmarking

## 🔐 Security

### API Key Rotation
```bash
# Generate new encryption key
NEW_KEY=$(openssl rand -hex 32)
echo "N8N_ENCRYPTION_KEY=$NEW_KEY" >> infra/n8n.env

# Update OpenAI key
echo "OPENAI_API_KEY=sk-new-key" >> infra/n8n.env

# Restart services
docker compose restart
```

### Access Control
- n8n admin interface protected by basic auth
- Webhook endpoints use secret validation  
- S3 buckets use IAM policies with least privilege
- All credentials in environment files (never committed)

---

**Document Version**: 1.0  
**Emergency Contact**: DevOps Team  
**Last Updated**: Initial version for PR1