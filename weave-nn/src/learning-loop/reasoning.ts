/**
 * Reasoning System
 * Generates and selects optimal plans using multi-path reasoning
 */

import type {
  Context,
  Plan,
  Step,
  ReasoningInput,
  ReasoningOutput,
  PlanEvaluation,
  ReasoningStep,
  ReasoningError,
} from './types';

interface ClaudeFlowClient {
  parallel_execute: (params: any) => Promise<any[]>;
  agent_spawn: (params: any) => Promise<any>;
}

interface ClaudeClient {
  sendMessage: (params: any) => Promise<any>;
}

/**
 * Reasoning System
 * Implements Chain-of-Thought and multi-path plan generation
 */
export class ReasoningSystem {
  constructor(
    private claudeFlow: ClaudeFlowClient,
    private claudeClient: ClaudeClient
  ) {}

  /**
   * Main reasoning method - generates and selects best plan
   */
  async reason(input: ReasoningInput): Promise<ReasoningOutput> {
    const { context, generateAlternatives = true, maxAlternatives = 3 } = input;

    try {
      // Generate multiple alternative plans in parallel
      const plans = generateAlternatives
        ? await this.generateMultiplePlans(context, maxAlternatives)
        : [await this.generateSinglePlan(context)];

      // Evaluate each plan based on context and past experiences
      const evaluations = await this.evaluatePlans(plans, context);

      // Select best plan using voting/scoring
      const selectedPlan = this.selectBestPlan(plans, evaluations);

      // Generate reasoning path for transparency
      const reasoningPath = this.buildReasoningPath(context, plans, evaluations, selectedPlan);

      // Calculate confidence in selected plan
      const confidence = this.calculateConfidence(selectedPlan, evaluations, context);

      return {
        selectedPlan,
        alternativePlans: plans.filter((p) => p.id !== selectedPlan.id),
        reasoningPath,
        confidence,
      };
    } catch (error) {
      throw new (ReasoningError as any)(
        `Failed to generate reasoning for task: ${error.message}`,
        { context, error }
      );
    }
  }

  /**
   * Generate multiple alternative plans using parallel execution
   */
  private async generateMultiplePlans(context: Context, count: number): Promise<Plan[]> {
    try {
      // Use Claude-Flow parallel execution to generate plans concurrently
      const planningTasks = Array.from({ length: count }, (_, i) => ({
        prompt: this.buildPlanningPrompt(context, i),
        strategy: this.getReasoningStrategy(i),
      }));

      const results = await this.claudeFlow.parallel_execute({
        tasks: planningTasks,
      });

      // Parse and validate plans
      return results
        .map((r, i) => this.parsePlan(r, context.task.id, i))
        .filter((p): p is Plan => p !== null);
    } catch (error) {
      console.warn(`Multi-plan generation failed: ${error.message}`);
      // Fallback to single plan
      return [await this.generateSinglePlan(context)];
    }
  }

  /**
   * Generate single plan using Chain-of-Thought reasoning
   */
  private async generateSinglePlan(context: Context): Promise<Plan> {
    const prompt = this.buildChainOfThoughtPrompt(context);

    const response = await this.claudeClient.sendMessage({
      messages: [{ role: 'user', content: prompt }],
    });

    return this.parsePlan(response, context.task.id, 0);
  }

  /**
   * Build Chain-of-Thought prompt for transparent reasoning
   */
  private buildChainOfThoughtPrompt(context: Context): string {
    const { task, pastExperiences, relatedNotes } = context;

    let prompt = `# Chain-of-Thought Planning

## Task
${task.description}
Domain: ${task.domain || 'general'}
Priority: ${task.priority || 'medium'}

## Context

### Past Experiences (${pastExperiences.length} relevant)
${pastExperiences.slice(0, 3).map((exp, i) => `
${i + 1}. ${exp.task.description}
   - Success: ${exp.success ? '✓' : '✗'}
   - Key Lessons: ${exp.lessons.map((l) => l.description).join('; ')}
`).join('')}

### Related Knowledge (${relatedNotes.length} notes)
${relatedNotes.slice(0, 3).map((note, i) => `
${i + 1}. ${note.path}
   - Tags: ${note.tags.join(', ')}
   - Links: ${note.links.length} connections
`).join('')}

## Instructions

Think step-by-step to create an optimal plan:

1. **Analyze** the task requirements
2. **Consider** past experiences - what worked? what failed?
3. **Decompose** into concrete steps
4. **Estimate** effort and confidence
5. **Explain** your reasoning

Output the plan as JSON:
{
  "rationale": "Why this approach...",
  "steps": [
    {
      "name": "Step name",
      "action": "What to do",
      "params": {},
      "expectedOutcome": "What should happen"
    }
  ],
  "estimatedEffort": 60,
  "confidence": 0.85
}`;

    return prompt;
  }

