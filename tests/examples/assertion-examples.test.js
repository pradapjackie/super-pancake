import { describe, it, expect } from 'vitest';
import {
  assertEqual,
  assertExists,
  assertTrue,
  assertContainsText,
  assertGreaterThan,
  assertTypeOf,
  assertLength,
  assertNotEqual,
  assertDeepEqual,
  assertNotExists,
  assertFalse,
  assertNotContainsText,
  assertGreaterThanOrEqual,
  assertLessThan,
  assertLessThanOrEqual,
  assertInstanceOf,
  assertArrayIncludes,
  assertArrayNotIncludes,
  assertMatch,
  assertNotMatch,
  assertInRange,
  assertEmpty,
  assertNotEmpty,
  assertThrows
} from 'super-pancake-automation';

describe('Assertion Examples', () => {
  it('should demonstrate basic assertions', () => {
    console.log('🧪 Testing basic assertions...');

    // Test string equality
    const userName = 'testuser123';
    assertEqual(userName, 'testuser123', 'Username should match expected value');

    // Test number comparison
    const responseTime = 250;
    assertGreaterThan(responseTime, 0, 'Response time should be positive');
    assertTrue(responseTime < 1000, 'Response time should be under 1 second');

    // Test type checking
    assertTypeOf(userName, 'string', 'Username should be a string');
    assertTypeOf(responseTime, 'number', 'Response time should be a number');

    console.log('✅ Basic assertions passed');
  });

  it('should demonstrate text and content assertions', () => {
    console.log('📝 Testing text assertions...');

    const pageTitle = 'Welcome to Super Pancake Automation Framework';
    const errorMessage = 'Error: Invalid credentials provided';
    const userList = ['admin', 'user1', 'user2', 'guest'];

    // Test text contains
    assertContainsText(pageTitle, 'Super Pancake', 'Page title should contain framework name');
    assertContainsText(errorMessage, 'Invalid credentials', 'Error should mention invalid credentials');

    // Test array length
    assertLength(userList, 4, 'User list should have 4 users');

    // Test existence
    assertExists(pageTitle, 'Page title should exist');
    assertExists(userList, 'User list should exist');

    console.log('✅ Text assertions passed');
  });

  it('should demonstrate practical automation assertions', () => {
    console.log('🎯 Testing practical automation scenarios...');

    // Simulate API response validation
    const apiResponse = {
      status: 200,
      data: {
        users: [
          { id: 1, name: 'John', email: 'john@example.com' },
          { id: 2, name: 'Jane', email: 'jane@example.com' }
        ],
        total: 2,
        page: 1
      },
      responseTime: 145
    };

    // Validate API response structure
    assertEqual(apiResponse.status, 200, 'API should return success status');
    assertExists(apiResponse.data, 'Response should contain data');
    assertLength(apiResponse.data.users, 2, 'Should return 2 users');
    assertGreaterThan(apiResponse.data.total, 0, 'Total should be greater than 0');
    assertTrue(apiResponse.responseTime < 1000, 'Response time should be acceptable');

    // Validate user data
    const firstUser = apiResponse.data.users[0];
    assertExists(firstUser.id, 'User should have ID');
    assertExists(firstUser.name, 'User should have name');
    assertContainsText(firstUser.email, '@', 'Email should contain @ symbol');

    console.log('✅ Practical automation assertions passed');
  });

  it('should show error handling in assertions', () => {
    console.log('🚨 Testing assertion error handling...');

    // Test that assertions properly throw errors for invalid conditions
    try {
      assertEqual('actual', 'expected', 'This should fail');
      expect.fail('Assertion should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('This should fail');
      console.log('✅ Error handling works correctly');
    }

    try {
      assertLength([1, 2], 5, 'Array length mismatch');
      expect.fail('Length assertion should have thrown an error');
    } catch (error) {
      expect(error.message).toContain('Array length mismatch');
      console.log('✅ Length assertion error handling works');
    }
  });
  // Additional grouped assertion examples
});

describe('Equality Assertions', () => {
  it('should assert not equal', () => {
    assertNotEqual(5, 10, '5 should not equal 10');
  });

  it('should assert not equal for strings', () => {
    assertNotEqual('foo', 'bar', '"foo" should not equal "bar"');
  });

  it('should assert deep equal', () => {
    assertDeepEqual({ a: 1 }, { a: 1 }, 'Objects should be deeply equal');
  });

  it('should assert deep equal with nested objects', () => {
    assertDeepEqual({ a: { b: 2 } }, { a: { b: 2 } }, 'Nested objects should be deeply equal');
  });
});

describe('Existence Assertions', () => {
  it('should assert value does not exist', () => {
    assertNotExists(undefined, 'Value should not exist');
  });

  it('should assert value does not exist (null)', () => {
    assertNotExists(null, 'Value should not exist (null)');
  });
});

describe('Boolean Assertions', () => {
  it('should assert false condition', () => {
    assertFalse(false, 'Condition should be false');
  });

  it('should assert false from expression', () => {
    assertFalse(2 > 5, '2 > 5 should be false');
  });
});

describe('Text Assertions', () => {
  it('should assert text does not contain value', () => {
    assertNotContainsText('Hello world', 'bye', 'Text should not contain "bye"');
  });

  it('should assert string does not contain number as text', () => {
    assertNotContainsText('hello', '123', 'Text should not contain "123"');
  });

  it('should assert match', () => {
    assertMatch('test@example.com', /^[\w.-]+@[\w.-]+\.\w+$/, 'Should match email regex');
  });

  it('should match string with hyphenated pattern', () => {
    assertMatch('abc-123', /^[a-z]+-\d+$/, 'Should match hyphenated pattern');
  });

  it('should assert not match', () => {
    assertNotMatch('hello', /^\d+$/, 'Should not match digits regex');
  });

  it('should not match letters pattern for number input', () => {
    assertNotMatch('123', /^[a-z]+$/, 'Should not match letter pattern');
  });
});

describe('Comparison Assertions', () => {
  it('should assert greater than or equal', () => {
    assertGreaterThanOrEqual(10, 10, '10 >= 10');
  });

  it('should assert greater than or equal with equal values', () => {
    assertGreaterThanOrEqual(20, 20, '20 >= 20');
  });

  it('should assert less than', () => {
    assertLessThan(5, 10, '5 < 10');
  });

  it('should assert less than with negative numbers', () => {
    assertLessThan(-1, 0, '-1 < 0');
  });

  it('should assert less than or equal', () => {
    assertLessThanOrEqual(5, 5, '5 <= 5');
  });

  it('should assert less than or equal with negative comparison', () => {
    assertLessThanOrEqual(-5, -1, '-5 <= -1');
  });
});

describe('Type Assertions', () => {
  it('should assert instance of', () => {
    assertInstanceOf([], Array, 'Should be instance of Array');
  });

  it('should assert instance of Date', () => {
    assertInstanceOf(new Date(), Date, 'Should be instance of Date');
  });
});

describe('Array Assertions', () => {
  it('should assert array includes item', () => {
    assertArrayIncludes([1, 2, 3], 2, 'Array should include 2');
  });

  it('should assert array includes string', () => {
    assertArrayIncludes(['a', 'b', 'c'], 'b', 'Array should include "b"');
  });

  it('should assert array does not include item', () => {
    assertArrayNotIncludes([1, 2, 3], 4, 'Array should not include 4');
  });

  it('should assert array does not include boolean', () => {
    assertArrayNotIncludes([true, false], null, 'Array should not include null');
  });
});

// Additional grouped assertion examples for remaining assertions
describe('Type and Length Assertions', () => {
  it('should assert type of string', () => {
    assertTypeOf('hello', 'string', 'Should be a string');
  });

  it('should assert type of number', () => {
    assertTypeOf(42, 'number', 'Should be a number');
  });

  it('should assert type of array', () => {
    assertTypeOf([], 'object', 'Array is of type object in JS');
  });

  it('should assert correct length', () => {
    assertLength([1, 2, 3], 3, 'Array should have length 3');
  });

  it('should assert string length', () => {
    assertLength('test', 4, 'String should have length 4');
  });

  it('should assert length of an empty string is 0', () => {
    const empty = '';
    assertLength(empty, 0, 'Expected empty string to have length 0');
  });
});

describe('Regex Match Assertions', () => {
  it('should match pattern', () => {
    assertMatch('abc123', /^[a-z]+\d+$/, 'Should match pattern');
  });

  it('should not match pattern', () => {
    assertNotMatch('123abc', /^[a-z]+\d+$/, 'Should not match pattern');
  });
});

describe('New Assertion Utilities', () => {
  it('should assert value is within a valid range', () => {
    assertInRange(15, 10, 20, '15 is between 10 and 20');
  });

  it('should validate empty string as empty', () => {
    assertEmpty('', 'Empty string should be empty');
  });

  it('should validate empty array as empty', () => {
    assertEmpty([], 'Empty array should be empty');
  });

  it('should validate empty object as empty', () => {
    assertEmpty({}, 'Empty object should be empty');
  });

  it('should validate string is not empty', () => {
    assertNotEmpty('hello', 'Non-empty string should pass');
  });

  it('should validate array is not empty', () => {
    assertNotEmpty([42], 'Non-empty array should pass');
  });

  it('should validate object is not empty', () => {
    assertNotEmpty({ key: 'value' }, 'Non-empty object should pass');
  });

  it('should confirm that function throws an error', () => {
    assertThrows(() => {
      throw new Error('expected error');
    }, 'Should throw error');
  });
});
// Negative assertion tests
describe('Negative Assertion Tests', () => {
  it('should fail when value is not in range', () => {
    try {
      assertInRange(100, 1, 10, 'Out of range');
      expect.fail('Expected range check to throw');
    } catch (err) {
      expect(err.message).toContain('Out of range');
    }
  });

  it('should fail when asserting non-empty as empty', () => {
    try {
      assertEmpty('non-empty', 'Should be empty');
      expect.fail();
    } catch (err) {
      expect(err.message).toContain('Should be empty');
    }
  });

  it('should fail when asserting empty as not empty', () => {
    try {
      assertNotEmpty('', 'Should not be empty');
      expect.fail();
    } catch (err) {
      expect(err.message).toContain('Should not be empty');
    }
  });

  it('should fail when function does not throw in assertThrows', () => {
    try {
      assertThrows(() => {}, 'Expected function to throw');
    } catch (err) {
      expect(err.message).toContain('Expected function to throw');
      return;
    }
    expect.fail('assertThrows did not throw when it should have');
  });

  it('should fail when lengths do not match', () => {
    try {
      assertLength([1, 2, 3], 2, 'Length mismatch');
      expect.fail();
    } catch (err) {
      expect(err.message).toContain('Length mismatch');
    }
  });

  it('should fail when values are not equal', () => {
    try {
      assertEqual(1, 2, 'Values should match');
      expect.fail();
    } catch (err) {
      expect(err.message).toContain('Values should match');
    }
  });

  it('should fail when text does not contain expected', () => {
    try {
      assertContainsText('hello world', 'bye', 'Missing text');
      expect.fail();
    } catch (err) {
      expect(err.message).toContain('Missing text');
    }
  });

  it('should fail when text contains unexpected text', () => {
    try {
      assertNotContainsText('hello world', 'hello', 'Should not contain text');
      expect.fail();
    } catch (err) {
      expect(err.message).toContain('Should not contain text');
    }
  });

  it('should fail if array does not include item', () => {
    try {
      assertArrayIncludes([1, 2], 3, 'Missing array item');
      expect.fail();
    } catch (err) {
      expect(err.message).toContain('Missing array item');
    }
  });

  it('should fail if array includes excluded item', () => {
    try {
      assertArrayNotIncludes([1, 2, 3], 2, 'Unexpected array item');
      expect.fail();
    } catch (err) {
      expect(err.message).toContain('Unexpected array item');
    }
  });

  it('should fail if value does not match regex', () => {
    try {
      assertMatch('test', /\d+/, 'Pattern mismatch');
      expect.fail();
    } catch (err) {
      expect(err.message).toContain('Pattern mismatch');
    }
  });

  it('should fail if value matches excluded regex', () => {
    try {
      assertNotMatch('123', /^\d+$/, 'Should not match pattern');
      expect.fail();
    } catch (err) {
      expect(err.message).toContain('Should not match pattern');
    }
  });
});