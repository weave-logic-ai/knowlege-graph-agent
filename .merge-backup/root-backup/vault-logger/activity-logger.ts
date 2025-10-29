/**
 * Activity Logger - Comprehensive logging of all Claude/AI activities to vault
 *
 * Creates sequential markdown files in the vault to maintain a comprehensive timeline
 * of all activities, tool calls, results, and AI interactions.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface ActivityLogEntry {
  timestamp: Date;
  phase: string;
  task: string;
  prompt?: string;
  toolCalls?: ToolCall[];
  results?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ToolCall {
  tool: string;
  parameters: Record<string, unknown>;
  result?: unknown;
  duration_ms?: number;
  error?: string;
}

export class ActivityLogger {
  private vaultPath: string;
  private logDirectory: string;
  private currentSession: string;
  private currentPhase: string = 'unknown';
  private currentTask: string = 'unknown';
  private sessionStartTime: Date;
  private logBuffer: ActivityLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(vaultPath: string, logDirectory: string = '.activity-logs') {
    this.vaultPath = vaultPath;
    this.logDirectory = path.join(this.vaultPath, logDirectory);
    this.sessionStartTime = new Date();
    this.currentSession = this.generateSessionId();
  }

  /**
   * Initialize the activity logger
   */
  async initialize(): Promise<void> {
    try {
      // Create log directory if it doesn't exist
      await fs.mkdir(this.logDirectory, { recursive: true });

      // Create index file
      await this.createIndexFile();

      // Start auto-flush interval (every 30 seconds)
      this.flushInterval = setInterval(() => {
        this.flush().catch((error) => {
          logger.error('Failed to flush activity logs', error instanceof Error ? error : new Error(String(error)));
        });
      }, 30000);

      logger.info('Activity logger initialized', {
        logDirectory: this.logDirectory,
        sessionId: this.currentSession,
      });
    } catch (error) {
      logger.error('Failed to initialize activity logger', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Set the current phase context
   */
  setPhase(phase: string): void {
    this.currentPhase = phase;
  }

  /**
   * Set the current task context
   */
  setTask(task: string): void {
    this.currentTask = task;
  }

  /**
   * Log a prompt/question
   */
  async logPrompt(prompt: string, metadata?: Record<string, unknown>): Promise<void> {
    const entry: ActivityLogEntry = {
      timestamp: new Date(),
      phase: this.currentPhase,
      task: this.currentTask,
      prompt,
      metadata,
    };

    this.logBuffer.push(entry);
    await this.writeEntryToFile(entry);
  }

  /**
   * Log a tool call
   */
  async logToolCall(
    tool: string,
    parameters: Record<string, unknown>,
    result?: unknown,
    duration_ms?: number,
    error?: string
  ): Promise<void> {
    const toolCall: ToolCall = {
      tool,
      parameters,
      result,
      duration_ms,
      error,
    };

    const entry: ActivityLogEntry = {
      timestamp: new Date(),
      phase: this.currentPhase,
      task: this.currentTask,
      toolCalls: [toolCall],
    };

    this.logBuffer.push(entry);
    await this.writeEntryToFile(entry);
  }

  /**
   * Log task results
   */
  async logResults(results: Record<string, unknown>, metadata?: Record<string, unknown>): Promise<void> {
    const entry: ActivityLogEntry = {
      timestamp: new Date(),
      phase: this.currentPhase,
      task: this.currentTask,
      results,
      metadata,
    };

    this.logBuffer.push(entry);
    await this.writeEntryToFile(entry);
  }

  /**
   * Log an error
   */
  async logError(error: string | Error, metadata?: Record<string, unknown>): Promise<void> {
    const entry: ActivityLogEntry = {
      timestamp: new Date(),
      phase: this.currentPhase,
      task: this.currentTask,
      error: error instanceof Error ? error.message : error,
      metadata: {
        ...metadata,
        stack: error instanceof Error ? error.stack : undefined,
      },
    };

    this.logBuffer.push(entry);
    await this.writeEntryToFile(entry);
  }

  /**
   * Write entry to markdown file
   */
  private async writeEntryToFile(entry: ActivityLogEntry): Promise<void> {
    const fileName = this.getLogFileName(entry.timestamp);
    const filePath = path.join(this.logDirectory, fileName);

    // Format entry as markdown
    const markdown = this.formatEntryAsMarkdown(entry);

    try {
      // Append to existing file or create new one
      await fs.appendFile(filePath, markdown + '\n\n---\n\n');
    } catch (error) {
      logger.error('Failed to write activity log entry', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Format entry as markdown
   */
  private formatEntryAsMarkdown(entry: ActivityLogEntry): string {
    const lines: string[] = [];

    // Header with timestamp
    lines.push(`## ${entry.timestamp.toISOString()}`);
    lines.push('');

    // Context
    lines.push(`**Phase**: ${entry.phase}`);
    lines.push(`**Task**: ${entry.task}`);
    lines.push('');

    // Prompt
    if (entry.prompt) {
      lines.push('### Prompt');
      lines.push('');
      lines.push('```');
      lines.push(entry.prompt);
      lines.push('```');
      lines.push('');
    }

    // Tool calls
    if (entry.toolCalls && entry.toolCalls.length > 0) {
      lines.push('### Tool Calls');
      lines.push('');

      for (const toolCall of entry.toolCalls) {
        lines.push(`#### ${toolCall.tool}`);
        lines.push('');

        if (toolCall.parameters) {
          lines.push('**Parameters:**');
          lines.push('```json');
          lines.push(JSON.stringify(toolCall.parameters, null, 2));
          lines.push('```');
          lines.push('');
        }

        if (toolCall.result) {
          lines.push('**Result:**');
          lines.push('```json');
          lines.push(JSON.stringify(toolCall.result, null, 2));
          lines.push('```');
          lines.push('');
        }

        if (toolCall.duration_ms) {
          lines.push(`**Duration:** ${toolCall.duration_ms}ms`);
          lines.push('');
        }

        if (toolCall.error) {
          lines.push('**Error:**');
          lines.push('```');
          lines.push(toolCall.error);
          lines.push('```');
          lines.push('');
        }
      }
    }

    // Results
    if (entry.results) {
      lines.push('### Results');
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(entry.results, null, 2));
      lines.push('```');
      lines.push('');
    }

    // Error
    if (entry.error) {
      lines.push('### ❌ Error');
      lines.push('');
      lines.push('```');
      lines.push(entry.error);
      lines.push('```');
      lines.push('');
    }

    // Metadata
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      lines.push('### Metadata');
      lines.push('');
      lines.push('```json');
      lines.push(JSON.stringify(entry.metadata, null, 2));
      lines.push('```');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get log file name for a given date
   */
  private getLogFileName(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}-${this.currentSession}.md`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  /**
   * Create index file
   */
  private async createIndexFile(): Promise<void> {
    const indexPath = path.join(this.logDirectory, 'README.md');

    const content = `# Activity Log Index

This directory contains comprehensive activity logs for all Claude/AI interactions with the vault.

## Log Structure

Each log file follows the naming pattern: \`YYYY-MM-DD-SESSION-ID.md\`

- **Date**: When the session started
- **Session ID**: Unique identifier for the session

## Log Contents

Each log entry contains:
- **Timestamp**: ISO 8601 timestamp
- **Phase**: Current development phase
- **Task**: Current task being worked on
- **Prompt**: User prompts or questions
- **Tool Calls**: All tool invocations with parameters and results
- **Results**: Task results and outputs
- **Errors**: Any errors encountered
- **Metadata**: Additional context and information

## Current Session

**Session ID**: ${this.currentSession}
**Started**: ${this.sessionStartTime.toISOString()}
**Phase**: ${this.currentPhase}
**Task**: ${this.currentTask}

## Usage

These logs provide a comprehensive timeline of all AI activity for:
- Debugging and troubleshooting
- Understanding decision-making processes
- Tracking progress across phases
- Auditing AI interactions
- Reconstructing workflows

---

**Last Updated**: ${new Date().toISOString()}
`;

    try {
      await fs.writeFile(indexPath, content);
    } catch (error) {
      logger.error('Failed to create activity log index', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Flush buffered entries to disk
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) {
      return;
    }

    logger.debug('Flushing activity log buffer', {
      entries: this.logBuffer.length,
    });

    // Update index file
    await this.createIndexFile();

    // Clear buffer
    this.logBuffer = [];
  }

  /**
   * Clean up and flush on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    await this.flush();
    logger.info('Activity logger shut down', { sessionId: this.currentSession });
  }

  /**
   * Get session summary
   */
  async getSessionSummary(): Promise<{
    sessionId: string;
    startTime: Date;
    duration_ms: number;
    totalEntries: number;
    phase: string;
    task: string;
  }> {
    const now = new Date();
    const duration_ms = now.getTime() - this.sessionStartTime.getTime();

    return {
      sessionId: this.currentSession,
      startTime: this.sessionStartTime,
      duration_ms,
      totalEntries: this.logBuffer.length,
      phase: this.currentPhase,
      task: this.currentTask,
    };
  }
}

// Singleton instance
let activityLogger: ActivityLogger | null = null;

/**
 * Get or create activity logger instance
 */
export function getActivityLogger(vaultPath?: string): ActivityLogger {
  if (!activityLogger && vaultPath) {
    activityLogger = new ActivityLogger(vaultPath);
  }

  if (!activityLogger) {
    throw new Error('Activity logger not initialized. Call with vaultPath first.');
  }

  return activityLogger;
}

/**
 * Initialize activity logger
 */
export async function initializeActivityLogger(vaultPath: string): Promise<ActivityLogger> {
  activityLogger = new ActivityLogger(vaultPath);
  await activityLogger.initialize();
  return activityLogger;
}
