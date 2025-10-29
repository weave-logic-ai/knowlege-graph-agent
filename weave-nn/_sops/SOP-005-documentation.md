---
sop_id: SOP-005
sop_name: Documentation Generation Workflow
category: documentation
version: 1.0.0
status: active
triggers:
  - weaver sop docs generate <path>
  - weaver docs create <type>
learning_enabled: true
estimated_duration: 20-40 minutes
complexity: low
type: sop
visual:
  icon: "\U0001F4DD"
  color: '#84CC16'
  cssclasses:
    - type-sop
    - status-active
updated_date: '2025-10-28'
---

# SOP-005: Documentation Generation Workflow

## Overview

The Documentation Generation Workflow automates the creation of comprehensive, accurate, and maintainable documentation from source code, APIs, and system architecture. This SOP coordinates specialized agents to analyze code, extract meaningful information, generate formatted documentation, and ensure consistency across all documentation artifacts.

This workflow eliminates manual documentation toil by automatically generating API references, user guides, and architecture documentation directly from source code and system metadata. The learning loop captures documentation patterns that resonate with users and continuously improves documentation quality.

By following this SOP, teams achieve up-to-date documentation that stays synchronized with code changes, comprehensive coverage of all features, and consistent formatting that enhances developer experience.

## Prerequisites

- Weaver CLI with shadow cache initialized
- Source code access and read permissions
- Documentation template directory
- Markdown processor installed
- Git access for committing docs

## Inputs

### Required
- **Source Path**: Directory or file to document (e.g., `/src/api`, `/src/services`)
- **Doc Type**: api | user | architecture | reference | guide

### Optional
- **Output Path**: Where to save documentation (default: `/docs`)
- **Template**: Documentation template to use
- **Include Examples**: Whether to generate code examples
- **API Version**: For versioned API documentation
- **Target Audience**: developer | end-user | operator

## Agent Coordination

This SOP spawns **3 specialized agents** in parallel:

### 1. Researcher Agent
**Role**: Gather context and analyze code structure
- Read source files and extract metadata
- Identify public APIs and interfaces
- Extract JSDoc/docstrings/comments
- Find usage examples in tests
- Analyze code dependencies and relationships

### 2. Documenter Agent
**Role**: Write comprehensive documentation
- Generate API reference documentation
- Create usage examples and tutorials
- Write conceptual overviews
- Format documentation in markdown
- Add diagrams and visualizations

### 3. Reviewer Agent
**Role**: Quality assurance for documentation
- Verify accuracy of technical details
- Check for completeness and clarity
- Validate code examples compile/run
- Review formatting and style consistency
- Ensure proper linking and navigation

## MCP Tools Used

### Code Analysis (via Weaver Shadow Cache)
No specific MCP tools needed - Weaver's built-in capabilities handle code analysis:
- Shadow cache for instant code access
- AST parsing for API extraction
- Dependency graph analysis

### Quality Assessment
```typescript
mcp__claude-flow__quality_assess({
  target: "documentation",
  criteria: ["completeness", "accuracy", "clarity"]
})
```
**Purpose**: Validate documentation quality before publishing.

### Memory Storage
```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "docs/patterns/" + docType,
  namespace: "documentation",
  value: JSON.stringify({
    template: selectedTemplate,
    structure: documentStructure,
    examples: examplePatterns
  })
})
```
**Purpose**: Store successful documentation patterns for reuse.

## Weaver Integration

### Shadow Cache Code Analysis
Weaver's shadow cache provides instant access to:
- All source files with indexed metadata
- Function signatures and type definitions
- JSDoc/docstring comments
- Import/export relationships
- Test files with usage examples

```typescript
// Weaver automatically:
weaver analyze /src/api
// Returns:
// - All exported functions
// - Type signatures
// - Comments and annotations
// - Usage examples from tests
```

### Documentation Structure
Generated docs follow standard layout:

```
/docs/
  api/
    [module-name]/
      index.md          # Module overview
      functions.md      # Function reference
      types.md          # Type definitions
      examples.md       # Code examples
  guides/
    getting-started.md
    advanced-usage.md
  architecture/
    overview.md
    components.md
    data-flow.md
```

### Git Integration
```bash
# Weaver commits documentation
weaver git commit "docs: Generate API reference for user service"
```

## Execution Steps

### Step 1: Initialize Documentation Generation
```bash
# User initiates docs generation
weaver sop docs generate /src/api/users --type api

# Weaver setup
npx claude-flow hooks pre-task --description "Generate API docs for users"
```

