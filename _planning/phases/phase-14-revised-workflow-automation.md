---
title: 'Phase 14: Knowledge Graph Workflow Automation & Obsidian Integration'
type: planning
status: active
phase: 14
created_date: {}
priority: critical
tags:
  - phase-14
  - workflows
  - automation
  - knowledge-graph
  - obsidian
related_to:
  - '[[phase-13-master-plan]]'
  - '[[PROJECT-TIMELINE]]'
  - '[[WEAVER-IMPLEMENTATION-HUB]]'
visual:
  icon: "\U0001F4CB"
  color: '#3B82F6'
  cssclasses:
    - type-planning
    - status-active
    - priority-critical
version: '3.0'
updated_date: '2025-10-28'
---

# Phase 14: Knowledge Graph Workflow Automation & Obsidian Integration (REVISED)

**Status**: 🚀 **Active - Strategic Pivot**
**Duration**: 12 weeks (extended from 8 weeks)
**Priority**: CRITICAL - Foundation for sustainable knowledge graph cultivation

---

## 🎯 Strategic Vision

Instead of manually connecting 165 orphaned files, we're building **automated workflow systems** that will:
- Systematically cultivate the knowledge graph over time
- Automatically connect new documents as they're created
- Establish contextual relationships using directory AND temporal context
- Relate documents to domain primitives (platforms, patterns, features)
- Enable document regeneration and cascade updates
- Enforce vault structure and file organization

**This transforms Phase 14 from "one-time fix" to "sustainable automation system".**

---

## 📊 Revised Phase Structure

### PART 1: Workflow Automation (Weeks 1-3) ⭐ NEW PRIORITY
**Build the automation engine that makes knowledge graph cultivation sustainable**

### PART 2: Knowledge Graph Cultivation (Week 4)
**Use existing 165 orphans as testing bed for workflows**

### PART 3: Obsidian Integration (Weeks 5-12)
**Visual styling, graph optimization, Dataview, Canvas (original plan)**

---

## 🛠️ PART 1: Workflow Automation System (Weeks 1-3)

### Week 1: Core Workflow Engine

#### Objective
Build the foundational workflow system in Weaver that can:
- Detect document events (create, update, move)
- Execute context-aware workflows
- Update knowledge graph systematically
- Operate on git branches for safety

#### Deliverables

**1. Workflow Engine Architecture** (`/weaver/src/workflows/engine/`)
```typescript
// Core workflow engine
workflow-engine.ts          // Main orchestrator
workflow-registry.ts        // Workflow registration & discovery
workflow-executor.ts        // Execution engine with git integration
workflow-context.ts         // Context builder (directory + temporal)
workflow-scheduler.ts       // Background/scheduled execution
```

**2. Context Analysis System** (`/weaver/src/workflows/context/`)
```typescript
directory-context.ts        // Analyze directory structure & purpose
temporal-context.ts         // Analyze document timeline & evolution
primitive-extractor.ts      // Extract platforms, patterns, features
relationship-detector.ts    // Detect semantic relationships
domain-classifier.ts        // Classify documents into domains
```

**3. Git Integration** (`/weaver/src/workflows/git/`)
```typescript
branch-manager.ts           // Create/manage workflow branches
safe-commit.ts              // Atomic commits with rollback
conflict-resolver.ts        // Handle merge conflicts
change-tracker.ts           // Track all workflow modifications
```

**4. CLI Commands**
```bash
weaver workflow run <name> [path]           # Run workflow on path
weaver workflow test <name> [path] --dry-run # Test without changes
weaver workflow list                         # List available workflows
weaver workflow status                       # Show running workflows
weaver cultivate [path]                      # Systematically connect docs
```

#### Success Criteria
- [x] Workflow engine can detect document events
- [x] Context analysis extracts directory + temporal info
- [x] Git integration creates branches for safety
- [x] CLI commands operational
- [x] Test suite with 90% coverage

---

### Week 2: Knowledge Graph Workflows

#### Objective
Build specific workflows for knowledge graph cultivation

#### Core Workflows

**1. Document Connection Workflow** (`/weaver/src/workflows/graph/connect-document.ts`)

**Triggers**:
- New markdown file created
- Existing file modified (manual cultivation)
- Scheduled batch processing

