/**
 * Conventional Commit Helpers
 *
 * Utilities for working with conventional commit format
 * Following the spec: https://www.conventionalcommits.org/
 *
 * Format: <type>(<scope>): <subject>
 *
 * <body>
 *
 * <footer>
 *
 * @module git/conventional
 */

import type { ConventionalCommitType } from './diff-analyzer.js';

// Re-export type for use in other modules
export type { ConventionalCommitType };

export interface ConventionalCommit {
  type: ConventionalCommitType;
  scope?: string;
  subject: string;
  body?: string;
  footer?: string;
  breaking?: boolean;
}

export interface CommitFormatOptions {
  maxSubjectLength?: number;
  maxBodyLineLength?: number;
  includeEmoji?: boolean;
}

const TYPE_DESCRIPTIONS: Record<ConventionalCommitType, string> = {
  feat: 'A new feature',
  fix: 'A bug fix',
  docs: 'Documentation only changes',
  style: 'Changes that do not affect the meaning of the code',
  refactor: 'A code change that neither fixes a bug nor adds a feature',
  perf: 'A code change that improves performance',
  test: 'Adding missing tests or correcting existing tests',
  build: 'Changes that affect the build system or external dependencies',
  ci: 'Changes to CI configuration files and scripts',
  chore: 'Other changes that don\'t modify src or test files',
  revert: 'Reverts a previous commit'
};

const TYPE_EMOJIS: Record<ConventionalCommitType, string> = {
  feat: '✨',
  fix: '🐛',
  docs: '📝',
  style: '💄',
  refactor: '♻️',
  perf: '⚡',
  test: '✅',
  build: '📦',
  ci: '👷',
  chore: '🔧',
  revert: '⏪'
};

/**
 * Format a conventional commit message
 */
export function formatCommitMessage(
  commit: ConventionalCommit,
  options: CommitFormatOptions = {}
): string {
  const {
    maxSubjectLength = 50,
    maxBodyLineLength = 72,
    includeEmoji = false
  } = options;

  const parts: string[] = [];

  // Header: type(scope): subject
  let header = commit.type;

  if (commit.breaking) {
    header += '!';
  }

  if (commit.scope) {
    header += `(${commit.scope})`;
  }

  header += ': ';

  if (includeEmoji) {
    header += `${TYPE_EMOJIS[commit.type]} `;
  }

  // Truncate subject if too long
  const subject = commit.subject.length > maxSubjectLength
    ? commit.subject.substring(0, maxSubjectLength - 3) + '...'
    : commit.subject;

  header += subject;
  parts.push(header);

  // Body
  if (commit.body) {
    parts.push('');
    const bodyLines = wrapText(commit.body, maxBodyLineLength);
    parts.push(bodyLines);
  }

  // Footer
  if (commit.footer) {
    parts.push('');
    parts.push(commit.footer);
  }

  // Breaking change in footer if not in header
  if (commit.breaking && !commit.footer?.includes('BREAKING CHANGE:')) {
    parts.push('');
    parts.push('BREAKING CHANGE: This commit contains breaking changes');
  }

  return parts.join('\n');
}

/**
 * Parse a conventional commit message
 */
export function parseCommitMessage(message: string): ConventionalCommit | null {
  const lines = message.split('\n');
  const header = lines[0];

  if (!header) return null;

  // Parse header: type(scope)!: subject
  const headerRegex = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
  const match = header.match(headerRegex);

  if (!match) return null;

  const [, type, scope, breaking, subject] = match;

  // Validate type
  if (!isValidType(type)) return null;

  // Extract body and footer
  let body: string | undefined;
  let footer: string | undefined;

  if (lines.length > 2) {
    const bodyStartIndex = lines.findIndex((line, i) => i > 0 && line.trim() !== '');
    const footerStartIndex = lines.findIndex(line =>
      line.startsWith('BREAKING CHANGE:') ||
      line.startsWith('Closes:') ||
      line.startsWith('Refs:') ||
      line.match(/^[\w-]+:\s/)
    );

    if (bodyStartIndex > 0) {
      const bodyEndIndex = footerStartIndex > 0 ? footerStartIndex : lines.length;
      body = lines.slice(bodyStartIndex, bodyEndIndex).join('\n').trim();
    }

    if (footerStartIndex > 0) {
      footer = lines.slice(footerStartIndex).join('\n').trim();
    }
  }

  return {
    type: type as ConventionalCommitType,
    scope: scope || undefined,
    subject: subject?.trim() ?? '',
    body,
    footer,
    breaking: breaking === '!' || footer?.includes('BREAKING CHANGE:')
  };
}

/**
 * Validate commit type
 */
export function isValidType(type: string): type is ConventionalCommitType {
  return Object.keys(TYPE_DESCRIPTIONS).includes(type);
}

/**
 * Get description for commit type
 */
export function getTypeDescription(type: ConventionalCommitType): string {
  return TYPE_DESCRIPTIONS[type];
}

/**
 * Get emoji for commit type
 */
export function getTypeEmoji(type: ConventionalCommitType): string {
  return TYPE_EMOJIS[type];
}

/**
 * Get all valid commit types
 */
export function getAllTypes(): ConventionalCommitType[] {
  return Object.keys(TYPE_DESCRIPTIONS) as ConventionalCommitType[];
}

/**
 * Wrap text to specified line length
 */
function wrapText(text: string, maxLength: number): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxLength) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
}

/**
 * Validate a conventional commit message
 */
export function validateCommitMessage(message: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const parsed = parseCommitMessage(message);
  if (!parsed) {
    errors.push('Invalid commit message format');
    return { valid: false, errors };
  }

  // Check subject length
  if (parsed.subject.length > 50) {
    errors.push('Subject exceeds 50 characters');
  }

  // Check subject format
  if (parsed.subject[0] === parsed.subject[0]?.toUpperCase()) {
    errors.push('Subject should not start with uppercase letter');
  }

  if (parsed.subject.endsWith('.')) {
    errors.push('Subject should not end with period');
  }

  // Check body line length
  if (parsed.body) {
    const bodyLines = parsed.body.split('\n');
    const longLines = bodyLines.filter(line => line.length > 72);
    if (longLines.length > 0) {
      errors.push('Body contains lines exceeding 72 characters');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Extract issue references from commit message
 */
export function extractIssueReferences(message: string): string[] {
  const references: string[] = [];

  // GitHub/GitLab issue references: #123, owner/repo#123
  const issuePattern = /(?:^|\s)(?:([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)?#(\d+))/g;
  let match;

  while ((match = issuePattern.exec(message)) !== null) {
    references.push(match[0].trim());
  }

  // Closes/Fixes/Resolves references
  const closesPattern = /(?:Closes|Fixes|Resolves):\s*(#\d+(?:,\s*#\d+)*)/gi;
  while ((match = closesPattern.exec(message)) !== null) {
    const issues = match[1]?.match(/#\d+/g);
    if (issues) references.push(...issues);
  }

  return Array.from(new Set(references));
}
