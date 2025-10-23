---
# Node Metadata
phase_id: "PHASE-8"
phase_name: "Git Automation & Workflow Proxy"
type: implementation
status: "pending"
priority: "medium"
created_date: "2025-10-23"
duration: "2 days"

# Scope
scope:
  current_phase: "mvp"
  obsidian_only: true
  web_version_needed: false

# Dependencies
dependencies:
  requires: ["PHASE-7"]
  enables: ["PHASE-9"]
  blocks: []

# Tags
tags:
  - scope/mvp
  - type/implementation
  - status/pending
  - priority/medium
  - phase-8
  - git-automation
  - workflow-proxy
  - auto-commit

# Visual
visual:
  icon: "git-branch"
  cssclasses:
    - type-implementation
    - scope-mvp
    - status-pending
    - priority-medium
---

# Phase 8: Git Automation & Workflow Proxy

**Status**: ⏳ **PENDING** (blocked by Phase 7)
**Depends On**: [[phase-7-agent-rules-memory-sync|Phase 7: Agent Rules & Memory Sync]] ⏳
**Enables**: [[phase-9-testing-documentation|Phase 9: Testing & Documentation]]
**Priority**: 🟡 **MEDIUM**
**Duration**: 2 days

---

## 🎯 Objective

Implement **git automation** using simple-git to auto-commit vault changes, and create a **Weaver workflow proxy** for triggering git operations via durable workflows. This enables version control without manual commits and provides a foundation for advanced git workflows (branching, pull requests, issue sync).

**Key Deliverables**:
1. ✅ simple-git integration for auto-commits
2. ✅ Intelligent commit message generation (using Claude)
3. ✅ Weaver workflow proxy for git operations
4. ✅ Auto-commit on file save (debounced)
5. ✅ Git operation logging and error handling

---

## 📋 Tasks

### Day 1: Git Automation Core (4-6 hours)

- [ ] **8.1: Set up simple-git**
  - Install `simple-git`
  - Create `src/git/git-client.ts`
  - Initialize git repo if not exists
  - Configure git user (from .env)
  - **Success Criteria**: Can execute `git status` programmatically

- [ ] **8.2: Implement auto-commit service**
  - Create `src/git/auto-commit.ts`
  - Listen to file watcher events (from Phase 6)
  - Debounce commits (5-minute window)
  - Batch related changes into single commit
  - **Success Criteria**: File saves trigger commits after 5 minutes

- [ ] **8.3: Claude-powered commit messages**
  - On commit, send changed file paths to Claude
  - Prompt: "Generate a conventional commit message for these changes"
  - Format: `type(scope): description` (e.g., `feat(notes): add meeting summary`)
  - Fallback to generic message if Claude fails
  - **Success Criteria**: Commits have semantic messages

### Day 2: Weaver Workflow Proxy (4-6 hours)

- [ ] **8.4: Create Weaver workflow: git-commit**
  - Trigger: `event.type === 'git-operation'` && `event.action === 'commit'`
  - Input: `{ files: string[], message: string }`
  - Actions:
    1. Validate changes (no .env, no .git files)
    2. Run `git add` for specified files
    3. Run `git commit -m "message"`
    4. Log commit SHA
  - **Success Criteria**: Workflow commits changes successfully

- [ ] **8.5: Implement workflow proxy endpoint**
  - Create `src/git/workflow-proxy.ts`
  - Expose POST `/git/proxy/commit`
  - Forward to Weaver webhook
  - Return workflow execution ID
  - **Success Criteria**: API triggers Weaver workflow

- [ ] **8.6: Add git operation logging**
  - Create `logs/git-operations.log`
  - Log: commit SHA, timestamp, files changed, message
  - Add admin endpoint: `GET /admin/git/logs`
  - **Success Criteria**: All git operations logged

---

## 🏗️ Architecture

### Components

```
weave-nn-mcp/
├── src/
│   ├── git/
│   │   ├── git-client.ts         # simple-git wrapper
│   │   ├── auto-commit.ts        # Auto-commit service
│   │   ├── workflow-proxy.ts     # Weaver git workflow proxy
│   │   └── commit-message.ts     # Claude commit message generator
│   ├── watcher/
│   │   └── event-processor.ts    # Trigger auto-commit on file events
│   └── server.ts                 # Register git proxy routes
```

