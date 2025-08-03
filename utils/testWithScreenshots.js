/**
 * Test Wrapper with Automatic Screenshot Capture on Failure
 * Enhanced test execution utilities for Super Pancake Automation Framework
 */

import { expect } from 'vitest';
import { captureFailureScreenshot } from '../core/screenshot.js';
import { getSession } from '../core/session-context.js';
import { 
    setupIndividualTestLogging, 
    startIndividualTest, 
    endIndividualTest, 
    handleTestFailure,
    executeTestWithFailureCapture 
} from './individualTestLogger.js';

/**
 * Enhanced expect that automatically captures screenshots on assertion failures
 * @param {*} actual - The actual value to test
 * @param {string} testName - Name of the test for screenshot naming
 * @returns {Object} Enhanced expect object with screenshot capture
 */
export function expectWithScreenshot(actual, testName = 'assertion') {
    const originalExpectObject = expect(actual);
    
    // List of assertion methods to wrap
    const assertionMethods = [
        'toBe', 'toEqual', 'toBeTruthy', 'toBeFalsy', 'toBeNull', 'toBeUndefined',
        'toBeGreaterThan', 'toBeLessThan', 'toBeGreaterThanOrEqual', 'toBeLessThanOrEqual',
        'toContain', 'toMatch', 'toHaveLength', 'toThrow', 'toHaveProperty',
        'toBeInstanceOf', 'toBeCloseTo', 'toMatchObject', 'toContainEqual',
        'toBeInTheDocument', 'toBeVisible', 'toHaveAttribute', 'toHaveClass'
    ];

    // Wrap each assertion method
    assertionMethods.forEach(methodName => {
        if (typeof originalExpectObject[methodName] === 'function') {
            const originalMethod = originalExpectObject[methodName].bind(originalExpectObject);
            
            originalExpectObject[methodName] = async (...args) => {
                try {
                    const result = await originalMethod(...args);
                    return result;
                } catch (assertionError) {
                    // Capture screenshot on assertion failure
                    console.log(`❌ Assertion "${methodName}" failed in test "${testName}"`);
                    
                    try {
                        const session = getSession();
                        if (session) {
                            const screenshotPath = await captureFailureScreenshot(testName);
                            if (screenshotPath) {
                                console.log(`📸 Assertion failure screenshot captured: ${screenshotPath}`);
                                // Add screenshot info to the error for better debugging
                                assertionError.screenshotPath = screenshotPath;
                            }
                        }
                    } catch (screenshotError) {
                        console.warn('⚠️ Failed to capture assertion failure screenshot:', screenshotError.message);
                    }
                    
                    // Re-throw the original assertion error
                    throw assertionError;
                }
            };
        }
    });

    return originalExpectObject;
}

/**
 * Wrapper for test functions that automatically captures screenshots on failure
 * @param {string} testName - Name of the test
 * @param {Function} testFn - Test function to execute
 * @param {Object} options - Additional options
 * @returns {Function} Wrapped test function
 */
export function testWithAutoScreenshot(testName, testFn, options = {}) {
    const { 
        captureOnSuccess = false,
        customScreenshotName = null 
    } = options;

    return async (...args) => {
        console.log(`🧪 Starting test with auto-screenshot: ${testName}`);
        
        try {
            // Execute the test function
            const result = await testFn(...args);
            
            // Optionally capture success screenshot
            if (captureOnSuccess) {
                try {
                    const session = getSession();
                    if (session) {
                        const screenshotName = customScreenshotName || `${testName}_success`;
                        await captureFailureScreenshot(screenshotName); // Using same function but for success
                        console.log(`📸 Success screenshot captured for: ${testName}`);
                    }
                } catch (screenshotError) {
                    console.warn('⚠️ Failed to capture success screenshot:', screenshotError.message);
                }
            }
            
            console.log(`✅ Test completed successfully: ${testName}`);
            return result;
            
        } catch (error) {
            console.log(`❌ Test failed: ${testName}`);
            
            // Capture failure screenshot
            try {
                const session = getSession();
                if (session) {
                    const screenshotPath = await captureFailureScreenshot(testName);
                    if (screenshotPath) {
                        console.log(`📸 Test failure screenshot captured: ${screenshotPath}`);
                        // Add screenshot info to the error
                        error.screenshotPath = screenshotPath;
                        error.hasAutoScreenshot = true;
                    }
                }
            } catch (screenshotError) {
                console.warn('⚠️ Failed to capture test failure screenshot:', screenshotError.message);
            }
            
            // Re-throw the error to maintain test failure behavior
            throw error;
        }
    };
}

/**
 * Enhanced it() function with automatic screenshot capture
 * @param {string} testDescription - Test description
 * @param {Function} testFn - Test function
 * @param {Object} options - Test options
 * @returns {Function} Enhanced test function
 */
export function itWithScreenshots(testDescription, testFn, options = {}) {
    return testWithAutoScreenshot(testDescription, testFn, options);
}

/**
 * Execute a block of code with automatic screenshot capture on any failure
 * @param {string} blockName - Name of the code block
 * @param {Function} blockFn - Function to execute
 * @returns {Promise} Block execution result
 */
export async function executeWithScreenshot(blockName, blockFn) {
    try {
        return await blockFn();
    } catch (error) {
        console.log(`❌ Block "${blockName}" failed - capturing screenshot...`);
        
        try {
            const session = getSession();
            if (session) {
                const screenshotPath = await captureFailureScreenshot(blockName);
                if (screenshotPath) {
                    console.log(`📸 Block failure screenshot captured: ${screenshotPath}`);
                    error.screenshotPath = screenshotPath;
                }
            }
        } catch (screenshotError) {
            console.warn('⚠️ Failed to capture block failure screenshot:', screenshotError.message);
        }
        
        throw error;
    }
}

/**
 * Vitest test hook that sets up automatic screenshot capture for all tests in a describe block
 * @param {Object} options - Configuration options
 */
export function setupAutomaticScreenshots(options = {}) {
    const { 
        enableIndividualTestLogging = true,
        screenshotDirectory = 'test-report/screenshots'
    } = options;

    if (enableIndividualTestLogging) {
        setupIndividualTestLogging();
        console.log('✅ Individual test logging with screenshots enabled');
    }

    console.log(`✅ Automatic screenshot capture enabled (directory: ${screenshotDirectory})`);
}

/**
 * Execute individual test with comprehensive failure capture
 * @param {string} testName - Name of the test
 * @param {Function} testFn - Test function to execute
 * @returns {Promise} Test execution result
 */
export async function runTestWithFailureCapture(testName, testFn) {
    return await executeTestWithFailureCapture(testName, testFn);
}

// Export enhanced expect for easy use
export { expectWithScreenshot as expect };

// Re-export screenshot functions for convenience
export { 
    captureFailureScreenshot,
    captureScreenshot,
    getCurrentTestScreenshots,
    clearCurrentTestScreenshots,
    setScreenshotDirectory,
    getScreenshotDirectory 
} from '../core/screenshot.js';