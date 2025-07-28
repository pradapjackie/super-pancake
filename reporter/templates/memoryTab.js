/**
 * Memory Tab Module
 * Handles rendering memory usage analytics
 */

function renderMemoryTab(testData) {
    const container = document.getElementById('memoryContent');
    if (!container) {
        console.error('❌ Memory container not found');
        return;
    }

    const memoryAnalysis = analyzeMemoryData(testData);
    
    container.innerHTML = `
        <div class="memory-dashboard">
            <div class="memory-summary">
                <h2><i class="fas fa-memory"></i> Memory Usage Analytics</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Peak Memory</h3>
                        <div class="metric-value">${memoryAnalysis.maxPeakMemory}MB</div>
                    </div>
                    <div class="metric-card">
                        <h3>Average Memory</h3>
                        <div class="metric-value">${memoryAnalysis.avgMemory}MB</div>
                    </div>
                    <div class="metric-card">
                        <h3>Memory Growth</h3>
                        <div class="metric-value">${memoryAnalysis.avgMemoryGrowth}MB</div>
                    </div>
                    <div class="metric-card">
                        <h3>GC Collections</h3>
                        <div class="metric-value">${memoryAnalysis.totalGcCount}</div>
                    </div>
                </div>
            </div>
            
            <div class="memory-tests">
                <h3>Tests with Highest Memory Usage</h3>
                <div class="memory-tests-list">
                    ${memoryAnalysis.highestMemoryTests.map(test => `
                        <div class="memory-test-item">
                            <span class="test-name">${test.testName}</span>
                            <span class="memory-usage">Peak: ${test.memoryMetrics?.peakMemory || 0}MB</span>
                            <span class="memory-growth">Growth: ${test.memoryMetrics?.memoryGrowth || 0}MB</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${memoryAnalysis.potentialLeaks.length > 0 ? `
                <div class="memory-leaks">
                    <h3>⚠️ Potential Memory Leaks</h3>
                    <div class="leaks-list">
                        ${memoryAnalysis.potentialLeaks.map(test => `
                            <div class="leak-item">
                                <strong>${test.testName}</strong>
                                <p>Memory growth: ${test.memoryMetrics?.memoryGrowth || 0}MB</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    console.log('✅ Memory tab rendered');
}

function analyzeMemoryData(testData) {
    const testsWithMemory = testData.filter(test => test.memoryMetrics);
    
    if (testsWithMemory.length === 0) {
        return {
            maxPeakMemory: 0,
            avgMemory: 0,
            avgMemoryGrowth: 0,
            totalGcCount: 0,
            highestMemoryTests: [],
            potentialLeaks: []
        };
    }
    
    const maxPeakMemory = Math.max(...testsWithMemory.map(test => test.memoryMetrics.peakMemory || 0));
    const avgMemory = Math.round(testsWithMemory.reduce((sum, test) => sum + (test.memoryMetrics.averageMemory || 0), 0) / testsWithMemory.length);
    const avgMemoryGrowth = Math.round(testsWithMemory.reduce((sum, test) => sum + (test.memoryMetrics.memoryGrowth || 0), 0) / testsWithMemory.length);
    const totalGcCount = testsWithMemory.reduce((sum, test) => sum + (test.memoryMetrics.gcCount || 0), 0);
    
    const highestMemoryTests = [...testsWithMemory]
        .sort((a, b) => (b.memoryMetrics?.peakMemory || 0) - (a.memoryMetrics?.peakMemory || 0))
        .slice(0, 10);
    
    const potentialLeaks = testsWithMemory.filter(test => 
        (test.memoryMetrics?.memoryGrowth || 0) > 5 || 
        (test.memoryMetrics?.potentialLeaks && test.memoryMetrics.potentialLeaks.length > 0)
    );
    
    return {
        maxPeakMemory,
        avgMemory,
        avgMemoryGrowth,
        totalGcCount,
        highestMemoryTests,
        potentialLeaks
    };
}

// Export functions globally
window.renderMemoryTab = renderMemoryTab;
window.analyzeMemoryData = analyzeMemoryData;

console.log('💾 Memory tab module loaded');