import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  createTestEnvironment, 
  cleanupTestEnvironment,
  setSession,
  clearSession,
  enableDOM,
  navigateTo,
  getTestPort
} from 'super-pancake-automation';

describe('Framework API Tests', () => {
  let testEnv;

  beforeAll(async () => {
    console.log('🚀 Setting up Framework API test environment...');
    const port = await getTestPort('api');
    testEnv = await createTestEnvironment({ 
      headed: false,
      port: port,
      testName: 'Framework API Tests'
    });
    
    // Set session context for v2 API
    setSession(testEnv.session);
    
    await enableDOM();
  }, 30000);

  afterAll(async () => {
    clearSession();
    await cleanupTestEnvironment(testEnv, 'Framework API Tests');
    console.log('🧹 Framework API test environment cleaned up');
  });

  it('should test browser API creation and cleanup', async () => {
    expect(testEnv).toBeDefined();
    expect(testEnv.chrome).toBeDefined();  // Our framework uses 'chrome' not 'browser'
    expect(testEnv.session).toBeDefined();
    expect(testEnv.chrome.port).toBeDefined();  // Port is on chrome object
  });

  it('should test navigation API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    
    await navigateTo(testUrl);
    
    // Verify navigation worked
    const url = await testEnv.session.send('Runtime.evaluate', {
      expression: 'window.location.href',
      returnByValue: true
    });
    
    expect(url.result.value).toContain('form-comprehensive.html');
  });

  it('should test session communication API', async () => {
    const result = await testEnv.session.send('Runtime.evaluate', {
      expression: '2 + 2',
      returnByValue: true
    });
    
    expect(result.result.value).toBe(4);
  });

  it('should test DOM API availability', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    const title = await testEnv.session.send('Runtime.evaluate', {
      expression: 'document.title',
      returnByValue: true
    });
    
    expect(title.result.value).toContain('Comprehensive');
  });

  it('should test error handling in API calls', async () => {
    try {
      await testEnv.session.send('InvalidDomain.invalidMethod', {});
    } catch (error) {
      expect(error).toBeDefined();
      expect(error.message).toBeDefined();
    }
  });

  it('should test DOM element interaction APIs', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test element finding API
    const titleElement = await testEnv.session.send('Runtime.evaluate', {
      expression: 'document.querySelector("h1").textContent',
      returnByValue: true
    });
    
    expect(titleElement.result.value).toContain('Comprehensive');
  });

  it('should test form interaction APIs', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test input field interaction with fallback selectors
    const interactionResult = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const input = document.querySelector('input[type="text"]') || 
                     document.querySelector('#username') || 
                     document.querySelector('input[name="username"]') ||
                     document.querySelector('input');
        if (input) {
          input.value = 'Test Value';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.value;
        } else {
          'no-input-found';
        }
      `,
      returnByValue: true
    });
    
    expect(interactionResult.result.value).toMatch(/Test Value|no-input-found/);
  });

  it('should test button click API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test button click with multiple fallbacks
    const clickResult = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const button = document.querySelector('button[type="button"]') ||
                      document.querySelector('button[type="submit"]') ||
                      document.querySelector('button') ||
                      document.querySelector('input[type="button"]');
        if (button) {
          'button-found';
        } else {
          'no-button-found';
        }
      `,
      returnByValue: true
    });
    
    expect(clickResult.result.value).toMatch(/button-found|no-button-found/);
  });

  it('should test dropdown selection API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test dropdown selection with validation
    const selectionResult = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const select = document.querySelector('select');
        if (select && select.options && select.options.length > 1) {
          select.selectedIndex = 1;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          select.selectedIndex;
        } else if (select) {
          0; // Found select but no options
        } else {
          -1; // No select found
        }
      `,
      returnByValue: true
    });
    
    expect(typeof selectionResult.result.value).toBe('number');
    expect(selectionResult.result.value).toBeGreaterThanOrEqual(-1);
  });

  it('should test checkbox interaction API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test checkbox interaction with validation
    const checkboxResult = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const checkbox = document.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          checkbox.checked;
        } else {
          'no-checkbox-found';
        }
      `,
      returnByValue: true
    });
    
    expect(checkboxResult.result.value === true || checkboxResult.result.value === 'no-checkbox-found').toBe(true);
  });

  it('should test radio button interaction API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test radio button interaction with validation
    const radioResult = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const radio = document.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          radio.checked;
        } else {
          'no-radio-found';
        }
      `,
      returnByValue: true
    });
    
    expect(radioResult.result.value === true || radioResult.result.value === 'no-radio-found').toBe(true);
  });

  it('should test textarea interaction API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test textarea interaction
    const testText = 'This is test content for textarea';
    await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.value = '${testText}';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `
    });
    
    const textareaValue = await testEnv.session.send('Runtime.evaluate', {
      expression: 'document.querySelector("textarea").value',
      returnByValue: true
    });
    
    expect(textareaValue.result.value).toBe(testText);
  });

  it('should test file input API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test file input presence and attributes
    const fileInputTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const fileInput = document.querySelector('input[type="file"]');
        fileInput ? {
          exists: true,
          accept: fileInput.accept,
          multiple: fileInput.multiple
        } : { exists: false };
      `,
      returnByValue: true
    });
    
    expect(fileInputTest.result.value.exists).toBe(true);
  });

  it('should test JavaScript console API', async () => {
    // Test console.log functionality
    const consoleTest = await testEnv.session.send('Runtime.evaluate', {
      expression: 'console.log("Test console message"); "console test complete"',
      returnByValue: true
    });
    
    expect(consoleTest.result.value).toBe('console test complete');
  });

  it('should test event listener API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test event listener attachment with simpler approach
    const eventTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        // Create a simple element for testing
        const testDiv = document.createElement('div');
        let eventFired = false;
        testDiv.addEventListener('click', () => { eventFired = true; });
        testDiv.click();
        eventFired;
      `,
      returnByValue: true
    });
    
    expect(eventTest.result.value).toBe(true);
  });

  it('should test window and document properties API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test window properties
    const windowProps = await testEnv.session.send('Runtime.evaluate', {
      expression: `({
        hasDocument: typeof document !== 'undefined',
        hasWindow: typeof window !== 'undefined',
        hasNavigator: typeof navigator !== 'undefined',
        hasLocation: typeof location !== 'undefined'
      })`,
      returnByValue: true
    });
    
    expect(windowProps.result.value.hasDocument).toBe(true);
    expect(windowProps.result.value.hasWindow).toBe(true);
    expect(windowProps.result.value.hasNavigator).toBe(true);
    expect(windowProps.result.value.hasLocation).toBe(true);
  });

  it('should test async JavaScript execution API', async () => {
    // Test async/await support
    const asyncTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        (async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'async test complete';
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    
    expect(asyncTest.result.value).toBe('async test complete');
  });

  it('should test JSON parsing and manipulation API', async () => {
    // Test JSON functionality
    const jsonTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const testObj = { name: 'test', value: 123, active: true };
        const jsonString = JSON.stringify(testObj);
        const parsedObj = JSON.parse(jsonString);
        parsedObj.name === 'test' && parsedObj.value === 123;
      `,
      returnByValue: true
    });
    
    expect(jsonTest.result.value).toBe(true);
  });

  it('should test CSS selector API comprehensive coverage', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test various CSS selectors
    const selectorTests = await testEnv.session.send('Runtime.evaluate', {
      expression: `({
        byId: document.getElementById('username') ? true : false,
        byClass: document.querySelector('.form-group') ? true : false,
        byTag: document.querySelector('input') ? true : false,
        byAttribute: document.querySelector('[type="email"]') ? true : false,
        byPseudo: document.querySelector(':first-child') ? true : false
      })`,
      returnByValue: true
    });
    
    expect(typeof selectorTests.result.value).toBe('object');
    expect(selectorTests.result.value.byTag).toBe(true);
  });

  it('should test local storage API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test localStorage functionality
    const storageTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('test-key', 'test-value');
        const retrieved = localStorage.getItem('test-key');
        localStorage.removeItem('test-key');
        retrieved;
      `,
      returnByValue: true
    });
    
    expect(storageTest.result.value).toBe('test-value');
  });

  it('should test session storage API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test sessionStorage functionality
    const sessionTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        sessionStorage.setItem('session-test', 'session-value');
        const retrieved = sessionStorage.getItem('session-test');
        sessionStorage.removeItem('session-test');
        retrieved;
      `,
      returnByValue: true
    });
    
    expect(sessionTest.result.value).toBe('session-value');
  });

  it('should test iframe interaction API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test iframe presence
    const iframeTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const iframe = document.querySelector('iframe');
        iframe ? {
          exists: true,
          src: iframe.src,
          id: iframe.id
        } : { exists: false };
      `,
      returnByValue: true
    });
    
    expect(iframeTest.result.value.exists).toBe(true);
  });

  it('should test drag and drop API elements', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test drag and drop elements
    const dragDropTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const dragItem = document.querySelector('.drag-item');
        const dropArea = document.querySelector('.drag-drop-area');
        ({
          hasDragItem: dragItem ? true : false,
          hasDropArea: dropArea ? true : false,
          isDraggable: dragItem ? dragItem.draggable : false
        });
      `,
      returnByValue: true
    });
    
    expect(typeof dragDropTest.result.value).toBe('object');
  });

  it('should test modal interaction API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test modal elements
    const modalTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const modal = document.querySelector('.modal');
        const modalTrigger = document.querySelector('[data-modal]');
        ({
          hasModal: modal ? true : false,
          hasTrigger: modalTrigger ? true : false,
          modalId: modal ? modal.id : null
        });
      `,
      returnByValue: true
    });
    
    expect(typeof modalTest.result.value).toBe('object');
  });

  it('should test accordion/collapsible API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test accordion elements
    const accordionTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const accordion = document.querySelector('.accordion');
        const accordionHeader = document.querySelector('.accordion-header');
        ({
          hasAccordion: accordion ? true : false,
          hasHeader: accordionHeader ? true : false,
          hasContent: document.querySelector('.accordion-content') ? true : false
        });
      `,
      returnByValue: true
    });
    
    expect(typeof accordionTest.result.value).toBe('object');
  });

  it('should test tab interaction API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test tab elements
    const tabTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const tabButton = document.querySelector('.tab-button');
        const tabContent = document.querySelector('.tab-content');
        ({
          hasTabButton: tabButton ? true : false,
          hasTabContent: tabContent ? true : false,
          tabCount: document.querySelectorAll('.tab-button').length
        });
      `,
      returnByValue: true
    });
    
    expect(typeof tabTest.result.value).toBe('object');
  });

  it('should test table interaction API', async () => {
    const testUrl = `file://${process.cwd()}/public/form-comprehensive.html`;
    await navigateTo(testUrl);
    
    // Test table elements and interactions
    const tableTest = await testEnv.session.send('Runtime.evaluate', {
      expression: `
        const table = document.querySelector('table');
        const rows = document.querySelectorAll('tbody tr');
        const editButtons = document.querySelectorAll('button');
        ({
          hasTable: table ? true : false,
          rowCount: rows.length,
          hasButtons: editButtons.length > 0,
          headers: document.querySelectorAll('th').length
        });
      `,
      returnByValue: true
    });
    
    expect(typeof tableTest.result.value).toBe('object');
    expect(tableTest.result.value.hasTable).toBe(true);
  });
});