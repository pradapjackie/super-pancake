import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cachedQuerySelector,
  getCacheStats,
  clearQueryCache,
  invalidateCacheForSelector,
  configureCaching,
  queryCache
} from '../../core/query-cache.js';
import { SuperPancakeError } from '../../core/errors.js';

describe('Query Cache', () => {
  let mockSession;
  
  beforeEach(() => {
    clearQueryCache();
    mockSession = {
      send: vi.fn(),
      constructor: { name: 'MockSession' }
    };
  });

  afterEach(() => {
    clearQueryCache();
  });

  describe('cachedQuerySelector', () => {
    it('should perform direct query when cache disabled', async () => {
      const nodeId = 123;
      mockSession.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId });
      
      const result = await cachedQuerySelector(mockSession, '#test', false);
      
      expect(result).toBe(nodeId);
      expect(mockSession.send).toHaveBeenCalledTimes(2);
    });

    it('should cache successful queries', async () => {
      const nodeId = 123;
      mockSession.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId })
        .mockResolvedValueOnce({ nodeId }); // For validation
      
      // First call - cache miss
      const result1 = await cachedQuerySelector(mockSession, '#test');
      expect(result1).toBe(nodeId);
      
      // Second call - cache hit
      const result2 = await cachedQuerySelector(mockSession, '#test');
      expect(result2).toBe(nodeId);
      
      // Should only call DOM operations once for cache miss
      expect(mockSession.send).toHaveBeenCalledTimes(3); // getDocument, querySelector, validation
    });

    it('should validate cached nodes', async () => {
      const nodeId = 123;
      mockSession.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId })
        .mockRejectedValueOnce(new Error('Node not found')) // Validation fails
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId: 456 }); // Fresh query
      
      // First call - populates cache
      await cachedQuerySelector(mockSession, '#test');
      
      // Second call - validation fails, performs fresh query
      const result = await cachedQuerySelector(mockSession, '#test');
      expect(result).toBe(456);
    });

    it('should handle query failures', async () => {
      mockSession.send.mockRejectedValueOnce(new Error('Query failed'));
      
      await expect(cachedQuerySelector(mockSession, '#test'))
        .rejects.toThrow(SuperPancakeError);
    });

    it('should return null for elements not found', async () => {
      mockSession.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId: null });
      
      const result = await cachedQuerySelector(mockSession, '#notfound');
      expect(result).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should track cache statistics', async () => {
      const nodeId = 123;
      mockSession.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId })
        .mockResolvedValueOnce({ nodeId }); // validation
      
      // Cache miss
      await cachedQuerySelector(mockSession, '#test');
      
      // Cache hit
      await cachedQuerySelector(mockSession, '#test');
      
      const stats = getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
      expect(stats.size).toBe(1);
    });

    it('should clear cache completely', async () => {
      const nodeId = 123;
      mockSession.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId });
      
      await cachedQuerySelector(mockSession, '#test');
      expect(getCacheStats().size).toBe(1);
      
      clearQueryCache();
      const stats = getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should invalidate specific selectors', async () => {
      const nodeId = 123;
      mockSession.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId });
      
      await cachedQuerySelector(mockSession, '#test');
      expect(getCacheStats().size).toBe(1);
      
      invalidateCacheForSelector(mockSession, '#test');
      expect(getCacheStats().size).toBe(0);
    });

    it('should configure cache settings', () => {
      const originalStats = getCacheStats();
      
      const newStats = configureCaching({ maxSize: 50, ttl: 60000 });
      
      expect(newStats.maxSize).toBe(50);
      expect(newStats.ttl).toBe(60000);
    });
  });

  describe('Cache Eviction', () => {
    it('should evict oldest entries when max size reached', async () => {
      // Set small cache size for testing
      configureCaching({ maxSize: 2, ttl: 30000 });
      
      const nodeId = 123;
      mockSession.send.mockResolvedValue({ root: { nodeId: 1 } });
      mockSession.send.mockResolvedValue({ nodeId });
      
      // Fill cache to capacity
      await cachedQuerySelector(mockSession, '#test1');
      await cachedQuerySelector(mockSession, '#test2');
      expect(getCacheStats().size).toBe(2);
      
      // Add third item - should evict first
      await cachedQuerySelector(mockSession, '#test3');
      expect(getCacheStats().size).toBe(2);
    });

    it('should clean up expired entries', async () => {
      // Set very short TTL for testing
      configureCaching({ maxSize: 100, ttl: 1 });
      
      const nodeId = 123;
      mockSession.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId });
      
      await cachedQuerySelector(mockSession, '#test');
      expect(getCacheStats().size).toBe(1);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Try to access expired entry
      mockSession.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId });
      
      await cachedQuerySelector(mockSession, '#test');
      const stats = getCacheStats();
      expect(stats.misses).toBe(2); // Both calls were cache misses
    });
  });

  describe('Session Isolation', () => {
    it('should isolate cache between different sessions', async () => {
      const session1 = { 
        send: vi.fn(),
        constructor: { name: 'Session1' }
      };
      const session2 = { 
        send: vi.fn(),
        constructor: { name: 'Session2' }
      };
      
      const nodeId1 = 123;
      const nodeId2 = 456;
      
      session1.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId: nodeId1 });
      
      session2.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeId: nodeId2 });
      
      // Same selector, different sessions
      const result1 = await cachedQuerySelector(session1, '#test');
      const result2 = await cachedQuerySelector(session2, '#test');
      
      expect(result1).toBe(nodeId1);
      expect(result2).toBe(nodeId2);
      expect(getCacheStats().size).toBe(2); // Two separate cache entries
    });
  });

  describe('Error Handling', () => {
    it('should validate session parameter', async () => {
      await expect(cachedQuerySelector(null, '#test'))
        .rejects.toThrow();
    });

    it('should validate selector parameter', async () => {
      await expect(cachedQuerySelector(mockSession, ''))
        .rejects.toThrow();
    });

    it('should handle invalid nodeId in cache set', () => {
      expect(() => queryCache.set(mockSession, '#test', null))
        .toThrow(SuperPancakeError);
    });
  });
});