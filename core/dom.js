import { config } from '../config.js';
import path from "path";
import fs from "fs";
// Enable required domains
export async function enableDOM(session) {
    try {
      await session.send('Page.enable');
      await session.send('DOM.enable');
      await session.send('Runtime.enable');
    } catch (error) {
      throw new Error(`❌ Failed to enable DOM: ${error.message}`);
    }
  }

  // Navigation
export async function navigateTo(session, url) {
  try {
    await session.send('Page.navigate', { url });

    // Wait for Page.loadEventFired event by polling
    while (true) {
      const { result } = await session.send('Runtime.evaluate', {
        expression: 'document.readyState',
        returnByValue: true,
      });

      if (result.value === 'complete') break;
      await waitForTimeout(config.pollInterval || 100);
    }
  } catch (error) {
    throw new Error(`❌ Failed to navigate to ${url}: ${error.message}`);
  }
}

  // Query selectors
  export async function querySelector(session, selector) {
    try {
      const { root: { nodeId } } = await session.send('DOM.getDocument');
      const { nodeId: foundId } = await session.send('DOM.querySelector', { nodeId, selector });
      if (!foundId) throw new Error(`❌ Element not found for selector: "${selector}"`);
      return foundId;
    } catch (error) {
      throw new Error(`❌ Failed to query selector "${selector}": ${error.message}`);
    }
  }

  export async function querySelectorAll(session, selector) {
    const { root: { nodeId } } = await session.send('DOM.getDocument');
    const { nodeIds } = await session.send('DOM.querySelectorAll', { nodeId, selector });
    return nodeIds;
  }

  // Basic actions
  export async function click(session, selectorOrNodeId) {
    try {
      const nodeId = typeof selectorOrNodeId === 'string'
        ? await querySelector(session, selectorOrNodeId)
        : selectorOrNodeId;

      const { object } = await resolveNode(session, nodeId);
      await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: 'function() { this.click(); }',
      });
    } catch (error) {
      // Only log top-level message, not stack
      console.error(`❌ Failed to click on "${selectorOrNodeId}": ${error.message}`);
      throw new Error(`❌ Failed to click on "${selectorOrNodeId}": ${error.message}`);
    }
  }

  export async function type(session, selector, text) {
    try {
      const { object } = await resolveNode(session, await querySelector(session, selector));
      await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() {
          this.focus();
          this.value = ${JSON.stringify(text)};
          this.dispatchEvent(new Event('input', { bubbles: true }));
        }`,
      });
    } catch (error) {
      throw new Error(`❌ Failed to type "${text}" into "${selector}": ${error.message}`);
    }
  }

  export async function clearInput(session, selector) {
    await type(session, selector, '');
  }

  export async function getText(session, nodeId) {
    try {
      const { object } = await resolveNode(session, nodeId);
      const { result } = await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: 'function() { return this.innerText; }',
        returnByValue: true,
      });
      return result.value;
    } catch (error) {
      throw new Error(`❌ Failed to get text from nodeId "${nodeId}": ${error.message}`);
    }
  }

  export async function getAttribute(session, selector, attrName) {
    try {
      const { object } = await resolveNode(session, await querySelector(session, selector));
      const { result } = await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() { return this.getAttribute('${attrName}'); }`,
        returnByValue: true,
      });
      return result.value;
    } catch (error) {
      throw new Error(`❌ Failed to get attribute "${attrName}" from "${selector}": ${error.message}`);
    }
  }

  export async function setAttribute(session, selector, attrName, value) {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() { this.setAttribute('${attrName}', '${value}'); }`,
    });
  }

  export async function isVisible(session, selector) {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const style = window.getComputedStyle(this);
        return style.display !== 'none' && style.visibility !== 'hidden' && this.offsetParent !== null;
      }`,
      returnByValue: true,
    });
    return result.value;
  }

  export async function getValue(session, selector) {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { return this.value; }',
      returnByValue: true,
    });
    return result.value;
  }

  export async function hover(session, selector) {
    const nodeId = await querySelector(session, selector);
    await session.send('Overlay.highlightNode', { nodeId });
  }

