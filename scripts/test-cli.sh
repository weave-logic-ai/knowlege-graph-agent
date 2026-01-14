#!/bin/bash
#
# Knowledge Graph Agent CLI Test Suite
# =====================================
# Comprehensive testing of all CLI features
#
# Usage: ./scripts/test-cli.sh [--verbose] [--skip-cleanup]
#
# Exit codes:
#   0 - All tests passed
#   1 - Some tests failed
#

# Don't exit on first error - we want to run all tests
# set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
KG_BIN="node $PROJECT_ROOT/dist/cli/bin.js"
TEST_DIR="/tmp/kg-test-$$"
VERBOSE=false
SKIP_CLEANUP=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --skip-cleanup)
            SKIP_CLEANUP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

log_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
    ((TESTS_SKIPPED++))
}

log_section() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

# Run a test command
run_test() {
    local test_name="$1"
    local cmd="$2"
    local expect_fail="${3:-false}"

    if $VERBOSE; then
        echo -e "${YELLOW}[TEST]${NC} $test_name"
        echo -e "${YELLOW}[CMD]${NC}  $cmd"
    fi

    local output
    local exit_code

    output=$(eval "$cmd" 2>&1) || exit_code=$?
    exit_code=${exit_code:-0}

    if $expect_fail; then
        if [[ $exit_code -eq 0 ]]; then
            log_fail "$test_name (expected failure but succeeded)"
        else
            log_success "$test_name (expected failure)"
        fi
    else
        if [[ $exit_code -eq 0 ]]; then
            log_success "$test_name"
        else
            log_fail "$test_name"
            if $VERBOSE; then
                echo "  Command output:"
                echo "$output" | sed 's/^/    /' | head -20
            fi
        fi
    fi

    # Always return 0 so the script continues
    return 0
}

# Check if a file exists
check_file() {
    local file="$1"
    local test_name="$2"

    if [[ -f "$file" ]]; then
        log_success "$test_name"
    else
        log_fail "$test_name (file not found: $file)"
    fi
    return 0
}

# Check if a directory exists
check_dir() {
    local dir="$1"
    local test_name="$2"

    if [[ -d "$dir" ]]; then
        log_success "$test_name"
    else
        log_fail "$test_name (directory not found: $dir)"
    fi
    return 0
}

# Setup test environment
setup() {
    log_info "Setting up test environment at $TEST_DIR"
    rm -rf "$TEST_DIR"
    mkdir -p "$TEST_DIR"
    cd "$TEST_DIR"

    # Initialize a git repo for commit tests
    git init --quiet
    git config user.email "test@example.com"
    git config user.name "Test User"
}

# Cleanup test environment
cleanup() {
    if $SKIP_CLEANUP; then
        log_info "Skipping cleanup. Test files at: $TEST_DIR"
    else
        log_info "Cleaning up test environment"
        rm -rf "$TEST_DIR"
    fi
}

# ============================================================================
# TEST SECTIONS
# ============================================================================

test_version_and_help() {
    log_section "Version & Help Commands"

    run_test "Version flag (-v)" "$KG_BIN -v"
    run_test "Version flag (--version)" "$KG_BIN --version"
    run_test "Help flag (-h)" "$KG_BIN -h"
    run_test "Help flag (--help)" "$KG_BIN --help"
}

test_init_command() {
    log_section "Init Command"

    cd "$TEST_DIR"
    rm -rf .kg

    run_test "Init with default options" "$KG_BIN init --name test-project"
    check_dir ".kg" "Created .kg directory"
    check_file ".kg/config.json" "Created config.json"
    check_file ".kg/knowledge.db" "Created knowledge.db"
    check_file ".kg/.gitignore" "Created .gitignore"

    # Test force reinit
    run_test "Init with --force (overwrite)" "$KG_BIN init --name test-project --force"

    # Test init without database
    rm -rf .kg
    run_test "Init with --no-db" "$KG_BIN init --name test-project --no-db"
    check_file ".kg/config.json" "Created config.json (no-db mode)"

    # Reinit with database for later tests
    rm -rf .kg
    $KG_BIN init --name test-project > /dev/null 2>&1
}

test_config_command() {
    log_section "Config Command"

    run_test "Config show" "$KG_BIN config show"
    run_test "Config show --json" "$KG_BIN config show --json"
    run_test "Config validate" "$KG_BIN config validate"
    run_test "Config defaults" "$KG_BIN config defaults"
    run_test "Config set projectName" "$KG_BIN config set projectName 'Updated Name'"
    run_test "Config show after set" "$KG_BIN config show"
}

