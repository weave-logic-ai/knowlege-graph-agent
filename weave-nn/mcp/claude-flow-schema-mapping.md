---
type: integration-spec
status: active
priority: critical
created_date: '2025-10-20'
tags:
  - claude-flow
  - memory
  - schema
  - mapping
  - mcp
  - integration
related:
  - '[[claude-flow-memory-visualization]]'
  - '[[ai-agent-integration]]'
  - '[[model-context-protocol]]'
  - '[[../_planning/phases/phase-4-claude-flow-integration]]'
visual:
  icon: 📄
  cssclasses:
    - type-integration-spec
    - status-active
    - priority-critical
version: '3.0'
updated_date: '2025-10-28'
icon: 📄
---

# Claude-Flow Schema Mapping

**Purpose**: Complete field-by-field mapping between Claude-Flow v2.7 memory system and Weave-NN knowledge graph nodes to achieve 1:1 parity.

**Status**: ✅ **ACTIVE** - Based on Claude-Flow v2.7 research
**Phase**: [[../_planning/phases/phase-4-claude-flow-integration|Phase 4]]

---

## 📊 Claude-Flow Memory Architecture

### Storage Infrastructure

**Database**: SQLite persistent storage
**Location**: `.swarm/memory.db`
**Persistence**: Survives restarts, cross-session state management
**Search**: Semantic search with hash-based embeddings (1024 dimensions, 2-3ms latency)
**Organization**: Namespace isolation for domain separation

---

## 🗄️ Database Schema (12 Tables)

### Core Tables

Claude-Flow v2.7 uses 12 specialized tables:

1. **memory_store** - General key-value storage
2. **sessions** - Session management
3. **agents** - Agent registry and state
4. **tasks** - Task tracking and status
5. **agent_memory** - Agent-specific memory
6. **shared_state** - Cross-agent shared state
7. **events** - Event log and history
8. **patterns** - Learned patterns and behaviors
9. **performance_metrics** - Performance tracking
10. **workflow_state** - Workflow persistence
11. **swarm_topology** - Network topology data
12. **consensus_state** - Distributed consensus data

---

## 🎯 Primary Mapping: `memory_store` Table

### Table Structure (Inferred from Documentation)

```sql
CREATE TABLE memory_store (
    id TEXT PRIMARY KEY,          -- Unique identifier
    key TEXT NOT NULL,            -- Memory key
    value TEXT NOT NULL,          -- Stored content (JSON)
    namespace TEXT,               -- Domain isolation (e.g., "concepts", "decisions")
    type TEXT,                    -- Memory type (concept, decision, task, etc.)
    created_at TIMESTAMP,         -- Creation timestamp
    updated_at TIMESTAMP,         -- Last update timestamp
    ttl INTEGER,                  -- Time-to-live in seconds (optional)
    tags TEXT,                    -- JSON array of tags
    metadata TEXT,                -- JSON object for additional data
    embedding BLOB                -- 1024-dim hash-based embedding
);

CREATE INDEX idx_namespace ON memory_store(namespace);
CREATE INDEX idx_type ON memory_store(type);
CREATE INDEX idx_tags ON memory_store(tags);
```

### Value Field Structure (JSON)

```json
{
  "content": "The actual markdown or text content",
  "relationships": [
    {
      "type": "related_to|depends_on|blocks|part_of",
      "target_id": "mem-002",
      "target_key": "wikilinks-concept"
    }
  ],
  "properties": {
    "confidence": "high|medium|low",
    "priority": "critical|high|medium|low",
    "status": "active|draft|completed|deferred"
  }
}
```

---

## 🗺️ Complete Field Mapping

### Claude-Flow `memory_store` → Weave-NN Node

