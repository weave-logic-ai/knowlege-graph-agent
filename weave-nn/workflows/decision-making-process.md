---
type: workflow
workflow_name: Decision Making Process
status: active
created_date: '2025-10-20'
complexity: complex
estimated_time: 1-7 days per decision (varies by complexity)
tags:
  - workflow
  - process
  - decision-making
  - governance
related:
  - '[[../templates/decision-node-template]]'
  - '[[../templates/question-node-template]]'
  - '[[node-creation-process]]'
visual:
  icon: "\U0001F504"
  cssclasses:
    - type-workflow
    - status-active
version: '3.0'
updated_date: '2025-10-28'
---

# Decision Making Process

**Purpose**: Structured workflow for making and documenting major project decisions.

**When to use**: When facing strategic choices, technical trade-offs, or any decision that impacts project direction.

**Outcome**: Well-documented, traceable decisions with clear rationale and impact analysis.

---

## 📋 Process Overview

```
Identify Decision → Frame Question → Research Options → Create Canvas → Analyze → Decide → Document → Implement
```

**Estimated Time**:
- Simple decisions: 1-2 days
- Moderate decisions: 3-4 days
- Complex decisions: 5-7 days

---

## 🔄 Detailed Workflow

### Step 1: Identify Decision Need
**Goal**: Recognize that a decision is required and classify it

**Actions**:
- [ ] Recognize the decision point (blocker, choice, trade-off)
- [ ] Classify decision type (executive, technical, feature prioritization, business, operational)
- [ ] Determine priority (critical, high, medium, low)
- [ ] Check if decision already exists in graph
- [ ] Assign decision ID: ED-XXX, TS-XXX, FP-XXX, BM-XXX, OP-XXX

**Questions to answer**:
- What decision needs to be made?
- What type of decision is this?
- Who should make this decision?
- What does this decision block or impact?
- Is this on the critical path?

**Output**: Clear decision type and ID, priority level identified

**Time**: 15-30 minutes

---

### Step 2: Frame the Question
**Goal**: Create decision node with clear question statement

**Actions**:
- [ ] Copy decision template: `cp templates/decision-node-template.md decisions/[category]/[name].md`
- [ ] Fill YAML frontmatter (ID, type, status, priority, stakeholders)
- [ ] Write clear question statement (what are we deciding?)
- [ ] Document context (why this decision is needed)
- [ ] List constraints and current situation
- [ ] Identify what this decision blocks/impacts
- [ ] Note decision maker and stakeholders

**Best practices**:
- Question should be specific and actionable
- Context should explain why it matters
- List concrete constraints (time, budget, technical)
- Reference related concepts/features with wikilinks

**Example**:
```markdown
## Question
Should we use React or Svelte for the frontend framework?

## Context
We need a web-first framework for the SaaS product...
```

**Output**: Decision node created with clear question and context

**Time**: 30-60 minutes

---

### Step 3: Research Options
**Goal**: Identify and research all viable options

**Actions**:
- [ ] Brainstorm possible options (aim for 3-4)
- [ ] Research each option thoroughly
- [ ] Document pros and cons for each
- [ ] Assess complexity, cost, risk for each
- [ ] Gather examples, benchmarks, expert opinions
- [ ] Create technical nodes for new technologies (if needed)
- [ ] Link to existing nodes (platforms, concepts, features)

**Research sources**:
- Official documentation
- Technical blogs and articles
- Community discussions (Reddit, HN, Discord)
- Existing nodes in knowledge graph
- Prototypes or proof-of-concepts (for complex decisions)
- Expert consultation (AI, team, community)

**Documentation**:
- Keep research notes in decision node
- Create technical/platform nodes for new options
- Link to sources in "Research Summary" section
- Note confidence level for each option

**Time**:
- Simple: 2-4 hours
- Moderate: 1-2 days
- Complex: 3-5 days

**Output**: Decision node populated with 3-4 well-researched options

---

### Step 4: Create Decision Canvas (Optional)
**Goal**: Visualize the decision tree and dependencies

**Actions**:
- [ ] Create canvas file: `canvas/decision-[name].canvas`
- [ ] Add decision node to canvas
- [ ] Create option nodes (A, B, C, D)
- [ ] Show pros/cons for each option
- [ ] Visualize dependencies (what this blocks/impacts)
- [ ] Show decision pathway (if A, then..., if B, then...)
- [ ] Link to impacted features/decisions

