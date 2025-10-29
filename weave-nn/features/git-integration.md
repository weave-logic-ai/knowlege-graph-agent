---
feature_id: F-008
feature_name: Git Version Control Integration
category: integration
status: planned
priority: critical
release: mvp
complexity: moderate
created_date: '2025-10-20'
updated_date: '2025-10-28'
scope:
  current_phase: mvp
  obsidian_only: true
  web_version_needed: false
dependencies:
  requires: []
  enables:
    - github-issues-integration
  related_features:
    - obsidian-tasks-integration
relationships:
  related_decisions:
    - IR-2
  related_features:
    - obsidian-tasks-integration
    - github-issues-integration
visual:
  icon: git-branch
  cssclasses:
    - type-feature
    - scope-mvp
    - priority-critical
    - tech-git
tags:
  - scope/mvp
  - type/feature
  - status/planned
  - priority/critical
  - tech/git
  - tech/python
  - category/integration
type: documentation
version: '3.0'
---

# Git Version Control Integration (Obsidian-First)

**Obsidian-First Approach**: Native Git integration using local Git CLI and Python GitPython library for versioning, change tracking, and collaboration on the Obsidian vault.

**Decision**: [[../archive/DECISIONS#IR-2-Git-Integration|IR-2: Git Integration]] - Auto-commit + GitHub issue sync

---

## 🎯 User Story

As a **technical user**, I want to **version control my Obsidian vault with Git** so that I can **track changes over time, collaborate with others, and have full backup/recovery capabilities using industry-standard tools**.

---

## 🚀 Key Capabilities

### Automatic Commits (Optional Setting)
- Monitor file changes in Obsidian vault
- Auto-commit on save with intelligent commit messages
- Batch related changes (e.g., "Updated 3 feature nodes")
- Configurable: On/off, commit frequency, ignore patterns

### Manual Commit Control
- Review changes via Python CLI or MCP tool
- Create commits with custom messages
- Stage specific files or all changes
- Pre-commit validation hooks

### Sync with Remotes
- Push/pull from GitHub, GitLab, or any Git remote
- Conflict detection and resolution helpers
- Automatic backup to remote branches
- Team collaboration via shared remotes

### Change History & Diff
- View file history (git log for specific files)
- Diff changes between versions
- Restore previous versions of nodes
- Blame/annotate to see who changed what

### Pre-Commit Validation
- Validate YAML frontmatter
- Check for broken wikilinks
- Ensure required properties exist
- Format check (trailing whitespace, etc.)

---

## 🏗️ Implementation (Obsidian-First)

### Technology Stack
**Local Git CLI + Python Wrapper**
- **GitPython**: Python library for Git operations
- **Native Git**: Uses system Git installation
- **MCP Tools**: Expose Git operations to Claude agents
- **File Watcher**: Watchdog library for file change detection

**No Browser Git Needed**: Obsidian desktop app runs on local filesystem

### Architecture

```
Obsidian Vault (Markdown Files)
    ↓
File Watcher (Python Watchdog)
    ↓
Git Wrapper (GitPython)
    ↓
Local Git Repository
    ↓
Remote (GitHub/GitLab)
```

### MCP Tools for Git

```python
# Git status
git_status() -> dict
# Returns: { "modified": [...], "untracked": [...], "staged": [...] }

# Commit changes
git_commit(message: str, files: list = None) -> str
# Auto-generates message if not provided

# View history
git_log(file_path: str = None, limit: int = 10) -> list

# Diff changes
git_diff(file_path: str = None, commit: str = None) -> str

# Sync with remote
git_push(remote: str = "origin", branch: str = "main") -> str
git_pull(remote: str = "origin", branch: str = "main") -> str

# Validation
git_validate_commit() -> dict
# Returns validation errors (broken links, invalid frontmatter, etc.)
```

---

## 📋 MVP Implementation Plan (Day 5 of Week 1)

### Auto-Commit Workflow
1. **File Watcher Setup**
   - Use Python Watchdog to monitor `.md` file changes
   - Ignore `.obsidian/` folder
   - Configurable ignore patterns

2. **Intelligent Commit Messages**
   - Parse file changes to generate descriptive messages
   - Examples:
     - "Updated feature node: Git Integration"
     - "Created 3 new decision nodes"
     - "Modified Obsidian-first architecture"

3. **Batching Logic**
   - Don't commit on every save (too noisy)
   - Batch changes within 5-minute window
   - OR commit when Obsidian loses focus

4. **Pre-Commit Validation**
   - Check YAML frontmatter syntax
   - Validate required properties
   - Check for broken wikilinks (optional warning)

### Manual Commit Support
- Python CLI: `weave-nn commit "message"`
- MCP tool: Claude can trigger commits via agent
- Review staged changes before commit

### Remote Sync
- Push to GitHub automatically (optional)
- OR manual push via CLI/MCP
- Pull before push (conflict detection)

---

## 🎯 Success Criteria (MVP)

### Must Have (Week 1, Day 5)
- ✅ Git repository initialized for vault
- ✅ Python GitPython wrapper functional
- ✅ Auto-commit working (optional setting)
- ✅ Manual commit via MCP tool
- ✅ Pre-commit validation hooks
- ✅ Git status accessible via MCP

### Nice to Have
- ⚡ Automatic push to remote
- ⚡ Conflict resolution helpers
- ⚡ Commit history viewer in Obsidian
- ⚡ Git graph visualization

### Deferred to v1.1
- 🔮 Advanced conflict resolution UI
- 🔮 Branch management
- 🔮 Merge request workflows
- 🔮 Git hooks for advanced automation

---

## 🔗 Related Features

### Enables
- [[github-issues-integration]] - Sync tasks with GitHub issues
- [[obsidian-tasks-integration]] - Git-tracked task files

### Integrates With
- [[basic-ai-integration-mcp]] - MCP tools for Git operations
- [[../architecture/obsidian-first-architecture]] - Git is storage layer

---

## 💡 Key Advantages (Obsidian-First)

### Simplicity
- ❌ No browser-based Git (isomorphic-git complexity)
- ✅ Native Git CLI (fast, reliable, familiar)
- ✅ Python GitPython (mature, well-documented)

### Performance
- Local operations = instant commits
- No API latency
- Efficient diff and history

### Developer-Friendly
- Standard Git workflow
- Compatible with all Git tools (GitKraken, GitHub Desktop, etc.)
- Team collaboration via shared remotes

### Backup & Recovery
- Full history in Git
- Remote backup to GitHub/GitLab
- Easy to restore previous versions

---

## 🚧 Key Challenges & Solutions

### Challenge 1: Auto-Commit Frequency
**Problem**: Too frequent = noisy history, too infrequent = lose granularity
**Solution**: Configurable batching (5-min window) + manual commit option

### Challenge 2: Commit Message Quality
**Problem**: Auto-generated messages may be generic
**Solution**: Parse file changes to create descriptive messages, allow manual override

### Challenge 3: Merge Conflicts
**Problem**: Multiple users editing same file
**Solution**: Git-based conflict resolution (show diffs, let user resolve), future: CRDT for real-time collab

### Challenge 4: Large Binary Files
**Problem**: Images, PDFs in vault can bloat repo
**Solution**: Git LFS for large files (v1.1 feature)

---

## 📊 Complexity Estimate

**Revised for Obsidian-First**: Moderate (1 week → 1 day)
- Python GitPython integration: 4 hours
- Auto-commit workflow: 2 hours
- Pre-commit validation: 1 hour
- Testing: 1 hour

**Reduced from Complex (1-2 months)** because:
- ❌ No browser Git implementation needed
- ❌ No conflict resolution UI needed (use Git tools)
- ✅ Simple Python wrapper around Git CLI

---

## 🔗 Related Documentation

### Architecture
- [[../architecture/obsidian-first-architecture]] - Git as storage layer
- [[../architecture/data-knowledge-layer]] - Markdown + Git storage

### Decisions
- [[../archive/DECISIONS#IR-2-Git-Integration|IR-2: Git Integration]] - Auto-commit decided

### Workflows
- [[../workflows/version-control-integration]] - Git workflow documentation

### Related Features
- [[github-issues-integration]] - GitHub API integration
- [[obsidian-tasks-integration]] - Task files in Git

---

**Status**: Planned for Week 1, Day 5
**Complexity**: Moderate (8 hours)
**Priority**: Critical (enables collaboration and backup)
**Next Steps**: Build Python GitPython wrapper and MCP tools
