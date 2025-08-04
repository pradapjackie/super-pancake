import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  assertEqual,
  assertNotEqual,
  assertTrue,
  assertFalse,
  assertContainsText,
  getAssertionStats,
  clearAssertionResults
} from './core/assert.js';

describe('Simple Assertion Counting Demo', () => {
  beforeAll(() => {
    console.log('🧹 Clearing previous assertion results...');
    clearAssertionResults();
  });

  afterAll(() => {
    const stats = getAssertionStats();
    console.log('\n📊 FINAL ASSERTION STATISTICS:');
    console.log(`   Total Test Cases: 3 (it blocks)`);
    console.log(`   Total Assertions: ${stats.total}`);
    console.log(`   ✅ Passed: ${stats.passed}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   📈 Pass Rate: ${stats.passRate}%`);
    console.log('\n💡 This demonstrates the difference between test cases and individual assertions!');
  });

  it('should demonstrate multiple assertions in one test case', () => {
    console.log('🧪 Test Case 1: Multiple assertions');
    
    // This single test case contains 4 individual assertions
    assertEqual(1 + 1, 2, 'Basic addition');
    assertNotEqual(1 + 1, 3, 'Basic inequality');
    assertTrue(2 > 1, 'Greater than comparison');
    assertFalse(1 > 2, 'Less than comparison');
    
    console.log('✅ Test case 1 completed with 4 assertions');
  });

  it('should demonstrate text assertions', () => {
    console.log('🧪 Test Case 2: Text assertions');
    
    // This single test case contains 3 individual assertions
    assertContainsText('Hello World', 'Hello', 'Contains greeting');
    assertContainsText('Super Pancake', 'Pancake', 'Contains framework name');
    assertTrue('test'.length === 4, 'String length check');
    
    console.log('✅ Test case 2 completed with 3 assertions');
  });

  it('should demonstrate complex validation', () => {
    console.log('🧪 Test Case 3: Complex validation');
    
    // This single test case contains 5 individual assertions
    const user = {
      name: 'John',
      age: 30,
      active: true
    };
    
    assertTrue(user.name === 'John', 'User name validation');
    assertTrue(user.age > 18, 'User age validation');
    assertTrue(user.active === true, 'User active status');
    assertContainsText(user.name, 'John', 'Name contains expected value');
    assertTrue(typeof user.age === 'number', 'Age is a number');
    
    console.log('✅ Test case 3 completed with 5 assertions');
  });
}); 