---
title: Obsidian Native Integration Analysis
type: architecture-analysis
status: active
phase_id: PHASE-2
tags:
  - scope/mvp
  - type/architecture
  - status/active
  - priority/critical
  - tech/obsidian
  - tech/python
  - category/integration
  - analysis
  - phase/phase-2
  - status/draft
priority: critical
visual:
  icon: puzzle
  color: '#50E3C2'
  cssclasses:
    - type-architecture
    - scope-mvp
    - priority-critical
    - tech-obsidian
updated: '2025-10-29T04:55:03.475Z'
version: '3.0'
keywords:
  - "\U0001F3AF tight coupling philosophy"
  - related
  - "\U0001F4C1 obsidian data storage deep dive"
  - vault structure
  - key insights
  - "\U0001F517 obsidian uri protocol"
  - standard obsidian uri actions
  - advanced uri plugin (extended capabilities)
  - "\U0001F4A1 tight coupling strategies"
  - 'strategy 1: mcp tools via obsidian uri (not file system)'
---

# Obsidian Native Integration Analysis

**Purpose**: Analyze Obsidian's native data storage format and URI capabilities to achieve maximum "tight coupling" between Weave-NN and Obsidian, ensuring we work WITH Obsidian's conventions rather than against them.

**Key Insight**: By deeply understanding Obsidian's internals, we can eliminate unnecessary abstraction layers and build MCP tools that feel native to Obsidian users.

**Date**: 2025-10-21
**Related**: [[obsidian-first-architecture|Obsidian-First Architecture]]

---

## 🎯 Tight Coupling Philosophy

**Current Approach**: Obsidian vault + Python MCP backend
**Enhanced Approach**: Obsidian vault + MCP tools that leverage Obsidian's native APIs and conventions

**Benefits**:
1. ✅ Zero impedance mismatch (files = knowledge graph nodes)
2. ✅ Use Obsidian's metadata cache (instant search)
3. ✅ Leverage Obsidian URI (external automation)
4. ✅ Work with .obsidian folder (native config)
5. ✅ Support Obsidian plugins (Advanced URI, Tasks, Dataview)

---











## Related

[[developer-onboarding]]
## Related

[[phase-2-documentation-capture]]
## Related

[[rabbitmq-message-queue]]
## Related

[[github-issues-integration]]
## Related

[[cross-project-knowledge-retention]]
## 📁 Obsidian Data Storage Deep Dive

### Vault Structure

```
my-vault/                         # Root folder (vault)
├── .obsidian/                    # Configuration folder (Obsidian-managed)
│   ├── workspace.json            # Current workspace layout
│   ├── workspaces.json           # Saved workspaces
│   ├── app.json                  # App settings
│   ├── appearance.json           # Theme settings
│   ├── hotkeys.json              # Keyboard shortcuts
│   ├── core-plugins.json         # Enabled core plugins
│   ├── community-plugins.json    # Enabled community plugins
│   ├── plugins/                  # Plugin data folders
│   │   ├── obsidian-tasks/       # obsidian-tasks plugin data
│   │   ├── dataview/             # Dataview plugin data
│   │   └── advanced-uri/         # Advanced URI settings
│   ├── themes/                   # Installed themes
│   ├── snippets/                 # CSS snippets
│   └── graph.json                # Graph view settings
├── concepts/                     # User content (our structure)
├── features/
├── decisions/
├── _planning/
└── README.md
```

### Key Insights

**1. .obsidian Folder**
- ✅ **Hidden by default** (period-prefixed on Unix)
- ✅ **Vault-specific** - Each vault has independent config
- ✅ **Git-ignorable** - workspace.json changes frequently
- ✅ **Plugin data** - Plugins store state here
- ⚠️ **Not for user content** - Only Obsidian and plugins should write here

**Recommendation for Weave-NN**:
- Store MCP server config in `.obsidian/plugins/weave-nn/`
- Store agent memory cache in `.obsidian/plugins/weave-nn/memory.db`
- Store embeddings in `.obsidian/plugins/weave-nn/embeddings/`
- **DO NOT** write to .obsidian root (Obsidian may overwrite)

