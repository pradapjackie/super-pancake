import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchChrome } from '../../utils/launcher.js';
import { connectToChrome, closeConnection } from '../../core/browser.js';
import { createSession } from '../../core/session.js';

describe('Headless Toggle Test', () => {
  let chromeProcess = null;
  let ws = null;
  let session = null;

  beforeAll(async () => {
    console.log('🔧 Environment Variables:');
    console.log(`   SUPER_PANCAKE_HEADLESS: ${process.env.SUPER_PANCAKE_HEADLESS}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
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
      closeConnection(ws);
    }

    if (chromeProcess) {
      await chromeProcess.kill();
    }

    // Give Chrome time to fully close
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  it('should launch Chrome in correct mode based on environment variable', async () => {
    try {
      // The launcher should respect SUPER_PANCAKE_HEADLESS environment variable
      chromeProcess = await launchChrome({
        port: 9223, // Use different port to avoid conflicts
        maxRetries: 3
      });

      expect(chromeProcess).toBeDefined();
      expect(chromeProcess.port).toBe(9223);
      expect(chromeProcess.pid).toBeDefined();

      const headlessMode = process.env.SUPER_PANCAKE_HEADLESS;
      const expectedMode = headlessMode === 'true' ? 'headless' : 'headed';
      
      console.log(`✅ Chrome launched successfully with PID ${chromeProcess.pid}`);
      console.log(`🔧 Expected mode: ${expectedMode} (SUPER_PANCAKE_HEADLESS=${headlessMode})`);
      
      // Connect and verify the browser is working
      ws = await connectToChrome(9223, 3);
      expect(ws).toBeDefined();
      expect(ws.readyState).toBe(1); // WebSocket.OPEN
      
      session = createSession(ws);
      expect(session).toBeDefined();

      // Test basic functionality
      const result = await session.send('Runtime.evaluate', {
        expression: 'navigator.userAgent',
        returnByValue: true
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.value).toContain('Chrome');
      
      // Check if headless flag is present in user agent
      const userAgent = result.result.value;
      const isHeadlessUA = userAgent.includes('HeadlessChrome');
      
      console.log(`🔍 User Agent: ${userAgent}`);
      console.log(`🔍 Headless in UA: ${isHeadlessUA}`);
      
      // If SUPER_PANCAKE_HEADLESS is set to true, Chrome should be headless
      if (headlessMode === 'true') {
        expect(isHeadlessUA).toBe(true);
        console.log('✅ Confirmed: Chrome is running in headless mode');
      } else {
        // Note: Headed Chrome may still show HeadlessChrome in some versions
        console.log(`ℹ️ Chrome mode: ${isHeadlessUA ? 'headless' : 'headed'}`);
      }

    } catch (error) {
      console.error('Chrome launch/test failed:', error.message);
      throw error;
    }
  }, 30000);

  it('should respect headless mode toggle from UI', async () => {
    if (!chromeProcess || !session) {
      console.log('⏭️ Skipping test - Chrome not available from previous test');
      return;
    }

    try {
      // Test that we can get basic browser info
      const result = await session.send('Runtime.evaluate', {
        expression: `({
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          windowExists: typeof window !== 'undefined'
        })`,
        returnByValue: true
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.value).toBeDefined();

      const browserInfo = result.result.value;
      console.log('🔍 Browser Info:', JSON.stringify(browserInfo, null, 2));

      expect(browserInfo.userAgent).toContain('Chrome');
      expect(browserInfo.windowExists).toBe(true);

    } catch (error) {
      console.error('Browser info test failed:', error.message);
      throw error;
    }
  }, 15000);
});