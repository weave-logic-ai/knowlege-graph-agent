---
title: 'Guide: How to Track Cognitive Variability'
type: documentation
status: in-progress
tags:
  - type/research
  - status/in-progress
priority: medium
related:
  - '[[cognitive-variability]]'
  - '[[ecological-thinking]]'
  - '[[graph-topology-analysis]]'
  - '[[F-017-cognitive-variability-tracker]]'
visual:
  icon: "\U0001F4DA"
  color: '#06B6D4'
  cssclasses:
    - type-documentation
updated: '2025-10-29T04:55:05.854Z'
version: '3.0'
keywords:
  - overview
  - prerequisites
  - understanding cognitive variability
  - the four cognitive phases
  - steps
  - 1. set up frontmatter template
  - 2. add cognitive tracking to daily notes
  - morning review
  - work sessions
  - 'session 1: [time]'
---

# How to Track Cognitive Variability

## Overview

This guide walks you through implementing cognitive variability tracking in your Obsidian vault. Cognitive variability tracking helps you understand and optimize your thinking patterns across four distinct cognitive phases: Feeding, Parking, Exploration, and Assembly. By tracking these patterns, you can identify breakthrough moments, improve knowledge retention, and optimize your knowledge work.

**What you'll accomplish**:
- Set up frontmatter templates for tracking cognitive patterns
- Learn to identify your current cognitive phase
- Track thinking-pattern transitions
- Analyze cognitive variability over time
- Recognize breakthrough moments in your work

## Prerequisites

**Required**:
- Obsidian vault with graph view enabled
- Basic YAML frontmatter knowledge
- Understanding of wikilinks

**Recommended**:
- Dataview plugin installed (for automated tracking queries)
- Templater plugin (for automatic frontmatter insertion)
- Graph Analysis plugin or similar (for visual metrics)

**Knowledge Prerequisites**:
- Read [[cognitive-variability]] concept document
- Understand the four cognitive phases
- Familiarity with InfraNodus network metrics

## Understanding Cognitive Variability

### The Four Cognitive Phases

Before starting, understand what you're tracking:

**1. Feeding Phase (High Divergence)**
- **Characteristics**: Rapid note capture, many new nodes, few connections
- **Mental State**: Exploratory, absorbing information
- **Metrics**: New nodes/existing nodes > 0.2
- **When**: Research, reading, learning new domains
- **Example**: Reading 5 papers, creating atomic notes for each

**2. Parking Phase (Medium State)**
- **Characteristics**: Notes accessible but not actively worked, moderate connections
- **Mental State**: Letting ideas percolate
- **Metrics**: 0.1 < new connections/total nodes < 0.3
- **When**: Between projects, waiting for insights
- **Example**: Notes from last month available but not currently linking

**3. Exploration Phase (Gap Bridging)**
- **Characteristics**: Discovering latent connections, high betweenness changes
- **Mental State**: Making unexpected connections, "aha moments"
- **Metrics**: Betweenness change > 0.2
- **When**: Connecting disparate ideas, finding patterns
- **Example**: Linking machine learning concepts to business strategy

**4. Assembly Phase (High Convergence)**
- **Characteristics**: Organizing for output, increased local density
- **Mental State**: Synthesizing, producing deliverables
- **Metrics**: Clustering coefficient > 0.6
- **When**: Writing reports, creating presentations
- **Example**: Assembling project documentation from notes

## Steps

### 1. Set Up Frontmatter Template

Create a template file for cognitive variability tracking.

**Action**: Create `/templates/cognitive-tracking-template.md`

```yaml
---
# Core Metadata
type: {{type}}  # concept, note, moc, daily
created: {{date}}
last_modified: {{date}}

# Cognitive Phase Tracking
cognitive_phase: {{phase}}  # feeding, parking, exploration, assembly
thinking_pattern: {{pattern}}  # convergent, divergent, balanced
session_state: {{state}}  # exploring, consolidating, bridging

# Network Metrics (Manual or Automated)
estimated_new_nodes: {{count}}
estimated_new_connections: {{count}}
cross_cluster_linking: {{boolean}}  # true/false

# Subjective Assessment
cognitive_load: {{1-5}}  # 1=effortless, 5=strenuous
insight_level: {{1-5}}  # 1=routine, 5=breakthrough
focus_quality: {{1-5}}  # 1=scattered, 5=deep flow

# Context
primary_topic: "[[topic]]"
related_projects: []
tools_used: []  # reading, writing, linking, visualizing

# Reflection (Optional)
notes: ""
breakthrough_moments: []
gaps_identified: []
---

# {{title}}

```

**Verification**:
```bash
# Check template exists
ls -l /templates/cognitive-tracking-template.md
# Expected: File created with 0 bytes or template content
```

### 2. Add Cognitive Tracking to Daily Notes

Integrate cognitive phase tracking into your daily note routine.

**Action**: Add to your daily note template