export async function reload(session) {
  await session.send('Page.reload');
  await waitForTimeout(config.timeouts.reload || 1000);
}

  export async function goBack(session) {
    await session.send('Page.goBack');
  }

  export async function goForward(session) {
    await session.send('Page.goForward');
  }

  export async function paste(session, selector, text) {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() { this.focus(); this.value += ${JSON.stringify(text)}; }`,
    });
  }

  export async function rightClick(session, selector) {
    const nodeId = await querySelector(session, selector);
    const { x, y, width, height } = await getBoundingBox(session, nodeId);
    const cx = x + width / 2;
    const cy = y + height / 2;
    await session.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'right', clickCount: 1 });
    await session.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx, y: cy, button: 'right', clickCount: 1 });
  }

  export async function scrollIntoView(session, selector) {
    try {
      const { object } = await resolveNode(session, await querySelector(session, selector));
      await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: 'function() { this.scrollIntoView(); }',
      });
    } catch (error) {
      throw new Error(`❌ Failed to scroll into view for "${selector}": ${error.message}`);
    }
  }

  export async function isEnabled(session, selector) {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { return !this.disabled; }',
      returnByValue: true,
    });
    return result.value;
  }

  export async function takeScreenshot(session, fileName = 'screenshot.png') {
    const { data } = await session.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    fs.writeFileSync(fileName, Buffer.from(data, 'base64'));
  }

export async function takeElementScreenshot(session, selector, fileName = 'element.png') {
  const nodeId = await querySelector(session, selector);
  const { model } = await session.send('DOM.getBoxModel', { nodeId });
  // If element has 0 width or height, log a warning and capture full page screenshot as fallback
  if (model.width === 0 || model.height === 0) {
    console.warn(`⚠️ Element has zero width or height for selector: ${selector}. Capturing full page screenshot as fallback.`);
    const fallbackFileName = fileName.replace(/(\.png)?$/, `_${selector.replace(/[^\w-]/g, '_')}.png`);
    const { data } = await session.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const dir = path.dirname(fallbackFileName);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fallbackFileName, Buffer.from(data, 'base64'));
    // Return false to indicate fallback screenshot was taken
    return { fileName: fallbackFileName, isElementScreenshot: false };
  }
  let data;
  try {
    const result = await session.send('Page.captureScreenshot', {
      format: 'png',
      clip: {
        x: model.content[0],
        y: model.content[1],
        width: model.width,
        height: model.height,
        scale: 1,
      },
    });
    if (!result || !result.data) {
      throw new Error('❌ Screenshot capture failed. No data returned.');
    }
    data = result.data;
  } catch (err) {
    throw new Error(`❌ Screenshot capture failed: ${err.message}`);
  }

  const dir = path.dirname(fileName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fileName, Buffer.from(data, 'base64'));
  // Return true to indicate element screenshot was taken
  return { fileName, isElementScreenshot: true };
}
  // Utilities
  export async function waitForTimeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

export async function waitForSelector(session, selector, timeout = config.timeouts.waitForSelector) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const nodeId = await querySelector(session, selector);
      if (nodeId) return nodeId;
    } catch {}
    await waitForTimeout(config.pollInterval || 100);
  }
  throw new Error(`❌ waitForSelector: "${selector}" not found in ${timeout}ms`);
}

  async function getBoundingBox(session, nodeId) {
    const { model } = await session.send('DOM.getBoxModel', { nodeId });
    const [x, y] = model.content;
    return { x, y, width: model.width, height: model.height };
  }

  async function resolveNode(session, nodeId) {
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) throw new Error(`❌ Failed to resolve node: ${nodeId}`);
    return resolved;
  }

  // Form helpers
  export async function fillInput(session, selector, value) {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        this.focus();
        this.value = ${JSON.stringify(value)};
        this.dispatchEvent(new Event('input', { bubbles: true }));
      }`,
    });
  }

  export async function check(session, selector, checked = true) {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        this.checked = ${checked};
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
    });
  }

  export async function selectOption(session, selector, values) {
    if (!Array.isArray(values)) values = [values];
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        Array.from(this.options).forEach(o => o.selected = ${JSON.stringify(values)}.includes(o.value));
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
    });
  }

  export async function triggerClick(session, selector) {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() { this.click(); }`,
    });
  }

  export async function pressKey(session, selector, key) {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const e = new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true });
        this.dispatchEvent(e);
      }`,
    });
  }

  export async function focus(session, selector) {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { this.focus(); }',
    });
  }

  export async function dragDrop(session, sourceSelector, targetSelector) {
    try {
      const sourceId = await querySelector(session, sourceSelector);
      const targetId = await querySelector(session, targetSelector);
      const sourceObj = (await session.send('DOM.resolveNode', { nodeId: sourceId })).object;
      const targetObj = (await session.send('DOM.resolveNode', { nodeId: targetId })).object;

      await session.send('Runtime.callFunctionOn', {
        objectId: sourceObj.objectId,
        functionDeclaration: `function() {
          const event = new DragEvent('dragstart', { bubbles: true });
          this.dispatchEvent(event);
        }`,
      });

      await session.send('Runtime.callFunctionOn', {
        objectId: targetObj.objectId,
        functionDeclaration: `function() {
          const event = new DragEvent('drop', { bubbles: true });
          this.dispatchEvent(event);
        }`,
      });
    } catch (error) {
      throw new Error(`❌ Failed to dragDrop from "${sourceSelector}" to "${targetSelector}": ${error.message}`);
    }
  }

  export async function uploadFileBuffer(session, selector, filename, content) {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const file = new File([new Blob([${JSON.stringify(content)}])], '${filename}', { type: 'text/plain' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        this.files = dataTransfer.files;
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
    });
  }

