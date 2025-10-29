# Security Quick Reference

Fast reference for common security operations in Weaver.

## Import Everything

```typescript
import {
  // Validation
  validateFilePath,
  validate,
  validateSafe,

  // Rate Limiting
  getRateLimiter,

  // Audit Logging
  getAuditLogger,

  // API Keys
  getApiKeyManager,

  // Sanitization
  escapeHtml,
  sanitizeFilePath,
  sanitizeUrl,

  // Middleware
  applySecurity,
  validateBody,
  rateLimiter,
  apiKeyAuth,
} from '@weave-nn/weaver/security';
```

## Common Operations

### Validate User Input

```typescript
// File path
const safePath = validateFilePath(userInput, '/base/path');

// With schema
const result = filePathSchema.safeParse(userInput);
if (!result.success) {
  throw new Error('Invalid input');
}
```

### Check Rate Limit

```typescript
const limiter = getRateLimiter();
const result = await limiter.checkLimit('user-id', 'api');

if (!result.allowed) {
  throw new Error(`Rate limited. Retry after ${result.retryAfter}ms`);
}
```

### Log Security Event

```typescript
const logger = await getAuditLogger();

await logger.logAuth({
  action: 'login',
  result: 'success',
  user: 'john@example.com',
  ip: '192.168.1.100',
});
```

### Validate API Key

```typescript
const keyManager = getApiKeyManager();
const validation = await keyManager.validateKey(apiKey);

if (!validation.valid) {
  throw new Error(validation.reason);
}
```

### Sanitize HTML

```typescript
// Escape dangerous characters
const safe = escapeHtml('<script>alert(1)</script>');
// Result: '&lt;script&gt;alert(1)&lt;/script&gt;'
```

### Apply Security to Route

```typescript
app.post('/api/workflow',
  rateLimiter('workflow'),
  validateBody(workflowSchema),
  async (c) => {
    const body = c.get('validatedBody');
    // Handle request
  }
);
```

## Cheat Sheet

### Rate Limits (Default)

| Endpoint | Max | Window |
|----------|-----|--------|
| api | 100 | 1 min |
| workflow | 10 | 1 min |
| mcp | 60 | 1 min |
| auth | 5 | 15 min |
| file | 50 | 1 min |
| heavy | 5 | 1 min |

### Validation Schemas

```typescript
filePathSchema        // File paths
apiKeySchema          // Generic API keys
anthropicApiKeySchema // Anthropic keys
serverConfigSchema    // Server config
appConfigSchema       // App config
workflowNameSchema    // Workflow names
emailSchema           // Email addresses
urlSchema             // URLs
```

### Sanitization Functions

```typescript
escapeHtml(input)           // XSS prevention
stripHtmlTags(input)        // Remove HTML
escapeSqlString(input)      // SQL injection
escapeShellArg(input)       // Command injection
sanitizeFilePath(input)     // Path traversal
sanitizeUrl(input)          // Open redirect
sanitizeJson(input)         // Prototype pollution
sanitizeEmail(input)        // Email validation
```

### Middleware

```typescript
applySecurity()           // All security features
securityHeaders()         // Security headers
rateLimiter(endpoint)     // Rate limiting
apiKeyAuth()              // API key auth
validateBody(schema)      // Body validation
validateQuery(schema)     // Query validation
validateParams(schema)    // Params validation
auditLog()                // Request logging
secureCors(config)        // CORS
```

### Audit Event Methods

```typescript
logger.logAuth()              // Authentication
logger.logConfigChange()      // Config changes
logger.logFileAccess()        // File access
logger.logApiKeyUsage()       // API key usage
logger.logRateLimitViolation() // Rate limits
logger.logValidationFailure() // Validation
logger.logSecurityEvent()     // Generic security
```

## Environment Variables

```bash
# Enable features
ENABLE_RATE_LIMITING=true
ENABLE_AUDIT_LOGGING=true
ENABLE_INPUT_VALIDATION=true

# Rate limits
RATE_LIMIT_API_MAX_REQUESTS=100
RATE_LIMIT_API_WINDOW_MS=60000

# Audit logs
AUDIT_LOG_DIR=./logs/audit
AUDIT_LOG_ENABLE_HASHING=true

# API keys
API_KEY_ROTATION_DAYS=90
API_KEY_WARNING_DAYS=14

# Security headers
SECURITY_ENABLE_HSTS=true
SECURITY_ENABLE_CSP=true

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Common Patterns

### Secure API Endpoint

```typescript
app.post('/api/resource',
  // Rate limiting
  rateLimiter('api'),

  // Validate input
  validateBody(z.object({
    name: z.string(),
    data: z.string(),
  })),

  async (c) => {
    // Input is validated and type-safe
    const { name, data } = c.get('validatedBody');

    // Log the operation
    const logger = await getAuditLogger();
    await logger.log({
      level: 'info',
      category: 'access',
      action: 'create_resource',
      result: 'success',
      user: c.get('user'),
      metadata: { name },
    });

    return c.json({ success: true });
  }
);
```

### Protected Admin Route

```typescript
app.use('/api/admin/*',
  apiKeyAuth(),
  rateLimiter('admin'),
);

app.get('/api/admin/stats', async (c) => {
  const keyId = c.get('apiKeyId');
  // Only authenticated requests reach here
});
```

### Safe File Operation

```typescript
async function readUserFile(filePath: string) {
  // Validate path
  const safePath = validateFilePath(filePath, '/safe/base');

  // Check rate limit
  const limiter = getRateLimiter();
  const allowed = await limiter.checkLimit('user-id', 'file');
  if (!allowed.allowed) {
    throw new Error('Rate limited');
  }

  // Log access
  const logger = await getAuditLogger();
  await logger.logFileAccess({
    action: 'read',
    path: safePath,
    result: 'success',
    user: 'current-user',
  });

  // Perform operation
  return await readFile(safePath);
}
```

## Testing

```bash
# Run all security tests
bun test tests/security

# Run specific test file
bun test tests/security/validation.test.ts

# Watch mode
bun test tests/security --watch
```

## Troubleshooting

### Rate Limit Issues

```typescript
// Check current stats
const stats = limiter.getStats('user-id', 'api');
console.log('Remaining:', stats?.remaining);
console.log('Queue:', stats?.queueLength);

// Reset if needed
limiter.reset('user-id', 'api');
```

### Audit Log Issues

```bash
# View recent logs
tail -f logs/audit/audit-*.log

# Parse JSON logs
tail -f logs/audit/audit-*.log | jq .

# Filter by level
cat logs/audit/audit-*.log | jq 'select(.level == "critical")'
```

### API Key Issues

```typescript
// List all keys
const keys = keyManager.listKeys();

// Check expiring keys
const expiring = keyManager.getKeysNeedingRotation();

// Revoke compromised key
await keyManager.revokeKey('key-id');
```

## Security Checklist

Before deploying:

- [ ] All endpoints have rate limiting
- [ ] All inputs are validated
- [ ] Audit logging is enabled
- [ ] API keys are configured
- [ ] CORS is properly set
- [ ] HTTPS is enabled
- [ ] Security headers are active
- [ ] Tests pass
- [ ] Logs are monitored

## Resources

- **Full Guide**: `/docs/security/SECURITY-GUIDE.md`
- **Implementation**: `/docs/security/IMPLEMENTATION-COMPLETE.md`
- **Source**: `/src/security/`
- **Tests**: `/tests/security/`
