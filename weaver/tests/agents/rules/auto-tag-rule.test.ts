/**
 * Auto-Tag Rule Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutoTagRule } from '../../../src/agents/rules/auto-tag-rule.js';
import type { ClaudeClient } from '../../../src/agents/claude-client.js';
import type { ParsedResponse } from '../../../src/agents/types.js';

describe('AutoTagRule', () => {
  let mockClient: ClaudeClient;
  let rule: AutoTagRule;

  beforeEach(() => {
    mockClient = {
      sendMessage: vi.fn()
    } as unknown as ClaudeClient;

    rule = new AutoTagRule({
      claudeClient: mockClient,
      minContentLength: 50,
      maxTags: 5,
      confidenceThreshold: 0.7
    });
  });

  describe('shouldTrigger', () => {
    it('should trigger for note without tags', () => {
      const content = `---
title: Test Note
---

This is a long enough note to trigger auto-tagging. It has plenty of content to analyze.`;

      expect(rule.shouldTrigger(content)).toBe(true);
    });

    it('should not trigger if tags already exist', () => {
      const content = `---
title: Test Note
tags: [existing, tags]
---

This is a note with existing tags.`;

      expect(rule.shouldTrigger(content)).toBe(false);
    });

    it('should not trigger if content too short', () => {
      const content = `---
title: Test Note
---

Short.`;

      expect(rule.shouldTrigger(content)).toBe(false);
    });

    it('should trigger for note without frontmatter', () => {
      const content = 'This is a long enough note without any frontmatter at all. It should still trigger auto-tagging.';

      expect(rule.shouldTrigger(content)).toBe(true);
    });
  });

  describe('execute', () => {
    it('should generate tag suggestions', async () => {
      const content = `---
title: Machine Learning Basics
---

Introduction to neural networks and deep learning. This article covers backpropagation, gradient descent, and optimization techniques.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          tags: [
            { tag: 'machine-learning', confidence: 0.95, reason: 'Main topic' },
            { tag: 'neural-networks', confidence: 0.9, reason: 'Key concept' },
            { tag: 'deep-learning', confidence: 0.85, reason: 'Related topic' }
          ]
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 50 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content, { filename: 'ml-basics.md' });

      expect(result.success).toBe(true);
      expect(result.suggestedTags).toEqual(['machine-learning', 'neural-networks', 'deep-learning']);
      expect(result.updatedContent).toContain('suggested_tags:');
      expect(result.tokensUsed).toEqual({ input: 100, output: 50 });
    });

    it('should filter tags by confidence threshold', async () => {
      const content = `---
title: Test Note
---

Content for testing tag confidence filtering.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          tags: [
            { tag: 'high-confidence', confidence: 0.9, reason: 'Very relevant' },
            { tag: 'low-confidence', confidence: 0.5, reason: 'Maybe relevant' },
            { tag: 'medium-confidence', confidence: 0.75, reason: 'Somewhat relevant' }
          ]
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 50 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(result.suggestedTags).toEqual(['high-confidence', 'medium-confidence']);
      expect(result.suggestedTags).not.toContain('low-confidence');
    });

    it('should limit number of tags to maxTags', async () => {
      const content = `---
title: Test Note
---

Content that could generate many tags.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          tags: Array.from({ length: 10 }, (_, i) => ({
            tag: `tag-${i}`,
            confidence: 0.9,
            reason: 'Relevant'
          }))
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 50 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(result.suggestedTags?.length).toBe(5); // maxTags = 5
    });

    it('should handle Claude API errors', async () => {
      const content = `---
title: Test Note
---

Content for error testing that needs to be long enough to trigger the rule execution properly.
This content is designed to test how the auto-tagging rule handles API errors from Claude.`;

      const mockResponse: ParsedResponse = {
        success: false,
        error: 'API rate limit exceeded'
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('API rate limit exceeded');
    });

    it('should not execute if rule conditions not met', async () => {
      const content = `---
title: Test Note
tags: [existing]
---

Content.`;

      const result = await rule.execute(content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Rule conditions not met');
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it('should preserve existing frontmatter when adding tags', async () => {
      const content = `---
title: Test Note
author: John Doe
date: 2024-01-01
---

Content for frontmatter preservation test that needs to be long enough to trigger the auto-tagging rule.
This test verifies that all existing frontmatter fields are preserved when adding suggested tags.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          tags: [
            { tag: 'test-tag', confidence: 0.9, reason: 'Test' }
          ]
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 50 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(result.updatedContent).toContain('title: Test Note');
      expect(result.updatedContent).toContain('author: John Doe');
      expect(result.updatedContent).toContain('date: 2024-01-01');
      expect(result.updatedContent).toContain('suggested_tags:');
    });

    it('should handle no high-confidence tags', async () => {
      const content = `---
title: Test Note
---

Content for low confidence test that needs to be long enough to trigger the rule properly.
This test verifies that the rule rejects tag suggestions with low confidence scores.`;

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          tags: [
            { tag: 'low-confidence', confidence: 0.5, reason: 'Not sure' }
          ]
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 50 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No high-confidence tag suggestions');
    });
  });

  describe('getConfig', () => {
    it('should return rule configuration', () => {
      const config = rule.getConfig();

      expect(config).toEqual({
        minContentLength: 50,
        maxTags: 5,
        confidenceThreshold: 0.7
      });
    });
  });
});
