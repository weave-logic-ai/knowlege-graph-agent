/**
 * Auto-Link Rule Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutoLinkRule } from '../../../src/agents/rules/auto-link-rule.js';
import type { ClaudeClient } from '../../../src/agents/claude-client.js';
import type { ParsedResponse } from '../../../src/agents/types.js';

describe('AutoLinkRule', () => {
  let mockClient: ClaudeClient;
  let mockGetNoteTitle: ReturnType<typeof vi.fn>;
  let rule: AutoLinkRule;

  beforeEach(() => {
    mockClient = {
      sendMessage: vi.fn()
    } as unknown as ClaudeClient;

    mockGetNoteTitle = vi.fn();

    rule = new AutoLinkRule({
      claudeClient: mockClient,
      minContentLength: 200,
      matchThreshold: 0.8,
      maxLinks: 10,
      getNoteTitle: mockGetNoteTitle
    });
  });

  describe('shouldTrigger', () => {
    it('should trigger for content above minimum length', () => {
      const content = 'A'.repeat(250);
      expect(rule.shouldTrigger(content)).toBe(true);
    });

    it('should not trigger for short content', () => {
      const content = 'Short content';
      expect(rule.shouldTrigger(content)).toBe(false);
    });
  });

  describe('execute', () => {
    it('should create wikilinks for detected mentions', async () => {
      const content = `This is a comprehensive discussion about Machine Learning and Neural Networks that spans multiple paragraphs.
The article explores Deep Learning techniques and Convolutional Neural Networks in great detail.
We'll cover various aspects of artificial intelligence, including supervised and unsupervised learning approaches.
This content is sufficiently long to trigger the auto-linking rule with a minimum length of 200 characters.`;

      mockGetNoteTitle
        .mockResolvedValueOnce(['Machine Learning Basics'])
        .mockResolvedValueOnce(['Neural Networks Overview'])
        .mockResolvedValueOnce(['Deep Learning Guide']);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(result.linksCreated).toBeGreaterThan(0);
      expect(result.updatedContent).toContain('[[');
      expect(result.updatedContent).toContain(']]');
    });

    it('should only link first occurrence of each note', async () => {
      const content = `Machine Learning is important in modern AI development. Machine Learning techniques are continuously evolving with new research.
Machine Learning research continues to push boundaries. The field of Machine Learning has grown exponentially over the past decade.
Researchers worldwide are contributing to Machine Learning advancements. This extensive content ensures we meet the minimum length requirement.`;

      mockGetNoteTitle.mockResolvedValue(['Machine Learning Basics']);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);

      // Count occurrences of [[Machine Learning Basics]]
      const linkCount = (result.updatedContent?.match(/\[\[Machine Learning Basics\]\]/g) || []).length;
      expect(linkCount).toBe(1);
    });

    it('should not modify existing wikilinks', async () => {
      const content = `This comprehensive article mentions [[Existing Link]] and also discusses Machine Learning in detail.
The content includes various topics related to artificial intelligence and neural networks. We explore different aspects
of deep learning and its applications in modern software development. This ensures the content is long enough to trigger
the auto-linking functionality while preserving existing wikilinks that are already present in the document.`;

      mockGetNoteTitle.mockResolvedValue(['Machine Learning']);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(result.updatedContent).toContain('[[Existing Link]]');

      // Existing link should not be modified
      const existingLinkCount = (result.updatedContent?.match(/\[\[Existing Link\]\]/g) || []).length;
      expect(existingLinkCount).toBe(1);
    });

    it('should respect fuzzy match threshold', async () => {
      const content = `This is a comprehensive discussion about Machine Learing (typo) and Neural Network topics in artificial intelligence.
The content explores various aspects of these technologies and their applications in modern software development.
We examine how these concepts are being applied in industry and research settings today. This content is sufficiently
long to trigger the auto-linking rule while testing fuzzy matching capabilities with minor spelling variations.`;

      // High similarity but with typo
      mockGetNoteTitle
        .mockResolvedValueOnce(['Machine Learning'])
        .mockResolvedValueOnce(['Neural Networks']);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);

      // Should still match despite typo (similarity > 0.8)
      if (result.updatedContent) {
        const hasLinks = result.updatedContent.includes('[[');
        expect(hasLinks).toBe(true);
      }
    });

    it('should limit number of links created', async () => {
      const phrases = Array.from({ length: 20 }, (_, i) => `Topic Number ${i} is an important concept in our knowledge base`);
      const content = phrases.join('. ') + '. This content is designed to be long enough to trigger the auto-linking rule.';

      mockGetNoteTitle.mockImplementation(async (query: string) => {
        return [`${query} Note`];
      });

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(result.linksCreated).toBeLessThanOrEqual(10); // maxLinks = 10
    });

    it('should handle no matching notes found', async () => {
      const content = `This is comprehensive content about Random Topics that don't match any notes in the vault at all.
We discuss various concepts that have no corresponding notes in the knowledge base. The content is extensive enough
to trigger the auto-linking rule but contains no recognizable note references. This tests the scenario where the
algorithm runs but finds no matches in the shadow cache or note title database.`;

      mockGetNoteTitle.mockResolvedValue([]);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(result.linksCreated).toBe(0);
      expect(result.updatedContent).toBe(content);
    });

    it('should resolve ambiguous mentions with Claude', async () => {
      const content = `This comprehensive article is discussing AI and Machine Learning applications in modern software development.
We explore various use cases and implementations across different industries. The content examines how these technologies
are transforming business operations and creating new opportunities. This extensive discussion provides enough context
for the auto-linking algorithm to identify and process potential note references effectively.`;

      mockGetNoteTitle.mockResolvedValue(['Artificial Intelligence Introduction']);

      const mockResponse: ParsedResponse = {
        success: true,
        data: {
          decisions: [true]
        },
        rawResponse: 'response',
        tokens: { input: 100, output: 20 }
      };

      vi.mocked(mockClient.sendMessage).mockResolvedValue(mockResponse);

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
    });

    it('should not create links if content too short', async () => {
      const content = 'Short.';

      const result = await rule.execute(content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('too short');
      expect(mockGetNoteTitle).not.toHaveBeenCalled();
    });

    it('should extract candidate phrases correctly', async () => {
      const content = `The Quick Brown Fox jumps over the Lazy Dog in this classic pangram example. We are also discussing Artificial Intelligence
concepts and their applications in natural language processing. This content provides multiple potential note references
that can be extracted and matched against the knowledge base. The algorithm should identify capitalized phrases and
proper nouns as potential candidates for linking to existing notes in the vault.`;

      mockGetNoteTitle.mockImplementation(async (query: string) => {
        if (query === 'Quick Brown Fox') return ['Quick Brown Fox Story'];
        if (query === 'Artificial Intelligence') return ['AI Basics'];
        return [];
      });

      const result = await rule.execute(content);

      expect(result.success).toBe(true);
      expect(mockGetNoteTitle).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const content = 'A'.repeat(250) + ' This content is designed to test error handling in the auto-linking rule implementation.';

      mockGetNoteTitle.mockRejectedValue(new Error('Database error'));

      const result = await rule.execute(content);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('getConfig', () => {
    it('should return rule configuration', () => {
      const config = rule.getConfig();

      expect(config).toEqual({
        minContentLength: 200,
        matchThreshold: 0.8,
        maxLinks: 10
      });
    });
  });
});
