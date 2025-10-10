/**
 * Graph Validation Rules
 * Electrical system validation rules and heuristics
 */

/**
 * Electrical system validation rules
 * Each rule returns { passed: boolean, message: string, severity: 'error'|'warning'|'info' }
 */
class ValidationRules {
  
  /**
   * R001: System must have at least one power source
   */
  static hasPowerSource(graph) {
    const powerSources = graph.nodes.filter(n => n.type === 'battery');
    
    if (powerSources.length === 0) {
      return {
        passed: false,
        message: 'No power source (battery) found in electrical system',
        severity: 'error',
        rule: 'R001'
      };
    }
    
    if (powerSources.length > 3) {
      return {
        passed: true,
        message: `Unusual number of batteries (${powerSources.length}) - verify if correct`,
        severity: 'warning',
        rule: 'R001'
      };
    }
    
    return {
      passed: true,
      message: `Found ${powerSources.length} power source(s)`,
      severity: 'info',
      rule: 'R001'
    };
  }
  
  /**
   * R002: System should have ground references
   */
  static hasGroundReferences(graph) {
    const groundPoints = graph.nodes.filter(n => n.type === 'ground');
    
    if (groundPoints.length === 0) {
      return {
        passed: false,
        message: 'No ground points found - electrical system requires ground references',
        severity: 'warning',
        rule: 'R002'
      };
    }
    
    return {
      passed: true,
      message: `Found ${groundPoints.length} ground reference(s)`,
      severity: 'info',
      rule: 'R002'
    };
  }
  
  /**
   * R003: System should have circuit protection
   */
  static hasCircuitProtection(graph) {
    const protectionDevices = graph.nodes.filter(n => ['fuse', 'relay'].includes(n.type));
    
    if (protectionDevices.length === 0) {
      return {
        passed: false,
        message: 'No circuit protection (fuses/relays) found',
        severity: 'warning',
        rule: 'R003'
      };
    }
    
    const fuseCount = graph.nodes.filter(n => n.type === 'fuse').length;
    const relayCount = graph.nodes.filter(n => n.type === 'relay').length;
    
    return {
      passed: true,
      message: `Found circuit protection: ${fuseCount} fuse(s), ${relayCount} relay(s)`,
      severity: 'info',
      rule: 'R003'
    };
  }
  
  /**
   * R004: No isolated components (must have connections)
   */
  static noIsolatedComponents(graph) {
    const connectedNodeIds = new Set();
    graph.edges.forEach(edge => {
      connectedNodeIds.add(edge.from);
      connectedNodeIds.add(edge.to);
    });
    
    const isolatedNodes = graph.nodes.filter(node => !connectedNodeIds.has(node.id));
    
    if (isolatedNodes.length > 0) {
      return {
        passed: false,
        message: `Found ${isolatedNodes.length} isolated component(s): ${isolatedNodes.map(n => n.id).join(', ')}`,
        severity: 'warning',
        rule: 'R004'
      };
    }
    
    return {
      passed: true,
      message: 'All components are connected',
      severity: 'info',
      rule: 'R004'
    };
  }
  
  /**
   * R005: Battery connections validation
   */
  static batteryConnections(graph) {
    const batteries = graph.nodes.filter(n => n.type === 'battery');
    const issues = [];
    
    batteries.forEach(battery => {
      const connections = graph.edges.filter(e => e.from === battery.id || e.to === battery.id);
      
      if (connections.length === 0) {
        issues.push(`Battery ${battery.id} has no connections`);
      } else if (connections.length === 1) {
        issues.push(`Battery ${battery.id} has only one connection (typically needs positive and negative)`);
      }
      
      // Check if battery connects through protection
      const connectsToProtection = connections.some(edge => {
        const otherNodeId = edge.from === battery.id ? edge.to : edge.from;
        const otherNode = graph.nodes.find(n => n.id === otherNodeId);
        return otherNode && ['fuse', 'connector'].includes(otherNode.type);
      });
      
      if (!connectsToProtection && connections.length > 0) {
        issues.push(`Battery ${battery.id} should connect through fuse or distribution point`);
      }
    });
    
    if (issues.length > 0) {
      return {
        passed: false,
        message: issues.join('; '),
        severity: 'warning',
        rule: 'R005'
      };
    }
    
    return {
      passed: true,
      message: 'Battery connections are properly configured',
      severity: 'info',
      rule: 'R005'
    };
  }
  
