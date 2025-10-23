# RabbitMQ & Docker - Archived

**Status**: Deferred to post-MVP
**Date Archived**: 2025-10-23
**Reason**: Weaver's durable workflows eliminate need for message queue

---

## Why Deferred

RabbitMQ was planned as the event bus between services. Analysis revealed Weaver (workflow.dev) provides equivalent or better capabilities:

| Feature | RabbitMQ | Weaver | Winner |
|---------|----------|--------|--------|
| **Async Execution** | ✅ Pub/Sub | ✅ Durable workflows | Weaver (simpler) |
| **Message Persistence** | ✅ Durable queues | ✅ Workflow state | Weaver (better observability) |
| **Retry Logic** | ⚠️ Manual setup | ✅ Automatic exponential backoff | Weaver |
| **Observability** | ⚠️ Manual setup | ✅ Automatic traces + time-travel | Weaver |
| **Infrastructure** | ❌ Docker container | ✅ Node.js process | Weaver |

See: [[docs/rabbitmq-deferral-summary|RabbitMQ Deferral Summary]]

## Archived Files

- `rabbitmq.md` - Message broker
- `docker-compose.md` - Container orchestration for RabbitMQ
- `docker.md` - Container runtime

## When to Add Back

RabbitMQ may be valuable post-MVP for:
- **Multi-service architecture** - If we add more services that need decoupling
- **High-throughput** - If event processing exceeds 1,000 events/sec
- **Distributed deployments** - If running multiple Weaver instances
- **External integrations** - If third-party systems need event notifications

**Trigger Criteria**:
- More than 3 services need inter-service communication
- Event processing latency > 100ms due to volume
- Need for at-least-once delivery guarantees across services

## MVP Alternative

For MVP, use Weaver's architecture:
- File changes → chokidar detects → triggers workflow directly (in-process, <5ms)
- Workflows → durable execution with automatic retries
- State → persisted automatically by workflow.dev
- No message queue, no Docker, no separate infrastructure

---

**Related Documentation**:
- [[docs/rabbitmq-deferral-summary|RabbitMQ Deferral Summary (Full Analysis)]]
- [[decisions/technical/adopt-weaver-workflow-proxy|D-020: Adopt Weaver (includes RabbitMQ addendum)]]
