#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { displayBrowserStatus } from '../utils/browser-detection.js';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get version from package.json
function getVersion() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

// Show help
function showHelp() {
  console.log(`
🥞 Super Pancake Framework v${getVersion()}

USAGE PATTERNS:

1. CREATE NEW PROJECT (Recommended):
   npx super-pancake-automation init <project-name>
   cd <project-name>
   npm test

2. INTERACTIVE SETUP:
   npx super-pancake-automation setup

3. QUICK UI INTERFACE:
   npx super-pancake-automation-ui

4. DIRECT USAGE IN EXISTING PROJECTS:
   npm install super-pancake-automation
   # Then import in your test files

Commands:
  init <project>    Create new project with templates
  setup             Interactive project setup wizard
  run [files...]    Run tests (in existing projects)
  generate <type>   Generate test templates
  check             Health check & diagnostics
  browsers          Detect available browsers
  --version, -v     Show version number
  --help, -h        Show help

Standalone Commands:
  npx super-pancake-automation-ui        Launch interactive web UI
  npx super-pancake-automation-init      Quick project setup
  npx super-pancake-automation-setup     Interactive setup wizard

Examples:
  # Create new project (recommended for new users)
  npx super-pancake-automation init my-automation-project
  cd my-automation-project
  npm test

  # Interactive setup
  npx super-pancake-automation setup

  # Quick UI interface
  npx super-pancake-automation-ui

  # Check system compatibility
  npx super-pancake-automation browsers

For more information, visit:
https://github.com/pradapjackie/super-pancake
    `);
}

(async () => {
  // Parse CLI args
  const args = process.argv.slice(2);

  // Handle version flag
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`🥞 Super Pancake Framework v${getVersion()}`);
    process.exit(0);
  }

  // Handle help flag
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    showHelp();
    process.exit(0);
  }

  // Handle init command
  if (args[0] === 'init') {
    const projectName = args[1];
    if (!projectName) {
      console.error('❌ Please provide a project name');
      console.log('Usage: npx super-pancake init <project-name>');
      process.exit(1);
    }

    try {
      const { spawn } = await import('child_process');
      const child = spawn('node', [path.join(__dirname, 'init.js'), projectName], {
        stdio: 'inherit'
      });

      child.on('exit', (code) => {
        process.exit(code);
      });
      return;
    } catch (error) {
      console.error('❌ Error running init command:', error.message);
      process.exit(1);
    }
  }

  // Handle setup command
  if (args[0] === 'setup') {
    try {
      const { spawn } = await import('child_process');
      const child = spawn('node', [path.join(__dirname, 'setup.js')], {
        stdio: 'inherit'
      });

      child.on('exit', (code) => {
        process.exit(code);
      });
      return;
    } catch (error) {
      console.error('❌ Error running setup command:', error.message);
      process.exit(1);
    }
  }

  // Handle run command
  if (args[0] === 'run') {
    try {
      const testFiles = args.slice(1);
      const { spawn } = await import('child_process');
      const runArgs = testFiles.length > 0 ? testFiles : [];
      const child = spawn('node', [path.join(__dirname, 'super-pancake-run.js'), ...runArgs], {
        stdio: 'inherit'
      });

      child.on('exit', (code) => {
        process.exit(code);
      });
      return;
    } catch (error) {
      console.error('❌ Error running tests:', error.message);
      process.exit(1);
    }
  }

  // Handle generate command
  if (args[0] === 'generate') {
    try {
      const generateType = args.slice(1);
      const { spawn } = await import('child_process');
      const child = spawn('node', [path.join(__dirname, 'generate-test.js'), ...generateType], {
        stdio: 'inherit'
      });

      child.on('exit', (code) => {
        process.exit(code);
      });
      return;
    } catch (error) {
      console.error('❌ Error generating tests:', error.message);
      process.exit(1);
    }
  }

  // Handle check command
  if (args[0] === 'check') {
    try {
      const { spawn } = await import('child_process');
      const child = spawn('node', [path.join(__dirname, 'check-install.js')], {
        stdio: 'inherit'
      });

      child.on('exit', (code) => {
        process.exit(code);
      });
      return;
    } catch (error) {
      console.error('❌ Error running health check:', error.message);
      process.exit(1);
    }
  }

  // Handle browsers command
  if (args[0] === 'browsers') {
    try {
      const hasAnyBrowser = await displayBrowserStatus();
      process.exit(hasAnyBrowser ? 0 : 1);
    } catch (error) {
      console.error('❌ Error detecting browsers:', error.message);
      process.exit(1);
    }
  }

  // Legacy URL handling for backward compatibility
  let url = 'http://localhost:8080/form.html';
  for (const arg of args) {
    if (arg.startsWith('--url=')) {
      url = arg.split('=')[1];
      break;
    }
  }

  try {
    // Dynamically import modules
    const { launchChrome } = await import(path.join(__dirname, '../utils/launcher.js'));
    const { runTest } = await import(path.join(__dirname, '../core/runner.js'));

    // Launch and run
    console.log(`🥞 Running Super Pancake test with URL: ${url}`);
    const chrome = await launchChrome({ headless: false });
    await runTest(url);
    await chrome.kill();
  } catch (error) {
    console.error('❌ Error running test:', error.message);
    console.log('\n💡 For better experience, try:');
    console.log('   npx super-pancake-ui    (Interactive UI)');
    console.log('   npx super-pancake --help (Show help)');
    process.exit(1);
  }
})();
