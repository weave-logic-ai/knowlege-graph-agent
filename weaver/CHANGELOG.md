# Changelog

All notable changes to Weaver will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-26

### Added - MVP Release

#### Phase 5: MCP Integration
- **MCP Server**: Full Model Context Protocol implementation for Claude Desktop
- **Shadow Cache Tools**: 6 MCP tools for fast vault queries
  - `query_files` - Search by tags, content, metadata
  - `get_file` - Retrieve file metadata
  - `get_file_content` - Read file content
  - `search_tags` - Find files by tag
  - `search_links` - Query wikilinks
  - `get_stats` - Vault statistics
- **Workflow Tools**: 4 MCP tools for workflow automation
  - `trigger_workflow` - Manual workflow execution
  - `list_workflows` - List available workflows
  - `get_workflow_status` - Check execution status
  - `get_workflow_history` - View execution history
- **SQLite Shadow Cache**: Sub-100ms query performance
- **Real-time Sync**: Automatic vault indexing with file watcher
- **MCP Testing**: Comprehensive integration and E2E tests

#### Phase 6: Vault Initialization
- **VaultInitializer**: Create structured Obsidian vaults from project directories
- **DirectoryScanner**: Fast directory traversal with `.gitignore` support
- **FrameworkDetector**: Automatic project structure analysis
- **NodeGenerator**: MOC (Map of Content) structure generation
- **FrontmatterGenerator**: YAML frontmatter template creation
- **WikilinkBuilder**: Automatic cross-reference generation
- **Template System**: Pre-built vault templates
- **CLI Tool**: `npm run init-vault` command

#### Phase 8: Git Automation
- **GitClient**: simple-git wrapper with TypeScript support
- **AutoCommitService**: Debounced commits (5-minute default)
- **AI Commit Messages**: Claude-generated semantic commit messages
- **GitLogger**: Structured audit logging
- **File Watcher Integration**: Automatic commit queue on file changes
- **Configurable Debouncing**: Adjustable commit timing via environment variables

#### Phase 9: Testing & Documentation
- **Test Coverage**: 85%+ code coverage achieved
  - 34 MCP E2E integration tests
  - 19 Directory scanner tests
  - 15+ Unit tests (Shadow cache, workflow engine, git client)
- **User Documentation**:
  - Quickstart Guide (5-minute setup)
  - Configuration Reference
  - Troubleshooting Guide
  - Architecture Overview
- **Developer Documentation**:
  - System Architecture
  - API Reference
  - Testing Guide
  - Contributing Guidelines
- **README & Changelog**: Project overview and version history

### Changed

#### Configuration
- **Environment Variables**: Consolidated `.env` configuration
  - Added `GIT_AUTO_COMMIT` flag
  - Added `GIT_COMMIT_DEBOUNCE_MS` setting
  - Added `GIT_AUTHOR_NAME` and `GIT_AUTHOR_EMAIL`
  - Added `FEATURE_AI_ENABLED` flag
  - Added `FEATURE_MCP_SERVER` flag

#### API Changes
- **Workflow Engine**: Changed `listWorkflows()` to `getRegistry().getAllWorkflows()`
- **MCP Tool Parameters**: Standardized on camelCase (not snake_case)
  - `workflow_id` → `workflowId`
  - `execution_id` → `executionId`

#### Dependencies
- **Added**: `simple-git@^3.25.0` for git operations
- **Added**: `js-yaml` as direct dependency (previously transitive)
- **Updated**: All dependencies to latest stable versions

### Fixed

#### Test Fixes (Phase 9)
- **MCP E2E Tests**: Fixed 4 failing workflow integration tests
  - Corrected API method calls (`getRegistry().getAllWorkflows()`)
  - Fixed parameter naming (camelCase convention)
- **YAML Module**: Resolved module resolution issues
  - Changed from `yaml` to `js-yaml` for consistency
  - Fixed frontmatter parsing in auto-link/auto-tag tests

