---
type: technical-primitive
category: service
status: planned
first_used_phase: "PHASE-6"
mvp_required: false
future_only: false
maturity: mature
complexity: moderate

# Integration tracking
used_in_services:
  - workflow-engine
  - event-consumer
  - task-automation
deployment: local-development

# Relationships
alternatives_considered:
  - "[[n8n-workflow-automation]]"
  - "[[temporal-io]]"
  - "[[apache-airflow]]"
replaces: "[[n8n-workflow-automation]]"
replaced_by: null

# Documentation
decision: "[[../decisions/technical/workflow-automation-platform]]"
architecture: "[[../architecture/workflow-automation-system]]"

tags:
  - technical
  - tool
  - platform
  - workflow
  - automation
  - planned
  - durable-execution
---

# Weaver (workflow.dev) - Durable Workflow Engine

**Category**: Durable Workflow Automation Platform
**Status**: Planned (Replaces n8n for MVP)
**First Used**: Phase 6 (MVP Week 2)
**Official Site**: https://workflow.dev/
**Documentation**: https://docs.workflow.dev/

---

## Overview

Weaver (workflow.dev) is a TypeScript/JavaScript-first durable workflow orchestration platform built on battle-tested infrastructure. It provides automatic retries, state persistence, time-travel debugging, and event-driven workflows with a focus on developer experience and reliability.

Unlike n8n's visual workflow builder approach, Weaver is **code-first** with workflows defined as TypeScript functions. This makes it ideal for Weave-NN's local-first, Git-tracked architecture where all configuration should be version-controlled and easily debuggable.

**Why Weaver Over n8n**:
- ✅ **Code-First**: Workflows are TypeScript functions (Git-friendly, type-safe)
- ✅ **Durable Execution**: Automatic state persistence and recovery
- ✅ **Local Development**: Run workflows locally without Docker overhead
- ✅ **Automatic Retries**: Built-in exponential backoff and error handling
- ✅ **Time-Travel Debugging**: Step through workflow execution history
- ✅ **Event-Driven**: Native integration with message queues (RabbitMQ)
- ✅ **Cost**: Free for local development, pay only for cloud features
- ✅ **Developer Experience**: TypeScript-native, excellent error messages

---

## Why We Use It

Weaver extends Weave-NN's event-driven architecture by providing **durable, reliable execution** for complex workflows that must complete even if interrupted. Where bash hooks handle simple automation, Weaver ensures mission-critical workflows (project setup, knowledge extraction, reporting) never fail silently.

**Primary Purpose**: Durable workflow orchestration for multi-step processes with state persistence and automatic recovery.

**Specific Use Cases**:
- **Client Onboarding Workflows** - Multi-step project setup that must complete fully or rollback cleanly
- **Knowledge Extraction** - Long-running AI analysis workflows that can resume after interruption
- **Weekly Reporting** - Scheduled workflows with reliable execution guarantees
- **Git Operations** - Complex multi-repo operations with transaction-like semantics
- **Task Automation** - Replace brittle bash scripts with durable, testable workflows

**Why Not n8n**:
| Factor | n8n | Weaver |
|--------|-----|--------|
| Configuration | UI-based (not Git-friendly) | Code-first (TypeScript) |
| Local Dev | Requires Docker | Native Node.js |
| State Management | Manual retry logic | Automatic durability |
| Debugging | UI logs only | Time-travel debugging |
| Type Safety | None | Full TypeScript |
| Cost | $0 self-hosted | $0 local dev |
| Learning Curve | Low (visual) | Medium (code) |

**Decision**: For Weave-NN's developer-centric workflow and Git-based architecture, code-first durability wins over visual simplicity.

---

## Key Capabilities

### Durable Workflows

**Automatic State Persistence**:
- Every workflow step is checkpointed automatically
- Workflows resume from last checkpoint after crashes
- No manual state management required

```typescript
// This workflow is durable by default
export async function clientOnboarding({ client }: { client: string }) {
  // Step 1: Create vault structure (checkpointed)
  await createProjectFolder(client);

  // Step 2: Initialize Git repo (checkpointed)
  await initializeGitRepo(client);

  // Step 3: Create initial tasks (checkpointed)
  await createInitialTasks(client);

  // If server crashes here, workflow resumes from step 3 on restart
  return { success: true, client };
}
```

