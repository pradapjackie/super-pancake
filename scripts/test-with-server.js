#!/usr/bin/env node
// Test runner that automatically starts required servers

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';
import { ensurePortAvailable } from '../utils/port-finder.js';
import { saveHTMLTestReport } from '../utils/html-test-reporter.js';

let testAppServer, uiServer;
let testAppPort, uiServerPort;

async function startServers() {
  console.log('🚀 Starting required servers for testing...\n');
  
  // Find available ports
  console.log('🔍 Finding available ports...');
  testAppPort = await ensurePortAvailable(8080, true);
  uiServerPort = await ensurePortAvailable(3003, true);
  
  // Start test application server
  console.log(`📱 Starting Test Application Server on port ${testAppPort}...`);
  testAppServer = spawn('node', ['scripts/start-test-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, TEST_APP_PORT: testAppPort }
  });
  
  testAppServer.stdout.on('data', data => {
    console.log(`[TEST-APP] ${data.toString().trim()}`);
  });
  
  testAppServer.stderr.on('data', data => {
    console.error(`[TEST-APP-ERROR] ${data.toString().trim()}`);
  });

  // Start UI server for integration tests
  console.log(`🖥️  Starting UI Server on port ${uiServerPort}...`);
  uiServer = spawn('node', ['scripts/test-ui.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PORT: uiServerPort }
  });
  
  uiServer.stdout.on('data', data => {
    const output = data.toString().trim();
    if (output) console.log(`[UI-SERVER] ${output}`);
  });
  
  uiServer.stderr.on('data', data => {
    console.error(`[UI-SERVER-ERROR] ${data.toString().trim()}`);
  });

  // Wait for servers to start
  console.log('⏳ Waiting for servers to initialize...');
  await setTimeout(5000);
  console.log(`✅ Servers ready!`);
  console.log(`   📱 Test App: http://localhost:${testAppPort}`);
  console.log(`   🖥️  UI Server: http://localhost:${uiServerPort}\n`);
}

async function stopServers() {
  console.log('\n🛑 Stopping servers...');
  
  if (testAppServer) {
    testAppServer.kill('SIGINT');
    console.log('✅ Test application server stopped');
  }
  
  if (uiServer) {
    uiServer.kill('SIGINT');
    console.log('✅ UI server stopped');
  }
}

async function runTests() {
  const testType = process.argv[2] || 'all';
  
  console.log(`🧪 Running ${testType} tests with server dependencies...\n`);
  
  return new Promise((resolve) => {
    let testCommand;
    
    switch (testType) {
      case 'integration':
        testCommand = ['vitest', 'run', 'tests/integration/**/*.test.js', '--reporter=verbose'];
        break;
      case 'e2e':
        testCommand = ['vitest', 'run', 'tests/e2e/**/*.test.js', '--reporter=verbose'];
        break;
      case 'all':
        testCommand = ['node', 'scripts/run-all-tests.js'];
        break;
      default:
        testCommand = ['vitest', 'run', `tests/${testType}/**/*.test.js`, '--reporter=verbose'];
    }
    
    const testProcess = spawn('npx', testCommand, {
      stdio: 'inherit',
      env: {
        ...process.env,
        TEST_APP_URL: 'http://localhost:8080',
        UI_SERVER_URL: 'http://localhost:3003'
      }
    });
    
    testProcess.on('exit', (code) => {
      resolve(code);
    });
  });
}

async function main() {
  console.log('🎪 Super Pancake Framework - Test Runner with Servers');
  console.log('='.repeat(60));
  
  try {
    await startServers();
    const exitCode = await runTests();
    await stopServers();
    
    console.log('\n' + '='.repeat(60));
    if (exitCode === 0) {
      console.log('🎉 All tests completed successfully!');
    } else {
      console.log('💥 Some tests failed. Check output above.');
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    await stopServers();
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  await stopServers();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopServers();
  process.exit(0);
});

main();