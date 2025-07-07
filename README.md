### 🔍 Actions (from `core/dom.js`)

The following table lists available DOM action methods provided by the framework:

| Category              | Function                         | Description |
|-----------------------|----------------------------------|-------------|
| **Core**              | `enableDOM(session)`             | Enables required CDP domains for DOM interaction. |
|                       | `navigateTo(session, url)`       | Navigates to a URL and waits until the page is fully loaded. |
|                       | `reload(session)`                | Reloads the page. |
|                       | `goBack(session)`                | Navigates back in browser history. |
|                       | `goForward(session)`             | Navigates forward in browser history. |
| **Selectors**         | `querySelector(session, selector)`      | Finds and returns the first matching nodeId. |
|                       | `querySelectorAll(session, selector)`   | Returns an array of all matching nodeIds. |
|                       | `waitForSelector(session, selector, timeout)` | Waits until the element appears or timeout. |
| **Element Actions**   | `click(session, selector)`       | Clicks on an element by selector. |
|                       | `triggerClick(session, selector)`| Triggers a direct click via JS. |
|                       | `rightClick(session, selector)`  | Simulates a right-click on the element. |
|                       | `hover(session, selector)`       | Highlights the element visually. |
|                       | `type(session, selector, text)`  | Types text into the input field. |
|                       | `paste(session, selector, text)` | Pastes text into the input field. |
|                       | `fillInput(session, selector, value)` | Fills the input field and dispatches an input event. |
|                       | `clearInput(session, selector)`  | Clears the text inside an input. |
|                       | `check(session, selector, checked)` | Toggles a checkbox element. |
|                       | `selectOption(session, selector, values)` | Selects dropdown option(s). |
|                       | `pressKey(session, selector, key)` | Simulates a key press on element. |
|                       | `focus(session, selector)`       | Focuses the input/element. |
|                       | `dragDrop(session, sourceSelector, targetSelector)` | Simulates drag and drop between elements. |
|                       | `uploadFileBuffer(session, selector, filename, content)` | Simulates file upload with given content. |
| **State & Queries**   | `getText(session, nodeId)`       | Gets the visible text of an element. |
|                       | `getAttribute(session, selector, attrName)` | Retrieves an attribute value. |
|                       | `setAttribute(session, selector, attrName, value)` | Sets an attribute value. |
|                       | `getValue(session, selector)`    | Returns value of an input/textarea. |
|                       | `isVisible(session, selector)`   | Returns true if the element is visible. |
|                       | `isEnabled(session, selector)`   | Returns true if the element is enabled. |
| **Screenshots**       | `takeScreenshot(session, fileName)` | Captures full-page screenshot. |
|                       | `takeElementScreenshot(session, selector, fileName)` | Captures screenshot of a specific element. |
| **Utilities**         | `waitForTimeout(ms)`             | Waits for the given time in milliseconds. |

### ✅ Assertions

Use assertion methods from `super-pancake-automation/core/assert.js`:

```js
import {
  assertEqual,
  assertNotEqual,
  assertDeepEqual,
  assertExists,
  assertNotExists,
  assertTrue,
  assertFalse,
  assertContainsText,
  assertNotContainsText,
  assertGreaterThan,
  assertGreaterThanOrEqual,
  assertLessThan,
  assertLessThanOrEqual,
  assertTypeOf,
  assertInstanceOf,
  assertArrayIncludes,
  assertArrayNotIncludes,
  assertLength,
  assertMatch,
  assertNotMatch,
  assertVisible,
  assertExists as assertElementExists
} from 'super-pancake-automation/core/assert.js';
```