// ========================================
// ENHANCED WAIT STRATEGIES
// ========================================

export async function waitForElementToBeVisible(session, selector, timeout = config.timeouts?.waitForSelector || 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const nodeId = await querySelector(session, selector);
      if (nodeId && await isVisible(session, nodeId)) {
        return nodeId;
      }
    } catch {}
    await waitForTimeout(config.pollInterval || 100);
  }
  throw new Error(`❌ Element "${selector}" not visible in ${timeout}ms`);
}

export async function waitForElementToBeHidden(session, selector, timeout = config.timeouts?.waitForSelector || 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const nodeId = await querySelector(session, selector);
      if (!nodeId || !await isVisible(session, nodeId)) {
        return true;
      }
    } catch {
      return true; // Element not found = hidden
    }
    await waitForTimeout(config.pollInterval || 100);
  }
  throw new Error(`❌ Element "${selector}" still visible after ${timeout}ms`);
}

export async function waitForElementToBeClickable(session, selector, timeout = config.timeouts?.waitForSelector || 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const nodeId = await querySelector(session, selector);
      if (nodeId && await isVisible(session, nodeId) && await isEnabled(session, nodeId)) {
        return nodeId;
      }
    } catch {}
    await waitForTimeout(config.pollInterval || 100);
  }
  throw new Error(`❌ Element "${selector}" not clickable in ${timeout}ms`);
}

export async function waitForElementToContainText(session, selector, text, timeout = config.timeouts?.waitForSelector || 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const nodeId = await querySelector(session, selector);
      if (nodeId) {
        const elementText = await getText(session, nodeId);
        if (elementText && elementText.includes(text)) {
          return nodeId;
        }
      }
    } catch {}
    await waitForTimeout(config.pollInterval || 100);
  }
  throw new Error(`❌ Element "${selector}" does not contain text "${text}" in ${timeout}ms`);
}

export async function waitForElementToHaveAttribute(session, selector, attribute, value, timeout = config.timeouts?.waitForSelector || 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const attrValue = await getAttribute(session, selector, attribute);
      if (attrValue === value) {
        return await querySelector(session, selector);
      }
    } catch {}
    await waitForTimeout(config.pollInterval || 100);
  }
  throw new Error(`❌ Element "${selector}" does not have attribute "${attribute}" = "${value}" in ${timeout}ms`);
}

export async function waitForElementToBeEnabled(session, selector, timeout = config.timeouts?.waitForSelector || 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const nodeId = await querySelector(session, selector);
      if (nodeId && await isEnabled(session, nodeId)) {
        return nodeId;
      }
    } catch {}
    await waitForTimeout(config.pollInterval || 100);
  }
  throw new Error(`❌ Element "${selector}" not enabled in ${timeout}ms`);
}

export async function waitForElementToBeDisabled(session, selector, timeout = config.timeouts?.waitForSelector || 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const nodeId = await querySelector(session, selector);
      if (nodeId && !await isEnabled(session, nodeId)) {
        return nodeId;
      }
    } catch {}
    await waitForTimeout(config.pollInterval || 100);
  }
  throw new Error(`❌ Element "${selector}" not disabled in ${timeout}ms`);
}

