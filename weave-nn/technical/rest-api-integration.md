---
title: <span class="lucide-network"></span> REST API Integration Pattern
type: documentation
status: implemented
tags:
  - technical
  - infrastructure
  - api
  - integration
  - http
  - type/implementation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4DA"
  color: '#06B6D4'
  cssclasses:
    - type-documentation
    - status-implemented
updated: '2025-10-29T04:55:06.377Z'
version: '3.0'
keywords:
  - overview
  - key features
  - how it works
  - pros
  - cons
  - use cases for weave-nn
  - integration requirements
  - alternatives
  - performance considerations
  - documentation & resources
---

# <span class="lucide-network"></span> REST API Integration Pattern

A standardized HTTP-based integration architecture enabling programmatic access to Obsidian vaults through RESTful endpoints with authentication, retry logic, and error handling.

## Overview

The REST API Integration pattern in Weave-NN provides a robust, language-agnostic interface for autonomous agents to interact with Obsidian vaults. Built on HTTP/1.1 standards, the integration layer abstracts vault file operations into resource-oriented endpoints (e.g., `/notes`, `/search`) following RESTful principles.

This architecture enables distributed systems where agents run in separate processes or containers, communicating with Obsidian via HTTP rather than direct file system access. The stateless nature of REST allows horizontal scaling of agent workers without shared state concerns, critical for high-throughput automation workflows.

The implementation leverages standard HTTP methods (GET for retrieval, POST for creation, PATCH for updates, DELETE for removal) with JSON payloads, making integration straightforward across programming languages. Bearer token authentication secures endpoints while allowing flexible credential management through environment variables or secret stores.

**Quick Facts**:
- **Type**: Integration Architecture
- **Protocol**: HTTP/1.1 (REST)
- **Maturity**: Stable (Industry standard)
- **Maintainer**: Weave-NN Development Team
- **License**: MIT

## Key Features

- **Resource-Oriented Design**: Notes, properties, and metadata exposed as HTTP resources with predictable URLs
- **Standard HTTP Methods**: GET (read), POST (create), PATCH (update), DELETE (remove) for CRUD operations
- **JSON Payloads**: All request/response bodies use JSON format for easy parsing across languages
- **Bearer Authentication**: Token-based security with configurable key rotation and expiration
- **Error Standardization**: Consistent error response format with HTTP status codes (400, 401, 404, 500, etc.)
- **Content Negotiation**: Accept/Content-Type headers support multiple serialization formats
- **Retry Semantics**: Idempotent operations (GET, DELETE) safe to retry, POST requires idempotency keys
- **Rate Limiting**: Configurable request throttling to prevent API abuse and resource exhaustion

## How It Works

The REST API integration operates through a client-server architecture where the [[obsidian-api-client]] sends HTTP requests to an Obsidian vault API server (typically running as a plugin). The server processes requests, performs vault operations, and returns JSON responses. Authentication tokens validate each request before execution.

```javascript
// REST API request flow example
const axios = require('axios');

// Configure client with base URL and authentication
const client = axios.create({
  baseURL: 'http://localhost:27123',
  headers: {
    'Authorization': `Bearer ${process.env.OBSIDIAN_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000
});

// GET request to fetch notes
const response = await client.get('/notes', {
  params: { limit: 10, tags: 'journal' }
});
// Response: { data: [{ path: 'journal/2025-10-22.md', content: '...', frontmatter: {...} }] }

// POST request to create note
const newNote = await client.post('/notes', {
  path: 'test/example.md',
  content: '# Example Note\n\nContent here',
  frontmatter: { tags: ['test'], created: '2025-10-22' }
});
// Response: { data: { path: 'test/example.md', id: 'abc123', createdAt: '2025-10-22T12:34:56Z' } }

// PATCH request to update note
const updated = await client.patch('/notes/test%2Fexample.md', {
  frontmatter: { tags: ['test', 'updated'], modified: '2025-10-22' }
});
// Response: { data: { path: 'test/example.md', modifiedAt: '2025-10-22T12:35:00Z' } }

// DELETE request to remove note
await client.delete('/notes/test%2Fexample.md', {
  params: { permanent: false } // Move to trash instead of permanent delete
});
// Response: { status: 204, data: null }

