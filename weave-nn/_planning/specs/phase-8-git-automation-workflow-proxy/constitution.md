---
title: Constitution - Git Automation & Workflow Proxy
type: planning
status: pending
phase_id: PHASE-8
tags:
  - spec-kit
  - constitution
  - phase-8
  - principles
  - phase/phase-8
  - type/documentation
  - status/draft
priority: medium
visual:
  icon: "\U0001F4CB"
  color: '#3B82F6'
  cssclasses:
    - type-planning
    - status-pending
    - priority-medium
    - phase-8
updated: '2025-10-29T04:55:04.572Z'
version: '3.0'
keywords:
  - "\U0001F3AF core purpose"
  - related
  - "\U0001F3DB️ guiding principles"
  - 1. **automation first**
  - 2. **semantic commit messages**
  - 3. **intelligent batching**
  - 4. **non-blocking workflows**
  - 5. **safety & rollback**
  - 6. **workflow composability**
  - 7. **zero configuration**
---

# Constitution - Git Automation & Workflow Proxy

**Phase ID**: PHASE-8
**Status**: pending
**Priority**: medium
**Generated**: 2025-10-26

---

## 🎯 Core Purpose

Establish automated version control for the Obsidian vault through intelligent git automation and workflow orchestration. This system ensures every vault change is tracked, versioned, and documented with minimal user intervention.

**Primary Goal**: Zero-touch git version control with AI-generated semantic commit messages.

---





## Related

[[phase-8-git-tasks]] • [[specification]]
## Related

[[constitution]]
## 🏛️ Guiding Principles

### 1. **Automation First**

**Principle**: Users should never manually commit vault changes.

**Constraints**:
- Auto-commit MUST be enabled by default
- Debounce window prevents commit spam (5-minute default)
- Failed auto-commits MUST be logged and retried
- Users can force immediate commit via API

**Rationale**: Manual git operations break the flow of note-taking. Automation ensures consistent version history without cognitive overhead.

---

### 2. **Semantic Commit Messages**

**Principle**: Every commit message must be meaningful and follow conventional commit format.

**Constraints**:
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `refactor`, `chore`
- Description under 72 characters
- Fallback to generic message if Claude fails
- Never use "update" or "WIP" as commit message

**Rationale**: Semantic commits enable:
- Automated changelog generation
- Semantic versioning (future)
- Git history searchability
- Understanding of vault evolution

---

### 3. **Intelligent Batching**

**Principle**: Related changes should be committed together.

**Constraints**:
- Debounce rapid changes (5-minute window)
- Batch changes by directory (e.g., all meeting notes)
- Single commit per batch, regardless of file count
- Edge case: Deletes committed separately

**Rationale**: Atomic commits are better than file-level commits. A "meeting notes" session should be one commit, not 10.

---

### 4. **Non-Blocking Workflows**

**Principle**: Git operations must never block file saves or user workflows.

**Constraints**:
- Auto-commit runs asynchronously
- File watcher continues during commit operations
- Commit failures logged but don't break MCP server
- Workflow proxy returns immediately (queues operation)

**Rationale**: Git is infrastructure, not UX. Users should never wait for git.

---

### 5. **Safety & Rollback**

**Principle**: Never commit sensitive data or corrupt the repository.

**Constraints**:
- MUST ignore `.env`, `.git`, `credentials.*` files
- MUST validate git status before commit
- MUST handle merge conflicts gracefully
- Provide rollback mechanism for last N commits

**Rationale**: Version control should protect data, not leak it. Safety checks prevent disasters.

---

### 6. **Workflow Composability**

**Principle**: Git operations should integrate with Weaver's durable workflow system.

**Constraints**:
- Workflows MUST be idempotent (safe to retry)
- Workflows MUST track execution state
- Failed workflows MUST be resumable
- Workflows MUST log all operations

**Rationale**: Weaver workflows provide:
- Durability across restarts
- Audit trail for compliance
- Advanced orchestration (branching, PRs, issue sync)

---

### 7. **Zero Configuration**

**Principle**: Git automation should work out-of-the-box with sane defaults.

**Constraints**:
- Initialize git repo if not exists
- Configure git user from `.env` or defaults
- Auto-create `.gitignore` if missing
- Provide sensible defaults for all settings

**Rationale**: Minimize setup friction. Users shouldn't need to understand git internals.

---

