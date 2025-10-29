---
type: integration-spec
status: draft
priority: critical
created_date: '2025-10-20'
tags:
  - claude-flow
  - memory
  - visualization
  - mcp
  - integration
related:
  - '[[ai-agent-integration]]'
  - '[[model-context-protocol]]'
  - '[[../_planning/phases/phase-4-claude-flow-integration]]'
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-integration-spec
    - status-draft
    - priority-critical
version: '3.0'
updated_date: '2025-10-28'
---

# Claude-Flow Memory Visualization

**Purpose**: Visualize what Claude-Flow is storing in memory and how it maps to Weave-NN nodes.

**Status**: ✅ **ACTIVE** - Memory structure understood, workflow integration defined
**Phase**: MVP (Claude-Flow Integration)

---

## 🎯 Objective

> Visualize the Claude-Flow memory system to understand:
> - What data is being stored
> - How it's structured
> - How we achieve 1:1 parity with Weave-NN nodes
> - **How Weaver workflows maintain this parity**

---

## 🧠 Claude-Flow Memory Structure (To Research)

### Current Understanding (Hypothetical)
```yaml
# What we think Claude-Flow stores:
memory_entry:
  id: "unique-identifier"
  type: "concept|decision|task|note|conversation"
  content: "The actual information"
  timestamp: "2025-10-20T14:30:00Z"
  tags: ["tag1", "tag2"]
  relationships:
    - type: "related_to"
      target_id: "another-memory-id"
    - type: "depends_on"
      target_id: "prerequisite-memory-id"
  metadata:
    confidence: "high|medium|low"
    source: "user|ai|external"
    context: "Additional context"
  embeddings: [vector array for semantic search]
```

### Questions to Answer
- [ ] What fields does claude-flow actually use?
- [ ] How are relationships stored?
- [ ] Is there a graph structure or flat list?
- [ ] How are embeddings handled?
- [ ] What metadata is tracked?
- [ ] How is memory retrieved?
- [ ] How is memory updated or invalidated?

---

## 🗺️ Memory → Node Mapping

### Proposed 1:1 Parity Mapping

| Claude-Flow Memory | Weave-NN Node | Transformation |
|-------------------|---------------|----------------|
| `id` | `concept_id` (frontmatter) | Direct copy |
| `type` | `type` (frontmatter) | Map types (see below) |
| `content` | Markdown body | Convert to markdown |
| `timestamp` | `created_date` (frontmatter) | ISO format |
| `tags` | `tags` (frontmatter) | Direct array copy |
| `relationships` | Wikilinks `[[target]]` | Parse and create links |
| `metadata.confidence` | `confidence` (frontmatter) | For questions/suggestions |
| `metadata.source` | `author` (frontmatter) | Map: user → name, ai → "Claude" |
| `embeddings` | External vector DB | Store separately, reference by ID |

---

## 📊 Type Mapping

### Memory Type → Node Folder

| Claude-Flow Type | Weave-NN Folder | Node Type |
|-----------------|-----------------|-----------|
| `concept` | `concepts/` | `concept` |
| `decision` | `decisions/` | `decision` |
| `question` | `meta/open-questions/` | `question` |
| `task` | `_planning/` | `todo` |
| `note` | Varies | `note` |
| `conversation` | `_planning/daily-logs/` | `log` |
| `process` | `workflows/` | `workflow` |
| `platform` | `platforms/` | `platform` |
| `technical` | `technical/` | `technical` |
| `feature` | `features/` | `feature` |

---

## 🔄 Weaver Workflow Integration (MVP)

### Key Principle: Markdown Files ARE the Memory

**Critical Insight**: There is NO separate Claude-Flow memory database. The Obsidian markdown files ARE the memory that Claude-Flow uses.

```
┌─────────────────────────────────────────┐
│   Obsidian Vault = Claude-Flow Memory  │
│                                         │
│   concepts/knowledge-graph.md           │
│   decisions/technical/frontend.md       │
│   features/F-001-graph-viz.md           │
│                                         │
│   This IS the single source of truth   │
└─────────────────────────────────────────┘
```

### Claude-Flow → Weave-NN (AI Creates Node via MCP)

