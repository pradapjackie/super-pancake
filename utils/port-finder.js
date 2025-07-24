import net from 'net';

// Track reserved ports to avoid conflicts in parallel execution
const reservedPorts = new Set();

/**
 * Find an available port starting from the given port number
 * Handles parallel execution by reserving ports temporarily
 * @param {number} startPort - Starting port to check
 * @param {number} maxAttempts - Maximum number of ports to check
 * @returns {Promise<number>} Available port number
 */
export async function findAvailablePort(startPort = 3000, maxAttempts = 100) {
  // Add randomization to reduce collision probability in parallel tests
  const randomOffset = Math.floor(Math.random() * 100);
  const actualStartPort = startPort + randomOffset;
  
  for (let port = actualStartPort; port < actualStartPort + maxAttempts; port++) {
    // Skip already reserved ports
    if (reservedPorts.has(port)) {
      continue;
    }
    
    if (await isPortAvailable(port)) {
      // Reserve the port temporarily to prevent race conditions
      reservedPorts.add(port);
      
      // Release the reservation after 30 seconds (cleanup)
      setTimeout(() => {
        reservedPorts.delete(port);
      }, 30000);
      
      return port;
    }
  }
  
  // Try the original range if randomized range failed
  if (actualStartPort !== startPort) {
    for (let port = startPort; port < startPort + maxAttempts; port++) {
      if (reservedPorts.has(port)) {
        continue;
      }
      
      if (await isPortAvailable(port)) {
        reservedPorts.add(port);
        setTimeout(() => {
          reservedPorts.delete(port);
        }, 30000);
        return port;
      }
    }
  }
  
  throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts}`);
}

/**
 * Check if a specific port is available
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} True if port is available
 */
export async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(port, () => {
      server.close(() => resolve(true));
    });

    server.on('error', () => resolve(false));
  });
}

/**
 * Kill process using a specific port (cross-platform)
 * @param {number} port - Port number
 * @returns {Promise<boolean>} True if process was killed
 */
export async function killPortProcess(port) {
  const { spawn } = await import('child_process');

  return new Promise((resolve) => {
    let command, args;

    if (process.platform === 'win32') {
      // Windows: Find and kill process using port
      command = 'cmd';
      args = ['/c', `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${port}') do taskkill /f /pid %a`];
    } else {
      // Unix-like systems (macOS, Linux)
      command = 'sh';
      args = ['-c', `lsof -ti:${port} | xargs kill -9`];
    }

    const killProcess = spawn(command, args, { stdio: 'pipe' });

    killProcess.on('exit', (code) => {
      resolve(code === 0);
    });

    killProcess.on('error', () => {
      resolve(false);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      killProcess.kill();
      resolve(false);
    }, 5000);
  });
}

/**
 * Ensure a port is available, killing existing process if necessary
 * @param {number} preferredPort - Preferred port number
 * @param {boolean} killExisting - Whether to kill existing process on port
 * @returns {Promise<number>} Available port number
 */
export async function ensurePortAvailable(preferredPort, killExisting = false) {
  if (await isPortAvailable(preferredPort)) {
    return preferredPort;
  }

  if (killExisting) {
    console.log(`🔄 Port ${preferredPort} is in use, attempting to free it...`);
    const killed = await killPortProcess(preferredPort);

    if (killed) {
      // Wait a moment for the port to be released
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (await isPortAvailable(preferredPort)) {
        console.log(`✅ Port ${preferredPort} is now available`);
        return preferredPort;
      }
    }
  }

  console.log(`🔍 Port ${preferredPort} unavailable, finding alternative...`);
  const availablePort = await findAvailablePort(preferredPort + 1);
  console.log(`✅ Using port ${availablePort} instead`);
  return availablePort;
}

/**
 * Release a reserved port (call this when test cleanup is complete)
 * @param {number} port - Port number to release
 */
export function releasePort(port) {
  reservedPorts.delete(port);
}

/**
 * Get an available port with better isolation for parallel tests
 * Uses different port ranges for different test types
 * @param {string} testType - Type of test ('examples', 'integration', 'e2e', etc.)
 * @returns {Promise<number>} Available port number
 */
export async function getTestPort(testType = 'default') {
  const portRanges = {
    examples: 9000,    // 9000-9099
    integration: 9100, // 9100-9199
    e2e: 9200,        // 9200-9299
    ui: 9300,         // 9300-9399
    api: 9400,        // 9400-9499
    default: 9500     // 9500-9599
  };
  
  const startPort = portRanges[testType] || portRanges.default;
  return await findAvailablePort(startPort, 100);
}
