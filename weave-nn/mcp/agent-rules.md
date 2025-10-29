---
title: MCP Agent Rules for Weave-NN
type: integration-spec
status: active
phase_id: PHASE-4
tags:
  - mcp
  - agent-rules
  - automation
  - claude-flow
  - integration
  - phase/phase-4
  - type/implementation
  - status/complete
priority: critical
related:
  - '[[claude-flow-schema-mapping]]'
  - '[[claude-flow-memory-visualization]]'
  - '[[ai-agent-integration]]'
  - '[[model-context-protocol]]'
visual:
  icon: "\U0001F4C4"
  color: '#7ED321'
  cssclasses:
    - type-integration-spec
    - status-active
    - priority-critical
updated: '2025-10-29T04:55:05.924Z'
version: '3.0'
keywords:
  - "\U0001F4CB agent rules overview"
  - related
  - implementation status
  - what's implemented
  - implementation status by rule
  - code example
  - next steps
  - "\U0001F504 rule 1: memory sync"
  - purpose
  - trigger events
---

# MCP Agent Rules for Weave-NN

**Purpose**: Define 6 core MCP agent rules that manage bidirectional sync between Claude-Flow memory and Weave-NN knowledge graph.

**Status**: 🔄 **PARTIALLY IMPLEMENTED** - Framework complete, rule logic in development
**Phase**: [[../_planning/phases/phase-4-claude-flow-integration|Phase 4]]

---

## 📋 Agent Rules Overview

These 6 rules enable AI-managed knowledge graph maintenance with full Claude-Flow integration:

1. **`memory_sync`** - Bidirectional synchronization between memory and nodes
2. **`node_creation`** - Automated node creation from memories
3. **`update_propagation`** - Propagate changes across related nodes
4. **`schema_validation`** - Ensure data integrity and schema compliance
5. **`auto_linking`** - Automatic wikilink creation and maintenance
6. **`auto_tagging`** - Intelligent tag suggestion and application

---











## Related

[[phase-6-vault-initialization]]
## Related

[[phase-5-mcp-integration]]
## Related

[[claude-flow-tight-coupling]]
## Related

[[phase-5-claude-flow-integration]]
## Related

[[mcp-integration-hub]]
## Implementation Status

**Current State**: ✅ **Framework Complete** - RuleEngine.js fully implemented
**Status Updated**: 2025-10-22
**Location**: `/home/aepod/dev/weave-nn/src/agents/RuleEngine.js`

### What's Implemented

The core **RuleEngine** framework is complete and production-ready, providing:

1. **Priority-Based Execution**: Rules execute in priority order (CRITICAL > HIGH > MEDIUM > LOW)
2. **Conflict Resolution**: Multiple strategies (priority, timestamp, custom)
3. **Async/Await Support**: Full async rule evaluation and execution
4. **Metrics & Monitoring**: Track execution counts, durations, conflicts
5. **Tag-Based Filtering**: Execute only rules matching specific tags
6. **History Tracking**: Audit trail of all rule executions
7. **Callbacks**: Hooks for rule execution and conflict events

### Implementation Status by Rule

| Rule ID | Rule Name | Framework | Logic | Status |
|---------|-----------|-----------|-------|--------|
| `memory_sync` | Memory Sync | ✅ Complete | 🔄 In Development | Triggers ready, actions pending |
| `node_creation` | Node Creation | ✅ Complete | 🔄 In Development | Template system pending |
| `update_propagation` | Update Propagation | ✅ Complete | 🔄 In Development | Wikilink tracking pending |
| `schema_validation` | Schema Validation | ✅ Complete | 🔄 In Development | Validation rules pending |
| `auto_linking` | Auto-Linking | ✅ Complete | 📋 Planned | Semantic search pending |
| `auto_tagging` | Auto-Tagging | ✅ Complete | 📋 Planned | ML inference pending |

### Code Example

See [[rule-engine]] for full API documentation. Example usage:

