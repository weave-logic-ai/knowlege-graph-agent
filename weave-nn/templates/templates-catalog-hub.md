---
type: documentation
category: templates
status: active
created_date: '2025-10-20'
tags:
  - templates
  - documentation
  - process
scope: system
priority: high
visual:
  icon: 📚
  color: '#06B6D4'
  cssclasses:
    - type-documentation
    - status-active
    - priority-high
  graph_group: navigation
version: '3.0'
updated_date: '2025-10-28'
icon: 📚
---

# Node Templates

**Purpose**: Reusable templates for creating consistent, well-structured nodes in the knowledge graph.

**When to use**: Every time you create a new node - choose the appropriate template based on node type.

---

## 📚 Available Templates

### 1. Concept Node Template
**File**: [[concept-node-template]]
**Use for**: Core concepts, systems, technologies, patterns, practices

**Key sections**:
- Overview and definition
- Why it matters
- Key characteristics
- Examples and use cases
- Implementation considerations

**Target length**: 200-400 words
**Wikilinks**: 5-10

---

### 2. Platform Node Template
**File**: [[platform-node-template]]
**Use for**: Tools, services, frameworks, infrastructure platforms

**Key sections**:
- Overview and quick facts
- Core features
- Strengths and weaknesses
- Knowledge graph support
- Integration capabilities
- Pricing
- Comparison with alternatives

**Target length**: 300-500 words
**Wikilinks**: 5-10

---

### 3. Technical Node Template
**File**: [[technical-node-template]]
**Use for**: Libraries, frameworks, services, tools, technical infrastructure

**Key sections**:
- Overview and quick facts
- Key features
- How it works (with code examples)
- Pros and cons
- Use cases for Weave-NN
- Integration requirements
- Alternatives comparison
- Performance considerations

**Target length**: 200-400 words
**Wikilinks**: 5-10

---

### 4. Feature Node Template
**File**: [[feature-node-template]]
**Use for**: Product features, capabilities, user-facing functionality

**Key sections**:
- User story
- Key capabilities
- Dependencies
- Implementation notes (complexity, challenges, approach)
- User experience
- Acceptance criteria
- Testing strategy

**Target length**: 200-400 words
**Wikilinks**: 5-10

---

### 5. Decision Node Template
**File**: [[decision-node-template]]
**Use for**: All types of decisions (executive, technical, feature prioritization, business, operational)

**Key sections**:
- Question and context
- Options evaluated (A, B, C, D) with pros/cons
- Research summary
- Decision rationale (if decided)
- Impact on other decisions
- Implementation plan
- Success criteria
- Risks and mitigation
- Open questions
- Next steps

**Target length**: 500-1000 words
**Wikilinks**: 10-20

---

### 6. Workflow Node Template
**File**: [[workflow-node-template]]
**Use for**: Processes, workflows, procedures, how-to guides

**Key sections**:
- Process overview (flowchart text)
- Detailed step-by-step workflow
- Quality standards
- Metrics
- Process variations
- Common pitfalls
- Related workflows
- Templates and resources
- Quick reference checklist

**Target length**: 300-600 words
**Wikilinks**: 5-10

---

### 7. Question Node Template
**File**: [[question-node-template]]
**Use for**: Open questions, suggestions, uncertainties, research needs

**Key sections**:
- Question and context
- Options/possible answers (A, B, C, D)
- Confidence levels for each option
- Recommendation
- Research summary
- Impact analysis
- Next steps
- Answer (if answered)

**Target length**: 300-500 words
**Wikilinks**: 5-10

---

### 8. Planning Node Template
**File**: [[planning-node-template]]
**Use for**: Phases, milestones, sprints, project planning documents

**Key sections**:
- Core objective
- Primary deliverables
- Completed items
- Detailed task breakdown
- Success criteria
- Integration points with other phases
- Blockers and dependencies
- Open questions
- Timeline
- Progress tracking
- Change log
- Notes and observations

**Target length**: 400-800 words
**Wikilinks**: 10-20

---

### 9. Daily Log Template
**File**: [[daily-log-template]]
**Use for**: Daily notes, cognitive pattern tracking, activity journaling

**Key sections**:
- Cognitive state (thinking pattern, phase)
- Daily summary (accomplishments, learnings, decisions)
- Notes activity (created, modified, connections)
- Task management
- Focus areas
- Insights & ideas
- Cross-references
- Personal metrics (energy, focus, mood)
- Challenges & blockers
- Knowledge graph activity
- Tomorrow's preview
- References & resources

