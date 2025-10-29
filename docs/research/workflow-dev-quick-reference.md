# Workflow.dev - Developer Quick Reference

> **Cheat Sheet for Phase 15 Migration**

---

## Installation

```bash
npm install workflow
```

---

## Basic Workflow

```typescript
// workflows/my-workflow.ts
import { sleep } from "workflow";

export async function myWorkflow(input: string) {
  "use workflow";  // Orchestrator directive

  const result1 = await step1(input);
  const result2 = await step2(result1);
  await sleep("1 hour");  // Suspend
  const result3 = await step3(result2);

  return result3;
}

async function step1(input: string) {
  "use step";  // Worker directive
  // Full Node.js runtime access
  // Automatic retry (3x)
  return processInput(input);
}
```

---

## Next.js Configuration

```typescript
// next.config.ts
import { withWorkflow } from 'workflow/next';

const nextConfig = { /* ... */ };

export default withWorkflow(nextConfig);
```

```typescript
// app/api/trigger/route.ts
import { start } from 'workflow/api';
import { myWorkflow } from '@/workflows/my-workflow';

export async function POST(request: Request) {
  const { input } = await request.json();
  await start(myWorkflow, [input]);
  return Response.json({ ok: true });
}
```

---

## Error Handling

```typescript
import { FatalError } from "workflow";

// Retryable error (3 attempts)
async function fetchData() {
  "use step";
  const response = await fetch("https://api.example.com/data");
  if (!response.ok) throw new Error("Network error");  // Retries
  return response.json();
}

// Fatal error (no retry)
async function validateData(data: unknown) {
  "use step";
  if (!data) throw new FatalError("Invalid data");  // No retry
  return data;
}
```

---

## Suspension

```typescript
import { sleep, createWebhook } from "workflow";

// Sleep for duration
export async function delayedWorkflow() {
  "use workflow";
  await step1();
  await sleep("1 day");  // Suspend 24 hours
  await step2();
}

// Webhook suspension
export async function approvalWorkflow(docId: string) {
  "use workflow";
  const webhook = createWebhook();
  await sendApprovalEmail(webhook.url);
  const approval = await webhook;  // Suspend until triggered
  await processApproval(docId, approval);
}
```

---

## Observability

```bash
# Inspect runs (terminal)
npx workflow inspect runs

# Inspect runs (web UI)
npx workflow inspect runs --web

# Remote inspection
npx workflow inspect runs --backend vercel --env production
```

---

## Directory Structure

```
project/
├── .workflow-data/         # Auto-created (gitignore this)
│   ├── runs/
│   ├── steps/
│   ├── hooks/
│   └── metadata/
├── workflows/
│   ├── user-signup/
│   │   ├── index.ts        # Workflow
│   │   └── steps.ts        # Steps
│   └── shared/
│       └── common-steps.ts
└── app/
    └── api/
        └── trigger/
            └── route.ts
```

---

## Directives Reference

### `"use workflow"` - Orchestrator
- ✅ Coordinate steps
- ✅ Deterministic execution
- ✅ Sandboxed environment
- ❌ No direct Node.js runtime
- ❌ No side effects
- ❌ No `Math.random()`, `Date.now()` (auto-fixed)

### `"use step"` - Worker
- ✅ Full Node.js runtime
- ✅ Any npm packages
- ✅ Automatic retry (3x default)
- ✅ Results persisted
- ✅ Can call outside workflows

---

## Common Patterns

### Sequential Steps
```typescript
export async function sequential() {
  "use workflow";
  const a = await step1();
  const b = await step2(a);
  const c = await step3(b);
  return c;
}
```

### Parallel Steps
```typescript
export async function parallel() {
  "use workflow";
  const [a, b, c] = await Promise.all([
    step1(),
    step2(),
    step3(),
  ]);
  return { a, b, c };
}
```

### Conditional Steps
```typescript
export async function conditional(type: string) {
  "use workflow";
  const data = await fetchData();
  if (type === "A") {
    return await processA(data);
  } else {
    return await processB(data);
  }
}
```

### Retry with Backoff
```typescript
export async function retryWithBackoff(url: string) {
  "use workflow";

  let attempt = 0;
  while (attempt < 5) {
    try {
      return await fetchData(url);
    } catch (error) {
      attempt++;
      await sleep(`${attempt * 10}s`);  // 10s, 20s, 30s, ...
    }
  }

  throw new FatalError("Max retries exceeded");
}
```

---

