---
title: Metadata Schema v3.0 - Obsidian Visual Intelligence
type: documentation
status: complete
phase_id: PHASE-14
tags:
  - metadata
  - schema
  - frontmatter
  - obsidian
  - visual-intelligence
  - phase/phase-14
  - type/implementation
  - status/complete
domain: knowledge-graph
priority: critical
visual:
  icon: "\U0001F4CA"
  color: '#EC4899'
  cssclasses:
    - type-documentation
    - status-complete
    - priority-critical
updated: '2025-10-29T04:55:06.307Z'
version: '3.0'
keywords:
  - overview
  - what's new in v3.0
  - complete schema
  - field descriptions
  - core identifiers
  - visual properties (new!)
  - relationships
  - dataview fields
  - migration from v2.0 to v3.0
  - automatic upgrade script
---

# Metadata Schema v3.0 - Obsidian Visual Intelligence

**Phase 14 Enhancement - Complete Frontmatter Specification**

This document defines the comprehensive metadata schema for all Weave-NN knowledge graph documents, incorporating visual intelligence properties for Obsidian integration.

## Overview

**Version**: 3.0
**Date**: 2025-10-28
**Breaking Changes**: Adds `visual` property block
**Backward Compatible**: Yes (v2.0 documents will upgrade gracefully)

### What's New in v3.0

- ✨ **Visual Properties**: Icon, color, and CSS class system
- 🎨 **Obsidian Integration**: Native Obsidian property support
- 🏷️ **Enhanced Tags**: Nested tag hierarchy support
- 📊 **Dataview Fields**: Rich query capabilities
- 🔗 **Relationship Types**: Explicit dependency modeling

## Complete Schema

