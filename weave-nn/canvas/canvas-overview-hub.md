---
type: canvas-hub
status: active
created_date: '2025-10-20'
tags:
  - canvas
  - visualization
  - workflows
scope: system
priority: high
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-canvas-hub
    - status-active
    - priority-high
  graph_group: navigation
version: '3.0'
updated_date: '2025-10-28'
---

# Canvas Hub

**Purpose**: Visual representations of complex relationships, decision trees, workflows, and planning structures using Obsidian Canvas.

---

## 📊 Available Canvases

### Decision Trees
- [[decision-tree-tech-stack|Tech Stack Decision Tree]] - Frontend, backend, graph, database choices
- [[decision-tree-platform-comparison|Platform Comparison]] - Obsidian vs Notion vs Custom
- [[decision-tree-mvp-scope|MVP Scope Decision Tree]] - Feature prioritization flow

### Workflows
- [[workflow-ai-knowledge-graph-update|AI Knowledge Graph Update Flow]] - How AI agents edit the graph
- [[workflow-daily-planning|Daily Planning Workflow]] - Todo → Work → Log → Commit
- [[workflow-decision-making|Decision Making Process]] - Question → Research → Decide → Implement

### Project Views
- [[project-overview|Project Overview]] - High-level architecture and goals
- [[phase-2-node-expansion-board|Phase 2 Task Board]] - Kanban-style todo tracking
- [[critical-path|Critical Path Analysis]] - Blocking decisions and dependencies

### Knowledge Clusters
- [[concept-map|Core Concepts Map]] - Relationships between fundamental ideas
- [[mcp-integration-architecture|MCP Integration Architecture]] - How AI agents connect
- [[tech-stack-options|Tech Stack Options Grid]] - All technology choices visualized

---

## 🎨 Canvas Types

### 1. Decision Trees
**Purpose**: Visualize bifurcated decision flows with pros/cons and dependencies

**Structure**:
```
[Decision Node]
    ├─ Option A
    │   ├─ Pros
    │   ├─ Cons
    │   └─ Leads to → [Dependent Decision]
    └─ Option B
        ├─ Pros
        ├─ Cons
        └─ Leads to → [Alternative Path]
```

**Best For**:
- Tech stack choices (TS-1, TS-2)
- Platform comparisons
- Feature prioritization

---

### 2. Workflow Diagrams
**Purpose**: Show step-by-step processes and data flows

**Structure**:
```
[Trigger] → [Step 1] → [Step 2] → [Decision Point]
                                      ├─ Yes → [Path A]
                                      └─ No → [Path B]
```

**Best For**:
- AI agent workflows
- Daily planning routines
- Decision-making processes

---

### 3. Task Boards
**Purpose**: Kanban-style tracking of todos with status and links

**Structure**:
```
┌──────────┬──────────┬──────────┬──────────┐
│ Backlog  │  Todo    │ Progress │   Done   │
├──────────┼──────────┼──────────┼──────────┤
│ [Task 1] │ [Task 4] │ [Task 6] │ [Task 8] │
│ [Task 2] │ [Task 5] │ [Task 7] │ [Task 9] │
│ [Task 3] │          │          │          │
└──────────┴──────────┴──────────┴──────────┘
```

**Best For**:
- Phase tracking
- Sprint planning
- Feature development

---

### 4. Concept Maps
**Purpose**: Visualize relationships between concepts, not hierarchies

**Structure**:
```
[Central Concept]
    ↕
[Related A] ← → [Related B]
    ↕             ↕
[Detail 1]    [Detail 2]
```

**Best For**:
- Understanding core ideas
- Showing bidirectional relationships
- Learning complex topics

---

### 5. Architecture Diagrams
**Purpose**: System components and data flows

**Structure**:
```
┌─────────────────────────────────┐
│       Frontend Layer            │
├─────────────────────────────────┤
│         API Layer               │
├─────────────────────────────────┤
│    Data/Knowledge Layer         │
├─────────────────────────────────┤
│    AI Integration Layer         │
└─────────────────────────────────┘
```

**Best For**:
- System architecture
- Integration points
- Technical documentation

---

## 🔗 Integration with Knowledge Graph

### Canvas ↔ Nodes
- Canvas cards link to markdown nodes using `[[wikilinks]]`
- Nodes reference canvases in frontmatter: `canvas: decision-tree-tech-stack`
- Bidirectional navigation

### Canvas ↔ Planning
- Task boards pull from `_planning/phases/` todos
- Daily logs reference workflow canvases
- Milestones shown on project overview canvas

### Canvas ↔ Decisions
- Decision nodes embedded in decision tree canvases
- Questions linked to research workflow canvas
- Blockers visualized on critical path canvas

---

## 📋 Canvas Creation Guidelines

### When to Create a Canvas
- **Complex relationships** that are hard to explain in text
- **Decision trees** with multiple branches and dependencies
- **Workflows** with conditional logic
- **Task tracking** for phases or sprints
- **System architecture** with multiple layers
- **Concept clusters** with many interconnections

### When to Use Markdown Instead
- Linear explanations
- Single concept definitions
- Simple lists
- Text-heavy documentation

---

## 🎯 Priority Canvases to Create

### Immediate (This Session)
1. [[decision-tree-tech-stack]] - TS-1 decision blocking everything
2. [[workflow-daily-planning]] - Standardize daily workflow
3. [[phase-2-node-expansion-board]] - Track current work

### Short-term (This Week)
4. [[critical-path]] - Visualize all blockers
5. [[mcp-integration-architecture]] - How AI agents work
6. [[concept-map]] - Core ideas relationships

### Medium-term (This Month)
7. [[tech-stack-options]] - All technology choices
8. [[project-overview]] - High-level vision
9. [[workflow-ai-knowledge-graph-update]] - AI editing flow

---

## 💡 Canvas Best Practices

### Visual Hierarchy
- Use **color coding** for status (green=done, yellow=in-progress, red=blocked)
- Use **size** for importance (larger cards = higher priority)
- Use **grouping** for related items (boxes or proximity)

### Linking
- Link cards to nodes: `[[concepts/weave-nn]]`
- Link to decisions: `[[decisions/technical/frontend-framework]]`
- Link to planning: `[[_planning/phases/phase-2-node-expansion]]`

### Labels
- Add status labels: ✅ Done, ⏳ In Progress, ❌ Blocked, ⏰ Pending
- Add priority: 🔴 Critical, 🟡 High, 🔵 Medium, ⚪ Low
- Add type: 📝 Note, 🎯 Decision, 📋 Todo, 💡 Idea

### Updates
- Update canvas as work progresses
- Move cards between columns on task boards
- Add checkmarks to decision trees as decisions are made
- Link to daily logs when work is completed

---

## 🔍 Finding Canvases

### By Type
- Decision Trees: Look in `/canvas` for `decision-tree-*`
- Workflows: Look for `workflow-*`
- Task Boards: Look for phase names
- Architecture: Look for `architecture` or component names

### By Topic
- Tech decisions: `decision-tree-tech-stack`
- Planning: `workflow-daily-planning`, `phase-*-board`
- Concepts: `concept-map`, `*-architecture`

### By Status
- Check canvas frontmatter for `status: active|archived|draft`

---

## 📚 Related Documentation

- [[../README|Knowledge Graph Entry]]
- [[../_planning/README|Planning Hub]]
- [[../meta/DECISIONS-INDEX|Decision Dashboard]]

---

**Note**: Canvases are `.canvas` files that Obsidian creates. They contain JSON but render visually in Obsidian. Reference them using `[[canvas-name]]` without the `.canvas` extension.
