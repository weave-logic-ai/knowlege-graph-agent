/**
 * Search API - Multi-provider search integration
 *
 * Supports Google Search API, Bing Search API, and DuckDuckGo fallback
 * with automatic provider switching and result aggregation.
 */

import type {
  SearchRequest,
  SearchResult,
  SearchItem,
  SearchProvider,
} from './types.js';
import { logger } from '../utils/logger.js';

export class SearchAPI {
  private providers: Map<string, SearchProvider> = new Map();
  private requestCounts: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(
    private config: {
      providers: SearchProvider[];
      defaultMaxResults?: number;
      rateLimits?: Record<string, { maxRequests: number; windowMs: number }>;
    }
  ) {
    // Initialize providers
    config.providers.forEach(provider => {
      if (provider.enabled) {
        this.providers.set(provider.name, provider);
      }
    });

    if (this.providers.size === 0) {
      logger.warn('No search providers enabled');
    }
  }

  /**
   * Search using available providers with automatic fallback
   */
  async search(request: SearchRequest): Promise<SearchResult> {
    const startTime = Date.now();
    const provider = this.providers.get(request.provider);

    if (!provider || !provider.enabled) {
      return this.searchWithFallback(request);
    }

    try {
      await this.checkRateLimit(request.provider);

      let result: SearchResult;

      switch (request.provider) {
        case 'google':
          result = await this.searchGoogle(request);
          break;
        case 'bing':
          result = await this.searchBing(request);
          break;
        case 'duckduckgo':
          result = await this.searchDuckDuckGo(request);
          break;
        default:
          throw new Error(`Unsupported provider: ${request.provider}`);
      }

      logger.info('Search completed', {
        provider: request.provider,
        query: request.query,
        results: result.results.length,
        duration: Date.now() - startTime,
      });

      return result;
    } catch (err) {
      const error = err as Error;
      logger.error('Search failed', error, {
        provider: request.provider,
        query: request.query,
      });

      // Try fallback provider
      return this.searchWithFallback(request);
    }
  }

  /**
   * Search with automatic provider fallback
   */
  private async searchWithFallback(request: SearchRequest): Promise<SearchResult> {
    const providerPriority = Array.from(this.providers.values())
      .sort((a, b) => b.priority - a.priority);

    for (const provider of providerPriority) {
      if (provider.name === request.provider) continue; // Skip failed provider

      try {
        logger.info('Trying fallback provider', { provider: provider.name });
        return await this.search({ ...request, provider: provider.name });
      } catch (error) {
        logger.warn('Fallback provider failed', {
          provider: provider.name,
          error,
        });
      }
    }

    // All providers failed
    return this.createEmptyResult(request);
  }

  /**
   * Search using Google Custom Search API
   */
  private async searchGoogle(request: SearchRequest): Promise<SearchResult> {
    const provider = this.providers.get('google')!;
    const startTime = Date.now();

    if (!provider.apiKey) {
      throw new Error('Google API key not configured');
    }

    const params = new URLSearchParams({
      key: provider.apiKey,
      cx: process.env.GOOGLE_CSE_ID || '',
      q: request.query,
      num: String(request.maxResults ?? 10),
      ...this.buildGoogleFilters(request.filters),
    });

    const url = `${provider.endpoint || 'https://www.googleapis.com/customsearch/v1'}?${params}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      items?: unknown[];
      searchInformation?: { totalResults?: string };
      queries?: { nextPage?: Array<{ startIndex?: number }> };
    };

    return {
      provider: 'google',
      query: request.query,
      results: this.parseGoogleResults(data.items || []),
      totalResults: parseInt(data.searchInformation?.totalResults || '0'),
      searchTime: Date.now() - startTime,
      nextPageToken: data.queries?.nextPage?.[0]?.startIndex?.toString(),
    };
  }

  /**
   * Search using Bing Search API
   */
  private async searchBing(request: SearchRequest): Promise<SearchResult> {
    const provider = this.providers.get('bing')!;
    const startTime = Date.now();

    if (!provider.apiKey) {
      throw new Error('Bing API key not configured');
    }

    const params = new URLSearchParams({
      q: request.query,
      count: String(request.maxResults ?? 10),
      ...this.buildBingFilters(request.filters),
    });

    const url = `${provider.endpoint || 'https://api.bing.microsoft.com/v7.0/search'}?${params}`;

    const response = await fetch(url, {
      headers: {
        'Ocp-Apim-Subscription-Key': provider.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Bing Search API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      webPages?: {
        value?: unknown[];
        totalEstimatedMatches?: string;
      };
    };

    return {
      provider: 'bing',
      query: request.query,
      results: this.parseBingResults(data.webPages?.value || []),
      totalResults: parseInt(data.webPages?.totalEstimatedMatches || '0'),
      searchTime: Date.now() - startTime,
    };
  }

  /**
   * Search using DuckDuckGo (HTML scraping fallback)
   */
  private async searchDuckDuckGo(request: SearchRequest): Promise<SearchResult> {
    const startTime = Date.now();

    // DuckDuckGo instant answer API (limited but no API key required)
    const params = new URLSearchParams({
      q: request.query,
      format: 'json',
      no_html: '1',
      skip_disambig: '1',
    });

    const url = `https://api.duckduckgo.com/?${params}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.statusText}`);
    }

