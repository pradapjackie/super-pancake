// Modern HTML Reporter - Enhanced UI and Features
import fs from 'fs';
import path from 'path';

console.log('🎨 Modern HTML Reporter loaded');

if (!global.modernTestResults) {
  global.modernTestResults = new Map();
}

const allResults = global.modernTestResults;

export function initializeModernReport() {
  const reportDir = 'test-report';
  const resultsDir = path.join(reportDir, 'results');
  const screenshotsDir = path.join(reportDir, 'screenshots');
  const assetsDir = path.join(reportDir, 'assets');

  console.log(`🏗️ Initializing modern report at: ${path.resolve(reportDir)}`);

  try {
    // Clear global results
    global.modernTestResults = new Map();

    // Remove and recreate directory structure
    if (fs.existsSync(reportDir)) {
      fs.rmSync(reportDir, { recursive: true, force: true });
      console.log('✨ Cleared existing report directory');
    }

    // Create directory structure
    fs.mkdirSync(path.join(reportDir, 'results'), { recursive: true });
    fs.mkdirSync(path.join(reportDir, 'screenshots'), { recursive: true });
    fs.mkdirSync(path.join(reportDir, 'assets'), { recursive: true });
    
    console.log('📁 Created modern report directory structure');
  } catch (err) {
    console.error('❌ Failed to initialize modern report:', err);
  }
}

export function addModernTestResult(result) {
  const dir = 'test-report/results';

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Enhanced result with modern features
  const modernResult = {
    ...result,
    id: generateTestId(),
    timestamp: new Date().toISOString(),
    duration: result.duration || 0,
    browser: result.browser || 'Chrome',
    environment: result.environment || 'Local',
    tags: result.tags || [],
    performance: result.performance || {},
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

  // Store in global results
  allResults.set(modernResult.id, modernResult);

  // Save individual result file
  const filename = `${modernResult.testName?.replace(/[^a-zA-Z0-9]/g, '_') || 'test'}_${modernResult.id}.json`;
  const filepath = path.join(dir, filename);
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(modernResult, null, 2));
    console.log(`📊 Saved modern test result: ${filename}`);
  } catch (err) {
    console.error('❌ Failed to save test result:', err);
  }

  return modernResult.id;
}

export function generateModernReport() {
  const reportPath = 'modernTestReport.html';
  
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

  return results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
    switch (result.status?.toLowerCase()) {
      case 'passed':
      case 'pass':
      case 'success':
        summary.passed++;
        break;
      case 'failed':
      case 'fail':
      case 'error':
        summary.failed++;
        break;
      case 'skipped':
      case 'skip':
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
    const timestamp = new Date(result.timestamp);
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

function generateModernHTML(summary, results) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🥞 Super Pancake Test Report</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        ${getModernCSS()}
    </style>
</head>
<body>
    <div class="app">
        <!-- Header -->
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

        <!-- Summary Dashboard -->
        <section class="dashboard">
            <div class="container">
                <div class="summary-grid">
                    <div class="summary-card total">
                        <div class="card-icon">
                            <i class="fas fa-vial"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary.total}</h3>
                            <p>Total Tests</p>
                        </div>
                    </div>
                    
                    <div class="summary-card passed">
                        <div class="card-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary.passed}</h3>
                            <p>Passed</p>
                        </div>
                    </div>
                    
                    <div class="summary-card failed">
                        <div class="card-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary.failed}</h3>
                            <p>Failed</p>
                        </div>
                    </div>
                    
                    <div class="summary-card skipped">
                        <div class="card-icon">
                            <i class="fas fa-minus-circle"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary.skipped}</h3>
                            <p>Skipped</p>
                        </div>
                    </div>
                    
                    <div class="summary-card success-rate">
                        <div class="card-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary.successRate}%</h3>
                            <p>Success Rate</p>
                        </div>
                    </div>
                    
                    <div class="summary-card duration">
                        <div class="card-icon">
                            <i class="fas fa-stopwatch"></i>
                        </div>
                        <div class="card-content">
                            <h3>${formatDuration(summary.totalDuration)}</h3>
                            <p>Total Duration</p>
                        </div>
                    </div>
                </div>

                <!-- Progress Bar -->
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
        <section class="controls">
            <div class="container">
                <div class="filter-bar">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchTests" placeholder="Search tests...">
                    </div>
                    <div class="filter-buttons">
                        <button class="filter-btn active" data-filter="all">All Tests</button>
                        <button class="filter-btn" data-filter="passed">Passed</button>
                        <button class="filter-btn" data-filter="failed">Failed</button>
                        <button class="filter-btn" data-filter="skipped">Skipped</button>
                    </div>
                    <div class="view-toggle">
                        <button class="view-btn active" data-view="grid">
                            <i class="fas fa-th"></i>
                        </button>
                        <button class="view-btn" data-view="list">
                            <i class="fas fa-list"></i>
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Test Results -->
        <section class="results">
            <div class="container">
                <div class="results-grid" id="resultsContainer">
                    ${generateTestCards(results)}
                </div>
            </div>
        </section>

        <!-- Footer -->
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

    <!-- Test Detail Modal -->
    <div class="modal" id="testModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="modalTitle">Test Details</h2>
                <button class="modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" id="modalBody">
                <!-- Dynamic content -->
            </div>
        </div>
    </div>

    <script>
        ${getModernJavaScript(results)}
    </script>
