# Documentation Architecture Plan

**Version**: 1.0.0
**Created**: 2025-12-29
**Status**: Implementing

## Overview

This document defines the documentation architecture for `@weavelogic/knowledge-graph-agent`, modeled after open-source best practices from Docker, PHP, and GitHub community standards.

## Guiding Principles

1. **Task-Oriented Navigation** - Organize by what users want to accomplish, not by implementation details
2. **Progressive Disclosure** - Start simple, provide depth for those who need it
3. **Consistent Structure** - Same format across all document types
4. **Discoverability** - Clear navigation, proper cross-linking
5. **Separation of Concerns** - Tutorials vs Reference vs Architecture

## Directory Structure

```
docs/
├── README.md                    # Documentation home/index
├── getting-started/             # ONBOARDING
│   ├── installation.md         # All installation methods
│   ├── quick-start.md          # 5-minute getting started
│   └── configuration.md        # Initial configuration
│
├── guides/                      # HOW-TO GUIDES (Task-oriented)
│   ├── cultivation.md          # Codebase analysis & seed generation
│   ├── knowledge-graph.md      # Building and managing knowledge graphs
│   ├── agents.md               # Working with the multi-agent system
│   ├── mcp-server.md           # MCP server setup and usage
│   ├── graphql-api.md          # GraphQL queries and subscriptions
│   ├── dashboard.md            # Web dashboard usage
│   ├── plugins.md              # Plugin development and usage
│   ├── workflows.md            # Workflow engine usage
│   └── enterprise/             # Enterprise features
│       ├── chunking.md         # Document chunking strategies
│       ├── backup-recovery.md  # Backup and disaster recovery
│       ├── caching.md          # Cache configuration
│       └── health-monitoring.md # Health checks and alerts
│
├── reference/                   # API REFERENCE (Exhaustive)
│   ├── api/                    # Programmatic APIs
│   │   ├── index.md            # API overview
│   │   ├── core.md             # Core module API
│   │   ├── agents.md           # Agent system API
│   │   ├── graph.md            # Graph operations API
│   │   ├── plugins.md          # Plugin API
│   │   └── events.md           # Event system API
│   ├── cli/                    # Command-line reference
│   │   └── commands.md         # All CLI commands
│   ├── mcp/                    # MCP tools reference
│   │   └── tools.md            # All 30+ MCP tools
│   ├── graphql/                # GraphQL schema
│   │   ├── schema.md           # Full schema reference
│   │   ├── queries.md          # Query reference
│   │   ├── mutations.md        # Mutation reference
│   │   └── subscriptions.md    # Subscription reference
│   └── configuration/          # Configuration reference
│       └── options.md          # All config options
│
├── architecture/                # TECHNICAL ARCHITECTURE
│   ├── overview.md             # System architecture overview
│   ├── decisions/              # Architecture Decision Records
│   │   ├── README.md           # ADR index
│   │   ├── ADR-001-mcp-tool-execution.md
│   │   ├── ADR-002-agent-system-design.md
│   │   ├── ADR-003-knowledge-graph-schema.md
│   │   ├── ADR-004-vector-search-strategy.md
│   │   ├── ADR-005-learning-loop-design.md
│   │   └── ... (migrated specs)
│   ├── integrations/           # Integration architecture
│   │   ├── claude-flow.md      # Claude-flow integration
│   │   ├── ruvector.md         # RuVector semantic search
│   │   ├── exochain.md         # Exochain audit trail
│   │   └── agentic-flow.md     # Agentic-flow framework
│   └── diagrams/               # Architecture diagrams
│       ├── system-overview.md  # C4 system context
│       └── data-flow.md        # Data flow diagrams
│
├── contributing/                # CONTRIBUTOR DOCS
│   ├── CONTRIBUTING.md         # Contribution guide
│   ├── development.md          # Development environment
│   ├── testing.md              # Testing guide
│   ├── code-style.md           # Code style guide
│   └── release-process.md      # Release procedures
│
└── changelog/                   # VERSION HISTORY
    └── CHANGELOG.md            # Version changelog
```

## Document Types & Templates

### 1. Tutorial/Guide Documents

**Purpose**: Task-oriented, teach users how to accomplish goals

**Template**:
```markdown
# [Task Name]

## Overview
Brief description of what this guide covers.

## Prerequisites
- Requirement 1
- Requirement 2

## Steps

### Step 1: [Action]
Explanation and code example.

### Step 2: [Action]
...

## Examples

### Example 1: [Use Case]
```code
...
```

## Troubleshooting
Common issues and solutions.

## Next Steps
Links to related guides.
```

