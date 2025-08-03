/**
 * Test script to verify logs display for FAILED tests
 */

import { describe, it, expect, afterAll } from 'vitest';
import { setupIndividualTestLogging, startIndividualTest, endIndividualTest, getIndividualTestData, cleanupIndividualTestLogging } from '../utils/individualTestLogger.js';
import { addTestResult } from '../reporter/htmlReporter.js';

describe('Failed Test with Logs', () => {
  setupIndividualTestLogging();

  it('should show console logs in report for failed test', () => {
    startIndividualTest('should show console logs in report for failed test');
    console.log("This is a FAILED test log message that should appear in the report");
    console.log("Failed test: Multiple log entries to verify display");
    console.log("Failed test: Testing log capture for failed tests");
    expect(true).toBe(false); // This will fail
    endIndividualTest('should show console logs in report for failed test');
  });

  afterAll(async () => {
    // Get individual test data and save to HTML reporter
    const individualTests = getIndividualTestData();
    console.log(`📊 Captured ${individualTests.length} individual test cases with logs`);
    
    // Save each individual test result to HTML reporter
    individualTests.forEach((testData, index) => {
      const testResult = {
        id: `failed-log-test-${Date.now()}-${index}`,
        testName: testData.testName,
        description: `Failed Test with Logs: ${testData.testName}`,
        status: 'failed', // Mark as failed
        duration: 1000,
        timestamp: testData.endTime || testData.startTime,
        browser: 'Chrome',
        environment: 'Local',
        tags: ['Failed Test with Logs', 'Individual Test'],
        screenshots: testData.screenshots || [],
        logs: testData.logs || [],
        error: 'AssertionError: expected true to be false',
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
});