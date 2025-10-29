---
type: integration-spec
status: active
priority: critical
created_date: '2025-10-20'
tags:
  - claude-flow
  - tight-coupling
  - mcp
  - hive-mind
  - architecture
related:
  - '[[ai-agent-integration]]'
  - '[[model-context-protocol]]'
  - '[[agent-rules]]'
  - '[[../concepts/weave-nn]]'
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-integration-spec
    - status-active
    - priority-critical
version: '3.0'
updated_date: '2025-10-28'
---

# Claude-Flow Tight Coupling Architecture

**Purpose**: Define the TRUE architecture where Obsidian knowledge graph IS the Claude-Flow memory system - no sync needed, single source of truth.

**Status**: ✅ **ACTIVE** - Corrected approach
**Critical Insight**: **Obsidian markdown files = Claude-Flow memory store**

---

## 🎯 Core Principle

> **There is no separate memory system.**
> **The Obsidian knowledge graph markdown files ARE the memory.**
> **Claude-Flow agents read/write directly via MCP.**

---

## 🏗️ Architecture (MVP with Weaver)

### Single Source of Truth with Weaver Integration

```
┌─────────────────────────────────────────┐
│   Obsidian Vault (File System)         │
│                                         │
│   concepts/                             │
│   ├─ knowledge-graph.md                 │
│   ├─ wikilinks.md                       │
│   └─ temporal-queries.md                │
│                                         │
│   decisions/                            │
│   ├─ executive/                         │
│   │  └─ project-scope.md                │
│   └─ technical/                         │
│      └─ frontend-framework.md           │
│                                         │
│   This IS the memory store.             │
│   This IS the knowledge graph.          │
│   This IS what Claude-Flow uses.        │
└─────────────────────────────────────────┘
           ↕ (File System Monitoring)
┌─────────────────────────────────────────┐
│   Weaver Service (Node.js/TypeScript)  │
│                                         │
│   Components:                           │
│   ├─ File Watcher (chokidar)           │
│   ├─ Durable Workflows (workflow.dev)  │
│   ├─ Shadow Cache (SQLite)             │
│   ├─ MCP Server (@modelcontextprotocol) │
│   └─ ObsidianAPIClient                 │
│                                         │
│   Workflows:                            │
│   - vault-file-created                  │
│   - vault-file-updated                  │
│   - vault-file-deleted                  │
│   - analyze-linking-opportunities       │
│   - validate-node-schema                │
│   - extract-and-store-memories          │
│                                         │
│   Unified service, stateful workflows   │
└─────────────────────────────────────────┘
           ↕ (MCP Protocol)
┌─────────────────────────────────────────┐
│   Claude-Flow Hive Mind                 │
│                                         │
│   8 Worker Agents:                      │
│   - Researcher                          │
│   - Coder                               │
│   - Analyst                             │
│   - Tester                              │
│   - Architect                           │
│   - Reviewer                            │
│   - Optimizer                           │
│   - Documenter                          │
│                                         │
│   Byzantine Consensus Algorithm         │
│   for coordinated decision-making       │
│                                         │
│   Uses Weaver MCP tools to read/write  │
│   markdown files as memory entries      │
└─────────────────────────────────────────┘
```

**Key Addition**: **Weaver** acts as the intelligent middleware that:
- Monitors vault file changes with chokidar
- Triggers stateful, resumable workflows via workflow.dev
- Maintains shadow cache for fast queries
- Exposes MCP tools for Claude-Flow agents
- Handles all Claude API calls for AI-enhanced operations

---

## 🔄 How It Actually Works

### Scenario: AI Creates a Concept

**WRONG Approach (Separate memory system)**:
1. AI creates memory in Claude-Flow SQLite database
2. Sync process triggers
3. Memory is "converted" to markdown
4. File is written to Obsidian vault
5. Two sources of truth that must stay in sync ❌

**RIGHT Approach (Tight Coupling with Weaver)**:
1. AI agent calls Weaver MCP tool: `create_note("concepts/temporal-queries.md", content)`
2. Weaver MCP server writes file directly to vault via ObsidianAPIClient
3. File watcher (chokidar) detects new file
4. Weaver triggers `vault-file-created` workflow
5. Workflow executes:
   - **Step 1**: Parse frontmatter and content
   - **Step 2**: Validate schema (required fields for concept type)
   - **Step 3**: Update shadow cache (fast metadata index)
   - **Step 4**: Extract wikilinks for relationship tracking
   - **Step 5**: Generate embedding (optional, for semantic search)
