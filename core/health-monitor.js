// Health monitoring and alerting system for Super Pancake Framework

import { getAllCircuitBreakers } from './errors.js';

class HealthMonitor {
  constructor() {
    this.checks = new Map();
    this.checkInterval = null;
    this.alertCallbacks = [];
    this.history = [];
    this.maxHistory = 100;

    console.log('🏥 Health monitor initialized');
  }

  // Register a health check
  addCheck(name, checkFn, options = {}) {
    const {
      interval = 30000, // 30 seconds
      timeout = 5000,   // 5 seconds
      critical = false,
      description = `Health check for ${name}`
    } = options;

    this.checks.set(name, {
      name,
      checkFn,
      interval,
      timeout,
      critical,
      description,
      lastCheck: null,
      lastResult: null,
      consecutiveFailures: 0
    });

    console.log(`📋 Health check "${name}" registered (critical: ${critical})`);
  }

  // Start monitoring
  start(interval = 30000) {
    if (this.checkInterval) {
      console.log('⚠️ Health monitor already running');
      return;
    }

    console.log(`🚀 Starting health monitor (interval: ${interval}ms)`);

    // Run initial check
    this.runAllChecks();

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.runAllChecks();
    }, interval);
  }

  // Stop monitoring
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Health monitor stopped');
    }
  }

  // Run all health checks
  async runAllChecks() {
    console.log('🔍 Running health checks...');

    const results = {};
    let hasFailures = false;

    for (const [name, check] of this.checks) {
      try {
        const result = await this.runSingleCheck(check);
        results[name] = result;

        if (!result.healthy && check.critical) {
          hasFailures = true;
        }

      } catch (error) {
        const failureResult = {
          healthy: false,
          error: error.message,
          timestamp: new Date().toISOString(),
          duration: 0
        };

        results[name] = failureResult;
        check.lastResult = failureResult;
        check.consecutiveFailures++;

        if (check.critical) {
          hasFailures = true;
        }
      }
    }

    // Add circuit breaker status
    results._circuitBreakers = this.getCircuitBreakerHealth();

    // Store in history
    const healthSnapshot = {
      timestamp: new Date().toISOString(),
      results,
      overallHealth: !hasFailures,
      criticalIssues: this.getCriticalIssues(results)
    };

    this.addToHistory(healthSnapshot);

    // Trigger alerts if needed
    if (hasFailures) {
      this.triggerAlert('critical', healthSnapshot);
    }

    return healthSnapshot;
  }

  // Run a single health check
  async runSingleCheck(check) {
    const startTime = Date.now();

    try {
      // Run check with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
      });

      const checkPromise = Promise.resolve(check.checkFn());
      const result = await Promise.race([checkPromise, timeoutPromise]);

      const duration = Date.now() - startTime;

      const healthResult = {
        healthy: result === true || (result && result.healthy !== false),
        data: result,
        timestamp: new Date().toISOString(),
        duration
      };

      check.lastCheck = new Date().toISOString();
      check.lastResult = healthResult;
      check.consecutiveFailures = healthResult.healthy ? 0 : check.consecutiveFailures + 1;

      return healthResult;

    } catch (error) {
      const duration = Date.now() - startTime;

      const failureResult = {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration
      };

      check.lastCheck = new Date().toISOString();
      check.lastResult = failureResult;
      check.consecutiveFailures++;

      return failureResult;
    }
  }

  // Get circuit breaker health status
  getCircuitBreakerHealth() {
    const breakers = getAllCircuitBreakers();

    return {
      total: breakers.length,
      healthy: breakers.filter(b => b.isHealthy).length,
      open: breakers.filter(b => b.state === 'open').length,
      halfOpen: breakers.filter(b => b.state === 'half-open').length,
      details: breakers
    };
  }

  // Get critical issues from results
  getCriticalIssues(results) {
    const issues = [];

    for (const [name, result] of Object.entries(results)) {
      if (name.startsWith('_')) {continue;} // Skip metadata

      const check = this.checks.get(name);
      if (check && check.critical && !result.healthy) {
        issues.push({
          check: name,
          error: result.error,
          consecutiveFailures: check.consecutiveFailures,
          description: check.description
        });
      }
    }

    return issues;
  }

  // Add result to history
  addToHistory(snapshot) {
    this.history.push(snapshot);

    // Keep only recent history
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }
  }

  // Register alert callback
  onAlert(callback) {
    this.alertCallbacks.push(callback);
  }

  // Trigger alert
  triggerAlert(level, data) {
    console.error(`🚨 Health alert (${level.toUpperCase()}):`, {
      criticalIssues: data.criticalIssues.length,
      timestamp: data.timestamp
    });

    this.alertCallbacks.forEach(callback => {
      try {
        callback(level, data);
      } catch (error) {
        console.error('❌ Alert callback failed:', error.message);
      }
    });
  }

  // Get current health status
  getStatus() {
    if (this.history.length === 0) {
      return {
        status: 'unknown',
        message: 'No health checks run yet'
      };
    }

    const latest = this.history[this.history.length - 1];

    return {
      status: latest.overallHealth ? 'healthy' : 'unhealthy',
      timestamp: latest.timestamp,
      criticalIssues: latest.criticalIssues.length,
      totalChecks: Object.keys(latest.results).length - 1, // Exclude metadata
      details: latest.results
    };
  }

  // Get health history
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  // Get health metrics
  getMetrics() {
    if (this.history.length === 0) {
      return { availability: 0, averageResponseTime: 0, errorRate: 100 };
    }

    const recent = this.history.slice(-20); // Last 20 checks
    const healthy = recent.filter(h => h.overallHealth).length;
    const availability = (healthy / recent.length) * 100;

    // Calculate average response time
    const responseTimes = [];
    recent.forEach(snapshot => {
      Object.values(snapshot.results).forEach(result => {
        if (result.duration !== undefined) {
          responseTimes.push(result.duration);
        }
      });
    });

    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const errorRate = 100 - availability;

    return {
      availability: Math.round(availability * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      totalChecks: recent.length,
      healthyChecks: healthy
    };
  }
}

// Global health monitor instance
const globalHealthMonitor = new HealthMonitor();

// Default health checks
globalHealthMonitor.addCheck('framework-core', async () => {
  // Basic framework health check
  try {
    const { config } = await import('../config.js');
    return { healthy: true, config: !!config };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}, { critical: true, description: 'Core framework functionality' });

globalHealthMonitor.addCheck('error-system', async () => {
  // Error system health check
  try {
    const { SuperPancakeError } = await import('./errors.js');
    const testError = new SuperPancakeError('test', 'TEST');
    return { healthy: !!testError.timestamp };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}, { critical: true, description: 'Error handling system' });

// Export functions
export function getHealthMonitor() {
  return globalHealthMonitor;
}

export function addHealthCheck(name, checkFn, options) {
  return globalHealthMonitor.addCheck(name, checkFn, options);
}

export function startHealthMonitoring(interval) {
  return globalHealthMonitor.start(interval);
}

export function stopHealthMonitoring() {
  return globalHealthMonitor.stop();
}

export function getHealthStatus() {
  return globalHealthMonitor.getStatus();
}

export function getHealthMetrics() {
  return globalHealthMonitor.getMetrics();
}

export function onHealthAlert(callback) {
  return globalHealthMonitor.onAlert(callback);
}

// Health check endpoint (for external monitoring)
export async function healthCheck() {
  const monitor = getHealthMonitor();
  const status = monitor.getStatus();
  const metrics = monitor.getMetrics();

  return {
    status: status.status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ...status,
    metrics
  };
}
