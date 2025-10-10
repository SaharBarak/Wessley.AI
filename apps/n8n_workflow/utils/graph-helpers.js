/**
 * Graph Helper Utilities
 * Utilities for ElectroGraph normalization and manipulation
 */

const crypto = require('crypto');

/**
 * Normalize component type from research data
 */
function normalizeComponentType(rawType, label = '', notes = '') {
  if (!rawType) return 'terminal'; // default fallback
  
  const type = rawType.toLowerCase().trim();
  const context = `${label} ${notes}`.toLowerCase();
  
  // Direct mapping for exact matches
  const directMappings = {
    'battery': 'battery',
    'fuse': 'fuse', 
    'relay': 'relay',
    'connector': 'connector',
    'ecu': 'ecu',
    'ecm': 'ecu',
    'pcm': 'ecu',
    'sensor': 'sensor',
    'actuator': 'actuator',
    'lamp': 'lamp',
    'motor': 'motor',
    'splice': 'splice',
    'ground': 'ground',
    'terminal': 'terminal'
  };
  
  if (directMappings[type]) {
    return directMappings[type];
  }
  
  // Pattern-based mapping with context
  const patterns = [
    { pattern: /(?:main|starter|auxiliary).*battery/, type: 'battery' },
    { pattern: /(?:fuse|protection|circuit.?breaker)/, type: 'fuse' },
    { pattern: /(?:relay|switch.*relay|control.*relay)/, type: 'relay' },
    { pattern: /(?:plug|socket|connector|harness|terminal.?block)/, type: 'connector' },
    { pattern: /(?:module|controller|unit|computer|ecu|ecm|pcm)/, type: 'ecu' },
    { pattern: /(?:sensor|detector|switch)/, type: 'sensor' },
    { pattern: /(?:actuator|solenoid|valve)/, type: 'actuator' },
    { pattern: /(?:light|lamp|bulb|led)/, type: 'lamp' },
    { pattern: /(?:motor|pump|fan|compressor)/, type: 'motor' },
    { pattern: /(?:splice|junction|tie|connection)/, type: 'splice' },
    { pattern: /(?:ground|earth|chassis|body)/, type: 'ground' }
  ];
  
  // Check patterns against type and context
  for (const { pattern, type: mappedType } of patterns) {
    if (pattern.test(type) || pattern.test(context)) {
      return mappedType;
    }
  }
  
  // Fallback analysis based on common automotive terms
  if (context.includes('12v') || context.includes('power')) {
    return 'connector';
  }
  if (context.includes('signal') || context.includes('data')) {
    return 'connector';
  }
  if (context.includes('ignition') || context.includes('starter')) {
    return 'relay';
  }
  
  return 'terminal'; // Default fallback
}

/**
 * Infer wire gauge from context
 */
function inferWireGauge(context = '', componentTypes = []) {
  const lowerContext = context.toLowerCase();
  
  // Explicit gauge mentions
  const gaugePatterns = [
    { pattern: /0\.5\s*mm²/, gauge: '0.5mm²' },
    { pattern: /1\s*mm²/, gauge: '1mm²' },
    { pattern: /2\.5\s*mm²/, gauge: '2.5mm²' },
    { pattern: /4\s*mm²/, gauge: '4mm²' },
    { pattern: /6\s*mm²/, gauge: '6mm²' },
    { pattern: /10\s*mm²/, gauge: '10mm²' },
    { pattern: /16\s*mm²/, gauge: '16mm²' },
    { pattern: /25\s*mm²/, gauge: '25mm²' }
  ];
  
  for (const { pattern, gauge } of gaugePatterns) {
    if (pattern.test(lowerContext)) {
      return gauge;
    }
  }
  
  // Component-based inference
  const highCurrentTypes = ['motor', 'battery', 'actuator'];
  const lowCurrentTypes = ['sensor', 'ecu'];
  
  if (componentTypes.some(type => highCurrentTypes.includes(type))) {
    if (lowerContext.includes('starter') || lowerContext.includes('main')) {
      return '10mm²';
    }
    return '4mm²';
  }
  
  if (componentTypes.some(type => lowCurrentTypes.includes(type))) {
    return '1mm²';
  }
  
  // Context-based inference
  if (lowerContext.includes('power') || lowerContext.includes('main')) {
    return '6mm²';
  }
  if (lowerContext.includes('signal') || lowerContext.includes('data')) {
    return '0.5mm²';
  }
  if (lowerContext.includes('ground') || lowerContext.includes('return')) {
    return '2.5mm²';
  }
  
  return '2.5mm²'; // Standard automotive wire
}

/**
 * Infer wire voltage from context
 */
