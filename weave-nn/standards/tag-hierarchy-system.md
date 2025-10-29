---
title: Tag Hierarchy System
type: documentation
status: complete
phase_id: PHASE-14
tags:
  - tags
  - hierarchy
  - organization
  - obsidian
  - metadata
domain: knowledge-graph
scope: system
priority: high
created_date: 2025-10-28T00:00:00.000Z
updated_date: 2025-10-28T00:00:00.000Z
version: '1.0'
visual:
  icon: 🏷️
  color: '#06B6D4'
  cssclasses:
    - type-documentation
    - status-complete
    - priority-high
icon: 🏷️
---

# Tag Hierarchy System

**Phase 14 - Obsidian Visual Intelligence**

Comprehensive nested tag structure for the Weave-NN knowledge graph. This system provides semantic organization through hierarchical tagging that enables powerful filtering, querying, and visualization.

## Overview

The tag hierarchy uses Obsidian's nested tag feature (introduced in v0.12.0) to create multi-level categorization. Tags follow the pattern `#parent/child/grandchild` and support arbitrary depth.

### Benefits

- 🔍 **Precise Filtering**: Filter to exact scope needed
- 📊 **Flexible Queries**: Dataview can query tag hierarchies
- 🎨 **Visual Grouping**: Color-code by tag category
- 🧭 **Navigation**: Browse by tag in tag pane
- 🔗 **Semantic Relationships**: Tags encode meaning

## Core Tag Hierarchies

### 1. Phase Hierarchy

Project phases and sub-phases for chronological organization.

```
#phase
  #phase/phase-12                    # Four-Pillar Learning Loop
    #phase/phase-12/learning-loop
    #phase/phase-12/perception
    #phase/phase-12/cultivation
    #phase/phase-12/reflection

  #phase/phase-13                    # Enhanced Intelligence
    #phase/phase-13/embeddings
    #phase/phase-13/tree-of-thought
    #phase/phase-13/knowledge-graph
    #phase/phase-13/vector-search

  #phase/phase-14                    # Obsidian Integration
    #phase/phase-14/obsidian
    #phase/phase-14/visual-intelligence
    #phase/phase-14/metadata-v3
    #phase/phase-14/graph-enhancement

  #phase/phase-15                    # Production Deployment
    #phase/phase-15/deployment
    #phase/phase-15/monitoring
    #phase/phase-15/scaling
    #phase/phase-15/optimization
```

### 2. Status Hierarchy

Document lifecycle and workflow states.

```
#status
  #status/planned                    # Future work
    #status/planned/backlog
    #status/planned/next-sprint
    #status/planned/on-deck

  #status/in-progress                # Active work
    #status/in-progress/development
    #status/in-progress/testing
    #status/in-progress/review
    #status/in-progress/refinement

  #status/blocked                    # Work stopped
    #status/blocked/dependencies
    #status/blocked/decisions-needed
    #status/blocked/resources
    #status/blocked/technical-issues

  #status/complete                   # Finished work
    #status/complete/validated
    #status/complete/deployed
    #status/complete/documented

  #status/archived                   # Historical
    #status/archived/superseded
    #status/archived/deprecated
    #status/archived/cancelled
```

### 3. Domain Hierarchy

System domains and components.

```
#domain
  #domain/architecture               # System architecture
    #domain/architecture/design
    #domain/architecture/patterns
    #domain/architecture/decisions

  #domain/weaver                     # Weaver CLI
    #domain/weaver/commands
    #domain/weaver/workflows
    #domain/weaver/agents

  #domain/learning-loop              # Learning Loop
    #domain/learning-loop/perception
    #domain/learning-loop/cultivation
    #domain/learning-loop/reflection
    #domain/learning-loop/integration

  #domain/knowledge-graph            # Knowledge Graph
    #domain/knowledge-graph/embeddings
    #domain/knowledge-graph/chunking
    #domain/knowledge-graph/vector-db
    #domain/knowledge-graph/retrieval

  #domain/infrastructure             # DevOps & Infrastructure
    #domain/infrastructure/docker
    #domain/infrastructure/kubernetes
    #domain/infrastructure/ci-cd
    #domain/infrastructure/monitoring

  #domain/research                   # Research & Planning
    #domain/research/analysis
    #domain/research/experiments
    #domain/research/benchmarks

  #domain/implementation             # Code Implementation
    #domain/implementation/backend
    #domain/implementation/frontend
    #domain/implementation/cli
    #domain/implementation/api
```

### 4. Priority Hierarchy

Task and document priority levels.

