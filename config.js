// config.js - Super Pancake Automation Framework Configuration

/**
 * Environment-based configuration system
 * Supports: development, testing, production, ci
 * Override with NODE_ENV or PANCAKE_ENV environment variables
 */

const environment = process.env.PANCAKE_ENV || process.env.NODE_ENV || 'development';

// Base configuration - applies to all environments
const baseConfig = {
  // Browser Configuration
  browser: {
    type: 'chrome', // 'chrome', 'firefox', 'edge', 'safari'
    headless: true, // Run browser in headless mode
    port: 9222, // Chrome DevTools port

    // Chrome-specific arguments
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=TranslateUI',
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-sync',
      '--metrics-recording-only',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows'
    ],

    // Browser window settings
    viewport: {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1
    },

    // Custom executable path (optional)
    executablePath: null, // Auto-detect if null

    // User data directory (optional)
    userDataDir: null, // Temporary if null

    // Additional Chrome flags
    devtools: false, // Open DevTools automatically
    slowMo: 0, // Slow down operations by N milliseconds

    // Timeout for browser launch
    launchTimeout: 30000 // 30 seconds
  },

  // Test Execution Timeouts
  timeouts: {
    // Element interaction timeouts
    waitForSelector: 5000, // Wait for element to appear
    waitForVisible: 5000, // Wait for element to be visible
    waitForHidden: 5000, // Wait for element to be hidden
    waitForEnabled: 5000, // Wait for element to be enabled
    waitForClickable: 5000, // Wait for element to be clickable

    // Page operation timeouts
    navigation: 30000, // Page navigation timeout
    reload: 10000, // Page reload timeout
    actionTimeout: 10000, // Individual action timeout

    // Test execution timeouts
    testTimeout: 60000, // Individual test timeout
    suiteTimeout: 300000, // Test suite timeout (5 minutes)

    // Network timeouts
    requestTimeout: 30000, // Network request timeout
    responseTimeout: 30000 // Response wait timeout
  },

  // Element Query Settings
  selectors: {
    pollInterval: 100, // Polling interval for element queries (ms)
    retryAttempts: 3, // Number of retry attempts for failed operations
    strictMode: false, // Throw errors on multiple element matches

    // Cache configuration
    cache: {
      enabled: true, // Enable element query caching
      ttl: 30000, // Cache time-to-live (30 seconds)
      maxSize: 100 // Maximum cache entries
    }
  },

  // Screenshot Configuration
  screenshots: {
    onFailure: true, // Take screenshot on test failure
    onStep: false, // Take screenshot on each step
    quality: 80, // JPEG quality (1-100)
    fullPage: false, // Capture full page or viewport only
    directory: 'test-report/screenshots',

    // File naming
    format: 'png', // 'png' or 'jpeg'
    prefix: 'test', // File prefix
    timestamp: true // Include timestamp in filename
  },

  // Reporting Configuration
  reporting: {
    directory: 'test-report',
    formats: ['html', 'json'], // Available: 'html', 'json', 'junit', 'console'

    // HTML report settings
    html: {
      theme: 'default', // 'default', 'dark', 'minimal'
      includeScreenshots: true,
      includeStack: true,
      includeTimeline: true
    },

    // JSON report settings
    json: {
      pretty: true, // Pretty-print JSON
      includeMetadata: true
    },

    // Console output settings
    console: {
      verbose: false, // Detailed output
      colors: true, // Colored output
      progress: true // Show progress indicators
    }
  },

  // Performance Settings
  performance: {
    // Memory management
    maxMemoryUsage: 512, // MB - warn if exceeded
    garbageCollection: true, // Force GC after tests

    // Parallel execution
    parallel: {
      enabled: false, // Enable parallel test execution
      maxWorkers: 4, // Maximum worker processes
      workerTimeout: 120000 // Worker timeout (2 minutes)
    },

    // Resource monitoring
    monitoring: {
      enabled: false, // Monitor resource usage
      interval: 5000, // Monitoring interval (5 seconds)
      logToFile: false // Log metrics to file
    }
  },

  // Network Configuration
  network: {
    // Request interception
    interceptRequests: false, // Enable request interception
    blockResources: [], // Block resource types: ['image', 'stylesheet', 'font']

    // Proxy settings
    proxy: {
      enabled: false,
      server: null, // 'http://proxy.company.com:8080'
      username: null,
      password: null
    },

    // Custom headers
    headers: {}, // Global headers to add to all requests

    // User agent
    userAgent: null // Custom user agent (null = default)
  },

  // Security Configuration
  security: {
    // Input validation
    strictValidation: true, // Strict input validation
    sanitizeInputs: true, // Sanitize inputs for safety

    // Execution safety
    allowEval: false, // Allow eval() in custom functions
    maxExecutionTime: 30000, // Maximum execution time for operations

    // File system access
    restrictFileAccess: true, // Restrict file system access
    allowedPaths: [] // Allowed file system paths
  },

  // Logging Configuration
  logging: {
    level: 'info', // 'error', 'warn', 'info', 'debug', 'trace'
    file: null, // Log file path (null = console only)

    // Log formatting
    timestamp: true, // Include timestamps
    colors: true, // Colored logs (if supported)
    structured: false, // Structured JSON logging

    // Component-specific logging
    components: {
      browser: 'info',
      dom: 'info',
      api: 'info',
      cache: 'warn',
      security: 'info'
    }
  },

  // Development Settings
  development: {
    debug: false, // Enable debug mode
    verbose: false, // Verbose output
    saveFailedTests: true, // Save failed test artifacts
    rerunFailed: false, // Automatically rerun failed tests

    // Hot reload
    watchMode: false, // Watch files for changes
    watchPatterns: ['tests/**/*.js'] // File patterns to watch
  }
};