function inferWireVoltage(context = '', componentTypes = []) {
  const lowerContext = context.toLowerCase();
  
  // Explicit voltage mentions
  if (lowerContext.includes('400v') || lowerContext.includes('high voltage')) {
    return '400V';
  }
  if (lowerContext.includes('24v') || lowerContext.includes('24 volt')) {
    return '24V';
  }
  if (lowerContext.includes('5v') || lowerContext.includes('5 volt')) {
    return '5V';
  }
  
  // Component-based inference
  const lowVoltageTypes = ['ecu', 'sensor'];
  if (componentTypes.some(type => lowVoltageTypes.includes(type))) {
    if (lowerContext.includes('signal') || lowerContext.includes('data')) {
      return '5V';
    }
    return '12V';
  }
  
  // Context-based inference
  if (lowerContext.includes('signal') || lowerContext.includes('communication')) {
    return '5V';
  }
  
  return '12V'; // Standard automotive voltage
}

/**
 * Generate unique component ID
 */
function generateComponentId(type, label, existingIds = new Set()) {
  const baseId = `${type}_${label.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20)}`;
  
  if (!existingIds.has(baseId)) {
    return baseId;
  }
  
  // Add numeric suffix if base ID exists
  let counter = 1;
  let uniqueId = `${baseId}_${counter}`;
  while (existingIds.has(uniqueId)) {
    counter++;
    uniqueId = `${baseId}_${counter}`;
  }
  
  return uniqueId;
}

/**
 * Generate unique edge ID
 */
function generateEdgeId(fromId, toId, existingIds = new Set()) {
  const baseId = `edge_${fromId}_${toId}`;
  
  if (!existingIds.has(baseId)) {
    return baseId;
  }
  
  // Add numeric suffix if base ID exists
  let counter = 1;
  let uniqueId = `${baseId}_${counter}`;
  while (existingIds.has(uniqueId)) {
    counter++;
    uniqueId = `${baseId}_${counter}`;
  }
  
  return uniqueId;
}

/**
 * Infer circuit type from components
 */
function inferCircuitType(components = []) {
  const types = components.map(c => c.type).filter(Boolean);
  
  // Power distribution circuits
  if (types.includes('battery') && types.includes('fuse')) {
    return 'power_distribution';
  }
  
  // Lighting circuits
  if (types.includes('lamp') || types.some(t => t.includes('light'))) {
    return 'lighting';
  }
  
  // Engine management
  if (types.includes('ecu') && types.includes('sensor')) {
    return 'engine_management';
  }
  
  // Starting circuit
  if (types.includes('battery') && types.includes('motor') && 
      components.some(c => c.label?.toLowerCase().includes('starter'))) {
    return 'starting';
  }
  
  // Charging circuit
  if (types.includes('battery') && 
      components.some(c => c.label?.toLowerCase().includes('alternator'))) {
    return 'charging';
  }
  
  // Control circuits
  if (types.includes('relay') || types.includes('ecu')) {
    return 'control';
  }
  
  // Ground circuits
  if (types.includes('ground')) {
    return 'ground';
  }
  
  return 'general';
}

/**
 * Calculate circuit voltage from components
 */
function calculateCircuitVoltage(components = [], edges = []) {
  // Check for high voltage components
  const hasHighVoltage = components.some(c => 
    c.label?.toLowerCase().includes('400v') || 
    c.label?.toLowerCase().includes('high voltage')
  );
  
  if (hasHighVoltage) {
    return '400V';
  }
  
  // Check edge voltages
  const edgeVoltages = edges.map(e => e.wire?.voltage).filter(Boolean);
  if (edgeVoltages.includes('24V')) {
    return '24V';
  }
  if (edgeVoltages.includes('5V') && !edgeVoltages.includes('12V')) {
    return '5V';
  }
  
  return '12V'; // Standard automotive voltage
}

/**
 * Detect potential circuits from component connections
 */
function detectCircuits(nodes = [], edges = []) {
  const circuits = [];
  const visited = new Set();
  
  // Build adjacency list
  const adjacency = {};
  nodes.forEach(node => {
    adjacency[node.id] = [];
  });
  
  edges.forEach(edge => {
    if (adjacency[edge.from] && adjacency[edge.to]) {
      adjacency[edge.from].push(edge.to);
      adjacency[edge.to].push(edge.from);
    }
  });
  
  // Find connected components using DFS
  function dfs(nodeId, component) {
    if (visited.has(nodeId)) return;
    
    visited.add(nodeId);
    component.push(nodeId);
    
    adjacency[nodeId].forEach(neighborId => {
      if (!visited.has(neighborId)) {
        dfs(neighborId, component);
      }
    });
  }
  
  let circuitId = 1;
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const component = [];
      dfs(node.id, component);
      
      if (component.length >= 2) {
        const componentNodes = component.map(id => nodes.find(n => n.id === id)).filter(Boolean);
        const circuitEdges = edges.filter(e => component.includes(e.from) && component.includes(e.to));
        
        circuits.push({
          id: `circuit_${String(circuitId++).padStart(3, '0')}`,
          label: generateCircuitLabel(componentNodes),
          type: inferCircuitType(componentNodes),
          voltage: calculateCircuitVoltage(componentNodes, circuitEdges),
          nodes: component,
          protection: findCircuitProtection(componentNodes),
          notes: `Auto-detected circuit with ${component.length} components`
        });
      }
    }
  });
  
  return circuits;
}