```yaml
---
# Daily Note Metadata
date: {{date:YYYY-MM-DD}}
type: daily

# Daily Cognitive Summary
dominant_phase: {{feeding|parking|exploration|assembly}}
thinking_patterns: []  # List of patterns observed
phase_transitions: []  # Times you shifted phases

# Daily Metrics
new_notes_created: 0
new_connections_made: 0
cross_cluster_links: 0
hub_notes_created: 0

# Cognitive Health
cognitive_balance_score: 0  # 0-10
insight_moments: 0
mental_energy_curve: ""  # low/medium/high throughout day

# Network Evolution
clustering_trend: {{increasing|stable|decreasing}}
connection_density: {{sparse|balanced|dense}}
structural_gaps_noticed: []

# Weekly Summary (Sunday only)
weekly_phase_distribution:
  feeding: 0
  parking: 0
  exploration: 0
  assembly: 0

weekly_insights:
  breakthrough_moments: []
  pattern_transfers: []
  cognitive_shifts: []
---

# Daily Note - {{date:YYYY-MM-DD}}

## Morning Review

**Current Phase**: [feeding|parking|exploration|assembly]
**Goal for Today**:

## Work Sessions

### Session 1: [Time]
- **Phase**:
- **Pattern**:
- **Activity**:
- **Notes Created/Linked**:

### Session 2: [Time]
- **Phase**:
- **Pattern**:
- **Activity**:
- **Notes Created/Linked**:

## Evening Review

**Phase Transitions Today**:
**Breakthrough Moments**:
**Gaps Identified**:
**Tomorrow's Focus**:

```

**Verification**:
- Create a daily note using the template
- Verify all frontmatter fields appear
- Check that YAML is valid (no parse errors in Obsidian)

### 3. Track Cognitive Phase in Real-Time

Learn to identify and track your cognitive phase during work sessions.

**Action**: Create a cognitive phase detection checklist

**Create file**: `/guides/cognitive-phase-checklist.md`

```markdown
# Cognitive Phase Detection Checklist

## Quick Assessment (30 seconds)

Answer these questions:

1. **What am I doing right now?**
   - [ ] Reading/Consuming → **Feeding**
   - [ ] Reviewing past notes → **Parking**
   - [ ] Connecting ideas → **Exploration**
   - [ ] Creating output → **Assembly**

2. **What's my connection pattern?**
   - [ ] Creating new notes, few links → **Feeding**
   - [ ] Not touching notes → **Parking**
   - [ ] Adding many cross-links → **Exploration**
   - [ ] Strengthening local clusters → **Assembly**

3. **What's my mental state?**
   - [ ] Absorbing, curious → **Feeding**
   - [ ] Passive, waiting → **Parking**
   - [ ] Excited, connecting → **Exploration**
   - [ ] Focused, organizing → **Assembly**

## Detailed Indicators

### Feeding Phase Indicators
- Creating 5+ new notes per hour
- Minimal linking (1-2 links per note)
- Source material open (books, papers, videos)
- Taking notes in linear order
- Low clustering coefficient increase

**Frontmatter**:
```yaml
cognitive_phase: feeding
thinking_pattern: divergent
estimated_new_nodes: 8
estimated_new_connections: 3
```

### Parking Phase Indicators
- Not actively creating/editing notes
- Reviewing graph occasionally
- Notes from 1+ weeks ago
- Letting ideas simmer
- Stable network metrics

**Frontmatter**:
```yaml
cognitive_phase: parking
thinking_pattern: balanced
estimated_new_nodes: 0
estimated_new_connections: 1
```

### Exploration Phase Indicators
- "Aha!" moments frequent
- Cross-cluster linking (different topics)
- Graph view open constantly
- Backlinking actively
- High betweenness centrality changes
- Seeing unexpected connections

**Frontmatter**:
```yaml
cognitive_phase: exploration
thinking_pattern: divergent
cross_cluster_linking: true
estimated_new_connections: 12
insight_level: 5
```

### Assembly Phase Indicators
- Creating MOCs or summaries
- Strengthening existing links
- Organizing notes into structure
- Preparing output (document, presentation)
- Clustering coefficient increasing
- Hub notes being created

**Frontmatter**:
```yaml
cognitive_phase: assembly
thinking_pattern: convergent
session_state: consolidating
hub_notes_created: 2
clustering_trend: increasing
```

## Practice Exercise

Track 3 work sessions today:

1. Before starting: Predict your phase
2. During (every 30 min): Check if phase changed
3. After: Update note frontmatter
4. End of day: Review phase distribution

**Goal**: Build intuition for phase recognition
```

**Verification**:
- Use checklist for 3 consecutive work sessions
- Compare predicted phase with actual behavior
- Adjust if predictions consistently wrong

### 4. Set Up Automated Tracking Queries

Use Dataview to automatically track cognitive patterns.

**Action**: Create tracking dashboard

**Create file**: `/dashboards/cognitive-variability-dashboard.md`

```markdown
---
title: Cognitive Variability Dashboard
type: dashboard
update_frequency: daily
---

# Cognitive Variability Dashboard

## Current Week Summary

```dataview
TABLE WITHOUT ID
  file.day as "Date",
  dominant_phase as "Phase",
  new_notes_created as "New Notes",
  new_connections_made as "New Links",
  insight_moments as "Insights"
FROM #daily
WHERE file.day >= date(today) - dur(7 days)
SORT file.day DESC
```

## Phase Distribution (Last 30 Days)

```dataview
TABLE WITHOUT ID
  length(rows) as "Days",
  round(length(rows) / 30 * 100, 1) + "%" as "Percentage"
