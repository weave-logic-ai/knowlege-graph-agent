/**
 * Perception stage workflow
 * Processes user validation of gathered context
 */

import { BaseWorkflow } from './base-workflow.js';
import type { WorkflowContext, WorkflowResult } from './types.js';

export class PerceptionWorkflow extends BaseWorkflow {
  constructor() {
    super('perception');
  }

  /**
   * Execute perception workflow
   */
  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    this.log(`Executing perception workflow for session ${context.sessionId}`);

    try {
      // Validate context
      this.validateContext(context, ['sessionId', 'sopId', 'userInput']);

      const { userInput, sessionId, sopId } = context;
      const contextValidation = userInput.contextValidation;

      if (!contextValidation) {
        this.log('No context validation provided by user', 'warn');
      }

      // Step 1: Process user's context validation
      const validatedContext = {
        sessionId,
        sopId,
        missingContext: contextValidation?.missingContext || null,
        additionalSources: contextValidation?.additionalSources || [],
        priorities: contextValidation?.priorities || [],
        timestamp: context.timestamp,
      };

      // Step 2: Store validated context in memory
      await this.storeInMemory(
        `perception_${sessionId}`,
        validatedContext,
        'weaver_learning/perception'
      );

      // Step 3: If user added missing context, note it for future improvements
      if (contextValidation?.missingContext) {
        this.log('User identified missing context - updating perception patterns');

        await this.updateLearningModel({
          operation: `perception_missing_context_${sopId}`,
          outcome: 'success',
          metadata: {
            missingContext: contextValidation.missingContext,
            sopId,
          },
        });
      }

      // Step 4: Store additional sources for future reference
      if (contextValidation?.additionalSources && contextValidation.additionalSources.length > 0) {
        this.log(`User added ${contextValidation.additionalSources.length} additional sources`);

        await this.storeInMemory(
          `additional_sources_${sessionId}`,
          contextValidation.additionalSources,
          'weaver_learning/sources'
        );
      }

      // Step 5: Trigger reasoning stage
      this.log('Context validation complete, proceeding to reasoning stage');

      return this.createSuccessResult(
        sessionId,
        'Perception workflow completed successfully',
        'reasoning',
        {
          validatedContext,
          proceedToReasoning: true,
        }
      );

    } catch (error) {
      this.log(`Perception workflow failed: ${(error as Error).message}`, 'error');
      return this.createFailureResult(
        context.sessionId,
        error as Error,
        'Failed to process perception stage'
      );
    }
  }
}
