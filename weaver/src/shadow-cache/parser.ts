/**
 * Markdown Parser
 *
 * Extracts metadata from markdown files:
 * - YAML frontmatter
 * - Title (from frontmatter or first H1)
 * - Tags
 * - Wikilinks and markdown links
 */

import { readFileSync, statSync } from 'fs';
import { createHash } from 'crypto';
import { basename, dirname } from 'path';
import { logger } from '../utils/logger.js';
import type { Frontmatter, FileUpdate } from './types.js';

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): Frontmatter | null {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!frontmatterMatch || !frontmatterMatch[1]) {
    return null;
  }

  const yamlContent = frontmatterMatch[1];
  const frontmatter: Frontmatter = {};

  // Simple YAML parser (handles basic key: value and arrays)
  const lines = yamlContent.split('\n');
  let currentKey: string | null = null;
  let currentArray: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Array item
    if (trimmed.startsWith('-')) {
      const item = trimmed.slice(1).trim();
      currentArray.push(item);
      continue;
    }

    // If we were building an array, save it
    if (currentKey && currentArray.length > 0) {
      frontmatter[currentKey] = currentArray;
      currentArray = [];
      currentKey = null;
    }

    // Key-value pair
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (!value) {
      // Start of array
      currentKey = key;
      currentArray = [];
    } else {
      // Simple value
      frontmatter[key] = value.replace(/^["']|["']$/g, ''); // Remove quotes
    }
  }

  // Save final array if any
  if (currentKey && currentArray.length > 0) {
    frontmatter[currentKey] = currentArray;
  }

  return frontmatter;
}

/**
 * Extract title from frontmatter or content
 */
function extractTitle(content: string, frontmatter: Frontmatter | null): string | null {
  // Try frontmatter title first
  if (frontmatter?.title) {
    return String(frontmatter.title);
  }

  // Try first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim();
  }

  return null;
}

/**
 * Extract tags from frontmatter
 */
function extractTags(frontmatter: Frontmatter | null): string[] {
  if (!frontmatter || !frontmatter.tags) {
    return [];
  }

  const tags = frontmatter.tags;
  // Tags should always be string[] based on our type definition
  if (Array.isArray(tags)) {
    return tags.map(t => String(t)).filter(t => t && t.trim().length > 0).map(t => t.trim());
  }

  return [];
}

/**
 * Extract wikilinks from content
 */
function extractWikilinks(content: string): Array<{ target_path: string; link_type: 'wikilink'; link_text: string | null }> {
  const wikilinks: Array<{ target_path: string; link_type: 'wikilink'; link_text: string | null }> = [];

  // Match [[target]] or [[target|display text]]
  const wikilinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  let match;

  while ((match = wikilinkRegex.exec(content)) !== null) {
    if (!match[1]) continue;
    const target = match[1].trim();
    const displayText = match[2]?.trim() || null;

    // Convert to path (add .md if not present)
    const targetPath = target.endsWith('.md') ? target : `${target}.md`;

    wikilinks.push({
      target_path: targetPath,
      link_type: 'wikilink',
      link_text: displayText,
    });
  }

  return wikilinks;
}

/**
 * Extract markdown links from content
 */
function extractMarkdownLinks(content: string): Array<{ target_path: string; link_type: 'markdown'; link_text: string | null }> {
  const links: Array<{ target_path: string; link_type: 'markdown'; link_text: string | null }> = [];

  // Match [text](url) - only internal .md links
  const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    if (!match[1] || !match[2]) continue;
    const displayText = match[1].trim();
    const target = match[2].trim();

    links.push({
      target_path: target,
      link_type: 'markdown',
      link_text: displayText || null,
    });
  }

  return links;
}

/**
 * Calculate SHA-256 hash of content
 */
function calculateHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Parse markdown file and extract metadata
 */
export function parseMarkdownFile(absolutePath: string, relativePath: string): FileUpdate {
  try {
    // Read file
    const content = readFileSync(absolutePath, 'utf-8');
    const stats = statSync(absolutePath);

    // Parse frontmatter
    const frontmatter = parseFrontmatter(content);

    // Extract metadata
    const title = extractTitle(content, frontmatter);
    const tags = extractTags(frontmatter);
    const wikilinks = extractWikilinks(content);
    const markdownLinks = extractMarkdownLinks(content);
    const links = [...wikilinks, ...markdownLinks];

    // Calculate content hash
    const contentHash = calculateHash(content);

    return {
      path: relativePath,
      filename: basename(relativePath),
      directory: dirname(relativePath),
      size: stats.size,
      created_at: stats.birthtime,
      modified_at: stats.mtime,
      content_hash: contentHash,
      frontmatter,
      title,
      tags,
      links,
    };
  } catch (error) {
    logger.error('Failed to parse markdown file', error instanceof Error ? error : new Error(String(error)), {
      path: relativePath,
    });
    throw error;
  }
}

/**
 * Check if file content has changed based on hash
 */
export function hasFileChanged(absolutePath: string, cachedHash: string): boolean {
  try {
    const content = readFileSync(absolutePath, 'utf-8');
    const currentHash = calculateHash(content);
    return currentHash !== cachedHash;
  } catch (error) {
    logger.error('Failed to check file hash', error instanceof Error ? error : new Error(String(error)), {
      path: absolutePath,
    });
    return true; // Assume changed if we can't read it
  }
}
