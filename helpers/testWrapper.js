import { addTestResult } from '../reporter/htmlReporter.js';
import { takeElementScreenshot } from '../core/dom.js';
import path from 'path';

/**
 * Wraps a test block to capture pass/fail status, errors, screenshots, and logs
 * @param {string} name - Name of the test
 * @param {Function} fn - Async test function
 * @param {Object} session - CDP session to use for screenshot
 * @param {string} testFilePath - Path to the test file
 */
export async function testWithReport(name, fn, session, testFilePath) {
    const file = testFilePath ? path.relative(process.cwd(), testFilePath) : 'unknown';
    const timestamp = new Date().toISOString();

    try {
        await fn();
        addTestResult({ file, name, status: 'pass', timestamp });
    } catch (error) {
        const fileName = `test-report/screenshots/${name.replace(/\s+/g, '_')}.png`;
        await takeElementScreenshot(session, 'body', fileName);
        addTestResult({
            file,
            name,
            status: 'fail',
            error: error.stack || error.message,
            screenshot: fileName,
            timestamp
        });
        throw error;
    }
}