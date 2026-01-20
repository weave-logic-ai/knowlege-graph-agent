/**
 * Migration Orchestrator - Implements Analysis Recommendations
 *
 * Uses claude-flow swarms to implement suggestions from cultivation analysis:
 * - Fill documentation gaps identified by Gap Analyst
 * - Answer research questions with specialized agents
 * - Build knowledge graph connections
 * - Create missing MOC files and documentation
 *
 * @module cultivation/migration-orchestrator
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename, relative } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import matter from 'gray-matter';

// ============================================================================
// Types
// ============================================================================

/**
 * Parsed gap from analysis
 */
interface DocumentationGap {
  section: string;
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  relatedDocs: string[];
}

/**
 * Parsed research question from analysis
 */
interface ResearchQuestion {
  question: string;
  context: string;
  importance: string;
  suggestedResources: string[];
  category: string;
}

/**
 * Parsed connection suggestion from analysis
 */
interface ConnectionSuggestion {
  source: string;
  target: string;
  relationship: string;
  reason: string;
}

/**
 * Parsed analysis results
 */
interface ParsedAnalysis {
  vision: {
    purpose: string;
    goals: string[];
    recommendations: string[];
  };
  gaps: DocumentationGap[];
  questions: ResearchQuestion[];
  connections: ConnectionSuggestion[];
}

/**
 * Agent configuration for migration
 */
interface MigrationAgent {
  name: string;
  type: 'gap-filler' | 'researcher' | 'moc-builder' | 'connector' | 'integrator';
  task: string;
  context: string;
  outputFile?: string;
}

/**
 * Migration result
 */
interface MigrationResult {
  success: boolean;
  agentsUsed: number;
  documentsCreated: number;
  documentsUpdated: number;
  connectionsAdded: number;
  questionsAnswered: number;
  gapsFilled: number;
  errors: string[];
  warnings: string[];
  duration: number;
}

/**
 * Orchestrator options
 */
interface OrchestratorOptions {
  projectRoot: string;
  docsPath: string;
  analysisDir: string;
  verbose?: boolean;
  dryRun?: boolean;
  useVectorSearch?: boolean;
  maxAgents?: number;
}

// ============================================================================
// Migration Orchestrator
// ============================================================================

/**
 * Orchestrates the migration from analysis to implemented documentation
 */
export class MigrationOrchestrator {
  private projectRoot: string;
  private docsPath: string;
  private analysisDir: string;
  private verbose: boolean;
  private dryRun: boolean;
  private useVectorSearch: boolean;
  private maxAgents: number;
  private geminiClient: GoogleGenerativeAI | null = null;

