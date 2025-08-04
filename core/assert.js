import util from 'util';

function format(value) {
  return util.inspect(value, { depth: 3, colors: false });
}

// Global assertion tracking
if (!global.assertionResults) {
  global.assertionResults = [];
}

function trackAssertion(type, passed, message, error = null) {
  const assertion = {
    type,
    passed,
    message,
    error: error ? error.message : null,
    timestamp: new Date().toISOString(),
    id: `assertion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  global.assertionResults.push(assertion);
  return assertion;
}

export function assertEqual(actual, expected, msg = '') {
  try {
    if (actual !== expected) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected: ${format(expected)}\nActual: ${format(actual)}`);
      trackAssertion('assertEqual', false, msg, error);
      throw error;
    }
    trackAssertion('assertEqual', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertEqual', false, msg, error);
    }
    throw error;
  }
}

export function assertNotEqual(actual, expected, msg = '') {
  try {
    if (actual === expected) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected NOT to equal: ${format(expected)}`);
      trackAssertion('assertNotEqual', false, msg, error);
      throw error;
    }
    trackAssertion('assertNotEqual', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertNotEqual', false, msg, error);
    }
    throw error;
  }
}

export function assertDeepEqual(actual, expected, msg = '') {
  try {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected (deep): ${format(expected)}\nActual: ${format(actual)}`);
      trackAssertion('assertDeepEqual', false, msg, error);
      throw error;
    }
    trackAssertion('assertDeepEqual', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertDeepEqual', false, msg, error);
    }
    throw error;
  }
}

export function assertExists(value, msg = '') {
  try {
    if (value === undefined || value === null) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected value to exist but got: ${format(value)}`);
      trackAssertion('assertExists', false, msg, error);
      throw error;
    }
    trackAssertion('assertExists', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertExists', false, msg, error);
    }
    throw error;
  }
}

export function assertNotExists(value, msg = '') {
  try {
    if (value !== undefined && value !== null) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected value to be null/undefined but got: ${format(value)}`);
      trackAssertion('assertNotExists', false, msg, error);
      throw error;
    }
    trackAssertion('assertNotExists', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertNotExists', false, msg, error);
    }
    throw error;
  }
}

export function assertTrue(condition, msg = '') {
  try {
    if (!condition) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected condition to be true`);
      trackAssertion('assertTrue', false, msg, error);
      throw error;
    }
    trackAssertion('assertTrue', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertTrue', false, msg, error);
    }
    throw error;
  }
}

export function assertFalse(condition, msg = '') {
  try {
    if (condition) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected condition to be false`);
      trackAssertion('assertFalse', false, msg, error);
      throw error;
    }
    trackAssertion('assertFalse', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertFalse', false, msg, error);
    }
    throw error;
  }
}

export function assertContainsText(actual, expected, msg = '') {
  try {
    if (typeof actual !== 'string' || !actual.includes(expected)) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected text to include: "${expected}"\nActual: ${format(actual)}`);
      trackAssertion('assertContainsText', false, msg, error);
      throw error;
    }
    trackAssertion('assertContainsText', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertContainsText', false, msg, error);
    }
    throw error;
  }
}

export function assertNotContainsText(actual, expected, msg = '') {
  try {
    if (typeof actual === 'string' && actual.includes(expected)) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected text NOT to include: "${expected}"\nActual: ${format(actual)}`);
      trackAssertion('assertNotContainsText', false, msg, error);
      throw error;
    }
    trackAssertion('assertNotContainsText', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertNotContainsText', false, msg, error);
    }
    throw error;
  }
}

export function assertGreaterThan(actual, threshold, msg = '') {
  try {
    if (!(actual > threshold)) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected ${actual} > ${threshold}`);
      trackAssertion('assertGreaterThan', false, msg, error);
      throw error;
    }
    trackAssertion('assertGreaterThan', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertGreaterThan', false, msg, error);
    }
    throw error;
  }
}

export function assertGreaterThanOrEqual(actual, threshold, msg = '') {
  try {
    if (!(actual >= threshold)) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected ${actual} >= ${threshold}`);
      trackAssertion('assertGreaterThanOrEqual', false, msg, error);
      throw error;
    }
    trackAssertion('assertGreaterThanOrEqual', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertGreaterThanOrEqual', false, msg, error);
    }
    throw error;
  }
}

export function assertLessThan(actual, threshold, msg = '') {
  try {
    if (!(actual < threshold)) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected ${actual} < ${threshold}`);
      trackAssertion('assertLessThan', false, msg, error);
      throw error;
    }
    trackAssertion('assertLessThan', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertLessThan', false, msg, error);
    }
    throw error;
  }
}

export function assertLessThanOrEqual(actual, threshold, msg = '') {
  try {
    if (!(actual <= threshold)) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected ${actual} <= ${threshold}`);
      trackAssertion('assertLessThanOrEqual', false, msg, error);
      throw error;
    }
    trackAssertion('assertLessThanOrEqual', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertLessThanOrEqual', false, msg, error);
    }
    throw error;
  }
}

