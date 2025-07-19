import chromeLauncher from 'chrome-launcher';
import { exec } from 'child_process';

/**
 * Launch Chrome in headed or headless mode
 * @param {Object} options
 * @param {boolean} options.headed - If true, launch with visible window
 */
export async function launchChrome({ headed = false } = {}) {
    // Check for environment variable override from UI
    if (process.env.SUPER_PANCAKE_HEADLESS === 'true') {
        headed = false;
        console.log('🔧 Overriding headed mode: Running in headless mode per UI setting');
    } else if (process.env.SUPER_PANCAKE_HEADLESS === 'false') {
        headed = true;
        console.log('🔧 Overriding headless mode: Running in headed mode per UI setting');
    }
    // Try to kill any existing Chrome processes on port 9222
    try {
        if (process.platform === 'win32') {
            // Windows: Simple Chrome process cleanup
            exec('taskkill /f /im chrome.exe 2>nul || echo No chrome processes', { shell: true });
        } else {
            // Unix-like systems (macOS, Linux)
            exec('lsof -ti:9222 | xargs kill -9 2>/dev/null || true');
            exec('pkill -f "Chrome.*--remote-debugging-port=9222" 2>/dev/null || true');
        }
        // Small delay to let processes cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
        // Ignore cleanup errors
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
            '--disable-features=VizDisplayCompositor'
        ],
        port: 9222,
    });

    console.log(`🚀 Chrome launched at port ${chrome.port} in ${headed ? 'headed' : 'headless'} mode`);

    // macOS: bring Chrome window to front
    if (headed && process.platform === 'darwin') {
        exec('osascript -e \'tell application "Google Chrome" to activate\'');
    }

    return chrome;
}