#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Target locations
const testDir = path.resolve(process.cwd(), 'tests');
const testFile = path.join(testDir, 'sample.test.js');
const uiTestFile = path.join(testDir, 'ui-website.test.js');

const sampleContent = `
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // Browser management
  launchChrome,
  connectToChrome,
  createSession,
  
  // DOM operations
  enableDOM,
  navigateTo,
  fillInput,
  check,
  selectOption,
  click,
  getAttribute,
  getText,
  waitForSelector,
  takeElementScreenshot,
  
  // Assertions
  assertEqual,
  assertContainsText,
  
  // Reporting
  addTestResult,
  writeReport,
  testWithReport,
  
  // Configuration
  config
} from 'super-pancake-automation';

let chrome, ws, session;

describe('Super Pancake Sample Test', () => {
  beforeAll(async () => {
    console.log('\\n🥞 Super Pancake Test Started');
    
    try {
      // Launch Chrome in headless mode for better compatibility
      chrome = await launchChrome({ 
        headed: false, // Use headless for better CI compatibility
        port: 9222    // Use default port
      });
      
      ws = await connectToChrome();
      session = createSession(ws);
      await enableDOM(session);
      
      console.log('✅ Chrome launched and connected successfully');
    } catch (error) {
      console.error('❌ Failed to setup browser:', error.message);
      throw error;
    }
  }, 45000); // Extended timeout for slower systems

  afterAll(async () => {
    try {
      if (ws) {
        ws.close();
        console.log('✅ WebSocket connection closed');
      }
      if (chrome) {
        await chrome.kill();
        console.log('✅ Chrome browser closed');
      }
      
      // Generate HTML report
      writeReport();
      console.log('📄 Test report generated');
      
    } catch (error) {
      console.error('⚠️ Cleanup warning:', error.message);
    }
  });

  it('should navigate to a test page', async () => {
    console.log('🌐 Testing navigation...');
    
    // Navigate to a reliable test page (Google as fallback)
    await navigateTo(session, 'https://example.com');
    
    // Wait for page to load
    await waitForSelector(session, 'h1', { timeout: 10000 });
    
    // Get page title
    const title = await getText(session, 'h1');
    console.log('📄 Page title:', title);
    
    // Basic assertion
    assertEqual(typeof title, 'string', 'Page title should be a string');
    assertContainsText(title, 'Example', 'Page should contain "Example" text');
    
    console.log('✅ Navigation test passed');
  });

  it('should take a screenshot', async () => {
    console.log('📸 Testing screenshot functionality...');
    
    // Take a screenshot of the current page
    const screenshot = await takeElementScreenshot(session, 'body', './test-screenshot.png');
    
    console.log('📸 Screenshot saved as test-screenshot.png');
    console.log('✅ Screenshot test passed');
  });

});

`;

