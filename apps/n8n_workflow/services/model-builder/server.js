/**
 * Wessley.ai Model Builder Service
 * 3D GLB model generation service for electrical components
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Three.js imports for GLB generation
const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');

// Internal modules
const ComponentMeshGenerator = require('./src/component-mesh-generator');
const WireMeshGenerator = require('./src/wire-mesh-generator');
const CircuitGroupManager = require('./src/circuit-group-manager');
const ManifestGenerator = require('./src/manifest-generator');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

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
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize service components
const componentMeshGenerator = new ComponentMeshGenerator();
const wireMeshGenerator = new WireMeshGenerator();
const circuitGroupManager = new CircuitGroupManager();
const manifestGenerator = new ManifestGenerator();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'model-builder-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    capabilities: {
      threejs: THREE.REVISION,
      maxMeshes: 10000,
      maxVertices: 1000000,
      supportedFormats: ['GLB', 'GLTF']
    }
  });
});

/**
 * Build 3D GLB model from ElectroGraph3D
 */
app.post('/build', [
  body('graph3d').isObject().withMessage('graph3d must be an object'),
  body('manifest').optional().isObject().withMessage('manifest must be an object'),
  body('jobId').isString().notEmpty().withMessage('jobId is required'),
  body('options').optional().isObject().withMessage('options must be an object')
], async (req, res) => {
  const startTime = Date.now();
  let tempFiles = [];
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { graph3d, manifest, jobId, options = {} } = req.body;
    
    logger.info(`Building GLB model for job: ${jobId}`, {
      nodeCount: graph3d.nodes?.length || 0,
      routeCount: graph3d.routes?.length || 0,
      circuitCount: graph3d.circuits?.length || 0
    });

    // Create Three.js scene
    const scene = new THREE.Scene();
    scene.name = `ElectricalSystem_${jobId}`;

    // Build component meshes
    logger.info('Generating component meshes...');
    const componentMeshes = await componentMeshGenerator.generateMeshes(graph3d.nodes, options);
    
    // Build wire meshes
    logger.info('Generating wire meshes...');
    const wireMeshes = await wireMeshGenerator.generateMeshes(graph3d.routes, options);
    
    // Organize into circuit groups
    logger.info('Organizing circuit groups...');
    const circuitGroups = circuitGroupManager.createCircuitGroups(
      graph3d.circuits,
      componentMeshes,
      wireMeshes,
      graph3d.nodes
    );
    
    // Add groups to scene
    circuitGroups.forEach(group => {
      scene.add(group);
    });

    // Add global lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    ambientLight.name = 'AmbientLight';
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.name = 'DirectionalLight';
    scene.add(directionalLight);

    // Generate GLB file
    logger.info('Exporting GLB...');
    const exporter = new GLTFExporter();
    
    const glbBuffer = await new Promise((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            reject(new Error('Expected ArrayBuffer from GLTFExporter'));
          }
        },
        (error) => reject(error),
        {
          binary: true,
          embedImages: true,
          includeCustomExtensions: true,
          animations: [],
          onlyVisible: true
        }
      );
    });

    // Save GLB file
    const outputDir = process.env.OUTPUT_DIR || './output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const glbPath = path.join(outputDir, `${jobId}.glb`);
    fs.writeFileSync(glbPath, Buffer.from(glbBuffer));
    tempFiles.push(glbPath);

    // Generate viewer manifest
    logger.info('Generating viewer manifest...');
    const viewerManifest = manifestGenerator.generateManifest(
      graph3d,
      componentMeshes,
      wireMeshes,
      circuitGroups,
      {
        jobId,
        glbPath: glbPath,
        fileSize: glbBuffer.byteLength,
        generatedAt: new Date().toISOString()
      }
    );

    // Save manifest
    const manifestPath = path.join(outputDir, `${jobId}_manifest.json`);
    fs.writeFileSync(manifestPath, JSON.stringify(viewerManifest, null, 2));
    tempFiles.push(manifestPath);

    // Upload to storage (if configured)
    let glbUrl = glbPath;
    let manifestUrl = manifestPath;
    
    if (process.env.STORAGE_PROVIDER === 's3') {
      // TODO: Implement S3 upload
      logger.info('S3 upload not implemented, using local paths');
    } else if (process.env.STORAGE_PROVIDER === 'cdn') {
      // TODO: Implement CDN upload  
      logger.info('CDN upload not implemented, using local paths');
    }

    const processingTime = Date.now() - startTime;
    
    logger.info(`GLB model generation completed for job: ${jobId}`, {
      processingTime: `${processingTime}ms`,
      fileSize: `${(glbBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`,
      meshCount: componentMeshes.length + wireMeshes.length,
      circuitCount: circuitGroups.length
    });

    res.json({
      success: true,
      jobId,
      glbUrl,
      manifestUrl,
      metadata: {
        fileSize: glbBuffer.byteLength,
        processingTime,
        meshCount: componentMeshes.length + wireMeshes.length,
        circuitCount: circuitGroups.length,
        nodeCount: graph3d.nodes?.length || 0,
        routeCount: graph3d.routes?.length || 0,
        generatedAt: new Date().toISOString()
      },
      manifest: viewerManifest
    });

  } catch (error) {
    logger.error('GLB model generation failed', { 
      error: error.message, 
      stack: error.stack,
      jobId: req.body.jobId 
    });
    
    // Cleanup temp files on error
    tempFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (cleanupError) {
        logger.warn('Failed to cleanup temp file', { file, error: cleanupError.message });
      }
    });
    
    res.status(500).json({
      error: 'GLB model generation failed',
      message: error.message,
      jobId: req.body.jobId
    });
  }
});