**Workflow**: `vault-file-created`

```mermaid
graph TB
    A[Claude-Flow agent calls create_note MCP tool] --> B[Weaver MCP Server]
    B --> C[ObsidianAPIClient writes .md file]
    C --> D[File watcher detects new file]
    D --> E[Triggers vault-file-created workflow]
    E --> F[Step 1: Parse frontmatter]
    F --> G[Step 2: Validate schema]
    G --> H[Step 3: Update shadow cache]
    H --> I[Step 4: Extract wikilinks]
    I --> J[Step 5: Ensure bidirectional links]
    J --> K[Step 6: Generate embeddings]
    K --> L[Obsidian graph updates]
```

**Durable Workflow Code**:
```typescript
export const vaultFileCreatedWorkflow = workflow(
  'vault-file-created',
  async (ctx, input: { filePath: string; absolutePath: string; timestamp: number }) => {
    // Step 1: Read file (resumable)
    const content = await ctx.step('read-file', async () => {
      return await readFile(input.absolutePath, 'utf-8');
    });

    // Step 2: Parse frontmatter
    const { frontmatter, body } = await ctx.step('parse-frontmatter', async () => {
      return parseFrontmatter(content);
    });

    // Step 3: Update shadow cache (Claude-Flow memory index)
    await ctx.step('update-shadow-cache', async () => {
      await shadowCache.upsertNode({
        filePath: input.filePath,
        nodeType: frontmatter.type || 'note',
        frontmatter,
        tags: structure.tags,
        links: structure.links,
        updatedAt: new Date(input.timestamp),
      });
    });

    // Step 4: Extract wikilinks (Claude-Flow relationships)
    const wikilinks = await ctx.step('extract-links', async () => {
      return Array.from(body.matchAll(/\[\[([^\]]+)\]\]/g), m => m[1]);
    });

    // Step 5: Ensure bidirectional links
    await ctx.step('ensure-bidirectional-links', async () => {
      for (const link of wikilinks) {
        await ctx.child('ensure-bidirectional-link', {
          sourceFile: input.filePath,
          targetLink: link
        });
      }
    });

    return { success: true };
  }
);
```

### Weave-NN → Claude-Flow (User Edits Node in Obsidian)

**Workflow**: `vault-file-updated`

```mermaid
graph TB
    A[User edits node in Obsidian] --> B[File watcher detects change]
    B --> C[Triggers vault-file-updated workflow]
    C --> D[Step 1: Get previous state from cache]
    D --> E[Step 2: Read updated file]
    E --> F[Step 3: Parse new content]
    F --> G[Step 4: Detect changes]
    G --> H[Step 5: Update shadow cache]
    H --> I[Step 6: Process new links]
    I --> J[Step 7: Handle status changes]
    J --> K[Step 8: Update embeddings]
    K --> L[Claude-Flow sees updated memory]
```

**Durable Workflow Code**:
```typescript
export const vaultFileUpdatedWorkflow = workflow(
  'vault-file-updated',
  async (ctx, input: { filePath: string; absolutePath: string; timestamp: number }) => {
    // Step 1: Get previous state
    const previousState = await ctx.step('get-previous-state', async () => {
      return await shadowCache.getNode(input.filePath);
    });

    // Step 2: Read updated file
    const content = await ctx.step('read-file', async () => {
      return await readFile(input.absolutePath, 'utf-8');
    });

    // Step 3: Parse content
    const { frontmatter, body } = await ctx.step('parse-frontmatter', async () => {
      return parseFrontmatter(content);
    });

    // Step 4: Detect changes
    const changes = await ctx.step('detect-changes', async () => {
      return {
        statusChanged: previousState?.frontmatter.status !== frontmatter.status,
        oldStatus: previousState?.frontmatter.status,
        newStatus: frontmatter.status,
        tagsAdded: frontmatter.tags?.filter(t => !previousState?.tags.includes(t)) || [],
        tagsRemoved: previousState?.tags.filter(t => !frontmatter.tags?.includes(t)) || [],
      };
    });

    // Step 5: Update shadow cache (Claude-Flow memory index)
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

    return { success: true, changes };
  }
);
```