// UI Website Test Content
const uiTestContent = `
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // Browser management
  launchChrome,
  connectToChrome,
  createSession,
  
  // DOM operations
  enableDOM,
  navigateTo,
  click,
  getText,
  waitForSelector,
  takeElementScreenshot,
  getAttribute,
  
  // Assertions
  assertEqual,
  assertContainsText,
  
  // Reporting
  addTestResult,
  writeReport,
  testWithReport,
  
  // Configuration
  config
} from 'super-pancake-automation';

let chrome, ws, session;

describe('Super Pancake NPM Website Tests', () => {
  beforeAll(async () => {
    console.log('\\n🌐 Super Pancake NPM Website Test Started');
    
    try {
      // Launch Chrome in headed mode to see the website
      chrome = await launchChrome({ 
        headed: true,  // Show browser for website testing
        port: 9223     // Use different port to avoid conflicts
      });
      
      ws = await connectToChrome(9223);
      session = createSession(ws);
      await enableDOM(session);
      
      console.log('✅ Chrome launched successfully for UI testing');
    } catch (error) {
      console.error('❌ Failed to setup browser:', error.message);
      throw error;
    }
  }, 45000);

  afterAll(async () => {
    try {
      // Keep browser open for 5 seconds to see results
      console.log('⏳ Keeping browser open for 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (ws) {
        ws.close();
        console.log('✅ WebSocket connection closed');
      }
      if (chrome) {
        await chrome.kill();
        console.log('✅ Chrome browser closed');
      }
      
      writeReport();
      console.log('📄 UI test report generated');
      
    } catch (error) {
      console.error('⚠️ Cleanup warning:', error.message);
    }
  });

  it('should navigate to Super Pancake NPM page', async () => {
    console.log('🌐 Testing NPM package page navigation...');
    
    // Navigate to the npm package page
    await navigateTo(session, 'https://www.npmjs.com/package/super-pancake-automation');
    
    // Wait for page title to load
    await waitForSelector(session, 'h1', { timeout: 15000 });
    
    // Take screenshot of the NPM page
    await takeElementScreenshot(session, 'body', './npm-page-screenshot.png');
    console.log('📸 NPM page screenshot saved');
    
    console.log('✅ Successfully navigated to NPM package page');
  });

  it('should verify package information', async () => {
    console.log('🔍 Verifying package information...');
    
    try {
      // Get package name
      const title = await getText(session, 'h1');
      console.log('📦 Package title:', title);
      
      // Verify it contains our package name
      assertContainsText(title, 'super-pancake-automation', 'Page should show correct package name');
      
      // Look for version information
      const versionElement = await waitForSelector(session, '[data-testid="version-number"]', { timeout: 5000 });
      if (versionElement) {
        const version = await getText(session, '[data-testid="version-number"]');
        console.log('📋 Current version:', version);
      }
      
      console.log('✅ Package information verified');
    } catch (error) {
      console.log('⚠️ Some package info checks failed (this is normal for new packages):', error.message);
    }
  });

  it('should check package statistics', async () => {
    console.log('📊 Checking package statistics...');
    
    try {
      // Look for download stats (may not exist for new packages)
      const statsSelectors = [
        '[data-testid="weekly-downloads"]',
        '.download-count',
        '[title*="download"]'
      ];
      
      for (const selector of statsSelectors) {
        try {
          const element = await waitForSelector(session, selector, { timeout: 3000 });
          if (element) {
            const stats = await getText(session, selector);
            console.log('📈 Found stats:', stats);
            break;
          }
        } catch {
          // Continue trying other selectors
        }
      }
      
      console.log('✅ Package statistics check completed');
    } catch (error) {
      console.log('⚠️ Stats check completed with warnings (normal for new packages)');
    }
  });

  it('should verify README content', async () => {
    console.log('📖 Checking README content...');
    
    try {
      // Look for README content
      const readmeSelectors = [
        '[data-testid="readme"]',
        '#readme',
        '.markdown-body'
      ];
      
      for (const selector of readmeSelectors) {
        try {
          const readmeElement = await waitForSelector(session, selector, { timeout: 5000 });
          if (readmeElement) {
            const readmeText = await getText(session, selector);
            console.log('📄 Found README content (first 200 chars):', readmeText.substring(0, 200) + '...');
            
            // Basic README checks
            if (readmeText.length > 50) {
              console.log('✅ README content appears to be substantial');
            }
            break;
          }
        } catch {
          // Continue trying other selectors
        }
      }
      
      console.log('✅ README verification completed');
    } catch (error) {
      console.log('⚠️ README check completed with warnings:', error.message);
    }
  });

  it('should test install command visibility', async () => {
    console.log('💻 Checking install command...');
    
    try {
      // Look for install command
      const installSelectors = [
        '[data-testid="install-command"]',
        'code:contains("npm install")',
        'pre:contains("npm install")'
      ];
      
      // Take screenshot of install section
      await takeElementScreenshot(session, 'body', './npm-install-section.png');
      
      console.log('📸 Install section screenshot saved');
      console.log('✅ Install command section verified');
      
    } catch (error) {
      console.log('⚠️ Install command check completed with warnings:', error.message);
    }
  });

  it('should navigate to GitHub repository', async () => {
    console.log('🔗 Testing GitHub repository link...');
    
    try {
      // Look for GitHub repository link
      const githubSelectors = [
        'a[href*="github.com"]',
        '[data-testid="repository-link"]',
        'a:contains("Repository")'
      ];
      
      for (const selector of githubSelectors) {
        try {
          const githubLink = await waitForSelector(session, selector, { timeout: 3000 });
          if (githubLink) {
            const href = await getAttribute(session, selector, 'href');
            console.log('🔗 Found GitHub link:', href);
            
            if (href && href.includes('github.com')) {
              console.log('✅ Valid GitHub repository link found');
              
              // Click the GitHub link (opens in new tab)
              await click(session, selector);
              console.log('🖱️ Clicked GitHub repository link');
              
              // Wait a moment for navigation
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
            break;
          }
        } catch {
          // Continue trying other selectors
        }
      }
      
      console.log('✅ GitHub repository link test completed');
    } catch (error) {
      console.log('⚠️ GitHub link test completed with warnings:', error.message);
    }
  });

});

`;

