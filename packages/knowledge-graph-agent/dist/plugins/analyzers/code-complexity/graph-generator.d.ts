/**
 * Knowledge Graph Node Generator for Complexity Analysis
 *
 * Generates knowledge graph nodes and edges from complexity analysis results.
 * Creates structured documentation for complex code that can be integrated
 * into the knowledge graph.
 *
 * @module plugins/analyzers/code-complexity/graph-generator
 */
import type { ComplexityNode, ComplexityEdge, FunctionAnalysis, FileAnalysis, ProjectAnalysis, AnalyzerConfig } from './types.js';
import type { KnowledgeNode } from '../../../core/types.js';
/**
 * Generates knowledge graph nodes from complexity analysis results
 */
export declare class ComplexityGraphGenerator {
    private projectRoot;
    private thresholds;
    constructor(projectRoot: string, config?: Partial<AnalyzerConfig>);
    /**
     * Generate all nodes from project analysis
     */
    generateNodes(analysis: ProjectAnalysis): ComplexityNode[];
    /**
     * Generate a node for a complex function
     */
    generateFunctionNode(fn: FunctionAnalysis): ComplexityNode;
    /**
     * Generate a node for a complex file
     */
    generateFileNode(file: FileAnalysis): ComplexityNode;
    /**
     * Generate edges connecting complexity nodes
     */
    generateEdges(nodes: ComplexityNode[], analysis: ProjectAnalysis): ComplexityEdge[];
    /**
     * Convert complexity nodes to knowledge graph nodes
     */
    toKnowledgeNodes(nodes: ComplexityNode[]): KnowledgeNode[];
    /**
     * Convert a complexity node to a knowledge node
     */
    private complexityToKnowledge;
    /**
     * Generate markdown content for a complexity node
     */
    generateMarkdownContent(node: ComplexityNode): string;
    /**
     * Generate report markdown for entire project
     */
    generateProjectReport(analysis: ProjectAnalysis): string;
    private generateFunctionTitle;
    private generateFunctionTags;
    private generateFileTags;
    private generateFileIssues;
    private generateFileRecommendations;
    private generateDescription;
    private getSeverityEmoji;
}
/**
 * Create a complexity graph generator
 */
export declare function createGraphGenerator(projectRoot: string, config?: Partial<AnalyzerConfig>): ComplexityGraphGenerator;
/**
 * Generate knowledge graph nodes from analysis
 */
export declare function generateComplexityNodes(analysis: ProjectAnalysis, projectRoot: string): {
    nodes: ComplexityNode[];
    edges: ComplexityEdge[];
};
//# sourceMappingURL=graph-generator.d.ts.map