---
type: documentation
category: migration-guide
status: draft
created_date: '2025-10-23'
updated_date: '2025-10-28'
audience: developers
estimated_time: 4-8 hours
tags:
  - migration
  - weaver
  - workflow-dev
  - n8n
  - bash-hooks
  - automation
domain: weaver
visual:
  icon: "\U0001F4DA"
  color: '#06B6D4'
  cssclasses:
    - type-documentation
    - status-draft
    - domain-weaver
version: '3.0'
---

# Weaver Migration Guide

**Purpose**: Step-by-step guide for migrating from bash hooks and n8n workflows to Weaver (workflow.dev) durable workflow engine.

**Audience**: Developers implementing Weave-NN's workflow automation system

**Estimated Time**: 4-8 hours (depending on complexity of existing workflows)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Migration Strategy](#migration-strategy)
3. [Phase 1: Setup Weaver](#phase-1-setup-weaver)
4. [Phase 2: Migrate Bash Hooks](#phase-2-migrate-bash-hooks)
5. [Phase 3: Migrate n8n Workflows](#phase-3-migrate-n8n-workflows)
6. [Phase 4: Testing and Validation](#phase-4-testing-and-validation)
7. [Phase 5: Cutover and Rollback](#phase-5-cutover-and-rollback)
8. [Common Issues and Solutions](#common-issues-and-solutions)
9. [FAQ](#faq)

---

## Prerequisites

### Required Tools

✅ **Installed and Running**:
- Node.js 18+ (`node --version`)
- RabbitMQ (`docker ps | grep rabbitmq`)
- Obsidian with Local REST API plugin
- Git

✅ **Environment Variables**:
```bash
# .env file
RABBITMQ_URL=amqp://admin:weave-nn-2025@localhost:5672
OBSIDIAN_API_URL=http://localhost:27124
OBSIDIAN_API_KEY=your-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-key
GITHUB_TOKEN=ghp_your-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

✅ **Permissions**:
- Read/write access to Weave-NN repository
- Admin access to RabbitMQ management UI
- API keys for external services (GitHub, Slack, Claude)

### Recommended Skills

- TypeScript basics (async/await, promises, types)
- Bash scripting (to understand existing hooks)
- Git workflow understanding
- Basic familiarity with RabbitMQ concepts

---

## Migration Strategy

### Overview

**Goal**: Replace brittle bash hooks and UI-based n8n workflows with durable, code-first Weaver workflows.

**Approach**: Gradual migration with parallel operation period.

```
┌────────────────────────────────────────────────────────────┐
│                 Migration Timeline                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Week 1 Day 1-2: Setup Weaver + Create Activities         │
│  Week 1 Day 3-4: Migrate Bash Hooks (3 critical hooks)    │
│  Week 1 Day 5-6: Migrate n8n Workflows (3 core workflows) │
│  Week 1 Day 7:   Testing and Validation                   │
│                                                            │
│  Week 2 Day 8-9: Parallel Operation (both systems)        │
│  Week 2 Day 10:  Cutover to Weaver (disable bash/n8n)     │
│  Week 2 Day 11:  Monitoring and Rollback if Needed        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Success Criteria

**Before Cutover**:
- ✅ All 3 core Weaver workflows operational and tested
- ✅ Parallel operation validated (no conflicts between bash/n8n/Weaver)
- ✅ Rollback procedure tested
- ✅ Monitoring dashboard configured
- ✅ Team trained on Weaver CLI and debugging

**After Cutover**:
- ✅ 99.9% workflow completion rate (7 days)
- ✅ <1% manual intervention required
- ✅ No critical failures in production use
- ✅ Team comfortable creating new workflows

---

## Phase 1: Setup Weaver

### Step 1.1: Install Weaver CLI

```bash
# Install globally
npm install -g @workflowdev/cli

# Verify installation
weaver --version
# Expected: @workflowdev/cli version 1.0.0 (or later)

# Check dependencies
weaver doctor
# Expected: All checks pass (Node.js, npm, Git)
```

### Step 1.2: Initialize Weaver Project

```bash
# Navigate to repository root
cd /home/aepod/dev/weave-nn

# Initialize Weaver
weaver init

# This creates:
# - workflows/                 (workflow definitions)
# - workflows/activities/      (reusable activities)
# - workflows/lib/             (shared utilities)
# - weaver.config.ts           (configuration)
# - .weaver/                   (local state, gitignored)
# - .gitignore                 (updated with .weaver/)
```

### Step 1.3: Configure Weaver

**Edit `weaver.config.ts`**:
```typescript
import { defineConfig } from '@workflowdev/cli';

export default defineConfig({
  // Workflow directory
  workflowsDir: './workflows',

  // State persistence (SQLite for local dev, PostgreSQL for production)
  storage: {
    type: process.env.NODE_ENV === 'production' ? 'postgres' : 'sqlite',
    path: '.weaver/workflows.db', // SQLite only
    url: process.env.DATABASE_URL   // PostgreSQL only
  },

  // RabbitMQ event subscription
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

  // Retry configuration (global defaults)
  retries: {
    maxAttempts: 5,
    backoff: 'exponential',
    initialDelay: 1000,  // 1 second
    maxDelay: 60000      // 1 minute
  },

  // Scheduled workflows
  schedules: [
    {
      name: 'weeklyReport',
      cron: '0 17 * * 5',     // Every Friday at 5pm
      workflow: 'weekly-report',
      timezone: 'America/Los_Angeles'
    },
    {
      name: 'dailyLog',
      cron: '0 9 * * *',      // Every day at 9am
      workflow: 'daily-log-automation'
    }
  ],

  // Observability (metrics and traces)
  observability: {
    traces: {
      enabled: true,
      exporter: 'console' // or 'jaeger', 'zipkin'
    },
    metrics: {
      enabled: true,
      port: 9090 // Prometheus metrics endpoint
    }
  }
});
```

### Step 1.4: Create Reusable Activities

Activities are the building blocks of workflows. Create common activities first.

**`workflows/activities/obsidian.ts`**:
```typescript
import { defineActivity } from '@workflowdev/core';
import { ObsidianAPIClient } from '../../src/clients/ObsidianAPIClient';

const client = new ObsidianAPIClient({
  apiUrl: process.env.OBSIDIAN_API_URL!,
  apiKey: process.env.OBSIDIAN_API_KEY!,
  timeout: 30000,
  maxRetries: 3
});

export const createProjectFolder = defineActivity({
  name: 'createProjectFolder',
  async execute({ clientName, projectType }: {
    clientName: string;
    projectType: string;
  }) {
    const path = `_projects/${clientName}`;

    // Create README
    await client.createNote({
      path: `${path}/README.md`,
      content: `# ${clientName}\n\nProject Type: ${projectType}\nCreated: ${new Date().toISOString()}`,
      frontmatter: {
        type: 'project',
        status: 'active',
        project_type: projectType
      }
    });

    // Create tasks file
    await client.createNote({
      path: `${path}/tasks.md`,
      content: '# Tasks\n\n'
    });

    // Create decisions file
    await client.createNote({
      path: `${path}/decisions.md`,
      content: '# Decisions\n\n'
    });

    return path;
  },
  timeout: '30s'
});

export const readNote = defineActivity({
  name: 'readNote',
  async execute({ path }: { path: string }) {
    const note = await client.getNote(path);
    return note;
  }
});

export const createNote = defineActivity({
  name: 'createNote',
  async execute({ path, content, frontmatter }: {
    path: string;
    content: string;
    frontmatter?: Record<string, any>;
  }) {
    await client.createNote({ path, content, frontmatter });
    return { path, created: true };
  }
});

export const listNotes = defineActivity({
  name: 'listNotes',
  async execute({ path }: { path: string }) {
    const notes = await client.getNotes({ path });
    return notes;
  }
});

export const queryTasks = defineActivity({
  name: 'queryTasks',
  async execute({ status, since }: {
    status?: string;
    since?: Date;
  }) {
    // Query tasks using Obsidian Tasks plugin format
    const allTasks = await client.searchNotes('- [ ]', {
      paths: ['_projects/', '_planning/']
    });

    // Filter by status and date (simplified example)
    const filtered = allTasks.filter((task: any) => {
      if (status && !task.content.includes(status)) return false;
      if (since && new Date(task.created) < since) return false;
      return true;
    });

    return filtered;
  }
});
```

**`workflows/activities/git.ts`**:
```typescript
import { defineActivity } from '@workflowdev/core';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const initGitRepo = defineActivity({
  name: 'initGitRepo',
  async execute({ path, initialBranch = 'main', commitMessage }: {
    path: string;
    initialBranch?: string;
    commitMessage: string;
  }) {
    try {
      await execAsync(`cd ${path} && git init -b ${initialBranch}`);
      await execAsync(`cd ${path} && git add .`);
      await execAsync(`cd ${path} && git commit -m "${commitMessage}"`);
      return { initialized: true, branch: initialBranch };
    } catch (error: any) {
      throw new Error(`Git initialization failed: ${error.message}`);
    }
  },
  timeout: '60s'
});

export const getGitCommits = defineActivity({
  name: 'getGitCommits',
  async execute({ since, format = 'short' }: {
    since: Date;
    format?: string;
  }) {
    const sinceArg = since.toISOString();
    const { stdout } = await execAsync(
      `git log --since="${sinceArg}" --oneline`
    );
    return stdout.split('\n').filter(Boolean);
  }
});

export const gitPush = defineActivity({
  name: 'gitPush',
  async execute({ branch, remote = 'origin' }: {
    branch: string;
    remote?: string;
  }) {
    await execAsync(`git push ${remote} ${branch}`);
    return { pushed: true };
  },
  retries: {
    maxAttempts: 5,
    backoff: 'exponential'
  }
});

export const archiveProject = defineActivity({
  name: 'archiveProject',
  async execute({ projectPath, archivePath, createTag, tagName }: {
    projectPath: string;
    archivePath: string;
    createTag?: boolean;
    tagName?: string;
  }) {
    // Move project to archive
    await execAsync(`git mv ${projectPath} ${archivePath}`);
    await execAsync(`git commit -m "chore: Archive project ${projectPath}"`);

    // Create Git tag if requested
    if (createTag && tagName) {
      await execAsync(`git tag ${tagName}`);
    }

    return { archived: true, path: archivePath };
  }
});
```

**`workflows/activities/github.ts`**:
```typescript
import { defineActivity } from '@workflowdev/core';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export const createGithubRepo = defineActivity({
  name: 'createGithubRepo',
  async execute({ name, private: isPrivate = true, description }: {
    name: string;
    private?: boolean;
    description?: string;
  }) {
    const response = await octokit.repos.create({
      name,
      private: isPrivate,
      description
    });

    return response.data.html_url;
  },
  retries: {
    maxAttempts: 5,
    backoff: 'exponential'
  },
  timeout: '30s'
});

export const fetchGithubIssue = defineActivity({
  name: 'fetchGithubIssue',
  async execute({ repo, issueId }: {
    repo: string;
    issueId: number;
  }) {
    const [owner, repoName] = repo.split('/');
    const response = await octokit.issues.get({
      owner,
      repo: repoName,
      issue_number: issueId
    });

    return response.data;
  }
});

export const createGithubComment = defineActivity({
  name: 'createGithubComment',
  async execute({ repo, issueId, body }: {
    repo: string;
    issueId: number;
    body: string;
  }) {
    const [owner, repoName] = repo.split('/');
    const response = await octokit.issues.createComment({
      owner,
      repo: repoName,
      issue_number: issueId,
      body
    });

    return response.data;
  }
});
```

**`workflows/activities/claude.ts`**:
```typescript
import { defineActivity } from '@workflowdev/core';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

export const generateReport = defineActivity({
  name: 'generateReport',
  async execute({ prompt, model = 'claude-3-5-sonnet-20241022', maxTokens = 2048 }: {
    prompt: string;
    model?: string;
    maxTokens?: number;
  }) {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0].type === 'text'
      ? response.content[0].text
      : '';
  },
  retries: {
    maxAttempts: 5,
    backoff: 'exponential'
  },
  timeout: '120s'
});

export const analyzeProject = defineActivity({
  name: 'analyzeProject',
  async execute({ files, prompt, model = 'claude-3-5-sonnet-20241022', maxTokens = 4096 }: {
    files: Array<{ path: string; content: string }>;
    prompt: string;
    model?: string;
    maxTokens?: number;
  }) {
    const fileContents = files
      .map((f) => `File: ${f.path}\n${f.content}`)
      .join('\n\n---\n\n');

    const fullPrompt = `${prompt}\n\nProject Files:\n${fileContents}`;

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    return response.content[0].type === 'text'
      ? response.content[0].text
      : '';
  },
  retries: {
    maxAttempts: 5,
    backoff: 'exponential'
  },
  timeout: '300s' // 5 minutes
});
```

**`workflows/activities/notifications.ts`**:
```typescript
import { defineActivity } from '@workflowdev/core';
import axios from 'axios';

export const notifySlack = defineActivity({
  name: 'notifySlack',
  async execute({ channel, message, blocks }: {
    channel: string;
    message: string;
    blocks?: any[];
  }) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL!;

    await axios.post(webhookUrl, {
      channel,
      text: message,
      blocks
    });

    return { sent: true };
  },
  retries: {
    maxAttempts: 3,
    backoff: 'exponential'
  }
});
```

### Step 1.5: Test Weaver Setup

```bash
# Start Weaver in development mode
weaver dev

# Expected output:
# ✓ Weaver development server started
# ✓ Connected to RabbitMQ (amqp://localhost:5672)
# ✓ Listening on http://localhost:3000
# ✓ Prometheus metrics available at http://localhost:9090/metrics
# ✓ Watching for changes in ./workflows

# In another terminal, verify RabbitMQ connection
curl -u admin:weave-nn-2025 http://localhost:15672/api/queues/%2F/weaver.workflows

# Expected: Queue exists with 0 messages
```

---

## Phase 2: Migrate Bash Hooks

### Step 2.1: Inventory Existing Bash Hooks

**Identify all Git hooks**:
```bash
# List all hooks in .git/hooks/
ls -la .git/hooks/

# Common hooks to migrate:
# - pre-commit    (validation before commit)
# - post-commit   (auto-push, notifications)
# - pre-push      (CI checks before push)
```

### Step 2.2: Analyze Bash Hook Logic

**Example: `pre-commit` hook**:
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Validate YAML frontmatter in all markdown files
for file in $(git diff --cached --name-only | grep '\.md$'); do
  if ! grep -q "^---" "$file"; then
    echo "Error: $file missing YAML frontmatter"
    exit 1
  fi
done

# Check for TODO comments in staged files
if git diff --cached | grep -i "TODO"; then
  echo "Warning: TODO comments found in staged changes"
  # Don't fail, just warn
fi

exit 0
```

### Step 2.3: Convert to Weaver Workflow

**Create `workflows/pre-commit-validation.ts`**:
```typescript
import { defineWorkflow } from '@workflowdev/core';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default defineWorkflow({
  name: 'preCommitValidation',
  description: 'Validate files before Git commit',

  async execute() {
    // Step 1: Get staged files
    const { stdout: stagedFiles } = await execAsync(
      'git diff --cached --name-only'
    );

    const mdFiles = stagedFiles
      .split('\n')
      .filter((f) => f.endsWith('.md'));

    // Step 2: Validate YAML frontmatter
    const errors: string[] = [];
    for (const file of mdFiles) {
      try {
        const { stdout: content } = await execAsync(`cat "${file}"`);
        if (!content.startsWith('---')) {
          errors.push(`${file}: Missing YAML frontmatter`);
        }
      } catch (error) {
        errors.push(`${file}: Failed to read file`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed:\n${errors.join('\n')}`);
    }

    // Step 3: Check for TODO comments (warning only)
    try {
      const { stdout: diff } = await execAsync('git diff --cached');
      if (diff.match(/TODO/i)) {
        console.warn('⚠️  Warning: TODO comments found in staged changes');
      }
    } catch (error) {
      // Ignore if no diff
    }

    return { validated: true, filesChecked: mdFiles.length };
  },

  timeout: '30s'
});
```

### Step 2.4: Trigger Weaver Workflow from Git Hook

**Update `.git/hooks/pre-commit` to call Weaver**:
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Trigger Weaver workflow
weaver trigger preCommitValidation

# Check exit code
if [ $? -ne 0 ]; then
  echo "❌ Pre-commit validation failed"
  exit 1
fi

echo "✅ Pre-commit validation passed"
exit 0
```

