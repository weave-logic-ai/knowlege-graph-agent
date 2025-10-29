import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResearcherAgent } from '../../src/agents/researcher-agent.js';
import { ClaudeClient } from '../../src/agents/claude-client.js';

describe('ResearcherAgent', () => {
  let mockClaudeClient: ClaudeClient;
  let researcher: ResearcherAgent;

  beforeEach(() => {
    mockClaudeClient = {
      sendMessage: vi.fn(),
    } as unknown as ClaudeClient;

    researcher = new ResearcherAgent({ claudeClient: mockClaudeClient });
  });

  describe('searchArxiv', () => {
    it('should search arXiv for papers', async () => {
      // Mock fetch for arXiv API
      global.fetch = vi.fn().mockResolvedValue({
        text: async () => `
          <feed>
            <entry>
              <id>http://arxiv.org/abs/2510.20809v1</id>
              <title>Test Paper Title</title>
              <summary>Test abstract content</summary>
              <published>2024-01-01T00:00:00Z</published>
              <updated>2024-01-02T00:00:00Z</updated>
              <name>Author One</name>
              <name>Author Two</name>
              <category term="cs.AI" />
            </entry>
          </feed>
        `,
      });

      const papers = await researcher.searchArxiv('neural networks', { maxResults: 10 });

      expect(papers).toHaveLength(1);
      expect(papers[0]?.id).toBe('2510.20809v1');
      expect(papers[0]?.title).toContain('Test Paper');
    });

    it('should filter by categories', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        text: async () => '<feed></feed>',
      });

      await researcher.searchArxiv('test', { categories: ['cs.AI', 'cs.LG'] });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('cat:cs.AI')
      );
    });
  });

  describe('analyzePaper', () => {
    it('should analyze a paper and extract insights', async () => {
      // Mock searchArxiv
      global.fetch = vi.fn().mockResolvedValue({
        text: async () => `
          <feed>
            <entry>
              <id>http://arxiv.org/abs/2510.20809v1</id>
              <title>RDR Framework</title>
              <summary>Novel framework for AI reasoning</summary>
              <published>2024-01-01T00:00:00Z</published>
              <updated>2024-01-01T00:00:00Z</updated>
            </entry>
          </feed>
        `,
      });

      // Mock Claude response
      vi.mocked(mockClaudeClient.sendMessage).mockResolvedValue({
        success: true,
        data: {
          keyInsights: ['Insight 1', 'Insight 2'],
          methodology: 'Experimental study',
          results: ['Result 1'],
          limitations: ['Limitation 1'],
          futureWork: ['Future 1'],
          relevantCitations: ['Citation 1'],
          confidence: 0.85,
        },
      });

      const analysis = await researcher.analyzePaper('2510.20809');

      expect(analysis.paperId).toBe('2510.20809');
      expect(analysis.keyInsights).toHaveLength(2);
      expect(analysis.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('findTrends', () => {
    it('should identify research trends', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        text: async () => '<feed></feed>',
      });

      vi.mocked(mockClaudeClient.sendMessage).mockResolvedValue({
        success: true,
        data: [
          {
            topic: 'Transformers',
            growthRate: 'growing',
            keyPapers: ['Paper 1'],
            majorContributors: ['Lab 1'],
            relatedTopics: ['Attention'],
            summary: 'Trend summary',
          },
        ],
      });

      const trends = await researcher.findTrends('machine learning');

      expect(trends).toHaveLength(1);
      expect(trends[0]?.topic).toBe('Transformers');
      expect(trends[0]?.growthRate).toBe('growing');
    });
  });

  describe('synthesizeFindings', () => {
    it('should synthesize findings across papers', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        text: async () => `
          <feed>
            <entry>
              <id>http://arxiv.org/abs/2510.20809v1</id>
              <title>Test Paper</title>
              <summary>Abstract</summary>
              <published>2024-01-01T00:00:00Z</published>
              <updated>2024-01-01T00:00:00Z</updated>
            </entry>
          </feed>
        `,
      });

      vi.mocked(mockClaudeClient.sendMessage).mockResolvedValue({
        success: true,
        data: {
          keyInsights: ['Insight'],
          methodology: 'Method',
          results: ['Result'],
          limitations: ['Limit'],
          futureWork: ['Future'],
          relevantCitations: ['Cite'],
          confidence: 0.8,
        },
      });

      // Mock synthesis
      vi.mocked(mockClaudeClient.sendMessage).mockResolvedValueOnce({
        success: true,
        data: {
          keyInsights: ['Insight'],
          methodology: 'Method',
          results: ['Result'],
          limitations: ['Limit'],
          futureWork: ['Future'],
          relevantCitations: ['Cite'],
          confidence: 0.8,
        },
      }).mockResolvedValueOnce({
        success: true,
        data: {
          commonThemes: ['Theme 1'],
          contradictions: ['Contradiction 1'],
          researchGaps: ['Gap 1'],
          recommendations: ['Rec 1'],
          summary: 'Summary',
        },
      });

      const synthesis = await researcher.synthesizeFindings(['2510.20809']);

      expect(synthesis.papers).toHaveLength(1);
      expect(synthesis.commonThemes).toBeDefined();
    });
  });
});
