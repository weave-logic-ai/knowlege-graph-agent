# Python Stack - Archived

**Status**: Out of scope for MVP
**Date Archived**: 2025-10-23
**Reason**: Unified TypeScript architecture eliminates Python dependencies

---

## Why Archived

The MVP architecture was simplified from 4 services to 1 unified TypeScript service (Weaver). This eliminated all Python dependencies:

- **Python MCP Server** → Integrated into Weaver using `@modelcontextprotocol/sdk`
- **Python File Watcher** → Integrated into Weaver using `chokidar`
- **RabbitMQ (Pika client)** → Eliminated (Weaver's durable workflows handle async)

See: [[docs/architecture-simplification-complete|Architecture Simplification Journey]]

## Archived Files

- `fastapi.md` - Web framework for Python MCP server (not needed)
- `python-3-11.md` - Python runtime (not needed)
- `uvicorn.md` - ASGI server for FastAPI (not needed)
- `pika-rabbitmq-client.md` - RabbitMQ Python client (not needed)
- `watchdog-file-monitoring.md` - Python file watcher (replaced by chokidar)
- `pyyaml.md` - YAML parsing (not needed)

## When to Revisit

Python may be added back post-MVP for:
- ML/AI model inference (if local models needed)
- Data science notebooks (Jupyter integration)
- Custom plugins requiring Python libraries

For MVP, pure TypeScript stack is optimal.

---

**Related Documentation**:
- [[docs/weaver-mcp-unification-summary|Weaver MCP Unification]]
- [[docs/local-first-architecture-overview|Local-First Architecture]]
