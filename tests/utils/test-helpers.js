/**
 * Common Test Utilities and Helpers
 * Shared across all test suites
 */

/**
 * Create a mock HTTP client for testing
 */
function createMockHttpClient() {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn()
  };
}

/**
 * Create a mock note object
 */
function createMockNote(overrides = {}) {
  return {
    path: 'test/note.md',
    content: '# Test Note\n\nContent goes here.',
    metadata: {
      created: '2025-10-22T00:00:00Z',
      modified: '2025-10-22T00:00:00Z',
      tags: ['test'],
      ...overrides.metadata
    },
    ...overrides
  };
}

/**
 * Create a mock rule object
 */
function createMockRule(overrides = {}) {
  return {
    id: `rule-${Date.now()}`,
    name: 'Test Rule',
    condition: {
      type: 'property',
      field: 'tags',
      operator: 'contains',
      value: 'test'
    },
    action: {
      type: 'tag',
      value: 'processed'
    },
    priority: 5,
    enabled: true,
    ...overrides
  };
}

/**
 * Create a mock property visualization dataset
 */
function createMockPropertyData(count = 5) {
  return {
    properties: Array.from({ length: count }, (_, i) => ({
      id: `prop-${i}`,
      name: `property-${i}`,
      type: ['select', 'number', 'text', 'date'][i % 4],
      count: Math.floor(Math.random() * 100) + 10
    })),
    totalNotes: count * 20,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Wait for async operations to complete
 */
async function flushPromises() {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Create a spy that tracks call order
 */
function createOrderedSpy() {
  const calls = [];
  const spy = jest.fn((...args) => {
    calls.push({ timestamp: Date.now(), args });
  });
  spy.getCalls = () => calls;
  spy.getCallOrder = () => calls.map((c, i) => ({ index: i, ...c }));
  return spy;
}

/**
 * Assert that async function throws
 */
async function expectAsyncThrow(fn, errorMessage) {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    if (errorMessage) {
      expect(error.message).toContain(errorMessage);
    }
  }
}

/**
 * Create a timeout promise
 */
function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock DOM element
 */
function createMockElement(tag = 'div', attributes = {}) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

/**
 * Measure execution time
 */
async function measureTime(fn) {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

/**
 * Generate random data for testing
 */
function generateRandomData(count, generator) {
  return Array.from({ length: count }, (_, i) => generator(i));
}

/**
 * Deep clone object (for test data)
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Assert object matches schema
 */
function expectSchema(obj, schema) {
  Object.entries(schema).forEach(([key, expectedType]) => {
    expect(obj).toHaveProperty(key);
    if (expectedType !== null) {
      expect(typeof obj[key]).toBe(expectedType);
    }
  });
}

module.exports = {
  createMockHttpClient,
  createMockNote,
  createMockRule,
  createMockPropertyData,
  flushPromises,
  createOrderedSpy,
  expectAsyncThrow,
  timeout,
  createMockElement,
  measureTime,
  generateRandomData,
  deepClone,
  expectSchema
};
