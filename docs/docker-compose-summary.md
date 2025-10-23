# Docker Compose Configuration Summary

## Overview

This document summarizes the complete Docker Compose setup for Weave-NN MVP.

## Created Files

### Root Configuration
- `/docker-compose.yml` - Production service definitions
- `/docker-compose.override.yml` - Development overrides
- `/.env.example` - Environment variable template
- `/.dockerignore` - Build exclusion patterns
- `/Makefile` - Convenience commands

### Docker Images
- `/docker/Dockerfile.api` - FastAPI multi-stage build
- `/docker/Dockerfile.mcp` - MCP server multi-stage build
- `/docker/Dockerfile.dev-tools` - Development tools container
- `/docker/entrypoint-api.sh` - API initialization script
- `/docker/entrypoint-mcp.sh` - MCP initialization script

### Service Configuration
- `/config/rabbitmq.conf` - RabbitMQ settings
- `/config/nginx.conf` - Nginx main configuration
- `/config/nginx-sites/weave-nn.conf` - Site configuration

### Documentation
- `/docs/docker-workflows.md` - Comprehensive workflow guide
- `/docs/DOCKER-SETUP.md` - Quick reference guide
- `/docs/docker-compose-summary.md` - This file

## Service Architecture

### 1. FastAPI API Server (api)
**Purpose**: Main web application and REST API
**Port**: 8000
**Image**: Custom multi-stage build
**Key Features**:
- Hot reload in development
- Health checks every 30s
- Resource limits: 2GB RAM, 2 CPUs
- Non-root user (weave:1000)
- Automatic service dependency waiting

**Dependencies**: RabbitMQ, Redis

**Environment Variables**:
```env
ENVIRONMENT=development
LOG_LEVEL=info
RABBITMQ_HOST=rabbitmq
REDIS_URL=redis://redis:6379/0
MCP_SERVER_URL=http://mcp-server:8001
```

**Volumes**:
- `./src:/app/src:ro` - Source code (read-only in production)
- `api-logs:/app/logs` - Log persistence

### 2. MCP Server (mcp-server)
**Purpose**: Agent coordination and task orchestration
**Port**: 8001
**Image**: Custom multi-stage build
**Key Features**:
- Agent management
- Task distribution
- Session persistence
- Health monitoring

**Dependencies**: RabbitMQ, Redis

**Environment Variables**:
```env
ENVIRONMENT=development
RABBITMQ_HOST=rabbitmq
REDIS_URL=redis://redis:6379/1
```

**Volumes**:
- `./src:/app/src:ro` - Source code
- `mcp-data:/app/data` - Agent data persistence
- `mcp-logs:/app/logs` - Log persistence

### 3. RabbitMQ Message Queue (rabbitmq)
**Purpose**: Asynchronous message queue for inter-service communication
**Ports**: 5672 (AMQP), 15672 (Management UI)
**Image**: `rabbitmq:3.13-management-alpine`
**Key Features**:
- Management UI at http://localhost:15672
- Persistent message storage
- Health checks via diagnostics
- Custom configuration

**Environment Variables**:
```env
RABBITMQ_DEFAULT_USER=weave
RABBITMQ_DEFAULT_PASS=weave_secret
```

**Volumes**:
- `rabbitmq-data:/var/lib/rabbitmq` - Queue persistence
- `./config/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro` - Configuration

**Resource Limits**: 1GB RAM, 1 CPU

### 4. Redis Cache (redis)
**Purpose**: Cache, session storage, and real-time data
**Port**: 6379
**Image**: `redis:7-alpine`
**Key Features**:
- LRU eviction policy
- AOF persistence
- 512MB memory limit
- Automatic health checks

**Command**:
```bash
redis-server \
  --maxmemory 512mb \
  --maxmemory-policy allkeys-lru \
  --appendonly yes \
  --appendfsync everysec
```

**Volumes**:
- `redis-data:/data` - Persistence

**Resource Limits**: 512MB RAM, 0.5 CPU

### 5. Nginx Reverse Proxy (nginx)
**Purpose**: Load balancer, reverse proxy, SSL termination
**Ports**: 80 (HTTP), 443 (HTTPS)
**Image**: `nginx:alpine`
**Profile**: `production` (optional in development)
**Key Features**:
- Rate limiting (10 req/s for API, 5 req/s for MCP)
- Gzip compression
- Security headers
- Upstream health checks

**Dependencies**: API, MCP Server

