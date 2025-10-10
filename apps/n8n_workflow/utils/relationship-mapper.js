/**
 * Component Relationship Mapper
 * Maps and analyzes relationships between electrical components
 */

/**
 * Electrical component relationship mapper
 */
class RelationshipMapper {
  
  constructor() {
    // Define typical automotive electrical relationships
    this.componentRelationships = {
      'battery': {
        typical_connections: ['fuse', 'connector', 'ground', 'relay'],
        forbidden_direct: ['lamp', 'motor', 'ecu'], // Should go through protection
        max_connections: 6,
        min_connections: 2,
        connection_types: {
          'fuse': 'protection',
          'connector': 'distribution',
          'ground': 'return_path',
          'relay': 'switched_power'
        }
      },
      'fuse': {
        typical_connections: ['battery', 'connector', 'ecu', 'lamp', 'motor', 'relay'],
        connection_limit: 3, // Typically input, output, maybe parallel
        flow_direction: 'input_to_output',
        protection_for: ['ecu', 'lamp', 'motor', 'actuator', 'sensor']
      },
      'relay': {
        typical_connections: ['fuse', 'ecu', 'motor', 'lamp', 'actuator', 'ground'],
        min_connections: 4, // Coil+, Coil-, Contact1, Contact2
        max_connections: 6,
        control_types: ['ecu', 'sensor', 'connector'],
        switched_types: ['motor', 'lamp', 'actuator']
      },
      'ecu': {
        typical_connections: ['fuse', 'sensor', 'actuator', 'connector', 'ground'],
        required_connections: ['fuse', 'ground'], // Power and ground required
        communication_types: ['connector'], // For CAN/LIN bus
        controlled_types: ['actuator', 'relay', 'motor']
      },
      'motor': {
        typical_connections: ['relay', 'fuse', 'ground'],
        high_current: true,
        protection_required: true,
        control_method: 'relay_or_ecu'
      },
      'lamp': {
        typical_connections: ['fuse', 'relay', 'connector', 'ground'],
        protection_required: true,
        switch_types: ['relay', 'connector']
      },
      'sensor': {
        typical_connections: ['ecu', 'connector', 'ground'],
        low_current: true,
        signal_types: ['ecu', 'connector'],
        power_source: 'ecu_or_fuse'
      },
      'connector': {
        typical_connections: ['battery', 'fuse', 'ecu', 'sensor', 'actuator', 'lamp', 'motor', 'ground'],
        junction_types: true,
        zone_bridging: true
      },
      'ground': {
        typical_connections: ['battery', 'ecu', 'sensor', 'motor', 'lamp', 'connector'],
        reference_point: true,
        multiple_connections: true
      }
    };
    
    // Define connection quality metrics
    this.connectionQuality = {
      'battery-fuse': { strength: 0.9, safety: 0.9, typical: true },
      'battery-connector': { strength: 0.8, safety: 0.7, typical: true },
      'battery-ground': { strength: 0.9, safety: 0.9, typical: true },
      'battery-motor': { strength: 0.3, safety: 0.2, typical: false }, // Should use protection
      'battery-lamp': { strength: 0.3, safety: 0.2, typical: false }, // Should use protection
      'fuse-ecu': { strength: 0.9, safety: 0.9, typical: true },
      'fuse-motor': { strength: 0.8, safety: 0.8, typical: true },
      'fuse-lamp': { strength: 0.8, safety: 0.8, typical: true },
      'relay-motor': { strength: 0.9, safety: 0.8, typical: true },
      'relay-lamp': { strength: 0.9, safety: 0.8, typical: true },
      'ecu-sensor': { strength: 0.9, safety: 0.9, typical: true },
      'ecu-actuator': { strength: 0.8, safety: 0.8, typical: true },
      'ecu-ground': { strength: 0.9, safety: 0.9, typical: true },
      'sensor-ground': { strength: 0.8, safety: 0.9, typical: true },
      'motor-ground': { strength: 0.8, safety: 0.9, typical: true }
    };
  }
  
