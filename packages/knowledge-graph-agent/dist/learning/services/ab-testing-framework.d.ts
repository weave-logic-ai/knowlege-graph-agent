/**
 * A/B Testing Framework
 *
 * Enables experimentation with agent configurations, prompts, and workflows
 * through controlled A/B tests with statistical analysis.
 *
 * @module learning/services/ab-testing-framework
 */
import { type ABTest, type ABTestResult } from '../types.js';
/**
 * Configuration for A/B testing
 */
export interface ABTestingConfig {
    /** Minimum sample size for statistical significance */
    minSampleSize: number;
    /** P-value threshold for significance */
    significanceThreshold: number;
    /** Maximum concurrent tests */
    maxConcurrentTests: number;
    /** Auto-stop tests when clear winner is found */
    autoStopOnWinner: boolean;
    /** Minimum improvement to declare winner */
    minImprovementThreshold: number;
}
/**
 * A/B Testing Framework
 *
 * Manages experiments to optimize agent performance through
 * controlled testing of different configurations.
 *
 * @example
 * ```typescript
 * const framework = new ABTestingFramework();
 *
 * const testId = await framework.createTest({
 *   name: 'Prompt Optimization',
 *   description: 'Test different prompt styles',
 *   variants: [
 *     { id: 'control', name: 'Current', config: { promptStyle: 'detailed' }, weight: 0.5 },
 *     { id: 'treatment', name: 'Concise', config: { promptStyle: 'concise' }, weight: 0.5 },
 *   ],
 *   metrics: ['success_rate', 'response_time', 'quality_score'],
 * });
 *
 * // Assign subjects to variants
 * const variant = await framework.assignVariant(testId, 'user-123');
 *
 * // Record metrics
 * await framework.recordMetric(testId, variant, 'success_rate', 1);
 * ```
 */
export declare class ABTestingFramework {
    private tests;
    private metrics;
    private subjectAssignments;
    private config;
    constructor(config?: Partial<ABTestingConfig>);
    /**
     * Create a new A/B test
     */
    createTest(test: Omit<ABTest, 'id' | 'status' | 'createdAt'>): Promise<string>;
    /**
     * Start an A/B test
     */
    startTest(testId: string): Promise<void>;
    /**
     * Assign a subject to a variant (deterministic based on subject ID)
     */
    assignVariant(testId: string, subjectId: string): Promise<string>;
    /**
     * Record a metric value for a variant
     */
    recordMetric(testId: string, variantId: string, metric: string, value: number, subjectId?: string): Promise<void>;
    /**
     * Analyze test results
     */
    analyzeResults(testId: string): Promise<ABTestResult>;
    /**
     * Stop a test
     */
    stopTest(testId: string, reason: string): Promise<void>;
    /**
     * Complete a test
     */
    completeTest(testId: string): Promise<ABTestResult>;
    /**
     * Get test by ID
     */
    getTest(testId: string): ABTest | undefined;
    /**
     * List all tests
     */
    listTests(status?: ABTest['status']): ABTest[];
    /**
     * Get variant config for a subject
     */
    getVariantConfig(testId: string, subjectId: string): Record<string, unknown> | undefined;
    /**
     * Delete a test and its data
     */
    deleteTest(testId: string): boolean;
    /**
     * Select variant based on subject ID (deterministic)
     */
    private selectVariant;
    /**
     * Calculate statistics for a set of values
     */
    private calculateStatistics;
    /**
     * Determine winner using statistical significance
     */
    private determineWinner;
    /**
     * Two-sample t-test for statistical significance
     */
    private tTest;
    /**
     * Cumulative distribution function for standard normal
     */
    private normalCDF;
    /**
     * Check if there's a clear winner to auto-stop
     */
    private checkForWinner;
    /**
     * Clear all tests and data
     */
    clear(): void;
}
/**
 * Create an A/B testing framework instance
 */
export declare function createABTestingFramework(config?: Partial<ABTestingConfig>): ABTestingFramework;
//# sourceMappingURL=ab-testing-framework.d.ts.map