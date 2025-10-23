---
type: technical-primitive
category: service
status: in-use
first_used_phase: "PHASE-0"
mvp_required: true
future_only: false
tags:
  - technical
  - service
  - messaging
  - event-driven
  - scope/mvp
related_architecture:
  - "[[mvp-local-first-architecture]]"
  - "[[event-driven-architecture]]"
related_features:
  - "[[file-watcher]]"
  - "[[git-automation]]"
dependencies:
  - "[[docker]]"
  - "[[pika-rabbitmq-client]]"
---

# RabbitMQ

## Overview

Open source message broker implementing AMQP protocol. Enables event-driven architecture for file watcher → MCP sync → Git commit workflows in Weave-NN.

## Category

**Service / Message Broker**

## Why We Use It

**Primary reasons**:
1. **Event-driven architecture** - Decouples file monitoring, MCP sync, and Git automation
2. **Reliable delivery** - Persistent queues prevent message loss
3. **Topic-based routing** - Smart event distribution (*.file.created, *.git.commit)
4. **Dead letter queues** - Handles failed processing gracefully
5. **Management UI** - Real-time monitoring at http://localhost:15672

**Specific to Weave-NN**:
- File system events → `weave-nn.file.*` topic
- MCP sync operations → `weave-nn.mcp.*` topic
- Git automation → `weave-nn.git.*` topic
- N8N workflow triggers → `weave-nn.workflow.*` topic

## Key Capabilities

### Core Features
- **Topic exchanges** - Wildcard routing (file.*.md, git.commit.*)
- **Persistent queues** - Survive broker restarts
- **Message acknowledgment** - At-least-once delivery guarantee
- **Dead letter exchanges** - Failed message handling
- **Management API** - Monitoring and administration
- **Clustering** - High availability (future)

### Event Flow Architecture

```mermaid
graph LR
    FileWatcher[File Watcher] -->|file.created| Exchange[Topic Exchange]
    Exchange --> MCPQueue[MCP Sync Queue]
    Exchange --> GitQueue[Git Queue]
    Exchange --> N8NQueue[N8N Queue]

    MCPQueue --> MCPConsumer[MCP Consumer]
    GitQueue --> GitConsumer[Git Consumer]
    N8NQueue --> N8NConsumer[N8N Consumer]

    MCPConsumer -->|failed| DLQ[Dead Letter Queue]
    GitConsumer -->|failed| DLQ
```

## Integration Points

**Publishers** (produce events):
- File watcher service (Watchdog)
- MCP server (tool executions)
- Git automation (commit events)
- Manual triggers (API endpoints)

**Consumers** (process events):
- MCP sync service
- Git auto-commit service
- N8N workflow triggers
- Agent task queue

**Integration with**:
- [[watchdog-file-monitoring]] - Publishes file system events
- [[pika-rabbitmq-client]] - Python client library
- [[docker]] - Deployment platform
- [[n8n-workflow-automation]] - Consumes workflow events

## Configuration

### Phase 0: Docker Deployment

```bash
# Deploy RabbitMQ with management UI
docker run -d \
  --name rabbitmq \
  --restart unless-stopped \
  -p 5672:5672 \   # AMQP protocol
  -p 15672:15672 \  # Management UI
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=weave-nn-2025 \
  -v rabbitmq_data:/var/lib/rabbitmq \
  rabbitmq:3-management

# Verify deployment
curl -u admin:weave-nn-2025 http://localhost:15672/api/overview
```

### Phase 5: Exchange and Queue Setup

