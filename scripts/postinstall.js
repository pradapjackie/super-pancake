#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if we're in a user's project (not the package itself)
const isUserProject = !process.cwd().includes('node_modules/super-pancake-automation');

if (isUserProject) {
  const configPath = path.join(process.cwd(), 'super-pancake.config.js');

  // Only create if it doesn't exist
  if (!fs.existsSync(configPath)) {
    const defaultConfig = `// Super Pancake Framework Configuration
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
`;

    try {
      fs.writeFileSync(configPath, defaultConfig, 'utf-8');
      console.log('🥞 Super Pancake: Created default configuration file: super-pancake.config.js');
      console.log('   You can customize this file to match your testing needs.');
    } catch (error) {
      console.warn('🥞 Super Pancake: Could not create config file:', error.message);
    }
  } else {
    console.log('🥞 Super Pancake: Configuration file already exists, skipping creation.');
  }

  // Create tests directory if it doesn't exist
  const testsDir = path.join(process.cwd(), 'tests');
  if (!fs.existsSync(testsDir)) {
    try {
      fs.mkdirSync(testsDir, { recursive: true });
      console.log('🥞 Super Pancake: Created tests directory');
    } catch (error) {
      console.warn('🥞 Super Pancake: Could not create tests directory:', error.message);
    }
  }

  // Create screenshots directory
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    try {
      fs.mkdirSync(screenshotsDir, { recursive: true });
      console.log('🥞 Super Pancake: Created screenshots directory');
    } catch (error) {
      console.warn('🥞 Super Pancake: Could not create screenshots directory:', error.message);
    }
  }
}
