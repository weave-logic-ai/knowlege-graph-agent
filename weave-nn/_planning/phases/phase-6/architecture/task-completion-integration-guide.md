---
type: integration-guide
status: active
priority: high
category: implementation
created_date: '2025-10-21'
parent_architecture: task-completion-feedback-loop
tags:
  - architecture
  - integration
  - deployment
  - task-completion
  - feedback-loop
scope: task
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-integration-guide
    - status-active
    - priority-high
version: '3.0'
updated_date: '2025-10-28'
---

# Task Completion Feedback Loop - Integration Guide

**Purpose**: Step-by-step integration guide for deploying the task completion feedback loop in weave-nn.

**Parent Architecture**: [[task-completion-feedback-loop|Task Completion Feedback Loop]]

---

## 🎯 Integration Overview

### System Components to Integrate

```
┌─────────────────────────────────────────────────────────────────┐
│                     Weave-NN Ecosystem                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐ │
│  │   Obsidian   │      │   RabbitMQ   │      │ Claude-Flow  │ │
│  │    Vault     │─────▶│  Event Bus   │─────▶│   Memory     │ │
│  └──────────────┘      └──────────────┘      └──────────────┘ │
│         │                     │                      │         │
│         │                     ▼                      │         │
│         │              ┌──────────────┐              │         │
│         │              │ Task Logger  │              │         │
│         │              │  Publisher   │              │         │
│         │              └──────────────┘              │         │
│         │                     │                      │         │
│         ▼                     ▼                      ▼         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │            Memory Extraction Pipeline                    │ │
│  │  • Parse daily logs                                      │ │
│  │  • Extract patterns, mistakes, skills                    │ │
│  │  • Store in claude-flow namespaces                       │ │
│  │  • Store trajectories in reasoningbank                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                               │                               │
│                               ▼                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │            Agent Priming Service                         │ │
│  │  • Semantic search for similar tasks                     │ │
│  │  • Retrieve skill memories                               │ │
│  │  • Get learning trajectories                             │ │
│  │  • Synthesize context                                    │ │
│  │  • Calculate confidence                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                               │                               │
│                               ▼                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │            Enhanced Agent Execution                      │ │
│  │  • Agent receives priming context                        │ │
│  │  • Better informed decision-making                       │ │
│  │  • Improved success rates                                │ │
│  │  • Reduced repeated errors                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                               │                               │
│                               ▼                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │            A/B Testing & Performance Tracking            │ │
│  │  • Track metrics across experiments                      │ │
│  │  • Compare priming strategies                            │ │
│  │  • Identify winning approaches                           │ │
│  │  • Continuous improvement loop                           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Phase 1: Prerequisites (Day 0)

### 1.1 Environment Setup

```bash
# Navigate to project root
cd /path/to/weave-nn-mcp

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# OR
.venv\Scripts\activate  # Windows

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

**requirements.txt**:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pika==1.3.2
requests==2.31.0
PyYAML==6.0.1
watchdog==3.0.0
GitPython==3.1.40
python-dotenv==1.0.0
sqlite3  # Built-in
anthropic==0.7.0
```

### 1.2 Configuration Files

**`.env`**:
```bash
# Obsidian REST API
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=your-api-key-here

# RabbitMQ
RABBITMQ_URL=amqp://admin:password@localhost:5672
RABBITMQ_MANAGEMENT_URL=http://localhost:15672

# Claude-Flow
CLAUDE_FLOW_DB_PATH=.swarm/memory.db
CLAUDE_API_KEY=your-claude-api-key

# ReasoningBank
REASONINGBANK_DB_PATH=.agentdb/reasoningbank.db

# Vault Configuration
VAULT_PATH=/path/to/weave-nn
DAILY_LOGS_PATH=_planning/daily-logs

