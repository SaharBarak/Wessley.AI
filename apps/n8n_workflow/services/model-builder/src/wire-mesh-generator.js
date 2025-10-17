/**
 * Wire Mesh Generator
 * Generates Three.js meshes for electrical wires from polyline routes
 */

const THREE = require('three');

class WireMeshGenerator {
  
  constructor() {
    this.materialCache = new Map();
    this.geometryCache = new Map();
  }

  /**
   * Generate meshes for all wire routes
   */
  async generateMeshes(routes, options = {}) {
    const meshes = [];
    
    for (const route of routes) {
      try {
        const mesh = await this.generateWireMesh(route, options);
        if (mesh) {
          meshes.push(mesh);
        }
      } catch (error) {
        console.warn(`Failed to generate wire mesh for route ${route.edgeId}:`, error.message);
      }
    }
    
    return meshes;
  }

  /**
   * Generate mesh for a single wire route
   */
  async generateWireMesh(route, options = {}) {
    if (!route.path || route.path.length < 2) {
      console.warn(`Invalid route path for edge ${route.edgeId}`);
      return null;
    }

    const geometry = this.createWireGeometry(route);
    const material = this.getWireMaterial(route);
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Set name and userData
    mesh.name = `Wire_${route.edgeId}`;
    mesh.userData = {
      edgeId: route.edgeId,
      wireType: 'electrical_wire',
      color: route.style?.color || '#000000',
      radius: route.style?.radius || 0.002,
      material: route.style?.material || 'copper',
      pathLength: this.calculatePathLength(route.path),
      pickable: true,
      interactive: true,
      tooltip: this.generateWireTooltip(route),
      wire: true
    };

    // Add wire insulation if specified
    if (options.showInsulation !== false) {
      this.addWireInsulation(mesh, route, options);
    }
    
    // Add connectors at endpoints if specified
    if (options.showConnectors) {
      this.addWireConnectors(mesh, route);
    }
    
    return mesh;
  }

