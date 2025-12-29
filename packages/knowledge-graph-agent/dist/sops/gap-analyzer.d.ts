/**
 * SOP Gap Analyzer
 *
 * Analyzes compliance gaps and generates remediation recommendations.
 *
 * @module sops/gap-analyzer
 */
import { ComplianceGap, SOPPriority, SOPCategory } from './types.js';
import { ComplianceCheckResult } from './compliance-checker.js';
/**
 * Gap analysis options
 */
export interface GapAnalysisOptions {
    /** Minimum score threshold to consider compliant */
    complianceThreshold?: number;
    /** Include SOPs with partial compliance */
    includePartial?: boolean;
    /** Filter by priority */
    minPriority?: SOPPriority;
    /** Filter by category */
    categories?: SOPCategory[];
    /** Generate remediation plans */
    generateRemediation?: boolean;
}
/**
 * Gap analysis result
 */
export interface GapAnalysisResult {
    /** All identified gaps */
    gaps: ComplianceGap[];
    /** Gaps grouped by priority */
    byPriority: Record<SOPPriority, ComplianceGap[]>;
    /** Gaps grouped by category */
    byCategory: Record<SOPCategory, ComplianceGap[]>;
    /** Total gap count */
    totalGaps: number;
    /** Critical gaps that need immediate attention */
    criticalGaps: ComplianceGap[];
    /** Summary statistics */
    summary: GapSummary;
    /** Remediation roadmap */
    roadmap?: RemediationRoadmap;
}
/**
 * Gap summary statistics
 */
export interface GapSummary {
    /** Total requirements checked */
    totalRequirements: number;
    /** Requirements met */
    requirementsMet: number;
    /** Requirements with gaps */
    requirementsGaps: number;
    /** Compliance percentage */
    compliancePercentage: number;
    /** Effort estimate (total) */
    totalEffort: {
        low: number;
        medium: number;
        high: number;
    };
    /** Estimated remediation complexity */
    overallComplexity: 'low' | 'medium' | 'high';
}
/**
 * Remediation roadmap
 */
export interface RemediationRoadmap {
    /** Phases of remediation */
    phases: RemediationPhase[];
    /** Quick wins (low effort, high impact) */
    quickWins: ComplianceGap[];
    /** Dependencies between gaps */
    dependencies: GapDependency[];
}
/**
 * Remediation phase
 */
export interface RemediationPhase {
    /** Phase number */
    phase: number;
    /** Phase name */
    name: string;
    /** Gaps to address in this phase */
    gaps: ComplianceGap[];
    /** Focus area */
    focus: string;
    /** Expected effort */
    effort: 'low' | 'medium' | 'high';
}
/**
 * Gap dependency
 */
export interface GapDependency {
    /** Gap that depends on another */
    gapId: string;
    /** Gap that must be addressed first */
    dependsOn: string;
    /** Reason for dependency */
    reason: string;
}
/**
 * Analyze compliance gaps from check results
 */
export declare function analyzeGaps(checkResult: ComplianceCheckResult, options?: GapAnalysisOptions): GapAnalysisResult;
/**
 * Get gaps for a specific SOP
 */
export declare function getGapsForSOP(analysisResult: GapAnalysisResult, sopId: string): ComplianceGap[];
/**
 * Get high-impact quick wins
 */
export declare function getQuickWins(analysisResult: GapAnalysisResult): ComplianceGap[];
/**
 * Calculate remediation progress
 */
export declare function calculateProgress(gaps: ComplianceGap[]): {
    total: number;
    resolved: number;
    inProgress: number;
    open: number;
    percentage: number;
};
//# sourceMappingURL=gap-analyzer.d.ts.map