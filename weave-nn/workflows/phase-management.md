---
type: workflow
workflow_name: Phase Management Process
status: active
created_date: '2025-10-20'
complexity: moderate
estimated_time: Ongoing throughout project
tags:
  - workflow
  - planning
  - phase-management
  - project-management
visual:
  icon: 🔄
  cssclasses:
    - type-workflow
    - status-active
version: '3.0'
updated_date: '2025-10-28'
icon: 🔄
---

# Phase Management Process

**Purpose**: Structured approach to planning, executing, tracking, and completing project phases within the knowledge graph.

**When to use**: At the start of each phase, during execution, and at completion.

**Outcome**: Well-documented phases with clear deliverables, tracked progress, and lessons learned captured in the knowledge graph.

---

## 📋 Process Overview

```
Plan → Create Phase Node → Create Todos → Execute → Track → Update → Complete → Retrospective
```

**Continuous**: Phase management is ongoing throughout the project lifecycle

---



## Related

[[planning-overview-hub]]
## 🔄 Detailed Workflow

### Step 1: Plan Phase Scope
**Goal**: Define what the phase will accomplish

**Actions**:
- [ ] Identify phase objective (what gets built/decided/documented)
- [ ] List primary deliverables (3-6 major items)
- [ ] Estimate duration (days/weeks)
- [ ] Identify dependencies (what must be done first)
- [ ] Assign priority level (critical, high, medium, low)
- [ ] Determine success criteria (measurable outcomes)

**Questions to answer**:
- What is the core objective of this phase?
- What are the 3-6 main deliverables?
- What phases must complete before this one?
- What phases does this one enable?
- How long will this take?
- How do we know when it's done?

**Output**: Clear phase scope and objectives

**Time**: 1-2 hours for planning

---

### Step 2: Create Phase Node
**Goal**: Document the phase in the knowledge graph

**Actions**:
- [ ] Copy planning-node-template.md
- [ ] Create file: `_planning/phases/phase-[X]-[name].md`
- [ ] Fill YAML frontmatter:
  - phase_id: "PHASE-X"
  - phase_name: "[Name]"
  - status: "planned"
  - priority: "[critical|high|medium|low]"
  - start_date: null (filled when starting)
  - end_date: null
  - duration: "[estimate]"
  - depends_on: "PHASE-[X-1]" (if applicable)
  - tags: [phase, planning, [category]]

- [ ] Fill content sections:
  - Core Objective (1-2 paragraphs)
  - Primary Deliverables (numbered list with details)
  - Detailed Task Breakdown (by week or milestone)
  - Success Criteria (checklist)
  - Integration Points (with other phases)
  - Blockers & Dependencies
  - Timeline

**Template sections** (from planning-node-template):
- Core Objective
- Primary Deliverables (3-6 items)
- Completed This Phase (checklist)
- Detailed Task Breakdown
- Success Criteria
- Integration Points (with previous/next phases)
- Blockers & Dependencies
- Open Questions
- Related Documentation
- Canvas Updates Needed
- Timeline
- Progress Tracking
- Change Log
- Notes & Observations

**Output**: Comprehensive phase node created

**Time**: 1-2 hours

**Example**: `_planning/phases/phase-2-documentation-capture.md`

---

### Step 3: Create Todos
**Goal**: Break phase into trackable action items

**Actions**:
- [ ] Identify all tasks required for phase deliverables
- [ ] Break large tasks into smaller, actionable items
- [ ] Create todo list using TodoWrite tool
- [ ] Set realistic task order (dependencies)
- [ ] Assign statuses: pending, in_progress, completed

**Todo best practices**:
- Tasks should be completable in 1-4 hours
- Use active, specific language ("Create X", "Document Y")
- Include activeForm (present continuous: "Creating X", "Documenting Y")
- Limit to 10-15 todos at a time (create more as you progress)
- Update status as you work

**Example todos for Phase 2**:
```json
[
  {"content": "Create 8 node type templates", "status": "pending", "activeForm": "Creating templates"},
  {"content": "Document node creation process", "status": "pending", "activeForm": "Documenting process"},
  {"content": "Create 25+ feature nodes", "status": "pending", "activeForm": "Creating feature nodes"}
]
```

**Integration**: Todos appear in Claude Code UI, track progress visually

**Output**: Todo list created and tracked

**Time**: 30 minutes

---

### Step 4: Update Phase Status to In-Progress
**Goal**: Mark phase as actively being worked on

**Actions**:
- [ ] Update phase node frontmatter:
  - status: "in-progress"
  - start_date: "YYYY-MM-DD" (today)
- [ ] Update phase node header: "⏳ IN PROGRESS"
- [ ] Add "Started: YYYY-MM-DD" line
- [ ] Commit change to git

**Commit message**:
```bash
docs(planning): start Phase [X] - [Name]

Phase [X] kicked off on YYYY-MM-DD

Deliverables:
- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]

Part of [[_planning/phases/phase-[X]-[name]]]
```

**Output**: Phase marked as active

**Time**: 5 minutes

---

### Step 5: Execute Phase Work
**Goal**: Complete deliverables and track progress

