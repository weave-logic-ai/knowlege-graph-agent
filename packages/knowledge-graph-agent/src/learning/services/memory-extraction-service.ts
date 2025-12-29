/**
 * Memory Extraction Service
 *
 * Extracts different types of memories from completed task results
 * including episodic, procedural, semantic, technical, and context memories.
 *
 * @module learning/services/memory-extraction-service
 */

import { createLogger } from '../../utils/index.js';
import {
  MemoryType,
  type ExtractedMemory,
  type TaskResult,
  type TaskStep,
  type CodeChange,
  type TaskContext,
  createMemoryId,
} from '../types.js';

const logger = createLogger('memory-extraction');

/**
 * Configuration for memory extraction
 */
export interface MemoryExtractionConfig {
  /** Extract episodic memories */
  extractEpisodic: boolean;
  /** Extract procedural memories */
  extractProcedural: boolean;
  /** Extract semantic memories */
  extractSemantic: boolean;
  /** Extract technical memories */
  extractTechnical: boolean;
  /** Minimum confidence threshold */
  minConfidence: number;
  /** Maximum content length */
  maxContentLength: number;
  /** Include embeddings */
  generateEmbeddings: boolean;
}

const DEFAULT_CONFIG: MemoryExtractionConfig = {
  extractEpisodic: true,
  extractProcedural: true,
  extractSemantic: true,
  extractTechnical: true,
  minConfidence: 0.5,
  maxContentLength: 2000,
  generateEmbeddings: false,
};

/**
 * Memory Extraction Service
 *
 * Extracts structured memories from task execution results for
 * later retrieval and agent priming.
 *
 * @example
 * ```typescript
 * const extractor = new MemoryExtractionService();
 * const memories = await extractor.extractFromTask(taskResult);
 * console.log(`Extracted ${memories.length} memories`);
 * ```
 */
export class MemoryExtractionService {
  private config: MemoryExtractionConfig;

