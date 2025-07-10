// State management
let isRunning = false;
let selectedTests = new Set();
let executionStartTime = null;
let executionTimer = null;

// DOM elements
const form = document.getElementById('test-form');
const log = document.getElementById('log');
const runBtn = document.getElementById('run-btn');
const runBtnMain = document.getElementById('run-btn-main');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const selectedCountNumber = document.getElementById('selected-count-number');
const statusTextMain = document.getElementById('status-text-main');
const executionTimeSpan = document.getElementById('execution-time');
const testFilesContainer = document.getElementById('test-files-container');
const filesCount = document.getElementById('files-count');

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadTestFiles();
    setupWebSocket();
    setupEventListeners();
    updateSelectedCount();

    console.log('🚀 Test Runner App initialized');
});

// Theme Management
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('test-runner-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial theme
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    // Setup theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('test-runner-theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function setTheme(theme) {
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');

    html.setAttribute('data-theme', theme);
    localStorage.setItem('test-runner-theme', theme);

    // Update icon with animation
    icon.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            themeToggle.title = 'Switch to Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.title = 'Switch to Dark Mode';
        }
        icon.style.transform = 'rotate(0deg)';
    }, 150);

    // Add a nice theme switch animation
    document.body.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    // Log theme change
    appendToLog(`🎨 Switched to ${theme} theme`, 'log-info');
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Load test files from server
async function loadTestFiles() {
    try {
        const response = await fetch('/api/test-files');
        const testFiles = await response.json();

        filesCount.textContent = testFiles.length;
        await renderTestFiles(testFiles);

        // Auto-expand first test file
        if (testFiles.length > 0) {
            const firstFileId = testFiles[0].replace(/[^a-zA-Z0-9]/g, '_');
            setTimeout(() => toggleFile(firstFileId), 100);
        }
    } catch (error) {
        console.error('Failed to load test files:', error);
        appendToLog('❌ Failed to load test files', 'log-fail');
    }
}

// Render test files in the sidebar
async function renderTestFiles(testFiles) {
    const testFileElements = [];

    for (const file of testFiles) {
        try {
            // Fetch test cases for each file using POST
            const casesResponse = await fetch('/api/test-cases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filePath: file })
            });
            const cases = await casesResponse.json();

            const escapedId = file.replace(/[^a-zA-Z0-9]/g, '_');

            const caseHTML = cases.map(test => {
                const id = `${file}::${test}`;
                return `
                  <div class="test-case-item" data-test-id="${id}">
                    <input type="checkbox" name="tests" value="${id}" class="test-case-checkbox" id="${id}">
                    <label for="${id}" class="test-case-label">${test}</label>
                  </div>
                `;
            }).join('');

            testFileElements.push(`
              <div class="test-file" id="group-${escapedId}">
                <div class="test-file-header" onclick="toggleFile('${escapedId}')">
                  <div class="test-file-title">
                    <i class="fas fa-file-code"></i>
                    ${file}
                  </div>
                  <i class="fas fa-chevron-down toggle-icon" id="toggle-${escapedId}"></i>
                </div>
                <div class="test-cases" id="cases-${escapedId}">
                  <div class="test-case-item select-all-item">
                    <input type="checkbox" class="test-case-checkbox" onchange="toggleGroup('${escapedId}', this.checked)" id="select-all-${escapedId}">
                    <label for="select-all-${escapedId}" class="test-case-label">Select All (${cases.length})</label>
                  </div>
                  ${caseHTML}
                </div>
              </div>
            `);
        } catch (error) {
            console.error(`Failed to load test cases for ${file}:`, error);
            // Still show the file even if cases fail to load
            const escapedId = file.replace(/[^a-zA-Z0-9]/g, '_');
            testFileElements.push(`
              <div class="test-file" id="group-${escapedId}">
                <div class="test-file-header" onclick="toggleFile('${escapedId}')">
                  <div class="test-file-title">
                    <i class="fas fa-file-code"></i>
                    ${file}
                  </div>
                  <i class="fas fa-chevron-down toggle-icon" id="toggle-${escapedId}"></i>
                </div>
                <div class="test-cases" id="cases-${escapedId}">
                  <div class="test-case-item">
                    <span class="test-case-label" style="color: #ef4444;">❌ Failed to load test cases</span>
                  </div>
                </div>
              </div>
            `);
        }
    }

    testFilesContainer.innerHTML = testFileElements.join('');
}

