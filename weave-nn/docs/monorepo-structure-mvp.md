---
visual:
  icon: 📚
icon: 📚
---
# Weave-NN Monorepo Structure (MVP-Focused)

**Architecture Reference**: Local-First with Growth Path to Microservices
**Technology Stack**: Node.js/TypeScript (Weaver), Python (future services), Docker Compose
**Last Updated**: 2025-10-23
**Status**: MVP Active Development (Phase 4B-5)

---

## Overview

This monorepo structure supports the **MVP local-first architecture** while preserving clear growth paths to full microservices. The structure emphasizes:

- **Obsidian Vault Preservation**: `weave-nn/` subdirectory stays in place (knowledge graph, documentation)
- **MVP Simplicity**: Unified Weaver service (not 9 microservices)
- **Growth-Ready Structure**: Directories pre-created for future services and shared packages
- **Clear Separation**: MVP code vs future code vs documentation
- **Docker Compose First**: Local development via docker-compose.yml

**Key Principle**: Build for today (MVP), architect for tomorrow (microservices).

---

## Root Directory Structure

```
/home/aepod/dev/weave-nn/
├── weave-nn/                   # ✅ OBSIDIAN VAULT (stays in place)
│   ├── concepts/
│   ├── decisions/
│   ├── features/
│   ├── docs/
│   ├── mcp/
│   ├── _planning/
│   └── ... (all vault content)
│
├── weaver/                     # 🔥 MVP: Unified Weaver service (Node.js/TypeScript)
│   ├── src/
│   ├── workflows/
│   ├── tests/
│   ├── config/
│   └── README.md
│
├── services/                   # 📦 FUTURE: Microservices (Python FastAPI)
│   ├── README.md               # Explains future service architecture
│   └── .gitkeep
│
├── packages/                   # 📦 FUTURE: Shared libraries
│   ├── README.md               # Explains shared package strategy
│   └── .gitkeep
│
├── infrastructure/             # 🚀 Infrastructure as Code
│   ├── docker/                 # Docker configs for MVP
│   ├── local_development_environment/  # Existing local dev setup
│   └── README.md
│
├── scripts/                    # 🛠️ Utility scripts
│   ├── setup/
│   ├── deployment/
│   └── README.md
│
├── docs/                       # 📚 Root-level documentation
│   ├── monorepo-structure-mvp.md (this file)
│   ├── monorepo-structure.md    # Full microservices vision
│   └── ... (architecture docs)
│
├── .github/                    # GitHub workflows, templates
├── .vscode/                    # VSCode workspace settings
├── config/                     # 🆕 Shared configuration files
├── docker-compose.yml          # 🔥 MVP: Local development orchestration
├── docker-compose.override.yml # Development overrides
├── Makefile                    # Common tasks (build, test, deploy)
├── .dockerignore
├── .gitignore
├── .env.example
├── README.md                   # Project overview
└── CLAUDE.md                   # Claude Code configuration
```

---

## 1. Weave-NN Vault Directory (Stays In Place)

**Location**: `/home/aepod/dev/weave-nn/weave-nn/`

**Purpose**: Obsidian knowledge graph, documentation, planning, research

**Structure**: (Unchanged - this is the vault)
```
weave-nn/
├── concepts/                   # Concept nodes
├── decisions/                  # Decision records
├── features/                   # Feature specifications
├── patterns/                   # Design patterns
├── protocols/                  # Protocol definitions
├── standards/                  # Standards and conventions
├── workflows/                  # Workflow definitions
├── guides/                     # User guides
├── docs/                       # Technical documentation
├── mcp/                        # MCP integration documentation
├── integrations/               # Integration documentation
├── architecture/               # Architecture diagrams and specs
├── _planning/                  # Planning documents
│   ├── phases/
│   ├── architecture/
│   ├── research/
│   └── tasks.md
├── _files/                     # Vault assets
├── templates/                  # Obsidian templates
├── queries/                    # Dataview queries
├── examples/                   # Example documents
├── research/                   # Research papers and analysis
├── metrics/                    # Metrics and analytics
├── .obsidian/                  # Obsidian configuration
└── concept-map.md              # Master concept map
```

**Status**: ✅ Active - All documentation and knowledge graph live here

**Git Strategy**:
- Full git tracking
- No .gitignore for vault content (all tracked)
- Automated git commits via Weaver workflows