FROM #daily
WHERE file.day >= date(today) - dur(30 days)
GROUP BY dominant_phase
SORT length(rows) DESC
```

## Breakthrough Moments (Last 7 Days)

```dataview
TABLE WITHOUT ID
  file.day as "Date",
  breakthrough_moments as "Breakthrough",
  cognitive_phase as "Phase During"
FROM #daily
WHERE file.day >= date(today) - dur(7 days)
  AND length(breakthrough_moments) > 0
SORT file.day DESC
```

## Structural Gaps Identified

```dataview
TABLE WITHOUT ID
  file.day as "Identified",
  gaps_identified as "Gap Description",
  "[[" + file.name + "]]" as "Source"
FROM #daily OR #concept
WHERE length(gaps_identified) > 0
SORT file.day DESC
LIMIT 10
```

## High-Insight Sessions

```dataview
TABLE WITHOUT ID
  file.link as "Note",
  cognitive_phase as "Phase",
  insight_level as "Level",
  thinking_pattern as "Pattern"
FROM ""
WHERE insight_level >= 4
SORT insight_level DESC, file.ctime DESC
LIMIT 15
```

## Network Health Metrics

```dataview
TABLE WITHOUT ID
  file.day as "Date",
  clustering_trend as "Clustering",
  connection_density as "Density",
  cognitive_balance_score as "Balance"
FROM #daily
WHERE file.day >= date(today) - dur(7 days)
SORT file.day DESC
```

## Phase Transition Tracking

```dataview
TABLE WITHOUT ID
  file.day as "Date",
  phase_transitions as "Transitions Today"
FROM #daily
WHERE length(phase_transitions) > 0
  AND file.day >= date(today) - dur(14 days)
SORT file.day DESC
```

## Cognitive Patterns Over Time

**Current Month Snapshot**:
- Feeding: {{sum(feeding_days)}} days
- Parking: {{sum(parking_days)}} days
- Exploration: {{sum(exploration_days)}} days
- Assembly: {{sum(assembly_days)}} days

**Ideal Balance**: 30% Feeding, 20% Parking, 30% Exploration, 20% Assembly

**Actions**:
- [ ] If Feeding >40%: Schedule consolidation time
- [ ] If Parking >30%: Engage with older notes
- [ ] If Exploration <20%: Force cross-cluster linking
- [ ] If Assembly <10%: Create output deadlines

```

**Verification**:
```bash
# Open dashboard in Obsidian
# Expected: All Dataview queries render
# Expected: See data from recent daily notes
```

### 5. Identify Breakthrough Moments

Learn to recognize and document cognitive breakthroughs.

**Action**: Create breakthrough detection guide

**Breakthrough Indicators**:

1. **Sudden Phase Shift**: Parking → Exploration (dormant notes suddenly useful)
2. **Cross-Cluster Connection**: Linking 2+ previously isolated topics
3. **High Betweenness Node Creation**: New note connects many disparate concepts
4. **Pattern Transfer Success**: Applying pattern from one domain to another
5. **Gap Bridging**: Filling identified structural gap with new insight

**Documentation Template**:

```yaml
---
type: breakthrough-insight
date: {{date}}
cognitive_phase: exploration  # Usually exploration or assembly
trigger: {{what-caused-insight}}
connected_domains:
  - "[[domain-1]]"
  - "[[domain-2]]"
betweenness_impact: {{high|medium|low}}
insights_generated: []
follow_up_actions: []
---

# Breakthrough: {{title}}

## Context
What were you doing when insight occurred?

## Connection Made
What previously disconnected ideas are now linked?

**Before**:
- Domain A: [[concept-1]], [[concept-2]]
- Domain B: [[concept-3]], [[concept-4]]
- Gap: No connection between domains

**After**:
- Bridge: [[new-bridging-concept]]
- Connections: [[concept-1]] ↔ [[new-bridging-concept]] ↔ [[concept-3]]

## Impact
- **Betweenness Centrality**: [[new-bridging-concept]] now connects X notes
- **Shortcuts Created**: Y new shortest paths
- **Pattern Transfer**: Pattern from [[domain-A]] now applies to [[domain-B]]

## Validation
How can you test this insight?
- [ ] Action 1
- [ ] Action 2

## Related Breakthroughs
Links to similar past insights
```

**Example Breakthrough Note**:

