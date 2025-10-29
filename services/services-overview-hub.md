# Services Directory (Future Microservices)

**Purpose**: Placeholder for future Python FastAPI microservices when MVP grows beyond unified Weaver service

**Current Status**: ⏳ Not implemented - Placeholder only

---

## 🎯 What Goes Here?

This directory will contain **internal Python FastAPI microservices** that we build and host ourselves.

**Key Question**: "Who builds and hosts this?"
- **This directory** → "We build it, we host it, we maintain it"
- **Vault `/weave-nn/services/`** → "External APIs we consume (Anthropic, GitHub, etc.)"

---

## Future Services (Post-MVP)

### Phase 1 Split (v0.5 - Month 2)
When Weaver unified service needs to split:

- `api-gateway/` - Kong API Gateway for external ingress
- `mcp-server/` - Extracted MCP server (split from Weaver)
- `file-watcher/` - Extracted file watcher (split from Weaver)

### Phase 2 Services (v1.0 - Month 3-4)
When advanced features and heavy workloads require dedicated services:

- `knowledge-extractor/` - AI-powered knowledge extraction workflows
- `rule-engine/` - Agent automation rules (YAML-based)
- `git-sync-service/` - Advanced git operations and conflict resolution
- `notification-service/` - User notifications (Slack, email, webhooks)

### Phase 3 Services (v2.0 - Month 6+)
When multi-user and cloud deployment needed:

- `ai-agent-orchestrator/` - Multi-agent coordination and task distribution
- `project-seeder/` - Project initialization and template management
- `vector-db-service/` - Embeddings generation and semantic search
- `auth-service/` - User authentication and authorization
- `analytics-service/` - Usage analytics and metrics aggregation

---

## Service Template Structure

Each service will follow this consistent structure:

```
service-name/
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Service configuration
│   ├── routes/              # API route handlers
│   ├── models/              # Pydantic models
│   ├── consumers/           # RabbitMQ consumers (if event-driven)
│   ├── publishers/          # RabbitMQ publishers (if event-driven)
│   └── utils/               # Service-specific utilities
├── tests/
│   ├── __init__.py
│   ├── test_routes.py
│   └── test_consumers.py
├── Dockerfile
├── requirements.txt
├── pyproject.toml
└── README.md
```

---

## Current Status (MVP v0.1-0.4)

**All functionality is in the unified Weaver service** (`/weaver/`)

Weaver includes:
- File watcher (chokidar)
- Workflow engine (workflow.dev)
- Shadow cache (SQLite)
- MCP server (@modelcontextprotocol/sdk)
- Obsidian client (REST API)
- AI operations (Vercel AI Gateway)
- Git operations (simple-git)

**When to split**: See `/docs/migration-strategy-local-to-microservices.md`

---

## Migration Path

### Trigger for Phase 1 Split (v0.5)
- Multiple MCP servers needed
- External API access required (not just Obsidian)
- Rate limiting and API gateway needed

### Trigger for Phase 2 Services (v1.0)
- AI workloads causing Weaver performance issues
- Advanced automation rules requiring separate rule engine
- Git operations becoming complex (merge conflicts, multi-repo)

### Trigger for Phase 3 Services (v2.0)
- Multi-user deployment
- Cloud hosting (AWS, GCP, Azure)
- Horizontal scaling required
- Advanced agent orchestration needed

---

## Related Documentation

- `/docs/monorepo-structure-mvp.md` - MVP directory structure
- `/docs/monorepo-structure.md` - Full microservices architecture
- `/docs/migration-strategy-local-to-microservices.md` - Detailed migration plan
- `/weaver/README.md` - Current unified Weaver service

---

**Last Updated**: 2025-10-23
**Status**: Placeholder directory
**Next Review**: After MVP completion (Phase 5-6)
