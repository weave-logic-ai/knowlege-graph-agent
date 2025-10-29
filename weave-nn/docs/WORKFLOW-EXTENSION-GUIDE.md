---
title: Workflow Engine Extension Guide
type: guide
status: complete
phase_id: PHASE-12
tags:
  - workflow-engine
  - extension-guide
  - vector-db
  - learning-loop
  - markdown-workflows
  - phase/phase-12
  - type/implementation
  - status/complete
domain: weaver
priority: medium
visual:
  icon: "\U0001F4C4"
  color: '#7ED321'
  cssclasses:
    - type-guide
    - status-complete
    - priority-medium
    - domain-weaver
updated: '2025-10-29T04:55:05.354Z'
author: ai-generated
version: 1.0.0
keywords:
  - "\U0001F4DA related documentation"
  - workflow architecture
  - learning loop integration
  - implementation context
  - chunking workflows
  - see also
  - related
  - "\U0001F3AF overview"
  - "\U0001F3D7️ existing workflow engine"
  - architecture
---

# Workflow Engine Extension Guide

**Version**: 1.0.0
**Date**: 2025-10-27
**Status**: ✅ Complete

---

## 📚 Related Documentation

### Workflow Architecture
- [[MARKDOWN-ASYNC-WORKFLOW-ARCHITECTURE]] - Markdown workflow patterns
- [[VECTOR-DB-MARKDOWN-WORKFLOW-ARCHITECTURE]] - Vector database workflows
- [[VERCEL-WORKFLOW-VECTOR-DB-ARCHITECTURE]] - Vercel patterns

### Learning Loop Integration
- [[PHASE-12-LEARNING-LOOP-BLUEPRINT]] - Learning loop architecture
- [[PHASE-12-LEARNING-LOOP-INTEGRATION]] - Integration guide
- [[WEAVER-SOPS-FRAMEWORK]] - SOP framework

### Implementation Context
- [[WEAVER-COMPLETE-IMPLEMENTATION-GUIDE]] - Complete Weaver guide
- [[USER-FEEDBACK-REFLECTION-DESIGN]] - User feedback patterns

### Chunking Workflows
- [[CHUNKING-STRATEGY-SYNTHESIS]] - Chunking strategies
- [[CHUNKING-IMPLEMENTATION-DESIGN]] - Chunking implementation

### See Also
- [[phase-13-master-plan]] - Phase 13 integration
- [[phase-12-workflow-inventory]] - Workflow catalog

---







## Related

[[learning-loop-api]]
## Related

[[MARKDOWN-WORKFLOW-EXAMPLES]]
## Related

[[MARKDOWN-WORKFLOW-IMPLEMENTATION-SUMMARY]]
## 🎯 Overview

This guide documents the extension of Weaver's existing workflow engine to support:
1. **Vector DB workflows** (chunking, embedding, indexing)
2. **Learning loop workflows** (perception, reasoning, execution, reflection)
3. **Markdown-triggered workflows** (automatic execution when markdown files change)

---

## 🏗️ Existing Workflow Engine

Weaver already has a robust workflow orchestration system:

### Architecture

```
WorkflowEngine
├── WorkflowRegistry (manages workflow definitions)
├── WorkflowExecution (tracks execution history)
└── File Event Integration (triggers workflows on file changes)
```

### Key Features

- ✅ **File event triggers**: `file:add`, `file:change`, `file:unlink`
- ✅ **Manual triggers**: Programmatic workflow execution
- ✅ **File filtering**: Glob pattern matching
- ✅ **Execution tracking**: Complete history with stats
- ✅ **Parallel execution**: Multiple workflows can run simultaneously

### Workflow Definition

```typescript
interface WorkflowDefinition {
  id: string;                        // Unique identifier
  name: string;                      // Human-readable name
  description: string;               // What the workflow does
  triggers: WorkflowTrigger[];       // When to run
  enabled: boolean;                  // On/off switch
  handler: (context) => Promise<void>; // What to do
  fileFilter?: string;               // Glob pattern (optional)
}
```

---

## 🔧 Vector DB Workflows Extension

### New Workflows

#### 1. Chunking Workflow

