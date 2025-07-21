// Placeholder test to prevent "no test files found" error in CI
// This test always passes and serves as a placeholder when other e2e tests are disabled

import { describe, it, expect } from 'vitest';

describe('E2E Placeholder', () => {
  it('should always pass as a placeholder', () => {
    // This test ensures the e2e test suite doesn't fail with "no files found"
    // when ui-workflow.test.js is disabled during CI/publishing
    expect(true).toBe(true);
  });
});