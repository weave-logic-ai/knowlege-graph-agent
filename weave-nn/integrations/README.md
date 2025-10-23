# Integration Documentation

## What IS an Integration?

An **integration** is a **concrete, specific connection** between two or more systems, services, or tools that enables them to work together. It defines:

- **Specific endpoints** (APIs, protocols, interfaces)
- **Data transformation logic** (format conversion, mapping)
- **Connection mechanics** (authentication, transport)
- **Error handling** (retries, fallbacks, recovery)
- **Configuration** (environment-specific settings)

### Real-World Analogy

Think of integration as a **bridge between two cities**:
- **Cities** = Systems/Services (Obsidian, MCP Server, RabbitMQ)
- **Bridge** = Integration (connection layer, data flow)
- **Traffic rules** = Protocols and data formats
- **Toll booths** = Authentication and authorization
- **Emergency lanes** = Error handling and fallbacks

## Core Characteristics

### What Makes Something an Integration?

✅ **Specific connection between named systems**
- "Obsidian connects to MCP Server via WebSocket"
- "File watcher publishes to RabbitMQ exchange 'file-events'"
- "Git auto-commit hooks into pre-commit workflow"

✅ **Concrete technical implementation**
- API endpoints and authentication methods
- Message formats and serialization
- Transport protocols (HTTP, WebSocket, AMQP)

✅ **Bidirectional or unidirectional data flow**
- Request/response patterns
- Event emission and consumption
- Data synchronization logic

✅ **Integration-specific configuration**
- Connection strings and credentials
- Retry policies and timeouts
- Data transformation rules

### What is NOT an Integration?

❌ **Abstract design patterns** → Goes in `/patterns/`
- Example: "Pub/Sub pattern" (abstract concept)
- Belongs: `/patterns/messaging/pub-sub.md`

❌ **General technology documentation** → Goes in `/technical/`
- Example: "RabbitMQ message broker" (technology itself)
- Belongs: `/technical/services/rabbitmq.md`

❌ **System architecture designs** → Goes in `/architecture/`
- Example: "Microservices architecture" (system design)
- Belongs: `/architecture/microservices/overview.md`

❌ **Implementation code** → Goes in `/src/`
- Example: "RabbitMQ client library" (code module)
- Belongs: `/src/integrations/rabbitmq-client.ts`

## Scope Boundaries

### Integration vs Pattern

| Aspect | Integration | Pattern |
|--------|-------------|---------|
| **Nature** | Concrete connection | Abstract design |
| **Example** | "Obsidian ↔ MCP via WebSocket" | "Observer pattern" |
| **Location** | `/integrations/obsidian/` | `/patterns/behavioral/` |
| **Content** | API endpoints, auth, config | Concept, UML, use cases |
| **Reusability** | Project-specific | Cross-project applicable |

### Integration vs Architecture

| Aspect | Integration | Architecture |
|--------|-------------|--------------|
| **Scope** | Connection layer | System design |
| **Focus** | How systems connect | How systems are structured |
| **Example** | "MCP → Claude API bridge" | "Event-driven architecture" |
| **Location** | `/integrations/ai/` | `/architecture/event-driven/` |
| **Granularity** | Point-to-point | System-wide |

### Integration vs Technical

| Aspect | Integration | Technical |
|--------|-------------|-----------|
| **Purpose** | How we connect | What we use |
| **Example** | "Git auto-commit workflow" | "Git version control" |
| **Location** | `/integrations/version-control/` | `/technical/tools/git.md` |
| **Content** | Connection logic, hooks | Features, commands, concepts |
| **Context** | Project-specific usage | General technology knowledge |

## Directory Structure

