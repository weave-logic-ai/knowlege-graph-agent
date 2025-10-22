---
type: workflow
workflow_name: "Suggestion & Multiple-Choice Pattern"
status: active
created_date: "2025-10-20"
complexity: moderate

related_systems:
  - "Claude-Flow MCP Memory"
  - "Obsidian Knowledge Graph"

tags:
  - workflow
  - pattern
  - ai-integration
  - decision-support
  - claude-flow
---

# Suggestion & Multiple-Choice Pattern

**Purpose**: Standardized pattern for presenting options with varying confidence levels, enabling AI-assisted decision support integrated with Claude-Flow memory.

**When to use**: When presenting recommendations, open questions, or decisions where confidence varies across options.

**Outcome**: Structured suggestions that can be:
1. Displayed clearly in Obsidian
2. Stored in Claude-Flow memory
3. Tracked until resolved
4. Updated as confidence changes

---

## 📋 Pattern Overview

The suggestion pattern provides a standardized way to:
- Present multiple options for a question or decision
- Indicate confidence level for each option
- Make a recommendation (or explicitly state "research needed")
- Track status (open → researching → answered)
- Integrate with Claude-Flow MCP memory for AI continuity

---

## 🎯 Core Structure

### YAML Frontmatter

```yaml
---
question_id: "Q-[CATEGORY]-XXX"
type: question|suggestion
question_type: "technical|process|business|feature|architecture"
status: "open|researching|answered|deferred"
priority: "critical|high|medium|low"
confidence: "high|medium|low"  # Overall confidence in recommendation
created_date: "YYYY-MM-DD"
answered_date: null

relates_to:
  - "[[path/to/related-decision]]"
  - "[[path/to/related-feature]]"

blocks: []
impacts: []

# Claude-Flow MCP Integration
mcp_memory:
  sync: true
  memory_type: "decision_support"
  tags:
    - [category]
    - [domain]

tags:
  - question
  - suggestion
  - [category]
  - [status]
---
```

### Markdown Body Structure

```markdown
# Q-XXX: [Question Title]

**Status**: ⏳ OPEN | 🔬 RESEARCHING | ✅ ANSWERED | ⏸️ DEFERRED
**Confidence**: 🟢 HIGH | 🟡 MEDIUM | 🔴 LOW

---

## Question
[Clear statement of the question or decision]

---

## Context
[Why this question matters and background]

---

## Options / Possible Answers

### Option A: [Title]
[Description]

**Pros**:
- ✅ Pro 1
- ✅ Pro 2

**Cons**:
- ❌ Con 1
- ❌ Con 2

**Confidence**: 🟢 High | 🟡 Medium | 🔴 Low
**Confidence Notes**: [Why this confidence level]

**Complexity**: Low | Medium | High
**Risk**: Low | Medium | High

---

### Option B: [Title]
[Same structure]

---

### Option C: Research Needed
[If more research is required]

**What We Need to Learn**:
- Research area 1
- Research area 2

**How to Get Answers**:
- Approach 1
- Approach 2

---

## Recommendation

**Recommended**: Option [X] | Research Needed | Deferred
**Overall Confidence**: 🟢 High | 🟡 Medium | 🔴 Low

### Reasoning:
[Explanation of recommendation]

### Trade-offs:
- We accept [downside] for [upside]

---

## Next Steps
1. [ ] Step 1
2. [ ] Step 2

---

## Related
[Wikilinks to related nodes]
```

---

## 🎨 Confidence Level System

### 🟢 High Confidence
**Definition**: Strong evidence supports this option, low risk, well-understood

**Indicators**:
- Multiple reliable sources confirm
- Proven in similar contexts
- Low technical risk
- Team consensus
- Clear cost/benefit

**Recommendation**: Proceed with this option
**Display**: Green indicator

**Example**:
> **Confidence**: 🟢 High
> **Confidence Notes**: This approach is used successfully in 3 similar products we've researched. Well-documented, low risk, team agrees.

---

### 🟡 Medium Confidence
**Definition**: Good option with some trade-offs, moderate uncertainty

**Indicators**:
- Some evidence supports, but gaps exist
- Moderate risk or unknowns
- Mixed opinions from experts
- Trade-offs are significant
- Needs iteration/monitoring

