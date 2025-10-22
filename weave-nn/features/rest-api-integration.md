---
feature_id: "F-031"
feature_name: "REST API Integration"
category: "knowledge-graph"
status: "planned"
priority: "high"
release: "mvp"
complexity: "moderate"

dependencies:
  requires: ["F-008"]
  blocks: ["F-032", "F-105"]

related_decisions:
  - "[[technical/obsidian-api-client]]"
  - "[[standards/obsidian-properties-standard]]"

tags:
  - feature
  - knowledge-graph
  - mvp
  - api-integration
  - automation
---

# REST API Integration

Provides programmatic access to Obsidian vault through a REST API, enabling AI agents and external tools to read, create, update, and delete notes, manage properties, and query the knowledge graph structure.

## User Story

As a developer, I want programmatic access to Obsidian vault so that AI agents can automate node management, property updates, and graph maintenance without manual intervention.

## Key Capabilities

- **Note CRUD Operations**: Create, read, update, and delete notes via REST endpoints
- **Property Management**: Get and set YAML frontmatter properties programmatically
- **Graph Queries**: Query backlinks, forward links, and graph structure
- **Bulk Operations**: Batch updates for efficient multi-node modifications

## Dependencies

- Requires: [[git-integration]] (F-008) - Git integration provides version control for API-driven changes
- Enables: [[agent-automation]] (F-032) - Powers automated agent workflows
- Enables: [[auto-linking]] (F-105) - Enables automated link discovery and creation
- Works with: [[property-visualizer]] - API supports property analytics data retrieval

## Implementation Notes

**Complexity**: Moderate (2-3 weeks)

The REST API will be implemented using the ObsidianAPIClient class that wraps the Obsidian Dataview plugin and file system operations. The API must handle concurrent requests safely, validate all inputs, and maintain vault integrity. Authentication will use API tokens stored in vault settings.

Key challenges:
- Concurrent write operations require file locking to prevent corruption
- Property validation must enforce Obsidian property type standards
- API rate limiting prevents vault performance degradation from automated tools

Technical approach:

**ObsidianAPIClient Core**:
- Express.js server running on localhost:3000
- JWT-based authentication with configurable API keys
- Request validation using JSON Schema
- File system locking using proper-lockfile library

**API Endpoints**:
- `GET /api/notes/:path` - Retrieve note content and metadata
- `POST /api/notes` - Create new note with frontmatter
- `PUT /api/notes/:path` - Update existing note
- `DELETE /api/notes/:path` - Delete note (move to trash)
- `GET /api/graph/links/:path` - Get incoming and outgoing links
- `POST /api/properties/batch` - Bulk property updates

```typescript
interface NoteUpdateRequest {
  path: string;
  content?: string;
  properties?: Record<string, PropertyValue>;
  append?: boolean;
}

interface PropertyValue {
  type: 'text' | 'number' | 'date' | 'checkbox' | 'list' | 'multitext';
  value: string | number | boolean | string[];
}
```

## User Experience

Developers interact with the API through HTTP requests from scripts, CI/CD pipelines, or AI agent tools. The API provides clear error messages and validation feedback.

**Key Interactions**:
1. Configure API key in Obsidian plugin settings
2. Send authenticated HTTP requests to localhost endpoint
3. Receive JSON responses with note data or operation results
4. Monitor API logs through Obsidian console

**UI Components**:
- Settings panel: API key generation and management
- Status indicator: Shows API server status (running/stopped)
- Logs panel: Displays recent API requests and responses

## Acceptance Criteria

- [ ] API server starts/stops from Obsidian plugin settings
- [ ] All CRUD operations work for notes in any vault folder
- [ ] Property updates enforce type validation per Obsidian standards
- [ ] Concurrent requests handled safely with file locking
- [ ] Authentication required for all endpoints except health check
- [ ] Batch operations support updating 100+ notes efficiently
- [ ] API returns appropriate HTTP status codes and error messages
- [ ] Graph query endpoints return accurate link information

## Edge Cases

1. **Concurrent Writes to Same File**: Use file locking with timeout to prevent corruption; return 409 Conflict if lock unavailable after 5 seconds
2. **Invalid Property Types**: Validate against Obsidian property standards; return 400 Bad Request with specific validation errors
3. **Large Batch Operations**: Implement pagination for results; limit batch size to 500 items per request
4. **Vault Folder Changes**: Watch vault configuration changes and reload API routes accordingly

## Performance Considerations

- API requests should complete within 200ms for single-note operations
- Batch operations process minimum 50 notes per second
- Implement caching for graph structure queries (5-minute TTL)
- Use streaming responses for large note content (>1MB)

## Security Considerations

- API keys must be cryptographically secure (32-byte random tokens)
- Rate limiting: 100 requests per minute per API key
- Input sanitization prevents path traversal attacks
- CORS configured to localhost only by default
- Audit log of all write operations

## Testing Strategy

**Unit Tests**:
- Test each CRUD endpoint with valid and invalid inputs
- Verify property type validation for all 8 property types
- Test authentication middleware rejects invalid tokens

**Integration Tests**:
- Test concurrent write operations with file locking
- Verify batch operations complete successfully
- Test API with actual Obsidian vault structure

**User Testing**:
- Validate API key generation and configuration flow
- Test common automation scenarios (bulk property updates, auto-linking)
- Verify error messages are clear and actionable

## Rollout Plan

**MVP Version**: Basic CRUD operations, property management, authentication
**v1.0 Version**: Graph queries, batch operations, comprehensive error handling
**Future Enhancements**:
- Webhook support for vault change notifications
- GraphQL endpoint for complex queries
- WebSocket support for real-time updates

## Related

- [[technical/obsidian-api-client]]
- [[features/git-integration]]
- [[features/agent-automation]]
- [[features/auto-linking]]
- [[standards/obsidian-properties-standard]]

---

**Created**: 2025-10-22
**Last Updated**: 2025-10-22
**Status**: Planned
**Estimated Effort**: 2-3 weeks
