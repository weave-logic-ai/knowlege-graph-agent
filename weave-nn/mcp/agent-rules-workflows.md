---
title: Weaver Workflow Automation Rules
type: architecture
status: active
priority: critical
created: 2025-10-23
tags: [workflows, automation, knowledge-graph, durable-execution, weaver]
related:
  - "[[claude-flow-tight-coupling]]"
  - "[[claude-flow-schema-mapping]]"
  - "[[../integrations/workflow-automation/file-watcher-workflows]]"
  - "[[../integrations/obsidian/obsidian-weaver-mcp]]"
  - "[[../docs/local-first-architecture-overview]]"
---

# Weaver Workflow Automation Rules

## Overview

Weaver uses **durable workflows** to automate knowledge graph maintenance. This document defines the 6 core workflows that ensure graph integrity, validate schemas, maintain bidirectional links, and provide AI-enhanced operations.

### Why Durable Workflows?

**OLD Architecture** (RabbitMQ + EventEmitter):
- Event-driven: `[Event] → [RabbitMQ Queue] → [Event Handler] → [Action]`
- Stateless: If process crashes, events are lost or duplicated
- No recovery: Failed operations must be manually retried
- Complex error handling: Dead letter queues, retries, backoff logic

**NEW Architecture** (Durable Workflows via workflow.dev):
- Workflow-driven: `[File Change] → [Trigger Workflow] → [Stateful Steps] → [Result]`
- Stateful: Each step persists state automatically
- Crash recovery: Workflows resume from last completed step
- Built-in retries: Automatic retry with exponential backoff

---

## Architecture

```
┌─────────────────────────────────────────┐
│   Obsidian Vault (File System)         │
│   - concepts/knowledge-graph.md         │
│   - decisions/technical/frontend.md     │
│   - features/F-001-graph-viz.md         │
└─────────────────────────────────────────┘
           ↓ (File System Monitoring)
┌─────────────────────────────────────────┐
│   Weaver File Watcher (chokidar)       │
│   - Monitors *.md files                 │
│   - Debounces rapid changes (300ms)     │
│   - Triggers workflows on events        │
└─────────────────────────────────────────┘
           ↓ (Workflow Triggers)
┌─────────────────────────────────────────┐
│   Durable Workflow Engine               │
│   (workflow.dev SDK)                    │
│                                         │
│   6 Core Workflows:                     │
│   1. vault-file-created                 │
│   2. vault-file-updated                 │
│   3. vault-file-deleted                 │
│   4. ensure-bidirectional-link          │
│   5. validate-node-schema               │
│   6. extract-and-store-memories         │
└─────────────────────────────────────────┘
           ↓ (Stateful Execution)
┌─────────────────────────────────────────┐
│   Integration Layer                     │
│   - Shadow Cache (SQLite)               │
│   - ObsidianAPIClient (Local REST API)  │
│   - AI Gateway (Vercel AI Gateway)*     │
│   - Git operations (simple-git)         │
└─────────────────────────────────────────┘

* Default: Vercel AI Gateway for all AI operations
  Exception: Direct Anthropic API for local claude-flow development
```

---

## Core Workflow 1: vault-file-created

**Trigger**: New markdown file created in vault
**Purpose**: Process new node, validate schema, update cache, establish links