**Access Patterns**:
- Obsidian Desktop app reads/writes directly
- Weaver monitors via file watcher (chokidar)
- MCP tools access via ObsidianAPIClient

---

## 2. Weaver Service (MVP - Node.js/TypeScript)

**Location**: `/home/aepod/dev/weave-nn/weaver/`

**Purpose**: Unified Node.js/TypeScript service with durable workflows, file watching, shadow cache, and MCP server

**Structure**:
```
weaver/
├── src/
│   ├── index.ts                # Main service entry point
│   ├── config/
│   │   ├── env.ts              # Environment configuration
│   │   ├── vault.ts            # Vault path configuration
│   │   └── ai-provider.ts      # Vercel AI Gateway config
│   │
│   ├── file-watcher/
│   │   ├── index.ts            # Chokidar file watcher
│   │   ├── events.ts           # File event types
│   │   └── filters.ts          # File filtering logic
│   │
│   ├── workflow-engine/
│   │   ├── index.ts            # Workflow.dev SDK integration
│   │   ├── registry.ts         # Workflow registration
│   │   └── context.ts          # Workflow context
│   │
│   ├── shadow-cache/
│   │   ├── index.ts            # SQLite shadow cache
│   │   ├── schema.sql          # Database schema
│   │   ├── queries.ts          # Query functions
│   │   └── migrations/         # Schema migrations
│   │
│   ├── mcp-server/
│   │   ├── index.ts            # MCP server implementation
│   │   ├── tools/              # MCP tool implementations
│   │   │   ├── create-note.ts
│   │   │   ├── read-note.ts
│   │   │   ├── search-graph.ts
│   │   │   └── ... (all MCP tools)
│   │   └── handlers.ts         # MCP request handlers
│   │
│   ├── obsidian-client/
│   │   ├── index.ts            # ObsidianAPIClient wrapper
│   │   └── api.ts              # REST API calls
│   │
│   ├── ai/
│   │   ├── provider.ts         # Vercel AI Gateway integration
│   │   ├── embeddings.ts       # Embedding generation
│   │   └── memories.ts         # Memory extraction
│   │
│   ├── git/
│   │   ├── index.ts            # Git operations (simple-git)
│   │   └── auto-commit.ts      # Auto-commit logic
│   │
│   └── utils/
│       ├── logger.ts           # Logging utilities
│       ├── frontmatter.ts      # YAML frontmatter parsing
│       └── markdown.ts         # Markdown utilities
│
├── workflows/                  # Durable workflow definitions
│   ├── vault-file-created.ts
│   ├── vault-file-updated.ts
│   ├── vault-file-deleted.ts
│   ├── ensure-bidirectional-link.ts
│   ├── validate-node-schema.ts
│   ├── extract-and-store-memories.ts
│   ├── task-completion.ts      # Proof workflow
│   └── phase-completion.ts     # Proof workflow
│
├── tests/
│   ├── unit/
│   │   ├── file-watcher.test.ts
│   │   ├── shadow-cache.test.ts
│   │   └── mcp-tools.test.ts
│   ├── integration/
│   │   ├── workflows.test.ts
│   │   └── end-to-end.test.ts
│   └── mocks/
│       ├── ai-provider.mock.ts
│       └── obsidian-client.mock.ts
│
├── config/
│   ├── development.json
│   ├── production.json
│   └── test.json
│
├── scripts/
│   ├── setup-db.ts             # Initialize SQLite shadow cache
│   ├── migrate.ts              # Run schema migrations
│   └── seed.ts                 # Seed test data
│
├── Dockerfile                  # Production Docker image
├── Dockerfile.dev              # Development Docker image
├── .dockerignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── .env.example
└── README.md
```

**Dependencies** (package.json):
```json
{
  "dependencies": {
    "workflow-dev": "^1.0.0",
    "hono": "^3.0.0",
    "@hono/node-server": "^1.0.0",
    "chokidar": "^3.5.0",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "better-sqlite3": "^9.0.0",
    "simple-git": "^3.0.0",
    "@vercel/ai": "^2.0.0",
    "gray-matter": "^4.0.0",
    "dotenv": "^16.0.0",
    "winston": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

**Environment Variables** (.env):
```bash
# Weaver Service
VAULT_PATH=/home/aepod/dev/weave-nn/weave-nn
NODE_ENV=development
PORT=3000

