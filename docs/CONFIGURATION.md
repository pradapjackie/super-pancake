# 🔧 Configuration Guide

The Super Pancake Automation Framework provides a comprehensive, environment-aware configuration system that automatically adapts to different deployment scenarios.

## Quick Start

The framework automatically detects your environment and applies appropriate settings:

```javascript
import { config, getConfig, isDevelopment } from './config.js';

// Get the full configuration
console.log(config);

// Get specific configuration values
const headless = getConfig('browser.headless');
const timeout = getConfig('timeouts.testTimeout');

// Check environment
if (isDevelopment()) {
  console.log('Running in development mode');
}
```

## Environment Detection

The framework automatically detects your environment using the following priority:

1. `PANCAKE_ENV` environment variable
2. `NODE_ENV` environment variable  
3. `process.env.CI` for CI detection
4. Defaults to `development`

```bash
# Set environment explicitly
export PANCAKE_ENV=production
export NODE_ENV=testing

# CI environments are auto-detected
export CI=true
```

## Environment Profiles

### 🛠️ Development Environment

**When**: `NODE_ENV=development` or no environment set

**Optimized for**: Debugging and development

```javascript
{
  browser: {
    headless: false,        // Browser window visible
    devtools: true,         // DevTools open automatically
    slowMo: 100            // Slow down for observation
  },
  timeouts: {
    testTimeout: 120000     // Longer timeout for debugging
  },
  screenshots: {
    onStep: true           // Screenshot each step
  },
  logging: {
    level: 'debug',        // Verbose logging
    verbose: true
  }
}
```

### 🧪 Testing Environment

**When**: `NODE_ENV=testing`

**Optimized for**: Automated testing

```javascript
{
  browser: {
    headless: true,        // Run headless
    args: [...baseArgs, '--disable-gpu']
  },
  screenshots: {
    onFailure: true,       // Only on failures
    onStep: false
  },
  performance: {
    monitoring: {
      enabled: true        // Monitor resources
    }
  }
}
```

### 🚀 Production Environment

**When**: `NODE_ENV=production`

**Optimized for**: Performance and security

```javascript
{
  browser: {
    headless: true,
    args: [...baseArgs, '--disable-gpu', '--no-zygote']
  },
  timeouts: {
    testTimeout: 30000,    // Shorter timeouts
    navigation: 20000
  },
  logging: {
    level: 'warn',         // Minimal logging
    file: 'logs/automation.log'
  },
  security: {
    strictValidation: true,
    restrictFileAccess: true
  }
}
```

### 🔄 CI/CD Environment

**When**: `PANCAKE_ENV=ci` or `CI=true`

**Optimized for**: CI/CD pipelines

```javascript
{
  browser: {
    headless: true,
    args: [
      ...baseArgs,
      '--disable-gpu',
      '--no-zygote', 
      '--single-process',  // Better for CI
      '--memory-pressure-off'
    ]
  },
  timeouts: {
    launchTimeout: 60000   // Longer browser launch timeout
  },
  performance: {
    maxMemoryUsage: 256,   // Conservative memory limit
    parallel: {
      enabled: true,
      maxWorkers: 2        // Conservative for CI
    }
  },
  reporting: {
    formats: ['html', 'json', 'junit']  // Include JUnit for CI
  }
}
```

## Configuration Sections

### 🌐 Browser Configuration

Control browser behavior and launch options:

```javascript
{
  browser: {
    type: 'chrome',                    // Browser type
    headless: true,                    // Headless mode
    port: 9222,                        // DevTools port
    
    // Chrome arguments
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      // ... more args
    ],
    
    // Viewport settings
    viewport: {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1
    },
    
    // Optional paths
    executablePath: null,              // Auto-detect Chrome
    userDataDir: null,                 // Use temporary directory
    
    // Development options
    devtools: false,                   // Open DevTools
    slowMo: 0,                         // Slow down operations
    launchTimeout: 30000               // Browser launch timeout
  }
}
```

### ⏱️ Timeout Configuration

Set timeouts for different operations:

```javascript
{
  timeouts: {
    // Element interactions
    waitForSelector: 5000,             // Wait for element
    waitForVisible: 5000,              // Wait for visibility
    waitForHidden: 5000,               // Wait for hidden
    waitForEnabled: 5000,              // Wait for enabled
    waitForClickable: 5000,            // Wait for clickable
    
    // Page operations
    navigation: 30000,                 // Page navigation
    reload: 10000,                     // Page reload
    actionTimeout: 10000,              // Individual actions
    
    // Test execution
    testTimeout: 60000,                // Single test
    suiteTimeout: 300000,              // Full test suite
    
    // Network
    requestTimeout: 30000,             // Request timeout
    responseTimeout: 30000             // Response timeout
  }
}
```