**Process**:
```typescript
1. Analyze document context:
   - Parse frontmatter (if exists)
   - Extract key concepts and terms
   - Identify directory/domain from path
   - Analyze temporal context (when created, related files from same time)

2. Find connection candidates:
   - Same directory documents (local context)
   - Hub documents for this domain
   - Recent documents (temporal context)
   - Documents with similar primitives (platforms, patterns, features)
   - Parent/child directory documents

3. Score relationships (0-100):
   - Directory proximity: 30 points
   - Temporal proximity: 20 points
   - Shared primitives: 25 points
   - Content similarity: 15 points
   - Hub relevance: 10 points

4. Create connections:
   - Add frontmatter with related_to links (top 5 matches >60 score)
   - Add Navigation section with categorized links
   - Update hub documents (bidirectional linking)
   - Update related documents if needed

5. Git safety:
   - Create branch: feature/connect-<filename>
   - Commit changes atomically
   - Provide rollback command if needed
```

**Example Output**:
```markdown
---
title: "New Feature Documentation"
related_to:
  - "[[DOCS-HUB]]"
  - "[[phase-13-implementation]]"
  - "[[similar-feature]]"
domain: technical-documentation
primitives: [rest-api, authentication, nodejs]
created_date: 2025-10-28
---

# New Feature Documentation

## Navigation
- 📂 **Hub**: [[DOCS-HUB]] - Documentation center
- 🔗 **Related**: [[phase-13-implementation]] - Implementation context
- 🏗️ **Similar**: [[similar-feature]] - Related feature
- 📅 **Timeline**: [[PROJECT-TIMELINE]] - Project context

[Content...]
```

**2. Hub Document Maintenance Workflow** (`/weaver/src/workflows/graph/maintain-hubs.ts`)

**Purpose**: Keep hub documents up-to-date with all documents in their domain

**Triggers**:
- New document added to directory
- Document moved between directories
- Scheduled daily scan

**Process**:
```typescript
1. Scan directory for all documents
2. Categorize by type (using frontmatter + content analysis)
3. Update hub document:
   - Add missing documents under correct category
   - Remove documents that moved away
   - Update statistics (file count, last updated)
   - Maintain alphabetical or chronological order
4. Create pull request for review if significant changes
```

**3. Orphan Detection & Resolution Workflow** (`/weaver/src/workflows/graph/resolve-orphans.ts`)

**Purpose**: Systematically find and connect orphaned documents

**Triggers**:
- Scheduled (daily/weekly)
- Manual: `weaver cultivate --orphans-only`

**Process**:
```typescript
1. Scan vault for orphaned documents (0 incoming + 0 outgoing links)
2. For each orphan:
   - Run Document Connection Workflow
   - If no good matches found (all scores <50):
     - Create/identify appropriate hub for this domain
     - Connect to hub at minimum
   - Log results for review
3. Generate report: /docs/orphan-resolution-report-YYYY-MM-DD.md
```

**4. Domain Primitive Workflow** (`/weaver/src/workflows/graph/extract-primitives.ts`)

**Purpose**: Identify and tag documents with domain primitives

**Primitives Categories**:
- **Platforms**: nodejs, python, react, docker, kubernetes, aws, etc.
- **Patterns**: microservices, event-driven, rest-api, graphql, pub-sub, etc.
- **Features**: authentication, caching, logging, monitoring, testing, etc.
- **Domains**: backend, frontend, infrastructure, documentation, planning, etc.

**Process**:
```typescript
1. Content analysis:
   - Scan for platform keywords
   - Detect architectural patterns
   - Identify feature mentions
   - Classify domain from path + content

2. Extract primitives:
   - Build primitive frequency map
   - Score primitive relevance (0-100)
   - Select top 3-5 primitives (score >70)

3. Update frontmatter:
   primitives: [nodejs, rest-api, authentication]
   platform: nodejs
   pattern: microservices
   domain: backend

4. Index in primitive registry:
   /weaver/data/primitives.json
   {
     "nodejs": ["file1.md", "file2.md", ...],
     "rest-api": ["file3.md", ...],
     ...
   }
```

**5. Cascade Update Workflow** (`/weaver/src/workflows/graph/cascade-update.ts`)

**Purpose**: When a document changes, update related documents

**Triggers**:
- Document frontmatter changed
- Document moved/renamed
- Hub structure changed

