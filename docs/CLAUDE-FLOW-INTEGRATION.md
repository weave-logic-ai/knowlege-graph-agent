---
title: "Weaver + Claude-Flow Integration Guide"
type: integration
status: active
created_date: 2025-10-29
tags: [weaver, claude-flow, mcp, integration]
priority: critical
---

# Weaver + Claude-Flow Integration Guide

**Objective**: Enable weaver to work seamlessly with claude-flow for autonomous agent workflows

---

## 🎯 Overview

This guide configures weaver to:
1. Run as an MCP server for Claude-Flow
2. Expose tools via MCP for agent use
3. Provide agent rules for automated vault management
4. Enable autonomous knowledge graph cultivation

---

## 🚀 Quick Setup (Automated)

**One command to set everything up:**

```bash
# Navigate to weaver directory
cd weaver/

# Run automated setup
weaver setup claude-flow

# Or with vault path specified
weaver setup claude-flow --vault ~/my-vault
```

This will:
- ✅ Initialize claude-flow with `npx claude-flow@alpha init --force`
- ✅ Add claude-flow MCP server: `claude mcp add claude-flow`
- ✅ Add ruv-swarm MCP server (optional): `claude mcp add ruv-swarm`
- ✅ Configure Claude Desktop MCP
- ✅ Create Claude-Flow weaver.json config
- ✅ Generate .env file with your vault path

---

## 📦 Manual Setup (If Needed)

If you prefer manual setup or automated setup fails:

```bash
# 1. Initialize claude-flow
npx claude-flow@alpha init --force

# 2. Add MCP servers
claude mcp add claude-flow npx claude-flow@alpha mcp start
claude mcp add ruv-swarm npx ruv-swarm mcp start  # Optional: Enhanced coordination

# 3. Verify weaver is built and linked
cd weaver/
npm run build:cli
chmod +x dist/cli/bin.js
npm link

# 4. Verify installations
weaver --version
npx claude-flow --version
```

---

## 🔧 Manual Configuration (Reference)

> **Note**: If you used `weaver setup claude-flow`, these configs are already created!

### Step 1: Add Weaver MCP Server to Claude Desktop

Edit `~/.config/claude-desktop/config.json`:

```json
{
  "mcpServers": {
    "weaver": {
      "command": "node",
      "args": ["/home/aepod/dev/weave-nn/weaver/dist/mcp-server/cli.js"],
      "env": {
        "VAULT_PATH": "/path/to/your/vault",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Important**: Update paths to match your system:
- Replace `/home/aepod/dev/weave-nn/weaver/dist/mcp-server/cli.js` with actual path
- Replace `/path/to/your/vault` with your vault location

### Step 2: Configure Claude-Flow Integration

Create `~/.config/claude-flow/weaver.json`:

```json
{
  "name": "weaver",
  "type": "mcp-server",
  "enabled": true,
  "config": {
    "command": "node",
    "args": ["/home/aepod/dev/weave-nn/weaver/dist/mcp-server/cli.js"],
    "env": {
      "VAULT_PATH": "/path/to/your/vault",
      "SHADOW_CACHE_PATH": "/path/to/your/vault/.shadow-cache.db",
      "LOG_LEVEL": "info"
    }
  },
  "tools": {
    "enabled": [
      "weaver_search_vault",
      "weaver_get_file",
      "weaver_update_metadata",
      "weaver_search_tags",
      "weaver_cultivate",
      "weaver_init_vault"
    ]
  },
  "rules": {
    "auto_cultivate": true,
    "auto_metadata": true,
    "auto_commit": true
  }
}
```

### Step 3: Create Agent Rules

Create `weaver/config/agent-rules.yaml`:

```yaml
# Weaver Agent Rules for Claude-Flow
version: 1.0
rules:
  # Auto-cultivation on file changes
  - name: auto-cultivate
    trigger: file_changed
    conditions:
      - path_matches: "**/*.md"
      - not_in_path: ".git"
    actions:
      - tool: weaver_cultivate
        args:
          mode: incremental
          icons: true
          connections: true
          metadata: true

  # Auto-metadata enhancement
  - name: enhance-metadata
    trigger: file_created
    conditions:
      - path_matches: "**/*.md"
      - missing_frontmatter: true
    actions:
      - tool: weaver_update_metadata
        args:
          auto: true

  # Auto-commit on batch operations
  - name: auto-commit
    trigger: batch_complete
    conditions:
      - files_changed: ">= 5"
    actions:
      - tool: weaver_commit
        args:
          message: "chore: auto-commit from weaver agent"

  # Orphan detection and connection
  - name: connect-orphans
    trigger: scheduled
    schedule: "0 */6 * * *"  # Every 6 hours
    actions:
      - tool: weaver_cultivate
        args:
          orphans-only: true
          connections: true
          max: 10
```

---

## 🛠️ Available MCP Tools

### Core Vault Tools

```typescript
// Search vault by tags, content, or metadata
weaver_search_vault({
  query: "machine learning",
  tags: ["ai", "research"],
  limit: 20
})

// Get file content and metadata
weaver_get_file({
  path: "concepts/neural-networks.md"
})

// Update file metadata
weaver_update_metadata({
  path: "docs/architecture.md",
  metadata: {
    status: "complete",
    tags: ["architecture", "design"]
  }
})

