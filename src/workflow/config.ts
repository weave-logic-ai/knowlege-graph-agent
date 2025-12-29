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
export function createWorkflowConfig(): WorkflowConfig {
  const worldType = (process.env.WORKFLOW_WORLD || 'local') as WorkflowConfig['world'];

  switch (worldType) {
    case 'postgres':
      return {
        world: 'postgres',
        postgres: {
          connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/kg_agent',
          schema: 'workflow',
          poolConfig: {
            max: 20,
            idleTimeoutMillis: 30000,
          },
        },
      };
    case 'vercel':
      return {
        world: 'vercel',
        vercel: {
          projectId: process.env.VERCEL_PROJECT_ID,
        },
      };
    default:
      return {
        world: 'local',
        local: {
          dataDir: '.workflow',
        },
      };
  }
}

/**
 * Validates a workflow configuration
 *
 * @param config - The configuration to validate
 * @returns True if valid, throws if invalid
 * @throws Error if configuration is missing required fields
 */
export function validateWorkflowConfig(config: WorkflowConfig): boolean {
  switch (config.world) {
    case 'postgres':
      if (!config.postgres?.connectionString) {
        throw new Error('PostgreSQL configuration requires a connectionString');
      }
      if (!config.postgres?.schema) {
        throw new Error('PostgreSQL configuration requires a schema name');
      }
      break;
    case 'vercel':
      // Vercel config is optional, projectId can be auto-detected
      break;
    case 'local':
      if (!config.local?.dataDir) {
        throw new Error('Local configuration requires a dataDir path');
      }
      break;
    default:
      throw new Error(`Unknown world type: ${config.world}`);
  }
  return true;
}

/**
 * Creates a PostgreSQL World configuration
 *
 * @param connectionString - Database connection string
 * @param options - Optional configuration overrides
 * @returns PostgreSQL workflow configuration
 */
export function createPostgresConfig(
  connectionString: string,
  options?: Partial<Omit<PostgresWorldConfig, 'connectionString'>>
): WorkflowConfig {
  return {
    world: 'postgres',
    postgres: {
      connectionString,
      schema: options?.schema || 'workflow',
      poolConfig: options?.poolConfig || {
        max: 20,
        idleTimeoutMillis: 30000,
      },
    },
  };
}

/**
 * Creates a Vercel World configuration
 *
 * @param projectId - Optional Vercel project ID
 * @returns Vercel workflow configuration
 */
export function createVercelConfig(projectId?: string): WorkflowConfig {
  return {
    world: 'vercel',
    vercel: {
      projectId,
    },
  };
}

/**
 * Creates a Local World configuration
 *
 * @param dataDir - Directory for workflow data storage
 * @returns Local workflow configuration
 */
export function createLocalConfig(dataDir: string = '.workflow'): WorkflowConfig {
  return {
    world: 'local',
    local: {
      dataDir,
    },
  };
}

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
export const defaultConfig: WorkflowConfig = createWorkflowConfig();
