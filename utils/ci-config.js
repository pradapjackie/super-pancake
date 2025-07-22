// CI Configuration Utility
// Handles differences between local development and CI environments

import { resolve, join } from 'path';
import { platform } from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory for path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Detects if running in CI environment
 */
export function isCI() {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.JENKINS_URL ||
    process.env.BUILDKITE ||
    process.env.CIRCLECI
  );
}

/**
 * Detects if running on GitHub Actions specifically
 */
export function isGitHubActions() {
  return !!process.env.GITHUB_ACTIONS;
}

/**
 * Gets the correct form HTML path for current environment
 */
export function getFormPath() {
  const projectRoot = resolve(__dirname, '..');
  const formPath = join(projectRoot, 'public', 'form-comprehensive.html');

  // Always use file:// protocol
  return `file://${formPath}`;
}

/**
 * Gets screenshots directory path
 */
export function getScreenshotsDir() {
  if (isCI()) {
    return './screenshots'; // Relative path for CI
  }
  return './screenshots'; // Same for local
}

/**
 * Gets Chrome launch configuration for current environment
 */
export function getChromeConfig(overrides = {}) {
  const baseConfig = {
    headed: false,
    port: 9222,
    maxRetries: 3,
    timeout: 30000,
    ...overrides
  };

  // CI-specific Chrome arguments
  if (isCI()) {
    baseConfig.args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-features=BlinkGenPropertyTrees',
      '--run-all-compositor-stages-before-draw',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      ...(baseConfig.args || [])
    ];

    // Longer timeout for CI
    baseConfig.timeout = 45000;
    baseConfig.maxRetries = 2;
  }

  return baseConfig;
}

/**
 * Gets test timeouts for current environment
 */
export function getTestTimeouts() {
  if (isCI()) {
    return {
      short: 10000,   // 10 seconds
      medium: 20000,  // 20 seconds
      long: 45000,    // 45 seconds
      navigation: 30000, // 30 seconds
      screenshot: 15000  // 15 seconds
    };
  }

  return {
    short: 5000,    // 5 seconds
    medium: 10000,  // 10 seconds
    long: 30000,    // 30 seconds
    navigation: 15000, // 15 seconds
    screenshot: 10000  // 10 seconds
  };
}

/**
 * Gets performance thresholds adjusted for CI
 */
export function getPerformanceThresholds() {
  if (isCI()) {
    return {
      BROWSER_LAUNCH: 15000,   // 15 seconds for CI
      CONNECTION_SETUP: 5000,   // 5 seconds
      SESSION_CREATION: 2000,   // 2 seconds
      DOM_OPERATION: 3000,      // 3 seconds
      SCREENSHOT: 8000,         // 8 seconds
      MEMORY_INCREASE: 100,     // 100MB for CI
      SUCCESS_RATE: 0.85        // 85% success rate for CI
    };
  }

  return {
    BROWSER_LAUNCH: 10000,   // 10 seconds for local
    CONNECTION_SETUP: 3000,   // 3 seconds
    SESSION_CREATION: 1000,   // 1 second
    DOM_OPERATION: 2000,      // 2 seconds
    SCREENSHOT: 5000,         // 5 seconds
    MEMORY_INCREASE: 50,      // 50MB for local
    SUCCESS_RATE: 0.90        // 90% success rate for local
  };
}

/**
 * Environment info for debugging
 */
export function getEnvironmentInfo() {
  return {
    isCI: isCI(),
    isGitHubActions: isGitHubActions(),
    platform: platform(),
    nodeVersion: process.version,
    env: {
      CI: process.env.CI,
      GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
      HEADED: process.env.HEADED
    }
  };
}
