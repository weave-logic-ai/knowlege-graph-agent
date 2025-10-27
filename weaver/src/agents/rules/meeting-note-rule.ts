/**
 * Meeting Note Rule - Extract action items and create tasks
 *
 * Triggers: Note tagged with #meeting
 * Condition: Has 'attendees' frontmatter field
 * Action: Extract action items, create tasks note
 *
 * @category Agent Rules
 */

import type { ClaudeClient } from '../claude-client.js';
import { PromptBuilder } from '../prompt-builder.js';
import { ACTION_ITEMS_PROMPT } from '../templates/action-items.js';
import { parseFrontmatter } from '../utils/frontmatter.js';

export interface MeetingNoteRuleConfig {
  /**
   * Claude client instance for action item extraction
   */
  claudeClient: ClaudeClient;

  /**
   * Function to store memory in Claude-Flow
   */
  setMemory: (key: string, value: string) => Promise<void>;

  /**
   * Tasks note directory (default: 'Tasks')
   */
  tasksDir?: string;
}

export interface ActionItem {
  task: string;
  assignee?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  context?: string;
}

export interface MeetingNoteResult {
  success: boolean;
  actionItems?: ActionItem[];
  tasksNoteContent?: string;
  tasksNoteFilename?: string;
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

/**
 * Meeting Note Rule Implementation
 */
export class MeetingNoteRule {
  private client: ClaudeClient;
  private setMemory: (key: string, value: string) => Promise<void>;
  private tasksDir: string;

  constructor(config: MeetingNoteRuleConfig) {
    this.client = config.claudeClient;
    this.setMemory = config.setMemory;
    this.tasksDir = config.tasksDir ?? 'Tasks';
  }

  /**
   * Check if the rule should trigger
   */
  shouldTrigger(content: string): boolean {
    const { frontmatter, body } = parseFrontmatter(content);

    // Check for #meeting tag in frontmatter or body (use index signature access)
    const hasMeetingTag =
      (frontmatter && 'tags' in frontmatter && Array.isArray(frontmatter['tags']) && frontmatter['tags'].includes('meeting')) ||
      body.includes('#meeting');

    // Check for attendees field
    const hasAttendees = frontmatter?.['attendees'] !== undefined;

    return hasMeetingTag && hasAttendees;
  }

