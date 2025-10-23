---
title: AI Model Configuration for Weaver
type: technical-reference
status: active
priority: high
created: 2025-10-23
tags: [ai, configuration, vercel, anthropic, weaver]
related:
  - "[[weaver-mcp-tools]]"
  - "[[agent-rules-workflows]]"
  - "[[model-context-protocol]]"
---

# AI Model Configuration for Weaver

## Overview

Weaver uses **Vercel AI Gateway** as the default AI provider for all model calls, with a fallback to direct Anthropic API for local development tasks with claude-flow agents.

---

## Configuration

### Environment Variables

```bash
# Required for Weaver AI operations
VERCEL_AI_GATEWAY_API_KEY=vck_1H7ExiTyiespMKAVurlWMqACIRtkIyugzquQ9RsmCvVenM555V4BDWse

# Required for local claude-flow development (fallback)
ANTHROPIC_API_KEY=your-anthropic-key-here

# Optional - specify preferred model
DEFAULT_AI_MODEL=claude-3-5-sonnet-20241022
```

---

## AI Provider Strategy

### Default: Vercel AI Gateway

**Use for**:
- All production AI operations in Weaver
- AI-enhanced MCP tools (extract_memories, suggest_tags, generate_summary)
- Embedding generation for semantic search
- Batch processing operations
- Any AI call from Weaver workflows

**Benefits**:
- **Unified model access**: Claude 3.5 Sonnet, Claude 3 Opus, GPT-4, GPT-4 Turbo, Gemini Pro
- **Built-in rate limiting**: Automatic request queuing and throttling
- **Response caching**: Reduces costs for repeated queries (up to 80% cost reduction)
- **Observability dashboard**: Track usage, latency, errors across all models
- **Model fallback**: Automatic retry with alternative model on failures
- **Cost optimization**: Choose best model for each task (e.g., cheaper models for simple tasks)
- **No vendor lock-in**: Easy to switch between models without code changes

**Configuration**:
```typescript
// weaver/src/ai-provider.ts
import { createAI } from '@vercel/ai';

export const ai = createAI({
  apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY,
  defaultModel: 'claude-3-5-sonnet-20241022',
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour cache for repeated queries
  },
  rateLimiting: {
    enabled: true,
    requestsPerMinute: 60,
  },
  fallback: {
    enabled: true,
    models: ['claude-3-opus-20240229', 'gpt-4-turbo-preview'],
  },
});
```

---

### Exception: Direct Anthropic API

**Use for**:
- Local development tasks with claude-flow agents
- Testing new Claude features not yet in Vercel AI Gateway
- Debugging AI behavior without gateway layer
- Development environment only (not production)

**When to use**:
```typescript
// weaver/src/ai-provider.ts
export function getAIProvider(context: 'production' | 'development-claude-flow') {
  if (context === 'development-claude-flow' && process.env.NODE_ENV === 'development') {
    // Direct Anthropic API for local claude-flow development
    return new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  // Default: Vercel AI Gateway for all other cases
  return ai;
}
```

---

## Model Selection Guide

### Available Models via Vercel AI Gateway

| Model | Best For | Cost | Speed | Context |
|-------|----------|------|-------|---------|
| **claude-3-5-sonnet-20241022** | General purpose, code generation | Medium | Fast | 200k |
| **claude-3-opus-20240229** | Complex reasoning, long documents | High | Slow | 200k |
| **gpt-4-turbo-preview** | Alternative to Claude, good at structured output | Medium | Medium | 128k |
| **gpt-4o** | Fast alternative, good at vision tasks | Low | Very Fast | 128k |
| **gemini-1.5-pro** | Very long context, free tier available | Low | Medium | 1M |

---

## Use Cases in Weaver

### 1. Extract Memories (MCP Tool)

**Model**: Claude 3.5 Sonnet
**Why**: Best balance of quality and speed for structured output

```typescript
// weaver/src/mcp-tools/extract-memories.ts
import { ai } from '../ai-provider';

export async function extractMemories(content: string) {
  const response = await ai.chat({
    model: 'claude-3-5-sonnet-20241022',
    messages: [
      {
        role: 'user',
        content: `Extract key memories from this content. Categorize by:
        - Episodic: Events, timeline, narrative
        - Procedural: How-to, processes, workflows
        - Semantic: Concepts, relationships, principles

        Content:
        ${content}`,
      },
    ],
    temperature: 0.3, // Lower temperature for consistent extraction
    cache: true, // Enable caching for repeated content
  });

  return response.choices[0].message.content;
}
```

---

### 2. Suggest Tags (MCP Tool)

**Model**: GPT-4o (faster, cheaper)
**Why**: Simple classification task, no need for Claude's reasoning power

