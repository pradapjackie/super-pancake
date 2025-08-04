// State management
let isRunning = false;
let selectedTests = new Set();
let executionStartTime = null;
let executionTimer = null;

// DOM elements
const form = document.getElementById('test-form');
const log = document.getElementById('log');
const runBtn = document.getElementById('run-btn');
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
    const themeDropdown = document.getElementById('theme-dropdown');
    const savedTheme = localStorage.getItem('test-runner-theme');

    // Set initial theme
    const initialTheme = savedTheme || 'forest-green';
    setTheme(initialTheme);

    // Setup theme toggle dropdown
    themeToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        themeDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!themeToggle.contains(e.target) && !themeDropdown.contains(e.target)) {
            themeDropdown.classList.remove('show');
        }
    });

    // Setup theme options
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const theme = option.getAttribute('data-theme');
            setTheme(theme);
            themeDropdown.classList.remove('show');
        });
    });
}

function setTheme(theme) {
    const html = document.documentElement;
    const themeOptions = document.querySelectorAll('.theme-option');
    
    // Map theme names to data-theme attributes
    const themeMap = {
        'forest-green': 'forest-green',
        'sage-green': 'sage-green'
    };

    const dataTheme = themeMap[theme] || theme;
    
    // Set the theme
    html.setAttribute('data-theme', dataTheme);
    
    localStorage.setItem('test-runner-theme', theme);

    // Update active theme option
    themeOptions.forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-theme') === theme) {
            option.classList.add('active');
        }
    });

    // Add a nice theme switch animation
    document.body.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

    // Get theme display name
    const themeNames = {
        'forest-green': 'Forest Green',
        'sage-green': 'Sage Green'
    };

    // Log theme change
    appendToLog(`🎨 Switched to ${themeNames[theme]} theme`, 'log-info');
}

function toggleTheme() {
    // This function can be used for cycling through themes if needed
    const themes = ['forest-green', 'sage-green'];
    const currentTheme = localStorage.getItem('test-runner-theme') || 'forest-green';
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
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
                <div class="test-file-header">
                  <div class="test-file-header-left">
                    <div class="test-file-title">
                      <i class="fas fa-file-code"></i>
                      ${file}
                    </div>
                  </div>
                  <div class="file-select-all">
                    <input type="checkbox" class="file-select-all-checkbox" id="select-all-${escapedId}">
                    <label for="select-all-${escapedId}" class="file-select-all-label">All</label>
                  </div>
                  <i class="fas fa-chevron-down toggle-icon" id="toggle-${escapedId}" tabindex="0" role="button" aria-label="Expand/collapse test file"></i>
                </div>
                <div class="test-cases" id="cases-${escapedId}">
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
                <div class="test-file-header">
                  <div class="test-file-header-left">
                    <div class="test-file-title">
                      <i class="fas fa-file-code"></i>
                      ${file}
                    </div>
                  </div>
                  <div class="file-select-all">
                    <input type="checkbox" class="file-select-all-checkbox" id="select-all-${escapedId}">
                    <label for="select-all-${escapedId}" class="file-select-all-label">All</label>
                  </div>
                  <i class="fas fa-chevron-down toggle-icon" id="toggle-${escapedId}" tabindex="0" role="button" aria-label="Expand/collapse test file"></i>
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
        // Handle file-select-all checkboxes
        if (e.target.matches('.file-select-all-checkbox')) {
            const groupId = e.target.id.replace('select-all-', '');
            toggleGroup(groupId, e.target.checked);
        }
    });

    // Click handlers for expand/collapse
    document.addEventListener('click', (e) => {
        // Handle toggle icons
        if (e.target.matches('.toggle-icon')) {
            const toggleId = e.target.id.replace('toggle-', '');
            toggleFile(toggleId);
        }
        // Handle test case labels for better UX
        if (e.target.matches('.test-case-label')) {
            const checkbox = e.target.previousElementSibling;
            if (checkbox && checkbox.type === 'checkbox') {
                checkbox.click();
            }
        }
    });

    // Keyboard support for expand/collapse
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            if (e.target.matches('.toggle-icon')) {
                e.preventDefault();
                const toggleId = e.target.id.replace('toggle-', '');
                toggleFile(toggleId);
            }
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

    // Update status stat item
    const statusStat = document.getElementById('status-stat');
    const selectedStat = document.getElementById('selected-stat');

    // Reset classes
    statusStat.className = 'header-stat-item status';

    if (status === 'running') {
        statusStat.className = 'header-stat-item status running';
        selectedStat.classList.add('selected-active');
    } else if (status === 'success') {
        statusStat.className = 'header-stat-item status connected';
        selectedStat.classList.remove('selected-active');
    } else if (status === 'error') {
        statusStat.className = 'header-stat-item status disconnected';
        selectedStat.classList.remove('selected-active');
    } else {
        statusStat.className = 'header-stat-item status connected';
        selectedStat.classList.remove('selected-active');
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

    // Update selected stat visual feedback
    const selectedStat = document.getElementById('selected-stat');
    if (count > 0) {
        selectedStat.classList.add('has-selection');
    } else {
        selectedStat.classList.remove('has-selection');
    }

    // Update the global select all button appearance
    if (typeof updateSelectAllButton === 'function') {
        updateSelectAllButton();
    }
}

