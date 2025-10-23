---
title: Obsidian ↔ Weaver MCP Integration
integration_type: hub-and-spoke
systems:
  - name: Obsidian Vault
    role: both
  - name: Weaver MCP
    role: hub
direction: bidirectional
protocol: HTTP (Local REST API)
authentication: api-key
status: active
created: 2025-10-23
updated: 2025-10-23
---

# Obsidian ↔ Weaver MCP Integration

## Overview

This integration connects Obsidian vault to Weaver's MCP server, enabling AI agents (Claude Code, Claude Flow) to read, write, and query the knowledge graph through standardized MCP tools.

**Key Benefit**: AI agents can directly interact with your knowledge graph without requiring separate Obsidian plugins or manual workflows.

## Systems Involved

### Obsidian Vault
- **Role**: Producer/Consumer (both)
- **Technology**: Obsidian desktop app with Local REST API plugin
- **Endpoint**: `https://localhost:27124` (HTTPS with self-signed cert)
- **Authentication**: Bearer token (API key)

### Weaver MCP
- **Role**: Hub (neural network junction)
- **Technology**: Node.js with `@modelcontextprotocol/sdk`
- **Endpoint**: stdio transport (Claude Code invokes as subprocess)
- **Authentication**: None (local process trust)

## Integration Architecture

### Data Flow

```
[Claude Code] → [MCP Protocol] → [Weaver MCP Server]
                                        ↓
                                  [MCP Tools]
                                        ↓
                            [ObsidianAPIClient (REST)]
                                        ↓
                              [Local REST API Plugin]
                                        ↓
                                [Obsidian Vault]
```

**Return Path**:
```
[Obsidian Vault] → [File content/metadata] → [Weaver] → [MCP Response] → [Claude]
```

### Components

#### 1. Weaver MCP Server
**File**: `weaver/src/mcp/server.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ObsidianAPIClient } from '../clients/obsidian.js';

export function createMCPServer() {
  const server = new Server(
    { name: 'weaver', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  const obsidianClient = new ObsidianAPIClient(
    process.env.OBSIDIAN_API_URL!,
    process.env.OBSIDIAN_API_KEY!
  );

  // Register knowledge graph tools
  registerKnowledgeGraphTools(server, obsidianClient);

  return server;
}
```

#### 2. ObsidianAPIClient
**File**: `weaver/src/clients/obsidian.ts`

```typescript
import axios, { AxiosInstance } from 'axios';
import https from 'https';

export class ObsidianAPIClient {
  private client: AxiosInstance;

  constructor(apiUrl: string, apiKey: string) {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Self-signed cert
      }),
      timeout: 30000,
    });
  }

  async createNote(path: string, content: string, frontmatter?: object) {
    const fullContent = frontmatter
      ? `---\n${yaml.stringify(frontmatter)}---\n\n${content}`
      : content;

    return this.client.post(`/vault/${path}`, { content: fullContent });
  }

  async readNote(path: string) {
    const response = await this.client.get(`/vault/${path}`);
    return response.data;
  }

  async updateNote(path: string, content: string) {
    return this.client.put(`/vault/${path}`, { content });
  }

  async deleteNote(path: string) {
    return this.client.delete(`/vault/${path}`);
  }

  async listNotes(pattern?: string) {
    const response = await this.client.get('/vault/', {
      params: { pattern }
    });
    return response.data.files;
  }

  async searchNotes(query: string) {
    const response = await this.client.get('/search/', {
      params: { query }
    });
    return response.data.results;
  }
}
```

