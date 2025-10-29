/**
 * Protocol Compression
 *
 * Provides gzip/brotli compression for large MCP payloads to reduce bandwidth usage.
 * Automatically negotiates compression based on client support and payload size.
 */

import { gzip, brotliCompress, gunzip, brotliDecompress } from 'zlib';
import { promisify } from 'util';
import { logger } from '../../utils/logger.js';

const gzipAsync = promisify(gzip);
const brotliCompressAsync = promisify(brotliCompress);
const gunzipAsync = promisify(gunzip);
const brotliDecompressAsync = promisify(brotliDecompress);

/**
 * Compression algorithm
 */
export type CompressionAlgorithm = 'gzip' | 'brotli' | 'none';

/**
 * Compression configuration
 */
export interface CompressionConfig {
  /**
   * Minimum payload size to compress (default: 1024 bytes = 1KB)
   */
  minSizeBytes: number;

  /**
   * Preferred compression algorithm (default: 'brotli')
   */
  algorithm: CompressionAlgorithm;

  /**
   * Compression level (1-9, default: 6)
   */
  level: number;

  /**
   * Enable/disable compression
   */
  enabled: boolean;
}

/**
 * Compression result
 */
export interface CompressionResult {
  data: Buffer | string;
  algorithm: CompressionAlgorithm;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  compressionTime: number;
}

/**
 * Compression statistics
 */
export interface CompressionStats {
  totalRequests: number;
  compressedRequests: number;
  totalOriginalBytes: number;
  totalCompressedBytes: number;
  avgCompressionRatio: number;
  avgCompressionTime: number;
  byAlgorithm: {
    [key in CompressionAlgorithm]: {
      count: number;
      totalOriginalBytes: number;
      totalCompressedBytes: number;
      avgRatio: number;
    };
  };
}

/**
 * Protocol Compression Manager
 *
 * Handles compression and decompression of MCP protocol payloads.
 */
export class CompressionManager {
  private config: CompressionConfig;
  private stats: CompressionStats;

