/**
 * Researcher Agent - Advanced research capabilities with arXiv integration
 *
 * Capabilities:
 * - arXiv paper search and analysis
 * - Web research and synthesis
 * - Trend identification
 * - Cross-paper analysis
 * - RDR (Reflect-Decide-Respond) framework integration
 *
 * @example
 * ```typescript
 * const researcher = new ResearcherAgent({ claudeClient });
 * const papers = await researcher.searchArxiv('neural networks', { maxResults: 10 });
 * const analysis = await researcher.analyzePaper('2510.20809');
 * const trends = await researcher.findTrends('machine learning');
 * ```
 */

import { ClaudeClient } from './claude-client.js';
import { PromptBuilder } from './prompt-builder.js';
import type { ParsedResponse } from './types.js';

/**
 * arXiv paper metadata
 */
export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedDate: Date;
  updatedDate: Date;
  categories: string[];
  pdfUrl: string;
  arxivUrl: string;
}

/**
 * Paper analysis result
 */
export interface PaperAnalysis {
  paperId: string;
  title: string;
  keyInsights: string[];
  methodology: string;
  results: string[];
  limitations: string[];
  futureWork: string[];
  relevantCitations: string[];
  confidence: number;
}

/**
 * Research trend data
 */
export interface ResearchTrend {
  topic: string;
  growthRate: 'emerging' | 'growing' | 'stable' | 'declining';
  keyPapers: string[];
  majorContributors: string[];
  relatedTopics: string[];
  summary: string;
}

/**
 * Synthesis of multiple papers
 */
export interface ResearchSynthesis {
  papers: string[];
  commonThemes: string[];
  contradictions: string[];
  researchGaps: string[];
  recommendations: string[];
  summary: string;
}

/**
 * Search options for arXiv
 */
export interface ArxivSearchOptions {
  maxResults?: number;
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  sortOrder?: 'ascending' | 'descending';
  categories?: string[];
  startDate?: Date;
  endDate?: Date;
}

/**
 * Researcher agent configuration
 */
export interface ResearcherAgentConfig {
  claudeClient: ClaudeClient;
  arxivApiBase?: string;
}

/**
 * Researcher Agent - AI-powered research assistant
 */
export class ResearcherAgent {
  private claudeClient: ClaudeClient;
  private arxivApiBase: string;

  constructor(config: ResearcherAgentConfig) {
    this.claudeClient = config.claudeClient;
    this.arxivApiBase = config.arxivApiBase ?? 'http://export.arxiv.org/api/query';
  }

  // ========================================================================
  // arXiv Search & Retrieval
  // ========================================================================

  /**
   * Search arXiv for papers matching query
   */
  async searchArxiv(query: string, options: ArxivSearchOptions = {}): Promise<ArxivPaper[]> {
    const {
      maxResults = 10,
      sortBy = 'relevance',
      sortOrder = 'descending',
      categories,
      startDate,
      endDate,
    } = options;

    // Build arXiv query
    let searchQuery = query;

    if (categories && categories.length > 0) {
      const categoryQuery = categories.map(cat => `cat:${cat}`).join(' OR ');
      searchQuery = `(${query}) AND (${categoryQuery})`;
    }

    if (startDate || endDate) {
      const start = startDate ? startDate.toISOString().split('T')[0] : '1900-01-01';
      const end = endDate ? endDate.toISOString().split('T')[0] : '2100-01-01';
      searchQuery += ` AND submittedDate:[${start} TO ${end}]`;
    }

    // Map sort options to arXiv format
    const sortByMap = {
      relevance: 'relevance',
      lastUpdatedDate: 'lastUpdatedDate',
      submittedDate: 'submittedDate',
    };

    const params = new URLSearchParams({
      search_query: searchQuery,
      start: '0',
      max_results: maxResults.toString(),
      sortBy: sortByMap[sortBy],
      sortOrder: sortOrder,
    });

    try {
      // Fetch from arXiv API
      const response = await fetch(`${this.arxivApiBase}?${params}`);
      const xmlText = await response.text();

      // Parse XML response
      const papers = this.parseArxivXML(xmlText);

      return papers;
    } catch (error) {
      throw new Error(`arXiv search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse arXiv XML response
   */
  private parseArxivXML(xml: string): ArxivPaper[] {
    const papers: ArxivPaper[] = [];

    // Simple XML parsing (in production, use a proper XML parser like fast-xml-parser)
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const entries = xml.match(entryRegex) || [];

    for (const entry of entries) {
      const getTag = (tag: string): string => {
        const match = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`));
        return match ? match[1]?.trim() ?? '' : '';
      };

