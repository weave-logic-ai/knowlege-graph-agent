---
title: Model Context Protocol (MCP)
type: protocol
category: integration
tags:
  - mcp
  - protocol
  - ai-integration
  - context-management
created: 2025-10-20
related:
  - "[[ai-agent-integration]]"
  - "[[cyanheads-obsidian-mcp-server]]"
  - "[[knowledge-graph]]"
---

# Model Context Protocol (MCP)

## What is MCP?

The Model Context Protocol (MCP) is an open standard that enables AI applications to securely connect with external data sources and tools. It provides a universal, standardized way for AI models to interact with various systems, from local files to remote APIs, without requiring custom integrations for each platform.

MCP acts as a bridge between AI agents and their operational environment, defining how context is shared, how tools are invoked, and how data flows between the model and external systems. It abstracts away the complexity of different APIs and interfaces, presenting a consistent protocol that AI agents can rely on.

## Why MCP Matters for Weave-NN

In the context of Weave-NN, MCP is foundational to creating a dynamic, AI-editable knowledge graph. Without MCP, AI agents would need custom code to interact with each component of the system - the Obsidian vault, file systems, databases, and other tools. MCP eliminates this friction by providing a standardized interface.

For Weave-NN specifically, MCP enables:

- **Direct Vault Manipulation**: AI agents can read, create, and modify notes in the Obsidian vault through MCP servers
- **Tool Composition**: Multiple MCP servers can work together, allowing agents to combine vault operations with file system access, search, and other capabilities
- **Context Awareness**: MCP ensures agents have proper context about the knowledge graph structure, relationships, and metadata
- **Secure Operations**: MCP provides controlled, permission-based access to sensitive knowledge assets

## How It Enables Weave-NN

Weave-NN leverages MCP as its core integration layer. The [[cyanheads-obsidian-mcp-server]] implements MCP to expose Obsidian vault operations as standardized tools. When an AI agent needs to update the knowledge graph, it uses MCP tool calls rather than direct file manipulation, ensuring consistency and maintaining graph integrity.

This architecture makes Weave-NN extensible - new capabilities can be added by implementing additional MCP servers, without modifying the core agent logic.

---

## Integration Examples

**Status**: ✅ **IMPLEMENTED** - MCP integration layer complete
**Last Updated**: 2025-10-22

### ObsidianAPIClient MCP Integration

The ObsidianAPIClient serves as the primary transport layer for MCP operations in Weave-NN. It provides standardized access to vault operations that MCP tools expose to AI agents.

**Architecture**:
```
AI Agent (Claude)
    ↓ (MCP Protocol)
MCP Server (cyanheads/obsidian-mcp-server)
    ↓ (HTTP/REST)
ObsidianAPIClient
    ↓ (Local REST API)
Obsidian Vault
```

**MCP Tool Implementation**:

```javascript
// MCP server using ObsidianAPIClient
const ObsidianAPIClient = require('./src/clients/ObsidianAPIClient');

class ObsidianMCPServer {
  constructor(config) {
    this.client = new ObsidianAPIClient({
      apiUrl: config.apiUrl || 'http://localhost:27123',
      apiKey: config.apiKey,
      cacheEnabled: true,
      cacheTTL: 60000
    });
  }

  // MCP Tool: read_note
  async readNote(params) {
    try {
      const note = await this.client.getNote(params.path);
      return {
        success: true,
        content: note.content,
        frontmatter: note.frontmatter,
        path: params.path
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  // MCP Tool: update_note
  async updateNote(params) {
    try {
      await this.client.updateNote(params.path, {
        content: params.content,
        frontmatter: params.frontmatter
      });
      return {
        success: true,
        path: params.path,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MCP Tool: manage_frontmatter
  async manageFrontmatter(params) {
    try {
      await this.client.updateFrontmatter(params.path, params.updates);
      return {
        success: true,
        path: params.path,
        updates: params.updates
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MCP Tool: global_search
  async globalSearch(params) {
    try {
      const results = await this.client.searchNotes(params.query);
      return {
        success: true,
        results: results.map(r => ({
          path: r.path,
          score: r.score,
          excerpt: r.excerpt
        })),
        total: results.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // MCP Tool: manage_tags
  async manageTags(params) {
    try {
      if (params.action === 'add') {
        await this.client.addTags(params.path, params.tags);
      } else if (params.action === 'remove') {
        await this.client.removeTags(params.path, params.tags);
      }

      return {
        success: true,
        path: params.path,
        action: params.action,
        tags: params.tags
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Initialize MCP server
const mcpServer = new ObsidianMCPServer({
  apiUrl: process.env.OBSIDIAN_API_URL,
  apiKey: process.env.OBSIDIAN_API_KEY
});

// Export tools for MCP protocol
module.exports = {
  read_note: mcpServer.readNote.bind(mcpServer),
  update_note: mcpServer.updateNote.bind(mcpServer),
  manage_frontmatter: mcpServer.manageFrontmatter.bind(mcpServer),
  global_search: mcpServer.globalSearch.bind(mcpServer),
  manage_tags: mcpServer.manageTags.bind(mcpServer)
};
```

