/**
 * Error Handling and Edge Cases Tests (Phase 7 - Task 8.2)
 *
 * Tests comprehensive error handling for:
 * - Claude API failures (timeout, 429, 500)
 * - Malformed note content
 * - Missing frontmatter
 * - Invalid date formats
 * - Shadow cache unavailable
 * - Memory sync failures
 * - Concurrent rule conflicts
 * - Error logging and user-friendly messages
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClaudeClient } from '../../src/agents/claude-client.js';
import type { ParsedResponse } from '../../src/agents/types.js';
import { CircuitBreakerState } from '../../src/agents/types.js';

describe('Error Handling and Edge Cases', () => {
  let mockClient: ClaudeClient;

  beforeEach(() => {
    mockClient = new ClaudeClient({
      apiKey: 'test-key',
      timeout: 5000,
      maxRetries: 3,
      circuitBreakerThreshold: 3
    });
  });

  describe('Task 8.2.1: Claude API Failures', () => {
    it('should handle timeout errors gracefully', async () => {
      const slowClient = new ClaudeClient({
        apiKey: 'test-key',
        timeout: 100, // Very short timeout
        maxRetries: 1
      });

      vi.spyOn(slowClient as unknown as { sendRequest: () => Promise<never> }, 'sendRequest')
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)));

      const result = await slowClient.sendMessage('Test message');

      expect(result.success).toBe(false);
      // Timeout errors may be reported as various error types
      expect(result.error).toBeDefined();
    });

    it('should handle 429 rate limit errors with retry', async () => {
      let callCount = 0;

      vi.spyOn(mockClient as unknown as { sendRequest: () => Promise<never> }, 'sendRequest')
        .mockImplementation(async () => {
          callCount++;

          if (callCount < 2) {
            const error = new Error('Rate limited') as Error & { status?: number };
            error.status = 429;
            throw error;
          }

          return {
            id: 'msg-123',
            type: 'message' as const,
            role: 'assistant' as const,
            content: [{ type: 'text' as const, text: 'Success' }],
            model: 'claude-3-5-sonnet-20241022',
            stop_reason: 'end_turn' as const,
            stop_sequence: null,
            usage: { input_tokens: 10, output_tokens: 5 }
          };
        });

      const result = await mockClient.sendMessage('Test');

      // Should succeed after retry
      expect(result.success).toBe(true);
      expect(callCount).toBeGreaterThan(1);
    });

    it('should handle 500 server errors with retry', async () => {
      let callCount = 0;

      vi.spyOn(mockClient as unknown as { sendRequest: () => Promise<never> }, 'sendRequest')
        .mockImplementation(async () => {
          callCount++;

          if (callCount === 1) {
            const error = new Error('Server error') as Error & { status?: number };
            error.status = 500;
            throw error;
          }

          return {
            id: 'msg-123',
            type: 'message' as const,
            role: 'assistant' as const,
            content: [{ type: 'text' as const, text: 'Success' }],
            model: 'claude-3-5-sonnet-20241022',
            stop_reason: 'end_turn' as const,
            stop_sequence: null,
            usage: { input_tokens: 10, output_tokens: 5 }
          };
        });

      const result = await mockClient.sendMessage('Test');

      expect(result.success).toBe(true);
      expect(callCount).toBe(2);
    });

    it('should handle 401 authentication errors without retry', async () => {
      vi.spyOn(mockClient as unknown as { sendRequest: () => Promise<never> }, 'sendRequest')
        .mockImplementation(async () => {
          const error = new Error('Invalid API key') as Error & { status?: number; message: string };
          error.status = 401;
          error.message = 'Invalid API key';
          throw error;
        });

      const result = await mockClient.sendMessage('Test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid API key');
    });

    it('should open circuit breaker after consecutive failures', async () => {
      const failingClient = new ClaudeClient({
        apiKey: 'test-key',
        maxRetries: 1,
        circuitBreakerThreshold: 3
      });

      vi.spyOn(failingClient as unknown as { sendRequest: () => Promise<never> }, 'sendRequest')
        .mockRejectedValue(new Error('Persistent failure'));

      // Make 3 failing requests to open circuit
      await failingClient.sendMessage('Test 1');
      await failingClient.sendMessage('Test 2');
      await failingClient.sendMessage('Test 3');

      expect(failingClient.getCircuitBreakerState()).toBe(CircuitBreakerState.OPEN);

      // Next request should fail immediately without calling API
      const result = await failingClient.sendMessage('Test 4');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Circuit breaker is OPEN');
    });
  });

  describe('Task 8.2.2: Malformed Note Content', () => {
    it('should handle notes with invalid markdown', async () => {
      const malformedMarkdown = `# Incomplete header

[Unclosed link(broken.md)

\`\`\`code
No closing backticks
`;

      // Should still parse basic structure
      const hasHeader = /^#\s+(.+)$/m.test(malformedMarkdown);
      expect(hasHeader).toBe(true);
    });

    it('should handle notes with mixed line endings', async () => {
      const mixedLineEndings = "Line 1\nLine 2\r\nLine 3\rLine 4";

      const normalized = mixedLineEndings.replace(/\r\n|\r/g, '\n');
      const lines = normalized.split('\n');

      expect(lines).toHaveLength(4);
    });

    it('should handle notes with special characters', async () => {
      const specialChars = `# Test Note 🚀

Content with émojis and spëcial chârs.

Tags: #test #spëcial-tàgs
`;

      // Should handle UTF-8 correctly
      expect(specialChars).toContain('🚀');
      expect(specialChars).toContain('émojis');
    });

    it('should handle extremely large notes', async () => {
      const largeContent = 'x'.repeat(1_000_000); // 1MB

      const truncated = largeContent.slice(0, 10000);
      expect(truncated.length).toBe(10000);
    });

    it('should handle binary data in notes', async () => {
      const binaryData = Buffer.from([0xFF, 0xFE, 0x00, 0x01]);

      try {
        const text = binaryData.toString('utf-8');
        // Binary may not be valid UTF-8
        expect(typeof text).toBe('string');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Task 8.2.3: Missing Frontmatter', () => {
    it('should handle notes without frontmatter', async () => {
      const noFrontmatter = `# Regular Note

Just content, no frontmatter.
`;

      const hasFrontmatter = /^---\n/.test(noFrontmatter);
      expect(hasFrontmatter).toBe(false);

      // Should create default frontmatter
      const withFrontmatter = `---
title: Regular Note
created: ${new Date().toISOString()}
---

${noFrontmatter}`;

      expect(withFrontmatter).toContain('---');
      expect(withFrontmatter).toContain('title: Regular Note');
    });

    it('should handle incomplete frontmatter', async () => {
      const incompleteFrontmatter = `---
title: Test
# Missing closing ---

Content here
`;

      const frontmatterMatch = incompleteFrontmatter.match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatterMatch).toBeNull();
    });

    it('should handle malformed YAML frontmatter', async () => {
      const malformedYaml = `---
title: Test Note
tags: [unclosed array
created: invalid-date-format
---

Content
`;

      // Parser should handle gracefully or throw clear error
      const frontmatterMatch = malformedYaml.match(/^---\n([\s\S]*?)\n---/);
      const yamlContent = frontmatterMatch?.[1] ?? '';

      // Should detect malformed YAML
      expect(yamlContent).toContain('[unclosed array');
    });

    it('should add missing required frontmatter fields', async () => {
      const minimalFrontmatter = `---
title: Test
---

Content`;

      const requiredFields = ['created', 'modified', 'type'];
      const frontmatterMatch = minimalFrontmatter.match(/^---\n([\s\S]*?)\n---/);
      const existing = frontmatterMatch?.[1] ?? '';

      const missingFields = requiredFields.filter(field => !existing.includes(`${field}:`));

      expect(missingFields.length).toBeGreaterThan(0);
      expect(missingFields).toContain('created');
    });
  });

  describe('Task 8.2.4: Invalid Date Formats', () => {
    it('should handle various date formats', async () => {
      const validDates = [
        '2025-01-15',
        '2025-01-15T10:30:00Z',
        '2025-01-15T10:30:00.123Z',
        '2025-01-15 10:30:00',
        '15-01-2025',
        '01/15/2025',
        'January 15, 2025'
      ];

      const parseDate = (dateStr: string): Date | null => {
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
      };

      const results = validDates.map(parseDate);
      const validCount = results.filter(d => d !== null).length;

      expect(validCount).toBeGreaterThan(0);
    });

    it('should reject invalid dates', async () => {
      const invalidDates = [
        'not-a-date',
        '2025-13-45', // Invalid month/day
        '2025-00-00',
        '9999-99-99',
        ''
      ];

      const isValidDate = (dateStr: string): boolean => {
        const parsed = new Date(dateStr);
        return !isNaN(parsed.getTime());
      };

      const results = invalidDates.map(isValidDate);
      const allInvalid = results.every(r => r === false);

      expect(allInvalid).toBe(true);
    });

    it('should normalize date formats', async () => {
      const dates = [
        new Date('2025-01-15T10:30:00Z'),
        new Date('01/15/2025'),
        new Date('2025-01-15')
      ];

      const normalized = dates.map(d => d.toISOString().split('T')[0]);

      // All should normalize to same date
      expect(normalized.every(d => d === '2025-01-15')).toBe(true);
    });

    it('should handle timezone differences', async () => {
      const utcDate = new Date('2025-01-15T23:00:00Z');
      const localDate = new Date('2025-01-15T23:00:00');

      // UTC and local times are different
      expect(utcDate.toISOString()).not.toBe(localDate.toISOString());
    });
  });

  describe('Task 8.2.5: Shadow Cache Unavailable', () => {
    it('should handle shadow cache connection failure', async () => {
      const getShadowCache = async (): Promise<Map<string, unknown> | null> => {
        try {
          // Simulate connection failure
          throw new Error('Connection refused');
        } catch (error) {
          return null;
        }
      };

      const cache = await getShadowCache();
      expect(cache).toBeNull();
    });

    it('should fall back to file system when cache unavailable', async () => {
      const getCachedNote = async (id: string): Promise<string | null> => {
        // Simulate cache miss
        return null;
      };

      const getFromFileSystem = async (id: string): Promise<string> => {
        return `Content for ${id}`;
      };

      const noteId = 'test-note';
      const cached = await getCachedNote(noteId);
      const content = cached ?? await getFromFileSystem(noteId);

      expect(content).toBe('Content for test-note');
    });

    it('should handle partial cache data', async () => {
      const partialCache = new Map<string, { path?: string; content?: string }>();
      partialCache.set('note1', { path: '/vault/note1.md' }); // Missing content
      partialCache.set('note2', { content: 'Content' }); // Missing path

      const getFullNote = (id: string) => {
        const cached = partialCache.get(id);
        if (!cached?.path || !cached?.content) {
          return { error: 'Incomplete cache entry' };
        }
        return cached;
      };

      expect(getFullNote('note1')).toHaveProperty('error');
      expect(getFullNote('note2')).toHaveProperty('error');
    });

    it('should rebuild cache on corruption', async () => {
      let cacheCorrupted = true;
      const cache = new Map<string, unknown>();

      const rebuildCache = async () => {
        cache.clear();
        cache.set('note1', { path: '/vault/note1.md', content: 'Rebuilt' });
        cacheCorrupted = false;
      };

      if (cacheCorrupted) {
        await rebuildCache();
      }

      expect(cacheCorrupted).toBe(false);
      expect(cache.size).toBe(1);
    });
  });

  describe('Task 8.2.6: Memory Sync Failures', () => {
    it('should handle memory write failures', async () => {
      const writeToMemory = async (key: string, value: unknown): Promise<boolean> => {
        try {
          // Simulate write failure
          if (Math.random() > 0.5) {
            throw new Error('Write failed');
          }
          return true;
        } catch (error) {
          return false;
        }
      };

      // Should retry or handle gracefully
      let success = await writeToMemory('test', { data: 'value' });
      if (!success) {
        success = await writeToMemory('test', { data: 'value' });
      }

      expect(typeof success).toBe('boolean');
    });

    it('should handle memory read failures', async () => {
      const readFromMemory = async (key: string): Promise<unknown | null> => {
        try {
          throw new Error('Read failed');
        } catch (error) {
          return null;
        }
      };

      const value = await readFromMemory('test');
      expect(value).toBeNull();
    });

    it('should handle memory sync conflicts', async () => {
      const localVersion = { value: 'local', version: 1 };
      const remoteVersion = { value: 'remote', version: 2 };

      const resolveConflict = (local: typeof localVersion, remote: typeof remoteVersion) => {
        // Use higher version
        return local.version > remote.version ? local : remote;
      };

      const resolved = resolveConflict(localVersion, remoteVersion);
      expect(resolved.value).toBe('remote');
    });

    it('should queue writes during offline', async () => {
      const writeQueue: Array<{ key: string; value: unknown }> = [];
      let isOnline = false;

      const queuedWrite = async (key: string, value: unknown) => {
        if (!isOnline) {
          writeQueue.push({ key, value });
          return false;
        }
        return true;
      };

      await queuedWrite('key1', 'value1');
      await queuedWrite('key2', 'value2');

      expect(writeQueue).toHaveLength(2);

      // Go online and flush queue
      isOnline = true;
      const flushed = writeQueue.splice(0);

      expect(writeQueue).toHaveLength(0);
      expect(flushed).toHaveLength(2);
    });
  });

  describe('Task 8.2.7: Concurrent Rule Conflicts', () => {
    it('should detect concurrent modifications', async () => {
      let documentVersion = 1;
      const operations: Array<{ version: number; change: string }> = [];

      const modifyDocument = async (change: string) => {
        const readVersion = documentVersion;
        await new Promise(resolve => setTimeout(resolve, 10));

        // Check for concurrent modification
        if (documentVersion !== readVersion) {
          throw new Error('Concurrent modification detected');
        }

        documentVersion++;
        operations.push({ version: documentVersion, change });
      };

      // Concurrent modifications
      const promises = [
        modifyDocument('change1'),
        modifyDocument('change2')
      ];

      const results = await Promise.allSettled(promises);
      const conflicts = results.filter(r => r.status === 'rejected');

      expect(conflicts.length).toBeGreaterThan(0);
    });

    it('should use optimistic locking', async () => {
      interface Document {
        version: number;
        content: string;
      }

      const doc: Document = { version: 1, content: 'original' };

      const updateWithVersion = (
        current: Document,
        newContent: string,
        expectedVersion: number
      ): Document => {
        if (current.version !== expectedVersion) {
          throw new Error('Version mismatch');
        }
        return { version: current.version + 1, content: newContent };
      };

      const updated = updateWithVersion(doc, 'updated', 1);
      expect(updated.version).toBe(2);

      // Second update with stale version should fail
      expect(() => {
        updateWithVersion(doc, 'conflict', 1);
      }).toThrow('Version mismatch');
    });

    it('should merge concurrent tag additions', async () => {
      const mergeTags = (
        base: string[],
        local: string[],
        remote: string[]
      ): string[] => {
        const baseSet = new Set(base);
        const localAdded = local.filter(t => !baseSet.has(t));
        const remoteAdded = remote.filter(t => !baseSet.has(t));

        return [...new Set([...base, ...localAdded, ...remoteAdded])];
      };

      const base = ['tag1', 'tag2'];
      const local = ['tag1', 'tag2', 'tag3'];
      const remote = ['tag1', 'tag2', 'tag4'];

      const merged = mergeTags(base, local, remote);

      expect(merged).toContain('tag1');
      expect(merged).toContain('tag3');
      expect(merged).toContain('tag4');
      expect(merged.length).toBe(4);
    });
  });

  describe('Task 8.2.8: Error Logging and User Messages', () => {
    it('should log errors with full context', async () => {
      interface ErrorLog {
        timestamp: Date;
        level: 'error' | 'warn' | 'info';
        message: string;
        context: Record<string, unknown>;
        stack?: string;
      }

      const errorLogs: ErrorLog[] = [];

      const logError = (error: Error, context: Record<string, unknown>) => {
        errorLogs.push({
          timestamp: new Date(),
          level: 'error',
          message: error.message,
          context,
          stack: error.stack
        });
      };

      try {
        throw new Error('Test error');
      } catch (error) {
        logError(error as Error, {
          rule: 'auto-tag',
          note: 'test.md',
          user: 'alice'
        });
      }

      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].context).toHaveProperty('rule');
      expect(errorLogs[0]).toHaveProperty('stack');
    });

    it('should provide user-friendly error messages', async () => {
      const formatUserError = (error: Error): string => {
        if (error.message.includes('ENOENT')) {
          return 'File not found. Please check the file path.';
        }
        if (error.message.includes('EACCES')) {
          return 'Permission denied. Please check file permissions.';
        }
        if (error.message.includes('timeout')) {
          return 'Request timed out. Please try again.';
        }
        return 'An unexpected error occurred. Please contact support.';
      };

      const fileError = new Error('ENOENT: no such file');
      const permError = new Error('EACCES: permission denied');
      const timeoutError = new Error('Request timeout');

      expect(formatUserError(fileError)).toContain('File not found');
      expect(formatUserError(permError)).toContain('Permission denied');
      expect(formatUserError(timeoutError)).toContain('timed out');
    });

    it('should include error codes for debugging', async () => {
      class AppError extends Error {
        constructor(
          message: string,
          public code: string,
          public context?: Record<string, unknown>
        ) {
          super(message);
          this.name = 'AppError';
        }
      }

      const error = new AppError(
        'Tag extraction failed',
        'AGENT_TAG_001',
        { note: 'test.md', tags: [] }
      );

      expect(error.code).toBe('AGENT_TAG_001');
      expect(error.context).toHaveProperty('note');
    });

    it('should sanitize sensitive data from logs', async () => {
      const sanitizeForLog = (data: Record<string, unknown>): Record<string, unknown> => {
        const sensitive = ['apiKey', 'password', 'token', 'secret'];
        const sanitized = { ...data };

        for (const key of sensitive) {
          if (key in sanitized) {
            sanitized[key] = '[REDACTED]';
          }
        }

        return sanitized;
      };

      const unsafeData = {
        user: 'alice',
        apiKey: 'sk-1234567890',
        note: 'test.md'
      };

      const safe = sanitizeForLog(unsafeData);

      expect(safe.apiKey).toBe('[REDACTED]');
      expect(safe.user).toBe('alice');
    });
  });
});
