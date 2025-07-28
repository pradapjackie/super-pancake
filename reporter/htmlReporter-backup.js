// Enhanced HTML Reporter with Modern UI - Modular Version
import fs from 'fs';
import path from 'path';
import { generateBaseTemplate, generateSelfContainedTemplate } from './templates/baseTemplate.js';

// Core modules
import { initializeReportDirectory } from './core/reportInitializer.js';
import { 
  generateTestId, 
  collectResultFiles, 
  generateTestSummary, 
  sanitizeResults,
  updateTestHistory 
} from './core/testResultProcessor.js';

// Analytics modules
import { capturePerformanceMetrics } from './analytics/performanceMetrics.js';
import { captureMemoryMetrics, captureParallelMetrics, captureCoverageData } from './analytics/memoryAnalytics.js';

// HTML generation modules
import { generateModernHTML } from './html/templateGenerator.js';

console.log('🎨 Modern HTML Reporter (Modular) loaded');

// Export the main interface functions
export { initializeReportDirectory };

export function addTestResult(result) {
  const dir = 'test-report/results';

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Capture real performance and system metrics
  const performanceMetrics = capturePerformanceMetrics(result);
  const memoryMetrics = captureMemoryMetrics();
  const parallelMetrics = captureParallelMetrics();

  // Enhance result with comprehensive analytics data
  const enhancedResult = {
    ...result,
    id: result.id || generateTestId(),
    timestamp: result.timestamp || new Date().toISOString(),
    duration: result.duration || 0,
    browser: result.browser || 'Chrome',
    environment: result.environment || 'Local',
    tags: result.tags || [],
    screenshots: result.screenshots || [],
    logs: result.logs || [],
    
    // Performance Analytics Data
    performanceMetrics: {
      executionTime: performanceMetrics.executionTime,
      setupTime: performanceMetrics.setupTime,
      teardownTime: performanceMetrics.teardownTime,
      cpuUsage: performanceMetrics.cpuUsage,
      networkTime: performanceMetrics.networkTime,
      slowestOperation: performanceMetrics.slowestOperation,
      retryCount: result.retryCount || 0,
      isFlaky: performanceMetrics.isFlaky
    },
    
    // Memory Analytics Data
    memoryMetrics: {
      peakMemory: memoryMetrics.peak,
      averageMemory: memoryMetrics.average,
      memoryGrowth: memoryMetrics.growth,
      gcCount: memoryMetrics.gcCount,
      heapUsed: memoryMetrics.heapUsed,
      external: memoryMetrics.external,
      potentialLeaks: memoryMetrics.potentialLeaks
    },
    
    // Parallel Execution Data
    parallelMetrics: {
      workerId: parallelMetrics.workerId,
      workerLoad: parallelMetrics.workerLoad,
      isParallel: parallelMetrics.isParallel,
      dependsOn: parallelMetrics.dependsOn || [],
      blockingTests: parallelMetrics.blockingTests || [],
      resourceContention: parallelMetrics.resourceContention
    },
    
    // Coverage Data (if available)
    coverageData: captureCoverageData(result),
    
    metadata: {
      framework: 'Super Pancake Automation',
      version: '2.9.0',
      nodeVersion: process.version,
      platform: process.platform,
      captureTime: Date.now(),
      ...result.metadata
    }
  };

  // Save individual test result
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `test-${timestamp}-${Math.random().toString(36).substr(2, 9)}.json`;
  const filepath = path.join(dir, filename);

  try {
    fs.writeFileSync(filepath, JSON.stringify(enhancedResult, null, 2));
    console.log(`✅ Test result saved: ${filepath}`);
    
    // Update test history for flaky analysis
    updateTestHistory(enhancedResult.testName, enhancedResult);
    
    // Store in global results if available
    if (global.allTestResults) {
      global.allTestResults.set(enhancedResult.id, enhancedResult);
    }
  } catch (error) {
    console.error('❌ Failed to save test result:', error);
  }
}

export function generateModularHTML(testSummary) {
  console.log('🔧 Generating modular HTML report...');
  
  try {
    // Collect all test results
    const results = collectResultFiles();
    console.log(`📊 Processing ${results.length} test results`);
    
    // Generate summary if not provided
    const summary = testSummary || generateTestSummary(results);
    
    // Sanitize results for HTML output
    const sanitizedResults = sanitizeResults(results);
    
    // Generate the modern HTML report
    const htmlContent = generateModernHTML(summary, sanitizedResults);
    
    // Save the HTML report
    const reportPath = 'test-report/index.html';
    
    if (!fs.existsSync('test-report')) {
      fs.mkdirSync('test-report', { recursive: true });
    }
    
    fs.writeFileSync(reportPath, htmlContent);
    console.log(`📄 HTML report generated: ${path.resolve(reportPath)}`);
    
    // Generate self-contained version if base template is available
    try {
      const selfContainedHtml = generateSelfContainedTemplate(summary, sanitizedResults);
      const selfContainedPath = 'test-report/report-standalone.html';
      fs.writeFileSync(selfContainedPath, selfContainedHtml);
      console.log(`📄 Standalone report generated: ${path.resolve(selfContainedPath)}`);
    } catch (templateError) {
      console.warn('⚠️ Could not generate standalone report:', templateError.message);
    }
    
    return htmlContent;
  } catch (error) {
    console.error('❌ Failed to generate HTML report:', error);
    return generateFallbackHTML(error);
  }
}

function generateFallbackHTML(error) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - Error</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .error-container { 
            background: white; padding: 30px; border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto;
        }
        .error-title { color: #dc3545; margin-bottom: 20px; }
        .error-message { 
            background: #f8f9fa; padding: 15px; border-radius: 4px; 
            border-left: 4px solid #dc3545; font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1 class="error-title">🚨 Report Generation Error</h1>
        <p>There was an error generating the test report. Please check the console for more details.</p>
        <div class="error-message">${error.message}</div>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
}

// Legacy compatibility - ensure existing code still works
export const generateHTML = generateModularHTML;
export default {
  initializeReportDirectory,
  addTestResult,
  generateModularHTML,
  generateHTML: generateModularHTML
};