```javascript
const { RuleEngine, RulePriority } = require('./src/agents/RuleEngine');

// Initialize engine
const engine = new RuleEngine({
  conflictStrategy: ConflictStrategy.PRIORITY,
  enableMetrics: true
});

// Add rule
engine.addRule({
  id: 'memory_sync',
  name: 'Memory Sync',
  priority: RulePriority.CRITICAL,
  tags: ['sync', 'memory'],
  condition: (context) => context.memoryUpdated === true,
  action: async (context) => {
    // Sync logic here
    return { synced: true, timestamp: Date.now() };
  }
});

// Evaluate rules
const result = await engine.evaluate(context);
console.log(`Executed: ${result.executed.length} rules`);
```

For complete example: `/home/aepod/dev/weave-nn/examples/rule-engine-example.js`

### Next Steps

1. **Q4 2025**: Implement specific rule logic for `memory_sync` and `node_creation`
2. **Q1 2026**: Add `update_propagation` and `schema_validation` logic
3. **Q2 2026**: Implement `auto_linking` with semantic search
4. **Q3 2026**: Add `auto_tagging` with ML inference

### Related

- [[rule-engine]] - RuleEngine API documentation
- [[model-context-protocol]] - MCP integration layer
- [[obsidian-api-client]] - REST API client for Obsidian

---

## 🔄 Rule 1: Memory Sync

### Purpose
Maintain 1:1 parity between Claude-Flow memory entries and Weave-NN markdown nodes through bidirectional synchronization.

### Trigger Events
- Claude-Flow memory created or updated
- Weave-NN node file created or modified
- Manual sync command invoked

### Rule Logic

```yaml
rule_id: "memory_sync"
priority: critical
enabled: true

triggers:
  - event: "claude_flow.memory.created"
  - event: "claude_flow.memory.updated"
  - event: "weave_nn.file.created"
  - event: "weave_nn.file.modified"
  - event: "manual.sync.invoked"

conditions:
  - memory.namespace IN ['concepts', 'decisions', 'questions', 'workflows', 'platforms', 'technical', 'features']
  - file.extension == '.md'
  - file.path NOT LIKE 'meta/%' OR file.path LIKE 'meta/open-questions/%'

actions:
  # Direction: Memory → Node
  - if: trigger == 'claude_flow.memory.*'
    then:
      - determine_folder: namespace_to_folder(memory.namespace)
      - parse_value: JSON.parse(memory.value)
      - apply_template: select_template(memory.type)
      - generate_frontmatter: memory_to_yaml(memory)
      - convert_relationships: relationships_to_wikilinks(memory.value.relationships)
      - write_file: "{folder}/{memory.key}.md"
      - log_sync: "Memory {memory.id} → Node {file.path}"

  # Direction: Node → Memory
  - if: trigger == 'weave_nn.file.*'
    then:
      - read_file: file.path
      - parse_frontmatter: extract_yaml(file.content)
      - extract_wikilinks: find_all_wikilinks(file.content)
      - convert_to_relationships: wikilinks_to_relationships(wikilinks)
      - determine_namespace: folder_to_namespace(file.folder)
      - build_value: node_to_json(frontmatter, content, relationships)
      - update_memory: mcp.store_memory({...})
      - log_sync: "Node {file.path} → Memory {memory.id}"

error_handling:
  - on_conflict:
      strategy: "last_write_wins"  # Use updated_at timestamp
      log_level: "warning"
      notify: true
  - on_parse_error:
      strategy: "skip_and_log"
      log_level: "error"
      notify: true
  - on_missing_target:
      strategy: "create_placeholder"
      log_level: "info"

metrics:
  - track: "sync_duration_ms"
  - track: "sync_success_rate"
  - track: "conflict_count"
```

### Example

**Scenario**: AI creates memory for "Temporal Queries" concept

```javascript
// Claude-Flow creates memory
{
  "id": "mem-042",
  "key": "temporal-queries",
  "namespace": "concepts",
  "type": "concept",
  "value": {
    "content": "Temporal queries enable time-aware knowledge retrieval...",
    "relationships": [
      {"type": "implemented_by", "target_key": "graphiti"}
    ]
  },
  "tags": ["concept", "temporal", "query"]
}

// Rule triggers:
// 1. Detects namespace "concepts" → folder "concepts/"
// 2. Applies concept-node-template
// 3. Generates frontmatter from memory
// 4. Converts relationship → wikilink [[graphiti]]
// 5. Writes file: concepts/temporal-queries.md
// 6. Logs: "Memory mem-042 → Node concepts/temporal-queries.md"
```