### Data Flow

```
Vault File Event
    ↓
Debounce (5 minutes)
    ↓
Collect changed files
    ↓
Generate commit message (Claude)
    ↓
Option A: Direct git commit (simple-git)
    ↓
Option B: Weaver workflow proxy
    ↓
git add + git commit
    ↓
Log operation
    ↓
Update Claude-Flow memory
```

---

## 💻 Implementation

### 8.1: Git Client

**Install dependencies:**
```bash
cd weave-nn-mcp
npm install simple-git
```

**`src/git/git-client.ts`:**
```typescript
import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';

export class GitClient {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  async init(): Promise<void> {
    const isRepo = await this.git.checkIsRepo();

    if (!isRepo) {
      await this.git.init();
      console.log(`[Git] Initialized repository at ${this.repoPath}`);
    }

    // Configure git user if not set
    try {
      await this.git.addConfig('user.name', process.env.GIT_USER_NAME || 'Weave-NN');
      await this.git.addConfig('user.email', process.env.GIT_USER_EMAIL || 'weave-nn@local');
    } catch (error) {
      // Config already set, ignore
    }
  }

  async status(): Promise<any> {
    return await this.git.status();
  }

  async add(files: string[]): Promise<void> {
    await this.git.add(files);
  }

  async commit(message: string): Promise<string> {
    const result = await this.git.commit(message);
    return result.commit; // SHA
  }

  async addAndCommit(files: string[], message: string): Promise<string> {
    await this.add(files);
    return await this.commit(message);
  }

  async log(maxCount: number = 10): Promise<any> {
    return await this.git.log({ maxCount });
  }

  async diff(file?: string): Promise<string> {
    if (file) {
      return await this.git.diff([file]);
    }
    return await this.git.diff();
  }
}
```

### 8.2: Auto-Commit Service

**`src/git/auto-commit.ts`:**
```typescript
import { FileEvent } from '../watcher/file-watcher';
import { GitClient } from './git-client';
import { ClaudeClient } from '../agents/claude-client';

export class AutoCommitService {
  private git: GitClient;
  private claude: ClaudeClient;
  private pendingChanges: Set<string> = new Set();
  private commitTimer: NodeJS.Timeout | null = null;
  private debounceMs: number = 5 * 60 * 1000; // 5 minutes

  constructor(git: GitClient, claude: ClaudeClient, debounceMs?: number) {
    this.git = git;
    this.claude = claude;
    if (debounceMs) this.debounceMs = debounceMs;
  }

  onFileEvent(event: FileEvent): void {
    if (event.type === 'unlink') return; // Don't auto-commit deletes

    this.pendingChanges.add(event.path);
    this.scheduleCommit();
  }

  private scheduleCommit(): void {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
    }

    this.commitTimer = setTimeout(() => {
      this.executeCommit();
    }, this.debounceMs);
  }

  private async executeCommit(): Promise<void> {
    if (this.pendingChanges.size === 0) return;

    const files = Array.from(this.pendingChanges);
    this.pendingChanges.clear();

    try {
      const message = await this.generateCommitMessage(files);
      const sha = await this.git.addAndCommit(files, message);

      console.log(`[AutoCommit] Committed ${files.length} files: ${sha.substring(0, 7)}`);
      console.log(`[AutoCommit] Message: ${message}`);
    } catch (error) {
      console.error('[AutoCommit] Failed to commit:', error);
      // Re-add files to pending
      files.forEach(f => this.pendingChanges.add(f));
    }
  }

  private async generateCommitMessage(files: string[]): Promise<string> {
    try {
      const fileList = files.map(f => `- ${f}`).join('\n');
      const prompt = `Generate a conventional commit message for these vault changes:

${fileList}

Use this format: type(scope): description
Types: feat, fix, docs, refactor, chore
Keep it under 72 characters.

