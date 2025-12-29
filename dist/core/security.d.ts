/**
 * Security Utilities
 *
 * Helper functions for input validation and security.
 */
/**
 * Validate that a path stays within a base directory
 * Prevents path traversal attacks
 *
 * @param basePath - The base directory that paths must stay within
 * @param relativePath - The relative path to validate
 * @returns The resolved absolute path
 * @throws Error if path traversal is detected
 */
export declare function validatePath(basePath: string, relativePath: string): string;
/**
 * Validate and sanitize a project root path
 * Ensures the path exists and is a directory
 *
 * @param projectRoot - The project root path
 * @returns The resolved absolute path
 * @throws Error if invalid
 */
export declare function validateProjectRoot(projectRoot: string): string;
/**
 * Validate a docs path relative to project root
 *
 * @param projectRoot - The project root path
 * @param docsPath - The docs directory path (relative or absolute)
 * @returns The validated absolute path
 * @throws Error if path traversal detected
 */
export declare function validateDocsPath(projectRoot: string, docsPath: string): string;
/**
 * Sanitize a filename to prevent directory traversal
 *
 * @param filename - The filename to sanitize
 * @returns The sanitized filename
 */
export declare function sanitizeFilename(filename: string): string;
/**
 * Sanitize user input for safe display
 * Removes potentially dangerous characters
 *
 * @param input - The input string to sanitize
 * @param maxLength - Maximum length (default 1000)
 * @returns The sanitized string
 */
export declare function sanitizeInput(input: string, maxLength?: number): string;
/**
 * Validate a template path - must be within project and be a .md file
 *
 * @param projectRoot - The project root path
 * @param templatePath - The template path to validate
 * @returns The validated absolute path or null if invalid
 */
export declare function validateTemplatePath(projectRoot: string, templatePath: string): string | null;
/**
 * Check if a string looks like a file path
 */
export declare function looksLikePath(str: string): boolean;
//# sourceMappingURL=security.d.ts.map