### 2. API Reference Documents

**Purpose**: Exhaustive, searchable reference for all APIs

**Template**:
```markdown
# [Module Name] API

## Overview
Brief description.

## Classes

### ClassName
Description.

**Constructor**
```typescript
new ClassName(options: ClassOptions)
```

**Parameters**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| options | ClassOptions | Yes | Configuration options |

**Methods**

#### methodName(param: Type): ReturnType
Description.

**Example**
```typescript
...
```

## Types

### TypeName
```typescript
interface TypeName {
  field: string;
}
```
```

### 3. Architecture Decision Records (ADRs)

**Purpose**: Document significant architectural decisions with context and rationale

**Template**:
```markdown
# ADR-XXX: [Title]

**Status**: [Proposed | Accepted | Deprecated | Superseded]
**Date**: YYYY-MM-DD
**Supersedes**: ADR-XXX (if applicable)

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing?

## Rationale
Why was this decision made? What alternatives were considered?

## Consequences
What becomes easier or harder as a result of this change?

## Implementation
### Components
- Component 1: Purpose
- Component 2: Purpose

### Code Examples
```typescript
...
```

### Performance Targets
- Target 1: metric
- Target 2: metric

## References
- Link to research
- Link to related ADRs
```

## Migration Plan

### Phase 1: Create Directory Structure
Create all directories per the new structure.

### Phase 2: Migrate Existing Docs
| Current Location | New Location | Action |
|------------------|--------------|--------|
| docs/ARCHITECTURE.md | docs/architecture/overview.md | Move |
| docs/CLI-COMMANDS-REFERENCE.md | docs/reference/cli/commands.md | Move |
| docs/MCP-TOOLS-REFERENCE.md | docs/reference/mcp/tools.md | Move |
| docs/API.md | docs/reference/api/index.md | Move |
| docs/CONTRIBUTING.md | docs/contributing/CONTRIBUTING.md | Move |
| docs/features/SPEC-001-*.md | docs/architecture/decisions/ADR-001-*.md | Convert |
| docs/features/SPEC-002-*.md | docs/architecture/decisions/ADR-002-*.md | Convert |
| docs/features/SPEC-003-*.md | docs/architecture/decisions/ADR-003-*.md | Convert |
| docs/features/SPEC-004-*.md | docs/architecture/decisions/ADR-004-*.md | Convert |
| docs/features/SPEC-005-*.md | docs/architecture/decisions/ADR-005-*.md | Convert |
| docs/features/GAP-ANALYSIS.md | docs/architecture/decisions/GAP-ANALYSIS.md | Move |
| docs/features/RESEARCH-*.md | docs/architecture/decisions/RESEARCH-*.md | Move |
| docs/EXOCHAIN-AUDIT-USAGE.md | docs/guides/enterprise/exochain-audit.md | Move |
| docs/RUVECTOR-USAGE.md | docs/guides/enterprise/ruvector-search.md | Move |

### Phase 3: Create New Guides
1. `getting-started/installation.md` - Extract from README
2. `getting-started/quick-start.md` - Extract from README
3. `getting-started/configuration.md` - Create new
4. `guides/cultivation.md` - Consolidate cultivation docs
5. `guides/knowledge-graph.md` - Create new
6. `guides/agents.md` - Create from agent API docs

### Phase 4: Update Cross-Links
Update all internal links to reflect new structure.

### Phase 5: Update README.md
- Simplify to be an entry point
- Add documentation navigation
- Remove duplicated content (point to guides instead)

## Standards

### File Naming
- Use `kebab-case` for all filenames
- Use `.md` extension
- Prefix ADRs with `ADR-XXX-`

### Frontmatter
All documents should include YAML frontmatter:
```yaml
---
title: Document Title
description: Brief description for SEO
category: getting-started | guides | reference | architecture | contributing
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

### Code Examples
- All code examples must be syntactically valid
- Include language identifier in code fences
- Prefer TypeScript over JavaScript
- Include import statements where relevant

### Cross-Linking
- Use relative links for internal documentation
- Format: `[Link Text](../path/to/file.md)`
- Always verify links during PR review

## Maintenance

### Regular Reviews
- Monthly: Check for broken links
- Quarterly: Review for outdated content
- Major Release: Full documentation audit

### Ownership
Each document section has designated maintainers:
- getting-started/: Core team
- guides/: Feature owners
- reference/: API developers
- architecture/: Tech leads
- contributing/: Community team
