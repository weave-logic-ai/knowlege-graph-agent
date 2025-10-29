---
title: Schemas Directory
type: hub
status: complete
tags:
  - type/hub
  - status/complete
priority: medium
visual:
  icon: "\U0001F310"
  color: '#4A90E2'
  cssclasses:
    - hub-document
updated: '2025-10-29T04:55:03.775Z'
keywords:
  - what is a schema?
  - 'example schema types:'
  - core characteristics
  - schema vs standard vs model
  - scope boundaries
  - 'what belongs in /schemas/:'
  - 'what does not belong here:'
  - directory structure
  - schema categories
  - 1. events (`/schemas/events/`)
---
# Schemas Directory

**Purpose**: Document data structure definitions, validation rules, and type contracts used across the Weave-NN project.

---

## What IS a Schema?

A **schema** is a formal specification that defines:
- **Data structure** - Fields, types, and organization
- **Validation rules** - Required fields, constraints, formats
- **Type contracts** - Interfaces between components
- **Documentation** - Field descriptions and examples

Schemas answer: *"What shape does this data have?"*

### Example Schema Types:
- **Event schemas** - RabbitMQ message structures
- **Database schemas** - Table definitions and relationships
- **API schemas** - Request/response formats
- **Metadata schemas** - YAML frontmatter properties
- **Protocol schemas** - MCP tool parameters

---

## Core Characteristics

### Schema vs Standard vs Model

| Aspect | Schema | Standard | Model |
|--------|--------|----------|-------|
| **Purpose** | Define data structure | Specify format/protocol | Represent domain entity |
| **Scope** | Single data type | Industry-wide format | Business logic |
| **Examples** | File event schema | JSON standard | User model class |
| **Location** | `/schemas/` | `/standards/` | `/src/models/` |
| **Format** | JSON Schema, TypeScript | Specification doc | Code implementation |

**Key distinction**:
- Schema = *"How do we structure a file event?"* (our design)
- Standard = *"How does JSON work?"* (industry format)
- Model = *"How does a User behave?"* (business entity)

---

## Scope Boundaries

### What BELONGS in /schemas/:
✅ **Data structure definitions**
- Event message formats
- Database table structures
- API request/response schemas
- YAML frontmatter properties
- MCP tool parameter types

✅ **Validation rules**
- Required vs optional fields
- Type constraints (string, number, etc.)
- Format patterns (regex, enums)
- Relationship constraints (foreign keys)

✅ **Type contracts**
- Interface definitions
- Protocol specifications
- Message formats
- Configuration structures

### What DOES NOT belong here:

❌ **Architecture decisions** → `/decisions/architecture/`
- System design patterns
- Component interactions
- Deployment topology

❌ **Technical implementations** → `/technical/`
- Database engines (SQLite, PostgreSQL)
- Message brokers (RabbitMQ setup)
- Storage technologies

❌ **Industry standards** → `/standards/`
- JSON/YAML format specs
- HTTP protocol details
- ISO standards

❌ **Code implementations** → `/src/`
- Model classes
- Database migrations
- API controllers

---

## Directory Structure

```
/schemas/
├── README.md              # This comprehensive guide
├── events/                # Event message schemas
│   ├── file-event.md      # RabbitMQ file event structure
│   ├── task-event.md      # Task lifecycle events
│   └── system-event.md    # System notification events
├── metadata/              # Metadata structure schemas
│   ├── frontmatter-properties.md  # YAML frontmatter schema
│   ├── file-annotations.md        # Annotation format
│   └── tag-taxonomy.md            # Tag structure rules
├── database/              # Database table schemas
│   ├── shadow-cache.md    # Shadow cache table structure
│   ├── indexes.md         # Index definitions
│   └── relationships.md   # Foreign key constraints
├── mcp/                   # MCP protocol schemas
│   ├── tool-parameters.md # Tool input schema
│   ├── tool-responses.md  # Tool output schema
│   └── server-config.md   # Server configuration
└── api/                   # API contract schemas
    ├── rest-endpoints.md  # REST API schemas
    ├── graphql-types.md   # GraphQL type definitions
    └── webhook-payloads.md # Webhook event formats
```

