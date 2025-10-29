---
title: 'Migration Path: Local MVP to Microservices Architecture'
type: architecture
status: in-progress
phase_id: PHASE-0
tags:
  - phase/phase-0
  - type/architecture
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4DA"
  color: '#50E3C2'
  cssclasses:
    - architecture-document
updated: '2025-10-29T04:55:05.476Z'
keywords:
  - executive summary
  - table of contents
  - architecture analysis
  - current local mvp architecture (phase 5-6 deliverable)
  - target microservices architecture (phase 2 outcome)
  - 'phase 0: local mvp (weeks 1-2)'
  - objective
  - key principles for easy migration
  - docker compose setup (mvp)
  - 'phase 1: service extraction (months 2-3)'
---
# Migration Path: Local MVP to Microservices Architecture

**Document Type**: Migration Strategy & Refactoring Guide
**Status**: Analysis Complete
**Created**: 2025-10-23
**Analyst**: Code Analyst Agent

---

## Executive Summary

This document provides a comprehensive migration strategy for evolving Weave-NN from a local MVP (single-machine Docker Compose deployment) to a distributed microservices architecture running on Kubernetes. The strategy emphasizes **incremental migration**, **risk mitigation**, and **maintaining system stability** throughout the transformation.

**Key Insight**: The current Obsidian-first architecture is already **naturally decomposable** into microservices due to its event-driven, message queue-based design. This architectural decision significantly reduces migration risk.

---

## Table of Contents

