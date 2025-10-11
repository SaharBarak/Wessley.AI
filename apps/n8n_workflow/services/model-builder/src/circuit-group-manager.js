/**
 * Circuit Group Manager
 * Organizes components and wires into circuit-based Three.js groups
 */

const THREE = require('three');

class CircuitGroupManager {
  
  constructor() {
    this.groupCache = new Map();
  }

  /**
   * Create circuit groups from components and wires
   */
  createCircuitGroups(circuits, componentMeshes, wireMeshes, nodes) {
    const circuitGroups = [];
    const usedMeshes = new Set();
    
    // Create groups for defined circuits
    circuits.forEach(circuit => {
      const group = this.createCircuitGroup(circuit, componentMeshes, wireMeshes, nodes);
      if (group) {
        circuitGroups.push(group);
        
        // Track which meshes are used
        group.traverse(child => {
          if (child.userData.nodeId || child.userData.edgeId) {
            usedMeshes.add(child.userData.nodeId || child.userData.edgeId);
          }
        });
      }
    });
    
    // Create group for unassigned components
    const unassignedGroup = this.createUnassignedGroup(componentMeshes, wireMeshes, usedMeshes);
    if (unassignedGroup) {
      circuitGroups.push(unassignedGroup);
    }
    
    return circuitGroups;
  }

  /**
   * Create a single circuit group
   */
  createCircuitGroup(circuit, componentMeshes, wireMeshes, nodes) {
    const group = new THREE.Group();
    group.name = `Circuit:${circuit.id}`;
    
    // Set group metadata
    group.userData = {
      circuitId: circuit.id,
      circuitLabel: circuit.label || circuit.id,
      circuitColor: circuit.color || '#FFFFFF',
      nodeCount: circuit.nodes?.length || 0,
      type: 'circuit_group',
      pickable: true,
      interactive: true,
      tooltip: this.generateCircuitTooltip(circuit)
    };
    
    // Add components belonging to this circuit
    const addedNodes = new Set();
    circuit.nodes?.forEach(nodeId => {
      const componentMesh = componentMeshes.find(mesh => mesh.userData.nodeId === nodeId);
      if (componentMesh && !addedNodes.has(nodeId)) {
        // Clone the mesh to avoid conflicts if node belongs to multiple circuits
        const clonedMesh = componentMesh.clone();
        clonedMesh.userData = { ...componentMesh.userData };
        clonedMesh.userData.parentCircuit = circuit.id;
        
        group.add(clonedMesh);
        addedNodes.add(nodeId);
      }
    });
    
    // Add wires connecting nodes in this circuit
    const circuitNodeSet = new Set(circuit.nodes || []);
    wireMeshes.forEach(wireMesh => {
      const edgeId = wireMesh.userData.edgeId;
      
      // Find the corresponding edge in the original graph
      const isCircuitWire = this.isWireInCircuit(edgeId, circuitNodeSet, nodes);
      
      if (isCircuitWire) {
        const clonedWire = wireMesh.clone();
        clonedWire.userData = { ...wireMesh.userData };
        clonedWire.userData.parentCircuit = circuit.id;
        
        // Apply circuit color tint to wire if specified
        if (circuit.color) {
          this.applyCircuitColorTint(clonedWire, circuit.color);
        }
        
        group.add(clonedWire);
      }
    });
    
    // Add circuit visualization helpers if needed
    if (group.children.length > 1) {
      this.addCircuitHelpers(group, circuit);
    }
    
    return group.children.length > 0 ? group : null;
  }

