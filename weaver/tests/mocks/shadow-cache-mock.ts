/**
 * Mock Shadow Cache for Testing
 *
 * Provides in-memory mock implementation of shadow cache
 * for isolated unit testing without database dependencies.
 */

import type { CachedFile, Tag, Link, CacheStats } from '../../src/shadow-cache/types.js';

export interface MockShadowCacheData {
  files: CachedFile[];
  tags: Tag[];
  links: Link[];
  fileTags: Map<number, number[]>; // file_id -> tag_ids
  metadata: Map<string, string>;
}

export class MockShadowCache {
  private data: MockShadowCacheData;

  constructor(initialData?: Partial<MockShadowCacheData>) {
    this.data = {
      files: initialData?.files || [],
      tags: initialData?.tags || [],
      links: initialData?.links || [],
      fileTags: initialData?.fileTags || new Map(),
      metadata: initialData?.metadata || new Map([['version', '1.0.0']]),
    };
  }

  /**
   * Get file by path
   */
  getFile(path: string): CachedFile | null {
    return this.data.files.find(f => f.path === path) || null;
  }

  /**
   * Get all files
   */
  getAllFiles(): CachedFile[] {
    return [...this.data.files];
  }

  /**
   * Get files by directory
   */
  getFilesByDirectory(directory: string): CachedFile[] {
    return this.data.files.filter(f => f.directory === directory);
  }

  /**
   * Get files by type
   */
  getFilesByType(type: string): CachedFile[] {
    return this.data.files.filter(f => f.type === type);
  }

  /**
   * Get files by status
   */
  getFilesByStatus(status: string): CachedFile[] {
    return this.data.files.filter(f => f.status === status);
  }

  /**
   * Get files by tag
   */
  getFilesByTag(tag: string): CachedFile[] {
    const tagRecord = this.data.tags.find(t => t.tag === tag);
    if (!tagRecord) return [];

    const fileIds = Array.from(this.data.fileTags.entries())
      .filter(([_, tagIds]) => tagIds.includes(tagRecord.id))
      .map(([fileId]) => fileId);

    return this.data.files.filter(f => fileIds.includes(f.id));
  }

  /**
   * Search files by title or path
   */
  searchFiles(query: string): CachedFile[] {
    const pattern = query.toLowerCase();
    return this.data.files
      .filter(f =>
        f.title?.toLowerCase().includes(pattern) ||
        f.path.toLowerCase().includes(pattern)
      )
      .slice(0, 100);
  }

  /**
   * Get tags for a file
   */
  getFileTags(fileId: number): string[] {
    const tagIds = this.data.fileTags.get(fileId) || [];
    return tagIds
      .map(tagId => this.data.tags.find(t => t.id === tagId)?.tag)
      .filter((tag): tag is string => tag !== undefined);
  }

  /**
   * Get all tags
   */
  getAllTags(): Tag[] {
    return [...this.data.tags];
  }

  /**
   * Get outgoing links for a file
   */
  getOutgoingLinks(fileId: number): Link[] {
    return this.data.links.filter(l => l.source_file_id === fileId);
  }

  /**
   * Get incoming links to a file path
   */
  getIncomingLinks(targetPath: string): Link[] {
    return this.data.links.filter(l => l.target_path === targetPath);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      totalFiles: this.data.files.length,
      totalTags: this.data.tags.length,
      totalLinks: this.data.links.length,
      lastFullSync: this.data.metadata.get('last_full_sync') || null,
      cacheVersion: this.data.metadata.get('version') || '1.0.0',
      databaseSize: 1024 * 1024, // Mock 1MB
    };
  }

  /**
   * Add mock file
   */
  addFile(file: CachedFile): void {
    this.data.files.push(file);
  }

  /**
   * Add mock tag
   */
  addTag(tag: Tag): void {
    this.data.tags.push(tag);
  }

  /**
   * Add mock link
   */
  addLink(link: Link): void {
    this.data.links.push(link);
  }

  /**
   * Associate tag with file
   */
  addFileTag(fileId: number, tagId: number): void {
    const existing = this.data.fileTags.get(fileId) || [];
    if (!existing.includes(tagId)) {
      this.data.fileTags.set(fileId, [...existing, tagId]);
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.data.files = [];
    this.data.tags = [];
    this.data.links = [];
    this.data.fileTags.clear();
  }

  /**
   * Get database - provide db property for compatibility
   */
  get db() {
    return this;
  }

  /**
   * Get raw database instance (for advanced queries)
   */
  getDatabase() {
    return this;
  }
}

/**
 * Create mock test data
 */
export function createMockTestData(): MockShadowCacheData {
  const files: CachedFile[] = [
    {
      id: 1,
      path: 'concepts/neural-networks.md',
      filename: 'neural-networks.md',
      directory: 'concepts',
      size: 5420,
      created_at: '2025-01-01T10:00:00Z',
      modified_at: '2025-01-15T14:30:00Z',
      content_hash: 'abc123',
      frontmatter: JSON.stringify({
        type: 'concept',
        status: 'active',
        title: 'Neural Networks',
      }),
      type: 'concept',
      status: 'active',
      title: 'Neural Networks',
      cache_updated_at: '2025-01-15T14:31:00Z',
    },
    {
      id: 2,
      path: 'features/F-001-graph-rendering.md',
      filename: 'F-001-graph-rendering.md',
      directory: 'features',
      size: 3200,
      created_at: '2025-01-02T09:00:00Z',
      modified_at: '2025-01-10T16:00:00Z',
      content_hash: 'def456',
      frontmatter: JSON.stringify({
        type: 'feature',
        status: 'in-progress',
        title: 'Graph Rendering',
      }),
      type: 'feature',
      status: 'in-progress',
      title: 'Graph Rendering',
      cache_updated_at: '2025-01-10T16:01:00Z',
    },
    {
      id: 3,
      path: 'technical/obsidian.md',
      filename: 'obsidian.md',
      directory: 'technical',
      size: 2100,
      created_at: '2025-01-03T11:00:00Z',
      modified_at: '2025-01-12T10:00:00Z',
      content_hash: 'ghi789',
      frontmatter: JSON.stringify({
        type: 'technical',
        status: 'active',
        title: 'Obsidian Integration',
      }),
      type: 'technical',
      status: 'active',
      title: 'Obsidian Integration',
      cache_updated_at: '2025-01-12T10:01:00Z',
    },
  ];

  const tags: Tag[] = [
    { id: 1, tag: 'machine-learning' },
    { id: 2, tag: 'graph-theory' },
    { id: 3, tag: 'visualization' },
    { id: 4, tag: 'concept' },
    { id: 5, tag: 'technical' },
  ];

  const links: Link[] = [
    {
      id: 1,
      source_file_id: 1,
      target_path: 'concepts/deep-learning.md',
      link_type: 'wikilink',
      link_text: 'Deep Learning',
    },
    {
      id: 2,
      source_file_id: 2,
      target_path: 'technical/obsidian.md',
      link_type: 'wikilink',
      link_text: 'Obsidian',
    },
    {
      id: 3,
      source_file_id: 3,
      target_path: 'concepts/neural-networks.md',
      link_type: 'markdown',
      link_text: null,
    },
  ];

  const fileTags = new Map<number, number[]>([
    [1, [1, 4]], // neural-networks: machine-learning, concept
    [2, [2, 3]], // graph-rendering: graph-theory, visualization
    [3, [5]], // obsidian: technical
  ]);

  const metadata = new Map<string, string>([
    ['version', '1.0.0'],
    ['last_full_sync', '2025-01-15T15:00:00Z'],
  ]);

  return { files, tags, links, fileTags, metadata };
}
