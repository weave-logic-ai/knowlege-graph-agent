---
spec_type: constitution
phase_id: PHASE-7
phase_name: Agent Rules & Memory Sync
status: pending
priority: high
duration: 2-3 days
generated_date: '2025-10-25'
tags:
  - spec-kit
  - constitution
  - phase-7
  - agent-rules
  - memory-sync
type: planning
visual:
  icon: 📋
  color: '#3B82F6'
  cssclasses:
    - type-planning
    - status-pending
    - priority-high
    - phase-7
version: '3.0'
updated_date: '2025-10-28'
icon: 📋
---

# Agent Rules & Memory Sync - Constitution

**Phase ID**: PHASE-7
**Status**: pending
**Priority**: high
**Duration**: 2-3 days

---

## Project Principles

### 1. AI-Powered Automation
- Leverage Claude AI for intelligent note processing
- Automate repetitive tasks (tagging, linking, formatting)
- Maintain human control over critical decisions
- Provide opt-in automation (users enable rules)

### 2. Bidirectional Sync
- Vault changes reflect in Claude-Flow memory
- Claude actions persist back to vault
- Maintain single source of truth (vault is authoritative)
- Enable cross-session context retention

### 3. Rule-Based Architecture
- Declarative rule definitions (trigger, condition, action)
- Extensible rule system (easy to add new rules)
- Safe execution (fail gracefully, rollback on errors)
- Observable behavior (logging, admin dashboard)

### 4. Performance & Reliability
- Rules execute within 2 seconds of file events
- Claude API calls < 5% error rate
- Memory sync < 500ms per operation
- Graceful degradation when APIs unavailable

### 5. User Experience
- Non-intrusive automation (background processing)
- Clear visibility into rule execution (logs, UI)
- Easy configuration (enable/disable rules)
- Predictable behavior (consistent results)

---









## Related

[[specification]]
## Related

[[constitution]]
## Related

[[phase-7-agent-rules-memory-sync]]
## Related

[[phase-7-agent-tasks]]
## Technical Constraints

### Integration Requirements
- **Phase 6 Dependency**: File watcher must emit events
- **Claude API**: Requires valid ANTHROPIC_API_KEY
- **Claude-Flow**: Optional but recommended for memory
- **Obsidian REST API**: Must be running (port 27124)

### Performance Constraints
- Rule execution: < 2s per note
- Claude API latency: < 3s (95th percentile)
- Memory sync: < 500ms per operation
- Max concurrent rules: 5 per file event

### Quality Constraints
- TypeScript strict mode enabled
- Test coverage > 80% for rule logic
- Error handling for all Claude API calls
- Comprehensive logging (debug, info, warn, error)

### Security Constraints
- API keys stored in .env (never committed)
- Vault content encrypted in transit (HTTPS)
- Memory namespace isolation (per-vault)
- No PII in Claude prompts without consent

---

## Success Criteria

### Functional
- ✅ Auto-tagging suggests relevant tags (80%+ accuracy)
- ✅ Auto-linking detects correct note references
- ✅ Daily notes populate with template automatically
- ✅ Meeting notes generate action item lists
- ✅ Memory persists across Claude sessions

### Performance
- ✅ Rules execute < 2s after file event
- ✅ Claude API success rate > 95%
- ✅ Memory sync completes < 500ms
- ✅ Zero data loss during sync

### Quality
- ✅ 80%+ test coverage for rules engine
- ✅ Zero TypeScript errors
- ✅ All rules have error handling
- ✅ Admin dashboard shows rule status

### User Experience
- ✅ Users can enable/disable rules easily
- ✅ Rule execution is observable (logs/UI)
- ✅ Automation feels helpful (not intrusive)
- ✅ Clear documentation for each rule

---

## Quality Standards

All code must meet Weave-NN quality standards:

```bash
# Type checking
bun run typecheck  # Must pass with 0 errors

# Linting
bun run lint       # Must pass with 0 errors

# Testing
bun run test       # Must pass with 80%+ coverage

# Build
bun run build      # Must complete successfully
```

---

## Out of Scope

The following are explicitly excluded from Phase 7:

- ❌ Real-time collaboration (multi-user editing)
- ❌ Custom AI models (only Claude supported)
- ❌ Visual rule builder UI (code-based only)
- ❌ Workflow orchestration beyond single rules
- ❌ Advanced NLP beyond Claude capabilities

---

## Dependencies

### npm Packages
```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0"
  }
}
```

### External Services
- **Claude API**: Commercial API (pay-per-use)
- **Claude-Flow**: Open source (optional)
- **Obsidian REST API**: Local server (free)

### Phase Dependencies
- **Requires**: Phase 6 (file watcher, shadow cache)
- **Enables**: Phase 8 (git automation)

---

**Generated**: 2025-10-25
**Source**: Phase planning document for PHASE-7
