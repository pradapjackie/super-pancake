import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Detect available browsers on the system
 * @returns {Promise<Object>} Available browsers with their paths and versions
 */
export async function detectAvailableBrowsers() {
  const browsers = {
    chrome: null,
    firefox: null
  };

  try {
    browsers.chrome = await detectChrome();
  } catch (error) {
    console.log('🔍 Chrome not detected:', error.message);
  }

  try {
    browsers.firefox = await detectFirefox();
  } catch (error) {
    console.log('🔍 Firefox not detected:', error.message);
  }

  return browsers;
}

/**
 * Detect Chrome installation
 */
async function detectChrome() {
  const platform = process.platform;
  let possiblePaths = [];
  let versionCommand = '';

  if (platform === 'win32') {
    possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    versionCommand = 'chrome --version';
  } else if (platform === 'darwin') {
    possiblePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
    ];
    versionCommand = '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --version';
  } else {
    possiblePaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    versionCommand = 'google-chrome --version || chromium --version';
  }

  // Try to find Chrome in PATH first
  try {
    const result = await execAsync(platform === 'win32' ? 'where chrome' : 'which google-chrome');
    if (result.stdout && result.stdout.trim()) {
      const chromePath = result.stdout.trim().split('\n')[0];
      if (fs.existsSync(chromePath)) {
        const version = await getChromeVersion(chromePath);
        return {
          name: 'Google Chrome',
          path: chromePath,
          version: version,
          detected: true
        };
      }
    }
  } catch (error) {
    // Continue to check common paths
  }

  // Check common installation paths
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      const version = await getChromeVersion(path);
      return {
        name: 'Google Chrome',
        path: path,
        version: version,
        detected: true
      };
    }
  }

  throw new Error('Chrome not found');
}

/**
 * Detect Firefox installation
 */
async function detectFirefox() {
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
      '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox'
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
    if (result.stdout && result.stdout.trim()) {
      const firefoxPath = result.stdout.trim().split('\n')[0];
      if (fs.existsSync(firefoxPath)) {
        const version = await getFirefoxVersion(firefoxPath);
        return {
          name: 'Mozilla Firefox',
          path: firefoxPath,
          version: version,
          detected: true
        };
      }
    }
  } catch (error) {
    // Continue to check common paths
  }

  // Check common installation paths
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      const version = await getFirefoxVersion(path);
      return {
        name: 'Mozilla Firefox',
        path: path,
        version: version,
        detected: true
      };
    }
  }

  throw new Error('Firefox not found');
}

/**
 * Get Chrome version
 */
async function getChromeVersion(chromePath) {
  try {
    const { stdout } = await execAsync(`"${chromePath}" --version`);
    const version = stdout.trim().match(/[\d.]+/);
    return version ? version[0] : 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Get Firefox version
 */
async function getFirefoxVersion(firefoxPath) {
  try {
    const { stdout } = await execAsync(`"${firefoxPath}" --version`);
    const version = stdout.trim().match(/[\d.]+/);
    return version ? version[0] : 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

/**
 * Validate browser support for automation
 * @param {string} browser - Browser name ('chrome' or 'firefox')
 * @returns {Promise<Object>} Validation result
 */
export async function validateBrowserSupport(browser) {
  const browsers = await detectAvailableBrowsers();
  const normalizedBrowser = browser.toLowerCase();

  if (!browsers[normalizedBrowser]) {
    return {
      supported: false,
      message: `${browser} is not installed on this system`,
      suggestions: getSuggestions(normalizedBrowser)
    };
  }

  return {
    supported: true,
    browser: browsers[normalizedBrowser],
    message: `${browsers[normalizedBrowser].name} ${browsers[normalizedBrowser].version} detected`
  };
}

/**
 * Get installation suggestions for browsers
 */
function getSuggestions(browser) {
  const platform = process.platform;
  
  if (browser === 'chrome') {
    if (platform === 'darwin') {
      return [
        'Install Chrome from: https://www.google.com/chrome/',
        'Or use Homebrew: brew install --cask google-chrome'
      ];
    } else if (platform === 'win32') {
      return [
        'Install Chrome from: https://www.google.com/chrome/',
        'Or use Chocolatey: choco install googlechrome'
      ];
    } else {
      return [
        'Install Chrome: sudo apt-get install google-chrome-stable',
        'Or download from: https://www.google.com/chrome/'
      ];
    }
  } else if (browser === 'firefox') {
    if (platform === 'darwin') {
      return [
        'Install Firefox from: https://www.mozilla.org/firefox/',
        'Or use Homebrew: brew install --cask firefox'
      ];
    } else if (platform === 'win32') {
      return [
        'Install Firefox from: https://www.mozilla.org/firefox/',
        'Or use Chocolatey: choco install firefox'
      ];
    } else {
      return [
        'Install Firefox: sudo apt-get install firefox',
        'Or download from: https://www.mozilla.org/firefox/'
      ];
    }
  }

  return [];
}

/**
 * Display browser detection results
 */
export async function displayBrowserStatus() {
  console.log('🔍 Detecting available browsers...\n');
  
  const browsers = await detectAvailableBrowsers();
  
  for (const [browserName, browserInfo] of Object.entries(browsers)) {
    if (browserInfo) {
      console.log(`✅ ${browserInfo.name}`);
      console.log(`   Path: ${browserInfo.path}`);
      console.log(`   Version: ${browserInfo.version}`);
    } else {
      console.log(`❌ ${browserName.charAt(0).toUpperCase() + browserName.slice(1)} - Not detected`);
      const suggestions = getSuggestions(browserName);
      if (suggestions.length > 0) {
        console.log(`   Suggestions:`);
        suggestions.forEach(suggestion => {
          console.log(`   • ${suggestion}`);
        });
      }
    }
    console.log('');
  }
  
  const availableBrowsers = Object.values(browsers).filter(Boolean);
  if (availableBrowsers.length === 0) {
    console.log('⚠️ No supported browsers detected. Please install Chrome or Firefox to continue.');
    return false;
  } else {
    console.log(`🎯 Found ${availableBrowsers.length} supported browser(s)`);
    return true;
  }
}