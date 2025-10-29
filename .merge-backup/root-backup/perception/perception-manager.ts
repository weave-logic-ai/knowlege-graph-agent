/**
 * Perception Manager - Orchestrate multi-source data gathering
 *
 * Coordinates web scraping and search APIs to gather information
 * from multiple sources with intelligent fallback and aggregation.
 */

import type {
  PerceptionConfig,
  PerceptionRequest,
  PerceptionResult,
  PerceptionSource,
  PerceptionMetadata,
  PerceptionStrategy,
} from './types.js';
import { WebScraper } from './web-scraper.js';
import { SearchAPI } from './search-api.js';
import { ContentProcessor } from './content-processor.js';
import { logger } from '../utils/logger.js';

export class PerceptionManager {
  private webScraper?: WebScraper;
  private searchAPI?: SearchAPI;
  private contentProcessor: ContentProcessor;
  private cache: Map<string, { result: PerceptionResult; expiresAt: number }> = new Map();

  constructor(private config: PerceptionConfig) {
    // Initialize web scraper if enabled
    if (config.webScraper?.enabled) {
      this.webScraper = new WebScraper({
        retries: config.webScraper.retries,
        timeout: config.webScraper.timeout,
        userAgent: config.webScraper.userAgent,
        headless: config.webScraper.headless,
      });
    }

    // Initialize search API if enabled
    if (config.searchAPI?.enabled && config.searchAPI.providers.length > 0) {
      this.searchAPI = new SearchAPI({
        providers: config.searchAPI.providers,
        defaultMaxResults: config.searchAPI.maxResults,
        rateLimits: config.searchAPI.rateLimits,
      });
    }

    // Always initialize content processor
    this.contentProcessor = new ContentProcessor(config.contentProcessor);
  }

  /**
   * Perceive information from multiple sources
   */
  async perceive(request: PerceptionRequest): Promise<PerceptionResult> {
    const startTime = Date.now();
    const cacheKey = this.getCacheKey(request);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      logger.info('Returning cached perception result', { query: request.query });
      return cached.result;
    }

    logger.info('Starting perception', {
      query: request.query,
      sources: request.sources,
    });

    const sources: PerceptionSource[] = [];
    const errors: any[] = [];

    // Parallel execution strategy
    const promises: Promise<void>[] = [];

    // Web scraping
    if (request.sources.includes('web') && this.webScraper) {
      promises.push(
        this.gatherFromWeb(request, sources, errors)
      );
    }

    // Search APIs
    if (request.sources.includes('search') && this.searchAPI) {
      promises.push(
        this.gatherFromSearch(request, sources, errors)
      );
    }

    // Wait for all sources
    await Promise.allSettled(promises);

    // Process and rank results
    const processedSources = await this.processAndRankSources(sources, request);

    // Build result
    const result: PerceptionResult = {
      id: `perception_${Date.now()}`,
      timestamp: Date.now(),
      query: request.query,
      sources: processedSources.slice(0, request.maxResults ?? 10),
      totalResults: processedSources.length,
      processingTime: Date.now() - startTime,
      metadata: this.buildMetadata(processedSources, errors),
    };

