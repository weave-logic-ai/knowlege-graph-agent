---
type: workflow
workflow_name: Obsidian Properties & Groups System
status: active
created_date: '2025-10-21'
priority: critical
tags:
  - workflow
  - obsidian
  - properties
  - groups
  - standards
  - mvp
icon: ⚙️
cssclasses:
  - workflow
  - critical
visual:
  icon: 🔄
  cssclasses:
    - type-workflow
    - status-active
    - priority-critical
version: '3.0'
updated_date: '2025-10-28'
---

# Obsidian Properties & Groups System

**Purpose**: Define comprehensive tagging, grouping, and property standards for Weave-NN knowledge graph organization in Obsidian.

**When to use**: When creating any node, establishing visual organization, or querying the graph.

---

## 🏷️ Tag System

### Tag Hierarchy

Tags use `/` for hierarchy in Obsidian:

```yaml
tags:
  - scope/mvp              # Current development scope
  - scope/future-web       # Future web version
  - type/feature           # Node type
  - status/active          # Current status
  - priority/critical      # Importance level
```

---

### Standard Tag Categories

#### 1. Scope Tags (Current vs Future)
```yaml
# Current Obsidian-based development
tags:
  - scope/mvp              # In 2-week MVP
  - scope/v1-1             # Post-MVP enhancements (month 2-3)
  - scope/obsidian-only    # Obsidian-specific features

# Future web version (deferred)
tags:
  - scope/future-web       # Web version features
  - scope/future-saas      # SaaS infrastructure
  - scope/future-mobile    # Mobile apps
  - scope/deferred         # Explicitly out of scope
```

**Usage**: Separate current work from future plans

---

#### 2. Type Tags (Node Classification)
```yaml
tags:
  - type/feature           # Feature nodes
  - type/decision          # Decision nodes
  - type/concept           # Concept explanations
  - type/architecture      # Architecture docs
  - type/workflow          # Process documentation
  - type/todo              # Task items
  - type/bug               # Bug reports
  - type/question          # Open questions
  - type/planning          # Planning docs
  - type/technology        # Tech stack items
  - type/business          # Business model docs
  - type/template          # Templates
```

---

#### 3. Status Tags
```yaml
tags:
  - status/planned         # Not started
  - status/in-progress     # Currently working
  - status/completed       # Done
  - status/blocked         # Cannot proceed
  - status/deferred        # Postponed
  - status/deprecated      # No longer relevant
```

---

#### 4. Priority Tags
```yaml
tags:
  - priority/critical      # Must have for MVP
  - priority/high          # Important but not blocking
  - priority/medium        # Nice to have
  - priority/low           # Future consideration
```

---

#### 5. Technology Tags
```yaml
tags:
  - tech/python            # Python-related
  - tech/obsidian          # Obsidian features/plugins
  - tech/mcp               # Model Context Protocol
  - tech/claude-flow       # Claude-Flow integration
  - tech/git               # Git/version control
  - tech/sqlite            # SQLite database
  - tech/supabase          # Supabase (future)
  - tech/react             # React (future web)
  - tech/nextjs            # Next.js (future web)
```

---

#### 6. Category Tags (Functional Area)
```yaml
tags:
  - category/ai            # AI/ML features
  - category/backend       # Backend services
  - category/frontend      # UI/UX (Obsidian or future web)
  - category/data          # Data/storage
  - category/task-mgmt     # Task management
  - category/collaboration # Team features
  - category/security      # Security/auth
  - category/integrations  # External integrations
```

---







## Related

[[day-2-rest-api-client]]
## Related

[[day-11-properties-visualization]]
## Related

[[canvas-creation-process]]
## 📊 Property Groups

Obsidian allows grouping properties for better organization:

### Group: Scope Management
```yaml
# Properties for scope tracking
scope:
  current_phase: "mvp"          # mvp | v1-1 | future-web
  obsidian_only: true           # Is this Obsidian-specific?
  web_version_needed: false     # Will web version need this?
  deferred: false               # Explicitly deferred?
```

**Usage**: Quickly identify what's in/out of scope

---

