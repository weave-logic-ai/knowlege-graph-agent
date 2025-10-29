---
type: index
title: Architecture Documentation Hub
status: active
created_date: '2025-10-23'
cssclasses:
  - index
  - navigation
  - architecture
tags:
  - index
  - architecture
  - navigation
  - documentation
  - system-design
scope: system
priority: high
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-index
    - status-active
    - priority-high
  graph_group: navigation
version: '3.0'
updated_date: '2025-10-28'
---

# Architecture Documentation

**Location**: `/architecture/`
**Parent**: [[../README|Vault Home]]

---

## Overview

System architecture documentation for Weave-NN's layered design. This directory contains comprehensive documentation of how Weave-NN's components interact across multiple architectural layers.

---

## Architecture Layers

### Data & Knowledge Layer

The foundation layer handling data storage and knowledge representation:

- [[data-knowledge-layer|Data & Knowledge Layer]] - Vault storage, shadow cache (SQLite), knowledge graph structure
- [[components/property-visualizer|Property Visualizer]] - Metadata analytics and visualization
- [[components/rule-engine|Rule Engine]] - Agent automation framework and rule execution

### API Layer

Integration and service layer:

- [[api-layer|API Layer]] - REST API design, MCP server architecture, Weaver proxy patterns

### Frontend Layer (Future)

User interface and visualization (post-MVP):

- [[frontend-layer|Frontend Layer]] - Web UI design, graph visualization, interactive editing

### AI Integration Layer

Intelligence and automation layer:

- [[ai-integration-layer|AI Integration Layer]] - Memory priming, agent rules, context management

---

## Architecture Philosophies

### Obsidian-First Design

- [[obsidian-first-architecture|Obsidian-First Architecture]] - Design philosophy prioritizing Obsidian compatibility
- [[obsidian-native-integration-analysis|Obsidian Native Integration]] - Analysis of native plugin vs MCP approach

### Multi-Project Vision

- [[cross-project-knowledge-retention|Cross-Project Knowledge Retention]] - Sharing knowledge across projects
- [[multi-project-ai-platform|Multi-Project AI Platform]] - Future multi-project platform vision

---

## Component Architecture

### Core Components

Detailed component specifications:

- **Property Visualizer** - See [[components/property-visualizer|Property Visualizer]]
- **Rule Engine** - See [[components/rule-engine|Rule Engine]]

---

## Related Documentation

### Implementation Details
- [[../docs/monorepo-structure|Monorepo Structure]] - Full microservices architecture
- [[../docs/monorepo-structure-mvp|Monorepo Structure (MVP)]] - MVP directory structure
- [[../docs/local-first-architecture-overview|Local-First Architecture]] - Core architectural principles

### Technical Stack
- [[../technical/README|Technical Stack]] - Technologies and frameworks
- [[../mcp/README|MCP Documentation]] - Model Context Protocol integration
- [[../integrations/README|Integrations]] - External service integrations

### Patterns
- [[../patterns/README|Patterns]] - Architectural, design, and integration patterns

---

**Last Updated**: 2025-10-23
**Status**: Active - MVP architecture finalized
**Next Review**: After MVP implementation (Phase 6-7)
