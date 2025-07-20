#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { createInterface } from 'readline';
import { spawn } from 'child_process';

const projectName = process.argv[2] || 'my-super-pancake-project';
const projectPath = resolve(projectName);

if (existsSync(projectPath)) {
  console.error(`❌ Directory '${projectName}' already exists!`);
  process.exit(1);
}

console.log(`🚀 Creating Super Pancake automation project: ${projectName}`);
console.log('');

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Helper function to ask multiple choice questions
function askChoice(question, options, defaultOption = 0) {
  return new Promise((resolve) => {
    console.log(question);
    options.forEach((option, index) => {
      const indicator = index === defaultOption ? '●' : '○';
      console.log(`  ${indicator} ${index + 1}. ${option}`);
    });
    console.log('');
    rl.question(`Enter your choice (1-${options.length}) [${defaultOption + 1}]: `, (answer) => {
      const choice = parseInt(answer) - 1;
      if (isNaN(choice) || choice < 0 || choice >= options.length) {
        resolve(defaultOption);
      } else {
        resolve(choice);
      }
    });
  });
}

// Collect user preferences
async function collectUserPreferences() {
  console.log('📝 Let\'s configure your project preferences:\n');
  
  // 1. Browser headless mode
  const headlessChoice = await askChoice(
    '1. Browser Mode:', 
    ['Headless (faster, no GUI)', 'Headed (visible browser window)'],
    1
  );
  
  // 2. Screenshot capture
  const screenshotChoice = await askChoice(
    '2. Screenshot Capture:', 
    ['Enabled (capture on failure and success)', 'Only on failure', 'Disabled'],
    0
  );
  
  // 3. Generate sample tests
  const samplesChoice = await askChoice(
    '3. Generate Sample Tests:', 
    ['Basic example test', 'Form testing examples', 'API testing examples', 'E2E workflow examples', 'All examples'],
    0
  );
  
  // 4. Test runner UI
  const uiChoice = await askChoice(
    '4. Test Runner UI:', 
    ['Interactive UI enabled', 'Command line only'],
    0
  );
  
  // 5. Report generation
  const reportChoice = await askChoice(
    '5. Test Reports:', 
    ['HTML reports with screenshots', 'JSON reports', 'Console output only'],
    0
  );
  
  console.log('\n✨ Creating project with your preferences...\n');
  
  return {
    headless: headlessChoice === 0,
    screenshots: screenshotChoice,
    samples: samplesChoice,
    ui: uiChoice === 0,
    reports: reportChoice
  };
}

// Function to install npm dependencies
function installDependencies(projectPath) {
  return new Promise((resolve, reject) => {
    console.log('   Running npm install...');
    
    const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const install = spawn(npmCommand, ['install'], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    install.stdout.on('data', (data) => {
      output += data.toString();
      // Show progress dots
      process.stdout.write('.');
    });

    install.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    install.on('close', (code) => {
      console.log(''); // New line after progress dots
      
      if (code === 0) {
        console.log('✅ Dependencies installed successfully!');
        resolve();
      } else {
        console.log('⚠️ Dependencies installation completed with warnings');
        console.log('   You can run "npm install" manually if needed');
        resolve(); // Don't fail the whole process
      }
    });

    install.on('error', (error) => {
      console.log(''); // New line after progress dots
      console.log('⚠️ Failed to auto-install dependencies');
      console.log('   Please run "npm install" manually in the project directory');
      console.log(`   Error: ${error.message}`);
      resolve(); // Don't fail the whole process
    });
  });
}

const preferences = await collectUserPreferences();
rl.close();

// Create project directory
mkdirSync(projectPath, { recursive: true });

// Create package.json
const packageJson = {
  name: projectName,
  version: '1.0.0',
  description: 'Super Pancake automation testing project',
  main: 'index.js',
  type: 'module',
  scripts: {
    test: 'node scripts/super-pancake-test.js',
    'test:run': 'vitest run',
    'test:ui': 'super-pancake-ui',
    'test:generate': 'super-pancake-generate',
    'test:tier1': 'npm test tests/tier1-*.test.js --run',
    'test:headed': 'HEADED=true npm test',
    'test:sequential': 'npm test --sequential',
    'test:quick': 'npm run test:unit-stable && npm run test:config',
    'test:stability': 'vitest run tests/stability-test-suite.test.js',
    start: 'npm test'
  },
  dependencies: {
    'super-pancake-automation': 'latest',
    'vitest': '^3.2.4'
  },
  keywords: ['automation', 'testing', 'super-pancake', 'sequential-testing', 'ci-cd'],
  author: '',
  license: 'MIT'
};

writeFileSync(join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));

