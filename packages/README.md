# Packages Directory (Future Shared Libraries)

**Purpose**: Placeholder for future shared TypeScript/Python libraries when Weaver grows into multiple services

**Current Status**: ⏳ Not implemented - Placeholder only

---

## 🎯 What Goes Here?

This directory will contain **shared libraries** that are reused across multiple services to avoid code duplication.

---

## Future Packages

### TypeScript Packages (v0.5+)
When Weaver splits into multiple Node.js/TypeScript services:

- `@weave-nn/common` - Shared utilities, types, interfaces
  - Logger configuration
  - Error handling utilities
  - Common TypeScript types
  - Environment configuration helpers

- `@weave-nn/mcp-sdk` - MCP protocol client SDK
  - MCP tool definitions
  - MCP request/response types
  - MCP client wrapper
  - Tool validation utilities

- `@weave-nn/workflows` - Shared workflow definitions
  - Common workflow utilities
  - Workflow context helpers
  - Reusable workflow steps
  - Workflow error handling

- `@weave-nn/shadow-cache` - Shadow cache client library
  - SQLite connection pool
  - Cache query helpers
  - Cache invalidation utilities
  - Cache metrics

### Python Packages (v1.0+)
When Python FastAPI services are added:

- `weave-common` - Common Python utilities
  - Logging configuration
  - Configuration management
  - Custom exception classes
  - General utilities

- `weave-messaging` - RabbitMQ client abstractions
  - Base consumer class
  - Base publisher class
  - Connection management
  - Message schemas (Pydantic)

- `weave-db` - PostgreSQL access layer
  - Database connection pool
  - SQLAlchemy models
  - Repository pattern implementations
  - Alembic migrations

- `weave-graph` - Knowledge graph operations
  - Graph builder utilities
  - Graph query helpers
  - Temporal query support
  - Vector search integration

- `weave-mcp` - MCP server implementations
  - MCP server base class
  - Tool definitions
  - Request handlers
  - Protocol utilities

---

## Package Template Structure

### TypeScript Package
```
@weave-nn/package-name/
├── src/
│   ├── index.ts             # Main export
│   ├── module1.ts
│   └── module2.ts
├── tests/
│   └── module1.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Python Package
```
weave-package-name/
├── src/
│   └── weave_package_name/
│       ├── __init__.py
│       ├── module1.py
│       └── module2.py
├── tests/
│   └── test_module1.py
├── pyproject.toml
└── README.md
```

---

## Current Status (MVP v0.1-0.4)

**All code is in the unified Weaver service** (`/weaver/`)

No shared packages needed because there's only one service.

---

## When to Create Shared Packages

### TypeScript Packages (v0.5)
**Trigger**: When Weaver splits into 3+ services

**Example**: After splitting Weaver into:
- API Gateway service
- MCP Server service
- File Watcher service

**Common code to extract**:
- Logger configuration (currently in `/weaver/src/utils/logger.ts`)
- MCP types (currently in `/weaver/src/mcp-server/`)
- Shadow cache client (currently in `/weaver/src/shadow-cache/`)

### Python Packages (v1.0)
**Trigger**: When adding first Python FastAPI service

**Example**: After adding:
- Knowledge Extractor service
- Rule Engine service

**Common code to extract**:
- RabbitMQ client (needed by all event-driven services)
- Database access (needed by multiple services)
- Configuration management (needed by all services)

---

## Package Design Principles

### 1. Reusability
- Avoid code duplication across services
- Single source of truth for shared functionality
- Version independently of services

### 2. Versioning
- Each package can be versioned independently
- Semantic versioning (major.minor.patch)
- Services can depend on specific package versions

### 3. Testing
- Comprehensive unit tests for shared code
- Higher testing standards than service code
- Test against multiple service scenarios

### 4. Documentation
- Clear API documentation for consumers
- Usage examples for all public APIs
- Migration guides for breaking changes

---

## Migration Path

### Phase 1: Extract TypeScript Common (v0.5)
1. Create `@weave-nn/common` package
2. Move logger, error handling, types from Weaver
3. Update Weaver to depend on `@weave-nn/common`
4. Update new services to use `@weave-nn/common`

### Phase 2: Extract MCP SDK (v0.5)
1. Create `@weave-nn/mcp-sdk` package
2. Move MCP tool definitions and client from Weaver
3. Update MCP Server service to use `@weave-nn/mcp-sdk`
4. Allow future MCP servers to reuse SDK

### Phase 3: Create Python Packages (v1.0)
1. Create `weave-common` package
2. Create `weave-messaging` package for RabbitMQ
3. Update all Python services to use shared packages
4. Extract database and graph packages as needed

---

## Package Publishing Strategy

### Internal Use Only (Initial)
- Packages stored in monorepo
- Linked via local paths or monorepo tooling
- No external publishing needed

### Future: Private NPM Registry (v2.0+)
- Publish TypeScript packages to private NPM registry
- Publish Python packages to private PyPI
- Enable external projects to consume packages
- Version tracking and dependency management

---

## Related Documentation

- `/docs/monorepo-structure-mvp.md` - MVP directory structure
- `/docs/monorepo-structure.md` - Full monorepo structure with packages
- `/docs/migration-strategy-local-to-microservices.md` - Migration plan
- `/services/README.md` - Future microservices

---

**Last Updated**: 2025-10-23
**Status**: Placeholder directory
**Next Review**: When Weaver splits into multiple services (v0.5)
