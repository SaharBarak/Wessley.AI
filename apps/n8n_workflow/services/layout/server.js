/**
 * Wessley.ai Layout Service
 * 3D positioning and wire routing service for electrical components
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3003;

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
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Zone-based positioning algorithms
 */
class ZonePositioner {
  
  /**
   * Position nodes within their assigned zones
   */
  static positionNodes(nodes, coordinateSystem) {
    const positionedNodes = [];
    const zoneOccupancy = {}; // Track how many components in each zone
    
    // Initialize zone occupancy
    Object.keys(coordinateSystem.zones).forEach(zone => {
      zoneOccupancy[zone] = [];
    });
    
    // Group nodes by zone
    nodes.forEach(node => {
      const zone = node.zone || 'interior';
      if (!zoneOccupancy[zone]) {
        zoneOccupancy[zone] = [];
      }
      zoneOccupancy[zone].push(node);
    });
    
    // Position nodes within each zone
    Object.entries(zoneOccupancy).forEach(([zoneName, zoneNodes]) => {
      if (zoneNodes.length === 0) return;
      
      const zoneConfig = coordinateSystem.zones[zoneName];
      if (!zoneConfig) {
        logger.warn(`Unknown zone: ${zoneName}, using default positioning`);
        return;
      }
      
      const positioned = this.positionNodesInZone(zoneNodes, zoneConfig, zoneName);
      positionedNodes.push(...positioned);
    });
    
    return positionedNodes;
  }
  
  /**
   * Position nodes within a specific zone using various strategies
   */
  static positionNodesInZone(nodes, zoneConfig, zoneName) {
    const { center, size } = zoneConfig;
    const positioned = [];
    
    if (nodes.length === 1) {
      // Single node - place at zone center
      positioned.push({
        ...nodes[0],
        position: [...center],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      });
    } else if (nodes.length <= 4) {
      // Small group - use corners of zone
      positioned.push(...this.positionInCorners(nodes, center, size));
    } else if (nodes.length <= 9) {
      // Medium group - use 3x3 grid
      positioned.push(...this.positionInGrid(nodes, center, size, 3));
    } else {
      // Large group - use dynamic grid
      const gridSize = Math.ceil(Math.sqrt(nodes.length));
      positioned.push(...this.positionInGrid(nodes, center, size, gridSize));
    }
    
    return positioned;
  }
  
  /**
   * Position nodes at zone corners
   */
  static positionInCorners(nodes, center, size) {
    const [cx, cy, cz] = center;
    const [sx, sy, sz] = size;
    
    const corners = [
      [cx - sx/4, cy - sy/4, cz],     // Front-left
      [cx + sx/4, cy - sy/4, cz],     // Front-right  
      [cx - sx/4, cy + sy/4, cz],     // Back-left
      [cx + sx/4, cy + sy/4, cz]      // Back-right
    ];
    
    return nodes.map((node, index) => ({
      ...node,
      position: corners[index % corners.length],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    }));
  }
  
  /**
   * Position nodes in a grid pattern
   */
  static positionInGrid(nodes, center, size, gridSize) {
    const [cx, cy, cz] = center;
    const [sx, sy, sz] = size;
    
    const stepX = sx / (gridSize + 1);
    const stepY = sy / (gridSize + 1);
    
    return nodes.map((node, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      
      const x = cx - sx/2 + (col + 1) * stepX;
      const y = cy - sy/2 + (row + 1) * stepY; 
      const z = cz + (Math.random() - 0.5) * sz * 0.1; // Small random Z variation
      
      return {
        ...node,
        position: [x, y, z],
        rotation: [0, 0, Math.random() * 0.2 - 0.1], // Small random rotation
        scale: [1, 1, 1]
      };
    });
  }
  
