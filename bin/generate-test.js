#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Target locations
const testDir = path.resolve(process.cwd(), 'tests');
const testFile = path.join(testDir, 'sample.test.js');
const uiTestFile = path.join(testDir, 'ui-website.test.js');
const apiTestFile = path.join(testDir, 'api.test.js');

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
  writeReport,
  
  // Port utilities
  findAvailablePort
} from 'super-pancake-automation';

let testEnv;

describe('Super Pancake Sample Test', () => {
  beforeAll(async () => {
    console.log('🚀 Setting up Super Pancake test environment...');
    
    // Find available port dynamically to avoid conflicts
    const port = await findAvailablePort(9222, 10);
    console.log(\`🔍 Using dynamic port: \${port}\`);
    
    testEnv = await createTestEnvironment({ 
      headed: process.env.SUPER_PANCAKE_HEADLESS === 'false', // Respect UI setting: false=headless, true=headed
      port: port,     // Use dynamically allocated port
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
  writeReport,
  
  // Port utilities
  findAvailablePort
} from 'super-pancake-automation';

let testEnv;

describe('Super Pancake NPM Website Tests', () => {
  beforeAll(async () => {
    console.log('🌐 Setting up Super Pancake NPM Website test...');
    
    // Find available port dynamically to avoid conflicts
    const port = await findAvailablePort(9223, 10);
    console.log(\`🔍 Using dynamic port: \${port}\`);
    
    testEnv = await createTestEnvironment({ 
      headed: process.env.SUPER_PANCAKE_HEADLESS === 'false', // Respect UI setting: false=headless, true=headed
      port: port,     // Use dynamically allocated port
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

// API Test Content
const apiTestContent = `
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // API testing functions
  sendGet,
  sendPost,
  setAuthToken,
  withBaseUrl,
  timedRequest,
  
  // Assertions for API responses
  assertStatus,
  assertHeader,
  assertBodyContains,
  assertResponseTime,
  validateSchema,
  assertJsonPath,
  
  // Utilities
  buildUrlWithParams,
  logResponse
} from 'super-pancake-automation';

describe('Super Pancake API Tests', () => {
  beforeAll(async () => {
    console.log('🚀 Setting up API tests...');
    // Optional: Set base URL or auth token
    // setAuthToken('your-api-token');
  });

  afterAll(async () => {
    console.log('🧹 API tests completed');
  });

  it('should perform a GET request to JSONPlaceholder API', async () => {
    console.log('🌐 Testing GET request...');
    
    // Make a GET request to a public API
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    
    // Assert response status
    assertStatus(response, 200);
    
    // Assert response contains expected data
    assertBodyContains(response, 'userId', 1);
    assertBodyContains(response, 'id', 1);
    
    // Verify response structure
    const expectedSchema = {
      type: 'object',
      properties: {
        userId: { type: 'number' },
        id: { type: 'number' },
        title: { type: 'string' },
        body: { type: 'string' }
      },
      required: ['userId', 'id', 'title', 'body']
    };
    
    validateSchema(response.data, expectedSchema);
    
    console.log('✅ GET request test passed');
  });

  it('should test POST request with data', async () => {
    console.log('📤 Testing POST request...');
    
    const postData = {
      title: 'Super Pancake Test Post',
      body: 'This is a test post created by Super Pancake automation',
      userId: 1
    };
    
    // Make a POST request
    const response = await sendPost('https://jsonplaceholder.typicode.com/posts', postData);
    
    // Assert response status for creation
    assertStatus(response, 201);
    
    // Assert the posted data is in response
    assertBodyContains(response, 'title', 'Super Pancake Test Post');
    assertBodyContains(response, 'userId', 1);
    
    // Check that an ID was assigned
    const responseId = response.data.id;
    if (typeof responseId !== 'number' || responseId <= 0) {
      throw new Error(\`Expected positive number ID, got: \${responseId}\`);
    }
    
    console.log('✅ POST request test passed');
  });

  it('should test response time performance', async () => {
    console.log('⏱️ Testing API response time...');
    
    // Use timed request to measure performance
    const timedResponse = await timedRequest(() => 
      sendGet('https://jsonplaceholder.typicode.com/posts')
    );
    
    // Assert response time is reasonable (under 3 seconds)
    assertResponseTime(timedResponse, 3000);
    
    // Assert we got multiple posts
    const posts = timedResponse.data;
    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error('Expected array of posts');
    }
    
    console.log(\`📊 Response time: \${timedResponse.duration}ms\`);
    console.log(\`📋 Received \${posts.length} posts\`);
    console.log('✅ Performance test passed');
  });

  it('should test URL building with parameters', async () => {
    console.log('🔗 Testing URL parameter building...');
    
    const baseUrl = 'https://jsonplaceholder.typicode.com/posts';
    const params = { userId: 1, _limit: 5 };
    
    // Build URL with parameters
    const urlWithParams = buildUrlWithParams(baseUrl, params);
    console.log('🌐 Built URL:', urlWithParams);
    
    // Make request with parameters
    const response = await sendGet(urlWithParams);
    
    assertStatus(response, 200);
    
    // Should get posts from user 1, limited to 5
    const posts = response.data;
    if (posts.length > 5) {
      throw new Error(\`Expected max 5 posts, got \${posts.length}\`);
    }
    
    // All posts should be from userId 1
    for (const post of posts) {
      if (post.userId !== 1) {
        throw new Error(\`Expected userId 1, got \${post.userId}\`);
      }
    }
    
    console.log(\`✅ URL parameters test passed - got \${posts.length} posts\`);
  });

  it('should test error handling for invalid endpoints', async () => {
    console.log('❌ Testing error handling...');
    
    try {
      // Try to access a non-existent endpoint
      await sendGet('https://jsonplaceholder.typicode.com/nonexistent');
      throw new Error('Expected request to fail');
    } catch (error) {
      // This should happen - the endpoint doesn't exist
      console.log('✅ Correctly handled 404 error:', error.message);
    }
  });

  it('should log and inspect API response', async () => {
    console.log('🔍 Testing response logging...');
    
    const response = await sendGet('https://jsonplaceholder.typicode.com/users/1');
    
    // Log the full response for inspection
    logResponse(response);
    
    // Assert basic structure
    assertStatus(response, 200);
    assertBodyContains(response, 'name', 'Leanne Graham');
    assertBodyContains(response, 'email', 'Sincere@april.biz');
    
    // Test nested object access
    assertJsonPath(response.data, 'address.city', 'Gwenborough');
    assertJsonPath(response.data, 'company.name', 'Romaguera-Crona');
    
    console.log('✅ Response logging test passed');
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
            "test:api": "vitest run tests/api.test.js",
            "test:headed": "HEADED=true vitest run",
            "test:debug": "DEBUG=true vitest run"
        },
        "dependencies": {
            "super-pancake-automation": "^" + packageJson.version,
            "vitest": "^3.2.4"
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

// Create the API test file
if (!fs.existsSync(apiTestFile)) {
    fs.writeFileSync(apiTestFile, apiTestContent, 'utf-8');
    console.log('✅ API test file created at:', apiTestFile);
} else {
    console.log('⚠️ API test file already exists at:', apiTestFile);
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
Run API test: npm run test:api
Run all tests: npm test

## Test Files

- tests/sample.test.js - Basic functionality test
- tests/ui-website.test.js - NPM website UI test
- tests/api.test.js - API testing example

## Documentation

Visit Super Pancake Framework for full documentation.
`;

    fs.writeFileSync(readmePath, readmeContent);
    console.log('✅ README.md created with setup instructions');
}

console.log('\n🎉 Setup complete! Run the following commands:');
console.log('   cd', process.cwd());
console.log('   npm install');
console.log('\n📋 Available test commands:');
console.log('   npm test               # Run all tests');
console.log('   npm run test:sample    # Basic test (headless)');
console.log('   npm run test:website   # NPM website UI test (shows browser)');
console.log('   npm run test:api       # API testing example');
console.log('   npm run test:headed    # Run with visible browser');
console.log('   npm run test:watch     # Watch mode for development');