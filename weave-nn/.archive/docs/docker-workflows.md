# Docker Workflows for Weave-NN

This document describes common Docker workflows for development and production.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience)

## Quick Start

### Development

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services in development mode
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f mcp-server

# Check service status
docker-compose ps

# Stop services
docker-compose down
```

### Production

```bash
# Use production compose file
docker-compose -f docker-compose.yml up -d

# Include nginx reverse proxy
docker-compose --profile production up -d

# Include monitoring
docker-compose --profile monitoring up -d

# All profiles
docker-compose --profile production --profile monitoring up -d
```

## Common Workflows

### 1. Starting Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d api

# Start without detaching (see logs in console)
docker-compose up api
```

### 2. Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api

# Since specific time
docker-compose logs --since 2024-01-01T00:00:00 api
```

### 3. Rebuilding Services

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build api

# Rebuild without cache
docker-compose build --no-cache api

# Rebuild and restart
docker-compose up -d --build api
```

### 4. Executing Commands

```bash
# Run command in running container
docker-compose exec api bash

# Run command in new container
docker-compose run --rm api bash

# Run Python commands
docker-compose exec api python -m pytest
docker-compose exec api python -m src.main

# Run as specific user
docker-compose exec -u weave api bash
```

### 5. Database Operations

```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Check RabbitMQ status
docker-compose exec rabbitmq rabbitmqctl status

# List RabbitMQ queues
docker-compose exec rabbitmq rabbitmqctl list_queues
```

### 6. Volume Management

```bash
# List volumes
docker volume ls | grep weave-nn

# Inspect volume
docker volume inspect weave-nn_api-logs

# Remove all volumes (WARNING: destroys data)
docker-compose down -v

# Remove specific volume
docker volume rm weave-nn_api-logs
```

### 7. Cleanup

```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Complete cleanup
docker-compose down -v --rmi all --remove-orphans
```

## Development Workflows

### Hot Reload Development

The `docker-compose.override.yml` automatically enables hot reload:

```bash
# Start in development mode (uses override automatically)
docker-compose up -d

# Edit files in src/ - changes are reflected immediately
# No need to rebuild or restart
```

### Running Tests

```bash
# Run all tests
docker-compose exec api pytest

# Run with coverage
docker-compose exec api pytest --cov=src --cov-report=html

# Run specific test
docker-compose exec api pytest tests/test_api.py::test_health

# Run tests in new container
docker-compose run --rm api pytest
```

### Code Quality Checks

```bash
# Format code
docker-compose exec api black src/

# Lint code
docker-compose exec api flake8 src/

# Type checking
docker-compose exec api mypy src/

# All checks
docker-compose exec api bash -c "black src/ && flake8 src/ && mypy src/"
```

### Interactive Development

```bash
# Start development tools container
docker-compose run --rm dev-tools bash

# Inside container
pytest -v                    # Run tests
black src/                   # Format code
ipython                      # Interactive Python
```

## Production Workflows

### Deploying Updates

```bash
# Pull latest changes
git pull

# Rebuild services
docker-compose -f docker-compose.yml build

# Zero-downtime restart (one at a time)
docker-compose -f docker-compose.yml up -d --no-deps --build api
docker-compose -f docker-compose.yml up -d --no-deps --build mcp-server

# Verify deployment
docker-compose ps
docker-compose logs -f --tail=50
```

### Health Checks

```bash
# Check API health
curl http://localhost:8000/health

# Check MCP health
curl http://localhost:8001/health

# Check all container health
docker-compose ps

# Detailed health status
docker inspect weave-nn-api | jq '.[0].State.Health'
```

### Monitoring

```bash
# Resource usage
docker stats

# Service status
docker-compose ps

# Service logs with timestamps
docker-compose logs -f -t

# Access Grafana (if monitoring profile enabled)
open http://localhost:3000
```

### Backup and Restore

```bash
# Backup volumes
docker run --rm \
  -v weave-nn_rabbitmq-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/rabbitmq-$(date +%Y%m%d).tar.gz /data

# Restore volumes
docker run --rm \
  -v weave-nn_rabbitmq-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/rabbitmq-20240101.tar.gz -C /
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs api

# Check container status
docker-compose ps

# Inspect container
docker inspect weave-nn-api

# Check if port is already in use
netstat -tlnp | grep 8000
```

### Connectivity Issues

```bash
# Test network connectivity
docker-compose exec api ping rabbitmq
docker-compose exec api curl http://redis:6379

# Check network
docker network inspect weave-nn_weave-network

# DNS resolution
docker-compose exec api nslookup rabbitmq
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase resources in docker-compose.yml
# deploy:
#   resources:
#     limits:
#       cpus: '4.0'
#       memory: 4G

# Check logs for errors
docker-compose logs -f | grep -i error
```

### Volume Permission Issues

```bash
# Fix permissions
docker-compose exec -u root api chown -R weave:weave /app

# Or rebuild with correct user
docker-compose build --no-cache api
```

## Advanced Usage

### Multi-Environment Setup

```bash
# Development
docker-compose up -d

# Staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Production
docker-compose -f docker-compose.yml --profile production up -d
```

### Scaling Services

```bash
# Scale API service to 3 instances
docker-compose up -d --scale api=3

# With load balancer
docker-compose --profile production up -d --scale api=3
```

### Custom Networks

```bash
# Create external network
docker network create weave-external

# Use in docker-compose.yml
# networks:
#   default:
#     external:
#       name: weave-external
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Build and test
  run: |
    docker-compose build
    docker-compose run --rm api pytest
    docker-compose down -v
```

### GitLab CI Example

```yaml
test:
  script:
    - docker-compose build
    - docker-compose run --rm api pytest
    - docker-compose down -v
```

## Best Practices

1. **Always use .env for configuration** - Never hardcode secrets
2. **Use override files for development** - Keep production config clean
3. **Regular backups** - Backup volumes before major changes
4. **Monitor logs** - Use centralized logging in production
5. **Health checks** - Implement proper health endpoints
6. **Resource limits** - Set appropriate CPU and memory limits
7. **Security** - Run containers as non-root user
8. **Networks** - Use isolated networks for security
9. **Volumes** - Use named volumes for persistence
10. **Testing** - Test docker-compose configs in CI/CD

## References

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Weave-NN Architecture](../weave-nn-project-hub.md)
