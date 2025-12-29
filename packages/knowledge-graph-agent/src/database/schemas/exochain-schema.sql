-- Exochain PostgreSQL Schema
-- Deterministic logging with DAG-BFT consensus

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS exochain;

-- Ledger events table (main event log)
CREATE TABLE IF NOT EXISTS exochain.events (
  id TEXT PRIMARY KEY,  -- BLAKE3 hash
  parents TEXT[] DEFAULT '{}',
  hlc_physical_ms BIGINT NOT NULL,
  hlc_logical INTEGER NOT NULL,
  author TEXT NOT NULL,  -- DID
  payload_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT NOT NULL,  -- Ed25519 signature
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_events_author
ON exochain.events(author);

CREATE INDEX IF NOT EXISTS idx_events_payload_type
ON exochain.events(payload_type);

CREATE INDEX IF NOT EXISTS idx_events_hlc
ON exochain.events(hlc_physical_ms, hlc_logical);

CREATE INDEX IF NOT EXISTS idx_events_parents
ON exochain.events USING GIN (parents);

-- Checkpoints table for BFT finality
CREATE TABLE IF NOT EXISTS exochain.checkpoints (
  height INTEGER PRIMARY KEY,
  event_root TEXT NOT NULL,  -- Merkle root of events
  state_root TEXT NOT NULL,  -- State root
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkpoint signatures (for BFT validation)
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

-- DAG tips (events with no children)
CREATE TABLE IF NOT EXISTS exochain.tips (
  event_id TEXT PRIMARY KEY REFERENCES exochain.events(id),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peers for syndication
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

-- Sync log for audit trail
CREATE TABLE IF NOT EXISTS exochain.sync_log (
  id SERIAL PRIMARY KEY,
  peer_id TEXT NOT NULL,
  direction TEXT NOT NULL,  -- 'push', 'pull', 'bidirectional'
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

-- Function to insert event and update tips
CREATE OR REPLACE FUNCTION exochain.insert_event(
  p_id TEXT,
  p_parents TEXT[],
  p_hlc_physical_ms BIGINT,
  p_hlc_logical INTEGER,
  p_author TEXT,
  p_payload_type TEXT,
  p_payload JSONB,
  p_signature TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert the event
  INSERT INTO exochain.events (
    id, parents, hlc_physical_ms, hlc_logical,
    author, payload_type, payload, signature
  ) VALUES (
    p_id, p_parents, p_hlc_physical_ms, p_hlc_logical,
    p_author, p_payload_type, p_payload, p_signature
  );

  -- Remove parents from tips
  DELETE FROM exochain.tips WHERE event_id = ANY(p_parents);

  -- Add new event to tips
  INSERT INTO exochain.tips (event_id) VALUES (p_id);

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get events since checkpoint
CREATE OR REPLACE FUNCTION exochain.get_events_since_checkpoint(
  p_checkpoint_height INTEGER,
  p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
  id TEXT,
  parents TEXT[],
  hlc_physical_ms BIGINT,
  hlc_logical INTEGER,
  author TEXT,
  payload_type TEXT,
  payload JSONB,
  signature TEXT
) AS $$
DECLARE
  v_min_hlc_physical BIGINT := 0;
  v_min_hlc_logical INTEGER := 0;
BEGIN
  -- Get HLC from checkpoint
  SELECT
    COALESCE(MAX(e.hlc_physical_ms), 0),
    COALESCE(MAX(e.hlc_logical), 0)
  INTO v_min_hlc_physical, v_min_hlc_logical
  FROM exochain.events e
  JOIN exochain.checkpoints c ON c.height = p_checkpoint_height
  WHERE e.created_at <= c.timestamp;

  RETURN QUERY
  SELECT
    e.id,
    e.parents,
    e.hlc_physical_ms,
    e.hlc_logical,
    e.author,
    e.payload_type,
    e.payload,
    e.signature
  FROM exochain.events e
  WHERE
    e.hlc_physical_ms > v_min_hlc_physical
    OR (e.hlc_physical_ms = v_min_hlc_physical AND e.hlc_logical > v_min_hlc_logical)
  ORDER BY e.hlc_physical_ms, e.hlc_logical
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get chain statistics
CREATE OR REPLACE FUNCTION exochain.get_stats()
RETURNS TABLE (
  total_events BIGINT,
  checkpoint_height INTEGER,
  unique_authors BIGINT,
  tip_count BIGINT,
  last_event_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM exochain.events)::BIGINT AS total_events,
    (SELECT COALESCE(MAX(height), 0) FROM exochain.checkpoints)::INTEGER AS checkpoint_height,
    (SELECT COUNT(DISTINCT author) FROM exochain.events)::BIGINT AS unique_authors,
    (SELECT COUNT(*) FROM exochain.tips)::BIGINT AS tip_count,
    (SELECT MAX(created_at) FROM exochain.events) AS last_event_time;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update peer updated_at
CREATE OR REPLACE FUNCTION exochain.update_peer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_peers_updated_at
  BEFORE UPDATE ON exochain.peers
  FOR EACH ROW
  EXECUTE FUNCTION exochain.update_peer_updated_at();
