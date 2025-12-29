/**
 * npm Registry API Client
 *
 * Client for fetching package metadata from the npm registry.
 * Provides methods to get package info, download stats, and quality metrics.
 *
 * @module plugins/analyzers/dependency-health/npm-client
 */

import { createLogger } from '../../../utils/logger.js';
import type {
  NpmPackageMetadata,
  NpmQualityMetrics,
  NpmDownloadStats,
  DependencyHealthConfig,
} from './types.js';

const logger = createLogger('npm-client');

/**
 * npm registry response type
 */
interface NpmRegistryResponse {
  name: string;
  'dist-tags'?: { latest?: string };
  versions?: Record<string, {
    deprecated?: string;
    types?: string;
    typings?: string;
  }>;
  description?: string;
  keywords?: string[];
  author?: string | { name: string; email?: string; url?: string };
  license?: string;
  repository?: { type: string; url: string };
  homepage?: string;
  bugs?: { url: string };
  time?: Record<string, string>;
}

/**
 * npm downloads API response
 */
interface NpmDownloadsResponse {
  downloads?: number;
}

/**
 * Simple in-memory cache for registry responses
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * npm Registry API Client
 */
export class NpmClient {
  private registryUrl: string;
  private timeout: number;
  private cacheTtl: number;
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  constructor(config: Partial<DependencyHealthConfig> = {}) {
    this.registryUrl = config.registryUrl ?? 'https://registry.npmjs.org';
    this.timeout = config.timeout ?? 30000;
    this.cacheTtl = config.cacheTtl ?? 3600000;
  }

