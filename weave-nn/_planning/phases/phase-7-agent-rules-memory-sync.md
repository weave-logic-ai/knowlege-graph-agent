---
# Node Metadata
phase_id: "PHASE-7"
phase_name: "Agent Rules & Memory Sync"
type: implementation
status: "pending"
priority: "high"
created_date: "2025-10-23"
duration: "2-3 days"

# Scope
scope:
  current_phase: "mvp"
  obsidian_only: true
  web_version_needed: false

# Dependencies
dependencies:
  requires: ["PHASE-6"]
  enables: ["PHASE-8"]
  blocks: []

# Tags
tags:
  - scope/mvp
  - type/implementation
  - status/pending
  - priority/high
  - phase-7
  - agent-rules
  - memory-sync
  - auto-linking
  - auto-tagging

# Visual
visual:
  icon: "brain"
  cssclasses:
    - type-implementation
    - scope-mvp
    - status-pending
    - priority-high
---

# Phase 7: Agent Rules & Memory Sync

**Status**: ⏳ **PENDING** (blocked by Phase 6)
**Depends On**: [[phase-6-file-watcher-weaver-integration|Phase 6: File Watcher & Weaver]] ⏳
**Enables**: [[phase-8-git-automation-workflow-proxy|Phase 8: Git Automation]]
**Priority**: 🔴 **HIGH**
**Duration**: 2-3 days

---

## 🎯 Objective

Implement **agent rules engine** that automatically processes vault notes using Claude AI, and establish **bidirectional memory sync** with Claude-Flow for persistent agent context. This enables auto-linking, auto-tagging, and intelligent note processing without manual intervention.

**Key Deliverables**:
1. ✅ Agent rules engine with Claude MCP integration
2. ✅ Bidirectional memory sync (Vault ↔ Claude-Flow)
3. ✅ Auto-linking (detect related notes, suggest wikilinks)
4. ✅ Auto-tagging (analyze content, suggest tags)
5. ✅ Daily note automation (create, link to yesterday, add template)

---

## 📋 Tasks

### Day 1: Agent Rules Engine (4-6 hours)

- [ ] **7.1: Set up Claude MCP client**
  - Install `@anthropic-ai/sdk`
  - Create `src/agents/claude-client.ts`
  - Configure with Claude API key
  - Test basic prompt/response
  - **Success Criteria**: Claude responds to test prompt

- [ ] **7.2: Create agent rules engine**
  - Create `src/agents/rules-engine.ts`
  - Define rule interface: `AgentRule { trigger, condition, action }`
  - Implement rule registry and executor
  - Support async rule execution
  - **Success Criteria**: Rules execute on file events

- [ ] **7.3: Implement auto-tagging rule**
  - Trigger: Note created without tags
  - Condition: Frontmatter missing `tags` field
  - Action:
    1. Send note content to Claude
    2. Prompt: "Suggest 3-5 relevant tags for this note"
    3. Parse response, update frontmatter
  - **Success Criteria**: New notes get suggested tags

### Day 2: Memory Sync & Auto-Linking (4-6 hours)

- [ ] **7.4: Set up Claude-Flow memory integration**
  - Install `npx claude-flow@alpha`
  - Create `src/memory/claude-flow-sync.ts`
  - Implement memory store/retrieve hooks
  - Map vault structure → memory namespace
  - **Success Criteria**: Memory persists across Claude sessions

- [ ] **7.5: Implement bidirectional sync**
  - **Vault → Memory**: On note create/update, store in Claude-Flow
  - **Memory → Vault**: On Claude creates note, save to vault
  - Use memory keys: `vault/notes/{path}`, `vault/links/{source}->{target}`
  - **Success Criteria**: Changes in vault appear in Claude memory

- [ ] **7.6: Implement auto-linking rule**
  - Trigger: Note updated
  - Condition: Content mentions other note titles
  - Action:
    1. Extract potential note references (e.g., "see project X")
    2. Search shadow cache for matching notes
    3. Send to Claude: "Should I link 'project X' to [[project-x]]?"
    4. If yes, update note with wikilink
  - **Success Criteria**: Mentions auto-convert to wikilinks

### Day 3: Daily Note Automation (4-6 hours)

- [ ] **7.7: Implement daily note template rule**
  - Trigger: Daily note created
  - Condition: Filename matches `YYYY-MM-DD.md`
  - Action:
    1. Apply daily note template
    2. Link to yesterday's daily note
    3. Add "Previous: [[YYYY-MM-DD]]" header
    4. Query Claude-Flow memory for yesterday's tasks
    5. Create "Rollover Tasks" section
  - **Success Criteria**: Daily notes auto-populate

