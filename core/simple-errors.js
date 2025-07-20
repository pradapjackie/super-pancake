// Simple error handling for Super Pancake Framework

export class SuperPancakeError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', context = {}) {
    super(message);
    this.name = 'SuperPancakeError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

export class SessionError extends SuperPancakeError {
  constructor(message, context = {}) {
    super(message, 'SESSION_ERROR', context);
    this.name = 'SessionError';
  }
}

export class StackTraceError extends SuperPancakeError {
  constructor(originalError, operation, context = {}) {
    const message = `STACK_TRACE_ERROR in ${operation}: ${originalError?.message || 'Unknown error'}`;
    super(message, 'STACK_TRACE_ERROR', { originalError: originalError?.message, operation, ...context });
    this.name = 'StackTraceError';
  }
}

// Simple error recovery wrapper
export function withErrorRecovery(fn, operation) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Prevent STACK_TRACE_ERROR by wrapping the error
      if (error.name === 'STACK_TRACE_ERROR' || !error.message || error.message.trim() === '') {
        throw new StackTraceError(error, operation);
      }
      
      // Re-throw with context
      if (error instanceof SuperPancakeError) {
        throw error;
      }
      
      throw new SuperPancakeError(error.message, 'WRAPPED_ERROR', { 
        originalError: error.constructor.name,
        operation 
      });
    }
  };
}

// Simple retry mechanism
export function withRetry(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 1000, operation = 'unknown' } = options;
  
  return async (...args) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retry ${attempt}/${maxRetries} for ${operation} in ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new SuperPancakeError(
      `Operation ${operation} failed after ${maxRetries} attempts: ${lastError.message}`,
      'RETRY_EXHAUSTED',
      { attempts: maxRetries, lastError: lastError.message }
    );
  };
}