// Search by tags
weaver_search_tags({
  tags: ["wip", "priority-high"],
  operator: "AND"
})
```

### Cultivation Tools

```typescript
// Cultivate knowledge graph
weaver_cultivate({
  path: ".",
  mode: "incremental",
  icons: true,
  connections: true,
  metadata: true,
  orphans_only: false,
  max: 50
})

// Initialize new vault
weaver_init_vault({
  project_path: "./my-project",
  output_path: "./docs",
  template: "nextjs"
})
```

### Service Management Tools

```typescript
// Start weaver services
weaver_service_start({
  name: "file-watcher"
})

// Check service health
weaver_service_health({
  name: "mcp-server"
})

// View service status
weaver_service_status()
```

---

## 🤖 Agent Workflows

### Workflow 1: Autonomous Knowledge Graph Maintenance

```yaml
name: kg-maintenance
description: Automatically maintain knowledge graph health
triggers:
  - file_watcher
  - scheduled: "0 2 * * *"  # Daily at 2 AM

steps:
  - name: detect-orphans
    tool: weaver_search_vault
    args:
      filter: orphaned
  
  - name: connect-orphans
    tool: weaver_cultivate
    args:
      orphans_only: true
      connections: true
  
  - name: update-metadata
    tool: weaver_cultivate
    args:
      metadata: true
  
  - name: commit-changes
    tool: weaver_commit
    args:
      message: "chore: automated kg maintenance"
```

### Workflow 2: Documentation Enhancement

```yaml
name: doc-enhancement
description: Enhance documentation with metadata and connections
triggers:
  - file_created
  - file_modified

steps:
  - name: extract-metadata
    tool: weaver_update_metadata
    args:
      auto: true
      ai_enhance: true
  
  - name: suggest-connections
    tool: weaver_cultivate
    args:
      connections: true
      max: 5
  
  - name: apply-icons
    tool: weaver_cultivate
    args:
      icons: true
```

---

## 🚀 Usage Examples

### From Claude-Flow CLI

```bash
# Start weaver MCP server
npx claude-flow mcp start weaver

# Execute cultivation via MCP
npx claude-flow mcp call weaver weaver_cultivate '{
  "path": ".",
  "mode": "incremental",
  "all": true
}'

# Search vault
npx claude-flow mcp call weaver weaver_search_vault '{
  "query": "learning loop",
  "limit": 10
}'
```

### From Claude Desktop

Once configured, weaver tools are available in Claude Desktop:

```
You: "Search my vault for notes about machine learning"

Claude: [uses weaver_search_vault tool]
Found 12 notes about machine learning:
- concepts/neural-networks.md
- research/ml-algorithms.md
...

You: "Cultivate the knowledge graph and fix orphaned documents"

Claude: [uses weaver_cultivate tool]
Cultivating knowledge graph...
✓ Connected 5 orphaned documents
✓ Enhanced metadata for 12 files
✓ Applied icons to 18 documents
```

---

## 📋 Environment Variables

Create `weaver/.env`:

```bash
# Vault Configuration
VAULT_PATH=/path/to/your/vault
SHADOW_CACHE_PATH=/path/to/your/vault/.shadow-cache.db

# MCP Server
MCP_PORT=3000
MCP_HOST=localhost

# Logging
LOG_LEVEL=info
LOG_FILE=logs/weaver.log

# Claude-Flow Integration
CLAUDE_FLOW_ENABLED=true
CLAUDE_FLOW_AUTO_CULTIVATE=true
CLAUDE_FLOW_AUTO_COMMIT=true

# API Keys (if using AI features)
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
```

---

## 🔍 Troubleshooting

### MCP Server Not Starting

```bash
# Check if port is available
lsof -i :3000

# View MCP server logs
tail -f logs/weaver-mcp.log

# Test MCP server directly
node weaver/dist/mcp-server/cli.js
```

### Tools Not Showing in Claude Desktop

1. Verify config.json syntax:
```bash
cat ~/.config/claude-desktop/config.json | jq .
```

2. Restart Claude Desktop

3. Check MCP server status:
```bash
npx claude-flow mcp status weaver
```

### Permission Issues

```bash
# Ensure executable permissions
chmod +x weaver/dist/mcp-server/cli.js
chmod +x weaver/dist/cli/bin.js

# Verify vault permissions
ls -la /path/to/vault
```

---

## 🔗 Related Documentation

- [Weaver CLI Reference](./COMMAND-REFERENCE.md)
- [MCP Server Architecture](../architecture/mcp-server-architecture.md)
- [Agent Rules Configuration](../config/agent-rules.md)
- [Claude-Flow Documentation](https://github.com/ruvnet/claude-flow)

---

## 📝 Next Steps

1. **Test MCP Integration**: `npx claude-flow mcp status weaver`
2. **Configure Agent Rules**: Edit `config/agent-rules.yaml`
3. **Start File Watcher**: `weaver service start file-watcher`
4. **Enable Auto-Cultivation**: Set `CLAUDE_FLOW_AUTO_CULTIVATE=true`

---

**Status**: Active Integration
**Last Updated**: 2025-10-29
**Version**: 1.0.0
