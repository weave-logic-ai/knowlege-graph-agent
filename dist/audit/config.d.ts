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
export declare const DEFAULT_CHECKPOINT_INTERVAL = 100;
/**
 * Default syndication interval (5 minutes).
 */
export declare const DEFAULT_SYNDICATION_INTERVAL: number;
/**
 * Default maximum file size for file backend (10MB).
 */
export declare const DEFAULT_MAX_FILE_SIZE: number;
/**
 * Default number of events before file rotation.
 */
export declare const DEFAULT_ROTATE_AFTER_EVENTS = 10000;
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
export declare function createAuditChainConfig(): AuditChainConfig;
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
export declare function validateAuditChainConfig(config: AuditChainConfig): ConfigValidationResult;
/**
 * Default configuration created from environment variables.
 * This is a convenience export for simple use cases.
 */
export declare const defaultConfig: AuditChainConfig;
//# sourceMappingURL=config.d.ts.map