/**
 * Reflection stage workflow
 * Processes user reflection and completes the learning loop
 */

import { BaseWorkflow } from './base-workflow.js';
import type { WorkflowContext, WorkflowResult, LearningOutcome, PreferenceSignal } from './types.js';

export class ReflectionWorkflow extends BaseWorkflow {
  constructor() {
    super('reflection');
  }

  /**
   * Execute reflection workflow
   */
  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    this.log(`Executing reflection workflow for session ${context.sessionId}`);

    try {
      // Validate context
      this.validateContext(context, ['sessionId', 'sopId', 'userInput.reflection']);

      const { userInput, sessionId, sopId, parsedData } = context;
      const reflection = userInput.reflection!;

      // Step 1: Extract preference signals
      const preferenceSignals = this.extractPreferenceSignals(reflection, context);

      this.log(`Extracted ${preferenceSignals.length} preference signals from reflection`);

      // Step 2: Create comprehensive learning outcome
      const learningOutcome: LearningOutcome = {
        session_id: sessionId,
        sop_id: sopId,
        task_description: parsedData.frontmatter.task_description || 'Unknown task',
        selected_plan: parsedData.frontmatter.selected_plan || 'Unknown plan',
        satisfaction_rating: reflection.satisfactionRating,
        success: reflection.satisfactionRating >= 3,
        what_worked: this.parseListItems(reflection.whatWorkedWell),
        what_didnt_work: this.parseListItems(reflection.whatDidntWork),
        improvements: this.parseListItems(reflection.improvements),
        preference_signals: preferenceSignals,
        execution_duration: parsedData.frontmatter.execution_duration || 'Unknown',
        timestamp: context.timestamp,
      };

      // Step 3: Store complete learning outcome
      await this.storeInMemory(
        `learning_outcome_${sessionId}`,
        learningOutcome,
        'weaver_learning/outcomes'
      );

      this.log(`Stored learning outcome with ${reflection.satisfactionRating}/5 rating`);

      // Step 4: Store all preference signals
      for (const signal of preferenceSignals) {
        await this.storeInMemory(
          `preference_${signal.category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          signal,
          'weaver_learning/preferences'
        );
      }

      // Step 5: Train neural patterns with outcome
      await this.updateLearningModel({
        operation: `task_completion_${sopId}`,
        outcome: learningOutcome.success ? 'success' : 'failure',
        metadata: {
          satisfactionRating: reflection.satisfactionRating,
          plan: parsedData.frontmatter.selected_plan,
          improvements: learningOutcome.improvements.length,
          preferenceSignals: preferenceSignals.length,
        },
      });

      // Step 6: If user provided improvements, store for future use
      if (learningOutcome.improvements.length > 0) {
        this.log(`User suggested ${learningOutcome.improvements.length} improvements`);

        await this.storeInMemory(
          `improvements_${sopId}_${Date.now()}`,
          {
            sopId,
            improvements: learningOutcome.improvements,
            context: parsedData.frontmatter.task_description,
          },
          'weaver_learning/improvements'
        );
      }

      // Step 7: Update success patterns for the selected plan
      if (learningOutcome.success) {
        await this.updateLearningModel({
          operation: `successful_plan_${parsedData.frontmatter.selected_plan}`,
          outcome: 'success',
          metadata: {
            sopId,
            rating: reflection.satisfactionRating,
          },
        });
      }

      // Step 8: Archive session (mark as complete)
      await this.archiveSession(sessionId);

      this.log('Learning loop complete! Session archived.');

      return this.createSuccessResult(
        sessionId,
        'Reflection workflow completed successfully - learning loop finished',
        undefined,
        {
          learningOutcome,
          preferenceSignals,
          sessionArchived: true,
        }
      );

    } catch (error) {
      this.log(`Reflection workflow failed: ${(error as Error).message}`, 'error');
      return this.createFailureResult(
        context.sessionId,
        error as Error,
        'Failed to process reflection stage'
      );
    }
  }

  /**
   * Extract preference signals from reflection
   */
  private extractPreferenceSignals(
    reflection: NonNullable<WorkflowContext['userInput']['reflection']>,
    context: WorkflowContext
  ): PreferenceSignal[] {
    const signals: PreferenceSignal[] = [];

    // Extract from explicit preferences checkboxes
    if (reflection.preferences) {
      // Planning style
      if (reflection.preferences.planningStyle && reflection.preferences.planningStyle.length > 0) {
        for (const style of reflection.preferences.planningStyle) {
          signals.push({
            category: 'planning_style',
            value: style,
            weight: 1.0, // Explicit preference = full weight
            timestamp: context.timestamp,
            context: 'User-selected preference',
          });
        }
      }

      // Risk tolerance
      if (reflection.preferences.riskTolerance && reflection.preferences.riskTolerance.length > 0) {
        for (const risk of reflection.preferences.riskTolerance) {
          signals.push({
            category: 'risk_tolerance',
            value: risk,
            weight: 1.0,
            timestamp: context.timestamp,
            context: 'User-selected preference',
          });
        }
      }

      // Learning vs speed
      if (reflection.preferences.learningVsSpeed && reflection.preferences.learningVsSpeed.length > 0) {
        for (const pref of reflection.preferences.learningVsSpeed) {
          signals.push({
            category: 'learning_vs_speed',
            value: pref,
            weight: 1.0,
            timestamp: context.timestamp,
            context: 'User-selected preference',
          });
        }
      }

      // Tool preferences
      if (reflection.preferences.toolPreferences && reflection.preferences.toolPreferences.length > 0) {
        for (const tool of reflection.preferences.toolPreferences) {
          signals.push({
            category: 'tool_preference',
            value: tool,
            weight: 1.0,
            timestamp: context.timestamp,
            context: 'User-selected preference',
          });
        }
      }
    }

    // Infer from satisfaction rating
    if (reflection.satisfactionRating >= 4) {
      signals.push({
        category: 'other',
        value: `sop_${context.sopId}_effective`,
        weight: reflection.satisfactionRating / 5.0,
        timestamp: context.timestamp,
        context: `High satisfaction with ${context.sopId}`,
      });
    }

    // Infer from "would use again"
    if (reflection.wouldUseAgain) {
      const wouldUse = reflection.wouldUseAgain.toLowerCase();

      if (wouldUse.includes('yes, definitely')) {
        signals.push({
          category: 'other',
          value: 'approach_highly_preferred',
          weight: 1.0,
          timestamp: context.timestamp,
          context: 'Would definitely use again',
        });
      } else if (wouldUse.includes('yes, with modifications')) {
        signals.push({
          category: 'other',
          value: 'approach_preferred_with_tweaks',
          weight: 0.7,
          timestamp: context.timestamp,
          context: 'Would use with modifications',
        });
      }
    }

    return signals;
  }

  /**
   * Parse list items from text
   */
  private parseListItems(text: string): string[] {
    if (!text) return [];

    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => line.replace(/^[-*•]\s*/, '')) // Remove bullet points
      .filter(line => !line.startsWith('[') && !line.endsWith(']')); // Remove placeholders
  }

  /**
   * Archive session
   */
  private async archiveSession(sessionId: string): Promise<void> {
    await this.storeInMemory(
      `session_${sessionId}`,
      {
        sessionId,
        status: 'archived',
        archivedAt: new Date().toISOString(),
      },
      'weaver_learning/sessions'
    );
  }
}
