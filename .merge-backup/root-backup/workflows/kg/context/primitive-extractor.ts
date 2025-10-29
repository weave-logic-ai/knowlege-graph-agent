/**
 * Primitive Extractor
 *
 * Extracts platforms, patterns, and features from markdown content
 * to understand technical context and domain.
 */

import { readFile } from 'fs/promises';
import matter from 'gray-matter';
import { logger } from '../../../utils/logger.js';

export interface Primitives {
  platforms: string[];
  patterns: string[];
  features: string[];
  domain: string;
}

// Technology platforms and frameworks
const PLATFORM_KEYWORDS = [
  'nodejs',
  'node.js',
  'python',
  'react',
  'vue',
  'angular',
  'typescript',
  'javascript',
  'docker',
  'kubernetes',
  'k8s',
  'aws',
  'azure',
  'gcp',
  'vercel',
  'netlify',
  'postgres',
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'elasticsearch',
  'graphql',
  'rest',
  'grpc',
  'express',
  'fastapi',
  'django',
  'flask',
  'nextjs',
  'next.js',
  'vite',
  'webpack',
  'bun',
  'deno',
];

// Architecture patterns and approaches
const PATTERN_KEYWORDS = [
  'microservices',
  'monolith',
  'rest-api',
  'rest api',
  'graphql',
  'event-driven',
  'pub-sub',
  'pubsub',
  'serverless',
  'lambda',
  'edge-computing',
  'cdn',
  'mvc',
  'mvvm',
  'clean-architecture',
  'hexagonal',
  'cqrs',
  'event-sourcing',
  'saga',
  'repository-pattern',
  'factory-pattern',
  'singleton',
  'observer-pattern',
  'dependency-injection',
  'solid',
  'dry',
  'kiss',
];

// Features and capabilities
const FEATURE_KEYWORDS = [
  'authentication',
  'authorization',
  'oauth',
  'jwt',
  'session',
  'caching',
  'cache',
  'logging',
  'monitoring',
  'metrics',
  'tracing',
  'observability',
  'testing',
  'unit-test',
  'integration-test',
  'e2e',
  'ci-cd',
  'ci/cd',
  'deployment',
  'scaling',
  'load-balancing',
  'rate-limiting',
  'api-gateway',
  'service-mesh',
  'database-migration',
  'backup',
  'disaster-recovery',
  'encryption',
  'security',
  'validation',
  'serialization',
  'pagination',
  'search',
  'full-text-search',
  'real-time',
  'websocket',
  'sse',
];

/**
 * Extract primitives (platforms, patterns, features) from a file
 */
export async function extractPrimitives(filePath: string): Promise<Primitives> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const { data, content: markdownContent } = matter(content);

    // Check frontmatter first for explicit primitives
    if (data.primitives) {
      return categorizePrimitives(data.primitives);
    }

    // Extract from content using keyword matching
    const lowerContent = markdownContent.toLowerCase();

    const platforms = extractByKeywords(lowerContent, PLATFORM_KEYWORDS);
    const patterns = extractByKeywords(lowerContent, PATTERN_KEYWORDS);
    const features = extractByKeywords(lowerContent, FEATURE_KEYWORDS);

    // Infer domain from path and content
    const domain = inferDomain(filePath, data, lowerContent);

    return {
      platforms: deduplicate(platforms),
      patterns: deduplicate(patterns),
      features: deduplicate(features),
      domain,
    };
  } catch (error) {
    logger.error(
      'Error extracting primitives',
      error instanceof Error ? error : new Error(String(error)),
      { filePath }
    );

    return {
      platforms: [],
      patterns: [],
      features: [],
      domain: 'general',
    };
  }
}

/**
 * Extract keywords that appear in the content
 */
function extractByKeywords(content: string, keywords: string[]): string[] {
  const found: string[] = [];

  for (const keyword of keywords) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(content)) {
      found.push(keyword);
    }
  }

  return found;
}

/**
 * Categorize a list of primitives into platforms, patterns, and features
 */
