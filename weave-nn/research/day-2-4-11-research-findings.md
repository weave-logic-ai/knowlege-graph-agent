---
visual:
  icon: 🔬
icon: 🔬
---
# Research Findings: Obsidian REST API, Agent Rules & Visualization

**Research Agent**: Comprehensive Research for Phase 5 MVP Development
**Date**: 2025-10-22
**Session**: swarm-1761105846852-b3sb90gqc
**Tasks**: Day 2 (Obsidian REST API), Day 4 (Agent Rules), Day 11 (Properties & Visualization)

---

## Executive Summary

This research report covers three critical implementation areas for the Weave-NN MVP:

1. **Day 2 - Obsidian REST API Client**: Implementation patterns for Python MCP server to interact with Obsidian vault via REST API
2. **Day 4 - Agent Rule Implementation**: Design patterns for 6 core agent rules managing knowledge graph automation
3. **Day 11 - Obsidian Properties & Visualization**: Property system integration and graph visualization enhancement

**Key Finding**: The project has excellent architectural foundation with clear separation of concerns (Obsidian frontend, Python MCP backend, Claude-Flow orchestration). All three areas are well-documented and ready for implementation.

---

## PART 1: Day 2 - Obsidian REST API Client

### Overview

**Purpose**: Build Python MCP server with REST API client to enable AI agents to perform CRUD operations on Obsidian vault.

**Reference Architecture**: `/home/aepod/dev/weave-nn/weave-nn/architecture/obsidian-native-integration-analysis.md`

### Tech Stack Analysis

**Current Stack** (from requirements.txt):
```python
# Core Framework
fastapi>=0.115.0          # Modern async Python web framework
uvicorn[standard]>=0.32.0 # ASGI server with WebSocket support
pydantic>=2.0.0           # Data validation using Python type hints

# MCP Protocol
mcp>=1.18.0               # Model Context Protocol SDK

# Message Queue
pika>=1.3.2               # RabbitMQ client for event-driven architecture

# Utilities
requests>=2.31.0          # HTTP client for REST API calls
pyyaml>=6.0.1             # YAML parsing for frontmatter
watchdog>=3.0.0           # File system monitoring
gitpython>=3.1.40         # Git operations
python-dotenv>=1.0.0      # Environment variable management

# Testing
pytest>=7.4.0
pytest-asyncio>=0.21.0
```

**Architecture Pattern**:
- Obsidian Desktop (Electron UI) → Markdown Files (Git-tracked) → Python MCP Server (FastAPI) → Claude-Flow Agents

### Obsidian REST API Integration

#### Plugin: obsidian-local-rest-api

**Installation**:
```bash
# Install from Obsidian Community Plugins
# Settings → Community Plugins → Browse → "Local REST API"
# Generate API key after installation
# Default endpoint: https://localhost:27124
```

**Authentication**:
- Bearer token authentication
- API key stored in `.env` file
- HTTPS required (self-signed certificate)

#### Core CRUD Operations

**1. Create Note**
```python
POST /vault/{path}
Headers: Authorization: Bearer {api_key}
Body: {
    "content": "# Note Title\n\nContent here",
    "frontmatter": {
        "type": "concept",
        "created_date": "2025-10-22",
        "tags": ["concept", "research"]
    }
}
```

**2. Read Note**
```python
GET /vault/{path}
Headers: Authorization: Bearer {api_key}
Response: {
    "content": "...",
    "frontmatter": {...},
    "stat": {"mtime": 1234567890}
}
```

**3. Update Note**
```python
PUT /vault/{path}
Headers: Authorization: Bearer {api_key}
Body: {"content": "updated content"}
```

**4. Delete Note**
```python
DELETE /vault/{path}
Headers: Authorization: Bearer {api_key}
```

**5. List Notes**
```python
GET /vault/
Query params: pattern=concepts/*.md
Response: ["concepts/knowledge-graph.md", "concepts/temporal-queries.md"]
```

**6. Patch Section**
```python
PATCH /vault/{path}
Body: {
    "heading": "## Related",
    "content": "- [[new-link]]"
}
```

### Implementation Pattern

**Recommended Client Structure**:
```python
# utils/obsidian_client.py
import requests
from typing import Optional, Dict, List
import os
import yaml

class ObsidianRESTClient:
    def __init__(self, api_url: str, api_key: str):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })
        # Disable SSL verification for localhost self-signed cert
        self.session.verify = False

    def create_note(self, path: str, content: str,
                   frontmatter: Optional[Dict] = None) -> Dict:
        """Create new note with YAML frontmatter"""
        if frontmatter:
            yaml_front = yaml.dump(frontmatter, default_flow_style=False)
            full_content = f"---\n{yaml_front}---\n\n{content}"
        else:
            full_content = content

        response = self.session.post(
            f"{self.api_url}/vault/{path}",
            json={"content": full_content}
        )
        response.raise_for_status()
        return response.json()

    def read_note(self, path: str) -> Dict:
        """Read note content and frontmatter"""
        response = self.session.get(f"{self.api_url}/vault/{path}")
        response.raise_for_status()
        data = response.json()

        # Parse frontmatter if present
        content = data['content']
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                frontmatter = yaml.safe_load(parts[1])
                body = parts[2].strip()
                return {
                    'frontmatter': frontmatter,
                    'content': body,
                    'raw': content,
                    'stat': data.get('stat', {})
                }

        return {
            'frontmatter': {},
            'content': content,
            'raw': content,
            'stat': data.get('stat', {})
        }

    def update_note(self, path: str, content: str,
                   frontmatter: Optional[Dict] = None) -> Dict:
        """Update existing note"""
        if frontmatter:
            yaml_front = yaml.dump(frontmatter, default_flow_style=False)
            full_content = f"---\n{yaml_front}---\n\n{content}"
        else:
            full_content = content

        response = self.session.put(
            f"{self.api_url}/vault/{path}",
            json={"content": full_content}
        )
        response.raise_for_status()
        return response.json()

    def delete_note(self, path: str) -> Dict:
        """Delete note from vault"""
        response = self.session.delete(f"{self.api_url}/vault/{path}")
        response.raise_for_status()
        return {"status": "deleted", "path": path}

    def list_notes(self, pattern: Optional[str] = None) -> List[str]:
        """List all notes matching pattern"""
        params = {"pattern": pattern} if pattern else {}
        response = self.session.get(f"{self.api_url}/vault/", params=params)
        response.raise_for_status()
        return response.json()

    def patch_note_section(self, path: str, heading: str,
                          content: str) -> Dict:
        """Update specific section under heading"""
        response = self.session.patch(
            f"{self.api_url}/vault/{path}",
            json={"heading": heading, "content": content}
        )
        response.raise_for_status()
        return response.json()

    def search(self, query: str) -> List[Dict]:
        """Full-text search across vault"""
        response = self.session.get(
            f"{self.api_url}/search/",
            params={"query": query}
        )
        response.raise_for_status()
        return response.json()
```

