import { addTestResult } from '../reporter/htmlReporter.js';
import { takeElementScreenshot } from '../core/dom.js';

/**
 * Wraps a test block to capture pass/fail status, errors, screenshots, and logs
 * @param {string} name - Name of the test
 * @param {Function} fn - Async test function
 * @param {Object} session - CDP session to use for screenshot
 */
export async function testWithReport(name, fn, session) {
    try {
        await fn();
        addTestResult({ name, status: 'pass' });
    } catch (error) {
        const fileName = `test-report/screenshots/${name.replace(/\s+/g, '_')}.png`;
        await takeElementScreenshot(session, 'body', fileName);
        addTestResult({
            name,
            status: 'fail',
            error: error.stack || error.message,
            screenshot: fileName
        });
        throw error;
    }
}