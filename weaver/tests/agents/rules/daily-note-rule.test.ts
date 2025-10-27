/**
 * Daily Note Rule Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DailyNoteRule } from '../../../src/agents/rules/daily-note-rule.js';
import type { ClaudeClient } from '../../../src/agents/claude-client.js';
import type { ParsedResponse } from '../../../src/agents/types.js';

describe('DailyNoteRule', () => {
  let mockClient: ClaudeClient;
  let mockGetMemory: ReturnType<typeof vi.fn>;
  let mockSetMemory: ReturnType<typeof vi.fn>;
  let rule: DailyNoteRule;

  beforeEach(() => {
    mockClient = {
      sendMessage: vi.fn()
    } as unknown as ClaudeClient;

    mockGetMemory = vi.fn();
    mockSetMemory = vi.fn();

    rule = new DailyNoteRule({
      claudeClient: mockClient,
      getMemory: mockGetMemory,
      setMemory: mockSetMemory,
      dailyNotesDir: 'Daily Notes'
    });
  });

  describe('isDailyNote', () => {
    it('should recognize valid daily note filenames', () => {
      expect(rule.isDailyNote('2024-01-15.md')).toBe(true);
      expect(rule.isDailyNote('2024-12-31.md')).toBe(true);
      expect(rule.isDailyNote('2025-03-01.md')).toBe(true);
    });

    it('should reject invalid filenames', () => {
      expect(rule.isDailyNote('note.md')).toBe(false);
      expect(rule.isDailyNote('2024-1-15.md')).toBe(false); // Single digit month
      expect(rule.isDailyNote('24-01-15.md')).toBe(false); // Two digit year
      expect(rule.isDailyNote('2024-01-15.txt')).toBe(false); // Wrong extension
      expect(rule.isDailyNote('2024-13-01.md')).toBe(false); // Invalid month
    });
  });

  describe('execute', () => {
    it('should generate daily note with template', async () => {
      const filename = '2024-03-15.md';

      mockGetMemory.mockResolvedValue(null); // No previous tasks

      const result = await rule.execute(filename);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain('# Friday, March 15, 2024');
      expect(result.content).toContain('## Tasks');
      expect(result.content).toContain('[[2024-03-14]]'); // Yesterday link
      expect(result.content).toContain('[[2024-03-16]]'); // Tomorrow link
    });

    it('should include rollover tasks from yesterday', async () => {
      const filename = '2024-03-15.md';

      const yesterdayTasks = JSON.stringify([
        { task: 'Complete project report', completed: false },
        { task: 'Send emails', completed: true },
        { task: 'Review code', completed: false }
      ]);

      mockGetMemory.mockResolvedValue(yesterdayTasks);

      const result = await rule.execute(filename);

      expect(result.success).toBe(true);
      expect(result.content).toContain('Rollover Tasks');
      expect(result.content).toContain('Complete project report');
      expect(result.content).toContain('Review code');
      expect(result.content).not.toContain('Send emails'); // Completed task
      expect(result.rolloverTasks).toEqual(['Complete project report', 'Review code']);
    });

    it('should not overwrite existing content', async () => {
      const filename = '2024-03-15.md';
      const existingContent = `# My Custom Daily Note

This already has content.`;

      const result = await rule.execute(filename, existingContent);

      expect(result.success).toBe(true);
      expect(result.content).toBe(existingContent);
    });

    it('should handle invalid date in filename', async () => {
      const filename = '2024-13-99.md'; // Invalid date

      const result = await rule.execute(filename);

      expect(result.success).toBe(false);
      // This will be rejected at isDailyNote validation, not date parsing
      expect(result.error).toContain('Not a daily note filename');
    });

    it('should reject non-daily-note filenames', async () => {
      const filename = 'meeting-notes.md';

      const result = await rule.execute(filename);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not a daily note filename');
    });

    it('should calculate week number correctly', async () => {
      const filename = '2024-01-01.md';

      mockGetMemory.mockResolvedValue(null);

      const result = await rule.execute(filename);

      expect(result.success).toBe(true);
      expect(result.content).toContain('Week');
    });

    it('should handle memory errors gracefully', async () => {
      const filename = '2024-03-15.md';

      mockGetMemory.mockRejectedValue(new Error('Memory service unavailable'));

      // Should still generate note without rollover tasks
      const result = await rule.execute(filename);

      expect(result.success).toBe(true);
      expect(result.rolloverTasks).toEqual([]);
    });
  });

  describe('extractAndStoreTasks', () => {
    it('should extract tasks from daily note content', async () => {
      const date = '2024-03-15';
      const content = `# Daily Note

## Tasks

- [ ] Write documentation
- [x] Review PR
- [ ] Update tests

## Notes

Some notes here.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          tasks: [
            { task: 'Write documentation', completed: false },
            { task: 'Review PR', completed: true },
            { task: 'Update tests', completed: false }
          ]
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 50 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      await rule.extractAndStoreTasks(date, content);

      expect(mockClient.sendMessage).toHaveBeenCalled();
      expect(mockSetMemory).toHaveBeenCalledWith(
        `daily-note/tasks/${date}`,
        expect.stringContaining('Write documentation')
      );
    });

    it('should handle extraction errors', async () => {
      const date = '2024-03-15';
      const content = 'Invalid content';

      const mockResponse: ParsedResponse = {
        success: false,
        error: 'Failed to parse'
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      await rule.extractAndStoreTasks(date, content);

      // Should not throw, just not store
      expect(mockSetMemory).not.toHaveBeenCalled();
    });
  });

  describe('getConfig', () => {
    it('should return rule configuration', () => {
      const config = rule.getConfig();

      expect(config).toEqual({
        dailyNotesDir: 'Daily Notes'
      });
    });
  });
});