// Error handling
try {
  await client.get('/notes/nonexistent.md');
} catch (error) {
  console.log(error.response.status); // 404
  console.log(error.response.data); // { error: 'Note not found', code: 'NOT_FOUND' }
}
```

## Pros

- **Language Agnostic**: Any language with HTTP client can integrate (Python, Go, Rust, etc.), not limited to JavaScript ecosystem
- **Scalable Architecture**: Stateless design enables horizontal scaling of agent workers across multiple servers or containers
- **Clear Semantics**: HTTP methods provide universal understanding of operations (GET=read, POST=create), reducing onboarding time

## Cons

- **Network Latency**: HTTP round-trip adds 5-50ms overhead per operation compared to direct file system access
- **Infrastructure Complexity**: Requires API server deployment, monitoring, and maintenance beyond simple file operations
- **Bandwidth Costs**: JSON serialization increases payload size 2-3x compared to binary formats, impacting large vault operations

## Use Cases for Weave-NN

REST API integration enables distributed, scalable automation workflows across Weave-NN's agent architecture.

1. **Distributed Agent Workflows**: Multiple [[ai-agent-integration]] workers run in parallel, coordinating through shared Obsidian vault state
2. **Cloud-Native Deployments**: Deploy agents in containers (Docker, Kubernetes) accessing central vault via HTTP
3. **Cross-Language Integration**: Python data analysis scripts, Go performance tools, JavaScript agentsall access same vault
4. **Microservices Architecture**: [[rule-engine]] runs as separate service, [[property-visualizer]] as another, coordinating via API
5. **Webhook Automation**: External systems (GitHub, JIRA, Slack) trigger vault updates via HTTP callbacks
6. **API Gateway Pattern**: Centralize authentication, rate limiting, and logging at gateway layer before vault access

## Integration Requirements

REST API integration requires an HTTP server running Obsidian REST API plugin and network connectivity.

**Dependencies**:
- Obsidian REST API Plugin (vault-side server)
- HTTP client library (Axios, Fetch, etc.)
- Network connectivity (localhost or LAN/WAN)
- Authentication credentials (API key)

**Environment Variables**:
```bash
OBSIDIAN_API_URL=http://localhost:27123
OBSIDIAN_API_KEY=your-secure-api-key-here
```

**Network Requirements**:
- Port 27123 (default) open for connections
- HTTPS recommended for production (TLS/SSL)
- CORS headers for browser-based clients

**Setup Complexity**: Moderate
**Learning Curve**: Shallow (standard HTTP)

## Alternatives

Comparison of API integration approaches for vault access:

| Technology | Pros | Cons | Maturity |
|------------|------|------|----------|
| REST API | Universal, stateless, scalable | Network latency, overhead | Mature |
| GraphQL | Typed queries, single endpoint | Learning curve, overkill for simple CRUD | Mature |
| gRPC | Fast binary protocol, streaming | Complex setup, fewer tools | Stable |
| WebSocket | Real-time, bidirectional | Stateful, connection management | Mature |
| Direct File Access | Fastest, no network | Not distributed, file locking issues | N/A |

## Performance Considerations

REST API performance characteristics:

- **Localhost latency**: 1-5ms round-trip
- **LAN latency**: 5-20ms round-trip
- **WAN latency**: 50-500ms round-trip
- **Throughput**: 100-1000 requests/second (depends on server)
- **Payload size**: 1-100KB typical JSON response

Optimization strategies:
- Batch operations to reduce round-trips
- Use compression (gzip) for large payloads
- Implement caching for read-heavy workloads
- Connection pooling to reuse TCP connections

## Documentation & Resources

- **Implementation**: [[obsidian-api-client]] (417 lines)
- **Configuration**: `/home/aepod/dev/weave-nn/src/clients/ObsidianAPIClient.js`
- **REST API Plugin**: https://github.com/coddingtonbear/obsidian-local-rest-api
- **HTTP Standards**: https://developer.mozilla.org/en-US/docs/Web/HTTP
- **RESTful API Design**: https://restfulapi.net/

## Decision Impact

REST API integration is the **foundational communication layer** for all vault operations in Weave-NN.

**Blocks**: [[obsidian-api-client]], [[property-visualizer]], [[rule-engine]] actions
**Impacts**: [[deployment-architecture]], [[authentication-strategy]], [[error-handling-standards]]

## Implementation Notes

REST API integration is production-ready and battle-tested. Key implementation patterns:

- **Connection Pooling**: Reuse HTTP connections with `keepAlive: true` in Axios config
- **Retry Logic**: Implement exponential backoff for 5xx errors and network failures
- **Timeout Management**: Set request timeouts (30s default) to prevent hanging operations
- **Error Handling**: Catch network errors separately from HTTP errors (4xx/5xx)

Example advanced configuration:
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: process.env.OBSIDIAN_API_URL,
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${process.env.OBSIDIAN_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Weave-NN/1.0.0'
  },
  // Connection pooling
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 10 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 10 }),
  // Automatic retry
  'axios-retry': {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) => {
      return error.code === 'ECONNABORTED' ||
             error.response?.status >= 500;
    }
  }
});

// Interceptor for logging
client.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    return config;
  }
);

client.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    console.log(`${response.config.method.toUpperCase()} ${response.config.url} - ${duration}ms`);
    return response;
  }
);
```

## = Related

### Technical
- [[obsidian-api-client]] - Client implementation
- [[http-protocol]] - Protocol fundamentals
- [[authentication-patterns]] - Security approaches

### Decisions
- [[api-architecture]] - Overall API design
- [[authentication-strategy]] - Token management
- [[error-handling-standards]] - Error response format

### Concepts
- [[restful-design-principles]] - REST architectural style
- [[stateless-architecture]] - Scalability pattern
- [[microservices-communication]] - Service integration

### Features
- [[property-visualizer]] - Uses REST API for data
- [[rule-engine]] - Triggers API operations
- [[ai-agent-integration]] - Distributed agent coordination

---

**Created**: 2025-10-22
**Last Updated**: 2025-10-22
**Status**: Implemented
