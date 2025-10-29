---
type: index
title: Standards Hub
status: active
created_date: '2025-10-23'
cssclasses:
  - index
  - navigation
  - standards
tags:
  - index
  - standards
  - navigation
  - conventions
scope: system
priority: high
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-index
    - status-active
    - priority-high
  graph_group: navigation
version: '3.0'
updated_date: '2025-10-28'
---

# Standards Directory

> **Formal specifications for data formats, APIs, markup, and conventions**

## What IS a Standard?

A **standard** is a **formal specification** that defines:
- **Data formats** and serialization rules
- **API contracts** and interface specifications
- **Markup syntax** and document structure
- **Conventions** for naming and organization

Standards are **prescriptive specifications** published by standardization bodies (W3C, IETF, IANA) or widely adopted by industry consensus.

### Core Characteristics

1. **Specification-Focused**: Defines "what" and "how" for formats/interfaces
2. **Interoperability**: Enables systems to exchange data consistently
3. **Vendor-Neutral**: Not tied to specific implementations
4. **Versioned**: Has explicit version numbers (JSON 5, OpenAPI 3.0)
5. **Published**: Documented by standardization bodies or community

### Standard vs Protocol vs Pattern

| Aspect | Standard | Protocol | Pattern |
|--------|----------|----------|---------|
| **Nature** | Data format/interface spec | Communication rules | Design approach |
| **Purpose** | Define structure | Define behavior | Solve problem |
| **Example** | JSON, OpenAPI | HTTP, WebSocket | Singleton, MVC |
| **Location** | `/standards/` | `/protocols/` | `/patterns/` |

**Key Distinction**:
- **Standard**: "JSON uses UTF-8 encoding and these syntax rules"
- **Protocol**: "HTTP uses request/response with these methods"
- **Pattern**: "Observer pattern decouples subjects from observers"

### Standard vs Technical Implementation

| Aspect | Standard | Technical |
|--------|----------|-----------|
| **Abstraction** | Specification | Implementation |
| **Vendor** | Neutral | Specific |
| **Example** | REST (architectural style) | FastAPI (Python framework) |
| **Example** | JSON (data format) | `json` module (Python library) |
| **Location** | `/standards/` | `/technical/` |

## Directory Structure

```
/standards/
├── README.md (this file)
├── api/                    # API specifications
│   ├── rest.md            # REST architectural style
│   ├── openapi.md         # OpenAPI Specification
│   ├── graphql.md         # GraphQL specification
│   └── json-rpc.md        # JSON-RPC standard
├── data-formats/          # Data serialization formats
│   ├── json.md            # JSON specification
│   ├── yaml.md            # YAML specification
│   ├── xml.md             # XML specification
│   ├── toml.md            # TOML specification
│   ├── csv.md             # CSV format
│   └── protobuf.md        # Protocol Buffers IDL
├── markup/                # Document markup standards
│   ├── markdown.md        # Markdown specification
│   ├── yaml-frontmatter.md # YAML frontmatter convention
│   ├── wikilinks.md       # Wikilink syntax
│   ├── html.md            # HTML standard
│   └── commonmark.md      # CommonMark spec
└── conventions/           # Naming and style conventions
    ├── semantic-versioning.md # SemVer
    ├── rfc-2119.md        # RFC 2119 keywords
    ├── iso-8601.md        # ISO 8601 datetime
    └── uri-schemes.md     # URI scheme registry
```

## When to CREATE a Standard Document

### ✅ CREATE when:

1. **Formal Specification**: Published by W3C, IETF, ECMA, ISO, IANA
   ```
   ✅ JSON (ECMA-404)
   ✅ HTTP (RFC 7230-7235) → protocol
   ✅ OpenAPI 3.0 (OAS)
   ```

2. **Data Format**: Defines serialization/encoding rules
   ```
   ✅ YAML, TOML, XML, Protobuf
   ```

3. **API Specification**: Defines interface contracts
   ```
   ✅ REST, GraphQL, OpenAPI, JSON Schema
   ```

4. **Markup Syntax**: Defines document structure
   ```
   ✅ Markdown, YAML frontmatter, Wikilinks
   ```

5. **Convention Standard**: Widely adopted naming/versioning
   ```
   ✅ Semantic Versioning, ISO 8601, RFC 2119
   ```

### ❌ DON'T CREATE when:

1. **Protocol Behavior**: Communication rules → `/protocols/`
   ```
   ❌ HTTP, WebSocket, MQTT
   ```

2. **Design Pattern**: Problem-solving approach → `/patterns/`
   ```
   ❌ MVC, Singleton, Observer
   ```

3. **Framework/Library**: Implementation tool → `/technical/`
   ```
   ❌ FastAPI, Express.js, Django
   ```

4. **Architecture**: System design → `/architecture/`
   ```
   ❌ Microservices, Event-Driven, CQRS
   ```

## Document Template

### YAML Frontmatter

```yaml
---
type: standard
category: [api|data-formats|markup|conventions]
title: Standard Name
version: "X.Y"
published_by: [W3C|IETF|ECMA|ISO|Community]
specification_url: https://official-spec-url
status: [Stable|Draft|Deprecated]
related_protocols: []
related_standards: []
implementations: []
tags: [relevant, keywords]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

### Content Structure

```markdown
# Standard Name

> One-line description of the standard

## Overview

**Purpose**: What problem does this standard solve?
**Scope**: What does it specify?
**Standardization Body**: Who publishes/maintains it?

## Specification Details

### Core Concepts
- Key specification elements
- Syntax rules
- Semantic definitions

