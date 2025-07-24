import { describe, it, expect } from 'vitest';
import { 
  assertEqual, 
  assertTrue, 
  assertFalse,
  assertContainsText,
  assertNotNull,
  assertExists,
  assertGreaterThan,
  assertTypeOf,
  assertLength,
  assertNotEqual,
  assertDeepEqual,
  assertNotExists,
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

describe('Core Assertion Functions', () => {
  it('should validate basic equality assertions', () => {
    expect(() => assertEqual('test', 'test', 'Values should be equal')).not.toThrow();
    expect(() => assertEqual(123, 123, 'Numbers should be equal')).not.toThrow();
    expect(() => assertEqual(true, true, 'Booleans should be equal')).not.toThrow();
    expect(() => assertNotEqual('test', 'different', 'Values should not be equal')).not.toThrow();
  });

  it('should validate boolean assertions', () => {
    expect(() => assertTrue(true, 'Should be true')).not.toThrow();
    expect(() => assertTrue(1, 'Truthy value should pass')).not.toThrow();
    expect(() => assertTrue('non-empty', 'Non-empty string should pass')).not.toThrow();
    expect(() => assertFalse(false, 'Should be false')).not.toThrow();
    expect(() => assertFalse(0, 'Falsy value should pass')).not.toThrow();
    expect(() => assertFalse('', 'Empty string should pass')).not.toThrow();
  });

  it('should validate text content assertions', () => {
    expect(() => assertContainsText('Hello World', 'World', 'Should contain text')).not.toThrow();
    expect(() => assertContainsText('Test String', 'Test', 'Should contain substring')).not.toThrow();
    expect(() => assertNotContainsText('Hello World', 'Goodbye', 'Should not contain text')).not.toThrow();
  });

  it('should validate existence assertions', () => {
    expect(() => assertExists('value', 'Should exist')).not.toThrow();
    expect(() => assertExists(0, 'Zero should exist')).not.toThrow();
    expect(() => assertExists(false, 'False should exist')).not.toThrow();
    expect(() => assertNotExists(null, 'Should not exist')).not.toThrow();
    expect(() => assertNotExists(undefined, 'Should not exist')).not.toThrow();
  });

  it('should validate comparison assertions', () => {
    expect(() => assertGreaterThan(10, 5, 'Should be greater than')).not.toThrow();
    expect(() => assertGreaterThanOrEqual(10, 10, 'Should be greater than or equal')).not.toThrow();
    expect(() => assertLessThan(5, 10, 'Should be less than')).not.toThrow();
    expect(() => assertLessThanOrEqual(10, 10, 'Should be less than or equal')).not.toThrow();
    expect(() => assertInRange(5, 1, 10, 'Should be in range')).not.toThrow();
  });

  it('should validate type and instance assertions', () => {
    expect(() => assertTypeOf('test', 'string', 'Should be string type')).not.toThrow();
    expect(() => assertTypeOf(123, 'number', 'Should be number type')).not.toThrow();
    expect(() => assertInstanceOf(new Date(), Date, 'Should be Date instance')).not.toThrow();
    expect(() => assertInstanceOf([], Array, 'Should be Array instance')).not.toThrow();
  });

  it('should validate array and collection assertions', () => {
    const testArray = ['apple', 'banana', 'cherry'];
    expect(() => assertLength(testArray, 3, 'Array should have length 3')).not.toThrow();
    expect(() => assertArrayIncludes(testArray, 'banana', 'Should include banana')).not.toThrow();
    expect(() => assertArrayNotIncludes(testArray, 'grape', 'Should not include grape')).not.toThrow();
    expect(() => assertNotEmpty(testArray, 'Array should not be empty')).not.toThrow();
    expect(() => assertEmpty([], 'Empty array should be empty')).not.toThrow();
  });

  it('should validate pattern matching assertions', () => {
    expect(() => assertMatch('test@example.com', /.*@.*\..*/,'Should match email pattern')).not.toThrow();
    expect(() => assertNotMatch('invalid-email', /.*@.*\..*/,'Should not match email pattern')).not.toThrow();
  });

  it('should validate deep equality assertions', () => {
    const obj1 = { name: 'test', value: 123 };
    const obj2 = { name: 'test', value: 123 };
    expect(() => assertDeepEqual(obj1, obj2, 'Objects should be deeply equal')).not.toThrow();
  });

  it('should validate error throwing assertions', () => {
    const throwingFunction = () => { throw new Error('Test error'); };
    const nonThrowingFunction = () => { return 'success'; };
    
    expect(() => assertThrows(throwingFunction, 'Should throw error')).not.toThrow();
    expect(() => assertThrows(nonThrowingFunction, 'Should throw error')).toThrow();
  });

  it('should handle assertion failures properly', () => {
    expect(() => assertEqual('test', 'different', 'Should fail')).toThrow();
    expect(() => assertTrue(false, 'Should fail')).toThrow();
    expect(() => assertFalse(true, 'Should fail')).toThrow();
    expect(() => assertContainsText('Hello', 'World', 'Should fail')).toThrow();
    expect(() => assertExists(null, 'Should fail')).toThrow();
    expect(() => assertGreaterThan(5, 10, 'Should fail')).toThrow();
  });
});

describe('Core Utility Functions', () => {
  it('should validate all assertion functions are available', () => {
    const assertionFunctions = [
      assertEqual, assertTrue, assertFalse, assertContainsText, assertExists,
      assertGreaterThan, assertTypeOf, assertLength, assertNotEqual, assertDeepEqual,
      assertNotExists, assertNotContainsText, assertGreaterThanOrEqual, assertLessThan,
      assertLessThanOrEqual, assertInstanceOf, assertArrayIncludes, assertArrayNotIncludes,
      assertMatch, assertNotMatch, assertInRange, assertEmpty, assertNotEmpty, assertThrows
    ];
    
    assertionFunctions.forEach(func => {
      expect(func).toBeDefined();
      expect(typeof func).toBe('function');
    });
  });
});