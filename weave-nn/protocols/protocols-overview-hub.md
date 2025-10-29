---
title: Protocol Documentation
type: hub
status: in-progress
tags:
  - type/hub
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F310"
  color: '#4A90E2'
  cssclasses:
    - hub-document
updated: '2025-10-29T04:55:03.738Z'
keywords:
  - what is a protocol?
  - protocol vs other concepts
  - core characteristics of protocols
  - 1. **defines wire format**
  - 2. **manages state transitions**
  - 3. **handles errors formally**
  - 4. **osi layer 4-7 operation**
  - 5. **multi-vendor specification**
  - scope boundaries
  - ✅ document as protocol
---
# Protocol Documentation

## What IS a Protocol?

A **protocol** is a **formal specification of rules and conventions** that govern how systems communicate and exchange information. Think of it as a "communication language" that defines:

- **Message formats**: Structure and syntax of data exchanged
- **Message sequencing**: Order and timing of message exchanges
- **Error handling**: How to detect and recover from failures
- **State management**: Connection lifecycle and state transitions
- **Negotiation rules**: How endpoints agree on capabilities

**Key Insight**: Protocols are about **HOW systems talk to each other**, not what they say or what they are built with.

### Protocol vs Other Concepts

| Concept | Definition | Example | Directory |
|---------|-----------|---------|-----------|
| **Protocol** | Communication rules and message formats | HTTP, AMQP, WebSocket | `/protocols/` |
| **Standard** | Data format or architectural style | REST, JSON-RPC, GraphQL | `/standards/` |
| **Technical Primitive** | Implementation or technology | RabbitMQ, Express.js, Redis | `/technical/` |
| **Pattern** | Design approach or methodology | Pub/Sub, Request-Reply, CQRS | `/patterns/` |

**Critical Distinction**:
- HTTP is a **protocol** (defines request/response message format)
- REST is a **standard** (architectural style using HTTP)
- Express.js is a **technical primitive** (HTTP protocol implementation)

## Core Characteristics of Protocols

A documented item belongs in `/protocols/` if it exhibits these characteristics:

### 1. **Defines Wire Format**
- Specifies exact byte layout or message structure
- Defines headers, delimiters, encoding rules
- Example: HTTP defines `GET /path HTTP/1.1\r\n`

### 2. **Manages State Transitions**
- Defines connection lifecycle (open, active, close)
- Specifies handshake procedures
- Example: WebSocket upgrade handshake

### 3. **Handles Errors Formally**
- Defines error codes and meanings
- Specifies retry/recovery procedures
- Example: AMQP error codes (320, 404, 406)

### 4. **OSI Layer 4-7 Operation**
- Operates at Transport, Session, Presentation, or Application layer
- Built on top of TCP/IP or UDP
- Example: AMQP runs on TCP (Layer 4+)

### 5. **Multi-Vendor Specification**
- Standardized (IETF, W3C, OASIS) or widely adopted
- Multiple independent implementations exist
- Example: HTTP has Apache, nginx, Node.js implementations

## Scope Boundaries

### ✅ Document as Protocol

**Communication specifications with formal rules:**
- HTTP/1.1, HTTP/2, HTTP/3 (request-response protocol)
- WebSocket (full-duplex protocol over TCP)
- AMQP 0-9-1 (message queue protocol)
- MQTT (IoT messaging protocol)
- MCP (Model Context Protocol for AI agents)
- gRPC protocol layer (RPC over HTTP/2)
- SSE (Server-Sent Events protocol)

### ❌ Don't Document as Protocol

**Architectural styles → `/standards/`:**
- REST (architectural constraints, uses HTTP)
- GraphQL (query language standard, uses HTTP)
- JSON-RPC (RPC standard, uses HTTP)

**Implementations → `/technical/`:**
- RabbitMQ (AMQP implementation)
- Socket.io (WebSocket implementation)
- Express.js (HTTP server implementation)
- Anthropic API (MCP implementation)

**Design patterns → `/patterns/`:**
- Pub/Sub (messaging pattern)
- Request-Reply (interaction pattern)
- Circuit Breaker (resilience pattern)