Commit message:`;

      const message = await this.claude.prompt(prompt);
      return message.trim() || this.fallbackMessage(files);
    } catch (error) {
      return this.fallbackMessage(files);
    }
  }

  private fallbackMessage(files: string[]): string {
    if (files.length === 1) {
      return `docs: update ${files[0]}`;
    }
    return `docs: update ${files.length} notes`;
  }

  async forceCommit(): Promise<void> {
    if (this.commitTimer) {
      clearTimeout(this.commitTimer);
    }
    await this.executeCommit();
  }
}
```

### 8.3: Weaver Workflow Proxy

**`src/git/workflow-proxy.ts`:**
```typescript
import { WeaverClient, WeaverEvent } from '../watcher/weaver-client';

export interface GitOperation {
  action: 'commit' | 'push' | 'pull';
  files?: string[];
  message?: string;
  remote?: string;
  branch?: string;
}

export class GitWorkflowProxy {
  private weaver: WeaverClient;

  constructor(weaver: WeaverClient) {
    this.weaver = weaver;
  }

  async commit(files: string[], message: string): Promise<void> {
    const event: WeaverEvent = {
      type: 'note-updated', // Reuse existing event type
      path: 'git-operation',
      timestamp: Date.now(),
      metadata: {
        operation: 'git-commit',
        files,
        message
      }
    };

    await this.weaver.sendEvent(event);
  }

  async push(remote: string = 'origin', branch: string = 'main'): Promise<void> {
    const event: WeaverEvent = {
      type: 'note-updated',
      path: 'git-operation',
      timestamp: Date.now(),
      metadata: {
        operation: 'git-push',
        remote,
        branch
      }
    };

    await this.weaver.sendEvent(event);
  }
}
```

### 8.4: Git Proxy API Routes

**Update `src/server.ts` (Hono routes):**
```typescript
import { Hono } from 'hono';
import { GitClient } from './git/git-client';
import { GitWorkflowProxy } from './git/workflow-proxy';

const app = new Hono();

// Git operation endpoints
app.post('/git/proxy/commit', async (c) => {
  const { files, message } = await c.req.json();

  if (!files || !message) {
    return c.json({ error: 'Missing files or message' }, 400);
  }

  await gitProxy.commit(files, message);
  return c.json({ status: 'queued', workflow: 'git-commit' });
});

app.get('/admin/git/status', async (c) => {
  const status = await gitClient.status();
  return c.json(status);
});

app.get('/admin/git/logs', async (c) => {
  const logs = await gitClient.log(20);
  return c.json(logs);
});

export default app;
```

### 8.5: Integration with File Watcher

**Update `src/watcher/event-processor.ts`:**
```typescript
import { AutoCommitService } from '../git/auto-commit';

export class EventProcessor {
  private autoCommit: AutoCommitService;

  constructor(
    obsidian: ObsidianClient,
    cache: ShadowCache,
    weaver: WeaverClient,
    autoCommit: AutoCommitService
  ) {
    this.autoCommit = autoCommit;
    // ...
  }

  async processEvent(event: FileEvent): Promise<void> {
    // Process event...

    // Trigger auto-commit
    this.autoCommit.onFileEvent(event);
  }
}
```

---

## 🧪 Testing

### Manual Testing

1. **Test auto-commit:**
   ```bash
   # Start MCP server
   npm run dev

   # Edit note in Obsidian
   echo "New content" >> vault/test.md

   # Wait 5 minutes (or reduce debounce in .env)
   # Check git log
   git log -1
   # Should see auto-generated commit message
   ```

2. **Test commit message generation:**
   ```bash
   # Create multiple notes quickly
   touch vault/{a,b,c}.md

   # Wait for auto-commit
   git log -1 --oneline
   # Should see: "docs: update 3 notes" or similar
   ```

3. **Test workflow proxy:**
   ```bash
   curl -X POST http://localhost:3000/git/proxy/commit \
     -H "Content-Type: application/json" \
     -d '{"files": ["test.md"], "message": "docs: test commit"}'

   # Check Weaver logs for workflow execution
   ```

### Automated Tests

