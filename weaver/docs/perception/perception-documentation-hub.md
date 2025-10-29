# Perception System - Multi-Source Data Gathering

## 🎯 Overview

The Perception System is a robust multi-source information gathering framework that combines web scraping, search APIs, and content processing to create a unified knowledge base.

## 🚀 Features

### 1. Web Scraping (Playwright-based)
- **SPA Support**: Full JavaScript rendering
- **Retry Logic**: Exponential backoff with configurable retries
- **Rate Limiting**: Per-domain request throttling
- **Content Extraction**: Smart extraction with custom rules
- **Error Handling**: Graceful degradation on failures

### 2. Multi-Provider Search
- **Google Search API**: High-quality results with custom search
- **Bing Search API**: Alternative provider with good coverage
- **DuckDuckGo**: Fallback provider (no API key required)
- **Automatic Fallback**: Seamless provider switching on failures

### 3. Content Processing
- **Unified Format**: Standardized output from all sources
- **Structure Analysis**: Extract headings, code blocks, lists, tables
- **Metadata Extraction**: Word count, reading time, keywords
- **Link Extraction**: Internal and external references
- **Content Truncation**: Configurable max length

## 📦 Installation

```bash
# Install optional dependencies
bun add playwright  # For web scraping (optional)

# Initialize Playwright browsers (if using web scraping)
bunx playwright install chromium
```

## 🔧 Configuration

### Environment Variables

```bash
# Search API keys (optional - DuckDuckGo works without keys)
GOOGLE_API_KEY=your-key
GOOGLE_CSE_ID=your-cse-id
BING_API_KEY=your-key

# Perception settings
PERCEPTION_DEFAULT_SOURCE=search
PERCEPTION_MAX_RESULTS=10
WEB_SCRAPER_HEADLESS=true
WEB_SCRAPER_TIMEOUT=30000
```

### Code Configuration

```typescript
import { PerceptionManager } from '@weave-nn/weaver/perception';

const config = {
  webScraper: {
    enabled: true,
    timeout: 30000,
    retries: 3,
    headless: true,
  },
  searchAPI: {
    enabled: true,
    providers: [
      { name: 'duckduckgo', enabled: true, priority: 1 },
      { name: 'google', apiKey: process.env.GOOGLE_API_KEY, enabled: true, priority: 2 },
      { name: 'bing', apiKey: process.env.BING_API_KEY, enabled: true, priority: 3 },
    ],
    maxResults: 10,
  },
  contentProcessor: {
    extractImages: true,
    extractLinks: true,
    maxContentLength: 50000,
  },
};

const manager = new PerceptionManager(config);
```

## 🎮 Usage

### CLI Commands

```bash
# Perceive information from search APIs (fast)
weaver perceive "machine learning best practices"

# Perceive with web scraping
weaver perceive "react hooks tutorial" --sources web,search --urls https://react.dev

# JSON output
weaver perceive "typescript types" --json > results.json

# Verbose output with full content
weaver perceive "rust ownership" --verbose

# Filter by domains
weaver perceive "AI research" --domains arxiv.org,openai.com
```

### Programmatic Usage

```typescript
import { PerceptionManager } from '@weave-nn/weaver/perception';

const manager = new PerceptionManager(config);

// Simple query
const result = await manager.perceive({
  query: 'best practices for async/await in JavaScript',
  sources: ['search'],
  maxResults: 10,
});

console.log(`Found ${result.totalResults} sources`);
result.sources.forEach(source => {
  console.log(`${source.title} - ${source.url}`);
  console.log(`Relevance: ${source.relevanceScore}`);
});

// Cleanup
await manager.cleanup();
```

### Web Scraping

```typescript
import { WebScraper } from '@weave-nn/weaver/perception';

const scraper = new WebScraper({
  retries: 3,
  timeout: 30000,
  rateLimit: { maxRequests: 10, windowMs: 60000 },
});

const result = await scraper.scrape({
  url: 'https://example.com',
  waitFor: '.main-content',  // Wait for specific element
  extractRules: {
    titleSelector: 'h1',
    contentSelector: 'article',
    removeSelectors: ['nav', 'footer', '.ads'],
  },
});

if (result.success) {
  console.log(`Title: ${result.title}`);
  console.log(`Word count: ${result.metadata.wordCount}`);
  console.log(`Links: ${result.links.length}`);
}

await scraper.close();
```

### Search API

```typescript
import { SearchAPI } from '@weave-nn/weaver/perception';

const searchAPI = new SearchAPI({
  providers: [
    { name: 'duckduckgo', enabled: true, priority: 1 },
  ],
});

const result = await searchAPI.search({
  query: 'TypeScript generics',
  provider: 'duckduckgo',
  maxResults: 10,
  filters: {
    language: 'en',
    dateRange: 'month',
  },
});

console.log(`Found ${result.totalResults} results`);
result.results.forEach(item => {
  console.log(`${item.title} - ${item.url}`);
  console.log(item.snippet);
});
```