```
/integrations/
├── README.md                    # This file - comprehensive guide
├── obsidian/                    # Obsidian vault integrations
│   ├── obsidian-mcp-bridge.md  # Obsidian ↔ MCP Server
│   ├── obsidian-git-sync.md    # Obsidian ↔ Git auto-commit
│   └── plugin-integrations.md  # Custom plugin connections
├── mcp/                         # Model Context Protocol integrations
│   ├── mcp-claude.md           # MCP ↔ Claude API
│   ├── mcp-filesystem.md       # MCP ↔ File system watchers
│   └── mcp-server-registry.md  # MCP server discovery
├── messaging/                   # Message broker integrations
│   ├── file-watcher-rabbitmq.md # File watcher → RabbitMQ
│   ├── rabbitmq-handlers.md    # RabbitMQ → Application handlers
│   └── webhook-queue.md        # Webhooks → Message queue
├── ai/                          # AI service integrations
│   ├── mcp-claude.md           # MCP ↔ Claude AI
│   ├── embedding-service.md    # Text → Vector embeddings
│   └── llm-routing.md          # Request → Model selection
├── version-control/             # Version control integrations
│   ├── git-auto-commit.md      # File changes → Git commits
│   ├── git-hooks.md            # Git events → Custom actions
│   └── pre-commit-workflows.md # Pre-commit → CI/CD
└── workflow-automation/         # Automation integrations
    ├── file-system-triggers.md # File events → Workflows
    ├── cron-schedulers.md      # Time-based → Task execution
    └── event-driven-flows.md   # Events → Multi-step workflows
```

## The 6 Categories

### 1. `/obsidian/` - Obsidian Vault Integrations

**Purpose**: Connections between Obsidian vault and external systems

**Examples**:
- Obsidian ↔ MCP Server (vault access, file operations)
- Obsidian ↔ Git (automatic commit and push)
- Obsidian ↔ Plugin ecosystem (Dataview, Templater)

**Key Integration Points**:
- Vault API and file system access
- Plugin hooks and lifecycle events
- Markdown file parsing and generation
- Graph data and metadata

### 2. `/mcp/` - Model Context Protocol Integrations

**Purpose**: MCP server connections to other services and systems

**Examples**:
- MCP ↔ Claude API (AI model access)
- MCP ↔ File system watchers (real-time file monitoring)
- MCP ↔ Server registry (service discovery)

**Key Integration Points**:
- MCP protocol specifications
- Server-to-server communication
- Context management and state
- Tool registration and discovery

### 3. `/messaging/` - Message Broker Integrations

**Purpose**: Event-driven messaging system connections

**Examples**:
- File watcher → RabbitMQ (file change events)
- RabbitMQ → Application handlers (event consumption)
- Webhooks → Message queue (external events)

**Key Integration Points**:
- Message formats and serialization
- Exchange and queue bindings
- Routing keys and patterns
- Dead letter queues and error handling

### 4. `/ai/` - AI Service Integrations

**Purpose**: Connections to AI models and services

**Examples**:
- MCP ↔ Claude AI (language model access)
- Text → Vector embeddings (semantic search)
- Request → Model routing (load balancing)

**Key Integration Points**:
- API authentication and rate limiting
- Prompt engineering and context management
- Response parsing and validation
- Cost optimization and caching

### 5. `/version-control/` - Version Control Integrations

**Purpose**: Git and version control system connections

**Examples**:
- File changes → Git auto-commit
- Git hooks → Custom actions
- Pre-commit → CI/CD pipelines

**Key Integration Points**:
- Git hooks (pre-commit, post-commit, pre-push)
- Commit message generation
- Staging and diff management
- Branch and merge workflows

### 6. `/workflow-automation/` - Automation Integrations

**Purpose**: Event-driven workflow and task automation

**Examples**:
- File system events → Workflows
- Time-based triggers → Task execution
- Multi-step event chains → Complex flows

**Key Integration Points**:
- Event detection and filtering
- Trigger conditions and logic
- Action orchestration
- State management and recovery

## When to CREATE an Integration Document

### Decision Criteria

Create an integration document when:

✅ **You connect two specific systems**
- "I need to connect Obsidian to MCP Server"
- "I need to publish file events to RabbitMQ"

✅ **You implement a concrete data flow**
- "File changes trigger Git commits"
- "MCP requests route to Claude API"

✅ **You configure authentication and protocols**
- "Setting up OAuth for external API"
- "Configuring WebSocket connection"

✅ **You handle integration-specific errors**
- "Retry logic for failed API calls"
- "Fallback when message queue is unavailable"

✅ **You transform data between systems**
- "Convert Obsidian markdown to API JSON"
- "Map file events to RabbitMQ messages"

### Don't CREATE an Integration Document When:

❌ **You're documenting an abstract concept**
→ Use `/patterns/` instead
- Example: "Pub/Sub messaging pattern"

❌ **You're documenting a technology itself**
→ Use `/technical/` instead
- Example: "RabbitMQ message broker features"

❌ **You're designing system architecture**
→ Use `/architecture/` instead
- Example: "Microservices communication design"

❌ **You're writing implementation code**
→ Use `/src/` instead
- Example: "RabbitMQ client module"

## Integration Document Template

Every integration document should follow this structure:

```markdown
---
title: [System A] ↔ [System B] Integration
integration_type: [point-to-point|hub-and-spoke|event-driven|api-gateway]
systems:
  - name: [System A]
    role: [producer|consumer|both]
  - name: [System B]
    role: [producer|consumer|both]
direction: [unidirectional|bidirectional]
protocol: [HTTP|WebSocket|AMQP|gRPC|etc]
authentication: [none|api-key|oauth|jwt|etc]
status: [active|deprecated|planned|experimental]
created: [YYYY-MM-DD]
updated: [YYYY-MM-DD]
---

# [System A] ↔ [System B] Integration

## Overview

Brief description of what this integration accomplishes and why it exists.

## Systems Involved

### System A
- **Role**: Producer/Consumer/Both
- **Technology**: [Specific version/implementation]
- **Endpoint**: [URL/Path/Address]

### System B
- **Role**: Producer/Consumer/Both
- **Technology**: [Specific version/implementation]
- **Endpoint**: [URL/Path/Address]

## Integration Architecture

### Data Flow

```
[System A] → [Transformation] → [Transport] → [System B]
           ← [Response/Event] ←
```

### Components

1. **Connection Layer**
   - Protocol and transport mechanism
   - Connection pooling and management

2. **Authentication Layer**
   - Credentials and token management
   - Authorization and permissions

3. **Data Transformation Layer**
   - Input format → Output format
   - Validation and sanitization

4. **Error Handling Layer**
   - Retry logic and backoff
   - Fallback mechanisms

## Configuration

### Environment Variables

```bash
SYSTEM_A_URL=https://api.systema.com
SYSTEM_A_API_KEY=xxx
SYSTEM_B_HOST=localhost
SYSTEM_B_PORT=5672
```

### Connection Settings

```yaml
connection:
  timeout: 30s
  retries: 3
  backoff: exponential
```

## Data Formats

### Request Format

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### Response Format

```json
{
  "status": "success",
  "data": {...}
}
```

## Error Handling

### Retry Strategy

- Initial retry: 1s delay
- Max retries: 3
- Backoff: Exponential (2^n seconds)

### Fallback Behavior

- On timeout: Use cached data
- On error: Log and alert
- On unavailable: Queue for later

## Monitoring and Observability

### Metrics

- Request rate (requests/second)
- Error rate (errors/requests)
- Latency (p50, p95, p99)

### Logging

- Request/response logging
- Error logging with context
- Performance metrics

### Alerts

- High error rate (> 5%)
- High latency (> 1s p95)
- Connection failures

## Testing

### Integration Tests

```javascript
describe('System A to System B', () => {
  it('should successfully send data', async () => {
    // Test implementation
  });
});
```

### Test Scenarios

1. Happy path - successful data flow
2. Error handling - system unavailable
3. Data transformation - format validation
4. Authentication - expired credentials

## Deployment

### Prerequisites

- System A credentials configured
- System B accessible on network
- Environment variables set

### Deployment Steps

1. Configure connection settings
2. Test connectivity
3. Deploy integration service
4. Monitor initial traffic

## Troubleshooting

### Common Issues

**Issue**: Connection timeout
- **Cause**: Network latency or firewall
- **Solution**: Check network connectivity and firewall rules

**Issue**: Authentication failure
- **Cause**: Expired or invalid credentials
- **Solution**: Refresh credentials and retry

## Related Documentation

- [System A Technical Docs](/technical/services/system-a.md)
- [System B Technical Docs](/technical/services/system-b.md)
- [Integration Pattern](/patterns/integration/api-gateway.md)
- [System Architecture](/architecture/integration-layer.md)

## Maintenance

### Version Compatibility

- System A: v2.x
- System B: v3.x
- Integration Protocol: v1.0

### Update Schedule

- Credentials rotation: Quarterly
- Dependency updates: Monthly
- Performance review: Weekly
```