  /**
   * Optimize positions to avoid overlaps
   */
  static optimizePositions(positionedNodes, minDistance = 0.05) {
    const optimized = [...positionedNodes];
    const maxIterations = 10;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let moved = false;
      
      for (let i = 0; i < optimized.length; i++) {
        for (let j = i + 1; j < optimized.length; j++) {
          const node1 = optimized[i];
          const node2 = optimized[j];
          
          const distance = this.calculateDistance(node1.position, node2.position);
          
          if (distance < minDistance) {
            // Move nodes apart
            const direction = this.normalizeVector(this.subtractVectors(node2.position, node1.position));
            const moveDistance = (minDistance - distance) / 2;
            
            node1.position = this.subtractVectors(node1.position, this.scaleVector(direction, moveDistance));
            node2.position = this.addVectors(node2.position, this.scaleVector(direction, moveDistance));
            
            moved = true;
          }
        }
      }
      
      if (!moved) break;
    }
    
    return optimized;
  }
  
  // Vector math utilities
  static calculateDistance(pos1, pos2) {
    const dx = pos1[0] - pos2[0];
    const dy = pos1[1] - pos2[1]; 
    const dz = pos1[2] - pos2[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }
  
  static subtractVectors(v1, v2) {
    return [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]];
  }
  
  static addVectors(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];
  }
  
  static scaleVector(v, scale) {
    return [v[0] * scale, v[1] * scale, v[2] * scale];
  }
  
  static normalizeVector(v) {
    const length = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    if (length === 0) return [0, 0, 0];
    return [v[0]/length, v[1]/length, v[2]/length];
  }
}

/**
 * Wire routing algorithms
 */
class WireRouter {
  
  /**
   * Generate wire routes between positioned nodes
   */
  static generateRoutes(nodes, edges, coordinateSystem) {
    const nodePositions = {};
    nodes.forEach(node => {
      nodePositions[node.id] = node.position;
    });
    
    const routes = [];
    
    edges.forEach(edge => {
      const fromPos = nodePositions[edge.from];
      const toPos = nodePositions[edge.to];
      
      if (!fromPos || !toPos) {
        logger.warn(`Missing position for edge ${edge.id}: ${edge.from} -> ${edge.to}`);
        return;
      }
      
      const route = this.calculateRoute(edge, fromPos, toPos, coordinateSystem);
      routes.push(route);
    });
    
    return routes;
  }
  
  /**
   * Calculate optimal route between two points
   */
  static calculateRoute(edge, fromPos, toPos, coordinateSystem) {
    const routingStrategy = this.selectRoutingStrategy(fromPos, toPos, coordinateSystem);
    
    let path;
    switch (routingStrategy) {
      case 'direct':
        path = this.generateDirectPath(fromPos, toPos);
        break;
      case 'corner':
        path = this.generateCornerPath(fromPos, toPos);
        break;
      case 'spline':
        path = this.generateSplinePath(fromPos, toPos);
        break;
      default:
        path = this.generateDirectPath(fromPos, toPos);
    }
    
    return {
      edgeId: edge.id,
      path: path,
      color: this.getWireColor(edge),
      radius: this.getWireRadius(edge),
      segments: 8,
      material: 'copper'
    };
  }
  
  /**
   * Select appropriate routing strategy based on positions
   */
  static selectRoutingStrategy(fromPos, toPos, coordinateSystem) {
    const distance = ZonePositioner.calculateDistance(fromPos, toPos);
    const heightDiff = Math.abs(fromPos[2] - toPos[2]);
    
    if (distance < 0.3) {
      return 'direct';
    } else if (heightDiff > 0.2) {
      return 'corner';
    } else {
      return 'spline';
    }
  }
  
  /**
   * Generate direct straight-line path
   */
  static generateDirectPath(fromPos, toPos) {
    return [fromPos, toPos];
  }
  
  /**
   * Generate path with right-angle corners
   */
  static generateCornerPath(fromPos, toPos) {
    const midZ = (fromPos[2] + toPos[2]) / 2 + 0.1; // Slightly elevated
    const midPoint = [
      (fromPos[0] + toPos[0]) / 2,
      (fromPos[1] + toPos[1]) / 2,
      midZ
    ];
    
    return [fromPos, midPoint, toPos];
  }
  