---

## ✨ Rule 2: Node Creation

### Purpose
Automatically create well-structured nodes when AI identifies a concept, decision, or other knowledge that should be documented.

### Trigger Events
- AI determines new node is needed
- Memory created in Claude-Flow with specific flag
- Missing wikilink target detected

### Rule Logic

```yaml
rule_id: "node_creation"
priority: high
enabled: true

triggers:
  - event: "ai.intent.create_node"
  - event: "claude_flow.memory.created"
    conditions:
      - memory.metadata.auto_create_node == true
  - event: "wikilink.target_missing"

actions:
  - validate_need:
      - check_if_exists: glob("**/{proposed_key}.md")
      - if_exists: abort_with_message("Node already exists at {path}")

  - determine_node_type:
      - analyze_context: ai_classify(content, context)
      - select_type: [concept|platform|technical|feature|decision|workflow|question|planning]
      - assign_id: generate_id(type)  # C-XXX, P-XXX, etc.

  - apply_template:
      - load: "templates/{type}-node-template.md"
      - fill_frontmatter:
          - id: assigned_id
          - name: title_case(proposed_key)
          - type: selected_type
          - status: "draft"
          - created_date: today()
          - tags: suggest_tags(content, type)
      - populate_content: content_from_ai_or_placeholder

  - create_initial_links:
      - analyze_context: related_nodes = find_related(content)
      - add_wikilinks: inject_wikilinks(content, related_nodes)
      - add_related_section: generate_related_section(related_nodes)

  - write_and_sync:
      - write_file: "{folder}/{key}.md"
      - trigger: "memory_sync" rule to create memory
      - log: "Created node {path} with ID {id}"

  - notify:
      - message: "New {type} node created: [[{key}]]"
      - channel: "planning_log"

validation:
  - required_fields: [id, name, type, created_date, tags]
  - min_content_length: 50  # At least 50 characters
  - min_wikilinks: 1  # At least one related node

metrics:
  - track: "nodes_created_count"
  - track: "creation_success_rate"
  - track: "average_quality_score"
```

### Example

**Scenario**: AI discovers "React Flow" library while researching

```javascript
// AI recognizes need for technical node
ai.intent.create_node({
  proposed_key: "react-flow",
  type: "technical",
  content: "React Flow is a library for building node-based UIs...",
  context: "Researching graph visualization options for TS-1 decision",
  related: ["graph-visualization", "typescript", "frontend-framework"]
});

// Rule executes:
// 1. Checks: technical/react-flow.md doesn't exist ✓
// 2. Assigns ID: T-004
// 3. Loads: templates/technical-node-template.md
// 4. Fills frontmatter (ID, name, type, tags: [technical, graph, visualization])
// 5. Populates content from AI
// 6. Adds wikilinks: [[graph-visualization]], [[typescript]], [[frontend-framework]]
// 7. Writes: technical/react-flow.md
// 8. Syncs to Claude-Flow memory
// 9. Logs: "Created node technical/react-flow.md with ID T-004"
```

---

## 🔗 Rule 3: Update Propagation

### Purpose
When a node is updated, intelligently propagate changes to related nodes and maintain consistency across the knowledge graph.

### Trigger Events
- Node frontmatter updated (status, priority, etc.)
- Node deleted or moved
- Relationship added or removed

### Rule Logic

