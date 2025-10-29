/**
 * Error handling utilities for CLI commands
 * Provides user-friendly error messages and recovery suggestions
 */

import chalk from 'chalk';
import { formatError, formatWarning, formatInfo } from './formatting.js';
import {
  PackageJsonError,
  FileSystemError
} from '../../vault-init/scanner/types.js';

/**
 * Error with recovery suggestions
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public suggestions: string[] = [],
    public exitCode = 1
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

/**
 * Handle CLI errors with user-friendly messages
 */
export function handleError(error: unknown): void {
  console.error(); // Empty line for spacing

  if (error instanceof CLIError) {
    console.error(formatError(error.message));

    if (error.suggestions.length > 0) {
      console.error();
      console.error(formatInfo('Suggestions:'));
      error.suggestions.forEach((suggestion) => {
        console.error(formatInfo(`  • ${suggestion}`));
      });
    }

    return;
  }

  if (error instanceof PackageJsonError) {
    console.error(formatError('package.json Error'));
    console.error(formatError(error.message));
    console.error();
    console.error(formatInfo('Suggestions:'));
    console.error(formatInfo('  • Ensure package.json exists in the project root'));
    console.error(formatInfo('  • Verify package.json is valid JSON'));
    console.error(formatInfo('  • Check file permissions'));
    return;
  }

  if (error instanceof FileSystemError) {
    console.error(formatError('File System Error'));
    console.error(formatError(error.message));
    console.error();
    console.error(formatInfo('Suggestions:'));
    console.error(formatInfo('  • Verify the path exists and is accessible'));
    console.error(formatInfo('  • Check file permissions'));
    console.error(formatInfo('  • Ensure you have read/write access'));
    return;
  }

  if (error instanceof Error) {
    // Generic error handling
    console.error(formatError('An error occurred'));
    console.error(formatError(error.message));

    if (error.stack && process.env['DEBUG']) {
      console.error();
      console.error(chalk.gray('Stack trace:'));
      console.error(chalk.gray(error.stack));
    }

    console.error();
    console.error(formatInfo('For more details, run with DEBUG=true'));
    return;
  }

  // Unknown error type
  console.error(formatError('An unknown error occurred'));
  console.error(chalk.red(String(error)));
}

/**
 * Validation error
 */
export class ValidationError extends CLIError {
  constructor(message: string, suggestions: string[] = []) {
    super(message, suggestions, 1);
    this.name = 'ValidationError';
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends CLIError {
  constructor(message: string, suggestions: string[] = []) {
    super(message, suggestions, 1);
    this.name = 'ConfigurationError';
  }
}

/**
 * Network error
 */
export class NetworkError extends CLIError {
  constructor(message: string, suggestions: string[] = []) {
    const defaultSuggestions = [
      'Check your internet connection',
      'Verify proxy settings if applicable',
      'Try again later',
      ...suggestions,
    ];
    super(message, defaultSuggestions, 1);
    this.name = 'NetworkError';
  }
}

/**
 * Permission error
 */
export class PermissionError extends CLIError {
  constructor(message: string, suggestions: string[] = []) {
    const defaultSuggestions = [
      'Check file/directory permissions',
      'Ensure you have necessary access rights',
      'Try running with appropriate permissions',
      ...suggestions,
    ];
    super(message, defaultSuggestions, 1);
    this.name = 'PermissionError';
  }
}

/**
 * Assert condition with custom error
 */
export function assert(
  condition: boolean,
  message: string,
  suggestions: string[] = []
): asserts condition {
  if (!condition) {
    throw new CLIError(message, suggestions);
  }
}

/**
 * Validate file path
 */
export function validatePath(
  filePath: string,
  _type: 'file' | 'directory' = 'file'
): void {
  if (!filePath) {
    throw new ValidationError('Path cannot be empty', [
      'Provide a valid file or directory path',
    ]);
  }

  if (filePath.includes('..')) {
    throw new ValidationError('Path cannot contain ".."', [
      'Use absolute paths',
      'Avoid relative paths with parent directory references',
    ]);
  }
}

/**
 * Validate required option
 */
export function validateRequired<T>(
  value: T | undefined | null,
  name: string
): T {
  if (value === undefined || value === null) {
    throw new ValidationError(`${name} is required`, [
      `Provide ${name} via command line option`,
      'Use interactive prompts to set required options',
    ]);
  }
  return value;
}

/**
 * Validate one of options
 */
export function validateOneOf<T>(
  value: T,
  options: T[],
  name: string
): void {
  if (!options.includes(value)) {
    throw new ValidationError(
      `Invalid ${name}: ${value}`,
      [
        `Valid options are: ${options.join(', ')}`,
        'Check your command line arguments',
      ]
    );
  }
}

/**
 * Warn user about potential issues
 */
export function warn(message: string, details?: string[]): void {
  console.warn(formatWarning(message));

  if (details && details.length > 0) {
    details.forEach((detail) => {
      console.warn(formatInfo(`  • ${detail}`));
    });
  }
}

/**
 * Show deprecation warning
 */
export function deprecationWarning(
  feature: string,
  replacement?: string
): void {
  const message = replacement
    ? `${feature} is deprecated. Use ${replacement} instead.`
    : `${feature} is deprecated and will be removed in a future version.`;

  console.warn(formatWarning(message));
}

/**
 * Exit with error code
 */
export function exitWithError(
  message: string,
  suggestions: string[] = [],
  exitCode = 1
): never {
  throw new CLIError(message, suggestions, exitCode);
}

/**
 * Try-catch wrapper with error handling
 */
export async function tryOrError<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  suggestions: string[] = []
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      throw new CLIError(`${errorMessage}: ${error.message}`, suggestions);
    }
    throw new CLIError(errorMessage, suggestions);
  }
}
