# Security Audit Report

**Package:** @weavelogic/knowledge-graph-agent
**Version:** 0.2.0
**Date:** 2025-12-29
**Auditor:** Claude Code Security Review Agent

---

## Executive Summary

This security audit reviewed the source code in `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src` for common security vulnerabilities including injection attacks, input validation issues, sensitive data handling, authentication/authorization, error handling, and dependency vulnerabilities.

### Overall Assessment: **GOOD** ✅

The codebase demonstrates security-conscious development with several protective measures already in place:
- Path traversal protection via `validatePath()` function
- FTS5 query sanitization in database operations
- Input length validation in MCP handlers
- Prepared statements for all SQL operations
- No hardcoded secrets detected
- Agent type allowlist validation (added 2025-12-29)
- Backup path traversal protection (added 2025-12-29)

**Update 2025-12-29:** All HIGH, MEDIUM, and LOW severity issues have been remediated.

---

## Findings Summary

| Severity | Count | Status | Description |
|----------|-------|--------|-------------|
| Critical | 0 | N/A | No critical vulnerabilities found |
| High | 2 | ✅ FIXED | Command injection, backup path validation |
| Medium | 5 | ✅ FIXED | Input validation, error leakage, shell injection |
| Low | 4 | ✅ FIXED | Logging, timeout, rate limiting, debug logs |

---

## Detailed Findings

### HIGH SEVERITY (REMEDIATED ✅)

#### H-001: Command Injection Risk in DeepAnalyzer — **FIXED**

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/cultivation/deep-analyzer.ts`
**Lines:** 346-352

**Description:**
The `runClaudeFlowAgent()` method constructs command arguments that include user-controlled input (`type` and `prompt`) without proper sanitization before passing to `spawn()`.

```typescript
const args = ['claude-flow@alpha', 'agent', 'execute', type, prompt, '--json'];

const proc = spawn('npx', args, {
  cwd: this.projectRoot,
  shell: true,  // shell: true increases injection risk
  timeout: this.agentTimeout,
});
```

**Risk:**
An attacker who can control the `type` or `prompt` parameters could inject shell commands.

**Recommended Fix:**
1. Set `shell: false` (default) instead of `shell: true`
2. Validate `type` against an allowlist of known agent types
3. Escape or sanitize the `prompt` parameter before use
4. Use `execFile()` or spawn with `shell: false` for safer command execution

```typescript
// Validate agent type against allowlist
const VALID_AGENT_TYPES = ['researcher', 'analyst', 'coder', 'tester', 'reviewer'];
if (!VALID_AGENT_TYPES.includes(type)) {
  throw new Error(`Invalid agent type: ${type}`);
}

const proc = spawn('npx', args, {
  cwd: this.projectRoot,
  shell: false,  // Safer: no shell interpretation
  timeout: this.agentTimeout,
});
```

---

#### H-002: Backup Path Validation Missing — **FIXED**

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/recovery/backup.ts`
**Lines:** 42-56, 262-268

**Description:**
The `BackupManager` accepts a `backupPath` configuration option without validating that it stays within expected boundaries. A malicious configuration could specify paths outside the project.

```typescript
constructor(dbPath: string, config?: Partial<BackupConfig>) {
  this.config = {
    // backupPath is used without path traversal validation
    backupPath: config?.backupPath ?? join(dbPath, '..', 'backups'),
    // ...
  };
}
```

**Risk:**
Path traversal could allow backup files to be written to arbitrary locations.

**Recommended Fix:**
```typescript
import { validatePath } from '../core/security.js';

// In constructor or updateConfig:
const resolvedBackupPath = validatePath(
  dirname(dbPath),  // or a configured base path
  config?.backupPath ?? 'backups'
);
```

---

### MEDIUM SEVERITY (REMEDIATED ✅)