```yaml
rule_id: "update_propagation"
priority: high
enabled: true

triggers:
  - event: "weave_nn.file.modified"
    conditions:
      - changed_fields: ["status", "priority", "decision", "selected_option"]
  - event: "weave_nn.file.moved"
  - event: "weave_nn.file.deleted"
  - event: "wikilink.added"
  - event: "wikilink.removed"

actions:
  # Propagate status changes
  - if: changed_field == 'status' AND type == 'decision' AND new_value == 'decided'
    then:
      - find_impacted: grep("\\[\\[{key}\\]\\]", "decisions/**/*.md")
      - for_each_impacted:
          - read_frontmatter: parse_yaml(file)
          - if: frontmatter.blocked_by contains current_node
            then:
              - remove_blocker: update_frontmatter(file, remove_from: 'blocked_by')
              - add_comment: "# Unblocked by decision: [[{key}]] (decided {date})"
              - log: "Unblocked {impacted_file} due to {key} decision"

  # Propagate deletions
  - if: event == 'deleted'
    then:
      - find_references: grep("\\[\\[{key}\\]\\]", "**/*.md")
      - for_each_reference:
          - mark_broken: "~~[[{key}]]~~ (deleted {date})"
          - add_comment: "# TODO: Update reference to deleted node [[{key}]]"
          - log_warning: "Broken link in {file} to deleted [[{key}]]"
      - soft_delete_memory: update_memory(metadata: {deleted: true, deleted_at: now()})

  # Propagate moves/renames
  - if: event == 'moved'
    then:
      - find_references: grep("\\[\\[{old_key}\\]\\]", "**/*.md")
      - for_each_reference:
          - update_link: replace("[[{old_key}]]", "[[{new_key}]]")
          - log: "Updated link in {file}: [[{old_key}]] → [[{new_key}]]"
      - update_memory: update_memory(key: new_key, namespace: new_namespace)

  # Maintain bidirectional links
  - if: event == 'wikilink.added'
    then:
      - target_file: resolve_wikilink(new_link)
      - if: target_file.exists
        then:
          - read_content: read_file(target_file)
          - check_reverse_link: content.includes("[[{current_key}]]")
          - if: !check_reverse_link
            then:
              - add_to_related: append_to_section(target_file, "## Related", "- [[{current_key}]]")
              - log: "Added bidirectional link in [[{target_key}]]"

notification:
  - on_status_change:
      - message: "{node_name} status changed: {old_status} → {new_status}"
      - channels: ["planning_log", "ai_agent"]
  - on_broken_link:
      - message: "⚠️ Broken link detected in {file}: [[{target}]]"
      - channels: ["daily_log", "ai_agent"]
      - priority: "high"

metrics:
  - track: "updates_propagated_count"
  - track: "broken_links_detected"
  - track: "bidirectional_links_created"
```

### Example

**Scenario**: TS-1 decision status changes from "open" to "decided"

```javascript
// User or AI updates decisions/technical/frontend-framework.md
frontmatter.status = "decided";
frontmatter.selected_option = "A";  // React

// Rule triggers:
// 1. Detects status change: "open" → "decided"
// 2. Finds impacted nodes: grep("[[frontend-framework]]", "decisions/**/*.md")
//    - Found: decisions/technical/graph-visualization-library.md (TS-2)
//    - Found: features/knowledge-graph-visualization.md (F-001)
// 3. For TS-2:
//    - Reads frontmatter: {blocked_by: ["TS-1"]}
//    - Removes blocker: blocked_by: []
//    - Adds comment: "# Unblocked by decision: [[frontend-framework]] (decided 2025-10-20)"
// 4. Logs: "Unblocked TS-2 due to TS-1 decision"
// 5. Notifies: "Frontend Framework Decision status changed: open → decided"
```

---

## ✅ Rule 4: Schema Validation

### Purpose
Ensure all nodes comply with their template schemas and maintain data integrity across the knowledge graph.

### Trigger Events
- Node created or modified
- Batch validation command
- Pre-commit git hook

### Rule Logic

