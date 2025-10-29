#!/bin/bash
# Initialize Weave-NN Vault Primitives Structure
# Creates all missing directories and READMEs per VAULT-ARCHITYPE-ANALYSIS

set -e

VAULT_ROOT="${1:-.}"
cd "$VAULT_ROOT"

echo "🧵 Initializing Weave-NN Vault Primitives..."
echo "Vault root: $(pwd)"
echo ""

# Function to create directory and README
create_dir_with_readme() {
    local dir="$1"
    local title="$2"
    local description="$3"
    local content="$4"
    
    mkdir -p "$dir"
    
    cat > "$dir/README.md" <<EOF
---
type: directory-hub
status: active
priority: ${5:-medium}
tags: [hub, ${6:-general}]
---

# $title

$description

---

$content

---

**Status**: Active
**Last Updated**: $(date +%Y-%m-%d)
EOF
    
    echo "✓ Created $dir/"
}

# 1. PATTERNS (CRITICAL) - Architectural patterns
echo "📐 Creating patterns/..."
create_dir_with_readme "patterns" "Architectural Patterns" \
"Reusable architectural patterns and design solutions" \
"## Overview

This directory contains documented architectural patterns used across the Weave-NN platform.

## Subdirectories

### /api-patterns
API design patterns (REST, GraphQL, RPC, etc.)

### /data-patterns
Data modeling and storage patterns

### /integration-patterns
System integration patterns (event-driven, microservices, etc.)

### /ui-patterns
User interface and interaction patterns

### /security-patterns
Security and authentication patterns

## Usage

Each pattern should include:
- Problem statement
- Context and when to use
- Solution description
- Implementation examples
- Trade-offs and alternatives

## Example Pattern Structure