**Key features**:
- **Cognitive variability tracking**: Track convergent, divergent, balanced, exploration, or consolidation thinking patterns
- **Cognitive phase tracking**: Monitor feeding, parking, exploration, or assembly phases
- **Templater plugin support**: Optional quick-pick dropdowns for thinking patterns
- **Detailed guidance**: Inline comments explain each cognitive mode with examples
- **Meta-learning focus**: Designed to help you understand how you work best

**Target length**: Variable (complete what's relevant)
**Wikilinks**: 10-20+

---

## 🎯 How to Use Templates

### Step-by-Step Process

1. **Identify node type** - What kind of node are you creating?
2. **Copy template** - Use the appropriate template file
3. **Rename file** - Use kebab-case naming: `my-new-node.md`
4. **Fill YAML frontmatter** - Update all metadata fields
5. **Write content** - Follow template structure, delete sections marked "Optional" if not needed
6. **Add wikilinks** - Link to 5-10+ related nodes
7. **Review** - Check completeness using quality standards
8. **Commit** - Add to git with clear commit message

**See**: [[../workflows/node-creation-process|Node Creation Process]] for detailed workflow

---

## 📊 Template Quick Reference

| Template | Node Type | Length | Complexity | Use Case |
|----------|-----------|--------|------------|----------|
| Concept | C-XXX | 200-400 | Simple | Core ideas |
| Platform | P-XXX | 300-500 | Moderate | Tools/services |
| Technical | T-XXX | 200-400 | Moderate | Tech stack |
| Feature | F-XXX | 200-400 | Moderate | Product capabilities |
| Decision | ED/TS/FP/BM/OP-XXX | 500-1000 | Complex | Major decisions |
| Workflow | W-XXX | 300-600 | Moderate | Processes |
| Question | Q-XXX | 300-500 | Moderate | Open questions |
| Planning | PHASE-X | 400-800 | Complex | Project phases |
| Daily Log | YYYY-MM-DD | Variable | Simple | Daily notes & cognitive tracking |
| Task Log | [task-id] | Variable | Moderate | Task completion records |

---

## 🔧 Customizing Templates

### When to Modify Templates

Templates are guidelines, not strict rules. Modify when:
- Node has unique requirements
- Template sections don't apply
- Additional sections would add value

### When to Keep Templates

Follow templates closely for:
- Consistency across the knowledge graph
- Easier navigation and comprehension
- Better integration with tools and processes
- YAML frontmatter structure (keep consistent)

---

## ✅ Template Quality Checklist

Before using a template, ensure it has:

- [ ] **Complete YAML frontmatter** - All required fields
- [ ] **Clear structure** - Logical section flow
- [ ] **Helpful comments** - Guidance on filling each section
- [ ] **Examples** - Sample content where helpful
- [ ] **Wikilink placeholders** - Shows where to link
- [ ] **Related section** - Template for related nodes
- [ ] **Proper formatting** - Markdown headings, lists, code blocks

---

## 🎨 Template Evolution

### Version History
- **2025-10-23**: Added Daily Log Template with cognitive variability tracking (Phase 6)
- **2025-10-22**: Added Task Log Template for detailed task completion records
- **2025-10-20**: Initial 8 templates created (Phase 2)

### Future Enhancements
- [ ] Add more examples to each template
- [ ] Create weekly review template (aggregates daily logs)
- [ ] Create monthly review template (cognitive pattern trends)
- [ ] Create canvas template
- [ ] Create API documentation template
- [ ] Create architecture diagram template

### Feedback

If a template is missing sections or unclear, update it! Templates should evolve based on usage.

---

## 🔗 Related

### Workflows
- [[../workflows/node-creation-process|Node Creation Process]]
- [[../workflows/version-control-integration|Git Workflow]]

### Planning
- [[../_planning/phases/phase-2-documentation-capture|Phase 2: Documentation Capture]]

### Examples
- [[../concepts/weave-nn|Good Concept Node Example]]
- [[../platforms/obsidian|Good Platform Node Example]]
- [[../decisions/executive/project-scope|Good Decision Node Example]]
- [[../features/knowledge-graph-visualization|Good Feature Node Example]]

---

**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Maintained By**: Hive Mind / Documentation Team
**Status**: Active
