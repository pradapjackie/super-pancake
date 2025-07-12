// Unit tests for core DOM methods
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchChrome } from '../../utils/launcher.js';
import { connectToChrome } from '../../core/browser.js';
import { createSession } from '../../core/session.js';
import {
  enableDOM,
  navigateTo,
  querySelector,
  click,
  fillInput,
  getText,
  getAttribute,
  waitForSelector,
  isVisible,
  isEnabled
} from '../../core/dom.js';

let chrome, ws, session;

describe.skip('Core DOM Methods Unit Tests', () => {
  beforeAll(async () => {
    try {
      chrome = await launchChrome({ headed: false });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Extra wait
      ws = await connectToChrome();
      session = createSession(ws);
      await enableDOM(session);
      await navigateTo(session, 'data:text/html,<html><body><div id="test">Hello</div><input id="input" value="test"/></body></html>');
    } catch (error) {
      console.error('Failed to setup test environment:', error);
      // Try cleanup on failure
      if (ws) ws.close();
      if (chrome) await chrome.kill();
      throw error;
    }
  }, 45000); // 45 second timeout

  afterAll(async () => {
    try {
      if (ws) {
        ws.close();
      }
      if (chrome) {
        await chrome.kill();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  it('should find elements with querySelector', async () => {
    const nodeId = await querySelector(session, '#test');
    expect(nodeId).toBeDefined();
    expect(typeof nodeId).toBe('number');
  });

  it('should get text content', async () => {
    const nodeId = await querySelector(session, '#test');
    const text = await getText(session, nodeId);
    expect(text).toBe('Hello');
  });

  it('should get attributes', async () => {
    const value = await getAttribute(session, '#input', 'value');
    expect(value).toBe('test');
  });

  it('should check visibility', async () => {
    const visible = await isVisible(session, '#test');
    expect(visible).toBe(true);
  });

  it('should check enabled state', async () => {
    const enabled = await isEnabled(session, '#input');
    expect(enabled).toBe(true);
  });

  it('should wait for selectors', async () => {
    const element = await waitForSelector(session, '#test', 1000);
    expect(element).toBeDefined();
  });
});