6. Obsidian detects file change, updates graph view
7. Done. Single source of truth ✅

**Key Difference**: **No intermediate memory store. Markdown files ARE the memory. Weaver adds intelligent automation via durable workflows.**

---

### Scenario: AI Reads Related Concepts

**WRONG Approach (Separate memory system)**:
1. Query Claude-Flow memory database
2. Get memory entries
3. Sync checks if files match
4. Return data ❌

**RIGHT Approach (Tight Coupling with Weaver)**:
1. AI calls Weaver MCP tool: `search_knowledge_graph("knowledge graph")`
2. Weaver queries shadow cache (fast) OR ObsidianAPIClient search (comprehensive)
3. Returns matching files with excerpts and metadata
4. AI reads specific files via `read_note(path)`
5. Weaver returns parsed content (frontmatter + body)
6. AI has direct access to graph with intelligent caching ✅

**Key Addition**: Shadow cache provides fast metadata queries without scanning all files

---

### Scenario: Update Node Status

**WRONG Approach (Separate memory system)**:
1. Update memory in Claude-Flow database
2. Trigger sync
3. Update markdown file
4. Hope sync doesn't conflict ❌

**RIGHT Approach (Tight Coupling with Weaver)**:
1. AI calls Weaver MCP tool: `update_note("decisions/technical/frontend-framework.md", updates)`
2. Weaver updates file via ObsidianAPIClient (changes `status: open` → `status: decided`)
3. File watcher detects change
4. Weaver triggers `vault-file-updated` workflow
5. Workflow executes:
   - **Step 1**: Parse updated content
   - **Step 2**: Detect status change (open → decided)
   - **Step 3**: Update shadow cache with new metadata
   - **Step 4**: Check for impacted relationships (does this unblock other decisions?)
   - **Step 5**: Optionally trigger notifications or related updates
6. Obsidian graph reflects change immediately ✅

**Key Addition**: Durable workflows enable stateful processing with crash recovery

---

## 📋 MCP Tools = Memory Operations

### Claude-Flow "Memory" Operations Mapped to MCP Tools

| Memory Operation | MCP Tool | File System Action |
|------------------|----------|---------------------|
| Create memory | `create_note(path, content)` | Write new `.md` file |
| Read memory | `read_note(path)` | Read `.md` file |
| Update memory | `update_note(path, content)` | Overwrite `.md` file |
| Delete memory | `delete_note(path)` (or move to archive) | Delete/move `.md` file |
| Query memories | `search_vault(query)` | Grep across `.md` files |
| List memories by type | `list_notes(folder)` | List files in folder (concepts/, decisions/, etc.) |
| Get relationships | `get_links(path)` | Parse wikilinks from `.md` file |
| Add relationship | `append_to_note(path, link)` | Append wikilink to Related section |

**No separate database. No sync. Just direct file operations.**

---

## 🧠 Semantic Search via Embeddings

### Challenge
Claude-Flow has semantic search with embeddings, but markdown files don't have embedded vectors.

### Solution: Complementary Vector Index

```
┌─────────────────────────────────────────┐
│   Obsidian Vault (Primary Store)       │
│   concepts/knowledge-graph.md           │
│   → Content: "A knowledge graph is..."  │
│                                         │
│   This is the source of truth.          │
└─────────────────────────────────────────┘
           ↓ (on file change)
┌─────────────────────────────────────────┐
│   Vector Index (Secondary, Derived)     │
│   .weave-nn/embeddings.db (SQLite)      │
│                                         │
│   node_id | file_path | embedding       │
│   C-001   | concepts/  | [0.2, 0.5...]  │
│           | knowledge- |                 │
│           | graph.md   |                 │
│                                         │
│   This is auto-generated from files.    │
│   Can be deleted and rebuilt.           │
└─────────────────────────────────────────┘
```

**Key Principle**: Vector index is **derived** from markdown files, not the other way around.

