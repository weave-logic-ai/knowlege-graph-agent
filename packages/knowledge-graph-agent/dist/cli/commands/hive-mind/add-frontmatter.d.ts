/**
 * Hive Mind - Frontmatter Enricher
 *
 * Adds or enriches YAML frontmatter in markdown files to improve discoverability
 * and enable better linking between documents.
 *
 * SPEC-003: Hive Mind Reconnection Tools
 */
import { Command } from 'commander';
export interface EnrichOptions {
    overwrite?: boolean;
    tags?: boolean;
    aliases?: boolean;
    links?: boolean;
    dryRun?: boolean;
    output?: string;
    json?: boolean;
    verbose?: boolean;
}
export interface FrontmatterTemplate {
    title: string;
    created: string;
    modified: string;
    tags: string[];
    aliases: string[];
    links: string[];
    type: string;
    status: string;
    description?: string;
}
export interface EnrichedFile {
    file: string;
    added: string[];
    updated: string[];
    frontmatter: FrontmatterTemplate;
}
export interface EnrichResult {
    enriched: EnrichedFile[];
    skipped: string[];
    errors: Array<{
        file: string;
        error: string;
    }>;
    statistics: {
        totalFiles: number;
        enrichedCount: number;
        skippedCount: number;
        errorCount: number;
        tagsAdded: number;
        aliasesAdded: number;
        linksExtracted: number;
    };
}
export declare class FrontmatterEnricher {
    /**
     * Enrich frontmatter for all files in a vault
     */
    enrichVault(vaultPath: string, options?: EnrichOptions): Promise<EnrichResult>;
    /**
     * Enrich a single file's frontmatter
     */
    enrichFile(filePath: string, relativePath: string, options: EnrichOptions): Promise<EnrichedFile | null>;
    /**
     * Extract metadata from content and filename
     */
    private extractMetadata;
    /**
     * Generate aliases from title
     */
    private generateAliases;
    /**
     * Extract hashtags from content
     */
    private extractHashtags;
    /**
     * Infer tags from content analysis
     */
    private inferTagsFromContent;
    /**
     * Infer document type from content
     */
    private inferType;
    /**
     * Extract wiki-links from content
     */
    private extractWikiLinks;
    /**
     * Extract first paragraph as description
     */
    private extractDescription;
    /**
     * Build markdown content with frontmatter
     */
    private buildMarkdownWithFrontmatter;
    /**
     * Generate report
     */
    generateReport(result: EnrichResult): string;
}
export declare function createAddFrontmatterCommand(): Command;
export default createAddFrontmatterCommand;
//# sourceMappingURL=add-frontmatter.d.ts.map