### Group: Node Metadata
```yaml
# Standard metadata for all nodes
metadata:
  type: "feature"               # Node type
  status: "planned"             # Current status
  priority: "critical"          # Importance
  created_date: "2025-10-21"
  updated_date: "2025-10-21"
  author: "Claude + User"
```

---

### Group: Technology Stack
```yaml
# Technology associations
tech_stack:
  languages:
    - python
    - markdown
  frameworks:
    - fastapi
    - claude-flow
  tools:
    - obsidian
    - git
    - mcp
```

---

### Group: Decision Tracking
```yaml
# For decision nodes
decision:
  decision_id: "ED-1"
  decision_type: "executive"    # executive | technical | feature | business
  status: "decided"             # open | researching | decided | deferred
  decided_date: "2025-10-21"
  selected_option: "A"
  confidence: "high"            # high | medium | low
```

---

### Group: Task Management
```yaml
# For task/todo nodes
task:
  task_id: "T-001"
  assignee: "User"
  due_date: "2025-10-25"
  estimated_hours: 4
  actual_hours: null
  blocked_by: []
  blocks: []
```

---

### Group: Issue Tracking
```yaml
# For bug/issue nodes
issue:
  issue_id: "BUG-001"
  severity: "high"              # critical | high | medium | low
  issue_type: "bug"             # bug | enhancement | question
  github_issue: null            # Link to GitHub issue #
  reproducible: true
  fixed_in_version: null
```

---

### Group: Feature Metadata
```yaml
# For feature nodes
feature:
  feature_id: "F-001"
  release: "mvp"                # mvp | v1-1 | v2-0 | future
  effort_estimate: "2-3 days"
  user_story: "As a user..."
  acceptance_criteria: []
  dependencies: []
```

---

### Group: Relationships
```yaml
# Node relationships
relationships:
  related_features: []
  related_decisions: []
  related_concepts: []
  blocks: []
  blocked_by: []
  depends_on: []
  enables: []
```

---

### Group: Visual Properties
```yaml
# Obsidian graph view appearance
visual:
  icon: "zap"                   # Lucide icon name
  cssclasses:
    - feature
    - mvp
    - critical
  color: "#FF6B6B"              # Hex color (optional)
```

---

## 🎨 CSS Classes for Colors

Define CSS classes in `.obsidian/snippets/graph-colors.css`:

```css
/* Scope-based colors */
.graph-view .scope-mvp { fill: #51CF66; }          /* Green - current work */
.graph-view .scope-future-web { fill: #ADB5BD; }  /* Gray - deferred */
.graph-view .scope-v1-1 { fill: #4DABF7; }        /* Blue - next phase */

/* Type-based colors */
.graph-view .type-feature { fill: #FF6B6B; }      /* Red - features */
.graph-view .type-decision { fill: #FFA94D; }     /* Orange - decisions */
.graph-view .type-concept { fill: #A78BFA; }      /* Purple - concepts */
.graph-view .type-architecture { fill: #06B6D4; } /* Cyan - architecture */
.graph-view .type-workflow { fill: #84CC16; }     /* Lime - workflows */
.graph-view .type-technology { fill: #8B5CF6; }   /* Violet - tech */
.graph-view .type-todo { fill: #FCD34D; }         /* Yellow - todos */
.graph-view .type-bug { fill: #EF4444; }          /* Dark red - bugs */

/* Status-based colors */
.graph-view .status-completed { fill: #10B981; }  /* Emerald - done */
.graph-view .status-in-progress { fill: #3B82F6; } /* Blue - active */
.graph-view .status-blocked { fill: #DC2626; }    /* Red - blocked */
.graph-view .status-planned { fill: #D1D5DB; }    /* Light gray - planned */

/* Priority-based colors */
.graph-view .priority-critical { fill: #DC2626; } /* Red - critical */
.graph-view .priority-high { fill: #F59E0B; }     /* Amber - high */
.graph-view .priority-medium { fill: #10B981; }   /* Green - medium */
.graph-view .priority-low { fill: #6B7280; }      /* Gray - low */
```

---

## 🔍 Tag-Based Queries

### Query: All MVP Features
```dataview
TABLE status, priority, effort_estimate
FROM #scope/mvp AND #type/feature
SORT priority ASC, status ASC
```

