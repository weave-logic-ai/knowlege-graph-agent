---
type: workflow
workflow_name: Node Creation Process
status: active
created_date: '2025-10-20'
complexity: moderate
tags:
  - workflow
  - process
  - documentation
  - node-creation
related:
  - '[[../templates/concept-node-template]]'
  - '[[../templates/feature-node-template]]'
  - '[[../templates/decision-node-template]]'
  - '[[../_planning/phases/phase-2-documentation-capture]]'
visual:
  icon: 🔄
  cssclasses:
    - type-workflow
    - status-active
version: '3.0'
updated_date: '2025-10-28'
icon: 🔄
---

# Node Creation Process

**Purpose**: Standardized workflow for creating new nodes in the knowledge graph.

**When to use**: Every time you create a new markdown file in the knowledge graph.

**Outcome**: Consistent, well-linked nodes that integrate seamlessly into the graph.

---

## 📋 Process Overview

```
Identify Need → Choose Template → Research → Write → Link → Review → Commit
```

**Estimated Time**: 15-45 minutes per node (depending on complexity)

---

## 🔄 Detailed Workflow

### Step 1: Identify Need
**Goal**: Determine what node is needed and why

**Actions**:
- [ ] Check if node already exists (search graph, check folders)
- [ ] Determine node type (concept, platform, technical, feature, decision, etc.)
- [ ] Identify which phase or task requires this node
- [ ] Note: Is this blocking anything? Is it on critical path?

**Questions to answer**:
- What concept/topic does this cover?
- Who needs this information?
- What other nodes will link to this?

**Output**: Clear purpose and node type identified

---

### Step 2: Choose Template
**Goal**: Select appropriate template for consistency

**Node Type → Template**:
- Concept → `[[../templates/concept-node-template]]`
- Platform → `[[../templates/platform-node-template]]`
- Technical → `[[../templates/technical-node-template]]`
- Feature → `[[../templates/feature-node-template]]`
- Decision → `[[../templates/decision-node-template]]`
- Workflow → `[[../templates/workflow-node-template]]`
- Question → `[[../templates/question-node-template]]`
- Planning → `[[../templates/planning-node-template]]`

**Actions**:
- [ ] Copy appropriate template
- [ ] Determine node location (which folder?)
- [ ] Create file with proper name (kebab-case)

**Example**:
```bash
# For a concept about temporal queries
cp templates/concept-node-template.md concepts/temporal-queries.md
```

**Output**: Empty node file ready to fill

---

### Step 3: Research
**Goal**: Gather information to populate the node

**Sources**:
- [ ] Existing documentation (archived analysis docs)
- [ ] Related nodes in graph (read linked concepts)
- [ ] External resources (official docs, articles)
- [ ] Conversations with AI/team
- [ ] Prior decisions or discussions

**Note-taking**:
- Keep research notes in scratch area or daily log
- Identify key points that must be included
- Note which nodes this will link to
- Capture quotes or data to reference

**Time**: 5-20 minutes for simple, 20-60 minutes for complex

**Output**: Enough information to write comprehensive content

---

### Step 4: Write Content
**Goal**: Create clear, concise node content with rich metadata

#### 4a. Fill YAML Frontmatter
**Required fields** (vary by template):
```yaml
---
type: "concept|platform|technical|feature|decision|workflow|question"
[type]_id: "C-XXX|P-XXX|T-XXX|F-XXX|D-XXX|W-XXX|Q-XXX"
[type]_name: "Descriptive Name"
status: "active|planned|deprecated|draft"
created_date: "YYYY-MM-DD"
tags:
  - primary-category
  - specific-topic
  - additional-tags
---
```

**Best practices**:
- Use descriptive IDs (C-001, F-012, etc.)
- Status should be accurate
- Always include created_date
- Tags should be hierarchical (general → specific)
- Add related links in frontmatter when known

#### 4b. Write Main Content
**Structure** (for most node types):
1. **Brief description** (1-2 sentences) - What is this?
2. **Core content** (200-500 words) - Detailed explanation
3. **Key points** (3-5 bullets) - Main takeaways
4. **Examples** (if applicable) - Concrete instances
5. **Implementation notes** (for technical/feature nodes)

