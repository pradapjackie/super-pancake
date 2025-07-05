// scripts/test-ui.js
import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import http from 'http';
import { WebSocketServer } from 'ws';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const glob = require('glob');
const path = require('path');
import open from 'open';
const app = express();
const port = 3000;
const execAsync = promisify(exec);

// Extract test cases from .test.js files
function extractTestCases(filePath) {
    try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) return [];
        const content = fs.readFileSync(filePath, 'utf-8');
        const testRegex = /it\(['"`](.+?)['"`],/g;
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

    // Optionally clean up screenshots or artifacts
    const artifactDirs = ['test-report/screenshots', 'test-report/artifacts'];
    for (const dir of artifactDirs) {
      if (fs.existsSync(dir)) {
        const files = glob.sync(path.join(dir, '**/*'));
        for (const file of files) {
          try {
            fs.unlinkSync(file);
          } catch (err) {
            console.warn(`⚠️ Failed to delete artifact file ${file}: ${err.message}`);
          }
        }
      }
    }

    const fileToTests = {};
    for (const entry of selected) {
        const [file, test] = entry.split('::');
        if (!fileToTests[file]) fileToTests[file] = new Set();
        fileToTests[file].add(test);
    }

    const summary = {
        totalFiles: 0,
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        broken: 0,
        startTime: new Date(),
        broadcastedDone: false
    };

    for (const [file, testSet] of Object.entries(fileToTests)) {
        const testPattern = Array.from(testSet)
            .map(name => name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'))
            .join('|');

        const resultsSubDir = path.join('test-report', 'results', path.dirname(file).replace(/\//g, '_'), path.basename(file, '.test.js'));

        // Clean only that test file’s result subdirectory
        if (fs.existsSync(resultsSubDir)) {
          fs.rmSync(resultsSubDir, { recursive: true, force: true });
        }
        fs.mkdirSync(resultsSubDir, { recursive: true });

        const cmd = `npx vitest run "${file}" -t "${testPattern}" --outputFile="${resultsSubDir}/results.json"`;
        broadcast(`\n▶ Running: ${cmd}\n`);

        await new Promise((resolve) => {
            const child = exec(cmd);

            child.stdout.on('data', data => {
                const lines = data.toString().split('\n');
                lines.forEach(line => {
                    broadcast(line + '\n');
                    // Improved summary tracking: parse lines more precisely
                    if (/Tests\s+\d+\s+passed\s*\|\s*\d+\s+skipped\s*\(\d+\)/.test(line)) {
                        const testMatch = line.match(/Tests\s+(\d+)\s+passed\s*\|\s*(\d+)\s+skipped\s*\((\d+)\)/);
                        if (testMatch) {
                            // removed summary updates here as per instructions
                        }
                    } else if (/Tests\s+(\d+)\s+passed\s*\|\s*(\d+)\s+failed\s*\|\s*(\d+)\s+skipped\s*\((\d+)\)/.test(line)) {
                        const match = line.match(/Tests\s+(\d+)\s+passed\s*\|\s*(\d+)\s+failed\s*\|\s*(\d+)\s+skipped\s*\((\d+)\)/);
                        if (match) {
                            // removed summary updates here as per instructions
                        }
                    }
                });
            });

            child.stderr.on('data', data => broadcast(data));
            child.on('exit', code => {
                broadcast(`\n✅ Finished: ${file} (exit code: ${code})\n`);
                resolve();
            });
        });
    }

    // Update summary counts based on result files in test-report/results after all tests run
    summary.totalFiles = Object.keys(fileToTests).length;
    const resultsDir = 'test-report/results';
    const resultFiles = glob.sync(path.join(resultsDir, '**/*.json'));

    summary.totalTests = 0;
    summary.passed = 0;
    summary.failed = 0;
    summary.skipped = 0;
    summary.broken = 0;
    for (const file of resultFiles) {
      try {
        const result = JSON.parse(fs.readFileSync(file, 'utf-8'));
        const tests = Array.isArray(result?.tests) ? result.tests :
                      Array.isArray(result?.testResults) ? result.testResults : [result];
        tests.forEach(entry => {
          const status = (entry?.status || entry?.result?.status || entry?.state || '').toLowerCase();
          if (status) {
            summary.totalTests++;
            if (status === 'pass' || status === 'passed') summary.passed++;
            else if (status === 'fail' || status === 'failed') summary.failed++;
            else if (status === 'skipped') summary.skipped++;
            else if (status === 'broken') summary.broken++;
          }
        });
      } catch (err) {
        broadcast(`❌ Failed to read result file ${file}: ${err.message}\n`);
      }
    }

    const endTime = new Date();
    const duration = endTime - summary.startTime;

    // Broadcast each summary line individually, each with a newline for readability
    if (!summary.broadcastedDone) {
      summary.broadcastedDone = true;
      broadcast('✅ All tests finished.\n');
      broadcast('Test Summary\n');
      broadcast('--------------------------------------------------\n');
      broadcast(`Total Test Files:  ${summary.totalFiles}\n`);
      broadcast(`Total Tests:       ${summary.totalTests}\n`);
      broadcast(`✅ Passed:         ${summary.passed}\n`);
      broadcast(`❌ Failed:         ${summary.failed}\n`);
      broadcast(`⚠️ Skipped:        ${summary.skipped}\n`);
      broadcast(`Start Time:        ${summary.startTime.toLocaleTimeString()}\n`);
      broadcast(`Duration:          ${duration}ms\n`);
      broadcast('--------------------------------------------------\n');
      broadcast('Check the "test-report" folder for detailed report.\n');
    }
});
// Serve UI
app.get('/', (req, res) => {
    const testFiles = glob.sync('**/*.test.js', { ignore: 'node_modules/**' });

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Super Pancake Test Runner</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      font-family: 'Inter', sans-serif;
      background-color: #f9fafb;
      display: flex;
      height: 100vh;
    }
    .sidebar {
      width: 240px;
      background: #ffffff;
      border-right: 1px solid #e0e0e0;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      overflow-y: auto;
    }
    .sidebar h2 {
      margin: 0;
      font-size: 20px;
      color: #111827;
    }
    .test-file {
      margin-bottom: 1rem;
    }
    .test-header {
      font-weight: 600;
      cursor: pointer;
      padding: 0.3rem 0 0.3rem 0.2rem;
      color: #1f2937;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 15px;
      letter-spacing: 0.01em;
    }
    .test-cases {
      margin-top: 0.4rem;
      padding-left: 0.2rem;
    }
    .test-cases label {
      display: block;
      font-size: 13px;
      color: #374151;
      margin-bottom: 0.4rem;
      padding-left: 1rem;
      line-height: 1.5;
    }
    .test-cases input[type="checkbox"] {
      margin: 0;
    }
    button {
      background-color: #3b82f6;
      color: #fff;
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover {
      background-color: #2563eb;
    }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 2rem;
      background: #f8fafc;
    }
    .main h2 {
      margin-top: 0;
      color: #1e293b;
    }
    .log-container {
      flex: 1;
      background-color: #0f172a;
      color: #e2e8f0;
      padding: 1rem;
      font-family: monospace;
      font-size: 13px;
      border-radius: 6px;
      overflow-y: auto;
      white-space: pre-wrap;
    }
    .log-pass { color: #22c55e; font-weight: bold; }
    .log-fail { color: #ef4444; font-weight: bold; }
    .log-info { color: #60a5fa; }
  </style>
</head>
<body>
  <div class="sidebar">
    <h2>Tests</h2>
    <button onclick="location.reload()">🔄 Refresh</button>
    <form id="test-form">
      ${testFiles.map(file => {
        const cases = extractTestCases(file);
        const caseHTML = cases.map(test => {
          const id = `${file}::${test}`;
          return `<label><input type="checkbox" name="tests" value="${id}"> ${test}</label>`;
        }).join('');
        const escapedId = file.replace(/[^a-zA-Z0-9]/g, '_');
        return `
          <div class="test-file" id="group-${escapedId}">
            <div class="test-header" onclick="toggleCases('${escapedId}')">
              ${file} <span id="toggle-${escapedId}">▼</span>
            </div>
            <div class="test-cases" id="cases-${escapedId}">
              <label><input type="checkbox" onchange="toggleGroup('${escapedId}', this.checked)"> Select All</label>
              ${caseHTML}
            </div>
          </div>
        `;
      }).join('')}
      <button type="submit" style="margin-top: 1rem;">▶ Run Selected</button>
    </form>
  </div>
  <div class="main">
    <h2>Live Output</h2>
    <div class="log-container" id="log">Waiting for test output...</div>
    <button onclick="copyLogs()" style="margin-top: 1rem;">📋 Copy Logs</button>
  </div>
  <script>
    function toggleCases(id) {
      const casesEl = document.getElementById('cases-' + id);
      const toggleEl = document.getElementById('toggle-' + id);
      const visible = casesEl.style.display === 'block';
      casesEl.style.display = visible ? 'none' : 'block';
      toggleEl.textContent = visible ? '▼' : '▲';
    }

    function toggleGroup(groupId, checked) {
      const group = document.getElementById('group-' + groupId);
      const checkboxes = group.querySelectorAll('input[type="checkbox"][name="tests"]');
      checkboxes.forEach(cb => cb.checked = checked);
    }

    const form = document.getElementById('test-form');
    const log = document.getElementById('log');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const selected = Array.from(form.elements['tests'])
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      await fetch('/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tests: selected })
      });

      log.innerText = 'Running tests...\\n';
    });

    const socket = new WebSocket(\`ws://\${location.host}\`);
    socket.onmessage = (event) => {
      const div = document.createElement('div');
      let className = '';
      if (event.data.includes('✓') || event.data.includes('✅')) className = 'log-pass';
      else if (event.data.includes('✗') || event.data.includes('FAIL') || event.data.includes('❌')) className = 'log-fail';
      else className = 'log-info';
      div.innerHTML = \`<span class="\${className}">\${event.data.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>\`;
      log.appendChild(div);
      log.scrollTop = log.scrollHeight;
    };
    function copyLogs() {
      const log = document.getElementById('log');
      const range = document.createRange();
      range.selectNodeContents(log);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      try {
        document.execCommand('copy');
        alert('Logs copied to clipboard!');
      } catch (err) {
        alert('Failed to copy logs.');
      }
      selection.removeAllRanges();
    }
  </script>
</body>
</html>
`);
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
    open(url); // This line opens the browser automatically
});
