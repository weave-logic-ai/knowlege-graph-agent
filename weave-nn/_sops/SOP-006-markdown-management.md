---
sop_id: SOP-006
sop_name: Markdown/Vault Management Workflow
category: documentation
version: 1.0.0
status: active
triggers:
  - weaver sop vault organize
  - weaver vault cleanup
  - weaver vault reindex
learning_enabled: true
estimated_duration: 15-30 minutes
complexity: low
type: sop
visual:
  icon: 📝
  color: '#84CC16'
  cssclasses:
    - type-sop
    - status-active
updated_date: '2025-10-28'
icon: 📝
---

# SOP-006: Markdown/Vault Management Workflow

## Overview

The Markdown/Vault Management Workflow provides systematic organization, optimization, and maintenance of project documentation vaults. This SOP coordinates agents to analyze vault structure, identify issues like broken links or orphaned files, reorganize content following best practices, and rebuild shadow cache indexes for optimal performance.

This workflow prevents documentation decay by automatically detecting and fixing common issues: broken links, duplicate content, inconsistent naming, and poor organization. The learning loop captures organizational patterns that improve discoverability and maintains vault health over time.

By following this SOP, teams maintain clean, navigable documentation vaults with fast search performance, no broken links, and logical content hierarchy that scales with project growth.

## Prerequisites

- Weaver CLI installed with shadow cache
- Access to vault directory (typically `/_planning`, `/docs`, `/vault`)
- Git access for committing organizational changes
- Shadow cache initialized

## Inputs

### Required
- **Vault Path**: Directory to manage (e.g., `/docs`, `/_planning`)
- **Operation**: organize | cleanup | reindex | audit

### Optional
- **Fix Broken Links**: Automatically fix broken internal links
- **Remove Orphans**: Delete unreferenced files
- **Merge Duplicates**: Consolidate duplicate content
- **Update Taxonomy**: Reorganize by new categorization
- **Rebuild Index**: Force shadow cache rebuild

## Agent Coordination

This SOP spawns **2 specialized agents** in sequence:

### 1. Analyst Agent
**Role**: Analyze vault structure and identify issues
- Scan all markdown files in vault
- Detect broken links (internal and external)
- Find orphaned files (no incoming links)
- Identify duplicate content
- Analyze directory structure
- Check naming consistency
- Measure shadow cache performance

### 2. Coder Agent (Organizer)
**Role**: Fix issues and reorganize vault
- Fix broken links automatically
- Move orphaned files to appropriate locations
- Merge duplicate content
- Rename files following conventions
- Update frontmatter metadata
- Rebuild directory structure
- Regenerate shadow cache index

## MCP Tools Used

### Memory Compression
```typescript
mcp__claude-flow__memory_compress({
  namespace: "documentation"
})
```
**Purpose**: Compress vault memory to optimize shadow cache performance.

### Shadow Cache Management
Shadow cache tools (internal to Weaver, no MCP needed):
```bash
weaver cache analyze   # Analyze cache performance
weaver cache rebuild   # Force rebuild index
weaver cache optimize  # Optimize cache structure
```

### Pattern Recognition
```typescript
mcp__claude-flow__pattern_recognize({
  data: vaultStructure,
  patterns: ["naming-conventions", "organization-hierarchy"]
})
```
**Purpose**: Identify organizational patterns for better structure.

## Weaver Integration

### Shadow Cache Analysis
Weaver's shadow cache provides vault insights:

```bash
# Analyze vault health
weaver vault analyze /docs

# Returns:
# - Total files: 247
# - Broken links: 8
# - Orphaned files: 3
# - Duplicate content: 2 pairs
# - Average link depth: 2.4
# - Cache hit rate: 89%
```

### Automatic Link Fixing
```typescript
// Weaver detects and suggests fixes
weaver vault check-links /docs

// Finds:
// [x] docs/api/auth.md -> docs/api/authentication.md (moved)
// [x] docs/guides/start.md -> docs/getting-started.md (renamed)
// [x] docs/arch/old.md (orphaned, no incoming links)

// Auto-fix:
weaver vault fix-links --auto
```

### Vault Organization
Standard vault structure:

```
/docs/
  api/              # API documentation
  guides/           # User guides and tutorials
  architecture/     # Architecture docs
  reference/        # Reference materials
  .index/           # Shadow cache index
  .metadata/        # Vault metadata
```

