---
visual:
  icon: 📚
icon: 📚
---
# Migration Quick Reference Guide

**Quick Reference**: Key patterns and commands for migrating from local MVP to microservices

---

## 🎯 Three-Phase Migration Strategy

```
Phase 0: Local MVP (Weeks 1-2)
  └─> Single Docker Compose deployment
      └─> Service boundaries defined from day 1

Phase 1: Service Extraction (Months 2-3)
  └─> Strangler Fig Pattern
      └─> 10% → 50% → 100% traffic migration

Phase 2: Kubernetes (Months 4-6)
  └─> K8s cluster with StatefulSets
      └─> Zero-downtime rolling updates
```

---

## ✅ Local MVP Best Practices (Phase 0)

### 1. Service Boundary Structure
```
weave-nn-mcp/
├── services/
│   ├── file_service/      # Future microservice
│   ├── task_service/      # Future microservice
│   └── git_service/       # Future microservice
├── shared/
│   ├── rabbitmq_client.py # Shared messaging
│   └── config.py          # Centralized config
└── docker-compose.yml     # Orchestration
```

### 2. Event-Driven Communication
```python
# ✅ DO: Use RabbitMQ for all inter-service communication
rabbitmq.publish("vault.file.created", event_data)

# ❌ DON'T: Direct function calls
file_service.create_note()  # Breaks decomposition
```

### 3. Configuration Management
```python
# ✅ DO: Environment variables
from shared.config import settings
DATABASE_URL = settings.database_url

# ❌ DON'T: Hard-coded values
DATABASE_URL = "sqlite:///./weave-nn.db"
```

### 4. Database Abstraction
```python
# ✅ DO: SQLAlchemy ORM (database-agnostic)
engine = create_engine(settings.database_url)  # Works with SQLite or PostgreSQL

# ❌ DON'T: Raw SQL with dialect-specific syntax
cursor.execute("SELECT * FROM tasks LIMIT 10")  # SQLite syntax
```

---

## 🔀 Service Extraction Pattern (Phase 1)

### Strangler Fig Pattern Steps

1. **Create standalone service**
   ```bash
   mkdir task-service
   cd task-service
   # Copy service code from monolith
   ```

2. **Deploy alongside monolith**
   ```yaml
   # docker-compose.yml
   services:
     mcp-server:  # Old monolith
     task-service:  # New microservice
   ```

3. **Feature flag traffic routing**
   ```python
   if feature_flag.use_new_service():
       return new_task_service.list_tasks()
   else:
       return old_task_service.list_tasks()
   ```

4. **Gradual rollout**
   ```
   Week 1: 10% traffic → new service
   Week 2: 25% traffic → new service
   Week 3: 50% traffic → new service
   Week 4: 100% traffic → new service ✅ Remove old code
   ```

---

## 🗃️ Database Migration Strategy

### Dual-Write Pattern (Zero Downtime)

```python
def create_task(task_data):
    # Primary write: PostgreSQL
    task = postgres_db.insert(task_data)

    # Dual-write: SQLite (during migration only)
    if settings.DUAL_WRITE_ENABLED:
        try:
            sqlite_db.insert(task_data)
        except Exception as e:
            logger.error(f"Dual-write failed: {e}")

    return task
```

**Timeline**:
1. Week 1: Enable dual-write (write to both)
2. Week 2: Backfill historical data
3. Week 3: Verify consistency
4. Week 4: Disable dual-write
5. Week 5: Remove SQLite

---

## ☸️ Kubernetes Deployment (Phase 2)

### Key Infrastructure Components

1. **Ingress Controller** (Nginx)
   - TLS termination
   - Load balancing
   - Rate limiting

2. **StatefulSets** (for stateful services)
   - PostgreSQL (3 replicas)
   - RabbitMQ (3-node cluster)
   - Redis (master + 2 replicas)

