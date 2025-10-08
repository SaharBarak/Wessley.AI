/**
 * Schema Validation Test Suite
 * Comprehensive tests for all 7 schemas in the n8n pipeline
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// Initialize AJV with strict validation
const ajv = new Ajv({
  strict: true,
  allErrors: true,
  verbose: true,
  validateFormats: true
});
addFormats(ajv);

// Schema file paths
const SCHEMA_DIR = path.join(__dirname, '../schemas');
const SCHEMAS = [
  'EventEnvelope.schema.json',
  'ResearchManifest.schema.json', 
  'ElectroGraph.schema.json',
  'NodeMetadata.schema.json',
  'ElectroGraph3D.schema.json',
  'Manifest.schema.json',
  'ViewerEvent.schema.json'
];

// Test results collector
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

/**
 * Load and compile all schemas
 */
function loadSchemas() {
  const schemas = {};
  
  for (const schemaFile of SCHEMAS) {
    const schemaPath = path.join(SCHEMA_DIR, schemaFile);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    try {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Compile schema
      const validate = ajv.compile(schema);
      
      schemas[schemaFile] = {
        schema,
        validate,
        name: schema.$id || schemaFile
      };
      
      console.log(`✓ Loaded schema: ${schema.$id || schemaFile}`);
      
    } catch (error) {
      throw new Error(`Failed to load schema ${schemaFile}: ${error.message}`);
    }
  }
  
  return schemas;
}

/**
 * Test data generators for each schema
 */
const testDataGenerators = {
  'EventEnvelope.schema.json': {
    valid: [
      {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        jobId: '456e7890-e89b-12d3-a456-426614174111',
        timestamp: '2025-10-08T17:30:00.000Z',
        stage: 'raw',
        eventType: 'success',
        payloadHash: 'a'.repeat(64),
        payload: { test: 'data' }
      },
      {
        eventId: '789e0123-e89b-12d3-a456-426614174222',
        jobId: '012e3456-e89b-12d3-a456-426614174333',
        timestamp: '2025-10-08T17:30:00.000Z',
        stage: 'enriched',
        step: 'llm-metadata',
        eventType: 'error',
        payloadHash: 'b'.repeat(64),
        payload: { error: 'test error' },
        metadata: {
          vehicleSig: 'Toyota:Camry:2020',
          duration: 1500,
          cost: 0.05
        }
      }
    ],
    invalid: [
      { /* missing required fields */ },
      { eventId: 'invalid-uuid', jobId: '123', timestamp: 'invalid-date' },
      { eventId: '123e4567-e89b-12d3-a456-426614174000', jobId: '456', timestamp: '2025-10-08T17:30:00.000Z', stage: 'invalid_stage', eventType: 'success', payloadHash: 'short' }
    ]
  },
  
  'ResearchManifest.schema.json': {
    valid: [
      {
        brand: 'Toyota',
        model: 'Camry',
        year: 2020,
        sources: ['https://example.com/manual1', 'https://example.com/manual2'],
        confidence: 0.85,
        summary: 'Comprehensive electrical system documentation found',
        components: [
          {
            id: 'fuse_001',
            type: 'fuse',
            label: 'Main 60A Fuse',
            zone: 'engine',
            rating: '60A'
          }
        ],
        circuits: [
          {
            id: 'circuit_001',
            label: 'Headlight Circuit',
            voltage: '12V'
          }
        ]
      }
    ],
    invalid: [
      { /* missing required fields */ },
      { brand: '', model: 'Camry', year: 2020, sources: [], confidence: 1.5 },
      { brand: 'Toyota', model: 'Camry', year: 1800, sources: ['invalid-url'], confidence: 0.5 }
    ]
  },
  
  'ElectroGraph.schema.json': {
    valid: [
      {
        vehicleId: 'Toyota:Camry:2020',
        nodes: [
          {
            id: 'battery_001',
            type: 'battery',
            label: 'Main Battery',
            zone: 'engine'
          },
          {
            id: 'fuse_001', 
            type: 'fuse',
            label: 'Main Fuse',
            zone: 'engine',
            circuits: ['circuit_001']
          }
        ],
        edges: [
          {
            id: 'edge_001',
            from: 'battery_001',
            to: 'fuse_001',
            type: 'power'
          }
        ],
        circuits: [
          {
            id: 'circuit_001',
            label: 'Main Power',
            nodes: ['battery_001', 'fuse_001']
          }
        ]
      }
    ],
    invalid: [
      { /* missing required fields */ },
      { vehicleId: 'test', nodes: [], edges: [] }, // missing circuits
      { vehicleId: 'test', nodes: [{ id: 'test', type: 'invalid_type', label: 'test' }], edges: [], circuits: [] }
    ]
  },
  
  'NodeMetadata.schema.json': {
    valid: [
      {
        nodeId: 'fuse_001',
        confidence: 0.85,
        evidence: [
          {
            text: 'Main 60A fuse located in engine bay fuse box',
            source: 'Owner manual page 45',
            confidence: 0.9
          }
        ],
        function: 'Protects main electrical system',
        specifications: {
          voltage: '12V',
          current: '60A'
        },
        location: {
          zone: 'engine',
          access: 'easy'
        }
      }
    ],
    invalid: [
      { /* missing required fields */ },
      { nodeId: 'test', confidence: 1.5, evidence: [] }, // confidence > 1
      { nodeId: 'test', confidence: 0.5, evidence: [{ text: 'short', source: 'test' }] } // evidence too short
    ]
  },
  
  'ElectroGraph3D.schema.json': {
    valid: [
      {
        vehicleId: 'Toyota:Camry:2020',
        nodes: [
          {
            id: 'battery_001',
            type: 'battery',
            label: 'Main Battery',
            position: [0, 0, 0]
          }
        ],
        edges: [
          {
            id: 'edge_001',
            from: 'battery_001',
            to: 'fuse_001'
          }
        ],
        routes: [
          {
            edgeId: 'edge_001',
            path: [[0, 0, 0], [1, 0, 0]]
          }
        ]
      }
    ],
    invalid: [
      { /* missing required fields */ },
      { vehicleId: 'test', nodes: [{ id: 'test', type: 'invalid', label: 'test', position: [0, 0] }], edges: [], routes: [] } // invalid position array
    ]
  },
  
  'Manifest.schema.json': {
    valid: [
      {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        vehicleId: 'Toyota:Camry:2020',
        glbUrl: 'https://example.com/model.glb',
        components: [
          {
            id: 'battery_001',
            type: 'battery',
            label: 'Main Battery'
          }
        ],
        circuits: [
          {
            id: 'circuit_001',
            label: 'Main Power',
            components: ['battery_001']
          }
        ]
      }
    ],
    invalid: [
      { /* missing required fields */ },
      { jobId: 'invalid-uuid', vehicleId: 'test', glbUrl: 'invalid-url', components: [], circuits: [] }
    ]
  },
  
  'ViewerEvent.schema.json': {
    valid: [
      {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: 'session_123',
        timestamp: '2025-10-08T17:30:00.000Z',
        eventType: 'component_click',
        vehicleId: 'Toyota:Camry:2020',
        payload: {
          componentId: 'battery_001',
          position: [0, 0, 0]
        }
      }
    ],
    invalid: [
      { /* missing required fields */ },
      { eventId: 'invalid', sessionId: 'test', timestamp: 'invalid', eventType: 'invalid_type' }
    ]
  }
};

