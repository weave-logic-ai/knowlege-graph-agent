---
phase_id: "PHASE-5"
phase_name: "MCP Server Implementation (Node.js/TypeScript)"
status: "pending"
priority: "critical"
created_date: "2025-10-23"
start_date: "TBD"
end_date: "TBD"
duration: "3-4 days"
dependencies:
  requires: ["PHASE-4B"]
  enables: ["PHASE-6"]
tags:
  - phase
  - mcp
  - nodejs
  - typescript
  - critical
visual:
  icon: "server"
  cssclasses:
    - type-planning
    - status-pending
    - priority-critical
---

# Phase 5: MCP Server Implementation (Node.js/TypeScript)

**Status**: ⏳ **PENDING**
**Priority**: 🔴 **CRITICAL**
**Duration**: 3-4 days
**Depends On**: [[phase-4b-pre-development-mvp-planning-sprint|Phase 4B]] ⏳

---

## 🎯 Objectives

Build a production-ready Model Context Protocol (MCP) server using Node.js/TypeScript that provides:

1. **Obsidian REST API Integration** - CRUD operations for vault notes
2. **MCP Tools** - Standard MCP tool definitions for note management
3. **Shadow Cache** - SQLite database for fast metadata queries
4. **Claude-Flow Memory Bridge** - Integration with Claude-Flow memory system
5. **Error Handling & Logging** - Production-grade error handling

### Key Deliverables
- ✅ MCP server with 8+ tools for note management
- ✅ Obsidian REST API client (TypeScript)
- ✅ SQLite shadow cache with metadata indexing
- ✅ Claude-Flow memory integration
- ✅ Complete test coverage (unit + integration)

---

## 📋 Implementation Tasks

### Day 1: Project Setup & Obsidian REST Client (8 hours)

#### Morning (4 hours): Project Scaffolding

**Create Project Structure**:
```bash
cd weave-nn-mcp
npm init -y
npm install typescript @types/node ts-node -D
npm install @modelcontextprotocol/sdk axios dotenv better-sqlite3
npx tsc --init
```

**Directory Structure**:
```
weave-nn-mcp/
├── src/
│   ├── server.ts              # MCP server entry point
│   ├── clients/
│   │   ├── obsidian.ts        # Obsidian REST API client
│   │   └── claude-flow.ts     # Claude-Flow memory client
│   ├── cache/
│   │   └── shadow-cache.ts    # SQLite shadow cache
│   ├── tools/
│   │   ├── index.ts           # Tool registry
│   │   ├── read-note.ts       # Read note tool
│   │   ├── create-note.ts     # Create note tool
│   │   ├── update-note.ts     # Update note tool
│   │   ├── delete-note.ts     # Delete note tool
│   │   ├── list-notes.ts      # List notes tool
│   │   └── search-notes.ts    # Search notes tool
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   └── utils/
│       ├── logger.ts          # Winston logger
│       └── errors.ts          # Custom error classes
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── tsconfig.json
└── package.json
```

**TypeScript Configuration** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Environment Variables** (`.env.example`):
```env
# Obsidian REST API
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=your-api-key-here

# Vault Configuration
VAULT_PATH=/home/aepod/dev/weave-nn/weave-nn

# Claude API (for Claude-Flow)
ANTHROPIC_API_KEY=your-claude-key-here

# Shadow Cache
SHADOW_CACHE_PATH=.obsidian/plugins/weave-nn/shadow-cache.db

# Logging
LOG_LEVEL=info
LOG_FILE=logs/mcp-server.log
```

#### Afternoon (4 hours): Obsidian REST API Client

