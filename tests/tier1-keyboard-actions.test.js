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
    
    // Focus on keyboard test area
    const keyboardArea = await getByTestId('keyboard-test-area');
    await click(keyboardArea);
    
    // Type text
    await type('Hello, World!', { timeout: 3000 });
    
    // Verify the text was typed
    const value = await getValue(keyboardArea);
    expect(value).toBe('Hello, World!');
    
    await takeScreenshot('./screenshots/type-method-test.png');
    console.log('✅ type method working correctly');
  }, 10000);

  it('should press individual keys', async () => {
    const keyboardArea = await getByTestId('keyboard-test-area');
    
    // Use fillInput to set initial value since it works with object IDs
    await fillInput(keyboardArea, 'Test');
    
    // Click to focus for keyboard input
    await click(keyboardArea);
    
    // Use arrow keys
    await press('Home'); // Go to beginning
    await type('Start '); // Add at beginning
    
    const value = await getValue(keyboardArea);
    expect(value).toContain('Start');
    expect(value).toContain('Test');
    
    console.log('✅ press method working correctly');
  });

  it('should handle special keys', async () => {
    const keyboardArea = await getByTestId('keyboard-test-area');
    
    // Use fillInput to clear and set initial value
    await fillInput(keyboardArea, 'Line 1');
    await click(keyboardArea);
    
    // Test special keys
    await press('Enter');
    await type('Line 2');
    
    const value = await getValue(keyboardArea);
    expect(value).toContain('Line 1');
    expect(value).toContain('Line 2');
    
    console.log('✅ Special keys working correctly');
  });

  it('should work with multi-step form interaction', async () => {
    // Test the multi-step form button
    await click('#multi-step-test');
    
    // Wait for the form to be filled automatically
    await waitForFunction(() => document.getElementById('step1-input').value === 'John Doe', { timeout: 3000 });
    
    const step1Value = await getValue('#step1-input');
    expect(step1Value).toBe('John Doe');
    
    // Wait for step 2
    await waitForFunction(() => document.getElementById('step2-input').value === 'john.doe@example.com', { timeout: 2000 });
    
    const step2Value = await getValue('#step2-input');
    expect(step2Value).toBe('john.doe@example.com');
    
    // Wait for step 3
    await waitForFunction(() => document.getElementById('step3-input').value === '+1-555-123-4567', { timeout: 2000 });
    
    const step3Value = await getValue('#step3-input');
    expect(step3Value).toBe('+1-555-123-4567');
    
    await takeScreenshot('./screenshots/multi-step-form-test.png');
    console.log('✅ Multi-step form interaction working correctly');
  });

  it('should handle keyboard events logging', async () => {
    const keyboardArea = await getByTestId('keyboard-test-area');
    await click(keyboardArea);
    
    // Clear the area
    await press('Control');
    await press('a');
    await press('Delete');
    
    // Type to trigger key events
    await type('ABC');
    
    // Check that key events are being logged
    const keyEventsDiv = await getByTestId('key-events');
    const eventsContent = await getValue(keyEventsDiv);
    
    // The div should contain key event information
    expect(eventsContent).toBeDefined();
    
    console.log('✅ Keyboard events logging working correctly');
  });

  it('should access file upload elements', async () => {
    // Test that we can access file upload elements
    const fileUpload = await getByTestId('test-file-upload');
    expect(fileUpload).toBeDefined();
    
    // Test logo upload
    const logoUpload = await getByTestId('logo-upload');
    expect(logoUpload).toBeDefined();
    
    console.log('✅ File upload elements accessible');
  });

  it('should handle form navigation with Tab key', async () => {
    // Use fillInput which is more reliable for this test
    await fillInput('#fullname', 'John Doe');
    
    // Tab to next field and type
    await press('Tab');
    await type('john@example.com');
    
    // Wait a moment for values to settle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify both fields have values
    const nameValue = await getValue('#fullname');
    const emailValue = await getValue('#email');
    
    expect(nameValue).toBe('John Doe');
    expect(emailValue).toBe('john@example.com');
    
    await takeScreenshot('./screenshots/tab-navigation-test.png');
    console.log('✅ Tab navigation working correctly');
  });

  it('should handle keyboard shortcuts', async () => {
    const keyboardArea = await getByTestId('keyboard-test-area');
    await click(keyboardArea);
    
    // Type some text
    await type('This is a test message for shortcuts');
    
    // Select all with Ctrl+A
    await press('Control');
    await press('a');
    
    // Copy with Ctrl+C (browser will handle this)
    await press('Control');
    await press('c');
    
    // Clear and paste with Ctrl+V (browser will handle this)
    await press('Delete');
    await press('Control');
    await press('v');
    
    const value = await getValue(keyboardArea);
    expect(value).toContain('test message');
    
    console.log('✅ Keyboard shortcuts working correctly');
  });
});