---

## 📋 Memory Visualization Canvas (To Create)

**Canvas**: `canvas/claude-flow-memory-visualization.canvas`

**Should show**:
1. **Memory Store Structure**
   - How memories are organized
   - Hierarchy or flat structure?
   - Indexes or search mechanisms

2. **Example Memories**
   - Show 3-5 example memory entries
   - With all fields populated
   - Show relationships between them

3. **Mapping to Nodes**
   - Visual arrows showing field mapping
   - Transformation rules
   - Edge cases

4. **Sync Mechanism**
   - Real-time vs batch
   - Event triggers
   - Error handling

---

## 🔍 What We Need to Visualize

### 1. Memory Structure
**Goal**: See the actual data structure

**Visualization**:
```
Claude-Flow Memory Store
├── Memory 1: "Knowledge Graph Concept"
│   ├── id: "mem-001"
│   ├── type: "concept"
│   ├── content: "A knowledge graph is..."
│   ├── tags: ["knowledge-graph", "core-concept"]
│   ├── relationships:
│   │   └── related_to: "mem-002" (wikilinks)
│   └── metadata:
│       ├── confidence: "high"
│       └── source: "ai"
│
├── Memory 2: "Wikilinks Concept"
│   ├── id: "mem-002"
│   ├── type: "concept"
│   ├── content: "Wikilinks connect..."
│   ├── tags: ["wikilinks", "linking"]
│   ├── relationships:
│       ├── related_to: "mem-001" (knowledge-graph)
│       └── part_of: "mem-003" (knowledge-graph-system)
│   └── metadata:
│       └── source: "ai"
│
└── Memory 3: "TS-1 Decision"
    ├── id: "mem-003"
    ├── type: "decision"
    ├── content: "Need to decide frontend framework..."
    ├── tags: ["decision", "frontend", "critical"]
    ├── relationships:
    │   ├── blocks: "mem-004" (ts-2)
    │   └── depends_on: "mem-005" (project-scope)
    └── metadata:
        ├── confidence: "medium"
        ├── status: "open"
        └── priority: "critical"
```

**Weave-NN Equivalent**:
```
concepts/knowledge-graph.md
concepts/wikilinks.md
decisions/technical/frontend-framework.md
```

---

### 2. Relationship Graph
**Goal**: See how memories connect

**Canvas Visualization**:
```
[Memory: Knowledge Graph] ←→ [Memory: Wikilinks]
         ↓                            ↓
    [Memory: Obsidian]       [Memory: Bidirectional Linking]
         ↓                            ↓
[Memory: Platform Choice]    [Memory: Graph Visualization]
```

**Becomes in Weave-NN**:
```
[[knowledge-graph]] ←→ [[wikilinks]]
         ↓                     ↓
    [[obsidian]]      [[bidirectional-linking]]
         ↓                     ↓
[[platform-choice]]   [[graph-visualization]]
```

---

### 3. Memory Timeline
**Goal**: See when memories were created/updated

**Visualization**:
```
2025-10-20 09:00: Memory created "Project Scope"
2025-10-20 10:30: Memory created "Knowledge Graph"
2025-10-20 11:00: Memory created "Wikilinks"
2025-10-20 11:15: Memory updated "Knowledge Graph" (linked to Wikilinks)
2025-10-20 14:00: Memory created "TS-1 Decision"
2025-10-20 14:30: Memory created "Obsidian Platform"
```

**Correlates to git history**:
```bash
git log --oneline
6293ee5 feat: Add Canvas system
2d0d0b3 feat: Initialize knowledge graph
```

---

### 4. Memory by Type
**Goal**: See distribution of memory types

**Visualization**:
```
Concepts:   ████████████ 12 entries
Decisions:  ████ 4 entries
Questions:  ██████ 6 entries
Tasks:      ████████ 8 entries
Notes:      ████ 4 entries
Workflows:  ██ 2 entries
```

**Maps to Weave-NN folders**:
```
concepts/     12 nodes
decisions/    4 nodes
questions/    6 nodes
_planning/    8 todos
workflows/    2 nodes
```

---

## 🧪 Test Cases for Visualization

