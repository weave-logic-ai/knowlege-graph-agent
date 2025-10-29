/**
 * Document Parser
 *
 * Parses markdown documents with frontmatter extraction.
 * Supports YAML frontmatter and content extraction.
 */

import matter from 'gray-matter';
import { createLogger } from '../utils/logger.js';
import type { ParsedDocument } from './types.js';

const logger = createLogger('chunking:parser');

/**
 * Custom error for parsing failures
 */
export class DocumentParseError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'DocumentParseError';
  }
}

/**
 * Parse markdown document with frontmatter
 *
 * @param content - Raw markdown content
 * @returns Parsed document with frontmatter and content separated
 * @throws DocumentParseError if parsing fails
 */
export function parseDocument(content: string): ParsedDocument {
  try {
    // Use gray-matter to parse frontmatter
    const { data, content: markdownContent } = matter(content);

    logger.debug('Parsed document', {
      hasFrontmatter: Object.keys(data).length > 0,
      frontmatterKeys: Object.keys(data),
      contentLength: markdownContent.length,
    });

    return {
      content: markdownContent.trim(),
      frontmatter: Object.keys(data).length > 0 ? data : null,
      rawContent: content,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to parse document', err);
    throw new DocumentParseError('Failed to parse markdown document', err);
  }
}

/**
 * Extract title from document
 *
 * Priority:
 * 1. Frontmatter title field
 * 2. First H1 heading in content
 * 3. null if no title found
 *
 * @param parsed - Parsed document
 * @returns Document title or null
 */
export function extractTitle(parsed: ParsedDocument): string | null {
  // Try frontmatter title first
  if (parsed.frontmatter?.title && typeof parsed.frontmatter.title === 'string') {
    return parsed.frontmatter.title;
  }

  // Try first H1 heading
  const h1Match = parsed.content.match(/^#\s+(.+)$/m);
  if (h1Match?.[1]) {
    return h1Match[1].trim();
  }

  return null;
}

/**
 * Extract tags from frontmatter
 *
 * @param parsed - Parsed document
 * @returns Array of tags (empty if none found)
 */
export function extractTags(parsed: ParsedDocument): string[] {
  if (!parsed.frontmatter?.tags) {
    return [];
  }

  const tags = parsed.frontmatter.tags;

  // Handle array of tags
  if (Array.isArray(tags)) {
    return tags
      .map(t => String(t))
      .filter(t => t && t.trim().length > 0)
      .map(t => t.trim());
  }

  // Handle single tag
  if (typeof tags === 'string') {
    return [tags.trim()];
  }

  return [];
}

/**
 * Extract document ID from frontmatter
 *
 * @param parsed - Parsed document
 * @returns Document ID or null
 */
export function extractDocId(parsed: ParsedDocument): string | null {
  if (parsed.frontmatter?.doc_id && typeof parsed.frontmatter.doc_id === 'string') {
    return parsed.frontmatter.doc_id;
  }

  if (parsed.frontmatter?.id && typeof parsed.frontmatter.id === 'string') {
    return parsed.frontmatter.id;
  }

  return null;
}

/**
 * Extract content type from frontmatter
 *
 * @param parsed - Parsed document
 * @returns Content type or null
 */
export function extractContentType(parsed: ParsedDocument): string | null {
  if (parsed.frontmatter?.content_type && typeof parsed.frontmatter.content_type === 'string') {
    return parsed.frontmatter.content_type;
  }

  if (parsed.frontmatter?.type && typeof parsed.frontmatter.type === 'string') {
    return parsed.frontmatter.type;
  }

  return null;
}

/**
 * Extract metadata from parsed document
 *
 * @param parsed - Parsed document
 * @returns Metadata object
 */
export function extractMetadata(parsed: ParsedDocument): Record<string, unknown> {
  return {
    title: extractTitle(parsed),
    tags: extractTags(parsed),
    docId: extractDocId(parsed),
    contentType: extractContentType(parsed),
    hasFrontmatter: parsed.frontmatter !== null,
    ...parsed.frontmatter,
  };
}
