---
title: Agent Rules & Memory Sync - Specification
type: planning
status: pending
phase_id: PHASE-7
tags:
  - spec-kit
  - specification
  - phase-7
  - phase/phase-7
  - type/implementation
  - status/in-progress
priority: high
visual:
  icon: "\U0001F4CB"
  color: '#3B82F6'
  cssclasses:
    - type-planning
    - status-pending
    - priority-high
    - phase-7
updated: '2025-10-29T04:55:04.518Z'
version: '3.0'
keywords:
  - overview
  - key components
  - related
  - requirements
  - functional requirements
  - non-functional requirements
  - initial task breakdown
  - 'task 1: set up claude mcp client'
  - 'task 2: create agent rules engine'
  - 'task 3: implement auto-tagging rule'
---

# Agent Rules & Memory Sync - Specification

**Phase ID**: PHASE-7
**Status**: pending

---

## Overview

Phase 7 implements an **AI-powered agent rules engine** that automatically processes vault notes using Claude AI, and establishes **bidirectional memory sync** with Claude-Flow for persistent agent context across sessions.

### Key Components

1. **Agent Rules Engine** - Execute rules on file events (create, update, delete)
2. **Claude AI Integration** - Send prompts, parse responses, suggest actions
3. **Memory Sync System** - Store vault state in Claude-Flow memory
4. **Auto-Tagging Rule** - Suggest relevant tags for new notes
5. **Auto-Linking Rule** - Convert mentions to wikilinks
6. **Daily Note Rule** - Auto-populate daily note templates
7. **Meeting Note Rule** - Extract action items from meetings

---







## Related

[[specification]]
## Related

[[constitution]]
## Related

[[phase-7-agent-tasks]]
## Requirements

### Functional Requirements

#### FR-1: Agent Rules Engine
**Priority**: High | **Status**: Required

The system shall provide a rules engine that:
- Registers rules with (trigger, condition, action) pattern
- Executes rules asynchronously on file events
- Supports multiple rules per event
- Logs rule execution (success, failure, duration)
- Provides admin dashboard (GET /admin/rules)

**Acceptance Criteria**:
- Rules execute within 2s of file event
- Multiple rules can run concurrently
- Failed rules don't block other rules
- Admin dashboard shows rule status

#### FR-2: Claude AI Client
**Priority**: High | **Status**: Required

The system shall integrate with Claude AI to:
- Send prompts with system context
- Parse structured responses (JSON, lists)
- Handle rate limiting (429 errors)
- Retry failed requests (exponential backoff)
- Cache frequent prompts

**Acceptance Criteria**:
- Claude API success rate > 95%
- API latency < 3s (95th percentile)
- Rate limit retries automatic
- Error messages user-friendly

#### FR-3: Auto-Tagging
**Priority**: High | **Status**: Required

The system shall automatically suggest tags for notes:
- Trigger: Note created without tags
- Condition: Frontmatter missing `tags` field
- Action: Send content to Claude, get tag suggestions
- Result: Add `suggested_tags` to frontmatter

**Acceptance Criteria**:
- Tag suggestions relevant (80%+ accuracy)
- Suggestions appear < 5s after note creation
- User can accept/reject suggestions
- No duplicate tags suggested

#### FR-4: Auto-Linking
**Priority**: Medium | **Status**: Required

The system shall automatically convert mentions to wikilinks:
- Trigger: Note updated
- Condition: Content length > 200 characters
- Action: Detect phrases matching note titles, create wikilinks
- Result: Replace text with [[wikilink]]

**Acceptance Criteria**:
- Correct note references detected (90%+ accuracy)
- Only first mention converted (not all occurrences)
- Existing wikilinks not modified
- User notified of changes (log entry)

#### FR-5: Daily Note Automation
**Priority**: Medium | **Status**: Required

The system shall auto-populate daily notes:
- Trigger: Daily note created (YYYY-MM-DD.md pattern)
- Condition: Filename matches date pattern
- Action: Apply template, link to yesterday, add tasks section
- Result: Fully populated daily note

**Acceptance Criteria**:
- Template applied correctly
- Previous day linked
- Rollover tasks from yesterday (if available)
- Section headings consistent

#### FR-6: Meeting Note Processing
**Priority**: Low | **Status**: Optional

The system shall extract action items from meetings:
- Trigger: Note tagged with `#meeting`
- Condition: Has `attendees` frontmatter
- Action: Send to Claude, extract action items
- Result: Create linked tasks note

**Acceptance Criteria**:
- Action items extracted accurately
- Tasks note created and linked
- Meeting attendees preserved
- Due dates inferred (if mentioned)

#### FR-7: Memory Sync
**Priority**: High | **Status**: Required

The system shall sync vault to Claude-Flow memory:
- **Vault → Memory**: On note create/update, store content + metadata
- **Memory → Vault**: On Claude creates note, save to vault
- Memory keys: `vault/notes/{path}`, `vault/links/{source}->{target}`
- Sync interval: 5 seconds (configurable)