```yaml
---
type: breakthrough-insight
date: 2025-10-23
cognitive_phase: exploration
trigger: Reviewing InfraNodus research while working on knowledge graph
connected_domains:
  - "[[network-science]]"
  - "[[cognitive-psychology]]"
  - "[[knowledge-management]]"
betweenness_impact: high
insights_generated:
  - "Cognitive phases map to graph topology metrics"
  - "Small-world networks optimize human navigation"
  - "Betweenness centrality = keystone concepts"
follow_up_actions:
  - "Implement automated phase detection using graph metrics"
  - "Create feature F-017 for cognitive variability tracking"
---

# Breakthrough: Graph Topology Reflects Cognitive State

## Context
Reading InfraNodus paper 3 on metastability while reviewing my vault's graph view.
Noticed my "feeding phase" notes had low clustering, while "assembly phase" notes formed tight clusters.

## Connection Made

**Before**:
- Cognitive phases were subjective feeling
- Graph metrics were separate structural analysis
- No clear mapping between mental state and network topology

**After**:
- Feeding phase → High divergence → Low clustering, high new node rate
- Assembly phase → High convergence → High clustering, hub formation
- Exploration phase → Gap bridging → Betweenness centrality changes

**Bridge Concept**: [[cognitive-variability]] as measurable graph property

## Impact
- **Betweenness Centrality**: [[cognitive-variability]] connects 15 notes across 4 domains
- **Shortcuts Created**: 23 new shortest paths in knowledge graph
- **Pattern Transfer**: Network analysis metrics now inform productivity workflow

## Validation
- [x] Calculate clustering coefficient for recent notes by phase
- [x] Verify feeding phase notes have C<0.4, assembly notes have C>0.6
- [ ] Implement automated phase detection using these metrics

## Related Breakthroughs
- [[2025-10-15-small-world-networks-optimize-navigation]]
- [[2025-10-20-ecological-thinking-in-knowledge-systems]]

```

**Verification**:
- Create a breakthrough note for your last significant insight
- Verify all frontmatter fields are populated
- Check that connected domains are properly linked

### 6. Analyze Cognitive Variability Patterns

Perform weekly analysis to optimize your thinking patterns.

**Action**: Weekly cognitive variability review

**Create file**: `/workflows/weekly-cognitive-review.md`

```markdown
# Weekly Cognitive Variability Review

## Schedule
Every Sunday evening, 30 minutes

## Process

### 1. Data Collection (5 minutes)

Open [[cognitive-variability-dashboard]] and note:

- Phase distribution percentages
- Total breakthrough moments
- Structural gaps identified
- Average cognitive balance score

### 2. Phase Balance Assessment (5 minutes)

**Target Distribution**:
- Feeding: 30% (2.1 days/week)
- Parking: 20% (1.4 days/week)
- Exploration: 30% (2.1 days/week)
- Assembly: 20% (1.4 days/week)

**Questions**:
- [ ] Is any phase >50%? (Red flag: imbalance)
- [ ] Is any phase <10%? (Warning: underutilized)
- [ ] Did I have at least 1 exploration day?
- [ ] Did I have at least 1 assembly day?

**Imbalance Corrections**:

**If Feeding >50%**:
- **Problem**: Information overload, not processing
- **Solution**: Schedule 2 hours for consolidation (assembly phase)
- **Action**: Create MOC for recent notes

**If Parking >40%**:
- **Problem**: Notes going stale, not engaging
- **Solution**: Force exploration session - review graph, make connections
- **Action**: Link 10 older notes to current work

**If Exploration <15%**:
- **Problem**: Missing breakthrough opportunities
- **Solution**: Dedicated cross-linking session
- **Action**: Use graph view, find distant notes, force connections

**If Assembly <10%**:
- **Problem**: Not consolidating knowledge into outputs
- **Solution**: Create deliverable from notes
- **Action**: Write blog post, presentation, or summary document

### 3. Breakthrough Analysis (10 minutes)

Review breakthrough notes from this week:

**Questions**:
- What cognitive phase were breakthroughs in?
- What triggered each breakthrough?
- Are there pattern triggers? (e.g., always during exploration phase)
- Can I recreate conditions that led to insights?

**Pattern Detection**:
```dataview
TABLE WITHOUT ID
  trigger as "Trigger",
  cognitive_phase as "Phase",
  length(connected_domains) as "Domains"
FROM #breakthrough-insight
WHERE date >= date(today) - dur(30 days)
GROUP BY trigger
SORT length(rows) DESC
```

**Insight**: If most breakthroughs happen during exploration phase after parking phase,
schedule more parking-then-exploration sequences.

### 4. Network Health Check (5 minutes)

Check graph topology trends:

- **Clustering Trend**: Should oscillate (increasing during assembly, stable during feeding)
- **Connection Density**: Should be "balanced" most days
- **Structural Gaps**: Should decrease over time as you fill them

**Red Flags**:
- Clustering only increasing (no exploration)
- Clustering only decreasing (no assembly)
- Connection density "sparse" for >7 days (under-linking)
- Connection density "dense" for >7 days (over-linking)
- Same structural gaps identified 3+ weeks (not addressing gaps)

### 5. Adjustments for Next Week (5 minutes)

Based on analysis, plan next week:

**Template**:
```yaml
---
week: {{week-number}}
cognitive_goals:
  - Increase exploration phase to 30%
  - Create 1 breakthrough opportunity
  - Address top 3 structural gaps
planned_phase_distribution:
  monday: feeding
  tuesday: exploration
  wednesday: assembly
  thursday: feeding
  friday: exploration
  saturday: parking
  sunday: assembly
key_actions:
  - "Monday: Read 3 papers, create atomic notes"
  - "Tuesday: Force cross-cluster linking session"
  - "Wednesday: Create MOC for recent notes"
  - "Friday: Review graph, identify gaps, bridge them"
  - "Sunday: Write summary document from week's notes"
