---
type: technical-primitive
category: tool
status: in-use
first_used_phase: "PHASE-5"
mvp_required: true
future_only: false
maturity: mature

# Integration tracking
used_in_services:
  - mcp-server
deployment: docker-compose

# Relationships
alternatives_considered:
  - "[[gunicorn]]"
  - "[[hypercorn]]"
  - "[[daphne]]"
replaces: null
replaced_by: null

# Documentation
decision: "[[../decisions/technical/asgi-server-selection]]"
architecture: "[[../architecture/mcp-server]]"

tags:
  - technical
  - tool
  - server
  - asgi
  - in-use
---

# Uvicorn

**Category**: ASGI Server Tool
**Status**: In Use (MVP)
**First Used**: Phase 5 Day 2 (Week 1)

---

## Overview

Uvicorn is a lightning-fast ASGI (Asynchronous Server Gateway Interface) server implementation built on uvloop and httptools, designed specifically for running asynchronous Python web applications like FastAPI.

**Official Site**: https://www.uvicorn.org/
**Documentation**: https://www.uvicorn.org/deployment/

---

## Why We Use It

Uvicorn serves as the production-ready HTTP server for Weave-NN's FastAPI-based MCP (Model Context Protocol) server, providing async request handling and high-performance response delivery.

**Primary Purpose**: Run the FastAPI MCP server application with async support and production-grade reliability.

**Specific Use Cases**:
- HTTP server for FastAPI MCP endpoints in [[../architecture/mcp-server]]
- Hot reload during development (--reload flag)
- Production deployment with worker processes
- SSL/TLS termination for secure connections (future)
- WebSocket support for real-time MCP streaming (future)

---

## Key Capabilities

- **ASGI Standard Compliance**: Full support for async Python web frameworks (FastAPI, Starlette) - enables non-blocking request handling
- **uvloop Integration**: Uses uvloop (fast event loop) for 2-4x performance improvement over standard asyncio
- **Auto-Reload**: Watches code changes during development and automatically restarts server
- **Multi-Worker Support**: Process-based parallelism with --workers flag for production deployments
- **HTTP/2 Support**: Enables multiplexing and server push capabilities (via optional h11 backend)

---

## Integration Points

**Used By**:
- [[../architecture/mcp-server]] - Runs FastAPI application serving MCP protocol endpoints
- [[../architecture/file-watcher]] - Future: May use for internal REST API (currently standalone)

**Integrates With**:
- [[fastapi]] - Uvicorn serves FastAPI ASGI application instances
- [[docker]] - Runs as CMD in MCP server container
- [[python]] - Native Python ASGI server implementation

**Enables Features**:
- [[../features/mcp-integration]] - Serves MCP endpoints for Claude Code integration
- [[../features/auto-tagging]] - HTTP API triggers for manual rule invocation (future)
- [[../features/real-time-sync]] - WebSocket support for live vault updates (future)

---

## Configuration

**Docker Compose** (MVP):
```yaml
mcp-server:
  build: ./mcp-server
  command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  ports:
    - "8000:8000"
  volumes:
    - ./mcp-server:/app
    - ./vault:/vault:ro
  environment:
    RABBITMQ_HOST: rabbitmq
    RABBITMQ_PORT: 5672
```

**Environment Variables**:
- `UVICORN_HOST`: Bind address (default: 127.0.0.1) - set to 0.0.0.0 for Docker
- `UVICORN_PORT`: Port number (default: 8000)
- `UVICORN_WORKERS`: Number of worker processes (default: 1) - use CPU count for production
- `UVICORN_LOG_LEVEL`: Logging verbosity (debug|info|warning|error|critical)
- `UVICORN_RELOAD`: Enable auto-reload (default: false) - only for development

**Key Configuration Files**:
- `/mcp-server/app/main.py` - FastAPI application entry point
- `/mcp-server/Dockerfile` - Defines uvicorn as CMD

