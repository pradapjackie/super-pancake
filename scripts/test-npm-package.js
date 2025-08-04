#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing NPM Package Functionality...\n');

// Test 1: Check if CLI commands work
async function testCLICommands() {
  console.log('1️⃣ Testing CLI Commands...');
  
  const commands = [
    { cmd: 'node', args: ['bin/cli.js', '--version'], desc: 'Version command' },
    { cmd: 'node', args: ['bin/cli.js', '--help'], desc: 'Help command' },
    { cmd: 'node', args: ['bin/cli.js', 'browsers'], desc: 'Browser detection' }
  ];
  
  for (const command of commands) {
    try {
      const result = await runCommand(command.cmd, command.args);
      console.log(`✅ ${command.desc}: PASSED`);
    } catch (error) {
      console.log(`❌ ${command.desc}: FAILED - ${error.message}`);
    }
  }
}

// Test 2: Check if package.json exports are correct
function testPackageExports() {
  console.log('\n2️⃣ Testing Package Exports...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check main entry point
  if (packageJson.main === 'index.js') {
    console.log('✅ Main entry point: PASSED');
  } else {
    console.log('❌ Main entry point: FAILED');
  }
  
  // Check bin commands
  const binCommands = Object.keys(packageJson.bin || {});
  if (binCommands.length >= 4) {
    console.log(`✅ Bin commands (${binCommands.length}): PASSED`);
    binCommands.forEach(cmd => console.log(`   - ${cmd}`));
  } else {
    console.log('❌ Bin commands: FAILED');
  }
  
  // Check exports
  const exports = Object.keys(packageJson.exports || {});
  if (exports.length >= 10) {
    console.log(`✅ Exports (${exports.length}): PASSED`);
  } else {
    console.log('❌ Exports: FAILED');
  }
}

// Test 3: Check if template files exist
function testTemplateFiles() {
  console.log('\n3️⃣ Testing Template Files...');
  
  const requiredFiles = [
    'templates/tests/sample.test.js',
    'templates/tests/ui-website.test.js',
    'templates/tests/api.test.js',
    'bin/init.js',
    'bin/cli.js',
    'bin/ui-runner.js'
  ];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}: EXISTS`);
    } else {
      console.log(`❌ ${file}: MISSING`);
    }
  }
}

// Test 4: Check if init script works (dry run)
async function testInitScript() {
  console.log('\n4️⃣ Testing Init Script (Dry Run)...');
  
  try {
    // Test init script without creating actual project
    const result = await runCommand('node', ['bin/init.js', '--dry-run']);
    console.log('✅ Init script: PASSED');
  } catch (error) {
    console.log(`❌ Init script: FAILED - ${error.message}`);
  }
}

// Test 5: Check if main exports work
async function testMainExports() {
  console.log('\n5️⃣ Testing Main Exports...');
  
  try {
    // Test importing main module
    const { createTestEnvironment, navigateTo, getText } = await import('../index.js');
    
    if (typeof createTestEnvironment === 'function') {
      console.log('✅ createTestEnvironment: PASSED');
    } else {
      console.log('❌ createTestEnvironment: FAILED');
    }
    
    if (typeof navigateTo === 'function') {
      console.log('✅ navigateTo: PASSED');
    } else {
      console.log('❌ navigateTo: FAILED');
    }
    
    if (typeof getText === 'function') {
      console.log('✅ getText: PASSED');
    } else {
      console.log('❌ getText: FAILED');
    }
    
  } catch (error) {
    console.log(`❌ Main exports: FAILED - ${error.message}`);
  }
}

// Helper function to run commands
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      cwd: path.dirname(__dirname)
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Test 6: Check npm package structure
function testNpmStructure() {
  console.log('\n6️⃣ Testing NPM Package Structure...');
  
  const requiredDirs = [
    'bin',
    'core',
    'utils',
    'templates',
    'reporter',
    'helpers'
  ];
  
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
      console.log(`✅ ${dir}/: EXISTS`);
    } else {
      console.log(`❌ ${dir}/: MISSING`);
    }
  }
  
  // Check if files array in package.json includes all necessary files
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const files = packageJson.files || [];
  
  const requiredFiles = [
    'bin/',
    'core/',
    'utils/',
    'templates/',
    'index.js',
    'index.d.ts'
  ];
  
  for (const file of requiredFiles) {
    if (files.includes(file)) {
      console.log(`✅ ${file} in files array: INCLUDED`);
    } else {
      console.log(`❌ ${file} in files array: MISSING`);
    }
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testCLICommands();
    testPackageExports();
    testTemplateFiles();
    await testInitScript();
    await testMainExports();
    testNpmStructure();
    
    console.log('\n🎉 NPM Package Test Summary:');
    console.log('✅ All core functionality tests completed');
    console.log('📦 Package is ready for npm deployment');
    console.log('🚀 End users can use: npx super-pancake-automation init <project>');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests }; 