  /**
   * Analyze all component relationships in the graph
   */
  analyzeRelationships(graph) {
    const analysis = {
      componentConnections: {},
      relationshipQuality: {},
      anomalies: [],
      recommendations: [],
      metrics: {}
    };
    
    // Analyze each node's connections
    graph.nodes.forEach(node => {
      const connections = this.analyzeNodeConnections(graph, node);
      analysis.componentConnections[node.id] = connections;
      
      // Check for anomalies
      const anomalies = this.detectConnectionAnomalies(node, connections);
      analysis.anomalies.push(...anomalies);
    });
    
    // Analyze edge relationships
    graph.edges.forEach(edge => {
      const quality = this.assessConnectionQuality(graph, edge);
      analysis.relationshipQuality[edge.id] = quality;
      
      if (quality.score < 0.5) {
        analysis.anomalies.push({
          type: 'poor_connection_quality',
          component: edge.id,
          message: `Poor connection quality between ${edge.from} and ${edge.to}`,
          severity: 'warning'
        });
      }
    });
    
    // Generate recommendations
    analysis.recommendations = this.generateRelationshipRecommendations(analysis);
    
    // Calculate metrics
    analysis.metrics = this.calculateRelationshipMetrics(analysis);
    
    return analysis;
  }
  
  /**
   * Analyze connections for a specific node
   */
  analyzeNodeConnections(graph, node) {
    const edges = graph.edges.filter(e => e.from === node.id || e.to === node.id);
    const connections = {
      total: edges.length,
      incoming: edges.filter(e => e.to === node.id).length,
      outgoing: edges.filter(e => e.from === node.id).length,
      connectedTypes: {},
      connectedNodes: []
    };
    
    edges.forEach(edge => {
      const otherNodeId = edge.from === node.id ? edge.to : edge.from;
      const otherNode = graph.nodes.find(n => n.id === otherNodeId);
      
      if (otherNode) {
        connections.connectedTypes[otherNode.type] = (connections.connectedTypes[otherNode.type] || 0) + 1;
        connections.connectedNodes.push({
          id: otherNode.id,
          type: otherNode.type,
          label: otherNode.label,
          edgeId: edge.id,
          direction: edge.from === node.id ? 'outgoing' : 'incoming'
        });
      }
    });
    
    return connections;
  }
  
  /**
   * Detect connection anomalies for a node
   */
  detectConnectionAnomalies(node, connections) {
    const anomalies = [];
    const rules = this.componentRelationships[node.type];
    
    if (!rules) {
      return anomalies; // No rules defined for this component type
    }
    
    // Check connection count limits
    if (rules.min_connections && connections.total < rules.min_connections) {
      anomalies.push({
        type: 'insufficient_connections',
        component: node.id,
        message: `${node.type} ${node.id} has ${connections.total} connections (minimum ${rules.min_connections})`,
        severity: 'warning'
      });
    }
    
    if (rules.max_connections && connections.total > rules.max_connections) {
      anomalies.push({
        type: 'excessive_connections',
        component: node.id,
        message: `${node.type} ${node.id} has ${connections.total} connections (maximum ${rules.max_connections})`,
        severity: 'warning'
      });
    }
    
    // Check for forbidden direct connections
    if (rules.forbidden_direct) {
      Object.keys(connections.connectedTypes).forEach(connectedType => {
        if (rules.forbidden_direct.includes(connectedType)) {
          anomalies.push({
            type: 'forbidden_connection',
            component: node.id,
            message: `${node.type} ${node.id} has direct connection to ${connectedType} (should use protection)`,
            severity: 'error'
          });
        }
      });
    }
    
    // Check for required connections
    if (rules.required_connections) {
      rules.required_connections.forEach(requiredType => {
        if (!connections.connectedTypes[requiredType]) {
          anomalies.push({
            type: 'missing_required_connection',
            component: node.id,
            message: `${node.type} ${node.id} missing required connection to ${requiredType}`,
            severity: 'error'
          });
        }
      });
    }
    
    return anomalies;
  }
  
  /**
   * Assess quality of a specific connection
   */
  assessConnectionQuality(graph, edge) {
    const fromNode = graph.nodes.find(n => n.id === edge.from);
    const toNode = graph.nodes.find(n => n.id === edge.to);
    
    if (!fromNode || !toNode) {
      return { score: 0, factors: ['missing_node'] };
    }
    
    const connectionKey = `${fromNode.type}-${toNode.type}`;
    const reverseKey = `${toNode.type}-${fromNode.type}`;
    
    // Look up predefined quality metrics
    let qualityMetrics = this.connectionQuality[connectionKey] || this.connectionQuality[reverseKey];
    
    if (!qualityMetrics) {
      // Calculate quality based on general rules
      qualityMetrics = this.calculateConnectionQuality(fromNode, toNode, edge);
    }
    
    const quality = {
      score: (qualityMetrics.strength + qualityMetrics.safety) / 2,
      strength: qualityMetrics.strength,
      safety: qualityMetrics.safety,
      typical: qualityMetrics.typical,
      factors: []
    };
    
    // Add quality factors
    if (edge.wire?.gauge) {
      const appropriateGauge = this.assessWireGaugeForConnection(fromNode, toNode, edge.wire.gauge);
      if (!appropriateGauge) {
        quality.factors.push('inappropriate_wire_gauge');
        quality.score *= 0.8;
      }
    }
    
    if (edge.wire?.voltage) {
      const appropriateVoltage = this.assessVoltageForConnection(fromNode, toNode, edge.wire.voltage);
      if (!appropriateVoltage) {
        quality.factors.push('inappropriate_voltage');
        quality.score *= 0.8;
      }
    }
    
    // Zone crossing penalty
    if (fromNode.zone && toNode.zone && fromNode.zone !== toNode.zone) {
      quality.factors.push('zone_crossing');
      quality.score *= 0.9;
    }
    
    quality.score = Math.max(0, Math.min(1, quality.score));
    
    return quality;
  }
  
