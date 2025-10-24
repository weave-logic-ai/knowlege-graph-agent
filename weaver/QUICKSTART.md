# Weaver Quick Start

Quick guide to get Weaver running and test the file watcher.

---

## 1. Setup Environment

```bash
# Navigate to weaver directory
cd /home/aepod/dev/weave-nn/weaver

# Copy environment template
cp .env.example .env

# Edit .env with your actual values
nano .env
```

**Required environment variables**:
```bash
# Minimum required to start
VAULT_PATH=/home/aepod/dev/weave-nn/weave-nn
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=your-api-key-here

# Optional: AI features (can skip for basic file watcher testing)
VERCEL_AI_GATEWAY_API_KEY=your-key-here
# or
ANTHROPIC_API_KEY=your-key-here
```

---

## 2. Install Dependencies

```bash
# Install with Bun
bun install
```

---

## 3. Start Weaver

```bash
# Development mode with hot reload
bun run dev
```

You should see output like:
```
[2025-10-23T...] INFO  🧵 Starting Weaver - Neural Network Junction for Weave-NN
[2025-10-23T...] INFO  Configuration loaded
[2025-10-23T...] INFO  Starting file watcher
[2025-10-23T...] INFO  ✅ File watcher ready
[2025-10-23T...] INFO  ✅ Weaver started successfully
```

---

## 4. Test File Watcher

Open a **new terminal** (keep Weaver running in the first one):

```bash
# Test 1: Create a new markdown file
echo "# Test Node" > /home/aepod/dev/weave-nn/weave-nn/concepts/test-file-watcher.md

# Test 2: Modify the file
echo "Content updated at $(date)" >> /home/aepod/dev/weave-nn/weave-nn/concepts/test-file-watcher.md

# Test 3: Delete the file
rm /home/aepod/dev/weave-nn/weave-nn/concepts/test-file-watcher.md
```

**Expected output in Weaver terminal**:
```
[...] INFO  📝 File event detected { type: 'add', path: 'concepts/test-file-watcher.md', size: 12 }
[...] INFO  📝 File event detected { type: 'change', path: 'concepts/test-file-watcher.md', size: 58 }
[...] INFO  📝 File event detected { type: 'unlink', path: 'concepts/test-file-watcher.md' }
```

---

## 5. Stop Weaver

Press `Ctrl+C` in the Weaver terminal:

```
[...] INFO  🛑 Received SIGINT, shutting down gracefully...
[...] INFO  Stopping file watcher
[...] INFO  ✅ File watcher stopped
```

---

## Troubleshooting

### "Configuration validation failed: VAULT_PATH is required"

Edit `.env` and set `VAULT_PATH` to your vault location:
```bash
VAULT_PATH=/home/aepod/dev/weave-nn/weave-nn
```

### "Configuration validation failed: OBSIDIAN_API_KEY is required"

You can use a placeholder for basic testing:
```bash
OBSIDIAN_API_KEY=test-key-placeholder
```

### No file events appearing

1. Check that `FILE_WATCHER_ENABLED=true` in `.env` (default)
2. Verify vault path is correct: `echo $VAULT_PATH` or check `.env`
3. Make sure you're creating files in the vault directory, not elsewhere
4. Check that files end with `.md` (only markdown files are watched)

### File watcher ignoring files

Check `FILE_WATCHER_IGNORE` in `.env`. Default ignores:
- `.obsidian/**`
- `.git/**`
- `node_modules/**`
- `.archive/**`

---

## Next Steps

Once file watcher is working:

1. **Implement Shadow Cache** - SQLite database for metadata
2. **Implement Workflow Engine** - workflow.dev integration
3. **Implement MCP Server** - Expose tools to AI agents
4. **Add HTTP Server** - Health checks and metrics endpoint

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development guide.
