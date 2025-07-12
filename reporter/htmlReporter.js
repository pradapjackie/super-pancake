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
    }

    // Enhance result with additional details
    const enhancedResult = {
        ...result,
        // Add system information
        systemInfo: {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            memory: process.memoryUsage(),
            uptime: process.uptime()
        },
        // Add execution context
        executionContext: {
            cwd: process.cwd(),
            env: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        // Add performance metrics if available
        performance: {
            memoryUsed: process.memoryUsage().heapUsed,
            executionTime: result.duration || 0,
            cpuUsage: process.cpuUsage ? process.cpuUsage() : null
        }
    };

    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const filePath = path.join(dir, `${safeName}.json`);

    fs.writeFileSync(filePath, JSON.stringify(enhancedResult, null, 2), 'utf-8');

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
        // Recursively find all JSON files in subdirectories
        const findJsonFiles = (dir) => {
            const files = [];
            const items = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const item of items) {
                const fullPath = path.join(dir, item.name);
                if (item.isDirectory()) {
                    files.push(...findJsonFiles(fullPath));
                } else if (item.isFile() && item.name.endsWith('.json')) {
                    files.push(fullPath);
                }
            }
            return files;
        };
        
        const allFiles = findJsonFiles(resultsDir);
        
        // Filter out HTML reporter files (timestamp-based names) to avoid duplication
        const files = allFiles.filter(file => {
            const filename = path.basename(file);
            // Keep only files that don't match timestamp pattern (HTML reporter files)
            // HTML reporter files look like: 1752300813428-hr2m7vpk.json
            return !filename.match(/^\d{13}-[a-z0-9]+\.json$/);
        });
        
        console.log(`Found ${allFiles.length} result files in ${resultsDir} (including subdirectories)`);
        console.log(`Using ${files.length} files after filtering out HTML reporter duplicates`);

        for (const filePath of files) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const result = JSON.parse(content);
                
                // Handle different result formats (Vitest JSON vs custom format)
                if (result.testResults && Array.isArray(result.testResults)) {
                    // Vitest JSON format
                    for (const testSuite of result.testResults) {
                        if (testSuite.assertionResults && Array.isArray(testSuite.assertionResults)) {
                            for (const assertion of testSuite.assertionResults) {
                                const keyId = `${testSuite.name}|${assertion.fullName}|${result.startTime}`;
                                const enhancedResult = {
                                    name: assertion.title || assertion.fullName,
                                    status: assertion.status === 'passed' ? 'pass' : 'fail',
                                    file: testSuite.name,
                                    timestamp: new Date(result.startTime).toISOString(),
                                    duration: assertion.duration ? `${assertion.duration.toFixed(2)}ms` : '-',
                                    error: assertion.failureMessages && assertion.failureMessages.length > 0 ? assertion.failureMessages.join('\n') : null
                                };
                                aggregatedResults.set(keyId, enhancedResult);
                            }
                        }
                    }
                } else {
                    // Custom format (existing tests)
                    const keyId = `${result.file}|${result.name}|${result.timestamp}`;
                    if (aggregatedResults.has(keyId)) {
                        const existing = aggregatedResults.get(keyId);
                        if (new Date(existing.timestamp) > new Date(result.timestamp)) continue;
                    }
                    aggregatedResults.set(keyId, result);
                }
            } catch (e) {
                console.error(`Failed to read or parse result file: ${filePath}`, e);
            }
        }
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

    // Calculate pass rate and duration
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    const failRate = total > 0 ? ((failed / total) * 100).toFixed(1) : '0.0';
    
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
    
    // Gather environment info and system details
    const sampleResult = flatResults[0];
    const env = sampleResult?.executionContext?.env || 'Development';
    const browser = flatResults.find(r => r.browser) ? flatResults.find(r => r.browser).browser : 'Chrome';
    const build = flatResults.find(r => r.build) ? flatResults.find(r => r.build).build : 'v1.0.0';
    const executor = flatResults.find(r => r.executor) ? flatResults.find(r => r.executor).executor : 'Super Pancake';
    
    // Gather system information
    const systemInfo = sampleResult?.systemInfo || {};
    const executionContext = sampleResult?.executionContext || {};
    
    // Calculate detailed metrics
    const avgMemoryUsage = flatResults.reduce((sum, r) => sum + (r.performance?.memoryUsed || 0), 0) / flatResults.length;
    const totalCpuTime = flatResults.reduce((sum, r) => sum + (r.performance?.cpuUsage?.user || 0), 0);
    const failedTests = flatResults.filter(r => r.status === 'fail');
    const passedTests = flatResults.filter(r => r.status === 'pass');
    
    // Test execution timeline
    const testTimeline = flatResults.map(r => ({
        name: r.name,
        timestamp: r.timestamp,
        status: r.status,
        duration: r.duration
    })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    let serialCounter = 1;
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🥞 Super Pancake Test Report</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-green: #16a34a;
            --primary-light: #22c55e;
            --primary-dark: #15803d;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --info: #3b82f6;
            --bg-primary: #f8fafc;
            --bg-secondary: #ffffff;
            --text-primary: #1e293b;
            --text-secondary: #475569;
            --text-muted: #64748b;
            --border-color: #e2e8f0;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            font-size: 14px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
        }

        /* Header */
        .header {
            background: linear-gradient(135deg, var(--primary-green) 0%, var(--primary-light) 100%);
            color: white;
            padding: 40px 0;
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
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }

        .header-content {
            position: relative;
            z-index: 1;
            text-align: center;
        }

        .header h1 {
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .header .subtitle {
            font-size: 1.2rem;
            font-weight: 400;
            opacity: 0.9;
            margin-bottom: 20px;
        }

        .header .timestamp {
            font-size: 0.95rem;
            opacity: 0.8;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        /* Summary Cards */
        .summary-section {
            margin: -60px auto 40px auto;
            padding: 0 20px;
            position: relative;
            z-index: 2;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }

        .summary-card {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 16px;
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            border-left: 4px solid var(--primary-green);
        }

        .summary-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .summary-card.total { border-left-color: var(--info); }
        .summary-card.passed { border-left-color: var(--success); }
        .summary-card.failed { border-left-color: var(--danger); }
        .summary-card.duration { border-left-color: var(--warning); }

        .summary-card .icon {
            font-size: 1.5rem;
            margin-bottom: 8px;
            opacity: 0.8;
        }

        .summary-card .value {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 6px;
            line-height: 1;
        }

        .summary-card .label {
            font-size: 0.8rem;
            color: var(--text-secondary);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .summary-card .percentage {
            font-size: 1.1rem;
            font-weight: 600;
            margin-top: 8px;
        }

        .summary-card.passed .percentage { color: var(--success); }
        .summary-card.failed .percentage { color: var(--danger); }

        /* Filter and Sort Controls */
        .controls-section {
            margin: 20px auto;
            padding: 0 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            align-items: center;
            justify-content: space-between;
        }

        .filter-group {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .filter-btn {
            padding: 8px 16px;
            border: 2px solid var(--border-color);
            background: var(--bg-secondary);
            color: var(--text-secondary);
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .filter-btn:hover {
            border-color: var(--primary-green);
            color: var(--primary-green);
        }

        .filter-btn.active {
            background: var(--primary-green);
            color: white;
            border-color: var(--primary-green);
        }

        .sort-group {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .sort-select {
            padding: 8px 12px;
            border: 2px solid var(--border-color);
            background: var(--bg-secondary);
            color: var(--text-primary);
            border-radius: 8px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: border-color 0.3s ease;
        }

        .sort-select:focus {
            outline: none;
            border-color: var(--primary-green);
        }

        .sort-label {
            font-size: 0.9rem;
            color: var(--text-secondary);
            font-weight: 500;
        }

        /* Hidden state for filtered items */
        .test-file-group.hidden {
            display: none;
        }

        /* Performance Metrics Section */
        .performance-section {
            margin: 40px auto;
            padding: 0 20px;
        }

        .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .performance-card {
            background: var(--bg-secondary);
            border-radius: 10px;
            padding: 16px;
            box-shadow: var(--shadow);
            text-align: center;
            border-left: 4px solid var(--info);
        }

        .performance-card.memory { border-left-color: var(--warning); }
        .performance-card.cpu { border-left-color: var(--danger); }
        .performance-card.timeline { border-left-color: var(--primary-green); }

        .performance-card .metric-value {
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 4px;
        }

        .performance-card .metric-label {
            font-size: 0.8rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .performance-card .metric-icon {
            font-size: 1.2rem;
            margin-bottom: 8px;
            opacity: 0.7;
        }

        /* System Information Section */
        .system-section {
            margin: 40px auto;
            padding: 0 20px;
        }

        .system-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }

        .system-card {
            background: var(--bg-secondary);
            border-radius: 10px;
            padding: 18px;
            box-shadow: var(--shadow);
        }

        .system-card h3 {
            color: var(--text-primary);
            margin-bottom: 15px;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .system-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid var(--border-color);
        }

        .system-detail:last-child {
            border-bottom: none;
        }

        .system-detail .key {
            color: var(--text-secondary);
            font-weight: 500;
        }

        .system-detail .value {
            color: var(--text-primary);
            font-weight: 600;
            font-family: 'Monaco', monospace;
            font-size: 0.9rem;
        }

        /* Test Timeline Section */
        .timeline-section {
            margin: 40px auto;
            padding: 0 20px;
        }

        .timeline-container {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 30px;
            box-shadow: var(--shadow);
        }

        .timeline-item {
            display: flex;
            align-items: center;
            padding: 15px 0;
            border-bottom: 1px solid var(--border-color);
            position: relative;
        }

        .timeline-item:last-child {
            border-bottom: none;
        }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--primary-green);
        }

        .timeline-item.failed::before {
            background: var(--danger);
        }

        .timeline-content {
            margin-left: 50px;
            flex: 1;
        }

        .timeline-test-name {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 5px;
        }

        .timeline-meta {
            font-size: 0.8rem;
            color: var(--text-secondary);
            display: flex;
            gap: 15px;
        }

        /* Test Summary Cards */
        .test-summary-section {
            margin: 40px auto;
            padding: 0 20px;
        }

        .test-summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }

        .test-summary-card {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 20px;
            box-shadow: var(--shadow);
        }

        .test-summary-card h3 {
            color: var(--text-primary);
            margin-bottom: 15px;
            font-size: 1.1rem;
        }

        .test-list {
            max-height: 200px;
            overflow-y: auto;
        }

        .test-list-item {
            padding: 8px 0;
            border-bottom: 1px solid var(--border-color);
            font-size: 0.9rem;
        }

        .test-list-item:last-child {
            border-bottom: none;
        }

        .test-list-item .test-name {
            color: var(--text-primary);
            font-weight: 500;
        }

        .test-list-item .test-file {
            color: var(--text-secondary);
            font-size: 0.8rem;
        }

        /* Environment Section */
        .environment-section {
            margin: 40px auto;
            padding: 0 20px;
        }

        .environment-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            background: var(--bg-secondary);
            border-radius: 16px;
            padding: 30px;
            box-shadow: var(--shadow);
        }

        .environment-item {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .environment-item .icon {
            font-size: 1.2rem;
            color: var(--primary-green);
            min-width: 20px;
        }

        .environment-item .label {
            font-weight: 600;
            color: var(--text-secondary);
            min-width: 80px;
        }

        .environment-item .value {
            color: var(--text-primary);
            font-weight: 500;
        }

        /* Test Results Section */
        .results-section {
            margin: 40px auto;
            padding: 0 20px;
        }

        .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }

        .section-header h2 {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
        }

        .section-header .icon {
            font-size: 1.3rem;
            color: var(--primary-green);
        }

        .test-file-group {
            background: var(--bg-secondary);
            border-radius: 16px;
            margin-bottom: 30px;
            overflow: hidden;
            box-shadow: var(--shadow);
        }

        .test-file-header {
            background: var(--primary-green);
            color: white;
            padding: 20px 30px;
            font-weight: 600;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .test-file-header .icon {
            font-size: 1.2rem;
        }

        .test-table {
            width: 100%;
            border-collapse: collapse;
        }

        .test-table th {
            background: var(--bg-primary);
            color: var(--text-secondary);
            font-weight: 600;
            padding: 15px 20px;
            text-align: left;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .test-table td {
            padding: 15px 20px;
            border-bottom: 1px solid var(--border-color);
            vertical-align: top;
        }

        .test-table tr:last-child td {
            border-bottom: none;
        }

        .test-table tr:hover {
            background: var(--bg-primary);
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-badge.pass {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }

        .status-badge.fail {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
        }

        .status-badge .icon {
            font-size: 0.8rem;
        }

        .details-btn {
            background: none;
            border: none;
            color: var(--primary-green);
            cursor: pointer;
            font-size: 0.9rem;
            padding: 4px 8px;
            border-radius: 6px;
            transition: background 0.2s;
        }

        .details-btn:hover {
            background: var(--bg-primary);
        }

        .details-row {
            display: none;
        }

        .details-cell {
            padding: 20px 30px;
            background: var(--bg-primary);
            border-top: 1px solid var(--border-color);
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
            color: var(--text-secondary);
            line-height: 1.6;
        }

        .details-cell img {
            margin-top: 15px;
            max-width: 300px;
            border-radius: 8px;
            box-shadow: var(--shadow);
            cursor: pointer;
            transition: transform 0.2s;
        }

        .details-cell img:hover {
            transform: scale(1.05);
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }

        .modal-content {
            position: relative;
            max-width: 90%;
            max-height: 90%;
        }

        .modal-close {
            position: absolute;
            top: -40px;
            right: -40px;
            background: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 1.2rem;
            cursor: pointer;
            box-shadow: var(--shadow);
        }

        .modal img {
            max-width: 100%;
            max-height: 100%;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .summary-grid {
                grid-template-columns: 1fr;
            }
            
            .environment-grid {
                grid-template-columns: 1fr;
            }
            
            .test-table {
                font-size: 0.9rem;
            }
            
            .test-table th,
            .test-table td {
                padding: 10px;
            }
        }
    </style>
    <script>
        function toggleDetails(rowId) {
            const row = document.getElementById(rowId);
            if (!row) return;
            if (row.style.display === 'table-row') {
                row.style.display = 'none';
            } else {
                row.style.display = 'table-row';
            }
        }

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

        // Close modal when clicking outside
        document.addEventListener('click', function(event) {
            const modal = document.getElementById('imageModal');
            if (event.target === modal) {
                closeImageModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeImageModal();
            }
        });

        // Filter and Sort functionality
        let currentFilter = 'all';
        let currentSort = 'name';

        function initializeControls() {
            // Set initial active filter
            document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
            
            // Add event listeners for filter buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const filter = this.getAttribute('data-filter');
                    filterTests(filter);
                    
                    // Update active state
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                });
            });

            // Add event listener for sort select
            document.getElementById('sortSelect').addEventListener('change', function() {
                const sortBy = this.value;
                sortTests(sortBy);
            });
        }

        function filterTests(filter) {
            currentFilter = filter;
            const testGroups = document.querySelectorAll('.test-file-group');
            let visibleCount = 0;

            testGroups.forEach(group => {
                const statusBadge = group.querySelector('.status-badge');
                const status = statusBadge ? statusBadge.classList.contains('pass') ? 'pass' : 'fail' : 'unknown';
                
                if (filter === 'all' || filter === status) {
                    group.classList.remove('hidden');
                    visibleCount++;
                } else {
                    group.classList.add('hidden');
                }
            });

            // Update results counter
            updateResultsCounter(visibleCount);
        }

        function sortTests(sortBy) {
            currentSort = sortBy;
            const container = document.querySelector('.results-section');
            const testGroups = Array.from(container.querySelectorAll('.test-file-group'));
            
            testGroups.sort((a, b) => {
                if (sortBy === 'name') {
                    const nameA = a.querySelector('.test-table tbody tr td:nth-child(2)').textContent.trim();
                    const nameB = b.querySelector('.test-table tbody tr td:nth-child(2)').textContent.trim();
                    return nameA.localeCompare(nameB);
                } else if (sortBy === 'status') {
                    const statusA = a.querySelector('.status-badge').textContent.trim();
                    const statusB = b.querySelector('.status-badge').textContent.trim();
                    return statusA.localeCompare(statusB);
                } else if (sortBy === 'time') {
                    const timeA = a.querySelector('.test-table tbody tr td:nth-child(5)').textContent.trim();
                    const timeB = b.querySelector('.test-table tbody tr td:nth-child(5)').textContent.trim();
                    return new Date(timeA) - new Date(timeB);
                }
                return 0;
            });

            // Re-append sorted elements
            testGroups.forEach(group => {
                container.appendChild(group);
            });
        }

        function updateResultsCounter(count) {
            const counter = document.getElementById('resultsCounter');
            if (counter) {
                counter.textContent = count;
            }
        }

        // Initialize controls when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            initializeControls();
        });
    </script>