#### Bug Fixes
- **Shadow Cache**: Fixed hash-based change detection
- **File Watcher**: Improved debouncing logic
- **MCP Tools**: Enhanced error handling and validation
- **Workflow Engine**: Fixed async execution issues

### Documentation

#### User Guides
- [Quickstart Guide](docs/user-guide/QUICKSTART.md) - Complete setup walkthrough
- [Configuration Reference](docs/user-guide/CONFIGURATION.md) - All environment variables
- [Troubleshooting](docs/user-guide/TROUBLESHOOTING.md) - Common issues and solutions

#### Developer Guides
- [Architecture](docs/developer/ARCHITECTURE.md) - System design overview
- [MCP Tools Reference](docs/mcp-tools-reference.md) - Complete API documentation
- [MCP Usage Guide](docs/mcp-usage-guide.md) - How to use MCP tools

#### Additional Documentation
- [Claude Desktop Setup](docs/claude-desktop-setup.md) - MCP integration guide
- [Shadow Cache Tools](docs/shadow-cache-tools-usage.md) - Shadow cache API reference
- [MCP Server Lifecycle](docs/mcp-server-lifecycle.md) - Server management

### Performance

- **Shadow Cache**: <100ms query latency for 10,000+ file vaults
- **Incremental Updates**: Hash-based change detection reduces redundant indexing
- **Batch Operations**: Optimized bulk file processing
- **Test Execution**: Full test suite runs in <30 seconds

### Security

- **Environment Variables**: All secrets stored in `.env` (gitignored)
- **Input Validation**: All MCP tools validate parameters
- **Git Safety**: Prevents committing sensitive files
- **API Key Protection**: Never logs or exposes API keys

## [0.9.0] - 2025-10-20 (Pre-MVP)

### Added
- Initial project structure
- Basic TypeScript configuration
- Vitest testing framework
- ESLint and Prettier setup

### In Development
- Core workflow engine
- Shadow cache implementation
- AI agent rules system

---

## Version History

- **1.0.0** (2025-10-26): MVP Release - Full MCP integration, vault initialization, git automation, comprehensive testing
- **0.9.0** (2025-10-20): Pre-MVP - Initial development phase

---

## Upgrade Notes

### Migrating to 1.0.0

If upgrading from development versions:

1. **Update Dependencies**:
   ```bash
   npm install
   ```

2. **Update Environment Variables**:
   ```bash
   cp .env.example .env
   # Add new variables:
   # GIT_AUTO_COMMIT=true
   # GIT_COMMIT_DEBOUNCE_MS=300000
   # FEATURE_AI_ENABLED=true
   # FEATURE_MCP_SERVER=true
   ```

3. **Rebuild Shadow Cache**:
   ```bash
   rm -rf .weaver/shadow-cache.db
   npm start  # Will rebuild automatically
   ```

4. **Update Custom Workflows**:
   - If using `workflowEngine.listWorkflows()`, change to `workflowEngine.getRegistry().getAllWorkflows()`

5. **Update MCP Tool Calls**:
   - Change all snake_case parameters to camelCase
   - Example: `workflow_id` → `workflowId`

### Breaking Changes

- **Workflow Engine API**: `listWorkflows()` method removed, use `getRegistry().getAllWorkflows()`
- **MCP Parameters**: All tool parameters now use camelCase (breaking change from snake_case)
- **YAML Import**: Switched from `yaml` package to `js-yaml` (may affect custom code)

---

## Future Releases

### Planned for 1.1.0
- Additional AI agent rules
- Enhanced workflow templates
- Web UI for vault management
- Performance optimizations
- Extended MCP tool suite

### Planned for 2.0.0
- Multi-vault support
- Advanced query language
- Plugin system for custom extensions
- Cloud sync integration
- Mobile companion app

---

**For detailed phase documentation, see [_planning/phases/](../_planning/phases/) directory.**
