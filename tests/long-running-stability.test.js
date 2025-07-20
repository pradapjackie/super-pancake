// Long-Running Stability Test for Super Pancake Framework
// Validates framework stability over extended periods with continuous operations

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  withErrorRecovery, 
  withRetry, 
  safeExecute, 
  getCircuitBreaker,
  getAllCircuitBreakers 
} from '../core/errors.js';
import { 
  getHealthMonitor,
  startHealthMonitoring,
  stopHealthMonitoring,
  getHealthStatus,
  getHealthMetrics,
  addHealthCheck
} from '../core/health-monitor.js';
import { configureEnhancedCaching, getCacheStats, clearQueryCache } from '../core/query-cache.js';

// Test configuration for long-running tests
const LONG_RUNNING_CONFIG = {
  DURATION_MS: 60000,        // 1 minute for testing (can be extended)
  OPERATION_INTERVAL_MS: 500, // Operations every 500ms
  HEALTH_CHECK_INTERVAL_MS: 5000, // Health checks every 5 seconds
  MEMORY_CHECK_INTERVAL_MS: 10000, // Memory checks every 10 seconds
  FAILURE_INJECTION_RATE: 0.1, // 10% failure rate for resilience testing
  MAX_MEMORY_INCREASE_MB: 50,  // Maximum acceptable memory increase
  MIN_SUCCESS_RATE: 0.85      // Minimum 85% success rate required
};

// Global state for long-running test
let longRunningState = {
  startTime: null,
  operations: {
    total: 0,
    successful: 0,
    failed: 0,
    errors: []
  },
  memory: {
    initial: null,
    peak: 0,
    current: 0,
    samples: []
  },
  health: {
    checks: 0,
    healthy: 0,
    unhealthy: 0,
    downtimeMs: 0
  },
  circuits: {
    opened: 0,
    recovered: 0,
    failures: 0
  }
};