```yaml
rule_id: "schema_validation"
priority: medium
enabled: true

triggers:
  - event: "weave_nn.file.created"
  - event: "weave_nn.file.modified"
  - event: "manual.validate.invoked"
  - event: "git.pre_commit"

validation_rules:
  # YAML Frontmatter Validation
  - check: "frontmatter_exists"
    error_level: "critical"
    fix: "add_empty_frontmatter"

  - check: "frontmatter_parseable"
    error_level: "critical"
    fix: "attempt_auto_fix_or_alert"

  - check: "required_fields_present"
    by_type:
      concept: [concept_id, concept_name, type, created_date, tags]
      decision: [decision_id, decision_type, title, status, created_date, tags]
      feature: [feature_id, feature_name, category, status, release, tags]
      # ... etc for each type
    error_level: "error"
    fix: "add_default_values"

  - check: "field_format_valid"
    rules:
      - field: "created_date"
        format: "YYYY-MM-DD"
        regex: "^\\d{4}-\\d{2}-\\d{2}$"
      - field: "status"
        allowed_values_by_type:
          decision: [open, researching, decided, deferred]
          feature: [planned, in-progress, completed, deferred]
          concept: [active, draft, deprecated]
      - field: "priority"
        allowed_values: [critical, high, medium, low]
      - field: "tags"
        type: "array"
        min_items: 2
    error_level: "warning"
    fix: "suggest_correction"

  # Content Validation
  - check: "min_content_length"
    threshold: 50  # characters
    error_level: "warning"
    message: "Node content is too brief (< 50 chars)"

  - check: "wikilink_targets_exist"
    error_level: "warning"
    fix: "create_question_node_for_missing"

  - check: "no_duplicate_ids"
    scope: "global"
    error_level: "critical"
    message: "Duplicate ID {id} found in {files}"

  # Structural Validation
  - check: "heading_structure"
    rules:
      - must_start_with: "# {node_name}"
      - no_heading_levels_skipped: true  # No h1 → h3 without h2
    error_level: "info"

  - check: "related_section_exists"
    for_nodes_with_wikilinks: true
    error_level: "info"
    fix: "add_related_section"

actions:
  - on_validation_start:
      - log: "Validating {file.path}"

  - on_error:
      - if: error_level == 'critical'
        then:
          - block_save: true
          - notify: "❌ Critical validation error in {file}: {error_message}"
          - log_error: {file, error, timestamp}
      - if: error_level == 'error'
        then:
          - allow_save: true
          - notify: "⚠️ Validation error in {file}: {error_message}"
          - attempt_auto_fix: if fix defined
          - log_warning: {file, error, timestamp}
      - if: error_level == 'warning' OR error_level == 'info'
        then:
          - allow_save: true
          - log_info: {file, issue, timestamp}

  - on_validation_complete:
      - generate_report: validation_summary(total, passed, warnings, errors, critical)
      - if: errors > 0 OR critical > 0
        then:
          - add_to_daily_log: "Validation issues: {errors} errors, {critical} critical"

auto_fix:
  enabled: true
  require_confirmation: false  # For safe fixes like adding defaults
  strategies:
    - missing_required_field: add_default_value
    - invalid_date_format: attempt_parse_and_reformat
    - missing_frontmatter: add_empty_frontmatter
    - broken_wikilink: create_question_node
    - duplicate_id: suggest_new_id

metrics:
  - track: "validation_runs"
  - track: "critical_errors_count"
  - track: "auto_fixes_applied"
  - track: "validation_pass_rate"
```

### Example

**Scenario**: User creates concept node with missing required fields

```yaml
# concepts/bad-example.md (INVALID)
---
concept_name: "Bad Example"
status: active
---

# Bad Example
This is too short.
```

```javascript
// Rule triggers on file save:
// 1. Validates frontmatter exists: ✓
// 2. Checks required fields: ✗
//    - Missing: concept_id, type, created_date, tags
// 3. Error level: "error"
// 4. Auto-fix attempts:
//    - concept_id: "C-XXX" (generates next ID)
//    - type: "concept" (inferred from folder)
//    - created_date: "2025-10-20" (today)
//    - tags: ["concept"] (default tag)
// 5. Checks content length: 21 chars < 50 ✗
//    - Warning: "Node content is too brief"
// 6. File updated with corrections
// 7. Notification: "⚠️ Validation fixed 4 issues in concepts/bad-example.md"
// 8. Log: Added to daily log
```

---

## 🏷️ Rule 5: Auto-Linking

### Purpose
Automatically suggest and create wikilinks between related nodes based on content analysis and semantic similarity.

### Trigger Events
- New node created
- Node content significantly updated
- Manual link suggestion request

### Rule Logic

