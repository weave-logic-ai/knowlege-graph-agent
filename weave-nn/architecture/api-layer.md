---
architecture_id: A-002
layer_name: API & Backend Layer
category: application-services
status: planned
created_date: '2025-10-21'
complexity: complex
related:
  - '[[../technical/supabase]]'
  - '[[../mcp/model-context-protocol]]'
  - '[[../features/user-permissions]]'
  - '[[frontend-layer]]'
  - '[[data-knowledge-layer]]'
  - '[[ai-integration-layer]]'
tags:
  - architecture
  - backend
  - api
  - authentication
  - real-time
type: architecture
visual:
  icon: "\U0001F3D7️"
  color: '#F59E0B'
  cssclasses:
    - type-architecture
    - status-planned
version: '3.0'
updated_date: '2025-10-28'
---

# API & Backend Layer

The API and backend layer orchestrates business logic, authentication, and data access between Weave-NN's frontend interfaces and underlying knowledge graph storage. This layer enforces security boundaries, manages concurrent access, and provides consistent interfaces for both human users and AI agents.

## Core Responsibilities

The backend exposes RESTful or GraphQL APIs for CRUD operations on knowledge graph nodes, edges, and metadata. API endpoints handle node creation, relationship management, search queries, and bulk operations. Response formats optimize for both graph visualization and document editing contexts, minimizing over-fetching while ensuring sufficient data for UI rendering.

Authentication and authorization form critical backend concerns. User registration, login, session management, and token validation secure access to knowledge assets. Role-based access control enforces permissions, determining which users can view, edit, or delete specific nodes. Integration with [[../technical/supabase|Supabase]] authentication streamlines this process, leveraging built-in providers for email, OAuth, and magic links.

WebSocket connections enable real-time features, broadcasting changes to connected clients. When one user edits a document, the backend propagates updates to other viewers, synchronizing cursor positions and content modifications. Presence indicators show which users are currently active in specific graph regions.

## MCP Server Integration

The [[../mcp/model-context-protocol|Model Context Protocol]] integration makes the backend accessible to AI agents through standardized tool interfaces. MCP servers expose knowledge graph operations as callable tools, allowing agents to query, create, and modify nodes programmatically. This bridges human and AI interactions, enabling agents to participate in knowledge curation alongside users.

Authentication for MCP clients follows the same permission model as human users. Agents operate with specific role assignments, limiting their access to appropriate graph regions. Audit logging tracks all MCP operations, maintaining transparency about AI-generated modifications.

## API Design Patterns

GraphQL provides flexible querying, allowing clients to request precisely the data they need. Graph traversal queries naturally map to GraphQL's nested structure, fetching nodes and their relationships in single requests. Mutations handle creation and updates, with optimistic locking preventing concurrent edit conflicts.

REST endpoints complement GraphQL for simpler operations and file uploads. Versioned API routes enable evolution without breaking existing clients. Pagination and cursor-based iteration handle large result sets efficiently. Caching headers reduce redundant data transfer for frequently accessed nodes.

## Infrastructure Considerations

The backend deployment strategy affects scalability and operational complexity. [[../technical/supabase|Supabase]] provides managed PostgreSQL, authentication, and real-time infrastructure, accelerating development while maintaining PostgreSQL's querying power. Edge functions enable serverless compute for lightweight operations.

Alternative approaches include containerized Node.js or Python services, offering maximum control at the cost of operational overhead. Serverless frameworks like AWS Lambda or Vercel Functions provide auto-scaling without server management. The choice balances development velocity, cost efficiency, and operational expertise.

## Performance and Caching

Caching strategies reduce database load and improve response times. In-memory caches store frequently accessed nodes and graph segments. Query result caching handles expensive graph traversals, invalidating on relevant updates. Redis or similar solutions provide distributed caching for multi-instance deployments.

Background job queues process intensive operations asynchronously, preventing API timeouts. Graph index rebuilding, bulk imports, and AI analysis tasks execute outside request cycles, updating clients through WebSocket notifications upon completion.

