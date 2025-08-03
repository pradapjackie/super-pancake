/**
 * Overview Tab Module
 * Handles rendering and functionality for the overview tab
 */

/**
 * Render test files in the overview tab
 */
function renderTestFiles() {
    const container = document.querySelector('.test-files-container');
    if (!container) {
        console.error('❌ Test files container not found');
        return;
    }

    const allTests = window.getAllTests();
    if (!allTests || allTests.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-secondary);">No test data available</div>';
        return;
    }

    // Group tests by file
    const testsByFile = window.groupTestsByFile(allTests);

    let html = '';
    Object.entries(testsByFile).forEach(([fileName, tests]) => {
        const totalTests = tests.length;
        const passedTests = tests.filter(t => t.status === 'passed').length;
        const failedTests = tests.filter(t => t.status === 'failed').length;
        const skippedTests = tests.filter(t => t.status === 'skipped').length;
        
        // Determine file status class
        let fileClass = 'file-success';
        if (failedTests > 0) {
            fileClass = 'file-error';
        } else if (skippedTests > 0) {
            fileClass = 'file-warning';
        }
        
        // Calculate pass rate
        const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        let passRateClass = 'file-success';
        if (passRate < 70) {
            passRateClass = 'file-error';
        } else if (passRate < 90) {
            passRateClass = 'file-warning';
        }
        
        html += `
            <div class="test-file-section ${fileClass}">
                <div class="test-file-header" onclick="toggleFileSection(this)">
                    <div class="file-info">
                        <i class="file-icon fas fa-file-code"></i>
                        <span class="file-name">${fileName}</span>
                    </div>
                    <div class="file-stats">
                        <span class="test-count">${totalTests} tests</span>
                        <span class="pass-rate ${passRateClass}">${passRate}% pass</span>
                    </div>
                    <i class="file-toggle fas fa-chevron-down"></i>
                </div>
                <div class="test-file-content" style="display: none;">
                    <div class="test-cases-list">
                        ${tests.map(test => renderTestCase(test)).join('')}
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    console.log('✅ Test files rendered successfully:', Object.keys(testsByFile).length, 'files');
}

/**
 * Render individual test case
 */
function renderTestCase(test) {
    const statusClass = `test-${test.status}`;
    const statusIcon = getStatusIcon(test.status);
    const duration = test.duration ? formatDuration(test.duration) : 'N/A';
    const testName = test.testName || test.description || 'Unknown Test';
    const testId = test.id || `test-${Math.random().toString(36).substr(2, 9)}`;
    
    let errorHtml = '';
    let logsHtml = '';
    let screenshotsHtml = '';
    let actionsHtml = '';
    
    if (test.error && test.status === 'failed') {
        const errorMessage = typeof test.error === 'string' ? test.error : JSON.stringify(test.error);
        const truncatedError = errorMessage.length > 200 ? errorMessage.substring(0, 200) + '...' : errorMessage;
        errorHtml = `
            <div class="test-error">
                <div class="error-preview">${escapeHtml(truncatedError)}</div>
            </div>
        `;
        
        actionsHtml = `
            <div class="test-actions">
                <button class="btn-view-details" onclick="showErrorDetails('${testId}')" title="View full error details">
                    <i class="fas fa-info-circle"></i> View Details
                </button>
                ${test.screenshots && test.screenshots.length > 0 ? `
                    <button class="btn-view-screenshot" onclick="showErrorScreenshot('${testId}')" title="View error screenshot">
                        <i class="fas fa-camera"></i> Screenshot
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    // Show console logs for all tests (not just failed ones)
    if (test.logs && test.logs.length > 0) {
        const logPreview = test.logs.slice(0, 3).join('\n'); // Show first 3 log lines
        const truncatedLogs = logPreview.length > 300 ? logPreview.substring(0, 300) + '...' : logPreview;
        const hasMore = test.logs.length > 3 || logPreview.length > 300;
        
        logsHtml = 
            '<div class="test-logs">' +
                '<div class="logs-header">' +
                    '<div class="logs-title">' +
                        '<i class="fas fa-terminal"></i>' +
                        '<span>Console Logs (' + test.logs.length + ' entries)</span>' +
                    '</div>' +
                    (hasMore ? (
                        '<button class="btn-view-all-logs" onclick="window.showAllLogs(\'' + testId + '\'); event.preventDefault(); return false;" title="View all console logs for this test">' +
                            '<i class="fas fa-expand-alt"></i> View All Logs' +
                        '</button>'
                    ) : '') +
                '</div>' +
                '<div class="logs-preview">' +
                    '<pre class="log-text-preview">' + escapeHtml(truncatedLogs) + '</pre>' +
                '</div>' +
            '</div>';
    }
    
    // Show screenshots if available
    if (test.screenshots && test.screenshots.length > 0) {
        const screenshotPreview = test.screenshots.slice(0, 2); // Show first 2 screenshots
        const hasMoreScreenshots = test.screenshots.length > 2;
        
        let screenshotThumbnails = '';
        screenshotPreview.forEach((screenshot, index) => {
            const screenshotPath = screenshot.path || screenshot.url || screenshot;
            screenshotThumbnails += `
                <div class="screenshot-thumbnail" onclick="window.showScreenshot('${testId}', ${index})" title="Click to view full screenshot">
                    <img src="${screenshotPath}" alt="Screenshot ${index + 1}" onerror="this.style.display='none'; this.nextSibling.style.display='block';">
                    <div class="screenshot-placeholder" style="display: none;">
                        <i class="fas fa-image"></i>
                        <span>Screenshot ${index + 1}</span>
                    </div>
                </div>
            `;
        });
        
        screenshotsHtml = `
            <div class="test-screenshots">
                <div class="screenshots-header">
                    <div class="screenshots-title">
                        <i class="fas fa-camera"></i>
                        <span>Screenshots (${test.screenshots.length} captured)</span>
                    </div>
                    ${hasMoreScreenshots ? `
                        <button class="btn-view-all-screenshots" onclick="window.showAllScreenshots('${testId}'); event.preventDefault(); return false;" title="View all screenshots">
                            <i class="fas fa-images"></i> View All (${test.screenshots.length})
                        </button>
                    ` : ''}
                </div>
                <div class="screenshots-preview">
                    ${screenshotThumbnails}
                </div>
            </div>
        `;
    }
    
    // Store test data for popup access
    if (typeof window.testDetailsData === 'undefined') {
        window.testDetailsData = {};
    }
    window.testDetailsData[testId] = test;
    
    // Add actions to view screenshots if not already present (logs handled in preview section)
    if (!actionsHtml) {
        let actionButtons = '';
        
        if (test.screenshots && test.screenshots.length > 0) {
            actionButtons += `
                <button class="btn-view-screenshots" onclick="window.showAllScreenshots('${testId}')" title="View all screenshots">
                    <i class="fas fa-images"></i> View Screenshots
                </button>
            `;
        }
        
        if (actionButtons) {
            actionsHtml = `
                <div class="test-actions">
                    ${actionButtons}
                </div>
            `;
        }
    }
    
    return `
        <div class="test-case-item ${statusClass}" data-test-id="${testId}">
            <div class="test-case-info">
                <i class="test-status-icon ${statusIcon}"></i>
                <span class="test-name">${escapeHtml(testName)}</span>
                <span class="test-duration">${duration}</span>
            </div>
            ${errorHtml}
            ${logsHtml}
            ${screenshotsHtml}
            ${actionsHtml}
        </div>
    `;
}

/**
 * Get appropriate icon for test status
 */
function getStatusIcon(status) {
    switch (status) {
        case 'passed':
            return 'fas fa-check-circle';
        case 'failed':
            return 'fas fa-times-circle';
        case 'skipped':
            return 'fas fa-exclamation-triangle';
        default:
            return 'fas fa-question-circle';
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Toggle file section expand/collapse
 */
function toggleFileSection(header) {
    const testContent = header.nextElementSibling;
    const chevron = header.querySelector('.file-toggle');
    
    if (testContent.style.display === 'none') {
        testContent.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
        chevron.classList.add('expanded');
    } else {
        testContent.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
        chevron.classList.remove('expanded');
    }
}

/**
 * Filter test files based on search input
 */
function filterTestFiles() {
    const searchInput = document.getElementById('testFileSearch');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const fileSections = document.querySelectorAll('.test-file-section');
    
    fileSections.forEach(section => {
        const fileName = section.querySelector('.file-name');
        const testNames = section.querySelectorAll('.test-name');
        
        let shouldShow = false;
        
        // Check file name
        if (fileName && fileName.textContent.toLowerCase().includes(searchTerm)) {
            shouldShow = true;
        }
        
        // Check test names
        testNames.forEach(testName => {
            if (testName.textContent.toLowerCase().includes(searchTerm)) {
                shouldShow = true;
            }
        });
        
        section.style.display = shouldShow ? 'block' : 'none';
    });
}

/**
 * Expand all file sections
 */
function expandAllFiles() {
    const headers = document.querySelectorAll('.test-file-header');
    headers.forEach(header => {
        const testContent = header.nextElementSibling;
        const chevron = header.querySelector('.file-toggle');
        
        testContent.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
        chevron.classList.add('expanded');
    });
}

/**
 * Collapse all file sections
 */
function collapseAllFiles() {
    const headers = document.querySelectorAll('.test-file-header');
    headers.forEach(header => {
        const testContent = header.nextElementSibling;
        const chevron = header.querySelector('.file-toggle');
        
        testContent.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
        chevron.classList.remove('expanded');
    });
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

/**
 * Show detailed error information in a modal
 */
function showErrorDetails(testId) {
    const test = window.testDetailsData[testId];
    if (!test || !test.error) {
        alert('No error details available');
        return;
    }
    
    const errorMessage = typeof test.error === 'string' ? test.error : JSON.stringify(test.error, null, 2);
    const testName = test.testName || test.description || 'Unknown Test';
    
    // Create modal HTML
    const modalHtml = `
        <div class="error-modal-overlay" onclick="closeErrorModal()">
            <div class="error-modal" onclick="event.stopPropagation()">
                <div class="error-modal-header">
                    <h3><i class="fas fa-exclamation-triangle"></i> Test Error Details</h3>
                    <button class="close-btn" onclick="closeErrorModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="error-modal-content">
                    <div class="test-info">
                        <h4>Test: ${escapeHtml(testName)}</h4>
                        <p class="test-meta">
                            <span><i class="fas fa-clock"></i> Duration: ${formatDuration(test.duration)}</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(test.timestamp).toLocaleString()}</span>
                        </p>
                    </div>
                    <div class="error-details">
                        <h4>Error Message:</h4>
                        <pre class="error-text">${escapeHtml(errorMessage)}</pre>
                    </div>
                    ${test.screenshots && test.screenshots.length > 0 ? `
                        <div class="error-screenshots">
                            <h4>Screenshots:</h4>
                            <div class="screenshot-grid">
                                ${test.screenshots.map(screenshot => `
                                    <img src="${screenshot}" alt="Error Screenshot" class="error-screenshot-thumb" 
                                         onclick="showFullScreenshot('${screenshot}')" title="Click to view full size">
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${test.logs && test.logs.length > 0 ? `
                        <div class="error-logs">
                            <h4>Console Logs (${test.logs.length} entries):</h4>
                            <div class="logs-preview-modal">
                                <pre class="log-text">${escapeHtml(test.logs.slice(0, 10).join('\\n'))}${test.logs.length > 10 ? '\\n\\n... and ' + (test.logs.length - 10) + ' more entries' : ''}</pre>
                            </div>
                            ${test.logs.length > 10 ? `
                                <button class="btn-view-all-logs-modal" onclick="showAllLogsInModal('${testId}')" style="margin-top: 8px;">
                                    <i class="fas fa-terminal"></i> View All ${test.logs.length} Console Logs
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="error-modal-footer">
                    <button class="btn-copy-error" onclick="copyErrorToClipboard('${testId}')">
                        <i class="fas fa-copy"></i> Copy Error
                    </button>
                    <button class="btn-close" onclick="closeErrorModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    const existingModal = document.querySelector('.error-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

/**
 * Show error screenshot in a modal
 */
function showErrorScreenshot(testId) {
    const test = window.testDetailsData[testId];
    if (!test || !test.screenshots || test.screenshots.length === 0) {
        alert('No screenshots available');
        return;
    }
    
    const screenshot = test.screenshots[0]; // Show first screenshot
    showFullScreenshot(screenshot);
}

/**
 * Show full-size screenshot
 */
function showFullScreenshot(screenshotUrl) {
    const modalHtml = `
        <div class="screenshot-modal-overlay" onclick="closeScreenshotModal()">
            <div class="screenshot-modal" onclick="event.stopPropagation()">
                <div class="screenshot-modal-header">
                    <h3><i class="fas fa-camera"></i> Screenshot</h3>
                    <button class="close-btn" onclick="closeScreenshotModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="screenshot-modal-content">
                    <img src="${screenshotUrl}" alt="Test Screenshot" class="full-screenshot">
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    const existingModal = document.querySelector('.screenshot-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

/**
 * Close error details modal
 */
function closeErrorModal() {
    const modal = document.querySelector('.error-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

/**
 * Close screenshot modal
 */
function closeScreenshotModal() {
    const modal = document.querySelector('.screenshot-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

/**
 * Copy error details to clipboard
 */
function copyErrorToClipboard(testId) {
    const test = window.testDetailsData[testId];
    if (!test || !test.error) {
        return;
    }
    
    const errorText = `Test: ${test.testName || test.description}
Duration: ${formatDuration(test.duration)}
Timestamp: ${new Date(test.timestamp).toLocaleString()}

Error:
${typeof test.error === 'string' ? test.error : JSON.stringify(test.error, null, 2)}`;
    
    navigator.clipboard.writeText(errorText).then(() => {
        // Show temporary success message
        const btn = document.querySelector('.btn-copy-error');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = 'var(--success-color)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    }).catch(() => {
        alert('Failed to copy to clipboard');
    });
}

/**
 * Show all console logs in a modal
 */
function showAllLogs(testId) {
    console.log('showAllLogs called with testId:', testId);
    
    const test = window.testDetailsData && window.testDetailsData[testId];
    if (!test || !test.logs || test.logs.length === 0) {
        alert('No console logs available for this test');
        return;
    }
    
    const testName = test.testName || test.description || 'Unknown Test';
    const allLogs = test.logs.join('\n');
    
    // Try modal first, fallback to simple popup
    try {
        // Create modal HTML
        const modalHtml = `
            <div class="logs-modal-overlay" onclick="window.closeLogsModal()">
                <div class="logs-modal" onclick="event.stopPropagation()">
                    <div class="logs-modal-header">
                        <h3><i class="fas fa-terminal"></i> Console Logs</h3>
                        <button class="close-btn" onclick="window.closeLogsModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="logs-modal-content">
                        <div class="test-info">
                            <h4>Test: ${escapeHtml(testName)}</h4>
                            <p class="test-meta">
                                <span><i class="fas fa-clock"></i> Duration: ${formatDuration(test.duration)}</span>
                                <span><i class="fas fa-calendar"></i> ${new Date(test.timestamp).toLocaleString()}</span>
                                <span><i class="fas fa-list"></i> ${test.logs.length} log entries</span>
                            </p>
                        </div>
                        <div class="logs-content">
                            <h4>Complete Console Output:</h4>
                            <pre class="full-log-text">${escapeHtml(allLogs)}</pre>
                        </div>
                    </div>
                    <div class="logs-modal-footer">
                        <button class="btn-copy-logs" onclick="window.copyLogsToClipboard('${testId}')">
                            <i class="fas fa-copy"></i> Copy Logs
                        </button>
                        <button class="btn-close" onclick="window.closeLogsModal()">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal
        const existingModal = document.querySelector('.logs-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Modal creation failed:', error);
        // Fallback to simple popup
        showSimpleLogsPopup(testName, allLogs);
    }
}

/**
 * Simple logs popup fallback
 */
function showSimpleLogsPopup(testName, logs) {
    const popup = window.open('', 'ConsoleLogsPopup', 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (popup) {
        popup.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Console Logs - ${testName}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 20px; 
                        background: #f5f5f5; 
                    }
                    .header { 
                        background: #6366f1; 
                        color: white; 
                        padding: 15px; 
                        border-radius: 8px; 
                        margin-bottom: 20px; 
                    }
                    .logs { 
                        background: white; 
                        padding: 20px; 
                        border-radius: 8px;
                        border: 1px solid #ddd;
                        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
                        font-size: 13px;
                        line-height: 1.5;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        max-height: 500px;
                        overflow-y: auto;
                    }
                    .close-btn {
                        margin-top: 15px;
                        padding: 10px 20px;
                        background: #6366f1;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>🚀 Console Logs: ${testName}</h2>
                    <p>Total log entries: ${logs.split('\\n').length}</p>
                </div>
                <div class="logs">${logs}</div>
                <button class="close-btn" onclick="window.close()">Close Window</button>
            </body>
            </html>
        `);
        popup.document.close();
    } else {
        // Final fallback - just alert with some of the logs
        const truncatedLogs = logs.length > 1000 ? logs.substring(0, 1000) + '...\n\n[Logs truncated - open browser console for full output]' : logs;
        alert(`Console Logs for: ${testName}\n\n${truncatedLogs}`);
        console.log('Full console logs for', testName, ':\n', logs);
    }
}

/**
 * Close logs modal
 */
function closeLogsModal() {
    const modal = document.querySelector('.logs-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

/**
 * Copy all logs to clipboard
 */
function copyLogsToClipboard(testId) {
    const test = window.testDetailsData[testId];
    if (!test || !test.logs) {
        return;
    }
    
    const logsText = `Test: ${test.testName || test.description}
Duration: ${formatDuration(test.duration)}
Timestamp: ${new Date(test.timestamp).toLocaleString()}
Log Entries: ${test.logs.length}

Console Logs:
${test.logs.join('\n')}`;
    
    navigator.clipboard.writeText(logsText).then(() => {
        // Show temporary success message
        const btn = document.querySelector('.btn-copy-logs');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = 'var(--success-color)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    }).catch(() => {
        alert('Failed to copy to clipboard');
    });
}

/**
 * Show all console logs from within error modal
 */
function showAllLogsInModal(testId) {
    const test = window.testDetailsData[testId];
    if (!test || !test.logs || test.logs.length === 0) {
        alert('No console logs available');
        return;
    }
    
    const testName = test.testName || test.description || 'Unknown Test';
    const allLogs = test.logs.join('\n');
    
    // Close existing error modal first
    closeErrorModal();
    
    // Create full logs modal HTML
    const modalHtml = `
        <div class="logs-modal-overlay" onclick="closeLogsModal()">
            <div class="logs-modal" onclick="event.stopPropagation()">
                <div class="logs-modal-header">
                    <h3><i class="fas fa-terminal"></i> Console Logs</h3>
                    <button class="close-btn" onclick="closeLogsModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="logs-modal-content">
                    <div class="test-info">
                        <h4>Test: ${escapeHtml(testName)}</h4>
                        <p class="test-meta">
                            <span><i class="fas fa-clock"></i> Duration: ${formatDuration(test.duration)}</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(test.timestamp).toLocaleString()}</span>
                            <span><i class="fas fa-list"></i> ${test.logs.length} log entries</span>
                        </p>
                    </div>
                    <div class="logs-content">
                        <h4>Complete Console Output:</h4>
                        <pre class="full-log-text">${escapeHtml(allLogs)}</pre>
                    </div>
                </div>
                <div class="logs-modal-footer">
                    <button class="btn-copy-logs" onclick="copyLogsToClipboard('${testId}')">
                        <i class="fas fa-copy"></i> Copy Logs
                    </button>
                    <button class="btn-close" onclick="closeLogsModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    const existingModal = document.querySelector('.logs-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Export functions globally
window.renderTestFiles = renderTestFiles;
window.renderTestCase = renderTestCase;
window.toggleFileSection = toggleFileSection;
window.filterTestFiles = filterTestFiles;
window.expandAllFiles = expandAllFiles;
window.collapseAllFiles = collapseAllFiles;
window.showErrorDetails = showErrorDetails;
window.showErrorScreenshot = showErrorScreenshot;
window.showFullScreenshot = showFullScreenshot;
window.closeErrorModal = closeErrorModal;
window.closeScreenshotModal = closeScreenshotModal;
window.copyErrorToClipboard = copyErrorToClipboard;
window.showAllLogs = showAllLogs;
window.closeLogsModal = closeLogsModal;
window.copyLogsToClipboard = copyLogsToClipboard;
window.showAllLogsInModal = showAllLogsInModal;
window.showSimpleLogsPopup = showSimpleLogsPopup;

/**
 * Show individual screenshot in modal
 */
function showScreenshot(testId, screenshotIndex) {
    const test = window.testDetailsData && window.testDetailsData[testId];
    if (!test || !test.screenshots || !test.screenshots[screenshotIndex]) {
        alert('Screenshot not available');
        return;
    }
    
    const screenshot = test.screenshots[screenshotIndex];
    const screenshotPath = screenshot.path || screenshot.url || screenshot;
    const testName = test.testName || test.description || 'Unknown Test';
    
    const modalHtml = `
        <div class="screenshot-modal-overlay" onclick="window.closeScreenshotModal()">
            <div class="screenshot-modal" onclick="event.stopPropagation()">
                <div class="screenshot-modal-header">
                    <h3><i class="fas fa-image"></i> Screenshot ${screenshotIndex + 1}</h3>
                    <button class="close-btn" onclick="window.closeScreenshotModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="screenshot-modal-content">
                    <div class="test-info">
                        <h4>Test: ${escapeHtml(testName)}</h4>
                        <p class="test-meta">
                            <span><i class="fas fa-clock"></i> Duration: ${formatDuration(test.duration)}</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(test.timestamp).toLocaleString()}</span>
                        </p>
                    </div>
                    <div class="screenshot-container">
                        <img src="${screenshotPath}" alt="Screenshot ${screenshotIndex + 1}" class="full-screenshot" 
                             onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                        <div class="screenshot-error" style="display: none;">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>Unable to load screenshot</span>
                        </div>
                    </div>
                </div>
                <div class="screenshot-modal-footer">
                    <button class="btn-download-screenshot" onclick="window.downloadScreenshot('${screenshotPath}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn-close" onclick="window.closeScreenshotModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.querySelector('.screenshot-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page  
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

/**
 * Show all screenshots for a test
 */
function showAllScreenshots(testId) {
    const test = window.testDetailsData && window.testDetailsData[testId];
    if (!test || !test.screenshots || test.screenshots.length === 0) {
        alert('No screenshots available for this test');
        return;
    }
    
    const testName = test.testName || test.description || 'Unknown Test';
    
    let screenshotsGrid = '';
    test.screenshots.forEach((screenshot, index) => {
        const screenshotPath = screenshot.path || screenshot.url || screenshot;
        screenshotsGrid += `
            <div class="screenshot-grid-item" onclick="window.showScreenshot('${testId}', ${index})">
                <img src="${screenshotPath}" alt="Screenshot ${index + 1}" 
                     onerror="this.style.display='none'; this.nextSibling.style.display='flex';">
                <div class="screenshot-placeholder" style="display: none;">
                    <i class="fas fa-image"></i>
                    <span>Screenshot ${index + 1}</span>
                </div>
                <div class="screenshot-overlay">
                    <i class="fas fa-search-plus"></i>
                </div>
            </div>
        `;
    });
    
    const modalHtml = `
        <div class="screenshots-modal-overlay" onclick="window.closeScreenshotsModal()">
            <div class="screenshots-modal" onclick="event.stopPropagation()">
                <div class="screenshots-modal-header">
                    <h3><i class="fas fa-images"></i> All Screenshots (${test.screenshots.length})</h3>
                    <button class="close-btn" onclick="window.closeScreenshotsModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="screenshots-modal-content">
                    <div class="test-info">
                        <h4>Test: ${escapeHtml(testName)}</h4>
                        <p class="test-meta">
                            <span><i class="fas fa-clock"></i> Duration: ${formatDuration(test.duration)}</span>
                            <span><i class="fas fa-calendar"></i> ${new Date(test.timestamp).toLocaleString()}</span>
                            <span><i class="fas fa-camera"></i> ${test.screenshots.length} screenshots</span>
                        </p>
                    </div>
                    <div class="screenshots-grid">
                        ${screenshotsGrid}
                    </div>
                </div>
                <div class="screenshots-modal-footer">
                    <button class="btn-download-all" onclick="window.downloadAllScreenshots('${testId}')">
                        <i class="fas fa-download"></i> Download All
                    </button>
                    <button class="btn-close" onclick="window.closeScreenshotsModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    const existingModal = document.querySelector('.screenshots-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
}

/**
 * Close screenshot modal
 */
function closeScreenshotModal() {
    const modal = document.querySelector('.screenshot-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

/**
 * Close screenshots modal
 */
function closeScreenshotsModal() {
    const modal = document.querySelector('.screenshots-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

/**
 * Download individual screenshot
 */
function downloadScreenshot(screenshotPath) {
    const link = document.createElement('a');
    link.href = screenshotPath;
    link.download = screenshotPath.split('/').pop() || 'screenshot.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Download all screenshots for a test
 */
function downloadAllScreenshots(testId) {
    const test = window.testDetailsData && window.testDetailsData[testId];
    if (!test || !test.screenshots || test.screenshots.length === 0) {
        alert('No screenshots to download');
        return;
    }
    
    test.screenshots.forEach((screenshot, index) => {
        const screenshotPath = screenshot.path || screenshot.url || screenshot;
        setTimeout(() => {
            downloadScreenshot(screenshotPath);
        }, index * 100); // Stagger downloads
    });
}

// Export screenshot functions globally
window.showScreenshot = showScreenshot;
window.showAllScreenshots = showAllScreenshots;
window.closeScreenshotModal = closeScreenshotModal;
window.closeScreenshotsModal = closeScreenshotsModal;
window.downloadScreenshot = downloadScreenshot;
window.downloadAllScreenshots = downloadAllScreenshots;