### 8. **Observability**

**Principle**: All git operations must be transparent and auditable.

**Constraints**:
- Log every commit (SHA, timestamp, files, message)
- Expose admin endpoint: `GET /admin/git/logs`
- Store git operation metrics (commit count, file count)
- Provide `git status` endpoint for diagnostics

**Rationale**: Transparency builds trust. Debugging requires visibility.

---

## 🚫 Anti-Patterns

### 1. **Synchronous Commits**

**❌ Don't**: Block file saves until git commit completes.

**✅ Do**: Queue commits asynchronously with debouncing.

---

### 2. **Commit Spam**

**❌ Don't**: Commit every file change immediately.

**✅ Do**: Batch changes within a 5-minute window.

---

### 3. **Generic Commit Messages**

**❌ Don't**: Use "update" or "save work" as commit message.

**✅ Do**: Generate semantic messages with Claude API.

---

### 4. **Hardcoded Configuration**

**❌ Don't**: Hardcode git user name/email in code.

**✅ Do**: Load from `.env` with sensible defaults.

---

### 5. **Blocking Workflow Proxy**

**❌ Don't**: Wait for workflow execution to complete.

**✅ Do**: Return workflow ID immediately, execute async.

---

## 📐 Design Constraints

### Technical Requirements

1. **simple-git**: Use `simple-git` library (v3.24.0+) for all git operations
2. **Claude API**: Use existing `ClaudeClient` from Phase 7 for message generation
3. **Weaver Integration**: Use existing `WeaverClient` for workflow proxy
4. **TypeScript**: All code MUST be TypeScript with strict types
5. **Error Handling**: MUST handle all error cases (network, disk, git)

### Performance Requirements

1. **Auto-commit latency**: Max 5 minutes (configurable)
2. **Commit message generation**: Max 3 seconds (Claude API)
3. **Workflow proxy response**: Max 1 second (queue + return)
4. **Git status check**: Max 500ms

### Security Requirements

1. **Never commit sensitive files**: `.env`, `credentials.*`, `.git/`
2. **Validate file paths**: Prevent directory traversal attacks
3. **Sanitize commit messages**: Remove credentials from messages
4. **Use environment variables**: Never hardcode secrets

---

## 🔗 Integration Points

### Phase Dependencies

1. **Phase 6 (Vault Initialization)**: Provides vault directory structure
2. **Phase 7 (Agent Rules & MCP Tool)**: Provides `ClaudeClient` for message generation
3. **Weaver**: Provides workflow engine for durable git operations

### External Dependencies

1. **simple-git**: Git automation library
2. **Claude API**: Commit message generation
3. **Weaver Workflows**: Durable git operation orchestration

---

## 📊 Success Criteria

### Functional

- [ ] Auto-commit enabled by default
- [ ] Commits batched within 5-minute window
- [ ] Commit messages follow conventional format
- [ ] Workflow proxy triggers Weaver workflows
- [ ] All git operations logged

### Non-Functional

- [ ] No user intervention required
- [ ] Git operations never block file saves
- [ ] Commit messages always meaningful
- [ ] System handles failures gracefully
- [ ] Observability via admin endpoints

### Quality

- [ ] Code coverage 85%+
- [ ] All tests pass (unit + integration)
- [ ] TypeScript strict mode enabled
- [ ] Zero linting errors
- [ ] Documentation complete

---

## 🎓 Key Learnings (Applied)

1. **Debouncing is critical**: Without it, rapid edits create hundreds of commits
2. **Fallback matters**: Claude API failures should degrade gracefully
3. **Async is non-negotiable**: Git operations block event loop if synchronous
4. **Safety checks save lives**: Validate before commit to prevent disasters
5. **Observability enables debugging**: Logging git operations is essential

---

## 📝 Future Considerations

### Phase 9+ Enhancements

1. **GitHub Issue Sync**: Auto-create issues from `#bug` or `#feature` tags
2. **Branch Automation**: Auto-create feature branches for large changes
3. **Pull Request Creation**: Trigger PR via workflow when branch created
4. **Conflict Resolution**: Detect merge conflicts, notify user via Obsidian
5. **Semantic Versioning**: Tag releases based on commit history

---

**Status**: ⏳ **PENDING** (blocked by Phase 7)
**Next Phase**: [[phase-9-testing-documentation|Phase 9: Testing & Documentation]]
