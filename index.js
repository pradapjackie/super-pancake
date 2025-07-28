console.log('Happy developing ✨');
// index.js - Updated to use v2 API functions
export * from './core/assert.js';
export * from './core/browser.js';
// Export v2 DOM functions with session context support
export * from './core/simple-dom-v2.js';
export * from './core/runner.js';
export * from './core/screenshot.js';
export * from './core/session.js';
export * from './core/browserEvents.js';

// Optional exports (add only if public API)
export * from './utils/launcher.js';
export * from './reporter/htmlReporter.js';

// Modern HTML Reporter
export { 
  initializeModernReport, 
  addModernTestResult, 
  generateModernReport,
  writeReport as writeModernReport 
} from './reporter/modern-html-reporter.js';
export * from './helpers/testWrapper.js';

export * from './config.js';
// Note: test-ui.js is not exported to prevent circular dependencies

// Export API utilities
export * from './core/api.js';

// Session context utilities (needed by generators)
export { setSession, clearSession, getSession } from './core/session-context.js';

// Test setup utilities (needed by generators)
export {
  createTestEnvironment,
  cleanupTestEnvironment,
  withTestEnvironment,
  createFormTestEnvironment,
  createComprehensiveTestEnvironment,
  createHeadedTestEnvironment
} from './utils/test-setup.js';

// Export caching utilities
export {
  getCacheStats,
  clearQueryCache,
  invalidateCacheForSelector,
  configureCaching
} from './core/query-cache.js';

// Export port utilities (needed for dynamic port allocation)
export {
  findAvailablePort,
  isPortAvailable,
  ensurePortAvailable,
  killPortProcess,
  releasePort,
  getTestPort
} from './utils/port-finder.js';
