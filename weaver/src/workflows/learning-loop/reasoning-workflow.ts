/**
 * Reasoning stage workflow
 * Processes user's plan selection and A/B testing results
 */

import { BaseWorkflow } from './base-workflow.js';
import type { WorkflowContext, WorkflowResult, PreferenceSignal } from './types.js';

export class ReasoningWorkflow extends BaseWorkflow {
  constructor() {
    super('reasoning');
  }

  /**
   * Execute reasoning workflow
   */
  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    this.log(`Executing reasoning workflow for session ${context.sessionId}`);

    try {
      // Validate context
      this.validateContext(context, ['sessionId', 'sopId', 'userInput.planSelection']);

      const { userInput, sessionId, sopId } = context;
      const planSelection = userInput.planSelection!;

      // Step 1: Extract preference signals from plan selection
      const preferenceSignals = this.extractPreferenceSignals(
        planSelection,
        context
      );

      // Step 2: Store selected plan and reasoning
      const planDecision = {
        sessionId,
        sopId,
        selectedPlan: planSelection.selectedPlan,
        reasoning: planSelection.reasoning,
        modifications: planSelection.modifications || null,
        concerns: planSelection.concerns || null,
        successCriteria: planSelection.successCriteria || null,
        preferenceSignals,
        timestamp: context.timestamp,
      };

      await this.storeInMemory(
        `reasoning_${sessionId}`,
        planDecision,
        'weaver_learning/reasoning'
      );

      this.log(`User selected ${planSelection.selectedPlan} with reasoning: "${planSelection.reasoning?.substring(0, 100)}..."`);

      // Step 3: Update preference learning model
      for (const signal of preferenceSignals) {
        await this.storeInMemory(
          `preference_${signal.category}_${Date.now()}`,
          signal,
          'weaver_learning/preferences'
        );
      }

      // Step 4: Train neural patterns on plan selection
      await this.updateLearningModel({
        operation: `plan_selection_${sopId}_${planSelection.selectedPlan}`,
        outcome: 'success',
        metadata: {
          selectedPlan: planSelection.selectedPlan,
          reasoning: planSelection.reasoning,
          sopId,
          preferenceCount: preferenceSignals.length,
        },
      });

      // Step 5: If user suggested modifications, store for future plan generation
      if (planSelection.modifications) {
        this.log('User suggested modifications to plan');

        await this.storeInMemory(
          `plan_modifications_${sessionId}`,
          {
            plan: planSelection.selectedPlan,
            modifications: planSelection.modifications,
            sopId,
          },
          'weaver_learning/plan_improvements'
        );
      }

      // Step 6: Trigger execution stage
      this.log('Plan selection complete, proceeding to execution stage');

      return this.createSuccessResult(
        sessionId,
        'Reasoning workflow completed successfully',
        'execution',
        {
          selectedPlan: planSelection.selectedPlan,
          preferenceSignals,
          proceedToExecution: true,
        }
      );

    } catch (error) {
      this.log(`Reasoning workflow failed: ${(error as Error).message}`, 'error');
      return this.createFailureResult(
        context.sessionId,
        error as Error,
        'Failed to process reasoning stage'
      );
    }
  }

  /**
   * Extract preference signals from plan selection
   */
  private extractPreferenceSignals(
    planSelection: NonNullable<WorkflowContext['userInput']['planSelection']>,
    context: WorkflowContext
  ): PreferenceSignal[] {
    const signals: PreferenceSignal[] = [];

    // Extract planning style preference from reasoning
    const reasoning = planSelection.reasoning?.toLowerCase() || '';

    if (reasoning.includes('detail') || reasoning.includes('thorough')) {
      signals.push({
        category: 'planning_style',
        value: 'detailed_upfront',
        weight: 0.8,
        timestamp: context.timestamp,
        context: 'Inferred from plan selection reasoning',
      });
    }

    if (reasoning.includes('iterative') || reasoning.includes('explore')) {
      signals.push({
        category: 'planning_style',
        value: 'iterative_exploratory',
        weight: 0.8,
        timestamp: context.timestamp,
        context: 'Inferred from plan selection reasoning',
      });
    }

    // Extract risk tolerance from plan selection
    const selectedPlan = planSelection.selectedPlan.toLowerCase();

    if (selectedPlan.includes('proven') || selectedPlan.includes('stable')) {
      signals.push({
        category: 'risk_tolerance',
        value: 'prefer_proven',
        weight: 0.9,
        timestamp: context.timestamp,
        context: 'Selected proven/stable plan',
      });
    }

    if (selectedPlan.includes('new') || selectedPlan.includes('experimental')) {
      signals.push({
        category: 'risk_tolerance',
        value: 'comfortable_experimental',
        weight: 0.9,
        timestamp: context.timestamp,
        context: 'Selected new/experimental plan',
      });
    }

    // Extract learning preference if mentioned
    if (reasoning.includes('learn') || reasoning.includes('new approach')) {
      signals.push({
        category: 'learning_vs_speed',
        value: 'prioritize_learning',
        weight: 0.7,
        timestamp: context.timestamp,
        context: 'Mentioned learning in reasoning',
      });
    }

    if (reasoning.includes('fast') || reasoning.includes('quick') || reasoning.includes('speed')) {
      signals.push({
        category: 'learning_vs_speed',
        value: 'prioritize_speed',
        weight: 0.7,
        timestamp: context.timestamp,
        context: 'Mentioned speed in reasoning',
      });
    }

    return signals;
  }
}
