// scripts/test-ui.js - Updated server for 3-file structure
import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = path.join(__dirname, '..');

const require = createRequire(import.meta.url);
const glob = require('glob');
import open from 'open';

const app = express();
const port = 3000;
const execAsync = promisify(exec);

// Middleware
app.use(express.json());
app.use(express.static(path.join(packageRoot, 'public'))); // Serve static files from package public directory

// Extract test cases from .test.js files
function extractTestCases(filePath) {
    try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) return [];
        const content = fs.readFileSync(filePath, 'utf-8');
        const testRegex = /it\s*\(\s*['"`](.+?)['"`]\s*,/g;
        const tests = [];
        let match;
        while ((match = testRegex.exec(content))) {
            tests.push(match[1]);
        }
        return tests;
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return [];
    }
}

// Helper to extract valid tests from any result object
function extractValidTests(result) {
    let tests = [];
    if (Array.isArray(result?.tests)) {
        tests = result.tests;
    } else if (Array.isArray(result?.testResults)) {
        for (const suite of result.testResults) {
            if (Array.isArray(suite.assertionResults)) {
                tests.push(...suite.assertionResults);
            }
        }
    } else if (Array.isArray(result?.assertionResults)) {
        tests = result.assertionResults;
    } else if (result?.name && result?.status) {
        tests = [result];
    } else if (typeof result === 'object' && result !== null) {
        tests = [result];
    }
    return tests.filter(
        t => typeof t === 'object' &&
            ((t.name || t.title || t.fullName || t.test) && (t.status || t.result?.status || t.state))
    );
}

// API Routes
app.get('/api/test-files', (req, res) => {
    try {
        const testFiles = glob.sync('**/*.test.js', { ignore: 'node_modules/**' });
        console.log('Found test files:', testFiles);
        res.json(testFiles);
    } catch (error) {
        console.error('Error loading test files:', error);
        res.status(500).json({ error: 'Failed to load test files', details: error.message });
    }
});

// Use POST for test cases to avoid URL encoding issues
app.post('/api/test-cases', express.json(), (req, res) => {
    try {
        const { filePath } = req.body;
        console.log('Loading test cases for:', filePath);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.log('File does not exist:', filePath);
            return res.status(404).json({ error: 'Test file not found' });
        }

        const testCases = extractTestCases(filePath);
        console.log('Found test cases:', testCases.length, 'in', filePath);
        res.json(testCases);
    } catch (error) {
        console.error('Error loading test cases:', error);
        res.status(500).json({ error: 'Failed to load test cases', details: error.message });
    }
});

// Main UI route - serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(packageRoot, 'public', 'index.html'));
});

// Serve the test report
app.get('/automationTestReport.html', (req, res) => {
    const reportPath = path.join(process.cwd(), 'automationTestReport.html');
    if (fs.existsSync(reportPath)) {
        res.sendFile(reportPath);
    } else {
        res.status(404).send(`
            <html>
                <head><title>Report Not Found</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>🔍 Test Report Not Found</h1>
                    <p>The test report has not been generated yet.</p>
                    <p>Please run some tests first to generate the report.</p>
                    <a href="/" style="color: #16a34a; text-decoration: none;">← Back to Test Runner</a>
                </body>
            </html>
        `);
    }
});

