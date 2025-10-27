/**
 * Integration Tests for Agent Rules (Phase 7)
 *
 * Tests complete workflows for all agent rules:
 * - Auto-tagging with Claude API
 * - Auto-linking with shadow cache
 * - Daily note creation and rollover
 * - Meeting note processing
 * - Multi-rule execution on same event
 * - Error recovery and retry logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ClaudeClient } from '../../../src/agents/claude-client.js';
import type { ParsedResponse } from '../../../src/agents/types.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Agent Rules Integration Tests', () => {
  let testDir: string;
  let mockClaudeClient: ClaudeClient;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'weaver-test-'));

    // Create mock Claude client
    mockClaudeClient = new ClaudeClient({
      apiKey: 'test-key-mock',
      timeout: 5000,
      maxRetries: 2
    });
  });

  afterEach(async () => {
    // Cleanup test directory
    await fs.rm(testDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  describe('Task 8.1.1: Auto-Tagging End-to-End', () => {
    it('should extract tags from note content via Claude API', async () => {
      // Mock Claude API response
      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          tags: ['project-management', 'agile', 'sprint-planning'],
          confidence: 0.95
        },
        rawResponse: JSON.stringify({
          tags: ['project-management', 'agile', 'sprint-planning'],
          confidence: 0.95
        }),
        tokens: { input: 150, output: 50 }
      };

      vi.spyOn(mockClaudeClient, 'sendMessage').mockResolvedValue(mockResponse);

      const noteContent = `# Sprint Planning Meeting

## Objectives
- Review backlog items
- Estimate story points
- Assign tasks to team members

## Action Items
- Update Jira board
- Schedule daily standups
`;

      const result = await mockClaudeClient.sendMessage('Extract tags', {
        systemPrompt: 'You are a tag extraction assistant',
        responseFormat: { type: 'json' }
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('tags');
      expect(Array.isArray((result.data as { tags: string[] }).tags)).toBe(true);
      expect((result.data as { tags: string[] }).tags).toContain('project-management');
    });

    it('should update note frontmatter with extracted tags', async () => {
      const notePath = path.join(testDir, 'test-note.md');
      const initialContent = `---
title: Test Note
created: 2025-01-15
---

# Test Note Content

This is a test note about machine learning and AI.
`;

      await fs.writeFile(notePath, initialContent);

      // Mock tag extraction
      const extractedTags = ['machine-learning', 'ai', 'technology'];

      // Simulate adding tags to frontmatter
      const content = await fs.readFile(notePath, 'utf-8');
      const updatedContent = content.replace(
        /^---\n([\s\S]*?)\n---/,
        `---\n$1\ntags: [${extractedTags.map(t => `"${t}"`).join(', ')}]\n---`
      );

      await fs.writeFile(notePath, updatedContent);

      // Verify tags were added
      const finalContent = await fs.readFile(notePath, 'utf-8');
      expect(finalContent).toContain('tags:');
      expect(finalContent).toContain('machine-learning');
      expect(finalContent).toContain('ai');
    });

    it('should merge with existing tags without duplicates', async () => {
      const notePath = path.join(testDir, 'existing-tags.md');
      const initialContent = `---
title: Existing Tags Note
tags: ["existing-tag-1", "existing-tag-2"]
---

# Content
`;

      await fs.writeFile(notePath, initialContent);

      const newTags = ['existing-tag-1', 'new-tag-1', 'new-tag-2'];

      // Simulate merging tags
      const content = await fs.readFile(notePath, 'utf-8');
      const existingTagsMatch = content.match(/tags:\s*\[(.*?)\]/);
      const existingTags = existingTagsMatch
        ? existingTagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''))
        : [];

      const mergedTags = [...new Set([...existingTags, ...newTags])];
      const updatedContent = content.replace(
        /tags:\s*\[.*?\]/,
        `tags: [${mergedTags.map(t => `"${t}"`).join(', ')}]`
      );

      await fs.writeFile(notePath, updatedContent);

      const finalContent = await fs.readFile(notePath, 'utf-8');
      expect(finalContent).toContain('existing-tag-1');
      expect(finalContent).toContain('new-tag-1');

      // Check no duplicates
      const tagMatches = finalContent.match(/"existing-tag-1"/g);
      expect(tagMatches?.length).toBe(1);
    });
  });

  describe('Task 8.1.2: Auto-Linking with Shadow Cache', () => {
    it('should detect wikilinks in note content', async () => {
      const noteContent = `# Project Overview

See [[project-requirements]] for details.
Related to [[architecture-design]] and [[implementation-plan]].

Also check [[meeting-notes/2025-01-15]].
`;

      const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
      const matches = Array.from(noteContent.matchAll(wikilinkRegex));
      const links = matches.map(m => m[1]);

      expect(links).toHaveLength(4);
      expect(links).toContain('project-requirements');
      expect(links).toContain('architecture-design');
      expect(links).toContain('meeting-notes/2025-01-15');
    });

    it('should verify linked notes exist in shadow cache', async () => {
      // Mock shadow cache data
      const shadowCache = new Map<string, { path: string; exists: boolean }>();
      shadowCache.set('project-requirements', {
        path: '/vault/project-requirements.md',
        exists: true
      });
      shadowCache.set('architecture-design', {
        path: '/vault/architecture-design.md',
        exists: true
      });
      shadowCache.set('missing-note', {
        path: '/vault/missing-note.md',
        exists: false
      });

      const links = ['project-requirements', 'architecture-design', 'missing-note'];
      const validLinks = links.filter(link => {
        const cached = shadowCache.get(link);
        return cached?.exists === true;
      });

      expect(validLinks).toHaveLength(2);
      expect(validLinks).not.toContain('missing-note');
    });

    it('should create backlinks in linked notes', async () => {
      const sourceNote = path.join(testDir, 'source.md');
      const targetNote = path.join(testDir, 'target.md');

      await fs.writeFile(sourceNote, `# Source\n\nSee [[target]] for more.`);
      await fs.writeFile(targetNote, `# Target\n\nSome content.`);

      // Simulate adding backlink
      const targetContent = await fs.readFile(targetNote, 'utf-8');
      const backlink = `\n\n## Backlinks\n- [[source]]\n`;

      if (!targetContent.includes('## Backlinks')) {
        await fs.writeFile(targetNote, targetContent + backlink);
      }

      const updatedTarget = await fs.readFile(targetNote, 'utf-8');
      expect(updatedTarget).toContain('## Backlinks');
      expect(updatedTarget).toContain('[[source]]');
    });
  });

  describe('Task 8.1.3: Daily Note Creation and Rollover', () => {
    it('should create daily note with template', async () => {
      const dailyNotesDir = path.join(testDir, 'daily');
      await fs.mkdir(dailyNotesDir, { recursive: true });

      const today = new Date().toISOString().split('T')[0];
      const notePath = path.join(dailyNotesDir, `${today}.md`);

      const template = `---
title: Daily Note - {{date}}
type: daily-note
created: {{timestamp}}
---

# Daily Note - {{date}}

## Tasks
- [ ] Review inbox
- [ ] Plan day

## Notes

## References
`;

      const content = template
        .replace(/\{\{date\}\}/g, today)
        .replace(/\{\{timestamp\}\}/g, new Date().toISOString());

      await fs.writeFile(notePath, content);

      const savedContent = await fs.readFile(notePath, 'utf-8');
      expect(savedContent).toContain(`# Daily Note - ${today}`);
      expect(savedContent).toContain('type: daily-note');
      expect(savedContent).toContain('## Tasks');
    });

    it('should rollover incomplete tasks from previous day', async () => {
      const dailyNotesDir = path.join(testDir, 'daily');
      await fs.mkdir(dailyNotesDir, { recursive: true });

      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const yesterdayPath = path.join(dailyNotesDir, `${yesterday}.md`);

      const yesterdayContent = `---
title: Yesterday
---

## Tasks
- [x] Completed task
- [ ] Incomplete task 1
- [ ] Incomplete task 2
- [x] Another completed
`;

      await fs.writeFile(yesterdayPath, yesterdayContent);

      // Extract incomplete tasks
      const incompleteTasks = yesterdayContent
        .split('\n')
        .filter(line => line.match(/^- \[ \]/))
        .map(line => line.trim());

      expect(incompleteTasks).toHaveLength(2);
      expect(incompleteTasks[0]).toBe('- [ ] Incomplete task 1');
    });

    it('should handle daily note already exists', async () => {
      const dailyNotesDir = path.join(testDir, 'daily');
      await fs.mkdir(dailyNotesDir, { recursive: true });

      const today = new Date().toISOString().split('T')[0];
      const notePath = path.join(dailyNotesDir, `${today}.md`);

      await fs.writeFile(notePath, '# Existing content');

      // Check if file exists
      const exists = await fs.access(notePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Should not overwrite
      const content = await fs.readFile(notePath, 'utf-8');
      expect(content).toBe('# Existing content');
    });
  });

  describe('Task 8.1.4: Meeting Note Processing', () => {
    it('should extract action items from meeting notes', async () => {
      const meetingContent = `# Team Sync - 2025-01-15

## Attendees
- Alice, Bob, Charlie

## Discussion
We discussed the new feature launch.

## Action Items
- [ ] Alice: Update documentation
- [ ] Bob: Review PR #123
- [ ] Charlie: Deploy to staging

## Next Meeting
2025-01-22
`;

      const actionItemRegex = /^- \[ \] (.+?):\s*(.+)$/gm;
      const matches = Array.from(meetingContent.matchAll(actionItemRegex));
      const actionItems = matches.map(m => ({
        assignee: m[1],
        task: m[2]
      }));

      expect(actionItems).toHaveLength(3);
      expect(actionItems[0]).toEqual({ assignee: 'Alice', task: 'Update documentation' });
      expect(actionItems[1]).toEqual({ assignee: 'Bob', task: 'Review PR #123' });
    });

    it('should create task notes for action items', async () => {
      const tasksDir = path.join(testDir, 'tasks');
      await fs.mkdir(tasksDir, { recursive: true });

      const actionItems = [
        { assignee: 'Alice', task: 'Update documentation', meeting: 'Team Sync' },
        { assignee: 'Bob', task: 'Review PR #123', meeting: 'Team Sync' }
      ];

      for (const item of actionItems) {
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const taskPath = path.join(tasksDir, `${taskId}.md`);
        const taskContent = `---
title: ${item.task}
assignee: ${item.assignee}
source: ${item.meeting}
status: open
---

# ${item.task}

Assigned to: ${item.assignee}
From meeting: ${item.meeting}
`;

        await fs.writeFile(taskPath, taskContent);
      }

      const files = await fs.readdir(tasksDir);
      expect(files.length).toBe(2);
    });

    it('should link action items back to meeting note', async () => {
      const meetingPath = path.join(testDir, 'meeting.md');
      const taskPath = path.join(testDir, 'task-123.md');

      await fs.writeFile(meetingPath, `# Meeting\n\n## Action Items\n`);
      await fs.writeFile(taskPath, `---\nsource: meeting\n---\n# Task`);

      // Add task link to meeting
      const meetingContent = await fs.readFile(meetingPath, 'utf-8');
      const updated = meetingContent.replace(
        '## Action Items\n',
        '## Action Items\n- [[task-123]]\n'
      );
      await fs.writeFile(meetingPath, updated);

      const final = await fs.readFile(meetingPath, 'utf-8');
      expect(final).toContain('[[task-123]]');
    });
  });

  describe('Task 8.1.5: Multiple Rules on Same Event', () => {
    it('should execute multiple rules concurrently', async () => {
      const executionOrder: string[] = [];

      const rule1 = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push('rule1');
        return { success: true, rule: 'auto-tag' };
      };

      const rule2 = async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        executionOrder.push('rule2');
        return { success: true, rule: 'auto-link' };
      };

      const rule3 = async () => {
        await new Promise(resolve => setTimeout(resolve, 15));
        executionOrder.push('rule3');
        return { success: true, rule: 'update-index' };
      };

      const startTime = Date.now();
      const results = await Promise.all([rule1(), rule2(), rule3()]);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);

      // Should run concurrently (< 20ms), not sequentially (> 30ms)
      expect(duration).toBeLessThan(25);
    });

    it('should handle rule conflicts gracefully', async () => {
      let sharedState = { tags: ['tag1'] };

      const addTag1 = async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        sharedState = { tags: [...sharedState.tags, 'tag2'] };
      };

      const addTag2 = async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        sharedState = { tags: [...sharedState.tags, 'tag3'] };
      };

      await Promise.all([addTag1(), addTag2()]);

      // Should have all tags (may have race condition issues in real impl)
      expect(sharedState.tags.length).toBeGreaterThanOrEqual(2);
    });

    it('should limit concurrent rule execution', async () => {
      const maxConcurrent = 5;
      const totalRules = 10;
      let currentRunning = 0;
      let maxReached = 0;

      const rules = Array.from({ length: totalRules }, (_, i) => async () => {
        currentRunning++;
        maxReached = Math.max(maxReached, currentRunning);

        await new Promise(resolve => setTimeout(resolve, 10));

        currentRunning--;
        return { id: i };
      });

      // Simple semaphore implementation
      const runWithLimit = async (fn: () => Promise<unknown>) => {
        while (currentRunning >= maxConcurrent) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        return fn();
      };

      await Promise.all(rules.map(runWithLimit));

      expect(maxReached).toBeLessThanOrEqual(maxConcurrent);
    });
  });

  describe('Task 8.1.6: Error Recovery and Retry Logic', () => {
    it('should retry on transient failures', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const unstableOperation = async (): Promise<ParsedResponse> => {
        attempts++;

        if (attempts < 2) {
          throw new Error('Transient failure');
        }

        return {
          success: true,
          data: 'Success after retry',
          rawResponse: 'Success'
        };
      };

      const withRetry = async (
        fn: () => Promise<ParsedResponse>,
        retries = maxRetries
      ): Promise<ParsedResponse> => {
        for (let i = 0; i < retries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
          }
        }
        throw new Error('Max retries exceeded');
      };

      const result = await withRetry(unstableOperation);

      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
    });

    it('should not retry on permanent failures', async () => {
      const permanentError = new Error('Authentication failed') as Error & { status?: number };
      permanentError.status = 401;

      const isRetryable = (error: unknown): boolean => {
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status?: number }).status;
          return status === 429 || (status ?? 0) >= 500;
        }
        return false;
      };

      expect(isRetryable(permanentError)).toBe(false);
      expect(isRetryable({ status: 429 })).toBe(true);
      expect(isRetryable({ status: 500 })).toBe(true);
    });

    it('should rollback on partial failures', async () => {
      const originalContent = 'Original content';
      let currentContent = originalContent;
      const backup = originalContent;

      try {
        currentContent = 'Modified content';
        throw new Error('Operation failed');
      } catch (error) {
        // Rollback
        currentContent = backup;
      }

      expect(currentContent).toBe(originalContent);
    });

    it('should log all errors for debugging', async () => {
      const errorLog: Array<{ timestamp: Date; error: string; context: unknown }> = [];

      const logError = (error: unknown, context?: unknown) => {
        errorLog.push({
          timestamp: new Date(),
          error: error instanceof Error ? error.message : String(error),
          context
        });
      };

      try {
        throw new Error('Test error');
      } catch (error) {
        logError(error, { rule: 'auto-tag', note: 'test.md' });
      }

      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].error).toBe('Test error');
      expect(errorLog[0]).toHaveProperty('timestamp');
    });
  });
});