### Step 2.5: Migrate Other Common Hooks

**Hook 2: `post-commit` (Auto-push)**

Before (bash):
```bash
#!/bin/bash
# .git/hooks/post-commit

# Auto-push to remote
git push origin main

# Send notification
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -d '{"text": "New commit pushed to main"}'
```

After (Weaver):
```typescript
import { defineWorkflow } from '@workflowdev/core';
import { gitPush } from './activities/git';
import { notifySlack } from './activities/notifications';

export default defineWorkflow({
  name: 'postCommit',
  description: 'Auto-push and notify after commit',

  async execute({ commitSha }: { commitSha: string }) {
    // Step 1: Push to remote (with automatic retry)
    await gitPush({ branch: 'main', remote: 'origin' });

    // Step 2: Send Slack notification
    await notifySlack({
      channel: '#commits',
      message: `✅ New commit pushed to main: ${commitSha.slice(0, 7)}`
    });

    return { pushed: true, commitSha };
  },

  retries: {
    maxAttempts: 5,
    backoff: 'exponential'
  }
});
```

**Hook 3: `pre-push` (CI checks)**

```typescript
import { defineWorkflow } from '@workflowdev/core';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default defineWorkflow({
  name: 'prePush',
  description: 'Run CI checks before push',

  async execute() {
    // Step 1: Run linter
    await execAsync('npm run lint');

    // Step 2: Run type checker
    await execAsync('npm run typecheck');

    // Step 3: Run tests
    await execAsync('npm test');

    return { passed: true };
  },

  timeout: '5m'
});
```

