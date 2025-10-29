---
title: SQLite
type: technical-primitive
status: in-use
phase_id: PHASE-5
tags:
  - technical
  - database
  - in-use
  - mvp
  - shadow-cache
  - deprecated-in-v1
  - phase/phase-5
  - type/documentation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4C4"
  color: '#8E8E93'
  cssclasses:
    - type-technical-primitive
    - status-in-use
updated: '2025-10-29T04:55:06.401Z'
version: '3.0'
keywords:
  - overview
  - why we use it
  - key capabilities
  - integration points
  - configuration
  - shadow cache database schema
  - docker compose integration (mvp)
  - environment variables
  - key configuration files
  - deployment
---

# SQLite

**Category**: Embedded Database
**Status**: In Use (MVP) - Deprecated in v1.0
**First Used**: Phase 5 Day 3 (Week 1)

---

## Overview

SQLite is a serverless, self-contained SQL database engine embedded directly into applications. It stores data in a single file and requires no configuration or separate server process.

**Official Site**: https://www.sqlite.org/
**Documentation**: https://www.sqlite.org/docs.html

---

## Why We Use It

SQLite serves as the MVP shadow cache database for Weave-NN, storing metadata, embeddings, and full-text search indices for rapid MCP server queries without parsing vault files on every request.

**Primary Purpose**: Fast read-optimized cache for metadata and embeddings, enabling sub-100ms MCP query responses.

**Specific Use Cases**:
- Store file metadata (frontmatter, tags, links) in [[../architecture/shadow-cache]]
- Cache text embeddings for semantic search queries
- Full-text search (FTS5) for content search across vault
- Store MCP query results for faster subsequent requests
- Track file change history and timestamps

**MVP Rationale**: SQLite is perfect for single-user local development (no network overhead, zero configuration, portable .db file).

---

## Key Capabilities

- **Embedded Database**: No separate server process - runs in MCP server's memory space, zero latency
- **FTS5 Full-Text Search**: Built-in text indexing - enables fast content search across vault without Elasticsearch
- **JSON Support**: JSON1 extension for structured data - stores frontmatter and metadata as queryable JSON
- **ACID Transactions**: Reliable data integrity - ensures cache consistency even if process crashes
- **Single File Storage**: Entire database in one `.db` file - easy backup, portable across machines

---

## Integration Points

**Used By**:
- [[../architecture/mcp-server]] - Queries shadow cache for fast responses
- [[../architecture/event-consumer]] - Updates cache when vault files change
- [[../architecture/shadow-cache]] - Core storage layer

**Integrates With**:
- [[rabbitmq]] - Updates triggered by file change events
- [[fastapi]] - MCP server queries via SQL
- [[python]] - Python sqlite3 standard library

**Enables Features**:
- [[../features/semantic-search]] - Vector embeddings storage
- [[../features/full-text-search]] - FTS5 content indexing
- [[../features/metadata-queries]] - Fast frontmatter queries

---

## Configuration

### Shadow Cache Database Schema

```sql
-- SQLite schema for Weave-NN shadow cache

-- File metadata table
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT UNIQUE NOT NULL,
    file_hash TEXT NOT NULL,  -- SHA256 of content
    created_at TEXT NOT NULL,
    modified_at TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,

    -- Frontmatter as JSON
    frontmatter JSON,

    -- Extracted metadata
    title TEXT,
    tags TEXT,  -- Comma-separated
    links TEXT,  -- JSON array of [[wikilinks]]

    -- Search optimization
    content_preview TEXT,  -- First 500 chars

    UNIQUE(file_path)
);

-- Full-text search index (FTS5)
CREATE VIRTUAL TABLE files_fts USING fts5(
    file_path,
    title,
    content,
    tags,
    content='files',
    content_rowid='id'
);

-- Embeddings table (for semantic search)
CREATE TABLE embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding BLOB NOT NULL,  -- 768-dim vector as bytes

    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    UNIQUE(file_id, chunk_index)
);

-- Links table (for graph queries)
CREATE TABLE links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_file_id INTEGER NOT NULL,
    target_file_path TEXT NOT NULL,
    link_type TEXT NOT NULL,  -- 'wikilink', 'markdown', 'embed'

    FOREIGN KEY (source_file_id) REFERENCES files(id) ON DELETE CASCADE
);

-- Tags table (for tag hierarchy queries)
CREATE TABLE tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_name TEXT UNIQUE NOT NULL,
    parent_tag_id INTEGER,

    FOREIGN KEY (parent_tag_id) REFERENCES tags(id)
);

-- File-Tag junction table
CREATE TABLE file_tags (
    file_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,

    PRIMARY KEY (file_id, tag_id),
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for fast queries
CREATE INDEX idx_files_modified ON files(modified_at DESC);
CREATE INDEX idx_files_tags ON files(tags);
CREATE INDEX idx_links_source ON links(source_file_id);
CREATE INDEX idx_links_target ON links(target_file_path);
CREATE INDEX idx_file_tags_tag ON file_tags(tag_id);
```

