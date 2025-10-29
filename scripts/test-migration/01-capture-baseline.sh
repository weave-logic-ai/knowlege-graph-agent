#!/bin/bash
###############################################################################
# Pre-Migration Baseline Capture Script
#
# Purpose: Capture complete state of /weaver/ before Phase 12 migration
# Author: Tester Agent (Hive Mind)
# Date: 2025-10-28
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WEAVER_DIR="$PROJECT_ROOT/weaver"
BASELINE_DIR="$PROJECT_ROOT/.migration/baseline"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Header
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Pre-Migration Baseline Capture                       ║"
echo "║          Weaver Phase 12 Migration Testing                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Create baseline directory
log_info "Creating baseline directory..."
mkdir -p "$BASELINE_DIR"/{tests,performance,coverage,inventory}

cd "$WEAVER_DIR"

###############################################################################
# 1. File Inventory
###############################################################################
log_info "Capturing file inventory..."

cat > "$BASELINE_DIR/inventory/file-inventory.json" << 'EOF'
{
  "timestamp": "$(date -Iseconds)",
  "source_files": {},
  "test_files": {},
  "total_lines": 0
}
EOF

# Count source files
log_info "  - Counting source files..."
TOTAL_SRC=$(find src -type f -name "*.ts" | wc -l)
echo "    Source files: $TOTAL_SRC"

# Count test files
log_info "  - Counting test files..."
TOTAL_TESTS=$(find tests -type f -name "*.test.ts" 2>/dev/null | wc -l || echo "0")
echo "    Test files: $TOTAL_TESTS"

# Count total lines
log_info "  - Counting total lines of code..."
TOTAL_LINES=$(find src -type f -name "*.ts" -exec wc -l {} + | tail -n1 | awk '{print $1}')
echo "    Total lines: $TOTAL_LINES"

# Save detailed inventory
cat > "$BASELINE_DIR/inventory/file-inventory.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "source_files": {
    "count": $TOTAL_SRC,
    "paths": $(find src -type f -name "*.ts" | jq -R -s -c 'split("\n")[:-1]')
  },
  "test_files": {
    "count": $TOTAL_TESTS,
    "paths": $(find tests -type f -name "*.test.ts" 2>/dev/null | jq -R -s -c 'split("\n")[:-1]' || echo "[]")
  },
  "total_lines": $TOTAL_LINES,
  "directories": $(find src -type d | jq -R -s -c 'split("\n")[:-1]')
}
EOF

log_success "File inventory captured"

###############################################################################
# 2. Dependency Tree
###############################################################################
log_info "Capturing dependency tree..."

if [ -f "package.json" ]; then
  cp package.json "$BASELINE_DIR/inventory/package.json"

  if [ -f "bun.lock" ]; then
    cp bun.lock "$BASELINE_DIR/inventory/bun.lock"
  fi

  # Extract dependency counts
  DEPS_COUNT=$(cat package.json | jq '.dependencies | length')
  DEV_DEPS_COUNT=$(cat package.json | jq '.devDependencies | length')

  cat > "$BASELINE_DIR/inventory/dependencies.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "dependencies": $DEPS_COUNT,
  "devDependencies": $DEV_DEPS_COUNT,
  "total": $((DEPS_COUNT + DEV_DEPS_COUNT))
}
EOF

  log_success "Dependency tree captured ($((DEPS_COUNT + DEV_DEPS_COUNT)) total)"
else
  log_warning "No package.json found"
fi

###############################################################################
# 3. Type Check
###############################################################################
log_info "Running type check..."

TYPE_CHECK_START=$(date +%s)
if npm run typecheck > "$BASELINE_DIR/tests/typecheck.log" 2>&1; then
  TYPE_CHECK_RESULT="PASS"
  log_success "Type check passed"
else
  TYPE_CHECK_RESULT="FAIL"
  log_error "Type check failed (check typecheck.log)"
fi
TYPE_CHECK_END=$(date +%s)
TYPE_CHECK_DURATION=$((TYPE_CHECK_END - TYPE_CHECK_START))

cat > "$BASELINE_DIR/tests/typecheck-results.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "result": "$TYPE_CHECK_RESULT",
  "duration_seconds": $TYPE_CHECK_DURATION
}
EOF

###############################################################################
# 4. Build Test
###############################################################################
log_info "Running build..."

BUILD_START=$(date +%s)
if npm run build > "$BASELINE_DIR/tests/build.log" 2>&1; then
  BUILD_RESULT="PASS"
  log_success "Build passed"
else
  BUILD_RESULT="FAIL"
  log_error "Build failed (check build.log)"
fi
BUILD_END=$(date +%s)
BUILD_DURATION=$((BUILD_END - BUILD_START))

cat > "$BASELINE_DIR/tests/build-results.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "result": "$BUILD_RESULT",
  "duration_seconds": $BUILD_DURATION
}
EOF

