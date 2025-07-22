import chromeLauncher from 'chrome-launcher';
import { exec } from 'child_process';
import fetch from 'node-fetch';
import net from 'net';

/**
 * Launch Chrome in headed or headless mode
 * @param {Object} options
 * @param {boolean} options.headed - If true, launch with visible window
 */
export async function launchChrome({ headed = false, port = null, maxRetries = 3 } = {}) {
  // Check for environment variable override from UI
  if (process.env.SUPER_PANCAKE_HEADLESS === 'true') {
    headed = false;
    console.log('🔧 Overriding headed mode: Running in headless mode per UI setting');
  } else if (process.env.SUPER_PANCAKE_HEADLESS === 'false') {
    headed = true;
    console.log('🔧 Overriding headless mode: Running in headed mode per UI setting');
  }

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 Launching Chrome... [Attempt ${attempt}/${maxRetries}]`);

      // Clean up any existing Chrome processes
      if (port) {
        await cleanupChromeProcesses(port);

        // Verify port is available if specified
        const isPortFree = await checkPortAvailability(port);
        if (!isPortFree) {
          console.log(`⚠️ Port ${port} is still in use after cleanup, trying force cleanup...`);
          await forceCleanupPort(port);

          // Wait a bit more and check again
          await new Promise(resolve => setTimeout(resolve, 1000));
          const isPortFreeNow = await checkPortAvailability(port);
          if (!isPortFreeNow) {
            throw new Error(`Port ${port} is still occupied after force cleanup`);
          }
        }
      } else {
        // When no port specified, do general cleanup
        await cleanupChromeProcesses();
      }

      const chrome = await chromeLauncher.launch({
        chromeFlags: [
          ...(!headed ? ['--headless=new'] : []),
          '--disable-gpu',
          '--window-size=1280,800',
          '--disable-infobars',
          '--no-first-run',
          '--no-default-browser-check',
          '--start-maximized',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--enable-automation',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps'
        ],
        // Let chrome-launcher auto-select port if none specified
        ...(port ? { port: port } : {}),
        ignoreDefaultFlags: false,
        handleSIGINT: true
      });

      // Verify Chrome actually launched and is accessible
      await verifyChromeLaunched(chrome, chrome.port);

      console.log(`✅ Chrome successfully launched at port ${chrome.port} in ${headed ? 'headed' : 'headless'} mode`);

      // macOS: bring Chrome window to front
      if (headed && process.platform === 'darwin') {
        try {
          exec('osascript -e \'tell application "Google Chrome" to activate\'');
        } catch (osError) {
          console.log('⚠️ Could not bring Chrome to front:', osError.message);
        }
      }

      return chrome;

    } catch (error) {
      lastError = error;
      console.log(`❌ Chrome launch attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxRetries) {
        const delay = Math.min(2000 * attempt, 5000); // Progressive delay: 2s, 4s, 5s
        console.log(`⏳ Retrying Chrome launch in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  const finalError = new Error(
    `Failed to launch Chrome after ${maxRetries} attempts. ` +
        `Last error: ${lastError?.message || 'Unknown error'}. ` +
        `Troubleshooting: Ensure Chrome is installed and no other processes are using port ${port}.`
  );
  finalError.originalError = lastError;
  finalError.port = port;
  finalError.attempts = maxRetries;
  throw finalError;
}

async function cleanupChromeProcesses(port) {
  console.log('🧹 Enhanced Chrome process cleanup starting...');

  const startTime = Date.now();
  let cleanupAttempts = 0;
  const maxCleanupAttempts = 3;

  for (let attempt = 1; attempt <= maxCleanupAttempts; attempt++) {
    cleanupAttempts++;
    console.log(`🔧 Cleanup attempt ${attempt}/${maxCleanupAttempts}`);

    try {
      if (process.platform === 'win32') {
        // Enhanced Windows cleanup - ONLY target automation Chrome instances
        console.log('🪟 Windows Chrome cleanup (automation only)...');

        if (port) {
          // Kill specific debugging port processes only
          const netstatResult = await execAsync(`netstat -ano | findstr :${port}`, { ignoreErrors: true });
          if (netstatResult && netstatResult.trim()) {
            console.log(`🔍 Found processes on port ${port}, cleaning up...`);
            // Extract PIDs and kill them
            const lines = netstatResult.split('\n').filter(line => line.includes(':' + port));
            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              if (pid && !isNaN(pid)) {
                await execAsync(`taskkill /f /pid ${pid} 2>nul || echo PID ${pid} not found`);
              }
            }
          }
          console.log(`🎯 Cleaned up Chrome processes on port ${port}`);
        } else {
          // When no port specified, try to find automation-specific processes
          // Use wmic to find processes with automation flags
          await execAsync('wmic process where "CommandLine like \'%--enable-automation%\'" delete 2>nul || echo No automation processes');
          await execAsync('wmic process where "CommandLine like \'%--headless%\'" delete 2>nul || echo No headless processes');
          console.log('🎯 Cleaned up automation-specific Chrome processes');
        }

      } else if (process.platform === 'darwin') {
        // Enhanced macOS cleanup - ONLY target automation Chrome instances
        console.log('🍎 macOS Chrome cleanup (automation only)...');

        if (port) {
          // Kill processes by specific port only
          await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
          console.log(`🎯 Cleaned up Chrome processes on port ${port}`);
        } else {
          // When no port specified, only target automation-specific processes
          // Look for Chrome processes with automation flags
          await execAsync('pkill -f "chrome.*--enable-automation" 2>/dev/null || true');
          await execAsync('pkill -f "chrome.*--headless" 2>/dev/null || true');
          await execAsync('pkill -f "chrome.*--disable-dev-shm-usage" 2>/dev/null || true');
          console.log('🎯 Cleaned up automation-specific Chrome processes');
        }

        // Only kill automation-specific Chrome processes with debugging ports
        if (port) {
          await execAsync(`pkill -f "chrome.*--remote-debugging-port=${port}" 2>/dev/null || true`);
          await execAsync(`pkill -f "Chromium.*--remote-debugging-port=${port}" 2>/dev/null || true`);
        }

        // DO NOT force quit the Chrome application - user may have other tabs open

      } else {
        // Enhanced Linux cleanup - ONLY target automation Chrome instances
        console.log('🐧 Linux Chrome cleanup (automation only)...');

        if (port) {
          // Kill processes by specific port only
          await execAsync(`fuser -k ${port}/tcp 2>/dev/null || true`);
          await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
          console.log(`🎯 Cleaned up Chrome processes on port ${port}`);
        } else {
          // When no port specified, only target automation-specific processes
          await execAsync('pkill -f "chrome.*--enable-automation" 2>/dev/null || true');
          await execAsync('pkill -f "chrome.*--headless" 2>/dev/null || true');
          await execAsync('pkill -f "chrome.*--disable-dev-shm-usage" 2>/dev/null || true');
          console.log('🎯 Cleaned up automation-specific Chrome processes');
        }
      }

      // Verify cleanup by checking port availability
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for processes to die
      const isPortFree = await checkPortAvailability(port);

      if (isPortFree) {
        const elapsed = Date.now() - startTime;
        console.log(`✅ Chrome cleanup successful in ${elapsed}ms (${cleanupAttempts} attempts)`);
        return;
      } else {
        console.log(`⚠️ Port ${port} still occupied after cleanup attempt ${attempt}`);
        if (attempt < maxCleanupAttempts) {
          console.log('⏳ Waiting before next cleanup attempt...');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Progressive delay
        }
      }

    } catch (error) {
      console.log(`❌ Cleanup attempt ${attempt} encountered error: ${error.message}`);
      if (attempt < maxCleanupAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Final verification
  const finalPortCheck = await checkPortAvailability(port);
  const totalElapsed = Date.now() - startTime;

  if (!finalPortCheck) {
    console.log(`⚠️ Warning: Port ${port} may still be in use after ${totalElapsed}ms cleanup`);
    console.log('🔧 Will attempt force cleanup in launch process...');
  } else {
    console.log(`✅ Final verification: Port ${port} is now available after ${totalElapsed}ms`);
  }
}

async function checkPortAvailability(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });

    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
}

async function forceCleanupPort(port) {
  console.log(`🔧 Force cleaning up port ${port}...`);

  try {
    if (process.platform === 'win32') {
      await execAsync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /f /pid %a 2>nul`);
    } else {
      await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
    }
  } catch (error) {
    console.log(`⚠️ Force cleanup failed: ${error.message}`);
  }
}

async function verifyChromeLaunched(chrome, port) {
  console.log('🔍 Verifying Chrome launch...');

  // Give Chrome time to fully start - increased wait time
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Try multiple verification attempts
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔍 Verification attempt ${attempt}/${maxAttempts} for port ${port}`);

      const response = await fetch(`http://127.0.0.1:${port}/json/version`, {
        timeout: 5000
      });

      if (!response.ok) {
        throw new Error(`Chrome health check failed: ${response.status}`);
      }

      const version = await response.json();
      console.log(`🎯 Chrome verification successful: ${version.Browser || 'Unknown version'}`);
      return; // Success, exit

    } catch (error) {
      console.log(`⚠️ Verification attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxAttempts) {
        console.log('⏳ Retrying verification in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw new Error(`Chrome launch verification failed after ${maxAttempts} attempts: ${error.message}`);
      }
    }
  }
}

function execAsync(command, options = {}) {
  return new Promise((resolve, reject) => {
    const execOptions = {
      timeout: options.timeout || 5000,
      encoding: 'utf8'
    };

    exec(command, execOptions, (error, stdout, stderr) => {
      if (error && error.code !== 1 && !options.ignoreErrors) {
        // Ignore exit code 1 (no matches found) or if ignoreErrors is true
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}
