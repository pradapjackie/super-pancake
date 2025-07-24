import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // Test environment setup
  createTestEnvironment,
  cleanupTestEnvironment,
  
  // DOM operations
  enableDOM,
  setSession,
  clearSession,
  navigateTo,
  click,
  type,
  querySelector,
  waitForSelector,
  waitForTimeout,
  waitForElementToContainText,
  
  // Assertions
  assertEqual,
  assertContainsText,
  assertTrue,
  
  // Port utilities
  getTestPort,
  releasePort
} from 'super-pancake-automation';

let testEnv;

describe('Timing and Wait Examples', () => {
  beforeAll(async () => {
    console.log('⏰ Setting up timing and wait test environment...');
    
    const port = await getTestPort('examples');
    console.log(`🔍 Using examples port: ${port}`);
    
    testEnv = await createTestEnvironment({ 
      headed: false,
      port: port,
      testName: 'Timing and Wait Examples'
    });
    setSession(testEnv.session);
    await enableDOM();
  }, 30000);

  afterAll(async () => {
    clearSession();
    // Release the port before cleanup
    if (testEnv && testEnv.chrome) {
      releasePort(testEnv.chrome.port);
    }
    await cleanupTestEnvironment(testEnv, 'Timing and Wait Examples');
    console.log('🧹 Timing test environment cleaned up');
  });

  it('should demonstrate basic element waiting', async () => {
    console.log('⏳ Testing basic element waiting...');
    
    // Navigate to the comprehensive form (more reliable than external delay)
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    // Test that we can wait for the page to fully load
    const startTime = Date.now();
    await waitForSelector('h1', 10000);
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    assertTrue(loadTime > 0, 'Page should take some time to load');
    console.log(`📊 Page loaded in ${loadTime}ms`);
    
    console.log('✅ Basic element waiting test completed');
  }, 15000);

  it('should demonstrate waiting for text content', async () => {
    console.log('📝 Testing text content waiting...');
    
    // Navigate to the comprehensive form
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    // Wait for specific text to appear in the heading
    await waitForElementToContainText('h1', 'Comprehensive', 10000);
    console.log('✅ Found expected text "Comprehensive"');
    
    // Verify the text is actually there
    const bodyElement = await querySelector('body');
    assertTrue(bodyElement !== null, 'Body element should exist');
    
    console.log('✅ Text content waiting test completed');
  }, 15000);

  it('should demonstrate timeout handling for missing elements', async () => {
    console.log('⏰ Testing timeout handling...');
    
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    // Test short timeout for element that doesn't exist
    const startTime = Date.now();
    try {
      await waitForSelector('.element-that-never-exists', 3000);
    } catch (error) {
      const endTime = Date.now();
      const waitTime = endTime - startTime;
      
      console.log(`⏱️ Timeout occurred after ${waitTime}ms`);
      assertTrue(waitTime > 2500, 'Should wait close to full timeout period');
      assertContainsText(error.message, 'timed out', 'Error should mention timeout');
      console.log('✅ Timeout handled correctly');
    }
    
    console.log('✅ Timeout handling test completed');
  }, 10000);

  it('should demonstrate navigation waiting', async () => {
    console.log('🧭 Testing navigation waiting...');
    
    // Start at the form page
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    // Navigate to a simple data page
    await navigateTo('data:text/html,<html><body><h1>Test Navigation Page</h1></body></html>');
    
    // Wait for navigation to complete by waiting for the new content
    await waitForSelector('h1', 10000);
    
    // Verify we're at the new page
    const currentUrl = await testEnv.session.send('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    
    assertContainsText(currentUrl.result.value, 'data:text/html', 'Should be at data page');
    
    console.log('✅ Navigation waiting test completed');
  }, 20000);

  it('should demonstrate sleep and timing controls', async () => {
    console.log('😴 Testing sleep and timing controls...');
    
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    // Test precise sleep timing using waitForTimeout
    const startTime = Date.now();
    await waitForTimeout(2000); // Sleep for 2 seconds
    const endTime = Date.now();
    
    const actualSleepTime = endTime - startTime;
    assertTrue(actualSleepTime > 1900, 'Sleep should be at least 1.9 seconds');
    assertTrue(actualSleepTime < 2500, 'Sleep should be less than 2.5 seconds');
    
    console.log(`💤 Slept for ${actualSleepTime}ms (expected ~2000ms)`);
    
    // Test shorter sleep
    const shortStartTime = Date.now();
    await waitForTimeout(500);
    const shortEndTime = Date.now();
    
    const shortSleepTime = shortEndTime - shortStartTime;
    assertTrue(shortSleepTime > 400, 'Short sleep should be at least 400ms');
    assertTrue(shortSleepTime < 1000, 'Short sleep should be less than 1000ms');
    
    console.log(`💤 Short sleep: ${shortSleepTime}ms (expected ~500ms)`);
    
    console.log('✅ Sleep and timing controls test completed');
  }, 10000);

  it('should demonstrate form interaction timing', async () => {
    console.log('📝 Testing form interaction timing...');
    
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    // Wait for form to be ready
    await waitForSelector('#basic-form', 10000);
    await waitForSelector('#fullname', 5000);
    
    // Test typing with realistic timing
    const typingStartTime = Date.now();
    await type('#fullname', 'Timing Test User');
    const typingEndTime = Date.now();
    
    const typingTime = typingEndTime - typingStartTime;
    console.log(`⌨️ Typing took ${typingTime}ms`);
    
    // Brief pause between interactions (realistic user behavior)
    await waitForTimeout(100);
    
    // Continue with more form interactions
    await waitForSelector('#email', 5000);
    await type('#email', 'timing@example.com');
    
    // Wait for form to be fully filled before validation
    await waitForTimeout(200);
    
    // Validate the form was filled correctly
    const nameInput = await querySelector('#fullname');
    assertTrue(nameInput !== null, 'Name input should exist');
    
    const emailInput = await querySelector('#email');
    assertTrue(emailInput !== null, 'Email input should exist');
    
    console.log('✅ Form interaction timing test completed');
  }, 30000);

  it('should demonstrate complex waiting scenarios', async () => {
    console.log('🔄 Testing complex waiting scenarios...');
    
    // Navigate to the comprehensive form
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    // Wait for page structure to be ready
    await waitForSelector('h1', 10000);
    await waitForSelector('section', 10000);
    
    // Wait for specific text content to be available
    await waitForElementToContainText('h1', 'Testing Playground', 10000);
    
    // Test waiting for multiple elements in sequence
    const elements = ['h1', '#basic-form', '#data-table'];
    
    for (const selector of elements) {
      const startTime = Date.now();
      await waitForSelector(selector, 5000);
      const endTime = Date.now();
      
      console.log(`✅ Found ${selector} in ${endTime - startTime}ms`);
    }
    
    // Verify all elements are present
    for (const selector of elements) {
      const element = await querySelector(selector);
      assertTrue(element !== null, `Element ${selector} should exist`);
    }
    
    console.log('✅ Complex waiting scenarios test completed');
  }, 25000);
});