**Recommendation**: Proceed with caution, monitor, iterate
**Display**: Yellow indicator

**Example**:
> **Confidence**: 🟡 Medium
> **Confidence Notes**: Library is newer (2 years old) but growing adoption. Some concerns about long-term maintenance. Will need to monitor and potentially migrate later.

---

### 🔴 Low Confidence
**Definition**: High uncertainty, insufficient data, significant risk

**Indicators**:
- Insufficient research
- High technical risk
- Conflicting expert opinions
- Experimental technology
- Major unknowns

**Recommendation**: Either defer, research more, or prototype first
**Display**: Red indicator

**Example**:
> **Confidence**: 🔴 Low
> **Confidence Notes**: Technology is experimental (alpha stage). No production case studies. Unclear if it solves our specific use case. Recommend prototyping before committing.

---

## 🔄 Status Lifecycle

### 1. Open (⏳)
Question identified, options being formulated

**Actions**:
- Create question node
- Document context
- Begin researching options

**Display**: ⏳ OPEN

---

### 2. Researching (🔬)
Actively gathering data and analyzing options

**Actions**:
- Research each option
- Document pros/cons
- Assess confidence for each
- Draft recommendation

**Display**: 🔬 RESEARCHING

---

### 3. Answered (✅)
Question has been resolved or decision made

**Actions**:
- Document chosen answer
- Update frontmatter (answered_date, status)
- Link to decision node (if formal decision created)
- Update Claude-Flow memory

**Display**: ✅ ANSWERED

---

### 4. Deferred (⏸️)
Question postponed to later date

**Actions**:
- Document why deferred
- Set revisit criteria
- Update status

**Display**: ⏸️ DEFERRED

---

## 🤖 Claude-Flow MCP Integration

### Memory Schema Mapping

**Weave-NN Question Node** → **Claude-Flow Memory**:

```yaml
# Weave-NN
question_id: "Q-TECH-001"
type: "question"
status: "open"
confidence: "medium"
options: [A, B, C]
recommended: "A"

# Maps to Claude-Flow Memory
mcp_memory:
  id: "Q-TECH-001"
  type: "decision_support"
  content: "[Question + Options + Recommendation]"
  metadata:
    status: "open"
    confidence: "medium"
    recommended_option: "A"
    created_at: "2025-10-20"
  tags:
    - technical
    - open-question
    - medium-confidence
```

### Synchronization Rules

1. **On Create**: Question node → Claude-Flow memory
2. **On Update**: Changes to options/confidence → Update memory
3. **On Answer**: Status "answered" → Archive in Claude-Flow with resolution
4. **On Defer**: Status "deferred" → Tag in Claude-Flow for future review

### MCP Agent Rule: `question_sync`

```yaml
rule_id: "question_sync"
trigger: "question_node_change"
actions:
  - Update Claude-Flow memory with latest state
  - Sync confidence level
  - Sync recommendation
  - Sync status
  - Update tags
```

**See**: [[../mcp/agent-rules|MCP Agent Rules]] (to be created)

---

## 📊 Pattern Variations

### Variation 1: Simple Yes/No Question

```yaml
---
question_id: "Q-PROCESS-001"
type: question
confidence: high
---

# Q-PROCESS-001: Should we use emoji in commit messages?

**Status**: ⏳ OPEN
**Confidence**: 🟢 HIGH

## Question
Should we include emoji in git commit messages?

## Options

### Option A: Yes, use emoji ⭐ RECOMMENDED
Use conventional commits with emoji (feat: ✨, fix: 🐛, etc.)

**Pros**:
- ✅ Visual scanning easier
- ✅ Industry standard
- ✅ Fun and engaging

**Cons**:
- ❌ Some tools may not render
- ❌ Extra character to type

**Confidence**: 🟢 High

### Option B: No emoji
Plain text commit messages only

**Pros**:
- ✅ Universal compatibility
- ✅ Simpler

**Cons**:
- ❌ Less visual
- ❌ Harder to scan

**Confidence**: 🟢 High

## Recommendation
**Recommended**: Option A
**Confidence**: 🟢 High

Use emoji for better visual scanning.
```

---

