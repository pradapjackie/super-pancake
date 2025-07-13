# 🥞 Super Pancake Framework Setup Guide

## 🚀 Getting Started

### Option 1: Create New Project (Recommended)

The easiest way to get started is using our interactive project generator:

```bash
npm init super-pancake@latest my-project
```

This will:
- ✅ Create a new project directory
- ✅ Set up all configuration files
- ✅ Install dependencies automatically
- ✅ Generate sample tests
- ✅ Configure your preferred settings

### Option 2: Add to Existing Project

If you want to add Super Pancake to an existing project:

```bash
npm install super-pancake-automation --save-dev
```

## 📋 Interactive Setup

When you run `npm init super-pancake@latest`, you'll be asked:

### 1. **Project Configuration**
- **Project name**: Your project folder name
- **Author**: Your name/organization
- **Test directory**: Where to store test files (default: `tests`)
- **Base URL**: Default URL for your tests (optional)

### 2. **Browser Settings**
- **Browser**: chrome, chromium, or edge (default: chrome)
- **Headless mode**: Run browser without UI (default: true)
- **Viewport size**: Browser window dimensions (default: 1280x720)

### 3. **Test Configuration**
- **Timeout**: How long to wait for operations (default: 30000ms)
- **Retries**: Number of retry attempts (default: 2)
- **Screenshots**: When to capture (always/on-failure/off)
- **Video recording**: When to record (always/on-failure/off)
- **Tracing**: Enable detailed execution traces
- **Verbose output**: Show detailed logs

### 4. **Sample Test**
- **Create sample test**: Generate example test file (recommended: yes)

## 📁 Generated Project Structure

After setup, your project will have:

```
my-project/
├── tests/                    # Test files
│   └── sample.test.js       # Sample test (if created)
├── screenshots/             # Test screenshots
├── super-pancake.config.js  # Framework configuration
├── package.json             # Project dependencies
├── .gitignore              # Git ignore patterns
└── README.md               # Project documentation
```

## ⚙️ Configuration File

The `super-pancake.config.js` file contains all your settings:

```javascript
module.exports = {
  "framework": "super-pancake",
  "version": "1.0.0",
  "testDir": "tests",
  "browser": {
    "name": "chrome",
    "headless": true,
    "viewport": { "width": 1280, "height": 720 }
  },
  "timeout": 30000,
  "retries": 2,
  "reporter": {
    "html": { "enabled": true, "outputFile": "test-report.html" },
    "console": { "enabled": true, "verbose": false }
  },
  "use": {
    "trace": "off",
    "screenshot": "only-on-failure",
    "video": "retain-on-failure"
  }
};
```

## 🏃‍♂️ Running Your First Test

1. **Navigate to your project**:
   ```bash
   cd my-project
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Launch interactive UI**:
   ```bash
   npm run test:ui
   ```

4. **Check framework version**:
   ```bash
   npx super-pancake --version
   ```

## 📝 Sample Test Explanation

The generated sample test demonstrates:

```javascript
import { 
  launchChrome, 
  connectToChrome, 
  createSession, 
  enableDOM, 
  querySelector, 
  type, 
  click,
  screenshot 
} from 'super-pancake-automation';

describe('Sample Super Pancake Test', () => {
  let chrome, ws, session;

  beforeAll(async () => {
    // Launch Chrome browser
    chrome = await launchChrome({ headed: !headless });
    ws = await connectToChrome();
    session = createSession(ws);
    await enableDOM(session);
  });

  test('should navigate and interact', async () => {
    // Navigate to page
    await session.send('Page.navigate', { url: 'https://example.com' });
    
    // Take screenshot
    await screenshot(session, 'homepage.png');
    
    // Find and interact with elements
    const titleElement = await querySelector(session, 'h1');
    console.log('Found title:', titleElement);
  });
});
```

## 🎯 Next Steps

After setup:

1. **Customize configuration** in `super-pancake.config.js`
2. **Write your tests** in the `tests/` directory
3. **Run tests** with `npm test`
4. **View reports** in generated HTML files
5. **Use interactive UI** with `npm run test:ui`

## 🔗 Additional Resources

- [Main Documentation](../README.md)
- [API Reference](./API.md)
- [Examples](../examples/)
- [Best Practices](./BEST_PRACTICES.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

## 💡 Tips

- **Start simple**: Begin with the sample test and modify it
- **Use the UI**: The interactive interface is great for beginners
- **Check screenshots**: They help debug failing tests
- **Read reports**: HTML reports provide detailed insights
- **Ask for help**: Open issues on GitHub if you get stuck

---
*Created with 🥞 Super Pancake Framework*