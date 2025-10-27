/**
 * Daily Note Rule - Apply templates and rollover tasks for daily notes
 *
 * Triggers: Daily note created
 * Condition: Filename matches YYYY-MM-DD.md
 * Action: Apply template, link to yesterday, rollover incomplete tasks
 *
 * @category Agent Rules
 */

import type { ClaudeClient } from '../claude-client.js';
import { PromptBuilder } from '../prompt-builder.js';
import { DAILY_NOTE_TEMPLATE } from '../templates/daily-note-template.js';

export interface DailyNoteRuleConfig {
  /**
   * Claude client instance for task extraction
   */
  claudeClient: ClaudeClient;

  /**
   * Function to get memory from Claude-Flow
   */
  getMemory: (key: string) => Promise<string | null>;

  /**
   * Function to store memory in Claude-Flow
   */
  setMemory: (key: string, value: string) => Promise<void>;

  /**
   * Daily note directory path (default: 'Daily Notes')
   */
  dailyNotesDir?: string;
}

export interface DailyNoteTemplateData {
  date: string;
  dateFormatted: string;
  dayOfWeek: string;
  yesterday: string;
  yesterdayFormatted: string;
  tomorrow: string;
  tomorrowFormatted: string;
  weekNumber: number;
  rolloverTasks: string[];
}

export interface DailyNoteResult {
  success: boolean;
  content?: string;
  rolloverTasks?: string[];
  error?: string;
}

/**
 * Daily Note Rule Implementation
 */
export class DailyNoteRule {
  private client: ClaudeClient;
  private getMemory: (key: string) => Promise<string | null>;
  private setMemory: (key: string, value: string) => Promise<void>;
  private dailyNotesDir: string;

  constructor(config: DailyNoteRuleConfig) {
    this.client = config.claudeClient;
    this.getMemory = config.getMemory;
    this.setMemory = config.setMemory;
    this.dailyNotesDir = config.dailyNotesDir ?? 'Daily Notes';
  }

  /**
   * Check if filename is a daily note
   */
  isDailyNote(filename: string): boolean {
    // Match YYYY-MM-DD.md format
    const dailyNotePattern = /^\d{4}-\d{2}-\d{2}\.md$/;
    if (!dailyNotePattern.test(filename)) {
      return false;
    }

    // Validate date parts
    const dateStr = filename.replace('.md', '');
    const parts = dateStr.split('-').map(Number);
    const [_year, month, day] = parts;

    // Check for valid month (1-12) and day (1-31)
    if (month === undefined || month < 1 || month > 12) {
      return false;
    }

    if (day === undefined || day < 1 || day > 31) {
      return false;
    }

    return true;
  }

  /**
   * Execute the daily note rule
   */
  async execute(filename: string, existingContent?: string): Promise<DailyNoteResult> {
    try {
      if (!this.isDailyNote(filename)) {
        return {
          success: false,
          error: 'Not a daily note filename (expected YYYY-MM-DD.md)'
        };
      }

      // Extract date from filename (use UTC to avoid timezone issues)
      const dateStr = filename.replace('.md', '');
      const parts = dateStr.split('-').map(Number);
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];

      if (year === undefined || month === undefined || day === undefined) {
        return {
          success: false,
          error: 'Invalid date format in filename'
        };
      }

      const date = new Date(Date.UTC(year, month - 1, day));

      if (isNaN(date.getTime())) {
        return {
          success: false,
          error: 'Invalid date in filename'
        };
      }

      // Generate template data
      const templateData = this.generateTemplateData(date);

      // Get rollover tasks from yesterday
      const rolloverTasks = await this.getRolloverTasks(templateData.yesterday);
      templateData.rolloverTasks = rolloverTasks;

      // Render template
      const content = this.renderTemplate(templateData, existingContent);

      return {
        success: true,
        content,
        rolloverTasks
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate template data for a given date
   */
  private generateTemplateData(date: Date): DailyNoteTemplateData {
    // Use UTC to avoid timezone issues
    const yesterday = new Date(date);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const tomorrow = new Date(date);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Calculate week number
    const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getUTCDay() + 1) / 7);

    return {
      date: this.formatDate(date),
      dateFormatted: `${dayNames[date.getUTCDay()] ?? 'Unknown'}, ${monthNames[date.getUTCMonth()] ?? 'Unknown'} ${date.getUTCDate()}, ${date.getUTCFullYear()}`,
      dayOfWeek: dayNames[date.getUTCDay()] ?? 'Unknown',
      yesterday: this.formatDate(yesterday),
      yesterdayFormatted: `${monthNames[yesterday.getUTCMonth()] ?? 'Unknown'} ${yesterday.getUTCDate()}`,
      tomorrow: this.formatDate(tomorrow),
      tomorrowFormatted: `${monthNames[tomorrow.getUTCMonth()] ?? 'Unknown'} ${tomorrow.getUTCDate()}`,
      weekNumber,
      rolloverTasks: []
    };
  }

