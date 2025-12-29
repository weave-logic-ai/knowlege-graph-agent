/**
 * Database Schemas
 *
 * Exports SQL schema definitions for PostgreSQL integration.
 * Provides utilities for loading and managing RuVector and Exochain schemas.
 *
 * @module database/schemas
 */
/**
 * Schema names supported by the system
 */
export type SchemaName = 'ruvector' | 'exochain';
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
export declare function loadSchema(name: SchemaName): string;
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
export declare function getAllSchemas(): Record<SchemaName, string>;
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
export declare function isValidSchemaName(name: string): name is SchemaName;
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
export declare function getSchemaNames(): SchemaName[];
/**
 * RuVector schema SQL (inline for bundled distribution)
 *
 * This constant provides a minimal inline version of the RuVector schema
 * for use cases where file system access is not available (e.g., bundled builds).
 *
 * For the full schema with all functions and triggers, use loadSchema('ruvector').
 */
export declare const RUVECTOR_SCHEMA = "\n-- Inline RuVector schema for bundled distribution\nCREATE SCHEMA IF NOT EXISTS ruvector;\n\nCREATE TABLE IF NOT EXISTS ruvector.embeddings (\n  id TEXT PRIMARY KEY,\n  node_type TEXT NOT NULL,\n  embedding REAL[] NOT NULL,\n  dimensions INTEGER NOT NULL,\n  metadata JSONB DEFAULT '{}',\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE INDEX IF NOT EXISTS idx_embeddings_node_type\nON ruvector.embeddings(node_type);\n\nCREATE INDEX IF NOT EXISTS idx_embeddings_metadata\nON ruvector.embeddings USING GIN (metadata);\n\nCREATE TABLE IF NOT EXISTS ruvector.trajectories (\n  id TEXT PRIMARY KEY,\n  agent_id TEXT NOT NULL,\n  workflow_id TEXT,\n  steps JSONB DEFAULT '[]',\n  started_at TIMESTAMPTZ NOT NULL,\n  completed_at TIMESTAMPTZ,\n  success BOOLEAN DEFAULT FALSE,\n  total_duration INTEGER DEFAULT 0,\n  metadata JSONB DEFAULT '{}'\n);\n\nCREATE INDEX IF NOT EXISTS idx_trajectories_agent_id\nON ruvector.trajectories(agent_id);\n\nCREATE INDEX IF NOT EXISTS idx_trajectories_workflow_id\nON ruvector.trajectories(workflow_id);\n\nCREATE INDEX IF NOT EXISTS idx_trajectories_success\nON ruvector.trajectories(success);\n\nCREATE TABLE IF NOT EXISTS ruvector.patterns (\n  id TEXT PRIMARY KEY,\n  pattern_type TEXT NOT NULL,\n  actions TEXT[] NOT NULL,\n  frequency INTEGER DEFAULT 1,\n  avg_duration REAL DEFAULT 0,\n  success_rate REAL DEFAULT 0,\n  confidence REAL DEFAULT 0,\n  metadata JSONB DEFAULT '{}',\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE INDEX IF NOT EXISTS idx_patterns_type\nON ruvector.patterns(pattern_type);\n\nCREATE INDEX IF NOT EXISTS idx_patterns_confidence\nON ruvector.patterns(confidence);\n\nCREATE TABLE IF NOT EXISTS ruvector.learning_records (\n  id SERIAL PRIMARY KEY,\n  trajectory_id TEXT NOT NULL REFERENCES ruvector.trajectories(id),\n  pattern_id TEXT NOT NULL REFERENCES ruvector.patterns(id),\n  pattern_type TEXT NOT NULL,\n  confidence REAL NOT NULL,\n  learned_at TIMESTAMPTZ DEFAULT NOW(),\n  applied_count INTEGER DEFAULT 0\n);\n\nCREATE INDEX IF NOT EXISTS idx_learning_records_pattern\nON ruvector.learning_records(pattern_id);\n\nCREATE TABLE IF NOT EXISTS ruvector.graph_nodes (\n  id TEXT PRIMARY KEY,\n  node_type TEXT NOT NULL,\n  properties JSONB DEFAULT '{}',\n  embedding_id TEXT REFERENCES ruvector.embeddings(id),\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE INDEX IF NOT EXISTS idx_graph_nodes_type\nON ruvector.graph_nodes(node_type);\n\nCREATE INDEX IF NOT EXISTS idx_graph_nodes_properties\nON ruvector.graph_nodes USING GIN (properties);\n\nCREATE TABLE IF NOT EXISTS ruvector.graph_edges (\n  id TEXT PRIMARY KEY,\n  source_id TEXT NOT NULL REFERENCES ruvector.graph_nodes(id),\n  target_id TEXT NOT NULL REFERENCES ruvector.graph_nodes(id),\n  edge_type TEXT NOT NULL,\n  properties JSONB DEFAULT '{}',\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE INDEX IF NOT EXISTS idx_graph_edges_source\nON ruvector.graph_edges(source_id);\n\nCREATE INDEX IF NOT EXISTS idx_graph_edges_target\nON ruvector.graph_edges(target_id);\n\nCREATE INDEX IF NOT EXISTS idx_graph_edges_type\nON ruvector.graph_edges(edge_type);\n";
/**
 * Exochain schema SQL (inline for bundled distribution)
 *
 * This constant provides a minimal inline version of the Exochain schema
 * for use cases where file system access is not available (e.g., bundled builds).
 *
 * For the full schema with all functions and triggers, use loadSchema('exochain').
 */
