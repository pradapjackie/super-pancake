// 🎉 INTEGRATION WORKFLOW TEST - Simple end-to-end feature combination
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFormTestEnvironment, cleanupTestEnvironment } from '../utils/test-setup.js';
import {
  navigateTo, setDefaultTimeout,
  getByLabel, getByTestId, getByPlaceholder,
  fillInput, getValue, click, type,
  emulateDevice, clearDeviceEmulation,
  enableNetworkInterception, getNetworkRequests, clearNetworkHistory,
  waitForText, waitForLoadState, takeScreenshot
} from '../core/simple-dom-v2.js';
import { resolve } from 'path';

describe('🎉 Integration Workflow Test', () => {
  let testEnv;
  const formUrl = `file://${resolve('./public/form-comprehensive.html')}`;

  beforeAll(async () => {
    testEnv = await createFormTestEnvironment('Integration Workflow Test');
    setDefaultTimeout(6000);
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await cleanupTestEnvironment(testEnv, 'Integration Workflow Test');
    }
  });

  it('should execute simple mobile form workflow', async () => {
    console.log('📱 Testing mobile form workflow...');

    // Setup mobile emulation
    await emulateDevice('iPhone 12');

    // Navigate and wait
    await navigateTo(formUrl);
    await waitForLoadState('load');

    // Fill form using different locator methods
    const nameInput = await getByLabel('Full Name');
    await fillInput(nameInput, 'Jane Smith');

    const emailInput = await getByPlaceholder('Enter your email');
    await fillInput(emailInput, 'jane@example.com');

    const testInput = await getByTestId('test-input');
    await fillInput(testInput, 'Mobile test successful');

    // Verify values
    expect(await getValue(nameInput)).toBe('Jane Smith');
    expect(await getValue(emailInput)).toBe('jane@example.com');
    expect(await getValue(testInput)).toBe('Mobile test successful');

    await takeScreenshot('./screenshots/mobile-workflow-complete.png');
    console.log('✅ Mobile form workflow working correctly');
  });

  it('should execute desktop workflow with network monitoring', async () => {
    console.log('🖥️ Testing desktop workflow with network...');

    // Switch to desktop
    await emulateDevice('Desktop');

    // Enable network monitoring
    await enableNetworkInterception();
    await clearNetworkHistory();

    // Navigate
    await navigateTo(formUrl);
    await waitForLoadState('load');

    // Test API interaction
    await click('#api-test-btn');
    await waitForText('API Success', { timeout: 15000 });

    // Check network requests
    const requests = await getNetworkRequests();
    console.log(`Captured ${requests.length} network requests`);
    expect(requests.length).toBeGreaterThan(0);

    await takeScreenshot('./screenshots/desktop-network-workflow.png');
    console.log('✅ Desktop network workflow working correctly');
  });

  it('should execute keyboard and typing workflow', async () => {
    console.log('⌨️ Testing keyboard workflow...');

    // Test keyboard area
    const keyboardArea = await getByTestId('keyboard-test-area');
    await click(keyboardArea);
    await type('Integration test typing!');

    expect(await getValue(keyboardArea)).toBe('Integration test typing!');

    // Test multi-step form
    await click('#multi-step-test');
    await waitForText('John Doe', { timeout: 3000 });

    const step1Value = await getValue('#step1-input');
    expect(step1Value).toBe('John Doe');

    await takeScreenshot('./screenshots/keyboard-workflow.png');
    console.log('✅ Keyboard workflow working correctly');
  });

  it('should execute waiting and dynamic content workflow', async () => {
    console.log('⏳ Testing dynamic content workflow...');

    // Test delayed content
    await click('#delayed-text-btn');
    await waitForText('Delayed text appeared!', { timeout: 5000 });

    // Test loading states
    await click('#loading-state-btn');
    await waitForText('Loading...', { timeout: 2000 });
    await waitForText('Load complete!', { timeout: 6000 });

    await takeScreenshot('./screenshots/dynamic-content-workflow.png');
    console.log('✅ Dynamic content workflow working correctly');
  });

  it('should execute complete feature combination', async () => {
    console.log('🚀 Testing complete feature combination...');

    // Clear state
    await clearDeviceEmulation();
    await clearNetworkHistory();

    // Set tablet view
    await emulateDevice('iPad');

    // Enable monitoring
    await enableNetworkInterception();

    // Navigate fresh
    await navigateTo(formUrl);
    await waitForLoadState('load');

    // Form interaction
    const nameInput = await getByLabel('Full Name');
    await fillInput(nameInput, 'Complete Test User');

    const searchInput = await getByPlaceholder('Search for products');
    await click(searchInput);
    await type('integration testing');

    // Network test
    await click('#fetch-data-btn');
    await waitForText('Data Fetched', { timeout: 15000 });

    // Get final network stats
    const finalRequests = await getNetworkRequests();
    console.log(`Final request count: ${finalRequests.length}`);

    // Verify form state maintained
    expect(await getValue(nameInput)).toBe('Complete Test User');

    await takeScreenshot('./screenshots/complete-integration.png');

    console.log('🎉 COMPLETE INTEGRATION SUCCESS!');
    console.log('✅ Features combined: Smart Locators + Device Emulation + Network + Keyboard + Waiting');
    console.log(`✅ Network requests captured: ${finalRequests.length}`);
    console.log('🏆 Integration workflow validation complete!');
  });
});
