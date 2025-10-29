# SOP Scripts Index

Complete automation suite for Weaver Standard Operating Procedures.

## 📁 Directory Structure

```
scripts/sops/
├── feature-planning.ts          # SOP-001: Feature Planning
├── phase-planning.ts            # SOP-002: Phase/Milestone Planning
├── release-management.ts        # SOP-003: Release Management
├── debugging.ts                 # SOP-004: Systematic Debugging
├── documentation.ts             # SOP-005: Documentation Workflow
├── vault-management.ts          # SOP-006: Vault Management
├── code-review.ts               # SOP-007: Code Review
├── performance-analysis.ts      # SOP-008: Performance Analysis
├── README.md                    # Complete documentation
├── QUICK_START.md               # Quick start guide
├── IMPLEMENTATION_SUMMARY.md    # Implementation details
└── INDEX.md                     # This file
```

## 🎯 Scripts Summary

| SOP | Script | Purpose | Agents | Est. Time |
|-----|--------|---------|--------|-----------|
| 001 | feature-planning.ts | Feature specification with estimates | 3 | 2-3 min |
| 002 | phase-planning.ts | Phase/milestone planning | 4 | 4-6 min |
| 003 | release-management.ts | Release validation & deployment | 5 | 15-20 min |
| 004 | debugging.ts | Bug investigation & fixing | 4 | 3-5 min |
| 005 | documentation.ts | Doc generation & validation | 1 | 1-2 min |
| 006 | vault-management.ts | Vault organization & indexing | 1 | 2-4 min |
| 007 | code-review.ts | AI-powered code review | 1 | 1-2 min |
| 008 | performance-analysis.ts | Performance testing & profiling | 1 | 2-5 min |

## 🚀 Quick Access

### Via Weaver CLI

```bash
weaver sop <command> [options]
```

Commands:
- `feature-plan` - Plan a feature
- `phase-plan` - Plan a phase/milestone
- `release` - Manage releases
- `debug` - Debug systematically
- `docs` - Documentation workflow
- `vault` - Vault management
- `review` - Code review
- `perf` - Performance analysis

### Via npm Scripts

```bash
npm run sop:<command> -- [args]
```

Scripts:
- `sop:feature-plan`
- `sop:phase-plan`
- `sop:release`
- `sop:debug`
- `sop:docs`
- `sop:vault`
- `sop:review`
- `sop:perf`

### Direct Execution

```bash
tsx scripts/sops/<script>.ts [args]
```

## 📚 Documentation Hierarchy

### 1. Quick Start (Start Here!)
**File:** `QUICK_START.md`

- Immediate usage examples
- Common patterns
- Pro tips
- Troubleshooting

### 2. Complete Guide
**File:** `README.md`

- Detailed usage for all 8 SOPs
- All command-line options
- Integration guides
- Best practices
- Examples for each SOP

### 3. Implementation Details
**File:** `IMPLEMENTATION_SUMMARY.md`

- Technical architecture
- Design patterns
- Code organization
- Performance characteristics
- Future enhancements

### 4. SOP Specifications
**Location:** `/home/aepod/dev/weave-nn/weave-nn/_sops/`

- SOP-001-feature-planning.md
- SOP-002-phase-planning.md
- SOP-003-release-management.md
- SOP-004-debugging.md
- SOP-005-documentation.md
- SOP-006-markdown-management.md
- SOP-007-code-review.md
- SOP-008-performance-analysis.md

## 🔗 Integration Points

### CLI Integration
- **Location:** `src/cli/commands/sop/index.ts`
- **Main CLI:** `src/cli/index.ts`
- **Command Group:** `weaver sop`

### Memory Client
- **Location:** `src/memory/claude-flow-client.ts`
- **Namespace:** `weaver`
- **Learning Data:** 90-180 days TTL

### Dependencies
- **commander** - CLI framework
- **chalk** - Terminal colors
- **ora** - Elegant spinners
- **ClaudeFlowMemoryClient** - Memory management

## 🎓 Learning Resources

### Getting Started
1. Read `QUICK_START.md`
2. Try: `weaver sop docs generate --type api`
3. Try: `weaver sop feature-plan "Test feature" --dry-run`

### Mastering SOPs
1. Read `README.md` for complete guide
2. Study SOP specifications in `_sops/`
3. Review `IMPLEMENTATION_SUMMARY.md` for architecture

### Advanced Usage
1. Chain SOPs together for complete workflows
2. Leverage learning loop for improved accuracy
3. Customize for your team's needs

## 📊 Statistics

- **Total Scripts:** 8
- **Total Lines (TS):** ~2,300 lines
- **Total Lines (Docs):** ~1,200 lines
- **Agent Types:** 10+ specialized agents
- **Supported Workflows:** Complete SDLC coverage

## ✅ Verification Checklist

- [x] All 8 SOP scripts created
- [x] CLI integration complete
- [x] package.json updated
- [x] README documentation complete
- [x] Quick start guide created
- [x] Implementation summary documented
- [x] Index file created
- [x] Examples for all SOPs
- [x] Error handling implemented
- [x] Dry-run mode supported
- [x] Verbose mode supported
- [x] Help text for all commands

## 🔄 Update History

- **2025-10-27:** Initial implementation
  - All 8 SOPs implemented
  - CLI integration complete
  - Full documentation suite

## 🤝 Contributing

### Adding a New SOP

1. Create `scripts/sops/new-sop.ts`
2. Follow existing script patterns
3. Add to `src/cli/commands/sop/index.ts`
4. Add npm script to `package.json`
5. Document in `README.md`
6. Update this index

### Improving Existing SOPs

1. Maintain backward compatibility
2. Update documentation
3. Test with `--dry-run` first
4. Update version history

## 📞 Support

- **Documentation:** This directory
- **SOP Specs:** `/home/aepod/dev/weave-nn/weave-nn/_sops/`
- **Issues:** Create GitHub issue
- **Questions:** Check README.md first

## 🎯 Next Steps

**For First-Time Users:**
1. Read `QUICK_START.md`
2. Try: `weaver sop --help`
3. Run a simple command with `--dry-run`
4. Execute for real

**For Power Users:**
1. Chain multiple SOPs together
2. Leverage learning loop data
3. Customize agent configurations
4. Integrate with CI/CD

---

**Status:** Production Ready ✅
**Last Updated:** 2025-10-27
**Version:** 1.0.0
**Maintainer:** Weave-NN WeaveLogic Team
