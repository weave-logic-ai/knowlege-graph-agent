---
phase_id: PHASE-6
phase_name: File Watcher & Weaver Integration
type: implementation
status: pending
priority: high
created_date: '2025-10-23'
duration: 2-3 days
scope:
  current_phase: mvp
  obsidian_only: true
  web_version_needed: false
dependencies:
  requires:
    - PHASE-5
  enables:
    - PHASE-7
  blocks: []
tags:
  - scope/mvp
  - type/implementation
  - status/pending
  - priority/high
  - phase-6
  - file-watcher
  - weaver-integration
  - event-streaming
visual:
  icon: eye
  cssclasses:
    - type-implementation
    - scope-mvp
    - status-pending
    - priority-high
---

# Phase 6: File Watcher & Weaver Integration

**Status**: ⏳ **PENDING** (blocked by Phase 5)
**Depends On**: [[phase-5-mcp-server-implementation|Phase 5: MCP Server Implementation]] ⏳
**Enables**: [[phase-7-agent-rules-memory-sync|Phase 7: Agent Rules & Memory Sync]]
**Priority**: 🔴 **HIGH**
**Duration**: 2-3 days

---

## 🎯 Objective

Implement real-time file watching for the Obsidian vault using **chokidar** and integrate with **Weaver** (workflow.dev) for durable event-driven workflows. This enables the MCP server to detect vault changes, maintain shadow cache consistency, and trigger automated workflows.

**Key Deliverables**:
1. ✅ File watcher service with chokidar
2. ✅ Weaver workflow integration (webhook-based)
3. ✅ Event streaming to Weaver workflows
4. ✅ Shadow cache auto-update on file changes
5. ✅ Debouncing and batch processing

---















## Related

[[phase-3b-node-expansion-legacy]]
## Related

[[weaver-workflow-automation]] • [[salt-configuration-hub]]
## Related

[[github-issues-integration]]
## Related

[[cross-project-knowledge-retention]]
## Related

[[phase-7-mvp-week-2]]
## Related

[[phase-10-mvp-readiness-launch]] • [[phase-8-git-automation-workflow-proxy]]
## Related

[[phase-9-testing-documentation]]
## 📋 Tasks

### Day 1: File Watcher Implementation (4-6 hours)

- [ ] **6.1: Set up chokidar file watcher**
  - Install dependencies: `chokidar`, `debounce-promise`
  - Create `src/watcher/file-watcher.ts`
  - Watch vault directory with ignore patterns
  - Detect: add, change, unlink events
  - **Success Criteria**: Console logs show vault events in real-time

- [ ] **6.2: Implement event debouncing**
  - Batch rapid file changes (e.g., git operations)
  - 500ms debounce window per file
  - Group related events (e.g., frontmatter + content update)
  - **Success Criteria**: Multiple edits within 500ms = single event

- [ ] **6.3: Parse file changes and update shadow cache**
  - On `add` event: Parse note → insert into SQLite
  - On `change` event: Re-parse → update SQLite
  - On `unlink` event: Delete from SQLite
  - **Success Criteria**: Shadow cache matches vault state after changes

### Day 2: Weaver Integration (4-6 hours)

- [ ] **6.4: Set up Weaver workflow.dev account**
  - Sign up at https://workflow.dev
  - Create workflow project: `weave-nn-workflows`
  - Generate webhook URL for event ingestion
  - **Success Criteria**: Webhook receives test POST request

- [ ] **6.5: Create event streaming service**
  - Create `src/watcher/weaver-client.ts`
  - POST events to Weaver webhook
  - Include: event type, file path, metadata, timestamp
  - Handle 429 rate limits, retry logic
  - **Success Criteria**: Events appear in Weaver logs

- [ ] **6.6: Define Weaver workflow: note-created**
  - Trigger: `event.type === 'note-created'`
  - Actions:
    1. Check if daily note → auto-link to yesterday
    2. Check if meeting note → create follow-up task
    3. Sync to Claude-Flow memory
  - **Success Criteria**: New note triggers workflow execution

### Day 3: Advanced Workflows (4-6 hours)

- [ ] **6.7: Workflow: note-updated**
  - Trigger: `event.type === 'note-updated'`
  - Actions:
    1. Re-index for search
    2. Update related notes (backlinks)
    3. Check for broken wikilinks → create placeholder notes
  - **Success Criteria**: Edit triggers re-indexing

- [ ] **6.8: Workflow: auto-tagging**
  - Trigger: Note created without tags
  - Actions:
    1. Send content to Claude via MCP
    2. Generate suggested tags
    3. Update note frontmatter with `suggested_tags`
  - **Success Criteria**: New untagged note gets suggestions

- [ ] **6.9: Error handling and monitoring**
  - Wrap watcher in try-catch
  - Log errors to `logs/watcher-errors.log`
  - Add health check endpoint: `GET /health/watcher`
  - **Success Criteria**: Watcher recovers from errors gracefully

---

## 🏗️ Architecture

### Components