/**
 * Run validation tests for a specific schema
 */
function testSchema(schemaFile, schemaData) {
  const testData = testDataGenerators[schemaFile];
  if (!testData) {
    console.warn(`⚠️  No test data for schema: ${schemaFile}`);
    return;
  }
  
  console.log(`\n📋 Testing schema: ${schemaData.name}`);
  
  // Test valid data
  testData.valid.forEach((data, index) => {
    const isValid = schemaData.validate(data);
    if (isValid) {
      console.log(`  ✅ Valid test ${index + 1}: PASSED`);
      testResults.passed++;
    } else {
      console.log(`  ❌ Valid test ${index + 1}: FAILED`);
      console.log(`     Errors:`, schemaData.validate.errors);
      testResults.failed++;
      testResults.errors.push({
        schema: schemaFile,
        test: `valid-${index + 1}`,
        errors: schemaData.validate.errors
      });
    }
  });
  
  // Test invalid data  
  testData.invalid.forEach((data, index) => {
    const isValid = schemaData.validate(data);
    if (!isValid) {
      console.log(`  ✅ Invalid test ${index + 1}: PASSED (correctly rejected)`);
      testResults.passed++;
    } else {
      console.log(`  ❌ Invalid test ${index + 1}: FAILED (should have been rejected)`);
      testResults.failed++;
      testResults.errors.push({
        schema: schemaFile,
        test: `invalid-${index + 1}`,
        error: 'Should have been rejected but was accepted'
      });
    }
  });
}

/**
 * Test schema self-validation
 */
function testSchemaIntegrity(schemaFile, schemaData) {
  try {
    // Test that schema compiles without errors
    ajv.validateSchema(schemaData.schema);
    
    if (ajv.errors) {
      console.log(`❌ Schema integrity test failed for ${schemaFile}:`);
      console.log(ajv.errors);
      testResults.failed++;
    } else {
      console.log(`✅ Schema integrity test passed for ${schemaFile}`);
      testResults.passed++;
    }
    
    // Test required $id field
    if (!schemaData.schema.$id) {
      console.log(`❌ Schema ${schemaFile} missing required $id field`);
      testResults.failed++;
    } else {
      console.log(`✅ Schema ${schemaFile} has valid $id: ${schemaData.schema.$id}`);
      testResults.passed++;
    }
    
  } catch (error) {
    console.log(`❌ Schema compilation failed for ${schemaFile}: ${error.message}`);
    testResults.failed++;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Starting Schema Validation Test Suite\n');
  
  try {
    // Load all schemas
    const schemas = loadSchemas();
    
    // Test schema integrity
    console.log('\n🔍 Testing Schema Integrity...');
    for (const [schemaFile, schemaData] of Object.entries(schemas)) {
      testSchemaIntegrity(schemaFile, schemaData);
    }
    
    // Test data validation
    console.log('\n📊 Testing Data Validation...');
    for (const [schemaFile, schemaData] of Object.entries(schemas)) {
      testSchema(schemaFile, schemaData);
    }
    
    // Print final results
    console.log('\n' + '='.repeat(50));
    console.log('📈 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.passed + testResults.failed}`);
    console.log(`🎯 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.errors.forEach(error => {
        console.log(`  - ${error.schema} (${error.test}): ${error.error || 'Validation errors'}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = {
  loadSchemas,
  testSchema,
  testSchemaIntegrity,
  runTests,
  testDataGenerators
};

// Run tests if called directly
if (require.main === module) {
  runTests();
}