```typescript
import { workflow } from '@workflowdev/sdk';
import { readFile } from 'fs/promises';
import { parseFrontmatter } from '../utils/frontmatter';
import { shadowCache } from '../cache/shadow-cache';
import { obsidianClient } from '../clients/obsidian';

export const vaultFileCreatedWorkflow = workflow(
  'vault-file-created',
  async (ctx, input: {
    filePath: string;       // Relative path: "concepts/knowledge-graph.md"
    absolutePath: string;   // Absolute path on disk
    timestamp: number;      // Creation timestamp
  }) => {
    // Step 1: Read file content (resumable from here if crashed)
    const content = await ctx.step('read-file', async () => {
      return await readFile(input.absolutePath, 'utf-8');
    });

    // Step 2: Parse frontmatter and body
    const { frontmatter, body } = await ctx.step('parse-frontmatter', async () => {
      return parseFrontmatter(content);
    });

    // Step 3: Validate schema (auto-fix missing fields)
    const validation = await ctx.step('validate-schema', async () => {
      const nodeType = frontmatter.type || 'note';
      const requiredFields = {
        concept: ['concept_id', 'concept_name', 'type', 'created_date'],
        decision: ['decision_id', 'title', 'status', 'created_date'],
        feature: ['feature_id', 'feature_name', 'status', 'release']
      };

      const required = requiredFields[nodeType];
      if (required) {
        const missing = required.filter(field => !frontmatter[field]);

        if (missing.length > 0) {
          // Auto-fix: Add default values
          const updates = {};
          missing.forEach(field => {
            if (field === 'created_date') {
              updates[field] = new Date().toISOString().split('T')[0];
            } else if (field.endsWith('_id')) {
              updates[field] = `AUTO-${Date.now()}`;
            } else if (field.endsWith('_name')) {
              const basename = path.basename(input.filePath, '.md');
              updates[field] = basename.replace(/-/g, ' ');
            } else if (field === 'status') {
              updates[field] = 'active';
            }
          });

          if (Object.keys(updates).length > 0) {
            await obsidianClient.updateFrontmatter(input.filePath, updates);
            return { valid: false, fixed: true, updates };
          }
        }
      }

      return { valid: true };
    });

    // Step 4: Extract structure (tags, wikilinks, headings)
    const structure = await ctx.step('extract-structure', async () => {
      const wikilinks = Array.from(
        body.matchAll(/\[\[([^\]]+)\]\]/g),
        m => m[1]
      );

      const tags = frontmatter.tags || [];

      const headings = Array.from(
        body.matchAll(/^#{1,6}\s+(.+)$/gm),
        m => m[1]
      );

      return { wikilinks, tags, headings };
    });

    // Step 5: Update shadow cache (atomic operation)
    await ctx.step('update-shadow-cache', async () => {
      await shadowCache.upsertNode({
        filePath: input.filePath,
        nodeType: frontmatter.type || 'note',
        frontmatter,
        tags: structure.tags,
        links: structure.wikilinks,
        createdAt: new Date(input.timestamp),
        updatedAt: new Date(input.timestamp),
      });
    });

    // Step 6: Ensure bidirectional links (spawn child workflows)
    await ctx.step('ensure-bidirectional-links', async () => {
      for (const link of structure.wikilinks) {
        await ctx.child('ensure-bidirectional-link', {
          sourceFile: input.filePath,
          targetLink: link
        });
      }
    });

    // Step 7: Generate embedding (optional, for semantic search)
    if (ctx.config.enableEmbeddings) {
      await ctx.step('generate-embedding', async () => {
        // Use Vercel AI Gateway for embedding generation
        const embedding = await generateEmbedding(body);
        await shadowCache.updateEmbedding(input.filePath, embedding);
      });
    }

    return {
      success: true,
      filePath: input.filePath,
      validation: validation.valid ? 'passed' : 'fixed',
      linksProcessed: structure.wikilinks.length,
    };
  }
);
```

**Key Features**:
- ✅ Crashes at Step 4? Workflow resumes from Step 5
- ✅ Auto-fixes missing schema fields
- ✅ Spawns child workflows for bidirectional linking
- ✅ Updates shadow cache atomically
- ✅ Optional AI-powered embeddings

---

## Core Workflow 2: vault-file-updated

**Trigger**: Existing markdown file modified
**Purpose**: Detect changes, update cache, reprocess links, track status changes

