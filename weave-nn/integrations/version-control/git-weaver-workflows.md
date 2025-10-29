---
title: Git ↔ Weaver Workflows Integration
type: workflow
status: active
tags:
  - type/documentation
  - status/in-progress
domain: weaver
priority: medium
visual:
  icon: "\U0001F504"
  color: '#8E8E93'
  cssclasses:
    - type-workflow
    - status-active
    - domain-weaver
updated: '2025-10-29T04:55:05.894Z'
version: '3.0'
keywords:
  - overview
  - systems involved
  - git repository
  - weaver workflows
  - integration architecture
  - data flow
  - components
  - configuration
  - environment variables
  - git repository setup
---

# Git ↔ Weaver Workflows Integration

## Overview

This integration automatically commits knowledge graph changes to Git using durable workflows triggered by file watcher events. Workflows handle debouncing, commit message generation, and error recovery.

**Key Benefit**: Automatic version control without manual intervention. Every knowledge graph change is versioned, with intelligent commit messages and automatic conflict resolution.

## Systems Involved

### Git Repository
- **Role**: Version control
- **Technology**: Git v2.30+
- **Location**: Obsidian vault root (`.git` directory)
- **Operations**: stage, commit, push (optional)

### Weaver Workflows
- **Role**: Orchestrator (stateful Git operations)
- **Technology**: workflow.dev + simple-git
- **Triggers**: File watcher events (debounced)
- **State**: Persisted workflow execution state

## Integration Architecture

### Data Flow

```
[File Watcher] → [File Change Event]
                        ↓
              [Debounce Queue (5s)]
                        ↓
            [Trigger Git Commit Workflow]
                        ↓
        ┌───────────────┴───────────────┐
        │                                 │
[Step 1: Stage Changes]      [Step 2: Generate Commit Message]
        │                                 │
        ↓                                 ↓
[Step 3: Create Commit]       [Step 4: Push to Remote (optional)]
        │                                 │
        └───────────────┬─────────────────┘
                        ↓
                [Workflow Complete]
```

### Components

#### 1. Git Client Wrapper
**File**: `weaver/src/clients/git.ts`

```typescript
import simpleGit, { SimpleGit, StatusResult } from 'simple-git';
import path from 'path';
import { logger } from '../utils/logger.js';

export interface GitConfig {
  repoPath: string;
  authorName: string;
  authorEmail: string;
  remoteName?: string;
  remoteBranch?: string;
}

export class GitClient {
  private git: SimpleGit;

  constructor(private config: GitConfig) {
    this.git = simpleGit(config.repoPath);

    // Configure author
    this.git.addConfig('user.name', config.authorName);
    this.git.addConfig('user.email', config.authorEmail);
  }

  async getStatus(): Promise<StatusResult> {
    return await this.git.status();
  }

  async stageFiles(patterns: string[] = ['.']): Promise<void> {
    logger.info('Staging files', { patterns });
    await this.git.add(patterns);
  }

  async stageMarkdownFiles(): Promise<void> {
    logger.info('Staging markdown files');
    await this.git.add('*.md');
    await this.git.add('**/*.md');
  }

  async commit(message: string): Promise<string> {
    logger.info('Creating commit', { message });

    const result = await this.git.commit(message);

    logger.info('Commit created', {
      sha: result.commit,
      summary: result.summary,
    });

    return result.commit;
  }

  async push(remote?: string, branch?: string): Promise<void> {
    const remoteName = remote || this.config.remoteName || 'origin';
    const remoteBranch = branch || this.config.remoteBranch || 'main';

    logger.info('Pushing to remote', { remote: remoteName, branch: remoteBranch });

    await this.git.push(remoteName, remoteBranch);

    logger.info('Push complete');
  }

  async hasChanges(): Promise<boolean> {
    const status = await this.getStatus();
    return (
      status.modified.length > 0 ||
      status.created.length > 0 ||
      status.deleted.length > 0
    );
  }

  async getChangedFiles(): Promise<{
    modified: string[];
    created: string[];
    deleted: string[];
  }> {
    const status = await this.getStatus();
    return {
      modified: status.modified,
      created: status.created,
      deleted: status.deleted,
    };
  }

  async getLastCommit(): Promise<{
    sha: string;
    message: string;
    date: Date;
  }> {
    const log = await this.git.log({ maxCount: 1 });
    const latest = log.latest;

    if (!latest) {
      throw new Error('No commits in repository');
    }

    return {
      sha: latest.hash,
      message: latest.message,
      date: new Date(latest.date),
    };
  }

  generateCommitMessage(changes: {
    modified: string[];
    created: string[];
    deleted: string[];
  }): string {
    const totalChanges = changes.modified.length + changes.created.length + changes.deleted.length;

    if (totalChanges === 1) {
      // Single file changed
      const file = changes.modified[0] || changes.created[0] || changes.deleted[0];
      const basename = path.basename(file, '.md');
      const action = changes.created.length ? 'Create' : changes.deleted.length ? 'Delete' : 'Update';
      return `${action} ${basename}`;
    }

    // Multiple files changed
    const parts: string[] = [];

    if (changes.created.length > 0) {
      parts.push(`${changes.created.length} created`);
    }

    if (changes.modified.length > 0) {
      parts.push(`${changes.modified.length} updated`);
    }

    if (changes.deleted.length > 0) {
      parts.push(`${changes.deleted.length} deleted`);
    }

    return `Update knowledge graph: ${parts.join(', ')}`;
  }
}
```

