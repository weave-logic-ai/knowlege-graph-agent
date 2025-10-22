---
type: quick-reference
status: "active"
priority: "high"
created_date: "2025-10-21"
parent_architecture: "task-completion-feedback-loop"

tags:
  - quick-reference
  - cheatsheet
  - task-completion
---

# Task Completion Feedback Loop - Quick Reference

**One-Page Reference** for the task completion feedback loop architecture.

---

## 📋 Daily Log File Format

**Filename**: `_planning/daily-logs/YYYY-MM-DD-HHMM-TASK_ID-description.md`

**Example**: `2025-10-21-1430-T-042-implement-rabbitmq-setup.md`

### Essential Frontmatter Fields

```yaml
---
# Core Metadata (REQUIRED)
task_id: "T-042"
task_type: "implementation"  # implementation|research|decision|debugging
task_description: "Brief description"
agent_role: "coder"  # coder|researcher|planner|tester
project: "weave-nn"
phase: "phase-5"

# Execution Details (REQUIRED)
started_at: "2025-10-21T14:30:00Z"
completed_at: "2025-10-21T16:45:00Z"
duration_minutes: 135
status: "completed"  # completed|failed|partial
success: true

# Performance (REQUIRED)
quality_score: 0.85  # 0-1 scale
estimated_difficulty: "moderate"
actual_difficulty: "moderate"

# Memory Storage (REQUIRED)
memory_namespace: "tasks.implementation.infrastructure"
memory_tags: ["task", "implementation", "rabbitmq", "success"]
store_in_reasoningbank: true
confidence_level: "high"  # high|medium|low

# Optional but Recommended
skills_used: ["docker", "rabbitmq", "python"]
context: ["Setting up async event bus"]
---
```

### Essential Content Sections

```markdown
# Task Completion Log: [TASK_ID] - [Description]

## What Was Accomplished
[3-5 bullet points of deliverables]

## Challenges & Solutions
**Challenge 1**: [Problem]
**Solution**: [How you solved it]
**Time Lost**: [Minutes]

## Agent Learning & Insights
**Patterns Discovered**:
1. [Pattern name]: [Description]

**Skills Demonstrated**: [List skills]

**Mistakes Made**: [What went wrong]

**Improvements Identified**: [What could be better]
```

---

## 🔄 Event Types

| Event Type | Routing Key | Consumers |
|------------|-------------|-----------|
| Task completed | `task.completed` | memory_extractor, performance_tracker, ab_testing |
| Task failed | `task.failed` | memory_extractor, performance_tracker |
| Memory stored | `task.memory_stored` | performance_tracker |

---

## 🗂️ Memory Namespaces

### Claude-Flow Namespaces

```
tasks.implementation          → Implementation task patterns
tasks.research                → Research methodologies
tasks.decision                → Decision-making patterns
tasks.debugging               → Bug fixing approaches

skills.coding                 → Programming skills
skills.infrastructure         → DevOps skills
skills.ai                     → AI/ML skills

patterns.successful           → Working approaches
patterns.antipatterns         → Failed approaches

learnings.mistakes            → Errors and lessons
learnings.insights            → Novel discoveries

performance.agent             → Agent metrics
performance.project           → Project metrics
```

### ReasoningBank Domains

```
infrastructure    → Docker, RabbitMQ, cloud
frontend          → React, Svelte, UI
backend           → APIs, microservices
ai-integration    → Claude-Flow, MCP
debugging         → Bug diagnosis, testing
```

---

## 🎯 Agent Priming API

### Endpoint

```
POST http://localhost:8001/prime
```

### Request

```json
{
  "task_id": "T-050",
  "description": "Implement N8N workflow",
  "type": "implementation",
  "agent_role": "coder",
  "skills_needed": ["n8n", "workflow", "rabbitmq"],
  "domain": "infrastructure",
  "project": "weave-nn"
}
```

### Response

```json
{
  "context": "## Similar Tasks...\n## Skills...",
  "confidence": 0.85,
  "similar_tasks_count": 5,
  "skill_memories_count": 8,
  "learning_patterns_count": 3,
  "recommendations": [
    "Use similar approach from T-042",
    "Estimated time: 90 minutes",
    "Be cautious with: n8n configuration"
  ]
}
```

---

## 📊 Key Metrics

### System Health

```
Memory Storage Rate:    > 95%
Extraction Accuracy:    > 90%
Retrieval Speed:        < 100ms
Agent Priming Latency:  < 200ms
```

### Performance Targets

```
Success Rate:     +10% / 3 months
Quality Score:    +0.15 / 3 months
Time Efficiency:  -15% reduction
Error Rate:       -50% repeated errors
```

