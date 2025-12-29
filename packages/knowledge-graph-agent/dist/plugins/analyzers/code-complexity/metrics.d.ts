/**
 * Code Complexity Metrics Calculator
 *
 * Implements complexity metric calculations:
 * - Cyclomatic Complexity (McCabe)
 * - Cognitive Complexity (SonarSource)
 * - Maintainability Index
 *
 * @module plugins/analyzers/code-complexity/metrics
 */
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import type { ComplexityScore, ComplexityThresholds, ComplexityLevel, FileComplexityScore, HalsteadMetrics } from './types.js';
/**
 * Calculate cyclomatic complexity for an AST node
 *
 * Cyclomatic complexity = E - N + 2P
 * Simplified: Count decision points + 1
 */
export declare function calculateCyclomaticComplexity(node: TSESTree.Node): number;
/**
 * Calculate cognitive complexity for an AST node
 *
 * Based on SonarSource's cognitive complexity:
 * - Increments for breaks in linear flow
 * - Nesting increases increment value
 * - Recursion and logical operators add complexity
 */
export declare function calculateCognitiveComplexity(node: TSESTree.Node): number;
/**
 * Calculate maximum nesting depth
 */
export declare function calculateMaxNestingDepth(node: TSESTree.Node): number;
/**
 * Calculate lines of code metrics
 */
export declare function calculateLinesOfCode(sourceCode: string, startLine: number, endLine: number): {
    loc: number;
    totalLines: number;
};
/**
 * Count return statements in a function
 */
export declare function countReturnStatements(node: TSESTree.Node): number;
/**
 * Calculate maintainability index (Microsoft variant)
 *
 * MI = MAX(0, (171 - 5.2 * ln(Halstead Volume) - 0.23 * Cyclomatic - 16.2 * ln(LOC)) * 100 / 171)
 *
 * Simplified version using available metrics
 */
export declare function calculateMaintainabilityIndex(cyclomatic: number, loc: number, cognitive: number): number;
/**
 * Calculate Halstead metrics from an AST node
 *
 * @param node - AST node to analyze
 * @returns Halstead metrics
 */
export declare function calculateHalsteadMetrics(node: TSESTree.Node): HalsteadMetrics;
/**
 * Classify complexity level based on scores and thresholds
 */
export declare function classifyComplexityLevel(complexity: ComplexityScore, thresholds: ComplexityThresholds): ComplexityLevel;
/**
 * Aggregate file complexity from individual function complexities
 */
export declare function aggregateFileComplexity(functions: Array<{
    complexity: ComplexityScore;
}>, totalLoc: number, totalLines: number): FileComplexityScore;
/**
 * Detect complexity issues in a function
 */
export declare function detectComplexityIssues(complexity: ComplexityScore, thresholds: ComplexityThresholds, functionName: string): string[];
/**
 * Generate recommendations for reducing complexity
 */
export declare function generateRecommendations(complexity: ComplexityScore, thresholds: ComplexityThresholds, level: ComplexityLevel): string[];
//# sourceMappingURL=metrics.d.ts.map