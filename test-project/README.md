# test-project

Super Pancake automation testing project with advanced configuration.

## Features

- ✅ **Browser Automation**: Chrome DevTools Protocol
- 📸 **Screenshots**: Enabled (on failure)
- 📊 **HTML Reports**: Enabled
- 🎥 **Video Recording**: Enabled
- 🔍 **Network Logs**: Enabled
- 🖥️ **Console Logs**: Enabled
- ⚡ **Parallel Testing**: Enabled

## Installation

```bash
npm install
```

## Usage

```bash
# Run tests
npm test

# Run tests once
npm run test:run

# Run tests with watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Generate report
npm run test:report
```

## Configuration

Edit `super-pancake.config.js` to customize:

- Browser settings (headless, devtools, slowMo)
- Screenshot options (path, quality, on failure)
- Report generation (HTML, auto-open)
- Video recording settings
- Logging preferences
- Timeouts and retries

## Directory Structure

```
test-project/
├── tests/              # Test files
├── screenshots/           # Screenshots
├── videos/             # Video recordings
├── super-pancake.config.js  # Configuration
├── package.json
└── README.md
```

## Documentation

Visit [Super Pancake Documentation](https://github.com/pradapjackie/super-pancake#readme) for more information.
