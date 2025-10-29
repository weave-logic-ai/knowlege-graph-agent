/**
 * Base workflow class for all learning loop workflows
 */

import type { WorkflowContext, WorkflowResult, WorkflowStage } from './types.js';
import { claudeFlowCLI } from '../../claude-flow/index.js';

export abstract class BaseWorkflow {
  protected stage: WorkflowStage;

  constructor(stage: WorkflowStage) {
    this.stage = stage;
  }

  /**
   * Execute the workflow
   * Must be implemented by subclasses
   */
  abstract execute(context: WorkflowContext): Promise<WorkflowResult>;

  /**
   * Store data in Claude Flow memory
   */
  protected async storeInMemory(
    key: string,
    value: any,
    namespace: string = 'weaver_learning'
  ): Promise<void> {
    try {
      await claudeFlowCLI.memoryStore(
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
        namespace
      );
      console.log(`[${this.stage}] Stored in memory: ${namespace}/${key}`);
    } catch (error) {
      console.error(`[${this.stage}] Failed to store in memory:`, error);
      throw error;
    }
  }

  /**
   * Retrieve data from Claude Flow memory
   */
  protected async retrieveFromMemory(
    key: string,
    namespace: string = 'weaver_learning'
  ): Promise<any> {
    try {
      const result = await claudeFlowCLI.memoryRetrieve(key, namespace);
      return result;
    } catch (error) {
      console.error(`[${this.stage}] Failed to retrieve from memory:`, error);
      return null;
    }
  }

  /**
   * Search memory
   */
  protected async searchMemory(
    pattern: string,
    namespace: string = 'weaver_learning'
  ): Promise<any[]> {
    try {
      const result = await claudeFlowCLI.memorySearch(pattern, namespace);
      return result;
    } catch (error) {
      console.error(`[${this.stage}] Failed to search memory:`, error);
      return [];
    }
  }

  /**
   * Update learning model based on feedback
   */
  protected async updateLearningModel(data: {
    operation: string;
    outcome: 'success' | 'failure';
    metadata?: any;
  }): Promise<void> {
    try {
      // Check if neuralPatterns method exists
      if ('neuralPatterns' in claudeFlowCLI && typeof (claudeFlowCLI as any).neuralPatterns === 'function') {
        await (claudeFlowCLI as any).neuralPatterns({
          action: 'learn',
          operation: data.operation,
          outcome: data.outcome,
          metadata: data.metadata,
        });
        console.log(`[${this.stage}] Updated learning model: ${data.operation} → ${data.outcome}`);
      } else {
        console.warn(`[${this.stage}] neuralPatterns not available in ClaudeFlowCLI`);
      }
    } catch (error) {
      console.error(`[${this.stage}] Failed to update learning model:`, error);
    }
  }

  /**
   * Generate next stage template
   */
  protected async triggerNextStage(
    sessionId: string,
    nextStage: WorkflowStage,
    templateData: any
  ): Promise<void> {
    console.log(`[${this.stage}] Triggering next stage: ${nextStage} for session ${sessionId}`);
    // This will be implemented by the template generator
    // For now, just emit an event or call a service
  }

  /**
   * Create success result
   */
  protected createSuccessResult(
    sessionId: string,
    message?: string,
    nextStage?: WorkflowStage,
    data?: any
  ): WorkflowResult {
    return {
      success: true,
      stage: this.stage,
      sessionId,
      nextStage,
      message,
      data,
    };
  }

  /**
   * Create failure result
   */
  protected createFailureResult(
    sessionId: string,
    error: Error,
    message?: string
  ): WorkflowResult {
    return {
      success: false,
      stage: this.stage,
      sessionId,
      error,
      message,
    };
  }

  /**
   * Log workflow step
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const prefix = `[${this.stage.toUpperCase()}]`;
    switch (level) {
      case 'info':
        console.log(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'error':
        console.error(prefix, message);
        break;
    }
  }

  /**
   * Validate context has required data
   */
  protected validateContext(context: WorkflowContext, requiredFields: string[]): void {
    const missing: string[] = [];

    for (const field of requiredFields) {
      const keys = field.split('.');
      let value: any = context;

      for (const key of keys) {
        value = value?.[key];
        if (value === undefined) {
          missing.push(field);
          break;
        }
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required context fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Get stage name
   */
  getStage(): WorkflowStage {
    return this.stage;
  }
}
