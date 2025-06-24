#!/usr/bin/env node

import { fileURLToPath } from 'url';
import path from 'path';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
    // Dynamically import modules
    const { launchChrome } = await import(path.join(__dirname, '../utils/launcher.js'));
    const { runTest } = await import(path.join(__dirname, '../core/runner.js'));

    // Parse CLI args
    const args = process.argv.slice(2);
    let url = 'http://localhost:8080/form.html';

    for (const arg of args) {
        if (arg.startsWith('--url=')) {
            url = arg.split('=')[1];
        }
    }

    // Launch and run
    const chrome = await launchChrome({ headless: false });
    await runTest(url);
    await chrome.kill();
})();