### Step 2.6: Test Migrated Hooks

```bash
# Test pre-commit workflow
weaver test preCommitValidation

# Test post-commit workflow
weaver test postCommit --input '{"commitSha": "abc123def456"}'

# Test pre-push workflow
weaver test prePush

# Make a real commit to test end-to-end
echo "Test change" >> README.md
git add README.md
git commit -m "test: Verify Weaver pre-commit hook"

# Expected:
# ✅ Pre-commit validation passed
# [main abc123d] test: Verify Weaver pre-commit hook
```

---

## Phase 3: Migrate n8n Workflows

### Step 3.1: Export n8n Workflows

**From n8n UI**:
1. Navigate to http://localhost:5678 (or your n8n URL)
2. Select workflow to export
3. Click "Download" → "JSON"
4. Save to `/tmp/n8n-exports/`

**Expected files**:
- `/tmp/n8n-exports/client-onboarding.json`
- `/tmp/n8n-exports/weekly-report.json`
- `/tmp/n8n-exports/knowledge-extraction.json`

### Step 3.2: Analyze n8n Workflow Structure

**Example: n8n Client Onboarding Workflow**

```json
{
  "name": "Client Onboarding",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "onboard-client", "method": "POST" }
    },
    {
      "name": "Create Project Folder",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://localhost:27124/vault/_projects/{{$json.client_name}}/README.md",
        "method": "POST"
      }
    },
    {
      "name": "Create GitHub Repo",
      "type": "n8n-nodes-base.github",
      "parameters": { "operation": "create", "name": "{{$json.client_name}}" }
    },
    {
      "name": "Send Slack Notification",
      "type": "n8n-nodes-base.slack",
      "parameters": { "channel": "#projects", "text": "New project: {{$json.client_name}}" }
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [[{ "node": "Create Project Folder" }]] },
    "Create Project Folder": { "main": [[{ "node": "Create GitHub Repo" }]] },
    "Create GitHub Repo": { "main": [[{ "node": "Send Slack Notification" }]] }
  }
}
```

