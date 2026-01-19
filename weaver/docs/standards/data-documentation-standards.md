# Data Format and Documentation Standards

**Version**: 1.0.0
**Last Updated**: 2025-10-29
**Status**: Active
**Owner**: Cultivation System Team

---

## Table of Contents

1. [Overview](#overview)
2. [Data Format Specifications](#data-format-specifications)
3. [Interface Design Guidelines](#interface-design-guidelines)
4. [JSON Schema Patterns](#json-schema-patterns)
5. [Documentation Standards](#documentation-standards)
6. [Frontmatter Metadata Conventions](#frontmatter-metadata-conventions)
7. [Validation Strategies](#validation-strategies)
8. [Examples from Codebase](#examples-from-codebase)

---

## Overview

This document defines the data format and documentation standards for the Weave-NN Vault cultivation system. These standards ensure consistency, type safety, and maintainability across the codebase.

### Key Principles

- **Type Safety First**: All data structures use explicit TypeScript interfaces
- **Validation at Boundaries**: Validate data at system entry points
- **Self-Documenting**: Types and interfaces serve as documentation
- **Consistency**: Follow established patterns across the codebase
- **Extensibility**: Design for future enhancements with optional fields

---

## Data Format Specifications

### 1. Primitive Discovery Format

**Purpose**: Represents discovered primitive nodes from codebase analysis

**Interface**: `PrimitiveDiscovery`

```typescript
export interface PrimitiveDiscovery {
  // Taxonomy categorization (e.g., "schemas/database", "integrations/ai-services")
  category: string;

  // Human-readable name (e.g., "User Schema", "OpenAI Integration")
  name: string;

  // Detailed description of the primitive's purpose
  description: string;

  // Source files where this primitive is implemented
  files: string[];

  // NPM packages or external dependencies (optional)
  dependencies?: string[];

  // Usage context and examples (optional)
  usage?: string;

  // Classification type
  type: 'pattern' | 'protocol' | 'standard' | 'integration' | 'schema' | 'service' | 'guide' | 'component';

  // Priority level for documentation generation
  priority: 'critical' | 'high' | 'medium' | 'low';
}
```

**Field Specifications**:

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `category` | `string` | ✅ | Taxonomy path using forward slashes | `"schemas/database"` |
| `name` | `string` | ✅ | Display name for the primitive | `"User Schema"` |
| `description` | `string` | ✅ | Purpose and functionality | `"User entity with authentication"` |
| `files` | `string[]` | ✅ | File paths (absolute or relative) | `["/lib/db.ts"]` |
| `dependencies` | `string[]` | ❌ | Package names | `["lowdb", "bcryptjs"]` |
| `usage` | `string` | ❌ | Usage examples and context | `"Stores user credentials"` |
| `type` | `union` | ✅ | Primitive classification | `"schema"` |
| `priority` | `union` | ✅ | Documentation priority | `"high"` |

**Validation Rules**:
- `category` must match PRIMITIVES.md taxonomy structure
- `name` must be unique within a category
- `files` must contain at least one entry
- `type` must be one of the defined literal values
- `priority` must be one of the defined literal values

---

### 2. Deep Analysis Result Format

**Purpose**: Aggregated results from deep codebase analysis

**Interface**: `DeepAnalysisResult`

```typescript
export interface DeepAnalysisResult {
  // Discovered primitives
  primitives: PrimitiveDiscovery[];

  // Total count of primitives
  totalCount: number;

  // Distribution by category (e.g., { "schemas/database": 5, "patterns/api-patterns": 3 })
  byCategory: Record<string, number>;

  // Distribution by priority (e.g., { "critical": 10, "high": 15 })
  byPriority: Record<string, number>;
}
```

**Field Specifications**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `primitives` | `PrimitiveDiscovery[]` | ✅ | Array of discovered primitives |
| `totalCount` | `number` | ✅ | Total primitives found (must equal `primitives.length`) |
| `byCategory` | `Record<string, number>` | ✅ | Category-wise breakdown |
| `byPriority` | `Record<string, number>` | ✅ | Priority-wise breakdown |

**Invariants**:
- `totalCount` === `primitives.length`
- Sum of `byCategory` values === `totalCount`
- Sum of `byPriority` values === `totalCount`

---

### 3. Dependency Information Format

**Purpose**: Package dependency metadata for seed generation

**Interface**: `DependencyInfo`

```typescript
export interface DependencyInfo {
  // Package name (e.g., "react", "@radix-ui/react-dialog")
  name: string;

  // Version string (e.g., "18.2.0", "^1.0.0")
  version: string;

  // Dependency classification
  type: 'framework' | 'library' | 'tool' | 'service' | 'language';

  // Taxonomy category
  category: string;

  // Package ecosystem
  ecosystem: 'nodejs' | 'python' | 'php' | 'rust' | 'go' | 'java' | 'ruby' | 'other';

  // Package description (optional)
  description?: string;

  // Documentation URLs (optional)
  documentation?: string[];

  // Repository URL (optional)
  repository?: string;

  // Files/features using this dependency
  usedBy: string[];

  // Related dependencies
  relatedTo: string[];
}
```

**Ecosystem-Specific Patterns**:

| Ecosystem | Name Pattern | Version Pattern | Documentation URL |
|-----------|-------------|-----------------|-------------------|
| `nodejs` | `package-name` or `@scope/package` | Semver (`^1.2.3`) | `https://npmjs.com/package/{name}` |
| `python` | `package-name` | `==1.2.3` or `>=1.2.3` | `https://pypi.org/project/{name}` |
| `php` | `vendor/package` | Semver constraint | `https://packagist.org/packages/{name}` |
| `rust` | `crate-name` | Semver (`1.2.3`) | `https://crates.io/crates/{name}` |
| `go` | `domain.com/org/repo` | `v1.2.3` | `https://pkg.go.dev/{name}` |

---

### 4. Service Information Format

**Purpose**: Service and infrastructure configuration metadata

**Interface**: `ServiceInfo`

```typescript
export interface ServiceInfo {
  // Service name
  name: string;

  // Service classification
  type: 'api' | 'database' | 'queue' | 'cache' | 'storage' | 'compute' | 'monitoring';

  // Technology/platform (e.g., "postgres", "redis", "nginx")
  technology: string;

  // Framework used (optional)
  framework?: string;

  // Programming language (optional)
  language?: string;

  // Service dependencies
  dependencies: string[];

  // API endpoints (optional)
  endpoints?: string[];
}
```

**Type Inference Rules**:

| Keyword in Name/Image | Inferred Type |
|----------------------|---------------|
| `db`, `database`, `postgres`, `mysql`, `mongo` | `database` |
| `cache`, `redis`, `memcache` | `cache` |
| `queue`, `rabbitmq`, `kafka`, `sqs` | `queue` |
| `api`, `backend`, `service` | `api` |
| `storage`, `minio`, `s3` | `storage` |
| `monitor`, `prometheus`, `grafana` | `monitoring` |

---

### 5. Document Metadata Format

**Purpose**: Frontmatter metadata for generated documents

**Interface**: `DocumentMetadata`

```typescript
export interface DocumentMetadata {
  // Document title
  title?: string;

  // Document type (e.g., "primitive", "concept", "feature")
  type?: string;

  // Lifecycle status
  status?: string;

  // Taxonomy tags
  tags?: string[];

  // Creation date (ISO 8601 date only: YYYY-MM-DD)
  created?: string;

  // Last update timestamp (ISO 8601: YYYY-MM-DDTHH:mm:ss.sssZ)
  updated?: string;

  // Development phase (optional)
  phase?: string;

  // Priority level (optional)
  priority?: string;

  // Additional flexible metadata
  [key: string]: any;
}
```

**Standard Fields**:

| Field | Pattern | Example | Notes |
|-------|---------|---------|-------|
| `title` | Title Case | `"User Authentication Schema"` | Human-readable |
| `type` | lowercase | `"primitive"`, `"concept"` | Document classification |
| `status` | lowercase | `"active"`, `"deprecated"` | Lifecycle state |
| `tags` | lowercase kebab-case | `["integration", "ai-service"]` | Searchable keywords |
| `created` | `YYYY-MM-DD` | `"2025-10-29"` | ISO 8601 date only |
| `updated` | ISO 8601 full | `"2025-10-29T12:34:56.789Z"` | Timestamp with timezone |
| `priority` | lowercase | `"critical"`, `"high"` | Importance level |

---

## Interface Design Guidelines

### 1. Naming Conventions

**Interfaces**: PascalCase with descriptive suffixes

```typescript
// ✅ Good
export interface UserProfile { }
export interface ApiResponse<T> { }
export interface DocumentMetadata { }

// ❌ Avoid
export interface user { }
export interface Response { }  // Too generic
export interface Data { }      // Too generic
```

**Type Aliases**: PascalCase

```typescript
// ✅ Good
export type PrimitiveType = 'pattern' | 'protocol' | 'standard';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

// ❌ Avoid
export type primitiveType = string;
export type PRIORITY = string;
```

**Properties**: camelCase

```typescript
// ✅ Good
interface Document {
  createdAt: string;
  updatedAt: string;
  serviceType: string;
}

// ❌ Avoid
interface Document {
  created_at: string;  // snake_case
  UpdatedAt: string;   // PascalCase
}
```

### 2. Optional vs Required Fields

**Guidelines**:
- Core identifying fields → **Required**
- Metadata and context → **Optional**
- Relationships and references → **Optional** unless critical

```typescript
// Example: Balance required vs optional
export interface DependencyInfo {
  // Required: Core identity
  name: string;
  version: string;
  ecosystem: string;

  // Optional: Enhancement data
  description?: string;
  documentation?: string[];
  repository?: string;

  // Required: Relationships (empty array if none)
  usedBy: string[];
  relatedTo: string[];
}
```

### 3. Union Types vs Enums

**Use Union Types** for:
- Simple, flat discriminations
- Values unlikely to change
- Type-level constraints

```typescript
// ✅ Preferred for simple cases
type Status = 'active' | 'deprecated' | 'experimental';
type Priority = 'critical' | 'high' | 'medium' | 'low';
```

**Use Enums** for:
- Complex value sets
- Need for reverse mapping
- Runtime value validation

```typescript
// ✅ When you need runtime access
export enum DocumentType {
  NDA = 'nda',
  MSA = 'msa',
  SOW = 'sow',
  PRIVACY_POLICY = 'privacy-policy'
}

// Usage
const type: DocumentType = DocumentType.NDA;
```

### 4. Generic Interfaces

**Pattern**: Use generics for reusable data structures

```typescript
// ✅ Generic response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

// Usage
type UserResponse = ApiResponse<User>;
type DocumentListResponse = ApiResponse<Document[]>;
```

### 5. Index Signatures

**When to use**: For dynamic key-value structures

```typescript
// ✅ Flexible metadata
export interface DocumentMetadata {
  // Known fields
  title?: string;
  type?: string;

  // Unknown/dynamic fields
  [key: string]: any;
}

// ✅ Typed dynamic keys
export interface CategoryCounts {
  [category: string]: number;
}
```

**Prefer explicit over dynamic** when possible:

```typescript
// ✅ Better (explicit)
export interface Settings {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

// ❌ Worse (too dynamic)
export interface Settings {
  [key: string]: any;
}
```

---

## JSON Schema Patterns

### 1. Response Envelope Pattern

**Standard API Response**:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}
```

**Example JSON**:

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com"
  },
  "metadata": {
    "timestamp": "2025-10-29T12:34:56.789Z",
    "requestId": "req-abc123"
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "field": "email",
    "details": {
      "provided": "invalid-email",
      "expected": "user@domain.com"
    }
  },
  "metadata": {
    "timestamp": "2025-10-29T12:34:56.789Z",
    "requestId": "req-abc123"
  }
}
```

### 2. Paginated Response Pattern

```typescript
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

**Example JSON**:

```json
{
  "items": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "hasNext": true,
  "hasPrevious": false
}
```

### 3. Analysis Result Pattern

**For aggregate analysis data**:

```typescript
export interface AnalysisResult<T> {
  items: T[];
  totalCount: number;
  byCategory: Record<string, number>;
  byPriority?: Record<string, number>;
  metadata?: {
    analysisDate: string;
    version: string;
  };
}
```

### 4. Discovery Pattern

**For codebase discovery**:

```typescript
export interface Discovery {
  category: string;
  name: string;
  description: string;
  files: string[];
  dependencies?: string[];
  usage?: string;
  metadata?: Record<string, any>;
}
```

---

## Documentation Standards

### 1. JSDoc Comments

**Interface Documentation**:

```typescript
/**
 * Represents a discovered primitive node from codebase analysis
 *
 * @interface PrimitiveDiscovery
 * @property {string} category - Taxonomy path (e.g., "schemas/database")
 * @property {string} name - Human-readable primitive name
 * @property {string} description - Detailed description of purpose
 * @property {string[]} files - Source files implementing this primitive
 * @property {string[]} [dependencies] - External package dependencies
 * @property {string} [usage] - Usage examples and context
 * @property {PrimitiveType} type - Classification type
 * @property {Priority} priority - Documentation priority level
 *
 * @example
 * ```typescript
 * const primitive: PrimitiveDiscovery = {
 *   category: "schemas/database",
 *   name: "User Schema",
 *   description: "User entity with authentication",
 *   files: ["/lib/db.ts"],
 *   dependencies: ["lowdb", "bcryptjs"],
 *   type: "schema",
 *   priority: "high"
 * };
 * ```
 */
export interface PrimitiveDiscovery {
  category: string;
  name: string;
  // ...
}
```

**Function Documentation**:

```typescript
/**
 * Analyze codebase and discover primitive nodes
 *
 * Uses claude-flow agents when available, falls back to shallow analysis
 *
 * @returns {Promise<DeepAnalysisResult>} Analysis results with discovered primitives
 * @throws {Error} If analysis fails and fallback is disabled
 *
 * @example
 * ```typescript
 * const analyzer = new DeepAnalyzer(projectRoot, vaultRoot);
 * const result = await analyzer.analyze();
 * console.log(`Found ${result.totalCount} primitives`);
 * ```
 */
async analyze(): Promise<DeepAnalysisResult> {
  // Implementation
}
```

**Property Documentation**:

```typescript
export class DeepAnalyzer {
  /**
   * Root directory of the project being analyzed
   * @private
   */
  private projectRoot: string;

  /**
   * Root directory of the Obsidian vault
   * @private
   */
  private vaultRoot: string;
}
```

### 2. Inline Comments

**When to comment**:

```typescript
// ✅ Good: Explain WHY, not WHAT
// Timeout after 2 minutes to prevent hung processes
const timeoutId = setTimeout(() => controller.abort(), 120000);

// ✅ Good: Document business logic
// Priority mapping: framework dependencies always get "critical" priority
if (nameLower.includes('next') || nameLower.includes('react')) {
  return 'critical';
}

// ❌ Avoid: Stating the obvious
// Set the timeout to 120000
const timeoutId = setTimeout(() => controller.abort(), 120000);
```

**TODO Comments**:

```typescript
// TODO: Integrate OpenAI API for real-time suggestions
// TODO(username): Add support for custom taxonomy paths
// FIXME: Handle circular dependency detection
// HACK: Temporary workaround for issue #123
```

### 3. Markdown Documentation

**Section Headers**:

```markdown
# Top-Level Title (Document Title)

## Major Section

### Subsection

#### Detail Section

**Bold for emphasis**: Not a header
```

**Code Blocks**:

```markdown
**TypeScript Example**:
```typescript
export interface Example {
  field: string;
}
```

**Shell Example**:
```bash
npm install package-name
```
```

**Tables**:

```markdown
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
```

**Lists**:

```markdown
**Ordered List**:
1. First item
2. Second item
3. Third item

**Unordered List**:
- Bullet point
- Another point
  - Nested point
  - Another nested point
```

---

## Frontmatter Metadata Conventions

### 1. Standard YAML Frontmatter

**Basic Structure**:

```yaml
---
title: Document Title
type: primitive
category: schemas/database
status: active
priority: high
tags:
  - schema
  - database
  - authentication
created: 2025-10-29
updated: 2025-10-29T12:34:56.789Z
---
```

### 2. Field Specifications

| Field | Type | Required | Format | Example |
|-------|------|----------|--------|---------|
| `title` | string | ✅ | Title Case | `"User Authentication Schema"` |
| `type` | string | ✅ | lowercase | `"primitive"` |
| `category` | string | ✅ | path/subpath | `"schemas/database"` |
| `status` | string | ✅ | lowercase | `"active"` |
| `priority` | string | ❌ | lowercase | `"high"` |
| `tags` | array | ✅ | lowercase-kebab | `["schema", "user-auth"]` |
| `created` | string | ✅ | YYYY-MM-DD | `"2025-10-29"` |
| `updated` | string | ✅ | ISO 8601 | `"2025-10-29T12:34:56.789Z"` |

### 3. Type-Specific Frontmatter

**Primitive Document**:

```yaml
---
title: User Schema
type: primitive
category: schemas/database
ecosystem: nodejs
version: 1.0.0
status: active
tags:
  - schema
  - database
  - authentication
documentation:
  - https://npmjs.com/package/lowdb
  - https://github.com/example/repo
repository: https://github.com/example/repo
used_by:
  - authentication-service
  - user-profile
created: 2025-10-29
updated: 2025-10-29T12:34:56.789Z
---
```

**Integration Document**:

```yaml
---
title: OpenAI Integration
type: primitive
category: integrations/ai-services
integration_type: ai-service
provider: OpenAI
status: active
priority: high
tags:
  - integration
  - ai
  - llm
api_endpoint: https://api.openai.com/v1
authentication: API Key
created: 2025-10-29
updated: 2025-10-29T12:34:56.789Z
---
```

### 4. Taxonomy Tag Patterns

**Tag Structure**: `category-type-detail`

```yaml
tags:
  # Category tags
  - schema
  - integration
  - pattern

  # Type tags
  - database
  - ai-service
  - api-pattern

  # Technology tags
  - nodejs
  - typescript
  - react

  # Priority tags (optional)
  - priority-critical
  - priority-high

  # Dependency tags
  - lowdb
  - openai
```

---

## Validation Strategies

### 1. TypeScript Compile-Time Validation

**Use strict mode**:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 2. Runtime Validation with Zod (Recommended)

**Schema Definition**:

```typescript
import { z } from 'zod';

const PrimitiveDiscoverySchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  files: z.array(z.string()).min(1),
  dependencies: z.array(z.string()).optional(),
  usage: z.string().optional(),
  type: z.enum(['pattern', 'protocol', 'standard', 'integration', 'schema', 'service', 'guide', 'component']),
  priority: z.enum(['critical', 'high', 'medium', 'low'])
});

// Type inference
type PrimitiveDiscovery = z.infer<typeof PrimitiveDiscoverySchema>;

// Validation
const result = PrimitiveDiscoverySchema.safeParse(data);
if (!result.success) {
  console.error(result.error.errors);
}
```

### 3. Custom Validation Functions

**Category Path Validation**:

```typescript
/**
 * Validate category path against PRIMITIVES.md taxonomy
 */
function validateCategory(category: string): boolean {
  const validCategories = [
    'patterns/api-patterns',
    'patterns/data-patterns',
    'patterns/integration-patterns',
    'protocols/mcp',
    'protocols/api',
    'standards/data-formats',
    'standards/api-styles',
    'integrations/ai-services',
    'integrations/databases',
    'schemas/database',
    'schemas/api',
    'services/ai',
    'services/storage',
    'guides/setup',
    'guides/development',
    'components/ui',
    'components/utilities'
  ];

  return validCategories.includes(category);
}
```

**Date Format Validation**:

```typescript
/**
 * Validate ISO 8601 date format
 */
function validateISODate(dateString: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso8601Regex.test(dateString)) return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validate ISO 8601 timestamp format
 */
function validateISOTimestamp(timestamp: string): boolean {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (!iso8601Regex.test(timestamp)) return false;

  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}
```

### 4. Boundary Validation

**API Entry Points**:

```typescript
// Validate at API boundaries
export async function createPrimitive(
  req: Request
): Promise<ApiResponse<PrimitiveDiscovery>> {
  try {
    const data = await req.json();

    // Validate with Zod schema
    const validated = PrimitiveDiscoverySchema.parse(data);

    // Additional business logic validation
    if (!validateCategory(validated.category)) {
      return {
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: `Category "${validated.category}" not in taxonomy`
        }
      };
    }

    // Process validated data
    const result = await processPrimitive(validated);

    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    };
  }
}
```

---

## Examples from Codebase

### Example 1: PrimitiveDiscovery Usage

**From `deep-analyzer.ts`**:

```typescript
const primitives: PrimitiveDiscovery[] = [];

// Add dependency as integration
primitives.push({
  category: this.inferCategory(name),
  name: this.formatName(name),
  description: `${name} package integration`,
  files: ['package.json'],
  dependencies: [name],
  type: this.inferType(name),
  priority: this.inferPriority(name)
});
```

### Example 2: DeepAnalysisResult Construction

**From `deep-analyzer.ts`**:

```typescript
private parseAgentResponse(response: any): DeepAnalysisResult {
  const primitives: PrimitiveDiscovery[] = response.primitives || [];

  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  for (const prim of primitives) {
    // Count by category
    byCategory[prim.category] = (byCategory[prim.category] || 0) + 1;

    // Count by priority
    byPriority[prim.priority] = (byPriority[prim.priority] || 0) + 1;
  }

  return {
    primitives,
    totalCount: primitives.length,
    byCategory,
    byPriority
  };
}
```

### Example 3: DocumentMetadata Generation

**From `seed-generator.ts`**:

```typescript
const frontmatter: DocumentMetadata = {
  title,
  type: 'primitive',
  category: framework.category,
  ecosystem: framework.ecosystem,
  version: framework.version,
  status: 'active',
  tags: ['framework', framework.ecosystem, framework.category],
  documentation: framework.documentation,
  repository: framework.repository,
  used_by: framework.usedBy,
  created: new Date().toISOString().split('T')[0],
  updated: new Date().toISOString()
};
```

### Example 4: DependencyInfo Construction

**From `seed-generator.ts`**:

```typescript
const dep: DependencyInfo = {
  name,
  version: version as string,
  type: this.inferDependencyType(name),
  category: this.inferCategory(name),
  ecosystem: 'nodejs',
  documentation: this.getDocumentationLinks(name, 'nodejs'),
  repository: this.getRepositoryUrl(name, 'nodejs'),
  usedBy: [],
  relatedTo: []
};

analysis.dependencies.push(dep);
```

### Example 5: ServiceInfo from Docker Compose

**From `seed-generator.ts`**:

```typescript
const service: ServiceInfo = {
  name: serviceName,
  type: this.inferServiceType(serviceName, imageMatch?.[1]),
  technology: imageMatch?.[1]?.split(':')[0] || 'unknown',
  dependencies: []
};

analysis.services.push(service);
```

### Example 6: Legal Docs App Mapping

**From `/docs/legal-docs-app-primitives-mapping.json`**:

This JSON file demonstrates a comprehensive primitive discovery output following the standards:

```json
{
  "primitives_mapping": {
    "🔴_CRITICAL": {
      "patterns": [
        {
          "category": "patterns/api-patterns",
          "name": "RESTful CRUD Pattern",
          "description": "Consistent REST API pattern across all entities",
          "files": [
            "/app/api/auth/login/route.ts",
            "/app/api/companies/route.ts"
          ],
          "dependencies": ["next@16.0.1", "@/lib/db"],
          "usage": "All API routes follow Next.js App Router pattern",
          "implementation_details": {
            "response_format": "{ success: boolean, data?: T }",
            "authentication": "Cookie-based session",
            "error_handling": "Try-catch with status codes"
          }
        }
      ]
    }
  }
}
```

This demonstrates:
- ✅ Proper category taxonomy (`patterns/api-patterns`)
- ✅ Clear, descriptive name
- ✅ Detailed description
- ✅ File paths array
- ✅ Dependencies list
- ✅ Usage context
- ✅ Additional metadata in `implementation_details`

---

## Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-10-29 | Initial standards document | Analyst Agent |

---

## References

### Internal Documentation
- `/weaver/src/cultivation/deep-analyzer.ts`
- `/weaver/src/cultivation/seed-generator.ts`
- `/weaver/src/cultivation/seed-enhancer.ts`
- `/weaver/src/cultivation/types.ts`
- `/weave-nn/PRIMITIVES.md`
- `/docs/legal-docs-app-primitives-mapping.json`

### External Standards
- [TypeScript Handbook - Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [JSON Schema](https://json-schema.org/)
- [ISO 8601 Date/Time Format](https://www.iso.org/iso-8601-date-and-time-format.html)
- [Semantic Versioning](https://semver.org/)
- [YAML 1.2 Specification](https://yaml.org/spec/1.2/spec.html)

---

**Document Status**: ✅ Complete
**Next Review**: 2025-11-29
**Maintained By**: Cultivation System Team
