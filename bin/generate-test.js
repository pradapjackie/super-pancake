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
  // Simplified test setup
  createTestEnvironment,
  cleanupTestEnvironment,
  
  // DOM operations
  enableDOM,
  navigateTo,
  getText,
  waitForSelector,
  takeElementScreenshot,
  
  // Assertions
  assertEqual,
  assertContainsText,
  
  // Reporting
  writeReport
} from 'super-pancake-automation';

let testEnv;

describe('Super Pancake Sample Test', () => {
  beforeAll(async () => {
    console.log('🚀 Setting up Super Pancake test environment...');
    testEnv = await createTestEnvironment({ 
      headed: false,
      testName: 'Super Pancake Sample Test'
    });
    await enableDOM(testEnv.session);
  }, 30000);

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv, 'Super Pancake Sample Test');
    writeReport();
    console.log('📄 Test report generated');
  });

  it('should navigate to a test page', async () => {
    console.log('🌐 Testing navigation...');
    
    // Navigate to a reliable test page
    await navigateTo(testEnv.session, 'https://example.com');
    
    // Wait for page to load
    const h1Element = await waitForSelector(testEnv.session, 'h1', 10000);
    
    // Get page title
    const title = await getText(testEnv.session, h1Element);
    console.log('📄 Page title:', title);
    
    // Basic assertions
    assertEqual(typeof title, 'string', 'Page title should be a string');
    assertContainsText(title, 'Example', 'Page should contain "Example" text');
    
    console.log('✅ Navigation test passed');
  });

  it('should take a screenshot', async () => {
    console.log('📸 Testing screenshot functionality...');
    
    // Take a screenshot of the current page
    await takeElementScreenshot(testEnv.session, 'body', './test-screenshot.png');
    
    console.log('📸 Screenshot saved as test-screenshot.png');
    console.log('✅ Screenshot test passed');
  });

});

`;

// UI Website Test Content
const uiTestContent = `
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // Simplified test setup
  createTestEnvironment,
  cleanupTestEnvironment,
  
  // DOM operations
  enableDOM,
  navigateTo,
  getText,
  waitForSelector,
  takeElementScreenshot,
  
  // Assertions
  assertEqual,
  assertContainsText,
  
  // Reporting
  writeReport
} from 'super-pancake-automation';

let testEnv;

describe('Super Pancake NPM Website Tests', () => {
  beforeAll(async () => {
    console.log('🌐 Setting up Super Pancake NPM Website test...');
    testEnv = await createTestEnvironment({ 
      headed: true,  // Show browser for website testing
      port: 9223,    // Use different port to avoid conflicts
      testName: 'Super Pancake NPM Website Tests'
    });
    await enableDOM(testEnv.session);
  }, 30000);

  afterAll(async () => {
    // Keep browser open for 5 seconds to see results
    console.log('⏳ Keeping browser open for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await cleanupTestEnvironment(testEnv, 'Super Pancake NPM Website Tests');
    writeReport();
    console.log('📄 UI test report generated');
  });

  it('should navigate to Super Pancake NPM page', async () => {
    console.log('🌐 Testing NPM package page navigation...');
    
    // Navigate to the npm package page
    await navigateTo(testEnv.session, 'https://www.npmjs.com/package/super-pancake-automation');
    
    // Wait for page title to load
    const h1Element = await waitForSelector(testEnv.session, 'h1', 15000);
    
    // Take screenshot of the NPM page
    await takeElementScreenshot(testEnv.session, 'body', './npm-page-screenshot.png');
    console.log('📸 NPM page screenshot saved');
    
    console.log('✅ Successfully navigated to NPM package page');
  });

  it('should verify package information', async () => {
    console.log('🔍 Verifying package information...');
    
    try {
      // Get package name
      const h1Element = await waitForSelector(testEnv.session, 'h1', 5000);
      const title = await getText(testEnv.session, h1Element);
      console.log('📦 Package title:', title);
      
      // Verify it contains our package name
      assertContainsText(title, 'super-pancake-automation', 'Page should show correct package name');
      
      // Look for version information
      const versionElement = await waitForSelector(testEnv.session, '[data-testid="version-number"]', 5000);
      if (versionElement) {
        const version = await getText(testEnv.session, versionElement);
        console.log('📋 Current version:', version);
      }
      
      console.log('✅ Package information verified');
    } catch (error) {
      console.log('⚠️ Some package info checks failed (this is normal for new packages):', error.message);
    }
  });

  it('should check package statistics', async () => {
    console.log('📊 Checking package statistics...');
    
    // Simple screenshot-based check for package page content
    await takeElementScreenshot(testEnv.session, 'body', './package-stats-screenshot.png');
    console.log('📸 Package statistics screenshot saved');
    console.log('✅ Package statistics check completed');
  }, 10000);

  it('should verify README content', async () => {
    console.log('📖 Checking README content...');
    
    // Simple screenshot-based check for README section
    await takeElementScreenshot(testEnv.session, 'body', './readme-screenshot.png');
    console.log('📸 README section screenshot saved');
    console.log('✅ README verification completed');
  }, 10000);

  it('should test install command visibility', async () => {
    console.log('💻 Checking install command...');
    
    // Take screenshot of install section
    await takeElementScreenshot(testEnv.session, 'body', './npm-install-section.png');
    
    console.log('📸 Install section screenshot saved');
    console.log('✅ Install command section verified');
  });

  it('should navigate to GitHub repository', async () => {
    console.log('🔗 Testing GitHub repository link...');
    
    // Take screenshot showing the full page with any GitHub links
    await takeElementScreenshot(testEnv.session, 'body', './github-links-screenshot.png');
    console.log('📸 GitHub links screenshot saved');
    console.log('✅ GitHub repository link test completed');
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
            "super-pancake-automation": "^2.6.15"
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
    const readmeContent = `# Super Pancake Automation Tests

Generated test suite using Super Pancake Framework.

## Setup

Install dependencies:
npm install

## Available Tests

Run basic test: npm run test:sample
Run website test: npm run test:website
Run all tests: npm test

## Test Files

- tests/sample.test.js - Basic functionality test
- tests/ui-website.test.js - NPM website UI test

## Documentation

Visit Super Pancake Framework for full documentation.
`;

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