// Setup event listeners
function setupEventListeners() {
    // Form submission
    form.addEventListener('submit', handleFormSubmit);

    // Test selection changes
    document.addEventListener('change', (e) => {
        if (e.target.matches('input[name="tests"]')) {
            handleTestSelection(e);
        }
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    if (isRunning) return;
    if (selectedTests.size === 0) {
        alert('Please select at least one test to run.');
        return;
    }

    isRunning = true;
    setButtonsLoading(true);
    updateStatus('running', 'Running');
    startExecutionTimer();

    try {
        const response = await fetch('/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tests: Array.from(selectedTests) })
        });

        if (response.ok) {
            appendToLog('🚀 Starting test execution...', 'log-info');
        } else {
            throw new Error('Failed to start tests');
        }
    } catch (error) {
        updateStatus('error', 'Failed');
        appendToLog('❌ Error: ' + error.message, 'log-fail');
        stopExecutionTimer();
        setButtonsLoading(false);
        isRunning = false;
    }
}

// Handle test selection
function handleTestSelection(e) {
    const testId = e.target.value;
    const item = e.target.closest('.test-case-item');

    if (e.target.checked) {
        selectedTests.add(testId);
        item.classList.add('selected');
    } else {
        selectedTests.delete(testId);
        item.classList.remove('selected');
    }

    updateSelectedCount();
}

// Utility functions
function updateStatus(status, text) {
    statusIndicator.className = 'status-indicator status-' + status;
    statusText.textContent = text;
    statusTextMain.textContent = text;

    // Update stat cards
    const statusStat = document.getElementById('status-stat');
    const selectedStat = document.getElementById('selected-stat');

    statusStat.className = 'stat-card';
    selectedStat.className = 'stat-card';

    if (status === 'running') {
        statusStat.className = 'stat-card running';
        selectedStat.className = 'stat-card selected';
    } else if (status === 'success') {
        statusStat.className = 'stat-card';
    }
}

function updateSelectedCount() {
    const count = selectedTests.size;
    selectedCountNumber.textContent = count;

    // Update visual indicators
    document.querySelectorAll('.test-file').forEach(file => {
        const fileId = file.id.replace('group-', '');
        const fileCheckboxes = file.querySelectorAll('input[name="tests"]');
        const hasSelected = Array.from(fileCheckboxes).some(cb => cb.checked);
        file.classList.toggle('has-selected', hasSelected);
    });

    // Update selected stat card
    const selectedStat = document.getElementById('selected-stat');
    if (count > 0) {
        selectedStat.classList.add('selected');
    } else {
        selectedStat.classList.remove('selected');
    }
}

function setButtonsLoading(loading) {
    if (runBtn) {
        runBtn.classList.toggle('loading', loading);
        runBtn.disabled = loading;
    }
    if (runBtnMain) {
        runBtnMain.classList.toggle('loading', loading);
        runBtnMain.disabled = loading;
    }
}

function updateExecutionTime() {
    if (!executionStartTime) return;

    const elapsed = Math.floor((Date.now() - executionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeString = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');

    if (executionTimeSpan) {
        executionTimeSpan.textContent = timeString;
    }
}

function startExecutionTimer() {
    executionStartTime = Date.now();
    executionTimer = setInterval(updateExecutionTime, 1000);
}

function stopExecutionTimer() {
    if (executionTimer) {
        clearInterval(executionTimer);
        executionTimer = null;
    }
}

function appendToLog(message, className = 'log-info') {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = message;

    if (log) {
        log.appendChild(div);
        log.scrollTop = log.scrollHeight;
    }
}

function clearLogs() {
    if (log) {
        log.innerHTML = '<div class="log-info">🧹 Console cleared - ready for new test run!</div>';
    }
}

function copyLogs() {
    if (!log) return;

    const logText = log.innerText;
    navigator.clipboard.writeText(logText).then(() => {
        appendToLog('📋 Logs copied to clipboard!', 'log-info');
    }).catch(() => {
        appendToLog('❌ Failed to copy logs', 'log-fail');
    });
}

function toggleFile(fileId) {
    const file = document.getElementById('group-' + fileId);
    const cases = document.getElementById('cases-' + fileId);
    const isExpanded = file.classList.contains('expanded');

    file.classList.toggle('expanded');

    if (!isExpanded) {
        cases.style.maxHeight = cases.scrollHeight + 'px';
    } else {
        cases.style.maxHeight = '0';
    }
}

function toggleGroup(groupId, checked) {
    const group = document.getElementById('group-' + groupId);
    const checkboxes = group.querySelectorAll('input[type="checkbox"][name="tests"]');

    checkboxes.forEach(cb => {
        cb.checked = checked;
        const testId = cb.value;
        const item = cb.closest('.test-case-item');

        if (checked) {
            selectedTests.add(testId);
            item.classList.add('selected');
        } else {
            selectedTests.delete(testId);
            item.classList.remove('selected');
        }
    });

    updateSelectedCount();
}

// WebSocket setup
function setupWebSocket() {
    const socket = new WebSocket('ws://' + location.host);

    socket.onopen = () => {
        updateStatus('idle', 'Connected');
        appendToLog('🔌 Connected to test runner', 'log-info');
    };

    socket.onclose = () => {
        updateStatus('error', 'Disconnected');
        appendToLog('❌ Disconnected from server', 'log-fail');
    };

    socket.onmessage = (event) => {
        const message = event.data;

        let className = 'log-info';
        if (message.includes('✓') || message.includes('✅') || message.includes('PASS')) {
            className = 'log-pass';
        } else if (message.includes('✗') || message.includes('❌') || message.includes('FAIL')) {
            className = 'log-fail';
        } else if (message.includes('⚠️') || message.includes('WARN')) {
            className = 'log-warning';
        }

        appendToLog(message, className);

        // Check if tests finished
        if (message.includes('All tests finished') || message.includes('Consolidated report generated')) {
            isRunning = false;
            setButtonsLoading(false);
            stopExecutionTimer();

            if (message.includes('All tests finished')) {
                updateStatus('success', 'Completed');
            }
        }
    };
}

// Global functions for inline handlers
window.toggleFile = toggleFile;
window.toggleGroup = toggleGroup;
window.copyLogs = copyLogs;
window.clearLogs = clearLogs;
window.openReport = openReport;