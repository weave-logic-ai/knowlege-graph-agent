-- RuVector PostgreSQL Schema
-- Vector storage with HNSW indexing for knowledge graph embeddings

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS ruvector;

-- Vector embeddings table
CREATE TABLE IF NOT EXISTS ruvector.embeddings (
  id TEXT PRIMARY KEY,
  node_type TEXT NOT NULL,
  embedding REAL[] NOT NULL,
  dimensions INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on node_type for filtering
CREATE INDEX IF NOT EXISTS idx_embeddings_node_type
ON ruvector.embeddings(node_type);

-- Create index on metadata for JSONB queries
CREATE INDEX IF NOT EXISTS idx_embeddings_metadata
ON ruvector.embeddings USING GIN (metadata);

-- Trajectories table for agent operation tracking
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

-- Create indexes for trajectory queries
CREATE INDEX IF NOT EXISTS idx_trajectories_agent_id
ON ruvector.trajectories(agent_id);

CREATE INDEX IF NOT EXISTS idx_trajectories_workflow_id
ON ruvector.trajectories(workflow_id);

CREATE INDEX IF NOT EXISTS idx_trajectories_success
ON ruvector.trajectories(success);

-- Detected patterns table for SONA learning
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

-- Learning records table
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

-- Graph nodes table (Cypher-style queries)
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

-- Graph edges table (relationships)
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

-- Function to calculate cosine similarity
CREATE OR REPLACE FUNCTION ruvector.cosine_similarity(a REAL[], b REAL[])
RETURNS REAL AS $$
DECLARE
  dot_product REAL := 0;
  norm_a REAL := 0;
  norm_b REAL := 0;
  i INTEGER;
BEGIN
  IF array_length(a, 1) != array_length(b, 1) THEN
    RAISE EXCEPTION 'Vector dimensions must match';
  END IF;

  FOR i IN 1..array_length(a, 1) LOOP
    dot_product := dot_product + (a[i] * b[i]);
    norm_a := norm_a + (a[i] * a[i]);
    norm_b := norm_b + (b[i] * b[i]);
  END LOOP;

  IF norm_a = 0 OR norm_b = 0 THEN
    RETURN 0;
  END IF;

  RETURN dot_product / (sqrt(norm_a) * sqrt(norm_b));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function for similarity search
CREATE OR REPLACE FUNCTION ruvector.similarity_search(
  query_embedding REAL[],
  limit_count INTEGER DEFAULT 10,
  node_type_filter TEXT DEFAULT NULL,
  min_similarity REAL DEFAULT 0.0
)
RETURNS TABLE (
  id TEXT,
  node_type TEXT,
  similarity REAL,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.node_type,
    ruvector.cosine_similarity(e.embedding, query_embedding) AS similarity,
    e.metadata
  FROM ruvector.embeddings e
  WHERE
    (node_type_filter IS NULL OR e.node_type = node_type_filter)
    AND ruvector.cosine_similarity(e.embedding, query_embedding) >= min_similarity
  ORDER BY similarity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION ruvector.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_embeddings_updated_at
  BEFORE UPDATE ON ruvector.embeddings
  FOR EACH ROW
  EXECUTE FUNCTION ruvector.update_updated_at();

CREATE TRIGGER update_patterns_updated_at
  BEFORE UPDATE ON ruvector.patterns
  FOR EACH ROW
  EXECUTE FUNCTION ruvector.update_updated_at();

CREATE TRIGGER update_graph_nodes_updated_at
  BEFORE UPDATE ON ruvector.graph_nodes
  FOR EACH ROW
  EXECUTE FUNCTION ruvector.update_updated_at();
