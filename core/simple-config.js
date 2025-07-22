// Simple configuration for Super Pancake Framework
export const config = {
  timeouts: {
    connection: 30000,
    navigation: 30000,
    element: 10000,
    test: 60000
  },
  browser: {
    headless: true,
    devtools: false,
    defaultPort: 9222
  },
  debugging: {
    verbose: process.env.SUPER_PANCAKE_VERBOSE === 'true',
    debug: process.env.SUPER_PANCAKE_DEBUG === 'true'
  }
};

export function getConfig(path) {
  const keys = path.split('.');
  let value = config;
  for (const key of keys) {
    value = value?.[key];
  }
  return value;
}

export function isDebugMode() {
  return config.debugging.debug;
}

export function isVerbose() {
  return config.debugging.verbose;
}
