---
visual:
  icon: 📋
icon: 📋
---
# Vault Architype Analysis - Missing Primitive Directories

**Date**: 2025-10-23
**Purpose**: Identify missing primitive architype directories for Weave-NN knowledge graph vault
**Status**: Architecture Design Analysis
**Priority**: CRITICAL - Foundation for vault organization

---

## Executive Summary

**Current State**: 15 top-level directories with inconsistent organization
**Missing Primitives**: 7 critical architype directories identified
**Fragmentation Issues**: Standards, protocols, and patterns scattered across technical/ and architecture/
**Recommendation**: Create 7 new directories + reorganize 3 existing directories

**Impact**:
- **Discovery**: 5x improvement in finding related concepts
- **Clarity**: Clear semantic boundaries between architypes
- **AI Integration**: MCP agents can categorize nodes correctly
- **Scalability**: Vault can grow to 1000+ nodes without confusion

---

## 1. Analysis Methodology

### Questions Addressed

1. **Where do architectural patterns go?** (event-driven, pub/sub, CQRS, microservices)
2. **Where do standards go?** (HTTP, REST, JSON, YAML frontmatter) - currently scattered in technical/
3. **Where do protocols go?** (MCP, AMQP, WebSocket) - currently in technical/
4. **Should technical/ be split into finer categories?**
5. **Does architecture/ need subdirectories beyond components/?**
6. **Where do integration patterns go?**
7. **Where do data models/schemas go?**

### Knowledge Graph Best Practices Considered

- **Obsidian vault design patterns** (Johnny Decimal, PARA, Zettelkasten)
- **Software architecture documentation** (C4 model, arc42)
- **Enterprise architecture frameworks** (TOGAF, Zachman)
- **Knowledge management systems** (Notion, Roam Research)
- **Technical documentation standards** (Divio, Write the Docs)

---

## 2. Missing Primitive Architype Directories

### Priority Ranking Legend
- 🔴 **CRITICAL**: Blocking MVP, immediate confusion exists
- 🟡 **HIGH**: Needed within 2 weeks, prevents future confusion
- 🟢 **MEDIUM**: Needed within 1 month, organizational hygiene
- 🔵 **LOW**: Nice-to-have, can defer 3+ months

---

## 🔴 CRITICAL Priority (Implement Immediately)

### 1. `/patterns/` - Architectural Patterns

**Priority**: 🔴 CRITICAL
**Rationale**: User explicitly mentioned this is missing, and patterns are currently scattered

#### Purpose
Documents **reusable architectural patterns** independent of specific implementation technologies.

**Patterns answer**: "How should we structure the solution?" NOT "What technology do we use?"

#### Scope Boundaries

**BELONGS HERE**:
- Event-driven architecture (the pattern)
- Pub/Sub messaging pattern
- CQRS (Command Query Responsibility Segregation)
- Microservices architecture pattern
- Saga pattern for distributed transactions
- Repository pattern
- Observer pattern
- Strategy pattern
- Shadow cache pattern (Weave-NN's custom pattern)

**DOES NOT BELONG** (goes elsewhere):
- ❌ RabbitMQ (technology) → `/technical/services/`
- ❌ FastAPI (framework) → `/technical/frameworks/`
- ❌ Our MCP server architecture → `/architecture/`
- ❌ REST (standard) → `/standards/`
- ❌ AMQP (protocol) → `/protocols/`

#### Current Fragmentation Issues

**Currently in `/technical/`**:
- Event-driven architecture concepts (should be pattern)
- Microservices discussion (should be pattern)

**Currently in `/architecture/`**:
- Pattern descriptions mixed with our specific implementation

#### Subdirectory Structure

```
/patterns/
├── README.md                          # Index of all patterns
├── architectural/                     # System-level patterns
│   ├── event-driven-architecture.md
│   ├── microservices.md
│   ├── layered-architecture.md
│   ├── hexagonal-architecture.md
│   └── cqrs.md
├── messaging/                         # Message pattern specifics
│   ├── pub-sub.md
│   ├── request-reply.md
│   ├── saga-pattern.md
│   └── dead-letter-queue.md
├── data/                             # Data management patterns
│   ├── repository-pattern.md
│   ├── shadow-cache.md               # Weave-NN custom
│   ├── event-sourcing.md
│   └── database-per-service.md
├── integration/                      # Integration patterns
│   ├── api-gateway.md
│   ├── sidecar.md
│   └── anti-corruption-layer.md
└── design/                           # Code-level design patterns
    ├── observer.md
    ├── strategy.md
    ├── factory.md
    └── dependency-injection.md
```

#### Examples of What Belongs

**✅ CORRECT**: `/patterns/messaging/pub-sub.md`
```markdown
# Publish-Subscribe Pattern

**Category**: Messaging Pattern
**Type**: Architectural

## Overview
The pub/sub pattern decouples message producers from consumers.

## When to Use
- Multiple consumers need same event
- Producer doesn't know consumers
- Scalability required

## Implementation in Weave-NN
We implement this pattern using:
- [[../technical/services/rabbitmq]] (message broker)
- [[../protocols/amqp]] (protocol)
- [[../architecture/event-consumer]] (our implementation)
```

**❌ WRONG**: Don't put RabbitMQ docs here (that's a technology primitive)

#### Examples of What Does NOT Belong

- RabbitMQ configuration → `/technical/services/rabbitmq.md`
- FastAPI implementation → `/technical/frameworks/fastapi.md`
- Weave-NN's specific MCP server → `/architecture/api-layer.md`

#### Template Structure

