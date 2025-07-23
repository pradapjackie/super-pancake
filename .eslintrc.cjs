module.exports = {
  extends: [
    'standard'
  ],
  env: {
    node: true,
    es2022: true,
    browser: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    // Custom rules for your automation framework
    'no-console': 'off', // Allow console.log for automation logging
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_|reject|error$',
      varsIgnorePattern: '^_|output|errorOutput|stderr|maxRetries|timeout$'
    }],
    'no-empty': ['error', { allowEmptyCatch: true }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'eol-last': 'error'
  },
  overrides: [
    // Special configuration for test files
    {
      files: ['tests/**/*.js', '**/*.test.js', '**/test-*.js'],
      globals: {
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      },
      rules: {
        'no-unused-expressions': 'off', // Allow Chai-style assertions
        'no-console': 'off' // Allow console.log in tests
      }
    },
    // Configuration for CLI scripts
    {
      files: ['bin/**/*.js', 'scripts/**/*.js'],
      rules: {
        'no-console': 'off' // Allow console output in CLI tools
      }
    }
  ],
  ignorePatterns: [
    'node_modules/',
    'temp-test-*/',
    'test-app/',
    'public/',
    'screenshots/',
    'test-report/',
    'coverage/',
    '*.min.js'
  ]
};