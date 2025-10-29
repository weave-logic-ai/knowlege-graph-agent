---
title: Weave-NN Monorepo Folder Structure
type: architecture
status: in-progress
tags:
  - type/architecture
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4DA"
  color: '#50E3C2'
  cssclasses:
    - architecture-document
updated: '2025-10-29T04:55:05.482Z'
keywords:
  - overview
  - root directory structure
  - detailed structure
  - 1. `/services/` - microservices
  - 2. `/packages/` - shared libraries
  - 3. `/infrastructure/` - deployment and configuration
  - 4. `/tools/` - cli tools and development utilities
  - 5. `/docs/` - project-wide documentation
  - 6. `/tests/` - integration and e2e tests
  - 7. `/scripts/` - utility scripts
---
# Weave-NN Monorepo Folder Structure

**Architecture Reference**: Multi-Project AI Platform with Event-Driven Microservices
**Technology Stack**: Python (FastAPI), RabbitMQ, PostgreSQL, Kubernetes, Docker, MCP Servers
**Last Updated**: 2025-10-23

## Overview

This monorepo structure supports a scalable, event-driven architecture for the Weave-NN multi-project AI development platform. The structure emphasizes:

- **Service Isolation**: Each microservice is independently deployable
- **Shared Libraries**: Common code is reusable across services
- **Infrastructure as Code**: Kubernetes manifests, Docker configs, and deployment scripts
- **Development Velocity**: Clear separation of concerns with logical organization
- **Testing & CI/CD**: Dedicated testing infrastructure and pipeline configurations

---

## Root Directory Structure

```
weave-nn/
├── .github/                    # GitHub workflows, issue templates, PR templates
├── .vscode/                    # VSCode workspace settings (optional)
├── docs/                       # Project-wide documentation
├── scripts/                    # Utility scripts (setup, deployment, migrations)
├── infrastructure/             # Kubernetes, Docker, Terraform, deployment configs
├── services/                   # All microservices (FastAPI, consumers, publishers)
├── packages/                   # Shared libraries and utilities
├── tools/                      # CLI tools, development utilities
├── tests/                      # Integration tests, E2E tests (cross-service)
├── .dockerignore               # Docker build exclusions
├── .gitignore                  # Git exclusions
├── docker-compose.yml          # Local development orchestration
├── docker-compose.prod.yml     # Production-like local testing
├── Makefile                    # Common tasks (build, test, deploy)
├── README.md                   # Project overview and quick start
├── requirements.txt            # Root-level Python dependencies (for tooling)
└── pyproject.toml              # Monorepo Python configuration
```

---

## Detailed Structure

### 1. `/services/` - Microservices

All independent services that form the platform. Each service follows a consistent internal structure.

