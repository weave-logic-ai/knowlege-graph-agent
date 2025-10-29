# Weaver Quick Start Guide

**Get Weaver running in your project in 5 minutes**

---

## 🚀 Fast Track Installation

### Option 1: Build from Source (Current Setup)

```bash
# 1. Navigate to weaver directory
cd /home/aepod/dev/weave-nn/weaver

# 2. Ensure build is up to date
npm run build:cli

# 3. Link globally (one-time setup)
npm link

# 4. Make CLI executable and link globally
chmod +x dist/cli/bin.js
npm link

# 5. Verify installation
weaver --version
```

### Option 2: Add to Fresh Project

```bash
# 1. Navigate to your project
cd /path/to/your/project

# 2. Install Weaver (when published)
npm install -g @weave-nn/weaver

# OR link to local build
npm link @weave-nn/weaver
```

---

## ⚡ 60-Second Setup

### 1. Create Configuration

```bash
# Create .env file in your project
cat > .env << 'EOF'
VAULT_PATH=/path/to/your/docs
ANTHROPIC_API_KEY=sk-ant-your-key-here
DEFAULT_AI_MODEL=claude-3-5-sonnet-20241022
NODE_ENV=development
WEAVER_PORT=3000
LOG_LEVEL=info
WORKFLOWS_ENABLED=true
MCP_ENABLED=false
EOF
```

### 2. Create Data Directories

```bash
mkdir -p .weaver/{data,logs,cache}
echo ".weaver/" >> .gitignore
```

### 3. Test Weaver

```bash
# Check health
weaver service health

# Analyze your docs
weaver graph analyze /path/to/your/docs

# View stats
weaver vault stats --path /path/to/your/docs
```

---

## 🎯 Essential Commands

### Service Management
```bash
# Start Weaver service
weaver service start

# Check health
weaver service health

# View logs
weaver service logs --tail 50

# Stop service
weaver service stop

# Restart service
weaver service restart
```

### Knowledge Graph Operations
```bash
# Analyze graph
weaver graph analyze /path/to/docs

# Find orphans
weaver graph orphans /path/to/docs

# Suggest connections
weaver graph suggest /path/to/docs

# Validate structure
weaver graph validate /path/to/docs

# View metrics
weaver graph metrics /path/to/docs
```

### Vault Operations
```bash
# Initialize vault
weaver vault init --path /path/to/docs

# Enhance metadata
weaver vault enhance-metadata --target /path/to/docs

# View statistics
weaver vault stats --path /path/to/docs

# Sync vault
weaver vault sync
```

### Workflow Operations
```bash
# List workflows
weaver workflow list

# Run workflow (dry run)
weaver workflow run document-connection \
  --file-path /path/to/doc.md \
  --dry-run

# Run workflow (live)
weaver workflow run document-connection \
  --file-path /path/to/doc.md

# Check workflow status
weaver workflow status [workflow-id]

# Monitor in real-time
weaver workflow status --follow
```

---

## 🧪 Test on Fresh Project

### Scenario 1: Test with Sample Markdown Files

```bash
# 1. Create test directory
mkdir -p /tmp/weaver-test/docs
cd /tmp/weaver-test

# 2. Create sample files
cat > docs/README.md << 'EOF'
---
title: Test Document
type: documentation
status: draft
tags: [test, sample]
---

# Test Document

This is a sample document to test Weaver.

## Links
- [[another-doc]]
- [[concepts/test-concept]]
EOF

cat > docs/another-doc.md << 'EOF'
---
title: Another Document
type: documentation
---

# Another Document

References back to [[README]].
EOF

mkdir -p docs/concepts
cat > docs/concepts/test-concept.md << 'EOF'
---
title: Test Concept
type: concept
---

# Test Concept

A concept document.
EOF

# 3. Create .env
cat > .env << 'EOF'
VAULT_PATH=/tmp/weaver-test/docs
ANTHROPIC_API_KEY=sk-ant-your-key-here
NODE_ENV=development
WEAVER_PORT=3000
LOG_LEVEL=info
WORKFLOWS_ENABLED=true
EOF

# 4. Test Weaver commands
weaver graph analyze /tmp/weaver-test/docs
weaver graph validate /tmp/weaver-test/docs
weaver vault stats --path /tmp/weaver-test/docs

# 5. Run workflow
weaver workflow run document-connection \
  --file-path /tmp/weaver-test/docs/README.md \
  --vault-root /tmp/weaver-test/docs \
  --dry-run

# 6. Cleanup
cd ~ && rm -rf /tmp/weaver-test
```

### Scenario 2: Test with Existing Obsidian Vault

