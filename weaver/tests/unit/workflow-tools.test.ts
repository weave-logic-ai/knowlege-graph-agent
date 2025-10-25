/**
 * Workflow Tools Unit Tests
 *
 * Comprehensive unit tests for MCP workflow tools:
 * - trigger_workflow: Manually trigger workflows with sync/async modes
 * - list_workflows: List workflows with filtering
 * - get_workflow_status: Check execution status
 * - get_workflow_history: Get execution history with pagination
 *
 * Target: 90%+ code coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTriggerWorkflowHandler } from '../../src/mcp-server/tools/workflow/trigger-workflow.js';
import { createListWorkflowsHandler } from '../../src/mcp-server/tools/workflow/list-workflows.js';
import { createGetWorkflowStatusHandler } from '../../src/mcp-server/tools/workflow/get-workflow-status.js';
import { createGetWorkflowHistoryHandler } from '../../src/mcp-server/tools/workflow/get-workflow-history.js';
import { MockWorkflowEngine, setupMockWorkflowEngine, createMockWorkflows, createMockExecutions } from '../mocks/workflow-engine-mock.js';

describe('Workflow Tools - Unit Tests', () => {
  let mockEngine: MockWorkflowEngine;

  beforeEach(() => {
    // Setup fresh mock engine with test data for each test
    mockEngine = setupMockWorkflowEngine();
  });

  describe('trigger_workflow Tool', () => {
    it('should trigger workflow synchronously with valid ID', async () => {
      const handler = createTriggerWorkflowHandler(mockEngine as any);
      const result = await handler({
        workflowId: 'test-workflow-1',
        async: false,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.workflowId).toBe('test-workflow-1');
      expect(result.data?.mode).toBe('sync');
      expect(result.data?.status).toBe('completed');
      expect(result.data?.executionId).toBeDefined();
      expect(result.metadata?.executionTime).toBeDefined();
    });

    it('should trigger workflow asynchronously with valid ID', async () => {
      const handler = createTriggerWorkflowHandler(mockEngine as any);
      const result = await handler({
        workflowId: 'test-workflow-1',
        async: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.workflowId).toBe('test-workflow-1');
      expect(result.data?.mode).toBe('async');
      expect(result.data?.executionId).toBeDefined();
      expect(result.metadata?.executionTime).toBeDefined();

      // Async mode should return quickly (less than 200ms)
      expect(result.metadata?.executionTime).toBeLessThan(200);
    });

    it('should reject invalid workflow ID', async () => {
      const handler = createTriggerWorkflowHandler(mockEngine as any);
      const result = await handler({
        workflowId: 'non-existent-workflow',
        async: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Workflow not found');
      expect(result.error).toContain('non-existent-workflow');
    });

    it('should reject disabled workflow', async () => {
      const handler = createTriggerWorkflowHandler(mockEngine as any);
      const result = await handler({
        workflowId: 'test-workflow-disabled',
        async: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('disabled');
      expect(result.error).toContain('test-workflow-disabled');
    });

    it('should handle workflow execution failure in sync mode', async () => {
      const handler = createTriggerWorkflowHandler(mockEngine as any);
      const result = await handler({
        workflowId: 'test-workflow-failing',
        async: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Intentional test failure');
    });

    it('should accept and pass metadata to workflow', async () => {
      const handler = createTriggerWorkflowHandler(mockEngine as any);
      const metadata = { testKey: 'testValue', number: 42 };
      const result = await handler({
        workflowId: 'test-workflow-1',
        async: false,
        input: metadata,
      });

      expect(result.success).toBe(true);
      // Metadata is passed but we can't directly verify it was received
      // The important part is the handler accepts it without error
    });

    it('should default to sync mode when async not specified', async () => {
      const handler = createTriggerWorkflowHandler(mockEngine as any);
      const result = await handler({
        workflowId: 'test-workflow-1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.mode).toBe('sync');
      expect(result.data?.status).toBeDefined();
    });
  });

  describe('list_workflows Tool', () => {
    it('should list all workflows when no filters provided', async () => {
      const handler = createListWorkflowsHandler(mockEngine as any);
      const result = await handler({});

      expect(result.success).toBe(true);
      expect(result.data?.workflows).toBeDefined();
      expect(result.data?.workflows.length).toBeGreaterThan(0);
      expect(result.data?.total).toBe(result.data?.workflows.length);
      expect(result.metadata?.executionTime).toBeDefined();
    });

    it('should filter workflows by enabled status (true)', async () => {
      const handler = createListWorkflowsHandler(mockEngine as any);
      const result = await handler({
        enabled: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.workflows).toBeDefined();
      expect(result.data?.workflows.every((w: any) => w.enabled === true)).toBe(true);
      expect(result.data?.filters.enabled).toBe(true);
    });

    it('should filter workflows by enabled status (false)', async () => {
      const handler = createListWorkflowsHandler(mockEngine as any);
      const result = await handler({
        enabled: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.workflows).toBeDefined();
      expect(result.data?.workflows.every((w: any) => w.enabled === false)).toBe(true);
      expect(result.data?.filters.enabled).toBe(false);
    });

    it('should filter workflows by category', async () => {
      const handler = createListWorkflowsHandler(mockEngine as any);
      const result = await handler({
        category: 'example',
      });

      expect(result.success).toBe(true);
      expect(result.data?.workflows).toBeDefined();
      expect(result.data?.workflows.every((w: any) => w.category === 'example')).toBe(true);
      expect(result.data?.filters.category).toBe('example');
    });

    it('should return workflow metadata with all required fields', async () => {
      const handler = createListWorkflowsHandler(mockEngine as any);
      const result = await handler({});

      expect(result.success).toBe(true);
      expect(result.data?.workflows).toBeDefined();

      const workflow = result.data?.workflows[0];
      expect(workflow).toBeDefined();
      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBeDefined();
      expect(workflow.description).toBeDefined();
      expect(typeof workflow.enabled).toBe('boolean');
      expect(Array.isArray(workflow.triggers)).toBe(true);
      expect(workflow.category).toBeDefined();
    });

    it('should sort workflows by name', async () => {
      const handler = createListWorkflowsHandler(mockEngine as any);
      const result = await handler({});

      expect(result.success).toBe(true);
      expect(result.data?.workflows).toBeDefined();

      const workflows = result.data?.workflows;
      if (workflows && workflows.length > 1) {
        const names = workflows.map((w: any) => w.name);
        const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
        expect(names).toEqual(sortedNames);
      }
    });

    it('should combine enabled and category filters', async () => {
      const handler = createListWorkflowsHandler(mockEngine as any);
      const result = await handler({
        enabled: true,
        category: 'example',
      });

      expect(result.success).toBe(true);
      expect(result.data?.workflows).toBeDefined();
      expect(result.data?.workflows.every((w: any) => w.enabled === true && w.category === 'example')).toBe(true);
    });
  });

  describe('get_workflow_status Tool', () => {
    it('should get status of completed execution', async () => {
      const handler = createGetWorkflowStatusHandler(mockEngine as any);
      const result = await handler({
        executionId: 'exec-completed-1',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.executionId).toBe('exec-completed-1');
      expect(result.data?.workflowId).toBe('test-workflow-1');
      expect(result.data?.status).toBe('completed');
      expect(result.data?.progress).toBe(100);
      expect(result.data?.startedAt).toBeDefined();
      expect(result.data?.completedAt).toBeDefined();
      expect(result.data?.duration).toBeDefined();
      expect(result.data?.error).toBeUndefined();
    });

    it('should get status of failed execution', async () => {
      const handler = createGetWorkflowStatusHandler(mockEngine as any);
      const result = await handler({
        executionId: 'exec-failed-1',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.executionId).toBe('exec-failed-1');
      expect(result.data?.status).toBe('failed');
      expect(result.data?.error).toBeDefined();
      expect(result.data?.error).toContain('Intentional test failure');
      expect(result.data?.completedAt).toBeDefined();
    });

    it('should get status of running execution', async () => {
      const handler = createGetWorkflowStatusHandler(mockEngine as any);
      const result = await handler({
        executionId: 'exec-running-1',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.executionId).toBe('exec-running-1');
      expect(result.data?.status).toBe('running');
      expect(result.data?.progress).toBe(50);
      expect(result.data?.completedAt).toBeUndefined();
      expect(result.data?.duration).toBeUndefined();
    });

    it('should reject invalid execution ID', async () => {
      const handler = createGetWorkflowStatusHandler(mockEngine as any);
      const result = await handler({
        executionId: 'non-existent-execution',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Execution not found');
      expect(result.error).toContain('non-existent-execution');
    });

    it('should reject empty execution ID', async () => {
      const handler = createGetWorkflowStatusHandler(mockEngine as any);
      const result = await handler({
        executionId: '',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid executionId');
    });

    it('should include file event details when available', async () => {
      const handler = createGetWorkflowStatusHandler(mockEngine as any);
      const result = await handler({
        executionId: 'exec-running-1',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      // File event might be undefined for manual triggers
      if (result.data?.fileEvent) {
        expect(result.data.fileEvent.type).toBeDefined();
        expect(result.data.fileEvent.path).toBeDefined();
      }
    });
  });

  describe('get_workflow_history Tool', () => {
    it('should get history for all workflows', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const result = await handler({});

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.executions).toBeDefined();
      expect(Array.isArray(result.data?.executions)).toBe(true);
      expect(result.data?.totalCount).toBeGreaterThan(0);
      expect(result.data?.filteredCount).toBeGreaterThan(0);
      expect(result.data?.filters).toBeDefined();
    });

    it('should filter history by workflow ID', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const result = await handler({
        workflowId: 'test-workflow-1',
      });

      expect(result.success).toBe(true);
      expect(result.data?.executions).toBeDefined();
      expect(result.data?.executions.every((e: any) => e.workflowId === 'test-workflow-1')).toBe(true);
      expect(result.data?.filters.workflowId).toBe('test-workflow-1');
    });

    it('should apply limit parameter', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const result = await handler({
        limit: 2,
      });

      expect(result.success).toBe(true);
      expect(result.data?.executions).toBeDefined();
      expect(result.data?.executions.length).toBeLessThanOrEqual(2);
      expect(result.data?.filters.limit).toBe(2);
    });

    it('should enforce minimum limit of 1', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const result = await handler({
        limit: 0,
      });

      expect(result.success).toBe(true);
      expect(result.data?.filters.limit).toBe(1);
    });

    it('should enforce maximum limit of 100', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const result = await handler({
        limit: 200,
      });

      expect(result.success).toBe(true);
      expect(result.data?.filters.limit).toBe(100);
    });

    it('should default to limit of 10', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const result = await handler({});

      expect(result.success).toBe(true);
      expect(result.data?.filters.limit).toBe(10);
    });

    it('should filter by since timestamp', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const sinceDate = new Date(Date.now() - 3600000); // 1 hour ago
      const result = await handler({
        since: sinceDate.toISOString(),
      });

      expect(result.success).toBe(true);
      expect(result.data?.executions).toBeDefined();
      expect(result.data?.filters.since).toBe(sinceDate.toISOString());

      // All executions should be after the since date
      result.data?.executions.forEach((exec: any) => {
        const executionDate = new Date(exec.startedAt);
        expect(executionDate.getTime()).toBeGreaterThanOrEqual(sinceDate.getTime());
      });
    });

    it('should reject invalid since timestamp', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const result = await handler({
        since: 'invalid-date',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid since timestamp');
    });

    it('should return executions in descending order by time', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const result = await handler({
        limit: 100,
      });

      expect(result.success).toBe(true);
      expect(result.data?.executions).toBeDefined();

      const executions = result.data?.executions;
      if (executions && executions.length > 1) {
        for (let i = 0; i < executions.length - 1; i++) {
          const current = new Date(executions[i].startedAt).getTime();
          const next = new Date(executions[i + 1].startedAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    it('should include all execution metadata', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const result = await handler({});

      expect(result.success).toBe(true);
      expect(result.data?.executions).toBeDefined();

      const execution = result.data?.executions[0];
      if (execution) {
        expect(execution.executionId).toBeDefined();
        expect(execution.workflowId).toBeDefined();
        expect(execution.workflowName).toBeDefined();
        expect(execution.trigger).toBeDefined();
        expect(execution.status).toBeDefined();
        expect(execution.startedAt).toBeDefined();
      }
    });

    it('should combine workflowId and since filters', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const sinceDate = new Date(Date.now() - 3600000);
      const result = await handler({
        workflowId: 'test-workflow-1',
        since: sinceDate.toISOString(),
      });

      expect(result.success).toBe(true);
      expect(result.data?.executions).toBeDefined();
      expect(result.data?.executions.every((e: any) => e.workflowId === 'test-workflow-1')).toBe(true);

      result.data?.executions.forEach((exec: any) => {
        const executionDate = new Date(exec.startedAt);
        expect(executionDate.getTime()).toBeGreaterThanOrEqual(sinceDate.getTime());
      });
    });

    it('should return counts for filtering context', async () => {
      const handler = createGetWorkflowHistoryHandler(mockEngine as any);
      const result = await handler({
        limit: 1,
      });

      expect(result.success).toBe(true);
      expect(result.data?.totalCount).toBeDefined();
      expect(result.data?.filteredCount).toBeDefined();
      expect(typeof result.data?.totalCount).toBe('number');
      expect(typeof result.data?.filteredCount).toBe('number');
    });
  });

  describe('Integration Tests', () => {
    it('should trigger workflow and retrieve its status', async () => {
      const triggerHandler = createTriggerWorkflowHandler(mockEngine as any);
      const statusHandler = createGetWorkflowStatusHandler(mockEngine as any);

      // Trigger workflow
      const triggerResult = await triggerHandler({
        workflowId: 'test-workflow-1',
        async: false,
      });

      expect(triggerResult.success).toBe(true);
      const executionId = triggerResult.data?.executionId;
      expect(executionId).toBeDefined();

      // Get status
      const statusResult = await statusHandler({
        executionId: executionId!,
      });

      expect(statusResult.success).toBe(true);
      expect(statusResult.data?.executionId).toBe(executionId);
      expect(statusResult.data?.status).toBe('completed');
    });

    it('should trigger workflow and find it in history', async () => {
      const triggerHandler = createTriggerWorkflowHandler(mockEngine as any);
      const historyHandler = createGetWorkflowHistoryHandler(mockEngine as any);

      // Trigger workflow
      const triggerResult = await triggerHandler({
        workflowId: 'test-workflow-2',
        async: false,
      });

      expect(triggerResult.success).toBe(true);
      const executionId = triggerResult.data?.executionId;

      // Get history
      const historyResult = await historyHandler({
        workflowId: 'test-workflow-2',
      });

      expect(historyResult.success).toBe(true);
      const hasExecution = historyResult.data?.executions.some(
        (e: any) => e.executionId === executionId
      );
      expect(hasExecution).toBe(true);
    });

    it('should list workflows and trigger one from the list', async () => {
      const listHandler = createListWorkflowsHandler(mockEngine as any);
      const triggerHandler = createTriggerWorkflowHandler(mockEngine as any);

      // List enabled workflows
      const listResult = await listHandler({
        enabled: true,
      });

      expect(listResult.success).toBe(true);
      expect(listResult.data?.workflows.length).toBeGreaterThan(0);

      // Find a non-failing workflow to trigger
      const workflowId = listResult.data?.workflows.find(
        (w: any) => w.id !== 'test-workflow-failing'
      )?.id || 'test-workflow-1';

      // Trigger the workflow
      const triggerResult = await triggerHandler({
        workflowId,
        async: false,
      });

      expect(triggerResult.success).toBe(true);
      expect(triggerResult.data?.workflowId).toBe(workflowId);
    });
  });
});