```
services/
├── api-gateway/                # Main API gateway (FastAPI)
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI application entry point
│   │   ├── config.py           # Service configuration
│   │   ├── routes/             # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── knowledge_graph.py
│   │   │   └── tasks.py
│   │   ├── middleware/         # Custom middleware (logging, auth)
│   │   ├── models/             # Pydantic models for request/response
│   │   └── utils/              # Service-specific utilities
│   ├── tests/                  # Unit tests for this service
│   │   ├── __init__.py
│   │   ├── test_routes.py
│   │   └── test_middleware.py
│   ├── Dockerfile
│   ├── requirements.txt        # Service-specific dependencies
│   ├── pyproject.toml
│   └── README.md
│
├── knowledge-extractor/        # Knowledge extraction workflow service
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py             # Service entry point
│   │   ├── consumers/          # RabbitMQ message consumers
│   │   │   ├── __init__.py
│   │   │   ├── task_complete_consumer.py
│   │   │   └── file_change_consumer.py
│   │   ├── processors/         # Business logic for extraction
│   │   │   ├── __init__.py
│   │   │   ├── artifact_gatherer.py
│   │   │   ├── ai_analyzer.py
│   │   │   └── deduplication.py
│   │   ├── publishers/         # RabbitMQ message publishers
│   │   │   ├── __init__.py
│   │   │   └── extraction_complete_publisher.py
│   │   └── models/
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── project-seeder/             # Project seeding and deployment service
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── consumers/
│   │   │   ├── project_new_consumer.py
│   │   │   └── project_refresh_consumer.py
│   │   ├── processors/
│   │   │   ├── requirements_analyzer.py
│   │   │   ├── vector_db_query.py
│   │   │   └── knowledge_graph_initializer.py
│   │   └── publishers/
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── rule-engine/                # Agent automation rule engine
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── consumers/
│   │   │   └── vault_events_consumer.py
│   │   ├── engine/             # Rule execution engine
│   │   │   ├── __init__.py
│   │   │   ├── rule_loader.py
│   │   │   ├── rule_executor.py
│   │   │   └── rule_validator.py
│   │   ├── rules/              # YAML rule definitions
│   │   │   ├── auto_tagging.yaml
│   │   │   ├── auto_linking.yaml
│   │   │   └── property_validation.yaml
│   │   └── integrations/
│   │       └── obsidian_api_client.py
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── file-watcher/               # Obsidian vault file monitoring service
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── watcher.py          # Watchdog integration
│   │   ├── publishers/
│   │   │   └── file_event_publisher.py
│   │   └── models/
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── ai-agent-orchestrator/      # AI agent coordination service
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── agents/             # Agent implementations
│   │   │   ├── developer_agent.py
│   │   │   ├── review_agent.py
│   │   │   └── documentation_agent.py
│   │   ├── orchestration/      # Agent workflow coordination
│   │   └── skill_trees/        # Agent skill and XP management
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── notification-service/       # User notifications (Slack, email)
│   ├── src/
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
├── git-sync-service/           # Automatic Git commit and push service
│   ├── src/
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md
│
└── mcp-servers/                # MCP server implementations
    ├── knowledge-graph-mcp/    # Knowledge graph MCP server
    │   ├── src/
    │   ├── tests/
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── README.md
    │
    └── ai-context-mcp/         # AI context provider MCP server
        ├── src/
        ├── tests/
        ├── Dockerfile
        ├── requirements.txt
        └── README.md
```

**Service Design Principles**:
- **Consistent Structure**: All services follow the same directory layout
- **Independence**: Each service has its own Dockerfile, requirements.txt, tests
- **Event-Driven**: Services communicate via RabbitMQ (consumers/publishers)
- **Testability**: Unit tests colocated with service code

---

### 2. `/packages/` - Shared Libraries

Reusable Python packages shared across multiple services.

```
packages/
├── weave-common/               # Common utilities and base classes
│   ├── src/
│   │   ├── weave_common/
│   │   │   ├── __init__.py
│   │   │   ├── logging.py      # Centralized logging configuration
│   │   │   ├── config.py       # Shared configuration management
│   │   │   ├── exceptions.py   # Custom exception classes
│   │   │   └── utils.py        # General utilities
│   ├── tests/
│   ├── pyproject.toml
│   └── README.md
│
├── weave-messaging/            # RabbitMQ client abstractions
│   ├── src/
│   │   ├── weave_messaging/
│   │   │   ├── __init__.py
│   │   │   ├── consumer.py     # Base consumer class
│   │   │   ├── publisher.py    # Base publisher class
│   │   │   ├── connection.py   # Connection management
│   │   │   └── schemas.py      # Message schemas (Pydantic)
│   ├── tests/
│   ├── pyproject.toml
│   └── README.md
│
├── weave-db/                   # Database access layer
│   ├── src/
│   │   ├── weave_db/
│   │   │   ├── __init__.py
│   │   │   ├── connection.py   # PostgreSQL connection pool
│   │   │   ├── models.py       # SQLAlchemy models
│   │   │   ├── repositories/   # Data access patterns
│   │   │   │   ├── node_repository.py
│   │   │   │   └── edge_repository.py
│   │   │   └── migrations/     # Alembic migrations
│   ├── tests/
│   ├── pyproject.toml
│   └── README.md
│
├── weave-graph/                # Knowledge graph operations
│   ├── src/
│   │   ├── weave_graph/
│   │   │   ├── __init__.py
│   │   │   ├── graph_builder.py
│   │   │   ├── graph_query.py
│   │   │   ├── temporal_query.py
│   │   │   └── vector_search.py
│   ├── tests/
│   ├── pyproject.toml
│   └── README.md
│
└── weave-mcp/                  # MCP protocol implementations
    ├── src/
    │   ├── weave_mcp/
    │   │   ├── __init__.py
    │   │   ├── server.py       # MCP server base class
    │   │   ├── tools.py        # Tool definitions
    │   │   └── handlers.py     # Request handlers
    ├── tests/
    ├── pyproject.toml
    └── README.md
```

