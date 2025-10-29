# CLI Workflow Guide

Complete guide to using Weaver's CLI workflow commands for managing and executing knowledge graph workflows.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Commands](#commands)
  - [workflow run](#workflow-run)
  - [workflow list](#workflow-list)
  - [workflow status](#workflow-status)
  - [workflow test](#workflow-test)
  - [cultivate](#cultivate)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Weaver's workflow commands provide a powerful CLI interface for managing knowledge graph operations. These commands enable you to:

- Execute workflows on specific files or directories
- List and inspect registered workflows
- Monitor workflow execution status
- Test workflows without making changes
- Systematically improve graph connectivity

## Installation

Ensure you have Weaver installed and configured:

```bash
npm install -g @weave-nn/weaver
# or
yarn global add @weave-nn/weaver
```

## Commands

### workflow run

Execute a workflow on a specific file or directory.

**Syntax:**
```bash
weaver workflow run <name> [path] [options]
```

**Arguments:**
- `<name>` - Workflow name to execute (required)
- `[path]` - File or directory path (defaults to current directory)

**Options:**
- `--dry-run` - Preview changes without executing
- `--no-branch` - Skip Git branch creation
- `-v, --verbose` - Verbose output

**Examples:**

```bash
# Execute document-connection workflow on a specific file
weaver workflow run document-connection docs/new-file.md

# Execute on entire directory with dry-run
weaver workflow run hub-maintenance docs/ --dry-run

# Execute without creating Git branch
weaver workflow run orphan-resolution . --no-branch

# Verbose execution
weaver workflow run document-connection docs/api.md -v
```

**Output:**
```
✔ Found workflow: Document Connection
✔ Created branch: workflow/document-connection-1234567890
✔ Context analyzed
  Directory: documentation
  Phase: phase-13
  Domain: api-documentation
✔ Executing workflow...
✔ Workflow completed

✓ Success!
Branch: workflow/document-connection-1234567890
Merge with: git merge workflow/document-connection-1234567890
```

### workflow list

List all registered workflows with their status.

**Syntax:**
```bash
weaver workflow list [options]
```

**Options:**
- `-a, --all` - Show all workflows including disabled
- `-v, --verbose` - Show detailed information

**Examples:**

```bash
# List enabled workflows
weaver workflow list

# List all workflows including disabled
weaver workflow list --all

# List with detailed information
weaver workflow list -v
```

**Output:**
```
📋 Available Workflows

✓ document-connection
  Connect documents using context analysis

✓ hub-maintenance
  Update hub documents automatically

○ orphan-resolution
  Find and connect orphaned documents

Total: 3 workflows (2 enabled)
```

### workflow status

Show currently running and recent workflow executions.

**Syntax:**
```bash
weaver workflow status [options]
```

**Options:**
- `-v, --verbose` - Show detailed execution information
- `-l, --limit <number>` - Number of recent executions to show (default: 10)

**Examples:**

```bash
# Show workflow status
weaver workflow status

# Show detailed status with errors
weaver workflow status -v

# Show last 20 executions
weaver workflow status --limit 20
```

**Output:**
```
⚙️  Workflow Status

Statistics:
  Total workflows: 3 (2 enabled)
  Running: 0
  Completed: 42
  Failed: 3
  Total executions: 45

Recent Executions (last 10):

✓ Document Connection
  Status: completed
  Started: 2 minutes ago
  Duration: 1.45s
  File: docs/api.md

✗ Hub Maintenance
  Status: failed
  Started: 15 minutes ago
  Duration: 3.21s
  Error: Hub file not found
```

### workflow test

Test a workflow without making changes (dry-run mode).

**Syntax:**
```bash
weaver workflow test <name> [path] [options]
```

**Arguments:**
- `<name>` - Workflow name to test (required)
- `[path]` - File or directory path (defaults to current directory)

**Options:**
- `-v, --verbose` - Verbose output

**Examples:**

```bash
# Test workflow on a file
weaver workflow test document-connection docs/new-file.md

# Test with verbose output
weaver workflow test hub-maintenance docs/ -v
```

**Output:**
```
[DRY RUN] No changes will be made

Would execute:
  Workflow: Document Connection
  Target: /home/user/vault/docs/new-file.md
  Branch: workflow/document-connection-1234567890
```

### cultivate

Systematically connect documents to improve knowledge graph structure.

**Syntax:**
```bash
weaver cultivate [path] [options]
```

**Arguments:**
- `[path]` - Directory to cultivate (defaults to current directory)

**Options:**
- `--dry-run` - Preview changes without executing
- `--orphans-only` - Only process orphaned documents (no connections)
- `--max <number>` - Maximum files to process
- `--min-connections <number>` - Minimum connections threshold (default: 2)
- `-v, --verbose` - Verbose output
- `--no-branch` - Skip Git branch creation

**Examples:**

```bash
# Cultivate entire vault (preview)
weaver cultivate --dry-run

# Process only orphaned documents
weaver cultivate --orphans-only

# Limit to 50 files
weaver cultivate --max 50

# Process documents with fewer than 3 connections
weaver cultivate --min-connections 3

# Full cultivation with verbose output
weaver cultivate docs/ -v
```

**Output:**
```
✔ Vault root: /home/user/vault
✔ Found 165 orphaned/poorly connected files

📊 Cultivation Plan

Vault Analysis:
  Total files: 532
  Orphaned files: 165 (31%)
  Poorly connected: 0

Execution Plan:
  Files to process: 165
  Estimated connections: ~495
  Estimated time: 5m 30s

✔ Created branch: workflow/cultivate-1234567890
⚙️  Cultivating knowledge graph...
✔ Cultivation complete

✨ Cultivation Results

Summary:
  Files processed: 165
  Successful: 162
  Failed: 3
  Connections added: ~486

✓ Success!
Branch: workflow/cultivate-1234567890
Merge with: git merge workflow/cultivate-1234567890
```

## Examples

### Example 1: Process New Documentation

```bash
# 1. Add new documentation file
echo "# API Guide" > docs/api-guide.md

# 2. Run document-connection workflow
weaver workflow run document-connection docs/api-guide.md

# 3. Review changes
git diff

# 4. Merge workflow branch
git merge workflow/document-connection-1234567890
```

### Example 2: Fix Orphaned Documents

```bash
# 1. Preview orphaned documents
weaver cultivate --orphans-only --dry-run

# 2. Process with limit
weaver cultivate --orphans-only --max 20 -v

# 3. Review and merge
git diff
git merge workflow/cultivate-1234567890
```

### Example 3: Maintain Hub Documents

```bash
# 1. Test hub maintenance
weaver workflow test hub-maintenance docs/

# 2. Execute workflow
weaver workflow run hub-maintenance docs/

# 3. Check status
weaver workflow status -v

# 4. Merge changes
git merge workflow/hub-maintenance-1234567890
```

### Example 4: Systematic Vault Improvement

```bash
# 1. Analyze vault structure
weaver cultivate --dry-run

# 2. Process in batches
weaver cultivate --max 50
weaver cultivate --max 50
weaver cultivate --max 50

# 3. Review all changes
git log --oneline

# 4. Merge successful batches
git merge workflow/cultivate-1234567890
```

## Best Practices

### 1. Always Use Dry-Run First

```bash
# Preview before executing
weaver workflow run document-connection docs/ --dry-run
weaver cultivate --dry-run
```

### 2. Use Git Branches for Safety

```bash
# Default behavior creates branches
weaver workflow run document-connection docs/

# Review before merging
git diff workflow/document-connection-1234567890

# Merge or discard
git merge workflow/document-connection-1234567890
# or
git branch -D workflow/document-connection-1234567890
```

### 3. Process Large Vaults in Batches

```bash
# Use --max to limit processing
weaver cultivate --max 50
weaver cultivate --max 50 --orphans-only
```

### 4. Monitor Progress with Status

```bash
# Check current executions
weaver workflow status

# Review recent history
weaver workflow status --limit 20 -v
```

### 5. Use Verbose Mode for Debugging

```bash
# Get detailed output
weaver workflow run document-connection docs/ -v
weaver cultivate --orphans-only -v
```

## Troubleshooting

### Workflow Not Found

**Problem:**
```
✗ Workflow not found: document-connection
```

**Solution:**
1. Check available workflows:
   ```bash
   weaver workflow list
   ```
2. Ensure Weaver service is running:
   ```bash
   weaver service status
   ```
3. Verify workflow is registered in configuration

### Git Branch Creation Failed

**Problem:**
```
⚠ Failed to create branch, continuing...
```

**Solution:**
1. Ensure you're in a Git repository:
   ```bash
   git status
   ```
2. Check for uncommitted changes:
   ```bash
   git status
   git commit -am "Save changes"
   ```
3. Use `--no-branch` to skip branch creation:
   ```bash
   weaver workflow run document-connection docs/ --no-branch
   ```

### Context Analysis Failed

**Problem:**
```
✗ Error building document context
```

**Solution:**
1. Verify file exists and is readable:
   ```bash
   cat docs/file.md
   ```
2. Check file permissions:
   ```bash
   ls -la docs/file.md
   ```
3. Use verbose mode to see detailed error:
   ```bash
   weaver workflow run document-connection docs/file.md -v
   ```

### No Files Processed

**Problem:**
```
⚠ No markdown files found in directory
```

**Solution:**
1. Verify directory contains `.md` files:
   ```bash
   find docs/ -name "*.md"
   ```
2. Check directory path is correct:
   ```bash
   ls -la docs/
   ```

### Workflow Execution Timeout

**Problem:**
Workflow hangs or takes too long

**Solution:**
1. Process in smaller batches:
   ```bash
   weaver cultivate --max 20
   ```
2. Check system resources:
   ```bash
   top
   ```
3. Review logs for errors:
   ```bash
   weaver service logs
   ```

## Advanced Usage

### Custom Workflow Configuration

Create custom workflows in `.weaver/workflows/`:

```typescript
// .weaver/workflows/my-workflow.ts
export default {
  id: 'my-workflow',
  name: 'My Custom Workflow',
  description: 'Custom workflow logic',
  triggers: ['manual'],
  enabled: true,
  async handler(context) {
    // Your workflow logic
  }
};
```

### Integration with CI/CD

```yaml
# .github/workflows/cultivate.yml
name: Cultivate Knowledge Graph
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly

jobs:
  cultivate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install -g @weave-nn/weaver
      - run: weaver cultivate --max 100
      - run: git push origin workflow/cultivate-*
```

### Scripting Workflows

```bash
#!/bin/bash
# cultivate-vault.sh

# Process orphans in batches
for i in {1..5}; do
  echo "Processing batch $i..."
  weaver cultivate --orphans-only --max 30
  sleep 5
done

# Merge all branches
git branch | grep "workflow/cultivate" | xargs -I {} git merge {}
```

## Related Documentation

- [Workflow Engine Architecture](./WORKFLOW-ENGINE.md)
- [Context Analysis System](./CONTEXT-ANALYSIS.md)
- [Git Integration Layer](./GIT-INTEGRATION.md)
- [Phase 14 Implementation](../weave-nn/_planning/phases/phase-14.md)

## Support

For issues or questions:
- GitHub Issues: https://github.com/weave-nn/weaver/issues
- Documentation: https://docs.weave-nn.io
- Community: https://discord.gg/weave-nn
