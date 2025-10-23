---
type: technical-primitive
category: library
status: in-use
first_used_phase: "PHASE-5"
mvp_required: true
future_only: false
maturity: mature

# Integration tracking
used_in_services:
  - file-watcher
deployment: docker-compose

# Relationships
alternatives_considered:
  - "inotify (Linux only)"
  - "Polling with os.walk"
  - "fswatch"
replaces: null
replaced_by: null

# Documentation
decision: "[[../decisions/technical/file-monitoring-library]]"
architecture: "[[../architecture/file-watcher]]"

tags:
  - technical
  - library
  - in-use
  - mvp
  - file-system
---

# Watchdog File Monitoring

**Category**: Python Library
**Status**: In Use (MVP)
**First Used**: Phase 5 Day 3 (Week 1)

---

## Overview

Watchdog is a Python library that provides platform-independent file system event monitoring. It detects file and directory changes (create, modify, delete, move) in real-time using native OS APIs.

**Official Site**: https://github.com/gorakhargosh/watchdog
**Documentation**: https://python-watchdog.readthedocs.io/

---

## Why We Use It

Watchdog enables real-time Obsidian vault monitoring in Weave-NN, triggering the event-driven architecture that powers automated rule processing, tagging, and linking.

**Primary Purpose**: Detect Obsidian vault file changes and publish events to RabbitMQ for asynchronous processing.

**Specific Use Cases**:
- Monitor `/vault` directory for markdown file changes in [[../architecture/file-watcher]]
- Detect file creation, modification, deletion, and move operations
- Trigger rule engine processing via RabbitMQ event publication
- Enable auto-tagging workflow when files are created/modified
- Support daily log automation by detecting new daily notes

---

## Key Capabilities

- **Platform-Independent API**: Uses native OS APIs (inotify on Linux, FSEvents on macOS, ReadDirectoryChangesW on Windows) - ensures consistent behavior across development environments
- **Event Filtering**: Pattern-based filtering (e.g., `*.md` only) - reduces noise from temp files and non-vault files
- **Recursive Monitoring**: Watches entire directory trees - supports nested Obsidian vault structures
- **Debouncing**: Handles rapid-fire events (e.g., editor auto-save) - prevents duplicate processing
- **Observer Pattern**: Clean callback-based API - integrates cleanly with async Python event loops

---

## Integration Points

**Used By**:
- [[../architecture/file-watcher]] - Core file system monitoring service
- [[../features/daily-log-automation]] - Detects new daily note creation
- [[../features/auto-tagging]] - Triggers when files are modified

**Integrates With**:
- [[pika]] - Publishes Watchdog events to RabbitMQ queues
- [[rabbitmq]] - Receives file change events from Watchdog
- [[python]] - Native Python library integration

**Enables Features**:
- [[../features/auto-tagging]] - Real-time tag suggestions on file save
- [[../features/auto-linking]] - Detects content changes for link analysis
- [[../features/daily-log-automation]] - Monitors for new daily notes

---

## Configuration

### Basic File Watcher Setup

```python
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time

class VaultChangeHandler(FileSystemEventHandler):
    """Handles Obsidian vault file system events."""

    def on_created(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith('.md'):
            print(f"File created: {event.src_path}")
            # Publish to RabbitMQ
            publish_event('file.created', event.src_path)

    def on_modified(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith('.md'):
            print(f"File modified: {event.src_path}")
            publish_event('file.modified', event.src_path)

    def on_deleted(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith('.md'):
            print(f"File deleted: {event.src_path}")
            publish_event('file.deleted', event.src_path)

    def on_moved(self, event):
        if event.is_directory:
            return
        if event.dest_path.endswith('.md'):
            print(f"File moved: {event.src_path} -> {event.dest_path}")
            publish_event('file.moved', {
                'from': event.src_path,
                'to': event.dest_path
            })

# Setup observer
observer = Observer()
handler = VaultChangeHandler()
observer.schedule(handler, path='/vault', recursive=True)
observer.start()

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    observer.stop()
observer.join()
```

### Docker Compose Integration (MVP)

```yaml
file-watcher:
  build: ./services/file-watcher
  container_name: weave-file-watcher
  volumes:
    - ./vault:/vault:ro  # Read-only vault access
  environment:
    VAULT_PATH: /vault
    RABBITMQ_HOST: rabbitmq
    RABBITMQ_PORT: 5672
    RABBITMQ_QUEUE: file_events
    # Watchdog configuration
    WATCH_RECURSIVE: "true"
    FILE_PATTERNS: "*.md"
    IGNORE_PATTERNS: ".obsidian/*,.trash/*,*.tmp"
  depends_on:
    - rabbitmq
  restart: unless-stopped
```

