# Graph Color Activation - Step by Step

**Issue**: Color groups exist in graph.json but not showing in Obsidian graph view

---

## 🔄 Step-by-Step Activation

### Step 1: Close Obsidian COMPLETELY

**Important**: Don't just close the graph view - close the entire Obsidian app

**Windows**:
- Right-click taskbar icon → Close window
- Or Alt+F4

**Mac**:
- Cmd+Q (don't just Cmd+W)

**Linux**:
- Close all windows
- Or `killall obsidian` in terminal

### Step 2: Verify graph.json Has Color Groups

**In terminal** (while Obsidian is closed):
```bash
cd /home/aepod/dev/weave-nn
cat weave-nn/.obsidian/graph.json | grep -c "query"
```

**Should show**: 22 (number of color groups)

**If shows 0**: Run this to restore:
```bash
git checkout weave-nn/.obsidian/graph.json
```

### Step 3: Reopen Obsidian

**Start Obsidian fresh**
- Open the weave-nn vault
- Wait for it to fully load

### Step 4: Open Graph View

**Command Palette**:
1. Press `Ctrl/Cmd + P`
2. Type: `graph`
3. Select: `Graph view: Open graph view`
4. Press Enter

### Step 5: Check for Color Groups Section

**In the graph view, look at the RIGHT PANEL**:

You should see sections like:
- ✓ Files
- ✓ Groups
- ✓ Display
- ✓ Forces
- ✓ **Color groups** ← THIS ONE!

**Click on "Color groups" to expand it**

You should see 22 color rules like:
- path:_planning (blue)
- path:weaver (green)
- path:docs (cyan)
- etc.

### Step 6: If Color Groups Section is Missing

**Try this**:

1. In graph view right panel, look for a **gear icon** or **settings button**
2. Click it
3. Look for "Show color groups" or similar toggle
4. Enable it

### Step 7: Manually Activate One Color Group

If groups appear but nodes are still white:

1. **Click on ONE color group** (e.g., "path:_planning")
2. It should **highlight** nodes matching that path
3. Try clicking different groups
4. Colors should start appearing

---

## 🎨 Alternative Method: Add Color Group via UI

If the above doesn't work, try adding ONE group manually:

### In Graph View:

1. Look for "Color groups" section (right panel)
2. Click **"+ Add group"** or **"New group"** button
3. In the query field, type: `path:_planning`
4. Pick a **blue color**
5. Click "Save" or close the dialog

**This should**:
- Trigger Obsidian to load the other 22 groups from graph.json
- Make the nodes visible with colors

---

## 🔍 Visual Guide: Where to Look

### Graph View Layout:

```
┌─────────────────────────────────────────────┐
│  [Search]                         [X Close] │
├─────────────────────┬───────────────────────┤
│                     │  RIGHT PANEL:         │
│                     │  ┌─────────────────┐  │
│   GRAPH NODES       │  │ Files           │  │
│   (Should be        │  │ Groups          │  │
│    colored)         │  │ Display         │  │
│                     │  │ Forces          │  │
│   ○ ○ ○             │  │ Color groups ←  │  │
│  ○ ○ ○ ○            │  └─────────────────┘  │
│   ○ ○ ○             │                       │
└─────────────────────┴───────────────────────┘
```

### Color Groups Section (Expanded):

```
┌─────────────────────────────────────┐
│ Color groups                    [^] │
├─────────────────────────────────────┤
│ ✓ path:_planning        [blue]      │
│ ✓ path:weaver          [green]      │
│ ✓ path:docs            [cyan]       │
│ ✓ path:architecture    [amber]      │
│ ✓ tag:#phase-13        [purple]     │
│ ... (22 total)                      │
│                                     │
│ [+ New group]                       │
└─────────────────────────────────────┘
```

---

## 🐛 Still Not Working? Try This:

### Nuclear Option: Reset Graph View

1. **Close Obsidian completely**

2. **Backup current graph.json**:
```bash
cp weave-nn/.obsidian/graph.json weave-nn/.obsidian/graph.json.backup
```

3. **Delete graph.json** (Obsidian will recreate it):
```bash
rm weave-nn/.obsidian/graph.json
```

4. **Open Obsidian** (it creates new graph.json)

5. **Open graph view**

6. **Manually add ONE color group**:
   - Color groups section → "+ New group"
   - Query: `path:_planning`
   - Color: Blue (#3B82F6)

7. **Close Obsidian**

8. **Restore our graph.json with all 22 groups**:
```bash
cp weave-nn/.obsidian/graph.json.backup weave-nn/.obsidian/graph.json
```

9. **Reopen Obsidian** → Graph view should now show all 22 groups

---

## ✅ Success Checklist

After following steps, you should have:

- [ ] Obsidian reopened fresh
- [ ] Graph view open
- [ ] Right panel visible
- [ ] "Color groups" section exists
- [ ] Section shows "22 groups" or lists them
- [ ] Clicking a group highlights matching nodes
- [ ] Full graph shows different colored nodes (not all white)

---

## 🎯 Expected Result

**Before**: All nodes white/gray
**After**:
- Blue cluster (planning files)
- Green cluster (weaver files)
- Cyan cluster (docs)
- Purple nodes (research)
- Amber nodes (architecture)
- Pink nodes (hubs)

---

## 📞 Debug Commands

If still having issues, run these to check:

```bash
# Verify graph.json has content
cat weave-nn/.obsidian/graph.json | head -20

# Count color groups
cat weave-nn/.obsidian/graph.json | grep -c '"query"'

# Check collapse setting
cat weave-nn/.obsidian/graph.json | grep collapse-color

# Check if Obsidian is running
ps aux | grep -i obsidian
```

---

**Most Common Fix**: Close Obsidian completely, reopen, and the color groups should appear in the right panel. Click on them to activate!

*Updated: 2025-10-28*