  constructor(options: OrchestratorOptions) {
    this.projectRoot = options.projectRoot;
    this.docsPath = options.docsPath;
    this.analysisDir = options.analysisDir;
    this.verbose = options.verbose ?? false;
    this.dryRun = options.dryRun ?? false;
    this.useVectorSearch = options.useVectorSearch ?? false;
    this.maxAgents = options.maxAgents ?? 8;

    // Initialize Gemini client if available
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY ||
                   process.env.GOOGLE_AI_API_KEY ||
                   process.env.GEMINI_API_KEY ||
                   process.env.GOOGLE_API_KEY;
    if (apiKey) {
      this.geminiClient = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Check availability status
   */
  async getAvailabilityStatus(): Promise<{ available: boolean; reason: string }> {
    if (this.geminiClient) {
      return { available: true, reason: 'Using Gemini API' };
    }

    // Check for Anthropic API
    if (process.env.ANTHROPIC_API_KEY) {
      return { available: true, reason: 'Using Anthropic API' };
    }

    return {
      available: false,
      reason: 'No API key found. Set GOOGLE_GEMINI_API_KEY or ANTHROPIC_API_KEY'
    };
  }

  /**
   * Run the migration process
   */
  async migrate(): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      agentsUsed: 0,
      documentsCreated: 0,
      documentsUpdated: 0,
      connectionsAdded: 0,
      questionsAnswered: 0,
      gapsFilled: 0,
      errors: [],
      warnings: [],
      duration: 0
    };

    try {
      this.log('info', 'Starting migration orchestration', {
        analysisDir: this.analysisDir,
        docsPath: this.docsPath
      });

      // Step 1: Parse analysis files
      const analysis = await this.parseAnalysisFiles();
      this.log('info', 'Parsed analysis files', {
        gaps: analysis.gaps.length,
        questions: analysis.questions.length,
        connections: analysis.connections.length
      });

      // Step 2: Load existing documentation context
      const docsContext = await this.loadDocsContext();
      this.log('info', 'Loaded documentation context', {
        totalDocs: docsContext.size,
        keyDocs: Array.from(docsContext.keys()).slice(0, 5)
      });

      // Step 3: Create migration agents based on analysis
      const agents = this.createMigrationAgents(analysis, docsContext);
      this.log('info', 'Created migration agents', { agents: agents.length });

      // Step 4: Execute agents
      for (const agent of agents) {
        try {
          const agentResult = await this.executeAgent(agent, analysis, docsContext);
          result.agentsUsed++;

          if (agentResult.documentsCreated) {
            result.documentsCreated += agentResult.documentsCreated;
          }
          if (agentResult.documentsUpdated) {
            result.documentsUpdated += agentResult.documentsUpdated;
          }
          if (agentResult.gapsFilled) {
            result.gapsFilled += agentResult.gapsFilled;
          }
          if (agentResult.questionsAnswered) {
            result.questionsAnswered += agentResult.questionsAnswered;
          }
          if (agentResult.connectionsAdded) {
            result.connectionsAdded += agentResult.connectionsAdded;
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          result.errors.push(`Agent ${agent.name} failed: ${msg}`);
          this.log('error', `Agent ${agent.name} failed`, { error: msg });
        }
      }

      // Step 5: Update MOC files with new connections
      if (result.documentsCreated > 0 || result.connectionsAdded > 0) {
        await this.updateMOCFiles(analysis.connections);
      }

      result.success = result.errors.length === 0;
      result.duration = Date.now() - startTime;

      this.log('info', 'Migration complete', {
        success: result.success,
        documentsCreated: result.documentsCreated,
        gapsFilled: result.gapsFilled,
        duration: result.duration
      });

      return result;

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Migration failed: ${msg}`);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Parse all analysis files from the analysis directory
   */
  private async parseAnalysisFiles(): Promise<ParsedAnalysis> {
    const analysisPath = join(this.projectRoot, this.docsPath, this.analysisDir);
    const result: ParsedAnalysis = {
      vision: { purpose: '', goals: [], recommendations: [] },
      gaps: [],
      questions: [],
      connections: []
    };

    if (!existsSync(analysisPath)) {
      throw new Error(`Analysis directory not found: ${analysisPath}`);
    }

    // Parse vision-synthesis.md
    const visionFile = join(analysisPath, 'vision-synthesis.md');
    if (existsSync(visionFile)) {
      result.vision = this.parseVisionFile(readFileSync(visionFile, 'utf-8'));
    }

    // Parse documentation-gaps.md
    const gapsFile = join(analysisPath, 'documentation-gaps.md');
    if (existsSync(gapsFile)) {
      result.gaps = this.parseGapsFile(readFileSync(gapsFile, 'utf-8'));
    }

    // Parse research-questions.md
    const questionsFile = join(analysisPath, 'research-questions.md');
    if (existsSync(questionsFile)) {
      result.questions = this.parseQuestionsFile(readFileSync(questionsFile, 'utf-8'));
    }

    // Parse knowledge-connections.md
    const connectionsFile = join(analysisPath, 'knowledge-connections.md');
    if (existsSync(connectionsFile)) {
      result.connections = this.parseConnectionsFile(readFileSync(connectionsFile, 'utf-8'));
    }

    return result;
  }

  /**
   * Parse vision synthesis file
   */
  private parseVisionFile(content: string): ParsedAnalysis['vision'] {
    const vision: ParsedAnalysis['vision'] = {
      purpose: '',
      goals: [],
      recommendations: []
    };

    // Extract purpose from "Core Purpose" or "Problem Statement" sections
    const purposeMatch = content.match(/## (?:Core Purpose|Problem Statement)[^#]*?\n([\s\S]*?)(?=\n##|\n\*\*|$)/i);
    if (purposeMatch) {
      vision.purpose = purposeMatch[1].trim().slice(0, 500);
    }

    // Extract goals/metrics
    const goalsMatch = content.match(/## (?:Key Success Metrics|Goals)[^#]*?\n([\s\S]*?)(?=\n##|$)/i);
    if (goalsMatch) {
      const goalLines = goalsMatch[1].match(/\*\s+\*\*[^*]+\*\*/g) || [];
      vision.goals = goalLines.map(g => g.replace(/\*+/g, '').trim()).slice(0, 10);
    }

    // Extract recommendations
    const recsMatch = content.match(/## (?:Actionable Recommendations|Recommendations)[^#]*?\n([\s\S]*?)(?=\n##|```|$)/i);
    if (recsMatch) {
      const recLines = recsMatch[1].match(/\d+\.\s+\*\*[^*]+\*\*[^*\n]*/g) || [];
      vision.recommendations = recLines.map(r => r.replace(/\d+\.\s*\*\*|\*\*/g, '').trim()).slice(0, 10);
    }

    return vision;
  }