---
```

**Verification**:
- [ ] Phase distribution targets set
- [ ] Specific actions planned for underutilized phases
- [ ] Breakthrough opportunities identified
- [ ] Structural gaps to address listed

```

**Verification**:
```bash
# Perform weekly review for current week
# Expected: Complete analysis in 30 minutes
# Expected: Action plan for next week created
```

### 7. Optimize Thinking-Pattern Field Usage

Master the thinking-pattern field for nuanced tracking.

**Action**: Understanding thinking patterns

**Three Primary Patterns**:

1. **Convergent Thinking**
   - **Definition**: Narrowing focus, organizing, synthesizing
   - **Indicators**: Creating hierarchies, strengthening local clusters, producing outputs
   - **Graph Impact**: Clustering coefficient increases
   - **When**: Assembly phase, late exploration phase, writing deliverables
   - **Example**: Creating MOC that organizes 20 related concepts

2. **Divergent Thinking**
   - **Definition**: Expanding possibilities, exploring options, generating alternatives
   - **Indicators**: Many new nodes, exploring multiple directions, creative brainstorming
   - **Graph Impact**: New node rate high, betweenness changes
   - **When**: Feeding phase, early exploration phase, research
   - **Example**: Reading paper generates 10 new concept notes

3. **Balanced Thinking**
   - **Definition**: Mix of convergence and divergence, integrating while exploring
   - **Indicators**: Creating new notes AND linking existing ones
   - **Graph Impact**: Moderate growth in all metrics
   - **When**: Transition phases, parking phase, refinement work
   - **Example**: Expanding existing note while connecting it to new domains

**Advanced Pattern Combinations**:

```yaml
# Pure Convergent (Assembly Phase)
thinking_pattern: convergent
session_state: consolidating
estimated_new_nodes: 1
estimated_new_connections: 15

# Pure Divergent (Feeding Phase)
thinking_pattern: divergent
session_state: exploring
estimated_new_nodes: 12
estimated_new_connections: 3

# Balanced (Exploration Phase)
thinking_pattern: balanced
session_state: bridging
estimated_new_nodes: 3
estimated_new_connections: 8
cross_cluster_linking: true

# Divergent → Convergent (Breakthrough)
thinking_pattern: balanced
session_state: exploring
insight_level: 5
# Note: Pattern shift during session indicates breakthrough
```

**Pattern Shift Detection**:

Key insight moments often involve pattern shifts:

- **Divergent → Convergent**: Sudden organization of scattered ideas
- **Convergent → Divergent**: Realization that framework is incomplete, need more exploration
- **Either → Balanced**: Integration point, connecting new learning to existing structure

**Document pattern shifts**:
```yaml
phase_transitions:
  - time: "10:30am"
    from: "feeding/divergent"
    to: "exploration/balanced"
    trigger: "Noticed connection between new concept and existing cluster"

  - time: "2:15pm"
    from: "exploration/balanced"
    to: "assembly/convergent"
    trigger: "Decided to create MOC for emerging theme"
```

**Verification**:
- Track thinking pattern for 5 consecutive work sessions
- Document at least one pattern shift
- Correlate pattern with cognitive phase (should align)

## Verification

After completing all steps, verify your cognitive variability tracking system:

### System Check

```bash
# Check all files created
ls -l /templates/cognitive-tracking-template.md
ls -l /guides/cognitive-phase-checklist.md
ls -l /dashboards/cognitive-variability-dashboard.md
ls -l /workflows/weekly-cognitive-review.md

# Expected: All 4 files exist
```

### Daily Note Integration Check

1. Create today's daily note
2. Verify cognitive tracking frontmatter appears
3. Fill in at least one work session
4. View in dashboard (should appear in queries)

### Dashboard Functionality Check

1. Open cognitive variability dashboard
2. All Dataview queries should render (no errors)
3. Should see data from recent daily notes
4. Week summary should show phase distribution

### Week-Long Test

Track for 7 consecutive days:
- [ ] Daily note created with cognitive tracking each day
- [ ] At least 3 work sessions tracked per day
- [ ] Phase identified for each session
- [ ] Dashboard updates automatically
- [ ] Weekly review completed on Sunday

**Success Criteria**:
- All 4 cognitive phases represented at least once
- At least 1 breakthrough moment documented
- Phase distribution visible in dashboard
- Can identify dominant pattern for the week

## Troubleshooting

### Issue: Can't Determine Current Cognitive Phase

**Symptoms**:
- Unsure whether in feeding, parking, exploration, or assembly
- Multiple phases seem to apply
- Switching phases every 30 minutes

**Solution**:

1. **Use dominant activity rule**: What are you spending most time doing?
   - Reading/consuming → Feeding
   - Nothing (older notes) → Parking
   - Linking ideas → Exploration
   - Creating output → Assembly

2. **Check new nodes vs. new connections ratio**:
   ```
   If new_nodes > new_connections * 2 → Feeding or Exploration
   If new_connections > new_nodes * 2 → Exploration or Assembly
   If both high → Exploration
   If both low → Parking
   ```

3. **Accept mixed phases**: Use primary + secondary
   ```yaml
   cognitive_phase: exploration
   secondary_phase: assembly
   notes: "Connecting ideas while organizing for output"
   ```

