// Simple DOM operations for Super Pancake Framework - v2 with Session Context
// Eliminates the need to pass session to every method call
import { withErrorRecovery } from './simple-errors.js';
import { getSession } from './session-context.js';
import fs from 'fs';
import path from 'path';

// Global timeout configuration
const defaultTimeouts = {
  element: 5000,      // Default timeout for element operations
  navigation: 30000,  // Default timeout for page navigation
  screenshot: 10000,  // Default timeout for screenshots
  script: 5000       // Default timeout for script execution
};

// Configuration functions
export function setDefaultTimeout(timeout) {
  defaultTimeouts.element = timeout;
  defaultTimeouts.script = timeout;
  console.log(`🕐 Default timeout set to ${timeout}ms`);
}

export function setNavigationTimeout(timeout) {
  defaultTimeouts.navigation = timeout;
  console.log(`🌐 Navigation timeout set to ${timeout}ms`);
}

export function setScreenshotTimeout(timeout) {
  defaultTimeouts.screenshot = timeout;
  console.log(`📸 Screenshot timeout set to ${timeout}ms`);
}

// Helper to merge options with defaults
function getOptions(options = {}, defaultTimeout = defaultTimeouts.element) {
  return {
    timeout: defaultTimeout,
    force: false,
    session: null,
    ...options
  };
}

export const enableDOM = withErrorRecovery(async (sessionParam = null) => {
  const session = sessionParam || getSession();
  console.log('🎯 Enabling DOM operations');

  try {
    // First create a new page target
    const targetResult = await session.send('Target.createTarget', { url: 'about:blank' }, 10000);
    console.log('🎯 Created target:', targetResult.targetId);

    // Attach to the target
    const sessionResult = await session.send('Target.attachToTarget', {
      targetId: targetResult.targetId,
      flatten: true
    }, 10000);
    console.log('🎯 Attached to target');

    // Now enable domains
    await session.send('Page.enable', {}, 10000);
    await session.send('Runtime.enable', {}, 10000);
    await session.send('DOM.enable', {}, 10000);

    console.log('✅ DOM operations enabled');
  } catch (error) {
    console.log('⚠️ Target creation failed, trying direct approach...');
    // Fallback to direct approach
    await session.send('Page.enable', {}, 10000);
    await session.send('Runtime.enable', {}, 10000);
    await session.send('DOM.enable', {}, 10000);
    console.log('✅ DOM operations enabled (direct)');
  }
}, 'enableDOM');

export const navigateTo = withErrorRecovery(async (url, options = {}) => {
  const opts = getOptions(options, defaultTimeouts.navigation);
  const session = opts.session || getSession();
  console.log(`🌐 Navigating to: ${url} (timeout: ${opts.timeout}ms)`);

  await session.send('Page.navigate', { url });

  // Wait for load event
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Navigation to ${url} timed out after ${opts.timeout}ms`));
    }, opts.timeout);

    const listener = (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.method === 'Page.loadEventFired') {
          clearTimeout(timeout);
          console.log(`✅ Navigation completed: ${url}`);
          resolve();
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    };

    // Listen for load event
    const ws = session._ws;
    if (ws) {
      ws.on('message', listener);
    } else {
      // Fallback: just wait a bit
      setTimeout(() => {
        clearTimeout(timeout);
        resolve();
      }, 2000);
    }
  });

  // Wait for DOM to be fully ready and JavaScript to load
  console.log('⏳ Waiting for DOM and JavaScript to be ready...');
  await session.send('Runtime.evaluate', {
    expression: `
      new Promise((resolve) => {
        if (document.readyState === 'complete') {
          // Wait additional time for JavaScript event listeners to be attached
          setTimeout(() => resolve('ready'), 1000);
        } else {
          window.addEventListener('load', () => {
            setTimeout(() => resolve('ready'), 1000);
          });
        }
      });
    `,
    awaitPromise: true
  });

  console.log('✅ DOM and JavaScript fully ready');
}, 'navigateTo');

export const querySelector = withErrorRecovery(async (selector, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();
  console.log(`🔍 Finding element: ${selector} (timeout: ${opts.timeout}ms)`);

  const { root } = await session.send('DOM.getDocument');
  const { nodeId } = await session.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector
  });

  if (!nodeId) {
    throw new Error(`Element not found: ${selector}`);
  }

  return nodeId;
}, 'querySelector');

export const waitForSelector = withErrorRecovery(async (selector, timeout = 10000, sessionParam = null) => {
  const session = sessionParam || getSession();
  console.log(`⏳ Waiting for element: ${selector}`);

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const nodeId = await querySelector(selector, session);
      console.log(`✅ Element found: ${selector}`);
      return nodeId;
    } catch (error) {
      // Element not found, wait and try again
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  throw new Error(`Element not found within ${timeout}ms: ${selector}`);
}, 'waitForSelector');

export const click = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();
  console.log(`🖱️ Clicking: ${selectorOrNodeId} (timeout: ${opts.timeout}ms, force: ${opts.force})`);

  // Handle object IDs from smart locators
  if (typeof selectorOrNodeId === 'string' && selectorOrNodeId.match(/^-?\d+\.\d+\.\d+$/)) {
    // This is an object ID, use Runtime.callFunctionOn directly
    await session.send('Runtime.callFunctionOn', {
      objectId: selectorOrNodeId,
      functionDeclaration: `function() {
        // Scroll element into view
        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Focus if interactive element
        if (this.focus) this.focus();
        
        // Create and dispatch mouse events
        const events = ['mousedown', 'mouseup', 'click'];
        events.forEach(eventType => {
          const event = new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 1,
            button: 0,
            buttons: 1
          });
          this.dispatchEvent(event);
        });
        
        // Also trigger change event for form elements
        if (this.tagName.match(/INPUT|SELECT|TEXTAREA/)) {
          this.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        return 'clicked';
      }`,
      returnByValue: true
    });

    console.log('✅ Clicked object ID successfully');
    return;
  }

  const selector = typeof selectorOrNodeId === 'string' ? selectorOrNodeId : `[data-node-id="${selectorOrNodeId}"]`;

  // Enhanced click with JavaScript event triggering
  await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${selector}');
        if (!element) {
          throw new Error('Element not found: ${selector}');
        }
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Create and dispatch mouse events
        const events = ['mousedown', 'mouseup', 'click'];
        events.forEach(eventType => {
          const event = new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 1,
            button: 0,
            buttons: 1
          });
          element.dispatchEvent(event);
        });
        
        // Also trigger change event for form elements
        if (element.tagName.match(/INPUT|SELECT|TEXTAREA/)) {
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        return 'clicked';
      })();
    `,
    returnByValue: true
  });

  // Small delay to allow JavaScript to process
  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('✅ Clicked successfully with JavaScript events');
}, 'click');

