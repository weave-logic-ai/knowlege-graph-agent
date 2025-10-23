# Technical Primitives Directory

**Purpose**: Catalog of atomic technical building blocks used in Weave-NN architecture.

---

## What IS a Technical Primitive?

A **technical primitive** is an **atomic, reusable technical building block** that provides foundational capabilities without composing other primitives. Think of them as the "elements" in the periodic table of your tech stack.

### Core Characteristics

1. **Atomic**: Cannot be meaningfully decomposed further
   - PostgreSQL is atomic (it's a single database system)
   - "Full-stack web application" is NOT atomic (it's composed of many primitives)

2. **Foundational**: Provides low-level capabilities that other systems build upon
   - HTTP protocol enables web communication
   - REST API patterns use HTTP protocol

3. **Reusable**: Can be used in multiple contexts/features
   - RabbitMQ can handle file events, task queues, notifications
   - FastAPI can serve MCP endpoints, REST APIs, webhooks

4. **Technology-Focused**: Describes a specific tool/framework/protocol/standard
   - Python (language), FastAPI (framework), Docker (platform)
   - NOT "microservices architecture" (that's a pattern)

5. **Externally Maintained**: Typically maintained by external teams/communities
   - Open source projects (React, PostgreSQL)
   - Commercial products (GitHub, Stripe)
   - Standards bodies (HTTP, WebSocket)

### Scope Boundaries

**Technical primitives answer**: "What technology/tool/protocol are we using?"

**They do NOT answer**:
- "How do we architect the system?" → That's `/architecture/`
- "What features do we build?" → That's `/features/`
- "What patterns do we follow?" → That's `/patterns/`
- "What decisions did we make?" → That's `/decisions/`

---

## Categories of Technical Primitives

Based on Weave-NN's Obsidian-First MVP architecture:

### 1. Languages
**Definition**: Programming languages and their runtimes.

**Examples**:
- Python (MCP server, file watcher, event consumers)
- JavaScript/TypeScript (future frontend, if needed)
- SQL (database queries)

**When to document**: When first using a language in the project.

---

### 2. Frameworks
**Definition**: Opinionated application frameworks that structure code.

**Examples**:
- FastAPI (Python web framework for MCP server)
- pytest (Python testing framework)
- Next.js (future frontend framework - not MVP)

**NOT frameworks**:
- Libraries (those are category #3)
- Architectural patterns (those go in `/architecture/`)

**When to document**: When adopting a framework that shapes major components.

---

### 3. Libraries
**Definition**: Code packages that provide specific functionality without dictating architecture.

**Examples**:
- Pika (Python RabbitMQ client library)
- Watchdog (Python file system monitoring)
- SQLAlchemy (future PostgreSQL ORM)
- Requests (HTTP client library)

**Distinction from Frameworks**:
- Library: You call its functions (Pika.connect())
- Framework: It calls your functions (FastAPI route handlers)

**When to document**: When library is critical to architecture (Pika, Watchdog).
**When NOT to document**: Trivial utility libraries (dateutil, uuid).

---

### 4. Services
**Definition**: Self-contained server processes/daemons that provide infrastructure.

**Examples**:
- RabbitMQ (message broker)
- PostgreSQL (future database server)
- Redis (future cache server)
- Docker (containerization platform)
- Git (version control system)

**MVP Services** (Week 1-2):
- RabbitMQ (event bus)
- Docker (container runtime)

**Post-MVP Services**:
- PostgreSQL (replaces SQLite in v1.0)
- Redis (distributed cache in v1.0)
- Prometheus (monitoring in v1.0)

**When to document**: When adding a new service to docker-compose.yml.

---

### 5. Protocols
**Definition**: Standard communication/data formats that enable interoperability.

**Examples**:
- HTTP/HTTPS (web communication)
- AMQP (RabbitMQ messaging protocol)
- WebSocket (real-time bidirectional communication)
- SMTP (future email integration)

**When to document**: When protocol choice is architecturally significant.
- Document HTTP? Only if discussing REST vs GraphQL vs gRPC.
- Document AMQP? Yes - explains why RabbitMQ vs Kafka vs Redis Streams.

---

### 6. Standards
**Definition**: Data formats, API styles, and conventions.

**Examples**:
- REST (API architectural style)
- JSON (data serialization format)
- YAML (configuration file format)
- Markdown (documentation format)
- MCP (Model Context Protocol for AI agent integration)

**When to document**: When standard shapes major interfaces.
- Document REST? Yes - explains MCP Server's dual REST + MCP endpoints.
- Document JSON? No - too ubiquitous to warrant a node.

---

### 7. Tools
**Definition**: Developer tools and utilities for building/testing/deploying.

**Examples**:
- Git (version control)
- Docker (containerization)
- pytest (testing)
- Black (Python code formatter)
- Make (build automation)

**When to document**: When tool is critical to development workflow.
- Document Git? Yes - explains auto-commit workflow.
- Document Black? Only if enforcing via pre-commit hooks.

---

### 8. Platforms
**Definition**: Complete platforms/ecosystems that host or extend functionality.

**Examples**:
- Obsidian (knowledge management platform)
- GitHub (code hosting + CI/CD)
- Google Cloud Platform (future deployment target)
- Notion (alternative knowledge platform - evaluated)

**When to document**: When platform is core to architecture.
- Document Obsidian? YES - entire MVP is "Obsidian-First"
- Document GitHub? Yes - explains PR automation workflows
- Document Docker Hub? No - that's just an image registry

---

## When to Create a Technical Primitive

### Decision Criteria

**CREATE a technical primitive node when**:

1. **Architecturally Significant**: The technology shapes major system design
   - RabbitMQ → Event-driven architecture
   - FastAPI → Async Python web services
   - Obsidian → File-based knowledge graph

2. **Requires Justification**: We evaluated alternatives and made a choice
   - PostgreSQL vs MongoDB vs Neo4j
   - RabbitMQ vs Kafka vs Redis Streams
   - FastAPI vs Flask vs Django

3. **Non-Obvious Trade-offs**: The technology has important limitations
   - SQLite (MVP) → Cannot handle concurrent writes
   - Docker Compose (MVP) → No auto-scaling (vs Kubernetes)
   - Watchdog (file watcher) → Platform-specific quirks

4. **Integration Complexity**: Connecting it to our system requires documentation
   - Obsidian REST API client (custom integration)
   - RabbitMQ message schemas (event contracts)
   - Claude-Flow hooks (coordination protocol)

5. **Multiple Use Cases**: Used in 2+ places in architecture
   - RabbitMQ (file events, MCP sync, git commits, agent tasks)
   - Docker (MCP server, file watcher, event consumer, RabbitMQ)
   - Python (all backend services)

### Minimum Documentation Requirements

Every technical primitive node MUST have:

1. **Frontmatter**: Structured metadata (see template below)
2. **Overview**: 1-2 sentence description of what it is
3. **Category**: Which of the 8 categories it belongs to
4. **Why We Use It**: Specific Weave-NN use case
5. **Key Capabilities**: 3-5 bullet points of relevant features
6. **Integration Points**: Where it fits in our architecture
7. **Configuration**: Basic config/deployment notes
8. **Alternatives Considered**: What else we evaluated
9. **Decision Reference**: Link to ADR (Architecture Decision Record)
10. **Learning Resources**: Official docs, tutorials, best practices
11. **Phase Usage**: When introduced, how used in each phase

---

## When NOT to Create a Technical Primitive

### What Belongs Elsewhere

**❌ HIGH-LEVEL FEATURES** → Use `/features/` instead
- "Real-time collaborative editing" is a FEATURE
- WebSockets + Yjs + Supabase are the PRIMITIVES that enable it

**❌ ARCHITECTURAL PATTERNS** → Use `/architecture/` instead
- "Event-driven architecture" is a PATTERN
- RabbitMQ is the PRIMITIVE that implements it

**❌ COMPOSITE SYSTEMS** → Break down into atomic primitives
- "Full-stack web application" → FastAPI + React + PostgreSQL
- "Microservices architecture" → Individual services are primitives

**❌ INTERNAL CODE** → Use code documentation instead
- "RuleEngine class" → That's internal code, not a primitive
- FastAPI framework → That's the primitive

**❌ TRIVIAL/OBVIOUS TOOLS** → Don't document unless significant
- JSON serialization → Too basic to document
- Python `datetime` module → Too basic
- RabbitMQ with custom message schemas → YES, document this

### Examples of What NOT to Document

| What | Why Not | What to Document Instead |
|------|---------|-------------------------|
| "Microservices" | It's a pattern, not a primitive | Individual services (MCP Server, File Watcher) |
| "REST API" as technology | Too vague, it's a style | FastAPI (framework), REST as standard |
| "Event-driven architecture" | It's a pattern | RabbitMQ (message broker), AMQP (protocol) |
| "Shadow Cache pattern" | It's our internal pattern | SQLite (MVP storage), PostgreSQL (future) |
| "Python datetime module" | Too trivial/basic | Only if using specialized time library |
| "JSON" | Too ubiquitous | Only if discussing JSON vs YAML vs Protobuf |
| "Git commands" | Tool usage, not architecture | Git as version control system + auto-commit workflow |

---

## Template Structure

Every technical primitive follows this format:

```markdown
---
type: technical-primitive
category: [language|framework|library|service|protocol|standard|tool|platform]
status: [planned|in-use|deprecated|evaluated-rejected]
first_used_phase: "PHASE-X"
mvp_required: true/false
future_only: true/false
maturity: [experimental|stable|mature|legacy]

# Integration tracking
used_in_services:
  - service-name-1
  - service-name-2
deployment: [local-dev|docker-compose|kubernetes|cloud-managed]

# Relationships
alternatives_considered:
  - "[[alternative-1]]"
  - "[[alternative-2]]"
replaces: "[[previous-technology]]"
replaced_by: "[[future-technology]]"

# Documentation
decision: "[[../decisions/technical/decision-id]]"
architecture: "[[../architecture/system-component]]"

tags:
  - technical
  - [category]
  - [status]
---

# [Technology Name]

**Category**: [Framework/Library/Service/Protocol/Standard/Tool/Platform]
**Status**: [In Use (MVP) / Planned (v1.0) / Deprecated]
**First Used**: Phase X (Week Y)

---

## Overview

[1-2 sentence description of what this technology is]

**Official Site**: [link]
**Documentation**: [link]

---

## Why We Use It

[Specific use case in Weave-NN architecture]

**Primary Purpose**: [Main reason for adoption]

**Specific Use Cases**:
- Use case 1 in [service/component]
- Use case 2 in [service/component]
- Use case 3 in [service/component]

---

## Key Capabilities

[3-5 bullet points of features relevant to Weave-NN]

- **Capability 1**: [Description] - used in [component]
- **Capability 2**: [Description] - enables [feature]
- **Capability 3**: [Description] - supports [requirement]

---

## Integration Points

[Where this technology fits in our architecture]

**Used By**:
- [[../architecture/component-1]] - [how used]
- [[../architecture/component-2]] - [how used]

**Integrates With**:
- [[other-primitive-1]] - [relationship]
- [[other-primitive-2]] - [relationship]

**Enables Features**:
- [[../features/feature-1]] - [how it enables]

---

## Configuration

[Basic configuration needed for Weave-NN]

**Docker Compose** (MVP):
```yaml
service-name:
  image: technology-name:version
  ports:
    - "port:port"
  environment:
    CONFIG_VAR: value
```

**Environment Variables**:
- `VAR_NAME`: [description] (default: value)

**Key Configuration Files**:
- `/path/to/config.yml` - [purpose]

---

## Deployment

**MVP (Phase 5-6)**: Docker Compose on local machine
**v1.0 (Post-MVP)**: [Kubernetes/Cloud Managed/Self-Hosted]

**Resource Requirements**:
- RAM: [X MB/GB]
- CPU: [X cores]
- Storage: [X GB]

**Health Check**:
```bash
# Command to verify it's running
curl http://localhost:port/health
```

---

## Trade-offs

**Pros** (Why we chose it):
- ✅ [Advantage 1]
- ✅ [Advantage 2]
- ✅ [Advantage 3]

**Cons** (What we accepted):
- ⚠️ [Limitation 1] - mitigated by [solution]
- ⚠️ [Limitation 2] - acceptable because [reason]

---

## Alternatives Considered

**Compared With**:

### [[alternative-1]]
- **Pros**: [What it offers]
- **Cons**: [Why we didn't choose it]
- **Decision**: Rejected because [reason]

### [[alternative-2]]
- **Pros**: [What it offers]
- **Cons**: [Why we didn't choose it]
- **Decision**: Rejected because [reason]

---

## Decision History

**Decision Record**: [[../decisions/technical/decision-id]]

**Key Reasoning**:
> [Quote from decision maker explaining the choice]

**Date Decided**: YYYY-MM-DD
**Decided By**: [Role/Person]

---

## Phase Usage

### Phase 5 (MVP Week 1) - [Status]
[How used, if at all]

### Phase 6 (MVP Week 2) - [Status]
[How used, if at all]

### Phase 7 (v1.0) - [Status]
[Future plans, if any]

---

## Learning Resources

**Official Documentation**:
- [Link to official docs]
- [Link to API reference]

**Tutorials**:
- [Tutorial 1 title](link)
- [Tutorial 2 title](link)

**Best Practices**:
- [Best practices guide](link)
- [Production deployment guide](link)

**Community**:
- [GitHub repo](link)
- [Discord/Forum](link)

---

## Monitoring & Troubleshooting

**Health Checks**:
```bash
# Check if service is running
docker ps | grep service-name

# Check logs
docker logs service-name
```

**Common Issues**:
1. **Issue**: [Problem description]
   **Solution**: [How to fix]

2. **Issue**: [Problem description]
   **Solution**: [How to fix]

---

## Related Nodes

**Architecture**:
- [[../architecture/component]] - Uses this primitive

**Features**:
- [[../features/feature]] - Enabled by this primitive

**Decisions**:
- [[../decisions/technical/decision]] - Why we chose this

**Other Primitives**:
- [[related-primitive]] - [relationship]

---

## Revisit Criteria

**Reconsider this technology if**:
- [Condition 1] (e.g., performance degrades below threshold)
- [Condition 2] (e.g., maintenance burden exceeds X hours/month)
- [Condition 3] (e.g., better alternative emerges)

**Scheduled Review**: [Date] (e.g., 6 months after v1.0 launch)

---

**Back to**: [[README|Technical Primitives Index]]
```

---

## Good Examples vs Bad Examples

### ✅ GOOD: PostgreSQL.md

```markdown
---
type: technical-primitive
category: service
status: planned
first_used_phase: "PHASE-7"
mvp_required: false
future_only: true
---

# PostgreSQL

**Category**: Database Service
**Status**: Planned (v1.0 - replaces SQLite)
**First Used**: Phase 7 (Post-MVP)

## Overview

PostgreSQL is an open source relational database with ACID compliance, JSON support, and full-text search capabilities.

## Why We Use It

Replaces SQLite when Weave-NN transitions from single-user MVP to multi-user production. Provides:
- Concurrent write support (SQLite bottleneck)
- Network-accessible storage (for distributed services)
- Advanced indexing (for knowledge graph queries)

## Alternatives Considered

- MongoDB: Rejected due to lack of relational integrity for linked nodes
- Neo4j: Rejected due to operational complexity vs PostgreSQL + AGE extension
```

**Why this is good**:
- Clearly atomic (one database system)
- Justifies the choice (vs MongoDB, Neo4j)
- Explains Weave-NN-specific use case
- Links to decision record
- Documents migration path (SQLite → PostgreSQL)

---

### ✅ GOOD: RabbitMQ.md

```markdown
---
type: technical-primitive
category: service
status: in-use
first_used_phase: "PHASE-5"
mvp_required: true
used_in_services:
  - mcp-server
  - file-watcher
  - event-consumer
deployment: docker-compose
---

# RabbitMQ

**Category**: Message Broker Service
**Status**: In Use (MVP)
**First Used**: Phase 5 (Week 1)

## Why We Use It

Enables event-driven architecture for Weave-NN:
- File watcher publishes vault change events
- Event consumer processes events asynchronously
- Decouples services (file watcher ≠ rule engine)
- Guarantees event delivery (persistent queues)

## Key Capabilities

- **AMQP Protocol**: Standard messaging protocol
- **Persistent Queues**: Survives service restarts
- **Acknowledgments**: Ensures no event loss
- **Dead-Letter Queues**: Handles poison messages

## Integration Points

**Publishers**:
- [[../architecture/file-watcher]] - Publishes file change events

**Consumers**:
- [[../architecture/event-consumer]] - Consumes all events

**Enables Features**:
- [[../features/auto-tagging]] - Triggered by file events
- [[../features/auto-linking]] - Triggered by file events
```

**Why this is good**:
- Explains architectural role (event-driven)
- Documents integration points (publishers/consumers)
- Covers configuration (Docker Compose)
- Links to architecture docs
- Explains why RabbitMQ vs alternatives (Kafka, Redis Streams)

---

### ❌ BAD: "Event-Driven Architecture.md" in /technical/

**Why this is bad**:
- Not a technology, it's an ARCHITECTURAL PATTERN
- Belongs in `/architecture/event-driven-architecture.md`
- RabbitMQ is the primitive that implements the pattern

**What to do instead**:
- Create `/architecture/event-driven-architecture.md` (pattern)
- Reference `/technical/RabbitMQ.md` (primitive)
- Create `/decisions/technical/TS-009-event-driven-vs-polling.md` (decision)

---

### ❌ BAD: "Full-Stack Application.md" in /technical/

**Why this is bad**:
- Not atomic (composed of FastAPI + React + PostgreSQL)
- Too high-level (it's a system architecture, not a primitive)

**What to do instead**:
- Create `/architecture/mvp-local-first-architecture.md` (system)
- Reference `/technical/FastAPI.md` (backend primitive)
- Reference `/technical/React.md` (frontend primitive)
- Reference `/technical/PostgreSQL.md` (database primitive)

---

### ❌ BAD: "JSON.md" in /technical/

**Why this is bad**:
- Too trivial (JSON is ubiquitous)
- No decision to document (no alternatives considered)
- No integration complexity

**Exception**: If we were discussing JSON vs YAML vs Protobuf for RabbitMQ message format, THEN create a decision node, not a primitive node.

---

## Integration with Architecture Docs

### The Relationship

```
/architecture/          →  System design, patterns, component interactions
    ↓ references
/technical/            →  Atomic technologies used in architecture
    ↓ justified by
/decisions/technical/  →  Why we chose these technologies
```

### Example: File Watcher System

**Architecture Doc** (`/architecture/file-watcher.md`):
```markdown
# File Watcher Architecture

The file watcher detects Obsidian vault changes and publishes events to RabbitMQ.

**Components**:
- [[../technical/Watchdog]] - Monitors file system changes
- [[../technical/Python]] - Programming language
- [[../technical/Pika]] - RabbitMQ client library
- [[../technical/RabbitMQ]] - Message broker

**Design Pattern**: Publisher-Subscriber (event-driven)
```

**Technical Primitive** (`/technical/Watchdog.md`):
```markdown
# Watchdog

**Category**: Library
**Used By**: [[../architecture/file-watcher]]

## Overview

Python library for monitoring file system changes with platform-independent API.

## Why We Use It

Detects Obsidian vault changes (create, modify, delete) to trigger agent rules.

## Integration Points

- [[../architecture/file-watcher]] uses Watchdog to monitor `/vault` directory
- [[../technical/Pika]] publishes Watchdog events to RabbitMQ
```

**Decision Doc** (`/decisions/technical/file-monitoring-library.md`):
```markdown
# TS-015: File Monitoring Library

**Chosen**: Watchdog

**Alternatives Considered**:
- Polling (os.walk every 1 second) - rejected due to CPU overhead
- inotify (Linux only) - rejected due to platform lock-in
- Watchdog - chosen for cross-platform support
```

---

## Maintenance Guidelines

### Adding New Primitives

**Trigger**: When adopting a new technology in docker-compose.yml or code.

**Process**:
1. Check if primitive already exists
2. Create node from template
3. Fill out all required sections
4. Link to architecture docs that use it
5. Link to decision that justified it
6. Update this README index

**Checklist**:
- [ ] Frontmatter complete (all required fields)
- [ ] "Why We Use It" explains Weave-NN-specific use case
- [ ] "Alternatives Considered" shows research was done
- [ ] Linked to at least 1 architecture doc
- [ ] Linked to decision record (if exists)
- [ ] Configuration section has Docker Compose snippet
- [ ] Learning resources section has 2+ links

---

### Deprecating Primitives

**When**: A technology is replaced by an alternative.

**Process**:
1. Update frontmatter: `status: deprecated`
2. Add `replaced_by: "[[new-primitive]]"` field
3. Add "Deprecation Notice" section at top
4. Update architecture docs to reference new primitive
5. Keep node for historical context (don't delete)

**Example**:
```markdown
---
status: deprecated
replaced_by: "[[PostgreSQL]]"
---

# SQLite

> **⚠️ DEPRECATED**: Replaced by [[PostgreSQL]] in v1.0 (Phase 7)
>
> **Reason**: SQLite cannot handle concurrent writes required for multi-user mode.
> **Migration Date**: 2025-12-01
> **Migration Guide**: [[../guides/sqlite-to-postgresql-migration]]

[Rest of document preserved for history]
```

---

### Reviewing Primitives

**Frequency**: Every 6 months after v1.0 launch

**Checklist**:
- [ ] Status still accurate? (in-use, planned, deprecated)
- [ ] Links still valid? (documentation, tutorials)
- [ ] Configuration still correct? (version numbers, ports)
- [ ] Trade-offs still accurate? (new pros/cons discovered)
- [ ] Alternatives section current? (new technologies emerged)
- [ ] Integration points complete? (new usages added)

---

## Index of Primitives

### By Category

#### Languages (1)
- Python - Primary language for all services

#### Frameworks (2)
- FastAPI - Async web framework for MCP server
- pytest - Testing framework

#### Libraries (3)
- Pika - RabbitMQ client (AMQP)
- Watchdog - File system monitoring
- (Future) SQLAlchemy - PostgreSQL ORM

#### Services (4)
- RabbitMQ - Message broker (MVP)
- Docker - Container platform (MVP)
- PostgreSQL - Database (v1.0)
- Redis - Cache (v1.0)

#### Protocols (2)
- AMQP - RabbitMQ messaging protocol
- HTTP/REST - MCP server API

#### Standards (3)
- MCP - Model Context Protocol
- REST - API architectural style
- JSON - Data serialization

#### Tools (3)
- Git - Version control
- Docker Compose - Multi-container orchestration (MVP)
- Kubernetes - Container orchestration (v1.0)

#### Platforms (2)
- Obsidian - Knowledge management platform (primary)
- GitHub - Code hosting + CI/CD

---

### By MVP Status

#### MVP Required (Phase 5-6)
- Python
- FastAPI
- Pika
- Watchdog
- RabbitMQ
- Docker
- Obsidian

#### Post-MVP (Phase 7+)
- PostgreSQL (replaces SQLite)
- Redis (distributed cache)
- Kubernetes (replaces Docker Compose)
- SQLAlchemy (ORM)

#### Evaluated but Rejected
- (Document rejected alternatives here for future reference)

---

### By Service Usage

#### MCP Server
- Python, FastAPI, Pika (RabbitMQ client)

#### File Watcher
- Python, Watchdog, Pika

#### Event Consumer
- Python, Pika, (Future: SQLAlchemy)

#### Infrastructure
- RabbitMQ, Docker, Git

---

## Related Documentation

**Architecture**:
- [[../architecture/mvp-local-first-architecture]] - How primitives compose into MVP
- [[../architecture/microservices-architecture]] - Full distributed architecture

**Decisions**:
- [[../decisions/INDEX]] - All technical decisions
- [[../decisions/technical/event-driven-architecture]] - Why RabbitMQ

**Planning**:
- [[../_planning/phases/phase-5-claude-flow-integration]] - MVP Week 1
- [[../_planning/phases/phase-6-mvp-week-1]] - MVP Week 2

---

## Questions?

**"Should I create a node for [X]?"**
→ Ask: Is it atomic? Is it a technology (not a pattern)? Did we evaluate alternatives?

**"This seems like both a primitive and a feature?"**
→ It's probably a feature. WebSockets is a primitive; "Real-time collaborative editing" is a feature that uses WebSockets.

**"What if a primitive is used in only one place?"**
→ Still document it if it's architecturally significant (e.g., Obsidian REST API plugin).

**"Should I document Python standard library modules?"**
→ No, unless using a specialized/controversial library (e.g., asyncio vs threads).

---

**Last Updated**: 2025-10-23
**Maintainer**: System Architect
**Review Schedule**: Every 6 months post-v1.0
