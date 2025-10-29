---
concept_id: C-001
concept_type: project
title: Weave-NN
status: active
category: core-concept
created_date: '2025-10-20'
last_updated: '2025-10-20'
version: '1.0'
author: Hive Mind (Claude)
ai_generated: true
related_concepts:
  - knowledge-graph
  - ai-generated-documentation
  - temporal-queries
  - wikilinks
related_decisions:
  - ED-1
  - TS-1
  - FP-1
tags:
  - project-identity
  - saas
  - ai-first
  - knowledge-graph
  - core-concept
type: concept
visual:
  icon: "\U0001F4A1"
  cssclasses:
    - type-concept
    - status-active
updated_date: '2025-10-28'
---

# Weave-NN

**Definition**: Weave-NN is a custom-built SaaS platform for transforming AI-generated markdown chaos into an intelligent, searchable, and collaborative [[knowledge-graph|knowledge graph]]. The name represents a Neural Network of interconnected knowledge, woven together by AI and humans.

---

## Core Concept

Weave-NN addresses the "growing markdown problem" - the challenge of managing massive volumes of AI-generated documentation, analysis, planning notes, and daily development logs. As AI systems (Claude, GPT, etc.) produce increasingly large amounts of markdown content, traditional note-taking tools fail to provide adequate organization, discoverability, and collaboration capabilities.

Unlike existing platforms retrofitted for AI workflows, Weave-NN is **AI-first by design** - built specifically for AI-human collaboration rather than adapted from traditional knowledge management tools.

---

## Key Differentiators

1. **AI-First Architecture**: Native integration with AI agents via [[../mcp/model-context-protocol|Model Context Protocol (MCP)]], enabling automated graph building and content generation
2. **Temporal Awareness**: Track how knowledge evolves over time using [[temporal-queries|temporal queries]] powered by Graphiti
3. **Knowledge Graph Core**: Graph visualization isn't an add-on - it's the primary interface for navigating interconnected knowledge
4. **Markdown Native**: Plain text files, Git-friendly, future-proof storage with [[wikilinks|wikilink]] support
5. **Web-First Collaboration**: Real-time multi-user editing and graph exploration from any browser

---

## Value Proposition

**Target Problem**: AI can produce massive amounts of markdown content quickly, but without proper organization and linking, this creates information overload rather than actionable knowledge.

**Solution**: Weave-NN transforms disconnected markdown files into a living knowledge graph where:
- AI agents automatically create and link documents
- Users discover insights through visual graph navigation
- Teams collaborate in real-time on shared knowledge
- Historical context is preserved through temporal queries
- Curation workflows prevent knowledge decay

---

## Architecture Philosophy

Weave-NN follows a **multi-tenant SaaS architecture** (see [[../decisions/executive/project-scope|ED-1]]) designed from day one for:
- **Google Cloud deployment** (Cloud Run, Vertex AI, Cloud SQL)
- **Workspace isolation** with row-level security
- **Scalability** from solo developers to enterprise teams
- **Dual purpose** as internal tool and commercial product

---

## Target Users

1. **AI-Native Development Teams**: Teams using Claude/ChatGPT heavily for code and architecture planning
2. **Technical Writers**: Managing large documentation sets with complex interconnections
3. **Researchers**: Building literature reviews and concept maps
4. **Product Teams**: Tracking decisions, planning documents, and analysis over time
5. **Solo Developers**: Managing personal knowledge bases and daily development notes

---

## Related Concepts

- [[knowledge-graph|Knowledge Graph]] - Core visualization and navigation model
- [[ai-generated-documentation|AI-Generated Documentation]] - Primary content source
- [[temporal-queries|Temporal Queries]] - Time-aware knowledge retrieval
- [[wikilinks|Wikilinks]] - Linking mechanism for graph connections
- [[../architecture/hybrid-approach|Hybrid Approach]] - Development strategy

---

## Related Decisions

- [[../decisions/executive/project-scope|ED-1: Project Scope]] - SaaS architecture decision
- [[../decisions/technical/frontend-framework|TS-1: Frontend Framework]] - Technology stack
- [[../decisions/features/mvp-features|FP-1: MVP Features]] - Feature prioritization

---

## Implementation Status

**Phase**: Planning & Architecture
**Decision Progress**: 1.5/23 decisions made (6%)
**Critical Blockers**: 8 decisions pending

See [[../INDEX|Main Index]] for full project status and [[../decisions/INDEX|Decision Hub]] for open decisions.

---

**Back to**: [[../INDEX|Main Index]] | [[../concepts/|Concepts]]
