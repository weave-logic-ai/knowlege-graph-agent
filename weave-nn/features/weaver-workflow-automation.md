---
# Node Metadata
feature_id: "F-020"
feature_name: "Weaver Workflow Automation"
category: "automation"
status: "planned"
priority: "high"
release: "mvp"
complexity: "moderate"
created_date: "2025-10-23"
updated_date: "2025-10-23"

# Scope
scope:
  current_phase: "mvp"
  obsidian_only: false
  web_version_needed: false
  infrastructure: true

# Dependencies
dependencies:
  requires: ["rabbitmq-message-queue"]
  enables: ["cross-project-knowledge-retention", "github-issues-integration"]
  related_features: ["rabbitmq-message-queue", "git-integration", "obsidian-tasks-integration"]
  replaces: ["n8n-workflow-automation"]

# Relationships
relationships:
  related_decisions:
    - "IR-3"
  related_architecture:
    - "obsidian-first-architecture"
    - "ai-integration-layer"
  replaces:
    - "n8n-workflow-automation"

# Visual
visual:
  icon: "workflow"
  cssclasses:
    - type-feature
    - scope-mvp
    - priority-high
    - tech-weaver

# Tags
tags:
  - scope/mvp
  - type/feature
  - status/planned
  - priority/high
  - tech/weaver
  - tech/workflow-dev
  - tech/rabbitmq
  - tech/typescript
  - category/automation
  - category/infrastructure
  - durable-execution
---

# Weaver Workflow Automation (workflow.dev)

**Purpose**: Integrate Weaver (workflow.dev) durable workflow engine to orchestrate complex multi-step processes with automatic retries, state persistence, and time-travel debugging.

