/**
 * Schema Validator
 * Validation service using shared validation helpers
 */

const path = require('path');
const { SchemaManager } = require('../../../utils/validation-helpers');

class SchemaValidator {
  constructor() {
    this.schemaManager = null;
    this.schemaDir = path.join(__dirname, '../../../schemas');
  }

  async initialize() {
    this.schemaManager = new SchemaManager(this.schemaDir);
    
    // Preload all schemas
    const count = this.schemaManager.preloadAll();
    console.log(`Loaded ${count} schemas`);
  }

  healthCheck() {
    if (!this.schemaManager) {
      return {
        status: 'unhealthy',
        error: 'Schema manager not initialized'
      };
    }

    try {
      const schemas = this.schemaManager.getAvailableSchemas();
      return {
        status: 'healthy',
        schemasLoaded: schemas.length,
        schemas: schemas
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  validate(schemaName, data) {
    return this.schemaManager.validate(schemaName, data);
  }
}

module.exports = SchemaValidator;