---
type: concept
category: architecture
status: active
tags:
  - architecture
  - privacy
  - local-first
  - mvp-scope
related:
  - '[[weaver]]'
  - '[[neural-network-junction]]'
  - '[[knowledge-graph]]'
visual:
  icon: 💡
  cssclasses:
    - type-concept
    - status-active
version: '3.0'
updated_date: '2025-10-28'
icon: 💡
---

# Local-First Architecture

**All data on your machine. All AI interactions benefit from shared local knowledge. Privacy, speed, and ownership without compromise.**

## Core Philosophy

Weave-NN MVP implements **ONLY the local loop**:

1. AI agents generate knowledge (markdown documents)
2. Local knowledge graph captures and interconnects knowledge
3. Agents retrieve from graph to improve future work
4. **Loop closes locally** - no cloud, no external services

This is fundamentally different from cloud-first AI systems where:
- Conversations are isolated
- No persistent memory between sessions
- Privacy concerns with cloud storage
- Network latency for every interaction

## The Local Loop

```
┌──────────────────────────────────────────┐
│         YOUR LOCAL MACHINE               │
│                                          │
│  ┌────────────┐                         │
│  │Claude Code │                         │
│  └─────┬──────┘                         │
│        │                                │
│        ▼                                │
│  ┌────────────┐      ┌──────────────┐  │
│  │  Weaver    │◀────▶│   Obsidian   │  │
│  │  (MCP +    │      │    Vault     │  │
│  │ Workflows) │      │ (Knowledge   │  │
│  └─────┬──────┘      │   Graph)     │  │
│        │             └──────────────┘  │
│        ▼                                │
│  ┌────────────┐                         │
│  │   Git      │                         │
│  │ (Version   │                         │
│  │  Control)  │                         │
│  └────────────┘                         │
│                                          │
└──────────────────────────────────────────┘

     EVERYTHING STAYS LOCAL
     ZERO CLOUD DEPENDENCIES
```

## Key Principles

### 1. Privacy-First

**All data stays on your machine**:
- Knowledge graph: Local markdown files
- AI interactions: Logged locally only
- Workflows: Executed locally
- State: Persisted to local disk

**No cloud services**:
- No remote API calls for knowledge storage
- No third-party analytics
- No external databases
- No cloud backups (unless you choose)

**You control your data**:
- Delete anytime
- Move anywhere
- Export/import freely
- Git-trackable history

### 2. Speed-First

**Zero network latency**:
- Knowledge retrieval: <5ms (local file read)
- Workflow execution: <1ms overhead
- MCP tool calls: <1ms (in-process)

Compare to cloud-first:
- API calls: 50-200ms network latency
- Database queries: 20-100ms roundtrip
- Remote storage: 100-500ms for files

**10-50x faster locally**.

### 3. Ownership-First

**Future-proof storage**:
- Plain text markdown (readable in any editor)
- Standard wikilink syntax
- Git version control
- No proprietary formats
- No vendor lock-in

**Portable**:
- Move to different tool anytime
- Export to any format
- Sync via Git (your choice of remote)
- Backup anywhere

### 4. Composability-First

**Open architecture**:
- Any AI can connect through Weaver's MCP server
- Any tool can read markdown vault
- Any workflow engine can process files
- No API limits, no rate throttling

## Benefits

### For Individuals

