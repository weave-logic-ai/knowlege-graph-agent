/**
 * Hive Mind - Link Analyzer
 *
 * Analyzes wiki-links and markdown links in a vault to build an adjacency list
 * and identify orphan files.
 *
 * SPEC-003: Hive Mind Reconnection Tools
 */
import { Command } from 'commander';
export interface AnalyzeOptions {
    output?: string;
    json?: boolean;
    verbose?: boolean;
    includeContent?: boolean;
}
export interface BrokenLink {
    source: string;
    target: string;
    type: 'wikilink' | 'markdown';
    lineNumber?: number;
}
export interface LinkAnalysisResult {
    totalFiles: number;
    filesWithLinks: number;
    orphanFiles: string[];
    orphanRate: number;
    linkDensity: number;
    adjacencyList: Map<string, string[]>;
    brokenLinks: BrokenLink[];
    statistics: {
        totalLinks: number;
        wikiLinks: number;
        markdownLinks: number;
        averageLinksPerFile: number;
        maxLinksInFile: number;
        maxLinksFile: string;
        isolatedClusters: number;
    };
}
export declare class LinkAnalyzer {
    private fileMap;
    private allFiles;
    /**
     * Analyze a vault for links and build adjacency list
     */
    analyzeVault(vaultPath: string, options?: AnalyzeOptions): Promise<LinkAnalysisResult>;
    /**
     * Build a map from filename (without extension) to full path
     */
    private buildFileMap;
    /**
     * Parse [[wiki-links]] from content
     * Handles: [[link]], [[link|alias]], [[folder/link]], [[link#heading]]
     */
    parseWikiLinks(content: string): string[];
    /**
     * Parse [markdown](links) from content
     * Handles: [text](link.md), [text](./link.md), [text](../folder/link.md)
     */
    parseMarkdownLinks(content: string): string[];
    /**
     * Check if a link is external (http, https, etc.)
     */
    private isExternalLink;
    /**
     * Resolve a link to a file in the vault
     */
    private resolveLink;
    /**
     * Count isolated clusters using union-find algorithm
     */
    private countClusters;
    /**
     * Generate a detailed report
     */
    generateReport(result: LinkAnalysisResult): string;
}
export declare function createAnalyzeLinksCommand(): Command;
export default createAnalyzeLinksCommand;
//# sourceMappingURL=analyze-links.d.ts.map