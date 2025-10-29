/**
 * Shadow Cache Types
 *
 * Type definitions for the shadow cache database.
 */

/**
 * File record in shadow cache
 */
export interface CachedFile {
  id: number;
  path: string;
  filename: string;
  directory: string;
  size: number;
  created_at: string;
  modified_at: string;
  content_hash: string;
  frontmatter: string | null;
  type: string | null;
  status: string | null;
  title: string | null;
  cache_updated_at: string;
}

/**
 * Frontmatter data structure
 */
export interface Frontmatter {
  type?: string;
  title?: string;
  status?: string;
  created_date?: string;
  tags?: string[];
  [key: string]: unknown; // Allow other frontmatter fields
}

/**
 * Tag record
 */
export interface Tag {
  id: number;
  tag: string;
}

/**
 * Link record
 */
export interface Link {
  id: number;
  source_file_id: number;
  target_path: string;
  link_type: 'wikilink' | 'markdown';
  link_text: string | null;
}

/**
 * File with tags
 */
export interface FileWithTags extends CachedFile {
  tags: string[];
}

/**
 * File with links
 */
export interface FileWithLinks extends CachedFile {
  outgoingLinks: Link[];
  incomingLinks: Link[];
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalFiles: number;
  totalTags: number;
  totalLinks: number;
  lastFullSync: string | null;
  cacheVersion: string;
  databaseSize: number; // in bytes
}

/**
 * File update data
 */
export interface FileUpdate {
  path: string;
  filename: string;
  directory: string;
  size: number;
  created_at: Date;
  modified_at: Date;
  content_hash: string;
  frontmatter: Frontmatter | null;
  title: string | null;
  tags: string[];
  links: Array<{
    target_path: string;
    link_type: 'wikilink' | 'markdown';
    link_text: string | null;
  }>;
}