// Test execution route (same as before)
app.post('/run', express.json(), async (req, res) => {
    const selected = req.body.tests || [];
    if (selected.length === 0) {
        res.sendStatus(400);
        return;
    }

    res.sendStatus(200);

    // Cleanup all old result JSON files before running new tests
    const resultDirRoot = 'test-report/results';
    const allOldResults = glob.sync(path.join(resultDirRoot, '**/*.json'));
    for (const oldFile of allOldResults) {
        try {
            fs.unlinkSync(oldFile);
        } catch (err) {
            console.warn(`⚠️ Failed to delete old result file ${oldFile}: ${err.message}`);
        }
    }

    const fileToTests = {};
    for (const entry of selected) {
        const [file, test] = entry.split('::');
        if (!fileToTests[file]) fileToTests[file] = new Set();
        fileToTests[file].add(test);
    }

    for (const [file, testSet] of Object.entries(fileToTests)) {
        const testPattern = Array.from(testSet)
            .map(name => name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'))
            .join('|');
        const resultsSubDir = path.join('test-report', 'results', path.dirname(file).replace(/\//g, '_'), path.basename(file, '.test.js'));

        // Clean only that test file's result subdirectory
        if (fs.existsSync(resultsSubDir)) {
            fs.rmSync(resultsSubDir, { recursive: true, force: true });
        }
        fs.mkdirSync(resultsSubDir, { recursive: true });

        const outputFile = path.join(resultsSubDir, 'results.json');
        const cmd = `npx vitest run "${file}" -t "${testPattern}" --outputFile="${outputFile}" --reporter=json`;

        broadcast(`\n▶ Running: ${cmd}\n`);

        await new Promise((resolve) => {
            const child = exec(cmd);

            child.stdout.on('data', data => broadcast(data));
            child.stderr.on('data', data => broadcast(data));

            child.on('exit', code => {
                // If JSON file does NOT exist, create a minimal failed result
                if (!fs.existsSync(outputFile)) {
                    const results = Array.from(testSet).map(testName => ({
                        name: testName,
                        status: 'failed',
                        error: 'Test did not complete (Vitest may have crashed or not output JSON)'
                    }));
                    fs.writeFileSync(outputFile, JSON.stringify({ tests: results }, null, 2));
                }
                broadcast(`\n✅ Finished: ${file} (exit code: ${code})\n`);
                resolve();
            });
        });
    }

    // Generate summary and report (same as before)
    let totalTests = 0, passed = 0, failed = 0, skipped = 0;
    const resultsDir = 'test-report/results';
    const resultFiles = glob.sync(path.join(resultsDir, 'tests/**/*.json'));
    const fileTestCounts = [];

    for (const file of resultFiles) {
        try {
            const result = JSON.parse(fs.readFileSync(file, 'utf-8'));
            const validTests = extractValidTests(result);
            if (validTests.length === 0) continue;
            fileTestCounts.push({ file, count: validTests.length });
            totalTests += validTests.length;
            validTests.forEach(entry => {
                const status = (entry?.status || entry?.result?.status || entry?.state || '').toLowerCase();
                if (status === 'pass' || status === 'passed') passed++;
                else if (status === 'fail' || status === 'failed') failed++;
                else if (status === 'skipped' || status === 'pending') skipped++;
            });
        } catch (err) {
            broadcast(`❌ Failed to read result file ${file}: ${err.message}\n`);
        }
    }

    broadcast('\n✅ All tests finished.\n');
    broadcast('Test Summary\n');
    fileTestCounts.forEach(entry => {
        broadcast(`File: ${entry.file}  |  Tests: ${entry.count}\n`);
    });
    broadcast('--------------------------------------------------\n');
    broadcast(`Total Tests:       ${totalTests}\n`);
    broadcast(`✅ Passed:         ${passed}\n`);
    broadcast(`❌ Failed:         ${failed}\n`);
    broadcast(`⚠️ Skipped:        ${skipped}\n`);
    broadcast('--------------------------------------------------\n');
    
    // Generate HTML report after all tests complete
    try {
        // Import the writeReport function dynamically
        const { writeReport } = await import('../reporter/htmlReporter.js');
        writeReport();
        broadcast(`📊 HTML report generated: automationTestReport.html\n`);
    } catch (error) {
        broadcast(`❌ Failed to generate HTML report: ${error.message}\n`);
    }
});

// Create HTTP + WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(message.toString());
        }
    });
}

server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`🚀 Test UI running at ${url}`);
    open(url);
});