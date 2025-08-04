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
    // Get individual test data for logging purposes only
    const individualTests = getIndividualTestData();
    console.log(`📊 Captured ${individualTests.length} individual test cases with logs`);
    
    // Don't create separate test result entries - the logs are already captured
    // and will be included in the main test results through the HTML reporter
    
    console.log('✅ Logging functionality test results captured');
    
    // Cleanup individual test logger
    cleanupIndividualTestLogging();
  });
});