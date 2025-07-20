import WebSocket from 'ws';
import fetch from 'node-fetch';

async function waitForDebuggerReady(port = 9222, retries = 30, backoffMultiplier = 1.2) {
    let currentDelay = 500; // Start with 500ms delay
    
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`🔄 Checking Chrome debugger readiness... [Attempt ${i + 1}/${retries}]`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout per request
            
            const res = await fetch(`http://localhost:${port}/json`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'SuperPancake-Automation'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            const targets = await res.json();
            
            if (!targets || !Array.isArray(targets)) {
                throw new Error('Invalid targets response format');
            }
            
            if (targets.length === 0) {
                throw new Error('No Chrome targets available');
            }
            
            // Validate we have a page target with WebSocket URL
            const pageTarget = targets.find(target => 
                target.type === 'page' && 
                target.webSocketDebuggerUrl
            );
            
            if (!pageTarget) {
                console.log(`⚠️ Found ${targets.length} targets but no suitable page target`);
                throw new Error('No suitable page target found');
            }
            
            console.log(`✅ Chrome debugger ready! Found ${targets.length} targets`);
            console.log(`📍 Using target: ${pageTarget.title || 'Untitled'} (${pageTarget.url || 'about:blank'})`);
            
            return targets;
            
        } catch (err) {
            const isLastAttempt = i === retries - 1;
            
            if (err.name === 'AbortError') {
                console.log(`⏱️ Request timeout on attempt ${i + 1}`);
            } else if (err.code === 'ECONNREFUSED') {
                console.log(`🔌 Connection refused on attempt ${i + 1} - Chrome may not be started yet`);
            } else {
                console.log(`❌ Error on attempt ${i + 1}: ${err.message}`);
            }
            
            if (isLastAttempt) {
                const detailedError = new Error(
                    `Chrome debugger connection failed after ${retries} attempts. ` +
                    `Last error: ${err.message}. ` +
                    `Ensure Chrome is running with --remote-debugging-port=${port}`
                );
                detailedError.originalError = err;
                detailedError.port = port;
                detailedError.attempts = retries;
                throw detailedError;
            }
            
            // Exponential backoff with jitter
            const jitter = Math.random() * 200; // 0-200ms random jitter
            const delay = Math.min(currentDelay + jitter, 5000); // Cap at 5 seconds
            
            console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            currentDelay = Math.min(currentDelay * backoffMultiplier, 5000);
        }
    }
}

