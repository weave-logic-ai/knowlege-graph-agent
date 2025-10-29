---
spec_type: tasks
phase_id: PHASE-7
phase_name: Agent Rules & Memory Sync
status: pending
priority: high
duration: 2-3 days
generated_date: '2025-10-25'
tags:
  - spec-kit
  - tasks
  - phase-7
  - agent-rules
  - memory-sync
type: planning
scope: task
visual:
  icon: "\U0001F4CB"
  color: '#3B82F6'
  cssclasses:
    - type-planning
    - status-pending
    - priority-high
    - phase-7
version: '3.0'
updated_date: '2025-10-28'
---

# Agent Rules & Memory Sync - Tasks

**Phase ID**: PHASE-7
**Status**: pending
**Duration**: 2-3 days
**Total Effort**: 78 hours

---

## Task Categories

### Category 1: Claude AI Integration (FR-2)
- 1.1: Install Claude SDK and configure client
- 1.2: Implement prompt builder utility
- 1.3: Add response parser with error handling
- 1.4: Implement rate limiting and retry logic
- 1.5: Add Claude API client tests

### Category 2: Rules Engine (FR-1)
- 2.1: Create rules engine core architecture
- 2.2: Implement rule registry and executor
- 2.3: Add rule execution logging
- 2.4: Create admin dashboard endpoint
- 2.5: Add rules engine tests

### Category 3: Memory Synchronization (FR-7)
- 3.1: Implement Claude-Flow memory client
- 3.2: Create vault-to-memory sync
- 3.3: Create memory-to-vault sync
- 3.4: Add conflict resolution logic
- 3.5: Add memory sync tests

### Category 4: Auto-Tagging (FR-3)
- 4.1: Implement auto-tagging rule
- 4.2: Create tag suggestion prompt template
- 4.3: Add frontmatter tag update logic
- 4.4: Add auto-tagging tests

### Category 5: Auto-Linking (FR-4)
- 5.1: Implement auto-linking rule
- 5.2: Create mention detection algorithm
- 5.3: Add wikilink replacement logic
- 5.4: Add auto-linking tests

### Category 6: Daily Notes (FR-5)
- 6.1: Implement daily note rule
- 6.2: Create daily note template system
- 6.3: Add task rollover logic
- 6.4: Add daily note tests

### Category 7: Meeting Notes (FR-6)
- 7.1: Implement meeting note rule
- 7.2: Create action item extraction prompt
- 7.3: Add tasks note creation logic
- 7.4: Add meeting note tests

### Category 8: Testing & Quality
- 8.1: Integration testing for all rules
- 8.2: Error handling and edge cases
- 8.3: Performance benchmarking
- 8.4: Documentation and examples

### Category 9: Spec-Kit Workflow Improvements
- 9.1: Fix spec generator to output correct task format
- 9.2: Update metadata handling to use camelCase
- 9.3: Add phase document validation script
- 9.4: Create end-to-end spec workflow test

---

## Task Details

### Category 1: Claude AI Integration

### 1.1 Install Claude SDK and configure client
**Effort**: 1 hour | **Priority**: High | **Dependencies**: None

**Description**:
Set up the Claude AI SDK and create a basic client wrapper that can be used throughout the agent rules system.

**Acceptance Criteria**:
- [ ] `@anthropic-ai/sdk` package installed (v0.32.0+)
- [ ] Environment variable `ANTHROPIC_API_KEY` configured
- [ ] Basic client instance created and exported
- [ ] Client can successfully authenticate with Claude API
- [ ] TypeScript types imported and available

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/package.json` - Add @anthropic-ai/sdk dependency
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/claude-client.ts` - Main client class
- `/home/aepod/dev/weave-nn/weave-nn/weaver/.env.example` - Add ANTHROPIC_API_KEY example

---

### 1.2 Implement prompt builder utility
**Effort**: 2 hours | **Priority**: High | **Dependencies**: 1.1

**Description**:
Create a utility for building structured prompts with system context, user messages, and response formatting instructions.

**Acceptance Criteria**:
- [ ] `PromptBuilder` class with fluent API
- [ ] Support for system messages (context, role instructions)
- [ ] Support for user messages (note content, metadata)
- [ ] Template system for common prompt patterns
- [ ] JSON response format specification
- [ ] Token counting for cost estimation

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/prompt-builder.ts` - Prompt builder utility
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/prompt-templates.ts` - Common templates