**Writing guidelines**:
- Be concise but comprehensive
- Use active voice
- Explain jargon or link to concepts
- Include examples when helpful
- Note open questions or uncertainties

**Target length**:
- Concepts: 200-400 words
- Platforms: 300-500 words
- Technical: 200-400 words
- Features: 200-400 words
- Decisions: 500-1000 words (more complex)
- Workflows: 300-600 words

**Output**: Well-written content that stands alone

---

### Step 5: Add Wikilinks
**Goal**: Connect this node to the knowledge graph

#### 5a. Internal Links (in content)
**Link to related nodes**:
- Concepts this builds on: `[[knowledge-graph]]`
- Technologies mentioned: `[[graphiti]]`, `[[react-flow]]`
- Related features: `[[auto-linking]]`
- Decisions that affect this: `[[decisions/technical/frontend-framework]]`
- Workflows that use this: `[[workflows/daily-planning]]`

**Best practices**:
- Link on first mention of a concept
- Use descriptive link text: `[[graphiti|Graphiti temporal knowledge graph]]`
- Link to specific sections: `[[knowledge-graph#visualization]]`
- Prefer linking to nodes over external URLs when possible

#### 5b. Explicit Related Section
**Add at end of node**:
```markdown
## 🔗 Related

### Concepts
- [[concept-1]]
- [[concept-2]]

### Decisions
- [[decision-1]]

### Features
- [[feature-1]]
```

**Output**: Node is connected to graph with 5-10+ wikilinks

---

### Step 6: Review & Validate
**Goal**: Ensure quality and consistency

**Checklist**:
- [ ] **YAML frontmatter complete** - All required fields filled
- [ ] **ID is unique** - No duplicate IDs in same category
- [ ] **Tags are appropriate** - 3-5 relevant tags
- [ ] **Content is clear** - Readable by someone unfamiliar
- [ ] **Length is appropriate** - Within target word count
- [ ] **Wikilinks are valid** - Links point to existing or planned nodes
- [ ] **No spelling errors** - Run spell check
- [ ] **Formatting is consistent** - Headings, bullets, code blocks
- [ ] **Related section present** - Links to 3+ related nodes
- [ ] **Examples included** - If appropriate for node type

**Common issues to check**:
- Broken wikilinks (double-check file names)
- Missing required frontmatter fields
- Inconsistent tag naming (use existing taxonomy)
- Content too vague or too verbose
- No links to related nodes (isolated node)

**Output**: High-quality node ready to commit

---

### Step 7: Commit to Git
**Goal**: Save node with clear history