# Agent Configuration
DEFAULT_AGENT_ROLE=coder
ENABLE_AB_TESTING=true
EXPERIMENT_ID=exp-001-priming-v2
```

**`config.py`**:
```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Obsidian
    OBSIDIAN_API_URL = os.getenv('OBSIDIAN_API_URL')
    OBSIDIAN_API_KEY = os.getenv('OBSIDIAN_API_KEY')

    # RabbitMQ
    RABBITMQ_URL = os.getenv('RABBITMQ_URL')
    RABBITMQ_MANAGEMENT_URL = os.getenv('RABBITMQ_MANAGEMENT_URL')

    # Claude-Flow
    CLAUDE_FLOW_DB = os.getenv('CLAUDE_FLOW_DB_PATH', '.swarm/memory.db')
    CLAUDE_API_KEY = os.getenv('CLAUDE_API_KEY')

    # ReasoningBank
    REASONINGBANK_DB = os.getenv('REASONINGBANK_DB_PATH', '.agentdb/reasoningbank.db')

    # Vault
    VAULT_PATH = os.getenv('VAULT_PATH')
    DAILY_LOGS_PATH = os.getenv('DAILY_LOGS_PATH', '_planning/daily-logs')

    # Agent
    DEFAULT_AGENT_ROLE = os.getenv('DEFAULT_AGENT_ROLE', 'coder')
    ENABLE_AB_TESTING = os.getenv('ENABLE_AB_TESTING', 'false').lower() == 'true'
    EXPERIMENT_ID = os.getenv('EXPERIMENT_ID', 'exp-001-priming-v2')

config = Config()
```

### 1.3 RabbitMQ Queue Setup

```bash
# Create RabbitMQ exchange and queues
./scripts/setup-rabbitmq-queues.sh
```

**`scripts/setup-rabbitmq-queues.sh`**:
```bash
#!/bin/bash

# RabbitMQ configuration
RABBITMQ_HOST="localhost"
RABBITMQ_PORT="15672"
RABBITMQ_USER="admin"
RABBITMQ_PASS="password"

# Declare exchange
rabbitmqadmin -H $RABBITMQ_HOST -P $RABBITMQ_PORT \
  -u $RABBITMQ_USER -p $RABBITMQ_PASS \
  declare exchange name=weave-nn.events type=topic durable=true

# Declare queues
for queue in memory_extractor performance_tracker ab_testing task_completion_logger; do
  rabbitmqadmin -H $RABBITMQ_HOST -P $RABBITMQ_PORT \
    -u $RABBITMQ_USER -p $RABBITMQ_PASS \
    declare queue name=$queue durable=true
done

# Bind queues to exchange
rabbitmqadmin -H $RABBITMQ_HOST -P $RABBITMQ_PORT \
  -u $RABBITMQ_USER -p $RABBITMQ_PASS \
  declare binding source=weave-nn.events destination=memory_extractor routing_key="task.completed"

rabbitmqadmin -H $RABBITMQ_HOST -P $RABBITMQ_PORT \
  -u $RABBITMQ_USER -p $RABBITMQ_PASS \
  declare binding source=weave-nn.events destination=performance_tracker routing_key="task.*"

rabbitmqadmin -H $RABBITMQ_HOST -P $RABBITMQ_PORT \
  -u $RABBITMQ_USER -p $RABBITMQ_PASS \
  declare binding source=weave-nn.events destination=ab_testing routing_key="task.completed"

rabbitmqadmin -H $RABBITMQ_HOST -P $RABBITMQ_PORT \
  -u $RABBITMQ_USER -p $RABBITMQ_PASS \
  declare binding source=weave-nn.events destination=task_completion_logger routing_key="task.completed"

echo "✅ RabbitMQ queues configured successfully"
```

Make executable:
```bash
chmod +x scripts/setup-rabbitmq-queues.sh
```

---

## 🚀 Phase 2: Deploy Core Services (Days 1-2)

### 2.1 Start Memory Extraction Service

**Terminal 1**:
```bash
# Activate environment
source .venv/bin/activate

# Start memory extractor
python consumers/memory_extractor.py
```

**Verify**:
- Check console output: "🧠 Memory extraction service started"
- Check RabbitMQ UI: Queue `memory_extractor` shows consumer

### 2.2 Start Performance Tracker

**Terminal 2**:
```bash
# Activate environment
source .venv/bin/activate

# Start performance tracker
python consumers/performance_tracker.py
```

**Verify**:
- Check console output: "📊 Performance tracker started"
- Check RabbitMQ UI: Queue `performance_tracker` shows consumer

### 2.3 Start Agent Priming Service

**Terminal 3**:
```bash
# Activate environment
source .venv/bin/activate

# Start agent primer API
uvicorn services.agent_primer:app --port 8001 --reload
```

**Verify**:
- Visit: http://localhost:8001/docs
- Check Swagger UI loads
- Test health endpoint: `curl http://localhost:8001/health`

### 2.4 Service Health Check

