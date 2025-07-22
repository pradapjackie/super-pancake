// Integration tests for UI server and test execution
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

let serverProcess;
let serverPort;
let baseUrl;

describe('UI Server Integration Tests', () => {
  beforeAll(async () => {
    // Import port finder utilities
    const { ensurePortAvailable } = await import('../../utils/port-finder.js');

    // Find available port for testing
    serverPort = await ensurePortAvailable(3003, true);
    baseUrl = `http://localhost:${serverPort}`;

    // Start the UI server for testing
    serverProcess = spawn('node', ['scripts/test-ui.js'], {
      env: { ...process.env, PORT: serverPort, NODE_ENV: 'test' },
      stdio: 'pipe'
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  it('should serve the main UI page', async () => {
    const response = await axios.get(baseUrl);
    expect(response.status).toBe(200);
    expect(response.data).toContain('Test Runner');
  });

  it('should return test files via API', async () => {
    const response = await axios.get(`${baseUrl}/api/test-files`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  it('should return test cases for a file', async () => {
    const response = await axios.post(`${baseUrl}/api/test-cases`, {
      filePath: 'tests/samples.test.js'
    });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  it('should handle test execution via API', async () => {
    const response = await axios.post(`${baseUrl}/run`, {
      tests: ['tests/samples.test.js::should navigate to form page']
    });
    expect(response.status).toBe(200);
  });
});
