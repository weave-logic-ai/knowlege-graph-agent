/**
 * Error Taxonomy Tests
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorCategory,
  ErrorSeverity,
  classifyError,
  isRetryableError,
  isTransientError,
  isRateLimitError,
  isPermanentError,
  KnowledgeGraphError,
  createValidationError,
  createConfigurationError,
  createResourceError,
} from '../../src/utils/error-taxonomy.js';

describe('ErrorTaxonomy', () => {
  describe('classifyError', () => {
    describe('HTTP status codes', () => {
      it('should classify 429 as rate limit', () => {
        const error = { status: 429, message: 'Too Many Requests' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.RATE_LIMIT);
        expect(classified.retryable).toBe(true);
        expect(classified.severity).toBe(ErrorSeverity.WARNING);
        expect(classified.suggestedDelay).toBeGreaterThanOrEqual(5000);
      });

      it('should classify 500 as transient', () => {
        const error = { statusCode: 500, message: 'Internal Server Error' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.TRANSIENT);
        expect(classified.retryable).toBe(true);
      });

      it('should classify 502 as transient', () => {
        const error = { status: 502, message: 'Bad Gateway' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.TRANSIENT);
        expect(classified.retryable).toBe(true);
      });

      it('should classify 503 as transient', () => {
        const error = { status: 503, message: 'Service Unavailable' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.TRANSIENT);
        expect(classified.retryable).toBe(true);
      });

      it('should classify 504 as transient', () => {
        const error = { status: 504, message: 'Gateway Timeout' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.TRANSIENT);
        expect(classified.retryable).toBe(true);
      });

      it('should classify 400 as permanent', () => {
        const error = { status: 400, message: 'Bad Request' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.PERMANENT);
        expect(classified.retryable).toBe(false);
      });

      it('should classify 401 as permanent', () => {
        const error = { status: 401, message: 'Unauthorized' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.PERMANENT);
        expect(classified.retryable).toBe(false);
      });

      it('should classify 403 as permanent', () => {
        const error = { status: 403, message: 'Forbidden' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.PERMANENT);
        expect(classified.retryable).toBe(false);
      });

      it('should classify 404 as permanent', () => {
        const error = { status: 404, message: 'Not Found' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.PERMANENT);
        expect(classified.retryable).toBe(false);
      });

      it('should classify 422 as permanent', () => {
        const error = { status: 422, message: 'Unprocessable Entity' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.PERMANENT);
        expect(classified.retryable).toBe(false);
      });

      it('should extract status from nested response object', () => {
        const error = { response: { status: 429 }, message: 'Rate limited' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.RATE_LIMIT);
        expect(classified.statusCode).toBe(429);
      });
    });

    describe('Network error codes', () => {
      it('should classify ECONNREFUSED as network error', () => {
        const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.NETWORK);
        expect(classified.retryable).toBe(true);
        expect(classified.code).toBe('ECONNREFUSED');
      });

      it('should classify ECONNRESET as network error', () => {
        const error = { code: 'ECONNRESET', message: 'Connection reset' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.NETWORK);
        expect(classified.retryable).toBe(true);
      });

      it('should classify ETIMEDOUT as timeout error', () => {
        const error = { code: 'ETIMEDOUT', message: 'Connection timed out' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.TIMEOUT);
        expect(classified.retryable).toBe(true);
      });

      it('should classify ENOTFOUND as network error', () => {
        const error = { code: 'ENOTFOUND', message: 'DNS lookup failed' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.NETWORK);
        expect(classified.retryable).toBe(true);
      });

      it('should classify EAI_AGAIN as network error', () => {
        const error = { code: 'EAI_AGAIN', message: 'Temporary DNS failure' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.NETWORK);
        expect(classified.retryable).toBe(true);
      });
    });

    describe('Message-based classification', () => {
      it('should classify timeout message as timeout error', () => {
        const error = new Error('Request timed out after 30 seconds');
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.TIMEOUT);
        expect(classified.retryable).toBe(true);
      });

      it('should classify validation message as validation error', () => {
        const error = new Error('Validation failed: field is required');
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.VALIDATION);
        expect(classified.retryable).toBe(false);
      });

      it('should classify invalid message as validation error', () => {
        const error = new Error('Invalid input format');
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.VALIDATION);
        expect(classified.retryable).toBe(false);
      });

      it('should classify config message as configuration error', () => {
        const error = new Error('Missing API key in configuration');
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.CONFIGURATION);
        expect(classified.severity).toBe(ErrorSeverity.CRITICAL);
        expect(classified.retryable).toBe(false);
      });

      it('should classify environment message as configuration error', () => {
        const error = new Error('Environment variable not set');
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.CONFIGURATION);
        expect(classified.retryable).toBe(false);
      });

      it('should classify not found message as resource error', () => {
        const error = new Error('File not found: test.md');
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.RESOURCE);
        expect(classified.retryable).toBe(false);
      });

      it('should classify permission denied message as resource error', () => {
        const error = new Error('Permission denied');
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.RESOURCE);
        expect(classified.retryable).toBe(false);
      });

      it('should classify ENOENT code as resource error', () => {
        const error = { code: 'ENOENT', message: 'No such file' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.RESOURCE);
        expect(classified.retryable).toBe(false);
      });

      it('should classify EACCES code as resource error', () => {
        const error = { code: 'EACCES', message: 'Access denied' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.RESOURCE);
        expect(classified.retryable).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle null error', () => {
        const classified = classifyError(null);
        expect(classified.category).toBe(ErrorCategory.UNKNOWN);
        expect(classified.message).toBe('Null error');
      });

      it('should handle undefined error', () => {
        const classified = classifyError(undefined);
        expect(classified.category).toBe(ErrorCategory.UNKNOWN);
        expect(classified.message).toBe('Undefined error');
      });

      it('should handle string error', () => {
        const classified = classifyError('Something went wrong');
        expect(classified.message).toBe('Something went wrong');
      });

      it('should handle Error instance', () => {
        const error = new Error('Test error');
        const classified = classifyError(error);
        expect(classified.message).toBe('Test error');
        expect(classified.original).toBe(error);
      });

      it('should handle unknown object structure', () => {
        const error = { foo: 'bar' };
        const classified = classifyError(error);
        expect(classified.category).toBe(ErrorCategory.UNKNOWN);
      });
    });
  });

  describe('Helper functions', () => {
    it('isRetryableError should return true for transient errors', () => {
      expect(isRetryableError({ status: 503 })).toBe(true);
      expect(isRetryableError({ status: 429 })).toBe(true);
      expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true);
    });

    it('isRetryableError should return false for permanent errors', () => {
      expect(isRetryableError({ status: 400 })).toBe(false);
      expect(isRetryableError({ status: 404 })).toBe(false);
      expect(isRetryableError(new Error('Validation failed'))).toBe(false);
    });

    it('isTransientError should identify transient failures', () => {
      expect(isTransientError({ status: 503 })).toBe(true);
      expect(isTransientError({ code: 'ECONNRESET' })).toBe(true);
      expect(isTransientError(new Error('timed out'))).toBe(true);
    });

    it('isRateLimitError should identify rate limits', () => {
      expect(isRateLimitError({ status: 429 })).toBe(true);
      expect(isRateLimitError({ status: 503 })).toBe(false);
    });

    it('isPermanentError should identify permanent failures', () => {
      expect(isPermanentError({ status: 400 })).toBe(true);
      expect(isPermanentError(new Error('Validation error'))).toBe(true);
      expect(isPermanentError(new Error('config missing'))).toBe(true);
      expect(isPermanentError({ code: 'ENOENT' })).toBe(true);
    });
  });

  describe('KnowledgeGraphError', () => {
    it('should create error with default values', () => {
      const error = new KnowledgeGraphError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('KnowledgeGraphError');
      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.retryable).toBe(false);
    });

    it('should create error with custom options', () => {
      const error = new KnowledgeGraphError('Test error', {
        category: ErrorCategory.TRANSIENT,
        severity: ErrorSeverity.WARNING,
        retryable: true,
        code: 'TEST_ERROR',
        context: { foo: 'bar' },
      });

      expect(error.category).toBe(ErrorCategory.TRANSIENT);
      expect(error.severity).toBe(ErrorSeverity.WARNING);
      expect(error.retryable).toBe(true);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.context).toEqual({ foo: 'bar' });
    });

    it('should support cause option', () => {
      const cause = new Error('Original error');
      const error = new KnowledgeGraphError('Wrapped error', { cause });
      expect(error.cause).toBe(cause);
    });
  });

  describe('Error factory functions', () => {
    it('createValidationError should create validation error', () => {
      const error = createValidationError('Invalid field', { field: 'name' });
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.retryable).toBe(false);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.context).toEqual({ field: 'name' });
    });

    it('createConfigurationError should create config error', () => {
      const error = createConfigurationError('Missing API key');
      expect(error.category).toBe(ErrorCategory.CONFIGURATION);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.code).toBe('CONFIGURATION_ERROR');
    });

    it('createResourceError should create resource error', () => {
      const error = createResourceError('File not found', { path: '/test.md' });
      expect(error.category).toBe(ErrorCategory.RESOURCE);
      expect(error.code).toBe('RESOURCE_ERROR');
      expect(error.context).toEqual({ path: '/test.md' });
    });
  });
});
