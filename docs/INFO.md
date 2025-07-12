## Project Overview

This is **Super Pancake Automation** - a lightweight DOM-based UI automation framework using Chrome DevTools Protocol (CDP). The framework provides a simple API for browser automation, testing, and reporting.

## Key Commands

### Testing
- `npm test` - Run all tests using Vitest
- `npx super-pancake-run` - Run tests with custom runner and formatted output
- `npx super-pancake-ui` - Launch interactive test runner web UI
- `npx super-pancake-generate` - Generate sample test files
- `npx domtest` - Run basic DOM test with CLI (supports `--url=` parameter)

### Development
- Tests are located in `tests/` directory
- Use `npx vitest --watch` for watch mode during development
- Test reports are generated in `test-report/` directory with HTML output

## Architecture

### Core Components

**Browser Management (`core/browser.js`)**
- Manages Chrome DevTools Protocol connection
- Handles WebSocket communication with Chrome instances
- Waits for debugger readiness before connecting

**Session Management (`core/session.js`)** 
- Creates CDP sessions with message ID tracking
- Provides promise-based API for CDP commands
- Handles WebSocket message routing

**DOM Interactions (`core/dom.js`)**
- Comprehensive DOM manipulation API (click, type, select, etc.)
- Element querying and waiting functionality
- Screenshot capture capabilities
- Navigation and page lifecycle management

**Assertions (`core/assert.js`)**
- Custom assertion library for test validation
- Supports text, element, and value assertions
- Provides detailed error messages

**Reporting System (`reporter/htmlReporter.js`)**
- Generates HTML test reports with screenshots
- Manages test result collection globally
- Handles report directory initialization

**Test Wrapper (`helpers/testWrapper.js`)**
- Integrates tests with reporting system
- Automatic screenshot capture on test failures
- Manages test lifecycle and cleanup

### Configuration

**`config.js`** - Central configuration for:
- Browser settings (Chrome port, headless mode)
- Timeout configurations (test, navigation, selectors)
- Polling intervals for DOM queries

### Test Structure

Tests use Vitest framework with custom CDP integration:
- `beforeAll()` - Launch Chrome, establish connection, create session
- `afterAll()` - Close connection, kill Chrome, generate reports
- Each test wrapped with `testWithReport()` for automatic reporting

### CLI Tools

**`bin/super-pancake-run.js`** - Main test runner:
- Cleans previous results
- Executes Vitest with custom formatting
- Provides detailed test summary tables

**`bin/ui-runner.js`** - Web UI launcher for interactive testing
**`bin/generate-test.js`** - Sample test file generator
**`bin/cli.js`** - Basic CLI tool for running single tests with URL parameter

## Development Notes

- Framework uses ES modules (`"type": "module"` in package.json)
- CDP communication is Promise-based with async/await
- Tests require Chrome to be available for launching
- All DOM operations are wrapped in try/catch with descriptive error messages
- Screenshot capture is automatic on test failures
- HTML reports include test results, screenshots, and timestamps

## Package Export Structure

The framework exports modules via package.json `exports` field:
- Main entry: `index.js` (exports all core modules)
- Individual modules can be imported directly:
  - `super-pancake-automation/core/dom.js`
  - `super-pancake-automation/core/assert.js`
  - `super-pancake-automation/utils/launcher.js`
  - `super-pancake-automation/reporter/htmlReporter.js`
  - And more as defined in package.json exports

## Dependencies

**Runtime Dependencies:**
- `chrome-launcher` - Chrome browser launching
- `express` - Web server for UI mode
- `glob` - File pattern matching
- `node-fetch` - HTTP requests
- `open` - Opening URLs/files
- `ws` - WebSocket communication

**Dev Dependencies:**
- `vitest` - Testing framework

## File Structure

```
core/           # Core framework components
├── browser.js  # CDP connection management
├── session.js  # Session and messaging
├── dom.js      # DOM manipulation API
└── assert.js   # Custom assertions

bin/            # CLI executables
tests/          # Test files
reporter/       # HTML reporting system
helpers/        # Test utilities
utils/          # Chrome launcher utilities
test-report/    # Generated reports and screenshots
```