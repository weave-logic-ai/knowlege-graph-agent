# Workflow.dev (Workflow DevKit) - Comprehensive Analysis for Phase 15

> **Research Agent Report**
> **Date**: 2025-10-28
> **Mission**: Analyze Workflow DevKit for potential migration from custom workflow engine
> **Status**: ✅ COMPLETE

---

## Executive Summary

**Workflow Development Kit (WDK)** by Vercel is a modern, directive-based framework for building durable, resilient workflows in TypeScript. It uses a unique `"use workflow"` and `"use step"` directive model that compiles reliability directly into async JavaScript without requiring queues, schedulers, or YAML configuration.

**Key Findings**:
- ✅ **Zero Infrastructure**: No queues, schedulers, or databases to manage
- ✅ **Portable**: Runs locally, on Vercel, or any cloud platform
- ✅ **Built-in Observability**: Automatic traces, logs, and metrics
- ✅ **Suspend/Resume**: Workflows can pause for minutes/months and resume
- ✅ **Developer Experience**: Simple directives, familiar async/await syntax
- ⚠️ **Beta Status**: Currently in public beta (v4.0.1-beta.3)
- ⚠️ **Next.js First**: Best support for Next.js, other frameworks in progress

---

## 1. Core Packages & Installation

### Main Package

```bash
npm install workflow
# or
pnpm add workflow
# or
yarn add workflow
```

**Package Name**: `workflow` (NOT `@workflow/world-local` or `@vercel/workflow`)
**Latest Version**: 4.0.1-beta.3
**Repository**: https://github.com/vercel/workflow
**Documentation**: https://useworkflow.dev

### Package Ecosystem

The Workflow DevKit monorepo contains multiple packages:

```
packages/
├── workflow/              # Core package
├── world-vercel/          # Vercel production backend
├── world-postgres/        # PostgreSQL backend (custom deployments)
└── (other internal packages)
```

**Available World Packages**:
- Built-in Embedded World (local development, filesystem-based)
- `@workflow/world-vercel` - Vercel production deployment
- `@workflow/world-postgres` - PostgreSQL-backed workflows

**Note**: The Embedded World is bundled in the main `workflow` package, not distributed separately.

---

## 2. EmbeddedWorld Setup & Configuration

### What is a "World"?

A **World** connects workflows to the infrastructure that powers them. It's an abstraction layer that defines:
1. **Storage** - Persisting workflow runs and metadata
2. **Queue** - Asynchronous step processing
3. **AuthProvider** - API access authentication
4. **Streamer** - Stream management

### Embedded World (Local Development)

The **Embedded World** is a filesystem-based backend automatically activated during local development.

**Key Features**:
- ✅ Stores all workflow data in `.workflow-data/` directory
- ✅ No external dependencies (databases, queues, etc.)
- ✅ Automatically used in local environments
- ✅ Virtual infrastructure for workflows to execute

**Directory Structure**:
```
your-project/
├── .workflow-data/         # Created automatically
│   ├── runs/              # Workflow execution state
│   ├── steps/             # Step results and status
│   ├── hooks/             # Webhook data
│   └── metadata/          # Workflow metadata
├── workflows/
│   └── user-signup.ts
└── app/
    └── api/
        └── signup/
            └── route.ts
```

**No Configuration Required**: The Embedded World activates automatically when running locally.

### Vercel World (Production)

For Vercel deployments, the **Vercel World** automatically activates with zero configuration.

**Features**:
- ✅ Production-ready backend
- ✅ Integrated with Vercel infrastructure
- ✅ Automatic scaling
- ✅ No manual setup required

### Custom World Configuration

For custom deployments (AWS, GCP, self-hosted), set environment variables:

```bash
WORKFLOW_WORLD=postgres
WORKFLOW_POSTGRES_URL=postgresql://...
```

Refer to specific world documentation for configuration details.

---

## 3. Observability Features

### CLI Inspection

**Basic Usage**:
```bash
# Inspect all workflow runs
npx workflow inspect runs

# Interactive web UI
npx workflow inspect runs --web

# Remote inspection (custom world)
npx workflow inspect runs --backend <world-name>

# Vercel production inspection
npx workflow inspect runs \
  --backend=vercel \
  --env=production \
  --project=my-project \
  --team=my-team \
  --auth-token=<token>
```

### What You Can Inspect

✅ **Every run end-to-end**:
- Workflow execution timeline
- Step-by-step progress
- Pause, replay, time-travel through steps
- Traces, logs, and metrics
- Error details and retry attempts
- Suspension and resumption events