3. **Deployments** (for stateless services)
   - Task Service (3 replicas)
   - File Service (3 replicas)
   - Git Service (3 replicas)

### Deployment Commands

```bash
# Deploy service
kubectl apply -f k8s/task-service-deployment.yaml

# Check status
kubectl get pods -l app=task-service

# View logs
kubectl logs -f deployment/task-service

# Rollback
kubectl rollout undo deployment/task-service
```

### Zero-Downtime Rolling Update

```yaml
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1  # At most 1 pod down
      maxSurge: 1        # At most 1 extra pod
```

---

## 🧪 Testing Strategies

### 1. Shadow Mode Testing
```python
# Production response (always returned)
prod_response = old_service.list_tasks()

# Shadow response (for comparison only)
shadow_response = new_service.list_tasks()
if prod_response != shadow_response:
    logger.warning("Response mismatch detected")

return prod_response  # Always return prod
```

### 2. Feature Flag Testing
```python
# Gradually roll out to users
user_hash = hash(user_id) % 100
if user_hash < settings.ROLLOUT_PERCENTAGE:
    return new_service.list_tasks()
else:
    return old_service.list_tasks()
```

### 3. Dual Deployment Testing
```bash
# Run both versions in parallel
docker-compose up mcp-server task-service

# Compare responses
curl http://localhost:8000/tasks  # Old service
curl http://localhost:8003/tasks  # New service
```

---

## 🚨 Rollback Strategies

### 1. Feature Flag Rollback (Instant)
```bash
# Disable new service (0% traffic)
kubectl set env deployment/api-gateway ROLLOUT_PERCENTAGE=0
```

### 2. Kubernetes Rollback (Fast)
```bash
# Rollback to previous version
kubectl rollout undo deployment/task-service

# Rollback to specific version
kubectl rollout undo deployment/task-service --to-revision=3
```

### 3. Database Rollback (Slow)
```bash
# Restore from backup
pg_restore -U user -d weave_nn /backups/backup.dump

# Or use Alembic
alembic downgrade -1
```

---

## 📋 Pre-Migration Checklist

### Before Extracting a Service

- [ ] Service has clear interface boundaries
- [ ] All inter-service communication via RabbitMQ
- [ ] Configuration managed via environment variables
- [ ] Database abstraction (SQLAlchemy ORM)
- [ ] Idempotent message consumers
- [ ] Comprehensive test coverage (>80%)
- [ ] Monitoring and logging in place
- [ ] Rollback plan documented

### Before Kubernetes Migration

- [ ] All services extracted and running independently
- [ ] Database migrated to PostgreSQL
- [ ] RabbitMQ cluster configured (3+ nodes)
- [ ] Secrets management configured (K8s Secrets)
- [ ] Persistent volume claims defined
- [ ] Ingress controller configured
- [ ] TLS certificates obtained (Let's Encrypt)
- [ ] Monitoring stack deployed (Prometheus + Grafana)

---

## 🎯 Service Extraction Priority Order

1. **N8N Workflow Service** (Week 1) - Lowest risk
2. **Git Service** (Week 2) - Simple, no database
3. **Task Service** (Week 3) - Clear boundary
4. **File Service** (Week 4) - Core service
5. **MCP Sync Service** (Week 5) - Performance critical
6. **Agent Tasks Service** (Week 6) - External dependencies

---

## 🔗 Related Documents

- **Full Migration Strategy**: [migration-strategy-local-to-microservices.md](/home/aepod/dev/weave-nn/weave-nn/docs/migration-strategy-local-to-microservices.md)
- **Architecture**: [obsidian-first-architecture.md](/home/aepod/dev/weave-nn/weave-nn/architecture/obsidian-first-architecture.md)
- **Master Plan**: [MASTER-PLAN.md](/home/aepod/dev/weave-nn/weave-nn/_planning/MASTER-PLAN.md)

---

**Last Updated**: 2025-10-23
**Status**: ✅ Complete
