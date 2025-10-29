/**
 * Autonomous Learning Loop
 * Main orchestrator that connects all 4 pillars
 *
 * Flow: Perception → Reasoning → Memory → Execution → Reflection → Memory
 */

import { PerceptionSystem } from './perception';
import { ReasoningSystem } from './reasoning';
import { MemorySystem } from './memory';
import { ExecutionSystem } from './execution';
import { ReflectionSystem } from './reflection';

import type {
  Task,
  Outcome,
  Experience,
  LearningLoopConfig,
  LearningReport,
  IterationResult,
  LearningMetrics,
} from './types';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Autonomous Learning Loop
 * Implements the complete 4-pillar autonomous agent framework
 */
export class AutonomousLearningLoop {
  private perception: PerceptionSystem;
  private reasoning: ReasoningSystem;
  private memory: MemorySystem;
  private execution: ExecutionSystem;
  private reflection: ReflectionSystem;
  private config: LearningLoopConfig;

  constructor(
    claudeFlowClient: any,
    claudeClient: any,
    shadowCache?: any,
    workflowEngine?: any,
    webFetch?: any,
    config?: Partial<LearningLoopConfig>
  ) {
    // Initialize all 4 pillars + reflection
    this.perception = new PerceptionSystem(claudeFlowClient, shadowCache, webFetch);
    this.reasoning = new ReasoningSystem(claudeFlowClient, claudeClient);
    this.memory = new MemorySystem(claudeFlowClient, shadowCache);
    this.execution = new ExecutionSystem(claudeFlowClient, workflowEngine);
    this.reflection = new ReflectionSystem(claudeFlowClient, claudeClient);

    // Merge config with defaults
    this.config = {
      // Perception defaults
      maxExperiencesPerQuery: 10,
      maxNotesPerQuery: 20,
      enableExternalKnowledge: false,
      semanticSearchThreshold: 0.7,

      // Reasoning defaults
      generateAlternativePlans: true,
      maxAlternativePlans: 3,
      minPlanConfidence: 0.5,

      // Memory defaults
      experienceRetentionDays: 30,
      memoryNamespace: 'weaver_experiences',
      enableCompression: true,

      // Execution defaults
      enableMonitoring: true,
      maxRetries: 3,
      timeoutMs: 300000, // 5 minutes

      // Reflection defaults
      enablePatternAnalysis: true,
      minLessonImpact: 'medium',

      ...config,
    };
  }