# Obsidian API
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=your-api-key-here

# AI Configuration
VERCEL_AI_GATEWAY_API_KEY=vck_1H7ExiTyiespMKAVurlWMqACIRtkIyugzquQ9RsmCvVenM555V4BDWse
ANTHROPIC_API_KEY=your-anthropic-key-here

# Shadow Cache
SHADOW_CACHE_PATH=./data/shadow-cache.db

# Git Configuration
GIT_AUTO_COMMIT=true
GIT_AUTO_PUSH=false

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/weaver.log
```

**Status**: 🔥 Active MVP Development (Phase 4B-5)

**Docker Integration**:
```yaml
# docker-compose.yml
services:
  weaver:
    build: ./weaver
    ports:
      - "3000:3000"
    volumes:
      - ./weave-nn:/vault:ro
      - ./weaver/data:/data
      - ./weaver/logs:/logs
    environment:
      - VAULT_PATH=/vault
      - NODE_ENV=development
    depends_on:
      - obsidian-rest-api
```

---

## 3. Services Directory (Future Microservices)

**Location**: `/home/aepod/dev/weave-nn/services/`

**Purpose**: Pre-created structure for future Python FastAPI microservices

**MVP Status**: ⏳ Not implemented yet - placeholder only

**Structure**:
```
services/
├── README.md                   # Explains microservices strategy
│
├── .gitkeep                    # Keep directory in git
│
└── _templates/                 # Service templates (future)
    ├── fastapi-service/        # Template for new services
    │   ├── src/
    │   ├── tests/
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── README.md
    └── mcp-server/             # Template for MCP servers
```

**README.md** (services/README.md):
```markdown
# Services Directory

This directory will contain Python FastAPI microservices when the MVP grows beyond the unified Weaver service.

## Future Services (Post-MVP)

### Phase 1 Split (v0.5)
- `api-gateway/` - Kong API Gateway for external ingress
- `weaver-core/` - Split Weaver into separate MCP server
- `file-watcher/` - Extract file watcher as standalone service

### Phase 2 Services (v1.0)
- `knowledge-extractor/` - AI-powered knowledge extraction
- `rule-engine/` - Agent automation rules
- `git-sync-service/` - Advanced git operations
- `notification-service/` - User notifications

### Phase 3 Services (v2.0)
- `ai-agent-orchestrator/` - Multi-agent coordination
- `project-seeder/` - Project initialization
- `vector-db-service/` - Embeddings and semantic search

## Migration Path

See `/docs/migration-strategy-local-to-microservices.md` for detailed migration plan.

## Current Status

**MVP (v0.1-0.4)**: All functionality in unified Weaver service (`/weaver`)
**Future**: Services extracted as needed based on load and complexity
```

---

## 4. Packages Directory (Future Shared Libraries)

**Location**: `/home/aepod/dev/weave-nn/packages/`

**Purpose**: Pre-created structure for future shared Python/TypeScript libraries

**MVP Status**: ⏳ Not implemented yet - placeholder only

**Structure**:
```
packages/
├── README.md                   # Explains shared package strategy
│
├── .gitkeep
│
└── _templates/                 # Package templates (future)
    ├── typescript-package/     # Template for TS packages
    │   ├── src/
    │   ├── tests/
    │   ├── package.json
    │   └── README.md
    └── python-package/         # Template for Python packages
        ├── src/
        ├── tests/
        ├── pyproject.toml
        └── README.md
```

**README.md** (packages/README.md):
```markdown
# Packages Directory

This directory will contain shared libraries when Weaver grows into multiple services.

## Future Packages

### TypeScript Packages (v0.5+)
- `@weave-nn/common` - Shared utilities, types, interfaces
- `@weave-nn/mcp-sdk` - MCP protocol client SDK
- `@weave-nn/workflows` - Shared workflow definitions
- `@weave-nn/shadow-cache` - Shadow cache client library

### Python Packages (v1.0+)
- `weave-common` - Common Python utilities
- `weave-messaging` - RabbitMQ client abstractions
- `weave-db` - PostgreSQL access layer
- `weave-graph` - Knowledge graph operations
- `weave-mcp` - MCP server implementations

## Current Status

