---
feature_id: F-105
feature_name: AI-Powered Automatic Link Suggestions
category: ai
status: planned
priority: high
release: v1.1
complexity: complex
dependencies:
  requires:
    - F-004
    - F-101
  blocks: []
related_decisions:
  - '[[../decisions/features/ai-integration]]'
tags:
  - feature
  - ai
  - v1.1
  - automation
  - linking
type: documentation
scope: feature
visual:
  icon: 📚
  color: '#06B6D4'
  cssclasses:
    - type-documentation
    - status-planned
    - priority-high
version: '3.0'
updated_date: '2025-10-28'
icon: 📚
---

# AI-Powered Automatic Link Suggestions

Intelligent suggestions for creating wikilinks between nodes based on semantic similarity, helping users build a more connected knowledge graph without manual effort.

## User Story

As a knowledge worker, I want AI to suggest relevant links to existing nodes while I write so that I can build a well-connected knowledge graph without having to remember everything I've written before.

## Key Capabilities

- **Contextual suggestions**: AI analyzes current content and suggests relevant existing nodes
- **Inline suggestions**: Non-intrusive suggestions appear as you type
- **Batch linking**: Review and apply multiple link suggestions at once
- **Confidence scoring**: Show how confident the AI is about each suggestion
- **Smart ranking**: Prioritize suggestions based on relevance and recency
- **Bidirectional awareness**: Suggest creating backlinks where appropriate
- **Learning system**: Improve suggestions based on user acceptance/rejection patterns

## Dependencies

- Requires: [[ai-integration-component]] - MCP/AI infrastructure
- Requires: [[node-search]] - Search indexing for candidate matching
- Works with: [[semantic-search]] - Shared semantic understanding
- Works with: [[wikilink-autocomplete]] - UI integration

## Implementation Notes

**Complexity**: Complex (1-2 months)

This feature requires sophisticated AI integration beyond basic MCP server capabilities. Need to build semantic understanding of content, efficient similarity matching, and smart ranking algorithms.

Key challenges:
- Real-time semantic analysis without UI lag
- Avoiding false positives (irrelevant suggestions)
- Balancing suggestion frequency (not overwhelming users)
- Privacy considerations for AI processing
- Cost optimization for API-based AI services

Technical approach:
- Use embeddings (OpenAI/local models) for semantic similarity
- Build vector search index (pgvector in PostgreSQL)
- Implement debounced suggestion triggers
- Cache embeddings for existing nodes
- Allow user configuration of suggestion aggressiveness









## Related

[[sharing]]
## Related

[[comments-annotations]]
## Related

[[version-history]]
## Related

[[collaborative-editing]]
## Related

- [[../mcp/ai-agent-integration|AI Agent Integration]]
- [[../concepts/wikilinks|Wikilinks]]
- [[semantic-search|Semantic Search]]
- [[wikilink-autocomplete|Wikilink Autocomplete]]
