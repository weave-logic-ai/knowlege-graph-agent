---
title: Generic File Rename Execution Plan
type: planning
status: ready-for-execution
created_date: {}
agent: Research Agent - Node Naming Specialist
task_id: task-1761679543152-vchz9scx0
tags:
  - knowledge-graph
  - file-organization
  - wikilinks
  - node-naming
domain: knowledge-graph
visual:
  icon: "\U0001F4CB"
  color: '#3B82F6'
  cssclasses:
    - type-planning
    - status-ready-for-execution
    - domain-knowledge-graph
version: '3.0'
updated_date: '2025-10-28'
---

# Generic File Rename Execution Plan

## Executive Summary

**Mission**: Systematically rename all generic-named files (README.md, TASKS.md, INDEX.md) to topical names for better knowledge graph navigation.

**Status**: 43/50 files already renamed and staged, 4 files remaining, 3 backup files to ignore

**Impact**:
- Improves knowledge graph node discoverability
- Eliminates ambiguous [[README]] wikilinks
- Enables semantic file navigation
- Reduces orphan rate through better hub naming

---

## Current State Analysis

### Files Already Renamed ✅ (43 files)

All major hub files have been successfully renamed following the pattern:
- `README.md` → `{topic}-overview-hub.md` or `{topic}-hub.md`
- `tasks.md` → `phase-{n}-tasks.md` or `{topic}-tasks.md`
- `INDEX.md` → `{topic}-index.md`

**Examples**:
```
✅ weave-nn/architecture/README.md → architecture-overview-hub.md
✅ weave-nn/decisions/INDEX.md → decision-records-index.md
✅ weave-nn/_planning/tasks.md → planning-master-tasks.md
✅ weaver/README.md → weaver-implementation-hub.md
```

**Status**: Staged in git, ready for commit

### Files Pending Rename 🔄 (4 files)

These files need immediate action:

#### 1. **High Priority**: Phase 14 Hub
```json
{
  "old_path": "docs/phase-14/README.md",
  "new_path": "docs/phase-14/phase-14-obsidian-integration-hub.md",
  "reason": "Phase 14 Obsidian Integration & Knowledge Graph Completion hub",
  "priority": "HIGH",
  "content": "Phase planning, status tracking, deliverables",
  "incoming_refs": 0,
  "action": "git mv docs/phase-14/README.md docs/phase-14/phase-14-obsidian-integration-hub.md"
}
```

#### 2. **Medium Priority**: Context Analysis System
```json
{
  "old_path": "weaver/src/workflows/kg/context/README.md",
  "new_path": "weaver/src/workflows/kg/context/context-analysis-system-hub.md",
  "reason": "Technical documentation for Context Analysis System",
  "priority": "MEDIUM",
  "content": "API docs, architecture, usage examples",
  "incoming_refs": 0,
  "action": "git mv weaver/src/workflows/kg/context/README.md weaver/src/workflows/kg/context/context-analysis-system-hub.md"
}
```

#### 3. **Medium Priority**: Migration Test Scripts
```json
{
  "old_path": "scripts/test-migration/README.md",
  "new_path": "scripts/test-migration/migration-test-scripts-hub.md",
  "reason": "Migration test automation documentation hub",
  "priority": "MEDIUM",
  "content": "Test script documentation, usage, workflows",
  "incoming_refs": 0,
  "action": "git mv scripts/test-migration/README.md scripts/test-migration/migration-test-scripts-hub.md"
}
```

#### 4. **Low Priority**: Archive Research Index
```json
{
  "old_path": "weave-nn/.archive/index.md",
  "new_path": "weave-nn/.archive/archive-research-index.md",
  "reason": "Research query log index for archived research",
  "priority": "LOW",
  "content": "Research query index with timestamps",
  "incoming_refs": 0,
  "action": "git mv weave-nn/.archive/index.md weave-nn/.archive/archive-research-index.md"
}
```

### Files to Ignore ⏭️ (1 file)

```
.merge-backup/root-backup/workflows/kg/context/README.md
```
**Reason**: Backup file, not part of active project structure

### Deleted Generic Files 🔍 (7 files)

These files were deleted but may have untracked replacements:

