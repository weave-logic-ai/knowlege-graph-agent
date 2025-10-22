---
type: workflow
workflow_name: "Canvas Creation Process"
status: active
created_date: "2025-10-20"
complexity: moderate
estimated_time: "30-60 minutes per canvas"

tags:
  - workflow
  - canvas
  - visualization
  - obsidian
---

# Canvas Creation Process

**Purpose**: Step-by-step workflow for creating Obsidian canvases to visualize complex structures like decision trees, workflows, and architecture diagrams.

**When to use**: When text alone doesn't effectively communicate relationships, hierarchies, or flows.

**Outcome**: Visual canvas that enhances understanding and is integrated with the knowledge graph.

---

## 📋 Process Overview

```
Identify Need → Choose Type → Create Structure → Add Nodes → Connect → Style → Link → Review
```

**Estimated Time**: 30-60 minutes depending on complexity

---

## 🔄 Detailed Workflow

### Step 1: Identify Visualization Need
**Goal**: Determine what requires visual representation

**Actions**:
- [ ] Identify the concept that's hard to explain with text
- [ ] Determine the type of visualization needed
- [ ] Check if a canvas already exists for this
- [ ] Decide on canvas scope (narrow vs comprehensive)

**Questions to answer**:
- What am I trying to show? (relationships, flow, hierarchy, timeline?)
- Who is the audience? (self, team, stakeholders?)
- How complex is the structure? (simple tree vs multi-dimensional graph?)

**Common triggers**:
- Decision with 3+ options and dependencies
- Workflow with 5+ steps and branches
- Architecture with multiple layers
- Complex relationships between many nodes

**Output**: Clear purpose and canvas type identified

**Time**: 5-10 minutes

---

### Step 2: Choose Canvas Type
**Goal**: Select the appropriate canvas structure

**Canvas Types**:

**A. Decision Tree Canvas**
- **Use for**: Decisions with multiple options and paths
- **Structure**: Root decision → Options → Consequences/Dependencies
- **Example**: `decision-tree-tech-stack.canvas`

**B. Workflow Diagram Canvas**
- **Use for**: Step-by-step processes with branches
- **Structure**: Start → Steps → Decisions → End
- **Example**: `workflow-daily-planning.canvas`

**C. Task Board Canvas**
- **Use for**: Kanban-style task tracking
- **Structure**: Backlog | Todo | In Progress | Done
- **Example**: `phase-2-node-expansion-board.canvas`

**D. Architecture Diagram Canvas**
- **Use for**: System layers and components
- **Structure**: Layers (horizontal) or Services (boxes with connections)
- **Example**: To create for Weave-NN architecture

**E. Concept Map Canvas**
- **Use for**: Relationships between concepts
- **Structure**: Central concept → Related concepts with labeled edges

**F. Timeline Canvas**
- **Use for**: Chronological events or phases
- **Structure**: Left-to-right timeline with milestones

**Output**: Canvas type selected

**Time**: 5 minutes

---

### Step 3: Create Canvas File
**Goal**: Initialize the canvas in Obsidian

**Actions**:
- [ ] Create new canvas file: `canvas/[name].canvas`
- [ ] Use descriptive, kebab-case naming
- [ ] Add to canvas/ folder (or appropriate subfolder)

**Naming conventions**:
- Decision trees: `decision-tree-[topic].canvas`
- Workflows: `workflow-[process-name].canvas`
- Architecture: `architecture-[layer/system].canvas`
- Task boards: `[phase-name]-board.canvas`
- Concept maps: `concept-map-[topic].canvas`

**Example names**:
- `decision-tree-frontend-framework.canvas`
- `workflow-node-creation.canvas`
- `architecture-weave-nn-layers.canvas`
- `phase-3-expansion-board.canvas`

**Output**: Empty canvas file created

**Time**: 2 minutes

---

### Step 4: Add Structure and Nodes
**Goal**: Build the canvas content

**Node Types in Obsidian Canvas**:
1. **File nodes**: Link to existing markdown files
2. **Text nodes**: Add explanatory text, labels, or summaries
3. **Media nodes**: Embed images or other files

**Adding nodes**:
- [ ] **For decision trees**: Add decision node (file), option cards (text), impact nodes (files)
- [ ] **For workflows**: Add step cards (text or files), decision diamonds (text), start/end markers
- [ ] **For task boards**: Create 4 columns (text headers), add task cards (files or text)
- [ ] **For architecture**: Add layer boxes (text), component nodes (files), connections