export async function waitForCondition(session, conditionFn, timeout = config.timeouts?.waitForSelector || 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = await conditionFn(session);
      if (result) {
        return result;
      }
    } catch {}
    await waitForTimeout(config.pollInterval || 100);
  }
  throw new Error(`❌ Condition not met in ${timeout}ms`);
}

// ========================================
// ADVANCED FORM METHODS
// ========================================

export async function isChecked(session, selector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { return this.checked || false; }',
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to check if element "${selector}" is checked: ${error.message}`);
  }
}

export async function getSelectedOptions(session, selector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        if (this.tagName !== 'SELECT') return [];
        return Array.from(this.selectedOptions).map(option => ({
          value: option.value,
          text: option.textContent.trim(),
          index: option.index
        }));
      }`,
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get selected options from "${selector}": ${error.message}`);
  }
}

export async function getFormData(session, formSelector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, formSelector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
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
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get form data from "${formSelector}": ${error.message}`);
  }
}

export async function selectMultipleOptions(session, selector, values) {
  try {
    if (!Array.isArray(values)) values = [values];
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        if (this.tagName !== 'SELECT') throw new Error('Element is not a select');
        Array.from(this.options).forEach(option => {
          option.selected = ${JSON.stringify(values)}.includes(option.value);
        });
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
    });
  } catch (error) {
    throw new Error(`❌ Failed to select multiple options in "${selector}": ${error.message}`);
  }
}

export async function submitForm(session, formSelector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, formSelector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { this.submit(); }',
    });
  } catch (error) {
    throw new Error(`❌ Failed to submit form "${formSelector}": ${error.message}`);
  }
}

export async function resetForm(session, formSelector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, formSelector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { this.reset(); }',
    });
  } catch (error) {
    throw new Error(`❌ Failed to reset form "${formSelector}": ${error.message}`);
  }
}

// ========================================
// DATA EXTRACTION METHODS
// ========================================

export async function getTableData(session, tableSelector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, tableSelector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const rows = Array.from(this.querySelectorAll('tr'));
        if (rows.length === 0) return [];
        
        const headerRow = rows[0];
        const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => cell.textContent.trim());
        
        const data = rows.slice(1).map((row, rowIndex) => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          const rowData = { _rowIndex: rowIndex };
          
          headers.forEach((header, index) => {
            const cellText = cells[index] ? cells[index].textContent.trim() : '';
            rowData[header || 'column_' + index] = cellText;
          });
          
          return rowData;
        });
        
        return data;
      }`,
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get table data from "${tableSelector}": ${error.message}`);
  }
}

export async function getTableHeaders(session, tableSelector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, tableSelector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const headerRow = this.querySelector('tr');
        if (!headerRow) return [];
        return Array.from(headerRow.querySelectorAll('th, td')).map(cell => cell.textContent.trim());
      }`,
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get table headers from "${tableSelector}": ${error.message}`);
  }
}

export async function getTableRow(session, tableSelector, rowIndex) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, tableSelector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const rows = Array.from(this.querySelectorAll('tr'));
        const targetRow = rows[${rowIndex}];
        if (!targetRow) return null;
        
        return Array.from(targetRow.querySelectorAll('td, th')).map(cell => cell.textContent.trim());
      }`,
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get table row ${rowIndex} from "${tableSelector}": ${error.message}`);
  }
}

export async function getTableCell(session, tableSelector, rowIndex, columnIndex) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, tableSelector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const rows = Array.from(this.querySelectorAll('tr'));
        const targetRow = rows[${rowIndex}];
        if (!targetRow) return null;
        
        const cells = Array.from(targetRow.querySelectorAll('td, th'));
        const targetCell = cells[${columnIndex}];
        return targetCell ? targetCell.textContent.trim() : null;
      }`,
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get table cell [${rowIndex}, ${columnIndex}] from "${tableSelector}": ${error.message}`);
  }
}

export async function getListItems(session, listSelector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, listSelector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const items = Array.from(this.querySelectorAll('li'));
        return items.map((item, index) => ({
          index: index,
          text: item.textContent.trim(),
          innerHTML: item.innerHTML,
          value: item.value || item.getAttribute('data-value') || null
        }));
      }`,
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get list items from "${listSelector}": ${error.message}`);
  }
}

