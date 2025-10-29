---
title: simple-git - Git Operations
type: documentation
status: draft
tags:
  - type/documentation
  - status/draft
priority: medium
visual:
  icon: "\U0001F4C4"
  color: '#8E8E93'
  cssclasses:
    - document
updated: '2025-10-29T04:55:06.389Z'
keywords:
  - overview
  - why simple-git
  - installation
  - mvp usage
  - basic git workflow
  - check status
  - push to remote
  - integration with workflows
  - daily logs auto-commit
  - common operations
---
# simple-git - Git Operations

**Category**: Technical / Git Client
**Status**: MVP Dependency
**Package**: `simple-git`
**Docs**: https://github.com/steveukx/git-js

---

## Overview

simple-git is the Node.js library for Git operations in Weaver workflows, replacing the need for GitPython.

## Why simple-git

**TypeScript Native**:
- Pure JavaScript (no native bindings)
- Type definitions included
- Async/await support

**Sufficient for MVP**:
- Basic operations: add, commit, push, status
- Branch management
- Tag operations
- Remote operations

**Replaces GitPython**:
- No Python dependency
- Same TypeScript codebase
- Better integration with Weaver workflows

## Installation

```bash
npm install simple-git
```

## MVP Usage

### Basic Git Workflow

```typescript
// src/clients/git.ts
import simpleGit from 'simple-git';

export async function createGitCommit(files: string[], message: string) {
  const git = simpleGit();

  // Add files
  await git.add(files);

  // Commit with message
  const result = await git.commit(message);

  console.log(`Committed: ${result.commit}`);

  return result;
}
```

### Check Status

```typescript
export async function getGitStatus() {
  const git = simpleGit();

  const status = await git.status();

  return {
    modified: status.modified,
    created: status.created,
    deleted: status.deleted,
    staged: status.staged,
    conflicted: status.conflicted,
    current: status.current,  // Current branch
    tracking: status.tracking  // Remote tracking branch
  };
}
```

### Push to Remote

```typescript
export async function pushToRemote(branch: string = 'master') {
  const git = simpleGit();

  await git.push('origin', branch);

  console.log(`Pushed to origin/${branch}`);
}
```

### Integration with Workflows

```typescript
// src/workflows/git-commit.ts
import { workflow } from 'workflow-dev';
import { createGitCommit, pushToRemote } from '../clients/git';

export const gitCommitWorkflow = workflow('git-commit', async (ctx, input) => {
  const { files, message, push = false } = input;

  // Step 1: Commit files
  const commit = await ctx.step('commit', async () => {
    return await createGitCommit(files, message);
  });

  // Step 2: Push if requested
  if (push) {
    await ctx.step('push', async () => {
      return await pushToRemote();
    });
  }

  return commit;
});
```

### Daily Logs Auto-Commit

```typescript
// src/workflows/daily-log-commit.ts
export const dailyLogCommitWorkflow = workflow('daily-log-commit', async (ctx, input) => {
  const { logPath, date } = input;

  await ctx.step('commit-log', async () => {
    await createGitCommit(
      [logPath],
      `📝 Daily log: ${date}\n\n🤖 Generated with Claude Code`
    );
  });
});
```

## Common Operations

### Branch Management

```typescript
// Create and switch to branch
await git.checkoutLocalBranch('feature/new-feature');

// List branches
const branches = await git.branchLocal();

// Delete branch
await git.deleteLocalBranch('old-feature');
```

### Tag Management

```typescript
// Create tag
await git.addTag('v1.0.0');

// List tags
const tags = await git.tags();

// Push tags
await git.pushTags('origin');
```

### Diff Operations

```typescript
// Get diff
const diff = await git.diff(['--staged']);

// Get diff for specific file
const fileDiff = await git.diff(['HEAD', 'path/to/file.md']);
```

### Log Operations

```typescript
// Get recent commits
const log = await git.log({ maxCount: 10 });

log.all.forEach(commit => {
  console.log(`${commit.hash.substring(0, 7)} - ${commit.message}`);
});
```

## Error Handling

```typescript
export async function safeGitCommit(files: string[], message: string) {
  const git = simpleGit();

  try {
    // Check if git repo
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      throw new Error('Not a git repository');
    }

    // Check if files exist
    const status = await git.status();
    const validFiles = files.filter(f =>
      status.modified.includes(f) ||
      status.created.includes(f) ||
      status.deleted.includes(f)
    );

    if (validFiles.length === 0) {
      throw new Error('No changes to commit');
    }

    // Commit
    await git.add(validFiles);
    const result = await git.commit(message);

    return { success: true, commit: result.commit };

  } catch (error) {
    console.error(`Git error: ${error.message}`);
    return { success: false, error: error.message };
  }
}
```

## Configuration

```typescript
// Initialize with options
const git = simpleGit({
  baseDir: '/path/to/repo',
  binary: 'git',
  maxConcurrentProcesses: 6,
  trimmed: false
});

// Set config
await git.addConfig('user.name', 'Weaver');
await git.addConfig('user.email', 'weaver@weave-nn.local');
```

## Comparison with GitPython

| Feature | GitPython | simple-git |
|---------|-----------|------------|
| **Language** | Python | TypeScript |
| **Integration** | Separate process | In-process |
| **Types** | Manual typing | Built-in types |
| **Async** | Sync by default | Async/await native |
| **Memory** | ~20MB | ~5MB |
| **Complexity** | Full Git API | Simplified API |

## Performance

- **Command Execution**: ~10-50ms per operation
- **Memory**: ~5MB
- **Concurrent Operations**: 6 by default (configurable)

## Testing

```typescript
// tests/clients/git.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import simpleGit from 'simple-git';
import { createGitCommit } from '../../src/clients/git';

describe('Git Client', () => {
  beforeEach(async () => {
    // Setup test repo
    const git = simpleGit('./test-repo');
    await git.init();
  });

  it('creates commit', async () => {
    // Create test file
    await fs.writeFile('./test-repo/test.md', 'test content');

    // Commit
    const result = await createGitCommit(['test.md'], 'Test commit');

    expect(result.commit).toBeDefined();
  });
});
```

## Related

- [[technical/weaver|Weaver Unified Service]]
- [[technical/workflow-dev|Workflow.dev (Git Workflows)]]
- [[.archive/technical/future-features/gitpython|GitPython (archived)]]