### Step 3.3: Map n8n Nodes to Weaver Activities

| n8n Node Type | Weaver Activity | Notes |
|---------------|-----------------|-------|
| Webhook Trigger | RabbitMQ subscription | Event-driven trigger |
| HTTP Request (Obsidian) | `obsidian.ts` activities | Use ObsidianAPIClient |
| GitHub | `github.ts` activities | Use Octokit |
| Slack | `notifications.ts` activities | Use Slack webhook |
| Schedule Trigger | `weaver.config.ts` schedules | Cron-based scheduling |
| Function | Inline TypeScript | Native code in workflow |
| IF/Switch | TypeScript if/switch | Native control flow |

### Step 3.4: Convert n8n Workflow to Weaver

**Create `workflows/client-onboarding.ts`**:
```typescript
import { defineWorkflow } from '@workflowdev/core';
import { createProjectFolder, copyTemplates } from './activities/obsidian';
import { initGitRepo } from './activities/git';
import { createGithubRepo } from './activities/github';
import { notifySlack } from './activities/notifications';

interface OnboardingInput {
  clientName: string;
  contactEmail: string;
  projectType: 'web' | 'mobile' | 'consulting';
}

export default defineWorkflow<OnboardingInput>({
  name: 'clientOnboarding',
  description: 'Complete client project setup workflow (migrated from n8n)',

  async execute({ clientName, contactEmail, projectType }) {
    // n8n Node 1: "Create Project Folder" → createProjectFolder activity
    const projectPath = await createProjectFolder({
      clientName,
      projectType
    });

    // n8n Node 2: "Copy Templates" → copyTemplates activity
    await copyTemplates({
      projectPath,
      templates: ['requirements', 'tasks', 'decisions'],
      variables: { clientName, contactEmail }
    });

    // n8n Node 3: "Initialize Git" → initGitRepo activity
    await initGitRepo({
      path: projectPath,
      initialBranch: 'main',
      commitMessage: `feat: Initialize project for ${clientName}`
    });

    // n8n Node 4: "Create GitHub Repo" → createGithubRepo activity
    const githubUrl = await createGithubRepo({
      name: clientName,
      private: true,
      description: `${projectType} project for ${clientName}`
    });

    // n8n Node 5: "Send Slack Notification" → notifySlack activity
    await notifySlack({
      channel: '#projects',
      message: `🎉 New project started: ${clientName}\nGitHub: ${githubUrl}`
    });

    return {
      success: true,
      projectPath,
      githubUrl
    };
  },

  // Automatic retries (n8n required manual retry configuration)
  retries: {
    maxAttempts: 3,
    backoff: 'exponential'
  },

  timeout: '5m'
});
```

