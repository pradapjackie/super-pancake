// Super Pancake Framework Configuration
// Generated automatically on install

export default {
  // Framework settings
  framework: "super-pancake",
  version: "1.0.0",
  
  // Test configuration
  testDir: "tests",
  
  // Browser settings
  browser: {
    name: "chrome",
    headless: true,
    viewport: {
      width: 1280,
      height: 720
    }
  },
  
  // Timeout settings (in milliseconds)
  timeouts: {
    testTimeout: 30000,
    navigationTimeout: 10000,
    elementTimeout: 5000
  },
  
  // Retry configuration
  retries: 2,
  
  // Reporter settings
  reporter: {
    html: {
      enabled: true,
      outputFile: "automationTestReport.html"
    },
    console: {
      enabled: true,
      verbose: false
    }
  },
  
  // Base URL for tests (optional)
  baseURL: "",
  
  // Test execution settings
  use: {
    trace: "off", // "on-first-retry" | "on" | "off"
    screenshot: "only-on-failure", // "always" | "only-on-failure" | "off"
    video: "retain-on-failure" // "always" | "retain-on-failure" | "off"
  },
  
  // Sequential test execution settings
  execution: {
    // Run tests sequentially to avoid Chrome port conflicts
    sequential: true,
    
    // Vitest-specific settings for sequential execution
    vitest: {
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      fileParallelism: false,
      sequence: {
        concurrent: false,
        shuffle: false,
      },
      bail: 1, // Stop on first failure
      retry: 1, // Retry failed tests once
    }
  },
  
  // Screenshots settings
  screenshots: {
    enabled: true,
    path: "screenshots",
    onFailure: true
  }
};