4. **Track phase shifts**: It's normal to shift 2-3 times per day
   ```yaml
   phase_transitions:
     - time: "9am-11am"
       phase: feeding
     - time: "11am-2pm"
       phase: exploration
     - time: "2pm-5pm"
       phase: assembly
   dominant_phase: exploration  # Most time spent here
   ```

### Issue: Breakthrough Moments Not Detected

**Symptoms**:
- No breakthrough notes created in 2+ weeks
- Dashboard shows 0 breakthrough moments
- Feel like insights are happening but not capturing them

**Solution**:

1. **Lower the bar**: Not all breakthroughs are earth-shattering
   - Connecting 2 notes you didn't realize were related → Breakthrough
   - Seeing pattern apply to new domain → Breakthrough
   - Older note suddenly relevant to current work → Breakthrough

2. **Set triggers**: Create breakthrough note when:
   - [ ] Make connection between 2+ distant notes (>3 hops apart)
   - [ ] Have "aha!" feeling
   - [ ] Something from Parking phase suddenly becomes useful
   - [ ] Apply pattern from one project to another
   - [ ] Fill a structural gap you identified earlier

3. **Review exploration phase sessions**: Breakthroughs often happen here
   ```dataview
   TABLE WITHOUT ID
     file.link as "Session",
     cognitive_phase as "Phase",
     cross_cluster_linking as "Cross-Linking"
   FROM #daily
   WHERE cognitive_phase = "exploration"
     AND cross_cluster_linking = true
   ```

   Check these sessions - probably had breakthroughs, just didn't document

4. **Practice with small breakthroughs**: Document 3 "mini-breakthroughs" this week

### Issue: Dataview Queries Not Rendering

**Symptoms**:
- Dashboard shows empty or error messages
- "No results" even though daily notes exist
- Queries not updating

**Solution**:

1. **Verify Dataview plugin installed and enabled**:
   ```
   Settings → Community Plugins → Dataview (should be enabled)
   ```

2. **Check frontmatter format**: YAML must be valid
   ```yaml
   # ✅ Correct
   dominant_phase: feeding

   # ❌ Wrong
   dominant_phase: feeding,  # Extra comma
   dominant_phase feeding    # Missing colon
   ```

3. **Verify file has #daily tag**:
   ```yaml
   ---
   tags: daily
   ---
   ```
   OR
   ```markdown
   #daily
   ```

4. **Check field names match**: Dataview is case-sensitive
   ```yaml
   # In template
   dominant_phase: feeding

   # In query - must match exactly
   FROM #daily
   WHERE dominant_phase = "feeding"
   ```

5. **Refresh Dataview index**:
   - Cmd/Ctrl + P → "Dataview: Rebuild Index"
   - Wait 10 seconds
   - Reopen dashboard

6. **Test with simple query first**:
   ```dataview
   LIST
   FROM #daily
   ```
   Should show all daily notes. If this works, problem is in complex query.

### Issue: Too Time-Consuming to Track

**Symptoms**:
- Spending 10+ minutes per session on tracking
- Feeling like tracking interrupts flow
- Skipping tracking because it takes too long

**Solution**:

1. **Use minimal tracking mode**:
   ```yaml
   # Instead of full template, just track essentials
   cognitive_phase: feeding
   new_notes_created: 5
   insight_level: 3
   ```

2. **Batch update at end of day**: Don't track in real-time
   - Work normally during day
   - Spend 5 minutes at end reviewing sessions
   - Update frontmatter in bulk

3. **Use Templater hotkeys**: Automate insertion
   ```
   # Hotkey: Cmd+Shift+F for Feeding phase template
   # Hotkey: Cmd+Shift+E for Exploration phase template
   # Hotkey: Cmd+Shift+A for Assembly phase template
   ```

4. **Focus on daily summary only**:
   ```yaml
   # In daily note - just one line per metric
   dominant_phase: exploration
   new_notes_created: 7
   new_connections_made: 12
   insight_moments: 1
   ```

   Skip per-session tracking if too granular

5. **Use voice notes**: Speak observations, transcribe later
   - "Exploration phase, connecting ML to business strategy"
   - Transcribe to frontmatter at end of day

6. **Accept imperfect tracking**: 80% tracking is better than 0%

### Issue: Weekly Review Taking Too Long

**Symptoms**:
- Weekly review takes 60+ minutes
- Overwhelmed by amount of data
- Not completing reviews consistently

**Solution**:

1. **Use quick review template** (15 minutes):
   ```markdown
   ## Quick Weekly Review

   1. Phase balance: [View dashboard, note if any >50%]
   2. Breakthrough count: [Quick count from dashboard]
   3. One adjustment for next week: [Single action item]
   ```

2. **Automate calculations**: Use Dataview formulas
   ```dataview
   TABLE WITHOUT ID
     ("Feeding: " + round(feeding_days / 7 * 100) + "%"),
     ("Parking: " + round(parking_days / 7 * 100) + "%"),
     ("Exploration: " + round(exploration_days / 7 * 100) + "%"),
     ("Assembly: " + round(assembly_days / 7 * 100) + "%")
   FROM #daily
   WHERE file.day >= date(today) - dur(7 days)
   ```

