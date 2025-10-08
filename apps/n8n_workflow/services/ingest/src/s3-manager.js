/**
 * S3 Manager
 * Handles all S3 operations for data lake storage
 */

const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const crypto = require('crypto');

class S3Manager {
  constructor() {
    this.client = null;
    this.bucket = process.env.S3_BUCKET;
    this.prefix = process.env.S3_PREFIX || 'jobs';
    this.region = process.env.AWS_REGION || 'us-east-1';
    
    if (!this.bucket) {
      throw new Error('S3_BUCKET environment variable is required');
    }
  }

  async initialize() {
    // Initialize S3 client
    this.client = new S3Client({
      region: this.region,
      endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });

    // Test connection
    await this.healthCheck();
  }

  async healthCheck() {
    try {
      // Try to list objects to verify connectivity
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        MaxKeys: 1
      });
      
      await this.client.send(command);
      
      return {
        status: 'healthy',
        bucket: this.bucket,
        region: this.region
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        bucket: this.bucket,
        region: this.region
      };
    }
  }

  /**
   * Store event data as NDJSON
   */
  async storeEvent(eventEnvelope, storagePath) {
    const ndjsonLine = JSON.stringify(eventEnvelope);
    const key = `${this.prefix}/${storagePath}`;
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: ndjsonLine,
      ContentType: 'application/x-ndjson',
      Metadata: {
        eventId: eventEnvelope.eventId,
        jobId: eventEnvelope.jobId,
        stage: eventEnvelope.stage,
        eventType: eventEnvelope.eventType,
        timestamp: eventEnvelope.timestamp
      }
    });

    await this.client.send(command);

    return {
      key,
      size: Buffer.byteLength(ndjsonLine, 'utf8'),
      eventId: eventEnvelope.eventId
    };
  }

  /**
   * Store JSON data with compression
   */
  async storeJSON(data, storagePath, metadata = {}) {
    const jsonString = JSON.stringify(data, null, 2);
    const key = `${this.prefix}/${storagePath}`;
    
    // Calculate hash for integrity
    const hash = crypto.createHash('sha256').update(jsonString).digest('hex');
    
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: jsonString,
      ContentType: 'application/json',
      Metadata: {
        ...metadata,
        contentHash: hash,
        size: Buffer.byteLength(jsonString, 'utf8').toString(),
        timestamp: new Date().toISOString()
      }
    });

    await this.client.send(command);

    return {
      key,
      size: Buffer.byteLength(jsonString, 'utf8'),
      hash
    };
  }

  /**
   * Store binary data (GLB files, etc.)
   */
  async storeBinary(buffer, storagePath, contentType, metadata = {}) {
    const key = `${this.prefix}/${storagePath}`;
    
    // Use multipart upload for large files
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          size: buffer.length.toString(),
          timestamp: new Date().toISOString()
        }
      }
    });

    const result = await upload.done();

    return {
      key,
      size: buffer.length,
      etag: result.ETag,
      location: result.Location
    };
  }

  /**
   * Retrieve data from S3
   */
  async retrieve(storagePath) {
    const key = `${this.prefix}/${storagePath}`;
    
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    try {
      const response = await this.client.send(command);
      const body = await this.streamToString(response.Body);
      
      return {
        key,
        body,
        metadata: response.Metadata,
        contentType: response.ContentType,
        lastModified: response.LastModified
      };
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if object exists
   */
  async exists(storagePath) {
    const key = `${this.prefix}/${storagePath}`;
    
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    try {
      const response = await this.client.send(command);
      return {
        exists: true,
        size: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata
      };
    } catch (error) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        return { exists: false };
      }
      throw error;
    }
  }

  /**
   * List objects with prefix
   */
  async list(pathPrefix, maxKeys = 1000) {
    const key = `${this.prefix}/${pathPrefix}`;
    
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: key,
      MaxKeys: maxKeys
    });

    const response = await this.client.send(command);
    
    return {
      objects: response.Contents || [],
      truncated: response.IsTruncated,
      count: response.KeyCount
    };
  }

  /**
   * Generate storage paths for different data types
   */
  generatePath(type, identifier, extension = '.json') {
    const date = new Date();
    const datePrefix = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    switch (type) {
      case 'event':
        return `raw/events/${datePrefix}/${identifier}.ndjson`;
      
      case 'research':
        return `raw/research/${identifier}.json`;
      
      case 'normalized':
        return `normalized/electrograph/${identifier}.json`;
      
      case 'enriched':
        return `enriched/node_metadata/${identifier}.json`;
      
      case 'spatialized':
        return `spatialized/electrograph3d/${identifier}.json`;
      
      case 'model':
        return `curated/models_glb/${identifier}.glb`;
      
      case 'manifest':
        return `curated/manifests/${identifier}.json`;
      
      case 'viewer':
        return `analytics/viewer_events/${datePrefix}/${identifier}.ndjson`;
      
      case 'manual-review':
        return `manual_review/${datePrefix}/${identifier}.json`;
      
      default:
        throw new Error(`Unknown storage type: ${type}`);
    }
  }

  /**
   * Get data lake statistics
   */
  async getStatistics() {
    const stats = {
      totalObjects: 0,
      totalSize: 0,
      byType: {}
    };

    const types = ['raw', 'normalized', 'enriched', 'spatialized', 'curated', 'analytics'];
    
    for (const type of types) {
      try {
        const listing = await this.list(type, 10000);
        const typeStats = {
          objects: listing.count,
          size: listing.objects.reduce((sum, obj) => sum + (obj.Size || 0), 0)
        };
        
        stats.byType[type] = typeStats;
        stats.totalObjects += typeStats.objects;
        stats.totalSize += typeStats.size;
      } catch (error) {
        stats.byType[type] = { objects: 0, size: 0, error: error.message };
      }
    }

    return stats;
  }

  /**
   * Helper to convert stream to string
   */
  async streamToString(stream) {
    const chunks = [];
    
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks).toString('utf8');
  }

  /**
   * Generate presigned URL for direct access
   */
  async generatePresignedUrl(storagePath, expiresIn = 3600) {
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const key = `${this.prefix}/${storagePath}`;
    
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }
}

module.exports = S3Manager;