  /**
   * Get cached value or fetch new data
   */
  private async getCached<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;

    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'knowledge-graph-agent/1.0',
        },
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Get package metadata from npm registry
   */
  async getPackageMetadata(packageName: string): Promise<NpmPackageMetadata | null> {
    const cacheKey = `metadata:${packageName}`;

    try {
      return await this.getCached(cacheKey, async () => {
        const encodedName = encodeURIComponent(packageName).replace('%40', '@');
        const url = `${this.registryUrl}/${encodedName}`;

        logger.debug('Fetching package metadata', { package: packageName, url });

        const response = await this.fetchWithTimeout(url);

        if (!response.ok) {
          if (response.status === 404) {
            logger.warn('Package not found in registry', { package: packageName });
            return null;
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as NpmRegistryResponse;
        const latestVersion = data['dist-tags']?.latest ?? '';
        const versionData = latestVersion ? data.versions?.[latestVersion] ?? {} : {};

        return {
          name: data.name,
          version: latestVersion,
          description: data.description,
          keywords: data.keywords,
          author: typeof data.author === 'string'
            ? { name: data.author }
            : data.author,
          license: data.license,
          repository: data.repository,
          homepage: data.homepage,
          bugs: data.bugs,
          lastPublish: latestVersion ? data.time?.[latestVersion] : undefined,
          deprecated: versionData.deprecated,
          hasTypes: !!(versionData.types || versionData.typings),
        };
      });
    } catch (error) {
      logger.error('Failed to fetch package metadata', error instanceof Error ? error : undefined, {
        package: packageName,
      });
      return null;
    }
  }

  /**
   * Get download statistics from npm
   */
  async getDownloadStats(packageName: string): Promise<NpmDownloadStats | null> {
    const cacheKey = `downloads:${packageName}`;

    try {
      return await this.getCached(cacheKey, async () => {
        const encodedName = encodeURIComponent(packageName).replace('%40', '@');

        // Fetch last-week downloads
        const weekUrl = `https://api.npmjs.org/downloads/point/last-week/${encodedName}`;
        const monthUrl = `https://api.npmjs.org/downloads/point/last-month/${encodedName}`;
        const dayUrl = `https://api.npmjs.org/downloads/point/last-day/${encodedName}`;

        const [weekResponse, monthResponse, dayResponse] = await Promise.all([
          this.fetchWithTimeout(weekUrl).catch(() => null),
          this.fetchWithTimeout(monthUrl).catch(() => null),
          this.fetchWithTimeout(dayUrl).catch(() => null),
        ]);

        const weekData = weekResponse?.ok ? await weekResponse.json() as NpmDownloadsResponse : null;
        const monthData = monthResponse?.ok ? await monthResponse.json() as NpmDownloadsResponse : null;
        const dayData = dayResponse?.ok ? await dayResponse.json() as NpmDownloadsResponse : null;

        if (!weekData && !monthData && !dayData) {
          return null;
        }

        return {
          daily: dayData?.downloads ?? 0,
          weekly: weekData?.downloads ?? 0,
          monthly: monthData?.downloads ?? 0,
        };
      });
    } catch (error) {
      logger.error('Failed to fetch download stats', error instanceof Error ? error : undefined, {
        package: packageName,
      });
      return null;
    }
  }

  /**
   * Get quality metrics (simulated based on available data)
   * In production, this could use npms.io API or similar service
   */
  async getQualityMetrics(packageName: string): Promise<NpmQualityMetrics | null> {
    const cacheKey = `quality:${packageName}`;

    try {
      return await this.getCached(cacheKey, async () => {
        // Try to get metadata and downloads to calculate approximate scores
        const [metadata, downloads] = await Promise.all([
          this.getPackageMetadata(packageName),
          this.getDownloadStats(packageName),
        ]);

        if (!metadata) {
          return null;
        }

        // Calculate approximate scores based on available data
        let popularity = 0;
        if (downloads) {
          // Normalize monthly downloads (100k+ = 1.0, 0 = 0)
          popularity = Math.min(downloads.monthly / 100000, 1);
        }

        // Maintenance score based on available indicators
        let maintenance = 0.5; // Default middle score
        if (metadata.lastPublish) {
          const daysSincePublish = (Date.now() - new Date(metadata.lastPublish).getTime()) / (1000 * 60 * 60 * 24);
          // Score drops after 30 days, bottoms out at 365 days
          maintenance = Math.max(0.2, 1 - (daysSincePublish / 365));
        }

        // Quality score based on completeness
        let quality = 0.3; // Base score
        if (metadata.description) quality += 0.1;
        if (metadata.repository) quality += 0.1;
        if (metadata.homepage) quality += 0.1;
        if (metadata.license) quality += 0.1;
        if (metadata.hasTypes) quality += 0.15;
        if (metadata.keywords && metadata.keywords.length > 0) quality += 0.05;
        if (!metadata.deprecated) quality += 0.1;
        quality = Math.min(quality, 1);

        // Final score as weighted average
        const final = (quality * 0.35 + popularity * 0.35 + maintenance * 0.3);

        return {
          quality,
          popularity,
          maintenance,
          final,
        };
      });
    } catch (error) {
      logger.error('Failed to calculate quality metrics', error instanceof Error ? error : undefined, {
        package: packageName,
      });
      return null;
    }
  }

  /**
   * Get all available information for a package
   */
  async getFullPackageInfo(packageName: string): Promise<{
    metadata: NpmPackageMetadata | null;
    downloads: NpmDownloadStats | null;
    quality: NpmQualityMetrics | null;
  }> {
    const [metadata, downloads, quality] = await Promise.all([
      this.getPackageMetadata(packageName),
      this.getDownloadStats(packageName),
      this.getQualityMetrics(packageName),
    ]);

    // Attach downloads and quality to metadata if available
    if (metadata) {
      metadata.downloads = downloads ?? undefined;
      metadata.quality = quality ?? undefined;
    }

    return { metadata, downloads, quality };
  }

  /**
   * Batch fetch metadata for multiple packages
   */
  async batchGetMetadata(
    packageNames: string[],
    concurrency: number = 5
  ): Promise<Map<string, NpmPackageMetadata | null>> {
    const results = new Map<string, NpmPackageMetadata | null>();
    const chunks: string[][] = [];

    // Split into chunks for concurrent processing
    for (let i = 0; i < packageNames.length; i += concurrency) {
      chunks.push(packageNames.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (name) => {
        const metadata = await this.getPackageMetadata(name);
        results.set(name, metadata);
      });
      await Promise.all(promises);
    }

    return results;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Create a new npm client instance
 */
export function createNpmClient(config?: Partial<DependencyHealthConfig>): NpmClient {
  return new NpmClient(config);
}