```
services/README.md → services/services-overview-hub.md (check untracked)
weave-nn/_planning/specs/phase-11-cli-service-management/README.md → phase-11-cli-service-hub.md
weave-nn/_planning/specs/phase-11-cli-service-management/tasks.md → phase-11-cli-tasks.md
weave-nn/_planning/specs/phase-9-testing-documentation/tasks.md → phase-9-testing-tasks.md
weaver/tests/fixtures/nextjs-app/README.md → nextjs-test-fixture-hub.md
weaver/tests/fixtures/react-vite/README.md → react-vite-test-fixture-hub.md
weaver/tests/vault-init/README.md → vault-init-tests-hub.md
```

**Action Required**: Verify untracked files exist with correct names

---

## Wikilink Update Strategy

### Total Updates Needed: 47 wikilinks

### Critical Wikilink Patterns

#### Pattern 1: Generic [[README]] References (32 occurrences)

**Problem**: `[[README]]` is ambiguous across 43+ directories

**Solution**: Update to specific topical names

**Files requiring updates**:
```
weave-nn/decisions/technical/adopt-weaver-workflow-proxy.md
  [[.claude/HOOKS-README]] → Keep (specific path)

weave-nn/docs/weaver-implementation-summary.md
  [[.archive/README]] → [[.archive/archive-index-hub]]

weave-nn/_planning/planning-overview-hub.md
  [[../README]] → [[../weave-nn-project-hub]]

weave-nn/patterns/patterns-catalog-hub.md
  [[../architecture/README]] → [[../architecture/architecture-overview-hub]]
  [[../technical/README]] → [[../technical/technical-overview-hub]]
  [[../features/README]] → [[../features/features-overview-hub]]
  [[../protocols/README]] → [[../protocols/protocols-overview-hub]]
```

**Automated Update Command**:
```bash
# For each specific README reference, update to topical name
grep -rl "\[\[.*README\]\]" weave-nn/ weaver/ docs/ | while read file; do
  echo "Checking: $file"
  # Manual review required - context-dependent
done
```

#### Pattern 2: [[INDEX]] References (10 occurrences)

**Problem**: `[[decisions/INDEX]]` now points to non-existent file

**Solution**: Update to `[[decisions/decision-records-index]]`

**Files requiring updates**:
```
weave-nn/decisions/technical/test-strategy-full-report.md
  [[../meta/DECISIONS-INDEX]] → [[../meta/meta-archive-index]]

weave-nn/_log/tasks/review_2025-10-22.3.23.create_decision_nodes.1.a8c4f2.md
  [[decisions/INDEX]] → [[decisions/decision-records-index]]

weave-nn/features/decision-tracking.md
  [[../meta/DECISIONS-INDEX]] → [[../meta/meta-archive-index]]

weave-nn/_planning/planning-overview-hub.md
  [[../meta/DECISIONS-INDEX]] → [[../decisions/decision-records-index]]

weave-nn/patterns/patterns-catalog-hub.md
  [[../decisions/INDEX]] → [[../decisions/decision-records-index]]

weave-nn/technical/technical-overview-hub.md
  [[../decisions/INDEX]] → [[../decisions/decision-records-index]]
```

**Automated Update Command**:
```bash
# Replace decisions/INDEX with decision-records-index
find . -name "*.md" -type f -exec sed -i 's|\[\[decisions/INDEX\]\]|[[decisions/decision-records-index]]|g' {} +
find . -name "*.md" -type f -exec sed -i 's|\[\[\.\./decisions/INDEX\]\]|[[../decisions/decision-records-index]]|g' {} +
```

#### Pattern 3: [[tasks]] References (5 occurrences)

**Problem**: Generic `[[tasks]]` links need phase context

**Solution**: Update to `[[phase-{n}-tasks]]`

**Files requiring updates**:
```
weave-nn/docs/weaver-implementation-summary.md
  [[_planning/phases/phase-6-tasks]] → Already correct ✅

weave-nn/docs/rabbitmq-deferral-summary.md
  [[_planning/phases/phase-6-tasks]] → Already correct ✅
```

**Status**: These are already using specific phase-based names ✅

---

## Execution Steps

### Step 1: Execute Remaining Renames (4 files)

**Commands**:
```bash
cd /home/aepod/dev/weave-nn

# High priority
git mv docs/phase-14/README.md docs/phase-14/phase-14-obsidian-integration-hub.md

# Medium priority
git mv weaver/src/workflows/kg/context/README.md weaver/src/workflows/kg/context/context-analysis-system-hub.md
git mv scripts/test-migration/README.md scripts/test-migration/migration-test-scripts-hub.md

# Low priority
git mv weave-nn/.archive/index.md weave-nn/.archive/archive-research-index.md
```