## Execution Steps

### Step 1: Initialize Vault Management
```bash
# User initiates vault organization
weaver sop vault organize /docs

# Weaver setup
npx claude-flow hooks pre-task --description "Organize documentation vault"
```

### Step 2: Vault Analysis (Analyst Agent)
```typescript
Task("Analyst", `
  Analyze documentation vault structure and identify issues.

  Tasks:
  1. Scan all markdown files in /docs
  2. Check all internal links (markdown links)
  3. Check external links (http/https)
  4. Find orphaned files (no incoming links)
  5. Detect duplicate content (similar titles/content)
  6. Analyze directory organization
  7. Check naming conventions
  8. Measure shadow cache performance

  Commands:
  weaver vault analyze /docs
  weaver cache analyze

  Analysis Categories:

  1. Broken Links:
  - Internal links to moved/deleted files
  - Anchor links to non-existent headers
  - External links returning 404

  2. Orphaned Files:
  - Files with no incoming links
  - Files not in any index
  - Temporary/draft files left behind

  3. Duplicate Content:
  - Files with >80% similar content
  - Same topic documented multiple places
  - Copy-paste documentation

  4. Naming Issues:
  - Inconsistent casing (camelCase vs kebab-case)
  - Unclear names (doc1.md, temp.md)
  - Missing prefixes/suffixes

  5. Organization Issues:
  - Files in wrong directories
  - Deep nesting (>4 levels)
  - Missing category directories

  6. Shadow Cache Performance:
  - Cache hit rate
  - Index size and fragmentation
  - Stale entries

  Scan Results:

  Total files: 247
  Directories: 18

  Issues Found:
  - Broken internal links: 8
  - Broken external links: 3
  - Orphaned files: 5
  - Duplicate pairs: 2
  - Naming violations: 12
  - Misplaced files: 7
  - Cache hit rate: 89% (target: 95%)

  Detailed Breakdown:

  Broken Links:
  1. docs/api/auth.md -> docs/api/old/authentication.md (moved)
  2. docs/guides/start.md -> docs/getting-started.md (renamed)
  3. docs/arch/overview.md#deployment (anchor missing)
  [... 5 more]

  Orphaned Files:
  1. docs/temp/notes.md (no incoming links)
  2. docs/draft-api.md (draft file)
  3. docs/old/deprecated.md (old version)
  [... 2 more]

  Duplicates:
  1. docs/auth.md ≈ docs/api/authentication.md (92% similar)
  2. docs/start.md ≈ docs/guides/getting-started.md (87% similar)

  Output to memory:
  key: "swarm/analyst/vault-analysis"
  value: {
    totalFiles: 247,
    issues: {
      brokenLinks: 8,
      orphanedFiles: 5,
      duplicates: 2,
      namingIssues: 12,
      misplacedFiles: 7
    },
    cacheHitRate: 0.89,
    recommendations: [
      "Fix broken links to moved files",
      "Archive orphaned files",
      "Merge duplicate authentication docs",
      "Rename files to kebab-case",
      "Reorganize API docs into subdirectories",
      "Rebuild shadow cache"
    ]
  }

  Hooks:
  npx claude-flow hooks post-task --task-id "vault-analysis"
`, "analyst")
```

