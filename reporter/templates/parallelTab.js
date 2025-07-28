/**
 * Parallel Execution Tab Module
 * Handles rendering parallel execution analytics
 */

function renderParallelTab(testData) {
    const container = document.getElementById('parallelContent');
    if (!container) {
        console.error('❌ Parallel container not found');
        return;
    }

    const parallelAnalysis = analyzeParallelData(testData);
    
    container.innerHTML = `
        <div class="parallel-dashboard">
            <div class="parallel-summary">
                <h2><i class="fas fa-sitemap"></i> Parallel Execution Analytics</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Workers Used</h3>
                        <div class="metric-value">${parallelAnalysis.workersUsed}</div>
                    </div>
                    <div class="metric-card">
                        <h3>Parallel Tests</h3>
                        <div class="metric-value">${parallelAnalysis.parallelTests}</div>
                    </div>
                    <div class="metric-card">
                        <h3>Sequential Tests</h3>
                        <div class="metric-value">${parallelAnalysis.sequentialTests}</div>
                    </div>
                    <div class="metric-card">
                        <h3>Avg Worker Load</h3>
                        <div class="metric-value">${parallelAnalysis.avgWorkerLoad}%</div>
                    </div>
                </div>
            </div>
            
            <div class="parallel-worker-list">
                <h3><i class="fas fa-users"></i> Worker Distribution</h3>
                <div class="worker-grid">
                    ${Object.entries(parallelAnalysis.workerDistribution).map(([workerId, count]) => `
                        <div class="parallel-worker-item">
                            <div class="worker-id">${workerId}</div>
                            <div class="worker-details">
                                <span class="worker-name">${workerId.replace('Worker ', '')}</span>
                                <span class="test-count">${count} tests</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="resource-contention-section">
                <h3><i class="fas fa-chart-line"></i> Resource Contention Analysis</h3>
                <div class="contention-grid">
                    <div class="contention-metric-card">
                        <div class="contention-icon cpu">
                            <i class="fas fa-microchip"></i>
                        </div>
                        <div class="contention-details">
                            <div class="contention-label">Average CPU Contention</div>
                            <div class="contention-value">${parallelAnalysis.avgContentions.cpu}%</div>
                        </div>
                    </div>
                    <div class="contention-metric-card">
                        <div class="contention-icon memory">
                            <i class="fas fa-memory"></i>
                        </div>
                        <div class="contention-details">
                            <div class="contention-label">Average Memory Contention</div>
                            <div class="contention-value">${parallelAnalysis.avgContentions.memory}%</div>
                        </div>
                    </div>
                    <div class="contention-metric-card">
                        <div class="contention-icon io">
                            <i class="fas fa-hdd"></i>
                        </div>
                        <div class="contention-details">
                            <div class="contention-label">Average I/O Contention</div>
                            <div class="contention-value">${parallelAnalysis.avgContentions.io}%</div>
                        </div>
                    </div>
                    <div class="contention-metric-card">
                        <div class="contention-icon network">
                            <i class="fas fa-network-wired"></i>
                        </div>
                        <div class="contention-details">
                            <div class="contention-label">Average Network Contention</div>
                            <div class="contention-value">${parallelAnalysis.avgContentions.network}%</div>
                        </div>
                    </div>
                </div>
            </div>
            
            ${parallelAnalysis.highContentionTests.length > 0 ? `
                <div class="high-contention-section">
                    <h3><i class="fas fa-exclamation-triangle"></i> High Resource Contention Tests</h3>
                    <div class="high-contention-grid">
                        ${parallelAnalysis.highContentionTests.map(test => `
                            <div class="high-contention-test-card">
                                <div class="test-header">
                                    <h4 class="test-title">${test.testName}</h4>
                                    <div class="worker-badge">${test.parallelMetrics?.workerId || 'Unknown'}</div>
                                </div>
                                <div class="contention-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">CPU:</span>
                                        <span class="stat-value cpu-${test.parallelMetrics?.resourceContention?.cpu > 70 ? 'high' : 'normal'}">${test.parallelMetrics?.resourceContention?.cpu || 0}%</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Memory:</span>
                                        <span class="stat-value memory-${test.parallelMetrics?.resourceContention?.memory > 70 ? 'high' : 'normal'}">${test.parallelMetrics?.resourceContention?.memory || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    console.log('✅ Parallel tab rendered');
}

function analyzeParallelData(testData) {
    const testsWithParallel = testData.filter(test => test.parallelMetrics);
    
    if (testsWithParallel.length === 0) {
        return {
            workersUsed: 0,
            parallelTests: 0,
            sequentialTests: testData.length,
            avgWorkerLoad: 0,
            workerDistribution: {},
            avgContentions: { cpu: 0, memory: 0, io: 0, network: 0 },
            highContentionTests: []
        };
    }
    
    const workers = new Set(testsWithParallel.map(test => test.parallelMetrics.workerId).filter(Boolean));
    const parallelTests = testsWithParallel.filter(test => test.parallelMetrics.isParallel).length;
    const sequentialTests = testsWithParallel.filter(test => !test.parallelMetrics.isParallel).length;
    
    const avgWorkerLoad = Math.round(
        testsWithParallel.reduce((sum, test) => sum + (test.parallelMetrics.workerLoad || 0), 0) / testsWithParallel.length
    );
    
    const workerDistribution = {};
    testsWithParallel.forEach(test => {
        const workerId = test.parallelMetrics.workerId || 'Unknown';
        workerDistribution[workerId] = (workerDistribution[workerId] || 0) + 1;
    });
    
    const contentionTests = testsWithParallel.filter(test => test.parallelMetrics.resourceContention);
    const avgContentions = {
        cpu: contentionTests.length > 0 ? Math.round(contentionTests.reduce((sum, test) => sum + (test.parallelMetrics.resourceContention.cpu || 0), 0) / contentionTests.length) : 0,
        memory: contentionTests.length > 0 ? Math.round(contentionTests.reduce((sum, test) => sum + (test.parallelMetrics.resourceContention.memory || 0), 0) / contentionTests.length) : 0,
        io: contentionTests.length > 0 ? Math.round(contentionTests.reduce((sum, test) => sum + (test.parallelMetrics.resourceContention.io || 0), 0) / contentionTests.length) : 0,
        network: contentionTests.length > 0 ? Math.round(contentionTests.reduce((sum, test) => sum + (test.parallelMetrics.resourceContention.network || 0), 0) / contentionTests.length) : 0
    };
    
    const highContentionTests = contentionTests.filter(test => {
        const contention = test.parallelMetrics.resourceContention;
        return (contention.cpu || 0) > 70 || (contention.memory || 0) > 70 || (contention.io || 0) > 70;
    });
    
    return {
        workersUsed: workers.size,
        parallelTests,
        sequentialTests,
        avgWorkerLoad,
        workerDistribution,
        avgContentions,
        highContentionTests
    };
}

// Export functions globally
window.renderParallelTab = renderParallelTab;
window.analyzeParallelData = analyzeParallelData;

console.log('🗳️ Parallel execution tab module loaded');