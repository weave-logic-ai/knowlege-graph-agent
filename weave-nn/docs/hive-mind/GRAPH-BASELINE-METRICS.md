# Knowledge Graph Baseline Metrics
**Analysis Date**: 2025-10-28
**Tool Version**: 1.0.0
**Analyst**: Coder Agent

---

## 🎯 Executive Summary

**Status**: 🔴 **CRITICAL** - Immediate reconnection required

The knowledge graph analysis reveals a severely fragmented documentation structure with **60.4% orphan rate**, significantly exceeding the 5% target threshold. However, the analysis also identified **32 high-value connection opportunities** that can rapidly improve graph connectivity.

---

## 📊 Core Metrics

### Overall Graph Health

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Total Files** | 154 | - | ✅ |
| **Connected Files** | 66 (42.9%) | 95% | 🔴 Critical |
| **Orphaned Files** | 93 (60.4%) | <5% | 🔴 Critical |
| **Link Density** | 1.08 links/file | >2.5 | 🔴 Critical |
| **Broken Links** | 0 | 0 | ✅ Perfect |

### File Distribution

```
📁 Scanned Directories:
  • weave-nn/docs: 75 files
  • weave-nn/_planning/phases: 35 files
  • weave-nn/_planning/specs: 35 files
  • weave-nn/_planning/research: 9 files
```

---

## 🔍 Discovery Results

### Connection Opportunities

**Total Suggestions**: 32 connections identified
**High Confidence**: 8 (>90% similarity)
**Medium Confidence**: 13 (70-90%)
**Low Confidence**: 11 (60-70%)

### Top 5 High-Confidence Connections

1. **Phase 6 Vault Initialization** (99.1% similarity)
   - Source: `_planning/phases/phase-6-vault-initialization.md`
   - Target: `_planning/specs/phase-6-vault-initialization/phase-6-vault-tasks.md`
   - Shared Topics: chunking, embeddings, learning-loop, phase-13, workflows, mcp, architecture, weaver

2. **Phase 5 MCP Integration** (95.2% similarity)
   - Source: `_planning/phases/phase-5-mcp-integration.md`
   - Target: `_planning/specs/phase-5-mcp-integration/phase-5-mcp-tasks.md`
   - Shared Topics: learning-loop, phase-13, workflows, mcp, architecture, weaver

3. **Phase 8 Git Automation** (92.5% similarity)
   - Source: `_planning/phases/phase-8-git-automation-workflow-proxy.md`
   - Target: `_planning/specs/phase-8-git-automation-workflow-proxy/tasks.md`
   - Shared Topics: embeddings, learning-loop, phase-13, workflows, architecture, weaver

4. **Phase 7 Agent Rules** (86.5% similarity)
   - Source: `_planning/phases/phase-7-agent-rules-memory-sync.md`
   - Target: `_planning/specs/phase-7-agent-rules-memory-sync/phase-7-agent-tasks.md`
   - Shared Topics: learning-loop, phase-13, workflows, mcp, architecture, weaver

5. **Weaver CLI Audit** (80.4% similarity)
   - Source: `docs/weaver-cli-integration-audit.md`
   - Target: `docs/weaver-cli-audit-summary.md`
   - Shared Topics: learning-loop, phase-13, workflows, mcp, architecture, weaver

---

## 🏷️ Topic Clusters (9 Identified)

| Topic | Files | Connections | Priority |
|-------|-------|-------------|----------|
| **architecture** | 145 | 26 | 🔴 High |
| **phase-13** | 143 | 31 | 🔴 High |
| **workflows** | 136 | 31 | 🔴 High |
| **weaver** | 135 | 31 | 🔴 High |
| **learning-loop** | 131 | 26 | 🟡 Medium |
| **mcp** | 124 | 20 | 🟡 Medium |
| **embeddings** | 84 | 18 | 🟢 Low |
| **chunking** | 56 | 11 | 🟢 Low |
| **phase-12** | 20 | 4 | 🟢 Low |

