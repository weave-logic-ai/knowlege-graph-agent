/**
 * Knowledge Graph Agent - Obsidian Integration Types
 * @module @weave-nn/knowledge-graph-agent/obsidian
 */

import type { DocumentFrontmatter } from './core';

// =============================================================================
// Vault Types
// =============================================================================

/**
 * Obsidian vault file representation
 */
export interface VaultFile {
  /** Absolute file path */
  path: string;

  /** Relative path from vault root */
  relativePath: string;

  /** File name without extension */
  basename: string;

  /** File name with extension */
  name: string;

  /** File extension (without dot) */
  extension: string;

  /** Parent directory relative path */
  parent: string;

  /** File size in bytes */
  size: number;

  /** Last modified timestamp */
  mtime: Date;

  /** Creation timestamp */
  ctime: Date;

  /** Is this file a markdown file */
  isMarkdown: boolean;
}

/**
 * Vault configuration
 */
export interface VaultConfig {
  /** Vault root path */
  path: string;

  /** Vault name (from .obsidian/app.json or directory name) */
  name: string;

  /** File patterns to include */
  include: string[];

  /** File patterns to exclude */
  exclude: string[];

  /** Watch for file changes */
  watch: boolean;

  /** Parse frontmatter from files */
  parseFrontmatter: boolean;

  /** Resolve wikilinks to actual files */
  resolveLinks: boolean;
}

/**
 * Vault metadata from .obsidian directory
 */
export interface VaultMetadata {
  /** Vault name */
  name: string;

  /** Obsidian version (if available) */
  obsidianVersion?: string;

  /** Plugin list */
  plugins?: string[];

  /** Theme name */
  theme?: string;

  /** Custom CSS snippets */
  cssSnippets?: string[];
}

// =============================================================================
// Parsing Types
// =============================================================================

/**
 * Wikilink structure
 */
export interface WikiLink {
  /** Original link text as written in markdown */
  original: string;

  /** Target file/path (without anchor) */
  target: string;

  /** Display alias (from [[target|alias]]) */
  alias?: string;

  /** Anchor/heading reference (from [[target#heading]]) */
  anchor?: string;

  /** Is this an embed (![[...]]) */
  isEmbed: boolean;

  /** Position in content */
  position: ContentPosition;

  /** Resolved file path (null if unresolved) */
  resolvedPath?: string | null;
}

/**
 * Markdown link structure
 */
export interface MarkdownLink {
  /** Link text */
  text: string;

  /** Link URL/path */
  url: string;

  /** Title attribute (from [text](url "title")) */
  title?: string;

  /** Is external link (starts with http/https) */
  isExternal: boolean;

  /** Is anchor link (starts with #) */
  isAnchor: boolean;

  /** Position in content */
  position: ContentPosition;

  /** Resolved file path for internal links (null if external/unresolved) */
  resolvedPath?: string | null;
}

/**
 * Tag structure
 */
export interface Tag {
  /** Tag name (without #) */
  name: string;

  /** Nested tag parts (for nested tags like #parent/child) */
  parts: string[];

  /** Is from frontmatter or inline */
  source: 'frontmatter' | 'inline';

  /** Position in content (for inline tags) */
  position?: ContentPosition;
}

/**
 * Heading structure
 */
export interface Heading {
  /** Heading level (1-6) */
  level: number;

  /** Heading text (raw) */
  text: string;

  /** Heading text (cleaned, for linking) */
  cleanText: string;

  /** Generated slug/anchor */
  slug: string;

  /** Position in content */
  position: ContentPosition;

  /** Child headings */
  children?: Heading[];
}

/**
 * Code block structure
 */
export interface CodeBlock {
  /** Language identifier */
  language: string;

  /** Code content */
  content: string;

  /** Position in content */
  position: ContentPosition;

  /** Is this a code fence (```) or indented */
  isFenced: boolean;
}

/**
 * Content position
 */
export interface ContentPosition {
  /** Start offset (characters from beginning) */
  start: number;

  /** End offset */
  end: number;

  /** Start line number (1-indexed) */
  startLine: number;

  /** End line number */
  endLine: number;

  /** Start column (1-indexed) */
  startColumn: number;

  /** End column */
  endColumn: number;
}

// =============================================================================
// Parsed Document
// =============================================================================

/**
 * Parsed markdown document
 */
export interface ParsedDocument {
  /** Source file information */
  file: VaultFile;

  /** Extracted frontmatter */
  frontmatter: DocumentFrontmatter;

  /** Raw frontmatter string (YAML) */
  rawFrontmatter: string;

  /** Markdown content (without frontmatter) */
  content: string;

  /** Full file content (with frontmatter) */
  rawContent: string;

  /** Extracted wikilinks */
  wikilinks: WikiLink[];

  /** Extracted markdown links */
  markdownLinks: MarkdownLink[];

  /** All links combined */
  allLinks: (WikiLink | MarkdownLink)[];

  /** Extracted tags (frontmatter + inline) */
  tags: Tag[];

