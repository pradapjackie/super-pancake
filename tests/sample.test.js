import { describe, it, beforeAll, afterAll } from 'vitest';
import { launchChrome } from '../utils/launcher.js';
import { connectToChrome } from '../core/browser.js';
import { createSession } from '../core/session.js';
import {
  enableDOM,
  navigateTo,
  fillInput,
  check,
  selectOption,
  click,
  getAttribute,
  getText,
  waitForSelector,
  takeElementScreenshot
} from '../core/dom.js';
import {
  assertEqual,
  assertContainsText,
} from '../core/assert.js';
import { addTestResult, writeReport } from '../reporter/htmlReporter.js';
import { testWithReport } from '../helpers/testWrapper.js';
import { config } from '../config.js';

let chrome, ws, session;

describe('Playground UI Form Test', () => {
  beforeAll(async () => {
    console.log('\n🔷 Playground UI Test Started');
    chrome = await launchChrome({ headed: true });
    ws = await connectToChrome();
    session = createSession(ws);
    await enableDOM(session);
  });

  afterAll(async () => {
    ws.close();
    await chrome.kill();
    writeReport();
    console.log('\n🧹 Test complete. Chrome closed.');
  });

  it('should navigate to form page should navigate to form page', { timeout: config.test.timeout }, async () => {
    await testWithReport('should navigate to form page', async () => {
      await navigateTo(session, 'file://' + process.cwd() + '/public/form.html');
    }, session, import.meta.url);
  });

  it('should fill in the name input', { timeout: config.test.timeout }, async () => {
    await testWithReport('should fill in the name input', async () => {
      await fillInput(session, 'input[name="name"]', 'Pradap');
    }, session, import.meta.url);
  });

  it('should fill in the email input', { timeout: config.test.timeout }, async () => {
    await testWithReport('should fill in the email input', async () => {
      await fillInput(session, 'input[name="email"]', 'pradap@example.com');
    }, session, import.meta.url);
  });

  it('should fill in the password input', { timeout: config.test.timeout }, async () => {
    await testWithReport('should fill in the password input', async () => {
      await fillInput(session, 'input[name="password"]', 'supersecret');
    }, session, import.meta.url);
  });

  it('should fill in the date and time inputs', { timeout: config.test.timeout }, async () => {
    await testWithReport('should fill in the date and time inputs', async () => {
      await fillInput(session, 'input[name="date"]', '2025-06-23');
      await fillInput(session, 'input[name="time"]', '12:34');
    }, session, import.meta.url);
  });

  it('should fill in the message textarea', { timeout: config.test.timeout }, async () => {
    await testWithReport('should fill in the message textarea', async () => {
      await fillInput(session, 'textarea[name="message"]', 'Test message');
    }, session, import.meta.url);
  });

  it('should select dropdown and check options', { timeout: config.test.timeout }, async () => {
    await testWithReport('should select dropdown and check options', async () => {
      await selectOption(session, 'select[name="dropdown"]', 'two');
      await check(session, 'input[name="subscribe"]', true);
      await check(session, 'input[value="male"]', true);
    }, session, import.meta.url);
  });

  it('should submit the form', { timeout: config.test.timeout }, async () => {
    await testWithReport('should submit the form', async () => {
      await click(session, 'button[type="submit"]');
    }, session, import.meta.url);
  });




  it('should verify table and list contents', { timeout: config.test.timeout }, async () => {
    await testWithReport('should verify table and list contents', async () => {
      const status = await getAttribute(session, 'form', 'data-status');
      assertEqual(status, 'submitted', 'Form should be marked as submitted');

      const tableText = await getText(session, await waitForSelector(session, 'table'));
      assertContainsText(tableText, 'Alice', 'Table should include "Alice"');
      assertContainsText(tableText, 'Bob', 'Table should include "Bob"');

      const listText = await getText(session, await waitForSelector(session, 'ul'));
      assertContainsText(listText, 'Unordered Item 21');
    }, session, import.meta.url);
  });

});
