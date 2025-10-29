---
title: Obsidian Local REST API Plugin
type: technical-primitive
status: in-use
phase_id: PHASE-0
tags:
  - technical
  - tool
  - in-use
  - obsidian-plugin
  - rest-api
  - phase/phase-0
  - type/documentation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4C4"
  color: '#8E8E93'
  cssclasses:
    - type-technical-primitive
    - status-in-use
updated: '2025-10-29T04:55:06.371Z'
version: '3.0'
keywords:
  - overview
  - why we use it
  - key capabilities
  - integration points
  - configuration
  - deployment
  - trade-offs
  - alternatives considered
  - '[[obsidian-dataview-api]]'
  - '[[direct-file-system-access]]'
---

# Obsidian Local REST API Plugin

**Category**: Tool/Plugin
**Status**: In Use (MVP)
**First Used**: Phase 0 (Pre-Development Installation Required)

---

## Overview

Obsidian Local REST API is a community plugin that exposes Obsidian vault operations through a local HTTP REST API, enabling programmatic read/write access to vault content, metadata, and file operations.

**Official Site**: https://github.com/coddingtonbear/obsidian-local-rest-api
**Documentation**: https://coddingtonbear.github.io/obsidian-local-rest-api/

---

## Why We Use It

Enables Weave-NN's MCP server to programmatically interact with Obsidian vault without direct file system access, providing:
- **Safe Vault Access**: Use Obsidian's internal APIs instead of raw file operations
- **Real-time Updates**: Changes appear immediately in Obsidian UI
- **Metadata Preservation**: Maintains Obsidian's internal cache and link graph
- **Authentication**: HTTPS + API key for secure local communication

**Primary Purpose**: MCP server proxies requests to Obsidian REST API for all vault operations

**Specific Use Cases**:
- Read/write markdown files via MCP tools in [[../architecture/mcp-server]]
- Query vault metadata (tags, links, frontmatter) for agent rules
- Create/update/delete notes programmatically from agents
- Search vault content using Obsidian's internal indexing

---

## Key Capabilities

- **File Operations**: GET/POST/PUT/DELETE for markdown files
- **Search API**: Full-text search using Obsidian's internal index
- **Metadata API**: Query frontmatter, tags, links, backlinks
- **Vault Structure**: List directories, files, and vault hierarchy
- **HTTPS Support**: TLS encryption for local communication
- **API Key Authentication**: Secure access control
- **CORS Configuration**: Allow requests from MCP server (FastAPI)

---

## Integration Points

**Used By**:
- [[../architecture/mcp-server]] - Proxies vault operations via FastAPI
- [[../architecture/agent-orchestration]] - Agents read/write notes via API
- [[../features/agent-driven-task-automation]] - Automated note creation

**Integrates With**:
- [[fastapi]] - MCP server proxies requests to Obsidian API
- [[claude-flow]] - Agents use API for vault operations
- [[obsidian-tasks-plugin]] - Create/update tasks programmatically

**Enables Features**:
- [[../features/agent-driven-task-automation]] - Agents write results to vault
- [[../features/daily-log-automation]] - Automated daily note creation
- [[../features/auto-tagging]] - Programmatic tag updates

---

## Configuration

**Plugin Installation** (Phase 0 - Required before MVP):
1. Open Obsidian → Settings → Community Plugins
2. Search for "Local REST API"
3. Install and enable plugin
4. Configure settings (see below)

**Plugin Settings**:
```yaml
# Local REST API Plugin Configuration
Enable HTTPS: true
Port: 27124
API Key: <generate-secure-key>
CORS Allowed Origins:
  - http://localhost:8000  # FastAPI MCP server
  - http://127.0.0.1:8000
```

**Generate API Key**:
```bash
# Generate secure API key (32 bytes)
openssl rand -base64 32
```

**Environment Variables** (MCP Server):
```bash
# .env file for MCP server
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=<your-api-key-here>
OBSIDIAN_VERIFY_SSL=false  # Only for self-signed certs in local dev
```

**Key Configuration Files**:
- `.obsidian/plugins/obsidian-local-rest-api/data.json` - Plugin settings
- `vault/.env` - MCP server environment variables (not committed to git)

---

## Deployment

**MVP (Phase 5-6)**: Obsidian plugin running locally on developer machine
**v1.0 (Post-MVP)**: Same local deployment (Obsidian remains desktop-first)

**Resource Requirements**:
- RAM: 100 MB (plugin overhead)
- CPU: Negligible (handles HTTP requests only)
- Storage: <10 MB (plugin installation)

**Health Check**:
```bash
# Verify plugin is running
curl -X GET https://localhost:27124/ \
  -H "Authorization: Bearer <api-key>" \
  -k  # Only if using self-signed cert

# Expected response:
# {"status": "OK", "service": "Obsidian Local REST API"}
```

