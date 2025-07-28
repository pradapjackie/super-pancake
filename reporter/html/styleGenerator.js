export function generateStylesheet() {
  return `
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --primary: #6366f1; --success: #10b981; --danger: #ef4444; --warning: #f59e0b;
            --light: #f8fafc; --dark: #1e293b; --border: #e2e8f0;
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); --radius: 12px;
        }
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; color: var(--dark);
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        
        /* Header Styles */
        .header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            padding: 2rem 0;
        }
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
        }
        .logo h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        .logo p {
            opacity: 0.8;
            font-size: 0.9rem;
        }
        .header-stats {
            display: flex;
            gap: 2rem;
        }
        .stat-item {
            text-align: center;
        }
        .stat-value {
            display: block;
            font-size: 2rem;
            font-weight: bold;
        }
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        /* Summary Cards */
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .summary-card {
            background: white;
            padding: 1.5rem;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .card-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        .success .card-icon {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success);
        }
        .danger .card-icon {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
        }
        .warning .card-icon {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
        }
        .info .card-icon {
            background: rgba(99, 102, 241, 0.1);
            color: var(--primary);
        }
        .card-content h3 {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        .card-content p {
            color: #64748b;
            font-weight: 500;
        }
        
        /* Tab Navigation */
        .analytics-dashboard {
            background: white;
            margin: 2rem 0;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            overflow: hidden;
        }
        .tab-navigation {
            display: flex;
            background: #f8fafc;
            border-bottom: 2px solid var(--border);
            overflow-x: auto;
        }
        .tab-btn {
            flex: 1;
            min-width: 150px;
            padding: 1rem 1.5rem;
            border: none;
            background: transparent;
            color: #64748b;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            border-bottom: 3px solid transparent;
        }
        .tab-btn:hover {
            background: rgba(99, 102, 241, 0.1);
            color: var(--primary);
        }
        .tab-btn.active {
            background: white;
            color: var(--primary);
            border-bottom-color: var(--primary);
        }
        .tab-content {
            position: relative;
            min-height: 500px;
        }
        .tab-panel {
            display: none;
            padding: 2rem;
            animation: fadeIn 0.3s ease-in-out;
        }
        .tab-panel.active {
            display: block;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Section Headers */
        .section-header {
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--border);
        }
        .section-header h2 {
            font-size: 1.5rem;
            color: var(--dark);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        /* Charts */
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
        }
        .chart-container {
            background: white;
            padding: 1.5rem;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
        }
        .chart-container h3 {
            margin-bottom: 1rem;
            color: var(--dark);
        }
        
        /* Test Files Structure */
        .test-files-container {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .test-file-section {
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.2s ease;
        }
        .test-file-section.file-success {
            border-left: 4px solid var(--success);
        }
        .test-file-section.file-warning {
            border-left: 4px solid var(--warning);
        }
        .test-file-section.file-error {
            border-left: 4px solid var(--danger);
        }
        .test-file-header {
            display: grid;
            grid-template-columns: auto 1fr auto auto auto;
            align-items: center;
            gap: 1rem;
            padding: 1.25rem 1.5rem;
            background: var(--light);
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .test-file-header:hover {
            background: #f1f5f9;
        }
        
        /* Test Cards */
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
        }
        .test-card {
            background: white;
            border-radius: var(--radius);
            padding: 1.5rem;
            box-shadow: var(--shadow);
            border-left: 4px solid var(--border);
            transition: all 0.2s ease;
        }
        .test-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        .test-card.passed {
            border-left-color: var(--success);
        }
        .test-card.failed {
            border-left-color: var(--danger);
        }
        .test-card.skipped {
            border-left-color: var(--warning);
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                gap: 1rem;
                text-align: center;
            }
            .header-stats {
                flex-direction: column;
                gap: 1rem;
            }
            .summary-cards {
                grid-template-columns: 1fr;
            }
            .tab-navigation {
                flex-direction: column;
            }
            .tab-btn {
                min-width: unset;
            }
        }
    </style>`;
}