  /**
   * Build planning prompt for specific reasoning strategy
   */
  private buildPlanningPrompt(context: Context, variant: number): string {
    const strategies = [
      'Chain-of-Thought: Think step-by-step to decompose the task',
      'Experience-Based: Leverage past successes and avoid past failures',
      'Risk-Minimization: Focus on robust, low-risk approach',
      'Optimization: Prioritize efficiency and speed',
    ];

    const strategy = strategies[variant % strategies.length];

    return `${this.buildChainOfThoughtPrompt(context)}

**Strategy for this plan**: ${strategy}`;
  }

  /**
   * Get reasoning strategy label
   */
  private getReasoningStrategy(index: number): string {
    const strategies = ['chain-of-thought', 'experience-based', 'risk-minimization', 'optimization'];
    return strategies[index % strategies.length];
  }

  /**
   * Parse plan from LLM response
   */
  private parsePlan(response: any, taskId: string, variant: number): Plan | null {
    try {
      // Extract JSON from response
      const content = response.content || response.text || JSON.stringify(response);
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const planData = JSON.parse(jsonMatch[0]);

      // Validate and structure plan
      return {
        id: `plan_${taskId}_${variant}_${Date.now()}`,
        taskId,
        steps: planData.steps.map((s: any, i: number) => ({
          id: `step_${i}`,
          name: s.name,
          action: s.action,
          params: s.params || {},
          expectedOutcome: s.expectedOutcome,
          order: i,
        })),
        estimatedEffort: planData.estimatedEffort || 60,
        confidence: planData.confidence || 0.5,
        rationale: planData.rationale || 'No rationale provided',
        createdAt: Date.now(),
      };
    } catch (error) {
      console.warn(`Failed to parse plan: ${error.message}`);
      return null;
    }
  }

  /**
   * Evaluate plans based on context and past experiences
   */
  private async evaluatePlans(plans: Plan[], context: Context): Promise<PlanEvaluation[]> {
    return plans.map((plan) => {
      const score = this.scorePlan(plan, context);
      const { strengths, weaknesses } = this.analyzePlan(plan, context);
      const riskLevel = this.assessRisk(plan, context);

      return {
        plan,
        score,
        strengths,
        weaknesses,
        riskLevel,
      };
    });
  }

  /**
   * Score plan based on multiple factors
   */
  private scorePlan(plan: Plan, context: Context): number {
    let score = 0;

    // Base confidence from plan generation
    score += plan.confidence * 0.4;

    // Experience-based scoring
    const expScore = this.scoreAgainstExperiences(plan, context.pastExperiences);
    score += expScore * 0.3;

    // Complexity penalty
    const complexityScore = 1 - Math.min(plan.steps.length / 20, 0.5);
    score += complexityScore * 0.15;

    // Effort score (prefer reasonable effort)
    const effortScore = 1 - Math.min(plan.estimatedEffort / 240, 0.3); // 4 hours baseline
    score += effortScore * 0.15;

    return Math.min(score, 1.0);
  }

  /**
   * Score plan against past experiences
   */
  private scoreAgainstExperiences(plan: Plan, experiences: any[]): number {
    if (experiences.length === 0) return 0.5;

    // Find similar past experiences
    const similarExperiences = experiences.filter((exp) => {
      // Check if past plan has similar steps
      const planStepNames = new Set(plan.steps.map((s) => s.name.toLowerCase()));
      const expStepNames = new Set(exp.plan?.steps?.map((s: any) => s.name.toLowerCase()) || []);

      const overlap = [...planStepNames].filter((name) => expStepNames.has(name)).length;
      return overlap >= Math.min(planStepNames.size, expStepNames.size) * 0.3;
    });

    if (similarExperiences.length === 0) return 0.5;

    // Calculate success rate
    const successCount = similarExperiences.filter((exp) => exp.success).length;
    return successCount / similarExperiences.length;
  }

  /**
   * Analyze plan strengths and weaknesses
   */
  private analyzePlan(plan: Plan, context: Context): { strengths: string[]; weaknesses: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Check against past experiences
    if (context.pastExperiences.some((exp) => exp.success)) {
      strengths.push('Informed by past successful experiences');
    }

    // Clear decomposition
    if (plan.steps.length >= 3 && plan.steps.length <= 10) {
      strengths.push('Well-decomposed into manageable steps');
    } else if (plan.steps.length > 15) {
      weaknesses.push('High complexity with many steps');
    }

    // Confidence level
    if (plan.confidence >= 0.8) {
      strengths.push('High confidence in approach');
    } else if (plan.confidence < 0.5) {
      weaknesses.push('Low confidence in approach');
    }

    // Effort estimate
    if (plan.estimatedEffort <= 120) {
      strengths.push('Reasonable time investment');
    } else if (plan.estimatedEffort > 480) {
      weaknesses.push('Very high effort required');
    }

    return { strengths, weaknesses };
  }