**Workflow**:
1. AI creates/updates markdown file via MCP
2. File watcher detects change
3. Background process generates embedding
4. Embedding stored in local SQLite index (separate from content)
5. Semantic search queries this index, returns file paths
6. AI reads actual markdown files for content

**Source of truth**: Still the markdown files. Embeddings are just an index.

---

## 🎯 Agent Rules (Weaver Durable Workflows)

### Rule 1: Direct File Operations via Durable Workflows

**OLD**: Event-driven RuleEngine with RabbitMQ
**NEW**: Durable workflows with stateful execution

```typescript
// Weaver workflow for file creation
export const vaultFileCreatedWorkflow = workflow(
  'vault-file-created',
  async (ctx, input: { filePath: string; absolutePath: string; timestamp: number }) => {
    // Step 1: Read file content (can resume from here if crashed)
    const content = await ctx.step('read-file', async () => {
      return await readFile(input.absolutePath, 'utf-8');
    });

    // Step 2: Parse frontmatter
    const { frontmatter, body } = await ctx.step('parse-frontmatter', async () => {
      return parseFrontmatter(content);
    });

    // Step 3: Update shadow cache (atomic operation)
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

    // Step 4: Extract wikilinks
    const wikilinks = await ctx.step('extract-links', async () => {
      const regex = /\[\[([^\]]+)\]\]/g;
      return Array.from(body.matchAll(regex), m => m[1]);
    });

    // Step 5: Validate bidirectional links (calls another workflow)
    await ctx.step('ensure-bidirectional-links', async () => {
      for (const link of wikilinks) {
        await triggerWorkflow('ensure-bidirectional-link', {
          sourceFile: input.filePath,
          targetLink: link
        });
      }
    });

    return { success: true, wikilinks: wikilinks.length };
  }
);
```

**Key Advantage**: **Workflow persists state at each step. If Weaver crashes at Step 3, it resumes from Step 4 on restart.**

---

### Rule 2: Schema Validation via Workflow Steps

**Purpose**: Validate node structure during creation/update workflows

```typescript
// Integrated into vault-file-created workflow
await ctx.step('validate-schema', async () => {
  const nodeType = frontmatter.type || 'note';
  const validator = getValidatorForType(nodeType);

  const requiredFields = {
    concept: ['concept_id', 'concept_name', 'type', 'created_date'],
    decision: ['decision_id', 'title', 'status', 'created_date'],
    feature: ['feature_id', 'feature_name', 'status', 'release']
  };

  const required = requiredFields[nodeType];
  if (required) {
    const missing = required.filter(field => !frontmatter[field]);

    if (missing.length > 0) {
      logger.warn(`Missing fields in ${input.filePath}: ${missing.join(', ')}`);

      // Auto-fix: Add default values
      const updates = {};
      missing.forEach(field => {
        if (field === 'created_date') {
          updates[field] = new Date().toISOString().split('T')[0];
        } else if (field.endsWith('_id')) {
          updates[field] = `AUTO-${Date.now()}`;
        }
      });

      if (Object.keys(updates).length > 0) {
        await obsidianClient.updateFrontmatter(input.filePath, updates);
        return { fixed: true, updates };
      }
    }
  }

  return { valid: true };
});
```

---

### Rule 3: Bidirectional Link Maintenance via Dedicated Workflow

**Purpose**: Ensure bidirectional links when wikilinks are added

```typescript
export const ensureBidirectionalLinkWorkflow = workflow(
  'ensure-bidirectional-link',
  async (ctx, input: { sourceFile: string; targetLink: string }) => {
    // Step 1: Check if target exists
    const targetExists = await ctx.step('check-target', async () => {
      try {
        await obsidianClient.readNote(`${input.targetLink}.md`);
        return true;
      } catch (error) {
        return false;
      }
    });

    // Step 2: Create placeholder if target doesn't exist
    if (!targetExists) {
      await ctx.step('create-placeholder', async () => {
        await obsidianClient.createNote(`${input.targetLink}.md`, {
          frontmatter: {
            type: 'placeholder',
            created_date: new Date().toISOString().split('T')[0],
            tags: ['placeholder', 'auto-created']
          },
          content: `# ${input.targetLink}\n\n_This is a placeholder node. Add content here._`
        });
      });
    }

    // Step 3: Check if reverse link exists
    const hasReverseLink = await ctx.step('check-reverse-link', async () => {
      const targetContent = await obsidianClient.readNote(`${input.targetLink}.md`);
      const sourceBasename = path.basename(input.sourceFile, '.md');
      return targetContent.includes(`[[${sourceBasename}]]`);
    });

    // Step 4: Add reverse link if missing
    if (!hasReverseLink) {
      await ctx.step('add-reverse-link', async () => {
        const sourceBasename = path.basename(input.sourceFile, '.md');
        await obsidianClient.appendToNote(
          `${input.targetLink}.md`,
          `\n## Related\n- [[${sourceBasename}]]`,
          'related-section'
        );
      });
    }

    return { success: true, created: !targetExists, linked: !hasReverseLink };
  }
);
```

---

### Rule 4: Validation on Save

**Purpose**: Validate markdown file structure before committing changes

```yaml
rule_id: "file_validation"
purpose: "Ensure data quality"

