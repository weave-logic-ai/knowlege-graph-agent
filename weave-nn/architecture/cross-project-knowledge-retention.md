---
type: architecture
status: active
priority: high
created_date: '2025-10-21'
updated_date: '2025-10-28'
architecture_id: A-007
architecture_name: Cross-Project Knowledge Retention
category: knowledge-management
decided_date: '2025-10-21'
scope:
  current_phase: mvp
  obsidian_only: true
  web_version_needed: false
relationships:
  related_features:
    - n8n-workflow-automation
    - rabbitmq-message-queue
    - git-integration
  related_architecture:
    - obsidian-first-architecture
visual:
  icon: book-open
  cssclasses:
    - type-architecture
    - scope-mvp
    - priority-high
tags:
  - scope/mvp
  - type/architecture
  - status/active
  - priority/high
  - category/knowledge-management
  - tech/obsidian
  - tech/n8n
  - tech/claude
version: '3.0'
---

# Cross-Project Knowledge Retention Architecture

**Purpose**: Ensure learnings, patterns, and best practices from each client project are automatically extracted, documented, and made available for future projects, creating a continuously improving knowledge base.

**Core Principle**: Each project should make the next project better. Capture what worked, what didn't, and why.

**Date**: 2025-10-21
**Status**: ✅ **Active**

---

## 🎯 The Problem

### Current State (Without Knowledge Retention)
```
Project A (Client 1)
  - Requirements: 40 hours to understand domain
  - Solution: Custom approach, trial and error
  - Outcome: Success, but knowledge locked in project files

Project B (Client 2 - Similar domain)
  - Requirements: 40 hours to RE-understand same domain
  - Solution: Reinvent similar approach
  - Outcome: Success, but wasted time repeating work

Result: No learning curve, constant reinvention, slow down over time
```

### Desired State (With Knowledge Retention)
```
Project A (Client 1)
  - Requirements: 40 hours (first time)
  - Solution: Document patterns and reusable components
  - Outcome: Success + Knowledge extracted to pattern library

Project B (Client 2 - Similar domain)
  - Requirements: 10 hours (reference Project A patterns)
  - Solution: Apply proven patterns from Project A
  - Outcome: Success in 25% of time, higher quality

Result: Exponential improvement, faster delivery, compound learning
```

---

## 📐 Architecture Design

### Knowledge Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Active Project                            │
│                    (_projects/client-a/)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Requirements │  │ Decisions    │  │ Solutions    │      │
│  │ docs        │  │ (what/why)   │  │ (how)        │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                  Project Closed Event (RabbitMQ)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              N8N: Knowledge Extraction Workflow              │
│                                                              │
│  Step 1: Read project files                                 │
│  Step 2: Extract with Claude:                               │
│    - Common patterns identified                             │
│    - Reusable solutions/components                          │
│    - Best practices discovered                              │
│    - Pitfalls encountered and avoided                       │
│    - Technical decisions and rationale                      │
│  Step 3: Categorize knowledge:                              │
│    - Domain patterns (e.g., e-commerce, fintech)           │
│    - Technical patterns (e.g., auth, API design)           │
│    - Process patterns (e.g., requirements gathering)       │
│  Step 4: Create knowledge base entries                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Knowledge Base Repository                    │
│                 (knowledge-base/ folder)                     │
│                                                              │
│  patterns/                                                   │
│    ├── domain/                                              │
│    │   ├── ecommerce-checkout-flow.md                      │
│    │   └── saas-onboarding-patterns.md                     │
│    ├── technical/                                           │
│    │   ├── jwt-auth-implementation.md                      │
│    │   └── rest-api-pagination.md                          │
│    └── process/                                             │
│        ├── requirements-discovery.md                        │
│        └── stakeholder-interviews.md                        │
│                                                              │
│  components/                                                 │
│    ├── auth-module-template.md                             │
│    └── email-verification-flow.md                          │
│                                                              │
│  lessons/                                                    │
│    ├── pitfalls-to-avoid.md                                │
│    └── what-works-well.md                                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                   Used by Future Projects
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next Project                              │
│                    (_projects/client-b/)                     │
│                                                              │
│  Agent Suggestions:                                          │
│  "Based on similar Project A, consider:"                    │
│    - Pattern: [[ecommerce-checkout-flow]]                  │
│    - Component: [[auth-module-template]]                   │
│    - Pitfall: Avoid [[common-mistake-xyz]]                 │
│                                                              │
│  Result: 75% faster requirements, 50% faster implementation │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Knowledge Base Structure