// Environment-specific configurations
const environmentConfigs = {
  // Development environment
  development: {
    browser: {
      headless: false, // Show browser for debugging
      devtools: true, // Open DevTools
      slowMo: 100 // Slow down for observation
    },
    timeouts: {
      testTimeout: 120000 // Longer timeout for debugging
    },
    screenshots: {
      onStep: true // Screenshot each step
    },
    logging: {
      level: 'debug',
      verbose: true
    },
    development: {
      debug: true,
      verbose: true
    }
  },

  // Testing environment
  testing: {
    browser: {
      headless: true,
      args: [...baseConfig.browser.args, '--disable-gpu']
    },
    screenshots: {
      onFailure: true,
      onStep: false
    },
    logging: {
      level: 'info'
    },
    performance: {
      monitoring: {
        enabled: true
      }
    }
  },

  // Production environment
  production: {
    browser: {
      headless: true,
      args: [...baseConfig.browser.args, '--disable-gpu', '--no-zygote']
    },
    timeouts: {
      testTimeout: 30000, // Shorter timeouts
      navigation: 20000
    },
    logging: {
      level: 'warn', // Less verbose
      file: 'logs/automation.log'
    },
    security: {
      strictValidation: true,
      restrictFileAccess: true
    }
  },

  // CI/CD environment
  ci: {
    browser: {
      headless: true,
      args: [
        ...baseConfig.browser.args,
        '--disable-gpu',
        '--no-zygote',
        '--single-process', // Helps in CI environments
        '--memory-pressure-off'
      ]
    },
    timeouts: {
      testTimeout: 45000,
      navigation: 25000,
      launchTimeout: 60000 // Longer timeout for CI
    },
    screenshots: {
      onFailure: true,
      onStep: false
    },
    logging: {
      level: 'info',
      structured: true // Better for CI log parsing
    },
    performance: {
      maxMemoryUsage: 256, // Lower memory limit for CI
      parallel: {
        enabled: true,
        maxWorkers: 2 // Conservative for CI
      }
    },
    reporting: {
      formats: ['html', 'json', 'junit'] // Include JUnit for CI
    }
  }
};

// Merge configurations
function createConfig() {
  const envConfig = environmentConfigs[environment] || {};

  // Deep merge function
  function deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  const merged = deepMerge(baseConfig, envConfig);

  // Add environment metadata
  merged.meta = {
    environment,
    version: '1.2.7',
    platform: process.platform,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  };

  return merged;
}

// Export the merged configuration
export const config = createConfig();

// Export configuration utilities
export function getConfig(path) {
  return path.split('.').reduce((obj, key) => obj?.[key], config);
}

export function updateConfig(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((obj, key) => obj[key], config);
  target[lastKey] = value;
}

export function isEnvironment(env) {
  return environment === env;
}

export function isDevelopment() {
  return environment === 'development';
}

export function isProduction() {
  return environment === 'production';
}

export function isCI() {
  return environment === 'ci' || process.env.CI === 'true';
}

// Environment detection helpers
export function detectEnvironment() {
  if (process.env.CI === 'true') {return 'ci';}
  if (process.env.NODE_ENV === 'production') {return 'production';}
  if (process.env.NODE_ENV === 'test') {return 'testing';}
  return 'development';
}

// Configuration validation
export function validateConfig() {
  const errors = [];

  if (config.timeouts.testTimeout < 1000) {
    errors.push('testTimeout must be at least 1000ms');
  }

  if (config.browser.viewport.width < 320) {
    errors.push('viewport width must be at least 320px');
  }

  if (config.selectors.cache.maxSize < 10) {
    errors.push('cache maxSize must be at least 10');
  }

  return errors;
}

// Export current environment for reference
export { environment };
