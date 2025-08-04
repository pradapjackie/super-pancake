/**
 * Test: Automatic Screenshot Capture on Failure
 * Demonstrates the new automatic screenshot functionality
 */

import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // Test environment setup
  createTestEnvironment,
  cleanupTestEnvironment,
  
  // DOM operations
  navigateTo,
  waitForSelector,
  getText,
  
  // Enhanced screenshot functionality
  setupAutomaticScreenshots,
  testWithAutoScreenshot,
  expectWithScreenshot,
  executeWithScreenshot,
  captureScreenshot
} from 'super-pancake-automation';

import {
  // Individual test logging with screenshot support
  setupIndividualTestLogging,
  startIndividualTest,
  endIndividualTest,
  handleTestFailure,
  getIndividualTestData,
  cleanupIndividualTestLogging
} from '../utils/individualTestLogger.js';

import { addTestResult } from '../reporter/htmlReporter.js';

let testEnv;

describe('Automatic Screenshot Capture Tests', () => {
  beforeAll(async () => {
    console.log('🚀 Setting up screenshot capture test environment...');
    
    // Setup automatic screenshot capture
    setupAutomaticScreenshots({
      enableIndividualTestLogging: true,
      screenshotDirectory: 'test-report/screenshots'
    });
    
    // Create test environment
    testEnv = await createTestEnvironment({
      headed: false,
      testName: 'Screenshot Capture Test'
    });
    
    console.log('✅ Test environment ready');
  }, 30000);

  afterAll(async () => {
    console.log('🧹 Cleaning up screenshot test environment...');
    
    // Get individual test data for logging purposes only
    const individualTests = getIndividualTestData();
    console.log(`📊 Captured ${individualTests.length} individual test cases with screenshots`);
    
    // Don't create separate test result entries - the screenshots are already captured
    // and will be included in the main test results through the HTML reporter
    
    // Cleanup
    cleanupIndividualTestLogging();
    await cleanupTestEnvironment(testEnv, 'Screenshot Capture Test');
  });

  it('should capture screenshot on test failure', async () => {
    // This test is designed to fail and capture a screenshot
    const testWrapper = testWithAutoScreenshot('failing_test_with_screenshot', async () => {
      // Navigate to a page
      await navigateTo('https://example.com');
      await waitForSelector('body');
      
      // This assertion will fail and trigger screenshot capture
      const titleText = await getText('title');
      expectWithScreenshot(titleText, 'failing_test_with_screenshot').toBe('This Will Not Match');
    });

    // Execute the wrapped test (this should fail and capture screenshot)
    let failed = false;
    try {
      await testWrapper();
    } catch (error) {
      failed = true;
      console.log('✅ Test failed as expected, screenshot should be captured');
      console.log('Error details:', error.message);
      if (error.screenshotPath) {
        console.log('📸 Screenshot captured at:', error.screenshotPath);
      }
    }
    
    // Verify the test actually failed (for our demo purposes)
    if (!failed) {
      throw new Error('Test was supposed to fail to demonstrate screenshot capture');
    }
  });

  it('should capture screenshot using manual trigger', async () => {
    await executeWithScreenshot('manual_screenshot_capture', async () => {
      // Navigate to a page
      await navigateTo('https://example.com');
      await waitForSelector('body');
      
      // Manually capture a screenshot
      const screenshotPath = await captureScreenshot('manual_capture_example', 'manual');
      console.log('📸 Manual screenshot captured:', screenshotPath);
      
      // This should pass
      const titleText = await getText('title');
      expectWithScreenshot(titleText, 'manual_screenshot_test').toContain('Example');
    });
  });

  it('should capture screenshot with individual test logger', async () => {
    startIndividualTest('individual_test_with_screenshot');
    
    try {
      console.log('Testing individual test logger with screenshot capture...');
      
      // Navigate to a page
      await navigateTo('https://httpbin.org/html');
      await waitForSelector('h1');
      
      // Get page title
      const headingText = await getText('h1');
      console.log('Page heading found:', headingText);
      
      // This assertion should pass
      expectWithScreenshot(headingText, 'individual_test_logger').toContain('Herman');
      
      console.log('✅ Individual test with screenshots completed successfully');
      
    } catch (error) {
      console.log('❌ Individual test failed');
      await handleTestFailure(null, error);
      throw error;
    } finally {
      endIndividualTest();
    }
  });
});