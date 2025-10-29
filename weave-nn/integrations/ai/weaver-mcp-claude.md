---
title: Weaver MCP ↔ Claude API Integration
type: documentation
status: active
tags:
  - type/documentation
  - status/in-progress
domain: weaver
priority: medium
visual:
  icon: "\U0001F4DA"
  color: '#06B6D4'
  cssclasses:
    - type-documentation
    - status-active
    - domain-weaver
updated: '2025-10-29T04:55:05.881Z'
version: '3.0'
keywords:
  - overview
  - systems involved
  - weaver mcp
  - claude api
  - integration architecture
  - data flow
  - components
  - configuration
  - environment variables
  - claude desktop configuration
---

# Weaver MCP ↔ Claude API Integration

## Overview

This integration enables Claude Code to access knowledge graph context through Weaver's MCP tools, which are powered by the Claude API for AI-enhanced operations like memory extraction, semantic search, and auto-tagging.

**Key Benefit**: Claude agents benefit from compound learning—each task builds on knowledge from all previous tasks stored in the graph.

## Systems Involved

### Weaver MCP
- **Role**: Gateway (neural network junction)
- **Technology**: `@modelcontextprotocol/sdk` (TypeScript)
- **Transport**: stdio (Claude Code invokes as subprocess)
- **Tools**: Knowledge graph CRUD, semantic search, memory extraction

### Claude API
- **Role**: AI Service (language model)
- **Technology**: Claude 3 models (Opus, Sonnet, Haiku)
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Authentication**: API key via `X-API-Key` header

## Integration Architecture

### Data Flow

```
[Claude Code Agent] → [MCP Protocol] → [Weaver MCP Server]
                                              ↓
                                      [MCP Tool Handler]
                                              ↓
                            ┌─────────────────┴─────────────────┐
                            │                                    │
                  [Direct Operations]                [AI-Enhanced Operations]
                            │                                    │
               [Obsidian API Client]                    [Claude API Client]
                            │                                    │
                            ▼                                    ▼
                   [Knowledge Graph]                 [Semantic Analysis]
                                                                 │
                                                                 ▼
                                                     [Enhanced MCP Response]
```

### Components

#### 1. Claude API Client
**File**: `weaver/src/clients/claude.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

export interface ClaudeConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class ClaudeAPIClient {
  private client: Anthropic;

  constructor(private config: ClaudeConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async extractMemory(content: string, context?: string): Promise<MemoryExtractionResult> {
    logger.info('Extracting memory from content', {
      contentLength: content.length,
      hasContext: !!context,
    });

    const prompt = `Extract key memories from this content. Categorize by:
1. Episodic (what happened)
2. Procedural (how to do it)
3. Semantic (general knowledge)
4. Technical (implementation details)
5. Context (why decisions were made)

${context ? `Context: ${context}\n\n` : ''}Content:
${content}

Return JSON:
{
  "episodic": ["memory1", "memory2"],
  "procedural": ["step1", "step2"],
  "semantic": ["fact1", "fact2"],
  "technical": ["impl1", "impl2"],
  "context": ["reason1", "reason2"]
}`;

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const memories = JSON.parse(textContent.text);

    logger.info('Memory extraction complete', {
      episodicCount: memories.episodic.length,
      proceduralCount: memories.procedural.length,
      semanticCount: memories.semantic.length,
    });

    return memories;
  }

  async semanticSearch(query: string, documents: string[]): Promise<SearchResult[]> {
    logger.info('Performing semantic search', {
      query,
      documentCount: documents.length,
    });

    const prompt = `Rank these documents by relevance to the query: "${query}"

Documents:
${documents.map((doc, i) => `${i + 1}. ${doc.substring(0, 500)}...`).join('\n\n')}

Return JSON array of document indices sorted by relevance (most relevant first):
[1, 3, 2, ...]`;

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1024,
      temperature: 0,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const rankedIndices = JSON.parse(textContent.text);

    return rankedIndices.map((idx: number, rank: number) => ({
      documentIndex: idx - 1, // Convert to 0-based
      rank: rank + 1,
      score: 1 - (rank / rankedIndices.length), // Normalize to 0-1
    }));
  }

  async suggestTags(content: string, existingTags: string[]): Promise<string[]> {
    logger.info('Suggesting tags', {
      contentLength: content.length,
      existingTagsCount: existingTags.length,
    });

    const prompt = `Suggest 5 relevant tags for this content. Consider existing tags in the vault.

Existing tags: ${existingTags.join(', ')}

Content:
${content.substring(0, 2000)}