**Volumes**:
- `./config/nginx.conf:/etc/nginx/nginx.conf:ro` - Main config
- `./config/nginx-sites:/etc/nginx/conf.d:ro` - Site configs
- `nginx-logs:/var/log/nginx` - Access/error logs

**Resource Limits**: 256MB RAM, 0.5 CPU

### 6. Grafana Monitoring (grafana)
**Purpose**: Metrics visualization and monitoring
**Port**: 3000
**Image**: `grafana/grafana:latest`
**Profile**: `monitoring` (optional)
**Key Features**:
- Redis datasource plugin
- Provisioned dashboards
- User authentication

**Environment Variables**:
```env
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=admin
```

**Volumes**:
- `grafana-data:/var/lib/grafana` - Dashboard persistence
- `./config/grafana:/etc/grafana/provisioning:ro` - Provisioning

## Network Architecture

### Bridge Network: `weave-network`
**Subnet**: 172.20.0.0/16
**Driver**: bridge

**Service Discovery**:
- All services communicate via service names
- Example: `http://api:8000`, `redis://redis:6379`
- Isolated from host network

## Volume Management

### Persistent Volumes

| Volume | Purpose | Size | Backup Priority |
|--------|---------|------|----------------|
| `api-logs` | API application logs | ~100MB | Low |
| `mcp-data` | Agent data, sessions | ~500MB | High |
| `mcp-logs` | MCP server logs | ~100MB | Low |
| `rabbitmq-data` | Message queue persistence | ~1GB | High |
| `redis-data` | Cache persistence | ~512MB | Medium |
| `nginx-logs` | Web server logs | ~100MB | Low |
| `grafana-data` | Monitoring dashboards | ~100MB | Medium |

### Development Volumes

| Volume | Purpose |
|--------|---------|
| `dev-cache` | Development tools cache |

## Development vs Production

### Development Mode (default)

**Enabled by**: `docker-compose.override.yml`

**Features**:
- Hot reload for Python services
- Source code mounted as read-write
- Debug logging enabled
- All management interfaces exposed
- No resource limits
- Dev-tools container included

**Command**:
```bash
docker-compose up -d
```

### Production Mode

**Enabled by**: `docker-compose.yml` + `--profile production`

**Features**:
- Optimized builds (multi-stage)
- Source code copied (not mounted)
- Info-level logging
- Nginx reverse proxy enabled
- Resource limits enforced
- Security hardened (non-root users)

**Command**:
```bash
docker-compose -f docker-compose.yml --profile production up -d
```

## Health Checks

### API Service
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### MCP Service
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### RabbitMQ
```yaml
healthcheck:
  test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

### Redis
```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 20s
```

### Nginx
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Resource Allocation

### Total Resources (Production)

| Resource | Total | Usage |
|----------|-------|-------|
| CPU | ~5.5 cores | 6 services |
| Memory | ~5.25 GB | With overhead |
| Disk | ~2.5 GB | Data volumes |
| Network | 1 bridge | Isolated |

### Scaling Considerations

**Horizontal Scaling**:
- API: Up to 10 instances behind Nginx
- MCP: 2-3 instances for redundancy

**Vertical Scaling**:
- Adjust `deploy.resources.limits` per service
- Increase RabbitMQ memory for high throughput
- Scale Redis memory for large caches

## Security Features

### 1. Non-Root Users
All services run as user `weave` (UID 1000)

### 2. Read-Only Mounts
Production source code mounted read-only

### 3. Network Isolation
Services communicate via isolated bridge network

### 4. Resource Limits
CPU and memory limits prevent DoS

### 5. Health Checks
Automatic restart on service failure

### 6. Security Headers (Nginx)
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 7. Rate Limiting (Nginx)
- API: 10 requests/second
- MCP: 5 requests/second

## Startup Sequence

### Service Dependencies

```
1. Redis (20s start period)
   ↓
2. RabbitMQ (60s start period)
   ↓
3. API + MCP (40s start period)
   ↓
4. Nginx (30s start period)
   ↓