trigger:
  - before_mcp_create_note()
  - before_mcp_update_note()

checks:
  - frontmatter_valid: YAML parseable
  - required_fields_present: based on node type
  - wikilinks_resolvable: all [[targets]] exist or flagged
  - no_duplicate_ids: across all files
  - content_min_length: >50 characters

actions:
  - if_invalid: abort with error message
  - if_valid: proceed with file write
```

---

### Rule 5: Semantic Index Update

**Purpose**: Keep embedding index in sync with file changes

```yaml
rule_id: "embedding_sync"
purpose: "Update vector index when files change"

trigger:
  - after_mcp_create_note()
  - after_mcp_update_note()

actions:
  - extract_content: parse markdown body
  - generate_embedding: use Claude-Flow hash-based embeddings (1024-dim)
  - update_index: insert/update in .weave-nn/embeddings.db
  - log: "Updated embedding for {file_path}"

note: "This runs async, doesn't block file writes"
```

---

### Rule 6: Auto-Discovery

**Purpose**: AI proactively identifies missing nodes and suggests creation

```yaml
rule_id: "auto_discovery"
purpose: "Grow graph by discovering gaps"

trigger:
  - on_research_complete
  - on_wikilink_broken

actions:
  - identify_missing: "AI mentioned X but no node exists"
  - suggest_creation: "Create [[X]] node? (type: {inferred_type})"
  - if_approved:
      - create_via_template
      - link_to_source
```

---

## 🔧 Configuration: Weave-NN Project Config

**File**: `.weave-nn/config.yaml` (created at project root)

```yaml
# Weave-NN Configuration
version: "1.0"

# Obsidian vault location
vault_path: "/mnt/d/weavelogic/weavelogic-nn/weave-nn"

# MCP Server
mcp:
  server: "cyanheads-obsidian"
  enabled: true

# Template directory
templates:
  path: "templates/"
  auto_apply: true

# Node ID generation
node_ids:
  concept: "C-{counter:3}"  # C-001, C-002, etc.
  decision: "{category_prefix}-{counter}"  # TS-1, ED-1, etc.
  feature: "F-{counter:3}"
  technical: "T-{counter:3}"
  platform: "P-{counter:3}"

# Validation rules
validation:
  required_frontmatter: [type, created_date, tags]
  min_tags: 2
  min_content_length: 50
  validate_on_save: true

# Embedding index
embeddings:
  enabled: true
  path: ".weave-nn/embeddings.db"
  dimensions: 1024
  method: "hash-based"  # Claude-Flow compatible
  update: "async"  # Don't block file writes

# Agent rules
agents:
  enabled: [
    "direct_file_operations",
    "template_application",
    "bidirectional_links",
    "file_validation",
    "embedding_sync",
    "auto_discovery"
  ]

# Git integration
git:
  auto_commit: false  # User commits manually
  commit_message_template: "feat({folder}): {action} [[{node_key}]]\n\n{details}\n\nCo-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 🎯 Claude-Flow Hive Mind Integration

### How the Hive Mind Uses the Graph

**Swarm Configuration** (from original prompt):
- 8 worker agents
- Byzantine consensus algorithm
- Objective: "Analyze and build weave-NN knowledge graph"

**Each Agent's Relationship to Graph**:

