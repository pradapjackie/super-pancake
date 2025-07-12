// Tests for HTML reporter functionality
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { addTestResult, writeReport, initializeReportDirectory } from '../../reporter/htmlReporter.js';

describe('HTML Reporter Tests', () => {
  beforeEach(() => {
    // Clean up before each test
    if (fs.existsSync('test-report')) {
      fs.rmSync('test-report', { recursive: true, force: true });
    }
    initializeReportDirectory();
  });

  it('should initialize report directory structure', () => {
    expect(fs.existsSync('test-report')).toBe(true);
    expect(fs.existsSync('test-report/results')).toBe(true);
    expect(fs.existsSync('test-report/screenshots')).toBe(true);
  });

  it('should add test results', () => {
    const testResult = {
      name: 'Sample Test',
      status: 'pass',
      duration: '100ms',
      timestamp: new Date().toISOString(),
      file: 'sample.test.js'
    };

    addTestResult(testResult);

    const resultFiles = fs.readdirSync('test-report/results')
      .filter(f => f.endsWith('.json'));
    expect(resultFiles.length).toBe(1);

    const savedResult = JSON.parse(fs.readFileSync(
      path.join('test-report/results', resultFiles[0]), 'utf-8'
    ));
    expect(savedResult.name).toBe('Sample Test');
    expect(savedResult.status).toBe('pass');
  });

  it('should generate HTML report', () => {
    // Add some test results
    const results = [
      {
        name: 'Passing Test',
        status: 'pass',
        duration: '50ms',
        timestamp: new Date().toISOString(),
        file: 'test1.js'
      },
      {
        name: 'Failing Test',
        status: 'fail',
        duration: '75ms',
        timestamp: new Date().toISOString(),
        file: 'test2.js',
        error: 'Expected true but got false'
      }
    ];

    results.forEach(result => addTestResult(result));

    writeReport();

    expect(fs.existsSync('automationTestReport.html')).toBe(true);
    
    const htmlContent = fs.readFileSync('automationTestReport.html', 'utf-8');
    expect(htmlContent).toContain('Super Pancake Test Report');
    expect(htmlContent).toContain('DOCTYPE html');
    expect(htmlContent.length).toBeGreaterThan(1000);
  });

  it('should handle malformed test results gracefully', () => {
    const malformedResult = {
      name: 'Test with invalid timestamp',
      status: 'pass',
      timestamp: 'invalid-date',
      duration: null
    };

    expect(() => addTestResult(malformedResult)).not.toThrow();
    expect(() => writeReport()).not.toThrow();
  });
});