---

## 🔴 Critical Orphaned Files (Top 10)

High-priority files with no incoming/outgoing links:

1. `docs/weaver-cli-integration-audit.md` - Audit documentation
2. `docs/phase-12-workflow-inventory.md` - Workflow catalog
3. `docs/hive-mind/naming-metadata-audit.md` - Metadata standards
4. `docs/hive-mind/validation-checklist.md` - Validation procedures
5. `docs/hive-mind/risk-analysis.md` - Risk assessment
6. `docs/hive-mind/GRAPH-IMPROVEMENTS-COMPLETE.md` - Graph status (meta)
7. `docs/hive-mind/knowledge-graph-analysis.md` - Graph analysis (meta)
8. `docs/chunking-strategies-research-2024-2025.md` - Research findings
9. `docs/chunking-quick-reference.md` - Quick reference
10. `docs/TESTING-GUIDE.md` - Testing standards

---

## 📈 Comparison to Target State

### Current vs. Target

```
Orphaned Files:    ████████████████░░ 60.4% (Target: <5%)
Link Density:      ████░░░░░░░░░░░░░░ 1.08  (Target: >2.5)
Connected Files:   ████████░░░░░░░░░░ 42.9% (Target: >95%)
Broken Links:      ✓ 0% (PERFECT!)
```

### Gap Analysis

- **Orphan Rate Gap**: 55.4 percentage points above target
- **Link Density Gap**: 1.42 links/file below target
- **Connected Files Gap**: 52.1 percentage points below target

---

## 🚀 Immediate Action Items

### Week 1: High-Confidence Connections (Quick Wins)

**Implement 8 high-confidence connections (>90% similarity)**

These are phase/spec pairs that should already be linked:
- Phase 6 ↔ Phase 6 Specs (vault initialization)
- Phase 5 ↔ Phase 5 Specs (MCP integration)
- Phase 8 ↔ Phase 8 Specs (git automation)
- Phase 7 ↔ Phase 7 Specs (agent rules)

**Estimated Impact**:
- Orphan rate: 60.4% → 55%
- Link density: 1.08 → 1.3
- Connected files: 42.9% → 50%

### Week 2-3: Topic Cluster Reconnection

**Focus Areas**:
1. **Architecture cluster** (145 files, 26 connections)
2. **Phase-13 cluster** (143 files, 31 connections)
3. **Workflows cluster** (136 files, 31 connections)

**Estimated Impact**:
- Orphan rate: 55% → 20%
- Link density: 1.3 → 2.2
- Connected files: 50% → 80%

### Week 4: Final Validation

**Target Metrics**:
- Orphan rate: <5%
- Link density: >2.5
- Connected files: >95%
- Zero broken links: ✓ (already achieved)

---

## 📝 Data Sources

**Analysis Reports**:
- Link Structure: `/scripts/graph-tools/reports/link-analysis-1761659748747.json`
- Connection Discovery: `/scripts/graph-tools/reports/connections-1761659786681.json`

**Analysis Tools**:
- `analyze-links.ts` - Link structure analyzer
- `find-connections.ts` - Topical similarity engine
- `run-analysis.sh` - Automated analysis suite

---

## 🎯 Success Criteria

- [ ] Orphaned files <5% (currently 60.4%)
- [ ] Link density >2.5 (currently 1.08)
- [ ] Zero broken links (✓ achieved)
- [ ] All Phase 13 docs connected
- [ ] Chunking cluster complete
- [ ] Learning loop cluster connected
- [ ] Architecture cluster connected

---

## 📊 Metrics Storage

**Memory Key**: `graph/baseline-metrics`
**Timestamp**: 2025-10-28T13:55:48.747Z
**Status**: Critical - Immediate action required

---

**Next Steps**: Begin implementing high-confidence connections (Phase 1) using the connection suggestions report.
