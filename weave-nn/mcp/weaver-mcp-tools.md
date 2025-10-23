---
title: Weaver MCP Tools
type: reference
status: active
priority: high
created: 2025-10-23
tags: [mcp, weaver, tools, api, knowledge-graph]
related:
  - "[[claude-flow-tight-coupling]]"
  - "[[model-context-protocol]]"
  - "[[../integrations/obsidian/obsidian-weaver-mcp]]"
  - "[[servers/cyanheads-obsidian-mcp-server]]"
---

# Weaver MCP Tools

## Overview

Weaver exposes a comprehensive set of MCP (Model Context Protocol) tools that enable Claude-Flow agents to interact with the knowledge graph. These tools provide direct access to markdown files, shadow cache queries, and AI-enhanced operations.

### Architecture

```
[Claude-Flow Agent]
       ↓ (MCP Protocol)
[Weaver MCP Server]
       ↓
   ┌───┴───┐
   │       │
[Shadow Cache]  [ObsidianAPIClient]
   │                    ↓
   └──────→ [Obsidian Vault Files]
```

**Key Principle**: Weaver's MCP server provides an intelligent layer over raw file access:
- **Fast queries**: Shadow cache for metadata
- **Comprehensive search**: ObsidianAPIClient for full content
- **AI enhancement**: Claude API for semantic operations
- **Workflow integration**: Triggers workflows for complex operations

---

## Tool Categories

### 1. Core CRUD Operations
- `create_note` - Create new knowledge graph node
- `read_note` - Read existing node content
- `update_note` - Update node content/frontmatter
- `delete_note` - Remove node from graph

### 2. Search & Discovery
- `search_knowledge_graph` - Semantic search across nodes
- `query_by_tag` - Find nodes by tags
- `query_by_type` - Find nodes by type (concept, decision, etc.)
- `find_related` - Find related nodes via links

### 3. Link Management
- `get_links` - Get all links in a node
- `get_backlinks` - Find nodes linking to this node
- `add_link` - Add wikilink to node
- `remove_link` - Remove wikilink from node

### 4. Metadata Operations
- `get_frontmatter` - Read node frontmatter
- `update_frontmatter` - Update specific frontmatter fields
- `add_tags` - Add tags to node
- `remove_tags` - Remove tags from node

### 5. AI-Enhanced Operations
- `extract_memories` - Extract structured memories using AI (via Vercel AI Gateway)
- `suggest_tags` - AI-powered tag suggestions
- `find_semantic_neighbors` - Find semantically similar nodes
- `generate_summary` - Generate node summary

**AI Model Configuration**:
- **Default**: All AI operations use Vercel AI Gateway (unified model access, rate limiting, caching)
- **Exception**: Local claude-flow agent development tasks use Anthropic API directly
- **Models Available**: Claude 3.5 Sonnet, Claude 3 Opus, GPT-4, GPT-4 Turbo (via Vercel AI Gateway)

### 6. Graph Analytics
- `get_graph_stats` - Overall graph statistics
- `find_orphans` - Find nodes with no links
- `find_hubs` - Find highly connected nodes
- `detect_clusters` - Detect conceptual clusters

---

## Core CRUD Operations

### create_note

**Purpose**: Create a new node in the knowledge graph

**Parameters**:
```typescript
{
  path: string;              // e.g., "concepts/knowledge-graph.md"
  content: string;           // Markdown body content
  frontmatter?: {            // YAML frontmatter (optional)
    type?: string;
    tags?: string[];
    [key: string]: any;
  };
  triggerWorkflow?: boolean; // Default: true - triggers vault-file-created workflow
}
```

**Returns**:
```typescript
{
  success: boolean;
  path: string;
  nodeId: string;           // Generated node ID (e.g., "C-001")
  timestamp: string;        // ISO timestamp
}
```

**Example**:
```typescript
const result = await mcp.callTool('create_note', {
  path: 'concepts/knowledge-graph.md',
  content: '# Knowledge Graph\n\nA knowledge graph is...',
  frontmatter: {
    type: 'concept',
    tags: ['concept', 'core'],
    status: 'active'
  }
});

// Result:
// {
//   success: true,
//   path: 'concepts/knowledge-graph.md',
//   nodeId: 'C-001',
//   timestamp: '2025-10-23T10:30:00Z'
// }
```

**Workflow Integration**: Automatically triggers `vault-file-created` workflow which:
1. Validates schema
2. Updates shadow cache
3. Ensures bidirectional links
4. Generates embeddings (if enabled)

