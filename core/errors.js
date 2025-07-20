// Core error types for Super Pancake Automation Framework

export class SuperPancakeError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', context = {}) {
    super(message);
    this.name = 'SuperPancakeError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SuperPancakeError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export class ElementNotFoundError extends SuperPancakeError {
  constructor(selector, context = {}) {
    super(`Element not found for selector: "${selector}"`, 'ELEMENT_NOT_FOUND', {
      selector,
      ...context
    });
  }
}

export class TimeoutError extends SuperPancakeError {
  constructor(operation, timeout, context = {}) {
    super(`Operation "${operation}" timed out after ${timeout}ms`, 'TIMEOUT_ERROR', {
      operation,
      timeout,
      ...context
    });
  }
}

export class ValidationError extends SuperPancakeError {
  constructor(parameter, expected, actual, context = {}) {
    super(`Invalid ${parameter}: expected ${expected}, got ${actual}`, 'VALIDATION_ERROR', {
      parameter,
      expected,
      actual,
      ...context
    });
  }
}

export class SessionError extends SuperPancakeError {
  constructor(message, context = {}) {
    super(message, 'SESSION_ERROR', context);
  }
}

export class SecurityError extends SuperPancakeError {
  constructor(message, context = {}) {
    super(message, 'SECURITY_ERROR', context);
  }
}

export class StackTraceError extends SuperPancakeError {
  constructor(originalError, operation, context = {}) {
    const message = `STACK_TRACE_ERROR in ${operation}: ${originalError?.message || 'Unknown error'}`;
    super(message, 'STACK_TRACE_ERROR', {
      originalError: originalError?.message,
      originalStack: originalError?.stack,
      operation,
      ...context
    });
    
    // Preserve original stack trace if available
    if (originalError?.stack) {
      this.originalStack = originalError.stack;
    }
  }
}

export class CircuitBreakerError extends SuperPancakeError {
  constructor(operation, failures, context = {}) {
    super(`Circuit breaker open for ${operation} after ${failures} failures`, 'CIRCUIT_BREAKER_OPEN', {
      operation,
      failures,
      ...context
    });
  }
}

export class RecoveryError extends SuperPancakeError {
  constructor(operation, attempts, context = {}) {
    super(`Recovery failed for ${operation} after ${attempts} attempts`, 'RECOVERY_FAILED', {
      operation,
      attempts,
      ...context
    });
  }
}

// Enhanced error recovery utilities
export function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 1.5,
    maxDelay = 10000,
    operation = 'unknown operation'
  } = options;

  return async function retryWrapper(...args) {
    let lastError;
    let currentDelay = delay;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn(...args);
        
        // Log successful recovery if this wasn't the first attempt
        if (attempt > 1) {
          console.log(`✅ Operation "${operation}" succeeded on attempt ${attempt}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        if (error instanceof ValidationError || 
            error instanceof SecurityError ||
            error instanceof CircuitBreakerError) {
          throw error;
        }
        
        // Enhanced error logging
        console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed for "${operation}": ${error.message}`);
        
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying in ${currentDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
        }
      }
    }
    
    // All retries failed - create comprehensive error
    throw new RecoveryError(operation, maxRetries, {
      originalError: lastError?.message,
      originalCode: lastError?.code,
      attempts: maxRetries,
      totalDelay: delay * (Math.pow(backoffMultiplier, maxRetries) - 1) / (backoffMultiplier - 1)
    });
  };
}

// Comprehensive error wrapper to prevent STACK_TRACE_ERROR
export function withErrorRecovery(fn, operation = 'unknown operation') {
  return async function errorRecoveryWrapper(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      // Prevent STACK_TRACE_ERROR by catching and wrapping all errors
      if (error.name === 'STACK_TRACE_ERROR' || !error.message) {
        throw new StackTraceError(error, operation, {
          args: args.length,
          functionName: fn.name || 'anonymous'
        });
      }
      
      // Enhance error context for better debugging
      if (error instanceof SuperPancakeError) {
        error.context = {
          ...error.context,
          operation,
          timestamp: new Date().toISOString(),
          functionName: fn.name || 'anonymous'
        };
        throw error;
      }
      
      // Wrap unknown errors
      throw new SuperPancakeError(
        `Unexpected error in ${operation}: ${error.message}`,
        'UNEXPECTED_ERROR',
        {
          originalError: error.message,
          originalStack: error.stack,
          operation,
          functionName: fn.name || 'anonymous'
        }
      );
    }
  };
}

