# Obsidian Visual Enhancements - Setup Guide

**Quick Start**: 5 minutes to see colors, icons, and enhanced graph view

---

## 🎨 Step 1: Enable CSS Snippets (Colors)

### In Obsidian:

1. **Open Settings** (⚙️ icon or `Ctrl/Cmd + ,`)

2. **Navigate to Appearance**:
   - Settings → Appearance → CSS snippets

3. **Enable the snippet**:
   - Find `weave-nn-colors` in the list
   - Toggle it **ON** (should turn purple/blue)
   - If you don't see it, click the folder icon to reload snippets

4. **Verify it's active**:
   - You should see a checkmark next to `weave-nn-colors`

**Location**: `/weave-nn/.obsidian/snippets/weave-nn-colors.css`

---

## 🌐 Step 2: View the Graph (See Colors in Action)

### Open Graph View:

1. **Command Palette**: `Ctrl/Cmd + P`
2. Type: `Open graph view`
3. Press Enter

### What You'll See:

**Color-Coded Nodes** based on path and tags:
- 🔵 **Blue nodes** - Planning documents (`_planning/`)
- 🟢 **Green nodes** - Weaver implementation (`weaver/`)
- 🔴 **Cyan nodes** - Documentation (`docs/`)
- 🟣 **Purple nodes** - Research papers (`#research`)
- 🟡 **Amber nodes** - Implementation (`#implementation`)

### Graph Controls:

- **Zoom**: Scroll wheel
- **Pan**: Click and drag
- **Select node**: Click on it
- **Search**: Use the search bar at top
- **Filters**: Click "Filters" button to adjust

### View Settings:

Right side panel in graph view:
- ✅ Enable "Color groups" (should be on by default)
- Adjust "Link distance" for better spacing
- Try "Animate" for live updates

---

## 📁 Step 3: See Icons in File Explorer

### Icon Display Options:

**Option A: File Explorer** (Left sidebar)
- Icons appear as emoji before filenames
- Example: `📋 phase-13-master-plan.md`
- Example: `🌐 WEAVER-DOCS-HUB.md`
- Example: `🏗️ event-driven-architecture.md`

**Option B: Frontmatter** (Open any enhanced file)
- Look for the `visual` property:
  ```yaml
  visual:
    icon: "📋"
    color: "#3B82F6"
    cssclasses:
      - type-planning
      - status-complete
  ```

### Icon Meanings:

| Icon | Type | Example Files |
|------|------|---------------|
| 📋 | Planning | Phase plans, task lists |
| 🏗️ | Architecture | System designs, decisions |
| 🔬 | Research | Papers, research notes |
| ⚙️ | Implementation | Code, features |
| 📚 | Documentation | Guides, references |
| 🌐 | Hub | Navigation hubs |
| ✅ | Testing | Test files, QA docs |
| 📝 | SOP | Standard procedures |

---

## 🔍 Step 4: Verify Visual Properties

### Check a Specific File:

1. Open: `/weave-nn/mcp/mcp-integration-hub.md`

2. Check frontmatter (at the top):
   ```yaml
   ---
   visual:
     icon: "📄"
     cssclasses:
       - type-directory-index
       - status-active
       - priority-high
     graph_group: navigation
   version: '3.0'
   updated_date: '2025-10-28'
   ---
   ```

3. Look for:
   - ✅ `visual` property exists
   - ✅ `icon` field has emoji
   - ✅ `cssclasses` array present
   - ✅ `version: '3.0'` (latest schema)

### Enhanced Files to Check:

**Hubs** (should have 🌐 and pink colors):
- `/weaver/docs/WEAVER-DOCS-HUB.md`
- `/weave-nn/mcp/mcp-integration-hub.md`

**Planning** (should have 📋 and blue colors):
- `/weave-nn/_planning/phases/phase-13-master-plan.md`
- `/weave-nn/_planning/planning-master-tasks.md`

**Architecture** (should have 🏗️ and amber colors):
- `/weave-nn/decisions/technical/event-driven-architecture.md`

**Research** (should have 🔬 and purple colors):
- `/weave-nn/research/papers/sparse-memory-finetuning-analysis.md`

---

## 🎯 Step 5: Advanced Features

### Filter by Visual Properties:

**Dataview Query Example** (in any note):

```dataview
TABLE visual.icon as "Icon", type, status, priority
FROM ""
WHERE visual
SORT priority DESC
LIMIT 20
```

This shows all files with visual properties, their icons, and metadata.

### Search by CSS Class:

In Obsidian search:
```
path:.md cssclass:type-hub
path:.md cssclass:priority-high
path:.md cssclass:status-complete
```

### Graph Filters:

In graph view filters:
- `tag:#phase-13` - See Phase 13 files
- `tag:#implementation` - See implementation files
- `path:_planning` - See planning documents
- `path:weaver` - See Weaver codebase

---

## 🐛 Troubleshooting

### Colors Not Showing in Graph?

1. **Check CSS snippet is enabled**:
   - Settings → Appearance → CSS snippets
   - Toggle `weave-nn-colors` ON

2. **Reload Obsidian**:
   - Command Palette → `Reload app without saving`

3. **Check graph.json was loaded**:
   - File: `/weave-nn/.obsidian/graph.json`
   - Should have 22 color groups defined