### Query: Future Web Version Items
```dataview
LIST
FROM #scope/future-web
GROUP BY type
```

### Query: Critical Issues/Blockers
```dataview
TABLE status, severity, blocked_by
FROM #type/bug OR #status/blocked
WHERE priority = "critical"
SORT severity DESC
```

### Query: Open Decisions
```dataview
TABLE decision_type, confidence
FROM #type/decision
WHERE status != "decided"
SORT priority ASC
```

### Query: Technology Stack Overview
```dataview
TABLE tech_stack.languages, tech_stack.frameworks
FROM #type/technology
WHERE scope/mvp
```

---

## 📋 Example: Complete Feature Node Properties

```yaml
---
# Node Metadata (Group: metadata)
type: feature
status: planned
priority: critical
created_date: "2025-10-21"
updated_date: "2025-10-21"

# Feature-Specific (Group: feature)
feature_id: "F-034"
feature_name: "MCP Server File Operations"
release: "mvp"
effort_estimate: "1 day"

# Scope (Group: scope)
scope:
  current_phase: "mvp"
  obsidian_only: false
  web_version_needed: true
  deferred: false

# Technology (Group: tech_stack)
tech_stack:
  languages:
    - python
  frameworks:
    - fastapi
    - mcp-sdk
  tools:
    - obsidian
    - git

# Relationships (Group: relationships)
relationships:
  related_features:
    - "F-005" # Basic AI integration
  related_decisions:
    - "TS-3" # Backend architecture
  depends_on:
    - "F-005"
  enables:
    - "F-035" # MCP task operations

# Visual (Group: visual)
visual:
  icon: "server"
  cssclasses:
    - feature
    - mvp
    - critical
    - backend

# Tags
tags:
  - scope/mvp
  - type/feature
  - status/planned
  - priority/critical
  - tech/python
  - tech/mcp
  - category/backend
  - category/ai
---
```

---

## 🎯 Benefits of This System

### 1. Visual Separation
- **Green nodes** = Current MVP work
- **Gray nodes** = Future web version
- **Blue nodes** = Post-MVP v1.1

### 2. Easy Filtering
```
# Show only MVP features
tag:#scope/mvp tag:#type/feature

# Show only future web items
tag:#scope/future-web

# Show critical todos
tag:#type/todo tag:#priority/critical
```

### 3. Agent Queries
MCP server can query by tags:
```python
# Get all MVP features
mvp_features = mcp.search_tags(["scope/mvp", "type/feature"])

# Get all open decisions
decisions = mcp.search_tags(["type/decision", "status/open"])

# Get all bugs
bugs = mcp.search_tags(["type/bug"])
```

### 4. Dataview Reports
Create dashboard notes with queries:
```markdown
# MVP Dashboard

## 📋 Features
```dataview
TABLE status, priority, effort_estimate
FROM #scope/mvp AND #type/feature
```

## ❌ Blockers
```dataview
LIST
FROM #status/blocked
```

## 🚀 Completed This Week
```dataview
LIST
FROM #status/completed
WHERE updated_date >= date(today) - dur(7 days)
```
```

---

## 🔧 Implementation Checklist

- [ ] Create `.obsidian/snippets/graph-colors.css` with color definitions
- [ ] Enable CSS snippets in Obsidian settings
- [ ] Update all existing nodes with new tag structure
- [ ] Create tag templates in node creation workflow
- [ ] Add tag validation to MCP server
- [ ] Create dashboard notes with Dataview queries
- [ ] Document tag system for team
- [ ] Add auto-tagging agent rule (suggests tags based on content)

---

## 🔗 Related

- [[obsidian-properties-standard|Obsidian Properties Standard]] - Original properties doc
- [[node-creation-process|Node Creation Process]] - Use tags when creating
- [[obsidian-first-architecture|Obsidian-First Architecture]] - Why this matters
- [[../features/basic-ai-integration-mcp|MCP Integration]] - Agent tag queries

---

**Status**: Active - Use for all new nodes
**Priority**: Critical (enables organization)
**Next**: Apply to all existing nodes in bulk update