```python
# weave-nn-mcp/utils/rabbitmq_setup.py
import pika
import os

def setup_rabbitmq():
    """Initialize RabbitMQ exchanges and queues for Weave-NN"""

    # Connect to RabbitMQ
    credentials = pika.PlainCredentials('admin', 'weave-nn-2025')
    connection = pika.BlockingConnection(
        pika.ConnectionParameters('localhost', 5672, '/', credentials)
    )
    channel = connection.channel()

    # Declare topic exchange
    channel.exchange_declare(
        exchange='weave-nn.events',
        exchange_type='topic',
        durable=True
    )

    # Declare dead letter exchange
    channel.exchange_declare(
        exchange='weave-nn.dlx',
        exchange_type='topic',
        durable=True
    )

    # Declare queues with DLX
    queue_config = {
        'arguments': {
            'x-dead-letter-exchange': 'weave-nn.dlx',
            'x-message-ttl': 86400000  # 24 hours
        },
        'durable': True
    }

    queues = [
        ('weave-nn.mcp_sync', 'file.*.md'),
        ('weave-nn.git_commit', 'git.auto_commit'),
        ('weave-nn.n8n_workflow', 'workflow.*'),
        ('weave-nn.agent_tasks', 'agent.*'),
    ]

    for queue_name, routing_key in queues:
        channel.queue_declare(queue=queue_name, **queue_config)
        channel.queue_bind(
            exchange='weave-nn.events',
            queue=queue_name,
            routing_key=routing_key
        )

    # Dead letter queue (no bindings needed)
    channel.queue_declare(queue='weave-nn.dlq', durable=True)

    connection.close()
    print("✅ RabbitMQ setup complete")

if __name__ == "__main__":
    setup_rabbitmq()
```

### Publisher Example

```python
# weave-nn-mcp/publishers/file_events.py
import pika
import json
from datetime import datetime

class FileEventPublisher:
    def __init__(self):
        credentials = pika.PlainCredentials('admin', 'weave-nn-2025')
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters('localhost', 5672, '/', credentials)
        )
        self.channel = self.connection.channel()

    def publish_file_created(self, file_path: str, content: str):
        """Publish file creation event"""

        message = {
            'event': 'file.created',
            'timestamp': datetime.utcnow().isoformat(),
            'file_path': file_path,
            'content': content,
            'metadata': {
                'size': len(content),
                'extension': file_path.split('.')[-1]
            }
        }

        self.channel.basic_publish(
            exchange='weave-nn.events',
            routing_key='file.created.md',
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Persistent
                content_type='application/json'
            )
        )
        print(f"📤 Published: file.created.md → {file_path}")

    def close(self):
        self.connection.close()
```

### Consumer Example

```python
# weave-nn-mcp/consumers/mcp_sync.py
import pika
import json

def callback(ch, method, properties, body):
    """Process MCP sync events"""
    message = json.loads(body)
    file_path = message['file_path']

    try:
        # Sync to shadow cache
        sync_to_cache(file_path, message['content'])

        # ACK message (remove from queue)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        print(f"✅ Synced: {file_path}")

    except Exception as e:
        # NACK message (send to DLQ)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        print(f"❌ Failed: {file_path} - {e}")

def start_consumer():
    """Start MCP sync consumer"""
    credentials = pika.PlainCredentials('admin', 'weave-nn-2025')
    connection = pika.BlockingConnection(
        pika.ConnectionParameters('localhost', 5672, '/', credentials)
    )
    channel = connection.channel()

    channel.basic_qos(prefetch_count=10)  # Process 10 at a time
    channel.basic_consume(
        queue='weave-nn.mcp_sync',
        on_message_callback=callback
    )

    print("🔄 MCP sync consumer started. Waiting for messages...")
    channel.start_consuming()

if __name__ == "__main__":
    start_consumer()
```

### Environment Configuration

```bash
# weave-nn-mcp/.env
RABBITMQ_URL=amqp://admin:weave-nn-2025@localhost:5672
RABBITMQ_EXCHANGE=weave-nn.events
RABBITMQ_DLX=weave-nn.dlx
RABBITMQ_MANAGEMENT_URL=http://localhost:15672
```

## Alternatives Considered

### Redis Pub/Sub
- **Pro**: Simpler, faster for high throughput
- **Con**: No message persistence, no routing patterns, no acknowledgments
- **Verdict**: Rejected - Need reliable delivery and complex routing

### Apache Kafka
- **Pro**: Better for high-volume streaming, log-based storage
- **Con**: Overkill for MVP, complex setup, heavier resource usage
- **Verdict**: Rejected - Too complex for <1000 msg/day workload

### NATS
- **Pro**: Extremely fast, lightweight
- **Con**: Less mature Python client, fewer management tools
- **Verdict**: Rejected - RabbitMQ ecosystem more mature

### Direct Database Polling
- **Pro**: No additional service needed
- **Con**: High latency, CPU waste, no event semantics
- **Verdict**: Rejected - Event-driven architecture superior

## Decision Reference

