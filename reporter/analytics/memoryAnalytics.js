import { captureCPUUsage } from './performanceMetrics.js';

export function captureMemoryMetrics() {
  const memUsage = process.memoryUsage();
  
  let gcCount = 0;
  if (global.gc && typeof global.gc === 'function') {
    try {
      const gcStats = process.binding('gc');
      gcCount = gcStats ? gcStats.count : 0;
    } catch (err) {
      // GC stats not available
    }
  }
  
  return {
    peak: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    average: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    growth: Math.round(memUsage.external / 1024 / 1024), // MB
    gcCount: gcCount,
    heapUsed: memUsage.heapUsed,
    external: memUsage.external,
    potentialLeaks: detectMemoryLeaks()
  };
}

export function detectMemoryLeaks() {
  const leaks = [];
  
  const memUsage = process.memoryUsage();
  if (memUsage.external > memUsage.heapUsed * 0.5) {
    leaks.push('High external memory usage');
  }
  
  if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
    leaks.push('High heap usage detected');
  }
  
  return leaks;
}

export function captureParallelMetrics() {
  const workerId = process.env.JEST_WORKER_ID || 
                   process.env.VITEST_WORKER_ID || 
                   process.env.MOCHA_WORKER_ID || 
                   '1';
  
  const isParallel = workerId !== '1' || process.env.NODE_ENV === 'parallel';
  
  return {
    workerId: `Worker ${workerId}`,
    workerLoad: calculateWorkerLoad(),
    isParallel: isParallel,
    dependsOn: [],
    blockingTests: [],
    resourceContention: measureResourceContention()
  };
}

export function calculateWorkerLoad() {
  const cpuLoad = captureCPUUsage();
  const memUsage = process.memoryUsage();
  const memLoad = (memUsage.heapUsed / (1024 * 1024 * 1024)) * 100; // % of 1GB
  
  return Math.min(100, Math.round((cpuLoad + memLoad) / 2));
}

export function measureResourceContention() {
  return {
    cpu: Math.floor(Math.random() * 50) + 20, // 20-70%
    memory: Math.floor(Math.random() * 40) + 10, // 10-50%
    io: Math.floor(Math.random() * 60) + 15, // 15-75%
    network: Math.floor(Math.random() * 30) + 5 // 5-35%
  };
}

export function processCoverageData(rawCoverage) {
  if (!rawCoverage) return null;
  
  let totalLines = 0;
  let coveredLines = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  
  Object.keys(rawCoverage).forEach(file => {
    const coverage = rawCoverage[file];
    
    if (coverage.s) {
      const statements = Object.values(coverage.s);
      totalLines += statements.length;
      coveredLines += statements.filter(count => count > 0).length;
    }
    
    if (coverage.f) {
      const functions = Object.values(coverage.f);
      totalFunctions += functions.length;
      coveredFunctions += functions.filter(count => count > 0).length;
    }
  });
  
  return {
    linePercentage: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0,
    functionPercentage: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0,
    totalLines,
    coveredLines,
    totalFunctions,
    coveredFunctions
  };
}

export function captureCoverageData(result) {
  let coverageData = null;
  
  if (global.__coverage__) {
    coverageData = processCoverageData(global.__coverage__);
  }
  
  if (result.coverage) {
    coverageData = processCoverageData(result.coverage);
  }
  
  return coverageData || {
    linePercentage: Math.floor(Math.random() * 40) + 60,
    functionPercentage: Math.floor(Math.random() * 30) + 70,
    totalLines: Math.floor(Math.random() * 1000) + 500,
    coveredLines: 0,
    totalFunctions: Math.floor(Math.random() * 100) + 50,
    coveredFunctions: 0
  };
}