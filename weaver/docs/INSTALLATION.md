# Weaver Installation Guide

**Version**: 1.0.0 (MVP)
**Date**: 2025-10-27
**Status**: Production Ready

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Methods](#installation-methods)
4. [Quick Start](#quick-start)
5. [Detailed Setup](#detailed-setup)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v20.x or higher
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: v2.30 or higher
- **Operating System**: Linux, macOS, or Windows with WSL2

### Optional Software

- **Bun**: v1.x (alternative runtime, faster than Node.js)
- **Claude Desktop**: For MCP server integration
- **Obsidian**: v1.4.x or higher (for vault synchronization)

### Required Accounts

- **Anthropic API**: API key for Claude integration
  - Sign up at: https://console.anthropic.com/
  - Get API key from: https://console.anthropic.com/settings/keys
- **Obsidian Local REST API**: For vault synchronization
  - Install plugin: https://github.com/coddingtonbear/obsidian-local-rest-api

---

## System Requirements

### Minimum Requirements

- **CPU**: 2 cores, 2.0 GHz
- **RAM**: 4 GB
- **Disk Space**: 500 MB (plus vault size)
- **Network**: Internet connection for API access

### Recommended Requirements

- **CPU**: 4+ cores, 2.5+ GHz
- **RAM**: 8+ GB
- **Disk Space**: 2+ GB (plus vault size)
- **SSD**: Recommended for better shadow cache performance

### Performance Expectations

Based on benchmarking results:
- **Startup Time**: < 100ms for all services
- **Shadow Cache**: 3000+ files/second sync speed
- **Workflow Latency**: < 1ms average execution time
- **Memory Usage**: < 10MB/hour growth under sustained load

---

## Installation Methods

### Method 1: npm Installation (Recommended)

```bash
# Install globally
npm install -g @weave-nn/weaver

# Verify installation
weaver --version
```

### Method 2: From Source

```bash
# Clone repository
git clone https://github.com/yourusername/weaver.git
cd weaver

# Install dependencies
npm install

# Build project
npm run build

# Link for global use (optional)
npm link
```

### Method 3: Using Bun (Faster Alternative)

```bash
# Install using bun
bun install -g @weave-nn/weaver

# Or from source
git clone https://github.com/yourusername/weaver.git
cd weaver
bun install
bun run build
```

---

## Quick Start

### 1. Initialize Vault

```bash
# Navigate to your Obsidian vault
cd /path/to/your/vault

# Initialize Weaver
weaver init

# This creates:
# - .weaver/ directory
# - .env file (you'll need to edit this)
# - .gitignore updates
# - Initial configuration
```

### 2. Configure Environment

Edit the `.env` file in your vault root:

```env
# Required - Vault Configuration
VAULT_PATH=/path/to/your/vault

# Required - Obsidian API
OBSIDIAN_API_URL=http://localhost:27123
OBSIDIAN_API_KEY=your-obsidian-api-key-here

# Required - AI Provider
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Optional - Git Configuration
GIT_AUTHOR_NAME=Your Name
GIT_AUTHOR_EMAIL=your.email@example.com
AUTO_COMMIT_ENABLED=true
AUTO_COMMIT_DEBOUNCE_MS=300000

# Optional - Service Configuration
FILE_WATCHER_DEBOUNCE_MS=1000
SHADOW_CACHE_DB_PATH=.weaver/shadow-cache.db
LOG_LEVEL=info
```

### 3. Start Services

```bash
# Start all Weaver services
weaver start

# Expected output:
# ✅ Activity logger initialized
# ✅ Shadow cache database opened
# ✅ Workflow engine started
# ✅ File watcher ready
# 🎉 Weaver is running!
```

### 4. Verify Installation

```bash
# Check service status
weaver status

# Run health check
weaver health

# View logs
weaver logs
```

---

## Detailed Setup

### Step 1: Obsidian Local REST API Setup

1. **Install Obsidian Plugin**:
   - Open Obsidian
   - Settings → Community Plugins → Browse
   - Search for "Local REST API"
   - Click "Install" then "Enable"

2. **Generate API Key**:
   - Settings → Local REST API
   - Click "Generate New API Key"
   - Copy the API key

3. **Configure Plugin**:
   ```
   Port: 27123 (default)
   Auto-start: Enabled
   CORS: Enabled
   ```

4. **Verify API**:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
        http://localhost:27123/ping

   # Expected response: {"status":"OK"}
   ```

### Step 2: Anthropic API Setup

1. **Create Account**:
   - Visit: https://console.anthropic.com/
   - Sign up or log in

2. **Generate API Key**:
   - Navigate to: Settings → API Keys
   - Click "Create Key"
   - Copy the key (starts with `sk-ant-`)

3. **Set Billing** (if required):
   - Add payment method for API usage
   - Set usage limits if desired

4. **Verify API Key**:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{
       "model": "claude-3-5-sonnet-20241022",
       "max_tokens": 1024,
       "messages": [{"role": "user", "content": "Hello"}]
     }'
   ```

### Step 3: Git Configuration

1. **Initialize Git Repository** (if not already):
   ```bash
   cd /path/to/your/vault
   git init
   git config user.name "Your Name"
   git config user.email "your.email@example.com"
   ```

2. **Create .gitignore**:
   ```gitignore
   # Weaver
   .weaver/*.db
   .weaver/*.db-shm
   .weaver/*.db-wal
   .weaver/tmp/
   .activity-logs/

   # Environment
   .env
   .env.local

   # Obsidian
   .obsidian/workspace*
   .obsidian/cache
   .trash/

   # System
   .DS_Store
   Thumbs.db
   ```

3. **Initial Commit**:
   ```bash
   git add .
   git commit -m "chore: initial vault setup with Weaver"
   ```

### Step 4: Directory Structure

After installation, your vault should have:

```
your-vault/
├── .weaver/                    # Weaver data directory
│   ├── shadow-cache.db         # File index database
│   ├── config.json             # Runtime configuration
│   └── tmp/                    # Temporary files
├── .activity-logs/             # Activity logging
│   └── YYYYMMDD-session-id/
│       └── activity.jsonl      # JSONL log files
├── .env                        # Environment configuration
├── .gitignore                  # Git ignore rules
└── [your vault files]          # Your markdown files
```

### Step 5: MCP Server Setup (Optional)

For Claude Desktop integration:

1. **Install Claude Code**:
   ```bash
   npm install -g @anthropic/claude-code
   ```

2. **Configure MCP Server**:
   ```bash
   # Add Weaver MCP server
   claude mcp add weaver \
     npx @weave-nn/weaver mcp start
   ```

3. **Verify MCP Tools**:
   - Open Claude Desktop
   - Start new conversation
   - MCP tools should appear in tool palette

---

## Verification

### Verify Installation

```bash
# Check version
weaver --version

# Should output: Weaver v1.0.0

# Check help
weaver --help

# Should display all available commands
```

### Verify Services

```bash
# Start services in test mode
weaver start --test

# Check status
weaver status

# Expected output:
# ✅ Activity Logger: Running
# ✅ Shadow Cache: 1,234 files indexed
# ✅ Workflow Engine: Running
# ✅ File Watcher: Monitoring 1,234 files
# ✅ Git Auto-Commit: Enabled (debounce: 5m)
```

### Verify File Watcher

```bash
# Create test file
echo "# Test File" > test-weaver.md

# Check logs (should see file detected)
weaver logs --tail 10

# Expected log entry:
# [2025-10-27T12:00:00.000Z] INFO File detected {"path":"test-weaver.md","type":"add"}

# Clean up
rm test-weaver.md
```

### Verify Shadow Cache

```bash
# Run sync manually
weaver sync

# Check stats
weaver stats

# Expected output:
# Shadow Cache Statistics:
# - Total Files: 1,234
# - Last Sync: 2025-10-27 12:00:00
# - Sync Duration: 412ms
# - Throughput: 2,993 files/second
```

### Verify Git Integration

```bash
# Check git status
git status

# Create test file
echo "# Git Test" > git-test.md

# Wait for auto-commit (default: 5 minutes)
# Or trigger manually:
weaver commit

# Verify commit
git log -1

# Expected commit message includes:
# Generated with Weaver
# Co-Authored-By: Weaver <weaver@ai>

# Clean up
rm git-test.md
```

### Run Integration Tests

```bash
# Run test suite
npm test

# Expected output:
# ✓ System Validation: 21/21 tests passed
# ✓ Performance Benchmarks: 10/10 passed
# ✓ Integration Tests: 20/20 passed
# ✓ Security Audit: PASSED (0 critical issues)
```

---

## Troubleshooting

### Common Issues

#### Issue: "Command not found: weaver"

**Solution**:
```bash
# Reinstall globally
npm install -g @weave-nn/weaver

# Or use npx
npx @weave-nn/weaver start
```

#### Issue: "EACCES: permission denied"

**Solution**:
```bash
# Fix npm permissions
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Reinstall
npm install -g @weave-nn/weaver
```

#### Issue: "Failed to connect to Obsidian API"

**Solution**:
1. Verify Obsidian is running
2. Check Local REST API plugin is enabled
3. Verify API key in `.env`
4. Test connection:
   ```bash
   curl -H "Authorization: Bearer YOUR_KEY" \
        http://localhost:27123/ping
   ```

#### Issue: "Invalid Anthropic API key"

**Solution**:
1. Verify key format (should start with `sk-ant-`)
2. Check for extra spaces or newlines in `.env`
3. Regenerate key if needed
4. Test key:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: YOUR_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
   ```

#### Issue: "Shadow cache database locked"

**Solution**:
```bash
# Stop services
weaver stop

# Remove lock files
rm .weaver/*.db-shm .weaver/*.db-wal

# Restart
weaver start
```

#### Issue: "File watcher not detecting changes"

**Solution**:
1. Check file watcher is running:
   ```bash
   weaver status
   ```

2. Verify ignored patterns in config

3. Restart file watcher:
   ```bash
   weaver restart --service=file-watcher
   ```

For more troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Next Steps

After successful installation:

1. **Configure Services**: See [CONFIGURATION.md](./CONFIGURATION.md)
2. **Deploy to Production**: See [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)
3. **Set Up Monitoring**: See [MONITORING.md](./MONITORING.md)
4. **Learn More**: See [README.md](../README.md)

---

## Support

- **Documentation**: https://github.com/yourusername/weaver/docs
- **Issues**: https://github.com/yourusername/weaver/issues
- **Discussions**: https://github.com/yourusername/weaver/discussions
- **Email**: support@weaver.ai

---

**Installation Guide Version**: 1.0.0
**Last Updated**: 2025-10-27
**Status**: Production Ready