**Decision**: [[../archive/DECISIONS#IR-3-Other-Integrations|IR-3: Other Integrations]] - Weaver for workflow orchestration (replaces n8n)

**Architecture**: Weaver + RabbitMQ for durable, event-driven workflows with TypeScript-first developer experience

---

## 🎯 User Story

As a **project manager using Weave-NN**, I want to **automate complex multi-step workflows with guaranteed completion** (like client onboarding, project handoff, weekly reports) so that I can **eliminate repetitive tasks, ensure consistency, and never lose work due to failures**.

**Key Improvement Over n8n**: Workflows are **durable** - they automatically resume from checkpoints after crashes, with exponential backoff retry logic built-in.

---

## 💡 Business Value

### Problem Solved

**Before Weaver**:
- ❌ Bash scripts fail silently - no way to recover from crashes
- ❌ n8n workflows require manual retry logic and UI-based configuration
- ❌ No visibility into workflow execution history or failure points
- ❌ Complex workflows spread across multiple tools (bash, n8n, Python scripts)

**After Weaver**:
- ✅ **Durable Execution** - Workflows automatically resume from last checkpoint after crashes
- ✅ **Automatic Retries** - Exponential backoff retry logic built into every activity
- ✅ **Time-Travel Debugging** - Step through workflow execution history to diagnose failures
- ✅ **Code-First** - All workflows defined as TypeScript functions (Git-friendly, type-safe)
- ✅ **Developer Experience** - Full IDE support, unit testable, hot reload

### ROI Metrics

**Time Savings**:
- Client onboarding: 30 minutes → 30 seconds (98% reduction)
- Weekly reporting: 2 hours → 5 minutes (95% reduction)
- Knowledge extraction: 4 hours → 15 minutes (94% reduction)

**Reliability Improvements**:
- Workflow completion rate: 75% (bash scripts) → 99.9% (Weaver with retries)
- Manual intervention required: 25% → <1%
- Debugging time per failure: 2 hours → 10 minutes (92% reduction)

**Cost Savings**:
- Infrastructure: $110/month (n8n + VM) → $60/month (Weaver local)
- Developer time: 10 hours/month (fixing failures) → 1 hour/month (monitoring)

---

## 🚀 Key Capabilities

### Durable Workflow Execution

**Automatic State Persistence**:
- Every workflow step is checkpointed automatically
- Workflows resume from last successful checkpoint after crashes
- No manual state management code required

```typescript
// This workflow survives server crashes
export async function clientOnboarding({ client }: { client: string }) {
  await createProjectFolder(client);        // Checkpoint 1
  await initializeGitRepo(client);           // Checkpoint 2
  await createInitialTasks(client);          // Checkpoint 3
  // If crash happens here, resumes from checkpoint 3
  await sendNotifications(client);           // Checkpoint 4
  return { success: true };
}
```

### Automatic Retry Logic

**Built-in Exponential Backoff**:
- Transient failures (API timeouts, network errors) retry automatically
- Configurable retry policies per activity
- Dead-letter handling for permanent failures

**Example**: GitHub API call that retries 5 times before failing:
```typescript
export const createGithubRepo = defineActivity({
  name: 'createGithubRepo',
  async execute({ name }: { name: string }) {
    // This will retry 5 times with exponential backoff if GitHub API fails
    const response = await octokit.repos.create({ name });
    return response.data.html_url;
  },
  retries: {
    maxAttempts: 5,
    backoff: 'exponential' // 1s, 2s, 4s, 8s, 16s delays
  }
});
```

### Time-Travel Debugging

**Execution History Inspection**:
```bash
# View workflow execution timeline
weaver history clientOnboarding --id abc123

# Output:
# Timeline:
# [10:15:30] Step 1: createProjectFolder (2.1s) ✓
# [10:15:32] Step 2: copyTemplates (1.5s) ✓
# [10:15:34] Step 3: initGitRepo (3.2s) ✓
# [10:15:37] Step 4: createGithubRepo (4.1s) ✓ (2 retries)
# [10:15:41] Step 5: createTasks (0.8s) ✓

# Replay failed workflow from specific step
weaver replay abc123 --from-step 4
```

### Code-First Workflows

**TypeScript Definitions** (Git-Friendly):
- All workflows defined as `.ts` files (version controlled)
- Full IDE support (autocomplete, type checking, refactoring)
- Unit testable with standard test frameworks
- Hot reload during development

**Comparison to n8n**:
| Aspect | n8n | Weaver |
|--------|-----|--------|
| Workflow Definition | UI-based JSON | TypeScript code |
| Version Control | Manual JSON export | Native Git |
| Type Safety | None | Full TypeScript |
| Testing | Manual UI testing | Unit tests with Jest |
| Debugging | UI logs | Time-travel + breakpoints |

### Event-Driven Triggers

**RabbitMQ Integration**:
```typescript
// Subscribe to vault file creation events
subscribe({
  queue: 'vault.file.created',
  routingKey: 'file.created.*',
  handler: async (event) => {
    if (event.path.startsWith('_projects/')) {
      await triggerWorkflow('clientOnboarding', {
        clientName: extractClientName(event.path)
      });
    }
  }
});
```

**Scheduled Workflows**:
```typescript
// Weekly report (every Friday at 5pm)
schedule({
  cron: '0 17 * * 5',
  workflow: 'weeklyReport',
  timezone: 'America/Los_Angeles'
});
```

---

## 🏗️ Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Obsidian Vault                           │
│  (File System + Git + Tasks)                                │
└────────────┬────────────────────────────────────────────────┘
             │ File changes, Git commits, Task updates
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  RabbitMQ Event Bus                         │
│  Topics: file.*, git.*, task.*, workflow.*                  │
└────────────┬────────────────────────────────────────────────┘
             │ Event triggers
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Weaver Workflow Engine                         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │  Workflow Definitions (TypeScript)             │         │
│  ├────────────────────────────────────────────────┤         │
│  │  • clientOnboarding.ts                         │         │
│  │  • weeklyReport.ts                             │         │
│  │  • knowledgeExtraction.ts                      │         │
│  │  • githubSync.ts                               │         │
│  │  • taskAutomation.ts                           │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │  Durable Execution Engine                      │         │
│  ├────────────────────────────────────────────────┤         │
│  │  • Checkpoint-based state persistence          │         │
│  │  • Automatic retry with exponential backoff    │         │
│  │  • Event sourcing for time-travel debugging    │         │
│  │  • Activity execution with timeout handling    │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │  Storage Layer                                 │         │
│  ├────────────────────────────────────────────────┤         │
│  │  • SQLite (local dev): .weaver/workflows.db    │         │
│  │  • PostgreSQL (production): workflow history   │         │
│  │  • Event log: execution traces                 │         │
│  └────────────────────────────────────────────────┘         │
└────────────┬────────────────────────────────────────────────┘
             │ Activity execution
             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Integration Layer                          │
├─────────────────────────────────────────────────────────────┤
│  • Obsidian API Client (vault operations)                   │
│  • Git CLI (repository operations)                          │
│  • GitHub API (issue sync, repo creation)                   │
│  • Claude API (AI analysis via MCP)                         │
│  • Slack API (notifications)                                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Client Onboarding Example

```
User creates _projects/acme-corp/README.md in Obsidian
    ↓
File watcher detects change → Publish to RabbitMQ
    Event: { type: "file.created", path: "_projects/acme-corp/README.md" }
    ↓
Weaver subscribes to "file.created" events
    Pattern match: "_projects/*/README.md"
    ↓
Triggers durable workflow: clientOnboarding()
    ┌────────────────────────────────────────┐
    │ Step 1: createProjectFolder            │
    │ Status: RUNNING → COMPLETED (2.1s)     │
    │ Checkpoint saved ✓                     │
    └────────────────────────────────────────┘
    ┌────────────────────────────────────────┐
    │ Step 2: copyTemplates                  │
    │ Status: RUNNING → COMPLETED (1.5s)     │
    │ Checkpoint saved ✓                     │
    └────────────────────────────────────────┘
    ┌────────────────────────────────────────┐
    │ Step 3: initGitRepo                    │
    │ Status: RUNNING → COMPLETED (3.2s)     │
    │ Checkpoint saved ✓                     │
    └────────────────────────────────────────┘
    ┌────────────────────────────────────────┐
    │ Step 4: createGithubRepo               │
    │ Attempt 1: FAILED (timeout)            │
    │ Retry after 1s                         │
    │ Attempt 2: FAILED (API error)          │
    │ Retry after 2s                         │
    │ Attempt 3: COMPLETED (4.1s)            │
    │ Checkpoint saved ✓                     │
    └────────────────────────────────────────┘
    ┌────────────────────────────────────────┐
    │ Step 5: createInitialTasks             │
    │ Status: RUNNING → COMPLETED (0.8s)     │
    │ Checkpoint saved ✓                     │
    └────────────────────────────────────────┘
    ┌────────────────────────────────────────┐
    │ Step 6: sendNotifications              │
    │ Status: RUNNING → COMPLETED (0.6s)     │
    │ Checkpoint saved ✓                     │
    └────────────────────────────────────────┘
    ↓
Workflow completed successfully
    Total duration: 12.3 seconds
    Retries: 2 (Step 4)
    Checkpoints: 6
```

---

## 📋 MVP Implementation (Week 2)

### Prerequisites (Day 8)

**1. Install Weaver CLI**
```bash
# Install globally
npm install -g @workflowdev/cli

# Verify installation
weaver --version
```

**2. Initialize in Weave-NN Repository**
```bash
cd /home/aepod/dev/weave-nn
weaver init

# Creates:
# - workflows/ directory
# - workflows/activities/ directory
# - weaver.config.ts
# - .weaver/ directory (local state, gitignored)
```

**3. Configure RabbitMQ Integration**

Edit `weaver.config.ts`:
```typescript
import { defineConfig } from '@workflowdev/cli';

export default defineConfig({
  workflowsDir: './workflows',
  storage: {
    type: 'sqlite',
    path: '.weaver/workflows.db'
  },
  events: {
    provider: 'amqp',
    url: process.env.RABBITMQ_URL || 'amqp://admin:weave-nn-2025@localhost:5672',
    exchange: 'weave-nn.events',
    queues: [
      {
        name: 'weaver.workflows',
        routingKeys: ['file.*', 'git.*', 'task.*', 'workflow.*']
      }
    ]
  }
});
```

### Week 2 Implementation (Days 8-11)

#### Day 8-9: Core Workflows Setup

**Workflow 1: Client Onboarding** (Priority: Critical)

Create `workflows/client-onboarding.ts`:
```typescript
import { defineWorkflow } from '@workflowdev/core';
import { createProjectFolder, copyTemplates, initGitRepo } from './activities/obsidian';
import { createGithubRepo } from './activities/github';
import { createTasks } from './activities/tasks';
import { notifySlack } from './activities/notifications';

interface OnboardingInput {
  clientName: string;
  contactEmail: string;
  projectType: 'web' | 'mobile' | 'consulting';
}

export default defineWorkflow<OnboardingInput>({
  name: 'clientOnboarding',
  description: 'Complete client project setup workflow',

  async execute({ clientName, contactEmail, projectType }) {
    // Step 1: Create project folder structure (durable)
    const projectPath = await createProjectFolder({ clientName, projectType });

    // Step 2: Copy templates with variable substitution (durable)
    await copyTemplates({
      projectPath,
      templates: ['requirements', 'tasks', 'decisions'],
      variables: { clientName, contactEmail }
    });

    // Step 3: Initialize Git repository (durable)
    await initGitRepo({
      path: projectPath,
      initialBranch: 'main',
      commitMessage: `feat: Initialize project for ${clientName}`
    });

    // Step 4: Create GitHub repository (durable with automatic retry)
    const githubUrl = await createGithubRepo({
      name: clientName,
      private: true,
      description: `${projectType} project for ${clientName}`
    });

    // Step 5: Create initial tasks (durable)
    const tasks = await createTasks({
      projectPath,
      tasks: [
        { title: 'Schedule kickoff meeting', dueDate: 'next_monday' },
        { title: 'Review requirements document', dueDate: '+3d' },
        { title: 'Set up development environment', dueDate: '+1w' }
      ]
    });

    // Step 6: Send notifications (durable)
    await notifySlack({
      channel: '#projects',
      message: `🎉 New project started: ${clientName}\nGitHub: ${githubUrl}\nTasks: ${tasks.length}`
    });

    return {
      success: true,
      projectPath,
      githubUrl,
      tasksCreated: tasks.length
    };
  },

  retries: { maxAttempts: 3, backoff: 'exponential' },
  timeout: '5m'
});
```

**Workflow 2: Weekly Report Generator** (Priority: High)

Create `workflows/weekly-report.ts`:
```typescript
import { defineWorkflow } from '@workflowdev/core';
import { queryTasks, getGitCommits, createNote } from './activities/obsidian';
import { generateReport } from './activities/claude';
import { notifySlack } from './activities/notifications';

export default defineWorkflow({
  name: 'weeklyReport',
  description: 'Generate automated weekly status report',

  async execute() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Step 1: Query completed tasks (last 7 days)
    const tasks = await queryTasks({ status: 'completed', since: oneWeekAgo });

    // Group by project
    const tasksByProject = tasks.reduce((acc, task) => {
      const project = task.project || 'General';
      acc[project] = acc[project] || [];
      acc[project].push(task);
      return acc;
    }, {} as Record<string, any[]>);

    // Step 2: Get Git commits
    const commits = await getGitCommits({ since: oneWeekAgo, format: 'short' });

    // Step 3: Generate AI summary with Claude
    const summary = await generateReport({
      prompt: `Create a weekly report from this data:
        Tasks completed: ${JSON.stringify(tasksByProject)}
        Git commits: ${JSON.stringify(commits)}

        Include:
        - Executive summary
        - Progress by project
        - Key achievements
        - Blockers or risks
        - Next week's priorities`,
      model: 'claude-3-5-sonnet-20241022'
    });

    // Step 4: Create report note
    const reportPath = `_planning/weekly-reports/${now.toISOString().split('T')[0]}.md`;
    await createNote({
      path: reportPath,
      content: summary,
      frontmatter: {
        type: 'weekly-report',
        date: now.toISOString(),
        tasks_completed: tasks.length,
        commits: commits.length
      }
    });

    // Step 5: Send to Slack
    await notifySlack({
      channel: '#weekly-updates',
      message: `📊 Weekly report generated: obsidian://open?vault=weave-nn&file=${reportPath}`
    });

    return { reportPath, tasksProcessed: tasks.length };
  },

  schedule: {
    cron: '0 17 * * 5', // Every Friday at 5pm
    timezone: 'America/Los_Angeles'
  }
});
```

**Workflow 3: Knowledge Extraction on Project Close** (Priority: High)

Create `workflows/knowledge-extraction.ts`:
```typescript
import { defineWorkflow } from '@workflowdev/core';
import { readNote, createNote, listNotes } from './activities/obsidian';
import { analyzeProject } from './activities/claude';
import { archiveProject } from './activities/git';

