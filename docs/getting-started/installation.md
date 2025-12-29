---
title: Installation
description: Complete installation guide for @weavelogic/knowledge-graph-agent
category: getting-started
---

# Installation

This guide covers all installation methods for `@weavelogic/knowledge-graph-agent`, including requirements, optional dependencies, and troubleshooting common issues.

## Requirements

Before installing, ensure your environment meets these requirements:

| Requirement | Version | Notes |
|-------------|---------|-------|
| **Node.js** | >= 20.0.0 | Required. LTS version recommended |
| **npm** | >= 9.0.0 | Included with Node.js |
| **SQLite** | 3.x | Bundled with better-sqlite3 |

### Verifying Node.js Version

```bash
node --version
# Should output: v20.x.x or higher
```

If your Node.js version is below 20.0.0, upgrade using [nvm](https://github.com/nvm-sh/nvm) or download from [nodejs.org](https://nodejs.org/).

## Installation Methods

### Global Installation (Recommended for CLI Usage)

Install globally to use the `kg` command from anywhere:

```bash
npm install -g @weavelogic/knowledge-graph-agent
```

After installation, verify with:

```bash
kg --version
kg --help
```

### Local Project Installation

Install as a project dependency for programmatic usage:

```bash
npm install @weavelogic/knowledge-graph-agent
```

Add to `devDependencies` if only needed during development:

```bash
npm install --save-dev @weavelogic/knowledge-graph-agent
```

### Using npx (No Installation Required)

Run commands directly without installation:

```bash
# Initialize a knowledge graph
npx @weavelogic/knowledge-graph-agent init

# Generate knowledge graph
npx @weavelogic/knowledge-graph-agent graph

# Start servers
npx @weavelogic/knowledge-graph-agent serve --all
```

This method always uses the latest version but requires downloading on each run.

### Alternative Binary Name

Both `kg` and `knowledge-graph` binaries are available:

```bash
# These commands are equivalent
kg init
knowledge-graph init
```

## Optional Dependencies

### Claude Flow Integration

For AI-powered multi-agent coordination and deep analysis:

```bash
npm install agentic-flow@^1.10.0
```

Or use the optional peer dependency (auto-resolved if available):

```json
{
  "peerDependencies": {
    "agentic-flow": "^1.10.0"
  },
  "peerDependenciesMeta": {
    "agentic-flow": {
      "optional": true
    }
  }
}
```

Enable claude-flow features in configuration:

```json
{
  "agents": {
    "claudeFlowEnabled": true
  }
}
```

### Obsidian Integration

For Obsidian vault integration, no additional installation is needed. The library automatically detects Obsidian vaults by looking for the `.obsidian` folder in your documentation directory.

To use with an existing Obsidian vault:

```bash
kg init --docs-path /path/to/your/obsidian/vault
```

## Verifying Installation

### Check CLI Installation

```bash
# Check version
kg --version

# View all available commands
kg --help

# Test initialization (dry run)
kg init --help
```

### Check Programmatic Installation

Create a test file to verify the library loads correctly:

```typescript
// test-install.ts
import {
  createKnowledgeGraph,
  createDatabase,
  getDefaultConfig,
} from '@weavelogic/knowledge-graph-agent';

console.log('Default config:', getDefaultConfig());
console.log('Installation verified successfully!');
```

Run with:

```bash
npx tsx test-install.ts
```

### Check MCP Server

Verify the MCP server can start:

```bash
kg serve --mcp --help
```

## Post-Installation Setup

### Initialize Configuration Directory

After installation, initialize the `.kg` configuration directory:

```bash
kg init
```

This creates:

```
.kg/
  config.json      # Configuration file
  knowledge.db     # SQLite database
  backups/         # Automatic backups
```

### Set Up Environment Variables (Optional)

For advanced features, set these environment variables:

```bash
# Claude API key (for AI features)
export ANTHROPIC_API_KEY="your-api-key"

# Custom database path
export KG_DATABASE_PATH=".kg/knowledge.db"

# Enable debug logging
export KG_LOG_LEVEL="debug"
```

## Troubleshooting

### Common Installation Issues

#### Error: `EACCES` Permission Denied

When installing globally on macOS/Linux:

```bash
# Option 1: Use sudo (not recommended)
sudo npm install -g @weavelogic/knowledge-graph-agent

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g @weavelogic/knowledge-graph-agent
```

#### Error: `better-sqlite3` Build Failure

The native SQLite binding requires compilation tools:

**On macOS:**
```bash
xcode-select --install
```

**On Ubuntu/Debian:**
```bash
sudo apt-get install build-essential python3
```

**On Windows:**
```bash
npm install --global windows-build-tools
```

#### Error: `Node.js version too old`

```
Error: The engine "node" is incompatible with this module.
Expected version ">=20.0.0". Got "18.x.x"
```

Upgrade Node.js:

```bash
# Using nvm
nvm install 20
nvm use 20

# Or download from nodejs.org
```

#### Error: `Module not found`

If imports fail after installation:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Platform-Specific Issues

#### Windows

- Use PowerShell or Windows Terminal (not cmd.exe)
- Ensure paths use forward slashes in configuration files
- Some features may require Windows Subsystem for Linux (WSL)

#### macOS Apple Silicon (M1/M2/M3)

Native dependencies are compiled for arm64. If you encounter issues:

```bash
# Ensure native builds target correct architecture
npm rebuild
```

#### Linux

Ensure development tools are installed:

```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# RHEL/CentOS/Fedora
sudo dnf groupinstall "Development Tools"
```

### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/weavelogic/knowledge-graph-agent/issues)
2. Run diagnostics: `kg diag run`
3. Enable debug logging: `KG_LOG_LEVEL=debug kg <command>`
4. Create a new issue with your Node.js version, OS, and error output

## Next Steps

- [Quick Start Guide](./quick-start.md) - Get up and running in 5 minutes
- [Configuration Guide](./configuration.md) - Customize your setup
- [CLI Commands Reference](/docs/CLI-COMMANDS-REFERENCE.md) - Full command documentation
