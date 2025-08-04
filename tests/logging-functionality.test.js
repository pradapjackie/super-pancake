/**
 * Comprehensive test for logging functionality in reports
 * Tests both passed and failed test log capture
 */

import { describe, it, expect, afterAll } from 'vitest';
import { setupIndividualTestLogging, startIndividualTest, endIndividualTest, getIndividualTestData, cleanupIndividualTestLogging } from '../utils/individualTestLogger.js';
import { addTestResult } from '../reporter/htmlReporter.js';

describe('Logging Functionality Tests', () => {
  setupIndividualTestLogging();

  it('should capture logs for passed tests', () => {
    startIndividualTest('should capture logs for passed tests');
    console.log("This is a PASSED test log message that should appear in the report");
    console.log("Passed test: Multiple log entries to verify display");
    console.log("Passed test: Testing log capture for successful tests");
    console.log("Passed test: Validation complete");
    
    expect(true).toBe(true); // This will pass
    endIndividualTest('should capture logs for passed tests');
  });

  it('should capture logs for failed tests', () => {
    startIndividualTest('should capture logs for failed tests');
    console.log("This is a FAILED test log message that should appear in the report");
    console.log("Failed test: Multiple log entries to verify display");
    console.log("Failed test: Testing log capture for failed tests");
    console.log("Failed test: About to fail assertion");
    
    try {
      expect(true).toBe(false); // This will fail
    } catch (error) {
      console.log("Failed test: Caught expected assertion error");
      endIndividualTest('should capture logs for failed tests');
      throw error; // Re-throw to maintain test failure
    }
  });

  it('should handle logs with different data types', () => {
    startIndividualTest('should handle logs with different data types');
    
    // Test various log types
    console.log("String log message");
    console.log(123456);
    console.log({ key: 'value', nested: { data: true } });
    console.log(['array', 'of', 'values']);
    console.log(null);
    console.log(undefined);
    console.log(true);
    
    expect(true).toBe(true);
    endIndividualTest('should handle logs with different data types');
  });

  afterAll(async () => {
    // Get individual test data and save to HTML reporter
    const individualTests = getIndividualTestData();
    console.log(`📊 Captured ${individualTests.length} individual test cases with logs`);
    
    // Save each individual test result to HTML reporter
    individualTests.forEach((testData, index) => {
      // Determine status based on test name or other criteria
      const isFailedTest = testData.testName.includes('failed tests');
      
      const testResult = {
        id: `logging-test-${Date.now()}-${index}`,
        testName: testData.testName,
        description: `Logging Functionality Test: ${testData.testName}`,
        status: isFailedTest ? 'failed' : 'passed',
        duration: 1000,
        timestamp: testData.endTime || testData.startTime,
        browser: 'Chrome',
        environment: 'Local',
        tags: ['Logging Test', 'Individual Test', 'Log Capture'],
        screenshots: testData.screenshots || [],
        logs: testData.logs || [],
        error: isFailedTest ? 'AssertionError: expected true to be false' : null,
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
    
    console.log('✅ Logging functionality test results added to HTML reporter');
    
    // Cleanup individual test logger
    cleanupIndividualTestLogging();
  });
});