### Docker Compose Integration (MVP)

```yaml
mcp-server:
  build: ./services/mcp-server
  container_name: weave-mcp-server
  volumes:
    - ./vault:/vault:ro  # Read-only vault access
    - ./data/shadow-cache.db:/data/shadow-cache.db  # SQLite database
  environment:
    VAULT_PATH: /vault
    SQLITE_DB_PATH: /data/shadow-cache.db
    SQLITE_CACHE_SIZE: 10000  # 10k pages = ~40 MB cache
    SQLITE_JOURNAL_MODE: WAL  # Write-Ahead Logging
  ports:
    - "8000:8000"
  depends_on:
    - rabbitmq
  restart: unless-stopped
```

### Environment Variables

- `SQLITE_DB_PATH`: Path to SQLite database file (default: `/data/shadow-cache.db`)
- `SQLITE_CACHE_SIZE`: Page cache size in KB (default: `10000` = ~40 MB)
- `SQLITE_JOURNAL_MODE`: `DELETE`, `WAL`, or `MEMORY` (default: `WAL`)
- `SQLITE_SYNCHRONOUS`: `OFF`, `NORMAL`, or `FULL` (default: `NORMAL`)
- `SQLITE_TEMP_STORE`: `MEMORY` or `FILE` (default: `MEMORY`)

### Key Configuration Files

- `/services/mcp-server/database.py` - SQLite connection and query utilities
- `/services/mcp-server/schema.sql` - Database schema initialization
- `/data/shadow-cache.db` - SQLite database file (created on first run)

---

## Deployment

**MVP (Phase 5-6)**: Single SQLite file on host machine, mounted into Docker containers
**v1.0 (Post-MVP)**: Migrate to PostgreSQL for multi-user concurrent writes

**Resource Requirements**:
- RAM: 50-200 MB (depends on cache size and active queries)
- CPU: < 5% (fast in-process queries)
- Storage: 10-100 MB (depends on vault size and embeddings)

**Migration Path**: SQLite → PostgreSQL at v1.0 launch (see [[../guides/sqlite-to-postgresql-migration]])

**Health Check**:
```bash
# Check if database file exists
ls -lh /path/to/shadow-cache.db

# Query database
sqlite3 /path/to/shadow-cache.db "SELECT COUNT(*) FROM files;"

# Check database integrity
sqlite3 /path/to/shadow-cache.db "PRAGMA integrity_check;"

# Show database statistics
sqlite3 /path/to/shadow-cache.db "PRAGMA page_count; PRAGMA page_size; PRAGMA cache_size;"
```

---

## Code Examples

### Python Database Connection with Connection Pooling

```python
import sqlite3
import os
from contextlib import contextmanager
from typing import Generator

class ShadowCacheDB:
    """SQLite database connection manager for shadow cache."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self._ensure_database_exists()

    def _ensure_database_exists(self):
        """Create database and schema if it doesn't exist."""
        if not os.path.exists(self.db_path):
            with self.get_connection() as conn:
                with open('schema.sql', 'r') as f:
                    conn.executescript(f.read())
                conn.commit()

    @contextmanager
    def get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        """
        Get SQLite connection with optimized settings.

        Uses Write-Ahead Logging (WAL) for better concurrency.
        """
        conn = sqlite3.connect(self.db_path)

        # Optimize for read-heavy workload
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA synchronous = NORMAL")
        conn.execute("PRAGMA cache_size = -64000")  # 64 MB cache
        conn.execute("PRAGMA temp_store = MEMORY")
        conn.execute("PRAGMA mmap_size = 268435456")  # 256 MB mmap

        # Enable foreign keys
        conn.execute("PRAGMA foreign_keys = ON")

        # Return rows as dict-like objects
        conn.row_factory = sqlite3.Row

        try:
            yield conn
        finally:
            conn.close()


# Initialize database
db = ShadowCacheDB('/data/shadow-cache.db')
```

### Insert File Metadata