**MVP**: All code in `/weaver` (no shared packages needed yet)
**Future**: Extract shared code as services multiply
```

---

## 5. Infrastructure Directory

**Location**: `/home/aepod/dev/weave-nn/infrastructure/`

**Purpose**: Infrastructure as Code, Docker configs, deployment scripts

**Current Structure**:
```
infrastructure/
├── docker/                     # 🔥 MVP: Docker configurations
│   ├── weaver/
│   │   ├── Dockerfile
│   │   └── Dockerfile.dev
│   ├── obsidian/               # Future: Obsidian Docker container
│   └── README.md
│
├── local_development_environment/  # ✅ Existing local dev setup
│   ├── .devcontainer/
│   ├── docker-compose.yml
│   └── README.md
│
├── kubernetes/                 # 📦 FUTURE: K8s manifests
│   ├── README.md               # Explains K8s migration path
│   └── .gitkeep
│
├── terraform/                  # 📦 FUTURE: Cloud infrastructure
│   ├── README.md
│   └── .gitkeep
│
└── README.md
```

**Status**:
- ✅ `docker/` - Active (MVP)
- ✅ `local_development_environment/` - Active (existing)
- ⏳ `kubernetes/`, `terraform/` - Future placeholders

---

## 6. Scripts Directory

**Location**: `/home/aepod/dev/weave-nn/scripts/`

**Purpose**: Utility scripts for setup, deployment, maintenance

**Structure**:
```
scripts/
├── setup/
│   ├── install-node.sh         # Install Node.js 20+
│   ├── install-deps.sh         # Install Weaver dependencies
│   ├── init-shadow-cache.sh    # Initialize SQLite database
│   └── configure-obsidian.sh   # Configure Obsidian plugins
│
├── deployment/
│   ├── build-weaver.sh         # Build Weaver Docker image
│   ├── deploy-local.sh         # Deploy via docker-compose
│   └── health-check.sh         # Check service health
│
├── maintenance/
│   ├── backup-vault.sh         # Backup Obsidian vault
│   ├── backup-cache.sh         # Backup shadow cache
│   └── migrate-schema.sh       # Run database migrations
│
├── testing/
│   ├── run-integration-tests.sh
│   └── seed-test-data.sh
│
└── README.md
```

**Status**: 🔄 To be created (Phase 4B tasks)

---

## 7. Config Directory

**Location**: `/home/aepod/dev/weave-nn/config/`

**Purpose**: Shared configuration files across all components

**Structure**:
```
config/
├── vault/
│   ├── frontmatter-schema.yaml # YAML frontmatter schema definition
│   ├── node-types.yaml         # Node type definitions
│   └── tags.yaml               # Tag taxonomy
│
├── weaver/
│   ├── workflows.yaml          # Workflow configuration
│   ├── mcp-tools.yaml          # MCP tool registry
│   └── ai-models.yaml          # AI model selection rules
│
├── docker/
│   ├── .env.example            # Example environment variables
│   └── docker-compose.override.yml.example
│
└── README.md
```

**Status**: 🔄 To be created (Phase 4B-5)

---

## 8. Docs Directory (Root)

**Location**: `/home/aepod/dev/weave-nn/docs/`

**Purpose**: Root-level project documentation (separate from vault docs)

**Current Structure**:
```
docs/
├── monorepo-structure-mvp.md   # 🆕 This file - MVP structure
├── monorepo-structure.md       # ✅ Full microservices vision
├── migration-strategy-local-to-microservices.md  # ✅ Migration guide
├── naming-conventions.md       # ✅ Naming standards
├── service-readme-template.md  # ✅ Service documentation template
├── gitignore-dockerignore-patterns.md  # ✅ Ignore patterns
└── README.md
```

**Relationship to vault docs**:
- `/docs/` - **Project-level** documentation (architecture, deployment, operations)
- `/weave-nn/docs/` - **Knowledge graph** documentation (technical specs, integration guides)

---

## Docker Compose Structure (MVP)

**Location**: `/home/aepod/dev/weave-nn/docker-compose.yml`

**Services**:
```yaml
version: '3.8'