test_docs_command() {
    log_section "Docs Command"

    run_test "Docs init" "$KG_BIN docs init"
    check_dir "docs" "Created docs directory"
    check_dir "docs/concepts" "Created docs/concepts"
    check_dir "docs/guides" "Created docs/guides"
    # Note: docs/reference may not be created by default

    run_test "Docs status" "$KG_BIN docs status"

    # Create some sample docs for later tests
    mkdir -p docs/guides
    cat > docs/guides/getting-started.md << 'EOF'
---
title: Getting Started
tags: [guide, intro]
---

# Getting Started

This is a guide to getting started with the project.

## Installation

Run the following command:

```bash
npm install
```

## Usage

See the [[API Reference]] for more details.
EOF

    cat > docs/concepts/architecture.md << 'EOF'
---
title: Architecture
tags: [concept, design]
---

# Architecture

This document describes the system architecture.

## Overview

The system is built with a modular design.

Related: [[Getting Started]]
EOF
}

test_graph_command() {
    log_section "Graph Command"

    run_test "Graph generation" "$KG_BIN graph"
    run_test "Graph with verbose" "$KG_BIN graph --verbose"
    run_test "Graph analyze" "$KG_BIN graph analyze"
}

test_stats_command() {
    log_section "Stats Command"

    run_test "Stats display" "$KG_BIN stats"
    run_test "Stats as JSON" "$KG_BIN stats --json"
}

test_search_command() {
    log_section "Search Command"

    run_test "Search for 'getting'" "$KG_BIN search getting"
    run_test "Search with limit" "$KG_BIN search architecture --limit 5"
    run_test "Search as JSON" "$KG_BIN search guide --json"
    run_test "Search no results (may be empty)" "$KG_BIN search xyznonexistent123"
}

test_claude_command() {
    log_section "Claude Command"

    run_test "Claude templates list" "$KG_BIN claude templates"
    run_test "Claude preview" "$KG_BIN claude preview"
    run_test "Claude update" "$KG_BIN claude update"
    check_file "CLAUDE.md" "Created CLAUDE.md"
}

test_frontmatter_command() {
    log_section "Frontmatter Command"

    # Create a file without frontmatter
    cat > docs/test-no-frontmatter.md << 'EOF'
# Test File

This file has no frontmatter.
EOF

    run_test "Frontmatter validate" "$KG_BIN frontmatter validate docs/"
    run_test "Frontmatter add (dry-run)" "$KG_BIN frontmatter add docs/ --dry-run"
    run_test "Frontmatter add" "$KG_BIN frontmatter add docs/"
}

test_diagnostics_command() {
    log_section "Diagnostics Command"

    run_test "Diagnostics status" "$KG_BIN diag status"
    run_test "Diagnostics health" "$KG_BIN diag health"
    run_test "Diagnostics memory" "$KG_BIN diag memory"
    run_test "Diagnostics integrity" "$KG_BIN diag integrity"
}

test_audit_command() {
    log_section "Audit Command"

    run_test "Audit stats" "$KG_BIN audit stats"
    run_test "Audit query" "$KG_BIN audit query --limit 10"
    # Checkpoint requires specific arguments
    run_test "Audit checkpoint help" "$KG_BIN audit checkpoint --help"
    run_test "Audit verify" "$KG_BIN audit verify"
}

test_workflow_command() {
    log_section "Workflow Command"

    run_test "Workflow list" "$KG_BIN workflow list"
    run_test "Workflow history" "$KG_BIN workflow history"
    # Note: Starting workflows might require specific conditions
}

test_vector_command() {
    log_section "Vector Command"

    run_test "Vector stats" "$KG_BIN vector stats"
    # Vector search/rebuild requires embeddings model - may fail on first run
    run_test "Vector rebuild (may require model)" "$KG_BIN vector rebuild"
}

test_plugin_command() {
    log_section "Plugin Command"

    run_test "Plugin list" "$KG_BIN plugin list"
    run_test "Plugin help" "$KG_BIN plugin --help"
}

test_sync_command() {
    log_section "Sync Command"

    run_test "Sync config" "$KG_BIN sync config"
    run_test "Sync show-commands" "$KG_BIN sync --show-commands"
    run_test "Sync hooks" "$KG_BIN sync --hooks"
}

test_sop_command() {
    log_section "SOP Command"

    run_test "SOP list" "$KG_BIN sop list"
    run_test "SOP init" "$KG_BIN sop init"
    run_test "SOP check" "$KG_BIN sop check"
}

