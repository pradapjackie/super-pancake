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

const app = express();
const port = 3000;
const execAsync = promisify(exec);

// Extract test cases from .test.js files
function extractTestCases(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const testRegex = /it\(['"`](.+?)['"`],/g;
    const tests = [];
    let match;
    while ((match = testRegex.exec(content))) {
        tests.push(match[1]);
    }
    return tests;
}

app.post('/run', express.json(), async (req, res) => {
    const selected = req.body.tests || [];
    if (selected.length === 0) return res.sendStatus(400);

    res.sendStatus(200);

    const fileToTests = {};
    for (const entry of selected) {
        const [file, test] = entry.split('::');
        if (!fileToTests[file]) fileToTests[file] = new Set();
        fileToTests[file].add(test);
    }

    const summary = {
        totalFiles: Object.keys(fileToTests).length,
        totalTests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        startTime: new Date()
    };

    for (const [file, testSet] of Object.entries(fileToTests)) {
        const testPattern = Array.from(testSet)
            .map(name => name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&'))
            .join('|');

        const cmd = `npx vitest run "${file}" -t "${testPattern}"`;
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
                            summary.passed += parseInt(testMatch[1], 10);
                            summary.skipped += parseInt(testMatch[2], 10);
                        }
                    } else if (/Tests\s+(\d+)\s+passed\s*\|\s*(\d+)\s+failed\s*\|\s*(\d+)\s+skipped\s*\((\d+)\)/.test(line)) {
                        const match = line.match(/Tests\s+(\d+)\s+passed\s*\|\s*(\d+)\s+failed\s*\|\s*(\d+)\s+skipped\s*\((\d+)\)/);
                        if (match) {
                            summary.passed += parseInt(match[1], 10);
                            summary.failed += parseInt(match[2], 10);
                            summary.skipped += parseInt(match[3], 10);
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

    summary.totalTests = summary.passed + summary.failed + summary.skipped;

    const endTime = new Date();
    const duration = endTime - summary.startTime;

    // Broadcast each summary line individually, each with a newline for readability
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
});
// Serve UI
app.get('/', (req, res) => {
    const testFiles = glob.sync('**/*.test.js', { ignore: 'node_modules/**' });

    let htmlCases = '';
    testFiles.forEach(file => {
        const cases = extractTestCases(file);
        htmlCases += `<div><strong>${file}</strong><ul>`;
        cases.forEach(test => {
            const id = `${file}::${test}`;
            htmlCases += `<li><label><input type="checkbox" name="tests" value="${id}"> ${test}</label></li>`;
        });
        htmlCases += `</ul></div>`;
    });

    res.send(`
<!DOCTYPE html>
<html>
  <head>
    <title>Test Runner UI</title>
    <style>
      body {
        margin: 0;
        font-family: 'Segoe UI', sans-serif;
        display: flex;
        height: 100vh;
        background-color: #f2f4f8;
      }
      .left {
        width: 20%;
        padding: 1rem;
        overflow-y: auto;
        border-right: 2px solid #ddd;
        background: #ffffff;
      }
      .right {
        width: 80%;
        padding: 1rem;
        overflow-y: auto;
        background: #fafafa;
        white-space: pre-wrap;
      }
      h3 {
        margin-top: 0;
        color: #1e88e5;
      }
      .test-file {
        margin-bottom: 10px;
      }
      .test-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        font-weight: bold;
        color: #1565c0;
      }
      .test-cases {
        display: none;
        padding-left: 10px;
      }
      .test-cases label {
        font-size: 13px;
        display: block;
        margin: 2px 0;
        padding: 2px 4px;
        border-radius: 4px;
      }
      .test-cases label:hover {
        background-color: #e3f2fd;
      }
      button[type="submit"] {
        margin-top: 10px;
        padding: 8px 14px;
        background-color: #1e88e5;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
      }
      button[type="submit"]:hover {
        background-color: #1565c0;
      }
#log {
  font-size: 12px;
  background: #1b1a1a;
  color: #ccc;
  padding: 1rem;
  border-radius: 4px;
  height: 90%;
  overflow-y: auto;
  line-height: 1.4;
  font-family: monospace;
}
    </style>
  </head>
  <body>
    <div class="left">
      <h3>Available Tests</h3>
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
        <button type="submit">Run Selected</button>
      </form>
    </div>
    <div class="right" id="output">
      <h3>Live Output</h3>
      <div id="log"></div>
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
        log.innerText += event.data;
        log.scrollTop = log.scrollHeight;
      };
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
    console.log(`🚀 Test UI running at http://localhost:${port}`);
});