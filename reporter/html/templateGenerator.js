import { escapeHtml, formatDuration, getStatusIcon } from './htmlUtils.js';
import { generateStylesheet } from './styleGenerator.js';
import { generateJavaScript } from './scriptGenerator.js';
import { generateTestCards, generateTestFilesStructure } from './componentGenerators.js';

export function generateModernHTML(summary, results) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🥞 Super Pancake Test Report</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    ${generateStylesheet()}
</head>
<body>
    ${generateHeader(summary)}
    ${generateSummaryCards(summary)}
    ${generateMainContent(summary, results)}
    ${generateJavaScript()}
</body>
</html>`;
}

function generateHeader(summary) {
  return `
    <header class="header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <h1><i class="fas fa-flask"></i> Super Pancake Test Report</h1>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                </div>
                <div class="header-stats">
                    <div class="stat-item">
                        <span class="stat-value">${summary.total}</span>
                        <span class="stat-label">Total Tests</span>
                    </div>
                    <div class="stat-item ${summary.failed > 0 ? 'danger' : 'success'}">
                        <span class="stat-value">${summary.passed}/${summary.total}</span>
                        <span class="stat-label">Pass Rate</span>
                    </div>
                </div>
            </div>
        </div>
    </header>`;
}

function generateSummaryCards(summary) {
  const passRate = summary.total > 0 ? Math.round((summary.passed / summary.total) * 100) : 0;
  
  return `
    <div class="container">
        <div class="summary-cards">
            <div class="summary-card success">
                <div class="card-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="card-content">
                    <h3>${summary.passed}</h3>
                    <p>Passed Tests</p>
                </div>
            </div>
            <div class="summary-card danger">
                <div class="card-icon">
                    <i class="fas fa-times-circle"></i>
                </div>
                <div class="card-content">
                    <h3>${summary.failed}</h3>
                    <p>Failed Tests</p>
                </div>
            </div>
            <div class="summary-card warning">
                <div class="card-icon">
                    <i class="fas fa-minus-circle"></i>
                </div>
                <div class="card-content">
                    <h3>${summary.skipped}</h3>
                    <p>Skipped Tests</p>
                </div>
            </div>
            <div class="summary-card info">
                <div class="card-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="card-content">
                    <h3>${formatDuration(summary.totalDuration)}</h3>
                    <p>Total Duration</p>
                </div>
            </div>
        </div>
    </div>`;
}

function generateMainContent(summary, results) {
  return `
    <div class="container">
        <div class="analytics-dashboard">
            <div class="tab-navigation">
                <button class="tab-btn active" onclick="switchTab('overview')">
                    <i class="fas fa-tachometer-alt"></i> Overview
                </button>
                <button class="tab-btn" onclick="switchTab('tests')">
                    <i class="fas fa-list"></i> Tests
                </button>
                <button class="tab-btn" onclick="switchTab('performance')">
                    <i class="fas fa-chart-line"></i> Performance
                </button>
                <button class="tab-btn" onclick="switchTab('flaky')">
                    <i class="fas fa-exclamation-triangle"></i> Flaky Tests
                </button>
                <button class="tab-btn" onclick="switchTab('coverage')">
                    <i class="fas fa-shield-alt"></i> Coverage
                </button>
                <button class="tab-btn" onclick="switchTab('memory')">
                    <i class="fas fa-memory"></i> Memory
                </button>
                <button class="tab-btn" onclick="switchTab('parallel')">
                    <i class="fas fa-server"></i> Parallel
                </button>
            </div>
            <div class="tab-content">
                <div id="overviewContent" class="tab-panel active">
                    ${generateTestFilesStructure(results)}
                </div>
                <div id="testsContent" class="tab-panel">
                    ${generateTestCards(results)}
                </div>
                <div id="performanceContent" class="tab-panel">
                    ${generatePerformanceContent()}
                </div>
                <div id="flakyContent" class="tab-panel">
                    ${generateFlakyTestsContent()}
                </div>
                <div id="coverageContent" class="tab-panel">
                    ${generateCoverageContent()}
                </div>
                <div id="memoryContent" class="tab-panel">
                    ${generateMemoryContent()}
                </div>
                <div id="parallelContent" class="tab-panel">
                    ${generateParallelContent()}
                </div>
            </div>
        </div>
    </div>`;
}

function generatePerformanceContent() {
  return `
    <div class="performance-content">
        <div class="section-header">
            <h2><i class="fas fa-chart-line"></i> Performance Analytics</h2>
        </div>
        <div class="charts-grid">
            <div class="chart-container">
                <h3>Test Duration Distribution</h3>
                <canvas id="performanceChart"></canvas>
            </div>
            <div class="chart-container">
                <h3>Performance Trends</h3>
                <canvas id="trendsChart"></canvas>
            </div>
        </div>
    </div>`;
}

function generateFlakyTestsContent() {
  return `
    <div class="flaky-content">
        <div class="section-header">
            <h2><i class="fas fa-exclamation-triangle"></i> Flaky Test Analysis</h2>
        </div>
        <div class="flaky-overview">
            <p>Analysis of test stability and reliability patterns</p>
        </div>
    </div>`;
}

function generateCoverageContent() {
  return `
    <div class="coverage-content">
        <div class="section-header">
            <h2><i class="fas fa-shield-alt"></i> Code Coverage</h2>
        </div>
        <div class="coverage-overview">
            <p>Code coverage analysis and metrics</p>
        </div>
    </div>`;
}

function generateMemoryContent() {
  return `
    <div class="memory-content">
        <div class="section-header">
            <h2><i class="fas fa-memory"></i> Memory Analytics</h2>
        </div>
        <div class="memory-overview">
            <p>Memory usage patterns and leak detection</p>
        </div>
    </div>`;
}

function generateParallelContent() {
  return `
    <div class="parallel-content">
        <div class="section-header">
            <h2><i class="fas fa-server"></i> Parallel Execution</h2>
        </div>
        <div class="parallel-overview">
            <p>Worker distribution and parallel execution metrics</p>
        </div>
    </div>`;
}