  /** Headings structure */
  headings: Heading[];

  /** Code blocks */
  codeBlocks: CodeBlock[];

  /** Word count */
  wordCount: number;

  /** Character count */
  charCount: number;

  /** Parse warnings */
  warnings: ParseWarning[];
}

/**
 * Parse warning
 */
export interface ParseWarning {
  /** Warning type */
  type: 'frontmatter' | 'link' | 'tag' | 'syntax';

  /** Warning message */
  message: string;

  /** Position in content */
  position?: ContentPosition;
}

// =============================================================================
// Link Resolution
// =============================================================================

/**
 * Link resolution result
 */
export interface LinkResolution {
  /** Original link text */
  original: string;

  /** Resolved absolute path (null if unresolved) */
  resolvedPath: string | null;

  /** Resolved relative path */
  resolvedRelativePath: string | null;

  /** Resolution status */
  status: 'resolved' | 'ambiguous' | 'not-found' | 'external';

  /** Possible matches (for ambiguous links) */
  candidates?: string[];

  /** Resolution method used */
  method?: 'exact' | 'basename' | 'alias' | 'fuzzy';
}

/**
 * Link resolution options
 */
export interface LinkResolutionOptions {
  /** Search in these directories first */
  searchPaths?: string[];

  /** Allow fuzzy matching */
  fuzzyMatch?: boolean;

  /** Fuzzy match threshold (0-1) */
  fuzzyThreshold?: number;

  /** Use aliases from frontmatter */
  useAliases?: boolean;

  /** Case-insensitive matching */
  caseInsensitive?: boolean;
}

// =============================================================================
// File Operations
// =============================================================================

/**
 * File write options
 */
export interface WriteOptions {
  /** Create parent directories if needed */
  createDirs?: boolean;

  /** Overwrite existing file */
  overwrite?: boolean;

  /** Update frontmatter if file exists */
  updateFrontmatter?: boolean;

  /** Merge frontmatter (instead of replace) */
  mergeFrontmatter?: boolean;
}

/**
 * File scan options
 */
export interface ScanOptions {
  /** Include patterns (glob) */
  include?: string[];

  /** Exclude patterns (glob) */
  exclude?: string[];

  /** Recursive scan */
  recursive?: boolean;

  /** Follow symlinks */
  followSymlinks?: boolean;

  /** Maximum depth for recursive scan */
  maxDepth?: number;
}

/**
 * Scan result
 */
export interface ScanResult {
  /** Found files */
  files: VaultFile[];

  /** Directories scanned */
  directories: string[];

  /** Total files found */
  totalFiles: number;

  /** Total markdown files */
  markdownFiles: number;

  /** Scan duration in milliseconds */
  duration: number;

  /** Errors encountered */
  errors: ScanError[];
}

/**
 * Scan error
 */
export interface ScanError {
  /** Path that caused error */
  path: string;

  /** Error message */
  message: string;

  /** Error code */
  code: string;
}

// =============================================================================
// Watch Events
// =============================================================================

/**
 * File watch event type
 */
export type WatchEventType = 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';

/**
 * File watch event
 */
export interface WatchEvent {
  /** Event type */
  type: WatchEventType;

  /** File path */
  path: string;

  /** Relative path from vault root */
  relativePath: string;

  /** File stats (for add/change) */
  stats?: VaultFile;

  /** Timestamp */
  timestamp: Date;
}

/**
 * Watch listener function
 */
export type WatchListener = (event: WatchEvent) => void;

// =============================================================================
// Vault Detection
// =============================================================================

/**
 * Vault detection result
 */
export interface VaultDetectionResult {
  /** Is this path an Obsidian vault */
  isVault: boolean;

  /** Vault root path */
  vaultPath?: string;

  /** Vault metadata */
  metadata?: VaultMetadata;

  /** Detection method used */
  method?: 'obsidian-folder' | 'weaver-config' | 'heuristic';

  /** Confidence score (0-1) */
  confidence: number;
}

// =============================================================================
// Frontmatter Operations
// =============================================================================

/**
 * Frontmatter update operation
 */
export interface FrontmatterUpdate {
  /** Fields to set */
  set?: Partial<DocumentFrontmatter>;

  /** Fields to remove */
  remove?: string[];

  /** Tags to add */
  addTags?: string[];

  /** Tags to remove */
  removeTags?: string[];

  /** Update timestamp */
  updateTimestamp?: boolean;
}

/**
 * Frontmatter validation result
 */
export interface FrontmatterValidation {
  /** Is valid */
  valid: boolean;

  /** Validation errors */
  errors: FrontmatterValidationError[];

  /** Validation warnings */
  warnings: FrontmatterValidationError[];
}

/**
 * Frontmatter validation error
 */
export interface FrontmatterValidationError {
  /** Field path */
  field: string;

  /** Error message */
  message: string;

  /** Expected type/value */
  expected?: string;

  /** Actual value */
  actual?: unknown;
}
