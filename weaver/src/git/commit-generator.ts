/**
 * AI-Powered Commit Message Generator
 *
 * Generates conventional commit messages using Claude AI by analyzing:
 * - Git diffs (staged changes)
 * - File changes and patterns
 * - Recent commit history for style consistency
 * - Project conventions from templates
 *
 * @module git/commit-generator
 */

import type { GitClient } from './git-client.js';
import type { ClaudeClient } from '../agents/claude-client.js';
import {
  analyzeDiff,
  type DiffAnalysis,
  type ConventionalCommitType
} from './diff-analyzer.js';
import {
  formatCommitMessage,
  parseCommitMessage,
  validateCommitMessage,
  type ConventionalCommit
} from './conventional.js';
import {
  loadProjectTemplate,
  createContextFromDiff,
  renderTemplate,
  simpleRender,
  type TemplateContext
} from './templates.js';

export interface CommitGenerationOptions {
  /** Use custom template file */
  templatePath?: string;
  /** Include recent commit history for style consistency */
  includeHistory?: boolean;
  /** Number of recent commits to analyze */
  historyCount?: number;
  /** Custom commit type override */
  type?: ConventionalCommitType;
  /** Custom scope override */
  scope?: string;
  /** Include breaking change */
  breaking?: boolean;
  /** Additional context for AI */
  context?: string;
  /** Dry run (don't commit) */
  dryRun?: boolean;
}

export interface GeneratedCommit {
  message: string;
  parsed: ConventionalCommit;
  analysis: DiffAnalysis;
  template?: string;
}

/**
 * Commit message generator using AI
 */
export class CommitGenerator {
  constructor(
    private gitClient: GitClient,
    private claudeClient: ClaudeClient
  ) {}

  /**
   * Generate commit message from staged changes
   */
  async generate(options: CommitGenerationOptions = {}): Promise<GeneratedCommit> {
    // Get staged diff
    const diff = await this.gitClient.diff({ cached: true });

    if (!diff || diff.trim().length === 0) {
      throw new Error('No staged changes found. Use `git add` to stage files first.');
    }

    // Analyze diff
    const analysis = analyzeDiff(diff);

    // Load template if specified
    let template: string | undefined;
    if (options.templatePath) {
      const templateObj = await import('fs').then(fs =>
        fs.promises.readFile(options.templatePath!, 'utf-8')
      );
      template = templateObj;
    } else {
      // Try to load project template
      const projectTemplate = loadProjectTemplate(this.gitClient.getRepoPath());
      template = projectTemplate?.content;
    }

    // Get recent commits for style consistency
    let recentCommits: string[] = [];
    if (options.includeHistory !== false) {
      const log = await this.gitClient.log({
        maxCount: options.historyCount ?? 5
      });
      recentCommits = log.all.map(commit => commit.message);
    }

    // Generate commit message using AI
    const message = await this.generateWithAI(
      diff,
      analysis,
      recentCommits,
      {
        ...options,
        template
      }
    );

    // Parse generated message
    const parsed = parseCommitMessage(message);
    if (!parsed) {
      throw new Error('Generated commit message has invalid format');
    }

    return {
      message,
      parsed,
      analysis,
      template
    };
  }

  /**
   * Generate commit message using Claude AI
   */
  private async generateWithAI(
    diff: string,
    analysis: DiffAnalysis,
    recentCommits: string[],
    options: CommitGenerationOptions & { template?: string }
  ): Promise<string> {
    const prompt = this.buildPrompt(diff, analysis, recentCommits, options);

    const response = await this.claudeClient.sendMessage(prompt, {
      maxTokens: 500,
      temperature: 0.7,
      systemPrompt: `You are an expert at writing clear, concise conventional commit messages.
Follow the conventional commit specification strictly.
Be specific about what changed and why, not just how.
Use imperative mood ("add" not "added").
Keep the subject line under 50 characters.
Provide a detailed body explaining the motivation and context.`
    });

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Failed to generate commit message');
    }

    let message = String(response.data).trim();

    // Remove markdown code blocks if present
    message = message.replace(/^```(?:text|markdown)?\n?/gm, '').replace(/```$/gm, '');

    // Validate generated message
    const validation = validateCommitMessage(message);
    if (!validation.valid) {
      console.warn('Generated commit message has validation warnings:', validation.errors);
    }