✅ **No Extra Services**:
- No Prometheus to configure
- No Grafana to maintain
- No Jaeger for distributed tracing
- Everything built-in

### Observability Comparison

| Feature | Workflow DevKit | Temporal | Inngest |
|---------|----------------|----------|---------|
| Built-in UI | ✅ Yes (CLI + Web) | ✅ Yes | ✅ Yes |
| External Tools Needed | ❌ No | ⚠️ Yes (Prometheus, Grafana) | ❌ No |
| Live Visual Tracing | ✅ Yes | ⚠️ Limited | ✅ Yes (AI-specific) |
| Time-Travel Debugging | ✅ Yes | ✅ Yes | ⚠️ Limited |

---

## 4. .workflow-data Directory Structure

### Overview

The `.workflow-data/` directory is the local filesystem-based database for development.

**Storage Contents**:
- Workflow runs (execution state, status, timestamps)
- Steps (results, retry counts, errors)
- Hooks (webhook URLs, payloads, triggers)
- Metadata (workflow definitions, configuration)

### Example Structure

```
.workflow-data/
├── runs/
│   ├── run_abc123.json        # Workflow execution state
│   │   ├── id: "run_abc123"
│   │   ├── workflowName: "handleUserSignup"
│   │   ├── status: "completed" | "running" | "failed"
│   │   ├── startedAt: "2025-10-28T10:00:00Z"
│   │   ├── completedAt: "2025-10-28T10:05:32Z"
│   │   └── eventLog: [...]
│   └── run_def456.json
├── steps/
│   ├── step_xyz789.json       # Step results
│   │   ├── id: "step_xyz789"
│   │   ├── runId: "run_abc123"
│   │   ├── name: "sendWelcomeEmail"
│   │   ├── status: "completed"
│   │   ├── result: {...}
│   │   ├── retryCount: 1
│   │   └── error: null
│   └── step_uvw012.json
├── hooks/
│   └── webhook_123.json       # Webhook data
└── metadata/
    └── workflows.json         # Registered workflows
```

### Persistence Model

**Event Log Architecture**:
- Steps results are persisted to the event log
- Workflows resume by replaying code using cached results
- If step executed → returns cached result immediately
- If step new → suspends workflow, enqueues step, then resumes

**Benefits**:
- Workflows can pause indefinitely
- State survives deployments and crashes
- Resume exactly where stopped
- No data loss

### .gitignore Recommendation

```gitignore
# Workflow DevKit local data
.workflow-data/
```

---

## 5. Integration Patterns with TypeScript/Node.js

### Core Directives

#### `"use workflow"` - Orchestrator Functions

**Purpose**: Define deterministic coordinator functions

```typescript
export async function processOrder(orderId: string) {
  "use workflow";  // Magic directive

  // Orchestrates steps in sequence
  const order = await fetchOrder(orderId);
  const payment = await chargePayment(order);
  await sendConfirmation(order);

  return { orderId, status: 'completed' };
}
```

**Constraints**:
- ✅ Deterministic execution (must produce same results on replay)
- ✅ Sandboxed environment (limited npm packages)
- ✅ Pure functions (no side effects)
- ❌ No `Math.random()`, `Date.now()` (auto-fixed by sandbox)
- ❌ No direct Node.js runtime access
- ❌ No database calls, API requests (use steps instead)

**Why Sandboxed?**
Workflows are replayed multiple times during resumption. The sandbox ensures determinism by fixing `Math.random()`, `Date`, and other non-deterministic APIs.

#### `"use step"` - Worker Functions

**Purpose**: Perform actual work with full runtime access

```typescript
async function fetchOrder(orderId: string) {
  "use step";  // Magic directive

  // Full Node.js runtime access
  const response = await fetch(`https://api.example.com/orders/${orderId}`);
  return response.json();
}

async function chargePayment(order: Order) {
  "use step";

  // Can use any npm package
  const stripe = require('stripe')(process.env.STRIPE_KEY);
  const charge = await stripe.charges.create({
    amount: order.total,
    currency: 'usd',
    source: order.paymentToken,
  });

  return charge;
}
```

**Features**:
- ✅ Full Node.js runtime
- ✅ Unrestricted npm packages
- ✅ Automatic retry (default: 3 attempts)
- ✅ Results persisted for replay
- ✅ Can be called outside workflows (directive is no-op)

### Next.js Integration (Recommended)

**1. Install Package**:
```bash
npm install workflow
```

**2. Configure `next.config.ts`**:
```typescript
import { withWorkflow } from 'workflow/next';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Your Next.js config
};

