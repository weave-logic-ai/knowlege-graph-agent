---
feature_id: F-112
feature_name: Comments & Annotations
category: collaboration
status: planned
priority: medium
release: v1.1
complexity: moderate
dependencies:
  requires:
    - F-002
    - F-008
  blocks: []
related_decisions:
  - '[[../decisions/features/collaboration]]'
tags:
  - feature
  - collaboration
  - v1.1
  - communication
---

# Comments & Annotations

Enable collaborative feedback through threaded comments, inline annotations, and highlighting - facilitating discussion without modifying the original content.

## User Story

As a reviewer, I want to leave comments and suggestions on specific parts of a document so that I can provide feedback without directly editing the content or losing context.

## Key Capabilities

- **Inline comments**: Attach comments to specific text selections
- **Threaded discussions**: Reply to comments, creating conversation threads
- **Comment resolution**: Mark comments as resolved once addressed
- **Highlights**: Non-invasive annotations visible to all collaborators
- **@mentions**: Notify specific users about comments
- **Comment mode**: Toggle between editing and commenting view
- **Filtering**: Show/hide resolved comments, filter by author or date
- **Notifications**: Real-time alerts for new comments and mentions

## Dependencies

- Requires: [[markdown-editor-component]] - Text selection and anchoring
- Requires: [[workspace-management]] - Multi-user infrastructure
- Works with: [[collaborative-editing]] - Real-time comment updates
- Works with: [[sharing]] - Comments on publicly shared nodes

## Implementation Notes

**Complexity**: Moderate (3-4 weeks)

Comments require careful text anchoring to handle document edits that shift comment positions. Must integrate with existing editor without disrupting writing flow.

Key challenges:
- Anchoring comments to text that gets edited/moved
- UI/UX for non-intrusive comment display
- Real-time synchronization of comments
- Performance with 100s of comments per document
- Mobile experience for reading/adding comments

Technical approach:

**Comment Anchoring**:
- Use character offsets + surrounding text hash for robustness
- Re-anchor comments when text shifts (similar to Google Docs)
- Mark comments as "orphaned" if anchor text is deleted
- Support both inline (text selection) and document-level comments

**Data Model**:
```sql
comments:
  - id, node_id, author_id
  - content (markdown text)
  - created_at, updated_at
  - parent_comment_id (for threads)
  - resolved, resolved_by, resolved_at
  - anchor_start, anchor_end, anchor_text

highlights:
  - id, node_id, author_id
  - anchor_start, anchor_end
  - color, note (optional)
  - created_at
```

**UI/UX Design**:
- Margin/sidebar for comment threads (like Google Docs)
- Hover highlights to show associated comments
- Keyboard shortcut to add comment (cmd+shift+m)
- Inline indicators (subtle underline/highlight)
- Collapsed by default, expand on click

**Real-time Sync**:
- Use Supabase Realtime for comment updates
- Presence indicators showing who's commenting
- Optimistic UI updates (instant feedback)



















## Related

[[version-history]]
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

[[canvas-visualization]]
## Related

[[backup-sync]]
## Related

[[comments-annotations]] • [[user-permissions]] • [[team-analytics]]
## Related

- [[../technical/tiptap-editor|TipTap Editor]]
- [[collaborative-editing|Collaborative Editing]]
- [[sharing|Public/Private Sharing]]
- [[workspace-management|Workspace Management]]