| Claude-Flow Field | Type | Weave-NN Equivalent | Transformation |
|-------------------|------|---------------------|----------------|
| `id` | TEXT | N/A (filename as ID) | Use `key` for filename |
| `key` | TEXT | Filename (kebab-case) | Direct copy: `knowledge-graph` → `knowledge-graph.md` |
| `value.content` | TEXT | Markdown body | Direct copy, preserve formatting |
| `namespace` | TEXT | Folder path | Map: `concepts` → `concepts/`, `decisions` → `decisions/` |
| `type` | TEXT | `type` (frontmatter) | Direct copy or map to node type |
| `created_at` | TIMESTAMP | `created_date` | ISO format: `2025-10-20` |
| `updated_at` | TIMESTAMP | `last_updated` | ISO format: `2025-10-20` |
| `ttl` | INTEGER | N/A | Ignore (not applicable to persistent nodes) |
| `tags` | TEXT (JSON) | `tags` (frontmatter array) | Parse JSON array → YAML array |
| `metadata` | TEXT (JSON) | Various frontmatter fields | Parse JSON → individual YAML fields |
| `value.relationships` | JSON | Wikilinks `[[target]]` | Convert relationships → wikilinks in markdown |
| `value.properties.*` | JSON | Frontmatter fields | Map: `confidence`, `priority`, `status` |
| `embedding` | BLOB | N/A (regenerate) | Don't sync embeddings, regenerate as needed |

---

## 📋 Namespace Mapping

### Claude-Flow Namespace → Weave-NN Folder

| Namespace | Weave-NN Folder | Node Type Template |
|-----------|-----------------|-------------------|
| `concepts` | `concepts/` | `concept-node-template.md` |
| `decisions` | `decisions/[category]/` | `decision-node-template.md` |
| `questions` | `meta/open-questions/` | `question-node-template.md` |
| `tasks` | `_planning/phases/` | Todo items (not full nodes) |
| `notes` | Contextual (based on type) | `note-node-template.md` |
| `workflows` | `workflows/` | `workflow-node-template.md` |
| `platforms` | `platforms/` | `platform-node-template.md` |
| `technical` | `technical/` | `technical-node-template.md` |
| `features` | `features/` | `feature-node-template.md` |
| `sessions` | `_planning/daily-logs/` | Log format |
| `events` | `_planning/daily-logs/` | Event entries in logs |
| `patterns` | `workflows/` or `concepts/` | Pattern documentation |

---

## 🔄 Transformation Functions

### 1. Memory → Node Creation

**Input**: Claude-Flow memory entry
**Output**: Weave-NN markdown file

```javascript
function memoryToNode(memory) {
  // Determine folder from namespace
  const folder = namespaceToFolder(memory.namespace);

  // Parse value JSON
  const value = JSON.parse(memory.value);
  const metadata = JSON.parse(memory.metadata || '{}');
  const tags = JSON.parse(memory.tags || '[]');

  // Determine node ID based on type
  const nodeId = generateNodeId(memory.type, memory.key);

  // Build YAML frontmatter
  const frontmatter = {
    [`${memory.type}_id`]: nodeId,
    [`${memory.type}_name`]: keyToTitle(memory.key),
    type: memory.type,
    status: value.properties?.status || 'active',
    created_date: formatDate(memory.created_at),
    last_updated: formatDate(memory.updated_at),
    tags: tags,
    ...metadata,
    ...value.properties
  };

  // Convert relationships to wikilinks
  const wikilinks = value.relationships?.map(rel => {
    return `[[${rel.target_key}]]`;
  }) || [];

  // Build markdown content
  const markdown = buildMarkdown(frontmatter, value.content, wikilinks);

  // Write file
  const filePath = `${folder}/${memory.key}.md`;
  writeFile(filePath, markdown);

  return filePath;
}
```

---

### 2. Node → Memory Update

**Input**: Weave-NN markdown file
**Output**: Claude-Flow memory update

```javascript
function nodeToMemory(filePath) {
  // Read file
  const fileContent = readFile(filePath);

  // Parse frontmatter and content
  const { frontmatter, content } = parseFrontmatter(fileContent);

  // Extract wikilinks
  const wikilinks = extractWikilinks(content);

  // Convert to relationships
  const relationships = wikilinks.map(link => ({
    type: 'related_to',
    target_key: link,
    target_id: null  // Resolved by Claude-Flow
  }));

  // Determine namespace from folder
  const namespace = folderToNamespace(path.dirname(filePath));

  // Build value JSON
  const value = {
    content: content,
    relationships: relationships,
    properties: {
      confidence: frontmatter.confidence,
      priority: frontmatter.priority,
      status: frontmatter.status
    }
  };

  // Build metadata JSON
  const metadata = {
    source: 'weave-nn',
    file_path: filePath,
    ...extractMetadata(frontmatter)
  };

  // Update memory via MCP
  updateMemory({
    key: path.basename(filePath, '.md'),
    namespace: namespace,
    type: frontmatter.type,
    value: JSON.stringify(value),
    tags: JSON.stringify(frontmatter.tags),
    metadata: JSON.stringify(metadata),
    updated_at: new Date().toISOString()
  });
}
```

