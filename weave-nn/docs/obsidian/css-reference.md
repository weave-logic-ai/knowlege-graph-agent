---
type: documentation
title: CSS Reference - Complete Styling System
status: active
created_date: '2025-10-29'
cssclasses:
  - type-documentation
  - status-active
tags:
  - documentation
  - css
  - reference
  - technical
scope: system
priority: medium
visual:
  icon: 📘
  graph_group: documentation
version: '1.0'
---

# CSS Reference - Complete Styling System

**Technical reference for all CSS snippets in the Weave-NN visual styling system.**

---

## 📁 File Structure

```
.obsidian/
└── snippets/
    ├── color-coding.css  (~12KB)
    ├── icons.css         (~15KB)
    ├── callouts.css      (~18KB)
    └── typography.css    (~14KB)
```

**Total Size**: ~59KB
**Load Time**: <100ms
**Dependencies**: None (pure CSS)

---

## 🎨 color-coding.css

### Purpose
Apply visual color coding based on document metadata (type, phase, status, priority, scope).

### CSS Classes

#### Phase Documents (Blue Scale)

```css
.phase-planning           /* #60A5FA - Light blue */
.phase-specification      /* #3B82F6 - Medium blue */
.phase-implementation     /* #2563EB - Dark blue */
```

**Effect**: `border-left: 4px solid [color]; padding-left: 12px;`

#### Type-Based Colors

```css
.type-implementation      /* #10B981 - Green */
.type-research           /* #8B5CF6 - Purple */
.type-architecture       /* #F59E0B - Orange */
.type-documentation      /* #06B6D4 - Cyan */
.type-testing           /* #EC4899 - Pink */
.type-decision          /* #6366F1 - Indigo */
```

**Effect**: `border-left: 4px solid [color]; padding-left: 12px;`

#### Hub Documents (Red Background)

```css
.type-hub, .type-index   /* #EF4444 - Red gradient */
.navigation             /* Enhanced hub with padding */
```

**Effect**:
```css
background: linear-gradient(to right, #EF4444 4px, transparent 4px);
border-radius: 4px;
padding-left: 16px;
```

#### Status Indicators

```css
.status-active          /* Green glow */
.status-deprecated      /* Red, 60% opacity */
.status-obsolete        /* Red, 60% opacity */
.status-archived        /* Gray, 50% opacity */
.status-planned         /* Yellow highlight */
.status-pending         /* Yellow highlight */
```

**Effect (active)**:
```css
box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.2);
border-radius: 4px;
```

#### Priority Highlighting

```css
.priority-high          /* Red top border */
.priority-medium        /* Yellow top border */
.priority-low           /* Gray top border */
```

**Effect**: `border-top: 2px solid [color]; padding-top: 8px;`

#### Scope Backgrounds

```css
.scope-system           /* Blue background (5% opacity) */
.scope-module           /* Green background (5% opacity) */
.scope-feature          /* Purple background (5% opacity) */
```

**Effect**:
```css
background: rgba([color], 0.05);
border-radius: 4px;
padding: 8px;
```

#### Graph Group Indicators

```css
.graph-group-core       /* #14B8A6 - Teal bottom border */
.graph-group-technical  /* #F97316 - Orange bottom border */
.graph-group-business   /* #22C55E - Green bottom border */
```

**Effect**: `border-bottom: 3px solid [color];`

#### File Explorer Colors

```css
.nav-file-title[data-path*="phase"]          /* Blue text */
.nav-file-title[data-path*="implementation"] /* Green text */
.nav-file-title[data-path*="research"]       /* Purple text */
.nav-file-title[data-path*="architecture"]   /* Orange text */
.nav-file-title[data-path*="hub"]            /* Red text, bold */
```

### Dark Mode Adjustments

```css
.theme-dark .type-hub {
  background: linear-gradient(to right, #EF4444 4px, rgba(239, 68, 68, 0.1) 4px);
}

.theme-dark .status-active {
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.3);
}
```

### Accessibility

```css
/* High contrast mode */
@media (prefers-contrast: high) {
  .type-hub {
    border-left: 6px solid #DC2626;
  }
}

/* Print styles */
@media print {
  .type-hub {
    border-left: 4px solid #000;
    background: none;
  }
}
```

---

## 🏷️ icons.css