  /**
   * Calculate connection quality for unlisted connection types
   */
  calculateConnectionQuality(fromNode, toNode, edge) {
    let strength = 0.5; // Default
    let safety = 0.5;   // Default
    let typical = false;
    
    const fromRules = this.componentRelationships[fromNode.type];
    const toRules = this.componentRelationships[toNode.type];
    
    // Check if connection is typical for either component
    if (fromRules?.typical_connections?.includes(toNode.type) ||
        toRules?.typical_connections?.includes(fromNode.type)) {
      typical = true;
      strength += 0.3;
      safety += 0.2;
    }
    
    // Safety considerations
    const highCurrentTypes = ['motor', 'actuator', 'lamp'];
    const protectionTypes = ['fuse', 'relay'];
    
    if (highCurrentTypes.includes(fromNode.type) || highCurrentTypes.includes(toNode.type)) {
      if (protectionTypes.includes(fromNode.type) || protectionTypes.includes(toNode.type)) {
        safety += 0.3; // Protected high-current connection
      } else {
        safety -= 0.3; // Unprotected high-current connection
      }
    }
    
    // Connection strength based on compatibility
    if (fromNode.type === 'ecu' && toNode.type === 'sensor') {
      strength += 0.4; // Natural pairing
    }
    if (fromNode.type === 'battery' && toNode.type === 'fuse') {
      strength += 0.4; // Natural pairing
    }
    if (fromNode.type === 'relay' && highCurrentTypes.includes(toNode.type)) {
      strength += 0.3; // Relay controlling load
    }
    
    return {
      strength: Math.max(0, Math.min(1, strength)),
      safety: Math.max(0, Math.min(1, safety)),
      typical: typical
    };
  }
  
  /**
   * Assess if wire gauge is appropriate for connection
   */
  assessWireGaugeForConnection(fromNode, toNode, wireGauge) {
    const gaugeValues = {
      '0.5mm²': 0.5, '1mm²': 1, '2.5mm²': 2.5, '4mm²': 4,
      '6mm²': 6, '10mm²': 10, '16mm²': 16, '25mm²': 25
    };
    
    const gauge = gaugeValues[wireGauge];
    if (!gauge) return false; // Unknown gauge
    
    const highCurrentTypes = ['motor', 'actuator', 'lamp'];
    const lowCurrentTypes = ['ecu', 'sensor'];
    
    const isHighCurrent = highCurrentTypes.includes(fromNode.type) || highCurrentTypes.includes(toNode.type);
    const isLowCurrent = lowCurrentTypes.includes(fromNode.type) || lowCurrentTypes.includes(toNode.type);
    
    // Check for starter circuit
    const isStarter = [fromNode.label, toNode.label].some(label => 
      label?.toLowerCase().includes('starter')
    );
    
    if (isStarter) {
      return gauge >= 10; // Starter needs heavy gauge
    }
    
    if (isHighCurrent) {
      return gauge >= 2.5; // High current needs adequate gauge
    }
    
    if (isLowCurrent) {
      return gauge <= 2.5; // Low current doesn't need heavy gauge
    }
    
    return true; // Default acceptance for moderate connections
  }
  
  /**
   * Assess if voltage is appropriate for connection
   */
  assessVoltageForConnection(fromNode, toNode, voltage) {
    const lowVoltageTypes = ['ecu', 'sensor'];
    const standardVoltages = ['5V', '12V', '24V', '400V'];
    
    if (!standardVoltages.includes(voltage)) {
      return false; // Non-standard voltage
    }
    
    const isLowVoltage = lowVoltageTypes.includes(fromNode.type) || lowVoltageTypes.includes(toNode.type);
    
    if (isLowVoltage && !['5V', '12V'].includes(voltage)) {
      return false; // ECU/sensor should use 5V or 12V
    }
    
    if (voltage === '400V') {
      // High voltage should only be in hybrid/electric vehicles
      const isHighVoltageSystem = [fromNode.label, toNode.label].some(label =>
        label?.toLowerCase().includes('high voltage') ||
        label?.toLowerCase().includes('hybrid') ||
        label?.toLowerCase().includes('electric')
      );
      return isHighVoltageSystem;
    }
    
    return true; // 5V, 12V, 24V are generally acceptable
  }
  