---

### 3. Relationship Sync

**Bidirectional Link Maintenance**

```javascript
function syncRelationships(memory) {
  const value = JSON.parse(memory.value);

  // For each relationship, ensure bidirectional link exists
  for (const rel of value.relationships || []) {
    const targetMemory = getMemory(rel.target_id);
    const targetValue = JSON.parse(targetMemory.value);

    // Check if reverse relationship exists
    const hasReverseLink = targetValue.relationships?.some(r =>
      r.target_id === memory.id
    );

    if (!hasReverseLink) {
      // Add bidirectional link
      targetValue.relationships.push({
        type: reverseRelationType(rel.type),
        target_id: memory.id,
        target_key: memory.key
      });

      updateMemory({
        id: targetMemory.id,
        value: JSON.stringify(targetValue)
      });
    }
  }
}
```

---

## 🧪 Example Transformations

### Example 1: Concept Memory → Node

**Claude-Flow Memory**:
```json
{
  "id": "mem-001",
  "key": "knowledge-graph",
  "namespace": "concepts",
  "type": "concept",
  "value": {
    "content": "A knowledge graph is a structured representation of knowledge using nodes and edges...",
    "relationships": [
      {
        "type": "related_to",
        "target_id": "mem-002",
        "target_key": "wikilinks"
      },
      {
        "type": "part_of",
        "target_id": "mem-003",
        "target_key": "weave-nn"
      }
    ],
    "properties": {
      "confidence": "high",
      "status": "active"
    }
  },
  "tags": ["concept", "core", "knowledge-graph"],
  "metadata": {
    "category": "core-concept",
    "complexity": "moderate"
  },
  "created_at": "2025-10-20T10:00:00Z",
  "updated_at": "2025-10-20T14:30:00Z"
}
```

**Weave-NN Node** (`concepts/knowledge-graph.md`):
```yaml
---
concept_id: "C-001"
concept_name: "Knowledge Graph"
type: concept
status: active
category: core-concept
created_date: "2025-10-20"
last_updated: "2025-10-20"
complexity: moderate
confidence: high

related:
  - "[[wikilinks]]"
  - "[[weave-nn]]"

tags:
  - concept
  - core
  - knowledge-graph
---

# Knowledge Graph

A knowledge graph is a structured representation of knowledge using nodes and edges...







## Related

[[claude-flow-tight-coupling]]
## Related

[[phase-5-claude-flow-integration]]
## Related

[[mcp-integration-hub]]
## Related
- [[wikilinks]]
- [[weave-nn]]
```

---

### Example 2: Decision Memory → Node

**Claude-Flow Memory**:
```json
{
  "id": "mem-010",
  "key": "frontend-framework",
  "namespace": "decisions.technical",
  "type": "decision",
  "value": {
    "content": "## Question\nShould we use React or Svelte?\n\n## Options\n...",
    "relationships": [
      {
        "type": "blocks",
        "target_id": "mem-011",
        "target_key": "graph-visualization-library"
      },
      {
        "type": "depends_on",
        "target_id": "mem-005",
        "target_key": "project-scope"
      }
    ],
    "properties": {
      "status": "open",
      "priority": "critical",
      "confidence": "medium",
      "decision_type": "technical"
    }
  },
  "tags": ["decision", "technical", "critical", "open"],
  "metadata": {
    "decision_maker": "Mathew",
    "stakeholders": ["Development Team"],
    "research_status": "in-progress"
  },
  "created_at": "2025-10-20T09:00:00Z",
  "updated_at": "2025-10-20T16:00:00Z"
}
```

**Weave-NN Node** (`decisions/technical/frontend-framework.md`):
```yaml
---
decision_id: "TS-1"
decision_type: technical
title: "Frontend Framework"
status: open
priority: critical
category: architecture
created_date: "2025-10-20"
last_updated: "2025-10-20"
decided_date: null
decision_maker: "Mathew"
stakeholders:
  - "Development Team"
research_status: "in-progress"
confidence: medium

blocks:
  - "[[graph-visualization-library]]"
requires:
  - "[[project-scope]]"

tags:
  - decision
  - technical
  - critical
  - open
---

# TS-1: Frontend Framework

## Question
Should we use React or Svelte?

## Options
...
```