export default withWorkflow(nextConfig);
```

**3. TypeScript IntelliSense (Optional)**:
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

**4. Middleware Proxy Exclusion**:
```typescript
// middleware.ts
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.well-known/workflow/.*).*)'
  ]
};
```

**5. Create Workflow**:
```typescript
// workflows/user-signup.ts
import { sleep } from "workflow";

export async function handleUserSignup(email: string) {
  "use workflow";

  const user = await createUser(email);
  await sendWelcomeEmail(user);
  await sleep("5s");  // Suspend for 5 seconds
  await sendOnboardingEmail(user);

  return { userId: user.id, status: "onboarded" };
}

async function createUser(email: string) {
  "use step";
  return { id: crypto.randomUUID(), email };
}

async function sendWelcomeEmail(user: { id: string; email: string }) {
  "use step";
  // Send email via API
  if (Math.random() < 0.3) {
    throw new Error("Retryable error!");  // Will retry 3 times
  }
}
```

**6. API Route Handler**:
```typescript
// app/api/signup/route.ts
import { start } from 'workflow/api';
import { handleUserSignup } from "@/workflows/user-signup";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { email } = await request.json();

  // Start workflow asynchronously
  await start(handleUserSignup, [email]);

  return NextResponse.json({
    message: "User signup workflow started",
  });
}
```

**7. Run & Test**:
```bash
# Start dev server
npm run dev

# Trigger workflow
curl -X POST --json '{"email":"hello@example.com"}' \
  http://localhost:3000/api/signup

# Inspect workflows
npx workflow inspect runs --web
```

### Other Frameworks

**Current Support**:
- ✅ **Next.js** - Full support, best experience
- ✅ **Nitro** - Full support
- 🚧 **SvelteKit** - Coming soon
- 🚧 **Nuxt** - Coming soon
- 🚧 **Hono** - Coming soon
- 🚧 **Bun** - Coming soon
- 🚧 **Framework-agnostic** - In development

### Advanced Patterns

#### Suspension & Resumption

**Sleep for Fixed Duration**:
```typescript
export async function documentReview(userId: string) {
  "use workflow";

  await sendDocument(userId);
  await sleep("1 month");  // Suspend for 30 days
  await sendReminder(userId);
}
```

**Webhook Suspension**:
```typescript
import { createWebhook } from "workflow";

export async function humanApprovalWorkflow(documentId: string) {
  "use workflow";

  const webhook = createWebhook();
  await sendApprovalEmail("Click here to approve", webhook.url);

  // Suspend until webhook triggered
  const approvalData = await webhook;

  await processApproval(documentId, approvalData);
}
```

#### Error Handling

**Retryable Errors**:
```typescript
async function fetchData() {
  "use step";

  const response = await fetch("https://api.example.com/data");

  if (!response.ok) {
    throw new Error("Network error");  // Will retry 3 times
  }

  return response.json();
}
```

**Fatal Errors (No Retry)**:
```typescript
import { FatalError } from "workflow";

async function validateUser(userId: string) {
  "use step";

  const user = await getUser(userId);

  if (!user) {
    throw new FatalError("User not found");  // Won't retry
  }

  return user;
}
```

#### Organization Best Practices

**Recommended Structure**:
```
workflows/
├── user-signup/
│   ├── index.ts           # Workflow function
│   └── steps.ts           # Related steps
├── order-processing/
│   ├── index.ts
│   └── steps.ts
├── document-review/
│   ├── index.ts
│   └── steps.ts
└── shared/
    └── common-steps.ts    # Reusable steps
```

**Example**:
```typescript
// workflows/user-signup/index.ts
import { sendWelcomeEmail, createUser } from "./steps";
import { sendEmail } from "../shared/common-steps";

export async function handleUserSignup(email: string) {
  "use workflow";

  const user = await createUser(email);
  await sendWelcomeEmail(user);

  return user;
}

// workflows/user-signup/steps.ts
export async function createUser(email: string) {
  "use step";
  // Implementation
}

export async function sendWelcomeEmail(user: User) {
  "use step";
  // Implementation
}
```

---

## 6. Migration Strategy from Custom Workflow Engine

### Assessment: Weaver Workflow Engine vs Workflow DevKit

#### Current Weaver Architecture

```typescript
// Current: Custom workflow engine
interface WorkflowDefinition {
  id: string;
  steps: WorkflowStep[];
  triggers: Trigger[];
  retryPolicy: RetryPolicy;
}