### Step 3: Fix Issues and Reorganize (Coder Agent)
```typescript
Task("Coder Organizer", `
  Fix vault issues and reorganize documentation structure.

  Input from memory:
  key: "swarm/analyst/vault-analysis"
  Issues: 8 broken links, 5 orphans, 2 duplicates, 12 naming issues

  Tasks:
  1. Fix broken internal links (8 links)
  2. Handle orphaned files (5 files)
  3. Merge duplicate content (2 pairs)
  4. Rename files to follow conventions (12 files)
  5. Reorganize misplaced files (7 files)
  6. Update frontmatter metadata
  7. Rebuild shadow cache index

  Execution Plan:

  Step 1: Fix Broken Links

  1. docs/api/auth.md -> docs/api/old/authentication.md
     Fix: Update link to docs/api/authentication.md

  2. docs/guides/start.md -> docs/getting-started.md
     Fix: Update link to docs/guides/getting-started.md

  [... fix all 8 links]

  Commands:
  weaver vault fix-links --auto /docs

  Step 2: Handle Orphaned Files

  1. docs/temp/notes.md
     Action: Move to /docs/archive/ or delete if truly temporary

  2. docs/draft-api.md
     Action: Move to /docs/drafts/ or complete and publish

  3. docs/old/deprecated.md
     Action: Move to /docs/archive/

  Commands:
  mkdir -p /docs/archive /docs/drafts
  mv docs/temp/notes.md docs/archive/
  mv docs/draft-api.md docs/drafts/
  mv docs/old/deprecated.md docs/archive/

  Step 3: Merge Duplicates

  1. Merge docs/auth.md into docs/api/authentication.md
     - Copy unique content from auth.md
     - Add redirect from auth.md location
     - Delete auth.md

  2. Merge docs/start.md into docs/guides/getting-started.md
     - Similar process

  Commands:
  weaver edit docs/api/authentication.md  # Add unique content
  echo "See: docs/api/authentication.md" > docs/auth.md.redirect
  rm docs/auth.md

  Step 4: Rename Files (Naming Conventions)

  Enforce kebab-case naming:
  - API_Reference.md -> api-reference.md
  - User Guide.md -> user-guide.md
  - Getting_Started.md -> getting-started.md
  [... 12 files total]

  Commands:
  weaver vault rename --pattern "snake_case|PascalCase" --to "kebab-case"

  Step 5: Reorganize Misplaced Files

  Move files to appropriate directories:
  - docs/authentication.md -> docs/api/authentication.md
  - docs/deployment.md -> docs/architecture/deployment.md
  - docs/tutorial-1.md -> docs/guides/tutorial-1.md
  [... 7 files total]

  Commands:
  mv docs/authentication.md docs/api/
  mv docs/deployment.md docs/architecture/
  mv docs/tutorial-1.md docs/guides/

  Step 6: Update Frontmatter

  Add/update YAML frontmatter:
  \`\`\`yaml
  ---
  title: "API Authentication"
  category: "api"
  tags: ["authentication", "security", "oauth"]
  last_updated: "2025-10-27"
  ---
  \`\`\`

  Commands:
  weaver vault update-frontmatter /docs --add-missing

  Step 7: Rebuild Shadow Cache

  Commands:
  weaver cache rebuild /docs

  MCP Tools:
  mcp__claude-flow__memory_compress({
    namespace: "documentation"
  })

  Results:

  Fixed:
  - Broken links: 8/8 fixed
  - Orphaned files: 5/5 archived
  - Duplicates: 2/2 merged
  - Renamed files: 12/12 updated
  - Reorganized files: 7/7 moved
  - Frontmatter: 247/247 updated
  - Shadow cache: Rebuilt successfully

  New Structure:

  /docs/
    api/
      authentication.md
      users.md
      projects.md
    guides/
      getting-started.md
      tutorial-1.md
      tutorial-2.md
    architecture/
      overview.md
      deployment.md
      components.md
    reference/
      cli.md
      configuration.md
    archive/
      deprecated.md
      old-notes.md
    drafts/
      draft-api.md

  Cache Performance:
  - Hit rate: 95% (improved from 89%)
  - Index size: 2.4MB (optimized from 3.8MB)
  - Avg query time: 12ms (improved from 28ms)

  Output to memory:
  key: "swarm/coder/vault-organized"
  value: {
    issuesFixed: 34,
    filesReorganized: 24,
    cacheRebuilt: true,
    newHitRate: 0.95,
    performanceImprovement: "2.3x faster"
  }

  Hooks:
  npx claude-flow hooks post-edit --file "docs/" --memory-key "swarm/coder/organized"
`, "coder")
```

### Step 4: Generate Vault Index
```bash
# Create navigable index
weaver vault index generate /docs

# Creates /docs/INDEX.md:
# # Documentation Index
#
# ## API Documentation
# - [Authentication](api/authentication.md)
# - [Users API](api/users.md)
#
# ## Guides
# - [Getting Started](guides/getting-started.md)
# - [Tutorial 1](guides/tutorial-1.md)
```

### Step 5: Commit Changes
```bash
weaver git commit "docs: Reorganize documentation vault

- Fixed 8 broken internal links
- Archived 5 orphaned files
- Merged 2 duplicate documents
- Renamed 12 files to kebab-case
- Reorganized 7 misplaced files
- Updated frontmatter on all 247 files
- Rebuilt shadow cache (95% hit rate)

