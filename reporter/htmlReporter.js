// reporter/htmlReporter.js
// reporter/htmlReporter.js
'use strict';
import fs from 'fs';
import path from 'path';

console.log("htmlReporter loaded and ready to record results");

if (!global.allTestResults) {
    global.allTestResults = new Map();
}

const allResults = global.allTestResults;

export function initializeReportDirectory() {
    const reportDir = 'test-report';
    const resultsDir = path.join(reportDir, 'results');
    const screenshotsDir = path.join(reportDir, 'screenshots');

    console.log(`Initializing report directory at: ${path.resolve(reportDir)}`);

    try {
        // Clear global results
        global.allTestResults = new Map();

        // Remove and recreate directory
        if (fs.existsSync(reportDir)) {
            fs.rmSync(reportDir, { recursive: true, force: true });
            console.log("Cleared existing test-report directory");
        }

        // Always recreate these directories even if root was just cleared
        fs.mkdirSync(path.join(reportDir, 'results'), { recursive: true });
        fs.mkdirSync(path.join(reportDir, 'screenshots'), { recursive: true });
        console.log("Created test-report, results, and screenshots directories");
    } catch (err) {
        console.error("Failed to initialize report directory:", err);
    }
}

export function addTestResult(result) {
    const dir = 'test-report/results';

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        // console.log(`📁 Created missing results directory at: ${dir}`);
    }

    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const filePath = path.join(dir, `${safeName}.json`);
    //
    // console.log(`💾 Writing test result to file: ${filePath}`);
    // console.log(`📄 Result content: ${JSON.stringify(result, null, 2)}`);

    fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf-8');

    const currentResults = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    console.log(`Total test result files now: ${currentResults.length}`);
}

