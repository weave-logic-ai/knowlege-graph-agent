/**
 * Tests for Input Validation
 */

import { describe, it, expect } from 'vitest';
import {
  validateFilePath,
  filePathSchema,
  apiKeySchema,
  anthropicApiKeySchema,
  serverConfigSchema,
  validate,
  validateSafe,
  validateJson,
} from '../../src/security/validation.js';

describe('File Path Validation', () => {
  it('should accept valid file paths', () => {
    expect(() => filePathSchema.parse('src/index.ts')).not.toThrow();
    expect(() => filePathSchema.parse('path/to/file.txt')).not.toThrow();
    expect(() => filePathSchema.parse('config.json')).not.toThrow();
  });

  it('should reject directory traversal attempts', () => {
    expect(() => filePathSchema.parse('../../../etc/passwd')).toThrow();
    expect(() => filePathSchema.parse('path/../../../secret')).toThrow();
    expect(() => filePathSchema.parse('..')).toThrow();
  });

  it('should reject system directories', () => {
    expect(() => filePathSchema.parse('/etc/passwd')).toThrow();
    expect(() => filePathSchema.parse('/sys/config')).toThrow();
    expect(() => filePathSchema.parse('/proc/version')).toThrow();
  });

  it('should reject paths with invalid characters', () => {
    expect(() => filePathSchema.parse('file;rm -rf /')).toThrow();
    expect(() => filePathSchema.parse('file`whoami`')).toThrow();
    expect(() => filePathSchema.parse('file$VAR')).toThrow();
  });

  it('should validate file paths with base path', () => {
    const basePath = '/home/user/project';

    expect(() => validateFilePath('src/index.ts', basePath)).not.toThrow();
    expect(() => validateFilePath('../../../etc/passwd', basePath)).toThrow();
  });
});

describe('API Key Validation', () => {
  it('should accept valid API keys', () => {
    expect(() => apiKeySchema.parse('sk-1234567890abcdefghij')).not.toThrow();
    expect(() => apiKeySchema.parse('key_test_1234567890')).not.toThrow();
  });

  it('should reject too short API keys', () => {
    expect(() => apiKeySchema.parse('short')).toThrow();
  });

  it('should reject API keys with invalid characters', () => {
    expect(() => apiKeySchema.parse('sk-test@invalid!')).toThrow();
    expect(() => apiKeySchema.parse('sk test spaces')).toThrow();
  });

  it('should validate Anthropic API keys', () => {
    expect(() => anthropicApiKeySchema.parse('sk-ant-1234567890')).not.toThrow();
    expect(() => anthropicApiKeySchema.parse('invalid-key')).toThrow();
  });
});

describe('Server Configuration Validation', () => {
  it('should accept valid server configuration', () => {
    const config = {
      port: 3000,
      host: 'localhost',
    };

    expect(() => serverConfigSchema.parse(config)).not.toThrow();
  });

  it('should reject privileged ports', () => {
    const config = {
      port: 80,
      host: 'localhost',
    };

    expect(() => serverConfigSchema.parse(config)).toThrow();
  });

  it('should reject invalid port numbers', () => {
    expect(() => serverConfigSchema.parse({ port: 99999, host: 'localhost' })).toThrow();
    expect(() => serverConfigSchema.parse({ port: -1, host: 'localhost' })).toThrow();
  });

  it('should accept valid IP addresses', () => {
    expect(() => serverConfigSchema.parse({ port: 3000, host: '127.0.0.1' })).not.toThrow();
    expect(() => serverConfigSchema.parse({ port: 3000, host: '0.0.0.0' })).not.toThrow();
  });

  it('should reject invalid hosts', () => {
    expect(() => serverConfigSchema.parse({ port: 3000, host: 'invalid host' })).toThrow();
  });
});

describe('Validation Helper Functions', () => {
  it('should validate with context', () => {
    const schema = filePathSchema;

    expect(() => validate(schema, 'valid/path.ts', 'test file')).not.toThrow();

    try {
      validate(schema, '../../../etc/passwd', 'malicious file');
    } catch (error) {
      expect((error as Error).message).toContain('test file');
    }
  });

  it('should provide safe validation', () => {
    const schema = apiKeySchema;

    const validResult = validateSafe(schema, 'sk-valid-key-1234567890');
    expect(validResult.success).toBe(true);
    if (validResult.success) {
      expect(validResult.data).toBe('sk-valid-key-1234567890');
    }

    const invalidResult = validateSafe(schema, 'short');
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error).toBeTruthy();
    }
  });

  it('should validate JSON safely', () => {
    const validJson = '{"key": "value"}';
    expect(validateJson(validJson)).toEqual({ key: 'value' });

    const invalidJson = '{invalid}';
    expect(() => validateJson(invalidJson)).toThrow();

    const hugeJson = JSON.stringify({ data: 'x'.repeat(20_000_000) });
    expect(() => validateJson(hugeJson)).toThrow('too large');
  });
});

describe('Attack Prevention', () => {
  it('should prevent path traversal attacks', () => {
    const maliciousPaths = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '/etc/shadow',
      'test/../../../secret',
    ];

    maliciousPaths.forEach(path => {
      expect(() => filePathSchema.parse(path)).toThrow();
    });
  });

  it('should prevent command injection in paths', () => {
    const maliciousPaths = [
      'file;rm -rf /',
      'file`whoami`',
      'file$(cat /etc/passwd)',
      'file&& cat /etc/passwd',
    ];

    maliciousPaths.forEach(path => {
      expect(() => filePathSchema.parse(path)).toThrow();
    });
  });
});