**2. Vault ID**
- Each vault has unique 16-char ID (e.g., `ef6ca3e3b524d22f`)
- Stored per folder on computer
- Used for Obsidian URI vault selection
- **Not in any file** - stored in Obsidian's app data

**MCP Tool Opportunity**:
```python
# Get vault ID for URI construction
def get_vault_id(vault_path: str) -> str:
    # Parse from Obsidian app data or use vault name
    pass
```

**3. Metadata Cache**
- Obsidian maintains IndexedDB cache of file metadata
- Powers: Graph view, Outline, Backlinks, Search
- Updated on file changes
- Fast queries (no file parsing needed)

**MCP Integration Strategy**:
- ⚡ **Watch for .obsidian/workspace.json changes** (signals file edits)
- ⚡ **Trigger MCP sync on workspace updates** (agent rules)
- ⚡ **Use Obsidian's cache for fast queries** (via URI or plugin API)

**4. IndexedDB Backend**
- Low-level client-side database
- Stores: Sync state, metadata cache
- Persists between app sessions
- **Not directly accessible** from Python MCP server

**Implication**: We must use file-based sync, not IndexedDB direct access

---

## 🔗 Obsidian URI Protocol

### Standard Obsidian URI Actions

Obsidian provides native URI protocol for external automation:

#### 1. Open Vault
```
obsidian://open?vault=my-vault
obsidian://open?vault=ef6ca3e3b524d22f  # Using vault ID
```

#### 2. Open File
```
obsidian://open?vault=my-vault&file=concepts/knowledge-graph.md
obsidian://open?vault=my-vault&file=concepts%2Fknowledge-graph  # URL encoded
```

#### 3. Search
```
obsidian://search?vault=my-vault&query=temporal+queries
```

#### 4. Create New Note
```
obsidian://new?vault=my-vault&name=my-new-note
obsidian://new?vault=my-vault&path=concepts/my-new-concept
```

### Advanced URI Plugin (Extended Capabilities)

