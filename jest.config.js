/**
 * Jest Configuration for Weave-NN Testing
 * Comprehensive test setup with coverage thresholds
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directories for tests
  roots: ['<rootDir>/tests', '<rootDir>/src'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.{js,ts}',
    '**/?(*.)+(spec|test).{js,ts}'
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Coverage thresholds
  coverageThresholds: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/clients/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/agents/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/visualization/': {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },

  // Files to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}',
    '!src/**/__tests__/**'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', 'src'],

  // Transform settings
  transform: {
    '^.+\\.js$': 'babel-jest'
  },

  // Mock settings
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Timeout settings
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Module name mapper for aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  }
};