### Step 3.5: Migrate Event Triggers

**n8n Webhook Trigger → Weaver RabbitMQ Subscription**

Before (n8n):
```json
{
  "name": "Webhook Trigger",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "onboard-client",
    "method": "POST"
  }
}
```

After (Weaver):
```typescript
// In workflows/client-onboarding.ts (no change to workflow code)

// In separate event handler file: workflows/event-handlers.ts
import { subscribe, triggerWorkflow } from '@workflowdev/events';

// Subscribe to RabbitMQ events
subscribe({
  queue: 'weaver.workflows',
  routingKey: 'project.created',
  handler: async (event) => {
    // Trigger client onboarding workflow
    await triggerWorkflow('clientOnboarding', {
      clientName: event.data.clientName,
      contactEmail: event.data.contactEmail,
      projectType: event.data.projectType
    });
  }
});
```

### Step 3.6: Migrate Scheduled Workflows

**n8n Cron Trigger → Weaver Schedule Configuration**

Before (n8n):
```json
{
  "name": "Cron Trigger",
  "type": "n8n-nodes-base.cron",
  "parameters": {
    "triggerTimes": {
      "item": [
        { "mode": "everyWeek", "hour": 17, "minute": 0, "weekday": 5 }
      ]
    }
  }
}
```

After (Weaver):
```typescript
// In weaver.config.ts
export default defineConfig({
  schedules: [
    {
      name: 'weeklyReport',
      cron: '0 17 * * 5',     // Every Friday at 5pm
      workflow: 'weekly-report',
      timezone: 'America/Los_Angeles'
    }
  ]
});
```

### Step 3.7: Migrate Conditional Logic

**n8n IF Node → TypeScript if Statement**

Before (n8n):
```json
{
  "name": "IF",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "string": [
        {
          "value1": "={{$json.projectType}}",
          "operation": "equal",
          "value2": "web"
        }
      ]
    }
  }
}
```

After (Weaver):
```typescript
async execute({ clientName, projectType }) {
  const projectPath = await createProjectFolder({ clientName, projectType });

  // Native TypeScript conditional
  if (projectType === 'web') {
    // Web-specific setup
    await setupWebProject(projectPath);
  } else if (projectType === 'mobile') {
    // Mobile-specific setup
    await setupMobileProject(projectPath);
  } else {
    // Default setup
    await setupDefaultProject(projectPath);
  }

  return { success: true, projectPath };
}
```

### Step 3.8: Test Migrated Workflows

```bash
# Test client onboarding workflow
weaver test clientOnboarding --input '{
  "clientName": "Acme Corp",
  "contactEmail": "john@acme.com",
  "projectType": "web"
}'

# Expected:
# ✓ Step 1: createProjectFolder (2.1s)
# ✓ Step 2: copyTemplates (1.5s)
# ✓ Step 3: initGitRepo (3.2s)
# ✓ Step 4: createGithubRepo (4.1s)
# ✓ Step 5: notifySlack (0.6s)
# ✓ Workflow completed successfully (11.5s)

# Test weekly report workflow
weaver test weeklyReport

# Test knowledge extraction workflow
weaver test knowledgeExtraction --input '{"projectId": "test-project"}'
```

---

## Phase 4: Testing and Validation

### Step 4.1: Unit Testing Activities

**Create `workflows/activities/__tests__/obsidian.test.ts`**:
```typescript
import { createProjectFolder } from '../obsidian';

describe('Obsidian Activities', () => {
  test('createProjectFolder creates correct structure', async () => {
    const result = await createProjectFolder({
      clientName: 'Test Corp',
      projectType: 'web'
    });

    expect(result).toBe('_projects/Test Corp');

    // Verify files created (mock Obsidian API in real tests)
  });
});
```

