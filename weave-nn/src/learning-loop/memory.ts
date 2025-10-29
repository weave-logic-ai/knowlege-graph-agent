/**
 * Memory System
 * Stores and retrieves experiences using MCP memory tools
 */

import type {
  Experience,
  MemoryQuery,
  MemoryEntry,
  MemoryFilter,
  MemoryError,
} from './types';

interface ClaudeFlowClient {
  memory_usage: (params: any) => Promise<any>;
  memory_search: (params: any) => Promise<any[]>;
  neural_patterns: (params: any) => Promise<any>;
  memory_compress: (params: any) => Promise<any>;
  memory_backup: (params: any) => Promise<any>;
}

interface ShadowCache {
  indexExperience: (experience: Experience) => Promise<void>;
  searchExperiences: (query: string) => Promise<Experience[]>;
}

/**
 * Memory System
 * Manages long-term storage and retrieval of experiences
 */
export class MemorySystem {
  private readonly namespace = 'weaver_experiences';
  private readonly ttl = 30 * 24 * 60 * 60; // 30 days in seconds

  constructor(
    private claudeFlow: ClaudeFlowClient,
    private shadowCache?: ShadowCache
  ) {}

  /**
   * Store experience in memory with neural pattern update
   */
  async memorize(experience: Experience): Promise<void> {
    try {
      // 1. Store complete experience in MCP memory
      await this.storeExperience(experience);

      // 2. Update neural patterns for learning
      await this.updateNeuralPatterns(experience);

      // 3. Update local shadow cache if available
      if (this.shadowCache) {
        await this.shadowCache.indexExperience(experience);
      }

      console.log(`✓ Memorized experience: ${experience.id}`);
    } catch (error) {
      throw new (MemoryError as any)(
        `Failed to memorize experience: ${error.message}`,
        { experience, error }
      );
    }
  }

  /**
   * Recall experiences matching query
   */
  async recall(query: MemoryQuery): Promise<Experience[]> {
    try {
      const { pattern, namespace = this.namespace, limit = 10, filters } = query;

      // Search MCP memory
      const mcpResults = await this.claudeFlow.memory_search({
        pattern,
        namespace,
        limit,
      });

      // Parse and filter experiences
      const experiences = mcpResults
        .map((r) => {
          try {
            return JSON.parse(r.value) as Experience;
          } catch {
            return null;
          }
        })
        .filter((exp): exp is Experience => exp !== null);

      // Apply filters if provided
      return filters ? this.applyFilters(experiences, filters) : experiences;
    } catch (error) {
      console.warn(`Memory recall failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Store experience in MCP memory
   */
  private async storeExperience(experience: Experience): Promise<void> {
    await this.claudeFlow.memory_usage({
      action: 'store',
      namespace: this.namespace,
      key: `exp_${experience.id}`,
      value: JSON.stringify(experience),
      ttl: this.ttl,
    });
  }

  /**
   * Update neural patterns based on experience
   */
  private async updateNeuralPatterns(experience: Experience): Promise<void> {
    try {
      await this.claudeFlow.neural_patterns({
        action: 'learn',
        operation: experience.task.description,
        outcome: experience.success ? 'success' : 'failure',
        metadata: {
          lessons: experience.lessons.map((l) => ({
            type: l.type,
            description: l.description,
            impact: l.impact,
          })),
          domain: experience.domain,
          confidence: experience.plan.confidence,
          duration: experience.outcome.duration,
        },
      });
    } catch (error) {
      // Neural pattern update is non-critical
      console.warn(`Neural pattern update failed: ${error.message}`);
    }
  }

  /**
   * Apply filters to experiences
   */
  private applyFilters(experiences: Experience[], filters: MemoryFilter): Experience[] {
    let filtered = experiences;

    // Domain filter
    if (filters.domain) {
      filtered = filtered.filter((exp) => exp.domain === filters.domain);
    }

    // Success filter
    if (filters.successOnly) {
      filtered = filtered.filter((exp) => exp.success);
    }

    // Confidence filter
    if (filters.minConfidence !== undefined) {
      filtered = filtered.filter((exp) => exp.plan.confidence >= filters.minConfidence!);
    }

    // Date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter((exp) => exp.timestamp >= start && exp.timestamp <= end);
    }

    return filtered;
  }

  /**
   * Compress old memories to save space
   */
  async compress(): Promise<void> {
    try {
      await this.claudeFlow.memory_compress({
        namespace: this.namespace,
      });
      console.log('✓ Memory compression complete');
    } catch (error) {
      console.warn(`Memory compression failed: ${error.message}`);
    }
  }

  /**
   * Backup all experiences
   */
  async backup(path: string): Promise<void> {
    try {
      await this.claudeFlow.memory_backup({
        path,
      });
      console.log(`✓ Memory backed up to: ${path}`);
    } catch (error) {
      throw new (MemoryError as any)(
        `Failed to backup memory: ${error.message}`,
        { path, error }
      );
    }
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<{
    totalExperiences: number;
    successRate: number;
    averageConfidence: number;
    topDomains: Array<{ domain: string; count: number }>;
  }> {
    try {
      // Recall all experiences
      const all = await this.recall({ pattern: '*', limit: 1000 });

      if (all.length === 0) {
        return {
          totalExperiences: 0,
          successRate: 0,
          averageConfidence: 0,
          topDomains: [],
        };
      }

      // Calculate statistics
      const successCount = all.filter((exp) => exp.success).length;
      const successRate = successCount / all.length;

      const avgConfidence = all.reduce((sum, exp) => sum + exp.plan.confidence, 0) / all.length;

      // Count by domain
      const domainCounts = new Map<string, number>();
      all.forEach((exp) => {
        const count = domainCounts.get(exp.domain) || 0;
        domainCounts.set(exp.domain, count + 1);
      });

      const topDomains = Array.from(domainCounts.entries())
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalExperiences: all.length,
        successRate,
        averageConfidence: avgConfidence,
        topDomains,
      };
    } catch (error) {
      console.warn(`Failed to get memory stats: ${error.message}`);
      return {
        totalExperiences: 0,
        successRate: 0,
        averageConfidence: 0,
        topDomains: [],
      };
    }
  }
}
