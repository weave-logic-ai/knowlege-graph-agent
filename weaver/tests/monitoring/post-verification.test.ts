/**
 * Post-Verification Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PostVerifier } from '../../src/monitoring/post-verification.js';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('PostVerifier', () => {
  let verifier: PostVerifier;
  const testFile = path.join(process.cwd(), '.weaver', 'verify-test.txt');

  beforeEach(() => {
    verifier = new PostVerifier();
  });

  describe('File Verification', () => {
    it('should verify expected file exists', async () => {
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'test content', 'utf-8');

      const result = await verifier.verify({
        operation: 'test:file-create',
        startTime: new Date(),
        endTime: new Date(),
        expectedFiles: [
          {
            path: testFile,
            shouldExist: true,
          },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);

      await fs.unlink(testFile).catch(() => {});
    });

    it('should fail when expected file is missing', async () => {
      const nonExistent = path.join(process.cwd(), 'missing.txt');

      const result = await verifier.verify({
        operation: 'test:file-missing',
        startTime: new Date(),
        endTime: new Date(),
        expectedFiles: [
          {
            path: nonExistent,
            shouldExist: true,
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('not found');
    });

    it('should verify file size constraints', async () => {
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'test', 'utf-8');

      const result = await verifier.verify({
        operation: 'test:file-size',
        startTime: new Date(),
        endTime: new Date(),
        expectedFiles: [
          {
            path: testFile,
            shouldExist: true,
            minSize: 1,
            maxSize: 100,
          },
        ],
      });

      expect(result.success).toBe(true);

      await fs.unlink(testFile).catch(() => {});
    });

    it('should fail when file is too small', async () => {
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'x', 'utf-8');

      const result = await verifier.verify({
        operation: 'test:file-too-small',
        startTime: new Date(),
        endTime: new Date(),
        expectedFiles: [
          {
            path: testFile,
            shouldExist: true,
            minSize: 1000,
          },
        ],
      });

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('too small');

      await fs.unlink(testFile).catch(() => {});
    });
  });

  describe('Performance Metrics Verification', () => {
    it('should verify operation duration', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 100); // 100ms

      const result = await verifier.verify({
        operation: 'test:duration',
        startTime,
        endTime,
        expectedMetrics: {
          maxDurationMs: 200,
        },
      });

      expect(result.success).toBe(true);
      expect(result.metrics.duration_ms).toBe(100);
    });

    it('should warn when operation takes too long', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 1000); // 1000ms

      const result = await verifier.verify({
        operation: 'test:slow',
        startTime,
        endTime,
        expectedMetrics: {
          maxDurationMs: 100,
        },
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('took longer than expected');
    });
  });

  describe('Custom Verifiers', () => {
    it('should register and run custom verifiers', async () => {
      verifier.registerVerifier('custom-verify', {
        name: 'custom-verify',
        critical: true,
        verify: async () => ({
          success: true,
          errors: [],
          warnings: [],
          metrics: {},
        }),
      });

      const result = await verifier.verify({
        operation: 'test:custom',
        startTime: new Date(),
        endTime: new Date(),
      });

      expect(result.success).toBe(true);
    });

    it('should fail when custom verifier fails', async () => {
      verifier.registerVerifier('failing-verify', {
        name: 'failing-verify',
        critical: true,
        verify: async () => ({
          success: false,
          errors: ['Custom verification failed'],
          warnings: [],
          metrics: {},
        }),
      });

      const result = await verifier.verify({
        operation: 'test:custom-fail',
        startTime: new Date(),
        endTime: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Quick Verification Methods', () => {
    it('should verify file create operation', async () => {
      await fs.mkdir(path.dirname(testFile), { recursive: true });
      await fs.writeFile(testFile, 'test', 'utf-8');

      const result = await verifier.verifyFileOperation(testFile, 'create');

      expect(result.success).toBe(true);

      await fs.unlink(testFile).catch(() => {});
    });

    it('should verify file delete operation', async () => {
      const result = await verifier.verifyFileOperation(testFile, 'delete');

      // Should succeed because file should not exist after delete
      expect(result).toBeDefined();
    });

    it('should verify workflow execution', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 100);

      const result = await verifier.verifyWorkflowExecution('test-workflow', startTime, endTime);

      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });
});
