/**
 * Integration tests for ActivityLogger with MCP server and workflow engine
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { ActivityLogger } from '../../src/vault-logger/activity-logger';

describe('ActivityLogger Integration', () => {
  let logger: ActivityLogger;
  let testVaultPath: string;
  let testLogDir: string;

  beforeEach(async () => {
    testVaultPath = path.join(__dirname, '../fixtures/test-vault-activity');
    testLogDir = path.join(testVaultPath, '.activity-logs');

    await fs.rm(testVaultPath, { recursive: true, force: true });
    await fs.mkdir(testVaultPath, { recursive: true });

    logger = new ActivityLogger(testVaultPath);
    await logger.initialize();
  });

  afterEach(async () => {
    await logger.shutdown();
    await fs.rm(testVaultPath, { recursive: true, force: true });
  });

  describe('complete workflow logging', () => {
    it('should log complete workflow execution', async () => {
      logger.setPhase('phase-9-testing');
      logger.setTask('Execute test workflow');

      // Simulate workflow execution
      await logger.logPrompt('Trigger workflow: test-workflow', {
        workflowId: 'test-workflow',
        trigger: 'file:change',
      });

      // Log workflow steps
      await logger.logToolCall(
        'shadow_cache.query_files',
        { tags: ['test'] },
        { files: [{ path: 'test.md', title: 'Test' }] },
        5
      );

      await logger.logToolCall(
        'shadow_cache.get_file_content',
        { path: 'test.md' },
        { content: 'Test content' },
        8
      );

      await logger.logToolCall(
        'workflow.update_metadata',
        { path: 'test.md', metadata: { processed: true } },
        { success: true },
        12
      );

      await logger.logResults({
        workflowCompleted: true,
        filesProcessed: 1,
        duration_ms: 25,
      });

      await logger.flush();

      // Verify log file
      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      expect(logFiles.length).toBe(1);

      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      // Verify all steps are logged
      expect(content).toContain('Execute test workflow');
      expect(content).toContain('Trigger workflow: test-workflow');
      expect(content).toContain('shadow_cache.query_files');
      expect(content).toContain('shadow_cache.get_file_content');
      expect(content).toContain('workflow.update_metadata');
      expect(content).toContain('workflowCompleted');
    });

    it('should log workflow with error', async () => {
      logger.setPhase('phase-9-testing');
      logger.setTask('Execute failing workflow');

      await logger.logPrompt('Trigger workflow: failing-workflow');

      await logger.logToolCall(
        'shadow_cache.query_files',
        { tags: ['nonexistent'] },
        { files: [] },
        5
      );

      await logger.logError(new Error('No files found for processing'), {
        workflowId: 'failing-workflow',
        step: 'query_files',
      });

      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('### ❌ Error');
      expect(content).toContain('No files found for processing');
      expect(content).toContain('"workflowId": "failing-workflow"');
    });
  });

  describe('MCP tool call logging', () => {
    it('should log all MCP shadow cache operations', async () => {
      logger.setPhase('phase-9-testing');
      logger.setTask('MCP shadow cache operations');

      const tools = [
        {
          name: 'query_files',
          params: { tags: ['ai'], limit: 10 },
          result: { files: [], total: 0 },
          duration: 3,
        },
        {
          name: 'search_tags',
          params: { tag: 'machine-learning' },
          result: { files: ['ml.md', 'dl.md'] },
          duration: 2,
        },
        {
          name: 'search_links',
          params: { source: 'index.md' },
          result: { links: [{ target: 'note1.md' }] },
          duration: 4,
        },
        {
          name: 'get_stats',
          params: {},
          result: { totalFiles: 100, totalTags: 50 },
          duration: 1,
        },
      ];

      for (const tool of tools) {
        await logger.logToolCall(
          `shadow_cache.${tool.name}`,
          tool.params,
          tool.result,
          tool.duration
        );
      }

      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      // Verify all tools logged
      expect(content).toContain('shadow_cache.query_files');
      expect(content).toContain('shadow_cache.search_tags');
      expect(content).toContain('shadow_cache.search_links');
      expect(content).toContain('shadow_cache.get_stats');

      // Verify timing data
      expect(content).toContain('**Duration:** 3ms');
      expect(content).toContain('**Duration:** 2ms');
      expect(content).toContain('**Duration:** 4ms');
      expect(content).toContain('**Duration:** 1ms');
    });

    it('should log MCP workflow operations', async () => {
      logger.setPhase('phase-9-testing');
      logger.setTask('MCP workflow operations');

      await logger.logToolCall(
        'workflow.list_workflows',
        {},
        { workflows: [{ id: 'wf1', name: 'Test' }] },
        2
      );

      await logger.logToolCall(
        'workflow.trigger_workflow',
        { workflowId: 'wf1', input: { test: true } },
        { executionId: 'exec-123', status: 'running' },
        50
      );

      await logger.logToolCall(
        'workflow.get_workflow_status',
        { executionId: 'exec-123' },
        { status: 'completed', result: { success: true } },
        5
      );

      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('workflow.list_workflows');
      expect(content).toContain('workflow.trigger_workflow');
      expect(content).toContain('workflow.get_workflow_status');
      expect(content).toContain('"executionId": "exec-123"');
    });
  });

  describe('AI agent logging', () => {
    it('should log AI agent prompt and response', async () => {
      logger.setPhase('phase-9-testing');
      logger.setTask('AI agent: auto-tag');

      await logger.logPrompt('Analyze content for tag suggestions', {
        contentLength: 1500,
        agentRule: 'auto-tag',
      });

      await logger.logToolCall(
        'claude.completions',
        {
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'Suggest tags for...' }],
          max_tokens: 500,
        },
        {
          tags: ['ai', 'machine-learning', 'neural-networks'],
          confidence: 0.95,
        },
        1200
      );

      await logger.logResults({
        suggestedTags: ['ai', 'machine-learning', 'neural-networks'],
        appliedTags: ['ai', 'machine-learning'],
        confidence: 0.95,
      });

      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('Analyze content for tag suggestions');
      expect(content).toContain('claude.completions');
      expect(content).toContain('"model": "claude-3-5-sonnet-20241022"');
      expect(content).toContain('suggestedTags');
      expect(content).toContain('**Duration:** 1200ms');
    });

    it('should log AI agent errors', async () => {
      logger.setPhase('phase-9-testing');
      logger.setTask('AI agent: auto-link (failed)');

      await logger.logPrompt('Create wikilinks for content');

      await logger.logToolCall(
        'claude.completions',
        { model: 'claude-3-5-sonnet-20241022' },
        undefined,
        3000,
        'API timeout: Request exceeded 3000ms'
      );

      await logger.logError('Failed to generate wikilinks', {
        reason: 'API timeout',
        agentRule: 'auto-link',
        retryable: true,
      });

      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      expect(content).toContain('**Error:**');
      expect(content).toContain('API timeout: Request exceeded 3000ms');
      expect(content).toContain('Failed to generate wikilinks');
      expect(content).toContain('"retryable": true');
    });
  });

  describe('session timeline reconstruction', () => {
    it('should create complete timeline of session', async () => {
      // Simulate complete development session
      logger.setPhase('phase-9-testing');

      // Task 1: Create documentation
      logger.setTask('Create user documentation');
      await logger.logPrompt('Create QUICKSTART.md');
      await logger.logToolCall('Write', { file: 'QUICKSTART.md' }, { success: true }, 20);
      await logger.logResults({ filesCreated: 1 });

      // Task 2: Run tests
      logger.setTask('Run test suite');
      await logger.logPrompt('Run all tests');
      await logger.logToolCall('Bash', { command: 'npm test' }, { exitCode: 0 }, 5000);
      await logger.logResults({ testsPassed: 42, testsFailed: 0 });

      // Task 3: Commit changes
      logger.setTask('Git commit');
      await logger.logPrompt('Commit documentation changes');
      await logger.logToolCall(
        'git.commit',
        { message: 'docs: Add QUICKSTART.md', files: ['QUICKSTART.md'] },
        { commitHash: 'abc123' },
        100
      );
      await logger.logResults({ committed: true, hash: 'abc123' });

      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      // Verify complete timeline
      expect(content).toContain('Create user documentation');
      expect(content).toContain('Run test suite');
      expect(content).toContain('Git commit');

      // Verify order
      const docIndex = content.indexOf('Create user documentation');
      const testIndex = content.indexOf('Run test suite');
      const commitIndex = content.indexOf('Git commit');

      expect(docIndex).toBeLessThan(testIndex);
      expect(testIndex).toBeLessThan(commitIndex);

      // Verify all results
      expect(content).toContain('"filesCreated": 1');
      expect(content).toContain('"testsPassed": 42');
      expect(content).toContain('"commitHash": "abc123"');
    });
  });

  describe('100% transparency verification', () => {
    it('should capture every step of complex operation', async () => {
      logger.setPhase('phase-9-testing');
      logger.setTask('Complex multi-step operation');

      // Step 1: User prompt
      await logger.logPrompt('Create comprehensive test suite', {
        userRequest: true,
        timestamp: new Date().toISOString(),
      });

      // Step 2: Planning
      await logger.logPrompt('Internal planning: Breaking down into subtasks', {
        internal: true,
        subtasks: ['Create unit tests', 'Create integration tests', 'Run tests'],
      });

      // Step 3: Execute subtasks
      for (let i = 0; i < 3; i++) {
        await logger.logToolCall(
          'Write',
          { file: `test-${i}.ts` },
          { success: true },
          25
        );
      }

      // Step 4: System actions
      await logger.logToolCall(
        'Bash',
        { command: 'npm test' },
        { stdout: 'All tests passed', exitCode: 0 },
        3000
      );

      // Step 5: Results
      await logger.logResults({
        operation: 'Create test suite',
        success: true,
        filesCreated: 3,
        testsRun: 42,
        totalTime_ms: 3100,
      });

      // Step 6: Follow-up action
      await logger.logPrompt('Tests passed, proceeding with commit');

      await logger.logToolCall(
        'git.commit',
        { message: 'test: Add comprehensive test suite' },
        { committed: true },
        50
      );

      await logger.flush();

      const files = await fs.readdir(testLogDir);
      const logFiles = files.filter(f => f.endsWith('.md') && f !== 'README.md');
      const logPath = path.join(testLogDir, logFiles[0]);
      const content = await fs.readFile(logPath, 'utf-8');

      // Verify 100% transparency - all 8 operations logged
      const entryCount = (content.match(/^## \d{4}-\d{2}-\d{2}T/gm) || []).length;
      expect(entryCount).toBeGreaterThanOrEqual(8);

      // Verify all types of data captured
      expect(content).toContain('userRequest');
      expect(content).toContain('internal');
      expect(content).toContain('subtasks');
      expect(content).toContain('Write');
      expect(content).toContain('Bash');
      expect(content).toContain('git.commit');
      expect(content).toContain('stdout');
      expect(content).toContain('exitCode');
    });
  });
});