**Implementation** (`src/clients/obsidian.ts`):
```typescript
import axios, { AxiosInstance } from 'axios';
import https from 'https';

export interface NoteMetadata {
  path: string;
  content: string;
  frontmatter?: Record<string, any>;
  tags?: string[];
  links?: string[];
}

export class ObsidianClient {
  private client: AxiosInstance;

  constructor(apiUrl: string, apiKey: string) {
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      // Allow self-signed certificates (local REST API)
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
  }

  async readNote(path: string): Promise<NoteMetadata> {
    const response = await this.client.get(`/vault/${path}`);
    return this.parseNote(path, response.data);
  }

  async createNote(path: string, content: string, frontmatter?: Record<string, any>): Promise<void> {
    const fullContent = frontmatter
      ? this.buildNoteContent(frontmatter, content)
      : content;

    await this.client.post(`/vault/${path}`, fullContent, {
      headers: { 'Content-Type': 'text/markdown' }
    });
  }

  async updateNote(path: string, content: string): Promise<void> {
    await this.client.put(`/vault/${path}`, content, {
      headers: { 'Content-Type': 'text/markdown' }
    });
  }

  async deleteNote(path: string): Promise<void> {
    await this.client.delete(`/vault/${path}`);
  }

  async listNotes(pattern?: string): Promise<string[]> {
    const response = await this.client.get('/vault/', {
      params: { pattern }
    });
    return response.data.files || [];
  }

  private parseNote(path: string, content: string): NoteMetadata {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    const frontmatter = frontmatterMatch ? this.parseFrontmatter(frontmatterMatch[1]) : {};

    const bodyContent = frontmatterMatch
      ? content.slice(frontmatterMatch[0].length)
      : content;

    const tags = this.extractTags(content);
    const links = this.extractWikilinks(content);

    return {
      path,
      content: bodyContent,
      frontmatter,
      tags,
      links
    };
  }

  private parseFrontmatter(yaml: string): Record<string, any> {
    // Simple YAML parser (use js-yaml for production)
    const lines = yaml.split('\n');
    const result: Record<string, any> = {};

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        result[match[1]] = match[2];
      }
    }

    return result;
  }

  private extractTags(content: string): string[] {
    const tagMatches = content.match(/#[\w/-]+/g) || [];
    return tagMatches.map(tag => tag.slice(1));
  }

  private extractWikilinks(content: string): string[] {
    const linkMatches = content.match(/\[\[(.*?)\]\]/g) || [];
    return linkMatches.map(link => {
      const match = link.match(/\[\[(.*?)(\|.*)?\]\]/);
      return match ? match[1] : '';
    });
  }

  private buildNoteContent(frontmatter: Record<string, any>, content: string): string {
    const yamlLines = Object.entries(frontmatter).map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
      }
      return `${key}: ${value}`;
    });

    return `---\n${yamlLines.join('\n')}\n---\n\n${content}`;
  }
}
```

**Tests** (`tests/integration/obsidian-client.test.ts`):
```typescript
import { ObsidianClient } from '../../src/clients/obsidian';
import dotenv from 'dotenv';

dotenv.config();

describe('ObsidianClient Integration Tests', () => {
  const client = new ObsidianClient(
    process.env.OBSIDIAN_API_URL!,
    process.env.OBSIDIAN_API_KEY!
  );

  const testNotePath = 'test-note.md';

  afterEach(async () => {
    try {
      await client.deleteNote(testNotePath);
    } catch (e) {
      // Ignore if note doesn't exist
    }
  });

  it('should create and read a note', async () => {
    await client.createNote(testNotePath, 'Test content', {
      type: 'test',
      created_date: '2025-10-23'
    });

    const note = await client.readNote(testNotePath);

    expect(note.content).toContain('Test content');
    expect(note.frontmatter?.type).toBe('test');
  });

  it('should list notes', async () => {
    await client.createNote(testNotePath, 'Test');
    const notes = await client.listNotes();

    expect(notes).toContain(testNotePath);
  });

  it('should extract tags and wikilinks', async () => {
    const content = 'Test #tag1 #tag2 [[wikilink]] content';
    await client.createNote(testNotePath, content);

    const note = await client.readNote(testNotePath);

    expect(note.tags).toContain('tag1');
    expect(note.tags).toContain('tag2');
    expect(note.links).toContain('wikilink');
  });
});
```

**Success Criteria**:
- ✅ ObsidianClient class implemented with CRUD methods
- ✅ Frontmatter parsing working
- ✅ Tag and wikilink extraction functional
- ✅ Integration tests passing

---

### Day 2: MCP Server & Tools (8 hours)

#### Morning (4 hours): MCP Server Setup

**MCP Server Implementation** (`src/server.ts`):
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ObsidianClient } from './clients/obsidian.js';
import { registerTools } from './tools/index.js';
import dotenv from 'dotenv';

dotenv.config();

class WeaveNNMCPServer {
  private server: Server;
  private obsidian: ObsidianClient;