### Weaver Workflow Integration via MCP (MVP)

**Updated for MVP**: Weaver uses durable workflows instead of event-driven RuleEngine.

**Workflow Flow**:
```
AI Agent creates/updates note via MCP
    ↓
Weaver MCP Server (ObsidianAPIClient executes operation)
    ↓
File written to vault
    ↓
File watcher (chokidar) detects change
    ↓
Triggers durable workflow (vault-file-created/updated)
    ↓
Workflow executes steps: parse, validate, cache update, link maintenance
```

**Key Difference**: Workflows are **stateful** and **resumable** - if Weaver crashes at Step 3, it resumes from Step 4 on restart.

**Implementation**:

```typescript
// Weaver MCP Server with workflow integration
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ObsidianAPIClient } from './clients/obsidian.js';
import { triggerWorkflow } from '@workflowdev/sdk';

export class WeaverMCPServer {
  private server: Server;
  private obsidianClient: ObsidianAPIClient;

  constructor(config) {
    this.server = new Server(
      { name: 'weaver', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.obsidianClient = new ObsidianAPIClient({
      apiUrl: config.obsidianApiUrl,
      apiKey: config.obsidianApiKey
    });

    this.registerTools();
  }

  private registerTools() {
    // MCP Tool: create_note
    this.server.setRequestHandler('tools/call', async (request) => {
      if (request.params.name === 'create_note') {
        const { path, content, frontmatter } = request.params.arguments;

        // Write file via ObsidianAPIClient
        await this.obsidianClient.createNote(path, {
          frontmatter,
          content
        });

        // File watcher will detect the new file and trigger vault-file-created workflow
        // No need to manually trigger - chokidar handles it automatically

        return {
          content: [{
            type: 'text',
            text: `Created note: ${path}. Workflow triggered automatically.`
          }]
        };
      }

      if (request.params.name === 'update_note') {
        const { path, content, frontmatter } = request.params.arguments;

        // Update file via ObsidianAPIClient
        await this.obsidianClient.updateNote(path, {
          frontmatter,
          content
        });

        // File watcher will detect the change and trigger vault-file-updated workflow

        return {
          content: [{
            type: 'text',
            text: `Updated note: ${path}. Workflow triggered automatically.`
          }]
        };
      }

      if (request.params.name === 'search_knowledge_graph') {
        const { query } = request.params.arguments;

        // Query shadow cache (fast) or ObsidianAPIClient (comprehensive)
        const results = await this.searchKnowledgeGraph(query);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results, null, 2)
          }]
        };
      }
    });
  }

  private async searchKnowledgeGraph(query: string) {
    // Try shadow cache first (2-3ms)
    const cachedResults = await shadowCache.search(query);

    if (cachedResults.length > 0) {
      return cachedResults;
    }

    // Fall back to ObsidianAPIClient full-text search (50-100ms)
    const searchResults = await this.obsidianClient.searchNotes(query);
    return searchResults;
  }
}

// Durable workflow triggered automatically by file watcher
export const vaultFileCreatedWorkflow = workflow(
  'vault-file-created',
  async (ctx, input: { filePath: string; absolutePath: string; timestamp: number }) => {
    // Step 1: Read file
    const content = await ctx.step('read-file', async () => {
      return await readFile(input.absolutePath, 'utf-8');
    });

    // Step 2: Parse frontmatter
    const { frontmatter, body } = await ctx.step('parse-frontmatter', async () => {
      return parseFrontmatter(content);
    });

    // Step 3: Validate schema
    await ctx.step('validate-schema', async () => {
      const validator = getValidatorForType(frontmatter.type);
      const validation = validator.validate(frontmatter);

      if (!validation.valid) {
        // Auto-fix missing fields
        const fixes = generateAutoFixes(validation.errors);
        if (Object.keys(fixes).length > 0) {
          await obsidianClient.updateFrontmatter(input.filePath, fixes);
        }
      }
    });

    // Step 4: Update shadow cache
    await ctx.step('update-shadow-cache', async () => {
      await shadowCache.upsertNode({
        filePath: input.filePath,
        nodeType: frontmatter.type || 'note',
        frontmatter,
        tags: frontmatter.tags || [],
        links: extractWikilinks(body),
        updatedAt: new Date(input.timestamp),
      });
    });

    // Step 5: Ensure bidirectional links
    const wikilinks = extractWikilinks(body);
    await ctx.step('ensure-bidirectional-links', async () => {
      for (const link of wikilinks) {
        await ctx.child('ensure-bidirectional-link', {
          sourceFile: input.filePath,
          targetLink: link
        });
      }
    });

    return { success: true, linksProcessed: wikilinks.length };
  }
);
```

