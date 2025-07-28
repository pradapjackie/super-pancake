// Enhanced HTML Reporter with Modern UI
import fs from 'fs';
import path from 'path';

console.log('🎨 Modern HTML Reporter (Integrated) loaded');

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
      console.log('Cleared existing test-report directory');
    }

    // Always recreate these directories even if root was just cleared
    fs.mkdirSync(path.join(reportDir, 'results'), { recursive: true });
    fs.mkdirSync(path.join(reportDir, 'screenshots'), { recursive: true });
    console.log('Created test-report, results, and screenshots directories');
  } catch (err) {
    console.error('Failed to initialize report directory:', err);
  }
}

export function addTestResult(result) {
  const dir = 'test-report/results';

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Enhance result with additional details
  const enhancedResult = {
    ...result,
    id: result.id || generateTestId(),
    timestamp: result.timestamp || new Date().toISOString(),
    duration: result.duration || 0,
    browser: result.browser || 'Chrome',
    environment: result.environment || 'Local',
    tags: result.tags || [],
    screenshots: result.screenshots || [],
    logs: result.logs || [],
    metadata: {
      framework: 'Super Pancake Automation',
      version: '2.8.0',
      nodeVersion: process.version,
      platform: process.platform,
      ...result.metadata
    }
  };

  // Store in global results map
  if (!global.allTestResults) {
    global.allTestResults = new Map();
  }
  global.allTestResults.set(enhancedResult.id, enhancedResult);

  // Save individual result file
  const filename = `${enhancedResult.testName?.replace(/[^a-zA-Z0-9]/g, '_') || 'test'}_${enhancedResult.id}.json`;
  const filepath = path.join(dir, filename);
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(enhancedResult, null, 2));
    console.log(`📊 Saved test result: ${filename}`);
  } catch (err) {
    console.error('❌ Failed to save test result:', err);
  }

  return enhancedResult.id;
}

export function writeReport() {
  const reportPath = 'automationTestReport.html';
  
  try {
    // Collect all results
    const resultFiles = collectResultFiles();
    const testSummary = generateTestSummary(resultFiles);
    const htmlContent = generateModernHTML(testSummary, resultFiles);
    
    // Write the report
    fs.writeFileSync(reportPath, htmlContent);
    console.log(`🎉 Modern test report generated: ${reportPath}`);
    
    return reportPath;
  } catch (err) {
    console.error('❌ Failed to generate modern report:', err);
    throw err;
  }
}

