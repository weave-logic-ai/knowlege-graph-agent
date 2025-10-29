---
title: '[Service Name]'
type: architecture
status: in-progress
phase_id: PHASE-12
tags:
  - phase/phase-12
  - type/architecture
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4DA"
  color: '#50E3C2'
  cssclasses:
    - architecture-document
updated: '2025-10-29T04:55:05.716Z'
keywords:
  - overview
  - key responsibilities
  - non-responsibilities
  - architecture
  - service type
  - event-driven integration
  - dependencies
  - api endpoints (if applicable)
  - local development
  - prerequisites
---
# [Service Name]

**Purpose**: [Brief one-line description of what this service does]
**Tech Stack**: Python 3.11, FastAPI, RabbitMQ, PostgreSQL, etc.
**Owner**: [Team Name / Maintainer Email]
**Status**: [Development / Staging / Production]

---

## Overview

[2-3 paragraph description of the service's responsibilities and how it fits into the overall Weave-NN architecture. Explain the business problem it solves and key workflows it supports.]

### Key Responsibilities
- Responsibility 1
- Responsibility 2
- Responsibility 3

### Non-Responsibilities
- What this service explicitly does NOT do
- Helps clarify boundaries with other services

---

## Architecture

### Service Type
- [ ] API Service (REST/GraphQL endpoints)
- [ ] Consumer Service (RabbitMQ message consumer)
- [ ] Publisher Service (RabbitMQ message publisher)
- [ ] Hybrid (API + Consumer + Publisher)
- [ ] Background Worker (Scheduled tasks)

### Event-Driven Integration

#### **Consumes From (RabbitMQ Queues)**
| Queue Name | Exchange | Routing Key | Event Type | Description |
|------------|----------|-------------|------------|-------------|
| `service-name.event-type` | `weave-nn.events` | `domain.action.event` | File Created | Triggers when... |

#### **Publishes To (RabbitMQ Exchanges)**
| Event Type | Exchange | Routing Key | Payload Schema | Description |
|------------|----------|-------------|----------------|-------------|
| Task Complete | `weave-nn.events` | `task.workflow.complete` | `TaskCompleteSchema` | Published when... |

#### **Message Schemas**
```python
# Example: Task Complete Message
{
  "event_type": "task.workflow.complete",
  "task_id": "task-123",
  "workflow_id": "workflow-456",
  "status": "success",
  "timestamp": "2025-10-23T10:00:00Z",
  "metadata": {
    "execution_time_ms": 1234,
    "result": "..."
  }
}
```

### Dependencies

#### **External Services**
| Service | Purpose | Required | Connection |
|---------|---------|----------|------------|
| PostgreSQL | Data persistence | Yes | `WEAVE_DB_URL` |
| RabbitMQ | Message queue | Yes | `WEAVE_RABBITMQ_URL` |
| N8N | Task orchestration | No | `WEAVE_N8N_URL` |

#### **Internal Services**
| Service | Purpose | Communication Method |
|---------|---------|---------------------|
| API Gateway | User requests | REST API |
| Rule Engine | Event processing | RabbitMQ |

### API Endpoints (if applicable)

#### **REST API**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/resource` | List resources | Yes |
| POST | `/api/v1/resource` | Create resource | Yes |
| GET | `/api/v1/resource/{id}` | Get resource by ID | Yes |
| PUT | `/api/v1/resource/{id}` | Update resource | Yes |
| DELETE | `/api/v1/resource/{id}` | Delete resource | Yes |

#### **Health & Monitoring**
- **Health Check**: `GET /health`
- **Readiness Check**: `GET /ready`
- **Metrics**: `GET /metrics` (Prometheus format)

---

## Local Development

### Prerequisites
- Python 3.11+
- Docker and Docker Compose
- RabbitMQ (running via Docker Compose)
- PostgreSQL (running via Docker Compose)
- [Any other dependencies]

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/weave-nn.git
   cd weave-nn/services/[service-name]
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. **Start dependencies** (from root directory):
   ```bash
   docker-compose -f docker-compose.dev.yml up -d rabbitmq postgres
   ```

6. **Run database migrations**:
   ```bash
   # If applicable
   alembic upgrade head
   ```

### Running the Service

#### **Development Mode** (with auto-reload):
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

#### **Production Mode**:
```bash
python src/main.py
```

#### **Using Docker**:
```bash
docker build -t weave-nn/[service-name]:dev .
docker run -p 8000:8000 --env-file .env weave-nn/[service-name]:dev
```

### Running Tests

#### **Unit Tests**:
```bash
pytest tests/
```

#### **With Coverage**:
```bash
pytest --cov=src --cov-report=html tests/
```

#### **Integration Tests**:
```bash
pytest tests/integration/ --integration
```

#### **Linting and Formatting**:
```bash
# Linting
flake8 src/ tests/
pylint src/ tests/

# Formatting
black src/ tests/
isort src/ tests/
```

---

## Configuration

### Environment Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `WEAVE_SERVICE_PORT` | Service port | No | 8000 | 8000 |
| `WEAVE_RABBITMQ_URL` | RabbitMQ connection URL | Yes | - | `amqp://guest:guest@localhost:5672/` |
| `WEAVE_DB_URL` | PostgreSQL connection URL | Yes | - | `postgresql://user:pass@localhost:5432/weave_nn` |
| `WEAVE_LOG_LEVEL` | Logging level | No | INFO | DEBUG, INFO, WARNING, ERROR |
| `WEAVE_FEATURE_X` | Feature flag | No | false | true/false |

### Configuration Files

- **`config.py`**: Service configuration loaded from environment variables
- **`rules/*.yaml`**: Rule definitions (if applicable)
- **`alembic.ini`**: Database migration configuration (if applicable)

---

## Deployment

### Docker Image

#### **Building**:
```bash
docker build -t weave-nn/[service-name]:v1.0.0 .
```

#### **Pushing to Registry**:
```bash
docker push weave-nn/[service-name]:v1.0.0
```

### Kubernetes Deployment

#### **Deployment Manifest**:
See [`/infrastructure/kubernetes/services/[service-name]/deployment.yaml`](/infrastructure/kubernetes/services/[service-name]/deployment.yaml)

#### **Deploying to Dev**:
```bash
kubectl apply -k infrastructure/kubernetes/overlays/dev/
```

#### **Deploying to Production**:
```bash
kubectl apply -k infrastructure/kubernetes/overlays/production/
```

### Horizontal Scaling

The service supports horizontal scaling via Kubernetes Horizontal Pod Autoscaler (HPA):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Monitoring and Observability

### Metrics

**Prometheus Metrics Exposed**:
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - HTTP request latency
- `rabbitmq_messages_consumed_total` - Total messages consumed
- `rabbitmq_message_processing_duration_seconds` - Message processing latency
- [Service-specific metrics]

### Logging

**Structured JSON Logs**:
```json
{
  "timestamp": "2025-10-23T10:00:00Z",
  "level": "INFO",
  "service": "[service-name]",
  "message": "Event processed successfully",
  "context": {
    "event_id": "event-123",
    "processing_time_ms": 45
  }
}
```

**Log Aggregation**: Logs are aggregated via [ELK Stack / Loki / Cloud Logging]

### Alerts

**Critical Alerts**:
- Service down (no health check response)
- High error rate (> 5% of requests)
- Queue backlog (> 1000 messages)
- High latency (p95 > 1 second)

**Alert Configuration**: See [`/infrastructure/monitoring/alerts/[service-name]-alerts.yaml`](/infrastructure/monitoring/alerts/)

### Dashboards

**Grafana Dashboard**: [Link to dashboard or dashboard JSON]
- Request rate and latency
- Error rates
- RabbitMQ queue depth and processing rate
- Resource utilization (CPU, memory)

---

## Troubleshooting

### Common Issues

#### **Issue: Service won't start**
**Symptoms**: Service exits immediately or crashes on startup
**Causes**:
- Missing environment variables
- Database connection failure
- RabbitMQ connection failure

**Solution**:
1. Check logs: `docker logs [container-id]`
2. Verify environment variables: `env | grep WEAVE`
3. Test database connection: `psql $WEAVE_DB_URL`
4. Test RabbitMQ connection: Check RabbitMQ management UI

#### **Issue: Messages not being consumed**
**Symptoms**: RabbitMQ queue depth keeps growing
**Causes**:
- Consumer not connected to queue
- Consumer crashed
- Message processing errors

**Solution**:
1. Check consumer logs for errors
2. Verify queue bindings in RabbitMQ management UI
3. Check if consumer is acknowledging messages
4. Look for poison messages in dead-letter queue

#### **Issue: High latency**
**Symptoms**: Slow API responses or message processing
**Causes**:
- Database query performance
- Network latency
- Resource constraints (CPU/memory)

**Solution**:
1. Check database query performance: `EXPLAIN ANALYZE`
2. Review Prometheus metrics for bottlenecks
3. Scale service horizontally (add more pods)
4. Optimize slow queries or add caching

### Debug Mode

Enable debug logging:
```bash
export WEAVE_LOG_LEVEL=DEBUG
python src/main.py
```

### Interactive Debugging

Run with debugger:
```bash
python -m pdb src/main.py
```

---

## Testing Strategy

### Unit Tests
- **Location**: `tests/`
- **Coverage Target**: 80%+
- **Mocking**: Use `unittest.mock` or `pytest-mock` for external dependencies

### Integration Tests
- **Location**: `tests/integration/`
- **Dependencies**: Uses testcontainers for RabbitMQ, PostgreSQL
- **Purpose**: Test interactions with external services

### End-to-End Tests
- **Location**: `/tests/e2e/` (root level)
- **Purpose**: Test complete workflows across multiple services

### Performance Tests
- **Tool**: Locust or k6
- **Benchmarks**:
  - API throughput: > 1000 req/sec
  - Message processing: > 100 msg/sec
  - p95 latency: < 100ms

---

## Related Services

### Upstream Services (Services that call this service)
- [API Gateway](/services/api-gateway) - Routes user requests
- [AI Agent Orchestrator](/services/ai-agent-orchestrator) - Triggers workflows

### Downstream Services (Services this service calls)
- [Rule Engine](/services/rule-engine) - Processes automation rules
- [Notification Service](/services/notification-service) - Sends user notifications

### Peer Services (Services at the same level)
- [Knowledge Extractor](/services/knowledge-extractor) - Parallel workflow service
- [Project Seeder](/services/project-seeder) - Parallel workflow service

---

## Contributing

### Development Workflow
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and write tests
3. Run tests: `pytest tests/`
4. Run linters: `flake8 src/` and `black src/`
5. Commit your changes: `git commit -m "feat(service): add feature"`
6. Push to branch: `git push origin feature/your-feature-name`
7. Create a pull request

### Code Review Checklist
- [ ] All tests pass
- [ ] Code coverage > 80%
- [ ] Linting passes (flake8, pylint, black)
- [ ] Documentation updated (README, API docs)
- [ ] Environment variables documented
- [ ] Migration scripts included (if applicable)

---

## References

### Documentation
- [Architecture Overview](/docs/architecture/overview.md)
- [Event-Driven Design](/docs/architecture/event-driven-design.md)
- [API Documentation](/docs/api/api-gateway.md)

### External Resources
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-10-23 | [Author] | Initial service implementation |
| 1.1.0 | TBD | [Author] | Added feature X |

---

## Support

### Contact
- **Team**: [Team Name]
- **Email**: [team-email@example.com]
- **Slack**: [#weave-nn-backend]
- **On-Call**: [PagerDuty rotation link]

### Issue Tracking
- **GitHub Issues**: [Link to issues]
- **JIRA Board**: [Link to JIRA board]

---

**Created**: 2025-10-23
**Last Updated**: 2025-10-23
**Maintained By**: [Team Name]

## Related Documents

### Related Files
- [[DOCS-HUB.md]] - Parent hub
- [[phase-12-mcp-tools-audit.md]] - Same directory
- [[phase-12-pillar-mapping.md]] - Same directory
- [[phase-12-weaver-inventory.md]] - Same directory
- [[weaver-cli-integration-audit.md]] - Same directory

