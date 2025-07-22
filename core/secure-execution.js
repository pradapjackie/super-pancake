// Secure execution utilities for Chrome DevTools Protocol operations

import { SuperPancakeError, SecurityError, validateSession } from './errors.js';

// Secure function execution with parameterized calls
export async function executeSecureFunction(session, nodeId, functionName, params = []) {
  validateSession(session);

  if (!nodeId) {
    throw new SuperPancakeError('NodeId is required for function execution', 'INVALID_NODE_ID');
  }

  try {
    const { object } = await session.send('DOM.resolveNode', { nodeId });
    if (!object || !object.objectId) {
      throw new SuperPancakeError('Failed to resolve node to object', 'NODE_RESOLUTION_FAILED');
    }

    return await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: getSecureFunction(functionName),
      arguments: params.map(param => ({ value: param })),
      returnByValue: true
    });
  } catch (error) {
    throw new SuperPancakeError(
      `Secure function execution failed: ${error.message}`,
      'FUNCTION_EXECUTION_FAILED',
      { functionName, nodeId, params }
    );
  }
}

// Predefined secure functions (no string interpolation)
const SECURE_FUNCTIONS = {
  click: 'function() { this.click(); }',

  focus: 'function() { this.focus(); }',

  setValue: `function(value) { 
    this.focus();
    this.value = value;
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }`,

  getText: 'function() { return this.innerText || this.textContent; }',

  getAttribute: 'function(attrName) { return this.getAttribute(attrName); }',

  setAttribute: `function(attrName, value) { 
    this.setAttribute(attrName, value); 
  }`,

  isVisible: `function() {
    const style = window.getComputedStyle(this);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           this.offsetParent !== null;
  }`,

  isEnabled: 'function() { return !this.disabled; }',

  isChecked: 'function() { return this.checked || false; }',

  setChecked: `function(checked) {
    this.checked = checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }`,

  selectOption: `function(values) {
    if (this.tagName !== 'SELECT') return false;
    const valueArray = Array.isArray(values) ? values : [values];
    Array.from(this.options).forEach(option => {
      option.selected = valueArray.includes(option.value);
    });
    this.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }`,

  getSelectedOptions: `function() {
    if (this.tagName !== 'SELECT') return [];
    return Array.from(this.selectedOptions).map(option => ({
      value: option.value,
      text: option.textContent.trim(),
      index: option.index
    }));
  }`,

  getFormData: `function() {
    const formData = {};
    const elements = this.elements;
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const name = element.name;
      if (!name) continue;
      
      switch (element.type) {
        case 'checkbox':
          if (element.checked) {
            formData[name] = formData[name] ? 
              (Array.isArray(formData[name]) ? [...formData[name], element.value] : [formData[name], element.value]) : 
              element.value;
          }
          break;
        case 'radio':
          if (element.checked) {
            formData[name] = element.value;
          }
          break;
        case 'select-multiple':
          formData[name] = Array.from(element.selectedOptions).map(option => option.value);
          break;
        case 'file':
          formData[name] = element.files ? Array.from(element.files).map(file => file.name) : [];
          break;
        default:
          formData[name] = element.value;
      }
    }
    return formData;
  }`,

  scrollIntoView: `function(options) {
    const scrollOptions = options || { behavior: 'smooth', block: 'center' };
    this.scrollIntoView(scrollOptions);
  }`,

  getBoundingRect: `function() {
    const rect = this.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right
    };
  }`,

  getElementInfo: `function() {
    return {
      tagName: this.tagName.toLowerCase(),
      className: this.className,
      id: this.id,
      name: this.name,
      value: this.value,
      textContent: this.textContent?.trim(),
      checked: this.checked,
      disabled: this.disabled,
      selected: this.selected
    };
  }`,

  doubleClick: `function() {
    const event = new MouseEvent('dblclick', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    this.dispatchEvent(event);
  }`,

  rightClick: `function() {
    const event = new MouseEvent('contextmenu', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    this.dispatchEvent(event);
  }`,

  pressKey: `function(key) {
    const keyEvent = new KeyboardEvent('keydown', {
      key: key,
      bubbles: true,
      cancelable: true
    });
    this.dispatchEvent(keyEvent);
  }`,

  submitForm: 'function() { this.submit(); }',

  resetForm: 'function() { this.reset(); }',

  clearValue: `function() {
    this.value = '';
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }`
};

function getSecureFunction(functionName) {
  const func = SECURE_FUNCTIONS[functionName];
  if (!func) {
    throw new SecurityError(`Unknown secure function: ${functionName}`, { functionName });
  }
  return func;
}

// Secure evaluation for page-level operations
export async function executeSecurePageFunction(session, functionName, params = []) {
  validateSession(session);

  const pageFunction = getSecurePageFunction(functionName);

  try {
    return await session.send('Runtime.evaluate', {
      expression: `(${pageFunction})(${params.map(p => JSON.stringify(p)).join(', ')})`,
      returnByValue: true
    });
  } catch (error) {
    throw new SuperPancakeError(
      `Secure page function execution failed: ${error.message}`,
      'PAGE_FUNCTION_EXECUTION_FAILED',
      { functionName, params }
    );
  }
}

const SECURE_PAGE_FUNCTIONS = {
  scrollToTop: `function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }`,

  scrollToBottom: `function() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }`,

  getScrollPosition: `function() {
    return { x: window.scrollX, y: window.scrollY };
  }`,

  getViewportSize: `function() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }`,

  getDocumentReady: `function() {
    return document.readyState;
  }`
};

function getSecurePageFunction(functionName) {
  const func = SECURE_PAGE_FUNCTIONS[functionName];
  if (!func) {
    throw new SecurityError(`Unknown secure page function: ${functionName}`, { functionName });
  }
  return func;
}

// Safe text insertion with encoding
export function createSecureTextInsertion(text) {
  // Encode text to prevent injection
  const encodedText = JSON.stringify(String(text));
  return `function(encodedText) {
    const text = JSON.parse(encodedText);
    this.focus();
    this.value = text;
    this.dispatchEvent(new Event('input', { bubbles: true }));
  }`;
}

// Element query utilities with security checks
export async function resolveNodeSecurely(session, nodeId) {
  validateSession(session);

  if (!nodeId || typeof nodeId !== 'number') {
    throw new SecurityError('Invalid nodeId provided', { nodeId });
  }

  try {
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) {
      throw new SuperPancakeError('Failed to resolve node', 'NODE_RESOLUTION_FAILED', { nodeId });
    }
    return resolved;
  } catch (error) {
    throw new SuperPancakeError(
      `Node resolution failed: ${error.message}`,
      'NODE_RESOLUTION_ERROR',
      { nodeId }
    );
  }
}
