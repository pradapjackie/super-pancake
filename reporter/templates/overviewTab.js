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
    
    // Store test data for popup access
    if (typeof window.testDetailsData === 'undefined') {
        window.testDetailsData = {};
    }
    window.testDetailsData[testId] = test;
    
    return `
        <div class="test-case-item ${statusClass}" data-test-id="${testId}">
            <div class="test-case-info">
                <i class="test-status-icon ${statusIcon}"></i>
                <span class="test-name">${escapeHtml(testName)}</span>
                <span class="test-duration">${duration}</span>
            </div>
            ${errorHtml}
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
                            <h4>Console Logs:</h4>
                            <pre class="log-text">${escapeHtml(test.logs.join('\\n'))}</pre>
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