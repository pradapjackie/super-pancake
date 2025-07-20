// Test Setup Utility - Eliminates beforeAll/afterAll boilerplate
// Provides automatic Chrome launch, session creation, and cleanup
import { launchChrome } from './simple-launcher.js';
import { connectToChrome, closeConnection } from '../core/simple-browser.js';
import { createSession } from '../core/simple-session.js';
import { enableDOM } from '../core/simple-dom-v2.js';
import { setSession, clearSession } from '../core/session-context.js';

/**
 * Creates a complete test setup with Chrome, WebSocket, and session
 * @param {Object} options - Configuration options
 * @param {boolean} options.headed - Run Chrome in headed mode (default: false)
 * @param {number} options.port - Chrome debugging port (default: 9222)
 * @param {string} options.testName - Name for logging (default: 'Test')
 * @returns {Promise<Object>} Object containing chrome, ws, session
 */
export async function createTestEnvironment(options = {}) {
  const {
    headed = false,
    port = 9222,
    testName = 'Test'
  } = options;

  console.log(`🚀 Starting ${testName}...`);
  
  try {
    // Launch Chrome
    const chrome = await launchChrome({ headed, port });
    console.log('✅ Chrome launched');
    
    // Wait for Chrome to fully start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Connect to Chrome
    const ws = await connectToChrome(port);
    console.log('✅ WebSocket connected');
    
    // Create session
    const session = createSession(ws);
    console.log('✅ Session created');
    
    // Set session context for simplified API
    setSession(session);
    console.log('✅ Session context set');
    
    // Skip DOM enabling for now - we'll enable it in individual tests
    console.log('⚠️ Skipping DOM enable to avoid timeout issues');
    
    console.log(`🎯 ${testName} setup completed successfully`);
    
    return { chrome, ws, session };
    
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
      closeConnection(environment.ws);
      console.log('✅ WebSocket closed');
    }
    if (environment.chrome) {
      await environment.chrome.kill();
      console.log('✅ Chrome terminated');
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