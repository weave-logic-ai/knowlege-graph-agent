---
type: workflow
workflow_name: Obsidian Properties Standard
status: active
created_date: '2025-10-20'
icon: settings
cssclasses:
  - workflow
  - standard
tags:
  - workflow
  - obsidian
  - properties
  - standard
  - formatting
visual:
  icon: "\U0001F504"
  cssclasses:
    - type-workflow
    - status-active
version: '3.0'
updated_date: '2025-10-28'
---

# Obsidian Properties Standard

**Purpose**: Define standard Obsidian properties for all node types to enable icons, colors, and consistent formatting across the knowledge graph.

**Status**: ✅ **ACTIVE** - To be applied to all nodes
**Reference**: [Obsidian Help - Properties](https://help.obsidian.md/properties)

---

## 🎯 Core Principles

1. **Use Properties Over YAML Comments**: Obsidian properties are first-class citizens, shown in UI
2. **Icons for Major Concepts**: Add visual identity to important nodes
3. **Color Groups**: Organize nodes by type/category using cssclasses
4. **Standard Lucide Icons**: Use built-in icon set (1,700+ icons)
5. **Consistency**: All nodes of same type use same icon/color scheme

---

## 📋 Standard Properties by Node Type

### Concept Nodes

```yaml
---
type: concept
concept_id: "C-XXX"
concept_name: "[Name]"
icon: lightbulb          # 💡 Lucide icon for concepts
status: active
category: core-concept
created_date: "YYYY-MM-DD"
cssclasses:
  - concept
  - [category]

tags:
  - concept
  - [domain]
  - [specific]
---
```

**Icon Options for Concepts**:
- `lightbulb` - General concepts
- `brain` - Core knowledge concepts
- `book-open` - Learning/educational concepts
- `sparkles` - Innovative concepts
- `network` - System/architecture concepts

**CSS Classes**: `concept`, `core`, `advanced`, etc.

---

### Platform Nodes

```yaml
---
type: platform
platform_id: "P-XXX"
platform_name: "[Name]"
icon: box                # 📦 Lucide icon for platforms
status: evaluated
category: tool
architecture: local-first
created_date: "YYYY-MM-DD"
cssclasses:
  - platform
  - [architecture-type]

tags:
  - platform
  - [category]
  - [tech-stack]
---
```

**Icon Options for Platforms**:
- `box` - General platforms
- `package` - Software packages
- `server` - Backend services
- `cloud` - Cloud platforms
- `database` - Database platforms

**CSS Classes**: `platform`, `local-first`, `cloud-based`, `saas`

---

### Technical Nodes

```yaml
---
type: technical
technical_id: "T-XXX"
technical_name: "[Name]"
icon: code               # 💻 Lucide icon for technical
status: evaluated
category: library
language: JavaScript
created_date: "YYYY-MM-DD"
cssclasses:
  - technical
  - [language]
  - [category]

tags:
  - technical
  - [language]
  - [framework]
---
```

**Icon Options for Technical**:
- `code` - Libraries/frameworks
- `cpu` - Performance/infrastructure
- `git-branch` - Version control
- `terminal` - CLI tools
- `wrench` - Build tools

**CSS Classes**: `technical`, `library`, `framework`, `tool`

---

### Feature Nodes

```yaml
---
type: feature
feature_id: "F-XXX"
feature_name: "[Name]"
icon: zap                # ⚡ Lucide icon for features
category: knowledge-graph
status: planned
priority: high
release: mvp
complexity: moderate
created_date: "YYYY-MM-DD"
cssclasses:
  - feature
  - [release]
  - [priority]

tags:
  - feature
  - [category]
  - [release]
---
```

**Icon Options for Features**:
- `zap` - High-priority features
- `star` - MVP features
- `rocket` - Launch features
- `sparkles` - New features
- `layers` - Infrastructure features

**CSS Classes**: `feature`, `mvp`, `v1-1`, `v2-0`, `critical`, `high`, `medium`, `low`

---

### Decision Nodes

```yaml
---
type: decision
decision_id: "[ED|TS|FP|BM|OP]-XXX"
decision_type: executive
title: "[Decision Title]"
icon: help-circle        # ❓ Lucide icon for decisions
status: open
priority: critical
category: strategic
created_date: "YYYY-MM-DD"
decided_date: null
cssclasses:
  - decision
  - [decision_type]
  - [status]
  - [priority]

tags:
  - decision
  - [type]
  - [status]
---
```

**Icon Options for Decisions**:
- `help-circle` - Open decisions
- `check-circle` - Decided
- `x-circle` - Deferred
- `alert-circle` - Critical decisions
- `git-branch` - Decision trees

**CSS Classes**: `decision`, `open`, `decided`, `deferred`, `critical`, `high`

---

### Workflow Nodes

```yaml
---
type: workflow
workflow_name: "[Name]"
icon: workflow           # 🔄 Lucide icon for workflows
status: active
created_date: "YYYY-MM-DD"
complexity: moderate
estimated_time: "[time]"
cssclasses:
  - workflow
  - process

tags:
  - workflow
  - process
  - [domain]
---
```

**Icon Options for Workflows**:
- `workflow` - General workflows
- `git-merge` - Process flows
- `repeat` - Iterative workflows
- `list-checks` - Checklists
- `map` - Journey maps

**CSS Classes**: `workflow`, `process`, `active`, `deprecated`

---

### Question Nodes

```yaml
---
type: question
question_id: "Q-[CATEGORY]-XXX"
question_type: technical
icon: message-circle     # 💬 Lucide icon for questions
status: open
priority: high
confidence: medium
created_date: "YYYY-MM-DD"
answered_date: null
cssclasses:
  - question
  - [status]
  - [confidence]

tags:
  - question
  - [category]
  - [status]
---
```

**Icon Options for Questions**:
- `message-circle` - Open questions
- `check-square` - Answered questions
- `alert-triangle` - Urgent questions
- `search` - Research questions
- `lightbulb` - Suggestions

**CSS Classes**: `question`, `open`, `answered`, `high-confidence`, `medium-confidence`, `low-confidence`

---

### Planning Nodes

```yaml
---
type: planning
phase_id: "PHASE-X"
phase_name: "[Name]"
icon: calendar           # 📅 Lucide icon for planning
status: in-progress
priority: critical
start_date: "YYYY-MM-DD"
end_date: null
cssclasses:
  - planning
  - phase
  - [status]

tags:
  - phase
  - planning
  - [status]
---
```

**Icon Options for Planning**:
- `calendar` - Phases/milestones
- `target` - Goals
- `list-todo` - Task lists
- `gantt-chart` - Project plans
- `milestone` - Milestones

**CSS Classes**: `planning`, `phase`, `milestone`, `in-progress`, `completed`, `blocked`

---

## 🎨 Color Coding via CSS Classes

### Status Colors

```css
/* In custom CSS snippet */
.cssclasses-open { color: var(--color-yellow); }
.cssclasses-in-progress { color: var(--color-blue); }
.cssclasses-completed { color: var(--color-green); }
.cssclasses-blocked { color: var(--color-red); }
.cssclasses-deferred { color: var(--color-gray); }
```

### Priority Colors

```css
.cssclasses-critical { color: var(--color-red); }
.cssclasses-high { color: var(--color-orange); }
.cssclasses-medium { color: var(--color-yellow); }
.cssclasses-low { color: var(--color-gray); }
```

### Type Colors

```css
.cssclasses-concept { color: var(--color-purple); }
.cssclasses-technical { color: var(--color-blue); }
.cssclasses-feature { color: var(--color-green); }
.cssclasses-decision { color: var(--color-orange); }
.cssclasses-workflow { color: var(--color-cyan); }
```

**File Location**: `.obsidian/snippets/weave-nn-colors.css` (to be created)

---

## 📐 Lucide Icon Reference

### Most Common Icons for Weave-NN

| Icon Name | Symbol | Use Case |
|-----------|--------|----------|
| `lightbulb` | 💡 | Concepts, ideas |
| `code` | 💻 | Technical, libraries |
| `box` | 📦 | Platforms, packages |
| `zap` | ⚡ | Features, capabilities |
| `help-circle` | ❓ | Decisions (open) |
| `check-circle` | ✅ | Decisions (decided) |
| `workflow` | 🔄 | Workflows, processes |
| `message-circle` | 💬 | Questions |
| `calendar` | 📅 | Planning, phases |
| `brain` | 🧠 | AI, knowledge |
| `network` | 🕸️ | Graph, architecture |
| `git-branch` | 🌿 | Version control, trees |
| `database` | 💾 | Data, storage |
| `rocket` | 🚀 | Launch, deployment |
| `star` | ⭐ | Important, MVP |
| `sparkles` | ✨ | New, innovative |
| `book-open` | 📖 | Documentation |
| `alert-circle` | ⚠️ | Warnings, critical |
| `target` | 🎯 | Goals, objectives |
| `layers` | 📚 | Stacks, architecture |

**Full list**: [Lucide Icons](https://lucide.dev/icons/)

---

## 🔧 Implementation Plan

### Phase 1: Update Templates ✅

Update all 8 templates with standard properties:
- [x] concept-node-template.md - Add `icon: lightbulb`
- [x] platform-node-template.md - Add `icon: box`
- [x] technical-node-template.md - Add `icon: code`
- [x] feature-node-template.md - Add `icon: zap`
- [x] decision-node-template.md - Add `icon: help-circle`
- [x] workflow-node-template.md - Add `icon: workflow`
- [x] question-node-template.md - Add `icon: message-circle`
- [x] planning-node-template.md - Add `icon: calendar`

### Phase 2: Update Existing Nodes

Batch update all existing nodes with icons:

**Concepts** (5 nodes):
- [ ] concepts/weave-nn.md → `icon: brain`
- [ ] concepts/knowledge-graph.md → `icon: network`
- [ ] concepts/wikilinks.md → `icon: link`
- [ ] concepts/ai-generated-documentation.md → `icon: sparkles`
- [ ] concepts/temporal-queries.md → `icon: clock`

**Platforms** (3 nodes):
- [ ] platforms/obsidian.md → `icon: box`
- [ ] platforms/notion.md → `icon: cloud`
- [ ] platforms/custom-solution.md → `icon: rocket`

**Technical** (6 nodes):
- [ ] technical/react-flow.md → `icon: code`
- [ ] technical/svelte-flow.md → `icon: code`
- [ ] technical/graphiti.md → `icon: database`
- [ ] technical/tiptap-editor.md → `icon: edit`
- [ ] technical/supabase.md → `icon: server`
- [ ] technical/postgresql.md → `icon: database`

**Features** (31 nodes):
- [ ] All MVP features → `icon: star`
- [ ] All v1.1 features → `icon: zap`
- [ ] All v2.0 features → `icon: sparkles`

**Decisions** (1 node):
- [ ] decisions/executive/project-scope.md → `icon: check-circle` (decided)

**Workflows** (3 nodes):
- [ ] workflows/node-creation-process.md → `icon: workflow`
- [ ] workflows/decision-making-process.md → `icon: git-branch`
- [ ] workflows/suggestion-pattern.md → `icon: message-circle`

### Phase 3: Create CSS Snippet

Create `.obsidian/snippets/weave-nn-colors.css` with color coding for:
- Status colors (open, in-progress, completed, blocked, deferred)
- Priority colors (critical, high, medium, low)
- Type colors (concept, technical, feature, decision, workflow)

### Phase 4: Enable CSS Snippet

In Obsidian settings:
1. Appearance → CSS Snippets
2. Enable "weave-nn-colors"
3. Verify colors show in graph view

---

## 📊 Property Validation

### Required Properties (All Nodes)

- `type` - Node classification
- `created_date` - ISO format (YYYY-MM-DD)
- `tags` - Array of at least 2 tags
- `icon` - Lucide icon name (for major nodes)
- `cssclasses` - Array for color coding

### Optional Properties (Contextual)

- `status` - Current state
- `priority` - Importance level
- `complexity` - Difficulty/size estimate
- `release` - Target version
- `category` - Sub-classification
- Various type-specific IDs and fields

---

## 🎯 Benefits

### Visual Organization

1. **Graph View**: Icons make node types instantly recognizable
2. **File Explorer**: Icons help navigate folder structure
3. **Search Results**: Icons provide visual context
4. **Backlinks**: Icons show relationship types

### Filtering & Querying

```dataview
TABLE icon, status, priority
FROM "features"
WHERE status = "planned"
SORT priority DESC
```

### Color Coding

- **Status at a glance**: Green (done), Blue (in progress), Yellow (open)
- **Priority visibility**: Red (critical), Orange (high), Gray (low)
- **Type distinction**: Purple (concepts), Blue (technical), Green (features)

---

## Visualization Implementation

**Status**: ✅ **IMPLEMENTED** - PropertyVisualizer.js complete
**Location**: `/home/aepod/dev/weave-nn/src/visualization/PropertyVisualizer.js`
**Last Updated**: 2025-10-22

### Overview

The **PropertyVisualizer** provides comprehensive property extraction, filtering, and analytics capabilities for Obsidian properties. This enables rich visualizations and insights into your knowledge graph's metadata structure.

### Key Capabilities

1. **Property Extraction**
   - Extract all properties from vault notes
   - Parse frontmatter YAML automatically
   - Support custom inline property formats
   - Cache extracted data for performance

2. **Filtering & Search**
   - Filter by property name, type, or value
   - Complex query operators (equals, contains, gt, lt, etc.)
   - Full-text search across property values
   - Chain multiple filters

3. **Analytics & Statistics**
   - Property type inference (string, number, date, boolean)
   - Unique value counts
   - Distribution analysis
   - Time range calculations for date properties
   - Aggregations (sum, avg, min, max) for numeric properties

4. **Dashboard Creation**
   - Multiple visualization types (table, chart, timeline)
   - Configurable widgets per property
   - Export to JSON or CSV
   - Interactive filtering

### Implementation Example

```javascript
const { PropertyVisualizer } = require('./src/visualization/PropertyVisualizer');
const ObsidianAPIClient = require('./src/clients/ObsidianAPIClient');

// Initialize with Obsidian client
const client = new ObsidianAPIClient({
  apiUrl: 'http://localhost:27123',
  apiKey: process.env.OBSIDIAN_API_KEY
});

const visualizer = new PropertyVisualizer({
  client: client,
  cacheEnabled: true,
  cacheTTL: 300000 // 5 minutes
});

// Extract all properties
const properties = await visualizer.extractProperties();
console.log(`Extracted from ${properties.totalNotes} notes`);
console.log(`Found ${properties.totalProperties} unique properties`);

// Create dashboard
const dashboard = visualizer.createDashboard(properties, {
  visualizationType: VisualizationType.TABLE,
  includeProperties: ['tags', 'status', 'priority', 'type']
});

// Add filters
visualizer
  .addFilter({ property: 'status', operator: 'equals', value: 'active' })
  .addFilter({ property: 'priority', operator: 'gte', value: 5 });

const filtered = visualizer.applyFilters(properties);

// Export results
const csvExport = visualizer.export(dashboard, 'csv');
```

### Property Statistics Output

For each property, the visualizer provides:

```javascript
{
  type: 'string',           // Inferred type: string, number, date, boolean
  count: 42,                // Total occurrences
  uniqueValues: 8,          // Number of unique values
  distribution: {           // Value frequency (for strings)
    'active': 20,
    'planned': 15,
    'completed': 7
  },
  aggregations: {           // For numeric properties
    sum: 150,
    avg: 7.5,
    min: 1,
    max: 10
  },
  timeRange: {              // For date properties
    earliest: '2025-01-01',
    latest: '2025-10-22'
  }
}
```

### Integration with Obsidian Properties Standard

The visualizer understands the Obsidian Properties Standard defined in this document:

- **Type Detection**: Automatically identifies `type`, `status`, `priority` fields
- **Icon Support**: Extracts icon property for visualization
- **CSS Classes**: Processes `cssclasses` arrays for grouping
- **Tag Analysis**: Comprehensive tag statistics and distributions
- **Date Properties**: Special handling for `created_date`, `decided_date`, etc.

### Use Cases

1. **Property Auditing**: Find all properties in use across the vault
2. **Status Dashboards**: Visualize distribution of statuses and priorities
3. **Tag Analytics**: Understand most-used tags and tag patterns
4. **Quality Checks**: Identify notes missing required properties
5. **Temporal Analysis**: Track property values over time
6. **Export Reports**: Generate CSV reports for external analysis

### Advanced Features

**Custom Property Parsers**:
```javascript
const visualizer = new PropertyVisualizer({
  customParser: (note) => {
    // Extract custom inline properties
    const regex = /\[\[property::(\w+)::(.+?)\]\]/g;
    const properties = {};
    let match;

    while ((match = regex.exec(note.content)) !== null) {
      properties[match[1]] = match[2];
    }

    return properties;
  }
});
```

**Visualization Configuration**:
```javascript
const dashboard = visualizer.createDashboard(properties, {
  visualizationType: VisualizationType.CHART,
  visualizationDefaults: {
    showLegend: true,
    interactive: true,
    colorScheme: 'obsidian-dark'
  }
});
```

### Performance

- **Caching**: Property extraction results cached for 5 minutes (configurable)
- **Incremental Updates**: Only re-process modified notes
- **Batch Processing**: Efficiently handles large vaults (1000+ notes)
- **Memory Efficient**: Streams data, doesn't load entire vault

### Complete Example

See `/home/aepod/dev/weave-nn/examples/property-visualizer-example.js` for full working example with:
- Property extraction and statistics
- Dashboard creation (table, chart, timeline)
- Filtering and search
- Export to JSON and CSV
- Advanced usage patterns

### Related

- [[property-visualizer]] - Full API documentation
- [[obsidian-api-client]] - REST API integration
- [[node-creation-process]] - Property standards for new nodes

---

## 🚨 Common Pitfalls

### Pitfall 1: Typos in Icon Names

**Problem**: `icon: lightbulb2` (doesn't exist)
**Solution**: Verify icon name at [lucide.dev/icons](https://lucide.dev/icons/)

### Pitfall 2: Forgetting cssclasses Array

**Problem**: `cssclasses: concept` (should be array)
**Solution**: `cssclasses: [concept]` or multi-line array

### Pitfall 3: Inconsistent Icons

**Problem**: Some concepts use `lightbulb`, others use `brain`
**Solution**: Follow type standards defined above

### Pitfall 4: Too Many CSS Classes

**Problem**: `cssclasses: [concept, core, advanced, important, active, featured]`
**Solution**: Limit to 2-3 meaningful classes

---

## 🔗 Related

- [[node-creation-process|Node Creation Process]]
- [[../templates/README|Templates Hub]]
- [Obsidian Help - Properties](https://help.obsidian.md/properties)
- [Lucide Icons](https://lucide.dev/icons/)

---

## 📅 Rollout Timeline

**Created**: 2025-10-20
**Phase 1 (Templates)**: Immediate
**Phase 2 (Existing Nodes)**: 2025-10-21 (batch update)
**Phase 3 (CSS Snippet)**: 2025-10-21
**Phase 4 (Validation)**: Ongoing

---

**Status**: Active - To be applied across all nodes
**Owner**: Documentation Team
**Priority**: High - Improves graph visualization significantly
**Last Updated**: 2025-10-20
