import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    exclude: [
      'node_modules/**',
      'temp-test-simplified/**',
      '**/temp-test-simplified/**',
      'temp-test-simplified/tests/**'
    ],
    testTimeout: 60000,
    hookTimeout: 30000,
    // Force exit after tests complete to prevent hanging
    forceExit: true,
    // Pool configuration for better cleanup
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  }
});