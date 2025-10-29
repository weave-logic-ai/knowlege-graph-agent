# Backend Developer - Monorepo Folder Structure Design Summary

**Task**: Design comprehensive monorepo folder structure for Weave-NN
**Completed**: 2025-10-23
**Agent**: Backend Developer
**Status**: ✅ Complete

---

## Task Overview

Designed a comprehensive, production-ready monorepo folder structure for the Weave-NN multi-project AI development platform based on the event-driven microservices architecture.

---

## Deliverables

### 1. **Complete Monorepo Structure** (`/home/aepod/dev/weave-nn/docs/monorepo-structure.md`)
- **Root directory organization** with 8 major sections
- **10 microservices** defined with consistent structure:
  - `api-gateway` - Main API gateway (FastAPI)
  - `knowledge-extractor` - Knowledge extraction workflow service
  - `project-seeder` - Project seeding and deployment service
  - `rule-engine` - Agent automation rule engine
  - `file-watcher` - Obsidian vault file monitoring service
  - `ai-agent-orchestrator` - AI agent coordination service
  - `notification-service` - User notifications
  - `git-sync-service` - Automatic Git operations
  - `mcp-servers/knowledge-graph-mcp` - Knowledge graph MCP server
  - `mcp-servers/ai-context-mcp` - AI context provider MCP server

- **5 shared packages** for code reusability:
  - `weave-common` - Common utilities and base classes
  - `weave-messaging` - RabbitMQ client abstractions
  - `weave-db` - Database access layer (PostgreSQL)
  - `weave-graph` - Knowledge graph operations
  - `weave-mcp` - MCP protocol implementations

- **Infrastructure organization**:
  - Kubernetes manifests (base, services, dependencies, overlays)
  - Docker configurations (base images, compose files)
  - Terraform modules (GCP provisioning)
  - Helm charts (optional)
  - Configuration files (RabbitMQ, N8N, PostgreSQL)

### 2. **Naming Conventions** (`/home/aepod/dev/weave-nn/docs/naming-conventions.md`)
- **Python code standards**:
  - Files: `snake_case`
  - Classes: `PascalCase`
  - Functions: `snake_case`
  - Constants: `UPPER_SNAKE_CASE`

- **Services and packages**:
  - Services: `kebab-case` (e.g., `api-gateway`)
  - Packages: `weave-<domain>` (e.g., `weave-common`)

- **Environment variables**:
  - Pattern: `WEAVE_<SERVICE>_<CONFIG>`
  - Examples: `WEAVE_API_PORT`, `WEAVE_RABBITMQ_URL`

- **Docker and Kubernetes**:
  - Images: `weave-nn/<service>:<tag>`
  - K8s resources: `<service>-<resource-type>`

- **RabbitMQ**:
  - Exchanges: `weave-nn.<domain>`
  - Queues: `<service>.<event-type>`
  - Routing keys: `<domain>.<event>.<action>`

- **Database**:
  - Tables: `snake_case` (plural nouns)
  - Columns: `snake_case`
  - Indexes: `idx_<table>_<columns>`

### 3. **Service README Template** (`/home/aepod/dev/weave-nn/docs/service-readme-template.md`)
- Comprehensive template for documenting each service
- Sections include:
  - Overview and responsibilities
  - Architecture (consumers, publishers, dependencies)
  - Local development setup
  - Configuration (environment variables)
  - Deployment instructions
  - Monitoring and observability
  - Troubleshooting guide
  - Testing strategy
  - Contributing guidelines

### 4. **Git and Docker Ignore Patterns** (`/home/aepod/dev/weave-nn/docs/gitignore-dockerignore-patterns.md`)
- **Root `.gitignore`**: Python bytecode, virtual environments, IDE files, secrets, logs, temporary files
- **Root `.dockerignore`**: Documentation, tests, Git files, IDE configs, development files
- **Service-specific `.dockerignore`**: Optimized for each service's Docker build
- **Best practices** for secrets management and image optimization
- **Validation script** to check for sensitive files

---

## Key Design Principles

### 1. **Event-Driven Architecture**
- All services communicate via RabbitMQ message queue
- Consumers subscribe to queues, publishers emit events
- Loose coupling enables independent service development

### 2. **Service Isolation**
- Each service is independently deployable
- Consistent directory structure across all services
- Service-specific Dockerfile, requirements.txt, tests

### 3. **Shared Libraries**
- Common code extracted into `/packages/` for reusability
- Each package is independently versioned
- Comprehensive unit tests for shared code

### 4. **Infrastructure as Code**
- Kubernetes manifests for declarative deployment
- Docker Compose for local development
- Terraform for cloud infrastructure provisioning
- Environment-specific overlays (dev, staging, production)

