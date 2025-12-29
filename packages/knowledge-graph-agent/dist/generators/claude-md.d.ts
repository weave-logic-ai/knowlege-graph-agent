/**
 * CLAUDE.md Generator
 *
 * Generates and manages CLAUDE.md configuration files for Claude Code
 * with knowledge graph integration.
 *
 * SECURITY NOTES (Handlebars Templates):
 * - All templates use double-braces {{}} which HTML-escapes output
 * - Triple-braces {{{raw}}} are NOT used, preventing XSS in HTML contexts
 * - User input is sanitized via sanitizeTemplateInput() before template use
 * - Template content is validated and Handlebars delimiters are stripped from user input
 * - See: https://handlebarsjs.com/guide/#html-escaping
 */
import type { ClaudeMdGeneratorOptions, ClaudeMdSection } from '../core/types.js';
/**
 * Generate CLAUDE.md content
 */
export declare function generateClaudeMd(options: ClaudeMdGeneratorOptions): string;
/**
 * Create or update CLAUDE.md file
 */
export declare function updateClaudeMd(options: ClaudeMdGeneratorOptions): Promise<{
    created: boolean;
    updated: boolean;
    path: string;
    content: string;
}>;
/**
 * Add section to existing CLAUDE.md
 */
export declare function addSection(projectRoot: string, section: ClaudeMdSection): boolean;
/**
 * Get predefined section template
 */
export declare function getSectionTemplate(name: string): ClaudeMdSection | null;
/**
 * List available section templates
 */
export declare function listSectionTemplates(): string[];
//# sourceMappingURL=claude-md.d.ts.map