### Folder Hierarchy

```
weave-nn/
├── _projects/                      # Active client projects
│   ├── client-a/                   # Specific project
│   │   ├── requirements.md
│   │   ├── decisions.md
│   │   ├── solutions.md
│   │   ├── tasks.md
│   │   └── lessons-learned.md     # Manual + auto-generated
│   └── client-b/
│
├── _archive/                       # Completed projects
│   └── client-a-2025-10/          # Moved after extraction
│       └── [same structure]
│
└── knowledge-base/                 # Extracted knowledge
    ├── patterns/                   # Reusable patterns
    │   ├── domain/
    │   │   ├── ecommerce/
    │   │   │   ├── checkout-flow-optimization.md
    │   │   │   ├── cart-abandonment-prevention.md
    │   │   │   └── payment-gateway-integration.md
    │   │   ├── saas/
    │   │   │   ├── onboarding-best-practices.md
    │   │   │   ├── pricing-page-psychology.md
    │   │   │   └── trial-to-paid-conversion.md
    │   │   └── fintech/
    │   │       ├── kyc-verification-flow.md
    │   │       └── regulatory-compliance-checklist.md
    │   │
    │   ├── technical/
    │   │   ├── authentication/
    │   │   │   ├── jwt-best-practices.md
    │   │   │   ├── oauth2-implementation.md
    │   │   │   └── session-management.md
    │   │   ├── api-design/
    │   │   │   ├── rest-api-versioning.md
    │   │   │   ├── graphql-schema-design.md
    │   │   │   └── rate-limiting-strategies.md
    │   │   └── data-modeling/
    │   │       ├── user-roles-permissions.md
    │   │       └── multi-tenancy-patterns.md
    │   │
    │   └── process/
    │       ├── requirements-gathering.md
    │       ├── stakeholder-management.md
    │       └── scope-creep-prevention.md
    │
    ├── components/                 # Reusable code/templates
    │   ├── auth-module-template.md
    │   ├── email-verification-template.md
    │   ├── api-error-handling-boilerplate.md
    │   └── user-dashboard-wireframe.md
    │
    ├── lessons/                    # Lessons learned
    │   ├── what-works-well.md
    │   ├── pitfalls-to-avoid.md
    │   ├── client-communication-tips.md
    │   └── estimation-calibration.md
    │
    └── meta/                       # Knowledge about knowledge
        ├── pattern-index.md        # Searchable index
        ├── component-catalog.md    # Reusable component list
        └── knowledge-graph.canvas  # Mehrmaid visualization
```

---

## 🤖 AI-Powered Knowledge Extraction

### Extraction Workflow (N8N)

**Trigger**: Project status changes to "Completed" (Obsidian task or manual webhook)

**Step 1: Gather Project Artifacts**
```python
# Read all project files
project_files = {
    "requirements": read_vault("_projects/client-a/requirements.md"),
    "decisions": read_vault("_projects/client-a/decisions.md"),
    "solutions": read_vault("_projects/client-a/solutions.md"),
    "tasks": read_vault("_projects/client-a/tasks.md"),
    "git_commits": git_log("--since='3 months ago'", path="_projects/client-a/"),
    "github_issues": github_list_issues(repo="client-a", state="closed")
}
```

**Step 2: Claude Extracts Patterns**
```python
claude_prompt = f"""
Analyze this completed project and extract reusable knowledge:

## Project Files
{project_files}

## Extraction Tasks
1. **Domain Patterns**: Identify domain-specific patterns (e.g., "E-commerce checkout optimization")
   - Pattern name
   - Context where applicable
   - Implementation approach
   - Success metrics

2. **Technical Patterns**: Identify technical solutions (e.g., "JWT refresh token rotation")
   - Problem solved
   - Solution approach
   - Trade-offs considered
   - Code snippets (if applicable)

3. **Process Patterns**: Identify process improvements (e.g., "Async stakeholder feedback")
   - Process challenge
   - Solution implemented
   - Outcome/benefit

4. **Reusable Components**: Identify code/templates worth extracting
   - Component description
   - Use cases
   - Dependencies
   - Customization points

5. **Lessons Learned**: Identify pitfalls and wins
   - What went well (to repeat)
   - What went poorly (to avoid)
   - Unexpected challenges
   - Estimation accuracy

## Output Format
Return JSON:
{{
  "domain_patterns": [
    {{
      "name": "...",
      "category": "ecommerce|saas|fintech|...",
      "context": "...",
      "implementation": "...",
      "metrics": "..."
    }}
  ],
  "technical_patterns": [...],
  "process_patterns": [...],
  "components": [...],
  "lessons": {{
    "wins": [...],
    "pitfalls": [...],
    "surprises": [...]
  }}
}}
"""

extraction = claude.call(claude_prompt)
```

