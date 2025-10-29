---
type: technical-primitive
category: standard
status: in-use
first_used_phase: PHASE-1
mvp_required: true
future_only: false
maturity: mature
used_in_services:
  - mcp-server
  - file-watcher
  - event-consumer
deployment: local-dev
alternatives_considered:
  - '[[json-metadata]]'
  - '[[toml-frontmatter]]'
  - '[[custom-metadata-format]]'
replaces: null
replaced_by: null
decision: '[[../decisions/technical/metadata-format-selection]]'
architecture: '[[../architecture/knowledge-graph-schema]]'
tags:
  - technical
  - standard
  - metadata
  - obsidian
  - in-use
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-technical-primitive
    - status-in-use
version: '3.0'
updated_date: '2025-10-28'
---

# YAML Frontmatter

**Category**: Metadata Standard
**Status**: In Use (Established Phase 1)
**First Used**: Phase 1 (Architecture Design)

---

## Overview

YAML frontmatter is a metadata block format using YAML syntax enclosed between triple-dashes (---) at the beginning of Markdown files. It enables structured, machine-readable metadata while maintaining human readability and Obsidian native compatibility.

**Official Site**: https://jekyllrb.com/docs/front-matter/ (Jekyll origin)
**Documentation**: https://yaml.org/spec/1.2/spec.html (YAML spec)
**Obsidian Support**: https://help.obsidian.md/Editing+and+formatting/Properties (native support)

---

## Why We Use It

YAML frontmatter serves as the **canonical metadata format** for all Weave-NN knowledge graph nodes, enabling structured relationships, agent rules, and visual configuration while remaining Obsidian-native.

**Primary Purpose**: Define structured metadata for knowledge graph nodes that is readable by Obsidian, MCP server, and AI agents.

**Specific Use Cases**:
- Node metadata in [[../architecture/obsidian-vault]] - type, status, phase, maturity fields
- Relationship definitions in [[../architecture/knowledge-graph-schema]] - links between nodes via arrays
- Agent rule conditions in [[../features/auto-tagging]] - triggers based on frontmatter properties
- Visual configuration in [[../architecture/visualization-system]] - node colors, icons, positions in graph view
- Query filtering in [[../architecture/mcp-server]] - GraphQL/REST endpoints filter by frontmatter properties

---

## Key Capabilities

- **Obsidian Native Support**: Renders as Properties panel in Obsidian UI - no plugins required
- **Type Safety**: Supports strings, numbers, booleans, dates, arrays, nested objects - validated by Obsidian
- **Machine Readable**: Parsed by Python (PyYAML), TypeScript (js-yaml), and MCP server - enables automation
- **Human Readable**: YAML syntax is intuitive for non-technical users - easier than JSON
- **Standardized Schema**: Weave-NN defines 4 property groups (metadata, scope, relationships, visual) - consistent across all nodes

---

## Integration Points

**Used By**:
- [[../architecture/obsidian-vault]] - All .md files contain YAML frontmatter
- [[../architecture/mcp-server]] - Parses frontmatter for graph queries and node metadata
- [[../architecture/event-consumer]] - Reads frontmatter to evaluate agent rule conditions
- [[../architecture/knowledge-graph-schema]] - Defines schema for frontmatter properties

**Integrates With**:
- [[obsidian]] - Native Properties panel renders and edits frontmatter
- [[python]] - PyYAML library parses frontmatter in MCP server and event consumer
- [[wikilinks]] - Frontmatter arrays store [[wikilink]] relationships (e.g., `related_nodes: ["[[node1]]", "[[node2]]"]`)

**Enables Features**:
- [[../features/auto-tagging]] - Agent rules trigger based on frontmatter tags/properties
- [[../features/decision-tracking]] - ADR frontmatter stores decision status, date, stakeholders
- [[../features/daily-log-automation]] - Daily log template includes frontmatter for date, mood, tasks
- [[../features/graph-visualization]] - Visual properties control node appearance in Obsidian graph

---

## Configuration

**Standard Schema** (Weave-NN):
```yaml
---
# METADATA GROUP - Core identification
type: [feature|technical-primitive|decision|architecture|planning]
category: [specific-to-type]
status: [planned|in-progress|active|completed|deprecated]
created: YYYY-MM-DD
updated: YYYY-MM-DD

# SCOPE GROUP - Project context
first_used_phase: "PHASE-X"
mvp_required: true/false
future_only: true/false
maturity: [experimental|stable|mature|legacy]

# COGNITIVE GROUP - Thinking patterns
thinking-pattern: [convergent|divergent|lateral|systems|critical|adaptive]

# RELATIONSHIPS GROUP - Graph connections
used_in_services:
  - service-name-1
  - service-name-2
alternatives_considered:
  - "[[alternative-1]]"
replaces: "[[previous-node]]"
replaced_by: "[[future-node]]"

# VISUAL GROUP - Graph rendering
tags:
  - tag1
  - tag2
cssclasses:
  - custom-styling
---
```

