// reporter/htmlReporter.js
import fs from 'fs';
import path from 'path';

const results = [];

export function addTestResult(result) {
    results.push({
        name: result.name,
        status: result.status,
        error: result.error || '',
        screenshot: result.screenshot || ''
    });
}

export function writeReport() {
    const dir = 'test-report';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const timestamp = new Date().toISOString();
    const total = results.length;
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const broken = results.filter(r => r.status === 'broken').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    const html = `
<html>
  <head>
    <title>Test Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; }
      h1 { color: #333; }
      .meta { font-size: 0.95em; color: #333; margin-bottom: 20px; }
      .summary-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .summary-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding: 10px;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      }
      .summary-bar div {
        font-weight: bold;
        padding: 4px 10px;
        border-radius: 4px;
      }
      .summary-bar .pass { background: #d4edda; color: #155724; }
      .summary-bar .fail { background: #f8d7da; color: #721c24; }
      .summary-bar .broken { background: #fff3cd; color: #856404; }
      .summary-bar .skipped { background: #e2e3e5; color: #6c757d; }
      details { border: 1px solid #ccc; border-radius: 5px; padding: 10px; margin-bottom: 10px; background: #fff; }
      summary { font-weight: bold; cursor: pointer; }
      .pass { color: green; }
      .fail { color: red; }
      .broken { color: orange; }
      .skipped { color: gray; }
      .error-stack { color: #b30000; white-space: pre-wrap; font-family: monospace; }
      .screenshot { margin-top: 8px; max-width: 100%; border: 1px solid #ccc; border-radius: 4px; }
    </style>
  </head>
  <body>
    <h1>Test Report</h1>
    <div class="summary-row">
      <div class="summary-bar">
        <div>Total: <span>${total}</span></div>
        <div class="pass">Passed: <span>${passed}</span></div>
        <div class="fail">Failed: <span>${failed}</span></div>
        <div class="broken">Broken: <span>${broken}</span></div>
        <div class="skipped">Skipped: <span>${skipped}</span></div>
      </div>
    </div>
    <div class="meta">
      <p><strong>Generated:</strong> ${timestamp}</p>
    </div>
    ${results.map((r, index) => `
      <details>
        <summary>${index + 1}. <span class="${r.status}">${r.status.toUpperCase()}</span>: ${r.name.replace(/\s+/g, '')}</summary>
        <p><strong>Test Name:</strong> ${r.name}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        ${r.error ? `<div class="error-stack">${r.error}</div>` : ''}
        ${r.screenshot ? `<img class="screenshot" src="${r.screenshot}" alt="Screenshot" />` : ''}
      </details>
    `).join('')}
  </body>
</html>
`;

    fs.writeFileSync(path.join(dir, 'report.html'), html, 'utf-8');
}