**Canvas structure**:
- **Top**: Decision node (file link)
- **Middle**: Option cards with pros/cons
- **Bottom**: Impacted decisions/features
- **Edges**: Show relationships and dependencies

**When to use canvas**:
- Complex decisions with many dependencies
- Decisions that impact multiple areas
- Bifurcated decision trees (A leads to A1/A2, etc.)
- Visualizing trade-offs helps stakeholders

**Time**: 30-60 minutes

**Output**: Visual decision canvas (if applicable)

---

### Step 5: Analyze Options
**Goal**: Compare options objectively and identify recommendation

**Actions**:
- [ ] Create comparison table (if 3+ options)
- [ ] Score options against key criteria
- [ ] Identify trade-offs for each option
- [ ] Assess risks and mitigation strategies
- [ ] Consider short-term vs long-term implications
- [ ] Check alignment with project scope and goals
- [ ] Draft preliminary recommendation
- [ ] Assign confidence level (high/medium/low)

**Analysis framework**:

| Criterion | Weight | Option A | Option B | Option C |
|-----------|--------|----------|----------|----------|
| Complexity | 20% | 3/5 | 4/5 | 2/5 |
| Cost | 15% | 4/5 | 3/5 | 2/5 |
| Risk | 25% | 4/5 | 2/5 | 3/5 |
| Alignment | 40% | 5/5 | 3/5 | 4/5 |
| **Total** | | **4.15** | **2.95** | **3.05** |

**Confidence levels**:
- **High** 🟢: Clear winner, low risk, well-understood
- **Medium** 🟡: Good option but trade-offs, moderate risk
- **Low** 🔴: Uncertain, high risk, needs more research

**Output**: Analysis complete, preliminary recommendation drafted

**Time**: 1-3 hours

---

### Step 6: Socialize & Decide
**Goal**: Get stakeholder input and make final decision

**Actions**:
- [ ] Share decision node with decision maker
- [ ] Share canvas (if created) for visual context
- [ ] Present recommendation and rationale
- [ ] Discuss concerns and questions
- [ ] Gather stakeholder feedback
- [ ] Make final decision (or defer if needed)
- [ ] Document decision maker's rationale
- [ ] Update decision node status to "decided"
- [ ] Set decided_date in frontmatter
- [ ] Mark selected_option in frontmatter

**For AI-assisted decisions**:
- Set `ai_assisted: true` in frontmatter
- Include AI recommendation with confidence level
- Human decision maker has final say
- Document AI input in "Research Summary"

**Output**: Decision made and documented

**Time**: 30 minutes - 2 hours (depending on stakeholder availability)

---

### Step 7: Document Impact & Next Steps
**Goal**: Ensure decision is fully documented with implications

**Actions**:
- [ ] Fill "Decision Rationale" section with 3-5 key reasons
- [ ] List accepted trade-offs
- [ ] Document impact on other decisions (blocks/unblocks)
- [ ] Update impacted decision nodes (add links)
- [ ] List architecture implications
- [ ] Create implementation plan (phases/steps)
- [ ] Define success criteria
- [ ] Document risks and mitigation strategies
- [ ] List next steps with owners and deadlines
- [ ] Create any new open questions this decision raises
- [ ] Add revisit criteria (when to reconsider)

**Wikilink hygiene**:
- Link to all impacted decisions: `[[decisions/technical/other-decision]]`
- Link to related features: `[[features/feature-name]]`
- Link to concepts: `[[concepts/concept-name]]`
- Update related nodes to link back (bidirectional)

**Output**: Fully documented decision with clear impact analysis

**Time**: 1-2 hours

---

### Step 8: Commit to Git
**Goal**: Version control the decision for traceability

**Actions**:
- [ ] Review decision node for completeness
- [ ] Stage decision node: `git add decisions/[category]/[name].md`
- [ ] Stage canvas (if created): `git add canvas/decision-[name].canvas`
- [ ] Stage any updated nodes (impacted decisions)
- [ ] Commit with clear message
- [ ] Reference decision ID and related nodes
- [ ] Note impact and next steps

