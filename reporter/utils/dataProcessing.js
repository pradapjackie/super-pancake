/**
 * Data Processing Utilities
 * Handles loading, sanitizing, and transforming test data
 */

// Global variables for data management
let allTests = [];
let filteredTests = [];
let dataLoaded = false;

/**
 * Load test data from external JSON file
 */
async function loadTestData() {
    try {
        console.log('📊 Loading test data...');
        // Try multiple possible paths for the data file
        const possiblePaths = [
            './automationTestData.json',
            'automationTestData.json',
            '/automationTestData.json'
        ];
        
        let response;
        let lastError;
        
        for (const path of possiblePaths) {
            try {
                response = await fetch(path);
                if (response.ok) {
                    console.log('✅ Found test data at:', path);
                    break;
                }
            } catch (error) {
                lastError = error;
                console.log('⚠️ Failed to load from:', path);
            }
        }
        
        if (!response || !response.ok) {
            throw new Error('Failed to load test data from any path. Status: ' + (response ? response.status : 'Network Error'));
        }
        
        const testData = await response.json();
        window.allTests = testData;
        window.testResults = testData; // Make results available globally for chart functions
        window.filteredTests = [...testData];
        window.dataLoaded = true;
        console.log('✅ Test data loaded successfully:', testData.length, 'tests');
        
        // Initialize the report after data is loaded
        initializeReport();
    } catch (error) {
        console.error('❌ Failed to load test data:', error);
        showDataLoadError(error.message);
    }
}

/**
 * Show error message when data loading fails
 */
function showDataLoadError(message) {
    const container = document.querySelector('.container');
    if (container) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--danger);">' +
            '<h2><i class="fas fa-exclamation-triangle"></i> Failed to Load Test Data</h2>' +
            '<p>' + message + '</p>' +
            '<p>Please ensure automationTestData.json is available in the same directory.</p>' +
            '</div>';
    }
}

/**
 * Calculate summary statistics from test data
 */
function calculateSummary(tests) {
    if (!tests || tests.length === 0) {
        return {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            successRate: 0,
            totalDuration: 0
        };
    }

    const totalTests = tests.length;
    const passedTests = tests.filter(test => test.status === 'passed').length;
    const failedTests = tests.filter(test => test.status === 'failed').length;
    const skippedTests = tests.filter(test => test.status === 'skipped').length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    const totalDuration = Math.round(tests.reduce((sum, test) => sum + (test.duration || 0), 0) * 100) / 100;

    return {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        successRate,
        totalDuration
    };
}

/**
 * Group tests by file for overview display
 * Includes deduplication logic to prioritize individual test entries with logs over suite entries
 */
function groupTestsByFile(tests) {
    const testsByFile = {};
    
    // First pass: collect all tests by file and test name
    const testsByFileAndName = {};
    
    tests.forEach(test => {
        const fileName = test.fileName || test.file || test.metadata?.testFile || 'Unknown File';
        const testName = test.testName || test.description || test.name || 'Unknown Test';
        
        if (!testsByFileAndName[fileName]) {
            testsByFileAndName[fileName] = {};
        }
        
        if (!testsByFileAndName[fileName][testName]) {
            testsByFileAndName[fileName][testName] = [];
        }
        
        testsByFileAndName[fileName][testName].push(test);
    });
    
    // Second pass: deduplicate by prioritizing individual test entries with logs
    Object.entries(testsByFileAndName).forEach(([fileName, testsByName]) => {
        if (!testsByFile[fileName]) {
            testsByFile[fileName] = [];
        }
        
        Object.entries(testsByName).forEach(([testName, duplicateTests]) => {
            if (duplicateTests.length === 1) {
                // No duplicates, add the single test
                testsByFile[fileName].push(duplicateTests[0]);
            } else {
                // Debug logging for deduplication
                console.log(`🔍 Deduplicating ${duplicateTests.length} entries for test: "${testName}" in file: "${fileName}"`);
                console.log(`   - Individual tests with logs: ${duplicateTests.filter(test => test.metadata?.individualTest && test.logs && test.logs.length > 0).length}`);
                console.log(`   - Individual tests without logs: ${duplicateTests.filter(test => test.metadata?.individualTest && (!test.logs || test.logs.length === 0)).length}`);
                console.log(`   - Suite tests with logs: ${duplicateTests.filter(test => !test.metadata?.individualTest && test.logs && test.logs.length > 0).length}`);
                console.log(`   - Suite tests without logs: ${duplicateTests.filter(test => !test.metadata?.individualTest && (!test.logs || test.logs.length === 0)).length}`);
                // Handle duplicates by prioritizing:
                // 1. Individual test entries (have metadata.individualTest flag) with logs
                // 2. Individual test entries without logs  
                // 3. Suite entries with logs
                // 4. Suite entries without logs
                
                const individualTestsWithLogs = duplicateTests.filter(test => 
                    test.metadata?.individualTest && test.logs && Array.isArray(test.logs) && test.logs.length > 0
                );
                
                const individualTestsWithoutLogs = duplicateTests.filter(test => 
                    test.metadata?.individualTest && (!test.logs || !Array.isArray(test.logs) || test.logs.length === 0)
                );
                
                const suiteTestsWithLogs = duplicateTests.filter(test => 
                    !test.metadata?.individualTest && test.logs && Array.isArray(test.logs) && test.logs.length > 0
                );
                
                const suiteTestsWithoutLogs = duplicateTests.filter(test => 
                    !test.metadata?.individualTest && (!test.logs || !Array.isArray(test.logs) || test.logs.length === 0)
                );
                
                // Pick the best test entry based on priority
                let selectedTest = null;
                
                if (individualTestsWithLogs.length > 0) {
                    selectedTest = individualTestsWithLogs[0];
                } else if (individualTestsWithoutLogs.length > 0) {
                    selectedTest = individualTestsWithoutLogs[0];
                } else if (suiteTestsWithLogs.length > 0) {
                    selectedTest = suiteTestsWithLogs[0];
                } else if (suiteTestsWithoutLogs.length > 0) {
                    selectedTest = suiteTestsWithoutLogs[0];
                } else {
                    // Fallback to first test if none match criteria
                    selectedTest = duplicateTests[0];
                }
                
                if (selectedTest) {
                    testsByFile[fileName].push(selectedTest);
                }
            }
        });
    });
    
    return testsByFile;
}