```python
from datetime import datetime
import json
import hashlib

def insert_file_metadata(conn: sqlite3.Connection, file_path: str, content: str, frontmatter: dict):
    """Insert or update file metadata in shadow cache."""

    # Calculate file hash
    file_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()

    # Extract metadata
    title = frontmatter.get('title', os.path.basename(file_path))
    tags = ','.join(frontmatter.get('tags', []))

    # Upsert file record
    conn.execute("""
        INSERT INTO files (
            file_path, file_hash, created_at, modified_at,
            size_bytes, frontmatter, title, tags, content_preview
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(file_path) DO UPDATE SET
            file_hash = excluded.file_hash,
            modified_at = excluded.modified_at,
            size_bytes = excluded.size_bytes,
            frontmatter = excluded.frontmatter,
            title = excluded.title,
            tags = excluded.tags,
            content_preview = excluded.content_preview
    """, (
        file_path,
        file_hash,
        datetime.now().isoformat(),
        datetime.now().isoformat(),
        len(content),
        json.dumps(frontmatter),
        title,
        tags,
        content[:500]  # First 500 chars
    ))

    # Update FTS index
    file_id = conn.execute("SELECT id FROM files WHERE file_path = ?", (file_path,)).fetchone()[0]
    conn.execute("""
        INSERT INTO files_fts (rowid, file_path, title, content, tags)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(rowid) DO UPDATE SET
            title = excluded.title,
            content = excluded.content,
            tags = excluded.tags
    """, (file_id, file_path, title, content, tags))

    conn.commit()
```

### Full-Text Search Query

```python
def search_vault(conn: sqlite3.Connection, query: str, limit: int = 10):
    """Search vault using FTS5."""

    results = conn.execute("""
        SELECT
            f.file_path,
            f.title,
            f.tags,
            snippet(files_fts, 2, '<mark>', '</mark>', '...', 64) as snippet,
            rank
        FROM files_fts
        JOIN files f ON files_fts.rowid = f.id
        WHERE files_fts MATCH ?
        ORDER BY rank
        LIMIT ?
    """, (query, limit)).fetchall()

    return [dict(row) for row in results]


# Usage
with db.get_connection() as conn:
    results = search_vault(conn, "obsidian knowledge graph", limit=5)
    for result in results:
        print(f"{result['title']} - {result['file_path']}")
        print(f"  {result['snippet']}")
```

### Semantic Search with Embeddings

```python
import numpy as np

def insert_embedding(conn: sqlite3.Connection, file_id: int, chunk_index: int,
                     chunk_text: str, embedding: np.ndarray):
    """Store text embedding for semantic search."""

    # Convert numpy array to bytes
    embedding_bytes = embedding.astype(np.float32).tobytes()

    conn.execute("""
        INSERT INTO embeddings (file_id, chunk_index, chunk_text, embedding)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(file_id, chunk_index) DO UPDATE SET
            chunk_text = excluded.chunk_text,
            embedding = excluded.embedding
    """, (file_id, chunk_index, chunk_text, embedding_bytes))

    conn.commit()


def semantic_search(conn: sqlite3.Connection, query_embedding: np.ndarray, limit: int = 10):
    """
    Find similar documents using cosine similarity.

    Note: SQLite doesn't have native vector operations, so we load all
    embeddings and compute similarity in Python. For production with
    large datasets, use PostgreSQL with pgvector extension.
    """

    # Load all embeddings (this is slow, but OK for MVP with < 1000 files)
    rows = conn.execute("""
        SELECT e.id, e.file_id, e.chunk_text, e.embedding, f.file_path, f.title
        FROM embeddings e
        JOIN files f ON e.file_id = f.id
    """).fetchall()

    # Compute cosine similarity
    query_emb = query_embedding.astype(np.float32)
    similarities = []

    for row in rows:
        doc_emb = np.frombuffer(row['embedding'], dtype=np.float32)
        similarity = np.dot(query_emb, doc_emb) / (np.linalg.norm(query_emb) * np.linalg.norm(doc_emb))
        similarities.append({
            'file_path': row['file_path'],
            'title': row['title'],
            'chunk_text': row['chunk_text'],
            'similarity': float(similarity)
        })

    # Sort by similarity and return top results
    similarities.sort(key=lambda x: x['similarity'], reverse=True)
    return similarities[:limit]
```

### Graph Query (Backlinks)

```python
def get_backlinks(conn: sqlite3.Connection, file_path: str):
    """Get all files that link to the given file."""

    results = conn.execute("""
        SELECT
            f.file_path,
            f.title,
            l.link_type,
            COUNT(*) as link_count
        FROM links l
        JOIN files f ON l.source_file_id = f.id
        WHERE l.target_file_path = ?
        GROUP BY f.file_path, f.title, l.link_type
        ORDER BY link_count DESC
    """, (file_path,)).fetchall()

    return [dict(row) for row in results]


# Usage
with db.get_connection() as conn:
    backlinks = get_backlinks(conn, 'projects/weave-nn.md')
    print(f"Files linking to weave-nn.md: {len(backlinks)}")
```

