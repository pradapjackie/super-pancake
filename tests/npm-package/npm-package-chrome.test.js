import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchBrowser } from '../../utils/launcher.js';
import { connectToBrowser } from '../../core/browser.js';
import { createSession } from '../../core/session.js';

describe('NPM Package Page Validation (Chrome)', () => {
  let browserProcess = null;
  let ws = null;
  let session = null;
  const testUrl = 'https://www.npmjs.com/package/super-pancake-automation';

  beforeAll(async () => {
    console.log('🚀 Starting Chrome for NPM package validation test...');
    
    // Force Chrome usage for this test
    const isHeadless = process.env.SUPER_PANCAKE_HEADLESS !== 'false';
    
    console.log(`🔧 Testing with browser: chrome, headless: ${isHeadless}`);
    
    // Launch Chrome browser
    browserProcess = await launchBrowser({
      browser: 'chrome',
      headed: !isHeadless,
      port: 9223,
      maxRetries: 3
    });
    
    console.log('✅ Chrome browser launched successfully');
    
    // Connect to browser
    ws = await connectToBrowser({
      browser: 'chrome',
      port: browserProcess.port || 9223
    });
    
    session = createSession(ws, 'chrome');
    console.log('🔗 Connected to browser session');
  }, 60000);

  afterAll(async () => {
    console.log('🧹 Cleaning up browser resources...');
    
    if (session) {
      try {
        await session.send('Browser.close');
      } catch (error) {
        console.log('⚠️ Error closing browser session:', error.message);
      }
    }
    
    if (ws) {
      try {
        ws.close();
      } catch (error) {
        console.log('⚠️ Error closing WebSocket:', error.message);
      }
    }
    
    if (browserProcess && browserProcess.kill) {
      try {
        await browserProcess.kill();
      } catch (error) {
        console.log('⚠️ Error killing browser process:', error.message);
      }
    }
    
    console.log('✅ Cleanup completed');
  });

  it('should load the npm package page successfully', async () => {
    console.log(`🌐 Navigating to: ${testUrl}`);
    
    // Enable page events first
    await session.send('Page.enable');
    await session.send('Runtime.enable');
    
    // Navigate to the NPM package page
    await session.send('Page.navigate', { url: testUrl });
    
    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify page loaded by checking URL
    const urlResult = await session.send('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    
    expect(urlResult.result.value).toContain('npmjs.com');
    expect(urlResult.result.value).toContain('super-pancake-automation');
    console.log('✅ Page navigation completed');
  });

  it('should have the correct page title', async () => {
    console.log('🔍 Checking page title...');
    
    const titleResult = await session.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    
    const title = titleResult.result.value;
    console.log(`📝 Page title: "${title}"`);
    
    expect(title).toContain('super-pancake-automation');
    expect(title).toContain('npm');
  });

  it('should display the package name prominently', async () => {
    console.log('🔍 Checking package name display...');
    
    const packageNameResult = await session.send('Runtime.evaluate', {
      expression: `
        const h1 = document.querySelector('h1');
        h1 ? h1.textContent.trim() : null;
      `,
      returnByValue: true
    });
    
    const packageName = packageNameResult.result.value;
    console.log(`📦 Package name found: "${packageName}"`);
    
    expect(packageName).toBeTruthy();
    expect(packageName.toLowerCase()).toContain('super pancake automation');
  });

  it('should show package version information', async () => {
    console.log('🔍 Checking version information...');
    
    const versionResult = await session.send('Runtime.evaluate', {
      expression: `
        const bodyText = document.body.textContent;
        const versionMatch = bodyText.match(/\\b\\d+\\.\\d+\\.\\d+\\b/);
        versionMatch ? versionMatch[0] : null;
      `,
      returnByValue: true
    });
    
    const version = versionResult.result.value;
    console.log(`📊 Version found: "${version}"`);
    
    expect(version).toBeTruthy();
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should contain package installation instructions', async () => {
    console.log('🔍 Checking installation instructions...');
    
    const installResult = await session.send('Runtime.evaluate', {
      expression: `
        (function() {
          const bodyText = document.body.textContent;
          const hasNpmInstall = bodyText.includes('npm install') || bodyText.includes('npm i ');
          const hasPackageName = bodyText.includes('super-pancake-automation');
          return { hasNpmInstall, hasPackageName };
        })();
      `,
      returnByValue: true
    });
    
    const installInfo = installResult.result.value;
    console.log(`💾 Install info:`, installInfo);
    
    expect(installInfo.hasNpmInstall).toBe(true);
    expect(installInfo.hasPackageName).toBe(true);
  });

  it('should be accessible and well-structured', async () => {
    console.log('🔍 Checking page structure and accessibility...');
    
    const structureResult = await session.send('Runtime.evaluate', {
      expression: `
        ({
          hasViewportMeta: !!document.querySelector('meta[name="viewport"]'),
          hasHeadings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
          url: window.location.href,
          isNpmSite: window.location.hostname.includes('npmjs.com'),
          pageLoaded: document.readyState === 'complete'
        });
      `,
      returnByValue: true
    });
    
    const structure = structureResult.result.value;
    console.log(`🏗️  Page structure:`, structure);
    
    expect(structure.url).toBe(testUrl);
    expect(structure.isNpmSite).toBe(true);
    expect(structure.hasViewportMeta).toBe(true);
    expect(structure.hasHeadings).toBe(true);
    expect(structure.pageLoaded).toBe(true);
  });
});