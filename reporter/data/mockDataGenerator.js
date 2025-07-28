export function generateMockCoverageFiles() {
  const fileCount = Math.floor(8 + Math.random() * 15);
  return Array.from({ length: fileCount }, (_, i) => ({
    name: `src/components/Component${i + 1}.js`,
    coverage: Math.floor(Math.random() * 40) + 60,
    lines: Math.floor(Math.random() * 200) + 50,
    uncovered: Math.floor(Math.random() * 20) + 5
  }));
}

export function generateMockUncoveredLines() {
  const lineCount = Math.floor(5 + Math.random() * 15);
  return Array.from({ length: lineCount }, (_, i) => ({
    line: Math.floor(Math.random() * 100) + 10,
    code: `// Uncovered code line ${i + 1}`,
    reason: ['Not executed in tests', 'Error handling path', 'Edge case scenario'][Math.floor(Math.random() * 3)]
  }));
}

export function generateMockMemoryTests() {
  const testCount = Math.floor(5 + Math.random() * 10);
  return Array.from({ length: testCount }, (_, i) => ({
    name: `Memory Test ${i + 1}`,
    startMemory: Math.floor(Math.random() * 50) + 20,
    endMemory: Math.floor(Math.random() * 80) + 30,
    duration: Math.floor(Math.random() * 5000) + 1000,
    growth: Math.floor(Math.random() * 30) + 5
  }));
}

export function generateMockMemoryLeaks() {
  const leakTypes = [
    'Event Listeners',
    'DOM References', 
    'Timers/Intervals',
    'Cache Objects',
    'Image Assets'
  ];
  
  return [
    {
      source: 'Event Listeners',
      description: 'Click handlers not properly removed from DOM elements',
      severity: 'warning',
      size: 8,
      frequency: 3
    },
    {
      source: 'DOM References',
      description: 'Cached DOM elements preventing garbage collection',
      severity: 'critical',
      size: 15,
      frequency: 5
    },
    {
      source: 'Image Assets',
      description: 'Large images cached during tests not being released',
      severity: 'critical',
      size: 25,
      frequency: 2
    },
    {
      source: 'WebSocket Connections',
      description: 'WebSocket connections not properly closed',
      severity: 'warning',
      size: 12,
      frequency: 4
    }
  ];
}

export function generateMockWorkers() {
  const workerCount = Math.floor(4 + Math.random() * 8);
  const statuses = ['active', 'idle', 'busy'];
  
  return Array.from({ length: workerCount }, (_, i) => ({
    name: `Worker ${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    load: Math.floor(Math.random() * 100),
    testsRunning: Math.floor(Math.random() * 5),
    cpu: Math.floor(Math.random() * 80) + 10,
    memory: Math.floor(Math.random() * 60) + 20
  }));
}

export function generateMockChartData() {
  return {
    performance: {
      labels: ['Setup', 'Execution', 'Teardown', 'Reporting'],
      values: [
        Math.floor(Math.random() * 500) + 100,
        Math.floor(Math.random() * 2000) + 500,
        Math.floor(Math.random() * 300) + 50,
        Math.floor(Math.random() * 200) + 100
      ]
    },
    stability: {
      labels: ['Stable', 'Flaky', 'Unstable'],
      values: [
        Math.floor(Math.random() * 80) + 70,
        Math.floor(Math.random() * 20) + 5,
        Math.floor(Math.random() * 10) + 2
      ]
    },
    trends: {
      labels: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      passed: Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 30),
      failed: Array.from({ length: 7 }, () => Math.floor(Math.random() * 10) + 2),
      duration: Array.from({ length: 7 }, () => Math.floor(Math.random() * 5000) + 2000)
    }
  };
}