function setButtonsLoading(loading) {
    if (runBtn) {
        runBtn.classList.toggle('loading', loading);
        runBtn.disabled = loading;
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
    try {
        const file = document.getElementById('group-' + fileId);
        const cases = document.getElementById('cases-' + fileId);
        
        if (!file || !cases) {
            console.error('Could not find elements for file:', fileId);
            return;
        }
        
        const isExpanded = file.classList.contains('expanded');

        file.classList.toggle('expanded');

        if (!isExpanded) {
            cases.style.maxHeight = cases.scrollHeight + 'px';
        } else {
            cases.style.maxHeight = '0';
        }
        
        console.log('Toggled file:', fileId, 'expanded:', !isExpanded);
    } catch (error) {
        console.error('Error toggling file:', error);
    }
}

function toggleGroup(groupId, checked) {
    try {
        const group = document.getElementById('group-' + groupId);
        
        if (!group) {
            console.error('Could not find group element:', groupId);
            return;
        }
        
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
        console.log('Toggled group:', groupId, 'checked:', checked, 'affected:', checkboxes.length, 'tests');
    } catch (error) {
        console.error('Error toggling group:', error);
    }
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
        
        // Test failures and errors (highest priority - red)
        if (message.includes('✗') || message.includes('❌') || message.includes('FAIL') || 
            message.includes('Failed Tests') || message.includes('TEST FAILURE') || 
            message.includes('RUNTIME ERROR') || message.includes('Error:') ||
            message.includes('stderr:') || message.includes('Chrome stderr:')) {
            className = 'log-fail';
        }
        // Warnings (orange/yellow)  
        else if (message.includes('⚠️') || message.includes('WARN') || message.includes('Warning:') ||
                message.includes('Could not clean up') || message.includes('Popup blocked')) {
            className = 'log-warning';
        }
        // Test passes and success messages (green)
        else if (message.includes('✓') || message.includes('✅') || message.includes('PASS') ||
                message.includes('Test Files') || message.includes('passed') || 
                message.includes('All tests finished') || message.includes('completed')) {
            className = 'log-pass';
        }
        // Console output, debug info, and test actions (bright green)
        else if (message.includes('🚀') || message.includes('🔍') || message.includes('🌐') || 
                message.includes('📄') || message.includes('📸') || message.includes('📤') ||
                message.includes('📊') || message.includes('📁') || message.includes('🔗') ||
                message.includes('console.log') || message.match(/^\s*stdout \|/) || 
                message.includes('Testing') || message.includes('Page title:') ||
                message.includes('Setting up') || message.includes('Using dynamic port') ||
                message.includes('Response:') || message.includes('Built URL:') ||
                message.includes('Creating session') || message.includes('Session context') ||
                message.includes('WebSocket connected') || message.includes('Chrome launched')) {
            className = 'log-console';
        }
        // Execution info and timing (blue)
        else if (message.includes('RUN') || message.includes('Duration') || message.includes('Start at') ||
                message.includes('Running:') || message.includes('Processing file') ||
                message.includes('Total Test Cases:') || message.includes('Total Assertions:') || 
                message.includes('File:') || message.includes('Test Summary') || 
                message.includes('JSON report') || message.includes('Individual Assertions:')) {
            className = 'log-info';
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
window.openTestReport = openTestReport;

// Function to open the test report
function openTestReport() {
    // Try to open the report in a new tab
    const reportUrl = '/automationTestReport.html';
    const newWindow = window.open(reportUrl, '_blank');
    
    if (newWindow) {
        appendToLog('📊 Opening test report in new tab...', 'log-info');
    } else {
        // If popup blocked, try to navigate
        appendToLog('⚠️ Popup blocked. Trying to navigate to report...', 'log-warning');
        setTimeout(() => {
            window.location.href = reportUrl;
        }, 1000);
    }
}