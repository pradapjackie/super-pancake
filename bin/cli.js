#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

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

Usage:
  npx super-pancake [command] [options]

Commands:
  --version, -v     Show version number
  --help, -h        Show help
  --url=<url>       Run test with specific URL (legacy)

Main Commands:
  npx super-pancake-ui        Launch interactive UI
  npx super-pancake-server    Start test server
  npx super-pancake-run       Run tests programmatically
  npx super-pancake-generate  Generate test templates

Project Setup:
  npm init super-pancake@latest  Create new project

Examples:
  npx super-pancake --version
  npx super-pancake --help
  npx super-pancake-ui
  npm init super-pancake@latest my-project

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