class WorkflowEngine {
  async executeWorkflow(definition: WorkflowDefinition) {
    // Manual orchestration
    // Custom state management
    // Hand-rolled retry logic
    // Queue integration
  }
}
```

#### Workflow DevKit Equivalent

```typescript
// New: Workflow DevKit
export async function myWorkflow(input: string) {
  "use workflow";  // Automatic orchestration

  const result1 = await step1(input);    // Auto-retry, persisted
  const result2 = await step2(result1);  // Auto-retry, persisted
  const result3 = await step3(result2);  // Auto-retry, persisted

  return result3;
}

async function step1(input: string) {
  "use step";  // Full runtime access
  // Implementation
}
```

### Migration Phases

#### Phase 1: Analysis & Planning (Week 1)

**Tasks**:
1. ✅ **Research Workflow DevKit** (COMPLETE - this document)
2. Audit existing workflow definitions
3. Map Weaver workflows to Workflow DevKit patterns
4. Identify incompatibilities
5. Create migration checklist

**Deliverables**:
- Workflow inventory spreadsheet
- Compatibility matrix
- Risk assessment
- Timeline estimate

#### Phase 2: Proof of Concept (Week 2)

**Tasks**:
1. Create Next.js test project
2. Migrate 1-2 simple workflows
3. Test observability features
4. Benchmark performance
5. Validate state persistence

**Example POC Workflow**:
```typescript
// POC: Migrate simple vault initialization workflow
export async function initVaultWorkflow(projectPath: string) {
  "use workflow";

  // Step 1: Detect framework
  const framework = await detectFramework(projectPath);

  // Step 2: Generate vault structure
  const vaultStructure = await generateVault(projectPath, framework);

  // Step 3: Write markdown files
  await writeMarkdownFiles(vaultStructure);

  // Step 4: Initialize git
  await initializeGit(projectPath);

  return { success: true, framework, filesCreated: vaultStructure.files.length };
}
```

**Success Criteria**:
- ✅ Workflows execute successfully
- ✅ State persists across restarts
- ✅ Observability tools work
- ✅ Performance acceptable
- ✅ Developer experience improved

#### Phase 3: Incremental Migration (Weeks 3-6)

**Strategy**: Parallel operation (old + new systems)

**Workflow Priority**:
1. **High Priority**: Simple, frequently-used workflows
   - Vault initialization
   - Document generation
   - File processing
2. **Medium Priority**: Complex, less frequent workflows
   - Multi-step orchestrations
   - Long-running processes
3. **Low Priority**: Deprecated workflows
   - Consider retiring instead of migrating

**Migration Pattern**:
```typescript
// Temporary: Dual support during migration
export async function processWorkflow(input: string) {
  if (useNewEngine) {
    return await workflowDevKitVersion(input);
  } else {
    return await legacyWeaverVersion(input);
  }
}
```

#### Phase 4: Testing & Validation (Week 7)

**Testing Checklist**:
- [ ] Unit tests for all steps
- [ ] Integration tests for workflows
- [ ] Performance benchmarks
- [ ] State persistence tests
- [ ] Error handling validation
- [ ] Observability verification
- [ ] Load testing

**Test Example**:
```typescript
// Test workflow execution
describe('initVaultWorkflow', () => {
  it('should create vault structure', async () => {
    const result = await initVaultWorkflow('/test/project');
    expect(result.success).toBe(true);
    expect(result.filesCreated).toBeGreaterThan(0);
  });

  it('should resume after interruption', async () => {
    // Start workflow
    const runId = await start(initVaultWorkflow, ['/test/project']);

    // Simulate crash
    await simulateCrash();

    // Verify workflow resumes
    const result = await getWorkflowResult(runId);
    expect(result.success).toBe(true);
  });
});
```

#### Phase 5: Production Cutover (Week 8)

**Cutover Plan**:
1. Deploy Workflow DevKit version
2. Monitor closely for 48 hours
3. Keep legacy system on standby
4. Gradual traffic migration (10% → 50% → 100%)
5. Decommission legacy system after 2 weeks

#### Phase 6: Optimization & Cleanup (Weeks 9-10)

**Tasks**:
- Remove legacy workflow engine code
- Optimize workflow performance
- Enhance observability dashboards
- Document new patterns
- Train team on Workflow DevKit

### Migration Challenges & Mitigations

| Challenge | Mitigation |
|-----------|-----------|
| **Beta Software Risk** | Run POC thoroughly, keep legacy system as fallback |
| **Next.js Dependency** | Evaluate if Next.js migration is acceptable, or wait for framework-agnostic support |
| **Custom Queue Integration** | Workflow DevKit replaces queues—review if existing queue systems can be retired |
| **State Migration** | Create migration scripts for in-flight workflows |
| **Team Learning Curve** | Training sessions, documentation, pair programming |
| **Observability Tool Change** | Workflow DevKit observability may differ from current tooling |

### Cost-Benefit Analysis

#### Benefits

✅ **Developer Productivity**:
- No YAML configuration
- No queue management
- No scheduler tuning
- Simple directives
- Built-in observability

✅ **Operational Simplicity**:
- Zero infrastructure to manage
- Automatic scaling
- Built-in retries
- State persistence
- Portable across clouds

✅ **Reliability**:
- Battle-tested by Vercel
- Deterministic execution
- Automatic recovery
- No data loss

#### Costs

⚠️ **Migration Effort**:
- 8-10 weeks estimated
- Developer time
- Testing overhead
- Potential bugs during transition

⚠️ **Lock-in Risk**:
- Workflow DevKit-specific directives
- Vercel ecosystem dependency (mitigated by portability)

⚠️ **Beta Risk**:
- Potential bugs
- API changes
- Limited community support (new project)

#### Recommendation

**PROCEED WITH MIGRATION** if:
- ✅ Next.js migration is acceptable
- ✅ Team capacity available for 8-10 week project
- ✅ Current workflow engine maintenance burden is high
- ✅ Willing to adopt beta software with fallback plan

**DEFER MIGRATION** if:
- ❌ Need production-ready stability immediately
- ❌ Require framework-agnostic solution today
- ❌ Current workflow engine meets needs adequately
- ❌ Team capacity constrained

---

## 7. Workflow DevKit vs Alternatives

### Comparison Matrix

| Feature | Workflow DevKit | Temporal | Inngest | Custom (Weaver) |
|---------|-----------------|----------|---------|-----------------|
| **Developer Experience** | ⭐⭐⭐⭐⭐ Simple directives | ⭐⭐⭐ More complex | ⭐⭐⭐⭐ Event-driven | ⭐⭐ Hand-rolled |
| **Infrastructure** | ⭐⭐⭐⭐⭐ Zero config | ⭐⭐ Self-host/cloud | ⭐⭐⭐⭐ Serverless | ⭐⭐ Manual setup |
| **Observability** | ⭐⭐⭐⭐⭐ Built-in | ⭐⭐⭐ External tools | ⭐⭐⭐⭐⭐ Built-in | ⭐⭐ Custom |
| **Portability** | ⭐⭐⭐⭐⭐ Any cloud | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Serverless-first | ⭐⭐⭐ Custom |
| **Maturity** | ⭐⭐ Beta | ⭐⭐⭐⭐⭐ Production | ⭐⭐⭐⭐ Production | ⭐⭐⭐ Internal |
| **Community** | ⭐⭐ New | ⭐⭐⭐⭐⭐ Large | ⭐⭐⭐ Growing | N/A |
| **Cost** | Free (open source) | Paid/self-host | Paid | Development time |

### Use Case Fit

**Workflow DevKit** - Best for:
- ✅ TypeScript/Next.js projects
- ✅ Teams wanting simple DX
- ✅ Vercel deployment targets
- ✅ Greenfield projects
- ✅ Small to medium complexity workflows

**Temporal** - Best for:
- ✅ Enterprise-scale workflows
- ✅ Complex orchestration needs
- ✅ Multi-language requirements
- ✅ Battle-tested reliability critical
- ✅ Large teams with dedicated DevOps

**Inngest** - Best for:
- ✅ Event-driven architectures
- ✅ Background job processing
- ✅ AI workflow orchestration
- ✅ Serverless environments
- ✅ No infrastructure management

**Custom (Weaver)** - Best for:
- ✅ Very specific requirements
- ✅ Full control needed
- ✅ Existing investment significant
- ⚠️ High maintenance burden

---

## 8. Code Examples

### Example 1: Simple Workflow

```typescript
// workflows/welcome-email.ts
import { sleep } from "workflow";