**Automatic Retries**:
- Exponential backoff on transient failures
- Configurable retry policies per step
- Dead-letter handling for permanent failures

```typescript
export async function extractKnowledge({ projectId }: { projectId: string }) {
  // This step will retry up to 5 times with exponential backoff
  const analysis = await retry(
    () => analyzeProjectWithClaude(projectId),
    { maxAttempts: 5, backoff: 'exponential' }
  );

  return analysis;
}
```

### Event-Driven Architecture

**RabbitMQ Integration**:
```typescript
// Subscribe to vault events
subscribe({
  queue: 'vault.file.created',
  handler: async (event) => {
    // Trigger durable workflow
    await triggerWorkflow('processNewFile', {
      filePath: event.filePath,
      content: event.content
    });
  }
});
```

**Scheduled Workflows**:
```typescript
// Weekly report generation (runs every Friday at 5pm)
schedule({
  cron: '0 17 * * 5',
  workflow: 'generateWeeklyReport',
  timezone: 'America/Los_Angeles'
});
```

### Time-Travel Debugging

**Replay Workflow Execution**:
```bash
# View workflow execution history
weaver history clientOnboarding --id abc123

# Replay failed workflow from specific checkpoint
weaver replay abc123 --from-step 3

# Debug workflow with breakpoints
weaver debug abc123 --break-at createInitialTasks
```

**Observability**:
- Full execution traces with timing
- Step-by-step state inspection
- Distributed tracing integration (OpenTelemetry)
- Metrics export (Prometheus compatible)

### Local-First Development

**No Docker Required**:
```bash
# Install Weaver CLI
npm install -g @workflowdev/cli

# Initialize project
weaver init

# Run workflows locally
weaver dev

# Test workflow
weaver test clientOnboarding --input '{"client": "Acme Corp"}'
```

**Hot Reload**:
- Workflows reload on code changes
- No rebuild/restart required
- Fast iteration cycle

---

## Integration Points

**Used By**:
- [[../architecture/workflow-automation-system]] - Primary workflow orchestration
- [[../architecture/event-consumer]] - Offloads complex workflows from event handlers

**Integrates With**:
- [[rabbitmq]] - Event-driven workflow triggers via AMQP
- [[obsidian-api-client]] - Vault operations in workflows
- [[gitpython]] - Git operations in workflows
- [[fastapi]] - Webhook triggers for workflows
- [[mcp-protocol]] - AI agent integration in workflows

**Enables Features**:
- [[../features/github-issues-integration]] - Durable GitHub sync workflows
- [[../features/daily-log-automation]] - Scheduled daily log creation
- [[../features/cross-project-knowledge-retention]] - Long-running knowledge extraction

**Replaces**:
- [[n8n-workflow-automation]] - Replaces visual workflow builder with code-first approach
- Bash hook scripts - Replaces brittle shell scripts with durable TypeScript workflows

---

## Architecture

### workflow.dev Infrastructure

Weaver is built on proven technologies:
- **Temporal** (under the hood): Battle-tested workflow engine from Uber
- **Event Store**: Durable event log for workflow history
- **State Persistence**: SQLite (local) or PostgreSQL (production)
- **Message Queue**: AMQP (RabbitMQ), Kafka, or Redis Streams
- **Observability**: OpenTelemetry, Prometheus, Jaeger

**Key Insight**: Weaver abstracts away Temporal's complexity while keeping its reliability guarantees.

### Weave-NN Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Obsidian Vault                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ File       │  │ Git Repo   │  │ Tasks      │           │
│  │ System     │  │            │  │            │           │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘           │
└────────┼───────────────┼───────────────┼───────────────────┘
         │               │               │
         ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                    RabbitMQ Event Bus                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ file.*      │  │ git.*       │  │ task.*      │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
