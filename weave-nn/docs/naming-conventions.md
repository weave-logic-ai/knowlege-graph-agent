---
title: Weave-NN Naming Conventions
type: architecture
status: in-progress
tags:
  - type/architecture
  - status/in-progress
priority: critical
visual:
  icon: "\U0001F4DA"
  color: '#50E3C2'
  cssclasses:
    - architecture-document
updated: '2025-10-29T04:55:05.488Z'
keywords:
  - general principles
  - python code
  - files and modules
  - classes
  - functions and methods
  - variables
  - constants
  - type hints
  - services and packages
  - service names
---
# Weave-NN Naming Conventions

**Last Updated**: 2025-10-23
**Purpose**: Standardize naming across services, packages, and infrastructure

---

## General Principles

1. **Consistency**: Use the same naming pattern throughout the codebase
2. **Clarity**: Names should be self-documenting and unambiguous
3. **Convention Over Configuration**: Follow established Python and DevOps conventions
4. **Searchability**: Names should be easy to grep and search

---

## Python Code

### Files and Modules
- **Pattern**: `snake_case`
- **Examples**:
  - `rule_executor.py`
  - `knowledge_graph_builder.py`
  - `rabbitmq_consumer.py`
- **Avoid**: CamelCase for file names, single-letter names

### Classes
- **Pattern**: `PascalCase`
- **Examples**:
  - `RuleExecutor`
  - `KnowledgeGraphBuilder`
  - `RabbitMQConsumer`
- **Interface Classes**: Suffix with `Interface` or `ABC`
  - `RuleExecutorInterface`
  - `BaseConsumer`

### Functions and Methods
- **Pattern**: `snake_case`
- **Examples**:
  - `execute_rule()`
  - `build_knowledge_graph()`
  - `consume_message()`
- **Boolean Functions**: Prefix with `is_`, `has_`, `can_`
  - `is_valid()`
  - `has_permission()`
  - `can_execute()`

### Variables
- **Pattern**: `snake_case`
- **Examples**:
  - `rule_config`
  - `knowledge_graph`
  - `message_queue`
- **Private Variables**: Prefix with `_`
  - `_internal_state`
  - `_cache`

### Constants
- **Pattern**: `UPPER_SNAKE_CASE`
- **Examples**:
  - `MAX_RETRIES = 3`
  - `DEFAULT_TIMEOUT = 30`
  - `RABBITMQ_EXCHANGE = "weave-nn.events"`
- **Module-Level**: Define at top of file

### Type Hints
- **Pattern**: Use standard library and `typing` module
- **Examples**:
  ```python
  from typing import List, Dict, Optional, Union

  def process_rules(rules: List[Rule]) -> Dict[str, Any]:
      pass

  def get_config(key: str) -> Optional[str]:
      pass
  ```

---

## Services and Packages

### Service Names
- **Pattern**: `<domain>-<responsibility>`
- **Case**: kebab-case (lowercase with hyphens)
- **Examples**:
  - `api-gateway`
  - `knowledge-extractor`
  - `rule-engine`
  - `file-watcher`
  - `ai-agent-orchestrator`
- **Avoid**: Abbreviations, single words without context

### Package Names
- **Pattern**: `weave-<domain>`
- **Case**: kebab-case
- **Examples**:
  - `weave-common`
  - `weave-messaging`
  - `weave-db`
  - `weave-graph`
- **Python Import Name**: `weave_<domain>`
  ```python
  from weave_common import logging
  from weave_messaging import RabbitMQConsumer
  ```

### Directory Names
- **Pattern**: `snake_case` or `kebab-case` (be consistent)
- **Examples**:
  - `consumers/`
  - `publishers/`
  - `processors/`
  - `api-routes/`
- **Avoid**: CamelCase, spaces, special characters

---

## Environment Variables