---

## Trade-offs

**Pros** (Why we chose it):
- ✅ **Obsidian-Native**: Uses Obsidian's internal APIs, maintains vault integrity
- ✅ **Real-time Updates**: Changes appear immediately in Obsidian UI
- ✅ **Metadata Preservation**: Maintains Obsidian's cache, links, and graph
- ✅ **Authentication**: API key security for local access
- ✅ **HTTPS Support**: Encrypted communication
- ✅ **Active Maintenance**: Regularly updated by community

**Cons** (What we accepted):
- ⚠️ **Requires Manual Installation**: User must install plugin before MVP - mitigated by clear Phase 0 installation guide
- ⚠️ **Local Only**: No remote vault access - acceptable because MVP is local-first architecture
- ⚠️ **Self-Signed Certs**: HTTPS uses self-signed certificates - mitigated by disabling SSL verification for localhost
- ⚠️ **Single Vault**: API serves only the currently open vault - acceptable for MVP single-vault design

---

## Alternatives Considered

**Compared With**:

### [[obsidian-dataview-api]]
- **Pros**: Query vault using JavaScript API, no HTTP overhead
- **Cons**: Requires running code inside Obsidian plugin context, no external access
- **Decision**: Rejected because MCP server needs external HTTP API, not in-process access

### [[direct-file-system-access]]
- **Pros**: Simple file I/O using Python `pathlib`, no dependencies
- **Cons**: Breaks Obsidian's cache, doesn't trigger UI updates, can corrupt vault state
- **Decision**: Rejected because unsafe - Obsidian's internal state would be out of sync

### [[obsidian-uri-protocol]]
- **Pros**: Built-in Obsidian protocol for opening notes (`obsidian://open`)
- **Cons**: Limited to navigation, no read/write/search capabilities
- **Decision**: Rejected because insufficient API surface for automation needs

---

## Decision History

**Decision Record**: [[../decisions/technical/obsidian-programmatic-access]]

**Key Reasoning**:
> The Local REST API plugin was chosen for Phase 0 because it's the only safe way to programmatically access Obsidian vault content while maintaining vault integrity. Direct file system access would break Obsidian's internal cache and link graph. The plugin's REST API enables the MCP server to act as a proxy between Claude AI agents and the vault.

**Date Decided**: 2025-10-20
**Decided By**: System Architect

---

## Phase Usage

### Phase 0 (Pre-Development) - Installation Required
**Prerequisite**: Install and configure plugin before Phase 5 MVP development
- Generate API key for secure authentication
- Enable HTTPS for encrypted local communication
- Configure CORS to allow MCP server access (localhost:8000)
- Test API with curl to verify connectivity

### Phase 5 (MVP Week 1) - In Use
**Day 1-5**: MCP server integrates with Obsidian API
- FastAPI proxies all vault operations to plugin API
- Agents read/write notes via MCP tools
- File watcher triggers updates when notes change
- Search API used for content queries

### Phase 6 (MVP Week 2) - Enhanced Usage
- Advanced search queries for agent rules
- Metadata queries for tag/link operations
- Batch operations for bulk note updates
- Error handling for API failures

### Phase 7 (v1.0) - Future Optimization
- Caching layer to reduce API calls
- WebSocket support for real-time updates (if plugin adds)
- Advanced query optimization for large vaults
- Performance monitoring for API latency

---

## Learning Resources

