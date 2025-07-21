// Element query caching for performance optimization

import { SuperPancakeError, validateSession, validateSelector } from './errors.js';

class QueryCache {
  constructor(maxSize = 100, ttl = 5000) { // Reduced to 5 seconds TTL for dynamic content
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.dynamicTTL = 5000; // 5 seconds for dynamic content
    this.staticTTL = 30000; // 30 seconds for static content
    this.hits = 0;
    this.misses = 0;
    this.invalidationListeners = new Map(); // Event-driven invalidation
    this.sessionRegistry = new WeakMap(); // Better session isolation
    this.sessionCounter = 0;
  }

  _generateKey(session, selector) {
    // Enhanced session isolation with unique session IDs
    let sessionId = this.sessionRegistry.get(session);
    if (!sessionId) {
      sessionId = `session_${++this.sessionCounter}_${Date.now()}`;
      this.sessionRegistry.set(session, sessionId);
    }
    return `${sessionId}:${selector}`;
  }

  _isExpired(entry) {
    const age = Date.now() - entry.timestamp;
    const ttl = entry.isDynamic ? this.dynamicTTL : this.staticTTL;
    return age > ttl;
  }

  _isDynamicContent(selector) {
    // Heuristics to determine if content is likely dynamic
    const dynamicPatterns = [
      /\[data-/i,           // Dynamic attributes
      /input|select|textarea/i, // Form elements
      /\.error|\.warning|\.message/i, // Status messages
      /\.loading|\.spinner/i, // Loading states
      /\.count|\.total|\.progress/i, // Counters
      /#\w*list|#\w*table/i, // Dynamic lists/tables
      /\.live|\.real-time/i, // Real-time content
    ];
    
    return dynamicPatterns.some(pattern => pattern.test(selector));
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
    const isDynamic = this._isDynamicContent(selector);

    // Cleanup expired entries periodically
    if (this.cache.size > this.maxSize * 0.8) {
      this._cleanup();
    }

    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize) {
      this._evictOldest();
    }

    const entry = {
      nodeId,
      timestamp: Date.now(),
      isDynamic,
      selector,
      sessionId: this.sessionRegistry.get(session)
    };

    this.cache.set(key, entry);
    
    // Set up event-driven invalidation for dynamic content
    if (isDynamic) {
      this._setupInvalidationListener(session, selector, key);
    }
  }

  _setupInvalidationListener(session, selector, cacheKey) {
    // Register for automatic invalidation on DOM mutations
    const listenerId = `${cacheKey}_listener`;
    
    if (!this.invalidationListeners.has(listenerId)) {
      const listener = {
        selector,
        cacheKey,
        sessionId: this.sessionRegistry.get(session),
        timestamp: Date.now()
      };
      
      this.invalidationListeners.set(listenerId, listener);
    }
  }

  invalidate(session, selector) {
    if (session && selector) {
      const key = this._generateKey(session, selector);
      this.cache.delete(key);
      
      // Clean up associated listeners
      const listenerId = `${key}_listener`;
      this.invalidationListeners.delete(listenerId);
    }
  }

  // Event-driven invalidation methods
  invalidateByPattern(session, selectorPattern) {
    const sessionId = this.sessionRegistry.get(session);
    if (!sessionId) return;
    
    const keysToDelete = [];
    for (const [key, entry] of this.cache) {
      if (key.startsWith(`${sessionId}:`) && selectorPattern.test(entry.selector)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      const listenerId = `${key}_listener`;
      this.invalidationListeners.delete(listenerId);
    });
    
    console.log(`📋 Invalidated ${keysToDelete.length} cache entries matching pattern`);
  }

  invalidateSession(session) {
    const sessionId = this.sessionRegistry.get(session);
    if (!sessionId) return;
    
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.startsWith(`${sessionId}:`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      const listenerId = `${key}_listener`;
      this.invalidationListeners.delete(listenerId);
    });
    
    console.log(`🔄 Invalidated ${keysToDelete.length} cache entries for session`);
  }

  // Triggered by DOM mutations
  onDOMModification(session, mutatedSelectors = []) {
    console.log('🔄 DOM modification detected, invalidating affected cache entries...');
    
    // Invalidate all dynamic content
    this.invalidateByPattern(session, /./); // Invalidate all for this session for now
    
    // In the future, we could be more selective based on mutatedSelectors
    // mutatedSelectors.forEach(selector => {
    //   this.invalidate(session, selector);
    //   this.invalidateByPattern(session, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    // });
  }

  invalidateAll() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const dynamicEntries = Array.from(this.cache.values()).filter(entry => entry.isDynamic).length;
    const staticEntries = this.cache.size - dynamicEntries;
    
    return {
      size: this.cache.size,
      dynamicEntries,
      staticEntries,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
      maxSize: this.maxSize,
      ttl: this.ttl,
      dynamicTTL: this.dynamicTTL,
      staticTTL: this.staticTTL,
      activeListeners: this.invalidationListeners.size,
      activeSessions: this.sessionCounter
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

// Enhanced batch invalidation for form changes
export function invalidateCacheForForm(session, formSelector) {
  console.log(`📋 Invalidating cache for form: ${formSelector}`);
  
  // Invalidate form-related selectors
  const formPatterns = [
    new RegExp(formSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), // Exact form
    /input|select|textarea|button/, // Form elements
    /\.error|\.warning|\.message/, // Status messages
    /\[data-/i // Dynamic attributes
  ];
  
  formPatterns.forEach(pattern => {
    globalCache.invalidateByPattern(session, pattern);
  });
}

// Event-driven invalidation exports
export function invalidateCacheByPattern(session, pattern) {
  globalCache.invalidateByPattern(session, pattern);
}

export function invalidateSessionCache(session) {
  globalCache.invalidateSession(session);
}

export function onDOMModification(session, mutatedSelectors) {
  globalCache.onDOMModification(session, mutatedSelectors);
}

// Configure enhanced caching
export function configureEnhancedCaching(options = {}) {
  const { maxSize, dynamicTTL, staticTTL } = options;
  
  if (maxSize !== undefined) {
    globalCache.maxSize = maxSize;
  }
  
  if (dynamicTTL !== undefined) {
    globalCache.dynamicTTL = dynamicTTL;
  }
  
  if (staticTTL !== undefined) {
    globalCache.staticTTL = staticTTL;
  }
  
  console.log(`🔧 Cache configured: Dynamic TTL=${globalCache.dynamicTTL}ms, Static TTL=${globalCache.staticTTL}ms`);
  return globalCache.getStats();
}

export { globalCache as queryCache };