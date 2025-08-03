import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestEnvironment, cleanupTestEnvironment } from '../../utils/test-setup.js';
import { validateBrowserSupport } from '../../utils/browser-detection.js';

describe('Browser Selection Integration', () => {
  let environment = null;

  afterAll(async () => {
    if (environment) {
      await cleanupTestEnvironment(environment, 'Browser Selection Test');
    }
  });

  it('should respect SUPER_PANCAKE_BROWSER environment variable', async () => {
    const selectedBrowser = process.env.SUPER_PANCAKE_BROWSER || 'chrome';
    const isHeadless = process.env.SUPER_PANCAKE_HEADLESS === 'true';
    
    console.log(`🔧 Testing with browser: ${selectedBrowser}, headless: ${isHeadless}`);
    
    // Check if the selected browser is available
    const validation = await validateBrowserSupport(selectedBrowser);
    if (!validation.supported) {
      console.log(`⏭️ Skipping test - ${selectedBrowser} not available`);
      console.log(`Reason: ${validation.message}`);
      return;
    }

    console.log(`✅ Using ${validation.browser.name} ${validation.browser.version}`);

    try {
      // Create test environment with browser from environment variable
      environment = await createTestEnvironment({
        testName: 'Browser Selection Test',
        headed: !isHeadless // Invert headless for the headed parameter
      });

      expect(environment).toBeDefined();
      expect(environment.browser).toBeDefined();
      expect(environment.ws).toBeDefined();
      expect(environment.session).toBeDefined();

      // Test basic functionality
      const result = await environment.session.send('Runtime.evaluate', {
        expression: `({
          userAgent: navigator.userAgent,
          browser: '${selectedBrowser}',
          headless: ${isHeadless}
        })`,
        returnByValue: true
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.value).toBeDefined();

      const browserInfo = result.result.value;
      console.log('🔍 Browser Info:', JSON.stringify(browserInfo, null, 2));

      // Verify browser type
      if (selectedBrowser === 'chrome') {
        expect(browserInfo.userAgent).toContain('Chrome');
        if (isHeadless) {
          expect(browserInfo.userAgent).toContain('HeadlessChrome');
        }
      } else if (selectedBrowser === 'firefox') {
        expect(browserInfo.userAgent).toContain('Firefox');
      }

      console.log(`✅ ${selectedBrowser} browser test completed successfully`);

    } catch (error) {
      console.error(`❌ Browser test failed:`, error.message);
      throw error;
    }
  }, 45000);

  it('should execute basic DOM manipulation', async () => {
    if (!environment) {
      console.log('⏭️ Skipping test - No environment from previous test');
      return;
    }

    try {
      // Create a simple test page
      await environment.session.send('Runtime.evaluate', {
        expression: `
          document.body.innerHTML = '<div id="test-element">Browser Integration Test</div>';
        `,
        returnByValue: true
      });

      // Wait for DOM update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Query the element
      const result = await environment.session.send('Runtime.evaluate', {
        expression: 'document.getElementById("test-element").textContent',
        returnByValue: true
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.value).toBe('Browser Integration Test');
      
      console.log('✅ DOM manipulation successful:', result.result.value);

    } catch (error) {
      console.error('❌ DOM manipulation failed:', error.message);
      throw error;
    }
  }, 15000);
});