export async function connectToChrome(port = 9222, maxRetries = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔗 Attempting WebSocket connection... [Attempt ${attempt}/${maxRetries}]`);
            
            const targets = await waitForDebuggerReady(port);
            
            if (!targets || targets.length === 0) {
                throw new Error(`No Chrome targets available on port ${port}`);
            }
            
            // Find the best target (prefer page type)
            const pageTarget = targets.find(target => 
                target.type === 'page' && 
                target.webSocketDebuggerUrl
            ) || targets.find(target => target.webSocketDebuggerUrl);
            
            if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
                throw new Error(`No suitable WebSocket URL available from Chrome targets`);
            }

            const wsUrl = pageTarget.webSocketDebuggerUrl;
            console.log(`📡 Connecting to WebSocket: ${wsUrl.substring(0, 50)}...`);
            
            const ws = await connectWebSocket(wsUrl, port);
            
            // Add enhanced connection health monitoring with auto-reconnect
            ws.isHealthy = true;
            ws.lastPingTime = Date.now();
            ws.lastPongTime = Date.now();
            ws.consecutiveFailures = 0;
            ws.reconnectAttempts = 0;
            ws.maxReconnectAttempts = 5;
            ws.originalUrl = wsUrl;
            ws.port = port;
            ws.isReconnecting = false;
            
            // Set up aggressive ping-pong for connection health (5 seconds instead of 30)
            const pingInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.ping();
                        ws.lastPingTime = Date.now();
                        
                        // Check if previous ping timed out
                        const timeSinceLastPong = Date.now() - ws.lastPongTime;
                        if (timeSinceLastPong > 15000) { // 15 second pong timeout
                            ws.consecutiveFailures++;
                            console.log(`⚠️ Ping timeout detected (${ws.consecutiveFailures} consecutive failures)`);
                            
                            if (ws.consecutiveFailures >= 3) {
                                console.log('❌ Connection unhealthy - too many ping failures');
                                ws.isHealthy = false;
                                ws.emit('connection-unhealthy', { reason: 'ping-timeout', failures: ws.consecutiveFailures });
                            }
                        }
                    } catch (pingError) {
                        console.log(`❌ Ping failed: ${pingError.message}`);
                        ws.consecutiveFailures++;
                        ws.isHealthy = false;
                    }
                } else {
                    clearInterval(pingInterval);
                }
            }, 5000); // Ping every 5 seconds for faster failure detection
            
            ws.on('pong', () => {
                ws.lastPongTime = Date.now();
                ws.consecutiveFailures = 0; // Reset failure counter on successful pong
                if (!ws.isHealthy) {
                    console.log('✅ Connection recovered - pong received');
                    ws.isHealthy = true;
                }
            });
            
            ws.on('close', (code, reason) => {
                clearInterval(pingInterval);
                ws.isHealthy = false;
                const reasonText = reason ? reason.toString() : 'Unknown';
                console.log(`🔌 WebSocket connection closed (Code: ${code}, Reason: ${reasonText})`);
                
                // Attempt automatic reconnection if not a normal closure and within retry limits
                if (code !== 1000 && !ws.isReconnecting && ws.reconnectAttempts < ws.maxReconnectAttempts) {
                    attemptReconnection(ws);
                } else {
                    ws.emit('connection-closed', { code, reason: reasonText, reconnectable: false });
                }
            });
            
            ws.on('error', (error) => {
                ws.isHealthy = false;
                ws.consecutiveFailures++;
                console.log(`❌ WebSocket error (failure #${ws.consecutiveFailures}): ${error.message}`);
                
                // Attempt automatic reconnection on error if within retry limits
                if (!ws.isReconnecting && ws.reconnectAttempts < ws.maxReconnectAttempts) {
                    attemptReconnection(ws);
                } else {
                    ws.emit('connection-error', { error: error.message, failures: ws.consecutiveFailures, reconnectable: false });
                }
            });
            
            console.log(`✅ Successfully connected to Chrome WebSocket on attempt ${attempt}`);
            return ws;
            
        } catch (error) {
            lastError = error;
            console.log(`❌ Connection attempt ${attempt} failed: ${error.message}`);
            
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * attempt, 3000); // Progressive delay: 1s, 2s, 3s
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // All attempts failed
    const finalError = new Error(
        `Failed to connect to Chrome after ${maxRetries} attempts. ` +
        `Last error: ${lastError?.message || 'Unknown error'}. ` +
        `Troubleshooting: Ensure Chrome is running with --remote-debugging-port=${port} ` +
        `and no firewall is blocking the connection.`
    );
    finalError.originalError = lastError;
    finalError.port = port;
    finalError.attempts = maxRetries;
    throw finalError;
}

async function connectWebSocket(wsUrl, port) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        // Enhanced WebSocket configuration for stability
        const ws = new WebSocket(wsUrl, {
            handshakeTimeout: 15000, // Increased to 15 seconds for slower systems
            perMessageDeflate: false, // Disable compression for stability
            skipUTF8Validation: false, // Keep validation for security
            maxPayload: 100 * 1024 * 1024, // 100MB max payload
        });
        
        let isResolved = false;
        
        // Enhanced timeout with better error context
        const timeout = setTimeout(() => {
            if (!isResolved) {
                isResolved = true;
                const elapsed = Date.now() - startTime;
                ws.close();
                reject(new Error(
                    `WebSocket handshake timeout after ${elapsed}ms (limit: 15000ms). ` +
                    `URL: ${wsUrl.substring(0, 100)}... ` +
                    `Port: ${port}. Check if Chrome is responsive and not overloaded.`
                ));
            }
        }, 15000);
        
        ws.once('open', () => {
            if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                const elapsed = Date.now() - startTime;
                console.log(`🚀 WebSocket connection established in ${elapsed}ms`);
                resolve(ws);
            }
        });
        
        ws.once('error', (error) => {
            if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                const elapsed = Date.now() - startTime;
                
                // Enhanced error reporting with context
                let errorMessage = `WebSocket connection failed after ${elapsed}ms. `;
                
                if (error.code) {
                    switch (error.code) {
                        case 'ECONNREFUSED':
                            errorMessage += `Connection refused (${error.code}). Chrome may not be running on port ${port}.`;
                            break;
                        case 'ENOTFOUND':
                            errorMessage += `Host not found (${error.code}). Check if localhost is accessible.`;
                            break;
                        case 'ECONNRESET':
                            errorMessage += `Connection reset (${error.code}). Chrome may have crashed or restarted.`;
                            break;
                        case 'ETIMEDOUT':
                            errorMessage += `Connection timeout (${error.code}). Network or Chrome may be slow.`;
                            break;
                        default:
                            errorMessage += `Error code: ${error.code} - ${error.message}`;
                    }
                } else {
                    errorMessage += `${error.message || 'Unknown error'}`;
                }
                
                errorMessage += ` URL: ${wsUrl.substring(0, 100)}...`;
                
                reject(new Error(errorMessage));
            }
        });
        
        ws.once('close', (code, reason) => {
            if (!isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                const elapsed = Date.now() - startTime;
                
                if (code !== 1000) { // 1000 is normal closure
                    let closeMessage = `WebSocket closed unexpectedly after ${elapsed}ms. `;
                    
                    // Enhanced close code interpretation
                    switch (code) {
                        case 1006:
                            closeMessage += `Abnormal closure (${code}). Connection lost without proper handshake.`;
                            break;
                        case 1011:
                            closeMessage += `Server error (${code}). Chrome DevTools encountered an internal error.`;
                            break;
                        case 1012:
                            closeMessage += `Service restart (${code}). Chrome DevTools is restarting.`;
                            break;
                        case 1013:
                            closeMessage += `Try again later (${code}). Chrome DevTools is temporarily unavailable.`;
                            break;
                        default:
                            closeMessage += `Close code: ${code}`;
                    }
                    
                    if (reason) {
                        closeMessage += ` Reason: ${reason.toString()}`;
                    }
                    
                    closeMessage += ` URL: ${wsUrl.substring(0, 100)}...`;
                    
                    reject(new Error(closeMessage));
                }
            }
        });
        
        // Add connection state logging for debugging
        console.log(`🔗 Initiating WebSocket connection to ${wsUrl.substring(0, 50)}...`);
    });
}

