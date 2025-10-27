# Weaver Deployment Checklist

**Version**: 1.0.0 (MVP)
**Date**: 2025-10-27

## Pre-Deployment

### ✅ Environment Setup
- [ ] Node.js v20.x+ installed
- [ ] npm v9.x+ installed
- [ ] Git v2.30+ installed
- [ ] Obsidian installed and running
- [ ] Anthropic API key obtained

### ✅ Configuration
- [ ] `.env` file created with all required variables
- [ ] `.env` file secured (chmod 600)
- [ ] Obsidian Local REST API plugin installed and configured
- [ ] API keys tested and verified
- [ ] Git configured with user name and email

### ✅ Testing
- [ ] All unit tests passing (`npm test`)
- [ ] Integration tests passing (20/20)
- [ ] Performance benchmarks meeting targets
- [ ] Security audit passed (0 critical issues)

## Deployment

### ✅ Installation
- [ ] Weaver installed globally or from source
- [ ] Dependencies installed successfully
- [ ] Build completed without errors
- [ ] CLI accessible (`weaver --version` works)

### ✅ Initialization
- [ ] Vault initialized (`weaver init`)
- [ ] `.weaver` directory created
- [ ] Shadow cache database created
- [ ] `.gitignore` updated correctly

### ✅ Service Startup
- [ ] Services started successfully (`weaver start`)
- [ ] Activity logger running
- [ ] Shadow cache synced
- [ ] Workflow engine started
- [ ] File watcher monitoring
- [ ] No errors in logs

## Post-Deployment

### ✅ Verification
- [ ] Health check passed (`weaver health`)
- [ ] Status check shows all services running
- [ ] Shadow cache stats showing correct file count
- [ ] File watcher detecting changes
- [ ] Git auto-commit working (if enabled)

### ✅ Monitoring
- [ ] Logs accessible and readable
- [ ] Performance metrics being collected
- [ ] Error handling working correctly
- [ ] Memory usage stable

### ✅ Documentation
- [ ] Team trained on Weaver usage
- [ ] Runbook created for common issues
- [ ] Emergency contacts established
- [ ] Backup procedures documented

## Success Criteria

- ✅ All services running without errors
- ✅ Startup time < 100ms
- ✅ Shadow cache sync < 1 second for typical vault
- ✅ File watcher responding within 1 second
- ✅ Memory usage < 100MB
- ✅ No crashes for 24+ hours of operation

## Rollback Plan

If deployment fails:

1. Stop all services: `weaver stop`
2. Backup current state:
   ```bash
   cp -r .weaver .weaver.backup
   cp .env .env.backup
   ```
3. Restore previous version
4. Restart services
5. Verify functionality
6. Document issues for troubleshooting

For detailed troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
