# Security Hardening Guide

This guide covers the comprehensive security features implemented in Weaver for production deployment.

## Overview

Weaver implements multiple layers of security:

- **Input Validation**: All user inputs validated with Zod schemas
- **Rate Limiting**: Token bucket algorithm prevents abuse
- **Audit Logging**: Tamper-proof security event logging
- **API Key Management**: Automatic rotation and expiration
- **Input Sanitization**: Prevent XSS, SQL injection, command injection
- **Security Middleware**: Hono/Express middleware for all endpoints
- **Automated Scanning**: GitHub Actions for dependency and code security

## Input Validation

### File Path Validation

```typescript
import { validateFilePath, filePathSchema } from '@weave-nn/weaver/security';

// Validate and sanitize file paths
const safePath = validateFilePath(userInput, '/safe/base/path');

// Use schema directly
const result = filePathSchema.safeParse(userInput);
if (!result.success) {
  console.error('Invalid file path:', result.error);
}
```

**Protection against:**
- Directory traversal (`../../../etc/passwd`)
- Access to system directories (`/etc`, `/sys`, `/proc`)
- Invalid characters and command injection

### API Key Validation

```typescript
import { apiKeySchema, anthropicApiKeySchema } from '@weave-nn/weaver/security';

// Generic API key
apiKeySchema.parse(apiKey);

// Anthropic-specific
anthropicApiKeySchema.parse(apiKey); // Must start with "sk-ant-"
```

### Configuration Validation

```typescript
import { appConfigSchema } from '@weave-nn/weaver/security';

const config = {
  server: {
    port: 3000,
    host: 'localhost',
  },
  security: {
    enableAuditLogging: true,
    enableRateLimiting: true,
  },
  // ...
};

const validated = appConfigSchema.parse(config);
```

## Rate Limiting

### Basic Usage

```typescript
import { getRateLimiter } from '@weave-nn/weaver/security';

const limiter = getRateLimiter();

// Check if request is allowed
const result = await limiter.checkLimit('user-id', 'api');

if (!result.allowed) {
  console.log(`Rate limited. Retry after ${result.retryAfter}ms`);
}
```

### Custom Rate Limits

```typescript
limiter.registerEndpoint({
  endpoint: 'custom-endpoint',
  maxRequests: 50,
  windowMs: 60000, // 1 minute
  queueEnabled: true,
  maxQueueSize: 10,
});
```

### With Middleware

```typescript
import { Hono } from 'hono';
import { rateLimiter } from '@weave-nn/weaver/security';

const app = new Hono();

app.use('/api/*', rateLimiter('api'));

app.post('/api/workflow', async (c) => {
  // This endpoint is rate limited
});
```

### Default Rate Limits

| Endpoint | Max Requests | Window | Queue Enabled |
|----------|--------------|--------|---------------|
| api | 100 | 1 minute | Yes |
| workflow | 10 | 1 minute | Yes |
| mcp | 60 | 1 minute | No |
| auth | 5 | 15 minutes | No |
| file | 50 | 1 minute | Yes |
| heavy | 5 | 1 minute | Yes |

## Audit Logging

### Initialize Logger

```typescript
import { getAuditLogger } from '@weave-nn/weaver/security';

const logger = await getAuditLogger({
  logDir: './logs/audit',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 100,
  enableConsole: true,
  enableHashing: true, // Tamper detection
});
```

### Log Events

```typescript
// Authentication events
await logger.logAuth({
  action: 'login',
  result: 'success',
  user: 'john@example.com',
  ip: '192.168.1.100',
});

// Configuration changes
await logger.logConfigChange({
  action: 'update_rate_limit',
  user: 'admin',
  metadata: {
    setting: 'maxRequests',
    oldValue: 100,
    newValue: 200,
  },
});

// File access
await logger.logFileAccess({
  action: 'read',
  path: '/etc/config.json',
  result: 'success',
  user: 'service-account',
});

// API key usage
await logger.logApiKeyUsage({
  action: 'key_validation',
  keyId: 'key_abc123',
  result: 'success',
});

// Rate limit violations
await logger.logRateLimitViolation({
  endpoint: '/api/workflow',
  identifier: 'user123',
  ip: '192.168.1.100',
});

// Validation failures
await logger.logValidationFailure({
  action: 'input_validation',
  error: 'Invalid file path',
  user: 'john@example.com',
});

// Security events
await logger.logSecurityEvent({
  action: 'brute_force_detected',
  level: 'critical',
  result: 'blocked',
  ip: '192.168.1.100',
  metadata: {
    attempts: 10,
    timeWindow: '5m',
  },
});
```

### Audit Log Format