### Error Handling Patterns

```python
from requests.exceptions import RequestException, HTTPError
import time

class ObsidianAPIError(Exception):
    """Custom exception for Obsidian API errors"""
    pass

def with_retry(max_retries: int = 3, backoff: float = 1.0):
    """Decorator for automatic retry with exponential backoff"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (RequestException, HTTPError) as e:
                    if attempt == max_retries - 1:
                        raise ObsidianAPIError(f"Failed after {max_retries} attempts: {e}")
                    wait_time = backoff * (2 ** attempt)
                    time.sleep(wait_time)
            return None
        return wrapper
    return decorator

# Usage
@with_retry(max_retries=3, backoff=1.0)
def create_note_with_retry(client, path, content, frontmatter):
    return client.create_note(path, content, frontmatter)
```

### FastAPI MCP Server Integration

```python
# server.py
from fastapi import FastAPI, HTTPException
from utils.obsidian_client import ObsidianRESTClient
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Weave-NN MCP Server")

obsidian = ObsidianRESTClient(
    api_url=os.getenv("OBSIDIAN_API_URL", "https://localhost:27124"),
    api_key=os.getenv("OBSIDIAN_API_KEY")
)

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "weave-nn-mcp"}

@app.post("/mcp/create_note")
def mcp_create_note(path: str, content: str, frontmatter: dict = None):
    """MCP tool: Create note in Obsidian vault"""
    try:
        result = obsidian.create_note(path, content, frontmatter)
        return {"success": True, "path": path, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mcp/read_note")
def mcp_read_note(path: str):
    """MCP tool: Read note from Obsidian vault"""
    try:
        result = obsidian.read_note(path)
        return {"success": True, "path": path, "data": result}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.put("/mcp/update_note")
def mcp_update_note(path: str, content: str, frontmatter: dict = None):
    """MCP tool: Update note in Obsidian vault"""
    try:
        result = obsidian.update_note(path, content, frontmatter)
        return {"success": True, "path": path, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/mcp/delete_note")
def mcp_delete_note(path: str):
    """MCP tool: Delete note from Obsidian vault"""
    try:
        result = obsidian.delete_note(path)
        return {"success": True, "path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mcp/list_notes")
def mcp_list_notes(pattern: str = None):
    """MCP tool: List notes in vault"""
    try:
        result = obsidian.list_notes(pattern)
        return {"success": True, "count": len(result), "notes": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/mcp/search")
def mcp_search(query: str):
    """MCP tool: Full-text search"""
    try:
        result = obsidian.search(query)
        return {"success": True, "count": len(result), "results": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Testing Strategy

```python
# tests/test_obsidian_client.py
import pytest
from utils.obsidian_client import ObsidianRESTClient
import os

@pytest.fixture
def client():
    """Create test client"""
    return ObsidianRESTClient(
        api_url=os.getenv("OBSIDIAN_API_URL"),
        api_key=os.getenv("OBSIDIAN_API_KEY")
    )

def test_create_note(client):
    """Test note creation with frontmatter"""
    path = "test/test-note.md"
    content = "This is a test note"
    frontmatter = {
        "type": "test",
        "created_date": "2025-10-22",
        "tags": ["test", "automated"]
    }

    result = client.create_note(path, content, frontmatter)
    assert result is not None

    # Verify note was created
    read_result = client.read_note(path)
    assert read_result['frontmatter']['type'] == 'test'
    assert 'test note' in read_result['content']

    # Cleanup
    client.delete_note(path)

def test_update_note(client):
    """Test note update"""
    path = "test/update-test.md"

    # Create initial note
    client.create_note(path, "Original content")

    # Update content
    client.update_note(path, "Updated content")

    # Verify update
    result = client.read_note(path)
    assert "Updated content" in result['content']

    # Cleanup
    client.delete_note(path)

def test_list_notes(client):
    """Test note listing with pattern"""
    result = client.list_notes(pattern="concepts/*.md")
    assert isinstance(result, list)
    assert len(result) > 0
