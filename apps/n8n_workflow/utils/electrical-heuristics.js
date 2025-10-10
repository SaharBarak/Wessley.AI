/**
 * Electrical System Heuristics
 * Advanced heuristics for automotive electrical system analysis
 */

/**
 * Automotive electrical system patterns and heuristics
 */
class ElectricalSystemHeuristics {
  
  /**
   * Analyze power distribution architecture
   */
  static analyzePowerDistribution(graph) {
    const batteries = graph.nodes.filter(n => n.type === 'battery');
    const fuses = graph.nodes.filter(n => n.type === 'fuse');
    const connectors = graph.nodes.filter(n => n.type === 'connector');
    
    const analysis = {
      architecture: 'unknown',
      mainDistributionPoints: [],
      powerPaths: [],
      redundancy: 'none',
      confidence: 0.5
    };
    
    if (batteries.length === 0) {
      return { ...analysis, confidence: 0 };
    }
    
    // Identify main distribution architecture
    const mainFuseBox = fuses.find(f => 
      f.label?.toLowerCase().includes('main') || 
      f.label?.toLowerCase().includes('master') ||
      f.label?.toLowerCase().includes('primary')
    );
    
    if (mainFuseBox) {
      analysis.architecture = 'centralized';
      analysis.mainDistributionPoints.push(mainFuseBox.id);
      analysis.confidence += 0.2;
    }
    
    // Check for distributed architecture
    const distributionConnectors = connectors.filter(c =>
      c.label?.toLowerCase().includes('distribution') ||
      c.label?.toLowerCase().includes('junction') ||
      c.label?.toLowerCase().includes('block')
    );
    
    if (distributionConnectors.length > 2) {
      analysis.architecture = analysis.architecture === 'centralized' ? 'hybrid' : 'distributed';
      analysis.mainDistributionPoints.push(...distributionConnectors.map(c => c.id));
      analysis.confidence += 0.1;
    }
    
    // Analyze power paths from battery
    batteries.forEach(battery => {
      const powerPath = this.tracePowerPath(graph, battery.id, 3); // max 3 hops
      if (powerPath.length > 1) {
        analysis.powerPaths.push({
          source: battery.id,
          path: powerPath,
          length: powerPath.length
        });
      }
    });
    
    // Check for redundancy
    if (batteries.length > 1) {
      analysis.redundancy = 'multiple_sources';
    } else if (analysis.powerPaths.length > 1) {
      analysis.redundancy = 'multiple_paths';
    }
    
    return analysis;
  }
  
  /**
   * Trace power distribution path from source
   */
  static tracePowerPath(graph, sourceId, maxDepth = 5) {
    const visited = new Set();
    const path = [];
    
    function dfs(nodeId, depth) {
      if (depth >= maxDepth || visited.has(nodeId)) {
        return;
      }
      
      visited.add(nodeId);
      path.push(nodeId);
      
      const node = graph.nodes.find(n => n.id === nodeId);
      if (!node) return;
      
      // Continue tracing through distribution components
      const distributionTypes = ['fuse', 'connector', 'relay'];
      if (distributionTypes.includes(node.type) || depth === 0) {
        const outgoingEdges = graph.edges.filter(e => e.from === nodeId);
        outgoingEdges.forEach(edge => {
          const targetNode = graph.nodes.find(n => n.id === edge.to);
          if (targetNode && distributionTypes.includes(targetNode.type)) {
            dfs(edge.to, depth + 1);
          }
        });
      }
    }
    
    dfs(sourceId, 0);
    return path;
  }
  
  /**
   * Identify circuit families and groupings
   */
  static identifyCircuitFamilies(graph) {
    const families = {
      power_distribution: [],
      lighting: [],
      engine_management: [],
      body_control: [],
      safety_systems: [],
      comfort_convenience: [],
      unknown: []
    };
    
    graph.nodes.forEach(node => {
      const family = this.classifyComponentFamily(node);
      if (families[family]) {
        families[family].push(node.id);
      } else {
        families.unknown.push(node.id);
      }
    });
    
    // Analyze circuit relationships within families
    const familyAnalysis = {};
    Object.entries(families).forEach(([family, nodeIds]) => {
      if (nodeIds.length > 0) {
        familyAnalysis[family] = this.analyzeCircuitFamily(graph, nodeIds);
      }
    });
    
    return { families, analysis: familyAnalysis };
  }
  
