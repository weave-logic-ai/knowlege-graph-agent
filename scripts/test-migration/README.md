---
title: Migration Test Scripts
type: testing
status: active
created_date: {}
tags:
  - testing
  - migration
  - automation
  - validation
visual:
  icon: ✅
  color: '#EF4444'
  cssclasses:
    - type-testing
    - status-active
version: '3.0'
updated_date: '2025-10-28'
---

# Migration Test Scripts

Automated validation scripts for Phase 12 weaver migration.

## 📁 Scripts Overview

### 01-capture-baseline.sh
**Purpose**: Capture complete baseline state before migration

**What it captures**:
- File inventory (source files, tests, lines of code)
- Dependency tree
- Type check results
- Build results
- Test results
- Performance metrics
- Coverage report

**Usage**:
```bash
cd /home/aepod/dev/weave-nn
./scripts/test-migration/01-capture-baseline.sh
```

**Output**: `.migration/baseline/` directory with complete baseline

**When to run**: Once, before starting migration

---

### 02-validate-component.sh
**Purpose**: Validate individual component migration

**What it validates**:
- Component exists in Phase 12
- Type check passes with component
- Build succeeds with component
- Component tests pass
- No import errors
- No circular dependencies

**Usage**:
```bash
./scripts/test-migration/02-validate-component.sh <component-name>
```

**Available components**:
- `chunking`
- `reasoning`
- `execution`
- `reflection`
- `embeddings`
- `integration`
- `learning-loop`
- `workflows`
- `agents`

**Output**: `.migration/validation/<component>/` with validation report

**When to run**: After each component migration

**Example**:
```bash
# Validate chunking component
./scripts/test-migration/02-validate-component.sh chunking

# Expected output:
# ✅ VALIDATION PASSED
# Component 'chunking' is ready for migration
```

---

### 03-validate-integration.sh
**Purpose**: Validate complete system integration

**What it validates**:
- Full type check
- Complete build
- All tests
- All components present
- No circular dependencies
- Performance comparison to baseline
- Coverage (in --full mode)
- Import resolution

**Usage**:
```bash
# Quick validation
./scripts/test-migration/03-validate-integration.sh

# Full validation (includes coverage)
./scripts/test-migration/03-validate-integration.sh --full
```

**Output**: `.migration/integration/` with integration report

**When to run**: After all components migrated

---

### 04-rollback-check.sh
**Purpose**: Automated rollback decision

**What it checks**:
- Build failures (CRITICAL)
- Type check failures (CRITICAL)
- Import errors (CRITICAL)
- Circular dependencies (CRITICAL)
- >15% performance degradation (HIGH)
- >10% test failure rate (HIGH)
- <80% coverage (MEDIUM)

**Usage**:
```bash
./scripts/test-migration/04-rollback-check.sh
```

**Output**: `.migration/rollback/` with decision report

**When to run**: After integration validation

**Exit codes**:
- `0` - Safe to proceed
- `1` - Rollback required

---

## 🔄 Complete Migration Workflow

### Step 1: Capture Baseline
```bash
./scripts/test-migration/01-capture-baseline.sh
```

### Step 2: Validate Each Component
```bash
# Low risk components first
for component in chunking execution reflection agents; do
  ./scripts/test-migration/02-validate-component.sh $component
  if [ $? -ne 0 ]; then
    echo "Component $component failed validation"
    exit 1
  fi
done

# Medium risk components
for component in reasoning integration; do
  ./scripts/test-migration/02-validate-component.sh $component
  if [ $? -ne 0 ]; then
    echo "Component $component failed validation"
    exit 1
  fi
done

# High risk components (extra careful)
for component in embeddings learning-loop workflows; do
  ./scripts/test-migration/02-validate-component.sh $component
  if [ $? -ne 0 ]; then
    echo "Component $component failed validation"
    exit 1
  fi
done
```

### Step 3: Validate Integration
```bash
./scripts/test-migration/03-validate-integration.sh --full
```

### Step 4: Check Rollback Decision
```bash
./scripts/test-migration/04-rollback-check.sh

if [ $? -eq 0 ]; then
  echo "✅ Migration successful - safe to proceed"
else
  echo "❌ Rollback required - fix issues and retry"
fi
```

---

## 📊 Output Directories

