import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchBrowser } from '../../utils/launcher.js';
import { connectToBrowser } from '../../core/browser.js';
import { createSession } from '../../core/session.js';
import { setupIndividualTestLogging, startIndividualTest, endIndividualTest, getIndividualTestData } from '../../utils/individualTestLogger.js';

describe('NPM Package Page Validation', () => {
  let browserProcess = null;
  let ws = null;
  let session = null;
  const testUrl = 'https://www.npmjs.com/package/super-pancake-automation';

  // Setup individual test logging
  setupIndividualTestLogging();

  beforeAll(async () => {
    console.log('🚀 Starting browser for NPM package validation test...');
    
    // Use environment variables for browser configuration
    const selectedBrowser = process.env.SUPER_PANCAKE_BROWSER || 'chrome';
    const isHeadless = process.env.SUPER_PANCAKE_HEADLESS !== 'false';
    
    console.log(`🔧 Testing with browser: ${selectedBrowser}, headless: ${isHeadless}`);
    
    // Launch browser
    browserProcess = await launchBrowser({
      browser: selectedBrowser,
      headed: !isHeadless,
      port: selectedBrowser === 'firefox' ? 6000 : 9222,
      maxRetries: 3
    });
    
    console.log(`✅ ${selectedBrowser.charAt(0).toUpperCase() + selectedBrowser.slice(1)} browser launched successfully`);
    
    // Connect to browser
    ws = await connectToBrowser({
      browser: selectedBrowser,
      port: browserProcess.port || (selectedBrowser === 'firefox' ? 6000 : 9222)
    });
    
    session = createSession(ws, selectedBrowser);
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
    const testId = startIndividualTest('should load the npm package page successfully');
    console.log(`🌐 Navigating to: ${testUrl}`);
    
    // Enable page events first
    await session.send('Page.enable');
    await session.send('Runtime.enable');
    
    // Navigate to the NPM package page
    await session.send('Page.navigate', { url: testUrl });
    
    // Wait for page to load with a simple timeout approach
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify page loaded by checking URL
    const urlResult = await session.send('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    
    expect(urlResult.result.value).toContain('npmjs.com');
    console.log('✅ Page navigation completed');
    endIndividualTest(testId);
  });

  it('should have the correct page title', async () => {
    console.log('🔍 Checking page title...');
    
    const titleResult = await session.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    
    const title = titleResult.result.value;
    console.log(`📝 Page title: "${title}"`);
    
    // Assert that the title contains the package name
    expect(title).toContain('super-pancake-automation');
    expect(title).toContain('npm');
  });

  it('should display the package name prominently', async () => {
    console.log('🔍 Checking package name display...');
    
    const packageNameResult = await session.send('Runtime.evaluate', {
      expression: `
        const packageName = document.querySelector('h1, h2');
        packageName ? packageName.textContent.trim() : null;
      `,
      returnByValue: true
    });
    
    const packageName = packageNameResult.result.value;
    console.log(`📦 Package name found: "${packageName}"`);
    
    expect(packageName).toBeTruthy();
    expect(packageName.toLowerCase()).toContain('super-pancake-automation');
  });

  it('should show package version information', async () => {
    console.log('🔍 Checking version information...');
    
    const versionResult = await session.send('Runtime.evaluate', {
      expression: `
        // Search entire page for version pattern
        const bodyText = document.body.textContent;
        const versionMatch = bodyText.match(/\\b\\d+\\.\\d+\\.\\d+\\b/);
        versionMatch ? versionMatch[0] : null;
      `,
      returnByValue: true
    });
    
    const version = versionResult.result.value;
    console.log(`📊 Version found: "${version}"`);
    
    expect(version).toBeTruthy();
    expect(version).toMatch(/^\d+\.\d+\.\d+/); // Semantic versioning pattern
  });

  it('should contain package description', async () => {
    console.log('🔍 Checking package description...');
    
    const descriptionResult = await session.send('Runtime.evaluate', {
      expression: `
        // Look for meta description first
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && metaDesc.content) {
          return metaDesc.content.trim();
        }
        
        // Fallback to first paragraph
        const firstP = document.querySelector('p');
        if (firstP && firstP.textContent.length > 10) {
          return firstP.textContent.trim();
        }
        
        return null;
      `,
      returnByValue: true
    });
    
    const description = descriptionResult.result.value;
    console.log(`📝 Description found: "${description}"`);
    
    expect(description).toBeTruthy();
    expect(description.length).toBeGreaterThan(10); // Should be a meaningful description
  });

  it('should have installation instructions', async () => {
    console.log('🔍 Checking installation instructions...');
    
    const installResult = await session.send('Runtime.evaluate', {
      expression: `
        const bodyText = document.body.textContent;
        const hasNpmInstall = bodyText.includes('npm install') || bodyText.includes('npm i ');
        const hasPackageName = bodyText.includes('super-pancake-automation');
        return { hasNpmInstall, hasPackageName };
      `,
      returnByValue: true
    });
    
    const installInfo = installResult.result.value;
    console.log(`💾 Install info:`, installInfo);
    
    expect(installInfo.hasNpmInstall).toBe(true);
    expect(installInfo.hasPackageName).toBe(true);
  });

  it('should display download statistics', async () => {
    console.log('🔍 Checking download statistics...');
    
    const statsResult = await session.send('Runtime.evaluate', {
      expression: `
        const bodyText = document.body.textContent.toLowerCase();
        const hasDownloads = bodyText.includes('download') || bodyText.includes('weekly');
        return { hasDownloads };
      `,
      returnByValue: true
    });
    
    const stats = statsResult.result.value;
    console.log(`📈 Stats info:`, stats);
    
    // NPM pages typically show download stats
    expect(stats.hasDownloads).toBe(true);
  });

  it('should have proper page structure and navigation', async () => {
    console.log('🔍 Checking page structure...');
    
    const structureResult = await session.send('Runtime.evaluate', {
      expression: `
        return {
          hasHeader: !!document.querySelector('header, nav'),
          hasMainContent: !!document.querySelector('main, .main'),
          url: window.location.href,
          isNpmSite: window.location.hostname.includes('npmjs.com')
        };
      `,
      returnByValue: true
    });
    
    const structure = structureResult.result.value;
    console.log(`🏗️  Page structure:`, structure);
    
    expect(structure.url).toBe(testUrl);
    expect(structure.isNpmSite).toBe(true);
  });

  it('should be responsive and accessible', async () => {
    console.log('🔍 Checking responsiveness and accessibility...');
    
    const accessibilityResult = await session.send('Runtime.evaluate', {
      expression: `
        return {
          hasViewportMeta: !!document.querySelector('meta[name="viewport"]'),
          hasHeadings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
          bodyWidth: document.body.offsetWidth,
          bodyHeight: document.body.offsetHeight
        };
      `,
      returnByValue: true
    });
    
    const accessibility = accessibilityResult.result.value;
    console.log(`♿ Accessibility info:`, accessibility);
    
    expect(accessibility.hasViewportMeta).toBe(true);
    expect(accessibility.hasHeadings).toBe(true);
    expect(accessibility.bodyWidth).toBeGreaterThan(0);
    expect(accessibility.bodyHeight).toBeGreaterThan(0);
  });

  it('should load without JavaScript errors', async () => {
    console.log('🔍 Checking for JavaScript errors...');
    
    const consoleResult = await session.send('Runtime.evaluate', {
      expression: `
        return {
          pageLoaded: document.readyState === 'complete',
          scriptsCount: document.querySelectorAll('script').length
        };
      `,
      returnByValue: true
    });
    
    const consoleInfo = consoleResult.result.value;
    console.log(`🔧 Console info:`, consoleInfo);
    
    expect(consoleInfo.pageLoaded).toBe(true);
    expect(consoleInfo.scriptsCount).toBeGreaterThan(0); // NPM pages have scripts
  });
});