**Acceptance Criteria**:
- Memory persists across Claude sessions
- Sync completes < 500ms per operation
- No data loss during sync
- Conflict resolution (vault wins)

### Non-Functional Requirements

#### NFR-1: Performance
- Rule execution: < 2s per note
- Claude API latency: < 3s (95th percentile)
- Memory sync: < 500ms per operation
- Max concurrent rules: 5 per file event

#### NFR-2: Reliability
- Claude API success rate: > 95%
- Memory sync success rate: > 99%
- Rule execution failure rate: < 5%
- Graceful degradation when APIs unavailable

#### NFR-3: Scalability
- Support 100+ rules in registry
- Handle 1000+ notes in vault
- Process 10 file events/second
- Memory storage < 100MB per vault

#### NFR-4: Security
- API keys in .env (never committed)
- HTTPS for all API calls
- Memory namespace isolation
- No PII in Claude prompts (opt-in)

#### NFR-5: Maintainability
- TypeScript strict mode enabled
- Test coverage > 80%
- Comprehensive error handling
- Inline documentation (JSDoc)

---

## Initial Task Breakdown

_Note: This is preliminary. Run /speckit.tasks for AI-powered task generation._

### Task 1: Set up Claude MCP client
- Install `@anthropic-ai/sdk`
- Create `src/agents/claude-client.ts`
- Configure with Claude API key
- Test basic prompt/response
- **Effort**: 2 hours

### Task 2: Create agent rules engine
- Create `src/agents/rules-engine.ts`
- Define rule interface: `AgentRule { trigger, condition, action }`
- Implement rule registry and executor
- Support async rule execution
- **Effort**: 4 hours

### Task 3: Implement auto-tagging rule
- Trigger: Note created without tags
- Action: Send to Claude, parse tags, update frontmatter
- Test with sample notes
- **Effort**: 2 hours

### Task 4: Set up Claude-Flow memory integration
- Create `src/memory/claude-flow-sync.ts`
- Implement memory store/retrieve hooks
- Map vault structure → memory namespace
- **Effort**: 3 hours

### Task 5: Implement bidirectional sync
- Vault → Memory: On note create/update
- Memory → Vault: On Claude creates note
- Test sync across sessions
- **Effort**: 3 hours

### Task 6: Implement auto-linking rule
- Extract potential note references
- Search shadow cache for matches
- Ask Claude for confirmation
- Update note with wikilinks
- **Effort**: 3 hours

### Task 7: Implement daily note template rule
- Detect YYYY-MM-DD.md pattern
- Apply template, link to yesterday
- Query Claude-Flow memory for rollover tasks
- **Effort**: 2 hours

### Task 8: Implement meeting note rule
- Detect `#meeting` tag
- Extract action items via Claude
- Create tasks note, link to meeting
- **Effort**: 2 hours

### Task 9: Testing and error handling
- Create test suite for each rule
- Handle Claude API errors (rate limits, timeouts)
- Add rule execution logging
- Create admin dashboard
- **Effort**: 4 hours

**Total Effort**: 25 hours (3-4 days with buffer)

---

## Acceptance Criteria

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

### Quality
- [x] Test coverage > 80% for rule logic
- [x] Zero TypeScript errors in strict mode
- [x] All rules have error handling
- [x] Admin dashboard functional (GET /admin/rules)

---

## Out of Scope

_Items explicitly excluded from this phase:_

- Real-time collaboration (multi-user editing)
- Custom AI models (only Claude supported)
- Visual rule builder UI (code-based only)
- Workflow orchestration beyond single rules
- Advanced NLP beyond Claude capabilities
- Custom embeddings or vector search
- Integration with other AI providers
- Rule scheduling or cron jobs

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────┐
│   File Watcher (Phase 6)            │
│   Emits: add, change, unlink        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Event Processor                   │
│   - Receives file events            │
│   - Triggers rules engine           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Rules Engine                      │
│   - Evaluates conditions            │
│   - Executes actions                │
│   - Logs results                    │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│  Claude AI  │  │ Claude-Flow │
│  Client     │  │ Memory Sync │
└──────┬──────┘  └──────┬──────┘
       │                │
       └────────┬───────┘
                │
                ▼
       ┌─────────────────┐
       │ Obsidian Client │
       │ (Update Notes)  │
       └─────────────────┘
```

### Data Flow

1. **File Event** → Event Processor
2. **Evaluate Rules** → Rules Engine
3. **If Matched** → Execute Action
4. **Claude API Call** → Get AI suggestions
5. **Update Note** → Obsidian REST API
6. **Sync Memory** → Claude-Flow
7. **Log Execution** → Logging system

---

## Next Steps

1. Review and refine with `/speckit.constitution`
2. Elaborate requirements with `/speckit.specify`
3. Generate implementation plan with `/speckit.plan`
4. Break down tasks with `/speckit.tasks`
5. Begin implementation with `/speckit.implement`

---

**Generated**: 2025-10-25
**Source**: Phase planning document for PHASE-7