**Step 3: Create Knowledge Base Entries**
```python
for pattern in extraction["domain_patterns"]:
    file_path = f"knowledge-base/patterns/domain/{pattern['category']}/{slugify(pattern['name'])}.md"

    content = f"""---
type: pattern
category: domain
subcategory: {pattern['category']}
created_date: {today()}
source_project: client-a
tags:
  - pattern
  - {pattern['category']}
  - domain
---

# {pattern['name']}

## Context
{pattern['context']}

## Implementation
{pattern['implementation']}

## Success Metrics
{pattern['metrics']}

## Source Project
[[../../../_archive/client-a-2025-10/README|Client A Project]]

## Related Patterns
- [[similar-pattern-1]]
- [[similar-pattern-2]]
"""

    create_note(file_path, content)
```

**Step 4: Update Pattern Index**
```python
# Update knowledge-base/meta/pattern-index.md
append_to_note("knowledge-base/meta/pattern-index.md", f"""
## {pattern['name']}
**Category**: {pattern['category']}
**Source**: [[../../../_projects/client-a/README|Client A]]
**Link**: [[../patterns/domain/{pattern['category']}/{slugify(pattern['name'])}]]
""")
```

**Step 5: Generate Visualization**
```python
# Create Mehrmaid diagram of knowledge graph
mermaid = generate_knowledge_graph_visualization(extraction)
create_note("knowledge-base/meta/knowledge-graph-{today()}.md", mermaid)
```

**Step 6: Archive Project**
```python
# Move project to archive
git_mv("_projects/client-a", f"_archive/client-a-{today()}")
git_commit("chore: Archive Client A project after knowledge extraction")
```

---

## 🔍 Knowledge Retrieval (For Next Project)

### Agent-Assisted Pattern Matching

**Trigger**: New project created (`project.created` event)

**Workflow**: "Suggest Relevant Patterns"
```python
# 1. Analyze new project requirements
new_project_requirements = read_vault("_projects/client-b/requirements.md")

# 2. Query knowledge base with Claude
claude_prompt = f"""
New project requirements:
{new_project_requirements}

Available knowledge base patterns:
{list_all_patterns()}

## Task
Identify the 5 most relevant patterns/components from our knowledge base that would help with this project.

For each suggestion:
1. Pattern/component name
2. Why it's relevant (match to requirements)
3. Confidence score (0-100)
4. Suggested application

Return JSON ranked by confidence.
"""

suggestions = claude.call(claude_prompt)

# 3. Create suggestion note in project
suggestion_content = "# Suggested Patterns\n\n"
for s in suggestions:
    suggestion_content += f"""
## {s['name']} (Confidence: {s['confidence']}%)
**Why relevant**: {s['relevance']}
**How to apply**: {s['application']}
**Link**: [[../../knowledge-base/patterns/{s['path']}]]

---
"""

create_note("_projects/client-b/suggested-patterns.md", suggestion_content)

# 4. Notify user
slack_send("#projects", f"New project Client B has {len(suggestions)} suggested patterns. Review: obsidian://open?file=_projects/client-b/suggested-patterns.md")
```

### Semantic Search (Future Enhancement)

```python
# Index all knowledge base entries with embeddings
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

# Build index
for pattern in list_all_patterns():
    content = read_vault(pattern)
    embedding = model.encode(content)
    store_embedding(pattern, embedding)

# Query index
query = "How to implement OAuth2 with refresh tokens?"
query_embedding = model.encode(query)
results = semantic_search(query_embedding, top_k=5)

# Results:
# 1. patterns/technical/authentication/oauth2-implementation.md (similarity: 0.92)
# 2. patterns/technical/authentication/jwt-best-practices.md (similarity: 0.78)
# 3. components/auth-module-template.md (similarity: 0.71)
```

