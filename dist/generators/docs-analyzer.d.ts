/**
 * Docs Analyzer
 *
 * Advanced documentation analyzer that uses claude-flow to create
 * comprehensive knowledge graph documentation with proper structure,
 * wikilinks, frontmatter, and tags following Obsidian conventions.
 */
import type { NodeType } from '../core/types.js';
/**
 * Analyzer options
 */
export interface AnalyzerOptions {
    /** Source directory with existing docs */
    sourceDir: string;
    /** Target directory (default: docs-nn) */
    targetDir?: string;
    /** Project root for path resolution */
    projectRoot: string;
    /** Use claude-flow for deep analysis */
    useClaudeFlow?: boolean;
    /** Create MOC (Map of Content) files */
    createMOC?: boolean;
    /** Link back to original docs */
    linkOriginal?: boolean;
    /** Maximum depth for analysis */
    maxDepth?: number;
    /** Dry run - show what would be done */
    dryRun?: boolean;
    /** Verbose output */
    verbose?: boolean;
}
/**
 * Analyzed document
 */
export interface AnalyzedDoc {
    /** Original file path */
    originalPath: string;
    /** New file path in docs-nn */
    newPath: string;
    /** Document title */
    title: string;
    /** Detected node type */
    type: NodeType;
    /** Extracted tags */
    tags: string[];
    /** Related documents (wikilinks) */
    related: string[];
    /** Key concepts extracted */
    concepts: string[];
    /** Areas needing research */
    researchNeeded: string[];
    /** TODOs found or generated */
    todos: string[];
    /** Summary/description */
    summary: string;
    /** Category path in structure */
    category: string;
}
/**
 * Analyzer result
 */
export interface AnalyzerResult {
    success: boolean;
    filesAnalyzed: number;
    filesCreated: number;
    mocFilesCreated: number;
    errors: string[];
    analyzed: AnalyzedDoc[];
    structure: Map<string, string[]>;
}
/**
 * Analyze and migrate documentation to weave-nn structure
 */
export declare function analyzeDocs(options: AnalyzerOptions): Promise<AnalyzerResult>;
//# sourceMappingURL=docs-analyzer.d.ts.map