3. **Focus on exceptions**: Only review if imbalance detected
   - If all phases 20-35%: No review needed
   - If any phase >50% or <10%: Do full review

4. **Bi-weekly deep reviews**: Quick check weekly, deep dive every 2 weeks

5. **Use pre-calculated summaries**: Add to Sunday daily note
   ```yaml
   # Auto-populated by script or Templater
   weekly_summary:
     feeding_percent: 35%
     exploration_percent: 28%
     # ... etc
   ```

### Issue: Not Seeing Patterns Over Time

**Symptoms**:
- Tracking for 4+ weeks but no clear patterns
- Phase distribution seems random
- Can't predict when breakthroughs occur

**Solution**:

1. **Extend tracking period**: Patterns emerge after 8-12 weeks
   - Month 1: Learning to track accurately
   - Month 2: Calibrating phase definitions
   - Month 3+: True patterns visible

2. **Look for project-level patterns**:
   - Different projects = Different cognitive profiles
   - Group by project, analyze separately

3. **Track external factors**: Add context to daily notes
   ```yaml
   external_factors:
     - meetings: 3  # Interrupts may affect phases
     - sleep_quality: 7/10  # Energy affects cognitive state
     - project_deadline: true  # Pressure increases assembly phase
   ```

4. **Use longer time windows**: Monthly trends vs. weekly
   ```dataview
   TABLE WITHOUT ID
     week as "Week",
     feeding_percent,
     exploration_percent
   FROM #weekly-summary
   WHERE week >= "2025-10"
   ```

5. **Correlate with outputs**: When do you produce best work?
   ```yaml
   # In project notes
   project_output_quality: 9/10
   cognitive_pattern_during:
     dominant_phase: exploration
     breakthrough_moments: 3
     phase_sequence: "feeding → exploration → assembly"
   ```

   Pattern: Best outputs follow feeding → exploration → assembly sequence

6. **Accept individual variation**: Your patterns may differ from "ideal"
   - Some people thrive with 50% feeding, 10% assembly
   - Some need 40% assembly, 15% feeding
   - Optimize for YOUR patterns, not theoretical ideal

## Related Guides

- [Graph Topology Analysis Guide](../operations/graph-topology-analysis.md) - Structural metrics
- [Structural Gap Detection Guide](../operations/structural-gap-detection.md) - Finding missing connections
- [Weekly Knowledge Review](../workflows/weekly-knowledge-review.md) - Broader review process

## Further Reading

### Concepts
- [[cognitive-variability]] - Theoretical foundation
- [[ecological-thinking]] - Diversity and balance principles
- [[graph-topology-analysis]] - Network structure metrics
- [[betweenness-centrality]] - Keystone concept identification
- [[structural-gap-detection]] - Identifying missing connections

### Features
- [[F-017-cognitive-variability-tracker]] - Automated tracking feature spec
- [[F-016-graph-topology-analyzer]] - Structural metrics automation
- [[F-018-semantic-bridge-builder]] - Gap-filling automation

### Research
- [[research/infranodus-analysis-comprehensive]] - InfraNodus methodology
- [[research/papers/small-world-networks]] - Kleinberg's navigability theorem
- [[research/papers/metastability-cognition]] - Cognitive network dynamics

## Best Practices

### Daily Habits

1. **Morning**: Predict today's dominant phase based on planned work
2. **During work**: Notice when phase shifts occur, jot down time
3. **End of session**: Update frontmatter (2 minutes)
4. **Evening**: Review phase distribution, note any breakthroughs

### Weekly Habits

1. **Sunday evening**: 30-minute cognitive variability review
2. **Check phase balance**: Adjust next week if imbalanced
3. **Review breakthroughs**: Look for pattern triggers
4. **Plan phase distribution**: Intentionally schedule phases

### Monthly Habits

1. **Deep analysis**: Full topology review with graph metrics
2. **Pattern documentation**: Write up recurring cognitive patterns
3. **System refinement**: Adjust tracking template based on learnings
4. **Breakthrough compilation**: Create MOC of month's breakthrough insights

### Advanced Techniques

**1. Phase Sequencing**:
- Optimal: Feeding → Parking → Exploration → Assembly
- Shortcut: Feeding → Exploration → Assembly (when time-constrained)
- Avoid: Assembly → Feeding (hard to switch from convergent to divergent)

**2. Forced Phase Transitions**:
- If stuck in Feeding >3 days: Force exploration session (link 20 notes)
- If stuck in Parking >5 days: Force feeding session (read 3 papers)
- If stuck in Exploration >4 days: Force assembly (create MOC)

**3. Energy-Phase Matching**:
- High energy mornings: Exploration or Assembly (demanding phases)
- Low energy afternoons: Feeding (more passive) or Parking (rest)
- Evening: Assembly (organizing, less creative demand)

**4. Project-Phase Mapping**:
```yaml
project_cognitive_profile:
  e-commerce:
    dominant_phases: [assembly, feeding]
    reason: "Well-known patterns, focus on implementation"

  research_project:
    dominant_phases: [exploration, feeding]
    reason: "Novel domain, need pattern discovery"

  maintenance:
    dominant_phases: [parking, assembly]
    reason: "Stable system, occasional consolidation"
```

