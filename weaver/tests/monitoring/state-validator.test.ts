/**
 * State Validator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StateValidator } from '../../src/monitoring/state-validator.js';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

describe('StateValidator', () => {
  let validator: StateValidator;
  const testFile = path.join(process.cwd(), '.weaver', 'test-file.txt');

  beforeEach(() => {
    validator = new StateValidator();
  });

  describe('File Validation', () => {
    it('should validate existing file', async () => {
      // Create test file
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'test content', 'utf-8');

      const result = await validator.validate({
        operation: 'test:file-read',
        files: [testFile],
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);

      // Cleanup
      await fs.unlink(testFile).catch(() => {});
    });

    it('should fail validation for missing file', async () => {
      const nonExistentFile = path.join(process.cwd(), 'non-existent.txt');

      const result = await validator.validate({
        operation: 'test:file-read',
        files: [nonExistentFile],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('does not exist');
    });
  });

  describe('Environment Validation', () => {
    it('should validate present environment variables', async () => {
      process.env['TEST_VAR'] = 'test-value';

      const result = await validator.validate({
        operation: 'test:env-check',
        requiredEnv: ['TEST_VAR'],
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);

      delete process.env['TEST_VAR'];
    });

    it('should fail validation for missing environment variables', async () => {
      const result = await validator.validate({
        operation: 'test:env-check',
        requiredEnv: ['MISSING_ENV_VAR'],
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required environment variable');
    });
  });

  describe('Resource Validation', () => {
    it('should validate sufficient memory', async () => {
      const result = await validator.validate({
        operation: 'test:resource-check',
        minMemoryMB: 10, // Low threshold
      });

      expect(result.valid).toBe(true);
      expect(result.metadata?.resources).toBeDefined();
    });

    it('should fail validation for insufficient memory', async () => {
      const result = await validator.validate({
        operation: 'test:resource-check',
        minMemoryMB: 1000000, // Impossibly high
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Insufficient memory');
    });
  });

  describe('Custom Validators', () => {
    it('should register and run custom validators', async () => {
      validator.registerValidator('custom-check', {
        name: 'custom-check',
        required: true,
        check: async () => ({
          valid: true,
          errors: [],
          warnings: [],
        }),
      });

      const result = await validator.validate({
        operation: 'test:custom',
      });

      expect(result.valid).toBe(true);
    });

    it('should fail when custom validator fails', async () => {
      validator.registerValidator('failing-check', {
        name: 'failing-check',
        required: true,
        check: async () => ({
          valid: false,
          errors: ['Custom validation failed'],
          warnings: [],
        }),
      });

      const result = await validator.validate({
        operation: 'test:custom-fail',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Quick Validation Methods', () => {
    it('should validate file operation', async () => {
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'test', 'utf-8');

      const result = await validator.validateFileOperation(testFile, false);

      expect(result.valid).toBe(true);

      await fs.unlink(testFile).catch(() => {});
    });

    it('should validate workflow execution', async () => {
      const result = await validator.validateWorkflowExecution('test-workflow');

      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should validate MCP execution', async () => {
      process.env['ANTHROPIC_API_KEY'] = 'test-key';

      const result = await validator.validateMCPExecution('test-tool');

      expect(result.valid).toBe(true);

      delete process.env['ANTHROPIC_API_KEY'];
    });
  });
});
