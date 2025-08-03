import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchBrowser } from '../../utils/launcher.js';
import { connectToBrowser, closeBrowserConnection } from '../../core/browser.js';
import { createSession } from '../../core/session.js';
import { killFirefox } from '../../utils/firefox-launcher.js';
import { validateBrowserSupport } from '../../utils/browser-detection.js';

describe('Firefox Browser Integration', () => {
  let firefoxProcess = null;
  let ws = null;
  let session = null;

  beforeAll(async () => {
    // Check if Firefox is available
    const validation = await validateBrowserSupport('firefox');
    if (!validation.supported) {
      console.log('⚠️ Skipping Firefox tests - Firefox not available');
      console.log(`Reason: ${validation.message}`);
      validation.suggestions?.forEach(suggestion => {
        console.log(`• ${suggestion}`);
      });
      return;
    }

    console.log(`🦊 Using ${validation.browser.name} ${validation.browser.version}`);
  });

  afterAll(async () => {
    // Cleanup
    if (session) {
      try {
        await session.send('Browser.close');
      } catch (error) {
        console.log('Browser close error (expected):', error.message);
      }
    }

    if (ws) {
      closeBrowserConnection(ws, 'firefox');
    }

    if (firefoxProcess) {
      await killFirefox(firefoxProcess);
    }

    // Give Firefox time to fully close
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  it('should launch Firefox successfully', async () => {
    const validation = await validateBrowserSupport('firefox');
    if (!validation.supported) {
      console.log('⏭️ Skipping test - Firefox not available');
      return;
    }

    try {
      firefoxProcess = await launchBrowser({
        browser: 'firefox',
        headed: false,
        port: 6001, // Use different port to avoid conflicts
        maxRetries: 3
      });

      expect(firefoxProcess).toBeDefined();
      expect(firefoxProcess.port).toBe(6001);
      expect(firefoxProcess.pid).toBeDefined();
      console.log(`✅ Firefox launched successfully with PID ${firefoxProcess.pid}`);
    } catch (error) {
      console.error('Firefox launch failed:', error.message);
      throw error;
    }
  }, 30000);

  it('should connect to Firefox WebSocket', async () => {
    const validation = await validateBrowserSupport('firefox');
    if (!validation.supported || !firefoxProcess) {
      console.log('⏭️ Skipping test - Firefox not available or not launched');
      return;
    }

    try {
      ws = await connectToBrowser({
        browser: 'firefox',
        port: 6001,
        maxRetries: 3
      });

      expect(ws).toBeDefined();
      expect(ws.readyState).toBe(1); // WebSocket.OPEN
      expect(ws.browserType).toBe('firefox');
      console.log('✅ Firefox WebSocket connection established');
    } catch (error) {
      console.error('Firefox connection failed:', error.message);
      throw error;
    }
  }, 30000);

  it('should create Firefox session', async () => {
    const validation = await validateBrowserSupport('firefox');
    if (!validation.supported || !ws) {
      console.log('⏭️ Skipping test - Firefox not available or not connected');
      return;
    }

    try {
      session = createSession(ws, 'firefox');

      expect(session).toBeDefined();
      expect(typeof session.send).toBe('function');
      console.log('✅ Firefox session created successfully');
    } catch (error) {
      console.error('Firefox session creation failed:', error.message);
      throw error;
    }
  });

  it('should execute Firefox debugging commands', async () => {
    const validation = await validateBrowserSupport('firefox');
    if (!validation.supported || !session) {
      console.log('⏭️ Skipping test - Firefox not available or session not created');
      return;
    }

    try {
      // Test Runtime.evaluate
      const result = await session.send('Runtime.evaluate', {
        expression: '2 + 2',
        returnByValue: true
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.value).toBe(4);
      console.log('✅ Firefox Runtime.evaluate successful:', result.result.value);
    } catch (error) {
      console.error('Firefox command execution failed:', error.message);
      throw error;
    }
  }, 15000);

  it('should navigate to a page in Firefox', async () => {
    const validation = await validateBrowserSupport('firefox');
    if (!validation.supported || !session) {
      console.log('⏭️ Skipping test - Firefox not available or session not created');
      return;
    }

    try {
      // Navigate to about:blank
      await session.send('Page.navigate', {
        url: 'about:blank'
      });

      // Wait for navigation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the URL to verify navigation
      const result = await session.send('Runtime.evaluate', {
        expression: 'window.location.href',
        returnByValue: true
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.value).toBe('about:blank');
      console.log('✅ Firefox navigation successful to:', result.result.value);
    } catch (error) {
      console.error('Firefox navigation failed:', error.message);
      throw error;
    }
  }, 15000);

  it('should handle DOM manipulation in Firefox', async () => {
    const validation = await validateBrowserSupport('firefox');
    if (!validation.supported || !session) {
      console.log('⏭️ Skipping test - Firefox not available or session not created');
      return;
    }

    try {
      // Create a simple HTML page
      await session.send('Runtime.evaluate', {
        expression: `
          document.body.innerHTML = '<div id="test-element">Hello Firefox!</div>';
        `,
        returnByValue: true
      });

      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Query the element
      const result = await session.send('Runtime.evaluate', {
        expression: 'document.getElementById("test-element").textContent',
        returnByValue: true
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.value).toBe('Hello Firefox!');
      console.log('✅ Firefox DOM manipulation successful:', result.result.value);
    } catch (error) {
      console.error('Firefox DOM manipulation failed:', error.message);
      throw error;
    }
  }, 15000);
});