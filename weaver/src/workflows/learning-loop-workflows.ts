/**
 * Learning Loop Workflows
 *
 * Workflow definitions for the learning loop system:
 * - Perception (context validation)
 * - Reasoning (plan selection)
 * - Execution (progress tracking)
 * - Reflection (learning extraction)
 */

import { logger } from '../utils/logger.js';
import type { WorkflowDefinition, WorkflowContext } from '../workflow-engine/index.js';
import { markdownParser } from './learning-loop/markdown-parser.js';
import { PerceptionWorkflow } from './learning-loop/perception-workflow.js';
import { ReasoningWorkflow } from './learning-loop/reasoning-workflow.js';
import { ExecutionWorkflow } from './learning-loop/execution-workflow.js';
import { ReflectionWorkflow } from './learning-loop/reflection-workflow.js';
import { templateGenerator } from './learning-loop/template-generator.js';

/**
 * Perception Stage Workflow
 *
 * Triggered when perception.md status changes to "completed"
 * Validates gathered context and triggers reasoning stage
 */
export const perceptionStageWorkflow: WorkflowDefinition = {
  id: 'learning-loop:perception',
  name: 'Learning Loop - Perception',
  description: 'Processes context validation and triggers reasoning stage',
  triggers: ['file:change'],
  enabled: true,
  fileFilter: '.weaver/learning-sessions/**/perception.md',

  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    try {
      // Parse perception markdown
      const parsed = await markdownParser.parse(fileEvent.absolutePath);

      // Only proceed if completed
      if (!parsed.isComplete) {
        logger.debug('Perception stage not complete yet', {
          file: fileEvent.relativePath,
          status: parsed.frontmatter.status,
        });
        return;
      }

      logger.info('👁️  Starting perception workflow', {
        workflow: 'learning-loop:perception',
        sessionId: parsed.frontmatter.session_id,
        sopId: parsed.frontmatter.sop_id,
      });

      // Extract user input
      const userInput = markdownParser.extractStructuredInput(parsed);

      // Create workflow context
      const workflowContext = {
        sessionId: parsed.frontmatter.session_id,
        sopId: parsed.frontmatter.sop_id,
        stage: 'perception' as const,
        parsedData: parsed,
        userInput,
        timestamp: new Date(),
      };

      // Execute perception workflow
      const perceptionWorkflow = new PerceptionWorkflow();
      const result = await perceptionWorkflow.execute(workflowContext);

      if (result.success) {
        logger.info('✅ Perception workflow completed', {
          workflow: 'learning-loop:perception',
          sessionId: workflowContext.sessionId,
          nextStage: result.nextStage,
        });

        // Generate reasoning template
        if (result.nextStage === 'reasoning') {
          await templateGenerator.generateTemplate(
            'reasoning',
            workflowContext.sessionId,
            workflowContext.sopId,
            result.data
          );
        }
      } else {
        logger.error('Perception workflow failed', result.error, {
          workflow: 'learning-loop:perception',
          sessionId: workflowContext.sessionId,
        });
      }

    } catch (error) {
      logger.error('Perception workflow handler failed', error as Error, {
        workflow: 'learning-loop:perception',
        file: fileEvent.relativePath,
      });
      throw error;
    }
  },
};

/**
 * Reasoning Stage Workflow
 *
 * Triggered when reasoning.md status changes to "completed"
 * Processes plan selection and triggers execution stage
 */
export const reasoningStageWorkflow: WorkflowDefinition = {
  id: 'learning-loop:reasoning',
  name: 'Learning Loop - Reasoning',
  description: 'Processes plan selection and triggers execution stage',
  triggers: ['file:change'],
  enabled: true,
  fileFilter: '.weaver/learning-sessions/**/reasoning.md',

  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    try {
      const parsed = await markdownParser.parse(fileEvent.absolutePath);

      if (!parsed.isComplete) {
        return;
      }

      logger.info('🧠 Starting reasoning workflow', {
        workflow: 'learning-loop:reasoning',
        sessionId: parsed.frontmatter.session_id,
        sopId: parsed.frontmatter.sop_id,
      });

      const userInput = markdownParser.extractStructuredInput(parsed);

      const workflowContext = {
        sessionId: parsed.frontmatter.session_id,
        sopId: parsed.frontmatter.sop_id,
        stage: 'reasoning' as const,
        parsedData: parsed,
        userInput,
        timestamp: new Date(),
      };

      const reasoningWorkflow = new ReasoningWorkflow();
      const result = await reasoningWorkflow.execute(workflowContext);

      if (result.success) {
        logger.info('✅ Reasoning workflow completed', {
          workflow: 'learning-loop:reasoning',
          sessionId: workflowContext.sessionId,
          selectedPlan: result.data?.selectedPlan,
        });

        if (result.nextStage === 'execution') {
          await templateGenerator.generateTemplate(
            'execution',
            workflowContext.sessionId,
            workflowContext.sopId,
            result.data
          );
        }
      }

    } catch (error) {
      logger.error('Reasoning workflow handler failed', error as Error);
      throw error;
    }
  },
};