```yaml
---
# ============================================
# CORE IDENTIFIERS (Required)
# ============================================

title: "Document Title"
# Human-readable document title
# Format: Title Case
# Example: "Phase 14 Obsidian Integration Plan"

type: planning | implementation | research | architecture | testing | documentation | hub | sop | timeline | decision | template | workflow | integration | infrastructure | business | concept
# Primary document type for categorization
# Maps to icon and color in visual system
# Required for all documents

status: draft | planned | in-progress | review | blocked | complete | archived | deprecated | active | paused
# Current document lifecycle status
# Drives status indicators and filters
# Required for tracking progress

phase_id: "PHASE-14"
# Project phase identifier
# Format: "PHASE-XX" or "PHASE-XX-SUBPHASE"
# Example: "PHASE-14-WEEK-1"

# ============================================
# CATEGORIZATION (Recommended)
# ============================================

tags: [primary, secondary, tertiary]
# Flat or nested tag array
# Supports nested tags: ["phase/phase-14", "domain/weaver"]
# Used for filtering and grouping

domain: weaver | learning-loop | knowledge-graph | infrastructure | perception | cultivation | memory | neural
# Primary system domain
# Maps to domain color scheme
# Recommended for all technical documents

scope: system | component | feature | task | file
# Document granularity level
# Helps with navigation and context
# Optional but useful for filtering

priority: critical | high | medium | low
# Document or task priority
# Affects visual weight and ordering
# Required for planning/task documents

# ============================================
# RELATIONSHIPS (Recommended)
# ============================================

related_concepts: [concept1, concept2, concept3]
# Conceptual links (not file links)
# Example: ["embeddings", "vector-search", "chunking"]
# Supports knowledge graph clustering

related_files:
  - "[[file1.md]]"
  - "[[file2.md]]"
# Bidirectional file relationships
# Use Obsidian wikilink format
# Enables graph connections

depends_on:
  - "[[dependency1.md]]"
  - "[[dependency2.md]]"
# Explicit dependencies (creates hierarchy)
# Document cannot complete until dependencies complete
# Used for task ordering

enables:
  - "[[enabled-feature1.md]]"
  - "[[enabled-feature2.md]]"
# Documents/features enabled by this document
# Inverse of depends_on
# Shows impact and value

blocks:
  - "[[blocked-item1.md]]"
# Documents blocked by this one
# Used for bottleneck analysis
# Optional

supersedes: "[[old-document.md]]"
# Document this one replaces
# Used for versioning and migration
# Links to deprecated content

superseded_by: "[[new-document.md]]"
# Document that replaces this one
# Indicates deprecation path
# Required if status is deprecated

# ============================================
# METADATA (Optional but Recommended)
# ============================================

author: human | ai-generated | collaborative
# Document authorship type
# Default: collaborative
# Used for attribution

created_date: 2025-10-28
# ISO 8601 date (YYYY-MM-DD)
# Automatically set on creation
# Immutable

updated_date: 2025-10-28
# ISO 8601 date (YYYY-MM-DD)
# Updated on each modification
# Automatic via tooling

version: "3.0"
# Semantic versioning (major.minor.patch)
# Increment on significant changes
# Used for change tracking

changelog:
  - version: "3.0"
    date: 2025-10-28
    changes: "Added visual intelligence properties"
  - version: "2.0"
    date: 2025-10-15
    changes: "Enhanced relationship tracking"
# Optional version history
# Useful for major documents

# ============================================
# OBSIDIAN VISUAL (NEW in v3.0!)
# ============================================

visual:
  icon: "brain" | "code" | "book" | "network" | "🔬" | "📋" | etc.
  # Visual identifier for document
  # Can be text name or emoji
  # Maps to icon system
  # Example: "🔬" for research

  color: "#3B82F6" | "#10B981" | "#8B5CF6" | etc.
  # Hex color code for visual theming
  # Should match type-based color scheme
  # Optional (defaults to type color)

  cssclasses: [type-planning, status-draft, priority-high, phase-14]
  # Array of CSS class names
  # Applied to document in Obsidian
  # Enables advanced styling
  # Combines type, status, priority, domain

  graph_group: "planning" | "architecture" | "implementation"
  # Graph view grouping
  # Overrides automatic grouping
  # Optional

  canvas_position: {x: 100, y: 200}
  # Position in Obsidian Canvas
  # Auto-generated by canvas placement
  # Optional

# ============================================
# DATAVIEW FIELDS (Optional)
# ============================================

completion: 75
# Percentage complete (0-100)
# Used for progress tracking
# Required for in-progress documents

effort_hours: 40
# Estimated effort in hours
# Used for planning and analytics
# Optional

actual_hours: 35
# Actual time spent
# Tracked for accuracy improvement
# Optional

assigned_to: ["agent-1", "agent-2", "human-reviewer"]
# List of agents/people assigned
# Supports multi-agent coordination
# Optional

deadline: 2025-12-01
# ISO 8601 date
# Target completion date
# Required for planned tasks

started_date: 2025-10-20
# ISO 8601 date
# When work actually began
# Auto-set on status change to in-progress

completed_date: 2025-10-28
# ISO 8601 date
# When work was completed
# Auto-set on status change to complete

review_date: 2025-11-01
# ISO 8601 date
# Scheduled review date
# Used for periodic reviews

# ============================================
# TECHNICAL METADATA (Optional)
# ============================================

file_size_kb: 42
# File size for monitoring
# Auto-generated
# Used for chunking decisions

word_count: 3500
# Document word count
# Auto-generated
# Used for reading time estimates

code_blocks: 15
# Number of code blocks
# Auto-generated for technical docs
# Used for documentation metrics

links_internal: 23
# Count of internal links
# Auto-generated
# Graph connectivity metric

links_external: 5
# Count of external URLs
# Auto-generated
# Dependency tracking

embedding_model: "text-embedding-3-small"
# Model used for embeddings
# Tracked for versioning
# Required for vector search documents

embedding_date: 2025-10-28
# When embeddings were last generated
# Used for cache invalidation
# Auto-updated

# ============================================
# BUSINESS METADATA (Optional)
# ============================================

stakeholders: ["team-a", "client-b"]
# Interested parties
# Used for notifications
# Optional

business_value: critical | high | medium | low
# Business impact level
# Different from technical priority
# Used for ROI analysis

revenue_impact: positive | neutral | negative
# Financial impact
# Used for business planning
# Optional

compliance_required: true | false
# Regulatory compliance flag
# Triggers additional reviews
# Default: false

# ============================================
# AI/ML METADATA (Optional)
# ============================================

learning_loop:
  perception_score: 0.85
  # How well perception understood context (0-1)

  cultivation_applied: true
  # Whether cultivation phase ran

  reflection_insights: ["insight1", "insight2"]
  # Key insights from reflection

  iteration_count: 3
  # Number of learning iterations

neural_features:
  embeddings_generated: true
  vector_id: "vec_abc123"
  chunk_strategy: "semantic"
  chunk_count: 8

# ============================================
# CUSTOM FIELDS (Project-Specific)
# ============================================

weaver:
  cli_command: "weaver perceive analyze"
  # Related CLI command

  workflow_id: "wf_perception_001"
  # Associated workflow

  vault_path: "typescript-node"
  # Vault template path

knowledge_graph:
  centrality_score: 0.72
  # Graph centrality metric (0-1)

  cluster_id: "planning-docs"
  # Document cluster assignment

  orphan_risk: low | medium | high
  # Risk of becoming orphaned

---
```

