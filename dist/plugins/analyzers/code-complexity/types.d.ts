/**
 * Code Complexity Analyzer Plugin - Type Definitions
 *
 * Types for complexity analysis including cyclomatic complexity,
 * cognitive complexity, Halstead metrics, and code structure metrics.
 *
 * @module plugins/analyzers/code-complexity/types
 */
/**
 * Halstead software science metrics
 *
 * Based on Maurice Halstead's software science:
 * - n1 = number of distinct operators
 * - n2 = number of distinct operands
 * - N1 = total number of operators
 * - N2 = total number of operands
 */
export interface HalsteadMetrics {
    /** Number of distinct operators */
    distinctOperators: number;
    /** Number of distinct operands */
    distinctOperands: number;
    /** Total number of operators */
    totalOperators: number;
    /** Total number of operands */
    totalOperands: number;
    /** Program vocabulary: n = n1 + n2 */
    vocabulary: number;
    /** Program length: N = N1 + N2 */
    length: number;
    /** Calculated program length: N^ = n1 * log2(n1) + n2 * log2(n2) */
    calculatedLength: number;
    /** Volume: V = N * log2(n) - Size of implementation */
    volume: number;
    /** Difficulty: D = (n1/2) * (N2/n2) - Difficulty to understand */
    difficulty: number;
    /** Effort: E = D * V - Mental effort required */
    effort: number;
    /** Time to program: T = E / 18 seconds */
    time: number;
    /** Number of delivered bugs: B = V / 3000 */
    bugs: number;
}
/**
 * Default/empty Halstead metrics
 */
export declare const EMPTY_HALSTEAD_METRICS: HalsteadMetrics;
/**
 * Individual complexity score for a code element
 */
export interface ComplexityScore {
    /** Cyclomatic complexity - measures decision points (if, for, while, case, catch, &&, ||, ?:) */
    cyclomatic: number;
    /** Cognitive complexity - measures mental effort to understand (nested structures weighted higher) */
    cognitive: number;
    /** Lines of code (excluding blank lines and comments) */
    loc: number;
    /** Total lines including comments and blank lines */
    totalLines: number;
    /** Number of parameters (for functions) */
    parameterCount?: number;
    /** Maximum nesting depth */
    maxNestingDepth: number;
    /** Number of return statements */
    returnCount?: number;
    /** Halstead software science metrics */
    halstead?: HalsteadMetrics;
}
/**
 * Complexity thresholds for categorization
 */
export interface ComplexityThresholds {
    /** Cyclomatic complexity threshold for "complex" designation */
    cyclomaticHigh: number;
    /** Cyclomatic complexity threshold for "very complex" designation */
    cyclomaticCritical: number;
    /** Cognitive complexity threshold for "complex" designation */
    cognitiveHigh: number;
    /** Cognitive complexity threshold for "very complex" designation */
    cognitiveCritical: number;
    /** Maximum recommended nesting depth */
    maxNestingDepth: number;
    /** Maximum recommended function length (LOC) */
    maxFunctionLength: number;
}
/**
 * Default complexity thresholds
 */
export declare const DEFAULT_THRESHOLDS: ComplexityThresholds;
/**
 * Classification of complexity level
 */
export type ComplexityLevel = 'low' | 'moderate' | 'high' | 'critical';
/**
 * Function/method analysis result
 */
export interface FunctionAnalysis {
    /** Function name */
    name: string;
    /** File path containing the function */
    filePath: string;
    /** Start line number (1-indexed) */
    startLine: number;
    /** End line number (1-indexed) */
    endLine: number;
    /** Function kind (function, method, arrow, constructor) */
    kind: FunctionKind;
    /** Complexity scores */
    complexity: ComplexityScore;
    /** Complexity classification */
    level: ComplexityLevel;
    /** Parent class/object name if applicable */
    parentName?: string;
    /** Is this an async function */
    isAsync: boolean;
    /** Is this an exported function */
    isExported: boolean;
    /** List of issue descriptions */
    issues: string[];
    /** Recommendations for improvement */
    recommendations: string[];
}
/**
 * Types of functions detected
 */
export type FunctionKind = 'function' | 'arrow' | 'method' | 'constructor' | 'getter' | 'setter' | 'generator' | 'asyncGenerator';
/**
 * Complete file analysis result
 */
export interface FileAnalysis {
    /** Absolute file path */
    filePath: string;
    /** Relative path from project root */
    relativePath: string;
    /** File extension */
    extension: string;
    /** File-level complexity scores (aggregated) */
    complexity: FileComplexityScore;
    /** All functions in the file */
    functions: FunctionAnalysis[];
    /** Number of classes */
    classCount: number;
    /** Number of imports */
    importCount: number;
    /** Number of exports */
    exportCount: number;
    /** Analysis timestamp */
    analyzedAt: Date;
    /** Parse errors if any */
    parseErrors: string[];
    /** Complex functions (exceeding thresholds) */
    complexFunctions: FunctionAnalysis[];
    /** Overall file complexity level */
    level: ComplexityLevel;
}
/**
 * File-level complexity aggregation
 */
