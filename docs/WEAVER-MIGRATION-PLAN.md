---
title: Weaver Phase 12 Migration Plan
type: planning
status: pending
created_date: {}
tags:
  - weaver
  - migration
  - phase-12
  - refactoring
priority: critical
domain: weaver
visual:
  icon: "\U0001F4CB"
  color: '#3B82F6'
  cssclasses:
    - type-planning
    - status-pending
    - priority-critical
    - domain-weaver
version: '3.0'
updated_date: '2025-10-28'
---

# Weaver Phase 12 Migration Plan

**Objective**: Migrate and merge Phase 12 implementation from `/weave-nn/weaver/` into main `/weaver/` directory

---

## 🎯 Situation Analysis

### Problem
Phase 12 accidentally created implementation in `/weave-nn/weaver/` when the correct location with subsequent development is `/weaver/`.

### Impact
- Duplicate code structures
- Risk of losing Phase 12 improvements
- Confusion about canonical source location
- Potential merge conflicts

---

## 📊 Directory Comparison

### `/weave-nn/weaver/` (Phase 12 - Misplaced)
**Unique/Enhanced Components**:
```
src/
├── chunking/                    # Multi-strategy chunking (Phase 12)
│   ├── plugins/                 # 4 chunking strategies
│   ├── utils/                   # Similarity, tokenizer, boundary detection
│   └── strategy-selector.ts
├── reasoning/                   # Enhanced reasoning (Phase 12)
│   ├── self-consistent-cot.ts  # CoT templates
│   ├── tree-of-thought.ts      # Multi-path reasoning
│   └── template-manager.ts
├── execution/                   # New in Phase 12
│   ├── error-recovery.ts
│   └── state-verifier.ts
├── reflection/                  # New in Phase 12
├── embeddings/                  # Enhanced embeddings
│   ├── batch-processor.ts      # New
│   ├── storage/                # New vector storage
│   └── models/                 # Model manager
├── integration/                 # New unified memory
│   └── unified-memory.ts
├── workflows/learning-loop/     # Complete learning loop workflows
└── agents/                      # Planning expert, error detector
```

**Documentation**:
```
docs/
├── PHASE-12-*.md               # All Phase 12 docs
├── COT-TEMPLATES-*.md
├── EMBEDDINGS-*.md
├── EXPERIENCE-INDEXING-*.md
└── CHUNKING-*.md
```

### `/weaver/` (Main - Correct Location)
**Existing Components**:
```
src/
├── embeddings/                  # Basic embeddings
├── learning-loop/               # Basic learning loop
├── perception/                  # Web scraper, search API
├── spec-generator/              # Task generator
├── workflow-engine/             # Workflow orchestration
├── workflows/
│   └── kg/                     # Knowledge graph workflows
├── cli/                        # CLI system
├── mcp-server/                 # MCP server
├── file-watcher/               # File monitoring
├── rules-engine/               # Rule processing
├── shadow-cache/               # SQLite cache
├── service-manager/            # Service management
└── vault-init/                 # Vault initialization
```

---

## 🔄 Migration Strategy

### Phase 1: Analysis & Planning ✅ (Current)

- [x] Compare directory structures
- [x] Identify unique components in Phase 12
- [x] Identify overlapping components
- [x] Create migration plan
- [ ] Review with oracle for validation

### Phase 2: Backup & Safety

```bash
# Create backup of main weaver directory
tar -czf weaver-backup-$(date +%Y%m%d).tar.gz weaver/

# Create backup of Phase 12 directory
tar -czf weave-nn-weaver-backup-$(date +%Y%m%d).tar.gz weave-nn/weaver/

# Create git safety branch
cd weaver/
git checkout -b pre-phase12-migration
git add .
git commit -m "Backup before Phase 12 migration"
git checkout main
git checkout -b phase12-migration
```

### Phase 3: Component-by-Component Migration

#### 3.1 Chunking System (NEW - Full Migration)
```bash
# Phase 12 has complete chunking, /weaver/ has none
mkdir -p weaver/src/chunking
cp -r weave-nn/weaver/src/chunking/* weaver/src/chunking/

# Verify imports and dependencies
cd weaver/
npm run build
```