### General Format
- **Pattern**: `WEAVE_<SERVICE>_<CONFIG>`
- **Case**: UPPER_SNAKE_CASE
- **Examples**:
  - `WEAVE_API_PORT=8000`
  - `WEAVE_RABBITMQ_URL=amqp://localhost:5672/`
  - `WEAVE_DB_HOST=localhost`
  - `WEAVE_LOG_LEVEL=INFO`

### Service-Specific Variables
- **Pattern**: `WEAVE_<SERVICE_NAME>_<CONFIG>`
- **Examples**:
  - `WEAVE_RULE_ENGINE_MAX_WORKERS=5`
  - `WEAVE_FILE_WATCHER_POLL_INTERVAL=1`
  - `WEAVE_API_GATEWAY_TIMEOUT=30`

### Feature Flags
- **Pattern**: `WEAVE_FEATURE_<FEATURE_NAME>`
- **Examples**:
  - `WEAVE_FEATURE_AI_AGENTS=true`
  - `WEAVE_FEATURE_TEMPORAL_QUERIES=true`
  - `WEAVE_FEATURE_WEBHOOKS=false`

### Secrets
- **Pattern**: `WEAVE_SECRET_<SECRET_NAME>`
- **Examples**:
  - `WEAVE_SECRET_DB_PASSWORD`
  - `WEAVE_SECRET_API_KEY`
  - `WEAVE_SECRET_JWT_SECRET`
- **Storage**: Use environment-specific secret management (Kubernetes Secrets, GCP Secret Manager)

---

## Docker and Containers

### Docker Images
- **Pattern**: `weave-nn/<service-name>:<tag>`
- **Examples**:
  - `weave-nn/api-gateway:latest`
  - `weave-nn/rule-engine:v1.2.3`
  - `weave-nn/knowledge-extractor:dev`
- **Tags**:
  - `latest` - Latest stable version
  - `v1.2.3` - Semantic versioning
  - `dev` - Development builds
  - `<git-commit-sha>` - Specific commit

### Docker Compose Services
- **Pattern**: Match service directory name
- **Examples**:
  ```yaml
  services:
    api-gateway:
      image: weave-nn/api-gateway:latest

    rule-engine:
      image: weave-nn/rule-engine:latest

    rabbitmq:
      image: rabbitmq:3.12-management
  ```

### Volume Names
- **Pattern**: `<service>-<data-type>`
- **Examples**:
  - `postgres-data`
  - `rabbitmq-data`
  - `n8n-data`

---

## Kubernetes Resources

### Resource Names
- **Pattern**: `<service-name>-<resource-type>`
- **Case**: kebab-case
- **Examples**:
  - `api-gateway-deployment`
  - `rule-engine-service`
  - `rabbitmq-statefulset`
  - `postgres-pvc`

### Namespace
- **Pattern**: `weave-nn-<environment>`
- **Examples**:
  - `weave-nn-dev`
  - `weave-nn-staging`
  - `weave-nn-production`

### Labels
- **Standard Labels**:
  ```yaml
  labels:
    app.kubernetes.io/name: api-gateway
    app.kubernetes.io/instance: weave-nn
    app.kubernetes.io/version: "1.2.3"
    app.kubernetes.io/component: backend
    app.kubernetes.io/part-of: weave-nn
    app.kubernetes.io/managed-by: helm
    environment: production
  ```

### Annotations
- **Pattern**: `<domain>/<key>`
- **Examples**:
  ```yaml
  annotations:
    weave-nn.io/description: "API Gateway service"
    weave-nn.io/owner: "backend-team"
    prometheus.io/scrape: "true"
    prometheus.io/port: "8000"
  ```

---

## RabbitMQ

### Exchange Names
- **Pattern**: `weave-nn.<domain>`
- **Examples**:
  - `weave-nn.events` (topic exchange)
  - `weave-nn.tasks` (topic exchange)
  - `weave-nn.deadletter` (fanout exchange)

### Queue Names
- **Pattern**: `<service-name>.<event-type>`
- **Examples**:
  - `rule-engine.vault-events`
  - `knowledge-extractor.task-complete`
  - `notification-service.user-notifications`