**Package Design Principles**:
- **Reusability**: Avoid code duplication across services
- **Versioning**: Each package can be versioned independently
- **Testing**: Comprehensive unit tests for shared code
- **Documentation**: Clear API documentation for consumers

---

### 3. `/infrastructure/` - Deployment and Configuration

All infrastructure-as-code, container configurations, and deployment manifests.

```
infrastructure/
├── kubernetes/                 # Kubernetes manifests
│   ├── base/                   # Base configurations (Kustomize)
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secrets.yaml        # Sealed secrets for production
│   │   └── kustomization.yaml
│   │
│   ├── services/               # Service-specific manifests
│   │   ├── api-gateway/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   ├── ingress.yaml
│   │   │   └── hpa.yaml        # Horizontal Pod Autoscaler
│   │   ├── knowledge-extractor/
│   │   │   ├── deployment.yaml
│   │   │   └── service.yaml
│   │   └── rule-engine/
│   │       ├── deployment.yaml
│   │       └── configmap.yaml  # Rule configurations
│   │
│   ├── dependencies/           # Third-party services
│   │   ├── rabbitmq/
│   │   │   ├── statefulset.yaml
│   │   │   ├── service.yaml
│   │   │   └── pvc.yaml        # Persistent volume claim
│   │   ├── postgresql/
│   │   │   ├── statefulset.yaml
│   │   │   ├── service.yaml
│   │   │   └── pvc.yaml
│   │   └── n8n/
│   │       ├── deployment.yaml
│   │       └── service.yaml
│   │
│   └── overlays/               # Environment-specific overlays
│       ├── dev/
│       │   ├── kustomization.yaml
│       │   └── patches/
│       ├── staging/
│       │   ├── kustomization.yaml
│       │   └── patches/
│       └── production/
│           ├── kustomization.yaml
│           └── patches/
│
├── docker/                     # Docker configurations
│   ├── base/                   # Base images
│   │   ├── python-base.Dockerfile
│   │   └── node-base.Dockerfile
│   │
│   └── compose/                # Docker Compose files
│       ├── docker-compose.dev.yml
│       ├── docker-compose.test.yml
│       └── docker-compose.prod.yml
│
├── terraform/                  # Infrastructure provisioning (GCP)
│   ├── modules/
│   │   ├── gke-cluster/
│   │   ├── cloud-sql/
│   │   └── networking/
│   ├── environments/
│   │   ├── dev/
│   │   ├── staging/
│   │   └── production/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
│
├── helm/                       # Helm charts (optional)
│   └── weave-nn/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-dev.yaml
│       ├── values-prod.yaml
│       └── templates/
│
├── configs/                    # Configuration files
│   ├── rabbitmq/
│   │   ├── rabbitmq.conf
│   │   └── definitions.json    # Queue/exchange definitions
│   ├── n8n/
│   │   └── workflows/
│   └── postgresql/
│       └── init.sql
│
└── scripts/                    # Infrastructure scripts
    ├── setup-local.sh          # Local development setup
    ├── deploy-k8s.sh           # Kubernetes deployment
    ├── backup-db.sh            # Database backup
    └── migrate-db.sh           # Database migrations
```

**Infrastructure Design Principles**:
- **Environment Parity**: Dev/staging/prod configs share base with overlays
- **GitOps Ready**: All manifests are version-controlled and declarative
- **Security**: Secrets management via Sealed Secrets or external stores
- **Scalability**: HPA configurations for auto-scaling services

---

### 4. `/tools/` - CLI Tools and Development Utilities