**Action**: COPY entire chunking/ directory
**Risk**: Low (new component)
**Tests**: Run chunking tests after migration

#### 3.2 Reasoning System (ENHANCED - Merge)
```bash
# Compare implementations
diff -r weaver/src/learning-loop/reflection.ts weave-nn/weaver/src/reasoning/

# Phase 12 has enhanced CoT templates and multi-path reasoning
# Main has basic reflection
```

**Action**: 
1. Keep Phase 12 enhanced reasoning/
2. Migrate main's basic reflection.ts into Phase 12 structure
3. Update imports in learning-loop

**Risk**: Medium (merge complexity)
**Tests**: Run reasoning + learning-loop tests

#### 3.3 Execution System (NEW - Full Migration)
```bash
# Phase 12 added execution/ with error recovery
mkdir -p weaver/src/execution
cp -r weave-nn/weaver/src/execution/* weaver/src/execution/
```

**Action**: COPY entire execution/ directory
**Risk**: Low (new component)

#### 3.4 Reflection System (NEW - Full Migration)
```bash
# Phase 12 added reflection/ module
mkdir -p weaver/src/reflection
cp -r weave-nn/weaver/src/reflection/* weaver/src/reflection/
```

**Action**: COPY entire reflection/ directory
**Risk**: Low (new component)

#### 3.5 Embeddings (ENHANCED - Careful Merge)
```bash
# Compare implementations
diff -r weaver/src/embeddings/ weave-nn/weaver/src/embeddings/

# Main has: 5 files (basic implementation)
# Phase 12 has: 3+ files with batch-processor, vector storage, model manager
```

**Action**:
1. Review both implementations
2. If Phase 12 is superset: REPLACE
3. If main has unique features: MERGE carefully
4. Update all dependent code

**Risk**: HIGH (core component)
**Tests**: Run full embedding test suite

#### 3.6 Integration/Unified Memory (NEW - Full Migration)
```bash
mkdir -p weaver/src/integration
cp -r weave-nn/weaver/src/integration/* weaver/src/integration/
```

**Action**: COPY entire integration/ directory
**Risk**: Low (new component)

#### 3.7 Workflows/Learning-Loop (NEW - Full Migration)
```bash
# Phase 12 has complete learning-loop workflows
mkdir -p weaver/src/workflows/learning-loop
cp -r weave-nn/weaver/src/workflows/learning-loop/* weaver/src/workflows/learning-loop/

# Merge top-level workflow files
# Main has: kg/, example-workflows, proof-workflows, spec-kit-workflow
# Phase 12 has: learning-loop-workflows, vector-db-workflows, experience-integration
```

**Action**: 
1. COPY learning-loop/ subfolder
2. MERGE top-level workflow files (preserve both)
3. Update register-workflows.ts to include both

**Risk**: Medium (integration points)

#### 3.8 Agents (NEW - Full Migration)
```bash
mkdir -p weaver/src/agents
cp -r weave-nn/weaver/src/agents/* weaver/src/agents/
```

**Action**: COPY entire agents/ directory
**Risk**: Low (new component)

### Phase 4: Documentation Migration

```bash
# Copy all Phase 12 documentation
cp -r weave-nn/weaver/docs/PHASE-12-*.md weaver/docs/
cp -r weave-nn/weaver/docs/COT-*.md weaver/docs/
cp -r weave-nn/weaver/docs/EMBEDDINGS-*.md weaver/docs/
cp -r weave-nn/weaver/docs/EXPERIENCE-*.md weaver/docs/
cp -r weave-nn/weaver/docs/CHUNKING-*.md weaver/docs/

# Copy status files
cp weave-nn/weaver/.cot-templates-status.md weaver/
cp weave-nn/weaver/.embeddings-status.md weaver/
cp weave-nn/weaver/.experience-indexing-status.md weaver/
cp weave-nn/weaver/.test-status.md weaver/

# Update WEAVER-IMPLEMENTATION-HUB.md
cp weave-nn/weaver/WEAVER-IMPLEMENTATION-HUB.md weaver/
```

### Phase 5: Templates Migration