## Integration Types

### 1. Point-to-Point Integration

**Characteristics**:
- Direct connection between two systems
- Tightly coupled
- Simple to implement
- Limited scalability

**Example**: Obsidian → Git auto-commit

```
[Obsidian] --direct--> [Git]
```

**When to Use**:
- Simple, dedicated connections
- Low volume data transfer
- Minimal transformation needed

### 2. Hub-and-Spoke Integration

**Characteristics**:
- Central hub manages all connections
- Star topology
- Easier to manage at scale
- Single point of failure

**Example**: MCP Server as central hub

```
[Obsidian] ----\
[File System] ---→ [MCP Server] ---→ [Claude API]
[Git Hooks] ----/
```

**When to Use**:
- Multiple systems need coordination
- Central orchestration required
- Consistent integration patterns

### 3. Event-Driven Integration

**Characteristics**:
- Asynchronous communication
- Loose coupling
- High scalability
- Complex debugging

**Example**: File watcher → RabbitMQ → Handlers

```
[File Watcher] → [RabbitMQ] → [Handler 1]
                            → [Handler 2]
                            → [Handler 3]
```

**When to Use**:
- Real-time event processing
- Multiple consumers needed
- Decoupled systems preferred

### 4. API Gateway Integration

**Characteristics**:
- Single entry point
- Request routing and transformation
- Authentication and rate limiting
- Protocol translation

**Example**: API Gateway → Microservices

```
[External API] → [API Gateway] → [Service A]
                                → [Service B]
                                → [Service C]
```

**When to Use**:
- Microservices architecture
- External API exposure
- Complex routing logic needed

## Good vs Bad Examples

### ✅ GOOD Integration Examples

#### Example 1: Obsidian ↔ MCP Server

**Location**: `/integrations/obsidian/obsidian-mcp-bridge.md`

**Why it's good**:
- Specific systems identified (Obsidian, MCP Server)
- Concrete connection mechanism (WebSocket)
- Detailed data flow (vault operations → MCP commands)
- Configuration and authentication specified

```markdown
---
title: Obsidian ↔ MCP Server Integration
integration_type: hub-and-spoke
systems:
  - name: Obsidian Vault
    role: both
  - name: MCP Server
    role: hub
direction: bidirectional
protocol: WebSocket
authentication: api-key
---
```

#### Example 2: File Watcher → RabbitMQ

**Location**: `/integrations/messaging/file-watcher-rabbitmq.md`

**Why it's good**:
- Clear producer/consumer relationship
- Message format specified
- Error handling documented
- Routing key patterns defined

```markdown
---
title: File Watcher → RabbitMQ Integration
integration_type: event-driven
systems:
  - name: File System Watcher
    role: producer
  - name: RabbitMQ
    role: broker
direction: unidirectional
protocol: AMQP
---
```

#### Example 3: MCP ↔ Claude API

**Location**: `/integrations/ai/mcp-claude.md`

**Why it's good**:
- API endpoints and authentication
- Request/response formats
- Rate limiting and retry logic
- Cost optimization strategies

### ❌ BAD Integration Examples (What NOT to Do)

#### Example 1: "Message Queue Pattern"

**Wrong Location**: `/integrations/messaging/message-queue-pattern.md`

**Why it's bad**:
- Abstract pattern, not specific integration
- No concrete systems specified
- General concept, not implementation

**Correct Location**: `/patterns/messaging/message-queue.md`

#### Example 2: "RabbitMQ Message Broker"

**Wrong Location**: `/integrations/messaging/rabbitmq.md`

**Why it's bad**:
- Documenting technology itself, not integration
- No connection to another system
- General features and capabilities

**Correct Location**: `/technical/services/rabbitmq.md`

#### Example 3: "Microservices Communication"

**Wrong Location**: `/integrations/architecture/microservices.md`

**Why it's bad**:
- System architecture design, not specific integration
- High-level concept, not point-to-point connection
- Multiple patterns and approaches

**Correct Location**: `/architecture/microservices/communication.md`

