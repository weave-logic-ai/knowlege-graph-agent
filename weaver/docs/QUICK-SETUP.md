# Weaver Quick Setup Guide

**Get started with weaver + Claude-Flow in 2 minutes**

---

## ⚡ Super Quick Start

```bash
# 1. Navigate to weaver
cd weaver/

# 2. Build weaver
npm run build:cli

# 3. Link globally
chmod +x dist/cli/bin.js
npm link

# 4. Run automated setup
weaver setup claude-flow

# 5. Restart Claude Desktop
# That's it! 🎉
```

---

## 📋 What Gets Installed

The `weaver setup claude-flow` command automatically:

1. **Installs & Initializes claude-flow**
   - Runs: `npx claude-flow@alpha init --force`
   
2. **Adds MCP Servers**
   - Runs: `claude mcp add claude-flow npx claude-flow@alpha mcp start`
   - Optionally: `claude mcp add ruv-swarm npx ruv-swarm mcp start`

3. **Configures Claude Desktop**
   - Creates: `~/.config/claude-desktop/config.json`
   - Adds weaver MCP server entry

4. **Sets Up Claude-Flow Integration**
   - Creates: `~/.config/claude-flow/weaver.json`
   - Enables weaver tools and agent rules

5. **Creates Environment File**
   - Creates: `weaver/.env`
   - Sets vault path and configuration

---

## 🎯 Usage After Setup

### In Claude Desktop

```
You: "Search my vault for notes about machine learning"

Claude: [uses weaver_search_vault tool]
Found 12 notes about machine learning:
- concepts/neural-networks.md
- research/ml-algorithms.md
...
```

### Via CLI

```bash
# Search vault
npx claude-flow mcp call weaver weaver_search_vault '{"query": "learning loop"}'

# Cultivate knowledge graph
weaver cultivate . --all

# Check MCP status
npx claude-flow mcp status
```

---

## 🔧 Troubleshooting

### "weaver: command not found"

```bash
# Rebuild and relink
cd weaver/
npm run build:cli
chmod +x dist/cli/bin.js
npm link
```

### "claude-flow not found"

```bash
# Install claude-flow manually
npm install -g @ruvnet/claude-flow@alpha
npx claude-flow@alpha init --force
```

### MCP server not showing in Claude Desktop

1. Verify config: `cat ~/.config/claude-desktop/config.json`
2. Restart Claude Desktop completely
3. Check MCP server path is correct

### Want to start over?

```bash
# Remove configs
rm ~/.config/claude-desktop/config.json
rm ~/.config/claude-flow/weaver.json
rm weaver/.env

# Run setup again
weaver setup claude-flow
```

---

## 📚 Next Steps

After setup:

1. **Initialize a vault**
   ```bash
   weaver init-vault . -o docs/
   ```

2. **Start cultivating**
   ```bash
   weaver cultivate docs/ --all
   ```

3. **Configure agent rules**
   - Edit: `weaver/config/agent-rules.yaml`
   - Enable auto-cultivation, metadata enhancement, etc.

4. **Use in Claude Desktop**
   - Ask Claude to search your vault
   - Request knowledge graph analysis
   - Get Claude to suggest connections

---

## 🎓 Learn More

- [Full Integration Guide](./CLAUDE-FLOW-INTEGRATION.md)
- [Command Reference](./COMMAND-REFERENCE.md)
- [Agent Rules Configuration](../config/agent-rules.yaml)

---

**Happy weaving! 🧵**