### 🎯 Element Query Settings

Configure element selection and caching:

```javascript
{
  selectors: {
    pollInterval: 100,                 // Polling interval (ms)
    retryAttempts: 3,                  // Retry failed operations
    strictMode: false,                 // Error on multiple matches
    
    cache: {
      enabled: true,                   // Enable caching
      ttl: 30000,                      // Cache lifetime (30s)
      maxSize: 100                     // Max cache entries
    }
  }
}
```

### 📸 Screenshot Configuration

Control when and how screenshots are taken:

```javascript
{
  screenshots: {
    onFailure: true,                   // Screenshot on test failure
    onStep: false,                     // Screenshot each step
    quality: 80,                       // JPEG quality (1-100)
    fullPage: false,                   // Full page vs viewport
    directory: 'test-report/screenshots',
    
    format: 'png',                     // 'png' or 'jpeg'
    prefix: 'test',                    // File prefix
    timestamp: true                    // Include timestamp
  }
}
```

### 📊 Reporting Configuration

Configure test reporting formats and options:

```javascript
{
  reporting: {
    directory: 'test-report',
    formats: ['html', 'json'],         // Report formats
    
    html: {
      theme: 'default',                // 'default', 'dark', 'minimal'
      includeScreenshots: true,
      includeStack: true,
      includeTimeline: true
    },
    
    json: {
      pretty: true,                    // Pretty-print JSON
      includeMetadata: true
    },
    
    console: {
      verbose: false,                  // Detailed output
      colors: true,                    // Colored output
      progress: true                   // Progress indicators
    }
  }
}
```

### ⚡ Performance Settings

Optimize performance and resource usage:

```javascript
{
  performance: {
    // Memory management
    maxMemoryUsage: 512,               // MB - warn if exceeded
    garbageCollection: true,           // Force GC after tests
    
    // Parallel execution
    parallel: {
      enabled: false,                  // Enable parallel tests
      maxWorkers: 4,                   // Maximum workers
      workerTimeout: 120000            // Worker timeout
    },
    
    // Resource monitoring
    monitoring: {
      enabled: false,                  // Monitor resources
      interval: 5000,                  // Monitor every 5s
      logToFile: false                 // Log to file
    }
  }
}
```

### 🌐 Network Configuration

Configure network behavior and proxies:

```javascript
{
  network: {
    interceptRequests: false,          // Intercept requests
    blockResources: [],                // Block: ['image', 'stylesheet']
    
    proxy: {
      enabled: false,
      server: null,                    // 'http://proxy:8080'
      username: null,
      password: null
    },
    
    headers: {},                       // Global headers
    userAgent: null                    // Custom user agent
  }
}
```

### 🔒 Security Configuration

Configure security and validation settings:

```javascript
{
  security: {
    strictValidation: true,            // Strict input validation
    sanitizeInputs: true,              // Sanitize inputs
    allowEval: false,                  // Allow eval() usage
    maxExecutionTime: 30000,           // Max operation time
    restrictFileAccess: true,          // Restrict file access
    allowedPaths: []                   // Allowed file paths
  }
}
```

### 📝 Logging Configuration

Control logging behavior and output:

```javascript
{
  logging: {
    level: 'info',                     // Log level
    file: null,                        // Log file (null = console)
    
    timestamp: true,                   // Include timestamps
    colors: true,                      // Colored logs
    structured: false,                 // JSON logging
    
    // Component-specific logging
    components: {
      browser: 'info',
      dom: 'info', 
      api: 'info',
      cache: 'warn',
      security: 'info'
    }
  }
}
```

## Configuration Utilities

### Reading Configuration

```javascript
import { config, getConfig } from './config.js';

// Get full config
console.log(config);

// Get nested values
const headless = getConfig('browser.headless');
const timeout = getConfig('timeouts.testTimeout');

// Safe access (returns undefined if path doesn't exist)
const customValue = getConfig('custom.nonexistent.value');
```

### Updating Configuration

```javascript
import { updateConfig } from './config.js';

// Update runtime configuration
updateConfig('browser.headless', false);
updateConfig('timeouts.testTimeout', 120000);
updateConfig('logging.level', 'debug');
```

### Environment Detection

```javascript
import { 
  environment, 
  isDevelopment, 
  isProduction, 
  isCI, 
  detectEnvironment 
} from './config.js';

// Current environment
console.log(`Running in: ${environment}`);

// Environment checks
if (isDevelopment()) {
  console.log('Development mode active');
}

if (isProduction()) {
  console.log('Production optimizations enabled');
}

if (isCI()) {
  console.log('CI/CD environment detected');
}

// Manual detection
const detectedEnv = detectEnvironment();
```