## Directory Structure

```
/protocols/
├── README.md                    # This guide
├── application/                 # OSI Layer 7 protocols
│   ├── http.md                 # HTTP/1.1, HTTP/2 specification
│   ├── websocket.md            # WebSocket protocol (RFC 6455)
│   ├── amqp.md                 # AMQP 0-9-1 messaging protocol
│   ├── mcp.md                  # Model Context Protocol
│   ├── mqtt.md                 # MQTT for IoT
│   ├── grpc.md                 # gRPC protocol layer
│   └── sse.md                  # Server-Sent Events
├── transport/                   # OSI Layer 4-5 protocols
│   ├── tcp.md                  # TCP reliability mechanisms
│   ├── udp.md                  # UDP datagram protocol
│   ├── quic.md                 # QUIC (used by HTTP/3)
│   └── tls.md                  # TLS/SSL encryption layer
└── data/                        # OSI Layer 6 (Presentation)
    ├── protobuf.md             # Protocol Buffers wire format
    ├── msgpack.md              # MessagePack binary format
    └── cbor.md                 # CBOR (Concise Binary Object Representation)
```

## Category Descriptions

### application/ - Application Layer (OSI L7)

**Purpose**: User-facing protocols that applications directly interact with.

**Characteristics**:
- Defines application-level semantics (REST verbs, message routing)
- Built on transport protocols (TCP, UDP, QUIC)
- Includes authentication/authorization mechanisms
- Human-readable or optimized binary formats

**Examples**:
- **HTTP**: Request-response protocol for web resources
- **WebSocket**: Full-duplex communication over TCP
- **AMQP**: Message queue routing and delivery
- **MCP**: AI agent context and tool invocation

### transport/ - Transport & Session Layer (OSI L4-5)

**Purpose**: Protocols that provide reliable data transfer and connection management.

**Characteristics**:
- Manages data segmentation and reassembly
- Provides reliability (retransmission, ordering)
- Handles flow control and congestion
- Establishes and maintains connections

**Examples**:
- **TCP**: Reliable, ordered byte stream
- **UDP**: Unreliable datagram delivery
- **QUIC**: Modern transport with TLS built-in
- **TLS**: Encryption and authentication layer

### data/ - Data Representation Layer (OSI L6)

**Purpose**: Protocols for serializing and deserializing data structures.

**Characteristics**:
- Defines encoding schemes (binary, text)
- Specifies data type mappings
- Handles endianness and alignment
- Provides schema evolution support

**Examples**:
- **Protocol Buffers**: Efficient binary serialization
- **MessagePack**: Binary JSON alternative
- **CBOR**: Compact binary data format

## When to CREATE a Protocol Document

### Decision Tree

```
Is it a communication specification?
├─ YES → Does it define message formats and sequencing?
│   ├─ YES → Does it operate at OSI Layer 4-7?
│   │   ├─ YES → Does it have multiple implementations?
│   │   │   ├─ YES → ✅ Document in /protocols/
│   │   │   └─ NO → Wait until widely adopted
│   │   └─ NO → Document in /technical/ (implementation detail)
│   └─ NO → Check if it's a standard or pattern
└─ NO → Not a protocol
```

### Create Protocol Documentation When:

1. **Standardized Specification Exists**
   - IETF RFC, W3C Recommendation, OASIS Standard
   - Example: HTTP (RFC 7230-7235), WebSocket (RFC 6455)

2. **Multiple Vendor Implementations**
   - At least 3 independent implementations
   - Example: AMQP (RabbitMQ, ActiveMQ, Qpid)

3. **Defines Wire Format**
   - Specifies exact byte layout or message syntax
   - Example: AMQP frame structure, HTTP headers

4. **Project Uses It for Communication**
   - Active integration in architecture
   - Example: MCP for AI agent coordination

5. **Team Needs Reference**
   - Debugging network issues
   - Understanding message flows
   - Planning integrations

### Don't Create Protocol Documentation For:

1. **One-Off APIs** - Document in `/technical/apis/`
2. **Internal Services** - Document in `/technical/services/`
3. **Architectural Styles** - Document in `/standards/`
4. **Design Patterns** - Document in `/patterns/`
5. **Proprietary Black Boxes** - Wait for specification release

## Protocol Document Template

```markdown
---
protocol: Protocol Name
version: "1.0"
standard: "RFC XXXX / OASIS / W3C"
layer: application | transport | data
status: stable | draft | deprecated
category: messaging | rpc | streaming | data-exchange
---

# Protocol Name

## Overview

**What**: One sentence describing what this protocol does
**Why**: Primary use case and problem it solves
**How**: High-level mechanism (request-response, pub-sub, streaming)

## Specification

- **Standard**: RFC/W3C/OASIS document reference
- **Version**: Current version used in project
- **Transport**: Underlying protocol (TCP, UDP, HTTP)
- **Port**: Default port(s) if applicable
- **Encoding**: Message format (text, binary, mixed)

## Message Format

### Message Structure

Describe the wire format or message layout:

```
[Example message structure]
Frame: [type][channel][size][payload]
Header: [key: value]
Body: [JSON/binary/protobuf]
```

### Message Types

- **Type 1**: Purpose and structure
- **Type 2**: Purpose and structure

## Connection Lifecycle

1. **Handshake**: How connections are established
2. **Authentication**: Security negotiation
3. **Operation**: Normal message exchange
4. **Teardown**: Graceful disconnection

## State Management

- **States**: List protocol states
- **Transitions**: State transition diagram or table
- **Timeouts**: Keep-alive, idle, max duration

## Error Handling

### Error Codes

| Code | Name | Meaning | Recovery |
|------|------|---------|----------|
| 200 | OK | Success | N/A |
| 404 | Not Found | Resource missing | Retry with different resource |

### Recovery Procedures

- **Connection Loss**: Reconnect strategy
- **Message Failure**: Retry/DLQ handling
- **Protocol Error**: Abort or fallback

## Security Considerations

- **Authentication**: Mechanism (TLS, tokens, certs)
- **Encryption**: TLS version, cipher suites
- **Authorization**: Access control model
- **Vulnerabilities**: Known CVEs or weaknesses

## Quality of Service

- **Reliability**: Guaranteed delivery, at-most-once, exactly-once
- **Ordering**: FIFO guarantees, causal ordering
- **Durability**: Message persistence
- **Performance**: Latency, throughput characteristics

## Implementation in Project

### Usage Context

Where and how we use this protocol:

```typescript
// Example code showing protocol usage
```

### Configuration

```yaml
# Example configuration
```

### Dependencies

- **Client Libraries**: List libraries used
- **Server/Broker**: Infrastructure components

## Interoperability

### Compatible Versions

- List compatible protocol versions
- Breaking changes between versions

### Client Support

| Client | Version | Notes |
|--------|---------|-------|
| Node.js | 18+ | Native support |
| Python | 3.8+ | Via library X |

## Monitoring & Debugging

### Key Metrics

- **Connection count**: Active connections
- **Message rate**: Messages/second
- **Error rate**: Failed messages
- **Latency**: Round-trip time

### Debugging Tools

- **Wireshark filters**: Protocol inspection
- **CLI tools**: Testing commands
- **Logs**: What to look for

## Comparison with Alternatives

| Feature | This Protocol | Alternative 1 | Alternative 2 |
|---------|--------------|---------------|---------------|
| Latency | Low | Medium | High |
| Complexity | Medium | Low | High |

## References

- **Official Spec**: [RFC XXXX](https://...)
- **Implementation Guide**: [Link]
- **Client Library Docs**: [Link]
- **Performance Studies**: [Link]

## Related Documentation

- **Standards**: `/standards/rest.md` (if built on this protocol)
- **Technical**: `/technical/services/rabbitmq.md` (implementation)
- **Patterns**: `/patterns/messaging/pub-sub.md` (pattern using protocol)
```

## Good vs Bad Examples

### ✅ GOOD: HTTP Protocol Documentation

