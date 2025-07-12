// Tests for error handling and configuration issues
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Error Handling Tests', () => {
  it('should handle configuration errors gracefully', async () => {
    // Create a test file with broken config
    const brokenTestContent = `
import { describe, it } from 'vitest';
import { config } from '../config.js';

describe('Broken Config Test', () => {
  it('should fail with config error', { timeout: config.nonexistent.timeout }, async () => {
    // This should fail due to config error
  });
});`;

    const testFile = 'tests/broken-config.test.js';
    fs.writeFileSync(testFile, brokenTestContent);

    try {
      // Run the broken test
      const { stdout, stderr } = await execAsync(`npx vitest run ${testFile} --reporter=json --outputFile=broken-results.json`);
      
      // Should fail but produce JSON output
      expect(fs.existsSync('broken-results.json')).toBe(true);
      
      const results = JSON.parse(fs.readFileSync('broken-results.json', 'utf-8'));
      expect(results.numTotalTests).toBe(0); // Config error prevents test discovery
      expect(results.success).toBe(false);
      
    } catch (error) {
      // This is expected - the test should fail
      expect(error.code).toBe(1);
    } finally {
      // Cleanup
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
      if (fs.existsSync('broken-results.json')) fs.unlinkSync('broken-results.json');
    }
  });

  it('should handle missing imports', async () => {
    const brokenImportTest = `
import { describe, it } from 'vitest';
import { nonExistentFunction } from '../non-existent-module.js';

describe('Broken Import Test', () => {
  it('should fail with import error', async () => {
    nonExistentFunction();
  });
});`;

    const testFile = 'tests/broken-import.test.js';
    fs.writeFileSync(testFile, brokenImportTest);

    try {
      await execAsync(`npx vitest run ${testFile} --reporter=json`);
    } catch (error) {
      expect(error.stderr || error.stdout || error.message).toContain('import');
    } finally {
      if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    }
  });
});