**CLI Usage**:
```bash
# Development with auto-reload
uvicorn app.main:app --reload --log-level debug

# Production with multiple workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# With SSL (future)
uvicorn app.main:app --ssl-keyfile=key.pem --ssl-certfile=cert.pem
```

---

## Deployment

**MVP (Phase 5-6)**: Docker Compose on local machine with single worker
**v1.0 (Post-MVP)**: Kubernetes deployment with 3-5 workers per pod + load balancer

**Resource Requirements**:
- RAM: 50-100 MB per worker (base) + 200-500 MB for FastAPI app
- CPU: 0.1-0.5 cores per worker (depends on request load)
- Storage: Minimal (server process only, no persistent data)

**Health Check**:
```bash
# Check if Uvicorn is running and serving requests
curl http://localhost:8000/health

# Check Docker container
docker ps | grep mcp-server

# View Uvicorn logs
docker logs mcp-server --follow
```

**Production Tuning**:
```bash
# Auto-scale workers to CPU count
uvicorn app.main:app --workers $(nproc)

# Limit request size (prevent DoS)
uvicorn app.main:app --limit-max-requests 1000

# Connection timeout
uvicorn app.main:app --timeout-keep-alive 5
```

---

## Trade-offs

**Pros** (Why we chose it):
- ✅ **Native ASGI Support**: Built specifically for async Python frameworks (FastAPI, Starlette)
- ✅ **Performance**: uvloop provides 2-4x faster event loop than standard asyncio
- ✅ **Developer Experience**: Auto-reload makes development iteration instant
- ✅ **Production-Ready**: Worker processes + graceful shutdown for zero-downtime deploys
- ✅ **Lightweight**: Minimal overhead compared to traditional WSGI servers

**Cons** (What we accepted):
- ⚠️ **Single-Process Limitation**: Each worker is a separate process (no shared memory) - mitigated by external caching (Redis future)
- ⚠️ **No Built-in Load Balancing**: Requires external LB in multi-worker setup - acceptable for MVP, nginx/k8s in production
- ⚠️ **Limited Middleware**: Some WSGI middleware incompatible with ASGI - acceptable because FastAPI provides ASGI middleware

---

## Alternatives Considered

**Compared With**:

### [[gunicorn]]
- **Pros**: More mature, battle-tested WSGI server with extensive middleware ecosystem
- **Cons**: WSGI-only (no native async), requires gunicorn[uvicorn] bridge for ASGI
- **Decision**: Rejected because Uvicorn is native ASGI and simpler for FastAPI

### [[hypercorn]]
- **Pros**: Supports HTTP/2, HTTP/3 (QUIC), and WebSockets natively
- **Cons**: Less mature than Uvicorn, smaller community, slightly slower
- **Decision**: Rejected for MVP simplicity; reconsider if HTTP/3 required in v1.0

### [[daphne]]
- **Pros**: Official Django Channels ASGI server, mature for WebSocket handling
- **Cons**: Slower than Uvicorn, tied to Django ecosystem
- **Decision**: Rejected because we use FastAPI, not Django

---

## Decision History

**Decision Record**: [[../decisions/technical/asgi-server-selection]]

**Key Reasoning**:
> "Uvicorn is the de facto standard for running FastAPI in production. Its uvloop integration provides significant performance gains over traditional WSGI servers, and the auto-reload feature is essential for rapid development iteration during Phase 5 MVP implementation."

**Date Decided**: 2025-10-21 (Phase 5 Day 2 implementation)
**Decided By**: System Architect (during MCP server setup)

---

## Phase Usage

### Phase 5 (MVP Week 1) - In Use
**Status**: Active - runs FastAPI MCP server in Docker Compose
**Configuration**: Single worker with --reload flag for development
**Usage**: Serves MCP endpoints for Claude Code integration
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Phase 6 (MVP Week 2) - In Use
**Status**: Active - same configuration as Phase 5
**Enhancements**: May add health check endpoint and structured logging
**Usage**: Continues serving MCP endpoints with potential performance monitoring

