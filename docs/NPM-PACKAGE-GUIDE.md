# 📦 NPM Package Usage Guide

This guide explains how end users will interact with Super Pancake Automation Framework as an npm package.

## 🚀 Quick Start for End Users

### Option 1: Create New Project (Recommended)

```bash
# Create a new automation project
npx super-pancake-automation init my-automation-project

# Navigate to the project
cd my-automation-project

# Run tests
npm test
```

This creates a complete project with:
- ✅ Sample test files (`sample.test.js`, `ui-website.test.js`, `api.test.js`)
- ✅ Configuration file (`super-pancake.config.js`)
- ✅ Package.json with all dependencies
- ✅ README with usage instructions
- ✅ Screenshots directory
- ✅ Ready to run immediately

### Option 2: Interactive Setup Wizard

```bash
# Interactive project setup with custom options
npx super-pancake-automation setup
```

This runs an interactive wizard that asks for:
- Browser mode (headless/headed)
- Screenshot preferences
- Test runner UI options
- Report generation settings

### Option 3: Quick UI Interface

```bash
# Launch interactive web UI
npx super-pancake-automation-ui
```

Opens a web interface at `http://localhost:3000` for:
- Test selection and execution
- Real-time test monitoring
- Screenshot viewing
- Report generation

### Option 4: Use in Existing Projects

```bash
# Install in existing project
npm install super-pancake-automation

# Import in your test files
import { 
  createTestEnvironment, 
  navigateTo, 
  getText,
  assertContainsText 
} from 'super-pancake-automation';
```

## 📋 Available NPM Commands

### Project Management
```bash
npx super-pancake-automation init <project-name>    # Create new project
npx super-pancake-automation setup                  # Interactive setup
npx super-pancake-automation-ui                     # Launch UI interface
```

### Testing & Diagnostics
```bash
npx super-pancake-automation browsers               # Check browser compatibility
npx super-pancake-automation check                  # Health check
npx super-pancake-automation --version              # Show version
npx super-pancake-automation --help                 # Show help
```

## 🎯 Generated Project Structure

When you run `npx super-pancake-automation init my-project`, you get:

```
my-project/
├── tests/
│   ├── sample.test.js          # Basic UI functionality test
│   ├── ui-website.test.js      # Website UI test
│   └── api.test.js            # API testing examples
├── screenshots/                # Auto-generated screenshots
├── super-pancake.config.js    # Configuration file
├── package.json               # Project dependencies
├── .gitignore                 # Git ignore file
└── README.md                  # Project documentation
```

## 🧪 Running Tests in Generated Projects

### Basic Commands
```bash
# Run all tests
npm test

# Run with visible browser (for debugging)
npm run test:headed

# Run with UI interface
npm run test:ui

# Run specific test files
npm test tests/sample.test.js
```

### Environment Variables
```bash
# Run with visible browser
HEADED=true npm test

# Enable debug mode
DEBUG=true npm test

# Run specific test pattern
npm test tests/tier1-*.test.js --run
```

## 🔧 Configuration

The generated `super-pancake.config.js` file controls all settings:

```javascript
export default {
  // Browser settings
  headless: true,              // Browser mode (true=headless, false=headed)
  port: 9222,                  // Chrome DevTools port
  
  // Screenshot settings
  screenshots: {
    enabled: true,             // Enable screenshots
    onFailure: true,           // Capture on test failure
    directory: './screenshots' // Screenshot directory
  },
  
  // Test execution settings
  execution: {
    sequential: true,          // Prevent Chrome port conflicts
    timeout: 30000,            // Test timeout
    retries: 1                 // Retry failed tests
  },
  
  // Vitest settings (handled automatically)
  vitest: {
    pool: 'forks',
    poolOptions: { 
      forks: { singleFork: true } 
    },
    fileParallelism: false,
    sequence: { concurrent: false, shuffle: false },
    bail: 1,
    retry: 1
  }
};
```

## 📚 Test Examples