---

## Schema Categories

### 1. Events (`/schemas/events/`)

**Purpose**: Document message structures for event-driven systems

**When to use**:
- RabbitMQ message formats
- WebSocket event payloads
- System notification structures
- Task lifecycle events

**Example**: `file-event.md`
```typescript
{
  "eventType": "file.created",
  "timestamp": "2025-10-23T10:30:00Z",
  "payload": {
    "filePath": "/absolute/path/to/file.md",
    "fileType": "markdown",
    "operation": "create",
    "metadata": { ... }
  }
}
```

---

### 2. Metadata (`/schemas/metadata/`)

**Purpose**: Document metadata structure and validation rules

**When to use**:
- YAML frontmatter properties
- File annotation formats
- Tag taxonomy rules
- Configuration metadata

**Example**: `frontmatter-properties.md`
```yaml
---
title: string (required)
tags: string[] (required, min: 1)
created: ISO8601 datetime (auto-generated)
updated: ISO8601 datetime (auto-updated)
status: enum[draft, review, final] (default: draft)
---
```

---

### 3. Database (`/schemas/database/`)

**Purpose**: Document database table structures and constraints

**When to use**:
- Table definitions
- Column types and constraints
- Index structures
- Foreign key relationships

**Example**: `shadow-cache.md`
```sql
CREATE TABLE shadow_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  content_hash TEXT NOT NULL,
  metadata JSON NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  INDEX idx_file_path ON shadow_cache(file_path),
  INDEX idx_updated_at ON shadow_cache(updated_at)
);
```

---

### 4. MCP (`/schemas/mcp/`)

**Purpose**: Document MCP tool parameter and response schemas

**When to use**:
- Tool input parameters
- Tool output formats
- Server configuration
- Protocol messages

**Example**: `tool-parameters.md`
```json
{
  "tool": "file_index_query",
  "parameters": {
    "query": {
      "type": "string",
      "required": true,
      "description": "Search query string"
    },
    "filters": {
      "type": "object",
      "required": false,
      "properties": {
        "fileType": { "type": "string", "enum": ["md", "ts", "js"] },
        "dateRange": { "type": "object" }
      }
    }
  }
}
```

---

### 5. API (`/schemas/api/`)

**Purpose**: Document REST/GraphQL API contracts

**When to use**:
- REST endpoint request/response formats
- GraphQL type definitions
- Webhook payload structures
- API versioning schemas

**Example**: `rest-endpoints.md`
```typescript
// POST /api/files/index
Request: {
  filePath: string;      // Absolute path
  content?: string;      // Optional content
  metadata?: object;     // Optional metadata
}

Response: {
  id: number;
  indexed: boolean;
  timestamp: string;
  error?: string;
}
```

---

## When to CREATE a Schema Document

### Decision Criteria:

✅ **CREATE a schema when**:
1. Defining a new data structure used across components
2. Documenting event message formats
3. Specifying API request/response contracts
4. Formalizing database table structures
5. Establishing validation rules for data types

❌ **DO NOT create a schema for**:
1. One-off internal data structures (keep in code)
2. Industry standard formats (document in `/standards/`)
3. Implementation classes (keep in `/src/models/`)
4. Configuration files (document in `/config/`)

### Examples:

| Scenario | Action | Location |
|----------|--------|----------|
| RabbitMQ file event message | ✅ Create schema | `/schemas/events/file-event.md` |
| YAML frontmatter properties | ✅ Create schema | `/schemas/metadata/frontmatter-properties.md` |
| Shadow cache table structure | ✅ Create schema | `/schemas/database/shadow-cache.md` |
| MCP tool parameters | ✅ Create schema | `/schemas/mcp/tool-parameters.md` |
| User model class | ❌ Keep in code | `/src/models/User.ts` |
| JSON standard | ❌ Standards doc | `/standards/data-formats/json.md` |
| SQLite technology | ❌ Technical doc | `/technical/databases/sqlite.md` |