**Process**:
```typescript
1. Detect change type:
   - Rename: Update all wikilinks pointing to this file
   - Move: Update hub documents (remove from old, add to new)
   - Frontmatter change: Update related documents if needed

2. Find affected documents:
   - Parse all files for wikilinks to this document
   - Identify hub documents that include this file

3. Update affected documents:
   - Fix broken links
   - Update hub listings
   - Adjust categorizations

4. Git branch:
   feature/cascade-update-<document-name>
   Commit all changes atomically
```

#### Success Criteria
- [x] All 5 workflows implemented and tested
- [x] Workflows can run independently or as pipeline
- [x] Git branching works correctly
- [x] Test on 10 sample orphan files with >90% success rate

---

### Week 3: Vault Structure & File Organization

#### Objective
Enforce vault structure and automatically organize files

#### Deliverables

**1. Vault Structure Definition** (`/.vault-structure.yaml`)
```yaml
# Editable vault structure for project customization
version: "1.0"
name: "weave-nn"

structure:
  # Top-level directories (branches)
  - path: "_planning"
    purpose: "Project planning and specifications"
    enforce: true
    subdirs:
      - "phases"      # Phase planning documents
      - "specs"       # Detailed specifications
      - "reviews"     # Planning reviews
      - "daily-logs"  # Daily logs

  - path: "docs"
    purpose: "Project documentation"
    enforce: true
    subdirs:
      - "architecture"   # Architecture docs
      - "guides"         # User/developer guides
      - "research"       # Research papers
      - "phase-14"       # Phase-specific docs

  - path: "weaver"
    purpose: "Weaver implementation"
    enforce: true
    subdirs:
      - "src"           # Source code
      - "tests"         # Test files
      - "docs"          # Implementation docs
      - "scripts"       # Utility scripts

  - path: "archive"
    purpose: "Historical/superseded documents"
    enforce: true

# File classification rules
classification:
  planning:
    patterns: ["**/phase-*.md", "**/plan-*.md", "**/spec-*.md"]
    target: "_planning/phases"

  documentation:
    patterns: ["**/doc-*.md", "**/guide-*.md"]
    target: "docs/guides"

  architecture:
    patterns: ["**/architecture-*.md", "**/*-design.md"]
    target: "docs/architecture"

  archived:
    patterns: ["**/archive-*.md"]
    target: "archive"

# Branch configuration (for workflow isolation)
branches:
  - name: "_planning"
    workflows: ["connect-document", "maintain-hubs"]
    isolation: "high"  # Changes stay within branch

  - name: "docs"
    workflows: ["connect-document", "maintain-hubs", "extract-primitives"]
    isolation: "medium"  # Can reference other branches

  - name: "weaver"
    workflows: ["connect-document", "cascade-update"]
    isolation: "low"  # Deep integration with other branches
```

**2. File Organization Workflow** (`/weaver/src/workflows/structure/organize-files.ts`)

**Purpose**: Move misplaced files to correct locations

**Process**:
```typescript
1. Load .vault-structure.yaml
2. Scan vault for all markdown files
3. For each file:
   - Classify using patterns + content analysis
   - Determine correct location
   - If misplaced:
     - Suggest new location
     - (Dry run: log suggestion only)
     - (Live: move file + update all links)

4. Generate reorganization report:
   - Files to move
   - Link updates required
   - Potential conflicts
```

**CLI**:
```bash
weaver organize --dry-run              # Show what would change
weaver organize --execute              # Actually move files
weaver organize --path docs/          # Organize specific directory
```

**3. Vault Initialization Workflow** (`/weaver/src/workflows/structure/init-vault.ts`)

**Purpose**: Initialize new vault with structured directories

**CLI**:
```bash
weaver init-vault [path]                    # Use default structure
weaver init-vault [path] --structure custom.yaml  # Custom structure
```

**Process**:
```typescript
1. Load structure definition (.vault-structure.yaml or custom)
2. Create directory tree:
   - Top-level directories
   - 2nd-level subdirectories
   - Create hub document for each directory

3. Initialize git repository:
   - git init
   - Create .gitignore (node_modules, .obsidian, etc.)
   - Initial commit

4. Create configuration:
   - .vault-config.json (settings)
   - README.md (vault overview)
   - PROJECT-TIMELINE.md (empty template)

5. Setup workflows:
   - Enable auto-connect on new files
   - Schedule nightly orphan resolution
   - Enable hub maintenance
```

