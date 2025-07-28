import { getPreviousTestResults } from '../core/testResultProcessor.js';

export function capturePerformanceMetrics(result) {
  const startTime = result.startTime || Date.now();
  const endTime = result.endTime || Date.now();
  const executionTime = endTime - startTime;
  
  const isFlaky = analyzeFlakiness(result);
  
  return {
    executionTime: executionTime,
    setupTime: result.setupTime || Math.floor(executionTime * 0.1),
    teardownTime: result.teardownTime || Math.floor(executionTime * 0.05),
    cpuUsage: captureCPUUsage(),
    networkTime: result.networkTime || 0,
    slowestOperation: identifySlowestOperation(result),
    isFlaky: isFlaky
  };
}

export function analyzeFlakiness(result) {
  const testName = result.testName || '';
  const retryCount = result.retryCount || 0;
  const previousResults = getPreviousTestResults(testName);
  
  if (retryCount > 0) return true;
  if (testName.match(/(async|timing|race|network|api)/i)) return true;
  if (previousResults.length > 3) {
    const passRate = previousResults.filter(r => r.status === 'passed').length / previousResults.length;
    if (passRate < 0.9 && passRate > 0.1) return true;
  }
  
  return false;
}

export function captureCPUUsage() {
  const cpuUsage = process.cpuUsage();
  return Math.round((cpuUsage.user + cpuUsage.system) / 1000);
}

export function identifySlowestOperation(result) {
  const operations = result.steps || result.logs || [];
  let slowest = null;
  let maxDuration = 0;
  
  operations.forEach(op => {
    if (op.duration && op.duration > maxDuration) {
      maxDuration = op.duration;
      slowest = op.name || op.message || 'Unknown Operation';
    }
  });
  
  return slowest || 'Test Execution';
}

export function measureResourceContention() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  const memoryPressure = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  const cpuPressure = Math.min(100, (cpuUsage.user + cpuUsage.system) / 1000 / 10);
  
  return {
    memory: Math.round(memoryPressure),
    cpu: Math.round(cpuPressure),
    overall: Math.round((memoryPressure + cpuPressure) / 2)
  };
}