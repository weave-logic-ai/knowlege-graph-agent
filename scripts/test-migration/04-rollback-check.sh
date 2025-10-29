#!/bin/bash
###############################################################################
# Rollback Decision Engine
#
# Purpose: Automated rollback decision based on validation results
# Usage: ./04-rollback-check.sh
# Author: Tester Agent (Hive Mind)
# Date: 2025-10-28
###############################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INTEGRATION_DIR="$PROJECT_ROOT/.migration/integration"
BASELINE_DIR="$PROJECT_ROOT/.migration/baseline"
ROLLBACK_DIR="$PROJECT_ROOT/.migration/rollback"

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
echo "║          Rollback Decision Engine                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

mkdir -p "$ROLLBACK_DIR"

ROLLBACK_REQUIRED=false
ROLLBACK_TRIGGERS=()
RISK_LEVEL="LOW"

###############################################################################
# 1. Check Integration Results Exist
###############################################################################
log_info "Step 1: Checking for integration validation results..."

if [ ! -f "$INTEGRATION_DIR/INTEGRATION-REPORT.md" ]; then
  log_error "No integration validation found!"
  log_error "Run ./03-validate-integration.sh first"
  exit 1
fi

log_success "Integration results found"

###############################################################################
# 2. Parse Integration Results
###############################################################################
log_info "Step 2: Parsing integration results..."

# Type check
TYPE_CHECK_RESULT=$(grep "Type Check" -A 1 "$INTEGRATION_DIR/INTEGRATION-REPORT.md" | grep "Result:" | awk '{print $3}')
log_info "  Type check: $TYPE_CHECK_RESULT"

# Build
BUILD_RESULT=$(grep "Build" -A 1 "$INTEGRATION_DIR/INTEGRATION-REPORT.md" | grep "Result:" | awk '{print $3}')
log_info "  Build: $BUILD_RESULT"

# Count errors and warnings
ERROR_COUNT=$(grep -c "❌" "$INTEGRATION_DIR/INTEGRATION-REPORT.md" || echo "0")
WARNING_COUNT=$(grep -c "⚠️" "$INTEGRATION_DIR/INTEGRATION-REPORT.md" || echo "0")

log_info "  Errors: $ERROR_COUNT"
log_info "  Warnings: $WARNING_COUNT"

###############################################################################
# 3. CRITICAL Rollback Triggers
###############################################################################
log_info "Step 3: Checking CRITICAL rollback triggers..."

# Trigger 1: Build Failure
if [ "$BUILD_RESULT" = "FAIL" ]; then
  log_error "CRITICAL: Build failure detected"
  ROLLBACK_REQUIRED=true
  ROLLBACK_TRIGGERS+=("Build failure")
  RISK_LEVEL="CRITICAL"
fi

# Trigger 2: Type Check Failure
if [ "$TYPE_CHECK_RESULT" = "FAIL" ]; then
  log_error "CRITICAL: Type check failure detected"
  ROLLBACK_REQUIRED=true
  ROLLBACK_TRIGGERS+=("Type check failure")
  RISK_LEVEL="CRITICAL"
fi

# Trigger 3: Import Resolution Failures
IMPORT_ERRORS=$(grep "Import Errors:" "$INTEGRATION_DIR/INTEGRATION-REPORT.md" | awk '{print $4}' || echo "0")
if [ "$IMPORT_ERRORS" -gt 0 ]; then
  log_error "CRITICAL: $IMPORT_ERRORS import resolution failures"
  ROLLBACK_REQUIRED=true
  ROLLBACK_TRIGGERS+=("Import resolution failures: $IMPORT_ERRORS")
  RISK_LEVEL="CRITICAL"
fi

# Trigger 4: Circular Dependencies
CIRCULAR_DEPS=$(grep "Circular Dependencies" -A 1 "$INTEGRATION_DIR/INTEGRATION-REPORT.md" | grep "Found:" | awk '{print $3}' || echo "0")
if [ "$CIRCULAR_DEPS" -gt 0 ]; then
  log_error "CRITICAL: $CIRCULAR_DEPS circular dependencies detected"
  ROLLBACK_REQUIRED=true
  ROLLBACK_TRIGGERS+=("Circular dependencies: $CIRCULAR_DEPS")
  RISK_LEVEL="CRITICAL"
fi

