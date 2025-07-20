# Super Pancake Framework - API Reference

**Version:** 2.6.10  
**Status:** Production Ready ✅  
**Last Updated:** 2024-12-19  

## 📚 Table of Contents

- [Core Framework](#core-framework)
- [Browser Management](#browser-management)
- [Session Management](#session-management)
- [DOM Operations](#dom-operations)
- [Error Handling](#error-handling)
- [Health Monitoring](#health-monitoring)
- [Production Monitoring](#production-monitoring)
- [Deployment Management](#deployment-management)
- [Scaling Management](#scaling-management)
- [Cache Management](#cache-management)

---

## 🔧 Core Framework

### Browser Management

#### `launchChrome(options)`

Launches a Chrome browser instance with enhanced stability.

```javascript
import { launchChrome } from './utils/launcher.js';

const chrome = await launchChrome({
  headed: false,          // Run headless
  port: 9222,            // WebSocket port
  maxRetries: 3,         // Launch retry attempts
  timeout: 30000,        // Launch timeout (ms)
  userDataDir: null,     // Custom user data directory
  args: []               // Additional Chrome arguments
});
```

**Returns:** `ChromeProcess` - Chrome process handle

**Enhanced Features:**
- ✅ Multi-attempt cleanup with verification
- ✅ Platform-specific process management
- ✅ Port availability verification
- ✅ Enhanced error messages with troubleshooting

---

#### `connectToChrome(port, maxRetries)`

Establishes WebSocket connection to Chrome DevTools.

```javascript
import { connectToChrome } from './core/browser.js';

const ws = await connectToChrome(9222, 3);
```

**Parameters:**
- `port` (number): Chrome DevTools port
- `maxRetries` (number): Connection retry attempts

**Returns:** `WebSocket` - Enhanced WebSocket connection

**Enhanced Features:**
- ✅ 5-second ping intervals (improved from 30s)
- ✅ Automatic reconnection with exponential backoff
- ✅ Connection health monitoring
- ✅ Crash detection and recovery

---

#### `isConnectionHealthy(ws)`

Checks WebSocket connection health.

```javascript
import { isConnectionHealthy } from './core/browser.js';

const healthy = isConnectionHealthy(ws);
console.log('Connection healthy:', healthy);
```

**Returns:** `boolean` - Connection health status

---

#### `closeConnection(ws)`

Safely closes WebSocket connection.

```javascript
import { closeConnection } from './core/browser.js';

closeConnection(ws);
```

---

## 📞 Session Management

#### `createSession(ws)`

Creates an enhanced session with comprehensive error handling.

```javascript
import { createSession } from './core/session.js';

const session = createSession(ws);
```

**Returns:** `Session` - Enhanced session object

**Session Methods:**

##### `session.send(method, params, timeout)`

Send CDP command with enhanced error handling.

```javascript
const result = await session.send('Runtime.evaluate', {
  expression: '1 + 1',
  returnByValue: true
}, 5000);
```

**Enhanced Features:**
- ✅ Comprehensive WebSocket state validation
- ✅ Message timeout handling (30s default)
- ✅ CDP error wrapping and context preservation
- ✅ Automatic retry with circuit breaker protection

---

##### `session.isHealthy()`

Check session health.

```javascript
const healthy = await session.isHealthy();
```

**Returns:** `boolean` - Session health status

---

##### `session.navigateTo(url)`

Navigate with enhanced error recovery.

```javascript
await session.navigateTo('https://example.com');
```

**Enhanced Features:**
- ✅ Enhanced load event handling
- ✅ Timeout management
- ✅ Error recovery and context preservation

---

##### `session.getStats()`

Get session statistics.

```javascript
const stats = session.getStats();
console.log('Session stats:', stats);
```

**Returns:** Object with session metrics

---

##### `session.destroy()`

Clean up session resources.

```javascript
session.destroy();
```

---

## 🎯 DOM Operations

#### `enableDOM(session)`

Enable DOM operations for session.

```javascript
import { enableDOM } from './core/dom.js';

await enableDOM(session);
```

---

#### `navigateTo(session, url, options)`

Navigate to URL with enhanced reliability.

```javascript
import { navigateTo } from './core/dom.js';

await navigateTo(session, 'https://example.com', {
  timeout: 30000,
  waitForLoad: true
});
```

**Enhanced Features:**
- ✅ Enhanced load detection
- ✅ Automatic cache invalidation
- ✅ Session isolation

---

#### `waitForSelector(session, selector, timeout, options)`

Wait for element with enhanced conditions.

```javascript
import { waitForSelector } from './core/dom.js';

const element = await waitForSelector(session, '#submit-btn', 5000, {
  visible: true,
  enabled: true
});
```

**Enhanced Features:**
- ✅ Dynamic timeout calculation
- ✅ Element state validation (visible, enabled, clickable)
- ✅ Real-time staleness detection
- ✅ Progressive retry with exponential backoff

---

#### `click(session, selectorOrNodeId, options)`

Click element with enhanced reliability.

```javascript
import { click } from './core/dom.js';

await click(session, '#submit-btn', {
  retries: 3,
  waitForClickable: true,
  scrollIntoView: true
});
```

**Enhanced Features:**
- ✅ Clickability verification
- ✅ Automatic staleness detection
- ✅ Retry logic with progressive delays
- ✅ Cache invalidation after interaction

---

#### `fillInput(session, selectorOrNodeId, value, options)`

Fill input with enhanced reliability.

```javascript
import { fillInput } from './core/dom.js';

await fillInput(session, '#email', 'user@example.com', {
  retries: 3,
  clearFirst: true,
  waitForEnabled: true
});
```

**Enhanced Features:**
- ✅ Element enablement checks
- ✅ Automatic value validation
- ✅ Cache invalidation after modification
- ✅ Enhanced error context

---

#### `takeScreenshot(session, path, options)`

Capture screenshot with enhanced reliability.

```javascript
import { takeScreenshot } from './core/dom.js';

await takeScreenshot(session, './screenshot.png', {
  format: 'png',
  quality: 90,
  fullPage: true
});
```

**Enhanced Features:**
- ✅ Enhanced error handling
- ✅ Path validation and directory creation
- ✅ Format optimization
- ✅ Retry logic for transient failures

---

#### `interactWithElement(session, selector, action, options)`

General-purpose element interaction.

```javascript
import { interactWithElement } from './core/dom.js';

await interactWithElement(session, '#button', 'click', {
  waitForEnabled: true,
  retries: 3
});
```

---

## 🛡️ Error Handling

#### `withErrorRecovery(fn, operation)`

Wrap function with comprehensive error recovery.

```javascript
import { withErrorRecovery } from './core/errors.js';

const safeOperation = withErrorRecovery(async () => {
  // Your risky operation
  await someRiskyOperation();
}, 'critical-operation');

const result = await safeOperation();
```

**Enhanced Features:**
- ✅ Prevents all STACK_TRACE_ERROR issues
- ✅ Rich error context and debugging information
- ✅ Automatic error classification and wrapping

---

#### `withRetry(fn, options)`

Enhanced retry mechanism with exponential backoff.

```javascript
import { withRetry } from './core/errors.js';

const resilientOperation = withRetry(async () => {
  // Operation that might fail
  return await unreliableOperation();
}, {
  maxRetries: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  operation: 'network-request'
});

const result = await resilientOperation();
```

**Options:**
- `maxRetries`: Maximum retry attempts (default: 3)
- `baseDelay`: Initial delay in ms (default: 1000)
- `maxDelay`: Maximum delay in ms (default: 30000)
- `operation`: Operation name for logging

**Enhanced Features:**
- ✅ Exponential backoff with jitter
- ✅ Configurable retry strategies
- ✅ Detailed retry logging and metrics

---

#### `safeExecute(primaryFn, fallbackFn, operation)`

Execute with fallback support.

```javascript
import { safeExecute } from './core/errors.js';

const resilientOperation = safeExecute(
  async () => {
    // Primary operation
    return await primaryOperation();
  },
  async () => {
    // Fallback operation
    return await fallbackOperation();
  },
  'critical-business-operation'
);

const result = await resilientOperation();
```

**Enhanced Features:**
- ✅ Graceful degradation
- ✅ Fallback execution tracking
- ✅ Error aggregation and reporting

---

#### `getCircuitBreaker(name, options)`

Get or create circuit breaker instance.

```javascript
import { getCircuitBreaker } from './core/errors.js';

const breaker = getCircuitBreaker('external-api', {
  failureThreshold: 5,
  recoveryTimeout: 30000,
  monitoringWindow: 60000
});

const result = await breaker.execute(async () => {
  return await externalApiCall();
});
```

**Circuit Breaker States:**
- **CLOSED**: Normal operation
- **OPEN**: Blocking requests due to failures
- **HALF-OPEN**: Testing recovery

**Enhanced Features:**
- ✅ Three-state circuit breaker pattern
- ✅ Automatic recovery attempts
- ✅ Request monitoring and statistics
- ✅ Configurable failure detection

---

#### `withCircuitBreaker(fn, breakerName, options)`

Wrap function with circuit breaker protection.

```javascript
import { withCircuitBreaker } from './core/errors.js';

const protectedOperation = withCircuitBreaker(
  async () => await externalService(),
  'external-service',
  { failureThreshold: 3 }
);
```

---

#### `getAllCircuitBreakers()`

Get all circuit breaker instances.

```javascript
import { getAllCircuitBreakers } from './core/errors.js';

const breakers = getAllCircuitBreakers();
console.log('Circuit breaker states:', breakers.map(b => ({
  name: b.name,
  state: b.state,
  failures: b.totalFailures
})));
```

---

## 🏥 Health Monitoring

#### `getHealthMonitor()`

Get global health monitor instance.

```javascript
import { getHealthMonitor } from './core/health-monitor.js';

const monitor = getHealthMonitor();
```

---

#### `addHealthCheck(name, checkFn, options)`

Add custom health check.

```javascript
import { addHealthCheck } from './core/health-monitor.js';

addHealthCheck('database-connection', async () => {
  const connected = await checkDatabase();
  return {
    healthy: connected,
    responseTime: 150,
    connectionCount: 5
  };
}, {
  critical: true,
  interval: 30000,
  timeout: 5000,
  description: 'Database connectivity check'
});
```

**Options:**
- `critical`: Whether failure affects overall health
- `interval`: Check interval in ms
- `timeout`: Check timeout in ms  
- `description`: Human-readable description

---

#### `startHealthMonitoring(interval)`

Start health monitoring.

```javascript
import { startHealthMonitoring } from './core/health-monitor.js';

startHealthMonitoring(30000); // Check every 30 seconds
```

---

#### `stopHealthMonitoring()`

Stop health monitoring.

```javascript
import { stopHealthMonitoring } from './core/health-monitor.js';

stopHealthMonitoring();
```

---

#### `getHealthStatus()`

Get current health status.

```javascript
import { getHealthStatus } from './core/health-monitor.js';

const status = getHealthStatus();
console.log('Overall health:', status.status);
console.log('Critical issues:', status.criticalIssues);
```

---

#### `getHealthMetrics()`

Get health metrics.

```javascript
import { getHealthMetrics } from './core/health-monitor.js';

const metrics = getHealthMetrics();
console.log('Availability:', metrics.availability + '%');
console.log('Average response time:', metrics.averageResponseTime + 'ms');
```

---

#### `healthCheck()`

Perform comprehensive health check.

```javascript
import { healthCheck } from './core/health-monitor.js';

const result = await healthCheck();
console.log('Health check result:', result);
```

---

## 📊 Production Monitoring

#### `getProductionMonitor()`

Get global production monitor instance.

```javascript
import { getProductionMonitor } from './core/production-monitor.js';

const monitor = getProductionMonitor();
```

---

#### `startProductionMonitoring()`

Start production monitoring.

```javascript
import { startProductionMonitoring } from './core/production-monitor.js';

startProductionMonitoring();
```

**Features:**
- ✅ System resource monitoring
- ✅ Performance metrics collection
- ✅ Error rate tracking
- ✅ Alert generation
- ✅ Metrics export

---

#### `stopProductionMonitoring()`

Stop production monitoring.

```javascript
import { stopProductionMonitoring } from './core/production-monitor.js';

stopProductionMonitoring();
```

---

#### `recordOperation(type, duration, success)`

Record operation metrics.

```javascript
import { recordOperation } from './core/production-monitor.js';

recordOperation('browser-launch', 1500, true);
recordOperation('dom-click', 250, true);
recordOperation('screenshot', 800, false);
```

**Parameters:**
- `type`: Operation type ('browser', 'dom', 'session', etc.)
- `duration`: Operation duration in ms
- `success`: Whether operation succeeded

---

#### `recordError(errorType, recovered)`

Record error occurrence.

```javascript
import { recordError } from './core/production-monitor.js';

recordError('STACK_TRACE_ERROR', false);
recordError('CONNECTION_ERROR', true);
```

---

#### `getProductionMetrics()`

Get production metrics.

```javascript
import { getProductionMetrics } from './core/production-monitor.js';

const metrics = getProductionMetrics();
console.log('System metrics:', metrics.system);
console.log('Browser metrics:', metrics.browser);
console.log('Error metrics:', metrics.errors);
```

---

#### `getProductionAlerts(limit)`

Get recent production alerts.

```javascript
import { getProductionAlerts } from './core/production-monitor.js';

const alerts = getProductionAlerts(10);
alerts.forEach(alert => {
  console.log(`[${alert.severity}] ${alert.message}`);
});
```

---

#### `generateProductionHealthReport()`

Generate comprehensive health report.

```javascript
import { generateProductionHealthReport } from './core/production-monitor.js';

const report = generateProductionHealthReport();
console.log('Production Health Report:', report);
```

---

## 🚀 Deployment Management

#### `getDeploymentManager()`

Get deployment manager instance.

```javascript
import { getDeploymentManager } from './core/deployment-manager.js';

const deploymentManager = getDeploymentManager();
```

---

#### `deployFramework()`

Deploy framework to current environment.

```javascript
import { deployFramework } from './core/deployment-manager.js';

const result = await deployFramework();
console.log('Deployment result:', result);
```

**Features:**
- ✅ Pre-deployment checks
- ✅ Environment configuration
- ✅ Post-deployment validation
- ✅ Automatic rollback on failure

---

#### `getDeploymentStatus()`

Get deployment status.

```javascript
import { getDeploymentStatus } from './core/deployment-manager.js';

const status = getDeploymentStatus();
console.log('Deployment status:', status.state.status);
console.log('Environment:', status.environment);
```

---

#### `switchEnvironment(environment)`

Switch to different environment.

```javascript
import { switchEnvironment } from './core/deployment-manager.js';

await switchEnvironment('production');
```

**Supported Environments:**
- `development`: Development environment
- `staging`: Staging environment  
- `production`: Production environment

---

#### `rollbackDeployment()`

Rollback to previous deployment.

```javascript
import { rollbackDeployment } from './core/deployment-manager.js';

await rollbackDeployment();
```

---

#### `generateDeploymentReport()`

Generate deployment report.

```javascript
import { generateDeploymentReport } from './core/deployment-manager.js';

const report = generateDeploymentReport();
console.log('Deployment report:', report);
```

---

## 📈 Scaling Management

#### `getScalingManager()`

Get scaling manager instance.

```javascript
import { getScalingManager } from './core/scaling-manager.js';

const scalingManager = getScalingManager();
```

---

#### `startScaling()`

Start auto-scaling management.

```javascript
import { startScaling } from './core/scaling-manager.js';

startScaling();
```

**Features:**
- ✅ Auto-scaling based on metrics
- ✅ Load balancing
- ✅ Instance health monitoring
- ✅ Resource optimization

---

#### `stopScaling()`

Stop scaling management.

```javascript
import { stopScaling } from './core/scaling-manager.js';

stopScaling();
```

---

#### `scaleToInstances(count)`

Scale to specific number of instances.

```javascript
import { scaleToInstances } from './core/scaling-manager.js';

await scaleToInstances(5);
```

---

#### `getScalingStatus()`

Get scaling status.

```javascript
import { getScalingStatus } from './core/scaling-manager.js';

const status = getScalingStatus();
console.log('Current instances:', status.instances.total);
console.log('Auto-scaling enabled:', status.autoScaling.enabled);
```

---

## 📋 Cache Management

#### `configureEnhancedCaching(options)`

Configure cache settings.

```javascript
import { configureEnhancedCaching } from './core/query-cache.js';

configureEnhancedCaching({
  maxSize: 200,
  dynamicTTL: 5000,    // 5 seconds for dynamic content
  staticTTL: 30000     // 30 seconds for static content
});
```

**Enhanced Features:**
- ✅ Dynamic vs static content TTL
- ✅ Session isolation
- ✅ Event-driven invalidation

---

#### `getCacheStats()`

Get cache statistics.

```javascript
import { getCacheStats } from './core/query-cache.js';

const stats = getCacheStats();
console.log('Cache hits:', stats.hits);
console.log('Cache misses:', stats.misses);
console.log('Hit rate:', ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1) + '%');
```

---

#### `clearQueryCache()`

Clear all cache entries.

```javascript
import { clearQueryCache } from './core/query-cache.js';

clearQueryCache();
```

---

#### `invalidateCacheByPattern(pattern)`

Invalidate cache entries by pattern.

```javascript
import { invalidateCacheByPattern } from './core/query-cache.js';

invalidateCacheByPattern('input[data-dynamic]');
```

---

#### `invalidateSessionCache(sessionId)`

Invalidate cache for specific session.

```javascript
import { invalidateSessionCache } from './core/query-cache.js';

invalidateSessionCache('session_123');
```

---

#### `onDOMModification(callback)`

Register DOM modification handler.

```javascript
import { onDOMModification } from './core/query-cache.js';

onDOMModification((selector, sessionId) => {
  console.log(`DOM modified: ${selector} in session ${sessionId}`);
});
```

---

## 🔧 Utility Functions

#### Error Classes

```javascript
import { 
  SuperPancakeError,
  SessionError,
  StackTraceError,
  CircuitBreakerError,
  RecoveryError
} from './core/errors.js';

// Enhanced error with context
throw new SuperPancakeError('Operation failed', 'OPERATION_ERROR', {
  operation: 'click',
  selector: '#button',
  retryCount: 3
});
```

#### Configuration

```javascript
// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Framework configuration
process.env.SUPER_PANCAKE_DEBUG = 'true';
process.env.SUPER_PANCAKE_VERBOSE = 'true';
process.env.SUPER_PANCAKE_MAX_INSTANCES = '10';
```

---

## 📝 Type Definitions

### Session Object

```typescript
interface Session {
  id: string;
  send(method: string, params?: object, timeout?: number): Promise<any>;
  isHealthy(): Promise<boolean>;
  navigateTo(url: string): Promise<void>;
  getStats(): SessionStats;
  destroy(): void;
}
```

### Health Check Result

```typescript
interface HealthCheckResult {
  healthy: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  duration: number;
}
```

### Production Metrics

```typescript
interface ProductionMetrics {
  system: {
    uptime: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    currentMemoryUsage: number;
  };
  browser: {
    totalLaunches: number;
    successfulLaunches: number;
    averageLaunchTime: number;
    activeSessions: number;
  };
  dom: {
    totalOperations: number;
    successfulOperations: number;
    averageOperationTime: number;
    cacheHitRate: number;
  };
  errors: {
    totalErrors: number;
    stackTraceErrors: number;
    preventedStackTraceErrors: number;
    recoveredErrors: number;
  };
}
```

---

## 🎯 Examples

### Complete Example

```javascript
import { launchChrome } from './utils/launcher.js';
import { connectToChrome, closeConnection } from './core/browser.js';
import { createSession } from './core/session.js';
import { enableDOM, navigateTo, fillInput, click, takeScreenshot } from './core/dom.js';
import { withErrorRecovery, withRetry } from './core/errors.js';
import { startProductionMonitoring, recordOperation } from './core/production-monitor.js';

async function automationExample() {
  // Start monitoring
  startProductionMonitoring();
  
  const startTime = Date.now();
  
  try {
    // Launch browser with retry
    const launchBrowser = withRetry(
      () => launchChrome({ headed: false, port: 9222 }),
      { maxRetries: 3, operation: 'browser-launch' }
    );
    
    const chrome = await launchBrowser();
    recordOperation('browser', Date.now() - startTime, true);
    
    // Connect with error recovery
    const connectSafely = withErrorRecovery(
      () => connectToChrome(9222, 3),
      'browser-connection'
    );
    
    const ws = await connectSafely();
    const session = createSession(ws);
    
    // Enable DOM and navigate
    await enableDOM(session);
    await navigateTo(session, 'https://example.com');
    
    // Interact with page
    await fillInput(session, '#email', 'user@example.com');
    await fillInput(session, '#password', 'password123');
    await click(session, '#login-button');
    
    // Take screenshot
    await takeScreenshot(session, './success.png');
    
    // Cleanup
    closeConnection(ws);
    
  } catch (error) {
    console.error('Automation failed:', error.message);
    recordOperation('automation', Date.now() - startTime, false);
  }
}
```

---

**🎉 The Super Pancake Framework provides a comprehensive, production-ready API with enterprise-grade stability, monitoring, and scaling capabilities!**