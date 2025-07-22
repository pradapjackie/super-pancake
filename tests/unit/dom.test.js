import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  enableDOM,
  navigateTo,
  querySelector,
  querySelectorAll,
  click,
  type,
  getText,
  getAttribute,
  setAttribute,
  isVisible,
  isEnabled,
  waitForSelector,
  waitForTimeout,
  takeElementScreenshot
} from '../../core/dom.js';
import { SuperPancakeError, ElementNotFoundError, TimeoutError } from '../../core/errors.js';

// Mock the dependencies
vi.mock('../../core/secure-execution.js', () => ({
  executeSecureFunction: vi.fn(),
  resolveNodeSecurely: vi.fn()
}));

vi.mock('../../core/query-cache.js', () => ({
  cachedQuerySelector: vi.fn(),
  invalidateCacheForSelector: vi.fn()
}));

vi.mock('fs', () => ({
  default: {
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn()
  }
}));

vi.mock('path', () => ({
  default: {
    dirname: vi.fn().mockReturnValue('/test/dir')
  }
}));

import { executeSecureFunction } from '../../core/secure-execution.js';
import { cachedQuerySelector, invalidateCacheForSelector } from '../../core/query-cache.js';

describe('DOM Operations', () => {
  let mockSession;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = {
      send: vi.fn()
    };
  });

  describe('enableDOM', () => {
    it('should enable required domains', async () => {
      mockSession.send.mockResolvedValue({});

      await enableDOM(mockSession);

      expect(mockSession.send).toHaveBeenCalledWith('Page.enable');
      expect(mockSession.send).toHaveBeenCalledWith('DOM.enable');
      expect(mockSession.send).toHaveBeenCalledWith('Runtime.enable');
    });

    it('should handle enable failures', async () => {
      mockSession.send.mockRejectedValueOnce(new Error('Enable failed'));

      await expect(enableDOM(mockSession)).rejects.toThrow('Failed to enable DOM');
    });
  });

  describe('navigateTo', () => {
    it('should navigate to URL and wait for load', async () => {
      mockSession.send
        .mockResolvedValueOnce({}) // Page.navigate
        .mockResolvedValueOnce({ result: { value: 'loading' } })
        .mockResolvedValueOnce({ result: { value: 'complete' } });

      await navigateTo(mockSession, 'https://example.com');

      expect(mockSession.send).toHaveBeenCalledWith('Page.navigate', {
        url: 'https://example.com'
      });
    });

    it('should handle navigation failures', async () => {
      mockSession.send.mockRejectedValueOnce(new Error('Navigation failed'));

      await expect(navigateTo(mockSession, 'https://example.com'))
        .rejects.toThrow('Failed to navigate');
    });
  });

  describe('querySelector', () => {
    it('should use cached query selector', async () => {
      const nodeId = 123;
      cachedQuerySelector.mockResolvedValueOnce(nodeId);

      const result = await querySelector(mockSession, '#test');

      expect(result).toBe(nodeId);
      expect(cachedQuerySelector).toHaveBeenCalledWith(mockSession, '#test', true);
    });

    it('should throw ElementNotFoundError when element not found', async () => {
      cachedQuerySelector.mockResolvedValueOnce(null);

      await expect(querySelector(mockSession, '#notfound'))
        .rejects.toThrow('Element not found for selector: "#notfound"');
    });

    it('should support disabling cache', async () => {
      const nodeId = 123;
      cachedQuerySelector.mockResolvedValueOnce(nodeId);

      await querySelector(mockSession, '#test', false);

      expect(cachedQuerySelector).toHaveBeenCalledWith(mockSession, '#test', false);
    });

    it('should handle validation errors', async () => {
      await expect(querySelector(null, '#test'))
        .rejects.toThrow();

      await expect(querySelector(mockSession, ''))
        .rejects.toThrow();
    });
  });

  describe('querySelectorAll', () => {
    it('should return array of node IDs', async () => {
      const nodeIds = [123, 456, 789];
      mockSession.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeIds });

      const result = await querySelectorAll(mockSession, '.test');

      expect(result).toEqual(nodeIds);
    });

    it('should return empty array when no elements found', async () => {
      mockSession.send
        .mockResolvedValueOnce({ root: { nodeId: 1 } })
        .mockResolvedValueOnce({ nodeIds: undefined });

      const result = await querySelectorAll(mockSession, '.notfound');

      expect(result).toEqual([]);
    });
  });

  describe('click', () => {
    it('should click element by selector', async () => {
      const nodeId = 123;
      cachedQuerySelector.mockResolvedValueOnce(nodeId);
      executeSecureFunction.mockResolvedValueOnce({});

      await click(mockSession, '#button');

      expect(cachedQuerySelector).toHaveBeenCalledWith(mockSession, '#button', true);
      expect(executeSecureFunction).toHaveBeenCalledWith(mockSession, nodeId, 'click');
    });

    it('should click element by nodeId', async () => {
      const nodeId = 123;
      executeSecureFunction.mockResolvedValueOnce({});

      await click(mockSession, nodeId);

      expect(executeSecureFunction).toHaveBeenCalledWith(mockSession, nodeId, 'click');
    });

    it('should handle click failures', async () => {
      executeSecureFunction.mockRejectedValueOnce(new Error('Click failed'));

      await expect(click(mockSession, 123))
        .rejects.toThrow(SuperPancakeError);
    });
  });

  describe('type', () => {
    it('should type text into element', async () => {
      const nodeId = 123;
      cachedQuerySelector.mockResolvedValueOnce(nodeId);
      executeSecureFunction.mockResolvedValueOnce({});

      await type(mockSession, '#input', 'hello world');

      expect(executeSecureFunction).toHaveBeenCalledWith(
        mockSession,
        nodeId,
        'setValue',
        ['hello world']
      );
      expect(invalidateCacheForSelector).toHaveBeenCalledWith(mockSession, '#input');
    });

    it('should validate text input', async () => {
      await expect(type(mockSession, '#input', null))
        .rejects.toThrow();
    });
  });

  describe('getText', () => {
    it('should get text content from element', async () => {
      const nodeId = 123;
      executeSecureFunction.mockResolvedValueOnce({
        result: { value: 'Hello World' }
      });

      const result = await getText(mockSession, nodeId);

      expect(result).toBe('Hello World');
      expect(executeSecureFunction).toHaveBeenCalledWith(mockSession, nodeId, 'getText');
    });
  });

  describe('getAttribute', () => {
    it('should get attribute value', async () => {
      const nodeId = 123;
      cachedQuerySelector.mockResolvedValueOnce(nodeId);
      executeSecureFunction.mockResolvedValueOnce({
        result: { value: 'test-value' }
      });

      const result = await getAttribute(mockSession, '#element', 'data-test');

      expect(result).toBe('test-value');
      expect(executeSecureFunction).toHaveBeenCalledWith(
        mockSession,
        nodeId,
        'getAttribute',
        ['data-test']
      );
    });
  });

  describe('setAttribute', () => {
    it('should set attribute value', async () => {
      const nodeId = 123;
      cachedQuerySelector.mockResolvedValueOnce(nodeId);
      executeSecureFunction.mockResolvedValueOnce({});

      await setAttribute(mockSession, '#element', 'data-test', 'new-value');

      expect(executeSecureFunction).toHaveBeenCalledWith(
        mockSession,
        nodeId,
        'setAttribute',
        ['data-test', 'new-value']
      );
    });
  });

  describe('isVisible', () => {
    it('should check element visibility', async () => {
      const nodeId = 123;
      cachedQuerySelector.mockResolvedValueOnce(nodeId);
      executeSecureFunction.mockResolvedValueOnce({
        result: { value: true }
      });

      const result = await isVisible(mockSession, '#element');

      expect(result).toBe(true);
      expect(executeSecureFunction).toHaveBeenCalledWith(mockSession, nodeId, 'isVisible');
    });
  });

  describe('isEnabled', () => {
    it('should check if element is enabled', async () => {
      const nodeId = 123;
      cachedQuerySelector.mockResolvedValueOnce(nodeId);
      executeSecureFunction.mockResolvedValueOnce({
        result: { value: false }
      });

      const result = await isEnabled(mockSession, '#button');

      expect(result).toBe(false);
      expect(executeSecureFunction).toHaveBeenCalledWith(mockSession, nodeId, 'isEnabled');
    });
  });

  describe('waitForSelector', () => {
    it('should wait for element to appear', async () => {
      const nodeId = 123;
      cachedQuerySelector
        .mockRejectedValueOnce(new ElementNotFoundError('#test'))
        .mockRejectedValueOnce(new ElementNotFoundError('#test'))
        .mockResolvedValueOnce(nodeId);

      const result = await waitForSelector(mockSession, '#test', 1000);

      expect(result).toBe(nodeId);
    });

    it('should timeout when element never appears', async () => {
      cachedQuerySelector.mockRejectedValue(new ElementNotFoundError('#test'));

      await expect(waitForSelector(mockSession, '#test', 100))
        .rejects.toThrow(TimeoutError);
    });
  });

  describe('waitForTimeout', () => {
    it('should wait for specified duration', async () => {
      const start = Date.now();
      await waitForTimeout(50);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(40); // Allow some timing variance
    });
  });

  describe('takeElementScreenshot', () => {
    it('should capture element screenshot', async () => {
      const nodeId = 123;
      const mockModel = {
        content: [10, 20],
        width: 100,
        height: 50
      };

      cachedQuerySelector.mockResolvedValueOnce(nodeId);
      mockSession.send
        .mockResolvedValueOnce({ model: mockModel }) // DOM.getBoxModel
        .mockResolvedValueOnce({ data: 'base64data' }); // Page.captureScreenshot

      const result = await takeElementScreenshot(mockSession, '#element', 'test.png');

      expect(result.fileName).toBe('test.png');
      expect(result.isElementScreenshot).toBe(true);
    });

    it('should handle zero-size elements with fallback', async () => {
      const nodeId = 123;
      const mockModel = { content: [0, 0], width: 0, height: 0 };

      cachedQuerySelector.mockResolvedValueOnce(nodeId);
      mockSession.send
        .mockResolvedValueOnce({ model: mockModel })
        .mockResolvedValueOnce({ data: 'fallbackdata' });

      const result = await takeElementScreenshot(mockSession, '#element', 'test.png');

      expect(result.isElementScreenshot).toBe(false);
      expect(result.fileName).toContain('element');
    });
  });

  describe('Error Handling', () => {
    it('should provide detailed error context', async () => {
      cachedQuerySelector.mockRejectedValueOnce(new Error('Network error'));

      try {
        await querySelector(mockSession, '#test');
      } catch (error) {
        expect(error).toBeInstanceOf(SuperPancakeError);
        expect(error.context.selector).toBe('#test');
        expect(error.code).toBe('QUERY_SELECTOR_FAILED');
      }
    });

    it('should validate all input parameters', async () => {
      // Session validation
      await expect(querySelector(null, '#test')).rejects.toThrow();

      // Selector validation
      await expect(querySelector(mockSession, '')).rejects.toThrow();
      await expect(querySelector(mockSession, '<script>')).rejects.toThrow();

      // Timeout validation
      await expect(waitForSelector(mockSession, '#test', -1)).rejects.toThrow();
    });
  });
});