```json
{
  "timestamp": 1704067200000,
  "level": "warning",
  "category": "auth",
  "action": "login",
  "result": "failure",
  "user": "john@example.com",
  "ip": "192.168.1.100",
  "metadata": {
    "reason": "invalid_password"
  },
  "hash": "a1b2c3d4..." // For tamper detection
}
```

### Tamper Detection

```typescript
// Verify integrity of audit logs
const events = readAuditLogFile();
const integrity = logger.verifyIntegrity(events);

if (!integrity.valid) {
  console.error('Audit log tampering detected at indices:', integrity.invalidIndices);
}
```

## API Key Management

### Generate Keys

```typescript
import { getApiKeyManager } from '@weave-nn/weaver/security';

const keyManager = getApiKeyManager();

const result = await keyManager.generateKey({
  name: 'Production API Key',
  expiresInDays: 90,
  metadata: {
    environment: 'production',
    service: 'api-gateway',
  },
});

console.log('Key ID:', result.id);
console.log('Key (save this!):', result.key); // Only shown once
console.log('Prefix:', result.prefix);
console.log('Expires:', new Date(result.expiresAt!));
```

### Validate Keys

```typescript
const validation = await keyManager.validateKey(apiKey);

if (!validation.valid) {
  console.error('Invalid key:', validation.reason);
  return;
}

console.log('Valid key ID:', validation.keyId);
```

### Rotate Keys

```typescript
// Start rotation
const newKey = await keyManager.rotateKey('old-key-id');
console.log('New key:', newKey.key); // Deploy this

// After transitioning clients to new key
await keyManager.completeRotation('old-key-id');
```

### Check Keys Needing Rotation

```typescript
const keysToRotate = keyManager.getKeysNeedingRotation();

for (const key of keysToRotate) {
  console.log(`Key "${key.name}" needs rotation`);
  console.log(`Expires: ${new Date(key.expiresAt!)}`);
}
```

## Input Sanitization

### HTML/XSS Prevention

```typescript
import { escapeHtml, stripHtmlTags } from '@weave-nn/weaver/security';

// Escape HTML
const safe = escapeHtml(userInput);
// '<script>alert(1)</script>' → '&lt;script&gt;alert(1)&lt;/script&gt;'

// Strip HTML tags
const text = stripHtmlTags(userInput);
// '<p>Hello <b>World</b></p>' → 'Hello World'
```

### SQL Injection Prevention

```typescript
import { validateSqlIdentifier, buildWhereClause } from '@weave-nn/weaver/security';

// Validate table/column names
if (!validateSqlIdentifier(tableName)) {
  throw new Error('Invalid table name');
}

// Build safe WHERE clauses
const { clause, params } = buildWhereClause({
  email: 'user@example.com',
  status: 'active',
});
// clause: "WHERE email = ? AND status = ?"
// params: ['user@example.com', 'active']

// Use with prepared statements
db.query(`SELECT * FROM users ${clause}`, params);
```

### Command Injection Prevention

```typescript
import { escapeShellArg, safeExecSync } from '@weave-nn/weaver/security';

// Escape shell arguments
const safeArg = escapeShellArg(userInput);

// Safe command execution with allowlist
const allowedCommands = ['git', 'ls', 'cat'];
const output = safeExecSync('git', ['status'], allowedCommands);
```

### Path Traversal Prevention

```typescript
import { sanitizeFilePath, sanitizeFilename } from '@weave-nn/weaver/security';

// Sanitize file paths
const safePath = sanitizeFilePath(userInput, '/safe/base/path');

// Sanitize filenames
const safeFilename = sanitizeFilename('document.pdf'); // OK
// sanitizeFilename('../../../etc/passwd') → throws error
```

### URL Sanitization

```typescript
import { sanitizeUrl, validateRedirectUrl } from '@weave-nn/weaver/security';

// Sanitize URLs (only allow HTTP/HTTPS)
const safeUrl = sanitizeUrl(userInput, ['example.com', 'trusted.com']);

// Validate redirect URLs
if (!validateRedirectUrl(url, allowedDomains)) {
  throw new Error('Open redirect detected');
}
```

## Security Middleware

### Apply All Security Features

```typescript
import { Hono } from 'hono';
import {
  applySecurity,
  validateBody,
  rateLimiter,
  apiKeyAuth,
} from '@weave-nn/weaver/security';
import { z } from 'zod';

const app = new Hono();

// Apply security headers and audit logging
app.use('*', applySecurity());

// Validate request body
const workflowSchema = z.object({
  name: z.string(),
  steps: z.array(z.string()),
});

app.post('/api/workflow',
  rateLimiter('workflow'),
  validateBody(workflowSchema),
  async (c) => {
    const body = c.get('validatedBody');
    // body is type-safe and validated
  }
);

// API key authentication
app.use('/api/admin/*', apiKeyAuth());

app.get('/api/admin/stats', async (c) => {
  const keyId = c.get('apiKeyId');
  // Authenticated request
});
```