  /**
   * R006: Fuse placement validation
   */
  static fusePlacement(graph) {
    const fuses = graph.nodes.filter(n => n.type === 'fuse');
    const issues = [];
    
    fuses.forEach(fuse => {
      const connections = graph.edges.filter(e => e.from === fuse.id || e.to === fuse.id);
      
      if (connections.length < 2) {
        issues.push(`Fuse ${fuse.id} should have input and output connections`);
        return;
      }
      
      // Check fuse is between power source and load
      const connectedNodeTypes = connections.map(edge => {
        const otherNodeId = edge.from === fuse.id ? edge.to : edge.from;
        const otherNode = graph.nodes.find(n => n.id === otherNodeId);
        return otherNode?.type;
      }).filter(Boolean);
      
      const hasPowerInput = connectedNodeTypes.some(type => ['battery', 'connector'].includes(type));
      const hasLoadOutput = connectedNodeTypes.some(type => ['motor', 'lamp', 'ecu', 'actuator'].includes(type));
      
      if (!hasPowerInput && !hasLoadOutput) {
        issues.push(`Fuse ${fuse.id} power source and load connections unclear`);
      }
    });
    
    if (issues.length > 0) {
      return {
        passed: false,
        message: issues.join('; '),
        severity: 'warning',
        rule: 'R006'
      };
    }
    
    return {
      passed: true,
      message: 'Fuse placements are appropriate',
      severity: 'info',
      rule: 'R006'
    };
  }
  
  /**
   * R007: ECU power and ground validation
   */
  static ecuPowerAndGround(graph) {
    const ecus = graph.nodes.filter(n => n.type === 'ecu');
    const issues = [];
    
    ecus.forEach(ecu => {
      const connections = graph.edges.filter(e => e.from === ecu.id || e.to === ecu.id);
      const connectedNodeTypes = connections.map(edge => {
        const otherNodeId = edge.from === ecu.id ? edge.to : edge.from;
        const otherNode = graph.nodes.find(n => n.id === otherNodeId);
        return otherNode?.type;
      }).filter(Boolean);
      
      const hasPower = connectedNodeTypes.includes('fuse') || connectedNodeTypes.includes('battery');
      const hasGround = connectedNodeTypes.includes('ground');
      
      if (!hasPower) {
        issues.push(`ECU ${ecu.id} has no clear power connection`);
      }
      
      if (!hasGround) {
        issues.push(`ECU ${ecu.id} has no ground connection`);
      }
    });
    
    if (issues.length > 0) {
      return {
        passed: false,
        message: issues.join('; '),
        severity: 'warning',
        rule: 'R007'
      };
    }
    
    return {
      passed: true,
      message: 'ECU power and ground connections are proper',
      severity: 'info',
      rule: 'R007'
    };
  }
  
  /**
   * R008: Wire gauge appropriateness
   */
  static wireGaugeAppropriate(graph) {
    const issues = [];
    
    graph.edges.forEach(edge => {
      if (!edge.wire?.gauge) return;
      
      const fromNode = graph.nodes.find(n => n.id === edge.from);
      const toNode = graph.nodes.find(n => n.id === edge.to);
      
      const highCurrentTypes = ['motor', 'actuator', 'lamp'];
      const isHighCurrent = highCurrentTypes.includes(fromNode?.type) || highCurrentTypes.includes(toNode?.type);
      
      if (isHighCurrent && ['0.5mm²', '1mm²'].includes(edge.wire.gauge)) {
        issues.push(`Edge ${edge.id}: thin wire (${edge.wire.gauge}) for high-current component`);
      }
      
      // Check starter circuit specific requirements
      const isStarterCircuit = [fromNode?.label, toNode?.label].some(label => 
        label?.toLowerCase().includes('starter')
      );
      
      if (isStarterCircuit && !['10mm²', '16mm²', '25mm²'].includes(edge.wire.gauge)) {
        issues.push(`Edge ${edge.id}: inadequate wire gauge for starter circuit`);
      }
    });
    
    if (issues.length > 0) {
      return {
        passed: false,
        message: issues.join('; '),
        severity: 'warning',
        rule: 'R008'
      };
    }
    
    return {
      passed: true,
      message: 'Wire gauges are appropriate for connected components',
      severity: 'info',
      rule: 'R008'
    };
  }
  
