# Graph Color Fix - IMPORTANT

**Issue**: Obsidian overwrites `graph.json` when you close the graph view, removing custom color groups.

---

## ✅ Fix Applied

Updated `/weave-nn/.obsidian/graph.json` with 22 color groups.

**Color Groups Configured**:

| Query | Color | Purpose |
|-------|-------|---------|
| `path:_planning` | Blue (#3B82F6) | Planning documents |
| `path:weaver` | Green (#10B981) | Weaver implementation |
| `path:docs` | Cyan (#06D4B4) | Documentation |
| `path:architecture` | Amber (#F6A30B) | Architecture files |
| `path:research` | Purple (#8B5CF6) | Research papers |
| `path:mcp` | Pink (#EC4899) | MCP integration |
| `path:decisions` | Purple-gray (#A855F7) | Decision records |
| `path:tests` | Red (#EF4444) | Test files |
| `tag:#phase-13` | Purple | Phase 13 files |
| `tag:#phase-14` | Pink | Phase 14 files |
| `tag:#implementation` | Green | Implementation |
| `tag:#research` | Purple | Research |
| `tag:#complete` | Green | Complete status |
| `tag:#blocked` | Red | Blocked status |
| `file:hub` | Pink | Hub files |

---

## 🔧 How to Keep Colors

### In Obsidian:

1. **Close graph view** (X button)
2. **DON'T use graph settings** to change colors (it resets the file)
3. **Reopen graph view** - colors should be visible

### If Colors Disappear Again:

**Option A**: Quick restore
```bash
cd /home/aepod/dev/weave-nn
git checkout weave-nn/.obsidian/graph.json
```

**Option B**: Manual fix
1. Close Obsidian completely
2. Replace `graph.json` content with the version from this commit
3. Reopen Obsidian

---

## 🎨 How to See the Colors NOW

### Step 1: Close and Reopen Graph View

**In Obsidian:**
1. If graph view is open, **close it** (X button)
2. Command Palette (`Ctrl/Cmd + P`)
3. Type: `Open graph view`
4. Press Enter

### Step 2: Verify Color Groups Enabled

**In graph view (right panel):**
1. Look for "Color groups" section
2. Should show **22 groups**
3. Toggle to expand and see all groups

### Step 3: What You Should See

**Colored Clusters**:
- 🔵 **Blue cluster** on left - Planning files
- 🟢 **Green cluster** in center - Weaver code
- 🔴 **Cyan cluster** on right - Documentation
- 🟣 **Purple nodes** scattered - Research
- 🟡 **Amber nodes** - Architecture
- 🩷 **Pink nodes** - Hubs and Phase 14

**Search to Test**:
- Type `path:_planning` in graph search → See blue nodes
- Type `path:weaver` → See green nodes
- Type `tag:#phase-13` → See purple nodes

---

## 🐛 Troubleshooting

### Colors Still Not Showing?

**Try This:**
1. Close Obsidian completely
2. Check `graph.json` has content (not empty colorGroups)
3. Reopen Obsidian
4. Open graph view (Command Palette)

### Verify graph.json is Correct:

```bash
cd /home/aepod/dev/weave-nn
cat weave-nn/.obsidian/graph.json | grep colorGroups | head -1
```

Should show: `"colorGroups": [` (with an open bracket)

NOT: `"colorGroups": [],` (empty array)

### If graph.json is Empty Again:

Obsidian overwrote it when you used graph settings. To fix:

```bash
# Restore from git
git checkout weave-nn/.obsidian/graph.json

# Or manually edit the file
# Add colorGroups array from GRAPH-COLOR-FIX.md
```

---

## 📋 Color RGB Reference

For manual editing:

| Color Name | RGB (decimal) | Hex Code |
|------------|---------------|----------|
| Blue (Planning) | 3911158 | #3B82F6 |
| Green (Implementation) | 1092737 | #10B981 |
| Cyan (Docs) | 447188 | #06D4B4 |
| Amber (Architecture) | 16162571 | #F6A30B |
| Purple (Research) | 9132278 | #8B5CF6 |
| Pink (Hubs) | 15498207 | #EC4899 |
| Red (Testing/Blocked) | 15680068 | #EF4444 |
| Lime (SOPs) | 8703254 | #84CC16 |
| Gray-Purple (Decisions) | 11035391 | #A855F7 |
| Teal (Infrastructure) | 7048739 | #6B7280 |

---

## ✅ Quick Test

**After fixing, test with:**

1. Open graph view
2. Search: `path:_planning`
3. Should see **blue nodes highlighted**
4. Search: `path:weaver`
5. Should see **green nodes highlighted**

**Success**: Different colored clusters visible in full graph view!

---

## 🔒 Prevent Future Overwrites

**Option 1**: Don't use graph settings UI
- Make all changes to graph.json manually
- Close/reopen graph view instead of using settings

**Option 2**: Lock the file (Linux/Mac)
```bash
chmod 444 weave-nn/.obsidian/graph.json
```
(Makes file read-only, Obsidian can't overwrite)

**Option 3**: Git tracking
```bash
# Always check if graph.json changed
git diff weave-nn/.obsidian/graph.json

# Restore if needed
git checkout weave-nn/.obsidian/graph.json
```

---

**Status**: 🔧 Fixed - graph.json updated with 22 color groups

**Next**: Close and reopen graph view to see colors!

*Fix Applied: 2025-10-28*