### Content Processing

```typescript
import { ContentProcessor } from '@weave-nn/weaver/perception';

const processor = new ContentProcessor({
  maxContentLength: 10000,
  preserveMarkdown: true,
});

// Process markdown content
const content = `# My Article
## Introduction
This is some content...`;

const processed = await processor.processContent(
  content,
  'https://example.com/article'
);

console.log('Headings:', processed.structure.headings);
console.log('Word count:', processed.metadata.wordCount);
console.log('Keywords:', processed.metadata.keywords);
```

## 🎯 Integration with Learning Loop

The Perception System is the first pillar of the 4-pillar learning loop:

```typescript
import { PerceptionManager } from '@weave-nn/weaver/perception';
import { LearningOrchestrator } from '@weave-nn/weaver/learning-loop';

const perceptionManager = new PerceptionManager(config);
const orchestrator = new LearningOrchestrator(perceptionManager);

const result = await orchestrator.learn({
  query: 'What are the latest trends in AI?',
  goals: ['Understand current trends', 'Identify key technologies'],
});

// 4 Pillars executed:
// 1. Perception - Gathered information
// 2. Reasoning - Analyzed and extracted insights
// 3. Memory - Stored in chunked embeddings
// 4. Execution - Generated actions and responses
```

## 📊 Performance

### Caching

Results are cached for 5 minutes by default:

```typescript
// First call - fetches from sources
const result1 = await manager.perceive({ query: 'test' });

// Second call - returns cached result (fast!)
const result2 = await manager.perceive({ query: 'test' });

// Clear cache
manager.clearCache();
```

### Rate Limiting

Built-in rate limiting prevents overwhelming sources:

```typescript
const manager = new PerceptionManager({
  searchAPI: {
    enabled: true,
    providers: [{ name: 'google', enabled: true, priority: 1 }],
    rateLimits: {
      google: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
    },
  },
});
```

## 🔒 Security & Privacy

### API Key Protection
- Never hardcode API keys
- Use environment variables
- Keys are not logged

### User Agent
- Respectful bot identification
- Customizable user agent string

### Rate Limiting
- Respects robots.txt (future enhancement)
- Domain-specific throttling
- Prevents IP blocking

## 🧪 Testing

```bash
# Run all perception tests
bun test tests/perception/

# Run specific test file
bun test tests/perception/web-scraper.test.ts

# With coverage
bun test --coverage tests/perception/
```

## 🐛 Troubleshooting

### Playwright Not Found

```bash
# Install Playwright
bun add playwright

# Install browsers
bunx playwright install chromium
```

### Search API Errors

```bash
# Check API keys
echo $GOOGLE_API_KEY
echo $BING_API_KEY

# Use DuckDuckGo fallback (no key required)
weaver perceive "query" --sources search
```

### Rate Limiting

```bash
# Increase rate limits in config
# Or add delays between requests
```

## 📚 API Reference

### PerceptionManager

```typescript
class PerceptionManager {
  perceive(request: PerceptionRequest): Promise<PerceptionResult>
  clearCache(): void
  getCacheStats(): { size: number; entries: number }
  cleanup(): Promise<void>
}
```

### WebScraper

```typescript
class WebScraper {
  initialize(): Promise<void>
  scrape(request: ScraperRequest): Promise<ScraperResult>
  close(): Promise<void>
}
```

### SearchAPI

```typescript
class SearchAPI {
  search(request: SearchRequest): Promise<SearchResult>
  getAvailableProviders(): string[]
  isProviderEnabled(name: string): boolean
}
```

### ContentProcessor

```typescript
class ContentProcessor {
  processScraperResult(result: ScraperResult): PerceptionSource
  processSearchResult(item: SearchItem, provider: string): PerceptionSource
  processContent(content: string, url: string): Promise<ProcessedContent>
}
```

## 🎉 Best Practices

1. **Always cleanup resources**
   ```typescript
   try {
     const result = await manager.perceive(request);
   } finally {
     await manager.cleanup();
   }
   ```

2. **Use appropriate sources**
   - `search` for fast, broad results
   - `web` for detailed, specific content
   - `search,web` for comprehensive coverage

3. **Configure rate limits**
   - Respect API quotas
   - Prevent IP blocking
   - Balance speed vs. politeness

4. **Handle errors gracefully**
   - Check `result.metadata.errors`
   - Implement fallback strategies
   - Log failures for debugging

## 📄 License

Part of the Weaver project.

---

**Status:** ✅ Production Ready
**Last Updated:** 2025-01-28
**Maintainer:** Weaver Development Team