**Property Types**:
- **String**: `type: feature` - single-line text
- **Number**: `priority: 1` - integers or floats
- **Boolean**: `mvp_required: true` - true/false
- **Date**: `created: 2025-10-23` - ISO 8601 format
- **Array**: `tags: [tag1, tag2]` - list of values (inline or multiline)
- **Object**: `nested: {key: value}` - nested properties

**Thinking Pattern Field** (`thinking-pattern`):

The `thinking-pattern` field tracks the cognitive approach used when creating or working with a node. This enables AI agents to adapt their reasoning style to match the node's purpose and helps identify cognitive diversity in the knowledge graph.

**Allowed Values**:
- **convergent**: Focused, analytical thinking toward a single solution
  - Use for: Technical specifications, bug fixes, optimization tasks, implementation details
  - Characteristics: Logical reasoning, narrowing options, definitive answers
  - Example: "Implement authentication using JWT tokens with 256-bit encryption"

- **divergent**: Creative, exploratory thinking generating multiple possibilities
  - Use for: Brainstorming, research, alternative solutions, conceptual exploration
  - Characteristics: Idea generation, open-ended questions, expanding possibilities
  - Example: "Explore different approaches to visualize knowledge graph relationships"

- **lateral**: Cross-domain connections and unconventional problem-solving
  - Use for: Innovation, analogies, reframing problems, interdisciplinary insights
  - Characteristics: Drawing parallels, metaphorical thinking, unexpected connections
  - Example: "Apply neural network pruning techniques to knowledge graph optimization"

- **systems**: Holistic, interconnected thinking about relationships and patterns
  - Use for: Architecture design, integration planning, impact analysis, emergent behavior
  - Characteristics: Feedback loops, interdependencies, whole-system perspective
  - Example: "Design event-driven architecture considering all component interactions"

- **critical**: Evaluative, questioning thinking that challenges assumptions
  - Use for: Code review, decision analysis, risk assessment, trade-off evaluation
  - Characteristics: Skeptical inquiry, evidence evaluation, identifying weaknesses
  - Example: "Evaluate security implications of exposing MCP server to network"

- **adaptive**: Context-switching, flexible thinking that adjusts to changing conditions
  - Use for: Refactoring, iterative development, learning from feedback, pivoting
  - Characteristics: Responsiveness, pattern recognition, learning from experience
  - Example: "Refactor rule engine based on performance profiling results"

**Usage Guidelines**:
- **Single Pattern**: Most nodes should have one primary thinking pattern
- **Optional Field**: Not all nodes require this field (especially older/legacy nodes)
- **Agent Integration**: AI agents can query `thinking-pattern` to select appropriate reasoning strategies
- **Cognitive Diversity**: Track distribution of patterns to ensure balanced knowledge graph
- **Evolution**: Patterns may change as nodes evolve (e.g., divergent → convergent as ideas solidify)

**Examples**:
```yaml
---
type: feature
thinking-pattern: divergent
# Brainstorming visualization approaches
---

---
type: technical-primitive
thinking-pattern: convergent
# Implementing specific API endpoint
---

---
type: architecture
thinking-pattern: systems
# Designing microservices integration
---

---
type: decision
thinking-pattern: critical
# Evaluating database technology choices
---
```

**Parsing in Python (MCP Server)**:
```python
import yaml
from pathlib import Path

def parse_frontmatter(file_path: Path) -> dict:
    """Extract YAML frontmatter from markdown file."""
    content = file_path.read_text()

    if not content.startswith('---'):
        return {}

    # Split by frontmatter delimiters
    parts = content.split('---', 2)
    if len(parts) < 3:
        return {}

    frontmatter_yaml = parts[1]
    return yaml.safe_load(frontmatter_yaml)
```

---

## Deployment

**MVP (Phase 5-6)**: Obsidian vault files + Python parsing in MCP server
**v1.0 (Post-MVP)**: Same approach + PostgreSQL caching of parsed frontmatter