**Plugin**: [obsidian-advanced-uri](https://github.com/Vinzent03/obsidian-advanced-uri)

**Why Critical for Weave-NN**: Enables MCP server to **write** to Obsidian vault programmatically without file system access conflicts.

#### Core Actions

**1. Append to File**
```
obsidian://adv-uri?vault=my-vault&filepath=daily-log.md&mode=append&data=New%20log%20entry
```

**Use Case**: Claude agents append to daily log without opening file

**2. Prepend to File**
```
obsidian://adv-uri?vault=my-vault&filepath=tasks.md&mode=prepend&data=-%20%5B%20%5D%20New%20task
```

**Use Case**: Add urgent task to top of task file

**3. Append Clipboard to Daily Note**
```
obsidian://adv-uri?vault=my-vault&daily=true&clipboard=true&mode=append
```

**Use Case**: Quick capture from external apps

**4. Open Specific Heading**
```
obsidian://adv-uri?vault=my-vault&filepath=architecture.md&heading=Technical%20Stack
```

**Use Case**: Deep links from agent suggestions

**5. Open Block by ID**
```
obsidian://adv-uri?vault=my-vault&filepath=notes.md&block=abc123
```

**Use Case**: Precise context navigation

**6. Search and Replace**
```
obsidian://adv-uri?vault=my-vault&filepath=feature.md&search=old-term&replace=new-term
```

**Use Case**: Bulk refactoring from agents

**7. Execute Command**
```
obsidian://adv-uri?vault=my-vault&commandid=workspace:export-pdf
obsidian://adv-uri?vault=my-vault&filepath=note.md&commandid=editor:toggle-checklist-status
```

**Use Case**: Trigger Obsidian commands from MCP tools

**8. Frontmatter Manipulation**
```
obsidian://adv-uri?vault=my-vault&filepath=note.md&frontmatterkey=status&frontmattervalue=completed
```

**Use Case**: Update node status from agent workflows

**9. Create File from Template**
```
obsidian://adv-uri?vault=my-vault&filepath=new-concept.md&data=file:templates/concept-template.md
```

**Use Case**: Agent creates nodes using templates

**10. Open Workspace**
```
obsidian://adv-uri?vault=my-vault&workspace=Planning
```

**Use Case**: Switch to planning workspace for client review

---

## 💡 Tight Coupling Strategies

### Strategy 1: MCP Tools via Obsidian URI (Not File System)

**Problem**: Direct file writes from Python may conflict with Obsidian's in-memory state

**Solution**: Use Advanced URI for all writes

```python
# MCP tool implementation
def create_note(vault: str, path: str, content: str, frontmatter: dict):
    """Create note using Obsidian URI instead of file system write"""

    # 1. Build frontmatter string
    fm = "---\n"
    for key, value in frontmatter.items():
        fm += f"{key}: {value}\n"
    fm += "---\n\n"

    # 2. Combine frontmatter + content
    full_content = fm + content

    # 3. URL encode
    encoded_content = urllib.parse.quote(full_content)
    encoded_path = urllib.parse.quote(path)

    # 4. Construct URI
    uri = f"obsidian://adv-uri?vault={vault}&filepath={encoded_path}&data={encoded_content}"

    # 5. Execute URI (opens Obsidian, creates file)
    os.system(f'xdg-open "{uri}"')  # Linux
    # OR: webbrowser.open(uri)  # Cross-platform

    return {"status": "created", "path": path, "uri": uri}
```

**Benefits**:
- ✅ No file conflicts (Obsidian handles write)
- ✅ Obsidian updates metadata cache automatically
- ✅ Works even if file is open in editor
- ✅ Triggers Obsidian events (plugins can react)

### Strategy 2: Store MCP Data in .obsidian/plugins/

**Current Approach**: Store embeddings/memory in separate folder
**Enhanced Approach**: Store in `.obsidian/plugins/weave-nn/`

```
.obsidian/plugins/weave-nn/
├── data.json                    # Plugin settings
├── memory.db                    # Claude-Flow SQLite memory
├── embeddings/                  # Semantic search embeddings
│   ├── concepts.index
│   ├── features.index
│   └── decisions.index
├── cache/                       # MCP query cache
│   ├── graph_stats.json
│   ├── orphan_nodes.json
│   └── broken_links.json
└── logs/                        # Agent operation logs
    ├── 2025-10-21.log
    └── errors.log
```

**Benefits**:
- ✅ Follows Obsidian plugin conventions
- ✅ Hidden from user (not in main vault view)
- ✅ Git-ignorable (add to .gitignore)
- ✅ Per-vault isolation (different vaults = different data)

### Strategy 3: Respect Obsidian's Metadata Cache

**Don't**: Parse markdown files on every query
**Do**: Use Obsidian URI search or workspace.json monitoring

```python
# BAD: Slow, redundant with Obsidian cache
def find_nodes_with_tag(tag: str):
    results = []
    for file in glob("**/*.md"):
        content = read_file(file)
        if f"tags:\n  - {tag}" in content:
            results.append(file)
    return results

# GOOD: Use Obsidian search via URI
def find_nodes_with_tag(vault: str, tag: str):
    uri = f"obsidian://search?vault={vault}&query=tag:#{tag}"
    # Trigger search in Obsidian
    os.system(f'xdg-open "{uri}"')
    # OR: Build our own cache that mirrors Obsidian's structure
```

**Better: Maintain Shadow Cache**
```python
# Build cache from file watcher events (mirrors Obsidian cache)
class MetadataCache:
    def __init__(self):
        self.cache = {}  # {filepath: {frontmatter, tags, links, headings}}

    def on_file_changed(self, filepath: str):
        # Parse file
        frontmatter, content = parse_markdown(filepath)

        # Extract metadata
        metadata = {
            "frontmatter": frontmatter,
            "tags": extract_tags(frontmatter, content),
            "links": extract_wikilinks(content),
            "headings": extract_headings(content),
            "backlinks": self.find_backlinks(filepath),
        }

        # Update cache
        self.cache[filepath] = metadata

    def find_nodes_with_tag(self, tag: str):
        return [fp for fp, meta in self.cache.items() if tag in meta["tags"]]
```

**Benefits**:
- ⚡ Fast queries (no file parsing)
- ⚡ In sync with Obsidian (file watcher)
- ⚡ Can query offline (no Obsidian URI needed)

### Strategy 4: Git Integration via .obsidian/workspace.json Monitoring

**Insight**: Obsidian updates `workspace.json` on every file open/edit

**Use Case**: Auto-commit workflow

```python
# Watch workspace.json for changes
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ObsidianWorkspaceWatcher(FileSystemEventHandler):
    def __init__(self, vault_path: str):
        self.workspace_json = os.path.join(vault_path, ".obsidian/workspace.json")
        self.last_modified = 0

    def on_modified(self, event):
        if event.src_path == self.workspace_json:
            current_time = os.path.getmtime(self.workspace_json)

            # Debounce (only trigger if 5 seconds since last change)
            if current_time - self.last_modified > 5:
                self.last_modified = current_time

                # User likely finished editing, trigger auto-commit
                self.auto_commit()

    def auto_commit(self):
        # Git add all changed .md files
        os.system("git add **/*.md")

        # Generate commit message from changed files
        changed = subprocess.check_output(["git", "diff", "--name-only", "--staged"]).decode()
        files = changed.strip().split("\n")

        if len(files) == 1:
            msg = f"Updated {files[0]}"
        else:
            msg = f"Updated {len(files)} notes"

        # Commit
        os.system(f'git commit -m "{msg}"')
```

**Benefits**:
- ✅ Auto-commit after editing session (not every keystroke)
- ✅ Uses Obsidian's own state change signal
- ✅ No polling needed (event-driven)

### Strategy 5: Local REST API Plugin (CRITICAL - Game Changer!)

**Plugin**: [obsidian-local-rest-api](https://github.com/coddingtonbear/obsidian-local-rest-api)

**Why Critical**: Eliminates need for Obsidian URI and file system access — provides direct REST API to Obsidian vault!

**Key Capabilities**:
- ✅ **CRUD operations** - Create, read, update, delete notes via HTTP
- ✅ **List vault contents** - Query files and folders
- ✅ **Periodic notes** - Create/fetch daily notes programmatically
- ✅ **Execute commands** - Trigger any Obsidian command via API
- ✅ **PATCH support** - Insert content into specific note sections
- ✅ **Secure** - API key authentication, HTTPS interface

**Architecture Impact**: **THIS CHANGES EVERYTHING**

**Before (URI-based)**:
```python
# Complex: Build URI, URL encode, trigger via OS
uri = f"obsidian://adv-uri?vault={vault}&filepath={path}&data={encoded_content}"
os.system(f'xdg-open "{uri}"')
```

**After (REST API)**:
```python
# Simple: Direct HTTP POST
import requests

API_KEY = os.getenv("OBSIDIAN_API_KEY")
OBSIDIAN_API = "https://localhost:27124"

def create_note(path: str, content: str, frontmatter: dict):
    """Create note via REST API"""
    headers = {"Authorization": f"Bearer {API_KEY}"}

    # Build full content
    fm = "---\n" + yaml.dump(frontmatter) + "---\n\n"
    full_content = fm + content

    # POST to API
    response = requests.post(
        f"{OBSIDIAN_API}/vault/{path}",
        headers=headers,
        json={"content": full_content}
    )

    return response.json()
```

**MCP Tools (REST API-based)**:
```python
# File operations
def mcp_create_note(path, content, frontmatter):
    return requests.post(f"{API}/vault/{path}", json={...})

def mcp_read_note(path):
    return requests.get(f"{API}/vault/{path}")

def mcp_update_note(path, updates):
    return requests.put(f"{API}/vault/{path}", json={...})

def mcp_delete_note(path):
    return requests.delete(f"{API}/vault/{path}")

def mcp_list_notes(pattern=None):
    return requests.get(f"{API}/vault/", params={"pattern": pattern})

# Advanced operations
def mcp_patch_note_section(path, section_heading, content):
    """Insert content into specific section using PATCH"""
    return requests.patch(f"{API}/vault/{path}", json={
        "heading": section_heading,
        "content": content
    })

def mcp_execute_command(command_id):
    """Execute any Obsidian command"""
    return requests.post(f"{API}/commands/{command_id}")

def mcp_create_daily_note(date=None):
    """Create daily note for specific date"""
    return requests.post(f"{API}/periodic/daily/", json={"date": date})
```

**Benefits Over URI Approach**:
- ✅ **Simpler** - No URL encoding, no OS-specific URI handling
- ✅ **Faster** - Direct HTTP (no shell execution overhead)
- ✅ **Synchronous** - Get immediate response (URI is fire-and-forget)
- ✅ **Error handling** - HTTP status codes (URI has no feedback)
- ✅ **Secure** - API key auth (URI is open)
- ✅ **Cross-platform** - HTTP works everywhere (URI varies by OS)

**Recommendation**: **USE REST API as PRIMARY, URI as FALLBACK**

### Strategy 6: Mehrmaid Plugin for Knowledge Graph Visualization (CRITICAL)

**Plugin**: [obsidian-mehrmaid](https://github.com/huterguier/obsidian-mehrmaid)

**Why Critical**: Enables rich, interactive knowledge graph visualizations WITH Obsidian markdown inside nodes!

**Key Capabilities**:
- ✅ **Markdown in Mermaid** - Images, LaTeX, tables, links inside graph nodes
- ✅ **Internal links** - Wikilinks work inside graph nodes (clickable navigation!)
- ✅ **Rich formatting** - Embed code blocks, task lists, etc. in nodes
- ✅ **Auto-sizing** - Obsidian renderer estimates node size for proper layout

**Use Cases for Weave-NN**:

**1. Decision Tree Visualization**
```markdown
```mehrmaid
graph TD
    A["**ED-1: Project Scope**<br/>📅 2025-10-20<br/>Status: ✅ Decided<br/><br/>Selected: **SaaS** (Option B)"]
    A --> B["**TS-1: Frontend Framework**<br/>❌ Obsolete<br/><br/>Reason: Using Obsidian directly"]
    A --> C["**TS-2: Graph Viz**<br/>✅ Decided<br/><br/>Selected: **Obsidian native**"]
```
```

**2. Feature Dependency Graph**
```markdown
```mehrmaid
graph LR
    F001["**F-001: Knowledge Graph Viz**<br/>![](graph-icon.png)<br/><br/>- Obsidian native graph<br/>- Custom filters<br/>- Color coding"]
    F008["**F-008: Git Integration**<br/><br/>$$commits = \sum_{i=1}^{n} changes_i$$<br/><br/>[[git-integration]]"]
    F001 --> F008
```
```

**3. Agent Workflow Visualization**
```markdown
```mehrmaid
graph TD
    A["**User edits note**<br/>📝 concepts/knowledge-graph.md"]
    A --> B["**workspace.json updated**<br/>`{lastEditedFile: ...}`"]
    B --> C["**File watcher triggers**<br/>Python watchdog event"]
    C --> D["**MCP sync agent**<br/><br/>- Parse frontmatter<br/>- Extract wikilinks<br/>- Update cache"]
    D --> E["**Claude-Flow memory**<br/><br/>$$embedding = hash(content)$$"]
```
```

**MCP Integration**: Agents can **generate** Mehrmaid diagrams!

```python
def mcp_create_decision_tree_visualization(decision_id: str):
    """Generate Mehrmaid diagram from decision nodes"""

    # 1. Query related decisions
    decision = read_note(f"decisions/{decision_id}.md")
    related = find_related_decisions(decision)

    # 2. Build Mehrmaid graph
    mermaid = "```mehrmaid\ngraph TD\n"

    for node in [decision] + related:
        # Extract metadata
        status_emoji = {"decided": "✅", "open": "❓", "deferred": "⏸️"}[node.status]

        # Build node label with Obsidian markdown
        label = f'''["{status_emoji} **{node.title}**<br/>
        📅 {node.date}<br/>
        Status: {node.status}<br/><br/>
        [[{node.id}|View Details]]"]'''

        mermaid += f"    {node.id}{label}\n"

        # Add edges
        for dep in node.dependencies:
            mermaid += f"    {node.id} --> {dep}\n"

    mermaid += "```\n"

    # 3. Create visualization note
    create_note(
        path=f"visualizations/{decision_id}-tree.md",
        content=mermaid,
        frontmatter={"type": "visualization", "source": decision_id}
    )
```

**Benefits for Weave-NN**:
- ✅ **Rich context** - Show metadata, status, links in graph nodes
- ✅ **Interactive** - Click wikilinks to navigate
- ✅ **Agent-generated** - Claude agents create visualizations automatically
- ✅ **Mathematical** - LaTeX for technical documentation (algorithms, formulas)

### Strategy 7: Custom Obsidian Plugin for MCP Status (v1.1)

**Future Enhancement**: Lightweight Weave-NN plugin for status display

**Plugin Capabilities**:
- Show MCP server status (connected/disconnected)
- Display agent activity (real-time)
- Show Git sync status (commits, push/pull)
- Trigger manual sync (button)
- View agent suggestions (inline)

**Benefits**:
- ✅ Native Obsidian UI (status bar, commands)
- ✅ Real-time MCP server connection
- ✅ File change events (Obsidian → MCP)
- ✅ User can trigger manual sync
- 🔮 **Deferred to v1.1** (MVP uses REST API + file watcher instead)

---

## 🎯 Revised MCP Architecture (Maximum Tight Coupling)

### Architecture Evolution

**V1: Loose Coupling (File System)**:
```
Obsidian Desktop (User edits files)
    ↓
File System (markdown files)
    ↓
Python File Watcher (polls for changes)
    ↓
MCP Server (parses files, maintains cache)
    ↓
Claude Agents (query via MCP tools)
```
**Issues**: File conflicts, slow polling, no feedback

**V2: Tight Coupling (Obsidian URI)**:
```
Obsidian Desktop (User edits files)
    ↓
.obsidian/workspace.json (Obsidian updates)
    ↓
Python Workspace Watcher (event-driven)
    ↓
MCP Server (uses Obsidian URI for writes, maintains shadow cache)
    ↓
Claude Agents (query cache, write via URI)
    ↓
Obsidian URI (agents trigger file operations)
    ↓
Obsidian Desktop (updates UI, metadata cache)
```
**Better**: Event-driven, no conflicts, but URI is async/unreliable

**V3: MAXIMUM Tight Coupling (REST API)** ✅ **RECOMMENDED**:
```
Obsidian Desktop (User edits files)
    ↓
Local REST API Plugin (https://localhost:27124)
    ↓
MCP Server (HTTP client, event webhooks)
    ↓
Claude Agents (query/write via REST)
    ↓
REST API (synchronous, secure, error handling)
    ↓
Obsidian Desktop (updates UI, metadata cache)
```

**Key Advantages of REST API Approach**:
1. ✅ **Synchronous** - Get immediate response (success/error)
2. ✅ **Simpler** - No URL encoding, OS-specific handling
3. ✅ **Faster** - Direct HTTP (no shell overhead)
4. ✅ **Error handling** - HTTP status codes + JSON errors
5. ✅ **Secure** - API key authentication
6. ✅ **Cross-platform** - HTTP works everywhere
7. ✅ **No file conflicts** - Obsidian handles all writes
8. ✅ **Atomic operations** - PATCH for section updates

---

## 📋 Implementation Checklist (REVISED - REST API First)

### Prerequisites (Day 0)

**Install Required Obsidian Plugins**:
- [ ] **obsidian-local-rest-api** (CRITICAL)
  - Install from Community Plugins
  - Generate API key
  - Configure HTTPS (default: https://localhost:27124)
  - Test API access: `curl https://localhost:27124/vault/`
  - Documentation: https://coddingtonbear.github.io/obsidian-local-rest-api/

- [ ] **obsidian-mehrmaid** (HIGH PRIORITY)
  - Install from Community Plugins
  - Test rendering: Create note with mehrmaid graph
  - Verify wikilinks work inside nodes

- [ ] **obsidian-tasks** (CRITICAL - Already planned)
  - Install from Community Plugins
  - Configure global filter settings
  - Test task queries

- [ ] **obsidian-advanced-uri** (FALLBACK - If REST API issues)
  - Install from Community Plugins
  - Test basic URI actions

### Week 1 Updates (REVISED)

**Day 1-2: MCP Server Core (REST API-based)** ✅ **MAJOR CHANGE**
- [ ] FastAPI project structure
- [ ] MCP SDK integration
- [ ] **NEW: Obsidian REST API client**
  - Python `requests` library
  - API key authentication
  - Error handling (retry logic, timeouts)
  - Connection health check
  - Base class: `ObsidianRESTClient`

- [ ] **NEW: MCP File Operations via REST**
  - `create_note(path, content, frontmatter)` → POST `/vault/{path}`
  - `read_note(path)` → GET `/vault/{path}`
  - `update_note(path, content)` → PUT `/vault/{path}`
  - `delete_note(path)` → DELETE `/vault/{path}`
  - `list_notes(pattern)` → GET `/vault/`
  - `patch_note_section(path, heading, content)` → PATCH `/vault/{path}`

- [ ] **NEW: MCP Search & Query via REST**
  - `search_vault(query)` → Search endpoint (if available)
  - `list_vault_files()` → GET `/vault/`
  - `get_active_file()` → Get current file (if API supports)

- [ ] **KEEP: Shadow metadata cache** (for fast queries)
  - Watch for file changes via API polling or webhooks
  - Parse frontmatter, tags, links, headings
  - Store in `.obsidian/plugins/weave-nn/metadata.db`
  - Query cache for instant results (don't hit API every time)

**Day 3-4: Claude-Flow Integration (REST-based)** ✅ **ENHANCED**
- [ ] Claude-Flow hive mind connection
- [ ] Store memory in `.obsidian/plugins/weave-nn/memory.db`
- [ ] Agent rules implementation (6 rules)
- [ ] **NEW: Agent writes use REST API** (not URI, not file system)
  - All `create_note` → REST POST
  - All `update_note` → REST PUT
  - All `append_to_note` → REST PATCH (append mode)

- [ ] **NEW: Agent can execute Obsidian commands via REST**
  - `execute_command(command_id)` → POST `/commands/{command_id}`
  - Examples:
    - Export to PDF: `execute_command("workspace:export-pdf")`
    - Toggle dark mode: `execute_command("theme:toggle-dark-mode")`

**Day 5: Git Integration (workspace.json monitoring)** ✅ **NO CHANGE**
- [ ] Git CLI wrapper (GitPython)
- [ ] Auto-commit triggered by workspace.json changes (debounced 5 seconds)
- [ ] Pre-commit validation (YAML, wikilinks)

**Day 6-7: Mehrmaid Visualization Generator** ✅ **NEW FEATURE**
- [ ] **Agent-generated Mehrmaid diagrams**
  - `generate_decision_tree(decision_id)` → Creates mehrmaid visualization
  - `generate_feature_dependency_graph()` → Shows feature relationships
  - `generate_agent_workflow_diagram()` → Visualizes agent rules

- [ ] **Mehrmaid template system**
  - Decision tree template
  - Feature graph template
  - Workflow diagram template
  - Agent can fill in templates with data from vault

- [ ] **Test Mehrmaid rendering**
  - Verify wikilinks clickable
  - Verify LaTeX rendering (if needed)
  - Verify images embedded

### Week 2 Updates (Add to existing plan)

**Day 8-9: Task Management** ✅ **NO MAJOR CHANGES**
- [ ] obsidian-tasks plugin configured
- [ ] MCP task tools via REST API:
  - `list_tasks(filter)` → Parse task files via GET requests
  - `create_task(title, metadata, file_path)` → PATCH append task
  - `update_task(task_id, updates)` → PATCH update specific line
  - `complete_task(task_id)` → PATCH replace `[ ]` with `[x]`

- [ ] Agent workflow: Daily task summary
- [ ] Agent workflow: Auto-create tasks from meeting notes

**Day 10-11: Obsidian Properties & Visualization**
- [ ] Document icon assignments (Lucide icons)
- [ ] Create CSS classes for graph colors
- [ ] Apply tags to all existing nodes
- [ ] **NEW: Generate vault-wide Mehrmaid visualizations**
  - All decisions (decision tree)
  - All features (dependency graph)
  - All architecture (layer diagram)

**Day 12-14: Client Project & Testing** ✅ **NO CHANGES**
- [ ] Set up `_projects/[client-name]/` structure
- [ ] Import existing client documentation via REST API
- [ ] Run agents on client project
- [ ] Test full workflow (create → edit → task → commit)
- [ ] Generate project dashboard with Mehrmaid visualizations
- [ ] Documentation & polish

### Fallback Strategy (If REST API Issues)

**IF obsidian-local-rest-api has problems**:
1. Fall back to Obsidian URI (Advanced URI plugin)
2. Use file system direct access (with file locking)
3. Hybrid: Read from file system, write via URI

**Order of preference**:
1. ✅ **REST API** (best: synchronous, secure, error handling)
2. ⚡ **Obsidian URI** (good: no conflicts, but async)
3. ⚠️ **File system** (last resort: fast but conflicts possible)

---

## 🔗 Related Documentation

### Architecture
- [[obsidian-first-architecture|Obsidian-First Architecture]] - Original design
- [[data-knowledge-layer|Data & Knowledge Layer]] - Storage design

### Features
- [[git-integration|Git Integration]] - Version control
- [[obsidian-tasks-integration|Obsidian Tasks]] - Task management

### External Resources
- [Obsidian Data Storage](https://help.obsidian.md/data-storage)
- [Obsidian URI](https://help.obsidian.md/Extending+Obsidian/Obsidian+URI)
- [Advanced URI Plugin](https://github.com/Vinzent03/obsidian-advanced-uri)
- [Obsidian Plugin API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)

---

## 💡 Key Insights (REVISED)

### 1. ✅ **REST API > URI > File System** (Critical Discovery!)
**Problem**: Python MCP server writing files directly → conflicts with open files in Obsidian
**Evolution**:
- ❌ **File System** - Fast but conflicts possible
- ⚡ **Obsidian URI** - No conflicts but async, no feedback, OS-specific
- ✅ **REST API** - No conflicts, synchronous, secure, error handling, cross-platform

**Recommendation**: **Use obsidian-local-rest-api plugin as PRIMARY method**

### 2. .obsidian/workspace.json is the Heartbeat
**Insight**: workspace.json updates on every file open/edit → perfect event source
**Use Case**: Auto-commit trigger, agent sync trigger, cache invalidation
**Implementation**: Python file watcher on workspace.json (event-driven, not polling)

### 3. .obsidian/plugins/weave-nn/ is Our Home
**Convention**: Plugins store data in `.obsidian/plugins/{plugin-name}/`
**Benefit**: Follows Obsidian standards, git-ignorable, per-vault isolation
**Storage**:
- `memory.db` - Claude-Flow SQLite memory
- `metadata.db` - Shadow cache (frontmatter, tags, links)
- `embeddings/` - Semantic search indices
- `cache/` - MCP query cache
- `logs/` - Agent operation logs

### 4. Mehrmaid Unlocks Rich Visualizations (Game Changer!)
**Power**: Obsidian markdown INSIDE Mermaid graph nodes
**Features**: Wikilinks (clickable!), LaTeX, images, tables, formatting
**Use Cases**:
- Decision trees with status, dates, links
- Feature dependency graphs with metadata
- Agent workflow diagrams with code snippets
**Agent Integration**: Claude agents can **generate** Mehrmaid diagrams automatically!

### 5. Shadow Cache Mirrors Obsidian Cache (Performance)
**Why**: Obsidian's IndexedDB cache is not accessible from Python
**Solution**: Maintain our own cache (SQLite) that mirrors Obsidian's structure
**Sync**: REST API polling or file watcher keeps cache up-to-date
**Benefit**: Sub-100ms queries (no file parsing, no API calls)

---

## 🎯 Success Metrics (Tight Coupling)

### Must Achieve
- ✅ Zero file write conflicts (all writes via URI)
- ✅ Sub-100ms query performance (shadow cache)
- ✅ Event-driven sync (no polling, use workspace.json)
- ✅ MCP data in `.obsidian/plugins/weave-nn/`

### Nice to Have
- ⚡ Obsidian plugin for status display
- ⚡ Real-time agent activity log in Obsidian
- ⚡ Inline agent suggestions (UI integration)

---

**Status**: ✅ **Analysis Complete**
**Date**: 2025-10-21
**Impact**: Enhanced tight coupling reduces conflicts, improves performance, follows Obsidian conventions
**Next Steps**: Update MCP implementation plan to use Obsidian URI for all writes