**ID**: `vector-db:chunking`
**Trigger**: `.weaver/vectors/sources/**/chunking-strategy.md` changes
**When**: User completes chunking strategy selection
**What**: Chunks document according to selected strategy

```typescript
export const chunkingWorkflow: WorkflowDefinition = {
  id: 'vector-db:chunking',
  name: 'Document Chunking',
  triggers: ['file:change'],
  fileFilter: '.weaver/vectors/sources/**/chunking-strategy.md',

  handler: async (context) => {
    // 1. Parse markdown (extract user's strategy selection)
    // 2. Load chunking plugin
    // 3. Chunk the document
    // 4. Generate chunk markdown files
    // 5. Update metadata
    // 6. Trigger embedding workflow
  },
};
```

**Flow**:
```
User fills chunking-strategy.md
   ↓
Sets status: completed
   ↓
File watcher detects change
   ↓
Chunking workflow triggers
   ↓
Document chunked → chunk-001.md, chunk-002.md, ...
   ↓
Embedding workflow template generated
```

#### 2. Embedding Workflow

**ID**: `vector-db:embedding`
**Trigger**: `.weaver/vectors/workflows/embedding-*.md` changes
**When**: User completes embedding configuration
**What**: Generates vector embeddings for chunks

```typescript
export const embeddingWorkflow: WorkflowDefinition = {
  id: 'vector-db:embedding',
  name: 'Embedding Generation',
  triggers: ['file:change'],
  fileFilter: '.weaver/vectors/workflows/embedding-*.md',

  handler: async (context) => {
    // 1. Parse markdown (extract model selection)
    // 2. Load embedding model
    // 3. Generate embeddings in batches
    // 4. Store vectors + markdown
    // 5. Update chunk metadata
    // 6. Trigger indexing workflow
  },
};
```

**Flow**:
```
Embedding template generated (by chunking workflow)
   ↓
User reviews/confirms (optional)
   ↓
Sets status: completed
   ↓
Embedding workflow triggers
   ↓
Vectors generated → emb-chunk-001/, emb-chunk-002/, ...
   ↓
Indexing workflow template generated
```

#### 3. Indexing Workflow

**ID**: `vector-db:indexing`
**Trigger**: `.weaver/vectors/workflows/indexing-*.md` changes
**When**: User completes index configuration
**What**: Builds vector index for similarity search

```typescript
export const indexingWorkflow: WorkflowDefinition = {
  id: 'vector-db:indexing',
  name: 'Vector Indexing',
  triggers: ['file:change'],
  fileFilter: '.weaver/vectors/workflows/indexing-*.md',

  handler: async (context) => {
    // 1. Parse markdown (extract index type)
    // 2. Load all vectors
    // 3. Build vector index (HNSW, flat, etc.)
    // 4. Compute similarity neighbors
    // 5. Generate index markdown
    // 6. Update embeddings with neighbor links
  },
};
```

**Flow**:
```
Indexing template generated (by embedding workflow)
   ↓
User reviews/confirms (optional)
   ↓
Sets status: completed
   ↓
Indexing workflow triggers
   ↓
Index built → primary-index.md
   ↓
Search enabled
```

---

## 🎓 Learning Loop Workflows Extension

### New Workflows

#### 1. Perception Workflow

**ID**: `learning-loop:perception`
**Trigger**: `.weaver/learning-sessions/**/perception.md` changes
**When**: User completes context validation
**What**: Validates context and triggers reasoning

```typescript
export const perceptionStageWorkflow: WorkflowDefinition = {
  id: 'learning-loop:perception',
  name: 'Learning Loop - Perception',
  triggers: ['file:change'],
  fileFilter: '.weaver/learning-sessions/**/perception.md',

  handler: async (context) => {
    // 1. Parse markdown
    // 2. Extract user's context validation
    // 3. Store validated context in memory
    // 4. Update learning patterns
    // 5. Generate reasoning template
  },
};
```

#### 2. Reasoning Workflow

**ID**: `learning-loop:reasoning`
**Trigger**: `.weaver/learning-sessions/**/reasoning.md` changes
**When**: User completes plan selection
**What**: Processes A/B testing and triggers execution

