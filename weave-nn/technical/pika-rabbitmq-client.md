---
type: technical-primitive
category: library
status: in-use
first_used_phase: "PHASE-5"
mvp_required: true
future_only: false
tags:
  - technical
  - library
  - messaging
  - python
  - scope/mvp
related_architecture:
  - "[[event-driven-architecture]]"
  - "[[mvp-local-first-architecture]]"
related_features:
  - "[[file-watcher]]"
  - "[[git-automation]]"
dependencies:
  - "[[python-3-11]]"
  - "[[rabbitmq]]"
---

# Pika (RabbitMQ Client)

## Overview

Pure-Python AMQP client library for connecting to RabbitMQ. Provides both blocking and async interfaces for publishing and consuming messages in Weave-NN event-driven architecture.

## Category

**Library / Messaging Client**

## Why We Use It

**Primary reasons**:
1. **Official RabbitMQ client** - Maintained by Pivotal/VMware
2. **Blocking and async modes** - Flexible for different use cases
3. **Comprehensive API** - Full AMQP 0.9.1 protocol support
4. **Type hints** - Better IDE support and error detection
5. **Production-ready** - Battle-tested in large deployments

**Specific to Weave-NN**:
- File watcher publishes file events
- MCP server publishes tool execution events
- Consumers process events asynchronously
- Git automation triggered by message queue

## Key Capabilities

### Publishing
- **Basic publish** - Send messages to exchanges
- **Persistent messages** - Survive broker restarts
- **Publish confirms** - Acknowledgment from broker
- **Batch publishing** - Efficient bulk operations

### Consuming
- **Basic consume** - Callback-based message processing
- **Message acknowledgment** - Manual ACK/NACK/REJECT
- **Prefetch control** - Limit unacknowledged messages
- **Consumer cancellation** - Graceful shutdown

### Connection Management
- **Connection pooling** - Reuse connections
- **Automatic reconnection** - Handle broker restarts
- **Heartbeats** - Keep-alive mechanism
- **Blocked connection** - Handle backpressure

## Integration Points

```mermaid
graph LR
    Pika[Pika Library]
    Pika --> FileWatcher[File Watcher Publisher]
    Pika --> MCPServer[MCP Server Publisher]
    Pika --> MCPConsumer[MCP Sync Consumer]
    Pika --> GitConsumer[Git Auto-commit Consumer]

    FileWatcher --> RabbitMQ[RabbitMQ Broker]
    MCPServer --> RabbitMQ
    MCPConsumer --> RabbitMQ
    GitConsumer --> RabbitMQ
```

**Integration with**:
- [[rabbitmq]] - Message broker
- [[python-3-11]] - Runtime environment
- [[watchdog-file-monitoring]] - Event publisher
- [[gitpython]] - Event consumer

## Configuration

### Installation (Phase 5)

```bash
# Install Pika
pip install pika==1.3.2
```

### Basic Publisher

```python
# weave-nn-mcp/publishers/base_publisher.py
import pika
import json
from datetime import datetime
from typing import Dict, Any

class BasePublisher:
    """Base class for RabbitMQ publishers"""

    def __init__(self, rabbitmq_url: str, exchange: str):
        # Parse connection URL
        params = pika.URLParameters(rabbitmq_url)
        self.connection = pika.BlockingConnection(params)
        self.channel = self.connection.channel()
        self.exchange = exchange

        # Declare exchange (idempotent)
        self.channel.exchange_declare(
            exchange=exchange,
            exchange_type='topic',
            durable=True
        )

    def publish(self, routing_key: str, message: Dict[str, Any]):
        """Publish message to exchange with routing key"""

        # Add metadata
        message['timestamp'] = datetime.utcnow().isoformat()
        message['routing_key'] = routing_key

        # Serialize to JSON
        body = json.dumps(message)

        # Publish with persistence
        self.channel.basic_publish(
            exchange=self.exchange,
            routing_key=routing_key,
            body=body,
            properties=pika.BasicProperties(
                delivery_mode=2,  # Persistent
                content_type='application/json',
                timestamp=int(datetime.utcnow().timestamp())
            )
        )
        print(f"📤 Published: {routing_key} → {message.get('event')}")

    def close(self):
        """Close connection"""
        if self.connection and not self.connection.is_closed:
            self.connection.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
```

### File Event Publisher