  /**
   * Create wire geometry from path points
   */
  createWireGeometry(route) {
    const path = route.path;
    const radius = route.style?.radius || 0.002;
    const segments = route.style?.segments || 8;
    
    // Create curve from path points
    const points = path.map(point => new THREE.Vector3(point[0], point[1], point[2]));
    
    let curve;
    if (points.length === 2) {
      // Straight line
      curve = new THREE.LineCurve3(points[0], points[1]);
    } else if (points.length === 3) {
      // Quadratic curve
      curve = new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]);
    } else {
      // Catmull-Rom spline for multiple points
      curve = new THREE.CatmullRomCurve3(points);
    }
    
    // Create tube geometry along the curve
    const tubeGeometry = new THREE.TubeGeometry(
      curve,
      Math.max(16, Math.floor(this.calculatePathLength(path) * 100)), // Segments based on length
      radius,
      segments,
      false // Not closed
    );
    
    return tubeGeometry;
  }

  /**
   * Get material for wire
   */
  getWireMaterial(route) {
    const color = route.style?.color || '#000000';
    const material = route.style?.material || 'copper';
    const cacheKey = `wire_${material}_${color}`;
    
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey);
    }
    
    let wireMaterial;
    
    switch (material) {
      case 'copper':
        wireMaterial = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.9,
          roughness: 0.1,
          emissive: new THREE.Color(color).multiplyScalar(0.05)
        });
        break;
      case 'aluminum':
        wireMaterial = new THREE.MeshStandardMaterial({
          color: color,
          metalness: 0.8,
          roughness: 0.2
        });
        break;
      case 'fiber_optic':
        wireMaterial = new THREE.MeshPhysicalMaterial({
          color: color,
          metalness: 0.0,
          roughness: 0.1,
          transmission: 0.8,
          ior: 1.4,
          emissive: new THREE.Color(color).multiplyScalar(0.1)
        });
        break;
      default:
        wireMaterial = new THREE.MeshLambertMaterial({
          color: color
        });
    }
    
    this.materialCache.set(cacheKey, wireMaterial);
    return wireMaterial;
  }

  /**
   * Add wire insulation
   */
  addWireInsulation(wireMesh, route, options) {
    const insulationRadius = (route.style?.radius || 0.002) * 1.3;
    const insulationColor = this.getInsulationColor(route.style?.color || '#000000');
    
    // Create insulation geometry (slightly larger tube)
    const path = route.path;
    const points = path.map(point => new THREE.Vector3(point[0], point[1], point[2]));
    
    let curve;
    if (points.length === 2) {
      curve = new THREE.LineCurve3(points[0], points[1]);
    } else if (points.length === 3) {
      curve = new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]);
    } else {
      curve = new THREE.CatmullRomCurve3(points);
    }
    
    const insulationGeometry = new THREE.TubeGeometry(
      curve,
      Math.max(16, Math.floor(this.calculatePathLength(path) * 100)),
      insulationRadius,
      8,
      false
    );
    
    const insulationMaterial = new THREE.MeshLambertMaterial({
      color: insulationColor,
      transparent: true,
      opacity: 0.8
    });
    
    const insulationMesh = new THREE.Mesh(insulationGeometry, insulationMaterial);
    insulationMesh.name = `Insulation_${route.edgeId}`;
    insulationMesh.userData = {
      type: 'insulation',
      parentWire: route.edgeId
    };
    
    wireMesh.add(insulationMesh);
  }

  /**
   * Get insulation color based on wire color
   */
  getInsulationColor(wireColor) {
    // Map wire colors to typical insulation colors
    const insulationMap = {
      '#FF0000': '#FF6666', // Red wire -> Light red insulation
      '#000000': '#333333', // Black wire -> Dark gray insulation
      '#0000FF': '#6666FF', // Blue wire -> Light blue insulation
      '#00FF00': '#66FF66', // Green wire -> Light green insulation
      '#FFFF00': '#FFFF66', // Yellow wire -> Light yellow insulation
      '#FFFFFF': '#F0F0F0', // White wire -> Off-white insulation
      '#FFA500': '#FFB366', // Orange wire -> Light orange insulation
      '#800080': '#B366B3'  // Purple wire -> Light purple insulation
    };
    
    return insulationMap[wireColor.toUpperCase()] || '#CCCCCC';
  }

  /**
   * Add connectors at wire endpoints
   */
  addWireConnectors(wireMesh, route) {
    const connectorGeometry = new THREE.CylinderGeometry(0.003, 0.003, 0.008, 8);
    const connectorMaterial = new THREE.MeshStandardMaterial({
      color: '#C0C0C0', // Silver
      metalness: 0.9,
      roughness: 0.1
    });
    
    // Start connector
    const startConnector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    const startPoint = route.path[0];
    startConnector.position.set(startPoint[0], startPoint[1], startPoint[2]);
    startConnector.name = `Connector_Start_${route.edgeId}`;
    startConnector.userData = {
      type: 'connector',
      position: 'start',
      parentWire: route.edgeId
    };
    wireMesh.add(startConnector);
    
    // End connector
    const endConnector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    const endPoint = route.path[route.path.length - 1];
    endConnector.position.set(endPoint[0], endPoint[1], endPoint[2]);
    endConnector.name = `Connector_End_${route.edgeId}`;
    endConnector.userData = {
      type: 'connector',
      position: 'end',
      parentWire: route.edgeId
    };
    wireMesh.add(endConnector);
  }

  /**
   * Calculate total path length
   */
  calculatePathLength(path) {
    let totalLength = 0;
    
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      
      const dx = curr[0] - prev[0];
      const dy = curr[1] - prev[1];
      const dz = curr[2] - prev[2];
      
      totalLength += Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    
    return totalLength;
  }

  /**
   * Generate tooltip for wire
   */
  generateWireTooltip(route) {
    const lines = [
      `Wire: ${route.edgeId}`,
      `Material: ${route.style?.material || 'copper'}`,
      `Radius: ${((route.style?.radius || 0.002) * 1000).toFixed(1)}mm`,
      `Length: ${(this.calculatePathLength(route.path) * 1000).toFixed(0)}mm`
    ];
    
    if (route.style?.color) {
      lines.push(`Color: ${route.style.color}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Create wire bundle for multiple wires
   */
  createWireBundle(routes, bundleOptions = {}) {
    const bundleGroup = new THREE.Group();
    bundleGroup.name = `WireBundle_${bundleOptions.id || 'bundle'}`;
    
    // Offset wires slightly to prevent z-fighting
    routes.forEach((route, index) => {
      const wireMesh = this.generateWireMesh(route, bundleOptions);
      if (wireMesh) {
        // Add small random offset to prevent overlap
        const offset = (index - routes.length / 2) * 0.001;
        wireMesh.position.add(new THREE.Vector3(offset, offset * 0.5, offset * 0.3));
        bundleGroup.add(wireMesh);
      }
    });
    
    bundleGroup.userData = {
      type: 'wire_bundle',
      wireCount: routes.length,
      bundleId: bundleOptions.id
    };
    
    return bundleGroup;
  }

  /**
   * Create wire harness with protective sleeve
   */
  createWireHarness(routes, harnessOptions = {}) {
    const harness = this.createWireBundle(routes, harnessOptions);
    
    // Add protective sleeve if specified
    if (harnessOptions.showSleeve !== false && routes.length > 0) {
      const sleeveGeometry = this.createSleeveGeometry(routes);
      const sleeveMaterial = new THREE.MeshLambertMaterial({
        color: harnessOptions.sleeveColor || '#333333',
        transparent: true,
        opacity: 0.6
      });
      
      const sleeveMesh = new THREE.Mesh(sleeveGeometry, sleeveMaterial);
      sleeveMesh.name = 'ProtectiveSleeve';
      sleeveMesh.userData = { type: 'protective_sleeve' };
      
      harness.add(sleeveMesh);
    }
    
    return harness;
  }

  /**
   * Create protective sleeve geometry
   */
  createSleeveGeometry(routes) {
    // Find the longest route to use as the base path
    let longestRoute = routes[0];
    let maxLength = 0;
    
    routes.forEach(route => {
      const length = this.calculatePathLength(route.path);
      if (length > maxLength) {
        maxLength = length;
        longestRoute = route;
      }
    });
    
    // Create sleeve along the longest route
    const points = longestRoute.path.map(point => new THREE.Vector3(point[0], point[1], point[2]));
    const curve = new THREE.CatmullRomCurve3(points);
    
    // Sleeve radius based on number of wires
    const sleeveRadius = Math.max(0.005, Math.sqrt(routes.length) * 0.003);
    
    return new THREE.TubeGeometry(
      curve,
      Math.max(16, Math.floor(maxLength * 100)),
      sleeveRadius,
      8,
      false
    );
  }

  /**
   * Clear caches to free memory
   */
  clearCaches() {
    this.materialCache.clear();
    this.geometryCache.clear();
  }
}

module.exports = WireMeshGenerator;