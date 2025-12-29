/**
 * Database Schemas
 *
 * Exports SQL schema definitions for PostgreSQL integration.
 * Provides utilities for loading and managing RuVector and Exochain schemas.
 *
 * @module database/schemas
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the directory name for ES modules
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Schema names supported by the system
 */
export type SchemaName = 'ruvector' | 'exochain';

/**
 * Schema file mapping
 */
const SCHEMA_FILES: Record<SchemaName, string> = {
  ruvector: 'ruvector-schema.sql',
  exochain: 'exochain-schema.sql',
};

/**
 * Load a SQL schema file from disk
 *
 * @param name - The schema name to load ('ruvector' or 'exochain')
 * @returns The SQL schema content as a string
 * @throws Error if the schema file cannot be read
 *
 * @example
 * ```typescript
 * const ruvectorSchema = loadSchema('ruvector');
 * await pgClient.query(ruvectorSchema);
 * ```
 */
export function loadSchema(name: SchemaName): string {
  const filename = SCHEMA_FILES[name];
  if (!filename) {
    throw new Error(`Unknown schema name: ${name}`);
  }

  const filePath = join(__dirname, filename);

  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to load schema '${name}' from ${filePath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get all available schemas
 *
 * @returns A record mapping schema names to their SQL content
 *
 * @example
 * ```typescript
 * const schemas = getAllSchemas();
 * for (const [name, sql] of Object.entries(schemas)) {
 *   console.log(`Loading schema: ${name}`);
 *   await pgClient.query(sql);
 * }
 * ```
 */
export function getAllSchemas(): Record<SchemaName, string> {
  return {
    ruvector: loadSchema('ruvector'),
    exochain: loadSchema('exochain'),
  };
}

/**
 * Check if a schema name is valid
 *
 * @param name - The schema name to validate
 * @returns True if the schema name is valid
 *
 * @example
 * ```typescript
 * if (isValidSchemaName('ruvector')) {
 *   const schema = loadSchema('ruvector');
 * }
 * ```
 */
export function isValidSchemaName(name: string): name is SchemaName {
  return name in SCHEMA_FILES;
}

/**
 * Get the list of available schema names
 *
 * @returns Array of available schema names
 *
 * @example
 * ```typescript
 * const names = getSchemaNames(); // ['ruvector', 'exochain']
 * ```
 */
export function getSchemaNames(): SchemaName[] {
  return Object.keys(SCHEMA_FILES) as SchemaName[];
}

/**
 * RuVector schema SQL (inline for bundled distribution)
 *
 * This constant provides a minimal inline version of the RuVector schema
 * for use cases where file system access is not available (e.g., bundled builds).
 *
 * For the full schema with all functions and triggers, use loadSchema('ruvector').
 */
export const RUVECTOR_SCHEMA = `
-- Inline RuVector schema for bundled distribution
CREATE SCHEMA IF NOT EXISTS ruvector;

CREATE TABLE IF NOT EXISTS ruvector.embeddings (
  id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL,
  embedding REAL[] NOT NULL,
  dimensions INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_node_type
ON ruvector.embeddings(node_type);

CREATE INDEX IF NOT EXISTS idx_embeddings_metadata
ON ruvector.embeddings USING GIN (metadata);

CREATE TABLE IF NOT EXISTS ruvector.trajectories (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  workflow_id TEXT,
  steps JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  success BOOLEAN DEFAULT FALSE,
  total_duration INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_trajectories_agent_id
ON ruvector.trajectories(agent_id);

CREATE INDEX IF NOT EXISTS idx_trajectories_workflow_id
ON ruvector.trajectories(workflow_id);

CREATE INDEX IF NOT EXISTS idx_trajectories_success
ON ruvector.trajectories(success);

CREATE TABLE IF NOT EXISTS ruvector.patterns (
  id TEXT PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  actions TEXT[] NOT NULL,
  frequency INTEGER DEFAULT 1,
  avg_duration REAL DEFAULT 0,
  success_rate REAL DEFAULT 0,
  confidence REAL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patterns_type
ON ruvector.patterns(pattern_type);

CREATE INDEX IF NOT EXISTS idx_patterns_confidence
ON ruvector.patterns(confidence);

CREATE TABLE IF NOT EXISTS ruvector.learning_records (
  id SERIAL PRIMARY KEY,
  trajectory_id TEXT NOT NULL REFERENCES ruvector.trajectories(id),
  pattern_id TEXT NOT NULL REFERENCES ruvector.patterns(id),
  pattern_type TEXT NOT NULL,
  confidence REAL NOT NULL,
  learned_at TIMESTAMPTZ DEFAULT NOW(),
  applied_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_learning_records_pattern
ON ruvector.learning_records(pattern_id);

CREATE TABLE IF NOT EXISTS ruvector.graph_nodes (
  id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  embedding_id TEXT REFERENCES ruvector.embeddings(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_type
ON ruvector.graph_nodes(node_type);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_properties
ON ruvector.graph_nodes USING GIN (properties);

CREATE TABLE IF NOT EXISTS ruvector.graph_edges (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES ruvector.graph_nodes(id),
  target_id TEXT NOT NULL REFERENCES ruvector.graph_nodes(id),
  edge_type TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graph_edges_source
ON ruvector.graph_edges(source_id);

CREATE INDEX IF NOT EXISTS idx_graph_edges_target
ON ruvector.graph_edges(target_id);

CREATE INDEX IF NOT EXISTS idx_graph_edges_type
ON ruvector.graph_edges(edge_type);
`;

/**
 * Exochain schema SQL (inline for bundled distribution)
 *
 * This constant provides a minimal inline version of the Exochain schema
 * for use cases where file system access is not available (e.g., bundled builds).
 *
 * For the full schema with all functions and triggers, use loadSchema('exochain').
 */
export const EXOCHAIN_SCHEMA = `
-- Inline Exochain schema for bundled distribution
CREATE SCHEMA IF NOT EXISTS exochain;

CREATE TABLE IF NOT EXISTS exochain.events (
  id TEXT PRIMARY KEY,
  parents TEXT[] DEFAULT '{}',
  hlc_physical_ms BIGINT NOT NULL,
  hlc_logical INTEGER NOT NULL,
  author TEXT NOT NULL,
  payload_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_author
ON exochain.events(author);

CREATE INDEX IF NOT EXISTS idx_events_payload_type
ON exochain.events(payload_type);

CREATE INDEX IF NOT EXISTS idx_events_hlc
ON exochain.events(hlc_physical_ms, hlc_logical);

CREATE INDEX IF NOT EXISTS idx_events_parents
ON exochain.events USING GIN (parents);

CREATE TABLE IF NOT EXISTS exochain.checkpoints (
  height INTEGER PRIMARY KEY,
  event_root TEXT NOT NULL,
  state_root TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exochain.checkpoint_signatures (
  id SERIAL PRIMARY KEY,
  checkpoint_height INTEGER NOT NULL REFERENCES exochain.checkpoints(height),
  validator_did TEXT NOT NULL,
  signature TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(checkpoint_height, validator_did)
);

CREATE INDEX IF NOT EXISTS idx_checkpoint_signatures_height
ON exochain.checkpoint_signatures(checkpoint_height);

CREATE TABLE IF NOT EXISTS exochain.tips (
  event_id TEXT PRIMARY KEY REFERENCES exochain.events(id),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exochain.peers (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  did TEXT,
  status TEXT DEFAULT 'disconnected',
  last_sync_time TIMESTAMPTZ,
  last_checkpoint_height INTEGER,
  events_received INTEGER DEFAULT 0,
  events_sent INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_peers_status
ON exochain.peers(status);

CREATE TABLE IF NOT EXISTS exochain.sync_log (
  id SERIAL PRIMARY KEY,
  peer_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  events_transferred INTEGER DEFAULT 0,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_log_peer
ON exochain.sync_log(peer_id);

CREATE INDEX IF NOT EXISTS idx_sync_log_started_at
ON exochain.sync_log(started_at);
`;
