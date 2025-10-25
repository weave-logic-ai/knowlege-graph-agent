# Claude Desktop Integration Guide

Complete guide for integrating Weaver MCP Server with Claude Desktop for seamless AI-powered vault interaction.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Available Tools](#available-tools)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

Before setting up Claude Desktop integration, ensure you have:

1. **Claude Desktop** installed (v0.7.0 or later)
   - Download from: https://claude.ai/download

2. **Weaver** installed and configured
   ```bash
   cd /home/aepod/dev/weave-nn/weaver
   bun install
   bun run build
   ```

3. **Node.js** (v20 or later) for running the MCP server

4. **Vault** with valid Obsidian markdown files
   - Default location: `/home/aepod/dev/weave-nn/weave-nn`
   - Must contain `.md` files with YAML frontmatter

## Installation

### Step 1: Build Weaver

```bash
cd /home/aepod/dev/weave-nn/weaver
bun run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Step 2: Verify MCP Server Binary

Check that the MCP server entry point exists:

```bash
ls -la dist/mcp-server/bin.js
```

Should output: `-rw-r--r-- 1 user user <size> <date> dist/mcp-server/bin.js`

### Step 3: Test MCP Server Locally

```bash
# Set required environment variables
export WEAVER_VAULT_PATH=/home/aepod/dev/weave-nn/weave-nn
export WEAVER_LOG_LEVEL=info

# Run MCP server
node dist/mcp-server/bin.js
```

Expected output:
```
🧵 Starting Weaver MCP Server
Shadow cache initialized
Workflows registered
✅ Weaver MCP Server started successfully
Listening on stdio transport
```

Press `Ctrl+C` to stop.

## Configuration

### Step 1: Locate Claude Desktop Config

Claude Desktop configuration is stored at:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Step 2: Add Weaver MCP Server

Edit `claude_desktop_config.json` and add the Weaver MCP server:

```json
{
  "mcpServers": {
    "weaver": {
      "command": "node",
      "args": [
        "/home/aepod/dev/weave-nn/weaver/dist/mcp-server/bin.js"
      ],
      "env": {
        "WEAVER_VAULT_PATH": "/home/aepod/dev/weave-nn/weave-nn",
        "WEAVER_LOG_LEVEL": "info"
      }
    }
  }
}
```

**Important**: Replace paths with your actual installation directories.

### Step 3: Restart Claude Desktop

After saving the configuration:
1. Quit Claude Desktop completely (`Cmd+Q` on macOS, or exit from system tray)
2. Reopen Claude Desktop
3. Wait 5-10 seconds for MCP servers to initialize

### Step 4: Verify Connection

In Claude Desktop chat, ask:

```
Can you list the available MCP tools from Weaver?
```

Claude should respond with a list of 10+ tools including:
- `query_files` - Query vault files with filters
- `get_file` - Get file metadata and content
- `get_file_content` - Read file content
- `search_tags` - Search files by tags
- `search_links` - Find wikilinks between files
- `get_stats` - Get vault statistics
- `trigger_workflow` - Execute workflows
- `list_workflows` - List available workflows
- `get_workflow_status` - Check workflow execution
- `get_workflow_history` - View workflow history

## Usage

### Basic File Queries

Ask Claude to interact with your vault:

```
Show me the 10 most recently modified files in my vault
```

```
Find all files tagged with "neural-network" in the concepts directory
```

```
What are the key concepts in the file "concepts/sparse-memory-finetuning.md"?
```

### Advanced Queries

```
Find all files that link to "features/knowledge-graph-integration.md"
```

```
Show me vault statistics including file counts, tags, and link analysis
```

```
Search for files related to "reinforcement learning" and summarize their key points
```

### Workflow Execution

```
List all available workflows in the system
```

```
Trigger the "analyze-research-paper" workflow with this URL: https://arxiv.org/abs/2301.00234
```

```
Check the status of workflow execution ID abc123
```

## Available Tools

### Shadow Cache Tools (Query Vault Metadata)

#### `query_files`
Query vault files with optional filters.

**Parameters:**
- `limit` (number, optional): Max results (default: 50)
- `offset` (number, optional): Skip results (default: 0)
- `directory` (string, optional): Filter by directory path
- `type` (string, optional): Filter by file type (concept, feature, research, etc.)
- `tags` (string[], optional): Filter by tags
- `sort_by` (string, optional): Sort field (modified_at, created_at, title)
- `sort_order` (string, optional): Sort direction (asc, desc)

**Example:**
```
Query files in the "concepts" directory, sorted by modification date, limit 20
```

#### `get_file`
Get detailed metadata for a specific file.

**Parameters:**
- `path` (string, required): Relative path from vault root
- `includeContent` (boolean, optional): Include file content in response

**Example:**
```
Get metadata and content for "features/F-001-shadow-cache.md"
```

#### `get_file_content`
Read raw file content.

**Parameters:**
- `path` (string, required): Relative path from vault root

**Example:**
```
Read the content of "concepts/cognitive-variability.md"
```

#### `search_tags`
Search files by tags with pattern matching.

**Parameters:**
- `tag` (string, required): Tag pattern (supports wildcards: `*`, `?`)
- `limit` (number, optional): Max results
- `offset` (number, optional): Skip results

**Example:**
```
Search for all files tagged with "neural*" (matches neural-network, neural-arch, etc.)
```

#### `search_links`
Find wikilinks between files.

**Parameters:**
- `source_file` (string, optional): Filter by source file
- `target_file` (string, optional): Filter by target file
- `link_type` (string, optional): Filter by link type (wikilink, external, etc.)
- `limit` (number, optional): Max results

**Example:**
```
Find all files that link to "concepts/graph-topology-analysis.md"
```

#### `get_stats`
Get vault-wide statistics and health metrics.

**Parameters:**
- `category` (string, optional): Stats category (all, files, tags, links, health)
- `include_details` (boolean, optional): Include detailed breakdowns

**Example:**
```
Show me comprehensive vault statistics with details
```

### Workflow Tools (Execute and Monitor Workflows)

#### `list_workflows`
List all registered workflows.

**Parameters:**
- `category` (string, optional): Filter by category
- `status` (string, optional): Filter by status (active, inactive)

**Example:**
```
List all available workflows in the system
```

#### `trigger_workflow`
Manually trigger a workflow execution.

**Parameters:**
- `workflow_id` (string, required): Workflow identifier
- `input` (object, required): Workflow input parameters

**Example:**
```
Trigger the "paper-analysis" workflow with input: { "url": "https://arxiv.org/abs/2301.00234" }
```

#### `get_workflow_status`
Check status of a specific workflow execution.

**Parameters:**
- `execution_id` (string, required): Execution identifier

**Example:**
```
Check status of workflow execution abc-123-def-456
```

#### `get_workflow_history`
Get historical execution records for a workflow.

**Parameters:**
- `workflow_id` (string, required): Workflow identifier
- `limit` (number, optional): Max results
- `status` (string, optional): Filter by status

**Example:**
```
Show the last 10 executions of the "sync-research" workflow
```

## Troubleshooting

### Issue: MCP Server Not Appearing in Claude Desktop

**Symptoms:**
- Claude doesn't recognize Weaver tools
- No MCP tools listed in chat

**Solutions:**

1. **Check Configuration Path**
   ```bash
   # Verify config file exists
   cat ~/.config/Claude/claude_desktop_config.json
   ```

2. **Validate JSON Syntax**
   - Use https://jsonlint.com/ to validate your config
   - Common errors: missing commas, trailing commas, unescaped paths

3. **Check Absolute Paths**
   - All paths in config MUST be absolute
   - Use full paths like `/home/user/...`, not relative `~/...`

4. **Restart Claude Desktop Properly**
   ```bash
   # Linux
   killall claude-desktop

   # macOS
   # Quit from dock, then:
   ps aux | grep -i claude
   # Ensure no processes remain
   ```

5. **Check Logs**
   ```bash
   # View Claude Desktop logs
   tail -f ~/Library/Logs/Claude/mcp*.log  # macOS
   tail -f ~/.config/Claude/logs/mcp*.log  # Linux
   ```

### Issue: "WEAVER_VAULT_PATH not set" Error

**Symptoms:**
- MCP server starts but tools fail
- Error messages about missing vault path

**Solutions:**

1. **Verify Environment Variable in Config**
   ```json
   "env": {
     "WEAVER_VAULT_PATH": "/absolute/path/to/vault"
   }
   ```

2. **Check Vault Path Exists**
   ```bash
   ls -la /home/aepod/dev/weave-nn/weave-nn
   ```

3. **Ensure Vault Contains .md Files**
   ```bash
   find /home/aepod/dev/weave-nn/weave-nn -name "*.md" | head
   ```

### Issue: "Shadow Cache Not Initialized" Error

**Symptoms:**
- Tools fail with database errors
- Cache queries return no results

**Solutions:**

1. **Sync Shadow Cache**
   ```bash
   cd /home/aepod/dev/weave-nn/weaver
   bun run dev
   # Wait for "Shadow cache synced" message
   # Press Ctrl+C
   ```

2. **Check Database Permissions**
   ```bash
   ls -la /home/aepod/dev/weave-nn/weave-nn/.weaver/shadow-cache.db
   # Should be readable/writable by your user
   ```

3. **Rebuild Cache**
   ```bash
   rm -f /home/aepod/dev/weave-nn/weave-nn/.weaver/shadow-cache.db
   bun run dev  # Will rebuild from scratch
   ```

### Issue: Slow Tool Response Times

**Symptoms:**
- Tools take >5 seconds to respond
- Claude appears to hang

**Solutions:**

1. **Check Vault Size**
   ```bash
   find /home/aepod/dev/weave-nn/weave-nn -name "*.md" | wc -l
   # If >10,000 files, performance may degrade
   ```

2. **Optimize Shadow Cache**
   ```bash
   # Run VACUUM to compact database
   sqlite3 /home/aepod/dev/weave-nn/weave-nn/.weaver/shadow-cache.db "VACUUM;"
   ```

3. **Reduce Query Limits**
   - Use smaller `limit` values in queries (e.g., 10-50 instead of 500)
   - Paginate large result sets with `offset`

4. **Check System Resources**
   ```bash
   # Monitor CPU and memory during queries
   top -p $(pgrep -f "weaver.*mcp")
   ```

### Issue: Workflow Tools Not Working

**Symptoms:**
- `list_workflows` returns empty array
- `trigger_workflow` fails with "workflow not found"

**Solutions:**

1. **Check Workflow Registration**
   ```bash
   # View MCP server startup logs
   node dist/mcp-server/bin.js 2>&1 | grep -i workflow
   ```

2. **Verify Workflows Enabled in Config**
   ```bash
   cd /home/aepod/dev/weave-nn/weaver
   cat .env | grep WORKFLOWS_ENABLED
   # Should be: WORKFLOWS_ENABLED=true
   ```

3. **Check Workflow Definitions**
   ```bash
   ls -la src/workflows/
   # Should contain example-workflows.ts and proof-workflows.ts
   ```

### Issue: Permission Denied Errors

**Symptoms:**
- "EACCES" or "Permission denied" errors
- Cannot read/write files

**Solutions:**

1. **Check File Permissions**
   ```bash
   # Make vault readable
   chmod -R u+r /home/aepod/dev/weave-nn/weave-nn

   # Make .weaver directory writable
   chmod -R u+w /home/aepod/dev/weave-nn/weave-nn/.weaver
   ```

2. **Fix Binary Permissions**
   ```bash
   chmod +x dist/mcp-server/bin.js
   ```

3. **Run as Correct User**
   - Ensure Claude Desktop runs as the same user that owns the vault
   - Check with: `whoami` and `ls -la /home/aepod/dev/weave-nn/weave-nn`

## Advanced Configuration

### Custom Log Levels

Control verbosity of MCP server logs:

```json
"env": {
  "WEAVER_LOG_LEVEL": "debug"  // trace, debug, info, warn, error
}
```

**Log levels:**
- `trace`: Extremely verbose (every function call)
- `debug`: Detailed diagnostic info
- `info`: Normal operational messages (recommended)
- `warn`: Warning messages only
- `error`: Error messages only

### Multiple Vault Support

Run multiple MCP servers for different vaults:

```json
{
  "mcpServers": {
    "weaver-main": {
      "command": "node",
      "args": ["/path/to/weaver/dist/mcp-server/bin.js"],
      "env": {
        "WEAVER_VAULT_PATH": "/path/to/main-vault"
      }
    },
    "weaver-research": {
      "command": "node",
      "args": ["/path/to/weaver/dist/mcp-server/bin.js"],
      "env": {
        "WEAVER_VAULT_PATH": "/path/to/research-vault"
      }
    }
  }
}
```

### Custom Shadow Cache Location

Override default cache location:

```json
"env": {
  "WEAVER_VAULT_PATH": "/path/to/vault",
  "WEAVER_DB_PATH": "/custom/path/shadow-cache.db"
}
```

### Disable Workflows

Run MCP server without workflow tools:

```json
"env": {
  "WEAVER_VAULT_PATH": "/path/to/vault",
  "WORKFLOWS_ENABLED": "false"
}
```

### Performance Tuning

For large vaults (>5,000 files), optimize performance:

```json
"env": {
  "WEAVER_VAULT_PATH": "/path/to/vault",
  "WEAVER_CACHE_SIZE": "2000",  // Increase cache size
  "WEAVER_INDEX_WORKERS": "4"   // Parallel indexing
}
```

## Security Considerations

### Vault Access Control

The MCP server has **full read access** to your vault. Ensure:

1. **Vault contains no sensitive data** that shouldn't be shared with Claude
2. **File permissions** restrict access to authorized users only
3. **Claude Desktop config** is readable only by you:
   ```bash
   chmod 600 ~/.config/Claude/claude_desktop_config.json
   ```

### Network Isolation

The MCP server runs **locally** and does **not** expose network ports:
- Communication is via stdio (standard input/output)
- No external network access required
- All data stays on your machine

### API Key Protection

Never include API keys or secrets in:
- Vault files (use `.env` files instead)
- MCP server environment variables visible in config

## Best Practices

### 1. Regular Cache Updates

Keep shadow cache synchronized with vault:

```bash
# Add to crontab for automatic sync
0 * * * * cd /home/aepod/dev/weave-nn/weaver && bun run sync-cache
```

### 2. Structured Queries

Use specific filters for faster results:

```
# Better: Specific query
Show files in "concepts/" directory tagged "neural-network", limit 10

# Slower: Broad query
Show all files in the vault
```

### 3. Content Pagination

For large result sets, paginate:

```
# First page
Query files with limit 50, offset 0

# Next page
Query files with limit 50, offset 50
```

### 4. Monitor Performance

Track MCP server resource usage:

```bash
# View real-time stats
watch -n 1 'ps aux | grep "weaver.*mcp"'

# Check shadow cache size
du -h /home/aepod/dev/weave-nn/weave-nn/.weaver/shadow-cache.db
```

### 5. Backup Configuration

Save your Claude Desktop config:

```bash
cp ~/.config/Claude/claude_desktop_config.json ~/claude_config_backup.json
```

## Examples

### Example 1: Research Paper Analysis

```
I have a research paper in my vault at "research/papers/transformers-attention.md".
Can you:
1. Get the file metadata including tags and links
2. Read its content
3. Find related papers by searching for files that link to it
4. Summarize the key findings
```

### Example 2: Knowledge Graph Exploration

```
Starting from "concepts/graph-topology-analysis.md":
1. Find all outgoing links
2. For each linked file, get its tags
3. Build a concept map showing relationships
4. Identify the most connected concepts
```

### Example 3: Workflow Automation

```
1. List all available workflows
2. Trigger the "daily-sync" workflow
3. Monitor its execution status
4. Show me the execution history for the past week
```

## Getting Help

### Community Support

- **GitHub Issues**: https://github.com/aepod/weave-nn/issues
- **Discussions**: https://github.com/aepod/weave-nn/discussions

### Debugging Tips

1. **Enable Debug Logging**
   - Set `WEAVER_LOG_LEVEL=debug` in config
   - Check logs in `~/.config/Claude/logs/`

2. **Test MCP Server Directly**
   ```bash
   # Run MCP server in terminal to see output
   export WEAVER_VAULT_PATH=/path/to/vault
   node dist/mcp-server/bin.js
   ```

3. **Verify Shadow Cache**
   ```bash
   # Check cache status
   sqlite3 /path/to/vault/.weaver/shadow-cache.db ".tables"
   ```

4. **Check Claude Desktop Logs**
   ```bash
   tail -f ~/Library/Logs/Claude/mcp*.log  # macOS
   journalctl -u claude-desktop -f         # Linux systemd
   ```

## Version Compatibility

| Weaver | Claude Desktop | MCP SDK |
|--------|---------------|---------|
| 0.1.x  | 0.7.0+        | 0.5.0+  |
| 0.2.x  | 0.8.0+        | 0.6.0+  |

Always use the latest versions for best compatibility.

## Changelog

### v0.1.0 (2025-01-24)
- Initial Claude Desktop integration
- 10 MCP tools (shadow cache + workflow)
- Performance benchmarks: <200ms p95 latency
- Comprehensive error handling

---

**Need More Help?**

Create an issue at: https://github.com/aepod/weave-nn/issues/new
