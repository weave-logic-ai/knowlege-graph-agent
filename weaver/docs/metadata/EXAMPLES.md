---
title: Enhanced Metadata Examples
type: reference
status: complete
domain:
  - knowledge-graph
  - weaver
priority: medium
tags:
  - type/reference
  - domain/knowledge-graph
  - status/complete
visual:
  icon: "📝"
  color: "#F5A623"
  cssclasses:
    - reference-document
created: 2025-10-29T00:00:00.000Z
updated: 2025-10-29T04:55:33.000Z
keywords:
  - examples
  - metadata
  - templates
---

# Enhanced Metadata Examples

Real examples of enhanced metadata from the Weave-NN knowledge graph.

## Hub Document Example

**Before:**
```yaml
---
title: Services Architecture Hub
---
```

**After:**
```yaml
---
title: Services Architecture Hub
type: hub
status: complete
domain:
  - weaver
  - infrastructure
priority: high
tags:
  - type/hub
  - domain/weaver
  - domain/infrastructure
  - priority/high
  - status/complete
visual:
  icon: "🏠"
  color: "#4A90E2"
  cssclasses:
    - hub-document
updated: 2025-10-29T04:55:33.441Z
keywords:
  - hub navigation
  - quick links
  - related documents
---
```

## Implementation Document Example

**Before:**
```yaml
---
title: Learning Loop Implementation
phase: 13
---
```

**After:**
```yaml
---
title: Learning Loop Implementation
type: implementation
status: complete
phase_id: PHASE-13
domain:
  - learning-loop
  - weaver
priority: critical
tags:
  - phase/phase-13
  - type/implementation
  - domain/learning-loop
  - priority/critical
  - status/complete
aliases:
  - "Learning Loop"
  - "Autonomous Learning"
visual:
  icon: "⚙️"
  color: "#7ED321"
  cssclasses:
    - implementation-document
    - phase-13
updated: 2025-10-29T04:55:33.441Z
implements:
  - "phase-13-specification.md"
keywords:
  - autonomous learning
  - perception
  - learning loop
  - implementation guide
---
```

## Research Document Example

**Before:**
```yaml
---
title: Chunking Strategies Research
---
```

**After:**
```yaml
---
title: Chunking Strategies Research
type: research
status: complete
domain:
  - chunking
  - research
priority: high
tags:
  - type/research
  - domain/chunking
  - priority/high
  - status/complete
visual:
  icon: "🔬"
  color: "#BD10E0"
  cssclasses:
    - research-document
updated: 2025-10-29T04:55:33.441Z
keywords:
  - research findings
  - analysis
  - chunking strategies
  - semantic chunking
  - recursive chunking
---
```

## Architecture Document Example

**Before:**
```yaml
---
title: System Architecture
---
```

**After:**
```yaml
---
title: System Architecture
type: architecture
status: complete
phase_id: PHASE-12
domain:
  - weaver
  - architecture
priority: critical
tags:
  - phase/phase-12
  - type/architecture
  - domain/weaver
  - priority/critical
  - status/complete
visual:
  icon: "🏗️"
  color: "#50E3C2"
  cssclasses:
    - architecture-document
updated: 2025-10-29T04:55:33.441Z
keywords:
  - system design
  - architecture overview
  - technical decisions
  - component diagram
---
```

## Planning Document Example

**Before:**
```yaml
---
title: Phase 14 Planning
---
```

**After:**
```yaml
---
title: Phase 14 Obsidian Integration
type: planning
status: in-progress
phase_id: PHASE-14
domain:
  - weaver
  - knowledge-graph
priority: high
tags:
  - phase/phase-14
  - type/planning
  - domain/knowledge-graph
  - priority/high
  - status/in-progress
visual:
  icon: "📋"
  color: "#F5A623"
  cssclasses:
    - planning-document
updated: 2025-10-29T04:55:33.441Z
keywords:
  - planning
  - roadmap
  - obsidian integration
  - metadata enhancement
---
```

## SOP Document Example

**Before:**
```yaml
---
title: Git Workflow SOP
---
```

**After:**
```yaml
---
title: Git Workflow Standard Operating Procedure
type: sop
status: complete
domain:
  - sops
  - weaver
priority: medium
tags:
  - type/sop
  - domain/sops
  - priority/medium
  - status/complete
visual:
  icon: "📖"
  color: "#B8E986"
  cssclasses:
    - sop-document
updated: 2025-10-29T04:55:33.441Z
keywords:
  - standard operating procedure
  - git workflow
  - process
  - guidelines
---
```

## Guide Document Example

**Before:**
```yaml
---
title: Setup Guide
---
```

**After:**
```yaml
---
title: Weaver Setup and Installation Guide
type: guide
status: complete
domain:
  - weaver
priority: high
tags:
  - type/guide
  - domain/weaver
  - priority/high
  - status/complete
visual:
  icon: "🗺️"
  color: "#9013FE"
  cssclasses:
    - guide-document
updated: 2025-10-29T04:55:33.441Z
keywords:
  - installation
  - setup guide
  - getting started
  - configuration
---
```

## Minimal Valid Example

