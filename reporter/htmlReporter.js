// reporter/htmlReporter.js
import fs from 'fs';
import path from 'path';

console.log("📦 htmlReporter loaded and ready to record results");

if (!global.allTestResults) {
    global.allTestResults = new Map();
}

const allResults = global.allTestResults;

export function initializeReportDirectory() {
    const reportDir = 'test-report';
    const resultsDir = path.join(reportDir, 'results');
    const screenshotsDir = path.join(reportDir, 'screenshots');

    console.log(`🗂 Initializing report directory at: ${path.resolve(reportDir)}`);

    try {
        // Clear global results
        global.allTestResults = new Map();

        // Remove and recreate directory
        if (fs.existsSync(reportDir)) {
            fs.rmSync(reportDir, { recursive: true, force: true });
            console.log("🧹 Cleared existing test-report directory");
        }

        // Always recreate these directories even if root was just cleared
        fs.mkdirSync(path.join(reportDir, 'results'), { recursive: true });
        fs.mkdirSync(path.join(reportDir, 'screenshots'), { recursive: true });
        console.log("📁 Created test-report, results, and screenshots directories");
    } catch (err) {
        console.error("❌ Failed to initialize report directory:", err);
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
    console.log(`🧮 Total test result files now: ${currentResults.length}`);
}

export function writeReport() {
    const dir = 'test-report';
    const resultsDir = path.join(dir, 'results');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const aggregatedResults = new Map();

    // Read all JSON files from test-report/results and merge into aggregatedResults
    if (fs.existsSync(resultsDir)) {
        const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
        console.log(`📂 Found ${files.length} result files in ${resultsDir}`);

        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(resultsDir, file), 'utf-8');
                const result = JSON.parse(content);
                // console.log(`📖 Reading file: ${file}, parsed result:`, result);
                const keyId = `${result.file}|${result.name}`;
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
        const fileName = (result.file || 'unknown').split('/').pop();
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

    const html = `
  <html>
    <head>
      <title>Test Report</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f8; margin: 0; padding: 20px; }
        h1 { color: #2c3e50; margin-bottom: 0; }
        .meta { font-size: 0.95em; color: #555; margin-top: 4px; margin-bottom: 16px; }
        .container { display: flex; gap: 30px; }
        .left-panel { flex: 2; }
        .right-panel { flex: 1; text-align: center; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .summary-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          background: #fff;
          padding: 12px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-bottom: 20px;
        }
        .summary-bar div {
          font-weight: bold;
          font-size: 1em;
          padding: 6px 10px;
          border-radius: 6px;
        }
        .pass { background: #d4edda; color: #155724; }
        .fail { background: #f8d7da; color: #721c24; }
        .broken { background: #fff3cd; color: #856404; }
        .skipped { background: #e2e3e5; color: #6c757d; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
          border-radius: 6px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        th, td {
          border: 1px solid #ddd;
          padding: 10px 12px;
          text-align: left;
          font-size: 14px;
        }
        th {
          background-color: #f1f1f1;
          font-weight: bold;
        }
        tr:hover {
          background-color: #f9f9f9;
        }
        .status {
          padding: 4px 10px;
          font-weight: bold;
          border-radius: 4px;
          display: inline-block;
          font-size: 0.9em;
        }
        .screenshot { max-width: 100%; border-radius: 4px; margin-top: 6px; }
        .error-stack { font-family: monospace; white-space: pre-wrap; color: #c00; font-size: 0.85em; }
        details summary { font-weight: bold; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="left-panel">
          <h1>Test Report</h1>
          <div class="meta"><strong>Generated:</strong> ${timestamp}</div>
          
          ${Array.from(groupedByFile.entries()).map(([file, tests]) => `
            <details open>
              <summary><h2>${file}</h2></summary>
              <table>
                <thead>
                  <tr><th>#</th><th>Status</th><th>Test Name</th><th>Timestamp</th></tr>
                </thead>
                <tbody>
                  ${tests.map((r, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      <td><span class="status ${r.status}">${r.status.toUpperCase()}</span></td>
                      <td>${r.name}</td>
                      <td>${r.timestamp}</td>
                    </tr>
                    ${r.error ? `<tr><td colspan="4"><details><summary>View Error</summary><div class="error-stack">${r.error}</div></details></td></tr>` : ''}
                    ${r.screenshot ? `<tr><td colspan="4"><details><summary>View Screenshot</summary><img src="${r.screenshot}" class="screenshot"/></details></td></tr>` : ''}
                  `).join('')}
                </tbody>
              </table>
            </details>
          `).join('')}
        </div>
      </div>
    </body>
  </html>
  `;
    console.log("✅ Generated HTML report content");

    // console.log("📝 Writing report with the following test results:");
    // console.log(JSON.stringify(Array.from(groupedByFile.entries()), null, 2));
    fs.writeFileSync(path.join(dir, 'report.html'), html, 'utf-8');
}