  constructor(config: Partial<MemoryExtractionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Extract all memory types from a task result
   */
  async extractFromTask(taskResult: TaskResult): Promise<ExtractedMemory[]> {
    const memories: ExtractedMemory[] = [];

    logger.debug('Extracting memories from task', {
      taskId: taskResult.taskId,
      agentType: taskResult.agentType,
    });

    try {
      // Extract EPISODIC memory (what happened)
      if (this.config.extractEpisodic) {
        const episodic = await this.extractEpisodic(taskResult);
        if (episodic.confidence >= this.config.minConfidence) {
          memories.push(episodic);
        }
      }

      // Extract PROCEDURAL memory (how it was done)
      if (this.config.extractProcedural && taskResult.steps && taskResult.steps.length > 0) {
        const procedural = await this.extractProcedural(taskResult.steps, taskResult);
        if (procedural.confidence >= this.config.minConfidence) {
          memories.push(procedural);
        }
      }

      // Extract SEMANTIC memory (concepts learned)
      if (this.config.extractSemantic) {
        const semanticMemories = await this.extractSemantic(taskResult.output, taskResult);
        for (const memory of semanticMemories) {
          if (memory.confidence >= this.config.minConfidence) {
            memories.push(memory);
          }
        }
      }

      // Extract TECHNICAL memory (code patterns)
      if (this.config.extractTechnical && taskResult.codeChanges && taskResult.codeChanges.length > 0) {
        const technicalMemories = await this.extractTechnical(taskResult.codeChanges, taskResult);
        for (const memory of technicalMemories) {
          if (memory.confidence >= this.config.minConfidence) {
            memories.push(memory);
          }
        }
      }

      // Extract CONTEXT memory (environment)
      const contextMemory = await this.extractContext(taskResult.context, taskResult);
      if (contextMemory.confidence >= this.config.minConfidence) {
        memories.push(contextMemory);
      }

      logger.info('Memory extraction complete', {
        taskId: taskResult.taskId,
        memoriesExtracted: memories.length,
        byType: this.groupByType(memories),
      });
    } catch (error) {
      logger.error('Error extracting memories', error as Error, {
        taskId: taskResult.taskId,
      });
    }

    return memories;
  }

  /**
   * Extract episodic memory - what happened during task execution
   */
  private async extractEpisodic(result: TaskResult): Promise<ExtractedMemory> {
    const summary = this.createTaskSummary(result);
    const confidence = this.calculateEpisodicConfidence(result);

    return {
      id: createMemoryId(),
      type: MemoryType.EPISODIC,
      content: summary,
      confidence,
      source: result.taskId,
      timestamp: new Date(),
      metadata: {
        taskId: result.taskId,
        agentId: result.agentId,
        agentType: result.agentType,
        success: result.success,
        durationMs: result.durationMs,
        qualityScore: result.qualityScore,
        stepCount: result.steps?.length ?? 0,
      },
      tags: this.extractTaskTags(result),
    };
  }

  /**
   * Extract procedural memory - how the task was executed
   */
  private async extractProcedural(steps: TaskStep[], result: TaskResult): Promise<ExtractedMemory> {
    const procedure = this.buildProcedure(steps);
    const confidence = this.calculateProceduralConfidence(steps, result);

    return {
      id: createMemoryId(),
      type: MemoryType.PROCEDURAL,
      content: procedure,
      confidence,
      source: result.taskId,
      timestamp: new Date(),
      metadata: {
        taskId: result.taskId,
        agentType: result.agentType,
        stepCount: steps.length,
        successfulSteps: steps.filter(s => s.success).length,
        actions: [...new Set(steps.map(s => s.action))],
        totalDurationMs: steps.reduce((sum, s) => sum + (s.durationMs ?? 0), 0),
      },
      tags: ['procedure', result.agentType, ...this.extractActionTags(steps)],
    };
  }

  /**
   * Extract semantic memories - concepts and facts learned
   */
  private async extractSemantic(output: string, result: TaskResult): Promise<ExtractedMemory[]> {
    const memories: ExtractedMemory[] = [];

    // Extract key concepts from output
    const concepts = this.extractConcepts(output);

    for (const concept of concepts) {
      if (concept.content.length > 10) {
        memories.push({
          id: createMemoryId(),
          type: MemoryType.SEMANTIC,
          content: concept.content,
          confidence: concept.confidence,
          source: result.taskId,
          timestamp: new Date(),
          metadata: {
            taskId: result.taskId,
            agentType: result.agentType,
            conceptType: concept.type,
          },
          tags: ['concept', concept.type, result.agentType],
        });
      }
    }

    // Extract facts from structured data
    if (result.metadata) {
      const facts = this.extractFacts(result.metadata, result);
      memories.push(...facts);
    }

    return memories;
  }

  /**
   * Extract technical memories - code patterns and solutions
   */
  private async extractTechnical(codeChanges: CodeChange[], result: TaskResult): Promise<ExtractedMemory[]> {
    const memories: ExtractedMemory[] = [];

    // Group changes by pattern type
    const patterns = this.identifyPatterns(codeChanges);

    for (const pattern of patterns) {
      memories.push({
        id: createMemoryId(),
        type: MemoryType.TECHNICAL,
        content: pattern.description,
        confidence: pattern.confidence,
        source: result.taskId,
        timestamp: new Date(),
        metadata: {
          taskId: result.taskId,
          agentType: result.agentType,
          patternType: pattern.type,
          files: pattern.files,
          languages: pattern.languages,
          linesChanged: pattern.linesChanged,
        },
        tags: ['pattern', pattern.type, ...pattern.languages],
      });
    }

    // Extract individual file change memories for significant changes
    for (const change of codeChanges) {
      if (change.linesAdded + change.linesRemoved > 20) {
        memories.push({
          id: createMemoryId(),
          type: MemoryType.TECHNICAL,
          content: `${change.changeType}: ${change.filePath} - ${change.description ?? 'No description'}`,
          confidence: 0.7,
          source: result.taskId,
          timestamp: new Date(),
          metadata: {
            taskId: result.taskId,
            agentType: result.agentType,
            filePath: change.filePath,
            changeType: change.changeType,
            linesAdded: change.linesAdded,
            linesRemoved: change.linesRemoved,
            language: change.language,
          },
          tags: ['code-change', change.changeType, change.language ?? 'unknown', result.agentType],
        });
      }
    }

    return memories;
  }

  /**
   * Extract context memory - environmental information
   */
  private async extractContext(context: TaskContext, result: TaskResult): Promise<ExtractedMemory> {
    const contextSummary = this.buildContextSummary(context);
    const confidence = context.workingDirectory ? 0.8 : 0.5;

    return {
      id: createMemoryId(),
      type: MemoryType.CONTEXT,
      content: contextSummary,
      confidence,
      source: result.taskId,
      timestamp: new Date(),
      metadata: {
        taskId: result.taskId,
        agentType: result.agentType,
        workingDirectory: context.workingDirectory,
        projectType: context.projectType,
        sessionId: context.sessionId,
        fileCount: context.activeFiles?.length ?? 0,
      },
      tags: ['context', context.projectType ?? 'unknown', result.agentType],
    };
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private createTaskSummary(result: TaskResult): string {
    const status = result.success ? 'successfully completed' : 'failed';
    const duration = this.formatDuration(result.durationMs);

    let summary = `Task "${result.description}" ${status} by ${result.agentType} agent in ${duration}.`;

    if (result.steps && result.steps.length > 0) {
      const successfulSteps = result.steps.filter(s => s.success).length;
      summary += ` Executed ${result.steps.length} steps (${successfulSteps} successful).`;
    }

    if (result.codeChanges && result.codeChanges.length > 0) {
      const totalLines = result.codeChanges.reduce((sum, c) => sum + c.linesAdded + c.linesRemoved, 0);
      summary += ` Modified ${result.codeChanges.length} files (${totalLines} lines changed).`;
    }

    if (result.error) {
      summary += ` Error: ${result.error.message}`;
    }

    if (result.qualityScore !== undefined) {
      summary += ` Quality score: ${(result.qualityScore * 100).toFixed(1)}%.`;
    }

    return this.truncateContent(summary);
  }

  private buildProcedure(steps: TaskStep[]): string {
    const lines: string[] = ['## Procedure'];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const status = step.success ? '[OK]' : '[FAIL]';
      const duration = step.durationMs ? ` (${step.durationMs}ms)` : '';

      lines.push(`${i + 1}. ${status} ${step.action}: ${step.description}${duration}`);

      if (!step.success && step.error) {
        lines.push(`   Error: ${step.error}`);
      }
    }

    return this.truncateContent(lines.join('\n'));
  }

  private buildContextSummary(context: TaskContext): string {
    const parts: string[] = [];

    if (context.projectType) {
      parts.push(`Project type: ${context.projectType}`);
    }

    if (context.workingDirectory) {
      parts.push(`Working directory: ${context.workingDirectory}`);
    }

    if (context.activeFiles && context.activeFiles.length > 0) {
      parts.push(`Active files: ${context.activeFiles.slice(0, 5).join(', ')}${context.activeFiles.length > 5 ? '...' : ''}`);
    }

    if (context.sessionId) {
      parts.push(`Session: ${context.sessionId}`);
    }

    return parts.join('\n');
  }

  private extractConcepts(output: string): Array<{ content: string; type: string; confidence: number }> {
    const concepts: Array<{ content: string; type: string; confidence: number }> = [];

    // Extract definitions (sentences containing "is a", "refers to", etc.)
    const definitionPatterns = [
      /([A-Z][a-zA-Z]+) is a[n]? ([^.]+)/g,
      /([A-Z][a-zA-Z]+) refers to ([^.]+)/g,
      /([A-Z][a-zA-Z]+) represents ([^.]+)/g,
    ];

    for (const pattern of definitionPatterns) {
      const matches = output.matchAll(pattern);
      for (const match of matches) {
        concepts.push({
          content: match[0],
          type: 'definition',
          confidence: 0.7,
        });
      }
    }

    // Extract key findings (sentences with "found", "discovered", "identified")
    const findingPattern = /(found|discovered|identified|detected) ([^.]+)/gi;
    const findingMatches = output.matchAll(findingPattern);
    for (const match of findingMatches) {
      concepts.push({
        content: match[0],
        type: 'finding',
        confidence: 0.8,
      });
    }

    // Extract recommendations (sentences with "should", "recommend", "suggest")
    const recommendationPattern = /(should|recommend|suggest|consider) ([^.]+)/gi;
    const recommendationMatches = output.matchAll(recommendationPattern);
    for (const match of recommendationMatches) {
      concepts.push({
        content: match[0],
        type: 'recommendation',
        confidence: 0.75,
      });
    }

    return concepts;
  }

  private extractFacts(metadata: Record<string, unknown>, result: TaskResult): ExtractedMemory[] {
    const facts: ExtractedMemory[] = [];

    // Extract measurable facts
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'number' || typeof value === 'boolean') {
        facts.push({
          id: createMemoryId(),
          type: MemoryType.SEMANTIC,
          content: `Metric ${key}: ${value}`,
          confidence: 0.9,
          source: result.taskId,
          timestamp: new Date(),
          metadata: {
            taskId: result.taskId,
            metricKey: key,
            metricValue: value,
          },
          tags: ['fact', 'metric', key],
        });
      }
    }