  /**
   * Create group for unassigned components and wires
   */
  createUnassignedGroup(componentMeshes, wireMeshes, usedMeshes) {
    const group = new THREE.Group();
    group.name = 'Circuit:Unassigned';
    
    group.userData = {
      circuitId: 'unassigned',
      circuitLabel: 'Unassigned Components',
      circuitColor: '#808080',
      type: 'circuit_group',
      pickable: true,
      interactive: true,
      tooltip: 'Components and wires not assigned to specific circuits'
    };
    
    // Add unassigned components
    componentMeshes.forEach(mesh => {
      if (!usedMeshes.has(mesh.userData.nodeId)) {
        const clonedMesh = mesh.clone();
        clonedMesh.userData = { ...mesh.userData };
        clonedMesh.userData.parentCircuit = 'unassigned';
        group.add(clonedMesh);
      }
    });
    
    // Add unassigned wires
    wireMeshes.forEach(mesh => {
      if (!usedMeshes.has(mesh.userData.edgeId)) {
        const clonedMesh = mesh.clone();
        clonedMesh.userData = { ...mesh.userData };
        clonedMesh.userData.parentCircuit = 'unassigned';
        group.add(clonedMesh);
      }
    });
    
    return group.children.length > 0 ? group : null;
  }

  /**
   * Check if a wire belongs to a circuit
   */
  isWireInCircuit(edgeId, circuitNodeSet, nodes) {
    // This is a simplified check - in a real implementation,
    // you would need access to the original edge data
    // For now, we'll assume all wires are part of circuits
    return true;
  }

  /**
   * Apply circuit color tint to wire
   */
  applyCircuitColorTint(wireMesh, circuitColor) {
    const tintColor = new THREE.Color(circuitColor);
    
    wireMesh.traverse(child => {
      if (child.isMesh && child.material) {
        // Create a new material with circuit color influence
        const originalColor = child.material.color;
        const tintedColor = originalColor.clone().lerp(tintColor, 0.3);
        
        if (child.material.clone) {
          child.material = child.material.clone();
          child.material.color = tintedColor;
        }
      }
    });
  }

  /**
   * Add circuit visualization helpers
   */
  addCircuitHelpers(group, circuit) {
    // Add circuit bounding box if specified
    if (circuit.showBoundingBox) {
      this.addCircuitBoundingBox(group, circuit);
    }
    
    // Add circuit label if specified
    if (circuit.showLabel) {
      this.addCircuitLabel(group, circuit);
    }
    
    // Add connection indicators
    this.addConnectionIndicators(group, circuit);
  }

  /**
   * Add visual bounding box for circuit
   */
  addCircuitBoundingBox(group, circuit) {
    // Calculate bounding box of all meshes in group
    const box = new THREE.Box3();
    group.children.forEach(child => {
      if (child.isMesh) {
        const childBox = new THREE.Box3().setFromObject(child);
        box.union(childBox);
      }
    });
    
    if (!box.isEmpty()) {
      // Create wireframe box
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      const boxGeometry = new THREE.BoxGeometry(size.x * 1.1, size.y * 1.1, size.z * 1.1);
      const boxMaterial = new THREE.MeshBasicMaterial({
        color: circuit.color || '#FFFFFF',
        wireframe: true,
        transparent: true,
        opacity: 0.3
      });
      
      const boundingBoxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      boundingBoxMesh.position.copy(center);
      boundingBoxMesh.name = `BoundingBox_${circuit.id}`;
      boundingBoxMesh.userData = {
        type: 'bounding_box',
        parentCircuit: circuit.id,
        pickable: false
      };
      
      group.add(boundingBoxMesh);
    }
  }

  /**
   * Add text label for circuit
   */
  addCircuitLabel(group, circuit) {
    // For now, add a simple plane with circuit info
    // In a real implementation, you might use a text geometry or canvas texture
    const labelGeometry = new THREE.PlaneGeometry(0.1, 0.02);
    const labelMaterial = new THREE.MeshBasicMaterial({
      color: circuit.color || '#FFFFFF',
      transparent: true,
      opacity: 0.8
    });
    
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    
    // Position label above the circuit
    const box = new THREE.Box3().setFromObject(group);
    if (!box.isEmpty()) {
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      labelMesh.position.set(center.x, center.y + size.y/2 + 0.05, center.z);
      labelMesh.lookAt(0, 0, 1); // Face towards camera
    }
    
    labelMesh.name = `Label_${circuit.id}`;
    labelMesh.userData = {
      type: 'label',
      text: circuit.label || circuit.id,
      parentCircuit: circuit.id,
      pickable: false
    };
    
    group.add(labelMesh);
  }