interface ExtractionInput {
  projectId: string;
}

export default defineWorkflow<ExtractionInput>({
  name: 'knowledgeExtraction',
  description: 'Extract reusable knowledge from completed project',

  async execute({ projectId }) {
    const projectPath = `_projects/${projectId}`;

    // Step 1: Read all project files
    const files = await listNotes({ path: projectPath });
    const content = await Promise.all(
      files.map(async (file) => ({
        path: file,
        content: await readNote({ path: file })
      }))
    );

    // Step 2: AI analysis (long-running, automatically retries)
    const insights = await analyzeProject({
      files: content,
      prompt: `Extract reusable knowledge from this project:
        - Common patterns used
        - Reusable solutions
        - Best practices discovered
        - Pitfalls to avoid
        - Technical decisions and rationale`,
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096
    });

    // Step 3: Create knowledge base entry
    const kbPath = `knowledge-base/patterns/${projectId}-learnings.md`;
    await createNote({
      path: kbPath,
      content: insights,
      frontmatter: {
        type: 'pattern',
        project: projectId,
        extracted_date: new Date().toISOString(),
        tags: ['pattern', 'learnings']
      }
    });

    // Step 4: Archive project
    await archiveProject({
      projectPath,
      archivePath: `_archive/${projectId}`,
      createTag: true,
      tagName: `archive/${projectId}`
    });

    return { kbPath, archived: true };
  },

  timeout: '15m', // Long timeout for AI processing
  retries: {
    maxAttempts: 5,
    backoff: 'exponential',
    maxDelay: 120000 // 2 minutes max delay
  }
});
```

#### Day 10: GitHub Integration Workflows

**Workflow 4: GitHub Issue → Obsidian Task Sync** (Priority: Medium)

Create `workflows/github-sync.ts`:
```typescript
import { defineWorkflow } from '@workflowdev/core';
import { fetchGithubIssue, createGithubComment } from './activities/github';
import { createTask } from './activities/obsidian';

