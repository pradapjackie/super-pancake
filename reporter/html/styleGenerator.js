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
        
        /* Console Logs Display */
        .test-logs {
            margin-top: 16px;
            padding: 16px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            font-size: 0.85rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .logs-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            font-weight: 600;
            color: #475569;
        }
        .logs-header .logs-title {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .logs-header i {
            color: #6366f1;
            font-size: 1rem;
        }
        .btn-view-all-logs {
            padding: 6px 12px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
        }
        .btn-view-all-logs:hover {
            background: linear-gradient(135deg, #5b5cf0 0%, #7c3aed 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
        }
        .btn-view-all-logs:active {
            transform: translateY(0);
        }
        .logs-preview {
            margin-top: 12px;
        }
        .log-text-preview {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.75rem;
            line-height: 1.5;
            color: #374151;
            background: white;
            padding: 14px;
            border-radius: 8px;
            border: 1px solid #d1d5db;
            max-height: 140px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-word;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .log-text-preview::-webkit-scrollbar {
            width: 6px;
        }
        .log-text-preview::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 3px;
        }
        .log-text-preview::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
        }
        .log-text-preview::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
        
        /* Console Logs Modal */
        .logs-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
            animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .logs-modal {
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            max-width: 95vw;
            max-height: 90vh;
            width: 900px;
            display: flex;
            flex-direction: column;
            animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to { 
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        .logs-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 24px;
            border-bottom: 1px solid #e2e8f0;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 16px 16px 0 0;
        }
        .logs-modal-header h3 {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.4rem;
            font-weight: 600;
            color: #1e293b;
        }
        .logs-modal-header i {
            color: #6366f1;
            font-size: 1.2rem;
        }
        .close-btn {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            border: none;
            background: #f1f5f9;
            color: #64748b;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        .close-btn:hover {
            background: #e2e8f0;
            color: #475569;
        }
        .logs-modal-content {
            padding: 24px;
            overflow-y: auto;
            flex: 1;
        }
        .test-info {
            margin-bottom: 20px;
            padding: 16px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
        }
        .test-info h4 {
            margin-bottom: 8px;
            color: #1e293b;
            font-size: 1.1rem;
            font-weight: 600;
        }
        .test-meta {
            display: flex;
            gap: 20px;
            font-size: 0.85rem;
            color: #64748b;
            flex-wrap: wrap;
        }
        .test-meta span {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .logs-content h4 {
            margin-bottom: 16px;
            color: #374151;
            font-size: 1rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .logs-content h4:before {
            content: "📋";
            font-size: 1.1rem;
        }
        .full-log-text {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.8rem;
            line-height: 1.6;
            color: #374151;
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            white-space: pre-wrap;
            word-break: break-word;
            max-height: 500px;
            overflow-y: auto;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        .full-log-text::-webkit-scrollbar {
            width: 8px;
        }
        .full-log-text::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
        }
        .full-log-text::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        .full-log-text::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
        .logs-modal-footer {
            display: flex;
            gap: 14px;
            justify-content: flex-end;
            padding: 24px;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 0 0 16px 16px;
        }
        .btn-copy-logs {
            padding: 10px 18px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }
        .btn-copy-logs:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }
        .btn-close {
            padding: 10px 18px;
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);
        }
        .btn-close:hover {
            background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(107, 114, 128, 0.3);
        }
        
        /* Console Logs in Error Modals */
        .error-logs {
            margin-top: 16px;
            padding: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
        }
        .error-logs h4 {
            margin-bottom: 12px;
            color: #374151;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .error-logs h4:before {
            content: "📝";
            font-size: 1rem;
        }
        .logs-preview-modal {
            margin-bottom: 8px;
        }
        .logs-preview-modal .log-text {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.75rem;
            line-height: 1.4;
            color: #374151;
            background: white;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #d1d5db;
            max-height: 200px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-word;
        }
        .btn-view-all-logs-modal {
            padding: 6px 12px;
            background: #6366f1;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: background 0.2s;
        }
        .btn-view-all-logs-modal:hover {
            background: #5b5cf0;
        }
        
        /* View Logs Button in Actions */
        .btn-view-logs {
            padding: 8px 14px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }
        .btn-view-logs:hover {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }
        .btn-view-logs:active {
            transform: translateY(0);
        }
        
        /* Enhanced Test Actions */
        .test-actions {
            margin-top: 16px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-items: center;
        }
        .test-actions button {
            font-size: 0.8rem;
            padding: 8px 14px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.3s ease;
            font-weight: 500;
            min-height: 36px;
        }
        .btn-view-details {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
        }
        .btn-view-details:hover {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
        }
        .btn-view-screenshot {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
        }
        .btn-view-screenshot:hover {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(245, 158, 11, 0.3);
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