// Enhanced click specifically for JavaScript-heavy elements
export const clickJS = withErrorRecovery(async (selector, sessionParam = null) => {
  const session = sessionParam || getSession();
  console.log(`🖱️ JavaScript Click: ${selector}`);

  await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${selector}');
        if (!element) {
          throw new Error('Element not found: ${selector}');
        }
        
        // Force focus if it's an interactive element
        if (element.focus) element.focus();
        
        // Trigger click with all events
        element.click();
        
        // Also dispatch manual events for maximum compatibility
        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
          const event = new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window
          });
          element.dispatchEvent(event);
        });
        
        return element.tagName;
      })();
    `,
    returnByValue: true
  });

  // Wait for any animations or state changes
  await new Promise(resolve => setTimeout(resolve, 200));

  console.log('✅ JavaScript click completed');
}, 'clickJS');

export const fillInput = withErrorRecovery(async (selectorOrNodeId, value, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();
  console.log(`✏️ Filling input: ${selectorOrNodeId} = "${value}" (timeout: ${opts.timeout}ms, force: ${opts.force})`);

  // Handle object IDs returned from smart locators
  if (typeof selectorOrNodeId === 'string' && selectorOrNodeId.match(/^-?\d+\.\d+\.\d+$/)) {
    // This is an object ID from smart locator, use Runtime.callFunctionOn directly
    console.log(`🔄 Using object ID directly: ${selectorOrNodeId}`);

    // Focus and clear the element, then type the value
    await session.send('Runtime.callFunctionOn', {
      objectId: selectorOrNodeId,
      functionDeclaration: `function(value) {
        this.focus();
        this.select(); // Select all existing text
        this.value = ''; // Clear the field
        this.value = value; // Set new value
        this.dispatchEvent(new Event('input', { bubbles: true }));
        this.dispatchEvent(new Event('change', { bubbles: true }));
        return 'filled';
      }`,
      arguments: [{ value: value }],
      returnByValue: true
    });

    console.log('✅ Input filled using object ID successfully');
    return;
  }

  // Handle CSS selectors
  let nodeId;
  if (typeof selectorOrNodeId === 'string') {
    // This is a CSS selector
    nodeId = await querySelector(selectorOrNodeId, opts);
  } else {
    // This is already a node ID
    nodeId = selectorOrNodeId;
  }

  // Focus the element
  await session.send('DOM.focus', { nodeId });

  // Clear existing value by selecting all and deleting
  await session.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Control'
  });
  await session.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'a'
  });
  await session.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'a'
  });
  await session.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Control'
  });

  // Delete selected content
  await session.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Backspace'
  });
  await session.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Backspace'
  });

  // Type new value
  for (const char of value) {
    await session.send('Input.dispatchKeyEvent', {
      type: 'char',
      text: char
    });
  }

  console.log('✅ Input filled successfully');
}, 'fillInput');

export const takeScreenshot = withErrorRecovery(async (filePath, options = {}) => {
  const opts = getOptions(options, defaultTimeouts.screenshot);
  const session = opts.session || getSession();
  console.log(`📸 Taking screenshot: ${filePath} (timeout: ${opts.timeout}ms)`);

  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const { data } = await session.send('Page.captureScreenshot', {
    format: 'png',
    quality: 90
  });

  // Save screenshot
  const buffer = Buffer.from(data, 'base64');
  fs.writeFileSync(filePath, buffer);

  console.log(`✅ Screenshot saved: ${filePath}`);
}, 'takeScreenshot');

export const getText = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();
  console.log(`📝 Getting text from: ${selectorOrNodeId} (timeout: ${opts.timeout}ms)`);

  let nodeId;
  if (typeof selectorOrNodeId === 'string') {
    nodeId = await querySelector(selectorOrNodeId, opts);
  } else {
    nodeId = selectorOrNodeId;
  }

  const { object } = await session.send('DOM.resolveNode', { nodeId });
  const { result } = await session.send('Runtime.callFunctionOn', {
    objectId: object.objectId,
    functionDeclaration: 'function() { return this.textContent; }',
    returnByValue: true
  });

  return result.value;
}, 'getText');

export const getAttribute = withErrorRecovery(async (selectorOrNodeId, attributeName, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();
  console.log(`📋 Getting attribute ${attributeName} from: ${selectorOrNodeId} (timeout: ${opts.timeout}ms)`);

  const selector = typeof selectorOrNodeId === 'string' ? selectorOrNodeId : `[data-node-id="${selectorOrNodeId}"]`;

  // Use JavaScript to get attribute for better HTML5 support
  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${selector}');
        if (!element) {
          throw new Error('Element not found: ${selector}');
        }
        
        // Handle special attributes
        if ('${attributeName}' === 'data-status') {
          return element.getAttribute('data-status') || '';
        }
        
        if ('${attributeName}' === 'data-state') {
          return element.getAttribute('data-state') || '';
        }
        
        if ('${attributeName}' === 'open') {
          return element.hasAttribute('open') ? 'true' : 'false';
        }
        
        if ('${attributeName}' === 'disabled') {
          return element.disabled ? 'true' : 'false';
        }
        
        if ('${attributeName}' === 'checked') {
          return element.checked ? 'true' : 'false';
        }
        
        const value = element.getAttribute('${attributeName}');
        return value !== null ? value : '';
      })();
    `,
    returnByValue: true
  });

  return result.result.value;
}, 'getAttribute');