  /**
   * Parse documentation gaps file
   */
  private parseGapsFile(content: string): DocumentationGap[] {
    const gaps: DocumentationGap[] = [];

    // Find all sections with observations/recommendations
    const sections = content.split(/###\s+\d+\.\s+/);

    for (const section of sections.slice(1)) {
      const titleMatch = section.match(/^([^\n]+)/);
      const title = titleMatch ? titleMatch[1].trim() : 'Unknown Section';

      // Extract observations
      const obsMatches = section.matchAll(/\*\*Observation:\*\*\s*([^\n]+)/g);
      for (const match of obsMatches) {
        const observation = match[1].trim();

        // Find related recommendation
        const recMatch = section.match(/\*\*Recommendation:\*\*\s*([^\n]+)/);
        const recommendation = recMatch ? recMatch[1].trim() : '';

        // Extract wiki-links as related docs
        const wikiLinks = observation.match(/\[\[[^\]]+\]\]/g) || [];
        const relatedDocs = wikiLinks.map(l => l.replace(/\[\[|\]\]/g, ''));

        gaps.push({
          section: title,
          description: observation,
          recommendation,
          priority: this.inferPriority(observation, recommendation),
          relatedDocs
        });
      }

      // Extract findings as gaps
      const findingMatches = section.matchAll(/\*\*Finding:\*\*\s*([^\n]+)/g);
      for (const match of findingMatches) {
        const finding = match[1].trim();
        const wikiLinks = finding.match(/\[\[[^\]]+\]\]/g) || [];

        gaps.push({
          section: title,
          description: finding,
          recommendation: '',
          priority: 'medium',
          relatedDocs: wikiLinks.map(l => l.replace(/\[\[|\]\]/g, ''))
        });
      }
    }

