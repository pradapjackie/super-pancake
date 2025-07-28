/**
 * Chart Utilities
 * Common chart functions and configurations
 */

/**
 * Default chart configuration
 */
window.defaultChartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top'
        }
    },
    scales: {
        y: {
            beginAtZero: true
        }
    }
};

/**
 * Safely create chart context
 */
function getChartContext(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.warn(`❌ Canvas element "${canvasId}" not found`);
        return null;
    }
    return canvas.getContext('2d');
}

/**
 * Destroy existing chart if it exists
 */
function destroyChart(chartInstance) {
    if (chartInstance && typeof chartInstance.destroy === 'function') {
        chartInstance.destroy();
    }
}

// Export functions globally
window.getChartContext = getChartContext;
window.destroyChart = destroyChart;