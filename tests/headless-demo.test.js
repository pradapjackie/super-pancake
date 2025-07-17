import { describe, it, beforeAll, afterAll } from 'vitest';
import { launchChrome } from '../utils/launcher.js';
import { connectToChrome } from '../core/browser.js';
import { createSession } from '../core/session.js';
import {
  enableDOM,
  navigateTo,
  getText,
  waitForSelector,
  takeElementScreenshot
} from '../core/dom.js';
import { assertContainsText } from '../core/assert.js';
import { testWithReport } from '../helpers/testWrapper.js';

let chrome, ws, session;

describe('Headless Demo Tests', () => {
  beforeAll(async () => {
    console.log('\n🔷 Starting headless demo tests...');
    // This will check the SUPER_PANCAKE_HEADLESS environment variable
    chrome = await launchChrome({ headed: true }); // Default to headed, but UI can override
    ws = await connectToChrome();
    session = createSession(ws);
    await enableDOM(session);
  }, 30000);

  afterAll(async () => {
    if (ws) ws.close();
    if (chrome) await chrome.kill();
    console.log('\n🧹 Test complete. Chrome closed.');
  });

  it('should navigate to example.com and verify title', async () => {
    await testWithReport('should navigate to example.com and verify title', async () => {
      await navigateTo(session, 'https://example.com');
      
      const title = await getText(session, await waitForSelector(session, 'h1'));
      assertContainsText(title, 'Example');
      
      // Take screenshot
      await takeElementScreenshot(session, 'h1', './screenshots/example-title.png');
      
      console.log('✅ Test passed: Title contains "Example"');
    }, session, import.meta.url);
  });

  it('should test DuckDuckGo search', async () => {
    await testWithReport('should test DuckDuckGo search', async () => {
      await navigateTo(session, 'https://duckduckgo.com');
      
      const logoSelector = await waitForSelector(session, '[data-testid="logo"]', 5000);
      const logoText = await getText(session, logoSelector);
      
      console.log('✅ Test passed: DuckDuckGo loaded successfully');
    }, session, import.meta.url);
  });
});