#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Windows compatibility - npx needs .cmd extension on Windows
const isWindows = process.platform === 'win32';
const npxCommand = isWindows ? 'npx.cmd' : 'npx';

const resultsDir = path.resolve('test-report/results');
if (fs.existsSync(resultsDir)) {
  const files = fs.readdirSync(resultsDir);
  for (const file of files) {
    const filePath = path.join(resultsDir, file);
    if (fs.statSync(filePath).isDirectory()) {
      const nestedFiles = fs.readdirSync(filePath);
      for (const nestedFile of nestedFiles) {
        if (nestedFile.endsWith('.json')) {
          fs.unlinkSync(path.join(filePath, nestedFile));
        }
      }
    } else if (file.endsWith('.json')) {
      fs.unlinkSync(filePath);
    }
  }
}

console.log('\n🚀 Starting Vitest run...\n');

const vitest = spawn(npxCommand, ['vitest', 'run'], { 
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: isWindows // Use shell on Windows for better compatibility
});

let stdoutData = '';
let stderrData = '';

vitest.stdout.on('data', (data) => {
  const output = data.toString();
  stdoutData += output;
  process.stdout.write(output);
});

vitest.stderr.on('data', (data) => {
  const output = data.toString();
  stderrData += output;
  process.stderr.write(output);
});

vitest.on('close', (code) => {
  console.log('\n📄 --- Test Summary ---');

  const passed = (stdoutData.match(/✓/g) || []).length;
  const failed = (stdoutData.match(/×/g) || []).length;
  const skipped = (stdoutData.match(/↓/g) || []).length;
  const broken = (stdoutData.match(/❗/g) || []).length;
  const total = passed + failed + skipped + broken;

  const summaryTable = `
┌──────────────┬────────┐
│ Label        │ Count  │
├──────────────┼────────┤
│ 🧪 Total     │ ${String(total).padStart(6)} │
│ ✅  Passed    │ ${String(passed).padStart(6)} │
│ ❌  Failed    │ ${String(failed).padStart(6)} │
│ ⚠️ Skipped   │ ${String(skipped).padStart(6)} │
│ 💥 Broken    │ ${String(broken).padStart(6)} │
│ 🔚 Exit Code │ ${String(code).padStart(6)} │
└──────────────┴────────┘
  `.trim();

  console.log(`\n${summaryTable}\n`);

  if (code !== 0) {
    console.error('💥 Some tests failed.');
  } else {
    console.log('🎉 All tests passed.');
  }

  process.exit(code);
});