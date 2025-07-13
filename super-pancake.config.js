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
  
  // Screenshots settings
  screenshots: {
    enabled: true,
    path: "screenshots",
    onFailure: true
  }
};