```typescript
export const reasoningStageWorkflow: WorkflowDefinition = {
  id: 'learning-loop:reasoning',
  name: 'Learning Loop - Reasoning',
  triggers: ['file:change'],
  fileFilter: '.weaver/learning-sessions/**/reasoning.md',

  handler: async (context) => {
    // 1. Parse markdown
    // 2. Extract plan selection
    // 3. Extract preference signals
    // 4. Store decision + rationale
    // 5. Update preference model
    // 6. Generate execution template
  },
};
```

#### 3. Execution Workflow

**ID**: `learning-loop:execution`
**Trigger**: `.weaver/learning-sessions/**/execution.md` changes
**When**: User updates progress (can be multiple times)
**What**: Tracks progress, triggers reflection when complete

```typescript
export const executionStageWorkflow: WorkflowDefinition = {
  id: 'learning-loop:execution',
  name: 'Learning Loop - Execution',
  triggers: ['file:change'],
  fileFilter: '.weaver/learning-sessions/**/execution.md',

  handler: async (context) => {
    // 1. Parse markdown
    // 2. Extract progress updates
    // 3. Store blockers and discoveries
    // 4. If 100% complete, generate reflection template
  },
};
```

**Note**: This workflow runs on every save, not just completion, to support periodic progress updates.

#### 4. Reflection Workflow

**ID**: `learning-loop:reflection`
**Trigger**: `.weaver/learning-sessions/**/reflection.md` changes
**When**: User completes reflection
**What**: Extracts learnings and archives session

```typescript
export const reflectionStageWorkflow: WorkflowDefinition = {
  id: 'learning-loop:reflection',
  name: 'Learning Loop - Reflection',
  triggers: ['file:change'],
  fileFilter: '.weaver/learning-sessions/**/reflection.md',

  handler: async (context) => {
    // 1. Parse markdown
    // 2. Extract satisfaction rating and learnings
    // 3. Extract preference signals
    // 4. Store learning outcome
    // 5. Train neural patterns
    // 6. Archive session
  },
};
```

---

## 📦 Registration

### Automatic Registration

All workflows are automatically registered when the workflow engine starts:

```typescript
import { createWorkflowEngine } from './workflow-engine/index.js';
import { registerAllWorkflows } from './workflows/register-workflows.js';

// Create engine
const workflowEngine = createWorkflowEngine();

// Register all workflows (example, vector-db, learning-loop)
registerAllWorkflows(workflowEngine);

// Start engine
await workflowEngine.start();
```

### Workflow Categories

```
Total Workflows: 11
├── Example workflows: 4
│   ├── file-change-logger
│   ├── markdown-analyzer
│   ├── concept-tracker
│   └── file-deletion-monitor
│
├── Vector DB workflows: 3
│   ├── vector-db:chunking
│   ├── vector-db:embedding
│   └── vector-db:indexing
│
└── Learning loop workflows: 4
    ├── learning-loop:perception
    ├── learning-loop:reasoning
    ├── learning-loop:execution
    └── learning-loop:reflection
```

---

## 🔄 Integration with File Watcher

### Existing Integration

The workflow engine already integrates with Weaver's file watcher:

```typescript
// File watcher detects change
fileWatcher.on('change', async (fileEvent) => {
  // Workflow engine processes the event
  await workflowEngine.triggerFileEvent(fileEvent);
});
```

### How It Works

1. **File changes** → File watcher detects
2. **Event emitted** → `{ type: 'change', path: '...' }`
3. **Workflow engine** → Finds matching workflows by `fileFilter`
4. **Workflows execute** → Handlers run in parallel
5. **Results tracked** → Execution history recorded

### Example Flow

```
User edits: .weaver/learning-sessions/session-abc123/perception.md
User changes: status: pending → completed
User saves file
   ↓
File watcher: change event for perception.md
   ↓
Workflow engine: Matches learning-loop:perception workflow
   ↓
Workflow handler executes:
  - Parses markdown
  - Validates context
  - Stores in memory
  - Generates reasoning.md
   ↓
Result: Reasoning template ready for user
```