**4. Structure Enforcement** (`/weaver/src/workflows/structure/enforce-structure.ts`)

**Purpose**: Prevent files from being created in wrong locations

**Integration**: Hook into Weaver CLI file creation

```typescript
// When user runs: weaver create doc "New Feature"
1. Analyze command context
2. Determine file type from name/flags
3. Look up correct location in .vault-structure.yaml
4. Create file in correct directory with proper frontmatter
5. Auto-connect to relevant hub

// Example:
weaver create doc "API Authentication" --type guide
→ Creates: /docs/guides/api-authentication.md
→ Frontmatter: related_to: [[GUIDES-HUB]], primitives: [api, auth]
→ Updates: /docs/guides/GUIDES-HUB.md
```

#### Success Criteria
- [x] `.vault-structure.yaml` fully configurable
- [x] File organization workflow works in dry-run and live modes
- [x] Vault initialization creates complete structure
- [x] Structure enforcement prevents misplaced files
- [x] Test with 3 different vault structures

---

## 🧪 PART 2: Testing on Existing Orphans (Week 4)

### Objective
Use the 165 existing orphaned files as a real-world testing bed for workflows

### Process

**Day 1-2: Batch Processing**
```bash
# Run on all 165 orphans
weaver cultivate --orphans-only --dry-run > orphan-cultivation-plan.md
# Review plan
weaver cultivate --orphans-only --execute
```

**Day 3: Validation**
- Run graph analysis tools
- Verify orphan rate dropped to <5%
- Check connection quality (spot-check 20 files)
- Validate git branches created correctly

**Day 4: Refinement**
- Fix any issues discovered
- Tune scoring algorithms
- Improve primitive detection
- Update workflow logic

**Day 5: Documentation**
```
/docs/WORKFLOW-CULTIVATION-RESULTS.md
- Before/after metrics
- Success rate
- Issues encountered
- Lessons learned
- Recommendations for improvement
```

### Success Criteria
- [x] Orphan rate: 31% → <5%
- [x] All connections have quality scores >60
- [x] Zero broken links created
- [x] Git history clean and reviewable
- [x] Workflows run successfully on 95%+ of files

---

## 🎨 PART 3: Obsidian Integration (Weeks 5-12)

### Week 5-6: Visual Styling
- Color coding system (8 colors by type)
- Icon system (Iconic plugin + emoji prefixes)
- CSS snippets (5+ files)
- Custom callouts (8+ types)

### Week 7: Graph View Optimization
- Node colors by tags
- Filtered views (6+)
- Graph groups/clustering
- Navigation optimization

### Week 8: Metadata Enhancement
- Schema v3.0 with Obsidian properties
- CSS classes for styling
- Nested tags
- 90%+ coverage target

### Week 9-10: Dataview Integration
- 10+ dashboard queries
- Phase status tracking
- Task boards
- Statistics views
- Primitive-based dashboards

### Week 11-12: Canvas & Advanced Features
- 14+ canvas maps
- Architecture diagrams
- Workflow visualizations
- Advanced linking features
- Block references
- Embed patterns

---

## 📐 Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Weaver Knowledge Graph System             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─ Workflow Engine
                              │  ├─ Event Detection (file created/updated/moved)
                              │  ├─ Context Analysis (directory + temporal)
                              │  ├─ Workflow Execution (with git branching)
                              │  └─ Scheduling (background tasks)
                              │
                              ├─ Knowledge Graph Workflows
                              │  ├─ Document Connection
                              │  ├─ Hub Maintenance
                              │  ├─ Orphan Resolution
                              │  ├─ Primitive Extraction
                              │  └─ Cascade Updates
                              │
                              ├─ Structure System
                              │  ├─ Vault Structure Definition (.yaml)
                              │  ├─ File Organization
                              │  ├─ Structure Enforcement
                              │  └─ Vault Initialization
                              │
                              ├─ Git Integration
                              │  ├─ Branch Management (workflow isolation)
                              │  ├─ Safe Commits (atomic operations)
                              │  ├─ Rollback Support
                              │  └─ Conflict Resolution
                              │
                              └─ Primitive System
                                 ├─ Platform Detection (nodejs, python, etc.)
                                 ├─ Pattern Recognition (microservices, rest-api)
                                 ├─ Feature Identification (auth, caching, etc.)
                                 └─ Domain Classification
