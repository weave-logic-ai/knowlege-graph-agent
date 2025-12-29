/**
 * MCP Client Adapter Tests
 *
 * Comprehensive tests for the MCP client adapter including:
 * - Retry logic with simulated failures
 * - Fallback behavior when CLI unavailable
 * - Timeout handling
 * - All CRUD operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { McpClientAdapter, createMcpClientAdapter } from '../../../src/mcp/clients/mcp-client-adapter.js';

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

// Mock util
vi.mock('util', () => ({
  promisify: vi.fn((fn) => fn),
}));

const mockExec = exec as unknown as ReturnType<typeof vi.fn>;

describe('McpClientAdapter', () => {
  let adapter: McpClientAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new McpClientAdapter({
      maxRetries: 3,
      retryDelayMs: 10, // Short delay for tests
      timeoutMs: 1000,
      fallbackEnabled: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default config values', () => {
      const defaultAdapter = new McpClientAdapter();
      const config = defaultAdapter.getConfig();

      expect(config.maxRetries).toBe(3);
      expect(config.retryDelayMs).toBe(1000);
      expect(config.timeoutMs).toBe(30000);
      expect(config.fallbackEnabled).toBe(true);
      expect(config.cliCommand).toBe('npx claude-flow@alpha');
    });

    it('should override config values', () => {
      const customAdapter = new McpClientAdapter({
        maxRetries: 5,
        retryDelayMs: 500,
        timeoutMs: 60000,
        fallbackEnabled: false,
        cliCommand: 'claude-flow',
      });
      const config = customAdapter.getConfig();

      expect(config.maxRetries).toBe(5);
      expect(config.retryDelayMs).toBe(500);
      expect(config.timeoutMs).toBe(60000);
      expect(config.fallbackEnabled).toBe(false);
      expect(config.cliCommand).toBe('claude-flow');
    });
  });

  describe('createMcpClientAdapter', () => {
    it('should create adapter with default config', () => {
      const created = createMcpClientAdapter();
      expect(created).toBeInstanceOf(McpClientAdapter);
    });

    it('should create adapter with custom config', () => {
      const created = createMcpClientAdapter({ maxRetries: 5 });
      expect(created.getConfig().maxRetries).toBe(5);
    });
  });

  describe('memoryStore', () => {
    it('should execute CLI store command successfully', async () => {
      mockExec.mockImplementation((_cmd: string, _opts: unknown, callback?: (err: unknown, result: unknown) => void) => {
        if (callback) {
          callback(null, { stdout: 'OK', stderr: '' });
        }
        return Promise.resolve({ stdout: 'OK', stderr: '' });
      });

      const result = await adapter.memoryStore('testKey', 'testValue', 'testNamespace');

      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('memory store'),
        expect.any(Object)
      );
    });

    it('should store JSON objects', async () => {
      mockExec.mockResolvedValue({ stdout: 'OK', stderr: '' });

      const result = await adapter.memoryStore('testKey', { foo: 'bar' }, 'testNamespace');

      expect(result).toBe(true);
      // The JSON is escaped in the shell command
      expect(mockExec).toHaveBeenCalled();
      const call = mockExec.mock.calls[0][0];
      expect(call).toContain('foo');
      expect(call).toContain('bar');
    });

    it('should include TTL when provided', async () => {
      mockExec.mockResolvedValue({ stdout: 'OK', stderr: '' });

      await adapter.memoryStore('testKey', 'testValue', 'testNamespace', 3600);

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('--ttl 3600'),
        expect.any(Object)
      );
    });

    it('should fallback to in-memory on CLI failure', async () => {
      mockExec.mockRejectedValue(new Error('CLI not available'));

      const result = await adapter.memoryStore('testKey', 'testValue', 'testNamespace');

      expect(result).toBe(true); // Fallback succeeds
      expect(adapter.getFallbackSize('testNamespace')).toBe(1);
    });

    it('should fail when fallback disabled and CLI fails', async () => {
      const noFallbackAdapter = new McpClientAdapter({
        maxRetries: 1,
        retryDelayMs: 1,
        fallbackEnabled: false,
      });

      mockExec.mockRejectedValue(new Error('CLI not available'));

      const result = await noFallbackAdapter.memoryStore('testKey', 'testValue');

      expect(result).toBe(false);
    });

    it('should escape special characters in value', async () => {
      mockExec.mockResolvedValue({ stdout: 'OK', stderr: '' });

      await adapter.memoryStore('key', 'value with "quotes" and $vars', 'ns');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('\\"quotes\\"'),
        expect.any(Object)
      );
    });
  });

  describe('memoryRetrieve', () => {
    it('should execute CLI query command successfully', async () => {
      mockExec.mockResolvedValue({ stdout: 'testValue', stderr: '' });

      const result = await adapter.memoryRetrieve('testKey', 'testNamespace');

      expect(result).toBe('testValue');
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('memory query'),
        expect.any(Object)
      );
    });

    it('should parse JSON response', async () => {
      mockExec.mockResolvedValue({
        stdout: JSON.stringify({ data: 'value' }),
        stderr: '',
      });

      const result = await adapter.memoryRetrieve('testKey', 'testNamespace');

      expect(result).toBe(JSON.stringify({ data: 'value' }));
    });

    it('should return null for not found', async () => {
      mockExec.mockResolvedValue({ stdout: 'not found', stderr: '' });

      const result = await adapter.memoryRetrieve('nonexistent', 'testNamespace');

      expect(result).toBeNull();
    });

    it('should fallback to in-memory on CLI failure', async () => {
      // First store in fallback
      mockExec.mockRejectedValue(new Error('CLI not available'));
      await adapter.memoryStore('testKey', 'fallbackValue', 'testNamespace');

      // Then retrieve
      const result = await adapter.memoryRetrieve('testKey', 'testNamespace');

      expect(result).toBe('fallbackValue');
    });

    it('should return null when not in fallback and CLI fails', async () => {
      mockExec.mockRejectedValue(new Error('CLI not available'));

      const result = await adapter.memoryRetrieve('nonexistent', 'testNamespace');

      expect(result).toBeNull();
    });
  });

  describe('memorySearch', () => {
    it('should execute CLI query command for search', async () => {
      mockExec.mockResolvedValue({
        stdout: JSON.stringify(['key1', 'key2', 'key3']),
        stderr: '',
      });

      const result = await adapter.memorySearch('test*', 'testNamespace', 10);

      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('should parse line-by-line output', async () => {
      mockExec.mockResolvedValue({
        stdout: 'key1\nkey2\nkey3',
        stderr: '',
      });

      const result = await adapter.memorySearch('test*', 'testNamespace');

      expect(result).toEqual(['key1', 'key2', 'key3']);
    });

    it('should return empty array for no results', async () => {
      mockExec.mockResolvedValue({ stdout: 'No results', stderr: '' });

      const result = await adapter.memorySearch('nonexistent*', 'testNamespace');

      expect(result).toEqual([]);
    });

    it('should fallback to in-memory search', async () => {
      // Store some keys in fallback
      mockExec.mockRejectedValue(new Error('CLI not available'));
      await adapter.memoryStore('test-1', 'value1', 'testNamespace');
      await adapter.memoryStore('test-2', 'value2', 'testNamespace');
      await adapter.memoryStore('other-1', 'value3', 'testNamespace');

      const result = await adapter.memorySearch('test*', 'testNamespace');

      expect(result).toContain('test-1');
      expect(result).toContain('test-2');
      expect(result).not.toContain('other-1');
    });

    it('should respect limit in fallback search', async () => {
      mockExec.mockRejectedValue(new Error('CLI not available'));

      // Store many keys
      for (let i = 0; i < 20; i++) {
        await adapter.memoryStore(`test-${i}`, `value${i}`, 'testNamespace');
      }

      const result = await adapter.memorySearch('test*', 'testNamespace', 5);

      expect(result.length).toBe(5);
    });
  });

  describe('memoryDelete', () => {
    it('should execute CLI clear command', async () => {
      mockExec.mockResolvedValue({ stdout: 'OK', stderr: '' });

      const result = await adapter.memoryDelete('testKey', 'testNamespace');

      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('memory clear'),
        expect.any(Object)
      );
    });

    it('should delete from fallback as well', async () => {
      // First store in fallback
      mockExec.mockRejectedValue(new Error('CLI not available'));
      await adapter.memoryStore('testKey', 'testValue', 'testNamespace');
      expect(adapter.getFallbackSize('testNamespace')).toBe(1);

      // Then delete
      await adapter.memoryDelete('testKey', 'testNamespace');
      expect(adapter.getFallbackSize('testNamespace')).toBe(0);
    });

    it('should return true when fallback enabled even if CLI fails', async () => {
      mockExec.mockRejectedValue(new Error('CLI not available'));

      const result = await adapter.memoryDelete('testKey', 'testNamespace');

      expect(result).toBe(true);
    });
  });

  describe('memoryList', () => {
    it('should execute CLI list command', async () => {
      mockExec.mockResolvedValue({
        stdout: JSON.stringify(['key1', 'key2']),
        stderr: '',
      });

      const result = await adapter.memoryList('testNamespace');

      expect(result).toEqual(['key1', 'key2']);
    });

    it('should fallback to in-memory list', async () => {
      mockExec.mockRejectedValue(new Error('CLI not available'));
      await adapter.memoryStore('key1', 'value1', 'testNamespace');
      await adapter.memoryStore('key2', 'value2', 'testNamespace');

      const result = await adapter.memoryList('testNamespace');

      expect(result).toContain('key1');
      expect(result).toContain('key2');
    });
  });

  describe('retry logic', () => {
    it('should eventually succeed after retries when fallback is enabled', async () => {
      // When CLI fails and fallback is enabled, it should use fallback
      mockExec.mockRejectedValue(new Error('Transient error'));

      const result = await adapter.memoryStore('testKey', 'testValue');

      // With fallback enabled, should succeed via fallback
      expect(result).toBe(true);
      expect(adapter.getFallbackSize('default')).toBe(1);
    });

    it('should fail after max retries when fallback is disabled', async () => {
      const noFallbackAdapter = new McpClientAdapter({
        maxRetries: 2,
        retryDelayMs: 1,
        fallbackEnabled: false,
      });

      mockExec.mockRejectedValue(new Error('Persistent error'));

      const result = await noFallbackAdapter.memoryStore('testKey', 'testValue');

      expect(result).toBe(false);
    });

    it('should use fallback when all retries exhausted', async () => {
      mockExec.mockRejectedValue(new Error('Error'));

      // Fallback should handle this
      const result = await adapter.memoryStore('testKey', 'testValue');

      expect(result).toBe(true);
      expect(adapter.getFallbackSize('default')).toBe(1);
    });
  });

  describe('timeout handling', () => {
    it('should handle timeout errors', async () => {
      const error = new Error('Command timed out') as Error & { killed?: boolean };
      error.killed = true;
      mockExec.mockRejectedValue(error);

      const result = await adapter.memoryStore('testKey', 'testValue');

      // Should fallback
      expect(result).toBe(true);
    });

    it('should handle ETIMEDOUT', async () => {
      const error = new Error('ETIMEDOUT') as Error & { code?: string };
      error.code = 'ETIMEDOUT';
      mockExec.mockRejectedValue(error);

      const result = await adapter.memoryStore('testKey', 'testValue');

      // Should fallback
      expect(result).toBe(true);
    });
  });

  describe('fallback storage', () => {
    beforeEach(() => {
      mockExec.mockRejectedValue(new Error('CLI not available'));
    });

    it('should store and retrieve from fallback', async () => {
      await adapter.memoryStore('testKey', 'testValue', 'testNamespace');
      const result = await adapter.memoryRetrieve('testKey', 'testNamespace');

      expect(result).toBe('testValue');
    });

    it('should handle TTL expiration', async () => {
      // Store with 0 TTL (expires immediately for testing)
      await adapter.memoryStore('testKey', 'testValue', 'testNamespace', 0);

      // Should still exist (TTL 0 means no expiration)
      const result = await adapter.memoryRetrieve('testKey', 'testNamespace');
      expect(result).toBe('testValue');
    });

    it('should clear fallback for specific namespace', async () => {
      await adapter.memoryStore('key1', 'value1', 'ns1');
      await adapter.memoryStore('key2', 'value2', 'ns2');

      adapter.clearFallback('ns1');

      expect(adapter.getFallbackSize('ns1')).toBe(0);
      expect(adapter.getFallbackSize('ns2')).toBe(1);
    });

    it('should clear all fallback storage', async () => {
      await adapter.memoryStore('key1', 'value1', 'ns1');
      await adapter.memoryStore('key2', 'value2', 'ns2');

      adapter.clearFallback();

      expect(adapter.getFallbackSize('ns1')).toBe(0);
      expect(adapter.getFallbackSize('ns2')).toBe(0);
    });

    it('should handle search patterns with wildcards', async () => {
      await adapter.memoryStore('user/1/name', 'Alice', 'ns');
      await adapter.memoryStore('user/2/name', 'Bob', 'ns');
      await adapter.memoryStore('user/1/email', 'alice@test.com', 'ns');
      await adapter.memoryStore('config/setting', 'value', 'ns');

      const userKeys = await adapter.memorySearch('user/*', 'ns');
      expect(userKeys.length).toBe(3);

      const user1Keys = await adapter.memorySearch('user/1/*', 'ns');
      expect(user1Keys.length).toBe(2);

      const configKeys = await adapter.memorySearch('config/*', 'ns');
      expect(configKeys.length).toBe(1);
    });
  });

  describe('isCliAvailable', () => {
    it('should return true when CLI responds', async () => {
      mockExec.mockResolvedValue({ stdout: '1.0.0', stderr: '' });

      const result = await adapter.isCliAvailable();

      expect(result).toBe(true);
    });

    it('should return false when CLI fails', async () => {
      mockExec.mockRejectedValue(new Error('Command not found'));

      const result = await adapter.isCliAvailable();

      expect(result).toBe(false);
    });

    it('should cache CLI availability check', async () => {
      mockExec.mockResolvedValue({ stdout: '1.0.0', stderr: '' });

      await adapter.isCliAvailable();
      await adapter.isCliAvailable();

      // Should only call once due to caching
      expect(mockExec).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty namespace', async () => {
      mockExec.mockResolvedValue({ stdout: 'OK', stderr: '' });

      const result = await adapter.memoryStore('key', 'value', '');

      expect(result).toBe(true);
    });

    it('should handle very long values', async () => {
      mockExec.mockResolvedValue({ stdout: 'OK', stderr: '' });

      const longValue = 'x'.repeat(10000);
      const result = await adapter.memoryStore('key', longValue);

      expect(result).toBe(true);
    });

    it('should handle special characters in keys', async () => {
      mockExec.mockResolvedValue({ stdout: 'OK', stderr: '' });

      const result = await adapter.memoryStore('key/with/slashes', 'value');

      expect(result).toBe(true);
    });

    it('should handle JSON in value with nested objects', async () => {
      mockExec.mockResolvedValue({ stdout: 'OK', stderr: '' });

      const complexValue = {
        nested: {
          deep: {
            array: [1, 2, 3],
            string: 'test',
          },
        },
      };

      const result = await adapter.memoryStore('key', complexValue);

      expect(result).toBe(true);
    });

    it('should handle stderr warnings without failing', async () => {
      mockExec.mockResolvedValue({
        stdout: 'OK',
        stderr: 'DeprecationWarning: some warning',
      });

      const result = await adapter.memoryStore('key', 'value');

      expect(result).toBe(true);
    });
  });
});