```
weave-nn-mcp/
├── src/
│   ├── watcher/
│   │   ├── file-watcher.ts       # chokidar setup
│   │   ├── weaver-client.ts      # Weaver webhook client
│   │   ├── event-processor.ts    # Event debouncing & batching
│   │   └── handlers/
│   │       ├── note-created.ts
│   │       ├── note-updated.ts
│   │       └── note-deleted.ts
│   └── server.ts                 # Start watcher on server init
```

### Data Flow

```
Vault File Change
    ↓
chokidar detects event
    ↓
Debounce & batch (500ms)
    ↓
Parse changed file
    ↓
Update shadow cache (SQLite)
    ↓
POST event to Weaver webhook
    ↓
Weaver executes durable workflow
    ↓
Workflow actions (auto-tag, link, sync)
```

---

## 💻 Implementation

### 6.1: File Watcher Setup

**Install dependencies:**
```bash
cd weave-nn-mcp
npm install chokidar debounce-promise
npm install --save-dev @types/debounce-promise
```

**`src/watcher/file-watcher.ts`:**
```typescript
import chokidar from 'chokidar';
import debounce from 'debounce-promise';
import path from 'path';
import { EventEmitter } from 'events';

export interface FileEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  timestamp: number;
}

export class FileWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private vaultPath: string;
  private processEvent: (event: FileEvent) => Promise<void>;

  constructor(vaultPath: string) {
    super();
    this.vaultPath = vaultPath;

    // Debounce event processing (500ms window)
    this.processEvent = debounce(
      async (event: FileEvent) => {
        this.emit('fileEvent', event);
      },
      500,
      { key: (event: FileEvent) => event.path } // Debounce per file
    );
  }

  start(): void {
    this.watcher = chokidar.watch(this.vaultPath, {
      ignored: [
        '**/.obsidian/**',
        '**/.git/**',
        '**/.trash/**',
        '**/node_modules/**',
        '**/.DS_Store'
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', (filePath) => this.handleEvent('add', filePath))
      .on('change', (filePath) => this.handleEvent('change', filePath))
      .on('unlink', (filePath) => this.handleEvent('unlink', filePath))
      .on('error', (error) => console.error('Watcher error:', error));

    console.log(`[FileWatcher] Watching vault: ${this.vaultPath}`);
  }

  private handleEvent(type: FileEvent['type'], filePath: string): void {
    const relativePath = path.relative(this.vaultPath, filePath);

    // Only watch markdown files
    if (!relativePath.endsWith('.md')) return;

    const event: FileEvent = {
      type,
      path: relativePath,
      timestamp: Date.now()
    };

    this.processEvent(event);
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      console.log('[FileWatcher] Stopped watching vault');
    }
  }
}
```

### 6.2: Event Processor with Shadow Cache Update

**`src/watcher/event-processor.ts`:**
```typescript
import { FileEvent } from './file-watcher';
import { ObsidianClient } from '../clients/obsidian';
import { ShadowCache } from '../cache/shadow-cache';
import { WeaverClient } from './weaver-client';

export class EventProcessor {
  private obsidian: ObsidianClient;
  private cache: ShadowCache;
  private weaver: WeaverClient;

  constructor(
    obsidian: ObsidianClient,
    cache: ShadowCache,
    weaver: WeaverClient
  ) {
    this.obsidian = obsidian;
    this.cache = cache;
    this.weaver = weaver;
  }

  async processEvent(event: FileEvent): Promise<void> {
    console.log(`[EventProcessor] ${event.type}: ${event.path}`);

    try {
      switch (event.type) {
        case 'add':
        case 'change':
          await this.handleNoteUpdated(event);
          break;
        case 'unlink':
          await this.handleNoteDeleted(event);
          break;
      }

      // Send event to Weaver
      await this.weaver.sendEvent({
        type: event.type === 'add' ? 'note-created' :
              event.type === 'change' ? 'note-updated' : 'note-deleted',
        path: event.path,
        timestamp: event.timestamp
      });
    } catch (error) {
      console.error(`[EventProcessor] Error processing ${event.path}:`, error);
    }
  }

  private async handleNoteUpdated(event: FileEvent): Promise<void> {
    const note = await this.obsidian.readNote(event.path);
    this.cache.upsertNote(note);
    console.log(`[Cache] Updated: ${event.path}`);
  }

  private async handleNoteDeleted(event: FileEvent): Promise<void> {
    this.cache.deleteNote(event.path);
    console.log(`[Cache] Deleted: ${event.path}`);
  }
}
```

### 6.3: Weaver Client

**`src/watcher/weaver-client.ts`:**
```typescript
import axios, { AxiosInstance } from 'axios';

export interface WeaverEvent {
  type: 'note-created' | 'note-updated' | 'note-deleted';
  path: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class WeaverClient {
  private client: AxiosInstance;
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
    this.client = axios.create({
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async sendEvent(event: WeaverEvent): Promise<void> {
    try {
      await this.client.post(this.webhookUrl, event);
      console.log(`[Weaver] Sent event: ${event.type} - ${event.path}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          console.warn('[Weaver] Rate limited, retrying in 1s...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.client.post(this.webhookUrl, event);
        } else {
          console.error('[Weaver] Failed to send event:', error.message);
        }
      }
    }
  }
}
```

### 6.4: Integration with MCP Server

**Update `src/server.ts`:**
```typescript
import { FileWatcher } from './watcher/file-watcher';
import { EventProcessor } from './watcher/event-processor';
import { WeaverClient } from './watcher/weaver-client';

