/**
 * Exochain Audit Configuration
 *
 * Configuration for deterministic logging with DAG-BFT consensus.
 * Supports multiple backends: file, postgres, and memory.
 *
 * @module audit/config
 */

/**
 * Storage backend types for audit chain.
 * - `file`: Local file-based storage with rotation support
 * - `postgres`: PostgreSQL database with schema isolation
 * - `memory`: In-memory storage for testing/development
 */
export type AuditBackend = 'file' | 'postgres' | 'memory';

/**
 * Consensus mechanism types for achieving finality.
 * - `proof-of-learning`: Learning-based consensus for AI agents
 * - `byzantine`: Classical BFT consensus (2f+1 validators)
 * - `raft`: Leader-based consensus for simpler setups
 * - `gossip`: Epidemic-style eventual consistency
 * - `none`: No consensus, single-agent mode
 */
export type ConsensusType = 'proof-of-learning' | 'byzantine' | 'raft' | 'gossip' | 'none';

/**
 * File backend configuration options.
 */
export interface FileBackendConfig {
  /** Directory for storing audit chain data */
  dataDir: string;
  /** Maximum file size in bytes before rotation (default: 10MB) */
  maxFileSize?: number;
  /** Number of events before rotating to new file */
  rotateAfterEvents?: number;
}

/**
 * PostgreSQL backend configuration options.
 */
export interface PostgresBackendConfig {
  /** PostgreSQL connection string */
  connectionString: string;
  /** Database schema for audit tables */
  schema: string;
}

/**
 * Audit chain configuration defining storage, consensus, and syndication settings.
 */
export interface AuditChainConfig {
  /** Storage backend type */
  backend: AuditBackend;
  /** Agent's DID (Decentralized Identifier) for event signing */
  agentDid: string;
  /** Ed25519 private key for signing (64-byte hex string) */
  privateKey?: string;
  /** Enable consensus mechanism for finality */
  enableConsensus: boolean;
  /** Type of consensus mechanism to use */
  consensusType: ConsensusType;
  /** Number of events between checkpoints */
  checkpointInterval: number;
  /** File backend configuration (required if backend is 'file') */
  file?: FileBackendConfig;
  /** PostgreSQL backend configuration (required if backend is 'postgres') */
  postgres?: PostgresBackendConfig;
  /** Peer endpoints for event syndication */
  peers?: string[];
  /** Enable automatic peer syndication */
  enableSyndication: boolean;
  /** Interval between syndication attempts in milliseconds */
  syndicationInterval?: number;
}

/**
 * Default checkpoint interval (every 100 events).
 */
export const DEFAULT_CHECKPOINT_INTERVAL = 100;

/**
 * Default syndication interval (5 minutes).
 */
export const DEFAULT_SYNDICATION_INTERVAL = 5 * 60 * 1000;

/**
 * Default maximum file size for file backend (10MB).
 */
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Default number of events before file rotation.
 */
export const DEFAULT_ROTATE_AFTER_EVENTS = 10000;

/**
 * Generate a default DID for the agent based on timestamp and random component.
 *
 * @returns A unique DID string in the format `did:exo:agent-{timestamp}{random}`
 *
 * @example
 * ```typescript
 * const did = generateDefaultDid();
 * // did:exo:agent-m1abc123xyz
 * ```
 */
function generateDefaultDid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `did:exo:agent-${timestamp}${random}`;
}

/**
 * Create audit chain configuration from environment variables.
 *
 * Environment variables:
 * - `EXOCHAIN_BACKEND`: Storage backend (file|postgres|memory)
 * - `EXOCHAIN_AGENT_DID`: Agent's decentralized identifier
 * - `EXOCHAIN_PRIVATE_KEY`: Ed25519 private key for signing
 * - `EXOCHAIN_ENABLE_CONSENSUS`: Enable consensus (true|false)
 * - `EXOCHAIN_CONSENSUS_TYPE`: Consensus mechanism type
 * - `EXOCHAIN_CHECKPOINT_INTERVAL`: Events between checkpoints
 * - `EXOCHAIN_ENABLE_SYNDICATION`: Enable peer syndication
 * - `EXOCHAIN_SYNDICATION_INTERVAL`: Syndication interval in ms
 * - `EXOCHAIN_PEER_ENDPOINTS`: Comma-separated peer URLs
 * - `EXOCHAIN_DATA_DIR`: Data directory for file backend
 * - `EXOCHAIN_MAX_FILE_SIZE`: Max file size for file backend
 * - `EXOCHAIN_ROTATE_AFTER_EVENTS`: Events before file rotation
 * - `DATABASE_URL`: PostgreSQL connection string
 * - `EXOCHAIN_SCHEMA`: PostgreSQL schema name
 *
 * @returns Fully populated AuditChainConfig
 *
 * @example
 * ```typescript
 * // Set environment variables
 * process.env.EXOCHAIN_BACKEND = 'file';
 * process.env.EXOCHAIN_DATA_DIR = './audit-data';
 *
 * const config = createAuditChainConfig();
 * ```
 */
