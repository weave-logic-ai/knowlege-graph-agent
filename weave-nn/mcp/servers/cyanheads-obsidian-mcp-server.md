---
title: Cyanheads Obsidian MCP Server
type: tool
status: in-progress
tags:
  - mcp
  - obsidian
  - vault-management
  - knowledge-graph-editing
  - type/documentation
  - status/in-progress
priority: medium
related:
  - '[[model-context-protocol]]'
  - '[[ai-agent-integration]]'
  - '[[obsidian-vault]]'
visual:
  icon: "\U0001F4C4"
  color: '#8E8E93'
  cssclasses:
    - type-tool
updated: '2025-10-29T04:55:05.976Z'
version: '3.0'
keywords:
  - overview
  - key capabilities
  - why it's critical for weave-nn
  - integration with weave-nn
  - related documents
  - related files
---

# Cyanheads Obsidian MCP Server

## Overview

The Cyanheads Obsidian MCP Server is a comprehensive Model Context Protocol implementation that provides AI agents with full programmatic access to Obsidian vaults. It exposes vault operations - note creation, modification, searching, linking, and metadata management - through a standardized MCP interface.

This server transforms an Obsidian vault from a passive knowledge repository into an active, AI-manipulable knowledge graph. AI agents can perform complex operations like creating interconnected notes, updating frontmatter, managing tags, and maintaining bidirectional links, all while respecting the vault's existing structure and conventions.

## Key Capabilities

The server provides essential tools for vault management:

- **Note Operations**: Create, read, update, and delete notes with proper markdown formatting
- **Search and Discovery**: Query notes by content, tags, frontmatter properties, and file paths
- **Link Management**: Create and maintain wiki-links and backlinks between notes
- **Metadata Handling**: Read and write YAML frontmatter with type-safe property updates
- **Tag Operations**: Add, remove, and query tags across the vault
- **Template Support**: Apply note templates with variable substitution

## Why It's Critical for Weave-NN

Weave-NN's core value proposition is an AI-editable knowledge graph stored in Obsidian. The Cyanheads MCP server is what makes this possible. Without it, AI agents would need to manipulate markdown files directly, risking:

- Malformed YAML frontmatter
- Broken wiki-links and orphaned notes
- Inconsistent metadata across the graph
- Loss of Obsidian-specific formatting

The MCP server encapsulates these concerns, providing high-level operations that guarantee vault integrity.

## Integration with Weave-NN

Weave-NN configures this MCP server to point at its Obsidian vault directory. AI agents running in Claude Desktop, IDEs, or custom applications can then invoke MCP tools to:

1. Create new atomic notes when learning new concepts
2. Update existing notes with refined understanding
3. Establish links between related concepts in the knowledge graph
4. Query the graph to inform responses and actions
5. Maintain consistent metadata schemas across note types

This creates a virtuous cycle where AI interactions continuously refine and expand the knowledge graph.

## Related Documents

### Related Files
- [[SERVERS-HUB.md]] - Parent hub