| Assertion Function            | Description |
|------------------------------|-------------|
| `assertEqual(a, b)`          | Checks if values are strictly equal |
| `assertNotEqual(a, b)`       | Asserts that values are not equal |
| `assertDeepEqual(a, b)`      | Checks deep equality between objects |
| `assertExists(val)`          | Verifies that value is not null or undefined |
| `assertNotExists(val)`       | Ensures value is null or undefined |
| `assertTrue(cond)`           | Asserts condition is true |
| `assertFalse(cond)`          | Asserts condition is false |
| `assertContainsText(actual, expected)` | Checks if string contains a substring |
| `assertNotContainsText(actual, expected)` | Ensures string does not contain substring |
| `assertGreaterThan(val, threshold)` | Checks if value is greater than threshold |
| `assertGreaterThanOrEqual(val, threshold)` | Value is greater than or equal to threshold |
| `assertLessThan(val, threshold)` | Value is less than threshold |
| `assertLessThanOrEqual(val, threshold)` | Value is less than or equal to threshold |
| `assertTypeOf(val, type)`    | Validates the type of value |
| `assertInstanceOf(val, constructor)` | Checks if value is an instance of constructor |
| `assertArrayIncludes(arr, item)` | Validates that array includes item |
| `assertArrayNotIncludes(arr, item)` | Ensures array does not include item |
| `assertLength(val, expected)` | Checks exact length of string/array |
| `assertMatch(val, regex)`    | Checks if value matches a regular expression |
| `assertNotMatch(val, regex)` | Ensures value does not match regex |
| `assertVisible(session, selector)` | Verifies element is visible in DOM |
| `assertElementExists(session, selector)` | Verifies element exists in DOM |

---

## 📜 Scripts & CLI Commands

| Command                | Description                            |
|------------------------|----------------------------------------|
| `npx super-pancake-generate`       | Generate a sample test file with cases |
| `npx super-pancake-ui` | Launch the test runner web UI          |
| `npx super-pancake-run`| Run tests using the internal runner    |

---

## 🚀 Getting Started with Super Pancake

To quickly get up and running with Super Pancake, use the following steps:

### 1. Scaffold Your Project

```bash
npm init super-pancake
```

You'll be prompted to configure your test setup:

- Choose JavaScript or TypeScript (default is JavaScript)
- Name your tests folder (default is `tests`)
- Choose whether to add example test cases
- Optionally set up Git hooks and CI config
- Decide whether to auto-install dependencies (recommended)

### 2. What Gets Installed

The setup will scaffold the following:

```
package.json
test.config.js
tests/
  sample.test.js
core/
  dom.js
  assert.js
scripts/
  test-ui.js
test-report/
  results/
  index.html
```

### 3. Running Tests

By default, test files in the `tests/` directory are picked up and run using Vitest.

To run all tests:
```bash
npx super-pancake-run
```

To run a specific test file:
```bash
npx super-pancake-run tests/form.test.js
```

To run tests in watch mode:
```bash
npx vitest --watch
```

### 4. View HTML Reports

After tests complete, an HTML report is available at:

```
test-report/index.html
```

Open it manually in your browser, or use:

```bash
npx super-pancake-show-report
```

The report includes:

- Pass/fail/skipped stats
- Screenshots (if captured)
- Logs and error stack traces

### 5. UI Mode

To run tests with a visual UI:

```bash
npx super-pancake-ui
```

This opens a browser-based dashboard where you can:

- Select tests to run
- View live logs and outputs
- Rerun individual test cases

### 6. Updating Super Pancake

To update to the latest version:

```bash
npm install super-pancake-automation@latest
```

Ensure your test cases remain compatible with any new API features or changes.

---

For more advanced usage and CI/CD integration, visit the full documentation:

[https://github.com/pradapjackie/super-pancake](https://github.com/pradapjackie/super-pancake)

## 🤝 Contributing

Pull requests are welcome! For major changes, open an issue first to discuss what you’d like to change.

---

## 📄 License

MIT License  
© 2025 Pradap Pandiyan

---

## 🌐 Repository

[https://github.com/pradapjackie/super-pancake](https://github.com/pradapjackie/super-pancake)
