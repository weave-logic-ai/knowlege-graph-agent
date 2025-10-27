# Weaver Configuration Guide

Complete reference for all configuration options, environment variables, and settings.

## Environment Variables

Weaver uses environment variables for configuration. Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

---

## Core Settings

### `VAULT_PATH`

**Required**: Yes
**Type**: String (absolute path)
**Description**: Path to your Obsidian vault directory

```env
VAULT_PATH=/path/to/your/obsidian/vault
```

**Examples:**
```env
# macOS
VAULT_PATH=/Users/username/Documents/MyVault

# Linux
VAULT_PATH=/home/username/vaults/knowledge-base

# Windows (use forward slashes)
VAULT_PATH=C:/Users/username/Documents/ObsidianVault
```

**Validation:**
- Must be an absolute path
- Directory must exist
- Must have read/write permissions

---

### `LOG_LEVEL`

**Required**: No
**Default**: `info`
**Type**: Enum
**Options**: `debug`, `info`, `warn`, `error`
**Description**: Logging verbosity level

```env
LOG_LEVEL=info
```

**Log Levels:**
- `debug` - Verbose output for development (includes all API calls, file operations)
- `info` - Normal operation logs (workflow executions, git commits)
- `warn` - Warnings and potential issues
- `error` - Errors only

---

## Feature Flags

### `FEATURE_AI_ENABLED`

**Required**: No
**Default**: `false`
**Type**: Boolean
**Description**: Enable AI-powered features (auto-tagging, auto-linking, AI commit messages)

```env
FEATURE_AI_ENABLED=true
```

**When Enabled:**
- Auto-tag agent rule activates
- Auto-link agent rule activates
- AI commit messages generated
- Requires `ANTHROPIC_API_KEY`

**When Disabled:**
- AI features skipped
- Basic workflows still function
- Git commits use generic messages

---

### `FEATURE_MCP_SERVER`

**Required**: No
**Default**: `true`
**Type**: Boolean
**Description**: Enable MCP server for Claude Desktop integration

```env
FEATURE_MCP_SERVER=true
```

**When Enabled:**
- MCP server starts on stdio
- Claude Desktop can access vault tools
- Shadow cache tools available

**When Disabled:**
- MCP server does not start
- Workflows and file watcher still run
- Useful for standalone operation

---

## AI Configuration

### `ANTHROPIC_API_KEY`

**Required**: If `FEATURE_AI_ENABLED=true`
**Type**: String
**Description**: Claude API key for AI-powered features

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to Get:**
1. Sign up at https://console.anthropic.com
2. Navigate to API Keys section
3. Create new key
4. Copy key to `.env`

**Security:**
- Never commit this to version control
- `.env` is gitignored by default
- Rotate keys regularly

---

### `AI_MODEL`

**Required**: No
**Default**: `claude-3-5-sonnet-20241022`
**Type**: String
**Description**: Claude model to use for AI features

```env
AI_MODEL=claude-3-5-sonnet-20241022
```

**Supported Models:**
- `claude-3-5-sonnet-20241022` - Balanced performance and speed (recommended)
- `claude-3-opus-20240229` - Highest quality, slower
- `claude-3-haiku-20240307` - Fastest, lower cost

**Cost Considerations:**
- Sonnet: Best balance for most use cases
- Opus: Use for critical tagging/linking accuracy
- Haiku: Use for high-volume vaults to reduce costs

---

### `AI_MAX_TOKENS`

**Required**: No
**Default**: `500`
**Type**: Integer
**Description**: Maximum tokens per AI request

```env
AI_MAX_TOKENS=500
```

**Guidelines:**
- 500 tokens ≈ 375 words
- Increase for longer content analysis
- Decrease to reduce API costs

---

### `AI_TIMEOUT_MS`

**Required**: No
**Default**: `3000`
**Type**: Integer (milliseconds)
**Description**: Timeout for AI API requests

```env
AI_TIMEOUT_MS=3000
```

**Recommendations:**
- 3000ms (3 seconds) for most use cases
- Increase for slower network connections
- Decrease for faster failure detection

---

## Git Auto-Commit Settings

### `GIT_AUTO_COMMIT`

**Required**: No
**Default**: `false`
**Type**: Boolean
**Description**: Enable automatic git commits on file changes

```env
GIT_AUTO_COMMIT=true
```

