/**
 * Workflow DevKit Configuration
 *
 * Provides configuration management for different execution environments
 * (Worlds) including Postgres, Vercel, and Local persistence options.
 *
 * @module workflow/config
 */
/**
 * PostgreSQL connection pool configuration
 */
export interface PostgresPoolConfig {
    /** Maximum number of connections in the pool */
    max: number;
    /** Time in milliseconds before idle connections are closed */
    idleTimeoutMillis: number;
}
/**
 * PostgreSQL World configuration
 */
export interface PostgresWorldConfig {
    /** Database connection string */
    connectionString: string;
    /** Schema name for workflow tables */
    schema: string;
    /** Connection pool configuration */
    poolConfig?: PostgresPoolConfig;
}
/**
 * Vercel World configuration
 */
export interface VercelWorldConfig {
    /** Vercel project identifier */
    projectId?: string;
}
/**
 * Local World configuration
 */
export interface LocalWorldConfig {
    /** Directory for local workflow data storage */
    dataDir: string;
}
/**
 * Workflow configuration supporting multiple execution environments
 *
 * @example
 * ```typescript
 * // Postgres World
 * const config: WorkflowConfig = {
 *   world: 'postgres',
 *   postgres: {
 *     connectionString: 'postgres://localhost:5432/kg_agent',
 *     schema: 'workflow',
 *   },
 * };
 *
 * // Local World (default)
 * const config: WorkflowConfig = {
 *   world: 'local',
 *   local: {
 *     dataDir: '.workflow',
 *   },
 * };
 * ```
 */
export interface WorkflowConfig {
    /** The execution environment (World) type */
    world: 'postgres' | 'vercel' | 'local';
    /** PostgreSQL configuration (required when world is 'postgres') */
    postgres?: PostgresWorldConfig;
    /** Vercel configuration (required when world is 'vercel') */
    vercel?: VercelWorldConfig;
    /** Local configuration (required when world is 'local') */
    local?: LocalWorldConfig;
}
/**
 * Creates a workflow configuration based on environment variables
 *
 * Environment variables:
 * - `WORKFLOW_WORLD`: The world type ('postgres' | 'vercel' | 'local')
 * - `DATABASE_URL`: PostgreSQL connection string (for postgres world)
 * - `VERCEL_PROJECT_ID`: Vercel project ID (for vercel world)
 *
 * @returns The workflow configuration for the current environment
 *
 * @example
 * ```typescript
 * // Set WORKFLOW_WORLD=postgres and DATABASE_URL before running
 * const config = createWorkflowConfig();
 * console.log(config.world); // 'postgres'
 * ```
 */
export declare function createWorkflowConfig(): WorkflowConfig;
/**
 * Validates a workflow configuration
 *
 * @param config - The configuration to validate
 * @returns True if valid, throws if invalid
 * @throws Error if configuration is missing required fields
 */
export declare function validateWorkflowConfig(config: WorkflowConfig): boolean;
/**
 * Creates a PostgreSQL World configuration
 *
 * @param connectionString - Database connection string
 * @param options - Optional configuration overrides
 * @returns PostgreSQL workflow configuration
 */
export declare function createPostgresConfig(connectionString: string, options?: Partial<Omit<PostgresWorldConfig, 'connectionString'>>): WorkflowConfig;
/**
 * Creates a Vercel World configuration
 *
 * @param projectId - Optional Vercel project ID
 * @returns Vercel workflow configuration
 */
export declare function createVercelConfig(projectId?: string): WorkflowConfig;
/**
 * Creates a Local World configuration
 *
 * @param dataDir - Directory for workflow data storage
 * @returns Local workflow configuration
 */
export declare function createLocalConfig(dataDir?: string): WorkflowConfig;
/**
 * Default workflow configuration based on environment
 *
 * @example
 * ```typescript
 * import { defaultConfig } from './config.js';
 *
 * console.log(defaultConfig.world); // Based on WORKFLOW_WORLD env var
 * ```
 */
export declare const defaultConfig: WorkflowConfig;
//# sourceMappingURL=config.d.ts.map