    const data = await response.json() as {
      Abstract?: string;
      Heading?: string;
      AbstractURL?: string;
      AbstractSource?: string;
      RelatedTopics?: Array<{ FirstURL?: string; Text?: string }>;
    };

    // DuckDuckGo instant answer API has limited results
    const results: SearchItem[] = [];

    // Add abstract if available
    if (data.Abstract) {
      results.push({
        title: data.Heading || request.query,
        url: data.AbstractURL || '',
        snippet: data.Abstract,
        displayUrl: data.AbstractSource,
      });
    }

    // Add related topics
    (data.RelatedTopics || []).forEach((topic: any) => {
      if (topic.FirstURL && topic.Text) {
        results.push({
          title: topic.Text.split(' - ')[0] || topic.Text,
          url: topic.FirstURL,
          snippet: topic.Text,
        });
      }
    });

    return {
      provider: 'duckduckgo',
      query: request.query,
      results: results.slice(0, request.maxResults ?? 10),
      totalResults: results.length,
      searchTime: Date.now() - startTime,
    };
  }

  /**
   * Build Google-specific filters
   */
  private buildGoogleFilters(filters?: any): Record<string, string> {
    const params: Record<string, string> = {};

    if (filters?.site) {
      params.siteSearch = filters.site;
    }

    if (filters?.dateRange) {
      params.dateRestrict = filters.dateRange;
    }

    if (filters?.language) {
      params.lr = `lang_${filters.language}`;
    }

    return params;
  }

  /**
   * Build Bing-specific filters
   */
  private buildBingFilters(filters?: any): Record<string, string> {
    const params: Record<string, string> = {};

    if (filters?.language) {
      params.mkt = `${filters.language}-${filters.region || 'US'}`;
    }

    if (filters?.dateRange) {
      params.freshness = filters.dateRange;
    }

    return params;
  }

  /**
   * Parse Google search results
   */
  private parseGoogleResults(items: any[]): SearchItem[] {
    return items.map(item => ({
      title: item.title || '',
      url: item.link || '',
      snippet: item.snippet || '',
      displayUrl: item.displayLink,
      publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
      favicon: item.pagemap?.cse_image?.[0]?.src,
    }));
  }

  /**
   * Parse Bing search results
   */
  private parseBingResults(items: any[]): SearchItem[] {
    return items.map(item => ({
      title: item.name || '',
      url: item.url || '',
      snippet: item.snippet || '',
      displayUrl: item.displayUrl,
      publishedDate: item.dateLastCrawled,
    }));
  }

  /**
   * Check and enforce rate limiting
   */
  private async checkRateLimit(provider: string): Promise<void> {
    const rateLimit = this.config.rateLimits?.[provider];
    if (!rateLimit) return;

    const now = Date.now();
    const limit = this.requestCounts.get(provider);

    if (!limit || now > limit.resetAt) {
      this.requestCounts.set(provider, {
        count: 1,
        resetAt: now + rateLimit.windowMs,
      });
      return;
    }

    if (limit.count >= rateLimit.maxRequests) {
      const waitTime = limit.resetAt - now;
      logger.warn('Rate limit hit for provider', { provider, waitTime });
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCounts.set(provider, {
        count: 1,
        resetAt: now + waitTime + rateLimit.windowMs,
      });
    } else {
      limit.count++;
    }
  }

  /**
   * Create empty result for failed searches
   */
  private createEmptyResult(request: SearchRequest): SearchResult {
    return {
      provider: request.provider,
      query: request.query,
      results: [],
      totalResults: 0,
      searchTime: 0,
    };
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is enabled
   */
  isProviderEnabled(name: string): boolean {
    return this.providers.get(name)?.enabled ?? false;
  }
}
