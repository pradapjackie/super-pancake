#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const projectName = process.argv[2];

if (!projectName) {
  console.error('❌ Please provide a project name');
  console.log('Usage: npm init super-pancake-automation@latest my-project');
  process.exit(1);
}

const projectPath = resolve(projectName);

if (existsSync(projectPath)) {
  console.error(`❌ Directory '${projectName}' already exists`);
  process.exit(1);
}

console.log(`🚀 Creating Super Pancake automation project: ${projectName}`);

// Create project directory
mkdirSync(projectPath, { recursive: true });

// Create package.json
const packageJson = {
  "name": projectName,
  "version": "1.0.0",
  "description": "Super Pancake automation testing project",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:generate": "super-pancake-generate",
    "start": "vitest"
  },
  "dependencies": {
    "super-pancake-automation": "latest",
    "vitest": "^3.2.4"
  },
  "keywords": [
    "automation",
    "testing",
    "super-pancake"
  ],
  "author": "",
  "license": "MIT"
};

writeFileSync(
  join(projectPath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Create test.js
const testContent = `import { describe, it, beforeAll, afterAll } from 'vitest';
import { launchChrome, connectToChrome, createSession } from 'super-pancake-automation';
import {
  enableDOM,
  navigateTo,
  fillInput,
  click,
  getText,
  waitForSelector
} from 'super-pancake-automation';
import {
  assertEqual,
  assertContainsText,
} from 'super-pancake-automation';

let chrome, ws, session;

describe('Sample Automation Test', () => {
  beforeAll(async () => {
    console.log('\\n🔷 Starting automation test...');
    chrome = await launchChrome({ headed: true });
    ws = await connectToChrome();
    session = createSession(ws);
    await enableDOM(session);
  }, 30000);

  afterAll(async () => {
    if (ws) ws.close();
    if (chrome) await chrome.kill();
    console.log('\\n🧹 Test complete. Chrome closed.');
  });

  it('should navigate to example.com and verify title', async () => {
    await navigateTo(session, 'https://example.com');
    
    const title = await getText(session, await waitForSelector(session, 'h1'));
    assertContainsText(title, 'Example');
    
    console.log('✅ Test passed: Title contains "Example"');
  });
});
`;

writeFileSync(join(projectPath, 'test.js'), testContent);

// Create super-pancake.config.js
const configContent = `export default {
  // Browser configuration
  browser: {
    headless: false,
    devtools: false,
    slowMo: 100
  },
  
  // Test configuration  
  test: {
    timeout: 30000,
    retries: 1
  },
  
  // Screenshot configuration
  screenshot: {
    enabled: true,
    path: './screenshots',
    onFailure: true
  },
  
  // Report configuration
  report: {
    enabled: true,
    format: 'html',
    path: './test-report.html'
  }
};
`;

writeFileSync(join(projectPath, 'super-pancake.config.js'), configContent);

// Create README.md
const readmeContent = `# ${projectName}

Super Pancake automation testing project

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

# Run with UI
npm run test:ui
\`\`\`

## Configuration

Edit \`super-pancake.config.js\` to customize browser and test settings.

## Documentation

Visit [Super Pancake Documentation](https://github.com/pradapjackie/super-pancake#readme) for more information.
`;

writeFileSync(join(projectPath, 'README.md'), readmeContent);

// Create .gitignore
const gitignoreContent = `node_modules/
test-report.html
screenshots/
*.log
.DS_Store
`;

writeFileSync(join(projectPath, '.gitignore'), gitignoreContent);

console.log(`✅ Successfully created ${projectName}!`);
console.log('');
console.log('Next steps:');
console.log(`  cd ${projectName}`);
console.log('  npm install');
console.log('  npm test');
console.log('');
console.log('Happy testing! 🥞');