### Variation 2: Research-Heavy Question

```yaml
---
question_id: "Q-TECH-008"
type: question
confidence: low
status: researching
---

# Q-TECH-008: Which graph database should we use?

**Status**: 🔬 RESEARCHING
**Confidence**: 🔴 LOW

## Question
Which graph database should power the temporal knowledge graph?

## Options

### Option A: Neo4j
Industry standard graph database

**Confidence**: 🟡 Medium
**Confidence Notes**: Well-known but expensive for SaaS

### Option B: PostgreSQL + pg_graph
Use Postgres extensions for graph queries

**Confidence**: 🔴 Low
**Confidence Notes**: Experimental, unclear performance at scale

### Option C: Graphiti (Zep)
Temporal knowledge graph designed for LLMs

**Confidence**: 🟡 Medium
**Confidence Notes**: Perfect fit but newer project, unclear maturity

### Option D: Research Needed ⭐ RECOMMENDED
Need to prototype before deciding

**What We Need to Learn**:
- Performance at 10k+ nodes
- Integration with Supabase
- Cost at scale
- Community support

**How to Get Answers**:
- Build prototype with Neo4j and Graphiti
- Load test with realistic data
- Compare costs over 1000/10000/100000 nodes

## Recommendation
**Recommended**: Research + Prototype
**Confidence**: 🔴 Low

Need hands-on experience before committing.
```

---

### Variation 3: Suggestions (Not Questions)

Use when **proposing** rather than asking:

```yaml
---
suggestion_id: "S-FEATURE-001"
type: suggestion
confidence: medium
---

# S-FEATURE-001: Suggestion to add keyboard shortcuts

**Type**: Suggestion
**Confidence**: 🟡 MEDIUM

## Proposal
Add keyboard shortcuts for common actions to improve UX

## Options

### Option A: Vim-style shortcuts ⭐ RECOMMENDED
hjkl navigation, : for command palette

**Pros**:
- ✅ Power users love vim bindings
- ✅ Industry standard for knowledge tools
- ✅ Obsidian has vim mode

**Cons**:
- ❌ Learning curve for non-vim users
- ❌ Implementation complexity

**Confidence**: 🟡 Medium

### Option B: Standard shortcuts only
Ctrl+S, Ctrl+F, etc.

**Confidence**: 🟢 High

### Option C: Both (toggle vim mode)
Best of both worlds

**Confidence**: 🟡 Medium

## Recommendation
Option C: Implement standard shortcuts in MVP, add optional vim mode in v1.1
```

---

## 🚨 Common Pitfalls

### Pitfall 1: Overconfidence
**Problem**: Marking "high confidence" without sufficient research

**Solution**:
- Use high confidence only when evidence is strong
- Medium confidence is perfectly fine
- Low confidence signals "need more research"
- Confidence can increase as you learn

---

### Pitfall 2: Too Many Options
**Problem**: Presenting 6-8 options paralyzes decision-making

**Solution**:
- Aim for 3-4 viable options
- Combine similar options
- Eliminate clearly inferior options early
- "Research Needed" counts as an option

---

### Pitfall 3: No Recommendation
**Problem**: Presenting options without guidance

**Solution**:
- Always include "Recommendation" section
- "Research Needed" is a valid recommendation
- Explain reasoning even if low confidence
- Okay to say "any of these work, pick based on X"

---

### Pitfall 4: Not Updating Confidence
**Problem**: Confidence level set once and never updated

**Solution**:
- Update confidence as you learn more
- Research moves low → medium → high
- Document why confidence changed
- Sync changes to Claude-Flow memory

---

### Pitfall 5: Missing Context
**Problem**: Options presented without explaining why it matters

**Solution**:
- Always fill "Context" section
- Explain impact ("this blocks X", "this enables Y")
- Link to related decisions/features
- Show urgency if applicable

---

## 📚 Templates

Use these templates from `/templates`:
- [[../templates/question-node-template|Question Node Template]]
- [[../templates/decision-node-template|Decision Node Template]] (for formal decisions)

---

## 🔗 Integration Points

### With Decision Making Process
- Questions often become formal decisions
- Use question pattern for initial exploration
- Promote to decision node when stakeholder approval needed
- Link question → decision when promoted

