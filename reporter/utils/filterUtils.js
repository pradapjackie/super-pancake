/**
 * Filter and Search Utilities
 * Handles filtering, searching, and view management
 */

let currentFilter = 'all';
let currentView = 'grid';


/**
 * Initialize filter functionality
 */
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            setActiveFilter(this);
            filterTests(filter);
        });
    });
}

/**
 * Set active filter button
 */
function setActiveFilter(activeBtn) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

/**
 * Filter tests based on status
 */
function filterTests(filter) {
    currentFilter = filter;
    const allTests = window.getAllTests();
    
    if (filter === 'all') {
        window.setFilteredTests([...allTests]);
    } else {
        const filtered = allTests.filter(test => test.status === filter);
        window.setFilteredTests(filtered);
    }
    
    // Re-render the current view with filtered data
    refreshCurrentView();
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInput = document.getElementById('testFileSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            searchTests(searchTerm);
        });
    }
}

/**
 * Search tests by name or description
 */
function searchTests(searchTerm) {
    if (!searchTerm) {
        // If no search term, reset to current filter
        filterTests(currentFilter);
        return;
    }
    
    const allTests = window.getAllTests();
    const filtered = allTests.filter(test => {
        const testName = (test.testName || test.description || '').toLowerCase();
        const fileName = (test.fileName || test.file || '').toLowerCase();
        return testName.includes(searchTerm) || fileName.includes(searchTerm);
    });
    
    window.setFilteredTests(filtered);
    refreshCurrentView();
}

/**
 * Initialize view toggle functionality
 */
function initializeViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            setActiveView(this);
            switchView(view);
        });
    });
}

/**
 * Set active view button
 */
function setActiveView(activeBtn) {
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

/**
 * Switch between grid and list view
 */
function switchView(view) {
    currentView = view;
    const resultsGrid = document.querySelector('.results-grid');
    if (resultsGrid) {
        if (view === 'list') {
            resultsGrid.classList.add('list-view');
        } else {
            resultsGrid.classList.remove('list-view');
        }
    }
}

/**
 * Initialize tabs functionality
 */
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        // Tab functionality is handled by inline onclick attributes
        // This could be refactored to use event listeners in the future
    });
}

/**
 * Refresh the current view with filtered data
 */
function refreshCurrentView() {
    const currentTab = window.getCurrentTab ? window.getCurrentTab() : 'overview';
    
    switch (currentTab) {
        case 'overview':
            if (typeof renderTestFiles === 'function') {
                renderTestFiles();
            }
            break;
        case 'results':
            if (typeof renderResultsView === 'function') {
                renderResultsView();
            }
            break;
        // Add other tabs as needed
    }
}

/**
 * Show fallback message when charts fail to load
 */
function showChartFallback() {
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        if (!container.querySelector('canvas')) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #64748b;">
                    <div style="text-align: center;">
                        <i class="fas fa-chart-bar" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>Chart data will be available when tests are run</p>
                    </div>
                </div>
            `;
        }
    });
}

/**
 * Download report functionality
 */
function downloadReport() {
    const html = document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Theme toggle functionality
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    const toggleButton = document.getElementById('themeToggle');
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button text and icon
    const icon = toggleButton.querySelector('i');
    const text = toggleButton.querySelector('span');
    
    if (newTheme === 'dark') {
        icon.className = 'fas fa-sun';
        text.textContent = 'Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark Mode';
    }
    
    console.log(`🎨 Theme switched to: ${newTheme}`);
}

/**
 * Initialize theme from localStorage
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const toggleButton = document.getElementById('themeToggle');
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (toggleButton) {
        const icon = toggleButton.querySelector('i');
        const text = toggleButton.querySelector('span');
        
        if (savedTheme === 'dark') {
            icon.className = 'fas fa-sun';
            text.textContent = 'Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark Mode';
        }
    }
}

// Export functions globally
// initializeReport is defined elsewhere
window.initializeFilters = initializeFilters;
window.filterTests = filterTests;
window.searchTests = searchTests;
window.initializeSearch = initializeSearch;
window.initializeViewToggle = initializeViewToggle;
window.switchView = switchView;
window.initializeTabs = initializeTabs;
window.refreshCurrentView = refreshCurrentView;
window.showChartFallback = showChartFallback;
window.downloadReport = downloadReport;
window.toggleTheme = toggleTheme;
window.initializeTheme = initializeTheme;