```
tools/
├── cli/                        # Command-line interface tools
│   ├── weave-cli/              # Main CLI tool
│   │   ├── src/
│   │   │   ├── __init__.py
│   │   │   ├── main.py         # Click/Typer CLI entry point
│   │   │   ├── commands/
│   │   │   │   ├── project.py  # Project management commands
│   │   │   │   ├── graph.py    # Graph operations
│   │   │   │   └── deploy.py   # Deployment commands
│   │   │   └── utils/
│   │   ├── tests/
│   │   ├── setup.py
│   │   └── README.md
│   │
│   └── mcp-cli/                # MCP server management CLI
│       ├── src/
│       ├── tests/
│       └── README.md
│
├── dev-scripts/                # Development helper scripts
│   ├── generate-mocks.py       # Generate test mocks
│   ├── seed-data.py            # Seed development database
│   ├── benchmark.py            # Performance benchmarking
│   └── validate-config.py      # Validate YAML/JSON configs
│
└── monitoring/                 # Monitoring and observability tools
    ├── dashboards/             # Grafana dashboard definitions
    │   ├── service-metrics.json
    │   └── rabbitmq-metrics.json
    └── alerts/                 # Alertmanager rules
        └── service-alerts.yaml
```

**Tools Design Principles**:
- **Developer Experience**: CLI tools streamline common workflows
- **Automation**: Scripts reduce manual, error-prone tasks
- **Observability**: Pre-built dashboards and alerts for quick setup

---

### 5. `/docs/` - Project-Wide Documentation

```
docs/
├── architecture/               # Architecture documentation
│   ├── overview.md
│   ├── event-driven-design.md
│   ├── service-interactions.md
│   └── diagrams/
│       ├── system-architecture.png
│       └── data-flow.png
│
├── api/                        # API documentation
│   ├── api-gateway.md          # API Gateway endpoints
│   ├── mcp-servers.md          # MCP server APIs
│   └── openapi.yaml            # OpenAPI/Swagger spec
│
├── development/                # Development guides
│   ├── getting-started.md
│   ├── local-setup.md
│   ├── testing-guide.md
│   ├── coding-standards.md
│   └── contribution-guide.md
│
├── deployment/                 # Deployment documentation
│   ├── kubernetes-deployment.md
│   ├── gcp-setup.md
│   ├── secrets-management.md
│   └── monitoring-setup.md
│
├── operations/                 # Operational runbooks
│   ├── incident-response.md
│   ├── scaling-guide.md
│   ├── backup-restore.md
│   └── troubleshooting.md
│
└── decisions/                  # Architecture decision records (ADRs)
    ├── 001-event-driven-architecture.md
    ├── 002-rabbitmq-vs-kafka.md
    └── 003-postgresql-vs-neo4j.md
```

**Documentation Principles**:
- **Living Documentation**: Updated alongside code changes
- **Developer-Friendly**: Clear examples and quick-start guides
- **Decision Tracking**: ADRs document architectural choices and trade-offs

---

### 6. `/tests/` - Integration and E2E Tests

```
tests/
├── integration/                # Cross-service integration tests
│   ├── __init__.py
│   ├── test_knowledge_extraction_workflow.py
│   ├── test_project_seeding_workflow.py
│   └── test_rule_engine_integration.py
│
├── e2e/                        # End-to-end tests
│   ├── __init__.py
│   ├── test_full_workflow.py  # Complete user workflows
│   └── test_api_to_vault.py
│
├── performance/                # Performance and load tests
│   ├── locustfile.py           # Locust load tests
│   └── benchmark_suite.py
│
├── fixtures/                   # Test data and fixtures
│   ├── sample_vault/
│   ├── test_knowledge_graph.json
│   └── mock_responses/
│
└── conftest.py                 # Pytest configuration
```

**Testing Principles**:
- **Test Pyramid**: Unit tests in services, integration tests at root
- **Isolation**: Integration tests use testcontainers for dependencies
- **Coverage**: Target 80%+ code coverage for critical paths

---

### 7. `/scripts/` - Utility Scripts