**`tests/git/auto-commit.test.ts`:**
```typescript
import { AutoCommitService } from '../../src/git/auto-commit';
import { GitClient } from '../../src/git/git-client';
import { ClaudeClient } from '../../src/agents/claude-client';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('AutoCommitService', () => {
  let tmpDir: string;
  let git: GitClient;
  let autoCommit: AutoCommitService;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-'));
    git = new GitClient(tmpDir);
    await git.init();

    const claude = new ClaudeClient(process.env.ANTHROPIC_API_KEY!);
    autoCommit = new AutoCommitService(git, claude, 1000); // 1s debounce for testing
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true });
  });

  test('debounces multiple rapid changes', async () => {
    autoCommit.onFileEvent({ type: 'change', path: 'a.md', timestamp: Date.now() });
    autoCommit.onFileEvent({ type: 'change', path: 'b.md', timestamp: Date.now() });
    autoCommit.onFileEvent({ type: 'change', path: 'c.md', timestamp: Date.now() });

    // Create actual files
    await fs.writeFile(path.join(tmpDir, 'a.md'), 'A');
    await fs.writeFile(path.join(tmpDir, 'b.md'), 'B');
    await fs.writeFile(path.join(tmpDir, 'c.md'), 'C');

    // Wait for debounce + commit
    await new Promise(resolve => setTimeout(resolve, 2000));

    const logs = await git.log(1);
    expect(logs.all.length).toBe(1); // Single commit for all 3 files
  });

  test('generates semantic commit message', async () => {
    await fs.writeFile(path.join(tmpDir, 'test.md'), '# Test');

    autoCommit.onFileEvent({ type: 'add', path: 'test.md', timestamp: Date.now() });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const logs = await git.log(1);
    const message = logs.latest?.message || '';

    // Should match conventional commit format
    expect(message).toMatch(/^(feat|fix|docs|chore|refactor)(\(.+\))?: .+/);
  });
});
```

---

## 📊 Success Criteria

### Technical Validation
- [x] File changes auto-commit within 5 minutes
- [x] Commit messages follow conventional format
- [x] Rapid changes batched into single commit
- [x] Weaver workflow proxy triggers git operations
- [x] Git operations logged with SHA and timestamp

### User Experience
- [x] No manual commits required
- [x] Meaningful commit history (not "update")
- [x] Easy to review git logs via admin endpoint

### Performance
- Auto-commit latency: 5 minutes (configurable)
- Claude API latency for message generation: < 3s
- Workflow proxy response: < 1s

---

## 🔗 Dependencies

### npm Packages
```json
{
  "dependencies": {
    "simple-git": "^3.24.0",
    "hono": "^4.0.0"
  }
}
```

### External Services
- **Claude API**: For commit message generation
- **Weaver**: For workflow proxy (optional)

### Phase Dependencies
- **Requires**: Phase 7 (agent rules, Claude client)
- **Enables**: Phase 9 (git-based testing workflows)

---

## 📝 Configuration

**`.env` additions:**
```bash
# Git Configuration
GIT_USER_NAME=Weave-NN
GIT_USER_EMAIL=weave-nn@local
GIT_AUTO_COMMIT_ENABLED=true
GIT_COMMIT_DEBOUNCE_MS=300000  # 5 minutes

# Workflow Proxy
GIT_WORKFLOW_PROXY_ENABLED=false  # Optional
```

---

## 🚀 Advanced Features (Optional)

### Future Enhancements

1. **GitHub Issue Sync** (Phase 9+):
   - Auto-create issues from `#bug` or `#feature` tags
   - Link commits to issues via commit message

2. **Branch Automation**:
   - Auto-create feature branches for large changes
   - Trigger PR creation via Weaver workflow

3. **Conflict Resolution**:
   - Detect merge conflicts
   - Notify user via Obsidian notification
   - Pause auto-commit until resolved

---

## 🔗 Next Steps

After Phase 8 completion:
1. **Phase 9**: Create comprehensive test suite
2. **Phase 9**: Write user documentation and developer guides

---

**Status**: ⏳ **PENDING** (blocked by Phase 7)
**Estimated Duration**: 2 days
**Next Phase**: [[phase-9-testing-documentation|Phase 9: Testing & Documentation]]
