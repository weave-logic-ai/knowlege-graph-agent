/**
 * Jest Global Setup
 * Initializes test environment and global utilities
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep error and warn for debugging
  error: jest.fn(),
  warn: jest.fn(),
  // Suppress log, debug, info
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn()
};

// Global test utilities
global.testUtils = {
  /**
   * Wait for a specified duration
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Create a mock date
   */
  mockDate: (dateString) => {
    const mockDate = new Date(dateString);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    return mockDate;
  },

  /**
   * Restore real Date
   */
  restoreDate: () => {
    global.Date.mockRestore?.();
  }
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Increase timeout for integration tests
jest.setTimeout(10000);