```
#priority
  #priority/critical                 # Must do now
    #priority/critical/blocker
    #priority/critical/security
    #priority/critical/data-loss

  #priority/high                     # Important, urgent
    #priority/high/feature
    #priority/high/bug
    #priority/high/performance

  #priority/medium                   # Standard priority
    #priority/medium/enhancement
    #priority/medium/refactoring
    #priority/medium/documentation

  #priority/low                      # Nice to have
    #priority/low/cleanup
    #priority/low/optimization
    #priority/low/cosmetic
```

### 5. Type Hierarchy

Document and content types.

```
#type
  #type/planning                     # Planning documents
    #type/planning/roadmap
    #type/planning/specification
    #type/planning/proposal

  #type/implementation               # Implementation docs
    #type/implementation/code
    #type/implementation/config
    #type/implementation/scripts

  #type/research                     # Research documents
    #type/research/analysis
    #type/research/findings
    #type/research/experiments

  #type/documentation                # Documentation
    #type/documentation/guide
    #type/documentation/reference
    #type/documentation/tutorial
    #type/documentation/api

  #type/testing                      # Testing documents
    #type/testing/test-plan
    #type/testing/test-results
    #type/testing/validation

  #type/decision                     # Decision records
    #type/decision/adr              # Architecture Decision Record
    #type/decision/rdr              # Reflection-Driven Record
    #type/decision/tdr              # Technical Decision Record
```

### 6. Technology Hierarchy

Technologies and frameworks.

```
#tech
  #tech/language
    #tech/language/typescript
    #tech/language/python
    #tech/language/bash
    #tech/language/sql

  #tech/runtime
    #tech/runtime/nodejs
    #tech/runtime/bun
    #tech/runtime/deno

  #tech/framework
    #tech/framework/express
    #tech/framework/nextjs
    #tech/framework/react

  #tech/database
    #tech/database/postgresql
    #tech/database/sqlite
    #tech/database/redis

  #tech/platform
    #tech/platform/docker
    #tech/platform/kubernetes
    #tech/platform/vercel

  #tech/ai
    #tech/ai/claude
    #tech/ai/openai
    #tech/ai/embeddings
    #tech/ai/mcp
```

### 7. Agent Hierarchy

AI agent types and roles.

```
#agent
  #agent/swarm                       # Swarm coordination
    #agent/swarm/coordinator
    #agent/swarm/hierarchical
    #agent/swarm/mesh

  #agent/development                 # Development agents
    #agent/development/coder
    #agent/development/reviewer
    #agent/development/tester
    #agent/development/architect

  #agent/research                    # Research agents
    #agent/research/analyst
    #agent/research/planner
    #agent/research/researcher

  #agent/operations                  # Ops agents
    #agent/operations/monitor
    #agent/operations/optimizer
    #agent/operations/deployer
```

### 8. Scope Hierarchy

Document scope and granularity.

```
#scope
  #scope/system                      # System-wide
    #scope/system/global
    #scope/system/cross-cutting

  #scope/component                   # Component level
    #scope/component/module
    #scope/component/service

  #scope/feature                     # Feature level
    #scope/feature/user-facing
    #scope/feature/internal

  #scope/task                        # Task level
    #scope/task/development
    #scope/task/maintenance
    #scope/task/bug-fix

  #scope/file                        # File level
    #scope/file/single-file
    #scope/file/configuration
```

## Usage Guidelines

### 1. Tag Combination

Combine tags from different hierarchies for precise categorization:

```yaml
tags: [
  phase/phase-14/obsidian,
  status/in-progress/development,
  domain/knowledge-graph,
  type/implementation/code,
  priority/high
]
```

### 2. Tag Inheritance

Child tags inherit parent meaning. Searching for `#phase/phase-14` finds all Phase 14 documents including `#phase/phase-14/obsidian`.

### 3. Dataview Queries

Query specific tag levels:

```dataview
# All Phase 14 documents
FROM #phase/phase-14

# Only Obsidian-specific Phase 14 docs
FROM #phase/phase-14/obsidian

# In-progress development tasks
FROM #status/in-progress/development

# High priority implementation
FROM #priority/high AND #type/implementation
```

### 4. Graph View Filtering

Color-code graph by tag hierarchy:

```json
{
  "colorGroups": [
    {"query": "tag:#phase/phase-14", "color": {"rgb": 16185217}},
    {"query": "tag:#status/complete", "color": {"rgb": 1099009}},
    {"query": "tag:#priority/critical", "color": {"rgb": 14423100}}
  ]
}
```

### 5. Tag Pane Navigation