```
scripts/
├── setup/                      # Setup scripts
│   ├── install-dependencies.sh
│   ├── init-monorepo.sh
│   └── configure-git-hooks.sh
│
├── build/                      # Build scripts
│   ├── build-all-services.sh
│   ├── build-docker-images.sh
│   └── push-to-registry.sh
│
├── deploy/                     # Deployment scripts
│   ├── deploy-to-dev.sh
│   ├── deploy-to-staging.sh
│   ├── deploy-to-production.sh
│   └── rollback.sh
│
├── data/                       # Data management scripts
│   ├── migrate-database.sh
│   ├── seed-test-data.sh
│   └── export-knowledge-graph.py
│
└── ci-cd/                      # CI/CD helper scripts
    ├── run-tests.sh
    ├── lint-all.sh
    └── generate-coverage.sh
```

**Script Principles**:
- **Idempotency**: Scripts can be run multiple times safely
- **Error Handling**: Proper exit codes and error messages
- **Documentation**: Header comments explain script purpose and usage

---

## Naming Conventions

### Services
- **Pattern**: `<domain>-<responsibility>`
- **Examples**: `api-gateway`, `knowledge-extractor`, `rule-engine`
- **Case**: kebab-case (lowercase with hyphens)

### Packages
- **Pattern**: `weave-<domain>`
- **Examples**: `weave-common`, `weave-messaging`, `weave-db`
- **Case**: kebab-case
- **Python Import**: `weave_<domain>` (snake_case)

### Python Modules
- **Files**: snake_case (e.g., `rule_executor.py`)
- **Classes**: PascalCase (e.g., `RuleExecutor`)
- **Functions**: snake_case (e.g., `execute_rule`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)

### Kubernetes Resources
- **Pattern**: `<service-name>-<resource-type>`
- **Examples**: `api-gateway-deployment`, `rabbitmq-service`
- **Case**: kebab-case

### Environment Variables
- **Pattern**: `WEAVE_<SERVICE>_<CONFIG>`
- **Examples**: `WEAVE_API_PORT`, `WEAVE_RABBITMQ_URL`
- **Case**: UPPER_SNAKE_CASE

---

## File Organization Standards

### Service Structure (Consistent Across All Services)
```
service-name/
├── src/                        # Source code
│   ├── main.py                 # Entry point
│   ├── config.py               # Configuration
│   ├── consumers/              # Message consumers (if applicable)
│   ├── publishers/             # Message publishers (if applicable)
│   ├── processors/             # Business logic
│   ├── routes/                 # API routes (if applicable)
│   ├── models/                 # Data models (Pydantic/SQLAlchemy)
│   └── utils/                  # Service-specific utilities
├── tests/                      # Unit tests
│   ├── test_main.py
│   └── test_processors.py
├── Dockerfile                  # Container definition
├── requirements.txt            # Python dependencies
├── pyproject.toml              # Python project metadata
└── README.md                   # Service documentation
```

### Package Structure
```
package-name/
├── src/
│   └── package_name/           # Python package
│       ├── __init__.py
│       ├── module1.py
│       └── module2.py
├── tests/
│   └── test_module1.py
├── pyproject.toml              # Package metadata
└── README.md
```

---

## Git Ignore Patterns

### `/home/aepod/dev/weave-nn/.gitignore`
```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Virtual Environments
.venv/
venv/
ENV/
env/
.env

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/
.hypothesis/

# Docker
.dockerignore

# Kubernetes
kubeconfig

# Secrets
*.key
*.pem
secrets.yaml
.env.local
.env.production

# Logs
*.log
logs/

# Temporary
tmp/
temp/
*.tmp

# Build artifacts
*.whl
*.tar.gz
```

---

## Docker Ignore Patterns

### `/home/aepod/dev/weave-nn/.dockerignore`
```dockerignore
# Documentation
*.md
docs/

# Tests
tests/
*.test.py
.pytest_cache/

# Git
.git/
.gitignore
.github/

# IDE
.vscode/
.idea/

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.egg-info/
.venv/
venv/

# Build artifacts
build/
dist/

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# Development
docker-compose*.yml
Dockerfile*
Makefile

# CI/CD
.github/
.gitlab-ci.yml
Jenkinsfile

# Infrastructure
infrastructure/
kubernetes/
terraform/
helm/

# Scripts
scripts/
```

---

## Makefile Commands

Common tasks for developers:

```makefile
# Build all Docker images
.PHONY: build
build:
	./scripts/build/build-docker-images.sh

# Run all tests
.PHONY: test
test:
	./scripts/ci-cd/run-tests.sh

# Lint all code
.PHONY: lint
lint:
	./scripts/ci-cd/lint-all.sh

# Start local development environment
.PHONY: dev-up
dev-up:
	docker-compose -f docker-compose.dev.yml up -d

# Stop local development environment
.PHONY: dev-down
dev-down:
	docker-compose -f docker-compose.dev.yml down

# Deploy to Kubernetes (dev)
.PHONY: deploy-dev
deploy-dev:
	./scripts/deploy/deploy-to-dev.sh

# Database migrations
.PHONY: migrate
migrate:
	./scripts/data/migrate-database.sh

# Seed test data
.PHONY: seed
seed:
	./scripts/data/seed-test-data.sh

# Clean all build artifacts
.PHONY: clean
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
```

---

## Environment Configuration

### Local Development (`.env.local`)
```bash
# Service Ports
WEAVE_API_PORT=8000
WEAVE_RULE_ENGINE_PORT=8001

# RabbitMQ
WEAVE_RABBITMQ_URL=amqp://guest:guest@localhost:5672/
WEAVE_RABBITMQ_EXCHANGE=weave-nn.events
WEAVE_RABBITMQ_QUEUE_PREFIX=weave.dev

# PostgreSQL
WEAVE_DB_HOST=localhost
WEAVE_DB_PORT=5432
WEAVE_DB_NAME=weave_nn_dev
WEAVE_DB_USER=postgres
WEAVE_DB_PASSWORD=postgres

# N8N
WEAVE_N8N_URL=http://localhost:5678

# Logging
WEAVE_LOG_LEVEL=DEBUG
WEAVE_LOG_FORMAT=json

# Feature Flags
WEAVE_FEATURE_AI_AGENTS=true
WEAVE_FEATURE_TEMPORAL_QUERIES=true
```

---

## README Template for Services

Each service should have a README following this template:

```markdown
# [Service Name]

**Purpose**: Brief description of what this service does
**Tech Stack**: Python 3.11, FastAPI, RabbitMQ, etc.
**Owner**: [Team/Maintainer]

## Overview

Detailed description of the service's responsibilities and how it fits into the overall architecture.

## Architecture

- **Event Consumers**: List of RabbitMQ queues consumed
- **Event Publishers**: List of RabbitMQ exchanges published to
- **Dependencies**: External services (PostgreSQL, N8N, etc.)
- **Endpoints**: API endpoints exposed (if applicable)

## Local Development

### Prerequisites
- Python 3.11+
- Docker and Docker Compose
- RabbitMQ running locally

### Setup
\```bash
# Install dependencies
pip install -r requirements.txt

# Run service
python src/main.py
\```

### Running Tests
\```bash
pytest tests/
\```

## Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `WEAVE_SERVICE_PORT` | Service port | 8000 |
| `WEAVE_RABBITMQ_URL` | RabbitMQ connection | amqp://localhost |

## Deployment

See [deployment docs](/docs/deployment/kubernetes-deployment.md) for Kubernetes deployment instructions.

## Monitoring

- **Metrics**: Prometheus metrics exposed at `/metrics`
- **Health Check**: `/health` endpoint
- **Logs**: Structured JSON logs to stdout

## Related Services

- [API Gateway](/services/api-gateway) - Upstream API
- [Rule Engine](/services/rule-engine) - Downstream consumer
```

---

## Summary

This monorepo structure provides:

1. **Clear Separation**: Services, packages, infrastructure, and tools are logically organized
2. **Scalability**: Easy to add new services and packages without restructuring
3. **Developer Experience**: Consistent structure across all services
4. **Deployment Ready**: Infrastructure-as-code with Kubernetes manifests
5. **Testing**: Dedicated testing infrastructure for unit, integration, and E2E tests
6. **Documentation**: Comprehensive docs for architecture, APIs, and operations

**Next Steps**:
1. Initialize directory structure with `mkdir` commands
2. Create README templates for each major directory
3. Set up initial services (api-gateway, rule-engine, file-watcher)
4. Configure Docker Compose for local development
5. Set up CI/CD pipelines in `.github/workflows/`

---

**Created**: 2025-10-23
**Backend Developer**: System Architecture Team
**Version**: 1.0
