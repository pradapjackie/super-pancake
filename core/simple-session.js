// Simple session management for Super Pancake Framework
import { SessionError, withErrorRecovery } from './simple-errors.js';

let msgId = 0;

export function createSession(ws) {
  if (!ws || typeof ws.send !== 'function') {
    throw new SessionError('Invalid WebSocket provided to createSession');
  }

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`📞 Creating session: ${sessionId}`);

  // Simple send function
  const send = withErrorRecovery(async (method, params = {}, timeout = 30000) => {
    return new Promise((resolve, reject) => {
      try {
        // Check WebSocket state
        if (!ws || ws.readyState !== 1) { // 1 = OPEN
          throw new SessionError(`WebSocket is not in OPEN state (state: ${ws?.readyState})`);
        }

        const id = ++msgId;
        const message = { id, method, params };

        // Set up timeout
        const timeoutId = setTimeout(() => {
          ws.off('message', listener);
          reject(new SessionError(`Method ${method} timed out after ${timeout}ms`));
        }, timeout);

        // Set up response listener
        const listener = (msg) => {
          try {
            const data = JSON.parse(msg);
            if (data.id === id) {
              clearTimeout(timeoutId);
              ws.off('message', listener);

              if (data.error) {
                reject(new SessionError(`CDP method ${method} failed: ${data.error.message || 'Unknown error'}`));
              } else {
                resolve(data.result || {});
              }
            }
          } catch (parseError) {
            clearTimeout(timeoutId);
            ws.off('message', listener);
            reject(new SessionError(`Failed to parse CDP response for ${method}: ${parseError.message}`));
          }
        };

        // Send message
        ws.send(JSON.stringify(message));
        ws.on('message', listener);

        console.log(`📤 Sent ${method} (ID: ${id})`);

      } catch (error) {
        reject(error);
      }
    });
  }, 'session.send');

  // Session object
  const session = {
    id: sessionId,
    send,
    _ws: ws, // Expose WebSocket for DOM operations

    // Simple health check
    async isHealthy() {
      try {
        await send('Runtime.evaluate', { expression: '1+1', returnByValue: true }, 5000);
        return true;
      } catch (error) {
        console.warn(`⚠️ Session ${sessionId} health check failed:`, error.message);
        return false;
      }
    },

    // Get session statistics
    getStats() {
      return {
        id: sessionId,
        messageId: msgId,
        wsState: ws?.readyState,
        created: new Date().toISOString()
      };
    },

    // Cleanup
    destroy() {
      console.log(`🔒 Destroying session: ${sessionId}`);
      try {
        if (ws && typeof ws.removeAllListeners === 'function') {
          ws.removeAllListeners('message');
        }
      } catch (error) {
        console.warn(`⚠️ Error during session cleanup: ${error.message}`);
      }
    }
  };

  return session;
}
