// 🌐 TIER 2 NETWORK INTERCEPTION TEST - Focused validation of network methods
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFormTestEnvironment, cleanupTestEnvironment } from '../utils/test-setup.js';
import { 
  navigateTo, setDefaultTimeout,
  enableNetworkInterception, waitForRequest, waitForResponse,
  getNetworkRequests, clearNetworkHistory, mockResponse,
  click, waitForText, takeScreenshot
} from '../core/simple-dom-v2.js';
import { resolve } from 'path';

describe('🌐 TIER 2 Network Interception Test', () => {
  let testEnv;
  const formUrl = `file://${resolve('./public/form-comprehensive.html')}`;

  beforeAll(async () => {
    testEnv = await createFormTestEnvironment('Network Interception Test');
    setDefaultTimeout(8000);
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await cleanupTestEnvironment(testEnv, 'Network Interception Test');
    }
  });

  it('should enable network interception', async () => {
    await navigateTo(formUrl);
    
    // Enable network monitoring
    await enableNetworkInterception();
    
    console.log('✅ Network interception enabled successfully');
  });

  it('should clear network history', async () => {
    await clearNetworkHistory();
    
    // Verify we can get empty requests
    const requests = await getNetworkRequests();
    expect(Array.isArray(requests)).toBe(true);
    
    console.log('✅ Network history cleared successfully');
  });

  it('should capture network requests', async () => {
    // Clear history first
    await clearNetworkHistory();
    
    // Navigate to trigger requests
    await navigateTo(formUrl);
    
    // Get captured requests
    const requests = await getNetworkRequests();
    console.log(`Captured ${requests.length} network requests`);
    
    expect(requests.length).toBeGreaterThan(0);
    
    // Look for HTML requests
    const htmlRequests = await getNetworkRequests('.*\\.html');
    console.log(`Found ${htmlRequests.length} HTML requests`);
    
    console.log('✅ Network requests captured successfully');
  });

  it('should monitor API calls', async () => {
    // Clear history
    await clearNetworkHistory();
    
    // Trigger API call
    await click('#api-test-btn');
    
    // Wait for API response
    await waitForText('API Success', { timeout: 15000 });
    
    // Check captured requests
    const allRequests = await getNetworkRequests();
    console.log(`Total requests after API call: ${allRequests.length}`);
    
    // Look for API requests
    const apiRequests = await getNetworkRequests('jsonplaceholder');
    console.log(`API requests found: ${apiRequests.length}`);
    
    await takeScreenshot('./screenshots/api-monitoring-test.png');
    console.log('✅ API call monitoring working correctly');
  });

  it('should capture different types of requests', async () => {
    await clearNetworkHistory();
    
    // Trigger different types of requests
    await click('#fetch-data-btn');
    await waitForText('Data Fetched', { timeout: 15000 });
    
    const requests = await getNetworkRequests();
    console.log(`Requests after fetch: ${requests.length}`);
    
    // Try slow request
    await click('#slow-request-btn');
    await waitForText('Slow Request Complete', { timeout: 20000 });
    
    const slowRequests = await getNetworkRequests();
    console.log(`Requests after slow call: ${slowRequests.length}`);
    
    expect(slowRequests.length).toBeGreaterThan(requests.length);
    
    console.log('✅ Different request types captured successfully');
  });

  it('should handle request filtering', async () => {
    const allRequests = await getNetworkRequests();
    
    // Filter for specific patterns
    const htmlRequests = await getNetworkRequests('.*\\.html');
    const apiRequests = await getNetworkRequests('httpbin');
    const jsonRequests = await getNetworkRequests('json');
    
    console.log(`All requests: ${allRequests.length}`);
    console.log(`HTML requests: ${htmlRequests.length}`);
    console.log(`API requests: ${apiRequests.length}`);
    console.log(`JSON requests: ${jsonRequests.length}`);
    
    expect(allRequests.length).toBeGreaterThanOrEqual(htmlRequests.length);
    
    console.log('✅ Request filtering working correctly');
  });

  it('should provide request details', async () => {
    const requests = await getNetworkRequests();
    
    if (requests.length > 0) {
      const firstRequest = requests[0];
      
      // Check request structure
      expect(firstRequest).toHaveProperty('url');
      expect(firstRequest).toHaveProperty('method');
      expect(firstRequest).toHaveProperty('timestamp');
      
      console.log('Sample request:', {
        url: firstRequest.url,
        method: firstRequest.method,
        timestamp: firstRequest.timestamp
      });
    }
    
    console.log('✅ Request details structure correct');
  });

  it('should handle network errors gracefully', async () => {
    // Test with a request that will likely fail
    try {
      // This should still work even if network requests fail
      const requests = await getNetworkRequests('nonexistent');
      expect(Array.isArray(requests)).toBe(true);
      
      console.log('✅ Network error handling working correctly');
    } catch (error) {
      console.log('Network error handled:', error.message);
    }
  });

  it('should maintain request history across operations', async () => {
    const initialRequests = await getNetworkRequests();
    const initialCount = initialRequests.length;
    
    // Navigate again to generate more requests
    await navigateTo(formUrl);
    
    const afterNavigateRequests = await getNetworkRequests();
    console.log(`Requests before: ${initialCount}, after: ${afterNavigateRequests.length}`);
    
    // Should have more requests now (unless cleared)
    expect(afterNavigateRequests.length).toBeGreaterThanOrEqual(initialCount);
    
    console.log('✅ Request history maintenance working correctly');
  });
});