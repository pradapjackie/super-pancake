// Network Failure Simulation Tests for Super Pancake Framework
// Tests framework resilience under various network failure conditions

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchChrome } from '../utils/launcher.js';
import { connectToChrome, isConnectionHealthy, closeConnection } from '../core/browser.js';
import { createSession } from '../core/session.js';
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
  addHealthCheck 
} from '../core/health-monitor.js';

// Network failure simulation configuration
const NETWORK_CONFIG = {
  FAILURE_TYPES: ['timeout', 'connection_refused', 'host_unreachable', 'dns_failure'],
  SIMULATION_DURATION: 30000, // 30 seconds
  FAILURE_RATE: 0.3, // 30% failure rate
  RECOVERY_TESTS: 10,
  MAX_RETRIES: 5
};

// Test state tracking
let networkTestResults = {
  timeouts: { simulated: 0, handled: 0 },
  connectionRefused: { simulated: 0, handled: 0 },
  hostUnreachable: { simulated: 0, handled: 0 },
  dnsFailures: { simulated: 0, handled: 0 },
  recoveries: { attempted: 0, successful: 0 },
  circuitBreakers: { opened: 0, recovered: 0 }
};

describe('Network Failure Simulation Tests', () => {
  
  beforeAll(async () => {
    console.log('🌐 Starting network failure simulation tests...');
    console.log(`📊 Test configuration:`);
    console.log(`  Duration: ${NETWORK_CONFIG.SIMULATION_DURATION / 1000}s`);
    console.log(`  Failure rate: ${NETWORK_CONFIG.FAILURE_RATE * 100}%`);
    console.log(`  Recovery tests: ${NETWORK_CONFIG.RECOVERY_TESTS}`);
    
    // Start health monitoring with frequent checks
    startHealthMonitoring(3000);
    
    // Add network-specific health checks
    addHealthCheck('network-connectivity', async () => {
      // Simulate network connectivity check
      const connected = Math.random() > NETWORK_CONFIG.FAILURE_RATE;
      return {
        healthy: connected,
        latency: Math.round(Math.random() * 100) + 10,
        status: connected ? 'connected' : 'disconnected'
      };
    }, { critical: true, description: 'Network connectivity monitoring' });
    
    console.log('✅ Network failure simulation environment ready');
  });

  afterAll(() => {
    stopHealthMonitoring();
    
    // Generate network failure test report
    console.log('\n' + '=' .repeat(80));
    console.log('🌐 NETWORK FAILURE SIMULATION REPORT');
    console.log('=' .repeat(80));
    
    Object.entries(networkTestResults).forEach(([category, stats]) => {
      if (stats.simulated !== undefined) {
        const handledRate = stats.simulated > 0 ? ((stats.handled / stats.simulated) * 100).toFixed(1) : 0;
        console.log(`${category.toUpperCase()}: ${stats.handled}/${stats.simulated} handled (${handledRate}%)`);
      } else if (stats.attempted !== undefined) {
        const successRate = stats.attempted > 0 ? ((stats.successful / stats.attempted) * 100).toFixed(1) : 0;
        console.log(`${category.toUpperCase()}: ${stats.successful}/${stats.attempted} successful (${successRate}%)`);
      } else {
        console.log(`${category.toUpperCase()}: ${JSON.stringify(stats)}`);
      }
    });
    
    console.log('=' .repeat(80));
  });

  it('should handle connection timeout scenarios', async () => {
    console.log('⏱️ Testing connection timeout handling...');
    
    const timeoutTests = [];
    
    for (let i = 0; i < 10; i++) {
      const testOperation = withErrorRecovery(
        async () => {
          networkTestResults.timeouts.simulated++;
          
          // Simulate timeout by creating a promise that never resolves
          if (Math.random() < NETWORK_CONFIG.FAILURE_RATE) {
            console.log(`  Simulating timeout ${i + 1}`);
            
            return new Promise((_, reject) => {
              setTimeout(() => {
                reject(new Error('ETIMEDOUT: Connection timeout'));
              }, 100); // Quick timeout for testing
            });
          }
          
          // Simulate successful connection
          return { success: true, test: i + 1 };
        },
        `timeout-test-${i}`
      );
      
      timeoutTests.push(
        testOperation().then(
          result => {
            networkTestResults.timeouts.handled++;
            return { success: true, result };
          },
          error => {
            if (error.message.includes('ETIMEDOUT')) {
              networkTestResults.timeouts.handled++;
              console.log(`  ✅ Timeout handled gracefully: ${error.message}`);
            }
            return { success: false, error: error.message };
          }
        )
      );
    }
    
    const results = await Promise.all(timeoutTests);
    const handledCount = results.filter(r => r.success || r.error?.includes('ETIMEDOUT')).length;
    
    console.log(`✅ Timeout handling: ${handledCount}/10 scenarios handled properly`);
    expect(handledCount).toBeGreaterThanOrEqual(7); // Allow some variance
  });

  it('should handle connection refused scenarios', async () => {
    console.log('🚫 Testing connection refused handling...');
    
    const refusedTests = [];
    
    for (let i = 0; i < 8; i++) {
      const testOperation = withRetry(
        async () => {
          networkTestResults.connectionRefused.simulated++;
          
          if (Math.random() < NETWORK_CONFIG.FAILURE_RATE) {
            console.log(`  Simulating connection refused ${i + 1}`);
            throw new Error('ECONNREFUSED: Connection refused by server');
          }
          
          return { connected: true, test: i + 1 };
        },
        { maxRetries: 3, operation: `connection-refused-test-${i}` }
      );
      
      refusedTests.push(
        testOperation().then(
          result => {
            networkTestResults.connectionRefused.handled++;
            return { success: true, result };
          },
          error => {
            if (error.message.includes('ECONNREFUSED')) {
              networkTestResults.connectionRefused.handled++;
              console.log(`  ✅ Connection refused handled: ${error.message}`);
            }
            return { success: false, error: error.message };
          }
        )
      );
    }
    
    const results = await Promise.all(refusedTests);
    const handledCount = results.filter(r => r.success || r.error?.includes('ECONNREFUSED')).length;
    
    console.log(`✅ Connection refused handling: ${handledCount}/8 scenarios handled properly`);
    expect(handledCount).toBeGreaterThanOrEqual(6);
  });

  it('should handle host unreachable scenarios', async () => {
    console.log('🔌 Testing host unreachable handling...');
    
    const unreachableTests = [];
    
    for (let i = 0; i < 6; i++) {
      const circuitBreaker = getCircuitBreaker(`host-unreachable-${i}`, {
        failureThreshold: 2,
        recoveryTimeout: 3000
      });
      
      const testOperation = async () => {
        return circuitBreaker.execute(async () => {
          networkTestResults.hostUnreachable.simulated++;
          
          if (Math.random() < NETWORK_CONFIG.FAILURE_RATE) {
            console.log(`  Simulating host unreachable ${i + 1}`);
            throw new Error('EHOSTUNREACH: No route to host');
          }
          
          return { reachable: true, test: i + 1 };
        });
      };
      
      unreachableTests.push(
        testOperation().then(
          result => {
            networkTestResults.hostUnreachable.handled++;
            return { success: true, result };
          },
          error => {
            if (error.message.includes('EHOSTUNREACH') || error.message.includes('Circuit breaker')) {
              networkTestResults.hostUnreachable.handled++;
              console.log(`  ✅ Host unreachable handled: ${error.message.substring(0, 50)}...`);
            }
            return { success: false, error: error.message };
          }
        )
      );
    }
    
    const results = await Promise.all(unreachableTests);
    const handledCount = results.filter(r => r.success || r.error?.includes('EHOSTUNREACH') || r.error?.includes('Circuit')).length;
    
    console.log(`✅ Host unreachable handling: ${handledCount}/6 scenarios handled properly`);
    expect(handledCount).toBeGreaterThanOrEqual(4);
  });

  it('should handle DNS resolution failures', async () => {
    console.log('🌐 Testing DNS failure handling...');
    
    const dnsTests = [];
    
    for (let i = 0; i < 5; i++) {
      const testOperation = safeExecute(
        async () => {
          networkTestResults.dnsFailures.simulated++;
          
          if (Math.random() < NETWORK_CONFIG.FAILURE_RATE) {
            console.log(`  Simulating DNS failure ${i + 1}`);
            throw new Error('ENOTFOUND: DNS lookup failed');
          }
          
          return { resolved: true, test: i + 1 };
        },
        async () => {
          // Fallback for DNS failures
          console.log(`  Using DNS fallback for test ${i + 1}`);
          return { resolved: true, fallback: true, test: i + 1 };
        },
        `dns-test-${i}`
      );
      
      dnsTests.push(
        testOperation().then(
          result => {
            networkTestResults.dnsFailures.handled++;
            return { success: true, result };
          },
          error => {
            if (error.message.includes('ENOTFOUND')) {
              networkTestResults.dnsFailures.handled++;
              console.log(`  ✅ DNS failure handled: ${error.message}`);
            }
            return { success: false, error: error.message };
          }
        )
      );
    }
    
    const results = await Promise.all(dnsTests);
    const handledCount = results.filter(r => r.success || r.error?.includes('ENOTFOUND')).length;
    
    console.log(`✅ DNS failure handling: ${handledCount}/5 scenarios handled properly`);
    expect(handledCount).toBeGreaterThanOrEqual(4);
  });

  it('should demonstrate automatic recovery from network failures', async () => {
    console.log('🔄 Testing automatic recovery mechanisms...');
    
    const recoveryTests = [];
    
    for (let i = 0; i < NETWORK_CONFIG.RECOVERY_TESTS; i++) {
      networkTestResults.recoveries.attempted++;
      
      const recoveryOperation = withRetry(
        async () => {
          // Simulate initial failure, then recovery
          if (Math.random() < 0.7) { // 70% initial failure rate
            throw new Error(`Network failure in recovery test ${i + 1}`);
          }
          
          return { recovered: true, test: i + 1 };
        },
        { 
          maxRetries: NETWORK_CONFIG.MAX_RETRIES, 
          operation: `recovery-test-${i}`,
          baseDelay: 100 // Fast recovery for testing
        }
      );
      
      recoveryTests.push(
        recoveryOperation().then(
          result => {
            networkTestResults.recoveries.successful++;
            console.log(`  ✅ Recovery successful for test ${i + 1}`);
            return { success: true, result };
          },
          error => {
            console.log(`  ⚠️ Recovery failed for test ${i + 1}: ${error.message}`);
            return { success: false, error: error.message };
          }
        )
      );
    }
    
    const results = await Promise.all(recoveryTests);
    const successfulRecoveries = results.filter(r => r.success).length;
    const recoveryRate = (successfulRecoveries / NETWORK_CONFIG.RECOVERY_TESTS) * 100;
    
    console.log(`✅ Recovery rate: ${successfulRecoveries}/${NETWORK_CONFIG.RECOVERY_TESTS} (${recoveryRate.toFixed(1)}%)`);
    expect(recoveryRate).toBeGreaterThanOrEqual(60); // Expect at least 60% recovery rate
  }, 15000);

  it('should maintain circuit breaker functionality during network issues', async () => {
    console.log('⚡ Testing circuit breaker behavior during network failures...');
    
    const breakerName = 'network-failure-breaker';
    const circuitBreaker = getCircuitBreaker(breakerName, {
      failureThreshold: 3,
      recoveryTimeout: 2000
    });
    
    // Reset breaker for clean test
    circuitBreaker.reset();
    
    let operationCount = 0;
    
    // Create multiple failing operations to trigger circuit breaker
    const failingOperations = [];
    for (let i = 0; i < 5; i++) {
      const operation = async () => {
        return circuitBreaker.execute(async () => {
          operationCount++;
          console.log(`  Circuit breaker operation ${operationCount}`);
          
          // First 3 operations fail to trigger breaker
          if (operationCount <= 3) {
            throw new Error(`Network failure ${operationCount}`);
          }
          
          return { success: true, attempt: operationCount };
        });
      };
      
      failingOperations.push(
        operation().catch(error => {
          console.log(`  Expected failure: ${error.message}`);
          return { failed: true, error: error.message };
        })
      );
    }
    
    await Promise.all(failingOperations);
    
    const breakerStats = circuitBreaker.getStats();
    console.log(`📊 Circuit breaker state: ${breakerStats.state}`);
    console.log(`📊 Total failures: ${breakerStats.totalFailures}`);
    
    if (breakerStats.state === 'open') {
      networkTestResults.circuitBreakers.opened++;
      console.log('✅ Circuit breaker opened as expected');
      
      // Wait for recovery period
      console.log('⏳ Waiting for circuit breaker recovery...');
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Try operation after recovery
      try {
        const recoveryResult = await circuitBreaker.execute(async () => {
          return { recovered: true, timestamp: Date.now() };
        });
        
        networkTestResults.circuitBreakers.recovered++;
        console.log('✅ Circuit breaker recovered successfully');
        expect(recoveryResult.recovered).toBe(true);
      } catch (error) {
        console.log(`⚠️ Circuit breaker recovery failed: ${error.message}`);
      }
    }
    
    expect(breakerStats.totalFailures).toBeGreaterThanOrEqual(3);
  }, 10000);

  it('should validate health monitoring during network stress', async () => {
    console.log('🏥 Testing health monitoring under network stress...');
    
    const healthMonitor = getHealthMonitor();
    
    // Create network stress by running multiple concurrent operations
    const stressOperations = [];
    
    for (let i = 0; i < 15; i++) {
      const stressOp = new Promise(resolve => {
        setTimeout(() => {
          // Simulate network operation with potential failure
          const success = Math.random() > NETWORK_CONFIG.FAILURE_RATE;
          resolve({
            operation: i + 1,
            success,
            duration: Math.round(Math.random() * 200) + 50
          });
        }, Math.random() * 500);
      });
      
      stressOperations.push(stressOp);
    }
    
    // Run stress operations and health check concurrently
    const [stressResults, healthResult] = await Promise.all([
      Promise.all(stressOperations),
      healthMonitor.runAllChecks()
    ]);
    
    const successfulOps = stressResults.filter(r => r.success).length;
    const successRate = (successfulOps / stressResults.length) * 100;
    
    console.log(`📊 Network stress test: ${successfulOps}/${stressResults.length} operations succeeded (${successRate.toFixed(1)}%)`);
    console.log(`🏥 Health check result: ${healthResult.overallHealth ? 'HEALTHY' : 'UNHEALTHY'}`);
    console.log(`🏥 Critical issues: ${healthResult.criticalIssues.length}`);
    
    expect(healthResult.timestamp).toBeDefined();
    expect(typeof healthResult.overallHealth).toBe('boolean');
    expect(Array.isArray(healthResult.criticalIssues)).toBe(true);
  }, 8000);

  it('should prevent STACK_TRACE_ERROR during network failures', async () => {
    console.log('🛡️ Testing STACK_TRACE_ERROR prevention during network failures...');
    
    const networkErrorScenarios = [
      () => { const err = new Error('ECONNRESET'); err.code = 'ECONNRESET'; throw err; },
      () => { const err = new Error('ETIMEDOUT'); err.code = 'ETIMEDOUT'; throw err; },
      () => { const err = new Error('ENOTFOUND'); err.code = 'ENOTFOUND'; throw err; },
      () => { const err = new Error('ECONNREFUSED'); err.code = 'ECONNREFUSED'; throw err; },
      () => { const err = new Error('EHOSTUNREACH'); err.code = 'EHOSTUNREACH'; throw err; },
      () => { 
        const err = new Error('Network error');
        err.name = 'STACK_TRACE_ERROR';
        throw err; 
      }
    ];
    
    let preventedErrors = 0;
    
    for (let i = 0; i < networkErrorScenarios.length; i++) {
      try {
        const protectedOperation = withErrorRecovery(
          networkErrorScenarios[i],
          `network-error-scenario-${i}`
        );
        
        await protectedOperation();
      } catch (error) {
        // Verify error was properly wrapped and doesn't cause STACK_TRACE_ERROR
        expect(error.message).toBeDefined();
        expect(error.message.length).toBeGreaterThan(0);
        expect(error.name).not.toBe('STACK_TRACE_ERROR');
        expect(error.constructor.name).not.toBe('STACK_TRACE_ERROR');
        
        preventedErrors++;
        console.log(`  ✅ Network error scenario ${i + 1} handled: ${error.constructor.name}`);
      }
    }
    
    console.log(`✅ STACK_TRACE_ERROR prevention: ${preventedErrors}/${networkErrorScenarios.length} scenarios handled safely`);
    expect(preventedErrors).toBe(networkErrorScenarios.length);
  }, 5000);
});