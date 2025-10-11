FROM node:18-alpine

LABEL maintainer="Wessley.ai <contact@wessley.ai>"
LABEL description="3D GLB model generation service with Three.js"

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create output directory for generated models
RUN mkdir -p ./output

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S modelbuilder -u 1001 -G nodejs

# Change ownership
RUN chown -R modelbuilder:nodejs /app
USER modelbuilder

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]