**Benefits**:
- ✅ **Automatic triggering**: File watcher detects changes, no manual workflow triggers needed
- ✅ **Crash recovery**: Workflow resumes from last completed step
- ✅ **No events to lose**: Workflow state persisted to SQLite
- ✅ **Observability**: Full execution history available via workflow.dev dashboard
- ✅ **Simple testing**: Test workflows with in-memory engine (no RabbitMQ needed)

---

### Legacy: RuleEngine Event Handling via MCP

**Note**: This approach was replaced by durable workflows for MVP. Kept for reference.

**Old Event Flow**:
```
AI Agent creates/updates note via MCP
    ↓
ObsidianAPIClient executes operation
    ↓
Client emits event
    ↓
RuleEngine evaluates rules
    ↓
Rules execute actions (create nodes, update links, validate schema)
```

**Implementation**:

```javascript
const { RuleEngine, RulePriority } = require('./src/agents/RuleEngine');
const ObsidianAPIClient = require('./src/clients/ObsidianAPIClient');
const EventEmitter = require('events');

// Extend ObsidianAPIClient with event emitting
class EventfulObsidianClient extends ObsidianAPIClient {
  constructor(config) {
    super(config);
    this.events = new EventEmitter();
  }

  async createNote(path, data) {
    const result = await super.createNote(path, data);

    // Emit event for rule engine
    this.events.emit('note:created', {
      path,
      frontmatter: data.frontmatter,
      timestamp: Date.now()
    });

    return result;
  }

  async updateNote(path, updates) {
    const result = await super.updateNote(path, updates);

    // Emit event
    this.events.emit('note:updated', {
      path,
      updates,
      timestamp: Date.now()
    });

    return result;
  }

  async updateFrontmatter(path, updates) {
    const result = await super.updateFrontmatter(path, updates);

    // Emit event with changed fields
    this.events.emit('frontmatter:updated', {
      path,
      changes: updates,
      timestamp: Date.now()
    });

    return result;
  }
}

// Initialize integrated system
const client = new EventfulObsidianClient({
  apiUrl: process.env.OBSIDIAN_API_URL,
  apiKey: process.env.OBSIDIAN_API_KEY
});

const ruleEngine = new RuleEngine({
  conflictStrategy: ConflictStrategy.PRIORITY,
  enableMetrics: true
});

// Define rules that respond to MCP events
ruleEngine.addRule({
  id: 'schema-validation-on-create',
  name: 'Schema Validation on Note Creation',
  priority: RulePriority.CRITICAL,
  tags: ['validation', 'mcp'],
  condition: (context) => context.event === 'note:created',
  action: async (context) => {
    const { path, frontmatter } = context.data;

    // Validate required fields based on type
    const requiredFields = {
      concept: ['concept_id', 'concept_name', 'type', 'created_date'],
      decision: ['decision_id', 'title', 'status', 'created_date'],
      feature: ['feature_id', 'feature_name', 'status', 'release']
    };

    const type = frontmatter?.type;
    const required = requiredFields[type];

    if (required) {
      const missing = required.filter(field => !frontmatter[field]);

      if (missing.length > 0) {
        console.warn(`⚠ Missing required fields in ${path}: ${missing.join(', ')}`);

        // Auto-fix: Add default values
        const updates = {};
        missing.forEach(field => {
          if (field === 'created_date') {
            updates[field] = new Date().toISOString().split('T')[0];
          } else if (field.endsWith('_id')) {
            updates[field] = `AUTO-${Date.now()}`;
          }
        });

        if (Object.keys(updates).length > 0) {
          await client.updateFrontmatter(path, updates);
          return { fixed: true, updates };
        }
      }
    }

    return { valid: true };
  }
});

ruleEngine.addRule({
  id: 'auto-linking-on-update',
  name: 'Auto-linking on Content Update',
  priority: RulePriority.MEDIUM,
  tags: ['linking', 'mcp'],
  condition: (context) => context.event === 'note:updated',
  action: async (context) => {
    const { path, updates } = context.data;

    if (!updates.content) return { skipped: true };

    // Extract potential link targets from content
    const noteNames = await client.listNotes();
    const suggestions = [];

    for (const notePath of noteNames) {
      const noteName = notePath.split('/').pop().replace('.md', '');

      // Simple keyword matching (can be enhanced with NLP)
      if (updates.content.includes(noteName) &&
          !updates.content.includes(`[[${noteName}]]`)) {
        suggestions.push(noteName);
      }
    }

    if (suggestions.length > 0) {
      console.log(`💡 Link suggestions for ${path}: ${suggestions.join(', ')}`);
      return { suggestions, count: suggestions.length };
    }

    return { suggestions: [] };
  }
});

// Connect events to rule engine
client.events.on('note:created', async (data) => {
  await ruleEngine.evaluate({
    event: 'note:created',
    data
  }, { tags: ['mcp'] });
});

client.events.on('note:updated', async (data) => {
  await ruleEngine.evaluate({
    event: 'note:updated',
    data
  }, { tags: ['mcp'] });
});

client.events.on('frontmatter:updated', async (data) => {
  await ruleEngine.evaluate({
    event: 'frontmatter:updated',
    data
  }, { tags: ['mcp'] });
});

// Export MCP server with integrated rules
module.exports = {
  client,
  ruleEngine,

  // MCP tools with automatic rule execution
  async read_note(params) {
    return await client.getNote(params.path);
  },

  async update_note(params) {
    // Rules automatically triggered by events
    return await client.updateNote(params.path, {
      content: params.content,
      frontmatter: params.frontmatter
    });
  },

  async create_note(params) {
    // Rules automatically triggered by events
    return await client.createNote(params.path, {
      frontmatter: params.frontmatter,
      content: params.content
    });
  }
};
```