function categorizePrimitives(primitives: string[]): Primitives {
  const platforms: string[] = [];
  const patterns: string[] = [];
  const features: string[] = [];

  for (const primitive of primitives) {
    const lower = primitive.toLowerCase();

    if (PLATFORM_KEYWORDS.some(k => k === lower || lower.includes(k))) {
      platforms.push(primitive);
    } else if (PATTERN_KEYWORDS.some(k => k === lower || lower.includes(k))) {
      patterns.push(primitive);
    } else if (FEATURE_KEYWORDS.some(k => k === lower || lower.includes(k))) {
      features.push(primitive);
    }
  }

  return {
    platforms: deduplicate(platforms),
    patterns: deduplicate(patterns),
    features: deduplicate(features),
    domain: 'general',
  };
}

/**
 * Infer the domain from file path and content
 */
function inferDomain(filePath: string, frontmatter: any, content: string): string {
  // Check frontmatter first
  if (frontmatter.domain) return frontmatter.domain;
  if (frontmatter.category) return frontmatter.category;

  const lowerPath = filePath.toLowerCase();

  // Infer from path (check for /specs before /_planning since specs could be under planning)
  if (lowerPath.includes('/specs') || lowerPath.endsWith('/specs')) return 'specification';
  if (lowerPath.includes('_planning')) return 'planning';
  if (lowerPath.includes('/docs')) return 'documentation';
  if (lowerPath.includes('/src')) return 'backend';
  if (lowerPath.includes('/frontend')) return 'frontend';
  if (lowerPath.includes('/tests')) return 'testing';
  if (lowerPath.includes('/research')) return 'research';
  if (lowerPath.includes('/workflows')) return 'workflow';
  if (lowerPath.includes('/mcp')) return 'mcp';

  // Infer from content keywords (don't let phase numbers override path-based domain)
  if (content.includes('api') || content.includes('endpoint')) return 'backend';
  if (content.includes('component') || content.includes('ui')) return 'frontend';
  if (content.includes('test') || content.includes('spec')) return 'testing';
  if (content.includes('architecture') || content.includes('design')) return 'architecture';
  if (content.includes('workflow') || content.includes('process')) return 'workflow';

  // Check filename for phase markers only if no path-based domain found
  if (lowerPath.includes('phase-')) {
    // Don't override documentation/planning domains with phase markers
    return 'documentation';
  }

  return 'general';
}

/**
 * Remove duplicates from array (case-insensitive)
 */
function deduplicate(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const lower = item.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(item);
    }
  }

  return result;
}

/**
 * Calculate primitive overlap score (0-1)
 */
export function calculatePrimitiveOverlap(
  primitives1: Primitives,
  primitives2: Primitives
): number {
  let score = 0;

  // Same domain = strong signal
  if (primitives1.domain === primitives2.domain && primitives1.domain !== 'general') {
    score += 0.4;
  }

  // Shared platforms
  const platformOverlap = calculateSetOverlap(primitives1.platforms, primitives2.platforms);
  score += platformOverlap * 0.3;

  // Shared patterns
  const patternOverlap = calculateSetOverlap(primitives1.patterns, primitives2.patterns);
  score += patternOverlap * 0.2;

  // Shared features
  const featureOverlap = calculateSetOverlap(primitives1.features, primitives2.features);
  score += featureOverlap * 0.1;

  return Math.min(score, 1.0);
}

/**
 * Calculate Jaccard similarity between two sets
 */
function calculateSetOverlap(set1: string[], set2: string[]): number {
  if (set1.length === 0 && set2.length === 0) return 0;
  if (set1.length === 0 || set2.length === 0) return 0;

  const lower1 = set1.map(s => s.toLowerCase());
  const lower2 = set2.map(s => s.toLowerCase());

  const intersection = lower1.filter(item => lower2.includes(item));
  const union = new Set([...lower1, ...lower2]);

  return intersection.length / union.size;
}

/**
 * Get human-readable primitive summary
 */
export function getPrimitiveSummary(primitives: Primitives): string {
  const parts: string[] = [];

  parts.push(`Domain: ${primitives.domain}`);

  if (primitives.platforms.length > 0) {
    parts.push(`Platforms: ${primitives.platforms.slice(0, 3).join(', ')}`);
  }

  if (primitives.patterns.length > 0) {
    parts.push(`Patterns: ${primitives.patterns.slice(0, 3).join(', ')}`);
  }

  if (primitives.features.length > 0) {
    parts.push(`Features: ${primitives.features.slice(0, 3).join(', ')}`);
  }

  return parts.join(' | ');
}
