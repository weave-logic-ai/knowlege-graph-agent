# Docker Setup - Quick Reference

## Overview

Production-ready Docker Compose configuration for Weave-NN MVP with 6 core services.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Nginx (Port 80/443)                     │
│                   Reverse Proxy + Load Balancer              │
└────────────────┬────────────────────────┬───────────────────┘
                 │                        │
    ┌────────────▼──────────┐  ┌─────────▼──────────┐
    │   FastAPI API Server  │  │    MCP Server      │
    │      (Port 8000)      │  │    (Port 8001)     │
    │  - REST endpoints     │  │  - Agent coord     │
    │  - WebSocket support  │  │  - Task mgmt       │
    └──┬──────────┬────────┘  └──┬──────────┬──────┘
       │          │               │          │
    ┌──▼──────────▼───────────────▼──────────▼──────┐
    │         Message Queue (RabbitMQ)              │
    │              (Port 5672/15672)                │
    └────────────────────┬──────────────────────────┘
                         │
    ┌────────────────────▼──────────────────────────┐
    │          Cache & Session (Redis)              │
    │                (Port 6379)                    │
    └───────────────────────────────────────────────┘
```

## Services

| Service | Port | Purpose | Memory | CPU |
|---------|------|---------|--------|-----|
| **api** | 8000 | FastAPI web server | 2GB | 2.0 |
| **mcp-server** | 8001 | Agent coordination | 1.5GB | 1.5 |
| **rabbitmq** | 5672, 15672 | Message queue | 1GB | 1.0 |
| **redis** | 6379 | Cache & sessions | 512MB | 0.5 |
| **nginx** | 80, 443 | Reverse proxy | 256MB | 0.5 |
| **grafana** | 3000 | Monitoring (optional) | - | - |

## Quick Start

### 1. Initial Setup

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env

# Or use Makefile
make setup
```

### 2. Start Services

```bash
# Development mode (hot reload enabled)
make dev
# or
docker-compose up -d

# Production mode
make prod
# or
docker-compose -f docker-compose.yml --profile production up -d
```

### 3. Verify Deployment

```bash
# Check service status
make status

# View logs
make logs

# Health checks
make health
```

## Common Commands

### Service Management

```bash
make dev          # Start in development mode
make prod         # Start in production mode
make down         # Stop all services
make restart      # Restart all services
make status       # Show service status
```

### Development

```bash
make logs         # Follow all logs
make logs-api     # Follow API logs only
make shell        # Open API shell
make shell-mcp    # Open MCP shell
make test         # Run tests
make lint         # Run linters
make format       # Format code
```

### Debugging

```bash
make redis-cli         # Connect to Redis
make rabbitmq-queues   # List RabbitMQ queues
make stats             # Show resource usage
make health            # Check service health
```

### Cleanup

```bash
make clean        # Stop and remove volumes
make clean-all    # Complete cleanup
make prune        # Clean Docker system
```

## Configuration

### Environment Variables

Key variables in `.env`:

```env
# Core settings
ENVIRONMENT=development
LOG_LEVEL=info

# Service ports
API_PORT=8000
MCP_PORT=8001

# RabbitMQ
RABBITMQ_USER=weave
RABBITMQ_PASS=your-secure-password

# Feature flags
ENABLE_SWAGGER_UI=true
ENABLE_METRICS=true
```

### Development vs Production

**Development Mode** (default):
- Hot reload enabled
- Source code mounted as volumes
- Debug logging
- All services exposed
- No resource limits

**Production Mode** (`--profile production`):
- Optimized builds
- Resource limits enforced
- Nginx reverse proxy
- Health checks active
- Security hardened

## Docker Files

### Main Configuration Files

```
docker-compose.yml              # Production configuration
docker-compose.override.yml     # Development overrides
.env.example                    # Environment template
.dockerignore                   # Build exclusions
```

### Build Files

```
docker/
├── Dockerfile.api              # FastAPI multi-stage build
├── Dockerfile.mcp              # MCP server multi-stage build
├── Dockerfile.dev-tools        # Development tools
├── entrypoint-api.sh           # API startup script
└── entrypoint-mcp.sh           # MCP startup script
```

### Configuration Files

```
config/
├── rabbitmq.conf               # RabbitMQ settings
├── nginx.conf                  # Nginx main config
└── nginx-sites/
    └── weave-nn.conf           # Site configuration
```

## Development Workflow

### 1. Start Development Environment

```bash
make dev
```

This automatically:
- Starts all services with hot reload
- Mounts source code as volumes
- Enables debug logging
- Exposes management interfaces

### 2. Make Code Changes

Edit files in `src/` - changes are reflected immediately, no rebuild needed.