export async function sendWelcomeEmail(userId: string) {
  "use workflow";

  // Step 1: Get user data
  const user = await getUser(userId);

  // Step 2: Send welcome email
  await sendEmail({
    to: user.email,
    subject: "Welcome!",
    body: `Hi ${user.name}, welcome to our platform!`
  });

  // Step 3: Wait 1 day
  await sleep("1 day");

  // Step 4: Send follow-up
  await sendEmail({
    to: user.email,
    subject: "Getting Started Guide",
    body: `Here's how to get started...`
  });

  return { userId, emailsSent: 2 };
}

async function getUser(userId: string) {
  "use step";
  const response = await fetch(`https://api.example.com/users/${userId}`);
  return response.json();
}

async function sendEmail(params: EmailParams) {
  "use step";
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send(params);
}
```

### Example 2: Complex Workflow with Error Handling

```typescript
// workflows/order-processing.ts
import { FatalError } from "workflow";

export async function processOrder(orderId: string) {
  "use workflow";

  try {
    // Step 1: Validate order
    const order = await validateOrder(orderId);

    // Step 2: Check inventory
    const inventory = await checkInventory(order.items);

    if (!inventory.available) {
      // Suspend for 1 hour, then retry
      await sleep("1 hour");
      return await processOrder(orderId);  // Recursive retry
    }

    // Step 3: Charge payment
    const payment = await chargePayment(order);

    // Step 4: Reserve inventory
    await reserveInventory(order.items);

    // Step 5: Ship order
    await shipOrder(orderId);

    // Step 6: Send confirmation
    await sendOrderConfirmation(order.email, orderId);

    return { orderId, status: "completed", paymentId: payment.id };

  } catch (error) {
    // Log error and send notification
    await logError(orderId, error);
    await notifySupport(orderId, error);

    throw error;  // Propagate for workflow failure
  }
}