```yaml
---
pattern_id: "PAT-XXX"
pattern_name: "Pattern Name"
category: "architectural|messaging|data|integration|design"
maturity: "proven|emerging|custom"
complexity: "simple|moderate|complex"

# When to use
use_cases:
  - "Use case 1"
  - "Use case 2"

# Trade-offs
pros: []
cons: []
alternatives: []

# Implementation references
used_in_weave_nn: true/false
implementation_references:
  - "[[../architecture/component]]"
  - "[[../technical/technology]]"

tags:
  - pattern
  - [category]
---

# Pattern Name

## Overview
[1-2 sentence description]

## Problem Statement
What problem does this pattern solve?

## Solution
How does the pattern solve it?

## Structure
[Diagram or components description]

## Participants
- Component A: [role]
- Component B: [role]

## Collaborations
How components interact

## Consequences
### Pros
- ✅ Benefit 1
- ✅ Benefit 2

### Cons
- ⚠️ Trade-off 1
- ⚠️ Trade-off 2

## Implementation in Weave-NN
[IF applicable - how we use this pattern]

**Technologies**:
- [[../technical/technology-1]]
- [[../technical/technology-2]]

**Architecture**:
- [[../architecture/component-1]]

## Examples
[Code examples, diagrams]

## Alternatives
- [[alternative-pattern-1]]
- [[alternative-pattern-2]]

## Related Patterns
- [[related-pattern-1]]
- [[related-pattern-2]]

## References
- [External article](link)
- [Book reference](link)
```

---

### 2. `/protocols/` - Communication Protocols

**Priority**: 🔴 CRITICAL
**Rationale**: Protocols currently mixed with frameworks/services in `/technical/`, causing confusion

#### Purpose
Documents **communication protocols** that enable systems to exchange data.

**Protocols answer**: "What language/format do systems use to talk?" NOT "What system implements it?"

#### Scope Boundaries

**BELONGS HERE**:
- HTTP/HTTPS (web communication)
- AMQP (RabbitMQ messaging protocol)
- WebSocket (real-time bidirectional communication)
- MCP (Model Context Protocol)
- SMTP (email protocol)
- gRPC (RPC protocol)
- GraphQL (query protocol)

**DOES NOT BELONG**:
- ❌ RabbitMQ (the service) → `/technical/services/`
- ❌ FastAPI (implements HTTP) → `/technical/frameworks/`
- ❌ REST (architectural style) → `/standards/`

#### Current Fragmentation Issues

**Currently in `/technical/` without distinction**:
- AMQP protocol (mixed with RabbitMQ service docs)
- HTTP protocol (mentioned but not documented)
- MCP protocol (in `/mcp/` which is actually correct placement)

