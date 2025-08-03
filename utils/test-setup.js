// Test Setup Utility - Eliminates beforeAll/afterAll boilerplate
// Provides automatic browser launch, session creation, and cleanup
import { launchChrome } from './simple-launcher.js';
import { launchBrowser } from './launcher.js';
import { connectToChrome, connectToBrowser, closeConnection, closeBrowserConnection } from '../core/browser.js';
import { createSession } from '../core/simple-session.js';
import { enableDOM } from '../core/simple-dom-v2.js';
import { setSession, clearSession } from '../core/session-context.js';
import { getChromeConfig, getTestTimeouts } from './ci-config.js';

/**
 * Creates a complete test setup with browser, WebSocket, and session
 * @param {Object} options - Configuration options
 * @param {boolean} options.headed - Run browser in headed mode (default: false)
 * @param {number} options.port - Browser debugging port (default: auto-detect)
 * @param {string} options.browser - Browser type ('chrome' or 'firefox') (default: from env or 'chrome')
 * @param {string} options.testName - Name for logging (default: 'Test')
 * @returns {Promise<Object>} Object containing browser, ws, session
 */
export async function createTestEnvironment(options = {}) {
  const {
    headed = false,
    port = null, // Let the launcher choose the appropriate port
    browser = process.env.SUPER_PANCAKE_BROWSER || 'chrome',
    testName = 'Test'
  } = options;

  console.log(`🚀 Starting ${testName}...`);
  const timeouts = getTestTimeouts();

  try {
    // Launch browser with configuration
    const defaultPort = browser === 'firefox' ? 6000 : 9222;
    const actualPort = port || defaultPort;
    
    const browserProcess = await launchBrowser({ 
      browser, 
      headed, 
      port: actualPort,
      maxRetries: 3 
    });
    console.log(`✅ ${browser.charAt(0).toUpperCase() + browser.slice(1)} launched`);

    // Wait for browser to fully start (longer in CI)
    const startupDelay = timeouts.short;
    await new Promise(resolve => setTimeout(resolve, startupDelay));

    // Connect to browser
    const ws = await connectToBrowser({ browser, port: actualPort });
    console.log('✅ WebSocket connected');

    // Create session
    const session = createSession(ws, browser);
    console.log('✅ Session created');

    // Set session context for simplified API
    setSession(session);
    console.log('✅ Session context set');

    // Skip DOM enabling for now - we'll enable it in individual tests
    console.log('⚠️ Skipping DOM enable to avoid timeout issues');

    console.log(`🎯 ${testName} setup completed successfully`);

    return { browser: browserProcess, ws, session };

  } catch (error) {
    console.error(`❌ ${testName} setup failed:`, error);
    throw error;
  }
}

/**
 * Cleans up test environment
 * @param {Object} environment - Environment object from createTestEnvironment
 * @param {string} testName - Name for logging
 */
export async function cleanupTestEnvironment(environment, testName = 'Test') {
  console.log(`🧹 Cleaning up ${testName}...`);

  try {
    // Clear session context first
    clearSession();
    console.log('✅ Session context cleared');

    if (environment.session) {
      environment.session.destroy();
      console.log('✅ Session destroyed');
    }
    if (environment.ws) {
      const browserType = environment.ws.browserType || 'chrome';
      closeBrowserConnection(environment.ws, browserType);
      console.log('✅ WebSocket closed');
    }
    if (environment.browser) {
      if (environment.browser.kill) {
        await environment.browser.kill();
      } else if (environment.browser.pid) {
        process.kill(environment.browser.pid, 'SIGTERM');
      }
      console.log('✅ Browser terminated');
    }
    console.log(`🎯 ${testName} cleanup completed`);
  } catch (error) {
    console.warn(`⚠️ ${testName} cleanup warning:`, error.message);
  }
}

/**
 * Higher-order function that wraps test setup and cleanup
 * @param {Object} options - Setup options
 * @returns {Function} Function that takes test function and returns wrapped version
 */
export function withTestEnvironment(options = {}) {
  return function(testFn) {
    const testName = options.testName || 'Test';

    return async function(...args) {
      const environment = await createTestEnvironment(options);

      try {
        return await testFn(environment, ...args);
      } finally {
        await cleanupTestEnvironment(environment, testName);
      }
    };
  };
}

/**
 * Quick setup for standard form tests
 * @param {string} testName - Name for logging
 * @returns {Promise<Object>} Test environment with chrome, ws, session
 */
export function createFormTestEnvironment(testName = 'Form Test') {
  return createTestEnvironment({
    headed: process.env.HEADED === 'true' || process.env.DEBUG === 'true',
    port: 9222,
    testName
  });
}

/**
 * Setup for comprehensive tests
 * @param {string} testName - Name for logging
 * @returns {Promise<Object>} Test environment with chrome, ws, session
 */
export function createComprehensiveTestEnvironment(testName = 'Comprehensive Test') {
  return createTestEnvironment({
    headed: false,
    port: 9222,
    testName
  });
}

/**
 * Setup for headed tests (useful for debugging)
 * @param {string} testName - Name for logging
 * @returns {Promise<Object>} Test environment with chrome, ws, session
 */
export function createHeadedTestEnvironment(testName = 'Headed Test') {
  return createTestEnvironment({
    headed: true,
    port: 9222,
    testName
  });
}