interface GithubSyncInput {
  issueId: number;
  repo: string;
}

export default defineWorkflow<GithubSyncInput>({
  name: 'githubSync',
  description: 'Sync GitHub issue to Obsidian task',

  async execute({ issueId, repo }) {
    // Step 1: Fetch issue from GitHub
    const issue = await fetchGithubIssue({ repo, issueId });

    // Step 2: Create task in vault
    const task = await createTask({
      projectPath: `_projects/${repo}`,
      title: issue.title,
      dueDate: issue.milestone?.due_on,
      tags: issue.labels.map((l: any) => l.name),
      metadata: { github_issue: issueId }
    });

    // Step 3: Comment on GitHub with tracking link
    await createGithubComment({
      repo,
      issueId,
      body: `Tracked in Obsidian: obsidian://open?vault=weave-nn&file=${task.path}`
    });

    return { taskCreated: true, taskPath: task.path };
  }
});
```

#### Day 11: Testing and Refinement

**Testing Workflows Locally**:
```bash
# Start Weaver in development mode
weaver dev

# Test client onboarding workflow
weaver test clientOnboarding --input '{
  "clientName": "Test Corp",
  "contactEmail": "test@test.com",
  "projectType": "web"
}'

# Test weekly report workflow
weaver test weeklyReport