---

## 🎯 Benefits of This Approach

### 1. Leverages Existing System
- ✅ No need to introduce new dependencies (Vercel Workflow, etc.)
- ✅ Proven, working system already in production
- ✅ Familiar to Weaver developers

### 2. Type-Safe & Robust
- ✅ Full TypeScript support
- ✅ Execution tracking and history
- ✅ Error handling built-in

### 3. Observable & Debuggable
- ✅ Workflow execution logs
- ✅ Stats and metrics
- ✅ Execution history (last 100)

### 4. Extensible
- ✅ Easy to add new workflows
- ✅ Simple registration pattern
- ✅ File filter flexibility

### 5. Markdown-First
- ✅ User interaction via markdown
- ✅ Version-controllable decision logs
- ✅ Async, non-blocking workflow triggers

---

## 📊 Workflow Statistics

### Execution Tracking

Every workflow execution is tracked:

```typescript
interface WorkflowExecution {
  id: string;                   // Execution UUID
  workflowId: string;           // Which workflow
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;            // Milliseconds
  error?: string;               // If failed
}
```

### Available Stats

```typescript
const stats = workflowEngine.getStats();

console.log(stats);
// {
//   totalWorkflows: 11,
//   enabledWorkflows: 11,
//   totalExecutions: 142,
//   successfulExecutions: 138,
//   failedExecutions: 4,
//   runningExecutions: 0
// }
```

### Execution History

```typescript
// Get recent executions
const recent = registry.getRecentExecutions(10);

// Get executions for a specific workflow
const perceptionRuns = registry.getExecutionsByWorkflow('learning-loop:perception', 5);
```

---

## 🔧 Adding New Workflows

### Step 1: Define Workflow

```typescript
export const myNewWorkflow: WorkflowDefinition = {
  id: 'my-category:my-workflow',
  name: 'My Workflow',
  description: 'What this workflow does',
  triggers: ['file:change'],
  enabled: true,
  fileFilter: 'path/to/**/files.md',

  handler: async (context: WorkflowContext) => {
    // Your workflow logic here
  },
};
```

### Step 2: Export in Module

```typescript
export function getMyWorkflows(): WorkflowDefinition[] {
  return [myNewWorkflow, anotherWorkflow];
}
```

### Step 3: Register

```typescript
// In register-workflows.ts
import { getMyWorkflows } from './my-workflows.js';

export function registerAllWorkflows(engine: WorkflowEngine): void {
  const myWorkflows = getMyWorkflows();

  for (const workflow of myWorkflows) {
    engine.registerWorkflow(workflow);
  }
}
```

Done! Workflow is now active.

---

## 🎓 Best Practices

### 1. Workflow IDs
Use `category:name` pattern:
- `vector-db:chunking`
- `learning-loop:perception`
- `sop:feature-planning`

### 2. File Filters
Be specific to avoid unnecessary triggers:
```typescript
// ✅ Good
fileFilter: '.weaver/vectors/sources/**/chunking-strategy.md'

// ❌ Too broad
fileFilter: '**/*.md'
```

### 3. Handler Logic
- Parse markdown first
- Check status/completion
- Exit early if not ready
- Log important steps
- Handle errors gracefully

### 4. Trigger Next Workflows
Generate templates to trigger next stage:
```typescript
// After perception completes
await templateGenerator.generateTemplate(
  'reasoning',
  sessionId,
  sopId,
  data
);
// This will trigger the reasoning workflow automatically
```

---

## 📚 Related Documentation

- **Workflow Engine**: `src/workflow-engine/index.ts`
- **Vector DB Workflows**: `src/workflows/vector-db-workflows.ts`
- **Learning Loop Workflows**: `src/workflows/learning-loop-workflows.ts`
- **Registration**: `src/workflows/register-workflows.ts`
- **Example Workflows**: `src/workflows/example-workflows.ts`

---

**Status**: ✅ Extension Complete
**Total Workflows**: 11 (4 example + 3 vector-db + 4 learning-loop)
**Integration**: Seamless with existing workflow engine
**Performance**: No additional overhead
**Testing**: Covered by existing workflow tests