    // Cache result (5 minutes TTL)
    this.cache.set(cacheKey, {
      result,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    logger.info('Perception completed', {
      query: request.query,
      sources: result.totalResults,
      duration: result.processingTime,
    });

    return result;
  }

  /**
   * Gather information from web scraping
   */
  private async gatherFromWeb(
    request: PerceptionRequest,
    sources: PerceptionSource[],
    errors: any[]
  ): Promise<void> {
    if (!this.webScraper) return;

    try {
      // Get URLs to scrape (from context or filters)
      const urls = this.extractUrlsFromRequest(request);

      if (urls.length === 0) {
        logger.warn('No URLs provided for web scraping');
        return;
      }

      // Scrape URLs in parallel (limited concurrency)
      const scrapePromises = urls.map(url =>
        this.webScraper!.scrape({ url }).catch(error => {
          errors.push({
            source: 'web-scraper',
            error: error.message,
            timestamp: Date.now(),
            recoverable: true,
          });
          return null;
        })
      );

      const results = await Promise.all(scrapePromises);

      // Process successful results
      results.forEach(result => {
        if (result && result.success) {
          const source = this.contentProcessor.processScraperResult(result);
          sources.push(source);
        }
      });

      logger.info('Web scraping completed', {
        total: urls.length,
        successful: sources.filter(s => s.type === 'web-scrape').length,
      });
    } catch (err) {
      const error = err as Error;
      logger.error('Web scraping failed', error);
      errors.push({
        source: 'web-scraper',
        error: error.message,
        timestamp: Date.now(),
        recoverable: false,
      });
    }
  }

  /**
   * Gather information from search APIs
   */
  private async gatherFromSearch(
    request: PerceptionRequest,
    sources: PerceptionSource[],
    errors: any[]
  ): Promise<void> {
    if (!this.searchAPI) return;

    try {
      const providers = this.searchAPI.getAvailableProviders();

      if (providers.length === 0) {
        logger.warn('No search providers available');
        return;
      }

      // Use primary provider (highest priority)
      const primaryProvider = providers[0];

      const searchResult = await this.searchAPI.search({
        query: request.query,
        provider: primaryProvider as any,
        maxResults: request.maxResults ?? 10,
        filters: request.filters ? {
          dateRange: request.filters.dateRange ? 'custom' : undefined,
          site: request.filters.domains?.[0],
          language: request.filters.language,
        } : undefined,
      });

      // Process search results
      searchResult.results.forEach(item => {
        const source = this.contentProcessor.processSearchResult(
          item,
          searchResult.provider
        );
        sources.push(source);
      });

      logger.info('Search completed', {
        provider: searchResult.provider,
        results: searchResult.results.length,
      });
    } catch (err) {
      const error = err as Error;
      logger.error('Search failed', error);
      errors.push({
        source: 'search-api',
        error: error.message,
        timestamp: Date.now(),
        recoverable: true,
      });
    }
  }

  /**
   * Process and rank sources by relevance
   */
  private async processAndRankSources(
    sources: PerceptionSource[],
    request: PerceptionRequest
  ): Promise<PerceptionSource[]> {
    // Calculate relevance scores
    sources.forEach(source => {
      source.relevanceScore = this.calculateRelevance(source, request);
    });

    // Sort by relevance
    return sources.sort((a, b) => {
      const scoreA = a.relevanceScore ?? 0;
      const scoreB = b.relevanceScore ?? 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate relevance score for a source
   */
  private calculateRelevance(
    source: PerceptionSource,
    request: PerceptionRequest
  ): number {
    let score = 0.5; // Base score

    const queryTerms = request.query.toLowerCase().split(/\s+/);

    // Title match
    const titleLower = source.title.toLowerCase();
    queryTerms.forEach(term => {
      if (titleLower.includes(term)) {
        score += 0.1;
      }
    });

    // Content match
    const contentLower = source.content.toLowerCase();
    queryTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 0.05;
      }
    });

    // Word count bonus (more content = potentially more valuable)
    if (source.metadata.wordCount > 500) {
      score += 0.1;
    }

    // Recency bonus (if available)
    if (source.metadata.publishedDate) {
      const publishedDate = new Date(source.metadata.publishedDate);
      const daysSincePublish = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePublish < 30) {
        score += 0.15;
      } else if (daysSincePublish < 90) {
        score += 0.1;
      }
    }

    // Prefer web-scrape over search results (more complete)
    if (source.type === 'web-scrape') {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Extract URLs from request context
   */
  private extractUrlsFromRequest(request: PerceptionRequest): string[] {
    const urls: string[] = [];

    // From context
    if (request.context?.urls) {
      urls.push(...request.context.urls);
    }

    // From filters
    if (request.filters?.domains) {
      urls.push(...request.filters.domains);
    }

    return urls;
  }

  /**
   * Build perception metadata
   */
  private buildMetadata(
    sources: PerceptionSource[],
    errors: any[]
  ): PerceptionMetadata {
    const totalSources = sources.length + errors.length;
    const successfulSources = sources.length;
    const failedSources = errors.length;

    const averageRelevance = sources.length > 0
      ? sources.reduce((sum, s) => sum + (s.relevanceScore ?? 0), 0) / sources.length
      : 0;

    return {
      totalSources,
      successfulSources,
      failedSources,
      averageRelevance,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Generate cache key from request
   */
  private getCacheKey(request: PerceptionRequest): string {
    return `${request.query}_${request.sources.join('_')}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('Perception cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).filter(
        entry => entry.expiresAt > Date.now()
      ).length,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.webScraper) {
      await this.webScraper.close();
    }
    this.clearCache();
    logger.info('Perception manager cleaned up');
  }
}

/**
 * Default perception strategy
 */
export const DEFAULT_PERCEPTION_STRATEGY: PerceptionStrategy = {
  name: 'balanced',
  sources: ['search', 'web'],
  fallbackOrder: ['search', 'web'],
  parallelExecution: true,
  aggregationMethod: 'rank',
};

/**
 * Fast perception strategy (search only)
 */
export const FAST_PERCEPTION_STRATEGY: PerceptionStrategy = {
  name: 'fast',
  sources: ['search'],
  fallbackOrder: ['search'],
  parallelExecution: false,
  aggregationMethod: 'merge',
};

/**
 * Thorough perception strategy (web scraping focus)
 */
export const THOROUGH_PERCEPTION_STRATEGY: PerceptionStrategy = {
  name: 'thorough',
  sources: ['web', 'search'],
  fallbackOrder: ['web', 'search'],
  parallelExecution: true,
  aggregationMethod: 'deduplicate',
};