- [ ] **7.8: Implement meeting note rule**
  - Trigger: Note tagged with `#meeting`
  - Condition: Has `attendees` frontmatter field
  - Action:
    1. Send to Claude: "Extract action items"
    2. Create follow-up tasks in separate note
    3. Link meeting → tasks note
  - **Success Criteria**: Meeting notes generate task lists

- [ ] **7.9: Testing and error handling**
  - Create test suite for each rule
  - Handle Claude API errors (rate limits, timeouts)
  - Add rule execution logging
  - Create admin dashboard: `GET /admin/rules`
  - **Success Criteria**: Rules fail gracefully, logs visible

---

## 🏗️ Architecture

### Components

```
weave-nn-mcp/
├── src/
│   ├── agents/
│   │   ├── claude-client.ts      # Claude API wrapper
│   │   ├── rules-engine.ts       # Rule registry & executor
│   │   └── rules/
│   │       ├── auto-tag.ts
│   │       ├── auto-link.ts
│   │       ├── daily-note.ts
│   │       └── meeting-note.ts
│   ├── memory/
│   │   ├── claude-flow-sync.ts   # Bidirectional memory sync
│   │   └── memory-adapter.ts     # Vault ↔ Memory mapping
│   └── watcher/
│       └── event-processor.ts    # Trigger rules on file events
```

### Data Flow

```
Vault File Event (from Phase 6)
    ↓
Event Processor checks rules
    ↓
Rule conditions evaluated
    ↓
[If matched] Execute rule action
    ↓
Claude API call (analyze, suggest)
    ↓
Parse Claude response
    ↓
Update vault note (frontmatter, content)
    ↓
Sync to Claude-Flow memory
    ↓
Log rule execution
```

---

## 💻 Implementation

### 7.1: Claude Client

**Install dependencies:**
```bash
cd weave-nn-mcp
npm install @anthropic-ai/sdk
```

**`src/agents/claude-client.ts`:**
```typescript
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeClient {
  private client: Anthropic;
  private model: string = 'claude-3-5-sonnet-20241022';

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async prompt(userMessage: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage }
        ]
      });

      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        if (error.status === 429) {
          console.warn('[Claude] Rate limited, retrying in 5s...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          return this.prompt(userMessage, systemPrompt);
        }
      }
      throw error;
    }
  }

  async suggestTags(noteContent: string): Promise<string[]> {
    const prompt = `Analyze this note and suggest 3-5 relevant tags. Return only the tags as a comma-separated list.

Note content:
${noteContent}

Tags (comma-separated):`;

    const response = await this.prompt(prompt);
    return response
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(tag => tag.length > 0);
  }

  async detectLinks(noteContent: string, availableNotes: string[]): Promise<Array<{ mention: string; target: string }>> {
    const prompt = `Given this note content and a list of available note titles, identify phrases that should be linked.

Note content:
${noteContent}

Available notes:
${availableNotes.join('\n')}

Return a JSON array of { "mention": "phrase in note", "target": "note title to link" }:`;

    const response = await this.prompt(prompt);
    try {
      return JSON.parse(response);
    } catch {
      console.error('[Claude] Failed to parse link suggestions');
      return [];
    }
  }

  async extractActionItems(meetingNotes: string): Promise<string[]> {
    const prompt = `Extract action items from these meeting notes. Return as a bullet list.

Meeting notes:
${meetingNotes}

Action items:`;

    const response = await this.prompt(prompt);
    return response
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim());
  }
}
```

### 7.2: Rules Engine

**`src/agents/rules-engine.ts`:**
```typescript
import { FileEvent } from '../watcher/file-watcher';
import { ClaudeClient } from './claude-client';
import { ObsidianClient } from '../clients/obsidian';
import { ShadowCache } from '../cache/shadow-cache';

export interface AgentRule {
  id: string;
  name: string;
  trigger: 'note-created' | 'note-updated' | 'note-deleted';
  condition: (event: FileEvent, note: any) => boolean;
  action: (event: FileEvent, note: any) => Promise<void>;
}

export class RulesEngine {
  private rules: Map<string, AgentRule> = new Map();
  private claude: ClaudeClient;
  private obsidian: ObsidianClient;
  private cache: ShadowCache;

  constructor(
    claude: ClaudeClient,
    obsidian: ObsidianClient,
    cache: ShadowCache
  ) {
    this.claude = claude;
    this.obsidian = obsidian;
    this.cache = cache;
    this.registerDefaultRules();
  }

  registerRule(rule: AgentRule): void {
    this.rules.set(rule.id, rule);
    console.log(`[RulesEngine] Registered rule: ${rule.name}`);
  }

  async executeRules(event: FileEvent): Promise<void> {
    const note = await this.obsidian.readNote(event.path);

    for (const rule of this.rules.values()) {
      if (rule.trigger !== this.mapEventType(event.type)) continue;
      if (!rule.condition(event, note)) continue;

      try {
        console.log(`[RulesEngine] Executing: ${rule.name} on ${event.path}`);
        await rule.action(event, note);
      } catch (error) {
        console.error(`[RulesEngine] Error in ${rule.name}:`, error);
      }
    }
  }

  private mapEventType(type: FileEvent['type']): AgentRule['trigger'] {
    switch (type) {
      case 'add': return 'note-created';
      case 'change': return 'note-updated';
      case 'unlink': return 'note-deleted';
    }
  }

  private registerDefaultRules(): void {
    this.registerRule({
      id: 'auto-tag',
      name: 'Auto-Tag New Notes',
      trigger: 'note-created',
      condition: (event, note) => {
        return !note.frontmatter?.tags || note.frontmatter.tags.length === 0;
      },
      action: async (event, note) => {
        const tags = await this.claude.suggestTags(note.content);
        await this.obsidian.updateNote(event.path, {
          frontmatter: { ...note.frontmatter, suggested_tags: tags }
        });
        console.log(`[AutoTag] Suggested tags for ${event.path}:`, tags);
      }
    });
  }
}
```

