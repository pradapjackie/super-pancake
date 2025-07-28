/**
 * Flaky Tests Tab Module
 * Handles rendering flaky test detection and analysis
 */

function renderFlakyTab(testData) {
    const container = document.getElementById('flakyContent');
    if (!container) {
        console.error('❌ Flaky container not found');
        return;
    }

    const flakyTests = testData.filter(test => 
        test.performanceMetrics?.isFlaky || 
        test.performanceMetrics?.retryCount > 0
    );
    
    if (flakyTests.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success-color); margin-bottom: 1rem;"></i>
                <h3>No Flaky Tests Detected!</h3>
                <p>All tests are running consistently</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="flaky-dashboard">
            <div class="flaky-summary">
                <h2><i class="fas fa-exclamation-triangle"></i> Flaky Tests Analysis</h2>
                <p>Found ${flakyTests.length} potentially flaky tests</p>
            </div>
            
            <div class="flaky-tests-list">
                ${flakyTests.map(test => `
                    <div class="flaky-test-item">
                        <div class="test-info">
                            <h4>${test.testName}</h4>
                            <p>Retry Count: ${test.performanceMetrics?.retryCount || 0}</p>
                            <p>Duration: ${Math.round(test.duration || 0)}ms</p>
                        </div>
                        ${test.error ? `<div class="test-error">${test.error}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    console.log('✅ Flaky tab rendered');
}

function renderResultsTab(testData) {
    const container = document.getElementById('resultsContent');
    if (!container) {
        console.error('❌ Results container not found');
        return;
    }
    
    // Calculate summary stats
    const passed = testData.filter(t => t.status === 'passed').length;
    const failed = testData.filter(t => t.status === 'failed').length;
    const skipped = testData.filter(t => t.status === 'skipped').length;
    
    container.innerHTML = `
        <div class="all-results-dashboard">
            <div class="results-header">
                <h2><i class="fas fa-list"></i> All Test Results</h2>
                <div class="results-stats">
                    <div class="result-stat passed">
                        <span class="count">${passed}</span>
                        <span class="label">Passed</span>
                    </div>
                    <div class="result-stat failed">
                        <span class="count">${failed}</span>
                        <span class="label">Failed</span>
                    </div>
                    <div class="result-stat skipped">
                        <span class="count">${skipped}</span>
                        <span class="label">Skipped</span>
                    </div>
                    <div class="result-stat total">
                        <span class="count">${testData.length}</span>
                        <span class="label">Total</span>
                    </div>
                </div>
            </div>
            
            <div class="results-filters">
                <h3><i class="fas fa-filter"></i> Filters</h3>
                <div class="filter-controls">
                    <select id="statusFilter" onchange="filterResults()">
                        <option value="all">All Status</option>
                        <option value="passed">Passed Only</option>
                        <option value="failed">Failed Only</option>
                        <option value="skipped">Skipped Only</option>
                    </select>
                    <input type="text" id="testNameFilter" placeholder="Search test name..." onkeyup="filterResults()" />
                    <select id="fileFilter" onchange="filterResults()">
                        <option value="all">All Files</option>
                        ${[...new Set(testData.map(t => t.metadata?.testFile || 'Unknown'))].map(file => 
                            `<option value="${file}">${file.replace(/.*\//, '')}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            
            <div class="enhanced-results-table">
                <table id="resultsTable">
                    <thead>
                        <tr>
                            <th class="status-col">Status</th>
                            <th class="test-name-col">Test Name</th>
                            <th class="duration-col">Duration</th>
                            <th class="file-col">File</th>
                            <th class="environment-col">Environment</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${testData.map(test => `
                            <tr class="result-row test-${test.status}" data-status="${test.status}" data-file="${test.metadata?.testFile || 'Unknown'}" data-testname="${test.testName?.toLowerCase() || ''}">
                                <td class="status-cell">
                                    <span class="status-badge ${test.status}">
                                        <i class="${getStatusIcon(test.status)}"></i>
                                        ${test.status}
                                    </span>
                                </td>
                                <td class="test-name-cell">
                                    <div class="test-name-content">
                                        <span class="test-title">${test.testName}</span>
                                        ${test.tags && test.tags.length > 0 ? `
                                            <div class="test-tags">
                                                ${test.tags.slice(0, 2).map(tag => `<span class="test-tag">${tag}</span>`).join('')}
                                                ${test.tags.length > 2 ? `<span class="test-tag-more">+${test.tags.length - 2}</span>` : ''}
                                            </div>
                                        ` : ''}
                                    </div>
                                </td>
                                <td class="duration-cell">
                                    <span class="duration-badge ${getDurationClass(test.duration || 0)}">
                                        ${formatDuration(test.duration || 0)}
                                    </span>
                                </td>
                                <td class="file-cell">
                                    <span class="file-path" title="${test.metadata?.testFile || 'Unknown'}">
                                        ${(test.metadata?.testFile || 'Unknown').replace(/.*\//, '')}
                                    </span>
                                </td>
                                <td class="environment-cell">
                                    <span class="env-badge">${test.environment || 'Local'}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    console.log('✅ Results tab rendered');
}

function getStatusIcon(status) {
    switch (status) {
        case 'passed': return 'fas fa-check-circle';
        case 'failed': return 'fas fa-times-circle';
        case 'skipped': return 'fas fa-exclamation-triangle';
        default: return 'fas fa-question-circle';
    }
}

function getDurationClass(duration) {
    if (duration > 10000) return 'slow';
    if (duration > 5000) return 'medium';
    return 'fast';
}

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

function filterResults() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const nameFilter = document.getElementById('testNameFilter')?.value.toLowerCase() || '';
    const fileFilter = document.getElementById('fileFilter')?.value || 'all';
    
    const rows = document.querySelectorAll('#resultsTable tbody tr');
    
    rows.forEach(row => {
        const status = row.dataset.status;
        const testName = row.dataset.testname;
        const file = row.dataset.file;
        
        const statusMatch = statusFilter === 'all' || status === statusFilter;
        const nameMatch = nameFilter === '' || testName.includes(nameFilter);
        const fileMatch = fileFilter === 'all' || file === fileFilter;
        
        row.style.display = statusMatch && nameMatch && fileMatch ? 'table-row' : 'none';
    });
}

// Export functions globally
window.renderFlakyTab = renderFlakyTab;
window.renderResultsTab = renderResultsTab;

console.log('⚠️ Flaky tests tab module loaded');