## Field Descriptions

### Core Identifiers

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Human-readable document title |
| `type` | enum | Yes | Primary document categorization |
| `status` | enum | Yes | Current lifecycle status |
| `phase_id` | string | Recommended | Project phase identifier |

### Visual Properties (NEW!)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `visual.icon` | string | Recommended | Document icon (emoji or name) |
| `visual.color` | string | Optional | Hex color code |
| `visual.cssclasses` | array | Recommended | CSS classes for styling |
| `visual.graph_group` | string | Optional | Manual graph grouping |

### Relationships

| Field | Type | Description |
|-------|------|-------------|
| `related_concepts` | array | Conceptual links |
| `related_files` | array | Bidirectional file links |
| `depends_on` | array | Explicit dependencies |
| `enables` | array | Features enabled by this doc |
| `supersedes` | string | Document this replaces |

### Dataview Fields

| Field | Type | Description | Range |
|-------|------|-------------|-------|
| `completion` | number | Progress percentage | 0-100 |
| `effort_hours` | number | Estimated effort | 0+ |
| `assigned_to` | array | Assigned agents/people | - |
| `deadline` | date | Target completion | ISO 8601 |

## Migration from v2.0 to v3.0

### Automatic Upgrade Script

```typescript
// Add visual properties based on existing metadata
function upgradeToV3(frontmatter: any): any {
  return {
    ...frontmatter,
    visual: {
      icon: getIconForType(frontmatter.type),
      color: getColorForType(frontmatter.type),
      cssclasses: [
        `type-${frontmatter.type}`,
        `status-${frontmatter.status}`,
        `priority-${frontmatter.priority || 'medium'}`,
        frontmatter.phase_id?.toLowerCase()
      ].filter(Boolean)
    }
  };
}
```

### Breaking Changes

None. All v2.0 fields remain valid. New `visual` block is additive.

### Deprecations

None in this version.

## Validation Rules

### Required Fields

```typescript
const requiredFields = ['title', 'type', 'status'];

// For documents with status 'in-progress':
const requiredForInProgress = [...requiredFields, 'completion'];

// For documents with status 'complete':
const requiredForComplete = [...requiredFields, 'completed_date'];
```

### Value Constraints

```typescript
// Completion must be 0-100
completion: z.number().min(0).max(100)

// Dates must be ISO 8601
date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// Priority must be valid enum
priority: z.enum(['critical', 'high', 'medium', 'low'])

// Visual color must be hex
visual.color: z.string().regex(/^#[0-9A-F]{6}$/i)
```

## Usage Examples

### Planning Document

```yaml
---
title: "Phase 15 Production Deployment Plan"
type: planning
status: in-progress
phase_id: "PHASE-15"
tags: [planning, deployment, production, phase/phase-15]
domain: infrastructure
scope: system
priority: critical
related_files:
  - "[[phase-14-obsidian-integration]]"
  - "[[deployment-architecture]]"
depends_on:
  - "[[phase-14-complete]]"
enables:
  - "[[production-monitoring]]"
  - "[[auto-scaling-system]]"
completion: 60
effort_hours: 80
assigned_to: ["architect-agent", "devops-agent"]
deadline: 2025-11-15
visual:
  icon: "🚀"
  color: "#10B981"
  cssclasses: [type-planning, status-in-progress, priority-critical, phase-15]
---
```

### Research Document

```yaml
---
title: "Chunking Strategies Research 2024-2025"
type: research
status: complete
phase_id: "PHASE-13"
tags: [research, embeddings, chunking, nlp]
domain: knowledge-graph
scope: feature
priority: high
related_concepts: [semantic-chunking, vector-embeddings, rag-systems]
completed_date: 2025-10-15
word_count: 4200
links_internal: 18
visual:
  icon: "🔬"
  color: "#8B5CF6"
  cssclasses: [type-research, status-complete, priority-high]
embedding_model: "text-embedding-3-small"
embedding_date: 2025-10-15
---
```

