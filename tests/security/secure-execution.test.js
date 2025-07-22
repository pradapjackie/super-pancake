import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeSecureFunction,
  executeSecurePageFunction,
  createSecureTextInsertion,
  resolveNodeSecurely
} from '../../core/secure-execution.js';
import { SuperPancakeError, SecurityError, ValidationError } from '../../core/errors.js';

describe('Secure Execution', () => {
  let mockSession;

  beforeEach(() => {
    mockSession = {
      send: vi.fn()
    };
  });

  describe('executeSecureFunction', () => {
    it('should execute valid secure function', async () => {
      const nodeId = 123;
      const mockObject = { objectId: 'obj123' };

      mockSession.send
        .mockResolvedValueOnce({ object: mockObject }) // DOM.resolveNode
        .mockResolvedValueOnce({ result: { value: true } }); // Runtime.callFunctionOn

      const result = await executeSecureFunction(mockSession, nodeId, 'click');

      expect(mockSession.send).toHaveBeenCalledWith('DOM.resolveNode', { nodeId });
      expect(mockSession.send).toHaveBeenCalledWith('Runtime.callFunctionOn', {
        objectId: 'obj123',
        functionDeclaration: expect.stringContaining('this.click()'),
        arguments: [],
        returnByValue: true
      });
    });

    it('should execute function with parameters', async () => {
      const nodeId = 123;
      const mockObject = { objectId: 'obj123' };

      mockSession.send
        .mockResolvedValueOnce({ object: mockObject })
        .mockResolvedValueOnce({ result: { value: 'test' } });

      await executeSecureFunction(mockSession, nodeId, 'setValue', ['hello world']);

      expect(mockSession.send).toHaveBeenCalledWith('Runtime.callFunctionOn', {
        objectId: 'obj123',
        functionDeclaration: expect.stringContaining('this.value = value'),
        arguments: [{ value: 'hello world' }],
        returnByValue: true
      });
    });

    it('should throw for invalid session', async () => {
      await expect(executeSecureFunction(null, 123, 'click'))
        .rejects.toThrow(ValidationError);
    });

    it('should throw for invalid nodeId', async () => {
      await expect(executeSecureFunction(mockSession, null, 'click'))
        .rejects.toThrow(SuperPancakeError);
    });

    it('should throw for unknown function', async () => {
      const nodeId = 123;
      const mockObject = { objectId: 'obj123' };

      mockSession.send.mockResolvedValueOnce({ object: mockObject });

      await expect(executeSecureFunction(mockSession, nodeId, 'unknownFunction'))
        .rejects.toThrow('Unknown secure function');
    });

    it('should handle node resolution failure', async () => {
      const nodeId = 123;

      mockSession.send.mockResolvedValueOnce({ object: null });

      await expect(executeSecureFunction(mockSession, nodeId, 'click'))
        .rejects.toThrow(SuperPancakeError);
    });

    it('should handle function execution failure', async () => {
      const nodeId = 123;
      const mockObject = { objectId: 'obj123' };

      mockSession.send
        .mockResolvedValueOnce({ object: mockObject })
        .mockRejectedValueOnce(new Error('Runtime error'));

      await expect(executeSecureFunction(mockSession, nodeId, 'click'))
        .rejects.toThrow(SuperPancakeError);
    });
  });

  describe('executeSecurePageFunction', () => {
    it('should execute page-level function', async () => {
      mockSession.send.mockResolvedValueOnce({
        result: { value: { x: 0, y: 0 } }
      });

      const result = await executeSecurePageFunction(mockSession, 'getScrollPosition');

      expect(mockSession.send).toHaveBeenCalledWith('Runtime.evaluate', {
        expression: expect.stringContaining('window.scrollX'),
        returnByValue: true
      });
    });

    it('should execute with parameters', async () => {
      mockSession.send.mockResolvedValueOnce({
        result: { value: undefined }
      });

      await executeSecurePageFunction(mockSession, 'scrollToTop', []);

      expect(mockSession.send).toHaveBeenCalledWith('Runtime.evaluate', {
        expression: expect.stringContaining('window.scrollTo'),
        returnByValue: true
      });
    });

    it('should throw for unknown page function', async () => {
      await expect(executeSecurePageFunction(mockSession, 'unknownPageFunction'))
        .rejects.toThrow();
    });

    it('should handle execution failure', async () => {
      mockSession.send.mockRejectedValueOnce(new Error('Page error'));

      await expect(executeSecurePageFunction(mockSession, 'getScrollPosition'))
        .rejects.toThrow(SuperPancakeError);
    });
  });

  describe('createSecureTextInsertion', () => {
    it('should create secure text insertion function', () => {
      const result = createSecureTextInsertion('hello world');

      expect(result).toContain('JSON.parse');
      expect(result).toContain('this.value = text');
      expect(result).toContain('dispatchEvent');
    });

    it('should handle special characters', () => {
      const result = createSecureTextInsertion('hello\n"world"');

      expect(result).toContain('JSON.parse');
      // Should be a valid function string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(50);
    });
  });

  describe('resolveNodeSecurely', () => {
    it('should resolve valid node', async () => {
      const nodeId = 123;
      const mockResolved = { object: { objectId: 'obj123' } };

      mockSession.send.mockResolvedValueOnce(mockResolved);

      const result = await resolveNodeSecurely(mockSession, nodeId);

      expect(result).toEqual(mockResolved);
      expect(mockSession.send).toHaveBeenCalledWith('DOM.resolveNode', { nodeId });
    });

    it('should throw for invalid nodeId', async () => {
      await expect(resolveNodeSecurely(mockSession, 'invalid'))
        .rejects.toThrow();

      await expect(resolveNodeSecurely(mockSession, null))
        .rejects.toThrow();
    });

    it('should handle resolution failure', async () => {
      mockSession.send.mockResolvedValueOnce({ object: null });

      await expect(resolveNodeSecurely(mockSession, 123))
        .rejects.toThrow(SuperPancakeError);
    });

    it('should handle session errors', async () => {
      mockSession.send.mockRejectedValueOnce(new Error('Session error'));

      await expect(resolveNodeSecurely(mockSession, 123))
        .rejects.toThrow(SuperPancakeError);
    });
  });

  describe('Security Tests', () => {
    it('should prevent code injection in function names', async () => {
      const nodeId = 123;

      await expect(executeSecureFunction(mockSession, nodeId, 'alert("hack")'))
        .rejects.toThrow();
    });

    it('should safely handle malicious parameters', async () => {
      const nodeId = 123;
      const mockObject = { objectId: 'obj123' };

      mockSession.send
        .mockResolvedValueOnce({ object: mockObject })
        .mockResolvedValueOnce({ result: { value: 'safe' } });

      // Should not execute the script, just pass as safe parameter
      await executeSecureFunction(mockSession, nodeId, 'setValue', ['<script>alert(1)</script>']);

      expect(mockSession.send).toHaveBeenCalledWith('Runtime.callFunctionOn', {
        objectId: 'obj123',
        functionDeclaration: expect.not.stringContaining('alert(1)'),
        arguments: [{ value: '<script>alert(1)</script>' }],
        returnByValue: true
      });
    });
  });
});