</body>
</html>`;
}

function getModernCSS() {
  return `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    :root {
        --primary: #6366f1;
        --primary-dark: #4f46e5;
        --secondary: #ec4899;
        --success: #10b981;
        --warning: #f59e0b;
        --danger: #ef4444;
        --info: #3b82f6;
        --light: #f8fafc;
        --dark: #1e293b;
        --border: #e2e8f0;
        --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        --radius: 12px;
        --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.6;
        color: var(--dark);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 24px;
    }

    /* Header */
    .header {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 3rem 0;
        color: white;
        position: relative;
        overflow: hidden;
    }

    .header::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(180deg); }
    }

    .header-content {
        position: relative;
        z-index: 1;
        text-align: center;
    }

    .logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .logo i {
        font-size: 3rem;
        color: #fbbf24;
    }

    .header h1 {
        font-size: 3rem;
        font-weight: 800;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .subtitle {
        font-size: 1.25rem;
        opacity: 0.9;
        margin-bottom: 2rem;
    }

    .header-meta {
        display: flex;
        justify-content: center;
        gap: 2rem;
        font-size: 0.9rem;
        opacity: 0.8;
    }

    .header-meta span {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    /* Dashboard */
    .dashboard {
        background: white;
        margin: -2rem 0 2rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        position: relative;
        z-index: 2;
    }

    .summary-grid {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 2rem;
        flex-wrap: nowrap;
    }
    
    .summary-card {
        flex: 1;
        min-width: 150px;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        border-radius: var(--radius);
        background: var(--light);
        border: 2px solid transparent;
        transition: var(--transition);
        cursor: pointer;
    }

    .summary-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow);
    }

    .summary-card.total { border-color: var(--info); }
    .summary-card.passed { border-color: var(--success); }
    .summary-card.failed { border-color: var(--danger); }
    .summary-card.skipped { border-color: var(--warning); }
    .summary-card.success-rate { border-color: var(--primary); }
    .summary-card.duration { border-color: var(--secondary); }

    .card-icon {
        font-size: 2rem;
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: white;
        box-shadow: var(--shadow);
    }

    .total .card-icon { color: var(--info); }
    .passed .card-icon { color: var(--success); }
    .failed .card-icon { color: var(--danger); }
    .skipped .card-icon { color: var(--warning); }
    .success-rate .card-icon { color: var(--primary); }
    .duration .card-icon { color: var(--secondary); }

    .card-content h3 {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
    }

    .card-content p {
        color: #64748b;
        font-size: 0.875rem;
        font-weight: 500;
    }

    /* Progress Bar */
    .progress-container {
        padding: 0 2rem 2rem;
    }

    .progress-bar {
        height: 12px;
        background: #f1f5f9;
        border-radius: 6px;
        overflow: hidden;
        display: flex;
        margin-bottom: 1rem;
    }

    .progress-segment {
        height: 100%;
        transition: var(--transition);
    }

    .progress-segment.passed { background: var(--success); }
    .progress-segment.failed { background: var(--danger); }
    .progress-segment.skipped { background: var(--warning); }

    .progress-labels {
        display: flex;
        justify-content: center;
        gap: 2rem;
        font-size: 0.875rem;
    }

    .label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
    }

    .label::before {
        content: '';
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .label.passed::before { background: var(--success); }
    .label.failed::before { background: var(--danger); }
    .label.skipped::before { background: var(--warning); }

    /* Controls */
    .controls {
        background: white;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        margin-bottom: 2rem;
    }

    .filter-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem 2rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .search-box {
        position: relative;
        flex: 1;
        max-width: 300px;
    }

    .search-box i {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
    }

    .search-box input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        border: 2px solid var(--border);
        border-radius: var(--radius);
        font-size: 0.875rem;
        transition: var(--transition);
    }

    .search-box input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .filter-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .filter-btn {
        padding: 0.5rem 1rem;
        border: 2px solid var(--border);
        background: white;
        border-radius: var(--radius);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition);
    }

    .filter-btn:hover {
        border-color: var(--primary);
        color: var(--primary);
    }

    .filter-btn.active {
        background: var(--primary);
        border-color: var(--primary);
        color: white;
    }

    .view-toggle {
        display: flex;
        border: 2px solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
    }

    .view-btn {
        padding: 0.5rem 1rem;
        border: none;
        background: white;
        cursor: pointer;
        transition: var(--transition);
    }

    .view-btn.active {
        background: var(--primary);
        color: white;
    }

    /* Results */
    .results {
        margin-bottom: 3rem;
    }

    .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
        gap: 1.5rem;
    }

    .results-grid.list-view {
        grid-template-columns: 1fr;
    }

    .test-card {
        background: white;
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        overflow: hidden;
        transition: var(--transition);
        cursor: pointer;
        border-left: 4px solid transparent;
    }

    .test-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }

    .test-card.passed { border-left-color: var(--success); }
    .test-card.failed { border-left-color: var(--danger); }
    .test-card.skipped { border-left-color: var(--warning); }

    .test-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid var(--border);
    }

    .test-info h3 {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
        color: var(--dark);
    }

    .test-meta {
        font-size: 0.875rem;
        color: #64748b;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .test-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.875rem;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
    }

    .test-status.passed {
        background: rgba(16, 185, 129, 0.1);
        color: var(--success);
    }

    .test-status.failed {
        background: rgba(239, 68, 68, 0.1);
        color: var(--danger);
    }

    .test-status.skipped {
        background: rgba(245, 158, 11, 0.1);
        color: var(--warning);
    }

    .test-details {
        padding: 1.5rem;
    }

    .test-description {
        color: #64748b;
        font-size: 0.875rem;
        line-height: 1.6;
        margin-bottom: 1rem;
    }

    .test-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .tag {
        padding: 0.25rem 0.5rem;
        background: var(--light);
        border-radius: 4px;
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 500;
    }

    .test-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 1rem;
        font-size: 0.875rem;
    }

    .metric {
        text-align: center;
    }

    .metric-value {
        font-weight: 600;
        color: var(--dark);
    }

    .metric-label {
        color: #64748b;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Modal */
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 1000;
        align-items: center;
        justify-content: center;
    }

    .modal.active {
        display: flex;
    }

    .modal-content {
        background: white;
        border-radius: var(--radius);
        max-width: 800px;
        max-height: 90vh;
        width: 90%;
        overflow: hidden;
        box-shadow: var(--shadow-lg);
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem 2rem;
        border-bottom: 1px solid var(--border);
        background: var(--light);
    }

    .modal-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #64748b;
        transition: var(--transition);
    }

    .modal-close:hover {
        color: var(--danger);
    }

    .modal-body {
        padding: 2rem;
        overflow-y: auto;
        max-height: calc(90vh - 120px);
    }

    /* Footer */
    .footer {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        color: white;
        padding: 2rem 0;
    }

    .footer-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .footer-info p {
        margin-bottom: 0.25rem;
        opacity: 0.8;
    }

    .footer-links {
        display: flex;
        gap: 1rem;
    }

    .footer-links a {
        color: white;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        opacity: 0.8;
        transition: var(--transition);
    }

    .footer-links a:hover {
        opacity: 1;
        transform: translateY(-2px);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .container {
            padding: 0 1rem;
        }

        .header h1 {
            font-size: 2rem;
        }

        .summary-grid {
            flex-wrap: wrap;
            gap: 1rem;
            padding: 1.5rem;
        }
        
        .summary-card {
            min-width: 140px;
            flex: 1 1 calc(50% - 0.5rem);
        }

        .filter-bar {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
        }

        .search-box {
            max-width: none;
        }

        .results-grid {
            grid-template-columns: 1fr;
        }

        .modal-content {
            width: 95%;
            margin: 1rem;
        }
    }

    /* Animations */
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .test-card {
        animation: slideIn 0.3s ease-out;
    }

    /* Loading States */
    .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        color: #64748b;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid var(--border);
        border-top: 4px solid var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
  `;
}

function generateTestCards(results) {
  if (results.length === 0) {
    return '<div class="loading"><div class="spinner"></div>No test results found</div>';
  }

  return results.map(result => {
    const status = getTestStatus(result);
    const duration = formatDuration(result.duration || 0);
    const timestamp = new Date(result.timestamp).toLocaleString();
    
    return `
      <div class="test-card ${status}" onclick="showTestDetails('${result.id || 'unknown'}')">
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
              <div class="metric-value">${result.screenshots?.length || 0}</div>
              <div class="metric-label">Screenshots</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getModernJavaScript(results) {
  return `
    // Global variables
    let allTests = ${JSON.stringify(results)};
    let filteredTests = [...allTests];
    let currentFilter = 'all';
    let currentView = 'grid';

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        initializeFilters();
        initializeSearch();
        initializeViewToggle();
        updateTestCount();
    });

    // Filter functionality
    function initializeFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.dataset.filter;
                setActiveFilter(this);
                filterTests(filter);
            });
        });
    }

    function setActiveFilter(activeBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    function filterTests(filter) {
        currentFilter = filter;
        if (filter === 'all') {
            filteredTests = [...allTests];
        } else {
            filteredTests = allTests.filter(test => getTestStatus(test) === filter);
        }
        applySearch();
        renderTests();
        updateTestCount();
    }

    // Search functionality
    function initializeSearch() {
        const searchInput = document.getElementById('searchTests');
        searchInput.addEventListener('input', function() {
            applySearch();
        });
    }

    function applySearch() {
        const searchTerm = document.getElementById('searchTests').value.toLowerCase();
        if (!searchTerm) {
            renderTests();
            return;
        }

        const searchResults = filteredTests.filter(test => {
            return (test.testName || '').toLowerCase().includes(searchTerm) ||
                   (test.description || '').toLowerCase().includes(searchTerm) ||
                   (test.tags || []).some(tag => tag.toLowerCase().includes(searchTerm));
        });

        renderTests(searchResults);
    }

    // View toggle
    function initializeViewToggle() {
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const view = this.dataset.view;
                setActiveView(this);
                toggleView(view);
            });
        });
    }

    function setActiveView(activeBtn) {
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    function toggleView(view) {
        currentView = view;
        const container = document.getElementById('resultsContainer');
        if (view === 'list') {
            container.classList.add('list-view');
        } else {
            container.classList.remove('list-view');
        }
    }

    // Render functions
    function renderTests(tests = filteredTests) {
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
        const timestamp = new Date(test.timestamp).toLocaleString();
        
        return \`
            <div class="test-card \${status}" onclick="showTestDetails('\${test.id || 'unknown'}')">
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
                            <div class="metric-value">\${test.screenshots?.length || 0}</div>
                            <div class="metric-label">Screenshots</div>
                        </div>
                    </div>
                </div>
            </div>
        \`;
    }

    // Modal functions
    function showTestDetails(testId) {
        const test = allTests.find(t => t.id === testId);
        if (!test) return;

        const modal = document.getElementById('testModal');
        const title = document.getElementById('modalTitle');
        const body = document.getElementById('modalBody');

        title.textContent = test.testName || 'Test Details';
        body.innerHTML = generateTestDetailContent(test);
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        const modal = document.getElementById('testModal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    function generateTestDetailContent(test) {
        const status = getTestStatus(test);
        return \`
            <div class="test-detail-content">
                <div class="detail-header">
                    <div class="test-status \${status}">
                        <i class="fas fa-\${getStatusIcon(status)}"></i>
                        \${status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                    <div class="test-timing">
                        <strong>Duration:</strong> \${formatDuration(test.duration || 0)}<br>
                        <strong>Timestamp:</strong> \${new Date(test.timestamp).toLocaleString()}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Description</h3>
                    <p>\${escapeHtml(test.description || 'No description available')}</p>
                </div>

                <div class="detail-section">
                    <h3>Environment Details</h3>
                    <div class="detail-grid">
                        <div><strong>Browser:</strong> \${test.browser || 'Chrome'}</div>
                        <div><strong>Environment:</strong> \${test.environment || 'Local'}</div>
                        <div><strong>Platform:</strong> \${test.metadata?.platform || 'Unknown'}</div>
                        <div><strong>Node Version:</strong> \${test.metadata?.nodeVersion || 'Unknown'}</div>
                    </div>
                </div>

                \${test.error ? \`
                    <div class="detail-section">
                        <h3>Error Details</h3>
                        <div class="error-content">
                            <pre>\${escapeHtml(test.error)}</pre>
                        </div>
                    </div>
                \` : ''}

                \${test.logs && test.logs.length > 0 ? \`
                    <div class="detail-section">
                        <h3>Logs</h3>
                        <div class="logs-content">
                            \${test.logs.map(log => \`<div class="log-entry">\${escapeHtml(log)}</div>\`).join('')}
                        </div>
                    </div>
                \` : ''}

                \${test.screenshots && test.screenshots.length > 0 ? \`
                    <div class="detail-section">
                        <h3>Screenshots</h3>
                        <div class="screenshots-grid">
                            \${test.screenshots.map(screenshot => \`
                                <div class="screenshot-item">
                                    <img src="\${screenshot}" alt="Test Screenshot" onclick="openScreenshot('\${screenshot}')">
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                \` : ''}
            </div>

            <style>
                .test-detail-content { font-size: 0.9rem; }
                .detail-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: flex-start; 
                    margin-bottom: 2rem; 
                    padding-bottom: 1rem; 
                    border-bottom: 1px solid var(--border); 
                }
                .test-timing { text-align: right; color: #64748b; }
                .detail-section { margin-bottom: 2rem; }
                .detail-section h3 { 
                    font-size: 1.1rem; 
                    margin-bottom: 1rem; 
                    color: var(--dark); 
                    border-bottom: 2px solid var(--primary); 
                    padding-bottom: 0.5rem; 
                }
                .detail-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                    gap: 1rem; 
                }
                .error-content { 
                    background: #fef2f2; 
                    border: 1px solid #fecaca; 
                    border-radius: var(--radius); 
                    padding: 1rem; 
                }
                .error-content pre { 
                    color: var(--danger); 
                    white-space: pre-wrap; 
                    margin: 0; 
                }
                .logs-content { 
                    background: var(--light); 
                    border-radius: var(--radius); 
                    padding: 1rem; 
                    max-height: 300px; 
                    overflow-y: auto; 
                }
                .log-entry { 
                    margin-bottom: 0.5rem; 
                    font-family: monospace; 
                    font-size: 0.8rem; 
                }
                .screenshots-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
                    gap: 1rem; 
                }
                .screenshot-item img { 
                    width: 100%; 
                    border-radius: var(--radius); 
                    cursor: pointer; 
                    transition: var(--transition); 
                }
                .screenshot-item img:hover { 
                    transform: scale(1.05); 
                    box-shadow: var(--shadow); 
                }
            </style>
        \`;
    }

    // Utility functions
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function updateTestCount() {
        // Update summary cards if needed
        const totalCard = document.querySelector('.summary-card.total h3');
        if (totalCard) {
            totalCard.textContent = filteredTests.length;
        }
    }

    function openScreenshot(url) {
        window.open(url, '_blank');
    }

    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Close modal on backdrop click
    document.getElementById('testModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
  `;
}

function getTestStatus(result) {
  if (!result.status) return 'unknown';
  const status = result.status.toLowerCase();
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
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Export for backward compatibility
export function writeReport() {
  return generateModernReport();
}