// Safe execution wrapper for critical operations
export function safeExecute(fn, fallback = null, operation = 'unknown operation') {
  return async function safeExecuteWrapper(...args) {
    try {
      return await withErrorRecovery(fn, operation)(...args);
    } catch (error) {
      console.error(`🚨 Critical error in ${operation}:`, error.message);
      
      if (fallback && typeof fallback === 'function') {
        console.log(`🔄 Executing fallback for ${operation}...`);
        try {
          return await fallback(...args);
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed for ${operation}:`, fallbackError.message);
          throw new SuperPancakeError(
            `Both primary and fallback operations failed for ${operation}`,
            'COMPLETE_FAILURE',
            {
              primaryError: error.message,
              fallbackError: fallbackError.message,
              operation
            }
          );
        }
      }
      
      throw error;
    }
  };
}

// Input validation utilities
export function validateSession(session) {
  if (!session || typeof session.send !== 'function') {
    throw new ValidationError('session', 'valid session object with send method', typeof session);
  }
}

export function validateSelector(selector) {
  if (!selector || typeof selector !== 'string' || selector.trim().length === 0) {
    throw new ValidationError('selector', 'non-empty string', typeof selector);
  }
  
  // Basic CSS selector validation
  if (selector.includes('<script') || selector.includes('javascript:')) {
    throw new SecurityError('Selector contains potentially malicious content', { selector });
  }
}

export function validateTimeout(timeout) {
  if (timeout !== undefined && (!Number.isInteger(timeout) || timeout < 0)) {
    throw new ValidationError('timeout', 'positive integer', timeout);
  }
}

export function validateText(text, paramName = 'text') {
  if (text === null || text === undefined) {
    throw new ValidationError(paramName, 'string or number', typeof text);
  }
  
  // Check for potential code injection
  const textStr = String(text);
  if (textStr.includes('<script') || textStr.includes('javascript:') || textStr.includes('data:text/html')) {
    throw new SecurityError(`${paramName} contains potentially malicious content`, { [paramName]: textStr });
  }
}

export function validateFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('filePath', 'non-empty string', typeof filePath);
  }
  
  // Prevent directory traversal
  if (filePath.includes('..') || filePath.includes('~')) {
    throw new SecurityError('File path contains directory traversal patterns', { filePath });
  }
}

export function sanitizeForExecution(value) {
  if (typeof value === 'string') {
    // Escape special characters for safe JavaScript execution
    return value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
  return value;
}

// Circuit Breaker Implementation
export class CircuitBreaker {
  constructor(options = {}) {
    this.name = options.name || 'unknown';
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 30000; // 30 seconds
    this.monitoringWindow = options.monitoringWindow || 60000; // 1 minute
    
    // Circuit states: 'closed', 'open', 'half-open'
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    
    // Request tracking
    this.requests = [];
    
    console.log(`🔧 Circuit breaker "${this.name}" initialized (threshold: ${this.failureThreshold})`);
  }
  
  async execute(fn, ...args) {
    // Check if circuit should transition from open to half-open
    if (this.state === 'open' && this.shouldAttemptRecovery()) {
      this.state = 'half-open';
      console.log(`🔄 Circuit breaker "${this.name}" transitioning to half-open`);
    }
    
    // Reject immediately if circuit is open
    if (this.state === 'open') {
      throw new CircuitBreakerError(this.name, this.failures, {
        state: this.state,
        lastFailureTime: this.lastFailureTime,
        timeUntilRetry: this.recoveryTimeout - (Date.now() - this.lastFailureTime)
      });
    }
    
    try {
      const result = await fn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }
  
  onSuccess() {
    this.successes++;
    this.lastSuccessTime = Date.now();
    
    // Record successful request
    this.requests.push({
      timestamp: Date.now(),
      success: true
    });
    
    // If in half-open state, close the circuit after successful execution
    if (this.state === 'half-open') {
      this.state = 'closed';
      this.failures = 0;
      console.log(`✅ Circuit breaker "${this.name}" closed after successful recovery`);
    }
    
    this.cleanupOldRequests();
  }
  
  onFailure(error) {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    // Record failed request
    this.requests.push({
      timestamp: Date.now(),
      success: false,
      error: error.message
    });
    
    console.warn(`⚠️ Circuit breaker "${this.name}" failure ${this.failures}/${this.failureThreshold}: ${error.message}`);
    
    // Open circuit if failure threshold exceeded
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      console.error(`🚨 Circuit breaker "${this.name}" opened after ${this.failures} failures`);
    }
    
    this.cleanupOldRequests();
  }
  
  shouldAttemptRecovery() {
    return this.lastFailureTime && 
           (Date.now() - this.lastFailureTime) > this.recoveryTimeout;
  }
  
  cleanupOldRequests() {
    const cutoff = Date.now() - this.monitoringWindow;
    this.requests = this.requests.filter(req => req.timestamp > cutoff);
  }
  
  getStats() {
    this.cleanupOldRequests();
    
    const recentRequests = this.requests.length;
    const recentFailures = this.requests.filter(req => !req.success).length;
    const recentSuccesses = this.requests.filter(req => req.success).length;
    const failureRate = recentRequests > 0 ? (recentFailures / recentRequests) * 100 : 0;
    
    return {
      name: this.name,
      state: this.state,
      totalFailures: this.failures,
      totalSuccesses: this.successes,
      recentRequests,
      recentFailures,
      recentSuccesses,
      failureRate: Math.round(failureRate * 100) / 100,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      failureThreshold: this.failureThreshold,
      isHealthy: this.state === 'closed' && failureRate < 50
    };
  }
  
  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.requests = [];
    console.log(`🔄 Circuit breaker "${this.name}" reset`);
  }
}

// Global circuit breaker registry
const circuitBreakers = new Map();

export function getCircuitBreaker(name, options = {}) {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker({ name, ...options }));
  }
  return circuitBreakers.get(name);
}

export function getAllCircuitBreakers() {
  return Array.from(circuitBreakers.values()).map(cb => cb.getStats());
}

// Enhanced operation wrapper with circuit breaker
export function withCircuitBreaker(fn, breakerName, options = {}) {
  const breaker = getCircuitBreaker(breakerName, options);
  
  return async function circuitBreakerWrapper(...args) {
    return await breaker.execute(fn, ...args);
  };
}