```typescript
// weaver/src/mcp-tools/suggest-tags.ts
import { ai } from '../ai-provider';

export async function suggestTags(content: string, existingTags: string[]) {
  const response = await ai.chat({
    model: 'gpt-4o', // Faster, cheaper for tag suggestions
    messages: [
      {
        role: 'user',
        content: `Suggest 3-5 relevant tags for this content.

        Existing tags in vault: ${existingTags.join(', ')}

        Content:
        ${content}`,
      },
    ],
    temperature: 0.5,
    cache: true,
  });

  return response.choices[0].message.content;
}
```

---

### 3. Generate Summary (MCP Tool)

**Model**: Claude 3.5 Sonnet
**Why**: High-quality summaries with good context understanding

```typescript
// weaver/src/mcp-tools/generate-summary.ts
import { ai } from '../ai-provider';

export async function generateSummary(content: string, maxLength: number = 200) {
  const response = await ai.chat({
    model: 'claude-3-5-sonnet-20241022',
    messages: [
      {
        role: 'user',
        content: `Summarize this content in ${maxLength} words or less:

        ${content}`,
      },
    ],
    temperature: 0.3,
    max_tokens: maxLength * 2, // ~2 tokens per word
    cache: true,
  });

  return response.choices[0].message.content;
}
```

---

### 4. Generate Embeddings (Shadow Cache)

**Model**: OpenAI text-embedding-3-small (via Vercel AI Gateway)
**Why**: Fast, cheap, high-quality embeddings for semantic search

```typescript
// weaver/src/shadow-cache/embeddings.ts
import { ai } from '../ai-provider';

export async function generateEmbedding(content: string): Promise<number[]> {
  const response = await ai.embeddings({
    model: 'text-embedding-3-small', // Fast, cheap, good quality
    input: content,
    cache: true, // Cache embeddings for unchanged content
  });

  return response.data[0].embedding;
}
```

---

### 5. Workflow AI Operations

**Model**: Depends on task complexity

```typescript
// weaver/workflows/extract-and-store-memories.ts
import { workflow } from 'workflow-dev';
import { ai } from '../src/ai-provider';

export const extractAndStoreMemoriesWorkflow = workflow(
  'extract-and-store-memories',
  async (ctx, input: { filePath: string }) => {
    // Step 1: Read file content
    const content = await ctx.step('read-file', async () => {
      return await readFile(input.filePath, 'utf-8');
    });

    // Step 2: Extract memories using AI
    const memories = await ctx.step('extract-memories', async () => {
      // Use Claude 3.5 Sonnet for complex extraction
      return await ai.chat({
        model: 'claude-3-5-sonnet-20241022',
        messages: [
          { role: 'user', content: `Extract memories from: ${content}` },
        ],
        temperature: 0.3,
        cache: true,
      });
    });

    // Step 3: Store in shadow cache
    await ctx.step('store-memories', async () => {
      await shadowCache.storeMemories(input.filePath, memories);
    });

    return { success: true };
  }
);
```

---

## Cost Optimization

### Caching Strategy

**Vercel AI Gateway automatic caching**:
- Exact query matches: Free (100% cost reduction)
- Similar queries: Reduced tokens (50-80% cost reduction)
- Cache TTL: 1 hour (configurable)

**Manual caching for embeddings**:
```typescript
// weaver/src/shadow-cache/embeddings.ts
export async function getEmbeddingCached(content: string, fileHash: string): Promise<number[]> {
  // Check if embedding exists in shadow cache
  const cached = await shadowCache.getEmbedding(fileHash);
  if (cached) {
    return cached.embedding;
  }

  // Generate new embedding via Vercel AI Gateway (with its own caching)
  const embedding = await generateEmbedding(content);

  // Store in shadow cache for faster retrieval
  await shadowCache.storeEmbedding(fileHash, embedding);

  return embedding;
}
```

---

### Model Selection by Task

| Task | Model | Cost/1K Tokens | Reason |
|------|-------|----------------|--------|
| Extract memories | Claude 3.5 Sonnet | $3/$15 | High quality structured output |
| Suggest tags | GPT-4o | $0.15/$0.60 | Fast, cheap, good enough |
| Generate summary | Claude 3.5 Sonnet | $3/$15 | Quality summaries |
| Embeddings | text-embedding-3-small | $0.02 | Cheapest, good quality |
| Long document analysis | Gemini 1.5 Pro | $0.125/$0.50 | 1M context, cheap |

**Estimated monthly costs** (100k tokens/day):
- All Claude 3.5 Sonnet: ~$180/month
- Mixed strategy (above): ~$60/month (67% savings)

---

## Monitoring & Observability

### Vercel AI Gateway Dashboard

