#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { createInterface } from 'readline';

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
    test: 'vitest',
    'test:run': 'vitest run',
    'test:ui': 'super-pancake-ui',
    'test:generate': 'super-pancake-generate',
    start: 'vitest'
  },
  dependencies: {
    'super-pancake-automation': 'latest',
    'vitest': '^3.2.4'
  },
  keywords: ['automation', 'testing', 'super-pancake'],
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
    headless: ${preferences.headless},
    devtools: ${!preferences.headless},
    slowMo: ${preferences.headless ? 0 : 100}
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

// Generate sample tests based on user preferences
function generateSampleTests(projectName, preferences) {
  const headedValue = !preferences.headless; // headed is opposite of headless
  const screenshotCode = preferences.screenshots !== 2 ? 
    `      // Take screenshot\n      await takeElementScreenshot(session, 'h1', './screenshots/example-title.png');` : 
    `      // Screenshots disabled`;

  const sampleTests = {
    0: { // Basic example test
      filename: 'basic.test.js',
      content: `import { describe, it, beforeAll, afterAll } from 'vitest';
import { launchChrome } from 'super-pancake-automation/utils/launcher.js';
import { connectToChrome } from 'super-pancake-automation/core/browser.js';
import { createSession } from 'super-pancake-automation/core/session.js';
import {
  enableDOM,
  navigateTo,
  getText,
  waitForSelector,
  takeElementScreenshot
} from 'super-pancake-automation/core/dom.js';
import { assertContainsText } from 'super-pancake-automation/core/assert.js';
import { testWithReport } from 'super-pancake-automation/helpers/testWrapper.js';

let chrome, ws, session;

describe('${projectName} Basic Tests', () => {
  beforeAll(async () => {
    console.log('\\n🔷 Starting automation tests...');
    chrome = await launchChrome({ headed: ${headedValue} });
    ws = await connectToChrome();
    session = createSession(ws);
    await enableDOM(session);
  }, 30000);

  afterAll(async () => {
    if (ws) ws.close();
    if (chrome) await chrome.kill();
    console.log('\\n🧹 Test complete. Chrome closed.');
  });

  it('should navigate to example.com and verify title', async () => {
    await testWithReport('should navigate to example.com and verify title', async () => {
      await navigateTo(session, 'https://example.com');
      
      const title = await getText(session, await waitForSelector(session, 'h1'));
      assertContainsText(title, 'Example');
      
${screenshotCode}
      
      console.log('✅ Test passed: Title contains "Example"');
    }, session, import.meta.url);
  });
});`
    },
    1: { // Form testing examples
      filename: 'form.test.js',
      content: `import { describe, it, beforeAll, afterAll } from 'vitest';
import { launchChrome } from 'super-pancake-automation/utils/launcher.js';
import { connectToChrome } from 'super-pancake-automation/core/browser.js';
import { createSession } from 'super-pancake-automation/core/session.js';
import {
  enableDOM,
  navigateTo,
  click,
  type,
  waitForSelector,
  takeElementScreenshot
} from 'super-pancake-automation/core/dom.js';
import { testWithReport } from 'super-pancake-automation/helpers/testWrapper.js';

let chrome, ws, session;

describe('${projectName} Form Tests', () => {
  beforeAll(async () => {
    console.log('\\n🔷 Starting form automation tests...');
    chrome = await launchChrome({ headed: ${headedValue} });
    ws = await connectToChrome();
    session = createSession(ws);
    await enableDOM(session);
  }, 30000);

  afterAll(async () => {
    if (ws) ws.close();
    if (chrome) await chrome.kill();
    console.log('\\n🧹 Test complete. Chrome closed.');
  });

  it('should fill and submit a form', async () => {
    await testWithReport('should fill and submit a form', async () => {
      await navigateTo(session, 'https://httpbin.org/forms/post');
      
      // Fill form fields
      await type(session, await waitForSelector(session, 'input[name="custname"]'), 'Test User');
      await type(session, await waitForSelector(session, 'input[name="custtel"]'), '1234567890');
      await type(session, await waitForSelector(session, 'input[name="custemail"]'), 'test@example.com');
      
${screenshotCode.replace('h1', 'form')}
      
      console.log('✅ Test passed: Form filled successfully');
    }, session, import.meta.url);
  });
});`
    },
    2: { // API testing examples
      filename: 'api.test.js',
      content: `import { describe, it, beforeAll, afterAll } from 'vitest';
import { launchChrome } from 'super-pancake-automation/utils/launcher.js';
import { connectToChrome } from 'super-pancake-automation/core/browser.js';
import { createSession } from 'super-pancake-automation/core/session.js';
import {
  enableDOM,
  navigateTo,
  getText,
  waitForSelector,
  takeElementScreenshot
} from 'super-pancake-automation/core/dom.js';
import { assertContainsText } from 'super-pancake-automation/core/assert.js';
import { testWithReport } from 'super-pancake-automation/helpers/testWrapper.js';

let chrome, ws, session;

describe('${projectName} API Tests', () => {
  beforeAll(async () => {
    console.log('\\n🔷 Starting API automation tests...');
    chrome = await launchChrome({ headed: ${headedValue} });
    ws = await connectToChrome();
    session = createSession(ws);
    await enableDOM(session);
  }, 30000);

  afterAll(async () => {
    if (ws) ws.close();
    if (chrome) await chrome.kill();
    console.log('\\n🧹 Test complete. Chrome closed.');
  });

  it('should test JSONPlaceholder API response', async () => {
    await testWithReport('should test JSONPlaceholder API response', async () => {
      await navigateTo(session, 'https://jsonplaceholder.typicode.com/posts/1');
      
      const response = await waitForSelector(session, 'pre');
      const responseText = await getText(session, response);
      assertContainsText(responseText, '"userId": 1');
      
${screenshotCode.replace('h1', 'pre')}
      
      console.log('✅ Test passed: API response verified');
    }, session, import.meta.url);
  });
});`
    },
    3: { // E2E workflow examples
      filename: 'e2e.test.js',
      content: `import { describe, it, beforeAll, afterAll } from 'vitest';
import { launchChrome } from 'super-pancake-automation/utils/launcher.js';
import { connectToChrome } from 'super-pancake-automation/core/browser.js';
import { createSession } from 'super-pancake-automation/core/session.js';
import {
  enableDOM,
  navigateTo,
  click,
  type,
  getText,
  waitForSelector,
  takeElementScreenshot
} from 'super-pancake-automation/core/dom.js';
import { assertContainsText } from 'super-pancake-automation/core/assert.js';
import { testWithReport } from 'super-pancake-automation/helpers/testWrapper.js';

let chrome, ws, session;

describe('${projectName} E2E Tests', () => {
  beforeAll(async () => {
    console.log('\\n🔷 Starting E2E automation tests...');
    chrome = await launchChrome({ headed: ${headedValue} });
    ws = await connectToChrome();
    session = createSession(ws);
    await enableDOM(session);
  }, 30000);

  afterAll(async () => {
    if (ws) ws.close();
    if (chrome) await chrome.kill();
    console.log('\\n🧹 Test complete. Chrome closed.');
  });

  it('should perform complete user workflow', async () => {
    await testWithReport('should perform complete user workflow', async () => {
      // Navigate to search page
      await navigateTo(session, 'https://duckduckgo.com');
      
      // Search for something
      await type(session, await waitForSelector(session, 'input[name="q"]'), 'super pancake automation');
      await click(session, await waitForSelector(session, 'button[type="submit"]'));
      
      // Wait for results
      await waitForSelector(session, 'h3');
      
${screenshotCode.replace('h1', 'h3')}
      
      console.log('✅ Test passed: E2E workflow completed');
    }, session, import.meta.url);
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

Super Pancake automation testing project

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
# Run tests
npm test

# Run tests once
npm run test:run

# Run with UI
npm run test:ui
\`\`\`

## Features

- ✅ Screenshot capture (including on failure)
- 📊 HTML test reporting
- 🎯 Chrome DevTools Protocol
- 🔍 Element selection and interaction
- 📱 Responsive test runner UI

## Configuration

Edit \`super-pancake.config.js\` to customize browser settings, screenshots, and reporting.

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
console.log('🚀 Next steps:');
console.log(`  cd ${projectName}`);
console.log('  npm install');
// console.log('  npm test');
console.log('');

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

if (preferences.headless) {
  console.log('⚡ Tests will run in headless mode for faster execution');
} else {
  console.log('👀 Tests will run with visible browser windows');
}

const sampleTypes = ['Basic', 'Form testing', 'API testing', 'E2E workflow', 'All'];
console.log(`📝 Generated ${sampleTypes[preferences.samples]} sample tests`);

console.log('');
console.log('Happy testing! 🥞');