/**
 * File watcher for monitoring markdown template changes
 * Triggers workflows when templates are marked as completed
 */

import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import { EventEmitter } from 'events';
import type { FileWatchEvent, WorkflowContext, ParsedMarkdown } from './types.js';
import { markdownParser } from './markdown-parser.js';

export interface WatcherOptions {
  sessionPath?: string;
  ignoreInitial?: boolean;
  awaitWriteFinish?: {
    stabilityThreshold: number;
    pollInterval?: number;
  };
}

export class LearningLoopWatcher extends EventEmitter {
  private watcher?: FSWatcher;
  private sessionPath: string;
  private isRunning = false;

  constructor(options: WatcherOptions = {}) {
    super();
    this.sessionPath = options.sessionPath || path.join(process.cwd(), '.weaver/learning-sessions');
  }

  /**
   * Start watching for markdown file changes
   */
  async start(options: WatcherOptions = {}): Promise<void> {
    if (this.isRunning) {
      console.warn('[LearningLoopWatcher] Already running');
      return;
    }

    const watchPattern = path.join(this.sessionPath, '**/*.md');

    console.log(`[LearningLoopWatcher] Starting watcher for: ${watchPattern}`);

    this.watcher = chokidar.watch(watchPattern, {
      persistent: true,
      ignoreInitial: options.ignoreInitial ?? true,
      awaitWriteFinish: options.awaitWriteFinish ?? {
        stabilityThreshold: 2000,
        pollInterval: 500,
      },
      depth: 3, // session_id/stage.md
    });

    this.watcher
      .on('add', (filePath: string) => this.handleFileEvent('add', filePath))
      .on('change', (filePath: string) => this.handleFileEvent('change', filePath))
      .on('unlink', (filePath: string) => this.handleFileEvent('unlink', filePath))
      .on('error', (error: Error) => this.handleError(error));

    this.isRunning = true;
    this.emit('started');
    console.log('[LearningLoopWatcher] Watcher started successfully');
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.watcher) {
      return;
    }

    await this.watcher.close();
    this.watcher = undefined;
    this.isRunning = false;
    this.emit('stopped');
    console.log('[LearningLoopWatcher] Watcher stopped');
  }

  /**
   * Check if watcher is running
   */
  isWatcherRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Handle file system events
   */
  private async handleFileEvent(eventType: 'add' | 'change' | 'unlink', filePath: string): Promise<void> {
    try {
      // Ignore archive directory
      if (filePath.includes('/archive/')) {
        return;
      }

      // Ignore metadata.json files
      if (filePath.endsWith('metadata.json')) {
        return;
      }

      console.log(`[LearningLoopWatcher] File ${eventType}: ${filePath}`);

      const event: FileWatchEvent = {
        eventType,
        filePath,
        timestamp: new Date(),
      };

      this.emit('file-event', event);

      // Only process 'change' events for now
      if (eventType === 'change') {
        await this.processFile(filePath);
      }
    } catch (error) {
      this.handleError(error as Error, filePath);
    }
  }

  /**
   * Process a markdown file
   */
  private async processFile(filePath: string): Promise<void> {
    try {
      // Parse the markdown file
      const parsed = await markdownParser.parse(filePath);

      console.log(
        `[LearningLoopWatcher] Parsed ${parsed.frontmatter.stage} stage (status: ${parsed.frontmatter.status})`
      );

      // Only trigger workflow if status is 'completed' and validation passes
      if (!parsed.isComplete) {
        console.log(`[LearningLoopWatcher] File not ready for processing (status: ${parsed.frontmatter.status})`);
        return;
      }

      // Extract user input
      const userInput = markdownParser.extractStructuredInput(parsed);

      // Create workflow context
      const context: WorkflowContext = {
        sessionId: parsed.frontmatter.session_id,
        sopId: parsed.frontmatter.sop_id,
        stage: parsed.frontmatter.stage,
        parsedData: parsed,
        userInput,
        timestamp: new Date(),
      };

      console.log(`[LearningLoopWatcher] Triggering ${parsed.frontmatter.stage} workflow for session ${context.sessionId}`);

      // Emit workflow trigger event
      this.emit('workflow-trigger', context);

    } catch (error) {
      this.handleError(error as Error, filePath);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error, filePath?: string): void {
    console.error(`[LearningLoopWatcher] Error${filePath ? ` processing ${filePath}` : ''}:`, error);
    this.emit('error', { error, filePath });
  }

  /**
   * Get current session path
   */
  getSessionPath(): string {
    return this.sessionPath;
  }

  /**
   * Update session path (must restart watcher)
   */
  setSessionPath(newPath: string): void {
    if (this.isRunning) {
      throw new Error('Cannot change session path while watcher is running. Stop watcher first.');
    }
    this.sessionPath = newPath;
  }
}

/**
 * Singleton instance
 */
export const learningLoopWatcher = new LearningLoopWatcher();

/**
 * Event type definitions for TypeScript
 */
declare module './file-watcher' {
  interface LearningLoopWatcher {
    on(eventType: 'started', listener: () => void): this;
    on(eventType: 'stopped', listener: () => void): this;
    on(eventType: 'file-event', listener: (event: FileWatchEvent) => void): this;
    on(eventType: 'workflow-trigger', listener: (context: WorkflowContext) => void): this;
    on(eventType: 'error', listener: (error: { error: Error; filePath?: string }) => void): this;

    emit(eventType: 'started'): boolean;
    emit(eventType: 'stopped'): boolean;
    emit(eventType: 'file-event', event: FileWatchEvent): boolean;
    emit(eventType: 'workflow-trigger', context: WorkflowContext): boolean;
    emit(eventType: 'error', error: { error: Error; filePath?: string }): boolean;
  }
}