#### M-001: Incomplete Input Validation in MCP Handler — **FIXED**

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/mcp-server/handlers/index.ts`
**Lines:** 109-135

**Description:**
The `validateParams()` function only checks string length but does not validate:
- Nested object depth (could cause stack overflow)
- Array lengths
- Numeric ranges
- Path values for traversal

```typescript
function validateParams(params: unknown, toolName: string): void {
  // Only string length is validated
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (typeof value === 'string') {
      if (value.length > 100000) {
        throw new McpError(/*...*/);
      }
    }
    // No validation for objects, arrays, numbers
  }
}
```

**Risk:**
Deeply nested objects or large arrays could cause DoS. Path parameters are not checked.

**Recommended Fix:**
```typescript
function validateParams(params: unknown, toolName: string, depth = 0): void {
  const MAX_DEPTH = 10;
  const MAX_ARRAY_LENGTH = 1000;

  if (depth > MAX_DEPTH) {
    throw new McpError(ErrorCode.InvalidParams, 'Object nesting too deep');
  }

  if (Array.isArray(params)) {
    if (params.length > MAX_ARRAY_LENGTH) {
      throw new McpError(ErrorCode.InvalidParams, 'Array too large');
    }
    params.forEach(item => validateParams(item, toolName, depth + 1));
    return;
  }

  if (typeof params === 'object' && params !== null) {
    for (const [key, value] of Object.entries(params)) {
      // Check for path traversal in path-like keys
      if (key.includes('path') && typeof value === 'string') {
        if (value.includes('..') || value.includes('\0')) {
          throw new McpError(ErrorCode.InvalidParams, 'Invalid path');
        }
      }
      validateParams(value, toolName, depth + 1);
    }
  }
}
```

---

#### M-002: Error Messages May Leak Information — **FIXED**

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/mcp-server/server.ts`
**Lines:** 125-155

**Description:**
Error messages from internal operations are passed directly to clients, potentially exposing internal paths, database schema, or stack traces.

```typescript
throw new McpError(
  ErrorCode.InternalError,
  `Failed to list tools: ${error instanceof Error ? error.message : String(error)}`
);
```

**Risk:**
Information disclosure could help attackers understand the system.

**Recommended Fix:**
Log detailed errors internally, return sanitized messages to clients:
```typescript
logger.error('Failed to list tools', error);
throw new McpError(
  ErrorCode.InternalError,
  'An internal error occurred. Please check server logs.'
);
```

---

#### M-003: SQL Table Name Interpolation — **FIXED**

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/recovery/integrity.ts`
**Lines:** 132-175

**Description:**
Table names are interpolated into SQL queries using template strings. While table names come from `sqlite_master` (trusted source), the pattern is risky.

```typescript
const countResult = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get();
```

**Risk:**
If `tableName` were user-controlled, this would enable SQL injection.

**Recommended Fix:**
This is acceptable since table names come from `sqlite_master`, but add a comment explaining this:
```typescript
// SECURITY: tableName comes from sqlite_master, not user input - safe to interpolate
const countResult = db.prepare(`SELECT COUNT(*) as count FROM "${tableName}"`).get();
```

---

#### M-004: execSync Used Without Error Handling — **FIXED**

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/cultivation/deep-analyzer.ts`
**Lines:** 113-120

**Description:**
The `isAvailable()` method uses `execSync` which could expose shell command output in error messages.

```typescript
try {
  execSync('npx claude-flow@alpha --version', {
    stdio: 'pipe',
    timeout: 5000,
  });
  return true;
} catch {
  return false;
}
```

**Risk:**
Low risk since errors are caught, but `shell` option should be explicitly disabled.

**Recommended Fix:**
```typescript
execSync('npx claude-flow@alpha --version', {
  stdio: 'pipe',
  timeout: 5000,
  shell: false,  // Explicit: don't use shell
  windowsHide: true,  // Hide console window on Windows
});
```

---

