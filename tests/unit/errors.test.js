import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SuperPancakeError,
  ElementNotFoundError,
  TimeoutError,
  ValidationError,
  SessionError,
  SecurityError,
  withRetry,
  validateSession,
  validateSelector,
  validateTimeout,
  validateText,
  validateFilePath,
  sanitizeForExecution
} from '../../core/errors.js';

describe('Error Classes', () => {
  describe('SuperPancakeError', () => {
    it('should create error with default code', () => {
      const error = new SuperPancakeError('Test message');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.context).toEqual({});
      expect(error.timestamp).toBeDefined();
      expect(error.name).toBe('SuperPancakeError');
    });

    it('should create error with custom code and context', () => {
      const context = { selector: '#test' };
      const error = new SuperPancakeError('Test message', 'CUSTOM_CODE', context);
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.context).toEqual(context);
    });

    it('should serialize to JSON correctly', () => {
      const error = new SuperPancakeError('Test', 'CODE', { key: 'value' });
      const json = error.toJSON();
      expect(json.name).toBe('SuperPancakeError');
      expect(json.message).toBe('Test');
      expect(json.code).toBe('CODE');
      expect(json.context).toEqual({ key: 'value' });
      expect(json.timestamp).toBeDefined();
      expect(json.stack).toBeDefined();
    });
  });

  describe('ElementNotFoundError', () => {
    it('should create with selector information', () => {
      const error = new ElementNotFoundError('#test-element');
      expect(error.message).toContain('#test-element');
      expect(error.code).toBe('ELEMENT_NOT_FOUND');
      expect(error.context.selector).toBe('#test-element');
    });

    it('should include additional context', () => {
      const context = { timeout: 5000 };
      const error = new ElementNotFoundError('#test', context);
      expect(error.context.selector).toBe('#test');
      expect(error.context.timeout).toBe(5000);
    });
  });

  describe('TimeoutError', () => {
    it('should create with operation and timeout info', () => {
      const error = new TimeoutError('waitForSelector', 5000);
      expect(error.message).toContain('waitForSelector');
      expect(error.message).toContain('5000ms');
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.context.operation).toBe('waitForSelector');
      expect(error.context.timeout).toBe(5000);
    });
  });

  describe('ValidationError', () => {
    it('should create with parameter validation info', () => {
      const error = new ValidationError('selector', 'string', 123);
      expect(error.message).toContain('selector');
      expect(error.message).toContain('string');
      expect(error.message).toContain('123');
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('SessionError', () => {
    it('should create session-specific error', () => {
      const error = new SessionError('Session closed');
      expect(error.message).toBe('Session closed');
      expect(error.code).toBe('SESSION_ERROR');
    });
  });

  describe('SecurityError', () => {
    it('should create security-specific error', () => {
      const error = new SecurityError('Malicious input detected');
      expect(error.message).toBe('Malicious input detected');
      expect(error.code).toBe('SECURITY_ERROR');
    });
  });
});

describe('Error Recovery', () => {
  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const retryFn = withRetry(mockFn);

      const result = await retryFn('arg1', 'arg2');

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue('success');

      const retryFn = withRetry(mockFn, { maxRetries: 3, delay: 10 });
      const result = await retryFn();

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('persistent failure'));
      const retryFn = withRetry(mockFn, { maxRetries: 2, delay: 10 });

      await expect(retryFn()).rejects.toThrow('Recovery failed for unknown operation after 2 attempts');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry validation errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new ValidationError('param', 'string', 123));
      const retryFn = withRetry(mockFn, { maxRetries: 3, delay: 10 });

      await expect(retryFn()).rejects.toThrow(ValidationError);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should not retry security errors', async () => {
      const mockFn = vi.fn().mockRejectedValue(new SecurityError('Malicious input'));
      const retryFn = withRetry(mockFn, { maxRetries: 3, delay: 10 });

      await expect(retryFn()).rejects.toThrow(SecurityError);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Validation Functions', () => {
  describe('validateSession', () => {
    it('should pass for valid session', () => {
      const session = { send: vi.fn() };
      expect(() => validateSession(session)).not.toThrow();
    });

    it('should throw for null session', () => {
      expect(() => validateSession(null)).toThrow(ValidationError);
    });

    it('should throw for session without send method', () => {
      expect(() => validateSession({})).toThrow(ValidationError);
    });
  });

  describe('validateSelector', () => {
    it('should pass for valid selectors', () => {
      expect(() => validateSelector('#test')).not.toThrow();
      expect(() => validateSelector('.class')).not.toThrow();
      expect(() => validateSelector('div')).not.toThrow();
    });

    it('should throw for empty selector', () => {
      expect(() => validateSelector('')).toThrow(ValidationError);
      expect(() => validateSelector('   ')).toThrow(ValidationError);
    });

    it('should throw for null/undefined selector', () => {
      expect(() => validateSelector(null)).toThrow(ValidationError);
      expect(() => validateSelector(undefined)).toThrow(ValidationError);
    });

    it('should throw for malicious selectors', () => {
      expect(() => validateSelector('<script>')).toThrow(SecurityError);
      expect(() => validateSelector('javascript:')).toThrow(SecurityError);
    });
  });

  describe('validateTimeout', () => {
    it('should pass for valid timeouts', () => {
      expect(() => validateTimeout(1000)).not.toThrow();
      expect(() => validateTimeout(0)).not.toThrow();
      expect(() => validateTimeout(undefined)).not.toThrow();
    });

    it('should throw for invalid timeouts', () => {
      expect(() => validateTimeout(-1)).toThrow(ValidationError);
      expect(() => validateTimeout('1000')).toThrow(ValidationError);
      expect(() => validateTimeout(1.5)).toThrow(ValidationError);
    });
  });

  describe('validateText', () => {
    it('should pass for valid text', () => {
      expect(() => validateText('hello')).not.toThrow();
      expect(() => validateText(123)).not.toThrow();
      expect(() => validateText('')).not.toThrow();
    });

    it('should throw for null/undefined', () => {
      expect(() => validateText(null)).toThrow(ValidationError);
      expect(() => validateText(undefined)).toThrow(ValidationError);
    });

    it('should throw for malicious text', () => {
      expect(() => validateText('<script>alert(1)</script>')).toThrow(SecurityError);
      expect(() => validateText('javascript:alert(1)')).toThrow(SecurityError);
      expect(() => validateText('data:text/html,<script></script>')).toThrow(SecurityError);
    });
  });

  describe('validateFilePath', () => {
    it('should pass for valid file paths', () => {
      expect(() => validateFilePath('/path/to/file.txt')).not.toThrow();
      expect(() => validateFilePath('file.txt')).not.toThrow();
    });

    it('should throw for empty path', () => {
      expect(() => validateFilePath('')).toThrow(ValidationError);
      expect(() => validateFilePath(null)).toThrow(ValidationError);
    });

    it('should throw for directory traversal', () => {
      expect(() => validateFilePath('../../../etc/passwd')).toThrow(SecurityError);
      expect(() => validateFilePath('~/secrets')).toThrow(SecurityError);
    });
  });

  describe('sanitizeForExecution', () => {
    it('should escape special characters in strings', () => {
      expect(sanitizeForExecution('hello\nworld')).toBe('hello\\nworld');
      expect(sanitizeForExecution('say "hello"')).toBe('say \\"hello\\"');
      expect(sanitizeForExecution("it's working")).toBe("it\\'s working");
      expect(sanitizeForExecution('back\\slash')).toBe('back\\\\slash');
    });

    it('should return non-strings unchanged', () => {
      expect(sanitizeForExecution(123)).toBe(123);
      expect(sanitizeForExecution(true)).toBe(true);
      expect(sanitizeForExecution(null)).toBe(null);
    });
  });
});
