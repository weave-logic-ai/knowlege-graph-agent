---
feature_id: "F-003"
feature_name: "Wikilink Autocomplete"
category: "editor"
status: "planned"
priority: "high"
release: "mvp"
complexity: "moderate"

dependencies:
  requires: ["F-002"]
  blocks: []

related_decisions:
  - "[[../decisions/technical/markdown-editor]]"

tags:
  - feature
  - editor
  - mvp
  - high-priority
---

# Wikilink Autocomplete

Intelligent autocomplete system that suggests existing nodes as you type wikilinks (using `[[` syntax), enabling fast linking between notes and reducing typos or broken links.

## User Story

As a **note-taker**, I want to **see suggestions for existing notes when I type `[[`** so that I can **quickly create accurate links without memorizing exact titles or worrying about typos**.

## Key Capabilities

- **Fuzzy search**: Match partial titles and handle typos using fuzzy matching algorithms
- **Contextual ranking**: Prioritize recently edited, frequently linked, and semantically related nodes
- **Keyboard navigation**: Arrow keys to navigate suggestions, Enter to select, Escape to dismiss
- **Create new nodes**: Option to create a new node if no matches exist, with automatic link creation
- **Performance**: Sub-100ms response time for autocomplete queries across 10,000+ nodes

## Dependencies

- **Requires**: [[markdown-editor-component]] (editor integration)
- **Enables**: Improved linking accuracy and user experience

## Implementation Notes

**Technology Stack**: Fuse.js for fuzzy search, React/Vue autocomplete component, debounced search queries.

**Complexity Estimate**: Moderate (2-4 weeks) - requires integration with editor, efficient search indexing, and smooth UX.

**Key Challenges**:
- Building efficient search index that updates in real-time as nodes are created/renamed
- Handling large node sets without UI lag
- Providing relevant, contextual suggestions beyond simple string matching

**Architecture**: Maintain in-memory search index with periodic sync to backend. Use debouncing (150-200ms) to prevent excessive queries while typing.

## Related

- [[../concepts/wikilinks]]
- [[../decisions/technical/markdown-editor]]
- [[knowledge-graph-visualization]]