async function validateOrder(orderId: string) {
  "use step";

  const order = await db.orders.findById(orderId);

  if (!order) {
    throw new FatalError(`Order ${orderId} not found`);
  }

  if (order.total <= 0) {
    throw new FatalError("Invalid order total");
  }

  return order;
}

async function chargePayment(order: Order) {
  "use step";

  const stripe = require('stripe')(process.env.STRIPE_KEY);

  try {
    const charge = await stripe.charges.create({
      amount: order.total,
      currency: 'usd',
      source: order.paymentToken,
      description: `Order ${order.id}`,
    });

    return charge;
  } catch (error) {
    if (error.code === 'card_declined') {
      throw new FatalError('Payment declined');
    }

    throw error;  // Retryable network error
  }
}
```

### Example 3: Webhook-Based Human Approval

```typescript
// workflows/content-moderation.ts
import { createWebhook } from "workflow";

export async function moderateContent(contentId: string) {
  "use workflow";

  // Step 1: Analyze content with AI
  const aiAnalysis = await analyzeContentWithAI(contentId);

  if (aiAnalysis.confidence > 0.95) {
    // High confidence - auto-approve
    await approveContent(contentId);
    return { contentId, status: "auto-approved" };
  }

  // Step 2: Create webhook for human review
  const webhook = createWebhook();

  // Step 3: Send to moderator
  await sendModerationRequest({
    contentId,
    aiAnalysis,
    approvalUrl: `${webhook.url}?action=approve`,
    rejectUrl: `${webhook.url}?action=reject`,
  });

  // Step 4: Suspend until webhook triggered
  const decision = await webhook;

  // Step 5: Apply decision
  if (decision.action === "approve") {
    await approveContent(contentId);
  } else {
    await rejectContent(contentId, decision.reason);
  }

  return { contentId, status: decision.action };
}

async function analyzeContentWithAI(contentId: string) {
  "use step";

  const openai = new OpenAI(process.env.OPENAI_API_KEY);

  const content = await getContent(contentId);

  const analysis = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "Analyze this content for policy violations..."
    }, {
      role: "user",
      content: content.text
    }],
  });

  return {
    safe: analysis.choices[0].message.content.includes("SAFE"),
    confidence: 0.92,
    reasoning: analysis.choices[0].message.content,
  };
}
```

### Example 4: Parallel Step Execution

```typescript
// workflows/data-pipeline.ts
export async function processDataPipeline(datasetId: string) {
  "use workflow";

  // Step 1: Fetch dataset
  const dataset = await fetchDataset(datasetId);

  // Step 2: Process chunks in parallel
  const chunks = splitIntoChunks(dataset, 10);

  const results = await Promise.all(
    chunks.map(chunk => processChunk(chunk))
  );

  // Step 3: Aggregate results
  const aggregated = await aggregateResults(results);

  // Step 4: Store results
  await storeResults(datasetId, aggregated);

  return { datasetId, itemsProcessed: dataset.length };
}

