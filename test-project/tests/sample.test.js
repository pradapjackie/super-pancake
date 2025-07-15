import { describe, it, beforeAll, afterAll } from 'vitest';
import { launchChrome } from 'super-pancake-automation/utils/launcher.js';
import { connectToChrome } from 'super-pancake-automation/core/browser.js';
import { createSession } from 'super-pancake-automation/core/session.js';
import {
  enableDOM,
  navigateTo,
  fillInput,
  click,
  getText,
  waitForSelector,
  takeElementScreenshot
} from 'super-pancake-automation/core/dom.js';
import {
  assertEqual,
  assertContainsText,
} from 'super-pancake-automation/core/assert.js';
import { addTestResult, writeReport } from 'super-pancake-automation/reporter/htmlReporter.js';
import { testWithReport } from 'super-pancake-automation/helpers/testWrapper.js';

let chrome, ws, session;

describe('test-project - Sample Test Suite', () => {
  beforeAll(async () => {
    console.log('\n🔷 Starting test-project tests...');
    chrome = await launchChrome({ 
      headed: false, 
      devtools: true,
      slowMo: 100
    });
    ws = await connectToChrome();
    session = createSession(ws);
    await enableDOM(session);
  }, 30000);

  afterAll(async () => {
    if (ws) ws.close();
    if (chrome) await chrome.kill();
    writeReport();
    console.log('\n🧹 Test complete. Chrome closed.');
  });

  it('should navigate to example.com and verify title', async () => {
    await testWithReport('should navigate to example.com and verify title', async () => {
      await navigateTo(session, 'https://example.com');
      
      const title = await getText(session, await waitForSelector(session, 'h1'));
      assertContainsText(title, 'Example');
      
      
      // Take screenshot on success
      await takeElementScreenshot(session, 'h1', './screenshots/example-title.png');
      
      
      console.log('✅ Test passed: Title contains "Example"');
    }, session, import.meta.url);
  });

  it('should demonstrate form interaction', async () => {
    await testWithReport('should demonstrate form interaction', async () => {
      await navigateTo(session, 'https://httpbin.org/forms/post');
      
      // Fill form fields
      await fillInput(session, 'input[name="custname"]', 'Test User');
      await fillInput(session, 'input[name="custtel"]', '1234567890');
      await fillInput(session, 'input[name="custemail"]', 'test@example.com');
      
      
      // Take screenshot before submit
      await takeElementScreenshot(session, 'form', './screenshots/form-filled.png');
      
      
      // Submit form
      await click(session, 'input[type="submit"]');
      
      // Verify redirect
      const result = await getText(session, await waitForSelector(session, 'pre'));
      assertContainsText(result, 'Test User');
      
      console.log('✅ Form interaction test passed');
    }, session, import.meta.url);
  });
});