#### M-005: Handlebars Template Injection — **FIXED**

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/package.json`
**Dependency:** `handlebars: ^4.7.8`

**Description:**
Handlebars is used for template generation. If user content is rendered in templates without proper escaping, it could lead to template injection.

**Risk:**
Template injection if user data flows into template variables without escaping.

**Recommended Fix:**
1. Always use triple-braces `{{{ }}}` only for trusted content
2. Review all template usage to ensure user input is escaped
3. Consider using Handlebars' `noEscape` option carefully

---

### LOW SEVERITY (REMEDIATED ✅)

#### L-001: Logger Should Not Log Full Paths in Production — **FIXED**

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/utils/logger.ts`
**Lines:** 136-149

**Description:**
In JSON mode, the logger includes the full `error.stack` which contains file paths.

```typescript
error: entry.error ? {
  name: entry.error.name,
  message: entry.error.message,
  stack: entry.error.stack,  // Full stack trace with paths
} : undefined,
```

**Risk:**
Path disclosure in log files that may be exposed.

**Recommended Fix:**
Add option to sanitize paths in production:
```typescript
stack: process.env.NODE_ENV === 'production'
  ? sanitizeStackTrace(entry.error.stack)
  : entry.error.stack,
```

---

#### L-002: Default Timeout May Be Too Long — **FIXED**

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/cultivation/deep-analyzer.ts`
**Line:** 105

**Description:**
Default agent timeout is 3 minutes (180000ms), which may be excessive for some operations.

```typescript
this.agentTimeout = options.agentTimeout || 180000; // 3 minutes
```

**Risk:**
Resource exhaustion if many long-running operations are queued.

**Recommended Fix:**
Consider a shorter default timeout or configurable per-operation timeouts.

---

#### L-003: Missing Rate Limiting — **FIXED**

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/mcp-server/server.ts`

**Description:**
The MCP server does not implement rate limiting for tool calls.

**Risk:**
Potential DoS through rapid tool invocations.

**Recommended Fix:**
Implement request rate limiting:
```typescript
private requestCounts = new Map<string, number>();

private checkRateLimit(): void {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  // ... implement sliding window rate limiting
}
```

---

#### L-004: Debug Logging May Expose Sensitive Data — **FIXED**

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/mcp-server/handlers/index.ts`
**Line:** 47

**Description:**
Debug logging includes full parameter objects which may contain sensitive data.

```typescript
logger.debug('Handling tool call', { toolName, params });
```

**Risk:**
Sensitive data in logs if debug logging is enabled in production.

**Recommended Fix:**
Sanitize or redact sensitive fields before logging:
```typescript
logger.debug('Handling tool call', {
  toolName,
  paramKeys: Object.keys(params) // Log only keys, not values
});
```

---

## Positive Security Observations

The following security measures are already well-implemented:

### 1. Path Traversal Protection

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/core/security.ts`

Excellent implementation of path validation:
```typescript
export function validatePath(basePath: string, relativePath: string): string {
  const resolvedBase = resolve(basePath);
  const targetPath = isAbsolute(relativePath)
    ? normalize(relativePath)
    : resolve(resolvedBase, relativePath);
  const normalizedTarget = normalize(targetPath);

  if (!normalizedTarget.startsWith(resolvedBase + '/') && normalizedTarget !== resolvedBase) {
    throw new Error(`Path traversal detected: "${relativePath}" escapes base directory`);
  }
  return normalizedTarget;
}
```

### 2. FTS5 Query Sanitization

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/core/database.ts`
**Lines:** 251-266

Proper sanitization of full-text search queries:
```typescript
private sanitizeFtsQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';

  const sanitized = query
    .replace(/[*"():^\-]/g, ' ')  // Remove special chars
    .replace(/\b(AND|OR|NOT|NEAR)\b/gi, '') // Remove boolean operators
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0 && term.length < 100)
    .slice(0, 20)
    .map(term => `"${term.replace(/"/g, '')}"`)
    .join(' ');
  return sanitized;
}
```

### 3. Prepared Statements

All database operations use parameterized queries:
```typescript
const stmt = this.db.prepare('SELECT * FROM nodes WHERE id = ?');
const row = stmt.get(id);
```

### 4. Input Validation Helpers

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/core/security.ts`

