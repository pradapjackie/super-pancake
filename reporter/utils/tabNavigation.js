/**
 * Tab Navigation Utilities
 * Handles tab switching and content management
 */

let currentTab = 'overview';

/**
 * Switch between different tabs in the analytics dashboard
 */
function switchTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the clicked tab button
    const tabButton = document.querySelector(`[onclick*='switchTab(\\'${tabName}\\')']`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const targetPanel = document.getElementById(tabName + 'Tab');
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
    
    currentTab = tabName;
    
    // Initialize tab-specific content if needed
    initializeTabContent(tabName);
    
    // Reinitialize charts for the new tab
    setTimeout(() => reinitializeChartsForTab(tabName), 100);
}

/**
 * Initialize content for specific tabs
 */
function initializeTabContent(tabName) {
    if (!window.isDataLoaded()) {
        console.log('⏳ Data not loaded yet, skipping tab initialization');
        return;
    }

    switch (tabName) {
        case 'overview':
            // Overview content is already rendered by renderTestFiles
            break;
        case 'performance':
            if (typeof initializePerformanceTab === 'function') {
                initializePerformanceTab();
            }
            break;
        case 'flaky':
            if (typeof initializeFlakyTab === 'function') {
                initializeFlakyTab();
            }
            break;
        case 'coverage':
            if (typeof initializeCoverageTab === 'function') {
                initializeCoverageTab();
            }
            break;
        case 'memory':
            if (typeof initializeMemoryTab === 'function') {
                initializeMemoryTab();
            }
            break;
        case 'parallel':
            if (typeof initializeParallelTab === 'function') {
                initializeParallelTab();
            }
            break;
        case 'results':
            if (typeof initializeResultsTab === 'function') {
                initializeResultsTab();
            }
            break;
    }
}

/**
 * Reinitialize charts when switching tabs to prevent memory leaks
 */
function reinitializeChartsForTab(tabName) {
    console.log('🔄 Reinitializing charts for tab:', tabName);
    
    // Destroy existing charts first to prevent memory leaks
    switch (tabName) {
        case 'overview':
            // Overview tab doesn't have charts
            if (window.trendsChart) window.trendsChart.destroy();
            console.log('📋 Overview tab switched - no charts to initialize');
            break;
        case 'performance':
            // Destroy existing performance charts safely
            if (window.performanceTrendChart && typeof window.performanceTrendChart.destroy === 'function') {
                window.performanceTrendChart.destroy();
                window.performanceTrendChart = null;
            }
            if (window.performanceDistChart && typeof window.performanceDistChart.destroy === 'function') {
                window.performanceDistChart.destroy();
                window.performanceDistChart = null;
            }
            if (window.avgDurationTrendChart && typeof window.avgDurationTrendChart.destroy === 'function') {
                window.avgDurationTrendChart.destroy();
                window.avgDurationTrendChart = null;
            }
            if (window.regressionChart && typeof window.regressionChart.destroy === 'function') {
                window.regressionChart.destroy();
                window.regressionChart = null;
            }
            if (typeof initializePerformanceCharts === 'function') {
                setTimeout(() => {
                    console.log('🔄 Initializing performance charts after tab switch...');
                    initializePerformanceCharts();
                }, 100);
            }
            break;
        case 'flaky':
            // Destroy existing flaky charts
            if (window.stabilityTrendChart && typeof window.stabilityTrendChart.destroy === 'function') {
                window.stabilityTrendChart.destroy();
                window.stabilityTrendChart = null;
            }
            if (window.flakinessChart && typeof window.flakinessChart.destroy === 'function') {
                window.flakinessChart.destroy();
                window.flakinessChart = null;
            }
            if (window.passRateHistoryChart && typeof window.passRateHistoryChart.destroy === 'function') {
                window.passRateHistoryChart.destroy();
                window.passRateHistoryChart = null;
            }
            if (window.failurePatternChart && typeof window.failurePatternChart.destroy === 'function') {
                window.failurePatternChart.destroy();
                window.failurePatternChart = null;
            }
            if (typeof initializeFlakyCharts === 'function') {
                setTimeout(() => initializeFlakyCharts(), 100);
            }
            break;
        case 'coverage':
            // Destroy existing coverage charts
            if (window.coverageBreakdownChart && typeof window.coverageBreakdownChart.destroy === 'function') {
                window.coverageBreakdownChart.destroy();
                window.coverageBreakdownChart = null;
            }
            if (window.coverageTrendsChart && typeof window.coverageTrendsChart.destroy === 'function') {
                window.coverageTrendsChart.destroy();
                window.coverageTrendsChart = null;
            }
            if (typeof initializeCoverageCharts === 'function') {
                setTimeout(() => initializeCoverageCharts(), 100);
            }
            break;
        case 'memory':
            // Destroy existing memory charts
            if (window.memoryDistributionChart && typeof window.memoryDistributionChart.destroy === 'function') {
                window.memoryDistributionChart.destroy();
                window.memoryDistributionChart = null;
            }
            if (window.memoryPerformanceChart && typeof window.memoryPerformanceChart.destroy === 'function') {
                window.memoryPerformanceChart.destroy();
                window.memoryPerformanceChart = null;
            }
            if (window.memoryTimelineChart && typeof window.memoryTimelineChart.destroy === 'function') {
                window.memoryTimelineChart.destroy();
                window.memoryTimelineChart = null;
            }
            if (typeof initializeMemoryCharts === 'function') {
                setTimeout(() => initializeMemoryCharts(), 100);
            }
            break;
        case 'parallel':
            // Destroy existing parallel charts
            if (window.executionModeChart && typeof window.executionModeChart.destroy === 'function') {
                window.executionModeChart.destroy();
                window.executionModeChart = null;
            }
            if (window.workerUtilizationChart && typeof window.workerUtilizationChart.destroy === 'function') {
                window.workerUtilizationChart.destroy();
                window.workerUtilizationChart = null;
            }
            if (window.workerTimelineChart && typeof window.workerTimelineChart.destroy === 'function') {
                window.workerTimelineChart.destroy();
                window.workerTimelineChart = null;
            }
            if (typeof initializeParallelCharts === 'function') {
                setTimeout(() => initializeParallelCharts(), 100);
            }
            break;
        case 'results':
            // Results tab typically doesn't have charts
            if (typeof initializeResultsView === 'function') {
                setTimeout(() => initializeResultsView(), 100);
            }
            break;
    }
}

/**
 * Get current active tab
 */
function getCurrentTab() {
    return currentTab;
}

/**
 * Navigate to a specific tab programmatically
 */
function navigateToTab(tabName) {
    if (typeof switchTab === 'function') {
        switchTab(tabName);
    }
}

/**
 * Check if a tab exists
 */
function tabExists(tabName) {
    return document.getElementById(tabName + 'Tab') !== null;
}

// Export functions globally
window.switchTab = switchTab;
window.initializeTabContent = initializeTabContent;
window.reinitializeChartsForTab = reinitializeChartsForTab;
window.getCurrentTab = getCurrentTab;
window.navigateToTab = navigateToTab;
window.tabExists = tabExists;