// Create super-pancake.config.js based on user preferences
const screenshotConfig = {
  0: { enabled: true, onFailure: true, onSuccess: true },
  1: { enabled: true, onFailure: true, onSuccess: false },
  2: { enabled: false, onFailure: false, onSuccess: false }
};

const reportConfig = {
  0: { enabled: true, format: 'html', autoOpen: false },
  1: { enabled: true, format: 'json', autoOpen: false },
  2: { enabled: false, format: 'console', autoOpen: false }
};

const selectedScreenshot = screenshotConfig[preferences.screenshots];
const selectedReport = reportConfig[preferences.reports];

const configContent = `export default {
  // Browser configuration
  browser: {
    headless: process.env.HEADED !== 'true',
    devtools: ${!preferences.headless || 'process.env.DEBUG === \'true\''},
    slowMo: ${preferences.headless ? 0 : 100}
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
  
  // Test configuration  
  test: {
    timeout: 30000,
    retries: 1
  },
  
  // Screenshot configuration
  screenshot: {
    enabled: ${selectedScreenshot.enabled},
    path: './screenshots',
    onFailure: ${selectedScreenshot.onFailure},
    onSuccess: ${selectedScreenshot.onSuccess},
    quality: 90,
    fullPage: true
  },
  
  // Report configuration
  report: {
    enabled: ${selectedReport.enabled},
    format: '${selectedReport.format}',
    path: './test-report.${selectedReport.format === 'html' ? 'html' : 'json'}',
    autoOpen: ${selectedReport.autoOpen}
  },
  
  // UI configuration
  ui: {
    enabled: ${preferences.ui},
    port: 3000
  },
  
  // Logging configuration
  logging: {
    console: true,
    network: false,
    level: 'info'
  },
  
  // Timeouts
  timeouts: {
    testTimeout: 30000,
    pageTimeout: 30000,
    elementTimeout: 10000
  }
};`;

writeFileSync(join(projectPath, 'super-pancake.config.js'), configContent);

// Create directories
mkdirSync(join(projectPath, 'tests'), { recursive: true });
mkdirSync(join(projectPath, 'screenshots'), { recursive: true });
mkdirSync(join(projectPath, 'scripts'), { recursive: true });
mkdirSync(join(projectPath, 'utils'), { recursive: true });