/**
 * Get performance metrics from test data
 */
function getPerformanceMetrics(tests) {
    if (!tests || tests.length === 0) {
        return {
            fastest: { duration: 0, testName: 'N/A' },
            slowest: { duration: 0, testName: 'N/A' },
            average: 0,
            efficiency: 100
        };
    }

    const durations = tests.map(test => test.duration || 0);
    const fastest = Math.min(...durations);
    const slowest = Math.max(...durations);
    const average = Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
    
    const fastestTest = tests.find(test => (test.duration || 0) === fastest);
    const slowestTest = tests.find(test => (test.duration || 0) === slowest);
    
    return {
        fastest: { 
            duration: fastest, 
            testName: fastestTest ? (fastestTest.testName || fastestTest.description) : 'N/A' 
        },
        slowest: { 
            duration: slowest, 
            testName: slowestTest ? (slowestTest.testName || slowestTest.description) : 'N/A' 
        },
        average,
        efficiency: Math.max(0, Math.round(((average - slowest) / average) * 100))
    };
}

/**
 * Get flaky test analysis
 */
function getFlakyTestAnalysis(tests) {
    if (!tests || tests.length === 0) {
        return {
            stable: 0,
            flaky: 0,
            unreliable: 0,
            stabilityScore: 100,
            flakyTests: []
        };
    }

    // Simple flakiness detection based on retry count and duration variance
    const flakyTests = tests.filter(test => {
        const isFlaky = (test.performanceMetrics?.retryCount > 0) || 
                       (test.performanceMetrics?.isFlaky === true) ||
                       (test.status === 'failed' && test.duration > 5000);
        return isFlaky;
    });

    const stable = tests.length - flakyTests.length;
    const stabilityScore = Math.round((stable / tests.length) * 100);

    return {
        stable,
        flaky: flakyTests.length,
        unreliable: flakyTests.filter(t => t.performanceMetrics?.retryCount > 2).length,
        stabilityScore,
        flakyTests: flakyTests.map(test => ({
            name: test.testName || test.description,
            retryCount: test.performanceMetrics?.retryCount || 0,
            duration: test.duration || 0,
            severity: test.performanceMetrics?.retryCount > 2 ? 'high' : 'medium'
        }))
    };
}

/**
 * Get memory usage analysis
 */
function getMemoryAnalysis(tests) {
    if (!tests || tests.length === 0) {
        return {
            peak: 0,
            average: 0,
            growth: 0,
            efficiency: 100,
            memoryData: []
        };
    }

    const memoryData = tests.map(test => ({
        testName: test.testName || test.description,
        peakMemory: test.memoryMetrics?.peakMemory || 0,
        averageMemory: test.memoryMetrics?.averageMemory || 0,
        memoryGrowth: test.memoryMetrics?.memoryGrowth || 0
    })).filter(data => data.peakMemory > 0);

    if (memoryData.length === 0) {
        return {
            peak: 0,
            average: 0,
            growth: 0,
            efficiency: 100,
            memoryData: []
        };
    }

    const peak = Math.max(...memoryData.map(d => d.peakMemory));
    const average = Math.round(memoryData.reduce((sum, d) => sum + d.averageMemory, 0) / memoryData.length);
    const growth = Math.max(...memoryData.map(d => d.memoryGrowth));

    return {
        peak,
        average,
        growth,
        efficiency: Math.max(0, Math.round(((peak - growth) / peak) * 100)),
        memoryData
    };
}

/**
 * Get parallel execution statistics
 */
function getParallelStats(tests) {
    if (!tests || tests.length === 0) {
        return {
            totalWorkers: 0,
            parallelTests: 0,
            sequentialTests: 0,
            speedup: '1.0x'
        };
    }

    const parallelTests = tests.filter(test => test.parallelMetrics?.isParallel === true).length;
    const sequentialTests = tests.length - parallelTests;
    const workers = new Set(tests.map(test => test.parallelMetrics?.workerId).filter(Boolean)).size;
    const speedup = workers > 0 ? (workers * 0.8).toFixed(1) + 'x' : '1.0x';

    return {
        totalWorkers: workers || 4, // Default to 4 if no worker data
        parallelTests,
        sequentialTests,
        speedup
    };
}

/**
 * Sanitize test results for safe JSON serialization
 */
function sanitizeResults(results) {
    return results.map(result => ({
        ...result,
        // Escape error messages in the main error field
        error: result.error && typeof result.error === 'string' ? 
            result.error.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'") : result.error
    }));
}

// Export functions for use in other modules
window.loadTestData = loadTestData;
window.calculateSummary = calculateSummary;
window.groupTestsByFile = groupTestsByFile;
window.getPerformanceMetrics = getPerformanceMetrics;
window.getFlakyTestAnalysis = getFlakyTestAnalysis;
window.getMemoryAnalysis = getMemoryAnalysis;
window.getParallelStats = getParallelStats;
window.sanitizeResults = sanitizeResults;

// Export data variables
window.getAllTests = () => window.allTests || [];
window.getFilteredTests = () => window.filteredTests || [];
window.setFilteredTests = (tests) => { window.filteredTests = tests; };
window.isDataLoaded = () => window.dataLoaded;