###############################################################################
# 5. Test Suite Execution
###############################################################################
log_info "Running test suite..."

TEST_START=$(date +%s)
if npm run test > "$BASELINE_DIR/tests/test-run.log" 2>&1; then
  TEST_RESULT="PASS"
  log_success "Tests passed"
else
  TEST_RESULT="FAIL"
  log_warning "Some tests failed (check test-run.log)"
fi
TEST_END=$(date +%s)
TEST_DURATION=$((TEST_END - TEST_START))

# Parse test results (if using vitest/jest JSON reporter)
# This is a simplified version - adjust based on actual test runner output
cat > "$BASELINE_DIR/tests/test-results.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "result": "$TEST_RESULT",
  "duration_seconds": $TEST_DURATION,
  "total_tests": 0,
  "passed": 0,
  "failed": 0,
  "skipped": 0
}
EOF

###############################################################################
# 6. Performance Metrics
###############################################################################
log_info "Capturing performance metrics..."

cat > "$BASELINE_DIR/performance/metrics.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "build_time_seconds": $BUILD_DURATION,
  "test_time_seconds": $TEST_DURATION,
  "typecheck_time_seconds": $TYPE_CHECK_DURATION,
  "total_time_seconds": $((BUILD_DURATION + TEST_DURATION + TYPE_CHECK_DURATION))
}
EOF

log_success "Performance metrics captured"

###############################################################################
# 7. Coverage Report (if available)
###############################################################################
log_info "Checking for coverage report..."

if npm run test:coverage > "$BASELINE_DIR/coverage/coverage.log" 2>&1; then
  if [ -d "coverage" ]; then
    cp -r coverage "$BASELINE_DIR/coverage/html"
    log_success "Coverage report captured"
  fi
else
  log_warning "No coverage report available"
fi

###############################################################################
# 8. Generate Summary Report
###############################################################################
log_info "Generating baseline summary report..."

cat > "$BASELINE_DIR/BASELINE-REPORT.md" << EOF
# Pre-Migration Baseline Report

**Generated**: $(date -Iseconds)
**Project**: Weaver (/weaver/)
**Purpose**: Baseline capture before Phase 12 migration

---

## 📊 Inventory

- **Source Files**: $TOTAL_SRC files
- **Test Files**: $TOTAL_TESTS files
- **Total Lines**: $TOTAL_LINES lines
- **Dependencies**: $((DEPS_COUNT + DEV_DEPS_COUNT)) packages

## 🧪 Test Results

### Type Check
- **Result**: $TYPE_CHECK_RESULT
- **Duration**: ${TYPE_CHECK_DURATION}s

### Build
- **Result**: $BUILD_RESULT
- **Duration**: ${BUILD_DURATION}s

### Test Suite
- **Result**: $TEST_RESULT
- **Duration**: ${TEST_DURATION}s

## ⚡ Performance Baseline

| Metric | Time |
|--------|------|
| Build | ${BUILD_DURATION}s |
| Tests | ${TEST_DURATION}s |
| Type Check | ${TYPE_CHECK_DURATION}s |
| **Total** | **$((BUILD_DURATION + TEST_DURATION + TYPE_CHECK_DURATION))s** |

## 📁 Baseline Files

\`\`\`
.migration/baseline/
├── tests/
│   ├── typecheck.log
│   ├── typecheck-results.json
│   ├── build.log
│   ├── build-results.json
│   ├── test-run.log
│   └── test-results.json
├── performance/
│   └── metrics.json
├── coverage/
│   ├── coverage.log
│   └── html/
├── inventory/
│   ├── file-inventory.json
│   ├── package.json
│   ├── bun.lock
│   └── dependencies.json
└── BASELINE-REPORT.md (this file)
\`\`\`

---

## ✅ Next Steps

1. Review this baseline report
2. Proceed with component migration
3. Compare post-migration metrics to this baseline
4. Use rollback triggers if metrics degrade significantly

**Baseline Status**: ✅ CAPTURED
EOF

log_success "Baseline summary report generated"

###############################################################################
# Final Summary
###############################################################################
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║               Baseline Capture Complete                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Baseline captured successfully${NC}"
echo ""
echo "Baseline location: $BASELINE_DIR"
echo ""
echo "Summary:"
echo "  - Source files: $TOTAL_SRC"
echo "  - Test files: $TOTAL_TESTS"
echo "  - Type check: $TYPE_CHECK_RESULT (${TYPE_CHECK_DURATION}s)"
echo "  - Build: $BUILD_RESULT (${BUILD_DURATION}s)"
echo "  - Tests: $TEST_RESULT (${TEST_DURATION}s)"
echo ""
echo "View full report: cat $BASELINE_DIR/BASELINE-REPORT.md"
echo ""