### 5. **Developer Experience**
- Clear separation of concerns
- Consistent naming conventions
- Comprehensive documentation
- Makefile for common tasks

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | Python 3.11, FastAPI, Uvicorn | Microservices framework |
| Messaging | RabbitMQ | Event-driven architecture |
| Database | PostgreSQL (pgvector) | Data persistence and embeddings |
| Orchestration | Kubernetes (GKE) | Container orchestration |
| Workflow | N8N | Task orchestration |
| MCP | Model Context Protocol | AI agent integration |
| Monitoring | Prometheus, Grafana | Observability |
| CI/CD | GitHub Actions | Continuous integration |

---

## File Organization

```
weave-nn/
├── .github/                    # GitHub workflows, CI/CD
├── docs/                       # Project-wide documentation
├── scripts/                    # Utility scripts
├── infrastructure/             # Kubernetes, Docker, Terraform
├── services/                   # All microservices
│   ├── api-gateway/
│   ├── knowledge-extractor/
│   ├── project-seeder/
│   ├── rule-engine/
│   ├── file-watcher/
│   ├── ai-agent-orchestrator/
│   ├── notification-service/
│   ├── git-sync-service/
│   └── mcp-servers/
├── packages/                   # Shared libraries
│   ├── weave-common/
│   ├── weave-messaging/
│   ├── weave-db/
│   ├── weave-graph/
│   └── weave-mcp/
├── tools/                      # CLI tools
├── tests/                      # Integration and E2E tests
└── [root config files]
```

---

## Memory Storage

All structure details stored in coordination memory:

**Key**: `swarm/backend-dev/folder-structure`
**Namespace**: `weave-nn`
**TTL**: 24 hours

**Contents**:
- Complete monorepo structure
- Service and package lists
- Infrastructure components
- Naming conventions
- Architecture principles
- Technology stack
- Next steps

---

## Next Steps

### Immediate Actions
1. ✅ Directory structure designed
2. ✅ Naming conventions defined
3. ✅ Documentation templates created
4. ✅ Ignore patterns specified
5. ✅ Structure stored in memory

### Follow-Up Tasks
1. **Initialize directory structure**:
   ```bash
   mkdir -p services/{api-gateway,knowledge-extractor,project-seeder,rule-engine,file-watcher,ai-agent-orchestrator,notification-service,git-sync-service,mcp-servers/{knowledge-graph-mcp,ai-context-mcp}}
   mkdir -p packages/{weave-common,weave-messaging,weave-db,weave-graph,weave-mcp}
   mkdir -p infrastructure/{kubernetes,docker,terraform,helm,configs}
   mkdir -p tools/{cli,dev-scripts,monitoring}
   mkdir -p tests/{integration,e2e,performance,fixtures}
   ```

2. **Create README files** for each major directory using templates

3. **Set up initial services**:
   - Start with `api-gateway`, `rule-engine`, and `file-watcher`
   - Use service template structure
   - Implement basic FastAPI endpoints

4. **Configure Docker Compose** for local development:
   - RabbitMQ service
   - PostgreSQL service
   - N8N service
   - Initial microservices

5. **Set up CI/CD pipelines**:
   - Linting and testing workflows
   - Docker build and push workflows
   - Kubernetes deployment workflows

---

## Coordination Metrics

**Task ID**: `task-1761205089674-1fe41qk3k`
**Duration**: 436.78 seconds (7.3 minutes)
**Files Created**: 4 documentation files
**Memory Operations**: 2 (store folder structure, post-edit notification)

---

## References

### Created Documentation
- `/home/aepod/dev/weave-nn/docs/monorepo-structure.md`
- `/home/aepod/dev/weave-nn/docs/naming-conventions.md`
- `/home/aepod/dev/weave-nn/docs/service-readme-template.md`
- `/home/aepod/dev/weave-nn/docs/gitignore-dockerignore-patterns.md`

### Architecture References
- `/home/aepod/dev/weave-nn/weave-nn/architecture/multi-project-ai-platform.md`
- `/home/aepod/dev/weave-nn/weave-nn/architecture/api-layer.md`
- `/home/aepod/dev/weave-nn/weave-nn/decisions/technical/event-driven-architecture.md`
- `/home/aepod/dev/weave-nn/weave-nn/architecture/data-knowledge-layer.md`

---

## Summary

Successfully designed a comprehensive, production-ready monorepo folder structure for Weave-NN that:

✅ Supports 10 microservices with event-driven architecture
✅ Includes 5 shared packages for code reusability
✅ Provides complete infrastructure-as-code organization
✅ Defines consistent naming conventions across all components
✅ Includes templates for service documentation
✅ Specifies security-focused ignore patterns
✅ Aligns with Python, Docker, and Kubernetes best practices
✅ Optimizes for developer experience and maintainability

**Status**: Ready for implementation by development team

---

**Created**: 2025-10-23
**Agent**: Backend Developer
**Coordination**: Claude Flow Swarm
**Version**: 1.0

## Related Documents

### Related Files
- [[DOCS-HUB.md]] - Parent hub
- [[docker-compose-summary.md]] - Same directory
- [[docker-workflows.md]] - Same directory

