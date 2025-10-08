/**
 * Validation Helper Utilities
 * Shared utilities for schema validation across the n8n pipeline
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Pre-configured AJV instance with common settings
 */
function createValidator(options = {}) {
  const ajv = new Ajv({
    strict: true,
    allErrors: true,
    verbose: true,
    validateFormats: true,
    addUsedSchema: false,
    ...options
  });
  
  addFormats(ajv);
  
  // Add custom format validators
  ajv.addFormat('vehicle-signature', {
    type: 'string',
    validate: function(data) {
      // Format: "Brand:Model:Year" 
      const pattern = /^[A-Za-z0-9\s\-_]+:[A-Za-z0-9\s\-_]+:\d{4}$/;
      return pattern.test(data);
    }
  });
  
  ajv.addFormat('sha256', {
    type: 'string',
    validate: function(data) {
      return /^[a-f0-9]{64}$/.test(data);
    }
  });
  
  ajv.addFormat('electrical-rating', {
    type: 'string',
    validate: function(data) {
      // Formats like "12V", "15A", "55W"
      return /^\d+(\.\d+)?(V|A|W|Ω|F|H)$/.test(data);
    }
  });
  
  return ajv;
}

/**
 * Load and cache schema validators
 */
class SchemaManager {
  constructor(schemaDir) {
    this.schemaDir = schemaDir || path.join(__dirname, '../schemas');
    this.validators = new Map();
    this.schemas = new Map();
    this.ajv = createValidator();
  }
  
