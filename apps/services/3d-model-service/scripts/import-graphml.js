#!/usr/bin/env node

/**
 * Import GraphML electrical system data directly into Neo4j
 * Uses the comprehensive Pajero Pinin electrical system GraphML model
 */

const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');

// Configuration
const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

// Vehicle signature for data isolation
const VEHICLE_SIGNATURE = process.env.VEHICLE_SIGNATURE || 'pajero_pinin_2001';

// Path to GraphML file
const GRAPHML_FILE = '../../../n8n_workflow/demo/model.xml';

class GraphMLNeo4jImporter {
  constructor() {
    this.driver = null;
    this.nodes = [];
    this.edges = [];
    this.keyDefinitions = new Map();
  }

  async connect() {
    console.log('🔌 Connecting to Neo4j...');
    this.driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));
    
    // Verify connection
    const session = this.driver.session();
    try {
      await session.run('RETURN 1');
      console.log('✅ Connected to Neo4j successfully');
    } finally {
      await session.close();
    }
  }

  async disconnect() {
    if (this.driver) {
      await this.driver.close();
      console.log('🔌 Disconnected from Neo4j');
    }
  }

  parseGraphML(filePath) {
    console.log(`📄 Reading GraphML file: ${filePath}`);
    
    const xmlContent = fs.readFileSync(filePath, 'utf8');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');

    // Parse key definitions first
    this.parseKeyDefinitions(doc);

    // Parse nodes
    const nodeElements = doc.getElementsByTagName('node');
    console.log(`🔍 Found ${nodeElements.length} nodes`);
    
    for (let i = 0; i < nodeElements.length; i++) {
      const node = this.extractNodeData(nodeElements[i]);
      this.nodes.push(node);
    }

    // Parse edges
    const edgeElements = doc.getElementsByTagName('edge');
    console.log(`🔍 Found ${edgeElements.length} edges`);
    
    for (let i = 0; i < edgeElements.length; i++) {
      const edge = this.extractEdgeData(edgeElements[i]);
      this.edges.push(edge);
    }

    console.log(`✅ Parsed ${this.nodes.length} nodes and ${this.edges.length} edges`);
  }

  parseKeyDefinitions(doc) {
    const keyElements = doc.getElementsByTagName('key');
    for (let i = 0; i < keyElements.length; i++) {
      const key = keyElements[i];
      const id = key.getAttribute('id');
      const attrName = key.getAttribute('attr.name');
      const attrType = key.getAttribute('attr.type');
      const forElement = key.getAttribute('for');
      
      this.keyDefinitions.set(id, {
        name: attrName,
        type: attrType,
        for: forElement
      });
    }
    console.log(`📋 Found ${this.keyDefinitions.size} key definitions`);
  }

  extractNodeData(nodeElement) {
    const nodeData = {
      id: nodeElement.getAttribute('id'),
      properties: {}
    };

    // Extract all data elements
    const dataElements = nodeElement.getElementsByTagName('data');
    for (let i = 0; i < dataElements.length; i++) {
      const dataElement = dataElements[i];
      const key = dataElement.getAttribute('key');
      const value = dataElement.textContent?.trim() || '';
      
      if (key && value) {
        const keyDef = this.keyDefinitions.get(key);
        const propName = keyDef?.name || key;
        
        // Convert value based on type
        nodeData.properties[propName] = this.convertValue(value, keyDef?.type);
      }
    }

    return nodeData;
  }

  extractEdgeData(edgeElement) {
    const edgeData = {
      id: edgeElement.getAttribute('id') || `${edgeElement.getAttribute('source')}_to_${edgeElement.getAttribute('target')}`,
      source: edgeElement.getAttribute('source'),
      target: edgeElement.getAttribute('target'),
      properties: {}
    };

    // Extract all data elements
    const dataElements = edgeElement.getElementsByTagName('data');
    for (let i = 0; i < dataElements.length; i++) {
      const dataElement = dataElements[i];
      const key = dataElement.getAttribute('key');
      const value = dataElement.textContent?.trim() || '';
      
      if (key && value) {
        const keyDef = this.keyDefinitions.get(key);
        const propName = keyDef?.name || key;
        
        // Convert value based on type
        edgeData.properties[propName] = this.convertValue(value, keyDef?.type);
      }
    }

    return edgeData;
  }

  convertValue(value, type) {
    switch (type) {
      case 'int':
        return parseInt(value, 10);
      case 'double':
      case 'float':
        return parseFloat(value);
      case 'boolean':
        return value.toLowerCase() === 'true';
      default:
        // Handle special formats
        if (value.includes(',')) {
          // Try to parse as coordinate array [x,y,z]
          const coords = value.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
          if (coords.length > 0) {
            return coords;
          }
        }
        return value;
    }
  }

  async clearDatabase() {
    console.log('🧹 Clearing existing data...');
    const session = this.driver.session();
    try {
      await session.run('MATCH (n) DETACH DELETE n');
    } finally {
      await session.close();
    }
  }

  async importNodes() {
    console.log(`📥 Importing ${this.nodes.length} nodes...`);
    const session = this.driver.session();
    
    try {
      for (const node of this.nodes) {
        const nodeType = node.properties.node_type || 'Unknown';
        const label = this.mapNodeTypeToLabel(nodeType);
        
        // Prepare properties
        const props = {
          id: node.id,
          type: nodeType,
          vehicle_signature: VEHICLE_SIGNATURE,
          ...node.properties,
          created_at: new Date().toISOString()
        };

        // Handle special properties
        if (props.anchor_xyz && Array.isArray(props.anchor_xyz)) {
          props.position = props.anchor_xyz;
        }
        
        if (props.path_xyz && Array.isArray(props.path_xyz)) {
          props.path = props.path_xyz;
        }

        // Create node with dynamic label
        const query = `
          CREATE (n:${label} $props)
          RETURN n.id as id
        `;
        
        await session.run(query, { props });
      }
      
      console.log(`✅ Imported ${this.nodes.length} nodes`);
    } finally {
      await session.close();
    }
  }

  async importEdges() {
    console.log(`📥 Importing ${this.edges.length} edges...`);
    const session = this.driver.session();
    
    try {
      for (const edge of this.edges) {
        const relType = this.mapRelationshipType(edge.properties.relationship || 'CONNECTS_TO');
        
        // Prepare properties
        const props = {
          id: edge.id,
          vehicle_signature: VEHICLE_SIGNATURE,
          ...edge.properties,
          created_at: new Date().toISOString()
        };

        // Create relationship - ensure both nodes belong to same vehicle
        const query = `
          MATCH (from {id: $fromId, vehicle_signature: $vehicleSignature})
          MATCH (to {id: $toId, vehicle_signature: $vehicleSignature})
          CREATE (from)-[r:${relType} $props]->(to)
          RETURN r.id as id
        `;
        
        try {
          await session.run(query, {
            fromId: edge.source,
            toId: edge.target,
            vehicleSignature: VEHICLE_SIGNATURE,
            props
          });
        } catch (error) {
          console.warn(`Failed to create edge ${edge.id}: ${error.message}`);
        }
      }
      
      console.log(`✅ Imported ${this.edges.length} edges`);
    } finally {
      await session.close();
    }
  }

  async createIndexes() {
    console.log('🏗️ Creating indexes and constraints...');
    const session = this.driver.session();
    
    try {
      const commands = [
        // Constraints - Composite constraints with vehicle_signature for true isolation
        'CREATE CONSTRAINT component_vehicle_id_unique IF NOT EXISTS FOR (c:Component) REQUIRE (c.id, c.vehicle_signature) IS UNIQUE',
        'CREATE CONSTRAINT harness_vehicle_id_unique IF NOT EXISTS FOR (h:Harness) REQUIRE (h.id, h.vehicle_signature) IS UNIQUE',
        'CREATE CONSTRAINT location_vehicle_id_unique IF NOT EXISTS FOR (l:Location) REQUIRE (l.id, l.vehicle_signature) IS UNIQUE',
        'CREATE CONSTRAINT circuit_vehicle_id_unique IF NOT EXISTS FOR (c:Circuit) REQUIRE (c.id, c.vehicle_signature) IS UNIQUE',
        
        // Indexes for fast vehicle-specific queries
        'CREATE INDEX component_vehicle_sig_idx IF NOT EXISTS FOR (c:Component) ON (c.vehicle_signature)',
        'CREATE INDEX component_type_idx IF NOT EXISTS FOR (c:Component) ON (c.type)',
        'CREATE INDEX component_zone_idx IF NOT EXISTS FOR (c:Component) ON (c.anchor_zone)',
        'CREATE INDEX wire_color_idx IF NOT EXISTS FOR (w:Wire) ON (w.color)',
        'CREATE INDEX wire_gauge_idx IF NOT EXISTS FOR (w:Wire) ON (w.gauge)',
        'CREATE INDEX voltage_idx IF NOT EXISTS FOR (n) ON (n.voltage)',
        'CREATE INDEX vehicle_signature_idx IF NOT EXISTS FOR (n) ON (n.vehicle_signature)'
      ];
      
      for (const command of commands) {
        try {
          await session.run(command);
        } catch (error) {
          // Constraint/index might already exist
          if (!error.message.includes('already exists') && !error.message.includes('equivalent')) {
            console.warn(`Index/constraint warning: ${error.message}`);
          }
        }
      }
      
      console.log('✅ Created indexes and constraints');
    } finally {
      await session.close();
    }
  }

  mapNodeTypeToLabel(nodeType) {
    const labelMap = {
      'component': 'Component',
      'fuse': 'Component',
      'relay': 'Component',
      'connector': 'Component',
      'ground_point': 'Component',
      'ground_plane': 'Component',
      'splice': 'Component',
      'pin': 'Component',
      'terminal': 'Component',
      'harness': 'Harness',
      'wire': 'Wire',
      'location': 'Location',
      'circuit': 'Circuit',
      'power_rail': 'PowerRail',
      'unknown': 'Node'
    };
    
    return labelMap[nodeType.toLowerCase()] || 'Component';
  }

  mapRelationshipType(relationship) {
    const relMap = {
      'connected_to': 'CONNECTS_TO',
      'powers': 'POWERS',
      'powered_by': 'POWERED_BY',
      'controls': 'CONTROLS',
      'controlled_by': 'CONTROLLED_BY',
      'grounds_to': 'GROUNDS_TO',
      'wire_to_ground': 'GROUNDS_TO',
      'ground_to_plane': 'GROUNDS_TO',
      'routes_through': 'ROUTES_THROUGH',
      'contains': 'CONTAINS',
      'part_of': 'PART_OF'
    };
    
    return relMap[relationship?.toLowerCase()] || 'CONNECTS_TO';
  }

  async getImportStats() {
    console.log('📊 Gathering import statistics...');
    const session = this.driver.session();
    
    try {
      const result = await session.run(`
        MATCH (n)
        OPTIONAL MATCH ()-[r]->()
        RETURN 
          count(DISTINCT n) as nodeCount,
          count(DISTINCT r) as relationshipCount,
          collect(DISTINCT labels(n)[0]) as nodeTypes,
          collect(DISTINCT type(r)) as relationshipTypes
      `);
      
      const record = result.records[0];
      const stats = {
        nodeCount: record.get('nodeCount').toNumber(),
        relationshipCount: record.get('relationshipCount').toNumber(),
        nodeTypes: record.get('nodeTypes').filter(Boolean),
        relationshipTypes: record.get('relationshipTypes').filter(Boolean)
      };

      console.log('\n📈 IMPORT STATISTICS');
      console.log('='.repeat(50));
      console.log(`Total Nodes: ${stats.nodeCount}`);
      console.log(`Total Relationships: ${stats.relationshipCount}`);
      console.log(`Node Types: ${stats.nodeTypes.join(', ')}`);
      console.log(`Relationship Types: ${stats.relationshipTypes.join(', ')}`);

      return stats;
    } finally {
      await session.close();
    }
  }

  async run() {
    try {
      // Connect to Neo4j
      await this.connect();

      // Parse GraphML file
      const graphmlPath = path.join(__dirname, GRAPHML_FILE);
      if (!fs.existsSync(graphmlPath)) {
        throw new Error(`GraphML file not found: ${graphmlPath}`);
      }
      
      this.parseGraphML(graphmlPath);

      // Clear existing data
      await this.clearDatabase();

      // Import data
      await this.importNodes();
      await this.importEdges();

      // Create indexes
      await this.createIndexes();

      // Show statistics
      await this.getImportStats();

      console.log('\n🎉 GraphML import completed successfully!');
      console.log('🌐 Neo4j Browser: http://localhost:7474');
      console.log('👤 Username: neo4j');
      console.log('🔑 Password: password');

    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the import
if (require.main === module) {
  const importer = new GraphMLNeo4jImporter();
  importer.run().catch(console.error);
}

module.exports = GraphMLNeo4jImporter;