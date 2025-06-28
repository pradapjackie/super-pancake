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
    const fs = await import('fs');
    fs.writeFileSync(fileName, Buffer.from(data, 'base64'));
  }

export async function takeElementScreenshot(session, selector, fileName = 'element.png') {
  const nodeId = await querySelector(session, selector);
  const { model } = await session.send('DOM.getBoxModel', { nodeId });
  const { data } = await session.send('Page.captureScreenshot', {
    format: 'png',
    clip: {
      x: model.content[0],
      y: model.content[1],
      width: model.width,
      height: model.height,
      scale: 1,
    },
  });

  const dir = path.dirname(fileName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fileName, Buffer.from(data, 'base64'));
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