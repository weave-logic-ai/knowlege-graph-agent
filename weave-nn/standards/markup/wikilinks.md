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
  - event-consumer
  - file-watcher
deployment: local-dev
alternatives_considered:
  - '[[markdown-links]]'
  - '[[html-links]]'
  - '[[custom-link-syntax]]'
replaces: null
replaced_by: null
decision: '[[../decisions/technical/link-syntax-standard]]'
architecture: '[[../architecture/knowledge-graph-schema]]'
tags:
  - technical
  - standard
  - linking
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

# Wikilinks

**Category**: Link Syntax Standard
**Status**: In Use (Established Phase 1)
**First Used**: Phase 1 (Architecture Design)

---

## Overview

Wikilinks are a bidirectional linking syntax using double square brackets `[[target]]` to reference other documents by title. Originating from MediaWiki, they enable frictionless knowledge graph relationships in Obsidian and similar tools without requiring explicit file paths or URLs.

**Official Site**: https://en.wikipedia.org/wiki/Help:Link (MediaWiki origin)
**Documentation**: https://help.obsidian.md/Linking+notes+and+files/Internal+links (Obsidian implementation)
**Standard**: De facto standard in knowledge management tools (Obsidian, Roam, Logseq)

---

## Why We Use It

Wikilinks serve as the **canonical linking syntax** for defining relationships in Weave-NN's knowledge graph, enabling bidirectional navigation, automatic backlink tracking, and MCP graph query traversal.

**Primary Purpose**: Define typed, bidirectional relationships between knowledge graph nodes using Obsidian-native syntax.

**Specific Use Cases**:
- Node relationships in [[../architecture/knowledge-graph-schema]] - connects primitives, features, decisions, architecture
- Graph traversal in [[../architecture/mcp-server]] - MCP tools query linked nodes via wikilinks
- Backlink tracking in [[../features/auto-linking]] - Obsidian automatically detects bidirectional links
- Frontmatter arrays in [[yaml-frontmatter]] - stores wikilinks as structured relationships (e.g., `related: ["[[node1]]"]`)
- Agent rule conditions in [[../features/auto-tagging]] - triggers based on link presence/count

---

## Key Capabilities

- **Obsidian Native**: First-class support in Obsidian UI with autocomplete, hover preview, and graph visualization
- **Bidirectional**: Creating `[[target]]` automatically adds backlink in target node - no manual maintenance
- **Title-Based**: Links reference note titles, not file paths - renaming files updates links automatically
- **Alias Support**: `[[target|display text]]` shows custom text while linking to target
- **Heading Links**: `[[target#heading]]` links to specific sections within target
- **Block Links**: `[[target^block-id]]` links to specific paragraphs (Obsidian-specific)

---

## Integration Points

**Used By**:
- [[../architecture/obsidian-vault]] - All .md files use wikilinks for relationships
- [[../architecture/mcp-server]] - Parses wikilinks to build graph structure for queries
- [[../architecture/event-consumer]] - Evaluates link-based agent rule conditions
- [[../architecture/knowledge-graph-schema]] - Defines relationship types via wikilink patterns

**Integrates With**:
- [[obsidian]] - Native rendering with hover preview and graph view
- [[yaml-frontmatter]] - Wikilinks stored in frontmatter arrays for structured relationships
- [[python]] - Regex parsing in MCP server to extract wikilinks from markdown content

**Enables Features**:
- [[../features/auto-linking]] - Agent rules create wikilinks based on content analysis
- [[../features/graph-visualization]] - Obsidian graph view renders wikilinks as edges
- [[../features/collaborative-editing]] - Wikilinks remain valid when files move (title-based)
- [[../features/decision-tracking]] - ADRs link to affected architecture/features via wikilinks

---

## Configuration