# Test knowledge extraction workflow
weaver test knowledgeExtraction --input '{
  "projectId": "test-project"
}'

# View execution history
weaver history

# Debug failed workflow
weaver debug <workflow-id>
```

---

## 💰 Cost Analysis

### Infrastructure Costs

**Local Development (MVP)**:
- Weaver CLI: Free (open source)
- Local state storage (SQLite): Free
- RabbitMQ: Already deployed ($0 incremental)
- **Total**: **$0/month**

**Production (Docker Compose)**:
- Weaver engine: Free (open source)
- PostgreSQL: Free (self-hosted) or $25/month (managed)
- RabbitMQ: Already deployed ($0 incremental)
- Compute: $50/month (shared VM)
- **Total**: **$50-75/month**

### Operational Costs

**Workflow Execution**:
- Local execution: Free (unlimited)
- Cloud features (workflow.dev): Optional
  - First 1000 executions/month: Free
  - Additional: $0.001 per execution
  - **Estimate**: <1000/month = $0

**AI API Costs** (unchanged):
- Claude API: ~$50/month
- Embeddings: ~$10/month

### Cost Comparison vs n8n

| Factor | n8n | Weaver | Savings |
|--------|-----|--------|---------|
| Infrastructure | $50/month (Docker VM) | $50/month (shared VM) | $0 |
| Workflow Tool | Free (self-hosted) | Free (open source) | $0 |
| State Storage | Included in VM | SQLite (free) or PostgreSQL ($25) | $0-25 |
| AI API | $60/month | $60/month | $0 |
| **Development Time** | 10 hrs/month debugging | 1 hr/month monitoring | **$450/month** |
| **Total Infrastructure** | **$110/month** | **$60/month** | **$50/month (45%)** |
| **Total with Dev Time** | **$610/month** | **$110/month** | **$500/month (82%)** |

**Key Savings**:
- 45% infrastructure cost reduction (no Docker overhead for n8n)
- 90% debugging time reduction (time-travel debugging vs UI logs)
- 99.9% reliability (automatic retries) vs 75% (manual retry logic)

---

## 🎯 Success Criteria (MVP)

### Must Have (Week 2, Days 8-11)
- ✅ Weaver CLI installed and configured
- ✅ RabbitMQ event subscription working
- ✅ 3 core workflows operational:
  - Client onboarding (with GitHub repo creation)
  - Weekly report generator (with Claude AI)
  - Knowledge extraction on project close
- ✅ GitHub integration (issue → task sync)
- ✅ Slack notifications working
- ✅ Time-travel debugging tested (replay failed workflow)
- ✅ Used for 1 real client project

### Nice to Have (v1.1)
- ⚡ Docker Compose deployment (production)
- ⚡ PostgreSQL state storage (replace SQLite)
- ⚡ Prometheus metrics integration
- ⚡ Distributed tracing (Jaeger)
- ⚡ Custom activities library (10+ reusable activities)

### Deferred to v2.0+
- 🔮 Visual workflow builder (hybrid approach with n8n)
- 🔮 Workflow marketplace (share workflows)
- 🔮 Advanced AI workflows (multi-agent orchestration)
- 🔮 Real-time collaboration (workflow editing)

---

## 🚧 Key Challenges & Solutions

### Challenge 1: Migration from Bash Hooks

**Problem**: Existing bash scripts are brittle and lack error handling
**Solution**: Convert bash scripts to durable Weaver workflows

**Migration Path**:
1. Identify critical bash hooks (pre-commit, post-commit, file watcher)
2. Convert to Weaver activities (see migration guide)
3. Add retry logic and error handling
4. Test in parallel with bash scripts
5. Switch over once validated

**Example**:
```bash
# Before (bash hook - brittle)
#!/bin/bash
# post-commit hook
git push origin main || exit 1
curl -X POST https://api.github.com/repos/weavelogic/weave-nn/issues \
  -d '{"title": "New commit"}' || exit 1