  /**
   * R009: Voltage level consistency
   */
  static voltageLevelConsistency(graph) {
    const issues = [];
    
    graph.edges.forEach(edge => {
      if (!edge.wire?.voltage) return;
      
      const fromNode = graph.nodes.find(n => n.id === edge.from);
      const toNode = graph.nodes.find(n => n.id === edge.to);
      
      const lowVoltageTypes = ['ecu', 'sensor'];
      const isLowVoltage = lowVoltageTypes.includes(fromNode?.type) || lowVoltageTypes.includes(toNode?.type);
      
      if (isLowVoltage && !['5V', '12V'].includes(edge.wire.voltage)) {
        issues.push(`Edge ${edge.id}: high voltage (${edge.wire.voltage}) for ECU/sensor connection`);
      }
      
      // Check for 400V safety
      if (edge.wire.voltage === '400V') {
        const hasHighVoltageWarning = [fromNode?.notes, toNode?.notes].some(notes =>
          notes?.toLowerCase().includes('high voltage') || notes?.toLowerCase().includes('danger')
        );
        
        if (!hasHighVoltageWarning) {
          issues.push(`Edge ${edge.id}: 400V connection should have safety warnings`);
        }
      }
    });
    
    if (issues.length > 0) {
      return {
        passed: false,
        message: issues.join('; '),
        severity: 'warning',
        rule: 'R009'
      };
    }
    
    return {
      passed: true,
      message: 'Voltage levels are consistent with component types',
      severity: 'info',
      rule: 'R009'
    };
  }
  
  /**
   * R010: Circuit completeness
   */
  static circuitCompleteness(graph) {
    if (!graph.circuits || graph.circuits.length === 0) {
      return {
        passed: true,
        message: 'No circuits defined for validation',
        severity: 'info',
        rule: 'R010'
      };
    }
    
    const issues = [];
    
    graph.circuits.forEach(circuit => {
      if (!circuit.nodes || circuit.nodes.length < 2) {
        issues.push(`Circuit ${circuit.id}: incomplete (needs at least 2 nodes)`);
        return;
      }
      
      const circuitNodes = circuit.nodes.map(id => graph.nodes.find(n => n.id === id)).filter(Boolean);
      const hasPowerSource = circuitNodes.some(n => ['battery', 'fuse'].includes(n.type));
      const hasLoad = circuitNodes.some(n => ['motor', 'lamp', 'actuator', 'ecu'].includes(n.type));
      
      if (!hasPowerSource) {
        issues.push(`Circuit ${circuit.id}: no clear power source`);
      }
      
      if (!hasLoad) {
        issues.push(`Circuit ${circuit.id}: no clear electrical load`);
      }
      
      // Check circuit path connectivity
      const circuitEdges = graph.edges.filter(edge => 
        circuit.nodes.includes(edge.from) && circuit.nodes.includes(edge.to)
      );
      
      if (circuitEdges.length < circuit.nodes.length - 1) {
        issues.push(`Circuit ${circuit.id}: nodes may not form connected path`);
      }
    });
    
    if (issues.length > 0) {
      return {
        passed: false,
        message: issues.join('; '),
        severity: 'warning',
        rule: 'R010'
      };
    }
    
    return {
      passed: true,
      message: 'All circuits are complete and properly configured',
      severity: 'info',
      rule: 'R010'
    };
  }
  