/**
 * Get model information
 */
app.get('/models/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const outputDir = process.env.OUTPUT_DIR || './output';
    
    const glbPath = path.join(outputDir, `${jobId}.glb`);
    const manifestPath = path.join(outputDir, `${jobId}_manifest.json`);
    
    if (!fs.existsSync(glbPath) || !fs.existsSync(manifestPath)) {
      return res.status(404).json({
        error: 'Model not found',
        jobId
      });
    }
    
    const stats = fs.statSync(glbPath);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    res.json({
      success: true,
      jobId,
      glbPath,
      manifestPath,
      fileSize: stats.size,
      createdAt: stats.birthtime,
      manifest
    });
    
  } catch (error) {
    logger.error('Failed to get model info', { error: error.message, jobId: req.params.jobId });
    res.status(500).json({
      error: 'Failed to get model info',
      message: error.message
    });
  }
});

/**
 * Download GLB file
 */
app.get('/models/:jobId/download', (req, res) => {
  try {
    const { jobId } = req.params;
    const outputDir = process.env.OUTPUT_DIR || './output';
    const glbPath = path.join(outputDir, `${jobId}.glb`);
    
    if (!fs.existsSync(glbPath)) {
      return res.status(404).json({
        error: 'GLB file not found',
        jobId
      });
    }
    
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Disposition', `attachment; filename="${jobId}.glb"`);
    
    const stream = fs.createReadStream(glbPath);
    stream.pipe(res);
    
  } catch (error) {
    logger.error('Failed to download GLB', { error: error.message, jobId: req.params.jobId });
    res.status(500).json({
      error: 'Failed to download GLB',
      message: error.message
    });
  }
});

/**
 * Health metrics
 */
app.get('/metrics', (req, res) => {
  try {
    const outputDir = process.env.OUTPUT_DIR || './output';
    let totalFiles = 0;
    let totalSize = 0;
    
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      totalFiles = files.filter(f => f.endsWith('.glb')).length;
      
      files.forEach(file => {
        try {
          const stats = fs.statSync(path.join(outputDir, file));
          totalSize += stats.size;
        } catch (err) {
          // Ignore errors for individual files
        }
      });
    }
    
    res.json({
      service: 'model-builder',
      metrics: {
        totalModels: totalFiles,
        totalStorageSize: totalSize,
        averageModelSize: totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        threejsVersion: THREE.REVISION
      },
      timestamp: new Date().toISOString()
    });
    
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
 * Start server
 */
app.listen(PORT, () => {
  logger.info(`🚀 Model Builder service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Three.js version: ${THREE.REVISION}`);
  logger.info(`Output directory: ${process.env.OUTPUT_DIR || './output'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;