---

### 1.3 Add response parser with error handling
**Effort**: 2 hours | **Priority**: High | **Dependencies**: 1.2

**Description**:
Implement response parsing logic that can extract structured data (JSON, lists) from Claude's responses with robust error handling.

**Acceptance Criteria**:
- [ ] Parse JSON responses with schema validation
- [ ] Extract lists (tags, action items) from text
- [ ] Handle malformed responses gracefully
- [ ] Return typed results (TypeScript interfaces)
- [ ] Log parsing errors with context
- [ ] Support fallback parsing strategies

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/response-parser.ts` - Parser implementation
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/types.ts` - Response type definitions

---

### 1.4 Implement rate limiting and retry logic
**Effort**: 2 hours | **Priority**: High | **Dependencies**: 1.1

**Description**:
Add rate limiting, exponential backoff, and retry logic to handle Claude API errors (429, 500, timeouts).

**Acceptance Criteria**:
- [ ] Detect 429 (rate limit) errors
- [ ] Implement exponential backoff (2s, 4s, 8s, 16s)
- [ ] Max 3 retry attempts per request
- [ ] Timeout handling (abort after 10s)
- [ ] Circuit breaker pattern (stop after 5 consecutive failures)
- [ ] User-friendly error messages

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/retry-handler.ts` - Retry logic
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/claude-client.ts` - Integrate retry logic

---

### 1.5 Add Claude API client tests
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 1.1, 1.2, 1.3, 1.4

**Description**:
Create comprehensive test suite for Claude API client including mocked API responses and error scenarios.

