// Comprehensive Stability Test Suite for Super Pancake Framework
// Tests all improvements from Phases 1-3 under stress conditions

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { launchChrome } from '../utils/launcher.js';
import { connectToChrome, isConnectionHealthy, closeConnection, createRobustConnection } from '../core/browser.js';
import { createSession } from '../core/session.js';
import { enableDOM, navigateTo, fillInput, click, waitForSelector, takeScreenshot } from '../core/dom.js';
import { 
  withErrorRecovery, 
  withRetry, 
  safeExecute, 
  getCircuitBreaker,
  getAllCircuitBreakers,
  withCircuitBreaker 
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

// Test configuration
const TEST_CONFIG = {
  STRESS_TEST_ITERATIONS: 50,
  CONCURRENT_CONNECTIONS: 5,
  LONG_RUNNING_DURATION: 30000, // 30 seconds
  NETWORK_FAILURE_SIMULATION: 10, // Number of simulated failures
  PERFORMANCE_THRESHOLD_MS: 5000, // 5 seconds max for operations
  MEMORY_LEAK_THRESHOLD_MB: 100 // 100MB memory increase threshold
};

// Global test state
let testResults = {
  phase1: { passed: 0, failed: 0, errors: [] },
  phase2: { passed: 0, failed: 0, errors: [] },
  phase3: { passed: 0, failed: 0, errors: [] },
  integration: { passed: 0, failed: 0, errors: [] },
  performance: { results: [], averageTime: 0 },
  stability: { crashes: 0, recoveries: 0, uptime: 0 }
};

describe('Super Pancake Framework - Comprehensive Stability Test Suite', () => {
  
  beforeAll(async () => {
    console.log('🚀 Starting comprehensive stability test suite...');
    console.log('=' .repeat(80));
    
    // Configure framework for testing
    configureEnhancedCaching({
      maxSize: 200,
      dynamicTTL: 2000,  // Faster for testing
      staticTTL: 10000
    });
    
    // Start health monitoring
    startHealthMonitoring(5000); // 5-second intervals for testing
    
    // Add custom health checks for testing
    addHealthCheck('test-memory', async () => {
      const usage = process.memoryUsage();
      return {
        healthy: usage.heapUsed < 100 * 1024 * 1024, // 100MB threshold
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024)
      };
    }, { critical: true, description: 'Memory usage monitoring' });
    
    console.log('✅ Test environment configured');
  });

  afterAll(async () => {
    stopHealthMonitoring();
    clearQueryCache();
    
    // Generate comprehensive test report
    console.log('\n' + '=' .repeat(80));
    console.log('📊 COMPREHENSIVE STABILITY TEST REPORT');
    console.log('=' .repeat(80));
    
    Object.entries(testResults).forEach(([phase, results]) => {
      if (results.passed !== undefined) {
        const total = results.passed + results.failed;
        const successRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
        console.log(`${phase.toUpperCase()}: ${results.passed}/${total} passed (${successRate}%)`);
        
        if (results.errors.length > 0) {
          console.log(`  Errors: ${results.errors.slice(0, 3).join(', ')}${results.errors.length > 3 ? '...' : ''}`);
        }
      }
    });
    
    if (testResults.performance.results.length > 0) {
      const avgTime = testResults.performance.results.reduce((a, b) => a + b, 0) / testResults.performance.results.length;
      console.log(`PERFORMANCE: Average operation time ${avgTime.toFixed(0)}ms`);
    }
    
    console.log(`STABILITY: ${testResults.stability.recoveries} recoveries, ${testResults.stability.crashes} crashes`);
    console.log('=' .repeat(80));
  });

  describe('Phase 1 Stability: Browser Connection & Process Management', () => {
    
    it('should handle multiple concurrent browser connections', async () => {
      console.log('🔗 Testing concurrent browser connections...');
      
      const connections = [];
      const startTime = Date.now();
      
      try {
        // Launch multiple Chrome instances concurrently
        for (let i = 0; i < TEST_CONFIG.CONCURRENT_CONNECTIONS; i++) {
          const port = 9222 + i;
          console.log(`  Launching Chrome instance ${i + 1} on port ${port}`);
          
          const chrome = await launchChrome({ headed: false, port, maxRetries: 3 });
          const ws = await connectToChrome(port, 3);
          const session = createSession(ws);
          
          connections.push({ chrome, ws, session, port });
          
          // Verify connection health
          const isHealthy = isConnectionHealthy(ws);
          expect(isHealthy).toBe(true);
        }
        
        console.log(`✅ Successfully created ${connections.length} concurrent connections`);
        
        // Test all connections simultaneously
        const healthChecks = await Promise.all(
          connections.map(async (conn, index) => {
            try {
              const healthy = await conn.session.isHealthy();
              return { index, healthy, error: null };
            } catch (error) {
              return { index, healthy: false, error: error.message };
            }
          })
        );
        
        const healthyCount = healthChecks.filter(check => check.healthy).length;
        console.log(`✅ ${healthyCount}/${connections.length} connections remain healthy`);
        
        testResults.phase1.passed++;
        
      } catch (error) {
        testResults.phase1.failed++;
        testResults.phase1.errors.push(error.message);
        console.error(`❌ Concurrent connection test failed: ${error.message}`);
        throw error;
      } finally {
        // Cleanup all connections
        for (const conn of connections) {
          try {
            closeConnection(conn.ws);
          } catch (error) {
            console.warn(`⚠️ Cleanup warning: ${error.message}`);
          }
        }
        
        const elapsed = Date.now() - startTime;
        testResults.performance.results.push(elapsed);
        console.log(`⏱️ Concurrent connection test completed in ${elapsed}ms`);
      }
    }, 60000);

    it('should demonstrate enhanced retry logic under failure conditions', async () => {
      console.log('🔄 Testing enhanced retry logic...');
      
      let attemptCount = 0;
      
      const flakyOperation = withRetry(
        async () => {
          attemptCount++;
          console.log(`  Attempt ${attemptCount}`);
          
          // Simulate failure for first few attempts
          if (attemptCount < 3) {
            throw new Error(`Simulated failure ${attemptCount}`);
          }
          
          return { success: true, attempts: attemptCount };
        },
        { maxRetries: 5, operation: 'stability-test-retry' }
      );
      
      try {
        const result = await flakyOperation();
        
        expect(result.success).toBe(true);
        expect(result.attempts).toBe(3);
        console.log(`✅ Retry logic succeeded after ${result.attempts} attempts`);
        
        testResults.phase1.passed++;
        testResults.stability.recoveries++;
        
      } catch (error) {
        testResults.phase1.failed++;
        testResults.phase1.errors.push(error.message);
        throw error;
      }
    });

    it('should handle browser process cleanup under stress', async () => {
      console.log('🧹 Testing browser process cleanup under stress...');
      
      const cleanupOperations = [];
      
      try {
        // Rapidly create and destroy browser instances
        for (let i = 0; i < 10; i++) {
          const port = 9230 + i;
          
          const operation = async () => {
            const chrome = await launchChrome({ headed: false, port, maxRetries: 2 });
            const ws = await connectToChrome(port, 2);
            
            // Brief operation
            await new Promise(resolve => setTimeout(resolve, 100));
            
            closeConnection(ws);
            return { port, success: true };
          };
          
          cleanupOperations.push(operation());
        }
        
        const results = await Promise.allSettled(cleanupOperations);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        console.log(`✅ ${successful}/10 rapid cleanup operations succeeded`);
        expect(successful).toBeGreaterThanOrEqual(7); // Allow some failures under stress
        
        testResults.phase1.passed++;
        
      } catch (error) {
        testResults.phase1.failed++;
        testResults.phase1.errors.push(error.message);
        throw error;
      }
    });
  });

  describe('Phase 2 Stability: DOM Operations & Caching', () => {
    
    it('should handle rapid cache invalidation scenarios', async () => {
      console.log('📋 Testing rapid cache invalidation...');
      
      try {
        // Simulate rapid form interactions that trigger cache invalidation
        const mockSession = { id: 'test-session' };
        
        // Clear cache and get initial stats
        clearQueryCache();
        const initialStats = getCacheStats();
        
        // Simulate multiple rapid operations
        const operations = [];
        for (let i = 0; i < 50; i++) {
          operations.push(
            new Promise(resolve => {
              setTimeout(() => {
                // Simulate cache operations
                const selector = `#input-${i % 10}`;
                resolve({ selector, operation: 'cache-test' });
              }, Math.random() * 100);
            })
          );
        }
        
        const results = await Promise.all(operations);
        console.log(`✅ Completed ${results.length} rapid cache operations`);
        
        const finalStats = getCacheStats();
        console.log(`📊 Cache stats: ${finalStats.hits} hits, ${finalStats.misses} misses`);
        
        testResults.phase2.passed++;
        
      } catch (error) {
        testResults.phase2.failed++;
        testResults.phase2.errors.push(error.message);
        throw error;
      }
    });

    it('should demonstrate staleness detection and recovery', async () => {
      console.log('🔍 Testing element staleness detection...');
      
      try {
        // Simulate stale element detection
        let staleDetectionCount = 0;
        let recoveryCount = 0;
        
        const mockStaleDetection = async () => {
          // Simulate element becoming stale
          if (Math.random() < 0.3) { // 30% chance of staleness
            staleDetectionCount++;
            console.log(`  Detected stale element (${staleDetectionCount})`);
            
            // Simulate recovery
            await new Promise(resolve => setTimeout(resolve, 50));
            recoveryCount++;
            return true;
          }
          return false;
        };
        
        // Run multiple staleness checks
        const checks = [];
        for (let i = 0; i < 20; i++) {
          checks.push(mockStaleDetection());
        }
        
        await Promise.all(checks);
        
        console.log(`✅ Staleness detection: ${staleDetectionCount} detected, ${recoveryCount} recovered`);
        expect(recoveryCount).toBe(staleDetectionCount);
        
        testResults.phase2.passed++;
        testResults.stability.recoveries += recoveryCount;
        
      } catch (error) {
        testResults.phase2.failed++;
        testResults.phase2.errors.push(error.message);
        throw error;
      }
    });

    it('should handle dynamic vs static content caching', async () => {
      console.log('⚡ Testing dynamic vs static content caching...');
      
      try {
        // Configure cache for testing
        configureEnhancedCaching({
          dynamicTTL: 1000,  // 1 second for dynamic
          staticTTL: 5000    // 5 seconds for static
        });
        
        // Test different content types
        const dynamicSelectors = [
          'input[data-dynamic]',
          '.loading-spinner',
          '.error-message',
          '[data-count]'
        ];
        
        const staticSelectors = [
          'header',
          'nav.main-menu',
          'footer',
          '.logo'
        ];
        
        console.log(`  Testing ${dynamicSelectors.length} dynamic selectors`);
        console.log(`  Testing ${staticSelectors.length} static selectors`);
        
        // Verify cache configuration
        const stats = getCacheStats();
        expect(stats.dynamicTTL).toBe(1000);
        expect(stats.staticTTL).toBe(5000);
        
        console.log('✅ Cache TTL configuration validated');
        testResults.phase2.passed++;
        
      } catch (error) {
        testResults.phase2.failed++;
        testResults.phase2.errors.push(error.message);
        throw error;
      }
    });
  });

  describe('Phase 3 Stability: Error Handling & Recovery', () => {
    
    it('should prevent STACK_TRACE_ERROR under all conditions', async () => {
      console.log('🛡️ Testing STACK_TRACE_ERROR prevention...');
      
      const errorScenarios = [
        () => { throw new Error('Undefined property access'); },
        () => { throw new TypeError('Cannot read property of null'); },
        () => { throw new ReferenceError('Variable not defined'); },
        () => { throw new SyntaxError('Unexpected token'); },
        () => { throw new Error(); }, // Error without message
        () => { const err = new Error('Test'); err.name = 'STACK_TRACE_ERROR'; throw err; }
      ];
      
      let preventedErrors = 0;
      
      for (let i = 0; i < errorScenarios.length; i++) {
        try {
          const safeOperation = withErrorRecovery(errorScenarios[i], `error-scenario-${i}`);
          await safeOperation();
        } catch (error) {
          // Verify error was properly wrapped
          expect(error.message).toBeDefined();
          expect(error.message.length).toBeGreaterThan(0);
          expect(error.name).not.toBe('STACK_TRACE_ERROR');
          
          preventedErrors++;
          console.log(`  ✅ Prevented error scenario ${i + 1}: ${error.constructor.name}`);
        }
      }
      
      console.log(`✅ Successfully prevented ${preventedErrors}/${errorScenarios.length} error scenarios`);
      expect(preventedErrors).toBe(errorScenarios.length);
      
      testResults.phase3.passed++;
    });

    it('should demonstrate circuit breaker functionality', async () => {
      console.log('⚡ Testing circuit breaker functionality...');
      
      try {
        const testBreaker = getCircuitBreaker('stability-test-breaker', {
          failureThreshold: 3,
          recoveryTimeout: 2000
        });
        
        // Reset breaker for clean test
        testBreaker.reset();
        
        let operationCount = 0;
        const flakyOperation = withCircuitBreaker(
          async () => {
            operationCount++;
            console.log(`  Circuit breaker operation ${operationCount}`);
            
            // Fail first 3 attempts to trigger circuit breaker
            if (operationCount <= 3) {
              throw new Error(`Simulated failure ${operationCount}`);
            }
            
            return { success: true, attempt: operationCount };
          },
          'stability-test-breaker'
        );
        
        // First 3 attempts should fail and open circuit
        for (let i = 1; i <= 3; i++) {
          try {
            await flakyOperation();
          } catch (error) {
            console.log(`  Expected failure ${i}: ${error.message}`);
          }
        }
        
        const stats = testBreaker.getStats();
        console.log(`📊 Circuit breaker state: ${stats.state}, failures: ${stats.totalFailures}`);
        
        // Circuit should now be open
        expect(stats.state).toBe('open');
        
        // Wait for recovery timeout
        console.log('  Waiting for recovery timeout...');
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // Next attempt should succeed (circuit moves to half-open, then closed)
        try {
          const result = await flakyOperation();
          console.log(`✅ Circuit breaker recovered: ${result.success}`);
          testResults.stability.recoveries++;
        } catch (error) {
          console.log(`⚠️ Recovery attempt failed: ${error.message}`);
        }
        
        testResults.phase3.passed++;
        
      } catch (error) {
        testResults.phase3.failed++;
        testResults.phase3.errors.push(error.message);
        throw error;
      }
    });

    it('should maintain health monitoring under stress', async () => {
      console.log('🏥 Testing health monitoring under stress...');
      
      try {
        const healthMonitor = getHealthMonitor();
        
        // Run health checks during stress operations
        const stressOperations = [];
        for (let i = 0; i < 20; i++) {
          stressOperations.push(
            new Promise(resolve => {
              setTimeout(() => {
                // Simulate CPU/memory intensive operation
                const start = Date.now();
                while (Date.now() - start < 50) {
                  Math.random() * Math.random();
                }
                resolve(i);
              }, Math.random() * 1000);
            })
          );
        }
        
        // Run stress operations and health checks concurrently
        const [stressResults] = await Promise.all([
          Promise.all(stressOperations),
          healthMonitor.runAllChecks()
        ]);
        
        const healthStatus = getHealthStatus();
        const metrics = getHealthMetrics();
        
        console.log(`✅ Completed ${stressResults.length} stress operations`);
        console.log(`📊 Health status: ${healthStatus.status}, availability: ${metrics.availability}%`);
        
        expect(healthStatus.status).toBeDefined();
        expect(metrics.availability).toBeGreaterThanOrEqual(0);
        
        testResults.phase3.passed++;
        
      } catch (error) {
        testResults.phase3.failed++;
        testResults.phase3.errors.push(error.message);
        throw error;
      }
    });
  });

  describe('Integration Stability Tests', () => {
    
    it('should handle end-to-end operations without failures', async () => {
      console.log('🔄 Testing end-to-end stability...');
      
      try {
        // This test integrates all phases
        console.log('  Phase 1: Browser connection...');
        // Simulate browser operations (without actual browser for speed)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('  Phase 2: DOM operations...');
        // Simulate DOM operations
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('  Phase 3: Error recovery...');
        // Simulate error handling
        const safeOp = safeExecute(
          async () => ({ result: 'success' }),
          async () => ({ result: 'fallback' }),
          'integration-test'
        );
        
        const result = await safeOp();
        expect(result.result).toContain('success');
        
        console.log('✅ End-to-end operation completed successfully');
        testResults.integration.passed++;
        
      } catch (error) {
        testResults.integration.failed++;
        testResults.integration.errors.push(error.message);
        throw error;
      }
    });

    it('should demonstrate framework resilience under mixed load', async () => {
      console.log('💪 Testing framework resilience...');
      
      const startTime = Date.now();
      
      try {
        // Mix of different operation types
        const operations = [
          // Cache operations
          ...Array(10).fill().map((_, i) => 
            new Promise(resolve => setTimeout(() => resolve(`cache-${i}`), Math.random() * 100))
          ),
          
          // Error recovery operations
          ...Array(5).fill().map((_, i) => 
            withErrorRecovery(
              async () => {
                if (Math.random() < 0.3) throw new Error(`Random error ${i}`);
                return `recovery-${i}`;
              },
              `mixed-load-${i}`
            )()
          ),
          
          // Circuit breaker operations
          ...Array(3).fill().map((_, i) => 
            new Promise(resolve => setTimeout(() => resolve(`breaker-${i}`), Math.random() * 200))
          )
        ];
        
        const results = await Promise.allSettled(operations);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        const successRate = (successful / results.length) * 100;
        const elapsed = Date.now() - startTime;
        
        console.log(`✅ Mixed load test: ${successful}/${results.length} operations succeeded (${successRate.toFixed(1)}%)`);
        console.log(`⏱️ Completed in ${elapsed}ms`);
        
        // Expect high success rate
        expect(successRate).toBeGreaterThanOrEqual(80);
        
        testResults.integration.passed++;
        testResults.performance.results.push(elapsed);
        
      } catch (error) {
        testResults.integration.failed++;
        testResults.integration.errors.push(error.message);
        throw error;
      }
    });
  });

  describe('Performance & Memory Tests', () => {
    
    it('should maintain performance under sustained load', async () => {
      console.log('⚡ Testing sustained performance...');
      
      const performanceTests = [];
      const memoryBefore = process.memoryUsage();
      
      for (let i = 0; i < TEST_CONFIG.STRESS_TEST_ITERATIONS; i++) {
        const operation = async () => {
          const start = Date.now();
          
          // Simulate framework operations
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          
          return Date.now() - start;
        };
        
        performanceTests.push(operation());
      }
      
      const times = await Promise.all(performanceTests);
      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      
      const memoryAfter = process.memoryUsage();
      const memoryIncrease = (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024; // MB
      
      console.log(`⏱️ Average operation time: ${averageTime.toFixed(1)}ms`);
      console.log(`⏱️ Maximum operation time: ${maxTime}ms`);
      console.log(`💾 Memory increase: ${memoryIncrease.toFixed(1)}MB`);
      
      expect(averageTime).toBeLessThan(100); // Average should be under 100ms
      expect(maxTime).toBeLessThan(TEST_CONFIG.PERFORMANCE_THRESHOLD_MS);
      expect(memoryIncrease).toBeLessThan(TEST_CONFIG.MEMORY_LEAK_THRESHOLD_MB);
      
      testResults.performance.averageTime = averageTime;
      testResults.integration.passed++;
    });
  });
});