---

## 🔌 MCP Integration Points

### 1. Memory Store Tool

**Tool**: `store_memory`
**Direction**: Claude-Flow ← Weave-NN
**Trigger**: When node is created or updated in Weave-NN

```javascript
// MCP Tool Call
mcp.call('store_memory', {
  action: 'store',
  key: 'knowledge-graph',
  value: JSON.stringify({
    content: '...',
    relationships: [...],
    properties: {...}
  }),
  namespace: 'concepts',
  type: 'concept',
  tags: JSON.stringify(['concept', 'core']),
  metadata: JSON.stringify({...}),
  ttl: null  // Persistent
});
```

---

### 2. Query Memory Tool

**Tool**: `query_memory`
**Direction**: Claude-Flow → Weave-NN
**Trigger**: When AI needs to read memories

```javascript
// MCP Tool Call
const memories = mcp.call('query_memory', {
  action: 'query',
  pattern: '*graph*',  // Wildcard search
  namespace: 'concepts',
  limit: 10
});

// Convert each memory to node reference
memories.forEach(mem => {
  const nodePath = `${mem.namespace}/${mem.key}.md`;
  // Ensure node exists or create it
});
```

---

### 3. Semantic Search Tool

**Tool**: `semantic_search_memory`
**Direction**: Claude-Flow → Weave-NN
**Trigger**: When AI searches for related concepts

```javascript
// MCP Tool Call
const related = mcp.call('semantic_search_memory', {
  query: 'knowledge graph visualization',
  namespace: 'concepts',
  limit: 5,
  min_similarity: 0.7
});

// Returns memories ranked by similarity (MMR ranking)
// Can suggest wikilinks to add to current node
```

---

## 🎯 Sync Strategies (Weaver Workflows)

### Strategy 1: Real-Time Workflow-Based Sync (MVP Approach)

**When**: File watcher triggers workflows immediately on file changes

**Architecture**:
```
[File Change] → [chokidar] → [triggerWorkflow()] → [Durable Workflow] → [Shadow Cache + Obsidian]
```

**Pros**:
- ✅ Always up-to-date
- ✅ Stateful execution (crash recovery)
- ✅ Shadow cache for fast queries
- ✅ Automatic validation and linking
- ✅ No separate "sync" - workflows handle everything

**Implementation**:
```typescript
// Weaver file watcher
import { watch } from 'chokidar';
import { triggerWorkflow } from '@workflowdev/sdk';

const watcher = watch(config.vaultPath, {
  ignored: /(^|[\/\\])\../, // Hidden files
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100,
  },
});

watcher.on('add', async (filePath) => {
  if (filePath.endsWith('.md')) {
    await triggerWorkflow('vault-file-created', {
      filePath: path.relative(config.vaultPath, filePath),
      absolutePath: filePath,
      timestamp: Date.now(),
    });
  }
});

watcher.on('change', async (filePath) => {
  if (filePath.endsWith('.md')) {
    await triggerWorkflow('vault-file-updated', {
      filePath: path.relative(config.vaultPath, filePath),
      absolutePath: filePath,
      timestamp: Date.now(),
    });
  }
});
```

**Key Difference**: No "sync to Claude-Flow" - **markdown files ARE the memory**. Workflows maintain shadow cache and ensure graph integrity.

---

### Strategy 2: Git-Triggered Workflow Batch (Alternative)

**When**: Git commit triggers batch workflow processing

**Use Case**: For environments where real-time file watching is not desired

**Implementation**:
```bash
#!/bin/bash
# .git/hooks/post-commit

# Get changed markdown files
CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD | grep '\.md$')

# Trigger batch workflow
curl -X POST http://localhost:3000/api/workflows/batch-process \
  -H "Content-Type: application/json" \
  -d "{\"files\": [$(echo "$CHANGED_FILES" | jq -R -s -c 'split("\n")[:-1]')]}"
```

---

### Strategy 3: On-Demand Shadow Cache Rebuild