async function processChunk(chunk: DataChunk) {
  "use step";

  // Each chunk processes independently
  // Automatic retry if fails
  return chunk.map(item => transform(item));
}
```

---

## 9. Migration Checklist

### Pre-Migration

- [ ] Review this analysis document thoroughly
- [ ] Audit all existing Weaver workflows
- [ ] Map workflows to Workflow DevKit patterns
- [ ] Identify incompatible workflows
- [ ] Assess Next.js migration feasibility
- [ ] Get team buy-in and training
- [ ] Set up POC environment
- [ ] Create migration timeline

### POC Phase

- [ ] Install Workflow DevKit in test project
- [ ] Configure Next.js with `withWorkflow()`
- [ ] Migrate 1-2 simple workflows
- [ ] Test local execution
- [ ] Test state persistence (simulate crash)
- [ ] Test observability CLI
- [ ] Benchmark performance
- [ ] Document findings

### Migration Phase

- [ ] Create migration branches
- [ ] Set up parallel operation (old + new)
- [ ] Migrate high-priority workflows
- [ ] Write comprehensive tests
- [ ] Set up CI/CD for new workflows
- [ ] Configure production deployment
- [ ] Create rollback plan
- [ ] Train team on new patterns

### Testing Phase

- [ ] Unit tests for all steps
- [ ] Integration tests for workflows
- [ ] Load testing
- [ ] State persistence validation
- [ ] Error handling verification
- [ ] Observability verification
- [ ] Performance benchmarking

### Production Phase

- [ ] Deploy to staging
- [ ] Monitor for 48 hours
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Monitor errors and performance
- [ ] Keep legacy system standby for 2 weeks
- [ ] Decommission legacy system
- [ ] Update documentation

---

## 10. Recommendations

### ✅ RECOMMEND MIGRATION if:

1. **Next.js Adoption**: Team willing to adopt Next.js (or wait for framework-agnostic support)
2. **Capacity Available**: 8-10 weeks of developer time available
3. **Maintenance Burden**: Current workflow engine is high-maintenance
4. **Beta Tolerance**: Comfortable adopting beta software with fallback plan
5. **Simplicity Value**: Team values simple DX over complex orchestration

### ⚠️ DEFER MIGRATION if:

1. **Stability Critical**: Need production-ready stability immediately
2. **Framework Flexibility**: Require framework-agnostic solution today
3. **Adequate Solution**: Current workflow engine meets needs well
4. **Capacity Constrained**: Team has limited bandwidth
5. **Risk Averse**: Cannot tolerate beta software risks

### 🎯 Recommended Approach

**Hybrid Strategy**:
1. **Phase 15a**: POC with Workflow DevKit (2 weeks)
   - Migrate 2-3 simple workflows
   - Validate observability
   - Benchmark performance
   - Document findings

2. **Phase 15b**: Decision Point (1 week)
   - Review POC results
   - Assess beta maturity
   - Check framework-agnostic progress
   - Go/No-Go decision

3. **Phase 15c**: Full Migration OR Wait (6-8 weeks)
   - **If Go**: Incremental migration with parallel operation
   - **If No-Go**: Enhance current workflow engine, revisit in 6 months

---

## 11. Resources

### Official Documentation
- **Website**: https://useworkflow.dev
- **Getting Started**: https://useworkflow.dev/docs/getting-started
- **How It Works**: https://useworkflow.dev/docs/how-it-works/understanding-directives
- **Deploying**: https://useworkflow.dev/docs/deploying

### GitHub
- **Repository**: https://github.com/vercel/workflow
- **Examples**: https://github.com/vercel/workflow-examples
- **Issues**: https://github.com/vercel/workflow/issues
- **Discussions**: https://github.com/vercel/workflow/discussions

### Community
- **GitHub Discussions**: For questions and feature requests
- **Discord**: (Check repository for invite link)
- **Contributors**: 26+ active contributors

### Blog Posts
- **Launch Announcement**: https://vercel.com/blog/introducing-workflow
- **Beta Announcement**: https://vercel.com/changelog/open-source-workflow-dev-kit-is-now-in-public-beta

### Package
- **NPM**: https://www.npmjs.com/package/workflow
- **Version**: 4.0.1-beta.3 (as of 2025-10-28)
- **License**: MIT

---

## 12. Appendix: Technical Deep Dive

### Directive Compilation Model

**How `"use workflow"` Works**:

1. **Compile-Time Transformation**:
   ```typescript
   // Source code
   export async function myWorkflow() {
     "use workflow";
     const result = await myStep();
     return result;
   }

   // Compiled (conceptual)
   export async function myWorkflow() {
     return await WORKFLOW_RUNTIME.execute(async () => {
       const result = await WORKFLOW_RUNTIME.step(myStep);
       return result;
     }, { sandbox: true, deterministic: true });
   }
   ```

2. **Sandbox Isolation**:
   - Workflow code runs in V8 isolate
   - Limited access to Node.js APIs
   - Deterministic builtins (`Math.random()`, `Date`)

3. **Event Log Replay**:
   ```
   Execution 1 (Initial):
   ├─ Start workflow
   ├─ Call step1() → Suspend → Execute → Resume with result1
   ├─ Call step2(result1) → Suspend → Execute → Resume with result2
   └─ Return result2

   Execution 2 (Replay after crash):
   ├─ Start workflow
   ├─ Call step1() → Return cached result1 (from event log)
   ├─ Call step2(result1) → Return cached result2 (from event log)
   └─ Return result2
   ```

### State Persistence Architecture

**Event Log Structure**:
```typescript
interface WorkflowEventLog {
  runId: string;
  workflowName: string;
  events: Event[];
}

