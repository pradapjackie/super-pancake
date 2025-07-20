// Simple browser connection for Super Pancake Framework
import WebSocket from 'ws';
import { withErrorRecovery, withRetry } from './simple-errors.js';

export const connectToChrome = withRetry(async (port = 9222, maxRetries = 3) => {
  console.log(`🔗 Connecting to Chrome on port ${port}`);

  // Get available tabs
  const response = await fetch(`http://localhost:${port}/json`);
  const tabs = await response.json();
  
  // Find a suitable tab (usually the first one)
  const tab = tabs.find(t => t.type === 'page') || tabs[0];
  
  if (!tab || !tab.webSocketDebuggerUrl) {
    throw new Error('No suitable tab with WebSocket URL found');
  }

  const wsUrl = tab.webSocketDebuggerUrl;

  // Create WebSocket connection
  const ws = new WebSocket(wsUrl);

  // Wait for connection
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('WebSocket connection timeout'));
    }, 10000);

    ws.on('open', () => {
      clearTimeout(timeout);
      console.log('✅ WebSocket connected successfully');
      resolve();
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  // Simple ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 5000); // 5 seconds

  ws.on('close', () => {
    clearInterval(pingInterval);
    console.log('🔌 WebSocket connection closed');
  });

  return ws;
}, { maxRetries: 3, operation: 'connectToChrome' });

export function isConnectionHealthy(ws) {
  return ws && ws.readyState === WebSocket.OPEN;
}

export function closeConnection(ws) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
}