```markdown
---
protocol: HTTP
version: "1.1"
standard: "RFC 7230-7235"
layer: application
status: stable
category: request-response
---

# HTTP (Hypertext Transfer Protocol)

## Overview

**What**: Request-response protocol for distributed hypermedia systems
**Why**: Enable web browsers to fetch resources from servers
**How**: Client sends request, server returns response with status code

## Message Format

### Request Structure
```
GET /path HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: text/html

[optional body]
```

### Response Structure
```
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1234

[body]
```

## Connection Lifecycle

1. **TCP Handshake**: 3-way handshake establishes connection
2. **Request**: Client sends HTTP request
3. **Response**: Server sends HTTP response
4. **Close or Keep-Alive**: Connection reuse via `Connection: keep-alive`

[... rest of template ...]
```

**Why Good**:
- ✅ Focuses on protocol mechanics (message format, lifecycle)
- ✅ Describes wire format and state transitions
- ✅ Includes error codes and recovery procedures
- ✅ References standard (RFC 7230-7235)

### ❌ BAD: REST "Protocol" Documentation

```markdown
# REST Protocol  ❌ WRONG - REST is not a protocol

REST is a request-response protocol...  ❌ Architectural style, not protocol

## Message Format  ❌ REST doesn't define message format, HTTP does

GET /api/users  ❌ This is HTTP, not a separate protocol
```

**Why Bad**:
- ❌ REST is an architectural style, not a protocol
- ❌ Confuses HTTP (protocol) with REST (constraints on HTTP use)
- ❌ Should be in `/standards/rest.md` instead

### ✅ GOOD: AMQP Protocol Documentation

```markdown
---
protocol: AMQP
version: "0-9-1"
standard: "OASIS AMQP 0-9-1"
layer: application
status: stable
category: messaging
---

# AMQP (Advanced Message Queuing Protocol)

## Overview

**What**: Binary protocol for message-oriented middleware
**Why**: Enable interoperable message queue systems
**How**: Frame-based protocol with channels, exchanges, and queues

## Message Format

### Frame Structure
```
Frame: [type: 1 byte][channel: 2 bytes][size: 4 bytes][payload][end-byte: 0xCE]
```

### Frame Types
- **Method Frame (1)**: Commands (Basic.Publish, Queue.Declare)
- **Header Frame (2)**: Content metadata
- **Body Frame (3)**: Message payload
- **Heartbeat Frame (8)**: Keep-alive

## Connection Lifecycle

1. **Protocol Header**: Client sends "AMQP\x00\x00\x09\x01"
2. **Connection.Start**: Server sends capabilities
3. **Connection.StartOk**: Client authenticates
4. **Connection.Tune**: Negotiate frame size, heartbeat
5. **Connection.Open**: Establish virtual host connection

[... rest of template ...]
```

**Why Good**:
- ✅ Describes binary frame structure
- ✅ Defines connection handshake sequence
- ✅ Specifies frame types and purposes
- ✅ References OASIS standard

### ❌ BAD: RabbitMQ "Protocol" Documentation

```markdown
# RabbitMQ Protocol  ❌ WRONG - RabbitMQ is an implementation

RabbitMQ uses AMQP to...  ❌ Should document AMQP, not RabbitMQ

## Installation  ❌ Implementation detail, not protocol spec

docker run -d rabbitmq:3  ❌ Belongs in /technical/services/
```

**Why Bad**:
- ❌ RabbitMQ is an AMQP implementation, not a protocol
- ❌ Mixes protocol specification with server implementation
- ❌ Should be in `/technical/services/rabbitmq.md` instead

## OSI Layer Mapping

Understanding where protocols fit in the OSI model helps categorize them correctly:

