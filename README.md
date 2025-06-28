# 🥞 super-pancake-automation

> A blazing-fast DOM-based UI automation framework using Chrome DevTools Protocol (CDP).  
Built from scratch to give you fine-grained browser control with no browser UI dependency.

---

## ✨ Features

- Built on **Chrome DevTools Protocol (CDP)**
- Pure **DOM-level** control (no Selenium/WebDriver)
- Tiny, fast, and **headless-ready**
- Powerful API: `click`, `type`, `check`, `dragDrop`, `getText`, `assertEqual`, etc.
- Easily extendable & testable
- Ideal for **end-to-end UI automation** or **internal browser control tools**

---

## 🚀 Getting Started

### 1. Install

```bash
npm install super-pancake-automation
```
# Custom UI Automation Framework

This documentation explains how to set up and use your custom UI automation framework using Chrome DevTools Protocol (CDP), Vitest, and custom reporters.


---

## ⚙️ Setup

### 1. Install Dependencies

```bash
npm install
```

Make sure Node.js (v18+) and Google Chrome are installed on your system.

---

## 🚀 Running Tests

```bash
npx vitest run
```

Tests are located in the `tests/` directory and written using `describe` and `it` from `vitest`.

---

## 📄 Configuration

The `config.js` file holds your default settings:

```js
export const config = {
  browser: {
    type: 'chrome',
    headless: true,
    port: 9222
  },
  test: {
    timeout: 20000
  },
  timeouts: {
    waitForSelector: 5000,
    reload: 1000,
    navigation: 10000
  },
  defaultTimeout: 5000,
  pollInterval: 100
};
```

---

## 🧪 Writing Tests

Use the `testWithReport()` wrapper to log results, capture screenshots on failure, and write to HTML reports.

```js
it('should submit form', async () => {
  await testWithReport('Submit Form', async () => {
    await click(session, 'button[type="submit"]');
    // additional assertions
  }, session);
});
```

---

## ✨ DOM Actions

All supported DOM actions are in `core/dom.js`:

- `navigateTo(session, url)`
- `fillInput(session, selector, value)`
- `click(session, selector)`
- `check(session, selector, checked)`
- `selectOption(session, selector, value)`
- `waitForSelector(session, selector)`
- `getText(session, nodeId)`
- `getAttribute(session, selector, attr)`
- `takeElementScreenshot(session, selector, fileName)`

---

## ✅ Assertions

Located in `core/assert.js`:

- `assertEqual(actual, expected, message)`
- `assertContainsText(content, text, message)`

---

## 📷 Reporting

Results are saved via:

```js
addTestResult({
  name: 'Test Name',
  status: 'pass' | 'fail',
  error: 'Stack trace if any',
  screenshot: 'relative/path.png'
});
```

Final report is generated using:

```js
writeReport(); // in afterAll
```

Result saved in: `test-report/report.html`

---

## 🔁 Test Hooks

```js
beforeAll(async () => {
  chrome = await launchChrome({ headed: true });
  ws = await connectToChrome();
  session = createSession(ws);
  await enableDOM(session);
});

afterAll(async () => {
  writeReport();
  ws.close();
  await chrome.kill();
});
```

---

## 🧠 Utilities

### Launch Browser
```js
launchChrome({ headed: true });
```

### Connect to WebSocket
```js
connectToChrome();
```

### Start CDP Session
```js
createSession(ws);
```

---

## 📚 Sample Test Output

- HTML report with collapsible test sections
- Error stack trace for failed cases
- Embedded screenshots (only on failure)

---

## 📌 Tips

- You can customize timeouts in `config.js`
- Ensure test-report directory exists or is created before writing screenshots
- Use meaningful names in `testWithReport()` to easily track in report

---

© 2025 Automation Framework
