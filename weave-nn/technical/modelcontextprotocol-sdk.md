# Model Context Protocol SDK

**Category**: Technical / MCP
**Status**: MVP Core Dependency
**Package**: `@modelcontextprotocol/sdk`
**Docs**: https://modelcontextprotocol.io

---

## Overview

Official TypeScript SDK from Anthropic for building MCP (Model Context Protocol) servers. Integrated directly into Weaver to provide Claude Code with knowledge graph access tools.

## Why @modelcontextprotocol/sdk

**Official SDK**:
- Maintained by Anthropic
- Full MCP 1.0 specification support
- TypeScript-native with excellent types
- Used by Anthropic's own tools

**Replaces**:
- Separate Python FastAPI MCP server
- Cross-language communication overhead
- Multiple codebases and config files

## Installation

```bash
npm install @modelcontextprotocol/sdk
```

## MVP Usage

### Server Setup

```typescript
// src/mcp/server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

export function createMCPServer() {
  const server = new Server(
    {
      name: 'weaver',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Register knowledge graph tools
  registerKnowledgeTools(server);

  return server;
}
```

### Tool Registration

```typescript
// src/mcp/tools/knowledge.ts
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

export function registerKnowledgeTools(server: Server) {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get_knowledge',
        description: 'Retrieve knowledge from graph by query',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (natural language or tags)'
            },
            limit: {
              type: 'number',
              description: 'Maximum results (default: 10)'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'store_knowledge',
        description: 'Add knowledge to graph',
        inputSchema: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'Markdown content to store'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorization'
            }
          },
          required: ['content']
        }
      }
    ]
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'get_knowledge':
        return await getKnowledge(args);
      case 'store_knowledge':
        return await storeKnowledge(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}
```

### Transport (stdio)

```typescript
// src/index.ts
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function main() {
  const server = createMCPServer();

  // Connect via stdio (Claude Code uses this)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log('MCP server ready (stdio)');
}
```

## Claude Code Configuration

Tell Claude Code about Weaver's MCP server:

```json
// ~/.config/claude/mcp.json
{
  "mcpServers": {
    "weaver": {
      "command": "node",
      "args": ["/path/to/weave-nn-weaver/dist/index.js"],
      "env": {
        "VAULT_PATH": "/path/to/vault",
        "OBSIDIAN_API_URL": "http://localhost:27124",
        "OBSIDIAN_API_KEY": "your-key"
      }
    }
  }
}
```

## MCP Tool Examples

### get_knowledge

```typescript
async function getKnowledge(args: { query: string; limit?: number }) {
  const { query, limit = 10 } = args;

  // Search vault via Obsidian API client
  const nodes = await obsidianClient.search(query, { limit });

  return {
    content: [{
      type: 'text',
      text: JSON.stringify(nodes, null, 2)
    }]
  };
}
```

### store_knowledge

```typescript
async function storeKnowledge(args: { content: string; tags?: string[] }) {
  const { content, tags = [] } = args;

  // Generate filename from content
  const title = extractTitle(content);
  const filename = `${slugify(title)}.md`;

  // Add frontmatter
  const frontmatter = {
    created_date: new Date().toISOString(),
    tags,
    source: 'claude-code'
  };

  const markdown = formatMarkdown(frontmatter, content);

  // Write via Obsidian API
  await obsidianClient.createNote(filename, markdown);

  return {
    content: [{
      type: 'text',
      text: `Created: ${filename}`
    }]
  };
}
```

### trigger_workflow

```typescript
async function triggerWorkflow(args: { workflow: string; params: any }) {
  const { workflow, params } = args;

  // Start durable workflow
  const workflowId = await startWorkflow(workflow, params);

  return {
    content: [{
      type: 'text',
      text: `Started workflow: ${workflowId}`
    }]
  };
}
```

## Transports

### stdio (Recommended for Claude Code)
```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
await server.connect(new StdioServerTransport());
```

### HTTP/SSE (For web clients)
```typescript
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
// Setup HTTP endpoint with SSE transport
```

## Error Handling

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await executeTool(request.params);
    return result;
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});
```

## Benefits Over Python MCP Server

| Aspect | Python FastAPI | @modelcontextprotocol/sdk |
|--------|----------------|---------------------------|
| **Language** | Separate Python codebase | Same TypeScript codebase |
| **Process** | Separate uvicorn process | Integrated into Weaver |
| **Communication** | HTTP requests | In-process function calls |
| **Types** | Pydantic models | TypeScript interfaces |
| **Latency** | ~10-50ms HTTP | <1ms in-process |
| **Config** | Multiple .env files | Single weaver.config.ts |
| **Deployment** | 2 services to start | 1 service (`npm start`) |

## Resources

- **Official Docs**: https://modelcontextprotocol.io
- **GitHub**: https://github.com/modelcontextprotocol/typescript-sdk
- **Specification**: https://spec.modelcontextprotocol.io

## Related

- [[technical/weaver|Weaver Unified Service]]
- [[docs/weaver-mcp-unification-summary|Weaver MCP Unification]]
- [[.archive/technical/python-stack/fastapi|FastAPI (archived)]]