// Get the value of an input, select, or textarea element
export const getValue = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();
  console.log(`📋 Getting value from: ${selectorOrNodeId} (timeout: ${opts.timeout}ms)`);

  // Check if it's an object ID (smart locator format with dots and negative numbers)
  if (typeof selectorOrNodeId === 'string' && selectorOrNodeId.match(/^-?\d+\.\d+\.\d+$/)) {
    // This is an object ID from smart locator
    const result = await session.send('Runtime.callFunctionOn', {
      functionDeclaration: 'function() { return this.value !== undefined ? this.value : this.textContent; }',
      objectId: selectorOrNodeId,
      returnByValue: true
    });
    return result.result.value;
  }

  // It's a CSS selector string
  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${selectorOrNodeId}');
        if (!element) throw new Error('Element not found: ${selectorOrNodeId}');
        return element.value !== undefined ? element.value : element.textContent;
      })()
    `,
    returnByValue: true
  });

  return result.result.value;
}, 'getValue');

// Wait for element to have specific attribute value
export const waitForAttribute = withErrorRecovery(async (selector, attributeName, expectedValue, timeout = 5000, sessionParam = null) => {
  const session = sessionParam || getSession();
  console.log(`⏳ Waiting for ${selector} attribute ${attributeName} to be ${expectedValue}`);

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const currentValue = await getAttribute(selector, attributeName, session);
      if (currentValue === expectedValue) {
        console.log(`✅ Attribute ${attributeName} is now ${expectedValue}`);
        return true;
      }
    } catch (error) {
      // Element might not exist yet, continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Timeout waiting for ${selector} attribute ${attributeName} to be ${expectedValue}`);
}, 'waitForAttribute');

// Wait for element to be visible
export const waitForVisible = withErrorRecovery(async (selector, timeout = 5000, sessionParam = null) => {
  const session = sessionParam || getSession();
  console.log(`👁️ Waiting for ${selector} to be visible`);

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const visible = await session.send('Runtime.evaluate', {
        expression: `
          (() => {
            const element = document.querySelector('${selector}');
            if (!element) return false;
            
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0' &&
                   element.offsetWidth > 0 && 
                   element.offsetHeight > 0;
          })();
        `,
        returnByValue: true
      });

      if (visible.result.value) {
        console.log(`✅ Element ${selector} is now visible`);
        return true;
      }
    } catch (error) {
      // Continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Timeout waiting for ${selector} to be visible`);
}, 'waitForVisible');

// Helper function for accessing session directly
export const getSessionDirect = () => getSession();

// =============================================================================
// 🚀 PLAYWRIGHT-STYLE METHODS - HIGH PRIORITY
// =============================================================================

// 1. SMART LOCATORS - Semantic element finding
// =============================================================================

// Find element by ARIA role and accessible name
export const getByRole = withErrorRecovery(async (role, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();
  const { name } = opts;

  console.log(`🎭 Finding element by role: ${role}${name ? ` with name: ${name}` : ''} (timeout: ${opts.timeout}ms)`);

  const selector = name
    ? `[role="${role}"][aria-label*="${name}"], [role="${role}"]:has-text("${name}")`
    : `[role="${role}"]`;

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        // Find by role and optional name
        let elements = Array.from(document.querySelectorAll('[role="${role}"]'));
        
        // If no explicit role, check implicit roles
        if (elements.length === 0) {
          const roleMap = {
            'button': 'button, input[type="button"], input[type="submit"], input[type="reset"]',
            'link': 'a[href]',
            'textbox': 'input[type="text"], input[type="email"], input[type="password"], textarea',
            'checkbox': 'input[type="checkbox"]',
            'radio': 'input[type="radio"]',
            'heading': 'h1, h2, h3, h4, h5, h6'
          };
          
          if (roleMap['${role}']) {
            elements = Array.from(document.querySelectorAll(roleMap['${role}']));
          }
        }
        
        ${name ? `
        // Filter by accessible name if provided
        if (elements.length > 0) {
          elements = elements.filter(el => {
            const accessibleName = el.getAttribute('aria-label') || 
                                 el.getAttribute('aria-labelledby') || 
                                 el.textContent || 
                                 el.getAttribute('title') || 
                                 el.getAttribute('alt');
            return accessibleName && accessibleName.includes('${name}');
          });
        }
        ` : ''}
        
        if (elements.length === 0) {
          throw new Error('Element not found with role: ${role}${name ? ` and name: ${name}` : ''}');
        }
        
        return elements[0]; // Return first match
      })()
    `,
    returnByValue: false
  });

  if (result.result.objectId) {
    return result.result.objectId;
  }

  throw new Error(`Element not found with role: ${role}${name ? ` and name: ${name}` : ''}`);
}, 'getByRole');

// Find element by text content
export const getByText = withErrorRecovery(async (text, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();
  const { exact = false } = opts;

  console.log(`📝 Finding element by text: "${text}" (exact: ${exact}, timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const searchText = '${text}';
        const exact = ${exact};
        
        // Find elements containing the text
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_ELEMENT,
          null,
          false
        );
        
        const elements = [];
        let node;
        
        while (node = walker.nextNode()) {
          const textContent = node.textContent.trim();
          const matches = exact ? textContent === searchText : textContent.includes(searchText);
          
          if (matches && !node.querySelector('*')) { // Prefer leaf nodes
            elements.push(node);
          }
        }
        
        if (elements.length === 0) {
          // Fallback: try all elements
          const allElements = Array.from(document.querySelectorAll('*')).filter(el => {
            const textContent = el.textContent.trim();
            return exact ? textContent === searchText : textContent.includes(searchText);
          });
          
          if (allElements.length > 0) {
            return allElements[0];
          }
          
          throw new Error('Element not found with text: ${text}');
        }
        
        return elements[0];
      })()
    `,
    returnByValue: false
  });

  if (result.result.objectId) {
    return result.result.objectId;
  }

  throw new Error(`Element not found with text: ${text}`);
}, 'getByText');

// Find form control by associated label text
export const getByLabel = withErrorRecovery(async (labelText, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🏷️ Finding element by label: "${labelText}" (timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const labelText = '${labelText}';
        
        // Find label with matching text
        const labels = Array.from(document.querySelectorAll('label')).filter(label => 
          label.textContent.trim().includes(labelText)
        );
        
        for (const label of labels) {
          // Try for attribute first
          if (label.getAttribute('for')) {
            const target = document.getElementById(label.getAttribute('for'));
            if (target) return target;
          }
          
          // Try nested input
          const nestedInput = label.querySelector('input, select, textarea');
          if (nestedInput) return nestedInput;
          
          // Try next sibling input (common pattern)
          let nextElement = label.nextElementSibling;
          while (nextElement) {
            if (nextElement.matches('input, select, textarea')) {
              return nextElement;
            }
            if (nextElement.matches('br')) {
              nextElement = nextElement.nextElementSibling;
              continue;
            }
            break;
          }
        }
        
        // Fallback: find by aria-label
        const ariaLabelElement = document.querySelector(\`[aria-label*="\${labelText}"]\`);
        if (ariaLabelElement) return ariaLabelElement;
        
        return null; // Return null instead of throwing error
      })()
    `,
    returnByValue: false
  });

  if (result.result.objectId) {
    // Check if the returned object is an Error
    const typeCheck = await session.send('Runtime.callFunctionOn', {
      objectId: result.result.objectId,
      functionDeclaration: 'function() { return this instanceof Error ? "ERROR" : this.tagName || "UNKNOWN"; }',
      returnByValue: true
    });

    if (typeCheck.result.value === 'ERROR') {
      throw new Error(`Element not found with label: ${labelText}`);
    }

    return result.result.objectId;
  }

  throw new Error(`Element not found with label: ${labelText}`);
}, 'getByLabel');

