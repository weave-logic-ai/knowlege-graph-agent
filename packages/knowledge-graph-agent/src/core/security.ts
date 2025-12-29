/**
 * Security Utilities
 *
 * Helper functions for input validation and security.
 */

import { resolve, normalize, isAbsolute } from 'path';

/**
 * Validate that a path stays within a base directory
 * Prevents path traversal attacks
 *
 * @param basePath - The base directory that paths must stay within
 * @param relativePath - The relative path to validate
 * @returns The resolved absolute path
 * @throws Error if path traversal is detected
 */
export function validatePath(basePath: string, relativePath: string): string {
  // Resolve the base path to absolute
  const resolvedBase = resolve(basePath);

  // Handle absolute paths - must still be within base
  const targetPath = isAbsolute(relativePath)
    ? normalize(relativePath)
    : resolve(resolvedBase, relativePath);

  const normalizedTarget = normalize(targetPath);

  // Ensure the resolved path is within the base path
  if (!normalizedTarget.startsWith(resolvedBase + '/') && normalizedTarget !== resolvedBase) {
    throw new Error(`Path traversal detected: "${relativePath}" escapes base directory`);
  }

  return normalizedTarget;
}

/**
 * Validate and sanitize a project root path
 * Ensures the path exists and is a directory
 *
 * @param projectRoot - The project root path
 * @returns The resolved absolute path
 * @throws Error if invalid
 */
export function validateProjectRoot(projectRoot: string): string {
  if (!projectRoot || typeof projectRoot !== 'string') {
    throw new Error('Project root path is required');
  }

  // Resolve to absolute path
  const resolved = resolve(projectRoot);

  // Check for suspicious patterns
  if (resolved.includes('\0')) {
    throw new Error('Invalid null byte in path');
  }

  return resolved;
}

/**
 * Validate a docs path relative to project root
 *
 * @param projectRoot - The project root path
 * @param docsPath - The docs directory path (relative or absolute)
 * @returns The validated absolute path
 * @throws Error if path traversal detected
 */
export function validateDocsPath(projectRoot: string, docsPath: string): string {
  const resolvedRoot = validateProjectRoot(projectRoot);

  // Default to 'docs' if empty
  const safeDocs = docsPath?.trim() || 'docs';

  // Validate it stays within project
  return validatePath(resolvedRoot, safeDocs);
}

/**
 * Sanitize a filename to prevent directory traversal
 *
 * @param filename - The filename to sanitize
 * @returns The sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'untitled';
  }

  return filename
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[<>:"|?*\0]/g, '') // Remove invalid filename chars
    .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
    .slice(0, 255); // Limit length
}

/**
 * Sanitize user input for safe display
 * Removes potentially dangerous characters
 *
 * @param input - The input string to sanitize
 * @param maxLength - Maximum length (default 1000)
 * @returns The sanitized string
 */
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/[<>&"'`]/g, '') // Remove HTML-sensitive chars
    .slice(0, maxLength)
    .trim();
}

/**
 * Validate a template path - must be within project and be a .md file
 *
 * @param projectRoot - The project root path
 * @param templatePath - The template path to validate
 * @returns The validated absolute path or null if invalid
 */
export function validateTemplatePath(
  projectRoot: string,
  templatePath: string
): string | null {
  try {
    const resolvedRoot = validateProjectRoot(projectRoot);
    const validated = validatePath(resolvedRoot, templatePath);

    // Must be a markdown file
    if (!validated.endsWith('.md')) {
      return null;
    }

    return validated;
  } catch {
    return null;
  }
}

/**
 * Check if a string looks like a file path
 */
export function looksLikePath(str: string): boolean {
  return str.includes('/') || str.includes('\\') || str.startsWith('.');
}