5. Grafana (optional)
```

### Entrypoint Script Flow

**API Entrypoint** (`docker/entrypoint-api.sh`):
1. Wait for RabbitMQ health check
2. Wait for Redis availability
3. Run database migrations (production only)
4. Start application

**MCP Entrypoint** (`docker/entrypoint-mcp.sh`):
1. Wait for RabbitMQ health check
2. Wait for Redis availability
3. Initialize data directories
4. Start MCP server

## Common Operations

### Starting Services
```bash
make dev              # Development mode
make prod             # Production mode
docker-compose up -d  # Manual start
```

### Viewing Logs
```bash
make logs             # All services
make logs-api         # API only
docker-compose logs -f mcp-server  # Manual
```

### Rebuilding
```bash
make build            # Build all
make dev-build        # Build and start
docker-compose build --no-cache api  # Manual
```

### Health Checks
```bash
make health           # Automated check
curl http://localhost:8000/health    # Manual API
curl http://localhost:8001/health    # Manual MCP
```

### Cleanup
```bash
make clean            # Remove volumes
make clean-all        # Complete cleanup
docker-compose down -v  # Manual
```

## Monitoring and Debugging

### Resource Monitoring
```bash
make stats                    # Container resources
docker-compose top            # Process list
docker-compose ps             # Service status
```

### Service Logs
```bash
make logs                     # All logs
make logs-api                 # API logs
docker-compose logs --tail=100 mcp-server  # Last 100 lines
```

### Interactive Debugging
```bash
make shell                    # API shell
make shell-mcp                # MCP shell
make shell-dev                # Dev tools
docker-compose exec api ipython  # Python REPL
```

### Database Access
```bash
make redis-cli                # Redis CLI
make rabbitmq-queues          # List queues
docker-compose exec rabbitmq rabbitmqctl status
```

## Troubleshooting

### Services Won't Start
```bash
# Check logs
make logs

# Validate configuration
docker-compose config

# Check ports
sudo netstat -tlnp | grep -E "8000|8001|5672|6379"
```

### Network Issues
```bash
# Test connectivity
docker-compose exec api ping rabbitmq
docker-compose exec api curl http://mcp-server:8001/health

# Inspect network
docker network inspect weave-nn_weave-network
```

### Volume Issues
```bash
# Check volumes
docker volume ls | grep weave-nn

# Fix permissions
docker-compose exec -u root api chown -R weave:weave /app

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

## Backup and Restore

### Automated Backup
```bash
make backup
# Creates timestamped archives in backups/
```

### Manual Backup
```bash
# RabbitMQ
docker run --rm \
  -v weave-nn_rabbitmq-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/rabbitmq.tar.gz /data

# Redis
docker run --rm \
  -v weave-nn_redis-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/redis.tar.gz /data
```

### Restore
```bash
# Stop services
docker-compose down

# Restore volume
docker run --rm \
  -v weave-nn_rabbitmq-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/rabbitmq.tar.gz -C /

# Restart services
docker-compose up -d
```

## Configuration Files Reference

### `.env` Variables

**Required**:
- `ENVIRONMENT` - development/staging/production
- `RABBITMQ_USER` - RabbitMQ username
- `RABBITMQ_PASS` - RabbitMQ password

**Optional**:
- `API_PORT` - API service port (default: 8000)
- `MCP_PORT` - MCP service port (default: 8001)
- `LOG_LEVEL` - Logging level (default: info)
- `GRAFANA_USER` - Grafana admin user
- `GRAFANA_PASSWORD` - Grafana admin password

### Makefile Targets

**Core**:
- `make help` - Show all commands
- `make dev` - Start development
- `make prod` - Start production
- `make down` - Stop services
- `make clean` - Remove volumes

**Development**:
- `make test` - Run tests
- `make lint` - Run linters
- `make format` - Format code
- `make shell` - Open shell

**Monitoring**:
- `make logs` - Follow logs
- `make stats` - Resource usage
- `make health` - Health checks

**Maintenance**:
- `make backup` - Backup volumes
- `make prune` - Clean Docker
- `make validate` - Validate config

## Performance Tuning

### API Service Optimization
```yaml
# Increase workers
command: uvicorn src.main:app --workers 8 --host 0.0.0.0 --port 8000

# Adjust resources
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 4G
```

### Redis Optimization
```yaml
# Increase cache size
command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

### RabbitMQ Optimization
```conf
# In config/rabbitmq.conf
vm_memory_high_watermark.relative = 0.8
channel_max = 4094
```

## Next Steps

1. **Setup Environment**: `make setup`
2. **Start Services**: `make dev`
3. **View Logs**: `make logs`
4. **Run Tests**: `make test`
5. **Check Health**: `make health`

## Additional Resources

- [Full Workflows Guide](./docker-workflows.md)
- [Quick Setup](./DOCKER-SETUP.md)
- [API Documentation](http://localhost:8000/docs)
- [RabbitMQ Management](http://localhost:15672)
- [Grafana Dashboard](http://localhost:3000)

---

**Configuration Complete!** 🎉

All files created and ready for deployment.
