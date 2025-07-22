// ⏳ TIER 1 ADVANCED WAITING TEST - Focused validation of all waiting methods
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFormTestEnvironment, cleanupTestEnvironment } from '../utils/test-setup.js';
import {
  navigateTo, setDefaultTimeout,
  waitForText, waitForURL, waitForLoadState, waitForFunction,
  waitForSelector, waitForVisible,
  click, takeScreenshot
} from '../core/simple-dom-v2.js';
import { getFormPath, getScreenshotsDir, getTestTimeouts, getEnvironmentInfo } from '../utils/ci-config.js';

describe('⏳ TIER 1 Advanced Waiting Test', () => {
  let testEnv;
  const formUrl = getFormPath();
  const timeouts = getTestTimeouts();

  // Log environment info for debugging
  console.log('🌍 Environment:', getEnvironmentInfo());

  beforeAll(async () => {
    testEnv = await createFormTestEnvironment('Advanced Waiting Test');
    setDefaultTimeout(timeouts.medium);
  }, timeouts.long);

  afterAll(async () => {
    if (testEnv) {
      await cleanupTestEnvironment(testEnv, 'Advanced Waiting Test');
    }
  });

  it('should wait for text to appear', async () => {
    // Enable DOM for this test
    const { enableDOM } = await import('../core/simple-dom-v2.js');
    await enableDOM();

    await navigateTo(formUrl);

    // Wait for text that should be immediately available - increased timeout for CI
    await waitForText('Comprehensive UI Testing Playground', { timeout: 8000 });

    // Wait for text in the TIER section - increased timeout for CI
    await waitForText('TIER 1 & TIER 2 Testing Elements', { timeout: 8000 });

    console.log('✅ waitForText working correctly');
  }, 20000);

  it('should wait for URL patterns', async () => {
    const currentUrl = await waitForURL('form-comprehensive', { timeout: 3000 });
    expect(currentUrl).toContain('form-comprehensive.html');

    console.log('✅ waitForURL working correctly');
  });

  it('should wait for load states', async () => {
    await waitForLoadState('load', { timeout: 5000 });

    // Test different load states
    await waitForLoadState('domcontentloaded', { timeout: 3000 });

    console.log('✅ waitForLoadState working correctly');
  });

  it('should wait for custom functions', async () => {
    // Wait for document ready state - waitForFunction returns true when condition is met
    const result = await waitForFunction(() => document.readyState === 'complete', { timeout: 3000 });
    expect(result).toBe(true);

    // Wait for specific element to exist
    const elementExists = await waitForFunction(() => document.getElementById('delayed-text-btn') !== null, { timeout: 3000 });
    expect(elementExists).toBe(true);

    console.log('✅ waitForFunction working correctly');
  });

  it('should wait for delayed text functionality', async () => {
    // Trigger delayed text
    await click('#delayed-text-btn');

    // Wait for the delayed text to appear
    await waitForText('Delayed text appeared!', { timeout: 5000 });

    await takeScreenshot(`${getScreenshotsDir()}/delayed-text-test.png`);
    console.log('✅ Delayed text waiting working correctly');
  });

  it('should wait for delayed element visibility', async () => {
    // Trigger delayed element
    await click('#delayed-element-btn');

    // Wait for element to become visible (element has 2s delay in HTML)
    await waitForVisible('#delayed-element', 5000);

    await takeScreenshot(`${getScreenshotsDir()}/delayed-element-test.png`);
    console.log('✅ Delayed element visibility waiting working correctly');
  });

  it('should wait for URL changes', async () => {
    // Trigger URL change
    await click('#change-url-btn');

    // Wait for URL to contain the test pattern
    await waitForURL('testing-url-change', { timeout: 3000 });

    console.log('✅ URL change waiting working correctly');
  });

  it('should wait for loading state changes', async () => {
    // Trigger loading state test
    await click('#loading-state-btn');

    // Wait for loading text
    await waitForText('Loading...', { timeout: 2000 });

    // Wait for processing text
    await waitForText('Processing...', { timeout: 3000 });

    // Wait for completion
    await waitForText('Load complete!', { timeout: 5000 });

    await takeScreenshot(`${getScreenshotsDir()}/loading-states-test.png`);
    console.log('✅ Loading state changes waiting working correctly');
  });

  it('should handle timeout scenarios gracefully', async () => {
    // Test that timeouts work properly
    try {
      await waitForText('This text will never appear', { timeout: 1000 });
      throw new Error('Should have timed out');
    } catch (error) {
      expect(error.message).toContain('not found within 1000ms');
      console.log('✅ Timeout handling working correctly');
    }
  });
});