## Related

### Architecture
- [[frontend-layer]] - Consumes API services
- [[data-knowledge-layer]] - Accessed through backend APIs
- [[ai-integration-layer]] - MCP integration for AI agents

### Technical
- [[../technical/supabase]] - Potential backend platform
- [[../technical/postgresql]] - Database accessed by backend
- [[../technical/websockets]] - Real-time communication protocol

### MCP
- [[../mcp/model-context-protocol]] - AI agent integration protocol
- [[../mcp/ai-agent-integration]] - Agent access patterns

### Features
- [[../features/user-permissions]] - Authorization implementation
- [[../features/collaborative-editing]] - Real-time synchronization
- [[../features/backup-sync]] - Data export APIs

## Message Queue Integration

To ensure a decoupled, scalable, and secure architecture, all API and service communication is mediated through a central message queue. Instead of direct API-to-API calls, services publish events to the queue, and other services subscribe to these events to perform their tasks. This pattern prevents service dependencies, improves fault tolerance, and provides a single point for implementing cross-cutting concerns like security and auditing.

Tasks are orchestrated by Weaver (workflow.dev), which acts as a proxy layer between RabbitMQ and downstream services. Weaver syndicates task-related events (e.g., `task.created`, `task.completed`) to RabbitMQ, allowing various microservices to react to task state changes without tight coupling. For instance, a vault-writing service can listen for `task.completed` events to archive project files, while a notification service can alert users.

This queue-centric model with Weaver orchestration is visualized below:

```mermaid
graph TD
    subgraph "Producers (Publish to Queue Only)"
        A[APIs<br/>(Obsidian REST, GitHub, External)]
        B[Weaver Proxy<br/>(workflow.dev)<br/>Task Orchestration & Routing]
        C[File Watcher]
        D[AI Agents<br/>(via MCP)]
        E[User Triggers<br/>(Webhooks, Events)]
    end

    subgraph "Central Message Bus"
        RQ[RabbitMQ<br/>(Topic Exchange: weave-nn.events)<br/>Queues: tasks.*, vault.*, ai.*<br/>Throughput: 1000s/sec<br/>Durable & Persistent]
    end

    subgraph "Consumers (Subscribe from Queue Only)"
        F[Task Processor<br/>(Weaver Integration)]
        G[Vault Writer<br/>(No Direct API Writes)]
        H[AI Security Layer<br/>(Validation, Audit, Transparency<br/>e.g., Claude Anomaly Detection)]
        I[Notification Service<br/>(Slack, Email)]
        J[Git Sync<br/>(Auto-Commit on Events)]
    end

    subgraph "Sinks"
        K[Obsidian Vault<br/>(Markdown Files, Tasks)]
        L[External Systems<br/>(GitHub Issues, Databases)]
    end

    %% Flows: All through queue, no direct connections
    A -->|Publish Events<br/>e.g., task.create| RQ
    B -->|Syndicate Tasks<br/>e.g., workflow.complete| RQ
    C -->|File Events<br/>e.g., vault.file.updated| RQ
    D -->|Agent Actions<br/>e.g., agent.suggestion| RQ
    E -->|Manual Triggers| RQ

    RQ -->|Subscribe & Process<br/>AI Security Check| H
    H -->|Validated Messages| F
    H -->|Validated Messages| G
    H -->|Validated Messages| I
    H -->|Validated Messages| J

    F -->|Task Updates| B  %% Route through Weaver
    B -->|Syndicated Events| RQ  %% Loop back for syndication
    G --> K
    J --> L
    I --> L

    %% Styling
    classDef producer fill:#e1f5fe
    classDef queue fill:#f3e5f5
    classDef consumer fill:#e8f5e8
    classDef sink fill:#fff3e0

    class A,B,C,D,E producer
    class RQ queue
    class F,G,H,I,J consumer
    class K,L sink
```

---

**Created**: 2025-10-21
**Last Updated**: 2025-10-21
**Status**: Planned