### With Claude-Flow MCP
- All questions sync to Claude-Flow memory
- AI agents can read current questions
- AI can update confidence based on new information
- Memory persists across sessions

### With Knowledge Graph
- Questions link to related features/concepts
- Visualize open questions on graph
- Track which areas have most uncertainty
- See what's blocking progress

---

## 📊 Metrics

### Question Tracking
- **Open questions**: Count of status "open"
- **Answer rate**: % of questions answered within 7 days
- **Confidence distribution**: How many high/medium/low
- **Research needed**: % requiring more investigation

### Confidence Accuracy
- **Overconfidence**: Questions marked "high confidence" that needed revision
- **Underconfidence**: Questions marked "low confidence" that were straightforward
- **Target**: 80%+ confidence assessments are accurate in hindsight

---

## 🎯 Best Practices

### Writing Good Options

1. **Be specific**: "Use React with Next.js 14" not "Use React"
2. **Balanced pros/cons**: Aim for 3-5 of each
3. **Honest assessment**: Don't hide downsides
4. **Quantify when possible**: "30% faster" not "faster"
5. **Include evidence**: Link to benchmarks, docs, examples

### Assigning Confidence

1. **High (🟢)**: You'd bet money on this being right
2. **Medium (🟡)**: Probably right, but monitor closely
3. **Low (🔴)**: This is a guess, need more data

### Making Recommendations

1. **Be decisive**: Pick an option (even if low confidence)
2. **Explain why**: 2-3 sentences minimum
3. **Acknowledge trade-offs**: "We accept X for Y"
4. **Provide fallback**: "If this fails, we'll do Z"

---

## 🔄 Workflow Example

**Day 1**: Identify question
- Create Q-TECH-009.md
- Status: "open"
- Document context
- List initial options (may be incomplete)

**Day 2-3**: Research
- Status → "researching"
- Fill out pros/cons for each option
- Assign confidence levels
- Seek expert input

**Day 4**: Draft recommendation
- Analyze options
- Pick recommendation
- Document reasoning
- Assign overall confidence

**Day 5**: Socialize
- Share with team
- Gather feedback
- Refine recommendation

**Day 6**: Answer or decide
- Status → "answered" (or promote to formal decision)
- Document chosen option
- Sync to Claude-Flow memory
- Link to implementation tasks

---

## 🤖 Claude-Flow Memory Spec

### Memory Object Structure

```json
{
  "id": "Q-TECH-001",
  "type": "decision_support",
  "content": {
    "question": "Which frontend framework?",
    "options": [
      {
        "id": "A",
        "title": "React + Next.js",
        "confidence": "medium",
        "pros": ["..."],
        "cons": ["..."]
      },
      {
        "id": "B",
        "title": "Svelte + SvelteKit",
        "confidence": "medium",
        "pros": ["..."],
        "cons": ["..."]
      }
    ],
    "recommendation": "A",
    "reasoning": "..."
  },
  "metadata": {
    "status": "researching",
    "priority": "critical",
    "confidence": "medium",
    "created_at": "2025-10-20T10:00:00Z",
    "updated_at": "2025-10-20T15:30:00Z",
    "answered_at": null
  },
  "tags": [
    "technical",
    "frontend",
    "critical",
    "researching"
  ],
  "relationships": {
    "blocks": ["D-TS-002", "F-001"],
    "relates_to": ["C-frontend-framework", "P-next-js"]
  }
}
```

### Sync Workflow

```
Weave-NN Question Node (Obsidian)
         ↓
   MCP Agent (Cyanheads)
         ↓
  Claude-Flow Memory Store
         ↓
  Available to AI in next session
         ↓
  AI can reference, update, or resolve
```

**See**: [[../mcp/claude-flow-memory-visualization|Claude-Flow Memory Visualization]]

---

## Related

- [[decision-making-process|Decision Making Process]]
- [[node-creation-process|Node Creation Process]]
- [[../mcp/claude-flow-memory-visualization|Claude-Flow Memory Visualization]]
- [[../mcp/agent-rules|MCP Agent Rules]] (to be created)
- [[../templates/question-node-template|Question Template]]

---

**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Active
**Version**: 1.0