**Syntax Variants**:
```markdown
# Basic link (references note title)
[[target-note]]

# Link with custom display text (alias)
[[target-note|Display Text]]

# Link to heading within note
[[target-note#Specific Section]]

# Link to block (Obsidian-specific)
[[target-note^block-id]]

# Relative path link (fallback if title ambiguous)
[[folder/subfolder/target-note]]

# Embed entire note (transclusion)
![[target-note]]
```

**Frontmatter Storage** (structured relationships):
```yaml
---
# Store wikilinks in arrays for machine parsing
related_nodes:
  - "[[technical-primitive-1]]"
  - "[[technical-primitive-2]]"

alternatives_considered:
  - "[[alternative-approach]]"

replaces: "[[legacy-system]]"

# Links with context (future enhancement)
dependencies:
  - target: "[[dependency-1]]"
    type: "hard-dependency"
  - target: "[[dependency-2]]"
    type: "optional"
---
```

**Parsing in Python (MCP Server)**:
```python
import re
from pathlib import Path
from typing import List, Tuple

def extract_wikilinks(content: str) -> List[Tuple[str, str]]:
    """
    Extract wikilinks from markdown content.
    Returns list of (target, alias) tuples.
    """
    # Match [[target]] or [[target|alias]]
    pattern = r'\[\[([^\]|]+)(?:\|([^\]]+))?\]\]'
    matches = re.findall(pattern, content)

    # Convert matches to (target, alias) tuples
    # If no alias, use target as display text
    return [(target.strip(), alias.strip() or target.strip())
            for target, alias in matches]

def resolve_wikilink(target: str, vault_path: Path) -> Path:
    """
    Resolve wikilink target to file path.
    Handles title-based lookup and relative paths.
    """
    # Try exact match on filename (without extension)
    exact_match = vault_path / f"{target}.md"
    if exact_match.exists():
        return exact_match

    # Search vault for note with matching title
    for file_path in vault_path.rglob("*.md"):
        if file_path.stem == target:
            return file_path

    # Not found - return None or raise error
    return None
```

---

## Deployment

**MVP (Phase 5-6)**: Obsidian vault files + Python regex parsing in MCP server
**v1.0 (Post-MVP)**: Same approach + PostgreSQL graph table for link indexing

**Resource Requirements**:
- RAM: Minimal (link parsing is lightweight, ~10-20 links per file)
- CPU: Low (regex parsing ~1000 files takes <500ms)
- Storage: ~50-200 bytes per link (text storage only)

**Health Check**:
```bash
# Find broken wikilinks (links to non-existent notes)
python scripts/check_broken_links.py /vault
# Expected: ✓ All wikilinks resolve to existing files

# Count wikilinks per node (graph density metric)
grep -r "\[\[" /vault | wc -l
# Expected: >500 wikilinks for comprehensive knowledge graph

# Validate wikilink syntax (no malformed links)
grep -r "\[\[[^\]]*\]\]" /vault | grep -v "\[\[[^\]|]*\(|[^\]]*\)\?\]\]"
# Expected: No matches (all links valid)
```

---

## Trade-offs

**Pros** (Why we chose it):
- ✅ **Obsidian Native**: Zero friction for users, autocomplete, hover preview, graph view
- ✅ **Bidirectional**: Backlinks tracked automatically - no manual maintenance
- ✅ **Title-Based**: File renames update all links automatically in Obsidian
- ✅ **Readable**: `[[note]]` is cleaner than `[note](./path/to/note.md)` for internal links
- ✅ **Graph-Friendly**: Wikilinks naturally represent graph edges for visualization

**Cons** (What we accepted):
- ⚠️ **Non-Standard Markdown**: Not supported by GitHub/GitLab Markdown renderers - mitigated by keeping vault private (Obsidian-only)
- ⚠️ **Ambiguity**: Multiple notes with same title cause conflicts - mitigated by unique naming convention + relative paths
- ⚠️ **External Tool Dependency**: Requires custom parser outside Obsidian - acceptable because MCP server handles parsing

---

## Alternatives Considered

**Compared With**:

### [[markdown-links]]
- **Pros**: Standard Markdown syntax `[text](path)`, works in GitHub/GitLab
- **Cons**: Requires explicit file paths, no bidirectional tracking, no autocomplete
- **Decision**: Rejected because Obsidian's wikilink features (backlinks, graph) are critical to MVP

### [[html-links]]
- **Pros**: Universal standard, works everywhere
- **Cons**: Verbose `<a href="...">text</a>`, not Markdown-friendly, no Obsidian integration
- **Decision**: Rejected for being too verbose and breaking Markdown readability

### [[custom-link-syntax]]
- **Pros**: Could design perfect syntax for Weave-NN needs (typed links, metadata)
- **Cons**: Breaks Obsidian compatibility, requires custom parser and UI
- **Decision**: Rejected because Obsidian native support is non-negotiable for MVP

---

## Decision History

**Decision Record**: [[../decisions/technical/link-syntax-standard]]

**Key Reasoning**:
> "Wikilinks are the only linking syntax that satisfies Obsidian-first architecture: native bidirectional tracking, automatic backlink generation, graph visualization, and title-based references. While they aren't standard Markdown, the vault is private to Obsidian, so external renderer compatibility is irrelevant. The MCP server can parse wikilinks with simple regex."

**Date Decided**: 2025-09-15 (Phase 1 Architecture Design)
**Decided By**: System Architect (foundational design decision)

---

## Phase Usage

### Phase 1 (Architecture) - Established
**Status**: Standard defined for all knowledge graph relationships
**Convention**: Use wikilinks for all internal references, Markdown links for external URLs
**Usage**: All architecture docs use wikilinks from inception

### Phase 5 (MVP Week 1) - Active Parsing
**Status**: MCP server parses wikilinks to build graph structure
**Implementation**: Regex extraction in `mcp-server/app/wikilink_parser.py`
**Usage**:
- MCP tool `get_related_nodes` follows wikilinks to find neighbors
- REST endpoint `/api/graph` returns nodes + edges (wikilinks)
- File watcher extracts wikilinks for RabbitMQ event payloads

### Phase 6 (MVP Week 2) - Agent Rule Integration
**Status**: Event consumer evaluates wikilink-based rule conditions
**Enhancement**: Rules trigger based on link count, target node type, backlink presence
**Example Rules**:
```yaml
# Auto-tag orphan nodes (no incoming wikilinks)
trigger:
  when: backlink_count == 0
action: add_tag("orphan")

# Link new features to architecture
trigger:
  when: type == "feature"
  and: not has_wikilink_to_type("architecture")
action: suggest_link("[[../architecture/mvp-local-first-architecture]]")
```

### Phase 7 (v1.0) - Graph Database Indexing
**Status**: Wikilinks indexed in PostgreSQL graph table for fast traversal
**Optimization**: Store edges in adjacency list for sub-50ms graph queries
**Schema**:
```sql
CREATE TABLE graph_edges (
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  link_type TEXT,  -- 'wikilink' | 'backlink' | 'embed'
  context TEXT,    -- Surrounding text for link
  PRIMARY KEY (source_path, target_path)
);
CREATE INDEX idx_target ON graph_edges (target_path);  -- Fast backlink lookup
```

---

## Learning Resources