### Step 2: Code Analysis (Researcher Agent)
```typescript
Task("Researcher", `
  Analyze /src/api/users for API documentation generation.

  Tasks:
  1. Read all files in /src/api/users directory
  2. Extract exported functions and classes
  3. Parse JSDoc comments and type annotations
  4. Find usage examples in /tests directory
  5. Identify dependencies and relationships
  6. Extract configuration and constants

  Analysis focus:
  - Public API surface (exported items only)
  - Function signatures with parameter types
  - Return types and possible errors
  - Authentication/authorization requirements
  - Rate limits and constraints

  Commands:
  weaver read /src/api/users/*.ts
  weaver read /tests/api/users/*.test.ts
  weaver analyze /src/api/users --output-format json

  Extraction:
  For each function/class:
  - Name and signature
  - Parameters with types and descriptions
  - Return type and description
  - Throws/errors
  - Examples from tests
  - Related functions

  Output to memory:
  key: "swarm/researcher/api-analysis"
  value: {
    module: "users",
    exports: [
      {
        name: "createUser",
        signature: "(data: CreateUserInput) => Promise<User>",
        description: "Creates a new user account",
        params: [{name: "data", type: "CreateUserInput", desc: "User data"}],
        returns: {type: "Promise<User>", desc: "Created user object"},
        throws: ["ValidationError", "DuplicateEmailError"],
        examples: ["from tests/api/users/create.test.ts"]
      }
    ],
    types: ["User", "CreateUserInput", "UpdateUserInput"],
    totalFunctions: 12
  }

  Hooks:
  npx claude-flow hooks post-task --task-id "api-analysis-users"
`, "researcher")
```

### Step 3: Generate Documentation (Documenter Agent)
```typescript
Task("Documenter", `
  Generate comprehensive API documentation for users module.

  Input from memory:
  key: "swarm/researcher/api-analysis"

  Tasks:
  1. Create module overview documentation
  2. Generate function reference for all 12 functions
  3. Document all type definitions
  4. Create usage examples
  5. Add authentication and authorization notes
  6. Create navigation and cross-links

  Documentation structure:

  ## Module: Users API

  ### Overview
  The Users API provides endpoints for managing user accounts,
  including creation, updates, authentication, and profile management.

  ### Functions

  #### createUser
  Creates a new user account with the provided data.

  **Signature**
  \`\`\`typescript
  function createUser(data: CreateUserInput): Promise<User>
  \`\`\`

  **Parameters**
  - \`data\` (CreateUserInput): User registration data
    - \`email\` (string): User email address
    - \`password\` (string): User password (min 8 chars)
    - \`name\` (string): User full name

  **Returns**
  - \`Promise<User>\`: Created user object with generated ID

  **Throws**
  - \`ValidationError\`: Invalid input data
  - \`DuplicateEmailError\`: Email already registered

  **Example**
  \`\`\`typescript
  const user = await createUser({
    email: "user@example.com",
    password: "securepass123",
    name: "John Doe"
  })
  console.log(user.id) // Generated UUID
  \`\`\`

  **Authentication**
  Requires: Admin role or public registration enabled

  **Rate Limit**
  10 requests per minute per IP

  ---

  [Repeat for all 12 functions]

  ### Type Definitions

  #### User
  \`\`\`typescript
  interface User {
    id: string
    email: string
    name: string
    createdAt: Date
    updatedAt: Date
  }
  \`\`\`

  [Document all types]

  Files to create:
  /docs/api/users/index.md
  /docs/api/users/functions.md
  /docs/api/users/types.md
  /docs/api/users/examples.md

  Output to memory:
  key: "swarm/documenter/generated-docs"
  value: {
    filesCreated: 4,
    functionsDocumented: 12,
    typesDocumented: 8,
    examplesIncluded: 12
  }

  Hooks:
  npx claude-flow hooks post-edit --file "index.md"
`, "documenter")
```

### Step 4: Quality Review (Reviewer Agent)
```typescript
Task("Reviewer", `
  Review generated API documentation for accuracy and completeness.

  Input from memory:
  key: "swarm/documenter/generated-docs"

  Tasks:
  1. Verify function signatures match source code
  2. Check all parameters documented
  3. Validate code examples compile
  4. Review formatting consistency
  5. Check internal linking works
  6. Verify completeness (all public APIs documented)

  Validation checklist:
  ✓ All 12 functions documented
  ✓ All 8 types documented
  ✓ All examples syntactically valid
  ✓ Cross-references working
  ✓ Markdown formatting correct
  ✓ Navigation links functional
  ✓ No broken links
  ✓ Consistent style

  Commands:
  # Validate TypeScript examples
  npx tsc --noEmit docs/api/users/examples.md

  # Check markdown formatting
  npx markdownlint docs/api/users/

  # Verify links
  npx markdown-link-check docs/api/users/index.md

  Quality assessment:
  mcp__claude-flow__quality_assess({
    target: "documentation",
    criteria: ["completeness", "accuracy", "clarity"]
  })

  Issues found: 0
  Quality score: 95/100

  Output to memory:
  key: "swarm/reviewer/validation"
  value: {
    validated: true,
    issues: 0,
    qualityScore: 95,
    readyToPublish: true
  }
`, "reviewer")
```

### Step 5: Generate Navigation and Index
```bash
# Weaver creates doc index
weaver docs index generate

# Creates /docs/index.md with:
# - Table of contents
# - Search functionality
# - Module navigation
# - Quick links
```

### Step 6: Commit Documentation
```bash
weaver git commit "docs: Generate API reference for users module

- Added comprehensive function reference
- Documented all types and interfaces
- Included 12 usage examples
- Added authentication and rate limit notes

Generated by: SOP-005 Documentation Workflow"
```

### Step 7: Store Learning Data
```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "docs/generation/users-api",
  namespace: "learning",
  value: JSON.stringify({
    module: "users",
    docType: "api",
    functionsDocumented: 12,
    typesDocumented: 8,
    examplesCreated: 12,
    timeToGenerate: "24 minutes",
    qualityScore: 95,
    template: "api-reference-standard",
    agentsUsed: ["researcher", "documenter", "reviewer"]
  }),
  ttl: 7776000 // 90 days
})
```

## Output Artifacts

### 1. Module Overview (`/docs/api/users/index.md`)
High-level overview of the module with:
- Purpose and capabilities
- Quick start guide
- Authentication requirements
- Common use cases
- Links to detailed references

### 2. Function Reference (`/docs/api/users/functions.md`)
Comprehensive reference for all functions:
- Function signatures
- Parameter documentation
- Return types
- Error conditions
- Code examples
- Authentication requirements
- Rate limits

### 3. Type Definitions (`/docs/api/users/types.md`)
Complete type documentation:
- Interface definitions
- Type aliases
- Enums and constants
- Type relationships
- Validation rules

### 4. Examples (`/docs/api/users/examples.md`)
Practical usage examples:
- Common use cases
- Complete working examples
- Error handling patterns
- Best practices
- Integration examples

### 5. Documentation Index (`/docs/index.md`)
Navigable table of contents with search.

## Success Criteria

✅ **Complete Coverage**: All public APIs documented
✅ **Accurate Information**: Signatures match source code
✅ **Working Examples**: All code examples compile and run
✅ **Consistent Formatting**: Follows documentation style guide
✅ **Proper Navigation**: All internal links working
✅ **Quality Score**: ≥ 90 on quality assessment
✅ **Committed to Git**: Documentation versioned with code

## Learning Capture

### Documentation Patterns

```typescript
// Capture successful documentation structures
mcp__claude-flow__memory_usage({
  action: "store",
  key: "docs/patterns/api-reference",
  namespace: "templates",
  value: JSON.stringify({
    structure: [
      "Overview",
      "Quick Start",
      "Function Reference",
      "Types",
      "Examples"
    ],
    exampleFormat: "typescript-with-output",
    sectionOrder: "most-common-first",
    detailLevel: "comprehensive"
  })
})
```

### User Feedback Integration

```typescript
// Track which documentation sections are most viewed
mcp__claude-flow__memory_usage({
  action: "store",
  key: "docs/analytics/users-api",
  value: JSON.stringify({
    mostViewedSection: "examples",
    avgTimeOnPage: "4:32",
    searchTerms: ["authentication", "create user", "error handling"],
    userFeedback: "positive"
  })
})
```

## Related SOPs

- **SOP-001**: Feature Planning (plan documentation as part of features)
- **SOP-002**: Phase Planning (document phase deliverables)
- **SOP-007**: Code Review (review documentation with code)

## Examples

### Example 1: API Documentation

```bash
weaver sop docs generate /src/api/users --type api

# Output:
- Functions documented: 12
- Types documented: 8
- Examples created: 12
- Time: 24 minutes
- Quality score: 95/100
```

### Example 2: Architecture Documentation

```bash
weaver docs create architecture

# Output:
- System overview: Complete
- Component diagrams: 5 generated
- Data flow diagrams: 3 generated
- Time: 38 minutes
- Includes: C4 model diagrams
```

### Example 3: User Guide

```bash
weaver sop docs generate /src --type user

# Output:
- Getting started guide: Complete
- Feature tutorials: 8 sections
- Troubleshooting: 12 common issues
- Screenshots: 15 included
- Time: 42 minutes
```

---

**Version History**
- 1.0.0 (2025-10-27): Initial SOP for automated documentation generation