**Resource Requirements**:
- RAM: Minimal (YAML parsing is lightweight, ~1-2 KB per file)
- CPU: Negligible (parsing ~100 files takes <100ms)
- Storage: ~500 bytes - 2 KB per file (depends on property count)

**Health Check**:
```bash
# Validate YAML syntax in all vault files
find /vault -name "*.md" -exec python -c "
import yaml
import sys
with open('{}', 'r') as f:
    content = f.read()
    if content.startswith('---'):
        yaml_block = content.split('---', 2)[1]
        yaml.safe_load(yaml_block)
print('✓ Valid YAML')
" \;

# Check for required frontmatter fields
grep -L "^type:" /vault/**/*.md  # Find files missing 'type' property
```

---

## Trade-offs

**Pros** (Why we chose it):
- ✅ **Obsidian Native**: Zero plugin overhead, renders in Properties panel automatically
- ✅ **Human Readable**: YAML is more intuitive than JSON for non-developers
- ✅ **Type Rich**: Supports dates, arrays, objects - not just strings
- ✅ **Widespread Adoption**: Used by Jekyll, Hugo, Astro, Obsidian - portable across systems
- ✅ **Query-Friendly**: Easy to filter/sort nodes by properties in MCP server

**Cons** (What we accepted):
- ⚠️ **YAML Quirks**: Boolean parsing can be ambiguous (yes/no vs true/false) - mitigated by using true/false exclusively
- ⚠️ **No Schema Validation in Obsidian**: Obsidian doesn't enforce schema - mitigated by MCP server validation + agent rule checks
- ⚠️ **Verbosity**: More verbose than JSON for simple key-value pairs - acceptable tradeoff for readability

---

## Alternatives Considered

**Compared With**:

### [[json-metadata]]
- **Pros**: Stricter syntax, native JavaScript support, better for APIs
- **Cons**: Less human-readable (quotes, commas), not Obsidian-native (requires plugin)
- **Decision**: Rejected because Obsidian natively supports YAML, not JSON frontmatter

### [[toml-frontmatter]]
- **Pros**: Cleaner syntax for nested objects, no indentation issues
- **Cons**: Not supported by Obsidian, less common than YAML, requires custom parser
- **Decision**: Rejected due to lack of Obsidian support

### [[custom-metadata-format]]
- **Pros**: Could design perfect schema for Weave-NN needs
- **Cons**: No tooling support, requires custom parser, breaks Obsidian compatibility
- **Decision**: Rejected because YAML + Obsidian native support is "good enough"

---

## Decision History

**Decision Record**: [[../decisions/technical/metadata-format-selection]]

**Key Reasoning**:
> "YAML frontmatter is the only metadata format that satisfies three critical constraints: (1) native Obsidian support for zero-friction user experience, (2) rich type system for structured graph relationships, and (3) widespread tooling support for parsing in Python/TypeScript. While YAML has quirks, its Obsidian integration makes it non-negotiable."

**Date Decided**: 2025-09-15 (Phase 1 Architecture Design)
**Decided By**: System Architect (foundational design decision)

---

## Phase Usage

### Phase 1 (Architecture) - Established
**Status**: Standard defined for all knowledge graph nodes
**Schema**: 4 property groups (metadata, scope, relationships, visual)
**Usage**: All architecture docs use YAML frontmatter from inception

### Phase 5 (MVP Week 1) - Active Parsing
**Status**: MCP server parses frontmatter for graph queries
**Implementation**: PyYAML library in `mcp-server/app/vault_parser.py`
**Usage**:
- REST endpoint `/api/nodes` filters by frontmatter properties
- MCP tool `get_node_by_type` queries by `type` field
- File watcher extracts frontmatter to RabbitMQ events

### Phase 6 (MVP Week 2) - Agent Rule Integration
**Status**: Event consumer evaluates frontmatter in agent rule conditions
**Enhancement**: Rules can trigger based on `status`, `tags`, `phase` properties
**Example Rule**:
```yaml
# Auto-tag technical primitives missing documentation
trigger:
  when: type == "technical-primitive"
  and: status == "in-use"
  and: not has_key("decision")
action: add_tag("needs-decision-record")
```

### Phase 7 (v1.0) - PostgreSQL Indexing
**Status**: Frontmatter cached in PostgreSQL for fast queries
**Optimization**: Index on `type`, `status`, `tags` for sub-100ms queries
**Schema**:
```sql
CREATE TABLE node_metadata (
  file_path TEXT PRIMARY KEY,
  frontmatter JSONB,  -- Store parsed YAML as JSON
  updated_at TIMESTAMP
);
CREATE INDEX idx_type ON node_metadata ((frontmatter->>'type'));
CREATE INDEX idx_thinking_pattern ON node_metadata ((frontmatter->>'thinking-pattern'));
```

