/**
 * Docs Converter
 *
 * Converts existing documentation to weave-nn structure with proper
 * frontmatter and directory organization.
 */
import type { NodeType, NodeStatus } from '../core/types.js';
/**
 * Conversion options
 */
export interface ConvertOptions {
    /** Source directory with existing docs */
    sourceDir: string;
    /** Target directory (default: docs-nn) */
    targetDir?: string;
    /** Project root for path resolution */
    projectRoot: string;
    /** Preserve original files (copy instead of move) */
    preserveOriginal?: boolean;
    /** Overwrite existing files in target */
    force?: boolean;
    /** Auto-categorize based on content analysis */
    autoCategory?: boolean;
    /** Dry run - show what would be done */
    dryRun?: boolean;
}
/**
 * Frontmatter options
 */
export interface FrontmatterOptions {
    /** Target file or directory */
    target: string;
    /** Project root */
    projectRoot: string;
    /** Override type detection */
    type?: NodeType;
    /** Override status */
    status?: NodeStatus;
    /** Additional tags to add */
    tags?: string[];
    /** Force overwrite existing frontmatter */
    force?: boolean;
    /** Dry run */
    dryRun?: boolean;
}
/**
 * Conversion result
 */
export interface ConvertResult {
    success: boolean;
    filesProcessed: number;
    filesConverted: number;
    filesSkipped: number;
    errors: string[];
    converted: Array<{
        source: string;
        target: string;
        type: NodeType;
    }>;
}
/**
 * Frontmatter result
 */
export interface FrontmatterResult {
    success: boolean;
    filesProcessed: number;
    filesUpdated: number;
    filesSkipped: number;
    errors: string[];
}
/**
 * Convert existing docs to weave-nn structure
 */
export declare function convertDocs(options: ConvertOptions): Promise<ConvertResult>;
/**
 * Add or update frontmatter in existing files
 */
export declare function addFrontmatter(options: FrontmatterOptions): Promise<FrontmatterResult>;
/**
 * Validate frontmatter in files
 */
export declare function validateFrontmatter(target: string, projectRoot: string): Promise<{
    valid: number;
    invalid: number;
    missing: number;
    issues: Array<{
        file: string;
        issues: string[];
    }>;
}>;
//# sourceMappingURL=docs-convert.d.ts.map