### Purpose
Add visual icons to files, folders, headings, tags, and links.

### File Explorer Icons

```css
/* Pattern-based icons */
[data-path$="-hub.md"]::before        { content: "🏠 "; }
[data-path*="index"]::before          { content: "📑 "; }
[data-path*="planning"]::before       { content: "📋 "; }
[data-path*="phase-"]::before         { content: "🎯 "; }
[data-path*="implementation"]::before { content: "⚙️ "; }
[data-path*="research"]::before       { content: "🔬 "; }
[data-path*="architecture"]::before   { content: "🏗️ "; }
[data-path*="test"]::before           { content: "🧪 "; }
[data-path*="decision"]::before       { content: "🎲 "; }
[data-path*="guide"]::before          { content: "📖 "; }
[data-path*="workflow"]::before       { content: "🔄 "; }
```

### Folder Icons

```css
.nav-folder-title[data-path="weave-nn"]::before     { content: "🧠 "; }
.nav-folder-title[data-path*="_planning"]::before   { content: "📋 "; }
.nav-folder-title[data-path*="docs"]::before        { content: "📚 "; }
.nav-folder-title[data-path*="architecture"]::before { content: "🏗️ "; }
.nav-folder-title[data-path*="research"]::before    { content: "🔬 "; }
.nav-folder-title[data-path*="tests"]::before       { content: "🧪 "; }
```

### Tag Icons

```css
.tag[href="#index"]::before           { content: "🗺️ "; }
.tag[href="#phase"]::before           { content: "📋 "; }
.tag[href="#implementation"]::before  { content: "⚙️ "; }
.tag[href="#research"]::before        { content: "🔬 "; }
.tag[href="#active"]::before          { content: "✅ "; }
.tag[href="#deprecated"]::before      { content: "❌ "; }
.tag[href="#knowledge-graph"]::before { content: "🕸️ "; }
```

### Link Icons

```css
/* External links */
a.external-link::after {
  content: " 🔗";
  font-size: 0.8em;
  opacity: 0.6;
}

/* Hub links */
a.internal-link[href$="-hub"]::before {
  content: "🏠 ";
  font-size: 0.85em;
}

/* Phase links */
a.internal-link[href*="phase-"]::before {
  content: "🎯 ";
  font-size: 0.85em;
}
```

### Status Badges

```css
[data-path*="COMPLETE"]::after { content: " ✅"; }
[data-path*="WIP"]::after      { content: " 🚧"; }
[data-path*="TODO"]::after     { content: " ⏳"; }
```

### Custom Icon Classes

```css
.icon-brain::before       { content: "🧠 "; }
.icon-gear::before        { content: "⚙️ "; }
.icon-book::before        { content: "📚 "; }
.icon-microscope::before  { content: "🔬 "; }
.icon-building::before    { content: "🏗️ "; }
.icon-test-tube::before   { content: "🧪 "; }
.icon-home::before        { content: "🏠 "; }
.icon-target::before      { content: "🎯 "; }
.icon-clipboard::before   { content: "📋 "; }
.icon-recycle::before     { content: "🔄 "; }
.icon-document::before    { content: "📄 "; }
.icon-lightbulb::before   { content: "💡 "; }
.icon-dice::before        { content: "🎲 "; }
.icon-package::before     { content: "📦 "; }
.icon-checkmark::before   { content: "✅ "; }
.icon-construction::before { content: "🚧 "; }
.icon-hourglass::before   { content: "⏳ "; }
.icon-web::before         { content: "🕸️ "; }
.icon-map::before         { content: "🗺️ "; }
```

### Dark Mode

```css
.theme-dark .nav-file-title::before,
.theme-dark .nav-folder-title::before {
  filter: brightness(1.2);
}
```

### Accessibility

```css
/* Reduced motion - hide decorative icons */
@media (prefers-reduced-motion: reduce) {
  .nav-file-title::before,
  .nav-folder-title::before {
    display: none;
  }
}

/* High contrast - use text instead of emoji */
@media (prefers-contrast: high) {
  .nav-file-title[data-path$="-hub.md"]::before {
    content: "[HUB] ";
    font-weight: bold;
  }
}
```

---

## 📦 callouts.css

### Purpose
Define 30+ custom callout types for different content categories.

### Callout Color System

