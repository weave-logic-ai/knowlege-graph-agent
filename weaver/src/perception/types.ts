/**
 * Type Definitions for Perception System
 *
 * Defines interfaces for multi-source perception, content processing,
 * and unified data formats for the learning loop.
 */

export interface PerceptionConfig {
  // Web scraper configuration
  webScraper?: {
    enabled: boolean;
    timeout: number;
    retries: number;
    userAgent?: string;
    headless?: boolean;
  };

  // Search API configuration
  searchAPI?: {
    enabled: boolean;
    providers: SearchProvider[];
    maxResults: number;
    rateLimits?: Record<string, RateLimit>;
  };

  // Content processing
  contentProcessor?: {
    extractImages: boolean;
    extractLinks: boolean;
    maxContentLength: number;
    preserveMarkdown: boolean;
  };
}

export interface SearchProvider {
  name: 'google' | 'bing' | 'duckduckgo';
  apiKey?: string;
  endpoint?: string;
  priority: number;
  enabled: boolean;
}

export interface RateLimit {
  maxRequests: number;
  windowMs: number;
}

export interface PerceptionRequest {
  query: string;
  sources: ('web' | 'search')[];
  maxResults?: number;
  filters?: PerceptionFilters;
  context?: Record<string, any>;
}

export interface PerceptionFilters {
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  domains?: string[];
  excludeDomains?: string[];
  language?: string;
  contentType?: ('article' | 'documentation' | 'forum' | 'code')[];
}

export interface PerceptionResult {
  id: string;
  timestamp: number;
  query: string;
  sources: PerceptionSource[];
  totalResults: number;
  processingTime: number;
  metadata: PerceptionMetadata;
}

export interface PerceptionSource {
  id: string;
  type: 'web-scrape' | 'search-result';
  provider: string;
  url: string;
  title: string;
  content: string;
  snippet?: string;
  extractedAt: number;
  metadata: {
    author?: string;
    publishedDate?: string;
    wordCount: number;
    language?: string;
    contentType?: string;
  };
  links?: ExtractedLink[];
  images?: ExtractedImage[];
  relevanceScore?: number;
}

export interface ExtractedLink {
  href: string;
  text: string;
  context?: string;
}

export interface ExtractedImage {
  src: string;
  alt?: string;
  caption?: string;
}

export interface PerceptionMetadata {
  totalSources: number;
  successfulSources: number;
  failedSources: number;
  averageRelevance?: number;
  primaryLanguage?: string;
  errors?: PerceptionError[];
}

export interface PerceptionError {
  source: string;
  error: string;
  timestamp: number;
  recoverable: boolean;
}

// Web scraper specific types
export interface ScraperRequest {
  url: string;
  timeout?: number;
  waitFor?: string;
  extractRules?: ExtractionRules;
}

export interface ExtractionRules {
  titleSelector?: string;
  contentSelector?: string;
  removeSelectors?: string[];
  preserveFormatting?: boolean;
}

export interface ScraperResult {
  url: string;
  success: boolean;
  title: string;
  content: string;
  html?: string;
  links: ExtractedLink[];
  images: ExtractedImage[];
  metadata: {
    statusCode?: number;
    contentType?: string;
    loadTime: number;
    wordCount: number;
  };
  error?: string;
}

// Search API specific types
export interface SearchRequest {
  query: string;
  provider: 'google' | 'bing' | 'duckduckgo';
  maxResults?: number;
  filters?: SearchFilters;
}

export interface SearchFilters {
  dateRange?: string;
  site?: string;
  language?: string;
  region?: string;
}

export interface SearchResult {
  provider: string;
  query: string;
  results: SearchItem[];
  totalResults: number;
  searchTime: number;
  nextPageToken?: string;
}

export interface SearchItem {
  title: string;
  url: string;
  snippet: string;
  displayUrl?: string;
  publishedDate?: string;
  favicon?: string;
  relevanceScore?: number;
}

// Content processor types
export interface ProcessedContent {
  id: string;
  originalUrl: string;
  source: string;
  title: string;
  content: string;
  structure: ContentStructure;
  metadata: ContentMetadata;
  extractedData: ExtractedData;
}

export interface ContentStructure {
  headings: Heading[];
  paragraphs: number;
  codeBlocks: CodeBlock[];
  lists: List[];
  tables: Table[];
}

export interface Heading {
  level: number;
  text: string;
  id?: string;
}

export interface CodeBlock {
  language?: string;
  code: string;
  lineCount: number;
}

export interface List {
  type: 'ordered' | 'unordered';
  items: string[];
}

export interface Table {
  headers: string[];
  rows: string[][];
}

export interface ContentMetadata {
  wordCount: number;
  readingTime: number;
  language: string;
  keywords: string[];
  entities?: NamedEntity[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface NamedEntity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'date' | 'technology';
  confidence: number;
}

export interface ExtractedData {
  links: ExtractedLink[];
  images: ExtractedImage[];
  references: Reference[];
  citations?: Citation[];
}

export interface Reference {
  text: string;
  url?: string;
  type: 'internal' | 'external' | 'api' | 'documentation';
}

export interface Citation {
  text: string;
  source?: string;
  authors?: string[];
  year?: number;
}

// Perception manager types
export interface PerceptionStrategy {
  name: string;
  sources: ('web' | 'search')[];
  fallbackOrder: string[];
  parallelExecution: boolean;
  aggregationMethod: 'merge' | 'deduplicate' | 'rank';
}

export interface PerceptionCache {
  query: string;
  result: PerceptionResult;
  expiresAt: number;
}
