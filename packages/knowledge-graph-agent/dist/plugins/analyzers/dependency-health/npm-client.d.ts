/**
 * npm Registry API Client
 *
 * Client for fetching package metadata from the npm registry.
 * Provides methods to get package info, download stats, and quality metrics.
 *
 * @module plugins/analyzers/dependency-health/npm-client
 */
import type { NpmPackageMetadata, NpmQualityMetrics, NpmDownloadStats, DependencyHealthConfig } from './types.js';
/**
 * npm Registry API Client
 */
export declare class NpmClient {
    private registryUrl;
    private timeout;
    private cacheTtl;
    private cache;
    constructor(config?: Partial<DependencyHealthConfig>);
    /**
     * Get cached value or fetch new data
     */
    private getCached;
    /**
     * Fetch with timeout
     */
    private fetchWithTimeout;
    /**
     * Get package metadata from npm registry
     */
    getPackageMetadata(packageName: string): Promise<NpmPackageMetadata | null>;
    /**
     * Get download statistics from npm
     */
    getDownloadStats(packageName: string): Promise<NpmDownloadStats | null>;
    /**
     * Get quality metrics (simulated based on available data)
     * In production, this could use npms.io API or similar service
     */
    getQualityMetrics(packageName: string): Promise<NpmQualityMetrics | null>;
    /**
     * Get all available information for a package
     */
    getFullPackageInfo(packageName: string): Promise<{
        metadata: NpmPackageMetadata | null;
        downloads: NpmDownloadStats | null;
        quality: NpmQualityMetrics | null;
    }>;
    /**
     * Batch fetch metadata for multiple packages
     */
    batchGetMetadata(packageNames: string[], concurrency?: number): Promise<Map<string, NpmPackageMetadata | null>>;
    /**
     * Clear the cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        entries: string[];
    };
}
/**
 * Create a new npm client instance
 */
export declare function createNpmClient(config?: Partial<DependencyHealthConfig>): NpmClient;
//# sourceMappingURL=npm-client.d.ts.map