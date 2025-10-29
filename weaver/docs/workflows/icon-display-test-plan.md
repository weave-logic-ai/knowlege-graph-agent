---
title: Icon Display Test Plan
type: documentation
status: complete
phase_id: PHASE-14
tags:
  - testing
  - icons
  - quality-assurance
  - obsidian
domain: knowledge-graph
scope: system
priority: high
created_date: 2025-10-28T23:35:00.000Z
updated_date: 2025-10-28T23:35:00.000Z
version: '1.0'
visual:
  icon: "✅"
  color: '#22C55E'
  cssclasses:
    - type-documentation
    - status-complete
    - priority-high
---

# Icon Display Test Plan

**Comprehensive testing protocol for visual icon system**

## Test Environment

- **Obsidian Version**: v1.0.0+
- **Plugin**: obsidian-icon-folder (latest)
- **Vault**: `/home/aepod/dev/weave-nn/weave-nn`
- **Files**: 1,447 markdown files
- **Expected Icons**: 109 files with icons applied

## Test Scope

### In-Scope
- File explorer icon display
- Graph view icon display and styling
- Tab icon display
- Wikilink icon display
- Frontmatter icon metadata
- CSS snippet functionality
- Plugin configuration
- Icon mapping rules
- Accessibility features

### Out-of-Scope
- Third-party theme compatibility
- Mobile app (separate test plan)
- Obsidian Sync/Publish
- Export formats

## Test Categories

### 1. File Explorer Icons ✅

**Objective**: Verify icons display correctly in file explorer sidebar

#### Test Cases

##### TC-FE-01: Folder Icons
**Steps**:
1. Open file explorer sidebar
2. Navigate to `_planning/` folder
3. Verify 📋 icon appears
4. Navigate to `architecture/` folder
5. Verify 🏗️ icon appears
6. Navigate to `research/` folder
7. Verify 🔬 icon appears

**Expected**: All folders show correct icons based on `data.json` mappings

**Priority**: High
**Status**: ⏸️ Pending

##### TC-FE-02: File Icons
**Steps**:
1. Expand `_planning/` folder
2. Observe icons on individual files
3. Verify icons match frontmatter `visual.icon`
4. Check multiple file types (planning, research, hub)

**Expected**: Each file displays icon from its frontmatter

**Priority**: High
**Status**: ⏸️ Pending

##### TC-FE-03: Hub File Icons
**Steps**:
1. Navigate to any file ending in `-hub.md`
2. Verify 🌐 icon appears
3. Check size is consistent with other icons

**Expected**: All hub files show globe icon

**Priority**: Medium
**Status**: ⏸️ Pending

##### TC-FE-04: Icon Consistency
**Steps**:
1. Select 10 random planning files
2. Verify all show 📋 icon
3. Select 10 random research files
4. Verify all show 🔬 icon

**Expected**: Icon matches file type/path/tags consistently

**Priority**: High
**Status**: ⏸️ Pending

##### TC-FE-05: Missing Icons
**Steps**:
1. Find file without `visual.icon` in frontmatter
2. Verify no icon appears (or default icon)
3. Run icon workflow
4. Verify icon now appears

**Expected**: Files without icons handled gracefully

**Priority**: Low
**Status**: ⏸️ Pending

### 2. Graph View Icons ✅

**Objective**: Verify icons and styling display correctly in graph view

#### Test Cases

##### TC-GV-01: Icon Display
**Steps**:
1. Open graph view (`Cmd/Ctrl + G`)
2. Zoom to see individual nodes clearly
3. Verify icons appear above nodes
4. Check icons are readable (14px font size)
5. Verify icon background circle (white/background color)

**Expected**: All nodes with `visual.icon` show icons clearly

**Priority**: High
**Status**: ⏸️ Pending

##### TC-GV-02: Node Colors by Type
**Steps**:
1. Locate planning nodes (blue)
2. Locate research nodes (purple)
3. Locate implementation nodes (green)
4. Locate hub nodes (pink, larger)
5. Locate documentation nodes (cyan)

**Expected**: Each type has distinct color per `graph-view-icons.css`

**Priority**: High
**Status**: ⏸️ Pending

##### TC-GV-03: Hub Node Sizing
**Steps**:
1. Find hub nodes in graph (files ending `-hub.md`)
2. Measure visual size compared to regular nodes
3. Verify hub nodes are approximately 1.6x larger (r: 8 vs 5)

**Expected**: Hub nodes visually prominent with larger radius

**Priority**: Medium
**Status**: ⏸️ Pending

