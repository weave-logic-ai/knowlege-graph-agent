/**
 * Knowledge Graph Generator for Dependencies
 *
 * Generates knowledge graph nodes and edges from dependency health analysis.
 * Creates interconnected nodes representing dependencies with health metadata.
 *
 * @module plugins/analyzers/dependency-health/graph-generator
 */
import type { KnowledgeNode, GraphEdge } from '../../../core/types.js';
import type { DependencyHealthAnalysis, DependencyHealthNode, DependencyEdge } from './types.js';
/**
 * DependencyGraphGenerator class
 */
export declare class DependencyGraphGenerator {
    private projectName;
    constructor(projectName?: string);
    /**
     * Generate knowledge graph nodes from analysis result
     */
    generateNodes(analysis: DependencyHealthAnalysis): DependencyHealthNode[];
    /**
     * Generate warning metadata from health score
     */
    private generateWarnings;
    /**
     * Generate edges representing dependency relationships
     */
    generateEdges(nodes: DependencyHealthNode[], packageJsonDeps?: Record<string, string>): DependencyEdge[];
    /**
     * Convert DependencyHealthNode to standard KnowledgeNode
     */
    toKnowledgeNode(node: DependencyHealthNode): KnowledgeNode;
    /**
     * Convert GraphEdge to standard format
     */
    toGraphEdge(edge: DependencyEdge): GraphEdge;
    /**
     * Generate full graph structure
     */
    generateGraph(analysis: DependencyHealthAnalysis): {
        nodes: KnowledgeNode[];
        edges: GraphEdge[];
        metadata: {
            totalDependencies: number;
            averageHealthScore: number;
            vulnerableCount: number;
            outdatedCount: number;
            analyzedAt: string;
        };
    };
    /**
     * Generate markdown summary of dependency health
     */
    generateMarkdownReport(analysis: DependencyHealthAnalysis): string;
}
/**
 * Create a dependency graph generator instance
 */
export declare function createDependencyGraphGenerator(projectName?: string): DependencyGraphGenerator;
//# sourceMappingURL=graph-generator.d.ts.map