```

### Data Flow

```
1. Document Event Triggered
   │
   ├─→ Context Builder
   │   ├─ Directory Analysis
   │   ├─ Temporal Analysis
   │   ├─ Primitive Extraction
   │   └─ Domain Classification
   │
   ├─→ Workflow Selector
   │   └─ Choose appropriate workflow(s)
   │
   ├─→ Workflow Execution
   │   ├─ Create git branch
   │   ├─ Find connection candidates
   │   ├─ Score relationships
   │   ├─ Update documents
   │   └─ Commit changes
   │
   └─→ Validation & Reporting
       ├─ Verify changes
       ├─ Update graph metrics
       └─ Log results
```

### Primitive Registry Structure

```json
{
  "platforms": {
    "nodejs": {
      "documents": ["file1.md", "file2.md"],
      "count": 45,
      "first_seen": "2025-01-15",
      "related_patterns": ["microservices", "rest-api"]
    },
    "python": { ... }
  },
  "patterns": {
    "microservices": {
      "documents": ["arch1.md", "arch2.md"],
      "count": 23,
      "related_platforms": ["nodejs", "docker"],
      "related_features": ["api-gateway", "service-discovery"]
    }
  },
  "features": { ... },
  "domains": { ... }
}
```

---

## 🎯 Success Metrics

### Week 3 (Workflow System Complete)
- [x] 8+ workflows implemented and tested
- [x] Context analysis working (directory + temporal + primitives)
- [x] Git branching operational
- [x] `.vault-structure.yaml` fully functional
- [x] CLI commands complete

### Week 4 (Orphan Resolution)
- [x] Orphan rate: 31% → <5%
- [x] Connection quality: >90% of connections scored >60
- [x] Zero broken links
- [x] Git history clean and reviewable

### Week 12 (Phase Complete)
- [x] Sustainable workflow automation system
- [x] Knowledge graph with <5% orphans maintained automatically
- [x] Primitive system indexing 200+ primitives
- [x] Full Obsidian visual integration
- [x] 10+ Dataview dashboards
- [x] 14+ Canvas maps

---

## 📊 Deliverables Summary

### Code (Weeks 1-3)
- `/weaver/src/workflows/` - Complete workflow system (~8,000 lines)
- `/weaver/src/workflows/engine/` - Core engine (5 files)
- `/weaver/src/workflows/context/` - Context analysis (5 files)
- `/weaver/src/workflows/graph/` - Graph workflows (5 files)
- `/weaver/src/workflows/structure/` - Structure management (4 files)
- `/weaver/src/workflows/git/` - Git integration (4 files)

### Configuration
- `/.vault-structure.yaml` - Vault structure definition
- `/weaver/data/primitives.json` - Primitive registry

### Documentation (Week 4)
- `/docs/workflows/WORKFLOW-SYSTEM-GUIDE.md` - Complete guide
- `/docs/workflows/WORKFLOW-CULTIVATION-RESULTS.md` - Testing results
- `/docs/workflows/PRIMITIVE-SYSTEM.md` - Primitive documentation
- `/docs/workflows/STRUCTURE-ENFORCEMENT.md` - Structure guide

### CLI Commands
```bash
# Workflow execution
weaver workflow run <name> [path]
weaver workflow test <name> --dry-run
weaver cultivate [--orphans-only]

# Structure management
weaver init-vault [path]
weaver organize --dry-run
weaver organize --execute

