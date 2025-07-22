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

  const args = ['vitest'];

  // Add execution settings from super-pancake config
  if (vitestSettings.pool) {
    args.push('--pool', vitestSettings.pool);
  }

  if (vitestSettings.poolOptions?.forks?.singleFork) {
    args.push('--poolOptions.forks.singleFork', 'true');
  }

  if (vitestSettings.fileParallelism === false) {
    args.push('--fileParallelism', 'false');
  }

  if (vitestSettings.sequence?.concurrent === false) {
    args.push('--sequence.concurrent', 'false');
  }

  if (vitestSettings.bail) {
    args.push('--bail', vitestSettings.bail.toString());
  }

  if (vitestSettings.retry !== undefined) {
    args.push('--retry', vitestSettings.retry.toString());
  }

  // Add timeout from super-pancake config
  if (timeouts.testTimeout) {
    args.push('--testTimeout', timeouts.testTimeout.toString());
  }

  // Add reporter
  args.push('--reporter', 'verbose');

  // Add any additional args passed to the script
  const additionalArgs = process.argv.slice(2);
  args.push(...additionalArgs);

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