  /**
   * Format date as YYYY-MM-DD (using UTC to avoid timezone issues)
   */
  private formatDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get incomplete tasks from yesterday's note
   */
  private async getRolloverTasks(yesterdayDate: string): Promise<string[]> {
    try {
      // Query memory for yesterday's tasks
      const memoryKey = `daily-note/tasks/${yesterdayDate}`;
      const tasksJson = await this.getMemory(memoryKey);

      if (!tasksJson) {
        return [];
      }

      const tasks = JSON.parse(tasksJson) as Array<{ task: string; completed: boolean }>;

      // Return only incomplete tasks
      return tasks
        .filter(t => !t.completed)
        .map(t => t.task);
    } catch (error) {
      console.error('Failed to get rollover tasks:', error);
      return [];
    }
  }

  /**
   * Render template with data
   */
  private renderTemplate(data: DailyNoteTemplateData, existingContent?: string): string {
    // If content already exists, don't overwrite
    if (existingContent && existingContent.trim().length > 0) {
      return existingContent;
    }

    let template = DAILY_NOTE_TEMPLATE;

    // Replace template variables
    template = template.replace(/\{\{date\}\}/g, data.dateFormatted);
    template = template.replace(/\{\{yesterday\}\}/g, `[[${data.yesterday}]]`);
    template = template.replace(/\{\{tomorrow\}\}/g, `[[${data.tomorrow}]]`);
    template = template.replace(/\{\{weekNumber\}\}/g, String(data.weekNumber));

    // Add rollover tasks
    if (data.rolloverTasks.length > 0) {
      const rolloverSection = `## Rollover Tasks from ${data.yesterdayFormatted}

${data.rolloverTasks.map(task => `- [ ] ${task}`).join('\n')}

`;
      template = template.replace('## Tasks\n', rolloverSection + '## New Tasks\n');
    }

    return template;
  }

  /**
   * Extract and store tasks from a daily note
   */
  async extractAndStoreTasks(date: string, content: string): Promise<void> {
    const prompt = new PromptBuilder()
      .system('Extract all task items from the daily note. Return JSON with task text and completion status.')
      .user(`Daily note content:

${content}

Extract all tasks (lines starting with - [ ] or - [x]). Return JSON:
{
  "tasks": [
    { "task": "task text", "completed": false },
    { "task": "completed task", "completed": true }
  ]
}`)
      .expectJSON()
      .build();

    const response = await this.client.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
      maxTokens: 1000
    });

    if (response.success && response.data) {
      const memoryKey = `daily-note/tasks/${date}`;
      await this.setMemory(memoryKey, JSON.stringify(response.data));
    }
  }

  /**
   * Get rule configuration
   */
  getConfig(): Readonly<{
    dailyNotesDir: string;
  }> {
    return {
      dailyNotesDir: this.dailyNotesDir
    };
  }
}

/**
 * Create a daily note rule instance
 */
export function createDailyNoteRule(config: DailyNoteRuleConfig): DailyNoteRule {
  return new DailyNoteRule(config);
}
