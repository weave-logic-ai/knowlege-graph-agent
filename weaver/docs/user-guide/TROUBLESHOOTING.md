# Weaver Troubleshooting Guide

Common issues and solutions for Weaver setup and operation.

## Quick Diagnostics

Run these commands to identify common issues:

```bash
# Check Weaver is running
ps aux | grep weaver

# Check logs
tail -f logs/weaver.log

# Verify environment
cat .env

# Test vault access
ls -la $VAULT_PATH

# Check git status
cd $VAULT_PATH && git status
```

---

## Installation Issues

### Issue: `npm install` fails

**Symptoms:**
```
npm ERR! code EACCES
npm ERR! syscall access
```

**Causes:**
- Insufficient permissions
- Node version incompatibility

**Solutions:**

1. **Check Node version:**
   ```bash
   node --version  # Should be v20+
   ```

2. **Fix permissions:**
   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```

3. **Use NVM (recommended):**
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20
   npm install
   ```

---

### Issue: `npm run build` fails

**Symptoms:**
```
error TS2307: Cannot find module 'xyz'
```

**Solutions:**

1. **Clear node_modules:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check TypeScript version:**
   ```bash
   npm list typescript
   # Should be ^5.0.0
   ```

3. **Verify tsconfig.json:**
   ```bash
   cat tsconfig.json  # Check for syntax errors
   ```

---

## Configuration Issues

### Issue: `VAULT_PATH not found`

**Symptoms:**
```
Error: VAULT_PATH does not exist: /path/to/vault
```

**Solutions:**

1. **Verify path is absolute:**
   ```env
   # ✗ Wrong
   VAULT_PATH=./vault

   # ✓ Correct
   VAULT_PATH=/home/user/vault
   ```

2. **Check directory exists:**
   ```bash
   ls -d /path/to/vault
   ```

3. **Create directory if needed:**
   ```bash
   mkdir -p /path/to/vault
   ```

---

### Issue: `ANTHROPIC_API_KEY invalid`

**Symptoms:**
```
Error: Invalid API key
AuthenticationError: 401
```

**Solutions:**

1. **Verify API key format:**
   ```env
   # Should start with sk-ant-api03-
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **Check key is active:**
   - Visit https://console.anthropic.com
   - Verify key exists and is not revoked

3. **Test with curl:**
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
   ```

---

## Shadow Cache Issues

### Issue: Shadow cache not updating

**Symptoms:**
- MCP queries return stale data
- New files not appearing in search

**Solutions:**

1. **Force rebuild:**
   ```bash
   rm -rf $VAULT_PATH/.weaver/shadow-cache.db
   npm start  # Will rebuild automatically
   ```

2. **Check file watcher:**
   ```bash
   # Look for file change events in logs
   tail -f logs/weaver.log | grep "File changed"
   ```

3. **Verify ignore patterns:**
   ```env
   # Make sure your files aren't ignored
   FILE_WATCHER_IGNORE_PATTERNS=.git,.obsidian,node_modules
   ```

4. **Use polling for network drives:**
   ```env
   FILE_WATCHER_POLL_INTERVAL_MS=1000
   ```

---

### Issue: Shadow cache queries slow

**Symptoms:**
- Queries take >1 second
- Database file very large

**Solutions:**

1. **Check database size:**
   ```bash
   ls -lh $VAULT_PATH/.weaver/shadow-cache.db
   ```

2. **Vacuum database:**
   ```bash
   sqlite3 $VAULT_PATH/.weaver/shadow-cache.db "VACUUM;"
   ```

3. **Rebuild indexes:**
   ```bash
   sqlite3 $VAULT_PATH/.weaver/shadow-cache.db "REINDEX;"
   ```

4. **Check for slow queries:**
   ```bash
   # Enable query logging
   LOG_LEVEL=debug
   ```

---

## Git Auto-Commit Issues

### Issue: Git commits not working

**Symptoms:**
- Files change but no commits created
- Error: `Git not initialized`

**Solutions:**

1. **Verify git is initialized:**
   ```bash
   cd $VAULT_PATH
   git status
   ```

2. **Initialize git if needed:**
   ```bash
   cd $VAULT_PATH
   git init
   git config user.name "Weaver"
   git config user.email "weaver@weave-nn.local"
   ```

3. **Check configuration:**
   ```env
   GIT_AUTO_COMMIT=true
   FEATURE_AI_ENABLED=true  # Required for AI commit messages
   ANTHROPIC_API_KEY=sk-ant-...
   ```

