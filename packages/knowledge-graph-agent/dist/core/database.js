import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
const SCHEMA_SQL = `
-- Knowledge Graph Schema v1.0

-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('concept', 'technical', 'feature', 'primitive', 'service', 'guide', 'standard', 'integration')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('draft', 'active', 'deprecated', 'archived')),
  content TEXT,
  frontmatter TEXT,
  word_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Node-Tags junction table
CREATE TABLE IF NOT EXISTS node_tags (
  node_id TEXT NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (node_id, tag_id),
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Edges table
CREATE TABLE IF NOT EXISTS edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('link', 'reference', 'parent', 'related')),
  weight REAL DEFAULT 1.0,
  context TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES nodes(id) ON DELETE CASCADE
);

-- Metadata table
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
CREATE INDEX IF NOT EXISTS idx_nodes_path ON nodes(path);
CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
CREATE INDEX IF NOT EXISTS idx_node_tags_node ON node_tags(node_id);
CREATE INDEX IF NOT EXISTS idx_node_tags_tag ON node_tags(tag_id);

-- Full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
  title,
  content,
  content='nodes',
  content_rowid='rowid'
);

-- Triggers for FTS sync
CREATE TRIGGER IF NOT EXISTS nodes_ai AFTER INSERT ON nodes BEGIN
  INSERT INTO nodes_fts(rowid, title, content) VALUES (NEW.rowid, NEW.title, NEW.content);
END;

CREATE TRIGGER IF NOT EXISTS nodes_ad AFTER DELETE ON nodes BEGIN
  INSERT INTO nodes_fts(nodes_fts, rowid, title, content) VALUES('delete', OLD.rowid, OLD.title, OLD.content);
END;

CREATE TRIGGER IF NOT EXISTS nodes_au AFTER UPDATE ON nodes BEGIN
  INSERT INTO nodes_fts(nodes_fts, rowid, title, content) VALUES('delete', OLD.rowid, OLD.title, OLD.content);
  INSERT INTO nodes_fts(rowid, title, content) VALUES (NEW.rowid, NEW.title, NEW.content);
END;

-- Initialize metadata
INSERT OR IGNORE INTO metadata (key, value) VALUES ('version', '1.0.0');
INSERT OR IGNORE INTO metadata (key, value) VALUES ('created', datetime('now'));
`;
class KnowledgeGraphDatabase {
  db;
  dbPath;
  constructor(dbPath) {
    this.dbPath = dbPath;
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");
    this.db.pragma("busy_timeout = 5000");
    this.db.exec(SCHEMA_SQL);
  }
  // ========================================================================
  // Node Operations
  // ========================================================================
  /**
   * Insert or update a node
   */
  upsertNode(node) {
    const stmt = this.db.prepare(`
      INSERT INTO nodes (id, path, filename, title, type, status, content, frontmatter, word_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        path = excluded.path,
        filename = excluded.filename,
        title = excluded.title,
        type = excluded.type,
        status = excluded.status,
        content = excluded.content,
        frontmatter = excluded.frontmatter,
        word_count = excluded.word_count,
        updated_at = datetime('now')
    `);
    stmt.run(
      node.id,
      node.path,
      node.filename,
      node.title,
      node.type,
      node.status,
      node.content,
      JSON.stringify(node.frontmatter),
      node.wordCount
    );
    this.updateNodeTags(node.id, node.tags);
  }
  /**
   * Get node by ID
   */
  getNode(id) {
    const stmt = this.db.prepare("SELECT * FROM nodes WHERE id = ?");
    const row = stmt.get(id);
    if (!row) return null;
    return this.rowToNode(row);
  }
  /**
   * Get node by path
   */
  getNodeByPath(path) {
    const stmt = this.db.prepare("SELECT * FROM nodes WHERE path = ?");
    const row = stmt.get(path);
    if (!row) return null;
    return this.rowToNode(row);
  }
  /**
   * Get all nodes
   */
  getAllNodes() {
    const stmt = this.db.prepare("SELECT * FROM nodes ORDER BY title");
    const rows = stmt.all();
    return rows.map((row) => this.rowToNode(row));
  }
  /**
   * Get nodes by type
   */
  getNodesByType(type) {
    const stmt = this.db.prepare("SELECT * FROM nodes WHERE type = ? ORDER BY title");
    const rows = stmt.all(type);
    return rows.map((row) => this.rowToNode(row));
  }
  /**
   * Get nodes by status
   */
  getNodesByStatus(status) {
    const stmt = this.db.prepare("SELECT * FROM nodes WHERE status = ? ORDER BY title");
    const rows = stmt.all(status);
    return rows.map((row) => this.rowToNode(row));
  }
  /**
   * Get nodes by tag
   */
  getNodesByTag(tag) {
    const stmt = this.db.prepare(`
      SELECT n.* FROM nodes n
      JOIN node_tags nt ON n.id = nt.node_id
      JOIN tags t ON nt.tag_id = t.id
      WHERE t.name = ?
      ORDER BY n.title
    `);
    const rows = stmt.all(tag);
    return rows.map((row) => this.rowToNode(row));
  }
  /**
   * Sanitize FTS5 query to prevent query injection
   * Escapes special FTS5 operators and quotes terms
   */
  sanitizeFtsQuery(query) {
    if (!query || typeof query !== "string") return "";
    const sanitized = query.replace(/[*"():^\-]/g, " ").replace(/\b(AND|OR|NOT|NEAR)\b/gi, "").trim().split(/\s+/).filter((term) => term.length > 0 && term.length < 100).slice(0, 20).map((term) => `"${term.replace(/"/g, "")}"`).join(" ");
    return sanitized;
  }
  /**
   * Search nodes by title or content
   */
  searchNodes(query, limit = 50) {
    const sanitizedQuery = this.sanitizeFtsQuery(query);
    if (!sanitizedQuery) {
      return [];
    }
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const stmt = this.db.prepare(`
      SELECT n.* FROM nodes n
      JOIN nodes_fts fts ON n.rowid = fts.rowid
      WHERE nodes_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `);
    const rows = stmt.all(sanitizedQuery, safeLimit);
    return rows.map((row) => this.rowToNode(row));
  }
  /**
   * Delete node
   */
  deleteNode(id) {
    const stmt = this.db.prepare("DELETE FROM nodes WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
  // ========================================================================
  // Tag Operations
  // ========================================================================
  /**
   * Update tags for a node
   */
  updateNodeTags(nodeId, tags) {
    this.db.prepare("DELETE FROM node_tags WHERE node_id = ?").run(nodeId);
    const getOrCreateTag = this.db.prepare(`
      INSERT INTO tags (name) VALUES (?)
      ON CONFLICT(name) DO UPDATE SET name = excluded.name
      RETURNING id
    `);
    const insertNodeTag = this.db.prepare(
      "INSERT OR IGNORE INTO node_tags (node_id, tag_id) VALUES (?, ?)"
    );
    for (const tag of tags) {
      const result = getOrCreateTag.get(tag);
      insertNodeTag.run(nodeId, result.id);
    }
  }
  /**
   * Get tags for a node
   */
  getNodeTags(nodeId) {
    const stmt = this.db.prepare(`
      SELECT t.name FROM tags t
      JOIN node_tags nt ON t.id = nt.tag_id
      WHERE nt.node_id = ?
      ORDER BY t.name
    `);
    const rows = stmt.all(nodeId);
    return rows.map((r) => r.name);
  }
  /**
   * Get all tags with counts
   */
  getAllTags() {
    const stmt = this.db.prepare(`
      SELECT t.name, COUNT(nt.node_id) as count
      FROM tags t
      LEFT JOIN node_tags nt ON t.id = nt.tag_id
      GROUP BY t.id
      ORDER BY count DESC, t.name
    `);
    return stmt.all();
  }
  // ========================================================================
  // Edge Operations
  // ========================================================================
  /**
   * Add edge
   */
  addEdge(edge) {
    const stmt = this.db.prepare(`
      INSERT INTO edges (source_id, target_id, type, weight, context)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(edge.source, edge.target, edge.type, edge.weight, edge.context);
  }
  /**
   * Get outgoing edges for a node
   */
  getOutgoingEdges(nodeId) {
    const stmt = this.db.prepare("SELECT * FROM edges WHERE source_id = ?");
    const rows = stmt.all(nodeId);
    return rows.map((row) => this.rowToEdge(row));
  }
  /**
   * Get incoming edges for a node
   */
  getIncomingEdges(nodeId) {
    const stmt = this.db.prepare("SELECT * FROM edges WHERE target_id = ?");
    const rows = stmt.all(nodeId);
    return rows.map((row) => this.rowToEdge(row));
  }
  /**
   * Delete edges for a node
   */
  deleteNodeEdges(nodeId) {
    this.db.prepare("DELETE FROM edges WHERE source_id = ?").run(nodeId);
  }
  // ========================================================================
  // Statistics
  // ========================================================================
  /**
   * Get graph statistics
   */
  getStats() {
    const totalNodes = this.db.prepare("SELECT COUNT(*) as count FROM nodes").get().count;
    const totalEdges = this.db.prepare("SELECT COUNT(*) as count FROM edges").get().count;
    const typeStats = this.db.prepare(`
      SELECT type, COUNT(*) as count FROM nodes GROUP BY type
    `).all();
    const statusStats = this.db.prepare(`
      SELECT status, COUNT(*) as count FROM nodes GROUP BY status
    `).all();
    const nodesByType = {
      concept: 0,
      technical: 0,
      feature: 0,
      primitive: 0,
      service: 0,
      guide: 0,
      standard: 0,
      integration: 0
    };
    for (const { type, count } of typeStats) {
      nodesByType[type] = count;
    }
    const nodesByStatus = {
      draft: 0,
      active: 0,
      deprecated: 0,
      archived: 0
    };
    for (const { status, count } of statusStats) {
      nodesByStatus[status] = count;
    }
    const orphanNodes = this.db.prepare(`
      SELECT COUNT(*) as count FROM nodes n
      WHERE NOT EXISTS (SELECT 1 FROM edges e WHERE e.source_id = n.id OR e.target_id = n.id)
    `).get().count;
    const avgLinksPerNode = totalNodes > 0 ? totalEdges / totalNodes : 0;
    const mostConnected = this.db.prepare(`
      SELECT n.id, (
        (SELECT COUNT(*) FROM edges WHERE source_id = n.id) +
        (SELECT COUNT(*) FROM edges WHERE target_id = n.id)
      ) as connections
      FROM nodes n
      ORDER BY connections DESC
      LIMIT 5
    `).all();
    return {
      totalNodes,
      totalEdges,
      nodesByType,
      nodesByStatus,
      orphanNodes,
      avgLinksPerNode: Math.round(avgLinksPerNode * 100) / 100,
      mostConnected
    };
  }
  // ========================================================================
  // Metadata Operations
  // ========================================================================
  /**
   * Get metadata value
   */
  getMetadata(key) {
    const stmt = this.db.prepare("SELECT value FROM metadata WHERE key = ?");
    const row = stmt.get(key);
    return row?.value ?? null;
  }
  /**
   * Set metadata value
   */
  setMetadata(key, value) {
    const stmt = this.db.prepare(`
      INSERT INTO metadata (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `);
    stmt.run(key, value);
  }
  // ========================================================================
  // Utilities
  // ========================================================================
  /**
   * Convert database row to KnowledgeNode
   */
  rowToNode(row) {
    const tags = this.getNodeTags(row.id);
    const outgoingEdges = this.getOutgoingEdges(row.id);
    const incomingEdges = this.getIncomingEdges(row.id);
    return {
      id: row.id,
      path: row.path,
      filename: row.filename,
      title: row.title,
      type: row.type,
      status: row.status,
      content: row.content || "",
      frontmatter: safeJsonParse(row.frontmatter, {}),
      tags,
      outgoingLinks: outgoingEdges.map((e) => ({
        target: e.target,
        type: "wikilink",
        context: e.context
      })),
      incomingLinks: incomingEdges.map((e) => ({
        target: e.source,
        type: "backlink",
        context: e.context
      })),
      wordCount: row.word_count,
      lastModified: new Date(row.updated_at)
    };
  }
  /**
   * Convert database row to GraphEdge
   */
  rowToEdge(row) {
    return {
      source: row.source_id,
      target: row.target_id,
      type: row.type,
      weight: row.weight,
      context: row.context ?? void 0
    };
  }
  /**
   * Close database connection
   */
  close() {
    this.db.close();
  }
  /**
   * Get raw database instance
   */
  getDatabase() {
    return this.db;
  }
}
function createDatabase(dbPath) {
  return new KnowledgeGraphDatabase(dbPath);
}
export {
  KnowledgeGraphDatabase,
  createDatabase
};
//# sourceMappingURL=database.js.map
