#!/usr/bin/env node
import glob from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

glob('tests/**/*.test.js', async (err, files) => {
  for (const file of files) {
    console.log(`📂 Running: ${file}`);
    await new Promise((resolve) => {
      const child = exec(`node ${file}`, (err, stdout, stderr) => {
        console.log(stdout);
        console.error(stderr);
        resolve();
      });
    });
  }
});