  /**
   * Execute a task autonomously with full learning loop
   */
  async execute(task: Task): Promise<Outcome> {
    const startTime = Date.now();
    const executionId = generateId();

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 AUTONOMOUS LEARNING LOOP - Execution ${executionId}`);
    console.log(`Task: ${task.description}`);
    console.log(`Domain: ${task.domain || 'general'}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // STAGE 1: PERCEPTION - Gather context from all sources
      console.log('📡 STAGE 1: PERCEPTION');
      const perceptionResult = await this.perception.perceive({
        task,
        maxExperiences: this.config.maxExperiencesPerQuery,
        maxNotes: this.config.maxNotesPerQuery,
        includeExternalKnowledge: this.config.enableExternalKnowledge,
      });

      const { context, confidence: perceptionConfidence, sources } = perceptionResult;

      console.log(`  ✓ Context gathered (confidence: ${(perceptionConfidence * 100).toFixed(1)}%)`);
      sources.forEach((src) => {
        console.log(`    - ${src.type}: ${src.count} items (quality: ${(src.quality * 100).toFixed(0)}%)`);
      });

      // STAGE 2: REASONING - Generate and select best plan
      console.log('\n🧠 STAGE 2: REASONING');
      const reasoningResult = await this.reasoning.reason({
        context,
        generateAlternatives: this.config.generateAlternativePlans,
        maxAlternatives: this.config.maxAlternativePlans,
      });

      const { selectedPlan, alternativePlans, reasoningPath, confidence: reasoningConfidence } = reasoningResult;

      console.log(`  ✓ Generated ${alternativePlans.length + 1} plan(s)`);
      console.log(`  ✓ Selected best plan (confidence: ${(reasoningConfidence * 100).toFixed(1)}%)`);
      console.log(`    - Steps: ${selectedPlan.steps.length}`);
      console.log(`    - Estimated effort: ${selectedPlan.estimatedEffort} min`);
      console.log(`    - Rationale: ${selectedPlan.rationale.substring(0, 80)}...`);

      // Show reasoning path for transparency
      console.log(`\n  📋 Reasoning Path:`);
      reasoningPath.forEach((step) => {
        console.log(`    ${step.step}. ${step.thought}`);
        console.log(`       → Decision: ${step.decision}`);
      });

      // STAGE 3: EXECUTION - Execute the plan
      console.log('\n⚡ STAGE 3: EXECUTION');
      const outcome = await this.execution.execute({
        plan: selectedPlan,
        monitoring: this.config.enableMonitoring,
        retryOnFailure: this.config.maxRetries > 0,
      });

      console.log(`  ${outcome.success ? '✓' : '✗'} Execution ${outcome.success ? 'succeeded' : 'failed'}`);
      console.log(`    - Duration: ${(outcome.duration / 1000).toFixed(2)}s`);
      console.log(`    - Steps completed: ${outcome.metrics.stepsCompleted}/${outcome.metrics.stepsTotal}`);
      console.log(`    - Success rate: ${(outcome.metrics.successRate * 100).toFixed(0)}%`);

      if (!outcome.success && outcome.error) {
        console.log(`    - Error: ${outcome.error.message}`);
      }

      // STAGE 4: REFLECTION - Learn from what happened
      console.log('\n🔍 STAGE 4: REFLECTION');
      const reflectionResult = await this.reflection.reflect({
        execution: {
          task,
          context,
          plan: selectedPlan,
          outcome,
          success: outcome.success,
          logs: outcome.logs,
        },
        includePatternAnalysis: this.config.enablePatternAnalysis,
      });

      const { lessons, recommendations, confidence: reflectionConfidence } = reflectionResult;

      console.log(`  ✓ Extracted ${lessons.length} lesson(s) (confidence: ${(reflectionConfidence * 100).toFixed(1)}%)`);

      const highImpactLessons = lessons.filter((l) => l.impact === 'high');
      if (highImpactLessons.length > 0) {
        console.log(`\n  💡 Key Lessons:`);
        highImpactLessons.slice(0, 3).forEach((lesson, i) => {
          console.log(`    ${i + 1}. [${lesson.type.toUpperCase()}] ${lesson.description}`);
        });
      }

      if (recommendations.length > 0) {
        console.log(`\n  📝 Recommendations:`);
        recommendations.slice(0, 3).forEach((rec, i) => {
          console.log(`    ${i + 1}. [${rec.priority}] ${rec.description}`);
        });
      }

      // STAGE 5: MEMORY - Store the complete experience
      console.log('\n💾 STAGE 5: MEMORY');
      const experience: Experience = {
        id: executionId,
        task,
        context,
        plan: selectedPlan,
        outcome,
        success: outcome.success,
        lessons,
        timestamp: Date.now(),
        domain: task.domain || 'general',
      };

      await this.memory.memorize(experience);

      console.log(`  ✓ Experience stored: ${executionId}`);
      console.log(`    - Lessons: ${lessons.length}`);
      console.log(`    - Domain: ${experience.domain}`);

      // Summary
      const totalDuration = Date.now() - startTime;
      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ LEARNING LOOP COMPLETE`);
      console.log(`Total time: ${(totalDuration / 1000).toFixed(2)}s`);
      console.log(`Result: ${outcome.success ? 'SUCCESS ✓' : 'FAILURE ✗'}`);
      console.log(`${'='.repeat(60)}\n`);

      return outcome;
    } catch (error) {
      // Even failures are learning opportunities
      console.error(`\n❌ Learning loop failed: ${error.message}\n`);

      await this.handleFailure(task, error);
      throw error;
    }
  }

  /**
   * Demonstrate autonomous improvement over multiple iterations
   */
  async demonstrateLearning(task: Task, iterations: number = 5): Promise<LearningReport> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 AUTONOMOUS LEARNING DEMONSTRATION`);
    console.log(`Task: ${task.description}`);
    console.log(`Iterations: ${iterations}`);
    console.log(`${'='.repeat(60)}\n`);

    const results: IterationResult[] = [];
    const keyLearnings: string[] = [];