Performance: 2.3x faster search, 36% smaller cache

Generated by: SOP-006 Vault Management Workflow"
```

### Step 6: Store Learning Data
```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "vault/maintenance/2025-10-27",
  namespace: "learning",
  value: JSON.stringify({
    vaultPath: "/docs",
    operation: "organize",
    filesProcessed: 247,
    issuesFixed: 34,
    timeToComplete: "22 minutes",
    cacheHitRateBefore: 0.89,
    cacheHitRateAfter: 0.95,
    performanceGain: "2.3x",
    commonIssues: [
      "Broken links from file moves",
      "Inconsistent naming (mixed case)",
      "Orphaned draft files",
      "Poor directory organization"
    ],
    preventionTips: [
      "Use vault check in pre-commit hook",
      "Enforce naming conventions in CI",
      "Regular quarterly vault cleanup",
      "Archive old content instead of deleting"
    ]
  }),
  ttl: 7776000 // 90 days
})
```

## Output Artifacts

### 1. Organized Vault Structure
Clean directory hierarchy:
- Logical categorization
- Consistent naming
- No orphaned files
- No duplicate content

### 2. Updated Documentation
All markdown files with:
- Fixed links
- Updated frontmatter
- Consistent formatting
- Proper categorization

### 3. Vault Index (`INDEX.md`)
Navigable table of contents with all documents organized by category.

### 4. Shadow Cache
Rebuilt and optimized:
- Higher hit rate (95%+)
- Smaller index size
- Faster queries

### 5. Maintenance Report
Summary of changes:
- Issues found and fixed
- Files reorganized
- Performance improvements
- Recommendations

## Success Criteria

✅ **No Broken Links**: All internal links resolve correctly
✅ **No Orphans**: All files referenced or archived
✅ **Consistent Naming**: All files follow naming conventions
✅ **Proper Organization**: Files in correct directories
✅ **Updated Metadata**: All frontmatter current and complete
✅ **Cache Performance**: Hit rate ≥ 95%
✅ **Committed**: All changes versioned in git

## Learning Capture

### Organizational Patterns

```typescript
mcp__claude-flow__pattern_recognize({
  data: vaultStructure,
  patterns: ["naming-conventions", "category-hierarchy"]
})

// Learns:
// - kebab-case for file names
// - 2-3 level directory depth optimal
// - Category-first organization
// - Archive vs delete decisions
```

### Preventive Maintenance Schedule

```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "vault/maintenance-schedule",
  value: JSON.stringify({
    frequency: "quarterly",
    checks: [
      "broken-links",
      "orphaned-files",
      "naming-consistency",
      "cache-optimization"
    ],
    automation: [
      "Pre-commit link check",
      "CI naming validation",
      "Monthly cache rebuild"
    ]
  })
})
```



## Related

[[ARCHIVE-INDEX]] • [[ARCHIVE-INTEGRATION-COMPLETE]] • [[DIRECTORY-HUB-CREATION-SUMMARY]]
## Related SOPs

- **SOP-001**: Feature Planning (create vault structure for features)
- **SOP-002**: Phase Planning (organize phase documentation)
- **SOP-005**: Documentation Generation (generate docs for vault)

## Examples

### Example 1: Documentation Vault Cleanup

```bash
weaver sop vault organize /docs

# Analysis:
- Files: 247
- Issues: 34 (links, orphans, naming)
- Time: 22 minutes

# Results:
- Links fixed: 8
- Files reorganized: 24
- Cache hit rate: 89% -> 95%
- Search: 2.3x faster
```

### Example 2: Planning Vault Reindex

```bash
weaver vault reindex /_planning

# Analysis:
- Files: 156
- Cache size: 4.2MB -> 2.1MB
- Hit rate: 82% -> 96%

# Results:
- Index rebuilt: Success
- Query time: 42ms -> 15ms
- Performance: 2.8x improvement
```

### Example 3: Shadow Cache Optimization

```bash
weaver vault cleanup /vault --optimize-cache

# Analysis:
- Stale entries: 47
- Fragmentation: 23%

# Results:
- Stale removed: 47
- Defragmented: Yes
- Cache size: 12.4MB -> 8.7MB
- Hit rate: 91% -> 97%
```

---

**Version History**
- 1.0.0 (2025-10-27): Initial SOP for vault management and organization
