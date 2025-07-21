import { 
  SuperPancakeError, 
  SessionError, 
  withErrorRecovery, 
  withRetry, 
  withCircuitBreaker,
  StackTraceError 
} from './errors.js';

let msgId = 0;
const sessionTimeouts = new Map(); // Track message timeouts

export function createSession(ws) {
    if (!ws || typeof ws.send !== 'function') {
        throw new SessionError('Invalid WebSocket provided to createSession', { wsState: ws?.readyState });
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`📞 Creating session: ${sessionId}`);

    // Enhanced send with comprehensive error handling
    const send = withCircuitBreaker(
        withRetry(
            withErrorRecovery(
                (method, params = {}, timeout = 30000) => {
                    return new Promise((resolve, reject) => {
                        try {
                            // Validate WebSocket state
                            if (!ws || ws.readyState !== 1) { // 1 = OPEN
                                throw new SessionError('WebSocket is not in OPEN state', {
                                    state: ws?.readyState,
                                    method,
                                    sessionId
                                });
                            }

                            const id = ++msgId;
                            const message = { id, method, params };
                            
                            // Set up timeout for this specific message
                            const timeoutId = setTimeout(() => {
                                sessionTimeouts.delete(id);
                                reject(new SessionError(
                                    `Method ${method} timed out after ${timeout}ms`,
                                    { method, params, timeout, messageId: id, sessionId }
                                ));
                            }, timeout);
                            
                            sessionTimeouts.set(id, timeoutId);

                            // Set up response listener with error handling
                            const listener = (msg) => {
                                try {
                                    const data = JSON.parse(msg);
                                    if (data.id === id) {
                                        // Clear timeout and remove listener
                                        const timeoutId = sessionTimeouts.get(id);
                                        if (timeoutId) {
                                            clearTimeout(timeoutId);
                                            sessionTimeouts.delete(id);
                                        }
                                        
                                        ws.off('message', listener);
                                        
                                        if (data.error) {
                                            reject(new SessionError(
                                                `CDP method ${method} failed: ${data.error.message || 'Unknown error'}`,
                                                { 
                                                    method, 
                                                    params, 
                                                    cdpError: data.error,
                                                    messageId: id,
                                                    sessionId
                                                }
                                            ));
                                        } else {
                                            resolve(data.result || {});
                                        }
                                    }
                                } catch (parseError) {
                                    console.error(`❌ Failed to parse CDP response for ${method}:`, parseError.message);
                                    reject(new SessionError(
                                        `Failed to parse CDP response for ${method}`,
                                        { parseError: parseError.message, method, sessionId }
                                    ));
                                }
                            };

                            // Send message with error handling
                            try {
                                ws.send(JSON.stringify(message));
                                ws.on('message', listener);
                                
                                console.log(`📤 Sent ${method} (ID: ${id})`);
                            } catch (sendError) {
                                // Clear timeout if send fails
                                const timeoutId = sessionTimeouts.get(id);
                                if (timeoutId) {
                                    clearTimeout(timeoutId);
                                    sessionTimeouts.delete(id);
                                }
                                
                                throw new SessionError(
                                    `Failed to send CDP message for ${method}: ${sendError.message}`,
                                    { method, params, sendError: sendError.message, sessionId }
                                );
                            }
                        } catch (error) {
                            // Catch any synchronous errors and wrap them
                            if (error instanceof SessionError) {
                                throw error;
                            } else {
                                throw new StackTraceError(error, `session.send(${method})`, { sessionId });
                            }
                        }
                    });
                },
                'session.send'
            ),
            { maxRetries: 3, operation: 'session.send' }
        ),
        'session-operations',
        { failureThreshold: 5, recoveryTimeout: 30000 }
    );

    // Enhanced session object with health monitoring
    const session = {
        id: sessionId,
        send,
        
        // Connection health check
        async isHealthy() {
            try {
                await send('Runtime.evaluate', { expression: '1+1', returnByValue: true }, 5000);
                return true;
            } catch (error) {
                console.warn(`⚠️ Session ${sessionId} health check failed:`, error.message);
                return false;
            }
        },

        // Enhanced navigation with error recovery
        async navigateTo(url) {
            return withErrorRecovery(async () => {
                if (!url || typeof url !== 'string') {
                    throw new SessionError('Invalid URL provided to navigateTo', { url, sessionId });
                }

                console.log(`🌐 Navigating to: ${url}`);
                
                // Enable required domains
                await send('Page.enable');
                await send('Runtime.enable');
                
                // Navigate with timeout
                await send('Page.navigate', { url });
                
                // Wait for load with enhanced error handling
                return new Promise((resolve, reject) => {
                    const loadTimeout = setTimeout(() => {
                        ws.off('message', loadListener);
                        reject(new SessionError(
                            `Navigation to ${url} timed out after 30 seconds`,
                            { url, sessionId }
                        ));
                    }, 30000);

                    const loadListener = (msg) => {
                        try {
                            const data = JSON.parse(msg);
                            if (data.method === 'Page.loadEventFired') {
                                clearTimeout(loadTimeout);
                                ws.off('message', loadListener);
                                console.log(`✅ Navigation completed: ${url}`);
                                resolve();
                            }
                        } catch (error) {
                            clearTimeout(loadTimeout);
                            ws.off('message', loadListener);
                            reject(new SessionError(
                                `Error processing load event for ${url}: ${error.message}`,
                                { url, error: error.message, sessionId }
                            ));
                        }
                    };

                    ws.on('message', loadListener);
                });
            }, 'session.navigateTo')();
        },

        // Get session statistics
        getStats() {
            return {
                id: sessionId,
                messageId: msgId,
                pendingTimeouts: sessionTimeouts.size,
                wsState: ws?.readyState,
                created: new Date().toISOString()
            };
        },

        // Clean up session resources
        destroy() {
            console.log(`🔒 Destroying session: ${sessionId}`);
            
            // Clear all pending timeouts
            for (const [id, timeoutId] of sessionTimeouts) {
                clearTimeout(timeoutId);
            }
            sessionTimeouts.clear();
            
            // Remove all listeners (if possible)
            try {
                if (ws && typeof ws.removeAllListeners === 'function') {
                    ws.removeAllListeners('message');
                }
            } catch (error) {
                console.warn(`⚠️ Error removing listeners during session cleanup: ${error.message}`);
            }
        }
    };

    return session;
}