import js from '@eslint/js';
import nodePlugin from 'eslint-plugin-n';
import importPlugin from 'eslint-plugin-import';

export default [
  // Apply to all JavaScript files
  {
    files: ['**/*.js'],
    plugins: {
      n: nodePlugin,
      import: importPlugin
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortController: 'readonly',
        fetch: 'readonly',
        require: 'readonly',
        // Browser globals for testing
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly'
      }
    },
    rules: {
      // Extend recommended JavaScript rules
      ...js.configs.recommended.rules,

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
      'eol-last': 'error',

      // Node.js specific rules
      'n/no-missing-import': 'off', // Disable for now due to ES modules complexity
      'n/no-unpublished-import': 'off', // Allow devDependencies in tests
      'n/no-process-exit': 'off', // Allow process.exit in CLI scripts

      // Import/Export rules
      'import/no-unresolved': 'off', // Let Node.js handle module resolution
      'import/no-unused-modules': 'off' // Disable for now, can be enabled later
    }
  },

  // Special configuration for test files
  {
    files: ['tests/**/*.js', '**/*.test.js', '**/test-*.js'],
    languageOptions: {
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
      }
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
      'n/no-process-exit': 'off', // Allow process.exit in CLI scripts
      'no-console': 'off' // Allow console output in CLI tools
    }
  },

  // Ignore certain directories
  {
    ignores: [
      'node_modules/',
      'temp-test-*/',
      'test-app/',
      'public/',
      'screenshots/',
      'test-report/',
      'coverage/',
      '*.min.js'
    ]
  }
];