  /**
   * Classify component into electrical system family
   */
  static classifyComponentFamily(node) {
    const type = node.type;
    const label = node.label?.toLowerCase() || '';
    const notes = node.notes?.toLowerCase() || '';
    const context = `${label} ${notes}`;
    
    // Power distribution
    if (type === 'battery' || 
        (type === 'fuse' && context.includes('main')) ||
        context.includes('distribution') ||
        context.includes('power supply')) {
      return 'power_distribution';
    }
    
    // Lighting systems
    if (type === 'lamp' ||
        context.includes('light') ||
        context.includes('headlamp') ||
        context.includes('taillight') ||
        context.includes('indicator') ||
        context.includes('brake light')) {
      return 'lighting';
    }
    
    // Engine management
    if ((type === 'ecu' && context.includes('engine')) ||
        (type === 'sensor' && (context.includes('engine') || context.includes('fuel') || context.includes('ignition'))) ||
        context.includes('injection') ||
        context.includes('ignition') ||
        context.includes('fuel pump') ||
        context.includes('starter')) {
      return 'engine_management';
    }
    
    // Body control
    if (context.includes('door') ||
        context.includes('window') ||
        context.includes('mirror') ||
        context.includes('seat') ||
        context.includes('central lock') ||
        (type === 'ecu' && context.includes('body'))) {
      return 'body_control';
    }
    
    // Safety systems
    if (context.includes('abs') ||
        context.includes('airbag') ||
        context.includes('brake') ||
        context.includes('safety') ||
        context.includes('srs') ||
        context.includes('stability')) {
      return 'safety_systems';
    }
    
    // Comfort and convenience
    if (context.includes('air condition') ||
        context.includes('hvac') ||
        context.includes('radio') ||
        context.includes('navigation') ||
        context.includes('infotainment') ||
        context.includes('climate')) {
      return 'comfort_convenience';
    }
    
    return 'unknown';
  }
  
  /**
   * Analyze circuit family characteristics
   */
  static analyzeCircuitFamily(graph, nodeIds) {
    const familyNodes = graph.nodes.filter(n => nodeIds.includes(n.id));
    const familyEdges = graph.edges.filter(e => 
      nodeIds.includes(e.from) && nodeIds.includes(e.to)
    );
    
    // Calculate connectivity metrics
    const connectivity = familyEdges.length / Math.max(1, familyNodes.length - 1);
    
    // Identify key components
    const componentCounts = {};
    familyNodes.forEach(node => {
      componentCounts[node.type] = (componentCounts[node.type] || 0) + 1;
    });
    
    // Calculate power requirements
    const estimatedPower = familyNodes.reduce((total, node) => {
      const current = this.estimateComponentCurrent(node);
      return total + current.typical;
    }, 0);
    
    // Identify potential issues
    const issues = [];
    if (connectivity < 0.5 && familyNodes.length > 2) {
      issues.push('Low connectivity within family');
    }
    if (estimatedPower > 50 && !componentCounts.fuse) {
      issues.push('High power family without protection');
    }
    
    return {
      nodeCount: familyNodes.length,
      connectivity: Math.round(connectivity * 100) / 100,
      componentTypes: componentCounts,
      estimatedPower: Math.round(estimatedPower * 10) / 10,
      issues
    };
  }
  
  /**
   * Estimate component current draw
   */
  static estimateComponentCurrent(component) {
    const type = component.type;
    const label = component.label?.toLowerCase() || '';
    
    // Component-specific current estimates (in Amperes)
    const estimates = {
      'battery': { min: 0, max: 0, typical: 0 }, // Source, not load
      'lamp': { min: 1, max: 15, typical: 5 },
      'motor': { min: 2, max: 150, typical: 10 },
      'ecu': { min: 0.05, max: 2, typical: 0.3 },
      'sensor': { min: 0.001, max: 0.1, typical: 0.02 },
      'actuator': { min: 0.5, max: 20, typical: 3 },
      'relay': { min: 0.05, max: 0.3, typical: 0.15 },
      'fuse': { min: 0, max: 0, typical: 0 }, // Protection, not load
      'connector': { min: 0, max: 0, typical: 0 }, // Connection, not load
      'ground': { min: 0, max: 0, typical: 0 }, // Reference, not load
      'terminal': { min: 0, max: 0, typical: 0 }, // Connection, not load
      'splice': { min: 0, max: 0, typical: 0 } // Connection, not load
    };
    
    let estimate = estimates[type] || { min: 0, max: 5, typical: 1 };
    
    // Adjust based on label context
    if (label.includes('starter')) {
      estimate = { min: 80, max: 300, typical: 150 };
    } else if (label.includes('headlight') || label.includes('main beam')) {
      estimate = { min: 5, max: 12, typical: 8 };
    } else if (label.includes('fog') || label.includes('auxiliary')) {
      estimate = { min: 3, max: 8, typical: 5 };
    } else if (label.includes('fan') && type === 'motor') {
      estimate = { min: 8, max: 25, typical: 15 };
    } else if (label.includes('fuel pump')) {
      estimate = { min: 2, max: 6, typical: 4 };
    } else if (label.includes('air condition') || label.includes('compressor')) {
      estimate = { min: 10, max: 40, typical: 20 };
    }
    
    return estimate;
  }
  