export function assertTypeOf(value, type, msg = '') {
  try {
    if (typeof value !== type) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected type "${type}" but got "${typeof value}"`);
      trackAssertion('assertTypeOf', false, msg, error);
      throw error;
    }
    trackAssertion('assertTypeOf', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertTypeOf', false, msg, error);
    }
    throw error;
  }
}

export function assertInstanceOf(value, constructor, msg = '') {
  try {
    if (!(value instanceof constructor)) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected instance of ${constructor.name}`);
      trackAssertion('assertInstanceOf', false, msg, error);
      throw error;
    }
    trackAssertion('assertInstanceOf', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertInstanceOf', false, msg, error);
    }
    throw error;
  }
}

export function assertArrayIncludes(array, item, msg = '') {
  try {
    if (!Array.isArray(array) || !array.includes(item)) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected array to include: ${format(item)}\nArray: ${format(array)}`);
      trackAssertion('assertArrayIncludes', false, msg, error);
      throw error;
    }
    trackAssertion('assertArrayIncludes', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertArrayIncludes', false, msg, error);
    }
    throw error;
  }
}

export function assertArrayNotIncludes(array, item, msg = '') {
  try {
    if (Array.isArray(array) && array.includes(item)) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected array NOT to include: ${format(item)}\nArray: ${format(array)}`);
      trackAssertion('assertArrayNotIncludes', false, msg, error);
      throw error;
    }
    trackAssertion('assertArrayNotIncludes', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertArrayNotIncludes', false, msg, error);
    }
    throw error;
  }
}

export function assertLength(value, expectedLength, msg = '') {
  try {
    if (value == null || typeof value.length !== 'number' || value.length !== expectedLength) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected length: ${expectedLength}, but got: ${value.length}`);
      trackAssertion('assertLength', false, msg, error);
      throw error;
    }
    trackAssertion('assertLength', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertLength', false, msg, error);
    }
    throw error;
  }
}

export function assertMatch(value, regex, msg = '') {
  try {
    if (!regex.test(value)) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected value to match regex ${regex}\nActual: ${format(value)}`);
      trackAssertion('assertMatch', false, msg, error);
      throw error;
    }
    trackAssertion('assertMatch', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertMatch', false, msg, error);
    }
    throw error;
  }
}

export function assertNotMatch(value, regex, msg = '') {
  try {
    if (regex.test(value)) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected value NOT to match regex ${regex}\nActual: ${format(value)}`);
      trackAssertion('assertNotMatch', false, msg, error);
      throw error;
    }
    trackAssertion('assertNotMatch', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertNotMatch', false, msg, error);
    }
    throw error;
  }
}

export function assertInRange(actual, min, max, msg = '') {
  try {
    if (typeof actual !== 'number' || actual < min || actual > max) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected value ${actual} to be between ${min} and ${max}`);
      trackAssertion('assertInRange', false, msg, error);
      throw error;
    }
    trackAssertion('assertInRange', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertInRange', false, msg, error);
    }
    throw error;
  }
}

export function assertEmpty(value, msg = '') {
  try {
    if (
      value == null ||
      (typeof value === 'string' && value !== '') ||
      (Array.isArray(value) && value.length !== 0) ||
      (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length !== 0)
    ) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected value to be empty but got: ${format(value)}`);
      trackAssertion('assertEmpty', false, msg, error);
      throw error;
    }
    trackAssertion('assertEmpty', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertEmpty', false, msg, error);
    }
    throw error;
  }
}

export function assertNotEmpty(value, msg = '') {
  try {
    if (
      value == null ||
      (typeof value === 'string' && value === '') ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
    ) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected non-empty value but got: ${format(value)}`);
      trackAssertion('assertNotEmpty', false, msg, error);
      throw error;
    }
    trackAssertion('assertNotEmpty', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertNotEmpty', false, msg, error);
    }
    throw error;
  }
}

export function assertThrows(fn, msg = '') {
  try {
    let threw = false;
    try {
      fn();
    } catch {
      threw = true;
    }
    if (!threw) {
      const error = new Error(`❌ FAIL: ${msg}\nExpected function to throw an error`);
      trackAssertion('assertThrows', false, msg, error);
      throw error;
    }
    trackAssertion('assertThrows', true, msg);
    console.log(`✅ PASS: ${msg}`);
  } catch (error) {
    if (!error.message.includes('❌ FAIL:')) {
      trackAssertion('assertThrows', false, msg, error);
    }
    throw error;
  }
}

// Export functions to get assertion results
export function getAssertionResults() {
  return global.assertionResults || [];
}

export function clearAssertionResults() {
  global.assertionResults = [];
}

export function getAssertionStats() {
  const results = getAssertionResults();
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => r.passed === false).length;
  
  return {
    total: results.length,
    passed,
    failed,
    passRate: results.length > 0 ? ((passed / results.length) * 100).toFixed(1) : 0
  };
}
