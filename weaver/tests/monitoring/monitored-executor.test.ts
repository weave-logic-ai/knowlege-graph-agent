/**
 * Monitored Executor Tests
 */

import { describe, it, expect } from 'vitest';
import { MonitoredExecutor } from '../../src/workflow-engine/monitored-executor.js';
import type { WorkflowContext } from '../../src/workflow-engine/types.js';

describe('MonitoredExecutor', () => {
  const executor = new MonitoredExecutor();

  describe('Workflow Execution', () => {
    it('should execute successful workflow with monitoring', async () => {
      const context: WorkflowContext = {
        workflowId: 'test-workflow',
        trigger: 'manual',
        triggeredAt: new Date(),
      };

      const result = await executor.executeWorkflow(
        'test-workflow',
        async () => {
          return { success: true, data: 'test-data' };
        },
        context,
        { validate: true, snapshot: false, verify: true }
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ success: true, data: 'test-data' });
    });

    it('should handle workflow execution failure', async () => {
      const context: WorkflowContext = {
        workflowId: 'failing-workflow',
        trigger: 'manual',
        triggeredAt: new Date(),
      };

      const result = await executor.executeWorkflow(
        'failing-workflow',
        async () => {
          throw new Error('Workflow failed');
        },
        context,
        { validate: false, snapshot: false, verify: false }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Workflow failed');
    });

    it('should skip validation when disabled', async () => {
      const context: WorkflowContext = {
        workflowId: 'no-validation',
        trigger: 'manual',
        triggeredAt: new Date(),
      };

      const result = await executor.executeWorkflow(
        'no-validation',
        async () => ({ result: 'ok' }),
        context,
        { validate: false }
      );

      expect(result.success).toBe(true);
      expect(result.validation).toBeUndefined();
    });

    it('should skip verification when disabled', async () => {
      const context: WorkflowContext = {
        workflowId: 'no-verification',
        trigger: 'manual',
        triggeredAt: new Date(),
      };

      const result = await executor.executeWorkflow(
        'no-verification',
        async () => ({ result: 'ok' }),
        context,
        { verify: false }
      );

      expect(result.success).toBe(true);
      expect(result.verification).toBeUndefined();
    });
  });

  describe('Operation Execution', () => {
    it('should execute simple operation', async () => {
      const result = await executor.executeOperation(
        'test-operation',
        async () => {
          return 'operation-result';
        },
        { validate: false, snapshot: false, verify: false }
      );

      expect(result.success).toBe(true);
      expect(result.data).toBe('operation-result');
    });

    it('should handle operation failure', async () => {
      const result = await executor.executeOperation(
        'failing-operation',
        async () => {
          throw new Error('Operation failed');
        },
        { validate: false, snapshot: false, verify: false }
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Operation failed');
    });

    it('should collect metrics for operation', async () => {
      const result = await executor.executeOperation(
        'measured-operation',
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return 'done';
        },
        { validate: false, snapshot: false, verify: true }
      );

      expect(result.verification?.metrics).toBeDefined();
      expect(result.verification?.metrics.duration_ms).toBeGreaterThan(0);
    });
  });
});