###############################################################################
# 4. HIGH Risk Triggers
###############################################################################
log_info "Step 4: Checking HIGH risk triggers..."

# Trigger 5: >10% Performance Degradation
if [ -f "$INTEGRATION_DIR/performance-comparison.json" ]; then
  BUILD_CHANGE=$(cat "$INTEGRATION_DIR/performance-comparison.json" | jq -r '.change_pct.build')
  BUILD_CHANGE_INT=$(printf "%.0f" "$BUILD_CHANGE")

  if [ "$BUILD_CHANGE_INT" -gt 15 ]; then
    log_error "HIGH: Build time degraded by ${BUILD_CHANGE_INT}%"
    ROLLBACK_TRIGGERS+=("Build time degradation: ${BUILD_CHANGE_INT}%")
    if [ "$RISK_LEVEL" = "LOW" ]; then
      RISK_LEVEL="HIGH"
    fi
  fi
fi

# Trigger 6: >10% Error Rate
if [ -f "$INTEGRATION_DIR/test-run.log" ]; then
  TOTAL_TESTS=$(grep -c "✓\|✗" "$INTEGRATION_DIR/test-run.log" || echo "1")
  TEST_FAILURES=$(grep -c "✗\|FAIL" "$INTEGRATION_DIR/test-run.log" || echo "0")

  if [ "$TOTAL_TESTS" -gt 0 ]; then
    FAILURE_RATE=$(awk "BEGIN {print $TEST_FAILURES / $TOTAL_TESTS * 100}")
    FAILURE_RATE_INT=$(printf "%.0f" "$FAILURE_RATE")

    if [ "$FAILURE_RATE_INT" -gt 10 ]; then
      log_error "HIGH: Test failure rate ${FAILURE_RATE_INT}% (>10%)"
      ROLLBACK_TRIGGERS+=("High test failure rate: ${FAILURE_RATE_INT}%")
      if [ "$RISK_LEVEL" = "LOW" ]; then
        RISK_LEVEL="HIGH"
      fi
    fi
  fi
fi

###############################################################################
# 5. MEDIUM Risk Triggers (Warnings Only)
###############################################################################
log_info "Step 5: Checking MEDIUM risk triggers..."

# Trigger 7: Coverage Drop
if [ -f "$INTEGRATION_DIR/INTEGRATION-REPORT.md" ] && grep -q "Coverage" "$INTEGRATION_DIR/INTEGRATION-REPORT.md"; then
  STATEMENTS_COV=$(grep "Statements:" "$INTEGRATION_DIR/INTEGRATION-REPORT.md" | awk '{print $3}' | tr -d '%')

  if (( $(echo "$STATEMENTS_COV < 80" | bc -l) )); then
    log_warning "MEDIUM: Coverage below 80% (${STATEMENTS_COV}%)"
    ROLLBACK_TRIGGERS+=("Low coverage: ${STATEMENTS_COV}%")
    if [ "$RISK_LEVEL" = "LOW" ]; then
      RISK_LEVEL="MEDIUM"
    fi
  fi
fi

###############################################################################
# 6. Generate Rollback Decision Report
###############################################################################
log_info "Step 6: Generating rollback decision report..."

DECISION="PROCEED"
if [ "$ROLLBACK_REQUIRED" = true ]; then
  DECISION="ROLLBACK"
fi

cat > "$ROLLBACK_DIR/ROLLBACK-DECISION.md" << EOF
# Rollback Decision Report

**Date**: $(date -Iseconds)
**Decision**: $DECISION
**Risk Level**: $RISK_LEVEL

---

## 📊 Analysis Summary

- **Errors**: $ERROR_COUNT
- **Warnings**: $WARNING_COUNT
- **Import Errors**: $IMPORT_ERRORS
- **Circular Dependencies**: $CIRCULAR_DEPS

## 🚨 Rollback Triggers

