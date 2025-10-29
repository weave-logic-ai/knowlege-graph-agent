/**
 * Content Processor Tests
 */

import { describe, it, expect } from 'vitest';
import { ContentProcessor } from '../../src/perception/content-processor';

describe('ContentProcessor', () => {
  const processor = new ContentProcessor();

  it('should process scraper result', () => {
    const scraperResult = {
      url: 'https://example.com',
      success: true,
      title: 'Example Title',
      content: 'This is example content with many words.',
      links: [],
      images: [],
      metadata: {
        loadTime: 1000,
        wordCount: 7,
      },
    };

    const processed = processor.processScraperResult(scraperResult);

    expect(processed.type).toBe('web-scrape');
    expect(processed.title).toBe('Example Title');
    expect(processed.content).toBe('This is example content with many words.');
    expect(processed.metadata.wordCount).toBe(7);
  });

  it('should process search result', () => {
    const searchItem = {
      title: 'Search Result',
      url: 'https://example.com/result',
      snippet: 'This is a snippet from search results.',
    };

    const processed = processor.processSearchResult(searchItem, 'google');

    expect(processed.type).toBe('search-result');
    expect(processed.provider).toBe('google');
    expect(processed.title).toBe('Search Result');
    expect(processed.snippet).toBe('This is a snippet from search results.');
  });

  it('should extract headings from markdown', async () => {
    const content = `# Main Title
## Subtitle
### Section

Some content here.`;

    const processed = await processor.processContent(content, 'https://example.com');

    expect(processed.structure.headings).toHaveLength(3);
    expect(processed.structure.headings[0].level).toBe(1);
    expect(processed.structure.headings[0].text).toBe('Main Title');
  });

  it('should extract code blocks', async () => {
    const content = `Some text

\`\`\`javascript
const x = 42;
console.log(x);
\`\`\`

More text.`;

    const processed = await processor.processContent(content, 'https://example.com');

    expect(processed.structure.codeBlocks).toHaveLength(1);
    expect(processed.structure.codeBlocks[0].language).toBe('javascript');
    expect(processed.structure.codeBlocks[0].code).toContain('const x = 42');
  });

  it('should extract markdown links', async () => {
    const content = 'Check out [this link](https://example.com) for more info.';

    const processed = await processor.processContent(content, 'https://example.com');

    expect(processed.extractedData.links).toHaveLength(1);
    expect(processed.extractedData.links[0].text).toBe('this link');
    expect(processed.extractedData.links[0].href).toBe('https://example.com');
  });

  it('should calculate metadata correctly', async () => {
    const content = 'This is a test with multiple words to count.';

    const processed = await processor.processContent(content, 'https://example.com');

    expect(processed.metadata.wordCount).toBeGreaterThan(0);
    expect(processed.metadata.readingTime).toBeGreaterThan(0);
    expect(processed.metadata.language).toBeDefined();
  });

  it('should truncate long content', () => {
    const processor = new ContentProcessor({ maxContentLength: 100 });
    const longContent = 'a'.repeat(200);

    const scraperResult = {
      url: 'https://example.com',
      success: true,
      title: 'Test',
      content: longContent,
      links: [],
      images: [],
      metadata: { loadTime: 1000, wordCount: 200 },
    };

    const processed = processor.processScraperResult(scraperResult);

    expect(processed.content.length).toBeLessThanOrEqual(103); // 100 + '...'
  });
});