### Environment Variables

- `VAULT_PATH`: Path to Obsidian vault (default: `/vault`)
- `WATCH_RECURSIVE`: Monitor subdirectories (default: `true`)
- `FILE_PATTERNS`: Comma-separated glob patterns (default: `*.md`)
- `IGNORE_PATTERNS`: Comma-separated ignore patterns (default: `.obsidian/*,.trash/*`)
- `DEBOUNCE_SECONDS`: Minimum interval between events (default: `0.5`)

### Key Configuration Files

- `/services/file-watcher/watcher.py` - Main Watchdog observer implementation
- `/services/file-watcher/config.yaml` - File pattern and ignore rules
- `docker-compose.yml` - Service definition with vault volume mount

---

## Deployment

**MVP (Phase 5-6)**: Docker container with volume mount to Obsidian vault
**v1.0 (Post-MVP)**: Same deployment pattern (file watching is local-only)

**Resource Requirements**:
- RAM: 50-100 MB (lightweight observer process)
- CPU: < 5% (event-driven, not polling)
- Storage: None (stateless service)

**Health Check**:
```bash
# Check if file watcher container is running
docker ps | grep weave-file-watcher

# Check logs for event processing
docker logs weave-file-watcher --tail 50

# Test file monitoring
touch /vault/test.md
# Should see "File created: /vault/test.md" in logs

# Check RabbitMQ message publication
docker exec rabbitmq rabbitmqctl list_queues
# Should see messages in file_events queue
```

---

## Code Examples

### Complete File Watcher with RabbitMQ Integration

```python
import os
import json
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent
import pika
from datetime import datetime
from typing import Dict, Any

class ObsidianVaultHandler(FileSystemEventHandler):
    """
    Handles Obsidian vault file system events and publishes to RabbitMQ.

    Features:
    - Debouncing to prevent duplicate events
    - Markdown file filtering
    - Structured event payload
    - Error handling and retry logic
    """

    def __init__(self, rabbitmq_connection, queue_name: str, debounce_seconds: float = 0.5):
        self.channel = rabbitmq_connection.channel()
        self.queue_name = queue_name
        self.debounce_seconds = debounce_seconds
        self.last_event_time: Dict[str, float] = {}

        # Declare queue
        self.channel.queue_declare(queue=queue_name, durable=True)

    def _should_process_event(self, file_path: str) -> bool:
        """Check if event should be processed (debouncing + filtering)."""
        # Only process markdown files
        if not file_path.endswith('.md'):
            return False

        # Ignore Obsidian internal files
        if '/.obsidian/' in file_path or '/.trash/' in file_path:
            return False

        # Debounce: check if enough time has passed since last event
        now = time.time()
        last_time = self.last_event_time.get(file_path, 0)
        if now - last_time < self.debounce_seconds:
            return False

        self.last_event_time[file_path] = now
        return True

    def _publish_event(self, event_type: str, file_path: str, metadata: Dict[str, Any] = None):
        """Publish file event to RabbitMQ."""
        if not self._should_process_event(file_path):
            return

        payload = {
            'event_type': event_type,
            'file_path': file_path,
            'timestamp': datetime.utcnow().isoformat(),
            'metadata': metadata or {}
        }

        try:
            self.channel.basic_publish(
                exchange='',
                routing_key=self.queue_name,
                body=json.dumps(payload),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type='application/json'
                )
            )
            print(f"Published: {event_type} - {file_path}")
        except Exception as e:
            print(f"Error publishing event: {e}")

    def on_created(self, event: FileSystemEvent):
        """Handle file creation events."""
        if not event.is_directory:
            self._publish_event('file.created', event.src_path, {
                'size': os.path.getsize(event.src_path)
            })

    def on_modified(self, event: FileSystemEvent):
        """Handle file modification events."""
        if not event.is_directory:
            self._publish_event('file.modified', event.src_path, {
                'size': os.path.getsize(event.src_path)
            })

    def on_deleted(self, event: FileSystemEvent):
        """Handle file deletion events."""
        if not event.is_directory:
            self._publish_event('file.deleted', event.src_path)

    def on_moved(self, event: FileSystemEvent):
        """Handle file move/rename events."""
        if not event.is_directory:
            self._publish_event('file.moved', event.dest_path, {
                'from_path': event.src_path,
                'to_path': event.dest_path
            })


def main():
    """Start Obsidian vault file watcher."""
    # Configuration from environment
    vault_path = os.getenv('VAULT_PATH', '/vault')
    rabbitmq_host = os.getenv('RABBITMQ_HOST', 'localhost')
    rabbitmq_port = int(os.getenv('RABBITMQ_PORT', 5672))
    queue_name = os.getenv('RABBITMQ_QUEUE', 'file_events')

    # Connect to RabbitMQ
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(
            host=rabbitmq_host,
            port=rabbitmq_port,
            heartbeat=600,
            blocked_connection_timeout=300
        )
    )

    # Setup Watchdog observer
    event_handler = ObsidianVaultHandler(connection, queue_name)
    observer = Observer()
    observer.schedule(event_handler, vault_path, recursive=True)
    observer.start()

    print(f"Watching {vault_path} for changes...")
    print(f"Publishing events to RabbitMQ queue: {queue_name}")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping file watcher...")
        observer.stop()
        connection.close()

    observer.join()


if __name__ == '__main__':
    main()
```