  /**
   * Generate recommendations based on relationship analysis
   */
  generateRelationshipRecommendations(analysis) {
    const recommendations = [];
    
    // Analyze error patterns
    const errorsByType = {};
    analysis.anomalies.forEach(anomaly => {
      errorsByType[anomaly.type] = (errorsByType[anomaly.type] || 0) + 1;
    });
    
    // Generate targeted recommendations
    if (errorsByType.forbidden_connection > 0) {
      recommendations.push({
        type: 'safety',
        priority: 'high',
        message: 'Add circuit protection between power sources and loads',
        affected: errorsByType.forbidden_connection
      });
    }
    
    if (errorsByType.missing_required_connection > 0) {
      recommendations.push({
        type: 'functionality',
        priority: 'high',
        message: 'Add missing power and ground connections to ECUs',
        affected: errorsByType.missing_required_connection
      });
    }
    
    if (errorsByType.insufficient_connections > 0) {
      recommendations.push({
        type: 'design',
        priority: 'medium',
        message: 'Review component connections for completeness',
        affected: errorsByType.insufficient_connections
      });
    }
    
    // Analyze connection quality
    const poorConnections = Object.values(analysis.relationshipQuality)
      .filter(q => q.score < 0.5).length;
    
    if (poorConnections > 0) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        message: 'Improve connection specifications (wire gauge, voltage)',
        affected: poorConnections
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculate relationship metrics
   */
  calculateRelationshipMetrics(analysis) {
    const totalConnections = Object.keys(analysis.relationshipQuality).length;
    const totalComponents = Object.keys(analysis.componentConnections).length;
    
    const qualityScores = Object.values(analysis.relationshipQuality).map(q => q.score);
    const averageQuality = qualityScores.length > 0 ? 
      qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;
    
    const errors = analysis.anomalies.filter(a => a.severity === 'error').length;
    const warnings = analysis.anomalies.filter(a => a.severity === 'warning').length;
    
    const connectivityRatio = totalConnections / Math.max(1, totalComponents);
    
    return {
      totalComponents,
      totalConnections,
      averageQuality: Math.round(averageQuality * 100) / 100,
      connectivityRatio: Math.round(connectivityRatio * 100) / 100,
      errorCount: errors,
      warningCount: warnings,
      overallScore: Math.round((averageQuality * 0.7 + (1 - errors / Math.max(1, totalComponents)) * 0.3) * 100)
    };
  }
  
  /**
   * Map component dependencies
   */
  mapDependencies(graph) {
    const dependencies = {};
    
    graph.nodes.forEach(node => {
      dependencies[node.id] = {
        dependsOn: [],
        supports: [],
        criticalPath: false
      };
    });
    
    // Trace power dependencies
    const powerSources = graph.nodes.filter(n => n.type === 'battery');
    powerSources.forEach(source => {
      this.tracePowerDependencies(graph, source.id, dependencies, new Set());
    });
    
    // Identify critical components
    this.identifyCriticalComponents(dependencies);
    
    return dependencies;
  }
  
  /**
   * Trace power dependencies from source
   */
  tracePowerDependencies(graph, sourceId, dependencies, visited) {
    if (visited.has(sourceId)) return;
    visited.add(sourceId);
    
    const outgoingEdges = graph.edges.filter(e => e.from === sourceId);
    outgoingEdges.forEach(edge => {
      const targetId = edge.to;
      
      if (dependencies[targetId] && !dependencies[targetId].dependsOn.includes(sourceId)) {
        dependencies[targetId].dependsOn.push(sourceId);
        dependencies[sourceId].supports.push(targetId);
        
        // Continue tracing through distribution components
        const targetNode = graph.nodes.find(n => n.id === targetId);
        if (targetNode && ['fuse', 'connector', 'relay'].includes(targetNode.type)) {
          this.tracePowerDependencies(graph, targetId, dependencies, visited);
        }
      }
    });
  }
  
  /**
   * Identify critical components in the dependency graph
   */
  identifyCriticalComponents(dependencies) {
    // Components are critical if many others depend on them
    Object.entries(dependencies).forEach(([nodeId, deps]) => {
      if (deps.supports.length > 3) { // Supports more than 3 components
        deps.criticalPath = true;
      }
    });
  }
}

module.exports = {
  RelationshipMapper
};