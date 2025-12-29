/**
 * Code Complexity Analyzer
 *
 * Parses TypeScript/JavaScript files using typescript-estree and
 * analyzes complexity metrics for functions, methods, and files.
 *
 * @module plugins/analyzers/code-complexity/analyzer
 */
import type { AnalyzerConfig, FileAnalysis, ProjectAnalysis } from './types.js';
/**
 * Analyzes TypeScript/JavaScript code for complexity metrics
 *
 * @example
 * ```typescript
 * const analyzer = new CodeComplexityAnalyzer({
 *   projectRoot: '/my/project',
 *   patterns: { include: ['src/** /*.ts'], exclude: ['** /*.test.ts'] }
 * });
 *
 * const result = await analyzer.analyzeProject();
 * console.log(`Found ${result.complexFunctions.length} complex functions`);
 * ```
 */
export declare class CodeComplexityAnalyzer {
    private config;
    private sourceCache;
    constructor(config?: Partial<AnalyzerConfig>);
    /**
     * Analyze entire project for complexity
     */
    analyzeProject(): Promise<ProjectAnalysis>;
    /**
     * Analyze a single file for complexity
     */
    analyzeFile(filePath: string): Promise<FileAnalysis | null>;
    /**
     * Parse source file to AST
     */
    private parseFile;
    /**
     * Extract all functions from AST
     */
    private extractFunctions;
    /**
     * Get function information from node
     */
    private getFunctionInfo;
    /**
     * Analyze a single function node
     */
    private analyzeFunctionNode;
    /**
     * Find files matching patterns
     */
    private findFiles;
    /**
     * Get source code for file (with caching)
     */
    private getSourceCode;
    /**
     * Get arrow function name from parent
     */
    private getArrowFunctionName;
    /**
     * Get property name from key
     */
    private getPropertyName;
    /**
     * Get parameter count from function
     */
    private getParameterCount;
    /**
     * Count imports in AST
     */
    private countImports;
    /**
     * Count exports in AST
     */
    private countExports;
    /**
     * Count classes in AST
     */
    private countClasses;
    /**
     * Calculate project-wide metrics
     */
    private calculateProjectMetrics;
    /**
     * Clear source cache
     */
    clearCache(): void;
}
/**
 * Create a code complexity analyzer
 */
export declare function createComplexityAnalyzer(config?: Partial<AnalyzerConfig>): CodeComplexityAnalyzer;
/**
 * Analyze a single file for complexity
 */
export declare function analyzeFileComplexity(filePath: string, projectRoot?: string): Promise<FileAnalysis | null>;
/**
 * Analyze a project for complexity
 */
export declare function analyzeProjectComplexity(projectRoot: string, options?: Partial<AnalyzerConfig>): Promise<ProjectAnalysis>;
//# sourceMappingURL=analyzer.d.ts.map