#!/usr/bin/env node

/**
 * Schema Validation CLI Tool
 * Command-line utility for validating schemas and data
 */

const fs = require('fs');
const path = require('path');
const { SchemaManager, formatValidationResult } = require('../utils/validation-helpers');

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];

const COMMANDS = {
  'validate-data': 'Validate JSON data against a schema',
  'validate-schemas': 'Validate all schema files',
  'list-schemas': 'List available schemas',
  'test-schema': 'Test a schema with sample data',
  'help': 'Show this help message'
};

/**
 * Show help message
 */
function showHelp() {
  console.log('📋 Schema Validation CLI Tool\n');
  console.log('Usage: node validate-schemas.js <command> [options]\n');
  console.log('Commands:');
  
  for (const [cmd, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${cmd.padEnd(20)} ${desc}`);
  }
  
  console.log('\nExamples:');
  console.log('  node validate-schemas.js validate-data EventEnvelope data.json');
  console.log('  node validate-schemas.js validate-schemas');
  console.log('  node validate-schemas.js list-schemas');
  console.log('  node validate-schemas.js test-schema NodeMetadata');
}

/**
 * Validate JSON data against a schema
 */
function validateData() {
  const schemaName = args[1];
  const dataFile = args[2];
  
  if (!schemaName || !dataFile) {
    console.error('❌ Usage: validate-data <schema-name> <data-file>');
    process.exit(1);
  }
  
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ Data file not found: ${dataFile}`);
    process.exit(1);
  }
  
  try {
    const schemaManager = new SchemaManager();
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    console.log(`🔍 Validating ${dataFile} against ${schemaName} schema...`);
    
    const result = schemaManager.validate(schemaName, data);
    const formatted = formatValidationResult(result);
    
    if (formatted.success) {
      console.log('✅ Validation successful!');
      console.log(`   Schema: ${formatted.schemaId}`);
      console.log(`   Timestamp: ${formatted.timestamp}`);
    } else {
      console.log('❌ Validation failed!');
      console.log(`   Schema: ${formatted.schemaId}`);
      console.log(`   Errors: ${formatted.errorSummary.count}`);
      console.log(`   Error paths: ${formatted.errorSummary.paths.join(', ')}`);
      
      if (args.includes('--verbose')) {
        console.log('\n📝 Detailed errors:');
        formatted.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error.path}: ${error.message}`);
          if (error.allowedValues) {
            console.log(`      Allowed: ${error.allowedValues.join(', ')}`);
          }
          if (error.receivedValue !== undefined) {
            console.log(`      Received: ${JSON.stringify(error.receivedValue)}`);
          }
        });
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Validate all schema files
 */
function validateSchemas() {
  try {
    const schemaManager = new SchemaManager();
    const schemas = schemaManager.getAvailableSchemas();
    
    console.log(`🔍 Validating ${schemas.length} schemas...\n`);
    
    let passed = 0;
    let failed = 0;
    
    for (const schemaName of schemas) {
      try {
        schemaManager.loadSchema(schemaName);
        console.log(`✅ ${schemaName}: Valid`);
        passed++;
      } catch (error) {
        console.log(`❌ ${schemaName}: ${error.message}`);
        failed++;
      }
    }
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * List available schemas
 */
function listSchemas() {
  try {
    const schemaManager = new SchemaManager();
    const schemas = schemaManager.getAvailableSchemas();
    
    console.log(`📋 Available schemas (${schemas.length}):\n`);
    
    for (const schemaName of schemas) {
      try {
        const validator = schemaManager.loadSchema(schemaName);
        const schema = schemaManager.schemas.get(schemaName);
        
        console.log(`📄 ${schemaName}`);
        console.log(`   ID: ${schema.$id || 'No ID'}`);
        console.log(`   Title: ${schema.title || 'No title'}`);
        console.log(`   Description: ${schema.description || 'No description'}`);
        console.log('');
        
      } catch (error) {
        console.log(`❌ ${schemaName}: Error loading schema`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Test a schema with sample data
 */
function testSchema() {
  const schemaName = args[1];
  
  if (!schemaName) {
    console.error('❌ Usage: test-schema <schema-name>');
    process.exit(1);
  }
  
  try {
    const schemaManager = new SchemaManager();
    
    // Load test data generators
    const testSuitePath = path.join(__dirname, '../test/schema-validation-suite.js');
    const { testDataGenerators } = require(testSuitePath);
    
    const testData = testDataGenerators[`${schemaName}.schema.json`];
    
    if (!testData) {
      console.log(`⚠️  No test data available for schema: ${schemaName}`);
      console.log('   Available test schemas:');
      Object.keys(testDataGenerators).forEach(key => {
        console.log(`   - ${key.replace('.schema.json', '')}`);
      });
      return;
    }
    
    console.log(`🧪 Testing schema: ${schemaName}\n`);
    
    let passed = 0;
    let failed = 0;
    
    // Test valid data
    if (testData.valid) {
      console.log('✅ Valid data tests:');
      testData.valid.forEach((data, index) => {
        const result = schemaManager.validate(schemaName, data);
        if (result.valid) {
          console.log(`   Test ${index + 1}: ✅ PASSED`);
          passed++;
        } else {
          console.log(`   Test ${index + 1}: ❌ FAILED`);
          console.log(`   Errors: ${result.errors.length}`);
          failed++;
        }
      });
    }
    
    // Test invalid data
    if (testData.invalid) {
      console.log('\n❌ Invalid data tests (should fail):');
      testData.invalid.forEach((data, index) => {
        const result = schemaManager.validate(schemaName, data);
        if (!result.valid) {
          console.log(`   Test ${index + 1}: ✅ PASSED (correctly rejected)`);
          passed++;
        } else {
          console.log(`   Test ${index + 1}: ❌ FAILED (should have been rejected)`);
          failed++;
        }
      });
    }
    
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main CLI entry point
 */
function main() {
  if (args.length === 0 || command === 'help') {
    showHelp();
    return;
  }
  
  switch (command) {
    case 'validate-data':
      validateData();
      break;
      
    case 'validate-schemas':
      validateSchemas();
      break;
      
    case 'list-schemas':
      listSchemas();
      break;
      
    case 'test-schema':
      testSchema();
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Use "help" to see available commands.');
      process.exit(1);
  }
}

// Run CLI
main();