  /**
   * Add connection indicators between circuit components
   */
  addConnectionIndicators(group, circuit) {
    // Add subtle connection lines between components
    const components = [];
    group.children.forEach(child => {
      if (child.userData.nodeId) {
        components.push(child);
      }
    });
    
    if (components.length > 1) {
      const lineGeometry = new THREE.BufferGeometry();
      const positions = [];
      
      // Create connections between adjacent components
      for (let i = 0; i < components.length - 1; i++) {
        const start = components[i].position;
        const end = components[i + 1].position;
        
        positions.push(start.x, start.y, start.z);
        positions.push(end.x, end.y, end.z);
      }
      
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      const lineMaterial = new THREE.LineBasicMaterial({
        color: circuit.color || '#FFFFFF',
        transparent: true,
        opacity: 0.2
      });
      
      const connectionLines = new THREE.LineSegments(lineGeometry, lineMaterial);
      connectionLines.name = `Connections_${circuit.id}`;
      connectionLines.userData = {
        type: 'connection_indicator',
        parentCircuit: circuit.id,
        pickable: false
      };
      
      group.add(connectionLines);
    }
  }

  /**
   * Generate tooltip for circuit
   */
  generateCircuitTooltip(circuit) {
    const lines = [
      circuit.label || circuit.id,
      `Type: Circuit`,
      `Components: ${circuit.nodes?.length || 0}`
    ];
    
    if (circuit.function) {
      lines.push(`Function: ${circuit.function}`);
    }
    
    if (circuit.voltage) {
      lines.push(`Voltage: ${circuit.voltage}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Create hierarchical group structure
   */
  createHierarchicalGroups(circuits, componentMeshes, wireMeshes, nodes) {
    const rootGroup = new THREE.Group();
    rootGroup.name = 'ElectricalSystem';
    
    // Group circuits by system (e.g., power, lighting, engine)
    const systemGroups = this.groupCircuitsBySystem(circuits);
    
    Object.entries(systemGroups).forEach(([systemName, systemCircuits]) => {
      const systemGroup = new THREE.Group();
      systemGroup.name = `System:${systemName}`;
      systemGroup.userData = {
        systemName,
        circuitCount: systemCircuits.length,
        type: 'system_group'
      };
      
      systemCircuits.forEach(circuit => {
        const circuitGroup = this.createCircuitGroup(circuit, componentMeshes, wireMeshes, nodes);
        if (circuitGroup) {
          systemGroup.add(circuitGroup);
        }
      });
      
      if (systemGroup.children.length > 0) {
        rootGroup.add(systemGroup);
      }
    });
    
    return rootGroup;
  }

  /**
   * Group circuits by system type
   */
  groupCircuitsBySystem(circuits) {
    const systems = {
      power: [],
      lighting: [],
      engine: [],
      comfort: [],
      safety: [],
      other: []
    };
    
    circuits.forEach(circuit => {
      const systemType = this.detectSystemType(circuit);
      if (systems[systemType]) {
        systems[systemType].push(circuit);
      } else {
        systems.other.push(circuit);
      }
    });
    
    return systems;
  }

  /**
   * Detect system type from circuit properties
   */
  detectSystemType(circuit) {
    const name = (circuit.label || circuit.id).toLowerCase();
    const func = (circuit.function || '').toLowerCase();
    
    if (name.includes('power') || name.includes('battery') || name.includes('alternator')) {
      return 'power';
    } else if (name.includes('light') || name.includes('lamp') || name.includes('headlight')) {
      return 'lighting';
    } else if (name.includes('engine') || name.includes('ecu') || name.includes('sensor')) {
      return 'engine';
    } else if (name.includes('comfort') || name.includes('radio') || name.includes('hvac')) {
      return 'comfort';
    } else if (name.includes('safety') || name.includes('abs') || name.includes('airbag')) {
      return 'safety';
    }
    
    return 'other';
  }

  /**
   * Clear caches to free memory
   */
  clearCaches() {
    this.groupCache.clear();
  }
}

module.exports = CircuitGroupManager;