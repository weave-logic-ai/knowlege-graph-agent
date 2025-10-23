# Architectural Patterns Directory

**Purpose**: Catalog of reusable design patterns and architectural approaches used in Weave-NN.

---

## What IS an Architectural Pattern?

An **architectural pattern** is a **reusable solution to a commonly occurring problem in software architecture**. Patterns describe abstract design approaches that can be applied across different contexts, technologies, and implementations.

Think of patterns as "recipes" for solving architectural problems - they describe the ingredients (components), the relationships between them, and the trade-offs involved, but not the specific technologies you use.

### Core Characteristics

1. **Abstract & Reusable**: Describes a general solution, not a specific implementation
   - "Pub/Sub pattern" is abstract (can use RabbitMQ, Kafka, Redis, etc.)
   - "Our RabbitMQ setup" is NOT a pattern (it's our specific implementation)

2. **Problem-Solution Oriented**: Addresses a specific architectural challenge
   - Problem: Services need to communicate without tight coupling
   - Solution: Event-driven architecture with message broker

3. **Technology-Agnostic**: The pattern exists independently of implementation
   - Repository Pattern works with any ORM (SQLAlchemy, Prisma, TypeORM)
   - CQRS works with any database (PostgreSQL, MongoDB, Cassandra)

4. **Has Known Trade-offs**: Every pattern has pros, cons, and appropriate contexts
   - Microservices: Pros (scalability, isolation) vs Cons (complexity, latency)
   - Monolith: Pros (simplicity, performance) vs Cons (scaling limitations)

5. **Proven in Practice**: Patterns emerge from real-world experience
   - Named patterns (Gang of Four, Enterprise patterns, Cloud patterns)
   - Documented in books, papers, and industry practice

### Scope Boundaries

**Architectural patterns answer**: "How do we structure the solution to this design problem?"

**They do NOT answer**:
- "What technology do we use?" → That's `/technical/`
- "What are we building?" → That's `/features/`
- "What is our specific design?" → That's `/architecture/`
- "What did we decide?" → That's `/decisions/`

---

## Pattern vs Architecture vs Technical vs Protocol

This is the most important distinction to understand:

### Pattern (Abstract Solution)
**Location**: `/patterns/`
**Question**: "How do we solve this type of problem?"
**Examples**:
- Event-Driven Architecture (messaging pattern)
- Repository Pattern (data access pattern)
- CQRS (data management pattern)
- Circuit Breaker (resilience pattern)

**Characteristics**:
- Technology-agnostic
- Reusable across projects
- Has well-documented trade-offs
- Named and recognized in industry

### Architecture (Our Specific Design)
**Location**: `/architecture/`
**Question**: "How is OUR system designed?"
**Examples**:
- Our MCP Server architecture
- Our File Watcher implementation
- Our Event Processing Pipeline
- Our Vault Synchronization design

**Characteristics**:
- Specific to Weave-NN
- References multiple patterns
- Combines technologies and patterns
- Documents our unique design decisions

### Technical (Technology Choice)
**Location**: `/technical/`
**Question**: "What technology/tool/framework are we using?"
**Examples**:
- RabbitMQ (message broker)
- FastAPI (web framework)
- PostgreSQL (database)
- Docker (containerization)

**Characteristics**:
- Specific technology/product/tool
- Implements patterns
- Has configuration details
- Externally maintained

### Protocol (Communication Specification)
**Location**: `/protocols/`
**Question**: "How do components communicate?"
**Examples**:
- MCP Protocol specification
- Our event message schemas
- API contract definitions
- Inter-service communication formats

**Characteristics**:
- Defines message formats
- Specifies communication rules
- Language/technology-agnostic
- Enforces contracts between systems

### The Relationship

```
┌─────────────────────────────────────────────────────────────┐
│                     USER REQUIREMENTS                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  /features/  - What we're building (features, capabilities) │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  /patterns/  - HOW to solve design problems (abstract)      │
│  • Event-Driven Architecture                                │
│  • Repository Pattern                                       │
│  • CQRS                                                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  /architecture/  - OUR specific system design               │
│  • MCP Server (uses FastAPI + Pub/Sub pattern)             │
│  • File Watcher (uses Repository + Event-Driven)           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  /technical/  - Technologies that implement architecture    │
│  • RabbitMQ (implements Pub/Sub)                           │
│  • FastAPI (implements web service)                        │
│  • PostgreSQL (implements Repository)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  /protocols/  - Communication contracts between components  │
│  • MCP Protocol                                             │
│  • Event message schemas                                    │
│  • API contracts                                            │
└─────────────────────────────────────────────────────────────┘
```

### Concrete Example: File Change Notifications

**Feature** (`/features/auto-tagging.md`):
→ "Automatically tag notes when files are created or modified"

**Pattern** (`/patterns/architectural/event-driven.md`):
→ "Event-Driven Architecture: Components communicate via asynchronous events"

**Architecture** (`/architecture/file-watcher.md`):
→ "Our File Watcher publishes events to RabbitMQ, Event Consumer processes them"

**Technical** (`/technical/RabbitMQ.md`):
→ "RabbitMQ message broker with AMQP protocol"

**Protocol** (`/protocols/file-events.md`):
→ "Event schema: `{type: 'file.created', path: '...', timestamp: ...}`"

**Decision** (`/decisions/technical/event-driven-architecture.md`):
→ "We chose event-driven over polling because..."

---

## Categories of Architectural Patterns

Based on Weave-NN's architecture, we organize patterns into 5 categories:

### 1. Architectural Patterns
**Location**: `/patterns/architectural/`

**Definition**: High-level system organization and component relationships.

**Examples**:
- **Event-Driven Architecture**: Asynchronous communication via events
- **Microservices**: Distributed services with independent deployment
- **Layered Architecture**: Separation of concerns in vertical slices
- **Hexagonal Architecture (Ports & Adapters)**: Core logic isolated from external concerns
- **CQRS (Command Query Responsibility Segregation)**: Separate read/write models

**Scope**: System-wide architectural approaches that affect multiple components.

**When to document**: When adopting a major architectural style that shapes the entire system.

---

### 2. Messaging Patterns
**Location**: `/patterns/messaging/`

**Definition**: Patterns for asynchronous communication between components.

**Examples**:
- **Publish-Subscribe (Pub/Sub)**: One publisher, many subscribers
- **Message Queue**: Point-to-point asynchronous communication
- **Request-Reply**: Synchronous-style messaging over async channels
- **Event Sourcing**: Store state changes as sequence of events
- **Dead Letter Queue**: Handle failed message processing
- **Message Filtering**: Selective message consumption
- **Message Transformation**: Converting message formats
- **Guaranteed Delivery**: Ensuring messages aren't lost

**Scope**: Communication between services, components, or processes.

**When to document**: When implementing message-based communication (RabbitMQ, Kafka, Redis).

---

### 3. Data Patterns
**Location**: `/patterns/data/`

**Definition**: Patterns for data access, storage, and management.

**Examples**:
- **Repository Pattern**: Abstraction over data access
- **Unit of Work**: Transactional consistency across operations
- **Data Mapper**: Separate domain objects from database schema
- **Active Record**: Domain objects tied to database rows
- **Shadow Cache**: Local cache with background synchronization
- **Database per Service**: Each microservice owns its data
- **Shared Database**: Multiple services access same database (anti-pattern in microservices)
- **Event Sourcing**: Store all state changes as events
- **CQRS**: Separate read/write data models

**Scope**: How data is accessed, stored, cached, and synchronized.

**When to document**: When implementing data access layers, caching, or persistence strategies.

---

### 4. Integration Patterns
**Location**: `/patterns/integration/`

**Definition**: Patterns for connecting systems, services, and external APIs.

**Examples**:
- **API Gateway**: Single entry point for multiple services
- **Backend for Frontend (BFF)**: Custom API per client type
- **Service Mesh**: Infrastructure layer for service-to-service communication
- **Circuit Breaker**: Prevent cascading failures
- **Retry Pattern**: Handle transient failures
- **Bulkhead**: Isolate resources to prevent total failure
- **Adapter Pattern**: Convert one interface to another
- **Facade Pattern**: Simplify complex subsystem interfaces
- **Webhook**: HTTP callbacks for event notifications
- **Polling**: Periodic checking for updates

**Scope**: How systems integrate with each other and handle failures.

**When to document**: When connecting Weave-NN to external systems (Obsidian, GitHub, Claude).

---

### 5. Design Patterns
**Location**: `/patterns/design/`

**Definition**: Low-level code organization patterns (Gang of Four style).

**Examples**:
- **Factory Pattern**: Object creation without specifying exact class
- **Builder Pattern**: Construct complex objects step-by-step
- **Singleton Pattern**: Single instance of a class
- **Observer Pattern**: Subscribe to state changes
- **Strategy Pattern**: Select algorithm at runtime
- **Decorator Pattern**: Add behavior without modifying class
- **Dependency Injection**: Provide dependencies from outside
- **Template Method**: Define algorithm skeleton, subclasses fill details

**Scope**: Code-level design within a single service/component.

**When to document**: When implementing complex object creation, behavior selection, or extensibility.

---

## When to CREATE an Architectural Pattern

### Decision Criteria

**CREATE a pattern node when**:

1. **Named & Recognized**: The pattern has an established name in industry
   - Event-Driven Architecture ✅
   - Pub/Sub ✅
   - Repository Pattern ✅
   - "Our custom file handling approach" ❌ (document in `/architecture/` instead)

2. **Reusable Across Projects**: The pattern applies beyond Weave-NN
   - Circuit Breaker (applies to any distributed system) ✅
   - "Weave-NN shadow cache implementation" ❌ (that's `/architecture/`)

3. **Has Trade-offs**: Well-documented pros, cons, and when to use/avoid
   - Microservices (complexity vs scalability) ✅
   - CQRS (consistency vs performance) ✅
   - "Just use RabbitMQ" ❌ (no trade-off analysis = not a pattern)

4. **Solves a Common Problem**: Addresses a recurring architectural challenge
   - How to decouple services → Event-Driven Architecture ✅
   - How to handle failures → Circuit Breaker ✅
   - How to structure our MCP server ❌ (unique to our system)

5. **Technology-Agnostic**: Can be implemented with multiple technologies
   - Repository Pattern (works with SQLAlchemy, Prisma, TypeORM) ✅
   - Pub/Sub (works with RabbitMQ, Kafka, Redis, SNS/SQS) ✅
   - "How to configure RabbitMQ" ❌ (technology-specific = `/technical/`)

6. **Multiple Use Cases in Weave-NN**: We use it in 2+ places
   - Event-Driven Architecture (file events, MCP sync, agent tasks) ✅
   - Repository Pattern (vault access, shadow cache, future API) ✅
   - Factory Pattern (only used once) ⚠️ (document if planning more uses)

### Minimum Documentation Requirements

Every pattern node MUST have:

1. **Frontmatter**: Structured metadata (see template below)
2. **Problem Statement**: What challenge does this pattern solve?
3. **Solution Overview**: How does the pattern solve it?
4. **Structure Diagram**: Visual representation (components, relationships)
5. **Participants**: Key components/roles in the pattern
6. **Collaborations**: How participants interact
7. **Consequences**: Pros, cons, trade-offs
8. **When to Use**: Appropriate contexts
9. **When NOT to Use**: Anti-patterns, inappropriate contexts
10. **Implementation Considerations**: Key design decisions
11. **Example Implementations**: Technology choices that realize the pattern
12. **Weave-NN Usage**: How we apply this pattern specifically
13. **Related Patterns**: Patterns that work together or are alternatives
14. **Learning Resources**: Books, articles, tutorials

---

## When NOT to Create a Pattern

### What Belongs Elsewhere

**❌ TECHNOLOGY-SPECIFIC DETAILS** → Use `/technical/` instead
- "How to configure RabbitMQ" is NOT a pattern
- "Pub/Sub pattern" IS a pattern
- RabbitMQ is ONE way to implement Pub/Sub

**❌ OUR SPECIFIC ARCHITECTURE** → Use `/architecture/` instead
- "Our MCP Server design" is NOT a pattern
- "Hexagonal Architecture" IS a pattern
- Our MCP Server uses Hexagonal Architecture pattern

**❌ FEATURES WE'RE BUILDING** → Use `/features/` instead
- "Auto-tagging feature" is NOT a pattern
- "Event-Driven Architecture" IS a pattern
- Auto-tagging uses Event-Driven Architecture

**❌ COMMUNICATION CONTRACTS** → Use `/protocols/` instead
- "Our event message schema" is NOT a pattern
- "Event Sourcing pattern" IS a pattern
- Our event schema implements Event Sourcing pattern

**❌ DECISIONS WE MADE** → Use `/decisions/` instead
- "Why we chose RabbitMQ over Kafka" is NOT a pattern
- "Pub/Sub pattern trade-offs" IS part of the pattern
- Decision references pattern, pattern doesn't reference decision

**❌ UNNAMED/CUSTOM APPROACHES** → Use `/architecture/` instead
- "Our special way of caching vault data" is NOT a recognized pattern
- "Shadow Cache pattern" IS a recognized pattern
- If we invented it uniquely, document in `/architecture/`, not `/patterns/`

### Examples of What NOT to Document

| What | Why Not | What to Document Instead |
|------|---------|-------------------------|
| "How to use FastAPI" | Technology usage, not pattern | `/technical/FastAPI.md` |
| "Our File Watcher implementation" | Specific architecture | `/architecture/file-watcher.md` |
| "Auto-tagging feature" | Feature, not pattern | `/features/auto-tagging.md` |
| "RabbitMQ message schema" | Protocol/contract | `/protocols/file-events.md` |
| "Why event-driven over polling" | Decision | `/decisions/technical/event-driven.md` |
| "Our custom agent workflow" | Unique to Weave-NN | `/architecture/agent-workflow.md` |
| "Python best practices" | Coding standards | Project coding guidelines |
| "How to deploy Docker" | Operations | DevOps documentation |

---

## Template Structure

Every architectural pattern follows this format:

```markdown
---
type: architectural-pattern
category: [architectural|messaging|data|integration|design]
status: [in-use|planned|evaluated|rejected]
also_known_as:
  - Alternative Name 1
  - Alternative Name 2
maturity: [emerging|proven|mature|declining]

# Pattern Classification (optional)
pattern_family: [Gang of Four|Enterprise|Cloud|Microservices|Messaging]
complexity: [low|medium|high]
layer: [infrastructure|application|domain|presentation]

# Weave-NN Context
first_used_phase: "PHASE-X"
mvp_required: true/false
used_in_architecture:
  - "[[../architecture/component-1]]"
  - "[[../architecture/component-2]]"

# Technology Implementations
implemented_by:
  - "[[../technical/technology-1]]"
  - "[[../technical/technology-2]]"

# Relationships
related_patterns:
  - "[[related-pattern-1]]"
  - "[[related-pattern-2]]"
alternatives:
  - "[[alternative-pattern]]"
complements:
  - "[[complementary-pattern]]"
conflicts_with:
  - "[[conflicting-pattern]]"

# References
decision: "[[../decisions/architectural/decision-id]]"
protocols: "[[../protocols/protocol-name]]"

tags:
  - pattern
  - [category]
  - [status]
---

# Pattern Name

**Category**: [Architectural/Messaging/Data/Integration/Design]
**Status**: [In Use (MVP) / Planned (v1.0) / Evaluated]
**First Used**: Phase X (Week Y)

**Also Known As**: [Alternative names]

---

## Problem Statement

**Context**: [When and where does this problem occur?]

**Problem**: [What architectural challenge needs solving?]

**Forces**: [Conflicting concerns that must be balanced]
- Force 1 (e.g., need loose coupling)
- Force 2 (e.g., need performance)
- Force 3 (e.g., need simplicity)

---

## Solution Overview

[High-level description of how the pattern solves the problem]

**Core Idea**: [One-sentence essence of the pattern]

**Key Principles**:
- Principle 1
- Principle 2
- Principle 3

---

## Structure

### Conceptual Diagram

```
[ASCII diagram or mermaid diagram showing pattern structure]

┌─────────────────┐
│   Component A   │
└────────┬────────┘
         │
         ↓
    ┌────────┐
    │ Broker │
    └────┬───┘
         │
    ┌────┴────┐
    ↓         ↓
┌──────┐   ┌──────┐
│ Sub1 │   │ Sub2 │
└──────┘   └──────┘
```

### Participants

**[Role 1]**: [Description of this component's role]
- Responsibility 1
- Responsibility 2

**[Role 2]**: [Description of this component's role]
- Responsibility 1
- Responsibility 2

**[Role 3]**: [Description of this component's role]
- Responsibility 1
- Responsibility 2

---

## Collaborations

[How participants interact to implement the pattern]

**Sequence of Operations**:
1. Step 1: [What happens first]
2. Step 2: [What happens next]
3. Step 3: [And so on]

**Communication Flow**:
```
Client → Request → Service A
Service A → Event → Message Broker
Message Broker → Notification → Service B
Service B → Process → Database
```

---

## Consequences

### Benefits (Pros)

✅ **[Benefit 1]**: [Explanation]
- Detail/example
- Impact on system

✅ **[Benefit 2]**: [Explanation]
- Detail/example
- Impact on system

✅ **[Benefit 3]**: [Explanation]
- Detail/example
- Impact on system

### Liabilities (Cons)

⚠️ **[Drawback 1]**: [Explanation]
- Mitigation strategy
- When this matters most

⚠️ **[Drawback 2]**: [Explanation]
- Mitigation strategy
- When this matters most

⚠️ **[Drawback 3]**: [Explanation]
- Mitigation strategy
- When this matters most

### Trade-offs

**[Trade-off 1]**: Gain X but lose Y
- When to accept this trade-off
- When to reject this trade-off

**[Trade-off 2]**: Gain X but lose Y
- When to accept this trade-off
- When to reject this trade-off

---

## When to Use This Pattern

**Appropriate Contexts**:

✅ When [condition 1]
- Example scenario
- Why this pattern helps

✅ When [condition 2]
- Example scenario
- Why this pattern helps

✅ When [condition 3]
- Example scenario
- Why this pattern helps

**Signs You Need This Pattern**:
- Sign 1: [Observable symptom in your system]
- Sign 2: [Observable symptom in your system]
- Sign 3: [Observable symptom in your system]

---

## When NOT to Use This Pattern

**Inappropriate Contexts**:

❌ When [condition 1]
- Why this pattern is wrong here
- What to use instead: [[alternative-pattern]]

❌ When [condition 2]
- Why this pattern is wrong here
- What to use instead: [[alternative-pattern]]

❌ When [condition 3]
- Why this pattern is wrong here
- What to use instead: [[alternative-pattern]]

**Anti-patterns / Misuse**:
1. **[Anti-pattern 1]**: [Description of common misuse]
   - Why this fails
   - Correct approach

2. **[Anti-pattern 2]**: [Description of common misuse]
   - Why this fails
   - Correct approach

---

## Implementation Considerations

### Key Design Decisions

**[Decision Point 1]**: [What needs to be decided]
- Option A: [Pros/Cons]
- Option B: [Pros/Cons]
- **Recommendation**: [Suggested approach]

**[Decision Point 2]**: [What needs to be decided]
- Option A: [Pros/Cons]
- Option B: [Pros/Cons]
- **Recommendation**: [Suggested approach]

### Common Variations

**[Variation 1]**: [Description]
- When to use this variation
- How it differs from base pattern

**[Variation 2]**: [Description]
- When to use this variation
- How it differs from base pattern

### Pitfalls to Avoid

1. **[Pitfall 1]**: [Common mistake]
   - How to detect it
   - How to avoid it

2. **[Pitfall 2]**: [Common mistake]
   - How to detect it
   - How to avoid it

---

## Technology Implementations

[How different technologies realize this pattern]

### With [[../technical/Technology-1]]

**How it implements the pattern**:
- Implementation detail 1
- Implementation detail 2

**Example Configuration**:
```yaml
# Configuration example
service:
  type: pattern-implementation
  config: value
```

**Pros/Cons of this implementation**:
- ✅ Advantage specific to this technology
- ⚠️ Limitation specific to this technology

---

### With [[../technical/Technology-2]]

**How it implements the pattern**:
- Implementation detail 1
- Implementation detail 2

**Example Configuration**:
```yaml
# Configuration example
service:
  type: pattern-implementation
  config: value
```

**Pros/Cons of this implementation**:
- ✅ Advantage specific to this technology
- ⚠️ Limitation specific to this technology

---

## Weave-NN Usage

[How we specifically apply this pattern in our architecture]

### Where We Use It

**[[../architecture/Component-1]]**:
- Specific application of pattern
- Why we chose this pattern here
- Any deviations from standard pattern

**[[../architecture/Component-2]]**:
- Specific application of pattern
- Why we chose this pattern here
- Any deviations from standard pattern

### Implementation Details

**Technologies Used**:
- [[../technical/Technology-1]] - [Role in pattern]
- [[../technical/Technology-2]] - [Role in pattern]

**Customizations**:
- [Modification 1]: Why we adapted the standard pattern
- [Modification 2]: Why we adapted the standard pattern

**Configuration**:
```yaml
# Our specific implementation
weave-nn:
  pattern: pattern-name
  components:
    - component1
    - component2
```

### Decision History

**Why We Chose This Pattern**: [[../decisions/architectural/decision-id]]

**Key Reasoning**:
> [Quote from decision explaining why this pattern was selected]

**Alternatives Considered**: [[alternative-pattern-1]], [[alternative-pattern-2]]

**Date Decided**: YYYY-MM-DD

---

## Related Patterns

### Complementary Patterns (Use Together)

**[[Complementary-Pattern-1]]**:
- How they work together
- Example of combined usage in Weave-NN

**[[Complementary-Pattern-2]]**:
- How they work together
- Example of combined usage in Weave-NN

### Alternative Patterns (Use Instead)

**[[Alternative-Pattern-1]]**:
- When to prefer this over current pattern
- Trade-offs comparison

**[[Alternative-Pattern-2]]**:
- When to prefer this over current pattern
- Trade-offs comparison

### Similar Patterns (Easy to Confuse)

**[[Similar-Pattern]]**:
- Key differences
- When to use which

### Conflicting Patterns (Don't Use Together)

**[[Conflicting-Pattern]]**:
- Why they conflict
- How to choose between them

---

## Evolution Path

### Precursors (What Came Before)

**[Earlier Pattern]**: [How this pattern evolved from earlier approaches]

### Successors (What Might Replace It)

**[Newer Pattern]**: [How newer patterns improve on this one]

### Lifecycle Stage

**Maturity**: [Emerging/Proven/Mature/Declining]

**Industry Adoption**: [Description of how widely used]

**Future Outlook**: [Will this pattern remain relevant?]

---

## Learning Resources

### Books

- **[Book Title]** by [Author]
  - Chapter/Section: [Specific reference]
  - Key insights: [What to learn]
  - URL: [Link if available]

- **[Book Title]** by [Author]
  - Chapter/Section: [Specific reference]
  - Key insights: [What to learn]
  - URL: [Link if available]

### Articles & Papers

- **[Article Title]**
  - Author: [Name]
  - Publication: [Where published]
  - URL: [Link]
  - Summary: [Key takeaways]

- **[Article Title]**
  - Author: [Name]
  - Publication: [Where published]
  - URL: [Link]
  - Summary: [Key takeaways]

### Online Resources

- **Official Documentation**: [Link]
- **Tutorial**: [Link] - [Description]
- **Video**: [Link] - [Description]
- **Case Study**: [Link] - [Company/Project that used it]

### Community

- **Discussions**: [Forum/Reddit/Discord]
- **Examples**: [GitHub repos showing pattern]
- **Q&A**: [Stack Overflow tag]

---

## Real-World Examples

### Industry Usage

**[Company/Project 1]**:
- How they use the pattern
- Scale/context
- Public documentation: [Link]

**[Company/Project 2]**:
- How they use the pattern
- Scale/context
- Public documentation: [Link]

### Open Source Examples

- **[Project Name]**: [GitHub link]
  - How pattern is implemented
  - Lines of code to review

- **[Project Name]**: [GitHub link]
  - How pattern is implemented
  - Lines of code to review

---

## Pattern History

**Origin**: [Where/when pattern was first identified]

**Evolution**: [How the pattern has evolved over time]

**Formalization**: [Who documented it, in what publication]

**Related Work**: [Other researchers/practitioners who contributed]

---

## Metrics & Validation

### Success Indicators

[How to measure if pattern is working]

**Qualitative Metrics**:
- Metric 1: [How to assess]
- Metric 2: [How to assess]

**Quantitative Metrics**:
- Metric 1: [How to measure]
- Metric 2: [How to measure]

### Health Checks

[How to detect if pattern is being misused or degrading]

**Warning Signs**:
- Sign 1: [What to look for]
- Sign 2: [What to look for]

**Corrective Actions**:
- If [condition], then [action]
- If [condition], then [action]

---

## Related Documentation

**Architecture**:
- [[../architecture/component]] - Uses this pattern

**Technical**:
- [[../technical/technology]] - Implements this pattern

**Decisions**:
- [[../decisions/architectural/decision]] - Why we chose this pattern

**Protocols**:
- [[../protocols/protocol]] - Communication format for this pattern

**Features**:
- [[../features/feature]] - Enabled by this pattern

---

## Revisit Criteria

**Reconsider this pattern if**:
- [Condition 1] (e.g., complexity exceeds value delivered)
- [Condition 2] (e.g., better pattern emerges)
- [Condition 3] (e.g., requirements change significantly)

**Scheduled Review**: [Date] (e.g., 6 months after v1.0 launch)

**Review Checklist**:
- [ ] Pattern still solves the problem effectively
- [ ] No better alternatives have emerged
- [ ] Trade-offs remain acceptable
- [ ] Implementation matches pattern intent
- [ ] Documentation remains accurate

---

**Back to**: [[README|Patterns Index]]
```

---

## Good Examples vs Bad Examples

### ✅ GOOD: Event-Driven Architecture

**File**: `/patterns/architectural/event-driven.md`

```markdown
---
type: architectural-pattern
category: architectural
status: in-use
first_used_phase: "PHASE-5"
mvp_required: true
---

# Event-Driven Architecture

**Category**: Architectural Pattern
**Status**: In Use (MVP)

## Problem Statement

**Context**: Distributed systems with multiple components that need to communicate.

**Problem**: Services become tightly coupled when they call each other directly. Changes in one service break others.

**Forces**:
- Need loose coupling between services
- Need asynchronous processing
- Need to handle events from multiple sources
- Need system to remain responsive

## Solution Overview

Components communicate by publishing events to a message broker. Consumers subscribe to events they care about. Publishers and consumers are decoupled.

**Core Idea**: "Don't call me, I'll call you" - services react to events instead of directly invoking each other.

## Weave-NN Usage

**Where We Use It**:
- [[../architecture/file-watcher]] publishes file change events
- [[../architecture/event-consumer]] processes events asynchronously
- [[../architecture/mcp-server]] publishes user action events

**Technologies Used**:
- [[../technical/RabbitMQ]] - Message broker
- [[../technical/AMQP]] - Messaging protocol

**Why We Chose This Pattern**: [[../decisions/architectural/event-driven-architecture]]

## Related Patterns

**Complementary**:
- [[../patterns/messaging/pub-sub]] - Specific messaging pattern
- [[../patterns/data/event-sourcing]] - Store events as source of truth

**Alternatives**:
- [[../patterns/architectural/request-response]] - For synchronous communication
- [[../patterns/integration/polling]] - For simpler systems
```

**Why this is good**:
- Clear problem statement with forces
- Solution is technology-agnostic
- Shows how WE use it (architecture references)
- Lists technologies that implement it
- Links to related patterns and decisions
- Explains trade-offs (coupling vs complexity)

---

### ✅ GOOD: Repository Pattern

**File**: `/patterns/data/repository.md`

```markdown
---
type: architectural-pattern
category: data
status: in-use
first_used_phase: "PHASE-5"
---

# Repository Pattern

**Category**: Data Access Pattern
**Status**: In Use (MVP)

## Problem Statement

**Context**: Application needs to access data from various sources (database, file system, APIs).

**Problem**: Direct data access couples business logic to storage implementation. Changing storage requires rewriting business code.

**Forces**:
- Need to abstract storage implementation
- Need testability (mock data access)
- Need consistent data access interface
- Need to support multiple storage backends

## Solution Overview

Create a Repository interface that provides collection-like access to domain objects. Repository handles mapping between domain layer and data layer.

**Core Idea**: "Treat data access like an in-memory collection" - domain logic doesn't know about databases.

## Participants

**IRepository**: Interface defining collection operations (get, add, remove, find)
**ConcreteRepository**: Implementation for specific storage (PostgreSQLRepository, FileSystemRepository)
**Domain Objects**: Entities being stored/retrieved
**Client**: Business logic that uses repository

## Weave-NN Usage

**[[../architecture/shadow-cache]]**:
- `VaultRepository` abstracts Obsidian file system access
- Supports both file-based and future database storage
- Enables testing with in-memory mock repository

**Technologies**:
- [[../technical/Watchdog]] - Monitors file system changes
- (Future) [[../technical/SQLAlchemy]] - ORM for PostgreSQL

## Related Patterns

**Often Used With**:
- [[../patterns/data/unit-of-work]] - Manage transactions across multiple repositories
- [[../patterns/design/factory]] - Create repository instances

**Alternatives**:
- [[../patterns/data/active-record]] - Domain objects tied to database
- [[../patterns/data/data-mapper]] - More complex separation of concerns
```

**Why this is good**:
- Technology-agnostic (can use files, PostgreSQL, MongoDB, etc.)
- Shows participants and their roles
- Documents Weave-NN-specific usage with architecture links
- Lists technology implementations
- Relates to complementary patterns
- Explains when to use alternatives

---

### ❌ BAD: "RabbitMQ Event Pattern.md" in /patterns/

**Why this is bad**:
- Ties pattern to specific technology (RabbitMQ)
- Should be "Pub/Sub Pattern" (technology-agnostic)
- RabbitMQ is the IMPLEMENTATION, not the pattern

**What to do instead**:
- Create `/patterns/messaging/pub-sub.md` (technology-agnostic pattern)
- Create `/technical/RabbitMQ.md` (specific technology)
- Reference RabbitMQ as ONE way to implement Pub/Sub

---

### ❌ BAD: "Our File Watcher Design.md" in /patterns/

**Why this is bad**:
- Describes OUR specific implementation, not a reusable pattern
- Not technology-agnostic (specific to Weave-NN)
- This is architecture, not a pattern

**What to do instead**:
- Create `/architecture/file-watcher.md` (our specific design)
- Reference `/patterns/architectural/event-driven.md` (pattern we use)
- Reference `/patterns/design/observer.md` (pattern we use)
- Reference `/technical/Watchdog.md` (technology we use)

---

### ❌ BAD: "Auto-Tagging Pattern.md" in /patterns/

**Why this is bad**:
- Auto-tagging is a FEATURE, not a pattern
- Not a reusable solution to a common problem
- Specific to Weave-NN functionality

**What to do instead**:
- Create `/features/auto-tagging.md` (what we're building)
- Reference `/patterns/architectural/event-driven.md` (how we build it)
- Reference `/patterns/data/repository.md` (how we access vault)
- Reference `/architecture/rule-engine.md` (our specific implementation)

---

### ❌ BAD: "How to Configure CQRS.md" in /patterns/

**Why this is bad**:
- Focuses on configuration/implementation, not the pattern itself
- Too specific, not abstract enough
- This is operations documentation

**What to do instead**:
- Create `/patterns/data/cqrs.md` (abstract pattern)
  - Problem, solution, trade-offs
  - Technology-agnostic description
  - When to use, when not to use
- Create `/architecture/cqrs-implementation.md` (our specific design)
- Create `/technical/[Technology].md` for each tool used
- Put configuration in service documentation

---

## Integration with Other Architypes

### The Documentation Hierarchy

```
User Need → Feature → Pattern → Architecture → Technical → Protocol

Example Flow:
1. "I need auto-tagging" → /features/auto-tagging.md
2. "Use event-driven pattern" → /patterns/architectural/event-driven.md
3. "Our implementation" → /architecture/rule-engine.md
4. "Using RabbitMQ" → /technical/RabbitMQ.md
5. "Event schema" → /protocols/file-events.md
6. "Why event-driven?" → /decisions/architectural/event-driven.md
```

### Linking Guidelines

**From `/patterns/` TO `/architecture/`**:
→ "Where We Use This Pattern" section
→ Link to each architectural component that implements the pattern

**From `/patterns/` TO `/technical/`**:
→ "Technology Implementations" section
→ Link to each technology that can implement the pattern

**From `/patterns/` TO `/protocols/`**:
→ "Communication Contracts" section
→ Link to message schemas, API contracts used with pattern

**From `/patterns/` TO `/decisions/`**:
→ "Decision History" section
→ Link to ADRs that chose this pattern

**From `/patterns/` TO `/features/`**:
→ "Enables Features" section
→ Link to features that depend on this pattern

### Example: Complete Cross-Reference

**Feature**: Auto-Tagging (`/features/auto-tagging.md`)
```markdown
Uses patterns:
- [[../patterns/architectural/event-driven]]
- [[../patterns/data/repository]]

Implemented by:
- [[../architecture/rule-engine]]
- [[../architecture/file-watcher]]
```

**Pattern**: Event-Driven Architecture (`/patterns/architectural/event-driven.md`)
```markdown
Used in architecture:
- [[../architecture/file-watcher]]
- [[../architecture/event-consumer]]

Implemented with:
- [[../technical/RabbitMQ]]
- [[../protocols/file-events]]

Enables features:
- [[../features/auto-tagging]]
- [[../features/auto-linking]]

Chosen because:
- [[../decisions/architectural/event-driven-architecture]]
```

**Architecture**: File Watcher (`/architecture/file-watcher.md`)
```markdown
Uses patterns:
- [[../patterns/architectural/event-driven]]
- [[../patterns/design/observer]]

Uses technologies:
- [[../technical/Watchdog]]
- [[../technical/RabbitMQ]]

Communicates via:
- [[../protocols/file-events]]

Enables features:
- [[../features/auto-tagging]]
```

**Technical**: RabbitMQ (`/technical/RabbitMQ.md`)
```markdown
Implements patterns:
- [[../patterns/messaging/pub-sub]]
- [[../patterns/architectural/event-driven]]

Used by architecture:
- [[../architecture/file-watcher]]
- [[../architecture/event-consumer]]
```

---

## Pattern Hierarchy

### Pattern Composition

Patterns often build on each other:

```
┌─────────────────────────────────────────────────┐
│         ARCHITECTURAL PATTERNS                  │
│  (System-wide organization)                     │
│  • Event-Driven Architecture                    │
│  • Microservices                                │
│  • Layered Architecture                         │
└────────────────┬────────────────────────────────┘
                 │ composed of
                 ↓
┌─────────────────────────────────────────────────┐
│         MESSAGING PATTERNS                      │
│  (Inter-component communication)                │
│  • Pub/Sub                                      │
│  • Message Queue                                │
│  • Event Sourcing                               │
└────────────────┬────────────────────────────────┘
                 │ uses
                 ↓
┌─────────────────────────────────────────────────┐
│         DATA PATTERNS                           │
│  (Data access and management)                   │
│  • Repository                                   │
│  • Unit of Work                                 │
│  • CQRS                                         │
└────────────────┬────────────────────────────────┘
                 │ implements
                 ↓
┌─────────────────────────────────────────────────┐
│         DESIGN PATTERNS                         │
│  (Code-level object design)                     │
│  • Observer                                     │
│  • Factory                                      │
│  • Strategy                                     │
└─────────────────────────────────────────────────┘
```

### Weave-NN Pattern Stack

Our architecture composes patterns at multiple levels:

```
Event-Driven Architecture (Architectural)
  ↓ uses
Pub/Sub Pattern (Messaging)
  ↓ uses
Observer Pattern (Design)
  ↓ implemented by
RabbitMQ (Technical)
  ↓ with schema
File Events Protocol (Protocol)
  ↓ enables
Auto-Tagging Feature (Feature)
```

### Pattern Relationships

**Complementary** (Use Together):
- Event-Driven Architecture + Repository Pattern
  - Events trigger domain operations, repository handles persistence
- CQRS + Event Sourcing
  - Event sourcing provides write model, CQRS provides optimized read model
- API Gateway + Circuit Breaker
  - Gateway routes requests, circuit breaker prevents cascading failures

**Alternative** (Choose One):
- Microservices vs Monolith
  - Both are architectural patterns, can't use both for same system
- Repository vs Active Record
  - Different approaches to data access, pick one per context
- Request-Response vs Event-Driven
  - Different communication styles, choose based on requirements

**Conflicting** (Don't Use Together):
- Shared Database + Microservices
  - Violates microservices principle of independent deployment
- Tight Coupling + Event-Driven
  - Event-driven aims to decouple, contradictory to tight coupling

---

## Maintenance Guidelines

### Adding New Patterns

**Trigger**: When you identify a reusable architectural approach that solves a common problem.

**Process**:
1. **Verify it's a pattern**:
   - Is it technology-agnostic?
   - Is it reusable across projects?
   - Does it have a recognized name?
   - Does it have documented trade-offs?

2. **Check if pattern already exists**:
   - Search existing `/patterns/` directory
   - Check pattern aliases ("also known as")
   - Ensure not duplicating under different name

3. **Create node from template**:
   - Use full template above
   - Fill out ALL sections
   - Include diagrams (ASCII or mermaid)
   - Document trade-offs thoroughly

4. **Link to related nodes**:
   - Architecture docs that use it
   - Technologies that implement it
   - Protocols it uses
   - Features it enables
   - Decisions that chose it
   - Related/alternative patterns

5. **Update indices**:
   - Add to this README's index
   - Update related pattern nodes
   - Update architecture nodes that use it

**Checklist**:
- [ ] Pattern is technology-agnostic
- [ ] Pattern has recognized industry name
- [ ] Problem statement is clear
- [ ] Solution overview is complete
- [ ] Structure diagram included
- [ ] Consequences (pros/cons) documented
- [ ] "When to use" section complete
- [ ] "When NOT to use" section complete
- [ ] Technology implementations listed
- [ ] Weave-NN usage documented
- [ ] Related patterns identified
- [ ] Learning resources added
- [ ] Linked to architecture docs
- [ ] Linked to technical docs
- [ ] Linked to decisions (if exist)

---

### Updating Patterns

**Trigger**: When pattern usage evolves or new insights emerge.

**Process**:
1. Update "Weave-NN Usage" section with new uses
2. Add new technology implementations
3. Update related patterns as relationships change
4. Revise trade-offs based on experience
5. Add new learning resources
6. Update status if moving from planned → in-use

**Don't**:
- Don't remove historical information
- Don't delete learning resources (mark as outdated instead)
- Don't change pattern name arbitrarily (use aliases for alternate names)

---

### Deprecating Patterns

**When**: Pattern is no longer used or has been superseded.

**Process**:
1. Update frontmatter: `status: deprecated`
2. Add `replaced_by: "[[new-pattern]]"` field
3. Add "Deprecation Notice" section at top:
   ```markdown
   > **⚠️ DEPRECATED**: Replaced by [[New-Pattern]] in [version/date]
   >
   > **Reason**: [Why pattern was replaced]
   > **Migration Path**: [How to transition to new pattern]
   > **Last Used**: [Component/date of last usage]
   ```
4. Update architecture docs to reference new pattern
5. Keep node for historical context (DON'T DELETE)

**Example**:
```markdown
---
status: deprecated
replaced_by: "[[Event-Driven-Architecture]]"
---

# Polling Pattern

> **⚠️ DEPRECATED**: Replaced by [[Event-Driven-Architecture]] in Phase 5
>
> **Reason**: Polling introduces latency and wastes CPU cycles. Event-driven provides real-time updates with lower overhead.
> **Migration Date**: 2025-10-15
> **Migration Guide**: [[../guides/polling-to-event-driven-migration]]

[Rest of document preserved for historical reference]
```

---

### Reviewing Patterns

**Frequency**: Every 6 months after v1.0 launch

**Checklist**:
- [ ] Status still accurate? (in-use, planned, deprecated)
- [ ] Weave-NN usage section current? (new uses documented)
- [ ] Technology implementations complete? (new techs added)
- [ ] Trade-offs still valid? (new pros/cons discovered)
- [ ] Related patterns accurate? (new relationships identified)
- [ ] Learning resources up-to-date? (broken links fixed)
- [ ] Industry maturity updated? (emerging → proven → mature)
- [ ] Alternatives section current? (new patterns emerged)

---

## Pattern Index

### By Category

#### Architectural Patterns (System-wide)
*Placeholder - Add patterns as they are created*
- Event-Driven Architecture
- Microservices
- Layered Architecture
- Hexagonal Architecture (Ports & Adapters)

#### Messaging Patterns (Communication)
*Placeholder - Add patterns as they are created*
- Publish-Subscribe (Pub/Sub)
- Message Queue
- Event Sourcing
- Request-Reply

#### Data Patterns (Data Management)
*Placeholder - Add patterns as they are created*
- Repository Pattern
- Unit of Work
- CQRS
- Shadow Cache
- Event Sourcing

#### Integration Patterns (System Integration)
*Placeholder - Add patterns as they are created*
- API Gateway
- Circuit Breaker
- Retry Pattern
- Adapter Pattern
- Webhook

#### Design Patterns (Code-level)
*Placeholder - Add patterns as they are created*
- Observer Pattern
- Factory Pattern
- Strategy Pattern
- Dependency Injection
- Singleton Pattern

---

### By Status

#### In Use (MVP - Phase 5-6)
*Placeholder - Add patterns as they are created*
- Event-Driven Architecture
- Repository Pattern
- Observer Pattern

#### Planned (v1.0 - Phase 7+)
*Placeholder - Add patterns as they are created*
- CQRS
- Event Sourcing
- Circuit Breaker

#### Evaluated but Rejected
*Placeholder - Document rejected patterns for future reference*
- (Document patterns considered but not adopted)

---

### By Maturity

#### Mature (Industry Standard)
- Repository Pattern
- Observer Pattern
- Factory Pattern
- Layered Architecture

#### Proven (Widely Adopted)
- Event-Driven Architecture
- Microservices
- CQRS
- API Gateway

#### Emerging (Gaining Adoption)
- Event Sourcing with CQRS
- Shadow Cache
- (Industry is still defining best practices)

---

### By Complexity

#### Low (Easy to Implement)
- Repository Pattern
- Observer Pattern
- Factory Pattern
- Singleton Pattern

#### Medium (Moderate Complexity)
- Event-Driven Architecture
- Layered Architecture
- Strategy Pattern
- Adapter Pattern

#### High (Complex to Implement)
- Microservices
- CQRS + Event Sourcing
- Distributed Sagas
- Service Mesh

---

### Pattern Families

#### Gang of Four (Classic OOP Patterns)
- Observer, Factory, Strategy, Singleton, Adapter, Decorator

#### Enterprise Application Patterns (Martin Fowler)
- Repository, Unit of Work, Data Mapper, Active Record, Service Layer

#### Cloud Patterns (Microsoft/AWS/Google)
- Circuit Breaker, Retry, Bulkhead, API Gateway, Event Sourcing

#### Microservices Patterns (Richardson)
- Database per Service, API Gateway, Service Mesh, Saga Pattern

#### Messaging Patterns (Hohpe & Woolf)
- Pub/Sub, Message Queue, Request-Reply, Message Filter, Dead Letter Queue

---

## Related Documentation

**Architecture**:
- [[../architecture/README]] - Our specific system design
- [[../architecture/mvp-local-first-architecture]] - How patterns compose into MVP

**Technical**:
- [[../technical/README]] - Technologies that implement patterns

**Features**:
- [[../features/README]] - Features enabled by patterns

**Protocols**:
- [[../protocols/README]] - Communication contracts for patterns

**Decisions**:
- [[../decisions/INDEX]] - Why we chose these patterns
- [[../decisions/architectural/]] - Architectural pattern decisions

---

## Questions?

**"Should I create a pattern node for [X]?"**
→ Ask:
  1. Is it technology-agnostic? (Not tied to specific tool)
  2. Does it have a recognized industry name? (Not something we invented)
  3. Does it solve a common architectural problem? (Not unique to Weave-NN)
  4. Does it have documented trade-offs? (Known pros/cons)

**"Is this a pattern or our architecture?"**
→ Patterns are ABSTRACT (can be used in any project). Our architecture is SPECIFIC (unique to Weave-NN).
→ Example: "Event-Driven Architecture" is a pattern. "Our File Watcher + RabbitMQ + Event Consumer" is our architecture.

**"Is this a pattern or a technology?"**
→ Patterns are HOW to solve problems. Technologies are WHAT to use.
→ Example: "Repository Pattern" (how to abstract data access) vs "SQLAlchemy" (ORM technology).

**"Should I document a pattern we're NOT using?"**
→ YES, if you evaluated it as an alternative and rejected it.
→ Document why you chose pattern A over pattern B in `/decisions/`.
→ Keep brief node in `/patterns/` with `status: evaluated-rejected` for future reference.

**"Can a pattern be in multiple categories?"**
→ YES. Event Sourcing is both a Data Pattern and a Messaging Pattern.
→ Choose PRIMARY category, mention secondary in frontmatter:
   ```yaml
   category: data
   also_in_categories:
     - messaging
   ```

**"How detailed should pattern documentation be?"**
→ More detailed than you think. Patterns are TEACHING tools.
→ Junior developers should understand:
  - What problem it solves
  - How it works
  - When to use it
  - When NOT to use it
  - How to implement it in Weave-NN

---

## Learning Path

### For New Developers

**Start Here**:
1. Read this README completely
2. Read `/patterns/architectural/event-driven.md` (our core pattern)
3. Read `/patterns/data/repository.md` (fundamental data pattern)
4. Read `/patterns/messaging/pub-sub.md` (how components communicate)

**Then Explore**:
- Browse `/architecture/` to see how patterns are used in Weave-NN
- Read `/decisions/architectural/` to understand why we chose these patterns
- Check `/technical/` to see technologies that implement patterns

**Key Resources**:
- **Patterns of Enterprise Application Architecture** by Martin Fowler
- **Enterprise Integration Patterns** by Hohpe & Woolf
- **Microservices Patterns** by Chris Richardson
- **Design Patterns: Elements of Reusable OO Software** by Gang of Four

---

**Last Updated**: 2025-10-23
**Maintainer**: System Architecture Designer
**Review Schedule**: Every 6 months post-v1.0
**Pattern Count**: (Update as patterns are added)
