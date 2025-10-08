/**
 * Cache Manager
 * Redis-based caching for LLM metadata and expensive operations
 */

const redis = require('redis');
const crypto = require('crypto');

class CacheManager {
  constructor() {
    this.client = null;
    this.defaultTTL = parseInt(process.env.CACHE_TTL_DEFAULT) || 3600; // 1 hour
    this.ttlConfig = {
      llm_metadata: parseInt(process.env.CACHE_TTL_LLM_METADATA) || 86400, // 24 hours
      research: parseInt(process.env.CACHE_TTL_RESEARCH) || 604800, // 7 days
      vehicle_sig: parseInt(process.env.CACHE_TTL_VEHICLE_SIG) || 2592000 // 30 days
    };
    this.keyPrefix = 'wessley:';
  }

  async initialize() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = redis.createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DB) || 0,
      retry_delay_on_failure_ms: 100,
      retry_strategy: (times) => Math.min(times * 50, 2000)
    });

    this.client.on('error', (error) => {
      console.error('Redis client error:', error);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.client.on('ready', () => {
      console.log('Redis client ready');
    });

    await this.client.connect();
    
    // Test connection
    await this.healthCheck();
  }

  async healthCheck() {
    try {
      const result = await this.client.ping();
      
      if (result === 'PONG') {
        return {
          status: 'healthy',
          response: result,
          connected: this.client.isReady
        };
      } else {
        return {
          status: 'unhealthy',
          response: result,
          connected: this.client.isReady
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      };
    }
  }

  /**
   * Generate cache key with prefix and hashing for long keys
   */
  generateKey(namespace, identifier, suffix = '') {
    const baseKey = `${namespace}:${identifier}${suffix ? ':' + suffix : ''}`;
    
    // Hash long keys to avoid Redis key length limits
    if (baseKey.length > 200) {
      const hash = crypto.createHash('sha256').update(baseKey).digest('hex');
      return `${this.keyPrefix}${namespace}:hash:${hash}`;
    }
    
    return `${this.keyPrefix}${baseKey}`;
  }

  /**
   * Store value with automatic TTL based on type
   */
  async set(key, value, ttl = null, type = 'default') {
    const cacheKey = this.generateKey('cache', key);
    const serializedValue = JSON.stringify({
      data: value,
      timestamp: new Date().toISOString(),
      type
    });
    
    const cacheTTL = ttl || this.ttlConfig[type] || this.defaultTTL;
    
    await this.client.setEx(cacheKey, cacheTTL, serializedValue);
    
    return {
      key: cacheKey,
      ttl: cacheTTL,
      size: Buffer.byteLength(serializedValue, 'utf8')
    };
  }

  /**
   * Retrieve value from cache
   */
  async get(key) {
    const cacheKey = this.generateKey('cache', key);
    
    try {
      const result = await this.client.get(cacheKey);
      
      if (!result) {
        return null;
      }
      
      const parsed = JSON.parse(result);
      
      return {
        data: parsed.data,
        timestamp: parsed.timestamp,
        type: parsed.type,
        age: Date.now() - new Date(parsed.timestamp).getTime()
      };
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    const cacheKey = this.generateKey('cache', key);
    const result = await this.client.del(cacheKey);
    return result > 0;
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    const cacheKey = this.generateKey('cache', key);
    const result = await this.client.exists(cacheKey);
    return result > 0;
  }

  /**
   * Cache LLM metadata with evidence hash
   */
  async cacheLLMMetadata(vehicleSig, nodeId, evidenceHash, metadata) {
    const key = `llm:${vehicleSig}:${nodeId}:${evidenceHash}`;
    return await this.set(key, metadata, null, 'llm_metadata');
  }

  /**
   * Retrieve LLM metadata
   */
  async getLLMMetadata(vehicleSig, nodeId, evidenceHash) {
    const key = `llm:${vehicleSig}:${nodeId}:${evidenceHash}`;
    const result = await this.get(key);
    return result ? result.data : null;
  }

  /**
   * Cache research results
   */
  async cacheResearch(vehicleSig, researchData) {
    const key = `research:${vehicleSig}`;
    return await this.set(key, researchData, null, 'research');
  }

  /**
   * Retrieve research results
   */
  async getResearch(vehicleSig) {
    const key = `research:${vehicleSig}`;
    const result = await this.get(key);
    return result ? result.data : null;
  }

  /**
   * Cache vehicle signature mapping
   */
  async cacheVehicleSignature(brand, model, year, trim, market, signature) {
    const key = `vehicle:${brand}:${model}:${year}:${trim || 'base'}:${market || 'global'}`;
    return await this.set(key, signature, null, 'vehicle_sig');
  }

  /**
   * Batch operations
   */
  async mget(keys) {
    const cacheKeys = keys.map(key => this.generateKey('cache', key));
    const results = await this.client.mGet(cacheKeys);
    
    return results.map((result, index) => {
      if (!result) return null;
      
      try {
        const parsed = JSON.parse(result);
        return {
          key: keys[index],
          data: parsed.data,
          timestamp: parsed.timestamp,
          type: parsed.type
        };
      } catch (error) {
        console.error(`Error parsing cached value for key ${keys[index]}:`, error);
        return null;
      }
    });
  }

  async mset(entries, ttl = null) {
    const pipeline = this.client.multi();
    
    for (const { key, value, type = 'default', ttl: entryTTL } of entries) {
      const cacheKey = this.generateKey('cache', key);
      const serializedValue = JSON.stringify({
        data: value,
        timestamp: new Date().toISOString(),
        type
      });
      
      const cacheTTL = entryTTL || ttl || this.ttlConfig[type] || this.defaultTTL;
      pipeline.setEx(cacheKey, cacheTTL, serializedValue);
    }
    
    await pipeline.exec();
    
    return entries.length;
  }

  /**
   * Pattern-based operations
   */
  async deletePattern(pattern) {
    const fullPattern = `${this.keyPrefix}${pattern}`;
    const keys = await this.client.keys(fullPattern);
    
    if (keys.length === 0) {
      return 0;
    }
    
    return await this.client.del(keys);
  }

  async getPattern(pattern, limit = 1000) {
    const fullPattern = `${this.keyPrefix}${pattern}`;
    const keys = await this.client.keys(fullPattern);
    
    if (keys.length === 0) {
      return [];
    }
    
    // Limit results to prevent memory issues
    const limitedKeys = keys.slice(0, limit);
    const values = await this.client.mGet(limitedKeys);
    
    return limitedKeys.map((key, index) => {
      const cleanKey = key.replace(this.keyPrefix, '');
      const value = values[index];
      
      if (!value) return { key: cleanKey, value: null };
      
      try {
        const parsed = JSON.parse(value);
        return {
          key: cleanKey,
          data: parsed.data,
          timestamp: parsed.timestamp,
          type: parsed.type
        };
      } catch (error) {
        return { key: cleanKey, value: null, error: error.message };
      }
    });
  }

  /**
   * Cache statistics and monitoring
   */
  async getStats() {
    const info = await this.client.info('memory');
    const keyspace = await this.client.info('keyspace');
    
    // Parse Redis info output
    const memoryStats = {};
    info.split('\r\n').forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        memoryStats[key] = value;
      }
    });
    
    const keyspaceStats = {};
    keyspace.split('\r\n').forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        keyspaceStats[key] = value;
      }
    });
    
    // Get Wessley-specific stats
    const wessleyKeys = await this.client.keys(`${this.keyPrefix}*`);
    
    return {
      memory: {
        used: memoryStats.used_memory_human,
        peak: memoryStats.used_memory_peak_human,
        rss: memoryStats.used_memory_rss_human
      },
      keyspace: keyspaceStats,
      wessley: {
        totalKeys: wessleyKeys.length,
        keyPrefix: this.keyPrefix
      },
      connected: this.client.isReady,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup expired keys
   */
  async cleanup() {
    const pattern = `${this.keyPrefix}*`;
    const keys = await this.client.keys(pattern);
    
    let cleanedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      const pipeline = this.client.multi();
      
      for (const key of batch) {
        pipeline.ttl(key);
      }
      
      const ttls = await pipeline.exec();
      const expiredKeys = [];
      
      ttls.forEach((ttl, index) => {
        if (ttl[1] === -1) { // No expiration set, but should have one
          expiredKeys.push(batch[index]);
        }
      });
      
      if (expiredKeys.length > 0) {
        await this.client.del(expiredKeys);
        cleanedCount += expiredKeys.length;
      }
    }
    
    return {
      totalKeys: keys.length,
      cleanedKeys: cleanedCount,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Close connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

module.exports = CacheManager;