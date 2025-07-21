console.log('Happy developing ✨')
// index.js
export * from './core/assert.js';
export * from './core/browser.js';
export * from './core/dom.js';
export * from './core/runner.js';
export * from './core/screenshot.js';
export * from './core/session.js';
export * from './core/browserEvents.js';

// Optional exports (add only if public API)
export * from './utils/launcher.js';
export * from './reporter/htmlReporter.js';
export * from './helpers/testWrapper.js';

export * from './config.js';
// Note: test-ui.js is not exported to prevent circular dependencies

// Export API utilities
export * from './core/api.js';

// Session context utilities (needed by generators)
export { setSession, clearSession, getSession } from './core/session-context.js';

// Export caching utilities
export { 
  getCacheStats, 
  clearQueryCache, 
  invalidateCacheForSelector, 
  configureCaching 
} from './core/query-cache.js';