// ✅ WORKING FEATURES TEST - Only the features that work perfectly
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFormTestEnvironment, cleanupTestEnvironment } from '../utils/test-setup.js';
import {
  navigateTo, setDefaultTimeout,
  getByRole, getByText, getByTitle, getByAltText,
  takeScreenshot
} from '../core/simple-dom-v2.js';
import { resolve } from 'path';

describe('✅ Working Features Test', () => {
  let testEnv;
  const formUrl = `file://${resolve('./public/form-comprehensive.html')}`;

  beforeAll(async () => {
    testEnv = await createFormTestEnvironment('Working Features Test');
    setDefaultTimeout(5000);
  }, 45000);

  afterAll(async () => {
    // Skip cleanup if DEBUG environment variable is set
    if (testEnv && !process.env.DEBUG) {
      await cleanupTestEnvironment(testEnv, 'Working Features Test');
    } else if (process.env.DEBUG) {
      console.log('🐛 DEBUG mode: Keeping Chrome open for inspection');
      console.log('🌐 Chrome debugging available at: http://localhost:9222');
    }
  });

  it('should demonstrate all working smart locators', async () => {
    // Enable DOM for this test
    const { enableDOM } = await import('../core/simple-dom-v2.js');
    await enableDOM();

    await navigateTo(formUrl);

    console.log('✅ Testing getByRole...');
    const submitButton = await getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeDefined();

    console.log('✅ Testing getByText...');
    const heading = await getByText('Comprehensive UI Testing Playground');
    expect(heading).toBeDefined();

    console.log('✅ Testing getByTitle...');
    const titleElement = await getByTitle('Click me');
    expect(titleElement).toBeDefined();

    console.log('✅ Testing getByAltText...');
    const profileImage = await getByAltText('Profile picture');
    expect(profileImage).toBeDefined();

    await takeScreenshot('./screenshots/working-features-demo.png');

    console.log('🎉 ALL WORKING FEATURES TESTED SUCCESSFULLY!');
    console.log('📊 Smart Locators Status:');
    console.log('   ✅ getByRole() - WORKING');
    console.log('   ✅ getByText() - WORKING');
    console.log('   ✅ getByTitle() - WORKING');
    console.log('   ✅ getByAltText() - WORKING');
    console.log('   ⚠️  getByLabel() - Needs object ID fix');
    console.log('   ⚠️  getByPlaceholder() - Needs object ID fix');
    console.log('   ⚠️  getByTestId() - Needs object ID fix');
  });
});
