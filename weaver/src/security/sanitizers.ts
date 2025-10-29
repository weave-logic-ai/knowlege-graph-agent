/**
 * Input Sanitization Helpers
 *
 * Prevent common security vulnerabilities:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection
 * - Command Injection
 * - Path Traversal
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

// ============================================================================
// HTML/XSS Sanitization
// ============================================================================

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(input: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Strip all HTML tags from input
 */
export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize HTML attributes
 */
export function sanitizeHtmlAttribute(input: string): string {
  // Remove any quotes and HTML entities
  return input
    .replace(/["'<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

// ============================================================================
// SQL Injection Prevention
// ============================================================================

/**
 * Escape SQL string literals (for emergency use only - prefer parameterized queries)
 */
export function escapeSqlString(input: string): string {
  // Replace single quotes with two single quotes (SQL standard)
  return input.replace(/'/g, "''");
}

/**
 * Validate SQL identifier (table/column name)
 */
export function validateSqlIdentifier(identifier: string): boolean {
  // Only allow alphanumeric and underscore
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

/**
 * Sanitize SQL identifier
 * @throws {Error} if identifier is invalid
 */
export function sanitizeSqlIdentifier(identifier: string): string {
  if (!validateSqlIdentifier(identifier)) {
    throw new Error(`Invalid SQL identifier: ${identifier}`);
  }
  return identifier;
}

/**
 * Build safe WHERE clause with parameterized values
 */
export function buildWhereClause(
  conditions: Record<string, unknown>
): { clause: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];

  for (const [key, value] of Object.entries(conditions)) {
    sanitizeSqlIdentifier(key); // Validate column name
    clauses.push(`${key} = ?`);
    params.push(value);
  }

  return {
    clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

// ============================================================================
// Command Injection Prevention
// ============================================================================

/**
 * Escape shell arguments for safe command execution
 */
export function escapeShellArg(arg: string): string {
  // For Unix-like systems
  if (process.platform !== 'win32') {
    // Wrap in single quotes and escape any single quotes
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }

  // For Windows
  // Escape special characters
  return `"${arg.replace(/(["%!^])/g, '^$1')}"`;
}

/**
 * Escape shell command (dangerous - prefer child_process with args array)
 */
export function escapeShellCommand(command: string): string {
  // Remove potentially dangerous characters
  return command.replace(/[;&|`$(){}[\]<>]/g, '');
}

/**
 * Validate shell command against allowlist
 */
export function validateShellCommand(
  command: string,
  allowedCommands: string[]
): boolean {
  const cmdName = command.split(/\s+/)[0];
  return allowedCommands.includes(cmdName);
}

/**
 * Safely execute shell command with validated arguments
 */
export function safeExecSync(
  command: string,
  args: string[],
  allowedCommands: string[]
): Buffer {
  if (!validateShellCommand(command, allowedCommands)) {
    throw new Error(`Command not allowed: ${command}`);
  }

  // Escape all arguments
  const escapedArgs = args.map(escapeShellArg);
  const fullCommand = `${command} ${escapedArgs.join(' ')}`;

  return execSync(fullCommand, { encoding: 'buffer' });
}

// ============================================================================
// Path Traversal Prevention
// ============================================================================

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(
  filePath: string,
  basePath?: string
): string {
  // Normalize the path
  const normalized = path.normalize(filePath);

  // Check for directory traversal attempts
  if (normalized.includes('..')) {
    throw new Error('Directory traversal detected');
  }

  // If basePath provided, ensure the path is within it
  if (basePath) {
    const resolvedBase = path.resolve(basePath);
    const resolvedPath = path.resolve(basePath, normalized);

    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error('Path is outside base directory');
    }

    return resolvedPath;
  }

  return normalized;
}

/**
 * Validate filename (no path separators)
 */
export function validateFilename(filename: string): boolean {
  // No path separators, no control characters
  return (
    !filename.includes('/') &&
    !filename.includes('\\') &&
    !filename.includes('\0') &&
    !/[\x00-\x1f\x7f]/.test(filename)
  );
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  if (!validateFilename(filename)) {
    throw new Error(`Invalid filename: ${filename}`);
  }

  // Remove potentially problematic characters
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// ============================================================================
// URL Sanitization
// ============================================================================

/**
 * Sanitize URL to prevent open redirect vulnerabilities
 */
export function sanitizeUrl(
  url: string,
  allowedDomains?: string[]
): string {
  try {
    const parsed = new URL(url);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }

    // Check domain allowlist if provided
    if (allowedDomains && !allowedDomains.includes(parsed.hostname)) {
      throw new Error('Domain not allowed');
    }

    return parsed.toString();
  } catch (error) {
    throw new Error(`Invalid URL: ${(error as Error).message}`);
  }
}

/**
 * Validate redirect URL (prevent open redirect)
 */
export function validateRedirectUrl(
  url: string,
  allowedDomains: string[]
): boolean {
  try {
    const parsed = new URL(url);
    return (
      ['http:', 'https:'].includes(parsed.protocol) &&
      allowedDomains.includes(parsed.hostname)
    );
  } catch {
    return false;
  }
}

// ============================================================================
// JSON Sanitization
// ============================================================================

/**
 * Sanitize JSON to prevent prototype pollution
 */
export function sanitizeJson<T = unknown>(obj: unknown): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeJson) as T;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip dangerous keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    sanitized[key] = sanitizeJson(value);
  }

  return sanitized as T;
}

/**
 * Safely parse JSON and sanitize
 */
export function safeJsonParse<T = unknown>(jsonString: string): T {
  const parsed = JSON.parse(jsonString);
  return sanitizeJson<T>(parsed);
}

// ============================================================================
// Email Sanitization
// ============================================================================

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  return email.toLowerCase().trim();
}

// ============================================================================
// Regular Expression Sanitization (ReDoS Prevention)
// ============================================================================

/**
 * Validate regex pattern to prevent ReDoS attacks
 */
export function validateRegexPattern(pattern: string): boolean {
  // Detect potentially dangerous patterns
  const dangerousPatterns = [
    /(\(.*\+){3,}/, // Nested quantifiers
    /(\(.*\*){3,}/, // Nested quantifiers
    /(\(.*\{.*,.*\}){3,}/, // Nested range quantifiers
  ];

  return !dangerousPatterns.some(dangerous => dangerous.test(pattern));
}

/**
 * Safely create RegExp with timeout protection
 */
export function safeRegExp(
  pattern: string,
  flags?: string,
  timeoutMs = 1000
): RegExp {
  if (!validateRegexPattern(pattern)) {
    throw new Error('Potentially dangerous regex pattern detected');
  }

  const regex = new RegExp(pattern, flags);

  // Create a wrapper that times out
  const originalTest = regex.test.bind(regex);
  regex.test = function (str: string): boolean {
    let timeoutId: NodeJS.Timeout;
    let completed = false;
    let result = false;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        if (!completed) {
          reject(new Error('RegExp timeout'));
        }
      }, timeoutMs);
    });

    const testPromise = Promise.resolve(originalTest(str));

    return Promise.race([testPromise, timeoutPromise])
      .then(res => {
        completed = true;
        clearTimeout(timeoutId);
        result = res as boolean;
        return result;
      })
      .catch(() => {
        throw new Error('RegExp execution timed out (possible ReDoS)');
      }) as unknown as boolean;
  };

  return regex;
}

// ============================================================================
// LDAP Injection Prevention
// ============================================================================

/**
 * Escape LDAP special characters
 */
export function escapeLdapFilter(input: string): string {
  const ldapEscapeMap: Record<string, string> = {
    '\\': '\\5c',
    '*': '\\2a',
    '(': '\\28',
    ')': '\\29',
    '\0': '\\00',
  };

  return input.replace(/[\\*()\0]/g, (char) => ldapEscapeMap[char] || char);
}

/**
 * Escape LDAP DN (Distinguished Name) special characters
 */
export function escapeLdapDn(input: string): string {
  const dnEscapeMap: Record<string, string> = {
    '\\': '\\\\',
    ',': '\\,',
    '+': '\\+',
    '"': '\\"',
    '<': '\\<',
    '>': '\\>',
    ';': '\\;',
    '=': '\\=',
    '\0': '\\00',
  };

  return input.replace(/[\\,+"<>;=\0]/g, (char) => dnEscapeMap[char] || char);
}

// ============================================================================
// XML Injection Prevention
// ============================================================================

/**
 * Escape XML special characters
 */
export function escapeXml(input: string): string {
  const xmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  };

  return input.replace(/[&<>"']/g, (char) => xmlEscapeMap[char] || char);
}

// ============================================================================
// CSV Injection Prevention
// ============================================================================

/**
 * Sanitize CSV cell to prevent formula injection
 */
export function sanitizeCsvCell(input: string): string {
  // If starts with dangerous characters, prepend single quote
  if (/^[=+\-@]/.test(input)) {
    return `'${input}`;
  }

  // Escape quotes
  return input.replace(/"/g, '""');
}

// ============================================================================
// General Input Sanitization
// ============================================================================

/**
 * Remove control characters
 */
export function removeControlCharacters(input: string): string {
  return input.replace(/[\x00-\x1f\x7f]/g, '');
}

/**
 * Truncate string to maximum length
 */
export function truncate(input: string, maxLength: number): string {
  return input.length > maxLength ? input.slice(0, maxLength) : input;
}

/**
 * Sanitize user input (general purpose)
 */
export function sanitizeUserInput(
  input: string,
  options: {
    maxLength?: number;
    removeHtml?: boolean;
    removeControlChars?: boolean;
  } = {}
): string {
  let sanitized = input;

  if (options.removeControlChars) {
    sanitized = removeControlCharacters(sanitized);
  }

  if (options.removeHtml) {
    sanitized = stripHtmlTags(sanitized);
  }

  if (options.maxLength) {
    sanitized = truncate(sanitized, options.maxLength);
  }

  return sanitized.trim();
}
