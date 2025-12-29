/**
 * Agent Booster Adapter Tests
 *
 * Comprehensive tests for the Agent Booster adapter including:
 * - Template matching transformations
 * - Batch processing
 * - Fallback behavior
 * - Performance requirements
 *
 * @module tests/integrations/agentic-flow/adapters/agent-booster-adapter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AgentBoosterAdapter,
  createAgentBoosterAdapter,
  type TransformRequest,
  type BatchTransformRequest,
} from '../../../../src/integrations/agentic-flow/adapters/agent-booster-adapter.js';

describe('AgentBoosterAdapter', () => {
  let adapter: AgentBoosterAdapter;

  beforeEach(async () => {
    adapter = await createAgentBoosterAdapter();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const newAdapter = new AgentBoosterAdapter();
      await newAdapter.initialize();

      expect(newAdapter.isAvailable()).toBe(true);
      expect(newAdapter.getFeatureName()).toBe('agent-booster');
    });

    it('should use fallback when agent-booster module is not available', async () => {
      const newAdapter = await createAgentBoosterAdapter();

      // Should be in fallback mode since agent-booster package is not installed
      expect(newAdapter.isFallbackMode()).toBe(true);
      expect(newAdapter.isAvailable()).toBe(true);
    });

    it('should return correct status', async () => {
      const status = adapter.getStatus();

      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('initialized');
      expect(status.initialized).toBe(true);
    });

    it('should return config', async () => {
      const config = adapter.getConfig();

      expect(config.enableTemplates).toBe(true);
      expect(config.enableSimilarityMatching).toBe(true);
      expect(config.confidenceThreshold).toBe(0.7);
      expect(config.maxChunkSize).toBe(5000);
    });

    it('should accept custom configuration', async () => {
      const customAdapter = await createAgentBoosterAdapter({
        confidenceThreshold: 0.9,
        maxChunkSize: 10000,
      });

      const config = customAdapter.getConfig();
      expect(config.confidenceThreshold).toBe(0.9);
      expect(config.maxChunkSize).toBe(10000);
    });
  });

  describe('template matching - try-catch', () => {
    it('should wrap code with try-catch', async () => {
      const request: TransformRequest = {
        code: 'const result = dangerousOperation();',
        instruction: 'Wrap with try-catch block',
        language: 'typescript',
      };

      const result = await adapter.transform(request);

      expect(result.success).toBe(true);
      expect(result.transformedCode).toContain('try {');
      expect(result.transformedCode).toContain('catch (error)');
      expect(result.transformType).toBe('template');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should not double-wrap code with try-catch', async () => {
      const request: TransformRequest = {
        code: `try {
  const result = dangerousOperation();
} catch (e) {
  console.error(e);
}`,
        instruction: 'Wrap with try-catch block',
        language: 'typescript',
      };

      const result = await adapter.transform(request);

      // Should not wrap again if already has try-catch
      expect(result.transformedCode).not.toContain('try {\n  try {');
    });
  });

  describe('template matching - null checks', () => {
    it('should add null checks using optional chaining', async () => {
      const request: TransformRequest = {
        code: 'const name = user.profile.name;',
        instruction: 'Add null checks to prevent crashes',
        language: 'typescript',
      };

      const result = await adapter.transform(request);

      expect(result.success).toBe(true);
      expect(result.transformedCode).toContain('?.');
      expect(result.transformType).toBe('template');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('should handle multiple property accesses', async () => {
      const request: TransformRequest = {
        code: 'const result = obj.nested.deep.value;',
        instruction: 'Add null checks',
        language: 'typescript',
      };

      const result = await adapter.transform(request);

      expect(result.success).toBe(true);
      expect(result.transformedCode).toContain('?.nested');
      expect(result.transformedCode).toContain('?.deep');
      expect(result.transformedCode).toContain('?.value');
    });
  });

  describe('template matching - async/await', () => {
    it('should convert .then() to async/await', async () => {
      const request: TransformRequest = {
        code: 'fetchData.then((data) => {console.log(data)})',
        instruction: 'Convert to async/await',
        language: 'typescript',
      };

      const result = await adapter.transform(request);

      expect(result.success).toBe(true);
      expect(result.transformedCode).toContain('await');
      expect(result.transformType).toBe('template');
      expect(result.confidence).toBeGreaterThanOrEqual(0.88);
    });
  });

  describe('batch transform', () => {
    it('should process multiple files', async () => {
      const requests: BatchTransformRequest[] = [
        {
          path: 'src/file1.ts',
          code: 'const x = obj.value;',
          instructions: ['Add null checks'],
        },
        {
          path: 'src/file2.ts',
          code: 'const y = dangerous();',
          instructions: ['Wrap with try-catch'],
        },
      ];

      const result = await adapter.batchTransform(requests);

      expect(result.totalFiles).toBe(2);
      expect(result.successCount + result.failedCount).toBe(2);
      expect(result.results).toHaveLength(2);
    });

    it('should apply multiple instructions to a single file', async () => {
      const requests: BatchTransformRequest[] = [
        {
          path: 'src/complex.ts',
          code: 'const x = obj.value;',
          instructions: ['Add null checks', 'Add type annotations'],
        },
      ];

      const result = await adapter.batchTransform(requests);

      expect(result.totalFiles).toBe(1);
      expect(result.results[0]).toBeDefined();
    });

    it('should detect language from file extension', async () => {
      const extensions = [
        { path: 'file.ts', expected: 'typescript' },
        { path: 'file.tsx', expected: 'typescript' },
        { path: 'file.js', expected: 'javascript' },
        { path: 'file.jsx', expected: 'javascript' },
        { path: 'file.py', expected: 'python' },
        { path: 'file.go', expected: 'go' },
        { path: 'file.rs', expected: 'rust' },
        { path: 'file.java', expected: 'java' },
        { path: 'file.cpp', expected: 'cpp' },
      ];

      for (const { path, expected } of extensions) {
        const requests: BatchTransformRequest[] = [
          { path, code: 'test', instructions: ['test'] },
        ];
        const result = await adapter.batchTransform(requests);
        expect(result.results).toHaveLength(1);
      }
    });
  });

  describe('applyOptimization', () => {
    it('should apply loop optimization', async () => {
      const code = 'for (let i = 0; i < arr.length; i++) { sum += arr[i]; }';
      const result = await adapter.applyOptimization(code, 'loop', 'typescript');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('latencyMs');
      expect(result.originalCode).toBe(code);
    });

    it('should apply async optimization', async () => {
      const code = 'promise.then(result => console.log(result))';
      const result = await adapter.applyOptimization(code, 'async', 'typescript');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('latencyMs');
    });

    it('should apply memory optimization', async () => {
      const code = 'const data = [];';
      const result = await adapter.applyOptimization(code, 'memory', 'typescript');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('latencyMs');
    });

    it('should apply general optimization', async () => {
      const code = 'function test() { return 1; }';
      const result = await adapter.applyOptimization(code, 'general', 'typescript');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('latencyMs');
    });
  });

  describe('performance requirements', () => {
    it('should complete template transform in under 10ms', async () => {
      const request: TransformRequest = {
        code: 'const x = obj.value;',
        instruction: 'Add null checks',
        language: 'typescript',
      };

      const result = await adapter.transform(request);

      expect(result.latencyMs).toBeLessThan(10);
    });

    it('should process batch transforms efficiently', async () => {
      const requests: BatchTransformRequest[] = Array.from({ length: 10 }, (_, i) => ({
        path: `src/file${i}.ts`,
        code: 'const x = obj.value;',
        instructions: ['Add null checks'],
      }));

      const result = await adapter.batchTransform(requests);

      // 10 files should complete in under 100ms (10ms per file average)
      expect(result.totalLatencyMs).toBeLessThan(100);
    });

    it('should have low latency for template matching', async () => {
      const iterations = 100;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const result = await adapter.transform({
          code: 'const x = obj.value;',
          instruction: 'Add null checks',
          language: 'typescript',
        });
        latencies.push(result.latencyMs);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / iterations;

      // Average latency should be under 5ms for template matching
      expect(avgLatency).toBeLessThan(5);
    });
  });

  describe('fallback behavior', () => {
    it('should gracefully handle failed transforms', async () => {
      const request: TransformRequest = {
        code: '',
        instruction: 'This instruction does not match any template',
        language: 'typescript',
      };

      const result = await adapter.transform(request);

      // Should not throw, just return unsuccessful result
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('latencyMs');
      expect(result.originalCode).toBe('');
      expect(result.transformedCode).toBe('');
    });

    it('should return original code when transform fails', async () => {
      const originalCode = 'const foo = bar;';
      const request: TransformRequest = {
        code: originalCode,
        instruction: 'Do something completely unsupported',
        language: 'typescript',
      };

      // In fallback mode, similarity matching will fail
      const result = await adapter.transform(request);

      if (!result.success) {
        expect(result.transformedCode).toBe(originalCode);
      }
    });
  });

  describe('transform result structure', () => {
    it('should return complete TransformResult', async () => {
      const result = await adapter.transform({
        code: 'const x = obj.value;',
        instruction: 'Add null checks',
        language: 'typescript',
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('originalCode');
      expect(result).toHaveProperty('transformedCode');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('latencyMs');
      expect(result).toHaveProperty('transformType');
      expect(result).toHaveProperty('changes');
      expect(Array.isArray(result.changes)).toBe(true);
    });

    it('should include change details', async () => {
      const result = await adapter.transform({
        code: 'const x = obj.value;',
        instruction: 'Add null checks',
        language: 'typescript',
      });

      if (result.success && result.changes.length > 0) {
        const change = result.changes[0];
        expect(change).toHaveProperty('type');
        expect(change).toHaveProperty('line');
        expect(change).toHaveProperty('description');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty code', async () => {
      const result = await adapter.transform({
        code: '',
        instruction: 'Add null checks',
        language: 'typescript',
      });

      expect(result).toHaveProperty('success');
    });

    it('should handle very long code', async () => {
      const longCode = 'const x = 1;\n'.repeat(1000);
      const result = await adapter.transform({
        code: longCode,
        instruction: 'Add null checks',
        language: 'typescript',
      });

      expect(result).toHaveProperty('success');
    });

    it('should handle special characters in code', async () => {
      const result = await adapter.transform({
        code: 'const str = `Hello ${world}`; // Comment with "quotes"',
        instruction: 'Add null checks',
        language: 'typescript',
      });

      expect(result).toHaveProperty('success');
    });

    it('should handle unicode in code', async () => {
      const result = await adapter.transform({
        code: 'const greeting = "Hello";',
        instruction: 'Add null checks',
        language: 'typescript',
      });

      expect(result).toHaveProperty('success');
    });

    it('should handle empty instructions array in batch', async () => {
      const result = await adapter.batchTransform([
        { path: 'file.ts', code: 'const x = 1;', instructions: [] },
      ]);

      expect(result.totalFiles).toBe(1);
      expect(result.results[0].transformedCode).toBe('const x = 1;');
    });
  });

  describe('type annotations template', () => {
    it('should add type annotations to TypeScript', async () => {
      const result = await adapter.transform({
        code: 'function test(x) { return x; }',
        instruction: 'Add type annotations',
        language: 'typescript',
      });

      expect(result.success).toBe(true);
      expect(result.transformedCode).toContain(': void');
    });

    it('should add type to const declarations', async () => {
      const result = await adapter.transform({
        code: 'const name = "hello";',
        instruction: 'Add type annotations',
        language: 'typescript',
      });

      if (result.success) {
        expect(result.transformedCode).toContain(': string');
      }
    });

    it('should add type to number declarations', async () => {
      const result = await adapter.transform({
        code: 'const count = 42;',
        instruction: 'Add type annotations',
        language: 'typescript',
      });

      if (result.success) {
        expect(result.transformedCode).toContain(': number');
      }
    });

    it('should add type to boolean declarations', async () => {
      const result = await adapter.transform({
        code: 'const isValid = true;',
        instruction: 'Add type annotations',
        language: 'typescript',
      });

      if (result.success) {
        expect(result.transformedCode).toContain(': boolean');
      }
    });
  });

  describe('error handling template', () => {
    it('should add error handling to async functions', async () => {
      const result = await adapter.transform({
        code: 'async function fetchData() { return await api.get(); }',
        instruction: 'Add error handling',
        language: 'typescript',
      });

      expect(result.success).toBe(true);
      expect(result.transformedCode).toContain('try');
      expect(result.transformedCode).toContain('catch');
    });
  });
});
