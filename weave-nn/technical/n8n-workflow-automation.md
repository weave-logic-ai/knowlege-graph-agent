---
type: technical-primitive
category: tool
status: planned
first_used_phase: "PHASE-6"
mvp_required: false
future_only: true
maturity: mature

# Integration tracking
used_in_services:
  - workflow-engine
  - event-consumer
deployment: docker-compose

# Relationships
alternatives_considered:
  - "[[apache-airflow]]"
  - "[[temporal-io]]"
  - "[[zapier]]"
  - "[[custom-workflow-engine]]"
replaces: null
replaced_by: null

# Documentation
decision: "[[../decisions/technical/workflow-automation-platform]]"
architecture: "[[../architecture/workflow-automation-system]]"

tags:
  - technical
  - tool
  - platform
  - workflow
  - automation
  - planned
---

# n8n Workflow Automation

**Category**: Workflow Automation Platform
**Status**: Planned (Phase 6 Optional Feature)
**First Used**: Phase 6 (MVP Week 2) - Optional Advanced Feature

---

## Overview

n8n is an open-source workflow automation platform with visual builder, 400+ integrations, and self-hosted deployment. It enables complex multi-step workflows triggered by events, scheduled tasks, or webhooks, with conditional logic, data transformation, and error handling.

**Official Site**: https://n8n.io/
**Documentation**: https://docs.n8n.io/
**GitHub**: https://github.com/n8n-io/n8n

---

## Why We Use It

n8n extends Weave-NN's event-driven architecture by consuming RabbitMQ events and orchestrating **complex, multi-step workflows** that exceed simple agent rule capabilities (e.g., API calls, external integrations, scheduled tasks, error retry logic).

**Primary Purpose**: Advanced workflow automation triggered by RabbitMQ events, enabling integrations with external tools (GitHub, Slack, email, webhooks).

**Specific Use Cases**:
- Complex workflows in [[../architecture/workflow-automation-system]] - multi-step processes beyond single agent rules
- External integrations in [[../features/github-issues-integration]] - RabbitMQ event → n8n → GitHub API
- Scheduled tasks in [[../features/daily-log-automation]] - cron-triggered daily log creation + template population
- Error handling in [[../architecture/event-consumer]] - dead-letter queue (DLQ) events → n8n retry logic
- Notifications in [[../features/collaborative-editing]] - file changes → n8n → Slack/email notifications

---

## Key Capabilities

- **Visual Workflow Builder**: Drag-and-drop node-based editor for designing workflows - no code required for basic flows
- **RabbitMQ Integration**: Native AMQP trigger node consumes events from queues - direct integration with Weave-NN event bus
- **400+ Integrations**: Prebuilt nodes for GitHub, Slack, Google APIs, webhooks, databases - enables external tool orchestration
- **Conditional Logic**: IF/Switch nodes for branching workflows based on event data - handles complex decision trees
- **Self-Hosted**: Docker deployment with PostgreSQL persistence - full control and privacy for sensitive workflows

---

## Integration Points

**Used By**:
- [[../architecture/workflow-automation-system]] - Optional advanced workflow engine (Phase 6+)
- [[../architecture/event-consumer]] - Offloads complex workflows to n8n instead of inline Python code

**Integrates With**:
- [[rabbitmq]] - Consumes events from RabbitMQ queues via AMQP trigger node
- [[docker]] - Runs as Docker container in docker-compose.yml
- [[postgresql]] - Stores workflow definitions, execution history, and state (Phase 7)
- [[github]] - Calls GitHub API via prebuilt GitHub node (create issues, PRs, comments)

**Enables Features**:
- [[../features/github-issues-integration]] - Auto-create GitHub issues from decision nodes
- [[../features/daily-log-automation]] - Schedule daily log creation every morning
- [[../features/collaborative-editing]] - Notify team via Slack/email on critical file changes
- [[../features/decision-tracking]] - Trigger approval workflows when ADR status changes

---

## Configuration

