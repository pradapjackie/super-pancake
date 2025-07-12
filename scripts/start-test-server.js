#!/usr/bin/env node
// Simple HTTP server for serving the test application

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ensurePortAvailable } from '../utils/port-finder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const defaultPort = process.env.TEST_APP_PORT || 8080;

// Serve static files from test-app directory
app.use(express.static(path.join(__dirname, '..', 'test-app')));

// API endpoint for testing
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test API endpoint working',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

// Start server with automatic port finding
async function startServer() {
  const port = await ensurePortAvailable(defaultPort, true);
  
  const server = app.listen(port, () => {
    console.log(`🧪 Test Application Server running at http://localhost:${port}`);
    console.log(`📄 Test app available at: http://localhost:${port}/index.html`);
    console.log(`🔍 API endpoint: http://localhost:${port}/api/test`);
  });
  
  return { server, port };
}

startServer().catch(error => {
  console.error('❌ Failed to start test server:', error);
  process.exit(1);
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  server.close(() => {
    console.log('✅ Test server stopped');
    process.exit(0);
  });
});

export default server;