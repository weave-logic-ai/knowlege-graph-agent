/**
 * Unit tests for ActivityLogger
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { ActivityLogger } from '../../../src/vault-logger/activity-logger';

describe('ActivityLogger', () => {
  let logger: ActivityLogger;
  let testVaultPath: string;
  let testLogDir: string;

  beforeEach(async () => {
    testVaultPath = path.join(__dirname, '../../fixtures/test-vault-logger');
    testLogDir = path.join(testVaultPath, '.activity-logs');

    // Clean up test directory
    await fs.rm(testVaultPath, { recursive: true, force: true });
    await fs.mkdir(testVaultPath, { recursive: true });

    logger = new ActivityLogger(testVaultPath);
    await logger.initialize();
  });

  afterEach(async () => {
    await logger.shutdown();
    await fs.rm(testVaultPath, { recursive: true, force: true });
  });

  describe('initialization', () => {
    it('should create log directory', async () => {
      const exists = await fs.access(testLogDir).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should create README.md index file', async () => {
      const indexPath = path.join(testLogDir, 'README.md');
      const exists = await fs.access(indexPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const content = await fs.readFile(indexPath, 'utf-8');
      expect(content).toContain('# Activity Log Index');
      expect(content).toContain('Session ID');
    });

    it('should generate unique session ID', async () => {
      const summary1 = await logger.getSessionSummary();

      const logger2 = new ActivityLogger(testVaultPath);
      await logger2.initialize();
      const summary2 = await logger2.getSessionSummary();
      await logger2.shutdown();

      expect(summary1.sessionId).not.toBe(summary2.sessionId);
    });
  });

  describe('context management', () => {
    it('should set phase context', () => {
      logger.setPhase('phase-9-testing');
      // Phase is set internally, verify through logging
      expect(() => logger.setPhase('phase-9-testing')).not.toThrow();
    });

    it('should set task context', () => {
      logger.setTask('Write unit tests');
      expect(() => logger.setTask('Write unit tests')).not.toThrow();
    });
  });

  describe('logPrompt', () => {
    it('should log prompt with metadata', async () => {
      logger.setPhase('phase-9');
      logger.setTask('Test logging');

      await logger.logPrompt('Test prompt', { priority: 'high' });
      await logger.flush();

      // Verify log file was created
      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      expect(logFiles.length).toBe(1);

      // Verify content
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('## 20'); // Timestamp
      expect(content).toContain('**Phase**: phase-9');
      expect(content).toContain('**Task**: Test logging');
      expect(content).toContain('### Prompt');
      expect(content).toContain('Test prompt');
      expect(content).toContain('"priority": "high"');
    });

    it('should handle prompt without metadata', async () => {
      await logger.logPrompt('Simple prompt');
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('Simple prompt');
    });
  });

  describe('logToolCall', () => {
    it('should log tool call with all details', async () => {
      logger.setPhase('phase-9');
      logger.setTask('Test tool logging');

      await logger.logToolCall(
        'Write',
        { file_path: '/test.md', content: 'Test content' },
        { success: true, bytesWritten: 100 },
        45,
        undefined
      );
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('### Tool Calls');
      expect(content).toContain('#### Write');
      expect(content).toContain('**Parameters:**');
      expect(content).toContain('"file_path": "/test.md"');
      expect(content).toContain('**Result:**');
      expect(content).toContain('"success": true');
      expect(content).toContain('**Duration:** 45ms');
    });

    it('should log tool call with error', async () => {
      await logger.logToolCall(
        'Read',
        { file_path: '/missing.md' },
        undefined,
        10,
        'File not found'
      );
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('**Error:**');
      expect(content).toContain('File not found');
    });

    it('should handle multiple tool calls', async () => {
      await logger.logToolCall('Write', { file: 'test1.md' }, { success: true }, 10);
      await logger.logToolCall('Write', { file: 'test2.md' }, { success: true }, 15);
      await logger.logToolCall('Read', { file: 'test1.md' }, { content: 'data' }, 5);
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      // Should have 3 separate entries
      const entries = content.split('---\n\n');
      expect(entries.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('logResults', () => {
    it('should log results with metadata', async () => {
      logger.setPhase('phase-9');
      logger.setTask('Test results');

      await logger.logResults(
        { filesCreated: 5, testsRun: 42, testsPassed: 40 },
        { coverage: '95%' }
      );
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('### Results');
      expect(content).toContain('"filesCreated": 5');
      expect(content).toContain('"testsRun": 42');
      expect(content).toContain('"testsPassed": 40');
      expect(content).toContain('"coverage": "95%"');
    });
  });

  describe('logError', () => {
    it('should log Error object', async () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n  at test.ts:10:5';

      await logger.logError(error, { operation: 'test-operation' });
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('### ❌ Error');
      expect(content).toContain('Test error');
      expect(content).toContain('"operation": "test-operation"');
      expect(content).toContain('Error: Test error');
    });

    it('should log string error', async () => {
      await logger.logError('Simple error message');
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('Simple error message');
    });
  });

  describe('session management', () => {
    it('should get session summary', async () => {
      await logger.logPrompt('Test 1');
      await logger.logPrompt('Test 2');
      await logger.logPrompt('Test 3');

      const summary = await logger.getSessionSummary();

      expect(summary.sessionId).toBeDefined();
      expect(summary.startTime).toBeInstanceOf(Date);
      expect(summary.duration_ms).toBeGreaterThan(0);
      expect(summary.totalEntries).toBe(3);
      expect(summary.phase).toBe('unknown'); // Default phase
      expect(summary.task).toBe('unknown'); // Default task
    });

    it('should track phase and task in summary', async () => {
      logger.setPhase('phase-9');
      logger.setTask('Testing');

      const summary = await logger.getSessionSummary();

      expect(summary.phase).toBe('phase-9');
      expect(summary.task).toBe('Testing');
    });
  });

  describe('buffering and flushing', () => {
    it('should buffer entries before flush', async () => {
      await logger.logPrompt('Entry 1');
      await logger.logPrompt('Entry 2');

      const summary = await logger.getSessionSummary();
      expect(summary.totalEntries).toBe(2);
    });

    it('should write all entries on flush', async () => {
      await logger.logPrompt('Entry 1');
      await logger.logPrompt('Entry 2');
      await logger.logPrompt('Entry 3');

      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('Entry 1');
      expect(content).toContain('Entry 2');
      expect(content).toContain('Entry 3');
    });

    it('should clear buffer after flush', async () => {
      await logger.logPrompt('Entry 1');
      await logger.flush();

      const summary = await logger.getSessionSummary();
      expect(summary.totalEntries).toBe(0);
    });
  });

  describe('file naming and organization', () => {
    it('should create file with correct naming pattern', async () => {
      await logger.logPrompt('Test');
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');

      expect(logFiles.length).toBe(1);

      // Should match: YYYY-MM-DD-TIMESTAMP-RANDOM.md
      expect(logFiles[0]).toMatch(/^\d{4}-\d{2}-\d{2}-\d{8}T\d{6}-[a-z0-9]{6}\.md$/);
    });

    it('should use same file for same session', async () => {
      await logger.logPrompt('Entry 1');
      await logger.flush();

      await logger.logPrompt('Entry 2');
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');

      // Should only have one log file for the session
      expect(logFiles.length).toBe(1);
    });
  });

  describe('markdown formatting', () => {
    it('should format entries with proper markdown structure', async () => {
      logger.setPhase('phase-9');
      logger.setTask('Markdown test');

      await logger.logPrompt('Test prompt', { key: 'value' });
      await logger.logToolCall('Write', { file: 'test.md' }, { success: true }, 10);
      await logger.logResults({ result: 'success' });
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      // Check structure
      expect(content).toMatch(/^## \d{4}-\d{2}-\d{2}T/m); // Timestamp header
      expect(content).toContain('**Phase**:');
      expect(content).toContain('**Task**:');
      expect(content).toContain('### Prompt');
      expect(content).toContain('```');
      expect(content).toContain('### Tool Calls');
      expect(content).toContain('#### Write');
      expect(content).toContain('**Parameters:**');
      expect(content).toContain('```json');
      expect(content).toContain('---'); // Entry separator
    });

    it('should escape special characters in JSON', async () => {
      await logger.logToolCall(
        'Test',
        { content: 'Line 1\nLine 2\n"Quoted"' },
        { result: 'Success with "quotes"' },
        10
      );
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      // JSON should be properly formatted
      expect(content).toContain('```json');
      expect(content).toContain('"content"');
    });
  });

  describe('shutdown', () => {
    it('should flush on shutdown', async () => {
      await logger.logPrompt('Final entry');
      await logger.shutdown();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('Final entry');
    });

    it('should stop auto-flush interval', async () => {
      const flushSpy = vi.spyOn(logger, 'flush');
      await logger.shutdown();

      // Wait for interval time
      await new Promise(resolve => setTimeout(resolve, 35000));

      // Flush should not be called after shutdown
      const callCount = flushSpy.mock.calls.length;
      await new Promise(resolve => setTimeout(resolve, 35000));

      expect(flushSpy.mock.calls.length).toBe(callCount);
    });
  });

  describe('error handling', () => {
    it('should handle write errors gracefully', async () => {
      // Make log directory read-only
      await fs.chmod(testLogDir, 0o444);

      // Should not throw
      await expect(logger.logPrompt('Test')).resolves.not.toThrow();

      // Restore permissions
      await fs.chmod(testLogDir, 0o755);
    });

    it('should continue logging after error', async () => {
      // Cause an error
      await fs.chmod(testLogDir, 0o444);
      await logger.logPrompt('Error entry');

      // Restore and continue
      await fs.chmod(testLogDir, 0o755);
      await logger.logPrompt('Success entry');
      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');

      // Should still have log file
      expect(logFiles.length).toBeGreaterThan(0);
    });
  });
});
