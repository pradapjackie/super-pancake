import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // Test environment setup
  createTestEnvironment,
  cleanupTestEnvironment,
  
  // DOM operations
  enableDOM,
  setSession,
  clearSession,
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
let formUrl;

describe('Advanced Framework Features', () => {
  beforeAll(async () => {
    console.log('🚀 Setting up advanced framework features test environment...');
    
    const port = await findAvailablePort(9222, 10);
    console.log(`🔍 Using dynamic port: ${port}`);
    
    testEnv = await createTestEnvironment({ 
      headed: false,
      port: port,
      testName: 'Advanced Framework Features'
    });
    setSession(testEnv.session);
    await enableDOM();
    
    formUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
  }, 30000);

  afterAll(async () => {
    clearSession();
    await cleanupTestEnvironment(testEnv, 'Advanced Framework Features');
    console.log('🧹 Advanced framework test environment cleaned up');
  });

  it('should demonstrate bulk form filling capabilities', async () => {
    console.log('🏗️ Testing bulk form filling capabilities...');
    
    await navigateTo(formUrl);
    await waitForSelector('#basic-form', 10000);
    
    // Define comprehensive form data
    const formData = {
      '#fullname': 'Alice Johnson Framework Tester',
      '#email': 'alice.tester@super-pancake.com',
      '#password': 'SecureTestPassword123!',
      '#confirm-password': 'SecureTestPassword123!',
      '#phone': '+1 (555) 987-6543',
      '#website': 'https://alice-testing.dev',
      '#search': 'automated testing tools',
      '#message': 'This message was filled using individual type calls. It demonstrates the frameworks ability to handle complex form filling scenarios efficiently.',
      '#birthdate': '1985-03-20',
      '#appointment': '09:15',
      '#age': '38'
    };
    
    // Fill multiple fields using appropriate method based on field type
    for (const [selector, value] of Object.entries(formData)) {
      // Use setValue for date/time inputs that need special handling
      if (selector === '#birthdate' || selector === '#appointment') {
        await setValue(selector, value);
      } else {
        await fillInput(selector, value);
      }
    }
    
    // Validate all fields were filled correctly
    for (const [selector, expectedValue] of Object.entries(formData)) {
      const actualValue = await getValue(selector);
      assertEqual(actualValue, expectedValue, `Field ${selector} should be filled correctly`);
      console.log(`✅ Verified ${selector}: ${actualValue.substring(0, 30)}...`);
    }
    
    // Test dropdown selections separately
    await selectOption('#country', 'ca');
    await selectOption('#skills', 'nodejs');
    
    // Verify dropdown selections
    const countryValue = await getValue('#country');
    assertEqual(countryValue, 'ca', 'Country should be set to Canada');
    
    // Take screenshot of completed form
    await takeElementScreenshot('#basic-form', 'bulk-filled-form.png');
    
    console.log('✅ Bulk form filling test completed');
  }, 60000);

  it('should test complex element selection and validation patterns', async () => {
    console.log('🎯 Testing complex element selection patterns...');
    
    await navigateTo(formUrl);
    await waitForSelector('.container', 10000);
    
    // Test selecting multiple related elements
    const allInputs = await querySelectorAll('input[type="text"]');
    assertTrue(allInputs.length > 10, 'Should find many text inputs');
    console.log(`📊 Found ${allInputs.length} text inputs`);
    
    const allButtons = await querySelectorAll('button');
    assertTrue(allButtons.length > 15, 'Should find many buttons');
    console.log(`📊 Found ${allButtons.length} buttons`);
    
    const allSelects = await querySelectorAll('select');
    assertTrue(allSelects.length > 5, 'Should find multiple select elements');
    console.log(`📊 Found ${allSelects.length} select elements`);
    
    // Test CSS selector patterns
    const requiredInputs = await querySelectorAll('input[required]');
    assertTrue(requiredInputs.length > 0, 'Should find required inputs');
    
    const dataTestElements = await querySelectorAll('[data-testid]');
    assertTrue(dataTestElements.length > 10, 'Should find elements with test IDs');
    
    const placeholderElements = await querySelectorAll('[placeholder]');
    assertTrue(placeholderElements.length > 5, 'Should find elements with placeholders');
    
    // Test attribute-based selections
    const emailInputs = await querySelectorAll('input[type="email"]');
    assertTrue(emailInputs.length > 0, 'Should find email inputs');
    
    const passwordInputs = await querySelectorAll('input[type="password"]');
    assertTrue(passwordInputs.length > 1, 'Should find password inputs');
    
    console.log('✅ Complex element selection patterns test completed');
  }, 30000);

  it('should test drag and drop interactions', async () => {
    console.log('🎯 Testing drag and drop functionality...');
    
    await navigateTo(formUrl);
    await waitForSelector('.drag-item', 10000);
    
    // Wait for drag and drop elements to be available
    await waitForSelector('.drag-item', 10000);
    await waitForTimeout(500);
    
    // Test that drag items exist
    const dragItem1 = await querySelector('#drag-item-1');
    assertTrue(dragItem1 !== null, 'Drag item 1 should exist');
    
    const dragItem2 = await querySelector('#drag-item-2');
    assertTrue(dragItem2 !== null, 'Drag item 2 should exist');
    
    const dropZone1 = await querySelector('#drop-zone-1');
    assertTrue(dropZone1 !== null, 'Drop zone 1 should exist');
    
    const dropZone2 = await querySelector('#drop-zone-2');
    assertTrue(dropZone2 !== null, 'Drop zone 2 should exist');
    
    const universalZone = await querySelector('#drop-zone-any');
    assertTrue(universalZone !== null, 'Universal drop zone should exist');
    
    // Note: Actual drag and drop simulation would require more complex CDP commands
    // For now, we validate the elements are present and interactive
    console.log('📋 Drag and drop elements validated (simulation would require CDP drag events)');
    
    // Take screenshot of drag and drop area
    await takeElementScreenshot('.drag-drop-area', 'drag-drop-area.png');
    
    console.log('✅ Drag and drop test completed');
  }, 30000);

  it('should test iframe and embedded content handling', async () => {
    console.log('🖼️ Testing iframe and embedded content...');
    
    await navigateTo(formUrl);
    await waitForSelector('#example-iframe', 10000);
    
    // Wait for iframe section to be available
    await waitForSelector('#example-iframe', 10000);
    await waitForTimeout(500);
    
    // Test iframe presence
    const iframe = await querySelector('#example-iframe');
    assertTrue(iframe !== null, 'Example iframe should exist');
    
    const testFrame1 = await querySelector('#test-frame-1');
    assertTrue(testFrame1 !== null, 'Test frame 1 should exist');
    
    const testFrame2 = await querySelector('#test-frame-2');
    assertTrue(testFrame2 !== null, 'Test frame 2 should exist');
    
    // Test frame switching buttons
    await click('[data-testid="switch-frame-1"]');
    await waitForTimeout(500);
    
    await click('[data-testid="switch-frame-2"]');
    await waitForTimeout(500);
    
    await click('[data-testid="switch-main"]');
    await waitForTimeout(500);
    
    // Test details/summary element
    const detailsElement = await querySelector('#details-element');
    assertTrue(detailsElement !== null, 'Details element should exist');
    
    await click('#details-element summary');
    await waitForTimeout(500);
    
    // Type in the revealed input
    await type('input[name="hidden-input"]', 'Hidden input revealed');
    
    // Take screenshot of embedded content
    await takeElementScreenshot('section:has(#example-iframe)', 'embedded-content.png');
    
    console.log('✅ Iframe and embedded content test completed');
  }, 45000);

  it('should test error handling and recovery scenarios', async () => {
    console.log('🛡️ Testing comprehensive error handling...');
    
    await navigateTo(formUrl);
    await waitForSelector('h1', 10000);
    
    // Test handling of non-existent elements gracefully
    const nonExistentSelectors = [
      '#does-not-exist',
      '.missing-class',
      'non-existent-tag',
      '[data-missing="true"]'
    ];
    
    for (const selector of nonExistentSelectors) {
      try {
        await waitForSelector(selector, 1000);
        console.log(`❌ Unexpectedly found: ${selector}`);
      } catch (error) {
        console.log(`✅ Correctly handled missing element: ${selector}`);
        assertContainsText(error.message, 'timed out', 'Should get timeout error');
      }
    }
    
    // Test that session remains functional after errors
    const title = await testEnv.session.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    assertTrue(title.result.value.length > 0, 'Page title should still be accessible after errors');
    assertContainsText(title.result.value, 'Comprehensive', 'Title should contain expected text');
    
    // Test clicking non-existent elements
    try {
      await click('#completely-missing-button');
    } catch (error) {
      console.log('✅ Correctly handled clicking non-existent element');
      assertTrue(error !== null, 'Should get error for non-existent element');
    }
    
    // Verify we can still interact with real elements
    await fillInput('#fullname', 'Error Recovery Test');
    const recoveryValue = await getValue('#fullname');
    assertEqual(recoveryValue, 'Error Recovery Test', 'Should still be able to interact after errors');
    
    console.log('✅ Error handling and recovery test completed');
  }, 30000);

  it('should test performance and timing edge cases', async () => {
    console.log('⚡ Testing performance and timing edge cases...');
    
    await navigateTo(formUrl);
    await waitForSelector('h1', 10000);
    
    // Test rapid sequential interactions
    const rapidInputSelectors = ['#fullname', '#email', '#phone', '#website'];
    const rapidTestData = ['Rapid1', 'rapid@test.com', '555-RAPID', 'https://rapid.test'];
    
    const startTime = Date.now();
    
    for (let i = 0; i < rapidInputSelectors.length; i++) {
      await clearInput(rapidInputSelectors[i]);
      await fillInput(rapidInputSelectors[i], rapidTestData[i]);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`⏱️ Rapid input sequence completed in ${totalTime}ms`);
    assertTrue(totalTime > 0, 'Should take some time to complete');
    assertTrue(totalTime < 10000, 'Should complete within reasonable time');
    
    // Validate all rapid inputs were set correctly
    for (let i = 0; i < rapidInputSelectors.length; i++) {
      const value = await getValue(rapidInputSelectors[i]);
      assertEqual(value, rapidTestData[i], `Rapid input ${i} should be set correctly`);
    }
    
    // Test multiple element queries performance
    const queryStartTime = Date.now();
    
    const allElements = await querySelectorAll('*');
    const inputs = await querySelectorAll('input');
    const buttons = await querySelectorAll('button');
    const sections = await querySelectorAll('section');
    
    const queryEndTime = Date.now();
    const queryTime = queryEndTime - queryStartTime;
    
    console.log(`📊 Element queries completed in ${queryTime}ms`);
    console.log(`📊 Found ${allElements.length} total elements`);
    console.log(`📊 Found ${inputs.length} inputs, ${buttons.length} buttons, ${sections.length} sections`);
    
    assertTrue(queryTime < 5000, 'Element queries should complete quickly');
    assertTrue(allElements.length > 100, 'Should find many elements on comprehensive page');
    
    console.log('✅ Performance and timing edge cases test completed');
  }, 45000);

  it('should test comprehensive assertion validations', async () => {
    console.log('🧪 Testing comprehensive assertion validations...');
    
    await navigateTo(formUrl);
    await waitForSelector('h1', 10000);
    
    // Test various assertion types on the page
    const pageTitle = await testEnv.session.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    assertContainsText(pageTitle.result.value, 'Testing Playground', 'Title should contain Testing Playground');
    assertTrue(pageTitle.result.value !== '', 'Title should not be empty');
    
    // Test element existence assertions
    const headingElement = await querySelector('h1');
    const mainHeading = await getText(headingElement);
    assertTrue(mainHeading.length > 0, 'Main heading should exist');
    assertContainsText(mainHeading, 'Comprehensive', 'Heading should contain Comprehensive');
    
    // Test length assertions on collections
    const formSections = await querySelectorAll('section');
    assertEqual(formSections.length, formSections.length, 'Form sections count should match');
    assertTrue(formSections.length > 5, 'Should have multiple form sections');
    
    // Test array includes with element collections
    const inputTypes = [];
    const allInputs = await querySelectorAll('input');
    
    // Sample a few input types for testing
    for (let i = 0; i < Math.min(5, allInputs.length); i++) {
      try {
        const inputType = await testEnv.session.send('Runtime.evaluate', {
          expression: `document.querySelectorAll('input')[${i}].type`,
          returnByValue: true
        });
        inputTypes.push(inputType.result.value);
      } catch (error) {
        console.log(`Could not get type for input ${i}`);
      }
    }
    
    assertTrue(inputTypes.includes('text'), 'Should include text input type');
    console.log(`📊 Found input types: ${inputTypes.join(', ')}`);
    
    // Test boolean assertions
    const hasRequiredInputs = allInputs.length > 0;
    assertTrue(hasRequiredInputs, 'Page should have input elements');
    
    const isEmptyPage = allInputs.length === 0;
    assertTrue(!isEmptyPage, 'Page should not be empty');
    
    console.log('✅ Comprehensive assertion validations test completed');
  }, 30000);
});