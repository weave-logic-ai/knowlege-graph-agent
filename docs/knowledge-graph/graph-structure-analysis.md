---
title: Knowledge Graph Structure Analysis
date: {}
tags:
  - knowledge-graph
  - analysis
  - metadata
  - structure
status: complete
type: research-report
domain: knowledge-graph
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-research-report
    - status-complete
    - domain-knowledge-graph
version: '3.0'
updated_date: '2025-10-28'
---

# Knowledge Graph Structure Analysis

**Research Agent Report**
**Date:** 2025-10-28
**Mission:** Complete scan and analysis of weave-nn knowledge graph structure

## Executive Summary

The weave-nn repository contains **1,426 markdown files** forming a knowledge graph with **4,952 wikilinks** connecting **374 files** (26% of total). The graph shows significant fragmentation with **970 disconnected nodes** (68% of total files). Only 32% of files have YAML frontmatter, indicating incomplete metadata coverage.

### Key Findings

- **Total Files:** 1,426 markdown files
- **Connected Files:** 456 (32%)
- **Disconnected Files:** 970 (68%)
- **Files with Wikilinks:** 374 (26%)
- **Total Wikilinks:** 4,952
- **Unique Link Targets:** 1,856
- **Average Links/File:** 3.47
- **Files with Frontmatter:** 463 (32%)

### Critical Issues

1. **Massive Disconnection:** 68% of files have no incoming or outgoing links
2. **Low Metadata Coverage:** Only 32% of files have YAML frontmatter
3. **Fragmented by Directory:** Most disconnected files are in `.claude/checkpoints` (469 files)
4. **Generic Naming:** 14 files with generic names (README, INDEX, TASKS) are disconnected

---

## Detailed Statistics

### File Distribution by Directory

| Count | Directory |
|-------|-----------|
| 469 | `.claude/checkpoints` |
| 86 | `weaver/docs` |
| 78 | `weave-nn/docs` |
| 28 | `weave-nn/.archive/features` |
| 24 | `weave-nn/_planning/phases` |
| 19 | `.claude/commands/github` |
| 18 | `.claude/commands/sparc` |
| 17 | `.claude/commands/swarm` |
| 16 | `weave-nn/concepts` |
| 16 | `weave-nn/technical` |
| 14 | `weave-nn/decisions/technical` |
| 13 | `.claude/agents/github` |
| 13 | `weave-nn/templates` |
| 12 | `.claude/commands/hive-mind` |
| 12 | `weave-nn/.archive/technical/future-web-version` |
| 11 | `weave-nn/workflows` |
| 11 | `weave-nn/mcp` |
| 11 | Root directory |
| 10 | `weave-nn/features` |
| 10 | `weave-nn/research` |

### Link Statistics

- **Total Wikilinks Found:** 4,952
- **Files with Wikilinks:** 374 (26%)
- **Unique Link Targets:** 1,856
- **Average Links per File:** 3.47
- **Files with Connections:** 456 (32%)

---

## Top 20 Most Connected Nodes

### 1. `weave-nn/.archive/_planning/decision-review-2025-10-20.md`
- **Incoming:** 3 | **Outgoing:** 181 | **Total:** 184
- Comprehensive decision review document

### 2. `weave-nn/_planning/PLANNING-DIRECTORY-HUB.md`
- **Incoming:** 4 | **Outgoing:** 119 | **Total:** 123
- Central planning directory hub

### 3. `weave-nn/docs/DOCS-DIRECTORY-HUB.md`
- **Incoming:** 7 | **Outgoing:** 107 | **Total:** 114
- Main documentation hub

### 4. `weave-nn/.archive/meta/meta-archive-index.md`
- **Incoming:** 0 | **Outgoing:** 101 | **Total:** 101
- Archive index (no incoming links - potential orphan)

### 5. `weave-nn/standards/markup/wikilinks.md`
- **Incoming:** 26 | **Outgoing:** 68 | **Total:** 94
- Wikilink standards document

### 6. `weave-nn/docs/PROJECT-TIMELINE.md`
- **Incoming:** 28 | **Outgoing:** 59 | **Total:** 87
- Project timeline reference

### 7. `weave-nn/patterns/patterns-catalog-hub.md`
- **Incoming:** 0 | **Outgoing:** 85 | **Total:** 85
- Patterns catalog (no incoming links)

### 8. `weave-nn/_planning/phases/phase-13-master-plan.md`
- **Incoming:** 60 | **Outgoing:** 23 | **Total:** 83
- **MOST REFERENCED:** 60 incoming links

