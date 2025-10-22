---
# Node Metadata
feature_id: "F-014"
feature_name: "N8N Workflow Automation"
category: "automation"
status: "planned"
priority: "high"
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
  requires: ["rabbitmq-message-queue"]
  enables: ["cross-project-knowledge-retention"]
  related_features: ["rabbitmq-message-queue", "git-integration", "obsidian-tasks-integration"]

# Relationships
relationships:
  related_decisions:
    - "IR-3"
  related_architecture:
    - "obsidian-first-architecture"
    - "ai-integration-layer"

# Visual
visual:
  icon: "workflow"
  cssclasses:
    - type-feature
    - scope-mvp
    - priority-high
    - tech-n8n

# Tags
tags:
  - scope/mvp
  - type/feature
  - status/planned
  - priority/high
  - tech/n8n
  - tech/rabbitmq
  - tech/nodejs
  - category/automation
  - category/infrastructure
---

# N8N Workflow Automation

**Purpose**: Integrate N8N workflow automation platform to orchestrate complex multi-step processes involving Obsidian vault operations, AI agents, external APIs, and cross-project knowledge management.

**Decision**: [[../archive/DECISIONS#IR-3-Other-Integrations|IR-3: Other Integrations]] - N8N for workflow orchestration

**Architecture**: N8N + RabbitMQ message queue for async event-driven workflows

---

## 🎯 User Story

As a **project manager using Weave-NN**, I want to **automate complex multi-step workflows** (like client onboarding, project handoff, weekly reports) so that I can **eliminate repetitive tasks and ensure consistency across projects**.

---

## 🚀 Key Capabilities

### Visual Workflow Builder
- ✅ **No-code automation** - Drag-and-drop workflow canvas
- ✅ **50+ integrations** - GitHub, Slack, Discord, Google Drive, etc.
- ✅ **Conditional logic** - If/then branching, loops, switches
- ✅ **Error handling** - Retry logic, fallback paths, alerts

### Obsidian Vault Integration
- ✅ **Trigger on vault changes** - File created, modified, deleted (via RabbitMQ)
- ✅ **CRUD operations** - Create/read/update notes via Obsidian REST API
- ✅ **Task management** - Create tasks, update status (obsidian-tasks)
- ✅ **Git operations** - Auto-commit, push, create branches

### AI Agent Orchestration
- ✅ **Claude API calls** - Prompt engineering, response parsing
- ✅ **Agent chaining** - Multi-step AI workflows
- ✅ **Context injection** - Pass vault data to AI prompts
- ✅ **Response persistence** - Save AI outputs to vault

### Cross-Project Workflows
- ✅ **Project templates** - Standardized project setup
- ✅ **Knowledge extraction** - Pull learnings from completed projects
- ✅ **Client handoff** - Export deliverables, close project
- ✅ **Weekly reports** - Automated status summaries

---

## 🏗️ Architecture

N8N serves as the primary orchestrator for tasks and workflows. However, to maintain a decoupled and scalable system, N8N does not directly interact with other services or the Obsidian vault. Instead, it publishes task-related events (e.g., `task.created`, `workflow.completed`) to a central RabbitMQ message queue.

This queue-centric architecture ensures that all components, including AI agents and vault writers, are decoupled. They subscribe to relevant events from the queue and perform their actions without any direct dependency on N8N. This approach enhances scalability, allows for centralized security and auditing (e.g., an AI security layer inspecting messages), and aligns with the broader event-driven strategy of Weave-NN.

The overall message flow is detailed in the [[../architecture/api-layer#Message Queue Integration|API & Backend Layer]] documentation.


### Message Flow

**1. Event-Driven Triggers** (RabbitMQ → N8N):
```
File watcher detects change in Obsidian vault
    ↓
Publish event to RabbitMQ: {"type": "file.created", "path": "projects/client-a/requirements.md"}
    ↓
N8N workflow subscribed to "file.created" receives event
    ↓
Workflow executes: Extract requirements → Create GitHub issues → Update project dashboard
```

**2. Scheduled Workflows** (N8N cron):
```
N8N cron: Every Friday at 5pm
    ↓
Workflow: Weekly Report Generator
    ↓
Query Obsidian vault for completed tasks (last 7 days)
    ↓
Generate summary with Claude
    ↓
Create report note in vault + Send to Slack
```

**3. Manual Triggers** (N8N webhook):
```
User runs: curl https://n8n.weave-nn.com/webhook/onboard-client -d '{"client": "Acme Corp"}'
    ↓
N8N workflow: Client Onboarding
    ↓
1. Create project folder structure
2. Apply templates
3. Create initial tasks
4. Send welcome email
5. Create GitHub repo
```

---

## 📋 MVP Implementation (Week 2)

### Prerequisites (Day 8)

**1. Install N8N (GCP VM)**
```bash
# On GCP Compute Engine VM (shared with API server initially)
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=<secure-password> \
  n8nio/n8n
```

**2. Configure N8N**
- Access: http://<vm-ip>:5678
- Set up credentials (Obsidian API key, GitHub token, Slack webhook)
- Test connection to Obsidian REST API

**3. Install RabbitMQ** (see [[rabbitmq-message-queue|RabbitMQ feature]])

### Week 2 Implementation

**Day 8-9: Core Workflows Setup**

**Workflow 1: Client Onboarding** (Priority: Critical)
```yaml
Trigger: Webhook (POST /webhook/onboard-client)
Input: {"client_name": "Acme Corp", "contact": "john@acme.com"}

Steps:
  1. Create project folder: _projects/{{client_name}}/
  2. Copy templates:
     - requirements.md (from templates/project/)
     - tasks.md (from templates/project/)
     - decisions.md (from templates/project/)
  3. Replace placeholders: {{client_name}} → "Acme Corp"
  4. Create initial tasks:
     - "[ ] Schedule kickoff meeting 📅 {{next_monday}}"
     - "[ ] Review requirements document"
     - "[ ] Set up GitHub repository"
  5. Create GitHub repo: github.com/weavelogic/{{client_name}}
  6. Git commit: "feat: Initialize project for {{client_name}}"
  7. Send Slack notification: "New project started: {{client_name}}"

Output: Project URL, GitHub repo URL, Slack confirmation
```

**Workflow 2: Weekly Report Generator** (Priority: High)
```yaml
Trigger: Cron (Every Friday at 5pm)

Steps:
  1. Query Obsidian Tasks:
     - GET /vault/_projects/*/tasks.md
     - Parse tasks completed this week (✅ + date filter)
  2. Group by project:
     - Project A: 12 tasks completed
     - Project B: 8 tasks completed
  3. Query Git commits:
     - git log --since="7 days ago" --oneline
  4. Generate summary with Claude:
     Prompt: "Create a weekly report from this data: {{tasks}} {{commits}}"
  5. Create report note:
     - Path: _planning/weekly-reports/{{YYYY-MM-DD}}.md
     - Content: Claude-generated summary + task details
  6. Send to Slack:
     - Channel: #weekly-updates
     - Message: Summary + link to report

Output: Report note path, Slack message ID
```

**Workflow 3: Knowledge Extraction on Project Close** (Priority: High)
```yaml
Trigger: RabbitMQ event {"type": "project.closed", "project_id": "client-a"}

Steps:
  1. Read project folder: _projects/{{project_id}}/
  2. Extract key files:
     - requirements.md
     - decisions.md
     - lessons-learned.md (if exists)
  3. Analyze with Claude:
     Prompt: "Extract reusable knowledge from this project: {{files}}"
     Extract:
       - Common patterns
       - Reusable solutions
       - Best practices
       - Pitfalls to avoid
  4. Create knowledge base entry:
     - Path: knowledge-base/patterns/{{project_id}}-learnings.md
     - Content: Claude-generated insights
     - Tags: #pattern, #{{project_type}}, #{{tech_stack}}
  5. Update project template:
     - If new best practice → Add to templates/project/
  6. Archive project:
     - Git tag: "archive/{{project_id}}"
     - Move to _archive/{{project_id}}/

Output: Knowledge base entry path, Archive confirmation
```

**Day 10: GitHub Integration Workflows**

**Workflow 4: GitHub Issue → Obsidian Task Sync** (Priority: Medium)
```yaml
Trigger: RabbitMQ event {"type": "github.issue.created", "issue_id": 123}

Steps:
  1. Fetch issue from GitHub API:
     - GET /repos/{{repo}}/issues/{{issue_id}}
  2. Map to Obsidian task:
     - Title: Issue title
     - Due date: Issue milestone due date
     - Labels: Convert to tags (#bug, #feature)
  3. Create task in vault:
     - PATCH /vault/_projects/{{repo}}/tasks.md
     - Append: "- [ ] {{title}} 📅 {{due_date}} #github/{{issue_id}}"
  4. Update issue with task link:
     - Comment on GitHub: "Tracked in Obsidian: obsidian://open?vault=weave-nn&file=_projects/{{repo}}/tasks.md"

Output: Task created, GitHub comment posted
```

**Day 11: Advanced Automation**

**Workflow 5: Meeting Notes → Action Items Extractor** (Priority: Medium)
```yaml
Trigger: RabbitMQ event {"type": "file.created", "path": "meetings/*.md"}

Steps:
  1. Read meeting notes: GET /vault/{{path}}
  2. Extract action items with Claude:
     Prompt: "Extract action items from this meeting: {{content}}"
     Output format: JSON array of {task, assignee, due_date}
  3. For each action item:
     - Create task in assignee's task file
     - Add context link: "From [[{{meeting_file}}]]"
  4. Update meeting notes:
     - PATCH /vault/{{path}}
     - Add section: "## Action Items" with task links
  5. Send notifications:
     - Slack DM to each assignee: "You have a new task from {{meeting_name}}"

Output: Tasks created, Notifications sent
```

---

## 🔧 N8N Custom Nodes (Python SDK)

### Custom Node: Obsidian REST API

**Package**: `@weave-nn/n8n-nodes-obsidian`

**Operations**:
- Create Note
- Read Note
- Update Note
- Delete Note
- List Notes (with filter)
- Patch Note Section
- Execute Command

**Configuration**:
```json
{
  "credentials": {
    "obsidianApi": {
      "name": "Obsidian API",
      "properties": [
        {"name": "apiUrl", "type": "string", "default": "https://localhost:27124"},
        {"name": "apiKey", "type": "string", "required": true}
      ]
    }
  },
  "operations": [
    {
      "name": "Create Note",
      "value": "create",
      "description": "Create a new note in the vault"
    }
  ]
}
```

### Custom Node: RabbitMQ Consumer

**Package**: `@weave-nn/n8n-nodes-rabbitmq`

**Operations**:
- Subscribe to Queue
- Publish Message
- Acknowledge Message
- Reject Message

---

## 📊 Workflow Examples (Real Use Cases)

### Example 1: Client Onboarding Workflow

**Trigger**: Webhook call from CRM when deal closes

**Steps**:
1. Create project structure in vault
2. Create GitHub repository
3. Add team members to repo
4. Create initial tasks in Obsidian
5. Schedule kickoff meeting (Google Calendar API)
6. Send welcome email (SendGrid API)
7. Create Slack channel
8. Post project links to Slack

**Result**: Complete project setup in 30 seconds (vs 30 minutes manual)

### Example 2: Cross-Project Knowledge Retention

**Trigger**: Project status changes to "Completed" (Obsidian task update)

**Steps**:
1. Extract all decision nodes from project
2. Analyze with Claude: "What patterns are reusable?"
3. Create pattern library entries
4. Update project templates with improvements
5. Generate lessons-learned report
6. Archive project files
7. Update portfolio/case studies

**Result**: Knowledge from each project automatically improves future projects

### Example 3: Weekly Status Automation

**Trigger**: Every Friday at 4pm (cron)

**Steps**:
1. Query all active projects (Obsidian vault scan)
2. For each project:
   - Count completed tasks
   - Get Git commit count
   - Check GitHub PR status
   - Get blockers (tasks with #blocked tag)
3. Generate summary with Claude
4. Create weekly report note
5. Send to Slack + email
6. Update project dashboards (Mehrmaid visualizations)

**Result**: Zero-effort weekly reporting

---

## 💰 Cost Analysis

### Infrastructure Costs

**MVP (Shared VM)**:
- GCP Compute Engine VM: $50/month (e2-standard-2)
  - N8N + RabbitMQ + Python API server (all on one VM)
- No separate N8N hosting needed

**Production (Separate Services)**:
- N8N Cloud (managed): $20/month (Starter plan, 5000 executions)
- RabbitMQ (CloudAMQP): $19/month (Lemur plan)
- **Total**: $39/month

**Self-Hosted (Recommended for MVP)**:
- GCP VM: $50/month (runs everything)
- **Total**: $50/month

### Execution Costs

**Free tier** (self-hosted):
- Unlimited workflows
- Unlimited executions
- No per-execution costs

**N8N Cloud** (if scaled later):
- 5000 executions/month included
- $0.004 per additional execution
- Estimated: 10,000 executions/month = $20 overage = $40 total

---

## 🎯 Success Criteria (MVP)

### Must Have (Week 2)
- ✅ N8N installed and accessible
- ✅ RabbitMQ connected to N8N
- ✅ Obsidian REST API integrated
- ✅ 3 core workflows operational:
  - Client onboarding
  - Weekly report generator
  - Knowledge extraction on project close
- ✅ GitHub integration (issue sync)
- ✅ Slack notifications working

### Nice to Have (v1.1)
- ⚡ Custom N8N nodes (Obsidian, RabbitMQ)
- ⚡ Advanced error handling (retry logic, dead letter queue)
- ⚡ Workflow templates library (10+ reusable workflows)
- ⚡ Monitoring dashboard (execution metrics)

### Deferred to v2.0+
- 🔮 N8N Cloud migration (if self-hosted scaling issues)
- 🔮 Advanced AI workflows (multi-agent orchestration)
- 🔮 Custom workflow marketplace (share with community)

---

## 🚧 Key Challenges & Solutions

### Challenge 1: N8N + Obsidian Integration
**Problem**: N8N doesn't have native Obsidian node
**Solution**: Use HTTP Request node with Obsidian REST API (simple CRUD)
**Future**: Build custom N8N node (@weave-nn/n8n-nodes-obsidian)

### Challenge 2: Event-Driven Triggers
**Problem**: How does N8N know when vault files change?
**Solution**: RabbitMQ message queue (file watcher publishes events, N8N subscribes)

### Challenge 3: Workflow Complexity
**Problem**: Some workflows have 20+ steps (hard to debug)
**Solution**:
- Break into sub-workflows (modular)
- Use N8N error handling (try/catch nodes)
- Add logging nodes (send to RabbitMQ logging queue)

### Challenge 4: Credential Management
**Problem**: Need to store API keys securely (Obsidian, GitHub, Slack)
**Solution**: Use N8N built-in credentials store (encrypted, vault-backed)

---

## 🔗 Related Features

### Requires
- [[rabbitmq-message-queue|RabbitMQ Message Queue]] - Event-driven triggers
- [[git-integration|Git Integration]] - Automated commits
- [[obsidian-tasks-integration|Obsidian Tasks]] - Task management

### Enables
- [[cross-project-knowledge-retention|Cross-Project Knowledge Retention]] - Automated extraction
- [[github-issues-integration|GitHub Issues Integration]] - Bidirectional sync
- Weekly reporting automation
- Client onboarding automation

### Integrates With
- [[basic-ai-integration-mcp|MCP Integration]] - Claude API calls in workflows
- [[obsidian-first-architecture|Obsidian-First Architecture]] - REST API access

---

## 🔗 Related Documentation

### Architecture
- [[../architecture/obsidian-first-architecture|Obsidian-First Architecture]] - REST API
- [[../architecture/ai-integration-layer|AI Integration Layer]] - Claude workflows

### Decisions
- [[../archive/DECISIONS#IR-3-Other-Integrations|IR-3: Other Integrations]] - N8N decided

### External Resources
- [N8N Documentation](https://docs.n8n.io/)
- [N8N Self-Hosting Guide](https://docs.n8n.io/hosting/)
- [N8N Custom Nodes](https://docs.n8n.io/integrations/creating-nodes/)
- [N8N Workflow Templates](https://n8n.io/workflows/)

---

## 📝 Example: Client Onboarding Workflow (JSON)

```json
{
  "name": "Client Onboarding",
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "onboard-client",
        "method": "POST"
      }
    },
    {
      "name": "Create Project Folder",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://localhost:27124/vault/_projects/{{$json.client_name}}/README.md",
        "method": "POST",
        "body": {
          "content": "# {{$json.client_name}}\n\nClient project initialized on {{$now}}."
        }
      }
    },
    {
      "name": "Create GitHub Repo",
      "type": "n8n-nodes-base.github",
      "parameters": {
        "operation": "create",
        "resource": "repository",
        "name": "{{$json.client_name}}"
      }
    },
    {
      "name": "Send Slack Notification",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "channel": "#projects",
        "text": "New project started: {{$json.client_name}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {"main": [[{"node": "Create Project Folder"}]]},
    "Create Project Folder": {"main": [[{"node": "Create GitHub Repo"}]]},
    "Create GitHub Repo": {"main": [[{"node": "Send Slack Notification"}]]}
  }
}
```

---

**Status**: Planned for MVP (Week 2, Day 8-11)
**Complexity**: Moderate (20 hours setup + 10 hours per workflow)
**Priority**: High (enables automation and cross-project learning)
**Next Steps**: Install N8N + RabbitMQ, create first 3 workflows