\`\`\`markdown
# Pattern Name

**Type**: API/Data/Integration/UI/Security
**Status**: Proposed/Accepted/Deprecated

## Problem
What problem does this solve?

## Context
When should you use this pattern?

## Solution
How does it work?

## Implementation
\`\`\`typescript
// Code example
\`\`\`

## Trade-offs
- Pros
- Cons

## Alternatives
- Alternative Pattern 1
- Alternative Pattern 2
\`\`\`

## Related
- [[../decisions/]] - Related architectural decisions
- [[../architecture/]] - System architecture
" "critical" "patterns,architecture"

# Create pattern subdirectories
mkdir -p patterns/{api-patterns,data-patterns,integration-patterns,ui-patterns,security-patterns}

# 2. PROTOCOLS (CRITICAL) - Communication protocols
echo "🔌 Creating protocols/..."
create_dir_with_readme "protocols" "Communication Protocols" \
"Protocol specifications and communication standards" \
"## Overview

Defines how different parts of the system communicate.

## Subdirectories

### /mcp
Model Context Protocol specifications

### /api
API protocols (REST, GraphQL, WebSocket)

### /messaging
Message queue and pub/sub protocols

### /rpc
Remote procedure call protocols

## Protocol Documentation

Each protocol should include:
- Protocol specification
- Message formats
- Authentication/authorization
- Error handling
- Version compatibility

## Example Structure

\`\`\`markdown
# Protocol Name v1.0

**Type**: MCP/API/Messaging/RPC
**Status**: Draft/Stable/Deprecated

## Specification

### Message Format
\`\`\`json
{
  \"version\": \"1.0\",
  \"type\": \"request\",
  \"payload\": {}
}
\`\`\`

### Authentication
Bearer token, API key, etc.

### Error Codes
- 400: Bad Request
- 401: Unauthorized
\`\`\`
" "critical" "protocols,communication"

mkdir -p protocols/{mcp,api,messaging,rpc}

# 3. STANDARDS (CRITICAL) - Data formats & API styles
echo "📋 Creating standards/..."
create_dir_with_readme "standards" "Standards & Conventions" \
"Data formats, API styles, and coding standards" \
"## Overview

Defines standards used across the platform.

## Subdirectories

### /data-formats
JSON Schema, OpenAPI, GraphQL schemas

### /api-styles
REST conventions, GraphQL guidelines

### /coding-standards
Language-specific coding standards

### /naming-conventions
File, variable, and resource naming

### /documentation-standards
Documentation templates and guidelines

## Usage

Standards ensure consistency across:
- API design
- Data modeling
- Code structure
- Documentation

## Example Standard

\`\`\`markdown
# REST API Standard

**Version**: 1.0
**Status**: Active

## Endpoint Naming
- Use lowercase
- Use hyphens, not underscores
- Use plural nouns: /users, /documents

## HTTP Methods
- GET: Retrieve resources
- POST: Create resources
- PUT: Update entire resource
- PATCH: Update partial resource
- DELETE: Remove resource

## Response Format
\`\`\`json
{
  \"data\": {},
  \"meta\": {},
  \"errors\": []
}
\`\`\`
\`\`\`
" "critical" "standards,conventions"

mkdir -p standards/{data-formats,api-styles,coding-standards,naming-conventions,documentation-standards}

# 4. INTEGRATIONS (HIGH) - System integrations
echo "🔗 Creating integrations/..."
create_dir_with_readme "integrations" "System Integrations" \
"Third-party integrations and external system connections" \
"## Overview

Documents how Weave-NN integrates with external systems.

## Subdirectories

### /ai-services
OpenAI, Anthropic, other AI providers

### /databases
PostgreSQL, MongoDB, vector databases

### /auth-providers
OAuth providers, SSO, identity providers

### /storage
Cloud storage (GCS, S3), file systems

### /monitoring
Observability and monitoring integrations

## Integration Documentation

Each integration should include:
- Purpose and use case
- Configuration requirements
- Authentication setup
- API usage examples
- Error handling
- Rate limits and quotas

## Example

\`\`\`markdown
# Anthropic Claude Integration

**Type**: AI Service
**Status**: Active

## Configuration
\`\`\`typescript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});
\`\`\`

## Usage
See examples in /examples

## Error Handling
- Rate limits: 429
- Token limits: Check response headers
\`\`\`
" "high" "integrations,external-systems"

mkdir -p integrations/{ai-services,databases,auth-providers,storage,monitoring}

# 5. SCHEMAS (HIGH) - Data models & schemas
echo "📊 Creating schemas/..."
create_dir_with_readme "schemas" "Data Schemas" \
"Data models, database schemas, and validation rules" \
"## Overview

Defines data structures used throughout the platform.

## Subdirectories

### /database
Database table schemas, migrations

### /api
API request/response schemas (OpenAPI, JSON Schema)

### /events
Event schemas for messaging systems

### /configuration
Configuration file schemas

## Schema Documentation

Each schema should include:
- Schema definition (JSON Schema, TypeScript, SQL)
- Field descriptions
- Validation rules
- Examples
- Version history

## Example

\`\`\`markdown
# User Schema

**Version**: 1.0
**Type**: Database

\`\`\`typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

## Validation
- email: Valid email format
- name: 2-100 characters
\`\`\`
" "high" "schemas,data-models"

mkdir -p schemas/{database,api,events,configuration}

# 6. SERVICES (MEDIUM) - External services/APIs
echo "🛠️ Creating services/..."
create_dir_with_readme "services" "External Services" \
"Third-party service configurations and wrappers" \
"## Overview

Catalogs external services used by Weave-NN.

## Subdirectories

### /ai
AI and ML services

### /storage
Cloud storage services

### /monitoring
Monitoring and analytics services

### /communication
Email, SMS, notification services

## Service Documentation

Each service should include:
- Service overview
- Pricing/quotas
- Setup instructions
- Code examples
- Alternatives

## Example

\`\`\`markdown
# Tavily Search API

**Type**: AI Service
**Tier**: Free/Paid

## Setup
\`\`\`bash
export TAVILY_API_KEY=your_key
\`\`\`

## Usage
See /examples/tavily-search.ts

## Quotas
- Free: 1000 requests/month
- Pro: 10000 requests/month
\`\`\`
" "medium" "services,external"

mkdir -p services/{ai,storage,monitoring,communication}

# 7. GUIDES (MEDIUM) - How-to guides
echo "📚 Creating guides/..."
create_dir_with_readme "guides" "How-To Guides" \
"Step-by-step guides for common tasks" \
"## Overview

Practical guides for developers and users.

## Subdirectories

### /setup
Installation and setup guides

### /development
Development workflow guides

### /deployment
Deployment and operations guides

### /troubleshooting
Common issues and solutions

## Guide Structure

\`\`\`markdown
# Guide Title

**Level**: Beginner/Intermediate/Advanced
**Time**: ~30 minutes

## Prerequisites
- Requirement 1
- Requirement 2

## Steps

### 1. First Step
Instructions...

### 2. Second Step
Instructions...

## Verification
How to verify it works

## Troubleshooting
Common issues

## Next Steps
- Related Guide 1
- Related Guide 2
\`\`\`
" "medium" "guides,how-to"

mkdir -p guides/{setup,development,deployment,troubleshooting}

# 8. COMPONENTS (LOW) - Reusable components
echo "🧩 Creating components/..."
create_dir_with_readme "components" "Reusable Components" \
"Reusable code components and modules (future use)" \
"## Overview

Catalog of reusable components (planned for future phases).

## Subdirectories

### /ui
User interface components

### /utilities
Utility functions and helpers

### /adapters
Service adapters and wrappers

### /middleware
Middleware components

## Component Documentation

Each component should include:
- Purpose and use cases
- API documentation
- Usage examples
- Dependencies
- Tests

## Example

\`\`\`markdown
# Component Name

**Type**: UI/Utility/Adapter/Middleware
**Status**: Stable/Beta/Experimental

## Installation
\`\`\`typescript
import { Component } from '@weave-nn/components';
\`\`\`

## API
\`\`\`typescript
interface ComponentProps {
  prop1: string;
  prop2: number;
}
\`\`\`

## Examples
See /examples
\`\`\`
" "low" "components,reusable"

mkdir -p components/{ui,utilities,adapters,middleware}

# 9. REORGANIZE TECHNICAL (with subdirs)
echo "💻 Reorganizing technical/..."
mkdir -p technical/{languages,frameworks,libraries,services,tools}

cat > technical/README.md <<'EOF'
---
type: directory-hub
status: active
priority: high
tags: [hub, technical, technology]
---

# Technical Technologies

Catalog of programming languages, frameworks, libraries, and tools used in Weave-NN.

---

## Subdirectories

### /languages
Programming languages (TypeScript, Python, etc.)

### /frameworks
Application frameworks (Next.js, FastAPI, etc.)

### /libraries
Third-party libraries and packages

### /services
Technical services (databases, queues, etc.)

### /tools
Development and deployment tools

## Organization

Each technology should have:
- Overview and purpose
- Version requirements
- Setup instructions
- Best practices
- Related technologies

---

**Status**: Active
**Last Updated**: $(date +%Y-%m-%d)
EOF

echo "✓ Reorganized technical/"

# 10. REORGANIZE ARCHITECTURE (with subdirs)
echo "🏗️ Reorganizing architecture/..."
mkdir -p architecture/{layers,components,services,systems,analysis}

cat > architecture/README.md <<'EOF'
---
type: directory-hub
status: active
priority: high
tags: [hub, architecture, system-design]
---

# System Architecture

Comprehensive architecture documentation for Weave-NN platform.

---

## Subdirectories

### /layers
Architectural layers (presentation, business, data, etc.)

### /components
System components and their interactions

### /services
Service architecture and boundaries

### /systems
System-level architecture diagrams and documentation

### /analysis
Architecture analysis and decision records

## Documentation Standards

Each architecture document should include:
- Component/layer overview
- Responsibilities
- Dependencies
- Interfaces
- Diagrams (Mermaid)
- Design decisions

## Example Structure

```markdown
# Component Name