```css
--callout-color: r, g, b;  /* RGB values */
--callout-icon: lucide-icon-name;
```

### Complete Callout List

#### Phase & Planning (Blue)
```css
[!phase]           /* 59, 130, 246 - lucide-target */
[!phase-planning]  /* 96, 165, 250 - lucide-clipboard */
[!phase-complete]  /* 37, 99, 235 - lucide-check-circle */
```

#### Implementation (Green)
```css
[!implementation]  /* 16, 185, 129 - lucide-settings */
[!code]           /* 16, 185, 129 - lucide-code */
[!feature]        /* 34, 197, 94 - lucide-sparkles */
```

#### Gap Identification (Red)
```css
[!gap]            /* 239, 68, 68 - lucide-alert-triangle */
[!blocker]        /* 220, 38, 38 - lucide-octagon */
[!missing]        /* 248, 113, 113 - lucide-help-circle */
```

#### Success Criteria (Green Check)
```css
[!success]        /* 16, 185, 129 - lucide-check-circle-2 */
[!criteria]       /* 34, 197, 94 - lucide-list-checks */
[!acceptance]     /* 22, 163, 74 - lucide-badge-check */
```

#### Architecture (Orange)
```css
[!architecture]   /* 245, 158, 11 - lucide-building */
[!decision]       /* 251, 146, 60 - lucide-git-branch */
[!design]         /* 249, 115, 22 - lucide-pen-tool */
```

#### Research (Purple)
```css
[!research]       /* 139, 92, 246 - lucide-microscope */
[!analysis]       /* 168, 85, 247 - lucide-bar-chart */
[!hypothesis]     /* 124, 58, 237 - lucide-lightbulb */
```

#### Testing (Pink)
```css
[!test]           /* 236, 72, 153 - lucide-flask */
[!scenario]       /* 244, 114, 182 - lucide-play-circle */
[!validation]     /* 219, 39, 119 - lucide-shield-check */
```

#### Code Examples (Teal)
```css
[!example]        /* 20, 184, 166 - lucide-code-2 */
[!snippet]        /* 45, 212, 191 - lucide-file-code */
[!demo]           /* 13, 148, 136 - lucide-presentation */
```

#### Workflow (Indigo)
```css
[!workflow]       /* 99, 102, 241 - lucide-workflow */
[!process]        /* 129, 140, 248 - lucide-list-ordered */
[!step]           /* 79, 70, 229 - lucide-footprints */
```

#### Documentation (Cyan)
```css
[!docs]           /* 6, 182, 212 - lucide-book-open */
[!guide]          /* 34, 211, 238 - lucide-map */
[!reference]      /* 8, 145, 178 - lucide-bookmark */
```

#### Status Tracking
```css
[!todo]           /* 251, 191, 36 - lucide-circle */
[!in-progress]    /* 59, 130, 246 - lucide-loader */
[!complete]       /* 16, 185, 129 - lucide-check-circle */
[!deprecated]     /* 107, 114, 128 - lucide-archive */
```

#### Special Callouts
```css
[!sparc]          /* 139, 92, 246 - lucide-zap */
[!mcp]            /* 99, 102, 241 - lucide-network */
[!agent]          /* 236, 72, 153 - lucide-bot */
[!swarm]          /* 168, 85, 247 - lucide-git-merge */
[!neural]         /* 124, 58, 237 - lucide-brain */
```

### Callout Enhancements

```css
/* Gradient background */
.callout {
  background: linear-gradient(
    135deg,
    rgba(var(--callout-color), 0.05) 0%,
    rgba(var(--callout-color), 0.02) 100%
  );
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Icon pulse animation for important callouts */
.callout[data-callout="blocker"] .callout-icon,
.callout[data-callout="gap"] .callout-icon {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

### Nested Callouts

```css
.callout .callout {
  opacity: 0.95;
  margin-left: 1em;
  border-left-width: 2px;
}

.callout .callout .callout {
  opacity: 0.9;
  margin-left: 2em;
  border-left-width: 1px;
}
```

---

## 📝 typography.css

### Purpose
Enhance readability through optimized typography, code blocks, lists, tables, and links.

### Font Configuration

```css
/* Body font */
--text-font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;

/* Monospace font */
--monospace-font: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### Heading Styles