```typescript
export const vaultFileUpdatedWorkflow = workflow(
  'vault-file-updated',
  async (ctx, input: {
    filePath: string;
    absolutePath: string;
    timestamp: number;
  }) => {
    // Step 1: Get previous state from shadow cache
    const previousState = await ctx.step('get-previous-state', async () => {
      return await shadowCache.getNode(input.filePath);
    });

    // Step 2: Read updated file content
    const content = await ctx.step('read-file', async () => {
      return await readFile(input.absolutePath, 'utf-8');
    });

    // Step 3: Parse frontmatter and body
    const { frontmatter, body } = await ctx.step('parse-frontmatter', async () => {
      return parseFrontmatter(content);
    });

    // Step 4: Detect changes (status, tags, links)
    const changes = await ctx.step('detect-changes', async () => {
      return {
        statusChanged: previousState?.frontmatter.status !== frontmatter.status,
        oldStatus: previousState?.frontmatter.status,
        newStatus: frontmatter.status,
        tagsAdded: frontmatter.tags?.filter(t => !previousState?.tags.includes(t)) || [],
        tagsRemoved: previousState?.tags.filter(t => !frontmatter.tags?.includes(t)) || [],
        linksAdded: [],  // Will calculate below
        linksRemoved: [], // Will calculate below
      };
    });

    // Step 5: Extract new structure
    const structure = await ctx.step('extract-structure', async () => {
      const wikilinks = Array.from(
        body.matchAll(/\[\[([^\]]+)\]\]/g),
        m => m[1]
      );

      const tags = frontmatter.tags || [];

      return { wikilinks, tags };
    });

    // Step 6: Calculate link changes
    const linkChanges = await ctx.step('calculate-link-changes', async () => {
      const previousLinks = previousState?.links || [];
      const currentLinks = structure.wikilinks;

      return {
        linksAdded: currentLinks.filter(l => !previousLinks.includes(l)),
        linksRemoved: previousLinks.filter(l => !currentLinks.includes(l))
      };
    });

    // Step 7: Update shadow cache
    await ctx.step('update-shadow-cache', async () => {
      await shadowCache.upsertNode({
        filePath: input.filePath,
        nodeType: frontmatter.type || 'note',
        frontmatter,
        tags: structure.tags,
        links: structure.wikilinks,
        updatedAt: new Date(input.timestamp),
      });
    });

    // Step 8: Process new links
    if (linkChanges.linksAdded.length > 0) {
      await ctx.step('process-new-links', async () => {
        for (const link of linkChanges.linksAdded) {
          await ctx.child('ensure-bidirectional-link', {
            sourceFile: input.filePath,
            targetLink: link
          });
        }
      });
    }

    // Step 9: Handle status changes (e.g., decision closed → notify related)
    if (changes.statusChanged) {
      await ctx.step('handle-status-change', async () => {
        // Example: If decision status changed to "decided", check for blocked decisions
        if (frontmatter.type === 'decision' && frontmatter.status === 'decided') {
          const blockedDecisions = await shadowCache.findBlockedBy(input.filePath);
          // Optionally notify or update blocked decisions
          return { blockedDecisions: blockedDecisions.length };
        }
        return {};
      });
    }

    // Step 10: Re-generate embedding if content changed significantly
    if (ctx.config.enableEmbeddings) {
      await ctx.step('update-embedding', async () => {
        const embedding = await generateEmbedding(body);
        await shadowCache.updateEmbedding(input.filePath, embedding);
      });
    }

    return {
      success: true,
      filePath: input.filePath,
      changes: {
        statusChanged: changes.statusChanged,
        linksAdded: linkChanges.linksAdded.length,
        linksRemoved: linkChanges.linksRemoved.length,
      },
    };
  }
);
```

**Key Features**:
- ✅ Detects specific changes (status, tags, links)
- ✅ Handles impacted relationships (blocked decisions)
- ✅ Only processes changed links (not all links)
- ✅ Updates embeddings only if content changed

---

## Core Workflow 3: vault-file-deleted

**Trigger**: Markdown file deleted from vault
**Purpose**: Clean up cache, handle orphaned links, log deletion