// Create the custom Super Pancake test runner
const testRunnerContent = `#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

// Load Super Pancake configuration
function loadSuperPancakeConfig() {
  try {
    const configPath = resolve('super-pancake.config.js');
    const configModule = await import('file://' + configPath);
    return configModule.default;
  } catch (error) {
    console.warn('⚠️ No super-pancake.config.js found, using defaults');
    return {
      execution: {
        sequential: true,
        vitest: {
          pool: 'forks',
          poolOptions: { forks: { singleFork: true } },
          fileParallelism: false,
          sequence: { concurrent: false, shuffle: false },
          bail: 1,
          retry: 1
        }
      }
    };
  }
}

// Build Vitest arguments from Super Pancake config
function buildVitestArgs(config, userArgs) {
  const args = [];
  
  if (config.execution?.sequential) {
    args.push('--pool=forks');
    args.push('--poolOptions.forks.singleFork=true');
    args.push('--fileParallelism=false');
    args.push('--sequence.concurrent=false');
    args.push('--sequence.shuffle=false');
  }
  
  if (config.execution?.vitest?.bail) {
    args.push(\`--bail=\${config.execution.vitest.bail}\`);
  }
  
  if (config.execution?.vitest?.retry) {
    args.push(\`--retry=\${config.execution.vitest.retry}\`);
  }
  
  // Add user arguments
  args.push(...userArgs);
  
  return args;
}

// Run tests with Super Pancake configuration
async function runTests() {
  console.log('🥞 Super Pancake Test Runner');
  console.log('📋 Loading configuration from super-pancake.config.js...');
  
  const config = await loadSuperPancakeConfig();
  const userArgs = process.argv.slice(2);
  const vitestArgs = buildVitestArgs(config, userArgs);
  
  console.log('⚡ Running tests with sequential execution...');
  console.log(\`📝 Command: vitest \${vitestArgs.join(' ')}\`);
  
  const vitestProcess = spawn('npx', ['vitest', ...vitestArgs], {
    stdio: 'inherit',
    shell: true
  });
  
  vitestProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('✅ All tests completed successfully!');
    } else {
      console.log(\`❌ Tests failed with exit code \${code}\`);
    }
    process.exit(code);
  });
  
  vitestProcess.on('error', (error) => {
    console.error('❌ Failed to start test runner:', error.message);
    process.exit(1);
  });
}

runTests().catch(error => {
  console.error('❌ Test runner error:', error.message);
  process.exit(1);
});
`;

writeFileSync(join(projectPath, 'scripts', 'super-pancake-test.js'), testRunnerContent);

// Create test setup utility
const testSetupContent = `// Test Setup Utility for ${projectName}
// Provides automatic Chrome launch, session creation, and cleanup

import { launchChrome } from 'super-pancake-automation/utils/simple-launcher.js';
import { connectToChrome, closeConnection } from 'super-pancake-automation/core/simple-browser.js';
import { createSession } from 'super-pancake-automation/core/simple-session.js';
import { setSession, clearSession } from 'super-pancake-automation/core/session-context.js';

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

  console.log('🚀 Starting ' + testName + '...');
  
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
    
    console.log('🎯 ' + testName + ' setup completed successfully');
    
    return { chrome, ws, session };
    
  } catch (error) {
    console.error('❌ ' + testName + ' setup failed:', error);
    throw error;
  }
}

/**
 * Cleans up test environment
 * @param {Object} environment - Environment object from createTestEnvironment
 * @param {string} testName - Name for logging
 */
export async function cleanupTestEnvironment(environment, testName = 'Test') {
  console.log('🧹 Cleaning up ' + testName + '...');
  
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
    console.log('🎯 ' + testName + ' cleanup completed');
  } catch (error) {
    console.warn('⚠️ ' + testName + ' cleanup warning:', error.message);
  }
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
`;

writeFileSync(join(projectPath, 'utils', 'test-setup.js'), testSetupContent);

