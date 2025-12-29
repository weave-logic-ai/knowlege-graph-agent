/**
 * SOP Compliance Checker
 *
 * Checks project artifacts against AI-SDLC SOP requirements
 * and determines compliance status.
 *
 * @module sops/compliance-checker
 */
import { SOPAssessment, SOPCategory } from './types.js';
/**
 * Compliance check options
 */
export interface ComplianceCheckOptions {
    /** Project root directory */
    projectRoot: string;
    /** Documentation path relative to project root */
    docsPath?: string;
    /** SOPs to check (default: all applicable) */
    sopIds?: string[];
    /** Categories to include */
    categories?: SOPCategory[];
    /** Whether to perform deep analysis */
    deepAnalysis?: boolean;
    /** Assessor name */
    assessor?: string;
    /** Custom artifact patterns */
    artifactPatterns?: Record<string, string[]>;
}
/**
 * Evidence item found during checking
 */
export interface EvidenceItem {
    /** Requirement ID this evidence supports */
    requirementId: string;
    /** File path where evidence was found */
    filePath: string;
    /** Type of evidence */
    type: 'document' | 'code' | 'test' | 'config' | 'artifact';
    /** Description of the evidence */
    description: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** Relevant excerpt from file */
    excerpt?: string;
}
/**
 * Result of a compliance check
 */
export interface ComplianceCheckResult {
    /** Whether check completed successfully */
    success: boolean;
    /** Project name */
    projectName: string;
    /** Check timestamp */
    checkedAt: Date;
    /** Assessments by SOP */
    assessments: SOPAssessment[];
    /** Evidence found */
    evidence: EvidenceItem[];
    /** Overall compliance score */
    overallScore: number;
    /** Summary by category */
    categoryScores: Record<SOPCategory, number>;
    /** Errors encountered */
    errors: string[];
}
/**
 * Check compliance for a project against AI-SDLC SOPs
 */
export declare function checkCompliance(options: ComplianceCheckOptions): Promise<ComplianceCheckResult>;
/**
 * Quick check for a specific SOP
 */
export declare function checkSOPCompliance(sopId: string, projectRoot: string, docsPath?: string): Promise<SOPAssessment | null>;
/**
 * Check if project meets minimum compliance threshold
 */
export declare function meetsMinimumCompliance(projectRoot: string, threshold?: number, categories?: SOPCategory[]): Promise<{
    meets: boolean;
    score: number;
    gaps: string[];
}>;
//# sourceMappingURL=compliance-checker.d.ts.map