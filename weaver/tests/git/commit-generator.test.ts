/**
 * Tests for Commit Generator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommitGenerator } from '../../src/git/commit-generator.js';
import type { GitClient } from '../../src/git/git-client.js';
import type { ClaudeClient } from '../../src/agents/claude-client.js';

describe('commit-generator', () => {
  let mockGitClient: GitClient;
  let mockClaudeClient: ClaudeClient;
  let generator: CommitGenerator;

  beforeEach(() => {
    // Mock GitClient
    mockGitClient = {
      diff: vi.fn(),
      log: vi.fn(),
      commit: vi.fn(),
      getRepoPath: vi.fn(() => '/mock/repo')
    } as any;

    // Mock ClaudeClient
    mockClaudeClient = {
      sendMessage: vi.fn()
    } as any;

    generator = new CommitGenerator(mockGitClient, mockClaudeClient);
  });

  describe('generate', () => {
    it('should throw error when no staged changes', async () => {
      vi.mocked(mockGitClient.diff).mockResolvedValue('');

      await expect(generator.generate()).rejects.toThrow('No staged changes');
    });

    it('should generate commit message from diff', async () => {
      const mockDiff = `diff --git a/src/file.ts b/src/file.ts
new file mode 100644
index 0000000..abc1234
--- /dev/null
+++ b/src/file.ts
@@ -0,0 +1,5 @@
+export function test() {
+  console.log('test');
+}`;

      vi.mocked(mockGitClient.diff).mockResolvedValue(mockDiff);
      vi.mocked(mockGitClient.log).mockResolvedValue({
        all: [
          { message: 'feat: previous commit', hash: 'abc123' }
        ]
      } as any);

      const mockResponse = {
        success: true,
        data: 'feat: add test function\n\nImplement new test utility function.',
        tokens: { input: 100, output: 50 }
      };
      vi.mocked(mockClaudeClient.sendMessage).mockResolvedValue(mockResponse as any);

      const result = await generator.generate();

      expect(result.message).toContain('feat:');
      expect(result.parsed).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(mockClaudeClient.sendMessage).toHaveBeenCalled();
    });

    it('should use custom type and scope', async () => {
      const mockDiff = `diff --git a/src/file.ts b/src/file.ts
modified`;

      vi.mocked(mockGitClient.diff).mockResolvedValue(mockDiff);
      vi.mocked(mockGitClient.log).mockResolvedValue({ all: [] } as any);

      const mockResponse = {
        success: true,
        data: 'fix(api): correct endpoint',
        tokens: { input: 100, output: 50 }
      };
      vi.mocked(mockClaudeClient.sendMessage).mockResolvedValue(mockResponse as any);

      const result = await generator.generate({
        type: 'fix',
        scope: 'api'
      });

      expect(result.parsed?.type).toBe('fix');
      expect(result.parsed?.scope).toBe('api');
    });

    it('should skip history when requested', async () => {
      const mockDiff = 'diff --git a/src/file.ts b/src/file.ts\nmodified';

      vi.mocked(mockGitClient.diff).mockResolvedValue(mockDiff);

      const mockResponse = {
        success: true,
        data: 'feat: test',
        tokens: { input: 100, output: 50 }
      };
      vi.mocked(mockClaudeClient.sendMessage).mockResolvedValue(mockResponse as any);

      await generator.generate({ includeHistory: false });

      expect(mockGitClient.log).not.toHaveBeenCalled();
    });

    it('should throw error on AI failure', async () => {
      const mockDiff = 'diff --git a/src/file.ts b/src/file.ts\nmodified';

      vi.mocked(mockGitClient.diff).mockResolvedValue(mockDiff);
      vi.mocked(mockGitClient.log).mockResolvedValue({ all: [] } as any);

      const mockResponse = {
        success: false,
        error: 'API error'
      };
      vi.mocked(mockClaudeClient.sendMessage).mockResolvedValue(mockResponse as any);

      await expect(generator.generate()).rejects.toThrow('Failed to generate');
    });
  });

  describe('commit', () => {
    it('should create commit with generated message', async () => {
      const generatedCommit = {
        message: 'feat: test commit',
        parsed: {
          type: 'feat' as const,
          subject: 'test commit'
        },
        analysis: {} as any
      };

      vi.mocked(mockGitClient.commit).mockResolvedValue({
        sha: 'abc123',
        message: 'feat: test commit',
        files: [],
        timestamp: new Date()
      });

      const result = await generator.commit(generatedCommit);

      expect(result.sha).toBe('abc123');
      expect(result.message).toBe('feat: test commit');
      expect(mockGitClient.commit).toHaveBeenCalledWith('feat: test commit');
    });

    it('should not commit in dry run mode', async () => {
      const generatedCommit = {
        message: 'feat: test commit',
        parsed: { type: 'feat' as const, subject: 'test commit' },
        analysis: {} as any
      };

      const result = await generator.commit(generatedCommit, { dryRun: true });

      expect(result.sha).toBe('dry-run');
      expect(mockGitClient.commit).not.toHaveBeenCalled();
    });
  });

  describe('refine', () => {
    it('should refine commit message based on feedback', async () => {
      const currentMessage = 'feat: add feature';
      const feedback = 'Be more specific about what feature';

      const mockResponse = {
        success: true,
        data: 'feat: add user authentication',
        tokens: { input: 100, output: 50 }
      };
      vi.mocked(mockClaudeClient.sendMessage).mockResolvedValue(mockResponse as any);

      const refined = await generator.refine(currentMessage, feedback);

      expect(refined).toContain('authentication');
      expect(mockClaudeClient.sendMessage).toHaveBeenCalled();

      const callArgs = vi.mocked(mockClaudeClient.sendMessage).mock.calls[0];
      expect(callArgs?.[0]).toContain(currentMessage);
      expect(callArgs?.[0]).toContain(feedback);
    });

    it('should throw error on refinement failure', async () => {
      const mockResponse = {
        success: false,
        error: 'Refinement failed'
      };
      vi.mocked(mockClaudeClient.sendMessage).mockResolvedValue(mockResponse as any);

      await expect(
        generator.refine('feat: test', 'feedback')
      ).rejects.toThrow('Failed to refine');
    });
  });

  describe('preview', () => {
    it('should return message preview with validation', async () => {
      const mockDiff = 'diff --git a/src/file.ts b/src/file.ts\nmodified';

      vi.mocked(mockGitClient.diff).mockResolvedValue(mockDiff);
      vi.mocked(mockGitClient.log).mockResolvedValue({ all: [] } as any);

      const mockResponse = {
        success: true,
        data: 'feat: test',
        tokens: { input: 100, output: 50 }
      };
      vi.mocked(mockClaudeClient.sendMessage).mockResolvedValue(mockResponse as any);

      const preview = await generator.preview();

      expect(preview.message).toBeDefined();
      expect(preview.analysis).toBeDefined();
      expect(preview.validation).toBeDefined();
      expect(preview.validation).toHaveProperty('valid');
      expect(preview.validation).toHaveProperty('errors');
    });
  });
});