**Run tests**:
```bash
npm test workflows/activities/__tests__/

# Expected:
# PASS workflows/activities/__tests__/obsidian.test.ts
# PASS workflows/activities/__tests__/git.test.ts
# PASS workflows/activities/__tests__/github.test.ts
```

### Step 4.2: Integration Testing Workflows

**Create `workflows/__tests__/client-onboarding.test.ts`**:
```typescript
import { triggerWorkflow, getWorkflowStatus } from '@workflowdev/client';

describe('Client Onboarding Workflow', () => {
  test('completes successfully with valid input', async () => {
    const execution = await triggerWorkflow('clientOnboarding', {
      clientName: 'Test Corp',
      contactEmail: 'test@test.com',
      projectType: 'web'
    });

    // Wait for completion
    const status = await getWorkflowStatus(execution.id);

    expect(status.status).toBe('COMPLETED');
    expect(status.result.success).toBe(true);
  });

  test('retries on GitHub API failure', async () => {
    // Mock GitHub API to fail twice, then succeed
    const execution = await triggerWorkflow('clientOnboarding', {
      clientName: 'Test Corp',
      contactEmail: 'test@test.com',
      projectType: 'web'
    });

    const status = await getWorkflowStatus(execution.id);

    expect(status.status).toBe('COMPLETED');
    expect(status.retries).toBeGreaterThan(0);
  });
});
```

### Step 4.3: Parallel Operation Testing

**Run both systems in parallel** (bash hooks + n8n + Weaver):

```bash
# Enable all three systems
# 1. Bash hooks: Already in .git/hooks/
# 2. n8n: Running in Docker
# 3. Weaver: Running with `weaver dev`

# Make a test commit
echo "Test parallel operation" >> test-file.md
git add test-file.md
git commit -m "test: Parallel operation validation"

# Verify all systems processed the commit:
# - Bash hook: Validate YAML frontmatter ✓
# - n8n: Workflow execution logged in n8n UI ✓
# - Weaver: Workflow execution in `weaver history` ✓

# Check for conflicts or duplicate operations
weaver history postCommit
# Expected: Single execution (no duplicates)
```

### Step 4.4: Performance Testing

**Benchmark workflow execution times**:
```bash
# Measure Weaver performance
time weaver test clientOnboarding --input '{
  "clientName": "Benchmark Corp",
  "contactEmail": "test@test.com",
  "projectType": "web"
}'

# Expected: <30 seconds (p95)

# Compare to n8n (if still running)
# n8n typically slower due to UI overhead
```

### Step 4.5: Failure Recovery Testing

**Test automatic retry and resume**:
```bash
# Simulate failure by stopping Obsidian API mid-workflow
weaver test clientOnboarding --input '{...}'

# During execution, stop Obsidian:
docker stop obsidian

# Weaver will retry automatically
# Expected: Workflow retries 5 times with exponential backoff

# Restart Obsidian
docker start obsidian

# Weaver resumes from last checkpoint
# Expected: Workflow completes successfully

# Verify in history
weaver history clientOnboarding --latest
# Expected: Shows retry attempts and final success
```

---

## Phase 5: Cutover and Rollback

### Step 5.1: Prepare for Cutover

**Pre-cutover checklist**:
- ✅ All 3 core Weaver workflows tested and operational
- ✅ Parallel operation validated (no conflicts)
- ✅ Rollback procedure documented and tested
- ✅ Monitoring dashboard configured
- ✅ Team trained on Weaver CLI
- ✅ Emergency contacts list created

**Create cutover plan**:
```bash
# cutover-plan.md
1. [08:00] Announce maintenance window (30 minutes)
2. [08:05] Disable n8n workflows (stop Docker container)
3. [08:10] Update Git hooks to call Weaver only
4. [08:15] Restart Weaver in production mode
5. [08:20] Smoke test all 3 workflows
6. [08:25] Monitor for 5 minutes
7. [08:30] Announce completion
```

### Step 5.2: Execute Cutover

**Step 1: Disable n8n**:
```bash
# Stop n8n Docker container
docker stop n8n

# Verify n8n is not accessible
curl http://localhost:5678
# Expected: Connection refused
```

**Step 2: Update Git Hooks**:
```bash
# Remove direct bash logic, use Weaver only
# .git/hooks/pre-commit
#!/bin/bash
weaver trigger preCommitValidation
exit $?

# .git/hooks/post-commit
#!/bin/bash
COMMIT_SHA=$(git rev-parse HEAD)
weaver trigger postCommit --input "{\"commitSha\": \"$COMMIT_SHA\"}"
exit $?
```

**Step 3: Restart Weaver in Production Mode**:
```bash
# Set production environment
export NODE_ENV=production

# Start Weaver (or use Docker Compose)
weaver start --daemon

# Verify Weaver is running
weaver status
# Expected:
# ✓ Weaver is running (PID: 12345)
# ✓ Connected to RabbitMQ
# ✓ 3 workflows loaded
# ✓ 2 schedules active
```

**Step 4: Smoke Test**:
```bash
# Test each workflow manually
weaver trigger clientOnboarding --input '{
  "clientName": "Smoke Test Corp",
  "contactEmail": "smoke@test.com",
  "projectType": "web"
}'

# Wait for completion
weaver history clientOnboarding --latest
# Expected: COMPLETED

# Test weekly report
weaver trigger weeklyReport

# Test knowledge extraction
weaver trigger knowledgeExtraction --input '{"projectId": "smoke-test"}'
```