**When**: Manual rebuild of shadow cache from vault files

**Use Case**: Initial setup or cache corruption recovery

**Implementation**:
```typescript
// Weaver CLI command
export const rebuildShadowCacheWorkflow = workflow(
  'rebuild-shadow-cache',
  async (ctx, input: { vaultPath: string }) => {
    // Step 1: List all markdown files
    const files = await ctx.step('list-files', async () => {
      return await glob('**/*.md', { cwd: input.vaultPath });
    });

    // Step 2: Clear existing cache
    await ctx.step('clear-cache', async () => {
      await shadowCache.clear();
    });

    // Step 3: Process each file (batched)
    await ctx.step('process-files', async () => {
      for (const file of files) {
        await triggerWorkflow('vault-file-created', {
          filePath: file,
          absolutePath: path.join(input.vaultPath, file),
          timestamp: Date.now(),
        });
      }
    });

    return { filesProcessed: files.length };
  }
);
```

---

## 🚨 Edge Cases & Handling

### Edge Case 1: Conflicting Updates

**Scenario**: Node updated in Weave-NN while memory updated in Claude-Flow simultaneously

**Handling**:
- Use `updated_at` timestamps to determine latest
- Last-write-wins strategy
- Store both versions, prompt user to merge
- Log conflict in `_planning/daily-logs/`

---

### Edge Case 2: Deleted Node

**Scenario**: User deletes node in Weave-NN

**Handling**:
- Mark memory as `deleted: true` in metadata (soft delete)
- Keep memory for 30 days (configurable TTL)
- AI can suggest recreating if referenced
- Permanent delete after TTL expires

---

### Edge Case 3: Broken Wikilink

**Scenario**: Wikilink points to non-existent node

**Handling**:
- Create relationship with `target_id: null`
- Mark relationship as `unresolved: true`
- AI can suggest creating missing node
- Validate wikilinks on sync

---

### Edge Case 4: Namespace Migration

**Scenario**: Node moved from `concepts/` to `technical/`

**Handling**:
- Update memory `namespace` field
- Update `metadata.file_path`
- Maintain `key` (filename stays same)
- Update relationships in linked memories

---

## 📊 Metrics & Monitoring

### Sync Health Metrics

- **Sync lag**: Time between node update and memory update
- **Conflict rate**: % of syncs with conflicts
- **Error rate**: % of failed sync operations
- **Coverage**: % of nodes that have memory entries

### Performance Metrics

- **Sync duration**: Time to sync one node
- **Batch size**: Number of nodes synced together
- **MCP latency**: Time for MCP call to complete
- **Embedding generation**: Time to create embeddings (if needed)

---

## 🔗 Related Documentation

### Integration
- [[claude-flow-memory-visualization|Memory Visualization]]
- [[ai-agent-integration|AI Agent Integration]]
- [[model-context-protocol|MCP Protocol]]
- [[agent-rules|MCP Agent Rules]] (to be created)

### Planning
- [[../_planning/phases/phase-4-claude-flow-integration|Phase 4: Claude-Flow Integration]]

### Workflows
- [[../workflows/node-creation-process|Node Creation Process]]
- [[../workflows/suggestion-pattern|Suggestion Pattern]]

---

## 🚀 Implementation Roadmap

### Phase 4.1: Schema Research ✅
- [x] Research Claude-Flow v2.7 memory structure
- [x] Document table schemas
- [x] Create field-by-field mapping
- [x] Identify transformation functions

### Phase 4.2: Sync Prototype
- [ ] Implement `memoryToNode()` function
- [ ] Implement `nodeToMemory()` function
- [ ] Test with 5-10 sample nodes
- [ ] Verify bidirectional sync

### Phase 4.3: MCP Agent Rules
- [ ] Draft 6 MCP agent rules (see [[agent-rules]])
- [ ] Test each rule independently
- [ ] Integrate with Claude-Flow

### Phase 4.4: Production Deployment
- [ ] Choose sync strategy (recommend batch)
- [ ] Implement git hooks
- [ ] Add error handling and logging
- [ ] Monitor sync health metrics

---

**Status**: Active - Ready for implementation
**Owner**: Phase 4 Team
**Priority**: Critical - Foundational for AI-managed knowledge graph
**Last Updated**: 2025-10-20
