---
concept_id: C-003
concept_type: technical-concept
title: Wikilinks
status: active
category: core-concept
created_date: '2025-10-20'
last_updated: '2025-10-20'
version: '1.0'
author: Hive Mind (Claude)
ai_generated: true
related_concepts:
  - knowledge-graph
  - weave-nn
  - ai-generated-documentation
related_decisions:
  - TS-2
  - IR-1
tags:
  - linking
  - markdown
  - syntax
  - bidirectional
  - core-concept
type: concept
visual:
  icon: "\U0001F4A1"
  cssclasses:
    - type-concept
    - status-active
updated_date: '2025-10-28'
---

# Wikilinks

**Definition**: Wikilinks are a markdown syntax using double square brackets `[[Document Name]]` to create links between documents. They enable bidirectional linking and automatic [[knowledge-graph|knowledge graph]] generation without managing explicit URLs or file paths.

---

## Core Concept

Traditional markdown links require explicit paths:
```markdown
See the [planning document](./docs/planning/auth-design.md)
```

Wikilinks simplify this to concept-based references:
```markdown
See the [[auth-design]] document
```

This approach:
- **Abstracts file paths**: Link by concept name, not location
- **Enables refactoring**: Move files without breaking links
- **Supports auto-completion**: Suggest existing documents while typing
- **Creates graph edges**: Each wikilink becomes a connection in the [[knowledge-graph|knowledge graph]]

---

## Syntax Variations

### Basic Wikilink
```markdown
[[document-name]]
```
Links to `document-name.md` using the document title as display text.

### Aliased Wikilink
```markdown
[[document-name|display text]]
```
Links to `document-name.md` but shows "display text" to readers.

### Heading Links
```markdown
[[document-name#section]]
```
Links to a specific heading within a document.

### Relative Path Links
```markdown
[[../decisions/technical/frontend-framework]]
```
Explicit path for disambiguation in complex directory structures.

---

## Bidirectional Linking

A key feature of wikilinks in knowledge graphs is **automatic backlink detection**:

If `document-a.md` contains `[[document-b]]`, then:
1. Document A has an explicit forward link to Document B
2. Document B automatically shows Document A in its backlinks
3. The knowledge graph displays this as a bidirectional edge

This creates a **web of knowledge** where:
- No document is an island
- Context emerges from connections
- Related concepts are discoverable through navigation

---

## Platform Support Comparison

| Platform | Wikilink Support | Backlinks | Graph Integration |
|----------|------------------|-----------|-------------------|
| **Obsidian** | ✅ Native | ✅ Automatic | ✅ Core feature |
| **Notion** | ⚠️ Via relations | Manual setup | ❌ None (3rd party) |
| **Weave-NN** | ✅ Native | ✅ Automatic | ✅ Drives graph |

Obsidian pioneered wikilink-driven knowledge graphs in the markdown ecosystem. [[weave-nn|Weave-NN]] adopts the same philosophy while adding:
- Real-time collaborative wikilink editing
- AI-suggested wikilinks based on semantic similarity
- Temporal wikilink tracking (when connections were created/removed)

---

## AI-Assisted Linking

In [[weave-nn|Weave-NN]], AI agents can automatically create wikilinks:

1. **During content generation**: AI identifies related concepts and inserts wikilinks
   ```markdown
   The [[authentication]] system uses [[OAuth2]] with [[NextAuth.js]]
   ```

2. **Post-creation analysis**: AI scans existing documents and suggests missing links
   ```
   "This planning doc mentions 'temporal queries' but doesn't link to [[temporal-queries]]"
   ```

3. **Semantic similarity**: AI uses embeddings to find conceptually related documents
   ```
   "Documents about 'user authentication' and 'security model' should be linked"
   ```

---

## Implementation in Weave-NN

### Parsing Wikilinks
Wikilinks in markdown files are parsed to:
1. Extract target document names
2. Create graph edges in the [[knowledge-graph|knowledge graph]]
3. Generate navigation metadata for the web UI
4. Enable backlink computation

### Resolution Strategy
When encountering `[[document-name]]`:
1. Search for `document-name.md` in the vault
2. If multiple matches exist (e.g., in different folders), show disambiguation
3. If no match exists, mark as "dangling link" (future document)
4. Update graph in real-time as documents are created/renamed

### Dangling Links
Wikilinks to non-existent documents (e.g., `[[future-feature]]`) serve as:
- **Placeholders** for planned content
- **Todo markers** for knowledge gaps
- **Discovery tools** showing what's missing from the graph

---

## Related Concepts

- [[knowledge-graph|Knowledge Graph]] - Wikilinks create graph edges
- [[weave-nn|Weave-NN]] - Platform implementing wikilink-based navigation
- [[ai-generated-documentation|AI-Generated Documentation]] - AI creates wikilinks automatically
- [[../features/auto-linking|Auto-Linking Feature]] - AI-powered link suggestions

---

## Related Decisions

- [[../decisions/technical/graph-visualization|TS-2: Graph Visualization]] - How wikilinks render in graph
- [[../decisions/integrations/obsidian|IR-1: Obsidian Integration]] - Compatibility with Obsidian's wikilinks
- [[../decisions/technical/markdown-editor|TS-5: Markdown Editor]] - Editor support for wikilink completion

---

## Key References

**Obsidian Comparison**: See [[../platform-analysis|Platform Analysis]] section "Bidirectional linking" for how Obsidian's native wikilinks compare to Notion's manual relation properties.

**Graph Building**: See [[../custom-solution-analysis|Custom Solution Analysis]] section "Parse wikilinks `[[Document Name]]` → create graph edges" for technical implementation details.

---

**Back to**: [[../INDEX|Main Index]] | [[../concepts/|Concepts]]
