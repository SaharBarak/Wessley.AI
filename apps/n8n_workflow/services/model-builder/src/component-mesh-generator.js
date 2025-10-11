/**
 * Component Mesh Generator
 * Generates Three.js meshes for electrical components
 */

const THREE = require('three');

class ComponentMeshGenerator {
  
  constructor() {
    this.materialCache = new Map();
    this.geometryCache = new Map();
  }

  /**
   * Generate meshes for all components
   */
  async generateMeshes(nodes, options = {}) {
    const meshes = [];
    
    for (const node of nodes) {
      try {
        const mesh = await this.generateComponentMesh(node, options);
        if (mesh) {
          meshes.push(mesh);
        }
      } catch (error) {
        console.warn(`Failed to generate mesh for node ${node.id}:`, error.message);
      }
    }
    
    return meshes;
  }

  /**
   * Generate mesh for a single component
   */
  async generateComponentMesh(node, options = {}) {
    const geometry = this.getGeometry(node.mesh?.geometry || node.type, node);
    const material = this.getMaterial(node.mesh?.material || 'plastic', node);
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Set transform
    mesh.position.set(...(node.position || [0, 0, 0]));
    mesh.rotation.set(...(node.rotation || [0, 0, 0]));
    mesh.scale.set(...(node.scale || [1, 1, 1]));
    
    // Set name and userData
    mesh.name = `Component_${node.id}`;
    mesh.userData = {
      nodeId: node.id,
      nodeType: node.type,
      label: node.label,
      zone: node.zone,
      circuits: node.circuits || [],
      pickable: true,
      interactive: true,
      tooltip: this.generateTooltip(node),
      metadata: node.mesh?.userData || {},
      component: true
    };

    // Add children for complex components
    this.addComponentDetails(mesh, node, options);
    
    return mesh;
  }

  /**
   * Get geometry for component type
   */
  getGeometry(geometryType, node) {
    const cacheKey = `${geometryType}_${this.getGeometryParams(node)}`;
    
    if (this.geometryCache.has(cacheKey)) {
      return this.geometryCache.get(cacheKey);
    }
    
    let geometry;
    
    switch (geometryType) {
      case 'box':
        geometry = this.createBoxGeometry(node);
        break;
      case 'cylinder':
        geometry = this.createCylinderGeometry(node);
        break;
      case 'sphere':
        geometry = this.createSphereGeometry(node);
        break;
      case 'custom':
        geometry = this.createCustomGeometry(node);
        break;
      default:
        geometry = this.createBoxGeometry(node); // Default fallback
    }
    
    this.geometryCache.set(cacheKey, geometry);
    return geometry;
  }

  /**
   * Create box geometry with component-specific dimensions
   */
  createBoxGeometry(node) {
    const dimensions = this.getComponentDimensions(node);
    return new THREE.BoxGeometry(dimensions.width, dimensions.height, dimensions.depth);
  }

  /**
   * Create cylinder geometry for cylindrical components
   */
  createCylinderGeometry(node) {
    const dimensions = this.getComponentDimensions(node);
    const radius = Math.min(dimensions.width, dimensions.depth) / 2;
    return new THREE.CylinderGeometry(radius, radius, dimensions.height, 16);
  }

  /**
   * Create sphere geometry for rounded components
   */
  createSphereGeometry(node) {
    const dimensions = this.getComponentDimensions(node);
    const radius = Math.min(dimensions.width, dimensions.height, dimensions.depth) / 2;
    return new THREE.SphereGeometry(radius, 16, 12);
  }

  /**
   * Create custom geometry for specialized components
   */
  createCustomGeometry(node) {
    // For now, return a box - could be extended for specific component shapes
    return this.createBoxGeometry(node);
  }

  /**
   * Get component dimensions based on type
   */
  getComponentDimensions(node) {
    const dimensionMap = {
      battery: { width: 0.3, height: 0.2, depth: 0.15 },
      fuse: { width: 0.02, height: 0.05, depth: 0.02 },
      relay: { width: 0.04, height: 0.06, depth: 0.04 },
      connector: { width: 0.06, height: 0.04, depth: 0.03 },
      ecu: { width: 0.15, height: 0.08, depth: 0.12 },
      sensor: { width: 0.03, height: 0.03, depth: 0.03 },
      actuator: { width: 0.08, height: 0.12, depth: 0.08 },
      lamp: { width: 0.1, height: 0.1, depth: 0.05 },
      motor: { width: 0.12, height: 0.15, depth: 0.12 },
      splice: { width: 0.01, height: 0.01, depth: 0.01 },
      ground: { width: 0.02, height: 0.02, depth: 0.02 },
      terminal: { width: 0.015, height: 0.03, depth: 0.015 }
    };
    
    return dimensionMap[node.type] || { width: 0.05, height: 0.05, depth: 0.05 };
  }