export declare const EXOCHAIN_SCHEMA = "\n-- Inline Exochain schema for bundled distribution\nCREATE SCHEMA IF NOT EXISTS exochain;\n\nCREATE TABLE IF NOT EXISTS exochain.events (\n  id TEXT PRIMARY KEY,\n  parents TEXT[] DEFAULT '{}',\n  hlc_physical_ms BIGINT NOT NULL,\n  hlc_logical INTEGER NOT NULL,\n  author TEXT NOT NULL,\n  payload_type TEXT NOT NULL,\n  payload JSONB NOT NULL,\n  signature TEXT NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE INDEX IF NOT EXISTS idx_events_author\nON exochain.events(author);\n\nCREATE INDEX IF NOT EXISTS idx_events_payload_type\nON exochain.events(payload_type);\n\nCREATE INDEX IF NOT EXISTS idx_events_hlc\nON exochain.events(hlc_physical_ms, hlc_logical);\n\nCREATE INDEX IF NOT EXISTS idx_events_parents\nON exochain.events USING GIN (parents);\n\nCREATE TABLE IF NOT EXISTS exochain.checkpoints (\n  height INTEGER PRIMARY KEY,\n  event_root TEXT NOT NULL,\n  state_root TEXT NOT NULL,\n  timestamp TIMESTAMPTZ NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE IF NOT EXISTS exochain.checkpoint_signatures (\n  id SERIAL PRIMARY KEY,\n  checkpoint_height INTEGER NOT NULL REFERENCES exochain.checkpoints(height),\n  validator_did TEXT NOT NULL,\n  signature TEXT NOT NULL,\n  signed_at TIMESTAMPTZ DEFAULT NOW(),\n  UNIQUE(checkpoint_height, validator_did)\n);\n\nCREATE INDEX IF NOT EXISTS idx_checkpoint_signatures_height\nON exochain.checkpoint_signatures(checkpoint_height);\n\nCREATE TABLE IF NOT EXISTS exochain.tips (\n  event_id TEXT PRIMARY KEY REFERENCES exochain.events(id),\n  added_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE TABLE IF NOT EXISTS exochain.peers (\n  id TEXT PRIMARY KEY,\n  endpoint TEXT NOT NULL UNIQUE,\n  did TEXT,\n  status TEXT DEFAULT 'disconnected',\n  last_sync_time TIMESTAMPTZ,\n  last_checkpoint_height INTEGER,\n  events_received INTEGER DEFAULT 0,\n  events_sent INTEGER DEFAULT 0,\n  errors INTEGER DEFAULT 0,\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE INDEX IF NOT EXISTS idx_peers_status\nON exochain.peers(status);\n\nCREATE TABLE IF NOT EXISTS exochain.sync_log (\n  id SERIAL PRIMARY KEY,\n  peer_id TEXT NOT NULL,\n  direction TEXT NOT NULL,\n  events_transferred INTEGER DEFAULT 0,\n  duration_ms INTEGER,\n  success BOOLEAN DEFAULT FALSE,\n  error_message TEXT,\n  started_at TIMESTAMPTZ NOT NULL,\n  completed_at TIMESTAMPTZ\n);\n\nCREATE INDEX IF NOT EXISTS idx_sync_log_peer\nON exochain.sync_log(peer_id);\n\nCREATE INDEX IF NOT EXISTS idx_sync_log_started_at\nON exochain.sync_log(started_at);\n";
//# sourceMappingURL=index.d.ts.map