### Hub Page

```yaml
---
title: "Weave-NN Project Hub"
type: hub
status: active
tags: [hub, navigation, index]
scope: system
priority: high
related_files:
  - "[[architecture-overview-hub]]"
  - "[[planning-overview-hub]]"
  - "[[documentation-hub]]"
visual:
  icon: "🌐"
  color: "#EC4899"
  cssclasses: [type-hub, status-active]
  graph_group: "navigation"
knowledge_graph:
  centrality_score: 0.95
  cluster_id: "hub-pages"
---
```

### Implementation Document

```yaml
---
title: "Learning Loop Implementation"
type: implementation
status: complete
phase_id: "PHASE-12"
tags: [implementation, learning-loop, autonomous-agents]
domain: learning-loop
scope: component
priority: high
depends_on:
  - "[[learning-loop-architecture]]"
enables:
  - "[[autonomous-perception]]"
  - "[[self-reflection-system]]"
completed_date: 2025-09-30
actual_hours: 45
visual:
  icon: "⚙️"
  color: "#10B981"
  cssclasses: [type-implementation, status-complete, priority-high, phase-12]
learning_loop:
  perception_score: 0.88
  cultivation_applied: true
  iteration_count: 5
---
```

## Dataview Query Examples

### Show Incomplete Tasks

```dataview
TABLE
  visual.icon as "",
  title as "Task",
  completion as "%",
  deadline as "Due"
FROM "weave-nn"
WHERE status = "in-progress"
  AND type = "planning"
SORT deadline ASC
```

### Phase 14 Progress

```dataview
TABLE
  visual.icon as "",
  status,
  completion + "%",
  assigned_to
FROM "weave-nn"
WHERE phase_id = "PHASE-14"
SORT priority DESC, completion ASC
```

### Knowledge Graph Hubs

```dataview
LIST
FROM "weave-nn"
WHERE type = "hub"
SORT file.name ASC
```

## Schema Enforcement

### TypeScript Type Definition

```typescript
interface DocumentMetadata {
  // Core
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  phase_id?: string;

  // Categorization
  tags?: string[];
  domain?: Domain;
  scope?: Scope;
  priority?: Priority;

  // Relationships
  related_concepts?: string[];
  related_files?: string[];
  depends_on?: string[];
  enables?: string[];

  // Visual (NEW!)
  visual?: {
    icon?: string;
    color?: string;
    cssclasses?: string[];
    graph_group?: string;
  };

  // Dataview
  completion?: number;
  effort_hours?: number;
  assigned_to?: string[];
  deadline?: string;
}
```

### Zod Validation Schema

```typescript
import { z } from 'zod';

const MetadataSchema = z.object({
  title: z.string().min(1),
  type: z.enum([
    'planning', 'implementation', 'research',
    'architecture', 'testing', 'documentation',
    'hub', 'sop', 'timeline', 'decision'
  ]),
  status: z.enum([
    'draft', 'planned', 'in-progress', 'review',
    'blocked', 'complete', 'archived'
  ]),
  visual: z.object({
    icon: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    cssclasses: z.array(z.string()).optional()
  }).optional(),
  completion: z.number().min(0).max(100).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional()
});
```









## Related

[[METADATA-ADDITION-SUMMARY]]
## Related

[[obsidian-features-research]]
## Related

[[yaml-frontmatter]]
## Related

[[PHASE-14-WEEK-1-COMPLETION-SUMMARY]]
## Related Documents

- [[obsidian-icon-system]] - Icon mapping reference
- [[weave-nn-colors.css]] - CSS color system
- [[tag-hierarchy-system]] - Tag structure
- [[phase-14-obsidian-integration]] - Integration plan

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 3.0 | 2025-10-28 | Added visual properties, Obsidian integration |
| 2.0 | 2025-10-15 | Enhanced relationships, dataview fields |
| 1.0 | 2025-09-01 | Initial schema definition |

---

**Implementation Status**: ✅ Complete
**Next Steps**:
1. Apply schema to all 1,416 files
2. Validate compliance
3. Generate Dataview dashboards
4. Train agents on schema usage