/**
 * Generate circuit label from components
 */
function generateCircuitLabel(components = []) {
  const types = [...new Set(components.map(c => c.type).filter(Boolean))];
  const keyComponents = components.filter(c => 
    ['battery', 'ecu', 'motor', 'lamp'].includes(c.type)
  );
  
  if (keyComponents.length > 0) {
    const keyLabels = keyComponents.map(c => 
      c.label?.split(' ')[0] || c.type
    ).slice(0, 2);
    return `${keyLabels.join(' + ')} Circuit`;
  }
  
  if (types.length > 0) {
    return `${types.slice(0, 2).join(' + ')} Circuit`;
  }
  
  return 'Unknown Circuit';
}

/**
 * Find protection devices in circuit
 */
function findCircuitProtection(components = []) {
  const protectionDevices = components.filter(c => 
    ['fuse', 'relay'].includes(c.type)
  );
  
  return protectionDevices.map(device => ({
    type: device.type,
    id: device.id,
    rating: extractRating(device.label)
  }));
}

/**
 * Extract electrical rating from label
 */
function extractRating(label = '') {
  const ratingPatterns = [
    /(\d+)\s*A/i,  // Amperage
    /(\d+)\s*V/i,  // Voltage
    /(\d+)\s*W/i   // Wattage
  ];
  
  for (const pattern of ratingPatterns) {
    const match = label.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Validate graph structure
 */
function validateGraphStructure(graph) {
  const errors = [];
  const warnings = [];
  
  if (!graph || typeof graph !== 'object') {
    errors.push('Graph must be an object');
    return { valid: false, errors, warnings };
  }
  
  // Check required fields
  if (!Array.isArray(graph.nodes)) {
    errors.push('Graph must have nodes array');
  }
  if (!Array.isArray(graph.edges)) {
    errors.push('Graph must have edges array');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }
  
  // Validate nodes
  const nodeIds = new Set();
  graph.nodes.forEach((node, index) => {
    if (!node.id) {
      errors.push(`Node ${index}: missing id`);
    } else if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id: ${node.id}`);
    } else {
      nodeIds.add(node.id);
    }
    
    if (!node.type) {
      errors.push(`Node ${node.id || index}: missing type`);
    }
    
    if (!node.label) {
      warnings.push(`Node ${node.id || index}: missing label`);
    }
  });
  
  // Validate edges
  const edgeIds = new Set();
  graph.edges.forEach((edge, index) => {
    if (!edge.id) {
      errors.push(`Edge ${index}: missing id`);
    } else if (edgeIds.has(edge.id)) {
      errors.push(`Duplicate edge id: ${edge.id}`);
    } else {
      edgeIds.add(edge.id);
    }
    
    if (!edge.from) {
      errors.push(`Edge ${edge.id || index}: missing from`);
    } else if (!nodeIds.has(edge.from)) {
      errors.push(`Edge ${edge.id || index}: references non-existent node ${edge.from}`);
    }
    
    if (!edge.to) {
      errors.push(`Edge ${edge.id || index}: missing to`);
    } else if (!nodeIds.has(edge.to)) {
      errors.push(`Edge ${edge.id || index}: references non-existent node ${edge.to}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      circuitCount: graph.circuits?.length || 0
    }
  };
}

/**
 * Generate graph hash for caching
 */
function generateGraphHash(graph) {
  const normalized = {
    nodes: graph.nodes?.map(n => ({ id: n.id, type: n.type, label: n.label })).sort((a, b) => a.id.localeCompare(b.id)),
    edges: graph.edges?.map(e => ({ id: e.id, from: e.from, to: e.to })).sort((a, b) => a.id.localeCompare(b.id)),
    circuits: graph.circuits?.map(c => ({ id: c.id, type: c.type })).sort((a, b) => a.id.localeCompare(b.id))
  };
  
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

module.exports = {
  normalizeComponentType,
  inferWireGauge,
  inferWireVoltage,
  generateComponentId,
  generateEdgeId,
  inferCircuitType,
  calculateCircuitVoltage,
  detectCircuits,
  generateCircuitLabel,
  findCircuitProtection,
  extractRating,
  validateGraphStructure,
  generateGraphHash
};