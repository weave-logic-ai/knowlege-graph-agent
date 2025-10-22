---
tech_id: graphiti
category: knowledge-graph-engine
maturity: emerging
pros:
  - Temporal awareness built-in
  - Designed for LLM integration
  - Handles episodic memory naturally
  - Supports entity deduplication
cons:
  - Newer project with evolving API
  - Smaller community than traditional graph DBs
  - Python-focused implementation
use_case: LLM-powered applications requiring temporal knowledge graphs
---

# Graphiti

Graphiti is a temporal knowledge graph engine specifically designed for LLM-powered applications. Unlike traditional graph databases, it natively handles time-based relationships and episodic memory, making it particularly suited for systems that need to track how knowledge evolves across conversations or time periods.

## What It Does

Graphiti maintains knowledge graphs where nodes and edges carry temporal metadata, allowing queries about what was known at specific times or how relationships changed. It provides entity resolution to deduplicate similar concepts, episodic grouping to cluster related memories, and search capabilities that understand temporal context. The engine integrates with embedding models for semantic search and supports both structured queries and natural language retrieval.

## Why Consider It

For applications building long-term memory systems or knowledge bases that evolve through conversation, Graphiti's temporal awareness is fundamental rather than bolted-on. Traditional graph databases like Neo4j can model temporal data but require manual schema design and query complexity. Graphiti makes temporal reasoning first-class, simplifying queries like "what did we know about X before Y happened" or "how has this concept's relationships changed."

The LLM integration focus means it handles unstructured text input naturally, extracting entities and relationships without rigid schema requirements.

## Trade-offs

Graphiti is an emerging technology with a smaller ecosystem than established graph databases. Production deployments require evaluating stability, scaling characteristics, and operational maturity. The Python-centric implementation may require additional integration work for non-Python backends.

Traditional graph databases like Neo4j offer mature query languages (Cypher), extensive tooling, proven scalability, and large communities. They require more upfront modeling but provide battle-tested reliability. Graphiti trades maturity for temporal-native design and LLM-first architecture.

## Related Decisions

- **[Decision: Knowledge Graph Engine]** - Graphiti vs Neo4j vs PostgreSQL with graph extensions
- **[Decision: Temporal Data Model]** - How version history and time-awareness are implemented
- **[Decision: Backend Language]** - Python integration implications for Graphiti
