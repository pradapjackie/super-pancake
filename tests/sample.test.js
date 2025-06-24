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
  dragDrop
} from '../core/dom.js';
import {
  assertEqual,
  assertContainsText,
  assertExists
} from '../core/assert.js';

console.log('\n🔷 Playground UI Test Started');

const chrome = await launchChrome({ headless: false });
const ws = await connectToChrome();
const session = createSession(ws);

try {
  await enableDOM(session);
  await navigateTo(session, 'http://localhost:8080/form.html');

  // Fill form fields
  await fillInput(session, 'input[name="name"]', 'Pradap');
  await fillInput(session, 'input[name="email"]', 'pradap@example.com');
  await fillInput(session, 'input[name="password"]', 'supersecret');
  await fillInput(session, 'input[name="date"]', '2025-06-23');
  await fillInput(session, 'input[name="time"]', '12:34');
  await fillInput(session, 'textarea[name="message"]', 'Test message');

  // Interact with dropdown and checkboxes
  await selectOption(session, 'select[name="dropdown"]', 'two');
  await check(session, 'input[name="subscribe"]', true);
  await check(session, 'input[value="male"]', true);

  // Submit form
  await click(session, 'button[type="submit"]');

  // Assert form submission
  const status = await getAttribute(session, 'form', 'data-status');
  assertEqual(status, 'submitted', 'Form should be marked as submitted');

  // Verify table contents
  const tableText = await getText(session, await waitForSelector(session, 'table'));
  assertContainsText(tableText, 'Alice', 'Table should include "Alice"');
  assertContainsText(tableText, 'Bob', 'Table should include "Bob"');

  // Check list items
  const listText = await getText(session, await waitForSelector(session, 'ul'));
  assertContainsText(listText, 'Unordered Item 2');

 
 
  console.log('✅ All UI automation steps passed!');
} catch (err) {
  console.error('❌ Test failed:\n', err);
} finally {
  ws.close();
  await chrome.kill();
  console.log('\n🧹 Test complete. Chrome closed.');
}