**5. Collaborative Phase Coordination**:
- Team Feeding: Shared reading sessions
- Team Exploration: Cross-pollination meetings (share connections)
- Team Assembly: Documentation sprints
- Team Parking: Between project phases (let ideas simmer)

## Success Metrics

Track these over 3 months to measure system effectiveness:

### Short-Term (Monthly)
- [ ] All 4 phases represented each month (minimum 15% each)
- [ ] At least 4 breakthrough moments documented per month
- [ ] Phase imbalance corrected within 2 weeks of detection
- [ ] Dashboard queries rendering correctly with recent data
- [ ] Weekly reviews completed >75% of weeks

### Medium-Term (Quarterly)
- [ ] Identified personal cognitive pattern (optimal phase sequence)
- [ ] Can predict when breakthroughs likely to occur
- [ ] Phase distribution stabilized around personal optimum
- [ ] Structural gaps identified declining over time (filling gaps faster than creating them)
- [ ] Output quality correlated with optimal cognitive sequences

### Long-Term (6+ Months)
- [ ] Automatic phase recognition (no longer need checklist)
- [ ] Intentional phase scheduling for projects
- [ ] Pattern library organized by cognitive profile
- [ ] Can coach others on cognitive variability tracking
- [ ] Measurable productivity increase (more breakthroughs, higher output quality)

## Example Session Walkthrough

**Scenario**: Friday morning research session

### 1. Pre-Session (2 minutes)

**Plan**:
- Activity: Reading 2 papers on graph topology
- Predicted phase: Feeding (consuming new information)
- Predicted pattern: Divergent (generating new notes)

**Setup**:
- Open daily note for today
- Open cognitive phase checklist
- Set timer for 90 minutes

### 2. During Session (90 minutes)

**9:00-10:00am - Reading Paper 1**:
- Create 6 atomic notes from paper
- Minimal linking (just to paper source)
- Mental state: Absorbing, curious

**Phase check**: Feeding ✓

**10:00-10:30am - Unexpected Shift**:
- Notice concept from paper relates to yesterday's notes
- Start linking paper concepts to existing cluster
- Mental state: Excited, seeing connections

**Phase check**: Exploration (shift detected!)

**10:30-11:00am - Deep Linking**:
- Cross-cluster linking (network science → knowledge management)
- Created 12 new links
- Noticed structural gap: missing "small-world" concept note

**Phase check**: Still Exploration, high insight moment

### 3. Post-Session (3 minutes)

**Update daily note**:
```yaml
---
date: 2025-10-23
dominant_phase: exploration  # Changed from predicted "feeding"

phase_transitions:
  - time: "9:00-10:00am"
    phase: feeding
    activity: "Read Kleinberg paper"

  - time: "10:00-11:00am"
    phase: exploration
    activity: "Linked paper concepts to existing vault"
    trigger: "Realized small-world concept applies to my MOC structure"

new_notes_created: 6
new_connections_made: 12
cross_cluster_links: 4
insight_moments: 1

cognitive_load: 3  # Moderate effort
insight_level: 4  # Significant insight
focus_quality: 5  # Deep flow state

breakthrough_moments:
  - "Small-world networks optimize human navigation - applies to my vault structure"

gaps_identified:
  - "Missing 'small-world' concept note to bridge network science and knowledge management"

notes: "Predicted feeding phase but shifted to exploration after noticing connections.
        This is a good sign - old parking phase notes becoming useful."
---
```

**Update breakthrough note**:

Create `/breakthroughs/2025-10-23-small-world-vault-structure.md`

```yaml
---
type: breakthrough-insight
date: 2025-10-23
cognitive_phase: exploration
trigger: "Reading Kleinberg paper during feeding phase, noticed application to vault"
connected_domains:
  - "[[network-science]]"
  - "[[knowledge-management]]"
  - "[[obsidian-vault]]"
betweenness_impact: high
insights_generated:
  - "My MOC structure should follow small-world principles"
  - "Need strategic shortcuts, not just hierarchical links"
  - "Inverse-square distribution for cross-MOC links"
follow_up_actions:
  - "Create [[small-world]] concept note"
  - "Audit vault for small-worldness metric"
  - "Add strategic shortcuts between distant MOCs"
---

# Breakthrough: Small-World Network Principles for Vault Structure

[... detailed breakthrough documentation ...]
```

### 4. Evening Review (2 minutes)

**Reflection**:
- ✅ Good phase shift: Feeding → Exploration natural and productive
- ✅ Breakthrough documented
- ✅ Gap identified for Monday follow-up
- ⚠️ Didn't finish Paper 2 - schedule for Monday feeding session

**Tomorrow's plan**:
- Morning: Feeding (finish Paper 2)
- Afternoon: Assembly (create small-world concept note + audit vault)

**Total tracking time**: 7 minutes for 90-minute session (<8% overhead)

---

**End of Guide**

You now have a complete system for tracking cognitive variability. Start with Steps 1-3 this week, add automation (Steps 4-5) next week, and implement analysis workflows (Steps 6-7) by week 3. Within a month, you'll have rich data on your cognitive patterns and be able to optimize your knowledge work accordingly.