Return JSON array of suggested tags:
["tag1", "tag2", "tag3", "tag4", "tag5"]`;

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 256,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const tags = JSON.parse(textContent.text);

    logger.info('Tag suggestion complete', { suggestedCount: tags.length });

    return tags;
  }

  async suggestLinks(content: string, availableNotes: string[]): Promise<LinkSuggestion[]> {
    logger.info('Suggesting links', {
      contentLength: content.length,
      availableNotesCount: availableNotes.length,
    });

    const prompt = `Suggest wikilinks for this content based on available notes.

Available notes: ${availableNotes.slice(0, 50).join(', ')}

Content:
${content.substring(0, 2000)}

Return JSON array (max 5 suggestions):
[
  {"note": "existing-note", "confidence": 0.95},
  {"note": "another-note", "confidence": 0.82}
]`;

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 512,
      temperature: 0.5,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const suggestions = JSON.parse(textContent.text);

    logger.info('Link suggestion complete', { suggestedCount: suggestions.length });

    return suggestions;
  }
}

export interface MemoryExtractionResult {
  episodic: string[];
  procedural: string[];
  semantic: string[];
  technical: string[];
  context: string[];
}

export interface SearchResult {
  documentIndex: number;
  rank: number;
  score: number;
}

export interface LinkSuggestion {
  note: string;
  confidence: number;
}
```

#### 2. AI-Enhanced MCP Tools
**File**: `weaver/src/mcp/tools/ai-enhanced.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ClaudeAPIClient } from '../../clients/claude.js';
import { ObsidianAPIClient } from '../../clients/obsidian.js';
import { shadowCache } from '../../database/shadow-cache.js';

export function registerAIEnhancedTools(
  server: Server,
  claudeClient: ClaudeAPIClient,
  obsidianClient: ObsidianAPIClient
) {
  server.setRequestHandler('tools/call', async (request) => {
    // Extract memory from note
    if (request.params.name === 'extract_memory') {
      const { path, contextPath } = request.params.arguments;

      // Read note content
      const content = await obsidianClient.readNote(path);

      // Read context if provided
      let context;
      if (contextPath) {
        context = await obsidianClient.readNote(contextPath);
      }

      // Extract memories using Claude
      const memories = await claudeClient.extractMemory(content, context);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(memories, null, 2)
        }]
      };
    }

    // Semantic search across knowledge graph
    if (request.params.name === 'semantic_search') {
      const { query, limit = 10 } = request.params.arguments;

      // Get all notes from shadow cache
      const allNotes = await shadowCache.getAllNodes();

      // Read content for top candidates (optimize: use embeddings in future)
      const documents = await Promise.all(
        allNotes.slice(0, 50).map(node =>
          obsidianClient.readNote(node.filePath)
        )
      );

      // Rank using Claude
      const results = await claudeClient.semanticSearch(query, documents);

      // Map back to note paths
      const rankedNotes = results.slice(0, limit).map(result => ({
        path: allNotes[result.documentIndex].filePath,
        rank: result.rank,
        score: result.score,
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(rankedNotes, null, 2)
        }]
      };
    }

    // Suggest tags for note
    if (request.params.name === 'suggest_tags') {
      const { path } = request.params.arguments;

      // Read note content
      const content = await obsidianClient.readNote(path);

      // Get all existing tags from vault
      const allTags = await shadowCache.getAllTags();

      // Suggest tags using Claude
      const suggestedTags = await claudeClient.suggestTags(content, allTags);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(suggestedTags, null, 2)
        }]
      };
    }

    // Suggest wikilinks for note
    if (request.params.name === 'suggest_links') {
      const { path } = request.params.arguments;

      // Read note content
      const content = await obsidianClient.readNote(path);

      // Get all available notes
      const allNotes = await shadowCache.getAllNodes();
      const availableNotes = allNotes.map(n => n.filePath);

      // Suggest links using Claude
      const suggestions = await claudeClient.suggestLinks(content, availableNotes);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(suggestions, null, 2)
        }]
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  // Register tool definitions
  server.setRequestHandler('tools/list', async () => {
    return {
      tools: [
        {
          name: 'extract_memory',
          description: 'Extract structured memories from a note using AI',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to note' },
              contextPath: { type: 'string', description: 'Optional context note path' }
            },
            required: ['path']
          }
        },
        {
          name: 'semantic_search',
          description: 'Search knowledge graph using semantic similarity',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              limit: { type: 'number', description: 'Max results', default: 10 }
            },
            required: ['query']
          }
        },
        {
          name: 'suggest_tags',
          description: 'Suggest relevant tags for a note',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to note' }
            },
            required: ['path']
          }
        },
        {
          name: 'suggest_links',
          description: 'Suggest wikilinks for a note',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Path to note' }
            },
            required: ['path']
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
# Claude API Configuration
CLAUDE_API_KEY=<your-anthropic-api-key>
CLAUDE_MODEL=claude-3-5-sonnet-20241022  # or claude-3-opus, claude-3-haiku
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7

# Cost Control (optional)
CLAUDE_MAX_REQUESTS_PER_MINUTE=50
CLAUDE_MAX_TOKENS_PER_HOUR=100000
```