**Official Documentation**:
- [Plugin Documentation](https://coddingtonbear.github.io/obsidian-local-rest-api/)
- [API Reference](https://coddingtonbear.github.io/obsidian-local-rest-api/resources/)
- [GitHub Repository](https://github.com/coddingtonbear/obsidian-local-rest-api)

**Tutorials**:
- [Getting Started Guide](https://coddingtonbear.github.io/obsidian-local-rest-api/getting-started/)
- [API Authentication Setup](https://coddingtonbear.github.io/obsidian-local-rest-api/authentication/)
- [HTTPS Configuration](https://coddingtonbear.github.io/obsidian-local-rest-api/https/)

**Best Practices**:
- [Security Best Practices](https://coddingtonbear.github.io/obsidian-local-rest-api/security/)
- [Error Handling Guide](https://coddingtonbear.github.io/obsidian-local-rest-api/errors/)

**Community**:
- [GitHub Issues](https://github.com/coddingtonbear/obsidian-local-rest-api/issues)
- [Obsidian Forum Thread](https://forum.obsidian.md/t/local-rest-api-plugin/16189)

---

## Monitoring & Troubleshooting

**Health Checks**:
```bash
# Check if plugin is running
curl -X GET https://localhost:27124/ \
  -H "Authorization: Bearer <api-key>" \
  -k

# Test file read
curl -X GET https://localhost:27124/vault/README.md \
  -H "Authorization: Bearer <api-key>" \
  -k

# Test search
curl -X POST https://localhost:27124/search/ \
  -H "Authorization: Bearer <api-key>" \
  -H "Content-Type: application/json" \
  -d '{"query": "tag:#daily"}' \
  -k
```

**Common Issues**:
1. **Issue**: `Connection refused` error
   **Solution**: Verify plugin is enabled in Obsidian Settings → Community Plugins

2. **Issue**: `401 Unauthorized` error
   **Solution**: Check API key in plugin settings matches MCP server `.env` file

3. **Issue**: `SSL certificate verification failed`
   **Solution**: Set `OBSIDIAN_VERIFY_SSL=false` in MCP server `.env` for self-signed certs

4. **Issue**: CORS error in MCP server logs
   **Solution**: Add `http://localhost:8000` to CORS allowed origins in plugin settings

5. **Issue**: Changes not appearing in Obsidian UI
   **Solution**: Restart Obsidian or reload plugin (Ctrl+R / Cmd+R)

---

## Code Examples

### Python Client (MCP Server)
```python
# mcp_server/obsidian_client.py
import httpx
import os
from typing import Optional

class ObsidianClient:
    def __init__(self):
        self.base_url = os.getenv("OBSIDIAN_API_URL", "https://localhost:27124")
        self.api_key = os.getenv("OBSIDIAN_API_KEY")
        self.verify_ssl = os.getenv("OBSIDIAN_VERIFY_SSL", "false") == "true"

        self.client = httpx.Client(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {self.api_key}"},
            verify=self.verify_ssl
        )

    def read_note(self, path: str) -> str:
        """Read markdown file content."""
        response = self.client.get(f"/vault/{path}")
        response.raise_for_status()
        return response.text

    def write_note(self, path: str, content: str):
        """Write markdown file content."""
        response = self.client.put(
            f"/vault/{path}",
            content=content,
            headers={"Content-Type": "text/markdown"}
        )
        response.raise_for_status()

    def search(self, query: str) -> list[dict]:
        """Search vault content."""
        response = self.client.post(
            "/search/",
            json={"query": query}
        )
        response.raise_for_status()
        return response.json()

    def list_files(self, path: str = "") -> list[str]:
        """List files in vault directory."""
        response = self.client.get(f"/vault/{path}/")
        response.raise_for_status()
        return response.json().get("files", [])
```

### MCP Tool Integration
```python
# mcp_server/tools/read_note.py
from mcp.server import Server
from obsidian_client import ObsidianClient

@mcp_server.tool()
async def read_note(path: str) -> str:
    """Read a note from Obsidian vault."""
    client = ObsidianClient()
    content = client.read_note(path)
    return content

@mcp_server.tool()
async def write_note(path: str, content: str) -> str:
    """Write a note to Obsidian vault."""
    client = ObsidianClient()
    client.write_note(path, content)
    return f"Successfully wrote to {path}"

@mcp_server.tool()
async def search_vault(query: str) -> list[dict]:
    """Search vault content."""
    client = ObsidianClient()
    results = client.search(query)
    return results
```

---











## Related

[[wikilinks]]
## Related

[[sqlite]] • [[weaver]]
## Related

[[docker-compose]]
## Related

[[n8n-workflow-automation]] • [[property-visualizer]]
## Related

[[uvicorn]]
## Related Nodes

**Architecture**:
- [[../architecture/mcp-server]] - Proxies all vault operations via this API
- [[../architecture/obsidian-integration-layer]] - Defines integration patterns

**Features**:
- [[../features/agent-driven-task-automation]] - Agents write results via API
- [[../features/daily-log-automation]] - Automated note creation
- [[../features/auto-tagging]] - Programmatic tag updates

**Decisions**:
- [[../decisions/technical/obsidian-programmatic-access]] - Why REST API vs file system

**Other Primitives**:
- [[fastapi]] - MCP server framework that proxies to this API
- [[claude-flow]] - Agents use this API for vault operations
- [[obsidian-tasks-plugin]] - Complementary plugin for task management

---

## Revisit Criteria

**Reconsider this technology if**:
- Plugin becomes unmaintained (no updates for 12+ months)
- API latency exceeds 500ms for simple read operations (performance threshold)
- Obsidian releases official REST API (ecosystem improvement)
- Plugin causes vault corruption issues (safety threshold)

**Scheduled Review**: 2026-04-01 (6 months after v1.0 launch)

---

**Back to**: [[README|Technical Primitives Index]]
