
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
    console.log(`🔍 Using dynamic port: ${port}`);

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