// Generate sample tests based on user preferences
function generateSampleTests(projectName, preferences) {

  const sampleTests = {
    0: { // Basic example test
      filename: 'basic.test.js',
      content: `// Basic Super Pancake Automation Examples
// Real browser automation using the sessionless API
// These tests demonstrate modern Super Pancake patterns

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestEnvironment, cleanupTestEnvironment } from './utils/test-setup.js';
import {
  enableDOM,
  navigateTo,
  getByText,
  getByRole,
  fillInput,
  click,
  takeScreenshot,
  getText,
  waitForText
} from 'super-pancake-automation/core/simple-dom-v2.js';

let testEnv;

describe('${projectName} Basic Tests', () => {
  
  beforeAll(async () => {
    console.log('🚀 Setting up ${projectName} test environment...');
    testEnv = await createTestEnvironment({ 
      headed: ${!preferences.headless},
      testName: '${projectName} Basic Tests'
    });
    await enableDOM();
  }, 30000);

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv, '${projectName} Basic Tests');
  });
  
  it('should navigate to Example.com and verify content', async () => {
    console.log('🌐 Testing navigation and content verification...');
    
    // Navigate to example website
    await navigateTo('https://example.com');
    
    // Verify page title using smart locator
    const heading = await getByText('Example Domain');
    expect(heading).toBeTruthy();
    
    // Get heading text and verify
    const headingText = await getText(heading);
    expect(headingText).toContain('Example Domain');
    
    console.log('✅ Navigation and content verification completed');
  });

  it('should demonstrate smart locators', async () => {
    console.log('🎯 Testing smart locators...');
    
    await navigateTo('https://example.com');
    
    // Find link using smart locator
    const moreInfoLink = await getByText('More information...');
    expect(moreInfoLink).toBeTruthy();
    
    // Verify link is present
    const linkText = await getText(moreInfoLink);
    expect(linkText).toBe('More information...');
    
    console.log('✅ Smart locators test completed');
  });

  it('should take screenshots', async () => {
    console.log('📸 Testing screenshot capture...');
    
    await navigateTo('https://example.com');
    
    // Take full page screenshot
    await takeScreenshot('./screenshots/${projectName}-example.png');
    
    console.log('✅ Screenshot captured successfully');
  });

  it('should wait for dynamic content', async () => {
    console.log('⏳ Testing wait strategies...');
    
    await navigateTo('https://example.com');
    
    // Wait for specific text to appear
    await waitForText('Example Domain');
    
    // Verify the text is now visible
    const content = await getByText('This domain is for use in illustrative examples');
    expect(content).toBeTruthy();
    
    console.log('✅ Wait strategies test completed');
  });
});`
    },
    1: { // Form testing examples
      filename: 'form.test.js',
      content: `// Form Testing Examples
// Real form automation using Super Pancake sessionless API
// Perfect for learning form automation patterns

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestEnvironment, cleanupTestEnvironment } from './utils/test-setup.js';
import {
  enableDOM,
  navigateTo,
  getByLabel,
  getByRole,
  getByPlaceholder,
  fillInput,
  click,
  check,
  selectOption,
  isChecked,
  getValue,
  takeScreenshot,
  waitForText
} from 'super-pancake-automation/core/simple-dom-v2.js';

let testEnv;

describe('${projectName} Form Tests', () => {
  
  beforeAll(async () => {
    console.log('🚀 Setting up ${projectName} form test environment...');
    testEnv = await createTestEnvironment({ 
      headed: ${!preferences.headless},
      testName: '${projectName} Form Tests'
    });
    await enableDOM();
  }, 30000);

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv, '${projectName} Form Tests');
  });

  it('should fill and submit a contact form', async () => {
    console.log('📝 Testing contact form automation...');
    
    // Navigate to a demo form (you can replace with your own form URL)
    await navigateTo('https://www.selenium.dev/selenium/web/web-form.html');
    
    // Fill form using smart locators
    await fillInput(getByLabel('Text input'), 'John Doe');
    await fillInput(getByLabel('Password'), 'SecurePassword123');
    await fillInput(getByLabel('Textarea'), 'This is a test message for ${projectName}');
    
    // Select dropdown option
    await selectOption(getByLabel('Dropdown (select)'), '2');
    
    // Check a checkbox
    await check(getByLabel('Default checkbox'));
    
    // Verify form state
    const nameValue = await getValue(getByLabel('Text input'));
    expect(nameValue).toBe('John Doe');
    
    const isCheckboxChecked = await isChecked(getByLabel('Default checkbox'));
    expect(isCheckboxChecked).toBe(true);
    
    // Take screenshot before submit
    await takeScreenshot('./screenshots/${projectName}-form-before-submit.png');
    
    // Submit form
    await click(getByRole('button', { name: 'Submit' }));
    
    // Wait for success message
    await waitForText('Received!');
    
    console.log('✅ Form submission completed successfully');
  });

  it('should test form validation patterns', async () => {
    console.log('✅ Testing form validation...');
    
    await navigateTo('https://www.selenium.dev/selenium/web/web-form.html');
    
    // Test required field validation by leaving field empty
    await click(getByRole('button', { name: 'Submit' }));
    
    // Fill form with valid data
    await fillInput(getByLabel('Text input'), 'Jane Smith');
    await fillInput(getByLabel('Password'), 'ValidPass123');
    
    // Verify the form accepts valid input
    const inputValue = await getValue(getByLabel('Text input'));
    expect(inputValue).toBe('Jane Smith');
    
    console.log('✅ Form validation patterns tested');
  });

  it('should test form validation', async () => {
    console.log('✅ Simulating form validation testing...');
    
    // Simulate form fields with validation rules
    const formFields = {
      username: {
        value: 'testuser123',
        rules: { required: true, minLength: 3, maxLength: 20 },
        errors: []
      },
      email: {
        value: 'test@${projectName}.com',
        rules: { required: true, pattern: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ },
        errors: []
      },
      password: {
        value: 'SecurePass123!',
        rules: { required: true, minLength: 8 },
        errors: []
      }
    };
    
    console.log('📝 Form validation testing:');
    
    Object.entries(formFields).forEach(([fieldName, field]) => {
      field.errors = [];
      
      // Run validation rules
      if (field.rules.required && !field.value) field.errors.push('Required');
      if (field.rules.minLength && field.value.length < field.rules.minLength) field.errors.push('Too short');
      if (field.rules.pattern && !field.rules.pattern.test(field.value)) field.errors.push('Invalid format');
      
      console.log(\`   \${field.errors.length === 0 ? '✅' : '❌'} \${fieldName}: \${field.value}\`);
    });
    
    const validationErrors = Object.values(formFields).reduce((total, field) => total + field.errors.length, 0);
    expect(validationErrors).toBe(0);
    
    console.log('✅ Form validation simulation completed');
  });
});`
    },
    2: { // API testing examples
      filename: 'api.test.js',
      content: `// API Testing Examples with Browser Integration
// Test APIs through browser interactions and network monitoring
// Perfect for learning API automation with Super Pancake

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestEnvironment, cleanupTestEnvironment } from './utils/test-setup.js';
import {
  enableDOM,
  navigateTo,
  enableNetworkInterception,
  waitForResponse,
  getNetworkRequests,
  click,
  getByRole,
  waitForText
} from 'super-pancake-automation/core/simple-dom-v2.js';

let testEnv;

describe('${projectName} API Tests', () => {
  
  beforeAll(async () => {
    console.log('🚀 Setting up ${projectName} API test environment...');
    testEnv = await createTestEnvironment({ 
      headed: ${!preferences.headless},
      testName: '${projectName} API Tests'
    });
    await enableDOM();
    await enableNetworkInterception();
  }, 30000);

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv, '${projectName} API Tests');
  });

  it('should intercept and validate API calls', async () => {
    console.log('🔌 Testing API interception...');
    
    // Navigate to a page that makes API calls
    await navigateTo('https://jsonplaceholder.typicode.com/');
    
    // Click on a link that triggers API calls
    await click(getByRole('link', { name: '/posts' }));
    
    // Wait for API response
    const response = await waitForResponse('*/posts');
    
    // Validate response
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    
    console.log('✅ API interception completed');
  });

  it('should monitor network requests', async () => {
    console.log('📊 Testing network monitoring...');
    
    await navigateTo('https://httpbin.org/');
    
    // Click on HTTP Methods section
    await click(getByRole('link', { name: 'HTTP Methods' }));
    
    // Get all captured network requests
    const requests = await getNetworkRequests();
    
    // Validate that we captured some requests
    expect(requests.length).toBeGreaterThan(0);
    
    // Find requests to httpbin.org
    const httpbinRequests = requests.filter(req => 
      req.url.includes('httpbin.org')
    );
    
    expect(httpbinRequests.length).toBeGreaterThan(0);
    
    console.log(\`✅ Captured \${requests.length} network requests\`);
  });

  it('should validate JSON schema patterns', async () => {
    console.log('📋 Simulating JSON schema validation...');
    
    // Simulate API response with expected schema
    const userApiResponse = {
      id: 123,
      username: 'testuser',
      email: 'test@${projectName}.com',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        avatar: 'https://example.com/avatar.jpg'
      },
      preferences: {
        theme: 'dark',
        notifications: true,
        language: 'en'
      },
      createdAt: '2024-01-01T00:00:00Z'
    };
    
    console.log('📊 Schema validation:');
    
    // Validate required fields
    const requiredFields = ['id', 'username', 'email', 'profile'];
    requiredFields.forEach(field => {
      const exists = userApiResponse.hasOwnProperty(field);
      console.log(\`   \${exists ? '✅' : '❌'} \${field}: \${exists ? 'present' : 'missing'}\`);
      expect(exists).toBe(true);
    });
    
    // Validate data types
    expect(typeof userApiResponse.id).toBe('number');
    expect(typeof userApiResponse.username).toBe('string');
    expect(typeof userApiResponse.profile).toBe('object');
    expect(Array.isArray(userApiResponse.preferences)).toBe(false);
    
    console.log('✅ JSON schema validation completed');
  });
});`
    },
    3: { // E2E workflow examples
      filename: 'e2e.test.js',
      content: `// End-to-End Testing Examples
// Complete user journeys using Super Pancake sessionless API
// Perfect for demonstrating complex automation scenarios

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestEnvironment, cleanupTestEnvironment } from './utils/test-setup.js';
import {
  enableDOM,
  navigateTo,
  getByLabel,
  getByRole,
  getByText,
  getByTestId,
  fillInput,
  click,
  check,
  selectOption,
  waitForText,
  takeScreenshot,
  getValue,
  isChecked,
  emulateDevice,
  setViewport
} from 'super-pancake-automation/core/simple-dom-v2.js';

let testEnv;

describe('${projectName} E2E Tests', () => {
  
  beforeAll(async () => {
    console.log('🚀 Setting up ${projectName} E2E test environment...');
    testEnv = await createTestEnvironment({ 
      headed: ${!preferences.headless},
      testName: '${projectName} E2E Tests'
    });
    await enableDOM();
  }, 30000);

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv, '${projectName} E2E Tests');
  });

  it('should complete a full user registration workflow', async () => {
    console.log('👤 Testing complete user registration...');
    
    // Navigate to registration page (using a demo form)
    await navigateTo('https://www.selenium.dev/selenium/web/web-form.html');
    
    // Fill registration form using smart locators
    await fillInput(getByLabel('Text input'), 'John Doe');
    await fillInput(getByLabel('Password'), 'SecurePass123!');
    await fillInput(getByLabel('Textarea'), 'User from ${projectName} automation test');
    
    // Select options and check terms
    await selectOption(getByLabel('Dropdown (select)'), '1');
    await check(getByLabel('Default checkbox'));
    
    // Take screenshot before submission
    await takeScreenshot('./screenshots/${projectName}-registration-form.png');
    
    // Verify form state before submission
    const nameValue = await getValue(getByLabel('Text input'));
    expect(nameValue).toBe('John Doe');
    
    const isTermsChecked = await isChecked(getByLabel('Default checkbox'));
    expect(isTermsChecked).toBe(true);
    
    // Submit registration
    await click(getByRole('button', { name: 'Submit' }));
    
    // Wait for success confirmation
    await waitForText('Received!');
    
    console.log('✅ Registration workflow completed successfully');
  });

  it('should test responsive design on mobile', async () => {
    console.log('📱 Testing mobile responsive design...');
    
    // Emulate iPhone device
    await emulateDevice('iPhone 12');
    
    // Navigate to responsive website
    await navigateTo('https://example.com');
    
    // Verify mobile layout
    const heading = await getByText('Example Domain');
    expect(heading).toBeTruthy();
    
    // Take mobile screenshot
    await takeScreenshot('./screenshots/${projectName}-mobile-view.png');
    
    // Switch to desktop view
    await setViewport(1920, 1080);
    await takeScreenshot('./screenshots/${projectName}-desktop-view.png');
    
    console.log('✅ Responsive design testing completed');
  });

  it('should test search functionality workflow', async () => {
    console.log('🔍 Testing search functionality...');
    
    // Simulate product catalog
    const products = [
      { id: 1, name: 'Widget A', price: 29.99, inStock: true },
      { id: 2, name: 'Gadget B', price: 49.99, inStock: true },
      { id: 3, name: 'Tool C', price: 19.99, inStock: false }
    ];
    
    // Simulate shopping cart actions
    const cart = [];
    
    console.log('📦 Available products:');
    products.forEach(product => {
      console.log(\`   \${product.inStock ? '✅' : '❌'} \${product.name} - $\${product.price} \${product.inStock ? '' : '(Out of Stock)'}\`);
    });
    
    // Add products to cart
    const availableProducts = products.filter(p => p.inStock);
    availableProducts.slice(0, 2).forEach(product => {
      cart.push({ ...product, quantity: 1 });
      console.log(\`🛒 Added to cart: \${product.name}\`);
    });
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    console.log(\`💰 Cart total: $\${total.toFixed(2)}\`);
    
    // Validate shopping workflow
    expect(cart.length).toBeGreaterThan(0);
    expect(total).toBeGreaterThan(0);
    expect(cart.every(item => item.inStock)).toBe(true);
    
    console.log('✅ Shopping cart simulation completed');
  });

  it('should test search and filter workflow', async () => {
    console.log('🔍 Simulating search and filter workflow...');
    
    // Simulate search functionality
    const searchQuery = '${projectName}';
    const filters = {
      category: 'automation',
      priceRange: { min: 0, max: 100 },
      rating: 4
    };
    
    console.log('🔍 Search query:', searchQuery);
    console.log('🎛️ Applied filters:');
    console.log(\`   Category: \${filters.category}\`);
    console.log(\`   Price: $\${filters.priceRange.min} - $\${filters.priceRange.max}\`);
    console.log(\`   Min rating: \${filters.rating} stars\`);
    
    // Simulate search results
    const searchResults = [
      { id: 1, title: '${projectName} Guide', category: 'automation', price: 29.99, rating: 4.5 },
      { id: 2, title: 'Advanced ${projectName}', category: 'automation', price: 49.99, rating: 4.8 },
      { id: 3, title: '${projectName} Toolkit', category: 'automation', price: 19.99, rating: 4.2 }
    ];
    
    // Apply filters to results
    const filteredResults = searchResults.filter(item => 
      item.category === filters.category &&
      item.price >= filters.priceRange.min &&
      item.price <= filters.priceRange.max &&
      item.rating >= filters.rating
    );
    
    console.log(\`📊 Found \\\${filteredResults.length} results:\`);
    filteredResults.forEach(result => {
      console.log(\`   ✅ \${result.title} - $\${result.price} (\${result.rating}⭐)\`);
    });
    
    // Validate search workflow
    expect(searchQuery).toBeTruthy();
    expect(filteredResults.length).toBeGreaterThan(0);
    expect(filteredResults.every(item => item.rating >= filters.rating)).toBe(true);
    
    console.log('✅ Search and filter simulation completed');
  });
});`
    }
  };

  // Generate tests based on user choice
  if (preferences.samples === 4) { // All examples
    Object.values(sampleTests).forEach(test => {
      writeFileSync(join(projectPath, 'tests', test.filename), test.content);
    });
  } else {
    const selectedTest = sampleTests[preferences.samples];
    writeFileSync(join(projectPath, 'tests', selectedTest.filename), selectedTest.content);
  }
}

