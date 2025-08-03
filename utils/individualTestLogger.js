/**
 * Individual Test Logger for Super Pancake Automation
 * Captures console logs per individual test case and screenshots on failure
 */

import { captureFailureScreenshot, getCurrentTestScreenshots, clearCurrentTestScreenshots } from '../core/screenshot.js';

class IndividualTestLogger {
    constructor() {
        this.testLogs = new Map();
        this.currentTestId = null;
        this.originalConsoleLog = console.log;
        this.isSetup = false;
    }

    setupLogger() {
        if (this.isSetup) return;
        
        const self = this;
        
        // Override console.log to capture individual test logs
        console.log = (...args) => {
            const logEntry = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' ');
            
            const timestampedLog = `[${new Date().toISOString()}] ${logEntry}`;
            
            // Add to current test's logs if we have a current test
            if (self.currentTestId && self.testLogs.has(self.currentTestId)) {
                self.testLogs.get(self.currentTestId).logs.push(timestampedLog);
            }
            
            // Still call original console.log
            self.originalConsoleLog.apply(console, args);
        };
        
        this.isSetup = true;
    }

    startTest(testName) {
        const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.currentTestId = testId;
        
        // Clear any previous screenshots from the screenshot module
        clearCurrentTestScreenshots();
        
        this.testLogs.set(testId, {
            testName,
            logs: [],
            startTime: new Date().toISOString(),
            screenshots: []
        });
        
        console.log(`🧪 Starting individual test: ${testName}`);
        return testId;
    }

    endTest(testId = null) {
        const id = testId || this.currentTestId;
        if (id && this.testLogs.has(id)) {
            const testData = this.testLogs.get(id);
            testData.endTime = new Date().toISOString();
            
            // Collect any screenshots captured during the test
            const capturedScreenshots = getCurrentTestScreenshots();
            if (capturedScreenshots.length > 0) {
                testData.screenshots.push(...capturedScreenshots);
                console.log(`📸 Added ${capturedScreenshots.length} screenshots to test data`);
            }
            
            console.log(`✅ Completed individual test: ${testData.testName}`);
        }
        this.currentTestId = null;
        return id;
    }

    addScreenshot(testId, screenshotPath) {
        if (testId && this.testLogs.has(testId)) {
            this.testLogs.get(testId).screenshots.push({
                path: screenshotPath,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Handle test failure with automatic screenshot capture
     * @param {string} testId - Test ID (optional, uses current if not provided)
     * @param {Error} error - The error that caused the test failure
     * @returns {Promise<string>} Test ID
     */
    async handleTestFailure(testId = null, error = null) {
        const id = testId || this.currentTestId;
        if (!id || !this.testLogs.has(id)) return id;

        const testData = this.testLogs.get(id);
        console.log(`❌ Test "${testData.testName}" failed - capturing failure screenshot...`);

        try {
            // Capture failure screenshot
            const screenshotPath = await captureFailureScreenshot(testData.testName);
            if (screenshotPath) {
                console.log(`📸 Failure screenshot captured: ${screenshotPath}`);
                // The screenshot is automatically added to currentTestScreenshots
                // and will be collected in endTest()
            }
        } catch (screenshotError) {
            console.warn('⚠️ Failed to capture failure screenshot:', screenshotError.message);
        }

        return id;
    }

    /**
     * Wrapper for test execution with automatic failure screenshot
     * @param {string} testName - Name of the test
     * @param {Function} testFn - Test function to execute
     * @returns {Promise} Test result
     */
    async executeTestWithFailureCapture(testName, testFn) {
        const testId = this.startTest(testName);
        
        try {
            const result = await testFn();
            this.endTest(testId);
            return result;
        } catch (error) {
            await this.handleTestFailure(testId, error);
            this.endTest(testId);
            throw error; // Re-throw to maintain test failure behavior
        }
    }

    getTestLogs(testId) {
        return this.testLogs.get(testId) || null;
    }

    getAllTestData() {
        return Array.from(this.testLogs.values());
    }

    getAllTestDataWithIds() {
        const result = [];
        for (const [id, data] of this.testLogs.entries()) {
            result.push({ id, ...data });
        }
        return result;
    }

    cleanup() {
        if (this.isSetup) {
            console.log = this.originalConsoleLog;
            this.isSetup = false;
        }
        this.testLogs.clear();
        this.currentTestId = null;
    }
}

// Export singleton instance
const individualTestLogger = new IndividualTestLogger();

export { individualTestLogger };

// Convenience functions
export function setupIndividualTestLogging() {
    individualTestLogger.setupLogger();
}

export function startIndividualTest(testName) {
    return individualTestLogger.startTest(testName);
}

export function endIndividualTest(testId = null) {
    return individualTestLogger.endTest(testId);
}

export function addTestScreenshot(testId, screenshotPath) {
    individualTestLogger.addScreenshot(testId, screenshotPath);
}

export function getIndividualTestData() {
    return individualTestLogger.getAllTestDataWithIds();
}

export function cleanupIndividualTestLogging() {
    individualTestLogger.cleanup();
}

/**
 * Handle test failure with automatic screenshot capture
 * @param {string} testId - Test ID (optional, uses current if not provided)
 * @param {Error} error - The error that caused the test failure
 * @returns {Promise<string>} Test ID
 */
export async function handleTestFailure(testId = null, error = null) {
    return await individualTestLogger.handleTestFailure(testId, error);
}

/**
 * Execute test with automatic failure screenshot capture
 * @param {string} testName - Name of the test
 * @param {Function} testFn - Test function to execute
 * @returns {Promise} Test result
 */
export async function executeTestWithFailureCapture(testName, testFn) {
    return await individualTestLogger.executeTestWithFailureCapture(testName, testFn);
}