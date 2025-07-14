# create-super-pancake

Scaffolding tool for creating new Super Pancake automation testing projects.

## Usage

### Create a new project

```bash
npm init super-pancake@latest my-project
```

Or using npx:

```bash
npx create-super-pancake@latest my-project
```

### Interactive setup

The tool will guide you through an interactive setup process:

🥞 **Project Configuration**
- Project name and author
- Test directory structure  
- Base URL for testing

🌐 **Browser Settings**
- Browser choice (Chrome, Chromium, Edge)
- Headless vs headed mode
- Viewport dimensions

⚙️ **Test Configuration** 
- Timeout settings
- Retry attempts
- Verbose output options

📸 **Recording Options**
- Screenshot capture settings
- Video recording preferences
- Tracing capabilities

## Generated Project Structure

```
my-project/
├── tests/
│   └── sample.test.js     # Sample test file
├── screenshots/           # Test screenshots directory
├── super-pancake.config.js # Framework configuration
├── package.json          # Project dependencies
├── .gitignore            # Git ignore rules
└── README.md             # Project documentation
```

## Next Steps

After creating your project:

1. **Install dependencies**: `npm install`
2. **Run tests**: `npm test`
3. **Launch UI**: `npm run test:ui`
4. **Start server**: `npm run test:server`

## Available Commands

- `npm test` - Run all tests
- `npm run test:ui` - Launch interactive test UI
- `npm run test:server` - Start test server
- `npm run test:generate` - Generate new test templates

## Requirements

- Node.js 16.0.0 or higher
- Chrome browser (or Chromium/Edge)

## Related Packages

- [super-pancake-automation](https://www.npmjs.com/package/super-pancake-automation) - Main framework
- [Super Pancake Documentation](https://github.com/pradapjackie/super-pancake)

---

🥞 **Super Pancake Framework** - Lightweight DOM-based UI automation using Chrome DevTools Protocol