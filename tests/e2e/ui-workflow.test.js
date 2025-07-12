// End-to-end tests for the complete UI workflow
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchChrome } from '../../utils/launcher.js';
import { connectToChrome } from '../../core/browser.js';
import { createSession } from '../../core/session.js';
import {
  enableDOM,
  navigateTo,
  click,
  waitForSelector,
  getText,
  querySelector,
  fillInput,
  selectOption,
  check,
  getTableData,
  getTableRow,
  getTableCell,
  isVisible,
  isEnabled,
  waitForCondition
} from '../../core/dom.js';
const TEST_APP_URL = process.env.TEST_APP_URL || 'http://localhost:8080';
const UI_SERVER_URL = process.env.UI_SERVER_URL || 'http://localhost:3003';

let chrome, ws, session;

describe.skip('End-to-End UI Workflow Tests', () => {
  beforeAll(async () => {
    // Servers are started by test-with-server.js
    // Launch browser for testing
    chrome = await launchChrome({ headed: false });
    ws = await connectToChrome();
    session = createSession(ws);
    await enableDOM(session);
  });

  afterAll(async () => {
    if (ws) ws.close();
    if (chrome) await chrome.kill();
  });

  it('should load the test application', async () => {
    await navigateTo(session, TEST_APP_URL);
    
    // Wait for the page to load
    await waitForSelector(session, 'h1', 10000);
    
    // Check page title
    const h1NodeId = await querySelector(session, 'h1');
    const title = await getText(session, h1NodeId);
    expect(title).toContain('Super Pancake Test Application');
    
    // Check form exists
    const form = await querySelector(session, '#testForm');
    expect(form).toBeDefined();
  });

  it('should interact with form elements', async () => {
    await navigateTo(session, TEST_APP_URL);
    await waitForSelector(session, '#testForm', 10000);
    
    // Fill form fields
    await fillInput(session, '#name', 'John Doe');
    await fillInput(session, '#email', 'john@example.com');
    
    // Select from dropdown
    await selectOption(session, '#country', 'us');
    
    // Check checkbox
    await check(session, '#newsletter', true);
    
    // Submit form
    await click(session, '#submitBtn');
    
    // Wait for success message
    await waitForSelector(session, '#successMessage', 5000);
    const successMsgNodeId = await querySelector(session, '#successMessage');
    const successMsg = await getText(session, successMsgNodeId);
    expect(successMsg).toContain('successfully');
  });

  it('should load the UI server and display test files', async () => {
    await navigateTo(session, UI_SERVER_URL);
    
    // Wait for the page to load  
    await waitForSelector(session, 'body', 10000);
    
    // Check if this is the test runner page
    const bodyNodeId = await querySelector(session, 'body');
    const bodyText = await getText(session, bodyNodeId);
    expect(bodyText).toContain('Test Runner');
  });

  it('should interact with test data table', async () => {
    await navigateTo(session, TEST_APP_URL);
    await waitForSelector(session, '#dataTable', 10000);
    
    // Check table data
    const tableData = await getTableData(session, '#dataTable');
    expect(tableData.length).toBeGreaterThan(0);
    
    // Check specific table content
    const firstRowData = await getTableRow(session, '#dataTable', 1); // Skip header
    expect(firstRowData).toContain('Alice Johnson');
    
    // Check table cell
    const emailCell = await getTableCell(session, '#dataTable', 1, 2);
    expect(emailCell).toBe('alice@example.com');
  });

  it('should handle dynamic content updates', async () => {
    await navigateTo(session, TEST_APP_URL);
    await waitForSelector(session, '#dynamicContent', 10000);
    
    // Click update button
    await click(session, '#dynamicContent button');
    
    // Wait for content to update
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if content was updated
    const dynamicContentNodeId = await querySelector(session, '#dynamicContent');
    const updatedContent = await getText(session, dynamicContentNodeId);
    expect(updatedContent).toContain('Content updated at:');
  });

  it('should test visibility and state changes', async () => {
    await navigateTo(session, TEST_APP_URL);
    
    // Initially hidden button should become visible
    await waitForSelector(session, '#hiddenButton', 5000);
    const hiddenBtn = await isVisible(session, '#hiddenButton');
    expect(hiddenBtn).toBe(true);
    
    // Initially disabled button should become enabled
    await waitForCondition(session, 
      () => isEnabled(session, '#disabledButton'), 
      5000
    );
    const enabledBtn = await isEnabled(session, '#disabledButton');
    expect(enabledBtn).toBe(true);
  });
});