### Phase 8+ (Hive Mind) - Cognitive Pattern Integration
**Status**: AI agents use `thinking-pattern` to select reasoning strategies
**Enhancement**: Hive Mind analyzes cognitive diversity across knowledge graph
**Agent Integration**:
```python
# Agent selects reasoning strategy based on node's thinking pattern
def select_agent_strategy(node_metadata: dict) -> str:
    """Match agent reasoning to node's cognitive pattern."""
    pattern = node_metadata.get('thinking-pattern', 'adaptive')

    strategy_map = {
        'convergent': 'analytical_agent',      # Focused problem-solving
        'divergent': 'creative_agent',          # Idea generation
        'lateral': 'innovation_agent',          # Cross-domain thinking
        'systems': 'architect_agent',           # Holistic design
        'critical': 'reviewer_agent',           # Evaluation and critique
        'adaptive': 'generalist_agent'          # Flexible approach
    }

    return strategy_map.get(pattern, 'generalist_agent')

# Query nodes by cognitive pattern
def find_similar_thinking(pattern: str) -> list:
    """Find nodes using same cognitive approach."""
    query = """
        SELECT file_path, frontmatter->>'type' as type
        FROM node_metadata
        WHERE frontmatter->>'thinking-pattern' = %s
        ORDER BY updated_at DESC
    """
    return db.execute(query, [pattern])

# Analyze cognitive diversity
def analyze_cognitive_balance() -> dict:
    """Check distribution of thinking patterns."""
    query = """
        SELECT
            frontmatter->>'thinking-pattern' as pattern,
            COUNT(*) as count
        FROM node_metadata
        WHERE frontmatter->>'thinking-pattern' IS NOT NULL
        GROUP BY pattern
        ORDER BY count DESC
    """
    results = db.execute(query)

    return {
        'distribution': results,
        'dominant_pattern': results[0]['pattern'],
        'diversity_score': len(results) / 6.0  # 6 possible patterns
    }
```

**Hive Mind Use Cases**:
- **Agent Assignment**: Route tasks to agents with matching cognitive patterns
- **Cognitive Gaps**: Identify underrepresented thinking patterns in knowledge graph
- **Pattern Evolution**: Track how node patterns change over time (divergent → convergent)
- **Team Formation**: Assemble diverse agent teams with complementary thinking styles
- **Knowledge Mining**: Find lateral connections between nodes with different patterns

---

## Learning Resources