  /**
   * Execute the meeting note rule
   */
  async execute(
    content: string,
    context?: { filename?: string; filepath?: string }
  ): Promise<MeetingNoteResult> {
    try {
      if (!this.shouldTrigger(content)) {
        return {
          success: false,
          error: 'Not a meeting note (missing #meeting tag or attendees field)'
        };
      }

      const { frontmatter, body } = parseFrontmatter(content);

      // Extract action items using Claude
      const actionItems = await this.extractActionItems(body, {
        attendees: frontmatter?.['attendees'] as string[] | undefined,
        meetingTitle: context?.filename?.replace('.md', '')
      });

      if (actionItems.length === 0) {
        return {
          success: true,
          actionItems: [],
          error: 'No action items found in meeting notes'
        };
      }

      // Create tasks note
      const tasksNoteFilename = this.generateTasksNoteFilename(
        context?.filename ?? 'meeting',
        frontmatter?.['date'] as string | undefined
      );

      const tasksNoteContent = this.generateTasksNote(actionItems, {
        meetingTitle: frontmatter?.['title'] as string | undefined ?? context?.filename?.replace('.md', ''),
        meetingDate: frontmatter?.['date'] as string | undefined,
        attendees: frontmatter?.['attendees'] as string[] | undefined,
        meetingNotePath: context?.filepath
      });

      // Store in memory
      await this.setMemory(
        `meeting/action-items/${tasksNoteFilename}`,
        JSON.stringify({
          actionItems,
          meetingNote: context?.filepath,
          extractedAt: new Date().toISOString()
        })
      );

      return {
        success: true,
        actionItems,
        tasksNoteContent,
        tasksNoteFilename
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Extract action items from meeting notes using Claude
   */
  private async extractActionItems(
    content: string,
    context?: { attendees?: string[]; meetingTitle?: string }
  ): Promise<ActionItem[]> {
    const prompt = new PromptBuilder()
      .system(ACTION_ITEMS_PROMPT.system)
      .user(ACTION_ITEMS_PROMPT.user)
      .variable('content', content)
      .variable('attendees', context?.attendees?.join(', ') ?? 'Unknown')
      .variable('meetingTitle', context?.meetingTitle ?? 'Meeting')
      .expectJSON({
        type: 'object',
        properties: {
          actionItems: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                task: { type: 'string' },
                assignee: { type: 'string' },
                dueDate: { type: 'string' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                context: { type: 'string' }
              },
              required: ['task']
            }
          }
        }
      })
      .expectTokens(500)
      .build();

    const response = await this.client.sendMessage(prompt.messages, {
      systemPrompt: prompt.system,
      responseFormat: prompt.responseFormat,
      maxTokens: 1000
    });

    if (!response.success || !response.data) {
      return [];
    }

    return this.parseActionItems(response.data);
  }

  /**
   * Parse action items from Claude response
   */
  private parseActionItems(data: unknown): ActionItem[] {
    try {
      if (typeof data !== 'object' || data === null) {
        return [];
      }

      const parsed = data as { actionItems?: unknown[] };

      if (!Array.isArray(parsed.actionItems)) {
        return [];
      }

      return parsed.actionItems
        .map(item => {
          if (typeof item === 'object' && item !== null) {
            const action = item as Partial<ActionItem>;
            return {
              task: String(action.task ?? '').trim(),
              assignee: action.assignee ? String(action.assignee).trim() : undefined,
              dueDate: action.dueDate ? String(action.dueDate).trim() : undefined,
              priority: action.priority ?? 'medium',
              context: action.context ? String(action.context).trim() : undefined
            } as ActionItem;
          }
          return null;
        })
        .filter((item): item is ActionItem => item !== null && item.task.length > 0);
    } catch {
      return [];
    }
  }

  /**
   * Generate tasks note filename
   */
  private generateTasksNoteFilename(meetingFilename: string, date?: string): string {
    const baseName = meetingFilename.replace('.md', '').replace(/[^a-zA-Z0-9-]/g, '-');
    const dateStr = date ?? new Date().toISOString().split('T')[0];
    return `${baseName}-tasks-${dateStr}.md`;
  }

  /**
   * Generate tasks note content
   */
  private generateTasksNote(
    actionItems: ActionItem[],
    context?: {
      meetingTitle?: string;
      meetingDate?: string;
      attendees?: string[];
      meetingNotePath?: string;
    }
  ): string {
    const frontmatter = `---
type: tasks
source: meeting
meeting_title: ${context?.meetingTitle ?? 'Meeting'}
meeting_date: ${context?.meetingDate ?? new Date().toISOString().split('T')[0]}
attendees: ${context?.attendees ? JSON.stringify(context.attendees) : '[]'}
created: ${new Date().toISOString()}
---`;

    const meetingLink = context?.meetingNotePath
      ? `\n\nSource: [[${context.meetingNotePath.replace('.md', '')}]]`
      : '';

    const tasksByPriority = {
      high: actionItems.filter(a => a.priority === 'high'),
      medium: actionItems.filter(a => a.priority === 'medium'),
      low: actionItems.filter(a => a.priority === 'low')
    };

    let content = `${frontmatter}

# Action Items: ${context?.meetingTitle ?? 'Meeting'}${meetingLink}

`;

    if (tasksByPriority.high.length > 0) {
      content += '## High Priority\n\n';
      content += this.formatActionItems(tasksByPriority.high);
      content += '\n';
    }

    if (tasksByPriority.medium.length > 0) {
      content += '## Medium Priority\n\n';
      content += this.formatActionItems(tasksByPriority.medium);
      content += '\n';
    }

    if (tasksByPriority.low.length > 0) {
      content += '## Low Priority\n\n';
      content += this.formatActionItems(tasksByPriority.low);
      content += '\n';
    }

    return content;
  }

  /**
   * Format action items as markdown checklist
   */
  private formatActionItems(items: ActionItem[]): string {
    return items
      .map(item => {
        let line = `- [ ] ${item.task}`;

        if (item.assignee) {
          line += ` @${item.assignee}`;
        }

        if (item.dueDate) {
          line += ` 📅 ${item.dueDate}`;
        }

        if (item.context) {
          line += `\n  > ${item.context}`;
        }

        return line;
      })
      .join('\n');
  }

  /**
   * Get rule configuration
   */
  getConfig(): Readonly<{
    tasksDir: string;
  }> {
    return {
      tasksDir: this.tasksDir
    };
  }
}

/**
 * Create a meeting note rule instance
 */
export function createMeetingNoteRule(config: MeetingNoteRuleConfig): MeetingNoteRule {
  return new MeetingNoteRule(config);
}
