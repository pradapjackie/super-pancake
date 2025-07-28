export function generateJavaScript() {
  return `
    <script>
        // Tab switching functionality
        function switchTab(tabName) {
            // Hide all tab panels
            document.querySelectorAll('.tab-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            
            // Remove active class from all tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab panel
            document.getElementById(tabName + 'Content').classList.add('active');
            
            // Add active class to clicked button
            event.target.classList.add('active');
            
            // Initialize charts for performance tab
            if (tabName === 'performance') {
                initializePerformanceCharts();
            }
        }
        
        // Initialize performance charts
        function initializePerformanceCharts() {
            // Performance Chart
            const performanceCtx = document.getElementById('performanceChart');
            if (performanceCtx && !performanceCtx.chart) {
                performanceCtx.chart = new Chart(performanceCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Setup', 'Execution', 'Teardown', 'Reporting'],
                        datasets: [{
                            data: [
                                Math.floor(Math.random() * 500) + 100,
                                Math.floor(Math.random() * 2000) + 500,
                                Math.floor(Math.random() * 300) + 50,
                                Math.floor(Math.random() * 200) + 100
                            ],
                            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
            
            // Trends Chart
            const trendsCtx = document.getElementById('trendsChart');
            if (trendsCtx && !trendsCtx.chart) {
                const labels = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                });
                
                trendsCtx.chart = new Chart(trendsCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Passed Tests',
                            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 30),
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4
                        }, {
                            label: 'Failed Tests',
                            data: Array.from({ length: 7 }, () => Math.floor(Math.random() * 10) + 2),
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }
        
        // Test file toggle functionality
        function toggleTestFile(element) {
            const content = element.nextElementSibling;
            const icon = element.querySelector('.file-icon i');
            
            if (content.style.display === 'none' || !content.style.display) {
                content.style.display = 'block';
                icon.className = 'fas fa-chevron-down';
            } else {
                content.style.display = 'none';
                icon.className = 'fas fa-chevron-right';
            }
        }
        
        // Test details modal
        function showTestDetails(testId) {
            // Implementation for showing test details modal
            console.log('Showing details for test:', testId);
        }
        
        // Search functionality
        function filterTests() {
            const searchTerm = document.getElementById('testSearch').value.toLowerCase();
            const testCards = document.querySelectorAll('.test-card');
            
            testCards.forEach(card => {
                const testName = card.querySelector('h4').textContent.toLowerCase();
                const testDescription = card.querySelector('p').textContent.toLowerCase();
                
                if (testName.includes(searchTerm) || testDescription.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }
        
        // Utility functions
        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        function formatDuration(ms) {
            if (!ms || ms < 0) return '0ms';
            
            if (ms < 1000) {
                return \`\${Math.round(ms * 10) / 10}ms\`;
            }
            
            const seconds = ms / 1000;
            if (seconds < 60) {
                return \`\${Math.round(seconds * 10) / 10}s\`;
            }
            
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);
            return \`\${minutes}m \${remainingSeconds}s\`;
        }
        
        function getStatusIcon(status) {
            switch (status) {
                case 'passed': return 'check-circle';
                case 'failed': return 'times-circle';
                case 'skipped': return 'minus-circle';
                default: return 'question-circle';
            }
        }
        
        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🥞 Super Pancake Test Report initialized');
            
            // Initialize default tab
            initializePerformanceCharts();
        });
    </script>`;
}