#### 3. MCP Tool Registration
**File**: `weaver/src/mcp/tools/knowledge-graph.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ObsidianAPIClient } from '../../clients/obsidian.js';

export function registerKnowledgeGraphTools(
  server: Server,
  obsidianClient: ObsidianAPIClient
) {
  // Create note tool
  server.setRequestHandler('tools/call', async (request) => {
    if (request.params.name === 'create_note') {
      const { path, content, frontmatter } = request.params.arguments;
      await obsidianClient.createNote(path, content, frontmatter);
      return {
        content: [{ type: 'text', text: `Created note: ${path}` }]
      };
    }

    // Read note tool
    if (request.params.name === 'read_note') {
      const { path } = request.params.arguments;
      const content = await obsidianClient.readNote(path);
      return {
        content: [{ type: 'text', text: content }]
      };
    }

    // Search knowledge graph tool
    if (request.params.name === 'search_knowledge_graph') {
      const { query } = request.params.arguments;
      const results = await obsidianClient.searchNotes(query);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(results, null, 2)
        }]
      };
    }

    // Query by tag tool
    if (request.params.name === 'query_by_tag') {
      const { tag } = request.params.arguments;
      const notes = await obsidianClient.listNotes(`**/tags:${tag}*.md`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(notes, null, 2)
        }]
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  // List available tools
  server.setRequestHandler('tools/list', async () => {
    return {
      tools: [
        {
          name: 'create_note',
          description: 'Create a new note in the knowledge graph',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
              frontmatter: { type: 'object' }
            },
            required: ['path', 'content']
          }
        },
        {
          name: 'read_note',
          description: 'Read an existing note from the knowledge graph',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string' }
            },
            required: ['path']
          }
        },
        {
          name: 'search_knowledge_graph',
          description: 'Search the knowledge graph for relevant notes',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' }
            },
            required: ['query']
          }
        },
        {
          name: 'query_by_tag',
          description: 'Query notes by tag',
          inputSchema: {
            type: 'object',
            properties: {
              tag: { type: 'string' }
            },
            required: ['tag']
          }
        }
      ]
    };
  });
}
```

## Configuration

### Environment Variables

```bash
# Obsidian Local REST API
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=<your-64-char-api-key>

# Weaver Configuration
VAULT_PATH=/path/to/obsidian/vault
```

### Claude Desktop Configuration

Add Weaver MCP server to Claude Code:

**File**: `~/.config/claude/config.json` (Linux/Mac)

```json
{
  "mcpServers": {
    "weaver": {
      "command": "node",
      "args": ["/path/to/weaver/dist/mcp/server.js"],
      "env": {
        "OBSIDIAN_API_URL": "https://localhost:27124",
        "OBSIDIAN_API_KEY": "<your-api-key>",
        "VAULT_PATH": "/path/to/vault"
      }
    }
  }
}
```

## Data Formats

### Note Creation Request

**MCP Tool Call**:
```json
{
  "name": "create_note",
  "arguments": {
    "path": "concepts/neural-network-junction.md",
    "content": "The neural network junction is...",
    "frontmatter": {
      "type": "concept",
      "tags": ["architecture", "ai"],
      "status": "active"
    }
  }
}
```

**REST API Request** (Weaver → Obsidian):
```http
POST https://localhost:27124/vault/concepts/neural-network-junction.md
Authorization: Bearer <api-key>
Content-Type: application/json

{
  "content": "---\ntype: concept\ntags:\n  - architecture\n  - ai\nstatus: active\n---\n\nThe neural network junction is..."
}
```

### Search Request/Response

**MCP Tool Call**:
```json
{
  "name": "search_knowledge_graph",
  "arguments": {
    "query": "durable workflows"
  }
}
```

**MCP Response**:
```json
{
  "content": [{
    "type": "text",
    "text": "[\n  {\n    \"path\": \"concepts/durable-workflows.md\",\n    \"score\": 0.95,\n    \"excerpt\": \"Durable workflows are stateful...\"\n  },\n  {\n    \"path\": \"technical/workflow-dev.md\",\n    \"score\": 0.82,\n    \"excerpt\": \"Workflow.dev provides...\"\n  }\n]"
  }]
}
```

## Error Handling

### Connection Errors

**Scenario**: Obsidian not running or Local REST API plugin disabled

```typescript
try {
  await obsidianClient.createNote(path, content);
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    throw new Error(
      'Cannot connect to Obsidian. Please ensure:\n' +
      '1. Obsidian is running\n' +
      '2. Local REST API plugin is enabled\n' +
      '3. API server is running on port 27124'
    );
  }
  throw error;
}
```

### Authentication Errors

**Scenario**: Invalid API key

```typescript
if (error.response?.status === 401) {
  throw new Error(
    'Invalid Obsidian API key. Please check OBSIDIAN_API_KEY in .env'
  );
}
```

### File Not Found

**Scenario**: Note doesn't exist

```typescript
if (error.response?.status === 404) {
  throw new Error(`Note not found: ${path}`);
}
```

### Retry Strategy

```typescript
private async withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Monitoring and Observability

### Metrics

Track via Weaver:

- **Request rate**: MCP tool calls/minute
- **Error rate**: Failed API calls/total calls
- **Latency**: p50, p95, p99 for Obsidian API calls
- **Cache hit rate**: If implementing cache layer

### Logging

```typescript
import { logger } from '../utils/logger.js';