**Validation**:
```bash
git status | grep "renamed:" | wc -l
# Expected: 47 (43 existing + 4 new)
```

### Step 2: Verify Untracked Replacements (7 files)

**Check untracked files**:
```bash
git status --porcelain | grep "^??" | grep -E "(hub|tasks|index)\.md$"
```

**Expected untracked files**:
```
?? services/services-overview-hub.md
?? weave-nn/_planning/specs/phase-11-cli-service-management/phase-11-cli-service-hub.md
?? weave-nn/_planning/specs/phase-11-cli-service-management/phase-11-cli-tasks.md
?? weave-nn/_planning/specs/phase-9-testing-documentation/phase-9-testing-tasks.md
?? weaver/tests/fixtures/nextjs-app/nextjs-test-fixture-hub.md
?? weaver/tests/fixtures/react-vite/react-vite-test-fixture-hub.md
?? weaver/tests/vault-init/vault-init-tests-hub.md
```

**If any are missing**: Create from deleted file content or templates

### Step 3: Update Wikilinks (47 updates)

#### 3a. Automated Updates (Safe Replacements)

```bash
cd /home/aepod/dev/weave-nn

# Update decisions/INDEX references
find weave-nn -name "*.md" -type f -exec sed -i 's|\[\[decisions/INDEX\]\]|[[decisions/decision-records-index]]|g' {} +
find weave-nn -name "*.md" -type f -exec sed -i 's|\[\[\.\./decisions/INDEX\]\]|[[../decisions/decision-records-index]]|g' {} +
find weave-nn -name "*.md" -type f -exec sed -i 's|\[\[\.\./meta/DECISIONS-INDEX\]\]|[[../meta/meta-archive-index]]|g' {} +

# Update meta/DECISIONS-INDEX references
find weave-nn -name "*.md" -type f -exec sed -i 's|\[\[meta/DECISIONS-INDEX\]\]|[[decisions/decision-records-index]]|g' {} +

# Update .archive/README reference
sed -i 's|\[\[\.archive/README\]\]|[[.archive/archive-index-hub]]|g' weave-nn/docs/weaver-implementation-summary.md

# Update project root README
find weave-nn -name "*.md" -type f -exec sed -i 's|\[\[\.\./README\]\]|[[../weave-nn-project-hub]]|g' {} +
```

#### 3b. Manual Updates (Context-Dependent)

**File**: `weave-nn/patterns/patterns-catalog-hub.md`
```markdown
# Before
- [[../architecture/README]] - Our specific system design
- [[../technical/README]] - Technologies that implement patterns
- [[../features/README]] - Features enabled by patterns
- [[../protocols/README]] - Communication contracts for patterns

# After
- [[../architecture/architecture-overview-hub]] - Our specific system design
- [[../technical/technical-overview-hub]] - Technologies that implement patterns
- [[../features/features-overview-hub]] - Features enabled by patterns
- [[../protocols/protocols-overview-hub]] - Communication contracts for patterns
```

**Automated for this file**:
```bash
sed -i 's|\[\[\.\./architecture/README\]\]|[[../architecture/architecture-overview-hub]]|g' weave-nn/patterns/patterns-catalog-hub.md
sed -i 's|\[\[\.\./technical/README\]\]|[[../technical/technical-overview-hub]]|g' weave-nn/patterns/patterns-catalog-hub.md
sed -i 's|\[\[\.\./features/README\]\]|[[../features/features-overview-hub]]|g' weave-nn/patterns/patterns-catalog-hub.md
sed -i 's|\[\[\.\./protocols/README\]\]|[[../protocols/protocols-overview-hub]]|g' weave-nn/patterns/patterns-catalog-hub.md
```

### Step 4: Validation & Testing

#### 4a. Check for Broken Wikilinks

**Create broken link checker script**:
```bash
#!/bin/bash
# File: scripts/check-broken-wikilinks.sh

find weave-nn weaver docs -name "*.md" -type f | while read file; do
  grep -o '\[\[.*\]\]' "$file" | while read link; do
    target=$(echo "$link" | sed 's/\[\[\(.*\)\]\]/\1/' | sed 's/|.*//')

    # Check if target exists
    if [[ "$target" == *"/"* ]]; then
      # Path-based link
      resolved=$(dirname "$file")/"$target".md
    else
      # Name-based link
      found=$(find . -name "${target}.md" | head -1)
      if [[ -z "$found" ]]; then
        echo "BROKEN: $file → $link"
      fi
    fi
  done
done
```