</head>
<body>
    <div class="header">
        <div class="container">
            <div class="header-content">
                <h1>🥞 Super Pancake Test Report</h1>
                <div class="subtitle">Comprehensive Automation Test Results</div>
                <div class="timestamp">
                    <i class="fas fa-clock"></i>
                    Generated: ${new Date(timestamp).toLocaleString()}
                </div>
            </div>
        </div>
    </div>
    <div class="container">
        <div class="summary-section">
            <div class="summary-grid">
                <div class="summary-card total">
                    <div class="icon">
                        <i class="fas fa-list-check"></i>
                    </div>
                    <div class="value">${total}</div>
                    <div class="label">Total Tests</div>
                </div>
                <div class="summary-card passed">
                    <div class="icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="value">${passed}</div>
                    <div class="label">Passed</div>
                    <div class="percentage">${passRate}%</div>
                </div>
                <div class="summary-card failed">
                    <div class="icon">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <div class="value">${failed}</div>
                    <div class="label">Failed</div>
                    <div class="percentage">${(100 - parseFloat(passRate)).toFixed(1)}%</div>
                </div>
                <div class="summary-card duration">
                    <div class="icon">
                        <i class="fas fa-stopwatch"></i>
                    </div>
                    <div class="value">${duration}</div>
                    <div class="label">Duration</div>
                </div>
            </div>
        </div>
        <div class="environment-section">
            <div class="section-header">
                <i class="fas fa-cog icon"></i>
                <h2>Environment Details</h2>
            </div>
            <div class="environment-grid">
                <div class="environment-item">
                    <i class="fas fa-server icon"></i>
                    <div class="label">Environment:</div>
                    <div class="value">${env}</div>
                </div>
                <div class="environment-item">
                    <i class="fas fa-globe icon"></i>
                    <div class="label">Browser:</div>
                    <div class="value">${browser}</div>
                </div>
                <div class="environment-item">
                    <i class="fas fa-code-branch icon"></i>
                    <div class="label">Build:</div>
                    <div class="value">${build}</div>
                </div>
                <div class="environment-item">
                    <i class="fas fa-robot icon"></i>
                    <div class="label">Executor:</div>
                    <div class="value">${executor}</div>
                </div>
                <div class="environment-item">
                    <i class="fas fa-play icon"></i>
                    <div class="label">Start Time:</div>
                    <div class="value">${started ? started.toLocaleString() : '-'}</div>
                </div>
                <div class="environment-item">
                    <i class="fas fa-flag-checkered icon"></i>
                    <div class="label">End Time:</div>
                    <div class="value">${finished ? finished.toLocaleString() : '-'}</div>
                </div>
            </div>
        </div>

        <div class="performance-section">
            <div class="section-header">
                <i class="fas fa-chart-line icon"></i>
                <h2>Performance Metrics</h2>
            </div>
            <div class="performance-grid">
                <div class="performance-card memory">
                    <div class="metric-icon">
                        <i class="fas fa-memory" style="color: var(--warning);"></i>
                    </div>
                    <div class="metric-value">${(avgMemoryUsage / 1024 / 1024).toFixed(1)}MB</div>
                    <div class="metric-label">Avg Memory Usage</div>
                </div>
                <div class="performance-card cpu">
                    <div class="metric-icon">
                        <i class="fas fa-microchip" style="color: var(--danger);"></i>
                    </div>
                    <div class="metric-value">${(totalCpuTime / 1000).toFixed(2)}ms</div>
                    <div class="metric-label">Total CPU Time</div>
                </div>
                <div class="performance-card timeline">
                    <div class="metric-icon">
                        <i class="fas fa-clock" style="color: var(--primary-green);"></i>
                    </div>
                    <div class="metric-value">${testTimeline.length}</div>
                    <div class="metric-label">Test Executions</div>
                </div>
                <div class="performance-card">
                    <div class="metric-icon">
                        <i class="fas fa-tachometer-alt" style="color: var(--info);"></i>
                    </div>
                    <div class="metric-value">${passRate}%</div>
                    <div class="metric-label">Success Rate</div>
                </div>
            </div>
        </div>

        <div class="system-section">
            <div class="section-header">
                <i class="fas fa-desktop icon"></i>
                <h2>System Information</h2>
            </div>
            <div class="system-grid">
                <div class="system-card">
                    <h3><i class="fas fa-server"></i> Runtime Environment</h3>
                    <div class="system-detail">
                        <span class="key">Platform:</span>
                        <span class="value">${systemInfo.platform || process.platform}</span>
                    </div>
                    <div class="system-detail">
                        <span class="key">Architecture:</span>
                        <span class="value">${systemInfo.arch || process.arch}</span>
                    </div>
                    <div class="system-detail">
                        <span class="key">Node Version:</span>
                        <span class="value">${systemInfo.nodeVersion || process.version}</span>
                    </div>
                    <div class="system-detail">
                        <span class="key">Timezone:</span>
                        <span class="value">${executionContext.timezone || 'UTC'}</span>
                    </div>
                </div>
                <div class="system-card">
                    <h3><i class="fas fa-memory"></i> Memory Usage</h3>
                    <div class="system-detail">
                        <span class="key">RSS:</span>
                        <span class="value">${systemInfo.memory ? (systemInfo.memory.rss / 1024 / 1024).toFixed(1) + 'MB' : 'N/A'}</span>
                    </div>
                    <div class="system-detail">
                        <span class="key">Heap Used:</span>
                        <span class="value">${systemInfo.memory ? (systemInfo.memory.heapUsed / 1024 / 1024).toFixed(1) + 'MB' : 'N/A'}</span>
                    </div>
                    <div class="system-detail">
                        <span class="key">Heap Total:</span>
                        <span class="value">${systemInfo.memory ? (systemInfo.memory.heapTotal / 1024 / 1024).toFixed(1) + 'MB' : 'N/A'}</span>
                    </div>
                    <div class="system-detail">
                        <span class="key">External:</span>
                        <span class="value">${systemInfo.memory ? (systemInfo.memory.external / 1024 / 1024).toFixed(1) + 'MB' : 'N/A'}</span>
                    </div>
                </div>
                <div class="system-card">
                    <h3><i class="fas fa-folder"></i> Execution Context</h3>
                    <div class="system-detail">
                        <span class="key">Working Directory:</span>
                        <span class="value">${executionContext.cwd ? path.basename(executionContext.cwd) : 'N/A'}</span>
                    </div>
                    <div class="system-detail">
                        <span class="key">Process Uptime:</span>
                        <span class="value">${systemInfo.uptime ? (systemInfo.uptime / 60).toFixed(1) + 'm' : 'N/A'}</span>
                    </div>
                    <div class="system-detail">
                        <span class="key">Test Files:</span>
                        <span class="value">${groupedByFile.size}</span>
                    </div>
                    <div class="system-detail">
                        <span class="key">Report Generated:</span>
                        <span class="value">${new Date(timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="test-summary-section">
            <div class="section-header">
                <i class="fas fa-chart-pie icon"></i>
                <h2>Test Summary</h2>
            </div>
            <div class="test-summary-grid">
                <div class="test-summary-card">
                    <h3><i class="fas fa-check-circle" style="color: var(--success);"></i> Passed Tests</h3>
                    <div class="test-list">
                        ${passedTests.slice(0, 10).map(test => `
                            <div class="test-list-item">
                                <div class="test-name">${test.name}</div>
                                <div class="test-file">${test.file || 'Unknown file'}</div>
                            </div>
                        `).join('')}
                        ${passedTests.length > 10 ? `<div class="test-list-item"><em>... and ${passedTests.length - 10} more</em></div>` : ''}
                    </div>
                </div>
                <div class="test-summary-card">
                    <h3><i class="fas fa-times-circle" style="color: var(--danger);"></i> Failed Tests</h3>
                    <div class="test-list">
                        ${failedTests.length > 0 ? failedTests.slice(0, 10).map(test => `
                            <div class="test-list-item">
                                <div class="test-name">${test.name}</div>
                                <div class="test-file">${test.file || 'Unknown file'}</div>
                            </div>
                        `).join('') : '<div class="test-list-item"><em>No failed tests</em></div>'}
                        ${failedTests.length > 10 ? `<div class="test-list-item"><em>... and ${failedTests.length - 10} more</em></div>` : ''}
                    </div>
                </div>
            </div>
        </div>

        <div class="timeline-section">
            <div class="section-header">
                <i class="fas fa-timeline icon"></i>
                <h2>Test Execution Timeline</h2>
            </div>
            <div class="timeline-container">
                ${testTimeline.slice(0, 20).map(test => `
                    <div class="timeline-item ${test.status === 'fail' ? 'failed' : ''}">
                        <div class="timeline-content">
                            <div class="timeline-test-name">${test.name}</div>
                            <div class="timeline-meta">
                                <span><i class="fas fa-clock"></i> ${test.timestamp ? new Date(test.timestamp).toLocaleTimeString() : 'N/A'}</span>
                                <span><i class="fas fa-stopwatch"></i> ${test.duration || 'N/A'}</span>
                                <span><i class="fas fa-${test.status === 'pass' ? 'check' : 'times'}"></i> ${test.status}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
                ${testTimeline.length > 20 ? `<div class="timeline-item"><div class="timeline-content"><em>... and ${testTimeline.length - 20} more tests</em></div></div>` : ''}
            </div>
        </div>
        <div class="controls-section">
            <div class="filter-group">
                <span class="sort-label">Filter:</span>
                <button class="filter-btn" data-filter="all">All (<span id="resultsCounter">${total}</span>)</button>
                <button class="filter-btn" data-filter="pass">Passed (${passed})</button>
                <button class="filter-btn" data-filter="fail">Failed (${failed})</button>
                <button class="filter-btn" data-filter="skipped">Skipped (${skipped || 0})</button>
            </div>
            <div class="sort-group">
                <label class="sort-label" for="sortSelect">Sort by:</label>
                <select id="sortSelect" class="sort-select">
                    <option value="name">Test Name</option>
                    <option value="status">Status</option>
                    <option value="time">Execution Time</option>
                </select>
            </div>
        </div>

        <div class="results-section">
            <div class="section-header">
                <i class="fas fa-clipboard-list icon"></i>
                <h2>Test Results</h2>
            </div>
            
            ${Array.from(groupedByFile.entries()).map(([file, tests], groupIdx) => `
                <div class="test-file-group">
                    <div class="test-file-header">
                        <i class="fas fa-file-code icon"></i>
                        ${file}
                    </div>
                    <table class="test-table">
                        <thead>
                            <tr>
                                <th>#</th>
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
                                        <span class="status-badge ${r.status}">
                                            <i class="fas fa-${r.status === 'pass' ? 'check' : 'times'} icon"></i>
                                            ${r.status || ''}
                                        </span>
                                    </td>
                                    <td>${r.duration || '-'}</td>
                                    <td>${r.timestamp ? new Date(r.timestamp).toLocaleString() : '-'}</td>
                                    <td>
                                        ${hasDetails ? `<button class="details-btn" onclick="toggleDetails('${rowId}')">
                                            <i class="fas fa-eye"></i> View Details
                                        </button>` : '-'}
                                    </td>
                                </tr>
                                ${hasDetails ? `
                                <tr id="${rowId}" class="details-row">
                                    <td colspan="6" class="details-cell">
                                        ${r.error ? `<div><strong>Error Details:</strong><br><pre>${r.error}</pre></div>` : ''}
                                        ${r.screenshot ? `<div><strong>Screenshot:</strong><br><img src="${r.screenshot.replace(/\\/g, '/')}" alt="Test screenshot" onclick="openImageModal(this.src)" style="max-width: 400px; border: 1px solid var(--border-color); border-radius: 8px;"></div>` : ''}
                                    </td>
                                </tr>
                                ` : ''}
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}
        </div>
    </div>
    <div id="imageModal" class="modal">
        <div class="modal-content">
            <button class="modal-close" onclick="closeImageModal()">×</button>
            <img id="modalImage" src="" alt="Screenshot preview">
        </div>
    </div>
</body>
</html>
`;

    console.log("Generated HTML report content");

    try {
        // Write the unified report to automationTestReport.html (main report)
        fs.writeFileSync('automationTestReport.html', html, 'utf-8');
        console.log(`✅ Test report saved to: automationTestReport.html`);
        
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