export function createAuditChainConfig(): AuditChainConfig {
  const backend = (process.env.EXOCHAIN_BACKEND || 'memory') as AuditBackend;

  const baseConfig: AuditChainConfig = {
    backend,
    agentDid: process.env.EXOCHAIN_AGENT_DID || generateDefaultDid(),
    privateKey: process.env.EXOCHAIN_PRIVATE_KEY,
    enableConsensus: process.env.EXOCHAIN_ENABLE_CONSENSUS === 'true',
    consensusType: (process.env.EXOCHAIN_CONSENSUS_TYPE || 'none') as ConsensusType,
    checkpointInterval: parseInt(
      process.env.EXOCHAIN_CHECKPOINT_INTERVAL || String(DEFAULT_CHECKPOINT_INTERVAL),
      10
    ),
    enableSyndication: process.env.EXOCHAIN_ENABLE_SYNDICATION === 'true',
    syndicationInterval: parseInt(
      process.env.EXOCHAIN_SYNDICATION_INTERVAL || String(DEFAULT_SYNDICATION_INTERVAL),
      10
    ),
    peers: process.env.EXOCHAIN_PEER_ENDPOINTS?.split(',').filter(Boolean) || [],
  };

  switch (backend) {
    case 'file':
      return {
        ...baseConfig,
        file: {
          dataDir: process.env.EXOCHAIN_DATA_DIR || '.exochain',
          maxFileSize: parseInt(
            process.env.EXOCHAIN_MAX_FILE_SIZE || String(DEFAULT_MAX_FILE_SIZE),
            10
          ),
          rotateAfterEvents: parseInt(
            process.env.EXOCHAIN_ROTATE_AFTER_EVENTS || String(DEFAULT_ROTATE_AFTER_EVENTS),
            10
          ),
        },
      };
    case 'postgres':
      return {
        ...baseConfig,
        postgres: {
          connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/kg_agent',
          schema: process.env.EXOCHAIN_SCHEMA || 'exochain',
        },
      };
    default:
      return baseConfig;
  }
}

/**
 * Validation result for audit chain configuration.
 */
export interface ConfigValidationResult {
  /** Whether the configuration is valid */
  valid: boolean;
  /** List of validation error messages */
  errors: string[];
}

/**
 * Validate audit chain configuration for completeness and consistency.
 *
 * @param config - The configuration to validate
 * @returns Validation result with errors if invalid
 *
 * @example
 * ```typescript
 * const config = createAuditChainConfig();
 * const result = validateAuditChainConfig(config);
 *
 * if (!result.valid) {
 *   console.error('Configuration errors:', result.errors);
 * }
 * ```
 */
export function validateAuditChainConfig(config: AuditChainConfig): ConfigValidationResult {
  const errors: string[] = [];

  // Required field validation
  if (!config.agentDid) {
    errors.push('Agent DID is required');
  } else if (!config.agentDid.startsWith('did:')) {
    errors.push('Agent DID must be a valid DID (starting with "did:")');
  }

  // Backend-specific validation
  if (config.backend === 'file') {
    if (!config.file?.dataDir) {
      errors.push('File data directory is required for file backend');
    }
    if (config.file?.maxFileSize !== undefined && config.file.maxFileSize <= 0) {
      errors.push('Max file size must be positive');
    }
    if (config.file?.rotateAfterEvents !== undefined && config.file.rotateAfterEvents <= 0) {
      errors.push('Rotate after events must be positive');
    }
  }

  if (config.backend === 'postgres') {
    if (!config.postgres?.connectionString) {
      errors.push('PostgreSQL connection string is required for postgres backend');
    }
    if (!config.postgres?.schema) {
      errors.push('PostgreSQL schema is required for postgres backend');
    }
  }

  // Consensus validation
  if (config.enableConsensus && config.consensusType === 'none') {
    errors.push('Consensus type must be specified when consensus is enabled');
  }

  // Syndication validation
  if (config.enableSyndication && (!config.peers || config.peers.length === 0)) {
    errors.push('At least one peer is required for syndication');
  }

  // Interval validation
  if (config.checkpointInterval <= 0) {
    errors.push('Checkpoint interval must be positive');
  }

  if (config.syndicationInterval !== undefined && config.syndicationInterval <= 0) {
    errors.push('Syndication interval must be positive');
  }

  // Private key validation (if provided)
  if (config.privateKey !== undefined) {
    if (!/^[0-9a-fA-F]{128}$/.test(config.privateKey)) {
      errors.push('Private key must be a 64-byte hex string (128 characters)');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Default configuration created from environment variables.
 * This is a convenience export for simple use cases.
 */
export const defaultConfig = createAuditChainConfig();