  /**
   * R011: Relay configuration validation
   */
  static relayConfiguration(graph) {
    const relays = graph.nodes.filter(n => n.type === 'relay');
    const issues = [];
    
    relays.forEach(relay => {
      const connections = graph.edges.filter(e => e.from === relay.id || e.to === relay.id);
      
      if (connections.length < 3) {
        issues.push(`Relay ${relay.id}: insufficient connections (needs coil + contact circuit)`);
      } else if (connections.length > 6) {
        issues.push(`Relay ${relay.id}: excessive connections (${connections.length}) for typical relay`);
      }
      
      // Check for control vs power connections
      const connectedComponents = connections.map(edge => {
        const otherNodeId = edge.from === relay.id ? edge.to : edge.from;
        return graph.nodes.find(n => n.id === otherNodeId);
      }).filter(Boolean);
      
      const hasControlInput = connectedComponents.some(comp => 
        ['ecu', 'sensor'].includes(comp.type) || comp.label?.toLowerCase().includes('control')
      );
      
      const hasPowerCircuit = connectedComponents.some(comp => 
        ['battery', 'fuse', 'motor', 'lamp'].includes(comp.type)
      );
      
      if (connections.length >= 4 && !hasControlInput) {
        issues.push(`Relay ${relay.id}: no clear control input connection`);
      }
      
      if (connections.length >= 4 && !hasPowerCircuit) {
        issues.push(`Relay ${relay.id}: no clear power circuit connection`);
      }
    });
    
    if (issues.length > 0) {
      return {
        passed: false,
        message: issues.join('; '),
        severity: 'warning',
        rule: 'R011'
      };
    }
    
    return {
      passed: true,
      message: 'Relay configurations are appropriate',
      severity: 'info',
      rule: 'R011'
    };
  }
  
  /**
   * Run all validation rules
   */
  static validateAll(graph) {
    const rules = [
      this.hasPowerSource,
      this.hasGroundReferences,
      this.hasCircuitProtection,
      this.noIsolatedComponents,
      this.batteryConnections,
      this.fusePlacement,
      this.ecuPowerAndGround,
      this.wireGaugeAppropriate,
      this.voltageLevelConsistency,
      this.circuitCompleteness,
      this.relayConfiguration
    ];
    
    const results = rules.map(rule => rule(graph));
    
    const errors = results.filter(r => r.severity === 'error');
    const warnings = results.filter(r => r.severity === 'warning');
    const info = results.filter(r => r.severity === 'info');
    
    const passed = errors.length === 0;
    const score = results.filter(r => r.passed).length / results.length;
    
    return {
      passed,
      score: Math.round(score * 100),
      errors: errors.map(r => r.message),
      warnings: warnings.map(r => r.message),
      info: info.map(r => r.message),
      details: results,
      summary: {
        totalRules: results.length,
        passedRules: results.filter(r => r.passed).length,
        errorCount: errors.length,
        warningCount: warnings.length,
        infoCount: info.length
      }
    };
  }
}

/**
 * Electrical system heuristics for automotive applications
 */
class ElectricalHeuristics {
  
  /**
   * Estimate component current draw
   */
  static estimateCurrentDraw(component) {
    const type = component.type;
    const label = component.label?.toLowerCase() || '';
    
    // Standard automotive component current draws (approximate)
    const currentEstimates = {
      'lamp': { min: 1, max: 10, typical: 5 },
      'motor': { min: 5, max: 100, typical: 20 },
      'ecu': { min: 0.1, max: 2, typical: 0.5 },
      'sensor': { min: 0.01, max: 0.5, typical: 0.1 },
      'actuator': { min: 1, max: 20, typical: 5 },
      'relay': { min: 0.1, max: 0.5, typical: 0.2 }
    };
    
    if (!currentEstimates[type]) {
      return { min: 0, max: 0, typical: 0, confidence: 0 };
    }
    
    let estimate = currentEstimates[type];
    let confidence = 0.6;
    
    // Adjust based on label context
    if (label.includes('starter')) {
      estimate = { min: 100, max: 400, typical: 200 };
      confidence = 0.8;
    } else if (label.includes('headlight') || label.includes('main beam')) {
      estimate = { min: 8, max: 15, typical: 10 };
      confidence = 0.8;
    } else if (label.includes('parking') || label.includes('side')) {
      estimate = { min: 2, max: 5, typical: 3 };
      confidence = 0.7;
    } else if (label.includes('fan')) {
      estimate = { min: 10, max: 30, typical: 15 };
      confidence = 0.7;
    } else if (label.includes('fuel pump')) {
      estimate = { min: 3, max: 8, typical: 5 };
      confidence = 0.7;
    }
    
    return { ...estimate, confidence };
  }
  