**Best practices**:
- Start with high-level structure (columns, layers, major sections)
- Add detailed nodes after structure is clear
- Use file nodes when linking to existing knowledge graph nodes
- Use text nodes for explanations that don't need a separate file
- Keep text concise (1-3 lines per card)

**Color coding**:
- Use Obsidian canvas colors to distinguish node types
- Example: Green for decided options, Yellow for pending, Red for rejected
- Be consistent within a canvas

**Output**: Canvas populated with nodes

**Time**: 15-30 minutes

---

### Step 5: Connect Nodes
**Goal**: Show relationships and flow

**Adding connections**:
- [ ] Draw arrows between related nodes
- [ ] Add labels to edges when needed (e.g., "if yes", "depends on")
- [ ] Use arrow direction to show flow or dependency
- [ ] Group related nodes visually (proximity, color, cards)

**Connection patterns**:

**Decision Trees**:
```
[Decision] → [Option A] → [Impact 1]
          → [Option B] → [Impact 2]
          → [Option C] → [Impact 3]
```

**Workflows**:
```
[Start] → [Step 1] → [Step 2] → [Decision] → [Step 3a] → [End]
                              ↓
                          [Step 3b] → [End]
```

**Task Boards**:
```
[Backlog] → [Todo] → [In Progress] → [Done]
   (no arrows needed, columns show flow)
```

**Architecture**:
```
[Frontend] ↔ [API] ↔ [Data Layer]
              ↓
          [AI Integration]
```

**Edge labels**:
- "if React" / "if Svelte"
- "depends on"
- "blocks"
- "implements"
- "uses"

**Output**: Nodes connected with meaningful relationships

**Time**: 10-15 minutes

---

### Step 6: Style and Organize
**Goal**: Make canvas visually clear and professional

**Layout**:
- [ ] Arrange nodes in logical flow (left-to-right for timeline, top-to-bottom for hierarchy)
- [ ] Align nodes for clean appearance
- [ ] Use consistent spacing
- [ ] Group related items

**Visual hierarchy**:
- Larger cards for more important nodes
- Color coding for status or type
- Bold or larger text for titles/headers

**Labels and annotations**:
- Add text cards for section headers
- Add notes or explanations where needed
- Use emoji for visual cues (✅, ⚠️, 🔴, 🟡, 🟢)

**Zoom and fit**:
- Ensure canvas is readable at default zoom
- Not too cramped, not too sparse

**Output**: Clean, organized canvas

**Time**: 5-10 minutes

---

### Step 7: Link to Knowledge Graph
**Goal**: Integrate canvas with markdown nodes

**Actions**:
- [ ] Create a markdown file that embeds the canvas (if needed)
- [ ] Add wikilinks from related nodes to the canvas
- [ ] Reference the canvas in relevant workflows or decisions

**Example integration**:
```markdown
# Frontend Framework Decision

See the decision tree visualization:
![[decision-tree-frontend-framework.canvas]]

## Options
[Discussion of options...]
```

**Linking patterns**:
- Decision nodes link to their decision tree canvas
- Workflow nodes embed their workflow diagram canvas
- Phase documents link to task board canvases

**Output**: Canvas integrated with knowledge graph

**Time**: 5 minutes

---

### Step 8: Review and Validate
**Goal**: Ensure canvas is accurate and useful

**Checklist**:
- [ ] All nodes are labeled clearly
- [ ] Connections show correct relationships
- [ ] Flow/hierarchy is logical
- [ ] Color coding is consistent
- [ ] No broken file links
- [ ] Canvas loads without errors
- [ ] Readable at normal zoom
- [ ] Accurate representation of the concept

**Common issues**:
- Broken wikilinks in file nodes
- Unclear connection labels
- Too cluttered (simplify or split into multiple canvases)
- Missing key information

**Output**: Validated, high-quality canvas

**Time**: 5-10 minutes

---

## 🎯 Quality Standards

### Excellent Canvas
- [ ] Clear purpose stated (in linked markdown or README)
- [ ] Logical flow or structure
- [ ] 10-20 nodes (not too simple, not overwhelming)
- [ ] Meaningful connections with labels
- [ ] Consistent visual style
- [ ] Color-coded appropriately
- [ ] Integrated with knowledge graph (wikilinks)
- [ ] Self-explanatory (someone unfamiliar can understand)

### Acceptable Canvas
- [ ] Shows the concept clearly
- [ ] 5-10 nodes
- [ ] Basic connections
- [ ] Readable layout

### Needs Improvement
- Too cluttered (30+ nodes, hard to read)
- No clear structure
- Broken file links
- Unclear purpose

---

## 📊 Canvas Metrics

