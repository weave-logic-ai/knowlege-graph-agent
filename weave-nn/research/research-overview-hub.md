---
title: Research Directory
type: directory_index
status: in-progress
tags:
  - research
  - meta
  - type/hub
  - status/in-progress
priority: high
visual:
  icon: "\U0001F4C4"
  color: '#4A90E2'
  cssclasses:
    - type-directory_index
    - priority-high
  graph_group: navigation
updated: '2025-10-29T04:55:03.759Z'
version: '3.0'
keywords:
  - purpose
  - related
  - directory organization
  - academic research
  - implementation research
  - status snapshots
  - relationship to implementation
  - tagging strategy
  - primary tags
  - secondary tags
---

# Research Directory

This directory contains research papers, findings, and analysis that inform Weave-NN's implementation decisions.

## Purpose

- **Background Research**: Academic papers and industry research
- **Implementation Analysis**: Technical analysis guiding architecture decisions
- **Status Snapshots**: Point-in-time research findings
- **Filtering**: Use `#research` tag to filter out from main graph view

---



## Related

[[RESEARCH-DIRECTORY-HUB]]
## Directory Organization

### Academic Research
Papers and research syntheses that provide theoretical foundation:
- **Memory Networks**: Neural network and knowledge graph design
- **Multi-Graph Systems**: Knowledge systems for project learning
- **Semantic Search**: Vector databases and embeddings

### Implementation Research
Technical analysis and findings that directly inform implementation:
- **Architecture Analysis**: System design patterns
- **FastMCP Research**: MCP framework integration
- **Memory Design**: Memory architecture patterns
- **Day 2/4/11 Research**: Sprint-specific research findings

### Status Snapshots
Point-in-time research and integration status:
- **MCP SDK Integration Status**: MCP integration progress

---

## Relationship to Implementation

Research documents maintain bidirectional links to implementation:

```
Research Finding
    ↓ (informs)
Architecture Decision
    ↓ (guides)
Implementation (Features, Code)
    ↓ (validates)
Research Learning (new insights)
```

---

## Tagging Strategy

All research documents use hierarchical tags for filtering:

### Primary Tags
- `#research` - All research documents
- `#academic` - Academic papers and syntheses
- `#implementation` - Direct implementation research
- `#status-snapshot` - Point-in-time status reports

### Secondary Tags
- `#architecture` - Architecture and system design
- `#mcp` - MCP framework related
- `#memory` - Memory systems and design
- `#knowledge-graph` - Knowledge graph research
- `#complete` - Research that led to completed implementation

### Example Frontmatter
```yaml
---
type: research
research_type: implementation
status: complete
tags:
  - research
  - implementation
  - architecture
  - complete
related_decisions:
  - [[decisions/technical/architecture-patterns]]
related_features:
  - [[features/obsidian-integration]]
---
```

---

## Filtering Research from Graph View

In Obsidian graph view, use query:
```
-tag:#research
```

This excludes research nodes while showing implemented features and decisions.

To view **only** research:
```
tag:#research
```

To view research and related implementation:
```
tag:#research OR tag:#implementation
```

---

## Research → Implementation Workflow

### 1. Research Phase
- Create research document in `research/`
- Tag with `#research` and specific tags
- Link to related questions/decisions

### 2. Analysis Phase
- Extract architectural decisions
- Create decision nodes in `decisions/technical/`
- Link research → decisions

### 3. Implementation Phase
- Implement features based on decisions
- Link decisions → features
- Update research with `#complete` tag

### 4. Learning Phase
- Extract lessons learned
- Update research with new insights
- Create new research documents if needed

---

## Current Research Documents

### Academic Papers (3)
1. [[research/memory-networks-research]] - Memory Networks and Knowledge Graph Design
2. [[research/multi-graph-knowledge-systems]] - Multi-Graph Knowledge Systems
3. [[research/multi-project-platform]] - Multi-Project AI Development Platform

### Implementation Research (4)
1. [[research/architecture-analysis]] - Comprehensive architecture analysis (93KB)
2. [[research/fastmcp-research-findings]] - FastMCP integration patterns
3. [[research/memory-design]] - Memory architecture design
4. [[research/day-2-4-11-research-findings]] - Sprint research (48KB) - COMPLETE

### Status Snapshots (1)
1. [[research/mcp-sdk-integration-status]] - MCP SDK integration progress

---

## Maintenance

### Adding New Research
1. Create document in `research/`
2. Add proper frontmatter with tags
3. Link to related questions/decisions
4. Update this README

### Archiving Completed Research
Research that led to completed implementation should:
- Add `#complete` tag
- Link to implementation
- Stay in `research/` (not archived)
- Serve as historical reference

### Moving to Archive
Only move to archive if:
- Research was superseded by better research
- Research led to rejected approach
- Research is no longer relevant

---

**Last Updated**: 2025-10-22
**Total Research Documents**: 8
**Active Research**: 7
**Completed Research**: 1