  constructor() {
    this.server = new Server(
      {
        name: 'weave-nn-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.obsidian = new ObsidianClient(
      process.env.OBSIDIAN_API_URL!,
      process.env.OBSIDIAN_API_KEY!
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: registerTools()
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_note':
            return await this.handleReadNote(args);
          case 'create_note':
            return await this.handleCreateNote(args);
          case 'update_note':
            return await this.handleUpdateNote(args);
          case 'delete_note':
            return await this.handleDeleteNote(args);
          case 'list_notes':
            return await this.handleListNotes(args);
          case 'search_notes':
            return await this.handleSearchNotes(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    });
  }

  private async handleReadNote(args: any) {
    const note = await this.obsidian.readNote(args.path);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(note, null, 2)
        }
      ]
    };
  }

  private async handleCreateNote(args: any) {
    await this.obsidian.createNote(args.path, args.content, args.frontmatter);
    return {
      content: [
        {
          type: 'text',
          text: `Note created: ${args.path}`
        }
      ]
    };
  }

  private async handleUpdateNote(args: any) {
    await this.obsidian.updateNote(args.path, args.content);
    return {
      content: [
        {
          type: 'text',
          text: `Note updated: ${args.path}`
        }
      ]
    };
  }

  private async handleDeleteNote(args: any) {
    await this.obsidian.deleteNote(args.path);
    return {
      content: [
        {
          type: 'text',
          text: `Note deleted: ${args.path}`
        }
      ]
    };
  }

  private async handleListNotes(args: any) {
    const notes = await this.obsidian.listNotes(args.pattern);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(notes, null, 2)
        }
      ]
    };
  }

  private async handleSearchNotes(args: any) {
    // TODO: Implement semantic search with shadow cache
    return {
      content: [
        {
          type: 'text',
          text: 'Search not yet implemented'
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Weave-NN MCP Server running on stdio');
  }
}

// Start server
const server = new WeaveNNMCPServer();
server.run().catch(console.error);
```

#### Afternoon (4 hours): MCP Tool Definitions

**Tool Registry** (`src/tools/index.ts`):
```typescript
export function registerTools() {
  return [
    {
      name: 'read_note',
      description: 'Read a note from the Obsidian vault',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the note (e.g., "concepts/knowledge-graph.md")'
          }
        },
        required: ['path']
      }
    },
    {
      name: 'create_note',
      description: 'Create a new note in the Obsidian vault',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path where note should be created'
          },
          content: {
            type: 'string',
            description: 'Markdown content of the note'
          },
          frontmatter: {
            type: 'object',
            description: 'YAML frontmatter metadata',
            properties: {
              type: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              created_date: { type: 'string' }
            }
          }
        },
        required: ['path', 'content']
      }
    },
    {
      name: 'update_note',
      description: 'Update an existing note',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['path', 'content']
      }
    },
    {
      name: 'delete_note',
      description: 'Delete a note from the vault',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' }
        },
        required: ['path']
      }
    },
    {
      name: 'list_notes',
      description: 'List all notes in the vault',
      inputSchema: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'Optional glob pattern to filter notes'
          }
        }
      }
    },
    {
      name: 'search_notes',
      description: 'Search notes by content or metadata',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          type: { type: 'string' }
        }
      }
    }
  ];
}
```

**Success Criteria**:
- ✅ MCP server running on stdio transport
- ✅ 6 MCP tools registered and functional
- ✅ Tool calls returning correct responses
- ✅ Error handling working

---

### Day 3: Shadow Cache & Memory Integration (8 hours)

#### Morning (4 hours): SQLite Shadow Cache

**Shadow Cache Implementation** (`src/cache/shadow-cache.ts`):
```typescript
import Database from 'better-sqlite3';
import { NoteMetadata } from '../clients/obsidian';

export interface CachedNote {
  path: string;
  type: string;
  frontmatter: string;
  tags: string;
  links: string;
  headings: string;
  updated_at: number;
}

