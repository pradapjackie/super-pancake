import { describe, it, beforeAll, afterAll } from 'vitest';
import {
  // Test environment setup
  createTestEnvironment,
  cleanupTestEnvironment,
  
  // DOM operations (v2 API)
  enableDOM,
  navigateTo,
  
  // All assertion functions from assert.js
  assertEqual,
  assertNotEqual,
  assertDeepEqual,
  assertExists,
  assertNotExists,
  assertTrue,
  assertFalse,
  assertContainsText,
  assertNotContainsText,
  assertGreaterThan,
  assertGreaterThanOrEqual,
  assertLessThan,
  assertLessThanOrEqual,
  assertTypeOf,
  assertInstanceOf,
  assertArrayIncludes,
  assertArrayNotIncludes,
  assertLength,
  assertMatch,
  assertNotMatch,
  assertInRange,
  assertEmpty,
  assertNotEmpty,
  assertThrows,
  
  // Reporting
  writeReport
} from 'super-pancake-automation';

// Get project config function
async function getProjectConfig() {
  try {
    const fs = await import('fs');
    const configPath = './super-pancake.config.js';
    if (fs.existsSync(configPath)) {
      const config = await import('./super-pancake.config.js');
      return config.default || config;
    }
  } catch (error) {
    console.warn('Could not load project config, using defaults');
  }
  return {};
}

const projectName = process.env.PROJECT_NAME || 'Super Pancake Project';

let testEnv;

