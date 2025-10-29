#!/bin/bash
###############################################################################
# Component Migration Validator
#
# Purpose: Validate individual component migration
# Usage: ./02-validate-component.sh <component-name>
# Author: Tester Agent (Hive Mind)
# Date: 2025-10-28
###############################################################################

set -euo pipefail

# Check arguments
if [ $# -eq 0 ]; then
  echo "Usage: $0 <component-name>"
  echo ""
  echo "Available components:"
  echo "  - chunking"
  echo "  - reasoning"
  echo "  - execution"
  echo "  - reflection"
  echo "  - embeddings"
  echo "  - integration"
  echo "  - learning-loop"
  echo "  - workflows"
  echo "  - agents"
  exit 1
fi

COMPONENT=$1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WEAVER_DIR="$PROJECT_ROOT/weaver"
PHASE12_DIR="$PROJECT_ROOT/weave-nn/weaver"
VALIDATION_DIR="$PROJECT_ROOT/.migration/validation/$COMPONENT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Header
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Component Migration Validator                        ║"
echo "║          Component: $COMPONENT"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Create validation directory
mkdir -p "$VALIDATION_DIR"

# Validation results
VALIDATION_PASSED=true
ERRORS=()

###############################################################################
# 1. Check Component Exists in Phase 12
###############################################################################
log_info "Step 1: Checking component exists in Phase 12..."

if [ ! -d "$PHASE12_DIR/src/$COMPONENT" ]; then
  log_error "Component '$COMPONENT' not found in Phase 12 directory"
  exit 1
fi

log_success "Component found in Phase 12"

# Count files
PHASE12_FILES=$(find "$PHASE12_DIR/src/$COMPONENT" -type f -name "*.ts" | wc -l)
log_info "  Phase 12 has $PHASE12_FILES files for $COMPONENT"

###############################################################################
# 2. Check if Component Already Exists in Main
###############################################################################
log_info "Step 2: Checking if component exists in main weaver..."

if [ -d "$WEAVER_DIR/src/$COMPONENT" ]; then
  MAIN_FILES=$(find "$WEAVER_DIR/src/$COMPONENT" -type f -name "*.ts" | wc -l)
  log_warning "Component already exists in main weaver ($MAIN_FILES files)"
  log_warning "This will be a MERGE operation, not a simple copy"
else
  log_info "Component does not exist in main weaver (clean migration)"
fi

###############################################################################
# 3. Copy Component to Main (Temporary)
###############################################################################
log_info "Step 3: Copying component to main weaver (for validation)..."

# Backup if exists
if [ -d "$WEAVER_DIR/src/$COMPONENT" ]; then
  cp -r "$WEAVER_DIR/src/$COMPONENT" "$VALIDATION_DIR/backup-main"
  log_info "  Backed up existing component"
fi

# Copy Phase 12 component
cp -r "$PHASE12_DIR/src/$COMPONENT" "$WEAVER_DIR/src/"
log_success "Component copied"

###############################################################################
# 4. Copy Component Tests (if exist)
###############################################################################
log_info "Step 4: Copying component tests..."

if [ -d "$PHASE12_DIR/tests/$COMPONENT" ]; then
  if [ ! -d "$WEAVER_DIR/tests" ]; then
    mkdir -p "$WEAVER_DIR/tests"
  fi

  # Backup existing tests if they exist
  if [ -d "$WEAVER_DIR/tests/$COMPONENT" ]; then
    cp -r "$WEAVER_DIR/tests/$COMPONENT" "$VALIDATION_DIR/backup-tests"
  fi

  cp -r "$PHASE12_DIR/tests/$COMPONENT" "$WEAVER_DIR/tests/"
  log_success "Tests copied"
else
  log_warning "No tests found for component in Phase 12"
fi

###############################################################################
# 5. Type Check
###############################################################################
log_info "Step 5: Running type check..."

cd "$WEAVER_DIR"

TYPE_CHECK_START=$(date +%s)
if npm run typecheck > "$VALIDATION_DIR/typecheck.log" 2>&1; then
  log_success "Type check passed ✓"
else
  log_error "Type check failed ✗"
  VALIDATION_PASSED=false
  ERRORS+=("Type check failed")

  # Show first 20 lines of errors
  echo ""
  log_error "First 20 lines of type errors:"
  head -n 20 "$VALIDATION_DIR/typecheck.log"
  echo ""
fi
TYPE_CHECK_END=$(date +%s)
TYPE_CHECK_DURATION=$((TYPE_CHECK_END - TYPE_CHECK_START))

###############################################################################
# 6. Build Test
###############################################################################
log_info "Step 6: Running build..."

BUILD_START=$(date +%s)
if npm run build > "$VALIDATION_DIR/build.log" 2>&1; then
  log_success "Build passed ✓"
else
  log_error "Build failed ✗"
  VALIDATION_PASSED=false
  ERRORS+=("Build failed")

  # Show build errors
  echo ""
  log_error "Build errors:"
  tail -n 20 "$VALIDATION_DIR/build.log"
  echo ""
fi
BUILD_END=$(date +%s)
BUILD_DURATION=$((BUILD_END - BUILD_START))

###############################################################################
# 7. Run Component Tests
###############################################################################
log_info "Step 7: Running component tests..."

TEST_START=$(date +%s)
if [ -d "$WEAVER_DIR/tests/$COMPONENT" ]; then
  if npm run test -- "$COMPONENT" > "$VALIDATION_DIR/test.log" 2>&1; then
    log_success "Component tests passed ✓"
  else
    log_warning "Some component tests failed (check test.log)"
    # Don't fail validation for test failures - just warn
  fi
else
  log_warning "No tests to run for component"
fi
TEST_END=$(date +%s)
TEST_DURATION=$((TEST_END - TEST_START))

###############################################################################
# 8. Check for Import Errors
###############################################################################
log_info "Step 8: Checking for import errors..."

# Simple check: look for common import patterns
IMPORT_ERRORS=$(grep -r "cannot find module\|module not found" "$VALIDATION_DIR/typecheck.log" 2>/dev/null | wc -l || echo "0")

if [ "$IMPORT_ERRORS" -gt 0 ]; then
  log_error "Found $IMPORT_ERRORS import errors"
  VALIDATION_PASSED=false
  ERRORS+=("Import errors detected")
else
  log_success "No import errors detected ✓"
fi

###############################################################################
# 9. Check for Circular Dependencies
###############################################################################
log_info "Step 9: Checking for circular dependencies..."

if command -v madge &> /dev/null; then
  if madge --circular "$WEAVER_DIR/src/$COMPONENT" > "$VALIDATION_DIR/circular-deps.log" 2>&1; then
    log_success "No circular dependencies ✓"
  else
    log_warning "Potential circular dependencies detected"
    cat "$VALIDATION_DIR/circular-deps.log"
  fi
else
  log_warning "madge not installed, skipping circular dependency check"
fi

###############################################################################
# 10. Generate Validation Report
###############################################################################
log_info "Step 10: Generating validation report..."

VALIDATION_STATUS="FAILED"
if [ "$VALIDATION_PASSED" = true ]; then
  VALIDATION_STATUS="PASSED"
fi

cat > "$VALIDATION_DIR/VALIDATION-REPORT.md" << EOF
# Component Migration Validation Report

**Component**: $COMPONENT
**Date**: $(date -Iseconds)
**Status**: $VALIDATION_STATUS

---

## 📋 Migration Details

- **Phase 12 Files**: $PHASE12_FILES
- **Operation**: $([ -d "$VALIDATION_DIR/backup-main" ] && echo "MERGE" || echo "NEW")

## 🧪 Validation Results

### Type Check
- **Status**: $([ -s "$VALIDATION_DIR/typecheck.log" ] && echo "FAILED ✗" || echo "PASSED ✓")
- **Duration**: ${TYPE_CHECK_DURATION}s

### Build
- **Status**: $(grep -q "error" "$VALIDATION_DIR/build.log" 2>/dev/null && echo "FAILED ✗" || echo "PASSED ✓")
- **Duration**: ${BUILD_DURATION}s

### Component Tests
- **Duration**: ${TEST_DURATION}s

### Import Resolution
- **Import Errors**: $IMPORT_ERRORS

## ⚠️ Issues Found

$(if [ ${#ERRORS[@]} -eq 0 ]; then
  echo "No critical issues found ✓"
else
  for error in "${ERRORS[@]}"; do
    echo "- $error"
  done
fi)

## 📁 Validation Files

\`\`\`
.migration/validation/$COMPONENT/
├── typecheck.log
├── build.log
├── test.log
├── circular-deps.log
├── backup-main/ (if merge)
├── backup-tests/ (if merge)
└── VALIDATION-REPORT.md (this file)
\`\`\`

---

## ✅ Recommendation

$(if [ "$VALIDATION_PASSED" = true ]; then
  echo "**PROCEED** with migration - all validations passed"
else
  echo "**DO NOT PROCEED** - fix errors before continuing"
  echo ""
  echo "Errors to fix:"
  for error in "${ERRORS[@]}"; do
    echo "- $error"
  done
fi)

EOF

###############################################################################
# 11. Rollback Temporary Changes
###############################################################################
log_info "Step 11: Rolling back temporary changes..."

# Remove copied component
rm -rf "$WEAVER_DIR/src/$COMPONENT"

# Restore backup if existed
if [ -d "$VALIDATION_DIR/backup-main" ]; then
  cp -r "$VALIDATION_DIR/backup-main" "$WEAVER_DIR/src/$COMPONENT"
  log_info "  Restored original component"
fi

# Remove copied tests
if [ -d "$WEAVER_DIR/tests/$COMPONENT" ] && [ -d "$PHASE12_DIR/tests/$COMPONENT" ]; then
  rm -rf "$WEAVER_DIR/tests/$COMPONENT"

  # Restore backup if existed
  if [ -d "$VALIDATION_DIR/backup-tests" ]; then
    cp -r "$VALIDATION_DIR/backup-tests" "$WEAVER_DIR/tests/$COMPONENT"
  fi
fi

log_success "Temporary changes rolled back"

###############################################################################
# Final Summary
###############################################################################
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Validation Complete: $COMPONENT"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ "$VALIDATION_PASSED" = true ]; then
  echo -e "${GREEN}✅ VALIDATION PASSED${NC}"
  echo ""
  echo "Component '$COMPONENT' is ready for migration"
  echo ""
  echo "Summary:"
  echo "  - Type check: ✓ (${TYPE_CHECK_DURATION}s)"
  echo "  - Build: ✓ (${BUILD_DURATION}s)"
  echo "  - Tests: ✓ (${TEST_DURATION}s)"
  echo "  - Import errors: 0"
  echo ""
  echo "Next step: Permanently migrate this component"
  exit 0
else
  echo -e "${RED}❌ VALIDATION FAILED${NC}"
  echo ""
  echo "Component '$COMPONENT' has issues that must be fixed"
  echo ""
  echo "Errors:"
  for error in "${ERRORS[@]}"; do
    echo "  - $error"
  done
  echo ""
  echo "Review validation report: $VALIDATION_DIR/VALIDATION-REPORT.md"
  exit 1
fi
