#!/bin/bash
# Start all Wessley.ai backend services

echo "🚀 Starting Wessley.ai Backend Services..."

# Kill any existing processes on target ports
echo "📝 Cleaning up existing processes..."
lsof -ti:3000,3001,3002,3003 | xargs kill -9 2>/dev/null || true

# Wait for ports to be free
sleep 2

# Start model-builder service (port 3000)
echo "🏗️ Starting model-builder service on port 3000..."
cd /Users/moon/workspace/wessley.ai/apps/n8n_workflow/services/model-builder
node server.js &
MODEL_BUILDER_PID=$!
sleep 3

# Start ingest service (port 3001)  
echo "📥 Starting ingest service on port 3001..."
cd /Users/moon/workspace/wessley.ai/apps/n8n_workflow/services/ingest
node server.js &
INGEST_PID=$!
sleep 3

# Start layout service (port 3002)
echo "📐 Starting layout service on port 3002..."
cd /Users/moon/workspace/wessley.ai/apps/n8n_workflow/services/layout
node server.js &
LAYOUT_PID=$!
sleep 3

# Install pipeline dependencies and start pipeline service (port 3003)
echo "🔧 Installing pipeline service dependencies..."
cd /Users/moon/workspace/wessley.ai/apps/n8n_workflow/services/pipeline
npm install > /dev/null 2>&1
echo "🚀 Starting pipeline orchestrator service on port 3003..."
node server.js &
PIPELINE_PID=$!
sleep 3

# Check service health
echo "🔍 Checking service health..."
echo "Model Builder (3000): $(curl -s http://localhost:3000/health > /dev/null && echo "✅ Running" || echo "❌ Failed")"
echo "Ingest (3001): $(curl -s http://localhost:3001/health > /dev/null && echo "✅ Running" || echo "❌ Failed")"
echo "Layout (3002): $(curl -s http://localhost:3002/health > /dev/null && echo "✅ Running" || echo "❌ Failed")"
echo "Pipeline (3003): $(curl -s http://localhost:3003/health > /dev/null && echo "✅ Running" || echo "❌ Failed")"

echo "📊 All services started! PIDs: Model-Builder=$MODEL_BUILDER_PID, Ingest=$INGEST_PID, Layout=$LAYOUT_PID, Pipeline=$PIPELINE_PID"
echo "🎮 Demo available at: http://localhost:3010"

# Keep script running
wait