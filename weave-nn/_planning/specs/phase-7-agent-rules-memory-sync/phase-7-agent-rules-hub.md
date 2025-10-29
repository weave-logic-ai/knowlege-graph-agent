---
title: Agent Rules & Memory Sync - Spec-Kit Workflow
type: hub
status: in-progress
phase_id: PHASE-7
tags:
  - phase/phase-7
  - type/hub
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F310"
  color: '#4A90E2'
  cssclasses:
    - hub-document
updated: '2025-10-29T04:55:03.361Z'
keywords:
  - generated specifications
  - next steps
  - 1. review constitution
  - 2. elaborate specification
  - 3. generate implementation plan
  - 4. break down tasks
  - 5. implement
  - sync tasks to vault
  - documentation
  - related documents
---
# Agent Rules & Memory Sync - Spec-Kit Workflow

## Generated Specifications

- ✅ `constitution.md` - Project principles and constraints
- ✅ `specification.md` - Detailed requirements and scope

## Next Steps

### 1. Review Constitution
```bash
# Open constitution.md in your AI coding agent (Claude Code, Copilot, etc.)
# Run: /speckit.constitution
# This will refine project principles and constraints
```

### 2. Elaborate Specification
```bash
# Open specification.md in your AI coding agent
# Run: /speckit.specify
# This will elaborate requirements and clarify scope
```

### 3. Generate Implementation Plan
```bash
# In your AI coding agent
# Run: /speckit.plan
# This will create a detailed technical implementation plan
# Output: implementation-plan.md
```

### 4. Break Down Tasks
```bash
# In your AI coding agent
# Run: /speckit.tasks
# This will generate an actionable task list
# Output: tasks.md
```

### 5. Implement
```bash
# In your AI coding agent
# Run: /speckit.implement
# This will begin implementation execution
```

## Sync Tasks to Vault

After generating tasks.md, sync back to the vault:

```bash
cd /home/aepod/dev/weave-nn/weaver
bun run sync-tasks-simple phase-7-agent-rules-memory-sync
```

## Documentation

- [Spec-Kit Integration Guide](/home/aepod/dev/weave-nn/weaver/docs/SPEC-KIT-INTEGRATION.md)
- [Phase Planning Document](/home/aepod/dev/weave-nn/weave-nn/_planning/phases/phase-7-agent-rules-memory-sync.md)
- [Weaver Documentation](/home/aepod/dev/weave-nn/weaver/weaver-implementation-hub.md)

---

**Generated**: 2025-10-25
**Phase**: PHASE-7 - Agent Rules & Memory Sync

## Related Documents

### Related Files
- [[PHASE-7-AGENT-RULES-MEMORY-SYNC-HUB.md]] - Parent hub

### Similar Content
- [[phase-5-specification-hub.md]] - Semantic similarity: 88.2%

