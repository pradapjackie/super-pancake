#!/usr/bin/env node

// Wrapper for create-super-pancake to handle ES modules properly
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import and run the main function
import('./index.js').then(module => {
  // The main function is auto-executed in index.js
}).catch(console.error);