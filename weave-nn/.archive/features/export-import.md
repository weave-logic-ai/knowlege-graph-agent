---
feature_id: "F-109"
feature_name: "Export/Import (Obsidian, Notion)"
category: "data"
status: "planned"
priority: "high"
release: "v1.1"
complexity: "moderate"

dependencies:
  requires: ["F-009", "F-002"]
  blocks: []

related_decisions:
  - "[[../decisions/features/data-portability]]"

tags:
  - feature
  - data
  - v1.1
  - integration
  - migration
---

# Export/Import (Obsidian, Notion)

Seamlessly move knowledge between Weave-NN and popular tools like Obsidian and Notion, enabling migration, backup, and cross-platform workflows.

## User Story

As a knowledge worker, I want to import my existing Obsidian vault or Notion workspace so that I can try Weave-NN without losing my existing work, and export data if I want to switch platforms.

## Key Capabilities

- **Obsidian import**: Parse vault structure, wikilinks, tags, frontmatter
- **Notion import**: Convert Notion databases, pages, and relationships
- **Smart mapping**: Translate platform-specific features to Weave-NN equivalents
- **Batch import**: Process entire vaults/workspaces efficiently
- **Conflict handling**: Detect and resolve naming collisions
- **Incremental sync**: Update existing nodes rather than duplicate
- **Export formats**: Generate compatible formats for other platforms
- **Preview before import**: Show what will be imported and how it maps

## Dependencies

- Requires: [[data-portability]] - Core export/import infrastructure
- Requires: [[markdown-editor-component]] - Parse/render markdown variations
- Works with: [[backup-sync]] - Import as part of restore workflow
- Works with: [[git-integration]] - Commit imported content

## Implementation Notes

**Complexity**: Moderate (3-4 weeks)

Each platform has unique features and markdown dialects. The challenge is preserving as much semantics as possible while gracefully handling unsupported features.

Key challenges:
- Obsidian dataview queries, canvas files, embeds
- Notion databases, toggles, synced blocks
- Handling broken links during import
- Performance with large vaults (10,000+ notes)
- Maintaining graph structure and relationships

Technical approach:

**Obsidian Import**:
- Parse markdown + frontmatter (gray-matter library)
- Convert `[[wikilinks]]` to internal links (already compatible)
- Map Obsidian tags to Weave-NN tags
- Handle attachments/images (store in Supabase storage)
- Preserve folder structure as virtual organization

**Notion Import**:
- Use Notion API to export workspace
- Convert Notion blocks to markdown
- Map databases to specialized node types or tags
- Handle page hierarchy and relationships
- Download and store uploaded files

**Export**:
- Generate clean markdown files
- Include frontmatter with metadata
- Preserve wikilink format
- Bundle as zip with assets
- Optionally include Git history

## Related

- [[../platforms/obsidian|Obsidian]]
- [[../platforms/notion|Notion]]
- [[data-portability|Data Portability]]
- [[backup-sync|Backup & Sync]]
