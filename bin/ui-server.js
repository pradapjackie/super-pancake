#!/usr/bin/env node
import express from 'express';
import path from 'path';
import fs from 'fs';
import open from 'open';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Find the package root - handle both dev and installed package scenarios
let packageRoot;
try {
  // Try to find package.json starting from current directory
  let currentDir = __dirname;
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.name === 'super-pancake-automation') {
        packageRoot = currentDir;
        break;
      }
    }
    currentDir = path.dirname(currentDir);
  }
  
  // Fallback to relative path
  if (!packageRoot) {
    packageRoot = path.join(__dirname, '..');
  }
} catch (error) {
  // Final fallback
  packageRoot = path.join(__dirname, '..');
}

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(packageRoot, 'public')));

// Main UI route - serve the HTML file
app.get('/', (req, res) => {
    const indexPath = path.join(packageRoot, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        console.error(`❌ index.html not found at: ${indexPath}`);
        console.error(`Package root: ${packageRoot}`);
        res.status(404).send(`
            <html>
                <head><title>UI Not Found</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>🔍 UI Files Not Found</h1>
                    <p>Could not find the UI files at: <code>${indexPath}</code></p>
                    <p>Package root detected as: <code>${packageRoot}</code></p>
                    <p>Please ensure the package is properly installed.</p>
                </body>
            </html>
        `);
    }
});

// Serve the test report if it exists
app.get('/automationTestReport.html', (req, res) => {
    const reportPath = path.join(process.cwd(), 'automationTestReport.html');
    try {
        res.sendFile(reportPath);
    } catch (error) {
        res.status(404).send(`
            <html>
                <head><title>Report Not Found</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>🔍 Test Report Not Found</h1>
                    <p>The test report has not been generated yet.</p>
                    <p>Please run some tests first to generate the report.</p>
                    <a href="/" style="color: #16a34a; text-decoration: none;">← Back to Test Runner</a>
                </body>
            </html>
        `);
    }
});

app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`🚀 Super Pancake UI Server running at ${url}`);
    console.log(`📱 Opening browser...`);
    open(url);
});