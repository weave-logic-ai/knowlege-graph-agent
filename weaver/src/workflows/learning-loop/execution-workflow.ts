/**
 * Execution stage workflow
 * Processes execution progress updates and handles blockers
 */

import { BaseWorkflow } from './base-workflow.js';
import type { WorkflowContext, WorkflowResult } from './types.js';

export class ExecutionWorkflow extends BaseWorkflow {
  constructor() {
    super('execution');
  }

  /**
   * Execute execution workflow
   */
  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    this.log(`Executing execution workflow for session ${context.sessionId}`);

    try {
      // Validate context
      this.validateContext(context, ['sessionId', 'sopId', 'userInput.executionProgress']);

      const { userInput, sessionId, sopId, parsedData } = context;
      const progress = userInput.executionProgress!;
      const isFullyComplete = parsedData.frontmatter.progress_percentage === 100;

      // Step 1: Store progress update
      const progressUpdate = {
        sessionId,
        sopId,
        completedTasks: progress.completedTasks,
        progressPercentage: parsedData.frontmatter.progress_percentage || 0,
        activeBlockers: progress.activeBlockers || [],
        discoveries: progress.discoveries || [],
        timestamp: context.timestamp,
        isComplete: isFullyComplete,
      };

      await this.storeInMemory(
        `execution_${sessionId}_${Date.now()}`,
        progressUpdate,
        'weaver_learning/execution'
      );

      this.log(`Progress: ${progressUpdate.progressPercentage}%, ${progress.completedTasks.length} tasks completed`);

      // Step 2: Process active blockers (if any)
      if (progress.activeBlockers && progress.activeBlockers.length > 0) {
        this.log(`Processing ${progress.activeBlockers.length} active blockers`, 'warn');

        for (const blocker of progress.activeBlockers) {
          await this.storeInMemory(
            `blocker_${sessionId}_${Date.now()}`,
            {
              ...blocker,
              sopId,
              sessionId,
            },
            'weaver_learning/blockers'
          );

          // Update learning model - blockers are valuable learning
          if (blocker.status === 'resolved') {
            await this.updateLearningModel({
              operation: `blocker_resolution_${sopId}`,
              outcome: 'success',
              metadata: {
                blocker: blocker.description,
                impact: blocker.impact,
              },
            });
          }
        }
      }

      // Step 3: Process discoveries (positive learnings)
      if (progress.discoveries && progress.discoveries.length > 0) {
        this.log(`Processing ${progress.discoveries.length} discoveries`);

        for (const discovery of progress.discoveries) {
          await this.storeInMemory(
            `discovery_${sessionId}_${Date.now()}`,
            {
              ...discovery,
              sopId,
              sessionId,
            },
            'weaver_learning/discoveries'
          );

          // Positive discoveries train the model
          if (discovery.impact === 'positive') {
            await this.updateLearningModel({
              operation: `discovery_${sopId}`,
              outcome: 'success',
              metadata: {
                discovery: discovery.description,
              },
            });
          }
        }
      }

      // Step 4: Check if execution is complete
      if (isFullyComplete) {
        this.log('Execution complete (100%), proceeding to reflection stage');

        return this.createSuccessResult(
          sessionId,
          'Execution completed successfully',
          'reflection',
          {
            progressUpdate,
            proceedToReflection: true,
          }
        );
      } else {
        // Periodic update - don't trigger next stage yet
        this.log(`Execution in progress (${progressUpdate.progressPercentage}%)`);

        return this.createSuccessResult(
          sessionId,
          'Progress update stored',
          undefined,
          {
            progressUpdate,
            isPeriodicUpdate: true,
          }
        );
      }

    } catch (error) {
      this.log(`Execution workflow failed: ${(error as Error).message}`, 'error');
      return this.createFailureResult(
        context.sessionId,
        error as Error,
        'Failed to process execution stage'
      );
    }
  }
}