function generateTestId() {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function collectResultFiles() {
  const resultsDir = 'test-report/results';
  
  if (!fs.existsSync(resultsDir)) {
    return [];
  }

  const files = fs.readdirSync(resultsDir, { withFileTypes: true });
  const results = [];

  files.forEach(file => {
    if (file.isFile() && file.name.endsWith('.json')) {
      try {
        const content = fs.readFileSync(path.join(resultsDir, file.name), 'utf8');
        const result = JSON.parse(content);
        results.push(result);
      } catch (err) {
        console.warn(`⚠️ Skipped invalid result file: ${file.name}`);
      }
    }
  });

  return results.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
}

function generateTestSummary(results) {
  const summary = {
    total: results.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    totalDuration: 0,
    startTime: null,
    endTime: null,
    browsers: new Set(),
    environments: new Set(),
    tags: new Set()
  };

  results.forEach(result => {
    // Count status
    switch (getTestStatus(result).toLowerCase()) {
      case 'passed':
        summary.passed++;
        break;
      case 'failed':
        summary.failed++;
        break;
      case 'skipped':
        summary.skipped++;
        break;
    }

    // Collect metadata
    summary.totalDuration += result.duration || 0;
    summary.browsers.add(result.browser || 'Chrome');
    summary.environments.add(result.environment || 'Local');
    
    if (result.tags) {
      result.tags.forEach(tag => summary.tags.add(tag));
    }

    // Track time range
    const timestamp = new Date(result.timestamp || Date.now());
    if (!summary.startTime || timestamp < summary.startTime) {
      summary.startTime = timestamp;
    }
    if (!summary.endTime || timestamp > summary.endTime) {
      summary.endTime = timestamp;
    }
  });

  return {
    ...summary,
    browsers: Array.from(summary.browsers),
    environments: Array.from(summary.environments),
    tags: Array.from(summary.tags),
    successRate: summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0
  };
}

function getTestStatus(result) {
  if (!result.status) return 'unknown';
  const status = result.status.toLowerCase();
  if (['passed', 'pass', 'success'].includes(status)) return 'passed';
  if (['failed', 'fail', 'error'].includes(status)) return 'failed';
  if (['skipped', 'skip'].includes(status)) return 'skipped';
  return 'unknown';
}

function generateModernHTML(summary, results) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🥞 Super Pancake Test Report</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary: #6366f1; --success: #10b981; --danger: #ef4444; --warning: #f59e0b;
            --light: #f8fafc; --dark: #1e293b; --border: #e2e8f0;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); --radius: 12px;
        }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; color: var(--dark);
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .header {
            background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 3rem 0; color: white; text-align: center;
        }
        .logo { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem; }
        .logo i { font-size: 3rem; color: #fbbf24; }
        .header h1 { font-size: 3rem; font-weight: 800; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .subtitle { font-size: 1.25rem; opacity: 0.9; margin-bottom: 2rem; }
        .header-meta { display: flex; justify-content: center; gap: 2rem; font-size: 0.9rem; opacity: 0.8; }
        .header-meta span { display: flex; align-items: center; gap: 0.5rem; }
        
        .dashboard {
            background: white; margin: -2rem 0 2rem; border-radius: var(--radius);
            box-shadow: var(--shadow); position: relative; z-index: 2;
        }
        .summary-grid {
            display: flex; justify-content: space-between;
            gap: 1rem; padding: 2rem; flex-wrap: nowrap;
        }
        .summary-card {
            flex: 1; min-width: 160px;
            display: flex; align-items: center; gap: 1rem; padding: 1.5rem;
            border-radius: var(--radius); background: var(--light);
            border: 2px solid transparent; transition: all 0.3s ease;
        }
        .summary-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
        .summary-card.total { border-color: var(--primary); }
        .summary-card.passed { border-color: var(--success); }
        .summary-card.failed { border-color: var(--danger); }
        .summary-card.skipped { border-color: var(--warning); }
        .summary-card.success-rate { border-color: var(--primary); }
        .summary-card.duration { border-color: #ec4899; }
        
        .card-icon {
            font-size: 2rem; width: 60px; height: 60px; display: flex;
            align-items: center; justify-content: center; border-radius: 50%;
            background: white; box-shadow: var(--shadow);
        }
        .total .card-icon { color: var(--primary); }
        .passed .card-icon { color: var(--success); }
        .failed .card-icon { color: var(--danger); }
        .skipped .card-icon { color: var(--warning); }
        .success-rate .card-icon { color: var(--primary); }
        .duration .card-icon { color: #ec4899; }
        
        .card-content h3 { font-size: 2rem; font-weight: 700; margin-bottom: 0.25rem; }
        .card-content p { color: #64748b; font-size: 0.875rem; font-weight: 500; }
        
        .progress-container { padding: 0 2rem 2rem; }
        .progress-bar {
            height: 12px; background: #f1f5f9; border-radius: 6px;
            overflow: hidden; display: flex; margin-bottom: 1rem;
        }
        .progress-segment { height: 100%; transition: all 0.3s ease; }
        .progress-segment.passed { background: var(--success); }
        .progress-segment.failed { background: var(--danger); }
        .progress-segment.skipped { background: var(--warning); }
        
        .progress-labels {
            display: flex; justify-content: center; gap: 2rem; font-size: 0.875rem;
        }
        .label { display: flex; align-items: center; gap: 0.5rem; font-weight: 500; }
        .label::before { content: ''; width: 12px; height: 12px; border-radius: 50%; }
        .label.passed::before { background: var(--success); }
        .label.failed::before { background: var(--danger); }
        .label.skipped::before { background: var(--warning); }
        
        .results { margin-bottom: 3rem; }
        .results-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 1.5rem;
        }
        .test-card {
            background: white; border-radius: var(--radius); box-shadow: var(--shadow);
            overflow: hidden; transition: all 0.3s ease; cursor: pointer;
            border-left: 4px solid transparent;
        }
        .test-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .test-card.passed { border-left-color: var(--success); }
        .test-card.failed { border-left-color: var(--danger); }
        .test-card.skipped { border-left-color: var(--warning); }
        
        .test-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 1.5rem; border-bottom: 1px solid var(--border);
        }
        .test-info h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem; }
        .test-meta {
            font-size: 0.875rem; color: #64748b; display: flex;
            align-items: center; gap: 1rem;
        }
        .test-status {
            display: flex; align-items: center; gap: 0.5rem; font-weight: 600;
            font-size: 0.875rem; padding: 0.25rem 0.75rem; border-radius: 20px;
        }
        .test-status.passed { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .test-status.failed { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
        .test-status.skipped { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        
        .test-details { padding: 1.5rem; }
        .test-description {
            color: #64748b; font-size: 0.875rem; line-height: 1.6; margin-bottom: 1rem;
        }
        .test-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
        .tag {
            padding: 0.25rem 0.5rem; background: var(--light); border-radius: 4px;
            font-size: 0.75rem; color: #64748b; font-weight: 500;
        }
        .test-metrics {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 1rem; font-size: 0.875rem;
        }
        .metric { text-align: center; }
        .metric-value { font-weight: 600; color: var(--dark); }
        .metric-label {
            color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;
        }
        
        .footer {
            background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: white; padding: 2rem 0;
        }
        .footer-content {
            display: flex; align-items: center; justify-content: space-between;
            flex-wrap: wrap; gap: 1rem;
        }
        .footer-info p { margin-bottom: 0.25rem; opacity: 0.8; }
        .footer-links { display: flex; gap: 1rem; }
        .footer-links a {
            color: white; text-decoration: none; display: flex;
            align-items: center; gap: 0.5rem; opacity: 0.8; transition: all 0.3s ease;
        }
        .footer-links a:hover { opacity: 1; transform: translateY(-2px); }
        
        .loading {
            display: flex; align-items: center; justify-content: center;
            padding: 3rem; color: #64748b;
        }
        .spinner {
            width: 40px; height: 40px; border: 4px solid var(--border);
            border-top: 4px solid var(--primary); border-radius: 50%;
            animation: spin 1s linear infinite; margin-right: 1rem;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .test-card { animation: slideIn 0.3s ease-out; }
        
        .filter-btn {
            padding: 0.5rem 1rem; border: 2px solid var(--border); background: white;
            border-radius: var(--radius); font-size: 0.875rem; font-weight: 500;
            cursor: pointer; transition: all 0.3s ease;
        }
        .filter-btn:hover { border-color: var(--primary); color: var(--primary); }
        .filter-btn.active { background: var(--primary); border-color: var(--primary); color: white; }
        
        @media (max-width: 768px) {
            .container { padding: 0 1rem; }
            .header h1 { font-size: 2rem; }
            .summary-grid { flex-wrap: wrap; }
            .summary-card { min-width: 120px; }
            .results-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="app">
        <header class="header">
            <div class="container">
                <div class="header-content">
                    <div class="logo">
                        <i class="fas fa-layer-group"></i>
                        <h1>Super Pancake Test Report</h1>
                    </div>
                    <p class="subtitle">Comprehensive Test Automation Results</p>
                    <div class="header-meta">
                        <span class="timestamp">
                            <i class="far fa-clock"></i>
                            Generated: ${new Date().toLocaleString()}
                        </span>
                        <span class="version">
                            <i class="fas fa-code-branch"></i>
                            v2.8.0
                        </span>
                    </div>
                </div>
            </div>
        </header>

        <section class="dashboard">
            <div class="container">
                <div class="summary-grid">
                    <div class="summary-card total">
                        <div class="card-icon"><i class="fas fa-vial"></i></div>
                        <div class="card-content">
                            <h3>${summary.total}</h3>
                            <p>Total Tests</p>
                        </div>
                    </div>
                    <div class="summary-card passed">
                        <div class="card-icon"><i class="fas fa-check-circle"></i></div>
                        <div class="card-content">
                            <h3>${summary.passed}</h3>
                            <p>Passed</p>
                        </div>
                    </div>
                    <div class="summary-card failed">
                        <div class="card-icon"><i class="fas fa-times-circle"></i></div>
                        <div class="card-content">
                            <h3>${summary.failed}</h3>
                            <p>Failed</p>
                        </div>
                    </div>
                    <div class="summary-card skipped">
                        <div class="card-icon"><i class="fas fa-minus-circle"></i></div>
                        <div class="card-content">
                            <h3>${summary.skipped}</h3>
                            <p>Skipped</p>
                        </div>
                    </div>
                    <div class="summary-card success-rate">
                        <div class="card-icon"><i class="fas fa-percentage"></i></div>
                        <div class="card-content">
                            <h3>${summary.successRate}%</h3>
                            <p>Success Rate</p>
                        </div>
                    </div>
                    <div class="summary-card duration">
                        <div class="card-icon"><i class="fas fa-stopwatch"></i></div>
                        <div class="card-content">
                            <h3>${formatDuration(summary.totalDuration)}</h3>
                            <p>Total Duration</p>
                        </div>
                    </div>
                </div>

                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-segment passed" style="width: ${(summary.passed / summary.total * 100) || 0}%"></div>
                        <div class="progress-segment failed" style="width: ${(summary.failed / summary.total * 100) || 0}%"></div>
                        <div class="progress-segment skipped" style="width: ${(summary.skipped / summary.total * 100) || 0}%"></div>
                    </div>
                    <div class="progress-labels">
                        <span class="label passed">${summary.passed} Passed</span>
                        <span class="label failed">${summary.failed} Failed</span>
                        <span class="label skipped">${summary.skipped} Skipped</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Filters and Controls -->
        <section class="controls" style="background: white; border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom: 2rem;">
            <div class="container">
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.5rem 2rem; gap: 1rem; flex-wrap: wrap;">
                    <div style="position: relative; flex: 1; max-width: 300px;">
                        <i class="fas fa-search" style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                        <input type="text" id="searchTests" placeholder="Search tests..." 
                               style="width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem; border: 2px solid var(--border); border-radius: var(--radius); font-size: 0.875rem; transition: all 0.3s ease;"
                               onkeyup="filterTests()">
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="filter-btn active" data-filter="all" onclick="setFilter('all')">All Tests</button>
                        <button class="filter-btn" data-filter="passed" onclick="setFilter('passed')">Passed</button>
                        <button class="filter-btn" data-filter="failed" onclick="setFilter('failed')">Failed</button>
                        <button class="filter-btn" data-filter="skipped" onclick="setFilter('skipped')">Skipped</button>
                    </div>
                </div>
            </div>
        </section>

        <section class="results">
            <div class="container">
                <div class="results-grid" id="resultsContainer">
                    ${generateTestCards(results)}
                </div>
            </div>
        </section>

        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-info">
                        <p>Generated by <strong>Super Pancake Automation Framework</strong></p>
                        <p>Node.js ${process.version} • ${process.platform}</p>
                    </div>
                    <div class="footer-links">
                        <a href="https://github.com/pradapjackie/super-pancake" target="_blank">
                            <i class="fab fa-github"></i> GitHub
                        </a>
                        <a href="https://www.npmjs.com/package/super-pancake-automation" target="_blank">
                            <i class="fab fa-npm"></i> NPM
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    </div>

    <script>
        let allTests = ${JSON.stringify(results)};
        let currentFilter = 'all';

        function setFilter(filter) {
            currentFilter = filter;
            
            // Update active button
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.filter === filter) {
                    btn.classList.add('active');
                }
            });
            
            filterTests();
        }

        function filterTests() {
            const searchTerm = document.getElementById('searchTests').value.toLowerCase();
            let filteredTests = allTests;

            // Filter by status
            if (currentFilter !== 'all') {
                filteredTests = filteredTests.filter(test => {
                    const status = getTestStatus(test);
                    return status === currentFilter;
                });
            }

            // Filter by search term
            if (searchTerm) {
                filteredTests = filteredTests.filter(test => {
                    return (test.testName || '').toLowerCase().includes(searchTerm) ||
                           (test.description || '').toLowerCase().includes(searchTerm) ||
                           (test.tags || []).some(tag => tag.toLowerCase().includes(searchTerm));
                });
            }

            renderTests(filteredTests);
        }

        function renderTests(tests) {
            const container = document.getElementById('resultsContainer');
            if (tests.length === 0) {
                container.innerHTML = '<div class="loading">No tests match your criteria</div>';
                return;
            }
            container.innerHTML = tests.map(test => generateTestCard(test)).join('');
        }

        function generateTestCard(test) {
            const status = getTestStatus(test);
            const duration = formatDuration(test.duration || 0);
            const timestamp = new Date(test.timestamp || Date.now()).toLocaleString();
            
            return \`
                <div class="test-card \${status}">
                    <div class="test-header">
                        <div class="test-info">
                            <h3>\${escapeHtml(test.testName || 'Unnamed Test')}</h3>
                            <div class="test-meta">
                                <span><i class="far fa-clock"></i> \${duration}</span>
                                <span><i class="fas fa-calendar"></i> \${timestamp}</span>
                                <span><i class="fas fa-desktop"></i> \${test.browser || 'Chrome'}</span>
                            </div>
                        </div>
                        <div class="test-status \${status}">
                            <i class="fas fa-\${getStatusIcon(status)}"></i>
                            \${status.charAt(0).toUpperCase() + status.slice(1)}
                        </div>
                    </div>
                    <div class="test-details">
                        <div class="test-description">
                            \${escapeHtml(test.description || 'No description available')}
                        </div>
                        \${test.tags && test.tags.length > 0 ? \`
                            <div class="test-tags">
                                \${test.tags.map(tag => \`<span class="tag">\${escapeHtml(tag)}</span>\`).join('')}
                            </div>
                        \` : ''}
                        <div class="test-metrics">
                            <div class="metric">
                                <div class="metric-value">\${duration}</div>
                                <div class="metric-label">Duration</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">\${test.environment || 'Local'}</div>
                                <div class="metric-label">Environment</div>
                            </div>
                            <div class="metric">
                                <div class="metric-value">\${(test.screenshots || []).length}</div>
                                <div class="metric-label">Screenshots</div>
                            </div>
                        </div>
                    </div>
                </div>
            \`;
        }

        function getTestStatus(test) {
            if (!test.status) return 'unknown';
            const status = test.status.toLowerCase();
            if (['passed', 'pass', 'success'].includes(status)) return 'passed';
            if (['failed', 'fail', 'error'].includes(status)) return 'failed';
            if (['skipped', 'skip'].includes(status)) return 'skipped';
            return 'unknown';
        }

        function getStatusIcon(status) {
            switch (status) {
                case 'passed': return 'check-circle';
                case 'failed': return 'times-circle';
                case 'skipped': return 'minus-circle';
                default: return 'question-circle';
            }
        }

        function formatDuration(ms) {
            if (ms < 1000) return \`\${ms}ms\`;
            if (ms < 60000) return \`\${(ms / 1000).toFixed(1)}s\`;
            return \`\${Math.floor(ms / 60000)}m \${Math.floor((ms % 60000) / 1000)}s\`;
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
}

function generateTestCards(results) {
  if (results.length === 0) {
    return '<div class="loading"><div class="spinner"></div>No test results found</div>';
  }

  return results.map(result => {
    const status = getTestStatus(result);
    const duration = formatDuration(result.duration || 0);
    const timestamp = new Date(result.timestamp || Date.now()).toLocaleString();
    
    // Fix screenshot paths - use relative paths from the report location
    const screenshots = (result.screenshots || []).map(screenshot => {
      if (screenshot.startsWith('./') || screenshot.startsWith('../')) {
        return screenshot;
      }
      if (screenshot.startsWith('/')) {
        return '.' + screenshot;
      }
      // Check if it's in test-report/screenshots folder
      if (fs.existsSync(`test-report/screenshots/${screenshot}`)) {
        return `test-report/screenshots/${screenshot}`;
      }
      return screenshot;
    });
    
    return `
      <div class="test-card ${status}">
        <div class="test-header">
          <div class="test-info">
            <h3>${escapeHtml(result.testName || 'Unnamed Test')}</h3>
            <div class="test-meta">
              <span><i class="far fa-clock"></i> ${duration}</span>
              <span><i class="fas fa-calendar"></i> ${timestamp}</span>
              <span><i class="fas fa-desktop"></i> ${result.browser || 'Chrome'}</span>
            </div>
          </div>
          <div class="test-status ${status}">
            <i class="fas fa-${getStatusIcon(status)}"></i>
            ${status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>
        <div class="test-details">
          <div class="test-description">
            ${escapeHtml(result.description || 'No description available')}
          </div>
          ${result.tags && result.tags.length > 0 ? `
            <div class="test-tags">
              ${result.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}
          ${result.error ? `
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
              <strong style="color: #dc2626;">Error:</strong>
              <pre style="margin: 0.5rem 0 0; white-space: pre-wrap; font-size: 0.875rem; color: #dc2626;">${escapeHtml(result.error)}</pre>
            </div>
          ` : ''}
          ${screenshots.length > 0 ? `
            <div style="margin: 1rem 0;">
              <strong style="color: #374151; margin-bottom: 0.5rem; display: block;">Screenshots:</strong>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.5rem;">
                ${screenshots.map(screenshot => `
                  <div style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                    <img src="${screenshot}" alt="Test Screenshot" 
                         style="width: 100%; height: auto; display: block; cursor: pointer;"
                         onclick="window.open('${screenshot}', '_blank')"
                         onerror="this.parentElement.innerHTML='<div style=\\"padding: 1rem; text-align: center; color: #6b7280; font-size: 0.75rem;\\">Screenshot not found</div>'">
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          <div class="test-metrics">
            <div class="metric">
              <div class="metric-value">${duration}</div>
              <div class="metric-label">Duration</div>
            </div>
            <div class="metric">
              <div class="metric-value">${result.environment || 'Local'}</div>
              <div class="metric-label">Environment</div>
            </div>
            <div class="metric">
              <div class="metric-value">${screenshots.length}</div>
              <div class="metric-label">Screenshots</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function getStatusIcon(status) {
  switch (status) {
    case 'passed': return 'check-circle';
    case 'failed': return 'times-circle';
    case 'skipped': return 'minus-circle';
    default: return 'question-circle';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}