// =============================================================================
// 2. FORM METHODS - Smart form interactions
// =============================================================================

// Check a checkbox or radio button
export const check = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`☑️ Checking: ${selectorOrNodeId} (timeout: ${opts.timeout}ms, force: ${opts.force})`);

  let nodeId;
  if (typeof selectorOrNodeId === 'string') {
    nodeId = await querySelector(selectorOrNodeId, opts);
  } else {
    nodeId = selectorOrNodeId;
  }

  // Check the element using JavaScript
  await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${typeof selectorOrNodeId === 'string' ? selectorOrNodeId : '[data-node-id="' + selectorOrNodeId + '"]'}');
        if (!element) throw new Error('Element not found');
        
        if (element.type !== 'checkbox' && element.type !== 'radio') {
          throw new Error('Element is not checkable (must be checkbox or radio)');
        }
        
        ${opts.force ? '' : `
        if (element.disabled && !${opts.force}) {
          throw new Error('Element is disabled');
        }
        `}
        
        element.checked = true;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
      })()
    `
  });

  console.log('✅ Element checked successfully');
}, 'check');

// Uncheck a checkbox
export const uncheck = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`☐ Unchecking: ${selectorOrNodeId} (timeout: ${opts.timeout}ms, force: ${opts.force})`);

  let nodeId;
  if (typeof selectorOrNodeId === 'string') {
    nodeId = await querySelector(selectorOrNodeId, opts);
  } else {
    nodeId = selectorOrNodeId;
  }

  // Uncheck the element using JavaScript
  await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${typeof selectorOrNodeId === 'string' ? selectorOrNodeId : '[data-node-id="' + selectorOrNodeId + '"]'}');
        if (!element) throw new Error('Element not found');
        
        if (element.type !== 'checkbox') {
          throw new Error('Element is not a checkbox');
        }
        
        ${opts.force ? '' : `
        if (element.disabled && !${opts.force}) {
          throw new Error('Element is disabled');
        }
        `}
        
        element.checked = false;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
      })()
    `
  });

  console.log('✅ Element unchecked successfully');
}, 'uncheck');

// Select option in dropdown
export const selectOption = withErrorRecovery(async (selectorOrNodeId, value, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🔽 Selecting option: ${selectorOrNodeId} = "${value}" (timeout: ${opts.timeout}ms, force: ${opts.force})`);

  let nodeId;
  if (typeof selectorOrNodeId === 'string') {
    nodeId = await querySelector(selectorOrNodeId, opts);
  } else {
    nodeId = selectorOrNodeId;
  }

  // Select the option using JavaScript
  await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const select = document.querySelector('${typeof selectorOrNodeId === 'string' ? selectorOrNodeId : '[data-node-id="' + selectorOrNodeId + '"]'}');
        if (!select) throw new Error('Element not found');
        
        if (select.tagName.toLowerCase() !== 'select') {
          throw new Error('Element is not a select dropdown');
        }
        
        ${opts.force ? '' : `
        if (select.disabled && !${opts.force}) {
          throw new Error('Element is disabled');
        }
        `}
        
        // Try to find option by value, text, or label
        const option = Array.from(select.options).find(opt => 
          opt.value === '${value}' || 
          opt.text === '${value}' || 
          opt.label === '${value}'
        );
        
        if (!option) {
          throw new Error('Option not found: ${value}');
        }
        
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
      })()
    `
  });

  console.log('✅ Option selected successfully');
}, 'selectOption');

// =============================================================================
// 3. ELEMENT STATE METHODS - Check element states
// =============================================================================

// Check if element is visible
export const isVisible = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`👁️ Checking visibility: ${selectorOrNodeId} (timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${typeof selectorOrNodeId === 'string' ? selectorOrNodeId : '[data-node-id="' + selectorOrNodeId + '"]'}');
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               rect.width > 0 && 
               rect.height > 0;
      })()
    `,
    returnByValue: true
  });

  return result.result.value;
}, 'isVisible');