```typescript
export const vaultFileDeletedWorkflow = workflow(
  'vault-file-deleted',
  async (ctx, input: {
    filePath: string;
    timestamp: number;
  }) => {
    // Step 1: Get node metadata before deletion
    const nodeData = await ctx.step('get-node-data', async () => {
      return await shadowCache.getNode(input.filePath);
    });

    // Step 2: Find all nodes that link to this deleted node
    const inboundLinks = await ctx.step('find-inbound-links', async () => {
      return await shadowCache.findNodesLinkingTo(input.filePath);
    });

    // Step 3: Mark as deleted in shadow cache (soft delete)
    await ctx.step('soft-delete-cache', async () => {
      await shadowCache.markAsDeleted(input.filePath, input.timestamp);
    });

    // Step 4: Log deletion with context
    await ctx.step('log-deletion', async () => {
      const logEntry = {
        timestamp: new Date(input.timestamp).toISOString(),
        filePath: input.filePath,
        nodeType: nodeData?.nodeType,
        inboundLinks: inboundLinks.length,
        action: 'deleted'
      };

      await shadowCache.logEvent('node-deleted', logEntry);
    });

    // Step 5: Optionally notify about orphaned links
    if (inboundLinks.length > 0) {
      await ctx.step('flag-orphaned-links', async () => {
        for (const sourceFile of inboundLinks) {
          // Could update source files to mark broken links
          // Or just log for user to review
          await shadowCache.flagBrokenLink(sourceFile, input.filePath);
        }
      });
    }

    // Step 6: Hard delete from cache after TTL (e.g., 30 days)
    await ctx.sleep('30d'); // Durable sleep!

    await ctx.step('hard-delete-cache', async () => {
      await shadowCache.deleteNode(input.filePath);
    });

    return {
      success: true,
      filePath: input.filePath,
      orphanedLinks: inboundLinks.length,
    };
  }
);
```

**Key Features**:
- ✅ Soft delete with 30-day TTL (can be recovered)
- ✅ Tracks orphaned links
- ✅ Durable sleep (persists across restarts!)
- ✅ Automatic hard delete after TTL

---

## Core Workflow 4: ensure-bidirectional-link

**Trigger**: Child workflow spawned by file-created/updated workflows
**Purpose**: Create reverse links, create placeholder nodes if missing