└─────────┼────────────────┼────────────────┼────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           ▼
         ┌──────────────────────────────────┐
         │     Weaver Workflow Engine       │
         ├──────────────────────────────────┤
         │                                  │
         │  ┌────────────────────────────┐  │
         │  │  Workflow Definitions      │  │
         │  │  (TypeScript)              │  │
         │  ├────────────────────────────┤  │
         │  │ • clientOnboarding.ts      │  │
         │  │ • weeklyReport.ts          │  │
         │  │ • knowledgeExtraction.ts   │  │
         │  │ • githubSync.ts            │  │
         │  │ • taskAutomation.ts        │  │
         │  └────────────────────────────┘  │
         │                                  │
         │  ┌────────────────────────────┐  │
         │  │  Durable Execution Engine  │  │
         │  ├────────────────────────────┤  │
         │  │ • State Persistence        │  │
         │  │ • Automatic Retries        │  │
         │  │ • Checkpoint Recovery      │  │
         │  │ • Event Sourcing           │  │
         │  └────────────────────────────┘  │
         │                                  │
         └────────┬─────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │  Integration Layer │
         ├────────────────────┤
         │ • Obsidian API     │
         │ • Git CLI          │
         │ • GitHub API       │
         │ • Claude MCP       │
         │ • Slack API        │
         └────────────────────┘
```

### Message Flow Example

**Scenario**: User creates new project in vault

```
1. User creates: _projects/acme-corp/README.md in Obsidian
   ↓
2. File watcher detects change → Publish to RabbitMQ
   Event: { type: "file.created", path: "_projects/acme-corp/README.md" }
   ↓
3. Weaver subscribes to "file.created" events
   Matches pattern: "_projects/*/README.md"
   ↓
4. Triggers durable workflow: clientOnboarding()
   Step 1: Create project folder structure ✓ (checkpointed)
   Step 2: Copy templates ✓ (checkpointed)
   Step 3: Initialize Git repo ✓ (checkpointed)
   Step 4: Create GitHub repo ✓ (checkpointed)
   Step 5: Create initial tasks ✓ (checkpointed)
   Step 6: Send notifications ✓ (checkpointed)
   ↓
5. Workflow completes successfully
   State: COMPLETED
   Duration: 12.3 seconds
   Retries: 0
```

**If Failure Occurs**:
```
Step 4: Create GitHub repo ❌ (API timeout)
   ↓
Automatic Retry (attempt 1) after 1s ❌
Automatic Retry (attempt 2) after 2s ❌
Automatic Retry (attempt 3) after 4s ✓ (success)
   ↓
Continue from Step 4 (state preserved)
Step 5: Create initial tasks ✓
Step 6: Send notifications ✓
   ↓
Workflow completes successfully
```

---

## Configuration

### Installation (Local Development)

```bash
# Install Weaver CLI globally
npm install -g @workflowdev/cli

# Initialize in Weave-NN repository
cd /home/aepod/dev/weave-nn
weaver init

# This creates:
# - workflows/ directory (workflow definitions)
# - weaver.config.ts (configuration)
# - .weaver/ directory (local state)
```

### Project Structure

```
weave-nn/
├── workflows/                     # Workflow definitions
│   ├── client-onboarding.ts       # Client setup workflow
│   ├── weekly-report.ts           # Scheduled reporting
│   ├── knowledge-extraction.ts    # AI analysis workflow
│   ├── github-sync.ts             # GitHub integration
│   └── task-automation.ts         # Task management
├── workflows/activities/          # Reusable workflow activities
│   ├── obsidian.ts                # Vault operations
│   ├── git.ts                     # Git operations
│   ├── github.ts                  # GitHub API calls
│   ├── claude.ts                  # AI operations
│   └── notifications.ts           # Slack/email
├── workflows/lib/                 # Shared utilities
│   ├── retry.ts                   # Retry logic
│   ├── validation.ts              # Input validation
│   └── templates.ts               # Template rendering
├── weaver.config.ts               # Weaver configuration
└── .weaver/                       # Local state (gitignored)
    ├── workflows.db               # Workflow execution state
    └── traces/                    # Execution traces
```

### Configuration File

**weaver.config.ts**:
```typescript
import { defineConfig } from '@workflowdev/cli';

