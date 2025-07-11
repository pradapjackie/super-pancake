// helpers/testWrapper.js
import { addTestResult, clearPreviousResults } from '../reporter/htmlReporter.js';
import { takeElementScreenshot } from '../core/dom.js';

let firstTestRun = true;

export async function testWithReport(name, fn, session, testFilePath) {
    // Only clear once per run
    if (firstTestRun && testFilePath) {
        clearPreviousResults(testFilePath);
        firstTestRun = false;
    }

    try {
        await fn();
        addTestResult({ name, status: 'pass', timestamp: new Date().toISOString() });
    } catch (error) {
        const timestamp = Date.now();
        const fileName = `test-report/screenshots/${name.replace(/\s+/g, '_')}_${timestamp}.png`;
        const screenshotResult = await takeElementScreenshot(session, 'body', fileName);
        addTestResult({
            name,
            status: 'fail',
            error: error.stack || error.message,
            screenshot: screenshotResult.fileName,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}