// Check if element is enabled
export const isEnabled = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🔓 Checking enabled state: ${selectorOrNodeId} (timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${typeof selectorOrNodeId === 'string' ? selectorOrNodeId : '[data-node-id="' + selectorOrNodeId + '"]'}');
        if (!element) return false;
        
        return !element.disabled && 
               !element.hasAttribute('disabled') &&
               element.getAttribute('aria-disabled') !== 'true';
      })()
    `,
    returnByValue: true
  });

  return result.result.value;
}, 'isEnabled');

// Check if element is disabled
export const isDisabled = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const enabled = await isEnabled(selectorOrNodeId, opts);
  return !enabled;
}, 'isDisabled');

// Check if checkbox/radio is checked
export const isChecked = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`☑️ Checking checked state: ${selectorOrNodeId} (timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${typeof selectorOrNodeId === 'string' ? selectorOrNodeId : '[data-node-id="' + selectorOrNodeId + '"]'}');
        if (!element) return false;
        
        if (element.type !== 'checkbox' && element.type !== 'radio') {
          throw new Error('Element is not checkable (must be checkbox or radio)');
        }
        
        return element.checked;
      })()
    `,
    returnByValue: true
  });

  return result.result.value;
}, 'isChecked');

// =============================================================================
// 📱 MEDIUM PRIORITY METHODS
// =============================================================================

// 4. MOUSE ACTIONS - Advanced mouse interactions
// =============================================================================

// Hover over element
export const hover = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🫲 Hovering: ${selectorOrNodeId} (timeout: ${opts.timeout}ms)`);

  await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${typeof selectorOrNodeId === 'string' ? selectorOrNodeId : '[data-node-id="' + selectorOrNodeId + '"]'}');
        if (!element) throw new Error('Element not found');
        
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Create and dispatch mouse events
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        const events = ['mouseenter', 'mouseover', 'mousemove'];
        events.forEach(eventType => {
          const event = new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y
          });
          element.dispatchEvent(event);
        });
      })()
    `
  });

  console.log('✅ Element hovered successfully');
}, 'hover');

// Double click element
export const doubleClick = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🖱️🖱️ Double clicking: ${selectorOrNodeId} (timeout: ${opts.timeout}ms, force: ${opts.force})`);

  await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${typeof selectorOrNodeId === 'string' ? selectorOrNodeId : '[data-node-id="' + selectorOrNodeId + '"]'}');
        if (!element) throw new Error('Element not found');
        
        ${opts.force ? '' : `
        if (element.disabled) {
          throw new Error('Element is disabled');
        }
        `}
        
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Dispatch double click event
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        const dblClickEvent = new MouseEvent('dblclick', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y
        });
        
        element.dispatchEvent(dblClickEvent);
        element.click(); // Some elements need explicit click too
      })()
    `
  });

  console.log('✅ Element double clicked successfully');
}, 'doubleClick');

// Right click element (context menu)
export const rightClick = withErrorRecovery(async (selectorOrNodeId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🖱️➡️ Right clicking: ${selectorOrNodeId} (timeout: ${opts.timeout}ms, force: ${opts.force})`);

  await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('${typeof selectorOrNodeId === 'string' ? selectorOrNodeId : '[data-node-id="' + selectorOrNodeId + '"]'}');
        if (!element) throw new Error('Element not found');
        
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Dispatch context menu event
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        const contextMenuEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          button: 2
        });
        
        element.dispatchEvent(contextMenuEvent);
      })()
    `
  });

  console.log('✅ Element right clicked successfully');
}, 'rightClick');

// =============================================================================
// 5. LOCATOR CHAINING - Element collection methods
// =============================================================================

// Get first matching element
export const first = withErrorRecovery(async (selector, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🥇 Getting first element: ${selector} (timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const elements = document.querySelectorAll('${selector}');
        if (elements.length === 0) {
          throw new Error('No elements found with selector: ${selector}');
        }
        return elements[0];
      })()
    `,
    returnByValue: false
  });

  if (result.result.objectId) {
    return result.result.objectId;
  }

  throw new Error(`No elements found with selector: ${selector}`);
}, 'first');

// Get last matching element
export const last = withErrorRecovery(async (selector, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🥉 Getting last element: ${selector} (timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const elements = document.querySelectorAll('${selector}');
        if (elements.length === 0) {
          throw new Error('No elements found with selector: ${selector}');
        }
        return elements[elements.length - 1];
      })()
    `,
    returnByValue: false
  });

  if (result.result.objectId) {
    return result.result.objectId;
  }

  throw new Error(`No elements found with selector: ${selector}`);
}, 'last');

// Get nth matching element (0-indexed)
export const nth = withErrorRecovery(async (selector, index, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🔢 Getting element at index ${index}: ${selector} (timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const elements = document.querySelectorAll('${selector}');
        if (elements.length === 0) {
          throw new Error('No elements found with selector: ${selector}');
        }
        if (${index} >= elements.length || ${index} < 0) {
          throw new Error('Index ${index} out of bounds. Found ${elements.length} elements.');
        }
        return elements[${index}];
      })()
    `,
    returnByValue: false
  });

  if (result.result.objectId) {
    return result.result.objectId;
  }

  throw new Error(`Element at index ${index} not found with selector: ${selector}`);
}, 'nth');

// ✨ TIER 1 SMART LOCATORS - Additional Playwright-style locators