      const getAllTags = (tag: string): string[] => {
        const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'g');
        const matches = entry.match(regex) || [];
        return matches.map(m => {
          const content = m.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`))?.[1];
          return content?.trim() ?? '';
        });
      };

      const id = getTag('id').split('/').pop() ?? '';
      const title = getTag('title').replace(/\s+/g, ' ');
      const abstract = getTag('summary').replace(/\s+/g, ' ');
      const published = getTag('published');
      const updated = getTag('updated');
      const authors = getAllTags('name');
      const categories = getAllTags('category').map(cat => {
        const termMatch = cat.match(/term="([^"]+)"/);
        return termMatch ? termMatch[1] ?? '' : '';
      }).filter(Boolean);

      papers.push({
        id,
        title,
        authors,
        abstract,
        publishedDate: new Date(published),
        updatedDate: new Date(updated),
        categories,
        pdfUrl: `https://arxiv.org/pdf/${id}.pdf`,
        arxivUrl: `https://arxiv.org/abs/${id}`,
      });
    }

    return papers;
  }

  // ========================================================================
  // Paper Analysis
  // ========================================================================

  /**
   * Analyze a specific arXiv paper
   */
  async analyzePaper(arxivId: string): Promise<PaperAnalysis> {
    // First, get the paper details
    const papers = await this.searchArxiv(`id:${arxivId}`, { maxResults: 1 });
    const paper = papers[0];

    if (!paper) {
      throw new Error(`Paper ${arxivId} not found`);
    }

    // Use Claude to analyze the abstract and extract insights
    const prompt = new PromptBuilder()
      .system('You are an expert research analyst. Analyze academic papers and extract key insights.')
      .user(`Analyze this research paper and extract:
1. Key insights and contributions
2. Methodology used
3. Main results and findings
4. Limitations acknowledged
5. Future work suggested
6. Relevant citations mentioned

Paper Title: {{title}}
Abstract: {{abstract}}

Provide your analysis in JSON format with these fields:
- keyInsights: string[]
- methodology: string
- results: string[]
- limitations: string[]
- futureWork: string[]
- relevantCitations: string[]
- confidence: number (0-1, your confidence in this analysis)`)
      .variable('title', paper.title)
      .variable('abstract', paper.abstract)
      .expectJSON({
        type: 'object',
        properties: {
          keyInsights: { type: 'array', items: { type: 'string' } },
          methodology: { type: 'string' },
          results: { type: 'array', items: { type: 'string' } },
          limitations: { type: 'array', items: { type: 'string' } },
          futureWork: { type: 'array', items: { type: 'string' } },
          relevantCitations: { type: 'array', items: { type: 'string' } },
          confidence: { type: 'number' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Paper analysis failed: ${response.error}`);
    }

    const analysis = response.data as Omit<PaperAnalysis, 'paperId' | 'title'>;

    return {
      paperId: arxivId,
      title: paper.title,
      ...analysis,
    };
  }

  // ========================================================================
  // Trend Analysis
  // ========================================================================

  /**
   * Identify research trends in a domain
   */
  async findTrends(domain: string, options: { timeWindow?: 'month' | 'quarter' | 'year' } = {}): Promise<ResearchTrend[]> {
    const { timeWindow = 'year' } = options;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeWindow) {
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Search for recent papers in the domain
    const papers = await this.searchArxiv(domain, {
      maxResults: 50,
      sortBy: 'lastUpdatedDate',
      startDate,
      endDate,
    });

    // Use Claude to identify trends
    const paperSummaries = papers.map(p => `${p.title} (${p.publishedDate.toISOString().split('T')[0]})`).join('\n');

    const prompt = new PromptBuilder()
      .system('You are an expert at identifying research trends and emerging topics.')
      .user(`Analyze these recent papers in ${domain} and identify key research trends.

Papers (last ${timeWindow}):
{{papers}}

For each trend, provide:
- topic: short name
- growthRate: "emerging" | "growing" | "stable" | "declining"
- keyPapers: paper titles that exemplify this trend
- majorContributors: inferred research groups/authors
- relatedTopics: connected research areas
- summary: brief description

Return a JSON array of trends.`)
      .variable('papers', paperSummaries)
      .expectJSON({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            growthRate: { type: 'string', enum: ['emerging', 'growing', 'stable', 'declining'] },
            keyPapers: { type: 'array', items: { type: 'string' } },
            majorContributors: { type: 'array', items: { type: 'string' } },
            relatedTopics: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
          },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Trend analysis failed: ${response.error}`);
    }

    return response.data as ResearchTrend[];
  }

  // ========================================================================
  // Multi-Paper Synthesis
  // ========================================================================

  /**
   * Synthesize findings across multiple papers
   */
  async synthesizeFindings(paperIds: string[]): Promise<ResearchSynthesis> {
    // Analyze each paper
    const analyses = await Promise.all(
      paperIds.map(id => this.analyzePaper(id))
    );

    // Combine analyses for synthesis
    const combinedText = analyses.map(a => `
Paper: ${a.title}
Key Insights: ${a.keyInsights.join(', ')}
Methodology: ${a.methodology}
Results: ${a.results.join(', ')}
Limitations: ${a.limitations.join(', ')}
    `).join('\n---\n');

    const prompt = new PromptBuilder()
      .system('You are an expert at synthesizing research findings across multiple papers.')
      .user(`Synthesize findings from these papers:

{{papers}}

Identify:
1. Common themes and consensus
2. Contradictions or disagreements
3. Research gaps and opportunities
4. Recommendations for future work
5. Overall summary

Provide JSON with:
- commonThemes: string[]
- contradictions: string[]
- researchGaps: string[]
- recommendations: string[]
- summary: string`)
      .variable('papers', combinedText)
      .expectJSON({
        type: 'object',
        properties: {
          commonThemes: { type: 'array', items: { type: 'string' } },
          contradictions: { type: 'array', items: { type: 'string' } },
          researchGaps: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
        },
      })
      .build();

    const response = await this.claudeClient.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
    });

    if (!response.success || !response.data) {
      throw new Error(`Synthesis failed: ${response.error}`);
    }

    const synthesis = response.data as Omit<ResearchSynthesis, 'papers'>;

    return {
      papers: paperIds,
      ...synthesis,
    };
  }
}

/**
 * Create a new researcher agent instance
 */
export function createResearcherAgent(config: ResearcherAgentConfig): ResearcherAgent {
  return new ResearcherAgent(config);
}
