---
title: Obsidian Icon System Activation Guide
type: documentation
status: complete
phase_id: PHASE-14
tags:
  - obsidian
  - icons
  - setup
  - configuration
domain: knowledge-graph
scope: system
priority: high
created_date: 2025-10-28T23:30:00.000Z
updated_date: 2025-10-28T23:30:00.000Z
version: '1.0'
visual:
  icon: "⚙️"
  color: '#10B981'
  cssclasses:
    - type-documentation
    - status-complete
    - priority-high
---

# Obsidian Icon System Activation Guide

**Complete setup instructions for enabling visual icons in Obsidian**

## Prerequisites

- Obsidian v1.0.0 or higher
- Icon workflow applied (files have `visual.icon` in frontmatter)
- Configuration files created:
  - `.obsidian/plugins/obsidian-icon-folder/data.json`
  - `.obsidian/snippets/graph-view-icons.css`

## Step 1: Install Icon Folder Plugin

### Option A: Community Plugin Install (Recommended)

1. Open Obsidian Settings (`Cmd/Ctrl + ,`)
2. Navigate to **Community Plugins**
3. Click **Browse** and search for "Icon Folder"
4. Click **Install** on "obsidian-icon-folder" by Florian Woelki
5. Click **Enable** to activate the plugin

### Option B: Manual Install

```bash
cd /home/aepod/dev/weave-nn/weave-nn/.obsidian/plugins
git clone https://github.com/FlorianWoelki/obsidian-icon-folder.git
cd obsidian-icon-folder
npm install && npm run build
```

Then restart Obsidian and enable the plugin in Settings → Community Plugins.

## Step 2: Configure Icon Folder Plugin

### Verify Configuration File

Check that `.obsidian/plugins/obsidian-icon-folder/data.json` exists with proper structure:

```json
{
  "settings": {
    "iconInTabsEnabled": true,
    "iconInTitleEnabled": true,
    "iconsInNotesEnabled": true,
    "iconIdentifier": "::icon::"
  },
  "weave-nn/_planning": { "iconName": "📋" },
  "weave-nn/architecture": { "iconName": "🏗️" },
  "weave-nn/research": { "iconName": "🔬" }
  // ... more mappings
}
```

### Enable Icon Display Features

In Obsidian Settings → Icon Folder:

- ✅ **Icon in tabs** - Shows icons in open tabs
- ✅ **Icon in title** - Shows icons in note titles
- ✅ **Icons in notes** - Shows icons inline
- ✅ **Icon in file explorer** - Shows icons in sidebar

### Set Icon Identifier

The icon workflow uses frontmatter format, so ensure:

**Icon Identifier**: `::icon::`

**Note**: The plugin will read from `visual.icon` in frontmatter automatically.

## Step 3: Enable Graph View Icons

### Enable CSS Snippet

1. Open Obsidian Settings → Appearance
2. Scroll to **CSS snippets** section
3. Click the **folder icon** to open snippets folder
4. Verify `graph-view-icons.css` is present
5. Click the **reload** button (circular arrow icon)
6. Toggle **ON** the `graph-view-icons` snippet

### Verify Snippet Content

The snippet should include these key sections:

```css
/* Graph Node Icon Display */
.graph-view-node::before {
  content: attr(data-icon);
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
}

/* Node Styling by Type */
.graph-view-node[data-type="planning"] { fill: var(--color-blue) !important; }
.graph-view-node[data-type="hub"] { fill: var(--color-pink) !important; r: 8 !important; }

/* Status Indicators */
.graph-view-node[data-status="in-progress"] {
  stroke: var(--color-amber);
  animation: pulse 2s ease-in-out infinite;
}
```

## Step 4: Configure Graph View Settings

### Open Graph View

- Click the **graph icon** in the left ribbon
- Or use `Cmd/Ctrl + G`

### Recommended Graph Settings

**Display**:
- ✅ Show attachments
- ✅ Show orphans
- ✅ Show arrows

**Forces**:
- Center Force: 0.5
- Repel Force: 80
- Link Force: 1.0
- Link Distance: 250

**Groups** (from graph.json):
- Ensure `collapse-color-groups: false` for visibility
- 22 core color groups should be visible

### Verify graph.json Configuration

File: `.obsidian/graph.json`

```json
{
  "collapse-color-groups": false,
  "colorGroups": [
    {"query": "path:_planning", "color": {"a": 1, "rgb": 3911158}},
    {"query": "path:weaver", "color": {"a": 1, "rgb": 1092737}},
    {"query": "path:docs", "color": {"a": 1, "rgb": 447188}}
    // ... 19 more groups
  ],
  "centerStrength": 0.5,
  "repelStrength": 80,
  "linkStrength": 1,
  "linkDistance": 250
}
```

**⚠️ Important**: Only edit `graph.json` when Obsidian is closed, as Obsidian auto-saves this file continuously.

## Step 5: Verification Checklist

### File Explorer Icons

1. Open the file explorer sidebar
2. Navigate to `_planning/` folder
3. Verify: 📋 icon appears next to folder name
4. Navigate to individual files
5. Verify: Icons appear based on frontmatter `visual.icon`

### Tab Icons

1. Open multiple notes in tabs
2. Verify: Icons appear in tab headers
3. Check that icons match the note type/status

### Graph View Icons

1. Open graph view (`Cmd/Ctrl + G`)
2. Verify: Icons appear above nodes
3. Check node colors match types:
   - Planning: Blue
   - Implementation: Green
   - Research: Purple
   - Hub: Pink (larger)
