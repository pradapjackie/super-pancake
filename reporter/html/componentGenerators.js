import { escapeHtml, formatDuration, getStatusIcon, getStatusClass } from './htmlUtils.js';

export function generateTestCards(results) {
  if (!results || results.length === 0) {
    return '<div class="no-results">No test results found</div>';
  }

  const testCards = results.map(test => generateTestCard(test)).join('');
  
  return `
    <div class="test-results-section">
      <div class="section-header">
        <h2><i class="fas fa-list"></i> Test Results</h2>
        <div class="search-controls">
          <input type="text" id="testSearch" placeholder="Search tests..." onkeyup="filterTests()">
        </div>
      </div>
      <div class="test-grid">
        ${testCards}
      </div>
    </div>`;
}

export function generateTestCard(test) {
  const status = test.status?.toLowerCase() || 'unknown';
  const statusClass = getStatusClass(status);
  const statusIcon = getStatusIcon(status);
  const duration = formatDuration(test.duration || 0);
  
  return `
    <div class="test-card ${status}" onclick="showTestDetails('${test.id || 'unknown'}')">
      <div class="test-header">
        <div class="test-status">
          <i class="fas fa-${statusIcon} ${statusClass}"></i>
          <span class="status-text ${statusClass}">${status.toUpperCase()}</span>
        </div>
        <div class="test-duration">${duration}</div>
      </div>
      <div class="test-content">
        <h4>${escapeHtml(test.testName || 'Unnamed Test')}</h4>
        <p>${escapeHtml((test.description || '').substring(0, 100))}${(test.description || '').length > 100 ? '...' : ''}</p>
        ${test.error ? `<div class="test-error">${escapeHtml(test.error.substring(0, 200))}...</div>` : ''}
      </div>
      <div class="test-footer">
        <div class="test-meta">
          <span><i class="fas fa-folder"></i> ${escapeHtml(test.testFilePath || 'unknown')}</span>
          <span><i class="fas fa-browser"></i> ${escapeHtml(test.browser || 'Chrome')}</span>
        </div>
        ${test.retryCount > 0 ? `<div class="retry-count">Retries: ${test.retryCount}</div>` : ''}
      </div>
    </div>`;
}

export function generateTestFilesStructure(results) {
  if (!results || results.length === 0) {
    return '<div class="no-results">No test results found</div>';
  }

  // Group tests by file
  const fileGroups = groupTestsByFile(results);
  
  return `
    <div class="test-results-overview">
      <div class="overview-header">
        <h2><i class="fas fa-folder-open"></i> Test Files Overview</h2>
        <div class="overview-controls">
          <input type="text" placeholder="Filter test files..." onkeyup="filterTestFiles()">
          <button class="control-btn" onclick="expandAllFiles()">
            <i class="fas fa-expand"></i> Expand All
          </button>
          <button class="control-btn" onclick="collapseAllFiles()">
            <i class="fas fa-compress"></i> Collapse All
          </button>
        </div>
      </div>
      <div class="test-files-overview">
        <div class="test-files-container">
          ${Object.entries(fileGroups).map(([filePath, tests]) => 
            generateTestFileSection(filePath, tests)
          ).join('')}
        </div>
      </div>
    </div>`;
}

function groupTestsByFile(results) {
  const groups = {};
  
  results.forEach(test => {
    const filePath = test.testFilePath || 'unknown';
    if (!groups[filePath]) {
      groups[filePath] = [];
    }
    groups[filePath].push(test);
  });
  
  return groups;
}

function generateTestFileSection(filePath, tests) {
  const totalTests = tests.length;
  const passedTests = tests.filter(t => t.status?.toLowerCase() === 'passed').length;
  const failedTests = tests.filter(t => t.status?.toLowerCase() === 'failed').length;
  const skippedTests = tests.filter(t => t.status?.toLowerCase() === 'skipped').length;
  
  const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  const fileStatus = failedTests > 0 ? 'file-error' : skippedTests > 0 ? 'file-warning' : 'file-success';
  
  return `
    <div class="test-file-section ${fileStatus}">
      <div class="test-file-header" onclick="toggleTestFile(this)">
        <div class="file-info">
          <div class="file-icon">
            <i class="fas fa-chevron-right"></i>
          </div>
          <div class="file-name" title="${escapeHtml(filePath)}">
            ${escapeHtml(filePath)}
          </div>
        </div>
        <div class="file-stats">
          <div class="test-count">
            ${totalTests} test${totalTests !== 1 ? 's' : ''}
          </div>
          <div class="pass-rate ${fileStatus}">
            ${passRate}% passed
          </div>
          <div class="duration">
            ${formatDuration(tests.reduce((sum, test) => sum + (test.duration || 0), 0))}
          </div>
        </div>
      </div>
      <div class="test-file-content" style="display: none;">
        <div class="file-test-summary">
          <div class="summary-item success">
            <i class="fas fa-check-circle"></i>
            <span>${passedTests} Passed</span>
          </div>
          <div class="summary-item danger">
            <i class="fas fa-times-circle"></i>
            <span>${failedTests} Failed</span>
          </div>
          <div class="summary-item warning">
            <i class="fas fa-minus-circle"></i>
            <span>${skippedTests} Skipped</span>
          </div>
        </div>
        <div class="file-tests">
          ${tests.map(test => generateFileTestItem(test)).join('')}
        </div>
      </div>
    </div>`;
}

function generateFileTestItem(test) {
  const status = test.status?.toLowerCase() || 'unknown';
  const statusIcon = getStatusIcon(status);
  const statusClass = getStatusClass(status);
  const duration = formatDuration(test.duration || 0);
  
  return `
    <div class="file-test-item ${status}" onclick="showTestDetails('${test.id || 'unknown'}')">
      <div class="test-item-header">
        <div class="test-item-status">
          <i class="fas fa-${statusIcon}"></i>
        </div>
        <div class="test-item-info">
          <h5>${escapeHtml(test.testName || 'Unnamed Test')}</h5>
          <p>${escapeHtml((test.description || '').substring(0, 80))}${(test.description || '').length > 80 ? '...' : ''}</p>
        </div>
        <div class="test-item-meta">
          <span class="duration">${duration}</span>
          ${test.retryCount > 0 ? `<span class="retries">${test.retryCount} retries</span>` : ''}
        </div>
      </div>
      ${test.error ? `
        <div class="test-item-error">
          <details>
            <summary>Error Details</summary>
            <pre>${escapeHtml(test.error)}</pre>
          </details>
        </div>
      ` : ''}
    </div>`;
}