**Docker Compose** (Phase 6):
```yaml
n8n:
  image: n8nio/n8n:latest
  ports:
    - "5678:5678"
  environment:
    - N8N_BASIC_AUTH_ACTIVE=true
    - N8N_BASIC_AUTH_USER=admin
    - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
    - DB_TYPE=sqlite  # SQLite for MVP, PostgreSQL for v1.0
    - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
    - WEBHOOK_URL=http://localhost:5678/
  volumes:
    - n8n_data:/home/node/.n8n
    - ./n8n/workflows:/workflows:ro  # Prebuilt workflow templates
  depends_on:
    - rabbitmq

volumes:
  n8n_data:
```

**Environment Variables**:
- `N8N_BASIC_AUTH_USER`: Admin username (default: admin)
- `N8N_BASIC_AUTH_PASSWORD`: Admin password (set via .env)
- `N8N_ENCRYPTION_KEY`: Encryption key for credentials (generate with `openssl rand -hex 32`)
- `WEBHOOK_URL`: Public URL for webhook endpoints (e.g., https://weave-nn.example.com/)
- `DB_TYPE`: Database type (sqlite|postgresdb|mysql)
- `N8N_PORT`: Web UI port (default: 5678)

**RabbitMQ Trigger Node** (Example Workflow):
```json
{
  "nodes": [
    {
      "name": "RabbitMQ Trigger",
      "type": "n8n-nodes-base.rabbitMqTrigger",
      "position": [250, 300],
      "parameters": {
        "queue": "vault.events",
        "options": {
          "autoAck": false,
          "acknowledge": "executionFinishes"
        }
      },
      "credentials": {
        "rabbitMq": {
          "id": "1",
          "name": "RabbitMQ Weave-NN"
        }
      }
    },
    {
      "name": "GitHub Create Issue",
      "type": "n8n-nodes-base.github",
      "position": [450, 300],
      "parameters": {
        "resource": "issue",
        "operation": "create",
        "owner": "weave-nn",
        "repository": "weave-nn",
        "title": "={{$json['event']['file_path']}}",
        "body": "New decision node created. Requires ADR approval."
      },
      "credentials": {
        "githubApi": {
          "id": "2",
          "name": "GitHub PAT"
        }
      }
    }
  ],
  "connections": {
    "RabbitMQ Trigger": {
      "main": [[{"node": "GitHub Create Issue", "type": "main", "index": 0}]]
    }
  }
}
```

**Prebuilt Workflow Templates**:
- `/n8n/workflows/github-issue-on-decision.json` - Create GitHub issue for new decision nodes
- `/n8n/workflows/daily-log-generator.json` - Scheduled daily log creation (cron: 0 9 * * *)
- `/n8n/workflows/slack-notify-critical-changes.json` - Notify Slack on architecture file changes
- `/n8n/workflows/retry-failed-events.json` - Consume DLQ events and retry with exponential backoff

---

## Deployment

**MVP (Phase 6)**: Optional Docker Compose service (not required for base MVP)
**v1.0 (Post-MVP)**: Kubernetes deployment with PostgreSQL persistence + webhook ingress

**Resource Requirements**:
- RAM: 200-500 MB (base) + 50-100 MB per active workflow execution
- CPU: 0.2-0.5 cores (idle) + 0.5-1 core per workflow execution
- Storage: 100 MB (Docker image) + 10-50 MB per workflow (execution history)

**Health Check**:
```bash
# Check if n8n is running and accessible
curl http://localhost:5678/healthz
# Expected: {"status": "ok"}

# Check Docker container
docker ps | grep n8n

# View n8n logs
docker logs n8n --follow --tail 100

# Test RabbitMQ connection
# In n8n UI: Test RabbitMQ trigger node
```

**Production Tuning**:
```yaml
n8n:
  environment:
    - EXECUTIONS_PROCESS=main  # Use main process (faster) vs own process (isolated)
    - EXECUTIONS_TIMEOUT=300   # Max workflow execution time (5 minutes)
    - EXECUTIONS_TIMEOUT_MAX=3600  # Hard timeout (1 hour)
    - N8N_METRICS=true         # Expose Prometheus metrics
    - N8N_LOG_LEVEL=info       # Reduce verbosity in production
```

---

## Trade-offs

**Pros** (Why we chose it):
- ✅ **Visual Builder**: Non-developers can create workflows via drag-and-drop UI
- ✅ **Self-Hosted**: Full control and privacy vs SaaS (Zapier, Make)
- ✅ **RabbitMQ Native**: Direct AMQP trigger node for event-driven workflows
- ✅ **Extensive Integrations**: 400+ prebuilt nodes (GitHub, Slack, APIs, databases)
- ✅ **Open Source**: MIT license, free for unlimited workflows

**Cons** (What we accepted):
- ⚠️ **Overkill for Simple Rules**: Single-step rules better handled by event consumer Python code - n8n adds complexity
- ⚠️ **Additional Service**: Another Docker container to manage (resource overhead) - acceptable for advanced workflows
- ⚠️ **UI Dependency**: Workflow editing requires web UI (no git-based workflow definitions) - mitigated by JSON export/import
- ⚠️ **Learning Curve**: Team must learn n8n's node-based paradigm - acceptable because UI is intuitive

---

## Alternatives Considered

**Compared With**:

### [[apache-airflow]]
- **Pros**: Python-native DAGs, robust scheduling, production-grade orchestration
- **Cons**: Heavy resource footprint (500+ MB RAM), overkill for simple workflows, requires Python DAG coding
- **Decision**: Rejected because Weave-NN needs lightweight, visual workflows, not complex data pipelines

### [[temporal-io]]
- **Pros**: Code-first workflows, strong consistency, built-in retry/timeout logic
- **Cons**: Requires writing workflow code (no visual builder), steep learning curve, heavier than n8n
- **Decision**: Rejected because team prefers low-code approach for non-critical workflows

### [[zapier]]
- **Pros**: Easier setup (SaaS), 5000+ integrations, no hosting required
- **Cons**: Expensive ($20-50/month for unlimited workflows), vendor lock-in, no self-hosting (privacy concern)
- **Decision**: Rejected because self-hosted requirement for sensitive Obsidian vault data

### [[custom-workflow-engine]]
- **Pros**: Perfect fit for Weave-NN needs, no external dependencies
- **Cons**: High development cost (3-4 weeks), maintenance burden, reinventing wheel
- **Decision**: Rejected because n8n provides 90% of needed features out-of-box

---

## Decision History

**Decision Record**: [[../decisions/technical/workflow-automation-platform]]

**Key Reasoning**:
> "n8n strikes the ideal balance between power and simplicity for Weave-NN's optional advanced workflows. While simple agent rules (auto-tagging, auto-linking) belong in the event consumer Python code, **complex multi-step workflows** (GitHub integrations, scheduled tasks, external API calls) benefit from n8n's visual builder and 400+ integrations. Making it optional (Phase 6+) allows MVP to ship without this complexity."

**Date Decided**: 2025-10-20 (Phase 6 Planning)
**Decided By**: System Architect (optional feature evaluation)

---

## Phase Usage

### Phase 5 (MVP Week 1) - Not Used
**Status**: Not implemented in base MVP
**Rationale**: Event consumer handles all agent rules inline (Python code)

### Phase 6 (MVP Week 2) - Optional Advanced Feature
**Status**: Available as opt-in Docker Compose service
**Configuration**: Single n8n container with SQLite persistence
**Example Workflows**:
1. **GitHub Issue Creation**: Decision node created → n8n → Create GitHub issue
2. **Daily Log Automation**: Cron (9am daily) → n8n → Create daily log from template
3. **Slack Notifications**: Critical file change event → n8n → Post to Slack channel

**Opt-In**: Users add n8n service to docker-compose.yml if needed
```bash
# Enable n8n (optional)
docker-compose --profile n8n up -d
```

### Phase 7 (v1.0) - Production Deployment
**Status**: Recommended for production use with external integrations
**Enhancements**:
- PostgreSQL persistence (replace SQLite)
- Kubernetes deployment with auto-scaling
- Webhook ingress for external triggers (GitHub webhooks → n8n)
- Prometheus metrics + Grafana dashboard
- Workflow templates in Git (version-controlled JSON exports)

**Schema** (PostgreSQL):
```sql
-- n8n creates these tables automatically
-- Just configure PostgreSQL connection
CREATE DATABASE n8n;
```

---

## Learning Resources

**Official Documentation**:
- [n8n Documentation](https://docs.n8n.io/) - Complete guide
- [RabbitMQ Trigger Node](https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.rabbitmqtrigger/) - AMQP integration
- [GitHub Node](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.github/) - GitHub API integration

**Tutorials**:
- [n8n Quickstart](https://docs.n8n.io/getting-started/quickstart/) - 5-minute setup
- [Building Workflows](https://docs.n8n.io/workflows/) - Visual builder tutorial
- [RabbitMQ Event-Driven Workflows](https://n8n.io/blog/rabbitmq-workflows/) - Blog post

**Best Practices**:
- [Production Deployment](https://docs.n8n.io/hosting/installation/server-setups/) - Docker + PostgreSQL setup
- [Error Handling](https://docs.n8n.io/workflows/error-handling/) - Retry logic patterns
- [Webhook Security](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) - Authentication

**Community**:
- [GitHub Repo](https://github.com/n8n-io/n8n) - Source code and issues
- [Community Forum](https://community.n8n.io/) - Help and discussions
- [Discord](https://discord.gg/n8n) - Real-time support

---

## Monitoring & Troubleshooting

**Health Checks**:
```bash
# Check n8n service health
curl http://localhost:5678/healthz
# Expected: {"status": "ok"}

# Check Docker container
docker ps | grep n8n
docker logs n8n --tail 50

# Test RabbitMQ connection (via n8n UI)
# Create test workflow: RabbitMQ Trigger → No Operation
# Publish test event to RabbitMQ queue
# Verify n8n workflow executes

# View workflow execution history (n8n UI)
http://localhost:5678/workflows
# Check "Executions" tab for success/failure
```

**Common Issues**:

1. **Issue**: n8n cannot connect to RabbitMQ (ECONNREFUSED)
   **Solution**: Ensure RabbitMQ is running and accessible from n8n container
   ```yaml
   # Correct docker-compose.yml networking
   n8n:
     depends_on:
       - rabbitmq
     # Use service name as hostname
     # In n8n RabbitMQ credentials: host=rabbitmq, port=5672
   ```

2. **Issue**: Workflow fails with timeout error
   **Solution**: Increase execution timeout
   ```yaml
   n8n:
     environment:
       - EXECUTIONS_TIMEOUT=600  # 10 minutes
   ```

3. **Issue**: n8n UI not accessible (404 error)
   **Solution**: Check port mapping and basic auth credentials
   ```bash
   # Verify port mapping
   docker port n8n
   # Expected: 5678/tcp -> 0.0.0.0:5678

   # Check basic auth (use correct username/password)
   curl -u admin:password http://localhost:5678
   ```

4. **Issue**: Workflow executes multiple times for same event (duplicate processing)
   **Solution**: Enable auto-acknowledgement or use manual ack after success
   ```json
   {
     "parameters": {
       "options": {
         "autoAck": false,  // Manual ack
         "acknowledge": "executionFinishes"  // Ack after workflow completes
       }
     }
   }
   ```

---

## Related Nodes

**Architecture**:
- [[../architecture/workflow-automation-system]] - Optional n8n-based workflow engine
- [[../architecture/event-consumer]] - Delegates complex workflows to n8n
- [[../architecture/mvp-local-first-architecture]] - Phase 6 optional extension

**Features**:
- [[../features/github-issues-integration]] - Enabled by n8n GitHub node
- [[../features/daily-log-automation]] - Scheduled via n8n cron trigger
- [[../features/collaborative-editing]] - Notifications via n8n Slack node

**Decisions**:
- [[../decisions/technical/workflow-automation-platform]] - Why n8n over Airflow/Temporal
- [[../decisions/technical/event-driven-architecture]] - n8n consumes RabbitMQ events

**Other Primitives**:
- [[rabbitmq]] - Event source for n8n workflows
- [[docker]] - Container platform running n8n
- [[postgresql]] - Persistence layer for n8n (v1.0)
- [[github]] - Integration target via n8n GitHub node

---

## Revisit Criteria

**Reconsider this technology if**:
- n8n resource usage exceeds 1 GB RAM (evaluate Temporal.io or custom engine)
- Workflow complexity requires code-first approach (migrate to Airflow or Temporal)
- SaaS deployment acceptable (evaluate Zapier or Make for easier setup)
- Visual builder becomes bottleneck (workflows need Git version control)

**Scheduled Review**: After 3 months of Phase 6 usage (evaluate adoption rate and resource overhead)

---

**Back to**: [[README|Technical Primitives Index]]