**Official Documentation**:
- [Obsidian Internal Links](https://help.obsidian.md/Linking+notes+and+files/Internal+links) - Wikilink syntax guide
- [MediaWiki Links](https://en.wikipedia.org/wiki/Help:Link) - Original wikilink standard
- [Obsidian Graph View](https://help.obsidian.md/Plugins/Graph+view) - Visualizing wikilinks

**Tutorials**:
- [Linking Your Thinking](https://www.linkingyourthinking.com/) - Wikilink-based knowledge management methodology
- [Obsidian Linking Guide](https://www.youtube.com/obsidian-linking) - Video tutorial

**Best Practices**:
- [Zettelkasten Linking Patterns](https://zettelkasten.de/posts/overview/) - Effective link strategies
- [Obsidian MOC Pattern](https://forum.obsidian.md/t/maps-of-content) - Using wikilinks for structure

**Community**:
- [Obsidian Forum - Linking](https://forum.obsidian.md/c/knowledge-management/linking) - Community discussions
- [Obsidian Discord - Graph](https://discord.gg/obsidian) - Real-time help

---

## Monitoring & Troubleshooting

**Health Checks**:
```bash
# Find broken wikilinks (links to non-existent notes)
python scripts/check_broken_links.py /vault
# Expected: ✓ 0 broken links

# Identify orphan nodes (no incoming or outgoing wikilinks)
python scripts/find_orphans.py /vault
# Expected: <5% orphan rate

# Validate wikilink syntax across vault
grep -rn "\[\[[^\]]*\]\]" /vault | grep -v "\[\[[^\]|]*\(|[^\]]*\)\?\]\]"
# Expected: No matches (all links syntactically valid)

# Count bidirectional links (strong graph connectivity)
python scripts/count_bidirectional_links.py /vault
# Expected: >70% of links are bidirectional
```

**Common Issues**:

1. **Issue**: Broken wikilink (target note doesn't exist)
   **Solution**: Create target note or fix link
   ```bash
   # Find all references to broken link
   grep -r "\[\[missing-note\]\]" /vault

   # Create stub note
   echo "# Missing Note\n\nPlaceholder" > /vault/missing-note.md
   ```

2. **Issue**: Ambiguous wikilink (multiple notes with same title)
   **Solution**: Use relative path or rename conflicting notes
   ```markdown
   # ❌ AMBIGUOUS (two notes named "overview.md")
   [[overview]]

   # ✅ RESOLVED (use relative path)
   [[architecture/overview]]
   [[features/overview]]
   ```

3. **Issue**: Wikilink not clickable in Obsidian (malformed syntax)
   **Solution**: Check for typos (extra brackets, missing closing bracket)
   ```markdown
   # ❌ WRONG
   [[[note]]]        # Triple brackets
   [[note]           # Missing closing bracket
   [[note|]]         # Empty alias

   # ✅ CORRECT
   [[note]]
   [[note|alias]]
   ```

4. **Issue**: Backlinks not showing in Obsidian
   **Solution**: Ensure linked note exists and sync is complete
   ```bash
   # Check if target note exists
   find /vault -name "target-note.md"

   # Trigger Obsidian cache rebuild
   # In Obsidian: Cmd+P → "Rebuild graph"
   ```

---

## Related Nodes

**Architecture**:
- [[../architecture/knowledge-graph-schema]] - Defines wikilink relationship types
- [[../architecture/obsidian-vault]] - Storage layer using wikilinks
- [[../architecture/mcp-server]] - Parses wikilinks for graph queries

**Features**:
- [[../features/auto-linking]] - Agent rules create wikilinks automatically
- [[../features/graph-visualization]] - Renders wikilinks in Obsidian graph view
- [[../features/collaborative-editing]] - Wikilinks remain valid across users

**Decisions**:
- [[../decisions/technical/link-syntax-standard]] - Why wikilinks over Markdown links
- [[../decisions/technical/obsidian-first-architecture]] - Native Obsidian support requirement

**Other Primitives**:
- [[obsidian]] - Platform that natively supports wikilinks
- [[yaml-frontmatter]] - Stores wikilinks in structured arrays
- [[python]] - Language used to parse wikilinks (regex)

---

## Revisit Criteria

**Reconsider this technology if**:
- Obsidian drops wikilink support (unlikely - core feature)
- Need to migrate vault to non-Obsidian system (GitHub Wiki, Notion, etc.)
- Wikilink ambiguity causes >5% broken links (add unique ID system)
- External Markdown rendering becomes requirement (add dual syntax: wikilinks + hidden Markdown links)

**Scheduled Review**: Only if Obsidian changes link architecture (monitor release notes)

---

**Back to**: [[README|Technical Primitives Index]]
