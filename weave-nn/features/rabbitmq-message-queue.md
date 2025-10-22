---
# Node Metadata
feature_id: "F-015"
feature_name: "RabbitMQ Message Queue"
category: "infrastructure"
status: "planned"
priority: "critical"
release: "mvp"
complexity: "moderate"
created_date: "2025-10-21"
updated_date: "2025-10-21"

# Scope
scope:
  current_phase: "mvp"
  obsidian_only: false
  web_version_needed: false
  infrastructure: true

# Dependencies
dependencies:
  requires: []
  enables: ["n8n-workflow-automation", "cross-project-knowledge-retention"]
  related_features: ["n8n-workflow-automation", "git-integration"]

# Relationships
relationships:
  related_decisions:
    - "IR-3"
  related_architecture:
    - "obsidian-first-architecture"
    - "ai-integration-layer"

# Visual
visual:
  icon: "message-square"
  cssclasses:
    - type-feature
    - scope-mvp
    - priority-critical
    - tech-rabbitmq

# Tags
tags:
  - scope/mvp
  - type/feature
  - status/planned
  - priority/critical
  - tech/rabbitmq
  - tech/python
  - category/infrastructure
  - category/async
---

# RabbitMQ Message Queue

**Purpose**: Implement RabbitMQ message queue as the async event bus for Weave-NN, enabling decoupled, event-driven communication between components (file watcher, MCP server, N8N workflows, agents).