### Basic UI Test
```javascript
import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  createTestEnvironment,
  cleanupTestEnvironment,
  enableDOM,
  navigateTo,
  getText,
  assertContainsText
} from 'super-pancake-automation';

describe('Website UI Tests', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await createTestEnvironment({ headed: false });
    await enableDOM();
  });

  afterAll(async () => {
    await cleanupTestEnvironment(testEnv);
  });

  it('should load homepage and verify content', async () => {
    await navigateTo('https://example.com');
    const title = await getText('h1');
    assertContainsText(title, 'Welcome');
  });
});
```

### Form Automation
```javascript
it('should fill and submit a form', async () => {
  await navigateTo('https://example.com/form');
  
  await fillInput('#name', 'John Doe');
  await fillInput('#email', 'john@example.com');
  await clickButton('#submit');
  
  await waitForSelector('.success-message');
  const message = await getText('.success-message');
  assertContainsText(message, 'Form submitted successfully');
});
```

## 🎨 Available APIs

### Test Environment Setup
```javascript
import {
  createTestEnvironment,
  cleanupTestEnvironment,
  enableDOM
} from 'super-pancake-automation';
```

### Navigation & DOM
```javascript
import {
  navigateTo,
  waitForSelector,
  waitForText
} from 'super-pancake-automation';
```

### Element Interactions
```javascript
import {
  click,
  fillInput,
  getText,
  getAttribute
} from 'super-pancake-automation';
```

### Smart Locators (Playwright-style)
```javascript
import {
  getByRole,
  getByText,
  getByLabel,
  getByPlaceholder
} from 'super-pancake-automation';
```

### Assertions
```javascript
import {
  assertContainsText,
  assertEqual,
  assertTrue,
  assertFalse
} from 'super-pancake-automation';
```

### Screenshots
```javascript
import {
  takeScreenshot,
  takeElementScreenshot
} from 'super-pancake-automation';
```

## 📊 Reports and Output

### HTML Reports
After running tests, HTML reports are automatically generated:
- `test-report.html` - Main test report
- `screenshots/` - Screenshots captured during tests

### View Reports
```bash
# Open report in browser
open test-report.html

# Or manually navigate to the file
```

## 🔍 Troubleshooting

### Common Issues

#### Chrome Port Conflicts
```bash
# Solution: Use sequential execution (enabled by default)
# Or manually kill Chrome processes
pkill -f chrome
```

#### Browser Not Found
```bash
# Check browser compatibility
npx super-pancake-automation browsers

# Install Chrome if needed
# macOS: brew install google-chrome
# Ubuntu: sudo apt install google-chrome-stable
```

#### Permission Issues
```bash
# Fix npm permissions
sudo chown -R $USER:$GROUP ~/.npm
sudo chown -R $USER:$GROUP ~/.config
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=true npm test

# Run with visible browser for debugging
HEADED=true npm test
```

## 🚀 Advanced Usage

### Custom Test Runner
```javascript
// scripts/custom-runner.js
import { createTestEnvironment, enableDOM } from 'super-pancake-automation';

async function runCustomTest() {
  const env = await createTestEnvironment({ headed: false });
  await enableDOM();
  
  // Your test logic here
  
  await cleanupTestEnvironment(env);
}

runCustomTest();
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: UI Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: test-report.html
```

## 📖 Next Steps

1. **Read the API Reference**: [API-REFERENCE.md](./API-REFERENCE.md)
2. **Explore Examples**: [examples/](./examples/)
3. **Configure Your Project**: [CONFIGURATION.md](./CONFIGURATION.md)
4. **Join the Community**: [GitHub Issues](https://github.com/pradapjackie/super-pancake/issues)

## 🆘 Support

- 📧 **Email**: pradapjackie@gmail.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/pradapjackie/super-pancake/issues)
- 📖 **Documentation**: [GitHub Wiki](https://github.com/pradapjackie/super-pancake/wiki)

---

**Happy Testing! 🥞✨** 