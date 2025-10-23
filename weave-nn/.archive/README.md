# Archive Directory

This directory contains obsolete documentation that has been superseded by newer approaches or technologies.

**Purpose**: Preserve historical documentation for reference while keeping the main vault clean and focused on current implementations.

---

## Archive Policy

Files are archived when:
- Technology/approach has been replaced by a better alternative
- Documentation describes features that were planned but not implemented
- Implementation has evolved significantly, making old docs misleading

All archived files include:
- Archive frontmatter with date, reason, and replacement links
- Prominent archive notice at the top of the document
- Links to current/replacement documentation

---

## Archived Contents

### `/n8n-legacy/` - n8n Workflow Automation (Archived 2025-10-23)

**Files**:
- `n8n-workflow-automation.md` (merged from `features/` and `technical/`)

**Why Archived**:
The project transitioned from direct n8n integration to **Weaver (workflow.dev)** - a unified workflow proxy that dynamically routes to multiple workflow engines (n8n, Temporal, Make, Zapier) based on task requirements.

**Benefits of Weaver**:
- Workflow engine abstraction - no vendor lock-in
- Dynamic routing based on complexity and requirements
- Better error handling and retry logic
- Unified API across multiple workflow platforms
- Cost optimization through intelligent routing

**Replacement**: `docs/weaver-workflow-proxy.md`

**Historical Context**:
n8n was originally planned as the primary workflow automation engine for Weave-NN (Phase 6 MVP Week 2). However, after evaluating workflow requirements, the team recognized that different workflows have different needs:
- Simple tasks: Single agent rules (Python)
- Medium complexity: n8n visual workflows
- Complex orchestration: Temporal.io for reliability
- External integrations: Make/Zapier for 3rd party services

Rather than committing to a single engine, Weaver provides a unified proxy layer that routes workflows to the optimal engine dynamically.

---

### `/bash-hooks-legacy/` - Bash-Based Hooks System (Archived 2025-10-23)

**Files**:
- `HOOKS-README-v1.md` (originally `.claude/HOOKS-README.md`)
- `HOOKS-QUICK-REF.md` (originally `.claude/HOOKS-QUICK-REF.md`)

**Why Archived**:
The bash-based hooks system for task logging and phase documentation has been superseded by **Weaver workflow proxy** integration, which provides more robust automation capabilities.

**Limitations of Bash Hooks**:
- ⚠️ Brittle error handling (bash script failures)
- ⚠️ Limited to local execution (no distributed workflows)
- ⚠️ No retry logic or failure recovery
- ⚠️ Difficult to test and debug
- ⚠️ No visual workflow representation

**Benefits of Weaver Migration**:
- ✅ Visual workflow design (n8n/Temporal UI)
- ✅ Robust error handling with retries
- ✅ Distributed execution across multiple agents
- ✅ Workflow versioning and rollback
- ✅ Better observability and monitoring
- ✅ Integration with external systems (GitHub, Slack, etc.)

**Replacement**: `docs/weaver-workflow-proxy.md`

**Historical Context**:
The bash hooks system (v1.0 and v2.0) successfully automated task logging and phase documentation during early development. However, as requirements grew to include:
- Multi-step workflows with conditional logic
- External API integrations (GitHub issues, Slack notifications)
- Scheduled tasks (daily logs, weekly reports)
- Error recovery and retry mechanisms

The limitations of bash scripts became apparent. Weaver's unified workflow proxy provides a scalable foundation for complex automation while maintaining the simplicity of the original hooks concept.

---

## Archive Structure

```
.archive/
├── README.md (this file)
├── n8n-legacy/
│   └── n8n-workflow-automation.md
├── bash-hooks-legacy/
│   ├── HOOKS-README-v1.md
│   └── HOOKS-QUICK-REF.md
├── technical/
│   └── (other archived technical docs)
└── features/
    └── (other archived feature docs)
```

---

## Accessing Archived Documentation

**Vault Navigation**:
- All archived files include wikilinks to replacement documentation
- Use Obsidian backlinks to find files that reference archived docs
- Use `status:archived` tag search to find all archived files

**Git History**:
```bash
# View when file was archived
git log --follow -- .archive/n8n-legacy/n8n-workflow-automation.md

# View original file location history
git log --all --full-history -- "features/n8n-workflow-automation.md"
```

---

## When to Unarchive

Files should only be unarchived if:
- The replacement approach is abandoned
- Historical implementation details are needed for current work
- Archived approach is being reconsidered

**Process**:
1. Review archived file frontmatter for replacement links
2. Check if replacement still exists and is current
3. If unarchiving, update frontmatter and remove archive notices
4. Move file back to original location
5. Update any cross-references

---

## Related Documentation

- [[../docs/weaver-workflow-proxy]] - Current workflow automation approach
- [[../docs/architecture/workflow-system]] - Workflow system architecture
- [[../concept-map]] - Vault navigation and organization

---

**Last Updated**: 2025-10-23
**Maintained By**: Documentation Team