##### TC-GV-04: Status Indicators
**Steps**:
1. Find node with `status: in-progress`
2. Verify amber outline
3. Verify pulsing animation (2s cycle)
4. Find node with `status: complete`
5. Verify green outline, no animation
6. Find node with `status: blocked`
7. Verify red dashed outline

**Expected**: Status reflected in node styling

**Priority**: High
**Status**: ⏸️ Pending

##### TC-GV-05: Priority Indicators
**Steps**:
1. Find `priority: critical` node
2. Verify red glow (drop-shadow)
3. Verify larger size (r: 7)
4. Find `priority: high` node
5. Verify amber glow
6. Find `priority: low` node
7. Verify smaller, subtle appearance

**Expected**: Priority affects node size and glow

**Priority**: Medium
**Status**: ⏸️ Pending

##### TC-GV-06: Phase Halos
**Steps**:
1. Find `phase-12` tagged node
2. Verify purple halo
3. Find `phase-13` tagged node
4. Verify blue halo
5. Find `phase-14` tagged node
6. Verify pink halo

**Expected**: Phase tags add colored halos

**Priority**: Low
**Status**: ⏸️ Pending

##### TC-GV-07: Hover States
**Steps**:
1. Hover over any node
2. Verify icon enlarges (14px → 16px)
3. Verify outline appears (3px stroke)
4. Verify cursor changes to pointer
5. Move mouse away
6. Verify icon returns to normal

**Expected**: Smooth hover transitions

**Priority**: Medium
**Status**: ⏸️ Pending

##### TC-GV-08: Link Highlighting
**Steps**:
1. Hover over node with connections
2. Verify connected links highlight (amber, 2px, 0.8 opacity)
3. Hover over link directly
4. Verify link highlights

**Expected**: Connections visible on hover

**Priority**: Low
**Status**: ⏸️ Pending

### 3. Tab Icons ✅

**Objective**: Verify icons display in open tab headers

#### Test Cases

##### TC-TB-01: Single Tab
**Steps**:
1. Open a planning document
2. Verify 📋 icon in tab header
3. Close tab
4. Open a research document
5. Verify 🔬 icon in tab header

**Expected**: Tab icon matches document icon

**Priority**: High
**Status**: ⏸️ Pending

##### TC-TB-02: Multiple Tabs
**Steps**:
1. Open 5 different document types in tabs
2. Verify each tab shows correct icon
3. Switch between tabs
4. Verify icons remain consistent

**Expected**: All tabs show correct icons simultaneously

**Priority**: High
**Status**: ⏸️ Pending

##### TC-TB-03: Tab Icon Updates
**Steps**:
1. Open document without icon
2. Note tab has no icon (or default)
3. Run icon workflow to add icon
4. Refresh/reload document
5. Verify icon now appears in tab

**Expected**: Tab icon updates when frontmatter changes

**Priority**: Low
**Status**: ⏸️ Pending

### 4. Wikilink Icons ✅

**Objective**: Verify icons display inline with wikilinks

#### Test Cases

##### TC-WL-01: Internal Links
**Steps**:
1. Open document with wikilinks
2. Locate link to planning document
3. Verify 📋 icon before link text
4. Locate link to research document
5. Verify 🔬 icon before link text

**Expected**: Link icons match target document type

**Priority**: Medium
**Status**: ⏸️ Pending

##### TC-WL-02: Link Icon Consistency
**Steps**:
1. Find document linked from multiple places
2. Verify same icon appears in all link instances
3. Check icon matches target file's frontmatter

**Expected**: Consistent icon across all references

**Priority**: Medium
**Status**: ⏸️ Pending

##### TC-WL-03: Broken Links
**Steps**:
1. Create wikilink to non-existent file
2. Verify no icon or placeholder icon
3. Create the target file with icon
4. Verify icon now appears in link

**Expected**: Graceful handling of broken links

**Priority**: Low
**Status**: ⏸️ Pending

### 5. Icon Mapping Rules ✅

**Objective**: Verify icon determination logic works correctly

#### Test Cases

##### TC-IM-01: Tag Priority
**Steps**:
1. Create file in `_planning/` (path would give 📋)
2. Add `status/complete` tag (tag should give ✅)
3. Run icon workflow
4. Verify icon is ✅ (tag wins over path)

**Expected**: Tag-based icons override path-based icons

**Priority**: High
**Status**: ⏸️ Pending

##### TC-IM-02: Path Patterns
**Steps**:
1. Create file in `_planning/` without tags
2. Run icon workflow
3. Verify icon is 📋
4. Move file to `research/`
5. Re-run workflow
6. Verify icon changes to 🔬