export default defineConfig({
  // Workflow directory
  workflowsDir: './workflows',

  // State persistence
  storage: {
    type: 'sqlite',
    path: '.weaver/workflows.db'
  },

  // Event subscription (RabbitMQ)
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
  },

  // Retry configuration
  retries: {
    maxAttempts: 5,
    backoff: 'exponential',
    maxDelay: 60000, // 1 minute max
    initialDelay: 1000 // 1 second initial
  },

  // Scheduled workflows
  schedules: [
    {
      name: 'weeklyReport',
      cron: '0 17 * * 5', // Every Friday at 5pm
      workflow: 'weekly-report',
      timezone: 'America/Los_Angeles'
    },
    {
      name: 'dailyLog',
      cron: '0 9 * * *', // Every day at 9am
      workflow: 'daily-log-automation'
    }
  ],

  // Observability
  observability: {
    traces: {
      enabled: true,
      exporter: 'console' // or 'jaeger', 'zipkin'
    },
    metrics: {
      enabled: true,
      port: 9090 // Prometheus metrics
    }
  },

  // Environment-specific overrides
  environments: {
    development: {
      storage: { type: 'sqlite', path: '.weaver/dev.db' }
    },
    production: {
      storage: {
        type: 'postgres',
        url: process.env.DATABASE_URL
      }
    }
  }
});
```

### Environment Variables

**.env**:
```bash
# Weaver Configuration
WEAVER_ENV=development
WEAVER_LOG_LEVEL=info

# RabbitMQ Connection
RABBITMQ_URL=amqp://admin:weave-nn-2025@localhost:5672
RABBITMQ_EXCHANGE=weave-nn.events

# Obsidian API
OBSIDIAN_API_URL=http://localhost:27124
OBSIDIAN_API_KEY=your-api-key-here

# GitHub Integration
GITHUB_TOKEN=ghp_your_github_token
GITHUB_REPO=weavelogic/weave-nn

# Claude API
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Slack Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# PostgreSQL (production only)
DATABASE_URL=postgresql://user:pass@localhost:5432/weave_nn
```

---

## Workflow Examples

### Example 1: Client Onboarding Workflow

**workflows/client-onboarding.ts**:
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

interface OnboardingOutput {
  success: boolean;
  projectPath: string;
  githubUrl: string;
  tasksCreated: number;
}

export default defineWorkflow<OnboardingInput, OnboardingOutput>({
  name: 'clientOnboarding',
  description: 'Complete client project setup workflow',

  async execute({ clientName, contactEmail, projectType }) {
    // Step 1: Create project folder structure (durable)
    const projectPath = await createProjectFolder({
      clientName,
      projectType
    });

    // Step 2: Copy templates (durable)
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

    // Step 4: Create GitHub repository (durable with retry)
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
      message: `New project started: ${clientName}\nGitHub: ${githubUrl}\nTasks: ${tasks.length}`
    });

    return {
      success: true,
      projectPath,
      githubUrl,
      tasksCreated: tasks.length
    };
  },

  // Retry configuration (overrides global)
  retries: {
    maxAttempts: 3,
    backoff: 'exponential'
  },

  // Timeout configuration
  timeout: '5m' // 5 minutes max
});
```

**Usage**:
```typescript
// Trigger manually
const result = await triggerWorkflow('clientOnboarding', {
  clientName: 'Acme Corp',
  contactEmail: 'john@acme.com',
  projectType: 'web'
});

// Trigger from event
subscribe({
  queue: 'weaver.workflows',
  handler: async (event) => {
    if (event.type === 'project.created') {
      await triggerWorkflow('clientOnboarding', event.data);
    }
  }
});
```

### Example 2: Weekly Report Generation