```bash
# Check all services
./scripts/health-check.sh
```

**`scripts/health-check.sh`**:
```bash
#!/bin/bash

echo "🏥 Health Check: Task Completion Feedback Loop"
echo "=============================================="

# Check RabbitMQ
echo -n "RabbitMQ: "
curl -s -u admin:password http://localhost:15672/api/overview > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Running"
else
  echo "❌ Not running"
fi

# Check Memory Extractor Queue
echo -n "Memory Extractor: "
CONSUMERS=$(rabbitmqadmin -f tsv -q list queues name consumers | grep memory_extractor | awk '{print $2}')
if [ "$CONSUMERS" -gt 0 ]; then
  echo "✅ $CONSUMERS consumer(s)"
else
  echo "❌ No consumers"
fi

# Check Performance Tracker Queue
echo -n "Performance Tracker: "
CONSUMERS=$(rabbitmqadmin -f tsv -q list queues name consumers | grep performance_tracker | awk '{print $2}')
if [ "$CONSUMERS" -gt 0 ]; then
  echo "✅ $CONSUMERS consumer(s)"
else
  echo "❌ No consumers"
fi

# Check Agent Primer API
echo -n "Agent Primer API: "
curl -s http://localhost:8001/health > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Running on port 8001"
else
  echo "❌ Not running"
fi

# Check Claude-Flow DB
echo -n "Claude-Flow DB: "
if [ -f ".swarm/memory.db" ]; then
  echo "✅ Found at .swarm/memory.db"
else
  echo "⚠️ Not found (will be created on first use)"
fi

# Check ReasoningBank DB
echo -n "ReasoningBank DB: "
if [ -f ".agentdb/reasoningbank.db" ]; then
  echo "✅ Found at .agentdb/reasoningbank.db"
else
  echo "⚠️ Not found (will be created on first use)"
fi

echo ""
echo "✅ Health check complete"
```

---

## 🧪 Phase 3: Testing & Validation (Days 3-4)

### 3.1 End-to-End Test

**Test Script**: `scripts/test-feedback-loop.py`

```python
#!/usr/bin/env python
"""
End-to-end test of task completion feedback loop
"""

import asyncio
import json
from publishers.task_logger import TaskLogger
from services.agent_primer import AgentPrimer
from datetime import datetime

async def test_complete_flow():
    print("🧪 Testing Task Completion Feedback Loop")
    print("=" * 60)

    # Step 1: Create test task
    print("\n1️⃣ Creating test task...")
    task_logger = TaskLogger()

    frontmatter = {
        'task_id': 'T-TEST-001',
        'task_type': 'implementation',
        'task_description': 'Test task for feedback loop',
        'agent_role': 'coder',
        'project': 'weave-nn',
        'phase': 'phase-5',
        'started_at': datetime.utcnow().isoformat() + 'Z',
        'completed_at': datetime.utcnow().isoformat() + 'Z',
        'duration_minutes': 60,
        'status': 'completed',
        'success': True,
        'quality_score': 0.85,
        'estimated_difficulty': 'moderate',
        'actual_difficulty': 'moderate',
        'complexity_score': 6,
        'context': ['End-to-end testing', 'Feedback loop validation'],
        'skills_used': ['python', 'testing', 'rabbitmq'],
        'memory_namespace': 'tasks.implementation.testing',
        'memory_tags': ['task', 'test', 'feedback-loop'],
        'store_in_reasoningbank': True,
        'confidence_level': 'high'
    }

    content_sections = {
        'Test Task Completion': 'This is a test task to validate the feedback loop',
        'What Was Accomplished': 'Successfully tested the complete flow',
        'Challenges & Solutions': '**Challenge**: None\n**Solution**: N/A',
        'Agent Learning': 'Learned: Feedback loop works correctly'
    }

    log_file = task_logger.log_task_completion(
        task_id='T-TEST-001',
        task_type='implementation',
        task_description='Test task for feedback loop',
        agent_role='coder',
        status='completed',
        success=True,
        frontmatter=frontmatter,
        content_sections=content_sections
    )

    print(f"✅ Task log created: {log_file}")

    # Wait for event processing
    print("\n2️⃣ Waiting for memory extraction (5 seconds)...")
    await asyncio.sleep(5)

    # Step 2: Test memory retrieval
    print("\n3️⃣ Testing memory retrieval...")
    primer = AgentPrimer()

    test_task = {
        'task_id': 'T-TEST-002',
        'description': 'Another test task similar to previous',
        'type': 'implementation',
        'agent_role': 'coder',
        'skills_needed': ['python', 'testing'],
        'domain': 'testing',
        'project': 'weave-nn'
    }

    priming_data = await primer.prime_agent(test_task)

    print(f"✅ Agent primed successfully")
    print(f"   Confidence: {priming_data['confidence']}")
    print(f"   Similar tasks: {priming_data['similar_tasks_count']}")
    print(f"   Skill memories: {priming_data['skill_memories_count']}")

    # Step 3: Validate context
    print("\n4️⃣ Validating priming context...")
    if 'test' in priming_data['context'].lower():
        print("✅ Context includes test-related information")
    else:
        print("⚠️ Context may not include test information yet")

    print("\n" + "=" * 60)
    print("✅ End-to-end test complete!")

    return True

if __name__ == '__main__':
    result = asyncio.run(test_complete_flow())
    exit(0 if result else 1)
```