  /**
   * Get material for component
   */
  getMaterial(materialType, node) {
    const color = node.mesh?.color || this.getDefaultColor(node.type);
    const cacheKey = `${materialType}_${color}`;
    
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey);
    }
    
    let material;
    
    switch (materialType) {
      case 'plastic':
        material = new THREE.MeshLambertMaterial({
          color: color,
          transparent: false,
          roughness: 0.8,
          metalness: 0.1
        });
        break;
      case 'metal':
        material = new THREE.MeshStandardMaterial({
          color: color,
          transparent: false,
          roughness: 0.3,
          metalness: 0.8
        });
        break;
      case 'glass':
        material = new THREE.MeshPhysicalMaterial({
          color: color,
          transparent: true,
          opacity: 0.7,
          roughness: 0.1,
          metalness: 0.0,
          transmission: 0.9,
          ior: 1.5
        });
        break;
      case 'ceramic':
        material = new THREE.MeshLambertMaterial({
          color: color,
          transparent: false,
          roughness: 0.9,
          metalness: 0.0
        });
        break;
      default:
        material = new THREE.MeshLambertMaterial({
          color: color,
          transparent: false
        });
    }
    
    this.materialCache.set(cacheKey, material);
    return material;
  }

  /**
   * Get default color for component type
   */
  getDefaultColor(componentType) {
    const colorMap = {
      battery: '#FF4500',    // Orange Red
      fuse: '#FF6B6B',       // Red
      relay: '#4ECDC4',      // Teal
      connector: '#45B7D1',  // Blue
      ecu: '#96CEB4',        // Green
      sensor: '#FFEAA7',     // Yellow
      actuator: '#DDA0DD',   // Plum
      lamp: '#F0E68C',       // Khaki
      motor: '#20B2AA',      // Light Sea Green
      splice: '#FFA07A',     // Light Salmon
      ground: '#A0A0A0',     // Gray
      terminal: '#C0C0C0'    // Silver
    };
    
    return colorMap[componentType] || '#808080';
  }

  /**
   * Add component-specific details
   */
  addComponentDetails(mesh, node, options) {
    // Add pins for connectors
    if (node.type === 'connector' && node.metadata?.specifications?.pinCount) {
      this.addConnectorPins(mesh, node.metadata.specifications.pinCount);
    }
    
    // Add terminals for batteries
    if (node.type === 'battery') {
      this.addBatteryTerminals(mesh);
    }
    
    // Add indicator LED for ECUs
    if (node.type === 'ecu') {
      this.addECUIndicator(mesh);
    }
  }

  /**
   * Add connector pins
   */
  addConnectorPins(mesh, pinCount) {
    const pinGeometry = new THREE.CylinderGeometry(0.001, 0.001, 0.01, 8);
    const pinMaterial = new THREE.MeshStandardMaterial({ 
      color: '#FFD700', // Gold
      metalness: 0.9,
      roughness: 0.1
    });
    
    const pinsPerRow = Math.ceil(Math.sqrt(pinCount));
    const spacing = 0.005;
    
    for (let i = 0; i < pinCount; i++) {
      const pin = new THREE.Mesh(pinGeometry, pinMaterial);
      const row = Math.floor(i / pinsPerRow);
      const col = i % pinsPerRow;
      
      pin.position.set(
        (col - pinsPerRow/2) * spacing,
        0.02,
        (row - pinsPerRow/2) * spacing
      );
      pin.name = `Pin_${i + 1}`;
      pin.userData = { pinNumber: i + 1, type: 'pin' };
      
      mesh.add(pin);
    }
  }

  /**
   * Add battery terminals
   */
  addBatteryTerminals(mesh) {
    const terminalGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.02, 12);
    
    // Positive terminal
    const posTerminal = new THREE.Mesh(
      terminalGeometry,
      new THREE.MeshStandardMaterial({ color: '#FF0000', metalness: 0.8 })
    );
    posTerminal.position.set(0.08, 0.12, 0);
    posTerminal.name = 'PositiveTerminal';
    posTerminal.userData = { terminal: 'positive', voltage: '+12V' };
    mesh.add(posTerminal);
    
    // Negative terminal
    const negTerminal = new THREE.Mesh(
      terminalGeometry,
      new THREE.MeshStandardMaterial({ color: '#000000', metalness: 0.8 })
    );
    negTerminal.position.set(-0.08, 0.12, 0);
    negTerminal.name = 'NegativeTerminal';
    negTerminal.userData = { terminal: 'negative', voltage: 'Ground' };
    mesh.add(negTerminal);
  }

  /**
   * Add ECU status indicator
   */
  addECUIndicator(mesh) {
    const indicatorGeometry = new THREE.SphereGeometry(0.003, 8, 6);
    const indicatorMaterial = new THREE.MeshBasicMaterial({ 
      color: '#00FF00', // Green
      emissive: '#004400'
    });
    
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.set(0.06, 0.04, 0.05);
    indicator.name = 'StatusIndicator';
    indicator.userData = { type: 'indicator', status: 'active' };
    
    mesh.add(indicator);
  }

  /**
   * Generate tooltip text for component
   */
  generateTooltip(node) {
    const lines = [
      `${node.label || node.id}`,
      `Type: ${node.type}`,
      `Zone: ${node.zone || 'Unknown'}`
    ];
    
    if (node.metadata?.specifications) {
      const specs = node.metadata.specifications;
      if (specs.voltage) lines.push(`Voltage: ${specs.voltage}`);
      if (specs.current) lines.push(`Current: ${specs.current}`);
      if (specs.power) lines.push(`Power: ${specs.power}`);
      if (specs.pinCount) lines.push(`Pins: ${specs.pinCount}`);
    }
    
    if (node.circuits && node.circuits.length > 0) {
      lines.push(`Circuits: ${node.circuits.length}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Get geometry parameters for caching
   */
  getGeometryParams(node) {
    const dimensions = this.getComponentDimensions(node);
    return `${dimensions.width}_${dimensions.height}_${dimensions.depth}`;
  }

  /**
   * Clear caches to free memory
   */
  clearCaches() {
    this.materialCache.clear();
    this.geometryCache.clear();
  }
}

module.exports = ComponentMeshGenerator;