Good utilities for filename and input sanitization:
```typescript
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*\0]/g, '')
    .replace(/^\/+|\/+$/g, '')
    .slice(0, 255);
}

export function sanitizeInput(input: string, maxLength = 1000): string {
  return input
    .replace(/[<>&"'`]/g, '')
    .slice(0, maxLength)
    .trim();
}
```

### 5. Safe JSON Parsing

**File:** `/home/aepod/dev/weave-nn/packages/knowledge-graph-agent/src/core/database.ts`

Defensive JSON parsing with fallback:
```typescript
function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
```

### 6. No Hardcoded Secrets

The codebase correctly avoids hardcoding secrets. The analyst agent even checks for this pattern:
```typescript
// Check for hardcoded secrets patterns
if (/(?:password|secret|api_key|apikey)\s*[:=]\s*['"][^'"]+['"]/i.test(lines[i])) {
  // Report as security issue
}
```

### 7. Dependency Security

**npm audit result:** 0 vulnerabilities found

All dependencies are currently free of known vulnerabilities.

---

## Recommendations

### Immediate Actions (Within 1 Sprint)

1. **Fix H-001:** Add agent type validation and remove `shell: true` in deep-analyzer.ts
2. **Fix H-002:** Apply path validation to backup paths
3. **Fix M-002:** Sanitize error messages before returning to MCP clients

### Short-Term (Within 1 Month)

4. **Fix M-001:** Enhance MCP parameter validation for nested objects and paths
5. **Fix M-004:** Explicitly disable shell in all exec/spawn calls
6. **Add rate limiting** to MCP server

### Long-Term (Ongoing)

7. **Review logging practices** for production deployments
8. **Implement security headers** if HTTP transport is added
9. **Regular dependency audits** via npm audit in CI/CD
10. **Consider security-focused code review** for new features

---

## Compliance Notes

### OWASP Top 10 Coverage

| OWASP Category | Status | Notes |
|----------------|--------|-------|
| A01:2021 Broken Access Control | N/A | Local CLI tool, no web access control |
| A02:2021 Cryptographic Failures | ✅ PASS | Uses SHA-256 for checksums |
| A03:2021 Injection | ✅ PASS | Command injection fixed, input validation added |
| A04:2021 Insecure Design | ✅ PASS | Security utilities well-designed |
| A05:2021 Security Misconfiguration | ✅ PASS | Sensible defaults, rate limiting added |
| A06:2021 Vulnerable Components | ✅ PASS | No vulnerable dependencies |
| A07:2021 Auth Failures | N/A | No authentication in scope |
| A08:2021 Data Integrity Failures | ✅ PASS | Checksum verification in backups |
| A09:2021 Security Logging | ✅ PASS | Debug logging sanitized, paths anonymized in prod |
| A10:2021 SSRF | N/A | No outbound HTTP requests |

---

## Appendix: Files Reviewed

The following source files were reviewed during this audit:

- `/src/core/database.ts` - SQL operations, FTS queries
- `/src/core/security.ts` - Path validation, input sanitization
- `/src/mcp-server/server.ts` - MCP server implementation
- `/src/mcp-server/handlers/index.ts` - Request handling
- `/src/recovery/backup.ts` - Backup operations
- `/src/recovery/integrity.ts` - Database integrity checking
- `/src/cultivation/deep-analyzer.ts` - Command execution
- `/src/cultivation/seed-generator.ts` - File operations
- `/src/integrations/git.ts` - Git operations
- `/src/utils/logger.ts` - Logging implementation
- `/src/agents/*.ts` - Agent implementations
- `package.json` - Dependency review

---

*Report generated by Claude Code Security Review Agent*
