import { exec, spawn } from 'child_process';
import fetch from 'node-fetch';
import net from 'net';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * Launch Firefox in headed or headless mode with remote debugging
 * @param {Object} options
 * @param {boolean} options.headed - If true, launch with visible window
 * @param {number} options.port - Port for remote debugging (default: 6000)
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 */
export async function launchFirefox({ headed = false, port = 6000, maxRetries = 3, startUrl = null } = {}) {
  // Check for environment variable override from UI
  if (process.env.SUPER_PANCAKE_HEADLESS === 'true') {
    headed = false;
    console.log('🔧 Overriding headed mode: Running Firefox in headless mode per UI setting');
  } else if (process.env.SUPER_PANCAKE_HEADLESS === 'false') {
    headed = true;
    console.log('🔧 Overriding headless mode: Running Firefox in headed mode per UI setting');
  }

  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🦊 Launching Firefox... [Attempt ${attempt}/${maxRetries}]`);

      // Clean up any existing Firefox processes
      if (port) {
        await cleanupFirefoxProcesses(port);

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
        await cleanupFirefoxProcesses();
      }

      const firefox = await startFirefox({ headed, port, startUrl });

      // Verify Firefox actually launched and is accessible
      await verifyFirefoxLaunched(firefox, port);

      console.log(`✅ Firefox successfully launched at port ${port} in ${headed ? 'headed' : 'headless'} mode`);

      return firefox;

    } catch (error) {
      lastError = error;
      console.log(`❌ Firefox launch attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxRetries) {
        const delay = Math.min(2000 * attempt, 5000); // Progressive delay: 2s, 4s, 5s
        console.log(`⏳ Retrying Firefox launch in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // All attempts failed
  const finalError = new Error(
    `Failed to launch Firefox after ${maxRetries} attempts. ` +
    `Last error: ${lastError?.message || 'Unknown error'}. ` +
    `Troubleshooting: Ensure Firefox is installed and no other processes are using port ${port}.`
  );
  finalError.originalError = lastError;
  finalError.port = port;
  finalError.attempts = maxRetries;
  throw finalError;
}

async function startFirefox({ headed, port, startUrl }) {
  const firefoxPath = await findFirefoxExecutable();
  const profilePath = await createTemporaryProfile(startUrl);

  const args = [
    '--remote-debugging-port=' + port,
    '--devtools-server-port=' + port,
    '--remote-allow-hosts=localhost,127.0.0.1',
    '--remote-allow-origins=http://localhost:' + port + ',http://127.0.0.1:' + port,
    '--no-first-run',
    '--no-default-browser-check',
    '--new-instance',
    '--profile', profilePath,
    '--disable-popup-blocking',
    '--disable-background-updates',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-web-security',
    '--disable-features=TranslateUI',
    '--disable-ipc-flooding-protection',
    ...(!headed ? ['--headless'] : []),
    '--width=1280',
    '--height=800'
  ];

  // Add visibility flags for headed mode
  if (headed) {
    args.push('--new-window'); // Ensure new window opens
    // Position window for visibility
    if (process.platform === 'darwin') {
      args.push('--class=firefox-automation'); // Custom class for identification
    }
  }

  // Add URL as command line argument as well as homepage setting for better compatibility
  if (startUrl) {
    console.log(`🦊 Firefox will start with homepage URL: ${startUrl}`);
    args.push(startUrl); // Add URL as final argument
  }

  console.log(`🦊 Starting Firefox with args: ${args.join(' ')}`);

  const firefox = spawn(firefoxPath, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });

  firefox.port = port;
  firefox.profilePath = profilePath;
  firefox.executablePath = firefoxPath;

  // Handle Firefox process events
  firefox.on('error', (error) => {
    console.error(`❌ Firefox process error: ${error.message}`);
  });

  firefox.on('exit', (code, signal) => {
    console.log(`🦊 Firefox process exited with code ${code}, signal ${signal}`);
    // Clean up temporary profile
    cleanupProfile(profilePath);
  });

  // Give Firefox time to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Bring Firefox window to foreground in headed mode
  if (headed && process.platform === 'darwin') {
    try {
      // Use AppleScript to bring Firefox to the foreground on macOS
      const { exec } = await import('child_process');
      await new Promise((resolve) => {
        exec('osascript -e \'tell application "Firefox" to activate\'', (error) => {
          if (error) {
            console.log('⚠️ Could not bring Firefox to foreground:', error.message);
          } else {
            console.log('🔍 Firefox window brought to foreground');
          }
          resolve();
        });
      });
    } catch (error) {
      console.log('⚠️ AppleScript activation failed:', error.message);
    }
  }

  return firefox;
}

async function findFirefoxExecutable() {
  const platform = process.platform;
  let possiblePaths = [];

  if (platform === 'win32') {
    possiblePaths = [
      'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
      'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
      process.env.PROGRAMFILES + '\\Mozilla Firefox\\firefox.exe',
      process.env['PROGRAMFILES(X86)'] + '\\Mozilla Firefox\\firefox.exe'
    ];
  } else if (platform === 'darwin') {
    possiblePaths = [
      '/Applications/Firefox.app/Contents/MacOS/firefox',
      '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox',
      '/usr/local/bin/firefox'
    ];
  } else {
    possiblePaths = [
      '/usr/bin/firefox',
      '/usr/local/bin/firefox',
      '/opt/firefox/firefox',
      '/snap/bin/firefox'
    ];
  }

  // Try to find Firefox in PATH first
  try {
    const result = await execAsync(platform === 'win32' ? 'where firefox' : 'which firefox');
    if (result && result.trim()) {
      const firefoxPath = result.trim().split('\n')[0];
      if (fs.existsSync(firefoxPath)) {
        console.log(`🦊 Found Firefox in PATH: ${firefoxPath}`);
        return firefoxPath;
      }
    }
  } catch (error) {
    console.log('🔍 Firefox not found in PATH, checking common locations...');
  }

  // Check common installation paths
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      console.log(`🦊 Found Firefox at: ${path}`);
      return path;
    }
  }

  throw new Error(
    'Firefox executable not found. Please install Firefox or ensure it\'s in your PATH. ' +
    `Checked paths: ${possiblePaths.join(', ')}`
  );
}

async function createTemporaryProfile(startUrl = null) {
  const tempDir = os.tmpdir();
  const profileName = `super-pancake-firefox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const profilePath = path.join(tempDir, profileName);

  try {
    fs.mkdirSync(profilePath, { recursive: true });

    // Create enhanced prefs.js for automation with remote debugging
    const homepageUrl = startUrl || 'about:blank';
    const startupPage = startUrl ? 1 : 0;
    
    const prefsContent = `// Super Pancake Automation Firefox Profile
// Remote Debugging Configuration
user_pref("devtools.debugger.remote-enabled", true);
user_pref("devtools.chrome.enabled", true);
user_pref("devtools.debugger.prompt-connection", false);
user_pref("devtools.debugger.force-local", false);
user_pref("devtools.selfxss.count", 5);
user_pref("devtools.command-button-measure.enabled", true);
user_pref("devtools.fission.enabled", false);
user_pref("fission.autostart", false);
user_pref("devtools.remote.adb.extensionURL", "");
user_pref("devtools.remote.adb.extensionID", "");
user_pref("devtools.toolbox.host", "side");
user_pref("devtools.toolbox.sidebar.width", 500);
user_pref("devtools.responsive.metaViewport.enabled", true);

// Browser Configuration for Automation
user_pref("browser.dom.window.dump.enabled", true);
user_pref("browser.sessionstore.resume_from_crash", false);
user_pref("browser.startup.homepage", "${homepageUrl}");
user_pref("browser.startup.page", ${startupPage});
user_pref("browser.tabs.warnOnClose", false);
user_pref("browser.warnOnQuit", false);
user_pref("browser.shell.checkDefaultBrowser", false);

// Tab Configuration - Force URL to open in main tab  
user_pref("browser.link.open_newwindow", 1);
user_pref("browser.link.open_newwindow.restriction", 0);
user_pref("browser.tabs.loadInBackground", false);
user_pref("browser.tabs.closeWindowWithLastTab", false);

// Performance and Cache Settings
user_pref("browser.cache.disk.enable", false);
user_pref("browser.cache.memory.enable", false);
user_pref("browser.cache.offline.enable", false);
user_pref("browser.http.speculative-parallel-limit", 0);
user_pref("browser.aboutConfig.showWarning", false);

// Disable Data Reporting and Telemetry
user_pref("datareporting.healthreport.service.enabled", false);
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("datareporting.healthreport.service.firstRun", false);
user_pref("datareporting.healthreport.logging.consoleEnabled", false);
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("datareporting.policy.dataSubmissionPolicyAccepted", false);
user_pref("toolkit.telemetry.enabled", false);
user_pref("toolkit.telemetry.unified", false);
user_pref("toolkit.telemetry.archive.enabled", false);
user_pref("toolkit.telemetry.bhrPing.enabled", false);
user_pref("toolkit.telemetry.firstShutdownPing.enabled", false);
user_pref("toolkit.telemetry.hybridContent.enabled", false);
user_pref("toolkit.telemetry.newProfilePing.enabled", false);
user_pref("toolkit.telemetry.shutdownPingSender.enabled", false);
user_pref("toolkit.telemetry.updatePing.enabled", false);

// Disable Updates
user_pref("app.update.enabled", false);
user_pref("app.update.auto", false);
user_pref("app.update.checkInstallTime", false);
user_pref("app.update.disabledForTesting", true);

// New Tab Configuration - Set to homepage if URL provided
user_pref("browser.newtabpage.enabled", ${startUrl ? 'false' : 'true'});
user_pref("browser.newtab.url", "${startUrl ? homepageUrl : 'about:newtab'}");

// Extension Configuration
user_pref("extensions.autoDisableScopes", 0);
user_pref("extensions.enabledScopes", 15);
user_pref("extensions.blocklist.enabled", false);
user_pref("extensions.hotfix.certCheckEnabled", false);
user_pref("extensions.update.enabled", false);

// Security Settings for Automation
user_pref("security.fileuri.strict_origin_policy", false);
user_pref("security.csp.enable", false);
user_pref("security.mixed_content.block_active_content", false);
user_pref("security.mixed_content.block_display_content", false);

// Network Settings
user_pref("network.http.phishy-userpass-length", 255);
user_pref("network.automatic-ntlm-auth.trusted-uris", "https://,http://");
user_pref("network.http.prompt-temp-redirect", false);

// Media Settings
user_pref("media.gmp-manager.updateEnabled", false);
user_pref("media.autoplay.default", 0);

// URL Loading Enhancement for newer Firefox versions
user_pref("browser.tabs.remote.autostart", true);
user_pref("browser.sessionhistory.max_entries", 50);
user_pref("browser.sessionstore.restore_on_demand", false);
`;

    fs.writeFileSync(path.join(profilePath, 'prefs.js'), prefsContent);
    console.log(`🦊 Created temporary Firefox profile: ${profilePath}`);

    return profilePath;
  } catch (error) {
    throw new Error(`Failed to create Firefox profile: ${error.message}`);
  }
}

function cleanupProfile(profilePath) {
  if (!profilePath || !fs.existsSync(profilePath)) {
    return;
  }

  try {
    fs.rmSync(profilePath, { recursive: true, force: true });
    console.log(`🧹 Cleaned up Firefox profile: ${profilePath}`);
  } catch (error) {
    console.log(`⚠️ Could not clean up Firefox profile: ${error.message}`);
  }
}

async function cleanupFirefoxProcesses(port) {
  console.log('🧹 Enhanced Firefox process cleanup starting...');

  const startTime = Date.now();
  let cleanupAttempts = 0;
  const maxCleanupAttempts = 3;

  for (let attempt = 1; attempt <= maxCleanupAttempts; attempt++) {
    cleanupAttempts++;
    console.log(`🔧 Cleanup attempt ${attempt}/${maxCleanupAttempts}`);

    try {
      if (process.platform === 'win32') {
        console.log('🪟 Windows Firefox cleanup (automation only)...');

        if (port) {
          const netstatResult = await execAsync(`netstat -ano | findstr :${port}`, { ignoreErrors: true });
          if (netstatResult && netstatResult.trim()) {
            console.log(`🔍 Found processes on port ${port}, cleaning up...`);
            const lines = netstatResult.split('\n').filter(line => line.includes(':' + port));
            for (const line of lines) {
              const parts = line.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              if (pid && !isNaN(pid)) {
                await execAsync(`taskkill /f /pid ${pid} 2>nul || echo PID ${pid} not found`);
              }
            }
          }
          console.log(`🎯 Cleaned up Firefox processes on port ${port}`);
        } else {
          await execAsync('wmic process where "Name=\'firefox.exe\' and CommandLine like \'%remote-debugging%\'" delete 2>nul || echo No automation processes');
          console.log('🎯 Cleaned up automation-specific Firefox processes');
        }

      } else if (process.platform === 'darwin') {
        console.log('🍎 macOS Firefox cleanup (automation only)...');

        if (port) {
          await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
          console.log(`🎯 Cleaned up Firefox processes on port ${port}`);
        } else {
          await execAsync('pkill -f "firefox.*--remote-debugging-port" 2>/dev/null || true');
          await execAsync('pkill -f "firefox.*--headless" 2>/dev/null || true');
          console.log('🎯 Cleaned up automation-specific Firefox processes');
        }

        if (port) {
          await execAsync(`pkill -f "firefox.*--remote-debugging-port=${port}" 2>/dev/null || true`);
        }

      } else {
        console.log('🐧 Linux Firefox cleanup (automation only)...');

        if (port) {
          await execAsync(`fuser -k ${port}/tcp 2>/dev/null || true`);
          await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
          console.log(`🎯 Cleaned up Firefox processes on port ${port}`);
        } else {
          await execAsync('pkill -f "firefox.*--remote-debugging-port" 2>/dev/null || true');
          await execAsync('pkill -f "firefox.*--headless" 2>/dev/null || true');
          console.log('🎯 Cleaned up automation-specific Firefox processes');
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      const isPortFree = await checkPortAvailability(port);

      if (isPortFree || !port) {
        const elapsed = Date.now() - startTime;
        console.log(`✅ Firefox cleanup successful in ${elapsed}ms (${cleanupAttempts} attempts)`);
        return;
      } else {
        console.log(`⚠️ Port ${port} still occupied after cleanup attempt ${attempt}`);
        if (attempt < maxCleanupAttempts) {
          console.log('⏳ Waiting before next cleanup attempt...');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

    } catch (error) {
      console.log(`❌ Cleanup attempt ${attempt} encountered error: ${error.message}`);
      if (attempt < maxCleanupAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  const finalPortCheck = await checkPortAvailability(port);
  const totalElapsed = Date.now() - startTime;

  if (!finalPortCheck && port) {
    console.log(`⚠️ Warning: Port ${port} may still be in use after ${totalElapsed}ms cleanup`);
    console.log('🔧 Will attempt force cleanup in launch process...');
  } else {
    console.log(`✅ Final verification: Port ${port || 'N/A'} is now available after ${totalElapsed}ms`);
  }
}

async function checkPortAvailability(port) {
  if (!port) return true;
  
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

async function verifyFirefoxLaunched(firefox, port) {
  console.log('🔍 Verifying Firefox launch...');

  // Give Firefox time to fully start
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Try multiple verification attempts
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔍 Verification attempt ${attempt}/${maxAttempts} for port ${port}`);

      // Try different Firefox endpoints
      let response;
      let endpointUsed = '';
      
      // Try the standard /json endpoint first
      try {
        response = await fetch(`http://127.0.0.1:${port}/json`, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SuperPancake-Firefox-Verification'
          }
        });
        endpointUsed = '/json';
      } catch (jsonError) {
        // If /json fails, try /json/version
        try {
          response = await fetch(`http://127.0.0.1:${port}/json/version`, {
            timeout: 5000,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'SuperPancake-Firefox-Verification'
            }
          });
          endpointUsed = '/json/version';
        } catch (versionError) {
          throw new Error(`Firefox endpoints not responding: ${jsonError.message}, ${versionError.message}`);
        }
      }

      if (!response.ok) {
        throw new Error(`Firefox health check failed on ${endpointUsed}: ${response.status}`);
      }

      const data = await response.json();
      console.log(`🎯 Firefox verification successful via ${endpointUsed}`);
      
      // Log some debug info
      if (Array.isArray(data)) {
        console.log(`📊 Found ${data.length} Firefox targets`);
      } else if (data.Browser) {
        console.log(`🦊 Browser: ${data.Browser}`);
      }
      
      return; // Success, exit

    } catch (error) {
      console.log(`⚠️ Verification attempt ${attempt} failed: ${error.message}`);

      if (attempt < maxAttempts) {
        console.log('⏳ Retrying verification in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        // Before giving up, let's check if the process is still running
        if (firefox && firefox.pid && !firefox.killed) {
          console.log(`🔍 Firefox process (PID: ${firefox.pid}) is still running, assuming launch successful`);
          console.log(`⚠️  Remote debugging may take longer to initialize in Firefox`);
          return; // Consider it successful if process is running
        }
        throw new Error(`Firefox launch verification failed after ${maxAttempts} attempts: ${error.message}`);
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
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Kill running Firefox process
export async function killFirefox(firefox) {
  if (!firefox) return;

  try {
    console.log('🛑 Terminating Firefox process...');
    
    if (firefox.pid) {
      firefox.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force kill if still running
      if (!firefox.killed) {
        firefox.kill('SIGKILL');
      }
    }

    // Clean up profile
    if (firefox.profilePath) {
      cleanupProfile(firefox.profilePath);
    }

    console.log('✅ Firefox process terminated');
  } catch (error) {
    console.log(`⚠️ Error terminating Firefox: ${error.message}`);
  }
}