// Get element by placeholder text
export const getByPlaceholder = withErrorRecovery(async (placeholderText, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🔍 Finding element by placeholder: "${placeholderText}" (timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('input[placeholder*="${placeholderText}"], textarea[placeholder*="${placeholderText}"]');
        return element; // Return null if not found instead of throwing
      })()
    `,
    returnByValue: false
  });

  if (result.result.objectId) {
    // Check if the returned object is an Error
    const typeCheck = await session.send('Runtime.callFunctionOn', {
      objectId: result.result.objectId,
      functionDeclaration: 'function() { return this instanceof Error ? "ERROR" : this.tagName || "UNKNOWN"; }',
      returnByValue: true
    });

    if (typeCheck.result.value === 'ERROR') {
      throw new Error(`Element with placeholder "${placeholderText}" not found`);
    }

    console.log(`✅ Found element by placeholder: "${placeholderText}"`);
    return result.result.objectId;
  }

  throw new Error(`Element with placeholder "${placeholderText}" not found`);
}, 'getByPlaceholder');

// Get element by test id (data-testid attribute)
export const getByTestId = withErrorRecovery(async (testId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🧪 Finding element by test id: "${testId}" (timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('[data-testid="${testId}"]');
        return element; // Return null if not found instead of throwing
      })()
    `,
    returnByValue: false
  });

  if (result.result.objectId) {
    // Check if the returned object is an Error
    const typeCheck = await session.send('Runtime.callFunctionOn', {
      objectId: result.result.objectId,
      functionDeclaration: 'function() { return this instanceof Error ? "ERROR" : this.tagName || "UNKNOWN"; }',
      returnByValue: true
    });

    if (typeCheck.result.value === 'ERROR') {
      throw new Error(`Element with test id "${testId}" not found`);
    }

    console.log(`✅ Found element by test id: "${testId}"`);
    return result.result.objectId;
  }

  throw new Error(`Element with test id "${testId}" not found`);
}, 'getByTestId');

// Get element by title attribute
export const getByTitle = withErrorRecovery(async (titleText, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`📝 Finding element by title: "${titleText}" (timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('[title*="${titleText}"]');
        if (!element) {
          throw new Error('Element with title "${titleText}" not found');
        }
        return element;
      })()
    `,
    returnByValue: false
  });

  if (result.result.objectId) {
    console.log(`✅ Found element by title: "${titleText}"`);
    return result.result.objectId;
  }

  throw new Error(`Element with title "${titleText}" not found`);
}, 'getByTitle');

// Get element by alt text (for images)
export const getByAltText = withErrorRecovery(async (altText, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🖼️ Finding element by alt text: "${altText}" (timeout: ${opts.timeout}ms)`);

  const result = await session.send('Runtime.evaluate', {
    expression: `
      (() => {
        const element = document.querySelector('img[alt*="${altText}"]');
        if (!element) {
          throw new Error('Image with alt text "${altText}" not found');
        }
        return element;
      })()
    `,
    returnByValue: false
  });

  if (result.result.objectId) {
    console.log(`✅ Found image by alt text: "${altText}"`);
    return result.result.objectId;
  }

  throw new Error(`Image with alt text "${altText}" not found`);
}, 'getByAltText');

// ⏳ TIER 1 ADVANCED WAITING METHODS

// Wait for text to appear anywhere on the page
export const waitForText = withErrorRecovery(async (text, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`⏳ Waiting for text: "${text}" (timeout: ${opts.timeout}ms)`);

  const startTime = Date.now();

  while (Date.now() - startTime < opts.timeout) {
    try {
      const result = await session.send('Runtime.evaluate', {
        expression: `document.body.textContent.includes('${text}')`,
        returnByValue: true
      });

      if (result.result.value === true) {
        console.log(`✅ Text found: "${text}"`);
        return true;
      }
    } catch (error) {
      // Continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Text "${text}" not found within ${opts.timeout}ms`);
}, 'waitForText');

// Wait for URL to match pattern
export const waitForURL = withErrorRecovery(async (urlPattern, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`⏳ Waiting for URL pattern: "${urlPattern}" (timeout: ${opts.timeout}ms)`);

  const startTime = Date.now();

  while (Date.now() - startTime < opts.timeout) {
    try {
      const result = await session.send('Runtime.evaluate', {
        expression: 'window.location.href',
        returnByValue: true
      });

      const currentUrl = result.result.value;
      const regex = new RegExp(urlPattern);

      if (regex.test(currentUrl)) {
        console.log(`✅ URL matches pattern: "${urlPattern}" (current: ${currentUrl})`);
        return currentUrl;
      }
    } catch (error) {
      // Continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`URL pattern "${urlPattern}" not matched within ${opts.timeout}ms`);
}, 'waitForURL');

// Wait for page load state
export const waitForLoadState = withErrorRecovery(async (state = 'load', options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`⏳ Waiting for load state: "${state}" (timeout: ${opts.timeout}ms)`);

  const startTime = Date.now();

  while (Date.now() - startTime < opts.timeout) {
    try {
      const result = await session.send('Runtime.evaluate', {
        expression: 'document.readyState',
        returnByValue: true
      });

      const currentState = result.result.value;

      if (state === 'load' && currentState === 'complete') {
        console.log(`✅ Page load state reached: "${state}"`);
        return true;
      } else if (state === 'domcontentloaded' && (currentState === 'interactive' || currentState === 'complete')) {
        console.log(`✅ Page load state reached: "${state}"`);
        return true;
      } else if (state === currentState) {
        console.log(`✅ Page load state reached: "${state}"`);
        return true;
      }
    } catch (error) {
      // Continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Load state "${state}" not reached within ${opts.timeout}ms`);
}, 'waitForLoadState');

// Wait for function to return truthy value
export const waitForFunction = withErrorRecovery(async (fn, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`⏳ Waiting for function to return truthy (timeout: ${opts.timeout}ms)`);

  const startTime = Date.now();
  const functionString = typeof fn === 'function' ? fn.toString() : fn;

  while (Date.now() - startTime < opts.timeout) {
    try {
      const result = await session.send('Runtime.evaluate', {
        expression: `(${functionString})()`,
        returnByValue: true
      });

      if (result.result.value) {
        console.log('✅ Function returned truthy value');
        return result.result.value;
      }
    } catch (error) {
      // Continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Function did not return truthy value within ${opts.timeout}ms`);
}, 'waitForFunction');

// ⌨️ TIER 1 FILE UPLOAD & KEYBOARD ACTIONS

// Upload file to file input
export const uploadFile = withErrorRecovery(async (selectorOrNodeId, filePath, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`📁 Uploading file: ${filePath} to ${selectorOrNodeId} (timeout: ${opts.timeout}ms)`);

  // First get the element
  let nodeId;
  if (typeof selectorOrNodeId === 'string') {
    const result = await session.send('Runtime.evaluate', {
      expression: `document.querySelector('${selectorOrNodeId}')`,
      returnByValue: false
    });

    if (!result.result.objectId) {
      throw new Error(`Element not found: ${selectorOrNodeId}`);
    }

    const domResult = await session.send('DOM.requestNode', {
      objectId: result.result.objectId
    });
    nodeId = domResult.nodeId;
  } else {
    nodeId = selectorOrNodeId;
  }

  // Set file for input
  await session.send('DOM.setFileInputFiles', {
    files: [filePath],
    nodeId: nodeId
  });

  console.log(`✅ File uploaded: ${filePath}`);
  return nodeId;
}, 'uploadFile');

// Press a key
export const press = withErrorRecovery(async (key, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`⌨️ Pressing key: "${key}" (timeout: ${opts.timeout}ms)`);

  // Send key down and up events
  await session.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: key
  });

  await session.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: key
  });

  console.log(`✅ Key pressed: "${key}"`);
}, 'press');