---

## 📊 Metrics & Continuous Improvement

### Track Knowledge Impact

**Metrics to Capture**:
```yaml
knowledge_base_metrics:
  total_patterns: 47
  patterns_by_category:
    domain: 18
    technical: 21
    process: 8

  reuse_stats:
    patterns_applied_to_new_projects: 23
    time_saved_hours: 156  # Estimated
    quality_improvement: "15% fewer bugs on repeat patterns"

  project_velocity:
    project_1_requirements_hours: 40
    project_5_requirements_hours: 12  # 70% improvement
    average_project_timeline_reduction: "35%"
```

### Pattern Effectiveness

```markdown
# knowledge-base/meta/pattern-effectiveness.md

## Most Reused Patterns
1. **OAuth2 Implementation** (used in 8 projects)
   - Average time saved: 6 hours/project
   - Total saved: 48 hours

2. **E-commerce Checkout Flow** (used in 5 projects)
   - Average time saved: 12 hours/project
   - Total saved: 60 hours

3. **Requirements Discovery Process** (used in 12 projects)
   - Average time saved: 8 hours/project
   - Total saved: 96 hours

## Patterns Needing Improvement
1. **API Rate Limiting** (used 3 times, 2 failures)
   - Issue: Implementation too generic
   - Action: Update with specific use cases

2. **Multi-tenancy Data Model** (used 2 times, mixed results)
   - Issue: Lacks migration strategy
   - Action: Add migration playbook
```

---

## 🎯 Success Criteria

### Must Have (MVP)
- ✅ Knowledge extraction workflow (N8N) operational
- ✅ knowledge-base/ folder structure created
- ✅ At least 10 patterns extracted from existing projects
- ✅ Pattern suggestion workflow for new projects
- ✅ Archive workflow (move completed projects)

### Nice to Have (v1.1)
- ⚡ Semantic search (embedding-based pattern matching)
- ⚡ Pattern effectiveness tracking (metrics dashboard)
- ⚡ Automated pattern updates (improve based on reuse)
- ⚡ Mehrmaid knowledge graph visualization

### Deferred to v2.0+
- 🔮 Public pattern marketplace (share with community)
- 🔮 AI-generated pattern recommendations during project
- 🔮 Cross-team knowledge sharing (if multiple teams)

---

## 💡 Key Benefits

### 1. Compounding Returns
**Year 1**: Extract 50 patterns
**Year 2**: Reuse 30 patterns, extract 40 more (90 total)
**Year 3**: Reuse 70 patterns, extract 30 more (120 total)

**Result**: Exponential productivity gain over time

### 2. Faster Onboarding
New team members can:
- Read pattern library (instead of reading 20 projects)
- Learn "the way we do things" in days (not months)
- Apply proven patterns immediately

### 3. Higher Quality
- Avoid repeating mistakes (documented pitfalls)
- Apply proven solutions (battle-tested patterns)
- Consistent quality across projects

### 4. Client Value
- Faster delivery (reuse patterns)
- Higher quality (proven solutions)
- Transparent pricing (predictable estimates)

---

## 🔗 Related Features

### Requires
- [[../features/n8n-workflow-automation|N8N Workflow Automation]] - Extraction workflows
- [[../features/rabbitmq-message-queue|RabbitMQ Message Queue]] - Project events
- [[../features/git-integration|Git Integration]] - Archive via Git

### Integrates With
- [[../features/basic-ai-integration-mcp|MCP Integration]] - Claude extracts patterns
- [[obsidian-first-architecture|Obsidian-First Architecture]] - Knowledge base in vault

---

## 🔗 Related Documentation

### Architecture
- [[obsidian-first-architecture|Obsidian-First Architecture]]
- [[ai-integration-layer|AI Integration Layer]]

### Features
- [[../features/n8n-workflow-automation|N8N Workflows]]
- [[../features/rabbitmq-message-queue|Message Queue]]

---

**Status**: ✅ **Active Architecture**
**Date**: 2025-10-21
**Impact**: Enables continuous learning and improvement across all projects
**Next Steps**: Implement N8N extraction workflow, create initial pattern library
