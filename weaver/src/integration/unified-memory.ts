/**
 * Unified Memory Interface
 *
 * Integrates chunking, embeddings, experiences, and reasoning into a cohesive memory system.
 */

import { ExperienceIndexer } from '../memory/experience-indexer.js';
import { FileVectorStorage } from '../embeddings/storage/vector-storage.js';
import { EmbeddingModelManager } from '../embeddings/models/model-manager.js';
import { ReflectionEngine } from '../reflection/reflection-engine.js';
import { CoTTemplateManager } from '../reasoning/template-manager.js';
import type { Experience, ExperienceDomain } from '../memory/types.js';
import type { EmbeddingModelType } from '../embeddings/types.js';
import { logger } from '../utils/logger.js';

export interface UnifiedMemoryConfig {
  vectorStorageDir?: string;
  embeddingModel?: EmbeddingModelType;
  enableReflection?: boolean;
  experienceRetentionDays?: number;
}

/**
 * Unified memory system integrating all memory and reasoning components
 */
export class UnifiedMemory {
  private experienceIndexer: ExperienceIndexer;
  private vectorStorage: FileVectorStorage;
  private modelManager: EmbeddingModelManager;
  private reflectionEngine: ReflectionEngine;
  private templateManager: CoTTemplateManager;
  private config: Required<UnifiedMemoryConfig>;

  constructor(config: UnifiedMemoryConfig = {}) {
    this.config = {
      vectorStorageDir: config.vectorStorageDir || '.weaver/vectors',
      embeddingModel: config.embeddingModel || 'all-MiniLM-L6-v2',
      enableReflection: config.enableReflection ?? true,
      experienceRetentionDays: config.experienceRetentionDays || 90,
    };

    this.experienceIndexer = new ExperienceIndexer();
    this.vectorStorage = new FileVectorStorage({ storageDir: this.config.vectorStorageDir });
    this.modelManager = EmbeddingModelManager.getInstance();
    this.reflectionEngine = new ReflectionEngine();
    this.templateManager = new CoTTemplateManager({ autoLoad: true });

    logger.info('Unified memory system initialized');
  }

  /**
   * Store experience and trigger reflection
   */
  async storeExperience(experience: Experience): Promise<void> {
    await this.experienceIndexer.capture(experience);

    if (this.config.enableReflection) {
      const reflection = await this.reflectionEngine.reflectOnExperience(experience);
      logger.debug('Reflection generated', { id: reflection.id, improvements: reflection.improvements.length });
    }
  }

  /**
   * Retrieve relevant context for a task
   */
  async getTaskContext(task: string, domain?: ExperienceDomain): Promise<{
    relevantExperiences: Experience[];
    lessons: string[];
    patterns: string[];
    recommendations: string[];
  }> {
    const relevantResults = await this.experienceIndexer.getRelevant(task, domain);
    const experiences = relevantResults.map(r => r.experience);

    if (experiences.length === 0) {
      return { relevantExperiences: [], lessons: [], patterns: [], recommendations: [] };
    }

    const reflection = await this.reflectionEngine.reflectOnExperiences(experiences);

    return {
      relevantExperiences: experiences.slice(0, 5),
      lessons: experiences.flatMap(exp => exp.lessons).slice(0, 10),
      patterns: reflection.patterns.map(p => p.description),
      recommendations: reflection.improvements.map(imp => imp.description),
    };
  }

  /**
   * Generate reasoning prompt with context
   */
  async generateContextualPrompt(
    templateId: string,
    task: string,
    variables: Record<string, unknown>,
    domain?: ExperienceDomain
  ): Promise<string> {
    const context = await this.getTaskContext(task, domain);

    const enhancedVariables = {
      ...variables,
      task,
      relevantExperiences: context.relevantExperiences.map(exp => ({
        task: exp.task,
        outcome: exp.outcome,
        lessons: exp.lessons,
      })),
      lessons: context.lessons,
      patterns: context.patterns,
      recommendations: context.recommendations,
    };

    const rendered = await this.templateManager.renderTemplate(templateId, enhancedVariables);
    return rendered.fullPrompt;
  }

  /**
   * Perform periodic reflection
   */
  async performPeriodicReflection(domain?: ExperienceDomain): Promise<void> {
    const storage = this.experienceIndexer.getStorage();
    const query = domain ? { domain, limit: 50 } : { limit: 50 };
    const results = await storage.query(query);
    const experiences = results.map(r => r.experience);

    if (experiences.length >= 5) {
      const reflection = await this.reflectionEngine.reflectOnExperiences(experiences);
      logger.info('Periodic reflection complete', {
        experiences: experiences.length,
        patterns: reflection.patterns.length,
        improvements: reflection.improvements.length,
      });
    }
  }

  /**
   * Get memory statistics
   */
  async getStats() {
    const storage = this.experienceIndexer.getStorage();
    const experienceStats = await storage.getStats();
    const vectorStats = await this.vectorStorage.getStats();

    return {
      experiences: experienceStats,
      vectors: vectorStats,
      models: {
        current: this.config.embeddingModel,
        supported: this.modelManager.getSupportedModels(),
      },
    };
  }

  /**
   * Cleanup old data
   */
  async cleanup(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.config.experienceRetentionDays);

    const storage = this.experienceIndexer.getStorage();
    const deleted = await storage.cleanup(cutoff);

    logger.info('Cleanup complete', { deleted, cutoff: cutoff.toISOString() });
  }

  /**
   * Close all resources
   */
  close(): void {
    this.experienceIndexer.close();
  }
}
