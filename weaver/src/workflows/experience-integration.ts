/**
 * Experience Integration for Workflows
 *
 * Provides utilities to capture experiences from workflow execution.
 */

import { ExperienceIndexer } from '../memory/experience-indexer.js';
import type {
  Experience,
  ExperienceDomain,
  ExperienceOutcome,
  ExperienceContext,
} from '../memory/types.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export interface WorkflowExperienceOptions {
  indexer?: ExperienceIndexer;
}

/**
 * Workflow experience capture utilities
 */
export class WorkflowExperience {
  private indexer: ExperienceIndexer;

  constructor(options: WorkflowExperienceOptions = {}) {
    this.indexer = options.indexer || new ExperienceIndexer();
  }

  /**
   * Capture an experience from workflow execution
   */
  async captureExperience(params: {
    task: string;
    domain: ExperienceDomain;
    context: ExperienceContext;
    outcome: ExperienceOutcome;
    success: boolean;
    plan?: string;
    lessons?: string[];
    duration?: number;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const experience: Experience = {
      id: `exp-${uuidv4()}`,
      task: params.task,
      context: params.context,
      plan: params.plan,
      outcome: params.outcome,
      success: params.success,
      lessons: params.lessons || [],
      timestamp: new Date(),
      domain: params.domain,
      duration: params.duration,
      errorMessage: params.errorMessage,
      metadata: params.metadata,
    };

    try {
      await this.indexer.capture(experience);
      logger.info('Workflow experience captured', {
        id: experience.id,
        task: params.task,
        domain: params.domain,
        outcome: params.outcome,
      });
      return experience.id;
    } catch (error) {
      logger.error('Failed to capture workflow experience', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get relevant experiences for a task
   */
  async getRelevantExperiences(
    task: string,
    domain?: ExperienceDomain,
    limit: number = 5
  ) {
    try {
      if (domain) {
        return await this.indexer.getRelevant(task, domain);
      } else {
        return await this.indexer.findSimilar(task, limit);
      }
    } catch (error) {
      logger.error('Failed to get relevant experiences', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Wrap workflow execution with experience capture
   */
  async withExperienceCapture<T>(
    task: string,
    domain: ExperienceDomain,
    workflowFn: () => Promise<T>,
    options?: {
      plan?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<T> {
    const startTime = Date.now();
    const context: ExperienceContext = {
      workflowType: domain,
      inputs: options?.metadata?.inputs as Record<string, unknown>,
      environment: {
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const result = await workflowFn();
      const duration = Date.now() - startTime;

      // Capture successful experience
      await this.captureExperience({
        task,
        domain,
        context: {
          ...context,
          outputs: {
            result,
            duration,
          },
        },
        outcome: 'success',
        success: true,
        plan: options?.plan,
        duration,
        metadata: options?.metadata,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Capture failed experience
      await this.captureExperience({
        task,
        domain,
        context: {
          ...context,
          outputs: {
            error: error instanceof Error ? error.message : String(error),
          },
        },
        outcome: 'error',
        success: false,
        plan: options?.plan,
        duration,
        errorMessage: error instanceof Error ? error.message : String(error),
        metadata: options?.metadata,
      });

      throw error;
    }
  }

  /**
   * Get the indexer instance
   */
  getIndexer(): ExperienceIndexer {
    return this.indexer;
  }

  /**
   * Close the experience integration
   */
  close(): void {
    this.indexer.close();
  }
}

/**
 * Global experience instance for workflows
 */
export const workflowExperience = new WorkflowExperience();
