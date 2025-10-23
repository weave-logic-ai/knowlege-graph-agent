---
type: technical-primitive
category: library
status: in-use
first_used_phase: "PHASE-5"
mvp_required: true
future_only: false
maturity: mature

# Integration tracking
used_in_services:
  - mcp-server
  - file-watcher
  - agent-orchestration
deployment: python-package

# Relationships
alternatives_considered:
  - "[[ruamel-yaml]]"
  - "[[pyyaml-env-tag]]"
  - "[[json-frontmatter]]"
replaces: null
replaced_by: null

# Documentation
decision: "[[../decisions/technical/yaml-parser-library]]"
architecture: "[[../architecture/metadata-processing-layer]]"

tags:
  - technical
  - library
  - in-use
  - yaml-parser
  - metadata
---

# PyYAML

**Category**: Library
**Status**: In Use (MVP)
**First Used**: Phase 5, Day 2 (Week 1)

---

## Overview

PyYAML is a mature Python library for parsing and emitting YAML (YAML Ain't Markup Language) data structures. It provides a pure-Python YAML parser with full YAML 1.1 specification support, enabling reading and writing of YAML frontmatter in markdown files.

**Official Site**: https://pyyaml.org/
**Documentation**: https://pyyaml.org/wiki/PyYAMLDocumentation

---

## Why We Use It

Enables Weave-NN's MCP server to parse YAML frontmatter from Obsidian markdown files, extracting metadata for agent rules and automation:
- **Frontmatter Parsing**: Extract structured metadata (type, status, tags) from markdown files
- **Agent Rule Configuration**: Read agent rule definitions from YAML frontmatter
- **Schema Validation**: Validate frontmatter structure against expected schemas
- **Metadata Queries**: Filter notes by frontmatter attributes for agent decision-making

**Primary Purpose**: MCP server reads YAML frontmatter for metadata-driven agent rules

**Specific Use Cases**:
- Parse frontmatter from Obsidian notes in [[../architecture/mcp-server]]
- Extract agent rule configurations (when, conditions, actions)
- Validate frontmatter schema for technical primitives, features, decisions
- Query notes by metadata attributes (type, status, tags)

---

## Key Capabilities

- **YAML 1.1 Support**: Full specification compliance for complex data structures
- **Safe Loading**: `yaml.safe_load()` prevents code execution vulnerabilities
- **Frontmatter Extraction**: Parse YAML between `---` delimiters in markdown
- **Schema Validation**: Validate YAML structure against expected formats
- **Unicode Support**: Handle international characters in metadata
- **Custom Constructors**: Extend parser for domain-specific types
- **Error Reporting**: Clear error messages for malformed YAML

---

## Integration Points

**Used By**:
- [[../architecture/mcp-server]] - Parses frontmatter from all vault notes
- [[../architecture/agent-orchestration]] - Reads agent rule configurations
- [[../architecture/file-watcher]] - Extracts metadata for event routing

**Integrates With**:
- [[obsidian-local-rest-api-plugin]] - Reads markdown files containing YAML frontmatter
- [[claude-flow]] - Agent rules defined in YAML frontmatter
- [[fastapi]] - MCP server processes YAML for API responses

**Enables Features**:
- [[../features/agent-driven-task-automation]] - Rules configured via YAML
- [[../features/auto-tagging]] - Tag rules in YAML frontmatter
- [[../features/decision-tracking]] - Decision metadata in YAML

---

## Configuration

**Python Installation** (MVP):
```bash
# Install via pip
pip install pyyaml

# Or add to requirements.txt
echo "pyyaml==6.0.1" >> requirements.txt
pip install -r requirements.txt
```

**Docker Configuration**:
```dockerfile
# Dockerfile for MCP server
FROM python:3.11-slim

RUN pip install pyyaml==6.0.1

COPY . /app
WORKDIR /app
```

**No Configuration Files**: PyYAML is a library, no configuration needed

---

## Deployment

**MVP (Phase 5-6)**: Python package installed in MCP server Docker container
**v1.0 (Post-MVP)**: Same deployment (library dependency)

**Resource Requirements**:
- RAM: <10 MB (parsing overhead)
- CPU: Negligible (YAML parsing is fast)
- Storage: <1 MB (package size)

**Health Check**:
```python
# Verify PyYAML is importable
import yaml
print(yaml.__version__)  # Should print: 6.0.1
```

---

## Trade-offs

**Pros** (Why we chose it):
- ✅ **Mature & Stable**: 15+ years of development, well-tested
- ✅ **Standard Library**: De facto YAML parser in Python ecosystem
- ✅ **Safe Loading**: Built-in protection against code execution
- ✅ **Full YAML Support**: Handles complex nested structures
- ✅ **Good Error Messages**: Clear parsing error reporting
- ✅ **No Dependencies**: Pure Python, no external libs

**Cons** (What we accepted):
- ⚠️ **YAML 1.1 Only**: Not YAML 1.2 spec (minor differences) - acceptable because YAML 1.1 sufficient for frontmatter
- ⚠️ **Performance**: Slower than C-based parsers like LibYAML - acceptable because frontmatter files are small (<10 KB)
- ⚠️ **No Comment Preservation**: Loses YAML comments on round-trip - acceptable because only reading, not writing

---

## Alternatives Considered

**Compared With**:

### [[ruamel-yaml]]
- **Pros**: YAML 1.2 support, preserves comments, round-trip editing
- **Cons**: More complex API, heavier dependency, slower for simple parsing
- **Decision**: Rejected because PyYAML sufficient for read-only frontmatter parsing

### [[pyyaml-env-tag]]
- **Pros**: Environment variable substitution in YAML
- **Cons**: Requires custom extension, not needed for frontmatter
- **Decision**: Rejected because no environment variables in Obsidian frontmatter

### [[json-frontmatter]]
- **Pros**: JSON is simpler than YAML, no parser needed
- **Cons**: Less human-readable, Obsidian uses YAML by default, not standard
- **Decision**: Rejected because Obsidian ecosystem standardizes on YAML frontmatter

---

## Decision History

**Decision Record**: [[../decisions/technical/yaml-parser-library]]

**Key Reasoning**:
> PyYAML was chosen for Phase 5 Day 2 because it's the standard Python library for YAML parsing, provides safe loading to prevent code execution, and is mature enough to handle all Obsidian frontmatter use cases. The library's simplicity and stability outweigh the minor performance cost compared to C-based parsers like LibYAML.

**Date Decided**: 2025-10-21
**Decided By**: System Architect

---

## Phase Usage

### Phase 5 (MVP Week 1) - In Use
**Day 2**: PyYAML integrated into MCP server for frontmatter parsing
- Parse YAML frontmatter from all vault markdown files
- Extract metadata (type, status, tags) for agent rules
- Validate frontmatter schema for technical primitives
- Query notes by frontmatter attributes

**Day 4**: Enhanced usage for agent rule configurations
- Parse agent rule definitions from YAML frontmatter
- Extract `when`, `conditions`, `actions` for automation
- Validate rule schemas before execution

### Phase 6 (MVP Week 2) - Enhanced Usage
- Schema validation for all frontmatter types (features, decisions, architecture)
- Advanced queries combining frontmatter + full-text search
- Error handling for malformed YAML in vault notes
- Performance optimization for large vault parsing

### Phase 7 (v1.0) - Future Enhancement
- Caching layer to avoid re-parsing unchanged files
- Custom YAML constructors for domain-specific types
- Migration to YAML 1.2 if needed (via ruamel.yaml)
- Streaming parser for very large vaults

---

## Learning Resources

**Official Documentation**:
- [PyYAML Documentation](https://pyyaml.org/wiki/PyYAMLDocumentation)
- [YAML 1.1 Specification](https://yaml.org/spec/1.1/)
- [API Reference](https://pyyaml.org/wiki/PyYAMLDocumentation#reference)

**Tutorials**:
- [Python YAML Tutorial](https://realpython.com/python-yaml/)
- [Safe Loading Best Practices](https://pyyaml.org/wiki/PyYAMLDocumentation#loading-yaml)
- [Frontmatter Parsing Guide](https://stackoverflow.com/questions/tagged/pyyaml+frontmatter)

**Best Practices**:
- [Security Best Practices](https://pyyaml.org/wiki/PyYAMLDocumentation#security)
- [Error Handling Guide](https://pyyaml.org/wiki/PyYAMLDocumentation#exceptions)

**Community**:
- [GitHub Repository](https://github.com/yaml/pyyaml)
- [Stack Overflow Tag](https://stackoverflow.com/questions/tagged/pyyaml)

---

## Monitoring & Troubleshooting

**Health Checks**:
```python
# Test PyYAML installation
import yaml

# Test safe loading
test_yaml = """
name: test
value: 123
tags: [a, b, c]
"""
data = yaml.safe_load(test_yaml)
assert data["name"] == "test"
assert data["value"] == 123
assert data["tags"] == ["a", "b", "c"]
print("PyYAML working correctly")
```

**Common Issues**:
1. **Issue**: `yaml.scanner.ScannerError: mapping values are not allowed here`
   **Solution**: Check for unquoted colons in YAML values, use quotes: `key: "value: with colon"`

2. **Issue**: `yaml.parser.ParserError: expected '<document start>'`
   **Solution**: Verify frontmatter delimiters are exactly `---` (three dashes), not more/less

3. **Issue**: `yaml.constructor.ConstructorError: could not determine a constructor`
   **Solution**: Use `yaml.safe_load()` instead of `yaml.load()` for security

4. **Issue**: Unicode decoding error
   **Solution**: Open file with `encoding='utf-8'`: `open(file, 'r', encoding='utf-8')`

---

## Code Examples

### Basic Frontmatter Parsing
```python
# mcp_server/utils/frontmatter.py
import yaml
import re

def parse_frontmatter(markdown_content: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and remaining content from markdown.

    Returns:
        (frontmatter_dict, markdown_body)
    """
    # Match YAML frontmatter between --- delimiters
    pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
    match = re.match(pattern, markdown_content, re.DOTALL)

    if not match:
        return {}, markdown_content

    yaml_text = match.group(1)
    body = match.group(2)

    try:
        frontmatter = yaml.safe_load(yaml_text)
        return frontmatter or {}, body
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML frontmatter: {e}")

# Usage
content = """---
type: technical-primitive
category: library
status: in-use
tags:
  - python
  - yaml
---

# PyYAML

This is the content body.
"""

frontmatter, body = parse_frontmatter(content)
print(frontmatter)
# Output: {'type': 'technical-primitive', 'category': 'library', 'status': 'in-use', 'tags': ['python', 'yaml']}
```

### Schema Validation
```python
# mcp_server/utils/validators.py
import yaml
from typing import Any

TECHNICAL_PRIMITIVE_SCHEMA = {
    "required_fields": ["type", "category", "status"],
    "valid_categories": ["language", "framework", "library", "service", "protocol", "standard", "tool", "platform"],
    "valid_statuses": ["planned", "in-use", "deprecated", "evaluated-rejected"]
}

def validate_technical_primitive(frontmatter: dict) -> list[str]:
    """Validate technical primitive frontmatter schema.

    Returns:
        List of validation errors (empty if valid)
    """
    errors = []

    # Check required fields
    for field in TECHNICAL_PRIMITIVE_SCHEMA["required_fields"]:
        if field not in frontmatter:
            errors.append(f"Missing required field: {field}")

    # Validate category
    if "category" in frontmatter:
        if frontmatter["category"] not in TECHNICAL_PRIMITIVE_SCHEMA["valid_categories"]:
            errors.append(f"Invalid category: {frontmatter['category']}")

    # Validate status
    if "status" in frontmatter:
        if frontmatter["status"] not in TECHNICAL_PRIMITIVE_SCHEMA["valid_statuses"]:
            errors.append(f"Invalid status: {frontmatter['status']}")

    return errors

# Usage
frontmatter = {
    "type": "technical-primitive",
    "category": "library",
    "status": "in-use"
}

errors = validate_technical_primitive(frontmatter)
if errors:
    print("Validation errors:", errors)
else:
    print("Valid frontmatter")
```

### Agent Rule Parsing
```python
# mcp_server/rules/parser.py
import yaml

def parse_agent_rule(frontmatter: dict) -> dict:
    """Parse agent rule configuration from frontmatter.

    Expected structure:
    agent_rule:
      when: file_created
      conditions:
        - path_matches: "daily/*.md"
        - type: "daily-log"
      actions:
        - create_tasks_summary
        - link_related_notes
    """
    if "agent_rule" not in frontmatter:
        return None

    rule = frontmatter["agent_rule"]

    # Validate rule structure
    if "when" not in rule:
        raise ValueError("Agent rule missing 'when' trigger")
    if "actions" not in rule:
        raise ValueError("Agent rule missing 'actions' list")

    return {
        "trigger": rule["when"],
        "conditions": rule.get("conditions", []),
        "actions": rule["actions"]
    }

# Usage
frontmatter = {
    "type": "feature",
    "agent_rule": {
        "when": "file_created",
        "conditions": [
            {"path_matches": "daily/*.md"},
            {"type": "daily-log"}
        ],
        "actions": [
            "create_tasks_summary",
            "link_related_notes"
        ]
    }
}

rule = parse_agent_rule(frontmatter)
print(rule)
# Output: {'trigger': 'file_created', 'conditions': [...], 'actions': [...]}
```

### MCP Tool Integration
```python
# mcp_server/tools/metadata_tools.py
from mcp.server import Server
from obsidian_client import ObsidianClient
from utils.frontmatter import parse_frontmatter

@mcp_server.tool()
async def get_note_metadata(path: str) -> dict:
    """Get frontmatter metadata from a note."""
    client = ObsidianClient()
    content = client.read_note(path)

    frontmatter, _ = parse_frontmatter(content)
    return frontmatter

@mcp_server.tool()
async def query_notes_by_metadata(
    filter_type: str = None,
    filter_status: str = None,
    filter_tags: list[str] = None
) -> list[dict]:
    """Query vault notes by frontmatter metadata."""
    client = ObsidianClient()
    files = client.list_files()

    results = []
    for file_path in files:
        if not file_path.endswith(".md"):
            continue

        content = client.read_note(file_path)
        frontmatter, _ = parse_frontmatter(content)

        # Filter by type
        if filter_type and frontmatter.get("type") != filter_type:
            continue

        # Filter by status
        if filter_status and frontmatter.get("status") != filter_status:
            continue

        # Filter by tags
        if filter_tags:
            note_tags = frontmatter.get("tags", [])
            if not any(tag in note_tags for tag in filter_tags):
                continue

        results.append({
            "path": file_path,
            "frontmatter": frontmatter
        })

    return results
```

---

## Related Nodes

**Architecture**:
- [[../architecture/mcp-server]] - Uses PyYAML for frontmatter parsing
- [[../architecture/metadata-processing-layer]] - Defines metadata schema

**Features**:
- [[../features/agent-driven-task-automation]] - Agent rules in YAML
- [[../features/auto-tagging]] - Tag rules configured via YAML
- [[../features/decision-tracking]] - Decision metadata in frontmatter

**Decisions**:
- [[../decisions/technical/yaml-parser-library]] - Why PyYAML

**Other Primitives**:
- [[obsidian-local-rest-api-plugin]] - Reads files containing YAML
- [[claude-flow]] - Agent rules defined in YAML
- [[fastapi]] - MCP server processes parsed YAML

---

## Revisit Criteria

**Reconsider this technology if**:
- YAML 1.2 features become required (would need ruamel.yaml)
- Performance degrades with large vaults (>10k files) - would need C-based parser
- Security vulnerabilities discovered in PyYAML (would need patches or alternatives)
- Alternative parser emerges with better error messages/performance

**Scheduled Review**: 2026-04-01 (6 months after v1.0 launch)

---

**Back to**: [[README|Technical Primitives Index]]