// Enhanced helper function to check if a WebSocket connection is healthy
export function isConnectionHealthy(ws) {
    if (!ws || !ws.isHealthy) {
        return false;
    }
    
    if (ws.readyState !== WebSocket.OPEN) {
        return false;
    }
    
    // Check for too many consecutive failures
    if (ws.consecutiveFailures && ws.consecutiveFailures >= 3) {
        console.log(`⚠️ WebSocket connection unhealthy - ${ws.consecutiveFailures} consecutive failures`);
        return false;
    }
    
    // Check if we've received a pong recently (within last 20 seconds with faster ping)
    const timeSinceLastPong = Date.now() - (ws.lastPongTime || 0);
    if (timeSinceLastPong > 20000) {
        console.log(`⚠️ WebSocket connection may be stale - no pong for ${Math.round(timeSinceLastPong/1000)}s`);
        return false;
    }
    
    // Check if ping is working
    const timeSinceLastPing = Date.now() - (ws.lastPingTime || 0);
    if (timeSinceLastPing > 30000) {
        console.log(`⚠️ WebSocket ping system not active - last ping ${Math.round(timeSinceLastPing/1000)}s ago`);
        return false;
    }
    
    return true;
}

// Helper function to safely close WebSocket connections
export function closeConnection(ws) {
    if (!ws) return;
    
    try {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close(1000, 'Normal closure');
        }
        ws.isHealthy = false;
    } catch (error) {
        console.log(`⚠️ Error closing WebSocket: ${error.message}`);
    }
}

