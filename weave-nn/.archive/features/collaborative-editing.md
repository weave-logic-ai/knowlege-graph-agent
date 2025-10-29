---
feature_id: F-103
feature_name: Real-Time Collaborative Editing
category: editor
status: planned
priority: high
release: v1.1
complexity: complex
dependencies:
  requires:
    - F-002
    - F-008
  blocks:
    - F-112
related_decisions:
  - '[[../decisions/technical/realtime-collaboration]]'
tags:
  - feature
  - editor
  - v1.1
  - collaboration
  - realtime
---

# Real-Time Collaborative Editing

Enable multiple users to edit the same document simultaneously with live updates, cursor presence, and conflict resolution - similar to Google Docs or Notion.

## User Story

As a team member, I want to edit documents simultaneously with my colleagues so that we can collaborate in real-time without conflicts or version confusion.

## Key Capabilities

- **Live cursor presence**: See where other users are typing in real-time
- **Real-time text sync**: Changes appear instantly for all collaborators
- **Conflict-free merging**: Automatic resolution using CRDTs or operational transforms
- **User awareness**: Show who's currently viewing/editing each node
- **Comment threads**: Inline discussions on specific content (see [[comments-annotations]])
- **Edit history**: Track who changed what and when
- **Offline support**: Continue editing when disconnected, sync when reconnected

## Dependencies

- Requires: [[markdown-editor-component]] - Base editing functionality
- Requires: [[workspace-management]] - Multi-user infrastructure
- Works with: [[version-history]] - Track collaborative changes
- Works with: [[comments-annotations]] - Communication during editing

## Implementation Notes

**Complexity**: Complex (1.5-2 months)

Real-time collaboration is one of the most technically challenging features. Must choose between CRDT-based (Yjs, Automerge) or OT-based (ShareDB) approaches.

Key challenges:
- Sub-100ms latency for typing synchronization
- Conflict resolution without data loss
- Cursor position synchronization across clients
- WebSocket connection management and reconnection
- Scale to 10+ simultaneous editors per document

Technical approach:
- Use Yjs + Supabase Realtime for CRDT-based sync
- TipTap editor has built-in Yjs collaboration support
- Store CRDT state in PostgreSQL for persistence
- Implement presence awareness via Supabase channels





















## Related

[[user-permissions]]
## Related

[[export-import]]
## Related

[[temporal-view]]
## Related

[[node-search]]
## Related

[[semantic-search]]
## Related

[[phase-management]]
## Related

[[team-analytics]]
## Related

[[wikilink-autocomplete]]
## Related

[[syntax-highlighting]]
## Related

[[collaborative-editing]]
## Related

- [[../technical/tiptap-editor|TipTap Editor]]
- [[../technical/supabase|Supabase Realtime]]
- [[comments-annotations|Comments & Annotations]]
- [[version-history|Version History]]