  /**
   * Recommend wire gauge for connection
   */
  static recommendWireGauge(fromComponent, toComponent, distance = 1) {
    const currentDraw = Math.max(
      this.estimateCurrentDraw(fromComponent).typical,
      this.estimateCurrentDraw(toComponent).typical
    );
    
    // Wire gauge recommendations based on current and distance
    // Using automotive standards with voltage drop consideration
    if (currentDraw >= 100) {
      return distance > 3 ? '25mm²' : '16mm²';
    } else if (currentDraw >= 50) {
      return distance > 3 ? '16mm²' : '10mm²';
    } else if (currentDraw >= 20) {
      return distance > 3 ? '10mm²' : '6mm²';
    } else if (currentDraw >= 10) {
      return distance > 3 ? '6mm²' : '4mm²';
    } else if (currentDraw >= 5) {
      return distance > 3 ? '4mm²' : '2.5mm²';
    } else if (currentDraw >= 1) {
      return distance > 3 ? '2.5mm²' : '1mm²';
    } else {
      return '0.5mm²';
    }
  }
  
  /**
   * Recommend fuse rating for circuit
   */
  static recommendFuseRating(components) {
    const totalCurrent = components.reduce((total, component) => {
      return total + this.estimateCurrentDraw(component).typical;
    }, 0);
    
    // Fuse should be 25% above typical current draw
    const recommendedRating = Math.ceil(totalCurrent * 1.25);
    
    // Standard automotive fuse ratings
    const standardRatings = [5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100, 120, 150];
    
    return standardRatings.find(rating => rating >= recommendedRating) || 150;
  }
  
  /**
   * Detect circuit type from components
   */
  static detectCircuitType(components) {
    const types = components.map(c => c.type);
    const labels = components.map(c => c.label?.toLowerCase() || '').join(' ');
    
    // Pattern matching for circuit types
    if (labels.includes('starter')) return 'starting';
    if (labels.includes('alternator')) return 'charging';
    if (labels.includes('headlight') || labels.includes('taillight')) return 'lighting';
    if (labels.includes('ignition')) return 'ignition';
    if (labels.includes('fuel')) return 'fuel_system';
    if (labels.includes('cooling') || labels.includes('fan')) return 'cooling';
    if (labels.includes('air condition') || labels.includes('hvac')) return 'hvac';
    
    // Type-based detection
    if (types.includes('ecu') && types.includes('sensor')) return 'engine_management';
    if (types.includes('battery') && types.includes('fuse')) return 'power_distribution';
    if (types.includes('lamp')) return 'lighting';
    if (types.includes('motor')) return 'motor_control';
    if (types.includes('ground')) return 'ground_distribution';
    
    return 'general';
  }
  
  /**
   * Suggest component placement zones
   */
  static suggestZonePlacement(component) {
    const type = component.type;
    const label = component.label?.toLowerCase() || '';
    
    // Zone suggestions based on component type and function
    if (type === 'battery') return 'engine';
    if (type === 'ecu' && !label.includes('body')) return 'engine';
    if (type === 'fuse' && label.includes('main')) return 'engine';
    if (type === 'connector' && label.includes('diagnostic')) return 'dash';
    
    if (label.includes('engine') || label.includes('starter') || label.includes('alternator')) {
      return 'engine';
    }
    if (label.includes('dash') || label.includes('instrument') || label.includes('cluster')) {
      return 'dash';
    }
    if (label.includes('interior') || label.includes('cabin') || label.includes('seat')) {
      return 'interior';
    }
    if (label.includes('trunk') || label.includes('boot') || label.includes('rear')) {
      return 'trunk';
    }
    if (label.includes('headlight') || label.includes('taillight') || label.includes('exterior')) {
      return 'exterior';
    }
    
    // Default based on type
    const zoneDefaults = {
      'battery': 'engine',
      'ecu': 'engine',
      'sensor': 'engine',
      'actuator': 'engine',
      'fuse': 'engine',
      'relay': 'engine',
      'lamp': 'exterior',
      'motor': 'engine',
      'connector': 'dash',
      'ground': 'engine',
      'terminal': 'dash'
    };
    
    return zoneDefaults[type] || 'engine';
  }
}

module.exports = {
  ValidationRules,
  ElectricalHeuristics
};