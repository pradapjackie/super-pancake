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
    if (stat.isDirectory()) {return [];}
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

    // Normalize file path for cross-platform compatibility
    const normalizedPath = path.normalize(filePath);

    // Check if file exists
    if (!fs.existsSync(normalizedPath)) {
      console.log('File does not exist:', normalizedPath);
      return res.status(404).json({ error: 'Test file not found' });
    }

    const testCases = extractTestCases(normalizedPath);
    console.log('Found test cases:', testCases.length, 'in', normalizedPath);
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

// Test execution route with enhanced error handling
app.post('/run', express.json(), async (req, res) => {
  try {
    const selected = req.body.tests || [];
    const headless = req.body.headless || false;
    if (selected.length === 0) {
      res.status(400).json({ error: 'No tests selected' });
      return;
    }

    res.status(200).json({ message: 'Test execution started', count: selected.length, headless });

    // Execute tests in background to prevent blocking
    setImmediate(async () => {
      try {
        await executeTests(selected, headless);
      } catch (error) {
        console.error('❌ Test execution error:', error);
        broadcast(`❌ Test execution failed: ${error.message}\n`);
      }
    });
  } catch (error) {
    console.error('❌ Route error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Stop test execution route
app.post('/stop', express.json(), async (req, res) => {
  try {
    // Send response immediately
    res.status(200).json({ message: 'Stop request received' });

    broadcast('🛑 Test execution stop requested by user\n');

    // Kill all running test processes
    if (process.platform === 'win32') {
      // Windows: Kill vitest and node test processes
      exec('taskkill /f /im node.exe /fi "COMMANDLINE eq *vitest*" 2>nul || exit 0', { shell: true });
      exec('taskkill /f /im node.exe /fi "COMMANDLINE eq *test*" 2>nul || exit 0', { shell: true });
    } else {
      // Unix-like systems (macOS, Linux)
      exec('pkill -f "vitest" 2>/dev/null || true');
      exec('pkill -f "node.*test" 2>/dev/null || true');
    }

    broadcast('🛑 All test processes have been terminated\n');
  } catch (error) {
    console.error('❌ Stop route error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

async function executeTests(selected, headless = false) {
  try {
    const modeText = headless ? 'headless' : 'headed';
    broadcast(`🚀 Starting test execution of ${selected.length} tests in ${modeText} mode...\n`);

    // Limit concurrent tests to prevent system overload
    if (selected.length > 20) {
      broadcast(`⚠️ Large test suite detected (${selected.length} tests). Running in smaller batches to prevent system overload.\n`);
    }

    // Cleanup all old result JSON files before running new tests
    const resultDirRoot = 'test-report/results';
    try {
      const allOldResults = glob.sync(path.join(resultDirRoot, '**/*.json'));
      for (const oldFile of allOldResults) {
        try {
          fs.unlinkSync(oldFile);
        } catch (err) {
          console.warn(`⚠️ Failed to delete old result file ${oldFile}: ${err.message}`);
        }
      }
    } catch (err) {
      broadcast(`⚠️ Warning: Could not clean old results: ${err.message}\n`);
    }

    const fileToTests = {};
    for (const entry of selected) {
      const [file, test] = entry.split('::');
      if (!fileToTests[file]) {fileToTests[file] = new Set();}
      fileToTests[file].add(test);
    }

    // Process files one by one to prevent overload
    let fileIndex = 0;
    for (const [file, testSet] of Object.entries(fileToTests)) {
      fileIndex++;
      broadcast(`📁 Processing file ${fileIndex}/${Object.keys(fileToTests).length}: ${file}\n`);

      // Add a small delay between files to prevent system overload
      if (fileIndex > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const testPattern = Array.from(testSet)
        .map(name => name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'))
        .join('|');
        // Create proper directory structure for results
      const fileDir = path.dirname(file).replace(/\//g, '_');
      const fileName = path.basename(file, '.test.js');
      const resultsSubDir = path.join('test-report', 'results', fileDir, fileName);

      // Clean only that test file's result subdirectory
      if (fs.existsSync(resultsSubDir)) {
        fs.rmSync(resultsSubDir, { recursive: true, force: true });
      }
      fs.mkdirSync(resultsSubDir, { recursive: true });

      const outputFile = path.join(resultsSubDir, 'results.json');
      const absoluteOutputFile = path.resolve(outputFile);
      const cmd = `npx vitest run "${file}" -t "${testPattern}" --outputFile="${absoluteOutputFile}" --reporter=json`;

      broadcast(`📁 Creating directory: ${resultsSubDir}\n`);
      broadcast(`📄 Output file will be: ${outputFile}\n`);
      broadcast(`📄 Absolute path: ${absoluteOutputFile}\n`);
      broadcast(`🔍 Directory exists: ${fs.existsSync(resultsSubDir)}\n`);
      broadcast(`\n▶ Running: ${cmd}\n`);

      await new Promise((resolve) => {
        let childProcess;
        let isResolved = false;

        const safeResolve = () => {
          if (!isResolved) {
            isResolved = true;
            resolve();
          }
        };

        // Set a timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          if (childProcess && !childProcess.killed) {
            broadcast('⏰ Test execution timeout, terminating process\n');
            childProcess.kill('SIGTERM');
            setTimeout(() => {
              if (!childProcess.killed) {
                childProcess.kill('SIGKILL');
              }
            }, 5000);
          }
          safeResolve();
        }, 120000); // 2 minute timeout

        try {
          childProcess = exec(cmd, {
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer (reduced)
            timeout: 120000, // 2 minute timeout (reduced)
            killSignal: 'SIGTERM',
            env: {
              ...process.env,
              NODE_OPTIONS: '--max-old-space-size=512', // Limit memory to 512MB
              SUPER_PANCAKE_HEADLESS: headless.toString() // Pass headless mode to tests
            }
          });

          let stderrOutput = '';
          let hasError = false;

          const safeBroadcast = (message) => {
            try {
              if (message && message.length > 0) {
                broadcast(message);
              }
            } catch (err) {
              console.error('Error in safeBroadcast:', err);
            }
          };

          childProcess.stdout?.on('data', data => {
            try {
              const message = data.toString();
              // Send in smaller chunks to prevent overload
              if (message.length > 500) {
                const chunks = message.match(/.{1,500}/g) || [];
                chunks.forEach((chunk, index) => {
                  setTimeout(() => safeBroadcast(chunk), index * 50);
                });
              } else {
                safeBroadcast(message);
              }
            } catch (err) {
              console.error('Error handling stdout:', err);
            }
          });

          childProcess.stderr?.on('data', data => {
            try {
              const message = data.toString();
              stderrOutput += message;

              // Send stderr in chunks
              if (message.length > 500) {
                const chunks = message.match(/.{1,500}/g) || [];
                chunks.forEach((chunk, index) => {
                  setTimeout(() => safeBroadcast(chunk), index * 50);
                });
              } else {
                safeBroadcast(message);
              }

              // Check for specific error types
              if (message.includes('Error') || message.includes('Failed') || message.includes('Cannot') ||
                            message.includes('TypeError') || message.includes('SyntaxError') || message.includes('ReferenceError')) {
                hasError = true;
                safeBroadcast(`🚨 Error detected: ${message.trim()}\n`);
              }
            } catch (err) {
              console.error('Error handling stderr:', err);
            }
          });

          childProcess.on('error', (error) => {
            try {
              clearTimeout(timeoutId);
              safeBroadcast(`❌ Process error: ${error.message}\n`);
              console.error('Child process error:', error);
            } catch (err) {
              console.error('Error handling process error:', err);
            }
            safeResolve();
          });

          childProcess.on('exit', (code) => {
            try {
              clearTimeout(timeoutId);

              // Check if JSON file exists and create fallback if needed
              if (!fs.existsSync(outputFile)) {
                safeBroadcast('❌ JSON output file not found, creating fallback results\n');
                const results = Array.from(testSet).map(testName => ({
                  name: testName,
                  status: 'failed',
                  error: 'Test did not complete (Vitest may have crashed or not output JSON)'
                }));
                fs.writeFileSync(outputFile, JSON.stringify({ tests: results }, null, 2));
              } else if (code !== 0) {
                // Test file exists but exit code indicates failure
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

                      // Add the raw error output for debugging (truncated)
                      const truncatedError = stderrOutput.length > 1000 ?
                        stderrOutput.substring(0, 1000) + '...[truncated]' :
                        stderrOutput;
                      errorDetails += '\n\nError output:\n' + truncatedError.trim();
                    }

                    safeBroadcast(`❌ ${errorType} detected\n`);
                    safeBroadcast(`📋 Error Details: ${errorDetails.substring(0, 500)}...\n`);

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
                  safeBroadcast(`❌ Error reading test results: ${err.message}\n`);
                }
              }

              // Check if output file was actually created - multiple checks
              const checkFile = (attempt = 1) => {
                if (fs.existsSync(outputFile)) {
                  const fileStats = fs.statSync(outputFile);
                  safeBroadcast(`📄 JSON report created: ${outputFile} (${fileStats.size} bytes)\n`);

                  // Read and validate the JSON content
                  try {
                    const content = fs.readFileSync(outputFile, 'utf-8');
                    const parsed = JSON.parse(content);
                    const testCount = parsed.numTotalTests || (parsed.testResults ? parsed.testResults.reduce((sum, suite) => sum + (suite.assertionResults?.length || 0), 0) : 0);
                    safeBroadcast(`📊 File contains ${testCount} tests\n`);
                  } catch (err) {
                    safeBroadcast(`⚠️ Warning: Could not parse JSON file: ${err.message}\n`);
                  }
                } else {
                  safeBroadcast(`⚠️ Warning: Expected output file not found (attempt ${attempt}): ${outputFile}\n`);
                  safeBroadcast(`🔍 Directory contents: ${fs.existsSync(resultsSubDir) ? fs.readdirSync(resultsSubDir).join(', ') : 'Directory does not exist'}\n`);

                  // Try again with longer delay (up to 3 attempts)
                  if (attempt < 3) {
                    setTimeout(() => checkFile(attempt + 1), 500 * attempt);
                  } else {
                    // Try to create a dummy file to test file creation
                    try {
                      const testFile = path.join(resultsSubDir, 'test-write.json');
                      fs.writeFileSync(testFile, '{"test": true}');
                      safeBroadcast('✅ Directory is writable (created test file)\n');
                      fs.unlinkSync(testFile);
                    } catch (writeErr) {
                      safeBroadcast(`❌ Directory write test failed: ${writeErr.message}\n`);
                    }
                  }
                }
              };

              // Start checking immediately, then with delays
              checkFile();

              safeBroadcast(`\n✅ Finished: ${file} (exit code: ${code})\n`);
            } catch (err) {
              console.error('Error in exit handler:', err);
            }
            safeResolve();
          });

        } catch (err) {
          clearTimeout(timeoutId);
          console.error('Error creating child process:', err);
          safeBroadcast(`❌ Failed to start test execution: ${err.message}\n`);
          safeResolve();
        }
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
          if (status === 'pass' || status === 'passed') {passed++;} else if (status === 'fail' || status === 'failed') {failed++;} else if (status === 'skip' || status === 'skipped' || status === 'pending' || status === 'todo') {skipped++;} else {
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
      // Add a small delay to ensure all files are written
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify all expected files exist before generating report
      broadcast('🔍 Verifying test result files...\n');
      const allExpectedFiles = [];
      for (const [file] of Object.entries(fileToTests)) {
        const fileDir = path.dirname(file).replace(/\//g, '_');
        const fileName = path.basename(file, '.test.js');
        const expectedPath = path.join('test-report', 'results', fileDir, fileName, 'results.json');
        allExpectedFiles.push(expectedPath);

        if (fs.existsSync(expectedPath)) {
          broadcast(`✅ Found: ${expectedPath}\n`);
        } else {
          broadcast(`❌ Missing: ${expectedPath}\n`);
        }
      }

      // Import the writeReport function dynamically
      const { writeReport } = await import('../reporter/htmlReporter.js');
      writeReport();
      broadcast('📊 HTML report generated: automationTestReport.html\n');
    } catch (error) {
      broadcast(`❌ Failed to generate HTML report: ${error.message}\n`);
    }

  } catch (error) {
    console.error('❌ Fatal error in executeTests:', error);
    broadcast(`❌ Test execution failed: ${error.message}\n`);
    broadcast('📋 Please try running fewer tests at once or restart the server.\n');
  }
}

// Create HTTP + WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Memory leak prevention
const connectedClients = new Set();

wss.on('connection', (ws, req) => {
  try {
    connectedClients.add(ws);
    console.log(`🔌 New WebSocket connection from ${req.socket.remoteAddress}`);

    ws.on('close', () => {
      try {
        connectedClients.delete(ws);
        console.log(`📤 WebSocket connection closed. Active connections: ${connectedClients.size}`);
      } catch (error) {
        console.error('Error handling WebSocket close:', error);
      }
    });

    ws.on('error', (error) => {
      try {
        console.error('🚨 WebSocket error:', error);
        connectedClients.delete(ws);
      } catch (err) {
        console.error('Error handling WebSocket error:', err);
      }
    });

    // Send welcome message safely
    try {
      ws.send('🔌 Connected to Super Pancake Test Runner');
    } catch (error) {
      console.error('Error sending welcome message:', error);
      connectedClients.delete(ws);
    }
  } catch (error) {
    console.error('Error setting up WebSocket connection:', error);
  }
});

// Add error handling for the WebSocket server itself
wss.on('error', (error) => {
  console.error('🚨 WebSocket server error:', error);
});

function broadcast(message) {
  if (connectedClients.size === 0) {
    console.log('[No WebSocket clients]:', message.toString().trim());
    return;
  }

  // Clean up closed connections and send to active ones
  const clientsToRemove = [];
  for (const client of connectedClients) {
    if (client.readyState !== 1) { // WebSocket.OPEN = 1
      clientsToRemove.push(client);
    } else {
      try {
        // Ensure message is a string and limit size to prevent WebSocket overload
        const messageStr = message.toString();
        if (messageStr.length > 0 && messageStr.length < 50000) { // 50KB limit
          client.send(messageStr);
        } else if (messageStr.length >= 50000) {
          // Split large messages
          const chunks = messageStr.match(/.{1,10000}/g) || [];
          chunks.forEach((chunk, index) => {
            setTimeout(() => {
              if (client.readyState === 1) {
                client.send(chunk);
              }
            }, index * 100); // 100ms delay between chunks
          });
        }
      } catch (error) {
        console.error('Failed to send message to client:', error);
        clientsToRemove.push(client);
      }
    }
  }

  // Remove dead clients
  clientsToRemove.forEach(client => connectedClients.delete(client));
}

// Add process error handlers to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  broadcast(`❌ Server error: ${error.message}\n`);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  broadcast(`❌ Server error: ${reason}\n`);
  // Don't exit - keep server running
});

// Cleanup on process exit
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  try {
    connectedClients.forEach(client => {
      if (client.readyState === 1) {
        client.close();
      }
    });
    connectedClients.clear();
    server.close(() => {
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server with automatic port finding
async function startServer() {
  const port = await ensurePortAvailable(defaultPort, true);

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`🚀 Test UI running at ${url}`);
    console.log('🔌 WebSocket server running on the same port');
    console.log('📱 Opening browser...');

    // Only open browser if not in test environment
    if (!process.env.CI && !process.env.NODE_ENV?.includes('test')) {
      open(url);
    }
  });

  // Handle port in use errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${port} is busy, trying next available port...`);
      // Reset server and WebSocket before retry
      server.removeAllListeners();
      wss.close();
      startServer(); // Recursively try next port
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });
}

startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
