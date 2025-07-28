#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs';
import path, { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { spawn } from 'child_process';
import { createRequire } from 'module';

// ES module equivalents for __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
const currentPackageJson = require('../package.json');

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

  // 3. Sample tests (always generate proven working examples)
  console.log('3. Sample Tests: Will generate proven working examples (sample.test.js + ui-website.test.js)');

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
    test: 'vitest run',
    'test:run': 'vitest run',
    'test:ui': 'vitest --ui',
    'test:watch': 'vitest watch',
    'test:sample': 'vitest run tests/sample.test.js',
    'test:website': 'vitest run tests/ui-website.test.js',
    'test:api': 'vitest run tests/api.test.js',
    'test:headed': 'HEADED=true vitest run',
    'test:debug': 'DEBUG=true vitest run',
    start: 'npm test'
  },
  dependencies: {
    'super-pancake-automation': '^' + currentPackageJson.version,
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
  // Project configuration
  projectName: '${projectName}',
  headless: ${preferences.headless},
  
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

import {
  launchChrome,
  connectToChrome,
  closeConnection,
  createSession,
  setSession,
  clearSession
} from 'super-pancake-automation';

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


// Copy test files from templates
function copyTestFiles() {
  console.log('📋 Copying test template files...');
  
  const templateDir = path.join(path.dirname(__dirname), 'templates', 'tests');
  
  // Copy test files
  const testFiles = ['api.test.js', 'sample.test.js', 'ui-website.test.js'];
  
  testFiles.forEach(testFile => {
    const sourcePath = path.join(templateDir, testFile);
    const targetPath = path.join(projectPath, 'tests', testFile);
    
    try {
      copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied ${testFile}`);
    } catch (error) {
      console.error(`❌ Failed to copy ${testFile}:`, error.message);
      // Fallback: create empty test file
      writeFileSync(targetPath, `// Test file ${testFile} - Add your tests here\n`);
    }
  });
}

copyTestFiles();

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

- \`npm test\` - Run all tests with Super Pancake test runner (sequential)
- \`npm run test:sample\` - Run basic UI functionality test
- \`npm run test:website\` - Run website UI test
- \`npm run test:api\` - Run API testing examples
- \`npm run test:headed\` - Run tests with visible browser
- \`npm run test:ui\` - Run tests with Vitest UI interface

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
  console.log('🎯 Run "npm run test:ui" for interactive testing with Vitest UI');
}

console.log('⚡ Tests configured for sequential execution (headless by default)');
console.log('👀 Use "npm run test:headed" or "HEADED=true npm test" for visible browser');

console.log('📝 Generated proven working sample tests (sample.test.js + ui-website.test.js + api.test.js)');

console.log('');
console.log('🛠️ Available Commands:');
console.log('  npm test                 # Run all tests');
console.log('  npx super-pancake-ui     # Super Pancake UI interface');

console.log('');
console.log('Happy testing! 🥞');