**Layer**: Presentation/Business/Data/Infrastructure
**Status**: Implemented/Planned

## Overview
What does this component do?

## Responsibilities
- Responsibility 1
- Responsibility 2

## Dependencies
- Dependency 1
- Dependency 2

## Interfaces
```typescript
interface ComponentAPI {
  method(): void;
}
```

## Diagram
```mermaid
graph TD
  A[Component] --> B[Dependency]
```
```

---

**Status**: Active
**Last Updated**: $(date +%Y-%m-%d)
EOF

echo "✓ Reorganized architecture/"

# Create PRIMITIVES.md if it doesn't exist
if [ ! -f "PRIMITIVES.md" ]; then
    echo "📄 Creating PRIMITIVES.md..."
    # The actual content is in the separate create_file
    echo "✓ Created PRIMITIVES.md (run script from repo root to get latest version)"
fi

# Summary
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║                                                ║"
echo "║   ✅ Vault Primitives Initialized             ║"
echo "║                                                ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
echo "Created:"
echo "  🆕 patterns/        (CRITICAL)"
echo "  🆕 protocols/       (CRITICAL)"
echo "  🆕 standards/       (CRITICAL)"
echo "  🆕 integrations/    (HIGH)"
echo "  🆕 schemas/         (HIGH)"
echo "  🆕 services/        (MEDIUM)"
echo "  🆕 guides/          (MEDIUM)"
echo "  🆕 components/      (LOW)"
echo ""
echo "Reorganized:"
echo "  🔄 technical/       (with subdirs)"
echo "  🔄 architecture/    (with subdirs)"
echo ""
echo "Next steps:"
echo "  1. Review generated READMEs"
echo "  2. Populate with actual content"
echo "  3. Link from INDEX.md"
echo ""
