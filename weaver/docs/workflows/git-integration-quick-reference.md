# Git Integration Layer - Quick Reference

## Import

```typescript
import { GitIntegration } from './workflows/kg/git';
```

## Initialization

```typescript
const git = new GitIntegration(vaultRoot);
```

## Branch Management

### Create Workflow Branch
```typescript
const branchName = await git.branches.createWorkflowBranch('workflow-name');
// Returns: "workflow/workflow-name-1761668675024"
```

### Create from Custom Base
```typescript
const branchName = await git.branches.createWorkflowBranch('workflow-name', 'feature-branch');
```

### Check Branch Exists
```typescript
const exists = await git.branches.branchExists('workflow/name-123');
```

### Checkout Branch
```typescript
await git.branches.checkout('workflow/name-123');
```

### Get Current Branch
```typescript
const current = await git.branches.getCurrentBranch();
```

### Delete Branch
```typescript
// Normal delete (fails if not merged)
await git.branches.deleteWorkflowBranch(branchName);

// Force delete (always succeeds)
await git.branches.deleteWorkflowBranch(branchName, true);
```

## Commit Operations

### Atomic Commit with Metadata
```typescript
const commitHash = await git.commit.commit({
  message: 'Descriptive commit message',
  files: ['path/to/file1.md', 'path/to/file2.md'],
  workflowId: 'unique-workflow-id',
  metadata: {
    step: 'entity-extraction',
    count: 15,
    custom: 'data'
  }
});
```

### Commit without Metadata
```typescript
const commitHash = await git.commit.commit({
  message: 'Simple commit',
  files: ['file.md'],
  workflowId: 'workflow-123'
});
```

### Check for Changes
```typescript
const hasChanges = await git.commit.hasChanges();
// Returns: true if uncommitted changes exist
```

### Get Modified Files
```typescript
const files = await git.commit.getModifiedFiles();
// Returns: ['file1.md', 'file2.md', ...]
```

## Rollback Operations

### Revert Last Commit
```typescript
// Creates a revert commit (preserves history)
await git.rollback.rollbackLastCommit();
```

### Discard All Changes
```typescript
// Discards all uncommitted changes (tracked + untracked)
await git.rollback.discardChanges();
```

### Generate Rollback Command
```typescript
const command = git.rollback.generateRollbackCommand(branchName);
// Returns: "git checkout master && git branch -D workflow/name-123"
```

## Complete Workflow Pattern

```typescript
const git = new GitIntegration(vaultRoot);
const workflowId = `extract-${Date.now()}`;

// 1. Create branch
const branchName = await git.branches.createWorkflowBranch('extract-entities');

try {
  // 2. Do workflow work
  // ... create/modify files ...

  // 3. Commit changes
  await git.commit.commit({
    message: 'Extract entities from docs',
    files: ['entities/User.md', 'entities/Product.md'],
    workflowId,
    metadata: { entitiesFound: 2 }
  });

  // 4. Success!
  console.log('Workflow completed');

} catch (error) {
  // 5. Rollback on error
  await git.rollback.discardChanges();
  console.error('Workflow failed, changes rolled back');

  // Provide rollback command to user
  const rollbackCmd = git.rollback.generateRollbackCommand(branchName);
  console.log('Manual rollback:', rollbackCmd);

  throw error;

} finally {
  // 6. Optional: Delete branch when done
  // await git.branches.deleteWorkflowBranch(branchName, true);
}
```

## Checkpoint Pattern

```typescript
const git = new GitIntegration(vaultRoot);
const workflowId = `process-${Date.now()}`;
const branch = await git.branches.createWorkflowBranch('multi-step');

// Checkpoint 1
await git.commit.commit({
  message: 'Checkpoint 1: Initial extraction',
  files: ['data/phase1.md'],
  workflowId,
  metadata: { checkpoint: 1 }
});

// Checkpoint 2
await git.commit.commit({
  message: 'Checkpoint 2: Processing',
  files: ['data/phase2.md'],
  workflowId,
  metadata: { checkpoint: 2 }
});

// If checkpoint 2 fails, rollback to checkpoint 1
// await git.rollback.rollbackLastCommit();
```

## Error Handling Pattern

```typescript
async function safeWorkflow(vaultRoot: string) {
  const git = new GitIntegration(vaultRoot);
  let branchName: string | null = null;

  try {
    // Create branch
    branchName = await git.branches.createWorkflowBranch('safe-workflow');

    // Do work with automatic cleanup
    // ... workflow operations ...

  } catch (error) {
    // Discard any uncommitted changes
    const hasChanges = await git.commit.hasChanges();
    if (hasChanges) {
      await git.rollback.discardChanges();
    }

    throw error;

  } finally {
    // Always cleanup branch
    if (branchName && await git.branches.branchExists(branchName)) {
      await git.branches.deleteWorkflowBranch(branchName, true);
    }
  }
}
```

## Types

### CommitOptions
```typescript
interface CommitOptions {
  message: string;              // Commit message
  files: string[];              // Files to commit
  workflowId: string;           // Workflow identifier
  metadata?: Record<string, unknown>;  // Optional metadata
}
```

## Common Patterns

### Check Before Delete
```typescript
const exists = await git.branches.branchExists(branchName);
if (exists) {
  await git.branches.deleteWorkflowBranch(branchName, true);
}
```

### Conditional Commit
```typescript
const hasChanges = await git.commit.hasChanges();
if (hasChanges) {
  const files = await git.commit.getModifiedFiles();
  await git.commit.commit({
    message: 'Save changes',
    files,
    workflowId: 'auto-save'
  });
}
```

### Safe Branch Switch
```typescript
// Discard changes before switching
await git.rollback.discardChanges();
await git.branches.checkout('master');
```

## Best Practices

1. **Always use try-catch**: Wrap workflow operations in try-catch
2. **Force delete branches**: Use `force: true` for workflow branches with commits
3. **Unique workflow IDs**: Use timestamps or UUIDs for workflow IDs
4. **Descriptive messages**: Write clear commit messages
5. **Metadata tracking**: Include relevant metadata for audit trails
6. **Cleanup branches**: Delete workflow branches when done
7. **Check for changes**: Use `hasChanges()` before committing

## File Locations

- Implementation: `/weaver/src/workflows/kg/git/`
- Tests: `/weaver/tests/unit/workflows/kg/git.test.ts`
- Documentation: `/weaver/docs/workflows/git-integration-*.md`

## Related Documentation

- [Implementation Guide](./git-integration-implementation.md)
- [Example Code](./git-integration-example.ts)
- [Phase 14 Specification](/weave-nn/_planning/phases/phase-14-knowledge-graph-workflows.md)