### Icons Not Showing?

**File Explorer Icons**: Obsidian doesn't show frontmatter icons in file tree by default

**Workaround Options**:
1. Use plugins like "Icon Folder" or "Iconize"
2. View icons in frontmatter when file is open
3. Use Dataview to display icons in tables

### CSS Classes Not Applied?

1. **Verify frontmatter syntax**:
   ```yaml
   visual:
     cssclasses:
       - type-planning
       - status-active
   ```

2. **Check CSS snippet has the class**:
   - Open `.obsidian/snippets/weave-nn-colors.css`
   - Search for `.type-planning`

3. **Browser DevTools** (if using desktop app):
   - `Ctrl/Cmd + Shift + I` to open
   - Inspect element to see applied classes

---

## 📊 What You Should See

### Graph View (Most Dramatic):

**Before**:
- All nodes same color (gray/white)
- Hard to distinguish file types
- No visual organization

**After**:
- 🔵 Blue cluster (planning)
- 🟢 Green cluster (weaver)
- 🔴 Cyan cluster (docs)
- 🟣 Purple nodes (research)
- Clear visual hierarchy

### File Properties:

**Before**:
```yaml
---
title: Some Document
status: active
---
```

**After**:
```yaml
---
title: Some Document
type: planning
status: active
priority: high
visual:
  icon: "📋"
  color: "#3B82F6"
  cssclasses:
    - type-planning
    - status-active
    - priority-high
version: '3.0'
updated_date: '2025-10-28'
---
```

---

## 🎨 Color Reference

### By Type:

| Type | Color | Hex Code | CSS Class |
|------|-------|----------|-----------|
| Planning | Blue | #3B82F6 | `.type-planning` |
| Implementation | Green | #10B981 | `.type-implementation` |
| Research | Purple | #8B5CF6 | `.type-research` |
| Architecture | Amber | #F59E0B | `.type-architecture` |
| Testing | Red | #EF4444 | `.type-testing` |
| Documentation | Cyan | #06B6D4 | `.type-documentation` |
| Hub | Pink | #EC4899 | `.type-hub` |
| SOP | Lime | #84CC16 | `.type-sop` |

### By Status:

| Status | Color | Icon |
|--------|-------|------|
| Complete | Green | ✅ |
| In-Progress | Blue | 🔄 |
| Blocked | Red | 🚫 |
| Planned | Amber | 📋 |
| Active | Blue | ⚡ |

### By Priority:

| Priority | Color | Icon |
|----------|-------|------|
| Critical | Red | 🔴 |
| High | Amber | 🟡 |
| Medium | Blue | 🔵 |
| Low | Gray | ⚪ |

---

## 🚀 Next Steps

### After Setup:

1. **Explore the graph** - Navigate visually using colors
2. **Try Dataview queries** - Build dashboards with icons
3. **Customize CSS** - Adjust colors to your preference
4. **Add more files** - Run batch script on remaining 321 files

### Customization:

**Edit Colors**:
- File: `.obsidian/snippets/weave-nn-colors.css`
- Change hex codes to your preference
- Reload Obsidian to see changes

**Add New Types**:
1. Add to `weave-nn-colors.css`:
   ```css
   .type-custom { --doc-color: #YOUR_HEX; }
   ```
2. Add to batch script type mappings
3. Re-run on new files

---

## 📸 Screenshot Locations

Take screenshots to compare before/after:

1. **Graph View** - Full graph with colors
2. **File with Frontmatter** - Show visual properties
3. **Dataview Table** - Icons displayed in table
4. **CSS Inspector** - Show applied classes

---

## ✅ Success Checklist

- [ ] CSS snippet `weave-nn-colors` enabled
- [ ] Graph view shows colored nodes (blue, green, cyan clusters)
- [ ] Can filter graph by path/tags
- [ ] Files have `visual` property in frontmatter
- [ ] Icons visible in frontmatter (📋, 🌐, 🏗️, etc.)
- [ ] Version shows `3.0` in enhanced files
- [ ] Can search by cssclass
- [ ] Dataview queries work (if plugin installed)

---

## 🆘 Need Help?

### Common Issues:

**Q: Colors not showing at all**
- A: Check CSS snippet is enabled AND toggled on

**Q: Some colors missing**
- A: Reload Obsidian after enabling snippet

**Q: Icons not in file tree**
- A: Normal - Obsidian doesn't show frontmatter icons by default
- A: Use "Icon Folder" plugin or view in frontmatter

**Q: Graph looks the same**
- A: Verify `graph.json` was loaded
- A: Check "Color groups" is enabled in graph view

### Files to Check:

1. `.obsidian/snippets/weave-nn-colors.css` - CSS exists?
2. `.obsidian/graph.json` - 22 color groups defined?
3. Any enhanced file - Has `visual` property?

---

**Quick Test**: Open graph view. Do you see different colored nodes? ✅ Success!

**Full Test**: Open `/weaver/docs/WEAVER-DOCS-HUB.md`. Does frontmatter have `visual: icon: "🌐"`? ✅ Success!

---

*Setup Time: ~5 minutes*
*Files Enhanced: 267 (45% coverage)*
*Colors Available: 50+*
*Icons Mapped: 50+*
