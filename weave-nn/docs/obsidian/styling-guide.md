---
type: documentation
title: Obsidian Visual Styling Guide
status: active
created_date: '2025-10-29'
updated_date: '2025-10-29'
cssclasses:
  - type-documentation
  - status-active
tags:
  - documentation
  - obsidian
  - styling
  - visual-design
scope: system
priority: high
visual:
  icon: 🎨
  graph_group: documentation
version: '1.0'
---

# Obsidian Visual Styling Guide

**Complete guide to the Weave-NN visual styling system for enhanced vault navigation and readability.**

---

## 🎯 Overview

The Weave-NN visual styling system provides comprehensive CSS-based enhancements to make your Obsidian vault more readable, navigable, and visually organized. The system uses color coding, icons, custom callouts, and typography enhancements.

### System Components

1. **Color Coding** - Visual indicators based on document type, phase, and status
2. **Icons** - File explorer and document icons for quick identification
3. **Callouts** - Custom callout types for different content categories
4. **Typography** - Enhanced readability through optimized fonts and spacing

---

## 🎨 Color Coding System

### Phase Documents (Blue Scale)

Phase documents use shades of blue to indicate planning and specification work:

```yaml
cssclasses:
  - phase-planning      # Light blue (#60A5FA)
  - phase-specification # Medium blue (#3B82F6)
  - phase-implementation # Dark blue (#2563EB)
```

**Visual Effect**: 4px left border in the specified blue shade.

### Type-Based Colors

Documents are colored by their primary type:

| Type | Color | Border Color | Use Case |
|------|-------|--------------|----------|
| `type-implementation` | Green | `#10B981` | Code, features, builds |
| `type-research` | Purple | `#8B5CF6` | Research, analysis, papers |
| `type-architecture` | Orange | `#F59E0B` | Design docs, ADRs |
| `type-documentation` | Cyan | `#06B6D4` | Guides, references |
| `type-testing` | Pink | `#EC4899` | Test plans, scenarios |
| `type-decision` | Indigo | `#6366F1` | Decision records |

**Example:**
```yaml
cssclasses:
  - type-implementation
  - status-active
```

### Hub Documents (Red Background)

Hub and index documents get special treatment:

```yaml
cssclasses:
  - type-hub    # Red gradient background
  - type-index  # Same as hub
  - navigation  # Enhanced hub with padding
```