**During execution**:
- [ ] Work through todos in order
- [ ] Mark todos as "in_progress" when starting
- [ ] Mark todos as "completed" immediately when done
- [ ] Create new todos as needed for discovered work
- [ ] Update daily log with progress
- [ ] Link created nodes to phase document

**Tracking guidelines**:
- Update todos frequently (every task completion)
- Only have 1 todo "in_progress" at a time
- If blocked, mark todo as "pending" and create unblocking task
- Link all created files back to phase node

**Daily log integration**:
```markdown
## Phase [X] Progress

- [x] Completed task 1
- [x] Completed task 2
- [ ] Started task 3 (in progress)

Nodes created:
- [[path/to/node-1]]
- [[path/to/node-2]]
```

**Output**: Work completed, progress tracked

**Time**: Varies (days/weeks per phase)

---

### Step 6: Track Progress Continuously
**Goal**: Maintain visibility into phase completion

**Actions**:
- [ ] Update "Progress Tracking" section in phase node regularly
- [ ] Calculate deliverable completion percentages
- [ ] Update "Completed This Phase" checklist
- [ ] Document any blockers or issues encountered
- [ ] Adjust estimates if needed

**Progress Tracking section** (in phase node):
```markdown
## 📊 Progress Tracking

**Updated**: YYYY-MM-DD

### Deliverable Status
- Deliverable 1: 75% (3/4 tasks completed)
- Deliverable 2: 100% ✅ (all tasks done)
- Deliverable 3: 30% (2/6 tasks completed)

### Overall Phase Completion: 68%

### Nodes Created: 15
- [List nodes with links]

### Git Commits: 5
1. [Commit summary]
2. [Commit summary]
```

**Update frequency**:
- Daily: If rapid progress
- Every 2-3 days: For longer phases
- After major milestones: Always

**Output**: Current progress visible

**Time**: 10-15 minutes per update

---

### Step 7: Complete Phase
**Goal**: Mark phase as done and document outcomes

**Actions**:
- [ ] Verify all success criteria met
- [ ] Complete all deliverables
- [ ] Mark all todos as completed
- [ ] Update phase node frontmatter:
  - status: "completed"
  - end_date: "YYYY-MM-DD"
- [ ] Update phase node header: "✅ COMPLETED"
- [ ] Fill "Completed This Phase" section with comprehensive notes
- [ ] Document metrics (nodes created, commits, duration)
- [ ] Update "Overall Phase Completion: 100%"

**Completion checklist**:
- [ ] All deliverables 100% complete
- [ ] All todos marked completed
- [ ] Success criteria all met
- [ ] Nodes created documented with links
- [ ] Git commits logged
- [ ] Notes and observations captured

**Commit message**:
```bash
docs(planning): complete Phase [X] - [Name]

Phase [X] completed on YYYY-MM-DD

Accomplishments:
- [Major accomplishment 1]
- [Major accomplishment 2]
- [Major accomplishment 3]

Metrics:
- [X] nodes created
- [Y] commits
- [Z] days duration

Part of [[_planning/phases/phase-[X]-[name]]]
```

**Output**: Phase marked complete with full documentation

**Time**: 30 minutes

---

### Step 8: Phase Retrospective
**Goal**: Capture lessons learned and improve future phases

**Actions**:
- [ ] Add "Notes & Observations" section to phase node
- [ ] Document what worked well
- [ ] Document challenges encountered and how resolved
- [ ] Identify process improvements
- [ ] Note any technical debt or deferred items
- [ ] Link to next phase

**Retrospective template**:
```markdown
## 💬 Notes & Observations

**Challenges**:
- Challenge 1 and how we addressed it
- Challenge 2 and workaround used

**Wins**:
- Success 1 (what enabled it)
- Success 2 (what went better than expected)

**Lessons Learned**:
- Lesson 1: [Insight for future]
- Lesson 2: [Process improvement]
- Lesson 3: [Technical learning]

**Recommendations for Next Phase**:
- Recommendation 1
- Recommendation 2

**Deferred Items**:
- [ ] Item 1 (moved to Phase [X+2])
- [ ] Item 2 (added to backlog)
```

**Integration**:
- Apply lessons to next phase planning
- Update workflows based on learnings
- Share insights in README or process docs

**Output**: Lessons captured, process improved

**Time**: 30-45 minutes

---

## 🎯 Quality Standards

### Excellent Phase Management
- [ ] Clear, measurable objectives
- [ ] 3-6 well-defined deliverables
- [ ] Detailed task breakdown
- [ ] Progress updated regularly (every 2-3 days)
- [ ] All work linked to phase node
- [ ] Metrics tracked (nodes, commits, duration)
- [ ] Success criteria met 100%
- [ ] Retrospective completed with insights
- [ ] Next phase planned before current ends

### Acceptable Phase Management
- [ ] Objectives defined
- [ ] Deliverables listed
- [ ] Progress updated occasionally
- [ ] Most success criteria met
- [ ] Some notes captured

### Needs Improvement
- Vague objectives
- No progress tracking
- Success criteria unclear
- No retrospective
- Poor integration with knowledge graph