# File creation (enforces structure)
weaver create <type> <name> [--flags]
```

---

## 🚀 Implementation Strategy

### Week 1
**Mon-Tue**: Workflow engine core + git integration
**Wed-Thu**: Context analysis system
**Fri**: CLI commands + testing

### Week 2
**Mon**: Document connection workflow
**Tue**: Hub maintenance + orphan resolution workflows
**Wed**: Primitive extraction workflow
**Thu**: Cascade update workflow
**Fri**: Integration testing

### Week 3
**Mon-Tue**: Vault structure system + .vault-structure.yaml
**Wed**: File organization workflow
**Thu**: Vault initialization + structure enforcement
**Fri**: End-to-end testing

### Week 4
**Mon-Tue**: Run workflows on 165 orphans
**Wed**: Validation and metrics
**Thu**: Refinements and tuning
**Fri**: Documentation and handoff to Week 5

### Weeks 5-12
Original Obsidian integration work (visual styling, graph view, Dataview, Canvas)

---

## 💡 Key Innovations

1. **Context-Aware Workflows**: Uses both directory structure AND temporal context (when files were created) to find relationships

2. **Primitive System**: Automatically extracts and indexes platforms, patterns, features - enabling domain-based navigation

3. **Git-Safe Operations**: All workflow changes happen on branches, easily reviewable and rollbackable

4. **Branch Isolation**: Workflows can be limited to specific directory branches, preventing unintended cascade effects

5. **Structure as Code**: `.vault-structure.yaml` defines the vault structure, making it version-controlled and project-specific

6. **Sustainable Automation**: Instead of one-time fixes, builds systems that maintain the knowledge graph over time

7. **Dry-Run First**: All workflows support --dry-run mode, showing what would change before making changes

8. **Cascade Updates**: When documents change, related documents update automatically (broken links fixed, hub documents updated)

---

## 🔄 Maintenance & Evolution

### Continuous Improvement
- Workflows log all actions to `/weaver/logs/workflow-YYYY-MM-DD.log`
- Monthly review of workflow effectiveness
- Tuning of scoring algorithms based on user feedback
- Addition of new primitives as project evolves

### Extensibility
- Plugin system for custom workflows
- User-defined primitives in `.vault-structure.yaml`
- Configurable scoring weights
- Custom classification rules

### Monitoring
```bash
weaver workflow stats                 # Workflow execution statistics
weaver graph metrics                  # Current graph health
weaver primitives list                # All indexed primitives
weaver structure validate             # Check structure compliance
```

---

## 📅 Timeline Summary

| Weeks | Focus | Deliverable |
|-------|-------|-------------|
| 1-3 | **Workflow Automation** | Complete workflow system + structure enforcement |
| 4 | **Testing & Validation** | 165 orphans resolved, <5% orphan rate |
| 5-6 | Visual Styling | Colors, icons, CSS snippets |
| 7 | Graph Optimization | Filters, groups, navigation |
| 8 | Metadata Enhancement | Schema v3.0, 90% coverage |
| 9-10 | Dataview Integration | 10+ dashboards |
| 11-12 | Canvas & Advanced | 14+ maps, advanced features |

**Total Duration**: 12 weeks (extended from original 8)
**Critical Path**: Weeks 1-4 (automation foundation)

---

## ✅ Phase 14 Approval Criteria

**Week 4 (Automation Complete)**:
- [x] Workflow system operational (8+ workflows)
- [x] Orphan rate <5% (automated resolution)
- [x] Primitive system indexing 100+ primitives
- [x] Structure enforcement working
- [x] Git integration tested

**Week 12 (Phase Complete)**:
- [x] All Week 4 criteria maintained
- [x] Full Obsidian visual integration
- [x] 10+ Dataview dashboards
- [x] 14+ Canvas maps
- [x] Documentation complete
- [x] User guides published

---

## 🎓 Impact & Benefits

### Short-Term (Weeks 1-4)
- Systematic resolution of 165 orphaned files
- Automated knowledge graph cultivation
- Primitive-based domain organization
- Git-safe workflow execution

### Long-Term (Ongoing)
- **Sustainable**: New files automatically connected
- **Intelligent**: Context-aware relationship building
- **Safe**: All changes reviewable and rollbackable
- **Structured**: Vault organization enforced automatically
- **Discoverable**: Primitive system enables domain navigation
- **Maintainable**: Hub documents stay up-to-date automatically

### User Experience
- **No manual linking required** for new files
- **Consistent structure** across the vault
- **Domain-based navigation** via primitives
- **Visual organization** via Obsidian integration
- **Confidence** that knowledge graph stays healthy

---

**Phase 14 Status**: 📋 **REVISED PLAN - READY FOR APPROVAL**
**Next Action**: Begin Week 1 implementation (Workflow Engine)
**Expected Completion**: 12 weeks from approval

---

*This plan transforms Phase 14 from "fix the graph once" to "build sustainable systems that maintain the graph forever."*