**workflows/weekly-report.ts**:
```typescript
import { defineWorkflow } from '@workflowdev/core';
import { queryTasks, getGitCommits } from './activities/obsidian';
import { generateReport } from './activities/claude';
import { createNote } from './activities/obsidian';
import { notifySlack } from './activities/notifications';

export default defineWorkflow({
  name: 'weeklyReport',
  description: 'Generate automated weekly status report',

  async execute() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Step 1: Query completed tasks (last 7 days)
    const tasks = await queryTasks({
      status: 'completed',
      since: oneWeekAgo
    });

    // Group tasks by project
    const tasksByProject = tasks.reduce((acc, task) => {
      const project = task.project || 'General';
      acc[project] = acc[project] || [];
      acc[project].push(task);
      return acc;
    }, {} as Record<string, any[]>);

    // Step 2: Get Git commit history
    const commits = await getGitCommits({
      since: oneWeekAgo,
      format: 'short'
    });

    // Step 3: Generate AI summary (Claude)
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

    // Step 4: Create report note in vault
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
      message: `Weekly report generated: obsidian://open?vault=weave-nn&file=${reportPath}`,
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: summary.split('\n').slice(0, 5).join('\n') + '...' }
        }
      ]
    });

    return { reportPath, tasksProcessed: tasks.length };
  },

  // Run every Friday at 5pm
  schedule: {
    cron: '0 17 * * 5',
    timezone: 'America/Los_Angeles'
  }
});
```

### Example 3: Knowledge Extraction on Project Close

**workflows/knowledge-extraction.ts**:
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

    // Step 2: AI analysis (long-running, durable)
    const insights = await analyzeProject({
      files: content,
      prompt: `Extract reusable knowledge from this project:
        - Common patterns used
        - Reusable solutions
        - Best practices discovered
        - Pitfalls to avoid
        - Technical decisions and rationale

        Format as structured markdown for knowledge base.`,
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

  // Long timeout for AI processing
  timeout: '15m',

  // Aggressive retries for expensive AI calls
  retries: {
    maxAttempts: 5,
    backoff: 'exponential',
    maxDelay: 120000 // 2 minutes max
  }
});
```

---

## Activities (Reusable Building Blocks)

**workflows/activities/obsidian.ts**:
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

    // Create folder structure
    await client.createNote({
      path: `${path}/README.md`,
      content: `# ${clientName}\n\nProject Type: ${projectType}`,
      frontmatter: { type: 'project', status: 'active' }
    });

    await client.createNote({
      path: `${path}/tasks.md`,
      content: '# Tasks\n\n'
    });

    await client.createNote({
      path: `${path}/decisions.md`,
      content: '# Decisions\n\n'
    });

    return path;
  }
});

export const readNote = defineActivity({
  name: 'readNote',
  async execute({ path }) {
    const note = await client.getNote(path);
    return note.content;
  }
});

export const createNote = defineActivity({
  name: 'createNote',
  async execute({ path, content, frontmatter }) {
    await client.createNote({ path, content, frontmatter });
    return { path };
  }
});
```

**workflows/activities/git.ts**:
```typescript
import { defineActivity } from '@workflowdev/core';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const initGitRepo = defineActivity({
  name: 'initGitRepo',
  async execute({ path, initialBranch, commitMessage }) {
    await execAsync(`cd ${path} && git init -b ${initialBranch}`);
    await execAsync(`cd ${path} && git add .`);
    await execAsync(`cd ${path} && git commit -m "${commitMessage}"`);
    return { initialized: true };
  }
});

export const getGitCommits = defineActivity({
  name: 'getGitCommits',
  async execute({ since, format = 'short' }) {
    const sinceArg = since.toISOString();
    const { stdout } = await execAsync(
      `git log --since="${sinceArg}" --oneline`
    );
    return stdout.split('\n').filter(Boolean);
  }
});
```

**workflows/activities/claude.ts**:
```typescript
import { defineActivity } from '@workflowdev/core';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

export const generateReport = defineActivity({
  name: 'generateReport',
  async execute({ prompt, model = 'claude-3-5-sonnet-20241022', maxTokens = 2048 }) {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].type === 'text'
      ? response.content[0].text
      : '';
  },

  // Retry on API errors
  retries: {
    maxAttempts: 5,
    backoff: 'exponential'
  }
});

export const analyzeProject = defineActivity({
  name: 'analyzeProject',
  async execute({ files, prompt, model, maxTokens = 4096 }) {
    const fileContents = files.map((f: any) =>
      `File: ${f.path}\n${f.content}`
    ).join('\n\n---\n\n');

    const fullPrompt = `${prompt}\n\nProject Files:\n${fileContents}`;

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    return response.content[0].type === 'text'
      ? response.content[0].text
      : '';
  }
});
```

---

## Deployment

### Local Development (MVP)

```bash
# Install Weaver
npm install -g @workflowdev/cli

# Initialize project
cd /home/aepod/dev/weave-nn
weaver init