  /**
   * Analyze load distribution and balance
   */
  static analyzeLoadDistribution(graph) {
    const analysis = {
      totalLoad: 0,
      loadByZone: {},
      loadByCircuit: {},
      criticalLoads: [],
      recommendations: []
    };
    
    // Calculate total system load
    graph.nodes.forEach(node => {
      const current = this.estimateComponentCurrent(node);
      analysis.totalLoad += current.typical;
      
      // Group by zone
      const zone = node.zone || 'unknown';
      analysis.loadByZone[zone] = (analysis.loadByZone[zone] || 0) + current.typical;
      
      // Identify critical loads
      if (current.typical > 20) {
        analysis.criticalLoads.push({
          id: node.id,
          type: node.type,
          label: node.label,
          current: current.typical
        });
      }
    });
    
    // Analyze circuit loads
    if (graph.circuits) {
      graph.circuits.forEach(circuit => {
        const circuitNodes = (circuit.nodes || []).map(id => 
          graph.nodes.find(n => n.id === id)
        ).filter(Boolean);
        
        const circuitLoad = circuitNodes.reduce((total, node) => {
          return total + this.estimateComponentCurrent(node).typical;
        }, 0);
        
        analysis.loadByCircuit[circuit.id] = {
          load: circuitLoad,
          nodeCount: circuitNodes.length,
          type: circuit.type || 'unknown'
        };
      });
    }
    
    // Generate recommendations
    if (analysis.totalLoad > 100) {
      analysis.recommendations.push('High total system load - verify alternator capacity');
    }
    
    Object.entries(analysis.loadByZone).forEach(([zone, load]) => {
      if (load > 30) {
        analysis.recommendations.push(`High load in ${zone} zone (${Math.round(load)}A) - check wiring capacity`);
      }
    });
    
    if (analysis.criticalLoads.length > 3) {
      analysis.recommendations.push('Multiple high-current loads - consider load management strategy');
    }
    
    // Round values for readability
    analysis.totalLoad = Math.round(analysis.totalLoad * 10) / 10;
    Object.keys(analysis.loadByZone).forEach(zone => {
      analysis.loadByZone[zone] = Math.round(analysis.loadByZone[zone] * 10) / 10;
    });
    
    return analysis;
  }
  
  /**
   * Detect common automotive electrical patterns
   */
  static detectCommonPatterns(graph) {
    const patterns = [];
    
    // Pattern 1: Starter circuit
    const starterPattern = this.detectStarterCircuit(graph);
    if (starterPattern.detected) {
      patterns.push({
        type: 'starter_circuit',
        confidence: starterPattern.confidence,
        components: starterPattern.components,
        description: 'High-current starting system'
      });
    }
    
    // Pattern 2: Charging system
    const chargingPattern = this.detectChargingCircuit(graph);
    if (chargingPattern.detected) {
      patterns.push({
        type: 'charging_circuit',
        confidence: chargingPattern.confidence,
        components: chargingPattern.components,
        description: 'Battery charging system'
      });
    }
    
    // Pattern 3: Relay control circuits
    const relayPatterns = this.detectRelayPatterns(graph);
    patterns.push(...relayPatterns);
    
    // Pattern 4: CAN bus networks
    const canPattern = this.detectCanBusNetwork(graph);
    if (canPattern.detected) {
      patterns.push({
        type: 'can_bus_network',
        confidence: canPattern.confidence,
        components: canPattern.components,
        description: 'Controller Area Network communication'
      });
    }
    
    return patterns;
  }
  