## Sleep Syntax

```typescript
await sleep("5s");      // 5 seconds
await sleep("10m");     // 10 minutes
await sleep("2h");      // 2 hours
await sleep("1d");      // 1 day
await sleep("1w");      // 1 week
await sleep("1M");      // 1 month
await sleep("1y");      // 1 year
```

---

## TypeScript IntelliSense

```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [
      { "name": "workflow" }
    ]
  }
}
```

---

## Middleware Exclusion

```typescript
// middleware.ts
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.well-known/workflow/.*).*)'
  ]
};
```

---

## Testing

```typescript
// __tests__/workflows/my-workflow.test.ts
import { myWorkflow } from '@/workflows/my-workflow';

describe('myWorkflow', () => {
  it('should process input', async () => {
    const result = await myWorkflow('test-input');
    expect(result).toBeDefined();
  });

  it('should resume after suspension', async () => {
    // Test state persistence
    const runId = await start(myWorkflow, ['test']);
    await simulateCrash();
    const result = await getWorkflowResult(runId);
    expect(result).toBeDefined();
  });
});
```

---

## Debugging

```typescript
// Add console.log in steps (not workflows)
async function debugStep(input: string) {
  "use step";
  console.log("Step input:", input);  // ✅ Works (full runtime)
  return processInput(input);
}

export async function debugWorkflow(input: string) {
  "use workflow";
  console.log("Workflow input:", input);  // ❌ Sandbox limited
  return await debugStep(input);
}
```

**Better**: Use observability CLI to inspect runs
```bash
npx workflow inspect runs --web
```

---

## Deployment

### Local Development
```bash
npm run dev
# Embedded World automatically activated
# Data stored in .workflow-data/
```

### Vercel Production
```bash
vercel deploy
# Vercel World automatically activated
# Zero configuration needed
```

### Other Clouds (Custom World)
```bash
# Set environment variables
export WORKFLOW_WORLD=postgres
export WORKFLOW_POSTGRES_URL=postgresql://...

# Deploy normally
npm run build
npm start
```

---

## Gotchas

### ❌ Don't Do This
```typescript
// Closure mutations (non-deterministic)
export async function badWorkflow() {
  "use workflow";
  let counter = 0;
  await step1();
  counter++;  // ❌ Non-deterministic on replay
  await step2();
  return counter;
}

// Direct side effects in workflow
export async function badWorkflow2() {
  "use workflow";
  await fetch("https://api.example.com");  // ❌ Not allowed
}
```

### ✅ Do This Instead
```typescript
// Pass data explicitly
export async function goodWorkflow() {
  "use workflow";
  const result1 = await step1();
  const counter = result1.count + 1;
  const result2 = await step2(counter);
  return result2;
}

// Side effects in steps
async function fetchData() {
  "use step";
  return await fetch("https://api.example.com");  // ✅ Allowed
}

export async function goodWorkflow2() {
  "use workflow";
  const data = await fetchData();  // ✅ Orchestrate via step
  return data;
}
```

---

## Migration from Weaver Workflow Engine

### Before (Weaver)
```typescript
// Custom workflow engine
interface WorkflowDefinition {
  id: string;
  steps: WorkflowStep[];
  retryPolicy: RetryPolicy;
}

class WorkflowEngine {
  async execute(definition: WorkflowDefinition) {
    // Manual orchestration
    for (const step of definition.steps) {
      await this.executeStepWithRetry(step);
    }
  }
}
```

### After (Workflow DevKit)
```typescript
// Automatic orchestration
export async function myWorkflow(input: string) {
  "use workflow";  // Automatic orchestration

  await step1(input);   // Automatic retry
  await step2();        // Automatic retry
  await step3();        // Automatic retry
}

async function step1(input: string) {
  "use step";  // Automatic persistence
  // Implementation
}
```

**Benefits**:
- ❌ No manual retry logic
- ❌ No manual state persistence
- ❌ No queue integration
- ❌ No configuration files
- ✅ Simple directives
- ✅ Automatic infrastructure

---

## Help & Resources

- **Docs**: https://useworkflow.dev/docs
- **Examples**: https://github.com/vercel/workflow-examples
- **GitHub**: https://github.com/vercel/workflow
- **Issues**: https://github.com/vercel/workflow/issues
- **Discussions**: https://github.com/vercel/workflow/discussions

---

**Quick Reference Version**: 1.0
**Last Updated**: 2025-10-28
**Research Agent**: Complete ✅