    for (let i = 0; i < iterations; i++) {
      console.log(`\n📊 Iteration ${i + 1}/${iterations}`);
      console.log(`${'─'.repeat(60)}\n`);

      try {
        const outcome = await this.execute(task);

        const result: IterationResult = {
          iteration: i + 1,
          success: outcome.success,
          duration: outcome.duration,
          confidence: 0.5, // TODO: Calculate from reasoning confidence
          lessonsLearned: 0, // Will be updated after reflection
        };

        // Calculate improvement vs previous iteration
        if (i > 0) {
          const prevDuration = results[i - 1].duration;
          const improvement = ((prevDuration - outcome.duration) / prevDuration) * 100;
          result.improvement = improvement;

          console.log(`\n  📈 Improvement vs iteration ${i}: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`);
        }

        results.push(result);

        // Extract key learnings
        if (outcome.success && i === iterations - 1) {
          keyLearnings.push(`Successfully completed task after ${iterations} iterations`);
          keyLearnings.push(`Final execution time: ${(outcome.duration / 1000).toFixed(2)}s`);
        }
      } catch (error) {
        console.error(`  ❌ Iteration ${i + 1} failed: ${error.message}`);

        results.push({
          iteration: i + 1,
          success: false,
          duration: 0,
          confidence: 0,
          lessonsLearned: 0,
        });
      }

      // Brief pause between iterations
      if (i < iterations - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Calculate overall metrics
    const metrics = this.calculateLearningMetrics(results);

    // Generate recommendations
    const recommendations = this.generateLearningRecommendations(results, metrics);

    const report: LearningReport = {
      task,
      iterations,
      results,
      overallImprovement: metrics.improvementRate,
      keyLearnings,
      recommendations,
      metrics,
    };

    // Print final report
    this.printLearningReport(report);

    return report;
  }

  /**
   * Handle execution failure
   */
  private async handleFailure(task: Task, error: any): Promise<void> {
    try {
      // Store failure experience
      const failureExperience: Experience = {
        id: generateId(),
        task,
        context: {
          task,
          pastExperiences: [],
          relatedNotes: [],
          timestamp: Date.now(),
        },
        plan: {
          id: 'failed_plan',
          taskId: task.id,
          steps: [],
          estimatedEffort: 0,
          confidence: 0,
          rationale: 'Execution failed before planning',
          createdAt: Date.now(),
        },
        outcome: {
          success: false,
          error: error as Error,
          duration: 0,
          metrics: {
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            stepsCompleted: 0,
            stepsTotal: 0,
            successRate: 0,
            errorCount: 1,
          },
          logs: [error.message],
          timestamp: Date.now(),
        },
        success: false,
        lessons: [
          {
            type: 'failure',
            description: `Task failed: ${error.message}`,
            actions: ['Review error logs', 'Adjust approach', 'Add error handling'],
            impact: 'high',
            applicableDomains: [task.domain || 'general'],
          },
        ],
        timestamp: Date.now(),
        domain: task.domain || 'general',
      };

      await this.memory.memorize(failureExperience);
      console.log('  ✓ Failure experience stored for future learning');
    } catch (memoryError) {
      console.warn(`Failed to store failure experience: ${memoryError.message}`);
    }
  }

  /**
   * Calculate learning metrics from iteration results
   */
  private calculateLearningMetrics(results: IterationResult[]): LearningMetrics {
    const successCount = results.filter((r) => r.success).length;
    const successRate = successCount / results.length;

    const avgConfidence =
      results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    const avgDuration =
      results.filter((r) => r.success).reduce((sum, r) => sum + r.duration, 0) / Math.max(successCount, 1);

    const totalLessons = results.reduce((sum, r) => sum + r.lessonsLearned, 0);

    // Calculate improvement rate
    const improvements = results.filter((r) => r.improvement !== undefined).map((r) => r.improvement!);
    const improvementRate = improvements.length > 0
      ? improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length
      : 0;

    return {
      averageConfidence: avgConfidence,
      successRate,
      averageDuration,
      totalLessons,
      improvementRate,
    };
  }

  /**
   * Generate recommendations from learning results
   */
  private generateLearningRecommendations(results: IterationResult[], metrics: LearningMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.improvementRate > 10) {
      recommendations.push(`Strong learning trajectory (+${metrics.improvementRate.toFixed(1)}% improvement)`);
      recommendations.push('Continue using this autonomous learning approach');
    } else if (metrics.improvementRate < -10) {
      recommendations.push('Performance degrading over iterations - review approach');
    }

    if (metrics.successRate >= 0.8) {
      recommendations.push(`High success rate (${(metrics.successRate * 100).toFixed(0)}%) - approach is effective`);
    } else if (metrics.successRate < 0.5) {
      recommendations.push('Low success rate - consider alternative strategies');
    }

    if (metrics.totalLessons >= 10) {
      recommendations.push(`Rich learning experience (${metrics.totalLessons} lessons) - knowledge base growing`);
    }

    return recommendations;
  }

  /**
   * Print detailed learning report
   */
  private printLearningReport(report: LearningReport): void {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 LEARNING REPORT`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`Task: ${report.task.description}`);
    console.log(`Total Iterations: ${report.iterations}`);
    console.log(`Success Rate: ${(report.metrics.successRate * 100).toFixed(0)}%`);
    console.log(`Overall Improvement: ${report.overallImprovement > 0 ? '+' : ''}${report.overallImprovement.toFixed(1)}%`);
    console.log(`Total Lessons Learned: ${report.metrics.totalLessons}`);

    console.log(`\n📈 Iteration Results:`);
    report.results.forEach((result) => {
      const status = result.success ? '✓' : '✗';
      const improvement = result.improvement !== undefined ? ` (${result.improvement > 0 ? '+' : ''}${result.improvement.toFixed(1)}%)` : '';
      console.log(`  ${result.iteration}. ${status} ${(result.duration / 1000).toFixed(2)}s${improvement}`);
    });

    if (report.keyLearnings.length > 0) {
      console.log(`\n💡 Key Learnings:`);
      report.keyLearnings.forEach((learning, i) => {
        console.log(`  ${i + 1}. ${learning}`);
      });
    }

    if (report.recommendations.length > 0) {
      console.log(`\n📝 Recommendations:`);
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    console.log(`\n${'='.repeat(60)}\n`);
  }

  /**
   * Get memory statistics
   */
  async getMemoryStats() {
    return this.memory.getStats();
  }

  /**
   * Compress memory to save space
   */
  async compressMemory() {
    return this.memory.compress();
  }

  /**
   * Backup all experiences
   */
  async backupMemory(path: string) {
    return this.memory.backup(path);
  }
}