**Requirements:**
- Git must be initialized in `VAULT_PATH`
- Git user.name and user.email configured
- Requires `FEATURE_AI_ENABLED=true` for AI commit messages

**Setup:**
```bash
cd /path/to/vault
git init
git config user.name "Weaver"
git config user.email "weaver@local"
```

---

### `GIT_COMMIT_DEBOUNCE_MS`

**Required**: No
**Default**: `300000` (5 minutes)
**Type**: Integer (milliseconds)
**Description**: Debounce time before auto-commit

```env
GIT_COMMIT_DEBOUNCE_MS=300000
```

**How It Works:**
1. File change detected
2. Timer starts (or resets if already running)
3. After `GIT_COMMIT_DEBOUNCE_MS` with no new changes, commit is created

**Recommendations:**
- `300000` (5 min) - Default, good for most users
- `60000` (1 min) - Frequent commits, more granular history
- `900000` (15 min) - Less frequent commits, cleaner history

**Examples:**
```env
# Commit every 1 minute
GIT_COMMIT_DEBOUNCE_MS=60000

# Commit every 10 minutes
GIT_COMMIT_DEBOUNCE_MS=600000

# Commit every 30 minutes
GIT_COMMIT_DEBOUNCE_MS=1800000
```

---

### `GIT_AUTHOR_NAME`

**Required**: No
**Default**: System git user.name
**Type**: String
**Description**: Git commit author name

```env
GIT_AUTHOR_NAME=Weaver
```

**Note:** If not set, uses system git configuration.

---

### `GIT_AUTHOR_EMAIL`

**Required**: No
**Default**: System git user.email
**Type**: String
**Description**: Git commit author email

```env
GIT_AUTHOR_EMAIL=weaver@weave-nn.local
```

**Note:** If not set, uses system git configuration.

---

## Shadow Cache Settings

### `SHADOW_CACHE_PATH`

**Required**: No
**Default**: `.weaver/shadow-cache.db`
**Type**: String (relative path)
**Description**: Path to SQLite database file (relative to `VAULT_PATH`)

```env
SHADOW_CACHE_PATH=.weaver/shadow-cache.db
```

**Advanced Usage:**
```env
# Store outside vault
SHADOW_CACHE_PATH=/var/cache/weaver/vault.db

# Custom hidden directory
SHADOW_CACHE_PATH=.cache/weaver.db
```

---

### `SHADOW_CACHE_SYNC_INTERVAL_MS`

**Required**: No
**Default**: `0` (sync on file changes only)
**Type**: Integer (milliseconds)
**Description**: Periodic full vault sync interval

```env
SHADOW_CACHE_SYNC_INTERVAL_MS=0
```

**Options:**
- `0` - No periodic sync (recommended, uses file watcher)
- `3600000` - Hourly full sync
- `86400000` - Daily full sync

**When to Use Periodic Sync:**
- External processes modify vault
- Network drive synchronization
- Obsidian sync conflicts

---

## File Watcher Settings

### `FILE_WATCHER_IGNORE_PATTERNS`

**Required**: No
**Default**: `.git,.obsidian,node_modules`
**Type**: Comma-separated string
**Description**: Patterns to ignore in file watcher

```env
FILE_WATCHER_IGNORE_PATTERNS=.git,.obsidian,node_modules,*.tmp
```

**Common Patterns:**
```env
# Default
FILE_WATCHER_IGNORE_PATTERNS=.git,.obsidian,node_modules

# Ignore temp files
FILE_WATCHER_IGNORE_PATTERNS=.git,.obsidian,node_modules,*.tmp,*.swp

# Ignore backups
FILE_WATCHER_IGNORE_PATTERNS=.git,.obsidian,node_modules,*.bak,*~
```

---

### `FILE_WATCHER_POLL_INTERVAL_MS`

**Required**: No
**Default**: `0` (use native events)
**Type**: Integer (milliseconds)
**Description**: Polling interval for file changes

```env
FILE_WATCHER_POLL_INTERVAL_MS=0
```

**When to Use Polling:**
- Network drives (NFS, SMB)
- Docker containers
- Virtual machines
- WSL (Windows Subsystem for Linux)

**Recommended Values:**
- `0` - Native events (default, most efficient)
- `1000` - Poll every second (network drives)
- `5000` - Poll every 5 seconds (slow networks)

---

## Workflow Engine Settings

### `WORKFLOW_ENGINE_ENABLED`