---

### read_note

**Purpose**: Read node content and metadata

**Parameters**:
```typescript
{
  path: string;              // e.g., "concepts/knowledge-graph.md"
  includeBacklinks?: boolean; // Default: false
  includeMetadata?: boolean;  // Default: true
}
```

**Returns**:
```typescript
{
  success: boolean;
  path: string;
  frontmatter: object;       // Parsed YAML frontmatter
  content: string;           // Markdown body
  backlinks?: string[];      // If includeBacklinks: true
  metadata?: {               // If includeMetadata: true
    created: string;
    modified: string;
    size: number;
    wordCount: number;
    linkCount: number;
  };
}
```

**Example**:
```typescript
const result = await mcp.callTool('read_note', {
  path: 'concepts/knowledge-graph.md',
  includeBacklinks: true
});

// Result:
// {
//   success: true,
//   path: 'concepts/knowledge-graph.md',
//   frontmatter: {
//     type: 'concept',
//     concept_id: 'C-001',
//     tags: ['concept', 'core']
//   },
//   content: '# Knowledge Graph\n\nA knowledge graph is...',
//   backlinks: ['technical/graphiti.md', 'decisions/technical/frontend.md'],
//   metadata: {
//     created: '2025-10-20T10:00:00Z',
//     modified: '2025-10-23T10:30:00Z',
//     size: 1024,
//     wordCount: 150,
//     linkCount: 5
//   }
// }
```

**Source**: Reads from ObsidianAPIClient (always fresh) with metadata from shadow cache (fast)

---

### update_note

**Purpose**: Update node content or frontmatter

**Parameters**:
```typescript
{
  path: string;
  content?: string;          // New content (replaces existing)
  frontmatter?: object;      // Fields to update (merges with existing)
  append?: boolean;          // Default: false - if true, appends content
  triggerWorkflow?: boolean; // Default: true
}
```

**Returns**:
```typescript
{
  success: boolean;
  path: string;
  changes: {
    contentChanged: boolean;
    frontmatterChanged: boolean;
    fields: string[];       // Changed frontmatter fields
  };
  timestamp: string;
}
```

**Example**:
```typescript
const result = await mcp.callTool('update_note', {
  path: 'decisions/technical/frontend.md',
  frontmatter: {
    status: 'decided',
    decided_date: '2025-10-23'
  }
});

// Result:
// {
//   success: true,
//   path: 'decisions/technical/frontend.md',
//   changes: {
//     contentChanged: false,
//     frontmatterChanged: true,
//     fields: ['status', 'decided_date']
//   },
//   timestamp: '2025-10-23T10:35:00Z'
// }
```

**Workflow Integration**: Triggers `vault-file-updated` workflow which detects changes and updates cache

---

## Search & Discovery

### search_knowledge_graph

**Purpose**: Semantic search across all nodes

**Parameters**:
```typescript
{
  query: string;             // Search query
  type?: string;             // Filter by node type (concept, decision, etc.)
  tags?: string[];           // Filter by tags
  limit?: number;            // Default: 10
  useEmbeddings?: boolean;   // Default: true - use semantic search
  minScore?: number;         // Default: 0.7 - minimum similarity score
}
```

**Returns**:
```typescript
{
  success: boolean;
  results: Array<{
    path: string;
    title: string;
    type: string;
    score: number;          // 0-1 similarity score
    excerpt: string;        // Matching excerpt
    highlights: string[];   // Highlighted match phrases
  }>;
  total: number;
  query: string;
}
```

**Example**:
```typescript
const result = await mcp.callTool('search_knowledge_graph', {
  query: 'durable workflows',
  type: 'concept',
  limit: 5
});

// Result:
// {
//   success: true,
//   results: [
//     {
//       path: 'concepts/durable-workflows.md',
//       title: 'Durable Workflows',
//       type: 'concept',
//       score: 0.95,
//       excerpt: 'Durable workflows are stateful...',
//       highlights: ['durable workflows', 'stateful execution']
//     },
//     {
//       path: 'technical/workflow-dev.md',
//       title: 'Workflow.dev',
//       type: 'technical',
//       score: 0.82,
//       excerpt: 'workflow.dev provides...',
//       highlights: ['workflow.dev', 'durable']
//     }
//   ],
//   total: 2,
//   query: 'durable workflows'
// }
```

**Implementation**:
- **Fast path**: Query shadow cache embeddings (2-3ms)
- **Comprehensive path**: ObsidianAPIClient full-text search
- **AI path**: Claude API semantic search (higher quality, slower)