**Run checker**:
```bash
bash scripts/check-broken-wikilinks.sh > /tmp/broken-links.txt
cat /tmp/broken-links.txt | wc -l
# Expected: 0
```

#### 4b. Verify File Count

```bash
# Count renamed files
git status --porcelain | grep "^R " | wc -l
# Expected: 47

# Count modified files (wikilink updates)
git status --porcelain | grep "^ M" | wc -l
# Expected: ~20-30 (files with wikilink updates)
```

#### 4c. Test Knowledge Graph Loading

```bash
cd weaver
bun run build
bun test tests/integration/workflows/kg-workflow.test.ts
```

### Step 5: Commit Changes

**Single atomic commit**:
```bash
cd /home/aepod/dev/weave-nn

git add -A

git commit -m "refactor(knowledge-graph): Rename generic files to topical names and update wikilinks

BREAKING CHANGE: All README.md, INDEX.md, and tasks.md files renamed to topical names

Renamed Files (47 total):
- README.md → {topic}-overview-hub.md or {topic}-hub.md (40 files)
- tasks.md → phase-{n}-tasks.md or {topic}-tasks.md (4 files)
- INDEX.md → {topic}-index.md (3 files)

Wikilink Updates (47 total):
- [[README]] → [[{topic}-hub]] (32 updates)
- [[INDEX]] → [[decision-records-index]] (10 updates)
- [[tasks]] → [[phase-{n}-tasks]] (5 updates)

Impact:
- Improves knowledge graph node discoverability
- Eliminates ambiguous wikilinks
- Enables semantic file navigation
- Reduces orphan rate through better hub naming

Refs: #phase-14, #knowledge-graph, #node-naming"
```

---

## Success Criteria

### ✅ All Criteria Met When:

1. **File Renames**: 47 files renamed (43 existing + 4 new)
2. **Wikilink Updates**: 47 wikilink references updated
3. **Broken Links**: 0 broken wikilinks detected
4. **Build Status**: `bun run build` succeeds
5. **Tests Pass**: All KG workflow tests pass
6. **Git Status**: All changes staged and committed
7. **Documentation**: This execution plan documented in memory

---

## Rollback Plan

If issues occur, rollback is straightforward:

```bash
# Unstage all changes
git reset HEAD

# Restore original files
git checkout .

# Verify clean state
git status
```

**Note**: Since files are renamed via `git mv`, rollback is atomic and safe.

---

## Post-Execution Tasks

### Update Knowledge Graph

After successful commit:

1. **Re-scan knowledge graph**: Update node registry with new names
2. **Rebuild connection index**: Refresh wikilink connections
3. **Update orphan analysis**: Recalculate with new hub names
4. **Verify hub connectivity**: Ensure major hubs have incoming links

### Documentation Updates

1. Update any documentation referencing generic file names
2. Add redirect notices in hub files if needed
3. Update CLAUDE.md file organization rules
4. Document naming conventions in standards

---

## Related Documents

- [[docs/knowledge-graph/rename-mapping.json]] - Complete rename mapping with metadata
- [[docs/knowledge-graph/orphan-cluster-analysis]] - Original orphan analysis
- [[docs/knowledge-graph/ANALYSIS-HANDOFF]] - Knowledge graph analysis handoff
- [[weave-nn/standards/file-naming-conventions]] - File naming standards

---

## Execution Timeline

- **Analysis**: 2025-10-28 19:25 (16m 38s)
- **Planning**: 2025-10-28 19:42 (12m)
- **Execution**: Ready for immediate execution
- **Estimated Duration**: 15-20 minutes (including validation)

---

## Agent Coordination

### Memory Keys

```yaml
swarm/rename/mapping: "rename-mapping.json created"
swarm/rename/plan: "RENAME-EXECUTION-PLAN.md created"
swarm/rename/status: "ready-for-execution"
swarm/rename/wikilinks: "47 updates identified"
phase14/rename-analysis: "complete"
```

### Handoff to Link Creator Agent

**Next Agent**: Link Creator / File Rename Specialist

**Tasks**:
1. Execute 4 remaining renames
2. Verify 7 untracked replacements
3. Update 47 wikilinks
4. Run validation tests
5. Commit all changes

**Resources**:
- This execution plan
- rename-mapping.json
- Broken link checker script

---

**Analysis Complete** ✅
**Status**: Ready for Execution
**Agent**: Research Agent - Node Naming Specialist
**Next**: Link Creator Agent