1. [Architecture Analysis](#architecture-analysis)
2. [Phase 0: Local MVP (Weeks 1-2)](#phase-0-local-mvp-weeks-1-2)
3. [Phase 1: Service Extraction (Months 2-3)](#phase-1-service-extraction-months-2-3)
4. [Phase 2: Kubernetes Migration (Months 4-6)](#phase-2-kubernetes-migration-months-4-6)
5. [Refactoring Checklist](#refactoring-checklist)
6. [Risk Mitigation Strategies](#risk-mitigation-strategies)
7. [Code Examples](#code-examples)

---

## Architecture Analysis

### Current Local MVP Architecture (Phase 5-6 Deliverable)

```
┌─────────────────────────────────────────────────────┐
│           SINGLE MACHINE (Docker Compose)           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Obsidian Desktop (Electron) ──────────────────┐    │
│         │                                       │    │
│         │ REST API (HTTPS)                     │    │
│         ▼                                       │    │
│  ┌──────────────────┐    ┌──────────────────┐ │    │
│  │ Python MCP       │    │   RabbitMQ       │ │    │
│  │ Server (FastAPI) │◄───┤  Message Queue   │ │    │
│  │                  │    │                  │ │    │
│  │ - File Ops       │    │ Exchange:        │ │    │
│  │ - Search         │    │ weave-nn.events  │ │    │
│  │ - Task Mgmt      │    │                  │ │    │
│  │ - Git Ops        │    │ Queues:          │ │    │
│  └──────────────────┘    │ • mcp_sync       │ │    │
│         │                │ • git_auto_commit│ │    │
│         │                │ • agent_tasks    │ │    │
│  ┌──────▼──────────┐    │ • n8n_workflows  │ │    │
│  │ File Watcher    │───►│ • dlq            │ │    │
│  │ (Python)        │    └──────────────────┘ │    │
│  └─────────────────┘              │          │    │
│         │                          │          │    │
│         │                          ▼          │    │
│  ┌──────▼──────────┐    ┌──────────────────┐ │    │
│  │ Consumers:      │    │      N8N         │ │    │
│  │ • MCP Sync      │    │  (Automation)    │ │    │
│  │ • Git Commit    │    │                  │ │    │
│  │ • Agent Tasks   │    │ 5 Core Workflows │ │    │
│  └─────────────────┘    └──────────────────┘ │    │
│         │                          │          │    │
│         ▼                          ▼          │    │
│  ┌───────────────────────────────────────┐   │    │
│  │        Storage Layer                  │   │    │
│  │  • Markdown Files (Git)               │   │    │
│  │  • SQLite (Shadow Cache, Memory)      │   │    │
│  │  • Embeddings (OpenAI)                │   │    │
│  └───────────────────────────────────────┘   │    │
│                                                │    │
│  ┌───────────────────────────────────────┐   │    │
│  │   Claude-Flow Agents (External API)   │   │    │
│  │   • 8 Agent Types                     │   │    │
│  │   • Memory Store (SQLite)             │   │    │
│  └───────────────────────────────────────┘   │    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key Characteristics**:
- **Single-machine deployment** (local dev or GCP VM)
- **Docker Compose** orchestration
- **Event-driven** via RabbitMQ
- **Loosely coupled** components (already microservice-ready)
- **Stateful services**: File watcher, MCP server, SQLite databases
- **External dependencies**: Obsidian REST API, Claude API

---

### Target Microservices Architecture (Phase 2 Outcome)

```
┌──────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                         │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Client Layer (Outside K8s)                                  │
│  ┌─────────────────┐                                         │
│  │ Obsidian Desktop│──────┐                                  │
│  └─────────────────┘      │ HTTPS/TLS                        │
│                           │                                   │
│  ┌────────────────────────▼──────────────────────────┐       │
│  │         Ingress Controller (Nginx/Traefik)         │       │
│  │         • TLS Termination                          │       │
│  │         • Load Balancing                           │       │
│  │         • Rate Limiting                            │       │
│  └────────────────────┬───────────────────────────────┘       │
│                       │                                        │
│  ┌────────────────────▼──────────────────────────┐            │
│  │   API Gateway Service (Microservice #1)      │            │
│  │   • Authentication                            │            │
│  │   • Request Routing                           │            │
│  │   • API Rate Limiting                         │            │
│  └────────────────────┬───────────────────────────┘           │
│                       │                                        │
│     ┌─────────────────┼─────────────────┐                     │
│     │                 │                 │                     │
│     ▼                 ▼                 ▼                     │
│  ┌────────┐      ┌────────┐       ┌────────┐                │
│  │ File   │      │  Task  │       │  Git   │                │
│  │ Service│      │ Service│       │Service │ Microservices  │
│  │  (MS2) │      │  (MS3) │       │  (MS4) │                │
│  └───┬────┘      └───┬────┘       └───┬────┘                │
│      │               │                 │                     │
│      └───────────────┼─────────────────┘                     │
│                      │                                        │
│           ┌──────────▼──────────────┐                        │
│           │   RabbitMQ Cluster      │  Message Bus          │
│           │   (Stateful Set)        │                        │
│           │   • 3 Node HA           │                        │
│           │   • Persistent Storage  │                        │
│           └──────────┬──────────────┘                        │
│                      │                                        │
│      ┌───────────────┼───────────────┐                       │
│      │               │               │                       │
│      ▼               ▼               ▼                       │
│  ┌────────┐      ┌────────┐     ┌────────┐                 │
│  │  MCP   │      │ Agent  │     │  N8N   │ Event Consumers │
│  │  Sync  │      │ Tasks  │     │Workflow│                 │
│  │  (MS5) │      │  (MS6) │     │  (MS7) │                 │
│  └───┬────┘      └───┬────┘     └───┬────┘                 │
│      │               │               │                       │
│      └───────────────┼───────────────┘                       │
│                      │                                        │
│           ┌──────────▼──────────────┐                        │
│           │   PostgreSQL Cluster    │  Persistent Storage   │
│           │   (Stateful Set)        │                        │
│           │   • Primary + Replicas  │                        │
│           │   • Persistent Volumes  │                        │
│           └──────────┬──────────────┘                        │
│                      │                                        │
│           ┌──────────▼──────────────┐                        │
│           │   Redis Cache            │  Distributed Cache    │
│           │   (Session, Embeddings) │                        │
│           └──────────────────────────┘                        │
│                                                               │
│  External Services (Outside K8s)                             │
│  ┌─────────────────┐   ┌─────────────────┐                 │
│  │ Claude-Flow API │   │  Git Remote     │                 │
│  │ (Anthropic)     │   │  (GitHub)       │                 │
│  └─────────────────┘   └─────────────────┘                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Microservice Breakdown**:
1. **API Gateway** - Request routing, auth, rate limiting
2. **File Service** - File CRUD operations via Obsidian REST API
3. **Task Service** - Task management, queries, updates
4. **Git Service** - Auto-commit, validation, history
5. **MCP Sync Service** - Shadow cache updates, Claude-Flow memory sync
6. **Agent Tasks Service** - Agent rule execution (auto-linking, auto-tagging)
7. **N8N Workflow Service** - Automation workflows
8. **RabbitMQ Cluster** - HA message queue (3 nodes)
9. **PostgreSQL Cluster** - Replaces SQLite, adds replication
10. **Redis Cache** - Distributed caching for sessions, embeddings

---

## Phase 0: Local MVP (Weeks 1-2)

### Objective
Build a **deployable, production-ready MVP** that runs on a single machine (local dev or GCP VM) while **preserving future microservices decomposition**.

### Key Principles for Easy Migration

#### 1. **Service Boundaries from Day 1**
Even though deployed as a monolith, organize code by service boundaries:

```
weave-nn-mcp/
├── services/
│   ├── file_service/        # Future Microservice #2
│   │   ├── __init__.py
│   │   ├── routes.py        # FastAPI routes
│   │   ├── service.py       # Business logic
│   │   └── models.py        # Data models
│   ├── task_service/        # Future Microservice #3
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   ├── service.py
│   │   └── models.py
│   ├── git_service/         # Future Microservice #4
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   ├── service.py
│   │   └── models.py
│   └── api_gateway/         # Future Microservice #1
│       ├── __init__.py
│       └── routes.py
├── consumers/
│   ├── mcp_sync.py          # Future Microservice #5
│   ├── agent_tasks.py       # Future Microservice #6
│   └── git_auto_commit.py   # Part of Git Service
├── publishers/
│   └── file_watcher.py      # Part of File Service
├── shared/
│   ├── rabbitmq_client.py   # Shared messaging client
│   ├── obsidian_client.py   # Shared Obsidian REST client
│   ├── config.py            # Centralized configuration
│   └── models.py            # Shared data models
└── docker-compose.yml       # Single-machine orchestration
```

**Why This Structure?**
- Clear service boundaries make extraction trivial
- Shared utilities are isolated (easy to extract into libraries)
- Each service is independently testable
- Docker Compose can spin up services as separate containers

---

#### 2. **Communication via Message Queue (RabbitMQ)**
**DO**:
- ✅ Use RabbitMQ for **all inter-service communication**
- ✅ Define event schemas in shared models (`shared/models.py`)
- ✅ Use topic exchanges for flexible routing
- ✅ Implement idempotent consumers (handle duplicate messages)

**DON'T**:
- ❌ Direct function calls between services (breaks decomposition)
- ❌ Shared in-memory state (use Redis or database instead)
- ❌ Hard-coded service URLs (use environment variables)

**Example Event Schema**:
```python
# shared/models.py
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

class VaultFileEvent(BaseModel):
    """Event published when vault file changes"""
    event_type: str  # vault.file.created | vault.file.updated | vault.file.deleted
    file_path: str
    vault_id: str
    frontmatter: Optional[Dict] = None
    timestamp: datetime
    user_id: Optional[str] = None

class TaskEvent(BaseModel):
    """Event published when task changes"""
    event_type: str  # task.created | task.updated | task.completed
    task_id: str
    project_id: str
    title: str
    status: str
    timestamp: datetime
```

---

#### 3. **Configuration via Environment Variables**
**DO**:
- ✅ Store all configuration in `.env` files
- ✅ Use `python-decouple` or `pydantic.BaseSettings` for config management
- ✅ Never hard-code URLs, credentials, or timeouts

**Example Configuration**:
```python
# shared/config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Obsidian REST API
    obsidian_api_url: str = "https://localhost:27124"
    obsidian_api_key: str

    # RabbitMQ
    rabbitmq_url: str = "amqp://admin:password@localhost:5672"
    rabbitmq_exchange: str = "weave-nn.events"

    # Database
    database_url: str = "sqlite:///./weave-nn.db"  # Easy to swap to PostgreSQL

    # Claude API
    claude_api_key: str
    claude_api_url: str = "https://api.anthropic.com/v1"

    # Service Configuration
    service_name: str = "file-service"  # Overridden per service
    log_level: str = "INFO"

    class Config:
        env_file = ".env"

settings = Settings()
```

**Why This Matters?**
- Switching from SQLite to PostgreSQL = change 1 environment variable
- Moving RabbitMQ to cloud = change 1 environment variable
- No code changes needed for infrastructure changes

---

#### 4. **Database Abstraction (SQLAlchemy ORM)**
**DO**:
- ✅ Use SQLAlchemy ORM (not raw SQL)
- ✅ Define models with `declarative_base`
- ✅ Use `create_engine` with connection string from config
- ✅ Write database-agnostic queries

**Example Database Setup**:
```python
# shared/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from shared.config import settings

# Works with SQLite or PostgreSQL (change settings.database_url)
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Example Model**:
```python
# services/task_service/models.py
from sqlalchemy import Column, String, DateTime, Boolean
from shared.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True)
    project_id = Column(String, index=True)
    title = Column(String)
    status = Column(String, index=True)
    due_date = Column(DateTime, nullable=True)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime)
```

**Why This Matters?**
- Switching from SQLite to PostgreSQL = change 1 line in config
- ORM handles SQL dialect differences automatically
- No query rewriting needed during migration

---

#### 5. **Idempotent Consumers**
**DO**:
- ✅ Handle duplicate messages gracefully (RabbitMQ doesn't guarantee exactly-once delivery)
- ✅ Use transaction IDs or message IDs for deduplication
- ✅ Store processed message IDs in database

**Example Idempotent Consumer**:
```python
# consumers/mcp_sync.py
import pika
from shared.rabbitmq_client import RabbitMQClient
from shared.database import get_db
from services.mcp_sync_service.service import MCPSyncService

class MCPSyncConsumer:
    def __init__(self):
        self.rabbitmq = RabbitMQClient()
        self.service = MCPSyncService()
        self.processed_messages = set()  # Or use Redis for distributed dedup

    def start(self):
        self.rabbitmq.subscribe("mcp_sync", self.handle_message)

    def handle_message(self, message):
        # Idempotency check
        message_id = message.get("message_id")
        if message_id in self.processed_messages:
            print(f"Skipping duplicate message: {message_id}")
            return

        try:
            # Process message
            self.service.sync_vault_change(message)

            # Mark as processed
            self.processed_messages.add(message_id)

            # Acknowledge message
            self.rabbitmq.ack(message)
        except Exception as e:
            # Send to DLQ for manual review
            self.rabbitmq.send_to_dlq(message, error=str(e))
```

---

#### 6. **What to Avoid in Local MVP**

**Anti-Patterns That Break Migration**:

❌ **Shared In-Memory State**:
```python
# BAD: Shared global cache
global_cache = {}  # Will break when split into microservices

def get_cached_note(file_path):
    return global_cache.get(file_path)
```

✅ **Instead**: Use Redis or database for shared state:
```python
# GOOD: Redis cache (works in single-machine and distributed)
import redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_cached_note(file_path):
    return redis_client.get(file_path)
```

---

❌ **Direct Service-to-Service Function Calls**:
```python
# BAD: Direct import and function call
from services.file_service.service import FileService

def create_task(task_data):
    file_service = FileService()
    file_service.create_note(task_data)  # Tightly coupled
```

✅ **Instead**: Publish event to message queue:
```python
# GOOD: Event-driven communication
from shared.rabbitmq_client import RabbitMQClient

def create_task(task_data):
    rabbitmq = RabbitMQClient()
    rabbitmq.publish("task.created", task_data)  # Decoupled
```

---

❌ **Hard-Coded Configuration**:
```python
# BAD: Hard-coded values
OBSIDIAN_API_URL = "https://localhost:27124"
DATABASE_PATH = "/home/user/weave-nn.db"
```

✅ **Instead**: Environment variables:
```python
# GOOD: Configuration from environment
from shared.config import settings

OBSIDIAN_API_URL = settings.obsidian_api_url
DATABASE_PATH = settings.database_url
```

---

### Docker Compose Setup (MVP)

```yaml
# docker-compose.yml
version: '3.8'

services:
  rabbitmq:
    image: rabbitmq:3-management
    container_name: weave-nn-rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    restart: unless-stopped

  mcp-server:
    build: .
    container_name: weave-nn-mcp-server
    command: uvicorn server:app --host 0.0.0.0 --port 8000
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./data/weave-nn.db
      - RABBITMQ_URL=amqp://admin:${RABBITMQ_PASSWORD}@rabbitmq:5672
      - OBSIDIAN_API_URL=${OBSIDIAN_API_URL}
      - OBSIDIAN_API_KEY=${OBSIDIAN_API_KEY}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    volumes:
      - ./data:/app/data
      - ./vault:/app/vault:ro  # Read-only access to vault
    depends_on:
      - rabbitmq
    restart: unless-stopped

  file-watcher:
    build: .
    container_name: weave-nn-file-watcher
    command: python publishers/file_watcher.py
    environment:
      - RABBITMQ_URL=amqp://admin:${RABBITMQ_PASSWORD}@rabbitmq:5672
    volumes:
      - ./vault:/app/vault:ro
    depends_on:
      - rabbitmq
    restart: unless-stopped

  mcp-sync-consumer:
    build: .
    container_name: weave-nn-mcp-sync
    command: python consumers/mcp_sync.py
    environment:
      - DATABASE_URL=sqlite:///./data/weave-nn.db
      - RABBITMQ_URL=amqp://admin:${RABBITMQ_PASSWORD}@rabbitmq:5672
    volumes:
      - ./data:/app/data
    depends_on:
      - rabbitmq
      - mcp-server
    restart: unless-stopped

  git-consumer:
    build: .
    container_name: weave-nn-git-consumer
    command: python consumers/git_auto_commit.py
    environment:
      - RABBITMQ_URL=amqp://admin:${RABBITMQ_PASSWORD}@rabbitmq:5672
    volumes:
      - ./vault:/app/vault
    depends_on:
      - rabbitmq
    restart: unless-stopped

  n8n:
    image: n8nio/n8n
    container_name: weave-nn-n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - rabbitmq
    restart: unless-stopped

volumes:
  rabbitmq_data:
  n8n_data:
```

**Key Points**:
- Each service is a separate Docker container (easy to move to K8s pods)
- Services communicate via RabbitMQ (not direct HTTP calls)
- Configuration via environment variables (`.env` file)
- Persistent volumes for data (rabbitmq_data, n8n_data, ./data)

---

## Phase 1: Service Extraction (Months 2-3)

### Objective
Extract individual services from the monolithic Docker Compose deployment into **independently deployable microservices** while maintaining **backward compatibility** and **system stability**.

### Service Extraction Priority (Which Services to Split First?)

#### Extraction Order (Least Risky → Most Risky)

1. **N8N Workflow Service** (Week 1)
   - **Why First?**: Already isolated, minimal dependencies
   - **Risk**: Low (standalone Docker container)
   - **Dependencies**: RabbitMQ (message queue)

2. **Git Service** (Week 2)
   - **Why Second?**: Simple service, no database
   - **Risk**: Low (file system operations only)
   - **Dependencies**: RabbitMQ, Git CLI

3. **Task Service** (Week 3)
   - **Why Third?**: Clear boundary, single database table
   - **Risk**: Medium (needs database migration)
   - **Dependencies**: RabbitMQ, PostgreSQL, Obsidian REST API

4. **File Service** (Week 4)
   - **Why Fourth?**: Core service, high usage
   - **Risk**: Medium-High (critical path)
   - **Dependencies**: RabbitMQ, Obsidian REST API

5. **MCP Sync Service** (Week 5)
   - **Why Fifth?**: Complex logic, performance critical
   - **Risk**: High (impacts all other services)
   - **Dependencies**: RabbitMQ, PostgreSQL, Claude-Flow API

6. **Agent Tasks Service** (Week 6)
   - **Why Last?**: External dependencies, AI processing
   - **Risk**: High (external API calls, long-running tasks)
   - **Dependencies**: RabbitMQ, Claude-Flow API, PostgreSQL

---

### Refactoring Strategy: "Strangler Fig Pattern"

The **Strangler Fig Pattern** involves:
1. Build new microservice alongside old monolith
2. Route some traffic to new service
3. Gradually increase traffic to new service
4. Remove old service once 100% traffic migrated

**Visual**:
```
Week 1: [Monolith 100%] → [New Service 0%]
Week 2: [Monolith 90%]  → [New Service 10%]
Week 3: [Monolith 50%]  → [New Service 50%]
Week 4: [Monolith 10%]  → [New Service 90%]
Week 5: [Monolith 0%]   → [New Service 100%] ✅ Remove old code
```

---

### Step-by-Step Extraction: Task Service Example

#### Step 1: Create Standalone Service Repository

```bash
# Create new repo
mkdir task-service
cd task-service

# Initialize project structure
task-service/
├── Dockerfile
├── requirements.txt
├── main.py              # FastAPI app
├── routes/
│   └── task_routes.py   # API endpoints
├── services/
│   └── task_service.py  # Business logic
├── models/
│   └── task.py          # SQLAlchemy models
├── consumers/
│   └── task_consumer.py # RabbitMQ consumer
├── shared/
│   ├── config.py        # Environment config
│   ├── database.py      # Database connection
│   └── rabbitmq.py      # RabbitMQ client
└── tests/
    └── test_task_service.py
```

---

#### Step 2: Copy Service Code from Monolith

```bash
# Copy existing service code
cp -r ../weave-nn-mcp/services/task_service/* ./services/
cp -r ../weave-nn-mcp/shared/* ./shared/
```

---

#### Step 3: Add Service-Specific Configuration

```python
# shared/config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Service Identity
    service_name: str = "task-service"
    service_version: str = "1.0.0"

    # Database (switched to PostgreSQL)
    database_url: str = "postgresql://user:pass@postgres:5432/weave_nn"

    # RabbitMQ
    rabbitmq_url: str
    rabbitmq_exchange: str = "weave-nn.events"

    # Obsidian REST API
    obsidian_api_url: str
    obsidian_api_key: str

    # Service Discovery (for inter-service communication)
    file_service_url: str = "http://file-service:8001"
    git_service_url: str = "http://git-service:8002"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

#### Step 4: Create Dockerfile

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8003

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]
```

---

#### Step 5: Deploy Alongside Monolith

```yaml
# docker-compose.yml (updated with new service)
version: '3.8'

services:
  # ... existing services ...

  task-service:
    build: ./task-service
    container_name: weave-nn-task-service
    ports:
      - "8003:8003"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/weave_nn
      - RABBITMQ_URL=amqp://admin:${RABBITMQ_PASSWORD}@rabbitmq:5672
      - OBSIDIAN_API_URL=${OBSIDIAN_API_URL}
      - OBSIDIAN_API_KEY=${OBSIDIAN_API_KEY}
      - FILE_SERVICE_URL=http://file-service:8001
      - GIT_SERVICE_URL=http://git-service:8002
    depends_on:
      - postgres
      - rabbitmq
    restart: unless-stopped

  # Keep old monolith running during migration
  mcp-server:
    # ... existing config ...
    # Routes 90% of traffic to old monolith, 10% to new task-service
```

---

#### Step 6: Implement Feature Flag for Traffic Routing

```python
# shared/feature_flags.py
import random

class FeatureFlags:
    @staticmethod
    def route_to_new_task_service() -> bool:
        """
        Route 10% of traffic to new task-service
        Gradually increase percentage over weeks
        """
        return random.random() < 0.10  # 10% traffic

# Usage in API Gateway
from shared.feature_flags import FeatureFlags

@app.get("/tasks")
def list_tasks():
    if FeatureFlags.route_to_new_task_service():
        # Route to new microservice
        response = requests.get("http://task-service:8003/tasks")
    else:
        # Route to old monolith
        response = task_service.list_tasks()
    return response.json()
```

---

#### Step 7: Monitor and Gradually Increase Traffic

**Week 1**: 10% traffic → new service (monitor for errors)
**Week 2**: 25% traffic → new service
**Week 3**: 50% traffic → new service
**Week 4**: 75% traffic → new service
**Week 5**: 100% traffic → new service ✅ Remove old code

**Monitoring**:
```python
# Prometheus metrics
from prometheus_client import Counter, Histogram

request_count = Counter('task_service_requests', 'Total requests', ['service', 'endpoint', 'status'])
request_latency = Histogram('task_service_latency', 'Request latency', ['service', 'endpoint'])

@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    request_count.labels(service=settings.service_name, endpoint=request.url.path, status=response.status_code).inc()
    request_latency.labels(service=settings.service_name, endpoint=request.url.path).observe(duration)

    return response
```

---

### Database Migration: SQLite → PostgreSQL

**Challenge**: SQLite (single-file) → PostgreSQL (networked database)

**Solution**: Use Alembic for database migrations

#### Step 1: Install Alembic

```bash
pip install alembic
alembic init alembic
```

---

#### Step 2: Create Migration Scripts

```python
# alembic/versions/001_create_tasks_table.py
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'tasks',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('project_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('completed', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tasks_project_id', 'tasks', ['project_id'])
    op.create_index('ix_tasks_status', 'tasks', ['status'])

def downgrade():
    op.drop_index('ix_tasks_status', 'tasks')
    op.drop_index('ix_tasks_project_id', 'tasks')
    op.drop_table('tasks')
```

---

#### Step 3: Run Migrations

```bash
# Apply migrations to PostgreSQL
alembic upgrade head

# Verify tables created
psql -h postgres -U user -d weave_nn -c "\dt"
```

---

#### Step 4: Data Migration (SQLite → PostgreSQL)

```python
# scripts/migrate_sqlite_to_postgres.py
import sqlite3
import psycopg2
from shared.config import settings

def migrate_tasks():
    # Connect to SQLite
    sqlite_conn = sqlite3.connect('./data/weave-nn.db')
    sqlite_cursor = sqlite_conn.cursor()

    # Connect to PostgreSQL
    pg_conn = psycopg2.connect(settings.database_url)
    pg_cursor = pg_conn.cursor()

    # Read from SQLite
    sqlite_cursor.execute("SELECT * FROM tasks")
    tasks = sqlite_cursor.fetchall()

    # Write to PostgreSQL
    for task in tasks:
        pg_cursor.execute("""
            INSERT INTO tasks (id, project_id, title, status, due_date, completed, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, task)

    pg_conn.commit()
    print(f"Migrated {len(tasks)} tasks from SQLite to PostgreSQL")

if __name__ == "__main__":
    migrate_tasks()
```

---

### Testing Both Local and Split Versions

**Strategy**: Run **both versions in parallel** and compare results

```python
# tests/test_dual_deployment.py
import requests

def test_task_creation_consistency():
    """Test that old and new task services produce identical results"""

    # Create task via old service
    old_response = requests.post("http://localhost:8000/mcp/create_task", json={
        "title": "Test task",
        "project_id": "test-project"
    })

    # Create task via new service
    new_response = requests.post("http://localhost:8003/tasks", json={
        "title": "Test task",
        "project_id": "test-project"
    })

    # Assert responses are identical
    assert old_response.status_code == new_response.status_code
    assert old_response.json()["id"] == new_response.json()["id"]
```

---

## Phase 2: Kubernetes Migration (Months 4-6)

### Objective
Migrate extracted microservices from **Docker Compose** (single-machine) to **Kubernetes** (distributed cluster) with **high availability**, **auto-scaling**, and **zero-downtime deployments**.

### When to Introduce Kubernetes?

**Triggers**:
- Running 10+ client projects simultaneously
- Need for high availability (99.9% uptime)
- Auto-scaling based on load
- Multi-region deployment
- Team size > 5 developers (need isolated dev/staging/prod environments)

**Prerequisites**:
- All services extracted and running independently
- Database migrated to PostgreSQL (with replication)
- RabbitMQ cluster (3+ nodes)
- Monitoring and logging in place (Prometheus, Grafana, ELK)

---

### Infrastructure Required

#### 1. Kubernetes Cluster

**Options**:
- **Google Kubernetes Engine (GKE)** - Recommended for MVP
  - 3-node cluster (e2-standard-2: 2 vCPU, 8 GB RAM each)
  - Cost: ~$150/month

- **Amazon EKS** - Alternative
  - 3-node cluster (t3.medium: 2 vCPU, 4 GB RAM each)
  - Cost: ~$120/month

- **Self-Hosted (Kubeadm)** - Advanced users
  - 3 VMs (e2-standard-2 on GCP or t3.medium on AWS)
  - Cost: ~$100/month (+ management overhead)

**Recommended**: Start with **GKE** (easiest to manage)

---

#### 2. Persistent Storage

**StatefulSets** for:
- PostgreSQL (primary + 2 replicas)
- RabbitMQ (3-node cluster)
- Redis (master + 2 replicas)

**Persistent Volume Claims (PVCs)**:
```yaml
# postgres-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: standard-rwo  # GKE standard disk
```

---

#### 3. Ingress Controller

**Nginx Ingress** (recommended) or **Traefik**:
- TLS termination (Let's Encrypt)
- Load balancing
- Rate limiting
- Path-based routing

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: weave-nn-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - api.weave-nn.com
    secretName: weave-nn-tls
  rules:
  - host: api.weave-nn.com
    http:
      paths:
      - path: /tasks
        pathType: Prefix
        backend:
          service:
            name: task-service
            port:
              number: 8003
      - path: /files
        pathType: Prefix
        backend:
          service:
            name: file-service
            port:
              number: 8001
```

---

### Kubernetes Manifest Examples

#### Deployment: Task Service

```yaml
# k8s/task-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-service
  labels:
    app: task-service
spec:
  replicas: 3  # 3 replicas for HA
  selector:
    matchLabels:
      app: task-service
  template:
    metadata:
      labels:
        app: task-service
    spec:
      containers:
      - name: task-service
        image: gcr.io/your-project/task-service:v1.0.0
        ports:
        - containerPort: 8003
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: database-url
        - name: RABBITMQ_URL
          valueFrom:
            secretKeyRef:
              name: rabbitmq-secret
              key: rabbitmq-url
        - name: OBSIDIAN_API_KEY
          valueFrom:
            secretKeyRef:
              name: obsidian-secret
              key: api-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8003
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8003
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

#### Service: Task Service

```yaml
# k8s/task-service-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: task-service
spec:
  selector:
    app: task-service
  ports:
  - protocol: TCP
    port: 8003
    targetPort: 8003
  type: ClusterIP  # Internal service (accessed via Ingress)
```

---

#### StatefulSet: PostgreSQL Cluster

```yaml
# k8s/postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: postgres-password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 50Gi
```

---

### How to Run Hybrid (Local + K8s)?

**Use Case**: Developers work locally, production runs on K8s

**Strategy**: Use **Telepresence** for local-to-cluster connectivity

#### Setup Telepresence

```bash
# Install Telepresence
curl -fL https://app.getambassador.io/download/tel2/linux/amd64/latest/telepresence -o /usr/local/bin/telepresence
chmod +x /usr/local/bin/telepresence

# Connect local machine to K8s cluster
telepresence connect

# Route traffic from K8s service to local dev environment
telepresence intercept task-service --port 8003:8003
```

**Result**: Requests to `task-service` in K8s cluster are routed to `localhost:8003`

**Developer Workflow**:
1. Run microservice locally: `uvicorn main:app --reload`
2. Other services (in K8s) call local service transparently
3. Test changes without deploying to cluster

---

### Zero-Downtime Deployment Strategy

**Rolling Update**:
```yaml
# Deployment strategy
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1  # At most 1 pod down during update
      maxSurge: 1        # At most 1 extra pod during update
```

**Deployment Process**:
1. Deploy new version (v1.1.0)
2. K8s creates 1 new pod (v1.1.0) while keeping 3 old pods (v1.0.0)
3. Once new pod is ready, K8s terminates 1 old pod
4. Repeat until all 3 pods are v1.1.0
5. No downtime for users

---

## Refactoring Checklist

### Code Patterns for Easy Service Extraction

#### ✅ Interface Boundaries

**DO**: Define clear interfaces between services

```python
# shared/interfaces.py
from abc import ABC, abstractmethod

class TaskServiceInterface(ABC):
    @abstractmethod
    def create_task(self, task_data: dict) -> dict:
        pass

    @abstractmethod
    def get_task(self, task_id: str) -> dict:
        pass

    @abstractmethod
    def list_tasks(self, project_id: str) -> list:
        pass
```

**Implementation** (can swap between local and remote):
```python
# Local implementation (for Docker Compose)
class LocalTaskService(TaskServiceInterface):
    def create_task(self, task_data: dict) -> dict:
        # Direct database access
        return self.db.insert(task_data)

# Remote implementation (for Kubernetes)
class RemoteTaskService(TaskServiceInterface):
    def create_task(self, task_data: dict) -> dict:
        # HTTP call to microservice
        response = requests.post(f"{settings.task_service_url}/tasks", json=task_data)
        return response.json()
```

---

#### ✅ Dependency Injection

**DO**: Inject dependencies (makes testing and swapping implementations easy)

```python
# services/file_service/service.py
class FileService:
    def __init__(self, obsidian_client: ObsidianRESTClient, rabbitmq_client: RabbitMQClient):
        self.obsidian = obsidian_client
        self.rabbitmq = rabbitmq_client

    def create_note(self, path: str, content: str):
        # Use injected clients
        self.obsidian.create_note(path, content)
        self.rabbitmq.publish("vault.file.created", {"path": path})

# main.py
from shared.obsidian_client import ObsidianRESTClient
from shared.rabbitmq_client import RabbitMQClient
from services.file_service.service import FileService

# Inject dependencies
obsidian_client = ObsidianRESTClient(settings.obsidian_api_url, settings.obsidian_api_key)
rabbitmq_client = RabbitMQClient(settings.rabbitmq_url)
file_service = FileService(obsidian_client, rabbitmq_client)
```

---

#### ✅ Configuration Management

**DO**: Centralize all configuration

```python
# shared/config.py (supports both local and K8s)
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Service identity
    service_name: str = "file-service"

    # Database (can be SQLite or PostgreSQL)
    database_url: str = "sqlite:///./weave-nn.db"

    # RabbitMQ (can be local or cloud)
    rabbitmq_url: str = "amqp://localhost:5672"

    # Service URLs (for inter-service communication)
    task_service_url: str = "http://localhost:8003"  # Local
    # task_service_url: str = "http://task-service.default.svc.cluster.local:8003"  # K8s

    class Config:
        env_file = ".env"
```

---

### Database Migration Strategies

#### Strategy 1: Dual-Write Pattern (Zero Downtime)

**Challenge**: Migrate from SQLite to PostgreSQL without downtime

**Solution**: Write to both databases during migration

```python
# services/task_service/repository.py
class TaskRepository:
    def __init__(self, sqlite_db, postgres_db):
        self.sqlite_db = sqlite_db
        self.postgres_db = postgres_db
        self.dual_write = settings.DUAL_WRITE_MODE  # Enable via env var

    def create_task(self, task_data: dict):
        # Write to primary database (PostgreSQL)
        task = self.postgres_db.insert(task_data)

        # Dual-write to old database (SQLite) during migration
        if self.dual_write:
            try:
                self.sqlite_db.insert(task_data)
            except Exception as e:
                # Log error but don't fail request
                logger.error(f"Dual-write to SQLite failed: {e}")

        return task
```

**Migration Timeline**:
1. **Week 1**: Enable dual-write (write to both SQLite and PostgreSQL)
2. **Week 2**: Backfill historical data (SQLite → PostgreSQL)
3. **Week 3**: Verify data consistency (compare SQLite vs PostgreSQL)
4. **Week 4**: Disable dual-write, read from PostgreSQL only
5. **Week 5**: Remove SQLite database

---

#### Strategy 2: Blue-Green Deployment

**Challenge**: Test new database without affecting production

**Solution**: Run two identical environments (Blue = SQLite, Green = PostgreSQL)

```
Blue Environment (Production):
  - SQLite database
  - 100% traffic

Green Environment (Staging):
  - PostgreSQL database
  - 0% traffic (testing only)

Migration Steps:
1. Deploy Green environment with PostgreSQL
2. Route 10% traffic to Green (test)
3. Route 50% traffic to Green
4. Route 100% traffic to Green
5. Decommission Blue environment
```

---

## Risk Mitigation Strategies

### How to Avoid Breaking Changes?

#### 1. Backward-Compatible API Changes

**DO**: Add optional fields (don't change/remove existing fields)

```python
# Version 1 (old API)
@app.post("/tasks")
def create_task(title: str, project_id: str):
    return {"id": "123", "title": title, "project_id": project_id}

# Version 2 (new API - backward compatible)
@app.post("/tasks")
def create_task(title: str, project_id: str, due_date: Optional[str] = None, tags: List[str] = []):
    return {"id": "123", "title": title, "project_id": project_id, "due_date": due_date, "tags": tags}
```

**Result**: Old clients (not sending `due_date`, `tags`) still work

---

#### 2. API Versioning

**DO**: Version APIs (support multiple versions simultaneously)

```python
# routes/task_routes_v1.py
@app.post("/v1/tasks")
def create_task_v1(title: str, project_id: str):
    return {"id": "123", "title": title, "project_id": project_id}

# routes/task_routes_v2.py
@app.post("/v2/tasks")
def create_task_v2(task: TaskCreateV2):
    return {"id": "123", "title": task.title, "project_id": task.project_id, "due_date": task.due_date}
```

**Deprecation Strategy**:
- Deploy v2 API
- Add deprecation warning to v1 API response headers
- Give clients 6 months to migrate to v2
- Remove v1 after 6 months

---

### How to Test Migration Incrementally?

#### 1. Shadow Mode Testing

**Strategy**: Run new microservice in "shadow mode" (process requests but don't return responses)

```python
# api_gateway.py
@app.get("/tasks")
def list_tasks():
    # Production request (old monolith)
    production_response = old_task_service.list_tasks()

    # Shadow request (new microservice - for comparison)
    try:
        shadow_response = new_task_service.list_tasks()

        # Compare responses (log differences)
        if production_response != shadow_response:
            logger.warning(f"Response mismatch: prod={production_response}, shadow={shadow_response}")
    except Exception as e:
        logger.error(f"Shadow request failed: {e}")

    # Always return production response
    return production_response
```

**Benefits**:
- Test new microservice with real traffic
- No impact on users (shadow responses are discarded)
- Identify bugs before full migration

---

#### 2. Feature Flag Testing

**Strategy**: Use feature flags to enable/disable new microservice

```python
# shared/feature_flags.py
class FeatureFlags:
    @staticmethod
    def use_new_task_service(user_id: str) -> bool:
        """
        Gradually roll out new service:
        - 0%: All users use old service
        - 10%: 10% of users use new service (test)
        - 50%: Half use new service
        - 100%: All users use new service
        """
        # Use consistent hashing (same user always gets same service)
        user_hash = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        return (user_hash % 100) < settings.NEW_TASK_SERVICE_ROLLOUT_PERCENTAGE

# Usage
@app.get("/tasks")
def list_tasks(user_id: str):
    if FeatureFlags.use_new_task_service(user_id):
        return new_task_service.list_tasks()
    else:
        return old_task_service.list_tasks()
```

---

### Rollback Strategies

#### 1. Instant Rollback (Feature Flag)

**Fastest**: Change environment variable

```bash
# Rollback new service (0% traffic)
kubectl set env deployment/api-gateway NEW_TASK_SERVICE_ROLLOUT_PERCENTAGE=0

# Rollforward (100% traffic)
kubectl set env deployment/api-gateway NEW_TASK_SERVICE_ROLLOUT_PERCENTAGE=100
```

---

#### 2. Kubernetes Rollback

**Fast**: Rollback deployment to previous version

```bash
# View deployment history
kubectl rollout history deployment/task-service

# Rollback to previous version
kubectl rollout undo deployment/task-service

# Rollback to specific version
kubectl rollout undo deployment/task-service --to-revision=3
```

---

#### 3. Database Rollback (if schema changed)

**Slow**: Restore database from backup

```bash
# Restore PostgreSQL from backup
kubectl exec -it postgres-0 -- pg_restore -U user -d weave_nn /backups/backup-2025-10-22.dump
```

**Prevention**: Use **Alembic** for reversible migrations

```python
# alembic/versions/002_add_tags_column.py
def upgrade():
    op.add_column('tasks', sa.Column('tags', sa.JSON(), nullable=True))

def downgrade():
    op.drop_column('tasks', 'tags')
```

```bash
# Rollback migration
alembic downgrade -1
```

---

## Code Examples

### Example 1: Event-Driven Communication

```python
# Publisher (File Watcher)
from shared.rabbitmq_client import RabbitMQClient
from shared.models import VaultFileEvent
from datetime import datetime

rabbitmq = RabbitMQClient()

event = VaultFileEvent(
    event_type="vault.file.created",
    file_path="concepts/knowledge-graph.md",
    vault_id="weave-nn",
    frontmatter={"type": "concept", "status": "active"},
    timestamp=datetime.utcnow()
)

rabbitmq.publish("vault.file.created", event.dict())
```

```python
# Consumer (MCP Sync Service)
from shared.rabbitmq_client import RabbitMQClient
from services.mcp_sync_service.service import MCPSyncService

rabbitmq = RabbitMQClient()
mcp_sync = MCPSyncService()

def handle_vault_file_created(message):
    event = VaultFileEvent(**message)
    mcp_sync.sync_file(event.file_path, event.frontmatter)

rabbitmq.subscribe("mcp_sync", handle_vault_file_created)
```

---

### Example 2: Service Interface Abstraction

```python
# shared/interfaces.py
from abc import ABC, abstractmethod
from typing import Optional, List, Dict

class FileServiceInterface(ABC):
    @abstractmethod
    def create_note(self, path: str, content: str, frontmatter: Optional[Dict] = None) -> Dict:
        pass

    @abstractmethod
    def read_note(self, path: str) -> Dict:
        pass

    @abstractmethod
    def list_notes(self, pattern: Optional[str] = None) -> List[Dict]:
        pass
```

```python
# services/file_service/implementations/local.py (Docker Compose)
from shared.interfaces import FileServiceInterface
from shared.obsidian_client import ObsidianRESTClient

class LocalFileService(FileServiceInterface):
    def __init__(self, obsidian_client: ObsidianRESTClient):
        self.obsidian = obsidian_client

    def create_note(self, path: str, content: str, frontmatter: Optional[Dict] = None) -> Dict:
        return self.obsidian.create_note(path, content, frontmatter)

    def read_note(self, path: str) -> Dict:
        return self.obsidian.read_note(path)

    def list_notes(self, pattern: Optional[str] = None) -> List[Dict]:
        return self.obsidian.list_notes(pattern)
```

```python
# services/file_service/implementations/remote.py (Kubernetes)
from shared.interfaces import FileServiceInterface
import requests

class RemoteFileService(FileServiceInterface):
    def __init__(self, service_url: str):
        self.service_url = service_url

    def create_note(self, path: str, content: str, frontmatter: Optional[Dict] = None) -> Dict:
        response = requests.post(f"{self.service_url}/files", json={
            "path": path,
            "content": content,
            "frontmatter": frontmatter
        })
        response.raise_for_status()
        return response.json()

    def read_note(self, path: str) -> Dict:
        response = requests.get(f"{self.service_url}/files/{path}")
        response.raise_for_status()
        return response.json()

    def list_notes(self, pattern: Optional[str] = None) -> List[Dict]:
        response = requests.get(f"{self.service_url}/files", params={"pattern": pattern})
        response.raise_for_status()
        return response.json()
```

```python
# main.py (dependency injection)
from shared.config import settings
from services.file_service.implementations.local import LocalFileService
from services.file_service.implementations.remote import RemoteFileService

# Choose implementation based on environment
if settings.deployment_mode == "local":
    file_service = LocalFileService(obsidian_client)
elif settings.deployment_mode == "kubernetes":
    file_service = RemoteFileService(settings.file_service_url)
```

---

### Example 3: Dual-Write Database Migration

```python
# services/task_service/repository.py
from sqlalchemy.orm import Session
from shared.config import settings
import logging

logger = logging.getLogger(__name__)

class TaskRepository:
    def __init__(self, sqlite_session: Session, postgres_session: Session):
        self.sqlite_session = sqlite_session
        self.postgres_session = postgres_session

    def create_task(self, task_data: dict) -> dict:
        # Primary write: PostgreSQL (new database)
        task = Task(**task_data)
        self.postgres_session.add(task)
        self.postgres_session.commit()

        # Dual-write: SQLite (old database) - only during migration
        if settings.DUAL_WRITE_ENABLED:
            try:
                task_sqlite = TaskSQLite(**task_data)
                self.sqlite_session.add(task_sqlite)
                self.sqlite_session.commit()
                logger.info(f"Dual-write succeeded for task {task.id}")
            except Exception as e:
                # Log error but don't fail request (PostgreSQL is source of truth)
                logger.error(f"Dual-write to SQLite failed for task {task.id}: {e}")

        return task.to_dict()

    def get_task(self, task_id: str) -> dict:
        # Read from PostgreSQL only (SQLite is deprecated)
        task = self.postgres_session.query(Task).filter(Task.id == task_id).first()
        return task.to_dict() if task else None
```

---

## Summary: Migration Timeline

| Phase | Duration | Key Milestones | Risk Level |
|-------|----------|----------------|------------|
| **Phase 0: Local MVP** | Weeks 1-2 | • Docker Compose deployment<br>• Event-driven architecture<br>• Service boundaries defined | **Low** |
| **Phase 1: Service Extraction** | Months 2-3 | • N8N, Git, Task, File, MCP Sync, Agent Tasks extracted<br>• SQLite → PostgreSQL migration<br>• Feature flag rollout (10% → 100%) | **Medium** |
| **Phase 2: Kubernetes Migration** | Months 4-6 | • K8s cluster provisioned<br>• StatefulSets (PostgreSQL, RabbitMQ)<br>• Ingress + TLS<br>• Auto-scaling + monitoring | **High** |

---

## Conclusion

The **Obsidian-first, event-driven architecture** chosen for the MVP makes microservices migration **significantly easier** than traditional monolithic architectures. By following the patterns outlined in this document—**service boundaries from day 1**, **event-driven communication**, **database abstraction**, and **incremental rollout**—the migration can be accomplished with **minimal risk** and **zero downtime**.

**Key Success Factors**:
1. **Strangler Fig Pattern** - Gradual migration, not big-bang rewrite
2. **Feature Flags** - Test new services with small % of traffic
3. **Dual-Write Pattern** - Zero-downtime database migration
4. **Interface Abstraction** - Swap implementations (local ↔ remote) transparently
5. **Comprehensive Monitoring** - Detect issues early with Prometheus/Grafana

---

**Document Status**: ✅ **Complete**
**Next Steps**: Store in Claude-Flow memory for agent coordination
**Memory Key**: `swarm/analyst/migration-path`
