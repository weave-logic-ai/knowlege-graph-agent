# Future Features - Archived

**Status**: Out of scope for MVP
**Date Archived**: 2025-10-23
**Reason**: Simpler alternatives chosen for MVP

---

## Why Archived

These technologies may be valuable in future versions but add unnecessary complexity for MVP:

### PostgreSQL

**MVP uses**: SQLite for shadow cache
**Why SQLite**:
- Simpler setup (no database server)
- Sufficient for local-first architecture
- File-based (fits with Obsidian vault pattern)
- Zero configuration

**When to add PostgreSQL**:
- Multi-user deployments (post-MVP)
- Cloud version with shared state
- Advanced querying needs (full-text search, JSON queries)
- Replication/HA requirements

See: [[technical/sqlite|SQLite for Shadow Cache]]

### GitPython

**MVP uses**: simple-git (Node.js library)
**Why simple-git**:
- Pure TypeScript stack (no Python)
- Sufficient for basic Git operations (commit, push, status)
- Better integration with Weaver

**When to add GitPython**:
- If complex Git operations needed (rebase, cherry-pick, submodules)
- If performance of simple-git is insufficient
- If Python components are added back

See: [[technical/simple-git|Simple Git Library]]

## Archived Files

- `postgresql.md` - Relational database
- `gitpython.md` - Python Git library

---

**Related Documentation**:
- [[docs/local-first-architecture-overview|Local-First Architecture]]
- [[docs/architecture-simplification-complete|Architecture Simplification]]
