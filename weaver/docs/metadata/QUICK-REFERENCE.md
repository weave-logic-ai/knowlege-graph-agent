---
title: Metadata Enhancement Quick Reference
type: reference
status: complete
domain:
  - knowledge-graph
  - weaver
priority: high
tags:
  - type/reference
  - domain/knowledge-graph
  - priority/high
  - status/complete
visual:
  icon: "⚡"
  color: "#F5A623"
  cssclasses:
    - reference-document
created: 2025-10-29T00:00:00.000Z
updated: 2025-10-29T04:55:33.000Z
keywords:
  - quick reference
  - metadata
  - commands
  - cheat sheet
---

# Metadata Enhancement Quick Reference

## 🚀 Quick Commands

### Run Enhancement
```bash
# Full enhancement
npx tsx src/workflows/kg/enhance-metadata.ts

# Dry run (preview only)
npx tsx src/workflows/kg/enhance-metadata.ts --dry-run

# Custom target
npx tsx src/workflows/kg/enhance-metadata.ts \
  --target=/path/to/docs \
  --batch-size=25
```

### Run Validation
```bash
# Validate and generate report
npx tsx src/workflows/kg/validate-metadata.ts

# Custom output
npx tsx src/workflows/kg/validate-metadata.ts \
  --output=my-report.md
```

## 📋 Schema Quick Reference

### Required Fields
```yaml
---
title: "Document Title"
type: implementation  # See types below
status: in-progress   # See statuses below
---
```

### Common Optional Fields
```yaml
---
# ... required fields ...
phase_id: PHASE-13
domain:
  - weaver
  - learning-loop
priority: high
tags:
  - phase/phase-13
  - domain/weaver
  - type/implementation
aliases:
  - "Alternative Title"
  - "Nickname"
visual:
  icon: "⚙️"
  color: "#7ED321"
  cssclasses:
    - implementation-document
---
```

## 🎯 Valid Enum Values

### Document Types
```yaml
type: planning          # Planning documents
type: implementation    # Implementation guides
type: research          # Research and analysis
type: architecture      # Architecture docs
type: sop              # Standard operating procedures
type: hub              # Hub/index documents
type: guide            # How-to guides
type: specification    # Specifications
type: reference        # Reference docs
type: documentation    # General documentation
type: analysis         # Analysis documents
type: decision         # Decision records
```

### Status Values
```yaml
status: draft          # Initial draft
status: in-progress    # Work in progress
status: review         # Under review
status: complete       # Completed
status: archived       # Archived
status: deprecated     # Deprecated/obsolete
```

### Priority Levels
```yaml
priority: critical     # Critical priority
priority: high        # High priority
priority: medium      # Medium priority
priority: low         # Low priority
```

### Domains
```yaml
domain:
  - weaver              # Weaver core
  - learning-loop       # Learning loop
  - knowledge-graph     # Knowledge graph
  - infrastructure      # Infrastructure
  - perception          # Perception system
  - chunking           # Chunking system
  - embeddings         # Embeddings
  - vault-init         # Vault initialization
  - workflow-engine    # Workflow engine
  - service-manager    # Service manager
  - sops              # Standard operating procedures
  - cli               # CLI tools
```

## 🏷️ Tag Taxonomy

### Structure
```yaml
tags:
  - category/value
  - category/subcategory/value
```

### Common Tags
```yaml
# Phase tags
tags:
  - phase/phase-12
  - phase/phase-13
  - phase/phase-14

# Domain tags
tags:
  - domain/weaver
  - domain/learning-loop
  - domain/knowledge-graph

# Type tags
tags:
  - type/implementation
  - type/planning
  - type/research

# Priority tags
tags:
  - priority/critical
  - priority/high
  - priority/medium

# Status tags
tags:
  - status/complete
  - status/in-progress
```

## 🎨 Visual Styling

### By Document Type
```yaml
# Hub documents
visual:
  icon: "🏠"
  color: "#4A90E2"
  cssclasses:
    - hub-document

# Planning documents
visual:
  icon: "📋"
  color: "#F5A623"
  cssclasses:
    - planning-document

# Implementation documents
visual:
  icon: "⚙️"
  color: "#7ED321"
  cssclasses:
    - implementation-document

# Research documents
visual:
  icon: "🔬"
  color: "#BD10E0"
  cssclasses:
    - research-document

# Architecture documents
visual:
  icon: "🏗️"
  color: "#50E3C2"
  cssclasses:
    - architecture-document

# SOP documents
visual:
  icon: "📖"
  color: "#B8E986"
  cssclasses:
    - sop-document
```