**Visual Effect**: Linear gradient from red (#EF4444) with subtle background tint.

### Status Indicators

Track document lifecycle:

| Status | Color | Effect |
|--------|-------|--------|
| `status-active` | Green glow | Box shadow with green tint |
| `status-deprecated` | Red, faded | 60% opacity, red border |
| `status-archived` | Gray | 50% opacity, gray border |
| `status-planned` | Yellow | Yellow border with highlight |

### Priority Highlighting

Top border accent by priority:

```yaml
cssclasses:
  - priority-high   # Red top border (2px)
  - priority-medium # Yellow top border (2px)
  - priority-low    # Gray top border (2px)
```

### Scope Backgrounds

Subtle background colors by scope:

```yaml
cssclasses:
  - scope-system  # Blue background tint
  - scope-module  # Green background tint
  - scope-feature # Purple background tint
```

---

## 🏷️ Icon System

### File Explorer Icons

Icons automatically added based on filename patterns:

| Pattern | Icon | Example |
|---------|------|---------|
| `*-hub.md` | 🏠 | `weave-nn-project-hub.md` |
| `*index*.md` | 📑 | `decision-records-index.md` |
| `*planning*` | 📋 | `_planning/tasks.md` |
| `phase-*.md` | 🎯 | `phase-12-master-plan.md` |
| `*implementation*` | ⚙️ | `backend-implementation.md` |
| `*research*` | 🔬 | `memory-networks-research.md` |
| `*architecture*` | 🏗️ | `architecture-overview.md` |
| `*test*` | 🧪 | `integration-tests.md` |
| `*decision*` | 🎲 | `decision-record-001.md` |
| `*guide*` | 📖 | `user-guide.md` |
| `*workflow*` | 🔄 | `git-workflow.md` |

### Folder Icons

Folders also receive contextual icons:

- `📋 _planning/`
- `📚 docs/`
- `🏗️ architecture/`
- `🔬 research/`
- `🧪 tests/`
- `🔄 workflows/`
- `📄 templates/`
- `📦 .archive/`

### Tag Icons

Common tags display with icons:

- `#index` → 🗺️
- `#phase` → 📋
- `#implementation` → ⚙️
- `#research` → 🔬
- `#active` → ✅
- `#deprecated` → ❌
- `#knowledge-graph` → 🕸️

### Custom Icons via CSS Classes

Add icons to any element:

```markdown
<span class="icon-brain">Neural Networks</span>
<span class="icon-gear">Configuration</span>
<span class="icon-microscope">Research</span>
```

Available icon classes:
- `icon-brain` 🧠
- `icon-gear` ⚙️
- `icon-book` 📚
- `icon-microscope` 🔬
- `icon-building` 🏗️
- `icon-test-tube` 🧪
- `icon-home` 🏠
- `icon-target` 🎯
- And 10+ more (see `icons.css`)

---

## 📦 Custom Callouts

### Usage Syntax

```markdown
> [!callout-type] Title
> Content goes here
```

### Available Callout Types

#### Phase & Planning (Blue)

```markdown
> [!phase] Phase 12: Four Pillar Implementation
> Implementing autonomous agent capabilities

> [!phase-planning] Planning Phase
> Current planning activities

> [!phase-complete] Phase Complete
> Phase 11 successfully completed
```

#### Implementation (Green)

```markdown
> [!implementation] Implementation Note
> Key implementation details

> [!code] Code Example
> ```typescript
> const example = "code";
> ```

> [!feature] New Feature
> Feature description
```

#### Gap Identification (Red)

```markdown
> [!gap] Gap Identified
> Missing functionality or documentation

> [!blocker] Critical Blocker
> Blocker preventing progress

> [!missing] Missing Component
> Component not yet implemented
```

#### Success Criteria (Green Check)

```markdown
> [!success] Success Achieved
> Milestone completed successfully

> [!criteria] Acceptance Criteria
> - [ ] Criterion 1
> - [x] Criterion 2

> [!acceptance] Acceptance Test
> Test verification steps
```

#### Architecture & Design (Orange)

```markdown
> [!architecture] Architectural Decision
> ADR for microservices architecture

> [!decision] Design Decision
> Key design choice and rationale

> [!design] Design Pattern
> Pattern implementation details
```

#### Research & Analysis (Purple)

```markdown
> [!research] Research Findings
> Key research insights

> [!analysis] Analysis Results
> Data analysis and conclusions

> [!hypothesis] Working Hypothesis
> Theoretical framework
```

#### Testing (Pink)

```markdown
> [!test] Test Case
> Test scenario description

> [!scenario] Test Scenario
> End-to-end scenario

> [!validation] Validation Results
> Validation outcomes
```

#### Code Examples (Teal)

```markdown
> [!example] Usage Example
> How to use this feature

> [!snippet] Code Snippet
> Reusable code fragment

> [!demo] Demo
> Live demonstration
```

#### Workflow & Process (Indigo)

```markdown
> [!workflow] Workflow Steps
> 1. Step one
> 2. Step two

> [!process] Process Flow
> Process documentation

> [!step] Next Step
> Action item
```

#### Documentation (Cyan)

```markdown
> [!docs] Documentation
> Reference documentation

> [!guide] User Guide
> Step-by-step guide

> [!reference] API Reference
> API documentation
```

#### Status & Tracking

```markdown
> [!todo] To Do
> - [ ] Task 1
> - [ ] Task 2

> [!in-progress] In Progress
> Currently working on this

> [!complete] Completed
> Task finished successfully

> [!deprecated] Deprecated
> No longer recommended
```

#### Special Callouts

```markdown
> [!sparc] SPARC Methodology
> SPARC workflow step

> [!mcp] MCP Integration
> Model Context Protocol details

> [!agent] Agent Behavior
> AI agent configuration

> [!swarm] Swarm Coordination
> Multi-agent coordination

> [!neural] Neural Network
> ML/AI implementation
```

### Nested Callouts

Callouts can be nested:

```markdown
> [!phase] Phase 12
> Main phase description
>
> > [!implementation] Implementation Detail
> > Nested implementation note
```

---

## 📝 Typography Enhancements

### Heading Hierarchy

- **H1**: 2em, bold (700), bottom border
- **H2**: 1.5em, semi-bold (600)
- **H3**: 1.25em, semi-bold (600)
- **H4-H6**: Uppercase, muted color, smaller

### Code Styling

**Inline code:**
- Font: JetBrains Mono / Fira Code
- Background: Accent color (10% opacity)
- Border radius: 3px

**Code blocks:**
- Language identifier shown in top-right
- Border and background styling
- Syntax highlighting enabled

### Lists

- Optimized spacing (0.35em between items)
- Custom markers in accent color
- Reduced nesting indentation
- Task list checkboxes styled

### Links

- **Internal links**: Underline on hover, accent color
- **External links**: Blue color, dotted underline
- **Unresolved links**: Muted, dashed underline

### Tables

- Rounded corners with shadow
- Header background in accent color
- Row hover effect
- Mobile-responsive sizing

### Special Elements

- **Blockquotes**: Left border, italic, tinted background
- **Horizontal rules**: Gradient effect
- **Highlights**: Yellow background
- **Footnotes**: Smaller, muted, separated

---

## 🌓 Dark/Light Mode Support

All styles automatically adapt to theme:

### Dark Mode Adjustments
- Increased contrast for backgrounds
- Brighter box shadows
- Enhanced code block contrast
- Adjusted opacity for deprecated items

### Light Mode Optimization
- Softer backgrounds
- Lower contrast shadows
- Optimized link colors
- Clean, minimal aesthetic

---

## 📱 Mobile Responsiveness

### Automatic Adjustments

- Smaller heading sizes on mobile
- Reduced padding in callouts
- Simplified nested callout styling
- Touch-optimized table cells
- Readable font sizes maintained

### Breakpoint: 768px

Below 768px width:
- H1: 1.75em (from 2em)
- H2: 1.35em (from 1.5em)
- Table font: 0.85em (from 0.95em)
- Callout padding: 0.75em

---

## ♿ Accessibility Features

### High Contrast Mode

When `prefers-contrast: high`:
- Thicker borders (6px vs 4px)
- Solid colors (no transparency)
- Higher font weights
- Text-based indicators instead of icons

### Reduced Motion

When `prefers-reduced-motion: reduce`:
- Animation disabled (pulse effects)
- Icons hidden (for screen readers)
- Static transitions

### Focus Indicators

- 2px outline on focused links
- Keyboard navigation supported
- Visible checkbox focus states

---

## 🖨️ Print Styles

Optimized for printing:

- Black borders (preserve structure)
- Remove decorative icons
- Page break avoidance
- External URLs shown in footnotes
- Clean, minimal styling

---

## 🔧 Configuration

### Enable/Disable Snippets

In `.obsidian/appearance.json`:

```json
{
  "enabledCssSnippets": [
    "color-coding",
    "icons",
    "callouts",
    "typography"
  ]
}
```

### Customization

Edit snippet files in `.obsidian/snippets/`:

1. `color-coding.css` - Modify colors and borders
2. `icons.css` - Add/remove icon mappings
3. `callouts.css` - Create new callout types
4. `typography.css` - Adjust fonts and spacing

---

## 📊 Performance

### Optimization

- CSS variables for consistency
- Minimal selector specificity
- Lazy loading where possible
- No JavaScript dependencies

### Benchmarks

- Render time: <100ms
- File size: ~40KB total
- No impact on vault sync
- Works offline

---

## 🚀 Quick Start

1. **Verify snippets are loaded:**
   - Settings → Appearance → CSS snippets
   - Enable all four snippets

2. **Add frontmatter to documents:**
```yaml
cssclasses:
  - type-implementation
  - status-active
  - priority-high
```

3. **Use custom callouts:**
```markdown
> [!phase] Phase 12
> Implementation details
```

4. **Check file explorer:**
   - Icons should appear automatically
   - Folders have contextual icons

---

## 📚 Related Documentation

- [[css-reference.md|CSS Reference]] - Complete CSS documentation
- [[icon-reference.md|Icon Reference]] - All available icons
- [[callout-reference.md|Callout Reference]] - Callout examples
- [[theme-customization.md|Theme Customization]] - Advanced customization

---

## 🐛 Troubleshooting

### Snippets not loading
1. Check `.obsidian/appearance.json`
2. Verify files in `.obsidian/snippets/`
3. Restart Obsidian

### Colors not showing
1. Verify frontmatter `cssclasses`
2. Check CSS class names (exact match)
3. Reload with Ctrl+R

### Icons missing
1. Ensure Obsidian supports emoji
2. Check filename patterns
3. Verify `icons.css` is enabled

---

**Last Updated**: 2025-10-29
**Version**: 1.0
**Status**: Active - Phase 1 Complete
