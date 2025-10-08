/**
 * Wessley.ai Ingest Service
 * Data lake ingest service for n8n electrical pipeline
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const expressWinston = require('express-winston');

// Internal modules
const S3Manager = require('./src/s3-manager');
const CacheManager = require('./src/cache-manager');
const SchemaValidator = require('./src/schema-validator');
const EventProcessor = require('./src/event-processor');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const s3Manager = new S3Manager();
const cacheManager = new CacheManager();
const schemaValidator = new SchemaValidator();
const eventProcessor = new EventProcessor(s3Manager, cacheManager, schemaValidator);

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Request logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute: (req, res) => req.url === '/health'
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error logging
app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {}
  };

  try {
    // Check S3 connectivity
    health.services.s3 = await s3Manager.healthCheck();
    
    // Check Redis connectivity
    health.services.redis = await cacheManager.healthCheck();
    
    // Check schema validation
    health.services.schemas = schemaValidator.healthCheck();

    const allHealthy = Object.values(health.services).every(service => service.status === 'healthy');
    
    if (!allHealthy) {
      health.status = 'degraded';
      return res.status(503).json(health);
    }

    res.json(health);
    
  } catch (error) {
    health.status = 'unhealthy';
    health.error = error.message;
    res.status(503).json(health);
  }
});

/**
 * Store event to data lake
 */
app.post('/events', [
  body('eventEnvelope').isObject().withMessage('eventEnvelope must be an object'),
  body('storagePath').isString().notEmpty().withMessage('storagePath is required'),
  body('ndjsonLine').isString().notEmpty().withMessage('ndjsonLine is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { eventEnvelope, storagePath, ndjsonLine } = req.body;
    
    const result = await eventProcessor.storeEvent(eventEnvelope, storagePath, ndjsonLine);
    
    res.json({
      success: true,
      eventId: result.eventId,
      storagePath: result.storagePath,
      size: result.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to store event', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to store event',
      message: error.message
    });
  }
});

/**
 * Store research manifest
 */
app.post('/research', [
  body('manifest').isObject().withMessage('manifest must be an object'),
  body('jobId').isUUID().withMessage('jobId must be a valid UUID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { manifest, jobId } = req.body;
    
    const result = await eventProcessor.storeResearch(manifest, jobId);
    
    res.json({
      success: true,
      jobId: result.jobId,
      storagePath: result.storagePath,
      size: result.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to store research', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to store research',
      message: error.message
    });
  }
});

/**
 * Store normalized data
 */
app.post('/normalized/:type', [
  body('data').isObject().withMessage('data must be an object'),
  body('jobId').isUUID().withMessage('jobId must be a valid UUID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { type } = req.params;
    const { data, jobId } = req.body;
    
    const result = await eventProcessor.storeNormalizedData(type, data, jobId);
    
    res.json({
      success: true,
      jobId: result.jobId,
      type: result.type,
      storagePath: result.storagePath,
      size: result.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to store normalized data', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to store normalized data',
      message: error.message
    });
  }
});

/**
 * Cache operations
 */
app.get('/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await cacheManager.get(key);
    
    if (value === null) {
      return res.status(404).json({
        error: 'Cache miss',
        key
      });
    }
    
    res.json({
      success: true,
      key,
      value,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Cache get failed', { key: req.params.key, error: error.message });
    res.status(500).json({
      error: 'Cache get failed',
      message: error.message
    });
  }
});

app.put('/cache/:key', [
  body('value').exists().withMessage('value is required'),
  body('ttl').optional().isInt({ min: 1 }).withMessage('ttl must be a positive integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { key } = req.params;
    const { value, ttl } = req.body;
    
    await cacheManager.set(key, value, ttl);
    
    res.json({
      success: true,
      key,
      ttl: ttl || cacheManager.defaultTTL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Cache set failed', { key: req.params.key, error: error.message });
    res.status(500).json({
      error: 'Cache set failed',
      message: error.message
    });
  }
});

app.delete('/cache/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const deleted = await cacheManager.delete(key);
    
    res.json({
      success: true,
      key,
      deleted,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Cache delete failed', { key: req.params.key, error: error.message });
    res.status(500).json({
      error: 'Cache delete failed',
      message: error.message
    });
  }
});

/**
 * Manual review queue
 */
app.post('/manual-review', [
  body('errorPayload').isObject().withMessage('errorPayload must be an object'),
  body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('priority must be low, normal, or high'),
  body('category').isString().notEmpty().withMessage('category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { errorPayload, priority = 'normal', category } = req.body;
    
    const result = await eventProcessor.queueManualReview(errorPayload, priority, category);
    
    res.json({
      success: true,
      reviewId: result.reviewId,
      priority: result.priority,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to queue manual review', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to queue manual review',
      message: error.message
    });
  }
});

/**
 * Viewer events
 */
app.post('/viewer', [
  body('events').isArray().withMessage('events must be an array'),
  body('sessionId').isString().notEmpty().withMessage('sessionId is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { events, sessionId } = req.body;
    
    const result = await eventProcessor.storeViewerEvents(events, sessionId);
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      eventsStored: result.eventsStored,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to store viewer events', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Failed to store viewer events',
      message: error.message
    });
  }
});

/**
 * Analytics and metrics
 */
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await eventProcessor.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Failed to get metrics', { error: error.message });
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error.message
    });
  }
});

/**
 * Error handler
 */
app.use((error, req, res, next) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

/**
 * Initialize services and start server
 */
async function startServer() {
  try {
    logger.info('Initializing services...');
    
    await s3Manager.initialize();
    logger.info('✓ S3 Manager initialized');
    
    await cacheManager.initialize();
    logger.info('✓ Cache Manager initialized');
    
    await schemaValidator.initialize();
    logger.info('✓ Schema Validator initialized');
    
    await eventProcessor.initialize();
    logger.info('✓ Event Processor initialized');
    
    app.listen(PORT, () => {
      logger.info(`🚀 Ingest service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  try {
    await cacheManager.close();
    logger.info('Cache connections closed');
  } catch (error) {
    logger.error('Error closing cache connections', { error: error.message });
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  
  try {
    await cacheManager.close();
    logger.info('Cache connections closed');
  } catch (error) {
    logger.error('Error closing cache connections', { error: error.message });
  }
  
  process.exit(0);
});

// Start the server
startServer();