4. **Verify debounce timer:**
   ```env
   # Default is 5 minutes, reduce for testing
   GIT_COMMIT_DEBOUNCE_MS=10000  # 10 seconds
   ```

---

### Issue: Commit messages are generic

**Symptoms:**
```
commit: "Update files"
```

**Solution:**

Enable AI features:
```env
FEATURE_AI_ENABLED=true
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### Issue: Too many commits

**Symptoms:**
- Commit on every file change
- Git history cluttered

**Solution:**

Increase debounce time:
```env
# Commit every 15 minutes instead of 5
GIT_COMMIT_DEBOUNCE_MS=900000
```

---

## MCP Integration Issues

### Issue: MCP tools not showing in Claude Desktop

**Symptoms:**
- Claude Desktop doesn't see Weaver tools
- No error messages

**Solutions:**

1. **Verify MCP server is running:**
   ```bash
   ps aux | grep weaver
   ```

2. **Check Claude Desktop config:**
   ```bash
   cat ~/.config/claude/config.json
   ```

   Should contain:
   ```json
   {
     "mcpServers": {
       "weaver": {
         "command": "node",
         "args": ["/path/to/weaver/dist/index.js"]
       }
     }
   }
   ```

3. **Verify path is correct:**
   ```bash
   ls -la /path/to/weaver/dist/index.js
   ```

4. **Restart Claude Desktop:**
   ```bash
   # macOS
   killall "Claude"
   open -a Claude

   # Linux
   killall claude
   claude &
   ```

5. **Check MCP server logs:**
   ```bash
   tail -f logs/mcp-server.log
   ```

---

### Issue: MCP tools return errors

**Symptoms:**
```
Error: Tool execution failed
```

**Solutions:**

1. **Check tool parameters:**
   ```typescript
   // MCP tools use camelCase, not snake_case
   // ✗ Wrong
   { workflow_id: "123" }

   // ✓ Correct
   { workflowId: "123" }
   ```

2. **Verify vault path:**
   ```bash
   # Ensure VAULT_PATH is set correctly
   echo $VAULT_PATH
   ```

3. **Test tool directly:**
   ```bash
   # Use MCP inspector
   npx @modelcontextprotocol/inspector node dist/index.js
   ```

---

## Workflow Issues

### Issue: Workflows not executing

**Symptoms:**
- File changes don't trigger workflows
- No workflow logs

**Solutions:**

1. **Check workflow engine is enabled:**
   ```env
   WORKFLOW_ENGINE_ENABLED=true
   ```

2. **Verify workflows are registered:**
   ```bash
   # Should list all workflows
   grep "Workflow registered" logs/weaver.log
   ```

3. **Check file patterns:**
   ```typescript
   // Workflows must match file event types
   triggers: ['file:add', 'file:change', 'file:unlink']
   ```

4. **Enable debug logging:**
   ```env
   LOG_LEVEL=debug
   ```

---

### Issue: Workflow timeouts

**Symptoms:**
```
Error: Workflow execution timeout
```

**Solution:**

Increase timeout:
```env
# Default 30 seconds, increase for slow workflows
WORKFLOW_EXECUTION_TIMEOUT_MS=60000
```

---

## AI Agent Issues

### Issue: Auto-tagging not working

**Symptoms:**
- New notes don't get tags
- No `suggested_tags` in frontmatter

**Solutions:**

1. **Enable AI features:**
   ```env
   FEATURE_AI_ENABLED=true
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **Check note has content:**
   ```markdown
   # My Note

   This note needs actual content for AI to analyze.
   Just a title won't trigger auto-tagging.
   ```

3. **Verify API quota:**
   - Check https://console.anthropic.com for rate limits
   - Ensure you have API credits

4. **Check timeout settings:**
   ```env
   AI_TIMEOUT_MS=3000  # Increase if needed
   ```

---

### Issue: Auto-linking creates wrong links

**Symptoms:**
- Links to unrelated notes
- Broken wikilinks

**Solutions:**

1. **Check note titles are unique:**
   ```bash
   # Find duplicate titles
   cd $VAULT_PATH
   find . -name "*.md" -exec basename {} \; | sort | uniq -d
   ```

2. **Use explicit frontmatter:**
   ```yaml
   ---
   title: "Exact Note Title"
   aliases: ["Alias 1", "Alias 2"]
   ---
   ```

3. **Adjust AI model:**
   ```env
   # Use more accurate model
   AI_MODEL=claude-3-opus-20240229
   ```

---

## Performance Issues