### Claude Desktop Configuration

**File**: `~/.config/claude/config.json`

```json
{
  "mcpServers": {
    "weaver": {
      "command": "node",
      "args": ["/path/to/weaver/dist/mcp/server.js"],
      "env": {
        "OBSIDIAN_API_URL": "https://localhost:27124",
        "OBSIDIAN_API_KEY": "<obsidian-key>",
        "CLAUDE_API_KEY": "<anthropic-key>",
        "CLAUDE_MODEL": "claude-3-5-sonnet-20241022",
        "VAULT_PATH": "/path/to/vault"
      }
    }
  }
}
```

## Data Formats

### Memory Extraction Request

**MCP Tool Call**:
```json
{
  "name": "extract_memory",
  "arguments": {
    "path": "daily-logs/2025-10-23.md",
    "contextPath": "decisions/D-020-adopt-weaver.md"
  }
}
```

**Claude API Request**:
```http
POST https://api.anthropic.com/v1/messages
X-API-Key: <api-key>
Content-Type: application/json

{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 4096,
  "messages": [{
    "role": "user",
    "content": "Extract key memories from this content..."
  }]
}
```

**Response**:
```json
{
  "episodic": [
    "Implemented Weaver MCP server with 4 knowledge graph tools",
    "Tested integration with Claude Code successfully"
  ],
  "procedural": [
    "Register MCP tools using @modelcontextprotocol/sdk",
    "Handle tool calls via request handler pattern"
  ],
  "semantic": [
    "MCP protocol enables AI agents to access external tools",
    "Knowledge graphs benefit from AI-enhanced operations"
  ],
  "technical": [
    "Used stdio transport for MCP server communication",
    "Implemented retry logic with exponential backoff"
  ],
  "context": [
    "Chose MCP for standardization across AI platforms",
    "Prioritized local-first to maintain privacy"
  ]
}
```

## Error Handling

### API Rate Limiting

```typescript
private async withRateLimit<T>(operation: () => Promise<T>): Promise<T> {
  // Check rate limit
  const now = Date.now();
  const requestsInLastMinute = this.requestTimestamps.filter(
    ts => ts > now - 60000
  ).length;

  if (requestsInLastMinute >= this.config.maxRequestsPerMinute) {
    const oldestRequest = this.requestTimestamps[0];
    const waitTime = 60000 - (now - oldestRequest);

    logger.warn('Rate limit exceeded, waiting', { waitTime });
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Execute operation
  this.requestTimestamps.push(now);
  return await operation();
}
```

### Token Limit Exceeded

```typescript
try {
  const response = await this.client.messages.create({
    model: this.config.model,
    max_tokens: this.config.maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
} catch (error) {
  if (error.status === 400 && error.error?.type === 'invalid_request_error') {
    // Prompt too long, truncate and retry
    const truncatedPrompt = prompt.substring(0, 50000);
    logger.warn('Prompt truncated due to length', {
      originalLength: prompt.length,
      truncatedLength: truncatedPrompt.length,
    });

    return await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      messages: [{ role: 'user', content: truncatedPrompt }],
    });
  }
  throw error;
}
```

### API Key Invalid

```typescript
if (error.status === 401) {
  throw new Error(
    'Invalid Claude API key. Please check CLAUDE_API_KEY in .env.\n' +
    'Get your API key from: https://console.anthropic.com/settings/keys'
  );
}
```

## Monitoring and Observability

### Metrics

- **API call rate**: Requests/minute to Claude API
- **Token usage**: Input/output tokens per request
- **Cost tracking**: Estimated cost based on token usage
- **Latency**: p50, p95, p99 for Claude API calls
- **Error rate**: Failed API calls/total calls

### Cost Tracking

