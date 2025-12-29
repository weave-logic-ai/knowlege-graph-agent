/**
 * Tests for Name Validator
 *
 * SPEC-003: Hive Mind Reconnection Tools
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NameValidator } from '../../src/cli/commands/hive-mind/validate-names.js';
import { writeFile, rm, mkdtemp, mkdir, readdir } from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('NameValidator', () => {
  let validator: NameValidator;
  let testDir: string;

  beforeEach(async () => {
    validator = new NameValidator('kebab');
    testDir = await mkdtemp(path.join(os.tmpdir(), 'name-validator-test-'));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('validateFilename', () => {
    it('should accept valid kebab-case filenames', () => {
      expect(validator.validateFilename('valid-name')).toEqual([]);
      expect(validator.validateFilename('another-valid-file')).toEqual([]);
      expect(validator.validateFilename('simple')).toEqual([]);
      expect(validator.validateFilename('with-123-numbers')).toEqual([]);
    });

    it('should reject filenames with spaces', () => {
      const issues = validator.validateFilename('file with spaces');
      expect(issues).toContain('Contains spaces');
    });

    it('should reject filenames with uppercase', () => {
      const issues = validator.validateFilename('UpperCase');
      expect(issues).toContain('Contains uppercase characters');
    });

    it('should reject filenames with underscores in kebab-case mode', () => {
      const issues = validator.validateFilename('file_with_underscores');
      expect(issues.some(i => i.includes('underscore'))).toBe(true);
    });

    it('should reject filenames with special characters', () => {
      const issues = validator.validateFilename('file@name!');
      expect(issues.some(i => i.includes('invalid characters'))).toBe(true);
    });

    it('should reject filenames with consecutive separators', () => {
      const issues = validator.validateFilename('double--dash');
      expect(issues).toContain('Contains consecutive separators (--)');
    });

    it('should reject filenames starting/ending with separator', () => {
      const issues1 = validator.validateFilename('-starts-with');
      const issues2 = validator.validateFilename('ends-with-');
      expect(issues1).toContain('Starts or ends with separator');
      expect(issues2).toContain('Starts or ends with separator');
    });
  });

  describe('suggestRename', () => {
    it('should convert uppercase to lowercase', () => {
      expect(validator.suggestRename('UpperCase')).toBe('uppercase');
    });

    it('should replace spaces with hyphens', () => {
      expect(validator.suggestRename('file with spaces')).toBe('file-with-spaces');
    });

    it('should replace underscores with hyphens', () => {
      expect(validator.suggestRename('file_with_underscores')).toBe('file-with-underscores');
    });

    it('should remove special characters', () => {
      expect(validator.suggestRename('file@name!')).toBe('filename');
    });

    it('should collapse consecutive separators', () => {
      expect(validator.suggestRename('double--dash')).toBe('double-dash');
    });

    it('should remove leading/trailing separators', () => {
      expect(validator.suggestRename('-leading-')).toBe('leading');
    });

    it('should handle complex cases', () => {
      expect(validator.suggestRename('My File_Name (Copy)!!')).toBe('my-file-name-copy');
    });
  });

  describe('validateVault', () => {
    it('should validate all files in vault', async () => {
      await writeFile(path.join(testDir, 'valid-file.md'), '# Valid');
      await writeFile(path.join(testDir, 'Invalid File.md'), '# Invalid');
      await writeFile(path.join(testDir, 'another_invalid.md'), '# Invalid');

      const result = await validator.validateVault(testDir);

      expect(result.valid).toContain('valid-file.md');
      expect(result.invalid.length).toBe(2);
      expect(result.statistics.validCount).toBe(1);
      expect(result.statistics.invalidCount).toBe(2);
    });

    it('should include suggestions for invalid files', async () => {
      await writeFile(path.join(testDir, 'My Document.md'), '# Test');

      const result = await validator.validateVault(testDir);

      expect(result.invalid[0].suggested).toBe('my-document.md');
    });

    it('should track common issues', async () => {
      await writeFile(path.join(testDir, 'File One.md'), '# Test');
      await writeFile(path.join(testDir, 'File Two.md'), '# Test');

      const result = await validator.validateVault(testDir);

      expect(result.statistics.commonIssues.get('Contains spaces')).toBe(2);
    });

    it('should handle nested directories', async () => {
      await mkdir(path.join(testDir, 'subdir'), { recursive: true });
      await writeFile(path.join(testDir, 'valid.md'), '# Valid');
      await writeFile(path.join(testDir, 'subdir', 'Also Valid.md'), '# Invalid');

      const result = await validator.validateVault(testDir);

      expect(result.valid.length).toBe(1);
      expect(result.invalid.length).toBe(1);
    });
  });

  describe('renameFiles', () => {
    it('should rename files when not dry run', async () => {
      await writeFile(path.join(testDir, 'Invalid File.md'), '# Test');

      const result = await validator.validateVault(testDir);
      const renameResults = await validator.renameFiles(testDir, result.invalid, false);

      expect(renameResults[0].success).toBe(true);

      // Check file was renamed
      const files = await readdir(testDir);
      expect(files).toContain('invalid-file.md');
      expect(files).not.toContain('Invalid File.md');
    });

    it('should not rename files in dry run', async () => {
      await writeFile(path.join(testDir, 'Invalid File.md'), '# Test');

      const result = await validator.validateVault(testDir);
      const renameResults = await validator.renameFiles(testDir, result.invalid, true);

      expect(renameResults[0].success).toBe(true);

      // Check file was NOT renamed
      const files = await readdir(testDir);
      expect(files).toContain('Invalid File.md');
      expect(files).not.toContain('invalid-file.md');
    });

    it('should fail if target already exists', async () => {
      await writeFile(path.join(testDir, 'Invalid File.md'), '# Test');
      await writeFile(path.join(testDir, 'invalid-file.md'), '# Already exists');

      const result = await validator.validateVault(testDir);
      const renameResults = await validator.renameFiles(testDir, result.invalid, false);

      expect(renameResults[0].success).toBe(false);
      expect(renameResults[0].error).toContain('already exists');
    });
  });

  describe('snake_case schema', () => {
    it('should validate snake_case filenames', () => {
      const snakeValidator = new NameValidator('snake');

      expect(snakeValidator.validateFilename('valid_name')).toEqual([]);
      expect(snakeValidator.validateFilename('with-hyphen').some(i => i.includes('hyphen'))).toBe(true);
    });

    it('should suggest snake_case renames', () => {
      const snakeValidator = new NameValidator('snake');

      expect(snakeValidator.suggestRename('My File Name')).toBe('my_file_name');
    });
  });

  describe('obsidian schema', () => {
    it('should allow spaces and mixed case', () => {
      const obsidianValidator = new NameValidator('obsidian');

      expect(obsidianValidator.validateFilename('My Document Name')).toEqual([]);
      expect(obsidianValidator.validateFilename('With-Hyphens_And_Underscores')).toEqual([]);
    });
  });

  describe('generateReport', () => {
    it('should generate markdown report', async () => {
      await writeFile(path.join(testDir, 'valid.md'), '# Valid');
      await writeFile(path.join(testDir, 'Invalid File.md'), '# Invalid');

      const result = await validator.validateVault(testDir);
      const report = validator.generateReport(result);

      expect(report).toContain('# File Naming Validation Report');
      expect(report).toContain('kebab-case');
      expect(report).toContain('Total Files');
      expect(report).toContain('Valid');
      expect(report).toContain('Invalid');
    });
  });
});
