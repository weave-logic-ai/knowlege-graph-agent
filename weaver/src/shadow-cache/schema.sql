-- Shadow Cache Database Schema
--
-- Stores metadata about vault files for fast querying without parsing markdown.
-- This cache is rebuilt on startup and updated on file changes.

-- Files table: Core metadata for each markdown file
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  directory TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  modified_at TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  frontmatter TEXT,
  type TEXT,
  status TEXT,
  title TEXT,
  cache_updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
CREATE INDEX IF NOT EXISTS idx_files_directory ON files(directory);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(type);
CREATE INDEX IF NOT EXISTS idx_files_status ON files(status);
CREATE INDEX IF NOT EXISTS idx_files_modified ON files(modified_at);

-- Tags table: Many-to-many relationship for file tags
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);

-- File-Tag junction table
CREATE TABLE IF NOT EXISTS file_tags (
  file_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (file_id, tag_id),
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_file_tags_file ON file_tags(file_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_tag ON file_tags(tag_id);

-- Links table: Wikilinks and markdown links between files
CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_file_id INTEGER NOT NULL,
  target_path TEXT NOT NULL,
  link_type TEXT NOT NULL,
  link_text TEXT,
  FOREIGN KEY (source_file_id) REFERENCES files(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_file_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_path);
CREATE INDEX IF NOT EXISTS idx_links_type ON links(link_type);

-- Cache metadata table: Track cache state
CREATE TABLE IF NOT EXISTS cache_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Initialize cache metadata
INSERT OR IGNORE INTO cache_metadata (key, value, updated_at)
VALUES ('version', '1.0.0', datetime('now'));

INSERT OR IGNORE INTO cache_metadata (key, value, updated_at)
VALUES ('last_full_sync', '', datetime('now'));