**Acceptance Criteria**:
- [ ] Test successful API calls with mock responses
- [ ] Test rate limiting and retry behavior
- [ ] Test timeout handling
- [ ] Test response parsing (valid and invalid JSON)
- [ ] Test error message formatting
- [ ] 80%+ code coverage for claude-client.ts

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/agents/claude-client.test.ts` - Client tests
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/agents/response-parser.test.ts` - Parser tests
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/fixtures/claude-responses.json` - Mock responses

---

### Category 2: Rules Engine

### 2.1 Create rules engine core architecture
**Effort**: 3 hours | **Priority**: High | **Dependencies**: None

**Description**:
Design and implement the core rules engine architecture with rule interfaces, trigger types, and execution patterns.

**Acceptance Criteria**:
- [ ] `AgentRule` interface defined (trigger, condition, action)
- [ ] `RuleTrigger` enum (onCreate, onUpdate, onDelete)
- [ ] `RuleCondition` type (predicate function)
- [ ] `RuleAction` type (async function)
- [ ] Rule execution context (file path, content, metadata)
- [ ] TypeScript types exported

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/types.ts` - Core interfaces
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules-engine.ts` - Engine class scaffold

---

### 2.2 Implement rule registry and executor
**Effort**: 3 hours | **Priority**: High | **Dependencies**: 2.1

**Description**:
Implement the rule registry for managing rules and the executor for running rules asynchronously on file events.

**Acceptance Criteria**:
- [ ] `RuleRegistry` class with add/remove/list methods
- [ ] `RuleExecutor` class with execute method
- [ ] Support for multiple rules per trigger
- [ ] Async execution with Promise.allSettled
- [ ] Failed rules don't block other rules
- [ ] Maximum 5 concurrent rules per event (NFR-1)

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules-engine.ts` - Registry and executor
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rule-context.ts` - Execution context

---

### 2.3 Add rule execution logging
**Effort**: 1.5 hours | **Priority**: Medium | **Dependencies**: 2.2

**Description**:
Implement comprehensive logging for rule execution including success, failure, duration, and execution details.

**Acceptance Criteria**:
- [ ] Log rule start (rule name, trigger, file path)
- [ ] Log rule completion (success/failure, duration)
- [ ] Log rule errors with stack traces
- [ ] Track execution metrics (count, avg duration)
- [ ] Store last 100 executions in memory
- [ ] Debug, info, warn, error log levels

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rule-logger.ts` - Logging system
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules-engine.ts` - Integrate logging

---

### 2.4 Create admin dashboard endpoint
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 2.3

**Description**:
Create REST API endpoint (GET /admin/rules) that shows rule registry, execution status, and metrics.

**Acceptance Criteria**:
- [ ] GET /admin/rules endpoint returns rule list
- [ ] Show rule metadata (name, trigger, enabled status)
- [ ] Show execution metrics (count, success rate, avg duration)
- [ ] Show recent executions (last 10 per rule)
- [ ] JSON response with proper formatting
- [ ] Authentication required (basic auth)

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/api/admin/rules-handler.ts` - Admin endpoint
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/index.ts` - Register admin routes

---

### 2.5 Add rules engine tests
**Effort**: 2.5 hours | **Priority**: Medium | **Dependencies**: 2.1, 2.2, 2.3, 2.4

**Description**:
Create comprehensive test suite for rules engine including rule registration, execution, and error handling.

**Acceptance Criteria**:
- [ ] Test rule registration and removal
- [ ] Test rule execution (single and multiple)
- [ ] Test concurrent execution (5 rules max)
- [ ] Test error handling (failed rules don't block)
- [ ] Test logging and metrics
- [ ] 80%+ code coverage for rules-engine.ts

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/agents/rules-engine.test.ts` - Engine tests
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/agents/rule-logger.test.ts` - Logger tests

---

### Category 3: Memory Synchronization

### 3.1 Implement Claude-Flow memory client
**Effort**: 2 hours | **Priority**: High | **Dependencies**: None

**Description**:
Create a client for interacting with Claude-Flow's memory system via CLI hooks or MCP tools.

**Acceptance Criteria**:
- [ ] Detect if Claude-Flow is available
- [ ] Implement memory store (key, value, namespace)
- [ ] Implement memory retrieve (key, namespace)
- [ ] Implement memory search (pattern, namespace)
- [ ] Handle CLI errors gracefully (fallback to no-op)
- [ ] Support both hooks and MCP methods

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/memory/claude-flow-client.ts` - Memory client
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/memory/types.ts` - Memory types

---

### 3.2 Create vault-to-memory sync
**Effort**: 2.5 hours | **Priority**: High | **Dependencies**: 3.1

**Description**:
Implement sync logic that stores vault notes in Claude-Flow memory on file create/update events.

**Acceptance Criteria**:
- [ ] On note create: Store content + metadata to memory
- [ ] On note update: Update memory with new content
- [ ] Memory key format: `vault/notes/{path}`
- [ ] Store frontmatter, content, and timestamps
- [ ] Sync completes < 500ms (NFR-1)
- [ ] Handle sync failures gracefully

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/memory/vault-to-memory.ts` - Sync implementation
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/file-watcher/event-handler.ts` - Integrate sync

---

### 3.3 Create memory-to-vault sync
**Effort**: 2.5 hours | **Priority**: High | **Dependencies**: 3.1

**Description**:
Implement sync logic that creates vault notes from Claude-Flow memory when Claude generates new content.

**Acceptance Criteria**:
- [ ] Listen for memory changes in `vault/notes/*` namespace
- [ ] Create note file when new memory entry detected
- [ ] Extract frontmatter and content from memory
- [ ] Use Obsidian REST API to create note
- [ ] Prevent sync loops (track sync source)
- [ ] Sync completes < 500ms (NFR-1)

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/memory/memory-to-vault.ts` - Reverse sync
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/memory/sync-manager.ts` - Bidirectional coordinator

---

### 3.4 Add conflict resolution logic
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 3.2, 3.3

**Description**:
Implement conflict resolution when vault and memory have different versions of the same note (vault wins).

**Acceptance Criteria**:
- [ ] Detect conflicts (different timestamps)
- [ ] Apply "vault wins" resolution strategy
- [ ] Log conflicts to admin dashboard
- [ ] Allow manual conflict resolution (future)
- [ ] Prevent data loss (backup before overwrite)
- [ ] Track conflict count in metrics

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/memory/conflict-resolver.ts` - Conflict logic
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/memory/sync-manager.ts` - Integrate resolver

---

### 3.5 Add memory sync tests
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 3.1, 3.2, 3.3, 3.4

**Description**:
Create comprehensive test suite for memory sync including bidirectional sync and conflict resolution.

**Acceptance Criteria**:
- [ ] Test vault-to-memory sync (create, update)
- [ ] Test memory-to-vault sync (create from memory)
- [ ] Test conflict resolution (vault wins)
- [ ] Test sync performance (< 500ms)
- [ ] Test error handling (Claude-Flow unavailable)
- [ ] 80%+ code coverage for memory modules

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/memory/vault-to-memory.test.ts` - Sync tests
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/memory/conflict-resolver.test.ts` - Conflict tests

---

### Category 4: Auto-Tagging

### 4.1 Implement auto-tagging rule
**Effort**: 2 hours | **Priority**: High | **Dependencies**: 2.2, 1.3

**Description**:
Create the auto-tagging rule that suggests relevant tags for new notes using Claude AI.

**Acceptance Criteria**:
- [ ] Trigger: Note created without tags in frontmatter
- [ ] Condition: `tags` field missing or empty
- [ ] Action: Send content to Claude for tag suggestions
- [ ] Result: Add `suggested_tags` array to frontmatter
- [ ] Tags relevant (80%+ accuracy target)
- [ ] Suggestions appear < 5s after creation

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/auto-tagging.ts` - Rule implementation
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/index.ts` - Export rule

---

### 4.2 Create tag suggestion prompt template
**Effort**: 1 hour | **Priority**: High | **Dependencies**: 4.1

**Description**:
Design Claude prompt template for generating relevant tag suggestions based on note content.

**Acceptance Criteria**:
- [ ] System message defines tagging task
- [ ] User message includes note title and content
- [ ] Response format: JSON array of tags
- [ ] Instructions to suggest 3-7 relevant tags
- [ ] Examples of good vs bad tags
- [ ] Tag normalization rules (lowercase, no spaces)

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/prompts/auto-tagging.ts` - Prompt template
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/fixtures/tag-examples.json` - Example tags

---

### 4.3 Add frontmatter tag update logic
**Effort**: 1.5 hours | **Priority**: High | **Dependencies**: 4.1

**Description**:
Implement logic to safely update note frontmatter with suggested tags using Obsidian REST API.

**Acceptance Criteria**:
- [ ] Parse existing frontmatter (YAML)
- [ ] Add `suggested_tags` field (preserve existing fields)
- [ ] Format as YAML array
- [ ] Update note via Obsidian REST API
- [ ] Handle notes without frontmatter (add new)
- [ ] Validate YAML syntax before update

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/frontmatter-updater.ts` - Update utility
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/auto-tagging.ts` - Integrate updater

---

### 4.4 Add auto-tagging tests
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 4.1, 4.2, 4.3

**Description**:
Create test suite for auto-tagging rule including prompt generation, parsing, and frontmatter updates.

**Acceptance Criteria**:
- [ ] Test rule trigger (note without tags)
- [ ] Test Claude prompt generation
- [ ] Test tag suggestion parsing
- [ ] Test frontmatter update (with and without existing)
- [ ] Test error handling (Claude unavailable)
- [ ] 80%+ code coverage for auto-tagging

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/agents/rules/auto-tagging.test.ts` - Rule tests
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/fixtures/notes-without-tags.md` - Test notes

---

### Category 5: Auto-Linking

### 5.1 Implement auto-linking rule
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 2.2, 1.3

**Description**:
Create the auto-linking rule that converts mentions of other notes into wikilinks.

**Acceptance Criteria**:
- [ ] Trigger: Note updated
- [ ] Condition: Content length > 200 characters
- [ ] Action: Detect phrases matching note titles
- [ ] Result: Replace first mention with [[wikilink]]
- [ ] Accuracy > 90% (correct references)
- [ ] Don't modify existing wikilinks

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/auto-linking.ts` - Rule implementation
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/index.ts` - Export rule

---

### 5.2 Create mention detection algorithm
**Effort**: 2.5 hours | **Priority**: Medium | **Dependencies**: 5.1

**Description**:
Implement algorithm to detect potential note references in text using shadow cache and fuzzy matching.

**Acceptance Criteria**:
- [ ] Query shadow cache for all note titles
- [ ] Fuzzy match phrases in content (Levenshtein distance)
- [ ] Prioritize exact matches over partial
- [ ] Exclude existing wikilinks from detection
- [ ] Handle case-insensitive matching
- [ ] Return match positions and confidence scores

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/mention-detector.ts` - Detection algorithm
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/utils/fuzzy-match.ts` - Fuzzy matching utility

---

### 5.3 Add wikilink replacement logic
**Effort**: 1.5 hours | **Priority**: Medium | **Dependencies**: 5.2

**Description**:
Implement text replacement logic that converts detected mentions to wikilinks safely.

**Acceptance Criteria**:
- [ ] Replace only first occurrence of each match
- [ ] Preserve surrounding punctuation
- [ ] Handle multi-word note titles
- [ ] Generate proper wikilink syntax [[title]]
- [ ] Update note content via Obsidian REST API
- [ ] Log replacements for user visibility

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/wikilink-replacer.ts` - Replacement utility
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/auto-linking.ts` - Integrate replacer

---

### 5.4 Add auto-linking tests
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 5.1, 5.2, 5.3

**Description**:
Create test suite for auto-linking rule including mention detection and wikilink replacement.

**Acceptance Criteria**:
- [ ] Test mention detection (exact and fuzzy)
- [ ] Test wikilink replacement (first occurrence only)
- [ ] Test handling of existing wikilinks
- [ ] Test multi-word note titles
- [ ] Test edge cases (punctuation, case sensitivity)
- [ ] 80%+ code coverage for auto-linking

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/agents/rules/auto-linking.test.ts` - Rule tests
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/fixtures/notes-with-mentions.md` - Test content

---

### Category 6: Daily Notes

### 6.1 Implement daily note rule
**Effort**: 1.5 hours | **Priority**: Medium | **Dependencies**: 2.2, 3.1

**Description**:
Create the daily note rule that auto-populates daily notes with template and rollover tasks.

**Acceptance Criteria**:
- [ ] Trigger: Note created matching YYYY-MM-DD.md pattern
- [ ] Condition: Filename matches date regex
- [ ] Action: Apply template, link to yesterday, rollover tasks
- [ ] Result: Fully populated daily note
- [ ] Template applied < 2s after creation
- [ ] Previous day linked correctly

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/daily-note.ts` - Rule implementation
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/index.ts` - Export rule

---

### 6.2 Create daily note template system
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 6.1

**Description**:
Implement template system for daily notes with customizable sections and metadata.

**Acceptance Criteria**:
- [ ] Default template with sections (Tasks, Notes, Journal)
- [ ] Template variables: {{date}}, {{yesterday}}, {{tomorrow}}
- [ ] User-customizable templates (config file)
- [ ] Template rendering engine (replace variables)
- [ ] YAML frontmatter generation
- [ ] Store templates in config directory

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/templates/daily-note-template.ts` - Template engine
- `/home/aepod/dev/weave-nn/weave-nn/weaver/config/daily-note-template.md` - Default template

---

### 6.3 Add task rollover logic
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 6.1, 3.1

**Description**:
Implement logic to query yesterday's tasks from memory and rollover incomplete tasks to today.

**Acceptance Criteria**:
- [ ] Query Claude-Flow memory for yesterday's note
- [ ] Extract unchecked task items (- [ ] syntax)
- [ ] Add to today's Tasks section
- [ ] Preserve task metadata (priority, tags)
- [ ] Handle case when yesterday's note doesn't exist
- [ ] Log rollover count

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/task-rollover.ts` - Rollover logic
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/daily-note.ts` - Integrate rollover

---

### 6.4 Add daily note tests
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 6.1, 6.2, 6.3

**Description**:
Create test suite for daily note rule including template rendering and task rollover.

**Acceptance Criteria**:
- [ ] Test date pattern detection (YYYY-MM-DD.md)
- [ ] Test template rendering (variable replacement)
- [ ] Test task rollover from yesterday
- [ ] Test yesterday link creation
- [ ] Test handling missing yesterday note
- [ ] 80%+ code coverage for daily-note

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/agents/rules/daily-note.test.ts` - Rule tests
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/fixtures/daily-notes/` - Test notes directory

---

### Category 7: Meeting Notes

### 7.1 Implement meeting note rule
**Effort**: 1.5 hours | **Priority**: Low | **Dependencies**: 2.2, 1.3

**Description**:
Create the meeting note rule that extracts action items from meeting notes using Claude AI.

**Acceptance Criteria**:
- [ ] Trigger: Note tagged with #meeting
- [ ] Condition: Has `attendees` in frontmatter
- [ ] Action: Send to Claude, extract action items
- [ ] Result: Create linked tasks note
- [ ] Action items extracted accurately
- [ ] Tasks note linked to meeting note

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/meeting-note.ts` - Rule implementation
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/index.ts` - Export rule

---

### 7.2 Create action item extraction prompt
**Effort**: 1 hour | **Priority**: Low | **Dependencies**: 7.1

**Description**:
Design Claude prompt template for extracting action items, assignees, and due dates from meeting notes.

**Acceptance Criteria**:
- [ ] System message defines extraction task
- [ ] User message includes meeting content
- [ ] Response format: JSON array of action items
- [ ] Extract: task description, assignee, due date
- [ ] Infer due dates from context (if mentioned)
- [ ] Handle various meeting note formats

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/prompts/meeting-actions.ts` - Prompt template
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/fixtures/meeting-examples.md` - Example meetings

---

### 7.3 Add tasks note creation logic
**Effort**: 1.5 hours | **Priority**: Low | **Dependencies**: 7.1

**Description**:
Implement logic to create a separate tasks note linked to the meeting note with extracted action items.

**Acceptance Criteria**:
- [ ] Generate tasks note filename (meeting-name-tasks.md)
- [ ] Format action items as checklist (- [ ] syntax)
- [ ] Add metadata (assignee, due date) as inline tags
- [ ] Link tasks note to meeting note
- [ ] Create via Obsidian REST API
- [ ] Handle duplicate tasks note (append instead)

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/tasks-note-creator.ts` - Creator utility
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/rules/meeting-note.ts` - Integrate creator

---

### 7.4 Add meeting note tests
**Effort**: 1.5 hours | **Priority**: Low | **Dependencies**: 7.1, 7.2, 7.3

**Description**:
Create test suite for meeting note rule including action item extraction and tasks note creation.

**Acceptance Criteria**:
- [ ] Test #meeting tag detection
- [ ] Test action item extraction (with and without dates)
- [ ] Test tasks note creation and linking
- [ ] Test handling of various meeting formats
- [ ] Test duplicate tasks note handling
- [ ] 80%+ code coverage for meeting-note

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/agents/rules/meeting-note.test.ts` - Rule tests
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/fixtures/meeting-notes/` - Test meetings

---

### Category 8: Testing & Quality

### 8.1 Integration testing for all rules
**Effort**: 3 hours | **Priority**: High | **Dependencies**: 4.1, 5.1, 6.1, 7.1

**Description**:
Create end-to-end integration tests that verify all rules working together in realistic scenarios.

**Acceptance Criteria**:
- [ ] Test complete workflow (file event → rule execution → note update)
- [ ] Test multiple rules triggered by same event
- [ ] Test rule interaction (auto-tagging + auto-linking)
- [ ] Test memory sync during rule execution
- [ ] Test performance (< 2s per note)
- [ ] Test with real Claude API (integration mode)

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/integration/rules-integration.test.ts` - Integration tests
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/integration/setup.ts` - Test setup helpers

---

### 8.2 Error handling and edge cases
**Effort**: 2.5 hours | **Priority**: High | **Dependencies**: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.4, 5.1-5.4, 6.1-6.4, 7.1-7.4

**Description**:
Implement comprehensive error handling for all edge cases and failure scenarios across the rules system.

**Acceptance Criteria**:
- [ ] Handle Claude API unavailable (graceful degradation)
- [ ] Handle malformed note content (parse errors)
- [ ] Handle Obsidian API errors (connection refused)
- [ ] Handle Claude-Flow unavailable (skip memory sync)
- [ ] Handle rate limiting (queue rules for later)
- [ ] User-friendly error messages in logs

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/src/agents/error-handler.ts` - Error handling utilities
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/agents/error-scenarios.test.ts` - Error tests

---

### 8.3 Performance benchmarking
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.4, 5.1-5.4, 6.1-6.4, 7.1-7.4

**Description**:
Create performance benchmarks to verify rules meet the < 2s execution time and < 500ms memory sync requirements.

**Acceptance Criteria**:
- [ ] Benchmark each rule execution time
- [ ] Benchmark memory sync operations
- [ ] Benchmark concurrent rule execution (5 rules)
- [ ] Test with various note sizes (1KB, 10KB, 100KB)
- [ ] Report 95th percentile latencies
- [ ] All benchmarks pass NFR requirements

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/tests/benchmarks/rules-performance.bench.ts` - Benchmarks
- `/home/aepod/dev/weave-nn/weave-nn/weaver/scripts/run-benchmarks.ts` - Benchmark runner

---

### 8.4 Documentation and examples
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.4, 5.1-5.4, 6.1-6.4, 7.1-7.4, 8.1-8.3

**Description**:
Create comprehensive documentation for the agent rules system including setup, configuration, and usage examples.

**Acceptance Criteria**:
- [ ] README for agent rules system
- [ ] Setup instructions (API keys, configuration)
- [ ] Usage examples for each rule
- [ ] Troubleshooting guide (common errors)
- [ ] API documentation (JSDoc comments)
- [ ] Admin dashboard usage guide

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weave-nn/weaver/docs/agent-rules-system.md` - Main documentation
- `/home/aepod/dev/weave-nn/weave-nn/weaver/docs/rules-examples.md` - Usage examples
- `/home/aepod/dev/weave-nn/weave-nn/weaver/docs/troubleshooting-rules.md` - Troubleshooting guide

---

## Category 9: Spec-Kit Workflow Improvements

### 9.1 Fix spec generator to output correct task format
**Effort**: 2 hours | **Priority**: High | **Dependencies**: None

Update the spec generator to output tasks in the format `### X.Y Task Name` instead of `### Task X: Task Name`. This ensures tasks sync properly without manual reformatting.

**Acceptance Criteria**:
- [ ] Spec generator outputs tasks as `### 1.1`, `### 2.3`, etc.
- [ ] Task metadata on single line: `**Effort**: X | **Priority**: Y | **Dependencies**: Z`
- [ ] No `**Status**:` field in generated tasks
- [ ] Test with Phase 8 generation
- [ ] Update spec-kit documentation

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weaver/src/spec-generator/task-generator.ts` - Fix task format
- `/home/aepod/dev/weave-nn/weaver/src/spec-generator/templates/tasks.hbs` - Update template
- `/home/aepod/dev/weave-nn/weaver/docs/SPEC-KIT-WORKFLOW.md` - Document format

---

### 9.2 Update metadata handling to use camelCase
**Effort**: 1 hour | **Priority**: Medium | **Dependencies**: 9.1

Ensure all metadata uses camelCase (`sourceDocument`) instead of snake_case (`source_document`) for consistency.

**Acceptance Criteria**:
- [ ] `sourceDocument` used in all metadata files
- [ ] Sync scripts handle both formats (backward compat)
- [ ] Validation warns about snake_case usage
- [ ] All Phase 6/7 metadata updated to camelCase

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weaver/src/spec-generator/metadata-writer.ts` - Use camelCase
- `/home/aepod/dev/weave-nn/weaver/scripts/sync-tasks-simple.ts` - Handle both formats
- `/home/aepod/dev/weave-nn/weave-nn/_planning/specs/*/...speckit/metadata.json` - Update existing

---

### 9.3 Add phase document validation script
**Effort**: 2 hours | **Priority**: Medium | **Dependencies**: None

Create a validation script that checks phase documents have the correct structure before syncing tasks.

**Acceptance Criteria**:
- [ ] Check for `## 📋 Implementation Tasks` section
- [ ] Validate task format (`### X.Y`)
- [ ] Check metadata has required fields
- [ ] Warn about common issues (snake_case, wrong headers)
- [ ] Provide actionable fix suggestions

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weaver/scripts/validate-spec.ts` - New validation script
- `/home/aepod/dev/weave-nn/weaver/package.json` - Add validate-spec script
- `/home/aepod/dev/weave-nn/weaver/docs/SPEC-KIT-WORKFLOW.md` - Document validation

---

### 9.4 Create end-to-end spec workflow test
**Effort**: 3 hours | **Priority**: Medium | **Dependencies**: 9.1, 9.2, 9.3

Create automated test that validates the complete spec-kit workflow from generation to sync.

**Acceptance Criteria**:
- [ ] Test generates specs for sample phase
- [ ] Test validates all format requirements
- [ ] Test syncs tasks to phase document
- [ ] Test verifies task count matches
- [ ] Clean up test artifacts after run
- [ ] CI/CD integration ready

**Files to Create/Modify**:
- `/home/aepod/dev/weave-nn/weaver/tests/spec-kit/e2e-workflow.test.ts` - E2E test
- `/home/aepod/dev/weave-nn/weaver/tests/spec-kit/fixtures/` - Test fixtures
- `/home/aepod/dev/weave-nn/weaver/.github/workflows/spec-kit-tests.yml` - CI config

---

## Summary

**Total Tasks**: 39 tasks
**Total Effort**: 78 hours (approx. 2-3 days with 2-3 developers working in parallel)

### Effort Breakdown by Category
- **Claude AI Integration**: 9 hours (Tasks 1.1-1.5)
- **Rules Engine**: 12 hours (Tasks 2.1-2.5)
- **Memory Synchronization**: 11 hours (Tasks 3.1-3.5)
- **Auto-Tagging**: 6.5 hours (Tasks 4.1-4.4)
- **Auto-Linking**: 8 hours (Tasks 5.1-5.4)
- **Daily Notes**: 7.5 hours (Tasks 6.1-6.4)
- **Meeting Notes**: 5.5 hours (Tasks 7.1-7.4)
- **Testing & Quality**: 9.5 hours (Tasks 8.1-8.4)
- **Spec-Kit Workflow Improvements**: 8 hours (Tasks 9.1-9.4)

### Critical Path
The following tasks are on the critical path (must complete sequentially):

1. **Task 1** → **Task 2** → **Task 3** (Claude client setup) - 5 hours
2. **Task 6** → **Task 7** (Rules engine core) - 6 hours
3. **Task 11** → **Task 12** (Memory sync) - 4.5 hours
4. **Task 16** → **Task 17** → **Task 18** (Auto-tagging) - 4.5 hours
5. **Task 32** → **Task 33** (Integration testing) - 5.5 hours

**Critical Path Duration**: ~25.5 hours (with sequential dependencies)

### Parallelization Strategy

**Week 1, Day 1 (8 hours)**:
- Developer 1: Tasks 1-3 (Claude client)
- Developer 2: Tasks 6-7 (Rules engine)
- Developer 3: Task 11 (Memory client)

**Week 1, Day 2 (8 hours)**:
- Developer 1: Tasks 4-5 (Retry logic + tests)
- Developer 2: Tasks 8-10 (Logging + admin + tests)
- Developer 3: Tasks 12-13 (Memory sync)

**Week 1, Day 3 (8 hours)**:
- Developer 1: Tasks 16-19 (Auto-tagging)
- Developer 2: Tasks 20-23 (Auto-linking)
- Developer 3: Tasks 14-15 (Conflict resolution + tests)

**Week 2, Day 1 (8 hours)**:
- Developer 1: Tasks 24-27 (Daily notes)
- Developer 2: Tasks 28-31 (Meeting notes)
- Developer 3: Tasks 32-33 (Integration + error handling)

**Week 2, Day 2 (4 hours)**:
- All developers: Tasks 34-35 (Performance + docs)

### Dependencies Graph

```
Task 1 (Claude SDK)
├─→ Task 2 (Prompt builder)
│   └─→ Task 3 (Response parser)
│       ├─→ Task 16 (Auto-tagging)
│       ├─→ Task 20 (Auto-linking)
│       └─→ Task 28 (Meeting notes)
├─→ Task 4 (Retry logic)
└─→ Task 5 (Tests)

Task 6 (Rules engine)
└─→ Task 7 (Registry + executor)
    ├─→ Task 8 (Logging)
    │   └─→ Task 9 (Admin dashboard)
    └─→ Task 10 (Tests)

Task 11 (Memory client)
├─→ Task 12 (Vault→Memory)
│   └─→ Task 13 (Memory→Vault)
│       └─→ Task 14 (Conflict resolution)
│           └─→ Task 15 (Tests)
└─→ Task 24 (Daily notes)

All rule tasks → Task 32 (Integration testing) → Task 33 (Error handling)
All tasks → Task 34 (Performance) → Task 35 (Documentation)
```

### Success Metrics

Upon completion, verify:
- ✅ All 35 tasks completed
- ✅ Test coverage > 80% overall
- ✅ All rules execute < 2s
- ✅ Memory sync < 500ms
- ✅ Claude API success rate > 95%
- ✅ Admin dashboard functional
- ✅ Documentation complete

---

**Generated**: 2025-10-25
**Next Step**: Begin implementation starting with critical path tasks
