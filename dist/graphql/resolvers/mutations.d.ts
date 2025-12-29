/**
 * GraphQL Mutation Resolvers
 *
 * Implements all mutation operations for the knowledge-graph-agent GraphQL API.
 * Validates inputs with zod schemas, emits events for subscriptions, and
 * integrates with database and services.
 *
 * @module graphql/resolvers/mutations
 */
import type { ResolverContext } from './queries.js';
/**
 * Extended context for mutations with all required services.
 * Uses ResolverContext as base but adds mutation-specific services.
 */
export type MutationContext = ResolverContext;
export declare const mutationResolvers: {
    /**
     * Create a new knowledge node
     */
    createNode: (_parent: unknown, args: {
        input: unknown;
    }, context: MutationContext) => Promise<unknown>;
    /**
     * Update an existing node
     */
    updateNode: (_parent: unknown, args: {
        id: string;
        input: unknown;
    }, context: MutationContext) => Promise<unknown>;
    /**
     * Delete a node
     */
    deleteNode: (_parent: unknown, args: {
        id: string;
    }, context: MutationContext) => Promise<{
        success: boolean;
        id: string;
        error: string | null;
    }>;
    /**
     * Create a new relation (edge) between nodes
     */
    createRelation: (_parent: unknown, args: {
        input: unknown;
    }, context: MutationContext) => Promise<{
        id: string;
        source: string;
        target: string;
        type: "LINK" | "REFERENCE" | "PARENT" | "RELATED";
        weight: number;
        context: string | undefined;
        sourceNode: unknown;
        targetNode: unknown;
    }>;
    /**
     * Delete a relation
     */
    deleteRelation: (_parent: unknown, args: {
        id: string;
    }, context: MutationContext) => Promise<{
        success: boolean;
        id: string;
        error: string | null;
    }>;
    /**
     * Add a tag to a node
     */
    addTag: (_parent: unknown, args: {
        nodeId: string;
        tag: string;
    }, context: MutationContext) => Promise<unknown>;
    /**
     * Remove a tag from a node
     */
    removeTag: (_parent: unknown, args: {
        nodeId: string;
        tag: string;
    }, context: MutationContext) => Promise<unknown>;
    /**
     * Spawn a new agent
     */
    spawnAgent: (_parent: unknown, args: {
        input: unknown;
    }, context: MutationContext) => Promise<{
        id: string;
        name: string;
        type: "RESEARCHER" | "CODER" | "TESTER" | "ANALYST" | "ARCHITECT" | "REVIEWER" | "COORDINATOR" | "OPTIMIZER" | "DOCUMENTER" | "CUSTOM";
        description: string | undefined;
        status: string;
        capabilities: string[];
        currentTask: null;
        queuedTaskCount: number;
        completedTaskCount: number;
        errorCount: number;
        lastActivity: string;
        health: {
            healthy: boolean;
            status: string;
            lastHeartbeat: string;
            error: null;
            memoryUsage: number;
        };
        config: {
            maxConcurrentTasks: number;
            taskTimeout: number;
            retry: {
                maxRetries: number;
                backoffMs: number;
                backoffMultiplier?: number | undefined;
            } | null;
            claudeFlowEnabled: boolean;
            metadata: Record<string, unknown> | null;
        };
        metrics: null;
    }>;
    /**
     * Start a workflow execution
     */
    startWorkflow: (_parent: unknown, args: {
        input: unknown;
    }, context: MutationContext) => Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        workflowId: string;
        workflow: {
            id: string;
            name: string;
            description: string | undefined;
            version: string;
            steps: {
                id: string;
                name: string;
                description: string | undefined;
                dependencies: string[] | undefined;
                timeout: number | undefined;
                retries: number | undefined;
                parallel: boolean;
                optional: boolean;
                metadata: Record<string, unknown> | undefined;
            }[];
            timeout: number | undefined;
            enableRollback: boolean;
            tags: string[];
            metadata: Record<string, unknown> | undefined;
        };
        status: string;
        input: Record<string, unknown> | undefined;
        output: null;
        state: {};
        steps: never[];
        error: null;
        errorStack: null;
        createdAt: string;
        startedAt: string;
        completedAt: null;
        durationMs: number;
        progress: number;
        currentStep: string;
        rolledBack: boolean;
    }>;
    /**
     * Cancel a running workflow
     */
    cancelWorkflow: (_parent: unknown, args: {
        id: string;
    }, context: MutationContext) => Promise<{
        id: string;
        workflowId: string;
        workflow: null;
        status: string;
        input: unknown;
        output: null;
        state: Record<string, unknown>;
        steps: {
            stepId: string;
            status: string;
            result: unknown;
            error: string | undefined;
            startedAt: string | undefined;
            completedAt: string | undefined;
            durationMs: number | undefined;
            attempts: number;
            skipped: boolean;
            skipReason: string | undefined;
        }[];
        error: string;
        errorStack: null;
        createdAt: string;
        startedAt: string | null;
        completedAt: string;
        durationMs: number;
        progress: number;
        currentStep: null;
        rolledBack: boolean;
    }>;
    /**
     * Clear the cache
     */
    clearCache: (_parent: unknown, _args: unknown, context: MutationContext) => Promise<{
        success: boolean;
        entriesCleared: number;
        message: string;
    }>;
    /**
     * Create a checkpoint of the current graph state
     */
    createCheckpoint: (_parent: unknown, args: {
        input: unknown;
    }, context: MutationContext) => Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        name: string;
        description: string | undefined;
        createdAt: string;
        nodeCount: number;
        edgeCount: number;
        size: number;
        metadata: Record<string, unknown> | undefined;
    }>;
    /**
     * Upsert a vector embedding
     */
    vectorUpsert: (_parent: unknown, args: {
        input: unknown;
    }, context: MutationContext) => Promise<{
        success: boolean;
        id: string;
        dimensions: number;
        isUpdate: boolean;
        namespace: string | null;
    }>;
    /**
     * Record an agent trajectory for learning
     */
    recordTrajectory: (_parent: unknown, args: {
        input: unknown;
    }, context: MutationContext) => Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        agentId: string;
        workflowId: string | null;
        steps: {
            action: string;
            state: Record<string, unknown>;
            outcome: string;
            duration: number;
            timestamp: string;
            metadata: Record<string, unknown> | undefined;
        }[];
        startedAt: string;
        completedAt: string;
        success: boolean;
        totalDuration: number;
        metadata: Record<string, unknown> | null;
    }>;
};
export default mutationResolvers;
//# sourceMappingURL=mutations.d.ts.map