// Automatic reconnection function with exponential backoff
async function attemptReconnection(originalWs) {
    if (originalWs.isReconnecting) {
        return; // Already attempting reconnection
    }
    
    originalWs.isReconnecting = true;
    originalWs.reconnectAttempts++;
    
    console.log(`🔄 Attempting automatic reconnection [${originalWs.reconnectAttempts}/${originalWs.maxReconnectAttempts}]`);
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, originalWs.reconnectAttempts - 1), 16000);
    console.log(`⏳ Waiting ${delay}ms before reconnection attempt...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
        // Get fresh targets and attempt to reconnect
        const targets = await waitForDebuggerReady(originalWs.port);
        
        if (!targets || targets.length === 0) {
            throw new Error(`No Chrome targets available on port ${originalWs.port} during reconnection`);
        }
        
        // Find a suitable target
        const pageTarget = targets.find(target => 
            target.type === 'page' && 
            target.webSocketDebuggerUrl
        ) || targets.find(target => target.webSocketDebuggerUrl);
        
        if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
            throw new Error('No suitable WebSocket URL available during reconnection');
        }
        
        const newWsUrl = pageTarget.webSocketDebuggerUrl;
        console.log(`🔄 Reconnecting to: ${newWsUrl.substring(0, 50)}...`);
        
        const newWs = await connectWebSocket(newWsUrl, originalWs.port);
        
        // Copy connection monitoring properties to new WebSocket
        newWs.isHealthy = true;
        newWs.lastPingTime = Date.now();
        newWs.lastPongTime = Date.now();
        newWs.consecutiveFailures = 0;
        newWs.reconnectAttempts = originalWs.reconnectAttempts;
        newWs.maxReconnectAttempts = originalWs.maxReconnectAttempts;
        newWs.originalUrl = originalWs.originalUrl;
        newWs.port = originalWs.port;
        newWs.isReconnecting = false;
        
        console.log(`✅ Reconnection successful after ${originalWs.reconnectAttempts} attempts`);
        
        // Emit reconnection success event
        originalWs.emit('connection-reconnected', { 
            attempts: originalWs.reconnectAttempts, 
            newWebSocket: newWs 
        });
        
        return newWs;
        
    } catch (error) {
        originalWs.isReconnecting = false;
        console.log(`❌ Reconnection attempt ${originalWs.reconnectAttempts} failed: ${error.message}`);
        
        if (originalWs.reconnectAttempts < originalWs.maxReconnectAttempts) {
            // Will try again on next error/close event
            console.log(`⏳ Will retry reconnection if another failure occurs`);
        } else {
            console.log(`🛑 Maximum reconnection attempts (${originalWs.maxReconnectAttempts}) reached`);
            originalWs.emit('connection-exhausted', { 
                attempts: originalWs.reconnectAttempts,
                lastError: error.message 
            });
        }
        
        throw error;
    }
}

// Browser crash detection and recovery system
export async function createRobustConnection(port = 9222, maxRetries = 3) {
    const connectionManager = {
        ws: null,
        isActive: false,
        crashCount: 0,
        maxCrashRecoveries: 3,
        healthCheckInterval: null,
        port: port,
        
        async initialize() {
            console.log('🛡️ Initializing robust browser connection...');
            this.ws = await connectToChrome(this.port, maxRetries);
            this.isActive = true;
            this.startHealthMonitoring();
            return this.ws;
        },
        
        startHealthMonitoring() {
            console.log('💓 Starting browser health monitoring...');
            
            this.healthCheckInterval = setInterval(async () => {
                if (!this.isActive) return;
                
                try {
                    // Check if Chrome process is still running
                    const isAlive = await this.checkBrowserAlive();
                    
                    if (!isAlive) {
                        console.log('💀 Browser crash detected!');
                        await this.handleCrash();
                    } else if (!isConnectionHealthy(this.ws)) {
                        console.log('⚕️ Connection health issue detected');
                        await this.handleConnectionIssue();
                    }
                } catch (error) {
                    console.log(`❌ Health check error: ${error.message}`);
                }
            }, 10000); // Check every 10 seconds
        },
        
        async checkBrowserAlive() {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch(`http://localhost:${this.port}/json`, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'SuperPancake-HealthCheck' }
                });
                
                clearTimeout(timeoutId);
                return response.ok;
            } catch (error) {
                return false;
            }
        },
        
        async handleCrash() {
            this.crashCount++;
            console.log(`🚨 Browser crash #${this.crashCount} detected`);
            
            if (this.crashCount > this.maxCrashRecoveries) {
                console.log(`🛑 Maximum crash recoveries (${this.maxCrashRecoveries}) exceeded`);
                this.isActive = false;
                this.ws?.emit('browser-crash-exhausted', { crashes: this.crashCount });
                return;
            }
            
            console.log(`🔄 Attempting crash recovery ${this.crashCount}/${this.maxCrashRecoveries}...`);
            
            try {
                // Clean up old connection
                if (this.ws) {
                    closeConnection(this.ws);
                }
                
                // Wait before recovery attempt
                const delay = Math.min(5000 * this.crashCount, 30000); // 5s, 10s, 15s...
                console.log(`⏳ Waiting ${delay}ms before crash recovery...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Attempt to restart browser connection
                this.ws = await connectToChrome(this.port, maxRetries);
                
                console.log(`✅ Crash recovery successful! Browser reconnected.`);
                this.ws?.emit('browser-crash-recovered', { 
                    crashes: this.crashCount,
                    recoveryTime: delay 
                });
                
            } catch (error) {
                console.log(`❌ Crash recovery ${this.crashCount} failed: ${error.message}`);
                this.ws?.emit('browser-crash-recovery-failed', { 
                    crashes: this.crashCount, 
                    error: error.message 
                });
            }
        },
        
        async handleConnectionIssue() {
            console.log('🔧 Handling connection issue...');
            
            try {
                // Attempt connection recovery without full restart
                if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
                    console.log('🔗 WebSocket not open, attempting reconnection...');
                    closeConnection(this.ws);
                    this.ws = await connectToChrome(this.port, 2); // Fewer retries for connection issues
                    
                    console.log('✅ Connection issue resolved');
                    this.ws?.emit('connection-issue-resolved');
                }
            } catch (error) {
                console.log(`❌ Connection issue recovery failed: ${error.message}`);
                // This will be caught by the crash detection on next health check
            }
        },
        
        destroy() {
            console.log('🔒 Destroying robust connection manager...');
            this.isActive = false;
            
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
            }
            
            if (this.ws) {
                closeConnection(this.ws);
                this.ws = null;
            }
            
            console.log('✅ Connection manager destroyed');
        }
    };
    
    return connectionManager;
}