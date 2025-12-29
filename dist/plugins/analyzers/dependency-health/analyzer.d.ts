/**
 * Dependency Health Analyzer
 *
 * Core analyzer that combines vulnerability checking, outdated package detection,
 * and npm registry metadata to calculate comprehensive health scores.
 *
 * @module plugins/analyzers/dependency-health/analyzer
 */
import type { DependencyHealthConfig, DependencyHealthScore, DependencyHealthAnalysis } from './types.js';
/**
 * DependencyHealthAnalyzer class
 */
export declare class DependencyHealthAnalyzer {
    private projectRoot;
    private config;
    private npmClient;
    private vulnChecker;
    constructor(projectRoot: string, config?: Partial<DependencyHealthConfig>);
    /**
     * Run full dependency health analysis
     */
    analyze(): Promise<DependencyHealthAnalysis>;
    /**
     * Read dependencies from package.json
     */
    private readDependencies;
    /**
     * Create a DependencyInfo object
     */
    private createDependencyInfo;
    /**
     * Check for outdated packages using npm outdated
     */
    private checkOutdated;
    /**
     * Calculate health score for a dependency
     */
    private calculateHealthScore;
    /**
     * Get health score for a specific package
     */
    getPackageHealth(packageName: string): Promise<DependencyHealthScore | null>;
    /**
     * Get packages below minimum health score threshold
     */
    getUnhealthyPackages(): Promise<DependencyHealthScore[]>;
    /**
     * Clear internal caches
     */
    clearCache(): void;
}
/**
 * Create a dependency health analyzer instance
 */
export declare function createDependencyHealthAnalyzer(projectRoot: string, config?: Partial<DependencyHealthConfig>): DependencyHealthAnalyzer;
//# sourceMappingURL=analyzer.d.ts.map