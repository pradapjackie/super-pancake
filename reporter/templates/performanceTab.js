/**
 * Performance Tab Module
 * Handles rendering performance analytics and charts
 */

function renderPerformanceTab(testData) {
    const container = document.getElementById('performanceContent');
    if (!container) {
        console.error('❌ Performance container not found');
        return;
    }

    const performanceMetrics = analyzePerformanceData(testData);
    
    container.innerHTML = `
        <div class="performance-dashboard">
            <div class="performance-summary">
                <h2><i class="fas fa-tachometer-alt"></i> Performance Analytics</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Average Duration</h3>
                        <div class="metric-value">${formatDuration(performanceMetrics.avgDuration)}</div>
                    </div>
                    <div class="metric-card">
                        <h3>Slowest Test</h3>
                        <div class="metric-value">${performanceMetrics.slowestTest?.testName || 'N/A'}</div>
                        <div class="metric-detail">${formatDuration(performanceMetrics.slowestTest?.duration || 0)}</div>
                    </div>
                    <div class="metric-card">
                        <h3>CPU Usage</h3>
                        <div class="metric-value">${performanceMetrics.avgCpuUsage}%</div>
                    </div>
                    <div class="metric-card">
                        <h3>Network Time</h3>
                        <div class="metric-value">${formatDuration(performanceMetrics.avgNetworkTime)}</div>
                    </div>
                </div>
            </div>
            
            <div class="performance-charts">
                <div class="chart-container">
                    <canvas id="performanceChart" width="400" height="200"></canvas>
                </div>
            </div>
            
            <div class="slowest-tests">
                <h3><i class="fas fa-hourglass-half"></i> Slowest Tests</h3>
                <div class="slowest-tests-grid">
                    ${performanceMetrics.slowestTests.map((test, index) => {
                        const testName = test.testName || test.description || 'Unknown Test';
                        const duration = test.duration || 0;
                        const status = test.status || 'unknown';
                        const maxDuration = performanceMetrics.slowestTests[0]?.duration || 1;
                        const barWidth = Math.min((duration / maxDuration) * 100, 100);
                        
                        return `
                        <div class="slow-test-card ${index < 3 ? 'top-slow' : ''}" data-test-rank="${index + 1}">
                            <div class="test-rank">#${index + 1}</div>
                            <div class="test-info">
                                <div class="test-name" title="${escapeHtml(testName)}">${escapeHtml(testName)}</div>
                                <div class="test-details">
                                    <span class="test-duration">${formatDuration(duration)}</span>
                                    <span class="test-status ${status.toLowerCase()}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                </div>
                            </div>
                            <div class="performance-indicator">
                                <div class="duration-bar">
                                    <div class="bar-fill" style="width: ${barWidth}%" title="${formatDuration(duration)}"></div>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    // Render performance chart
    renderPerformanceChart(performanceMetrics);
    
    console.log('✅ Performance tab rendered');
}

function analyzePerformanceData(testData) {
    const durations = testData.map(test => test.duration || 0);
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length * 100) / 100 : 0;
    
    const slowestTest = testData.reduce((slowest, test) => {
        return (test.duration || 0) > (slowest?.duration || 0) ? test : slowest;
    }, null);
    
    const slowestTests = [...testData]
        .filter(test => test.duration)
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 10);
    
    const performanceMetrics = testData.filter(test => test.performanceMetrics);
    const avgCpuUsage = performanceMetrics.length > 0 ? 
        Math.round(performanceMetrics.reduce((sum, test) => sum + (test.performanceMetrics.cpuUsage || 0), 0) / performanceMetrics.length) : 0;
    
    const avgNetworkTime = performanceMetrics.length > 0 ? 
        Math.round(performanceMetrics.reduce((sum, test) => sum + (test.performanceMetrics.networkTime || 0), 0) / performanceMetrics.length) : 0;
    
    return {
        avgDuration,
        slowestTest,
        slowestTests,
        avgCpuUsage,
        avgNetworkTime
    };
}

function renderPerformanceChart(metrics) {
    const ctx = document.getElementById('performanceChart');
    if (!ctx || !window.Chart) return;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: metrics.slowestTests.slice(0, 5).map(test => test.testName.substring(0, 20) + '...'),
            datasets: [{
                label: 'Duration (ms)',
                data: metrics.slowestTests.slice(0, 5).map(test => test.duration),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Top 5 Slowest Tests'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Duration (ms)'
                    }
                }
            }
        }
    });
}

// Export functions globally
window.renderPerformanceTab = renderPerformanceTab;
window.analyzePerformanceData = analyzePerformanceData;

function formatDuration(duration) {
    const ms = duration || 0;
    
    // For values >= 60 seconds, show in minutes and seconds format
    if (ms >= 60000) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}m ${seconds}s`;
    }
    
    // For values >= 1 second, show in seconds
    if (ms >= 1000) {
        return (ms / 1000).toFixed(2) + 's';
    }
    
    // For smaller values, show in milliseconds
    return (Math.round(ms * 100) / 100).toFixed(2) + 'ms';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('📊 Performance tab module loaded');