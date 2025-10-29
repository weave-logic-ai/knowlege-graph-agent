# Weaver Integration Guide

**Version:** 0.1.0
**Date:** 2025-10-29
**Status:** ✅ Production Ready

## Overview

This guide shows you how to integrate Weaver into existing projects for knowledge graph management, workflow orchestration, and AI-powered documentation.

**What Weaver Provides:**
- 🌐 **MCP Server** - Model Context Protocol integration for Claude Desktop
- 🔄 **Workflow Engine** - Orchestrate complex document processing workflows
- 📚 **Knowledge Graph** - Automatic connection building and metadata enhancement
- 🤖 **AI Integration** - Semantic search, embeddings, and learning loops
- 📊 **Observability** - Real-time workflow monitoring and performance tracking

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Configuration](#configuration)
4. [Integration Scenarios](#integration-scenarios)
5. [Testing Weaver](#testing-weaver)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- **Node.js:** 20.0.0 or higher
- **Bun:** 1.0.0 or higher (recommended) OR npm
- **Operating System:** Linux, macOS, or Windows (WSL recommended)

### Required Tools
```bash
# Check Node.js version
node --version  # Should be >= 20.0.0

# Check Bun (recommended)
bun --version   # Should be >= 1.0.0

# OR use npm (alternative)
npm --version
```

### Optional Dependencies
- **Obsidian** - For vault integration (with Local REST API plugin)
- **Claude Desktop** - For MCP integration
- **PM2** - For production service management
- **Git** - For auto-commit features

---

## Installation Methods

### Method 1: NPM Package (Recommended for Production)

Once published, Weaver can be installed as a package:

```bash
# Install globally
npm install -g @weave-nn/weaver

# Or as project dependency
npm install @weave-nn/weaver --save-dev
```

### Method 2: Direct Build (For Development/Testing)

Clone and build Weaver from source:

```bash
# 1. Clone Weaver repository
git clone https://github.com/your-org/weave-nn.git
cd weave-nn/weaver

# 2. Install dependencies
bun install
# OR
npm install

# 3. Build the project
bun run build:cli
# OR
npm run build:cli

# 4. Link globally for CLI access
npm link
```

**Verify Installation:**
```bash
# Check Weaver CLI
weaver --version

# Check MCP server
weaver-mcp --version
```

### Method 3: As Submodule (For Monorepo Projects)

```bash
# Add Weaver as git submodule
git submodule add https://github.com/your-org/weave-nn.git libs/weaver
git submodule update --init --recursive

# Build Weaver
cd libs/weaver/weaver
bun install && bun run build:cli
```

---

## Configuration

### Step 1: Create Configuration File

Create a `.env` file in your project root:

```bash
# Copy example configuration
cp node_modules/@weave-nn/weaver/.env.example .env

# OR if built from source
cp libs/weaver/weaver/.env.example .env
```

### Step 2: Configure Essential Settings

Edit `.env` with your project-specific values:

```bash
# ============================
# VAULT CONFIGURATION
# ============================
# Path to your Obsidian vault or markdown directory
VAULT_PATH=/path/to/your/project/docs

# ============================
# AI CONFIGURATION
# ============================
# Anthropic API Key (for AI features)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Default AI Model
DEFAULT_AI_MODEL=claude-3-5-sonnet-20241022

# ============================
# WEAVER SERVICE CONFIGURATION
# ============================
# Environment
NODE_ENV=development

# Server Port
WEAVER_PORT=3000

# Log Level
LOG_LEVEL=info

# ============================
# WORKFLOW CONFIGURATION
# ============================
# Enable workflow orchestration
WORKFLOWS_ENABLED=true

# ============================
# MCP SERVER CONFIGURATION
# ============================
# Enable MCP server
MCP_ENABLED=true

# MCP transport (stdio for Claude Desktop)
MCP_TRANSPORT=stdio
```

### Step 3: Create Weaver Data Directories

```bash
# Create required directories
mkdir -p .weaver/data
mkdir -p .weaver/logs
mkdir -p .weaver/cache

# Add to .gitignore
echo ".weaver/" >> .gitignore
```

### Step 4: Initialize Vault Structure

If integrating with an Obsidian vault or markdown documentation:

```bash
# Initialize vault metadata
weaver vault init --path /path/to/your/docs

# Optional: Run metadata enhancement
weaver vault enhance-metadata --target /path/to/your/docs
```

---

## Integration Scenarios

### Scenario 1: Add to Obsidian Vault

**Use Case:** Enhance an existing Obsidian vault with AI-powered features.

**Setup Steps:**

1. **Install Obsidian Local REST API Plugin**
   - Open Obsidian
   - Go to Settings → Community Plugins
   - Search for "Local REST API"
   - Install and enable

2. **Configure Obsidian Integration**
   ```bash
   # In your .env file
   OBSIDIAN_API_URL=https://localhost:27124
   OBSIDIAN_API_KEY=your-api-key-from-obsidian
   ```

3. **Configure Claude Desktop MCP**

   Edit `~/.config/claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "weaver": {
         "command": "weaver-mcp",
         "env": {
           "VAULT_PATH": "/path/to/your/obsidian/vault",
           "ANTHROPIC_API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

4. **Test Integration**
   ```bash
   # Start Weaver service
   weaver service start

   # Check health
   weaver service health

   # Test vault access
   weaver vault stats
   ```

### Scenario 2: Add to Next.js Project

**Use Case:** Add knowledge graph and workflow capabilities to a Next.js application.

**Setup Steps:**

1. **Install Weaver**
   ```bash
   cd your-nextjs-project
   npm install @weave-nn/weaver --save-dev
   ```

2. **Create Weaver Configuration**
   ```bash
   # Create .env.local
   cat > .env.local << 'EOF'
   VAULT_PATH=./docs
   ANTHROPIC_API_KEY=your-key
   WORKFLOWS_ENABLED=true
   WEAVER_PORT=3001
   EOF
   ```

3. **Add Weaver Scripts to package.json**
   ```json
   {
     "scripts": {
       "weaver:start": "weaver service start",
       "weaver:health": "weaver service health",
       "weaver:build-graph": "weaver graph analyze ./docs",
       "dev": "concurrently \"next dev\" \"npm run weaver:start\""
     }
   }
   ```

4. **Create API Route for Weaver**

   Create `app/api/weaver/[...path]/route.ts`:
   ```typescript
   import { NextRequest } from 'next/server';

   export async function POST(
     request: NextRequest,
     { params }: { params: { path: string[] } }
   ) {
     const weaverUrl = `http://localhost:${process.env.WEAVER_PORT}`;
     const path = params.path.join('/');

     const response = await fetch(`${weaverUrl}/${path}`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
       },
       body: JSON.stringify(await request.json()),
     });

     return Response.json(await response.json());
   }
   ```

5. **Test Integration**
   ```bash
   # Start development server (with Weaver)
   npm run dev

   # In another terminal, test Weaver
   curl http://localhost:3001/health
   ```

### Scenario 3: Add to Node.js CLI Project

**Use Case:** Add workflow orchestration to a command-line tool.

**Setup Steps:**

1. **Install Weaver**
   ```bash
   cd your-cli-project
   npm install @weave-nn/weaver --save
   ```

2. **Create Weaver Client Module**

   Create `src/weaver-client.js`:
   ```javascript
   import { spawn } from 'child_process';
   import path from 'path';

   export class WeaverClient {
     constructor(config = {}) {
       this.vaultPath = config.vaultPath || './data';
       this.weaverBin = config.weaverBin || 'weaver';
     }

     async analyzeGraph() {
       return this.exec(['graph', 'analyze', this.vaultPath]);
     }

     async buildConnections() {
       return this.exec(['graph', 'build-connections']);
     }

     async runWorkflow(workflowId, params = {}) {
       return this.exec([
         'workflow',
         'run',
         workflowId,
         '--params',
         JSON.stringify(params)
       ]);
     }

     exec(args) {
       return new Promise((resolve, reject) => {
         const proc = spawn(this.weaverBin, args);
         let stdout = '';
         let stderr = '';

         proc.stdout.on('data', (data) => {
           stdout += data.toString();
         });

         proc.stderr.on('data', (data) => {
           stderr += data.toString();
         });

         proc.on('close', (code) => {
           if (code !== 0) {
             reject(new Error(stderr || `Process exited with code ${code}`));
           } else {
             resolve(stdout);
           }
         });
       });
     }
   }
   ```

3. **Use in Your CLI**

   Create `src/commands/docs.js`:
   ```javascript
   import { WeaverClient } from '../weaver-client.js';

   export async function docsCommand(options) {
     const weaver = new WeaverClient({
       vaultPath: options.docsPath || './docs'
     });

     console.log('📊 Analyzing documentation graph...');
     const analysis = await weaver.analyzeGraph();
     console.log(analysis);

     console.log('🔗 Building connections...');
     await weaver.buildConnections();
     console.log('✅ Documentation graph updated!');
   }
   ```

4. **Test Integration**
   ```bash
   # Build your CLI
   npm run build

   # Test Weaver integration
   node dist/cli.js docs --docs-path ./docs
   ```

### Scenario 4: Add to Monorepo

**Use Case:** Share Weaver across multiple packages in a monorepo.

**Setup Steps:**

1. **Install in Root**
   ```bash
   # In monorepo root
   npm install @weave-nn/weaver -w
   ```

2. **Create Shared Configuration**

   Create `weaver.config.js` in root:
   ```javascript
   export default {
     vaultPath: process.env.VAULT_PATH || './docs',
     workflowsEnabled: true,
     mcpEnabled: false, // Disable MCP in monorepo
     logLevel: 'info',
     packages: {
       api: {
         vaultPath: './packages/api/docs',
       },
       web: {
         vaultPath: './packages/web/docs',
       },
       mobile: {
         vaultPath: './packages/mobile/docs',
       }
     }
   };
   ```

3. **Add Shared Scripts**

   In root `package.json`:
   ```json
   {
     "scripts": {
       "weaver:analyze-all": "for pkg in packages/*; do weaver graph analyze $pkg/docs; done",
       "weaver:sync": "weaver vault sync --all-packages"
     }
   }
   ```

---

## Testing Weaver

### Quick Health Check

```bash
# 1. Check if Weaver is installed
weaver --version

# 2. Check service health
weaver service health

# 3. Verify configuration
weaver config validate

# 4. Test vault access
weaver vault stats --path /path/to/docs
```

### Test Workflow Execution

```bash
# 1. List available workflows
weaver workflow list

# 2. Test document connection workflow
weaver workflow run document-connection \
  --file-path /path/to/doc.md \
  --dry-run

# 3. Monitor workflow execution
weaver workflow status --follow
```

### Test Knowledge Graph Features

```bash
# 1. Analyze graph metrics
weaver graph analyze /path/to/docs

# 2. Find orphan documents
weaver graph orphans /path/to/docs

# 3. Suggest new connections
weaver graph suggest /path/to/docs

# 4. Validate graph structure
weaver graph validate /path/to/docs
```

### Test MCP Integration

```bash
# 1. Start MCP server in stdio mode
weaver-mcp

# 2. In Claude Desktop, test MCP tools:
# - "List files in my vault"
# - "Analyze knowledge graph"
# - "Find documents related to [topic]"
```

### Integration Test Suite

Create `tests/weaver-integration.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { WeaverClient } from '../src/weaver-client.js';

describe('Weaver Integration', () => {
  const weaver = new WeaverClient({
    vaultPath: './test-docs'
  });

  it('should analyze graph successfully', async () => {
    const result = await weaver.analyzeGraph();
    expect(result).toBeDefined();
    expect(result).toContain('Total documents:');
  });

  it('should build connections', async () => {
    await expect(weaver.buildConnections()).resolves.not.toThrow();
  });

  it('should run workflows', async () => {
    const result = await weaver.runWorkflow('document-connection', {
      filePath: './test-docs/sample.md'
    });
    expect(result).toBeDefined();
  });
});
```

**Run tests:**
```bash
npm test -- weaver-integration.test.js
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot find module 'weaver'"

**Cause:** Weaver not installed or not linked properly.

**Solution:**
```bash
# If installed globally
npm link @weave-nn/weaver

# If installed locally
npm install
npm run build:cli
```

#### 2. "VAULT_PATH not configured"

**Cause:** Missing environment variable.

**Solution:**
```bash
# Create .env file
echo "VAULT_PATH=/path/to/docs" > .env

# OR set in shell
export VAULT_PATH=/path/to/docs
```

#### 3. "Port 3000 already in use"

**Cause:** Another service using the same port.

**Solution:**
```bash
# Change port in .env
WEAVER_PORT=3001

# OR kill existing process
lsof -ti:3000 | xargs kill -9
```

#### 4. "MCP server not responding"

**Cause:** MCP not configured correctly in Claude Desktop.

**Solution:**
```bash
# 1. Verify MCP binary works
weaver-mcp --help

# 2. Check Claude Desktop config
cat ~/.config/claude/claude_desktop_config.json

# 3. Restart Claude Desktop
```

#### 5. "Workflow execution hangs"

**Cause:** Resource exhaustion or infinite loop.

**Solution:**
```bash
# 1. Check running processes
ps aux | grep weaver

# 2. Kill hanging processes
weaver service stop

# 3. Check logs
weaver service logs --tail 100

# 4. Restart with increased timeout
weaver workflow run document-connection --timeout 60000
```

#### 6. "Database locked" error

**Cause:** Multiple processes accessing SQLite database.

**Solution:**
```bash
# 1. Stop all Weaver services
weaver service stop

# 2. Remove lock file
rm .weaver/data/*.db-shm
rm .weaver/data/*.db-wal

# 3. Restart service
weaver service start
```

### Debug Mode

Enable detailed logging:

```bash
# Set log level
export LOG_LEVEL=debug

# Run with debug output
weaver --debug workflow run document-connection
```

### Getting Help

```bash
# Check command help
weaver --help
weaver workflow --help
weaver graph --help

# Check configuration
weaver config show

# Export diagnostics
weaver diagnostics export --output weaver-debug.json
```

---

## Production Deployment

### Using PM2

1. **Create PM2 ecosystem file**

   Create `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'weaver',
       script: 'weaver',
       args: 'service start',
       env: {
         NODE_ENV: 'production',
         VAULT_PATH: '/path/to/production/docs',
         LOG_LEVEL: 'info'
       },
       instances: 1,
       autorestart: true,
       watch: false,
       max_memory_restart: '1G'
     }]
   };
   ```

2. **Start with PM2**
   ```bash
   # Start service
   pm2 start ecosystem.config.js

   # Monitor
   pm2 monit

   # View logs
   pm2 logs weaver

   # Save configuration
   pm2 save
   pm2 startup
   ```

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy Weaver
COPY . .

# Build
RUN npm run build:cli

# Expose port
EXPOSE 3000

# Start service
CMD ["weaver", "service", "start"]
```

Build and run:
```bash
# Build image
docker build -t weaver:latest .

# Run container
docker run -d \
  --name weaver \
  -p 3000:3000 \
  -v /path/to/docs:/data/vault \
  -e VAULT_PATH=/data/vault \
  -e ANTHROPIC_API_KEY=your-key \
  weaver:latest
```

---

## Next Steps

1. **Read Documentation:**
   - [Architecture Overview](./architecture-overview.md)
   - [Workflow Development Guide](./workflow-development.md)
   - [MCP Tools Reference](./mcp-tools-reference.md)

2. **Explore Examples:**
   - [Example Workflows](../examples/workflows/)
   - [Integration Examples](../examples/integrations/)

3. **Join Community:**
   - [GitHub Discussions](https://github.com/your-org/weave-nn/discussions)
   - [Discord Server](https://discord.gg/weave-nn)

---

## Support

**Issues:** https://github.com/your-org/weave-nn/issues
**Documentation:** https://docs.weave-nn.io
**Email:** support@weave-nn.io

---

**Status:** ✅ Ready for Integration Testing
**Last Updated:** 2025-10-29
**Weaver Version:** 0.1.0