---

## 📊 Phase Metrics

### Phase Duration
- **Planning/Documentation phases**: 2-3 days
- **Expansion phases**: 3-5 days
- **Decision phases**: 1-2 weeks (research-heavy)
- **Implementation phases**: 2-3 months (actual development)

### Typical Deliverable Count
- **Small phase**: 2-3 deliverables
- **Medium phase**: 4-6 deliverables
- **Large phase**: 7-10 deliverables

### Success Rates
- **Target**: 90%+ of success criteria met
- **Acceptable**: 80%+ met
- **Need adjustment**: <80% met (scope was too ambitious)

---

## 🔄 Phase States

### Planned (📋)
- Phase defined but not started
- Dependencies not yet complete
- Waiting for prerequisites

**Frontmatter**: `status: "planned"`

---

### In Progress (⏳)
- Phase actively being worked on
- Todos being executed
- Progress being tracked

**Frontmatter**: `status: "in-progress"`

---

### Completed (✅)
- All deliverables done
- Success criteria met
- Retrospective completed

**Frontmatter**: `status: "completed"`

---

### Blocked (🚫)
- Cannot proceed due to blocker
- Dependency not completed
- Critical issue encountered

**Frontmatter**: `status: "blocked"`
**Add**: `blocked_by: ["reason"]`

---

### Deferred (⏸️)
- Postponed to later date
- Deprioritized
- Waiting for information

**Frontmatter**: `status: "deferred"`

---

## 🚨 Common Pitfalls

### Pitfall 1: Scope Creep
**Problem**: Phase grows beyond original deliverables

**Solution**:
- Define success criteria upfront
- Defer nice-to-haves to later phases
- Create backlog for discovered work
- Stick to core objective

---

### Pitfall 2: No Progress Tracking
**Problem**: Don't know where phase stands

**Solution**:
- Update progress section every 2-3 days
- Use todos to track granular work
- Update daily log with accomplishments
- Review progress before adding more work

---

### Pitfall 3: Missing Documentation
**Problem**: Work done but not documented in phase node

**Solution**:
- Link every created node to phase document
- Update "Completed This Phase" as you go
- Log commits and metrics
- Don't wait until end to document

---

### Pitfall 4: No Retrospective
**Problem**: Same mistakes repeated in next phase

**Solution**:
- Always complete retrospective
- Document lessons learned
- Apply insights to next phase planning
- Share learnings with team

---

### Pitfall 5: Unclear Dependencies
**Problem**: Phase blocked by unclear prerequisites

**Solution**:
- Explicitly list dependencies in planning
- Link to dependency phases
- Check dependencies before starting
- Have contingency if dependency delayed

---

## 🔗 Related Workflows

- [[node-creation-process|Node Creation Process]] - For creating phase nodes
- [[decision-making-process|Decision Making Process]] - For phase planning decisions
- [[canvas-creation-process|Canvas Creation]] - For phase visualization
- [[version-control-integration|Git Workflow]] - For committing phase work

---

## 📚 Templates

- [[../templates/planning-node-template|Planning Node Template]]
- Use for creating new phase documents

---

## 🎓 Examples to Study

### Completed Phases
- [[../_planning/phases/phase-1-knowledge-graph-transformation|Phase 1]] - Knowledge Graph Transformation
- [[../_planning/phases/phase-2-documentation-capture|Phase 2]] - Documentation Capture

### Study These For
- How deliverables are structured
- Progress tracking approach
- Success criteria definition
- Retrospective format
- Integration with todos and daily logs

---

## 📋 Quick Reference Checklist

**Phase Planning**:
- [ ] Define objective (1-2 paragraphs)
- [ ] List 3-6 deliverables
- [ ] Estimate duration
- [ ] Identify dependencies
- [ ] Define success criteria
- [ ] Create phase node
- [ ] Create todos

**During Phase**:
- [ ] Mark phase "in-progress"
- [ ] Work through todos
- [ ] Update progress every 2-3 days
- [ ] Link created nodes to phase
- [ ] Update daily logs
- [ ] Adjust scope if needed

**Phase Completion**:
- [ ] Verify success criteria 100% met
- [ ] Mark phase "completed"
- [ ] Document all accomplishments
- [ ] Log metrics (nodes, commits, duration)
- [ ] Complete retrospective
- [ ] Commit phase completion
- [ ] Plan next phase

---

## 🎯 Integration with Knowledge Graph

### Phase Nodes Link To
- **Planning docs**: MASTER-PLAN, README
- **Dependency phases**: Previous and next phases
- **Created nodes**: All deliverable nodes
- **Workflows**: Processes used during phase
- **Decisions**: Decisions made in phase
- **Daily logs**: Daily progress entries
- **Canvas**: Task boards, timelines

### Other Nodes Link To Phases
- **Features**: Link to implementation phase
- **Decisions**: Link to decision-making phase
- **Workflows**: Reference phases where created
- **Concepts**: Note which phase introduced them

---

**Process Owner**: Planning Team
**Last Updated**: 2025-10-20
**Status**: Active - Use for all phase management
**Version**: 1.0
