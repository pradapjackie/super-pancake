// 📱 TIER 2 MULTI-TAB TEST - Focused validation of tab and iframe methods
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFormTestEnvironment, cleanupTestEnvironment } from '../utils/test-setup.js';
import {
  navigateTo, setDefaultTimeout,
  getAllTabs, createNewTab, switchToTab, closeTab,
  switchToFrame, switchToMainFrame,
  click, waitForText, waitForLoadState, takeScreenshot
} from '../core/simple-dom-v2.js';
import { resolve } from 'path';

describe('📱 TIER 2 Multi-Tab Test', () => {
  let testEnv;
  const formUrl = `file://${resolve('./public/form-comprehensive.html')}`;

  beforeAll(async () => {
    testEnv = await createFormTestEnvironment('Multi-Tab Test');
    setDefaultTimeout(8000);
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await cleanupTestEnvironment(testEnv, 'Multi-Tab Test');
    }
  });

  it('should get all browser tabs', async () => {
    await navigateTo(formUrl);

    const tabs = await getAllTabs();
    console.log(`Found ${tabs.length} tabs`);

    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.length).toBeGreaterThan(0);

    // Check tab structure
    if (tabs.length > 0) {
      const firstTab = tabs[0];
      expect(firstTab).toHaveProperty('targetId');
      expect(firstTab).toHaveProperty('type');
    }

    console.log('✅ getAllTabs working correctly');
  });

  it('should create a new tab', async () => {
    const initialTabs = await getAllTabs();
    const initialCount = initialTabs.length;

    // Create new tab
    const newTabId = await createNewTab('about:blank');
    expect(newTabId).toBeDefined();
    expect(typeof newTabId).toBe('string');

    // Verify tab count increased
    const afterCreateTabs = await getAllTabs();
    expect(afterCreateTabs.length).toBe(initialCount + 1);

    console.log(`✅ Created new tab: ${newTabId}`);
  });

  it('should switch between tabs', async () => {
    // Get current tabs
    const tabs = await getAllTabs();

    if (tabs.length >= 2) {
      // Switch to different tab
      const targetTab = tabs[tabs.length - 1]; // Last tab (should be the new one)
      await switchToTab(targetTab.targetId);

      console.log(`✅ Switched to tab: ${targetTab.targetId}`);
    } else {
      console.log('⚠️ Not enough tabs for switching test');
    }
  });

  it('should navigate in a specific tab', async () => {
    const tabs = await getAllTabs();

    if (tabs.length >= 2) {
      const targetTab = tabs[tabs.length - 1];

      // Switch to the tab and navigate
      await switchToTab(targetTab.targetId);
      await navigateTo(formUrl);
      await waitForLoadState('load', { timeout: 10000 });

      console.log('✅ Navigation in specific tab working correctly');
    }
  });

  it('should close a tab', async () => {
    const beforeCloseTabs = await getAllTabs();
    const beforeCount = beforeCloseTabs.length;

    if (beforeCount > 1) {
      // Close the last tab (should be our test tab)
      const tabToClose = beforeCloseTabs[beforeCloseTabs.length - 1];
      await closeTab(tabToClose.targetId);

      // Verify tab count decreased
      const afterCloseTabs = await getAllTabs();
      expect(afterCloseTabs.length).toBe(beforeCount - 1);

      console.log(`✅ Closed tab: ${tabToClose.targetId}`);
    } else {
      console.log('⚠️ Cannot close the only remaining tab');
    }
  });

  it('should handle iframe switching visual feedback', async () => {
    // Make sure we're on the main page
    await navigateTo(formUrl);
    await waitForLoadState('load');

    // Test frame switching buttons (visual feedback)
    await click('#switch-frame-1');
    await waitForText('Switched to Frame 1 context', { timeout: 3000 });

    await click('#switch-frame-2');
    await waitForText('Switched to Frame 2 context', { timeout: 3000 });

    await click('#switch-main');
    await waitForText('Switched to Main frame context', { timeout: 3000 });

    await takeScreenshot('./screenshots/iframe-switching-test.png');
    console.log('✅ iframe switching visual feedback working correctly');
  });

  it('should maintain tab state correctly', async () => {
    // Ensure we have at least one tab
    const tabs = await getAllTabs();
    expect(tabs.length).toBeGreaterThan(0);

    // Switch to first tab and verify we can interact
    if (tabs.length > 0) {
      await switchToTab(tabs[0].targetId);
      await navigateTo(formUrl);
      await waitForLoadState('load');

      // Verify we can still interact with the page
      await waitForText('Comprehensive UI Testing Playground', { timeout: 5000 });

      console.log('✅ Tab state maintenance working correctly');
    }
  });

  it('should handle multiple tab creation and cleanup', async () => {
    const initialTabs = await getAllTabs();
    const initialCount = initialTabs.length;

    // Create multiple tabs
    const newTab1 = await createNewTab('about:blank');
    const newTab2 = await createNewTab('about:blank');

    // Verify both created
    const afterCreateTabs = await getAllTabs();
    expect(afterCreateTabs.length).toBe(initialCount + 2);

    // Close both new tabs
    await closeTab(newTab1);
    await closeTab(newTab2);

    // Verify back to original count
    const finalTabs = await getAllTabs();
    expect(finalTabs.length).toBe(initialCount);

    console.log('✅ Multiple tab creation and cleanup working correctly');
  });

  it('should handle tab operations with navigation', async () => {
    // Create new tab with specific URL
    const newTabId = await createNewTab(formUrl);

    // Switch to it
    await switchToTab(newTabId);
    await waitForLoadState('load', { timeout: 10000 });

    // Verify we can interact
    await waitForText('TIER 1 & TIER 2 Testing Elements', { timeout: 5000 });

    // Clean up
    await closeTab(newTabId);

    console.log('✅ Tab operations with navigation working correctly');
  });
});
