/**
 * Workflow Registry
 *
 * Manages workflow definitions, execution, and history tracking.
 * Supports step dependencies, parallel execution, and rollback.
 *
 * @module workflows/registry
 */
import { type WorkflowDefinition, type WorkflowExecution, type WorkflowResult, type WorkflowRegistryOptions, type WorkflowListOptions, type ExecutionHistoryOptions, type WorkflowEventType, type WorkflowEventListener } from './types.js';
/**
 * Workflow Registry
 *
 * Central registry for managing workflow definitions and executions.
 *
 * @example
 * ```typescript
 * const registry = new WorkflowRegistry();
 *
 * // Register a workflow
 * registry.register({
 *   id: 'sync-workflow',
 *   name: 'Sync Knowledge Graph',
 *   version: '1.0.0',
 *   steps: [
 *     {
 *       id: 'analyze',
 *       name: 'Analyze Changes',
 *       handler: async (input, ctx) => {
 *         // Analyze logic
 *         return { changes: [] };
 *       },
 *     },
 *     {
 *       id: 'sync',
 *       name: 'Sync to Memory',
 *       dependencies: ['analyze'],
 *       handler: async (input, ctx) => {
 *         const analysis = ctx.previousResults.get('analyze');
 *         // Sync logic
 *       },
 *     },
 *   ],
 * });
 *
 * // Execute workflow
 * const result = await registry.execute('sync-workflow', { projectRoot: '.' });
 * ```
 */
export declare class WorkflowRegistry {
    private workflows;
    private executions;
    private history;
    private activeExecutions;
    private eventListeners;
    private abortControllers;
    private options;
    constructor(options?: WorkflowRegistryOptions);
    /**
     * Register a workflow definition
     */
    register<TInput = unknown, TOutput = unknown>(workflow: WorkflowDefinition<TInput, TOutput>): void;
    /**
     * Unregister a workflow definition
     */
    unregister(workflowId: string): boolean;
    /**
     * Get a workflow definition by ID
     */
    get<TInput = unknown, TOutput = unknown>(workflowId: string): WorkflowDefinition<TInput, TOutput> | undefined;
    /**
     * List all registered workflows
     */
    list(options?: WorkflowListOptions): WorkflowDefinition[];
    /**
     * Execute a workflow
     */
    execute<TInput = unknown, TOutput = unknown>(workflowId: string, input: TInput, options?: {
        metadata?: Record<string, unknown>;
    }): Promise<WorkflowResult<TOutput>>;
    /**
     * Cancel a running workflow execution
     */
    cancel(executionId: string): boolean;
    /**
     * Get execution by ID
     */
    getExecution(executionId: string): WorkflowExecution | undefined;
    /**
     * Get execution history
     */
    getHistory(options?: ExecutionHistoryOptions): WorkflowExecution[];
    /**
     * Add event listener
     */
    on(event: WorkflowEventType | '*', listener: WorkflowEventListener): void;
    /**
     * Remove event listener
     */
    off(event: WorkflowEventType | '*', listener: WorkflowEventListener): void;
    /**
     * Clear all executions and history
     */
    clear(): void;
    private validateWorkflow;
    private checkCircularDependencies;
    private executeSteps;
    private executeStep;
    private rollback;
    private executeWithTimeout;
    private sleep;
    private createResult;
    private emitEvent;
}
/**
 * Create a workflow registry instance
 */
export declare function createWorkflowRegistry(options?: WorkflowRegistryOptions): WorkflowRegistry;
//# sourceMappingURL=registry.d.ts.map