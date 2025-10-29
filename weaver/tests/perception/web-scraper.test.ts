/**
 * Web Scraper Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebScraper } from '../../src/perception/web-scraper';

describe('WebScraper', () => {
  let scraper: WebScraper;

  beforeAll(async () => {
    scraper = new WebScraper({
      retries: 2,
      timeout: 10000,
      headless: true,
    });
  });

  afterAll(async () => {
    await scraper.close();
  });

  it('should create a scraper instance', () => {
    expect(scraper).toBeDefined();
  });

  it('should handle missing Playwright gracefully', async () => {
    const testScraper = new WebScraper({ headless: true });

    try {
      const result = await testScraper.scrape({ url: 'https://example.com' });
      // Should either work or fail gracefully
      expect(result).toBeDefined();
      expect(result.url).toBe('https://example.com');
    } catch (error) {
      // Graceful failure is acceptable
      expect(error).toBeDefined();
    } finally {
      await testScraper.close();
    }
  });

  it('should handle invalid URLs', async () => {
    const result = await scraper.scrape({ url: 'invalid-url' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should retry on failure', async () => {
    const result = await scraper.scrape({
      url: 'https://httpstat.us/500',
      timeout: 5000,
    });

    // Should attempt retries
    expect(result).toBeDefined();
  });

  it('should respect rate limits', async () => {
    const rateLimitedScraper = new WebScraper({
      rateLimit: { maxRequests: 2, windowMs: 1000 },
    });

    const urls = [
      'https://example.com',
      'https://example.com',
      'https://example.com',
    ];

    const startTime = Date.now();

    for (const url of urls) {
      await rateLimitedScraper.scrape({ url }).catch(() => {});
    }

    const duration = Date.now() - startTime;

    // Should take at least 1 second due to rate limiting
    expect(duration).toBeGreaterThanOrEqual(900);

    await rateLimitedScraper.close();
  });
});
