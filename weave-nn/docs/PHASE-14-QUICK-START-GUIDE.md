---
title: Phase 14 - Obsidian Visual Intelligence Quick Start
type: documentation
status: complete
phase_id: PHASE-14
tags:
  - phase/phase-14
  - obsidian
  - quickstart
  - guide
  - type/documentation
  - status/complete
domain: knowledge-graph
priority: high
visual:
  icon: "\U0001F680"
  color: '#10B981'
  cssclasses:
    - type-documentation
    - status-complete
    - priority-high
updated: '2025-10-29T04:55:05.288Z'
keywords:
  - 'step 1: enable css (30 seconds)'
  - related
  - 'step 2: enable nested tags (30 seconds)'
  - 'step 3: run batch script (2 minutes)'
  - 'step 4: view graph (1 minute)'
  - verify installation
  - check css is active
  - check icons display
  - check tags work
  - what you get
---

# Phase 14 - Obsidian Visual Intelligence Quick Start

**5-Minute Setup Guide**

Get visual intelligence running in your Weave-NN knowledge graph in under 5 minutes.

## Step 1: Enable CSS (30 seconds)

1. Open Obsidian
2. `Settings` → `Appearance` → `CSS snippets`
3. Click refresh button if `weave-nn-colors` doesn't appear
4. Toggle **ON**: `weave-nn-colors`
5. Close settings

✅ You should now see colored borders on planning documents!



## Related

[[PHASE-14-WEEK-1-COMPLETION-SUMMARY]]
## Step 2: Enable Nested Tags (30 seconds)

1. `Settings` → `Appearance`
2. Toggle **ON**: `Show nested tags`
3. `Settings` → `Files & Links`
4. Toggle **ON**: `Use nested tags in tag pane`
5. Close settings

✅ Tag pane now shows hierarchical structure!

## Step 3: Run Batch Script (2 minutes)

```bash
cd weave-nn

# Preview what will change (safe, no modifications)
bun run scripts/add-obsidian-visual-properties.ts --dry-run

# Apply visual properties to all files
bun run scripts/add-obsidian-visual-properties.ts
```

Expected output:
```
🎨 Obsidian Visual Properties Batch Addition
Found 1,416 markdown files
✅ Enhanced: 1,200
⏭️  Skipped: 150 (no frontmatter)
❌ Errors: 0
✨ Done!
```

✅ All files now have visual properties!

## Step 4: View Graph (1 minute)

1. Open graph view: `Ctrl/Cmd + G`
2. Colors should automatically apply
3. Try filters:
   - `tag:#phase/phase-14` - Pink nodes
   - `tag:#status/complete` - Green nodes
   - `tag:#priority/critical` - Red nodes

✅ Graph is now color-coded!

## Verify Installation

### Check CSS is Active

1. Open any planning document
2. Should see **blue left border**
3. H1 header should be **blue**

### Check Icons Display

1. Edit a document's frontmatter:
   ```yaml
   visual:
     icon: "🔬"
   ```
2. File name should show 🔬 in file explorer

### Check Tags Work

1. Add hierarchical tag:
   ```yaml
   tags: [phase/phase-14/obsidian]
   ```
2. Tag pane should show nested structure
3. Tag should be color-coded

## What You Get

### Colors

- **Blue**: Planning documents
- **Green**: Implementation/Complete
- **Purple**: Research
- **Amber**: Architecture
- **Red**: Testing/Blocked
- **Cyan**: Documentation
- **Pink**: Hubs/Phase 14
- **Lime**: SOPs

### Icons

- 📋 Planning
- ⚙️ Implementation
- 🔬 Research
- 🏗️ Architecture
- ✅ Complete
- 🔄 In Progress
- 🚫 Blocked
- 🎨 Phase 14

### Graph Features

- Color-coded nodes
- Hierarchical grouping
- Orphan detection
- Relationship visualization

## Common Issues

### CSS Not Working

**Problem**: No colored borders
**Fix**:
1. Check snippet is enabled
2. Reload: `Ctrl/Cmd + R`
3. Try toggling snippet off/on

### Script Errors

**Problem**: Script fails to run
**Fix**:
```bash
# Install dependencies first
bun install gray-matter

# Then run script
bun run scripts/add-obsidian-visual-properties.ts
```

### Tags Not Nested

**Problem**: Tags show flat
**Fix**:
1. Use `/` in tags: `#phase/phase-14`
2. Enable nested tags in settings
3. Restart Obsidian

## Next Steps

### Week 2: Enhance Properties

1. Review batch script output
2. Fix any errors
3. Add missing properties manually

### Week 3: RDR Integration

1. Add RDR visual properties
2. Link RDRs to knowledge graph
3. Enable autonomous learning

## Learn More

- [[PHASE-14-OBSIDIAN-VISUAL-ENHANCEMENTS]] - Full implementation guide
- [[metadata-schema-v3]] - Complete frontmatter spec
- [[obsidian-icon-system]] - Icon reference
- [[tag-hierarchy-system]] - Tag structure
- [[weave-nn-colors.css]] - CSS documentation

## Support

Having issues? Check:
1. Obsidian version (requires v0.12.0+)
2. CSS snippet enabled
3. Script ran successfully
4. Files have frontmatter

---

**Setup Time**: 5 minutes
**Files Enhanced**: 1,416
**Visual Features**: 50+ colors, 50+ icons, 8 tag hierarchies
