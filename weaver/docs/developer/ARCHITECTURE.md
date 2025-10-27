# Weaver Architecture

## System Overview

Weaver is a modular TypeScript application for Obsidian vault management with AI-powered features. It consists of several key subsystems:

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Server Layer                     │
│  (Model Context Protocol - Claude Desktop Integration)  │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│                 Core Application Layer                  │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │ Vault Init   │  │  Workflow  │  │  Shadow Cache  │  │
│  │   System     │  │   Engine   │  │    (SQLite)    │  │
│  └──────────────┘  └────────────┘  └────────────────┘  │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │  AI Agents   │  │    Git     │  │   File Watcher │  │
│  │  (Claude)    │  │ Auto-Commit│  │    (chokidar)  │  │
│  └──────────────┘  └────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│              Obsidian Vault (Filesystem)                │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Vault Initialization System (`src/vault-init/`)

**Purpose**: Create structured Obsidian vaults from templates

**Key Modules**:
- `VaultInitializer`: Main orchestrator
- `DirectoryScanner`: Fast directory traversal with .gitignore support
- `FrameworkDetector`: Analyze project structure
- `NodeGenerator`: Create MOC structure
- `FrontmatterGenerator`: YAML frontmatter templates
- `WikilinkBuilder`: Cross-reference generation

**Flow**:
```
1. Scan directory → 2. Detect framework → 3. Generate nodes
   ↓
4. Build MOC structure → 5. Create wikilinks → 6. Write vault
```

**Example**:
```typescript
const initializer = new VaultInitializer(config);
const vault = await initializer.initializeVault('/path/to/project');
await initializer.writeVault(vault, '/path/to/output');
```

### 2. Shadow Cache (`src/shadow-cache/`)

**Purpose**: Fast vault indexing with SQLite

**Database Schema**:
```sql
CREATE TABLE files (
  path TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  hash TEXT,
  modified INTEGER,
  size INTEGER,
  frontmatter TEXT  -- JSON serialized
);

CREATE TABLE tags (
  file_path TEXT,
  tag TEXT,
  FOREIGN KEY (file_path) REFERENCES files(path)
);

CREATE TABLE links (
  source_file TEXT,
  target_file TEXT,
  link_type TEXT,  -- 'wikilink' or 'markdown'
  FOREIGN KEY (source_file) REFERENCES files(path)
);
```

**Key Features**:
- Incremental updates (hash-based change detection)
- Full-text search
- Tag and link relationship queries
- Sub-100ms query performance

**API**:
```typescript
const cache = new ShadowCache(vaultPath);
await cache.syncVault();  // Initial sync
await cache.updateFile(path);  // Incremental update
const files = await cache.queryFiles({ tags: ['ai'] });
const links = await cache.searchLinks('source.md');
```

### 3. Workflow Engine (`src/workflow-engine/`)

**Purpose**: Event-driven note automation

**Architecture**:
```typescript
interface Workflow {
  id: string;
  name: string;
  triggers: string[];  // 'file:add', 'file:change', 'file:unlink'
  enabled: boolean;
  execute: (context: WorkflowContext) => Promise<void>;
}
```

**Built-in Workflows**:
- **file-change-logger**: Log all file events
- **markdown-analyzer**: Extract metadata on save
- **concept-tracker**: Track concept relationships
- **file-deletion-monitor**: Clean up orphaned links

**Execution Model**:
```
File Event → File Watcher → Workflow Registry → Matched Workflows
                                                        ↓
                                              Execute in parallel
                                                        ↓
                                            Update Shadow Cache
```

**Example Workflow**:
```typescript
export const myWorkflow: Workflow = {
  id: 'my-workflow',
  name: 'My Custom Workflow',
  triggers: ['file:change'],
  enabled: true,
  async execute(context) {
    const { filePath, eventType, shadowCache } = context;
    // Custom logic here
    await shadowCache.updateFile(filePath);
  }
};
```

### 4. AI Agents (`src/agents/`)

**Purpose**: Claude-powered intelligent automation

**Agent Rules**:
- `AutoTagRule`: Suggest tags based on content
- `AutoLinkRule`: Create wikilinks to related notes
- `DailyNoteRule`: Auto-generate daily notes with templates
- Custom rules via `AgentRule` interface

**Rule System**:
```typescript
interface AgentRule {
  shouldTrigger(content: string): boolean;
  execute(content: string): Promise<RuleResult>;
}
```

