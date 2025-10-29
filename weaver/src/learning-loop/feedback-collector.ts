/**
 * User Feedback Collection System
 *
 * Beautiful CLI-based feedback collection with inquirer
 * Implements A/B testing, preference learning, and improvement tracking
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import type {
  UserFeedback,
  FeedbackPromptConfig,
  ApproachOption,
  FeedbackContext,
  ApproachSelection,
  PreferenceSignal
} from './feedback-types';

export class FeedbackCollector {
  constructor(
    private config: FeedbackPromptConfig = {}
  ) {}

  /**
   * Collect feedback after SOP execution
   */
  async collect(context: FeedbackContext): Promise<UserFeedback> {
    console.log('\n' + chalk.cyan('━'.repeat(60)));
    console.log(chalk.cyan.bold('📊 Reflection & Feedback'));
    console.log(chalk.cyan('━'.repeat(60)) + '\n');

    // Always ask for satisfaction rating
    const satisfaction = await this.askSatisfaction();

    // Conditional questions based on config and satisfaction
    const approaches = context.approaches && context.approaches.length > 1
      ? await this.askApproachPreference(context.approaches)
      : undefined;

    const improvements = !this.config.skipOnHighSatisfaction || satisfaction.rating < 4
      ? await this.askImprovements(context.suggestedImprovements)
      : undefined;

    const preferenceSignals = await this.extractPreferenceSignals(
      satisfaction.rating,
      approaches,
      improvements
    );

    console.log('\n' + chalk.green('✓ Feedback recorded! Thank you.'));
    this.showLearningImpact(satisfaction.rating, approaches, improvements);

    return {
      id: `feedback_${Date.now()}`,
      timestamp: Date.now(),
      sopId: context.sopId,
      executionId: context.executionId,
      satisfactionRating: satisfaction.rating,
      satisfactionComment: satisfaction.comment,
      approaches: context.approaches,
      selectedApproach: approaches?.selectedId,
      approachRationale: approaches?.rationale,
      improvements,
      preferenceSignals,
      taskComplexity: this.inferComplexity(context)
    };
  }

  /**
   * Quick satisfaction rating (1-5 stars)
   */
  private async askSatisfaction(): Promise<{ rating: 1 | 2 | 3 | 4 | 5; comment?: string }> {
    const { rating } = await inquirer.prompt([
      {
        type: 'list',
        name: 'rating',
        message: 'How satisfied are you with this outcome?',
        choices: [
          { name: '⭐⭐⭐⭐⭐ (5) Excellent', value: 5 },
          { name: '⭐⭐⭐⭐☆ (4) Good', value: 4 },
          { name: '⭐⭐⭐☆☆ (3) Okay', value: 3 },
          { name: '⭐⭐☆☆☆ (2) Poor', value: 2 },
          { name: '⭐☆☆☆☆ (1) Very Poor', value: 1 }
        ]
      }
    ]);

    // Optional comment for low ratings
    let comment: string | undefined;
    if (rating <= 3) {
      const response = await inquirer.prompt([
        {
          type: 'input',
          name: 'comment',
          message: 'What went wrong? (optional)',
        }
      ]);
      comment = response.comment || undefined;
    }

    return { rating, comment };
  }

  /**
   * A/B testing - choose between approaches
   */
  private async askApproachPreference(
    approaches: ApproachOption[]
  ): Promise<ApproachSelection> {
    console.log('\n' + chalk.yellow('🔀 Approach Comparison\n'));
    console.log('We generated multiple approaches:\n');

    // Display all approaches
    approaches.forEach((approach, idx) => {
      console.log(chalk.bold(`${String.fromCharCode(65 + idx)}. ${approach.name}`));
      console.log(`   ${approach.description}`);
      console.log(chalk.green('   Pros: ') + approach.pros.join(', '));
      console.log(chalk.red('   Cons: ') + approach.cons.join(', '));
      if (approach.estimatedEffort) {
        console.log(chalk.blue('   Effort: ') + approach.estimatedEffort);
      }
      if (approach.qualityScore !== undefined) {
        console.log(chalk.magenta('   Quality: ') + '★'.repeat(Math.round(approach.qualityScore * 5)));
      }
      console.log();
    });

    const { selectedId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedId',
        message: 'Which approach worked best?',
        choices: approaches.map((a, idx) => ({
          name: `${String.fromCharCode(65 + idx)}. ${a.name}`,
          value: a.id
        }))
      }
    ]);

    const { wantRationale } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'wantRationale',
        message: 'Would you like to explain why?',
        default: false
      }
    ]);

    let rationale: string | undefined;
    if (wantRationale) {
      const result = await inquirer.prompt([
        {
          type: 'input',
          name: 'rationale',
          message: 'Why did you choose this approach?'
        }
      ]);
      rationale = result.rationale || undefined;
    }

    return { selectedId, rationale };
  }

  /**
   * Collect improvement suggestions
   */
  private async askImprovements(
    suggestions?: string[]
  ): Promise<string[] | undefined> {
    const { wantToImprove } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'wantToImprove',
        message: 'Would you like to suggest improvements?',
        default: false
      }
    ]);

    if (!wantToImprove) return undefined;

    // Show AI suggestions if available
    if (suggestions && suggestions.length > 0) {
      console.log('\n' + chalk.yellow('AI suggested improvements:'));
      suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
      console.log();
    }

    const improvements: string[] = [];
    let addMore = true;

    while (addMore) {
      const { improvement } = await inquirer.prompt([
        {
          type: 'input',
          name: 'improvement',
          message: `Improvement ${improvements.length + 1} (or press Enter to finish):`
        }
      ]);

      if (improvement && improvement.trim()) {
        improvements.push(improvement.trim());
      } else {
        addMore = false;
      }
    }

    return improvements.length > 0 ? improvements : undefined;
  }

  /**
   * Extract preference signals from feedback
   */
  private async extractPreferenceSignals(
    satisfaction: number,
    approaches?: ApproachSelection,
    improvements?: string[]
  ): Promise<PreferenceSignal[]> {
    const signals: PreferenceSignal[] = [];

    // High satisfaction = positive signal for current approach
    if (satisfaction >= 4 && approaches) {
      signals.push({
        category: 'approach_preference',
        value: approaches.selectedId,
        shouldRepeat: true
      });
    }

    // Low satisfaction = negative signal
    if (satisfaction <= 2 && approaches) {
      signals.push({
        category: 'approach_preference',
        value: approaches.selectedId,
        shouldRepeat: false
      });
    }

    // Extract preference signals from improvements
    if (improvements) {
      for (const improvement of improvements) {
        const lowerImprovement = improvement.toLowerCase();

        if (lowerImprovement.includes('more detail') || lowerImprovement.includes('more explanation')) {
          signals.push({
            category: 'detail_level',
            value: 'high',
            shouldRepeat: true
          });
        }

        if (lowerImprovement.includes('less detail') || lowerImprovement.includes('more concise')) {
          signals.push({
            category: 'detail_level',
            value: 'low',
            shouldRepeat: true
          });
        }

        if (lowerImprovement.includes('faster') || lowerImprovement.includes('quicker')) {
          signals.push({
            category: 'speed_preference',
            value: 'prioritize_speed',
            shouldRepeat: true
          });
        }

        if (lowerImprovement.includes('quality') || lowerImprovement.includes('thorough')) {
          signals.push({
            category: 'quality_preference',
            value: 'prioritize_quality',
            shouldRepeat: true
          });
        }

        if (lowerImprovement.includes('test') || lowerImprovement.includes('coverage')) {
          signals.push({
            category: 'testing_preference',
            value: 'increase_testing',
            shouldRepeat: true
          });
        }

        if (lowerImprovement.includes('document') || lowerImprovement.includes('comment')) {
          signals.push({
            category: 'documentation_preference',
            value: 'increase_documentation',
            shouldRepeat: true
          });
        }
      }
    }

    return signals;
  }

  /**
   * Show learning impact to user
   */
  private showLearningImpact(
    satisfaction: number,
    approaches?: ApproachSelection,
    improvements?: string[]
  ): void {
    console.log('\n' + chalk.blue('━'.repeat(60)));
    console.log(chalk.blue.bold('📈 Learning Impact'));
    console.log(chalk.blue('━'.repeat(60)) + '\n');

    if (satisfaction >= 4) {
      console.log(chalk.green('  ✓ This approach will be prioritized in future'));
    } else if (satisfaction === 3) {
      console.log(chalk.yellow('  ~ We\'ll refine this approach based on your feedback'));
    } else {
      console.log(chalk.red('  ✗ We\'ll explore alternative approaches next time'));
    }

    if (approaches) {
      const selectedApproach = approaches.selectedId.replace(/_/g, ' ');
      console.log(chalk.blue(`  → Preference recorded: ${selectedApproach}`));
    }

    if (improvements && improvements.length > 0) {
      console.log(chalk.blue(`  → ${improvements.length} improvement(s) noted for future`));
      improvements.forEach((imp, idx) => {
        console.log(chalk.gray(`    ${idx + 1}. ${imp}`));
      });
    }

    const estimatedImprovement = this.calculateImprovementEstimate(satisfaction);
    console.log(chalk.green(`\n  → Estimated improvement next time: ~${estimatedImprovement}%`));
    console.log(chalk.blue('━'.repeat(60)) + '\n');
  }

  /**
   * Calculate estimated improvement percentage
   */
  private calculateImprovementEstimate(satisfaction: number): number {
    // Simple heuristic: lower satisfaction = more learning = bigger improvement
    if (satisfaction >= 4) return 5;
    if (satisfaction === 3) return 10;
    if (satisfaction === 2) return 15;
    return 20;
  }

  /**
   * Infer task complexity from context
   */
  private inferComplexity(context: FeedbackContext): 'low' | 'medium' | 'high' {
    // Infer from number of approaches, execution time, etc.
    if (context.approaches && context.approaches.length > 3) {
      return 'high';
    }

    if (context.approaches && context.approaches.length > 1) {
      return 'medium';
    }

    // Check if result contains complexity indicators
    if (context.result) {
      const resultStr = JSON.stringify(context.result).toLowerCase();
      if (resultStr.includes('complex') || resultStr.includes('difficult')) {
        return 'high';
      }
      if (resultStr.includes('simple') || resultStr.includes('basic')) {
        return 'low';
      }
    }

    return 'medium';
  }

  /**
   * Minimal feedback mode (quick rating only)
   */
  async collectMinimal(context: FeedbackContext): Promise<UserFeedback> {
    const satisfaction = await this.askSatisfaction();

    return {
      id: `feedback_${Date.now()}`,
      timestamp: Date.now(),
      sopId: context.sopId,
      executionId: context.executionId,
      satisfactionRating: satisfaction.rating,
      satisfactionComment: satisfaction.comment,
      preferenceSignals: [],
      taskComplexity: this.inferComplexity(context)
    };
  }
}
