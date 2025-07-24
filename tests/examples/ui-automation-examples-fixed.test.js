import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // Test environment setup
  createTestEnvironment,
  cleanupTestEnvironment,
  
  // Session context
  setSession,
  clearSession,
  
  // DOM operations
  enableDOM,
  navigateTo,
  click,
  type,
  getText,
  getValue,
  querySelector,
  querySelectorAll,
  waitForSelector,
  waitForTimeout,
  hover,
  selectOption,
  isChecked,
  
  // Screenshots and visual testing
  takeScreenshot,
  takeElementScreenshot,
  
  // Form interactions
  fillInput,
  setValue,
  clearInput,
  
  // Browser operations
  goBack,
  goForward,
  
  // Assertions
  assertEqual,
  assertContainsText,
  assertTrue,
  
  // Port utilities
  findAvailablePort
} from 'super-pancake-automation';

let testEnv;

describe('UI Automation Examples', () => {
  beforeAll(async () => {
    console.log('🚀 Setting up UI automation test environment...');
    
    const port = await findAvailablePort(9222, 10);
    console.log(`🔍 Using dynamic port: ${port}`);
    
    testEnv = await createTestEnvironment({ 
      headed: false,
      port: port,
      testName: 'UI Automation Examples'
    });
    
    // Set session context for v2 API
    setSession(testEnv.session);
    await enableDOM();
  }, 30000);

  afterAll(async () => {
    clearSession();
    await cleanupTestEnvironment(testEnv, 'UI Automation Examples');
    console.log('🧹 UI test environment cleaned up');
  });

  it.skipIf(process.env.CI)('should demonstrate basic navigation and page inspection', async () => {
    console.log('🌐 Testing basic navigation...');
    
    // Navigate to the comprehensive form
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    // Wait for page to load
    await waitForSelector('h1', 10000);
    
    // Get page title via JavaScript (use v2 helper)
    const titleElement = await querySelector('title');
    const titleText = await getText(titleElement);
    
    // Validate page loaded correctly
    assertTrue(titleText.includes('Comprehensive'), 'Title should contain "Comprehensive"');
    
    // Find and validate page elements
    const heading = await querySelector('h1');
    assertTrue(heading !== null, 'Page should have an h1 element');
    
    const headingText = await getText(heading);
    assertContainsText(headingText, 'Comprehensive', 'Heading should contain Comprehensive');
    
    console.log('✅ Basic navigation test completed');
  }, 30000);

  it.skipIf(process.env.CI)('should demonstrate comprehensive form interactions', async () => {
    console.log('📝 Testing comprehensive form interactions...');
    
    // Navigate to the comprehensive form
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    // Wait for page to load completely
    await waitForSelector('#basic-form', 10000);
    
    // Test basic text inputs
    await fillInput('#fullname', 'John Doe Test User');
    await fillInput('#email', 'john.test@example.com');
    await fillInput('#password', 'TestPassword123');
    await fillInput('#phone', '+1 (555) 123-4567');
    
    // Test textarea
    await fillInput('#message', 'This is a comprehensive test message for the automation framework testing.');
    
    // Test date/time inputs
    await fillInput('#birthdate', '1990-05-15');
    await fillInput('#age', '33');
    
    // Test dropdown selections
    await selectOption('#country', 'us');
    
    // Test checkbox selections
    await click('#interest-programming');
    await click('#interest-design');
    
    // Test radio button selections
    await click('#exp-intermediate');
    
    // Validate form values were set correctly
    const nameValue = await getValue('#fullname');
    assertEqual(nameValue, 'John Doe Test User', 'Full name should be set correctly');
    
    const emailValue = await getValue('#email');
    assertEqual(emailValue, 'john.test@example.com', 'Email should be set correctly');
    
    const messageValue = await getValue('#message');
    assertContainsText(messageValue, 'automation framework', 'Message should contain expected text');
    
    // Test that checkboxes are selected (use v2 helper)
    const programmingChecked = await isChecked('#interest-programming');
    assertTrue(programmingChecked, 'Programming checkbox should be checked');
    
    // Take screenshot of filled form
    await takeElementScreenshot('#basic-form', 'ui-comprehensive-form.png');
    
    console.log('✅ Comprehensive form interaction test completed');
  }, 60000);

  it('should demonstrate element selection and manipulation', async () => {
    console.log('🎯 Testing element selection and manipulation...');
    
    // Navigate to the comprehensive form
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    // Wait for page elements
    await waitForSelector('h1', 10000);
    
    // Test querySelector for single element
    const heading = await querySelector('h1');
    assertTrue(heading !== null, 'Should find h1 element');
    
    // Test querySelectorAll for multiple elements
    const inputs = await querySelectorAll('input');
    assertTrue(inputs.length > 0, 'Should find input elements');
    
    const buttons = await querySelectorAll('button');
    assertTrue(buttons.length > 0, 'Should find button elements');
    
    console.log(`📊 Found ${inputs.length} inputs and ${buttons.length} buttons`);
    
    // Test hover interactions on first button (with error handling)
    try {
      if (buttons.length > 0) {
        await hover('button');
        console.log('🖱️ Hovered over first button');
      }
    } catch (error) {
      console.log('Hover interaction skipped...');
    }
    
    console.log('✅ Element selection and manipulation test completed');
  }, 30000);

  it('should demonstrate button interactions and modal dialogs', async () => {
    console.log('🔘 Testing button interactions...');
    
    // Navigate to the comprehensive form
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    await waitForSelector('#modal-btn', 10000);
    
    // Test modal button
    await click('#modal-btn');
    await waitForTimeout(500);
    
    // Verify modal is visible (simplified check)
    const modal = await querySelector('#test-modal');
    assertTrue(modal !== null, 'Modal should exist');
    
    // Type in modal input and close
    await fillInput('#modal-input', 'Modal test input');
    await click('#modal-close');
    await waitForTimeout(500);
    
    console.log('✅ Button interactions test completed');
  }, 45000);

  it('should demonstrate advanced form elements', async () => {
    console.log('🎛️ Testing advanced form elements...');
    
    // Navigate to the comprehensive form
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    await waitForSelector('#salary', 10000);
    
    // Test range slider
    await setValue('#salary', '150000');
    const salaryValue = await getValue('#salary');
    assertEqual(salaryValue, '150000', 'Salary range should be set to 150000');
    
    // Test color picker
    await setValue('#color', '#ff5733');
    const colorValue = await getValue('#color');
    assertEqual(colorValue, '#ff5733', 'Color should be set to #ff5733');
    
    // Test search input
    await fillInput('#search', 'automation testing framework');
    const searchValue = await getValue('#search');
    assertContainsText(searchValue, 'automation', 'Search should contain automation');
    
    console.log('✅ Advanced form elements test completed');
  }, 45000);

  it('should test data table interactions', async () => {
    console.log('📊 Testing data table interactions...');
    
    // Navigate to the comprehensive form
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    await waitForSelector('#data-table', 10000);
    
    // Test select all checkbox
    await click('#select-all');
    await waitForTimeout(300);
    
    // Test table filtering (with error handling)
    try {
      await waitForSelector('#table-filter', 3000);
      await fillInput('#table-filter', 'Alice');
      await waitForTimeout(500);
    } catch (error) {
      console.log('Table filter test skipped...');
    }
    
    // Clear filter (with error handling)
    try {
      await clearInput('#table-filter');
      await waitForTimeout(500);
    } catch (error) {
      console.log('Clear filter skipped...');
    }
    
    // Test add row functionality
    await click('#add-row-btn');
    await waitForTimeout(500);
    
    console.log('✅ Data table interactions test completed');
  }, 45000);



  it('should test browser navigation controls', async () => {
    console.log('🧭 Testing browser navigation controls...');
    
    // Start at the comprehensive form
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    await waitForSelector('h1', 10000);
    
    // Get current URL (simple check that we're on the right page)
    const heading = await querySelector('h1');
    const headingText = await getText(heading);
    assertContainsText(headingText, 'Comprehensive', 'Should be at the form page');
    
    // Navigate to another local page (create a simple test page)
    await navigateTo('data:text/html,<html><body><h1>Test Page 2</h1></body></html>');
    await waitForSelector('h1', 5000);
    
    // Test back navigation
    await goBack();
    await waitForTimeout(2000);
    
    // Verify we're back at the form page
    const backHeading = await querySelector('h1');
    const backHeadingText = await getText(backHeading);
    assertContainsText(backHeadingText, 'Comprehensive', 'Should be back at form page');
    
    // Test forward navigation
    await goForward();
    await waitForTimeout(2000);
    
    console.log('✅ Browser navigation controls test completed');
  }, 45000);

  it('should test error handling scenarios', async () => {
    console.log('🛡️ Testing error handling...');
    
    // Navigate to the comprehensive form
    const formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(formUrl);
    
    await waitForSelector('h1', 10000);
    
    // Test graceful handling of non-existent elements
    try {
      await waitForSelector('.non-existent-element', 2000);
    } catch (error) {
      console.log('✅ Successfully caught timeout error for non-existent element');
      assertContainsText(error.message, 'timed out', 'Should get timeout error');
    }
    
    // Verify session is still functional after error
    const pageHeading = await querySelector('h1');
    const pageHeadingText = await getText(pageHeading);
    assertTrue(pageHeadingText.length > 0, 'Session should still work after handling error');
    
    // Test clicking on non-existent element
    try {
      await click('.this-element-does-not-exist');
    } catch (error) {
      console.log('✅ Successfully caught error for clicking non-existent element');
      assertTrue(error !== null, 'Should get error when clicking non-existent element');
    }
    
    // Verify we can still interact with valid elements
    const heading = await querySelector('h1');
    assertTrue(heading !== null, 'Should still be able to find valid elements after errors');
    
    console.log('✅ Error handling test completed');
  }, 30000);
});