### Typical Creation Time
- **Simple canvas** (decision tree, 3 options): 30 minutes
- **Moderate canvas** (workflow, 10 steps): 45 minutes
- **Complex canvas** (architecture, multiple layers): 60+ minutes

### Canvas Complexity
- **Simple**: 5-10 nodes, single flow
- **Moderate**: 10-20 nodes, some branches
- **Complex**: 20-30 nodes, multi-dimensional

### Update Frequency
- **Decision trees**: Update when decision changes
- **Task boards**: Update daily/weekly as tasks move
- **Architecture**: Update when design changes
- **Workflows**: Update when process changes

---

## 🔄 Canvas Types in Detail

### Decision Tree Canvas Template

**Structure**:
```
                [Decision Node (file)]
                        ↓
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
   [Option A]      [Option B]      [Option C]
    (text card)     (text card)     (text card)
    ✅ Pro 1         ✅ Pro 1         ✅ Pro 1
    ✅ Pro 2         ✅ Pro 2         ✅ Pro 2
    ❌ Con 1         ❌ Con 1         ❌ Con 1
        ↓               ↓               ↓
   [Impacts]       [Impacts]       [Impacts]
```

**Use for**: TS-1 (Frontend), TS-2 (Graph Viz), major architectural decisions

---

### Workflow Diagram Canvas Template

**Structure**:
```
[Start] → [Step 1] → [Step 2] → [Decision?] → [Step 3a] → [End]
                                    ↓
                                [Step 3b] → [End]
```

**Use for**: Node creation process, decision-making process, git workflow

---

### Task Board Canvas Template

**Structure**:
```
┌─────────┬──────┬────────────┬──────┐
│ Backlog │ Todo │ In Progress│ Done │
├─────────┼──────┼────────────┼──────┤
│ [Task]  │[Task]│   [Task]   │[Task]│
│ [Task]  │[Task]│   [Task]   │[Task]│
│ [Task]  │      │            │[Task]│
└─────────┴──────┴────────────┴──────┘
```

**Use for**: Phase tracking, sprint boards, feature development tracking

---

### Architecture Diagram Canvas Template

**Structure**:
```
┌─────────────────────────────────────┐
│      Frontend Layer                 │
│  [Components] [State] [Router]      │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      API Layer                      │
│  [REST] [GraphQL] [WebSockets]      │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│      Data Layer                     │
│  [Database] [Cache] [Storage]       │
└─────────────────────────────────────┘
```

**Use for**: System architecture, layer diagrams, component relationships

---

## 🚨 Common Pitfalls

### Pitfall 1: Too Many Nodes
**Problem**: Canvas has 40+ nodes, impossible to read

**Solution**:
- Split into multiple canvases (one per layer, one per phase)
- Increase abstraction level
- Use nested canvases (link to detail canvases)

---

### Pitfall 2: Unclear Connections
**Problem**: Arrows everywhere, unclear what connects to what

**Solution**:
- Add labels to edges
- Use different arrow styles for different relationship types
- Reduce number of connections (only show important ones)
- Consider using layers/groups

---

### Pitfall 3: No Integration with Graph
**Problem**: Canvas exists in isolation, not linked from markdown

**Solution**:
- Create a markdown file that embeds the canvas
- Add wikilinks from relevant nodes
- Reference in README or hub documents

---

### Pitfall 4: Broken File Links
**Problem**: File nodes link to non-existent files

**Solution**:
- Create placeholder nodes for missing files
- Use text nodes instead of file nodes for concepts without dedicated pages
- Validate all links after creating canvas

---

### Pitfall 5: Inconsistent Style
**Problem**: Random colors, sizes, layouts

**Solution**:
- Define color scheme before starting
- Use consistent node sizes for same type
- Align nodes to grid
- Follow established patterns (decision tree, workflow, etc.)

---

## 🔗 Related

- [[node-creation-process|Node Creation Process]]
- [[decision-making-process|Decision Making Process]]
- [[obsidian-properties-standard|Obsidian Properties]]
- [[../canvas/README|Canvas Hub]]

---

## 📚 Examples to Study

### Existing Canvases
- [[../canvas/decision-tree-tech-stack|Tech Stack Decision Tree]]
- [[../canvas/workflow-daily-planning|Daily Planning Workflow]]
- [[../canvas/phase-2-node-expansion-board|Phase 2 Task Board]]

### Study These For
- Layout and organization
- Color coding schemes
- Connection labeling
- Node sizing and spacing

---

**Process Owner**: Documentation Team
**Last Updated**: 2025-10-20
**Status**: Active
**Version**: 1.0
