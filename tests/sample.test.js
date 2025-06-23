import { launchChrome } from '../utils/launcher.js';
import { connectToChrome } from '../core/browser.js';
import { createSession } from '../core/session.js';
import {
    enableDOM,
    navigateTo,
    querySelector,
    type,
    click,
    getText,
    waitForSelector
} from '../core/dom.js';
import {
    assertEqual,
    assertContainsText,
    assertExists
} from '../core/assert.js';
import { enableAllEvents } from '../core/browserEvents.js';

console.log('\n🔷 Sample Automation Test');

const chrome = await launchChrome();              // Launch Chrome
const ws = await connectToChrome();               // Connect via WebSocket
const session = createSession(ws);                // Create CDP session

try {
    await enableAllEvents(ws, session);             // 🔊 Enable console/log/dialog tracking
    await enableDOM(session);                       // 🧠 Enable DOM access
    await navigateTo(session, 'http://localhost:8080/form.html');  // 🌐 Navigate

    // Wait for input field
    const inputNodeId = await waitForSelector(session, 'input[name="q"]', 5000);
    assertExists(inputNodeId, 'Search input should exist');

    // Type and click
    await type(session, 'input[name="q"]', 'automation testing');
    await click(session, 'button[type="submit"]');

    // Wait and check result attribute
    await new Promise(r => setTimeout(r, 1000));

    const bodyNode = await querySelector(session, 'body');
    const resolved = await session.send('DOM.resolveNode', { nodeId: bodyNode });
    const { object } = resolved;

    const { result } = await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: 'function() { return this.getAttribute("data-status"); }',
        returnByValue: true,
    });

    assertEqual(result.value, 'submitted', 'Form should be marked as submitted');

} catch (err) {
    console.error('❌ Test failed:\n', err);
} finally {
    ws.close();
    await chrome.kill();
    console.log('\n🧹 Test complete. Chrome closed.');
}