### Routing Keys
- **Pattern**: `<domain>.<event-type>.<action>`
- **Examples**:
  - `vault.file.created`
  - `vault.file.updated`
  - `vault.file.deleted`
  - `task.workflow.completed`
  - `agent.analysis.requested`

### Message Properties
- **Pattern**: snake_case for message body fields
- **Examples**:
  ```json
  {
    "event_type": "file.created",
    "file_path": "/vault/project.md",
    "timestamp": "2025-10-23T10:00:00Z",
    "metadata": {
      "user_id": "user-123",
      "project_id": "project-456"
    }
  }
  ```

---

## Database

### Table Names
- **Pattern**: `snake_case`, plural nouns
- **Examples**:
  - `knowledge_nodes`
  - `graph_edges`
  - `user_sessions`
  - `rule_executions`

### Column Names
- **Pattern**: `snake_case`
- **Examples**:
  - `node_id`
  - `created_at`
  - `updated_at`
  - `is_active`
- **Foreign Keys**: `<table>_id`
  - `user_id`
  - `project_id`
  - `node_id`

### Index Names
- **Pattern**: `idx_<table>_<columns>`
- **Examples**:
  - `idx_knowledge_nodes_created_at`
  - `idx_graph_edges_source_target`
  - `idx_users_email`

### Migration Files
- **Pattern**: `<timestamp>_<description>.sql` or `<version>_<description>.py`
- **Examples**:
  - `20251023_create_knowledge_nodes_table.sql`
  - `20251023_add_temporal_columns.sql`
  - Alembic: `2025_10_23_1234_create_knowledge_nodes_table.py`

---

## API Endpoints

### REST API Routes
- **Pattern**: `/<resource>/<action>` or `/<resource>/{id}`
- **Case**: kebab-case
- **Examples**:
  - `GET /api/v1/knowledge-graph/nodes`
  - `POST /api/v1/knowledge-graph/nodes`
  - `GET /api/v1/knowledge-graph/nodes/{node_id}`
  - `PUT /api/v1/knowledge-graph/nodes/{node_id}`
  - `DELETE /api/v1/knowledge-graph/nodes/{node_id}`
  - `POST /api/v1/tasks/execute`

### Query Parameters
- **Pattern**: `snake_case`
- **Examples**:
  - `?page=1&page_size=20`
  - `?filter_by=created_at&order=desc`
  - `?include_deleted=false`

### Request/Response Bodies
- **Pattern**: snake_case for JSON keys
- **Examples**:
  ```json
  {
    "node_id": "node-123",
    "node_type": "document",
    "created_at": "2025-10-23T10:00:00Z",
    "metadata": {
      "author": "user-456",
      "tags": ["architecture", "backend"]
    }
  }
  ```

---

## MCP Servers

### MCP Server Names
- **Pattern**: `<domain>-mcp`
- **Examples**:
  - `knowledge-graph-mcp`
  - `ai-context-mcp`
  - `task-orchestrator-mcp`

### MCP Tool Names
- **Pattern**: `<verb>_<noun>`
- **Case**: snake_case
- **Examples**:
  - `create_node`
  - `query_graph`
  - `execute_task`
  - `get_context`

### MCP Resource URIs
- **Pattern**: `weave-nn://<resource-type>/<resource-id>`
- **Examples**:
  - `weave-nn://node/node-123`
  - `weave-nn://graph/project-456`
  - `weave-nn://task/task-789`

---

## Git

### Branch Names
- **Pattern**: `<type>/<description>`
- **Case**: kebab-case
- **Types**: `feature`, `bugfix`, `hotfix`, `release`, `docs`
- **Examples**:
  - `feature/event-driven-architecture`
  - `bugfix/rule-engine-timeout`
  - `hotfix/critical-security-patch`
  - `release/v1.2.3`
  - `docs/api-documentation`

