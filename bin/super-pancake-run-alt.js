#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Clean previous results
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

try {
  // Use exec instead of spawn for better Windows compatibility
  const { stdout, stderr } = await execAsync('npx vitest run', { 
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  });

  // Output the results
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.error(stderr);
  }

  // Parse results for summary
  const passed = (stdout.match(/✓/g) || []).length;
  const failed = (stdout.match(/×/g) || []).length;
  const skipped = (stdout.match(/↓/g) || []).length;
  const broken = (stdout.match(/❗/g) || []).length;
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
│ 🔚 Exit Code │      0 │
└──────────────┴────────┘
  `.trim();

  console.log(`\n📄 --- Test Summary ---`);
  console.log(`\n${summaryTable}\n`);

  if (failed > 0 || broken > 0) {
    console.error('💥 Some tests failed.');
    process.exit(1);
  } else {
    console.log('🎉 All tests completed successfully.');
    process.exit(0);
  }

} catch (error) {
  console.error('\n❌ Error running tests:');
  console.error(error.message);
  
  if (error.code === 'ENOENT') {
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure Node.js and npm are installed');
    console.error('2. Try running: npm install -g npx');
    console.error('3. Verify vitest is available: npx vitest --version');
    console.error('4. Check if you have test files in your project');
  }
  
  if (error.stdout) {
    console.log('\n📤 Standard Output:');
    console.log(error.stdout);
  }
  
  if (error.stderr) {
    console.error('\n📥 Standard Error:');
    console.error(error.stderr);
  }
  
  process.exit(1);
}