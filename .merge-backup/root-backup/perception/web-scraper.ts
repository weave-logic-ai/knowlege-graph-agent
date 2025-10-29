/**
 * Web Scraper - Playwright-based content extraction
 *
 * Handles SPA rendering, structured content extraction,
 * rate limiting, and retry logic with exponential backoff.
 */

import type {
  ScraperRequest,
  ScraperResult,
  ExtractedLink,
  ExtractedImage,
  ExtractionRules,
} from './types.js';
import { logger } from '../utils/logger.js';

export class WebScraper {
  private browser: any = null;
  private retryCount = 3;
  private timeout = 30000;
  private userAgent = 'Mozilla/5.0 (compatible; WeaverBot/1.0)';
  private requestCounts: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(
    private config: {
      retries?: number;
      timeout?: number;
      userAgent?: string;
      headless?: boolean;
      rateLimit?: { maxRequests: number; windowMs: number };
    } = {}
  ) {
    this.retryCount = config.retries ?? 3;
    this.timeout = config.timeout ?? 30000;
    this.userAgent = config.userAgent ?? this.userAgent;
  }

  /**
   * Initialize Playwright browser instance
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import to handle optional dependency
      const playwright = await this.loadPlaywright();
      if (!playwright) {
        throw new Error('Playwright not available');
      }

      this.browser = await playwright.chromium.launch({
        headless: this.config.headless ?? true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      logger.info('Web scraper initialized');
    } catch (err) {
      const error = err as Error;
      logger.error('Failed to initialize web scraper', error);
      throw error;
    }
  }

  /**
   * Attempt to load Playwright with graceful fallback
   */
  private async loadPlaywright(): Promise<any> {
    try {
      return await import('playwright');
    } catch {
      logger.warn('Playwright not installed, web scraping disabled');
      return null;
    }
  }

  /**
   * Scrape content from a URL with retry logic
   */
  async scrape(request: ScraperRequest): Promise<ScraperResult> {
    const startTime = Date.now();

    // Check rate limit
    await this.checkRateLimit(request.url);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        if (!this.browser) {
          await this.initialize();
        }

        const result = await this.performScrape(request);

        logger.info('Scrape successful', {
          url: request.url,
          attempt: attempt + 1,
          duration: Date.now() - startTime,
        });

        return result;
      } catch (error) {
        lastError = error as Error;
        logger.warn('Scrape attempt failed', {
          url: request.url,
          attempt: attempt + 1,
          error: lastError.message,
        });

        if (attempt < this.retryCount - 1) {
          const delay = this.calculateBackoff(attempt);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    return this.createErrorResult(request.url, lastError!, Date.now() - startTime);
  }

  /**
   * Perform actual scraping operation
   */
  private async performScrape(request: ScraperRequest): Promise<ScraperResult> {
    const page = await this.browser.newPage();
    const startTime = Date.now();

    try {
      // Set user agent
      await page.setUserAgent(this.userAgent);

      // Navigate to page
      const response = await page.goto(request.url, {
        timeout: request.timeout ?? this.timeout,
        waitUntil: 'domcontentloaded',
      });

      // Wait for specific element if requested
      if (request.waitFor) {
        await page.waitForSelector(request.waitFor, {
          timeout: 5000,
        }).catch(() => {
          logger.warn('waitFor selector not found', { selector: request.waitFor });
        });
      }

      // Additional wait for SPA rendering
      await page.waitForTimeout(1000);

      // Extract content
      const content = await this.extractContent(page, request.extractRules);
      const links = await this.extractLinks(page);
      const images = await this.extractImages(page);

      const loadTime = Date.now() - startTime;

      return {
        url: request.url,
        success: true,
        title: content.title,
        content: content.text,
        html: content.html,
        links,
        images,
        metadata: {
          statusCode: response?.status(),
          contentType: response?.headers()['content-type'],
          loadTime,
          wordCount: this.countWords(content.text),
        },
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Extract main content from page
   */
  private async extractContent(
    page: any,
    rules?: ExtractionRules
  ): Promise<{ title: string; text: string; html?: string }> {
    const titleSelector = rules?.titleSelector ?? 'title, h1';
    const contentSelector = rules?.contentSelector ?? 'article, main, .content, body';
    const removeSelectors = rules?.removeSelectors ?? [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'aside',
      '.ads',
      '.advertisement',
    ];

    // Get title
    const title = await page.$eval(
      titleSelector,
      (el: any) => el.textContent?.trim() ?? ''
    ).catch(() => '');

    // Remove unwanted elements
    for (const selector of removeSelectors) {
      await page.$$eval(selector, (elements: any[]) => {
        elements.forEach(el => el.remove());
      }).catch(() => {});
    }

    // Extract content
    const contentHandle = await page.$(contentSelector);
    if (!contentHandle) {
      throw new Error('Content selector not found');
    }

    const text = await contentHandle.evaluate((el: any) => {
      return el.textContent?.trim() ?? '';
    });

    const html = rules?.preserveFormatting
      ? await contentHandle.evaluate((el: any) => el.innerHTML)
      : undefined;

    return { title, text, html };
  }

  /**
   * Extract all links from page
   */
  private async extractLinks(page: any): Promise<ExtractedLink[]> {
    return await page.$$eval('a[href]', (links: any[]) => {
      return links
        .map(link => ({
          href: link.href,
          text: link.textContent?.trim() ?? '',
          context: link.getAttribute('title') ?? undefined,
        }))
        .filter(link => link.href && link.href.startsWith('http'));
    });
  }

  /**
   * Extract all images from page
   */
  private async extractImages(page: any): Promise<ExtractedImage[]> {
    return await page.$$eval('img[src]', (images: any[]) => {
      return images
        .map(img => ({
          src: img.src,
          alt: img.alt ?? undefined,
          caption: img.getAttribute('title') ?? undefined,
        }))
        .filter(img => img.src && img.src.startsWith('http'));
    });
  }

  /**
   * Check and enforce rate limiting
   */
  private async checkRateLimit(url: string): Promise<void> {
    if (!this.config.rateLimit) return;

    const domain = new URL(url).hostname;
    const now = Date.now();
    const limit = this.requestCounts.get(domain);

    if (!limit || now > limit.resetAt) {
      // Reset window
      this.requestCounts.set(domain, {
        count: 1,
        resetAt: now + this.config.rateLimit.windowMs,
      });
      return;
    }

    if (limit.count >= this.config.rateLimit.maxRequests) {
      const waitTime = limit.resetAt - now;
      logger.warn('Rate limit hit, waiting', { domain, waitTime });
      await this.sleep(waitTime);
      this.requestCounts.set(domain, {
        count: 1,
        resetAt: now + waitTime + this.config.rateLimit.windowMs,
      });
    } else {
      limit.count++;
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    const baseDelay = 1000;
    const maxDelay = 10000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter
    return delay + Math.random() * 1000;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Create error result
   */
  private createErrorResult(
    url: string,
    error: Error,
    loadTime: number
  ): ScraperResult {
    return {
      url,
      success: false,
      title: '',
      content: '',
      links: [],
      images: [],
      metadata: {
        loadTime,
        wordCount: 0,
      },
      error: error.message,
    };
  }

  /**
   * Close browser and cleanup
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Web scraper closed');
    }
  }
}