```yaml
rule_id: "auto_linking"
priority: low  # Runs async, not blocking
enabled: true

triggers:
  - event: "weave_nn.file.created"
  - event: "weave_nn.file.modified"
    conditions:
      - content_changed: true
      - significant_change: word_count_delta > 50
  - event: "manual.suggest_links.invoked"

analysis:
  # Keyword-based linking
  - extract_keywords:
      - methods: [noun_phrases, technical_terms, proper_nouns]
      - min_frequency: 2
      - exclude: stop_words + common_words

  - match_to_existing_nodes:
      - for_each_keyword:
          - search: grep("{keyword}", "**/*.md")
          - if: matches.count > 0 AND !already_linked
            then:
              - score: calculate_relevance(keyword, context)
              - if: score > 0.7
                then: suggest_link(keyword, target_node)

  # Semantic similarity linking
  - generate_embedding:
      - content: extract_main_content(file)
      - method: "hash_embedding_1024"  # Claude-Flow compatible

  - find_similar:
      - query: mcp.semantic_search_memory({query: embedding, limit: 10, min_similarity: 0.7})
      - filter: exclude_self, exclude_already_linked
      - rank: by_similarity_score

  - suggest_semantic_links:
      - for_each_similar:
          - if: similarity > 0.8
            then: suggest_link(target, "highly related")
          - if: similarity > 0.7 AND similarity <= 0.8
            then: suggest_link(target, "potentially related")

actions:
  - present_suggestions:
      - mode: "interactive"  # or "auto" for high-confidence links
      - format:
          - "### Suggested Links"
          - "- [[{target}]] (confidence: {score}, reason: {reason})"
      - add_to: comment_section_or_inline

  - auto_apply_high_confidence:
      - if: score > 0.9 AND auto_link_enabled
        then:
          - add_wikilink: inject_at_first_mention(keyword, "[[{target}]]")
          - add_to_related: append_to_section("## Related", "- [[{target}]]")
          - log: "Auto-linked [[{current}]] → [[{target}]] (score: {score})"

  - create_bidirectional:
      - if: link_created
        then:
          - trigger: "update_propagation" rule to add reverse link

filtering:
  - exclude_types: ["planning", "daily_log"]  # Don't auto-link in logs
  - max_suggestions: 10  # Limit to top 10 suggestions
  - min_confidence: 0.7  # Don't suggest links below 70% confidence

notification:
  - on_suggestions_available:
      - message: "💡 {count} link suggestions for [[{node}]]"
      - action_required: "review_and_apply"
  - on_auto_linked:
      - message: "🔗 Auto-linked [[{source}]] → [[{target}]]"

metrics:
  - track: "suggestions_generated"
  - track: "suggestions_accepted_rate"
  - track: "auto_links_created"
```

### Example

**Scenario**: User creates new feature node for "Semantic Search"

```markdown
# features/semantic-search.md
Semantic search uses embeddings to find related content based on meaning rather than keywords. This will use Graphiti for temporal knowledge graph queries and integrate with the graph visualization.
```

```javascript
// Rule triggers:
// 1. Extracts keywords: ["semantic", "search", "embeddings", "graphiti", "temporal", "knowledge graph", "graph visualization"]
// 2. Matches to existing nodes:
//    - "embeddings": Found in technical/embeddings.md (score: 0.9)
//    - "graphiti": Found in technical/graphiti.md (score: 0.95)
//    - "knowledge graph": Found in concepts/knowledge-graph.md (score: 0.85)
//    - "graph visualization": Found in features/knowledge-graph-visualization.md (score: 0.92)
// 3. Generates embedding for semantic similarity
// 4. Finds similar: concepts/temporal-queries.md (similarity: 0.82)
// 5. Presents suggestions:
//
// ### Suggested Links
// - [[graphiti]] (confidence: 0.95, reason: keyword match "graphiti")
// - [[knowledge-graph-visualization]] (confidence: 0.92, reason: keyword match "graph visualization")
// - [[embeddings]] (confidence: 0.90, reason: keyword match "embeddings")
// - [[knowledge-graph]] (confidence: 0.85, reason: keyword match "knowledge graph")
// - [[temporal-queries]] (confidence: 0.82, reason: semantic similarity)
//
// 6. Auto-applies high-confidence (> 0.9):
//    - Adds [[graphiti]] wikilink at first mention
//    - Adds [[knowledge-graph-visualization]] wikilink
//    - Adds [[embeddings]] wikilink
// 7. Adds to Related section
// 8. Triggers update_propagation to create bidirectional links
```