```bash
# 1. Navigate to vault directory
cd /path/to/your/obsidian/vault

# 2. Create .env
cat > .env << 'EOF'
VAULT_PATH=.
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=your-api-key-from-obsidian
ANTHROPIC_API_KEY=sk-ant-your-key-here
NODE_ENV=development
WORKFLOWS_ENABLED=true
MCP_ENABLED=true
MCP_TRANSPORT=stdio
EOF

# 3. Analyze existing vault
weaver graph analyze .
weaver vault stats --path .

# 4. Test metadata enhancement (dry run first!)
weaver vault enhance-metadata --target . --dry-run

# 5. Build connections (dry run)
weaver workflow run document-connection \
  --file-path ./your-doc.md \
  --vault-root . \
  --dry-run
```

### Scenario 3: Test with Next.js Project

```bash
# 1. Navigate to Next.js project
cd /path/to/nextjs-project

# 2. Install Weaver
npm install @weave-nn/weaver --save-dev
# OR
npm link @weave-nn/weaver

# 3. Create docs directory
mkdir -p docs/architecture docs/api docs/guides

# 4. Create sample docs
echo "# Architecture\nSystem design docs." > docs/architecture/README.md
echo "# API Reference\nAPI documentation." > docs/api/README.md

# 5. Create .env.local
cat > .env.local << 'EOF'
VAULT_PATH=./docs
ANTHROPIC_API_KEY=sk-ant-your-key-here
WORKFLOWS_ENABLED=true
WEAVER_PORT=3001
EOF

# 6. Add scripts to package.json
# Manually add these scripts:
# "weaver:analyze": "weaver graph analyze ./docs",
# "weaver:build": "weaver graph build-connections",
# "weaver:serve": "weaver service start"

# 7. Test commands
npm run weaver:analyze
npm run weaver:serve
```

---

## 🔍 Verify Installation

### Health Check Script

Create `test-weaver.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Testing Weaver Installation..."

# Test 1: CLI available
echo -n "✓ Checking CLI... "
weaver --version
echo "PASS"

# Test 2: MCP binary
echo -n "✓ Checking MCP... "
weaver-mcp --help > /dev/null
echo "PASS"

# Test 3: Build artifacts
echo -n "✓ Checking build artifacts... "
if [ -f "$(which weaver)" ]; then
  echo "PASS"
else
  echo "FAIL - Run 'npm link' in weaver directory"
  exit 1
fi

# Test 4: Configuration
echo -n "✓ Checking configuration... "
if [ -f ".env" ]; then
  echo "PASS"
else
  echo "WARN - No .env file found"
fi

# Test 5: Service health
echo -n "✓ Checking service health... "
weaver service health > /dev/null 2>&1 && echo "PASS" || echo "Service not running (OK if intentional)"

echo ""
echo "✅ Weaver installation verified!"
```

**Run verification:**
```bash
chmod +x test-weaver.sh
./test-weaver.sh
```

---

## 🐛 Quick Troubleshooting

### Weaver command not found
```bash
# Re-link globally
cd /home/aepod/dev/weave-nn/weaver
npm link

# Verify
which weaver
weaver --version
```

### Port already in use
```bash
# Change port in .env
echo "WEAVER_PORT=3001" >> .env

# OR kill process
lsof -ti:3000 | xargs kill -9
```

### Cannot access vault
```bash
# Check path
echo $VAULT_PATH

# Set explicitly
export VAULT_PATH=/path/to/docs

# Verify access
ls -la $VAULT_PATH
```

### Build errors
```bash
# Clean rebuild
cd /home/aepod/dev/weave-nn/weaver
npm run clean
npm run build:cli
```

---

## 📊 Monitor Performance

```bash
# Watch process count
watch -n 1 'ps aux | grep weaver | wc -l'

# Monitor logs in real-time
weaver service logs --follow

# Check resource usage
ps aux | grep weaver
```

---

## 🎓 Next Steps

Once Weaver is working:

1. **Read Full Integration Guide:**
   ```bash
   cat docs/INTEGRATION-GUIDE.md
   ```

2. **Explore Workflows:**
   ```bash
   weaver workflow list
   weaver workflow describe document-connection
   ```

3. **Configure Claude Desktop MCP:**
   - Edit `~/.config/claude/claude_desktop_config.json`
   - Add Weaver MCP server configuration
   - Restart Claude Desktop

4. **Create Custom Workflows:**
   - See `docs/workflow-development.md`
   - Review examples in `examples/workflows/`

---

## 🆘 Get Help

```bash
# Command help
weaver --help
weaver graph --help
weaver workflow --help

# Configuration help
weaver config show
weaver config validate

# Export diagnostics
weaver diagnostics export
```

---

**Status:** ✅ Ready to Test
**Time to Setup:** ~5 minutes
**Next:** [Full Integration Guide](./INTEGRATION-GUIDE.md)
