---
title: Metadata Cleanup Analysis
type: implementation
status: in-progress
phase_id: PHASE-4B
tags:
  - phase/phase-4b
  - type/implementation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4CB"
  color: '#7ED321'
  cssclasses:
    - implementation-document
updated: '2025-10-29T04:55:03.986Z'
keywords:
  - executive summary
  - frontmatter coverage analysis
  - overall statistics
  - common frontmatter fields
  - top 20 fields in use
  - tagging analysis
  - top 20 tags in use
  - tag validation issues
  - 1. placeholder tags (9 files - intentional)
  - 2. files missing tags field (5 files)
---
# Metadata Cleanup Analysis

**Created**: 2025-10-23
**Phase**: 4B - Pre-Development Planning
**Task**: Clean up metadata (YAML frontmatter, tags, schemas)

---

## Executive Summary

**Analysis Result**: Vault has good frontmatter coverage (63%) with well-defined schemas, but 83 files are missing metadata.

**Current State**:
- ✅ 144/227 files have YAML frontmatter (63% coverage)
- ✅ Standard frontmatter schema exists and is documented
- ✅ Tags are mostly consistent (no empty tags, good taxonomy)
- ⚠️ 83 files missing frontmatter (37% of vault)
- ⚠️ 9 template files have placeholder tags (intentional)
- ⚠️ 5 integration files missing tags field
- ⚠️ Recently created README files (Phase 4B) missing frontmatter

**Recommendation**: **Add minimal frontmatter to high-priority files** (README files, integrations, guides) to improve discoverability and graph view visualization.

---

## Frontmatter Coverage Analysis

### Overall Statistics

- **Total markdown files**: 227 (excluding `.archive/`)
- **Files with frontmatter**: 144 (63%)
- **Files missing frontmatter**: 83 (37%)

**Assessment**: 63% coverage is acceptable for a knowledge vault, but high-traffic files should have frontmatter for better Obsidian integration.

---

## Common Frontmatter Fields

### Top 20 Fields in Use

```
 139  tags                  # Most common - good!
 133  status                # Lifecycle tracking
  94  type                  # Node type classification
  84  created_date          # Creation timestamp
  69  priority              # Task/decision priority
  66  category              # Categorization
  39  title                 # Display title
  33  related_decisions     # Decision linking
  33  related               # General linking
  28  complexity            # Complexity level
  22  cssclasses            # Obsidian styling
  22  created               # Creation timestamp (variant)
  21  visual                # Visual properties
  20  updated_date          # Last update timestamp
  19  related_concepts      # Concept linking
  19  dependencies          # Task dependencies
  18  last_updated          # Last update (variant)
  16  scope                 # Scope definition
  14  maturity              # Maturity level
  13  decision_id           # Decision identifier
```

**Assessment**: ✅ **Excellent field consistency** - Top fields align with documented standards in `workflows/obsidian-properties-standard.md`

---

## Tagging Analysis

### Top 20 Tags in Use

```
  19  architecture          # System design
  18  scope/mvp             # MVP scope indicator
  16  technical             # Technical docs
  16  mvp                   # MVP-related
  10  mcp                   # MCP protocol
  10  planning              # Planning docs
  10  workflow              # Workflow docs
   9  priority/critical     # Critical priority
   8  knowledge-graph       # Graph-related
   8  automation            # Automation topics
   7  [category]            # Placeholder (templates)
   7  feature               # Feature docs
   6  decision              # Decision records
   6  visualization         # Visualization
   6  integration           # Integrations
   6  documentation         # Docs
   6  priority/high         # High priority
   6  phase                 # Phase tracking
   5  obsidian              # Obsidian-specific
   5  status/active         # Active status
```

**Tag Taxonomy Observations**:
- ✅ Good use of hierarchical tags (`scope/mvp`, `priority/critical`, `status/active`)
- ✅ Consistent domain tagging (`architecture`, `technical`, `mcp`)
- ✅ Status tracking via tags (`priority/*`, `status/*`)
- ⚠️ 7 instances of `[category]` placeholder (all in `/templates/` - intentional)

