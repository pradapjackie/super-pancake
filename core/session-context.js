// Session Context - Manages current session for simplified API
// Eliminates the need to pass session to every method call

let currentSession = null;

/**
 * Sets the current session context
 * @param {Object} session - The session object to set as current
 */
export function setSession(session) {
  currentSession = session;
  console.log(`🎯 Session context set: ${session?.id || 'unknown'}`);
}

/**
 * Gets the current session context
 * @returns {Object} The current session object
 * @throws {Error} If no session is set
 */
export function getSession() {
  if (!currentSession) {
    throw new Error('No session context set. Call setSession() first or use the test setup utility.');
  }
  return currentSession;
}

/**
 * Clears the current session context
 */
export function clearSession() {
  const previousId = currentSession?.id || 'unknown';
  currentSession = null;
  console.log(`🧹 Session context cleared: ${previousId}`);
}

/**
 * Checks if a session context is currently set
 * @returns {boolean} True if session context is set
 */
export function hasSession() {
  return currentSession !== null;
}

/**
 * Gets session info for debugging
 * @returns {Object} Session info or null
 */
export function getSessionInfo() {
  if (!currentSession) {
    return { hasSession: false, id: null };
  }

  return {
    hasSession: true,
    id: currentSession.id,
    isHealthy: currentSession.isHealthy ? currentSession.isHealthy() : 'unknown'
  };
}