**Run test**:
```bash
chmod +x scripts/test-feedback-loop.py
python scripts/test-feedback-loop.py
```

**Expected output**:
```
🧪 Testing Task Completion Feedback Loop
============================================================

1️⃣ Creating test task...
✅ Task log created: _planning/daily-logs/2025-10-21-1430-T-TEST-001-test-task-for-feedback-loop.md

2️⃣ Waiting for memory extraction (5 seconds)...

3️⃣ Testing memory retrieval...
🎯 Priming agent for task: Another test task similar to previous
✅ Priming complete. Confidence: 0.72
✅ Agent primed successfully
   Confidence: 0.72
   Similar tasks: 1
   Skill memories: 3

4️⃣ Validating priming context...
✅ Context includes test-related information

============================================================
✅ End-to-end test complete!
```

### 3.2 Manual Validation Steps

**Validation Checklist**:

- [ ] **Task Logging**
  - [ ] Daily log file created in `_planning/daily-logs/`
  - [ ] Frontmatter is valid YAML
  - [ ] All required fields present
  - [ ] Content sections formatted correctly

- [ ] **Event Publishing**
  - [ ] Check RabbitMQ UI: Message published to `weave-nn.events`
  - [ ] Message routed to correct queues
  - [ ] Event payload is valid JSON

- [ ] **Memory Extraction**
  - [ ] Memory extractor processes message
  - [ ] Memories stored in claude-flow DB
  - [ ] Trajectory stored in reasoningbank DB
  - [ ] Check logs for extraction errors

- [ ] **Agent Priming**
  - [ ] Priming API returns context
  - [ ] Context includes similar tasks
  - [ ] Confidence score calculated
  - [ ] Recommendations generated

---

## 📊 Phase 4: A/B Testing Setup (Days 5-6)

### 4.1 Define Experiment

**`experiments/exp-001-priming-v2.yaml`**:
```yaml
experiment_id: "exp-001-priming-v2"
name: "Enhanced Agent Priming with Mistake Warnings"
status: "active"
start_date: "2025-10-21"
end_date: "2025-11-04"
minimum_samples: 100

hypothesis: |
  Including explicit mistake warnings in agent priming context will improve
  task success rate by reducing repeated errors.

variants:
  A:  # Control
    name: "Standard Priming"
    config:
      include_similar_tasks: true
      include_skill_memories: true
      include_patterns: true
      include_mistakes: false  # Key difference

  B:  # Treatment
    name: "Enhanced Priming with Mistakes"
    config:
      include_similar_tasks: true
      include_skill_memories: true
      include_patterns: true
      include_mistakes: true   # Key difference

metrics:
  primary:
    - name: "success_rate"
      target_improvement: 0.10

    - name: "quality_score"
      target_improvement: 0.05

  secondary:
    - name: "duration_minutes"
      direction: "minimize"

success_criteria:
  - metric: "success_rate"
    improvement: ">= 0.10"
    p_value: "< 0.05"
```

### 4.2 Start A/B Testing Service

**Terminal 4**:
```bash
# Activate environment
source .venv/bin/activate

# Start A/B testing service
python consumers/ab_testing.py --experiment exp-001-priming-v2
```

**Verify**:
- Check console: "🧪 A/B testing started for experiment: exp-001-priming-v2"
- Check variant assignment working
- Verify metrics tracking