```
┌─────────────────────────────────────────────────────┐
│ OSI Layer 7: APPLICATION                            │
│ ↳ /protocols/application/                           │
│   • HTTP, WebSocket, AMQP, MCP, MQTT               │
│   • User-facing protocols                           │
│   • Application semantics                           │
├─────────────────────────────────────────────────────┤
│ OSI Layer 6: PRESENTATION                           │
│ ↳ /protocols/data/                                  │
│   • Protobuf, MessagePack, CBOR                     │
│   • Data serialization                              │
│   • Encoding/decoding                               │
├─────────────────────────────────────────────────────┤
│ OSI Layer 5: SESSION                                │
│ ↳ /protocols/transport/ (session management)        │
│   • TLS/SSL (encryption + session)                  │
│   • Session establishment                           │
├─────────────────────────────────────────────────────┤
│ OSI Layer 4: TRANSPORT                              │
│ ↳ /protocols/transport/                             │
│   • TCP, UDP, QUIC                                  │
│   • Reliable delivery                               │
│   • Flow control                                    │
├─────────────────────────────────────────────────────┤
│ OSI Layer 3: NETWORK (typically not documented)    │
│   • IP, ICMP, routing                               │
│   • Out of scope for application development       │
├─────────────────────────────────────────────────────┤
│ OSI Layer 2: DATA LINK (typically not documented)  │
│   • Ethernet, WiFi                                  │
│   • Out of scope for application development       │
├─────────────────────────────────────────────────────┤
│ OSI Layer 1: PHYSICAL (typically not documented)   │
│   • Cables, radio waves                             │
│   • Out of scope for application development       │
└─────────────────────────────────────────────────────┘
```

### Protocol Stack Example: Web Application

```
HTTP (application/)           ← Application protocol
  ↓
TLS (transport/)              ← Encryption layer
  ↓
TCP (transport/)              ← Reliable transport
  ↓
IP (not documented)           ← Network layer
  ↓
Ethernet (not documented)     ← Physical layer
```

### Protocol Stack Example: AI Agent with MCP

```
MCP (application/)            ← AI agent coordination
  ↓
HTTP/2 (application/)         ← Transport for MCP messages
  ↓
TLS (transport/)              ← Secure channel
  ↓
TCP (transport/)              ← Reliable stream
```

## Migration Guide

### Moving Documents TO /protocols/

If you find protocol specifications in other directories:

**From `/technical/`**:
```bash
# Example: MCP protocol specification
mv technical/mcp-protocol.md protocols/application/mcp.md
```

**What to Move**:
- Files describing message formats and wire protocols
- Documents referencing RFC/W3C/OASIS standards
- Specifications with version numbers (HTTP/1.1, AMQP 0-9-1)

**What NOT to Move**:
- Implementation guides (keep in `/technical/`)
- API documentation (keep in `/technical/apis/`)
- Service configurations (keep in `/technical/services/`)

### Moving Documents FROM /protocols/

If you find non-protocols in `/protocols/`:

**To `/standards/`**:
```bash
# Example: REST is an architectural style, not a protocol
mv protocols/application/rest.md standards/rest.md
```

**To `/technical/`**:
```bash
# Example: RabbitMQ is an implementation
mv protocols/application/rabbitmq.md technical/services/rabbitmq.md
```

## Quick Reference: Decision Matrix

| Question | Yes | No |
|----------|-----|-----|
| Does it define message format and sequencing? | Continue | → `/patterns/` or `/standards/` |
| Is there an RFC, W3C, or OASIS spec? | Continue | → Wait or `/technical/` |
| Do multiple vendors implement it? | Continue | → `/technical/` |
| Does it operate at OSI Layer 4-7? | ✅ `/protocols/` | → Infrastructure (out of scope) |

## Examples by Category

### Application Layer Protocols (`/protocols/application/`)

| Protocol | Use Case | Key Feature |
|----------|----------|-------------|
| **HTTP/1.1** | Web resources | Request-response, stateless |
| **HTTP/2** | Web performance | Multiplexing, server push |
| **WebSocket** | Real-time web | Full-duplex over TCP |
| **AMQP** | Message queues | Routing, exchanges, queues |
| **MQTT** | IoT messaging | Lightweight pub-sub |
| **MCP** | AI agent coordination | Tool invocation, context sharing |
| **gRPC** | RPC systems | HTTP/2, Protobuf, streaming |
| **SSE** | Server push | One-way server-to-client |

### Transport Layer Protocols (`/protocols/transport/`)