### Phase 7 (v1.0) - Enhanced
**Status**: Production deployment with multiple workers
**Configuration**: 4 workers (CPU count), SSL termination, nginx reverse proxy
**Improvements**:
- Multi-worker deployment for horizontal scaling
- SSL/TLS for secure external access
- Prometheus metrics endpoint for monitoring
- Graceful shutdown hooks for zero-downtime deploys

---

## Learning Resources

**Official Documentation**:
- [Uvicorn Docs](https://www.uvicorn.org/) - Main documentation
- [Deployment Guide](https://www.uvicorn.org/deployment/) - Production best practices
- [Settings Reference](https://www.uvicorn.org/settings/) - CLI and environment variables

**Tutorials**:
- [FastAPI + Uvicorn Tutorial](https://fastapi.tiangolo.com/deployment/server-workers/) - Official FastAPI deployment guide
- [Docker + Uvicorn Best Practices](https://fastapi.tiangolo.com/deployment/docker/) - Containerization patterns

**Best Practices**:
- [Production Deployment Guide](https://www.uvicorn.org/deployment/#running-with-gunicorn) - Multi-worker setup
- [Performance Tuning](https://www.uvicorn.org/settings/#tuning) - Optimization tips

**Community**:
- [GitHub Repo](https://github.com/encode/uvicorn) - Source code and issue tracker
- [Discussions](https://github.com/encode/uvicorn/discussions) - Community forum

---

## Monitoring & Troubleshooting

**Health Checks**:
```bash
# Check if Uvicorn is running and accepting requests
curl http://localhost:8000/health
# Expected: {"status": "healthy"}

# Check Docker container status
docker ps | grep mcp-server
# Expected: Container running on port 8000

# View real-time logs
docker logs mcp-server --follow --tail 100

# Check worker processes (production)
ps aux | grep uvicorn
```

**Common Issues**:

1. **Issue**: Port already in use (Address already in use)
   **Solution**:
   ```bash
   # Find process using port 8000
   lsof -i :8000

   # Kill process or change port
   uvicorn app.main:app --port 8001
   ```

2. **Issue**: Auto-reload not working in Docker
   **Solution**: Ensure volume mount includes source code
   ```yaml
   volumes:
     - ./mcp-server:/app  # Mount entire app directory
   ```

3. **Issue**: 502 Bad Gateway with reverse proxy
   **Solution**: Check Uvicorn is binding to 0.0.0.0, not 127.0.0.1
   ```bash
   uvicorn app.main:app --host 0.0.0.0
   ```

4. **Issue**: High CPU usage with single worker
   **Solution**: Scale to multiple workers for production
   ```bash
   uvicorn app.main:app --workers $(nproc)
   ```

---

## Related Nodes

**Architecture**:
- [[../architecture/mcp-server]] - Primary service using Uvicorn
- [[../architecture/mvp-local-first-architecture]] - MVP system design

**Features**:
- [[../features/mcp-integration]] - Enabled by Uvicorn serving FastAPI
- [[../features/real-time-sync]] - Future WebSocket support

**Decisions**:
- [[../decisions/technical/asgi-server-selection]] - Why Uvicorn over alternatives
- [[../decisions/technical/fastapi-framework]] - FastAPI + Uvicorn stack decision

**Other Primitives**:
- [[fastapi]] - Web framework served by Uvicorn
- [[python]] - Programming language
- [[docker]] - Container platform running Uvicorn

---

## Revisit Criteria

**Reconsider this technology if**:
- Performance degrades below 100 req/sec per worker (switch to Hypercorn or custom Rust server)
- HTTP/3 (QUIC) becomes critical requirement (evaluate Hypercorn)
- WSGI compatibility needed (add Gunicorn as reverse proxy)
- Memory usage exceeds 500 MB per worker (investigate memory leaks or optimize FastAPI app)

**Scheduled Review**: 6 months after v1.0 launch (evaluate performance metrics)

---

**Back to**: [[README|Technical Primitives Index]]
