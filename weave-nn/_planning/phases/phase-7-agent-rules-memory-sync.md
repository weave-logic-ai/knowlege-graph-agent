---
phase_id: PHASE-7
phase_name: Agent Rules & Memory Sync
type: implementation
status: complete
priority: high
created_date: '2025-10-23'
completed_date: '2025-10-25'
duration: 2-3 days
scope:
  current_phase: mvp
  obsidian_only: true
  web_version_needed: false
dependencies:
  requires:
    - PHASE-6
  enables:
    - PHASE-8
  blocks: []
tags:
  - scope/mvp
  - type/implementation
  - status/complete
  - priority/high
  - phase-7
  - agent-rules
  - memory-sync
  - auto-linking
  - auto-tagging
visual:
  icon: brain
  cssclasses:
    - type-implementation
    - scope-mvp
    - status-complete
    - priority-high
version: '3.0'
updated_date: '2025-10-28'
---

# Phase 7: Agent Rules & Memory Sync

**Status**: ✅ **COMPLETE**
**Depends On**: [[phase-6-file-watcher-weaver-integration|Phase 6: File Watcher & Weaver]] ✅
**Enables**: [[phase-8-git-automation-workflow-proxy|Phase 8: Git Automation]]
**Priority**: 🔴 **HIGH**
**Duration**: 2-3 days
**Completed**: 2025-10-25

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

## 📋 Implementation Tasks

### Task Categories

### Task Details

- [x] **1.1 Install Claude SDK and configure client**
  **Effort**: 1 hour | **Priority**: High | **Dependencies**: None

  Set up the Claude AI SDK and create a basic client wrapper that can be used throughout the agent rules system.

  **Acceptance Criteria**:
  - `@anthropic-ai/sdk` package installed (v0.32.0+)
  - Environment variable `ANTHROPIC_API_KEY` configured
  - Basic client instance created and exported
  - Client can successfully authenticate with Claude API
  - TypeScript types imported and available

- [x] **1.2 Implement prompt builder utility**
  **Effort**: 2 hours | **Priority**: High | **Dependencies**: 1.1

  Create a utility for building structured prompts with system context, user messages, and response formatting instructions.

  **Acceptance Criteria**:
  - `PromptBuilder` class with fluent API
  - Support for system messages (context, role instructions)
  - Support for user messages (note content, metadata)
  - Template system for common prompt patterns
  - JSON response format specification
  - Token counting for cost estimation

- [x] **1.3 Add response parser with error handling**
  **Effort**: 2 hours | **Priority**: High | **Dependencies**: 1.2

  Implement response parsing logic that can extract structured data (JSON, lists) from Claude's responses with robust error handling.

  **Acceptance Criteria**:
  - Parse JSON responses with schema validation
  - Extract lists (tags, action items) from text
  - Handle malformed responses gracefully
  - Return typed results (TypeScript interfaces)
  - Log parsing errors with context
  - Support fallback parsing strategies

- [x] **1.4 Implement rate limiting and retry logic**
  **Effort**: 2 hours | **Priority**: High | **Dependencies**: 1.1

  Add rate limiting, exponential backoff, and retry logic to handle Claude API errors (429, 500, timeouts).

  **Acceptance Criteria**:
  - Detect 429 (rate limit) errors
  - Implement exponential backoff (2s, 4s, 8s, 16s)
  - Max 3 retry attempts per request
  - Timeout handling (abort after 10s)
  - Circuit breaker pattern (stop after 5 consecutive failures)
  - User-friendly error messages

- [x] **1.5 Add Claude API client tests**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 1.1, 1.2, 1.3, 1.4

  Create comprehensive test suite for Claude API client including mocked API responses and error scenarios.
  ### Category 2: Rules Engine

  **Acceptance Criteria**:
  - Test successful API calls with mock responses
  - Test rate limiting and retry behavior
  - Test timeout handling
  - Test response parsing (valid and invalid JSON)
  - Test error message formatting
  - 80%+ code coverage for claude-client.ts

- [x] **2.1 Create rules engine core architecture**
  **Effort**: 3 hours | **Priority**: High | **Dependencies**: None

  Design and implement the core rules engine architecture with rule interfaces, trigger types, and execution patterns.

  **Acceptance Criteria**:
  - `AgentRule` interface defined (trigger, condition, action)
  - `RuleTrigger` enum (onCreate, onUpdate, onDelete)
  - `RuleCondition` type (predicate function)
  - `RuleAction` type (async function)
  - Rule execution context (file path, content, metadata)
  - TypeScript types exported