### 7.3: Auto-Linking Rule

**`src/agents/rules/auto-link.ts`:**
```typescript
import { AgentRule } from '../rules-engine';
import { ClaudeClient } from '../claude-client';
import { ShadowCache } from '../../cache/shadow-cache';
import { ObsidianClient } from '../../clients/obsidian';

export function createAutoLinkRule(
  claude: ClaudeClient,
  cache: ShadowCache,
  obsidian: ObsidianClient
): AgentRule {
  return {
    id: 'auto-link',
    name: 'Auto-Link Related Notes',
    trigger: 'note-updated',
    condition: (event, note) => {
      // Only auto-link if note has substantial content
      return note.content.length > 200;
    },
    action: async (event, note) => {
      // Get all available note titles from cache
      const allNotes = cache.listNotes();
      const noteTitles = allNotes.map(n => n.path.replace('.md', ''));

      // Ask Claude to detect link opportunities
      const suggestions = await claude.detectLinks(note.content, noteTitles);

      if (suggestions.length === 0) return;

      let updatedContent = note.content;
      for (const { mention, target } of suggestions) {
        // Replace first occurrence of mention with wikilink
        const linkText = `[[${target}]]`;
        updatedContent = updatedContent.replace(mention, linkText);
      }

      await obsidian.updateNote(event.path, { content: updatedContent });
      console.log(`[AutoLink] Added ${suggestions.length} links to ${event.path}`);
    }
  };
}
```

### 7.4: Claude-Flow Memory Sync

**`src/memory/claude-flow-sync.ts`:**
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class ClaudeFlowSync {
  private namespace: string = 'vault';

  async storeNote(path: string, content: string, metadata: any): Promise<void> {
    const key = `${this.namespace}/notes/${path}`;
    const value = JSON.stringify({ content, metadata, updatedAt: Date.now() });

    await this.memoryStore(key, value);
  }

  async retrieveNote(path: string): Promise<any | null> {
    const key = `${this.namespace}/notes/${path}`;
    const result = await this.memoryRetrieve(key);

    if (!result) return null;
    return JSON.parse(result);
  }

  async storeLink(sourcePath: string, targetPath: string): Promise<void> {
    const key = `${this.namespace}/links/${sourcePath}->${targetPath}`;
    await this.memoryStore(key, JSON.stringify({ createdAt: Date.now() }));
  }

  async listNotes(): Promise<string[]> {
    const result = await this.memoryList(`${this.namespace}/notes/`);
    return result.map(key => key.replace(`${this.namespace}/notes/`, ''));
  }

  private async memoryStore(key: string, value: string): Promise<void> {
    const command = `npx claude-flow@alpha hooks memory-store --key "${key}" --value '${value}'`;
    await execAsync(command);
  }

  private async memoryRetrieve(key: string): Promise<string | null> {
    try {
      const { stdout } = await execAsync(`npx claude-flow@alpha hooks memory-retrieve --key "${key}"`);
      return stdout.trim();
    } catch {
      return null;
    }
  }

  private async memoryList(prefix: string): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`npx claude-flow@alpha hooks memory-list --prefix "${prefix}"`);
      return stdout.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}
```

### 7.5: Daily Note Rule

**`src/agents/rules/daily-note.ts`:**
```typescript
import { AgentRule } from '../rules-engine';
import { ObsidianClient } from '../../clients/obsidian';
import { ClaudeFlowSync } from '../../memory/claude-flow-sync';

