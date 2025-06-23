import chromeLauncher from 'chrome-launcher';

export async function launchChrome() {
    const chrome = await chromeLauncher.launch({
        chromePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        chromeFlags: [
            '--remote-debugging-port=9222',
            '--disable-gpu',
            '--window-size=1280,800',
            '--disable-infobars'
        ],
        port: 9222,
    });

    console.log(`🚀 Chrome launched at port ${chrome.port}`);
    return chrome;
}