  /**
   * Detect starter circuit pattern
   */
  static detectStarterCircuit(graph) {
    const starterComponents = graph.nodes.filter(node =>
      node.label?.toLowerCase().includes('starter') ||
      (node.type === 'motor' && node.label?.toLowerCase().includes('start'))
    );
    
    if (starterComponents.length === 0) {
      return { detected: false, confidence: 0 };
    }
    
    let confidence = 0.3;
    const components = [];
    
    starterComponents.forEach(starter => {
      components.push(starter.id);
      
      // Look for battery connection
      const starterEdges = graph.edges.filter(e => e.from === starter.id || e.to === starter.id);
      const connectedNodes = starterEdges.map(edge => {
        const otherNodeId = edge.from === starter.id ? edge.to : edge.from;
        return graph.nodes.find(n => n.id === otherNodeId);
      }).filter(Boolean);
      
      const hasBattery = connectedNodes.some(n => n.type === 'battery');
      const hasRelay = connectedNodes.some(n => n.type === 'relay');
      const hasHeavyWire = starterEdges.some(e => 
        e.wire?.gauge && ['10mm²', '16mm²', '25mm²'].includes(e.wire.gauge)
      );
      
      if (hasBattery) confidence += 0.3;
      if (hasRelay) confidence += 0.2;
      if (hasHeavyWire) confidence += 0.2;
      
      components.push(...connectedNodes.map(n => n.id));
    });
    
    return {
      detected: confidence > 0.5,
      confidence: Math.min(confidence, 1.0),
      components: [...new Set(components)]
    };
  }
  
  /**
   * Detect charging circuit pattern
   */
  static detectChargingCircuit(graph) {
    const alternatorComponents = graph.nodes.filter(node =>
      node.label?.toLowerCase().includes('alternator') ||
      node.label?.toLowerCase().includes('generator')
    );
    
    const batteries = graph.nodes.filter(n => n.type === 'battery');
    
    if (alternatorComponents.length === 0 || batteries.length === 0) {
      return { detected: false, confidence: 0 };
    }
    
    let confidence = 0.4;
    const components = [...alternatorComponents.map(a => a.id), ...batteries.map(b => b.id)];
    
    // Check for connections between alternator and battery
    alternatorComponents.forEach(alternator => {
      batteries.forEach(battery => {
        const hasConnection = graph.edges.some(edge =>
          (edge.from === alternator.id && edge.to === battery.id) ||
          (edge.from === battery.id && edge.to === alternator.id)
        );
        
        if (hasConnection) {
          confidence += 0.3;
        }
      });
    });
    
    return {
      detected: confidence > 0.5,
      confidence: Math.min(confidence, 1.0),
      components
    };
  }
  
  /**
   * Detect relay control patterns
   */
  static detectRelayPatterns(graph) {
    const relays = graph.nodes.filter(n => n.type === 'relay');
    const patterns = [];
    
    relays.forEach(relay => {
      const relayEdges = graph.edges.filter(e => e.from === relay.id || e.to === relay.id);
      const connectedNodes = relayEdges.map(edge => {
        const otherNodeId = edge.from === relay.id ? edge.to : edge.from;
        return graph.nodes.find(n => n.id === otherNodeId);
      }).filter(Boolean);
      
      const hasControlInput = connectedNodes.some(n => 
        n.type === 'ecu' || n.type === 'sensor' || 
        n.label?.toLowerCase().includes('control')
      );
      
      const hasPowerOutput = connectedNodes.some(n =>
        ['motor', 'lamp', 'actuator'].includes(n.type)
      );
      
      if (hasControlInput && hasPowerOutput && relayEdges.length >= 4) {
        patterns.push({
          type: 'relay_control',
          confidence: 0.8,
          components: [relay.id, ...connectedNodes.map(n => n.id)],
          description: `Relay control for ${relay.label || 'unknown load'}`
        });
      }
    });
    
    return patterns;
  }
  
  /**
   * Detect CAN bus network pattern
   */
  static detectCanBusNetwork(graph) {
    const ecus = graph.nodes.filter(n => n.type === 'ecu');
    
    if (ecus.length < 2) {
      return { detected: false, confidence: 0 };
    }
    
    // Look for CAN-specific connections or labels
    const canConnections = graph.edges.filter(edge => {
      const label = edge.label?.toLowerCase() || '';
      const notes = edge.notes?.toLowerCase() || '';
      return label.includes('can') || notes.includes('can') || 
             label.includes('bus') || notes.includes('data');
    });
    
    const canNodes = graph.nodes.filter(node => {
      const label = node.label?.toLowerCase() || '';
      const notes = node.notes?.toLowerCase() || '';
      return label.includes('can') || notes.includes('can') ||
             label.includes('gateway') || label.includes('bus');
    });
    
    let confidence = 0;
    if (canConnections.length > 0) confidence += 0.4;
    if (canNodes.length > 0) confidence += 0.3;
    if (ecus.length >= 3) confidence += 0.3;
    
    return {
      detected: confidence > 0.5,
      confidence: Math.min(confidence, 1.0),
      components: [...ecus.map(e => e.id), ...canNodes.map(n => n.id)]
    };
  }
}

module.exports = {
  ElectricalSystemHeuristics
};