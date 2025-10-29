---
title: Hono - Lightweight Web Framework
type: documentation
status: in-progress
tags:
  - type/documentation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4C4"
  color: '#8E8E93'
  cssclasses:
    - document
updated: '2025-10-29T04:55:06.342Z'
keywords:
  - overview
  - why hono
  - installation
  - mvp usage
  - basic webhook server
  - middleware
  - type-safe routes
  - integration with weaver
  - claude code hook configuration
  - advanced features
---
# Hono - Lightweight Web Framework

**Category**: Technical / Web Framework
**Status**: MVP Core Dependency
**Package**: `hono` + `@hono/node-server`
**Docs**: https://hono.dev

---

## Overview

Hono is the lightweight web framework powering Weaver's webhook endpoints. Provides HTTP server for Claude Code hooks and health checks.

## Why Hono

**Ultra-Fast**:
- 3-4x faster than Express
- Minimal overhead (<1ms routing)
- Built for edge runtimes

**TypeScript-First**:
- Full type inference
- Excellent DX
- Type-safe routing

**Lightweight**:
- ~12KB minified
- Zero dependencies
- Simple API

**Replaces FastAPI**:
- No Python web server needed
- Same TypeScript codebase as rest of Weaver

## Installation

```bash
npm install hono @hono/node-server
```

## MVP Usage

### Basic Webhook Server

```typescript
// src/webhooks/server.ts
import { Hono } from 'hono';
import { serve } from '@hono/node-server';

export function createWebhookServer() {
  const app = new Hono();

  // Health check
  app.get('/health', (c) => {
    return c.json({ status: 'ok', service: 'weaver' });
  });

  // Task completion webhook
  app.post('/webhook/task', async (c) => {
    const { taskId, userId } = await c.req.json();

    // Trigger durable workflow
    const workflowId = await startWorkflow('task-completion', {
      taskId,
      userId
    });

    return c.json({
      success: true,
      workflowId
    });
  });

  // Phase update webhook
  app.post('/webhook/phase', async (c) => {
    const { phase, status } = await c.req.json();

    await startWorkflow('phase-update', { phase, status });

    return c.json({ success: true });
  });

  return app;
}
```

### Middleware

```typescript
// src/webhooks/middleware.ts
import type { Context, Next } from 'hono';

// Logging middleware
export async function logger(c: Context, next: Next) {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${duration}ms`);
}

// Auth middleware
export async function auth(c: Context, next: Next) {
  const apiKey = c.req.header('X-API-Key');

  if (!apiKey || apiKey !== process.env.WEAVER_API_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
}

// Apply middleware
app.use('*', logger);
app.use('/webhook/*', auth);
```

### Type-Safe Routes

```typescript
// src/webhooks/routes/task.ts
import { Hono } from 'hono';

const taskRouter = new Hono();

interface TaskCompletionRequest {
  taskId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

taskRouter.post('/task', async (c) => {
  const body = await c.req.json<TaskCompletionRequest>();

  // TypeScript knows body.taskId exists
  const workflowId = await startWorkflow('task-completion', {
    taskId: body.taskId,
    userId: body.userId,
    metadata: body.metadata
  });

  return c.json({ workflowId });
});

export { taskRouter };
```

### Integration with Weaver

```typescript
// src/index.ts
import { createWebhookServer } from './webhooks/server';
import { serve } from '@hono/node-server';

async function main() {
  // ... MCP server setup ...
  // ... File watcher setup ...

  // Start webhook server
  const app = createWebhookServer();

  serve({
    fetch: app.fetch,
    port: 3000
  });

  console.log('Webhook server listening on :3000');
}
```

## Claude Code Hook Configuration

Tell Claude Code to call Weaver's webhooks:

```json
// ~/.config/claude/hooks.json
{
  "post-task": {
    "command": "curl",
    "args": [
      "-X", "POST",
      "http://localhost:3000/webhook/task",
      "-H", "Content-Type: application/json",
      "-H", "X-API-Key: your-api-key",
      "-d", "{\"taskId\": \"$TASK_ID\", \"userId\": \"$USER_ID\"}"
    ]
  }
}
```

## Advanced Features

### Context Variables

```typescript
app.use('*', async (c, next) => {
  // Add custom context
  c.set('startTime', Date.now());
  await next();

  const duration = Date.now() - c.get('startTime');
  c.header('X-Response-Time', `${duration}ms`);
});

app.get('/test', (c) => {
  const startTime = c.get('startTime'); // Type-safe!
  return c.json({ startTime });
});
```

### Error Handling

```typescript
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);

  return c.json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  }, 500);
});

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});
```

### CORS

```typescript
import { cors } from 'hono/cors';

app.use('*', cors({
  origin: ['http://localhost:3000'],
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type', 'X-API-Key'],
  credentials: true
}));
```

### Rate Limiting

```typescript
import { rateLimiter } from 'hono-rate-limiter';

app.use(
  '/webhook/*',
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per window
    message: 'Too many requests'
  })
);
```

## Comparison with FastAPI

| Feature | FastAPI | Hono |
|---------|---------|------|
| **Language** | Python | TypeScript |
| **Performance** | ~1000 req/sec | ~4000 req/sec |
| **Routing** | Decorator-based | Chainable |
| **Types** | Pydantic | TypeScript |
| **Startup Time** | ~1s (uvicorn) | <100ms |
| **Memory** | ~50MB | ~10MB |
| **Documentation** | Auto OpenAPI | Manual |

## Performance

- **Latency**: <1ms routing overhead
- **Throughput**: 4000+ req/sec on single core
- **Memory**: ~10MB idle
- **Startup**: <100ms

## Testing

```typescript
// tests/webhooks/server.test.ts
import { describe, it, expect } from 'vitest';
import { createWebhookServer } from '../../src/webhooks/server';

describe('Webhook Server', () => {
  it('returns health status', async () => {
    const app = createWebhookServer();

    const res = await app.request('/health');
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.status).toBe('ok');
  });

  it('handles task completion', async () => {
    const app = createWebhookServer();

    const res = await app.request('/webhook/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key'
      },
      body: JSON.stringify({ taskId: 'task-123' })
    });

    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.workflowId).toBeDefined();
  });
});
```

## Resources

- **Official Docs**: https://hono.dev
- **GitHub**: https://github.com/honojs/hono
- **Examples**: https://hono.dev/examples

## Related

- [[technical/weaver|Weaver Unified Service]]
- [[technical/workflow-dev|Workflow.dev (Webhook Triggers)]]
- [[.archive/technical/python-stack/fastapi|FastAPI (archived)]]