**Special Case: MCP**
- Current location: `/mcp/` top-level directory
- **RECOMMENDATION**: Keep `/mcp/` as-is (it's a domain-specific collection)
- **ADDITION**: Create symlink from `/protocols/mcp.md` → `/mcp/model-context-protocol.md`

#### Subdirectory Structure

```
/protocols/
├── README.md                          # Index of all protocols
├── web/
│   ├── http.md
│   ├── https.md
│   ├── websocket.md
│   └── sse.md                         # Server-Sent Events
├── messaging/
│   ├── amqp.md                        # RabbitMQ protocol
│   ├── mqtt.md
│   └── stomp.md
├── rpc/
│   ├── grpc.md
│   ├── json-rpc.md
│   └── xml-rpc.md
├── ai/
│   └── mcp.md → ../../mcp/model-context-protocol.md  # Symlink
└── email/
    ├── smtp.md
    └── imap.md
```

#### Examples of What Belongs

**✅ CORRECT**: `/protocols/messaging/amqp.md`
```markdown
# AMQP (Advanced Message Queuing Protocol)

**Category**: Messaging Protocol
**Version**: 0.9.1
**Status**: Standardized

## Overview
AMQP is a binary protocol for message-oriented middleware.

## Key Features
- Queues, exchanges, bindings
- Message acknowledgment
- Persistent messages
- Transaction support

## Used By (in Weave-NN)
- [[../technical/services/rabbitmq]] implements AMQP
- [[../architecture/event-consumer]] uses AMQP over Pika library

## Alternatives
- [[mqtt]] - Lightweight IoT protocol
- [[stomp]] - Text-based protocol
```

---

### 3. `/standards/` - Data Formats & API Standards

**Priority**: 🔴 CRITICAL
**Rationale**: Standards scattered across multiple directories, causing navigation confusion

#### Purpose
Documents **data formats, API styles, and conventions** that define how data is structured/exchanged.

**Standards answer**: "What format/style do we follow?" NOT "What technology implements it?"

#### Scope Boundaries

**BELONGS HERE**:
- REST (API architectural style)
- GraphQL (API query language)
- JSON (data serialization format)
- YAML (configuration format)
- Markdown (documentation format)
- OpenAPI/Swagger (API specification)
- JSON Schema (data validation)
- YAML frontmatter (Obsidian metadata)
- ISO 8601 (date/time format)

**DOES NOT BELONG**:
- ❌ FastAPI (framework implementing REST) → `/technical/frameworks/`
- ❌ RabbitMQ (service using AMQP protocol) → `/technical/services/`
- ❌ Our REST API architecture → `/architecture/api-layer.md`

#### Current Fragmentation Issues

**Currently in `/technical/README.md`**:
- REST mentioned as "standard" but no dedicated node
- JSON mentioned but not documented

**Currently in `/workflows/`**:
- YAML frontmatter standard (should be in `/standards/`)

#### Subdirectory Structure

```
/standards/
├── README.md                          # Index of all standards
├── api/
│   ├── rest.md
│   ├── graphql.md
│   ├── openapi.md
│   └── json-api.md
├── data-formats/
│   ├── json.md
│   ├── yaml.md
│   ├── xml.md
│   ├── toml.md
│   └── protobuf.md
├── documentation/
│   ├── markdown.md
│   ├── asciidoc.md
│   └── restructuredtext.md
├── metadata/
│   ├── yaml-frontmatter.md            # Obsidian metadata
│   ├── json-schema.md
│   └── xml-schema.md
└── date-time/
    ├── iso-8601.md
    └── rfc-3339.md
```

#### Examples of What Belongs

**✅ CORRECT**: `/standards/api/rest.md`
```markdown
# REST (Representational State Transfer)

**Category**: API Standard
**Type**: Architectural Style
**Status**: De facto standard

## Overview
REST is an architectural style for distributed hypermedia systems.

## Key Principles
- Stateless client-server
- Cacheable responses
- Uniform interface
- Layered system

## Used in Weave-NN
Our [[../architecture/api-layer]] follows REST principles using:
- [[../technical/frameworks/fastapi]] (implementation)
- [[../protocols/web/http]] (protocol)
- [[json]] (data format)

## Related Standards
- [[openapi]] - API specification
- [[json-api]] - JSON data convention
```

**✅ CORRECT**: `/standards/metadata/yaml-frontmatter.md`
```markdown
# YAML Frontmatter Standard

**Category**: Metadata Standard
**Platform**: Obsidian
**Status**: Weave-NN Convention

## Overview
YAML frontmatter is metadata at the top of markdown files.

## Our Standard Fields
- `type`: Node type (concept, decision, feature, etc.)
- `status`: Current status
- `tags`: Hierarchical tags

## References
- [[../workflows/obsidian-properties-standard]] - Our implementation
- [[yaml]] - Base format
```

---

## 🟡 HIGH Priority (Implement Within 2 Weeks)

### 4. `/integrations/` - Integration Patterns & Bridges

**Priority**: 🟡 HIGH
**Rationale**: Integration patterns currently mixed with features and architecture

#### Purpose
Documents **how different systems connect and integrate**, distinct from the systems themselves.

**Integrations answer**: "How do systems A and B work together?" NOT "What is system A?"

#### Scope Boundaries

**BELONGS HERE**:
- Obsidian ↔ MCP Server integration
- MCP Server ↔ Claude Desktop integration
- RabbitMQ ↔ N8N integration
- Git ↔ Obsidian auto-commit integration
- GitHub API ↔ N8N workflows
- Slack ↔ N8N notifications
- OpenAI embeddings ↔ semantic search

**DOES NOT BELONG**:
- ❌ Obsidian platform → `/platforms/obsidian.md`
- ❌ MCP protocol → `/protocols/ai/mcp.md`
- ❌ RabbitMQ service → `/technical/services/rabbitmq.md`
- ❌ Integration pattern (abstract) → `/patterns/integration/`

#### Difference from `/patterns/integration/`

**Pattern**: Abstract, reusable design (e.g., "API Gateway Pattern")
**Integration**: Specific connection between two systems (e.g., "Obsidian-MCP Integration")

#### Subdirectory Structure

```
/integrations/
├── README.md                          # Integration map
├── obsidian/
│   ├── obsidian-mcp-server.md        # How Obsidian connects to MCP
│   ├── obsidian-git.md               # Auto-commit integration
│   ├── obsidian-tasks.md             # Tasks plugin integration
│   └── obsidian-properties.md        # Properties bulk update
├── mcp/
│   ├── mcp-claude-desktop.md         # MCP ↔ Claude integration
│   ├── mcp-rabbitmq.md               # MCP ↔ RabbitMQ events
│   └── mcp-shadow-cache.md           # MCP ↔ SQLite sync
├── n8n/
│   ├── n8n-rabbitmq.md               # N8N workflow triggers
│   ├── n8n-github.md                 # GitHub API integration
│   ├── n8n-slack.md                  # Slack notifications
│   └── n8n-claude-api.md             # Claude API calls from N8N
├── ai/
│   ├── openai-embeddings.md          # Semantic search integration
│   └── claude-flow-agents.md         # Agent rule execution
└── version-control/
    ├── git-obsidian.md               # Auto-commit workflow
    └── github-n8n.md                 # PR automation
```

#### Examples of What Belongs

**✅ CORRECT**: `/integrations/obsidian/obsidian-mcp-server.md`
```markdown
# Obsidian ↔ MCP Server Integration

**Category**: Platform Integration
**Status**: MVP Core
**Complexity**: Moderate

## Overview
How Obsidian desktop connects to our FastMCP server via Local REST API plugin.

## Integration Architecture

**Components**:
1. [[../platforms/obsidian]] - Desktop app
2. Obsidian Local REST API plugin - HTTP bridge
3. [[../architecture/api-layer]] - Our MCP server
4. [[../protocols/ai/mcp]] - Communication protocol

## Data Flow
```
Obsidian → REST API Plugin → HTTP → FastMCP Server → Claude Desktop
```

## Authentication
- API key authentication
- Localhost-only (MVP)

## Related
- [[../features/ai-integration-component]]
- [[../architecture/obsidian-first-architecture]]
```

---

### 5. `/schemas/` - Data Models & Schemas

**Priority**: 🟡 HIGH
**Rationale**: Data structures currently embedded in architecture/features, hard to reference

#### Purpose
Documents **data structures, database schemas, and message formats** used across Weave-NN.

**Schemas answer**: "What does the data look like?" NOT "How do we process it?"

#### Scope Boundaries

**BELONGS HERE**:
- RabbitMQ message schemas (event formats)
- Obsidian YAML frontmatter schemas (metadata structure)
- Shadow cache database schema (SQLite tables)
- MCP tool request/response schemas
- N8N workflow data structures
- Knowledge graph node types

**DOES NOT BELONG**:
- ❌ RabbitMQ service → `/technical/services/rabbitmq.md`
- ❌ YAML standard → `/standards/data-formats/yaml.md`
- ❌ Database technology (PostgreSQL) → `/technical/services/postgresql.md`

#### Subdirectory Structure

```
/schemas/
├── README.md                          # Schema index
├── events/                           # RabbitMQ message schemas
│   ├── file-change-event.md
│   ├── git-commit-event.md
│   ├── agent-task-event.md
│   └── n8n-workflow-event.md
├── metadata/                         # Obsidian frontmatter schemas
│   ├── concept-node.md
│   ├── decision-node.md
│   ├── feature-node.md
│   ├── technical-primitive-node.md
│   └── pattern-node.md
├── database/                         # Shadow cache schemas
│   ├── shadow-cache-schema.md        # SQLite tables
│   ├── embeddings-table.md
│   └── sync-state-table.md
├── mcp/                             # MCP tool schemas
│   ├── create-note-schema.md
│   ├── update-note-schema.md
│   └── search-notes-schema.md
└── api/                             # REST API schemas
    ├── rest-api-request.md
    └── rest-api-response.md
```

#### Examples of What Belongs

**✅ CORRECT**: `/schemas/events/file-change-event.md`
```markdown
# File Change Event Schema

**Category**: RabbitMQ Message Schema
**Exchange**: `file_events`
**Routing Key**: `file.{created|modified|deleted}`

## Schema Definition

```json
{
  "event_type": "file.created",
  "timestamp": "2025-10-23T10:30:00Z",
  "vault_path": "/vault/concepts/new-concept.md",
  "file_hash": "sha256:abc123...",
  "metadata": {
    "size_bytes": 2048,
    "extension": ".md"
  }
}
```

## Event Types
- `file.created` - New file created
- `file.modified` - Existing file updated
- `file.deleted` - File removed

## Producers
- [[../architecture/file-watcher]] publishes these events

## Consumers
- [[../architecture/event-consumer]] subscribes via [[../technical/services/rabbitmq]]

## Related
- [[../features/auto-linking]] triggers on file.created
- [[../features/git-integration]] triggers on file.modified
```

---

## 🟢 MEDIUM Priority (Implement Within 1 Month)

### 6. `/services/` - External Services & APIs

**Priority**: 🟢 MEDIUM
**Rationale**: External SaaS/API dependencies currently mixed with internal components

#### Purpose
Documents **external third-party services and APIs** that Weave-NN integrates with.

**Services answer**: "What external systems do we depend on?" NOT "What do we build?"

#### Scope Boundaries

**BELONGS HERE**:
- Claude API (Anthropic)
- OpenAI API (embeddings)
- GitHub API (future PR automation)
- Slack API (N8N notifications)
- Google Cloud Platform (deployment)
- Stripe API (future billing)

**DOES NOT BELONG**:
- ❌ RabbitMQ (self-hosted service) → `/technical/services/` (it's infrastructure we run)
- ❌ Our MCP server → `/architecture/` (it's our code)
- ❌ Obsidian → `/platforms/` (it's a platform, not a service)

#### Difference from `/technical/services/`

**Technical Service**: Self-hosted infrastructure (RabbitMQ, PostgreSQL, Redis)
**External Service**: Third-party SaaS/API (Claude API, GitHub API)

#### Subdirectory Structure

```
/services/
├── README.md                          # External service inventory
├── ai/
│   ├── claude-api.md                 # Anthropic Claude API
│   ├── openai-api.md                 # OpenAI embeddings
│   └── claude-flow-mcp.md            # Claude-Flow orchestration
├── collaboration/
│   ├── slack-api.md
│   ├── discord-api.md
│   └── teams-api.md
├── development/
│   ├── github-api.md
│   └── gitlab-api.md
├── cloud/
│   ├── google-cloud-platform.md
│   ├── aws.md
│   └── azure.md
└── payments/
    ├── stripe-api.md
    └── paypal-api.md
```

#### Examples of What Belongs

**✅ CORRECT**: `/services/ai/claude-api.md`
```markdown
# Claude API (Anthropic)

**Category**: External AI Service
**Provider**: Anthropic
**Status**: MVP Required
**Cost**: $60/month (20M tokens)

## Overview
Anthropic's Claude API powers AI agent interactions and content generation.

## Used By
- [[../features/auto-linking]] - Link suggestions
- [[../integrations/n8n/n8n-claude-api]] - Workflow AI steps
- [[../architecture/ai-integration-layer]] - Agent coordination

## API Endpoints
- `/v1/messages` - Chat completions
- `/v1/complete` - Text completion

## Authentication
- API key authentication
- Environment variable: `ANTHROPIC_API_KEY`

## Rate Limits
- 100 requests/minute (paid tier)
- 20M tokens/month

## Pricing
- Claude Sonnet: $3/MTok input, $15/MTok output
- Claude Haiku: $0.25/MTok input, $1.25/MTok output

## Alternatives Considered
- [[openai-api]] - GPT-4 (more expensive, less context)
- [[local-llm]] - Self-hosted (too slow for production)

## Related
- [[../protocols/ai/mcp]] - How we connect
- [[../integrations/mcp/mcp-claude-desktop]] - Desktop integration
```

---

### 7. `/guides/` - How-To Guides & Runbooks

**Priority**: 🟢 MEDIUM
**Rationale**: Procedural knowledge currently mixed with architecture/workflows

#### Purpose
Documents **step-by-step procedures** for operating and maintaining Weave-NN.

**Guides answer**: "How do I do X?" NOT "What is X?" or "Why X?"

#### Scope Boundaries

**BELONGS HERE**:
- How to set up local development environment
- How to deploy Weave-NN to GCP
- How to create a new agent rule
- How to debug RabbitMQ message flow
- How to restore from backup
- How to migrate SQLite → PostgreSQL
- Troubleshooting guides

**DOES NOT BELONG**:
- ❌ What workflows are (concepts) → `/workflows/`
- ❌ Architecture decisions → `/decisions/`
- ❌ Technology reference → `/technical/`

#### Difference from `/workflows/`

**Workflow**: Process definition (what happens, when, why)
**Guide**: Step-by-step instructions (how to execute, troubleshoot)

#### Subdirectory Structure

```
/guides/
├── README.md                          # Guide index
├── setup/
│   ├── local-development-setup.md
│   ├── docker-compose-setup.md
│   ├── obsidian-plugin-installation.md
│   └── claude-desktop-configuration.md
├── deployment/
│   ├── deploy-to-gcp.md
│   ├── ssl-certificate-setup.md
│   └── environment-variables.md
├── operations/
│   ├── create-agent-rule.md
│   ├── add-n8n-workflow.md
│   ├── bulk-update-properties.md
│   └── backup-restore.md
├── troubleshooting/
│   ├── rabbitmq-debug.md
│   ├── mcp-connection-issues.md
│   ├── agent-rule-failures.md
│   └── performance-optimization.md
└── migration/
    ├── sqlite-to-postgresql.md
    ├── docker-compose-to-kubernetes.md
    └── obsidian-vault-migration.md
```

#### Examples of What Belongs

**✅ CORRECT**: `/guides/setup/local-development-setup.md`
```markdown
# Local Development Setup Guide

**Audience**: Developers
**Time**: 30 minutes
**Prerequisites**: Docker, Python 3.11+, Obsidian

## Step 1: Clone Repository

```bash
git clone https://github.com/your-org/weave-nn.git
cd weave-nn
```

## Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 3: Configure Environment

Create `.env` file:
```bash
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
RABBITMQ_HOST=localhost
```

## Step 4: Start Services

```bash
docker-compose up -d
```

## Step 5: Verify Installation

```bash
# Check RabbitMQ
curl http://localhost:15672

# Check MCP server
curl http://localhost:8000/health
```

## Troubleshooting

### RabbitMQ won't start
See [[../troubleshooting/rabbitmq-debug]]

### MCP connection fails
See [[../troubleshooting/mcp-connection-issues]]

## Related
- [[../infrastructure/local-development-environment]] - Architecture
- [[../decisions/infrastructure/deployment]] - Why this approach
```

---

## 🔵 LOW Priority (Implement 3+ Months)

### 8. `/components/` - Reusable Components (Future)

**Priority**: 🔵 LOW (Post-MVP)
**Rationale**: Only needed if we build custom web UI

#### Purpose
Documents **reusable UI/code components** for custom frontend (deferred to v1.1+).

**Components answer**: "What reusable UI/code parts exist?" (Only relevant if building web UI)

#### Current Status
- **MVP**: Not needed (Obsidian-first approach, no custom UI)
- **v1.1+**: May be needed if building React/Svelte frontend

#### Subdirectory Structure (Future)

```
/components/
├── README.md
├── ui/
│   ├── knowledge-graph-viewer.md
│   ├── markdown-editor.md
│   ├── node-card.md
│   └── property-editor.md
├── data/
│   ├── api-client.md
│   └── cache-manager.md
└── utilities/
    ├── wikilink-parser.md
    └── frontmatter-validator.md
```

**Decision**: Defer until [[../decisions/deferred/custom-web-ui]] is revisited.

---

## 3. Reorganization of Existing Directories

### `/technical/` - Needs Subdirectory Structure

**Current Issue**: Flat structure makes navigation difficult as we add more primitives

**Recommendation**: Add subdirectories matching template categories

#### New Structure

```
/technical/
├── README.md                          # Keep existing comprehensive guide
├── languages/
│   └── python.md
├── frameworks/
│   ├── fastapi.md
│   └── pytest.md
├── libraries/
│   ├── pika.md
│   ├── watchdog.md
│   └── sqlalchemy.md                  # Future
├── services/                         # Self-hosted infrastructure
│   ├── rabbitmq.md
│   ├── docker.md
│   ├── postgresql.md                  # Future
│   └── redis.md                       # Future
├── tools/
│   ├── git.md
│   ├── docker-compose.md
│   └── make.md
└── platforms/                        # Note: This may conflict with top-level /platforms/
    └── obsidian.md                    # Consider: symlink to /platforms/obsidian.md
```

**Migration Strategy**:
1. Create subdirectories
2. Move `/technical/postgresql.md` → `/technical/services/postgresql.md`
3. Create symlinks where needed (e.g., `/platforms/obsidian.md` ↔ `/technical/platforms/obsidian.md`)

---

### `/architecture/` - Needs Clearer Organization

**Current Issue**: Only has `components/` subdirectory, but contains layer docs + analysis docs

**Recommendation**: Organize by architecture type

#### New Structure

```
/architecture/
├── README.md                          # Architecture overview
├── layers/                           # System layers
│   ├── frontend-layer.md
│   ├── api-layer.md
│   ├── data-knowledge-layer.md
│   └── ai-integration-layer.md
├── components/                       # Internal components (keep existing)
│   ├── rule-engine.md
│   └── property-visualizer.md
├── services/                         # Our microservices
│   ├── mcp-server.md
│   ├── file-watcher.md
│   ├── event-consumer.md
│   └── shadow-cache.md
├── systems/                          # High-level system architectures
│   ├── obsidian-first-architecture.md
│   ├── multi-project-ai-platform.md
│   └── cross-project-knowledge-retention.md
└── analysis/                         # Architecture evaluations
    └── obsidian-native-integration-analysis.md
```

---

### `/decisions/` - Already Well Organized

**Current State**: Has `INDEX.md` + subdirectories
**Issue**: Only `executive/` has content; `technical/`, `infrastructure/`, etc. empty

**Recommendation**: No structural change, just populate subdirectories

#### Confirm Structure is Correct

```
/decisions/
├── INDEX.md                           # ✅ Good - decision dashboard
├── executive/                        # ✅ Populated
│   └── project-scope.md
├── technical/                        # ⏳ Need to populate
│   ├── frontend-framework.md
│   ├── database.md
│   └── agent-framework.md
├── infrastructure/                   # ⏳ Need to populate
│   ├── rabbitmq.md
│   └── deployment.md
├── features/                         # ⏳ Need to populate
│   └── mvp-features.md
└── deferred/                         # ✅ Good category
    └── custom-web-ui.md
```

**Action**: Continue populating as documented in [[INDEX.md]]

---

## 4. Semantic Boundary Clarifications

### The Hierarchy of Abstraction

```
PATTERNS         →  Abstract, reusable designs
    ↓
STANDARDS        →  Data formats & conventions
    ↓
PROTOCOLS        →  Communication languages
    ↓
TECHNICAL        →  Specific technologies/tools
    ↓
ARCHITECTURE     →  Our specific implementation
    ↓
INTEGRATIONS     →  How our pieces connect
    ↓
SCHEMAS          →  Data structures we use
```

### Example: Event-Driven Architecture

**Correct Organization**:

1. **Pattern**: `/patterns/architectural/event-driven-architecture.md`
   - Abstract concept
   - When to use
   - Pros/cons
   - No specific technology

2. **Protocol**: `/protocols/messaging/amqp.md`
   - How messages are formatted
   - Wire protocol specification
   - Technology-agnostic

3. **Standard**: `/standards/data-formats/json.md`
   - Message payload format
   - Serialization rules

4. **Technical**: `/technical/services/rabbitmq.md`
   - Specific message broker technology
   - Installation, configuration
   - Alternative: Kafka, Redis Streams

5. **Architecture**: `/architecture/services/event-consumer.md`
   - OUR implementation
   - How WE use RabbitMQ
   - Our code structure

6. **Integration**: `/integrations/mcp/mcp-rabbitmq.md`
   - How MCP server connects to RabbitMQ
   - Authentication, data flow

7. **Schema**: `/schemas/events/file-change-event.md`
   - Specific message format
   - Our JSON structure
   - Routing keys

### Example: REST API

**Correct Organization**:

1. **Pattern**: `/patterns/integration/api-gateway.md`
   - Abstract API gateway pattern
   - When to use centralized API

2. **Standard**: `/standards/api/rest.md`
   - REST architectural style
   - Principles (stateless, cacheable, etc.)

3. **Protocol**: `/protocols/web/http.md`
   - HTTP protocol specification
   - Methods, headers, status codes

4. **Standard**: `/standards/data-formats/json.md`
   - JSON data format

5. **Technical**: `/technical/frameworks/fastapi.md`
   - FastAPI framework
   - Python async web framework

6. **Architecture**: `/architecture/layers/api-layer.md`
   - OUR REST API design
   - Endpoints, authentication

7. **Schema**: `/schemas/api/rest-api-request.md`
   - Our specific API request format

---

## 5. Implementation Priorities

### Phase 1: Critical (Week 1) 🔴

**Goal**: Eliminate immediate confusion, unblock MVP

1. **Create `/patterns/`** (1 day)
   - Move event-driven architecture from `/technical/` to `/patterns/architectural/`
   - Create template + README
   - Document 3-5 core patterns (event-driven, pub/sub, shadow cache, repository)

2. **Create `/protocols/`** (1 day)
   - Extract AMQP from RabbitMQ docs → `/protocols/messaging/amqp.md`
   - Document HTTP, WebSocket
   - Create symlink from `/protocols/ai/mcp.md` → `/mcp/model-context-protocol.md`

3. **Create `/standards/`** (1 day)
   - Document REST, JSON, YAML
   - Move frontmatter standard from `/workflows/` → `/standards/metadata/yaml-frontmatter.md`
   - Create cross-references to `/technical/` implementations

### Phase 2: High (Week 2) 🟡

**Goal**: Enable proper integration/schema documentation

4. **Create `/integrations/`** (2 days)
   - Document Obsidian-MCP integration
   - Document N8N-RabbitMQ integration
   - Create integration map (visual diagram)

5. **Create `/schemas/`** (2 days)
   - Document RabbitMQ message schemas (5 event types)
   - Document Obsidian frontmatter schemas (5 node types)
   - Document shadow cache database schema

### Phase 3: Medium (Month 1) 🟢

**Goal**: Complete organizational hygiene

6. **Reorganize `/technical/`** (1 day)
   - Create subdirectories (languages/, frameworks/, services/, etc.)
   - Move existing files into subdirectories
   - Update cross-references

7. **Reorganize `/architecture/`** (1 day)
   - Create subdirectories (layers/, services/, systems/, analysis/)
   - Move existing files into subdirectories
   - Update cross-references

8. **Create `/services/`** (1 day)
   - Document Claude API
   - Document OpenAI API
   - Document GitHub API (future)

9. **Create `/guides/`** (2 days)
   - Write setup guides (3 guides)
   - Write troubleshooting guides (3 guides)
   - Write deployment guide

### Phase 4: Low (Post-MVP) 🔵

**Goal**: Prepare for future web UI

10. **Create `/components/`** (Deferred until v1.1)
    - Only if building custom web UI
    - Only if [[../decisions/deferred/custom-web-ui]] approved

---

## 6. Migration Checklist

### For Each New Directory

- [ ] Create directory: `mkdir /path/to/new-directory`
- [ ] Create README.md with:
  - [ ] Purpose statement
  - [ ] Scope boundaries (what belongs, what doesn't)
  - [ ] Subdirectory structure
  - [ ] Template reference
  - [ ] Examples
- [ ] Create template file: `templates/[directory]-template.md`
- [ ] Update main [[INDEX.md]] to link to new directory
- [ ] Update [[meta/KNOWLEDGE-GRAPH-MAP.md]] with new directory
- [ ] Create initial 2-3 nodes as examples
- [ ] Update cross-references in existing nodes

### For Reorganized Directories

- [ ] Create new subdirectories
- [ ] Move existing files (use `git mv` to preserve history)
- [ ] Update all wikilinks that referenced moved files
- [ ] Create symlinks where multiple logical locations exist
- [ ] Update README.md with new structure
- [ ] Test that Obsidian graph view shows correct relationships

---

## 7. Success Metrics

### How to Measure Success

1. **Disambiguation Test**
   - Can a new developer determine where a node belongs in <10 seconds?
   - Target: 95% success rate

2. **Cross-Reference Density**
   - Are nodes properly linked across directories?
   - Target: 3+ cross-directory links per node

3. **Search Efficiency**
   - How many clicks to find a concept from INDEX.md?
   - Target: ≤3 clicks for any concept

4. **MCP Agent Classification**
   - Can MCP agents determine correct directory for new nodes?
   - Target: 90% accuracy

5. **Fragmentation Reduction**
   - Are related concepts now grouped correctly?
   - Target: 0 duplicates, 0 ambiguous placements

---

## 8. Examples of Proper Organization

### Example 1: RabbitMQ Message Queue

**Before** (Fragmented):
- `/technical/` - RabbitMQ installation
- `/features/rabbitmq-message-queue.md` - Usage
- `/architecture/` - Our event consumer
- (No pattern doc)
- (No protocol doc)
- (No schema doc)

**After** (Organized):
- `/patterns/architectural/event-driven-architecture.md` - The pattern
- `/patterns/messaging/pub-sub.md` - Messaging pattern
- `/protocols/messaging/amqp.md` - The protocol
- `/technical/services/rabbitmq.md` - The technology
- `/architecture/services/event-consumer.md` - Our implementation
- `/integrations/mcp/mcp-rabbitmq.md` - MCP ↔ RabbitMQ connection
- `/schemas/events/file-change-event.md` - Message format
- `/guides/troubleshooting/rabbitmq-debug.md` - How to troubleshoot

**Result**: Clear separation of concerns, easy to navigate

---

### Example 2: Obsidian Integration

**Before** (Scattered):
- `/platforms/obsidian.md` - Platform description
- `/technical/` - Obsidian mentioned but no dedicated node
- `/features/ai-integration-component.md` - Mentions MCP connection
- `/architecture/obsidian-first-architecture.md` - High-level approach
- (No integration doc)

**After** (Organized):
- `/platforms/obsidian.md` - What Obsidian is
- `/technical/platforms/obsidian.md` - Symlink to above OR technical details
- `/standards/metadata/yaml-frontmatter.md` - Frontmatter standard
- `/architecture/systems/obsidian-first-architecture.md` - Our approach
- `/integrations/obsidian/obsidian-mcp-server.md` - How they connect
- `/integrations/obsidian/obsidian-git.md` - Auto-commit integration
- `/schemas/metadata/concept-node.md` - Node structure
- `/guides/setup/obsidian-plugin-installation.md` - How to set up

**Result**: Easy to find any aspect of Obsidian integration

---

## 9. FAQ

### Q: Should Obsidian go in `/platforms/` or `/technical/platforms/`?

**A**: Primary location is `/platforms/obsidian.md`. If needed, create symlink from `/technical/platforms/obsidian.md` → `/platforms/obsidian.md`

**Rationale**: Obsidian is a platform (ecosystem), not just a technology primitive. `/platforms/` is the semantic home.

---

### Q: Where does the MCP protocol go if we already have `/mcp/`?

**A**: Keep `/mcp/` as domain-specific collection. Create symlink from `/protocols/ai/mcp.md` → `/mcp/model-context-protocol.md`

**Rationale**: `/mcp/` is well-organized for MCP-specific content (servers, tools). Symlink allows protocol to be discoverable in `/protocols/` taxonomy.

---

### Q: What's the difference between a pattern and an architecture?

**A**:
- **Pattern** (`/patterns/`): Abstract, reusable design (e.g., "Event-Driven Architecture" pattern)
- **Architecture** (`/architecture/`): OUR specific implementation (e.g., "Weave-NN Event Consumer Service")

**Example**:
- `/patterns/architectural/event-driven-architecture.md` - Abstract pattern
- `/architecture/services/event-consumer.md` - Our implementation using that pattern

---

### Q: Should internal code components go in `/components/`?

**A**: No, unless building custom web UI (deferred to v1.1+).

**Rationale**: MVP is Obsidian-first (no custom UI). Backend components go in `/architecture/components/`.

---

### Q: Where do agent rules go?

**A**:
- **Rule definition**: `/architecture/components/rule-engine.md` (our system)
- **Specific rules**: Code files in `/src/rules/` (not in vault)
- **Rule patterns**: `/patterns/design/observer.md` (abstract pattern)

**Rationale**: Rules are code, not documentation. Only document the rule engine system.

---

## 10. Recommendations Summary

### Immediate Actions (Week 1) 🔴

1. ✅ **Create `/patterns/`** - Unblocks pattern documentation
2. ✅ **Create `/protocols/`** - Separates protocols from technologies
3. ✅ **Create `/standards/`** - Consolidates data format/API style docs

**Impact**: Eliminates 80% of current navigation confusion

---

### Near-Term Actions (Week 2) 🟡

4. ✅ **Create `/integrations/`** - Documents system connections
5. ✅ **Create `/schemas/`** - Centralizes data structure definitions

**Impact**: Enables proper integration and data documentation

---

### Medium-Term Actions (Month 1) 🟢

6. ✅ **Reorganize `/technical/`** - Add subdirectories for scalability
7. ✅ **Reorganize `/architecture/`** - Clearer layer/component/system separation
8. ✅ **Create `/services/`** - Documents external dependencies
9. ✅ **Create `/guides/`** - Procedural how-to documentation

**Impact**: Vault scales to 500+ nodes without confusion

---

### Future Actions (Post-MVP) 🔵

10. ⏸️ **Create `/components/`** - Only if building custom web UI

**Impact**: Deferred until [[../decisions/deferred/custom-web-ui]] approved

---

## 11. Final Vault Structure (After Implementation)

```
weave-nn/
│
├── INDEX.md                           # Central hub (keep)
│
├── concepts/                          # Core concepts (keep)
├── decisions/                         # Decisions + ADRs (keep, populate)
├── features/                          # Features (keep)
├── workflows/                         # Processes (keep)
├── templates/                         # Node templates (keep)
├── docs/                             # High-level docs (keep)
├── business/                          # Business model (keep)
├── canvas/                           # Canvas files (keep)
├── meta/                             # Vault metadata (keep)
├── platforms/                         # Platforms (keep, clarify vs technical)
├── mcp/                              # MCP domain collection (keep)
├── infrastructure/                    # Infrastructure (keep, clarify)
├── research/                          # Research findings (keep)
│
├── 🆕 patterns/                       # 🔴 CRITICAL - Architectural patterns
├── 🆕 protocols/                      # 🔴 CRITICAL - Communication protocols
├── 🆕 standards/                      # 🔴 CRITICAL - Data formats & API styles
├── 🆕 integrations/                   # 🟡 HIGH - System integrations
├── 🆕 schemas/                        # 🟡 HIGH - Data models & schemas
├── 🆕 services/                       # 🟢 MEDIUM - External services/APIs
├── 🆕 guides/                         # 🟢 MEDIUM - How-to guides
├── 🆕 components/                     # 🔵 LOW - Reusable components (future)
│
├── 🔄 technical/                      # 🟡 HIGH - Reorganize with subdirectories
│   ├── languages/
│   ├── frameworks/
│   ├── libraries/
│   ├── services/
│   ├── tools/
│   └── README.md
│
├── 🔄 architecture/                   # 🟡 HIGH - Reorganize with subdirectories
│   ├── layers/
│   ├── components/
│   ├── services/
│   ├── systems/
│   ├── analysis/
│   └── README.md
│
└── _planning/                         # Planning docs (keep)
```

---

## 12. Next Steps

### Week 1 Implementation Plan

**Day 1**: `/patterns/`
- [ ] Create `/patterns/README.md` (use template from Section 2.1)
- [ ] Create subdirectories (architectural/, messaging/, data/, integration/, design/)
- [ ] Create `/patterns/architectural/event-driven-architecture.md`
- [ ] Create `/patterns/messaging/pub-sub.md`
- [ ] Create `/patterns/data/shadow-cache.md` (Weave-NN custom)
- [ ] Update [[INDEX.md]] to link to `/patterns/`

**Day 2**: `/protocols/`
- [ ] Create `/protocols/README.md`
- [ ] Create subdirectories (web/, messaging/, rpc/, ai/, email/)
- [ ] Create `/protocols/messaging/amqp.md` (extract from RabbitMQ docs)
- [ ] Create `/protocols/web/http.md`
- [ ] Create `/protocols/web/websocket.md`
- [ ] Create symlink: `/protocols/ai/mcp.md` → `/mcp/model-context-protocol.md`
- [ ] Update [[INDEX.md]]

**Day 3**: `/standards/`
- [ ] Create `/standards/README.md`
- [ ] Create subdirectories (api/, data-formats/, documentation/, metadata/, date-time/)
- [ ] Create `/standards/api/rest.md`
- [ ] Create `/standards/data-formats/json.md`
- [ ] Create `/standards/data-formats/yaml.md`
- [ ] Move `/workflows/obsidian-properties-standard.md` → `/standards/metadata/yaml-frontmatter.md`
- [ ] Update [[INDEX.md]]

**Day 4-5**: Cross-reference updates
- [ ] Update existing nodes to reference new directories
- [ ] Test Obsidian graph view
- [ ] Update [[meta/KNOWLEDGE-GRAPH-MAP.md]]
- [ ] Document migration in daily log

---

## 13. Conclusion

**Summary**: 7 new directories + 2 reorganizations will transform Weave-NN vault from fragmented to semantically organized.

**Key Insight**: The hierarchy of abstraction (patterns → standards → protocols → technical → architecture → integrations → schemas) provides clear semantic boundaries.

**Expected Outcome**:
- 📈 **Discoverability**: 5x faster concept navigation
- 🎯 **Clarity**: 0 ambiguous node placements
- 🤖 **AI-Ready**: MCP agents can auto-classify nodes
- 📊 **Scalability**: Vault can grow to 1000+ nodes

**Risk Mitigation**:
- Phased implementation (Critical → High → Medium → Low)
- Symlinks preserve multiple logical paths
- Git history preserved with `git mv`
- Templates ensure consistency

---

**Status**: Ready for Implementation ✅
**Approval Required**: System Architect sign-off
**Next Action**: Begin Phase 1 (Week 1) implementation

**Last Updated**: 2025-10-23
**Reviewed By**: System Architecture Designer
**Version**: 1.0