```

```typescript
// After (Weaver workflow - durable)
export const postCommitWorkflow = defineWorkflow({
  name: 'postCommit',
  async execute({ commitSha }) {
    // Automatically retries on failure
    await gitPush({ branch: 'main', remote: 'origin' });
    await createGithubIssue({
      repo: 'weavelogic/weave-nn',
      title: `New commit: ${commitSha}`
    });
  },
  retries: { maxAttempts: 5, backoff: 'exponential' }
});
```

### Challenge 2: Learning Curve (Code-First vs Visual)

**Problem**: Team familiar with n8n's visual builder
**Solution**: Gradual migration with training and examples

**Mitigation**:
1. Provide 10+ example workflows (copy-paste ready)
2. Document common patterns (see technical docs)
3. Pair programming sessions for first 3 workflows
4. Keep n8n running in parallel for 2 weeks
5. Switch fully after team comfortable

**Training Plan** (Week 2):
- Day 8: Weaver intro workshop (2 hours)
- Day 9: Build first workflow together (hands-on)
- Day 10: Independent workflow creation (with support)
- Day 11: Code review and best practices

### Challenge 3: Debugging Complex Workflows

**Problem**: Multi-step workflows hard to debug when failures occur
**Solution**: Time-travel debugging + structured logging

**Debugging Workflow**:
```bash
# 1. View execution history
weaver history clientOnboarding --id abc123

