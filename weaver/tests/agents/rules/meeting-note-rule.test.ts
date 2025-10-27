/**
 * Meeting Note Rule Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MeetingNoteRule } from '../../../src/agents/rules/meeting-note-rule.js';
import type { ClaudeClient } from '../../../src/agents/claude-client.js';
import type { ParsedResponse } from '../../../src/agents/types.js';

describe('MeetingNoteRule', () => {
  let mockClient: ClaudeClient;
  let mockSetMemory: ReturnType<typeof vi.fn>;
  let rule: MeetingNoteRule;

  beforeEach(() => {
    mockClient = {
      sendMessage: vi.fn()
    } as unknown as ClaudeClient;

    mockSetMemory = vi.fn();

    rule = new MeetingNoteRule({
      claudeClient: mockClient,
      setMemory: mockSetMemory,
      tasksDir: 'Tasks'
    });
  });

  describe('shouldTrigger', () => {
    it('should trigger for meeting notes with attendees', () => {
      const content = `---
title: Sprint Planning
tags: [meeting]
attendees: [Alice, Bob, Charlie]
---

Discussion about sprint goals.`;

      expect(rule.shouldTrigger(content)).toBe(true);
    });

    it('should trigger for #meeting tag in body', () => {
      const content = `---
title: Team Sync
attendees: [Alice, Bob]
---

#meeting notes for today's sync.`;

      expect(rule.shouldTrigger(content)).toBe(true);
    });

    it('should not trigger without #meeting tag', () => {
      const content = `---
title: Regular Note
attendees: [Alice]
---

This is not a meeting note.`;

      expect(rule.shouldTrigger(content)).toBe(false);
    });

    it('should not trigger without attendees', () => {
      const content = `---
title: Meeting Notes
tags: [meeting]
---

Meeting without attendees field.`;

      expect(rule.shouldTrigger(content)).toBe(false);
    });
  });

  describe('execute', () => {
    it('should extract action items and create tasks note', async () => {
      const content = `---
title: Sprint Planning Meeting
tags: [meeting]
attendees: [Alice, Bob, Charlie]
date: 2024-03-15
---

# Sprint Planning

## Action Items

- Alice will update the documentation by next Friday
- Bob needs to review the PR ASAP
- Charlie should schedule a follow-up meeting
- Deploy to staging environment this week`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          actionItems: [
            { task: 'Update documentation', assignee: 'Alice', dueDate: '2024-03-22', priority: 'medium' as const },
            { task: 'Review PR', assignee: 'Bob', priority: 'high' as const },
            { task: 'Schedule follow-up meeting', assignee: 'Charlie', priority: 'medium' as const },
            { task: 'Deploy to staging', priority: 'high' as const }
          ]
        },
        rawResponse: 'response',
        tokens: { input: 200, output: 100 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content, { filename: 'sprint-planning.md' });

      expect(result.success).toBe(true);
      expect(result.actionItems).toHaveLength(4);
      expect(result.tasksNoteContent).toContain('Action Items: Sprint Planning Meeting');
      expect(result.tasksNoteContent).toContain('Update documentation');
      expect(result.tasksNoteContent).toContain('@Alice');
      expect(result.tasksNoteContent).toContain('High Priority');
      expect(result.tasksNoteFilename).toContain('sprint-planning-tasks');
    });

    it('should organize tasks by priority', async () => {
      const content = `---
title: Team Meeting
tags: [meeting]
attendees: [Team]
---

Action items discussed.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          actionItems: [
            { task: 'Critical task', priority: 'high' as const },
            { task: 'Regular task', priority: 'medium' as const },
            { task: 'Minor task', priority: 'low' as const }
          ]
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 50 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(result.tasksNoteContent).toMatch(/High Priority[\s\S]*Medium Priority[\s\S]*Low Priority/);
    });

    it('should handle meeting notes with no action items', async () => {
      const content = `---
title: Information Session
tags: [meeting]
attendees: [Team]
---

Informational meeting with no action items.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          actionItems: []
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 20 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(result.actionItems).toEqual([]);
      expect(result.error).toContain('No action items found');
    });

    it('should include context in tasks note', async () => {
      const content = `---
title: Security Review
tags: [meeting]
attendees: [Security Team]
---

Discussion about security updates.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          actionItems: [
            {
              task: 'Update dependencies',
              assignee: 'Bob',
              priority: 'high' as const,
              context: 'Security vulnerability found in package X'
            }
          ]
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 50 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(result.tasksNoteContent).toContain('Security vulnerability found');
    });

    it('should store action items in memory', async () => {
      const content = `---
title: Planning Meeting
tags: [meeting]
attendees: [Team]
---

Meeting notes.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          actionItems: [
            { task: 'Complete task', priority: 'medium' as const }
          ]
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 30 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      await rule.execute(content, { filename: 'planning.md', filepath: 'meetings/planning.md' });

      expect(mockSetMemory).toHaveBeenCalledWith(
        expect.stringContaining('meeting/action-items/'),
        expect.stringContaining('Complete task')
      );
    });

    it('should handle Claude API errors', async () => {
      const content = `---
title: Meeting
tags: [meeting]
attendees: [Team]
---

Content.`;

      const mockResponse: ParsedResponse = {
        success: false,
        error: 'API error'
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content);

      expect(result.success).toBe(true); // Still succeeds but with empty action items
      expect(result.actionItems).toEqual([]);
    });

    it('should not execute if conditions not met', async () => {
      const content = `---
title: Regular Note
---

Not a meeting note.`;

      const result = await rule.execute(content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not a meeting note');
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it('should format due dates correctly', async () => {
      const content = `---
title: Meeting
tags: [meeting]
attendees: [Team]
---

Tasks with dates.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          actionItems: [
            { task: 'Task with date', dueDate: '2024-03-20', priority: 'medium' as const }
          ]
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 30 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(result.tasksNoteContent).toContain('📅 2024-03-20');
    });

    it('should generate unique tasks note filenames', async () => {
      const content = `---
title: Meeting
tags: [meeting]
attendees: [Team]
date: 2024-03-15
---

Content.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          actionItems: [
            { task: 'Test task', priority: 'medium' as const }
          ]
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 30 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content, { filename: 'weekly-sync.md' });

      expect(result.success).toBe(true);
      expect(result.tasksNoteFilename).toMatch(/^weekly-sync-tasks-\d{4}-\d{2}-\d{2}\.md$/);
    });
  });

  describe('getConfig', () => {
    it('should return rule configuration', () => {
      const config = rule.getConfig();

      expect(config).toEqual({
        tasksDir: 'Tasks'
      });
    });
  });
});
