// Element query caching for performance optimization

import { SuperPancakeError, validateSession, validateSelector } from './errors.js';

class QueryCache {
  constructor(maxSize = 100, ttl = 30000) { // 30 seconds TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.hits = 0;
    this.misses = 0;
  }

  _generateKey(session, selector) {
    // Use session object reference and selector as cache key
    return `${session.constructor.name}_${selector}`;
  }

  _isExpired(entry) {
    return Date.now() - entry.timestamp > this.ttl;
  }

  _evictOldest() {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
    }
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  get(session, selector) {
    validateSession(session);
    validateSelector(selector);

    const key = this._generateKey(session, selector);
    const entry = this.cache.get(key);

    if (!entry || this._isExpired(entry)) {
      this.misses++;
      if (entry) {
        this.cache.delete(key);
      }
      return null;
    }

    this.hits++;
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.nodeId;
  }

  set(session, selector, nodeId) {
    validateSession(session);
    validateSelector(selector);

    if (!nodeId || typeof nodeId !== 'number') {
      throw new SuperPancakeError('Invalid nodeId for cache', 'INVALID_CACHE_VALUE', { nodeId });
    }

    const key = this._generateKey(session, selector);

    // Cleanup expired entries periodically
    if (this.cache.size > this.maxSize * 0.8) {
      this._cleanup();
    }

    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      this._evictOldest();
    }

    this.cache.set(key, {
      nodeId,
      timestamp: Date.now()
    });
  }

  invalidate(session, selector) {
    if (session && selector) {
      const key = this._generateKey(session, selector);
      this.cache.delete(key);
    }
  }

  invalidateAll() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }

  // Manual validation that element still exists
  async validateCachedNode(session, nodeId) {
    try {
      await session.send('DOM.describeNode', { nodeId });
      return true;
    } catch (error) {
      // Node no longer exists
      return false;
    }
  }
}

// Global cache instance
const globalCache = new QueryCache();

// Enhanced querySelector with caching
export async function cachedQuerySelector(session, selector, useCache = true) {
  validateSession(session);
  validateSelector(selector);

  if (!useCache) {
    return await performDirectQuery(session, selector);
  }

  // Try cache first
  const cachedNodeId = globalCache.get(session, selector);
  if (cachedNodeId) {
    // Validate cached node still exists
    const isValid = await globalCache.validateCachedNode(session, cachedNodeId);
    if (isValid) {
      return cachedNodeId;
    } else {
      // Remove invalid entry
      globalCache.invalidate(session, selector);
    }
  }

  // Cache miss or invalid - perform fresh query
  const nodeId = await performDirectQuery(session, selector);
  if (nodeId) {
    globalCache.set(session, selector, nodeId);
  }

  return nodeId;
}

async function performDirectQuery(session, selector) {
  try {
    const { root: { nodeId } } = await session.send('DOM.getDocument');
    const { nodeId: foundId } = await session.send('DOM.querySelector', { nodeId, selector });
    return foundId || null;
  } catch (error) {
    throw new SuperPancakeError(
      `Failed to query selector "${selector}": ${error.message}`,
      'QUERY_SELECTOR_FAILED',
      { selector }
    );
  }
}

// Cache management functions
export function getCacheStats() {
  return globalCache.getStats();
}

export function clearQueryCache() {
  globalCache.invalidateAll();
}

export function invalidateCacheForSelector(session, selector) {
  globalCache.invalidate(session, selector);
}

// Configure cache settings
export function configureCaching(options = {}) {
  const { maxSize, ttl } = options;
  
  if (maxSize !== undefined) {
    globalCache.maxSize = maxSize;
  }
  
  if (ttl !== undefined) {
    globalCache.ttl = ttl;
  }
  
  return globalCache.getStats();
}

// Batch invalidation for form changes
export function invalidateCacheForForm(session, formSelector) {
  // Clear cache for form and all its descendants
  globalCache.invalidateAll(); // Simple approach - could be more targeted
}

export { globalCache as queryCache };