---

### query_by_tag

**Purpose**: Find all nodes with specific tags

**Parameters**:
```typescript
{
  tag: string;               // Tag to search for
  includeSubtags?: boolean;  // Default: false - match subtags like "concept/core"
  limit?: number;            // Default: 50
  sortBy?: 'created' | 'modified' | 'title';  // Default: 'modified'
}
```

**Returns**:
```typescript
{
  success: boolean;
  tag: string;
  nodes: Array<{
    path: string;
    title: string;
    type: string;
    created: string;
    modified: string;
  }>;
  total: number;
}
```

**Example**:
```typescript
const result = await mcp.callTool('query_by_tag', {
  tag: 'decision',
  sortBy: 'modified',
  limit: 10
});
```

**Source**: Shadow cache (fast - indexed by tags)

---

## Link Management

### get_links

**Purpose**: Get all outbound links from a node

**Parameters**:
```typescript
{
  path: string;
  includeUnresolved?: boolean; // Default: false - include broken links
}
```

**Returns**:
```typescript
{
  success: boolean;
  path: string;
  links: Array<{
    target: string;         // Link target (e.g., "knowledge-graph")
    resolved: boolean;      // Does target exist?
    targetPath?: string;    // Resolved path if exists
    context: string;        // Surrounding text
  }>;
  total: number;
}
```

**Example**:
```typescript
const result = await mcp.callTool('get_links', {
  path: 'concepts/knowledge-graph.md',
  includeUnresolved: true
});

// Result:
// {
//   success: true,
//   path: 'concepts/knowledge-graph.md',
//   links: [
//     {
//       target: 'wikilinks',
//       resolved: true,
//       targetPath: 'concepts/wikilinks.md',
//       context: 'Knowledge graphs use [[wikilinks]] to connect...'
//     },
//     {
//       target: 'missing-concept',
//       resolved: false,
//       context: 'This relates to [[missing-concept]] which...'
//     }
//   ],
//   total: 2
// }
```

---

### get_backlinks

**Purpose**: Find all nodes that link to this node

**Parameters**:
```typescript
{
  path: string;
  limit?: number;            // Default: 100
}
```

**Returns**:
```typescript
{
  success: boolean;
  path: string;
  backlinks: Array<{
    source: string;          // Path of linking node
    title: string;           // Title of linking node
    context: string;         // Surrounding text with link
  }>;
  total: number;
}
```

**Example**:
```typescript
const result = await mcp.callTool('get_backlinks', {
  path: 'concepts/knowledge-graph.md'
});
```

**Source**: Shadow cache (fast - maintains backlink index)

---

## AI-Enhanced Operations

### extract_memories

**Purpose**: Extract structured memories from node content using Claude API

**Parameters**:
```typescript
{
  path: string;
  categories?: string[];     // Default: ['episodic', 'procedural', 'semantic', 'technical', 'context']
  storeInCache?: boolean;    // Default: true - store in shadow cache
}
```

**Returns**:
```typescript
{
  success: boolean;
  path: string;
  memories: {
    episodic: string[];      // What happened
    procedural: string[];    // How to do it
    semantic: string[];      // General knowledge
    technical: string[];     // Implementation details
    context: string[];       // Why decisions were made
  };
  totalMemories: number;
}
```

**Example**:
```typescript
const result = await mcp.callTool('extract_memories', {
  path: 'decisions/technical/frontend.md'
});

// Result:
// {
//   success: true,
//   path: 'decisions/technical/frontend.md',
//   memories: {
//     episodic: [
//       'Team evaluated React and Svelte for 2 weeks',
//       'Stakeholder meeting on 2025-10-15 discussed concerns'
//     ],
//     procedural: [
//       'To implement graph visualization, use React Flow library',
//       'Configure Vite with TypeScript for type safety'
//     ],
//     semantic: [
//       'React has larger ecosystem but more complexity',
//       'Svelte offers simpler syntax and better performance'
//     ],
//     technical: [
//       'React Flow provides built-in node positioning',
//       'Bundle size: React ~40KB, Svelte ~10KB'
//     ],
//     context: [
//       'Decision driven by team familiarity with React',
//       'Performance less critical than developer velocity'
//     ]
//   },
//   totalMemories: 11
// }
```

**Implementation**: Uses Claude API with structured prompt, can trigger `extract-and-store-memories` workflow

---

### suggest_tags

**Purpose**: AI-powered tag suggestions based on content