**Claude Integration**:
```typescript
const client = new ClaudeClient(apiKey);
const response = await client.sendMessage([
  { role: 'user', content: 'Suggest tags for: ...' }
], {
  responseFormat: 'json',
  maxTokens: 500
});
```

### 5. Git Auto-Commit (`src/git/`)

**Purpose**: Automatic version control with AI commit messages

**Components**:
- `GitClient`: simple-git wrapper
- `AutoCommitService`: Debounced commits
- `GitLogger`: Structured audit logs

**Flow**:
```
File Change → Debounce (5min) → Generate AI Commit Message → Git Commit
```

**Commit Message Generation**:
```typescript
const message = await generateCommitMessage(changedFiles);
// Output: "docs(vault): update 3 files in daily-notes/"
```

**Debouncing Logic**:
```typescript
onFileEvent(path) {
  pendingChanges.add(path);
  resetTimer();  // Reset 5-minute countdown
}

onTimerExpire() {
  const files = [...pendingChanges];
  const message = await generateMessage(files);
  await git.commit(files, message);
  pendingChanges.clear();
}
```

### 6. MCP Server (`src/mcp-server/`)

**Purpose**: Claude Desktop integration via Model Context Protocol

**Tools Provided**:

**Shadow Cache Tools**:
- `query_files`: Search files by tags/content
- `get_file`: Get file metadata
- `get_file_content`: Read file content
- `search_tags`: Find files by tag
- `search_links`: Query wikilinks
- `get_stats`: Vault statistics

**Workflow Tools**:
- `trigger_workflow`: Execute workflow manually
- `list_workflows`: Get available workflows
- `get_workflow_status`: Check execution status
- `get_workflow_history`: View past executions

**Protocol**:
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "query_files",
    "arguments": {
      "tags": ["ai", "ml"],
      "limit": 10
    }
  }
}
```

## Data Flow

### Note Creation Flow
```
1. User creates note.md
   ↓
2. chokidar detects file:add event
   ↓
3. Shadow Cache updates database
   ↓
4. Workflow Engine executes matched workflows
   ↓
5. AI Agents analyze content (if enabled)
   ↓
6. AutoCommitService queues for git commit
   ↓
7. After 5min debounce → Git commit with AI message
```

### MCP Query Flow
```
1. Claude Desktop sends MCP request
   ↓
2. MCP Server validates tool/parameters
   ↓
3. Tool handler executes (e.g., query Shadow Cache)
   ↓
4. Response formatted as MCP result
   ↓
5. Claude Desktop displays to user
```

## Configuration

**Environment Variables** (`.env`):
```bash
# Core
VAULT_PATH=/path/to/vault
LOG_LEVEL=info

# Features
FEATURE_AI_ENABLED=true
FEATURE_MCP_SERVER=true

# AI
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-3-5-sonnet-20241022

# Git
GIT_AUTO_COMMIT=true
GIT_COMMIT_DEBOUNCE_MS=300000
GIT_AUTHOR_NAME=Weaver
GIT_AUTHOR_EMAIL=weaver@local
```

**TypeScript Config** (`src/config/index.ts`):
```typescript
export const config = z.object({
  vaultPath: z.string(),
  featureAiEnabled: z.boolean(),
  anthropicApiKey: z.string().optional(),
  gitAutoCommit: z.boolean(),
  // ... validated with Zod
}).parse(process.env);
```

## Performance Considerations

**Shadow Cache**:
- SQLite with write-ahead logging (WAL)
- Indexes on path, tags, links
- Batch updates for bulk operations
- Target: <100ms for 10,000 file vault

**File Watcher**:
- Debouncing prevents duplicate events
- Ignores `.git/`, `node_modules/`, `.obsidian/`
- Handles symlinks gracefully

**AI Agents**:
- 3-second timeout for Claude API
- Fallback messages for offline mode
- Rate limiting (TBD)

## Testing Architecture

**Unit Tests** (`tests/unit/`):
- Isolated component testing
- Mocked dependencies
- 90%+ coverage target

**Integration Tests** (`tests/integration/`):
- MCP server E2E tests
- Shadow cache integration
- Workflow execution tests

**E2E Tests** (`tests/e2e/`):
- Full vault initialization
- MCP tool chains
- Multi-workflow scenarios

## Extension Points

1. **Custom Workflows**: Implement `Workflow` interface
2. **Custom Agent Rules**: Implement `AgentRule` interface
3. **MCP Tools**: Add to `src/mcp-server/tools/`
4. **Vault Templates**: Add to `templates/` directory

---

**Architecture Version**: 1.0
**Last Updated**: 2025-10-26
**Maintainer**: Weaver Team
