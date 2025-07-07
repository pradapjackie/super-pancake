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
    // Only keep real tests (must have status and a name/title/test)
    return tests.filter(
        t => typeof t === 'object' &&
        ((t.name || t.title || t.fullName || t.test) && (t.status || t.result?.status || t.state))
    );
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

        // Clean only that test file’s result subdirectory
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
                    // fallback: create one failed test result for every selected test
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

    // ---- SUMMARY: Count ALL test executions (do NOT dedupe by name) ----
    let totalTests = 0, passed = 0, failed = 0, skipped = 0, broken = 0;
    const resultsDir = 'test-report/results';
    // Only consider actual test results inside 'tests' folder, ignore orphaned files
    const resultFiles = glob.sync(path.join(resultsDir, 'tests/**/*.json'));
    const fileTestCounts = [];

    for (const file of resultFiles) {
        try {
            const result = JSON.parse(fs.readFileSync(file, 'utf-8'));
            const validTests = extractValidTests(result);
            if (validTests.length === 0) continue; // skip files with no real tests
            fileTestCounts.push({ file, count: validTests.length });
            totalTests += validTests.length;
            validTests.forEach(entry => {
                const status = (entry?.status || entry?.result?.status || entry?.state || '').toLowerCase();
                if (status === 'pass' || status === 'passed') passed++;
                else if (status === 'fail' || status === 'failed') failed++;
                else if (status === 'skipped' || status === 'pending') skipped++;
                else if (status === 'broken') broken++;
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
    broadcast(`Total Test Files:  ${Object.keys(fileToTests).length}\n`);
    broadcast(`Total Tests:       ${totalTests}\n`);
    broadcast(`✅ Passed:         ${passed}\n`);
    broadcast(`❌ Failed:         ${failed}\n`);
    broadcast(`⚠️ Skipped:        ${skipped}\n`);
    broadcast('--------------------------------------------------\n');

    // ---- AUTO GENERATE ADVANCED HTML REPORT (modern, colorful, interactive) ----
    try {
        // Only include test result files under test-report/results/tests/**/*.json
        const resultsFiles = glob.sync(path.join(resultsDir, 'tests/**/*.json'));
        let allTests = [];
        let uniqueTestKeys = new Set();
        let perFileTotals = {}; // file => { total, passed, failed, skipped, duration }
        let grandTotals = { executions: 0, unique: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };

        for (const file of resultsFiles) {
            try {
                const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
                const validTests = extractValidTests(data);
                if (validTests.length === 0) continue;
                if (!perFileTotals[file]) {
                    perFileTotals[file] = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
                }
                for (const t of validTests) {
                    let status = (t.status || t.result?.status || t.state || '').toLowerCase();
                    let name = t.title || t.name || t.fullName || t.test || '';
                    let error =
                        (t.failureMessages && Array.isArray(t.failureMessages) && t.failureMessages.join('\n')) ||
                        t.error ||
                        t.errors ||
                        '';
                    let duration = t.duration || t.time || 0;
                    let screenshot = t.screenshot || (t.attachments && Array.isArray(t.attachments)
                        ? (t.attachments.find(a => a.type === 'screenshot')?.path || t.attachments.find(a => a.name === 'screenshot')?.path)
                        : undefined);
                    let testFile = file.replace(/^test-report\/results\//, '');
                    uniqueTestKeys.add(`${testFile}|||${name}`);
                    allTests.push({
                        file: testFile,
                        name,
                        status,
                        duration,
                        error: typeof error === 'string' ? error : JSON.stringify(error),
                        screenshot
                    });
                    perFileTotals[file].total++;
                    perFileTotals[file].duration += duration || 0;
                    if (status === 'pass' || status === 'passed') perFileTotals[file].passed++;
                    else if (status === 'fail' || status === 'failed') perFileTotals[file].failed++;
                    else if (status === 'skipped' || status === 'pending') perFileTotals[file].skipped++;
                }
            } catch (e) {
                broadcast(`❌ Error reading: ${file}: ${e.message}\n`);
                continue;
            }
        }
        for (const stats of Object.values(perFileTotals)) {
            grandTotals.executions += stats.total;
            grandTotals.passed += stats.passed;
            grandTotals.failed += stats.failed;
            grandTotals.skipped += stats.skipped;
            grandTotals.duration += stats.duration;
        }
        grandTotals.unique = uniqueTestKeys.size;
        allTests = allTests.sort((a, b) => a.file.localeCompare(b.file));

        // Modern, colorful, interactive HTML report template with dark/light mode toggle
        const reportTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Automation Test Results Report</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f7fa;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 1200px;
      margin: 36px auto 36px auto;
      background: #fff;
      border-radius: 12px;
      padding: 2.2rem 2.5rem 2.5rem 2.5rem;
      box-shadow: 0 4px 32px #2a529820;
      position: relative;
    }
    #themeToggleBtn {
      position: absolute;
      top: 24px;
      right: 36px;
      font-size: 1.4em;
      padding: 6px 16px;
      border-radius: 7px;
      border: none;
      cursor: pointer;
      background: #e8eafc;
      color: #1e293b;
      transition: background 0.15s, color 0.15s;
      z-index: 10;
    }
    h1 {
      font-size: 2.4em;
      margin-bottom: 0.6em;
      letter-spacing: 0.01em;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.5em;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      flex-direction: row;
      justify-content: center;
      align-items: stretch;
      gap: 1em;
      margin-bottom: 2em;
    }
    .summary-card {
      background: #f5f6fa;
      border-radius: 8px;
      padding: 0.9em 1.4em;
      min-width: 120px;
      text-align: center;
      box-shadow: 0 2px 10px #8fd3f410;
      margin: 0.3em 0.2em;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .summary-card .summary-number {
      font-size: 2.1em;
      font-weight: 700;
      margin-bottom: 0.1em;
      display: block;
    }
    .summary-card .summary-label {
      font-size: 1em;
      color: #425466;
      margin-top: 0.3em;
      font-weight: 500;
      letter-spacing: 0.01em;
      display: block;
    }
    .passed { color: #22c55e; font-weight: 700; }
    .failed { color: #ef4444; font-weight: 700; }
    .skipped { color: #6c757d; font-weight: 700; }
    .table-wrap {
      margin-bottom: 2.5em;
      overflow-x: auto;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 1.2em;
      font-size: 1em;
      background: #fafbfc;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 0.7em 1em;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f2f6fc;
      font-weight: 700;
      color: #1e293b;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    tr:nth-child(even) {
      background: #f7fafc;
    }
    .error {
      font-family: monospace;
      color: #ef4444;
      white-space: pre-line;
      font-size: 0.97em;
      max-width: 400px;
      overflow-x: auto;
    }
    .filter-bar {
      display: flex;
      gap: 1.5em;
      margin-bottom: 1em;
      flex-wrap: wrap;
      align-items: center;
    }
    .filter-bar input[type="text"], .filter-bar select {
      padding: 0.5em 1em;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-size: 1em;
      background: #f9fafb;
    }
    .filter-bar label {
      font-weight: 500;
      color: #334155;
    }
    .status-dot {
      display: inline-block;
      width: 0.9em;
      height: 0.9em;
      border-radius: 50%;
      margin-right: 0.3em;
      vertical-align: middle;
    }
    .dot-passed { background: #22c55e; }
    .dot-failed { background: #ef4444; }
    .dot-skipped { background: #6c757d; }
    .screenshot-link {
      color: #3b82f6;
      text-decoration: underline;
      cursor: pointer;
      font-weight: 600;
      font-size: 1em;
      border: none;
      background: none;
      padding: 0 0.3em;
      transition: color 0.1s;
    }
    .screenshot-link:hover {
      color: #2563eb;
      text-decoration: underline;
    }
    .modal {
      display: none;
      position: fixed;
      z-index: 10000;
      left: 0;
      top: 0;
      width: 100vw;
      height: 100vh;
      overflow: auto;
      background: rgba(30, 41, 59, 0.49);
      justify-content: center;
      align-items: center;
      transition: background 0.2s;
    }
    .modal.active {
      display: flex;
    }
    .modal-content {
      background: #fff;
      padding: 1.5em 2em 1.5em 2em;
      border-radius: 12px;
      box-shadow: 0 6px 32px #2a529820;
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .modal-content img {
      max-width: 80vw;
      max-height: 70vh;
      border-radius: 8px;
      box-shadow: 0 2px 10px #8fd3f420;
      margin-bottom: 0.7em;
      background: #f3f6fa;
    }
    .modal-close {
      position: absolute;
      top: 0.7em;
      right: 1em;
      font-size: 1.6em;
      color: #425466;
      background: none;
      border: none;
      cursor: pointer;
      font-weight: bold;
      z-index: 1;
      transition: color 0.1s;
    }
    .modal-close:hover {
      color: #ef4444;
    }
    @media (max-width: 900px) {
      .container { padding: 1em 0.5em; }
      th, td { padding: 0.6em 0.3em; }
      .summary { gap: 0.4em; }
      .summary-card { min-width: 100px; padding: 0.7em 0.7em; }
      .modal-content img { max-width: 97vw; max-height: 50vh; }
      #themeToggleBtn { right: 10px; top: 10px; font-size: 1.1em; padding: 4px 10px; }
    }
    /* --- DARK MODE STYLES --- */
    body[data-theme="dark"] {
      background: #181a20;
      color: #e3e7f0;
    }
    body[data-theme="dark"] .container {
      background: #21242c;
      box-shadow: 0 4px 32px #01020350;
    }
    body[data-theme="dark"] h1,
    body[data-theme="dark"] h2 {
      color: #f8fafc;
    }
    body[data-theme="dark"] #themeToggleBtn {
      background: #2a2d3b;
      color: #f8fafc;
      border: 1px solid #35384a;
    }
    body[data-theme="dark"] .summary-card {
      background: #24293a;
      color: #e3e7f0;
      box-shadow: 0 2px 10px #01020360;
    }
    body[data-theme="dark"] .summary-card .summary-label {
      color: #a4acc7;
    }
    body[data-theme="dark"] .passed { color: #38e39e; }
    body[data-theme="dark"] .failed { color: #ff7070; }
    body[data-theme="dark"] .skipped { color: #a7adc2; }
    body[data-theme="dark"] .table-wrap {
      background: transparent;
    }
    body[data-theme="dark"] table,
    body[data-theme="dark"] th,
    body[data-theme="dark"] td {
      background: #232733 !important;
      color: #f8fafc;
      border-bottom: 1px solid #282c37;
    }
    body[data-theme="dark"] th {
      background: #23273a !important;
      color: #f8fafc;
    }
    body[data-theme="dark"] tr:nth-child(even) {
      background: #20232a !important;
    }
    body[data-theme="dark"] .error {
      color: #ff7070;
    }
    body[data-theme="dark"] .filter-bar label {
      color: #dbeafe;
    }
    body[data-theme="dark"] .filter-bar input[type="text"],
    body[data-theme="dark"] .filter-bar select {
      background: #232733;
      color: #f8fafc;
      border: 1px solid #35384a;
    }
    body[data-theme="dark"] .status-dot.dot-passed { background: #38e39e; }
    body[data-theme="dark"] .status-dot.dot-failed { background: #ff7070; }
    body[data-theme="dark"] .status-dot.dot-skipped { background: #a7adc2; }
    body[data-theme="dark"] .screenshot-link {
      color: #7dd3fc;
    }
    body[data-theme="dark"] .screenshot-link:hover {
      color: #38bdf8;
    }
    body[data-theme="dark"] .modal {
      background: rgba(15, 23, 42, 0.82);
    }
    body[data-theme="dark"] .modal-content {
      background: #292e39;
      color: #f8fafc;
    }
    body[data-theme="dark"] .modal-content img {
      background: #232733;
      box-shadow: 0 2px 10px #01020360;
    }
    body[data-theme="dark"] .modal-close {
      color: #f8fafc;
    }
    body[data-theme="dark"] .modal-close:hover {
      color: #ff7070;
    }
  </style>
</head>
<body>
  <div class="container">
    <button id="themeToggleBtn" title="Switch Theme" style="position:absolute; top:24px; right:36px; font-size:1.4em; padding:6px 16px; border-radius:7px; border:none; cursor:pointer; background:#e8eafc;">🌙 Dark</button>
    <h1>🧪 Automation Test Results Report</h1>
    <div class="summary" id="summary-cards"></div>
    <h2>Per-File Summary</h2>
    <div class="table-wrap">
      <table id="file-summary-table">
        <thead>
          <tr>
            <th>Test File</th>
            <th>Total</th>
            <th class="passed">Passed</th>
            <th class="failed">Failed</th>
            <th class="skipped">Skipped</th>
            <th>Duration (ms)</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
    <h2>Test Case Details</h2>
    <div class="filter-bar">
      <label>
        Status:
        <select id="filter-status">
          <option value="">All</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped</option>
        </select>
      </label>
      <label>
        File:
        <input type="text" id="filter-file" placeholder="Filter by file..." />
      </label>
      <label>
        Name:
        <input type="text" id="filter-name" placeholder="Filter by test name..." />
      </label>
    </div>
    <div class="table-wrap">
      <table id="test-details-table">
        <thead>
          <tr>
            <th>Test File</th>
            <th>Name</th>
            <th>Status</th>
            <th>Duration (ms)</th>
            <th>Error</th>
            <th>Screenshot</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
  <!-- Screenshot Modal -->
  <div id="screenshotModal" class="modal">
    <div class="modal-content">
      <button class="modal-close" id="screenshotModalClose" title="Close">&times;</button>
      <img id="screenshotModalImg" src="" alt="Screenshot" />
    </div>
  </div>
  <script>
    // --- DARK/LIGHT MODE TOGGLE LOGIC ---
    function setTheme(theme) {
      document.body.setAttribute("data-theme", theme);
      const btn = document.getElementById("themeToggleBtn");
      if (theme === "dark") {
        btn.innerHTML = "☀️ Light";
        btn.title = "Switch to Light Mode";
      } else {
        btn.innerHTML = "🌙 Dark";
        btn.title = "Switch to Dark Mode";
      }
      localStorage.setItem("testReportTheme", theme);
    }
    function toggleTheme() {
      const curr = document.body.getAttribute("data-theme") || "light";
      setTheme(curr === "light" ? "dark" : "light");
    }
    window.addEventListener("DOMContentLoaded", () => {
      let theme = localStorage.getItem("testReportTheme");
      if (!theme) {
        theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      setTheme(theme);
      document.getElementById("themeToggleBtn").onclick = toggleTheme;
    });

    // Inserted test data below (from Node)
    const allTests = __REPORT_DATA__;

    // Compute per-file stats and grand totals on client
    const perFileTotals = {};
    let grandTotals = {
      executions: 0, unique: 0, passed: 0, failed: 0, skipped: 0, duration: 0
    };
    const uniqueTestKeys = new Set();
    for (const t of allTests) {
      const file = t.file.replace(/^tests\\//, "");
      if (!perFileTotals[file]) {
        perFileTotals[file] = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
      }
      perFileTotals[file].total++;
      perFileTotals[file].duration += t.duration || 0;
      if (t.status === "pass" || t.status === "passed") {
        perFileTotals[file].passed++; grandTotals.passed++;
      } else if (t.status === "fail" || t.status === "failed") {
        perFileTotals[file].failed++; grandTotals.failed++;
      } else if (t.status === "skipped" || t.status === "pending") {
        perFileTotals[file].skipped++; grandTotals.skipped++;
      }
      grandTotals.executions++;
      uniqueTestKeys.add(file + "|||" + t.name);
    }
    grandTotals.unique = uniqueTestKeys.size;
    grandTotals.duration = Object.values(perFileTotals).reduce((a, s) => a + s.duration, 0);

    // Render summary cards (single flex row, summary label below number)
    document.getElementById("summary-cards").innerHTML = \`
      <div class="summary-card">
        <span class="summary-number">\${grandTotals.unique}</span>
        <span class="summary-label">Unique Tests</span>
      </div>
      <div class="summary-card">
        <span class="summary-number">\${grandTotals.executions}</span>
        <span class="summary-label">Test Executions</span>
      </div>
      <div class="summary-card">
        <span class="summary-number passed">\${grandTotals.passed}</span>
        <span class="summary-label">Passed</span>
      </div>
      <div class="summary-card">
        <span class="summary-number failed">\${grandTotals.failed}</span>
        <span class="summary-label">Failed</span>
      </div>
      <div class="summary-card">
        <span class="summary-number skipped">\${grandTotals.skipped}</span>
        <span class="summary-label">Skipped</span>
      </div>
      <div class="summary-card">
        <span class="summary-number">\${Object.keys(perFileTotals).length}</span>
        <span class="summary-label">Test Files</span>
      </div>
    \`;

    // Render per-file summary table
    const fileSummaryTbody = document.querySelector("#file-summary-table tbody");
    fileSummaryTbody.innerHTML = Object.entries(perFileTotals).map(([file, stats]) => \`
      <tr>
        <td>\${file}</td>
        <td>\${stats.total}</td>
        <td class="passed">\${stats.passed}</td>
        <td class="failed">\${stats.failed}</td>
        <td class="skipped">\${stats.skipped}</td>
        <td>\${stats.duration ? stats.duration.toFixed(2) : "-"}</td>
      </tr>
    \`).join("");

    // Filtering logic for test case details
    const statusMap = { "pass": "passed", "passed": "passed", "fail": "failed", "failed": "failed", "skipped": "skipped", "pending": "skipped" };
    function statusClass(s) {
      if (statusMap[s]) return statusMap[s];
      return "";
    }
    function statusDot(s) {
      if (statusMap[s] === "passed") return '<span class="status-dot dot-passed"></span>';
      if (statusMap[s] === "failed") return '<span class="status-dot dot-failed"></span>';
      if (statusMap[s] === "skipped") return '<span class="status-dot dot-skipped"></span>';
      return "";
    }
    function escapeHtml(str) {
      return (str + '').replace(/[&<>"']/g, function(m) {
        return ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        })[m];
      });
    }
    function renderTestDetails() {
      const filterStatus = document.getElementById("filter-status").value;
      const filterFile = document.getElementById("filter-file").value.trim().toLowerCase();
      const filterName = document.getElementById("filter-name").value.trim().toLowerCase();
      const tbody = document.querySelector("#test-details-table tbody");
      tbody.innerHTML = allTests
        .filter(t => {
          if (filterStatus && statusClass(t.status) !== filterStatus) return false;
          if (filterFile && !t.file.toLowerCase().includes(filterFile)) return false;
          if (filterName && !t.name.toLowerCase().includes(filterName)) return false;
          return true;
        })
        .map((t, idx) => {
          let screenshotCell = "";
          if (t.screenshot) {
            screenshotCell = \`<button class="screenshot-link" data-img="\${encodeURIComponent(t.screenshot)}" title="View Screenshot">View</button>\`;
          }
          return \`
          <tr>
            <td>\${t.file.replace(/^tests\\//, "")}</td>
            <td>\${escapeHtml(t.name)}</td>
            <td class="\${statusClass(t.status)}">\${statusDot(t.status)}\${t.status}</td>
            <td>\${t.duration ? t.duration.toFixed(2) : "-"}</td>
            <td class="error">\${t.error ? (t.error + "").split("\\n")[0] : ""}</td>
            <td>\${screenshotCell}</td>
          </tr>
          \`;
        }).join("");
      // Attach screenshot link handlers
      setTimeout(() => {
        const links = document.querySelectorAll(".screenshot-link");
        links.forEach(link => {
          link.onclick = function() {
            const imgPath = decodeURIComponent(this.getAttribute("data-img"));
            showScreenshotModal(imgPath);
          };
        });
      }, 0);
    }
    document.getElementById("filter-status").addEventListener("change", renderTestDetails);
    document.getElementById("filter-file").addEventListener("input", renderTestDetails);
    document.getElementById("filter-name").addEventListener("input", renderTestDetails);
    renderTestDetails();

    // Modal logic
    function showScreenshotModal(imgPath) {
      const modal = document.getElementById("screenshotModal");
      const img = document.getElementById("screenshotModalImg");
      img.src = imgPath;
      modal.classList.add("active");
    }
    function closeScreenshotModal() {
      const modal = document.getElementById("screenshotModal");
      const img = document.getElementById("screenshotModalImg");
      img.src = "";
      modal.classList.remove("active");
    }
    document.getElementById("screenshotModalClose").onclick = closeScreenshotModal;
    document.getElementById("screenshotModal").onclick = function(e) {
      if (e.target === this) closeScreenshotModal();
    };
    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape") closeScreenshotModal();
    });
  </script>
</body>
</html>
`;
        // Insert test data
        const html = reportTemplate.replace(
          "__REPORT_DATA__",
          JSON.stringify(allTests)
        );
        fs.writeFileSync('automationTestReport.html', html, 'utf-8');
        broadcast('✔️  Consolidated report generated: automationTestReport.html\n');
    } catch (e) {
        broadcast('❌ Failed to generate consolidated HTML report: ' + e.message + '\n');
    }
});

// Serve UI (unchanged)
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