## 🔍 Common Patterns

### Hub Document
```yaml
---
title: "Module Hub"
type: hub
status: complete
domain:
  - weaver
priority: high
tags:
  - type/hub
  - domain/weaver
  - priority/high
aliases:
  - "Module Index"
visual:
  icon: "🏠"
  color: "#4A90E2"
  cssclasses:
    - hub-document
---
```

### Implementation Guide
```yaml
---
title: "Feature Implementation Guide"
type: implementation
status: complete
phase_id: PHASE-13
domain:
  - weaver
  - learning-loop
priority: critical
tags:
  - phase/phase-13
  - type/implementation
  - domain/learning-loop
  - priority/critical
visual:
  icon: "⚙️"
  color: "#7ED321"
  cssclasses:
    - implementation-document
implements:
  - "feature-specification.md"
dependencies:
  - "core-architecture.md"
---
```

### Research Document
```yaml
---
title: "Technology Research"
type: research
status: in-progress
domain:
  - research
priority: medium
tags:
  - type/research
  - status/in-progress
  - priority/medium
keywords:
  - research
  - analysis
  - evaluation
visual:
  icon: "🔬"
  color: "#BD10E0"
  cssclasses:
    - research-document
---
```

## 🔧 Fixing Common Issues

### Version Format
```yaml
# ❌ Wrong
version: "2.0"
version: "v1.5"

# ✅ Correct
version: "2.0.0"
version: "1.5.0"
```

### Domain Type
```yaml
# ❌ Wrong
domain: weaver

# ✅ Correct
domain:
  - weaver
```

### Invalid Enum
```yaml
# ❌ Wrong
type: "document"
status: "active"

# ✅ Correct
type: "documentation"
status: "in-progress"
```

### Timestamps
```yaml
# ✅ Correct format
created: 2025-01-15T00:00:00.000Z
updated: 2025-10-29T04:55:33.000Z
```

## 📊 Validation Checks

### Check File
```bash
# Validate single file
npx ajv validate \
  -s schemas/metadata-v3.schema.json \
  -d file-frontmatter.json
```

### Check Coverage
```bash
# Generate validation report
npx tsx src/workflows/kg/validate-metadata.ts
# Check docs/metadata/validation-report.md
```

## 🎯 Quick Fixes

### Batch Fix Version Format
```bash
# Find files with invalid version
grep -r "version:" weave-nn/ | grep -v "\"[0-9]*\.[0-9]*\.[0-9]*\""
```

### Find Missing Required Fields
```bash
# Files without type
grep -L "^type:" weave-nn/**/*.md

# Files without status
grep -L "^status:" weave-nn/**/*.md
```

## 📝 Manual Enhancement Template

```yaml
---
title: ""
type:
status:
phase_id:
domain:
  -
priority:
tags:
  -
aliases:
  -
related:
  -
visual:
  icon: ""
  color: ""
  cssclasses:
    -
created:
updated:
keywords:
  -
---
```

## 🚨 Troubleshooting

### Schema Validation Failed
1. Check enum values match schema
2. Verify array vs string types
3. Check timestamp format (ISO 8601)
4. Validate version pattern (semver)

### Enhancement Failed
1. Check for invalid YAML in existing frontmatter
2. Look for special characters
3. Check file permissions
4. Review error messages in output

### Low Coverage
1. Add missing optional fields manually
2. Enhance aliases for key docs
3. Add related document links
4. Update keywords

## 📚 Resources

- **Schema:** `/weaver/schemas/metadata-v3.schema.json`
- **Enhancement:** `/weaver/src/workflows/kg/enhance-metadata.ts`
- **Validation:** `/weaver/src/workflows/kg/validate-metadata.ts`
- **Guide:** `/weaver/docs/metadata/METADATA-ENHANCEMENT-GUIDE.md`
- **Report:** `/weaver/docs/metadata/validation-report.md`

## 🎓 Best Practices

1. **Always validate** after manual changes
2. **Use hierarchical tags** for better organization
3. **Add aliases** for important documents
4. **Link related documents** to build graph
5. **Keep updated timestamps** current
6. **Document dependencies** for tracking
7. **Use semantic versioning** for version field
8. **Add meaningful keywords** for search

---

**Quick Start:**
```bash
# 1. Run enhancement
npx tsx src/workflows/kg/enhance-metadata.ts

# 2. Validate results
npx tsx src/workflows/kg/validate-metadata.ts

# 3. Check report
cat docs/metadata/validation-report.md
```
