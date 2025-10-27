# Weaver Troubleshooting Guide

**Version**: 1.0.0 (MVP)
**Date**: 2025-10-27

## Quick Diagnostics

```bash
# Check service status
weaver status

# View logs
weaver logs --tail 50

# Run health check
weaver health

# Check shadow cache stats
weaver stats
```

## Common Issues

### Services Won't Start

**Symptoms**: `weaver start` fails or hangs

**Solutions**:
1. Check for port conflicts
2. Verify `.env` configuration
3. Check permissions on `.weaver` directory
4. Review logs: `weaver logs --level error`

### File Watcher Not Detecting Changes

**Symptoms**: Files created but no events logged

**Solutions**:
1. Check debounce setting (may be too high)
2. Verify file is not in ignored patterns
3. Restart file watcher: `weaver restart --service=file-watcher`
4. Check system file descriptor limits: `ulimit -n`

### Shadow Cache Out of Sync

**Symptoms**: File counts don't match vault

**Solutions**:
1. Force full sync: `weaver sync --full`
2. Clear cache and rebuild:
   ```bash
   weaver stop
   rm .weaver/shadow-cache.db*
   weaver start
   ```
3. Check for file permission issues

### High Memory Usage

**Symptoms**: Process using > 500MB RAM

**Solutions**:
1. Reduce `MAX_CONCURRENT_SYNCS`
2. Increase `FILE_WATCHER_DEBOUNCE_MS`
3. Check for memory leaks: `weaver diagnostics --memory`
4. Restart services periodically

### API Connection Failures

**Symptoms**: "Failed to connect" errors

**Obsidian API**:
1. Verify Obsidian is running
2. Check plugin is enabled
3. Test connection: `curl -H "Authorization: Bearer KEY" http://localhost:27123/ping`
4. Check firewall settings

**Anthropic API**:
1. Verify API key is valid
2. Check network connectivity
3. Verify billing/quota limits
4. Test with curl (see INSTALLATION.md)

### Git Auto-Commit Issues

**Symptoms**: Commits not being created

**Solutions**:
1. Verify git is initialized: `git status`
2. Check `AUTO_COMMIT_ENABLED=true`
3. Check debounce delay (default: 5 minutes)
4. Trigger manual commit: `weaver commit`
5. Review git logs: `git log`

## Performance Issues

### Slow Startup

**Target**: < 100ms
**Actual**: > 1 second

**Solutions**:
1. Check vault size (very large vaults may take longer)
2. Disable `SYNC_ON_START` if not needed
3. Reduce `SYNC_BATCH_SIZE`
4. Check disk I/O performance

### Slow Sync

**Target**: > 100 files/second
**Actual**: < 50 files/second

**Solutions**:
1. Check disk performance (use SSD)
2. Reduce concurrent operations
3. Check for antivirus interference
4. Profile with: `weaver sync --profile`

## Error Messages

### "EACCES: permission denied"

**Cause**: Insufficient permissions
**Solution**:
```bash
chmod -R u+rw .weaver
chmod 600 .env
```

### "ENOENT: no such file or directory"

**Cause**: Missing file or directory
**Solution**:
```bash
weaver init  # Recreate .weaver directory
```

### "Database is locked"

**Cause**: Multiple processes accessing DB
**Solution**:
```bash
weaver stop
rm .weaver/*.db-shm .weaver/*.db-wal
weaver start
```

### "API key invalid"

**Cause**: Invalid or expired API key
**Solution**:
1. Regenerate API key
2. Update `.env` file
3. Restart services

## Getting Help

### Collect Diagnostic Information

```bash
# System info
weaver diagnostics --system

# Service logs
weaver logs --export logs.txt

# Configuration (redacted)
weaver config --show --redact

# Performance metrics
weaver metrics --export metrics.json
```

### Report an Issue

Include:
1. Weaver version (`weaver --version`)
2. Node.js version (`node --version`)
3. Operating system
4. Error logs
5. Steps to reproduce
6. Expected vs actual behavior

Submit at: https://github.com/yourusername/weaver/issues

## Advanced Troubleshooting

### Enable Debug Logging

```env
LOG_LEVEL=debug
```

Restart services to see detailed logs.

### Profile Performance

```bash
# Profile sync operation
weaver sync --profile

# Profile startup
weaver start --profile

# Monitor real-time
weaver monitor --interval 1000
```

### Database Debugging

```bash
# Check database integrity
sqlite3 .weaver/shadow-cache.db "PRAGMA integrity_check;"

# View schema
sqlite3 .weaver/shadow-cache.db ".schema"

# Check file count
sqlite3 .weaver/shadow-cache.db "SELECT COUNT(*) FROM files;"
```

For installation issues, see [INSTALLATION.md](./INSTALLATION.md)
For configuration help, see [CONFIGURATION.md](./CONFIGURATION.md)