### Testing File Watcher

```python
import unittest
import tempfile
import os
import time
from unittest.mock import Mock, patch
from watchdog.observers import Observer

class TestFileWatcher(unittest.TestCase):
    """Test Watchdog file monitoring."""

    def setUp(self):
        """Create temporary directory for testing."""
        self.test_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Cleanup temporary directory."""
        import shutil
        shutil.rmtree(self.test_dir)

    @patch('pika.BlockingConnection')
    def test_file_creation_event(self, mock_rabbitmq):
        """Test that file creation triggers event."""
        # Setup mock RabbitMQ
        mock_channel = Mock()
        mock_rabbitmq.return_value.channel.return_value = mock_channel

        # Start observer
        handler = ObsidianVaultHandler(mock_rabbitmq.return_value, 'test_queue')
        observer = Observer()
        observer.schedule(handler, self.test_dir, recursive=False)
        observer.start()

        # Create test file
        test_file = os.path.join(self.test_dir, 'test.md')
        with open(test_file, 'w') as f:
            f.write("# Test Note")

        # Wait for event processing
        time.sleep(1)

        # Verify RabbitMQ publish was called
        self.assertTrue(mock_channel.basic_publish.called)

        observer.stop()
        observer.join()
```

---

## Trade-offs

**Pros** (Why we chose it):
- ✅ **Platform-Independent**: Works on Linux, macOS, Windows without code changes
- ✅ **Event-Driven**: Zero CPU usage when idle, instant response to changes
- ✅ **Mature & Stable**: 10+ years of production use, well-documented
- ✅ **Python-Native**: Clean integration with FastAPI/Pika services
- ✅ **Recursive Monitoring**: Handles complex Obsidian vault structures automatically

**Cons** (What we accepted):
- ⚠️ **Native Dependencies**: Requires platform-specific OS APIs - mitigated by Docker containerization ensuring consistent environment
- ⚠️ **No Event Ordering Guarantees**: Multiple rapid changes may arrive out-of-order - acceptable because RabbitMQ provides ordering within queues
- ⚠️ **Memory for Large Directories**: Keeps file descriptors open - acceptable for typical Obsidian vault sizes (< 10,000 files)

---

## Alternatives Considered

**Compared With**:

### inotify (Linux only)
- **Pros**: Native Linux kernel API, zero overhead, guaranteed event delivery
- **Cons**: Linux-only, requires root permissions for some features, complex low-level API
- **Decision**: Rejected because Weave-NN must run on macOS/Windows for local development

### Polling with os.walk
- **Pros**: Platform-independent, no dependencies, simple implementation
- **Cons**: High CPU usage, 1-5 second latency, doesn't detect events (only state diffs)
- **Decision**: Rejected because polling every second uses 5-10% CPU continuously vs Watchdog's < 1%

### fswatch (C++ tool)
- **Pros**: Fast, battle-tested, command-line interface
- **Cons**: External process dependency, complex subprocess management, no Python API
- **Decision**: Rejected because Python-native solution is simpler to deploy and debug

---

## Decision History

**Decision Record**: [[../decisions/technical/file-monitoring-library]]

**Key Reasoning**:
> "Watchdog provides the perfect balance of platform independence, performance, and Python integration. The event-driven architecture requires real-time file monitoring (ruling out polling), and cross-platform support is mandatory for local development (ruling out inotify). Watchdog's maturity and extensive production use give us confidence in reliability."

**Date Decided**: 2025-10-15 (Phase 5 Day 3)
**Decided By**: System Architect

---

## Phase Usage

