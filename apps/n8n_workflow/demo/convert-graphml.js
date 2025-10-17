#!/usr/bin/env node
/**
 * GraphML to NDJSON Converter
 * Converts the Pajero Pinin electrical system GraphML file to NDJSON format
 */

const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');

class GraphMLToNDJSON {
  constructor() {
    this.nodes = [];
    this.edges = [];
  }

  /**
   * Parse GraphML file and extract nodes and edges
   */
  parseGraphML(xmlFilePath) {
    console.log(`📄 Reading GraphML file: ${xmlFilePath}`);
    
    const xmlContent = fs.readFileSync(xmlFilePath, 'utf8');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');

    // Extract all nodes
    const nodeElements = doc.getElementsByTagName('node');
    console.log(`🔍 Found ${nodeElements.length} nodes`);

    for (let i = 0; i < nodeElements.length; i++) {
      const node = nodeElements[i];
      const nodeData = this.extractNodeData(node);
      this.nodes.push(nodeData);
    }

    // Extract all edges
    const edgeElements = doc.getElementsByTagName('edge');
    console.log(`🔍 Found ${edgeElements.length} edges`);

    for (let i = 0; i < edgeElements.length; i++) {
      const edge = edgeElements[i];
      const edgeData = this.extractEdgeData(edge);
      this.edges.push(edgeData);
    }

    console.log(`✅ Parsed ${this.nodes.length} nodes and ${this.edges.length} edges`);
  }

  /**
   * Extract data from a node element
   */
  extractNodeData(nodeElement) {
    const nodeData = {
      id: nodeElement.getAttribute('id'),
      type: 'node',
      properties: {}
    };

    // Extract all data elements
    const dataElements = nodeElement.getElementsByTagName('data');
    for (let i = 0; i < dataElements.length; i++) {
      const dataElement = dataElements[i];
      const key = dataElement.getAttribute('key');
      const value = dataElement.textContent || dataElement.nodeValue || '';
      
      if (key && value.trim()) {
        nodeData.properties[key] = value.trim();
      }
    }

    // Add timestamp
    nodeData.timestamp = new Date().toISOString();
    
    return nodeData;
  }

  /**
   * Extract data from an edge element
   */
  extractEdgeData(edgeElement) {
    const edgeData = {
      id: `${edgeElement.getAttribute('source')}_to_${edgeElement.getAttribute('target')}`,
      type: 'edge',
      source: edgeElement.getAttribute('source'),
      target: edgeElement.getAttribute('target'),
      properties: {}
    };

    // Extract all data elements
    const dataElements = edgeElement.getElementsByTagName('data');
    for (let i = 0; i < dataElements.length; i++) {
      const dataElement = dataElements[i];
      const key = dataElement.getAttribute('key');
      const value = dataElement.textContent || dataElement.nodeValue || '';
      
      if (key && value.trim()) {
        edgeData.properties[key] = value.trim();
      }
    }

    // Add timestamp
    edgeData.timestamp = new Date().toISOString();
    
    return edgeData;
  }

  /**
   * Convert to NDJSON format and write to file
   */
  writeNDJSON(outputPath) {
    console.log(`📝 Writing NDJSON to: ${outputPath}`);
    
    const writeStream = fs.createWriteStream(outputPath);
    
    // Write nodes
    this.nodes.forEach(node => {
      writeStream.write(JSON.stringify(node) + '\n');
    });

    // Write edges
    this.edges.forEach(edge => {
      writeStream.write(JSON.stringify(edge) + '\n');
    });

    writeStream.end();
    
    console.log(`✅ Successfully converted to NDJSON format`);
    console.log(`📊 Total records: ${this.nodes.length + this.edges.length}`);
    
    return {
      totalRecords: this.nodes.length + this.edges.length,
      nodes: this.nodes.length,
      edges: this.edges.length
    };
  }

  /**
   * Generate a summary report
   */
  generateSummary() {
    const nodeTypes = {};
    const edgeTypes = {};

    // Count node types
    this.nodes.forEach(node => {
      const type = node.properties.node_type || 'unknown';
      nodeTypes[type] = (nodeTypes[type] || 0) + 1;
    });

    // Count edge relationships
    this.edges.forEach(edge => {
      const relationship = edge.properties.relationship || 'connected_to';
      edgeTypes[relationship] = (edgeTypes[relationship] || 0) + 1;
    });

    console.log('\n📈 CONVERSION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Nodes: ${this.nodes.length}`);
    console.log(`Total Edges: ${this.edges.length}`);
    console.log('\nNode Types:');
    Object.entries(nodeTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    console.log('\nEdge Relationships:');
    Object.entries(edgeTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    return { nodeTypes, edgeTypes };
  }

  /**
   * Export specific node types for electrical analysis
   */
  exportElectricalComponents(outputDir) {
    const components = this.nodes.filter(node => 
      ['component', 'connector', 'wire', 'fuse', 'relay'].includes(node.properties.node_type)
    );
    
    const connections = this.edges.filter(edge => 
      ['connected_to', 'powers', 'controls', 'grounds_to'].includes(edge.properties.relationship)
    );

    // Write electrical components
    const componentsPath = path.join(outputDir, 'electrical_components.ndjson');
    const connectionsPath = path.join(outputDir, 'electrical_connections.ndjson');
    
    fs.writeFileSync(componentsPath, 
      components.map(c => JSON.stringify(c)).join('\n') + '\n'
    );
    
    fs.writeFileSync(connectionsPath, 
      connections.map(c => JSON.stringify(c)).join('\n') + '\n'
    );

    console.log(`🔌 Exported ${components.length} electrical components to: ${componentsPath}`);
    console.log(`🔗 Exported ${connections.length} electrical connections to: ${connectionsPath}`);
    
    return { components: components.length, connections: connections.length };
  }
}

// Main execution
function main() {
  const converter = new GraphMLToNDJSON();
  
  const inputFile = path.join(__dirname, 'model.xml');
  const outputFile = path.join(__dirname, 'pajero_electrical_system.ndjson');
  const outputDir = __dirname;

  try {
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      process.exit(1);
    }

    // Parse GraphML
    converter.parseGraphML(inputFile);
    
    // Convert and write NDJSON
    const stats = converter.writeNDJSON(outputFile);
    
    // Generate summary
    converter.generateSummary();
    
    // Export electrical-specific files
    const electricalStats = converter.exportElectricalComponents(outputDir);
    
    console.log('\n🎉 CONVERSION COMPLETE!');
    console.log(`📁 Main NDJSON file: ${outputFile}`);
    console.log(`📁 Electrical components: ${path.join(outputDir, 'electrical_components.ndjson')}`);
    console.log(`📁 Electrical connections: ${path.join(outputDir, 'electrical_connections.ndjson')}`);
    
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

// Check if running directly
if (require.main === module) {
  main();
}

module.exports = GraphMLToNDJSON;