**Assessment**: ✅ **Excellent tag consistency** - Well-structured taxonomy with hierarchical organization

---

## Tag Validation Issues

### 1. Placeholder Tags (9 files - INTENTIONAL)

**All in `/templates/` directory**:
```
templates/planning-node-template.md: [category], [status]
templates/platform-node-template.md: [category], [primary-tech], [use-case]
templates/research-note.md: [research_type], [domain], [status]
templates/concept-node-template.md: [primary-category], [specific-topic]
templates/question-node-template.md: [category], [domain], [status]
templates/feature-node-template.md: [category], [release], [primary-capability]
templates/workflow-node-template.md: [category], [domain]
templates/technical-node-template.md: [category], [language], [use-case]
templates/decision-node-template.md: [category], [status], [domain]
```

**Assessment**: ✅ **INTENTIONAL** - These are templates meant to have placeholders. No action needed.

### 2. Files Missing Tags Field (5 files)

**Integration files**:
```
integrations/ai/weaver-mcp-claude.md
integrations/version-control/git-weaver-workflows.md
integrations/workflow-automation/file-watcher-workflows.md
integrations/obsidian/obsidian-weaver-mcp.md
guides/cognitive-variability-tracking.md
```

**Assessment**: ⚠️ **SHOULD FIX** - Integration and guide files should have tags for discoverability

### 3. Empty Tags (0 files)

**Assessment**: ✅ **EXCELLENT** - No files with empty tags field

---

## Files Missing Frontmatter (83 files)

### Priority 1: High-Traffic Files (15 files)

**README files** (recently created in Phase 4B):
```
README.md (vault root)
architecture/README.md
concepts/README.md
business/README.md
workflows/README.md
docs/README.md
standards/README.md
integrations/README.md
guides/README.md
services/README.md
```

**Decision files** (important for tracking):
```
decisions/technical/web-framework-choice.md
decisions/technical/git-library-choice.md
decisions/technical/sqlite-library-choice.md
decisions/technical/testing-framework-choice.md
```

**Other high-traffic**:
```
architecture/multi-project-ai-platform.md
```

**Assessment**: ⚠️ **SHOULD FIX** - These are navigation hubs and critical decision docs

### Priority 2: Documentation Files (20+ files)

**Guides, examples, queries**:
- Various guide subdirectories (deployment/, development/, operations/, setup/, troubleshooting/)
- Example files
- Query files

**Assessment**: **NICE TO HAVE** - Low traffic but would benefit from metadata

### Priority 3: System/Meta Files (40+ files)

**System directories**:
- `_planning/`, `_log/`, `_files/`, etc.
- Internal tracking documents
- Temporary files

**Assessment**: **OPTIONAL** - System files don't require public-facing metadata

---

## Recommended Frontmatter Schemas

### For README Files (Navigation Hubs)

```yaml
---
type: index
title: "[Directory Name] Hub"
status: active
created_date: "2025-10-23"
cssclasses:
  - index
  - navigation

tags:
  - index
  - [domain]
  - navigation
---
```

**Example for `architecture/README.md`**:
```yaml
---
type: index
title: "Architecture Documentation Hub"
status: active
created_date: "2025-10-23"
cssclasses:
  - index
  - navigation
  - architecture

tags:
  - index
  - architecture
  - navigation
  - documentation
---
```

### For Integration Files

```yaml
---
type: integration
integration_type: "[ai|version-control|workflow-automation|obsidian]"
status: active
created_date: "YYYY-MM-DD"
cssclasses:
  - integration

tags:
  - integration
  - [integration_type]
  - [specific-tool]
---
```

**Example for `integrations/ai/weaver-mcp-claude.md`**:
```yaml
---
type: integration
integration_type: ai
status: active
created_date: "2025-10-20"
cssclasses:
  - integration
  - ai

tags:
  - integration
  - ai
  - mcp
  - claude
  - weaver
---
```

