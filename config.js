// config.js
export const config = {
    browser: {
        type: 'chrome', // 'chrome' or 'firefox'
        headless: true,
        port: 9222,
    },
    test: {
        timeout: 20000, // 20 seconds
    },
    timeouts: {
        waitForSelector: 5000,
        reload: 1000,
        navigation: 10000,
    },
    defaultTimeout: 5000,
    pollInterval: 100,
};