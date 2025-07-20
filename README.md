# 🥞 Super Pancake Automation

[![npm version](https://badge.fury.io/js/super-pancake-automation.svg)](https://badge.fury.io/js/super-pancake-automation)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Chrome DevTools](https://img.shields.io/badge/Chrome-DevTools%20Protocol-blue.svg)](https://chromedevtools.github.io/devtools-protocol/)

A **lightweight DOM-based UI automation framework** using Chrome DevTools Protocol (CDP). Super Pancake provides a simple, powerful API for browser automation, testing, and reporting with a beautiful web UI.

## 🚀 Quick Start

[//]: # ()
[//]: # (### Install Globally)

[//]: # (```bash)

[//]: # (npm install -g super-pancake-automation)

[//]: # (```)

### Quick Init (Recommended)
```bash
npx super-pancake-automation@latest init my-project
# or
super-pancake-init my-project
```

This creates a complete project with:
- ✅ Screenshot capture (including on failure)
- ✅ HTML test reporting  
- ✅ Sample test files
- ✅ Sensible default configuration
- ✅ Ready to run immediately

### Advanced Setup (Interactive)
```bash
super-pancake-setup
```

This runs an interactive setup wizard with advanced options:
- ✅ Custom configuration (headless/headed, screenshots, reports)
- 📸 Failure screenshot capture
- 📊 HTML test reporting
- 🎥 Video recording (optional)
- 🔍 Network and console logging
- ⚡ Performance tuning options

### Generate Sample Tests (Simple)
```bash
super-pancake-generate
```

This creates basic sample test files in your `tests/` directory.

### Add to Existing Project
```bash
npm install super-pancake-automation
```

### Basic Usage
```bash
# Run tests with Super Pancake (Sequential execution)
npm test

# Run specific test patterns
npm test tests/tier1-*.test.js --run

# Launch interactive UI
super-pancake-ui

# Run specific test commands
super-pancake-run
super-pancake-test

# Run tests with headed mode for debugging
HEADED=true npm test
```

## 📱 Interactive Test Runner UI

Launch the beautiful web interface to run tests visually:

```bash
npx super-pancake-ui
```

![Super Pancake UI](assets/ui-interface.png)

### UI Features:
- ✅ **Test Selection**: Choose which tests to run
- 📊 **Real-time Logs**: Watch test execution live
- 🎯 **Individual Test Control**: Run specific test cases
- 🔄 **Auto-refresh**: Automatic test discovery
- 📱 **Responsive Design**: Works on desktop and mobile

## 📊 Beautiful HTML Reports

After running tests, view comprehensive reports:

```bash
# Reports are auto-generated after test runs
open automationTestReport.html
```

![Test Report](assets/test-report.png)

### Report Features:
- 📈 **Test Statistics**: Pass/fail/skipped counts with charts
- 📸 **Screenshots**: Automatic capture on failures
- 🕐 **Timestamps**: Detailed timing information
- 📝 **Error Details**: Stack traces and error messages
- 🎨 **Professional Design**: Clean, modern interface

## 🛠️ Installation & Setup

### Global Installation
```bash
npm install -g super-pancake-automation
```

### Project Installation
```bash
npm install super-pancake-automation --save-dev
```

### Generate Sample Tests
```bash
npx super-pancake-generate
```

## 🎯 Available Commands

### Project Setup
```bash
npm init super-pancake@latest my-project    # Create new project
npx super-pancake --version                # Check version
npx super-pancake --help                   # Show help
```

### Command Reference
| Command | Description | Example |
|---------|-------------|---------|
| `super-pancake-ui` | Launch interactive test runner | `npx super-pancake-ui` |
| `super-pancake-server` | Start UI server only | `npx super-pancake-server` |
| `super-pancake-run` | Run tests with formatted output | `npx super-pancake-run` |
| `super-pancake-generate` | Generate sample test files | `npx super-pancake-generate` |
| `super-pancake` | Main CLI with help/version | `npx super-pancake --version` |
| `domtest` | Basic CLI test runner (legacy) | `npx domtest --url=https://example.com` |

## 💻 Code Examples

### Basic Test Structure (Sessionless API)
```javascript
import { describe, it, beforeAll, afterAll } from 'vitest';
import { createTestEnvironment, cleanupTestEnvironment } from './utils/test-setup.js';
import {
  enableDOM,
  navigateTo,
  fillInput,
  check,
  selectOption,
  click,
  getAttribute,
  getText,
  waitForSelector,
  takeScreenshot,
  getByRole,
  getByText,
  getByLabel,
  getByPlaceholder,
  getByTestId
} from 'super-pancake-automation/core/simple-dom-v2.js';
import {
  assertEqual,
  assertContainsText,
} from 'super-pancake-automation/core/assert.js';

let testEnv;

describe('Modern Super Pancake Test', () => {
  beforeAll(async () => {
    console.log('\n🔷 Super Pancake Test Started');
    testEnv = await createTestEnvironment({ 
      headed: false, 
      testName: 'Form Test' 
    });
    await enableDOM();
  }, 30000);

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv, 'Form Test');
  });

  it('should navigate and interact with form', async () => {
    // Navigate to page
    await navigateTo('http://localhost:8080/form.html');
    
    // Use smart locators - no session needed!
    await fillInput(getByLabel('Full Name'), 'John Doe');
    await fillInput(getByPlaceholder('Enter your email'), 'john@example.com');
    await fillInput(getByTestId('message-input'), 'Hello World');
    
    // Check boxes and select options
    await check(getByLabel('Subscribe to newsletter'));
    await selectOption(getByLabel('Country'), 'US');
    
    // Click submit button
    await click(getByRole('button', { name: 'Submit' }));
    
    // Verify results
    const status = await getAttribute('form', 'data-status');
    assertEqual(status, 'submitted');
    
    // Take screenshot
    await takeScreenshot('./screenshots/form-completed.png');
  });

  it('should verify dynamic content', async () => {
    // Wait for and verify text content
    const heading = await getByText('Success Message');
    const text = await getText(heading);
    assertContainsText(text, 'Success');
    
    // Verify table data
    const tableCell = await getText('table tr:first-child td:first-child');
    assertEqual(tableCell, 'John Doe');
  });
});
```

### Advanced Form Testing (Sessionless API)
```javascript
import { 
  fillInput, 
  selectOption, 
  check, 
  isChecked,
  getByLabel,
  getByRole,
  getByTestId,
  getAttribute,
  click,
  waitForText
} from 'super-pancake-automation/core/simple-dom-v2.js';

it('should handle complex form interactions', async () => {
  await navigateTo('https://myapp.com/form');
  
  // Fill form fields using smart locators
  await fillInput(getByLabel('Full Name'), 'John Doe');
  await fillInput(getByLabel('Email Address'), 'john@example.com');
  await selectOption(getByLabel('Country'), 'US');
  await check(getByLabel('Subscribe to newsletter'));
  
  // Verify form state
  const isNewsletterChecked = await isChecked(getByLabel('Subscribe to newsletter'));
  expect(isNewsletterChecked).toBe(true);
  
  // Get form values
  const nameValue = await getValue(getByLabel('Full Name'));
  expect(nameValue).toBe('John Doe');
  
  // Submit form using role-based locator
  await click(getByRole('button', { name: 'Submit' }));
  
  // Wait for success message
  await waitForText('Form submitted successfully');
});
```

### Table Data Extraction (Sessionless API)
```javascript
import { 
  navigateTo,
  getText,
  getAttribute,
  querySelector,
  waitForSelector
} from 'super-pancake-automation/core/simple-dom-v2.js';

it('should extract table data', async () => {
  await navigateTo('https://myapp.com/users');
  
  // Wait for table to load
  await waitForSelector('#users-table');
  
  // Get table headers
  const headerCells = await querySelectorAll('#users-table thead th');
  const headers = await Promise.all(
    headerCells.map(cell => getText(cell))
  );
  expect(headers).toContain('Name');
  
  // Get first row data
  const firstRowCells = await querySelectorAll('#users-table tbody tr:first-child td');
  const firstRowData = await Promise.all(
    firstRowCells.map(cell => getText(cell))
  );
  expect(firstRowData[0]).toBe('John Doe');
  
  // Get specific cell value
  const specificCell = await getText('#users-table tbody tr:first-child td:nth-child(2)');
  expect(specificCell).toBe('john@example.com');
  
  // Count total rows
  const rows = await querySelectorAll('#users-table tbody tr');
  console.log(`Table has ${rows.length} data rows`);
});
```

## 📚 Documentation

Comprehensive guides and resources:

| Document | Description |
|----------|-------------|
| **[Configuration Guide](docs/CONFIGURATION.md)** | Complete configuration system with environment profiles |
| **[Project Roadmap](docs/ROADMAP.md)** | Development roadmap and feature timeline |
| **[Architecture Guide](docs/ARCHITECTURE.md)** | Framework architecture and component overview |
| **[Project Status](docs/PROJECT_STATUS.md)** | Current status, metrics, and progress tracking |
| **[Feature Voting](docs/FEATURE_VOTING.md)** | Community feature requests and voting |
| **[Development Notes](docs/INFO)** | Internal development notes and context |

## 🔧 Configuration

The framework provides a comprehensive, environment-aware configuration system. See the **[Configuration Guide](docs/CONFIGURATION.md)** for complete details.

### Super Pancake Configuration (super-pancake.config.js)
```javascript
export default {
  // Browser configuration
  browser: {
    headless: process.env.HEADED !== 'true',
    devtools: process.env.DEBUG === 'true',
    slowMo: 0
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
    enabled: true,
    path: './screenshots',
    onFailure: true,
    onSuccess: false
  }
};
```

### Environment Variables
```bash
# Run in headed mode (visible browser)
HEADED=true npm test

# Enable debug mode
DEBUG=true npm test

# Run specific test pattern
npm test tests/tier1-smart-locators.test.js --run
```

### API Import Guide

**Sessionless API (Recommended):**
```javascript
import { 
  enableDOM, navigateTo, fillInput, click, getByRole, getByText 
} from 'super-pancake-automation/core/simple-dom-v2.js';
```

**Legacy Session-Based API:**
```javascript
import { 
  enableDOM, navigateTo, fillInput, click 
} from 'super-pancake-automation/core/dom.js';
```

### Legacy Configuration
```javascript
import { config, getConfig, isDevelopment } from './config.js';

// Environment-aware configuration
if (isDevelopment()) {
  // Headless disabled, DevTools open, debug logging
} else {
  // Production optimizations enabled
}

// Get specific config values
const headless = getConfig('browser.headless');
const timeout = getConfig('timeouts.testTimeout');
```

### Environment Profiles
- **Development**: Browser visible, DevTools open, verbose logging
- **Testing**: Optimized for automated testing with monitoring
- **Production**: Minimal logging, strict security, performance optimized
- **CI/CD**: Single-process mode, conservative resources, JUnit reports

## 🎨 Features

### ✨ Core Features
- 🎯 **Chrome DevTools Protocol**: Direct browser control
- 📸 **Screenshot Capture**: Automatic on failures
- 🕐 **Smart Waits**: Built-in element waiting strategies
- 📊 **HTML Reports**: Beautiful test reports
- 🖥️ **Web UI**: Interactive test runner
- 🔄 **Real-time Logs**: Live test execution feedback

### 🧪 Testing Capabilities
- **Form Testing**: Input fields, dropdowns, checkboxes, radio buttons
- **Table Operations**: Data extraction, row/cell access
- **Advanced Interactions**: Drag & drop, file uploads, mouse events
- **Visual Testing**: Screenshots, element positioning, viewport checks
- **Wait Strategies**: Visibility, clickability, text content, attributes

### 🚀 Sessionless API Advantages

Super Pancake now features a modern **sessionless API** that eliminates the need to pass session objects to every method call:

```javascript
// ❌ Old Session-Based API
await fillInput(session, '#name', 'John');
await click(session, '#submit');
await getText(session, '#result');

// ✅ New Sessionless API  
await fillInput('#name', 'John');
await click('#submit');
await getText('#result');
```

### 🎯 Smart Locators (Playwright-Style)

The new API includes **smart locators** that make tests more readable and maintainable:

```javascript
// ❌ CSS Selectors (brittle)
await click('button[data-cy="submit-btn"]');
await fillInput('input[placeholder="Enter email"]', 'test@example.com');

// ✅ Smart Locators (semantic)
await click(getByRole('button', { name: 'Submit' }));
await fillInput(getByPlaceholder('Enter email'), 'test@example.com');
```

### 📦 Test Environment Management

Simplified test setup with automatic Chrome management:

```javascript
import { createTestEnvironment, cleanupTestEnvironment } from './utils/test-setup.js';
import { enableDOM, navigateTo, getByRole, click } from 'super-pancake-automation/core/simple-dom-v2.js';

let testEnv;

beforeAll(async () => {
  // Automatic Chrome launch, WebSocket connection, and session setup
  testEnv = await createTestEnvironment({ headed: false });
  await enableDOM(); // No session parameter needed!
});

afterAll(async () => {
  // Automatic cleanup of Chrome, WebSocket, and session
  await cleanupTestEnvironment(testEnv);
});

it('should work seamlessly', async () => {
  await navigateTo('https://example.com');
  await click(getByRole('button', { name: 'Get Started' }));
  // No session management needed!
});
```

## 🏗️ Architecture

### Core Components

| Component | Description |
|-----------|-------------|
| **browser.js** | Chrome DevTools Protocol connection management |
| **session.js** | CDP session handling with message routing |
| **dom.js** | 60+ DOM manipulation and query methods |
| **assert.js** | Custom assertion library with descriptive errors |
| **htmlReporter.js** | HTML report generation with screenshots |

### CLI Tools

| Tool | Purpose |
|------|---------|
| **ui-runner.js** | Interactive web UI for test execution |
| **ui-server.js** | Static file server for UI |
| **super-pancake-run.js** | Command-line test runner |
| **generate-test.js** | Sample test file generator |

## 🚀 NPM Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "node scripts/super-pancake-test.js",
    "test:ui": "super-pancake-ui",
    "test:run": "super-pancake-run",
    "test:watch": "vitest --watch",
    "test:generate": "super-pancake-generate",
    "test:tier1": "npm test tests/tier1-*.test.js --run",
    "test:headed": "HEADED=true npm test",
    "test:sequential": "npm test --sequential",
    "test:quick": "npm run test:unit-stable && npm run test:config",
    "test:stability": "vitest run tests/stability-test-suite.test.js"
  }
}
```

## 📦 Package.json Configuration

```json
{
  "name": "super-pancake-automation",
  "version": "1.0.25",
  "description": "A lightweight DOM-based UI automation framework using Chrome DevTools Protocol",
  "keywords": [
    "automation", "ui-testing", "chrome-devtools", "browser-automation",
    "playwright-alternative", "puppeteer-alternative", "selenium-alternative"
  ],
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  },
  "os": ["darwin", "linux", "win32"],
  "cpu": ["x64", "arm64"]
}
```

## 🛠️ Test Utilities & Setup

### Test Environment Setup (utils/test-setup.js)
```javascript
// Quick test environment creation
const env = await createTestEnvironment({
  headed: false,          // Browser visibility
  port: 9222,            // Chrome debugging port
  testName: 'My Test'    // For logging
});

// Specialized environments
const formEnv = await createFormTestEnvironment('Form Test');
const headedEnv = await createHeadedTestEnvironment('Debug Test');
const comprehensiveEnv = await createComprehensiveTestEnvironment('Full Test');

// Environment cleanup
await cleanupTestEnvironment(env, 'My Test');

// Higher-order wrapper
const testWithCleanup = withTestEnvironment({ headed: true });
await testWithCleanup(async ({ chrome, ws, session }) => {
  // Your test code here
});
```

### Custom Test Runner (scripts/super-pancake-test.js)
- Reads configuration from `super-pancake.config.js`
- Implements sequential test execution
- Eliminates Chrome port conflicts
- Provides framework-native test runner

## 🔍 All Available Methods (Sessionless API)

### Test Environment Setup
- `createTestEnvironment(options)` - Quick test setup with Chrome launch
- `cleanupTestEnvironment(env, testName)` - Environment cleanup
- `createFormTestEnvironment(testName)` - Specialized form testing setup
- `createHeadedTestEnvironment(testName)` - Headed mode for debugging

### Navigation & DOM Setup
- `enableDOM()` - Enable required CDP domains (no session needed)
- `navigateTo(url, options)` - Navigate to URL
- `waitForLoadState(state, options)` - Wait for page load states
- `waitForURL(urlPattern, options)` - Wait for URL changes

### Smart Locators (Playwright-style)
- `getByRole(role, options)` - Find by ARIA role: `button`, `textbox`, `link`, etc.
- `getByText(text, options)` - Find by visible text content
- `getByLabel(labelText, options)` - Find by associated label
- `getByPlaceholder(placeholderText, options)` - Find by placeholder attribute
- `getByTestId(testId, options)` - Find by data-testid attribute
- `getByTitle(titleText, options)` - Find by title attribute
- `getByAltText(altText, options)` - Find images by alt text

### Element Queries
- `querySelector(selector, options)` - Find single element
- `waitForSelector(selector, timeout)` - Wait for element to appear
- `first(selector, options)` - Get first matching element
- `last(selector, options)` - Get last matching element
- `nth(selector, index, options)` - Get nth matching element

### Basic Interactions
- `click(selectorOrNodeId, options)` - Click element
- `doubleClick(selectorOrNodeId, options)` - Double click
- `rightClick(selectorOrNodeId, options)` - Right click
- `hover(selectorOrNodeId, options)` - Hover over element
- `fillInput(selectorOrNodeId, value, options)` - Fill input with text

### Form Handling
- `check(selectorOrNodeId, options)` - Check checkbox/radio
- `uncheck(selectorOrNodeId, options)` - Uncheck checkbox/radio
- `selectOption(selectorOrNodeId, value, options)` - Select dropdown option
- `isChecked(selectorOrNodeId, options)` - Check if checked
- `uploadFile(selectorOrNodeId, filePath, options)` - Upload file

### Keyboard & Input
- `press(key, options)` - Press keyboard key
- `type(text, options)` - Type text
- `sendKeys(keys, options)` - Send key combinations

### Element State & Properties
- `getText(selectorOrNodeId, options)` - Get element text
- `getAttribute(selectorOrNodeId, attributeName, options)` - Get attribute
- `getValue(selectorOrNodeId, options)` - Get input value
- `isVisible(selectorOrNodeId, options)` - Check visibility
- `isEnabled(selectorOrNodeId, options)` - Check enabled state
- `isDisabled(selectorOrNodeId, options)` - Check disabled state

### Wait Strategies
- `waitForText(text, options)` - Wait for text to appear
- `waitForAttribute(selector, attributeName, expectedValue, timeout)` - Wait for attribute
- `waitForVisible(selector, timeout)` - Wait for visibility
- `waitForFunction(fn, options)` - Wait for custom condition

### Visual Testing
- `takeScreenshot(filePath, options)` - Full page screenshot
- `setViewport(width, height, options)` - Set viewport size

### Network & API
- `enableNetworkInterception(options)` - Enable network monitoring
- `waitForRequest(urlPattern, options)` - Wait for network request
- `waitForResponse(urlPattern, options)` - Wait for network response
- `getNetworkRequests(urlPattern, options)` - Get captured requests
- `mockResponse(urlPattern, responseData, options)` - Mock API responses

### Multi-Tab Support
- `getAllTabs(options)` - Get all browser tabs
- `createNewTab(url, options)` - Create new tab
- `switchToTab(targetId, options)` - Switch to specific tab
- `closeTab(targetId, options)` - Close tab

### Device Emulation
- `emulateDevice(deviceName, options)` - Emulate mobile devices
- `setGeolocation(latitude, longitude, accuracy, options)` - Set location
- `clearDeviceEmulation(options)` - Reset to desktop

### Configuration
- `setDefaultTimeout(timeout)` - Set default element timeout
- `setNavigationTimeout(timeout)` - Set navigation timeout
- `setScreenshotTimeout(timeout)` - Set screenshot timeout

## 🧪 Testing Examples (Sessionless API)

### Screenshot Testing
```javascript
// Take full page screenshot
await takeScreenshot('./screenshots/full-page.png');

// Take screenshot with custom viewport
await setViewport(1920, 1080);
await takeScreenshot('./screenshots/desktop-view.png');

// Mobile screenshot
await emulateDevice('iPhone 12');
await takeScreenshot('./screenshots/mobile-view.png');
```

### Advanced Form Testing
```javascript
// Multi-step form with smart locators
await fillInput(getByLabel('Full Name'), 'John Doe');
await click(getByRole('button', { name: 'Next Step' }));
await waitForText('Step 2: Skills');

// Upload files
await uploadFile(getByLabel('Resume'), './files/resume.pdf');
await uploadFile(getByLabel('Cover Letter'), './files/cover.doc');

// Multi-select with checkboxes
await check(getByLabel('JavaScript'));
await check(getByLabel('Python'));
await check(getByLabel('TypeScript'));

// Verify form state
const nameValue = await getValue(getByLabel('Full Name'));
expect(nameValue).toBe('John Doe');

const isJSSelected = await isChecked(getByLabel('JavaScript'));
expect(isJSSelected).toBe(true);
```

### Smart Locator Examples
```javascript
// Role-based locators
await click(getByRole('button', { name: 'Submit' }));
await fillInput(getByRole('textbox', { name: 'Username' }), 'john');
await click(getByRole('link', { name: 'Learn More' }));

// Text-based locators
await click(getByText('Sign In'));
await waitForText('Welcome back!');

// Label-based locators
await fillInput(getByLabel('Email Address'), 'john@example.com');
await check(getByLabel('Remember me'));

// Test ID locators (for automation-specific elements)
await click(getByTestId('submit-button'));
await fillInput(getByTestId('search-input'), 'automation');
```

## 📊 CI/CD Integration

### GitHub Actions Workflows

The framework includes comprehensive CI/CD workflows:

#### 1. Main CI Pipeline (.github/workflows/ci.yml)
```yaml
name: Super Pancake CI
on: [push, pull_request]
jobs:
  quick-tests:
    name: Quick Tests (Unit & Config)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit-stable
      - run: npm run test:config
      
  tier1-core-features:
    name: TIER 1 Core Features
    runs-on: ubuntu-latest
    needs: quick-tests
    steps:
      - uses: actions/checkout@v4
      - uses: browser-actions/setup-chrome@v1
      - run: npm ci
      - run: npm test tests/tier1-*.test.js --run
        env:
          HEADED: false
```

#### 2. Manual TIER 1 Testing (.github/workflows/tier1-manual.yml)
- Manual workflow dispatch with headed/headless options
- Individual test selection capabilities
- Virtual display support for headed mode

#### 3. Nightly Stability (.github/workflows/nightly-stability.yml)
- Scheduled runs with comprehensive test matrix
- Node.js 18/20 + Chrome stable/beta combinations
- Success rate monitoring with 80% threshold

### Test Strategy
- **Quick Tests**: Unit tests, config validation, performance checks
- **TIER 1 Core**: Smart locators, advanced waiting, keyboard actions  
- **Comprehensive**: Full stability suite with long-running tests

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request



## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/pradapjackie/super-pancake/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/pradapjackie/super-pancake/issues)
- **Email Support**: pradapjackie@gmail.com

## 📄 License

MIT License © 2025 Pradap Pandiyan

## 🔗 Links

- **NPM Package**: [super-pancake-automation](https://www.npmjs.com/package/super-pancake-automation)
- **GitHub Repository**: [super-pancake](https://github.com/pradapjackie/super-pancake)
- **Documentation**: [GitHub Wiki](https://github.com/pradapjackie/super-pancake/wiki)

---

### 🌟 Star us on GitHub if Super Pancake helps you! 

[![GitHub stars](https://img.shields.io/github/stars/pradapjackie/super-pancake?style=social)](https://github.com/pradapjackie/super-pancake)
