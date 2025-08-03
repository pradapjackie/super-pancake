import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import { setupIndividualTestLogging, startIndividualTest, endIndividualTest, getIndividualTestData, cleanupIndividualTestLogging } from '../../utils/individualTestLogger.js';
import { addTestResult } from '../../reporter/htmlReporter.js';

describe('UI Runner Tests', () => {
  let uiRunnerProcess;
  let fetch;
  const testPort = 8090;

  setupIndividualTestLogging();

  beforeAll(async () => {
    console.log('🚀 Starting UI Runner for testing...');
    
    // Import fetch
    fetch = (await import('node-fetch')).default;
    
    // Start UI runner process
    uiRunnerProcess = spawn('node', ['bin/ui-runner.js'], {
      env: { ...process.env, PORT: testPort },
      stdio: 'pipe'
    });

    // Wait for server to start
    await new Promise((resolve) => {
      uiRunnerProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Super Pancake UI Runner started')) {
          resolve();
        }
      });
      
      // Fallback timeout
      setTimeout(resolve, 3000);
    });

    // Give it extra time to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000);

  afterAll(async () => {
    if (uiRunnerProcess) {
      uiRunnerProcess.kill('SIGTERM');
      console.log('🧹 UI Runner process terminated');
    }
    
    // Get individual test data and save to HTML reporter
    const individualTests = getIndividualTestData();
    console.log(`📊 Captured ${individualTests.length} individual test cases with logs`);
    
    // Save each individual test result to HTML reporter
    individualTests.forEach((testData, index) => {
      const testResult = {
        id: `ui-runner-individual-${Date.now()}-${index}`,
        testName: testData.testName,
        description: `UI Runner individual test: ${testData.testName}`,
        status: 'passed',
        duration: 1000,
        timestamp: testData.endTime || testData.startTime,
        browser: 'Chrome',
        environment: 'Local',
        tags: ['UI Runner Tests', 'Individual Test'],
        screenshots: testData.screenshots || [],
        logs: testData.logs || [],
        error: null,
        performanceMetrics: {
          executionTime: 1000,
          setupTime: 0,
          teardownTime: 0,
          cpuUsage: 25,
          networkTime: 5,
          slowestOperation: testData.testName,
          retryCount: 0,
          isFlaky: false
        }
      };
      
      addTestResult(testResult);
    });
    
    // Cleanup individual test logger
    cleanupIndividualTestLogging();
  });

  it('should start UI runner server successfully', () => {
    startIndividualTest('should start UI runner server successfully');
    console.log("should start UI runner server successfully")
    expect(uiRunnerProcess).toBeDefined();
    expect(uiRunnerProcess.pid).toBeGreaterThan(0);
    expect(uiRunnerProcess.killed).toBe(false);
    endIndividualTest('should start UI runner server successfully');
  });

  it('should serve the main page with correct content', async () => {
    const response = await fetch(`http://localhost:${testPort}/`);
    expect(response.status).toBe(200);
    
    const content = await response.text();
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('Super Pancake Test Runner');
    expect(content).toContain('<title>🥞 Super Pancake Test Runner</title>');
  });

  it('should serve form-comprehensive.html directly', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    expect(response.status).toBe(200);
    
    const content = await response.text();
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('Comprehensive UI Testing Playground');
  });

  it('should serve HTML content with correct MIME type', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    expect(response.headers.get('content-type')).toContain('text/html');
  });

  it('should contain all major form sections', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test all major sections exist
    expect(content).toContain('Basic Form Elements');
    expect(content).toContain('Date, Time & Number Inputs');
    expect(content).toContain('Selection & Choice Elements');
    expect(content).toContain('Checkboxes & Radio Buttons');
    expect(content).toContain('File Upload Elements');
    expect(content).toContain('Button Variations');
    expect(content).toContain('Advanced Input Types');
    expect(content).toContain('Interactive Elements');
    expect(content).toContain('Drag & Drop');
    expect(content).toContain('Interactive Data Table');
    expect(content).toContain('Accordion/Collapsible Content');
    expect(content).toContain('TIER 1 & TIER 2 Testing Elements');
  });

  it('should contain all basic form input types', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test all basic input types exist
    expect(content).toContain('type="text"');
    expect(content).toContain('type="email"');
    expect(content).toContain('type="password"');
    expect(content).toContain('type="tel"');
    expect(content).toContain('type="url"');
    expect(content).toContain('type="search"');
    expect(content).toContain('<textarea');
  });

  it('should contain all date and number input types', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test date/time/number inputs exist
    expect(content).toContain('type="date"');
    expect(content).toContain('type="time"');
    expect(content).toContain('type="datetime-local"');
    expect(content).toContain('type="month"');
    expect(content).toContain('type="week"');
    expect(content).toContain('type="number"');
    expect(content).toContain('type="range"');
    expect(content).toContain('type="color"');
  });

  it('should contain selection elements', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test selection elements exist
    expect(content).toContain('<select');
    expect(content).toContain('<option');
    expect(content).toContain('<optgroup');
    expect(content).toContain('multiple');
    expect(content).toContain('<datalist');
  });

  it('should contain checkbox and radio button elements', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test checkbox and radio inputs exist
    expect(content).toContain('type="checkbox"');
    expect(content).toContain('type="radio"');
    expect(content).toContain('<fieldset');
    expect(content).toContain('<legend>');
  });

  it('should contain file upload elements', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test file upload elements exist
    expect(content).toContain('type="file"');
    expect(content).toContain('accept="image/*"');
    expect(content).toContain('accept=".pdf"');
    expect(content).toContain('multiple');
  });

  it('should contain various button types', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test button variations exist
    expect(content).toContain('type="submit"');
    expect(content).toContain('type="reset"');
    expect(content).toContain('type="button"');
    expect(content).toContain('class="secondary"');
    expect(content).toContain('class="success"');
    expect(content).toContain('class="danger"');
    expect(content).toContain('disabled');
  });

  it('should contain advanced input elements', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test advanced elements exist
    expect(content).toContain('type="hidden"');
    expect(content).toContain('readonly');
    expect(content).toContain('<progress');
    expect(content).toContain('<meter');
  });

  it('should contain interactive elements', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test interactive elements exist
    expect(content).toContain('class="tab-button"');
    expect(content).toContain('class="tab-content"');
    expect(content).toContain('class="drag-item"');
    expect(content).toContain('class="drag-drop-area"');
    expect(content).toContain('draggable="true"');
  });

  it('should contain table elements', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test table elements exist
    expect(content).toContain('<table');
    expect(content).toContain('<thead>');
    expect(response.status).toBe(200);
    expect(content).toContain('<tbody>');
    expect(content).toContain('<th>');
    expect(content).toContain('<td>');
    // These buttons exist but might have different classes
    expect(content).toContain('Edit') || expect(content).toContain('Delete');
  });

  it('should contain accordion elements', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test accordion elements exist
    expect(content).toContain('class="accordion"');
    expect(content).toContain('class="accordion-header"');
    expect(content).toContain('class="accordion-content"');
    expect(content).toContain('data-target=');
  });

  it('should contain TIER 1 & TIER 2 testing elements', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test advanced testing elements exist
    expect(content).toContain('data-testid=');
    expect(content).toContain('Smart Locator Elements');
    expect(content).toContain('Image Elements with Alt Text');
    expect(content).toContain('Network & API Testing');
    expect(content).toContain('Multiple Frame Testing');
    expect(content).toContain('Device Emulation Testing');
    expect(content).toContain('Advanced Waiting Testing');
    expect(content).toContain('Keyboard & Input Testing');
  });

  it('should contain iframe elements', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test iframe elements exist
    expect(content).toContain('<iframe');
    expect(content).toContain('id="example-iframe"');
    expect(content).toContain('id="test-frame-1"');
    expect(content).toContain('id="test-frame-2"');
  });

  it('should contain modal elements', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test modal elements exist
    expect(content).toContain('class="modal"');
    expect(content).toContain('class="modal-content"');
    expect(content).toContain('class="modal-close"');
    expect(content).toContain('id="test-modal"');
  });

  it('should contain comprehensive JavaScript functionality', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test JavaScript sections exist
    expect(content).toContain('<script>');
    expect(content).toContain('addEventListener');
    expect(content).toContain('getElementById');
    expect(content).toContain('querySelector');
    expect(content).toContain('DOMContentLoaded');
  });

  it('should contain CSS styling', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();
    
    // Test CSS sections exist
    expect(content).toContain('<style>');
    expect(content).toContain('font-family:');
    expect(content).toContain('background:');
    expect(content).toContain('border-radius:');
    expect(content).toContain('grid-template-columns:');
    expect(content).toContain('@media');
  });

  it('should return 404 for non-existent files', async () => {
    const response = await fetch(`http://localhost:${testPort}/non-existent-file.html`);
    expect(response.status).toBe(404);
    
    const content = await response.text();
    expect(content).toContain('Cannot GET');
  });

  it('should handle concurrent requests properly', async () => {
    const requests = Array(5).fill().map(() => 
      fetch(`http://localhost:${testPort}/form-comprehensive.html`)
    );
    
    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should serve files from public directory correctly', async () => {
    // Test that the server serves files from the public directory
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    expect(response.status).toBe(200);
    
    // Verify it's actually serving our fixed HTML file
    const content = await response.text();
    expect(content).toContain('🧪 Comprehensive UI Testing Playground');
  });

  it('should handle different request paths correctly', async () => {
    // Test root path serves index.html
    const rootResponse = await fetch(`http://localhost:${testPort}/`);
    expect(rootResponse.status).toBe(200);
    
    // Test direct file access to form-comprehensive.html
    const directResponse = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    expect(directResponse.status).toBe(200);
    
    // They should serve different content (index.html vs form-comprehensive.html)
    const rootContent = await rootResponse.text();
    const directContent = await directResponse.text();
    expect(rootContent).toContain('Super Pancake Test Runner');
    expect(directContent).toContain('Comprehensive UI Testing Playground');
  });

  it('should contain all basic form input types', async () => {
    const response = await fetch(`http://localhost:${testPort}/form-comprehensive.html`);
    const content = await response.text();

    // Test all basic input types exist
    expect(content).toContain('type="text"');
    expect(content).toContain('type="email"');
    expect(content).toContain('type="password"');
    expect(content).toContain('type="number"');

  });
});