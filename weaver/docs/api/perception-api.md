# Perception API Documentation

## Overview

The Perception API implements **Pillar 1: Perception** of the Four-Pillar Autonomous Learning System, gathering information from multiple sources.

## Architecture

```
┌─────────────────────────┐
│   PerceptionManager     │
│   - Orchestration       │
│   - Source Selection    │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │                │
┌───▼────────┐  ┌───▼────────┐
│  File      │  │    Web     │
│  Search    │  │   Search   │
│  (Glob)    │  │  (Brave)   │
└────────────┘  └────────────┘
```

## Core API

### PerceptionManager

Orchestrates multi-source data gathering.

#### Constructor

```typescript
import { createPerceptionManager } from '@weave-nn/weaver/perception';

const manager = createPerceptionManager({
  searchApiKey: process.env.BRAVE_API_KEY,  // Optional for web search
  maxConcurrentSources: 3,                  // Parallel source fetching
  timeout: 5000                             // Per-source timeout (ms)
});
```

#### Methods

##### `perceive(request)`

Gather information from multiple sources.

```typescript
const result = await manager.perceive({
  query: 'authentication best practices',
  sources: ['search', 'web'],
  maxResults: 10,
  context: {
    task: 'build-auth',
    previousResults: []
  }
});

console.log(`Total sources: ${result.sources.length}`);
console.log(`Processing time: ${result.processingTime}ms`);
console.log(`Average relevance: ${result.metadata.averageRelevance}`);
```

**Parameters:**
- `request: PerceptionRequest`
  - `query: string` - Search query (required)
  - `sources: PerceptionSourceType[]` - Sources to use (required)
  - `maxResults?: number` - Max results per source (default: 10)
  - `context?: object` - Additional context

**Returns:** `Promise<PerceptionResult>`

##### `registerSource(type, provider)`

Register a custom perception source.

```typescript
import { PerceptionProvider } from '@weave-nn/weaver/perception';

class CustomAPIProvider implements PerceptionProvider {
  async fetch(query: string, maxResults: number): Promise<PerceptionSource[]> {
    // Custom implementation
    return [];
  }
}

manager.registerSource('api', new CustomAPIProvider());
```

##### `getAvailableSources()`

Get list of available perception sources.

```typescript
const sources = manager.getAvailableSources();
console.log(sources); // ['search', 'web', 'api']
```

## Types

### PerceptionRequest

```typescript
interface PerceptionRequest {
  query: string;                      // Search query
  sources: PerceptionSourceType[];    // Sources to use
  maxResults?: number;                // Max results per source
  context?: {                         // Optional context
    task?: string;
    previousResults?: any[];
    [key: string]: any;
  };
}
```

### PerceptionResult

```typescript
interface PerceptionResult {
  id: string;                         // Unique identifier
  timestamp: number;                  // When perception occurred
  query: string;                      // Original query
  sources: PerceptionSource[];        // Gathered sources
  totalResults: number;               // Total sources found
  processingTime: number;             // Total time (ms)
  metadata: {
    totalSources: number;
    successfulSources: number;
    failedSources: number;
    averageRelevance?: number;        // Average relevance (0-1)
  };
}
```

### PerceptionSource

```typescript
interface PerceptionSource {
  id: string;                         // Source identifier
  type: PerceptionSourceType;         // Source type
  provider: string;                   // Provider name
  title: string;                      // Source title
  content: string;                    // Source content
  location: string;                   // URL or file path
  timestamp: number;                  // When fetched
  relevanceScore?: number;            // Relevance (0-1)
  metadata: {
    wordCount: number;
    language?: string;
    author?: string;
    publishedDate?: string;
    [key: string]: any;
  };
}
```

### PerceptionSourceType

```typescript
type PerceptionSourceType =
  | 'search'      // File search in codebase
  | 'web'         // Web search
  | 'api'         // API documentation
  | 'custom';     // Custom provider
```

## Built-in Providers

### File Search Provider

Searches files in the codebase using glob patterns.

```typescript
const result = await manager.perceive({
  query: 'authentication middleware',
  sources: ['search'],
  maxResults: 5
});

result.sources.forEach(source => {
  console.log(`File: ${source.location}`);
  console.log(`Relevance: ${source.relevanceScore?.toFixed(2)}`);
  console.log(`Content preview: ${source.content.substring(0, 200)}...`);
});
```

**Features:**
- Glob pattern matching
- File content extraction
- Relevance scoring based on query match
- Supports markdown, code files, documentation

### Web Search Provider

Searches the web using Brave Search API.

```typescript
const result = await manager.perceive({
  query: 'JWT best practices 2025',
  sources: ['web'],
  maxResults: 10
});

result.sources.forEach(source => {
  console.log(`Title: ${source.title}`);
  console.log(`URL: ${source.location}`);
  console.log(`Description: ${source.content.substring(0, 150)}...`);
});
```

**Features:**
- Brave Search API integration
- Automatic deduplication
- Relevance scoring
- Metadata extraction (publish date, author)

**Configuration:**
- Requires `BRAVE_API_KEY` environment variable
- Free tier: 2000 queries/month

## Examples