#### 2. Git Auto-Commit Workflow
**File**: `weaver/src/workflows/git-auto-commit.ts`

```typescript
import { workflow } from '@workflowdev/sdk';
import { gitClient } from '../clients/git.js';
import { logger } from '../utils/logger.js';

export const gitAutoCommitWorkflow = workflow(
  'git-auto-commit',
  async (ctx, input: { trigger: string; timestamp: number }) => {
    logger.info('Git auto-commit workflow started', { trigger: input.trigger });

    // Step 1: Check for changes
    const hasChanges = await ctx.step('check-changes', async () => {
      return await gitClient.hasChanges();
    });

    if (!hasChanges) {
      logger.info('No changes to commit');
      return { committed: false, reason: 'no-changes' };
    }

    // Step 2: Get changed files
    const changes = await ctx.step('get-changed-files', async () => {
      return await gitClient.getChangedFiles();
    });

    logger.info('Changes detected', {
      modified: changes.modified.length,
      created: changes.created.length,
      deleted: changes.deleted.length,
    });

    // Step 3: Stage markdown files only
    await ctx.step('stage-files', async () => {
      await gitClient.stageMarkdownFiles();
    });

    // Step 4: Generate commit message
    const commitMessage = await ctx.step('generate-commit-message', async () => {
      const message = gitClient.generateCommitMessage(changes);

      // Add timestamp footer
      const timestamp = new Date(input.timestamp).toISOString();
      return `${message}\n\nAuto-commit via Weaver\nTimestamp: ${timestamp}`;
    });

    logger.info('Generated commit message', { message: commitMessage });

    // Step 5: Create commit
    const commitSha = await ctx.step('create-commit', async () => {
      return await gitClient.commit(commitMessage);
    }, {
      retries: 3,
      backoff: 'exponential',
    });

    logger.info('Commit created', { sha: commitSha });

    // Step 6: Push to remote (optional, configurable)
    if (process.env.GIT_AUTO_PUSH === 'true') {
      await ctx.step('push-to-remote', async () => {
        await gitClient.push();
      }, {
        retries: 3,
        backoff: 'exponential',
        timeout: '30s',
      });

      logger.info('Pushed to remote');
    }

    return {
      committed: true,
      sha: commitSha,
      message: commitMessage,
      filesChanged: changes.modified.length + changes.created.length + changes.deleted.length,
    };
  }
);
```

#### 3. Debounce Queue
**File**: `weaver/src/workflows/git-commit-queue.ts`

```typescript
import { workflow } from '@workflowdev/sdk';
import { triggerWorkflow } from './index.js';
import { logger } from '../utils/logger.js';

interface QueuedCommit {
  filePath: string;
  timestamp: number;
}

export const gitCommitQueueWorkflow = workflow(
  'git-commit-queue',
  async (ctx, input: QueuedCommit) => {
    logger.info('Commit queued', { filePath: input.filePath });

    // Wait 5 seconds for more changes
    await ctx.sleep('5s');

    // After 5 seconds of inactivity, trigger actual commit
    await ctx.step('trigger-commit', async () => {
      await triggerWorkflow('git-auto-commit', {
        trigger: 'debounce-timeout',
        timestamp: input.timestamp,
      });
    });

    return { queued: true, filePath: input.filePath };
  }
);
```

#### 4. Integration with File Watcher
**File**: `weaver/src/workflows/vault-file-updated.ts` (excerpt)