**Parameters**:
```typescript
{
  path: string;
  maxTags?: number;          // Default: 5
  excludeExisting?: boolean; // Default: true - don't suggest existing tags
  autoApply?: boolean;       // Default: false - if true, adds tags to frontmatter
}
```

**Returns**:
```typescript
{
  success: boolean;
  path: string;
  suggestedTags: Array<{
    tag: string;
    confidence: number;      // 0-1 confidence score
    reason: string;          // Why this tag was suggested
  }>;
  appliedTags?: string[];    // If autoApply: true
}
```

**Example**:
```typescript
const result = await mcp.callTool('suggest_tags', {
  path: 'concepts/knowledge-graph.md',
  maxTags: 5,
  autoApply: false
});

// Result:
// {
//   success: true,
//   path: 'concepts/knowledge-graph.md',
//   suggestedTags: [
//     {
//       tag: 'graph-theory',
//       confidence: 0.92,
//       reason: 'Content discusses graph structures and relationships'
//     },
//     {
//       tag: 'semantic-web',
//       confidence: 0.85,
//       reason: 'References semantic relationships and RDF'
//     },
//     {
//       tag: 'data-modeling',
//       confidence: 0.78,
//       reason: 'Describes data modeling concepts'
//     }
//   ]
// }
```

---

## Graph Analytics

### get_graph_stats

**Purpose**: Get overall knowledge graph statistics

**Parameters**:
```typescript
{
  includeDistributions?: boolean; // Default: true - include type/tag distributions
}
```

**Returns**:
```typescript
{
  success: boolean;
  stats: {
    totalNodes: number;
    totalLinks: number;
    avgLinksPerNode: number;
    orphanNodes: number;        // Nodes with no links
    nodesByType: {
      concept: number;
      decision: number;
      feature: number;
      technical: number;
      // ...
    };
    topTags: Array<{
      tag: string;
      count: number;
    }>;
    graphDensity: number;       // Links / (nodes * (nodes-1))
    avgPathLength: number;      // Average shortest path between nodes
  };
}
```

**Source**: Shadow cache (pre-computed, fast)

---

### find_hubs

**Purpose**: Find highly connected nodes (potential "hub" concepts)

**Parameters**:
```typescript
{
  minLinks?: number;          // Default: 5
  limit?: number;             // Default: 10
  sortBy?: 'inbound' | 'outbound' | 'total'; // Default: 'total'
}
```

**Returns**:
```typescript
{
  success: boolean;
  hubs: Array<{
    path: string;
    title: string;
    type: string;
    inboundLinks: number;
    outboundLinks: number;
    totalLinks: number;
  }>;
  total: number;
}
```

---

## Tool Implementation Notes

### Performance Characteristics

| Tool | Latency | Source |
|------|---------|--------|
| `create_note` | 10-20ms | ObsidianAPIClient + workflow trigger |
| `read_note` | 5-10ms | ObsidianAPIClient (cached by Obsidian) |
| `update_note` | 10-20ms | ObsidianAPIClient + workflow trigger |
| `search_knowledge_graph` (embeddings) | 2-5ms | Shadow cache vector index |
| `search_knowledge_graph` (full-text) | 50-100ms | ObsidianAPIClient search |
| `query_by_tag` | 1-2ms | Shadow cache indexed query |
| `get_backlinks` | 1-2ms | Shadow cache backlink index |
| `extract_memories` | 2-5s | Claude API call |
| `suggest_tags` | 1-2s | Claude API call |
| `get_graph_stats` | 1-2ms | Shadow cache pre-computed |

### Error Handling

All tools return consistent error format:
```typescript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable message',
    details?: any
  }
}
```

Common error codes:
- `NODE_NOT_FOUND` - Specified path doesn't exist
- `INVALID_PATH` - Path format invalid
- `FRONTMATTER_ERROR` - YAML parsing failed
- `WORKFLOW_FAILED` - Workflow execution error
- `CACHE_ERROR` - Shadow cache operation failed
- `API_ERROR` - Claude API call failed

---

## Related Documentation

- [[claude-flow-tight-coupling]] - Architecture overview
- [[model-context-protocol]] - MCP protocol details
- [[../integrations/obsidian/obsidian-weaver-mcp]] - Integration guide
- [[servers/cyanheads-obsidian-mcp-server]] - Underlying MCP server
- [[agent-rules-workflows]] - Workflow definitions that tools trigger

---

**Status**: ✅ **Active** - MVP tool reference
**Priority**: High
**Last Updated**: 2025-10-23
**Maintainer**: Weaver Team
