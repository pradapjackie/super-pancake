/**
 * Automatic Screenshot Capture on Test Failure
 * Provides wrapper functions to automatically capture screenshots when tests fail
 */

import { takeScreenshot } from '../core/screenshot.js';
import { getSession } from '../core/session-context.js';
import fs from 'fs';
import path from 'path';

// Global storage for screenshot paths
let currentTestScreenshots = [];
let screenshotDirectory = 'test-report/screenshots';

/**
 * Initialize screenshot directory
 */
export function initializeScreenshotDirectory() {
    try {
        if (!fs.existsSync(screenshotDirectory)) {
            fs.mkdirSync(screenshotDirectory, { recursive: true });
            console.log(`📁 Screenshot directory created: ${screenshotDirectory}`);
        }
    } catch (error) {
        console.warn('⚠️ Failed to create screenshot directory:', error.message);
    }
}

/**
 * Generate unique screenshot filename
 * @param {string} testName - Name of the test
 * @param {string} type - Type of screenshot (failure, success, etc.)
 * @returns {string} Screenshot filename
 */
function generateScreenshotFilename(testName, type = 'failure') {
    const sanitizedTestName = testName
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 50); // Limit length
    
    const timestamp = Date.now();
    return `${sanitizedTestName}_${type}_${timestamp}.png`;
}

/**
 * Capture screenshot and save to file
 * @param {string} testName - Name of the test
 * @param {string} type - Type of screenshot
 * @returns {Promise<string|null>} Screenshot file path or null if failed
 */
export async function captureFailureScreenshot(testName, type = 'failure') {
    try {
        const session = getSession();
        if (!session) {
            console.warn('⚠️ No session available for screenshot capture');
            return null;
        }

        // Ensure screenshot directory exists
        initializeScreenshotDirectory();

        // Generate filename and full path
        const filename = generateScreenshotFilename(testName, type);
        const fullPath = path.join(screenshotDirectory, filename);

        // Capture screenshot using Chrome DevTools Protocol
        const { data } = await session.send('Page.captureScreenshot', {
            format: 'png',
            fromSurface: true,
            captureBeyondViewport: true
        });

        // Save screenshot to file
        const buffer = Buffer.from(data, 'base64');
        fs.writeFileSync(fullPath, buffer);

        console.log(`📸 Failure screenshot captured: ${fullPath}`);
        
        // Store for later retrieval
        currentTestScreenshots.push({
            path: fullPath,
            url: fullPath,
            filename: filename,
            type: type,
            timestamp: new Date().toISOString()
        });

        return fullPath;

    } catch (error) {
        console.warn('⚠️ Failed to capture failure screenshot:', error.message);
        return null;
    }
}

/**
 * Get all screenshots captured for current test
 * @returns {Array} Array of screenshot objects
 */
export function getCurrentTestScreenshots() {
    return [...currentTestScreenshots];
}

/**
 * Clear screenshots for new test
 */
export function clearCurrentTestScreenshots() {
    currentTestScreenshots = [];
}

/**
 * Wrapper function that executes a test function and captures screenshot on failure
 * @param {Function} testFn - Test function to execute
 * @param {string} testName - Name of the test (for screenshot naming)
 * @returns {Promise} Test result or throws with screenshot captured
 */
export async function withFailureScreenshot(testFn, testName) {
    clearCurrentTestScreenshots(); // Clear any previous screenshots
    
    try {
        const result = await testFn();
        console.log(`✅ Test "${testName}" passed - no screenshot needed`);
        return result;
    } catch (error) {
        console.log(`❌ Test "${testName}" failed - capturing screenshot...`);
        
        // Capture screenshot on failure
        const screenshotPath = await captureFailureScreenshot(testName, 'failure');
        
        if (screenshotPath) {
            // Add screenshot info to error for better reporting
            error.screenshotPath = screenshotPath;
            error.hasScreenshot = true;
        }
        
        // Re-throw the error to maintain test failure behavior
        throw error;
    }
}

/**
 * Wrapper for async test functions with automatic screenshot on failure
 * @param {string} testName - Name of the test
 * @param {Function} testFn - Async test function
 * @returns {Function} Wrapped test function
 */
export function withAutoScreenshot(testName, testFn) {
    return async (...args) => {
        return await withFailureScreenshot(() => testFn(...args), testName);
    };
}

/**
 * Enhanced expect wrapper that captures screenshot on assertion failure
 * @param {*} actual - Actual value
 * @param {string} testName - Test name for screenshot
 * @returns {Object} Enhanced expect object
 */
export function expectWithScreenshot(actual, testName) {
    const originalExpect = (await import('vitest')).expect;
    const expectObj = originalExpect(actual);
    
    // Wrap common assertion methods
    const wrapMethod = (methodName) => {
        const originalMethod = expectObj[methodName];
        if (typeof originalMethod === 'function') {
            expectObj[methodName] = async (...args) => {
                try {
                    return await originalMethod.apply(expectObj, args);
                } catch (error) {
                    // Capture screenshot on assertion failure
                    console.log(`❌ Assertion failed in "${testName}" - capturing screenshot...`);
                    await captureFailureScreenshot(testName, 'assertion_failure');
                    throw error;
                }
            };
        }
    };

    // Wrap key assertion methods
    ['toBe', 'toEqual', 'toBeTruthy', 'toBeFalsy', 'toContain', 'toHaveLength', 
     'toBeGreaterThan', 'toBeLessThan', 'toMatch', 'toThrow'].forEach(wrapMethod);

    return expectObj;
}

/**
 * Set custom screenshot directory
 * @param {string} directory - Custom directory path
 */
export function setScreenshotDirectory(directory) {
    screenshotDirectory = directory;
    initializeScreenshotDirectory();
}

/**
 * Get current screenshot directory
 * @returns {string} Current screenshot directory
 */
export function getScreenshotDirectory() {
    return screenshotDirectory;
}