**Official Documentation**:
- [YAML Specification](https://yaml.org/spec/1.2/spec.html) - Full YAML syntax reference
- [Obsidian Properties](https://help.obsidian.md/Editing+and+formatting/Properties) - Frontmatter in Obsidian
- [Jekyll Front Matter](https://jekyllrb.com/docs/front-matter/) - Origin of convention

**Tutorials**:
- [YAML Frontmatter Guide](https://assemble.io/docs/YAML-front-matter.html) - Practical examples
- [Obsidian Properties Tutorial](https://www.youtube.com/obsidian-properties) - Video walkthrough

**Best Practices**:
- [YAML Best Practices](https://yaml.org/spec/1.2/spec.html#id2804356) - Official recommendations
- [Obsidian Metadata Conventions](https://forum.obsidian.md/t/metadata-best-practices) - Community patterns

**Parsing Libraries**:
- [PyYAML](https://pyyaml.org/wiki/PyYAMLDocumentation) - Python YAML parser
- [js-yaml](https://github.com/nodeca/js-yaml) - JavaScript YAML parser
- [frontmatter](https://github.com/jxson/front-matter) - Node.js frontmatter extractor

---

## Monitoring & Troubleshooting

**Health Checks**:
```bash
# Validate YAML syntax across entire vault
python -m vault_linter --check-frontmatter /vault

# Find files with invalid YAML
find /vault -name "*.md" | while read file; do
  python -c "import yaml; yaml.safe_load(open('$file').read().split('---')[1])" || echo "Invalid: $file"
done

# Check for required frontmatter fields
python scripts/validate_schema.py /vault
# Expected: ✓ All files have required fields (type, status)
```

**Common Issues**:

1. **Issue**: YAML parsing error (invalid indentation)
   **Solution**: Use 2-space indentation consistently, validate with online YAML linter
   ```yaml
   # ❌ WRONG (mixed tabs/spaces)
   used_in:
   	- service1  # Tab used
     - service2  # Spaces used

   # ✅ CORRECT (2 spaces)
   used_in:
     - service1
     - service2
   ```

2. **Issue**: Boolean values parsed as strings ("true" vs true)
   **Solution**: Use unquoted true/false, not yes/no or "true"
   ```yaml
   # ❌ WRONG
   mvp_required: "true"  # Parsed as string
   future_only: yes      # Ambiguous

   # ✅ CORRECT
   mvp_required: true    # Parsed as boolean
   future_only: false
   ```

3. **Issue**: Obsidian Properties panel shows wrong type (date as string)
   **Solution**: Use ISO 8601 date format (YYYY-MM-DD)
   ```yaml
   # ❌ WRONG
   created: 10/23/2025  # Ambiguous format

   # ✅ CORRECT
   created: 2025-10-23  # ISO 8601
   ```

4. **Issue**: Wikilinks in frontmatter not recognized by Obsidian graph
   **Solution**: Wrap wikilinks in quotes
   ```yaml
   # ❌ WRONG (breaks YAML parser)
   related: [[node1]]

   # ✅ CORRECT
   related: "[[node1]]"
   # OR use array syntax
   related:
     - "[[node1]]"
     - "[[node2]]"
   ```

5. **Issue**: Invalid thinking-pattern value
   **Solution**: Use only the 6 allowed values (convergent, divergent, lateral, systems, critical, adaptive)
   ```yaml
   # ❌ WRONG (invalid values)
   thinking-pattern: analytical    # Not a valid option
   thinking-pattern: exploratory   # Not a valid option
   thinking-pattern: creative      # Not a valid option

   # ✅ CORRECT
   thinking-pattern: convergent    # Focused, analytical
   thinking-pattern: divergent     # Creative, exploratory
   thinking-pattern: lateral       # Cross-domain connections
   ```

6. **Issue**: Multiple thinking patterns assigned to single node
   **Solution**: Choose the PRIMARY pattern; nodes should have one dominant cognitive approach
   ```yaml
   # ❌ WRONG (multiple patterns)
   thinking-pattern:
     - convergent
     - systems

   # ✅ CORRECT (single pattern)
   thinking-pattern: systems       # Primary approach for this node
   # If node evolves, update pattern or add comment
   thinking-pattern: convergent    # Evolved from divergent after prototyping
   ```

**Validation Scripts**:
```bash
# Validate thinking-pattern values across vault
python scripts/validate_thinking_patterns.py /vault
# Expected: ✓ All thinking-pattern values are valid

# Find nodes missing thinking-pattern (for new feature tracking)
grep -L "thinking-pattern:" /vault/**/*.md | grep -E "(features|concepts)/"
# These may benefit from cognitive pattern tagging

# Analyze cognitive diversity
python scripts/analyze_cognitive_balance.py /vault
# Expected: Balanced distribution across 6 patterns
```

---

## Related Nodes

**Architecture**:
- [[../architecture/knowledge-graph-schema]] - Defines frontmatter schema
- [[../architecture/obsidian-vault]] - Storage layer using frontmatter
- [[../architecture/mcp-server]] - Parses frontmatter for API queries

**Features**:
- [[../features/auto-tagging]] - Agent rules read frontmatter tags
- [[../features/decision-tracking]] - ADR template uses frontmatter
- [[../features/daily-log-automation]] - Daily log frontmatter for date/mood

**Decisions**:
- [[../decisions/technical/metadata-format-selection]] - Why YAML over JSON/TOML
- [[../decisions/technical/obsidian-first-architecture]] - Native Obsidian support requirement

**Other Primitives**:
- [[obsidian]] - Platform that natively supports YAML frontmatter
- [[python]] - Language used to parse frontmatter (PyYAML)
- [[wikilinks]] - Relationship syntax embedded in frontmatter arrays

---

## Revisit Criteria

**Reconsider this technology if**:
- Obsidian drops YAML frontmatter support (unlikely - core feature)
- YAML parsing becomes performance bottleneck (>1 second for 10k files)
- Schema validation overhead requires switching to typed format (JSON Schema + JSON)
- Custom metadata needs exceed YAML's type system (e.g., binary data, complex relations)

**Scheduled Review**: Only if Obsidian changes metadata architecture (monitor release notes)

---

**Back to**: [[README|Technical Primitives Index]]
