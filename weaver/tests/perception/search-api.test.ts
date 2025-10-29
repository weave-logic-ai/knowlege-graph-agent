/**
 * Search API Tests
 */

import { describe, it, expect } from 'vitest';
import { SearchAPI } from '../../src/perception/search-api';

describe('SearchAPI', () => {
  it('should create a search API instance', () => {
    const searchAPI = new SearchAPI({
      providers: [
        { name: 'duckduckgo', enabled: true, priority: 1 },
      ],
    });

    expect(searchAPI).toBeDefined();
    expect(searchAPI.getAvailableProviders()).toContain('duckduckgo');
  });

  it('should handle no enabled providers', () => {
    const searchAPI = new SearchAPI({
      providers: [
        { name: 'google', enabled: false, priority: 1 },
      ],
    });

    expect(searchAPI.getAvailableProviders()).toHaveLength(0);
  });

  it('should use DuckDuckGo as fallback', async () => {
    const searchAPI = new SearchAPI({
      providers: [
        { name: 'duckduckgo', enabled: true, priority: 1 },
      ],
    });

    const result = await searchAPI.search({
      query: 'test query',
      provider: 'duckduckgo',
      maxResults: 5,
    });

    expect(result).toBeDefined();
    expect(result.provider).toBe('duckduckgo');
    expect(result.query).toBe('test query');
    expect(Array.isArray(result.results)).toBe(true);
  });

  it('should check provider availability', () => {
    const searchAPI = new SearchAPI({
      providers: [
        { name: 'google', enabled: true, priority: 1 },
        { name: 'bing', enabled: false, priority: 2 },
      ],
    });

    expect(searchAPI.isProviderEnabled('google')).toBe(true);
    expect(searchAPI.isProviderEnabled('bing')).toBe(false);
  });

  it('should respect rate limits', async () => {
    const searchAPI = new SearchAPI({
      providers: [
        { name: 'duckduckgo', enabled: true, priority: 1 },
      ],
      rateLimits: {
        duckduckgo: { maxRequests: 2, windowMs: 1000 },
      },
    });

    const startTime = Date.now();

    for (let i = 0; i < 3; i++) {
      await searchAPI.search({
        query: `test ${i}`,
        provider: 'duckduckgo',
      }).catch(() => {});
    }

    const duration = Date.now() - startTime;

    // Should enforce rate limiting
    expect(duration).toBeGreaterThanOrEqual(900);
  });
});