// Type text into currently focused element (simulates typing each character)
export const type = withErrorRecovery(async (text, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`⌨️ Typing text: "${text}" (timeout: ${opts.timeout}ms)`);

  // Type each character
  for (const char of text) {
    await session.send('Input.dispatchKeyEvent', {
      type: 'char',
      text: char
    });

    // Small delay between characters for realism
    await new Promise(resolve => setTimeout(resolve, 30));
  }

  console.log(`✅ Text typed: "${text}"`);
}, 'type');

// 🌐 TIER 2 NETWORK INTERCEPTION & API TESTING

// Network request interception storage
const networkRequests = new Map();
const networkResponses = new Map();
let requestInterceptionEnabled = false;

// Enable network request interception
export const enableNetworkInterception = withErrorRecovery(async (options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🌐 Enabling network interception (timeout: ${opts.timeout}ms)`);

  await session.send('Network.enable');
  await session.send('Network.setRequestInterception', {
    patterns: [{ urlPattern: '*' }]
  });

  // Listen for network events
  const ws = session._ws;
  if (ws) {
    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);

        // Track requests
        if (data.method === 'Network.requestWillBeSent') {
          networkRequests.set(data.params.requestId, {
            url: data.params.request.url,
            method: data.params.request.method,
            headers: data.params.request.headers,
            postData: data.params.request.postData,
            timestamp: Date.now()
          });
        }

        // Track responses
        if (data.method === 'Network.responseReceived') {
          networkResponses.set(data.params.requestId, {
            status: data.params.response.status,
            statusText: data.params.response.statusText,
            headers: data.params.response.headers,
            mimeType: data.params.response.mimeType,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        // Ignore parsing errors
      }
    });
  }

  requestInterceptionEnabled = true;
  console.log('✅ Network interception enabled');
}, 'enableNetworkInterception');

// Wait for network request
export const waitForRequest = withErrorRecovery(async (urlPattern, options = {}) => {
  const opts = getOptions(options);

  console.log(`🌐 Waiting for request: "${urlPattern}" (timeout: ${opts.timeout}ms)`);

  const startTime = Date.now();
  const regex = new RegExp(urlPattern);

  while (Date.now() - startTime < opts.timeout) {
    for (const [requestId, request] of networkRequests.entries()) {
      if (regex.test(request.url)) {
        console.log(`✅ Request found: ${request.method} ${request.url}`);
        return { requestId, ...request };
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Request matching "${urlPattern}" not found within ${opts.timeout}ms`);
}, 'waitForRequest');

// Wait for network response
export const waitForResponse = withErrorRecovery(async (urlPattern, options = {}) => {
  const opts = getOptions(options);

  console.log(`🌐 Waiting for response: "${urlPattern}" (timeout: ${opts.timeout}ms)`);

  const startTime = Date.now();
  const regex = new RegExp(urlPattern);

  while (Date.now() - startTime < opts.timeout) {
    for (const [requestId, request] of networkRequests.entries()) {
      if (regex.test(request.url) && networkResponses.has(requestId)) {
        const response = networkResponses.get(requestId);
        console.log(`✅ Response found: ${response.status} ${request.url}`);
        return { requestId, request, response };
      }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Response matching "${urlPattern}" not found within ${opts.timeout}ms`);
}, 'waitForResponse');

// Get all network requests
export const getNetworkRequests = withErrorRecovery(async (urlPattern = null, options = {}) => {
  console.log(`🌐 Getting network requests${urlPattern ? ` matching: "${urlPattern}"` : ''}`);

  let requests = Array.from(networkRequests.entries()).map(([requestId, request]) => ({
    requestId,
    ...request
  }));

  if (urlPattern) {
    const regex = new RegExp(urlPattern);
    requests = requests.filter(req => regex.test(req.url));
  }

  console.log(`✅ Found ${requests.length} network requests`);
  return requests;
}, 'getNetworkRequests');

// Clear network request/response history
export const clearNetworkHistory = withErrorRecovery(async (options = {}) => {
  console.log('🌐 Clearing network history');

  networkRequests.clear();
  networkResponses.clear();

  console.log('✅ Network history cleared');
}, 'clearNetworkHistory');

// Mock network response
export const mockResponse = withErrorRecovery(async (urlPattern, responseData, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🌐 Setting up mock response for: "${urlPattern}"`);

  if (!requestInterceptionEnabled) {
    await enableNetworkInterception(options);
  }

  // This is a simplified mock - in production you'd need more sophisticated request matching
  const ws = session._ws;
  if (ws) {
    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);

        if (data.method === 'Network.requestIntercepted') {
          const request = data.params;
          const regex = new RegExp(urlPattern);

          if (regex.test(request.request.url)) {
            // Mock the response
            session.send('Network.continueInterceptedRequest', {
              interceptionId: request.interceptionId,
              rawResponse: Buffer.from(
                `HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: ${responseData.length}\r\n\r\n${responseData}`
              ).toString('base64')
            });

            console.log(`✅ Mocked response for: ${request.request.url}`);
          } else {
            // Continue with original request
            session.send('Network.continueInterceptedRequest', {
              interceptionId: request.interceptionId
            });
          }
        }
      } catch (error) {
        // Ignore parsing errors
      }
    });
  }

  console.log(`✅ Mock response setup for pattern: "${urlPattern}"`);
}, 'mockResponse');

