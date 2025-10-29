/**
 * Tests for Conventional Commit Helpers
 */

import { describe, it, expect } from 'vitest';
import {
  formatCommitMessage,
  parseCommitMessage,
  validateCommitMessage,
  isValidType,
  getTypeDescription,
  getAllTypes,
  extractIssueReferences,
  type ConventionalCommit
} from '../../src/git/conventional.js';

describe('conventional', () => {
  describe('formatCommitMessage', () => {
    it('should format basic commit message', () => {
      const commit: ConventionalCommit = {
        type: 'feat',
        subject: 'add new feature'
      };

      const message = formatCommitMessage(commit);
      expect(message).toBe('feat: add new feature');
    });

    it('should include scope', () => {
      const commit: ConventionalCommit = {
        type: 'fix',
        scope: 'api',
        subject: 'correct endpoint'
      };

      const message = formatCommitMessage(commit);
      expect(message).toBe('fix(api): correct endpoint');
    });

    it('should mark breaking changes with !', () => {
      const commit: ConventionalCommit = {
        type: 'feat',
        scope: 'core',
        subject: 'change API',
        breaking: true
      };

      const message = formatCommitMessage(commit);
      expect(message).toContain('feat(core)!:');
      expect(message).toContain('BREAKING CHANGE:');
    });

    it('should include body', () => {
      const commit: ConventionalCommit = {
        type: 'feat',
        subject: 'add feature',
        body: 'This is a detailed explanation of the feature.'
      };

      const message = formatCommitMessage(commit);
      expect(message).toContain('This is a detailed explanation');
    });

    it('should include footer', () => {
      const commit: ConventionalCommit = {
        type: 'fix',
        subject: 'bug fix',
        footer: 'Closes: #123'
      };

      const message = formatCommitMessage(commit);
      expect(message).toContain('Closes: #123');
    });

    it('should truncate long subjects', () => {
      const commit: ConventionalCommit = {
        type: 'feat',
        subject: 'a'.repeat(100)
      };

      const message = formatCommitMessage(commit, { maxSubjectLength: 50 });
      const subject = message.split('\n')[0];
      expect(subject?.length).toBeLessThanOrEqual(60); // type + scope + ": " + subject
    });

    it('should include emoji when requested', () => {
      const commit: ConventionalCommit = {
        type: 'feat',
        subject: 'new feature'
      };

      const message = formatCommitMessage(commit, { includeEmoji: true });
      expect(message).toContain('✨');
    });
  });

  describe('parseCommitMessage', () => {
    it('should parse basic commit message', () => {
      const message = 'feat: add new feature';
      const parsed = parseCommitMessage(message);

      expect(parsed).toMatchObject({
        type: 'feat',
        subject: 'add new feature'
      });
    });

    it('should parse commit with scope', () => {
      const message = 'fix(api): correct endpoint';
      const parsed = parseCommitMessage(message);

      expect(parsed).toMatchObject({
        type: 'fix',
        scope: 'api',
        subject: 'correct endpoint'
      });
    });

    it('should parse breaking change indicator', () => {
      const message = 'feat!: breaking change';
      const parsed = parseCommitMessage(message);

      expect(parsed?.breaking).toBe(true);
    });

    it('should parse commit with body', () => {
      const message = `feat: add feature

This is the body explaining the feature.`;

      const parsed = parseCommitMessage(message);
      expect(parsed?.body).toContain('This is the body');
    });

    it('should parse commit with footer', () => {
      const message = `fix: bug fix

Closes: #123`;

      const parsed = parseCommitMessage(message);
      expect(parsed?.footer).toContain('Closes: #123');
    });

    it('should detect breaking change in footer', () => {
      const message = `feat: new feature

BREAKING CHANGE: This breaks the API`;

      const parsed = parseCommitMessage(message);
      expect(parsed?.breaking).toBe(true);
    });

    it('should return null for invalid format', () => {
      const message = 'invalid commit message';
      const parsed = parseCommitMessage(message);

      expect(parsed).toBeNull();
    });
  });

  describe('validateCommitMessage', () => {
    it('should validate correct commit message', () => {
      const message = 'feat: add new feature';
      const { valid, errors } = validateCommitMessage(message);

      expect(valid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should detect long subject', () => {
      const message = `feat: ${'a'.repeat(60)}`;
      const { valid, errors } = validateCommitMessage(message);

      expect(valid).toBe(false);
      expect(errors).toContain('Subject exceeds 50 characters');
    });

    it('should detect uppercase subject start', () => {
      const message = 'feat: Add new feature';
      const { valid, errors } = validateCommitMessage(message);

      expect(valid).toBe(false);
      expect(errors.some(e => e.includes('uppercase'))).toBe(true);
    });

    it('should detect period at end of subject', () => {
      const message = 'feat: add new feature.';
      const { valid, errors } = validateCommitMessage(message);

      expect(valid).toBe(false);
      expect(errors.some(e => e.includes('period'))).toBe(true);
    });
  });

  describe('isValidType', () => {
    it('should validate correct types', () => {
      expect(isValidType('feat')).toBe(true);
      expect(isValidType('fix')).toBe(true);
      expect(isValidType('docs')).toBe(true);
    });

    it('should reject invalid types', () => {
      expect(isValidType('invalid')).toBe(false);
      expect(isValidType('FEAT')).toBe(false);
    });
  });

  describe('getTypeDescription', () => {
    it('should return description for valid type', () => {
      const desc = getTypeDescription('feat');
      expect(desc).toContain('feature');
    });
  });

  describe('getAllTypes', () => {
    it('should return all valid types', () => {
      const types = getAllTypes();
      expect(types).toContain('feat');
      expect(types).toContain('fix');
      expect(types).toContain('docs');
      expect(types.length).toBeGreaterThan(5);
    });
  });

  describe('extractIssueReferences', () => {
    it('should extract GitHub issue references', () => {
      const message = 'fix: bug fix #123 and #456';
      const refs = extractIssueReferences(message);

      expect(refs).toContain('#123');
      expect(refs).toContain('#456');
    });

    it('should extract Closes references', () => {
      const message = `fix: bug fix

Closes: #123, #456`;

      const refs = extractIssueReferences(message);
      expect(refs).toContain('#123');
      expect(refs).toContain('#456');
    });

    it('should extract owner/repo references', () => {
      const message = 'fix: bug fix owner/repo#123';
      const refs = extractIssueReferences(message);

      expect(refs.some(r => r.includes('owner/repo#123'))).toBe(true);
    });

    it('should deduplicate references', () => {
      const message = 'fix: bug #123 and #123 again';
      const refs = extractIssueReferences(message);

      expect(refs.filter(r => r === '#123').length).toBe(1);
    });
  });
});