describe(`${projectName} Assertion Validation Tests`, () => {
  beforeAll(async () => {
    console.log(`Setting up ${projectName} assertion validation tests...`);
    const config = await getProjectConfig();
    const isHeadless = config.headless !== false; // default to headless
    
    testEnv = await createTestEnvironment({ 
      headed: !isHeadless,
      port: 9224,    // Use different port to avoid conflicts
      testName: `${projectName} Assertion Tests`
    });
    
    // Enable DOM operations once for all tests
    await enableDOM();
    
    console.log('Test environment ready');
  });

  afterAll(async () => {
    console.log(`Cleaning up ${projectName} assertion test environment...`);
    await cleanupTestEnvironment(testEnv, `${projectName} Assertion Tests`);
    await writeReport();
    console.log('Assertion validation test report generated');
  });

  it('should test assertEqual assertion', async () => {
    console.log('Testing assertEqual assertions...');
    
    // Test equal strings
    assertEqual('hello', 'hello', 'Strings should be equal');
    
    // Test equal numbers
    assertEqual(42, 42, 'Numbers should be equal');
    
    // Test equal booleans
    assertEqual(true, true, 'Booleans should be equal');
    
    // Test equal null values
    assertEqual(null, null, 'Null values should be equal');
    
    console.log('assertEqual tests passed');
  });

  it('should test assertNotEqual assertion', async () => {
    console.log('Testing assertNotEqual assertions...');
    
    // Test different strings
    assertNotEqual('hello', 'world', 'Strings should not be equal');
    
    // Test different numbers
    assertNotEqual(42, 43, 'Numbers should not be equal');
    
    // Test different types
    assertNotEqual('42', 42, 'String and number should not be equal');
    
    // Test null vs undefined
    assertNotEqual(null, undefined, 'Null and undefined should not be equal');
    
    console.log('assertNotEqual tests passed');
  });

  it('should test assertDeepEqual assertion', async () => {
    console.log('Testing assertDeepEqual assertions...');
    
    // Test equal objects
    const obj1 = { name: 'John', age: 30, hobbies: ['reading', 'coding'] };
    const obj2 = { name: 'John', age: 30, hobbies: ['reading', 'coding'] };
    assertDeepEqual(obj1, obj2, 'Objects should be deeply equal');
    
    // Test equal arrays
    const arr1 = [1, 2, 3, { x: 10 }];
    const arr2 = [1, 2, 3, { x: 10 }];
    assertDeepEqual(arr1, arr2, 'Arrays should be deeply equal');
    
    // Test equal nested structures
    const nested1 = { user: { profile: { settings: { theme: 'dark' } } } };
    const nested2 = { user: { profile: { settings: { theme: 'dark' } } } };
    assertDeepEqual(nested1, nested2, 'Nested objects should be deeply equal');
    
    console.log('assertDeepEqual tests passed');
  });

  it('should test assertExists and assertNotExists assertions', async () => {
    console.log('Testing existence assertions...');
    
    // Test values that exist
    assertExists('hello', 'String should exist');
    assertExists(0, 'Zero should exist');
    assertExists(false, 'False should exist');
    assertExists([], 'Empty array should exist');
    assertExists({}, 'Empty object should exist');
    
    // Test values that don't exist
    assertNotExists(null, 'Null should not exist');
    assertNotExists(undefined, 'Undefined should not exist');
    
    console.log('Existence assertion tests passed');
  });

  it('should test assertTrue and assertFalse assertions', async () => {
    console.log('Testing boolean assertions...');
    
    // Test true conditions
    assertTrue(true, 'True literal should be true');
    assertTrue(1 === 1, 'Equality should be true');
    assertTrue('hello'.length > 0, 'String length should be greater than 0');
    assertTrue([1, 2, 3].includes(2), 'Array should include element');
    
    // Test false conditions
    assertFalse(false, 'False literal should be false');
    assertFalse(1 === 2, 'Inequality should be false');
    assertFalse(''.length > 0, 'Empty string length should not be greater than 0');
    assertFalse([1, 2, 3].includes(4), 'Array should not include element');
    
    console.log('Boolean assertion tests passed');
  });

  it('should test text content assertions', async () => {
    console.log('Testing text content assertions...');
    
    const sampleText = 'The quick brown fox jumps over the lazy dog';
    
    // Test text contains
    assertContainsText(sampleText, 'quick', 'Text should contain quick');
    assertContainsText(sampleText, 'fox', 'Text should contain fox');
    assertContainsText(sampleText, 'lazy dog', 'Text should contain lazy dog');
    
    // Test text does not contain
    assertNotContainsText(sampleText, 'elephant', 'Text should not contain elephant');
    assertNotContainsText(sampleText, 'QUICK', 'Text should not contain QUICK');
    assertNotContainsText(sampleText, 'xyz', 'Text should not contain xyz');
    
    console.log('Text content assertion tests passed');
  });

  it('should test numeric comparison assertions', async () => {
    console.log('Testing numeric comparison assertions...');
    
    const value = 50;
    
    // Test greater than
    assertGreaterThan(value, 49, '50 should be greater than 49');
    assertGreaterThan(100, 50, '100 should be greater than 50');
    
    // Test greater than or equal
    assertGreaterThanOrEqual(value, 50, '50 should be greater than or equal to 50');
    assertGreaterThanOrEqual(value, 49, '50 should be greater than or equal to 49');
    
    // Test less than
    assertLessThan(value, 51, '50 should be less than 51');
    assertLessThan(25, 50, '25 should be less than 50');
    
    // Test less than or equal
    assertLessThanOrEqual(value, 50, '50 should be less than or equal to 50');
    assertLessThanOrEqual(value, 51, '50 should be less than or equal to 51');
    
    console.log('Numeric comparison assertion tests passed');
  });

  it('should test type validation assertions', async () => {
    console.log('Testing type validation assertions...');
    
    // Test typeof assertions
    assertTypeOf('hello', 'string', 'Should be string type');
    assertTypeOf(42, 'number', 'Should be number type');
    assertTypeOf(true, 'boolean', 'Should be boolean type');
    assertTypeOf(undefined, 'undefined', 'Should be undefined type');
    assertTypeOf({}, 'object', 'Should be object type');
    assertTypeOf([], 'object', 'Array should be object type');
    assertTypeOf(() => {}, 'function', 'Should be function type');
    
    // Test instanceof assertions
    assertInstanceOf(new Date(), Date, 'Should be instance of Date');
    assertInstanceOf([], Array, 'Should be instance of Array');
    assertInstanceOf({}, Object, 'Should be instance of Object');
    assertInstanceOf(new Error('test'), Error, 'Should be instance of Error');
    
    console.log('Type validation assertion tests passed');
  });

  it('should test array validation assertions', async () => {
    console.log('Testing array validation assertions...');
    
    const fruits = ['apple', 'banana', 'orange', 'grape'];
    const numbers = [1, 2, 3, 4, 5];
    
    // Test array includes
    assertArrayIncludes(fruits, 'apple', 'Array should include apple');
    assertArrayIncludes(fruits, 'banana', 'Array should include banana');
    assertArrayIncludes(numbers, 3, 'Array should include number 3');
    
    // Test array does not include
    assertArrayNotIncludes(fruits, 'pineapple', 'Array should not include pineapple');
    assertArrayNotIncludes(fruits, 'kiwi', 'Array should not include kiwi');
    assertArrayNotIncludes(numbers, 10, 'Array should not include number 10');
    
    // Test array length
    assertLength(fruits, 4, 'Fruits array should have length 4');
    assertLength(numbers, 5, 'Numbers array should have length 5');
    assertLength('hello', 5, 'String should have length 5');
    assertLength('', 0, 'Empty string should have length 0');
    
    console.log('Array validation assertion tests passed');
  });

  it('should test regex pattern assertions', async () => {
    console.log('Testing regex pattern assertions...');
    
    const email = 'user@example.com';
    const phone = '123-456-7890';
    const invalidEmail = 'invalid-email';
    
    // Test regex matches
    assertMatch(email, /^[^@]+@[^@]+\.[^@]+$/, 'Should match email pattern');
    assertMatch(phone, /^\d{3}-\d{3}-\d{4}$/, 'Should match phone number pattern');
    assertMatch('Hello123', /^[A-Za-z0-9]+$/, 'Should match alphanumeric pattern');
    
    // Test regex does not match
    assertNotMatch(invalidEmail, /^[^@]+@[^@]+\.[^@]+$/, 'Should not match email pattern');
    assertNotMatch('hello world', /^\d+$/, 'Should not match digits only pattern');
    assertNotMatch('ABC', /^[a-z]+$/, 'Should not match lowercase only pattern');
    
    console.log('Regex pattern assertion tests passed');
  });

  it('should test range and boundary assertions', async () => {
    console.log('Testing range and boundary assertions...');
    
    // Test in range
    assertInRange(5, 1, 10, '5 should be in range 1-10');
    assertInRange(50, 0, 100, '50 should be in range 0-100');
    assertInRange(-5, -10, 0, '-5 should be in range -10 to 0');
    
    // Test boundary values
    assertInRange(1, 1, 10, '1 should be in range 1-10 (lower boundary)');
    assertInRange(10, 1, 10, '10 should be in range 1-10 (upper boundary)');
    
    console.log('Range and boundary assertion tests passed');
  });

  it('should test empty and non-empty assertions', async () => {
    console.log('Testing empty and non-empty assertions...');
    
    // Test empty values
    assertEmpty('', 'Empty string should be empty');
    assertEmpty([], 'Empty array should be empty');
    assertEmpty({}, 'Empty object should be empty');
    
    // Test non-empty values
    assertNotEmpty('hello', 'Non-empty string should not be empty');
    assertNotEmpty([1, 2, 3], 'Non-empty array should not be empty');
    assertNotEmpty({ key: 'value' }, 'Non-empty object should not be empty');
    assertNotEmpty(' ', 'String with space should not be empty');
    
    console.log('Empty and non-empty assertion tests passed');
  });

  it('should test error throwing assertions', async () => {
    console.log('Testing error throwing assertions...');
    
    // Test functions that should throw
    assertThrows(() => {
      throw new Error('This should throw');
    }, 'Function should throw an error');
    
    assertThrows(() => {
      JSON.parse('invalid json');
    }, 'JSON.parse with invalid input should throw');
    
    assertThrows(() => {
      const obj = null;
      obj.someProperty; // This will throw TypeError
    }, 'Accessing property on null should throw');
    
    assertThrows(() => {
      const func = undefined;
      func(); // This will throw TypeError
    }, 'Calling undefined as function should throw');
    
    console.log('Error throwing assertion tests passed');
  });

  it('should test complex data validation scenarios', async () => {
    console.log('Testing complex data validation scenarios...');
    
    // Test a complete user object validation
    const user = {
      id: 123,
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: 30,
      isActive: true,
      roles: ['user', 'admin'],
      profile: {
        avatar: 'https://example.com/avatar.jpg',
        bio: 'Software developer with 5+ years experience',
        settings: {
          theme: 'dark',
          notifications: true
        }
      },
      createdAt: '2024-01-15T10:30:00Z'
    };
    
    // Validate user object structure
    assertExists(user, 'User object should exist');
    assertTypeOf(user, 'object', 'User should be an object');
    
    // Validate user properties
    assertTypeOf(user.id, 'number', 'User ID should be a number');
    assertGreaterThan(user.id, 0, 'User ID should be positive');
    
    assertTypeOf(user.name, 'string', 'User name should be a string');
    assertNotEmpty(user.name, 'User name should not be empty');
    assertContainsText(user.name, 'John', 'User name should contain John');
    
    assertMatch(user.email, /^[^@]+@[^@]+\.[^@]+$/, 'Email should be valid format');
    
    assertTypeOf(user.age, 'number', 'User age should be a number');
    assertInRange(user.age, 18, 120, 'User age should be in valid range');
    
    assertTypeOf(user.isActive, 'boolean', 'isActive should be boolean');
    assertTrue(user.isActive, 'User should be active');
    
    // Validate array properties
    assertInstanceOf(user.roles, Array, 'Roles should be an array');
    assertLength(user.roles, 2, 'User should have 2 roles');
    assertArrayIncludes(user.roles, 'user', 'Should include user role');
    assertArrayIncludes(user.roles, 'admin', 'Should include admin role');
    
    // Validate nested object
    assertExists(user.profile, 'Profile should exist');
    assertTypeOf(user.profile.bio, 'string', 'Bio should be a string');
    assertContainsText(user.profile.bio, 'developer', 'Bio should mention developer');
    
    // Validate deeply nested properties
    assertExists(user.profile.settings, 'Settings should exist');
    assertEqual(user.profile.settings.theme, 'dark', 'Theme should be dark');
    assertTrue(user.profile.settings.notifications, 'Notifications should be enabled');
    
    // Validate timestamp format
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    assertMatch(user.createdAt, isoRegex, 'CreatedAt should be ISO format');
    
    console.log('Complex data validation tests passed');
  });

  it('should test web navigation with data URL and assertions', async () => {
    console.log('Testing web navigation with assertions...');
    
    // Create a simple HTML page with data URL to test DOM interactions
    const htmlContent = [
      '<html>',
      '  <head>',
      '    <title>Sample Test Page</title>',
      '  </head>',
      '  <body>',
      '    <h1>Welcome to Sample Test</h1>',
      '    <p id="message">This is a test message</p>',
      '    <div class="container">',
      '      <ul id="list">',
      '        <li>Item 1</li>',
      '        <li>Item 2</li>',
      '        <li>Item 3</li>',
      '      </ul>',
      '    </div>',
      '    <script>',
      '      setTimeout(() => {',
      '        document.getElementById("message").textContent = "Updated message";',
      '      }, 100);',
      '    </script>',
      '  </body>',
      '</html>'
    ].join('\n');
    
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
    
    // Navigate to the test page
    await navigateTo(dataUrl);
    
    // Wait a moment for the page to load and script to execute
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Test that we can use assertions with actual web content
    const currentUrl = dataUrl;
    assertContainsText(currentUrl, 'data:text/html', 'URL should contain data:text/html');
    assertContainsText(currentUrl, 'Sample Test Page', 'URL should contain page title');
    
    // Test URL structure
    assertTrue(currentUrl.startsWith('data:'), 'Should be a data URL');
    assertGreaterThan(currentUrl.length, 100, 'URL should be substantial length');
    
    console.log('Web navigation with assertions tests passed');
  });

  it('should test performance and timing assertions', async () => {
    console.log('Testing performance and timing assertions...');
    
    // Test execution time measurement
    const startTime = Date.now();
    
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Validate timing
    assertGreaterThanOrEqual(executionTime, 100, 'Execution time should be at least 100ms');
    assertLessThan(executionTime, 200, 'Execution time should be less than 200ms');
    assertInRange(executionTime, 90, 150, 'Execution time should be in expected range');
    
    // Test timestamp validation
    const timestamp = Date.now();
    assertTypeOf(timestamp, 'number', 'Timestamp should be a number');
    assertGreaterThan(timestamp, 1640000000000, 'Timestamp should be after 2022');
    
    console.log('Performance and timing assertion tests passed');
  });
});