### For Decision Files (Without Frontmatter)

```yaml
---
type: decision
decision_id: "D-XXX"
status: decided
priority: high
category: technical
created_date: "YYYY-MM-DD"
cssclasses:
  - decision
  - technical

tags:
  - decision
  - technical
  - [specific-domain]
---
```

**Example for `decisions/technical/web-framework-choice.md`**:
```yaml
---
type: decision
decision_id: "D-004"
status: decided
priority: critical
category: technical
created_date: "2025-10-20"
cssclasses:
  - decision
  - technical

tags:
  - decision
  - technical
  - web-framework
  - mvp
---
```

---

## Implementation Plan

### Phase 1: High-Priority Files (Immediate - 15 files)

**Add frontmatter to**:
1. ✅ 10 README files (navigation hubs)
2. ✅ 4 decision files (critical tracking)
3. ✅ 1 architecture file (multi-project vision)

**Estimated Time**: 30 minutes (2 minutes per file)

**Template**: Use "README Files" and "Decision Files" schemas above

### Phase 2: Integration & Guide Files (Later - 5 files)

**Add frontmatter to**:
- 4 integration files
- 1 guide file

**Estimated Time**: 10 minutes (2 minutes per file)

**Template**: Use "Integration Files" schema above

### Phase 3: Documentation Files (Optional - 20+ files)

**Add frontmatter to**:
- Guide subdirectories
- Example files
- Query files

**Estimated Time**: 40 minutes (2 minutes per file)

---

## Validation Checklist

- [x] Analyzed frontmatter coverage (144/227 files = 63%)
- [x] Identified common frontmatter fields (20 top fields)
- [x] Analyzed tag taxonomy (20 top tags, hierarchical structure)
- [x] Validated tag consistency (no empty tags, 9 intentional placeholders)
- [x] Identified files missing frontmatter (83 files, categorized by priority)
- [x] Created frontmatter schemas for README, integration, and decision files
- [x] Estimated implementation time (Phase 1: 30min, Phase 2: 10min, Phase 3: 40min)

---

## Recommended Action

### Execute Phase 1: Add Frontmatter to 15 High-Priority Files

**Rationale**:
- README files are navigation hubs (high traffic, high value)
- Decision files track critical project decisions (must be discoverable)
- 30 minutes total effort
- Immediate improvement to graph view and Obsidian search

**Files to Update**:
```
README.md
architecture/README.md
concepts/README.md
business/README.md
workflows/README.md
docs/README.md
standards/README.md
integrations/README.md
guides/README.md
services/README.md
decisions/technical/web-framework-choice.md
decisions/technical/git-library-choice.md
decisions/technical/sqlite-library-choice.md
decisions/technical/testing-framework-choice.md
architecture/multi-project-ai-platform.md
```

**Action**: Add minimal frontmatter using schemas above

---

## Success Metrics

### Coverage Improvements

**Before**:
- 144/227 files with frontmatter (63%)
- 83 files missing metadata
- 0/10 README files with frontmatter

**After Phase 1**:
- 159/227 files with frontmatter (70%)
- 68 files missing metadata
- 10/10 README files with frontmatter
- 4/4 critical decision files with frontmatter

**After Phase 2**:
- 164/227 files with frontmatter (72%)
- 63 files missing metadata

---

## Related Documentation

- `/weave-nn/workflows/obsidian-properties-standard.md` - Official property standard
- `/weave-nn/workflows/obsidian-properties-groups.md` - Property grouping
- `/weave-nn/templates/` - All node templates with frontmatter examples
- `/weave-nn/_planning/phases/phase-4b-pre-development-mvp-planning-sprint.md` - Phase 4B tasks

---

**Last Updated**: 2025-10-23
**Coverage**: 144/227 files (63%) → Target: 159/227 (70% after Phase 1)
**Recommendation**: Add frontmatter to 15 high-priority files (30 minutes effort)
**Status**: Analysis complete, ready for implementation
