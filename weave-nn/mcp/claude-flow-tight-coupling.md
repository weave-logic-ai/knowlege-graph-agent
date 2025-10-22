---
type: integration-spec
status: active
priority: critical
created_date: "2025-10-20"
tags:
  - claude-flow
  - tight-coupling
  - mcp
  - hive-mind
  - architecture
related:
  - "[[ai-agent-integration]]"
  - "[[model-context-protocol]]"
  - "[[agent-rules]]"
  - "[[../concepts/weave-nn]]"
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

## 🏗️ Architecture (Corrected)

### Single Source of Truth

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
           ↕ (MCP Tools)
┌─────────────────────────────────────────┐
│   Cyanheads Obsidian MCP Server         │
│                                         │
│   Tools:                                │
│   - search_vault(query)                 │
│   - read_note(path)                     │
│   - create_note(path, content)          │
│   - update_note(path, content)          │
│   - list_notes(folder)                  │
│   - get_links(path)                     │
│   - append_to_note(path, content)       │
│                                         │
│   Direct file system access.            │
│   No intermediate database.             │
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
└─────────────────────────────────────────┘
```

---

## 🔄 How It Actually Works

### Scenario: AI Creates a Concept

**WRONG Approach (What we documented before)**:
1. AI creates memory in Claude-Flow SQLite database
2. Sync process triggers
3. Memory is "converted" to markdown
4. File is written to Obsidian vault
5. Two sources of truth that must stay in sync ❌

**RIGHT Approach (Tight Coupling)**:
1. AI agent calls MCP tool: `create_note("concepts/temporal-queries.md", content)`
2. Cyanheads MCP server writes file directly to disk
3. Obsidian detects file change, updates graph view
4. Done. Single source of truth ✅

**Key Difference**: **No intermediate memory store. Markdown files ARE the memory.**

---

### Scenario: AI Reads Related Concepts

**WRONG Approach**:
1. Query Claude-Flow memory database
2. Get memory entries
3. Sync checks if files match
4. Return data ❌

**RIGHT Approach**:
1. AI calls MCP tool: `search_vault("knowledge graph")`
2. MCP server uses grep/ripgrep on markdown files
3. Returns matching files with excerpts
4. AI reads files via `read_note(path)`
5. AI has direct access to graph ✅

---

### Scenario: Update Node Status

**WRONG Approach**:
1. Update memory in Claude-Flow database
2. Trigger sync
3. Update markdown file
4. Hope sync doesn't conflict ❌

**RIGHT Approach**:
1. AI calls MCP tool: `update_note("decisions/technical/frontend-framework.md", new_content)`
2. Uses Edit tool to change `status: open` → `status: decided`
3. File updated on disk
4. Obsidian graph reflects change immediately ✅

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

## 🎯 Agent Rules (Corrected)

### Rule 1: Direct File Operations

**OLD**: Sync memory ↔ nodes
**NEW**: Agents write directly to markdown files

```yaml
rule_id: "direct_file_operations"
purpose: "AI agents operate directly on markdown files via MCP"

actions:
  - on_concept_identified:
      - call: mcp.create_note({
          path: "concepts/{key}.md",
          content: build_from_template("concept-node-template", data)
        })
      - log: "Created concept node at {path}"

  - on_decision_made:
      - call: mcp.update_note({
          path: "decisions/technical/{key}.md",
          content: updated_frontmatter_and_body
        })
      - log: "Updated decision {path} status: {new_status}"

  - on_relationship_discovered:
      - call: mcp.append_to_note({
          path: source_node,
          content: "- [[{target_node}]]",
          section: "## Related"
        })
      - log: "Added link from {source} to {target}"
```

**No intermediate database. Direct file manipulation.**

---

### Rule 2: Template Application

**Purpose**: When AI creates a node, apply the appropriate template

```yaml
rule_id: "template_application"
purpose: "Ensure all nodes follow consistent structure"

actions:
  - determine_node_type: infer from context (concept, decision, feature, etc.)
  - load_template: read from templates/{type}-node-template.md
  - fill_template:
      - Replace placeholders with actual data
      - Generate ID (C-XXX, TS-XXX, F-XXX)
      - Set created_date: today
      - Suggest tags based on content
  - write_file: via MCP create_note()
```

---

### Rule 3: Bidirectional Link Maintenance

**Purpose**: When a wikilink is added, ensure reverse link exists

```yaml
rule_id: "bidirectional_links"
purpose: "Maintain graph connectivity"

trigger:
  - on_wikilink_added: "[[target]]" added to source.md

actions:
  - check_target_exists: mcp.read_note("target.md")
  - if_not_exists:
      - create_placeholder: via template
  - check_reverse_link: grep("\\[\\[{source}\\]\\]", target.md)
  - if_not_exists:
      - add_to_related: mcp.append_to_note(target.md, "- [[{source}]]")
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
