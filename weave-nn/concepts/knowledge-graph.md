---
concept_id: C-002
concept_type: technical-concept
title: Knowledge Graph
status: active
category: core-concept
created_date: '2025-10-20'
last_updated: '2025-10-20'
version: '1.0'
author: Hive Mind (Claude)
ai_generated: true
related_concepts:
  - weave-nn
  - wikilinks
  - temporal-queries
  - ai-generated-documentation
related_decisions:
  - TS-2
  - FP-1
tags:
  - graph-visualization
  - data-structure
  - core-concept
  - navigation
type: concept
domain: knowledge-graph
visual:
  icon: 💡
  cssclasses:
    - type-concept
    - status-active
    - domain-knowledge-graph
updated_date: '2025-10-28'
icon: 💡
---

# Knowledge Graph

**Definition**: A knowledge graph is a network of interconnected entities (nodes) and relationships (edges) that represents knowledge in a structured, queryable, and visually navigable format. In [[weave-nn|Weave-NN]], the knowledge graph transforms markdown documents into an interactive web of concepts.

---

## Core Concept

Traditional file systems organize documents hierarchically (folders and files), making it difficult to discover non-hierarchical relationships between concepts. Knowledge graphs solve this by:

1. **Representing documents as nodes** - Each markdown file becomes a node with metadata
2. **Creating explicit relationships** - [[wikilinks|Wikilinks]] and references become edges
3. **Enabling graph traversal** - Navigate from concept to related concepts visually
4. **Supporting semantic queries** - Find documents by meaning, not just keywords

---

## Implementation in Weave-NN

### Node Types
- **Document Node**: Markdown files with content
- **Tag Node**: Organizational categories
- **Concept Node**: Abstract ideas referenced across documents
- **User Node**: Contributors to the knowledge graph
- **Date Node**: Temporal anchors for time-based queries

### Edge Types
- **References**: `[[wikilink]]` connections between documents
- **Related**: Semantic similarity detected by AI
- **Parent-Child**: Hierarchical relationships
- **Temporal**: Time-ordered sequences of related content
- **Contradicts/Extends**: Logical relationships between ideas

---

## Visualization Features

Knowledge graphs in Weave-NN provide:

- **Interactive exploration**: Drag, zoom, pan through interconnected nodes
- **Filtering**: View subgraphs by tag, date range, author, or AI vs human content
- **Search highlighting**: Visual emphasis on nodes matching search queries
- **Layout algorithms**: Force-directed, hierarchical, or custom arrangements
- **Minimap navigation**: Bird's-eye view of large graphs
- **Click-to-edit**: Open markdown editor directly from graph nodes

---

## Platforms Compared

| Platform | Native Graph | Visualization Quality | Customization |
|----------|--------------|----------------------|---------------|
| **Obsidian** | ✅ Built-in | Basic 2D | Limited (CSS only) |
| **Notion** | ❌ None | None (3rd party req.) | N/A |
| **Weave-NN** | ✅ Core feature | Advanced (React/Svelte Flow) | Fully customizable |

Obsidian provides a basic graph view, but Weave-NN's custom implementation using [[../technical/react-flow|React Flow]] or [[../technical/svelte-flow|Svelte Flow]] enables advanced features like custom node rendering, programmatic layouts, and real-time collaborative graph editing.

---

## Temporal Knowledge Graphs

Standard knowledge graphs represent current state only. [[temporal-queries|Temporal knowledge graphs]] (powered by [[../technical/graphiti|Graphiti]]) add time awareness:

- **Point-in-time queries**: "Show the knowledge graph as it existed on Oct 15"
- **Evolution tracking**: "How did our authentication architecture decisions change over time?"
- **Invalidation detection**: Automatically flag facts that became outdated
- **Version history**: Track document modifications within graph context

---

## Graph-Driven Workflows

1. **Discovery**: Click a planning document → see related analysis and decisions
2. **AI Linking**: AI generates new document → auto-suggests connections to existing nodes
3. **Curation**: Find isolated nodes (no connections) → link or archive
4. **Change Impact**: User edits core concept → highlight all dependent documents
5. **Collaboration**: Multiple users navigate and edit graph simultaneously

---

## Related Concepts

- [[weave-nn|Weave-NN]] - Project using knowledge graphs as primary interface
- [[wikilinks|Wikilinks]] - Syntax for creating graph edges
- [[temporal-queries|Temporal Queries]] - Time-aware graph queries
- [[ai-generated-documentation|AI-Generated Documentation]] - Primary source of graph nodes
- [[../features/knowledge-graph-visualization|Graph Visualization Feature]]

---

## Related Decisions

- [[../decisions/technical/graph-visualization|TS-2: Graph Visualization Library]] - React Flow vs Svelte Flow
- [[../decisions/features/mvp-features|FP-1: MVP Features]] - Graph scope for initial release
- [[../decisions/open-questions/Q-TECH-001|Q-TECH-001]]: Performance at 10k+ nodes

---

## Key References

**Platform Analysis**: See [[../platform-analysis|Platform Analysis]] sections on "Knowledge Graph Visualization" and "MCP Integration"

**Technical Stack**: [[../custom-solution-analysis|Custom Solution Analysis]] provides detailed implementation approaches using React Flow and Svelte Flow libraries.

---

**Back to**: [[../INDEX|Main Index]] | [[../concepts/|Concepts]]