### Version History
- v1.0: Initial release
- v2.0: Major changes

## Usage Examples

\`\`\`[language]
# Example of standard in use
\`\`\`

## Implementation Considerations

- Conformance requirements
- Common interpretations
- Known variations

## Standardization Bodies

- **Maintainer**: Organization
- **Status**: Active/Deprecated
- **Latest Version**: X.Y.Z

## Related Standards

- [[related-standard-1]]
- [[related-standard-2]]

## References

- [Official Specification](url)
- [RFC/ECMA Document](url)
```

## Examples: Good vs Bad

### ✅ GOOD Examples

```
/standards/api/rest.md
---
type: standard
category: api
title: REST (Representational State Transfer)
published_by: Roy Fielding (Dissertation)
---

/standards/data-formats/json.md
---
type: standard
category: data-formats
title: JSON (JavaScript Object Notation)
version: "ECMA-404"
published_by: ECMA International
---

/standards/markup/yaml-frontmatter.md
---
type: standard
category: markup
title: YAML Frontmatter
published_by: Community Convention
---

/standards/conventions/semantic-versioning.md
---
type: standard
category: conventions
title: Semantic Versioning (SemVer)
version: "2.0.0"
published_by: Tom Preston-Werner
---
```

### ❌ BAD Examples (Wrong Location)

```
❌ /standards/http.md
✅ /protocols/application/http.md
Reason: HTTP is a protocol (communication rules), not just a data format

❌ /standards/fastapi.md
✅ /technical/frameworks/fastapi.md
Reason: FastAPI is an implementation, not a specification

❌ /standards/microservices.md
✅ /architecture/patterns/microservices.md
Reason: Microservices is an architecture pattern, not a format standard

❌ /standards/singleton.md
✅ /patterns/creational/singleton.md
Reason: Singleton is a design pattern, not a data/API standard
```

## Standardization Bodies

### International Standards

- **W3C** (World Wide Web Consortium): HTML, CSS, XML, SOAP
- **IETF** (Internet Engineering Task Force): RFCs for internet standards
- **ECMA International**: ECMAScript, JSON
- **ISO** (International Organization for Standardization): ISO 8601, ISO 639
- **IEEE**: Various technical standards

### Domain-Specific Standards

- **IANA** (Internet Assigned Numbers Authority): Media types, URI schemes
- **OpenAPI Initiative**: OpenAPI Specification
- **GraphQL Foundation**: GraphQL specification
- **OASIS**: MQTT, AMQP specifications

### Community Standards

- **CommonMark**: Markdown specification
- **Semantic Versioning**: SemVer convention
- **JSON Schema**: Schema validation standard

## Migration Guide

### From `/technical/` to `/standards/`

If a document in `/technical/` describes a **specification** (not implementation):

1. **Identify**: Is it a format spec or framework?
   ```
   ✅ yaml-frontmatter.md → specification
   ❌ pydantic.md → implementation framework
   ```

2. **Move**: Transfer to appropriate `/standards/` category
   ```bash
   mv technical/yaml-frontmatter.md standards/markup/yaml-frontmatter.md
   mv technical/wikilinks.md standards/markup/wikilinks.md
   ```

3. **Update Frontmatter**: Change `type: technical` → `type: standard`

4. **Update Links**: Find and replace wikilinks in vault

### Standard vs Technical Checklist

Ask these questions:

1. **Is it a specification or implementation?**
   - Specification → `/standards/`
   - Implementation → `/technical/`

2. **Is it vendor-neutral or vendor-specific?**
   - Neutral → `/standards/`
   - Specific → `/technical/`

3. **Does it define format/interface or provide tools?**
   - Format/interface → `/standards/`
   - Tools/libraries → `/technical/`

## Cross-References

### Related Directories

- [[protocols/README|Protocols]]: Communication rules and message exchange
- [[patterns/README|Patterns]]: Design patterns and best practices
- [[technical/README|Technical]]: Implementation frameworks and tools
- [[architecture/README|Architecture]]: System design patterns

### Standards → Protocols

Standards often define data formats used by protocols:

```
Standard: JSON
  ↓ used by
Protocol: HTTP (JSON as payload)

Standard: OpenAPI 3.0
  ↓ documents
Protocol: REST over HTTP
```

### Standards → Technical

Standards are implemented by technical tools:

```
Standard: JSON (ECMA-404)
  ↓ implemented by
Technical: Python `json` module, `jq` tool

Standard: OpenAPI 3.0
  ↓ implemented by
Technical: FastAPI (Python), Swagger UI
```

## Quick Reference

| Category | Purpose | Examples |
|----------|---------|----------|
| **api/** | API specifications | REST, OpenAPI, GraphQL |
| **data-formats/** | Data serialization | JSON, YAML, XML, TOML |
| **markup/** | Document structure | Markdown, YAML frontmatter, Wikilinks |
| **conventions/** | Naming/versioning | SemVer, ISO 8601, RFC 2119 |

## Contributing Standards

### Before Creating:

1. ✅ Confirm it's a **specification**, not implementation
2. ✅ Check it's **vendor-neutral**
3. ✅ Verify it has **published specification**
4. ✅ Determine correct category (api/data-formats/markup/conventions)

### After Creating:

1. ✅ Add YAML frontmatter with `type: standard`
2. ✅ Link to official specification URL
3. ✅ Note standardization body (W3C, IETF, etc.)
4. ✅ Cross-reference related protocols/technical docs

---

**Remember**: Standards define **WHAT** (format/interface), Protocols define **HOW** (behavior), Technical defines **TOOLS** (implementation).