### Individual Middleware

```typescript
import {
  securityHeaders,
  secureCors,
  auditLog,
} from '@weave-nn/weaver/security';

// Security headers
app.use('*', securityHeaders({
  enableHSTS: true,
  enableCSP: true,
  cspDirectives: "default-src 'self';",
}));

// CORS with security
app.use('*', secureCors({
  allowedOrigins: ['https://example.com'],
  allowedMethods: ['GET', 'POST'],
  credentials: true,
}));

// Audit logging
app.use('*', auditLog({
  includeBody: true,
  includeHeaders: false,
}));
```

## GitHub Actions Security

### Dependency Scanning

Automatically runs weekly and on every push:

```yaml
# .github/workflows/security-audit.yml
- name: Run npm audit
  run: bun audit

- name: Check for high/critical vulnerabilities
  run: |
    if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
      echo "❌ Found vulnerabilities!"
      exit 1
    fi
```

### CodeQL Analysis

Static code analysis for security vulnerabilities:

```yaml
# .github/workflows/codeql.yml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    queries: security-and-quality
```

### Secret Scanning

Detect leaked secrets in commits:

```yaml
- name: Run Gitleaks
  uses: gitleaks/gitleaks-action@v2
```

## Environment Configuration

Add to `.env`:

```bash
# Security Configuration
ENABLE_RATE_LIMITING=true
ENABLE_AUDIT_LOGGING=true
ENABLE_INPUT_VALIDATION=true
ENABLE_API_KEY_AUTH=false

# Rate Limiting
RATE_LIMIT_API_MAX_REQUESTS=100
RATE_LIMIT_API_WINDOW_MS=60000

# Audit Logging
AUDIT_LOG_DIR=./logs/audit
AUDIT_LOG_ENABLE_HASHING=true

# API Key Management
API_KEY_ROTATION_DAYS=90
API_KEY_WARNING_DAYS=14

# Security Headers
SECURITY_ENABLE_HSTS=true
SECURITY_ENABLE_CSP=true

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
CORS_ALLOW_CREDENTIALS=true

# Session
SESSION_TIMEOUT_MS=3600000
MAX_LOGIN_ATTEMPTS=5
```

## Best Practices

1. **Always validate input** before processing
2. **Use prepared statements** for SQL queries
3. **Never execute user input** as shell commands
4. **Rotate API keys** regularly (every 90 days)
5. **Monitor audit logs** for suspicious activity
6. **Keep dependencies updated** (run security audits weekly)
7. **Use HTTPS** in production
8. **Enable all security middleware** on public endpoints
9. **Set proper CORS policies** (never use `*` in production)
10. **Review security alerts** from GitHub Actions

## Security Checklist

- [ ] Input validation enabled on all endpoints
- [ ] Rate limiting configured for all public APIs
- [ ] Audit logging active and monitored
- [ ] API keys rotated regularly
- [ ] Security headers enabled
- [ ] CORS properly configured
- [ ] HTTPS enforced in production
- [ ] Secrets not hardcoded or committed
- [ ] Dependencies scanned for vulnerabilities
- [ ] CodeQL analysis passing
- [ ] No secrets in Git history
- [ ] File uploads validated and sandboxed
- [ ] Authentication implemented
- [ ] Authorization checked on sensitive operations

## Monitoring

### Security Health Check

```typescript
import { getSecurityHealth } from '@weave-nn/weaver/security';

const health = await getSecurityHealth();
console.log('Rate limiting:', health.rateLimiting);
console.log('Audit logging:', health.auditLogging);
console.log('API keys:', health.apiKeyManagement);
```

### Audit Log Analysis

```bash
# View recent security events
tail -f logs/audit/audit-*.log | jq 'select(.level == "critical" or .level == "warning")'

# Count failed authentication attempts
cat logs/audit/audit-*.log | jq 'select(.category == "auth" and .result == "failure")' | wc -l

# Find rate limit violations
cat logs/audit/audit-*.log | jq 'select(.category == "rate_limit")'
```

## Incident Response

If security issue detected:

1. **Check audit logs** for details
2. **Revoke compromised API keys** immediately
3. **Review access patterns** for anomalies
4. **Update rate limits** if under attack
5. **Rotate all API keys** if breach suspected
6. **Review and patch** vulnerable code
7. **Document incident** and lessons learned

## Support

For security issues:
- DO NOT open public GitHub issues
- Email: security@weave-nn.local
- Review audit logs first
- Include relevant log entries (redact sensitive data)
