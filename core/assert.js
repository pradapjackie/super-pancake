import util from 'util';

function format(value) {
  return util.inspect(value, { depth: 3, colors: false });
}

export function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`❌ FAIL: ${msg}\nExpected: ${format(expected)}\nActual: ${format(actual)}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertNotEqual(actual, expected, msg = '') {
  if (actual === expected) {
    throw new Error(`❌ FAIL: ${msg}\nExpected NOT to equal: ${format(expected)}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertDeepEqual(actual, expected, msg = '') {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(`❌ FAIL: ${msg}\nExpected (deep): ${format(expected)}\nActual: ${format(actual)}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertExists(value, msg = '') {
  if (value === undefined || value === null) {
    throw new Error(`❌ FAIL: ${msg}\nExpected value to exist but got: ${format(value)}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertNotExists(value, msg = '') {
  if (value !== undefined && value !== null) {
    throw new Error(`❌ FAIL: ${msg}\nExpected value to be null/undefined but got: ${format(value)}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertTrue(condition, msg = '') {
  if (!condition) {
    throw new Error(`❌ FAIL: ${msg}\nExpected condition to be true`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertFalse(condition, msg = '') {
  if (condition) {
    throw new Error(`❌ FAIL: ${msg}\nExpected condition to be false`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertContainsText(actual, expected, msg = '') {
  if (typeof actual !== 'string' || !actual.includes(expected)) {
    throw new Error(`❌ FAIL: ${msg}\nExpected text to include: "${expected}"\nActual: ${format(actual)}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertNotContainsText(actual, expected, msg = '') {
  if (typeof actual === 'string' && actual.includes(expected)) {
    throw new Error(`❌ FAIL: ${msg}\nExpected text NOT to include: "${expected}"\nActual: ${format(actual)}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertGreaterThan(actual, threshold, msg = '') {
  if (!(actual > threshold)) {
    throw new Error(`❌ FAIL: ${msg}\nExpected ${actual} > ${threshold}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertGreaterThanOrEqual(actual, threshold, msg = '') {
  if (!(actual >= threshold)) {
    throw new Error(`❌ FAIL: ${msg}\nExpected ${actual} >= ${threshold}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertLessThan(actual, threshold, msg = '') {
  if (!(actual < threshold)) {
    throw new Error(`❌ FAIL: ${msg}\nExpected ${actual} < ${threshold}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertLessThanOrEqual(actual, threshold, msg = '') {
  if (!(actual <= threshold)) {
    throw new Error(`❌ FAIL: ${msg}\nExpected ${actual} <= ${threshold}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertTypeOf(value, type, msg = '') {
  if (typeof value !== type) {
    throw new Error(`❌ FAIL: ${msg}\nExpected type "${type}" but got "${typeof value}"`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertInstanceOf(value, constructor, msg = '') {
  if (!(value instanceof constructor)) {
    throw new Error(`❌ FAIL: ${msg}\nExpected instance of ${constructor.name}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertArrayIncludes(array, item, msg = '') {
  if (!Array.isArray(array) || !array.includes(item)) {
    throw new Error(`❌ FAIL: ${msg}\nExpected array to include: ${format(item)}\nArray: ${format(array)}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertArrayNotIncludes(array, item, msg = '') {
  if (Array.isArray(array) && array.includes(item)) {
    throw new Error(`❌ FAIL: ${msg}\nExpected array NOT to include: ${format(item)}\nArray: ${format(array)}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertLength(value, expectedLength, msg = '') {
  if (!value || typeof value.length !== 'number' || value.length !== expectedLength) {
    throw new Error(`❌ FAIL: ${msg}\nExpected length: ${expectedLength}, but got: ${value.length}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertMatch(value, regex, msg = '') {
  if (!regex.test(value)) {
    throw new Error(`❌ FAIL: ${msg}\nExpected value to match regex ${regex}\nActual: ${format(value)}`);
  }
  console.log(`✅ PASS: ${msg}`);
}

export function assertNotMatch(value, regex, msg = '') {
  if (regex.test(value)) {
    throw new Error(`❌ FAIL: ${msg}\nExpected value NOT to match regex ${regex}\nActual: ${format(value)}`);
  }
  console.log(`✅ PASS: ${msg}`);
}