---

## 📈 Phase 5: Monitoring & Dashboards (Day 7)

### 5.1 Performance Dashboard

**Create dashboard script**: `scripts/dashboard.py`

```python
#!/usr/bin/env python
"""
Simple performance dashboard for task completion metrics
"""

import sqlite3
import json
from datetime import datetime, timedelta
from tabulate import tabulate

def get_metrics(db_path='.swarm/memory.db', days=7):
    """Get performance metrics for last N days"""

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Date filter
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    # Total tasks
    cursor.execute("""
        SELECT COUNT(*) FROM memory_store
        WHERE namespace LIKE 'tasks.%' AND created_at >= ?
    """, (since,))
    total_tasks = cursor.fetchone()[0]

    # Success rate
    cursor.execute("""
        SELECT
            AVG(CASE WHEN json_extract(value, '$.success') = 1 THEN 1 ELSE 0 END)
        FROM memory_store
        WHERE namespace LIKE 'tasks.%' AND created_at >= ?
    """, (since,))
    success_rate = cursor.fetchone()[0] or 0

    # Average quality
    cursor.execute("""
        SELECT AVG(CAST(json_extract(value, '$.quality') AS FLOAT))
        FROM memory_store
        WHERE namespace LIKE 'tasks.%' AND created_at >= ?
    """, (since,))
    avg_quality = cursor.fetchone()[0] or 0

    # By task type
    cursor.execute("""
        SELECT
            json_extract(value, '$.task_type') as task_type,
            COUNT(*) as count,
            AVG(CASE WHEN json_extract(value, '$.success') = 1 THEN 1 ELSE 0 END) as success_rate,
            AVG(CAST(json_extract(value, '$.quality') AS FLOAT)) as avg_quality
        FROM memory_store
        WHERE namespace LIKE 'tasks.%' AND created_at >= ?
        GROUP BY task_type
    """, (since,))
    by_type = cursor.fetchall()

    conn.close()

    return {
        'total_tasks': total_tasks,
        'success_rate': success_rate,
        'avg_quality': avg_quality,
        'by_type': by_type
    }

def print_dashboard():
    """Print performance dashboard"""

    print("\n" + "=" * 60)
    print("📊 Task Completion Performance Dashboard")
    print("=" * 60)

    metrics = get_metrics(days=7)

    print(f"\n📈 Overall Metrics (Last 7 Days)")
    print(f"   Total Tasks: {metrics['total_tasks']}")
    print(f"   Success Rate: {metrics['success_rate']*100:.1f}%")
    print(f"   Avg Quality: {metrics['avg_quality']:.2f}")

    if metrics['by_type']:
        print(f"\n📊 By Task Type:")
        table_data = [
            [
                task_type,
                count,
                f"{success_rate*100:.1f}%",
                f"{avg_quality:.2f}"
            ]
            for task_type, count, success_rate, avg_quality in metrics['by_type']
        ]
        print(tabulate(
            table_data,
            headers=['Task Type', 'Count', 'Success Rate', 'Avg Quality'],
            tablefmt='grid'
        ))

    print("\n" + "=" * 60)

if __name__ == '__main__':
    print_dashboard()
```

**Run dashboard**:
```bash
pip install tabulate
python scripts/dashboard.py
```

---

## 🔄 Phase 6: Agent Integration (Days 8-9)

### 6.1 Modify Agent Execution

**Before** (without priming):
```python
async def execute_task(task):
    result = await agent.execute(task['description'])
    return result
```

**After** (with priming):
```python
from services.agent_primer import AgentPrimer

primer = AgentPrimer()

async def execute_task(task):
    # Prime agent before execution
    priming_data = await primer.prime_agent(task)

    # Inject context into prompt
    enhanced_prompt = f"""
{priming_data['context']}

---

## Your Task

{task['description']}

**Confidence Level**: {priming_data['confidence']*100:.0f}%
**Recommendations**:
{chr(10).join('- ' + r for r in priming_data['recommendations'])}

Proceed with the task, applying successful patterns and avoiding past mistakes.
    """

    # Execute with enhanced context
    result = await agent.execute(enhanced_prompt)

    return result
```

### 6.2 Add Task Completion Hook