- [x] **2.2 Implement rule registry and executor**
  **Effort**: 3 hours | **Priority**: High | **Dependencies**: 2.1

  Implement the rule registry for managing rules and the executor for running rules asynchronously on file events.

  **Acceptance Criteria**:
  - `RuleRegistry` class with add/remove/list methods
  - `RuleExecutor` class with execute method
  - Support for multiple rules per trigger
  - Async execution with Promise.allSettled
  - Failed rules don't block other rules
  - Maximum 5 concurrent rules per event (NFR-1)

- [x] **2.3 Add rule execution logging**
  **Effort**: 1.5 hours | **Priority**: Medium | **Dependencies**: 2.2

  Implement comprehensive logging for rule execution including success, failure, duration, and execution details.

  **Acceptance Criteria**:
  - Log rule start (rule name, trigger, file path)
  - Log rule completion (success/failure, duration)
  - Log rule errors with stack traces
  - Track execution metrics (count, avg duration)
  - Store last 100 executions in memory
  - Debug, info, warn, error log levels

- [x] **2.4 Create admin dashboard endpoint**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 2.3

  Create REST API endpoint (GET /admin/rules) that shows rule registry, execution status, and metrics.

  **Acceptance Criteria**:
  - GET /admin/rules endpoint returns rule list
  - Show rule metadata (name, trigger, enabled status)
  - Show execution metrics (count, success rate, avg duration)
  - Show recent executions (last 10 per rule)
  - JSON response with proper formatting
  - Authentication required (basic auth)

