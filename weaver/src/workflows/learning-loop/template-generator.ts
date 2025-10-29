/**
 * Template generator for creating populated markdown files
 */

import fs from 'fs/promises';
import path from 'path';
import type { WorkflowStage, TemplateData, Experience, Plan, ExecutionTask } from './types.js';

export class TemplateGenerator {
  private templatePath: string;
  private sessionPath: string;

  constructor() {
    this.templatePath = path.join(process.cwd(), 'templates/learning-loop');
    this.sessionPath = path.join(process.cwd(), '.weaver/learning-sessions');
  }

  /**
   * Generate a markdown template for a stage
   */
  async generateTemplate(
    stage: WorkflowStage,
    sessionId: string,
    sopId: string,
    data?: any
  ): Promise<string> {
    console.log(`[TemplateGenerator] Generating ${stage} template for session ${sessionId}`);

    const templateData: TemplateData = {
      session_id: sessionId,
      sop_id: sopId,
      task_description: data?.taskDescription || 'Unknown task',
      created_at: new Date().toISOString(),
    };

    // Populate stage-specific data
    switch (stage) {
      case 'perception':
        await this.populatePerceptionData(templateData, data);
        break;
      case 'reasoning':
        await this.populateReasoningData(templateData, data);
        break;
      case 'execution':
        await this.populateExecutionData(templateData, data);
        break;
      case 'reflection':
        await this.populateReflectionData(templateData, data);
        break;
      case 'feedback':
        // Feedback template needs minimal data
        break;
    }

    // Load template
    const templateFile = path.join(this.templatePath, `${stage}-stage.md`);
    let template = await fs.readFile(templateFile, 'utf-8');

    // Replace placeholders
    template = this.replacePlaceholders(template, templateData);

    // Write to session directory
    const sessionDir = path.join(this.sessionPath, sessionId);
    await fs.mkdir(sessionDir, { recursive: true });

    const outputFile = path.join(sessionDir, `${stage}.md`);
    await fs.writeFile(outputFile, template);

    console.log(`[TemplateGenerator] Template generated: ${outputFile}`);

    return outputFile;
  }

  /**
   * Populate perception stage data
   */
  private async populatePerceptionData(templateData: TemplateData, data?: any): Promise<void> {
    const experiences: Experience[] = data?.experiences || [];
    const vaultNotes: string[] = data?.vaultNotes || [];
    const externalKnowledge: string[] = data?.externalKnowledge || [];

    templateData.experience_count = experiences.length;
    templateData.vault_count = vaultNotes.length;
    templateData.external_count = externalKnowledge.length;

    // Format experiences section
    templateData.experiences_section = experiences
      .map((exp, i) => {
        return `${i + 1}. **${exp.task_description}** (${exp.date})
   - Relevance: <!-- RATING:${exp.relevance_score} -->
   - Outcome: ${exp.outcome}
   - Notes: _Optional: Add notes if needed_
`;
      })
      .join('\n');

    // Format vault notes section
    templateData.vault_notes_section = vaultNotes
      .map(note => `- \`${note}\``)
      .join('\n');

    // Format external knowledge section
    templateData.external_knowledge_section = externalKnowledge
      .map(source => `- ${source}`)
      .join('\n');
  }

  /**
   * Populate reasoning stage data
   */
  private async populateReasoningData(templateData: TemplateData, data?: any): Promise<void> {
    const plans: Plan[] = data?.plans || [];

    templateData.plan_count = plans.length;
    templateData.default_plan = plans[0]?.id || 'Plan_A';

    // Format plans section
    templateData.plans_section = plans
      .map((plan, i) => {
        return `### ${plan.name}
**Strategy**: ${plan.strategy}
**Effort**: ${plan.effort}
**Risk**: ${plan.risk}
**Complexity**: ${plan.complexity}
**Experience**: Used successfully in ${plan.experience_alignment} past projects

${plan.description}

**Steps**:
${plan.steps?.map(step => `- ${step}`).join('\n') || '- No steps defined'}
`;
      })
      .join('\n\n');

    // Format comparison matrix
    templateData.plan_headers = plans.map(p => p.name).join(' | ');
    templateData.effort_values = plans.map(p => p.effort).join(' | ');
    templateData.risk_values = plans.map(p => p.risk).join(' | ');
    templateData.complexity_values = plans.map(p => p.complexity).join(' | ');
    templateData.experience_values = plans.map(p => `${p.experience_alignment} projects`).join(' | ');
    templateData.learning_values = plans.map(p => p.learning_value).join(' | ');

    const comparisonHeaders = Array(plans.length).fill('---').join('|');
    templateData.plan_comparison_rows = comparisonHeaders;
  }

  /**
   * Populate execution stage data
   */
  private async populateExecutionData(templateData: TemplateData, data?: any): Promise<void> {
    const selectedPlan: string = data?.selectedPlan || 'Unknown plan';
    const tasks: ExecutionTask[] = data?.tasks || [];

    templateData.selected_plan = selectedPlan;

    // Format execution plan section
    templateData.execution_plan_section = `**Selected Plan**: ${selectedPlan}

The following tasks have been planned:
${tasks.map((task, i) => `${i + 1}. ${task.description} (Est: ${task.estimated_effort || 'TBD'})`).join('\n')}
`;

    // Format progress checklist
    templateData.progress_checklist = tasks
      .map(task => `- [ ] ${task.description} (${task.estimated_effort || 'TBD'})`)
      .join('\n');

    templateData.progress_percentage = 0;

    // Format metrics table (placeholder)
    templateData.metrics_table = `| Test coverage | >80% | TBD | 🔄 |
| Build time | <5min | TBD | 🔄 |
| Tasks complete | ${tasks.length} | 0 | 🔄 |`;
  }

  /**
   * Populate reflection stage data
   */
  private async populateReflectionData(templateData: TemplateData, data?: any): Promise<void> {
    const selectedPlan: string = data?.selectedPlan || 'Unknown plan';
    const executionDuration: string = data?.executionDuration || 'Unknown';

    templateData.selected_plan = selectedPlan;
    templateData.execution_duration = executionDuration;
    templateData.default_rating = 3;

    // Format execution summary
    const completedTasks = data?.completedTasks || [];
    const blockers = data?.blockers || [];
    const discoveries = data?.discoveries || [];

    templateData.execution_summary = `**Plan Used**: ${selectedPlan}
**Duration**: ${executionDuration}
**Tasks Completed**: ${completedTasks.length}
**Blockers Encountered**: ${blockers.length}
**Key Discoveries**: ${discoveries.length}

${discoveries.length > 0 ? '**Notable Discoveries**:\n' + discoveries.map((d: any) => `- ${d.description}`).join('\n') : ''}
`;
  }

  /**
   * Replace placeholders in template
   */
  private replacePlaceholders(template: string, data: TemplateData): string {
    let result = template;

    // Replace all known placeholders
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{${key}}`;
      const replacement = value !== undefined && value !== null ? String(value) : '';
      result = result.split(placeholder).join(replacement);
    }

    return result;
  }

  /**
   * Set custom template path
   */
  setTemplatePath(path: string): void {
    this.templatePath = path;
  }

  /**
   * Set custom session path
   */
  setSessionPath(path: string): void {
    this.sessionPath = path;
  }
}

/**
 * Singleton instance
 */
export const templateGenerator = new TemplateGenerator();