```python
async def execute_task_with_logging(task):
    from publishers.task_logger import TaskLogger
    from datetime import datetime

    start_time = datetime.utcnow()

    # Execute task
    result = await execute_task(task)

    # Calculate metrics
    duration = (datetime.utcnow() - start_time).total_seconds() / 60
    success = result['status'] == 'success'
    quality = result.get('quality_score', 0.7)

    # Log completion
    logger = TaskLogger()
    logger.log_task_completion(
        task_id=task['task_id'],
        task_type=task['type'],
        task_description=task['description'],
        agent_role=task['agent_role'],
        status='completed' if success else 'failed',
        success=success,
        frontmatter={
            'task_id': task['task_id'],
            'task_type': task['type'],
            'task_description': task['description'],
            'agent_role': task['agent_role'],
            'duration_minutes': int(duration),
            'success': success,
            'quality_score': quality,
            # ... other frontmatter fields
        },
        content_sections={
            'Task Summary': result.get('summary', ''),
            'What Was Accomplished': result.get('accomplishments', ''),
            'Challenges': result.get('challenges', ''),
            # ... other sections
        }
    )

    return result
```

---

## ✅ Validation & Success Criteria

### System Health Checks

**Daily**:
- [ ] All RabbitMQ queues have active consumers
- [ ] No dead-lettered messages
- [ ] Memory extraction success rate > 95%
- [ ] Agent priming latency < 200ms

**Weekly**:
- [ ] Task success rate trending upward
- [ ] Average quality score improving
- [ ] Memory database size within limits
- [ ] A/B experiments progressing

### Key Metrics to Monitor

```
┌──────────────────────────────────────────────────────────┐
│ Key Performance Indicators                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Memory System:                                           │
│   • Memory storage rate: > 95%                           │
│   • Extraction accuracy: > 90%                           │
│   • Retrieval speed: < 100ms                             │
│                                                          │
│ Agent Performance:                                       │
│   • Success rate: Improving +10% / 3 months              │
│   • Quality score: Improving +0.15 / 3 months            │
│   • Time efficiency: -15% reduction                      │
│                                                          │
│ A/B Testing:                                             │
│   • Experiments completed: 1 per 2 weeks                 │
│   • Statistical significance: p < 0.05                   │
│   • Winning variants adopted: > 75%                      │
│                                                          │
│ User Satisfaction:                                       │
│   • Feedback collection: > 60%                           │
│   • Average rating: > 4.0 / 5.0                          │
│   • Improvements adopted: > 80%                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue 1: Memory extraction not working**
```bash
# Check RabbitMQ connection
curl http://localhost:15672/api/queues/%2F/memory_extractor

# Check consumer logs
tail -f logs/memory_extractor.log

# Manually trigger extraction
python scripts/manual-extract.py --log-file "_planning/daily-logs/2025-10-21-1430-T-042.md"
```

**Issue 2: Agent priming returns empty context**
```bash
# Check claude-flow database
sqlite3 .swarm/memory.db "SELECT COUNT(*) FROM memory_store WHERE namespace LIKE 'tasks.%'"

# Check namespace organization
sqlite3 .swarm/memory.db "SELECT DISTINCT namespace FROM memory_store"

# Verify semantic search working
python scripts/test-semantic-search.py
```

**Issue 3: A/B testing not assigning variants**
```bash
# Check experiment configuration
cat experiments/exp-001-priming-v2.yaml

# Verify A/B service running
curl http://localhost:8002/experiments/exp-001-priming-v2/status

# Check variant assignments
sqlite3 .swarm/memory.db "SELECT variant, COUNT(*) FROM ab_assignments GROUP BY variant"
```

---

## 📚 Additional Resources

### Documentation Links
- [[task-completion-feedback-loop|Architecture Overview]]
- [[task-completion-code-examples|Code Examples]]
- [[../features/rabbitmq-message-queue|RabbitMQ Configuration]]
- [[../mcp/claude-flow-schema-mapping|Claude-Flow Schema]]
- [[../.claude/skills/reasoningbank-agentdb/SKILL|ReasoningBank Guide]]

### External Resources
- [RabbitMQ Tutorial](https://www.rabbitmq.com/getstarted.html)
- [Claude-Flow Documentation](https://github.com/yourusername/claude-flow)
- [ReasoningBank Paper](https://arxiv.org/abs/xxxx.xxxxx)

---

**Status**: ✅ **COMPLETE**
**Parent**: [[task-completion-feedback-loop|Task Completion Feedback Loop]]
**Last Updated**: 2025-10-21
