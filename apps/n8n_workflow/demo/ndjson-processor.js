#!/usr/bin/env node
/**
 * NDJSON Processor for Electrical Systems
 * Converts GraphML to validated NDJSON per instructions.md specifications
 * Follows the model.xml as source of truth
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');
const Ajv = require('ajv');

class NDJSONProcessor {
  constructor(options = {}) {
    this.options = {
      strict: options.strict || false,
      autoRepair: options.autoRepair || true,
      systems: options.systems || null,
      emitR3F: options.emitR3F || true,
      export: options.export || null,
      ...options
    };
    
    this.ajv = new Ajv({ allErrors: true });
    this.setupSchemas();
    this.resetState();
  }

  resetState() {
    this.nodes = [];
    this.edges = [];
    this.metadata = null;
    this.errors = [];
    this.warnings = [];
    this.repairs = [];
    
    // Indexes per instructions.md
    this.nodesById = {};
    this.byType = {};
    this.neighbors = {};
    this.pinsByConnector = {};
    this.wiresByHarnessRail = {};
    this.anchors = {};
  }

  setupSchemas() {
    // Node schema per instructions.md section 5.1
    this.nodeSchema = {
      type: "object",
      required: ["kind", "id", "node_type"],
      properties: {
        kind: { const: "node" },
        id: { type: "string" },
        node_type: { type: "string" },
        canonical_id: { type: ["string", "null"] },
        code_id: { type: ["string", "null"] },
        anchor_zone: { type: ["string", "null"] },
        anchor_xyz: { 
          type: ["array", "null"], 
          items: { type: "number" }, 
          minItems: 3, 
          maxItems: 3 
        },
        anchor_ypr_deg: { 
          type: ["array", "null"], 
          items: { type: "number" }, 
          minItems: 3, 
          maxItems: 3 
        },
        bbox_m: { 
          type: ["array", "null"], 
          items: { type: "number" }, 
          minItems: 3, 
          maxItems: 3 
        },
        rail: { type: ["string", "null"] },
        path_xyz: { 
          type: ["array", "null"], 
          items: { 
            type: "array", 
            items: { type: "number" }, 
            minItems: 3, 
            maxItems: 3 
          } 
        },
        color: { type: ["string", "null"] },
        gauge: { type: ["string", "null"] },
        signal: { type: ["string", "null"] },
        voltage: { type: ["string", "null"] },
        oem_id: { type: ["string", "null"] },
        service_ref: { type: ["string", "null"] },
        notes: { type: ["string", "null"] }
      },
      additionalProperties: true
    };

    // Edge schema per instructions.md section 5.1
    this.edgeSchema = {
      type: "object",
      required: ["kind", "source", "target", "relationship"],
      properties: {
        kind: { const: "edge" },
        source: { type: "string" },
        target: { type: "string" },
        relationship: { type: "string" },
        notes: { type: ["string", "null"] }
      },
      additionalProperties: true
    };

    // Meta schema per instructions.md section 3.1
    this.metaSchema = {
      type: "object",
      required: ["kind", "model", "version"],
      properties: {
        kind: { const: "meta" },
        model: { type: "string" },
        version: { type: "string" },
        units: { type: "object" },
        coord_frame: { type: "object" },
        created_at: { type: "string" }
      },
      additionalProperties: true
    };

    this.validateNode = this.ajv.compile(this.nodeSchema);
    this.validateEdge = this.ajv.compile(this.edgeSchema);
    this.validateMeta = this.ajv.compile(this.metaSchema);
  }

  /**
   * Process GraphML file and convert to NDJSON
   */
  async processGraphML(xmlFilePath) {
    console.log(`📄 Processing GraphML: ${xmlFilePath}`);
    
    const xmlContent = fs.readFileSync(xmlFilePath, 'utf8');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');

    // Extract metadata from GraphML
    this.extractMetadata(doc);
    
    // Extract nodes
    const nodeElements = doc.getElementsByTagName('node');
    console.log(`🔍 Found ${nodeElements.length} nodes`);
    
    for (let i = 0; i < nodeElements.length; i++) {
      const nodeData = this.extractAndValidateNode(nodeElements[i]);
      if (nodeData) {
        this.nodes.push(nodeData);
      }
    }

    // Extract edges
    const edgeElements = doc.getElementsByTagName('edge');
    console.log(`🔍 Found ${edgeElements.length} edges`);
    
    for (let i = 0; i < edgeElements.length; i++) {
      const edgeData = this.extractAndValidateEdge(edgeElements[i]);
      if (edgeData) {
        this.edges.push(edgeData);
      }
    }

    // Build indexes per instructions.md section 6
    this.buildIndexes();
    
    // Perform integrity checks per instructions.md section 5.2
    this.performIntegrityChecks();
    
    // Spatial synthesis per instructions.md section 7
    this.synthesizeSpatialDefaults();
    
    console.log(`✅ Processed ${this.nodes.length} nodes and ${this.edges.length} edges`);
    console.log(`⚠️  ${this.warnings.length} warnings, ${this.errors.length} errors`);
    
    return {
      nodes: this.nodes,
      edges: this.edges,
      metadata: this.metadata,
      model: this.getGraphModel()
    };
  }

  extractMetadata(doc) {
    const graphElement = doc.getElementsByTagName('graph')[0];
    const graphId = graphElement ? graphElement.getAttribute('id') : 'PajeroPininV60_Electrical';
    
    // Create metadata per instructions.md section 3.1
    this.metadata = {
      kind: "meta",
      model: graphId || "PajeroPininV60",
      version: "1.0.0",
      units: { length: "m", angle: "deg", voltage: "V" },
      coord_frame: { 
        x: "forward", 
        y: "left", 
        z: "up", 
        origin: "front_axle_centerline_floor" 
      },
      created_at: new Date().toISOString()
    };
  }

  extractAndValidateNode(nodeElement) {
    // Create node per instructions.md section 3.2
    const nodeData = {
      kind: "node",
      id: nodeElement.getAttribute('id'),
      node_type: null,
      canonical_id: null,
      code_id: null,
      anchor_zone: null,
      anchor_xyz: null,
      anchor_ypr_deg: null,
      bbox_m: null,
      rail: null,
      path_xyz: null,
      color: null,
      gauge: null,
      signal: null,
      voltage: null,
      oem_id: null,
      service_ref: null,
      notes: null
    };

    // Extract data elements from GraphML
    const dataElements = nodeElement.getElementsByTagName('data');
    for (let i = 0; i < dataElements.length; i++) {
      const dataElement = dataElements[i];
      const key = dataElement.getAttribute('key');
      const value = dataElement.textContent || dataElement.nodeValue || '';
      
      if (key && value.trim()) {
        const trimmedValue = value.trim();
        
        // Handle special array fields per instructions.md
        if (key === 'anchor_xyz' || key === 'anchor_ypr_deg' || key === 'bbox_m') {
          nodeData[key] = this.parseArrayField(trimmedValue, key);
        } else if (key === 'path_xyz') {
          nodeData[key] = this.parsePathXYZ(trimmedValue);
        } else {
          nodeData[key] = trimmedValue;
        }
      }
    }

    // Validate against schema
    if (!this.validateNode(nodeData)) {
      const error = `Node ${nodeData.id}: ${this.ajv.errorsText(this.validateNode.errors)}`;
      if (this.options.strict) {
        throw new Error(error);
      }
      this.errors.push(error);
      return null;
    }

    // Auto-repair if enabled per instructions.md section 5.3
    if (this.options.autoRepair) {
      this.autoRepairNode(nodeData);
    }

    return nodeData;
  }

  extractAndValidateEdge(edgeElement) {
    // Create edge per instructions.md section 3.3
    const edgeData = {
      kind: "edge",
      source: edgeElement.getAttribute('source'),
      target: edgeElement.getAttribute('target'),
      relationship: null,
      notes: null
    };

    // Extract data elements
    const dataElements = edgeElement.getElementsByTagName('data');
    for (let i = 0; i < dataElements.length; i++) {
      const dataElement = dataElements[i];
      const key = dataElement.getAttribute('key');
      const value = dataElement.textContent || dataElement.nodeValue || '';
      
      if (key && value.trim()) {
        edgeData[key] = value.trim();
      }
    }

    // Validate against schema
    if (!this.validateEdge(edgeData)) {
      const error = `Edge ${edgeData.source}->${edgeData.target}: ${this.ajv.errorsText(this.validateEdge.errors)}`;
      if (this.options.strict) {
        throw new Error(error);
      }
      this.errors.push(error);
      return null;
    }

    return edgeData;
  }

  parseArrayField(value, fieldName) {
    if (!value) return null;
    
    try {
      // Handle string arrays like "[1.2, 0.0, 0.8]" per instructions.md section 5.3
      if (value.startsWith('[') && value.endsWith(']')) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length === 3) {
          return parsed.map(Number);
        }
      }
      
      // Handle comma-separated values
      if (value.includes(',')) {
        const parts = value.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 3 && parts.every(n => !isNaN(n))) {
          return parts;
        }
      }
      
      this.warnings.push(`Could not parse ${fieldName}: ${value}`);
      return null;
    } catch (e) {
      this.warnings.push(`Error parsing ${fieldName}: ${value} - ${e.message}`);
      return null;
    }
  }

  parsePathXYZ(value) {
    if (!value) return null;
    
    try {
      // Handle JSON array format
      if (value.startsWith('[') || value.startsWith('{')) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(point => {
            if (Array.isArray(point) && point.length === 3) {
              return point.map(Number);
            }
            return null;
          }).filter(p => p !== null);
        }
      }
      
      this.warnings.push(`Could not parse path_xyz: ${value}`);
      return null;
    } catch (e) {
      this.warnings.push(`Error parsing path_xyz: ${value} - ${e.message}`);
      return null;
    }
  }

  autoRepairNode(nodeData) {
    const repairsBefore = JSON.stringify(nodeData);
    let repaired = false;

    // Normalize color codes (B/W -> B-W) per instructions.md section 5.3
    if (nodeData.color && nodeData.color.includes('/')) {
      nodeData.color = nodeData.color.replace('/', '-');
      repaired = true;
    }

    // Clean up parenthetical descriptions in colors
    if (nodeData.color && nodeData.color.includes('(')) {
      nodeData.color = nodeData.color.replace(/\s*\([^)]*\)/g, '');
      repaired = true;
    }

    if (repaired) {
      this.repairs.push({
        id: nodeData.id,
        before: repairsBefore,
        after: JSON.stringify(nodeData)
      });
    }
  }

  buildIndexes() {
    console.log('🔧 Building indexes per instructions.md section 6...');
    
    // Reset indexes
    this.nodesById = {};
    this.byType = {};
    this.neighbors = {};
    this.pinsByConnector = {};
    this.wiresByHarnessRail = {};
    this.anchors = {};

    // Index nodes
    for (const node of this.nodes) {
      this.nodesById[node.id] = node;
      
      // By type
      if (!this.byType[node.node_type]) {
        this.byType[node.node_type] = [];
      }
      this.byType[node.node_type].push(node.id);
      
      // Anchors
      if (node.anchor_xyz) {
        this.anchors[node.id] = {
          xyz: node.anchor_xyz,
          ypr: node.anchor_ypr_deg,
          bbox: node.bbox_m
        };
      }
      
      // Wires by harness rail
      if (node.node_type === 'wire' && node.rail) {
        if (!this.wiresByHarnessRail[node.rail]) {
          this.wiresByHarnessRail[node.rail] = [];
        }
        this.wiresByHarnessRail[node.rail].push(node.id);
      }
    }

    // Index edges - neighbors and special relationships
    for (const edge of this.edges) {
      // Neighbors
      if (!this.neighbors[edge.source]) {
        this.neighbors[edge.source] = [];
      }
      if (!this.neighbors[edge.target]) {
        this.neighbors[edge.target] = [];
      }
      this.neighbors[edge.source].push(edge.target);
      this.neighbors[edge.target].push(edge.source);
      
      // Pins by connector (has_pin relationship)
      if (edge.relationship === 'has_pin') {
        if (!this.pinsByConnector[edge.source]) {
          this.pinsByConnector[edge.source] = [];
        }
        this.pinsByConnector[edge.source].push(edge.target);
      }
    }
  }

  performIntegrityChecks() {
    console.log('🔍 Performing integrity checks per instructions.md section 5.2...');
    
    for (const edge of this.edges) {
      // Check for unknown IDs
      if (!this.nodesById[edge.source]) {
        this.errors.push(`Unknown source ID in edge: ${edge.source}`);
      }
      if (!this.nodesById[edge.target]) {
        this.errors.push(`Unknown target ID in edge: ${edge.target}`);
      }
      
      // Check relationship constraints
      const sourceNode = this.nodesById[edge.source];
      const targetNode = this.nodesById[edge.target];
      
      if (sourceNode && targetNode) {
        this.validateRelationship(edge, sourceNode, targetNode);
      }
    }
    
    // Check wire placement requirements
    for (const node of this.nodes) {
      if (node.node_type === 'wire') {
        this.validateWirePlacement(node);
      }
    }
  }

  validateRelationship(edge, sourceNode, targetNode) {
    const { relationship } = edge;
    
    // Relationship constraints per instructions.md section 5.2
    switch (relationship) {
      case 'has_pin':
        if (sourceNode.node_type !== 'connector') {
          this.errors.push(`has_pin relationship requires source to be connector: ${edge.source}`);
        }
        break;
        
      case 'pin_to_wire':
        if (sourceNode.node_type !== 'pin' || targetNode.node_type !== 'wire') {
          this.errors.push(`pin_to_wire requires pin -> wire: ${edge.source} -> ${edge.target}`);
        }
        break;
        
      case 'wire_to_pin':
        if (sourceNode.node_type !== 'wire' || targetNode.node_type !== 'pin') {
          this.errors.push(`wire_to_pin requires wire -> pin: ${edge.source} -> ${edge.target}`);
        }
        break;
        
      case 'wire_to_fuse':
        if (targetNode.node_type !== 'fuse') {
          this.errors.push(`wire_to_fuse requires target to be fuse: ${edge.target}`);
        }
        break;
        
      case 'wire_to_ground':
        if (targetNode.node_type !== 'ground_point') {
          this.errors.push(`wire_to_ground requires target to be ground_point: ${edge.target}`);
        }
        break;
        
      case 'ground_to_plane':
        if (targetNode.node_type !== 'ground_plane') {
          this.errors.push(`ground_to_plane requires target to be ground_plane: ${edge.target}`);
        }
        break;
    }
  }

  validateWirePlacement(wireNode) {
    const hasPath = wireNode.path_xyz && wireNode.path_xyz.length > 0;
    const hasRoutedOn = this.edges.some(e => e.source === wireNode.id && e.relationship === 'routed_on');
    
    if (!hasPath && !hasRoutedOn) {
      // Check if both endpoints have anchors
      const wireEdges = this.edges.filter(e => 
        (e.source === wireNode.id || e.target === wireNode.id) &&
        ['pin_to_wire', 'wire_to_pin', 'wire_to_fuse', 'wire_to_ground'].includes(e.relationship)
      );
      
      const endpointAnchors = wireEdges.map(e => {
        const endpointId = e.source === wireNode.id ? e.target : e.source;
        return this.anchors[endpointId];
      }).filter(a => a !== undefined);
      
      if (endpointAnchors.length < 2) {
        this.warnings.push(`Wire ${wireNode.id} missing path_xyz and insufficient endpoint anchors - will auto-repair`);
      }
    }
  }

  synthesizeSpatialDefaults() {
    console.log('🌐 Synthesizing spatial defaults per instructions.md section 7...');
    
    // Zone to anchor mapping per instructions.md section 7
    const zoneAnchors = {
      'Engine Compartment': [1.10, 0.0, 0.75],
      'Engine Bay': [1.10, 0.0, 0.75],
      'Dash': [0.60, 0.0, 0.90],
      'Dash Panel': [0.60, 0.0, 0.90],
      'Firewall': [0.90, 0.0, 0.85],
      'Floor': [0.40, 0.0, 0.25],
      'Floor & Roof': [0.40, 0.0, 0.25],
      'Roof': [0.40, 0.0, 1.30],
      'Rear': [-0.60, 0.0, 0.80],
      'Rear Cargo/Tailgate': [-0.60, 0.0, 0.80],
      'Tailgate': [-0.60, 0.0, 0.80],
      'Left Front Door': [0.55, -0.55, 0.95],
      'Right Front Door': [0.55, 0.55, 0.95],
      'Chassis': [0.0, 0.0, 0.0]
    };
    
    for (const node of this.nodes) {
      if (!node.anchor_xyz && node.anchor_zone) {
        const defaultAnchor = zoneAnchors[node.anchor_zone];
        if (defaultAnchor) {
          node.anchor_xyz = [...defaultAnchor];
          this.anchors[node.id] = {
            xyz: node.anchor_xyz,
            ypr: node.anchor_ypr_deg,
            bbox: node.bbox_m
          };
          this.warnings.push(`Synthesized anchor for ${node.id} from zone ${node.anchor_zone}`);
        }
      }
      
      // Add default bounding boxes for components per instructions.md
      if (!node.bbox_m && ['component', 'fuse', 'relay'].includes(node.node_type)) {
        const defaultSizes = {
          component: [0.1, 0.1, 0.05],
          fuse: [0.02, 0.02, 0.03],
          relay: [0.03, 0.03, 0.04]
        };
        node.bbox_m = defaultSizes[node.node_type];
      }
    }
    
    // Bridge missing wire paths per instructions.md section 5.3
    this.bridgeMissingWirePaths();
  }

  bridgeMissingWirePaths() {
    for (const node of this.nodes) {
      if (node.node_type === 'wire' && !node.path_xyz) {
        const wireEdges = this.edges.filter(e => 
          (e.source === node.id || e.target === node.id) &&
          ['pin_to_wire', 'wire_to_pin', 'wire_to_fuse', 'wire_to_ground', 'has_connector'].includes(e.relationship)
        );
        
        if (wireEdges.length >= 2) {
          const endpoints = wireEdges.map(e => {
            const endpointId = e.source === node.id ? e.target : e.source;
            return this.anchors[endpointId];
          }).filter(a => a !== undefined);
          
          if (endpoints.length >= 2) {
            const start = endpoints[0].xyz;
            const end = endpoints[1].xyz;
            const mid = [
              (start[0] + end[0]) / 2 + 0.2, // Offset along X for readability
              (start[1] + end[1]) / 2,
              (start[2] + end[2]) / 2
            ];
            
            node.path_xyz = [start, mid, end];
            this.repairs.push({
              id: node.id,
              type: 'bridged_wire_path',
              message: 'Auto-generated path from endpoints'
            });
          }
        }
      }
    }
  }

  getGraphModel() {
    // Return model per instructions.md section 12
    return {
      nodesById: this.nodesById,
      edges: this.edges,
      byType: this.byType,
      neighbors: this.neighbors,
      pinsByConnector: this.pinsByConnector,
      wiresByHarnessRail: this.wiresByHarnessRail,
      anchors: this.anchors
    };
  }

  async writeNDJSON(outputPath) {
    console.log(`📝 Writing NDJSON to: ${outputPath}`);
    
    const writeStream = fs.createWriteStream(outputPath);
    
    // Write metadata first per instructions.md
    if (this.metadata) {
      writeStream.write(JSON.stringify(this.metadata) + '\n');
    }
    
    // Write nodes sorted by ID for deterministic output
    const sortedNodes = [...this.nodes].sort((a, b) => a.id.localeCompare(b.id));
    sortedNodes.forEach(node => {
      writeStream.write(JSON.stringify(node) + '\n');
    });

    // Write edges sorted by source then target for deterministic output
    const sortedEdges = [...this.edges].sort((a, b) => {
      const sourceCompare = a.source.localeCompare(b.source);
      return sourceCompare !== 0 ? sourceCompare : a.target.localeCompare(b.target);
    });
    sortedEdges.forEach(edge => {
      writeStream.write(JSON.stringify(edge) + '\n');
    });

    writeStream.end();
    
    console.log(`✅ Successfully wrote NDJSON format`);
    console.log(`📊 Total records: ${1 + this.nodes.length + this.edges.length}`);
    
    return {
      totalRecords: 1 + this.nodes.length + this.edges.length,
      nodes: this.nodes.length,
      edges: this.edges.length
    };
  }

  generateReport() {
    // Generate report per instructions.md section 10
    const report = [];
    report.push('# NDJSON Processing Report');
    report.push('');
    report.push(`Generated: ${new Date().toISOString()}`);
    report.push(`Model: ${this.metadata?.model || 'Unknown'}`);
    report.push('');
    
    // Summary
    report.push('## Summary');
    report.push('');
    report.push(`- **Total Nodes**: ${this.nodes.length}`);
    report.push(`- **Total Edges**: ${this.edges.length}`);
    report.push(`- **Errors**: ${this.errors.length}`);
    report.push(`- **Warnings**: ${this.warnings.length}`);
    report.push(`- **Auto-repairs**: ${this.repairs.length}`);
    report.push('');
    
    // Node types count
    report.push('## Node Types');
    report.push('');
    Object.entries(this.byType).forEach(([type, ids]) => {
      report.push(`- **${type}**: ${ids.length}`);
    });
    report.push('');
    
    // Errors
    if (this.errors.length > 0) {
      report.push('## Errors');
      report.push('');
      this.errors.forEach(error => {
        report.push(`- ${error}`);
      });
      report.push('');
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      report.push('## Warnings');
      report.push('');
      this.warnings.forEach(warning => {
        report.push(`- ${warning}`);
      });
      report.push('');
    }
    
    // Repairs
    if (this.repairs.length > 0) {
      report.push('## Auto-repairs');
      report.push('');
      this.repairs.forEach(repair => {
        if (repair.type) {
          report.push(`- **${repair.id}**: ${repair.type} - ${repair.message}`);
        } else {
          report.push(`- **${repair.id}**: Modified`);
        }
      });
      report.push('');
    }
    
    // Quality gates per instructions.md section 15
    report.push('## Quality Gates');
    report.push('');
    const unresolvedIds = this.edges.filter(e => !this.nodesById[e.source] || !this.nodesById[e.target]).length;
    const schemaValid = this.errors.filter(e => e.includes('schema')).length === 0;
    const wiresWithoutPaths = this.nodes.filter(n => n.node_type === 'wire' && !n.path_xyz).length;
    
    report.push(`- **No unresolved IDs**: ${unresolvedIds === 0 ? '✅ PASS' : '❌ FAIL (' + unresolvedIds + ' unresolved)'}`);
    report.push(`- **100% schema-valid**: ${schemaValid ? '✅ PASS' : '❌ FAIL'}`);
    report.push(`- **All wires have paths**: ${wiresWithoutPaths === 0 ? '✅ PASS' : '⚠️  WARN (' + wiresWithoutPaths + ' without paths)'}`);
    report.push('');
    
    return report.join('\n');
  }

  async generateR3FScene() {
    console.log('🎨 Generating React Three Fiber scene configuration...');
    
    // Scene config per instructions.md section 8.1
    const sceneConfig = {
      frame: { x: "forward", y: "left", z: "up" },
      materials: {
        wire: { thickness: 0.006 },
        harness: { thickness: 0.015 },
        ground: { thickness: 0.008 }
      },
      groups: [
        { id: "EngineBay", filter: { anchor_zone: "Engine Compartment" } },
        { id: "Dash", filter: { anchor_zone: "Dash Panel" } },
        { id: "Floor", filter: { anchor_zone: "Floor & Roof" } },
        { id: "Rear", filter: { anchor_zone: "Rear Cargo/Tailgate" } }
      ],
      instances: {
        components: ["component", "fuse", "relay", "bus", "ground_point", "connector"],
        wires: ["wire"],
        harnesses: ["harness", "harness_segment"]
      }
    };
    
    return sceneConfig;
  }
}

