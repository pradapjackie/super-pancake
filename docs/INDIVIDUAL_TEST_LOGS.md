# Individual Test Case Logs & Screenshots

This document explains how to capture console logs and screenshots for individual test cases in your Super Pancake test reports.

## Overview

The new reporting system allows you to:
- **Capture console logs per individual test case** (not just test suite level)
- **Add screenshots during test execution** with viewing options
- **Generate beautiful HTML reports** with logs and screenshots for each test

## Quick Start

### 1. Import the Test Logger

```javascript
import testLogger, { withTestLogging, testScreenshots } from '../../utils/testLogger.js';
```

### 2. Wrap Your Tests

```javascript
it('should login successfully', async () => {
    const testName = 'should login successfully';
    const startTime = Date.now();
    
    const wrappedTest = withTestLogging(async (logger) => {
        // Your test code with logging
        logger.log('🔐 Starting login process...');
        logger.log('📧 Entering email: user@example.com');
        
        // Simulate actions
        await performLogin();
        logger.log('✅ Login successful');
        
        // Add screenshot
        testScreenshots.addScreenshot(
            logger.currentTestId, 
            './screenshots/login-dashboard.png', 
            'User dashboard after login'
        );
        
        // Your assertions
        expect(isLoggedIn).toBe(true);
    }, testName);

    await wrappedTest();
});
```

### 3. Generate Test Data

```javascript
afterAll(async () => {
    // Save individual test logs to automationTestData.json
    const allTestLogs = testLogger.getAllTestLogs();
    const testData = generateTestDataWithLogs(allTestLogs);
    
    fs.writeFileSync('automationTestData.json', JSON.stringify(testData, null, 2));
});
```

## Features

### Console Logs Per Test

Each test case gets its own console logs that will appear in the HTML report:

```javascript
logger.log('🌐 Navigating to homepage...');
logger.log('✅ Page loaded in 1.2s');
logger.log('🔍 Searching for product: "laptop"');
logger.log('📊 Found 25 results');
```

### Screenshots During Tests

Add screenshots at any point during your test:

```javascript
// Add screenshot with description
testScreenshots.addScreenshot(
    logger.currentTestId, 
    './screenshots/search-results.png', 
    'Search results for laptop'
);

// Screenshots will appear in the report with:
// - Thumbnail previews
// - Click to view full size
// - Download options
// - Modal viewing
```

### Automatic Log Timestamping

All logs are automatically timestamped:

```
[2025-07-31T18:30:45.123Z] 🔐 Starting login process...
[2025-07-31T18:30:45.456Z] 📧 Entering email: user@example.com
[2025-07-31T18:30:46.789Z] ✅ Login successful
```

## HTML Report Features

The generated HTML reports will show:

### For Each Test Case:
- ✅ **Individual console logs** (not shared between tests)
- 📸 **Screenshot thumbnails** with click to view
- 🔍 **"View All Logs" button** for complete console output
- 📱 **Responsive design** for mobile viewing

### Log Display:
- 📋 Preview of first 3 log entries
- 🖱️ "View All Logs" button when there are more
- 🪟 **Modal popup** showing complete logs
- 📄 **Copy to clipboard** functionality

### Screenshot Display:
- 🖼️ **Thumbnail previews** (up to 2 visible)
- 🔍 **Click to view full screenshot**
- 📁 **"View All Screenshots"** when multiple exist
- 💾 **Download individual or all screenshots**

## Example Output

When you run tests with individual logging, your HTML report will show:

```
✅ should login successfully                    2.34s
   Console Logs (8 entries)                   [View All Logs]
   [2025-07-31T18:30:45.123Z] 🔐 Starting login process...
   [2025-07-31T18:30:45.456Z] 📧 Entering email: user@example.com
   [2025-07-31T18:30:45.789Z] ✅ Login successful
   
   Screenshots (2 captured)                   [View All (2)]
   [Thumbnail: Login form] [Thumbnail: Dashboard]
   
   [View Logs] [View Screenshots]

✅ should search products                       1.87s
   Console Logs (12 entries)                  [View All Logs]
   [2025-07-31T18:30:47.001Z] 🔍 Starting product search...
   [2025-07-31T18:30:47.234Z] ⌨️ Typing: "laptop"
   [2025-07-31T18:30:47.567Z] 📊 Found 25 results
   
   Screenshots (3 captured)                   [View All (3)]
   [Thumbnail: Search box] [Thumbnail: Results]
   
   [View Logs] [View Screenshots]
```

## Migration from Suite-Level Logs

If you currently have test suite level logs, you can migrate to individual test logs:

### Before (Suite Level):
```javascript
// All logs mixed together for entire test suite
console.log('Test 1 action...');
console.log('Test 2 action...');
console.log('Test 3 action...');
```

### After (Individual Test Level):
```javascript
it('test 1', async () => {
    const wrappedTest = withTestLogging(async (logger) => {
        logger.log('Test 1 specific action...');
        // Only logs for test 1
    }, 'test 1');
    await wrappedTest();
});

it('test 2', async () => {
    const wrappedTest = withTestLogging(async (logger) => {
        logger.log('Test 2 specific action...');
        // Only logs for test 2
    }, 'test 2');
    await wrappedTest();
});
```

## Best Practices

### 1. Use Descriptive Log Messages
```javascript
// ✅ Good
logger.log('🔐 Authenticating user with email: user@example.com');
logger.log('📊 API returned 25 user records in 245ms');

// ❌ Avoid
logger.log('doing stuff');
logger.log('got data');
```

### 2. Add Screenshots at Key Moments
```javascript
// Before critical actions
testScreenshots.addScreenshot(testId, './before-click.png', 'Before clicking submit');

// After important state changes  
testScreenshots.addScreenshot(testId, './after-login.png', 'Dashboard after login');

// On errors (automatically captured)
testScreenshots.addScreenshot(testId, './error-state.png', 'Error modal displayed');
```

### 3. Structure Your Logs
```javascript
logger.log('🚀 Starting checkout process...');
logger.log('  📦 Adding item to cart: Premium Plan ($99)');
logger.log('  💳 Entering payment details...');
logger.log('  ✅ Payment processed successfully');
logger.log('🎉 Checkout completed in 3.2s');
```

## Running the Example

To see this in action:

```bash
# Run the example test
npm test tests/examples/test-with-individual-logs.test.js

# Generate HTML report
npm run report

# Open the generated report
open test-report.html
```

The report will show individual console logs and screenshots for each test case, exactly as you specified!