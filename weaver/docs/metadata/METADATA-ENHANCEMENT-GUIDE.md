---
title: Metadata Enhancement Guide
type: guide
status: complete
domain:
  - knowledge-graph
  - weaver
priority: high
tags:
  - type/guide
  - domain/knowledge-graph
  - priority/high
  - status/complete
visual:
  icon: 🗺️
  color: "#9013FE"
  cssclasses:
    - guide-document
created: 2025-10-29T00:00:00.000Z
updated: 2025-10-29T00:00:00.000Z
keywords:
  - metadata
  - enhancement
  - automation
  - workflow
  - obsidian
---

# Metadata Enhancement Guide

Complete guide for the mass metadata enhancement workflow.

## Overview

This guide documents the automated metadata enhancement system that adds comprehensive frontmatter to 600+ markdown files for improved Obsidian integration and knowledge graph capabilities.

## Schema v3.0

### Required Fields

- `title` - Human-readable document title
- `type` - Document category (planning, implementation, research, etc.)
- `status` - Current status (draft, in-progress, review, complete, archived)

### Optional Fields

- `phase_id` - Associated phase (e.g., PHASE-13)
- `tags` - Hierarchical tags using slash notation
- `domain` - Primary domain(s) (weaver, learning-loop, etc.)
- `priority` - Priority level (critical, high, medium, low)
- `aliases` - Alternative names for the document
- `related` - Related document paths
- `visual` - Obsidian styling (icon, color, cssclasses)
- `created` / `updated` - ISO 8601 timestamps
- `author` - Document author
- `version` - Semantic version
- `dependencies` - Dependencies on other documents
- `implements` - Specifications implemented
- `supersedes` - Previous document replaced
- `keywords` - Search keywords

## Tag Taxonomy

### Hierarchical Structure

```yaml
tags:
  - phase/phase-13
  - domain/learning-loop
  - type/implementation
  - priority/critical
  - status/complete
```

### Categories

1. **Phase Tags** - `phase/phase-12`, `phase/phase-13`, `phase/phase-14`
2. **Domain Tags** - `domain/weaver`, `domain/learning-loop`, `domain/knowledge-graph`
3. **Type Tags** - `type/implementation`, `type/planning`, `type/research`
4. **Priority Tags** - `priority/critical`, `priority/high`, `priority/medium`, `priority/low`
5. **Status Tags** - `status/draft`, `status/in-progress`, `status/complete`

## Visual Styling

Each document type has associated visual styling:

```typescript
const VISUAL_STYLES = {
  hub: { icon: '🏠', color: '#4A90E2', cssclasses: ['hub-document'] },
  planning: { icon: '📋', color: '#F5A623', cssclasses: ['planning-document'] },
  implementation: { icon: '⚙️', color: '#7ED321', cssclasses: ['implementation-document'] },
  research: { icon: '🔬', color: '#BD10E0', cssclasses: ['research-document'] },
  architecture: { icon: '🏗️', color: '#50E3C2', cssclasses: ['architecture-document'] },
  sop: { icon: '📖', color: '#B8E986', cssclasses: ['sop-document'] },
};
```

## Workflow Execution

### 1. Schema Validation

Location: `/home/aepod/dev/weave-nn/weaver/schemas/metadata-v3.schema.json`

Validate schema:
```bash
npx ajv validate -s schemas/metadata-v3.schema.json -d "test-metadata.json"
```

### 2. Mass Enhancement

Run the enhancement workflow:

```bash
npx tsx src/workflows/kg/enhance-metadata.ts \
  --target=/home/aepod/dev/weave-nn/weave-nn \
  --schema=schemas/metadata-v3.schema.json \
  --batch-size=50
```

Options:
- `--target` - Target directory to process
- `--schema` - Path to JSON schema
- `--batch-size` - Number of files per batch (default: 50)
- `--dry-run` - Preview changes without writing

### 3. Validation

Validate all enhanced files:

```bash
npx tsx src/workflows/kg/validate-metadata.ts \
  --target=/home/aepod/dev/weave-nn/weave-nn \
  --schema=schemas/metadata-v3.schema.json \
  --output=docs/metadata/validation-report.md
```