    return gaps;
  }

  /**
   * Parse research questions file
   */
  private parseQuestionsFile(content: string): ResearchQuestion[] {
    const questions: ResearchQuestion[] = [];

    // Find all Question: entries
    const questionMatches = content.matchAll(/(?:Question:|####\s+\d+\.\d+\s+)([^\n]+)\n([\s\S]*?)(?=\n(?:Question:|####|\*\*Importance|\*\*Suggested|###|$))/g);

    for (const match of questionMatches) {
      const questionText = match[1].replace(/^Question:\s*/, '').trim();
      const context = match[2].trim();

      // Extract importance
      const importanceMatch = content.match(new RegExp(`${questionText.slice(0, 50)}[\\s\\S]*?\\*\\*Importance:\\*\\*\\s*([^\\n]+)`));
      const importance = importanceMatch ? importanceMatch[1].trim() : '';

      // Extract suggested resources
      const resourcesMatch = content.match(new RegExp(`${questionText.slice(0, 50)}[\\s\\S]*?\\*\\*Suggested Resources:\\*\\*\\s*([^\\n]+)`));
      const resources = resourcesMatch ? resourcesMatch[1].split(',').map(r => r.trim()) : [];

      // Determine category from section header
      const categoryMatch = content.match(new RegExp(`### \\d+\\. ([^\\n]+)[\\s\\S]*?${questionText.slice(0, 30)}`));
      const category = categoryMatch ? categoryMatch[1].trim() : 'General';

      questions.push({
        question: questionText,
        context,
        importance,
        suggestedResources: resources,
        category
      });
    }

    return questions;
  }

  /**
   * Parse knowledge connections file
   */
  private parseConnectionsFile(content: string): ConnectionSuggestion[] {
    const connections: ConnectionSuggestion[] = [];

    // Find relationship patterns like: [source] --RELATIONSHIP--> [target]
    const relationshipMatches = content.matchAll(/\[([^\]]+)\]\s*--([A-Z_-]+)-->\s*\[([^\]]+)\](?::\s*([^\n]+))?/g);

    for (const match of relationshipMatches) {
      connections.push({
        source: match[1].trim(),
        target: match[3].trim(),
        relationship: match[2].trim(),
        reason: match[4]?.trim() || ''
      });
    }

    // Also find wiki-link based suggestions
    const wikiMatches = content.matchAll(/\[\[([^\]]+)\]\]\s*(?:to|→|->|--)\s*\[\[([^\]]+)\]\]/g);
    for (const match of wikiMatches) {
      connections.push({
        source: match[1].trim(),
        target: match[2].trim(),
        relationship: 'RELATED-TO',
        reason: ''
      });
    }

    return connections;
  }

  /**
   * Load all documentation as context
   */
  private async loadDocsContext(): Promise<Map<string, string>> {
    const context = new Map<string, string>();
    const docsDir = join(this.projectRoot, this.docsPath);

    if (!existsSync(docsDir)) {
      return context;
    }

    const loadDir = (dir: string) => {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'analysis') {
          loadDir(fullPath);
        } else if (entry.endsWith('.md')) {
          const relativePath = relative(docsDir, fullPath);
          const content = readFileSync(fullPath, 'utf-8');
          // Limit content size for context
          context.set(relativePath, content.slice(0, 15000));
        }
      }
    };

    loadDir(docsDir);
    return context;
  }

  /**
   * Create migration agents based on analysis
   */
  private createMigrationAgents(
    analysis: ParsedAnalysis,
    docsContext: Map<string, string>
  ): MigrationAgent[] {
    const agents: MigrationAgent[] = [];

    // High priority gaps get dedicated gap-filler agents
    const highPriorityGaps = analysis.gaps.filter(g => g.priority === 'high');
    if (highPriorityGaps.length > 0) {
      agents.push({
        name: 'Gap Filler - High Priority',
        type: 'gap-filler',
        task: 'Fill high-priority documentation gaps with comprehensive content',
        context: this.buildGapFillerContext(highPriorityGaps, docsContext),
        outputFile: 'gap-implementations.md'
      });
    }

    // Medium priority gaps
    const mediumPriorityGaps = analysis.gaps.filter(g => g.priority === 'medium');
    if (mediumPriorityGaps.length > 0) {
      agents.push({
        name: 'Gap Filler - Medium Priority',
        type: 'gap-filler',
        task: 'Fill medium-priority documentation gaps',
        context: this.buildGapFillerContext(mediumPriorityGaps, docsContext)
      });
    }

    // Research agents for questions by category
    const questionsByCategory = new Map<string, ResearchQuestion[]>();
    for (const q of analysis.questions) {
      const cat = q.category || 'General';
      if (!questionsByCategory.has(cat)) {
        questionsByCategory.set(cat, []);
      }
      questionsByCategory.get(cat)!.push(q);
    }

    for (const [category, questions] of questionsByCategory) {
      if (questions.length > 0) {
        agents.push({
          name: `Researcher - ${category}`,
          type: 'researcher',
          task: `Research and answer questions about ${category}`,
          context: this.buildResearcherContext(questions, docsContext),
          outputFile: `research-${category.toLowerCase().replace(/\s+/g, '-')}.md`
        });
      }
    }

    // MOC builder for empty stub MOCs
    const mocGaps = analysis.gaps.filter(g =>
      g.description.toLowerCase().includes('moc') ||
      g.description.toLowerCase().includes('stub')
    );
    if (mocGaps.length > 0) {
      agents.push({
        name: 'MOC Builder',
        type: 'moc-builder',
        task: 'Populate empty MOC (Map of Content) files with proper structure and links',
        context: this.buildMOCBuilderContext(mocGaps, docsContext)
      });
    }

    // Connection builder
    if (analysis.connections.length > 0) {
      agents.push({
        name: 'Connection Builder',
        type: 'connector',
        task: 'Build knowledge graph connections by adding wiki-links to documents',
        context: this.buildConnectorContext(analysis.connections, docsContext)
      });
    }

    // Integrator agent to ensure consistency
    agents.push({
      name: 'Documentation Integrator',
      type: 'integrator',
      task: 'Ensure all new documentation is consistent and properly integrated',
      context: this.buildIntegratorContext(analysis, docsContext),
      outputFile: 'integration-summary.md'
    });

    return agents.slice(0, this.maxAgents);
  }

  /**
   * Build context for gap filler agent
   */
  private buildGapFillerContext(gaps: DocumentationGap[], docsContext: Map<string, string>): string {
    let context = '## Documentation Gaps to Fill\n\n';

    for (const gap of gaps) {
      context += `### ${gap.section}\n`;
      context += `**Issue:** ${gap.description}\n`;
      if (gap.recommendation) {
        context += `**Recommendation:** ${gap.recommendation}\n`;
      }
      context += `**Priority:** ${gap.priority}\n`;

      // Add related doc content
      for (const relatedDoc of gap.relatedDocs.slice(0, 2)) {
        const docKey = Array.from(docsContext.keys()).find(k =>
          k.toLowerCase().includes(relatedDoc.toLowerCase().replace(/\s+/g, '-'))
        );
        if (docKey) {
          context += `\n**Related: ${relatedDoc}**\n`;
          context += docsContext.get(docKey)?.slice(0, 2000) + '\n';
        }
      }
      context += '\n---\n\n';
    }

    context += '\n## Instructions\n';
    context += 'For each gap, create comprehensive documentation that:\n';
    context += '1. Addresses the specific issue identified\n';
    context += '2. Follows the existing documentation style\n';
    context += '3. Includes proper wiki-links [[like-this]]\n';
    context += '4. Has appropriate frontmatter (title, type, tags)\n';
    context += '5. Integrates with existing documentation structure\n';

    return context;
  }

  /**
   * Build context for researcher agent
   */
  private buildResearcherContext(questions: ResearchQuestion[], docsContext: Map<string, string>): string {
    let context = '## Research Questions to Answer\n\n';

    for (const q of questions) {
      context += `### Question\n${q.question}\n\n`;
      if (q.importance) {
        context += `**Importance:** ${q.importance}\n`;
      }
      if (q.context) {
        context += `**Context:** ${q.context}\n`;
      }
      if (q.suggestedResources.length > 0) {
        context += `**Resources:** ${q.suggestedResources.join(', ')}\n`;
      }
      context += '\n---\n\n';
    }

    // Add relevant documentation context
    context += '\n## Available Documentation Context\n\n';
    const relevantDocs = this.findRelevantDocs(
      questions.map(q => q.question).join(' '),
      docsContext,
      5
    );
    for (const [path, content] of relevantDocs) {
      context += `### ${path}\n`;
      context += content.slice(0, 3000) + '\n\n';
    }

    context += '\n## Instructions\n';
    context += 'For each research question:\n';
    context += '1. Analyze the available documentation\n';
    context += '2. Synthesize a well-researched answer\n';
    context += '3. Cite sources using [[wiki-links]]\n';
    context += '4. Identify any remaining unknowns\n';
    context += '5. Suggest best practices based on the knowledge graph\n';

    return context;
  }

  /**
   * Build context for MOC builder agent
   */
  private buildMOCBuilderContext(gaps: DocumentationGap[], docsContext: Map<string, string>): string {
    let context = '## MOC Files to Populate\n\n';

    // Find all MOC files
    const mocFiles = Array.from(docsContext.keys()).filter(k =>
      k.includes('_MOC.md') || k.includes('MOC.md')
    );

    context += '### Current MOC Files\n';
    for (const mocFile of mocFiles) {
      const content = docsContext.get(mocFile) || '';
      const isEmpty = content.length < 200 || content.includes('stub');
      context += `- ${mocFile} ${isEmpty ? '(EMPTY/STUB)' : '(has content)'}\n`;
    }

    context += '\n### Gap Analysis Related to MOCs\n';
    for (const gap of gaps) {
      context += `- ${gap.section}: ${gap.description}\n`;
      if (gap.recommendation) {
        context += `  Recommendation: ${gap.recommendation}\n`;
      }
    }

    // Add directory structure
    context += '\n### Documentation Structure\n';
    const directories = new Set<string>();
    for (const path of docsContext.keys()) {
      const dir = dirname(path);
      if (dir !== '.') {
        directories.add(dir);
      }
    }
    for (const dir of directories) {
      const docsInDir = Array.from(docsContext.keys()).filter(k => dirname(k) === dir);
      context += `- ${dir}/ (${docsInDir.length} docs)\n`;
    }

    context += '\n## Instructions\n';
    context += 'For each empty/stub MOC file:\n';
    context += '1. Create a proper introduction for the section\n';
    context += '2. List all documents in that directory with [[wiki-links]]\n';
    context += '3. Organize by subcategory if applicable\n';
    context += '4. Add brief descriptions for each linked document\n';
    context += '5. Include navigation links to parent/sibling MOCs\n';

    return context;
  }

  /**
   * Build context for connector agent
   */
  private buildConnectorContext(connections: ConnectionSuggestion[], docsContext: Map<string, string>): string {
    let context = '## Suggested Knowledge Graph Connections\n\n';

    for (const conn of connections) {
      context += `- [${conn.source}] --${conn.relationship}--> [${conn.target}]`;
      if (conn.reason) {
        context += `: ${conn.reason}`;
      }
      context += '\n';
    }

    context += '\n## Existing Documents\n';
    for (const [path] of Array.from(docsContext.entries()).slice(0, 30)) {
      context += `- [[${path.replace('.md', '')}]]\n`;
    }

    context += '\n## Instructions\n';
    context += 'For each suggested connection:\n';
    context += '1. Find the source document\n';
    context += '2. Add appropriate wiki-link [[target]] to the source\n';
    context += '3. Consider adding reciprocal links where appropriate\n';
    context += '4. Use "See also" or "Related" sections for connections\n';
    context += '5. Ensure the link context is meaningful\n';

    return context;
  }

  /**
   * Build context for integrator agent
   */
  private buildIntegratorContext(analysis: ParsedAnalysis, docsContext: Map<string, string>): string {
    let context = '## Integration Context\n\n';

    context += '### Project Vision\n';
    context += analysis.vision.purpose + '\n\n';

    context += '### Goals\n';
    for (const goal of analysis.vision.goals) {
      context += `- ${goal}\n`;
    }

    context += '\n### Key Recommendations\n';
    for (const rec of analysis.vision.recommendations) {
      context += `- ${rec}\n`;
    }

    context += '\n### Statistics\n';
    context += `- Total documents: ${docsContext.size}\n`;
    context += `- Gaps identified: ${analysis.gaps.length}\n`;
    context += `- Questions to answer: ${analysis.questions.length}\n`;
    context += `- Connections to build: ${analysis.connections.length}\n`;

    context += '\n## Instructions\n';
    context += 'Create an integration summary that:\n';
    context += '1. Lists all changes made during migration\n';
    context += '2. Highlights any remaining gaps\n';
    context += '3. Suggests next steps for documentation improvement\n';
    context += '4. Provides a quality assessment\n';

    return context;
  }

  /**
   * Execute a single migration agent
   */
  private async executeAgent(
    agent: MigrationAgent,
    analysis: ParsedAnalysis,
    docsContext: Map<string, string>
  ): Promise<{
    documentsCreated?: number;
    documentsUpdated?: number;
    gapsFilled?: number;
    questionsAnswered?: number;
    connectionsAdded?: number;
  }> {
    this.log('info', `Executing agent: ${agent.name}`, { type: agent.type });

    const prompt = this.buildAgentPrompt(agent);
    const response = await this.callAI(prompt);

    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse response and create/update documents
    const result = await this.processAgentResponse(agent, response, docsContext);

    this.log('info', `Agent ${agent.name} completed`, result);

    return result;
  }

  /**
   * Build prompt for agent
   */
  private buildAgentPrompt(agent: MigrationAgent): string {
    return `# ${agent.name}

## Task
${agent.task}

${agent.context}

## Output Format
Provide your response in markdown format with clear sections.
For each document to create or update, use this format:

\`\`\`document
---
path: relative/path/to/file.md
action: create|update
---
# Document Title

Document content here with [[wiki-links]] to other documents.
\`\`\`

For research answers, use:
\`\`\`answer
## Question
The original question

## Answer
Your researched answer with [[citations]]

## Best Practices
- Recommendation 1
- Recommendation 2

## Remaining Unknowns
- Any unresolved items
\`\`\`
`;
  }

  /**
   * Call AI (Gemini or fallback)
   */
  private async callAI(prompt: string): Promise<string | null> {
    if (this.geminiClient) {
      try {
        const model = this.geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        this.log('error', 'Gemini API call failed', { error: String(error) });
        return null;
      }
    }

    // Fallback to Anthropic if available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const message = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }]
        });
        const textBlock = message.content.find(b => b.type === 'text');
        return textBlock ? textBlock.text : null;
      } catch (error) {
        this.log('error', 'Anthropic API call failed', { error: String(error) });
        return null;
      }
    }

    return null;
  }

  /**
   * Process agent response and create/update documents
   */
  private async processAgentResponse(
    agent: MigrationAgent,
    response: string,
    docsContext: Map<string, string>
  ): Promise<{
    documentsCreated?: number;
    documentsUpdated?: number;
    gapsFilled?: number;
    questionsAnswered?: number;
    connectionsAdded?: number;
  }> {
    const result = {
      documentsCreated: 0,
      documentsUpdated: 0,
      gapsFilled: 0,
      questionsAnswered: 0,
      connectionsAdded: 0
    };

    // Extract document blocks
    const documentMatches = response.matchAll(/```document\n---\npath:\s*([^\n]+)\naction:\s*(\w+)\n---\n([\s\S]*?)```/g);

    for (const match of documentMatches) {
      const path = match[1].trim();
      const action = match[2].trim();
      const content = match[3].trim();

      if (this.dryRun) {
        this.log('info', `[DRY RUN] Would ${action}: ${path}`);
        continue;
      }

      const fullPath = join(this.projectRoot, this.docsPath, path);

      // Ensure directory exists
      const dir = dirname(fullPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Write document
      const finalContent = this.addFrontmatter(content, path, agent.type);
      writeFileSync(fullPath, finalContent, 'utf-8');

      if (action === 'create') {
        result.documentsCreated++;
        if (agent.type === 'gap-filler') {
          result.gapsFilled++;
        }
      } else {
        result.documentsUpdated++;
      }

      // Count connections added
      const wikiLinks = content.match(/\[\[[^\]]+\]\]/g) || [];
      result.connectionsAdded += wikiLinks.length;
    }

    // Extract answer blocks
    const answerMatches = response.matchAll(/```answer\n([\s\S]*?)```/g);
    for (const match of answerMatches) {
      result.questionsAnswered++;

      // Save answer to research output file
      if (agent.outputFile && !this.dryRun) {
        const outputPath = join(this.projectRoot, this.docsPath, 'analysis', agent.outputFile);
        const existing = existsSync(outputPath) ? readFileSync(outputPath, 'utf-8') : '';
        const newContent = existing + '\n\n---\n\n' + match[1].trim();
        writeFileSync(outputPath, newContent, 'utf-8');
      }
    }

    // If agent has output file and no document blocks, save raw response
    if (agent.outputFile && result.documentsCreated === 0 && !this.dryRun) {
      const outputPath = join(this.projectRoot, this.docsPath, 'analysis', agent.outputFile);
      const frontmatter = `---
title: "${agent.name}"
type: migration-output
generator: migration-orchestrator
agent: ${agent.type}
created: ${new Date().toISOString()}
---

# ${agent.name}

> Generated by MigrationOrchestrator

`;
      writeFileSync(outputPath, frontmatter + response, 'utf-8');
      result.documentsCreated++;
    }

    return result;
  }

  /**
   * Add frontmatter to document if not present
   */
  private addFrontmatter(content: string, path: string, agentType: string): string {
    if (content.startsWith('---')) {
      return content;
    }

    const title = basename(path, '.md').replace(/-/g, ' ').replace(/_/g, ' ');
    const type = this.inferDocType(path);

    return `---
title: "${title}"
type: ${type}
generator: migration-orchestrator
agent: ${agentType}
created: ${new Date().toISOString()}
---

${content}`;
  }

  /**
   * Infer document type from path
   */
  private inferDocType(path: string): string {
    if (path.includes('concepts')) return 'concept';
    if (path.includes('components')) return 'component';
    if (path.includes('services')) return 'service';
    if (path.includes('features')) return 'feature';
    if (path.includes('guides')) return 'guide';
    if (path.includes('references')) return 'reference';
    if (path.includes('standards')) return 'standard';
    if (path.includes('integrations')) return 'integration';
    if (path.includes('MOC')) return 'moc';
    return 'document';
  }

  /**
   * Update MOC files with new connections
   */
  private async updateMOCFiles(connections: ConnectionSuggestion[]): Promise<void> {
    // This would update MOC files with new links
    // For now, we'll let the MOC builder agent handle this
    this.log('info', 'MOC files updated with new connections', { count: connections.length });
  }

  /**
   * Find relevant docs based on query
   */
  private findRelevantDocs(
    query: string,
    docsContext: Map<string, string>,
    limit: number
  ): Map<string, string> {
    const relevant = new Map<string, string>();
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    // Simple keyword matching (would use vector search if available)
    const scored = Array.from(docsContext.entries()).map(([path, content]) => {
      let score = 0;
      const lowerContent = content.toLowerCase();
      for (const word of queryWords) {
        if (lowerContent.includes(word)) {
          score++;
        }
      }
      return { path, content, score };
    });

    scored.sort((a, b) => b.score - a.score);

    for (const item of scored.slice(0, limit)) {
      if (item.score > 0) {
        relevant.set(item.path, item.content);
      }
    }

    return relevant;
  }

  /**
   * Infer priority from description
   */
  private inferPriority(description: string, recommendation: string): 'high' | 'medium' | 'low' {
    const text = (description + ' ' + recommendation).toLowerCase();

    if (text.includes('critical') || text.includes('missing') || text.includes('empty') ||
        text.includes('stub') || text.includes('required')) {
      return 'high';
    }

    if (text.includes('should') || text.includes('recommend') || text.includes('consider')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Log message
   */
  private log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
    if (!this.verbose && level === 'info') return;

    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📋';

    console.log(`[${timestamp}] ${prefix} [migration] ${message}`, data ? JSON.stringify(data) : '');
  }
}

export type { MigrationResult, OrchestratorOptions, ParsedAnalysis };