  /**
   * Assess risk level of plan
   */
  private assessRisk(plan: Plan, context: Context): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Complexity risk
    if (plan.steps.length > 15) riskScore += 0.3;
    else if (plan.steps.length > 10) riskScore += 0.15;

    // Confidence risk
    if (plan.confidence < 0.5) riskScore += 0.3;
    else if (plan.confidence < 0.7) riskScore += 0.15;

    // Experience risk (lack of similar past experiences)
    const similarExperiences = context.pastExperiences.filter((exp) =>
      exp.task.description.toLowerCase().includes(context.task.description.toLowerCase().split(' ')[0])
    );
    if (similarExperiences.length === 0) riskScore += 0.2;

    // Effort risk
    if (plan.estimatedEffort > 480) riskScore += 0.2;

    if (riskScore >= 0.6) return 'high';
    if (riskScore >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Select best plan using scoring and voting
   */
  private selectBestPlan(plans: Plan[], evaluations: PlanEvaluation[]): Plan {
    if (plans.length === 1) return plans[0];

    // Sort by score
    const sorted = evaluations.sort((a, b) => b.score - a.score);

    // Return highest scoring plan
    return sorted[0].plan;
  }

  /**
   * Build transparent reasoning path
   */
  private buildReasoningPath(
    context: Context,
    plans: Plan[],
    evaluations: PlanEvaluation[],
    selected: Plan
  ): ReasoningStep[] {
    const steps: ReasoningStep[] = [];

    // Step 1: Context analysis
    steps.push({
      step: 1,
      thought: 'Analyzed task context and gathered relevant information',
      evidence: [
        `Found ${context.pastExperiences.length} relevant past experiences`,
        `Retrieved ${context.relatedNotes.length} related notes from vault`,
        context.externalKnowledge ? `Gathered ${context.externalKnowledge.length} external sources` : '',
      ].filter(Boolean),
      decision: 'Proceed with informed planning',
    });

    // Step 2: Plan generation
    steps.push({
      step: 2,
      thought: `Generated ${plans.length} alternative plan(s) using different reasoning strategies`,
      evidence: plans.map((p, i) => `Plan ${i + 1}: ${p.steps.length} steps, confidence: ${p.confidence}`),
      decision: `Created ${plans.length} plan alternatives for evaluation`,
    });

    // Step 3: Plan evaluation
    const selectedEval = evaluations.find((e) => e.plan.id === selected.id)!;
    steps.push({
      step: 3,
      thought: 'Evaluated plans based on past experiences, complexity, and confidence',
      evidence: [
        `Selected plan scored ${selectedEval.score.toFixed(2)}`,
        `Strengths: ${selectedEval.strengths.join(', ')}`,
        selectedEval.weaknesses.length > 0 ? `Weaknesses: ${selectedEval.weaknesses.join(', ')}` : '',
      ].filter(Boolean),
      decision: `Selected Plan (${selected.id}) as optimal approach`,
    });

    // Step 4: Risk assessment
    steps.push({
      step: 4,
      thought: 'Assessed risk level and prepared for execution',
      evidence: [
        `Risk level: ${selectedEval.riskLevel}`,
        `Estimated effort: ${selected.estimatedEffort} minutes`,
        `Plan confidence: ${selected.confidence}`,
      ],
      decision: `Proceed with ${selectedEval.riskLevel} risk execution`,
    });

    return steps;
  }

  /**
   * Calculate overall confidence in selected plan
   */
  private calculateConfidence(plan: Plan, evaluations: PlanEvaluation[], context: Context): number {
    const eval = evaluations.find((e) => e.plan.id === plan.id);
    if (!eval) return plan.confidence;

    // Weighted confidence calculation
    const planConfidence = plan.confidence * 0.4;
    const scoreConfidence = eval.score * 0.3;
    const experienceConfidence = context.pastExperiences.length > 0 ? 0.2 : 0.1;
    const riskAdjustment = eval.riskLevel === 'low' ? 0.1 : eval.riskLevel === 'medium' ? 0.05 : 0;

    return Math.min(planConfidence + scoreConfidence + experienceConfidence + riskAdjustment, 1.0);
  }
}