```

### Environment Configuration

```bash
# .env file
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=your-api-key-here
RABBITMQ_URL=amqp://admin:password@localhost:5672
CLAUDE_API_KEY=your-claude-key-here
```

### Performance Considerations

1. **Connection Pooling**: Use `requests.Session()` for connection reuse
2. **Rate Limiting**: Obsidian plugin has no explicit rate limits, but be mindful
3. **Caching**: Implement caching for frequently read notes (use TTL)
4. **Async Operations**: Consider using `httpx` for true async if needed
5. **Batch Operations**: Group multiple file operations when possible

### Alternative: Fallback to File System

If REST API is unavailable:
```python
import os
import yaml

class ObsidianFileClient:
    def __init__(self, vault_path: str):
        self.vault_path = vault_path

    def create_note(self, path: str, content: str, frontmatter: dict = None):
        """Direct file system write"""
        full_path = os.path.join(self.vault_path, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        if frontmatter:
            yaml_front = yaml.dump(frontmatter, default_flow_style=False)
            full_content = f"---\n{yaml_front}---\n\n{content}"
        else:
            full_content = content

        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(full_content)

        return {"path": full_path}

    def read_note(self, path: str) -> dict:
        """Direct file system read"""
        full_path = os.path.join(self.vault_path, path)

        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Parse frontmatter
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                frontmatter = yaml.safe_load(parts[1])
                body = parts[2].strip()
                return {
                    'frontmatter': frontmatter,
                    'content': body,
                    'raw': content
                }

        return {'frontmatter': {}, 'content': content, 'raw': content}
```

### Recommendations

1. **Primary**: Use REST API for production (better isolation, safer)
2. **Fallback**: File system access for development/testing
3. **Validation**: Always validate YAML frontmatter before writing
4. **Error Handling**: Implement comprehensive error handling with retries
5. **Testing**: Create isolated test vault for integration tests
6. **Documentation**: Document all API endpoints in OpenAPI/Swagger format

---

## PART 2: Day 4 - Agent Rule Implementation

### Overview

**Purpose**: Implement 6 core agent rules that enable AI-managed knowledge graph maintenance with full Claude-Flow integration.

**Reference**: `/home/aepod/dev/weave-nn/weave-nn/mcp/agent-rules.md`

### Agent Rules Architecture

**6 Core Rules**:
1. **memory_sync** - Bidirectional sync (Obsidian ↔ Claude-Flow)
2. **node_creation** - Auto-create nodes from agent intents
3. **update_propagation** - Propagate changes to related nodes
4. **schema_validation** - Validate YAML frontmatter
5. **auto_linking** - Suggest wikilinks based on content
6. **auto_tagging** - Suggest tags based on content

### Rule Execution Framework

```python
# agents/rule_engine.py
from typing import Dict, List, Callable, Optional
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class RulePriority(Enum):
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4

class RuleStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

class AgentRule:
    """Base class for all agent rules"""

    def __init__(self, rule_id: str, priority: RulePriority):
        self.rule_id = rule_id
        self.priority = priority
        self.enabled = True
        self.status = RuleStatus.PENDING

    def should_trigger(self, event: Dict) -> bool:
        """Determine if rule should trigger for given event"""
        raise NotImplementedError

    def execute(self, context: Dict) -> Dict:
        """Execute the rule logic"""
        raise NotImplementedError

    def validate(self, result: Dict) -> bool:
        """Validate rule execution result"""
        return result.get('success', False)

class RuleEngine:
    """Orchestrates execution of agent rules"""

    def __init__(self):
        self.rules: Dict[str, AgentRule] = {}
        self.execution_queue: List[tuple] = []
        self.file_locks: Dict[str, bool] = {}

    def register_rule(self, rule: AgentRule):
        """Register new rule"""
        self.rules[rule.rule_id] = rule
        logger.info(f"Registered rule: {rule.rule_id}")

    def trigger_event(self, event_type: str, event_data: Dict):
        """Process event and trigger matching rules"""
        logger.info(f"Processing event: {event_type}")

        # Find rules that should trigger
        triggered_rules = []
        for rule_id, rule in self.rules.items():
            if rule.enabled and rule.should_trigger({'type': event_type, **event_data}):
                triggered_rules.append(rule)

        # Sort by priority
        triggered_rules.sort(key=lambda r: r.priority.value)

        # Execute rules in priority order
        results = []
        for rule in triggered_rules:
            # Check file lock
            file_path = event_data.get('file_path')
            if file_path and self.file_locks.get(file_path):
                logger.warning(f"File locked, skipping rule {rule.rule_id}")
                continue

            # Lock file
            if file_path:
                self.file_locks[file_path] = True

            try:
                rule.status = RuleStatus.RUNNING
                result = rule.execute({'event_type': event_type, **event_data})

                if rule.validate(result):
                    rule.status = RuleStatus.COMPLETED
                    results.append({'rule_id': rule.rule_id, 'status': 'success', 'result': result})
                else:
                    rule.status = RuleStatus.FAILED
                    results.append({'rule_id': rule.rule_id, 'status': 'failed', 'result': result})

            except Exception as e:
                logger.error(f"Rule {rule.rule_id} failed: {e}")
                rule.status = RuleStatus.FAILED
                results.append({'rule_id': rule.rule_id, 'status': 'error', 'error': str(e)})

            finally:
                # Release file lock
                if file_path:
                    self.file_locks[file_path] = False

        return results
```

### Rule 1: Memory Sync

```python
# agents/rules/memory_sync.py
from agents.rule_engine import AgentRule, RulePriority
import json
import logging

logger = logging.getLogger(__name__)

class MemorySyncRule(AgentRule):
    """Bidirectional sync between Claude-Flow memory and Obsidian nodes"""

    def __init__(self, obsidian_client, claude_flow_client):
        super().__init__("memory_sync", RulePriority.CRITICAL)
        self.obsidian = obsidian_client
        self.claude_flow = claude_flow_client

    def should_trigger(self, event: Dict) -> bool:
        """Trigger on memory or file changes"""
        triggers = [
            'claude_flow.memory.created',
            'claude_flow.memory.updated',
            'weave_nn.file.created',
            'weave_nn.file.modified'
        ]
        return event['type'] in triggers

    def execute(self, context: Dict) -> Dict:
        """Execute bidirectional sync"""
        event_type = context['event_type']

        if event_type.startswith('claude_flow.memory'):
            return self._sync_memory_to_node(context)
        elif event_type.startswith('weave_nn.file'):
            return self._sync_node_to_memory(context)

    def _sync_memory_to_node(self, context: Dict) -> Dict:
        """Sync Claude-Flow memory → Obsidian node"""
        memory = context.get('memory', {})

        # Determine folder from namespace
        namespace = memory.get('namespace', 'misc')
        folder = self._namespace_to_folder(namespace)

        # Parse memory value
        value = json.loads(memory.get('value', '{}'))

        # Generate frontmatter
        frontmatter = {
            'type': namespace,
            'created_date': memory.get('created_at', '2025-10-22'),
            'tags': memory.get('tags', [namespace])
        }

        # Convert relationships to wikilinks
        content = value.get('content', '')
        for rel in value.get('relationships', []):
            target_key = rel.get('target_key')
            if target_key:
                content += f"\n\n[[{target_key}]]"

        # Write file
        file_path = f"{folder}/{memory['key']}.md"
        result = self.obsidian.create_note(file_path, content, frontmatter)

        logger.info(f"Synced memory {memory['id']} → node {file_path}")

        return {
            'success': True,
            'direction': 'memory_to_node',
            'file_path': file_path,
            'memory_id': memory.get('id')
        }

    def _sync_node_to_memory(self, context: Dict) -> Dict:
        """Sync Obsidian node → Claude-Flow memory"""
        file_path = context.get('file_path')

        # Read note
        note = self.obsidian.read_note(file_path)

        # Extract frontmatter
        frontmatter = note.get('frontmatter', {})

        # Extract wikilinks from content
        content = note.get('content', '')
        wikilinks = self._extract_wikilinks(content)

        # Convert to relationships
        relationships = [
            {'type': 'links_to', 'target_key': link}
            for link in wikilinks
        ]

        # Determine namespace from folder
        namespace = self._folder_to_namespace(file_path)

        # Build memory value
        memory_value = {
            'content': content,
            'frontmatter': frontmatter,
            'relationships': relationships
        }

        # Store in Claude-Flow
        key = file_path.replace('.md', '').replace('/', '-')
        result = self.claude_flow.store_memory(
            key=key,
            namespace=namespace,
            value=json.dumps(memory_value),
            tags=frontmatter.get('tags', [])
        )

        logger.info(f"Synced node {file_path} → memory {key}")

        return {
            'success': True,
            'direction': 'node_to_memory',
            'file_path': file_path,
            'memory_key': key
        }

    def _namespace_to_folder(self, namespace: str) -> str:
        """Map memory namespace to folder"""
        mapping = {
            'concepts': 'concepts',
            'decisions': 'decisions',
            'features': 'features',
            'workflows': 'workflows',
            'platforms': 'platforms',
            'technical': 'technical',
            'questions': 'questions',
            'planning': '_planning'
        }
        return mapping.get(namespace, 'misc')

    def _folder_to_namespace(self, file_path: str) -> str:
        """Extract namespace from file path"""
        folder = file_path.split('/')[0]
        mapping = {
            'concepts': 'concepts',
            'decisions': 'decisions',
            'features': 'features',
            'workflows': 'workflows',
            'platforms': 'platforms',
            'technical': 'technical',
            'questions': 'questions',
            '_planning': 'planning'
        }
        return mapping.get(folder, 'misc')

    def _extract_wikilinks(self, content: str) -> List[str]:
        """Extract [[wikilinks]] from content"""
        import re
        pattern = r'\[\[([^\]]+)\]\]'
        matches = re.findall(pattern, content)
        # Remove display text (e.g., [[link|display]] → link)
        return [m.split('|')[0].strip() for m in matches]
```

### Rule 2: Node Creation

```python
# agents/rules/node_creation.py
from agents.rule_engine import AgentRule, RulePriority
import logging

logger = logging.getLogger(__name__)

class NodeCreationRule(AgentRule):
    """Automatically create well-structured nodes"""

    def __init__(self, obsidian_client, template_engine):
        super().__init__("node_creation", RulePriority.HIGH)
        self.obsidian = obsidian_client
        self.templates = template_engine

    def should_trigger(self, event: Dict) -> bool:
        """Trigger on AI intent or missing wikilink target"""
        triggers = [
            'ai.intent.create_node',
            'claude_flow.memory.created',
            'wikilink.target_missing'
        ]
        return event['type'] in triggers

    def execute(self, context: Dict) -> Dict:
        """Create new node with appropriate template"""
        proposed_key = context.get('proposed_key')
        node_type = context.get('type', 'concept')
        content = context.get('content', '')

        # Check if node already exists
        file_path = f"{node_type}s/{proposed_key}.md"
        try:
            existing = self.obsidian.read_note(file_path)
            return {
                'success': False,
                'reason': 'node_already_exists',
                'file_path': file_path
            }
        except:
            pass  # Node doesn't exist, proceed

        # Load template
        template = self.templates.load(f"{node_type}-node-template.md")

        # Generate ID
        node_id = self._generate_id(node_type)

        # Build frontmatter
        frontmatter = {
            'type': node_type,
            f'{node_type}_id': node_id,
            f'{node_type}_name': proposed_key.replace('-', ' ').title(),
            'status': 'draft',
            'created_date': '2025-10-22',
            'tags': self._suggest_tags(content, node_type)
        }

        # Fill template
        filled_content = template.format(
            id=node_id,
            name=frontmatter[f'{node_type}_name'],
            content=content
        )

        # Find related nodes
        related = self._find_related(content)

        # Add wikilinks
        for rel in related:
            filled_content += f"\n- [[{rel}]]"

        # Create node
        result = self.obsidian.create_note(file_path, filled_content, frontmatter)

        logger.info(f"Created node {file_path} with ID {node_id}")

        return {
            'success': True,
            'file_path': file_path,
            'node_id': node_id,
            'node_type': node_type
        }

    def _generate_id(self, node_type: str) -> str:
        """Generate unique ID for node type"""
        # In production, query database for next ID
        prefix_map = {
            'concept': 'C',
            'platform': 'P',
            'technical': 'T',
            'feature': 'F',
            'decision': 'ED',
            'workflow': 'W',
            'question': 'Q'
        }
        prefix = prefix_map.get(node_type, 'X')
        # Simplified - should query for max ID
        return f"{prefix}-XXX"

    def _suggest_tags(self, content: str, node_type: str) -> List[str]:
        """Suggest tags based on content and type"""
        tags = [node_type]

        # Extract keywords (simplified)
        keywords = ['ai', 'graph', 'obsidian', 'automation']
        for keyword in keywords:
            if keyword.lower() in content.lower():
                tags.append(keyword)

        return tags[:5]  # Limit to 5 tags

    def _find_related(self, content: str) -> List[str]:
        """Find related nodes based on content"""
        # In production, use semantic search
        # Simplified: return empty
        return []
```

### Rule 3-6: Additional Rules

Similar patterns apply for:
- **update_propagation**: Track changes and update related nodes
- **schema_validation**: Validate frontmatter against schemas
- **auto_linking**: Use semantic search to suggest wikilinks
- **auto_tagging**: Use Claude API to suggest relevant tags

### Agent Rules Configuration

```yaml
# config/agent_rules.yaml
rules:
  memory_sync:
    enabled: true
    priority: critical
    triggers:
      - claude_flow.memory.created
      - claude_flow.memory.updated
      - weave_nn.file.created
      - weave_nn.file.modified
    conditions:
      - memory.namespace IN ['concepts', 'decisions', 'features', 'workflows']
      - file.extension == '.md'

  node_creation:
    enabled: true
    priority: high
    triggers:
      - ai.intent.create_node
      - wikilink.target_missing
    validation:
      required_fields: [id, name, type, created_date, tags]
      min_content_length: 50
      min_wikilinks: 1

  update_propagation:
    enabled: true
    priority: high
    triggers:
      - weave_nn.file.modified
      - weave_nn.file.moved
      - weave_nn.file.deleted

  schema_validation:
    enabled: true
    priority: medium
    triggers:
      - weave_nn.file.created
      - weave_nn.file.modified
      - git.pre_commit
    auto_fix: true

  auto_linking:
    enabled: true
    priority: low
    triggers:
      - weave_nn.file.created
      - weave_nn.file.modified
    min_confidence: 0.7
    max_suggestions: 10

  auto_tagging:
    enabled: true
    priority: low
    triggers:
      - weave_nn.file.created
    min_confidence: 0.85
    max_tags: 10
```

### Testing Agent Rules

```python
# tests/test_agent_rules.py
import pytest
from agents.rule_engine import RuleEngine
from agents.rules.memory_sync import MemorySyncRule

@pytest.fixture
def rule_engine(obsidian_client, claude_flow_client):
    """Create rule engine with rules"""
    engine = RuleEngine()

    # Register memory sync rule
    memory_sync = MemorySyncRule(obsidian_client, claude_flow_client)
    engine.register_rule(memory_sync)

    return engine

def test_memory_sync_node_to_memory(rule_engine):
    """Test syncing Obsidian node to Claude-Flow memory"""
    event_data = {
        'file_path': 'concepts/test-concept.md',
        'file_content': '# Test Concept\n\nThis is a test.',
        'frontmatter': {'type': 'concept', 'tags': ['test']}
    }

    results = rule_engine.trigger_event('weave_nn.file.created', event_data)

    assert len(results) == 1
    assert results[0]['status'] == 'success'
    assert results[0]['result']['direction'] == 'node_to_memory'
```

### Recommendations

1. **Start Simple**: Implement memory_sync and schema_validation first
2. **Async Processing**: Use RabbitMQ for rule execution queue
3. **Metrics**: Track rule execution time, success rate, error rate
4. **Testing**: Comprehensive unit and integration tests
5. **Configuration**: Externalize rule configuration to YAML files
6. **Monitoring**: Log all rule executions for debugging

---

## PART 3: Day 11 - Obsidian Properties & Visualization

### Overview

**Purpose**: Leverage Obsidian's property system and enhance graph visualization with icons, colors, and interactive filtering.

**Reference**: `/home/aepod/dev/weave-nn/weave-nn/workflows/obsidian-properties-standard.md`

### Obsidian Properties System

**What Are Properties?**
- First-class YAML frontmatter fields
- Displayed in Obsidian UI (not just raw text)
- Support icons, colors, and custom rendering
- Enable filtering and querying via Dataview

### Standard Property Schema

**Core Properties** (all nodes):
```yaml
---
type: concept              # Node classification
icon: 💡
          # Lucide icon name
status: active            # Current state
created_date: "2025-10-22"
tags:
  - concept
  - knowledge-graph
cssclasses:
  - type-concept
  - status-active
---
```

### Icon System (Lucide Icons)

**Icon Mapping by Node Type**:
```python
# utils/icon_mapper.py
ICON_MAP = {
    # Concept nodes
    'concept': {
        'default': 'lightbulb',
        'core': 'brain',
        'learning': 'book-open',
        'innovative': 'sparkles',
        'system': 'network'
    },

    # Platform nodes
    'platform': {
        'default': 'box',
        'software': 'package',
        'backend': 'server',
        'cloud': 'cloud',
        'database': 'database'
    },

    # Technical nodes
    'technical': {
        'default': 'code',
        'library': 'code',
        'infrastructure': 'cpu',
        'vcs': 'git-branch',
        'cli': 'terminal',
        'build': 'wrench'
    },

    # Feature nodes
    'feature': {
        'default': 'zap',
        'mvp': 'star',
        'launch': 'rocket',
        'new': 'sparkles',
        'infrastructure': 'layers'
    },

    # Decision nodes
    'decision': {
        'open': 'help-circle',
        'decided': 'check-circle',
        'deferred': 'x-circle',
        'critical': 'alert-circle',
        'tree': 'git-branch'
    },

    # Workflow nodes
    'workflow': {
        'default': 'workflow',
        'process': 'git-merge',
        'iterative': 'repeat',
        'checklist': 'list-checks',
        'journey': 'map'
    },

    # Question nodes
    'question': {
        'open': 'message-circle',
        'answered': 'check-square',
        'urgent': 'alert-triangle',
        'research': 'search',
        'suggestion': 'lightbulb'
    },

    # Planning nodes
    'planning': {
        'default': 'calendar',
        'phase': 'calendar',
        'goal': 'target',
        'task': 'list-todo',
        'project': 'gantt-chart',
        'milestone': 'milestone'
    }
}

def get_icon(node_type: str, category: str = None) -> str:
    """Get appropriate icon for node type and category"""
    type_icons = ICON_MAP.get(node_type, {'default': 'file'})

    if category and category in type_icons:
        return type_icons[category]

    return type_icons.get('default', 'file')
```

### Color Coding System

**CSS Snippet** (create at `.obsidian/snippets/weave-nn-colors.css`):
```css
/* Weave-NN Color Coding System */

/* Status Colors */
.cssclasses-open {
  color: var(--color-yellow);
  --background-modifier-border: var(--color-yellow);
}

.cssclasses-in-progress {
  color: var(--color-blue);
  --background-modifier-border: var(--color-blue);
}

.cssclasses-completed {
  color: var(--color-green);
  --background-modifier-border: var(--color-green);
}

.cssclasses-blocked {
  color: var(--color-red);
  --background-modifier-border: var(--color-red);
}

.cssclasses-deferred {
  color: var(--color-gray);
  --background-modifier-border: var(--color-gray);
}

/* Priority Colors */
.cssclasses-critical {
  color: var(--color-red);
  font-weight: bold;
}

.cssclasses-high {
  color: var(--color-orange);
}

.cssclasses-medium {
  color: var(--color-yellow);
}

.cssclasses-low {
  color: var(--color-gray);
}

/* Type Colors */
.cssclasses-type-concept {
  --background-modifier-border-focus: var(--color-purple);
}

.cssclasses-type-technical {
  --background-modifier-border-focus: var(--color-blue);
}

.cssclasses-type-feature {
  --background-modifier-border-focus: var(--color-green);
}

.cssclasses-type-decision {
  --background-modifier-border-focus: var(--color-orange);
}

.cssclasses-type-workflow {
  --background-modifier-border-focus: var(--color-cyan);
}

/* Graph View Enhancements */
.graph-view.color-fill-dynamic {
  /* Node colors by type */
}

.graph-view.color-fill-tag {
  /* Color by tag */
}

/* Canvas Enhancements */
.canvas-node.is-concept {
  border-color: var(--color-purple);
}

.canvas-node.is-technical {
  border-color: var(--color-blue);
}

.canvas-node.is-feature {
  border-color: var(--color-green);
}
```

### Property Validation

```python
# utils/property_validator.py
from typing import Dict, List, Optional
import yaml

class PropertyValidator:
    """Validate Obsidian properties against schema"""

    REQUIRED_PROPERTIES = {
        'all': ['type', 'created_date', 'tags'],
        'concept': ['concept_id', 'concept_name'],
        'platform': ['platform_id', 'platform_name'],
        'technical': ['technical_id', 'technical_name'],
        'feature': ['feature_id', 'feature_name', 'status', 'priority', 'release'],
        'decision': ['decision_id', 'decision_type', 'title', 'status'],
        'workflow': ['workflow_name'],
        'question': ['question_id', 'question_type', 'status'],
        'planning': ['phase_id', 'phase_name', 'status']
    }

    ALLOWED_VALUES = {
        'status': {
            'concept': ['active', 'draft', 'deprecated'],
            'decision': ['open', 'researching', 'decided', 'deferred'],
            'feature': ['planned', 'in-progress', 'completed', 'deferred'],
            'planning': ['pending', 'in-progress', 'completed', 'blocked']
        },
        'priority': ['critical', 'high', 'medium', 'low']
    }

    def validate(self, frontmatter: Dict, node_type: str) -> tuple[bool, List[str]]:
        """Validate frontmatter properties"""
        errors = []

        # Check required properties for all nodes
        for prop in self.REQUIRED_PROPERTIES['all']:
            if prop not in frontmatter:
                errors.append(f"Missing required property: {prop}")

        # Check type-specific properties
        type_required = self.REQUIRED_PROPERTIES.get(node_type, [])
        for prop in type_required:
            if prop not in frontmatter:
                errors.append(f"Missing {node_type}-specific property: {prop}")

        # Validate allowed values
        if 'status' in frontmatter:
            allowed_statuses = self.ALLOWED_VALUES['status'].get(node_type, [])
            if allowed_statuses and frontmatter['status'] not in allowed_statuses:
                errors.append(f"Invalid status '{frontmatter['status']}' for {node_type}")

        if 'priority' in frontmatter:
            if frontmatter['priority'] not in self.ALLOWED_VALUES['priority']:
                errors.append(f"Invalid priority: {frontmatter['priority']}")

        # Validate tags (must be list, min 2 items)
        if 'tags' in frontmatter:
            if not isinstance(frontmatter['tags'], list):
                errors.append("Tags must be a list")
            elif len(frontmatter['tags']) < 2:
                errors.append("Must have at least 2 tags")

        # Validate date format
        if 'created_date' in frontmatter:
            import re
            if not re.match(r'^\d{4}-\d{2}-\d{2}$', str(frontmatter['created_date'])):
                errors.append("created_date must be in YYYY-MM-DD format")

        return (len(errors) == 0, errors)

    def auto_fix(self, frontmatter: Dict, node_type: str) -> Dict:
        """Automatically fix common issues"""
        fixed = frontmatter.copy()

        # Add missing type
        if 'type' not in fixed:
            fixed['type'] = node_type

        # Add missing created_date
        if 'created_date' not in fixed:
            from datetime import date
            fixed['created_date'] = date.today().strftime('%Y-%m-%d')

        # Add missing tags
        if 'tags' not in fixed or not isinstance(fixed['tags'], list):
            fixed['tags'] = [node_type]

        # Add type-specific ID if missing
        id_field = f'{node_type}_id'
        if id_field in self.REQUIRED_PROPERTIES.get(node_type, []):
            if id_field not in fixed:
                fixed[id_field] = f"{node_type.upper()}-XXX"

        return fixed
```

### Dataview Queries for Visualization

**Example Queries**:
```javascript
// List all features by status
dataview
TABLE icon, status, priority, release
FROM "features"
WHERE status = "planned"
SORT priority DESC

// Show concept relationships
dataview
TABLE file.outlinks as "Links To", file.inlinks as "Referenced By"
FROM "concepts"
SORT file.name

// Task dashboard
dataview
TASK
WHERE !completed
GROUP BY file.folder
SORT priority DESC

// Recent decisions
dataview
TABLE decision_type, status, decided_date
FROM "decisions"
WHERE decided_date
SORT decided_date DESC
LIMIT 10
```

### Graph View Customization

**Obsidian Graph Settings** (`.obsidian/graph.json`):
```json
{
  "collapse-filter": false,
  "search": "",
  "showTags": true,
  "showAttachments": false,
  "hideUnresolved": false,
  "showOrphans": true,
  "collapse-color-groups": false,
  "colorGroups": [
    {
      "query": "tag:#concept",
      "color": {
        "a": 1,
        "rgb": 11657298
      }
    },
    {
      "query": "tag:#technical",
      "color": {
        "a": 1,
        "rgb": 5431378
      }
    },
    {
      "query": "tag:#feature",
      "color": {
        "a": 1,
        "rgb": 5395168
      }
    },
    {
      "query": "tag:#decision",
      "color": {
        "a": 1,
        "rgb": 14725458
      }
    }
  ],
  "collapse-display": false,
  "showArrow": true,
  "textFadeMultiplier": -1,
  "nodeSizeMultiplier": 1.2,
  "lineSizeMultiplier": 1,
  "collapse-forces": false,
  "centerStrength": 0.3,
  "repelStrength": 10,
  "linkStrength": 0.7,
  "linkDistance": 250,
  "scale": 1.5
}
```

### Canvas Integration

**Creating Visual Canvases**:
```python
# utils/canvas_generator.py
import json
from typing import List, Dict

class CanvasGenerator:
    """Generate Obsidian canvas files programmatically"""

    def __init__(self):
        self.nodes = []
        self.edges = []

    def add_node(self, id: str, text: str, x: int, y: int,
                 width: int = 250, height: int = 150,
                 color: str = "#ffffff"):
        """Add node to canvas"""
        self.nodes.append({
            "id": id,
            "type": "text",
            "text": text,
            "x": x,
            "y": y,
            "width": width,
            "height": height,
            "color": color
        })

    def add_file_node(self, id: str, file_path: str, x: int, y: int,
                     width: int = 400, height: int = 300):
        """Add file reference node"""
        self.nodes.append({
            "id": id,
            "type": "file",
            "file": file_path,
            "x": x,
            "y": y,
            "width": width,
            "height": height
        })

    def add_edge(self, from_node: str, to_node: str,
                 label: str = None, color: str = "#888888"):
        """Add edge between nodes"""
        edge = {
            "id": f"{from_node}-{to_node}",
            "fromNode": from_node,
            "toNode": to_node,
            "color": color
        }
        if label:
            edge["label"] = label

        self.edges.append(edge)

    def generate(self) -> Dict:
        """Generate canvas JSON"""
        return {
            "nodes": self.nodes,
            "edges": self.edges
        }

    def save(self, file_path: str):
        """Save canvas to file"""
        canvas_data = self.generate()

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(canvas_data, f, indent=2)
```

### Automated Property Updates

```python
# scripts/update_properties.py
"""Batch update properties across all nodes"""
import os
import yaml
from pathlib import Path

def update_node_properties(vault_path: str):
    """Add icons and cssclasses to all nodes"""

    for md_file in Path(vault_path).rglob('*.md'):
        # Skip templates and system files
        if 'templates' in str(md_file) or '.obsidian' in str(md_file):
            continue

        # Read file
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Parse frontmatter
        if not content.startswith('---'):
            continue

        parts = content.split('---', 2)
        if len(parts) < 3:
            continue

        frontmatter = yaml.safe_load(parts[1])
        body = parts[2].strip()

        # Add icon if missing
        if 'icon' not in frontmatter:
            node_type = frontmatter.get('type', 'concept')
            from utils.icon_mapper import get_icon
            frontmatter['icon'] = get_icon(node_type)

        # Add cssclasses if missing
        if 'cssclasses' not in frontmatter:
            node_type = frontmatter.get('type', 'concept')
            status = frontmatter.get('status', 'active')
            frontmatter['cssclasses'] = [
                f'type-{node_type}',
                f'status-{status}'
            ]

        # Write back
        yaml_front = yaml.dump(frontmatter, default_flow_style=False, sort_keys=False)
        new_content = f"---\n{yaml_front}---\n\n{body}"

        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"Updated: {md_file}")