### Configuration Validation

```javascript
import { validateConfig } from './config.js';

// Validate current configuration
const errors = validateConfig();

if (errors.length > 0) {
  console.error('Configuration errors:', errors);
} else {
  console.log('Configuration is valid');
}
```

## Common Configuration Examples

### Local Development Setup

```bash
# .env or shell
export PANCAKE_ENV=development
export DEBUG=true
```

```javascript
// Custom development config
updateConfig('browser.headless', false);
updateConfig('browser.slowMo', 500);
updateConfig('screenshots.onStep', true);
updateConfig('logging.level', 'debug');
```

### CI/CD Pipeline Setup

```yaml
# GitHub Actions
env:
  PANCAKE_ENV: ci
  CI: true
  
# Docker
ENV PANCAKE_ENV=ci
ENV NODE_ENV=production
```

### Production Deployment

```bash
# Production environment
export NODE_ENV=production
export PANCAKE_ENV=production

# Custom settings
export PANCAKE_LOG_FILE=/var/log/automation.log
export PANCAKE_MAX_WORKERS=8
```

### Testing Environment

```javascript
// Jest/Vitest setup
beforeAll(() => {
  updateConfig('browser.headless', true);
  updateConfig('timeouts.testTimeout', 30000);
  updateConfig('screenshots.onFailure', true);
});
```

## Advanced Configuration

### Custom Environment

```javascript
// Add custom environment config
const customConfig = {
  browser: {
    headless: true,
    args: ['--custom-flag']
  },
  timeouts: {
    testTimeout: 45000
  }
};

// Merge with base config
const mergedConfig = deepMerge(config, customConfig);
```

### Dynamic Configuration

```javascript
// Runtime configuration based on conditions
if (process.platform === 'win32') {
  updateConfig('browser.args', [
    ...getConfig('browser.args'),
    '--disable-gpu-sandbox'
  ]);
}

// Memory-based adjustments
const totalMemory = os.totalmem() / 1024 / 1024 / 1024; // GB
if (totalMemory < 4) {
  updateConfig('performance.maxMemoryUsage', 256);
  updateConfig('performance.parallel.enabled', false);
}
```

### Environment-Specific Overrides

```javascript
// config.local.js (git-ignored)
export const localOverrides = {
  browser: {
    executablePath: '/path/to/custom/chrome'
  },
  logging: {
    level: 'trace'
  }
};

// Apply in main config
import { localOverrides } from './config.local.js';
const finalConfig = deepMerge(config, localOverrides);
```

## Troubleshooting

### Common Issues

**Browser won't launch:**
```javascript
// Try different executable path
updateConfig('browser.executablePath', '/usr/bin/google-chrome');

// Increase launch timeout
updateConfig('browser.launchTimeout', 60000);

// Add compatibility flags
updateConfig('browser.args', [
  ...getConfig('browser.args'),
  '--no-sandbox',
  '--disable-dev-shm-usage'
]);
```

**Tests timing out:**
```javascript
// Increase timeouts
updateConfig('timeouts.testTimeout', 120000);
updateConfig('timeouts.navigation', 60000);

// Disable slowMo
updateConfig('browser.slowMo', 0);
```

**Memory issues:**
```javascript
// Reduce memory usage
updateConfig('performance.maxMemoryUsage', 256);
updateConfig('performance.garbageCollection', true);
updateConfig('selectors.cache.maxSize', 50);
```

### Debug Configuration

```javascript
// Enable debug mode
updateConfig('development.debug', true);
updateConfig('logging.level', 'debug');
updateConfig('logging.components.browser', 'trace');

// Validate configuration
const errors = validateConfig();
console.log('Config errors:', errors);

// Inspect current config
console.log('Current config:', JSON.stringify(config, null, 2));
```

## Best Practices

### 1. Environment Separation
- Use different configs for dev/test/prod
- Never commit secrets in configuration
- Use environment variables for sensitive data

### 2. Performance Optimization
- Enable caching in production
- Use appropriate timeouts for your environment
- Monitor memory usage in long-running tests

### 3. Debugging
- Use non-headless mode for development
- Enable step screenshots for debugging
- Increase timeouts when debugging

### 4. CI/CD Integration
- Use conservative resource limits
- Enable structured logging
- Include JUnit reports for CI systems

### 5. Security
- Enable strict validation in production
- Restrict file access appropriately
- Use secure execution mode

---

## Configuration Reference

For a complete reference of all configuration options, see the [config.js](../config.js) file.

For environment-specific examples, check the `environmentConfigs` section in the configuration file.