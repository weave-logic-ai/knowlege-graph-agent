/**
 * Configuration Schema Tests
 */

import { describe, it, expect } from 'vitest';
import { isSensitiveKey, maskSensitiveValue } from '../../../src/config/schema.js';

describe('Configuration Schema', () => {
  describe('isSensitiveKey', () => {
    it('should detect API keys', () => {
      expect(isSensitiveKey('apiKey')).toBe(true);
      expect(isSensitiveKey('anthropicApiKey')).toBe(true);
      expect(isSensitiveKey('googleApiKey')).toBe(true);
    });

    it('should detect passwords', () => {
      expect(isSensitiveKey('password')).toBe(true);
      expect(isSensitiveKey('userPassword')).toBe(true);
    });

    it('should detect tokens', () => {
      expect(isSensitiveKey('token')).toBe(true);
      expect(isSensitiveKey('authToken')).toBe(true);
    });

    it('should detect secrets', () => {
      expect(isSensitiveKey('secret')).toBe(true);
      expect(isSensitiveKey('clientSecret')).toBe(true);
    });

    it('should not flag non-sensitive keys', () => {
      expect(isSensitiveKey('port')).toBe(false);
      expect(isSensitiveKey('logLevel')).toBe(false);
      expect(isSensitiveKey('enabled')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isSensitiveKey('ApiKey')).toBe(true);
      expect(isSensitiveKey('PASSWORD')).toBe(true);
    });
  });

  describe('maskSensitiveValue', () => {
    it('should mask short values completely', () => {
      expect(maskSensitiveValue('abc')).toBe('***');
      expect(maskSensitiveValue('ab')).toBe('***');
    });

    it('should show first 4 characters and mask rest', () => {
      const masked = maskSensitiveValue('sk-ant-1234567890abcdef');
      expect(masked).toMatch(/^sk-a\*+$/);
      expect(masked.startsWith('sk-a')).toBe(true);
    });

    it('should limit mask length', () => {
      const longValue = 'x'.repeat(100);
      const masked = maskSensitiveValue(longValue);

      // First 4 chars + max 20 asterisks
      expect(masked.length).toBeLessThanOrEqual(24);
    });

    it('should handle empty strings', () => {
      expect(maskSensitiveValue('')).toBe('***');
    });
  });
});