### Test 1: Create Memory in Claude-Flow
**Action**: AI creates concept memory for "Temporal Queries"
**Expected**: Node created at `concepts/temporal-queries.md`
**Verify**:
- [ ] File exists
- [ ] YAML frontmatter correct
- [ ] Content matches memory
- [ ] Tags match
- [ ] Wikilinks created from relationships

### Test 2: Update Node in Weave-NN
**Action**: User edits `concepts/temporal-queries.md` in Obsidian
**Expected**: Claude-Flow memory updated
**Verify**:
- [ ] Memory content updated
- [ ] Relationships updated if wikilinks changed
- [ ] Metadata updated (last_updated timestamp)

### Test 3: Relationship Creation
**Action**: User adds `[[graphiti]]` wikilink to temporal-queries node
**Expected**: Claude-Flow creates relationship
**Verify**:
- [ ] Relationship added to memory
- [ ] Bidirectional if applicable
- [ ] Both memories reference each other

---

## 🎯 Deliverables for Phase 4

### Documentation
- [ ] Complete Claude-Flow memory schema documentation
- [ ] Create detailed mapping specification
- [ ] Document all transformation rules
- [ ] Create visualization canvas

### Visualization
- [ ] Canvas showing memory structure
- [ ] Canvas showing relationship graph
- [ ] Timeline visualization (optional: Mermaid or canvas)
- [ ] Type distribution chart

### Testing
- [ ] Manual test: Create memory → verify node
- [ ] Manual test: Update node → verify memory
- [ ] Manual test: Add relationship → verify link
- [ ] Document test results

---

## 📚 Research Tasks

### Priority 1: Understand Claude-Flow Memory
- [ ] Access claude-flow documentation
- [ ] Review memory storage code (if open source)
- [ ] Run claude-flow locally and inspect memory
- [ ] Export memory and analyze structure
- [ ] Identify all fields and their purposes

### Priority 2: Map to Weave-NN
- [ ] Create exact field mapping
- [ ] Define transformation functions
- [ ] Identify edge cases
- [ ] Plan for future schema changes

### Priority 3: Visualize
- [ ] Create canvases showing structure
- [ ] Document with examples
- [ ] Test with real data
- [ ] Iterate based on learnings

---

## 💡 Open Questions

### Q-MEMORY-001: Is claude-flow memory persistent or in-memory only?
**Options**:
- [ ] A: Persistent (stored in DB or files) - Can sync
- [ ] B: In-memory (lost on restart) - Need different approach
- [ ] C: Hybrid (some persistent, some temporary)

**Research needed**: Test claude-flow restart behavior

---

### Q-MEMORY-002: Can we access claude-flow memory directly or only via MCP?
**Options**:
- [ ] A: Direct access (read files/DB) - Easier sync
- [ ] B: Only via MCP tools - Limited to what MCP exposes
- [ ] C: Both options available

**Research needed**: Check claude-flow architecture

---

### Q-MEMORY-003: How are embeddings generated and stored?
**Options**:
- [ ] A: Claude-flow generates and stores them - Can reuse
- [ ] B: External service (OpenAI, etc.) - Need API access
- [ ] C: Not used in claude-flow - We add separately

**Research needed**: Inspect memory entries for embeddings

---

## 🔗 Related Documentation

### Integration
- [[model-context-protocol|MCP Protocol]]
- [[ai-agent-integration|AI Agent Integration]]
- [[servers/cyanheads-obsidian-mcp-server|Obsidian MCP Server]]
- [[../_planning/phases/phase-4-claude-flow-integration|Phase 4 Plan]]

### Visualization
- [[../canvas/architecture-claude-flow-integration|Integration Architecture]] (to create)
- [[../canvas/claude-flow-memory-structure|Memory Structure]] (to create)

---

## 🚀 Next Steps

1. **Research claude-flow** - Understand memory structure
2. **Create visualization canvas** - Show memory structure visually
3. **Document mapping** - Complete field-by-field mapping
4. **Test sync** - Verify bidirectional updates work
5. **Iterate** - Refine based on what we learn

---

**Status**: Draft - Needs research
**Owner**: Phase 4 team
**Priority**: Critical for 1:1 parity
