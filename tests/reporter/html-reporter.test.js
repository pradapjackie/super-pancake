import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  initializeReportDirectory,
  addTestResult,
  writeReport,
  clearPreviousResults
} from '../../reporter/htmlReporter.js';
import fs from 'fs';
import path from 'path';

describe('HTML Reporter Tests', () => {
  let testOutputDir;

  beforeEach(() => {
    testOutputDir = path.join(process.cwd(), 'test-report');
    // Initialize report directory
    initializeReportDirectory();
  });

  afterEach(() => {
    // Clean up test files
    clearPreviousResults();
    if (fs.existsSync(testOutputDir)) {
      try {
        fs.rmSync(testOutputDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  it('should initialize report directory', () => {
    initializeReportDirectory();
    expect(fs.existsSync(testOutputDir)).toBe(true);
  });

  it('should add test results', () => {
    const testResult = {
      name: 'Sample Test',
      status: 'passed',
      duration: 1500,
      file: 'test.js'
    };

    // This should not throw
    expect(() => {
      addTestResult(testResult);
    }).not.toThrow();
  });

  it('should write report without errors', () => {
    // Add a test result
    addTestResult({
      name: 'Test Report Generation',
      status: 'passed',
      duration: 1000,
      file: 'reporter-test.js'
    });

    // This should not throw
    expect(() => {
      writeReport();
    }).not.toThrow();
    
    // Check if report file exists (it's saved as automationTestReport.html)
    const reportPath = path.join(process.cwd(), 'automationTestReport.html');
    expect(fs.existsSync(reportPath)).toBe(true);
  });

  it('should handle multiple test results', () => {
    const testResults = [
      { name: 'Test 1', status: 'passed', duration: 1000, file: 'test1.js' },
      { name: 'Test 2', status: 'failed', duration: 800, file: 'test2.js' },
      { name: 'Test 3', status: 'passed', duration: 1200, file: 'test3.js' }
    ];

    testResults.forEach(result => {
      expect(() => {
        addTestResult(result);
      }).not.toThrow();
    });

    expect(() => {
      writeReport();
    }).not.toThrow();
  });

  it('should clear previous results', () => {
    // Add some results first
    addTestResult({ name: 'Test', status: 'passed', duration: 1000, file: 'test.js' });
    
    // Clear should not throw
    expect(() => {
      clearPreviousResults();
    }).not.toThrow();
  });

  it('should handle empty results gracefully', () => {
    // Write report with no results
    expect(() => {
      writeReport();
    }).not.toThrow();
    
    const reportPath = path.join(process.cwd(), 'automationTestReport.html');
    expect(fs.existsSync(reportPath)).toBe(true);
  });

  it('should validate reporter functions are available', () => {
    expect(initializeReportDirectory).toBeDefined();
    expect(typeof initializeReportDirectory).toBe('function');
    
    expect(addTestResult).toBeDefined();
    expect(typeof addTestResult).toBe('function');
    
    expect(writeReport).toBeDefined();
    expect(typeof writeReport).toBe('function');
    
    expect(clearPreviousResults).toBeDefined();
    expect(typeof clearPreviousResults).toBe('function');
  });

  it('should generate report with actual content', () => {
    // Add test results
    addTestResult({
      name: 'Content Test',
      status: 'passed',
      duration: 1500,
      file: 'content-test.js'
    });

    writeReport();
    
    const reportPath = path.join(process.cwd(), 'automationTestReport.html');
    const reportContent = fs.readFileSync(reportPath, 'utf8');
    
    expect(reportContent).toContain('<!DOCTYPE html>');
    expect(reportContent.length).toBeGreaterThan(100); // Should have substantial content
  });
});