// Simple Chrome launcher for Super Pancake Framework
import { spawn } from 'child_process';
import { platform } from 'os';
import { existsSync, rmSync } from 'fs';
import { withErrorRecovery } from '../core/simple-errors.js';

export const launchChrome = withErrorRecovery(async (options = {}) => {
  const {
    headed = false,
    port = 9222,
    maxRetries = 3,
    timeout = 30000,
    userDataDir = null,
    args = []
  } = options;

  console.log(`🚀 Launching Chrome on port ${port} (headed: ${headed})`);

  // Clean up any existing Chrome user data directory to prevent singleton lock issues
  const userDataPath = userDataDir || '/tmp/chrome-automation-test';
  if (existsSync(userDataPath)) {
    try {
      rmSync(userDataPath, { recursive: true, force: true });
      console.log('🧹 Cleaned up existing Chrome user data directory');
    } catch (error) {
      console.warn('⚠️ Warning: Could not clean up Chrome user data:', error.message);
    }
  }

  // Basic Chrome arguments - focused on avoiding profile selection
  const chromeArgs = [
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--enable-automation',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-extensions',
    '--disable-default-apps',
    '--disable-sync',
    '--disable-translate',
    '--disable-background-networking',
    `--user-data-dir=${userDataPath}`,
    '--profile-directory=Default',
    '--force-first-run-ui=false',
    '--disable-background-mode',
    '--disable-extensions-file-access-check',
    '--disable-extensions-http-throttling',
    '--disable-component-extensions-with-background-pages',
    ...args
  ];

  if (!headed) {
    chromeArgs.push('--headless');
  }

  if (userDataDir) {
    chromeArgs.push(`--user-data-dir=${userDataDir}`);
  }

  // Find Chrome executable
  const chromePaths = getChromePaths();
  let chromePath = null;

  for (const path of chromePaths) {
    try {
      // Simple check if path exists (we'll improve this later)
      chromePath = path;
      break;
    } catch (error) {
      continue;
    }
  }

  if (!chromePath) {
    throw new Error('Chrome not found. Please install Chrome or set CHROME_PATH environment variable.');
  }

  // Launch Chrome
  const chrome = spawn(chromePath, chromeArgs, {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Handle Chrome process events
  chrome.on('error', (error) => {
    console.error('❌ Chrome spawn error:', error.message);
  });

  chrome.on('exit', (code, signal) => {
    console.log(`🔒 Chrome exited with code ${code} and signal ${signal}`);
  });

  // Capture Chrome output for debugging
  chrome.stdout.on('data', (data) => {
    console.log('Chrome stdout:', data.toString());
  });

  chrome.stderr.on('data', (data) => {
    console.error('Chrome stderr:', data.toString());
  });

  // Give Chrome time to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(`✅ Chrome launched successfully (PID: ${chrome.pid})`);

  return {
    process: chrome,
    port,
    pid: chrome.pid,
    kill: async () => {
      try {
        chrome.kill();
        console.log('🔒 Chrome process terminated');
      } catch (error) {
        console.warn('⚠️ Warning during Chrome cleanup:', error.message);
      }
    }
  };
}, 'launchChrome');

function getChromePaths() {
  const os = platform();

  switch (os) {
    case 'darwin': // macOS
      return [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chrome.app/Contents/MacOS/Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium'
      ];
    case 'win32': // Windows
      return [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
      ];
    case 'linux': // Linux
      return [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/snap/bin/chromium'
      ];
    default:
      return ['/usr/bin/google-chrome'];
  }
}