// 📱 TIER 2 MULTI-TAB & IFRAME SUPPORT

// Get all browser targets (tabs)
export const getAllTabs = withErrorRecovery(async (options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log('📱 Getting all browser tabs');

  const result = await session.send('Target.getTargets');
  const tabs = result.targets.filter(target => target.type === 'page');

  console.log(`✅ Found ${tabs.length} tabs`);
  return tabs;
}, 'getAllTabs');

// Create new tab
export const createNewTab = withErrorRecovery(async (url = 'about:blank', options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`📱 Creating new tab: ${url}`);

  const result = await session.send('Target.createTarget', {
    url: url
  });

  console.log(`✅ New tab created: ${result.targetId}`);
  return result.targetId;
}, 'createNewTab');

// Switch to tab by target ID
export const switchToTab = withErrorRecovery(async (targetId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`📱 Switching to tab: ${targetId}`);

  await session.send('Target.activateTarget', {
    targetId: targetId
  });

  console.log(`✅ Switched to tab: ${targetId}`);
}, 'switchToTab');

// Close tab by target ID
export const closeTab = withErrorRecovery(async (targetId, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`📱 Closing tab: ${targetId}`);

  await session.send('Target.closeTarget', {
    targetId: targetId
  });

  console.log(`✅ Tab closed: ${targetId}`);
}, 'closeTab');

// Switch to iframe
export const switchToFrame = withErrorRecovery(async (frameSelector, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🖼️ Switching to iframe: ${frameSelector}`);

  // Get the iframe element
  const result = await session.send('Runtime.evaluate', {
    expression: `document.querySelector('${frameSelector}')`,
    returnByValue: false
  });

  if (!result.result.objectId) {
    throw new Error(`Iframe not found: ${frameSelector}`);
  }

  // Get the frame ID from the iframe element
  const frameResult = await session.send('DOM.requestNode', {
    objectId: result.result.objectId
  });

  const nodeDetails = await session.send('DOM.describeNode', {
    nodeId: frameResult.nodeId
  });

  if (nodeDetails.node.frameId) {
    // Switch to the frame
    await session.send('Page.setDocumentContent', {
      frameId: nodeDetails.node.frameId
    });

    console.log(`✅ Switched to iframe: ${frameSelector}`);
    return nodeDetails.node.frameId;
  }

  throw new Error(`Could not switch to iframe: ${frameSelector}`);
}, 'switchToFrame');

// Switch back to main frame
export const switchToMainFrame = withErrorRecovery(async (options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log('🖼️ Switching back to main frame');

  // Get main frame
  const frameTree = await session.send('Page.getFrameTree');
  const mainFrameId = frameTree.frameTree.frame.id;

  await session.send('Page.setDocumentContent', {
    frameId: mainFrameId
  });

  console.log('✅ Switched to main frame');
}, 'switchToMainFrame');

// 📱 TIER 2 MOBILE & DEVICE EMULATION

// Set device emulation
export const emulateDevice = withErrorRecovery(async (deviceName, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`📱 Emulating device: ${deviceName}`);

  // Common device presets
  const devices = {
    'iPhone 12': {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    },
    'iPad': {
      width: 820,
      height: 1180,
      deviceScaleFactor: 2,
      mobile: true,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    },
    'Samsung Galaxy S21': {
      width: 384,
      height: 854,
      deviceScaleFactor: 2.75,
      mobile: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Mobile Safari/537.36'
    },
    'Desktop': {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      mobile: false,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  };

  const device = devices[deviceName];
  if (!device) {
    throw new Error(`Unknown device: ${deviceName}. Available: ${Object.keys(devices).join(', ')}`);
  }

  // Set device metrics
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: device.width,
    height: device.height,
    deviceScaleFactor: device.deviceScaleFactor,
    mobile: device.mobile
  });

  // Set user agent
  await session.send('Network.setUserAgentOverride', {
    userAgent: device.userAgent
  });

  console.log(`✅ Device emulation set: ${deviceName} (${device.width}x${device.height})`);
}, 'emulateDevice');

// Set custom viewport
export const setViewport = withErrorRecovery(async (width, height, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`📱 Setting viewport: ${width}x${height}`);

  await session.send('Emulation.setDeviceMetricsOverride', {
    width: width,
    height: height,
    deviceScaleFactor: options.deviceScaleFactor || 1,
    mobile: options.mobile || false
  });

  console.log(`✅ Viewport set: ${width}x${height}`);
}, 'setViewport');

// Emulate geolocation
export const setGeolocation = withErrorRecovery(async (latitude, longitude, accuracy = 100, options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log(`🌍 Setting geolocation: ${latitude}, ${longitude}`);

  await session.send('Emulation.setGeolocationOverride', {
    latitude: latitude,
    longitude: longitude,
    accuracy: accuracy
  });

  console.log(`✅ Geolocation set: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
}, 'setGeolocation');

// Clear device emulation
export const clearDeviceEmulation = withErrorRecovery(async (options = {}) => {
  const opts = getOptions(options);
  const session = opts.session || getSession();

  console.log('📱 Clearing device emulation');

  await session.send('Emulation.clearDeviceMetricsOverride');
  await session.send('Network.setUserAgentOverride', { userAgent: '' });

  console.log('✅ Device emulation cleared');
}, 'clearDeviceEmulation');