## Quick Decision Tree

```
Is this a connection between two specific systems?
├── NO → Not an integration
│   ├── Abstract concept? → /patterns/
│   ├── Technology docs? → /technical/
│   ├── System design? → /architecture/
│   └── Code implementation? → /src/
│
└── YES → This is an integration!
    ├── Obsidian-related? → /integrations/obsidian/
    ├── MCP-related? → /integrations/mcp/
    ├── Message broker? → /integrations/messaging/
    ├── AI service? → /integrations/ai/
    ├── Git/VCS? → /integrations/version-control/
    └── Workflow automation? → /integrations/workflow-automation/
```

## Integration Lifecycle

### 1. Planning Phase

- Identify systems to integrate
- Define data flow and transformation
- Choose integration type
- Plan error handling

### 2. Implementation Phase

- Configure connections
- Implement authentication
- Build transformation logic
- Add error handling

### 3. Testing Phase

- Unit tests for components
- Integration tests for end-to-end flow
- Load testing for performance
- Error scenario testing

### 4. Deployment Phase

- Configure production environment
- Set up monitoring and alerts
- Deploy integration service
- Validate functionality

### 5. Maintenance Phase

- Monitor performance metrics
- Update credentials and certificates
- Handle version upgrades
- Optimize based on usage

## Best Practices

### 1. Design for Failure

- Implement retry logic with exponential backoff
- Use circuit breakers for failing services
- Queue requests when downstream unavailable
- Log errors with context for debugging

### 2. Secure Connections

- Use encrypted transport (TLS/SSL)
- Rotate credentials regularly
- Implement least privilege access
- Validate and sanitize all inputs

### 3. Monitor Everything

- Track request rates and latency
- Set up alerts for anomalies
- Log all integration events
- Measure error rates

### 4. Version Carefully

- Use semantic versioning
- Maintain backward compatibility
- Document breaking changes
- Plan migration paths

### 5. Document Thoroughly

- Clear architecture diagrams
- Data format specifications
- Error handling procedures
- Troubleshooting guides

## Common Integration Patterns

### Request-Response

```
[Client] --request--> [Server]
         <-response--
```

**Use Cases**: API calls, database queries, synchronous operations

### Publish-Subscribe

```
[Publisher] --event--> [Broker] --event--> [Subscriber 1]
                                --event--> [Subscriber 2]
```

**Use Cases**: Event notifications, real-time updates, fan-out

### Message Queue

```
[Producer] --message--> [Queue] --message--> [Consumer]
```

**Use Cases**: Asynchronous processing, load leveling, decoupling

### Stream Processing

```
[Source] --stream--> [Processor] --stream--> [Sink]
```

**Use Cases**: Real-time analytics, data transformation, ETL

## Integration Anti-Patterns

### ❌ Tight Coupling

**Problem**: Direct dependencies between systems
**Solution**: Use interfaces and abstractions

### ❌ Shared Database

**Problem**: Multiple systems accessing same database
**Solution**: Use APIs and message queues

### ❌ Synchronous Cascading

**Problem**: Chain of synchronous calls
**Solution**: Use asynchronous messaging

### ❌ No Error Handling

**Problem**: Failures cascade through system
**Solution**: Implement circuit breakers and fallbacks

## Related Vault Concepts

### Integration vs Other Vault Directories

| Directory | Focus | Example |
|-----------|-------|---------|
| `/integrations/` | **Concrete connections** | Obsidian ↔ MCP |
| `/patterns/` | **Abstract designs** | Observer pattern |
| `/architecture/` | **System structure** | Microservices |
| `/technical/` | **Technologies** | RabbitMQ docs |
| `/src/` | **Implementation** | Integration code |

## Summary

**Integrations** are the **concrete bridges** that connect your systems together. They define the **specific mechanics** of how data flows between named systems, including:

- Connection protocols and endpoints
- Authentication and authorization
- Data transformation and validation
- Error handling and recovery
- Monitoring and observability

When documenting integrations:
1. Be specific about systems involved
2. Document concrete implementation details
3. Include configuration and setup
4. Plan for failure scenarios
5. Monitor and maintain actively

Remember: **If you can draw a line between two named systems, it's probably an integration.**
