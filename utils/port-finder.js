import net from 'net';

/**
 * Find an available port starting from the given port number
 * @param {number} startPort - Starting port to check
 * @param {number} maxAttempts - Maximum number of ports to check
 * @returns {Promise<number>} Available port number
 */
export async function findAvailablePort(startPort = 3000, maxAttempts = 100) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      return port;
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