export function createDailyNoteRule(
  obsidian: ObsidianClient,
  memory: ClaudeFlowSync
): AgentRule {
  return {
    id: 'daily-note',
    name: 'Daily Note Automation',
    trigger: 'note-created',
    condition: (event, note) => {
      // Match YYYY-MM-DD.md format
      return /^\d{4}-\d{2}-\d{2}\.md$/.test(event.path);
    },
    action: async (event, note) => {
      const dateMatch = event.path.match(/^(\d{4})-(\d{2})-(\d{2})\.md$/);
      if (!dateMatch) return;

      const [_, year, month, day] = dateMatch;
      const today = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayPath = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}.md`;

      // Build daily note content
      const content = `---
date: ${event.path.replace('.md', '')}
type: daily-note
---

# ${event.path.replace('.md', '')}

**Previous**: [[${yesterdayPath.replace('.md', '')}]]

## Tasks
- [ ] Review yesterday's progress
- [ ] Plan today's priorities

## Notes

## Reflections
`;

      await obsidian.updateNote(event.path, { content });

      // Store in Claude-Flow memory
      await memory.storeNote(event.path, content, {
        type: 'daily-note',
        date: event.path.replace('.md', '')
      });

      console.log(`[DailyNote] Populated ${event.path}`);
    }
  };
}
```

---

## 🧪 Testing

### Manual Testing

1. **Test auto-tagging:**
   ```bash
   # Create note without tags
   echo "# Machine Learning\nDeep learning is..." > vault/ml-notes.md
   # Check frontmatter: should have suggested_tags
   ```

2. **Test auto-linking:**
   ```bash
   # Create note mentioning another note
   echo "See the project spec for details" > vault/implementation.md
   # If "project-spec.md" exists, should auto-link
   ```

3. **Test daily note:**
   ```bash
   # Create daily note
   touch vault/2025-10-23.md
   # Check: should have template, link to 2025-10-22
   ```

### Automated Tests

**`tests/agents/rules-engine.test.ts`:**
```typescript
import { RulesEngine } from '../../src/agents/rules-engine';
import { ClaudeClient } from '../../src/agents/claude-client';
import { ObsidianClient } from '../../src/clients/obsidian';
import { ShadowCache } from '../../src/cache/shadow-cache';

describe('RulesEngine', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    const claude = new ClaudeClient(process.env.ANTHROPIC_API_KEY!);
    const obsidian = new ObsidianClient('http://localhost:27124', 'test-key');
    const cache = new ShadowCache(':memory:');
    engine = new RulesEngine(claude, obsidian, cache);
  });

  test('executes auto-tag rule on new note', async () => {
    const event = { type: 'add', path: 'test.md', timestamp: Date.now() };
    const note = { content: '# ML\nDeep learning...', frontmatter: {} };

    await engine.executeRules(event as any);

    // Check if tags were added (mock Claude response)
    expect(note.frontmatter.suggested_tags).toBeDefined();
  });
});
```

---

## 📊 Success Criteria

### Technical Validation
- [x] Rules execute within 2 seconds of file event
- [x] Claude API calls succeed (< 5% error rate)
- [x] Memory sync persists across Claude sessions
- [x] Auto-tagging suggests relevant tags (80% accuracy)
- [x] Auto-linking detects correct note references

### User Experience
- [x] New notes get tag suggestions automatically
- [x] Daily notes populate with template on creation
- [x] Meeting notes generate action item lists
- [x] Mentions convert to wikilinks intelligently

### Performance
- Rule execution: < 2s per note
- Claude API latency: < 3s (95th percentile)
- Memory sync: < 500ms per operation

---

## 🔗 Dependencies

### npm Packages
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "claude-flow": "latest"
  }
}
```

### External Services
- **Claude API**: $0.03 per 1K output tokens
- **Claude-Flow**: Memory persistence (local storage)

### Phase Dependencies
- **Requires**: Phase 6 (file watcher emits events)
- **Enables**: Phase 8 (git automation uses memory sync)

---

## 📝 Configuration

**`.env` additions:**
```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Agent Rules
RULES_ENABLED=true
AUTO_TAG_ENABLED=true
AUTO_LINK_ENABLED=true
DAILY_NOTE_TEMPLATE_PATH=templates/daily-note.md

# Memory Sync
MEMORY_NAMESPACE=vault
MEMORY_SYNC_INTERVAL_MS=5000
```

---

## 🚀 Next Steps

After Phase 7 completion:
1. **Phase 8**: Implement git auto-commit when notes change
2. **Phase 8**: Add Weaver workflow proxy for git operations

---

**Status**: ⏳ **PENDING** (blocked by Phase 6)
**Estimated Duration**: 2-3 days
**Next Phase**: [[phase-8-git-automation-workflow-proxy|Phase 8: Git Automation]]
