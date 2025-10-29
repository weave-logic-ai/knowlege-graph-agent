/**
 * AutoCommitService - Automatic git commits with debouncing and AI-powered messages
 *
 * Handles automatic committing of vault changes with:
 * - Debouncing (batch multiple rapid changes)
 * - AI-powered semantic commit messages (Claude)
 * - Fallback commit messages when AI is unavailable
 * - Change deduplication
 * - Ignore delete events
 *
 * @module git/auto-commit
 */

import { GitClient, GitCommitResult } from './git-client.js';
import { ClaudeClient } from '../agents/claude-client.js';
import { FileEvent } from '../file-watcher/types.js';
import { config } from '../config/index.js';

export interface AutoCommitConfig {
  debounceMs: number;
  enabled: boolean;
}

/**
 * AutoCommitService - Manages automatic git commits
 */
export class AutoCommitService {
  private gitClient: GitClient;
  private claudeClient: ClaudeClient;
  private debounceMs: number;
  private enabled: boolean;

  // Pending changes (deduplicated)
  private pendingChanges = new Set<string>();

  // Debounce timer
  private debounceTimer?: NodeJS.Timeout;

  // Commit in progress flag
  private commitInProgress = false;

  // Statistics
  private stats = {
    totalEvents: 0,
    totalCommits: 0,
    lastCommitTime: null as Date | null,
    filesCommitted: 0,
  };

  constructor(
    gitClient: GitClient,
    claudeClient: ClaudeClient,
    configOptions?: Partial<AutoCommitConfig>
  ) {
    this.gitClient = gitClient;
    this.claudeClient = claudeClient;
    this.debounceMs = configOptions?.debounceMs ?? config.git.commitDebounceMs;
    this.enabled = configOptions?.enabled ?? config.git.autoCommit;

    console.log(`[AutoCommit] Initialized (enabled: ${this.enabled}, debounce: ${this.debounceMs}ms)`);
  }

  /**
   * Handle file event and queue for commit
   */
  onFileEvent(event: FileEvent): void {
    if (!this.enabled) {
      return;
    }

    this.stats.totalEvents++;

    // Ignore delete events
    if (event.type === 'unlink' || event.type === 'unlinkDir') {
      return;
    }

    // Ignore non-markdown files
    if (!event.relativePath.endsWith('.md')) {
      return;
    }

    // Add to pending changes (deduplicated by Set)
    this.pendingChanges.add(event.relativePath);

    // Reset debounce timer
    this.resetDebounceTimer();
  }

  /**
   * Force immediate commit (bypass debounce)
   */
  async forceCommit(): Promise<GitCommitResult | null> {
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }

    return await this.executeCommit();
  }

  /**
   * Reset debounce timer
   */
  private resetDebounceTimer(): void {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = setTimeout(() => {
      void this.executeCommit();
    }, this.debounceMs);
  }

  /**
   * Execute commit with pending changes
   */
  private async executeCommit(): Promise<GitCommitResult | null> {
    // Check if commit already in progress
    if (this.commitInProgress) {
      console.log('[AutoCommit] Commit already in progress, skipping');
      return null;
    }

    // Check if there are pending changes
    if (this.pendingChanges.size === 0) {
      console.log('[AutoCommit] No pending changes to commit');
      return null;
    }

    this.commitInProgress = true;

    try {
      // Get files to commit
      const files = Array.from(this.pendingChanges);
      console.log(`[AutoCommit] Committing ${files.length} file(s)`);

      // Generate commit message
      const message = await this.generateCommitMessage(files);

      // Stage and commit
      const result = await this.gitClient.addAndCommit(files, message);

      // Update statistics
      this.stats.totalCommits++;
      this.stats.lastCommitTime = new Date();
      this.stats.filesCommitted += files.length;

      // Clear pending changes
      this.pendingChanges.clear();

      console.log(`[AutoCommit] Committed successfully: ${result.sha.substring(0, 7)} - ${message}`);

      return result;
    } catch (error) {
      console.error('[AutoCommit] Failed to commit:', error);
      return null;
    } finally {
      this.commitInProgress = false;
    }
  }

  /**
   * Generate semantic commit message using Claude AI
   */
  async generateCommitMessage(files: string[]): Promise<string> {
    // Fallback for very large file lists
    if (files.length > 100) {
      return this.getFallbackMessage(files);
    }

    // Try to generate AI commit message with timeout
    try {
      const message = await Promise.race([
        this.generateAICommitMessage(files),
        this.timeoutPromise(3000), // 3 second timeout
      ]);

      if (typeof message === 'string') {
        return message;
      }

      // Timeout or error, use fallback
      return this.getFallbackMessage(files);
    } catch (error) {
      console.warn('[AutoCommit] Failed to generate AI commit message:', error);
      return this.getFallbackMessage(files);
    }
  }

  /**
   * Generate AI-powered commit message
   */
  private async generateAICommitMessage(files: string[]): Promise<string> {
    const fileList = files.map(f => `- ${f}`).join('\n');

    const prompt = `Generate a concise conventional commit message for these vault changes:

${fileList}

Requirements:
- Use conventional commit format: type(scope): description
- Types: docs, feat, fix, refactor, chore
- Keep under 72 characters
- Focus on what changed, not implementation details
- Use present tense ("add" not "added")

Example formats:
- docs(daily): add daily note for 2024-10-26
- docs: update 3 project notes
- feat(meeting): add weekly standup notes
- docs(journal): update personal reflections

Return ONLY the commit message, no explanations.`;

    const response = await this.claudeClient.sendMessage(prompt, {
      maxTokens: 100,
      temperature: 0.7,
    });

    // Extract commit message from response
    const message = (response.rawResponse || '').trim();

    // Validate format (basic check)
    if (message.length > 0 && message.length < 150) {
      return message;
    }

    // Invalid format, use fallback
    return this.getFallbackMessage(files);
  }

  /**
   * Get fallback commit message (when AI fails or times out)
   */
  private getFallbackMessage(files: string[]): string {
    if (files.length === 1) {
      return `docs: update ${files[0]}`;
    }

    // Group files by directory
    const directories = new Set<string>();
    files.forEach(file => {
      const parts = file.split('/');
      if (parts.length > 1 && parts[0]) {
        directories.add(parts[0]);
      }
    });

    if (directories.size === 1) {
      const dir = Array.from(directories)[0];
      return `docs(${dir}): update ${files.length} files`;
    }

    return `docs: update ${files.length} files`;
  }

  /**
   * Timeout promise helper
   */
  private timeoutPromise(ms: number): Promise<null> {
    return new Promise(resolve => setTimeout(() => resolve(null), ms));
  }

  /**
   * Get statistics
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Enable/disable auto-commit
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`[AutoCommit] ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get pending changes count
   */
  getPendingChangesCount(): number {
    return this.pendingChanges.size;
  }

  /**
   * Shutdown (cleanup timers)
   */
  shutdown(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    console.log('[AutoCommit] Shutdown complete');
  }
}

/**
 * Create AutoCommitService instance for the vault
 */
export function createAutoCommitService(
  gitClient: GitClient,
  claudeClient: ClaudeClient,
  configOptions?: Partial<AutoCommitConfig>
): AutoCommitService {
  return new AutoCommitService(gitClient, claudeClient, configOptions);
}