```typescript
export const vaultFileUpdatedWorkflow = workflow(
  'vault-file-updated',
  async (ctx, input: { filePath: string; absolutePath: string; timestamp: number }) => {
    // ... other steps (update shadow cache, etc.)

    // Last step: Queue for git commit (debounced)
    await ctx.step('queue-git-commit', async () => {
      await ctx.sendEvent('git-commit-queue', {
        filePath: input.filePath,
        timestamp: input.timestamp,
      });
    });

    return { success: true };
  }
);
```

## Configuration

### Environment Variables

```bash
# Git Configuration
GIT_AUTHOR_NAME="Weaver Auto-Commit"
GIT_AUTHOR_EMAIL="weaver@local"
GIT_REMOTE_NAME=origin
GIT_REMOTE_BRANCH=main
GIT_AUTO_PUSH=false  # Set to 'true' to auto-push commits

# Debounce Configuration
GIT_COMMIT_DEBOUNCE_MS=5000  # 5 seconds
```

### Git Repository Setup

```bash
# Initialize Git in vault (if not already)
cd /path/to/vault
git init
git remote add origin <remote-url>

# Create .gitignore
cat > .gitignore <<EOF
.obsidian/workspace*.json
.obsidian/cache
.trash/
EOF

# Initial commit
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Event Formats

### Git Commit Queue Event

```typescript
{
  filePath: "concepts/durable-workflows.md",
  timestamp: 1698765432000
}
```

### Git Auto-Commit Result

```typescript
{
  committed: true,
  sha: "abc123def456...",
  message: "Update durable-workflows\n\nAuto-commit via Weaver\nTimestamp: 2025-10-23T14:30:00.000Z",
  filesChanged: 1
}
```

## Error Handling

### Git Conflicts

**Scenario**: Remote has changes not pulled locally

```typescript
await ctx.step('push-to-remote', async () => {
  try {
    await gitClient.push();
  } catch (error) {
    if (error.message.includes('non-fast-forward')) {
      logger.warn('Push rejected, pulling first');

      // Pull with rebase
      await gitClient.pull({ rebase: true });

      // Retry push
      await gitClient.push();
    } else {
      throw error;
    }
  }
});
```

### Nothing to Commit

**Scenario**: Debounce fires but no changes staged

```typescript
const hasChanges = await ctx.step('check-changes', async () => {
  return await gitClient.hasChanges();
});

if (!hasChanges) {
  logger.info('No changes to commit, skipping');
  return { committed: false, reason: 'no-changes' };
}
```

### Commit Fails

**Automatic retry with exponential backoff**:

```typescript
const commitSha = await ctx.step('create-commit', async () => {
  return await gitClient.commit(commitMessage);
}, {
  retries: 3,
  backoff: 'exponential', // 1s, 2s, 4s
});
```

## Monitoring and Observability

### Metrics

- **Commit frequency**: Commits/hour
- **Debounce efficiency**: Commits saved by debouncing
- **Push success rate**: Successful pushes/total pushes
- **Commit size**: Files changed per commit (avg, p50, p95)
- **Workflow duration**: Time from trigger to commit completion

### Commit History Analysis

```bash
# View auto-commit stats
git log --author="Weaver Auto-Commit" --oneline --since="1 week ago"

# Count commits per day
git log --author="Weaver Auto-Commit" --format="%ad" --date=short | uniq -c

# Average files per commit
git log --author="Weaver Auto-Commit" --numstat --format="%H" | awk 'NF==3 {files++} NF==1 {commits++} END {print files/commits}'
```

## Testing

### Integration Tests

**File**: `weaver/tests/integration/git-auto-commit.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { gitClient } from '../../src/clients/git.js';
import { triggerWorkflow } from '../../src/workflows/index.js';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