---

## Trade-offs

**Pros** (Why we chose it for MVP):
- ✅ **Zero Configuration**: No server setup, just a file - perfect for local development
- ✅ **Embedded**: Runs in-process with MCP server - sub-millisecond query latency
- ✅ **Portable**: Single .db file - easy to backup, version control, share
- ✅ **SQL Support**: Full SQL syntax - familiar to most developers
- ✅ **FTS5**: Built-in full-text search - no Elasticsearch needed for MVP

**Cons** (Why we migrate to PostgreSQL in v1.0):
- ⚠️ **No Concurrent Writes**: Only one writer at a time - blocks event consumer when MCP server queries
- ⚠️ **No Network Access**: File-based, not client-server - can't scale to distributed services
- ⚠️ **Limited Data Types**: No native array, JSON indexing, or vector types - slow semantic search
- ⚠️ **No Replication**: Single file, no high availability - data loss if file corrupts

---

## Alternatives Considered

**Compared With**:

### PostgreSQL
- **Pros**: Concurrent writes, network-accessible, native JSON/array types, pgvector extension for embeddings
- **Cons**: Requires separate server process, more complex deployment, overkill for single-user MVP
- **Decision**: Deferred to v1.0 - SQLite is sufficient for MVP, PostgreSQL needed for multi-user

### MongoDB
- **Pros**: Document model matches frontmatter structure, flexible schema, good for JSON storage
- **Cons**: No built-in full-text search (requires Atlas Search), weaker SQL query support, larger footprint
- **Decision**: Rejected - relational model better for graph queries (links, backlinks)

### In-memory data structures (Python dicts)
- **Pros**: Fastest possible queries (no I/O), no dependencies
- **Cons**: No persistence (lose cache on restart), no transactions, complex query logic
- **Decision**: Rejected - need ACID guarantees and SQL query power

---

## Decision History

**Decision Record**: [[../decisions/technical/mvp-database-choice]]

**Key Reasoning**:
> "For MVP, SQLite is ideal: zero configuration, embedded deployment, and sufficient performance for single-user local development. The single-writer limitation is acceptable because file changes are infrequent (< 1/second), and read queries dominate (> 95% of operations). We will migrate to PostgreSQL at v1.0 when multi-user concurrent access becomes a requirement."

**Date Decided**: 2025-10-15 (Phase 5 Day 3)
**Decided By**: System Architect

**Migration Decision**: [[../decisions/technical/sqlite-to-postgresql-migration]]
**Migration Planned**: Phase 7 (v1.0 launch)

---

## Phase Usage

### Phase 5 Day 3 (MVP Week 1) - **Active**
- **Implementation**: Shadow cache database schema and connection manager
- **Scope**: File metadata, full-text search (FTS5), basic graph queries
- **Testing**: Unit tests for CRUD operations and search queries

### Phase 5 Day 4-5 (MVP Week 1) - **Enhanced**
- **Embeddings**: Store text embeddings for semantic search
- **Graph Queries**: Backlinks, forward links, orphaned files
- **Performance**: Indexed queries, WAL mode, optimized cache settings

### Phase 6 (MVP Week 2) - **Production**
- **Monitoring**: Query performance metrics, database size tracking
- **Optimization**: Vacuum, analyze, reindex for optimal performance
- **Backup**: Automated .db file backups before each session

### Phase 7 (v1.0) - **DEPRECATED**
- **Migration**: SQLite → PostgreSQL with pgvector extension
- **Data Transfer**: Automated migration script with zero downtime
- **Legacy Support**: Keep SQLite as fallback for local-only mode

---

## Learning Resources