    return message;
  }

  /**
   * Build prompt for AI commit message generation
   */
  private buildPrompt(
    diff: string,
    analysis: DiffAnalysis,
    recentCommits: string[],
    options: CommitGenerationOptions & { template?: string }
  ): string {
    const parts: string[] = [];

    parts.push('Generate a conventional commit message for the following changes:');
    parts.push('');

    // File summary
    parts.push('FILES CHANGED:');
    for (const file of analysis.files) {
      const status = file.status === 'added' ? 'new' :
                     file.status === 'deleted' ? 'deleted' :
                     file.status === 'renamed' ? `renamed from ${file.oldPath}` :
                     'modified';
      parts.push(`  - ${file.path} (${status}, +${file.insertions}/-${file.deletions})`);
    }
    parts.push('');

    // Statistics
    parts.push('STATISTICS:');
    parts.push(`  Files: ${analysis.stats.filesChanged}`);
    parts.push(`  Insertions: ${analysis.stats.insertions}`);
    parts.push(`  Deletions: ${analysis.stats.deletions}`);
    parts.push('');

    // Suggested type and scope
    parts.push('SUGGESTED:');
    parts.push(`  Type: ${options.type ?? analysis.suggestedType}`);
    if (options.scope ?? analysis.suggestedScope) {
      parts.push(`  Scope: ${options.scope ?? analysis.suggestedScope}`);
    }
    if (options.breaking ?? analysis.hasBreakingChanges) {
      parts.push(`  Breaking: yes`);
      if (analysis.breakingChangeIndicators.length > 0) {
        parts.push(`  Indicators: ${analysis.breakingChangeIndicators.join(', ')}`);
      }
    }
    parts.push('');

    // Recent commit style
    if (recentCommits.length > 0) {
      parts.push('RECENT COMMITS (for style consistency):');
      for (const commit of recentCommits) {
        const firstLine = commit.split('\n')[0];
        parts.push(`  - ${firstLine}`);
      }
      parts.push('');
    }

    // Context
    if (options.context) {
      parts.push('ADDITIONAL CONTEXT:');
      parts.push(options.context);
      parts.push('');
    }

    // Diff sample (truncated to avoid token limit)
    const diffLines = diff.split('\n');
    const maxDiffLines = 100;
    if (diffLines.length > maxDiffLines) {
      parts.push('DIFF SAMPLE (first 100 lines):');
      parts.push(diffLines.slice(0, maxDiffLines).join('\n'));
      parts.push(`\n... (${diffLines.length - maxDiffLines} more lines)`);
    } else {
      parts.push('DIFF:');
      parts.push(diff);
    }
    parts.push('');

    // Instructions
    parts.push('REQUIREMENTS:');
    parts.push('1. Follow conventional commit format: <type>(<scope>): <subject>');
    parts.push('2. Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert');
    parts.push('3. Subject: imperative mood, no period, under 50 chars');
    parts.push('4. Body: explain what and why (not how), wrap at 72 chars');
    parts.push('5. Footer: breaking changes, issue references');
    parts.push('6. Use "!" after type or "BREAKING CHANGE:" for breaking changes');
    parts.push('');

    if (options.template) {
      parts.push('TEMPLATE TO FOLLOW:');
      parts.push(options.template);
      parts.push('');
    }

    parts.push('Generate the complete commit message now:');

    return parts.join('\n');
  }

  /**
   * Create commit with generated message
   */
  async commit(
    generatedCommit: GeneratedCommit,
    options: CommitGenerationOptions = {}
  ): Promise<{ sha: string; message: string }> {
    if (options.dryRun) {
      console.log('DRY RUN - would commit with message:');
      console.log(generatedCommit.message);
      return { sha: 'dry-run', message: generatedCommit.message };
    }

    const result = await this.gitClient.commit(generatedCommit.message);

    return {
      sha: result.sha,
      message: result.message
    };
  }

  /**
   * Refine commit message interactively
   */
  async refine(
    currentMessage: string,
    feedback: string
  ): Promise<string> {
    const prompt = `Refine this commit message based on the feedback:

CURRENT MESSAGE:
${currentMessage}

FEEDBACK:
${feedback}

REQUIREMENTS:
- Maintain conventional commit format
- Keep subject under 50 characters
- Incorporate the feedback suggestions
- Preserve the original intent

Generate the refined commit message:`;

    const response = await this.claudeClient.sendMessage(prompt, {
      maxTokens: 500,
      temperature: 0.7
    });

    if (!response.success || !response.data) {
      throw new Error(response.error ?? 'Failed to refine commit message');
    }

    let message = String(response.data).trim();
    message = message.replace(/^```(?:text|markdown)?\n?/gm, '').replace(/```$/gm, '');

    return message;
  }

  /**
   * Get commit message preview
   */
  async preview(options: CommitGenerationOptions = {}): Promise<{
    message: string;
    analysis: DiffAnalysis;
    validation: { valid: boolean; errors: string[] };
  }> {
    const generated = await this.generate(options);
    const validation = validateCommitMessage(generated.message);

    return {
      message: generated.message,
      analysis: generated.analysis,
      validation
    };
  }
}

/**
 * Create a commit generator instance
 */
export function createCommitGenerator(
  gitClient: GitClient,
  claudeClient: ClaudeClient
): CommitGenerator {
  return new CommitGenerator(gitClient, claudeClient);
}