```python
# weave-nn-mcp/publishers/file_events.py
from .base_publisher import BasePublisher
import os

class FileEventPublisher(BasePublisher):
    """Publishes file system events to RabbitMQ"""

    def __init__(self, rabbitmq_url: str):
        super().__init__(rabbitmq_url, exchange='weave-nn.events')

    def publish_file_created(self, file_path: str, content: str):
        """Publish file creation event"""
        self.publish(
            routing_key='file.created.md',
            message={
                'event': 'file.created',
                'file_path': file_path,
                'content': content,
                'size': len(content),
                'extension': os.path.splitext(file_path)[1]
            }
        )

    def publish_file_modified(self, file_path: str, content: str):
        """Publish file modification event"""
        self.publish(
            routing_key='file.modified.md',
            message={
                'event': 'file.modified',
                'file_path': file_path,
                'content': content
            }
        )

    def publish_file_deleted(self, file_path: str):
        """Publish file deletion event"""
        self.publish(
            routing_key='file.deleted.md',
            message={
                'event': 'file.deleted',
                'file_path': file_path
            }
        )
```

### Basic Consumer

```python
# weave-nn-mcp/consumers/base_consumer.py
import pika
import json
from typing import Callable
import signal
import sys

class BaseConsumer:
    """Base class for RabbitMQ consumers"""

    def __init__(self, rabbitmq_url: str, queue_name: str):
        # Parse connection URL
        params = pika.URLParameters(rabbitmq_url)
        self.connection = pika.BlockingConnection(params)
        self.channel = self.connection.channel()
        self.queue_name = queue_name

        # Set prefetch count (process N messages at a time)
        self.channel.basic_qos(prefetch_count=10)

        # Register signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, sig, frame):
        """Handle SIGINT/SIGTERM for graceful shutdown"""
        print(f"\n⚠️ Received signal {sig}. Shutting down gracefully...")
        self.stop()
        sys.exit(0)

    def start(self, callback: Callable):
        """Start consuming messages"""

        def wrapper(ch, method, properties, body):
            """Wrapper that handles ACK/NACK"""
            try:
                # Parse JSON message
                message = json.loads(body)

                # Call user callback
                callback(message)

                # ACK message (remove from queue)
                ch.basic_ack(delivery_tag=method.delivery_tag)

            except Exception as e:
                # NACK message (send to DLQ)
                print(f"❌ Error processing message: {e}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

        # Start consuming
        self.channel.basic_consume(
            queue=self.queue_name,
            on_message_callback=wrapper
        )

        print(f"🔄 Consumer started. Waiting for messages on '{self.queue_name}'...")
        print(f"   Press Ctrl+C to stop")
        self.channel.start_consuming()

    def stop(self):
        """Stop consuming and close connection"""
        if self.channel and self.channel.is_open:
            self.channel.stop_consuming()
        if self.connection and not self.connection.is_closed:
            self.connection.close()
```

### MCP Sync Consumer

```python
# weave-nn-mcp/consumers/mcp_sync.py
from .base_consumer import BaseConsumer
from typing import Dict, Any
import os

class MCPSyncConsumer(BaseConsumer):
    """Consumes file events and syncs to shadow cache"""

    def __init__(self, rabbitmq_url: str):
        super().__init__(rabbitmq_url, queue_name='weave-nn.mcp_sync')

    def process_message(self, message: Dict[str, Any]):
        """Process MCP sync event"""
        event = message['event']
        file_path = message['file_path']

        if event == 'file.created' or event == 'file.modified':
            # Sync to shadow cache
            content = message['content']
            self.sync_to_cache(file_path, content)
            print(f"✅ Synced: {file_path}")

        elif event == 'file.deleted':
            # Remove from shadow cache
            self.remove_from_cache(file_path)
            print(f"✅ Removed: {file_path}")

    def sync_to_cache(self, file_path: str, content: str):
        """Sync file to shadow cache (SQLite)"""
        # TODO: Implement shadow cache sync
        pass

    def remove_from_cache(self, file_path: str):
        """Remove file from shadow cache"""
        # TODO: Implement shadow cache removal
        pass

if __name__ == "__main__":
    consumer = MCPSyncConsumer(os.getenv("RABBITMQ_URL"))
    consumer.start(callback=consumer.process_message)
```

### Environment Configuration