1. **Researcher**: Searches vault (`search_vault`), reads nodes (`read_note`)
2. **Coder**: Creates technical/platform nodes (`create_note`)
3. **Analyst**: Reads multiple nodes, finds patterns (`list_notes`, `get_links`)
4. **Tester**: Validates node structure (`file_validation` rule)
5. **Architect**: Creates decision nodes, maps relationships
6. **Reviewer**: Reads nodes, suggests improvements
7. **Optimizer**: Refactors nodes, consolidates duplicates
8. **Documenter**: Creates workflow/process nodes

**Consensus**: When creating/updating important nodes (decisions, architecture), swarm votes via Byzantine consensus.

---

### Agent Workflow Example

**Task**: "Research frontend framework options and create decision node"

```
┌─ Researcher Agent ──────────────────┐
│ 1. search_vault("React Svelte")     │
│ 2. read_note("technical/react.md")  │
│ 3. Gathers pros/cons                │
└──────────────────────────────────────┘
          ↓ (shares findings)
┌─ Analyst Agent ─────────────────────┐
│ 1. Analyzes trade-offs              │
│ 2. Identifies decision criteria     │
│ 3. Recommends structure              │
└──────────────────────────────────────┘
          ↓ (consensus vote)
┌─ Documenter Agent ──────────────────┐
│ 1. Loads decision-node-template.md  │
│ 2. Fills with Researcher data       │
│ 3. create_note("decisions/          │
│    technical/frontend-framework.md")│
└──────────────────────────────────────┘
          ↓ (file written)
┌─ Reviewer Agent ────────────────────┐
│ 1. read_note(new decision)           │
│ 2. Validates completeness            │
│ 3. Suggests improvements             │
└──────────────────────────────────────┘
          ↓ (if approved)
┌─ Optimizer Agent ───────────────────┐
│ 1. Adds bidirectional links          │
│ 2. Tags related nodes                │
│ 3. Updates impacted decisions        │
└──────────────────────────────────────┘
```

**Result**: Decision node created collaboratively, stored as markdown file, immediately visible in Obsidian graph.

---

## 💡 Key Insights

### Why This is Better

1. **Single Source of Truth**: Markdown files are authoritative. No sync conflicts.
2. **Human-Readable**: Users can edit in Obsidian, AI sees changes immediately.
3. **Version Control**: Git tracks all changes to markdown files.
4. **Platform-Independent**: Works with any tool that reads markdown.
5. **No Lock-In**: Not dependent on proprietary database format.
6. **Obsidian Native**: Graph view, backlinks, search all work out-of-the-box.
7. **MCP Direct Access**: AI agents read/write via MCP tools, no abstraction layer.

### What We Eliminated

- ❌ Separate SQLite memory database for content
- ❌ Sync process between memory and files
- ❌ Conflict resolution algorithms
- ❌ Duplicate data storage
- ❌ Schema translation layers

### What We Kept (as Complementary)

- ✅ Embedding index (derived from files, can be rebuilt)
- ✅ Git history (version control for files)
- ✅ MCP tools (interface for AI agents)
- ✅ Templates (consistency for new nodes)

---

## 🚀 Implementation Path

### Phase 4 (Revised)

1. **Configure MCP Server**: Set up Cyanheads Obsidian MCP with vault path
2. **Test Basic Operations**: AI creates a test node via `create_note`
3. **Implement Templates**: Load template, fill, write via MCP
4. **Add Validation**: Validate before file write
5. **Bidirectional Links**: Automatically add reverse links
6. **Embedding Index**: Generate embeddings on file change
7. **Hive Mind Integration**: Configure swarm agents to use MCP tools
8. **Testing**: End-to-end workflow with multiple agents

**No "sync" implementation needed. Just direct file operations.**

---

## 🔗 Related

- [[ai-agent-integration|AI Agent Integration]]
- [[model-context-protocol|MCP Protocol]]
- [[servers/cyanheads-obsidian-mcp-server|Cyanheads MCP Server]]
- [[../workflows/node-creation-process|Node Creation Process]]
- [[../concepts/weave-nn|Weave-NN Project]]

---

**Status**: Active - This is the correct architecture
**Owner**: Phase 4 Team
**Priority**: Critical
**Last Updated**: 2025-10-20

**Key Takeaway**: **Obsidian markdown = Claude-Flow memory. No sync. Direct access via MCP.**