---

## 🏷️ Rule 6: Auto-Tagging

### Purpose
Intelligently suggest and apply tags to nodes based on content analysis, taxonomy, and existing tag patterns.

### Trigger Events
- New node created without tags or with minimal tags
- Node content updated significantly
- Manual tag suggestion request

### Rule Logic

```yaml
rule_id: "auto_tagging"
priority: low  # Runs async
enabled: true

triggers:
  - event: "weave_nn.file.created"
    conditions:
      - tags.count < 3  # Minimal or missing tags
  - event: "weave_nn.file.modified"
    conditions:
      - content_significantly_changed
  - event: "manual.suggest_tags.invoked"

tag_taxonomy:
  # Hierarchical tag structure
  categories:
    - category: "type"
      required: true
      values: [concept, platform, technical, feature, decision, workflow, question, planning]
      auto_apply: true  # Inferred from frontmatter.type

    - category: "domain"
      required: false
      values: [knowledge-graph, ai, integration, saas, architecture, process]
      inference: content_analysis

    - category: "complexity"
      required: false
      values: [simple, moderate, complex, very-complex]
      inference: estimated_from_content_length_and_structure

    - category: "status"
      required: false
      values: [active, draft, planned, completed, deprecated, deferred]
      auto_apply: from_frontmatter.status

    - category: "priority"
      required: false
      values: [critical, high, medium, low]
      auto_apply: from_frontmatter.priority

    - category: "technical"
      required: false
      values: [react, svelte, typescript, python, graphql, sqlite, supabase, mcp]
      inference: keyword_detection

analysis:
  - infer_from_type:
      - always_add: frontmatter.type  # e.g., "concept"
      - folder_based: folder_to_tag(file.folder)  # "concepts/" → "concept"

  - infer_from_content:
      - extract_technical_terms:
          - patterns: [library_names, framework_names, language_names]
          - match_to_taxonomy: technical_category
      - extract_domain_terms:
          - analyze: main_topics(content)
          - match_to_taxonomy: domain_category

  - infer_from_frontmatter:
      - map_status: frontmatter.status → status_tag
      - map_priority: frontmatter.priority → priority_tag
      - map_complexity: frontmatter.complexity → complexity_tag

  - infer_from_relationships:
      - analyze_linked_nodes: for each wikilink, read target tags
      - find_common_tags: tags that appear in 50%+ of linked nodes
      - suggest_common: "Nodes you link to use these tags: {common_tags}"

  - learn_from_patterns:
      - analyze_similar_nodes: find nodes with similar content
      - extract_tag_patterns: what tags do they use?
      - suggest_based_on_patterns: "Similar nodes use: {pattern_tags}"

actions:
  - generate_suggestions:
      - required_tags: tags from required categories
      - suggested_tags: tags from optional categories (scored by confidence)
      - format:
          - "### Suggested Tags"
          - "Required: {required_tags}"
          - "Suggested: {suggested_tags} (confidence: {scores})"

  - auto_apply_required:
      - if: tag in required_categories AND confidence > 0.9
        then:
          - add_tag: append_to_frontmatter_tags(tag)
          - log: "Auto-tagged {file} with required tag: {tag}"

  - auto_apply_high_confidence:
      - if: confidence > 0.85 AND auto_tag_enabled
        then:
          - add_tag: append_to_frontmatter_tags(tag)
          - log: "Auto-tagged {file} with {tag} (confidence: {confidence})"

  - present_for_review:
      - if: confidence > 0.6 AND confidence <= 0.85
        then:
          - add_comment: "# Suggested tags: {tags_with_scores}"
          - notify: "Review suggested tags for [[{node}]]"

validation:
  - check_tag_consistency:
      - no_duplicate_tags: true
      - tags_in_taxonomy: warn_if_not
      - min_tags: 2
      - max_tags: 10

  - suggest_tag_refinement:
      - if: tags.count > 10
        then: suggest_removal_of_redundant_tags
      - if: tags.count < 2
        then: suggest_adding_more_specific_tags

metrics:
  - track: "tags_suggested"
  - track: "tags_auto_applied"
  - track: "tag_acceptance_rate"
  - track: "average_tags_per_node"
```