```bash
# Compare template directories
diff -r weaver/templates/ weave-nn/weaver/templates/

# Merge templates (Phase 12 likely has learning-loop templates)
cp -r weave-nn/weaver/templates/learning-loop weaver/templates/
```

### Phase 6: Tests Migration

```bash
# Copy all Phase 12 tests
mkdir -p weaver/tests/chunking
mkdir -p weaver/tests/learning-loop
mkdir -p weaver/tests/integration

cp -r weave-nn/weaver/tests/* weaver/tests/

# Update test paths and imports
find weaver/tests -name "*.ts" -exec sed -i 's|../../src|../src|g' {} \;
```

### Phase 7: Configuration & Dependencies

```bash
# Compare package.json
diff weaver/package.json weave-nn/weaver/package.json

# Merge dependencies (prefer Phase 12's versions for new components)
# Update manually - don't overwrite blindly
```

**Action**:
1. Review both package.json files
2. Add any missing dependencies from Phase 12
3. Keep main's existing dependencies
4. Resolve version conflicts (prefer newer compatible versions)

---

## 🧪 Testing Strategy

### After Each Component Migration

```bash
# 1. Type check
npm run type-check

# 2. Build
npm run build

# 3. Run component tests
npm run test -- <component-name>

# 4. Run integration tests
npm run test:integration
```

### Full System Test

```bash
# After all migrations complete
npm run test                    # All tests
npm run test:coverage          # Coverage report
npm run build                  # Production build
```

---

## 🚨 Risk Mitigation

### High-Risk Components
1. **Embeddings** - Core component, many dependents
2. **Learning Loop** - Integration with multiple systems
3. **Workflows** - Multiple integration points

### Mitigation Strategy
1. **Oracle Review**: Use oracle to review merge strategy for high-risk components
2. **Incremental Testing**: Test after each component migration
3. **Git Safety**: Maintain migration branch separate from main
4. **Rollback Plan**: Keep backups, can cherry-pick if needed

---

## 📋 Execution Checklist

### Pre-Migration
- [ ] Review this plan with oracle
- [ ] Create backups (tar.gz)
- [ ] Create git safety branches
- [ ] Document current main weaver/ state
- [ ] Run full test suite on main (baseline)

### Migration Execution
- [ ] Phase 1: Analysis ✅
- [ ] Phase 2: Backup & Safety
- [ ] Phase 3.1: Chunking (new)
- [ ] Phase 3.2: Reasoning (merge)
- [ ] Phase 3.3: Execution (new)
- [ ] Phase 3.4: Reflection (new)
- [ ] Phase 3.5: Embeddings (careful merge) ⚠️
- [ ] Phase 3.6: Integration (new)
- [ ] Phase 3.7: Workflows (merge)
- [ ] Phase 3.8: Agents (new)
- [ ] Phase 4: Documentation
- [ ] Phase 5: Templates
- [ ] Phase 6: Tests
- [ ] Phase 7: Dependencies

### Post-Migration
- [ ] Full type check passes
- [ ] Full build succeeds
- [ ] All tests pass
- [ ] Coverage >= 85%
- [ ] Update main WEAVER-IMPLEMENTATION-HUB.md
- [ ] Git commit migration
- [ ] Create PR for review
- [ ] Merge to main after approval
- [ ] Archive /weave-nn/weaver/ (don't delete yet)

---

## 📊 Success Criteria

- ✅ All Phase 12 code integrated into `/weaver/`
- ✅ No functionality lost from main `/weaver/`
- ✅ All tests passing (>85% coverage)
- ✅ Clean build with no errors
- ✅ Documentation updated
- ✅ Templates migrated
- ✅ Clear rollback path maintained

---

## 🔗 Related Documents

- [[weaver/WEAVER-IMPLEMENTATION-HUB|Main Weaver Hub]]
- [[weave-nn/weaver/WEAVER-IMPLEMENTATION-HUB|Phase 12 Hub]]
- [[weave-nn/weaver/docs/PHASE-12-FINAL-SUMMARY|Phase 12 Summary]]
- [[_planning/phases/phase-0-pre-development-work|Phase 0 Planning]]

---

**Status**: Planning Complete - Ready for Oracle Review
**Next Step**: Consult oracle for validation of merge strategy
**Timeline**: 2-3 days (with careful testing)