| Protocol | Use Case | Key Feature |
|----------|----------|-------------|
| **TCP** | Reliable delivery | In-order, error-checked |
| **UDP** | Low-latency | Unreliable, fast |
| **QUIC** | Modern transport | UDP + TLS, multiplexing |
| **TLS** | Encryption | Secure channels |

### Data Layer Protocols (`/protocols/data/`)

| Protocol | Use Case | Key Feature |
|----------|----------|-------------|
| **Protocol Buffers** | RPC serialization | Binary, compact, typed |
| **MessagePack** | JSON alternative | Binary JSON, efficient |
| **CBOR** | IoT data exchange | Compact, extensible |

## Common Pitfalls

### Pitfall 1: Confusing Protocol with Implementation

❌ **Wrong**: "Socket.io is a WebSocket protocol"
✅ **Right**: "Socket.io is a library that implements the WebSocket protocol with fallbacks"

**Fix**: Document Socket.io in `/technical/libraries/socket-io.md`, WebSocket in `/protocols/application/websocket.md`

### Pitfall 2: Confusing Protocol with Standard

❌ **Wrong**: "REST is a protocol"
✅ **Right**: "REST is an architectural style that uses the HTTP protocol"

**Fix**: Document REST in `/standards/rest.md`, HTTP in `/protocols/application/http.md`

### Pitfall 3: Confusing Protocol with Pattern

❌ **Wrong**: "Pub-Sub is a protocol"
✅ **Right**: "Pub-Sub is a messaging pattern implemented by protocols like AMQP and MQTT"

**Fix**: Document Pub-Sub in `/patterns/messaging/pub-sub.md`, AMQP in `/protocols/application/amqp.md`

### Pitfall 4: Over-Documenting Infrastructure Protocols

❌ **Wrong**: Creating `/protocols/network/ipv4.md`
✅ **Right**: Focus on application-layer protocols; assume IP/Ethernet as infrastructure

**Fix**: Only document protocols at OSI Layer 4 and above

### Pitfall 5: Documenting Proprietary APIs as Protocols

❌ **Wrong**: "AWS Lambda API is a protocol"
✅ **Right**: "AWS Lambda API is a service-specific interface using HTTP"

**Fix**: Document in `/technical/apis/aws-lambda.md`, not `/protocols/`

## Maintenance Guidelines

### Keeping Protocol Documentation Current

1. **Version Tracking**: Update when protocol versions change (HTTP/2 → HTTP/3)
2. **Standard Updates**: Monitor RFC errata and updated specifications
3. **Security Patches**: Document CVEs and mitigations
4. **Deprecation**: Mark obsolete protocols (HTTP/0.9, AMQP 0-8)
5. **Cross-References**: Link to related standards, patterns, and implementations

### Review Cadence

- **Quarterly**: Review for accuracy and broken links
- **On Integration**: Update when adding new protocol support
- **On Incident**: Update after protocol-related production issues
- **On Standard Release**: Update when RFCs or specs are published

## Summary

**Protocols define HOW systems communicate**:
- ✅ Message formats and sequencing
- ✅ State management and lifecycle
- ✅ Error handling and recovery
- ✅ Standardized specifications
- ✅ Multi-vendor implementations

**Document in `/protocols/` when**:
- Standardized specification exists (RFC, W3C, OASIS)
- Multiple independent implementations
- Defines wire format or message structure
- OSI Layer 4-7 operation
- Project actively uses it

**Don't confuse with**:
- Standards (architectural styles) → `/standards/`
- Implementations (libraries, services) → `/technical/`
- Patterns (design approaches) → `/patterns/`

**Use the template** to ensure comprehensive, consistent documentation across all protocol specifications.

---

**Related Documentation**:
- [Technical Primitives](../technical/technical-overview-hub.md) - Implementations and technologies
- [Standards](../standards/standards-overview-hub.md) - Architectural styles and data formats
- [Patterns](../patterns/patterns-catalog-hub.md) - Design approaches

**Next Steps**:
1. Identify protocols used in the project
2. Create protocol documents using the template
3. Link from architecture and technical docs
4. Update as protocols evolve

## Related Documents

### Related Files
- [[PROTOCOLS-HUB.md]] - Parent hub

