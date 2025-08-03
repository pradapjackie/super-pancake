/**
 * Test Logger Utility
 * Captures console logs per individual test case for reporting
 */

class TestLogger {
    constructor() {
        this.testLogs = new Map();
        this.currentTestId = null;
        this.originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };
        this.setupConsoleInterceptor();
    }

    /**
     * Start logging for a specific test
     */
    startTest(testId, testName) {
        this.currentTestId = testId;
        this.testLogs.set(testId, {
            testName,
            logs: [],
            startTime: new Date().toISOString()
        });
        this.log(`🧪 Starting test: ${testName}`);
    }

    /**
     * End logging for current test
     */
    endTest() {
        if (this.currentTestId) {
            this.log(`✅ Test completed: ${this.testLogs.get(this.currentTestId)?.testName}`);
            this.currentTestId = null;
        }
    }

    /**
     * Add a log entry for current test
     */
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        
        // Store in current test logs
        if (this.currentTestId && this.testLogs.has(this.currentTestId)) {
            this.testLogs.get(this.currentTestId).logs.push(logEntry);
        }
        
        // Still output to original console
        this.originalConsole[level](logEntry);
    }

    /**
     * Setup console interceptor to capture all console calls
     */
    setupConsoleInterceptor() {
        const self = this;
        
        console.log = function(...args) {
            const message = args.join(' ');
            self.log(message, 'log');
        };
        
        console.error = function(...args) {
            const message = args.join(' ');
            self.log(`❌ ${message}`, 'error');
        };
        
        console.warn = function(...args) {
            const message = args.join(' ');
            self.log(`⚠️ ${message}`, 'warn');
        };
        
        console.info = function(...args) {
            const message = args.join(' ');
            self.log(`ℹ️ ${message}`, 'info');
        };
    }

    /**
     * Get logs for a specific test
     */
    getTestLogs(testId) {
        return this.testLogs.get(testId)?.logs || [];
    }

    /**
     * Get all test logs
     */
    getAllTestLogs() {
        const result = {};
        for (const [testId, data] of this.testLogs) {
            result[testId] = {
                testName: data.testName,
                logs: data.logs,
                startTime: data.startTime
            };
        }
        return result;
    }

    /**
     * Clear all logs
     */
    clearLogs() {
        this.testLogs.clear();
        this.currentTestId = null;
    }

    /**
     * Restore original console functions
     */
    restore() {
        console.log = this.originalConsole.log;
        console.error = this.originalConsole.error;
        console.warn = this.originalConsole.warn;
        console.info = this.originalConsole.info;
    }
}

// Create global test logger instance
const testLogger = new TestLogger();

export default testLogger;

/**
 * Test wrapper that automatically captures logs per test
 */
export function withTestLogging(testFn, testName) {
    return async () => {
        const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            testLogger.startTest(testId, testName);
            await testFn(testLogger);
            testLogger.endTest();
            
            return {
                testId,
                logs: testLogger.getTestLogs(testId)
            };
        } catch (error) {
            testLogger.log(`Test failed: ${error.message}`, 'error');
            testLogger.endTest();
            throw error;
        }
    };
}

/**
 * Screenshot utility for tests
 */
export class TestScreenshots {
    constructor() {
        this.screenshots = new Map();
    }

    /**
     * Add screenshot for current test
     */
    addScreenshot(testId, screenshotPath, description = '') {
        if (!this.screenshots.has(testId)) {
            this.screenshots.set(testId, []);
        }
        
        this.screenshots.get(testId).push({
            path: screenshotPath,
            description,
            timestamp: new Date().toISOString()
        });
        
        testLogger.log(`📸 Screenshot captured: ${description || screenshotPath}`);
    }

    /**
     * Get screenshots for test
     */
    getTestScreenshots(testId) {
        return this.screenshots.get(testId) || [];
    }

    /**
     * Clear all screenshots
     */
    clear() {
        this.screenshots.clear();
    }
}

export const testScreenshots = new TestScreenshots();