---

## Schema Document Template

### Standard Structure:

```markdown
---
title: Schema Name
category: events|metadata|database|mcp|api
version: 1.0.0
status: draft|stable|deprecated
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Schema Name

## Purpose
Brief description of what this schema defines.

## Schema Definition

### JSON Schema
\`\`\`json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "fieldName": {
      "type": "string",
      "description": "Field description",
      "required": true
    }
  }
}
\`\`\`

### TypeScript Interface
\`\`\`typescript
interface SchemaName {
  fieldName: string;      // Required field
  optionalField?: number; // Optional field
}
\`\`\`

### SQL Definition (if applicable)
\`\`\`sql
CREATE TABLE table_name (
  id INTEGER PRIMARY KEY,
  field_name TEXT NOT NULL
);
\`\`\`

## Validation Rules

1. **Required Fields**: field1, field2
2. **Optional Fields**: field3, field4
3. **Constraints**:
   - field1 must match regex: `^[a-z]+$`
   - field2 must be > 0
4. **Relationships**: foreign key to other_table.id

## Examples

### Valid Example
\`\`\`json
{
  "fieldName": "value",
  "optionalField": 123
}
\`\`\`

### Invalid Example
\`\`\`json
{
  "fieldName": 123  // ❌ Wrong type (should be string)
}
\`\`\`

## Usage

How this schema is used in the system:
- Component A validates input against this schema
- Component B serializes data using this format
- Database table X stores data in this structure

## Related

- **Standards**: `/standards/data-formats/json.md`
- **Technical**: `/technical/databases/sqlite.md`
- **Architecture**: `/decisions/architecture/ADR-001-event-sourcing.md`
- **Implementation**: `/src/models/SchemaModel.ts`

## Version History

- **1.0.0** (2025-10-23): Initial schema definition
- **0.9.0** (2025-10-20): Draft version
```

---

## Schema Validation

### How to Validate Data Against Schemas

#### 1. JSON Schema Validation (JavaScript/TypeScript)
```typescript
import Ajv from 'ajv';

const ajv = new Ajv();
const schema = {
  type: "object",
  properties: {
    eventType: { type: "string" },
    timestamp: { type: "string", format: "date-time" }
  },
  required: ["eventType", "timestamp"]
};

const validate = ajv.compile(schema);
const valid = validate(data);
if (!valid) {
  console.error(validate.errors);
}
```

#### 2. TypeScript Type Checking
```typescript
interface FileEvent {
  eventType: string;
  timestamp: string;
  payload: object;
}

function processEvent(event: FileEvent) {
  // TypeScript enforces schema at compile time
}
```

#### 3. Database Schema Validation
```sql
-- SQLite enforces schema at INSERT/UPDATE time
INSERT INTO shadow_cache (file_path, content_hash, metadata)
VALUES (?, ?, ?);  -- Will fail if constraints violated
```

#### 4. API Schema Validation (Express)
```typescript
import { validateRequest } from 'express-validator';

app.post('/api/files',
  validateRequest({
    filePath: { type: 'string', required: true },
    content: { type: 'string', required: false }
  }),
  (req, res) => { ... }
);
```

---

## Good vs Bad Examples

### ✅ GOOD: Event Schema Document

**File**: `/schemas/events/file-event.md`

