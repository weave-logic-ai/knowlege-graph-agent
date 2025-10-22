---
feature_id: "F-111"
feature_name: "Public/Private Sharing"
category: "collaboration"
status: "planned"
priority: "high"
release: "v1.1"
complexity: "moderate"

dependencies:
  requires: ["F-008", "F-009"]
  blocks: []

related_decisions:
  - "[[../decisions/features/collaboration]]"

tags:
  - feature
  - collaboration
  - v1.1
  - sharing
---

# Public/Private Sharing

Flexible sharing controls enabling users to publish nodes publicly, share privately with specific people, or create read-only links with granular permissions.

## User Story

As a content creator, I want to share specific nodes or entire graphs publicly or with selected collaborators so that I can publish my knowledge, collaborate with teams, and get feedback.

## Key Capabilities

- **Public publishing**: Generate public URLs for read-only access
- **Private sharing**: Invite specific users via email with custom permissions
- **Link sharing**: Create shareable links with optional password protection
- **Granular permissions**: View-only, comment, or edit access per share
- **Expiring links**: Time-limited access for temporary collaboration
- **Graph subsetting**: Share individual nodes or entire subgraphs
- **Branded public pages**: Custom styling for published knowledge
- **Share analytics**: Track views, engagement on shared content

## Dependencies

- Requires: [[workspace-management]] - User and permission infrastructure
- Requires: [[data-portability]] - Export shared content in portable format
- Works with: [[comments-annotations]] - Enable comments on shared nodes
- Works with: [[collaborative-editing]] - Real-time editing for shared access

## Implementation Notes

**Complexity**: Moderate (2-3 weeks)

Sharing builds on existing workspace permissions, adding public access layer and link-based sharing. Key challenges are performance of public pages and preventing unintended data leakage.

Key challenges:
- Preventing access to linked but non-shared nodes
- Performance of public pages without authentication overhead
- SEO optimization for published content
- Privacy controls preventing accidental exposure
- Analytics without compromising reader privacy

Technical approach:

**Permission Levels**:
```
- Public: Anyone with link can view
- Workspace: Anyone in workspace can view
- Private: Only specific invited users
- Direct: Only creator can view (default)
```

**Sharing Modes**:
1. **Single node**: Share one node, optionally include linked nodes
2. **Subgraph**: Share node + all descendants within N hops
3. **Workspace**: Share entire workspace as read-only

**Public Page Features**:
- Clean, distraction-free reading UI
- Graph visualization of shared nodes only
- SEO metadata (title, description, preview image)
- Optional branding customization
- Analytics dashboard showing views, referrers

**Implementation Details**:
```sql
shares:
  - id, node_id, share_type (public, private, link)
  - permissions (view, comment, edit)
  - created_by, created_at
  - expires_at (nullable)
  - password_hash (nullable)
  - access_token (for link sharing)
```

**Security Considerations**:
- Validate permissions on every access (don't cache aggressively)
- Prevent traversal to unshared linked nodes
- Rate limiting on public endpoints
- Optional password protection for sensitive shares
- Audit log of share access

## Related

- [[workspace-management|Workspace Management]]
- [[user-permissions|User Permissions]]
- [[comments-annotations|Comments & Annotations]]
- [[collaborative-editing|Collaborative Editing]]
