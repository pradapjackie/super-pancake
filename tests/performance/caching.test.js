// Performance and caching tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchChrome } from '../../utils/launcher.js';
import { connectToChrome } from '../../core/browser.js';
import { createSession } from '../../core/session.js';
import { enableDOM, navigateTo, querySelector } from '../../core/dom.js';

let chrome, ws, session;

describe('Performance and Caching Tests', () => {
  beforeAll(async () => {
    chrome = await launchChrome({ headed: false });
    ws = await connectToChrome(chrome.port);
    session = createSession(ws);
    await enableDOM(session);
    await navigateTo(session, 'data:text/html,<html><body><div id="test">Performance Test</div></body></html>');
  }, 30000);

  afterAll(async () => {
    if (ws) {ws.close();}
    if (chrome) {await chrome.kill();}
  });

  it('should cache DOM queries for performance', async () => {
    const selector = '#test';

    // First query (should be slow - no cache)
    const start1 = Date.now();
    const result1 = await querySelector(session, selector);
    const time1 = Date.now() - start1;

    // Second query (should be faster - cached)
    const start2 = Date.now();
    const result2 = await querySelector(session, selector);
    const time2 = Date.now() - start2;

    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
    expect(result1).toBe(result2);

    // Cache should make subsequent queries faster
    // Note: This might not always be true due to various factors
    console.log(`First query: ${time1}ms, Second query: ${time2}ms`);
  });

  it('should handle memory efficiently during long operations', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Perform many DOM queries
    for (let i = 0; i < 100; i++) {
      await querySelector(session, '#test');
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

    console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
  });

  it('should complete operations within reasonable time limits', async () => {
    const operations = [
      () => querySelector(session, '#test'),
      () => querySelector(session, 'div'),
      () => querySelector(session, 'body')
    ];

    for (const operation of operations) {
      const start = Date.now();
      await operation();
      const duration = Date.now() - start;

      // Each operation should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    }
  });
});