### Issue: High CPU usage

**Symptoms:**
- Weaver using >50% CPU
- System slowdown

**Solutions:**

1. **Check file watcher:**
   ```bash
   # Large vaults may cause high CPU
   du -sh $VAULT_PATH
   ```

2. **Increase debounce:**
   ```env
   GIT_COMMIT_DEBOUNCE_MS=600000  # 10 minutes
   ```

3. **Use polling instead of events:**
   ```env
   FILE_WATCHER_POLL_INTERVAL_MS=5000
   ```

4. **Ignore more patterns:**
   ```env
   FILE_WATCHER_IGNORE_PATTERNS=.git,.obsidian,node_modules,*.tmp,*.swp,*.bak
   ```

---

### Issue: High memory usage

**Symptoms:**
- Weaver using >1GB RAM
- System swapping

**Solutions:**

1. **Limit shadow cache:**
   ```bash
   # Check cache size
   ls -lh $VAULT_PATH/.weaver/shadow-cache.db
   ```

2. **Disable periodic sync:**
   ```env
   SHADOW_CACHE_SYNC_INTERVAL_MS=0
   ```

3. **Reduce AI token limit:**
   ```env
   AI_MAX_TOKENS=250  # Reduce from 500
   ```

---

## Testing Issues

### Issue: Tests failing

**Symptoms:**
```
FAIL tests/integration/mcp-server-e2e.test.ts
```

**Solutions:**

1. **Clear test cache:**
   ```bash
   npm run test:clean
   rm -rf .vitest
   ```

2. **Rebuild project:**
   ```bash
   npm run build
   ```

3. **Check test environment:**
   ```bash
   NODE_ENV=test npm test
   ```

4. **Run specific test:**
   ```bash
   npm test -- tests/integration/mcp-server-e2e.test.ts
   ```

---

## Advanced Troubleshooting

### Enable Debug Logging

```env
LOG_LEVEL=debug
```

Then check logs:
```bash
tail -f logs/weaver.log
```

---

### Database Inspection

```bash
# Open shadow cache
sqlite3 $VAULT_PATH/.weaver/shadow-cache.db

# Check tables
.tables

# Query files
SELECT path, title, modified FROM files LIMIT 10;

# Check tags
SELECT tag, COUNT(*) FROM tags GROUP BY tag ORDER BY COUNT(*) DESC;

# Exit
.quit
```

---

### Network Debugging

```bash
# Test Claude API connectivity
curl -I https://api.anthropic.com

# Test with proxy
export HTTPS_PROXY=http://proxy:8080
npm start
```

---

### Clean Reinstall

```bash
# Complete clean reinstall
rm -rf node_modules package-lock.json
rm -rf dist
rm -rf $VAULT_PATH/.weaver
npm install
npm run build
npm start
```

---

## Getting Help

If issues persist after trying these solutions:

1. **Check Documentation:**
   - [Quickstart Guide](QUICKSTART.md)
   - [Configuration Reference](CONFIGURATION.md)
   - [Architecture Guide](../developer/ARCHITECTURE.md)

2. **Enable Debug Logging:**
   ```env
   LOG_LEVEL=debug
   ```

3. **Collect Information:**
   - Node version: `node --version`
   - Weaver version: `npm run version`
   - OS: `uname -a`
   - Error logs: `tail -100 logs/weaver.log`

4. **Report Issue:**
   - GitHub Issues (if applicable)
   - Include debug logs and configuration (redact API keys!)

---

## Common Error Messages

### `EACCES: permission denied`

**Fix:** Check file permissions
```bash
chmod -R u+rw $VAULT_PATH
```

---

### `ENOENT: no such file or directory`

**Fix:** Verify all paths are absolute and exist
```bash
ls -la $VAULT_PATH
```

---

### `SQLITE_BUSY: database is locked`

**Fix:** Close other processes accessing database
```bash
fuser $VAULT_PATH/.weaver/shadow-cache.db
```

---

### `Network timeout`

**Fix:** Check internet connectivity and API endpoints
```bash
ping api.anthropic.com
```

---

## Prevention Tips

1. **Always use absolute paths** in `.env`
2. **Keep API keys secure** (never commit `.env`)
3. **Regular git commits** before major changes
4. **Monitor disk space** for shadow cache
5. **Update dependencies** regularly: `npm update`
6. **Test after changes** with `npm test`
7. **Backup vault** before bulk operations

---

**Last Updated**: 2025-10-26
**Troubleshooting Guide Version**: 1.0