// Generate sample tests
generateSampleTests(projectName, preferences);

// Create README
const readmeContent = `# ${projectName}

Super Pancake automation testing project with sequential execution and Chrome port conflict prevention.

## Quick Start

Dependencies are automatically installed during project creation.

## Usage

\`\`\`bash
# Run tests (sequential execution by default)
npm test

# Run specific test patterns
npm test tests/tier1-*.test.js --run

# Run tests with visible browser for debugging
npm run test:headed

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Environment variables
HEADED=true npm test    # Run with visible browser
DEBUG=true npm test     # Enable debug mode
\`\`\`

## Available Scripts

- \`npm test\` - Run tests with Super Pancake test runner (sequential)
- \`npm run test:tier1\` - Run TIER 1 core feature tests
- \`npm run test:headed\` - Run tests with visible browser
- \`npm run test:sequential\` - Force sequential execution
- \`npm run test:quick\` - Run quick unit and config tests
- \`npm run test:stability\` - Run stability test suite

## Features

- ✅ Sequential test execution (prevents Chrome port conflicts)
- 📸 Screenshot capture (including on failure) 
- 📊 HTML test reporting
- 🎯 Chrome DevTools Protocol
- 🔍 Advanced element selection and interaction
- 📱 Responsive test runner UI
- 🚀 Custom Super Pancake test runner
- 🔧 Environment variable support

## Configuration

Edit \`super-pancake.config.js\` to customize:
- Browser settings (headless/headed mode)
- Sequential execution settings
- Screenshot configuration  
- Test timeouts and retries
- Reporting options

### Sequential Execution

This project is configured for sequential test execution to prevent Chrome port conflicts:

\`\`\`javascript
execution: {
  sequential: true,
  vitest: {
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    fileParallelism: false,
    sequence: { concurrent: false, shuffle: false },
    bail: 1,
    retry: 1
  }
}
\`\`\`

## Project Structure

\`\`\`
${projectName}/
├── scripts/
│   └── super-pancake-test.js    # Custom test runner
├── tests/                       # Your test files
├── screenshots/                 # Auto-generated screenshots
├── super-pancake.config.js     # Main configuration
└── package.json                # Project dependencies
\`\`\`

## Documentation

Visit [Super Pancake Documentation](https://github.com/pradapjackie/super-pancake#readme) for more information.
`;