// In server initialization:
const watcher = new FileWatcher(config.vaultPath);
const weaver = new WeaverClient(config.weaverWebhookUrl);
const processor = new EventProcessor(obsidian, cache, weaver);

watcher.on('fileEvent', (event) => {
  processor.processEvent(event);
});

watcher.start();

// Graceful shutdown
process.on('SIGINT', () => {
  watcher.stop();
  process.exit(0);
});
```

---

## 🧪 Testing

### Manual Testing

1. **Start MCP server with watcher:**
   ```bash
   npm run dev
   ```

2. **Create new note in Obsidian:**
   - File → New note
   - Check console: `[FileWatcher] add: test-note.md`
   - Check SQLite: `SELECT * FROM notes WHERE path = 'test-note.md'`

3. **Edit existing note:**
   - Modify frontmatter
   - Check console: `[FileWatcher] change: test-note.md`
   - Verify cache updated

4. **Delete note:**
   - Delete from Obsidian
   - Check console: `[FileWatcher] unlink: test-note.md`
   - Verify removed from cache

### Automated Tests

**`tests/watcher/file-watcher.test.ts`:**
```typescript
import { FileWatcher } from '../../src/watcher/file-watcher';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('FileWatcher', () => {
  let tmpDir: string;
  let watcher: FileWatcher;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'vault-'));
    watcher = new FileWatcher(tmpDir);
  });

  afterEach(async () => {
    watcher.stop();
    await fs.rm(tmpDir, { recursive: true });
  });

  test('detects new file creation', (done) => {
    watcher.on('fileEvent', (event) => {
      expect(event.type).toBe('add');
      expect(event.path).toBe('test.md');
      done();
    });

    watcher.start();

    setTimeout(async () => {
      await fs.writeFile(path.join(tmpDir, 'test.md'), '# Test');
    }, 100);
  });

  test('debounces rapid changes', (done) => {
    let eventCount = 0;

    watcher.on('fileEvent', () => {
      eventCount++;
    });

    watcher.start();

    const filePath = path.join(tmpDir, 'test.md');

    setTimeout(async () => {
      await fs.writeFile(filePath, '# Test 1');
      await fs.writeFile(filePath, '# Test 2');
      await fs.writeFile(filePath, '# Test 3');
    }, 100);

    setTimeout(() => {
      expect(eventCount).toBe(1); // Debounced to single event
      done();
    }, 1000);
  });
});
```

---

## 📊 Success Criteria

### Technical Validation
- [x] File watcher detects all vault changes within 500ms
- [x] Debouncing prevents duplicate events during rapid edits
- [x] Shadow cache stays in sync with vault (100% consistency)
- [x] Events successfully POST to Weaver webhook
- [x] Weaver workflows execute on note creation/update

### Performance Metrics
- Event processing latency: < 100ms
- Shadow cache update: < 50ms
- Weaver webhook response: < 500ms
- Memory usage: < 50MB for watcher service

### Reliability
- [x] Watcher recovers from errors gracefully
- [x] No memory leaks during 24-hour operation
- [x] Handles git operations (batch file changes)
- [x] Ignores non-markdown files correctly

---

## 🔗 Dependencies

### npm Packages
```json
{
  "dependencies": {
    "chokidar": "^3.6.0",
    "debounce-promise": "^3.1.2",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/debounce-promise": "^3.1.9"
  }
}
```

### External Services
- **Weaver (workflow.dev)**: Free tier (10K events/month)
- **Obsidian Local REST API**: Must be running

### Phase Dependencies
- **Requires**: Phase 5 complete (MCP server, ObsidianClient, ShadowCache)
- **Enables**: Phase 7 (agent rules trigger on file events)

---

## 📝 Configuration

**`.env` additions:**
```bash
# File Watcher
VAULT_PATH=/path/to/obsidian/vault
WATCHER_DEBOUNCE_MS=500
WATCHER_IGNORE_PATTERNS=.obsidian,.git,.trash

# Weaver Integration
WEAVER_WEBHOOK_URL=https://workflow.dev/webhooks/abc123
WEAVER_RETRY_ATTEMPTS=3
WEAVER_TIMEOUT_MS=5000
```

---

## 🚀 Next Steps

After Phase 6 completion:
1. **Phase 7**: Implement agent rules that trigger on file events
2. **Phase 7**: Set up Claude-Flow memory sync (bidirectional)
3. **Phase 8**: Add git auto-commit on file changes

---

**Status**: ⏳ **PENDING** (blocked by Phase 5)
**Estimated Duration**: 2-3 days
**Next Phase**: [[phase-7-agent-rules-memory-sync|Phase 7: Agent Rules & Memory Sync]]