```bash
# weave-nn-mcp/.env
RABBITMQ_URL=amqp://admin:weave-nn-2025@localhost:5672
```

## Alternatives Considered

### Celery
- **Pro**: Higher-level abstraction, task queue built-in
- **Con**: Overkill for simple pub/sub, more complexity
- **Verdict**: Rejected - Pika is simpler for event-driven use case

### Kombu (used by Celery)
- **Pro**: Abstraction over multiple brokers (RabbitMQ, Redis, SQS)
- **Con**: More abstraction than needed, less transparent
- **Verdict**: Rejected - Pika is more direct

### aio-pika (Async Pika)
- **Pro**: Fully async with asyncio
- **Con**: More complex for MVP, blocking mode is sufficient
- **Verdict**: Deferred - Consider for v1.0 if performance bottleneck

### RabbitMQ HTTP API
- **Pro**: Language-agnostic, no AMQP library needed
- **Con**: Much slower, no streaming consume, polling required
- **Verdict**: Rejected - AMQP protocol is superior

## Decision Reference

**[[phase-5-claude-flow-integration]]** - MCP Server Implementation
> "Day 1: Set up RabbitMQ event publishers and consumers using Pika"

**[[mvp-local-first-architecture]]** - Event-Driven Architecture
> "Pika (Python AMQP client) for RabbitMQ communication"

**Rationale**: Pika is the official RabbitMQ client for Python, providing both blocking and async interfaces. The blocking mode is simpler for MVP and sufficient for <1000 events/day workload.

## Learning Resources

### Official Documentation
- Pika Documentation: https://pika.readthedocs.io/
- Blocking Connection: https://pika.readthedocs.io/en/stable/modules/adapters/blocking.html
- Async Consumer: https://pika.readthedocs.io/en/stable/examples/asynchronous_consumer_example.html
- Connection Parameters: https://pika.readthedocs.io/en/stable/modules/parameters.html

### Tutorials
- Getting Started: https://www.rabbitmq.com/tutorials/tutorial-one-python.html
- Work Queues: https://www.rabbitmq.com/tutorials/tutorial-two-python.html
- Topic Exchange: https://www.rabbitmq.com/tutorials/tutorial-five-python.html

### Best Practices
- Error Handling: https://pika.readthedocs.io/en/stable/faq.html
- Performance: https://pika.readthedocs.io/en/stable/modules/adapters/blocking.html#performance

## Phase Usage

### Phase 5: Claude-Flow MCP Integration
- **Day 1**: Install Pika, test connection to RabbitMQ
- **Day 3**: Implement file event publishers
- **Day 4**: Implement MCP sync consumer
- **Day 5**: Implement Git automation consumer

### Phase 6: MVP Week 1 - Backend Infrastructure
- Add retry logic for failed connections
- Implement connection pooling
- Add comprehensive error handling
- Performance testing (message throughput)

### Phase 7: MVP Week 2 - Automation & Deployment
- Production configuration (heartbeats, timeouts)
- Monitoring and alerting
- Integration tests
- Documentation

## Common Patterns

### Connection with Retry

```python
import pika
import time

def connect_with_retry(url: str, max_retries: int = 5):
    """Connect to RabbitMQ with exponential backoff"""
    for attempt in range(max_retries):
        try:
            params = pika.URLParameters(url)
            connection = pika.BlockingConnection(params)
            print(f"✅ Connected to RabbitMQ")
            return connection
        except pika.exceptions.AMQPConnectionError as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"⚠️ Connection failed. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                raise
```

### Context Manager Pattern

```python
with FileEventPublisher(rabbitmq_url) as publisher:
    publisher.publish_file_created('/path/to/file.md', content)
# Connection automatically closed
```

## Migration Path

**Current (MVP)**: Pika blocking mode for publishers and consumers
**Future (v1.0)**: Consider aio-pika for async if performance bottleneck
**Future (v2.0)**: Connection pooling and advanced routing patterns

## Notes

- **Use blocking mode for MVP** - Simpler than async, sufficient for workload
- **Always set prefetch_count** - Prevents consumer overload
- **Handle signals gracefully** - SIGINT/SIGTERM for clean shutdown
- **Use persistent messages** - `delivery_mode=2` for reliability
- **ACK messages explicitly** - Don't use auto_ack (loses messages on crash)