  /**
   * Load a schema and create validator
   */
  loadSchema(schemaName) {
    if (this.validators.has(schemaName)) {
      return this.validators.get(schemaName);
    }
    
    const schemaPath = path.join(this.schemaDir, `${schemaName}.schema.json`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    try {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      
      // Validate schema itself
      if (!this.ajv.validateSchema(schema)) {
        throw new Error(`Invalid schema ${schemaName}: ${JSON.stringify(this.ajv.errors)}`);
      }
      
      const validator = this.ajv.compile(schema);
      
      this.schemas.set(schemaName, schema);
      this.validators.set(schemaName, validator);
      
      return validator;
      
    } catch (error) {
      throw new Error(`Failed to load schema ${schemaName}: ${error.message}`);
    }
  }
  
  /**
   * Validate data against a schema
   */
  validate(schemaName, data) {
    const validator = this.loadSchema(schemaName);
    const valid = validator(data);
    
    return {
      valid,
      errors: validator.errors || [],
      schema: this.schemas.get(schemaName),
      data
    };
  }
  
  /**
   * Get all available schemas
   */
  getAvailableSchemas() {
    const files = fs.readdirSync(this.schemaDir);
    return files
      .filter(file => file.endsWith('.schema.json'))
      .map(file => file.replace('.schema.json', ''));
  }
  
  /**
   * Preload all schemas
   */
  preloadAll() {
    const schemas = this.getAvailableSchemas();
    for (const schema of schemas) {
      this.loadSchema(schema);
    }
    return schemas.length;
  }
}

/**
 * Validation result formatter
 */
function formatValidationResult(result) {
  if (result.valid) {
    return {
      success: true,
      message: 'Validation successful',
      schemaId: result.schema.$id,
      timestamp: new Date().toISOString()
    };
  }
  
  const errorSummary = {
    count: result.errors.length,
    keywords: [...new Set(result.errors.map(e => e.keyword))],
    paths: [...new Set(result.errors.map(e => e.instancePath || 'root'))]
  };
  
  const detailedErrors = result.errors.map(error => ({
    path: error.instancePath || 'root',
    keyword: error.keyword,
    message: error.message,
    allowedValues: error.params?.allowedValues,
    receivedValue: error.data
  }));
  
  return {
    success: false,
    message: `Validation failed: ${errorSummary.count} errors`,
    schemaId: result.schema.$id,
    errorSummary,
    errors: detailedErrors,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate payload hash for deduplication
 */
function generatePayloadHash(payload) {
  const sortedPayload = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(sortedPayload).digest('hex');
}

/**
 * Create vehicle signature from components
 */
function createVehicleSignature(brand, model, year, trim = null, market = null) {
  let signature = `${brand}:${model}:${year}`;
  
  if (trim) {
    signature += `:${trim}`;
  }
  
  if (market) {
    signature += `:${market}`;
  }
  
  return signature;
}

/**
 * Parse vehicle signature back to components
 */
function parseVehicleSignature(signature) {
  const parts = signature.split(':');
  
  if (parts.length < 3) {
    throw new Error(`Invalid vehicle signature format: ${signature}`);
  }
  
  const result = {
    brand: parts[0],
    model: parts[1],
    year: parseInt(parts[2])
  };
  
  if (parts[3]) result.trim = parts[3];
  if (parts[4]) result.market = parts[4];
  
  return result;
}

/**
 * Confidence score validation
 */
function validateConfidenceScore(score, threshold = 0.75) {
  if (typeof score !== 'number' || score < 0 || score > 1) {
    return {
      valid: false,
      error: 'Confidence score must be a number between 0 and 1'
    };
  }
  
  return {
    valid: true,
    meetsThreshold: score >= threshold,
    score,
    threshold
  };
}

/**
 * Evidence validation for LLM metadata
 */
function validateEvidence(evidence) {
  const errors = [];
  
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return {
      valid: false,
      errors: ['Evidence must be a non-empty array']
    };
  }
  
  evidence.forEach((item, index) => {
    if (!item.text || typeof item.text !== 'string') {
      errors.push(`Evidence item ${index}: missing or invalid text field`);
    } else if (item.text.length < 10) {
      errors.push(`Evidence item ${index}: text too short (minimum 10 characters)`);
    }
    
    if (!item.source || typeof item.source !== 'string') {
      errors.push(`Evidence item ${index}: missing or invalid source field`);
    }
    
    if (item.confidence !== undefined) {
      const confResult = validateConfidenceScore(item.confidence);
      if (!confResult.valid) {
        errors.push(`Evidence item ${index}: ${confResult.error}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    evidenceCount: evidence.length
  };
}

/**
 * Electrical component type validation
 */
function validateComponentType(type) {
  const validTypes = [
    'battery', 'fuse', 'relay', 'connector', 'ecu', 'sensor', 
    'actuator', 'lamp', 'motor', 'splice', 'ground', 'terminal'
  ];
  
  return {
    valid: validTypes.includes(type),
    type,
    validTypes
  };
}

/**
 * 3D position validation
 */
function validate3DPosition(position) {
  if (!Array.isArray(position) || position.length !== 3) {
    return {
      valid: false,
      error: 'Position must be an array of 3 numbers [x, y, z]'
    };
  }
  
  if (!position.every(coord => typeof coord === 'number' && !isNaN(coord))) {
    return {
      valid: false,
      error: 'All position coordinates must be valid numbers'
    };
  }
  
  return {
    valid: true,
    position,
    magnitude: Math.sqrt(position[0]**2 + position[1]**2 + position[2]**2)
  };
}

/**
 * Batch validation helper
 */
async function validateBatch(schemaManager, validations) {
  const results = [];
  
  for (const { schemaName, data, id } of validations) {
    try {
      const result = schemaManager.validate(schemaName, data);
      results.push({
        id: id || `${schemaName}-${results.length}`,
        schemaName,
        ...formatValidationResult(result)
      });
    } catch (error) {
      results.push({
        id: id || `${schemaName}-${results.length}`,
        schemaName,
        success: false,
        message: `Validation error: ${error.message}`,
        error: error.message
      });
    }
  }
  
  const summary = {
    total: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    successRate: 0
  };
  
  summary.successRate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;
  
  return {
    results,
    summary
  };
}

module.exports = {
  createValidator,
  SchemaManager,
  formatValidationResult,
  generatePayloadHash,
  createVehicleSignature,
  parseVehicleSignature,
  validateConfidenceScore,
  validateEvidence,
  validateComponentType,
  validate3DPosition,
  validateBatch
};