### Example: AI Agent Workflow with MCP

```javascript
// AI agent creates a new concept via MCP
const result = await mcpTools.create_note({
  path: 'concepts/machine-learning.md',
  frontmatter: {
    concept_name: 'Machine Learning',
    tags: ['concept', 'ai']
    // Missing: concept_id, type, created_date (will be auto-fixed by rule)
  },
  content: '# Machine Learning\n\nML enables computers to learn from data...'
});

// Rule engine automatically:
// 1. Detects missing required fields (schema-validation-on-create rule)
// 2. Auto-fixes: Adds concept_id, type: 'concept', created_date
// 3. Logs validation result
// 4. Returns success

// AI agent updates content
await mcpTools.update_note({
  path: 'concepts/machine-learning.md',
  content: '# Machine Learning\n\nML uses neural networks and deep learning...'
});

// Rule engine automatically:
// 1. Analyzes content for link opportunities (auto-linking-on-update rule)
// 2. Finds: "neural networks" matches concepts/neural-networks.md
// 3. Suggests: [[neural-networks]] wikilink
// 4. Returns suggestions to AI agent for review
```

### Benefits of MCP Integration

1. **Automatic Validation**: Schema rules enforce data integrity on all MCP operations
2. **Event-Driven Automation**: Rules respond to agent actions in real-time
3. **Consistent Error Handling**: ObsidianAPIClient provides uniform error responses
4. **Metrics & Monitoring**: Track all MCP operations and rule executions
5. **Extensibility**: Add new rules without modifying MCP server code

### Related

- [[obsidian-api-client]] - REST API client documentation
- [[rule-engine]] - Rule engine framework
- [[agent-rules]] - MCP agent rules specification
- [[cyanheads-obsidian-mcp-server]] - MCP server implementation

---
