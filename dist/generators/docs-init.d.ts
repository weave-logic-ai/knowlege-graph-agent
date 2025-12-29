/**
 * Docs Directory Initializer
 *
 * Creates the initial docs directory structure following the weave-nn
 * methodology with proper PRIMITIVES.md taxonomy.
 *
 * SECURITY NOTES (Handlebars Templates):
 * - All templates use double-braces {{}} which HTML-escapes output
 * - Triple-braces {{{raw}}} are NOT used, preventing injection attacks
 * - Template variables come from internal sources (project analysis), not direct user input
 * - See: https://handlebarsjs.com/guide/#html-escaping
 */
import type { DocsInitOptions, DocsInitResult } from '../core/types.js';
/**
 * Initialize docs directory
 */
export declare function initDocs(options: DocsInitOptions): Promise<DocsInitResult>;
/**
 * Check if docs directory exists
 */
export declare function docsExist(projectRoot: string, docsPath?: string): boolean;
/**
 * Get docs path for a project
 */
export declare function getDocsPath(projectRoot: string): string | null;
//# sourceMappingURL=docs-init.d.ts.map