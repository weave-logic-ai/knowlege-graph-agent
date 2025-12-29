/**
 * Claude-Flow Memory Client Tests
 *
 * Tests for the high-level memory client including:
 * - Node CRUD operations
 * - Index management
 * - Batch operations
 * - Type safety
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ClaudeFlowMemoryClient,
  createClaudeFlowMemoryClient,
  type MemoryNodeEntry,
  type MemoryIndexEntry,
  type MemoryGraphStats,
  type MemoryMetadata,
} from '../../../src/mcp/clients/claude-flow-memory-client.js';
import { McpClientAdapter } from '../../../src/mcp/clients/mcp-client-adapter.js';

// Mock the adapter
vi.mock('../../../src/mcp/clients/mcp-client-adapter.js', () => ({
  McpClientAdapter: vi.fn().mockImplementation(() => ({
    memoryStore: vi.fn().mockResolvedValue(true),
    memoryRetrieve: vi.fn().mockResolvedValue(null),
    memorySearch: vi.fn().mockResolvedValue([]),
    memoryDelete: vi.fn().mockResolvedValue(true),
    memoryList: vi.fn().mockResolvedValue([]),
    isCliAvailable: vi.fn().mockResolvedValue(true),
    clearFallback: vi.fn(),
    getConfig: vi.fn().mockReturnValue({ maxRetries: 3 }),
  })),
  createMcpClientAdapter: vi.fn().mockImplementation(() => ({
    memoryStore: vi.fn().mockResolvedValue(true),
    memoryRetrieve: vi.fn().mockResolvedValue(null),
    memorySearch: vi.fn().mockResolvedValue([]),
    memoryDelete: vi.fn().mockResolvedValue(true),
    memoryList: vi.fn().mockResolvedValue([]),
    isCliAvailable: vi.fn().mockResolvedValue(true),
    clearFallback: vi.fn(),
    getConfig: vi.fn().mockReturnValue({ maxRetries: 3 }),
  })),
}));

describe('ClaudeFlowMemoryClient', () => {
  let client: ClaudeFlowMemoryClient;
  let mockAdapter: ReturnType<typeof vi.fn>;

  const sampleNode: MemoryNodeEntry = {
    id: 'node-123',
    title: 'Test Node',
    type: 'document',
    status: 'active',
    path: '/docs/test.md',
    tags: ['test', 'sample'],
    outgoingLinks: ['node-456'],
    incomingLinks: ['node-789'],
    summary: 'A test node for unit testing',
    contentHash: 'abc123',
    lastModified: '2024-01-01T00:00:00Z',
    syncedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ClaudeFlowMemoryClient({
      namespace: 'test-namespace',
    });
    mockAdapter = client.getAdapter() as unknown as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default config values', () => {
      const defaultClient = new ClaudeFlowMemoryClient();
      expect(defaultClient.getNamespace()).toBe('knowledge-graph');
    });

    it('should accept custom namespace', () => {
      const customClient = new ClaudeFlowMemoryClient({
        namespace: 'custom-ns',
      });
      expect(customClient.getNamespace()).toBe('custom-ns');
    });
  });

  describe('createClaudeFlowMemoryClient', () => {
    it('should create client with default config', () => {
      const created = createClaudeFlowMemoryClient();
      expect(created).toBeInstanceOf(ClaudeFlowMemoryClient);
    });

    it('should create client with custom config', () => {
      const created = createClaudeFlowMemoryClient({ namespace: 'test' });
      expect(created.getNamespace()).toBe('test');
    });
  });

  describe('storeNode', () => {
    it('should store node with correct key', async () => {
      const adapter = client.getAdapter();
      const result = await client.storeNode(sampleNode);

      expect(result).toBe(true);
      expect(adapter.memoryStore).toHaveBeenCalledWith(
        'node/node-123',
        sampleNode,
        'test-namespace',
        undefined
      );
    });

    it('should store node with TTL', async () => {
      const adapter = client.getAdapter();
      await client.storeNode(sampleNode, 3600);

      expect(adapter.memoryStore).toHaveBeenCalledWith(
        'node/node-123',
        sampleNode,
        'test-namespace',
        3600
      );
    });

    it('should return false on failure', async () => {
      const adapter = client.getAdapter();
      (adapter.memoryStore as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      const result = await client.storeNode(sampleNode);

      expect(result).toBe(false);
    });
  });

  describe('getNode', () => {
    it('should retrieve and parse node', async () => {
      const adapter = client.getAdapter();
      (adapter.memoryRetrieve as ReturnType<typeof vi.fn>).mockResolvedValue(
        JSON.stringify(sampleNode)
      );

      const result = await client.getNode('node-123');

      expect(result).toEqual(sampleNode);
      expect(adapter.memoryRetrieve).toHaveBeenCalledWith('node/node-123', 'test-namespace');
    });

    it('should return null for non-existent node', async () => {
      const adapter = client.getAdapter();
      (adapter.memoryRetrieve as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await client.getNode('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', async () => {
      const adapter = client.getAdapter();
      (adapter.memoryRetrieve as ReturnType<typeof vi.fn>).mockResolvedValue('invalid json');

      const result = await client.getNode('node-123');

      expect(result).toBeNull();
    });
  });

  describe('deleteNode', () => {
    it('should delete node with correct key', async () => {
      const adapter = client.getAdapter();
      const result = await client.deleteNode('node-123');

      expect(result).toBe(true);
      expect(adapter.memoryDelete).toHaveBeenCalledWith('node/node-123', 'test-namespace');
    });
  });

  describe('storeNodesBatch', () => {
    it('should store multiple nodes', async () => {
      const adapter = client.getAdapter();
      const nodes = [
        { ...sampleNode, id: 'node-1' },
        { ...sampleNode, id: 'node-2' },
        { ...sampleNode, id: 'node-3' },
      ];

      const result = await client.storeNodesBatch(nodes);

      expect(result.total).toBe(3);
      expect(result.succeeded).toBe(3);
      expect(result.failed).toBe(0);
      expect(adapter.memoryStore).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures', async () => {
      const adapter = client.getAdapter();
      let callCount = 0;
      (adapter.memoryStore as ReturnType<typeof vi.fn>).mockImplementation(() => {
        callCount++;
        return Promise.resolve(callCount !== 2); // Fail on second call
      });

      const nodes = [
        { ...sampleNode, id: 'node-1' },
        { ...sampleNode, id: 'node-2' },
        { ...sampleNode, id: 'node-3' },
      ];

      const result = await client.storeNodesBatch(nodes);

      expect(result.total).toBe(3);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors.length).toBe(1);
    });

    it('should include TTL for batch operations', async () => {
      const adapter = client.getAdapter();
      const nodes = [{ ...sampleNode, id: 'node-1' }];

      await client.storeNodesBatch(nodes, 3600);

      expect(adapter.memoryStore).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.any(String),
        3600
      );
    });
  });

  describe('searchNodes', () => {
    it('should search with node prefix', async () => {
      const adapter = client.getAdapter();
      (adapter.memorySearch as ReturnType<typeof vi.fn>).mockResolvedValue([
        'node/abc',
        'node/def',
      ]);

      const result = await client.searchNodes('*');

      expect(result).toEqual(['node/abc', 'node/def']);
      expect(adapter.memorySearch).toHaveBeenCalledWith(
        'node/*',
        'test-namespace',
        100
      );
    });

    it('should preserve existing prefix', async () => {
      const adapter = client.getAdapter();
      await client.searchNodes('node/abc*', 50);

      expect(adapter.memorySearch).toHaveBeenCalledWith(
        'node/abc*',
        'test-namespace',
        50
      );
    });
  });

  describe('storeNodeIndex', () => {
    it('should store node index', async () => {
      const adapter = client.getAdapter();
      const entries: MemoryIndexEntry[] = [
        { id: 'node-1', title: 'Node 1', type: 'doc', path: '/a' },
        { id: 'node-2', title: 'Node 2', type: 'doc', path: '/b' },
      ];

      const result = await client.storeNodeIndex(entries);

      expect(result).toBe(true);
      expect(adapter.memoryStore).toHaveBeenCalledWith(
        'index/nodes',
        entries,
        'test-namespace'
      );
    });
  });

  describe('getNodeIndex', () => {
    it('should retrieve and parse node index', async () => {
      const adapter = client.getAdapter();
      const entries: MemoryIndexEntry[] = [
        { id: 'node-1', title: 'Node 1', type: 'doc', path: '/a' },
      ];
      (adapter.memoryRetrieve as ReturnType<typeof vi.fn>).mockResolvedValue(
        JSON.stringify(entries)
      );

      const result = await client.getNodeIndex();

      expect(result).toEqual(entries);
    });

    it('should return null for missing index', async () => {
      const adapter = client.getAdapter();
      (adapter.memoryRetrieve as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const result = await client.getNodeIndex();

      expect(result).toBeNull();
    });
  });

  describe('storeTagIndex', () => {
    it('should store tag index', async () => {
      const adapter = client.getAdapter();
      const tagIndex: Record<string, string[]> = {
        'tag1': ['node-1', 'node-2'],
        'tag2': ['node-3'],
      };

      const result = await client.storeTagIndex(tagIndex);

      expect(result).toBe(true);
      expect(adapter.memoryStore).toHaveBeenCalledWith(
        'index/tags',
        tagIndex,
        'test-namespace'
      );
    });
  });

  describe('getTagIndex', () => {
    it('should retrieve and parse tag index', async () => {
      const adapter = client.getAdapter();
      const tagIndex: Record<string, string[]> = {
        'tag1': ['node-1'],
      };
      (adapter.memoryRetrieve as ReturnType<typeof vi.fn>).mockResolvedValue(
        JSON.stringify(tagIndex)
      );

      const result = await client.getTagIndex();

      expect(result).toEqual(tagIndex);
    });
  });

  describe('storeStats', () => {
    it('should store graph stats', async () => {
      const adapter = client.getAdapter();
      const stats: MemoryGraphStats = {
        totalNodes: 100,
        totalEdges: 250,
        nodesByType: { document: 50, concept: 50 },
        nodesByStatus: { active: 80, archived: 20 },
        averageLinksPerNode: 2.5,
        orphanNodes: 5,
      };

      const result = await client.storeStats(stats);

      expect(result).toBe(true);
      expect(adapter.memoryStore).toHaveBeenCalledWith(
        'stats',
        stats,
        'test-namespace'
      );
    });
  });

  describe('getStats', () => {
    it('should retrieve and parse stats', async () => {
      const adapter = client.getAdapter();
      const stats: MemoryGraphStats = {
        totalNodes: 100,
        totalEdges: 250,
        nodesByType: {},
        nodesByStatus: {},
        averageLinksPerNode: 2.5,
        orphanNodes: 5,
      };
      (adapter.memoryRetrieve as ReturnType<typeof vi.fn>).mockResolvedValue(
        JSON.stringify(stats)
      );

      const result = await client.getStats();

      expect(result).toEqual(stats);
    });
  });

  describe('storeMetadata', () => {
    it('should store metadata', async () => {
      const adapter = client.getAdapter();
      const metadata: MemoryMetadata = {
        lastSync: '2024-01-01T00:00:00Z',
        nodeCount: 100,
        namespace: 'test',
        version: '1.0.0',
      };

      const result = await client.storeMetadata(metadata);

      expect(result).toBe(true);
      expect(adapter.memoryStore).toHaveBeenCalledWith(
        'metadata',
        metadata,
        'test-namespace'
      );
    });
  });

  describe('getMetadata', () => {
    it('should retrieve and parse metadata', async () => {
      const adapter = client.getAdapter();
      const metadata: MemoryMetadata = {
        lastSync: '2024-01-01T00:00:00Z',
        nodeCount: 100,
        namespace: 'test',
      };
      (adapter.memoryRetrieve as ReturnType<typeof vi.fn>).mockResolvedValue(
        JSON.stringify(metadata)
      );

      const result = await client.getMetadata();

      expect(result).toEqual(metadata);
    });
  });

  describe('store/retrieve/delete', () => {
    it('should store custom key-value', async () => {
      const adapter = client.getAdapter();
      const result = await client.store('custom-key', { data: 'value' }, 3600);

      expect(result).toBe(true);
      expect(adapter.memoryStore).toHaveBeenCalledWith(
        'custom-key',
        { data: 'value' },
        'test-namespace',
        3600
      );
    });

    it('should retrieve custom key', async () => {
      const adapter = client.getAdapter();
      (adapter.memoryRetrieve as ReturnType<typeof vi.fn>).mockResolvedValue(
        JSON.stringify({ data: 'value' })
      );

      const result = await client.retrieve<{ data: string }>('custom-key');

      expect(result).toEqual({ data: 'value' });
    });

    it('should retrieve non-JSON value', async () => {
      const adapter = client.getAdapter();
      (adapter.memoryRetrieve as ReturnType<typeof vi.fn>).mockResolvedValue('plain string');

      const result = await client.retrieve<string>('custom-key');

      expect(result).toBe('plain string');
    });

    it('should delete custom key', async () => {
      const adapter = client.getAdapter();
      const result = await client.delete('custom-key');

      expect(result).toBe(true);
      expect(adapter.memoryDelete).toHaveBeenCalledWith('custom-key', 'test-namespace');
    });
  });

  describe('search', () => {
    it('should search with pattern', async () => {
      const adapter = client.getAdapter();
      (adapter.memorySearch as ReturnType<typeof vi.fn>).mockResolvedValue(['key1', 'key2']);

      const result = await client.search('key*', 50);

      expect(result).toEqual(['key1', 'key2']);
      expect(adapter.memorySearch).toHaveBeenCalledWith('key*', 'test-namespace', 50);
    });
  });

  describe('listKeys', () => {
    it('should list all keys', async () => {
      const adapter = client.getAdapter();
      (adapter.memoryList as ReturnType<typeof vi.fn>).mockResolvedValue(['key1', 'key2', 'key3']);

      const result = await client.listKeys();

      expect(result).toEqual(['key1', 'key2', 'key3']);
      expect(adapter.memoryList).toHaveBeenCalledWith('test-namespace');
    });
  });

  describe('isCliAvailable', () => {
    it('should check CLI availability', async () => {
      const adapter = client.getAdapter();
      (adapter.isCliAvailable as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const result = await client.isCliAvailable();

      expect(result).toBe(true);
    });
  });

  describe('clearFallback', () => {
    it('should clear fallback storage', () => {
      const adapter = client.getAdapter();
      client.clearFallback();

      expect(adapter.clearFallback).toHaveBeenCalledWith('test-namespace');
    });
  });

  describe('getAdapter', () => {
    it('should return the underlying adapter', () => {
      const adapter = client.getAdapter();
      expect(adapter).toBeDefined();
    });
  });
});
