# Weaver SOP Automation Scripts

Production-ready automation scripts for all 8 Standard Operating Procedures (SOPs) with full claude-flow integration.

## 📋 Available SOPs

### SOP-001: Feature Planning Workflow
**Script:** `feature-planning.ts`

Automated feature planning with multi-agent coordination. Spawns researcher, architect, and planner agents to create comprehensive feature specifications.

```bash
# Basic usage
weaver sop feature-plan "Add user authentication"

# With priority and milestone
weaver sop feature-plan "Add real-time collaboration" --priority P1 --milestone "Release 2.0"

# Dry run (show plan without executing)
weaver sop feature-plan "Add payment gateway" --dry-run

# Verbose output
weaver sop feature-plan "Add search functionality" --verbose
```

**Outputs:**
- Feature specification document
- Architecture design
- Task breakdown with estimates
- Risk assessment
- Learning data stored for future improvement

---

### SOP-002: Phase/Milestone Planning Workflow
**Script:** `phase-planning.ts`

Creates comprehensive phase documents with task breakdowns across multiple features.

```bash
# Basic usage
weaver sop phase-plan 12 --objectives "Migrate to microservices, Add GraphQL API"

# With team size and sprints
weaver sop phase-plan Q4-2025 --objectives "Mobile app, Payment processing" \
  --team-size 8 --sprints 6

# Dry run
weaver sop phase-plan 13 --objectives "Infrastructure upgrade" --dry-run
```

**Outputs:**
- Phase index document
- Feature breakdown (10-20 features)
- Sprint timeline
- Resource allocation
- Risk register
- Dependency graph

---

### SOP-003: Release Management Workflow
**Script:** `release-management.ts`

Automated release validation, changelog generation, git tagging, and deployment coordination.

```bash
# Minor release
weaver sop release 2.5.0 --type minor

# Hotfix release (fast-track)
weaver sop release 2.4.1 --type hotfix --fast-track

# Major release with breaking changes
weaver sop release 3.0.0 --type major

# Dry run (validate without deploying)
weaver sop release 2.6.0 --type minor --dry-run
```

**Outputs:**
- Updated version files
- Auto-generated CHANGELOG.md
- Git tag with release notes
- GitHub release
- Deployment record
- Release metrics for learning

---

### SOP-004: Systematic Debugging Workflow
**Script:** `debugging.ts`

Multi-agent approach to investigating and resolving software defects with root cause analysis.

```bash
# Debug specific issue
weaver sop debug 1234

# With severity
weaver sop debug 5678 --severity P0

# Investigate by description
weaver debug investigate "Users cannot upload files > 5MB"

# Dry run (analyze without fixing)
weaver sop debug 9012 --dry-run --verbose
```

**Outputs:**
- Root cause analysis document
- Code fix with tests
- Pull request with detailed explanation
- Learning data to prevent similar bugs

---

### SOP-005: Documentation Workflow
**Script:** `documentation.ts`

Automated documentation generation and maintenance for code, APIs, and user guides.

```bash
# Generate API documentation
weaver sop docs generate --type api

# Generate all documentation
weaver sop docs generate --type all

# Validate existing documentation
weaver sop docs validate

# Validate and auto-fix issues
weaver sop docs validate --fix

# Scope to specific directory
weaver sop docs generate --scope "src/auth/**"
```

**Outputs:**
- API documentation
- JSDoc comments
- Usage examples
- Architecture diagrams
- Updated README files

---

### SOP-006: Vault Management Workflow
**Script:** `vault-management.ts`

Markdown vault organization, shadow cache indexing, and maintenance.

```bash
# Organize vault structure
weaver sop vault organize

# Build shadow cache index
weaver sop vault index --full

# Clean up vault (dry run)
weaver sop vault cleanup --dry-run

# Clean up vault (execute)
weaver sop vault cleanup

# Verbose output
weaver sop vault organize --verbose
```

**Outputs:**
- Organized vault structure
- Shadow cache index
- Removed duplicates and orphans
- Fixed broken links
- Standardized filenames

---

### SOP-007: Code Review Workflow
**Script:** `code-review.ts`

AI-powered code review with automated quality checks and intelligent feedback.

```bash
# Review pull request
weaver sop review 1234

# Deep analysis mode
weaver sop review 5678 --deep

# Auto-approve if all checks pass
weaver sop review 9012 --auto-approve

# Review specific branch
weaver sop review --branch feature/auth --deep

# Dry run
weaver sop review 3456 --dry-run
```

**Outputs:**
- Code quality score
- Security analysis
- Performance assessment
- Detailed review comments
- Improvement suggestions

---

### SOP-008: Performance Analysis Workflow
**Script:** `performance-analysis.ts`

Automated performance testing, profiling, and optimization recommendations.