### 3. Run Tests

```bash
make test              # Run all tests
make test-cov          # Run with coverage
```

### 4. Check Code Quality

```bash
make format            # Format with black
make lint              # Run linters
make quality           # Format + lint
```

### 5. View Logs

```bash
make logs              # All services
make logs-api          # API only
make logs-mcp          # MCP only
```

## Production Deployment

### 1. Build Images

```bash
make prod-build
```

### 2. Deploy with Monitoring

```bash
docker-compose --profile production --profile monitoring up -d
```

### 3. Verify Health

```bash
make health
make stats
```

### 4. Monitor Logs

```bash
make logs
```

### 5. Backup Data

```bash
make backup
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs for errors
make logs-api

# Check container status
make status

# Restart specific service
make restart-api
```

### Port Already in Use

```bash
# Find process using port
sudo netstat -tlnp | grep 8000

# Change port in .env
API_PORT=8001
```

### Volume Permission Issues

```bash
# Fix permissions
docker-compose exec -u root api chown -R weave:weave /app

# Or rebuild
make build
```

### Network Issues

```bash
# Test connectivity
docker-compose exec api ping rabbitmq
docker-compose exec api curl http://redis:6379

# Inspect network
make inspect-network
```

### Out of Memory

```bash
# Check resource usage
make stats

# Increase limits in docker-compose.yml
# deploy:
#   resources:
#     limits:
#       memory: 4G
```

## Health Checks

All services implement health checks:

- **API**: `GET /health`
- **MCP**: `GET /health`
- **RabbitMQ**: `rabbitmq-diagnostics ping`
- **Redis**: `redis-cli ping`
- **Nginx**: `wget /health`

Check health status:

```bash
# Automated check
make health

# Manual checks
curl http://localhost:8000/health
curl http://localhost:8001/health
```

## Networking

### Bridge Network

All services communicate via isolated bridge network:

```yaml
networks:
  weave-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Service Discovery

Services can reference each other by name:

```python
# From API to MCP
mcp_url = "http://mcp-server:8001"

# From any service to Redis
redis_url = "redis://redis:6379/0"

# From any service to RabbitMQ
rabbitmq_host = "rabbitmq"
```

## Volume Management

### Persistent Volumes

```
api-logs           # API application logs
mcp-data           # MCP agent data
mcp-logs           # MCP server logs
rabbitmq-data      # Message queue persistence
redis-data         # Cache persistence
nginx-logs         # Web server logs
grafana-data       # Monitoring data
```

### Backup Volumes

```bash
# Automated backup
make backup

# Manual backup
docker run --rm \
  -v weave-nn_rabbitmq-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/rabbitmq.tar.gz /data
```

## Security Best Practices

1. **Never commit .env** - Contains secrets
2. **Change default passwords** - Update in .env
3. **Use non-root users** - Already configured
4. **Enable resource limits** - Set in docker-compose.yml
5. **Keep images updated** - Rebuild regularly
6. **Use secrets management** - For production
7. **Enable HTTPS** - Configure SSL certificates
8. **Implement rate limiting** - Nginx configured

## Performance Tuning

### API Service

```yaml
# Increase workers
command: uvicorn src.main:app --workers 8

# Adjust resources
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 4G
```

### Redis Cache

```yaml
# Increase memory
command: redis-server --maxmemory 1gb
```

### RabbitMQ

```yaml
# More resources for high throughput
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
```

## Scaling Services

```bash
# Scale API horizontally
docker-compose up -d --scale api=3

# With Nginx load balancer
docker-compose --profile production up -d --scale api=3
```

## Monitoring

### Grafana Dashboard

Access at: http://localhost:3000

Default credentials:
- User: `admin`
- Pass: `admin` (change in .env)

### Resource Monitoring

```bash
# Real-time stats
make stats

# Container status
make status
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Test with Docker Compose
  run: |
    make setup
    make dev
    make test
    make down
```

### GitLab CI

```yaml
test:
  script:
    - make setup
    - make dev
    - make test
    - make clean
```

## Additional Resources

- [Full Docker Workflows](./docker-workflows.md) - Comprehensive guide
- [Architecture Overview](../weave-nn-project-hub.md) - System design
- [API Documentation](http://localhost:8000/docs) - When services running
- [RabbitMQ Management](http://localhost:15672) - Queue monitoring

## Support

For issues or questions:

1. Check logs: `make logs`
2. Review troubleshooting section
3. See [docker-workflows.md](./docker-workflows.md)
4. Open issue on GitHub

---

**Ready to Start?**

```bash
make setup    # Initial configuration
make dev      # Start development
make logs     # View output
```