**Official Documentation**:
- [SQLite Documentation](https://www.sqlite.org/docs.html) - Complete reference
- [SQLite FTS5](https://www.sqlite.org/fts5.html) - Full-text search guide
- [SQLite JSON](https://www.sqlite.org/json1.html) - JSON extension

**Tutorials**:
- [SQLite Python Tutorial](https://docs.python.org/3/library/sqlite3.html) - Python standard library guide
- [SQLite Performance Tuning](https://www.sqlite.org/speed.html) - Optimization techniques

**Best Practices**:
- [SQLite WAL Mode](https://www.sqlite.org/wal.html) - Write-Ahead Logging guide
- [SQLite for Application Files](https://www.sqlite.org/appfileformat.html) - When to use SQLite

**Community**:
- [SQLite Forum](https://sqlite.org/forum/forumpost) - Official discussion forum
- [Stack Overflow: sqlite](https://stackoverflow.com/questions/tagged/sqlite) - Community Q&A

---

## Monitoring & Troubleshooting

**Health Checks**:
```bash
# Check database file size
ls -lh /data/shadow-cache.db

# Query database statistics
sqlite3 /data/shadow-cache.db "
  SELECT
    (SELECT COUNT(*) FROM files) as file_count,
    (SELECT COUNT(*) FROM embeddings) as embedding_count,
    (SELECT COUNT(*) FROM links) as link_count;
"

# Check database integrity
sqlite3 /data/shadow-cache.db "PRAGMA integrity_check;"

# Analyze query performance
sqlite3 /data/shadow-cache.db "EXPLAIN QUERY PLAN SELECT * FROM files WHERE tags LIKE '%obsidian%';"

# Vacuum database (reclaim space)
sqlite3 /data/shadow-cache.db "VACUUM;"
```

**Common Issues**:

1. **Issue**: Database locked errors during concurrent access
   **Solution**:
   - Enable WAL mode: `PRAGMA journal_mode = WAL`
   - Increase busy timeout: `PRAGMA busy_timeout = 5000`
   - Check for long-running transactions

2. **Issue**: Slow full-text search queries
   **Solution**:
   - Rebuild FTS index: `INSERT INTO files_fts(files_fts) VALUES('rebuild')`
   - Optimize FTS: `INSERT INTO files_fts(files_fts) VALUES('optimize')`
   - Check FTS tokenizer settings

3. **Issue**: Database file grows too large (> 500 MB)
   **Solution**:
   - Run `VACUUM` to reclaim deleted space
   - Check for orphaned embeddings: `DELETE FROM embeddings WHERE file_id NOT IN (SELECT id FROM files)`
   - Consider archiving old data

4. **Issue**: Semantic search is very slow (> 5 seconds)
   **Solution**:
   - This is expected with SQLite (no native vector ops)
   - Limit embedding count (< 1000 chunks)
   - **Migrate to PostgreSQL with pgvector** for production

---

## Migration Path: SQLite → PostgreSQL

**When**: Phase 7 (v1.0 launch)

**Why Migrate**:
- Need concurrent writes for multi-user mode
- Native vector operations (pgvector) for fast semantic search
- Network-accessible for distributed services
- High availability and replication

**Migration Strategy**:
1. **Dual-Write Phase** (1 week): Write to both SQLite and PostgreSQL
2. **Validation Phase** (1 week): Compare query results, ensure parity
3. **Cutover** (1 day): Switch MCP server to PostgreSQL, keep SQLite as backup
4. **Cleanup** (1 week): Remove SQLite code after PostgreSQL stable

**Migration Script**: [[../guides/sqlite-to-postgresql-migration]]

---















## Related

[[test-strategy-summary]]
## Related

[[yaml-frontmatter]]
## Related

[[obsidian-tasks-plugin]]
## Related

[[obsidian-local-rest-api-plugin]]
## Related

[[claude-flow]]
## Related

[[watchdog-file-monitoring]]
## Related

[[gitpython]]
## Related Nodes

**Architecture**:
- [[../architecture/shadow-cache]] - SQLite-powered cache layer
- [[../architecture/mcp-server]] - Queries shadow cache

**Features**:
- [[../features/full-text-search]] - FTS5 implementation
- [[../features/semantic-search]] - Embeddings storage
- [[../features/metadata-queries]] - Fast frontmatter queries

**Decisions**:
- [[../decisions/technical/mvp-database-choice]] - Why SQLite for MVP
- [[../decisions/technical/sqlite-to-postgresql-migration]] - v1.0 migration plan

**Other Primitives**:
- [[postgresql]] - Replaces SQLite in v1.0
- [[python]] - sqlite3 standard library
- [[fastapi]] - MCP server that queries SQLite

---

## Revisit Criteria

**Reconsider this technology if**:
- MVP requires multi-user concurrent access (migrate to PostgreSQL early)
- Database size exceeds 1 GB (SQLite performance degrades)
- Query latency exceeds 500ms consistently (need better indexing or PostgreSQL)
- Semantic search becomes core feature (need pgvector immediately)

**Scheduled Review**: Phase 7 kickoff (v1.0 migration planning)

---

**Back to**: [[README|Technical Primitives Index]]