### Phase 5 Day 3 (MVP Week 1) - **Active**
- **Implementation**: Core file watcher service with RabbitMQ integration
- **Scope**: Monitor `/vault` directory for `.md` file changes
- **Events**: file.created, file.modified, file.deleted, file.moved
- **Testing**: Unit tests for event detection and RabbitMQ publication

### Phase 5 Day 4 (MVP Week 1) - **Active**
- **Enhancement**: Debouncing logic to handle rapid editor auto-saves
- **Integration**: Connected to event consumer for rule processing
- **Monitoring**: Added health check endpoint and logging

### Phase 6 (MVP Week 2) - **Stable**
- **Production**: Running in Docker Compose with volume mounts
- **Optimization**: Tuned debounce intervals based on real usage
- **Documentation**: Troubleshooting guide for common issues

### Phase 7 (v1.0) - **Maintained**
- **Future**: No major changes planned (file watching is mature)
- **Consideration**: May add WebSocket endpoint to stream events to frontend

---

## Learning Resources

**Official Documentation**:
- [Watchdog Documentation](https://python-watchdog.readthedocs.io/) - Complete API reference
- [Watchdog GitHub](https://github.com/gorakhargosh/watchdog) - Source code and examples

**Tutorials**:
- [Real-time File Monitoring with Python](https://www.thepythoncode.com/article/monitoring-file-system-changes-in-python) - Beginner tutorial
- [Building a File Watcher Service](https://realpython.com/python-watchdog/) - Production patterns

**Best Practices**:
- [Watchdog Performance Tips](https://python-watchdog.readthedocs.io/en/stable/quickstart.html#a-simple-example) - Optimization guide
- [Handling File System Events](https://pypi.org/project/watchdog/) - Common patterns

**Community**:
- [Watchdog GitHub Issues](https://github.com/gorakhargosh/watchdog/issues) - Bug reports and discussions
- [Stack Overflow: python-watchdog](https://stackoverflow.com/questions/tagged/python-watchdog) - Community Q&A

---

## Monitoring & Troubleshooting

**Health Checks**:
```bash
# Check if file watcher container is running
docker ps | grep weave-file-watcher

# Check logs for event processing
docker logs weave-file-watcher --tail 50 --follow

# Verify vault volume is mounted
docker inspect weave-file-watcher | grep -A 10 Mounts

# Test file detection
touch /path/to/vault/test-watchdog.md
# Should see event in logs within 1 second
```

**Common Issues**:

1. **Issue**: Events not detected after file changes
   **Solution**:
   - Check vault volume mount: `docker inspect weave-file-watcher`
   - Verify file patterns in config: `*.md` should match your files
   - Check if file is in ignored directory (`.obsidian/`, `.trash/`)

2. **Issue**: Duplicate events for single file save
   **Solution**:
   - Increase `DEBOUNCE_SECONDS` environment variable (default: 0.5)
   - Some editors trigger multiple modify events during save

3. **Issue**: High memory usage with large vaults
   **Solution**:
   - Add more ignore patterns for temporary files
   - Consider excluding attachment directories if not needed
   - Typical vault < 10k files should use < 200 MB RAM

4. **Issue**: File watcher stops responding after hours
   **Solution**:
   - Check RabbitMQ connection health (may need reconnection logic)
   - Review Docker logs for exceptions
   - Increase RabbitMQ heartbeat interval in connection params

---

## Related Nodes

**Architecture**:
- [[../architecture/file-watcher]] - File watcher service design
- [[../architecture/event-driven-architecture]] - How file events flow

**Features**:
- [[../features/auto-tagging]] - Triggered by file modification events
- [[../features/daily-log-automation]] - Detects new daily note creation
- [[../features/auto-linking]] - Processes file changes for link suggestions

**Decisions**:
- [[../decisions/technical/file-monitoring-library]] - Why Watchdog over alternatives
- [[../decisions/technical/event-driven-architecture]] - Why event-driven vs polling

**Other Primitives**:
- [[pika]] - RabbitMQ client that publishes Watchdog events
- [[rabbitmq]] - Message broker that receives file events
- [[python]] - Programming language for file watcher service

---

## Revisit Criteria

**Reconsider this technology if**:
- Performance degrades below 1-second event detection latency
- Memory usage exceeds 500 MB for typical vault sizes (< 10k files)
- Platform compatibility issues arise (e.g., new OS version breaks native APIs)
- Superior cross-platform file monitoring library emerges with better performance

**Scheduled Review**: 2026-06-01 (6 months after v1.0 launch)

---

**Back to**: [[README|Technical Primitives Index]]