export async function getListItemByIndex(session, listSelector, index) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, listSelector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const items = Array.from(this.querySelectorAll('li'));
        const item = items[${index}];
        if (!item) return null;
        
        return {
          index: ${index},
          text: item.textContent.trim(),
          innerHTML: item.innerHTML,
          value: item.value || item.getAttribute('data-value') || null
        };
      }`,
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get list item ${index} from "${listSelector}": ${error.message}`);
  }
}

export async function getElementsCount(session, selector) {
  try {
    const { root: { nodeId } } = await session.send('DOM.getDocument');
    const { nodeIds } = await session.send('DOM.querySelectorAll', { nodeId, selector });
    return nodeIds.length;
  } catch (error) {
    throw new Error(`❌ Failed to count elements "${selector}": ${error.message}`);
  }
}

// ========================================
// VISUAL TESTING METHODS
// ========================================

export async function getElementPosition(session, selector) {
  try {
    const nodeId = await querySelector(session, selector);
    const { model } = await session.send('DOM.getBoxModel', { nodeId });
    return {
      x: model.content[0],
      y: model.content[1]
    };
  } catch (error) {
    throw new Error(`❌ Failed to get element position "${selector}": ${error.message}`);
  }
}

export async function getElementSize(session, selector) {
  try {
    const nodeId = await querySelector(session, selector);
    const { model } = await session.send('DOM.getBoxModel', { nodeId });
    return {
      width: model.width,
      height: model.height
    };
  } catch (error) {
    throw new Error(`❌ Failed to get element size "${selector}": ${error.message}`);
  }
}

export async function getElementBounds(session, selector) {
  try {
    const nodeId = await querySelector(session, selector);
    const { model } = await session.send('DOM.getBoxModel', { nodeId });
    return {
      x: model.content[0],
      y: model.content[1],
      width: model.width,
      height: model.height,
      top: model.content[1],
      left: model.content[0],
      bottom: model.content[1] + model.height,
      right: model.content[0] + model.width
    };
  } catch (error) {
    throw new Error(`❌ Failed to get element bounds "${selector}": ${error.message}`);
  }
}

export async function isElementInViewport(session, selector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const rect = this.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
      }`,
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to check if element "${selector}" is in viewport: ${error.message}`);
  }
}

export async function scrollToElement(session, selector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { this.scrollIntoView({ behavior: "smooth", block: "center" }); }',
    });
    // Wait for smooth scroll to complete
    await waitForTimeout(500);
  } catch (error) {
    throw new Error(`❌ Failed to scroll to element "${selector}": ${error.message}`);
  }
}

export async function scrollToTop(session) {
  try {
    await session.send('Runtime.evaluate', {
      expression: 'window.scrollTo({ top: 0, behavior: "smooth" });',
    });
    await waitForTimeout(500);
  } catch (error) {
    throw new Error(`❌ Failed to scroll to top: ${error.message}`);
  }
}

export async function scrollToBottom(session) {
  try {
    await session.send('Runtime.evaluate', {
      expression: 'window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });',
    });
    await waitForTimeout(500);
  } catch (error) {
    throw new Error(`❌ Failed to scroll to bottom: ${error.message}`);
  }
}

export async function getScrollPosition(session) {
  try {
    const { result } = await session.send('Runtime.evaluate', {
      expression: 'JSON.stringify({ x: window.scrollX, y: window.scrollY });',
      returnByValue: true,
    });
    return JSON.parse(result.value);
  } catch (error) {
    throw new Error(`❌ Failed to get scroll position: ${error.message}`);
  }
}

// ========================================
// ADVANCED INTERACTIONS
// ========================================

export async function doubleClick(session, selector) {
  try {
    const nodeId = await querySelector(session, selector);
    const { x, y, width, height } = await getBoundingBox(session, nodeId);
    const cx = x + width / 2;
    const cy = y + height / 2;
    
    await session.send('Input.dispatchMouseEvent', { 
      type: 'mousePressed', 
      x: cx, 
      y: cy, 
      button: 'left', 
      clickCount: 2 
    });
    await session.send('Input.dispatchMouseEvent', { 
      type: 'mouseReleased', 
      x: cx, 
      y: cy, 
      button: 'left', 
      clickCount: 2 
    });
  } catch (error) {
    throw new Error(`❌ Failed to double click "${selector}": ${error.message}`);
  }
}