describe('Long-Running Stability Tests', () => {
  
  beforeAll(async () => {
    console.log('🕐 Initializing long-running stability test...');
    console.log(`📅 Duration: ${LONG_RUNNING_CONFIG.DURATION_MS / 1000} seconds`);
    console.log(`⚡ Operation interval: ${LONG_RUNNING_CONFIG.OPERATION_INTERVAL_MS}ms`);
    
    // Configure framework for extended testing
    configureEnhancedCaching({
      maxSize: 500,
      dynamicTTL: 3000,
      staticTTL: 15000
    });
    
    // Start health monitoring with frequent checks
    startHealthMonitoring(LONG_RUNNING_CONFIG.HEALTH_CHECK_INTERVAL_MS);
    
    // Add specialized health checks for long-running test
    addHealthCheck('long-running-memory', async () => {
      const usage = process.memoryUsage();
      const currentMB = Math.round(usage.heapUsed / 1024 / 1024);
      
      longRunningState.memory.current = currentMB;
      if (currentMB > longRunningState.memory.peak) {
        longRunningState.memory.peak = currentMB;
      }
      
      longRunningState.memory.samples.push({
        timestamp: Date.now(),
        heapUsed: currentMB,
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024)
      });
      
      // Keep only recent samples
      if (longRunningState.memory.samples.length > 100) {
        longRunningState.memory.samples = longRunningState.memory.samples.slice(-100);
      }
      
      const memoryIncrease = longRunningState.memory.initial 
        ? currentMB - longRunningState.memory.initial 
        : 0;
      
      return {
        healthy: memoryIncrease < LONG_RUNNING_CONFIG.MAX_MEMORY_INCREASE_MB,
        heapUsed: currentMB,
        increase: memoryIncrease,
        peak: longRunningState.memory.peak
      };
    }, { critical: true, description: 'Long-running memory monitoring' });
    
    addHealthCheck('long-running-operations', async () => {
      const successRate = longRunningState.operations.total > 0 
        ? longRunningState.operations.successful / longRunningState.operations.total 
        : 1;
      
      return {
        healthy: successRate >= LONG_RUNNING_CONFIG.MIN_SUCCESS_RATE,
        successRate: Math.round(successRate * 100) / 100,
        totalOps: longRunningState.operations.total,
        successful: longRunningState.operations.successful,
        failed: longRunningState.operations.failed
      };
    }, { critical: true, description: 'Operation success rate monitoring' });
    
    // Record initial memory
    const initialMemory = process.memoryUsage();
    longRunningState.memory.initial = Math.round(initialMemory.heapUsed / 1024 / 1024);
    longRunningState.memory.current = longRunningState.memory.initial;
    longRunningState.memory.peak = longRunningState.memory.initial;
    
    console.log(`💾 Initial memory usage: ${longRunningState.memory.initial}MB`);
    console.log('✅ Long-running test environment ready');
  });

  afterAll(() => {
    stopHealthMonitoring();
    
    // Generate comprehensive long-running test report
    console.log('\n' + '=' .repeat(80));
    console.log('📊 LONG-RUNNING STABILITY TEST REPORT');
    console.log('=' .repeat(80));
    
    const duration = longRunningState.startTime 
      ? (Date.now() - longRunningState.startTime) / 1000 
      : 0;
    
    console.log(`⏱️ Total runtime: ${duration.toFixed(1)} seconds`);
    
    // Operations summary
    const ops = longRunningState.operations;
    const successRate = ops.total > 0 ? ((ops.successful / ops.total) * 100) : 0;
    console.log(`🔄 Operations: ${ops.successful}/${ops.total} successful (${successRate.toFixed(1)}%)`);
    
    if (ops.errors.length > 0) {
      const uniqueErrors = [...new Set(ops.errors)].slice(0, 5);
      console.log(`❌ Error types: ${uniqueErrors.join(', ')}`);
    }
    
    // Memory summary
    const mem = longRunningState.memory;
    const memIncrease = mem.current - mem.initial;
    console.log(`💾 Memory: ${mem.initial}MB → ${mem.current}MB (peak: ${mem.peak}MB, +${memIncrease}MB)`);
    
    // Health summary
    const health = longRunningState.health;
    const healthRate = health.checks > 0 ? ((health.healthy / health.checks) * 100) : 0;
    console.log(`🏥 Health: ${health.healthy}/${health.checks} healthy checks (${healthRate.toFixed(1)}%)`);
    
    // Circuit breaker summary
    const circuits = longRunningState.circuits;
    console.log(`⚡ Circuits: ${circuits.opened} opened, ${circuits.recovered} recovered, ${circuits.failures} failures`);
    
    console.log('=' .repeat(80));
  });

  it('should maintain stability over extended runtime', async () => {
    console.log('🚀 Starting long-running stability test...');
    
    longRunningState.startTime = Date.now();
    const endTime = longRunningState.startTime + LONG_RUNNING_CONFIG.DURATION_MS;
    
    // Set up continuous operations
    const operationPromises = [];
    
    // Main operation loop
    const runContinuousOperations = async () => {
      let operationId = 0;
      
      while (Date.now() < endTime) {
        operationId++;
        longRunningState.operations.total++;
        
        try {
          const operation = createTestOperation(operationId);
          await operation();
          
          longRunningState.operations.successful++;
          
          // Log progress every 50 operations
          if (operationId % 50 === 0) {
            const elapsed = (Date.now() - longRunningState.startTime) / 1000;
            const rate = operationId / elapsed;
            console.log(`  ⚡ Operation ${operationId} completed (${rate.toFixed(1)} ops/sec)`);
          }
          
        } catch (error) {
          longRunningState.operations.failed++;
          longRunningState.operations.errors.push(error.constructor.name);
          
          // Log failures but don't stop the test
          console.log(`  ❌ Operation ${operationId} failed: ${error.message}`);
        }
        
        // Wait before next operation
        await new Promise(resolve => 
          setTimeout(resolve, LONG_RUNNING_CONFIG.OPERATION_INTERVAL_MS)
        );
      }
    };
    
    // Health monitoring loop
    const runHealthMonitoring = async () => {
      while (Date.now() < endTime) {
        try {
          const healthMonitor = getHealthMonitor();
          const healthResult = await healthMonitor.runAllChecks();
          
          longRunningState.health.checks++;
          
          if (healthResult.overallHealth) {
            longRunningState.health.healthy++;
          } else {
            longRunningState.health.unhealthy++;
            console.log(`  🚨 Health check failed: ${healthResult.criticalIssues.length} critical issues`);
          }
          
        } catch (error) {
          console.log(`  ⚠️ Health monitoring error: ${error.message}`);
        }
        
        await new Promise(resolve => 
          setTimeout(resolve, LONG_RUNNING_CONFIG.HEALTH_CHECK_INTERVAL_MS)
        );
      }
    };
    
    // Circuit breaker monitoring
    const monitorCircuitBreakers = async () => {
      let lastBreakersState = new Map();
      
      while (Date.now() < endTime) {
        try {
          const breakers = getAllCircuitBreakers();
          
          for (const breaker of breakers) {
            const lastState = lastBreakersState.get(breaker.name);
            
            if (lastState) {
              if (lastState.state === 'closed' && breaker.state === 'open') {
                longRunningState.circuits.opened++;
                console.log(`  ⚡ Circuit breaker "${breaker.name}" opened`);
              }
              
              if (lastState.state === 'open' && breaker.state === 'closed') {
                longRunningState.circuits.recovered++;
                console.log(`  ✅ Circuit breaker "${breaker.name}" recovered`);
              }
              
              if (breaker.totalFailures > lastState.totalFailures) {
                longRunningState.circuits.failures += 
                  breaker.totalFailures - lastState.totalFailures;
              }
            }
            
            lastBreakersState.set(breaker.name, { ...breaker });
          }
          
        } catch (error) {
          console.log(`  ⚠️ Circuit breaker monitoring error: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    };
    
    // Run all monitoring tasks concurrently
    try {
      await Promise.all([
        runContinuousOperations(),
        runHealthMonitoring(),
        monitorCircuitBreakers()
      ]);
      
      // Validate final results
      const finalDuration = (Date.now() - longRunningState.startTime) / 1000;
      const ops = longRunningState.operations;
      const finalSuccessRate = ops.total > 0 ? (ops.successful / ops.total) : 0;
      const memIncrease = longRunningState.memory.current - longRunningState.memory.initial;
      const healthRate = longRunningState.health.checks > 0 
        ? (longRunningState.health.healthy / longRunningState.health.checks) 
        : 0;
      
      console.log(`\n✅ Long-running test completed after ${finalDuration.toFixed(1)} seconds`);
      console.log(`📊 Final metrics:`);
      console.log(`  Operations: ${ops.successful}/${ops.total} (${(finalSuccessRate * 100).toFixed(1)}%)`);
      console.log(`  Memory: +${memIncrease}MB (peak: ${longRunningState.memory.peak}MB)`);
      console.log(`  Health: ${(healthRate * 100).toFixed(1)}% healthy`);
      
      // Assert requirements
      expect(finalSuccessRate).toBeGreaterThanOrEqual(LONG_RUNNING_CONFIG.MIN_SUCCESS_RATE);
      expect(memIncrease).toBeLessThan(LONG_RUNNING_CONFIG.MAX_MEMORY_INCREASE_MB);
      expect(healthRate).toBeGreaterThanOrEqual(0.8); // 80% health rate minimum
      expect(ops.total).toBeGreaterThan(0); // Ensure operations actually ran
      
      console.log('🎉 Long-running stability test PASSED');
      
    } catch (error) {
      console.error(`❌ Long-running test failed: ${error.message}`);
      throw error;
    }
  }, LONG_RUNNING_CONFIG.DURATION_MS + 10000); // Add 10s buffer for cleanup
});

// Helper function to create test operations
function createTestOperation(operationId) {
  const operationType = operationId % 4;
  
  switch (operationType) {
    case 0: // Cache operation
      return withErrorRecovery(async () => {
        // Simulate cache access
        const stats = getCacheStats();
        if (Math.random() < LONG_RUNNING_CONFIG.FAILURE_INJECTION_RATE) {
          throw new Error('Simulated cache error');
        }
        return { type: 'cache', stats };
      }, 'cache-operation');
      
    case 1: // Retry operation
      return withRetry(async () => {
        if (Math.random() < LONG_RUNNING_CONFIG.FAILURE_INJECTION_RATE) {
          throw new Error('Simulated retry error');
        }
        return { type: 'retry', success: true };
      }, { maxRetries: 2, operation: 'long-running-retry' });
      
    case 2: // Circuit breaker operation
      const testBreaker = getCircuitBreaker('long-running-test', {
        failureThreshold: 3,
        recoveryTimeout: 5000
      });
      
      return async () => {
        return testBreaker.execute(async () => {
          if (Math.random() < LONG_RUNNING_CONFIG.FAILURE_INJECTION_RATE) {
            throw new Error('Simulated circuit breaker error');
          }
          return { type: 'circuit-breaker', success: true };
        });
      };
      
    case 3: // Safe execution operation
      return safeExecute(
        async () => {
          if (Math.random() < LONG_RUNNING_CONFIG.FAILURE_INJECTION_RATE) {
            throw new Error('Simulated safe execution error');
          }
          return { type: 'safe-execution', success: true };
        },
        async () => {
          return { type: 'safe-execution', success: true, fallback: true };
        },
        'long-running-safe-execution'
      );
      
    default:
      return async () => ({ type: 'default', success: true });
  }
}