if __name__ == '__main__':
    vault_path = "/home/aepod/dev/weave-nn/weave-nn"
    update_node_properties(vault_path)
```

### Visualization Best Practices

1. **Consistent Icons**: Use the same icon for all nodes of a type
2. **Color Coding**: Apply CSS classes for status/priority visualization
3. **Graph Filters**: Use tags to filter graph view by type/status
4. **Canvas Organization**: Create themed canvases (e.g., "MVP Architecture", "Decision Tree")
5. **Dataview Dashboards**: Create dashboard notes with live queries
6. **Property Validation**: Validate all properties before committing

### Recommendations

1. **Phase 1**: Update all templates with standard properties ✅
2. **Phase 2**: Batch update existing nodes (use script above)
3. **Phase 3**: Create CSS snippet for color coding
4. **Phase 4**: Configure graph view with type-based colors
5. **Phase 5**: Build automated canvas generators for common views
6. **Phase 6**: Integrate property validation into agent rules

---

## Critical Recommendations

### For Day 2 (Obsidian REST API):
1. **Start with REST API**: Primary approach for MVP
2. **File system fallback**: Implement for testing/development
3. **Comprehensive error handling**: Retry logic with exponential backoff
4. **Testing suite**: Isolated test vault with fixtures
5. **Environment separation**: Dev/staging/production configs

### For Day 4 (Agent Rules):
1. **Phased implementation**: Start with memory_sync + schema_validation
2. **Async processing**: Use RabbitMQ for rule execution queue
3. **File locking**: Prevent concurrent rule modifications
4. **Comprehensive logging**: Track all rule executions
5. **Configuration-driven**: Externalize rule settings to YAML

### For Day 11 (Properties & Visualization):
1. **Batch updates**: Use automation scripts for existing nodes
2. **CSS customization**: Create snippet for consistent styling
3. **Graph configuration**: Set up type-based coloring
4. **Dataview dashboards**: Create live query views
5. **Property validation**: Integrate into CI/CD pipeline

---

## Architectural Dependencies

**Technology Stack** (confirmed):
- **Frontend**: Obsidian Desktop (Electron)
- **Backend**: Python 3.12+ with FastAPI
- **MCP**: Model Context Protocol SDK v1.18+
- **Message Queue**: RabbitMQ via Pika
- **Git**: GitPython for version control
- **Data**: Markdown + YAML frontmatter + SQLite (Claude-Flow)

**Critical Paths**:
1. Obsidian REST API plugin must be installed and configured
2. Python MCP server must expose all CRUD operations
3. Claude-Flow agents must have access to MCP tools
4. RabbitMQ must handle event-driven rule execution

---

## Next Steps

1. **Immediate**: Set up Obsidian REST API plugin and test basic operations
2. **Day 2**: Implement Python MCP server with REST client
3. **Day 4**: Build agent rule engine with memory_sync + schema_validation
4. **Day 11**: Apply property standards and create visualization enhancements

**Estimated Timeline**:
- Day 2 implementation: 8 hours
- Day 4 implementation: 8 hours
- Day 11 implementation: 4 hours (mostly automation scripts)

---

## Appendix: File Paths

**Research Sources**:
- `/home/aepod/dev/weave-nn/weave-nn/_planning/phases/phase-5-mvp-week-1.md`
- `/home/aepod/dev/weave-nn/weave-nn/mcp/agent-rules.md`
- `/home/aepod/dev/weave-nn/weave-nn/workflows/obsidian-properties-standard.md`
- `/home/aepod/dev/weave-nn/weave-nn/architecture/obsidian-first-architecture.md`
- `/home/aepod/dev/weave-nn/requirements.txt`

**Implementation Directories**:
- `/home/aepod/dev/weave-nn/src/` - Source code
- `/home/aepod/dev/weave-nn/tests/` - Test files
- `/home/aepod/dev/weave-nn/docs/` - Documentation

---

**Research Complete**: 2025-10-22
**Agent**: Researcher
**Session**: swarm-1761105846852-b3sb90gqc
**Status**: ✅ Comprehensive research findings delivered