```
.migration/
├── baseline/              # Baseline capture (Step 1)
│   ├── tests/
│   ├── performance/
│   ├── coverage/
│   ├── inventory/
│   └── BASELINE-REPORT.md
│
├── validation/            # Component validations (Step 2)
│   ├── chunking/
│   │   ├── typecheck.log
│   │   ├── build.log
│   │   ├── test.log
│   │   └── VALIDATION-REPORT.md
│   ├── reasoning/
│   └── ... (one per component)
│
├── integration/           # Integration validation (Step 3)
│   ├── typecheck.log
│   ├── build.log
│   ├── test-run.log
│   ├── coverage.log
│   ├── performance-comparison.json
│   └── INTEGRATION-REPORT.md
│
└── rollback/              # Rollback decision (Step 4)
    └── ROLLBACK-DECISION.md
```

---

## 🚨 Rollback Triggers

### CRITICAL (Automatic Rollback)
1. Build failure
2. Type check failure
3. Import resolution failures
4. Circular dependencies

### HIGH (Review + Likely Rollback)
1. >15% performance degradation
2. >10% test failure rate
3. Multiple component validation failures

### MEDIUM (Investigate)
1. Coverage below 80%
2. 5-15% performance degradation
3. Minor test failures (<5%)

---

## 🎯 Success Criteria

Migration is successful when:
- ✅ All component validations pass
- ✅ Integration validation passes
- ✅ Type check: 0 errors
- ✅ Build: 0 errors
- ✅ Import errors: 0
- ✅ Circular dependencies: 0
- ✅ Performance degradation: <5%
- ✅ Test failure rate: <5%
- ✅ Coverage: >85%

---

## 🔧 Dependencies

Required tools:
- `npm` or `bun` - Package manager
- `jq` - JSON parsing
- `bc` - Math calculations
- `madge` (optional) - Circular dependency detection

Install missing tools:
```bash
# macOS
brew install jq bc

# Ubuntu/Debian
sudo apt-get install jq bc

# madge (optional)
npm install -g madge
```

---

## 📝 Example Output

### Successful Component Validation
```
╔════════════════════════════════════════════════════════════════╗
║          Component Migration Validator                        ║
║          Component: chunking
╚════════════════════════════════════════════════════════════════╝

[INFO] Step 1: Checking component exists in Phase 12...
[SUCCESS] Component found in Phase 12
  Phase 12 has 15 files for chunking

[INFO] Step 2: Checking if component exists in main weaver...
[INFO] Component does not exist in main weaver (clean migration)

[INFO] Step 3: Copying component to main weaver (for validation)...
[SUCCESS] Component copied

[INFO] Step 4: Copying component tests...
[SUCCESS] Tests copied

[INFO] Step 5: Running type check...
[SUCCESS] Type check passed ✓

[INFO] Step 6: Running build...
[SUCCESS] Build passed ✓

[INFO] Step 7: Running component tests...
[SUCCESS] Component tests passed ✓

[INFO] Step 8: Checking for import errors...
[SUCCESS] No import errors detected ✓

[INFO] Step 9: Checking for circular dependencies...
[SUCCESS] No circular dependencies ✓

[INFO] Step 10: Generating validation report...
[SUCCESS] Validation report generated

[INFO] Step 11: Rolling back temporary changes...
[SUCCESS] Temporary changes rolled back

╔════════════════════════════════════════════════════════════════╗
║          Validation Complete: chunking
╚════════════════════════════════════════════════════════════════╝

✅ VALIDATION PASSED

Component 'chunking' is ready for migration

Summary:
  - Type check: ✓ (3s)
  - Build: ✓ (8s)
  - Tests: ✓ (2s)
  - Import errors: 0

Next step: Permanently migrate this component
```

### Failed Validation
```
╔════════════════════════════════════════════════════════════════╗
║          Component Migration Validator                        ║
║          Component: embeddings
╚════════════════════════════════════════════════════════════════╝

...

[ERROR] Type check failed ✗

[ERROR] First 20 lines of type errors:
src/embeddings/batch-processor.ts:45:12 - error TS2304: Cannot find name 'ModelManager'
src/embeddings/storage/vector-db.ts:23:8 - error TS2307: Cannot find module '@xenova/transformers'
...

❌ VALIDATION FAILED

Component 'embeddings' has issues that must be fixed

Errors:
  - Type check failed
  - Import errors detected

Review validation report: .migration/validation/embeddings/VALIDATION-REPORT.md
```

---

## 🔗 Related Documents

- [[docs/migration-analysis/test-strategy|Test Strategy]]
- [[docs/WEAVER-MIGRATION-PLAN|Migration Plan]]
- [[docs/migration-analysis/risk-analysis|Risk Analysis]]

---

**Created**: 2025-10-28
**Author**: Tester Agent (Hive Mind)
**Status**: ✅ Ready for use
