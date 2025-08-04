import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchBrowser } from '../../utils/launcher.js';
import { connectToBrowser } from '../../core/browser.js';
import { createSession } from '../../core/session.js';

describe('NPM Package Page Validation (Multi-Browser)', () => {
  const testUrl = 'https://www.npmjs.com/package/super-pancake-automation';
  const supportedBrowsers = ['chrome', 'firefox'];
  
  // Test both Chrome and Firefox
  supportedBrowsers.forEach(browserName => {
    describe(`${browserName.charAt(0).toUpperCase() + browserName.slice(1)} Browser`, () => {
      let browserProcess = null;
      let ws = null;
      let session = null;

      beforeAll(async () => {
        console.log(`🚀 Starting ${browserName} for NPM package validation test...`);
        
        const isHeadless = process.env.SUPER_PANCAKE_HEADLESS !== 'false';
        const port = browserName === 'firefox' ? 6001 : 9223;
        
        console.log(`🔧 Testing with browser: ${browserName}, headless: ${isHeadless}`);
        
        try {
          // Launch browser
          browserProcess = await launchBrowser({
            browser: browserName,
            headed: !isHeadless,
            port: port,
            maxRetries: 3
          });
          
          console.log(`✅ ${browserName} browser launched successfully`);
          
          // Connect to browser
          ws = await connectToBrowser({ 
            browser: browserName, 
            port: port 
          });
          console.log(`✅ Connected to ${browserName} browser`);
          
          // Create session
          session = await createSession(ws);
          console.log(`✅ ${browserName} session created`);
          
        } catch (error) {
          console.error(`❌ Failed to setup ${browserName}:`, error.message);
          throw error;
        }
      }, 60000);

      afterAll(async () => {
        console.log(`🧹 Cleaning up ${browserName} test environment...`);
        
        try {
          if (session && ws) {
            await ws.close();
            console.log(`✅ ${browserName} WebSocket connection closed`);
          }
          
          if (browserProcess && browserProcess.kill) {
            browserProcess.kill();
            console.log(`✅ ${browserName} browser process terminated`);
          }
        } catch (error) {
          console.warn(`⚠️ Cleanup warning for ${browserName}:`, error.message);
        }
      });

      it(`should load the NPM package page successfully in ${browserName}`, async () => {
        expect(session).toBeDefined();
        expect(ws).toBeDefined();
        
        console.log(`🌐 Navigating to: ${testUrl}`);
        
        // Navigate to the NPM package page
        const navigateResult = await session.send('Page.navigate', {
          url: testUrl
        });
        
        expect(navigateResult).toBeDefined();
        console.log(`✅ Navigation initiated in ${browserName}`);
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Get page title
        const titleResult = await session.send('Runtime.evaluate', {
          expression: 'document.title',
          returnByValue: true
        });
        
        expect(titleResult).toBeDefined();
        expect(titleResult.result).toBeDefined();
        expect(titleResult.result.value).toBeDefined();
        
        const pageTitle = titleResult.result.value;
        console.log(`📄 Page title in ${browserName}: ${pageTitle}`);
        
        // Verify the page title contains expected content
        expect(pageTitle).toContain('super-pancake-automation');
        console.log(`✅ NPM package page loaded successfully in ${browserName}`);
      });

      it(`should find package information elements in ${browserName}`, async () => {
        console.log(`🔍 Checking for package information elements in ${browserName}...`);
        
        // Check for package name
        const packageNameResult = await session.send('Runtime.evaluate', {
          expression: `
            const nameElement = document.querySelector('h1, [data-testid="package-name"], .package-name');
            nameElement ? nameElement.textContent : null;
          `,
          returnByValue: true
        });
        
        expect(packageNameResult.result.value).toBeTruthy();
        console.log(`✅ Package name found in ${browserName}: ${packageNameResult.result.value}`);
        
        // Check for version information
        const versionResult = await session.send('Runtime.evaluate', {
          expression: `
            const versionElements = document.querySelectorAll('[class*="version"], [data-testid*="version"]');
            versionElements.length > 0 ? 'Version info found' : null;
          `,
          returnByValue: true
        });
        
        expect(versionResult.result.value).toBeTruthy();
        console.log(`✅ Version information found in ${browserName}`);
      });

      it(`should have proper page structure in ${browserName}`, async () => {
        console.log(`🏗️ Verifying page structure in ${browserName}...`);
        
        // Check for basic page structure
        const structureResult = await session.send('Runtime.evaluate', {
          expression: `
            const hasHeader = document.querySelector('header, [role="banner"]') !== null;
            const hasMain = document.querySelector('main, [role="main"], .main-content') !== null;
            const hasFooter = document.querySelector('footer, [role="contentinfo"]') !== null;
            
            ({ hasHeader, hasMain, hasFooter });
          `,
          returnByValue: true
        });
        
        const structure = structureResult.result.value;
        console.log(`📊 Page structure in ${browserName}:`, structure);
        
        // At least header or main should exist
        expect(structure.hasHeader || structure.hasMain).toBe(true);
        
        console.log(`✅ Page structure validation passed in ${browserName}`);
      });
    });
  });
});