    return facts;
  }

  private identifyPatterns(codeChanges: CodeChange[]): Array<{
    type: string;
    description: string;
    confidence: number;
    files: string[];
    languages: string[];
    linesChanged: number;
  }> {
    const patterns: Array<{
      type: string;
      description: string;
      confidence: number;
      files: string[];
      languages: string[];
      linesChanged: number;
    }> = [];

    // Group by language
    const byLanguage = new Map<string, CodeChange[]>();
    for (const change of codeChanges) {
      const lang = change.language ?? 'unknown';
      if (!byLanguage.has(lang)) {
        byLanguage.set(lang, []);
      }
      byLanguage.get(lang)!.push(change);
    }

    // Identify refactoring patterns
    const refactoringChanges = codeChanges.filter(c => c.changeType === 'modify' && c.linesRemoved > 0);
    if (refactoringChanges.length > 2) {
      patterns.push({
        type: 'refactoring',
        description: `Refactored ${refactoringChanges.length} files`,
        confidence: 0.8,
        files: refactoringChanges.map(c => c.filePath),
        languages: [...new Set(refactoringChanges.map(c => c.language ?? 'unknown'))],
        linesChanged: refactoringChanges.reduce((sum, c) => sum + c.linesAdded + c.linesRemoved, 0),
      });
    }

    // Identify feature addition patterns
    const newFiles = codeChanges.filter(c => c.changeType === 'create');
    if (newFiles.length > 0) {
      patterns.push({
        type: 'feature-addition',
        description: `Created ${newFiles.length} new files`,
        confidence: 0.85,
        files: newFiles.map(c => c.filePath),
        languages: [...new Set(newFiles.map(c => c.language ?? 'unknown'))],
        linesChanged: newFiles.reduce((sum, c) => sum + c.linesAdded, 0),
      });
    }

    // Identify bug fix patterns (small targeted changes)
    const smallChanges = codeChanges.filter(c => c.linesAdded + c.linesRemoved < 20 && c.changeType === 'modify');
    if (smallChanges.length > 0 && smallChanges.length <= 3) {
      patterns.push({
        type: 'bug-fix',
        description: `Made targeted changes to ${smallChanges.length} files`,
        confidence: 0.7,
        files: smallChanges.map(c => c.filePath),
        languages: [...new Set(smallChanges.map(c => c.language ?? 'unknown'))],
        linesChanged: smallChanges.reduce((sum, c) => sum + c.linesAdded + c.linesRemoved, 0),
      });
    }

    return patterns;
  }

  private extractTaskTags(result: TaskResult): string[] {
    const tags: string[] = [result.agentType];

    if (result.success) {
      tags.push('success');
    } else {
      tags.push('failure');
    }

    if (result.qualityScore !== undefined) {
      if (result.qualityScore >= 0.9) {
        tags.push('high-quality');
      } else if (result.qualityScore < 0.5) {
        tags.push('low-quality');
      }
    }

    if (result.codeChanges && result.codeChanges.length > 0) {
      tags.push('code-change');
    }

    return tags;
  }

  private extractActionTags(steps: TaskStep[]): string[] {
    const actions = [...new Set(steps.map(s => s.action.toLowerCase()))];
    return actions.slice(0, 5);
  }

  private calculateEpisodicConfidence(result: TaskResult): number {
    let confidence = 0.5;

    if (result.success) {
      confidence += 0.2;
    }

    if (result.qualityScore !== undefined) {
      confidence += result.qualityScore * 0.2;
    }

    if (result.steps && result.steps.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  private calculateProceduralConfidence(steps: TaskStep[], result: TaskResult): number {
    const successRate = steps.filter(s => s.success).length / steps.length;
    let confidence = 0.4 + successRate * 0.4;

    if (result.success) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1);
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      return `${(ms / 60000).toFixed(1)}min`;
    }
  }

  private truncateContent(content: string): string {
    if (content.length <= this.config.maxContentLength) {
      return content;
    }
    return content.substring(0, this.config.maxContentLength - 3) + '...';
  }

  private groupByType(memories: ExtractedMemory[]): Record<MemoryType, number> {
    const result: Partial<Record<MemoryType, number>> = {};

    for (const memory of memories) {
      result[memory.type] = (result[memory.type] ?? 0) + 1;
    }

    return result as Record<MemoryType, number>;
  }
}

/**
 * Create a memory extraction service instance
 */
export function createMemoryExtractionService(
  config?: Partial<MemoryExtractionConfig>
): MemoryExtractionService {
  return new MemoryExtractionService(config);
}