```css
h1 {
  font-size: 2em;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  border-bottom: 2px solid rgba(var(--color-accent), 0.2);
  padding-bottom: 0.3em;
}

h2 {
  font-size: 1.5em;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

h3 {
  font-size: 1.25em;
  font-weight: 600;
  line-height: 1.4;
}

h4, h5, h6 {
  font-size: 1em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.9em;
  color: var(--text-muted);
}
```

### Code Styling

```css
/* Inline code */
code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9em;
  background: rgba(var(--color-accent), 0.1);
  padding: 0.15em 0.4em;
  border-radius: 3px;
}

/* Code blocks */
pre {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.875em;
  line-height: 1.6;
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(var(--color-accent), 0.1);
  border-radius: 6px;
  padding: 1em;
  overflow-x: auto;
}
```

### List Styling

```css
ul, ol {
  margin: 0.75em 0;
  padding-left: 1.5em;
}

li {
  margin: 0.35em 0;
  line-height: 1.7;
}

/* Custom markers */
ul > li::marker {
  color: var(--color-accent);
}

ol > li::marker {
  color: var(--color-accent);
  font-weight: 600;
}
```

### Link Styling

```css
/* Internal links */
a.internal-link {
  color: var(--link-color);
  text-decoration: none;
  border-bottom: 1px solid rgba(var(--link-color-rgb), 0.3);
  transition: all 0.2s ease;
}

a.internal-link:hover {
  background: rgba(var(--link-color-rgb), 0.05);
  border-bottom-color: var(--link-color-hover);
}

/* External links */
a.external-link {
  color: #3B82F6;
  border-bottom: 1px dotted rgba(59, 130, 246, 0.4);
}
```

### Table Styling

```css
table {
  border-collapse: collapse;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

thead {
  background: rgba(var(--color-accent), 0.1);
  font-weight: 600;
}

th {
  padding: 0.75em 1em;
  border-bottom: 2px solid rgba(var(--color-accent), 0.3);
}

td {
  padding: 0.75em 1em;
  border-bottom: 1px solid var(--background-modifier-border);
}

tr:hover {
  background: rgba(var(--color-accent), 0.05);
}
```

### Mobile Responsiveness

```css
@media (max-width: 768px) {
  h1 { font-size: 1.75em; }
  h2 { font-size: 1.35em; }
  h3 { font-size: 1.15em; }
  table { font-size: 0.85em; }
}
```

---

## 🎭 CSS Variables

### Color Variables

```css
--color-accent: #3B82F6;
--color-accent-rgb: 59, 130, 246;
--link-color: var(--color-accent);
--text-normal: /* Theme-dependent */
--text-muted: /* Theme-dependent */
--text-faint: /* Theme-dependent */
```

### Spacing Variables

```css
--line-height-normal: 1.7;
--line-height-tight: 1.4;
--border-radius: 6px;
--border-radius-sm: 3px;
```

---

## 🔧 Customization Guide

### Change Accent Color

In `appearance.json`:
```json
{
  "accentColor": "#3B82F6"
}
```

### Add New Callout Type

In `callouts.css`:
```css
.callout[data-callout="my-callout"] {
  --callout-color: 255, 100, 50; /* RGB */
  --callout-icon: lucide-star;
}
```

### Modify Typography

In `typography.css`:
```css
.markdown-preview-view p {
  font-size: 1.05em; /* Larger body text */
  line-height: 1.8;  /* More spacing */
}
```

---

## 📊 Performance Metrics

- **Total CSS Size**: ~59KB
- **Parse Time**: <50ms
- **Render Impact**: <100ms
- **Memory Usage**: Negligible
- **Browser Support**: Modern browsers (2020+)

---

## 🐛 Known Issues

1. **Icon positioning**: Some emojis render differently across OS
2. **Print styles**: Limited testing on various printer drivers
3. **Mobile**: Some animations may be jittery on low-end devices

---

## 📚 Related Documentation

- [[styling-guide.md|Styling Guide]] - User-facing guide
- [[icon-reference.md|Icon Reference]] - Icon usage
- [[callout-reference.md|Callout Reference]] - Callout examples
- [[theme-customization.md|Theme Customization]] - Advanced topics

---

**Last Updated**: 2025-10-29
**Version**: 1.0
**Maintainer**: Weave-NN Development Team
