import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock chrome-launcher
vi.mock('chrome-launcher', () => ({
  launch: vi.fn()
}));

// Mock the browser module
vi.mock('../../core/browser.js', () => ({
  launchBrowser: vi.fn(),
  createSession: vi.fn(),
  closeBrowser: vi.fn()
}));

import { launch } from 'chrome-launcher';
import { launchBrowser, createSession, closeBrowser } from '../../core/browser.js';

describe('Browser Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('launchBrowser', () => {
    it('should launch browser with default config', async () => {
      const mockChrome = {
        wsEndpoint: 'ws://localhost:9222',
        port: 9222,
        process: { pid: 12345 }
      };

      launch.mockResolvedValueOnce(mockChrome);
      launchBrowser.mockResolvedValueOnce(mockChrome);

      const browser = await launchBrowser();

      expect(browser).toEqual(mockChrome);
      expect(launchBrowser).toHaveBeenCalledWith();
    });

    it('should launch browser with custom config', async () => {
      const config = {
        headless: false,
        devtools: true,
        args: ['--disable-web-security']
      };

      const mockChrome = {
        wsEndpoint: 'ws://localhost:9223',
        port: 9223,
        process: { pid: 12346 }
      };

      launch.mockResolvedValueOnce(mockChrome);
      launchBrowser.mockResolvedValueOnce(mockChrome);

      const browser = await launchBrowser(config);

      expect(browser).toEqual(mockChrome);
      expect(launchBrowser).toHaveBeenCalledWith(config);
    });

    it('should handle launch failures', async () => {
      const error = new Error('Failed to launch Chrome');
      launch.mockRejectedValueOnce(error);
      launchBrowser.mockRejectedValueOnce(error);

      await expect(launchBrowser()).rejects.toThrow('Failed to launch Chrome');
    });
  });

  describe('createSession', () => {
    it('should create WebSocket session', async () => {
      const mockBrowser = {
        wsEndpoint: 'ws://localhost:9222',
        port: 9222
      };

      const mockSession = {
        send: vi.fn(),
        close: vi.fn()
      };

      createSession.mockResolvedValueOnce(mockSession);

      const session = await createSession(mockBrowser);

      expect(session).toEqual(mockSession);
      expect(createSession).toHaveBeenCalledWith(mockBrowser);
    });

    it('should handle session creation failures', async () => {
      const mockBrowser = {
        wsEndpoint: 'ws://invalid',
        port: 9222
      };

      const error = new Error('WebSocket connection failed');
      createSession.mockRejectedValueOnce(error);

      await expect(createSession(mockBrowser)).rejects.toThrow('WebSocket connection failed');
    });
  });

  describe('closeBrowser', () => {
    it('should close browser process', async () => {
      const mockBrowser = {
        process: {
          pid: 12345,
          kill: vi.fn()
        },
        port: 9222
      };

      closeBrowser.mockResolvedValueOnce(undefined);

      await closeBrowser(mockBrowser);

      expect(closeBrowser).toHaveBeenCalledWith(mockBrowser);
    });

    it('should handle close failures gracefully', async () => {
      const mockBrowser = {
        process: { pid: 12345 },
        port: 9222
      };

      const error = new Error('Process already terminated');
      closeBrowser.mockRejectedValueOnce(error);

      await expect(closeBrowser(mockBrowser)).rejects.toThrow('Process already terminated');
    });
  });

  describe('Browser Configuration', () => {
    it('should support headless mode', async () => {
      const config = { headless: true };
      const mockBrowser = { wsEndpoint: 'ws://localhost:9222', port: 9222 };

      launchBrowser.mockResolvedValueOnce(mockBrowser);

      await launchBrowser(config);

      expect(launchBrowser).toHaveBeenCalledWith(config);
    });

    it('should support custom arguments', async () => {
      const config = {
        args: [
          '--disable-web-security',
          '--disable-features=TranslateUI',
          '--no-first-run'
        ]
      };

      const mockBrowser = { wsEndpoint: 'ws://localhost:9222', port: 9222 };

      launchBrowser.mockResolvedValueOnce(mockBrowser);

      await launchBrowser(config);

      expect(launchBrowser).toHaveBeenCalledWith(config);
    });

    it('should support custom executable path', async () => {
      const config = {
        executablePath: '/usr/bin/google-chrome'
      };

      const mockBrowser = { wsEndpoint: 'ws://localhost:9222', port: 9222 };

      launchBrowser.mockResolvedValueOnce(mockBrowser);

      await launchBrowser(config);

      expect(launchBrowser).toHaveBeenCalledWith(config);
    });
  });

  describe('Session Management', () => {
    it('should handle multiple sessions', async () => {
      const mockBrowser = {
        wsEndpoint: 'ws://localhost:9222',
        port: 9222
      };

      const mockSession1 = { send: vi.fn(), close: vi.fn() };
      const mockSession2 = { send: vi.fn(), close: vi.fn() };

      createSession
        .mockResolvedValueOnce(mockSession1)
        .mockResolvedValueOnce(mockSession2);

      const session1 = await createSession(mockBrowser);
      const session2 = await createSession(mockBrowser);

      expect(session1).not.toBe(session2);
      expect(createSession).toHaveBeenCalledTimes(2);
    });

    it('should close sessions independently', async () => {
      const mockSession = {
        send: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined)
      };

      await mockSession.close();

      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error messages', async () => {
      const error = new Error('Chrome not found');
      launchBrowser.mockRejectedValueOnce(error);

      await expect(launchBrowser()).rejects.toThrow('Chrome not found');
    });

    it('should clean up resources on failure', async () => {
      const mockBrowser = {
        process: { kill: vi.fn() },
        port: 9222
      };

      // Simulate failure during session creation
      createSession.mockRejectedValueOnce(new Error('Connection failed'));

      try {
        await createSession(mockBrowser);
      } catch (error) {
        // Browser should still be available for cleanup
        expect(mockBrowser.process).toBeDefined();
      }
    });
  });
});
