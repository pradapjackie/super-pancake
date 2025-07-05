#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Target location
const testDir = path.resolve(process.cwd(), 'tests');
const testFile = path.join(testDir, 'sample.test.js');

const sampleContent = `import { describe, it, beforeAll, afterAll } from 'vitest';
import { launchChrome } from 'super-pancake-automation/utils/launcher.js';
import { connectToChrome } from 'super-pancake-automation/core/browser.js';
import { createSession } from 'super-pancake-automation/core/session.js';
import { testWithReport } from 'super-pancake-automation/helpers/testWrapper.js';
import { assertContainsText } from 'super-pancake-automation/core/assert.js';

let browser, client, session;

describe('Sample Pancake Test', () => {
  beforeAll(async () => {
    browser = await launchChrome();
    client = await connectToChrome(browser.wsEndpoint);
    session = await createSession(client);
  });

  afterAll(async () => {
    await browser.kill();
  });

  it('should navigate and verify title', async () => {
    await testWithReport('navigate to example.com', async () => {
      await session.navigateTo('https://example.com');
      await assertContainsText(session, 'h1', 'Example Domain');
    }, session);
  });
});
`;

if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
}

if (!fs.existsSync(testFile)) {
    fs.writeFileSync(testFile, sampleContent, 'utf-8');
    console.log('✅ Sample test file created at:', testFile);
} else {
    console.log('⚠️ Sample test file already exists at:', testFile);
}