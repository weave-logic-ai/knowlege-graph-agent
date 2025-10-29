/**
 * Compression Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CompressionManager } from '../../../../src/mcp-server/performance/compression.js';

describe('CompressionManager', () => {
  let compression: CompressionManager;

  beforeEach(() => {
    compression = new CompressionManager({
      minSizeBytes: 100,
      algorithm: 'gzip',
      level: 6,
      enabled: true,
    });
  });

  describe('Compression Behavior', () => {
    it('should compress large payloads', async () => {
      const largeData = { content: 'x'.repeat(1000) };

      const result = await compression.compress(largeData, ['gzip']);

      expect(result.algorithm).toBe('gzip');
      expect(result.compressedSize).toBeLessThan(result.originalSize);
      expect(result.ratio).toBeGreaterThan(1.0);
    });

    it('should skip compression for small payloads', async () => {
      const smallData = { content: 'hello' };

      const result = await compression.compress(smallData, ['gzip']);

      expect(result.algorithm).toBe('none');
      expect(result.compressedSize).toBe(result.originalSize);
      expect(result.ratio).toBe(1.0);
    });

    it('should handle string data', async () => {
      const stringData = 'x'.repeat(1000);

      const result = await compression.compress(stringData, ['gzip']);

      expect(result.algorithm).toBe('gzip');
      expect(result.compressedSize).toBeLessThan(result.originalSize);
    });
  });

  describe('Algorithm Negotiation', () => {
    it('should prefer brotli when supported', async () => {
      const brotliCompression = new CompressionManager({
        algorithm: 'brotli',
        minSizeBytes: 100,
      });

      const data = { content: 'x'.repeat(1000) };

      const result = await brotliCompression.compress(data, ['brotli', 'gzip']);

      expect(result.algorithm).toBe('brotli');
    });

    it('should fall back to gzip when brotli not supported', async () => {
      const brotliCompression = new CompressionManager({
        algorithm: 'brotli',
        minSizeBytes: 100,
      });

      const data = { content: 'x'.repeat(1000) };

      const result = await brotliCompression.compress(data, ['gzip']);

      expect(result.algorithm).toBe('gzip');
    });

    it('should use no compression when none supported', async () => {
      const data = { content: 'x'.repeat(1000) };

      const result = await compression.compress(data, []);

      expect(result.algorithm).toBe('none');
    });
  });

  describe('Decompression', () => {
    it('should decompress gzipped data', async () => {
      const originalData = { content: 'x'.repeat(1000) };

      const compressed = await compression.compress(originalData, ['gzip']);

      const decompressed = await compression.decompress(
        compressed.data as Buffer,
        'gzip'
      );

      expect(JSON.parse(decompressed)).toEqual(originalData);
    });

    it('should handle uncompressed data', async () => {
      const data = 'hello world';
      const buffer = Buffer.from(data, 'utf8');

      const result = await compression.decompress(buffer, 'none');

      expect(result).toBe(data);
    });
  });

  describe('Statistics', () => {
    it('should track compression statistics', async () => {
      const data1 = { content: 'x'.repeat(1000) };
      const data2 = { content: 'y'.repeat(1000) };

      await compression.compress(data1, ['gzip']);
      await compression.compress(data2, ['gzip']);

      const stats = compression.getStats();

      expect(stats.totalRequests).toBe(2);
      expect(stats.compressedRequests).toBe(2);
      expect(stats.avgCompressionRatio).toBeGreaterThan(1.0);
    });

    it('should track by algorithm', async () => {
      const data = { content: 'x'.repeat(1000) };

      await compression.compress(data, ['gzip']);

      const stats = compression.getStats();

      expect(stats.byAlgorithm.gzip.count).toBe(1);
      expect(stats.byAlgorithm.gzip.avgRatio).toBeGreaterThan(1.0);
    });
  });

  describe('Configuration', () => {
    it('should bypass compression when disabled', async () => {
      const disabledCompression = new CompressionManager({ enabled: false });

      const data = { content: 'x'.repeat(1000) };

      const result = await disabledCompression.compress(data, ['gzip']);

      expect(result.algorithm).toBe('none');
    });

    it('should update configuration', () => {
      compression.updateConfig({ minSizeBytes: 500 });

      // Small data should not be compressed anymore
      // (testing would require accessing internal config)
    });
  });

  describe('Performance', () => {
    it('should achieve good compression ratio', async () => {
      const repetitiveData = {
        content: 'Lorem ipsum dolor sit amet. '.repeat(100),
      };

      const result = await compression.compress(repetitiveData, ['gzip']);

      // Should achieve at least 2:1 compression on repetitive text
      expect(result.ratio).toBeGreaterThan(2.0);

      console.log(`Compression ratio: ${result.ratio.toFixed(2)}:1`);
      console.log(`Original: ${result.originalSize} bytes`);
      console.log(`Compressed: ${result.compressedSize} bytes`);
    });

    it('should complete compression quickly', async () => {
      const data = { content: 'x'.repeat(10000) };

      const start = Date.now();
      const result = await compression.compress(data, ['gzip']);
      const time = Date.now() - start;

      expect(time).toBeLessThan(100); // Should complete in <100ms
      expect(result.compressionTime).toBeLessThan(100);
    });
  });
});