describe('Git Auto-Commit Integration', () => {
  const testVaultPath = path.join(__dirname, 'test-vault');

  beforeEach(async () => {
    // Clean up any uncommitted changes
    await gitClient.reset();
  });

  it('should auto-commit single file change', async () => {
    const testFile = path.join(testVaultPath, 'test-commit.md');

    // Create file
    await writeFile(testFile, '# Test Commit\n\nContent');

    // Trigger workflow
    await triggerWorkflow('git-auto-commit', {
      trigger: 'test',
      timestamp: Date.now(),
    });

    // Wait for workflow completion
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify commit created
    const lastCommit = await gitClient.getLastCommit();
    expect(lastCommit.message).toContain('Create test-commit');
    expect(lastCommit.message).toContain('Weaver');

    // Cleanup
    await unlink(testFile);
  });

  it('should debounce multiple rapid changes', async () => {
    const testFile1 = path.join(testVaultPath, 'test-1.md');
    const testFile2 = path.join(testVaultPath, 'test-2.md');

    // Create files rapidly
    await writeFile(testFile1, '# Test 1');
    await writeFile(testFile2, '# Test 2');

    // Wait for debounce + workflow
    await new Promise(resolve => setTimeout(resolve, 7000));

    // Verify only one commit created
    const log = await gitClient.git.log({ maxCount: 2 });
    const autoCommits = log.all.filter(commit =>
      commit.message.includes('Weaver')
    );

    expect(autoCommits.length).toBe(1);
    expect(autoCommits[0].message).toContain('2 created');

    // Cleanup
    await unlink(testFile1);
    await unlink(testFile2);
  });

  it('should handle push failures gracefully', async () => {
    // Disable network to simulate push failure
    process.env.GIT_AUTO_PUSH = 'true';

    const testFile = path.join(testVaultPath, 'test-push-fail.md');
    await writeFile(testFile, '# Test');

    // Trigger workflow
    const executionId = await triggerWorkflow('git-auto-commit', {
      trigger: 'test',
      timestamp: Date.now(),
    });

    // Wait for workflow
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check workflow status
    const status = await getWorkflowStatus(executionId);

    // Should have retried push step
    const pushSteps = status.steps.filter(s => s.name === 'push-to-remote');
    expect(pushSteps.length).toBeGreaterThan(1); // Retries occurred

    // Cleanup
    process.env.GIT_AUTO_PUSH = 'false';
    await unlink(testFile);
  });
});
```

### Manual Testing

```bash
# 1. Start Weaver
npm run dev

# 2. Watch Git logs
watch -n 1 "git log --oneline -5"

# 3. Edit note in Obsidian
# Create or modify a note

# 4. Wait 5 seconds (debounce)

# 5. Verify commit appears
git log -1 --stat

# Should show:
# Update <filename>
#
# Auto-commit via Weaver
# Timestamp: 2025-10-23T14:30:00.000Z
#
# <filename>.md | 10 +++++++---
# 1 file changed, 7 insertions(+), 3 deletions(-)
```

## Deployment

### Prerequisites

1. **Git Repository** - Initialized in vault directory
2. **Remote Configured** - Optional (for push functionality)
3. **Weaver Running** - With file watcher enabled

### Deployment Steps

```bash
# 1. Configure Git
git config user.name "Weaver Auto-Commit"
git config user.email "weaver@local"

# 2. Configure environment
cat >> .env <<EOF
GIT_AUTHOR_NAME="Weaver Auto-Commit"
GIT_AUTHOR_EMAIL="weaver@local"
GIT_REMOTE_NAME=origin
GIT_REMOTE_BRANCH=main
GIT_AUTO_PUSH=false
EOF

# 3. Start Weaver
npm start

# 4. Verify auto-commit enabled
tail -f logs/weaver.log | grep "git-auto-commit"
```

## Troubleshooting

### Issue: "Commits not being created"

**Cause**: Debounce not timing out or workflow not triggering

**Solution**:
```bash
# Check workflow queue
npm run workflow:list

# Check if events are reaching queue
tail -f logs/weaver.log | grep "git-commit-queue"

# Manually trigger commit
npm run workflow:trigger git-auto-commit
```

### Issue: "Push fails with 'non-fast-forward'"

**Cause**: Remote has commits not in local

**Solution**: Workflow automatically handles this by pulling with rebase. If persistent:
```bash
# Manual intervention
cd /path/to/vault
git pull --rebase origin main
git push origin main
```

### Issue: "Too many small commits"

**Cause**: Debounce timeout too short

**Solution**:
```bash
# Increase debounce in .env
GIT_COMMIT_DEBOUNCE_MS=10000  # 10 seconds
```

## Related Documentation

- [[integrations/workflow-automation/file-watcher-workflows|File Watcher → Workflows]]
- [[technical/simple-git|Simple Git Library]]
- [[concepts/durable-workflows|Durable Workflows Concept]]
- [[docs/local-first-architecture-overview|Local-First Architecture]]

## Maintenance

### Version Compatibility

- **simple-git**: v3.19.0+
- **Git**: v2.30.0+
- **@workflowdev/sdk**: v1.0.0+

### Update Schedule

- **Dependency updates**: Monthly
- **Commit message review**: Quarterly (adjust format if needed)
- **Performance optimization**: Bi-annual

---

**Status**: ✅ **Active** - Core MVP integration
**Last Updated**: 2025-10-23
**Maintainer**: Weave-NN Team