**Step 5: Monitor for Issues**:
```bash
# Watch Weaver logs
weaver logs --follow

# Monitor metrics
curl http://localhost:9090/metrics | grep weaver_workflow

# Check RabbitMQ queue depth
curl -u admin:weave-nn-2025 http://localhost:15672/api/queues/%2F/weaver.workflows

# Expected: Queue depth = 0 (all messages processed)
```

### Step 5.3: Rollback Procedure (If Needed)

**Trigger rollback if**:
- Any workflow fails >50% of the time
- Critical features broken
- Data corruption detected
- Team consensus to rollback

**Rollback steps**:
```bash
# 1. Stop Weaver
weaver stop

# 2. Restart n8n
docker start n8n

# 3. Restore Git hooks (remove Weaver calls)
git checkout .git/hooks/pre-commit
git checkout .git/hooks/post-commit

# 4. Verify n8n workflows
curl http://localhost:5678
# Expected: n8n UI accessible

# 5. Test n8n workflow
# Trigger manually from n8n UI

# 6. Announce rollback completion
echo "Rollback completed. Weaver disabled, n8n re-enabled."
```

### Step 5.4: Post-Cutover Monitoring

**Monitor for 7 days**:
```bash
# Daily checks
weaver history --since 24h --status FAILED
# Expected: 0 failures

# Weekly metrics
weaver metrics --format json > weekly-metrics.json

# Compare to pre-cutover baseline
# - Workflow completion rate: Target 99.9%
# - Average execution time: Target <30s
# - Retry rate: Target <5%
```

---

## Common Issues and Solutions

### Issue 1: Weaver Cannot Connect to RabbitMQ

**Symptoms**:
```
Error: ECONNREFUSED connecting to amqp://localhost:5672
```

**Solution**:
```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# If not running, start it
docker start rabbitmq

# Verify connection
curl -u admin:weave-nn-2025 http://localhost:15672/api/overview

# Update weaver.config.ts with correct URL
events: {
  url: 'amqp://admin:weave-nn-2025@localhost:5672'
}
```

### Issue 2: Workflow Stuck in PENDING State

**Symptoms**:
```bash
weaver history myWorkflow
# Output: Status: PENDING (for >5 minutes)
```

**Solution**:
```bash
# Check if worker is running
weaver status

# If not running, start it
weaver start

# If running but stuck, restart
weaver restart

# Check logs for errors
weaver logs myWorkflow --latest

# Manually retry workflow
weaver replay <workflow-id>
```

### Issue 3: Activity Retry Exhausted

**Symptoms**:
```bash
weaver history myWorkflow
# Output: Step 3 (createGithubRepo) FAILED after 5 retries
```

**Solution**:
```bash
# Check error details
weaver logs <workflow-id> --activity createGithubRepo

# Common causes:
# 1. API rate limit exceeded → Wait and replay
# 2. Invalid credentials → Update .env file
# 3. Network timeout → Increase timeout in activity definition

# Fix and replay
weaver replay <workflow-id> --from-step 3
```

### Issue 4: Obsidian API Timeout

**Symptoms**:
```bash
Error: Request timeout after 30000ms (Obsidian API)
```

**Solution**:
```typescript
// Increase timeout in activity definition
export const createNote = defineActivity({
  name: 'createNote',
  async execute({ path, content }) {
    // ...
  },
  timeout: '60s' // Increased from 30s
});

// Or in workflow
export default defineWorkflow({
  name: 'myWorkflow',
  async execute() {
    // ...
  },
  timeout: '10m' // Increased overall timeout
});
```

### Issue 5: Duplicate Workflow Executions

**Symptoms**:
```bash
weaver history clientOnboarding --since 1h
# Output: 3 executions for same input (should be 1)
```

**Solution**:
```bash
# Check for duplicate event subscriptions
weaver configure events.queues --list

# Ensure only one subscription per routing key
# In weaver.config.ts:
events: {
  queues: [
    {
      name: 'weaver.workflows',
      routingKeys: ['project.created'] // No duplicates
    }
  ]
}

# Restart Weaver
weaver restart
```

### Issue 6: TypeScript Compilation Errors

**Symptoms**:
```bash
weaver dev
# Output: Error: TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Solution**:
```bash
# Run TypeScript type checker
npm run typecheck

# Fix type errors in workflow/activity files
# Common issues:
# - Missing type annotations
# - Incorrect parameter types
# - Missing required properties

# Verify fix
weaver dev
# Expected: ✓ Weaver development server started
```

---

## FAQ

### Q: Can I run Weaver and n8n in parallel permanently?

**A**: Yes, but not recommended. Parallel operation is intended for migration validation only (1-2 weeks). Long-term parallel operation increases:
- Infrastructure costs (2x)
- Maintenance burden
- Risk of duplicate actions

**Recommendation**: Complete migration and decommission n8n after validation period.

---

### Q: What happens if Weaver crashes mid-workflow?

**A**: Weaver automatically resumes from last checkpoint when restarted. Workflow state is persisted in SQLite (local) or PostgreSQL (production).

**Example**:
```
Workflow: clientOnboarding
- Step 1: createProjectFolder ✓ (checkpointed)
- Step 2: copyTemplates ✓ (checkpointed)
- Step 3: initGitRepo ✓ (checkpointed)
- Step 4: createGithubRepo [CRASH HERE]