  /**
   * Create a new compression manager
   *
   * @param config - Compression configuration
   */
  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = {
      minSizeBytes: config.minSizeBytes || 1024, // 1KB
      algorithm: config.algorithm || 'brotli',
      level: config.level || 6,
      enabled: config.enabled !== false,
    };

    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      avgCompressionRatio: 1.0,
      avgCompressionTime: 0,
      byAlgorithm: {
        gzip: {
          count: 0,
          totalOriginalBytes: 0,
          totalCompressedBytes: 0,
          avgRatio: 1.0,
        },
        brotli: {
          count: 0,
          totalOriginalBytes: 0,
          totalCompressedBytes: 0,
          avgRatio: 1.0,
        },
        none: {
          count: 0,
          totalOriginalBytes: 0,
          totalCompressedBytes: 0,
          avgRatio: 1.0,
        },
      },
    };

    logger.debug('CompressionManager initialized', { ...this.config } as Record<string, unknown>);
  }

  /**
   * Compress data if it meets size threshold
   *
   * @param data - Data to compress (string or object)
   * @param acceptedEncodings - Client-supported encodings
   * @returns Compression result
   */
  async compress(
    data: any,
    acceptedEncodings: string[] = ['brotli', 'gzip']
  ): Promise<CompressionResult> {
    const startTime = Date.now();
    this.stats.totalRequests++;

    // Convert to JSON string if object
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const originalSize = Buffer.byteLength(dataStr, 'utf8');
    this.stats.totalOriginalBytes += originalSize;

    // Check if compression should be applied
    if (
      !this.config.enabled ||
      originalSize < this.config.minSizeBytes
    ) {
      const result: CompressionResult = {
        data: dataStr,
        algorithm: 'none',
        originalSize,
        compressedSize: originalSize,
        ratio: 1.0,
        compressionTime: 0,
      };

      this.updateStats(result);
      return result;
    }

    // Determine algorithm based on client support
    const algorithm = this.negotiateAlgorithm(acceptedEncodings);

    if (algorithm === 'none') {
      const result: CompressionResult = {
        data: dataStr,
        algorithm: 'none',
        originalSize,
        compressedSize: originalSize,
        ratio: 1.0,
        compressionTime: 0,
      };

      this.updateStats(result);
      return result;
    }

    // Compress
    const buffer = Buffer.from(dataStr, 'utf8');
    let compressed: Buffer;

    try {
      if (algorithm === 'brotli') {
        compressed = await brotliCompressAsync(buffer, {
          params: {
            [require('zlib').constants.BROTLI_PARAM_QUALITY]: this.config.level,
          },
        });
      } else {
        // gzip
        compressed = await gzipAsync(buffer, {
          level: this.config.level,
        });
      }

      const compressedSize = compressed.length;
      const ratio = originalSize / compressedSize;
      const compressionTime = Date.now() - startTime;

      const result: CompressionResult = {
        data: compressed,
        algorithm,
        originalSize,
        compressedSize,
        ratio,
        compressionTime,
      };

      this.updateStats(result);

      logger.debug('Payload compressed', {
        algorithm,
        originalSize,
        compressedSize,
        ratio: ratio.toFixed(2),
        compressionTime: `${compressionTime}ms`,
      });

      return result;
    } catch (error) {
      logger.error('Compression failed, returning uncompressed', error as Error);

      const result: CompressionResult = {
        data: dataStr,
        algorithm: 'none',
        originalSize,
        compressedSize: originalSize,
        ratio: 1.0,
        compressionTime: Date.now() - startTime,
      };

      this.updateStats(result);
      return result;
    }
  }

  /**
   * Decompress data
   *
   * @param data - Compressed data
   * @param algorithm - Compression algorithm used
   * @returns Decompressed string
   */
  async decompress(
    data: Buffer,
    algorithm: CompressionAlgorithm
  ): Promise<string> {
    if (algorithm === 'none') {
      return data.toString('utf8');
    }

    try {
      let decompressed: Buffer;

      if (algorithm === 'brotli') {
        decompressed = await brotliDecompressAsync(data);
      } else {
        // gzip
        decompressed = await gunzipAsync(data);
      }

      return decompressed.toString('utf8');
    } catch (error) {
      logger.error('Decompression failed', error as Error, { algorithm });
      throw new Error(`Failed to decompress data: ${(error as Error).message}`);
    }
  }

  /**
   * Negotiate compression algorithm based on client support
   *
   * @param acceptedEncodings - Client-supported encodings
   * @returns Selected algorithm
   */
  private negotiateAlgorithm(
    acceptedEncodings: string[]
  ): CompressionAlgorithm {
    const encodings = acceptedEncodings.map((e) => e.toLowerCase());

    // Prefer brotli, then gzip
    if (this.config.algorithm === 'brotli' && encodings.includes('brotli')) {
      return 'brotli';
    }

    if (this.config.algorithm === 'gzip' && encodings.includes('gzip')) {
      return 'gzip';
    }

    // Fall back to any supported algorithm
    if (encodings.includes('brotli')) {
      return 'brotli';
    }

    if (encodings.includes('gzip')) {
      return 'gzip';
    }

    return 'none';
  }

  /**
   * Update compression statistics
   *
   * @param result - Compression result
   */
  private updateStats(result: CompressionResult): void {
    if (result.algorithm !== 'none') {
      this.stats.compressedRequests++;
      this.stats.totalCompressedBytes += result.compressedSize;
    } else {
      this.stats.totalCompressedBytes += result.originalSize;
    }

    const algoStats = this.stats.byAlgorithm[result.algorithm];
    algoStats.count++;
    algoStats.totalOriginalBytes += result.originalSize;
    algoStats.totalCompressedBytes += result.compressedSize;

    if (algoStats.totalOriginalBytes > 0) {
      algoStats.avgRatio =
        algoStats.totalOriginalBytes / algoStats.totalCompressedBytes;
    }

    // Update overall stats
    if (this.stats.totalOriginalBytes > 0) {
      this.stats.avgCompressionRatio =
        this.stats.totalOriginalBytes / this.stats.totalCompressedBytes;
    }

    // Update average compression time
    if (this.stats.compressedRequests > 0) {
      const totalTime =
        this.stats.avgCompressionTime * (this.stats.compressedRequests - 1) +
        result.compressionTime;
      this.stats.avgCompressionRatio = totalTime / this.stats.compressedRequests;
    }
  }

  /**
   * Get compression statistics
   *
   * @returns Compression statistics
   */
  getStats(): CompressionStats {
    return { ...this.stats };
  }

  /**
   * Update compression configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<CompressionConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Compression configuration updated', { ...this.config } as Record<string, unknown>);
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      compressedRequests: 0,
      totalOriginalBytes: 0,
      totalCompressedBytes: 0,
      avgCompressionRatio: 1.0,
      avgCompressionTime: 0,
      byAlgorithm: {
        gzip: {
          count: 0,
          totalOriginalBytes: 0,
          totalCompressedBytes: 0,
          avgRatio: 1.0,
        },
        brotli: {
          count: 0,
          totalOriginalBytes: 0,
          totalCompressedBytes: 0,
          avgRatio: 1.0,
        },
        none: {
          count: 0,
          totalOriginalBytes: 0,
          totalCompressedBytes: 0,
          avgRatio: 1.0,
        },
      },
    };

    logger.info('Compression statistics reset');
  }
}
