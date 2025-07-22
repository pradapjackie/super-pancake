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

  // Parse results for summary - extract actual test counts from Vitest output
  const testLinePassedSkipped = stdout.match(/Tests\s+(\d+)\s+passed\s+\|\s+(\d+)\s+skipped/);
  const testLinePassedOnly = stdout.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
  const testLineMatch = testLinePassedSkipped || testLinePassedOnly;

  let passed, failed, skipped, broken, total;

  if (testLineMatch) {
    passed = parseInt(testLineMatch[1]) || 0;
    if (testLinePassedSkipped) {
      skipped = parseInt(testLineMatch[2]) || 0;
    } else {
      skipped = 0; // No skipped tests in this format
    }
    failed = 0; // From exit code 0, we know no tests failed
    broken = 0;
    total = passed + failed + skipped + broken;
    console.log(`📊 Parsed test counts: ${passed} passed, ${skipped} skipped, ${total} total`);
  } else {
    // Fallback to old symbol counting method
    passed = (stdout.match(/✓/g) || []).length;
    failed = (stdout.match(/×/g) || []).length;
    skipped = (stdout.match(/↓/g) || []).length;
    broken = (stdout.match(/❗/g) || []).length;
    total = passed + failed + skipped + broken;
    console.log(`📊 Using fallback symbol counting: ${passed} passed, ${skipped} skipped, ${total} total`);
  }

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

  console.log('\n📄 --- Test Summary ---');
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
