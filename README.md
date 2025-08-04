# 🥞 Super Pancake Automation Framework

A lightweight DOM-based UI automation framework using Chrome DevTools Protocol. Perfect for web testing, form automation, and UI validation.

## 🚀 Quick Start (NPM Package Usage)

### Option 1: Create New Project (Recommended for New Users)

```bash
# Create a new automation project
npx super-pancake-automation@latest init my-automation-project

# Navigate to the project
cd my-automation-project

# Run tests
npm test
```

### Option 2: Interactive Setup Wizard

```bash
# Interactive project setup
npx super-pancake-automation setup
```

### Option 3: Quick UI Interface

```bash
# Launch interactive web UI
npx super-pancake-automation-ui
```

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

## 📋 Available Commands

```bash
# Project Management
npx super-pancake-automation init <project-name>    # Create new project
npx super-pancake-automation setup                  # Interactive setup
npx super-pancake-automation-ui                     # Launch UI interface

# Testing & Diagnostics
npx super-pancake-automation browsers               # Check browser compatibility
npx super-pancake-automation check                  # Health check
npx super-pancake-automation --version              # Show version
```

## 🎯 Generated Project Structure

When you create a new project with `npx super-pancake-automation init`, you get:

```
my-automation-project/
├── tests/
│   ├── sample.test.js          # Basic UI functionality test
│   ├── ui-website.test.js      # Website UI test
│   └── api.test.js            # API testing examples
├── screenshots/                # Auto-generated screenshots
├── super-pancake.config.js    # Configuration file
├── package.json               # Project dependencies
└── README.md                  # Project documentation
```

## 🧪 Running Tests in Generated Projects

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

## 🔧 Configuration

Edit `super-pancake.config.js` in your generated project:

```javascript
export default {
  headless: true,              // Browser mode
  port: 9222,                  // Chrome DevTools port
  screenshots: {
    enabled: true,             // Enable screenshots
    onFailure: true,           // Capture on test failure
    directory: './screenshots' // Screenshot directory
  },
  execution: {
    sequential: true,          // Prevent Chrome port conflicts
    timeout: 30000             // Test timeout
  }
};
```

## 📸 Features

- ✅ **Sequential Test Execution** - Prevents Chrome port conflicts
- 🎯 **Chrome DevTools Protocol** - Fast and reliable browser automation
- 📸 **Automatic Screenshots** - Capture on success and failure
- 📊 **HTML Test Reports** - Beautiful, detailed test reports
- 🔍 **Advanced Element Selection** - CSS, XPath, and custom selectors
- 🚀 **Custom Test Runner** - Optimized for UI automation
- 🎨 **Interactive UI** - Visual test runner interface
- 🔧 **Environment Variables** - Flexible configuration

## 📚 Examples

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

## 🛠️ Development

For contributors and developers:

```bash
# Clone the repository
git clone https://github.com/pradapjackie/super-pancake.git
cd super-pancake

# Install dependencies
npm install

# Run tests
npm test

# Run with UI
npm run test:ui
```

## 📖 Documentation

- [API Reference](./docs/API-REFERENCE.md)
- [Configuration Guide](./docs/CONFIGURATION.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Setup Guide](./docs/SETUP_GUIDE.md)
- [Examples](./docs/examples/)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTIONS.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: pradapjackie@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/pradapjackie/super-pancake/issues)
- 📖 Documentation: [GitHub Wiki](https://github.com/pradapjackie/super-pancake/wiki)

---

**Happy Testing! 🥞✨**