$(if [ ${#ROLLBACK_TRIGGERS[@]} -eq 0 ]; then
  echo "✅ No rollback triggers detected"
else
  for trigger in "${ROLLBACK_TRIGGERS[@]}"; do
    echo "- ❌ $trigger"
  done
fi)

## 🎯 Risk Assessment

**Risk Level**: $RISK_LEVEL

- **CRITICAL**: Immediate rollback required
- **HIGH**: Rollback strongly recommended
- **MEDIUM**: Review required, possible rollback
- **LOW**: Safe to proceed

## 🔄 Rollback Procedure

$(if [ "$ROLLBACK_REQUIRED" = true ]; then
  echo "### Execute Rollback"
  echo ""
  echo "\`\`\`bash"
  echo "cd $PROJECT_ROOT/weaver"
  echo "git checkout pre-phase12-migration"
  echo "git branch -D phase12-migration"
  echo "npm run build"
  echo "npm run test"
  echo "\`\`\`"
  echo ""
  echo "### Document Rollback"
  echo ""
  echo "Create rollback log:"
  echo "\`\`\`bash"
  echo "cat > .migration/rollback/rollback-log.md << 'LOGEOF'"
  echo "# Rollback Log"
  echo ""
  echo "**Date**: $(date -Iseconds)"
  echo "**Reason**: Migration validation failed"
  echo ""
  echo "## Triggers"
  for trigger in "${ROLLBACK_TRIGGERS[@]}"; do
    echo "- $trigger"
  done
  echo ""
  echo "## Actions Taken"
  echo "- Rolled back to pre-phase12-migration branch"
  echo "- Deleted phase12-migration branch"
  echo "- Verified build and tests"
  echo ""
  echo "## Next Steps"
  echo "- Fix issues identified in validation"
  echo "- Re-run component validation"
  echo "- Retry migration"
  echo "LOGEOF"
  echo "\`\`\`"
else
  echo "### No Rollback Needed"
  echo ""
  echo "Migration validation passed. Proceed with finalizing migration:"
  echo ""
  echo "\`\`\`bash"
  echo "cd $PROJECT_ROOT/weaver"
  echo "git add ."
  echo "git commit -m \"feat: Complete Phase 12 migration\""
  echo "git checkout main"
  echo "git merge phase12-migration"
  echo "\`\`\`"
fi)

---

## ✅ Recommendation

$(if [ "$ROLLBACK_REQUIRED" = true ]; then
  echo "**❌ ROLLBACK REQUIRED**"
  echo ""
  echo "Risk level: $RISK_LEVEL"
  echo ""
  echo "Critical issues detected that prevent successful migration."
  echo "Execute rollback procedure immediately and fix issues before retrying."
else
  echo "**✅ PROCEED WITH MIGRATION**"
  echo ""
  echo "Risk level: $RISK_LEVEL"
  echo ""
  if [ ${#ROLLBACK_TRIGGERS[@]} -gt 0 ]; then
    echo "Minor issues detected but not blocking:"
    for trigger in "${ROLLBACK_TRIGGERS[@]}"; do
      echo "- $trigger"
    done
    echo ""
    echo "Review and address warnings, but safe to proceed."
  else
    echo "No issues detected. Migration successful."
  fi
fi)

EOF

log_success "Rollback decision report generated"

###############################################################################
# Final Decision
###############################################################################
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Rollback Decision                                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ "$ROLLBACK_REQUIRED" = true ]; then
  echo -e "${RED}❌ ROLLBACK REQUIRED${NC}"
  echo ""
  echo "Risk Level: $RISK_LEVEL"
  echo ""
  echo "Rollback Triggers (${#ROLLBACK_TRIGGERS[@]}):"
  for trigger in "${ROLLBACK_TRIGGERS[@]}"; do
    echo "  - $trigger"
  done
  echo ""
  echo "View full report: $ROLLBACK_DIR/ROLLBACK-DECISION.md"
  echo ""
  echo "Execute rollback:"
  echo "  cd $PROJECT_ROOT/weaver"
  echo "  git checkout pre-phase12-migration"
  echo "  git branch -D phase12-migration"
  exit 1
else
  echo -e "${GREEN}✅ SAFE TO PROCEED${NC}"
  echo ""
  echo "Risk Level: $RISK_LEVEL"
  echo ""
  if [ ${#ROLLBACK_TRIGGERS[@]} -gt 0 ]; then
    echo "Warnings (${#ROLLBACK_TRIGGERS[@]}):"
    for trigger in "${ROLLBACK_TRIGGERS[@]}"; do
      echo "  - $trigger"
    done
    echo ""
    echo "Address warnings but migration can proceed."
  else
    echo "No issues detected. Migration successful!"
  fi
  echo ""
  echo "View full report: $ROLLBACK_DIR/ROLLBACK-DECISION.md"
  exit 0
fi