export interface FileComplexityScore extends ComplexityScore {
    /** Average cyclomatic complexity per function */
    avgCyclomatic: number;
    /** Average cognitive complexity per function */
    avgCognitive: number;
    /** Total function count */
    functionCount: number;
    /** Maintainability index (0-100, higher is better) */
    maintainabilityIndex: number;
}
/**
 * Project-wide analysis result
 */
export interface ProjectAnalysis {
    /** Project root path */
    projectRoot: string;
    /** All analyzed files */
    files: FileAnalysis[];
    /** Project-level aggregated metrics */
    metrics: ProjectMetrics;
    /** Files with complexity issues */
    hotspots: FileAnalysis[];
    /** Most complex functions across project */
    complexFunctions: FunctionAnalysis[];
    /** Analysis configuration used */
    config: AnalyzerConfig;
    /** Analysis timing */
    timing: {
        startedAt: Date;
        completedAt: Date;
        durationMs: number;
    };
}
/**
 * Project-wide metrics
 */
export interface ProjectMetrics {
    /** Total files analyzed */
    totalFiles: number;
    /** Total functions analyzed */
    totalFunctions: number;
    /** Total lines of code */
    totalLoc: number;
    /** Average cyclomatic complexity */
    avgCyclomatic: number;
    /** Average cognitive complexity */
    avgCognitive: number;
    /** Average maintainability index */
    avgMaintainability: number;
    /** Distribution of complexity levels */
    complexityDistribution: Record<ComplexityLevel, number>;
    /** Files by complexity level */
    filesByLevel: Record<ComplexityLevel, number>;
    /** Most complex files (top N) */
    topComplexFiles: Array<{
        path: string;
        score: number;
    }>;
    /** Most complex functions (top N) */
    topComplexFunctions: Array<{
        name: string;
        file: string;
        score: number;
    }>;
}
/**
 * File patterns to include/exclude
 */
export interface FilePatterns {
    /** Glob patterns for files to include */
    include: string[];
    /** Glob patterns for files to exclude */
    exclude: string[];
}
/**
 * Analyzer configuration
 */
export interface AnalyzerConfig {
    /** Project root directory */
    projectRoot: string;
    /** File patterns to analyze */
    patterns: FilePatterns;
    /** Complexity thresholds */
    thresholds: ComplexityThresholds;
    /** Maximum files to analyze */
    maxFiles?: number;
    /** Include node_modules */
    includeNodeModules: boolean;
    /** Include test files */
    includeTests: boolean;
    /** Generate graph nodes for complex functions */
    generateGraphNodes: boolean;
    /** Minimum complexity to include in results */
    minComplexityToReport: number;
    /** Enable verbose logging */
    verbose: boolean;
}
/**
 * Default analyzer configuration
 */
export declare const DEFAULT_CONFIG: AnalyzerConfig;
/**
 * Complexity node type for knowledge graph
 */
export type ComplexityNodeType = 'complexity-hotspot' | 'complex-function' | 'complex-file';
/**
 * Node generated from complexity analysis
 */
export interface ComplexityNode {
    /** Node ID (unique identifier) */
    id: string;
    /** Node type */
    type: ComplexityNodeType;
    /** Display title */
    title: string;
    /** File path */
    filePath: string;
    /** Function name if applicable */
    functionName?: string;
    /** Line range */
    lineRange?: {
        start: number;
        end: number;
    };
    /** Complexity scores */
    complexity: ComplexityScore;
    /** Complexity level */
    level: ComplexityLevel;
    /** Issues identified */
    issues: string[];
    /** Recommendations */
    recommendations: string[];
    /** Related node IDs */
    relatedNodes: string[];
    /** Tags for categorization */
    tags: string[];
    /** Creation timestamp */
    createdAt: Date;
}
/**
 * Edge connecting complexity nodes to file nodes
 */
export interface ComplexityEdge {
    /** Source node ID */
    source: string;
    /** Target node ID */
    target: string;
    /** Edge type for complexity relationships */
    type: 'complexity' | 'contains' | 'related';
    /** Relationship weight */
    weight: number;
    /** Context for the edge */
    context?: string;
    /** Complexity score associated with this relationship */
    complexityScore?: number;
}
/**
 * Plugin result from analysis
 */
export interface ComplexityPluginResult {
    /** Analysis success */
    success: boolean;
    /** Project-wide analysis */
    analysis: ProjectAnalysis;
    /** Generated knowledge graph nodes */
    nodes: ComplexityNode[];
    /** Generated edges */
    edges: ComplexityEdge[];
    /** Error messages if any */
    errors: string[];
    /** Warning messages */
    warnings: string[];
}
/**
 * Plugin options for integration
 */
export interface ComplexityPluginOptions {
    /** Analyzer configuration */
    config?: Partial<AnalyzerConfig>;
    /** Store results in cache */
    useCache?: boolean;
    /** Cache TTL in milliseconds */
    cacheTtl?: number;
    /** Generate markdown report */
    generateReport?: boolean;
    /** Report output path */
    reportPath?: string;
}
/**
 * Cache entry for complexity results
 */
export interface ComplexityAnalysisCache {
    /** File path */
    filePath: string;
    /** File modification time */
    mtime: number;
    /** Cached analysis result */
    analysis: FileAnalysis;
    /** Cache timestamp */
    cachedAt: number;
}
//# sourceMappingURL=types.d.ts.map