### 4. Coverage Report

Generate coverage statistics:

```bash
npx tsx src/workflows/kg/validate-metadata.ts \
  --target=/home/aepod/dev/weave-nn/weave-nn \
  --schema=schemas/metadata-v3.schema.json \
  --output=docs/metadata/validation-report.md
```

## Content Analysis

The enhancement workflow automatically:

1. **Extracts Title** - From first heading or filename
2. **Detects Type** - Based on content patterns and keywords
3. **Determines Status** - From status indicators in content
4. **Identifies Phase** - From PHASE-X references
5. **Generates Tags** - Based on path, content, and metadata
6. **Assigns Priority** - Based on phase, keywords, and location
7. **Applies Visual Styling** - Based on document type
8. **Extracts Keywords** - From headings and content

## Batch Processing Strategy

1. **Priority Files First** (Enhanced manually for quality)
   - All Phase 13-14 documents
   - Main hub documents
   - Architecture documents
   - Implementation guides

2. **High-Value Files**
   - Service documentation
   - Workflow guides
   - SOP documents

3. **Regular Files**
   - Research documents
   - Analysis files
   - Supporting documentation

4. **Archive Files**
   - Historical documents
   - Deprecated content

## Manual Enhancement

For critical documents, manually review and enhance:

```yaml
---
title: "Learning Loop Implementation Guide"
type: implementation
status: complete
phase_id: PHASE-13
tags:
  - phase/phase-13
  - domain/learning-loop
  - type/implementation
  - priority/critical
  - status/complete
domain:
  - learning-loop
  - weaver
priority: critical
aliases:
  - "Learning Loop"
  - "Autonomous Learning"
  - "Phase 13 Core"
related:
  - "perception-system.md"
  - "knowledge-graph-integration.md"
visual:
  icon: "⚙️"
  color: "#7ED321"
  cssclasses:
    - implementation-document
    - phase-13
created: 2025-01-15T00:00:00.000Z
updated: 2025-10-29T00:00:00.000Z
author: "Weaver Team"
version: "1.0.0"
implements:
  - "phase-13-specification.md"
keywords:
  - autonomous learning
  - perception
  - learning loop
  - knowledge graph
---
```

## Quality Assurance

### Validation Checklist

- [ ] All required fields present
- [ ] Tags follow hierarchical structure
- [ ] Visual styling appropriate for type
- [ ] Timestamps in ISO 8601 format
- [ ] Keywords relevant and unique
- [ ] Aliases for key documents
- [ ] Related documents linked
- [ ] Schema validation passes

### Coverage Targets

- **Required Fields:** 100%
- **Optional Fields:** >70%
- **Total Coverage:** >90%

## Troubleshooting

### Common Issues

1. **Validation Errors**
   - Check schema format
   - Verify enum values
   - Validate timestamps

2. **Low Coverage**
   - Add missing optional fields
   - Review and enhance manually
   - Update keywords and aliases

3. **Tag Inconsistencies**
   - Use hierarchical structure
   - Follow taxonomy
   - Remove duplicate tags

## Next Steps

1. **Execute Mass Enhancement** - Run automated workflow
2. **Manual Review** - Enhance priority files
3. **Validate Results** - Check coverage and errors
4. **Fix Issues** - Address validation errors
5. **Generate Report** - Document coverage and quality
6. **Obsidian Integration** - Test features with enhanced metadata

## Files

- Schema: `/home/aepod/dev/weave-nn/weaver/schemas/metadata-v3.schema.json`
- Enhancement: `/home/aepod/dev/weave-nn/weaver/src/workflows/kg/enhance-metadata.ts`
- Validation: `/home/aepod/dev/weave-nn/weaver/src/workflows/kg/validate-metadata.ts`
- Guide: `/home/aepod/dev/weave-nn/weaver/docs/metadata/METADATA-ENHANCEMENT-GUIDE.md`
- Report: `/home/aepod/dev/weave-nn/weaver/docs/metadata/validation-report.md`