**Commit message format**:
```bash
git commit -m "feat(decisions): decide [Decision ID] - [Title]

Decision: [Selected option]
Rationale: [1-2 sentence summary]

Impacts:
- [[decision-1]]: [How]
- [[feature-1]]: [How]

Next steps:
- [Action 1]
- [Action 2]

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Output**: Decision committed to git, traceable in history

**Time**: 5-10 minutes

---

### Step 9: Implement Decision
**Goal**: Take action based on the decision

**Actions**:
- [ ] Create todos for implementation steps
- [ ] Assign owners and deadlines
- [ ] Update phase plan (if decision affects timeline)
- [ ] Create new nodes for technologies/approaches chosen
- [ ] Update architecture diagrams (if applicable)
- [ ] Unblock dependent decisions
- [ ] Track implementation progress
- [ ] Update decision node with implemented_date when done

**Integration with planning**:
- Add implementation tasks to `_planning/phases/`
- Link tasks back to decision node
- Update canvas board with new tasks
- Track in daily logs

**Output**: Decision being implemented, progress tracked

**Time**: Varies by decision (days to weeks)

---

## 🎯 Quality Standards

### Excellent Decision
- [ ] Clear question statement
- [ ] 3-4 well-researched options
- [ ] Detailed pros/cons for each option
- [ ] Confidence levels documented
- [ ] Impact analysis complete (blocks, impacts, unblocks)
- [ ] Decision rationale is clear and compelling
- [ ] Trade-offs explicitly acknowledged
- [ ] Implementation plan exists
- [ ] Success criteria defined
- [ ] 10-20 wikilinks to related nodes
- [ ] Bidirectional links maintained
- [ ] Canvas created (for complex decisions)
- [ ] Committed to git with clear message

### Acceptable Decision
- [ ] Question is clear
- [ ] 2-3 options documented
- [ ] Basic pros/cons
- [ ] Decision made with rationale
- [ ] 5-10 wikilinks
- [ ] Next steps listed

### Needs Improvement
- Question is vague or unclear
- Only 1 option considered (not really a decision)
- No research documented
- No rationale for decision
- No impact analysis
- Few or no wikilinks
- Not committed to git

---

## 📊 Decision Complexity Metrics

### Simple Decision
**Characteristics**:
- Binary choice (yes/no, A/B)
- Limited scope (affects 1-2 areas)
- Low risk
- Quick to research (2-4 hours)

**Timeline**: 1-2 days
**Example**: "Should we use GitHub or GitLab for version control?"

---

### Moderate Decision
**Characteristics**:
- 3-4 viable options
- Affects multiple areas
- Moderate risk and complexity
- Requires 1-2 days research

**Timeline**: 3-4 days
**Example**: "Which Markdown editor library should we use?"

---

### Complex Decision
**Characteristics**:
- 3-5 options with significant trade-offs
- Strategic impact on project
- High risk or high cost
- Requires 3-5 days research, possibly prototypes
- Many dependencies

**Timeline**: 5-7 days (or more)
**Example**: "React vs Svelte for frontend framework?" (TS-1)

---

## 🔄 Decision States

### Open (⏳)
Decision question identified but not yet decided.

**Actions**:
- Research options
- Document pros/cons
- Socialize with stakeholders

---

### Researching (🔬)
Actively researching options.

**Actions**:
- Gather data
- Build prototypes (if applicable)
- Consult experts

---

### Decided (✅)
Decision has been made.

**Actions**:
- Document rationale
- Update impact analysis
- Implement decision

---

### Deferred (⏸️)
Decision postponed to later date.

**Actions**:
- Document why deferred
- Set revisit date
- Note what would trigger reconsideration

---

### Revisit (🔄)
Previously decided, but needs reconsideration.

**Actions**:
- Document what changed
- Re-research with new context
- Make new decision or confirm original

---

## 🚨 Common Pitfalls

### Pitfall 1: Analysis Paralysis
**Problem**: Spending too long researching without making a decision

**Solution**:
- Set research time-box (2-4 hours for simple, 1-2 days for moderate)
- Use confidence levels - "medium confidence" is okay
- Can always revisit later if needed
- Better to decide and iterate than perfect-on-paper

---

### Pitfall 2: Not Documenting Rationale
**Problem**: Decision is made but reasoning is unclear

**Solution**:
- Always fill "Decision Rationale" section
- Document at least 3 key reasons
- Acknowledge trade-offs explicitly
- Quote decision maker's reasoning

---

### Pitfall 3: Ignoring Impact Analysis
**Problem**: Decision is made in isolation without considering dependencies

**Solution**:
- Always fill "Impact on Other Decisions" section
- Check what this decision blocks/unblocks
- Update impacted decision nodes
- Maintain bidirectional links

---

### Pitfall 4: Insufficient Options
**Problem**: Only considering 1-2 options (not really a decision)

**Solution**:
- Aim for 3-4 options minimum
- Include "do nothing" as an option if relevant
- Research alternatives even if one seems obvious
- Challenge assumptions

---

### Pitfall 5: No Implementation Plan
**Problem**: Decision is made but not acted upon

**Solution**:
- Always create "Next Steps" section
- Assign owners and deadlines
- Link to phase plan
- Track implementation in todos

---

## 🔗 Related Workflows

- [[node-creation-process|Node Creation Process]] - For creating decision nodes
- [[canvas-creation-process|Canvas Creation]] - For decision tree visualization
- [[version-control-integration|Git Workflow]] - For committing decisions

---

## 📚 Templates & Resources

### Templates
- [[../templates/decision-node-template|Decision Node Template]]
- [[../templates/question-node-template|Question Node Template]]

### Example Decisions
- [[../decisions/executive/project-scope|ED-1: Project Scope]] - Excellent decision example
- Shows full decision structure
- Clear options with pros/cons
- Strong rationale
- Complete impact analysis

### Decision Canvas Examples
- [[../canvas/decision-tree-tech-stack|Tech Stack Decision Tree]]

---

## 📋 Quick Reference Checklist

**Before Starting**:
- [ ] Is this decision already documented?
- [ ] What type of decision is this? (ED/TS/FP/BM/OP)
- [ ] Who is the decision maker?
- [ ] What does this block/impact?

**During Research**:
- [ ] Identified 3-4 viable options
- [ ] Documented pros/cons for each
- [ ] Assessed complexity/cost/risk
- [ ] Consulted multiple sources
- [ ] Created technical nodes if needed

**Before Deciding**:
- [ ] All stakeholders consulted
- [ ] Impact analysis complete
- [ ] Confidence level assigned
- [ ] Trade-offs understood

**Before Committing**:
- [ ] Decision rationale written (3-5 reasons)
- [ ] Impact section filled (blocks/unblocks)
- [ ] Next steps documented
- [ ] Success criteria defined
- [ ] 10+ wikilinks added
- [ ] Related nodes updated

---

## 🎨 Integration with Canvas

### When to Create Decision Canvas

Create a canvas visualization when:
- Decision is complex (5+ impacted nodes)
- Multiple stakeholders need to understand
- Decision tree has branches (if A, then A1/A2)
- Trade-offs are complex and visual helps
- Decision has long-term architectural impact

### Canvas Structure

```
┌─────────────────────────────────┐
│   Decision Node (file link)     │
│   [Question statement]          │
└─────────────────────────────────┘
         │
    ┌────┴────┬────────┬────────┐
    │         │        │        │
