export async function enableDOM(session) {
    await session.send('Page.enable');
    await session.send('DOM.enable');
    await session.send('Runtime.enable');
}

export async function navigateTo(session, url) {
    await session.send('Page.navigate', { url });
    await new Promise(resolve => setTimeout(resolve, 2000)); // naive wait
}

export async function querySelector(session, selector) {
    const { root: { nodeId } } = await session.send('DOM.getDocument');
    const { nodeId: foundId } = await session.send('DOM.querySelector', {
        nodeId,
        selector,
    });
    if (!foundId) throw new Error(`❌ Element not found for selector: ${selector}`);
    return foundId;
}

export async function querySelectorAll(session, selector) {
    const { root: { nodeId } } = await session.send('DOM.getDocument');
    const { nodeIds } = await session.send('DOM.querySelectorAll', {
        nodeId,
        selector,
    });
    return nodeIds;
}

export async function click(session, selectorOrNodeId) {
    const nodeId = typeof selectorOrNodeId === 'string'
        ? await querySelector(session, selectorOrNodeId)
        : selectorOrNodeId;

    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) throw new Error(`❌ Failed to resolve nodeId: ${nodeId}`);

    const { object } = resolved;
    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: 'function() { this.click(); }',
    });
}

export async function type(session, selector, text) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) throw new Error(`❌ Cannot resolve selector: ${selector}`);

    const { object } = resolved;
    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() {
      this.focus();
      this.value = ${JSON.stringify(text)};
      this.dispatchEvent(new Event('input', { bubbles: true }));
    }`,
    });
}

export async function clearInput(session, selector) {
    await type(session, selector, '');
}

export async function getText(session, nodeId) {
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) throw new Error(`❌ Failed to resolve nodeId: ${nodeId}`);

    const { object } = resolved;
    const { result } = await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: 'function() { return this.innerText; }',
        returnByValue: true,
    });

    return result.value;
}

export async function getAttribute(session, selector, attrName) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) throw new Error(`❌ Cannot resolve selector: ${selector}`);

    const { object } = resolved;
    const { result } = await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() { return this.getAttribute('${attrName}'); }`,
        returnByValue: true,
    });

    return result.value;
}

export async function setAttribute(session, selector, attrName, value) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) throw new Error(`❌ Cannot resolve selector: ${selector}`);

    const { object } = resolved;
    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() { this.setAttribute('${attrName}', '${value}'); }`,
    });
}

export async function isVisible(session, selector) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) return false;

    const { object } = resolved;
    const { result } = await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() {
      const style = window.getComputedStyle(this);
      return style && style.display !== 'none' && style.visibility !== 'hidden' && this.offsetParent !== null;
    }`,
        returnByValue: true,
    });

    return result.value;
}

export async function getValue(session, selector) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) throw new Error(`❌ Cannot resolve selector: ${selector}`);

    const { object } = resolved;
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
    await new Promise(resolve => setTimeout(resolve, 1000));
}

export async function goBack(session) {
    await session.send('Page.goBack');
}

export async function goForward(session) {
    await session.send('Page.goForward');
}



export async function paste(session, selector, text) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) throw new Error(`❌ Cannot resolve selector: ${selector}`);

    const { object } = resolved;
    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() {
      this.focus();
      this.value += ${JSON.stringify(text)};
    }`,
    });
}

export async function rightClick(session, selector) {
    const nodeId = await querySelector(session, selector);
    const box = await getBoundingBox(session, nodeId);
    await session.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        button: 'right',
        clickCount: 1,
    });
    await session.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        button: 'right',
        clickCount: 1,
    });
}

export async function scrollIntoView(session, selector) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) throw new Error(`❌ Cannot resolve selector: ${selector}`);
    const { object } = resolved;

    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: 'function() { this.scrollIntoView(); }',
    });
}

export async function isEnabled(session, selector) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    if (!resolved || !resolved.object) return false;

    const { object } = resolved;
    const { result } = await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: 'function() { return !this.disabled; }',
        returnByValue: true,
    });

    return result.value;
}

export async function uploadFile(session, selector, filePath) {
    throw new Error('❌ File upload not yet implemented via CDP. Requires input[type="file"] and local patch.');
}

export async function takeScreenshot(session, fileName = 'screenshot.png') {
    const { data } = await session.send('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
    });
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

    const fs = await import('fs');
    fs.writeFileSync(fileName, Buffer.from(data, 'base64'));
}

export async function waitForTimeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForSelector(session, selector, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        try {
            const nodeId = await querySelector(session, selector);
            if (nodeId) return nodeId;
        } catch { }
        await waitForTimeout(100);
    }
    throw new Error(`❌ waitForSelector: ${selector} not found in ${timeout}ms`);
}

async function getBoundingBox(session, nodeId) {
    const { model } = await session.send('DOM.getBoxModel', { nodeId });
    const [x, y] = model.content;
    return { x, y, width: model.width, height: model.height };
}


// Text Input, Date, Time
export async function fillInput(session, selector, value) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    const { object } = resolved;
    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() {
      this.focus();
      this.value = ${JSON.stringify(value)};
      this.dispatchEvent(new Event('input', { bubbles: true }));
    }`,
    });
}

// Check / Uncheck
export async function check(session, selector, checked = true) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    const { object } = resolved;
    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() {
      this.checked = ${checked};
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }`,
    });
}

// Select Option(s)
export async function selectOption(session, selector, values) {
    if (!Array.isArray(values)) values = [values];
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    const { object } = resolved;
    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() {
      Array.from(this.options).forEach(o => o.selected = ${JSON.stringify(values)}.includes(o.value));
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }`,
    });
}

// Click types
export async function triggerClick(session, selector, options = {}) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    const { object } = resolved;
    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() {
      this.click();
    }`
    });
}

// Press a key (e.g. Enter, Shift+A)
export async function pressKey(session, selector, key) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    const { object } = resolved;
    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() {
      const e = new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, bubbles: true });
      this.dispatchEvent(e);
    }`
    });
}

// Focus an element
export async function focus(session, selector) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    const { object } = resolved;
    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() { this.focus(); }`
    });
}

 
export async function dragDrop(session, sourceSelector, targetSelector) {
    const sourceId = await querySelector(session, sourceSelector);
    const targetId = await querySelector(session, targetSelector);

    const sourceResolved = await session.send('DOM.resolveNode', { nodeId: sourceId });
    const targetResolved = await session.send('DOM.resolveNode', { nodeId: targetId });

    if (!sourceResolved?.object || !targetResolved?.object) {
        throw new Error(`❌ Failed to resolve source or target for dragDrop: ${sourceSelector}, ${targetSelector}`);
    }

    const sourceObj = sourceResolved.object;
    const targetObj = targetResolved.object;

    await session.send('Runtime.callFunctionOn', {
        objectId: sourceObj.objectId,
        functionDeclaration: `function() {
            const event = new DragEvent('dragstart', { bubbles: true });
            this.dispatchEvent(event);
        }`
    });

    await session.send('Runtime.callFunctionOn', {
        objectId: targetObj.objectId,
        functionDeclaration: `function() {
            const event = new DragEvent('drop', { bubbles: true });
            this.dispatchEvent(event);
        }`
    });
}

// File Upload from memory buffer
export async function uploadFileBuffer(session, selector, filename, content) {
    const nodeId = await querySelector(session, selector);
    const resolved = await session.send('DOM.resolveNode', { nodeId });
    const { object } = resolved;
    await session.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: `function() {
      const file = new File([new Blob([${JSON.stringify(content)}])], '${filename}', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      this.files = dataTransfer.files;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }`
    });
}