### Basic File Search

```typescript
import { createPerceptionManager } from '@weave-nn/weaver/perception';

const manager = createPerceptionManager();

const result = await manager.perceive({
  query: 'database connection',
  sources: ['search'],
  maxResults: 5
});

console.log(`Found ${result.sources.length} files`);
result.sources.forEach((source, i) => {
  console.log(`\n${i + 1}. ${source.title}`);
  console.log(`   Path: ${source.location}`);
  console.log(`   Words: ${source.metadata.wordCount}`);
});
```

### Web Research

```typescript
const result = await manager.perceive({
  query: 'microservices architecture patterns',
  sources: ['web'],
  maxResults: 10
});

// Filter by relevance
const relevant = result.sources.filter(s =>
  (s.relevanceScore ?? 0) > 0.6
);

console.log(`High relevance: ${relevant.length} sources`);
```

### Multi-Source Perception

```typescript
const result = await manager.perceive({
  query: 'React hooks',
  sources: ['search', 'web'],
  maxResults: 15,
  context: {
    task: 'learn-react-hooks',
    previousResults: []
  }
});

// Separate by source type
const fileResults = result.sources.filter(s => s.type === 'search');
const webResults = result.sources.filter(s => s.type === 'web');

console.log(`Files: ${fileResults.length}`);
console.log(`Web: ${webResults.length}`);
```

### Custom Provider

```typescript
import { PerceptionProvider, PerceptionSource } from '@weave-nn/weaver/perception';

class GitHubSearchProvider implements PerceptionProvider {
  constructor(private token: string) {}

  async fetch(query: string, maxResults: number): Promise<PerceptionSource[]> {
    const response = await fetch(
      `https://api.github.com/search/code?q=${query}`,
      {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    const data = await response.json();

    return data.items.slice(0, maxResults).map((item: any) => ({
      id: `gh-${item.sha}`,
      type: 'custom',
      provider: 'github',
      title: item.name,
      content: item.content || '',
      location: item.html_url,
      timestamp: Date.now(),
      metadata: {
        wordCount: 0,
        repository: item.repository.full_name
      }
    }));
  }
}

// Register and use
const provider = new GitHubSearchProvider(process.env.GITHUB_TOKEN!);
manager.registerSource('github', provider);

const result = await manager.perceive({
  query: 'authentication middleware',
  sources: ['github'],
  maxResults: 5
});
```

### Parallel Source Fetching

```typescript
// Automatically fetches from all sources in parallel
const result = await manager.perceive({
  query: 'caching strategies',
  sources: ['search', 'web'],  // Parallel execution
  maxResults: 10
});

console.log(`Total time: ${result.processingTime}ms`);
console.log(`Successful: ${result.metadata.successfulSources}`);
console.log(`Failed: ${result.metadata.failedSources}`);
```

### Relevance Filtering

```typescript
const result = await manager.perceive({
  query: 'performance optimization',
  sources: ['search', 'web'],
  maxResults: 20
});

// Get only highly relevant sources
const highQuality = result.sources
  .filter(s => (s.relevanceScore ?? 0) > 0.7)
  .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

console.log(`High quality: ${highQuality.length} sources`);
highQuality.forEach(source => {
  console.log(`${source.title}: ${source.relevanceScore?.toFixed(3)}`);
});
```

## Performance

| Operation | Time | Notes |
|-----------|------|-------|
| File search (10 files) | ~100ms | Glob + content read |
| Web search (10 results) | ~400ms | API call + parse |
| Multi-source (both) | ~500ms | Parallel execution |
| Custom provider | Varies | Depends on implementation |

## Configuration

### Environment Variables

```bash
# Web search
BRAVE_API_KEY=your-brave-api-key

# Perception settings
MAX_PERCEPTION_SOURCES=10
PERCEPTION_TIMEOUT=5000
PERCEPTION_CONCURRENT=3
```

### Constructor Options

```typescript
const manager = createPerceptionManager({
  searchApiKey: process.env.BRAVE_API_KEY,
  maxConcurrentSources: 3,      // Parallel source limit
  timeout: 5000,                 // Per-source timeout
  retryAttempts: 2,              // Retry failed sources
  retryDelay: 1000               // Delay between retries
});
```

## Error Handling

```typescript
import { PerceptionError } from '@weave-nn/weaver/perception';

try {
  const result = await manager.perceive(request);
} catch (error) {
  if (error instanceof PerceptionError) {
    console.error('Perception failed:', error.message);
    console.error('Failed sources:', error.cause);
  }
}
```

## Best Practices

1. **Use multiple sources** for comprehensive coverage
2. **Set reasonable limits** (5-10 results per source)
3. **Filter by relevance** to reduce noise
4. **Handle timeouts** gracefully (some sources may be slow)
5. **Cache results** for repeated queries
6. **Monitor API quotas** (Brave Search has limits)
7. **Register custom providers** for specialized domains

## See Also

- [Learning Loop API](./learning-loop-api.md) - Complete learning system
- [Embeddings API](./embeddings-api.md) - Memory storage
- [Autonomous Learning Guide](../user-guide/autonomous-learning-guide.md) - User guide