services:
  weaver:
    build:
      context: ./weaver
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./weave-nn:/vault:ro           # Read-only vault access
      - ./weaver/data:/data             # Persistent shadow cache
      - ./weaver/logs:/logs             # Log files
      - ./weaver/src:/app/src:ro        # Hot reload (dev only)
    environment:
      - VAULT_PATH=/vault
      - NODE_ENV=development
      - VERCEL_AI_GATEWAY_API_KEY=${VERCEL_AI_GATEWAY_API_KEY}
    depends_on:
      - obsidian-rest-api
    networks:
      - weave-network

  obsidian-rest-api:
    # Future: Obsidian in Docker with Local REST API plugin
    # For MVP: Runs natively on host, not in Docker
    image: placeholder/obsidian:latest
    ports:
      - "27124:27124"
    volumes:
      - ./weave-nn:/vault
    networks:
      - weave-network
    profiles:
      - future  # Not active in MVP

networks:
  weave-network:
    driver: bridge

volumes:
  weaver-data:
  weaver-logs:
```

**docker-compose.override.yml** (development):
```yaml
version: '3.8'

services:
  weaver:
    build:
      target: development
    volumes:
      - ./weaver/src:/app/src:cached   # Enable hot reload
      - ./weaver/workflows:/app/workflows:cached
    environment:
      - LOG_LEVEL=debug
      - HOT_RELOAD=true
    command: npm run dev             # Override for development
```

---

## Growth Path: MVP → Microservices

### Phase 1: MVP (v0.1-0.4) - Weeks 1-4
**Services**: 1 (Weaver unified service)
**Focus**: Core functionality, durable workflows, MCP tools
**Structure**:
```
/weaver/          # All functionality
/weave-nn/        # Vault (unchanged)
/services/        # Empty (placeholder)
/packages/        # Empty (placeholder)
```

### Phase 2: Initial Split (v0.5) - Month 2
**Services**: 3 (API Gateway, Weaver MCP, File Watcher)
**Trigger**: Multiple MCP servers, external API access needed
**Structure**:
```
/weaver/          # Core workflows, shadow cache
/services/
  ├── api-gateway/       # 🆕 Kong API Gateway
  └── mcp-server/        # 🆕 Extracted MCP server
/weave-nn/        # Vault (unchanged)
```

### Phase 3: Service Expansion (v1.0) - Month 3-4
**Services**: 7 (Add knowledge-extractor, rule-engine, git-sync, notifications, PostgreSQL)
**Trigger**: Heavy AI workloads, advanced automation
**Structure**:
```
/weaver/          # Core coordination
/services/
  ├── api-gateway/
  ├── mcp-server/
  ├── knowledge-extractor/  # 🆕 AI operations
  ├── rule-engine/          # 🆕 Automation rules
  ├── git-sync-service/     # 🆕 Git operations
  └── notification-service/ # 🆕 Notifications
/packages/
  ├── @weave-nn/common/     # 🆕 Shared utilities
  └── @weave-nn/workflows/  # 🆕 Workflow library
/weave-nn/        # Vault (unchanged)
```

### Phase 4: Full Microservices (v2.0+) - Month 6+
**Services**: 10+ (AI agents, project seeder, vector DB, full observability)
**Trigger**: Multi-user, cloud deployment, advanced features
**Structure**: Matches `/docs/monorepo-structure.md` full vision

---

## Directory Creation Checklist (Phase 4B)

### Must Create Now (MVP)
- [ ] `/weaver/` - Create complete Weaver service structure
- [ ] `/weaver/src/` - All source directories
- [ ] `/weaver/workflows/` - Workflow definitions
- [ ] `/weaver/tests/` - Test structure
- [ ] `/scripts/setup/` - Setup scripts
- [ ] `/config/vault/` - Vault configuration files

### Create as Placeholders
- [ ] `/services/README.md` - Explain future microservices
- [ ] `/packages/README.md` - Explain future shared packages
- [ ] `/infrastructure/kubernetes/README.md` - Explain K8s migration

### Already Exists
- [x] `/weave-nn/` - Obsidian vault (DO NOT MOVE)
- [x] `/infrastructure/local_development_environment/` - Existing setup
- [x] `/docs/` - Project documentation

---

## File Naming Conventions

### TypeScript/JavaScript
- **Files**: `kebab-case.ts` (e.g., `file-watcher.ts`)
- **Classes**: `PascalCase` (e.g., `FileWatcher`)
- **Functions**: `camelCase` (e.g., `watchVaultChanges`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `VAULT_PATH`)

### Python (Future Services)
- **Files**: `snake_case.py` (e.g., `file_watcher.py`)
- **Classes**: `PascalCase` (e.g., `FileWatcher`)
- **Functions**: `snake_case` (e.g., `watch_vault_changes`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `VAULT_PATH`)

### Directories
- **All directories**: `kebab-case` (e.g., `file-watcher/`, `shadow-cache/`)
- **Exception**: Python packages use `snake_case` (e.g., `weave_common/`)

### Vault Files (Obsidian)
- **Concept nodes**: `kebab-case.md` (e.g., `knowledge-graph.md`)
- **Decision records**: `DECISION-ID.md` (e.g., `ED-001-project-scope.md`)
- **Feature specs**: `F-NNN-feature-name.md` (e.g., `F-001-graph-viz.md`)

---

## Git Strategy

### What Gets Tracked
- ✅ All vault content (`/weave-nn/`)
- ✅ Weaver source code (`/weaver/src/`, `/weaver/workflows/`)
- ✅ Configuration files (`/config/`)
- ✅ Documentation (`/docs/`, `/README.md`)
- ✅ Infrastructure (`/infrastructure/docker/`)
- ✅ Scripts (`/scripts/`)

### What Gets Ignored (.gitignore)
```gitignore
# Dependencies
node_modules/
.venv/
venv/
__pycache__/