### 9. `weave-nn/_planning/phases/navigation-optimization-analysis.md`
- **Incoming:** 0 | **Outgoing:** 76 | **Total:** 76
- Navigation analysis (no incoming links)

### 10. `weave-nn/_planning/phases/phase-14-obsidian-integration.md`
- **Incoming:** 14 | **Outgoing:** 51 | **Total:** 65
- Phase 14 planning

### 11. `weave-nn/weaver/WEAVER-IMPLEMENTATION-HUB.md`
- **Incoming:** 8 | **Outgoing:** 51 | **Total:** 59
- Weaver implementation hub

### 12. `weave-nn/decisions/decision-records-index.md`
- **Incoming:** 0 | **Outgoing:** 58 | **Total:** 58
- Decision records index (no incoming links)

### 13. `weave-nn/mcp/agent-rules.md`
- **Incoming:** 7 | **Outgoing:** 50 | **Total:** 57
- Agent rules documentation

### 14. `weave-nn/concepts/wikilinks.md`
- **Incoming:** 26 | **Outgoing:** 30 | **Total:** 56
- Wikilink concepts

### 15. `weave-nn/_planning/VAULT-ARCHITYPE-ANALYSIS.md`
- **Incoming:** 1 | **Outgoing:** 55 | **Total:** 56
- Vault architecture analysis

### 16. `weave-nn/concept-map.md`
- **Incoming:** 7 | **Outgoing:** 48 | **Total:** 55
- Conceptual map

### 17. `weave-nn/workflows/node-creation-process.md`
- **Incoming:** 11 | **Outgoing:** 44 | **Total:** 55
- Node creation workflow

### 18. `weave-nn/docs/WEAVER-COMPLETE-IMPLEMENTATION-GUIDE.md`
- **Incoming:** 32 | **Outgoing:** 20 | **Total:** 52
- **HIGHLY REFERENCED:** Complete implementation guide

### 19. `weave-nn/standards/markup/yaml-frontmatter.md`
- **Incoming:** 3 | **Outgoing:** 47 | **Total:** 50
- Frontmatter standards

### 20. `weave-nn/.archive/n8n-legacy/n8n-workflow-automation.md`
- **Incoming:** 8 | **Outgoing:** 42 | **Total:** 50
- Legacy workflow automation

---

## Most Referenced Link Targets (Top 20)

These are the most common wikilink targets in the knowledge graph:

1. `[[phase-13-master-plan]]` - **60 references**
2. `[[README]]` - **32 references**
3. `[[WEAVER-COMPLETE-IMPLEMENTATION-GUIDE]]` - **32 references**
4. `[[PROJECT-TIMELINE]]` - **28 references**
5. `[[../architecture/mcp-server]]` - **28 references**
6. `[[wikilinks]]` - **26 references**
7. `[[model-context-protocol]]` - **25 references**
8. `[[git-integration]]` - **23 references**
9. `[[knowledge-graph]]` - **22 references**
10. `[[ai-agent-integration]]` - **21 references**
11. `[[obsidian-api-client]]` - **21 references**
12. `[[../features/auto-tagging]]` - **19 references**
13. `[[../architecture/event-consumer]]` - **19 references**
14. `[[../features/daily-log-automation]]` - **19 references**
15. `[[../INDEX]]` - **19 references**
16. `[[CHUNKING-STRATEGY-SYNTHESIS]]` - **18 references**
17. `[[docs/local-first-architecture-overview]]` - **18 references**
18. `[[../decisions/executive/project-scope]]` - **18 references**
19. `[[../technical/supabase]]` - **18 references**
20. `[[F-018-semantic-bridge-builder]]` - **18 references**

---

## Disconnected Nodes Analysis

**Total Disconnected Files:** 970 (68% of all files)

### Disconnected Files by Directory

| Count | Directory |
|-------|-----------|
| 469 | `.claude/checkpoints` |
| 138 | `.claude/commands` |
| 98 | `weaver/docs` |
| 66 | `.claude/agents` |
| 30 | `weave-nn/_planning` |
| 23 | `.claude/skills` |
| 15 | `weave-nn/weaver` |
| 11 | `weave-nn/.archive` |
| 9 | `weave-nn/_sops` |
| 8 | `weave-nn/docs` |
| 7 | `docs/migration-analysis` |
| 7 | `weaver/tests` |
| 6 | `weave-nn/research` |
| 5 | `.claude/sessions` |
| 5 | `.venv/lib` |
| 5 | `docs/research` |
| 4 | `weave-nn/decisions` |
| 4 | `weaver/src` |
| 4 | `weaver/scripts` |