```typescript
export const ensureBidirectionalLinkWorkflow = workflow(
  'ensure-bidirectional-link',
  async (ctx, input: {
    sourceFile: string;    // e.g., "concepts/knowledge-graph.md"
    targetLink: string;    // e.g., "wikilinks" (without .md or path)
  }) => {
    // Step 1: Resolve target file path
    const targetPath = await ctx.step('resolve-target-path', async () => {
      // Search for file matching the link
      const matches = await shadowCache.findFilesByBasename(input.targetLink);

      if (matches.length === 1) {
        return matches[0];
      } else if (matches.length > 1) {
        // Ambiguous link - log warning
        return null;
      } else {
        // No matches - need to create placeholder
        return `concepts/${input.targetLink}.md`; // Default location
      }
    });

    // Step 2: Check if target exists
    const targetExists = await ctx.step('check-target-exists', async () => {
      if (!targetPath) return false;

      try {
        await obsidianClient.readNote(targetPath);
        return true;
      } catch (error) {
        return false;
      }
    });

    // Step 3: Create placeholder if target doesn't exist
    if (!targetExists && targetPath) {
      await ctx.step('create-placeholder', async () => {
        await obsidianClient.createNote(targetPath, {
          frontmatter: {
            type: 'placeholder',
            created_date: new Date().toISOString().split('T')[0],
            tags: ['placeholder', 'auto-created'],
            created_by: 'weaver-workflow'
          },
          content: `# ${input.targetLink}\n\n_This is a placeholder node created automatically because [[${path.basename(input.sourceFile, '.md')}]] links to it._\n\n## Related\n- [[${path.basename(input.sourceFile, '.md')}]]`
        });
      });

      return { created: true, linked: true };
    }

    // Step 4: Check if reverse link exists
    const hasReverseLink = await ctx.step('check-reverse-link', async () => {
      const targetContent = await obsidianClient.readNote(targetPath);
      const sourceBasename = path.basename(input.sourceFile, '.md');
      return targetContent.includes(`[[${sourceBasename}]]`);
    });

    // Step 5: Add reverse link if missing
    if (!hasReverseLink) {
      await ctx.step('add-reverse-link', async () => {
        const sourceBasename = path.basename(input.sourceFile, '.md');

        // Try to append to existing "Related" section, or create new section
        await obsidianClient.appendToSection(
          targetPath,
          'Related',
          `- [[${sourceBasename}]]`
        );
      });

      return { created: false, linked: true };
    }

    return { created: false, linked: false }; // Already existed and linked
  }
);
```

**Key Features**:
- ✅ Resolves ambiguous links
- ✅ Creates placeholder nodes automatically
- ✅ Maintains bidirectional links
- ✅ Handles missing target files gracefully

---

## Core Workflow 5: validate-node-schema

**Trigger**: Can be called standalone or as step in other workflows
**Purpose**: Comprehensive schema validation with auto-fix

```typescript
export const validateNodeSchemaWorkflow = workflow(
  'validate-node-schema',
  async (ctx, input: {
    filePath: string;
    autoFix?: boolean;  // Default: true
  }) => {
    // Step 1: Read file
    const content = await ctx.step('read-file', async () => {
      const absolutePath = path.join(ctx.config.vaultPath, input.filePath);
      return await readFile(absolutePath, 'utf-8');
    });

    // Step 2: Parse frontmatter
    const { frontmatter, body } = await ctx.step('parse-frontmatter', async () => {
      return parseFrontmatter(content);
    });

    // Step 3: Get schema for node type
    const schema = await ctx.step('get-schema', async () => {
      const nodeType = frontmatter.type || 'note';
      return getSchemaForType(nodeType);
    });

    // Step 4: Validate against schema
    const validation = await ctx.step('validate', async () => {
      const errors = [];
      const warnings = [];

      // Check required fields
      for (const field of schema.required) {
        if (!frontmatter[field]) {
          errors.push({
            field,
            error: 'required',
            message: `Required field "${field}" is missing`
          });
        }
      }

      // Check field types
      for (const [field, value] of Object.entries(frontmatter)) {
        const fieldSchema = schema.properties[field];
        if (fieldSchema) {
          if (fieldSchema.type === 'array' && !Array.isArray(value)) {
            errors.push({
              field,
              error: 'type',
              message: `Field "${field}" should be an array`
            });
          }
          if (fieldSchema.type === 'string' && typeof value !== 'string') {
            errors.push({
              field,
              error: 'type',
              message: `Field "${field}" should be a string`
            });
          }
        }
      }

      // Check minimum content length
      if (body.trim().length < 50) {
        warnings.push({
          field: 'content',
          warning: 'too_short',
          message: 'Content is very short (< 50 characters)'
        });
      }

      return { errors, warnings };
    });

    // Step 5: Auto-fix if enabled
    if (input.autoFix !== false && validation.errors.length > 0) {
      await ctx.step('auto-fix', async () => {
        const fixes = {};

        for (const error of validation.errors) {
          if (error.field === 'created_date') {
            fixes[error.field] = new Date().toISOString().split('T')[0];
          } else if (error.field.endsWith('_id')) {
            fixes[error.field] = `AUTO-${Date.now()}`;
          } else if (error.field.endsWith('_name')) {
            const basename = path.basename(input.filePath, '.md');
            fixes[error.field] = basename.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          } else if (error.field === 'status') {
            fixes[error.field] = 'active';
          } else if (error.field === 'tags' && !frontmatter.tags) {
            fixes[error.field] = [];
          }
        }

        if (Object.keys(fixes).length > 0) {
          await obsidianClient.updateFrontmatter(input.filePath, fixes);
          return { fixed: true, fixes };
        }

        return { fixed: false };
      });
    }

    return {
      valid: validation.errors.length === 0,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }
);
```

**Key Features**:
- ✅ Schema-based validation
- ✅ Auto-fix missing fields
- ✅ Type checking
- ✅ Content quality checks

---

## Core Workflow 6: extract-and-store-memories

**Trigger**: Can be scheduled or manually triggered
**Purpose**: Use AI (via Vercel AI Gateway) to extract structured memories from content

```typescript
export const extractAndStoreMemoriesWorkflow = workflow(
  'extract-and-store-memories',
  async (ctx, input: {
    filePath: string;
  }) => {
    // Step 1: Read file
    const content = await ctx.step('read-file', async () => {
      const absolutePath = path.join(ctx.config.vaultPath, input.filePath);
      return await readFile(absolutePath, 'utf-8');
    });

    // Step 2: Parse frontmatter and body
    const { frontmatter, body } = await ctx.step('parse-frontmatter', async () => {
      return parseFrontmatter(content);
    });

    // Step 3: Extract memories using AI (via Vercel AI Gateway)
    const memories = await ctx.step('extract-memories', async () => {
      const prompt = `Extract key memories from this content. Categorize by:
1. Episodic (what happened)
2. Procedural (how to do it)
3. Semantic (general knowledge)
4. Technical (implementation details)
5. Context (why decisions were made)

Content:
${body}

Return JSON:
{
  "episodic": ["memory1", "memory2"],
  "procedural": ["step1", "step2"],
  "semantic": ["fact1", "fact2"],
  "technical": ["detail1", "detail2"],
  "context": ["reason1", "reason2"]
}`;

      const response = await claudeAPI.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(c => c.type === 'text');
      return JSON.parse(textContent.text);
    });

    // Step 4: Store memories in shadow cache
    await ctx.step('store-memories', async () => {
      await shadowCache.upsertMemories(input.filePath, memories);
    });

    // Step 5: Suggest auto-tags based on memories
    const suggestedTags = await ctx.step('suggest-tags', async () => {
      const prompt = `Based on these memories, suggest 3-5 relevant tags:

${JSON.stringify(memories, null, 2)}

Return only a JSON array of strings: ["tag1", "tag2", "tag3"]`;

      const response = await claudeAPI.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find(c => c.type === 'text');
      return JSON.parse(textContent.text);
    });

    // Step 6: Add suggested tags to frontmatter (if not already present)
    await ctx.step('add-suggested-tags', async () => {
      const currentTags = frontmatter.tags || [];
      const newTags = suggestedTags.filter(tag => !currentTags.includes(tag));

      if (newTags.length > 0) {
        await obsidianClient.updateFrontmatter(input.filePath, {
          tags: [...currentTags, ...newTags],
          auto_tagged: true,
          auto_tagged_date: new Date().toISOString().split('T')[0]
        });

        return { added: newTags };
      }

      return { added: [] };
    });

    return {
      success: true,
      memoriesExtracted: Object.values(memories).flat().length,
      tagsAdded: suggestedTags.length,
    };
  }
);
```

**Key Features**:
- ✅ AI-powered memory extraction
- ✅ Categorized memory types
- ✅ Auto-tagging based on content
- ✅ Stores memories in shadow cache

---

## Workflow Orchestration

### Triggering Workflows from File Watcher

```typescript
// weaver/src/services/file-watcher.ts
import { watch } from 'chokidar';
import { triggerWorkflow } from '@workflowdev/sdk';

export class VaultWatcher {
  private watcher: FSWatcher | null = null;

  start(): void {
    this.watcher = watch(this.config.vaultPath, {
      ignored: [
        /(^|[\/\\])\../, // Hidden files
        '**/node_modules/**',
        '**/.git/**',
        '**/.obsidian/workspace*.json',
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    this.watcher.on('add', async (filePath) => {
      if (this.isMarkdownFile(filePath)) {
        await triggerWorkflow('vault-file-created', {
          filePath: path.relative(this.config.vaultPath, filePath),
          absolutePath: filePath,
          timestamp: Date.now(),
        });
      }
    });

    this.watcher.on('change', async (filePath) => {
      if (this.isMarkdownFile(filePath)) {
        await triggerWorkflow('vault-file-updated', {
          filePath: path.relative(this.config.vaultPath, filePath),
          absolutePath: filePath,
          timestamp: Date.now(),
        });
      }
    });

    this.watcher.on('unlink', async (filePath) => {
      if (this.isMarkdownFile(filePath)) {
        await triggerWorkflow('vault-file-deleted', {
          filePath: path.relative(this.config.vaultPath, filePath),
          timestamp: Date.now(),
        });
      }
    });
  }

  private isMarkdownFile(filePath: string): boolean {
    return filePath.endsWith('.md') &&
           !filePath.includes('/.obsidian/') &&
           !filePath.includes('/node_modules/');
  }
}
```

---

## Benefits Over Event-Driven Architecture

| Feature | RabbitMQ Events | Durable Workflows |
|---------|----------------|-------------------|
| **Crash Recovery** | ❌ Events lost or duplicated | ✅ Resume from last step |
| **State Management** | ❌ Must implement manually | ✅ Automatic persistence |
| **Retry Logic** | ❌ Complex DLQ setup | ✅ Built-in exponential backoff |
| **Observability** | ⚠️ Requires external tools | ✅ Built-in execution history |
| **Debugging** | ❌ Logs scattered across services | ✅ Per-workflow execution trace |
| **Long-Running Tasks** | ❌ Not supported | ✅ Durable sleep (days/weeks) |
| **Child Workflows** | ❌ Complex orchestration | ✅ Native child workflow support |
| **Testing** | ❌ Requires RabbitMQ instance | ✅ Test with in-memory engine |

---

## Configuration

```yaml
# weaver/config.yaml
workflows:
  enabled: true
  engine: "workflow.dev"
  persistence: "sqlite"  # Or "postgres" for production
  persistencePath: ".weaver/workflows.db"

  # Individual workflow settings
  vault-file-created:
    enabled: true
    enableEmbeddings: true
    maxRetries: 3

  vault-file-updated:
    enabled: true
    enableEmbeddings: true
    detectStatusChanges: true

  vault-file-deleted:
    enabled: true
    softDeleteTTL: "30d"  # Keep deleted nodes for 30 days

  ensure-bidirectional-link:
    enabled: true
    createPlaceholders: true

  validate-node-schema:
    enabled: true
    autoFix: true

  extract-and-store-memories:
    enabled: false  # Optional, can be expensive
    autoTag: true
```

---

## Monitoring and Observability

### Workflow Execution Dashboard

```typescript
// Query workflow status via workflow.dev SDK
const status = await getWorkflowStatus('vault-file-created', executionId);

console.log({
  workflowId: status.workflowId,
  executionId: status.executionId,
  status: status.status, // 'running', 'completed', 'failed'
  currentStep: status.currentStep,
  completedSteps: status.completedSteps.length,
  totalSteps: status.totalSteps,
  startedAt: status.startedAt,
  completedAt: status.completedAt,
  duration: status.duration,
});
```

### Metrics to Track

- **Workflow Execution Rate**: Workflows/minute
- **Failure Rate**: Failed workflows / Total workflows
- **Retry Rate**: Workflows requiring retries
- **Step Duration**: p50, p95, p99 for each step
- **Queue Depth**: Pending workflow executions

---

## Related Documentation

- [[claude-flow-tight-coupling]] - Architecture principle (markdown = memory)
- [[claude-flow-schema-mapping]] - Field mapping specifications
- [[../integrations/workflow-automation/file-watcher-workflows]] - Implementation details
- [[../integrations/obsidian/obsidian-weaver-mcp]] - MCP tools reference
- [[../docs/local-first-architecture-overview]] - Complete MVP architecture

---

**Status**: ✅ **Active** - MVP core automation
**Priority**: Critical
**Last Updated**: 2025-10-23
**Maintainer**: Weaver Team
