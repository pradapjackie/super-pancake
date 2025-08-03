/**
 * Base HTML template for the test report
 * Generates the core HTML structure without inline CSS
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '../..');

export function generateSelfContainedTemplate(summary, results) {
  // Read and embed all CSS and JavaScript files from package directory
  const cssContent = fs.readFileSync(path.join(packageRoot, 'reporter/styles/reportStyles.css'), 'utf8');
  const dataProcessingJs = fs.readFileSync(path.join(packageRoot, 'reporter/utils/dataProcessing.js'), 'utf8');
  const tabNavigationJs = fs.readFileSync(path.join(packageRoot, 'reporter/utils/tabNavigation.js'), 'utf8');
  const filterUtilsJs = fs.readFileSync(path.join(packageRoot, 'reporter/utils/filterUtils.js'), 'utf8');
  const chartUtilsJs = fs.readFileSync(path.join(packageRoot, 'reporter/charts/chartUtils.js'), 'utf8');
  const overviewTabJs = fs.readFileSync(path.join(packageRoot, 'reporter/templates/overviewTab.js'), 'utf8');
  const performanceTabJs = fs.readFileSync(path.join(packageRoot, 'reporter/templates/performanceTab.js'), 'utf8');
  const flakyTabJs = fs.readFileSync(path.join(packageRoot, 'reporter/templates/flakyTab.js'), 'utf8');
  const coverageTabJs = fs.readFileSync(path.join(packageRoot, 'reporter/templates/coverageTab.js'), 'utf8');
  const memoryTabJs = fs.readFileSync(path.join(packageRoot, 'reporter/templates/memoryTab.js'), 'utf8');
  const parallelTabJs = fs.readFileSync(path.join(packageRoot, 'reporter/templates/parallelTab.js'), 'utf8');
  
  // Use the passed results data instead of reading the raw JSON file
  const testDataJson = JSON.stringify(results || [], null, 2);

  // Format duration helper function for individual tests
  const formatDuration = (duration) => {
    const ms = duration || 0;
    
    // For values >= 1 second, show in seconds
    if (ms >= 1000) {
      return (ms / 1000).toFixed(2) + 's';
    }
    
    // For smaller values, show in milliseconds
    return (Math.round(ms * 100) / 100).toFixed(2) + 'ms';
  };

  // Format total duration with minutes and seconds for larger values
  const formatTotalDuration = (duration) => {
    const ms = duration || 0;
    
    // For values >= 60 seconds, show in minutes and seconds format
    if (ms >= 60000) {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}m ${seconds}s`;
    }
    
    // For values >= 10 seconds, show in seconds with 1 decimal
    if (ms >= 10000) {
      return (ms / 1000).toFixed(1) + 's';
    }
    
    // For values >= 1 second, show in seconds with 2 decimals
    if (ms >= 1000) {
      return (ms / 1000).toFixed(2) + 's';
    }
    
    // For smaller values, show in milliseconds
    return (Math.round(ms * 100) / 100).toFixed(2) + 'ms';
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🥞 Super Pancake Test Report</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <style>
        ${cssContent}
    </style>
</head>
<body>
    <div class="trends-dashboard-content">
        <div class="container">
            <header class="header">
                <div class="logo">
                    <i class="fas fa-layer-group"></i>
                    <h1>Super Pancake Test Report</h1>
                </div>
                <p class="subtitle">Comprehensive Test Analytics & Performance Insights</p>
                <div class="header-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString()}</span>
                    <span><i class="fas fa-clock"></i> ${new Date().toLocaleTimeString()}</span>
                    <span><i class="fas fa-code-branch"></i> ${process.env.CI_BRANCH || 'main'}</span>
                </div>
                <div class="theme-toggle">
                    <button id="themeToggle" onclick="toggleTheme()">
                        <i class="fas fa-moon"></i>
                        <span>Dark Mode</span>
                    </button>
                </div>
            </header>
            
            <div class="dashboard">
                <div class="summary-grid">
                    <div class="summary-card total">
                        <div class="card-icon">
                            <i class="fas fa-list-check"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary?.totalTests || 0}</h3>
                            <p>Total Tests</p>
                        </div>
                    </div>
                    <div class="summary-card passed">
                        <div class="card-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary?.passedTests || 0}</h3>
                            <p>Passed</p>
                        </div>
                    </div>
                    <div class="summary-card failed">
                        <div class="card-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary?.failedTests || 0}</h3>
                            <p>Failed</p>
                        </div>
                    </div>
                    <div class="summary-card skipped">
                        <div class="card-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary?.skippedTests || 0}</h3>
                            <p>Skipped</p>
                        </div>
                    </div>
                    <div class="summary-card success-rate">
                        <div class="card-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary?.totalTests > 0 ? Math.round((summary.passedTests / summary.totalTests) * 100) : 0}%</h3>
                            <p>Success Rate</p>
                        </div>
                    </div>
                    <div class="summary-card duration">
                        <div class="card-icon">
                            <i class="fas fa-stopwatch"></i>
                        </div>
                        <div class="card-content">
                            <h3>${formatTotalDuration(summary?.totalDuration || 0)}</h3>
                            <p>Total Duration</p>
                        </div>
                    </div>
                </div>
                
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-segment passed" style="width: ${summary?.totalTests > 0 ? (summary.passedTests / summary.totalTests) * 100 : 0}%"></div>
                        <div class="progress-segment failed" style="width: ${summary?.totalTests > 0 ? (summary.failedTests / summary.totalTests) * 100 : 0}%"></div>
                        <div class="progress-segment skipped" style="width: ${summary?.totalTests > 0 ? (summary.skippedTests / summary.totalTests) * 100 : 0}%"></div>
                    </div>
                    <div class="progress-labels">
                        <span class="label passed">${summary?.passedTests || 0} Passed</span>
                        <span class="label failed">${summary?.failedTests || 0} Failed</span>
                        <span class="label skipped">${summary?.skippedTests || 0} Skipped</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="analytics-dashboard">
            <nav class="tab-navigation">
                <button class="tab-btn active" onclick="switchTab('overview')">
                    <i class="fas fa-chart-pie"></i> Overview
                </button>
                <button class="tab-btn" onclick="switchTab('performance')">
                    <i class="fas fa-tachometer-alt"></i> Performance
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
                    <i class="fas fa-sitemap"></i> Parallel
                </button>
                <button class="tab-btn" onclick="switchTab('results')">
                    <i class="fas fa-list"></i> All Results
                </button>
            </nav>

            <!-- Tab Content -->
            <div class="tab-content">
                <!-- Overview Tab -->
                <div id="overviewTab" class="tab-panel active">
                    <div class="test-results-overview">
                        <div class="container">
                            <div class="overview-header">
                                <h2>
                                    <i class="fas fa-list-ul"></i>
                                    Test Results Overview
                                </h2>
                                <div class="overview-controls">
                                    <input type="text" id="testFileSearch" placeholder="Search test files..." onkeyup="filterTestFiles()">
                                    <button class="control-btn" onclick="expandAllFiles()">
                                        <i class="fas fa-expand"></i> Expand All
                                    </button>
                                    <button class="control-btn" onclick="collapseAllFiles()">
                                        <i class="fas fa-compress"></i> Collapse All
                                    </button>
                                </div>
                            </div>
                            <div class="test-files-overview">
                                <div class="test-files-container"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Performance Tab -->
                <div id="performanceTab" class="tab-panel">
                    <div id="performanceContent"></div>
                </div>

                <!-- Flaky Tab -->
                <div id="flakyTab" class="tab-panel">
                    <div id="flakyContent"></div>
                </div>

                <!-- Coverage Tab -->
                <div id="coverageTab" class="tab-panel">
                    <div id="coverageContent"></div>
                </div>

                <!-- Memory Tab -->
                <div id="memoryTab" class="tab-panel">
                    <div id="memoryContent"></div>
                </div>

                <!-- Parallel Tab -->
                <div id="parallelTab" class="tab-panel">
                    <div id="parallelContent"></div>
                </div>

                <!-- Results Tab -->
                <div id="resultsTab" class="tab-panel">
                    <div id="resultsContent"></div>
                </div>
            </div>
        </div>
        
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-info">
                        <p><strong>🥞 Super Pancake Automation Framework v2.8.0</strong></p>
                        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                    </div>
                    <div class="footer-links">
                        <a href="https://github.com/your-repo/automation-framework" target="_blank">
                            <i class="fab fa-github"></i> GitHub
                        </a>
                        <a href="#" onclick="downloadReport()">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    </div>

    <!-- Embedded Test Data -->
    <script>
        // Embedded test data - no need to fetch from external file
        window.embeddedTestData = ${testDataJson};
        console.log('📊 Embedded test data loaded:', window.embeddedTestData.length, 'tests');
    </script>

    <!-- Embedded JavaScript -->
    <script>
        // Custom loadTestData function for embedded data
        function loadTestData() {
            try {
                console.log('📊 Loading embedded test data...');
                const testData = window.embeddedTestData || [];
                
                // Process and set the data
                window.allTests = testData;
                window.filteredTests = [...testData];
                
                // Group tests by file for overview
                window.testsByFile = groupTestsByFile(testData);
                
                // Set data loaded flag
                window.dataLoaded = true;
                
                console.log('✅ Test data loaded successfully:', testData.length, 'tests');
                
                // Initialize the report (will be called later)
                
                return testData;
            } catch (error) {
                console.error('❌ Failed to load embedded test data:', error);
                window.allTests = [];
                window.filteredTests = [];
                window.testsByFile = {};
                window.dataLoaded = true;
                
                // Still initialize report even with no data
                if (typeof initializeReport === 'function') {
                    initializeReport();
                }
                
                return [];
            }
        }
        
        // Add missing helper functions
        window.isDataLoaded = function() {
            return window.dataLoaded === true;
        };
        
        window.getAllTests = function() {
            return window.allTests || [];
        };
        
        window.setFilteredTests = function(tests) {
            window.filteredTests = tests;
        };
        
        window.getFilteredTests = function() {
            return window.filteredTests || [];
        };
        
        window.getCurrentTab = function() {
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab && activeTab.onclick) {
                const onclickStr = activeTab.getAttribute('onclick');
                const match = onclickStr.match(/switchTab\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)/);
                return match ? match[1] : 'overview';
            }
            return 'overview';
        };
        
        // Initialize the report - render all tab content
        window.initializeReport = function() {
            console.log('🎯 Initializing report tabs...');
            
            const testData = window.getAllTests();
            console.log('📊 Test data in initializeReport:', testData ? testData.length : 'No data', 'tests');
            console.log('📊 Functions available:', {
                renderTestFiles: typeof renderTestFiles,
                renderPerformanceTab: typeof renderPerformanceTab,
                renderFlakyTab: typeof renderFlakyTab,
                renderMemoryTab: typeof renderMemoryTab,
                renderParallelTab: typeof renderParallelTab,
                renderResultsTab: typeof renderResultsTab,
                groupTestsByFile: typeof groupTestsByFile
            });
            
            // Render overview tab
            if (typeof renderTestFiles === 'function') {
                console.log('🔄 Rendering overview tab...');
                renderTestFiles();
            } else {
                console.error('❌ renderTestFiles function not found');
            }
            
            // Render other tabs with data
            if (testData && testData.length > 0) {
                // Performance tab
                if (typeof renderPerformanceTab === 'function') {
                    renderPerformanceTab(testData);
                }
                
                // Flaky tests tab  
                if (typeof renderFlakyTab === 'function') {
                    renderFlakyTab(testData);
                }
                
                // Memory tab
                if (typeof renderMemoryTab === 'function') {
                    renderMemoryTab(testData);
                }
                
                // Parallel tab
                if (typeof renderParallelTab === 'function') {
                    renderParallelTab(testData);
                }
                
                // Results tab
                if (typeof renderResultsTab === 'function') {
                    renderResultsTab(testData);
                }
                
                // Coverage tab (if coverage data exists)
                const hasCoverage = testData.some(test => test.coverageData);
                if (hasCoverage && typeof renderCoverageTab === 'function') {
                    renderCoverageTab(testData);
                } else {
                    const coverageContent = document.getElementById('coverageContent');
                    if (coverageContent) {
                        coverageContent.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No coverage data available</div>';
                    }
                }
            }
            
            console.log('✅ Report tabs initialized');
        };

        // Include data processing utilities but exclude original loadTestData
        ${dataProcessingJs.replace(/async function loadTestData\(\)[\s\S]*?^}/gm, '').replace(/\/\/ Export.*loadTestData.*$/gm, '')}
    </script>
    <script>
        ${tabNavigationJs}
    </script>
    <script>
        ${filterUtilsJs}
    </script>
    <script>
        ${chartUtilsJs}
    </script>
    <script>
        ${overviewTabJs}
    </script>
    <script>
        ${performanceTabJs}
    </script>
    <script>
        ${flakyTabJs}
    </script>
    <script>
        ${coverageTabJs}
    </script>
    <script>
        ${memoryTabJs}
    </script>
    <script>
        ${parallelTabJs}
    </script>
    
    <script>
        // Initialize the report when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Starting Super Pancake Test Report...');
            
            // Initialize theme first
            initializeTheme();
            
            // Add a small delay to ensure all scripts are loaded
            setTimeout(() => {
                console.log('🔄 Delayed initialization starting...');
                loadTestData();
                
                // Initialize report after all scripts are loaded
                setTimeout(() => {
                    if (typeof initializeReport === 'function') {
                        console.log('🎯 Calling initializeReport...');
                        initializeReport();
                    } else {
                        console.error('❌ initializeReport function not found');
                    }
                }, 100);
            }, 200);
        });
    </script>
</body>
</html>`;
}

export function generateBaseTemplate(summary, results) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🥞 Super Pancake Test Report</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link href="./reporter/styles/reportStyles.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
</head>
<body>
    <div class="trends-dashboard-content">
        <div class="container">
            <header class="header">
                <div class="logo">
                    <i class="fas fa-layer-group"></i>
                    <h1>Super Pancake Test Report</h1>
                </div>
                <p class="subtitle">Comprehensive Test Analytics & Performance Insights</p>
                <div class="header-meta">
                    <span><i class="fas fa-calendar"></i> ${new Date().toLocaleDateString()}</span>
                    <span><i class="fas fa-clock"></i> ${new Date().toLocaleTimeString()}</span>
                    <span><i class="fas fa-code-branch"></i> ${process.env.CI_BRANCH || 'main'}</span>
                </div>
                <div class="theme-toggle">
                    <button id="themeToggle" onclick="toggleTheme()">
                        <i class="fas fa-moon"></i>
                        <span>Dark Mode</span>
                    </button>
                </div>
            </header>
            
            <div class="dashboard">
                <div class="summary-grid">
                    <div class="summary-card total">
                        <div class="card-icon">
                            <i class="fas fa-list-check"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary.totalTests}</h3>
                            <p>Total Tests</p>
                        </div>
                    </div>
                    <div class="summary-card passed">
                        <div class="card-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary.passedTests}</h3>
                            <p>Passed</p>
                        </div>
                    </div>
                    <div class="summary-card failed">
                        <div class="card-icon">
                            <i class="fas fa-times-circle"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary.failedTests}</h3>
                            <p>Failed</p>
                        </div>
                    </div>
                    <div class="summary-card skipped">
                        <div class="card-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="card-content">
                            <h3>${summary.skippedTests}</h3>
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
                            <h3>${formatTotalDuration(summary.totalDuration)}</h3>
                            <p>Total Duration</p>
                        </div>
                    </div>
                </div>
                
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-segment passed" style="width: ${(summary.passedTests / summary.totalTests) * 100}%"></div>
                        <div class="progress-segment failed" style="width: ${(summary.failedTests / summary.totalTests) * 100}%"></div>
                        <div class="progress-segment skipped" style="width: ${(summary.skippedTests / summary.totalTests) * 100}%"></div>
                    </div>
                    <div class="progress-labels">
                        <span class="label passed">${summary.passedTests} Passed</span>
                        <span class="label failed">${summary.failedTests} Failed</span>
                        <span class="label skipped">${summary.skippedTests} Skipped</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="analytics-dashboard">
            <nav class="tab-navigation">
                <button class="tab-btn active" onclick="switchTab('overview')">
                    <i class="fas fa-chart-pie"></i> Overview
                </button>
                <button class="tab-btn" onclick="switchTab('performance')">
                    <i class="fas fa-tachometer-alt"></i> Performance
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
                    <i class="fas fa-sitemap"></i> Parallel
                </button>
                <button class="tab-btn" onclick="switchTab('results')">
                    <i class="fas fa-list"></i> All Results
                </button>
            </nav>

            <!-- Tab Content -->
            <div class="tab-content">
                <!-- Overview Tab -->
                <div id="overviewTab" class="tab-panel active">
                    <div class="test-results-overview">
                        <div class="container">
                            <div class="overview-header">
                                <h2>
                                    <i class="fas fa-list-ul"></i>
                                    Test Results Overview
                                </h2>
                                <div class="overview-controls">
                                    <input type="text" id="testFileSearch" placeholder="Search test files..." onkeyup="filterTestFiles()">
                                    <button class="control-btn" onclick="expandAllFiles()">
                                        <i class="fas fa-expand"></i> Expand All
                                    </button>
                                    <button class="control-btn" onclick="collapseAllFiles()">
                                        <i class="fas fa-compress"></i> Collapse All
                                    </button>
                                </div>
                            </div>
                            <div class="test-files-overview">
                                <div class="test-files-container"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Performance Tab -->
                <div id="performanceTab" class="tab-panel">
                    <div id="performanceContent"></div>
                </div>

                <!-- Flaky Tab -->
                <div id="flakyTab" class="tab-panel">
                    <div id="flakyContent"></div>
                </div>

                <!-- Coverage Tab -->
                <div id="coverageTab" class="tab-panel">
                    <div id="coverageContent"></div>
                </div>

                <!-- Memory Tab -->
                <div id="memoryTab" class="tab-panel">
                    <div id="memoryContent"></div>
                </div>

                <!-- Parallel Tab -->
                <div id="parallelTab" class="tab-panel">
                    <div id="parallelContent"></div>
                </div>

                <!-- Results Tab -->
                <div id="resultsTab" class="tab-panel">
                    <div id="resultsContent"></div>
                </div>
            </div>
        </div>
        
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-info">
                        <p><strong>🥞 Super Pancake Automation Framework v2.8.0</strong></p>
                        <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                    </div>
                    <div class="footer-links">
                        <a href="https://github.com/your-repo/automation-framework" target="_blank">
                            <i class="fab fa-github"></i> GitHub
                        </a>
                        <a href="#" onclick="downloadReport()">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    </div>

    <!-- Scripts will be loaded here -->
    <script src="./reporter/utils/dataProcessing.js"></script>
    <script src="./reporter/utils/tabNavigation.js"></script>
    <script src="./reporter/utils/filterUtils.js"></script>
    <script src="./reporter/charts/chartUtils.js"></script>
    <script src="./reporter/templates/overviewTab.js"></script>
    <script src="./reporter/templates/performanceTab.js"></script>
    <script src="./reporter/templates/flakyTab.js"></script>
    <script src="./reporter/templates/coverageTab.js"></script>
    <script src="./reporter/templates/memoryTab.js"></script>
    <script src="./reporter/templates/parallelTab.js"></script>
    
    <script>
        // Initialize the report when DOM is loaded
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Starting Super Pancake Test Report...');
            initializeTheme();
            loadTestData();
        });
    </script>
</body>
</html>`;
}

export default generateBaseTemplate;