### Critical Observations

1. **Checkpoints Isolation:** 469 checkpoint files (33% of total files) are completely disconnected
2. **Command Documentation:** 138 command files in `.claude/commands` are not linked
3. **Weaver Docs:** 98 files in `weaver/docs` lack graph integration
4. **Agent Definitions:** 66 agent definition files are isolated

### Generic Named Disconnected Files

These files have generic names and no connections, making them hard to discover:

1. `docs/research/WORKFLOW-DEV-RESEARCH-INDEX.md`
2. `weave-nn/.archive/index.md`
3. `weave-nn/.archive/legacy-phases/mvp-python-stack/phase-6-tasks.md`
4. `weave-nn/_planning/daily-logs/daily-logs-index-hub.md`
5. `weave-nn/_planning/specs/phase-11-cli-service-management/phase-11-cli-tasks.md`
6. `weave-nn/_planning/specs/phase-5/phase-5-tasks.md`
7. `weave-nn/guides/guides-index-hub.md`
8. `weave-nn/weaver/docs/EXPERIENCE-INDEXING-IMPLEMENTATION-SUMMARY.md`
9. `weaver/docs/DOCUMENTATION-INDEX.md`
10. `weaver/docs/INDEX-EXPORTS-COMPLETE.md`
11. `weaver/docs/PHASE-5-TASKS-5-7-COMPLETION-REPORT.md`
12. `weaver/docs/PHASE-6-INDEX.md`
13. `weaver/docs/TEST-RESULTS-PHASE-5-TASKS-18-19.md`
14. `weaver/scripts/sops/sops-scripts-index.md`

---

## Sample Disconnected Files (Top 50)

### `.claude-plugin` Directory
- `.claude-plugin/claude-plugin-hub.md`
- `.claude-plugin/docs/INSTALLATION.md`
- `.claude-plugin/docs/PLUGIN_SUMMARY.md`
- `.claude-plugin/docs/QUICKSTART.md`
- `.claude-plugin/docs/STRUCTURE.md`

### `.claude/agents` Directory
- `.claude/agents/MIGRATION_SUMMARY.md`
- `.claude/agents/agents-hub.md`
- `.claude/agents/analysis/code-analyzer.md`
- `.claude/agents/analysis/code-review/analyze-code-quality.md`
- `.claude/agents/architecture/system-design/arch-system-design.md`
- `.claude/agents/base-template-generator.md`
- `.claude/agents/consensus/consensus-hub.md`
- `.claude/agents/core/coder.md`
- `.claude/agents/core/planner.md`
- `.claude/agents/core/researcher.md`
- `.claude/agents/core/reviewer.md`
- `.claude/agents/core/tester.md`

### `.claude/agents/flow-nexus` Directory
- `.claude/agents/flow-nexus/app-store.md`
- `.claude/agents/flow-nexus/challenges.md`
- `.claude/agents/flow-nexus/payments.md`
- `.claude/agents/flow-nexus/sandbox.md`
- `.claude/agents/flow-nexus/swarm.md`
- `.claude/agents/flow-nexus/user-tools.md`
- `.claude/agents/flow-nexus/workflow.md`

### `.claude/agents/github` Directory
- `.claude/agents/github/code-review-swarm.md`
- `.claude/agents/github/github-modes.md`
- `.claude/agents/github/issue-tracker.md`
- `.claude/agents/github/pr-manager.md`
- `.claude/agents/github/project-board-sync.md`
- `.claude/agents/github/release-manager.md`
- `.claude/agents/github/release-swarm.md`
- `.claude/agents/github/repo-architect.md`
- `.claude/agents/github/sync-coordinator.md`
- `.claude/agents/github/workflow-automation.md`

### `.claude/agents/hive-mind` Directory
- `.claude/agents/hive-mind/collective-intelligence-coordinator.md`
- `.claude/agents/hive-mind/queen-coordinator.md`
- `.claude/agents/hive-mind/scout-explorer.md`
- `.claude/agents/hive-mind/swarm-memory-manager.md`
- `.claude/agents/hive-mind/worker-specialist.md`

### `.claude/agents/optimization` Directory
- `.claude/agents/optimization/benchmark-suite.md`
- `.claude/agents/optimization/load-balancer.md`
- `.claude/agents/optimization/optimization-hub.md`
- `.claude/agents/optimization/performance-monitor.md`
- `.claude/agents/optimization/resource-allocator.md`
- `.claude/agents/optimization/topology-optimizer.md`

---

