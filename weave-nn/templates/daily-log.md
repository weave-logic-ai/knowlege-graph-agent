---
title: Daily Log - <% tp.date.now("YYYY-MM-DD") %>
type: daily_log
status: in-progress
tags:
  - daily-log
  - YYYY-MM
  - type/implementation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4C4"
  color: '#7ED321'
  cssclasses:
    - type-daily_log
updated: '2025-10-29T04:55:06.437Z'
version: '3.0'
keywords:
  - "\U0001F9E0 cognitive state"
  - dominant thinking mode
  - cognitive phase notes
  - "\U0001F4CA daily summary"
  - what i accomplished
  - what i learned
  - key decisions made
  - "\U0001F4DD notes activity"
  - new notes created
  - notes modified/enhanced
---

<!--
═══════════════════════════════════════════════════════════════════
DAILY LOG TEMPLATE - Cognitive Variability Edition
═══════════════════════════════════════════════════════════════════

PURPOSE:
Track daily activities, insights, and cognitive patterns to build
a rich temporal knowledge base and monitor thinking patterns.

COGNITIVE THINKING PATTERNS:
Choose ONE that best describes your dominant mode today:

📊 CONVERGENT THINKING (Focused, Analytical)
   - Deep focus on specific problems
   - Refining existing ideas
   - Implementing known solutions
   - High clustering, low exploration
   - Use when: Executing, debugging, optimizing

🌊 DIVERGENT THINKING (Exploratory, Creative)
   - Brainstorming and ideation
   - Exploring new connections
   - High curiosity, low constraints
   - Many new nodes, few deep connections
   - Use when: Research, design, discovery

⚖️ BALANCED THINKING (Optimal Integration)
   - Mix of focus and exploration
   - Building while learning
   - Connecting while creating
   - Healthy network metrics (S>3, 0.4<C<0.6)
   - Use when: Most productive work days

🔍 EXPLORATION THINKING (Gap Bridging)
   - Finding missing connections
   - Cross-domain linking
   - Identifying structural gaps
   - High betweenness changes
   - Use when: Refactoring, reorganizing

🏗️ CONSOLIDATION THINKING (Integration)
   - Organizing scattered notes
   - Creating MOCs and summaries
   - Strengthening weak connections
   - Increased local density
   - Use when: End of phase, preparing outputs

COGNITIVE PHASES:
Track which Zettelkasten phase dominated your work:

🌱 FEEDING PHASE
   - Rapid note capture during research
   - High input, low processing
   - Many new nodes, few connections
   - Metric: new_nodes/existing_nodes > 0.2

📦 PARKING PHASE
   - Notes accessible but not actively worked
   - Moderate connection growth
   - Stable clustering
   - Metric: 0.1 < new_connections/total_nodes < 0.3

🔗 EXPLORATION PHASE
   - Discovering latent connections
   - Cross-cluster linking
   - Gap bridging activities
   - Metric: betweenness_change > 0.2

🎯 ASSEMBLY PHASE
   - Organizing for output
   - Creating deliverables
   - High convergence and local density
   - Metric: clustering_coefficient > 0.6

TEMPLATER PLUGIN QUICKPICK (Optional):
If using Templater plugin, add this to your template:

Thinking Pattern: <% tp.system.suggester(
  ["📊 Convergent", "🌊 Divergent", "⚖️ Balanced", "🔍 Exploration", "🏗️ Consolidation"],
  ["convergent", "divergent", "balanced", "exploration", "consolidation"],
  false,
  "Select your dominant thinking pattern today"
) %>

Cognitive Phase: <% tp.system.suggester(
  ["🌱 Feeding", "📦 Parking", "🔗 Exploration", "🎯 Assembly"],
  ["feeding", "parking", "exploration", "assembly"],
  false,
  "Select your primary cognitive phase today"
) %>

═══════════════════════════════════════════════════════════════════
-->

# Daily Log - <% tp.date.now("YYYY-MM-DD") %>

**Day**: <% tp.date.now("dddd, MMMM Do, YYYY") %>
**Thinking Pattern**: `<%= thinking_pattern %>`
**Cognitive Phase**: `<%= cognitive_phase %>`

---

## 🧠 Cognitive State

### Dominant Thinking Mode
<!-- Describe how your thinking felt today and why you chose this pattern -->

**Why this pattern today**:
- [Reason 1]
- [Reason 2]

**Pattern shifts during the day**:
<!-- Track if you shifted between patterns -->
- Morning: [pattern] - [activity]
- Afternoon: [pattern] - [activity]
- Evening: [pattern] - [activity]

