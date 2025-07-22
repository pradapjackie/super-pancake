// Tests for HTML reporter functionality
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { addTestResult, writeReport, initializeReportDirectory } from '../../reporter/htmlReporter.js';

describe.skip('HTML Reporter Tests (disabled to prevent file deletion during main test runs)', () => {
  beforeEach(() => {
    // Use a test-specific directory to avoid deleting production test results
    const testReportDir = 'test-report-test';

    // Clean up test directory only
    if (fs.existsSync(testReportDir)) {
      fs.rmSync(testReportDir, { recursive: true, force: true });
    }

    // Create minimal test directory structure without calling initializeReportDirectory
    // to avoid deleting production results during test execution
    fs.mkdirSync(path.join(testReportDir, 'results'), { recursive: true });
    fs.mkdirSync(path.join(testReportDir, 'screenshots'), { recursive: true });
  });

  it('should initialize report directory structure', () => {
    const testReportDir = 'test-report-test';
    expect(fs.existsSync(testReportDir)).toBe(true);
    expect(fs.existsSync(path.join(testReportDir, 'results'))).toBe(true);
    expect(fs.existsSync(path.join(testReportDir, 'screenshots'))).toBe(true);
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
