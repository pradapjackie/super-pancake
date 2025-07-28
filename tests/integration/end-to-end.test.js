import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // Simplified test setup
  createTestEnvironment,
  cleanupTestEnvironment,
  
  // Session context
  setSession,
  clearSession,
  
  // DOM operations
  enableDOM,
  navigateTo,
  getText,
  querySelector,
  waitForSelector,
  takeElementScreenshot,
  
  // Assertions
  assertEqual,
  assertContainsText,
  assertExists,
  
  // Port utilities
  getTestPort,
  releasePort
} from 'super-pancake-automation';

let testEnv;

describe('Web Automation Integration Tests', () => {
  beforeAll(async () => {
    console.log('🚀 Setting up integration test environment...');
    
    // Use integration port range to avoid conflicts
    const port = await getTestPort('integration');
    console.log(`🔍 Using integration port: ${port}`);
    
    testEnv = await createTestEnvironment({ 
      headed: false, // Run headless for CI
      port: port,
      testName: 'Web Automation Integration Tests'
    });
    
    // Set session context for v2 API
    setSession(testEnv.session);
    
    await enableDOM();
  }, 30000);

  afterAll(async () => {
    clearSession();
    
    // Release the port before cleanup
    if (testEnv && testEnv.chrome) {
      releasePort(testEnv.chrome.port);
    }
    await cleanupTestEnvironment(testEnv, 'Web Automation Integration Tests');
    console.log('🧹 Test environment cleaned up');
  });

  it('should test form interaction on httpbin.org', async () => {
    console.log('📝 Testing form interactions...');
    
    // Navigate to a test form
    await navigateTo('https://httpbin.org/forms/post');
    console.log('✅ Navigated to test form');
    
    // Wait for form to load
    await waitForSelector('form', 10000);
    console.log('✅ Form loaded');
    
    // Find the customer name input
    const nameInput = await querySelector('input[name="custname"]');
    assertExists(nameInput, 'Customer name input should exist');
    
    // Take screenshot of empty form
    await takeElementScreenshot('form', 'screenshots/integration-test-empty-form.png');
    console.log('📸 Empty form screenshot captured');
    
    console.log('🎉 Form interaction test completed successfully!');
  }, 60000);

  it('should demonstrate error handling and recovery', async () => {
    console.log('🛡️ Testing error handling...');
    
    try {
      // Try to find a non-existent element (should handle gracefully)
      await waitForSelector('non-existent-element', 2000);
    } catch (error) {
      console.log('✅ Successfully caught expected error:', error.message);
      // This is expected behavior
    }
    
    // Verify session is still working after error
    await navigateTo('https://example.com');
    const recoveryTest = await querySelector('h1');
    assertExists(recoveryTest, 'Should recover after error and still function');
    
    console.log('🎉 Error handling test completed successfully!');
  }, 30000);
});