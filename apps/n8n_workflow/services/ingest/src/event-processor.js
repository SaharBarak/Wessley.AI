/**
 * Event Processor
 * Central processor for all data lake operations
 */

const { v4: uuidv4 } = require('uuid');
const { formatValidationResult } = require('../../../utils/validation-helpers');

class EventProcessor {
  constructor(s3Manager, cacheManager, schemaValidator) {
    this.s3Manager = s3Manager;
    this.cacheManager = cacheManager;
    this.schemaValidator = schemaValidator;
    this.metrics = {
      eventsStored: 0,
      errorsEncountered: 0,
      lastActivity: null
    };
  }

  async initialize() {
    // Initialize any processor-specific setup
    this.metrics.lastActivity = new Date().toISOString();
  }

  /**
   * Store event to data lake
   */
  async storeEvent(eventEnvelope, storagePath, ndjsonLine) {
    try {
      // Validate event envelope
      const validation = this.schemaValidator.validate('EventEnvelope', eventEnvelope);
      if (!validation.valid) {
        throw new Error(`Event validation failed: ${JSON.stringify(validation.errors)}`);
      }

      // Store to S3
      const result = await this.s3Manager.storeEvent(eventEnvelope, storagePath);
      
      this.metrics.eventsStored++;
      this.metrics.lastActivity = new Date().toISOString();

      return result;
    } catch (error) {
      this.metrics.errorsEncountered++;
      throw error;
    }
  }

  /**
   * Store research manifest
   */
  async storeResearch(manifest, jobId) {
    try {
      // Validate research manifest
      const validation = this.schemaValidator.validate('ResearchManifest', manifest);
      if (!validation.valid) {
        throw new Error(`Research validation failed: ${JSON.stringify(validation.errors)}`);
      }

      const storagePath = this.s3Manager.generatePath('research', jobId);
      const result = await this.s3Manager.storeJSON(manifest, storagePath, { jobId });

      return {
        jobId,
        storagePath: result.key,
        size: result.size
      };
    } catch (error) {
      this.metrics.errorsEncountered++;
      throw error;
    }
  }

  /**
   * Store normalized data
   */
  async storeNormalizedData(type, data, jobId) {
    try {
      // Validate based on type
      let schemaName;
      switch (type) {
        case 'electrograph':
          schemaName = 'ElectroGraph';
          break;
        case 'electrograph3d':
          schemaName = 'ElectroGraph3D';
          break;
        case 'node_metadata':
          schemaName = 'NodeMetadata';
          break;
        case 'manifest':
          schemaName = 'Manifest';
          break;
        default:
          throw new Error(`Unknown normalized data type: ${type}`);
      }

      const validation = this.schemaValidator.validate(schemaName, data);
      if (!validation.valid) {
        throw new Error(`${type} validation failed: ${JSON.stringify(validation.errors)}`);
      }

      const storagePath = this.s3Manager.generatePath(type === 'electrograph' ? 'normalized' : type, jobId);
      const result = await this.s3Manager.storeJSON(data, storagePath, { jobId, type });

      return {
        jobId,
        type,
        storagePath: result.key,
        size: result.size
      };
    } catch (error) {
      this.metrics.errorsEncountered++;
      throw error;
    }
  }

  /**
   * Queue item for manual review
   */
  async queueManualReview(errorPayload, priority, category) {
    try {
      const reviewId = uuidv4();
      const reviewItem = {
        reviewId,
        priority,
        category,
        errorPayload,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const storagePath = this.s3Manager.generatePath('manual-review', reviewId);
      await this.s3Manager.storeJSON(reviewItem, storagePath, { 
        reviewId, 
        priority, 
        category 
      });

      return {
        reviewId,
        priority
      };
    } catch (error) {
      this.metrics.errorsEncountered++;
      throw error;
    }
  }

  /**
   * Store viewer events
   */
  async storeViewerEvents(events, sessionId) {
    try {
      // Validate each event
      for (const event of events) {
        const validation = this.schemaValidator.validate('ViewerEvent', event);
        if (!validation.valid) {
          throw new Error(`Viewer event validation failed: ${JSON.stringify(validation.errors)}`);
        }
      }

      const batchId = uuidv4();
      const storagePath = this.s3Manager.generatePath('viewer', `${sessionId}_${batchId}`);
      
      // Convert to NDJSON format
      const ndjsonContent = events.map(event => JSON.stringify(event)).join('\n');
      
      await this.s3Manager.storeBinary(
        Buffer.from(ndjsonContent, 'utf8'), 
        storagePath, 
        'application/x-ndjson',
        { sessionId, batchId, eventCount: events.length }
      );

      return {
        sessionId,
        eventsStored: events.length
      };
    } catch (error) {
      this.metrics.errorsEncountered++;
      throw error;
    }
  }

  /**
   * Get processing metrics
   */
  async getMetrics() {
    const cacheStats = await this.cacheManager.getStats();
    const s3Stats = await this.s3Manager.getStatistics();

    return {
      processor: this.metrics,
      cache: cacheStats,
      storage: s3Stats,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = EventProcessor;