4. Hover over nodes to verify icon enlargement
5. Check animations for in-progress items

### Wikilink Icons

1. Open any note with wikilinks
2. Verify: Icons appear before link text
3. Check that icons are consistent with target file type

## Step 6: Troubleshooting

### Icons Not Showing in File Explorer

**Problem**: No icons in sidebar

**Solutions**:
1. Verify Icon Folder plugin is enabled
2. Check `data.json` has correct path mappings
3. Reload plugin: Settings → Community Plugins → Icon Folder → Reload
4. Restart Obsidian

### Icons Not Showing in Graph View

**Problem**: Graph nodes have no icons

**Solutions**:
1. Verify CSS snippet is enabled: Settings → Appearance → CSS snippets
2. Reload snippets: Click reload button in CSS snippets section
3. Check `graph-view-icons.css` is in `.obsidian/snippets/`
4. Inspect graph node: Right-click → Inspect (needs dev mode)
5. Verify `data-icon` attribute exists on `.graph-view-node` elements

### Icons Show Wrong Symbol

**Problem**: File shows incorrect icon

**Solutions**:
1. Check frontmatter `visual.icon` value
2. Verify icon workflow ran: `npx weaver cultivate --icons --mode full`
3. Check tag-based icon mappings in `icon-application.ts`
4. Manually set icon in frontmatter:
   ```yaml
   visual:
     icon: "📚"
   ```

### Graph Colors Not Showing

**Problem**: All graph nodes are same color

**Solutions**:
1. Close Obsidian completely
2. Edit `.obsidian/graph.json` to set `collapse-color-groups: false`
3. Verify 22 color groups exist in `colorGroups` array
4. Restart Obsidian
5. Open graph view and check Groups panel

### Performance Issues

**Problem**: Graph view lags with icons enabled

**Solutions**:
1. Reduce graph zoom level (fewer visible nodes)
2. Disable animations in CSS snippet:
   ```css
   .graph-view-node[data-status="in-progress"] {
     animation: none; /* Disable pulse */
   }
   ```
3. Use local graph view for better performance
4. Limit depth in graph settings

## Step 7: Customization

### Adding Custom Icons

Edit frontmatter to override automatic icon:

```yaml
---
title: My Custom Note
type: documentation
visual:
  icon: "🎯"  # Custom icon overrides automatic selection
  color: "#FF6B6B"
  cssclasses:
    - custom-style
---
```

### Creating New Icon Mappings

Edit `weaver/src/workflows/kg/icon-application.ts`:

```typescript
export const TAG_ICON_MAPPINGS: Record<string, string> = {
  // Add your custom mappings
  'type/tutorial': '🎓',
  'status/verified': '✔️',
  'priority/urgent': '🔥',
  // ...
};
```

Then re-run: `npx weaver cultivate --icons --mode full`

### Styling Graph Nodes

Edit `.obsidian/snippets/graph-view-icons.css`:

```css
/* Custom type styling */
.graph-view-node[data-type="tutorial"] {
  fill: var(--color-teal) !important;
  r: 6 !important;
}

/* Custom status animations */
.graph-view-node[data-status="verified"] {
  stroke: var(--color-green-bright);
  stroke-width: 3px;
}
```

Reload CSS snippet in Settings → Appearance.

## Step 8: Maintenance

### Regular Icon Application

Set up automatic icon application for new documents:

**Daily Cron Job**:
```bash
# Add to crontab
0 2 * * * cd /home/aepod/dev/weave-nn && npx weaver cultivate --icons
```

**Git Post-Merge Hook**:
```bash
# .git/hooks/post-merge
#!/bin/bash
npx weaver cultivate --icons --mode incremental
```

**Watch Mode** (continuous):
```bash
# During active development
npx weaver cultivate --icons --watch
```

### Periodic Full Scans

Run full tree scans weekly or after major changes:

```bash
# Full scan
npx weaver cultivate --icons --mode full

# Verify results
npx weaver cultivate --icons --mode full --dry-run
```

## Accessibility Considerations

### High Contrast Mode

Icons automatically adapt to high contrast settings:

```css
@media (prefers-contrast: high) {
  .graph-view-node {
    stroke-width: 2px !important;
  }
}
```

### Reduced Motion

Animations disable automatically for users with reduced motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .graph-view-node[data-status="in-progress"] {
    animation: none;
  }
}
```

### Screen Reader Support

Icons include semantic HTML attributes:

```html
<span role="img" aria-label="Planning document">📋</span>
```

### Color Blindness Support

Icon shapes differ by type, not just color:
- Planning: 📋 (clipboard)
- Research: 🔬 (microscope)
- Implementation: ⚙️ (gear)
- Hub: 🌐 (globe)

## Related Documentation

- [[icon-cultivation-workflow]] - Automated icon application
- [[obsidian-icon-system]] - Icon mapping reference
- [[knowledge-graph-workflows]] - Complete workflow catalog
- [[metadata-schema-v3]] - Frontmatter specification

## Support

### Common Issues

See [[obsidian-icon-troubleshooting]] for detailed solutions.

### Getting Help

- Check Obsidian Forum: https://forum.obsidian.md
- Icon Folder Plugin: https://github.com/FlorianWoelki/obsidian-icon-folder
- Weave-NN Docs: `/weave-nn/docs/`

---

**Status**: Complete ✅
**Last Updated**: 2025-10-28
**Version**: 1.0