test_analyze_command() {
    log_section "Analyze Command"

    run_test "Analyze (dry-run)" "$KG_BIN analyze --dry-run"
    run_test "Analyze report" "$KG_BIN analyze report"
}

test_cultivate_command() {
    log_section "Cultivate Command"

    run_test "Cultivate (dry-run)" "$KG_BIN cultivate --dry-run"
}

test_convert_command() {
    log_section "Convert Command"

    run_test "Convert docs (dry-run)" "$KG_BIN convert docs --dry-run"
}

test_hive_mind_command() {
    log_section "Hive Mind Command"

    # Create a test vault structure
    mkdir -p vault
    cat > vault/note1.md << 'EOF'
---
title: Note 1
---
# Note 1

This links to [[Note 2]] and discusses topics.
EOF

    cat > vault/note2.md << 'EOF'
---
title: Note 2
---
# Note 2

This links back to [[Note 1]].
EOF

    cat > vault/orphan.md << 'EOF'
# Orphan Note

This note has no links.
EOF

    run_test "Hive-mind analyze-links" "$KG_BIN hive-mind analyze-links vault/"
    run_test "Hive-mind analyze-links (JSON)" "$KG_BIN hive-mind analyze-links vault/ --json"
    run_test "Hive-mind validate-names" "$KG_BIN hive-mind validate-names vault/"
    run_test "Hive-mind find-connections" "$KG_BIN hive-mind find-connections vault/"
    run_test "Hive-mind add-frontmatter (dry-run)" "$KG_BIN hive-mind add-frontmatter vault/ --dry-run"
}

test_commit_command() {
    log_section "Commit Command"

    # Create a test file to commit
    echo "test content" > test-file.txt
    git add test-file.txt

    run_test "Commit status" "$KG_BIN commit status"
    run_test "Commit diff" "$KG_BIN commit diff"
    run_test "Commit dry-run" "$KG_BIN commit --dry-run"
    run_test "Commit with message" "$KG_BIN commit -m 'Test commit'"
    # Now we have a commit, test log
    run_test "Commit log" "$KG_BIN commit log"
}

test_serve_command() {
    log_section "Serve Command"

    run_test "Serve status" "$KG_BIN serve status"
    # Note: Actually starting servers would block, so we just test help/status
    run_test "Serve help" "$KG_BIN serve --help"
}

test_error_handling() {
    log_section "Error Handling"

    # Test invalid commands
    run_test "Invalid command returns error" "$KG_BIN invalidcommand" true

    # Test missing arguments
    run_test "Search without query returns error" "$KG_BIN search" true

    # Test help for various commands
    run_test "Init help works" "$KG_BIN init --help"
    run_test "Graph help works" "$KG_BIN graph --help"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    echo ""
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       Knowledge Graph Agent CLI Test Suite                    ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    log_info "Project root: $PROJECT_ROOT"
    log_info "Test directory: $TEST_DIR"
    log_info "Verbose mode: $VERBOSE"
    echo ""

    # Check if build exists
    if [[ ! -f "$PROJECT_ROOT/dist/cli/bin.js" ]]; then
        echo -e "${RED}ERROR: CLI not built. Run 'npm run build' first.${NC}"
        exit 1
    fi

    # Setup
    setup

    # Run all test sections
    test_version_and_help
    test_init_command
    test_config_command
    test_docs_command
    test_graph_command
    test_stats_command
    test_search_command
    test_claude_command
    test_frontmatter_command
    test_diagnostics_command
    test_audit_command
    test_workflow_command
    test_vector_command
    test_plugin_command
    test_sync_command
    test_sop_command
    test_analyze_command
    test_cultivate_command
    test_convert_command
    test_hive_mind_command
    test_commit_command
    test_serve_command
    test_error_handling

    # Cleanup
    cleanup

    # Summary
    log_section "Test Summary"
    echo ""
    echo -e "  ${GREEN}Passed:${NC}  $TESTS_PASSED"
    echo -e "  ${RED}Failed:${NC}  $TESTS_FAILED"
    echo -e "  ${YELLOW}Skipped:${NC} $TESTS_SKIPPED"
    echo ""

    TOTAL=$((TESTS_PASSED + TESTS_FAILED))
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "  ${GREEN}All $TOTAL tests passed!${NC}"
        echo ""
        exit 0
    else
        echo -e "  ${RED}$TESTS_FAILED of $TOTAL tests failed.${NC}"
        echo ""
        exit 1
    fi
}

# Run main function
main "$@"
