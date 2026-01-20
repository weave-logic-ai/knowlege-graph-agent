/**
 * Review Process Manager
 *
 * Implements the 3-pass review system for SPARC plans:
 * 1. Documentation review
 * 2. Code review
 * 3. SPARC specification review
 *
 * @module sparc/review-process
 */
import type { ReviewFinding, ReviewResult, FindingSeverity, SPARCPlan } from './types.js';
/**
 * Review process options
 */
export interface ReviewProcessOptions {
    /** Plan being reviewed */
    plan: SPARCPlan;
    /** Number of review passes (default 3) */
    passes?: number;
    /** Auto-fix minor issues */
    autoFix?: boolean;
    /** Strict mode - fail on any finding */
    strictMode?: boolean;
}
/**
 * Review Process Manager
 *
 * Executes the 3-pass review system.
 */
export declare class ReviewProcessManager {
    private readonly plan;
    private readonly options;
    private passes;
    constructor(options: ReviewProcessOptions);
    /**
     * Execute the full review process
     */
    executeReview(): Promise<ReviewResult>;
    /**
     * Execute a single review pass
     */
    private executePass;
    /**
     * Compile all pass results into final result
     */
    private compileResults;
    /**
     * Deduplicate findings across passes
     */
    private deduplicateFindings;
    /**
     * Generate recommendations based on findings
     */
    private generateRecommendations;
    /**
     * Get findings by severity
     */
    getFindingsBySeverity(severity: FindingSeverity): ReviewFinding[];
    /**
     * Get all open findings
     */
    getOpenFindings(): ReviewFinding[];
    /**
     * Mark finding as resolved
     */
    resolveFinding(findingId: string, resolution: string): boolean;
}
/**
 * Create a review process manager
 */
export declare function createReviewProcess(options: ReviewProcessOptions): ReviewProcessManager;
//# sourceMappingURL=review-process.d.ts.map