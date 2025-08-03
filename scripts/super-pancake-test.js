#!/usr/bin/env node
// Super Pancake Test Runner - Integrates vitest with super-pancake.config.js

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function loadSuperPancakeConfig() {
  try {
    const configPath = path.join(process.cwd(), 'super-pancake.config.js');
    if (fs.existsSync(configPath)) {
      const config = await import(configPath);
      return config.default;
    }
  } catch (error) {
    console.warn('⚠️ Could not load super-pancake.config.js, using defaults');
  }
  return {};
}

async function buildVitestArgs() {
  const config = await loadSuperPancakeConfig();
  const vitestSettings = config.execution?.vitest || {};
  const timeouts = config.timeouts || {};
  const testDir = config.testDir || 'tests';

  const args = ['vitest', 'run'];

  // Essential settings for browser automation
  args.push('--pool', vitestSettings.pool || 'forks');
  args.push('--testTimeout', (timeouts.testTimeout || 60000).toString());
  args.push('--hookTimeout', (timeouts.navigationTimeout || 30000).toString());
  
  if (vitestSettings.bail) {
    args.push('--bail', vitestSettings.bail.toString());
  }

  // Reporter
  const reporterConfig = config.reporter || {};
  if (reporterConfig.console?.verbose) {
    args.push('--reporter', 'verbose');
  }

  // Test files - either from additional args or default pattern
  const additionalArgs = process.argv.slice(2);
  if (additionalArgs.length > 0) {
    // Use provided test files/patterns
    args.push(...additionalArgs);
  } else {
    // Default to all test files
    args.push(`${testDir}/**/*.test.js`);
  }

  return args;
}

async function runTests() {
  console.log('🥞 Super Pancake Test Runner');

  const args = await buildVitestArgs();

  // Show configuration being used
  const config = await loadSuperPancakeConfig();
  if (config.execution?.sequential) {
    console.log('⚡ Sequential execution enabled');
  }

  console.log(`🏃 Running: npx ${args.join(' ')}`);
  console.log('─'.repeat(50));

  const child = spawn('npx', args, {
    stdio: 'inherit',
    shell: true
  });

  child.on('exit', (code) => {
    process.exit(code);
  });

  child.on('error', (error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