### Cognitive Phase Notes
<!-- What phase of knowledge work dominated? -->

**Primary Phase**: [feeding|parking|exploration|assembly]

**Phase Activities**:
- [What you did in this phase]
- [Key outcomes]

**Phase Transitions**:
- [If you moved between phases, note when and why]

---

## 📊 Daily Summary

### What I Accomplished
<!-- List 3-5 key accomplishments -->

1. ✅ [Accomplishment 1]
2. ✅ [Accomplishment 2]
3. ✅ [Accomplishment 3]

### What I Learned
<!-- New insights, concepts, or skills -->

1. 💡 [Learning 1]
2. 💡 [Learning 2]
3. 💡 [Learning 3]

### Key Decisions Made
<!-- Important decisions, even small ones -->

1. 🎯 [Decision 1]
2. 🎯 [Decision 2]

---

## 📝 Notes Activity

### New Notes Created
<!-- Link to new notes created today -->

- [[note-1]] - [Brief description]
- [[note-2]] - [Brief description]
- [[note-3]] - [Brief description]

**Total**: [X] notes

### Notes Modified/Enhanced
<!-- Significant updates to existing notes -->

- [[note-1]] - [What changed]
- [[note-2]] - [What changed]

**Total**: [X] notes updated

### New Connections Made
<!-- Important wikilinks or relationships discovered -->

- Connected [[concept-A]] ←→ [[concept-B]]: [Why this matters]
- Linked [[feature-X]] → [[decision-Y]]: [Insight gained]

**Total**: [X] new wikilinks

### Tags Added/Refined
<!-- New tags created or existing tags refined -->

- `#new-tag` - [Purpose]
- Updated `#existing-tag` usage: [How]

---

## ✅ Task Management

### Tasks Completed
<!-- Completed tasks with checkboxes -->

- [x] Task 1: [Description]
- [x] Task 2: [Description]
- [x] Task 3: [Description]

**Total Completed**: [X] tasks

### Tasks Added to Backlog
<!-- New tasks identified -->

- [ ] New task 1: [Description]
- [ ] New task 2: [Description]

### In Progress
<!-- Tasks worked on but not completed -->

- 🔄 Task 1: [Current status and blocker]
- 🔄 Task 2: [Current status and next step]

### Blocked/Deferred
<!-- Tasks that couldn't be completed and why -->

- ⏸️ Task 1: [Reason blocked]
- ⏭️ Task 2: [Reason deferred]

---

## 🎯 Focus Areas

### Primary Focus
<!-- What was your main area of work today? -->

**Area**: [research|development|planning|documentation|review]

**Key Activities**:
1. [Activity 1]
2. [Activity 2]
3. [Activity 3]

**Progress Made**: [Brief assessment]

### Secondary Focus
<!-- Supporting activities -->

**Area**: [Secondary focus area]

**Activities**:
- [Activity 1]
- [Activity 2]

---

## 💡 Insights & Ideas

### Breakthrough Moments
<!-- Significant realizations or connections -->

1. 🌟 [Insight 1]: [Why it matters]
2. 🌟 [Insight 2]: [How it changes things]

### Questions Raised
<!-- New questions or uncertainties -->

1. ❓ [Question 1]
2. ❓ [Question 2]

**Action**: [Will research|Created question node|Discussed with team]

### Ideas for Future
<!-- Ideas to revisit later -->

1. 💭 [Idea 1]: [Context]
2. 💭 [Idea 2]: [Potential value]

---

## 🔗 Cross-References

### Related Features
<!-- Features worked on or relevant to today -->

- [[F-XXX-feature-name]] - [How it relates]

### Related Concepts
<!-- Concepts explored or applied -->

- [[concept-name]] - [How it was used]

### Related Decisions
<!-- Decisions made or influenced by -->

- [[decision-name]] - [Impact today]

### Related Workflows
<!-- Workflows used or improved -->

- [[workflow-name]] - [Application]

---

## 📈 Personal Metrics

### Energy & Focus
- **Energy Level**: [low|medium|high]
- **Focus Quality**: [poor|fair|good|excellent]
- **Peak Hours**: [Time range when most productive]
- **Low Points**: [Time range when struggled]

### Mood & Wellbeing
- **Overall Mood**: [stressed|neutral|positive|energized]
- **Stress Level**: [low|medium|high]
- **Satisfaction**: [1-10]

### Productivity Assessment
- **Productivity**: [1-10]
- **Code Quality**: [1-10] (if coding)
- **Decision Quality**: [1-10]
- **Learning**: [1-10]

