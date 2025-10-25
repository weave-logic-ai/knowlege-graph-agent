# Weaver MCP Server - Usage Guide

Complete guide for using the Weaver MCP Server with Claude Desktop and other MCP clients.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Configuration](#configuration)
3. [Common Workflows](#common-workflows)
4. [Troubleshooting](#troubleshooting)
5. [FAQ](#faq)
6. [Advanced Usage](#advanced-usage)

---

## Getting Started

### Prerequisites

Before using the Weaver MCP Server, ensure you have:

1. **Weaver Service Running**:
   ```bash
   cd /path/to/weave-nn/weaver
   bun run dev   # Development mode
   # OR
   bun start     # Production mode
   ```

2. **Claude Desktop Installed**:
   - Download from: https://claude.ai/download
   - Version 0.7.0 or later

3. **Obsidian Vault Initialized**:
   - Vault path configured in `.env`
   - Local REST API plugin enabled
   - Shadow cache populated (run file watcher first)

### Quick Setup (5 minutes)

#### Step 1: Configure Claude Desktop

Edit Claude Desktop's MCP configuration file:

**macOS/Linux**: `~/.config/claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add Weaver to the `mcpServers` section:

```json
{
  "mcpServers": {
    "weaver": {
      "command": "bun",
      "args": ["run", "mcp"],
      "cwd": "/path/to/weave-nn/weaver",
      "env": {
        "VAULT_PATH": "/path/to/your/weave-nn/vault",
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Important**: Replace `/path/to/weave-nn/weaver` and `/path/to/your/weave-nn/vault` with your actual paths.

#### Step 2: Restart Claude Desktop

Close and reopen Claude Desktop to load the new MCP server configuration.

#### Step 3: Verify Connection

In Claude Desktop, type:

```
Can you check the health of the Weaver MCP server?
```

Claude should respond with server health information. If you see connection errors, proceed to the [Troubleshooting](#troubleshooting) section.

#### Step 4: Test Basic Query

Try querying your vault:

```
Show me all concept files in my vault using the query_files tool.
```

You should see a list of your concept files with metadata.

---

## Configuration

### Environment Variables

The MCP server inherits environment variables from your `.env` file and Claude Desktop config.

**Required Variables**:

```bash
# Path to Obsidian vault
VAULT_PATH=/path/to/your/weave-nn/vault

# Obsidian Local REST API
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=your-api-key-here
```

**Optional Variables**:

```bash
# Environment mode
NODE_ENV=production

# Logging level
LOG_LEVEL=info

# Server port (not used by MCP, but needed by main service)
WEAVER_PORT=3000
```

### Claude Desktop Configuration

**Minimal Configuration**:

```json
{
  "mcpServers": {
    "weaver": {
      "command": "bun",
      "args": ["run", "mcp"],
      "cwd": "/absolute/path/to/weaver"
    }
  }
}
```

**Advanced Configuration**:

```json
{
  "mcpServers": {
    "weaver": {
      "command": "bun",
      "args": ["run", "mcp"],
      "cwd": "/absolute/path/to/weaver",
      "env": {
        "VAULT_PATH": "/absolute/path/to/vault",
        "LOG_LEVEL": "debug",
        "NODE_ENV": "production"
      },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

**Configuration Options**:

| Field       | Type     | Description                                |
|-------------|----------|--------------------------------------------|
| command     | string   | Executable to run (bun, node, etc.)        |
| args        | string[] | Command arguments                          |
| cwd         | string   | Working directory (must be absolute)       |
| env         | object   | Environment variables                      |
| disabled    | boolean  | Disable server without removing config     |
| alwaysAllow | string[] | Tools to auto-approve (security risk)      |

### Security Considerations

**DO NOT** add tools to `alwaysAllow` unless you fully trust them. This bypasses Claude's permission prompts.

**AVOID** storing sensitive credentials in Claude Desktop config. Use `.env` file in weaver directory instead.

---

## Common Workflows

### 1. Explore Your Vault

**Query all files in a directory**:

```
Claude, show me all technical documents using query_files with directory "technical".
```

**Find files by tag**:

```
Use search_tags to find all files tagged with "neural".
```

**Get vault statistics**:

```
What are the statistics for my vault? Use get_stats.
```

### 2. Navigate Knowledge Graph

**Find linked notes**:

```
Show me all notes that link to "concepts/graph-topology.md" using search_links.
```

**Explore bidirectional links**:

```
Get both incoming and outgoing links for "technical/fastapi.md".
```

**Trace concept connections**:

```
Help me trace the connection path between "neural networks" and "knowledge graphs" by exploring wikilinks.
```

### 3. Content Analysis

**Read file content**:

```
Read the content of "features/F-001-shadow-cache.md" using get_file_content.
```

**Analyze frontmatter**:

```
Get the metadata for all files with status "active" and type "feature".
```

**Compare files**:

```
Compare the content of "concepts/graph-topology.md" and "concepts/betweenness-centrality.md".
```

### 4. Workflow Operations

**Trigger analysis workflow**:

```
Trigger the markdown-analyzer workflow for "concepts/sparse-memory-finetuning.md".
```

**Check workflow status**:

```
What's the status of execution "wf_exec_20251024_123456"?
```

**View workflow history**:

```
Show me the last 10 workflow executions.
```

**List available workflows**:

```
What workflows are available? Use list_workflows.
```

### 5. Research and Discovery

**Find related concepts**:

```
I'm researching graph topology. Find all related files by:
1. Searching for tag "graph"
2. Finding linked notes
3. Reading their summaries
```

**Track concept evolution**:

```
Show me the creation and modification timeline for all files about "cognitive variability".
```

**Generate insights**:

```
Analyze the link patterns between technical files and concepts. What are the most connected nodes?
```

### 6. Batch Operations

**Query with pagination**:

```
Get the first 50 concept files, then the next 50 using offset.
```

**Process all files in directory**:

```
For each file in "features/", get its metadata and count the tags.
```

**Export filtered subset**:

```
Find all active features and export their paths and descriptions.
```

---

## Troubleshooting

### Connection Issues

#### Error: "MCP server 'weaver' failed to start"

**Causes**:
- Bun not installed or not in PATH
- Wrong working directory in config
- Missing dependencies

**Solutions**:

1. **Verify Bun installation**:
   ```bash
   bun --version
   # Should show: 1.1.0 or later
   ```

2. **Check working directory**:
   ```bash
   cd /path/to/weave-nn/weaver
   ls package.json  # Should exist
   ```

3. **Install dependencies**:
   ```bash
   cd /path/to/weave-nn/weaver
   bun install
   ```

4. **Test MCP server manually**:
   ```bash
   cd /path/to/weave-nn/weaver
   bun run mcp
   # Should start without errors
   # Press Ctrl+C to stop
   ```

#### Error: "Shadow cache not available"

**Causes**:
- Shadow cache database doesn't exist
- File watcher not running
- Database locked by another process

**Solutions**:

1. **Check database exists**:
   ```bash
   ls -la /path/to/weave-nn/weaver/data/shadow-cache.db
   ```

2. **Initialize shadow cache**:
   ```bash
   cd /path/to/weave-nn/weaver
   bun run dev  # Starts file watcher + shadow cache
   ```

3. **Verify file watcher is running**:
   - Check logs in `logs/weaver.log`
   - Should see "File watcher started" message

#### Error: "Workflow engine not available"

**Causes**:
- Workflow engine not initialized
- Missing workflow definitions

**Solutions**:

1. **Check workflow files**:
   ```bash
   ls -la /path/to/weave-nn/weaver/src/workflows/
   ```

2. **Restart Weaver service**:
   ```bash
   # Stop existing service
   pkill -f "bun.*weaver"

   # Start fresh
   cd /path/to/weave-nn/weaver
   bun run dev
   ```

### Performance Issues

#### Slow Query Response

**Symptoms**:
- Queries take > 1 second
- Claude times out waiting for response

**Causes**:
- Large vault (>10,000 files)
- Shadow cache not indexed
- Disk I/O bottleneck

**Solutions**:

1. **Check query parameters**:
   - Use pagination (`limit: 50`)
   - Add specific filters (directory, type, tag)
   - Avoid fetching all files at once

2. **Optimize shadow cache**:
   ```bash
   cd /path/to/weave-nn/weaver
   bun run scripts/optimize-cache.sh
   ```

3. **Check disk usage**:
   ```bash
   df -h /path/to/weave-nn/weaver/data
   # Should have > 1GB free
   ```

#### High Memory Usage

**Symptoms**:
- Weaver process using >500MB RAM
- System becomes sluggish

**Causes**:
- Too many concurrent queries
- Large file content reads
- Memory leak (rare)

**Solutions**:

1. **Restart Weaver service**:
   ```bash
   pkill -f "bun.*weaver"
   cd /path/to/weave-nn/weaver
   bun start  # Use production mode
   ```

2. **Limit file content reads**:
   - Use `get_file` for metadata only
   - Use `get_file_content` sparingly
   - Paginate large result sets

3. **Monitor memory**:
   ```bash
   ps aux | grep weaver
   # Check RSS column (should be < 200MB typical)
   ```

### Tool Errors

#### Error: "File not found"

**Causes**:
- Path doesn't exist in vault
- Path is absolute instead of relative
- File was deleted but cache not updated

**Solutions**:

1. **Verify path exists**:
   ```bash
   ls -la /path/to/vault/concepts/file.md
   ```

2. **Use relative paths**:
   - ✅ Good: `concepts/file.md`
   - ❌ Bad: `/path/to/vault/concepts/file.md`

3. **Refresh shadow cache**:
   - File watcher should auto-update
   - Or restart Weaver service

#### Error: "Workflow not found"

**Causes**:
- Workflow ID typo
- Workflow not registered
- Workflow registration failed

**Solutions**:

1. **List available workflows**:
   ```
   Claude, list all available workflows.
   ```

2. **Check workflow ID**:
   - Must match exactly (case-sensitive)
   - Valid IDs: `file-change-logger`, `markdown-analyzer`, etc.

3. **Verify workflow registration**:
   - Check logs for "Registered X workflows" message
   - Should see workflow count > 0

### Logging and Debugging

#### Enable Debug Logging

Edit `.env`:

```bash
LOG_LEVEL=debug
```

Restart Weaver service to apply.

#### View Logs

**Real-time logs**:
```bash
tail -f /path/to/weave-nn/weaver/logs/weaver.log
```

**Filter errors**:
```bash
grep ERROR /path/to/weave-nn/weaver/logs/weaver.log
```

**View MCP protocol messages**:
```bash
grep "MCP" /path/to/weave-nn/weaver/logs/weaver.log
```

#### Test Tools Manually

Use `bun run test-tool` script:

```bash
cd /path/to/weave-nn/weaver

# Test query_files
bun run test-tool query_files '{"directory":"concepts"}'

# Test get_file
bun run test-tool get_file '{"path":"technical/fastapi.md"}'

# Test trigger_workflow
bun run test-tool trigger_workflow '{"workflowId":"markdown-analyzer"}'
```

---

## FAQ

### General Questions

**Q: Does the MCP server modify my vault files?**

A: No, the MCP server is read-only. It only queries the shadow cache and reads files. Workflows can potentially modify files, but they require explicit triggers and approval.

**Q: How often is the shadow cache updated?**

A: The shadow cache is updated in real-time by the file watcher. When you save a file in Obsidian, the cache is updated within 1-2 seconds.

**Q: Can I use multiple MCP servers with Claude Desktop?**

A: Yes! You can configure multiple MCP servers in `claude_desktop_config.json`. Each server appears as a separate tool namespace.

**Q: What happens if the Weaver service crashes?**

A: Claude Desktop will show connection errors when calling MCP tools. Restart the Weaver service to reconnect.

**Q: Can I use Weaver MCP with other AI tools?**

A: Yes! Any tool that supports the MCP protocol can connect to Weaver. Configure the stdio transport with the appropriate command.

### Performance Questions

**Q: How many files can Weaver handle?**

A: Tested with 10,000+ files. Query performance remains < 10ms with proper indexing. Memory usage stays under 200MB.

**Q: Why are queries faster than direct file reads?**

A: The shadow cache (SQLite) stores indexed metadata. Queries hit the cache instead of parsing markdown files.

**Q: Should I use sync or async workflow execution?**

A: Use sync for quick operations (<30s). Use async for long operations (>30s) to avoid timeouts.

**Q: What's the maximum file size for get_file_content?**

A: No hard limit, but files >10MB may cause memory issues. Use pagination or streaming for large files.

### Configuration Questions

**Q: Do I need to run Weaver as a separate service?**

A: No! Claude Desktop starts the MCP server on-demand using the `command` in config. However, running Weaver as a service provides file watching and workflow orchestration.

**Q: Can I use environment variables in Claude Desktop config?**

A: Yes, use the `env` field in config. These override `.env` file values.

**Q: How do I disable the MCP server temporarily?**

A: Set `"disabled": true` in Claude Desktop config, or remove the `weaver` entry entirely.

**Q: Can I customize tool names or descriptions?**

A: Not in Claude Desktop config. You'd need to modify the tool definitions in Weaver's source code.

### Security Questions

**Q: Is my vault data sent to Anthropic's servers?**

A: Only the data you explicitly request through Claude is sent. The MCP protocol runs locally and only transmits tool results to Claude's API for processing.

**Q: Can Claude access files outside my vault?**

A: No. Path validation prevents directory traversal. Only files within `VAULT_PATH` are accessible.

**Q: Should I use `alwaysAllow` for Weaver tools?**

A: No. Review each tool call to ensure Claude is accessing the correct data. Use `alwaysAllow` only for trusted, read-only tools like `health_check`.

**Q: How is my Obsidian API key protected?**

A: Store it in `.env` file with proper file permissions (600). Never commit `.env` to version control.

---

## Advanced Usage

### Custom Workflows

**Create a custom workflow**:

1. Define workflow in `src/workflows/custom-workflow.ts`
2. Register in workflow engine
3. Add to workflow tool enum
4. Restart Weaver service

**Example custom workflow**:

```typescript
// src/workflows/custom-analysis.ts
export const customAnalysisWorkflow = defineWorkflow({
  id: 'custom-analysis',
  name: 'Custom Content Analysis',
  description: 'Analyze content with custom logic',

  async execute(input: { path: string }) {
    // Your custom logic here
    const file = await readFile(input.path);
    const analysis = await analyzeContent(file);
    return { analysis };
  }
});
```

### Integrating with Other Tools

**Chain MCP servers**:

```json
{
  "mcpServers": {
    "weaver": { /* Weaver config */ },
    "filesystem": { /* File system MCP */ },
    "browser": { /* Browser automation MCP */ }
  }
}
```

Claude can use tools from all servers in a single conversation.

**Example multi-tool workflow**:

```
Claude, use the following workflow:
1. Query technical files from Weaver (query_files)
2. Read the top 3 files (get_file_content)
3. Search the web for related topics (browser MCP)
4. Generate a summary document (filesystem MCP)
```

### Programmatic Access

**Use Weaver MCP from Node.js**:

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'bun',
  args: ['run', 'mcp'],
  cwd: '/path/to/weaver'
});

const client = new Client({
  name: 'my-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);

// List tools
const tools = await client.listTools();
console.log(tools);

// Call tool
const result = await client.callTool({
  name: 'query_files',
  arguments: { directory: 'concepts' }
});
console.log(result);
```

### Performance Tuning

**Optimize shadow cache**:

```sql
-- Run SQLite optimizations
ANALYZE;
PRAGMA optimize;
VACUUM;
```

**Configure cache limits**:

Edit `.env`:

```bash
# Shadow cache settings
CACHE_MAX_SIZE=100000  # Max files to cache
CACHE_TTL=3600         # Cache TTL in seconds
```

**Monitor performance**:

```bash
# Watch query times
watch -n 1 'grep "executionTime" logs/weaver.log | tail -20'

# Track cache hit rate
grep "cacheHit" logs/weaver.log | sort | uniq -c
```

---

## Next Steps

- **Tool Reference**: See [mcp-tools-reference.md](./mcp-tools-reference.md) for detailed API docs
- **Server Architecture**: See [mcp-server-overview.md](./mcp-server-overview.md) for internals
- **Weaver Documentation**: See [../README.md](../README.md) for main docs

---

## Getting Help

**Issues**:
- Check logs: `tail -f logs/weaver.log`
- Enable debug logging: `LOG_LEVEL=debug`
- Test tools manually: `bun run test-tool`

**Resources**:
- MCP Protocol: https://modelcontextprotocol.io/
- Claude Desktop: https://claude.ai/download
- Weaver GitHub: https://github.com/your-org/weave-nn

**Community**:
- Discord: [Link to Discord]
- GitHub Discussions: [Link to Discussions]

---

**Last Updated**: 2025-10-24
**Maintained By**: Weave-NN Development Team