**Privacy**:
- Sensitive project knowledge stays private
- No terms-of-service changes can affect you
- No data breaches possible (it's on your machine)

**Control**:
- Work offline anytime
- No subscription dependencies
- Own your data forever

**Performance**:
- Instant knowledge retrieval
- No network latency
- Works on airplane, train, anywhere

### For Teams (Post-MVP)

**Shared but Private**:
- Knowledge graph in shared Git repo
- Team collaborates through PR workflow
- Still local-first (clone + work locally)

**Audit Trail**:
- Git history = complete audit log
- Every change tracked
- Easy rollback

### For Enterprises (Future)

**Compliance**:
- Data never leaves premises
- Meets GDPR/HIPAA requirements
- No cloud vendor risk

**Cost**:
- No per-user SaaS fees
- No API usage costs
- No storage limits

## Architecture Components

All components run locally:

### 1. Obsidian Vault
- **Purpose**: Knowledge graph storage
- **Format**: Markdown + YAML frontmatter
- **Location**: Local filesystem
- **Size**: Scales to 10,000+ notes

### 2. Weaver
- **Purpose**: Neural network junction
- **Runtime**: Node.js process on local machine
- **Port**: Localhost only (3000)
- **State**: Local disk

### 3. Git
- **Purpose**: Version control
- **Location**: Local `.git` directory
- **Remote**: Optional (your choice)

### 4. Shadow Cache (SQLite)
- **Purpose**: Fast queries
- **Storage**: Local `.db` file
- **Size**: <1MB for 1000 notes

## Local Loop Flow

### Task Execution

```
1. Developer requests task
   ↓
2. Claude Code queries Weaver MCP
   ├─→ "get_knowledge" tool call
   └─→ Retrieves relevant context (local)
   ↓
3. Claude executes task with context
   ├─→ Generates code/docs
   └─→ Uses knowledge from previous tasks
   ↓
4. Weaver workflow triggers
   ├─→ Extracts memory from task
   ├─→ Stores in local knowledge graph
   └─→ Updates shadow cache
   ↓
5. Next task benefits from this task's learnings
   └─→ COMPOUND LEARNING (local loop closed)
```

**All steps local. Zero external API calls.**

## Comparison with Cloud-First

| Aspect | Cloud-First AI | Local-First Weave-NN |
|--------|----------------|----------------------|
| **Privacy** | Data on vendor servers | Data on your machine |
| **Speed** | 50-200ms latency | <5ms latency |
| **Cost** | $20-100/month | $0/month |
| **Offline** | ❌ Requires internet | ✅ Works offline |
| **Ownership** | Vendor owns data | You own data |
| **Portability** | Vendor lock-in | Export anytime |
| **Persistence** | Conversation-based | Permanent knowledge graph |
| **Learning** | Isolated per session | Compounds across all sessions |

## When to Add Cloud (Post-MVP)

Local-first doesn't mean **never cloud**. Add cloud only if:

1. **Multi-User Collaboration**: Team needs real-time sync
2. **Accessibility**: Need to access from multiple devices
3. **Backup**: Want automatic remote backups
4. **Scale**: Knowledge graph > 100,000 notes

But even then, **local-first hybrid**:
- Primary data stays local
- Cloud is sync target (not source of truth)
- Can work offline always
- Git-based collaboration (not real-time)

## MVP Scope: Local Loop Only

**What MVP includes**:
- ✅ Local Obsidian vault
- ✅ Local Weaver service
- ✅ Local MCP server
- ✅ Local workflow execution
- ✅ Local file watcher
- ✅ Local shadow cache
- ✅ Optional Git (local + your chosen remote)

**What MVP excludes**:
- ❌ Cloud storage service
- ❌ Web UI (cloud-hosted)
- ❌ Real-time multi-user sync
- ❌ Mobile apps
- ❌ Cloud backup service
- ❌ Remote workflow execution

**Rationale**: Build the core local loop first. Prove compound learning works. Then (maybe) add cloud features if users demand them.





## Related

[[event-driven-architecture]] • [[singleton-pattern-choice]]
## Related

[[neural-network-junction]]
## Related Concepts

- [[concepts/weaver|Weaver (implements local loop)]]
- [[concepts/neural-network-junction|Neural Network Junction]]
- [[concepts/knowledge-graph|Knowledge Graph (local storage)]]

## Related Documentation

- [[docs/local-first-architecture-overview|Local-First Architecture Overview]]
- [[docs/architecture-simplification-complete|Architecture Simplification]]
- [[README|Weave-NN Project (local-first philosophy)]]

---

**Key Insight**: By keeping everything local, we achieve **privacy + speed + ownership** without compromise. The "neural network junction" architecture means multiple AI systems can share knowledge without any cloud infrastructure. This is the optimal starting point for a knowledge management system—add cloud only if absolutely necessary.