### Commit Messages
- **Pattern**: `<type>(<scope>): <description>`
- **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Examples**:
  - `feat(api-gateway): add authentication middleware`
  - `fix(rule-engine): handle timeout errors gracefully`
  - `docs(README): update local setup instructions`
  - `refactor(messaging): extract common consumer logic`
  - `test(knowledge-extractor): add integration tests`

### Tags
- **Pattern**: `v<major>.<minor>.<patch>` (Semantic Versioning)
- **Examples**:
  - `v1.0.0` - Major release
  - `v1.1.0` - Minor feature release
  - `v1.1.1` - Patch release

---

## Documentation

### File Names
- **Pattern**: `kebab-case.md`
- **Examples**:
  - `architecture-overview.md`
  - `api-documentation.md`
  - `local-setup-guide.md`
  - `deployment-runbook.md`

### Architecture Decision Records (ADRs)
- **Pattern**: `<number>-<description>.md`
- **Examples**:
  - `001-event-driven-architecture.md`
  - `002-rabbitmq-vs-kafka.md`
  - `003-postgresql-vs-neo4j.md`

### Diagrams
- **Pattern**: `<description>-diagram.png` or `.mmd` for Mermaid
- **Examples**:
  - `system-architecture-diagram.png`
  - `data-flow-diagram.mmd`
  - `service-interaction-diagram.png`

---

## Testing

### Test Files
- **Pattern**: `test_<module_name>.py`
- **Examples**:
  - `test_rule_executor.py`
  - `test_rabbitmq_consumer.py`
  - `test_knowledge_graph_builder.py`

### Test Functions
- **Pattern**: `test_<function>_<scenario>`
- **Examples**:
  ```python
  def test_execute_rule_success():
      pass

  def test_execute_rule_with_invalid_config():
      pass

  def test_consume_message_handles_timeout():
      pass
  ```

### Test Fixtures
- **Pattern**: `<resource>_fixture`
- **Examples**:
  ```python
  @pytest.fixture
  def sample_rule_config():
      return {"rule_type": "auto_tagging"}

  @pytest.fixture
  def mock_rabbitmq_connection():
      return MagicMock()
  ```

---

## Configuration Files

### YAML Files
- **Pattern**: `kebab-case.yaml` or `snake_case.yaml`
- **Examples**:
  - `docker-compose.yml`
  - `kubernetes-deployment.yaml`
  - `auto-tagging-rules.yaml`
  - `.github/workflows/ci-cd.yaml`

### JSON Files
- **Pattern**: `kebab-case.json` or `snake_case.json`
- **Examples**:
  - `package.json`
  - `tsconfig.json`
  - `rabbitmq-definitions.json`
  - `grafana-dashboard.json`

---

## Logging

### Log Levels
- **Pattern**: Standard Python logging levels
- **Levels**: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`
- **Usage**:
  - `DEBUG` - Detailed debugging information
  - `INFO` - General informational messages
  - `WARNING` - Warning messages (potential issues)
  - `ERROR` - Error messages (recoverable errors)
  - `CRITICAL` - Critical errors (system failure)

### Log Format
- **Pattern**: Structured JSON logs
- **Example**:
  ```json
  {
    "timestamp": "2025-10-23T10:00:00Z",
    "level": "INFO",
    "service": "rule-engine",
    "message": "Rule executed successfully",
    "context": {
      "rule_id": "rule-123",
      "execution_time_ms": 45,
      "node_id": "node-456"
    }
  }
  ```

---

## Summary

By following these naming conventions, we ensure:

1. **Consistency**: All developers use the same naming patterns
2. **Readability**: Code is self-documenting and easy to understand
3. **Searchability**: Names are easy to grep, search, and refactor
4. **Maintainability**: Clear structure reduces cognitive load
5. **Tooling Compatibility**: Works well with linters, formatters, and IDEs

**Next Steps**:
1. Review naming conventions with the team
2. Configure linters (flake8, pylint, black) to enforce conventions
3. Update existing code to match conventions (gradual migration)
4. Document exceptions and edge cases as they arise

---

**Created**: 2025-10-23
**Backend Developer**: System Architecture Team
**Version**: 1.0