**Decision**: [[../archive/DECISIONS#IR-3-Other-Integrations|IR-3: Other Integrations]] - Message queue for async foundation

**Architecture**: RabbitMQ (AMQP) + Python pika library for pub/sub messaging

---

## 🎯 User Story

As a **Weave-NN system architect**, I want to **decouple components via async messaging** so that **file changes, agent actions, and workflow triggers can happen independently without blocking operations**.

---

## 🚀 Key Capabilities

### Event-Driven Architecture
- ✅ **Publish/Subscribe** - Multiple consumers per event type
- ✅ **Topic-based routing** - Filter events by pattern (e.g., `file.*.created`)
- ✅ **Guaranteed delivery** - Messages persist until acknowledged
- ✅ **Dead letter queue** - Handle failed message processing

### Core Event Types

**Vault Events**:
- `vault.file.created` - New file created in vault
- `vault.file.updated` - File modified (content or frontmatter)
- `vault.file.deleted` - File removed
- `vault.file.moved` - File renamed or relocated

**Task Events**:
- `task.created` - New task added
- `task.completed` - Task marked as done
- `task.updated` - Task metadata changed (due date, priority)
- `task.overdue` - Task past due date (scheduled check)

**Agent Events**:
- `agent.started` - Claude-Flow agent begins operation
- `agent.completed` - Agent finishes successfully
- `agent.error` - Agent encounters error
- `agent.suggestion` - Agent has suggestion for user

**Git Events**:
- `git.commit` - New commit created
- `git.push` - Commits pushed to remote
- `git.pull` - Changes pulled from remote
- `git.conflict` - Merge conflict detected

**Project Events**:
- `project.created` - New client project initialized
- `project.closed` - Project marked as complete
- `project.archived` - Project moved to archive

### Message Structure

```json
{
  "event_type": "vault.file.created",
  "timestamp": "2025-10-21T14:30:00Z",
  "source": "file_watcher",
  "data": {
    "file_path": "concepts/temporal-queries.md",
    "file_type": "concept",
    "vault_id": "weave-nn",
    "frontmatter": {
      "concept_id": "C-012",
      "status": "active",
      "tags": ["concept", "temporal", "graph"]
    }
  },
  "metadata": {
    "message_id": "msg-abc123",
    "correlation_id": "corr-xyz789",
    "retry_count": 0
  }
}
```

---

## 🏗️ Architecture

### Message Flow Diagram

The RabbitMQ message queue is the central bus for all asynchronous communication in Weave-NN. All services, including APIs, N8N workflows, and AI agents, publish events to a topic exchange. Consumers subscribe to specific topics to perform their tasks, ensuring a fully decoupled architecture. This allows for high throughput, scalability, and the ability to insert services like AI-powered security and validation layers that inspect messages before they are processed.

The definitive diagram and explanation of this architecture are maintained in the [[../architecture/api-layer#Message Queue Integration|API & Backend Layer]] documentation to ensure a single source of truth.

### Exchange & Queue Design

**Exchange**: `weave-nn.events` (type: topic)
- Supports wildcard routing (e.g., `vault.file.*`)
- Persistent (survives RabbitMQ restart)
- Durable queues (messages survive restart)

**Queues**:
1. **n8n_workflows** - Binds to: `vault.*.*`, `task.*`, `project.*`
2. **mcp_sync** - Binds to: `vault.file.*`
3. **git_auto_commit** - Binds to: `vault.file.updated`
4. **agent_tasks** - Binds to: `task.created`, `task.updated`
5. **dlq** (Dead Letter Queue) - Failed messages

---

## 📋 MVP Implementation (Week 1)

### Day 1: RabbitMQ Setup

**Install RabbitMQ (Docker on GCP VM)**:
```bash
# Run RabbitMQ with management UI
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=<secure-password> \
  rabbitmq:3-management

# Access management UI: http://<vm-ip>:15672
```

**Create Exchange and Queues**:
```bash
# Using rabbitmqadmin CLI
rabbitmqadmin declare exchange name=weave-nn.events type=topic durable=true

# Create queues
rabbitmqadmin declare queue name=n8n_workflows durable=true
rabbitmqadmin declare queue name=mcp_sync durable=true
rabbitmqadmin declare queue name=git_auto_commit durable=true
rabbitmqadmin declare queue name=agent_tasks durable=true
rabbitmqadmin declare queue name=dlq durable=true

# Bind queues to exchange
rabbitmqadmin declare binding source=weave-nn.events destination=n8n_workflows routing_key="vault.*.*"
rabbitmqadmin declare binding source=weave-nn.events destination=mcp_sync routing_key="vault.file.*"
rabbitmqadmin declare binding source=weave-nn.events destination=git_auto_commit routing_key="vault.file.updated"
rabbitmqadmin declare binding source=weave-nn.events destination=agent_tasks routing_key="task.*"
```

### Day 2: Python Publisher (File Watcher)

**File**: `weave-nn-mcp/publishers/file_watcher.py`

```python
import pika
import json
import yaml
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class VaultEventPublisher:
    def __init__(self, rabbitmq_url="amqp://admin:password@localhost:5672"):
        self.connection = pika.BlockingConnection(pika.URLParameters(rabbitmq_url))
        self.channel = self.connection.channel()
        self.exchange = "weave-nn.events"

    def publish(self, event_type: str, data: dict):
        """Publish event to RabbitMQ"""
        message = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "source": "file_watcher",
            "data": data,
            "metadata": {
                "message_id": str(uuid.uuid4()),
                "retry_count": 0
            }
        }

        self.channel.basic_publish(
            exchange=self.exchange,
            routing_key=event_type,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Persistent
                content_type="application/json"
            )
        )

        print(f"Published: {event_type} - {data.get('file_path')}")

class VaultFileHandler(FileSystemEventHandler):
    def __init__(self, publisher: VaultEventPublisher, vault_path: str):
        self.publisher = publisher
        self.vault_path = vault_path

    def on_created(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return

        file_path = os.path.relpath(event.src_path, self.vault_path)
        frontmatter = self.parse_frontmatter(event.src_path)

        self.publisher.publish("vault.file.created", {
            "file_path": file_path,
            "file_type": frontmatter.get("type"),
            "vault_id": "weave-nn",
            "frontmatter": frontmatter
        })

    def on_modified(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return

        file_path = os.path.relpath(event.src_path, self.vault_path)
        frontmatter = self.parse_frontmatter(event.src_path)

        self.publisher.publish("vault.file.updated", {
            "file_path": file_path,
            "file_type": frontmatter.get("type"),
            "vault_id": "weave-nn",
            "frontmatter": frontmatter
        })

    def on_deleted(self, event):
        if event.is_directory or not event.src_path.endswith('.md'):
            return

        file_path = os.path.relpath(event.src_path, self.vault_path)

        self.publisher.publish("vault.file.deleted", {
            "file_path": file_path,
            "vault_id": "weave-nn"
        })

    def parse_frontmatter(self, file_path: str) -> dict:
        """Parse YAML frontmatter from markdown file"""
        with open(file_path, 'r') as f:
            content = f.read()
            if content.startswith('---'):
                parts = content.split('---', 2)
                if len(parts) >= 2:
                    return yaml.safe_load(parts[1])
        return {}

# Start file watcher
if __name__ == "__main__":
    publisher = VaultEventPublisher()
    handler = VaultFileHandler(publisher, "/path/to/vault")

    observer = Observer()
    observer.schedule(handler, "/path/to/vault", recursive=True)
    observer.start()

    print("File watcher started. Publishing to RabbitMQ...")

    try:
        observer.join()
    except KeyboardInterrupt:
        observer.stop()
        publisher.connection.close()
```

### Day 3: Python Consumer (MCP Sync)

**File**: `weave-nn-mcp/consumers/mcp_sync.py`

```python
import pika
import json

class MCPSyncConsumer:
    def __init__(self, rabbitmq_url="amqp://admin:password@localhost:5672"):
        self.connection = pika.BlockingConnection(pika.URLParameters(rabbitmq_url))
        self.channel = self.connection.channel()
        self.queue = "mcp_sync"

    def callback(self, ch, method, properties, body):
        """Process vault file events"""
        try:
            message = json.loads(body)
            event_type = message["event_type"]
            data = message["data"]

            print(f"Received: {event_type} - {data.get('file_path')}")

            if event_type == "vault.file.created":
                self.handle_file_created(data)
            elif event_type == "vault.file.updated":
                self.handle_file_updated(data)
            elif event_type == "vault.file.deleted":
                self.handle_file_deleted(data)

            # Acknowledge message
            ch.basic_ack(delivery_tag=method.delivery_tag)

        except Exception as e:
            print(f"Error processing message: {e}")
            # Reject and requeue (or send to DLQ)
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def handle_file_created(self, data):
        """Update shadow cache and sync to Claude-Flow memory"""
        file_path = data["file_path"]
        frontmatter = data["frontmatter"]

        # 1. Update shadow cache
        self.update_cache(file_path, frontmatter)

        # 2. Sync to Claude-Flow memory
        self.sync_to_claude_flow(file_path, frontmatter)

    def handle_file_updated(self, data):
        """Same as created, but update existing entries"""
        self.handle_file_created(data)

    def handle_file_deleted(self, data):
        """Remove from cache and mark deleted in Claude-Flow"""
        file_path = data["file_path"]

        # 1. Remove from cache
        self.remove_from_cache(file_path)

        # 2. Mark deleted in Claude-Flow
        self.mark_deleted_in_claude_flow(file_path)

    def start(self):
        """Start consuming messages"""
        self.channel.basic_consume(
            queue=self.queue,
            on_message_callback=self.callback,
            auto_ack=False  # Manual acknowledgment
        )

        print(f"MCP Sync consumer started. Listening on queue: {self.queue}")
        self.channel.start_consuming()

if __name__ == "__main__":
    consumer = MCPSyncConsumer()
    consumer.start()
```

### Day 4: N8N Integration

**N8N RabbitMQ Node Configuration**:
```json
{
  "name": "RabbitMQ Trigger",
  "type": "n8n-nodes-base.rabbitmq",
  "parameters": {
    "queue": "n8n_workflows",
    "options": {
      "acknowledge": "true",
      "jsonParseBody": "true"
    }
  }
}
```

**Example Workflow**: File Created → Extract Keywords → Create Tags
```json
{
  "nodes": [
    {
      "name": "RabbitMQ: Vault File Created",
      "type": "n8n-nodes-base.rabbitmq",
      "parameters": {
        "queue": "n8n_workflows",
        "options": {"acknowledge": "true"}
      }
    },
    {
      "name": "Filter: Only Concept Nodes",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {"value1": "={{$json.data.file_type}}", "value2": "concept"}
          ]
        }
      }
    },
    {
      "name": "Claude: Extract Keywords",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.anthropic.com/v1/messages",
        "method": "POST",
        "body": {
          "model": "claude-3-5-sonnet-20241022",
          "messages": [{
            "role": "user",
            "content": "Extract 5 keywords from: {{$json.data.frontmatter.content}}"
          }]
        }
      }
    }
  ]
}
```

---

## 🔧 Advanced Features

### Dead Letter Queue (DLQ)

**Purpose**: Handle messages that fail processing repeatedly

**Configuration**:
```python
# Declare queue with DLQ
channel.queue_declare(
    queue='mcp_sync',
    durable=True,
    arguments={
        'x-dead-letter-exchange': 'weave-nn.dlx',
        'x-dead-letter-routing-key': 'failed',
        'x-message-ttl': 60000,  # 1 minute TTL
        'x-max-retries': 3
    }
)
```

**DLQ Consumer**:
```python
def dlq_callback(ch, method, properties, body):
    """Log failed messages for manual review"""
    message = json.loads(body)
    print(f"FAILED MESSAGE: {message}")

    # Log to file
    with open("failed_messages.log", "a") as f:
        f.write(f"{json.dumps(message)}\n")

    # Alert admin (Slack, email, etc.)
    send_alert(f"Message failed after 3 retries: {message['event_type']}")

    ch.basic_ack(delivery_tag=method.delivery_tag)
```

### Message Correlation

**Purpose**: Track related messages across multiple services

**Implementation**:
```python
# Publisher adds correlation ID
correlation_id = str(uuid.uuid4())

publisher.publish("vault.file.created", data, metadata={
    "correlation_id": correlation_id
})

# Consumer passes correlation ID to next step
self.git_publisher.publish("git.commit", commit_data, metadata={
    "correlation_id": message["metadata"]["correlation_id"]
})

# Trace entire flow
logs.query(correlation_id="corr-xyz789")
# Returns: file.created → mcp.sync → git.commit → n8n.workflow
```

### Priority Queues

**Purpose**: Process critical events first (e.g., user-triggered actions)

**Configuration**:
```python
# Declare priority queue
channel.queue_declare(
    queue='high_priority_tasks',
    durable=True,
    arguments={'x-max-priority': 10}
)

# Publish with priority
channel.basic_publish(
    exchange='weave-nn.events',
    routing_key='task.created',
    body=json.dumps(message),
    properties=pika.BasicProperties(priority=9)  # High priority
)
```

---

## 💰 Cost Analysis

### Self-Hosted (GCP VM)
- **RabbitMQ Docker**: Free (runs on existing VM)
- **Storage**: Negligible (messages are ephemeral)
- **Bandwidth**: Negligible (local network)
- **Total**: $0/month (included in VM cost)

### Managed RabbitMQ (CloudAMQP)
- **Lemur Plan**: $19/month
  - 1 million messages/month
  - 1 GB RAM
  - High availability
- **Total**: $19/month

**Recommendation**: Self-hosted for MVP (free), CloudAMQP for production scaling

---

## 🎯 Success Criteria (MVP)

### Must Have (Week 1, Day 1-4)
- ✅ RabbitMQ installed and accessible
- ✅ Exchange and queues created
- ✅ File watcher publishes vault events
- ✅ MCP sync consumer processes events
- ✅ N8N subscribes to events successfully
- ✅ Git auto-commit triggered by file updates

### Nice to Have (v1.1)
- ⚡ Dead letter queue with alerting
- ⚡ Message correlation tracking
- ⚡ Priority queues for critical events
- ⚡ RabbitMQ monitoring dashboard

### Deferred to v2.0+
- 🔮 RabbitMQ clustering (high availability)
- 🔮 Message encryption (TLS)
- 🔮 CloudAMQP migration (managed service)

---

## 🔗 Related Features

### Enables
- [[n8n-workflow-automation|N8N Workflow Automation]] - Event-driven workflows
- [[cross-project-knowledge-retention|Cross-Project Knowledge]] - Project event triggers
- [[git-integration|Git Integration]] - Auto-commit on file changes

### Integrates With
- [[obsidian-first-architecture|Obsidian-First Architecture]] - File change events
- [[basic-ai-integration-mcp|MCP Integration]] - Sync events

---

## 🔗 Related Documentation

### Architecture
- [[../architecture/obsidian-first-architecture|Obsidian-First Architecture]]
- [[../architecture/ai-integration-layer|AI Integration Layer]]

### External Resources
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [RabbitMQ Docker Image](https://hub.docker.com/_/rabbitmq)
- [Pika (Python Client)](https://pika.readthedocs.io/)
- [N8N RabbitMQ Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.rabbitmq/)

---

**Status**: Planned for MVP (Week 1, Day 1-4)
**Complexity**: Moderate (8 hours setup + integration)
**Priority**: Critical (foundation for async architecture)
**Next Steps**: Install RabbitMQ, implement file watcher publisher, test N8N consumer