export class ObsidianAPIClient {
  async createNote(path: string, content: string) {
    logger.info('Creating note', { path, size: content.length });

    try {
      const response = await this.client.post(`/vault/${path}`, { content });
      logger.info('Note created successfully', { path });
      return response;
    } catch (error) {
      logger.error('Failed to create note', { path, error });
      throw error;
    }
  }
}
```

## Testing

### Integration Tests

**File**: `weaver/tests/integration/obsidian-mcp.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createMCPServer } from '../../src/mcp/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

describe('Obsidian ↔ Weaver MCP Integration', () => {
  let server, client;

  beforeAll(async () => {
    server = createMCPServer();
    client = new Client({ name: 'test' });
    await client.connect(server);
  });

  afterAll(async () => {
    await client.close();
  });

  it('should create a note via MCP tool', async () => {
    const result = await client.callTool('create_note', {
      path: 'test-note.md',
      content: 'Test content',
      frontmatter: { tags: ['test'] }
    });

    expect(result.content[0].text).toContain('Created note');
  });

  it('should read the created note', async () => {
    const result = await client.callTool('read_note', {
      path: 'test-note.md'
    });

    expect(result.content[0].text).toContain('Test content');
  });

  it('should search knowledge graph', async () => {
    const result = await client.callTool('search_knowledge_graph', {
      query: 'test'
    });

    const results = JSON.parse(result.content[0].text);
    expect(results.length).toBeGreaterThan(0);
  });
});
```

### Manual Testing

```bash
# 1. Start Obsidian with Local REST API plugin enabled
# 2. Get API key from plugin settings

# 3. Configure Weaver
cat > .env <<EOF
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=<your-key>
VAULT_PATH=/path/to/vault
EOF

# 4. Start Weaver MCP server
npm run mcp

# 5. Test with Claude Code
# In Claude Code, ask: "Create a note about neural network junctions"
# Claude should use the create_note MCP tool
```

## Deployment

### Prerequisites

1. **Obsidian Desktop** - Installed and running
2. **Local REST API Plugin** - Installed from Community Plugins
3. **API Key Generated** - From plugin settings
4. **Weaver Built** - `npm run build` in weaver directory

### Deployment Steps

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your Obsidian API key

# 2. Build Weaver
cd weaver
npm install
npm run build

# 3. Add to Claude Code config
# Edit ~/.config/claude/config.json
# Add Weaver MCP server entry

# 4. Restart Claude Code
# Weaver MCP server will start automatically

# 5. Verify
# Ask Claude Code: "List available MCP tools"
# Should show: create_note, read_note, search_knowledge_graph, query_by_tag
```

## Troubleshooting

### Issue: "Cannot connect to Obsidian"

**Cause**: Obsidian not running or plugin disabled

**Solution**:
1. Start Obsidian
2. Open Settings > Community Plugins
3. Enable "Local REST API"
4. Verify server status in plugin settings (should show "Running on port 27124")

### Issue: "401 Unauthorized"

**Cause**: Invalid API key

**Solution**:
1. Open Obsidian Settings > Local REST API
2. Copy API key
3. Update OBSIDIAN_API_KEY in .env
4. Restart Weaver MCP server

### Issue: "Self-signed certificate error"

**Cause**: HTTPS certificate not trusted

**Solution**: Already handled by `rejectUnauthorized: false` in axios config. No action needed.

### Issue: "MCP tools not showing in Claude Code"

**Cause**: Weaver not registered in Claude config

**Solution**:
1. Check `~/.config/claude/config.json`
2. Verify Weaver entry exists
3. Check paths are absolute (not relative)
4. Restart Claude Code

## Related Documentation

- [[technical/obsidian-local-rest-api-plugin|Obsidian Local REST API Plugin]]
- [[technical/weaver|Weaver Service]]
- [[technical/modelcontextprotocol-sdk|MCP SDK]]
- [[concepts/neural-network-junction|Neural Network Junction]]
- [[docs/local-first-architecture-overview|Local-First Architecture]]

## Maintenance

### Version Compatibility

- **Obsidian**: v1.4.0+
- **Local REST API Plugin**: v2.0.0+
- **Weaver**: v1.0.0
- **@modelcontextprotocol/sdk**: v0.5.0+

### Update Schedule

- **API Key Rotation**: Every 90 days (recommended)
- **Plugin Updates**: Check weekly
- **Weaver Updates**: Monthly
- **Performance Review**: Quarterly

---

**Status**: ✅ **Active** - Core MVP integration
**Last Updated**: 2025-10-23
**Maintainer**: Weave-NN Team