The absolute minimum required metadata:

```yaml
---
title: "Document Title"
type: documentation
status: draft
---
```

## Comprehensive Example

Full metadata with all optional fields:

```yaml
---
title: "Comprehensive Metadata Example"
type: implementation
status: complete
phase_id: PHASE-13
tags:
  - phase/phase-13
  - domain/weaver
  - type/implementation
  - priority/critical
  - status/complete
domain:
  - weaver
  - learning-loop
priority: critical
aliases:
  - "Complete Example"
  - "Metadata Template"
related:
  - "related-document-1.md"
  - "related-document-2.md"
visual:
  icon: "⚙️"
  color: "#7ED321"
  cssclasses:
    - implementation-document
    - phase-13
    - featured
created: 2025-01-15T00:00:00.000Z
updated: 2025-10-29T04:55:33.441Z
author: "Weaver Team"
version: "1.2.0"
dependencies:
  - "core-architecture.md"
  - "knowledge-graph-integration.md"
implements:
  - "phase-13-specification.md"
  - "learning-loop-requirements.md"
supersedes: "legacy-implementation.md"
keywords:
  - implementation
  - learning loop
  - autonomous learning
  - comprehensive example
---
```

## Tag Examples

### Hierarchical Tags
```yaml
tags:
  # Phase organization
  - phase/phase-12
  - phase/phase-13
  - phase/phase-14

  # Domain categorization
  - domain/weaver
  - domain/learning-loop
  - domain/knowledge-graph
  - domain/perception

  # Document type
  - type/implementation
  - type/planning
  - type/research

  # Priority
  - priority/critical
  - priority/high

  # Status
  - status/complete
  - status/in-progress

  # Custom categories
  - feature/autonomous-learning
  - component/perception-system
```

### Multi-level Tags
```yaml
tags:
  - architecture/system/core
  - architecture/system/learning-loop
  - implementation/phase-13/perception
  - research/chunking/semantic
  - workflow/automation/hooks
```

## Visual Styling Examples

### Hub with Custom Styling
```yaml
visual:
  icon: "🏠"
  color: "#4A90E2"
  cssclasses:
    - hub-document
    - featured
    - pinned
```

### Implementation with Phase Styling
```yaml
visual:
  icon: "⚙️"
  color: "#7ED321"
  cssclasses:
    - implementation-document
    - phase-13
    - critical-path
```

### Research with Category Styling
```yaml
visual:
  icon: "🔬"
  color: "#BD10E0"
  cssclasses:
    - research-document
    - analysis
    - chunking-research
```

## Relationship Examples

### Dependencies
```yaml
dependencies:
  - "core-architecture.md"
  - "database-schema.md"
  - "api-specification.md"
```

### Implements
```yaml
implements:
  - "requirements/user-authentication.md"
  - "specs/api-design.md"
```

### Related Documents
```yaml
related:
  - "learning-loop-overview.md"
  - "perception-system-guide.md"
  - "knowledge-graph-integration.md"
```

### Supersedes
```yaml
supersedes: "legacy-implementation-v1.md"
```

## Timestamp Examples

### ISO 8601 Format
```yaml
created: 2025-01-15T00:00:00.000Z
updated: 2025-10-29T04:55:33.441Z
```

### With Timezone
```yaml
created: 2025-01-15T09:30:00-08:00
updated: 2025-10-29T12:55:33+00:00
```

## Version Examples

### Semantic Versioning
```yaml
version: "1.0.0"  # Initial release
version: "1.2.0"  # Minor update
version: "2.0.0"  # Major update
```

## Common Patterns

### New Draft Document
```yaml
---
title: "New Feature Planning"
type: planning
status: draft
priority: medium
tags:
  - status/draft
  - type/planning
---
```

### Work in Progress
```yaml
---
title: "Feature Implementation"
type: implementation
status: in-progress
phase_id: PHASE-14
priority: high
tags:
  - phase/phase-14
  - status/in-progress
  - priority/high
---
```

### Complete and Ready for Review
```yaml
---
title: "Completed Implementation"
type: implementation
status: review
phase_id: PHASE-13
priority: critical
tags:
  - phase/phase-13
  - status/review
  - priority/critical
version: "1.0.0"
---
```

### Archived Document
```yaml
---
title: "Legacy System"
type: architecture
status: archived
supersedes: ""
tags:
  - status/archived
  - type/architecture
---
```

## Tips for Manual Enhancement

1. **Start with required fields** - title, type, status
2. **Add phase_id** if document is phase-specific
3. **Choose appropriate domain(s)** for categorization
4. **Use hierarchical tags** for better organization
5. **Add aliases** for commonly referenced documents
6. **Link related documents** to build graph
7. **Update timestamps** when making changes
8. **Use semantic versioning** for version tracking
9. **Document dependencies** for maintenance
10. **Add keywords** for searchability

## Validation Quick Check

```bash
# Check if metadata is valid
npx tsx src/workflows/kg/validate-metadata.ts \
  --target=/path/to/single/file.md
```

---

These examples demonstrate the metadata enhancement system in action. Use them as templates for manual enhancement of important documents.