interface Event {
  id: string;
  type: 'STEP_START' | 'STEP_COMPLETE' | 'STEP_ERROR' | 'WORKFLOW_SUSPEND' | 'WORKFLOW_RESUME';
  timestamp: string;
  data: unknown;
}

// Example event log
{
  runId: "run_abc123",
  workflowName: "handleUserSignup",
  events: [
    { id: "evt_1", type: "STEP_START", timestamp: "2025-10-28T10:00:00Z", data: { stepName: "createUser" } },
    { id: "evt_2", type: "STEP_COMPLETE", timestamp: "2025-10-28T10:00:05Z", data: { result: { id: "user_123" } } },
    { id: "evt_3", type: "STEP_START", timestamp: "2025-10-28T10:00:05Z", data: { stepName: "sendWelcomeEmail" } },
    { id: "evt_4", type: "STEP_ERROR", timestamp: "2025-10-28T10:00:10Z", data: { error: "Network timeout", retryCount: 1 } },
    { id: "evt_5", type: "STEP_COMPLETE", timestamp: "2025-10-28T10:00:20Z", data: { result: { status: "sent" } } },
  ]
}
```

### Comparison with Existing Weaver Patterns

**Weaver Pattern**:
```typescript
// Current: Manual orchestration
interface WorkflowDefinition {
  id: string;
  steps: WorkflowStep[];
  retryPolicy: RetryPolicy;
}

class WorkflowEngine {
  async execute(definition: WorkflowDefinition) {
    for (const step of definition.steps) {
      let retries = 0;
      while (retries < step.maxRetries) {
        try {
          await this.executeStep(step);
          break;
        } catch (error) {
          retries++;
          if (retries >= step.maxRetries) throw error;
          await this.delay(step.retryDelay);
        }
      }
    }
  }
}
```

**Workflow DevKit Pattern**:
```typescript
// New: Automatic orchestration
export async function myWorkflow() {
  "use workflow";  // Automatic orchestration

  await step1();  // Automatic retry (3x default)
  await step2();  // Automatic retry (3x default)
  await step3();  // Automatic retry (3x default)
}

async function step1() {
  "use step";  // Automatic persistence
  // Implementation
}
```

**Key Differences**:
- ❌ No manual retry loops
- ❌ No manual state persistence
- ❌ No queue integration
- ❌ No scheduler configuration
- ✅ Declarative workflow definition
- ✅ Automatic infrastructure

---

## 13. Conclusion

**Workflow Development Kit** represents a modern, directive-based approach to durable workflows that significantly simplifies orchestration compared to custom implementations or traditional workflow engines.

### Key Takeaways

1. **Zero Infrastructure**: No queues, schedulers, or databases to manage
2. **Simple Directives**: `"use workflow"` and `"use step"` replace complex configuration
3. **Built-in Observability**: Automatic traces, logs, metrics
4. **Portable**: Local, Vercel, or any cloud
5. **Beta Software**: Currently in beta, but backed by Vercel
6. **Next.js First**: Best support for Next.js, other frameworks coming

### Next Steps

1. **Review this analysis** with the team
2. **Conduct POC** (2 weeks) to validate feasibility
3. **Make Go/No-Go decision** based on POC results
4. **If Go**: Execute incremental migration plan
5. **If No-Go**: Enhance current workflow engine, revisit in 6 months

### Research Agent Sign-Off

**Mission**: ✅ COMPLETE
**Analysis**: Comprehensive research conducted
**Recommendation**: Proceed with POC, then decide
**File**: `/home/aepod/dev/weave-nn/docs/research/workflow-dev-analysis.md`
**Date**: 2025-10-28

---

*End of Workflow.dev Analysis Document*