/**
 * Execution Stage Workflow
 *
 * Triggered when execution.md is updated
 * Tracks progress and triggers reflection when complete
 */
export const executionStageWorkflow: WorkflowDefinition = {
  id: 'learning-loop:execution',
  name: 'Learning Loop - Execution',
  description: 'Tracks execution progress and triggers reflection when complete',
  triggers: ['file:change'],
  enabled: true,
  fileFilter: '.weaver/learning-sessions/**/execution.md',

  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    try {
      const parsed = await markdownParser.parse(fileEvent.absolutePath);

      // Execution workflow runs on any status change (for progress updates)
      logger.debug('⚙️  Execution workflow triggered', {
        workflow: 'learning-loop:execution',
        sessionId: parsed.frontmatter.session_id,
        progress: parsed.frontmatter.progress_percentage,
        status: parsed.frontmatter.status,
      });

      const userInput = markdownParser.extractStructuredInput(parsed);

      const workflowContext = {
        sessionId: parsed.frontmatter.session_id,
        sopId: parsed.frontmatter.sop_id,
        stage: 'execution' as const,
        parsedData: parsed,
        userInput,
        timestamp: new Date(),
      };

      const executionWorkflow = new ExecutionWorkflow();
      const result = await executionWorkflow.execute(workflowContext);

      if (result.success) {
        const isComplete = parsed.frontmatter.progress_percentage === 100 &&
                          parsed.frontmatter.status === 'completed';

        if (isComplete) {
          logger.info('✅ Execution completed', {
            workflow: 'learning-loop:execution',
            sessionId: workflowContext.sessionId,
          });

          if (result.nextStage === 'reflection') {
            await templateGenerator.generateTemplate(
              'reflection',
              workflowContext.sessionId,
              workflowContext.sopId,
              result.data
            );
          }
        } else {
          logger.debug('Progress update recorded', {
            workflow: 'learning-loop:execution',
            sessionId: workflowContext.sessionId,
            progress: parsed.frontmatter.progress_percentage,
          });
        }
      }

    } catch (error) {
      logger.error('Execution workflow handler failed', error as Error);
      throw error;
    }
  },
};

/**
 * Reflection Stage Workflow
 *
 * Triggered when reflection.md status changes to "completed"
 * Extracts learnings and completes the learning loop
 */
export const reflectionStageWorkflow: WorkflowDefinition = {
  id: 'learning-loop:reflection',
  name: 'Learning Loop - Reflection',
  description: 'Extracts learnings and completes the learning loop',
  triggers: ['file:change'],
  enabled: true,
  fileFilter: '.weaver/learning-sessions/**/reflection.md',

  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    try {
      const parsed = await markdownParser.parse(fileEvent.absolutePath);

      if (!parsed.isComplete) {
        return;
      }

      logger.info('🔮 Starting reflection workflow', {
        workflow: 'learning-loop:reflection',
        sessionId: parsed.frontmatter.session_id,
        sopId: parsed.frontmatter.sop_id,
      });

      const userInput = markdownParser.extractStructuredInput(parsed);

      const workflowContext = {
        sessionId: parsed.frontmatter.session_id,
        sopId: parsed.frontmatter.sop_id,
        stage: 'reflection' as const,
        parsedData: parsed,
        userInput,
        timestamp: new Date(),
      };

      const reflectionWorkflow = new ReflectionWorkflow();
      const result = await reflectionWorkflow.execute(workflowContext);

      if (result.success) {
        logger.info('🎓 Learning loop completed!', {
          workflow: 'learning-loop:reflection',
          sessionId: workflowContext.sessionId,
          satisfactionRating: result.data?.learningOutcome?.satisfaction_rating,
        });
      }

    } catch (error) {
      logger.error('Reflection workflow handler failed', error as Error);
      throw error;
    }
  },
};

/**
 * Get all learning loop workflows
 */
export function getLearningLoopWorkflows(): WorkflowDefinition[] {
  return [
    perceptionStageWorkflow,
    reasoningStageWorkflow,
    executionStageWorkflow,
    reflectionStageWorkflow,
  ];
}