**Expected**: Path patterns correctly determine icons

**Priority**: High
**Status**: ⏸️ Pending

##### TC-IM-03: Hub File Priority
**Steps**:
1. Create file `test-hub.md` in `_planning/`
2. Run icon workflow
3. Verify icon is 🌐 (hub pattern priority 100 > planning priority 50)

**Expected**: Hub pattern wins over directory pattern

**Priority**: Medium
**Status**: ⏸️ Pending

##### TC-IM-04: Frontmatter Type Fallback
**Steps**:
1. Create file outside standard directories
2. Set `type: research` in frontmatter
3. Run icon workflow
4. Verify icon is 🔬

**Expected**: Frontmatter type used when no path/tag match

**Priority**: Medium
**Status**: ⏸️ Pending

##### TC-IM-05: Existing Icon Preservation
**Steps**:
1. Create file with `visual.icon: "🎯"`
2. Run icon workflow
3. Verify icon remains 🎯 (not overwritten)

**Expected**: Existing icons are preserved

**Priority**: High
**Status**: ⏸️ Pending

### 6. Accessibility ✅

**Objective**: Verify icon system meets accessibility standards

#### Test Cases

##### TC-AC-01: High Contrast Mode
**Steps**:
1. Enable system high contrast mode
2. Open graph view
3. Verify nodes have 2px stroke width
4. Verify links have 2px width and 0.6 opacity
5. Confirm icons remain readable

**Expected**: Enhanced visibility in high contrast mode

**Priority**: High
**Status**: ⏸️ Pending

##### TC-AC-02: Reduced Motion
**Steps**:
1. Enable system reduced motion setting
2. Open graph view
3. Find `status: in-progress` node
4. Verify pulse animation is disabled
5. Verify other styling remains

**Expected**: Animations respect reduced motion preference

**Priority**: High
**Status**: ⏸️ Pending

##### TC-AC-03: Screen Reader Support
**Steps**:
1. Enable screen reader (VoiceOver/NVDA)
2. Navigate file explorer with keyboard
3. Verify icon descriptions announced
4. Navigate graph view
5. Verify node types announced

**Expected**: Icons have semantic labels

**Priority**: Medium
**Status**: ⏸️ Pending

##### TC-AC-04: Color Blindness
**Steps**:
1. Use color blindness simulator (deuteranopia, protanopia, tritanopia)
2. View graph view in each mode
3. Verify node types distinguishable by icon shape
4. Confirm not relying solely on color

**Expected**: Icons provide shape-based differentiation

**Priority**: Medium
**Status**: ⏸️ Pending

##### TC-AC-05: Keyboard Navigation
**Steps**:
1. Use only keyboard (no mouse)
2. Navigate file explorer with arrow keys
3. Open files with Enter
4. Navigate graph with Tab/arrow keys
5. Verify icons visible throughout

**Expected**: Full keyboard accessibility

**Priority**: High
**Status**: ⏸️ Pending

### 7. Performance ✅

**Objective**: Verify icon system doesn't degrade performance

#### Test Cases

##### TC-PF-01: File Explorer Performance
**Steps**:
1. Open vault with 1,447 files
2. Expand all folders
3. Scroll through file list quickly
4. Measure scroll smoothness (60 FPS target)
5. Monitor CPU/memory usage

**Expected**: No noticeable lag with all icons displayed

**Priority**: Medium
**Status**: ⏸️ Pending

##### TC-PF-02: Graph View Performance
**Steps**:
1. Open full graph (all 1,447 nodes)
2. Zoom in/out smoothly
3. Pan across graph
4. Measure frame rate during interaction
5. Monitor CPU/memory usage

**Expected**: Smooth graph interactions (30+ FPS)

**Priority**: High
**Status**: ⏸️ Pending

##### TC-PF-03: Large File Performance
**Steps**:
1. Open document with 100+ wikilinks
2. Scroll through document
3. Measure render time
4. Check for icon loading delays

**Expected**: No delay rendering inline icons

**Priority**: Low
**Status**: ⏸️ Pending

##### TC-PF-04: Workflow Execution Time
**Steps**:
1. Run: `npx weaver cultivate --icons --mode full`
2. Measure total duration
3. Compare to dry-run benchmark (0.23s for 374 files)
4. Verify < 1 second for 500 files

**Expected**: Fast icon application (< 0.5s per 100 files)

**Priority**: Medium
**Status**: ⏸️ Pending

## Test Execution

