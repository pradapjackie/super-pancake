#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

console.log('🥞 Super Pancake Automation Setup\n');

async function setup() {
  try {
    // Basic configuration questions
    const projectName = await question('Project name (default: my-super-pancake-project): ') || 'my-super-pancake-project';
    const author = await question('Author name (optional): ') || '';
    
    console.log('\n🔧 Browser Configuration');
    const headless = await question('Run tests in headless mode? (y/N): ');
    const slowMo = await question('Slow motion delay in ms (default: 100): ') || '100';
    const devtools = await question('Open DevTools automatically? (y/N): ');
    
    console.log('\n📸 Screenshot Configuration');
    const screenshots = await question('Enable screenshots? (Y/n): ');
    const screenshotOnFailure = await question('Take screenshot on test failure? (Y/n): ');
    const screenshotPath = await question('Screenshots directory (default: ./screenshots): ') || './screenshots';
    
    console.log('\n📊 Reporting Configuration');
    const htmlReport = await question('Generate HTML test reports? (Y/n): ');
    const reportPath = await question('Report file path (default: ./test-report.html): ') || './test-report.html';
    const openReport = await question('Auto-open report after tests? (y/N): ');
    
    console.log('\n⚡ Performance Configuration');
    const timeout = await question('Test timeout in ms (default: 30000): ') || '30000';
    const retries = await question('Test retry count (default: 1): ') || '1';
    const parallel = await question('Run tests in parallel? (y/N): ');
    
    console.log('\n🔍 Advanced Options');
    const videoRecording = await question('Enable video recording? (y/N): ');
    const networkLogs = await question('Capture network logs? (y/N): ');
    const consoleLogs = await question('Capture console logs? (Y/n): ');
    
    rl.close();
    
    // Create project directory
    const projectPath = join(process.cwd(), projectName);
    
    if (existsSync(projectPath)) {
      console.log(`\n❌ Directory '${projectName}' already exists!`);
      console.log('Please choose a different project name or remove the existing directory.');
      process.exit(1);
    }
    
    console.log(`\n🚀 Setting up project: ${projectName}`);
    mkdirSync(projectPath, { recursive: true });
    
    // Create directories
    mkdirSync(join(projectPath, 'tests'), { recursive: true });
    if (screenshots.toLowerCase() !== 'n') {
      mkdirSync(join(projectPath, screenshotPath.replace('./', '')), { recursive: true });
    }
    
    // Generate package.json
    const packageJson = {
      name: projectName,
      version: '1.0.0',
      description: 'Super Pancake automation testing project',
      main: 'index.js',
      type: 'module',
      scripts: {
        test: 'vitest',
        'test:run': 'vitest run',
        'test:watch': 'vitest watch',
        'test:ui': 'vitest --ui',
        'test:report': 'vitest run && super-pancake-generate',
        start: 'vitest'
      },
      dependencies: {
        'super-pancake-automation': 'latest',
        'vitest': '^3.2.4'
      },
      keywords: ['automation', 'testing', 'super-pancake'],
      author: author,
      license: 'MIT'
    };
    
    writeFileSync(join(projectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // Generate comprehensive config
    const config = {
      browser: {
        headless: headless.toLowerCase() === 'y',
        devtools: devtools.toLowerCase() === 'y',
        slowMo: parseInt(slowMo)
      },
      test: {
        timeout: parseInt(timeout),
        retries: parseInt(retries),
        parallel: parallel.toLowerCase() === 'y'
      },
      screenshot: {
        enabled: screenshots.toLowerCase() !== 'n',
        onFailure: screenshotOnFailure.toLowerCase() !== 'n',
        path: screenshotPath,
        quality: 90,
        fullPage: true
      },
      report: {
        enabled: htmlReport.toLowerCase() !== 'n',
        path: reportPath,
        autoOpen: openReport.toLowerCase() === 'y',
        format: 'html'
      },
      video: {
        enabled: videoRecording.toLowerCase() === 'y',
        path: './videos',
        quality: 'medium'
      },
      logging: {
        network: networkLogs.toLowerCase() === 'y',
        console: consoleLogs.toLowerCase() !== 'n',
        level: 'info'
      },
      timeouts: {
        testTimeout: parseInt(timeout),
        pageTimeout: 30000,
        elementTimeout: 10000
      }
    };
    
    const configContent = `export default ${JSON.stringify(config, null, 2)};`;
    writeFileSync(join(projectPath, 'super-pancake.config.js'), configContent);
    
    // Generate comprehensive sample test
    const sampleTest = `import { describe, it, beforeAll, afterAll } from 'vitest';
import { launchChrome, connectToChrome, createSession } from 'super-pancake-automation';
import {
  enableDOM,
  navigateTo,
  fillInput,
  click,
  getText,
  waitForSelector,
  takeElementScreenshot
} from 'super-pancake-automation';
import {
  assertEqual,
  assertContainsText,
} from 'super-pancake-automation';
import { addTestResult, writeReport, testWithReport } from 'super-pancake-automation';

let chrome, ws, session;

describe('${projectName} - Sample Test Suite', () => {
  beforeAll(async () => {
    console.log('\\n🔷 Starting ${projectName} tests...');
    chrome = await launchChrome({ 
      headed: ${!config.browser.headless}, 
      devtools: ${config.browser.devtools},
      slowMo: ${config.browser.slowMo}
    });
    ws = await connectToChrome();
    session = createSession(ws);
    await enableDOM(session);
  }, ${config.timeouts.testTimeout});

  afterAll(async () => {
    if (ws) ws.close();
    if (chrome) await chrome.kill();
    ${config.report.enabled ? 'writeReport();' : ''}
    console.log('\\n🧹 Test complete. Chrome closed.');
  });

  it('should navigate to example.com and verify title', async () => {
    await testWithReport('should navigate to example.com and verify title', async () => {
      await navigateTo(session, 'https://example.com');
      
      const title = await getText(session, await waitForSelector(session, 'h1'));
      assertContainsText(title, 'Example');
      
      ${config.screenshot.enabled ? `
      // Take screenshot on success
      await takeElementScreenshot(session, 'h1', '${config.screenshot.path}/example-title.png');
      ` : ''}
      
      console.log('✅ Test passed: Title contains "Example"');
    }, session, import.meta.url);
  });

  it('should demonstrate form interaction', async () => {
    await testWithReport('should demonstrate form interaction', async () => {
      await navigateTo(session, 'https://httpbin.org/forms/post');
      
      // Fill form fields
      await fillInput(session, 'input[name="custname"]', 'Test User');
      await fillInput(session, 'input[name="custtel"]', '1234567890');
      await fillInput(session, 'input[name="custemail"]', 'test@example.com');
      
      ${config.screenshot.enabled ? `
      // Take screenshot before submit
      await takeElementScreenshot(session, 'form', '${config.screenshot.path}/form-filled.png');
      ` : ''}
      
      // Submit form
      await click(session, 'input[type="submit"]');
      
      // Verify redirect
      const result = await getText(session, await waitForSelector(session, 'pre'));
      assertContainsText(result, 'Test User');
      
      console.log('✅ Form interaction test passed');
    }, session, import.meta.url);
  });
});
`;
    
    writeFileSync(join(projectPath, 'tests', 'sample.test.js'), sampleTest);
    
    // Generate README
    const readme = `# ${projectName}

Super Pancake automation testing project with advanced configuration.

## Features

- ✅ **Browser Automation**: Chrome DevTools Protocol
- 📸 **Screenshots**: ${config.screenshot.enabled ? 'Enabled' : 'Disabled'}${config.screenshot.onFailure ? ' (on failure)' : ''}
- 📊 **HTML Reports**: ${config.report.enabled ? 'Enabled' : 'Disabled'}
- 🎥 **Video Recording**: ${config.video.enabled ? 'Enabled' : 'Disabled'}
- 🔍 **Network Logs**: ${config.logging.network ? 'Enabled' : 'Disabled'}
- 🖥️ **Console Logs**: ${config.logging.console ? 'Enabled' : 'Disabled'}
- ⚡ **Parallel Testing**: ${config.test.parallel ? 'Enabled' : 'Disabled'}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
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
\`\`\`

## Configuration

Edit \`super-pancake.config.js\` to customize:

- Browser settings (headless, devtools, slowMo)
- Screenshot options (path, quality, on failure)
- Report generation (HTML, auto-open)
- Video recording settings
- Logging preferences
- Timeouts and retries

## Directory Structure

\`\`\`
${projectName}/
├── tests/              # Test files
├── ${config.screenshot.path.replace('./', '')}/           # Screenshots${config.screenshot.enabled ? '' : ' (disabled)'}
${config.video.enabled ? `├── videos/             # Video recordings` : ''}
├── super-pancake.config.js  # Configuration
├── package.json
└── README.md
\`\`\`

## Documentation

Visit [Super Pancake Documentation](https://github.com/pradapjackie/super-pancake#readme) for more information.
`;
    
    writeFileSync(join(projectPath, 'README.md'), readme);
    
    // Generate .gitignore
    const gitignore = `node_modules/
${reportPath}
${screenshotPath}
${config.video.enabled ? 'videos/' : ''}
*.log
.DS_Store
.env
.env.local
`;
    
    writeFileSync(join(projectPath, '.gitignore'), gitignore);
    
    // Generate environment template
    const envTemplate = `# Super Pancake Environment Configuration
# Copy this file to .env and customize as needed

# Browser Configuration
HEADLESS=${config.browser.headless}
DEVTOOLS=${config.browser.devtools}
SLOW_MO=${config.browser.slowMo}

# Test Configuration
TEST_TIMEOUT=${config.test.timeout}
TEST_RETRIES=${config.test.retries}

# Screenshot Configuration
SCREENSHOT_ENABLED=${config.screenshot.enabled}
SCREENSHOT_ON_FAILURE=${config.screenshot.onFailure}
SCREENSHOT_PATH=${config.screenshot.path}

# Report Configuration
HTML_REPORT=${config.report.enabled}
AUTO_OPEN_REPORT=${config.report.autoOpen}
`;
    
    writeFileSync(join(projectPath, '.env.example'), envTemplate);
    
    console.log('✅ Project setup complete!\n');
    console.log('📋 Summary:');
    console.log(`   Project: ${projectName}`);
    console.log(`   Browser: ${config.browser.headless ? 'Headless' : 'Headed'} mode`);
    console.log(`   Screenshots: ${config.screenshot.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   HTML Reports: ${config.report.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Video Recording: ${config.video.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Network Logs: ${config.logging.network ? 'Enabled' : 'Disabled'}`);
    console.log('\n🚀 Next steps:');
    console.log(`   cd ${projectName}`);
    console.log('   npm install');
    console.log('   npm test');
    console.log('\nHappy testing! 🥞');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();