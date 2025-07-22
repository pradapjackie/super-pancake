#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = path.join(__dirname, '..');

console.log('🔍 Super Pancake Installation Check');
console.log('=====================================');
console.log(`📦 Package root: ${packageRoot}`);
console.log(`📂 Current working directory: ${process.cwd()}`);
console.log(`🖥️ Platform: ${process.platform}`);
console.log(`📍 Script location: ${__dirname}`);

const requiredFiles = [
  'public/index.html',
  'public/styles.css',
  'public/app.js',
  'scripts/test-ui.js'
];

console.log('\n📋 Checking required files:');
let allFilesExist = true;

for (const file of requiredFiles) {
  const filePath = path.join(packageRoot, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file} → ${filePath}`);
  if (!exists) {allFilesExist = false;}
}

console.log('\n🎯 Status:', allFilesExist ? '✅ Installation OK' : '❌ Missing files');

if (allFilesExist) {
  console.log('\n🚀 You can now run:');
  console.log('   npx super-pancake-ui       - Full test runner');
  console.log('   npx super-pancake-server   - Simple UI server');
} else {
  console.log('\n🔧 Please reinstall the package or check installation');
}
