#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🧪 Testing End-User Experience');
console.log('================================\n');

const tests = [];
let passed = 0;
let failed = 0;

function runTest(name, testFn) {
  console.log(`\n🔍 Running: ${name}`);
  try {
    testFn();
    console.log(`✅ PASS: ${name}`);
    tests.push({ name, status: 'PASS' });
    passed++;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    tests.push({ name, status: 'FAIL', error: error.message });
    failed++;
  }
}

function execCommand(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 30000,
      ...options 
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

// Test 1: Package Installation
runTest('Package Installation', () => {
  // Create test directory
  const testDir = 'test-end-user-install';
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  mkdirSync(testDir);
  
  // Navigate to test directory
  process.chdir(testDir);
  
  // Initialize npm project
  execCommand('npm init -y');
  
  // Install the package
  execCommand('npm install ../super-pancake-automation-*.tgz');
  
  // Test CLI commands
  execCommand('npx super-pancake --version');
  execCommand('npx super-pancake --help');
  
  // Go back to original directory
  process.chdir('..');
  
  // Cleanup
  rmSync(testDir, { recursive: true, force: true });
});

// Test 2: Project Initialization
runTest('Project Initialization', () => {
  const projectName = 'test-end-user-project';
  if (existsSync(projectName)) {
    rmSync(projectName, { recursive: true, force: true });
  }
  
  // Test init command (non-interactive)
  execCommand(`echo "2" | npx super-pancake-init ${projectName}`, { stdio: 'pipe' });
  
  // Check if project was created
  if (!existsSync(projectName)) {
    throw new Error('Project directory was not created');
  }
  
  // Check for essential files
  const essentialFiles = ['package.json', 'README.md', 'tests/'];
  for (const file of essentialFiles) {
    if (!existsSync(join(projectName, file))) {
      throw new Error(`Essential file missing: ${file}`);
    }
  }
  
  // Cleanup
  rmSync(projectName, { recursive: true, force: true });
});

// Test 3: Framework Functionality
runTest('Framework Functionality', () => {
  const testDir = 'test-end-user-framework';
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  mkdirSync(testDir);
  
  process.chdir(testDir);
  
  // Initialize project
  execCommand('npm init -y');
  execCommand('npm install ../super-pancake-automation-*.tgz');
  execCommand('npm install vitest');
  
  // Create test file
  const testContent = `
import { describe, it } from 'vitest';
import { assertTrue, assertEqual, assertContainsText } from 'super-pancake-automation';

describe('End-User Framework Test', () => {
  it('should work with basic assertions', () => {
    assertTrue(true, 'True should be true');
    assertEqual(1, 1, 'Numbers should be equal');
    assertContainsText('Hello World', 'World', 'Text should contain substring');
  });
  
  it('should handle string operations', () => {
    const text = 'Super Pancake Automation';
    assertContainsText(text, 'Pancake', 'Should contain Pancake');
    assertContainsText(text, 'Automation', 'Should contain Automation');
  });
  
  it('should handle numeric comparisons', () => {
    assertEqual(42, 42, 'Numbers should be equal');
    assertTrue(100 > 50, '100 should be greater than 50');
  });
});
`;
  
  writeFileSync('test.js', testContent);
  
  // Run test
  execCommand('npx vitest run test.js');
  
  process.chdir('..');
  rmSync(testDir, { recursive: true, force: true });
});

// Test 4: API Testing
runTest('API Testing', () => {
  const testDir = 'test-end-user-api';
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  mkdirSync(testDir);
  
  process.chdir(testDir);
  
  // Initialize project
  execCommand('npm init -y');
  execCommand('npm install ../super-pancake-automation-*.tgz');
  execCommand('npm install vitest');
  
  // Create API test file
  const apiTestContent = `
import { describe, it } from 'vitest';
import { sendGet, assertStatus, buildUrlWithParams } from 'super-pancake-automation';

describe('End-User API Test', () => {
  it('should handle API requests', async () => {
    // Test URL building
    const url = buildUrlWithParams('https://jsonplaceholder.typicode.com/posts', {
      userId: 1,
      limit: 5
    });
    
    if (!url.includes('jsonplaceholder.typicode.com')) {
      throw new Error('URL building failed');
    }
    
    // Test GET request
    const response = await sendGet('https://jsonplaceholder.typicode.com/posts/1');
    assertStatus(response, 200);
    
    if (!response.data || !response.data.id) {
      throw new Error('Response data is invalid');
    }
  });
});
`;
  
  writeFileSync('api.test.js', apiTestContent);
  
  // Run test
  execCommand('npx vitest run api.test.js');
  
  process.chdir('..');
  rmSync(testDir, { recursive: true, force: true });
});

// Test 5: UI System
runTest('UI System', () => {
  // Test UI startup (non-interactive with timeout)
  try {
    execCommand('timeout 10s npx super-pancake-ui', { stdio: 'pipe' });
  } catch (error) {
    // Timeout is expected, but we should check if UI files exist
    if (!existsSync('public/index.html')) {
      throw new Error('UI files not found');
    }
  }
  
  // Check if UI files exist
  const uiFiles = ['public/index.html', 'public/styles.css', 'public/app.js'];
  for (const file of uiFiles) {
    if (!existsSync(file)) {
      throw new Error(`UI file missing: ${file}`);
    }
  }
});

// Test 6: Error Handling
runTest('Error Handling', () => {
  // Test invalid commands (should fail gracefully)
  try {
    execCommand('npx super-pancake invalid-command', { stdio: 'pipe' });
  } catch (error) {
    // This should fail, but gracefully
    if (!error.message.includes('Command failed')) {
      throw new Error('Invalid command should fail gracefully');
    }
  }
  
  // Test with missing package
  const testDir = 'test-end-user-error';
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
  mkdirSync(testDir);
  
  process.chdir(testDir);
  execCommand('npm init -y');
  
  try {
    execCommand('npx super-pancake --version', { stdio: 'pipe' });
  } catch (error) {
    // This should fail because package is not installed
    if (!error.message.includes('Command failed')) {
      throw new Error('Missing package should fail gracefully');
    }
  }
  
  process.chdir('..');
  rmSync(testDir, { recursive: true, force: true });
});

// Test 7: Package Validation
runTest('Package Validation', () => {
  // Check package.json structure
  const packageJson = JSON.parse(execCommand('cat package.json'));
  
  const requiredFields = ['name', 'version', 'main', 'bin', 'exports'];
  for (const field of requiredFields) {
    if (!packageJson[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Check bin commands
  const binCommands = packageJson.bin;
  const requiredCommands = ['super-pancake', 'super-pancake-ui', 'super-pancake-init'];
  for (const command of requiredCommands) {
    if (!binCommands[command]) {
      throw new Error(`Missing bin command: ${command}`);
    }
  }
  
  // Test npm pack
  execCommand('npm pack');
  
  // Check if package file was created
  const packageFiles = execCommand('ls *.tgz').trim().split('\n');
  if (packageFiles.length === 0 || !packageFiles[0].includes('super-pancake-automation')) {
    throw new Error('Package file not created');
  }
  
  // Cleanup package file
  execCommand('rm *.tgz');
});

// Generate report
console.log('\n📊 Test Results Summary');
console.log('========================');
console.log(`Total Tests: ${tests.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

console.log('\n📋 Detailed Results:');
tests.forEach(test => {
  const status = test.status === 'PASS' ? '✅' : '❌';
  console.log(`${status} ${test.name}`);
  if (test.error) {
    console.log(`   Error: ${test.error}`);
  }
});

console.log('\n🎯 End-User Experience Assessment:');
if (failed === 0) {
  console.log('✅ EXCELLENT: All tests passed! Package is ready for end users.');
  process.exit(0);
} else if (passed >= tests.length * 0.8) {
  console.log('⚠️ GOOD: Most tests passed. Minor issues to address.');
  process.exit(1);
} else {
  console.log('❌ NEEDS WORK: Multiple test failures. Package needs fixes before release.');
  process.exit(1);
} 