---

## 🚧 Challenges & Blockers

### Challenges Faced
<!-- Problems encountered today -->

1. **Challenge**: [Description]
   - **Impact**: [How it affected work]
   - **Response**: [What you did]
   - **Resolution**: [Resolved|Ongoing]

2. **Challenge**: [Description]
   - **Impact**: [Impact]
   - **Response**: [Action taken]
   - **Resolution**: [Status]

### Active Blockers
<!-- Things preventing progress -->

- 🚫 **Blocker 1**: [Description] - [What's needed to unblock]
- 🚫 **Blocker 2**: [Description] - [Action plan]

---

## 🔄 Knowledge Graph Activity

### Structural Changes
<!-- How the knowledge graph evolved today -->

- **Clustering Change**: [Increased|Decreased|Stable]
- **New Communities**: [Any new clusters formed?]
- **Betweenness Shifts**: [New bridge concepts?]

### Graph Health Indicators
<!-- Optional: Track if you have analytics -->

- **Total Nodes**: [Count] (+[X] today)
- **Total Edges**: [Count] (+[X] today)
- **Avg Degree**: [Value]
- **Clustering Coefficient**: [Value if known]

### Recommended Next Actions
<!-- Based on cognitive pattern and graph state -->

**For Next Session**:
- [ ] [Action based on today's pattern]
- [ ] [Suggested exploration area]
- [ ] [Consolidation need identified]

---

## 🎬 Tomorrow's Preview

### Planned Focus
<!-- What do you plan to work on tomorrow? -->

**Primary Goal**: [Main objective]

**Intended Thinking Pattern**: [convergent|divergent|balanced|exploration|consolidation]

**Key Tasks**:
1. [ ] [Task 1]
2. [ ] [Task 2]
3. [ ] [Task 3]

### Required Preparation
<!-- What needs to be ready for tomorrow -->

- [ ] [Prep item 1]
- [ ] [Prep item 2]

### Open Questions to Address
<!-- Questions you want to tackle tomorrow -->

1. [Question 1]
2. [Question 2]

---

## 📚 References & Resources

### Documentation Updated
<!-- Documentation you created or updated -->

- [[doc-1]] - [Update made]
- [[doc-2]] - [Update made]

### External Resources Used
<!-- Articles, docs, tools referenced -->

- [Resource 1]: [URL] - [Why useful]
- [Resource 2]: [URL] - [Key takeaway]

### Code/Files Changed
<!-- If doing development work -->

- `path/to/file1.ext` - [Change summary]
- `path/to/file2.ext` - [Change summary]

---

## 📝 Notes & Observations

### General Notes
<!-- Freeform notes that don't fit elsewhere -->

[Your notes here]

### Process Improvements
<!-- Ideas for improving your workflow -->

- [Improvement idea 1]
- [Improvement idea 2]

### Meta-Learning
<!-- What did you learn about how you work? -->

[Observations about your cognitive patterns, productivity, or learning process]

---

## 🏷️ Quick Links

### Today's Context
- **Previous Day**: [[YYYY-MM-DD-daily-log]]
- **Next Day**: [[YYYY-MM-DD-daily-log]]
- **Week**: [[YYYY-Www-weekly-review]]
- **Month**: [[YYYY-MM-monthly-review]]

### Relevant Planning
- **Current Phase**: [[phase-X-name]]
- **Current Sprint**: [[sprint-name]]
- **Active Decisions**: [[decision-name]]

---

**Log Created**: <% tp.date.now("YYYY-MM-DD HH:mm:ss") %>
**Session ID**: [If using tracking]
**Review Status**: [Completed|Needs Review]

<!--
End of Daily Log Template

USAGE TIPS:
1. Fill this out at end of day (15-20 min routine)
2. Focus on insights, not just activities
3. Track cognitive patterns consistently for meta-learning
4. Review weekly logs to identify thinking pattern trends
5. Use structural gaps and cognitive variability to guide exploration
6. Link liberally - future you will thank you
7. Don't aim for perfection - done > perfect

COGNITIVE PATTERN TRACKING BENEFITS:
- Identify when you're most creative (divergent days)
- Notice when you need to consolidate (before burnout)
- Optimize task scheduling by cognitive state
- Detect unhealthy patterns (too much convergence/divergence)
- Improve meta-learning across projects

NEXT STEPS:
- Create weekly review template to analyze pattern trends
- Build monthly cognitive variability dashboard
- Use insights to optimize your knowledge work
-->