### Example

**Scenario**: User creates decision node with minimal tags

```yaml
# decisions/technical/database-choice.md
---
decision_id: "TS-4"
title: "Database & Storage"
type: decision
status: open
tags:
  - decision
---

# TS-4: Database & Storage

Should we use PostgreSQL, SQLite, or a graph database for storage?

Options include Supabase with PostgreSQL, local SQLite, or Neo4j for graph queries. We need multi-tenancy and knowledge graph support.
```

```javascript
// Rule triggers:
// 1. Detects: tags.count = 1 (only "decision")
// 2. Infers from type: "decision" (already present)
// 3. Infers from frontmatter:
//    - status: "open" → tag "open"
//    - decision_id starts with "TS" → tag "technical"
// 4. Extracts technical terms:
//    - "PostgreSQL" → tag "postgresql"
//    - "SQLite" → tag "sqlite"
//    - "Neo4j" → tag "neo4j"
//    - "Supabase" → tag "supabase"
// 5. Extracts domain terms:
//    - "database", "storage" → tag "database"
//    - "multi-tenancy" → tag "saas"
//    - "knowledge graph" → tag "knowledge-graph"
// 6. Analyzes linked nodes: (none yet, skip)
// 7. Generates suggestions:
//
// ### Suggested Tags
// Required: technical (confidence: 1.0, from decision_id)
// Suggested:
// - database (confidence: 0.95, domain term frequency)
// - postgresql (confidence: 0.90, keyword match)
// - sqlite (confidence: 0.90, keyword match)
// - supabase (confidence: 0.88, keyword match)
// - knowledge-graph (confidence: 0.85, keyword match)
// - saas (confidence: 0.80, multi-tenancy context)
// - open (confidence: 0.75, from status)
//
// 8. Auto-applies high confidence (> 0.85):
//    tags: [decision, technical, database, postgresql, sqlite, supabase, knowledge-graph]
// 9. Suggests for review (0.6-0.85):
//    # Suggested tags: saas (0.80), open (0.75)
// 10. Final frontmatter:
tags:
  - decision
  - technical
  - database
  - postgresql
  - sqlite
  - supabase
  - knowledge-graph
// 11. Logs: "Auto-tagged TS-4 with 6 tags"
```

---

## 🎯 Rule Coordination

### Execution Order

1. **`schema_validation`** - Runs first to ensure data integrity
2. **`memory_sync`** - Syncs validated nodes to Claude-Flow
3. **`node_creation`** - Creates new nodes as needed
4. **`update_propagation`** - Propagates changes to related nodes
5. **`auto_linking`** - Suggests links after content is stable
6. **`auto_tagging`** - Tags after links are established

### Conflict Resolution

If multiple rules try to modify the same file:
- **Priority order**: schema_validation > memory_sync > update_propagation > node_creation > auto_linking > auto_tagging
- **Lock mechanism**: First rule to start editing locks the file
- **Queue system**: Other rules wait for lock release
- **Timeout**: 30 seconds, then log error

---

## 📊 Monitoring & Metrics

### Rule Health Dashboard

Track for each rule:
- **Execution count**: How many times triggered
- **Success rate**: % of successful executions
- **Average duration**: Time to complete
- **Error rate**: % of failed executions
- **Auto-fix rate**: % of issues auto-resolved

### Aggregate Metrics

- **Total automations**: Count across all rules
- **Human interventions**: Times human input was needed
- **Time saved**: Estimated hours saved by automation
- **Quality improvement**: Validation pass rate over time

---

## 🔗 Related Documentation

- [[claude-flow-schema-mapping|Schema Mapping]]
- [[claude-flow-memory-visualization|Memory Visualization]]
- [[ai-agent-integration|AI Agent Integration]]
- [[model-context-protocol|MCP Protocol]]
- [[../_planning/phases/phase-4-claude-flow-integration|Phase 4 Plan]]

---

**Status**: Active - Ready for implementation
**Owner**: Phase 4 Team
**Priority**: Critical
**Last Updated**: 2025-10-20