---

## 🛠️ Common Commands

### Start Services

```bash
# Memory extractor
python consumers/memory_extractor.py

# Performance tracker
python consumers/performance_tracker.py

# Agent priming API
uvicorn services.agent_primer:app --port 8001 --reload

# A/B testing
python consumers/ab_testing.py --experiment exp-001
```

### Health Checks

```bash
# Overall health
./scripts/health-check.sh

# RabbitMQ queues
rabbitmqctl list_queues name messages consumers

# Memory database
sqlite3 .swarm/memory.db "SELECT COUNT(*) FROM memory_store"

# Recent tasks
sqlite3 .swarm/memory.db "SELECT key, created_at FROM memory_store WHERE namespace LIKE 'tasks.%' ORDER BY created_at DESC LIMIT 10"
```

### Testing

```bash
# End-to-end test
python scripts/test-feedback-loop.py

# Manual memory extraction
python scripts/manual-extract.py --log-file "_planning/daily-logs/2025-10-21-1430-T-042.md"

# Performance dashboard
python scripts/dashboard.py
```

---

## 🐛 Troubleshooting

### Issue: Memory not extracted

```bash
# Check RabbitMQ connection
curl http://localhost:15672/api/queues/%2F/memory_extractor

# Check consumer running
ps aux | grep memory_extractor

# Manual extraction
python scripts/manual-extract.py --log-file "path/to/log.md"
```

### Issue: Agent priming returns empty context

```bash
# Check memories exist
sqlite3 .swarm/memory.db "SELECT COUNT(*) FROM memory_store"

# Check namespaces
sqlite3 .swarm/memory.db "SELECT DISTINCT namespace FROM memory_store"

# Test semantic search
python scripts/test-semantic-search.py --query "implement rabbitmq"
```

### Issue: RabbitMQ queue backed up

```bash
# Check queue depth
rabbitmqctl list_queues name messages

# Purge queue (CAUTION!)
rabbitmqctl purge_queue memory_extractor

# Increase consumers
python consumers/memory_extractor.py &  # Start additional consumer
```

---

## 📁 File Locations

```
weave-nn-mcp/
├── publishers/
│   └── task_logger.py              ← Create daily logs
├── consumers/
│   ├── memory_extractor.py         ← Extract memories
│   ├── performance_tracker.py      ← Track metrics
│   └── ab_testing.py               ← A/B experiments
├── services/
│   └── agent_primer.py             ← Prime agents
├── utils/
│   ├── claude_flow_client.py       ← Memory storage
│   └── reasoningbank_client.py     ← Learning trajectories
└── scripts/
    ├── health-check.sh             ← System health
    ├── test-feedback-loop.py       ← E2E testing
    └── dashboard.py                ← Metrics dashboard

_planning/
└── daily-logs/                     ← Daily log files
    └── 2025-10-21-1430-T-042-implement-rabbitmq-setup.md

.swarm/
└── memory.db                       ← Claude-Flow database

.agentdb/
└── reasoningbank.db                ← ReasoningBank database
```

---

## 🔗 Quick Links

**Architecture Docs**:
- [[task-completion-feedback-loop|Complete Architecture]] (8,500 words)
- [[task-completion-code-examples|Code Examples]] (1,200 lines)
- [[task-completion-integration-guide|Integration Guide]] (1,500 lines)

**Related Features**:
- [[../../features/rabbitmq-message-queue|RabbitMQ Message Queue]]
- [[../../mcp/claude-flow-schema-mapping|Claude-Flow Schema]]
- [[../../mcp/agent-rules|MCP Agent Rules]]

**Phase Planning**:
- [[../../phases/phase-5-mvp-week-1|Phase 5: Week 1]]
- [[../../phases/phase-6-mvp-week-2|Phase 6: Week 2]]

---

## 💡 Pro Tips

1. **Always include confidence_level**: Helps filter high-quality memories
2. **Use consistent task_id format**: `T-XXX`, `D-XXX`, `F-XXX`, etc.
3. **Document patterns explicitly**: Memory extractor looks for numbered lists
4. **Track actual vs estimated difficulty**: Improves time predictions
5. **Store both successes and failures**: Learn from both

---

## 📞 Support

**Issues**:
1. Check logs: `tail -f logs/memory_extractor.log`
2. Run health check: `./scripts/health-check.sh`
3. Review troubleshooting section above
4. Consult integration guide for detailed steps

**Resources**:
- Architecture documentation in `_planning/architecture/`
- Code examples with working implementations
- Integration guide with step-by-step instructions

---

**Document Status**: ✅ **READY FOR USE**
**Last Updated**: 2025-10-21
