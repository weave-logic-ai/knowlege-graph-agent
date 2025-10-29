/**
 * Integration layer between learning loop and markdown workflows
 */

import { v4 as uuidv4 } from 'uuid';
import { workflowEngine } from './workflow-engine.js';
import { templateGenerator } from './template-generator.js';

/**
 * Task interface for learning loop integration
 */
export interface Task {
  description: string;
  priority?: 'low' | 'medium' | 'high';
  dependencies?: string[];
}

export interface StartSessionOptions {
  sopId: string;
  task: Task;
  experiences?: any[];
  vaultNotes?: string[];
  externalKnowledge?: string[];
}

export interface SessionInfo {
  sessionId: string;
  sopId: string;
  taskDescription: string;
  perceptionTemplatePath: string;
  message: string;
}

export class LearningLoopIntegration {
  /**
   * Start a new learning session
   */
  async startSession(options: StartSessionOptions): Promise<SessionInfo> {
    const sessionId = `session-${uuidv4()}`;

    console.log(`[LearningLoop] Starting session ${sessionId} for SOP ${options.sopId}`);

    // Start workflow engine if not running
    const status = workflowEngine.getStatus();
    if (!status.isRunning) {
      console.log('[LearningLoop] Starting workflow engine...');
      await workflowEngine.start();
    }

    // Generate initial perception template
    const perceptionTemplatePath = await templateGenerator.generateTemplate(
      'perception',
      sessionId,
      options.sopId,
      {
        taskDescription: options.task.description,
        experiences: options.experiences || [],
        vaultNotes: options.vaultNotes || [],
        externalKnowledge: options.externalKnowledge || [],
      }
    );

    const sessionInfo: SessionInfo = {
      sessionId,
      sopId: options.sopId,
      taskDescription: options.task.description,
      perceptionTemplatePath,
      message: `Session created successfully. Please review and complete: ${perceptionTemplatePath}`,
    };

    console.log(`[LearningLoop] Session ${sessionId} created. Template: ${perceptionTemplatePath}`);

    return sessionInfo;
  }

  /**
   * Check session status
   */
  async getSessionStatus(sessionId: string): Promise<{
    isActive: boolean;
    currentStage?: string;
  }> {
    const currentStage = workflowEngine.getActiveStage(sessionId);

    return {
      isActive: workflowEngine.isSessionActive(sessionId),
      currentStage,
    };
  }

  /**
   * Get all active sessions
   */
  async getActiveSessions(): Promise<string[]> {
    return workflowEngine.getActiveSessions();
  }

  /**
   * Stop the workflow engine
   */
  async stop(): Promise<void> {
    await workflowEngine.stop();
  }

  /**
   * Get engine status
   */
  getStatus() {
    return workflowEngine.getStatus();
  }
}

/**
 * Singleton instance
 */
export const learningLoopIntegration = new LearningLoopIntegration();

/**
 * Convenience function to start a learning session
 */
export async function startLearningSession(options: StartSessionOptions): Promise<SessionInfo> {
  return learningLoopIntegration.startSession(options);
}