  /**
   * Generate smooth curved path using spline
   */
  static generateSplinePath(fromPos, toPos) {
    const controlPoint1 = [
      fromPos[0] + (toPos[0] - fromPos[0]) * 0.3,
      fromPos[1] + (toPos[1] - fromPos[1]) * 0.3 + 0.05,
      fromPos[2] + 0.02
    ];
    
    const controlPoint2 = [
      fromPos[0] + (toPos[0] - fromPos[0]) * 0.7,
      fromPos[1] + (toPos[1] - fromPos[1]) * 0.7 + 0.05,
      toPos[2] + 0.02
    ];
    
    // Generate bezier curve points
    const path = [fromPos];
    const segments = 6;
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const point = this.bezierPoint(fromPos, controlPoint1, controlPoint2, toPos, t);
      path.push(point);
    }
    
    path.push(toPos);
    return path;
  }
  
  /**
   * Calculate point on cubic bezier curve
   */
  static bezierPoint(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    
    return [
      uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0],
      uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1],
      uuu * p0[2] + 3 * uu * t * p1[2] + 3 * u * tt * p2[2] + ttt * p3[2]
    ];
  }
  
  /**
   * Get wire color from edge properties
   */
  static getWireColor(edge) {
    const wireColor = edge.properties?.wireColor;
    const colorMap = {
      red: '#FF0000',
      black: '#000000',
      blue: '#0000FF',
      green: '#00FF00',
      yellow: '#FFFF00',
      white: '#FFFFFF',
      brown: '#8B4513',
      orange: '#FFA500'
    };
    return colorMap[wireColor?.toLowerCase()] || '#000000';
  }
  
  /**
   * Get wire radius from gauge
   */
  static getWireRadius(edge) {
    const wireGauge = edge.properties?.wireGauge;
    const radiusMap = {
      '0.5mm²': 0.0005,
      '1mm²': 0.0008,
      '2.5mm²': 0.001,
      '4mm²': 0.0015,
      '6mm²': 0.002,
      '10mm²': 0.0025
    };
    return radiusMap[wireGauge] || 0.002;
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'layout-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Calculate 3D positions for nodes
 */
app.post('/positions', [
  body('nodes').isArray().withMessage('nodes must be an array'),
  body('coordinateSystem').isObject().withMessage('coordinateSystem must be an object'),
  body('vehicleSignature').isString().withMessage('vehicleSignature must be a string')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nodes, coordinateSystem, vehicleSignature } = req.body;
    
    logger.info(`Positioning ${nodes.length} nodes for vehicle: ${vehicleSignature}`);
    
    // Position nodes in zones
    let positionedNodes = ZonePositioner.positionNodes(nodes, coordinateSystem);
    
    // Optimize to avoid overlaps
    positionedNodes = ZonePositioner.optimizePositions(positionedNodes);
    
    logger.info(`Successfully positioned ${positionedNodes.length} nodes`);
    
    res.json({
      success: true,
      data: positionedNodes,
      metadata: {
        vehicleSignature,
        nodeCount: positionedNodes.length,
        zones: coordinateSystem.zones ? Object.keys(coordinateSystem.zones).length : 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Position calculation failed', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Position calculation failed',
      message: error.message
    });
  }
});

/**
 * Calculate wire routes between positioned nodes
 */
app.post('/routes', [
  body('nodes').isArray().withMessage('nodes must be an array'),
  body('edges').isArray().withMessage('edges must be an array'),
  body('coordinateSystem').isObject().withMessage('coordinateSystem must be an object')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { nodes, edges, coordinateSystem } = req.body;
    
    logger.info(`Routing ${edges.length} wires between ${nodes.length} nodes`);
    
    // Generate wire routes
    const routes = WireRouter.generateRoutes(nodes, edges, coordinateSystem);
    
    logger.info(`Successfully generated ${routes.length} wire routes`);
    
    res.json({
      success: true,
      data: routes,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        routeCount: routes.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Route calculation failed', { error: error.message, stack: error.stack });
    res.status(500).json({
      error: 'Route calculation failed',
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
  logger.info(`🚀 Layout service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;