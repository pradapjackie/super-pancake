#!/usr/bin/env node

// Test the setup command with predefined answers
import { spawn } from 'child_process';

const answers = [
  'test-project',           // Project name
  'Jose Test',              // Author name
  'y',                      // Headless mode
  '100',                    // Slow motion
  'y',                      // DevTools
  'y',                      // Screenshots
  'y',                      // Screenshot on failure
  './screenshots',          // Screenshot path
  'y',                      // HTML report
  './test-report.html',     // Report path
  'y',                      // Auto-open report
  '30000',                  // Timeout
  '1',                      // Retries
  'y',                      // Parallel
  'y',                      // Video recording
  'y',                      // Network logs
  'y',                      // Console logs
  ''                        // Final newline
];

console.log('🧪 Testing setup command...');

const child = spawn('node', ['bin/setup.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let currentAnswer = 0;

child.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // Send next answer when prompted
  if (output.includes(':') && currentAnswer < answers.length) {
    setTimeout(() => {
      child.stdin.write(answers[currentAnswer] + '\n');
      currentAnswer++;
    }, 100);
  }
});

child.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

child.on('close', (code) => {
  console.log(`\n🏁 Setup command finished with code ${code}`);
  
  if (code === 0) {
    console.log('✅ Setup completed successfully!');
    console.log('📁 Check the test-project directory for generated files');
  } else {
    console.log('❌ Setup failed');
  }
});