// Main execution
async function main() {
  const processor = new NDJSONProcessor({
    strict: false,
    autoRepair: true,
    emitR3F: true
  });
  
  const inputFile = path.join(__dirname, 'model.xml');
  const outputFile = path.join(__dirname, 'graph', 'model.ndjson');
  const reportFile = path.join(__dirname, 'logs', 'report.md');
  const sceneConfigFile = path.join(__dirname, 'scene', 'scene.config.json');
  
  try {
    // Ensure output directories exist
    fs.mkdirSync(path.join(__dirname, 'graph'), { recursive: true });
    fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
    fs.mkdirSync(path.join(__dirname, 'scene'), { recursive: true });
    
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      process.exit(1);
    }

    // Process GraphML
    const result = await processor.processGraphML(inputFile);
    
    // Write NDJSON
    await processor.writeNDJSON(outputFile);
    
    // Generate and write report
    const report = processor.generateReport();
    fs.writeFileSync(reportFile, report);
    
    // Generate R3F scene configuration
    const sceneConfig = await processor.generateR3FScene();
    fs.writeFileSync(sceneConfigFile, JSON.stringify(sceneConfig, null, 2));
    
    console.log('\n🎉 PROCESSING COMPLETE!');
    console.log(`📁 NDJSON file: ${outputFile}`);
    console.log(`📁 Report: ${reportFile}`);
    console.log(`📁 Scene config: ${sceneConfigFile}`);
    console.log(`📊 Model ready for R3F scene generation`);
    
    // Summary stats
    console.log('\n📈 SUMMARY:');
    console.log(`- Nodes: ${result.nodes.length}`);
    console.log(`- Edges: ${result.edges.length}`);
    console.log(`- Node types: ${Object.keys(processor.byType).length}`);
    console.log(`- Warnings: ${processor.warnings.length}`);
    console.log(`- Errors: ${processor.errors.length}`);
    
  } catch (error) {
    console.error('❌ Processing failed:', error.message);
    if (processor.options.strict) {
      process.exit(1);
    }
  }
}

// Check if running directly
if (require.main === module) {
  main();
}

module.exports = NDJSONProcessor;