- [x] **2.5 Add rules engine tests**
  **Effort**: 2.5 hours | **Priority**: Medium | **Dependencies**: 2.1, 2.2, 2.3, 2.4

  Create comprehensive test suite for rules engine including rule registration, execution, and error handling.
  ### Category 3: Memory Synchronization

  **Acceptance Criteria**:
  - Test rule registration and removal
  - Test rule execution (single and multiple)
  - Test concurrent execution (5 rules max)
  - Test error handling (failed rules don't block)
  - Test logging and metrics
  - 80%+ code coverage for rules-engine.ts

- [x] **3.1 Implement Claude-Flow memory client**
  **Effort**: 2 hours | **Priority**: High | **Dependencies**: None

  Create a client for interacting with Claude-Flow's memory system via CLI hooks or MCP tools.

  **Acceptance Criteria**:
  - Detect if Claude-Flow is available
  - Implement memory store (key, value, namespace)
  - Implement memory retrieve (key, namespace)
  - Implement memory search (pattern, namespace)
  - Handle CLI errors gracefully (fallback to no-op)
  - Support both hooks and MCP methods

- [x] **3.2 Create vault-to-memory sync**
  **Effort**: 2.5 hours | **Priority**: High | **Dependencies**: 3.1

  Implement sync logic that stores vault notes in Claude-Flow memory on file create/update events.

  **Acceptance Criteria**:
  - On note create: Store content + metadata to memory
  - On note update: Update memory with new content
  - Memory key format: `vault/notes/{path}`
  - Store frontmatter, content, and timestamps
  - Sync completes < 500ms (NFR-1)
  - Handle sync failures gracefully

- [x] **3.3 Create memory-to-vault sync**
  **Effort**: 2.5 hours | **Priority**: High | **Dependencies**: 3.1

  Implement sync logic that creates vault notes from Claude-Flow memory when Claude generates new content.

  **Acceptance Criteria**:
  - Listen for memory changes in `vault/notes/*` namespace
  - Create note file when new memory entry detected
  - Extract frontmatter and content from memory
  - Use Obsidian REST API to create note
  - Prevent sync loops (track sync source)
  - Sync completes < 500ms (NFR-1)

- [x] **3.4 Add conflict resolution logic**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 3.2, 3.3

  Implement conflict resolution when vault and memory have different versions of the same note (vault wins).

  **Acceptance Criteria**:
  - Detect conflicts (different timestamps)
  - Apply "vault wins" resolution strategy
  - Log conflicts to admin dashboard
  - Allow manual conflict resolution (future)
  - Prevent data loss (backup before overwrite)
  - Track conflict count in metrics

- [x] **3.5 Add memory sync tests**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 3.1, 3.2, 3.3, 3.4

  Create comprehensive test suite for memory sync including bidirectional sync and conflict resolution.
  ### Category 4: Auto-Tagging

  **Acceptance Criteria**:
  - Test vault-to-memory sync (create, update)
  - Test memory-to-vault sync (create from memory)
  - Test conflict resolution (vault wins)
  - Test sync performance (< 500ms)
  - Test error handling (Claude-Flow unavailable)
  - 80%+ code coverage for memory modules

- [x] **4.1 Implement auto-tagging rule**
  **Effort**: 2 hours | **Priority**: High | **Dependencies**: 2.2, 1.3

  Create the auto-tagging rule that suggests relevant tags for new notes using Claude AI.

  **Acceptance Criteria**:
  - Trigger: Note created without tags in frontmatter
  - Condition: `tags` field missing or empty
  - Action: Send content to Claude for tag suggestions
  - Result: Add `suggested_tags` array to frontmatter
  - Tags relevant (80%+ accuracy target)
  - Suggestions appear < 5s after creation

- [x] **4.2 Create tag suggestion prompt template**
  **Effort**: 1 hour | **Priority**: High | **Dependencies**: 4.1

  Design Claude prompt template for generating relevant tag suggestions based on note content.

  **Acceptance Criteria**:
  - System message defines tagging task
  - User message includes note title and content
  - Response format: JSON array of tags
  - Instructions to suggest 3-7 relevant tags
  - Examples of good vs bad tags
  - Tag normalization rules (lowercase, no spaces)

- [x] **4.3 Add frontmatter tag update logic**
  **Effort**: 1.5 hours | **Priority**: High | **Dependencies**: 4.1

  Implement logic to safely update note frontmatter with suggested tags using Obsidian REST API.

  **Acceptance Criteria**:
  - Parse existing frontmatter (YAML)
  - Add `suggested_tags` field (preserve existing fields)
  - Format as YAML array
  - Update note via Obsidian REST API
  - Handle notes without frontmatter (add new)
  - Validate YAML syntax before update

- [x] **4.4 Add auto-tagging tests**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 4.1, 4.2, 4.3

  Create test suite for auto-tagging rule including prompt generation, parsing, and frontmatter updates.
  ### Category 5: Auto-Linking

  **Acceptance Criteria**:
  - Test rule trigger (note without tags)
  - Test Claude prompt generation
  - Test tag suggestion parsing
  - Test frontmatter update (with and without existing)
  - Test error handling (Claude unavailable)
  - 80%+ code coverage for auto-tagging

- [x] **5.1 Implement auto-linking rule**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 2.2, 1.3

  Create the auto-linking rule that converts mentions of other notes into wikilinks.

  **Acceptance Criteria**:
  - Trigger: Note updated
  - Condition: Content length > 200 characters
  - Action: Detect phrases matching note titles
  - Result: Replace first mention with [[wikilink]]
  - Accuracy > 90% (correct references)
  - Don't modify existing wikilinks

- [x] **5.2 Create mention detection algorithm**
  **Effort**: 2.5 hours | **Priority**: Medium | **Dependencies**: 5.1

  Implement algorithm to detect potential note references in text using shadow cache and fuzzy matching.

  **Acceptance Criteria**:
  - Query shadow cache for all note titles
  - Fuzzy match phrases in content (Levenshtein distance)
  - Prioritize exact matches over partial
  - Exclude existing wikilinks from detection
  - Handle case-insensitive matching
  - Return match positions and confidence scores

- [x] **5.3 Add wikilink replacement logic**
  **Effort**: 1.5 hours | **Priority**: Medium | **Dependencies**: 5.2

  Implement text replacement logic that converts detected mentions to wikilinks safely.

  **Acceptance Criteria**:
  - Replace only first occurrence of each match
  - Preserve surrounding punctuation
  - Handle multi-word note titles
  - Generate proper wikilink syntax [[title]]
  - Update note content via Obsidian REST API
  - Log replacements for user visibility

- [x] **5.4 Add auto-linking tests**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 5.1, 5.2, 5.3

  Create test suite for auto-linking rule including mention detection and wikilink replacement.
  ### Category 6: Daily Notes

  **Acceptance Criteria**:
  - Test mention detection (exact and fuzzy)
  - Test wikilink replacement (first occurrence only)
  - Test handling of existing wikilinks
  - Test multi-word note titles
  - Test edge cases (punctuation, case sensitivity)
  - 80%+ code coverage for auto-linking

- [x] **6.1 Implement daily note rule**
  **Effort**: 1.5 hours | **Priority**: Medium | **Dependencies**: 2.2, 3.1

  Create the daily note rule that auto-populates daily notes with template and rollover tasks.

  **Acceptance Criteria**:
  - Trigger: Note created matching YYYY-MM-DD.md pattern
  - Condition: Filename matches date regex
  - Action: Apply template, link to yesterday, rollover tasks
  - Result: Fully populated daily note
  - Template applied < 2s after creation
  - Previous day linked correctly

- [x] **6.2 Create daily note template system**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 6.1

  Implement template system for daily notes with customizable sections and metadata.

  **Acceptance Criteria**:
  - Default template with sections (Tasks, Notes, Journal)
  - Template variables: {{date}}, {{yesterday}}, {{tomorrow}}
  - User-customizable templates (config file)
  - Template rendering engine (replace variables)
  - YAML frontmatter generation
  - Store templates in config directory

- [x] **6.3 Add task rollover logic**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 6.1, 3.1

  Implement logic to query yesterday's tasks from memory and rollover incomplete tasks to today.

  **Acceptance Criteria**:
  - Query Claude-Flow memory for yesterday's note
  - Extract unchecked task items (- [ ] syntax)
  - Add to today's Tasks section
  - Preserve task metadata (priority, tags)
  - Handle case when yesterday's note doesn't exist
  - Log rollover count

- [x] **6.4 Add daily note tests**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 6.1, 6.2, 6.3

  Create test suite for daily note rule including template rendering and task rollover.
  ### Category 7: Meeting Notes

  **Acceptance Criteria**:
  - Test date pattern detection (YYYY-MM-DD.md)
  - Test template rendering (variable replacement)
  - Test task rollover from yesterday
  - Test yesterday link creation
  - Test handling missing yesterday note
  - 80%+ code coverage for daily-note

- [x] **7.1 Implement meeting note rule**
  **Effort**: 1.5 hours | **Priority**: Low | **Dependencies**: 2.2, 1.3

  Create the meeting note rule that extracts action items from meeting notes using Claude AI.

  **Acceptance Criteria**:
  - Trigger: Note tagged with #meeting
  - Condition: Has `attendees` in frontmatter
  - Action: Send to Claude, extract action items
  - Result: Create linked tasks note
  - Action items extracted accurately
  - Tasks note linked to meeting note

- [x] **7.2 Create action item extraction prompt**
  **Effort**: 1 hour | **Priority**: Low | **Dependencies**: 7.1

  Design Claude prompt template for extracting action items, assignees, and due dates from meeting notes.

  **Acceptance Criteria**:
  - System message defines extraction task
  - User message includes meeting content
  - Response format: JSON array of action items
  - Extract: task description, assignee, due date
  - Infer due dates from context (if mentioned)
  - Handle various meeting note formats

- [x] **7.3 Add tasks note creation logic**
  **Effort**: 1.5 hours | **Priority**: Low | **Dependencies**: 7.1

  Implement logic to create a separate tasks note linked to the meeting note with extracted action items.

  **Acceptance Criteria**:
  - Generate tasks note filename (meeting-name-tasks.md)
  - Format action items as checklist (- [ ] syntax)
  - Add metadata (assignee, due date) as inline tags
  - Link tasks note to meeting note
  - Create via Obsidian REST API
  - Handle duplicate tasks note (append instead)

- [x] **7.4 Add meeting note tests**
  **Effort**: 1.5 hours | **Priority**: Low | **Dependencies**: 7.1, 7.2, 7.3

  Create test suite for meeting note rule including action item extraction and tasks note creation.
  ### Category 8: Testing & Quality

  **Acceptance Criteria**:
  - Test #meeting tag detection
  - Test action item extraction (with and without dates)
  - Test tasks note creation and linking
  - Test handling of various meeting formats
  - Test duplicate tasks note handling
  - 80%+ code coverage for meeting-note

- [x] **8.1 Integration testing for all rules**
  **Effort**: 3 hours | **Priority**: High | **Dependencies**: 4.1, 5.1, 6.1, 7.1

  Create end-to-end integration tests that verify all rules working together in realistic scenarios.

  **Acceptance Criteria**:
  - Test complete workflow (file event → rule execution → note update)
  - Test multiple rules triggered by same event
  - Test rule interaction (auto-tagging + auto-linking)
  - Test memory sync during rule execution
  - Test performance (< 2s per note)
  - Test with real Claude API (integration mode)

- [x] **8.2 Error handling and edge cases**
  **Effort**: 2.5 hours | **Priority**: High | **Dependencies**: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.4, 5.1-5.4, 6.1-6.4, 7.1-7.4

  Implement comprehensive error handling for all edge cases and failure scenarios across the rules system.

  **Acceptance Criteria**:
  - Handle Claude API unavailable (graceful degradation)
  - Handle malformed note content (parse errors)
  - Handle Obsidian API errors (connection refused)
  - Handle Claude-Flow unavailable (skip memory sync)
  - Handle rate limiting (queue rules for later)
  - User-friendly error messages in logs

- [x] **8.3 Performance benchmarking**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.4, 5.1-5.4, 6.1-6.4, 7.1-7.4

  Create performance benchmarks to verify rules meet the < 2s execution time and < 500ms memory sync requirements.

  **Acceptance Criteria**:
  - Benchmark each rule execution time
  - Benchmark memory sync operations
  - Benchmark concurrent rule execution (5 rules)
  - Test with various note sizes (1KB, 10KB, 100KB)
  - Report 95th percentile latencies
  - All benchmarks pass NFR requirements

- [x] **8.4 Documentation and examples**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.4, 5.1-5.4, 6.1-6.4, 7.1-7.4, 8.1-8.3

  Create comprehensive documentation for the agent rules system including setup, configuration, and usage examples.

  **Acceptance Criteria**:
  - README for agent rules system
  - Setup instructions (API keys, configuration)
  - Usage examples for each rule
  - Troubleshooting guide (common errors)
  - API documentation (JSDoc comments)
  - Admin dashboard usage guide

### Category 9: Spec-Kit Workflow Improvements

- [x] **9.1 Fix spec generator to output correct task format**
  **Effort**: X | **Priority**: Y | **Dependencies**: Z`

  Update the spec generator to output tasks in the format `### X.Y Task Name` instead of `### Task X: Task Name`. This ensures tasks sync properly without manual reformatting.

  **Acceptance Criteria**:
  - Spec generator outputs tasks as `### 1.1`, `### 2.3`, etc.
  - No `**Status**:` field in generated tasks
  - Test with Phase 8 generation
  - Update spec-kit documentation

- [x] **9.2 Update metadata handling to use camelCase**
  **Effort**: 1 hour | **Priority**: Medium | **Dependencies**: 9.1

  Ensure all metadata uses camelCase (`sourceDocument`) instead of snake_case (`source_document`) for consistency.

  **Acceptance Criteria**:
  - `sourceDocument` used in all metadata files
  - Sync scripts handle both formats (backward compat)
  - Validation warns about snake_case usage
  - All Phase 6/7 metadata updated to camelCase

- [x] **9.3 Add phase document validation script**
  **Effort**: 2 hours | **Priority**: Medium | **Dependencies**: None

  Create a validation script that checks phase documents have the correct structure before syncing tasks.

  **Acceptance Criteria**:
  - Check for `## 📋 Implementation Tasks` section
  - Validate task format (`### X.Y`)
  - Check metadata has required fields
  - Warn about common issues (snake_case, wrong headers)
  - Provide actionable fix suggestions

- [x] **9.4 Create end-to-end spec workflow test**
  **Effort**: 3 hours | **Priority**: Medium | **Dependencies**: 9.1, 9.2, 9.3

  Create automated test that validates the complete spec-kit workflow from generation to sync.

  **Acceptance Criteria**:
  - Test generates specs for sample phase
  - Test validates all format requirements
  - Test syncs tasks to phase document
  - Test verifies task count matches
  - Clean up test artifacts after run
  - CI/CD integration ready

### Summary

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
