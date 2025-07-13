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

// Find the package root - handle both dev and installed package scenarios
let packageRoot;
try {
  // Try to find package.json starting from current directory
  let currentDir = __dirname;
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.name === 'super-pancake-automation') {
        packageRoot = currentDir;
        break;
      }
    }
    currentDir = path.dirname(currentDir);
  }
  
  // Fallback to relative path
  if (!packageRoot) {
    packageRoot = path.join(__dirname, '..');
  }
} catch (error) {
  // Final fallback
  packageRoot = path.join(__dirname, '..');
}

const require = createRequire(import.meta.url);
const glob = require('glob');
import open from 'open';
import { ensurePortAvailable } from '../utils/port-finder.js';

const app = express();
const defaultPort = process.env.PORT || 3000;
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
    
    // Handle Vitest JSON format: result.testResults[].assertionResults[]
    if (Array.isArray(result?.testResults)) {
        for (const suite of result.testResults) {
            if (Array.isArray(suite.assertionResults)) {
                tests.push(...suite.assertionResults.map(test => ({
                    name: test.title || test.fullName || test.name,
                    status: test.status,
                    duration: test.duration,
                    error: test.failureMessages?.join('\n'),
                    fullName: test.fullName
                })));
            }
            if (Array.isArray(suite.tests)) {
                tests.push(...suite.tests);
            }
        }
    }
    
    // Handle direct tests array
    if (Array.isArray(result?.tests)) {
        tests.push(...result.tests);
    }
    
    // Handle assertion results directly
    if (Array.isArray(result?.assertionResults)) {
        tests.push(...result.assertionResults.map(test => ({
            name: test.title || test.fullName || test.name,
            status: test.status,
            duration: test.duration,
            error: test.failureMessages?.join('\n'),
            fullName: test.fullName
        })));
    }
    
    // Handle single test object
    if (result?.name && result?.status) {
        tests = [result];
    }
    
    // Handle tasks array (newer Vitest format)
    if (Array.isArray(result?.tasks)) {
        function extractFromTasks(tasks) {
            const extracted = [];
            tasks.forEach(task => {
                if (task.type === 'test') {
                    extracted.push({
                        name: task.name,
                        status: task.result?.state || task.state || 'unknown',
                        duration: task.result?.duration,
                        error: task.result?.errors?.[0]?.message
                    });
                } else if (Array.isArray(task.tasks)) {
                    extracted.push(...extractFromTasks(task.tasks));
                }
            });
            return extracted;
        }
        tests.push(...extractFromTasks(result.tasks));
    }
    
    // Filter valid tests
    return tests.filter(t => 
        typeof t === 'object' && t !== null &&
        (t.name || t.title || t.fullName || t.test) &&
        (t.status || t.result?.status || t.state || t.result?.state)
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
    const indexPath = path.join(packageRoot, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        console.error(`❌ index.html not found at: ${indexPath}`);
        console.error(`Package root: ${packageRoot}`);
        res.status(404).send(`
            <html>
                <head><title>UI Not Found</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>🔍 UI Files Not Found</h1>
                    <p>Could not find the UI files at: <code>${indexPath}</code></p>
                    <p>Package root detected as: <code>${packageRoot}</code></p>
                    <p>Please ensure the package is properly installed.</p>
                </body>
            </html>
        `);
    }
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
            let stderrOutput = '';
            let hasError = false;

            child.stdout.on('data', data => broadcast(data));
            child.stderr.on('data', data => {
                broadcast(data);
                stderrOutput += data.toString();
                
                // Check for specific error types
                if (data.includes('Error') || data.includes('Failed') || data.includes('Cannot') || 
                    data.includes('TypeError') || data.includes('SyntaxError') || data.includes('ReferenceError')) {
                    hasError = true;
                    broadcast(`🚨 Error detected: ${data.trim()}\n`);
                }
            });

            child.on('exit', code => {
                // Check if JSON file exists and create fallback if needed
                if (!fs.existsSync(outputFile)) {
                    broadcast(`❌ JSON output file not found, creating fallback results\n`);
                    const results = Array.from(testSet).map(testName => ({
                        name: testName,
                        status: 'failed',
                        error: 'Test did not complete (Vitest may have crashed or not output JSON)'
                    }));
                    fs.writeFileSync(outputFile, JSON.stringify({ tests: results }, null, 2));
                } else if (code !== 0) {
                    // Test file exists but exit code indicates failure
                    // Check if it's a configuration/syntax error (0 tests but failure)
                    try {
                        const result = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
                        if (result.numTotalTests === 0 && code === 1) {
                            // Extract specific error details from stderr
                            let errorDetails = 'Configuration or syntax error - check test file and imports.';
                            let errorType = 'Unknown Error';
                            
                            if (stderrOutput) {
                                // Parse common error patterns
                                if (stderrOutput.includes('Cannot read properties of undefined')) {
                                    const match = stderrOutput.match(/Cannot read properties of undefined \(reading '([^']+)'\)/);
                                    if (match) {
                                        errorType = 'Configuration Error';
                                        errorDetails = `Cannot read property '${match[1]}' - likely incorrect configuration path. Check config.js structure.`;
                                        
                                        if (match[1] === 'timeout') {
                                            errorDetails += '\n\nSuggestion: Use config.timeouts.testTimeout instead of config.timeouts.testTimeout';
                                        }
                                    }
                                } else if (stderrOutput.includes('SyntaxError')) {
                                    errorType = 'Syntax Error';
                                    const syntaxMatch = stderrOutput.match(/SyntaxError: (.+)/);
                                    errorDetails = syntaxMatch ? syntaxMatch[1] : 'Syntax error in test file';
                                } else if (stderrOutput.includes('TypeError')) {
                                    errorType = 'Type Error';
                                    const typeMatch = stderrOutput.match(/TypeError: (.+)/);
                                    errorDetails = typeMatch ? typeMatch[1] : 'Type error in test file';
                                } else if (stderrOutput.includes('Cannot resolve')) {
                                    errorType = 'Import Error';
                                    errorDetails = 'Cannot resolve module - check import paths and file locations';
                                } else if (stderrOutput.includes('ENOENT')) {
                                    errorType = 'File Not Found';
                                    errorDetails = 'Required file or module not found - check file paths';
                                }
                                
                                // Add the raw error output for debugging
                                errorDetails += '\n\nFull error output:\n' + stderrOutput.trim();
                            }
                            
                            broadcast(`❌ ${errorType} detected\n`);
                            broadcast(`📋 Error Details: ${errorDetails}\n`);
                            
                            // Create fallback results showing the specific error
                            const results = Array.from(testSet).map(testName => ({
                                name: testName,
                                status: 'failed',
                                error: `${errorType}: ${errorDetails}`,
                                timestamp: new Date().toISOString(),
                                duration: '0ms',
                                file: file
                            }));
                            
                            // Override the JSON with error information
                            const now = Date.now();
                            const errorResult = {
                                testResults: [{
                                    assertionResults: results.map(test => ({
                                        title: test.name,
                                        status: 'failed',
                                        duration: 0,
                                        failureMessages: [test.error],
                                        fullName: test.name
                                    })),
                                    status: 'failed',
                                    name: file,
                                    message: `${errorType}: ${errorDetails}`,
                                    startTime: now,
                                    endTime: now
                                }],
                                numTotalTests: results.length,
                                numFailedTests: results.length,
                                numPassedTests: 0,
                                success: false,
                                startTime: now,
                                endTime: now
                            };
                            fs.writeFileSync(outputFile, JSON.stringify(errorResult, null, 2));
                        }
                    } catch (err) {
                        broadcast(`❌ Error reading test results: ${err.message}\n`);
                    }
                }
                
                broadcast(`\n✅ Finished: ${file} (exit code: ${code})\n`);
                resolve();
            });
        });
    }

    // Generate summary and report (same as before)
    let totalTests = 0, passed = 0, failed = 0, skipped = 0;
    const resultsDir = 'test-report/results';
    
    // Fix Windows path separator issue for glob
    const globPattern = path.join(resultsDir, '**/*.json').replace(/\\/g, '/');
    const allFiles = glob.sync(globPattern);
    
    // Filter out HTML reporter files (timestamp-based names) and only include Vitest JSON files
    const resultFiles = allFiles.filter(file => {
        const filename = path.basename(file);
        // Keep only files that don't match timestamp pattern (HTML reporter files)
        // HTML reporter files look like: 1752300813428-hr2m7vpk.json
        return !filename.match(/^\d{13}-[a-z0-9]+\.json$/);
    });
    
    broadcast(`🔍 Debug - Looking for JSON files in: ${resultsDir}\n`);
    broadcast(`🔍 Debug - Total files found: ${allFiles.length}\n`);
    broadcast(`🔍 Debug - Filtered Vitest files: ${resultFiles.length}\n`);
    broadcast(`🔍 Debug - Using files: ${JSON.stringify(resultFiles, null, 2)}\n`);
    const fileTestCounts = [];

    for (const file of resultFiles) {
        try {
            const content = fs.readFileSync(file, 'utf-8');
            const result = JSON.parse(content);
            
            
            const validTests = extractValidTests(result);
            
            if (validTests.length === 0) {
                broadcast(`⚠️ No valid tests found in ${file}\n`);
                continue;
            }
            
            fileTestCounts.push({ file, count: validTests.length });
            totalTests += validTests.length;
            validTests.forEach(entry => {
                const status = (entry?.status || entry?.result?.status || entry?.state || entry?.result?.state || '').toLowerCase();
                
                // Handle Vitest state values: 'pass', 'fail', 'skip', 'todo'
                if (status === 'pass' || status === 'passed') passed++;
                else if (status === 'fail' || status === 'failed') failed++;
                else if (status === 'skip' || status === 'skipped' || status === 'pending' || status === 'todo') skipped++;
                else {
                    broadcast(`⚠️ Unknown test status: ${status}\n`);
                    failed++; // Treat unknown status as failed
                }
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

// Memory leak prevention
const connectedClients = new Set();

wss.on('connection', (ws) => {
    connectedClients.add(ws);
    
    ws.on('close', () => {
        connectedClients.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        connectedClients.delete(ws);
    });
});

function broadcast(message) {
    // Clean up closed connections
    for (const client of connectedClients) {
        if (client.readyState !== 1) {
            connectedClients.delete(client);
        } else {
            try {
                client.send(message.toString());
            } catch (error) {
                console.error('Failed to send message to client:', error);
                connectedClients.delete(client);
            }
        }
    }
}

// Cleanup on process exit
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    connectedClients.forEach(client => {
        if (client.readyState === 1) {
            client.close();
        }
    });
    connectedClients.clear();
    server.close(() => {
        process.exit(0);
    });
});

// Start server with automatic port finding
async function startServer() {
    const port = await ensurePortAvailable(defaultPort, true);
    
    server.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(`🚀 Test UI running at ${url}`);
        
        // Only open browser if not in test environment
        if (!process.env.CI && !process.env.NODE_ENV?.includes('test')) {
            open(url);
        }
    });
}

startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use. Please stop other services or use a different port.`);
    } else {
        console.error('❌ Server error:', error);
    }
    process.exit(1);
});