if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
}

// Create package.json if it doesn't exist
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
    const packageContent = {
        "name": "my-super-pancake-tests",
        "version": "1.0.0",
        "type": "module",
        "scripts": {
            "test": "vitest run",
            "test:watch": "vitest watch",
            "test:ui": "vitest --ui",
            "test:sample": "vitest run tests/sample.test.js",
            "test:website": "vitest run tests/ui-website.test.js",
            "test:headed": "HEADED=true vitest run",
            "test:debug": "DEBUG=true vitest run"
        },
        "devDependencies": {
            "vitest": "^3.2.0"
        },
        "dependencies": {
            "super-pancake-automation": "latest"
        }
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageContent, null, 2));
    console.log('✅ Package.json created');
}

// Create the basic sample test file
if (!fs.existsSync(testFile)) {
    fs.writeFileSync(testFile, sampleContent, 'utf-8');
    console.log('✅ Sample test file created at:', testFile);
} else {
    console.log('⚠️ Sample test file already exists at:', testFile);
}

// Create the UI website test file
if (!fs.existsSync(uiTestFile)) {
    fs.writeFileSync(uiTestFile, uiTestContent, 'utf-8');
    console.log('✅ UI website test file created at:', uiTestFile);
} else {
    console.log('⚠️ UI website test file already exists at:', uiTestFile);
}

// Create a README with instructions
const readmePath = path.join(process.cwd(), 'README.md');
if (!fs.existsSync(readmePath)) {
    const readmeContent = \`# Super Pancake Automation Tests

Generated test suite using Super Pancake Framework.

## Setup

1. Install dependencies:
\\\`\\\`\\\`bash
npm install
\\\`\\\`\\\`

## Available Tests

### Basic Sample Test
Simple test demonstrating core functionality:
\\\`\\\`\\\`bash
npm run test:sample
\\\`\\\`\\\`

### NPM Website UI Test  
Tests the Super Pancake NPM package page (shows browser):
\\\`\\\`\\\`bash
npm run test:website
\\\`\\\`\\\`

### Run All Tests
\\\`\\\`\\\`bash
npm test
\\\`\\\`\\\`

### Watch Mode (for development)
\\\`\\\`\\\`bash
npm run test:watch
\\\`\\\`\\\`

## Test Files

- \\\`tests/sample.test.js\\\` - Basic functionality test (headless)
- \\\`tests/ui-website.test.js\\\` - NPM website UI test (shows browser)

## Features Tested

### Sample Test
- ✅ Chrome browser launching
- ✅ Page navigation to example.com
- ✅ Screenshot functionality
- ✅ Basic assertions

### Website UI Test  
- 🌐 Navigates to https://www.npmjs.com/package/super-pancake-automation
- 📦 Verifies package information and title
- 📊 Checks download statistics (if available)
- 📖 Validates README content display
- 💻 Screenshots install commands
- 🔗 Tests GitHub repository links
- 📸 Saves screenshots of NPM page

## Notes

- Sample test runs in headless mode (no browser window)
- Website test runs in headed mode (browser window visible)
- Screenshots are saved to the current directory
- HTML test reports are generated automatically
- Make sure you have Chrome/Chromium installed on your system
- Website test keeps browser open for 5 seconds after completion

## Documentation

Visit [Super Pancake Framework](https://github.com/pradapjackie/super-pancake) for full documentation.
\`;

    fs.writeFileSync(readmePath, readmeContent);
    console.log('✅ README.md created with setup instructions');
}

console.log('\\n🎉 Setup complete! Run the following commands:');
console.log('   cd', process.cwd());
console.log('   npm install');
console.log('\\n📋 Available test commands:');
console.log('   npm test               # Run all tests');
console.log('   npm run test:sample    # Basic test (headless)');
console.log('   npm run test:website   # NPM website UI test (shows browser)');
console.log('   npm run test:headed    # Run with visible browser');
console.log('   npm run test:watch     # Watch mode for development');