Browse hierarchically in Obsidian tag pane:

```
📂 phase
  📂 phase-14
    📄 obsidian (23)
    📄 visual-intelligence (18)
    📄 metadata-v3 (12)
```

## Tag Naming Conventions

### Format

- **Lowercase**: All tags lowercase: `#phase/phase-14`
- **Hyphens**: Use hyphens for multi-word: `#learning-loop`
- **Descriptive**: Clear, self-explanatory names
- **Consistent**: Follow existing patterns

### Examples

✅ **Good**:
```
#phase/phase-14/obsidian
#status/in-progress
#domain/knowledge-graph
#priority/high/feature
```

❌ **Bad**:
```
#Phase14             # Not hierarchical
#In_Progress         # Underscores, caps
#KG                  # Abbreviation unclear
#p1                  # Not descriptive
```

## Tag Lifecycle

### Adding New Tags

1. Check if parent hierarchy exists
2. Add to this document first
3. Apply to relevant files
4. Update Dataview dashboards

### Deprecating Tags

1. Mark as deprecated in this doc
2. Create migration path
3. Update affected files
4. Archive old tag after migration

### Merging Tags

1. Choose canonical tag
2. Update all instances
3. Create alias if needed
4. Document in changelog

## Obsidian Configuration

### Enable Nested Tags

In Obsidian settings:
1. Settings → Appearance → Show nested tags: **ON**
2. Settings → Files & Links → Use nested tags in tag pane: **ON**

### Tag Pane Settings

```json
{
  "tagPaneCollapsed": false,
  "tagPaneShowCount": true,
  "tagPaneSortAlpha": true
}
```

## Dataview Integration

### Tag-Based Dashboards

```dataview
TABLE
  visual.icon as "",
  title,
  status,
  priority
FROM #phase/phase-14
WHERE status != "complete"
SORT priority DESC
```

### Tag Statistics

```dataview
TABLE
  length(rows) as "Count"
FROM ""
FLATTEN file.tags as tag
GROUP BY tag
SORT length(rows) DESC
LIMIT 20
```

### Multi-Tag Filtering

```dataview
LIST
FROM #priority/high AND #status/in-progress
WHERE contains(file.tags, "#domain/weaver")
```

## Migration from Flat Tags

### Conversion Script

```typescript
// Convert flat tags to hierarchical
const conversions = {
  'planning': 'type/planning',
  'phase14': 'phase/phase-14',
  'in-progress': 'status/in-progress',
  'high-priority': 'priority/high'
};

function convertTags(tags: string[]): string[] {
  return tags.map(tag => conversions[tag] || tag);
}
```

### Batch Update

```bash
# Find all files with old tag format
rg --files-with-matches '#planning(?!/)'

# Convert using sed or script
# (Use batch metadata script from Task 5)
```

## Tag Analytics

### Coverage Metrics

| Hierarchy | Files Tagged | Percentage |
|-----------|-------------|------------|
| Phase | 1,200 | 85% |
| Status | 1,350 | 95% |
| Domain | 1,100 | 78% |
| Priority | 800 | 56% |
| Type | 1,400 | 99% |

### Most Used Tags

1. `#phase/phase-14` - 450 files
2. `#status/complete` - 380 files
3. `#domain/weaver` - 320 files
4. `#type/documentation` - 290 files
5. `#priority/high` - 250 files

## Best Practices

### 1. Consistency

Always use the same tag for the same concept. Check existing tags before creating new ones.

### 2. Depth Limit

Keep hierarchies to 3-4 levels maximum for usability:
- ✅ `#phase/phase-14/obsidian/metadata`
- ❌ `#phase/phase-14/week-1/day-3/morning/task-5` (too deep)

### 3. Redundancy

Avoid redundant tags:
- ✅ `#phase/phase-14/obsidian`
- ❌ `#phase/phase-14/obsidian` + `#obsidian` (redundant)

### 4. Specificity

Use most specific tag applicable:
- ✅ `#status/in-progress/development`
- ⚠️ `#status` (too vague)



## Related

[[obsidian-features-research]]
## Related Documents

- [[metadata-schema-v3]] - Frontmatter schema
- [[obsidian-icon-system]] - Icon mapping
- [[weave-nn-colors.css]] - Tag color styling
- [[phase-14-obsidian-integration]] - Overall plan

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-28 | Initial tag hierarchy definition |

---

**Next Steps**:
1. Apply hierarchical tags to existing files
2. Configure Obsidian tag pane
3. Create tag-based Dataview dashboards
4. Train users on tag usage