```bash
# Analyze performance metrics
weaver sop perf analyze --target api

# Run benchmarks with baseline comparison
weaver sop perf benchmark --baseline v2.4.0

# Profile application
weaver sop perf profile --duration 60s

# Verbose output
weaver sop perf analyze --verbose
```

**Outputs:**
- Performance metrics report
- Bottleneck analysis
- Optimization recommendations
- Benchmark comparison
- CPU/memory profiles

---

## 🔧 Integration with Weaver CLI

All SOP scripts are fully integrated into the Weaver CLI:

```bash
# Direct invocation via weaver CLI
weaver sop feature-plan "Add feature X"
weaver sop phase-plan 12 --objectives "..."
weaver sop release 2.5.0 --type minor
weaver sop debug 1234
weaver sop docs generate --type api
weaver sop vault organize
weaver sop review 5678
weaver sop perf analyze

# Or via npm scripts
npm run sop:feature-plan -- "Add feature X"
npm run sop:phase-plan -- 12 --objectives "..."
npm run sop:release -- 2.5.0 --type minor
# ... etc
```

## 🤖 Claude-Flow Integration

All SOPs use Claude-Flow for multi-agent coordination:

### Memory Management
- **Namespace:** `weaver` (default)
- **Learning storage:** 90-180 days TTL
- **Cross-session persistence** for continuous improvement

### Agent Coordination
- **Feature Planning:** 3 agents (researcher, architect, planner)
- **Phase Planning:** 4 agents (researcher, architect, analyst, planner)
- **Release Management:** 5 agents (coder, tester, reviewer, documenter, coordinator)
- **Debugging:** 4 agents (analyst, investigator, fixer, tester)

### Learning Loop
All SOPs capture learning data for continuous improvement:

1. **Perception:** Gather context from memory and vault
2. **Reasoning:** Generate plans based on patterns
3. **Execution:** Coordinate agents to complete work
4. **Reflection:** Analyze outcomes and extract lessons
5. **Memorization:** Store experience for future improvement

## 📊 Common Options

All SOP scripts support common flags:

- `--dry-run` - Show what would happen without executing
- `--verbose` / `-v` - Detailed output with all steps
- `--help` - Show command-specific help

## 🎯 Best Practices

### 1. Always Use Dry Run First
```bash
weaver sop release 3.0.0 --type major --dry-run
# Review the plan, then execute
weaver sop release 3.0.0 --type major
```

### 2. Leverage Learning Data
The SOPs get smarter over time. After completing a few features/phases, estimation accuracy improves:

```bash
# First feature: 76 hours estimated
weaver sop feature-plan "Feature A"

# After 5 features with learning data
# Estimation accuracy improves to 90%+
weaver sop feature-plan "Feature F"
```

### 3. Chain SOPs for Complete Workflows
```bash
# 1. Plan feature
weaver sop feature-plan "Add OAuth2" --priority P1

# 2. Implement and debug if needed
weaver sop debug 1234

# 3. Review before merge
weaver sop review 5678

# 4. Release
weaver sop release 2.5.0 --type minor
```

### 4. Use Verbose Mode for Learning
```bash
weaver sop phase-plan 12 --objectives "..." --verbose
# See all agent decisions and reasoning
```

## 🔍 Troubleshooting

### Scripts Not Executable
```bash
chmod +x scripts/sops/*.ts
```

### TypeScript Errors
```bash
npm run typecheck
# Fix any type errors before running SOPs
```

### Claude-Flow Not Available
Ensure claude-flow is installed:
```bash
npm install claude-flow@alpha
# Or use MCP integration
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

### Memory Store Issues
Clear and rebuild memory cache:
```bash
# Clear test memory store
# (Production memory stores are persistent)
```

## 📝 Development

### Adding a New SOP

1. Create script in `scripts/sops/new-sop.ts`
2. Follow existing script structure:
   - Import required dependencies
   - Define option interfaces
   - Implement execution function
   - Export Commander.js program
3. Add to `src/cli/commands/sop/index.ts`
4. Add npm script to `package.json`
5. Document in this README

### Testing SOPs

```bash
# Run with dry-run flag
weaver sop feature-plan "Test feature" --dry-run

# Check verbose output
weaver sop debug 1234 --verbose --dry-run
```

## 📚 Documentation

- **Full SOP Documentation:** `/weave-nn/_sops/`
- **API Reference:** Generated via `weaver sop docs generate --type api`
- **Architecture:** See individual SOP markdown files

## 🎓 Examples

See the `examples/` section in each SOP markdown file for detailed use cases:

- SOP-001: Simple CRUD, Complex Integration, Performance Optimization
- SOP-002: Infrastructure Modernization, Feature-Heavy Release, Technical Debt
- SOP-003: Minor Release, Hotfix, Major Release with Breaking Changes
- SOP-004: Configuration Bug, Race Condition, Edge Case
- ... and more

---

**Last Updated:** 2025-10-27
**Version:** 1.0.0
**Maintainer:** Weave-NN WeaveLogic Team
