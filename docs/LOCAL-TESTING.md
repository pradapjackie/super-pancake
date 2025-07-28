# Local Testing Guide

This guide explains how to test the Super Pancake Automation framework locally before publishing to npm, simulating the end-user experience.

## Overview

Local testing is crucial to ensure that:
- The package installs correctly from npm
- CLI commands work as expected
- Generated test files function properly
- Report generation works in user environments
- All dependencies are properly bundled

## Method 1: npm pack (Recommended)

This method creates a tarball that simulates the npm publish process.

### Steps

1. **Create the package tarball**
   ```bash
   # In your project directory
   cd /Users/josestepha/WebstormProjects/automation-framework
   npm pack
   ```
   This creates `super-pancake-automation-2.9.2.tgz`

2. **Set up test environment**
   ```bash
   # Create a clean test directory
   mkdir /tmp/super-pancake-test
   cd /tmp/super-pancake-test
   ```

3. **Install from local package**
   ```bash
   # Install the packed tarball
   npm install /Users/josestepha/WebstormProjects/automation-framework/super-pancake-automation-2.9.2.tgz
   ```

4. **Test the installation**
   ```bash
   # Test CLI availability
   npx super-pancake --version
   npx super-pancake --help
   
   # Test project initialization
   npx super-pancake init my-test-project
   cd my-test-project
   
   # Verify generated files
   ls -la tests/
   cat package.json
   ```

5. **Run generated tests**
   ```bash
   # Run the tests to verify they work
   npm test
   
   # Generate and open report
   npm run report:test
   ```

### Automated Testing Script

Create `scripts/test-locally.sh`:

```bash
#!/bin/bash
set -e

echo "🔧 Testing Super Pancake Automation locally..."

# Configuration
PROJECT_DIR="/Users/josestepha/WebstormProjects/automation-framework"
TEST_DIR="/tmp/super-pancake-test-$(date +%s)"
TEST_PROJECT_NAME="test-project"

# Clean up function
cleanup() {
    echo "🧹 Cleaning up test directory..."
    rm -rf "$TEST_DIR"
}
trap cleanup EXIT

echo "📦 Step 1: Creating package tarball..."
cd "$PROJECT_DIR"
npm pack

echo "🏗️  Step 2: Setting up test environment..."
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "📥 Step 3: Installing package locally..."
TARBALL_PATH="$PROJECT_DIR/super-pancake-automation-*.tgz"
npm install $TARBALL_PATH

echo "🧪 Step 4: Testing CLI commands..."
npx super-pancake --version
npx super-pancake --help

echo "🚀 Step 5: Testing project initialization..."
npx super-pancake init "$TEST_PROJECT_NAME"
cd "$TEST_PROJECT_NAME"

echo "📋 Step 6: Verifying generated files..."
echo "Generated test files:"
ls -la tests/
echo -e "\nPackage.json dependencies:"
cat package.json | jq '.dependencies'

echo "🎯 Step 7: Running generated tests..."
npm test

echo "📊 Step 8: Testing report generation..."
npm run report:test

echo "✅ Local testing completed successfully!"
echo "🌐 Check the generated report at: $TEST_DIR/$TEST_PROJECT_NAME/test-report.html"
```

Make it executable:
```bash
chmod +x scripts/test-locally.sh
./scripts/test-locally.sh
```

## Method 2: npm link (Development)

Useful for rapid development testing with live updates.

### Steps

1. **Create global link**
   ```bash
   # In your project directory
   cd /Users/josestepha/WebstormProjects/automation-framework
   npm link
   ```

2. **Test in another location**
   ```bash
   # Create test directory
   mkdir /tmp/super-pancake-link-test
   cd /tmp/super-pancake-link-test
   
   # Link to your development version
   npm link super-pancake-automation
   
   # Test CLI
   npx super-pancake init test-project
   ```

3. **Cleanup when done**
   ```bash
   # Remove global link
   cd /Users/josestepha/WebstormProjects/automation-framework
   npm unlink -g
   ```

## Method 3: Direct Path Install

Install directly from the file system path.

```bash
# In test location
mkdir /tmp/super-pancake-direct-test
cd /tmp/super-pancake-direct-test

# Install from file path
npm install /Users/josestepha/WebstormProjects/automation-framework

# Test
npx super-pancake init test-project
cd test-project
npm test
```

## Method 4: Local Registry (Production-like)

Most realistic simulation using a local npm registry.

### Setup Verdaccio

```bash
# Install local npm registry
npm install -g verdaccio

# Start registry (runs on http://localhost:4873)
verdaccio
```

### Publish and Test

```bash
# In your project directory
npm publish --registry http://localhost:4873

# In test location
mkdir /tmp/super-pancake-registry-test
cd /tmp/super-pancake-registry-test

# Install from local registry
npm install super-pancake-automation --registry http://localhost:4873

# Test
npx super-pancake init test-project
```

## Testing Checklist

When testing locally, verify:

- [ ] **Installation**: Package installs without errors
- [ ] **CLI Commands**: All binary commands work (`super-pancake`, `super-pancake-ui`, etc.)
- [ ] **Project Initialization**: `npx super-pancake init` creates proper structure
- [ ] **Generated Tests**: All test files (api.test.js, sample.test.js, ui-website.test.js) run without errors
- [ ] **Dependencies**: All required packages are installed automatically
- [ ] **Report Generation**: HTML reports generate and open correctly
- [ ] **Cross-platform**: Test on different operating systems if possible

## Common Issues and Solutions

### "Module not found" errors
- Ensure all dependencies are listed in `package.json` `dependencies` (not `devDependencies`)
- Check that the `files` array in `package.json` includes all necessary files

### CLI commands not found
- Verify `bin` entries in `package.json` point to correct files
- Ensure binary files have proper shebang (`#!/usr/bin/env node`)
- Check file permissions (`chmod +x bin/*`)

### Import/Export errors
- Confirm `"type": "module"` is set in `package.json`
- Verify all imports use correct file extensions (`.js`)
- Check that ES module syntax is used consistently

### Generated tests fail
- Test the generated test files in isolation
- Verify function signatures match between templates and actual exports
- Check that all imported functions are properly exported from main package

## Continuous Testing

Add local testing to your development workflow:

```bash
# Add to package.json scripts
{
  "scripts": {
    "test:local": "./scripts/test-locally.sh",
    "test:pack": "npm pack && echo 'Tarball ready for testing'",
    "preversion": "npm run test:local"
  }
}
```

## Best Practices

1. **Test before every release**: Always run local tests before publishing
2. **Use fresh directories**: Don't reuse test directories to avoid cached issues
3. **Test multiple scenarios**: Try different project names and configurations
4. **Verify reports**: Ensure generated reports open and display correctly
5. **Check logs**: Review console output for warnings or errors
6. **Cross-platform testing**: Test on different operating systems when possible

## Troubleshooting

If you encounter issues:

1. **Clear npm cache**: `npm cache clean --force`
2. **Remove node_modules**: `rm -rf node_modules package-lock.json && npm install`
3. **Check Node version**: Ensure compatibility with `engines` field in package.json
4. **Verify file permissions**: Ensure executable permissions on binary files
5. **Check git ignore**: Make sure essential files aren't accidentally ignored

## Quick Reference

```bash
# Quick local test command
npm pack && npm install super-pancake-automation-*.tgz -g && super-pancake init test && cd test && npm test

# Clean up global installs
npm uninstall -g super-pancake-automation

# Check what files will be published
npm publish --dry-run
```

This local testing approach ensures your package works correctly for end users before publishing to npm.