# Build artifacts
dist/
build/
*.js.map
*.d.ts

# Logs
logs/
*.log

# Environment
.env
.env.local

# Data
weaver/data/
*.db
*.db-journal

# IDEs
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Temporary
tmp/
temp/
*.tmp

# Claude Flow (exclude coordination memory)
.claude-flow/memory/
.hive-mind/sessions/
```

---

## Key Differences: MVP vs Full Microservices

| Aspect | MVP (Current) | Full Microservices (Future) |
|--------|--------------|----------------------------|
| **Primary Language** | TypeScript (Node.js) | Python (FastAPI) + TypeScript |
| **Services** | 1 (Weaver unified) | 10+ (specialized microservices) |
| **Message Bus** | None (direct calls) | RabbitMQ cluster |
| **Database** | SQLite (shadow cache) | PostgreSQL + Redis |
| **API Gateway** | None | Kong API Gateway |
| **Orchestration** | Docker Compose | Kubernetes |
| **Deployment** | Local-first | Cloud-ready |
| **Scaling** | Vertical (single service) | Horizontal (multiple instances) |
| **Complexity** | Low | High |
| **Development Speed** | Fast | Slower |
| **Migration Path** | ➡️ Microservices | N/A |

---

## Related Documentation

### MVP Architecture
- [[mvp-local-first-architecture|MVP Local-First Architecture]] - Complete MVP specification
- [[../mcp/agent-rules-workflows|Agent Rules Workflows]] - Durable workflow definitions
- [[../mcp/weaver-mcp-tools|Weaver MCP Tools]] - MCP tool API reference

### Full Microservices Vision
- [[monorepo-structure|Full Monorepo Structure]] - Complete microservices architecture
- [[migration-strategy-local-to-microservices|Migration Strategy]] - Detailed migration plan
- [[naming-conventions|Naming Conventions]] - Consistent naming across project

### Planning
- [[../weave-nn/_planning/phases/phase-4b-pre-development-mvp-planning-sprint|Phase 4B Plan]]
- [[../weave-nn/_planning/phases/phase-5-claude-flow-integration|Phase 5 Plan]]

---

## Action Items (Phase 4B)

### Immediate (This Week)
1. ✅ Document MVP monorepo structure (this file)
2. ⏳ Create `/weaver/` directory structure
3. ⏳ Create `/scripts/setup/` scripts
4. ⏳ Create `/config/vault/` configuration files
5. ⏳ Create placeholder READMEs in `/services/` and `/packages/`
6. ⏳ Update `docker-compose.yml` with Weaver service

### Next Week (Phase 5)
7. ⏳ Implement Weaver core components
8. ⏳ Implement durable workflows
9. ⏳ Implement MCP tools
10. ⏳ Implement proof workflows (task-completion, phase-completion)

---

**Status**: Active MVP Development
**Owner**: Phase 4B-5 team
**Priority**: Critical (blocks Phase 5)
**Last Updated**: 2025-10-23
