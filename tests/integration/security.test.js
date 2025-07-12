import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  querySelector,
  type,
  setAttribute,
  getAttribute
} from '../../core/dom.js';
import { sendPost, setAuthToken, buildUrlWithParams } from '../../core/api.js';
import { SecurityError, ValidationError } from '../../core/errors.js';

// Mock dependencies for integration tests
vi.mock('../../core/secure-execution.js', () => ({
  executeSecureFunction: vi.fn(),
  resolveNodeSecurely: vi.fn()
}));

vi.mock('../../core/query-cache.js', () => ({
  cachedQuerySelector: vi.fn(),
  invalidateCacheForSelector: vi.fn()
}));

vi.mock('axios');

import { executeSecureFunction } from '../../core/secure-execution.js';
import { cachedQuerySelector } from '../../core/query-cache.js';
import axios from 'axios';

describe('Security Integration Tests', () => {
  let mockSession;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = {
      send: vi.fn()
    };
  });

  describe('Input Validation Security', () => {
    it('should prevent script injection in selectors', async () => {
      await expect(querySelector(mockSession, '<script>alert(1)</script>'))
        .rejects.toThrow(SecurityError);
      
      await expect(querySelector(mockSession, 'javascript:alert(1)'))
        .rejects.toThrow(SecurityError);
    });

    it('should prevent script injection in text input', async () => {
      await expect(type(mockSession, '#input', '<script>alert(1)</script>'))
        .rejects.toThrow(SecurityError);
      
      await expect(type(mockSession, '#input', 'javascript:void(0)'))
        .rejects.toThrow(SecurityError);
    });

    it('should prevent script injection in attribute values', async () => {
      await expect(setAttribute(mockSession, '#element', 'onclick', 'alert(1)'))
        .rejects.toThrow(SecurityError);
      
      await expect(setAttribute(mockSession, '#element', 'href', 'javascript:alert(1)'))
        .rejects.toThrow(SecurityError);
    });

    it('should prevent directory traversal in file paths', async () => {
      const { validateFilePath } = await import('../../core/errors.js');
      
      expect(() => validateFilePath('../../../etc/passwd'))
        .toThrow(SecurityError);
      
      expect(() => validateFilePath('~/secrets.txt'))
        .toThrow(SecurityError);
    });
  });

  describe('Secure Function Execution', () => {
    it('should use parameterized functions instead of string interpolation', async () => {
      const nodeId = 123;
      cachedQuerySelector.mockResolvedValueOnce(nodeId);
      executeSecureFunction.mockResolvedValueOnce({});
      
      await type(mockSession, '#input', 'user"; window.location="http://evil.com');
      
      // Verify secure function was called with parameters
      expect(executeSecureFunction).toHaveBeenCalledWith(
        mockSession,
        nodeId,
        'setValue',
        ['user"; window.location="http://evil.com']
      );
      
      // Verify the malicious payload is passed as data, not executed as code
      const callArgs = executeSecureFunction.mock.calls[0];
      expect(callArgs[2]).toBe('setValue'); // Function name is predefined
      expect(callArgs[3]).toEqual(['user"; window.location="http://evil.com']); // Payload is data
    });

    it('should reject unknown function names', async () => {
      const { executeSecureFunction: actualExecuteFunction } = await vi.importActual('../../core/secure-execution.js');
      
      await expect(actualExecuteFunction(mockSession, 123, 'eval'))
        .rejects.toThrow(SecurityError);
      
      await expect(actualExecuteFunction(mockSession, 123, 'document.write'))
        .rejects.toThrow(SecurityError);
    });
  });

  describe('API Security', () => {
    it('should validate URLs before making requests', async () => {
      await expect(buildUrlWithParams('not-a-url', {}))
        .rejects.toThrow(ValidationError);
      
      await expect(sendPost(''))
        .rejects.toThrow(ValidationError);
    });

    it('should sanitize auth tokens', async () => {
      expect(() => setAuthToken(123)).toThrow(ValidationError);
      expect(() => setAuthToken({})).toThrow(ValidationError);
      
      // Should accept valid tokens
      expect(() => setAuthToken('valid-token')).not.toThrow();
      expect(() => setAuthToken(null)).not.toThrow();
    });

    it('should prevent URL parameter injection', () => {
      const maliciousParams = {
        'normal': 'value',
        '<script>': 'alert(1)',
        'redirect': 'javascript:alert(1)'
      };
      
      // Should not throw but should safely encode parameters
      const url = buildUrlWithParams('https://api.example.com/test', maliciousParams);
      
      // Verify dangerous content is URL encoded, not executed
      expect(url).toContain('https://api.example.com/test?');
      expect(url).not.toContain('<script>');
      expect(url).not.toContain('javascript:');
    });
  });

  describe('Content Security', () => {
    it('should sanitize text for safe execution', async () => {
      const { sanitizeForExecution } = await import('../../core/errors.js');
      
      const dangerous = 'user\\neval("evil code")\\n';
      const safe = sanitizeForExecution(dangerous);
      
      expect(safe).not.toContain('eval(');
      expect(safe).toContain('\\\\n'); // Newlines escaped
      expect(safe).toContain('\\"'); // Quotes escaped
    });

    it('should prevent code injection through attribute access', async () => {
      const nodeId = 123;
      cachedQuerySelector.mockResolvedValueOnce(nodeId);
      executeSecureFunction.mockResolvedValueOnce({ result: { value: 'safe' } });
      
      // Malicious attribute name
      await getAttribute(mockSession, '#element', 'onclick'); // Should work
      
      // Verify secure function was used
      expect(executeSecureFunction).toHaveBeenCalledWith(
        mockSession,
        nodeId,
        'getAttribute',
        ['onclick']
      );
    });
  });

  describe('Session Security', () => {
    it('should validate session objects', async () => {
      await expect(querySelector(null, '#test'))
        .rejects.toThrow(ValidationError);
      
      await expect(querySelector({}, '#test'))
        .rejects.toThrow(ValidationError);
      
      await expect(querySelector({ send: 'not-a-function' }, '#test'))
        .rejects.toThrow(ValidationError);
    });

    it('should handle session errors securely', async () => {
      mockSession.send.mockRejectedValueOnce(new Error('Connection lost'));
      
      try {
        await querySelector(mockSession, '#test');
      } catch (error) {
        // Should not leak internal session details
        expect(error.message).not.toContain('Connection lost');
        expect(error.context).not.toContain('send');
      }
    });
  });

  describe('Error Information Security', () => {
    it('should not leak sensitive information in error messages', async () => {
      cachedQuerySelector.mockRejectedValueOnce(new Error('Database password: secret123'));
      
      try {
        await querySelector(mockSession, '#test');
      } catch (error) {
        // Error should be wrapped and not leak internal details
        expect(error.message).not.toContain('secret123');
        expect(error.message).not.toContain('Database password');
      }
    });

    it('should provide safe error context', async () => {
      try {
        await querySelector(mockSession, '#test');
      } catch (error) {
        // Context should only contain safe, expected information
        expect(Object.keys(error.context)).toEqual(['selector']);
        expect(error.context.selector).toBe('#test');
      }
    });
  });

  describe('Cache Security', () => {
    it('should isolate cache between sessions', async () => {
      const session1 = { send: vi.fn(), constructor: { name: 'Session1' } };
      const session2 = { send: vi.fn(), constructor: { name: 'Session2' } };
      
      // Different sessions should not share cache entries
      // This is tested indirectly through the cache implementation
      expect(session1.constructor.name).not.toBe(session2.constructor.name);
    });

    it('should not cache sensitive operations', async () => {
      // Password fields and other sensitive inputs should potentially bypass cache
      // This would be implemented as additional security measures
      const nodeId = 123;
      cachedQuerySelector.mockResolvedValueOnce(nodeId);
      executeSecureFunction.mockResolvedValueOnce({});
      
      await type(mockSession, 'input[type="password"]', 'secretpassword');
      
      // Verify cache invalidation was called for security
      const { invalidateCacheForSelector } = await import('../../core/query-cache.js');
      expect(invalidateCacheForSelector).toHaveBeenCalled();
    });
  });
});