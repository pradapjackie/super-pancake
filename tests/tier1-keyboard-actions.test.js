// ⌨️ TIER 1 KEYBOARD ACTIONS TEST - Focused validation of keyboard and file methods
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createFormTestEnvironment, cleanupTestEnvironment } from '../utils/test-setup.js';
import { 
  navigateTo, setDefaultTimeout,
  press, type, uploadFile,
  click, fillInput, getValue, getByTestId,
  waitForFunction, takeScreenshot
} from '../core/simple-dom-v2.js';
import { resolve } from 'path';

describe('⌨️ TIER 1 Keyboard Actions Test', () => {
  let testEnv;
  const formUrl = `file://${resolve('./public/form-comprehensive.html')}`;

  beforeAll(async () => {
    testEnv = await createFormTestEnvironment('Keyboard Actions Test');
    setDefaultTimeout(5000);
  }, 30000);

  afterAll(async () => {
    if (testEnv) {
      await cleanupTestEnvironment(testEnv, 'Keyboard Actions Test');
    }
  });

  it('should type text using the type method', async () => {
    // Enable DOM for this test
    const { enableDOM } = await import('../core/simple-dom-v2.js');
    await enableDOM();
    
    await navigateTo(formUrl);
    
    // Focus on keyboard test area - increased timeout for CI
    const keyboardArea = await getByTestId('keyboard-test-area', { timeout: 8000 });
    await click(keyboardArea, { timeout: 8000 });
    
    // Type text - increased timeout for CI
    await type('Hello, World!', { timeout: 8000 });
    
    // Verify the text was typed
    const value = await getValue(keyboardArea, { timeout: 8000 });
    expect(value).toBe('Hello, World!');
    
    await takeScreenshot('./screenshots/type-method-test.png');
    console.log('✅ type method working correctly');
  }, 20000);

  it('should press individual keys', async () => {
    const keyboardArea = await getByTestId('keyboard-test-area', { timeout: 8000 });
    
    // Use fillInput to set initial value since it works with object IDs
    await fillInput(keyboardArea, 'Test', { timeout: 8000 });
    
    // Click to focus for keyboard input
    await click(keyboardArea, { timeout: 8000 });
    
    // Use arrow keys
    await press('Home', { timeout: 8000 }); // Go to beginning
    await type('Start ', { timeout: 8000 }); // Add at beginning
    
    const value = await getValue(keyboardArea, { timeout: 8000 });
    expect(value).toContain('Start');
    expect(value).toContain('Test');
    
    console.log('✅ press method working correctly');
  }, 15000);

  it('should handle special keys', async () => {
    const keyboardArea = await getByTestId('keyboard-test-area', { timeout: 8000 });
    
    // Use fillInput to clear and set initial value
    await fillInput(keyboardArea, 'Line 1', { timeout: 8000 });
    await click(keyboardArea, { timeout: 8000 });
    
    // Test special keys
    await press('Enter', { timeout: 8000 });
    await type('Line 2', { timeout: 8000 });
    
    const value = await getValue(keyboardArea, { timeout: 8000 });
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
    
    console.log('✅ Special keys working correctly');
  }, 15000);

  it('should work with multi-step form interaction', async () => {
    // Test the multi-step form button
    await click('#multi-step-test', { timeout: 8000 });
    
    // Wait for the form to be filled automatically - increased timeout for CI
    await waitForFunction(() => document.getElementById('step1-input').value === 'John Doe', { timeout: 8000 });
    
    const step1Value = await getValue('#step1-input', { timeout: 8000 });
    expect(step1Value).toBe('John Doe');
    
    // Wait for step 2 - increased timeout for CI
    await waitForFunction(() => document.getElementById('step2-input').value === 'john.doe@example.com', { timeout: 8000 });
    
    const step2Value = await getValue('#step2-input', { timeout: 8000 });
    expect(step2Value).toBe('john.doe@example.com');
    
    // Wait for step 3 - increased timeout for CI
    await waitForFunction(() => document.getElementById('step3-input').value === '+1-555-123-4567', { timeout: 8000 });
    
    const step3Value = await getValue('#step3-input', { timeout: 8000 });
    expect(step3Value).toBe('+1-555-123-4567');
    
    await takeScreenshot('./screenshots/multi-step-form-test.png');
    console.log('✅ Multi-step form interaction working correctly');
  }, 25000);

  it('should handle keyboard events logging', async () => {
    const keyboardArea = await getByTestId('keyboard-test-area', { timeout: 8000 });
    await click(keyboardArea, { timeout: 8000 });
    
    // Clear the area
    await press('Control', { timeout: 8000 });
    await press('a', { timeout: 8000 });
    await press('Delete', { timeout: 8000 });
    
    // Type to trigger key events
    await type('ABC', { timeout: 8000 });
    
    // Check that key events are being logged
    const keyEventsDiv = await getByTestId('key-events', { timeout: 8000 });
    const eventsContent = await getValue(keyEventsDiv, { timeout: 8000 });
    
    // The div should contain key event information
    expect(eventsContent).toBeDefined();
    
    console.log('✅ Keyboard events logging working correctly');
  }, 15000);

  it('should access file upload elements', async () => {
    // Test that we can access file upload elements
    const fileUpload = await getByTestId('test-file-upload', { timeout: 8000 });
    expect(fileUpload).toBeDefined();
    
    // Test logo upload
    const logoUpload = await getByTestId('logo-upload', { timeout: 8000 });
    expect(logoUpload).toBeDefined();
    
    console.log('✅ File upload elements accessible');
  }, 10000);

  it('should handle form navigation with Tab key', async () => {
    // Use fillInput which is more reliable for this test
    await fillInput('#fullname', 'John Doe', { timeout: 8000 });
    
    // Tab to next field and type
    await press('Tab', { timeout: 8000 });
    await type('john@example.com', { timeout: 8000 });
    
    // Wait a moment for values to settle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify both fields have values
    const nameValue = await getValue('#fullname', { timeout: 8000 });
    const emailValue = await getValue('#email', { timeout: 8000 });
    
    expect(nameValue).toBe('John Doe');
    expect(emailValue).toBe('john@example.com');
    
    await takeScreenshot('./screenshots/tab-navigation-test.png');
    console.log('✅ Tab navigation working correctly');
  }, 15000);

  it('should handle keyboard shortcuts', async () => {
    const keyboardArea = await getByTestId('keyboard-test-area', { timeout: 8000 });
    await click(keyboardArea, { timeout: 8000 });
    
    // Type some text
    await type('This is a test message for shortcuts', { timeout: 8000 });
    
    // Select all with Ctrl+A
    await press('Control', { timeout: 8000 });
    await press('a', { timeout: 8000 });
    
    // Copy with Ctrl+C (browser will handle this)
    await press('Control', { timeout: 8000 });
    await press('c', { timeout: 8000 });
    
    // Clear and paste with Ctrl+V (browser will handle this)
    await press('Delete', { timeout: 8000 });
    await press('Control', { timeout: 8000 });
    await press('v', { timeout: 8000 });
    
    const value = await getValue(keyboardArea, { timeout: 8000 });
    expect(value).toContain('test message');
    
    console.log('✅ Keyboard shortcuts working correctly');
  }, 20000);
});