export async function sendKeys(session, selector, keys) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { this.focus(); }',
    });
    
    // Send each key
    for (const key of keys) {
      await session.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: key,
        code: key,
        text: key.length === 1 ? key : undefined,
      });
      await session.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: key,
        code: key,
        text: key.length === 1 ? key : undefined,
      });
    }
  } catch (error) {
    throw new Error(`❌ Failed to send keys "${keys}" to "${selector}": ${error.message}`);
  }
}

export async function clearAndType(session, selector, text) {
  try {
    // First clear the field
    await clearInput(session, selector);
    // Then type the new text
    await type(session, selector, text);
  } catch (error) {
    throw new Error(`❌ Failed to clear and type "${text}" in "${selector}": ${error.message}`);
  }
}

// ========================================
// ELEMENT ANALYSIS METHODS
// ========================================

export async function getElementTagName(session, selector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { return this.tagName.toLowerCase(); }',
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get tag name of "${selector}": ${error.message}`);
  }
}

export async function getElementClasses(session, selector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { return Array.from(this.classList); }',
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get classes of "${selector}": ${error.message}`);
  }
}

export async function hasClass(session, selector, className) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() { return this.classList.contains('${className}'); }`,
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to check if "${selector}" has class "${className}": ${error.message}`);
  }
}

export async function getElementChildren(session, selector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        return Array.from(this.children).map((child, index) => ({
          index: index,
          tagName: child.tagName.toLowerCase(),
          className: child.className,
          id: child.id,
          textContent: child.textContent.trim()
        }));
      }`,
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get children of "${selector}": ${error.message}`);
  }
}

export async function getElementParent(session, selector) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const { result } = await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const parent = this.parentElement;
        if (!parent) return null;
        return {
          tagName: parent.tagName.toLowerCase(),
          className: parent.className,
          id: parent.id,
          textContent: parent.textContent.trim()
        };
      }`,
      returnByValue: true,
    });
    return result.value;
  } catch (error) {
    throw new Error(`❌ Failed to get parent of "${selector}": ${error.message}`);
  }
}

// ========================================
// ADDITIONAL ADVANCED INTERACTIONS
// ========================================

export async function mouseDown(session, selector, button = 'left') {
  try {
    const nodeId = await querySelector(session, selector);
    const { x, y, width, height } = await getBoundingBox(session, nodeId);
    const cx = x + width / 2;
    const cy = y + height / 2;
    
    await session.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: cx,
      y: cy,
      button: button,
      clickCount: 1
    });
  } catch (error) {
    throw new Error(`❌ Failed to mouse down on "${selector}": ${error.message}`);
  }
}

export async function mouseUp(session, selector, button = 'left') {
  try {
    const nodeId = await querySelector(session, selector);
    const { x, y, width, height } = await getBoundingBox(session, nodeId);
    const cx = x + width / 2;
    const cy = y + height / 2;
    
    await session.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: cx,
      y: cy,
      button: button,
      clickCount: 1
    });
  } catch (error) {
    throw new Error(`❌ Failed to mouse up on "${selector}": ${error.message}`);
  }
}

export async function selectText(session, selector, startOffset, endOffset) {
  try {
    const { object } = await resolveNode(session, await querySelector(session, selector));
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        this.focus();
        if (this.setSelectionRange) {
          this.setSelectionRange(${startOffset}, ${endOffset});
        } else if (this.createTextRange) {
          const range = this.createTextRange();
          range.collapse(true);
          range.moveStart('character', ${startOffset});
          range.moveEnd('character', ${endOffset - startOffset});
          range.select();
        }
      }`,
    });
  } catch (error) {
    throw new Error(`❌ Failed to select text in "${selector}" from ${startOffset} to ${endOffset}: ${error.message}`);
  }
}

export async function uploadMultipleFiles(session, selector, filePaths) {
  try {
    if (!Array.isArray(filePaths)) {
      throw new Error('filePaths must be an array');
    }
    
    const { object } = await resolveNode(session, await querySelector(session, selector));
    const fileContents = [];
    
    // Read all files
    for (const filePath of filePaths) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      const content = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      fileContents.push({
        name: fileName,
        content: Array.from(content)
      });
    }
    
    await session.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: `function() {
        const files = ${JSON.stringify(fileContents)}.map(fileData => {
          const uint8Array = new Uint8Array(fileData.content);
          return new File([uint8Array], fileData.name);
        });
        
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        this.files = dataTransfer.files;
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }`,
    });
  } catch (error) {
    throw new Error(`❌ Failed to upload multiple files to "${selector}": ${error.message}`);
  }
}