### Prerequisites Checklist

- [ ] Icon workflow executed: `npx weaver cultivate --icons --mode full`
- [ ] Icon Folder plugin installed and enabled
- [ ] CSS snippet enabled in Obsidian settings
- [ ] `data.json` configuration file present
- [ ] `graph.json` color groups configured
- [ ] Test vault has representative file types

### Execution Order

1. **File Explorer Icons** (TC-FE-01 to TC-FE-05)
2. **Icon Mapping Rules** (TC-IM-01 to TC-IM-05)
3. **Tab Icons** (TC-TB-01 to TC-TB-03)
4. **Wikilink Icons** (TC-WL-01 to TC-WL-03)
5. **Graph View Icons** (TC-GV-01 to TC-GV-08)
6. **Accessibility** (TC-AC-01 to TC-AC-05)
7. **Performance** (TC-PF-01 to TC-PF-04)

### Test Data

#### Sample Files for Testing

```bash
# Planning files
weave-nn/_planning/daily-logs/2025-10-28.md
weave-nn/_planning/phases/phase-14-obsidian-integration.md

# Research files
weave-nn/research/research-overview-hub.md
weave-nn/docs/research/phase-12-paper-analysis.md

# Hub files
weave-nn/weave-nn-project-hub.md
weave-nn/architecture/architecture-overview-hub.md

# Implementation files
weaver/weaver-implementation-hub.md
weaver/src/workflows/kg/icon-application.ts

# Documentation files
weave-nn/docs/documentation-hub.md
weaver/docs/workflows/icon-cultivation-workflow.md
```

## Results Tracking

### Test Summary Template

| Category | Total | Passed | Failed | Blocked | Pass Rate |
|----------|-------|--------|--------|---------|-----------|
| File Explorer | 5 | 0 | 0 | 0 | 0% |
| Graph View | 8 | 0 | 0 | 0 | 0% |
| Tabs | 3 | 0 | 0 | 0 | 0% |
| Wikilinks | 3 | 0 | 0 | 0 | 0% |
| Icon Mapping | 5 | 0 | 0 | 0 | 0% |
| Accessibility | 5 | 0 | 0 | 0 | 0% |
| Performance | 4 | 0 | 0 | 0 | 0% |
| **TOTAL** | **33** | **0** | **0** | **0** | **0%** |

### Defect Tracking

| ID | Category | Severity | Description | Status |
|----|----------|----------|-------------|--------|
| - | - | - | - | - |

## Acceptance Criteria

### Must Pass (Blockers)

- ✅ TC-FE-01: Folder icons display correctly
- ✅ TC-FE-02: File icons display correctly
- ✅ TC-GV-01: Graph node icons display
- ✅ TC-GV-02: Graph node colors by type
- ✅ TC-TB-01: Single tab icon display
- ✅ TC-IM-01: Tag priority over path
- ✅ TC-IM-05: Existing icons preserved
- ✅ TC-AC-01: High contrast mode support
- ✅ TC-AC-02: Reduced motion support

### Should Pass (Important)

- ✅ TC-GV-04: Status indicators
- ✅ TC-GV-05: Priority indicators
- ✅ TC-TB-02: Multiple tabs
- ✅ TC-WL-01: Internal link icons
- ✅ TC-IM-02: Path pattern detection
- ✅ TC-AC-05: Keyboard navigation
- ✅ TC-PF-02: Graph view performance

### Nice to Have (Optional)

- ✅ TC-GV-06: Phase halos
- ✅ TC-GV-07: Hover states
- ✅ TC-WL-03: Broken link handling
- ✅ TC-AC-03: Screen reader support
- ✅ TC-PF-03: Large file performance

## Sign-Off

### Test Completion Criteria

- [ ] All "Must Pass" tests passed
- [ ] 90%+ "Should Pass" tests passed
- [ ] No critical/high severity defects open
- [ ] Performance benchmarks met
- [ ] Accessibility standards met (WCAG 2.1 Level AA)
- [ ] Documentation complete

### Stakeholder Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | - | - | - |
| QA Lead | - | - | - |
| Accessibility Reviewer | - | - | - |
| Product Owner | - | - | - |

## Related Documentation

- [[icon-cultivation-workflow]] - Automated icon application
- [[obsidian-icon-activation-guide]] - Setup instructions
- [[obsidian-icon-system]] - Icon mapping reference
- [[metadata-schema-v3]] - Frontmatter specification

---

**Test Plan Version**: 1.0
**Created**: 2025-10-28
**Status**: Ready for Execution ✅