export function writeReport() {
    const dir = 'test-report';
    const resultsDir = path.join(dir, 'results');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const aggregatedResults = new Map();

    // Read all JSON files from test-report/results and merge into aggregatedResults
    if (fs.existsSync(resultsDir)) {
        const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
        console.log(`Found ${files.length} result files in ${resultsDir}`);

        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(resultsDir, file), 'utf-8');
                const result = JSON.parse(content);
                // console.log(`📖 Reading file: ${file}, parsed result:`, result);
                const keyId = `${result.file}|${result.name}|${result.timestamp}`;
                if (aggregatedResults.has(keyId)) {
                    const existing = aggregatedResults.get(keyId);
                    if (new Date(existing.timestamp) > new Date(result.timestamp)) continue;
                }
                aggregatedResults.set(keyId, result);
            } catch (e) {
                console.error(`Failed to read or parse result file: ${file}`, e);
            }
        }
        // console.log("🔀 Merged all results:", JSON.stringify(Array.from(aggregatedResults.entries()), null, 2));
    }

    const groupedByFile = new Map();
    for (const [key, result] of aggregatedResults.entries()) {
        let fileName = 'unknown';
        if (result.file) {
            fileName = path.basename(result.file);
        } else if (result.suite) {
            fileName = result.suite;
        } else if (result.group) {
            fileName = result.group;
        } else if (result.name) {
            fileName = 'test-' + result.name.replace(/\s+/g, '-').toLowerCase();
        }
        if (!groupedByFile.has(fileName)) groupedByFile.set(fileName, []);
        groupedByFile.get(fileName).push(result);
    }

    const timestamp = new Date().toISOString();

    const flatResults = Array.from(groupedByFile.values()).flat();
    const total = flatResults.length;
    const passed = flatResults.filter(r => r.status === 'pass').length;
    const failed = flatResults.filter(r => r.status === 'fail').length;
    const broken = flatResults.filter(r => r.status === 'broken').length;
    const skipped = flatResults.filter(r => r.status === 'skipped').length;

    // Calculate pass rate and duration (if available)
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    // Find min and max timestamps for duration
    let started = null, finished = null;
    for (const r of flatResults) {
      if (r.timestamp) {
        const t = new Date(r.timestamp);
        if (!started || t < started) started = t;
        if (!finished || t > finished) finished = t;
      }
    }
    let duration = '-';
    if (started && finished) {
      const ms = finished - started;
      const s = Math.round(ms / 1000);
      duration = s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;
    }
    // Gather environment, browser, build, executor if available
    const env = flatResults.find(r => r.env) ? flatResults.find(r => r.env).env : '-';
    const browser = flatResults.find(r => r.browser) ? flatResults.find(r => r.browser).browser : '-';
    const build = flatResults.find(r => r.build) ? flatResults.find(r => r.build).build : '-';
    const executor = flatResults.find(r => r.executor) ? flatResults.find(r => r.executor).executor : '-';
    // Pie/bar chart data placeholder, for future rendering
    // Use a global serial counter for S.No across all test cases
    let serialCounter = 1;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Execution Report</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
      background: #f6f8fa;
      color: #22223b;
    }
    .header-animated {
      background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
      padding: 32px 0 20px 0;
      text-align: center;
      color: #fff;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
      animation: bgmove 3s infinite alternate;
    }
    @keyframes bgmove {
      0% { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
    }
    .header-animated h1 {
      margin: 0;
      font-size: 2.5em;
      font-weight: 700;
      letter-spacing: -1px;
      text-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .header-animated h2 {
      margin: 10px 0 0 0;
      font-size: 1.2em;
      font-weight: 400;
      opacity: 0.93;
      letter-spacing: 0.5px;
    }
    .header-animated .timestamp {
      margin-top: 8px;
      font-size: 1em;
      opacity: 0.9;
    }
    .summary-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      justify-content: center;
      margin: -32px auto 30px auto;
      max-width: 900px;
      z-index: 2;
      position: relative;
      padding: 0 20px;
    }
    .summary-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      padding: 14px 24px 14px 24px;
      min-width: 120px;
      flex: 1 0 100px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      border-bottom: 4px solid #e0e7ff;
      transition: box-shadow 0.18s;
      animation: cardfadein 0.7s;
    }
    @keyframes cardfadein {
      0% { opacity: 0; transform: translateY(18px);}
      100% { opacity: 1; transform: none;}
    }
    .summary-card.total { border-bottom-color: #6366f1; }
    .summary-card.passed { border-bottom-color: #22c55e; }
    .summary-card.failed { border-bottom-color: #f43f5e; }
    .summary-card.skipped { border-bottom-color: #f59e0b; }
    .summary-card .label {
      font-size: 1.02em;
      color: #4b5563;
      margin-bottom: 7px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .summary-card .value {
      font-size: 2.1em;
      font-weight: 700;
      color: #111827;
      letter-spacing: -1px;
      margin-bottom: 2px;
      animation: popin 0.5s;
    }
    @keyframes popin {
      0% { transform: scale(1.3); opacity: 0;}
      100% { transform: scale(1); opacity: 1;}
    }
    .compact-table-section {
      max-width: 1080px;
      margin: 0 auto 40px auto;
      padding: 0 20px;
      margin-top: 20px;
    }
    .compact-table-section h2 {
      font-size: 1.5em;
      color: #1e293b;
      font-weight: 700;
      margin: 12px 0 10px 0;
    }
    table.testcases-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0 7px;
      font-size: 1em;
      background: none;
    }
    table.testcases-table th {
      background: #e0e7ff;
      color: #3730a3;
      font-weight: 700;
      padding: 9px 6px;
      border-radius: 6px 6px 0 0;
      text-align: left;
      letter-spacing: 0.2px;
    }
    table.testcases-table th:nth-child(1) { width: 50px; }
    table.testcases-table th:nth-child(3) { width: 120px; }
    table.testcases-table th:nth-child(4),
    table.testcases-table th:nth-child(5),
    table.testcases-table th:nth-child(6) { width: 130px; }
    table.testcases-table td {
      background: #fff;
      padding: 8px 7px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
      border-radius: 0 0 7px 7px;
      transition: background 0.2s;
    }
    table.testcases-table tr:hover td {
      background: #f1f5fd;
    }
    .status-dot {
      display: inline-block;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      margin-right: 7px;
      vertical-align: middle;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
      animation: popin 0.5s;
    }
    .status-dot.passed { background: #22c55e; }
    .status-dot.failed { background: #f43f5e; }
    .status-dot.skipped { background: #f59e0b; }
    .status-dot.broken { background: #f97316; }
    .expand-btn {
      background: none;
      border: none;
      color: #6366f1;
      font-size: 1em;
      cursor: pointer;
      padding: 0 6px;
      vertical-align: middle;
      transition: color 0.14s;
    }
    .expand-btn:hover {
      color: #2563eb;
      text-decoration: underline;
    }
    .details-row {
      display: none;
      background: #f4f6fa;
      border-radius: 0 0 7px 7px;
      box-shadow: 0 0.5px 2px rgba(36,37,60,0.06);
    }
    .details-cell {
      padding: 13px 18px 13px 32px;
      font-size: 0.97em;
      color: #23234c;
      font-family: 'JetBrains Mono', 'Fira Mono', 'monospace', monospace;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .details-cell img {
      margin-top: 8px;
      max-width: 320px;
      border-radius: 6px;
      box-shadow: 0 1px 4px rgba(60,60,100,0.09);
      display: block;
      cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .details-cell img:hover {
      box-shadow: 0 4px 24px #6a11cb88;
    }
  </style>
  <script>
    function toggleDetails(rowId) {
      var row = document.getElementById(rowId);
      if (!row) return;
      if (row.style.display === 'table-row') {
        row.style.display = 'none';
      } else {
        row.style.display = 'table-row';
      }
    }
  </script>
</head>
<body>
  <div class="header-animated">
    <h1>Test Execution Report</h1>
    <h2>Super Pan Cake Report</h2>
    <div class="timestamp"><small>Generated: ${new Date(timestamp).toLocaleString()}</small></div>
  </div>
  <div class="summary-cards">
    <div class="summary-card total">
      <div class="label">Total</div>
      <div class="value">${total}</div>
    </div>
    <div class="summary-card passed">
      <div class="label">Passed</div>
      <div class="value">${passed}</div>
    </div>
    <div class="summary-card failed">
      <div class="label">Failed</div>
      <div class="value">${failed}</div>
    </div>
    <div class="summary-card skipped">
      <div class="label">Skipped</div>
      <div class="value">${skipped}</div>
    </div>
  </div>
  <div class="compact-table-section">
    <h2>Test Cases</h2>
    ${Array.from(groupedByFile.entries()).map(([file, tests], groupIdx) => `
      <div style="margin-bottom:24px;">
        <div style="font-size:1.07em;font-weight:600;color:#6366f1;letter-spacing:0.3px;margin-bottom:3px;">${file}</div>
        <table class="testcases-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Test Name</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Timestamp</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${tests.map((r, i) => {
              const rowId = 'details_row_' + groupIdx + '_' + i;
              const hasDetails = r.error || r.screenshot;
              return `
              <tr>
                <td>${serialCounter++}</td>
                <td>${r.name || 'Unnamed'}</td>
                <td>
                  <span class="status-dot ${r.status}"></span>
                  <span style="font-weight:600;text-transform:uppercase;">${r.status || ''}</span>
                </td>
                <td>${r.duration ? r.duration : '-'}</td>
                <td>${r.timestamp ? new Date(r.timestamp).toLocaleString() : '-'}</td>
                <td>
                  ${hasDetails ? `<button class="expand-btn" onclick="toggleDetails('${rowId}')">Show</button>` : ''}
                </td>
              </tr>
              <tr id="${rowId}" class="details-row">
                <td colspan="6" class="details-cell">
                  ${r.error ? `<div><strong>Error:</strong><br>${r.error}</div>` : ''}
                  ${r.screenshot ? `<div><img src="screenshots/${path.basename(r.screenshot)}" alt="Screenshot" title="Click to view full image" onclick="openImageModal(this.src)"></div>` : ''}
                </td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `).join('')}
  </div>
  <div id="imageModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);justify-content:center;align-items:center;z-index:9999;">
    <div style="position:relative;max-width:90%;max-height:90%;">
      <button onclick="closeImageModal()" style="position:absolute;top:10px;right:10px;background:#fff;border:none;font-size:1.2em;padding:4px 10px;cursor:pointer;">✖</button>
      <img id="modalImage" src="" style="max-width:100%;max-height:100%;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.4);">
    </div>
  </div>
  <script>
    function openImageModal(src) {
      const modal = document.getElementById('imageModal');
      const modalImg = document.getElementById('modalImage');
      modalImg.src = src;
      modal.style.display = 'flex';
    }
    function closeImageModal() {
      const modal = document.getElementById('imageModal');
      modal.style.display = 'none';
    }
  </script>
</body>
</html>
`;

    console.log("Generated HTML report content");

    // console.log("📝 Writing report with the following test results:");
    // console.log(JSON.stringify(Array.from(groupedByFile.entries()), null, 2));
    try {
      fs.writeFileSync(path.join(dir, 'report.html'), html, 'utf-8');
    } catch (e) {
      console.error("Failed to write HTML report:", e);
    }
}


export function clearPreviousResults(currentFileName = '') {
  const dirPath = 'test-report/results';
  if (fs.existsSync(dirPath)) {
    try {
      const walkAndDelete = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walkAndDelete(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.json')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            try {
              const json = JSON.parse(content);
              if (!currentFileName || json.file === currentFileName) {
                fs.unlinkSync(fullPath);
              }
            } catch (e) {
              console.warn(`Skipping invalid JSON result: ${fullPath}`);
            }
          }
        }
      };

      walkAndDelete(dirPath);

      console.log(`Cleared old result files ${currentFileName ? `for ${currentFileName}` : `in ${dirPath}`}`);
    } catch (e) {
      console.error("Error clearing previous results:", e);
    }
  }
}