// Simplified Chrome management for testing
import { spawn } from 'child_process';
import WebSocket from 'ws';
import fetch from 'node-fetch';

let chromeProcess = null;

export async function startTestChrome() {
  // Kill any existing Chrome processes
  try {
    const { execSync } = await import('child_process');
    if (process.platform === 'win32') {
      // Windows: Kill Chrome processes with remote debugging
      execSync('taskkill /f /im chrome.exe /fi "COMMANDLINE eq *remote-debugging-port*" 2>nul', { stdio: 'ignore', shell: true });
    } else {
      // Unix-like systems (macOS, Linux)
      execSync('pkill -f "Chrome.*--remote-debugging-port" 2>/dev/null || true', { stdio: 'ignore' });
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    // Ignore cleanup errors
  }

  // Start Chrome with debugging enabled
  const chromePath = process.platform === 'win32' 
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : process.platform === 'darwin'
    ? '/opt/homebrew/bin/google-chrome'
    : 'google-chrome';
  
  chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-web-security',
    '--remote-debugging-port=9222',
    '--disable-features=VizDisplayCompositor',
    '--enable-automation',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    process.platform === 'win32' 
      ? '--user-data-dir=' + require('os').tmpdir() + '\\chrome-test-' + Date.now()
      : '--user-data-dir=/tmp/chrome-test-' + Date.now()
  ], {
    stdio: 'pipe'
  });

  // Wait for Chrome to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Try to connect
  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch('http://localhost:9222/json');
      const targets = await response.json();
      if (targets && targets.length > 0) {
        console.log('✅ Chrome started successfully');
        return { port: 9222 };
      }
    } catch (error) {
      console.log(`🔄 Waiting for Chrome... [${i + 1}/10]`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error('Failed to start Chrome for testing');
}

export async function stopTestChrome() {
  if (chromeProcess) {
    chromeProcess.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!chromeProcess.killed) {
      chromeProcess.kill('SIGKILL');
    }
    chromeProcess = null;
  }

  // Additional cleanup
  try {
    const { execSync } = await import('child_process');
    if (process.platform === 'win32') {
      // Windows: Kill Chrome processes with remote debugging
      execSync('taskkill /f /im chrome.exe /fi "COMMANDLINE eq *remote-debugging-port*" 2>nul', { stdio: 'ignore', shell: true });
    } else {
      // Unix-like systems (macOS, Linux)
      execSync('pkill -f "Chrome.*--remote-debugging-port" 2>/dev/null || true', { stdio: 'ignore' });
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

export async function connectToTestChrome() {
  try {
    const response = await fetch('http://localhost:9222/json');
    const targets = await response.json();
    
    if (!targets || targets.length === 0) {
      throw new Error('No Chrome targets available');
    }

    const wsUrl = targets[0].webSocketDebuggerUrl;
    const ws = new WebSocket(wsUrl);
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);
      
      ws.once('open', () => {
        clearTimeout(timeout);
        resolve(ws);
      });
      
      ws.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  } catch (error) {
    throw new Error(`Failed to connect to Chrome: ${error.message}`);
  }
}