**Required**: No
**Default**: `true`
**Type**: Boolean
**Description**: Enable workflow engine

```env
WORKFLOW_ENGINE_ENABLED=true
```

**When Disabled:**
- No workflows execute
- File watcher still runs
- Shadow cache still updates

---

### `WORKFLOW_EXECUTION_TIMEOUT_MS`

**Required**: No
**Default**: `30000` (30 seconds)
**Type**: Integer (milliseconds)
**Description**: Timeout for individual workflow execution

```env
WORKFLOW_EXECUTION_TIMEOUT_MS=30000
```

**Recommendations:**
- `30000` (30 sec) - Default for most workflows
- `60000` (60 sec) - Complex AI workflows
- `10000` (10 sec) - Simple metadata workflows

---

## Advanced Configuration

### `NODE_ENV`

**Required**: No
**Default**: `production`
**Type**: Enum
**Options**: `development`, `production`, `test`
**Description**: Node.js environment

```env
NODE_ENV=production
```

**Effects:**
- `development` - Verbose logging, hot reload, detailed errors
- `production` - Optimized, minimal logging
- `test` - Used by test runner

---

### `PORT`

**Required**: No
**Default**: N/A (MCP uses stdio)
**Type**: Integer
**Description**: HTTP port (if running HTTP server)

```env
PORT=3000
```

**Note:** MCP server uses stdio by default, not HTTP.

---

## Complete Example Configuration

### Minimal Configuration

```env
# Minimal .env for basic functionality
VAULT_PATH=/home/user/vault
LOG_LEVEL=info
```

### Recommended Configuration

```env
# Recommended .env for full features
VAULT_PATH=/home/user/vault
LOG_LEVEL=info

# Features
FEATURE_AI_ENABLED=true
FEATURE_MCP_SERVER=true

# AI
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
AI_MODEL=claude-3-5-sonnet-20241022

# Git
GIT_AUTO_COMMIT=true
GIT_COMMIT_DEBOUNCE_MS=300000
GIT_AUTHOR_NAME=Weaver
GIT_AUTHOR_EMAIL=weaver@weave-nn.local
```

### Advanced Configuration

```env
# Advanced .env with all options
VAULT_PATH=/home/user/vault
LOG_LEVEL=debug

# Features
FEATURE_AI_ENABLED=true
FEATURE_MCP_SERVER=true

# AI
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=500
AI_TIMEOUT_MS=3000

# Git
GIT_AUTO_COMMIT=true
GIT_COMMIT_DEBOUNCE_MS=300000
GIT_AUTHOR_NAME=Weaver
GIT_AUTHOR_EMAIL=weaver@weave-nn.local

# Shadow Cache
SHADOW_CACHE_PATH=.weaver/shadow-cache.db
SHADOW_CACHE_SYNC_INTERVAL_MS=0

# File Watcher
FILE_WATCHER_IGNORE_PATTERNS=.git,.obsidian,node_modules,*.tmp
FILE_WATCHER_POLL_INTERVAL_MS=0

# Workflow Engine
WORKFLOW_ENGINE_ENABLED=true
WORKFLOW_EXECUTION_TIMEOUT_MS=30000

# System
NODE_ENV=production
```

---

## Troubleshooting

### Invalid Configuration

**Error:** `VAULT_PATH must be absolute path`

**Fix:** Use absolute path, not relative:
```env
# ✗ Wrong
VAULT_PATH=./vault

# ✓ Correct
VAULT_PATH=/home/user/vault
```

---

### API Key Errors

**Error:** `ANTHROPIC_API_KEY is required when FEATURE_AI_ENABLED=true`

**Fix:** Set API key or disable AI:
```env
# Option 1: Add API key
ANTHROPIC_API_KEY=sk-ant-...

# Option 2: Disable AI
FEATURE_AI_ENABLED=false
```

---

### Git Errors

**Error:** `Git not initialized in vault`

**Fix:** Initialize git in vault:
```bash
cd /path/to/vault
git init
git config user.name "Weaver"
git config user.email "weaver@local"
```

---

## See Also

- [Quickstart Guide](QUICKSTART.md) - Get started quickly
- [Troubleshooting](TROUBLESHOOTING.md) - Common issues
- [Architecture](../developer/ARCHITECTURE.md) - How configuration is used

---

**Last Updated**: 2025-10-26
**Configuration Version**: 1.0
