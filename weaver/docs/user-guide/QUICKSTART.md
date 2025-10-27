# Weaver - Quickstart Guide

Get started with Weaver in 5 minutes. Weaver is an intelligent vault initialization and workflow automation system for Obsidian.

## Prerequisites

- **Node.js**: v20 or later
- **Obsidian**: Latest version
- **Claude API Key**: For AI-powered features (optional)

## Step 1: Installation

```bash
cd /path/to/weaver
npm install
```

## Step 2: Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Required: Path to your Obsidian vault
VAULT_PATH=/path/to/your/obsidian/vault

# Optional: AI Features
FEATURE_AI_ENABLED=true
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional: Git Auto-Commit
GIT_AUTO_COMMIT=true
GIT_AUTHOR_NAME=Weaver
GIT_AUTHOR_EMAIL=weaver@weave-nn.local
GIT_COMMIT_DEBOUNCE_MS=300000  # 5 minutes
```

## Step 3: Build the Project

```bash
npm run build
```

## Step 4: Run Weaver

```bash
npm start
```

You should see:

```
[INFO] ✅ Workflow engine started
[INFO] Watching vault: /path/to/vault
[INFO] Shadow cache initialized
```

## Step 5: Test It Out

### Initialize a New Vault

```bash
npm run init-vault
```

This creates a well-structured Obsidian vault with:
- Pre-configured folders and templates
- MOC (Map of Content) structure
- YAML frontmatter templates
- Cross-linked nodes

### Use MCP Tools

If using Claude Desktop, Weaver provides MCP tools for:
- **Shadow Cache**: Fast vault queries without file I/O
- **Workflows**: Automated note processing
- **File Operations**: Read, write, search notes

## Key Features

✅ **Vault Initialization**: Create structured vaults with templates
✅ **Shadow Cache**: SQLite-backed fast vault indexing
✅ **Workflow Engine**: Event-driven note automation
✅ **Git Auto-Commit**: Automatic version control
✅ **MCP Integration**: Claude Desktop compatibility
✅ **AI Features**: Auto-tagging, linking, content generation

## Next Steps

- [Configuration Guide](./CONFIGURATION.md) - Detailed settings
- [Architecture Overview](../developer/ARCHITECTURE.md) - How it works
- [MCP Tools Reference](../mcp-tools-reference.md) - Available tools
- [Workflows](../developer/WORKFLOWS.md) - Create custom workflows

## Troubleshooting

**Shadow cache not updating?**
```bash
# Force rebuild
rm -rf .weaver/shadow-cache.db
npm start
```

**Git commits not working?**
- Check `GIT_AUTO_COMMIT=true` in `.env`
- Verify `FEATURE_AI_ENABLED=true` (required for commit messages)
- Check git is initialized: `cd /path/to/vault && git status`

**MCP tools not showing in Claude?**
- Restart Claude Desktop
- Check MCP server configuration
- Verify Weaver is running

## Support

- Documentation: `/home/aepod/dev/weave-nn/weaver/docs`
- Issues: Report bugs in project tracker
- Examples: See `examples/` directory

---

**Happy note-taking! 📝**