# 2. Identify failed step
# Output shows: Step 4 (createGithubRepo) failed after 2 retries

# 3. View detailed logs
weaver logs abc123 --activity createGithubRepo

# 4. Replay from failed step with modified input
weaver replay abc123 --from-step 4 --input '{
  "name": "Acme Corp Fixed",
  "private": true
}'

# 5. Verify fix
weaver history abc123
# Output: Step 4 (createGithubRepo) completed successfully
```

### Challenge 4: State Persistence Overhead

**Problem**: Checkpoint overhead slows down fast workflows
**Solution**: Tune checkpoint granularity per workflow

**Optimization**:
```typescript
// Default: Checkpoint after every activity
export default defineWorkflow({
  name: 'fastWorkflow',
  async execute() {
    await fastActivity1(); // Checkpoint
    await fastActivity2(); // Checkpoint
    await fastActivity3(); // Checkpoint
  }
});

// Optimized: Group fast activities into single checkpoint
export default defineWorkflow({
  name: 'fastWorkflowOptimized',
  async execute() {
    // Single checkpoint for entire group
    const results = await executeInTransaction([
      fastActivity1(),
      fastActivity2(),
      fastActivity3()
    ]);
  }
});
```

---

## 🔗 Related Features

### Requires
- [[rabbitmq-message-queue|RabbitMQ Message Queue]] - Event-driven workflow triggers
- [[git-integration|Git Integration]] - Automated commits and repository operations
- [[obsidian-tasks-integration|Obsidian Tasks]] - Task management in workflows

### Enables
- [[cross-project-knowledge-retention|Cross-Project Knowledge Retention]] - Automated extraction with durable AI workflows
- [[github-issues-integration|GitHub Issues Integration]] - Bidirectional sync with retry guarantees
- [[daily-log-automation|Daily Log Automation]] - Scheduled workflows with guaranteed execution

### Integrates With
- [[basic-ai-integration-mcp|MCP Integration]] - Claude API calls in workflows
- [[obsidian-first-architecture|Obsidian-First Architecture]] - Vault operations via REST API

### Replaces
- [[n8n-workflow-automation|n8n Workflow Automation]] - Replaced by code-first, durable approach
- Bash hook scripts - Replaced by reliable TypeScript workflows

---

## 🔗 Related Documentation

### Architecture
- [[../architecture/obsidian-first-architecture|Obsidian-First Architecture]] - Integration with vault
- [[../architecture/ai-integration-layer|AI Integration Layer]] - Claude API workflows
- [[../architecture/workflow-automation-system|Workflow Automation System]] - Weaver-based architecture

### Technical
- [[../technical/weaver-proxy|Weaver Technical Primitive]] - Comprehensive technical documentation
- [[../technical/rabbitmq|RabbitMQ]] - Event bus integration
- [[../technical/obsidian-api-client|Obsidian API Client]] - Vault operations

### Migration
- [[../docs/weaver-migration-guide|Weaver Migration Guide]] - Step-by-step migration from bash and n8n

### Decisions
- [[../archive/DECISIONS#IR-3-Other-Integrations|IR-3: Other Integrations]] - Weaver decision
- [[../decisions/technical/workflow-automation-platform|Workflow Automation Platform]] - Why Weaver over n8n

### External Resources
- [Weaver Documentation](https://docs.workflow.dev/)
- [Weaver Getting Started](https://docs.workflow.dev/getting-started)
- [Weaver GitHub](https://github.com/workflowdev/weaver)
- [Weaver Examples](https://github.com/workflowdev/examples)

---

## 📊 Metrics and Monitoring

### Key Metrics

**Workflow Reliability**:
- Completion rate: Target 99.9% (vs 75% with bash scripts)
- Retry rate: <5% of workflows require retry
- Manual intervention rate: <1% of workflows

**Performance**:
- Client onboarding: <30 seconds (p95)
- Weekly report generation: <5 minutes (p95)
- Knowledge extraction: <15 minutes (p95)

**Developer Experience**:
- Time to create new workflow: <30 minutes (vs 2 hours with n8n)
- Debugging time per failure: <10 minutes (vs 2 hours with bash)
- Test coverage: >80% of workflow code

### Monitoring Dashboard

**Prometheus Metrics** (exposed on :9090):
```
# Workflow duration
weaver_workflow_duration_seconds{workflow="clientOnboarding"} 12.3