## Recommendations

### High Priority

1. **Connect Hub Files**
   - Link all `-hub.md` files to parent directories
   - Create bidirectional links between hubs and content
   - Ensure all index files have incoming links

2. **Add Frontmatter**
   - Add YAML frontmatter to 963 files (68%) missing it
   - Include: title, tags, date, status, type
   - Follow `weave-nn/standards/markup/yaml-frontmatter.md`

3. **Connect Agent Documentation**
   - Link all 66 agent files in `.claude/agents`
   - Create agent catalog with bidirectional links
   - Link to relevant workflows and commands

4. **Integrate Command Documentation**
   - Connect 138 command files in `.claude/commands`
   - Create command index with categories
   - Link to agent definitions and workflows

### Medium Priority

5. **Checkpoint Integration**
   - Create checkpoint index/timeline
   - Link to relevant phase documents
   - Add contextual links from 469 checkpoint files

6. **Weaver Documentation**
   - Connect 98 isolated weaver/docs files
   - Link to implementation guides
   - Create documentation map

7. **Research Integration**
   - Link research files to decisions
   - Connect to implementation documents
   - Create research timeline

### Low Priority

8. **Archive Cleanup**
   - Review 28 archived feature files
   - Link relevant archived content to current docs
   - Mark obsolete content clearly

9. **Test Documentation**
   - Connect test files to implementation
   - Link to relevant features
   - Create test coverage map

---

## Metadata Coverage Analysis

### Current State
- **Files with Frontmatter:** 463 (32%)
- **Files without Frontmatter:** 963 (68%)

### Missing Frontmatter by Directory
Most disconnected files also lack frontmatter:
- `.claude/checkpoints`: ~469 files (likely auto-generated)
- `.claude/commands`: ~138 files
- `weaver/docs`: ~98 files
- `.claude/agents`: ~66 files

### Recommended Frontmatter Fields
Based on `weave-nn/standards/markup/yaml-frontmatter.md`:
```yaml
---
title: Document Title
date: YYYY-MM-DD
tags: [tag1, tag2, tag3]
status: draft|active|complete|archived
type: decision|feature|technical|planning|research
---
```

---

## Graph Health Metrics

### Connectivity
- **Connected Ratio:** 32% (456/1,426)
- **Disconnected Ratio:** 68% (970/1,426)
- **Link Density:** 3.47 links/file average
- **Hub Nodes:** 20 files with 50+ connections

### Quality Indicators
- ✅ Strong hub files exist (180+ connections)
- ✅ Clear phase documentation with high reference count
- ⚠️ Many hub files have 0 incoming links (orphaned)
- ❌ 68% of files completely disconnected
- ❌ Only 32% have metadata frontmatter

### Graph Types Detected
1. **Hub-and-Spoke:** Planning and docs directories
2. **Isolated Clusters:** Agent definitions, commands
3. **Linear Chains:** Phase documents
4. **Orphaned Nodes:** 970 files with no connections

---

## Next Steps

### Immediate Actions
1. Run mass connection script for hub files
2. Add frontmatter to top 100 most-referenced files
3. Create agent catalog with bidirectional links
4. Connect command documentation to workflows

### Phase-Based Integration
- **Phase 1:** Connect all hub files and indexes
- **Phase 2:** Add frontmatter to all active documents
- **Phase 3:** Integrate agent and command documentation
- **Phase 4:** Create timeline/checkpoint navigation
- **Phase 5:** Archive cleanup and obsolete content marking

### Automation Opportunities
1. Auto-generate frontmatter for files lacking it
2. Create bidirectional link checker
3. Build orphaned node reporter
4. Generate link suggestion tool based on content similarity

---

## Appendix: Analysis Methodology

### Data Collection
1. **File Discovery:** `find . -name "*.md"` (excluding node_modules, .git)
2. **Wikilink Extraction:** Regex pattern `\[\[([^\]]+)\]\]`
3. **Frontmatter Detection:** YAML frontmatter pattern `^---\n.*\n---\n`
4. **Link Analysis:** Bidirectional connection tracking

### Tools Used
- Python 3 for file parsing and analysis
- Regex for wikilink extraction
- File system traversal for directory statistics

### Limitations
- Does not analyze link quality or relevance
- Cannot detect broken links (targets that don't exist)
- Relative path links may not be fully resolved
- Some files may have non-standard wikilink syntax

---

**Report Generated:** 2025-10-28
**Total Files Analyzed:** 1,426
**Analysis Duration:** ~5 minutes
**Research Agent:** Claude (Researcher Role)