writeFileSync(join(projectPath, 'README.md'), readmeContent);

// Create .gitignore
const gitignoreContent = `node_modules/
test-report.html
test-report.json
screenshots/
*.log
.DS_Store
`;

writeFileSync(join(projectPath, '.gitignore'), gitignoreContent);

console.log(`✅ Successfully created ${projectName}!`);
console.log('');
console.log('📦 Installing dependencies...');

// Auto-install dependencies
await installDependencies(projectPath);

console.log('');
console.log('🚀 Next steps:');
console.log(`  cd ${projectName}`);
console.log('  npm test');
console.log('');

console.log('🎯 Key Features Enabled:');
console.log('  ✅ Sequential test execution (prevents Chrome port conflicts)');
console.log('  🚀 Custom Super Pancake test runner');
console.log('  🔧 Environment variable support (HEADED=true, DEBUG=true)');

// Dynamic success message based on preferences
if (preferences.screenshots !== 2) {
  console.log('📸 Screenshots will be saved to ./screenshots/');
}

if (preferences.reports === 0) {
  console.log('📊 HTML test reports will be generated as ./test-report.html');
} else if (preferences.reports === 1) {
  console.log('📊 JSON test reports will be generated as ./test-report.json');
}

if (preferences.ui) {
  console.log('🎯 Run "npx super-pancake-ui" for interactive testing');
}

console.log('⚡ Tests configured for sequential execution (headless by default)');
console.log('👀 Use "npm run test:headed" or "HEADED=true npm test" for visible browser');

const sampleTypes = ['Basic', 'Form testing', 'API testing', 'E2E workflow', 'All'];
console.log(`📝 Generated ${sampleTypes[preferences.samples]} sample tests`);

console.log('');
console.log('🛠️ Available Commands:');
console.log('  npm test                 # Run tests (sequential)');
console.log('  npm run test:headed      # Run with visible browser');
console.log('  npm run test:tier1       # Run TIER 1 core tests');
console.log('  npm run test:quick       # Run quick tests only');
console.log('  npm run test:ui          # Interactive test runner');

console.log('');
console.log('Happy testing! 🥞');