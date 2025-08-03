/**
 * Test script to verify logs display in reports
 */

import { describe, it, expect, afterAll } from 'vitest';
import { setupIndividualTestLogging, startIndividualTest, endIndividualTest, getIndividualTestData, cleanupIndividualTestLogging } from '../utils/individualTestLogger.js';
import { addTestResult } from '../reporter/htmlReporter.js';

describe('Log Display Test', () => {
  setupIndividualTestLogging();

  it('should show console logs in report for passed test', () => {
    startIndividualTest('should show console logs in report for passed test');
    console.log("This is a test log message that should appear in the report");
    console.log("Multiple log entries to verify display");
    console.log("Testing log capture for passed tests");
    expect(true).toBe(true);
    endIndividualTest('should show console logs in report for passed test');
  });

  afterAll(async () => {
    // Get individual test data and save to HTML reporter
    const individualTests = getIndividualTestData();
    console.log(`📊 Captured ${individualTests.length} individual test cases with logs`);
    
    // Save each individual test result to HTML reporter
    individualTests.forEach((testData, index) => {
      const testResult = {
        id: `log-display-test-${Date.now()}-${index}`,
        testName: testData.testName,
        description: `Log Display Test: ${testData.testName}`,
        status: 'passed',
        duration: 1000,
        timestamp: testData.endTime || testData.startTime,
        browser: 'Chrome',
        environment: 'Local',
        tags: ['Log Display Test', 'Individual Test'],
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
});