**Commit message format**:
```bash
git add features/new-feature.md
git commit -m "feat(features): add [feature-name] node

- Created feature node for [capability]
- Links to [[related-node-1]], [[related-node-2]]
- Part of [[_planning/phases/phase-X]]

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Commit message patterns**:
- `feat(concepts):` - New concept node
- `feat(features):` - New feature node
- `feat(technical):` - New technical node
- `docs(workflows):` - New workflow documentation
- `feat(decisions):` - New decision node

**Best practices**:
- Commit related nodes together (if creating a cluster)
- Reference the phase or task this completes
- List key wikilinks in commit message
- Use Co-Authored-By for AI assistance

**Output**: Node is version controlled and traceable

---

## 🎯 Quality Standards

### Excellent Node
- [ ] YAML frontmatter is complete and accurate
- [ ] Content is clear, concise, and comprehensive
- [ ] 5-10 wikilinks to related nodes
- [ ] Bidirectional links maintained (other nodes link back)
- [ ] Examples or code snippets included (when relevant)
- [ ] Part of a cluster (not isolated)
- [ ] Addresses open questions or fills a gap

### Acceptable Node
- [ ] Basic frontmatter present
- [ ] Content explains the concept adequately
- [ ] 3-5 wikilinks
- [ ] Readable and useful

### Needs Improvement
- Missing frontmatter fields
- Content too brief or unclear
- Few or no wikilinks (isolated)
- Duplicate of existing node
- Broken wikilinks

---

## 📊 Node Creation Metrics

### Typical Timeline
- **Simple node** (concept, technical): 15-20 minutes
- **Moderate node** (feature, platform): 25-35 minutes
- **Complex node** (decision, workflow): 40-60 minutes

### Productivity Targets
- **Phase 2**: 5-10 nodes per day (with templates)
- **Phase 3**: 10-15 nodes per day (using process)
- **Steady state**: 3-5 high-quality nodes per day

### Quality Metrics
- **Wikilink density**: 5-10 links per node (average)
- **Bidirectional links**: 80%+ of links should be bidirectional
- **Isolated nodes**: <5% of total nodes
- **Broken links**: 0 (caught in review)

---

## 🔄 Process Variations

### Batch Creation
When creating multiple related nodes:
1. Research all nodes together
2. Create all files from templates
3. Write content for all (assembly-line style)
4. Link all nodes to each other
5. Review and commit as a group

**Benefits**: Faster, ensures cluster coherency
**Use for**: Creating architecture layer nodes, feature categories

### AI-Assisted Creation
When using AI (Claude) to create nodes:
1. Provide clear prompt with template
2. Review generated content thoroughly
3. Add personal insights or context
4. Ensure wikilinks are accurate
5. Commit with Co-Authored-By

**Benefits**: Faster initial draft
**Use for**: Technical nodes, feature descriptions

### Iterative Refinement
When creating placeholder nodes:
1. Create minimal node (title, frontmatter, 1 paragraph)
2. Add to graph with basic wikilinks
3. Return later to expand content
4. Update related nodes to link to it
5. Commit expanded version

**Benefits**: Get structure in place quickly
**Use for**: Phase 2 feature list population

---

## 🚨 Common Pitfalls

### Pitfall 1: Creating Duplicate Nodes
**Problem**: Node already exists under different name
**Solution**: Always search graph first, check similar folders

### Pitfall 2: Orphaned Nodes
**Problem**: Node has no links to/from other nodes
**Solution**: Always add 5+ wikilinks, update related nodes

### Pitfall 3: Inconsistent Naming
**Problem**: File name doesn't match frontmatter or wikilinks fail
**Solution**: Use kebab-case, verify links before committing

### Pitfall 4: Too Brief or Too Verbose
**Problem**: Node is 50 words or 2000 words
**Solution**: Follow word count targets, focus on key information

### Pitfall 5: Missing Metadata
**Problem**: YAML frontmatter incomplete
**Solution**: Use templates, review checklist before committing

---

## 🔗 Related Workflows

- [[git-workflow|Git Workflow]] - How to commit and manage versions
- [[decision-making-process|Decision Making Process]] - For creating decision nodes
- [[canvas-creation-process|Canvas Creation]] - Visual documentation
- [[phase-management|Phase Management]] - Planning and tracking

---

## 📚 Templates

All templates available in `/templates` folder:
- [[../templates/concept-node-template|Concept Template]]
- [[../templates/feature-node-template|Feature Template]]
- [[../templates/decision-node-template|Decision Template]]
- [[../templates/workflow-node-template|Workflow Template]]
- [[../templates/platform-node-template|Platform Template]]
- [[../templates/technical-node-template|Technical Template]]
- [[../templates/question-node-template|Question Template]]
- [[../templates/planning-node-template|Planning Template]]

---

## 🎓 Learning Resources

### Examples of Well-Created Nodes
- [[../concepts/weave-nn|Weave-NN]] - Good concept node
- [[../platforms/obsidian|Obsidian]] - Good platform comparison
- [[../technical/graphiti|Graphiti]] - Good technical node
- [[../features/knowledge-graph-visualization|Graph Visualization]] - Good feature node
- [[../decisions/executive/project-scope|Project Scope]] - Good decision node

### Study These for Patterns
- Frontmatter structure
- Content organization
- Wikilink usage
- Related sections
- Writing style

---

**Process Owner**: Phase 2 Team
**Last Updated**: 2025-10-20
**Status**: Active - Use for all node creation
**Version**: 1.0