```markdown
---
title: File Event Schema
category: events
version: 1.0.0
status: stable
---

# File Event Schema

## Purpose
Defines the structure of file lifecycle events published to RabbitMQ.

## Schema Definition

\`\`\`typescript
interface FileEvent {
  eventType: 'file.created' | 'file.updated' | 'file.deleted';
  timestamp: string;  // ISO8601
  payload: {
    filePath: string;      // Absolute path
    fileType: string;      // Extension without dot
    operation: string;     // create|update|delete
    metadata: object;      // File-specific metadata
  };
}
\`\`\`

## Validation Rules
- `eventType` must be one of: file.created, file.updated, file.deleted
- `timestamp` must be valid ISO8601 datetime
- `filePath` must be absolute path
- `fileType` must not include leading dot

## Examples

### Valid Event
\`\`\`json
{
  "eventType": "file.created",
  "timestamp": "2025-10-23T10:30:00Z",
  "payload": {
    "filePath": "/home/user/docs/note.md",
    "fileType": "md",
    "operation": "create",
    "metadata": { "size": 1024 }
  }
}
\`\`\`
```

**Why this is good**:
- ✅ Clear purpose and scope
- ✅ Complete type definitions
- ✅ Explicit validation rules
- ✅ Concrete examples
- ✅ TypeScript interface for type safety

---

### ❌ BAD: Mixing Schema with Implementation

**File**: `/schemas/events/file-processing.md` ❌

```markdown
# File Processing

This is how we process files in the system.

## Code
\`\`\`typescript
class FileProcessor {
  async processFile(path: string) {
    const event = { type: "file", path };
    await rabbitMQ.publish(event);
  }
}
\`\`\`

We use RabbitMQ to send events. RabbitMQ is a message broker
that implements AMQP protocol...
```

**Why this is bad**:
- ❌ Mixes schema with implementation code
- ❌ No formal schema definition
- ❌ No validation rules
- ❌ Documents technology (RabbitMQ) instead of structure
- ❌ Should be split: schema in `/schemas/`, code in `/src/`, tech in `/technical/`

---

### ✅ GOOD: Database Schema Document

**File**: `/schemas/database/shadow-cache.md`

```markdown
---
title: Shadow Cache Table Schema
category: database
version: 1.0.0
status: stable
---

# Shadow Cache Table Schema

## Purpose
Stores indexed file content and metadata for fast querying.

## Schema Definition

\`\`\`sql
CREATE TABLE shadow_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  content_hash TEXT NOT NULL,
  metadata JSON NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_file_path ON shadow_cache(file_path);
CREATE INDEX idx_updated_at ON shadow_cache(updated_at);
\`\`\`

## Column Descriptions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY | Auto-incrementing ID |
| file_path | TEXT | NOT NULL, UNIQUE | Absolute file path |
| content_hash | TEXT | NOT NULL | SHA-256 hash of content |
| metadata | JSON | NOT NULL | Structured file metadata |
| created_at | INTEGER | NOT NULL | Unix timestamp |
| updated_at | INTEGER | NOT NULL | Unix timestamp |

## Validation Rules
- `file_path` must be absolute path
- `content_hash` must be 64-character hex string
- `metadata` must be valid JSON object
- `created_at` and `updated_at` must be Unix timestamps

## Related
- **Implementation**: `/src/database/shadowCache.ts`
- **Technical**: `/technical/databases/sqlite.md`
```

**Why this is good**:
- ✅ Pure schema definition (no implementation)
- ✅ Clear column descriptions
- ✅ Explicit constraints
- ✅ Validation rules documented
- ✅ Links to related docs

---

### ❌ BAD: Documenting Database Engine

**File**: `/schemas/database/sqlite.md` ❌

```markdown
# SQLite

SQLite is a C-language library that implements a small, fast,
self-contained SQL database engine...

## Installation
\`\`\`bash
npm install sqlite3
\`\`\`

## Usage
\`\`\`typescript
import sqlite3 from 'sqlite3';
const db = new sqlite3.Database(':memory:');
\`\`\`
```

**Why this is bad**:
- ❌ Documents technology, not schema
- ❌ Should be in `/technical/databases/sqlite.md`
- ❌ No schema definitions
- ❌ Focuses on tool usage, not data structure

---

## Schema Categories Summary

### Quick Reference:

| Category | Purpose | Examples | Key Format |
|----------|---------|----------|------------|
| **Events** | Message formats | RabbitMQ events, WebSocket messages | JSON Schema, TypeScript |
| **Metadata** | Structured metadata | YAML frontmatter, annotations | YAML, JSON Schema |
| **Database** | Table structures | SQLite tables, indexes | SQL DDL |
| **MCP** | Protocol definitions | Tool parameters, responses | JSON Schema, TypeScript |
| **API** | API contracts | REST endpoints, GraphQL types | OpenAPI, GraphQL SDL |

---

## Integration with Other Directories

### Cross-References:

```
/schemas/                      ← Data structure definitions
  ↓ implements
/technical/                    ← Technology choices
  ↓ stores in
/config/                       ← Runtime configuration
  ↓ validates with
/src/models/                   ← Code implementations
  ↓ documents decisions in
/decisions/architecture/       ← Architecture decisions
```

### Example Flow:

1. **Architecture Decision**: `/decisions/architecture/ADR-001-event-sourcing.md`
   - *Decision*: Use event sourcing for file changes

2. **Schema Definition**: `/schemas/events/file-event.md`
   - *Defines*: Structure of file events

3. **Technical Choice**: `/technical/message-brokers/rabbitmq.md`
   - *Technology*: RabbitMQ for event transport

4. **Implementation**: `/src/events/FileEventPublisher.ts`
   - *Code*: Publishes events matching schema

5. **Configuration**: `/config/rabbitmq.config.ts`
   - *Runtime*: RabbitMQ connection settings

---

## Best Practices

### DO:
✅ Use standard schema formats (JSON Schema, TypeScript, SQL DDL)
✅ Include validation rules explicitly
✅ Provide both valid and invalid examples
✅ Version schemas when structure changes
✅ Link to related documentation
✅ Document field descriptions thoroughly
✅ Specify required vs optional fields

### DON'T:
❌ Mix schema with implementation code
❌ Document industry standards (use `/standards/`)
❌ Include technology setup instructions (use `/technical/`)
❌ Embed business logic (use `/src/models/`)
❌ Skip validation rules
❌ Omit examples
❌ Use ambiguous type definitions

---

## Schema Evolution

### Versioning Strategy:

```markdown
## Version History

- **2.0.0** (2025-11-01): BREAKING: Renamed `type` to `eventType`
- **1.1.0** (2025-10-28): Added optional `metadata.author` field
- **1.0.0** (2025-10-23): Initial stable release
- **0.9.0** (2025-10-20): Draft version
```

### Deprecation Process:

1. Mark schema as `status: deprecated` in frontmatter
2. Document migration path to new schema
3. Maintain compatibility for 2 versions
4. Remove after deprecation period

---

## Tools and Validation

### Recommended Tools:

- **JSON Schema**: [Ajv](https://ajv.js.org/) - Fast JSON validator
- **TypeScript**: Built-in type checking
- **SQL**: Database engine validation
- **OpenAPI**: [Swagger](https://swagger.io/) - API schema validation
- **GraphQL**: [GraphQL.js](https://graphql.org/) - Type validation

---

## Contributing

When adding a new schema:

1. Determine correct category (events/metadata/database/mcp/api)
2. Use schema template structure
3. Include complete validation rules
4. Provide valid and invalid examples
5. Link to related documentation
6. Add version history entry

---

## Maintenance

This directory requires:
- **Weekly**: Review new schema documents for completeness
- **Monthly**: Validate schemas against implementations
- **Quarterly**: Check for outdated/deprecated schemas
- **Yearly**: Major version review and cleanup

---

**Last Updated**: 2025-10-23
**Maintained By**: Architecture Team
**Review Cycle**: Monthly

---

*Remember: Schemas define the shape of data, not how to build or use systems. Keep them pure, formal, and focused on structure.*

## Related Documents

### Related Files
- [[SCHEMAS-HUB.md]] - Parent hub

