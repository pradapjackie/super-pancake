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

// Error recovery utilities
export function withRetry(fn, maxRetries = 3, delay = 1000) {
  return async function retryWrapper(...args) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        // Don't retry on validation or security errors
        if (error instanceof ValidationError || error instanceof SecurityError) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5; // Exponential backoff
        }
      }
    }
    
    throw new SuperPancakeError(
      `Operation failed after ${maxRetries} attempts: ${lastError.message}`,
      'MAX_RETRIES_EXCEEDED',
      { originalError: lastError, maxRetries }
    );
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