# Start local development server
weaver dev

# Test workflow
weaver test clientOnboarding --input '{"clientName": "Test Corp", "contactEmail": "test@test.com", "projectType": "web"}'

# View execution history
weaver history

# Debug failed workflow
weaver replay <workflow-id> --debug
```

### Production (Docker Compose)

**docker-compose.yml**:
```yaml
services:
  weaver:
    image: workflowdev/engine:latest
    ports:
      - "3000:3000"  # Workflow API
      - "9090:9090"  # Prometheus metrics
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://weaver:password@postgres:5432/weaver
      - RABBITMQ_URL=amqp://admin:weave-nn-2025@rabbitmq:5672
      - OBSIDIAN_API_URL=http://host.docker.internal:27124
      - OBSIDIAN_API_KEY=${OBSIDIAN_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./workflows:/app/workflows:ro
      - ./weaver.config.ts:/app/weaver.config.ts:ro
    depends_on:
      - postgres
      - rabbitmq
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=weaver
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=weaver
    volumes:
      - weaver_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  weaver_data:
```

### Resource Requirements

**Local Development**:
- RAM: 100-200 MB (idle)
- CPU: 0.1-0.2 cores (idle)
- Storage: 50 MB (Weaver binary) + 10-50 MB (SQLite state)

**Production (Docker)**:
- RAM: 200-500 MB per workflow worker
- CPU: 0.5-1 core per worker
- Storage: 100 MB (Docker image) + PostgreSQL storage

---

## Observability and Debugging

### Time-Travel Debugging

**View Execution History**:
```bash
# List all workflow executions
weaver history

# View specific execution
weaver history clientOnboarding --id abc123

# Output:
# Workflow: clientOnboarding (abc123)
# Status: COMPLETED
# Started: 2025-10-23T10:15:30Z
# Duration: 12.3s
#
# Timeline:
# [10:15:30] Step 1: createProjectFolder (2.1s) ✓
# [10:15:32] Step 2: copyTemplates (1.5s) ✓
# [10:15:34] Step 3: initGitRepo (3.2s) ✓
# [10:15:37] Step 4: createGithubRepo (4.1s) ✓ (2 retries)
# [10:15:41] Step 5: createTasks (0.8s) ✓
# [10:15:42] Step 6: notifySlack (0.6s) ✓
```

**Replay Failed Workflow**:
```bash
# Replay from failed step
weaver replay abc123 --from-step 4

# Replay with modified input
weaver replay abc123 --input '{"clientName": "Acme Corp Fixed"}'

# Debug with breakpoints
weaver debug abc123 --break-at createGithubRepo
```

### Traces and Metrics

**Distributed Tracing** (OpenTelemetry):
```bash
# Export traces to Jaeger
weaver configure observability.traces.exporter jaeger

# View trace
weaver trace abc123

# Output shows:
# - Total duration
# - Time spent in each activity
# - External API calls
# - Database queries
# - Queue operations
```

**Prometheus Metrics**:
```
# HELP weaver_workflow_duration_seconds Workflow execution duration
# TYPE weaver_workflow_duration_seconds histogram
weaver_workflow_duration_seconds_bucket{workflow="clientOnboarding",le="1"} 0
weaver_workflow_duration_seconds_bucket{workflow="clientOnboarding",le="5"} 0
weaver_workflow_duration_seconds_bucket{workflow="clientOnboarding",le="10"} 0
weaver_workflow_duration_seconds_bucket{workflow="clientOnboarding",le="15"} 12
weaver_workflow_duration_seconds_sum{workflow="clientOnboarding"} 148.5
weaver_workflow_duration_seconds_count{workflow="clientOnboarding"} 12

# HELP weaver_workflow_failures_total Total workflow failures
# TYPE weaver_workflow_failures_total counter
weaver_workflow_failures_total{workflow="clientOnboarding"} 0

# HELP weaver_workflow_retries_total Total workflow retries
# TYPE weaver_workflow_retries_total counter
weaver_workflow_retries_total{workflow="clientOnboarding",activity="createGithubRepo"} 24
```

### Logging

**Structured Logs**:
```json
{
  "timestamp": "2025-10-23T10:15:30.123Z",
  "level": "info",
  "workflow": "clientOnboarding",
  "workflowId": "abc123",
  "step": "createProjectFolder",
  "duration": 2100,
  "status": "completed",
  "input": {"clientName": "Acme Corp"},
  "output": {"path": "_projects/acme-corp"}
}
```

---

## API Reference

### CLI Commands

```bash
# Initialize project
weaver init [--template typescript|javascript]

# Start development server
weaver dev [--port 3000] [--watch]

# Test workflow
weaver test <workflow-name> --input <json>

# Trigger workflow
weaver trigger <workflow-name> --input <json>

# View execution history
weaver history [workflow-name] [--id <id>] [--status <status>]

# Replay workflow
weaver replay <workflow-id> [--from-step <step>] [--input <json>]

# Debug workflow
weaver debug <workflow-id> [--break-at <step>]

# View traces
weaver trace <workflow-id>

# Export metrics
weaver metrics [--format prometheus|json]

# Manage schedules
weaver schedule list
weaver schedule enable <schedule-name>
weaver schedule disable <schedule-name>

# Configuration
weaver configure <key> <value>
weaver configure --list
```

### TypeScript API

**Workflow Definition**:
```typescript
import { defineWorkflow, defineActivity } from '@workflowdev/core';

// Define activity
export const myActivity = defineActivity({
  name: 'myActivity',
  async execute(input: { param: string }) {
    return { result: 'success' };
  },
  retries: { maxAttempts: 3 }
});

// Define workflow
export default defineWorkflow({
  name: 'myWorkflow',
  description: 'Workflow description',
  async execute(input: { data: string }) {
    const result = await myActivity({ param: input.data });
    return result;
  },
  timeout: '5m',
  retries: { maxAttempts: 5 }
});
```

**Programmatic Trigger**:
```typescript
import { triggerWorkflow, getWorkflowStatus } from '@workflowdev/client';

// Trigger workflow
const execution = await triggerWorkflow('myWorkflow', {
  data: 'input data'
});

// Get status
const status = await getWorkflowStatus(execution.id);
console.log(status); // { status: 'COMPLETED', result: { ... } }
```

**Event Subscription**:
```typescript
import { subscribe } from '@workflowdev/events';

subscribe({
  queue: 'my-queue',
  routingKey: 'event.type.*',
  handler: async (event) => {
    await triggerWorkflow('myWorkflow', event.data);
  }
});
```

---

## Troubleshooting

### Common Issues

**Issue 1: Workflow stuck in PENDING state**
```bash
# Check if worker is running
weaver status

# Restart worker
weaver restart

# Check logs
weaver logs --workflow <workflow-id>
```

**Issue 2: Activity retry exhausted**
```bash
# View execution history
weaver history <workflow-id>

# Check error details
weaver logs <workflow-id> --activity <activity-name>

# Manually retry with modified input
weaver replay <workflow-id> --input '{"modified": "data"}'
```

**Issue 3: RabbitMQ connection failed**
```bash
# Verify RabbitMQ is running
docker ps | grep rabbitmq

# Check Weaver configuration
weaver configure --list | grep RABBITMQ

# Test connection
weaver test-connection rabbitmq
```

**Issue 4: Obsidian API timeout**
```bash
# Check Obsidian REST API plugin is running
curl http://localhost:27124/vault

# Increase activity timeout
# In workflow definition:
defineActivity({
  name: 'myActivity',
  timeout: '30s' // Increase from default 10s
})
```

### Performance Optimization

**Parallel Execution**:
```typescript
// Bad: Sequential
const result1 = await activity1();
const result2 = await activity2();

// Good: Parallel
const [result1, result2] = await Promise.all([
  activity1(),
  activity2()
]);
```

**Caching Expensive Operations**:
```typescript
import { cache } from '@workflowdev/cache';

export const expensiveOperation = defineActivity({
  name: 'expensiveOperation',
  async execute(input: { key: string }) {
    return await cache(input.key, async () => {
      // Expensive computation
      return computeResult(input.key);
    }, { ttl: 3600 }); // Cache for 1 hour
  }
});
```

---

## Migration from n8n

### Feature Comparison

| Feature | n8n | Weaver |
|---------|-----|--------|
| Workflow Definition | Visual UI | TypeScript code |
| State Persistence | Manual | Automatic |
| Retries | Manual configuration | Automatic with backoff |
| Debugging | UI logs | Time-travel debugging |
| Version Control | JSON export | Native Git |
| Type Safety | None | Full TypeScript |
| Local Development | Docker required | Native Node.js |
| Cost | Free (self-hosted) | Free (local dev) |

### Migration Steps

See [[../docs/weaver-migration-guide|Weaver Migration Guide]] for detailed step-by-step instructions.

**Quick Migration**:
1. Export n8n workflows as JSON
2. Convert to TypeScript workflows using `weaver convert`
3. Test locally with `weaver test`
4. Deploy with `weaver deploy`

---

## Cost Analysis

### Development Costs

**Local Development** (MVP):
- Weaver CLI: Free
- Local state storage (SQLite): Free
- **Total**: $0/month

**Production** (Docker Compose):
- Weaver engine: Free (open source)
- PostgreSQL: Free (self-hosted)
- **Total**: $0/month infrastructure (only compute costs)

### Operational Costs

**Workflow Execution**:
- Local execution: Free
- Cloud features (workflow.dev): Pay-per-execution
  - First 1000 executions/month: Free
  - Additional: $0.001 per execution
  - **Estimate for Weave-NN**: <1000/month = $0

**AI API Costs** (Claude):
- Claude API: ~$50/month (based on workflow usage)
- Embeddings: ~$10/month

**Total Monthly Cost**: **~$60/month** (same as n8n estimate)

### Cost Comparison vs n8n

| Factor | n8n | Weaver |
|--------|-----|--------|
| Infrastructure | $50/month (Docker VM) | $0 (local) or $50/month (Docker) |
| Workflow Execution | Free | Free (<1000/month) |
| AI API | $60/month | $60/month |
| **Total** | **$110/month** | **$60/month** (45% savings) |

---

## Learning Resources

### Official Documentation
- [Weaver Documentation](https://docs.workflow.dev/) - Complete guide
- [Getting Started](https://docs.workflow.dev/getting-started) - Quick start
- [Workflow Patterns](https://docs.workflow.dev/patterns) - Best practices
- [API Reference](https://docs.workflow.dev/api) - TypeScript API

### Tutorials
- [Building Your First Workflow](https://docs.workflow.dev/tutorials/first-workflow)
- [Event-Driven Workflows](https://docs.workflow.dev/tutorials/events)
- [Time-Travel Debugging](https://docs.workflow.dev/tutorials/debugging)

### Community
- [GitHub Repository](https://github.com/workflowdev/weaver)
- [Discord Community](https://discord.gg/workflowdev)
- [Example Workflows](https://github.com/workflowdev/examples)

---

## Related Nodes

**Architecture**:
- [[../architecture/workflow-automation-system]] - Weaver-based workflow engine
- [[../architecture/event-consumer]] - Triggers workflows from RabbitMQ events
- [[../architecture/mvp-local-first-architecture]] - Local-first deployment

**Features**:
- [[../features/weaver-workflow-automation]] - Feature documentation
- [[../features/github-issues-integration]] - Enabled by Weaver workflows
- [[../features/daily-log-automation]] - Scheduled via Weaver

**Decisions**:
- [[../decisions/technical/workflow-automation-platform]] - Why Weaver over n8n
- [[../decisions/technical/event-driven-architecture]] - Weaver consumes RabbitMQ events

**Other Primitives**:
- [[rabbitmq]] - Event source for Weaver workflows
- [[obsidian-api-client]] - Vault operations in workflows
- [[gitpython]] - Git operations in workflows
- [[mcp-protocol]] - AI integration in workflows

---

## Revisit Criteria

**Reconsider this technology if**:
- Workflow complexity requires visual debugging (consider hybrid approach with n8n)
- Non-technical users need to create workflows (add visual workflow builder)
- Execution volume exceeds 100k/month (evaluate workflow.dev cloud pricing)
- TypeScript requirement becomes barrier (unlikely for Weave-NN)

**Scheduled Review**: After 3 months of MVP usage (evaluate developer experience and reliability)

---

**Back to**: [[README|Technical Primitives Index]]