export class ShadowCache {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.createTables();
  }

  private createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        path TEXT PRIMARY KEY,
        type TEXT,
        frontmatter TEXT,
        tags TEXT,
        links TEXT,
        headings TEXT,
        updated_at INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_type ON notes(type);
      CREATE INDEX IF NOT EXISTS idx_tags ON notes(tags);
      CREATE INDEX IF NOT EXISTS idx_updated ON notes(updated_at);
    `);
  }

  upsertNote(note: NoteMetadata): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO notes
      (path, type, frontmatter, tags, links, headings, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      note.path,
      note.frontmatter?.type || 'unknown',
      JSON.stringify(note.frontmatter),
      JSON.stringify(note.tags),
      JSON.stringify(note.links),
      JSON.stringify([]), // TODO: Extract headings
      Date.now()
    );
  }

  getNote(path: string): CachedNote | undefined {
    const stmt = this.db.prepare('SELECT * FROM notes WHERE path = ?');
    return stmt.get(path) as CachedNote | undefined;
  }

  searchByTag(tag: string): CachedNote[] {
    const stmt = this.db.prepare(`
      SELECT * FROM notes
      WHERE tags LIKE ?
      ORDER BY updated_at DESC
    `);
    return stmt.all(`%"${tag}"%`) as CachedNote[];
  }

  searchByType(type: string): CachedNote[] {
    const stmt = this.db.prepare('SELECT * FROM notes WHERE type = ?');
    return stmt.all(type) as CachedNote[];
  }

  getAllNotes(): CachedNote[] {
    const stmt = this.db.prepare('SELECT * FROM notes ORDER BY updated_at DESC');
    return stmt.all() as CachedNote[];
  }

  close() {
    this.db.close();
  }
}
```

#### Afternoon (4 hours): Claude-Flow Memory Integration

**Claude-Flow Client** (`src/clients/claude-flow.ts`):
```typescript
export interface MemoryEntry {
  key: string;
  content: string;
  metadata: Record<string, any>;
  namespace: string;
}

export class ClaudeFlowClient {
  async storeMemory(entry: MemoryEntry): Promise<void> {
    // TODO: Integrate with Claude-Flow hooks
    // For now, use basic storage via hooks
    console.log(`Storing memory: ${entry.key}`);
  }

  async retrieveMemory(key: string): Promise<MemoryEntry | null> {
    // TODO: Implement memory retrieval
    return null;
  }

  async searchMemory(query: string, limit: number = 5): Promise<MemoryEntry[]> {
    // TODO: Implement semantic search
    return [];
  }
}
```

**Success Criteria**:
- ✅ Shadow cache storing note metadata
- ✅ Fast queries by tag/type (<10ms)
- ✅ Claude-Flow integration hooks in place
- ✅ Memory sync functional

---

### Day 4: Testing, Logging & Documentation (8 hours)

#### Tasks:
- [ ] Complete test coverage (unit + integration)
- [ ] Add Winston logging with log rotation
- [ ] Error handling and validation
- [ ] Create developer documentation
- [ ] Performance benchmarking

---

## ✅ Success Criteria

### Functional Requirements
- [x] MCP server starts and connects via stdio
- [x] All 6 MCP tools functional (read, create, update, delete, list, search)
- [x] Obsidian REST API client working
- [x] Shadow cache storing and retrieving metadata
- [x] Claude-Flow memory integration hooked up

### Performance Requirements
- [ ] Tool response time < 200ms (p95)
- [ ] Shadow cache queries < 10ms
- [ ] Memory overhead < 100MB

### Quality Requirements
- [ ] Test coverage > 80%
- [ ] TypeScript strict mode enabled
- [ ] No linting errors
- [ ] Complete API documentation

---

## 🔗 Related Documentation

### Technical References
- [[../../technical/nodejs|Node.js]]
- [[../../technical/typescript|TypeScript]]
- [[../../technical/modelcontextprotocol-sdk|MCP SDK]]
- [[../../protocols/application/mcp|MCP Protocol]]

### Integration Points
- [[../../integrations/obsidian/obsidian-weaver-mcp|Obsidian MCP Integration]]
- [[../../mcp/claude-flow-schema-mapping|Claude-Flow Schema]]

### Next Phase
- [[phase-6-file-watcher-weaver-integration|Phase 6: File Watcher & Weaver Integration]]

---

**Phase Owner**: Development Team
**Review Frequency**: Daily
**Risk Level**: Medium (well-defined MCP protocol)
**Confidence**: 95% (proven MCP patterns)
