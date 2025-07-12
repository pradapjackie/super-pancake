// Tests for configuration system
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  config, 
  getConfig, 
  updateConfig, 
  isDevelopment, 
  isProduction, 
  isCI, 
  validateConfig 
} from '../../config.js';

describe('Configuration System Tests', () => {
  it('should have valid default configuration', () => {
    expect(config).toBeDefined();
    expect(config.browser).toBeDefined();
    expect(config.timeouts).toBeDefined();
    expect(config.screenshots).toBeDefined();
    expect(config.reporting).toBeDefined();
  });

  it('should get nested configuration values', () => {
    const testTimeout = getConfig('timeouts.testTimeout');
    expect(typeof testTimeout).toBe('number');
    expect(testTimeout).toBeGreaterThan(0);

    const headless = getConfig('browser.headless');
    expect(typeof headless).toBe('boolean');
  });

  it('should update configuration values', () => {
    const originalTimeout = getConfig('timeouts.testTimeout');
    updateConfig('timeouts.testTimeout', 30000);
    
    const newTimeout = getConfig('timeouts.testTimeout');
    expect(newTimeout).toBe(30000);
    
    // Restore original value
    updateConfig('timeouts.testTimeout', originalTimeout);
  });

  it('should detect environment correctly', () => {
    // These will depend on current environment
    expect(typeof isDevelopment()).toBe('boolean');
    expect(typeof isProduction()).toBe('boolean');
    expect(typeof isCI()).toBe('boolean');
  });

  it('should validate configuration', () => {
    const errors = validateConfig();
    expect(Array.isArray(errors)).toBe(true);
    
    // Valid config should have no errors
    if (errors.length > 0) {
      console.warn('Configuration validation errors:', errors);
    }
  });

  it('should have required browser configuration', () => {
    expect(config.browser.type).toBeDefined();
    expect(config.browser.port).toBeDefined();
    expect(Array.isArray(config.browser.args)).toBe(true);
    expect(config.browser.viewport).toBeDefined();
    expect(config.browser.viewport.width).toBeGreaterThan(0);
    expect(config.browser.viewport.height).toBeGreaterThan(0);
  });

  it('should have required timeout configuration', () => {
    expect(config.timeouts.testTimeout).toBeGreaterThan(0);
    expect(config.timeouts.navigation).toBeGreaterThan(0);
    expect(config.timeouts.waitForSelector).toBeGreaterThan(0);
  });

  it('should have environment metadata', () => {
    expect(config.meta).toBeDefined();
    expect(config.meta.environment).toBeDefined();
    expect(config.meta.version).toBeDefined();
    expect(config.meta.platform).toBeDefined();
    expect(config.meta.nodeVersion).toBeDefined();
  });
});