**Access**: https://vercel.com/dashboard/ai-gateway

**Metrics**:
- Request volume by model
- Latency percentiles (p50, p95, p99)
- Error rates by model
- Cache hit rate (target: >60%)
- Cost breakdown by model
- Token usage trends

**Alerts**:
- Error rate >5%
- Latency p95 >2s
- Daily cost >$10
- Cache hit rate <50%

---

### Weaver Internal Metrics

```typescript
// weaver/src/ai-provider.ts
import { ai } from '@vercel/ai';

// Track AI operations in shadow cache
export async function trackAIOperation(
  operation: string,
  model: string,
  tokensUsed: number,
  latency: number
) {
  await shadowCache.insertAIMetric({
    operation,
    model,
    tokensUsed,
    latency,
    timestamp: new Date(),
  });
}

// Query AI metrics
export async function getAIMetrics(timeRange: '1h' | '24h' | '7d' | '30d') {
  return await shadowCache.queryAIMetrics(timeRange);
}
```

**SQL Schema**:
```sql
CREATE TABLE ai_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  cache_hit BOOLEAN NOT NULL,
  timestamp DATETIME NOT NULL
);

CREATE INDEX idx_ai_metrics_timestamp ON ai_metrics(timestamp);
CREATE INDEX idx_ai_metrics_operation ON ai_metrics(operation);
```

---

## Development Workflow

### Local Development with Claude-Flow

```bash
# .env.development
NODE_ENV=development
ANTHROPIC_API_KEY=your-key-here
VERCEL_AI_GATEWAY_API_KEY=vck_1H7ExiTyiespMKAVurlWMqACIRtkIyugzquQ9RsmCvVenM555V4BDWse

# Use Anthropic API for local claude-flow tasks
AI_PROVIDER=anthropic  # Override for local development
```

**Code**:
```typescript
// weaver/src/ai-provider.ts
export function getAIProvider() {
  // Check if explicitly using Anthropic for local development
  if (process.env.AI_PROVIDER === 'anthropic' && process.env.NODE_ENV === 'development') {
    return new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  // Default: Vercel AI Gateway
  return ai;
}
```

---

### Production Deployment

```bash
# .env.production
NODE_ENV=production
VERCEL_AI_GATEWAY_API_KEY=vck_1H7ExiTyiespMKAVurlWMqACIRtkIyugzquQ9RsmCvVenM555V4BDWse

# No ANTHROPIC_API_KEY in production - force Vercel AI Gateway
```

**Validation**:
```typescript
// weaver/src/config/validate-env.ts
export function validateEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.VERCEL_AI_GATEWAY_API_KEY) {
      throw new Error('VERCEL_AI_GATEWAY_API_KEY required in production');
    }

    if (process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY found in production - will not be used');
    }
  }
}
```

---

## Testing

### Mock AI Provider for Tests

```typescript
// weaver/tests/mocks/ai-provider.mock.ts
export const mockAIProvider = {
  chat: jest.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: 'Mock AI response',
        },
      },
    ],
  }),

  embeddings: jest.fn().mockResolvedValue({
    data: [
      {
        embedding: new Array(1536).fill(0.1),
      },
    ],
  }),
};

// Use in tests
jest.mock('../src/ai-provider', () => ({
  ai: mockAIProvider,
}));
```

---

## Migration Plan

### Phase 1: Implement Vercel AI Gateway (Week 1)
- [ ] Add @vercel/ai package
- [ ] Create ai-provider.ts module
- [ ] Add VERCEL_AI_GATEWAY_API_KEY to .env
- [ ] Update extract_memories to use Vercel AI Gateway
- [ ] Test with caching enabled

### Phase 2: Migrate All AI Operations (Week 2)
- [ ] Update suggest_tags
- [ ] Update generate_summary
- [ ] Update find_semantic_neighbors
- [ ] Migrate embedding generation
- [ ] Add AI metrics tracking

### Phase 3: Optimize & Monitor (Week 3)
- [ ] Configure model selection by task
- [ ] Enable caching for all operations
- [ ] Set up Vercel AI Gateway dashboard alerts
- [ ] Implement cost tracking in shadow cache
- [ ] Document AI provider patterns

---

## Related Documentation

- [[weaver-mcp-tools|Weaver MCP Tools]] - MCP tools that use AI
- [[agent-rules-workflows|Agent Rules Workflows]] - Workflows with AI operations
- [[model-context-protocol|Model Context Protocol]] - MCP integration
- [[../integrations/ai/weaver-mcp-claude|Weaver MCP Claude Integration]]

---

**Status**: Active specification
**Owner**: Weaver team
**Priority**: High (critical for Phase 5)
**Last Updated**: 2025-10-23