```typescript
interface UsageStats {
  inputTokens: number;
  outputTokens: number;
  requests: number;
  estimatedCost: number;
}

export class ClaudeAPIClient {
  private usageStats: UsageStats = {
    inputTokens: 0,
    outputTokens: 0,
    requests: 0,
    estimatedCost: 0,
  };

  private trackUsage(usage: { input_tokens: number; output_tokens: number }) {
    this.usageStats.inputTokens += usage.input_tokens;
    this.usageStats.outputTokens += usage.output_tokens;
    this.usageStats.requests += 1;

    // Estimate cost (Claude 3.5 Sonnet rates)
    const inputCost = (usage.input_tokens / 1000000) * 3; // $3 per 1M tokens
    const outputCost = (usage.output_tokens / 1000000) * 15; // $15 per 1M tokens
    this.usageStats.estimatedCost += inputCost + outputCost;

    logger.info('Claude API usage', {
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      estimatedCost: (inputCost + outputCost).toFixed(4),
      totalCost: this.usageStats.estimatedCost.toFixed(2),
    });
  }

  getUsageStats(): UsageStats {
    return { ...this.usageStats };
  }
}
```

## Testing

### Integration Tests

**File**: `weaver/tests/integration/claude-api.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { ClaudeAPIClient } from '../../src/clients/claude.js';

describe('Claude API Integration', () => {
  const client = new ClaudeAPIClient({
    apiKey: process.env.CLAUDE_API_KEY!,
    model: 'claude-3-5-haiku-20241022', // Use cheaper model for tests
    maxTokens: 1024,
    temperature: 0.7,
  });

  it('should extract memories from content', async () => {
    const content = `
# Daily Log 2025-10-23

Today I implemented the Weaver MCP server. Key decisions:
- Used @modelcontextprotocol/sdk for standardization
- Implemented 4 knowledge graph tools
- Chose stdio transport for simplicity
    `;

    const memories = await client.extractMemory(content);

    expect(memories.episodic).toContain(expect.stringContaining('Weaver MCP'));
    expect(memories.technical).toContain(expect.stringContaining('@modelcontextprotocol/sdk'));
  });

  it('should suggest relevant tags', async () => {
    const content = `
# Neural Network Junction

Weaver acts as a junction point where multiple AI systems...
    `;

    const tags = await client.suggestTags(content, ['ai', 'architecture']);

    expect(tags).toHaveLength(5);
    expect(tags).toContain(expect.stringMatching(/neural|network|ai/i));
  });
});
```

## Deployment

### Prerequisites

1. **Anthropic API Key** - Obtained from https://console.anthropic.com
2. **Weaver MCP Server** - Built and configured
3. **Claude Code** - Installed with Weaver MCP configured

### Deployment Steps

```bash
# 1. Get Claude API key
# Visit: https://console.anthropic.com/settings/keys

# 2. Configure environment
echo "CLAUDE_API_KEY=<your-key>" >> .env
echo "CLAUDE_MODEL=claude-3-5-sonnet-20241022" >> .env

# 3. Verify API key
npm run test:claude-api

# 4. Start Weaver (includes MCP server)
npm start

# 5. Test AI-enhanced tools in Claude Code
# Ask: "Extract memories from my daily log for today"
# Claude should use the extract_memory MCP tool
```

## Troubleshooting

### Issue: "Invalid API key"

**Solution**:
```bash
# Verify key is set
echo $CLAUDE_API_KEY

# Test key manually
curl https://api.anthropic.com/v1/messages \
  -H "X-API-Key: $CLAUDE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Issue: "Rate limit exceeded"

**Solution**: Implement request queuing with backoff (already handled in `withRateLimit` method).

### Issue: "High API costs"

**Solution**:
1. Use cheaper models for non-critical operations (Haiku instead of Opus)
2. Implement caching for frequent queries
3. Set cost alerts in Anthropic console

## Related Documentation

- [[integrations/obsidian/obsidian-weaver-mcp|Obsidian ↔ Weaver MCP]]
- [[technical/modelcontextprotocol-sdk|MCP SDK]]
- [[concepts/neural-network-junction|Neural Network Junction]]
- [[docs/local-first-architecture-overview|Local-First Architecture]]

## Maintenance

### Version Compatibility

- **@anthropic-ai/sdk**: v0.20.0+
- **Claude Models**: 3.5 Sonnet, 3.5 Opus, 3.5 Haiku
- **@modelcontextprotocol/sdk**: v0.5.0+

### Update Schedule

- **API client updates**: Monthly
- **Model updates**: As released by Anthropic
- **Cost review**: Weekly
- **Performance optimization**: Quarterly

---

**Status**: ✅ **Active** - Core MVP integration
**Last Updated**: 2025-10-23
**Maintainer**: Weave-NN Team