After restart:
- Step 4: createGithubRepo (resumed from checkpoint) ✓
- Step 5: notifySlack ✓
```

---

### Q: How do I migrate workflows with complex conditional logic (IF/ELSE)?

**A**: Use native TypeScript control flow.

**n8n IF Node**:
```json
{
  "name": "IF",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "string": [{"value1": "={{$json.type}}", "operation": "equal", "value2": "web"}]
    }
  }
}
```

**Weaver (TypeScript)**:
```typescript
async execute({ projectType }) {
  if (projectType === 'web') {
    await setupWebProject();
  } else if (projectType === 'mobile') {
    await setupMobileProject();
  } else {
    throw new Error(`Unknown project type: ${projectType}`);
  }
}
```

---

### Q: Can I use Weaver with existing Python scripts?

**A**: Yes, call Python scripts from Weaver activities using `child_process.exec`.

**Example**:
```typescript
import { defineActivity } from '@workflowdev/core';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const runPythonScript = defineActivity({
  name: 'runPythonScript',
  async execute({ scriptPath, args }: {
    scriptPath: string;
    args: string[];
  }) {
    const { stdout, stderr } = await execAsync(
      `python ${scriptPath} ${args.join(' ')}`
    );

    if (stderr) {
      throw new Error(`Python script error: ${stderr}`);
    }

    return JSON.parse(stdout);
  }
});
```

---

### Q: How do I debug a workflow that fails intermittently?

**A**: Use time-travel debugging to inspect all executions.

**Steps**:
```bash
# 1. List all executions (including failed)
weaver history myWorkflow --status ALL

# 2. Compare successful vs failed executions
weaver history myWorkflow --id <success-id>
weaver history myWorkflow --id <failed-id>

# 3. Identify differences in:
# - Input data
# - Execution timing
# - External API responses

# 4. View detailed logs
weaver logs <failed-id> --verbose

# 5. Replay with breakpoints
weaver debug <failed-id> --break-at <step-name>
```

---

### Q: What is the cost of running Weaver vs n8n?

| Factor | n8n | Weaver | Savings |
|--------|-----|--------|---------|
| Infrastructure | $50/month (Docker VM) | $50/month (shared VM) | $0 |
| Workflow Tool | Free (self-hosted) | Free (open source) | $0 |
| Developer Time | 10 hrs/month debugging | 1 hr/month monitoring | $450/month |
| **Total** | **$610/month** | **$110/month** | **$500/month (82%)** |

**Key**: Savings come from reduced debugging time (time-travel debugging) and automatic retry logic.

---

### Q: Can I visualize Weaver workflows like n8n's visual editor?

**A**: Not currently. Weaver is code-first. However, you can:
1. Generate workflow diagrams from code using tools like Mermaid
2. Use `weaver history` to visualize execution flow
3. Build custom UI on top of Weaver API (future enhancement)

**Workaround**: Keep n8n for visualization, export to JSON, convert to Weaver TypeScript.

---

### Q: How do I handle secrets (API keys) in Weaver workflows?

**A**: Use environment variables, never hardcode secrets.

**Best Practice**:
```typescript
// ❌ WRONG: Hardcoded secret
const client = new GitHub({ auth: 'ghp_hardcoded_token' });

// ✅ CORRECT: Environment variable
const client = new GitHub({ auth: process.env.GITHUB_TOKEN });
```

**Setup**:
```bash
# .env file (gitignored)
GITHUB_TOKEN=ghp_your_token
ANTHROPIC_API_KEY=sk-ant_your_key

# Load in weaver.config.ts
import dotenv from 'dotenv';
dotenv.config();
```

---

## Next Steps

### After Successful Migration

1. **Monitor for 30 days**: Track workflow reliability, performance, and team satisfaction
2. **Create new workflows**: Build additional workflows using Weaver (backlog automation)
3. **Optimize performance**: Profile slow workflows, add caching, parallelize activities
4. **Expand coverage**: Migrate remaining bash scripts and one-off automation
5. **Document patterns**: Create internal workflow library with common patterns
6. **Train team**: Advanced Weaver features (custom activities, complex retry logic)

### Rollback to n8n/Bash (If Needed)

If migration fails, follow rollback procedure in [Step 5.3](#step-53-rollback-procedure-if-needed).

**Common reasons for rollback**:
- Critical workflow failures (>50% failure rate)
- Team cannot adapt to code-first approach (training issue)
- Performance degradation vs n8n (unlikely)
- Blocking bugs in Weaver (report to workflow.dev)

---

## Resources

### Documentation
- [Weaver Documentation](https://docs.workflow.dev/)
- [Weaver API Reference](https://docs.workflow.dev/api)
- [Migration Examples](https://github.com/workflowdev/examples/tree/main/migrations)

### Support
- [Weaver Discord](https://discord.gg/workflowdev)
- [GitHub Issues](https://github.com/workflowdev/weaver/issues)
- Internal: Weave-NN team Slack #automation channel

### Training
- [Weaver Tutorial](https://docs.workflow.dev/tutorials/first-workflow) (30 minutes)
- [Advanced Workflows](https://docs.workflow.dev/advanced) (2 hours)
- Internal: Weaver workshop recording (recorded during Day 8)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-23
**Status**: Draft (Ready for Migration)
**Feedback**: Submit issues to Weave-NN repository