**[[mvp-local-first-architecture]]** - Deployment Architecture
> "RabbitMQ single instance (Docker container) for event-driven workflows"

**[[phase-0-pre-development-work]]** - Prerequisites
> "Deploy RabbitMQ with 5 queues: mcp_sync, git_auto_commit, n8n_workflows, agent_tasks, dlq"

**Rationale**: RabbitMQ provides reliable event-driven architecture without the complexity of Kafka or fragility of Redis Pub/Sub. Topic exchanges enable smart routing, and dead letter queues handle failures gracefully.

## Learning Resources

### Official Documentation
- RabbitMQ Docs: https://www.rabbitmq.com/documentation.html
- AMQP Tutorial: https://www.rabbitmq.com/getstarted.html
- Topic Exchange: https://www.rabbitmq.com/tutorials/tutorial-five-python.html
- Management API: https://www.rabbitmq.com/management.html

### Python Client (Pika)
- Pika Documentation: https://pika.readthedocs.io/
- Async Consumer: https://pika.readthedocs.io/en/stable/examples/asynchronous_consumer_example.html
- Connection Pooling: https://pika.readthedocs.io/en/stable/examples/blocking_consumer.html

### Production Best Practices
- High Availability: https://www.rabbitmq.com/ha.html
- Monitoring: https://www.rabbitmq.com/monitoring.html
- Performance Tuning: https://www.rabbitmq.com/performance.html

## Phase Usage

### Phase 0: Pre-Development Work
- Deploy RabbitMQ Docker container
- Verify management UI accessible
- Create admin credentials

### Phase 5: Claude-Flow MCP Integration
- **Day 1**: Exchange and queue setup
- **Day 3**: File event publishers
- **Day 4**: MCP sync consumers
- **Day 5**: Git automation consumers

### Phase 6: MVP Week 1 - Backend Infrastructure
- N8N workflow consumers
- Agent task queue
- Dead letter queue monitoring
- Performance testing

### Phase 7: MVP Week 2 - Automation & Deployment
- Production configuration (persistent volumes)
- Monitoring dashboards
- Alerting for queue buildup
- Backup and recovery procedures

## Queue Configuration (MVP)

| Queue Name | Routing Key | Purpose | Consumer |
|------------|-------------|---------|----------|
| `weave-nn.mcp_sync` | `file.*.md` | Sync files to shadow cache | MCP Sync Service |
| `weave-nn.git_commit` | `git.auto_commit` | Auto-commit workflow | Git Consumer |
| `weave-nn.n8n_workflow` | `workflow.*` | N8N triggers | N8N Consumer |
| `weave-nn.agent_tasks` | `agent.*` | Claude-Flow tasks | Agent Task Runner |
| `weave-nn.dlq` | `*` | Failed messages | Manual review |

## Performance Characteristics

- **Throughput**: 50,000+ msg/sec (single broker)
- **Latency**: <10ms p99 for local deployment
- **Persistence**: All messages survive broker restart
- **Memory**: ~100MB base + ~1KB per queued message

**For Weave-NN MVP**:
- Expected load: <1000 msg/day (file edits)
- Performance is NOT a bottleneck
- Focus: Reliability and observability

## Monitoring

### Management UI Metrics
- Queue depth (should be <100 normally)
- Message rate (in/out/ack/nack)
- Consumer count (should match expected)
- Dead letter queue depth (alert if >0)

### Health Check

```bash
# Check broker status
curl -u admin:weave-nn-2025 http://localhost:15672/api/healthchecks/node

# Check queue depth
curl -u admin:weave-nn-2025 http://localhost:15672/api/queues/%2F/weave-nn.mcp_sync | jq '.messages'
```

## Migration Path

**Current (MVP)**: Single RabbitMQ instance in Docker
**Future (v1.0)**: RabbitMQ cluster (3 nodes) for high availability
**Future (v2.0)**: Consider Kafka if event volume exceeds 100k/day

## Notes

- **Management UI is critical** - Use it for debugging and monitoring
- **Dead letter queue must be monitored** - Set up alerts for failures
- **Topic routing is powerful** - Use `file.*.md` vs `file.#` wisely
- **Persistent messages are slower** - But reliability is worth it for Weave-NN
- **Prefetch count matters** - Set based on processing time (default: 10)
