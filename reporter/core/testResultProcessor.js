import fs from 'fs';
import path from 'path';

export function generateTestId() {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function collectResultFiles() {
  const resultsDir = 'test-report/results';
  
  if (!fs.existsSync(resultsDir)) {
    console.warn('⚠️ Results directory not found:', resultsDir);
    return [];
  }

  const results = [];
  let totalTests = 0;
  let actuallyExecutedTests = 0;
  
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const result = JSON.parse(content);
          
          console.log(`📄 Processing result file: ${fullPath}`);
          console.log(`   Total tests in file: ${result.numTotalTests || 'N/A'}`);
          console.log(`   Passed: ${result.numPassedTests || 0}, Failed: ${result.numFailedTests || 0}, Pending: ${result.numPendingTests || 0}`);
          
          if (result.testResults && Array.isArray(result.testResults)) {
            result.testResults.forEach(testFile => {
              if (testFile.assertionResults && Array.isArray(testFile.assertionResults)) {
                testFile.assertionResults.forEach(test => {
                  // Count all tests, including skipped and pending
                  totalTests++;
                  
                  // Map Jest/Vitest status to our standard statuses
                  let mappedStatus = test.status;
                  if (test.status === 'failed' || test.status === 'passed') {
                    actuallyExecutedTests++;
                  } else if (test.status === 'skipped' || test.status === 'pending' || test.status === 'todo') {
                    mappedStatus = 'skipped';
                  }
                  
                  const testDuration = test.duration || 0;
                  const enhancedResult = {
                    testName: test.title || test.fullName || 'Unnamed Test',
                    description: test.fullName || test.title || 'No description available',
                    status: mappedStatus,
                    duration: testDuration,
                    startTime: testFile.startTime || Date.now() - testDuration,
                    endTime: testFile.endTime || Date.now(),
                    browser: 'Chrome',
                    environment: process.env.NODE_ENV === 'test' ? 'Test' : 'Local',
                    tags: test.ancestorTitles || [],
                    screenshots: [],
                    logs: [],
                    error: test.failureMessages && test.failureMessages.length > 0 ? 
                           test.failureMessages.join('\n').replace(/\x1b\[[0-9;]*m/g, '') : null, // Strip ANSI codes
                    id: generateTestId(),
                    timestamp: new Date(testFile.startTime || Date.now()).toISOString(),
                    retryCount: test.invocations ? Math.max(0, test.invocations - 1) : 0,
                    testFilePath: testFile.name || fullPath,
                    metadata: {
                      framework: 'Super Pancake Automation',
                      version: '2.9.0',
                      nodeVersion: process.version,
                      platform: process.platform,
                      captureTime: Date.now(),
                      suiteStatus: testFile.status,
                      suiteMessage: testFile.message
                    }
                  };
                  
                  results.push(enhancedResult);
                });
              }
            });
          } else if (result.testName || result.description) {
            totalTests++;
            actuallyExecutedTests++;
            results.push(result);
          }
        } catch (error) {
          console.error(`❌ Error processing ${fullPath}:`, error.message);
        }
      }
    });
  }
  
  scanDirectory(resultsDir);
  
  console.log(`📊 Collected ${results.length} test results from ${totalTests} total tests`);
  console.log(`   Actually executed: ${actuallyExecutedTests}`);
  
  return results;
}

export function generateTestSummary(results) {
  const summary = {
    total: results.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    totalDuration: 0,
    startTime: null,
    endTime: null,
    browsers: new Set(),
    environments: new Set(),
    tags: new Set()
  };

  results.forEach(result => {
    switch (getTestStatus(result).toLowerCase()) {
      case 'passed':
        summary.passed++;
        break;
      case 'failed':
        summary.failed++;
        break;
      case 'skipped':
        summary.skipped++;
        break;
    }

    summary.totalDuration += result.duration || 0;

    if (result.browser) summary.browsers.add(result.browser);
    if (result.environment) summary.environments.add(result.environment);
    if (result.tags && Array.isArray(result.tags)) {
      result.tags.forEach(tag => summary.tags.add(tag));
    }

    const testTime = new Date(result.timestamp || result.startTime || Date.now());
    if (!summary.startTime || testTime < summary.startTime) {
      summary.startTime = testTime;
    }
    if (!summary.endTime || testTime > summary.endTime) {
      summary.endTime = testTime;
    }
  });

  summary.browsers = Array.from(summary.browsers);
  summary.environments = Array.from(summary.environments);
  summary.tags = Array.from(summary.tags);

  return summary;
}

export function getTestStatus(result) {
  if (!result.status) return 'unknown';
  const status = result.status.toLowerCase();
  if (['passed', 'pass', 'success'].includes(status)) return 'passed';
  if (['failed', 'fail', 'error'].includes(status)) return 'failed';
  if (['skipped', 'skip'].includes(status)) return 'skipped';
  return 'unknown';
}

export function sanitizeResults(results) {
  return results.map(result => ({
    ...result,
    error: result.error && typeof result.error === 'string' ? 
      result.error.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'") : result.error
  }));
}

export function getPreviousTestResults(testName) {
  const historyFile = 'test-report/test-history.json';
  
  try {
    if (fs.existsSync(historyFile)) {
      const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      return history[testName] || [];
    }
  } catch (err) {
    console.warn('Could not read test history:', err.message);
  }
  
  return [];
}

export function updateTestHistory(testName, result) {
  const historyFile = 'test-report/test-history.json';
  let history = {};
  
  try {
    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
  } catch (err) {
    console.warn('Could not read existing history:', err.message);
  }
  
  if (!history[testName]) {
    history[testName] = [];
  }
  
  history[testName].push({
    status: result.status,
    duration: result.duration,
    timestamp: result.timestamp,
    retryCount: result.retryCount || 0
  });
  
  if (history[testName].length > 20) {
    history[testName] = history[testName].slice(-20);
  }
  
  try {
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (err) {
    console.warn('Could not write test history:', err.message);
  }
}