# Workflow failures
weaver_workflow_failures_total{workflow="clientOnboarding"} 0

# Workflow retries
weaver_workflow_retries_total{workflow="clientOnboarding",activity="createGithubRepo"} 24

# Active workflows
weaver_workflows_active 3
```

**Grafana Dashboard**:
- Workflow execution rate (workflows/hour)
- Success vs failure rate
- Retry rate by activity
- Average duration by workflow
- Top 10 slowest workflows

---

## 📝 Example: Complete Workflow Setup

### Step-by-Step Setup

**1. Install and Configure**:
```bash
# Install Weaver
npm install -g @workflowdev/cli

# Initialize project
cd /home/aepod/dev/weave-nn
weaver init

# Configure environment
cp .env.example .env
# Edit .env: Set RABBITMQ_URL, OBSIDIAN_API_KEY, ANTHROPIC_API_KEY
```

**2. Create Activities** (reusable building blocks):

`workflows/activities/obsidian.ts`:
```typescript
import { defineActivity } from '@workflowdev/core';
import { ObsidianAPIClient } from '../../src/clients/ObsidianAPIClient';

const client = new ObsidianAPIClient({
  apiUrl: process.env.OBSIDIAN_API_URL!,
  apiKey: process.env.OBSIDIAN_API_KEY!
});

export const createProjectFolder = defineActivity({
  name: 'createProjectFolder',
  async execute({ clientName, projectType }) {
    const path = `_projects/${clientName}`;
    await client.createNote({
      path: `${path}/README.md`,
      content: `# ${clientName}\n\nProject Type: ${projectType}`,
      frontmatter: { type: 'project', status: 'active' }
    });
    return path;
  }
});
```

**3. Create Workflow**:

`workflows/client-onboarding.ts`:
```typescript
import { defineWorkflow } from '@workflowdev/core';
import { createProjectFolder } from './activities/obsidian';

export default defineWorkflow({
  name: 'clientOnboarding',
  async execute({ clientName, projectType }) {
    const path = await createProjectFolder({ clientName, projectType });
    return { success: true, path };
  }
});
```

**4. Test Locally**:
```bash
# Start dev server
weaver dev

# Test workflow
weaver test clientOnboarding --input '{
  "clientName": "Acme Corp",
  "projectType": "web"
}'

# View execution history
weaver history clientOnboarding
```

**5. Deploy to Production**:
```bash
# Build for production
weaver build

# Deploy with Docker Compose
docker-compose up -d weaver

# Verify deployment
weaver status
```

---

**Status**: Planned for MVP (Week 2, Days 8-11)
**Complexity**: Moderate (16 hours setup + workflows + testing)
**Priority**: High (enables reliable automation and cross-project learning)
**Next Steps**: Install Weaver CLI, create first 3 workflows, migrate from bash hooks