┌───▼──┐  ┌──▼───┐ ┌──▼───┐ ┌──▼───┐
│Opt A │  │Opt B │ │Opt C │ │Opt D │
│✅✅❌  │  │✅❌❌  │ │✅✅✅  │ │❌❌❌  │
└──────┘  └──────┘ └──────┘ └──────┘
    │                  │
┌───▼────────┐   ┌────▼───────┐
│ Impacts    │   │  Impacts   │
│ Feature 1  │   │  Feature 2 │
│ Decision 2 │   │  Decision 3│
└────────────┘   └────────────┘
```

---

## 💡 Decision Confidence Levels

### High Confidence (🟢)
- Clear winner based on criteria
- Low risk, well-understood technology
- Strong alignment with goals
- Stakeholders agree
- Minimal trade-offs

**Action**: Proceed with decision confidently

---

### Medium Confidence (🟡)
- Good option but trade-offs exist
- Moderate risk or uncertainty
- Some stakeholder concerns
- Missing some data but enough to decide

**Action**: Decide and iterate, monitor for issues

---

### Low Confidence (🔴)
- High uncertainty or risk
- Significant unknowns
- Stakeholders divided
- Insufficient research

**Action**: Either defer decision, do more research, or build prototype first

---

## 📈 Decision Metrics

### Productivity Targets
- **Simple decisions**: 1-2 per day (if that's the focus)
- **Moderate decisions**: 1 every 2-3 days
- **Complex decisions**: 1 per week

### Quality Metrics
- **Decision completeness**: 80%+ have all sections filled
- **Implementation rate**: 90%+ of decided items have implementation plan
- **Wikilink density**: 10-20 links per decision (average)
- **Bidirectional links**: 80%+ of impacted nodes link back

---

**Process Owner**: Hive Mind / Decision Team
**Last Updated**: 2025-10-20
**Status**: Active - Use for all major decisions
**Version**: 1.0
