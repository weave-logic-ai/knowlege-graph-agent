---
type: technical-primitive
category: framework
status: in-use
first_used_phase: PHASE-5
mvp_required: true
future_only: false
maturity: stable
used_in_services:
  - mcp-server
  - agent-orchestration
  - task-automation
  - swarm-coordination
deployment: npm-package
alternatives_considered:
  - '[[langchain]]'
  - '[[autogen]]'
  - '[[crewai]]'
replaces: null
replaced_by: null
decision: '[[../decisions/technical/agent-orchestration-framework]]'
architecture: '[[../architecture/agent-coordination-layer]]'
tags:
  - technical
  - framework
  - in-use
  - ai-orchestration
  - swarm-coordination
visual:
  icon: "\U0001F4C4"
  cssclasses:
    - type-technical-primitive
    - status-in-use
version: '3.0'
updated_date: '2025-10-28'
---

# Claude Flow

**Category**: Framework
**Status**: In Use (MVP)
**First Used**: Phase 5, Day 4 (Week 1)

---

## Overview

Claude Flow is an AI orchestration framework that enables multi-agent swarm coordination, memory management, and task automation using Claude AI models. It provides a structured approach to spawning specialized agents with coordination hooks, distributed memory, and neural pattern learning.

**Official Site**: https://github.com/ruvnet/claude-flow
**Documentation**: https://github.com/ruvnet/claude-flow#readme

---

## Why We Use It

Claude Flow enables Weave-NN's agent-driven automation by providing:
- **Multi-Agent Coordination**: Spawn specialized agents (researcher, coder, tester, reviewer) that work together
- **Memory Management**: Cross-session persistent memory for agent context and knowledge sharing
- **Task Orchestration**: Parallel and sequential task execution with dependency management
- **Coordination Hooks**: Pre/post-operation hooks for automatic state management

**Primary Purpose**: MCP server uses Claude Flow hooks to enable agent rule execution with coordination

**Specific Use Cases**:
- Agent spawn coordination in [[../architecture/mcp-server]] for rule-based automation
- Memory management for cross-agent knowledge sharing
- Task orchestration for parallel agent execution
- Neural pattern learning from agent interactions

---

## Key Capabilities

- **8 Core Agent Types**: Researcher, Coder, Analyst, Optimizer, Coordinator, Tester, Reviewer, Planner
- **6 Coordination Rules**: Pre-task, post-edit, post-task, session-restore, notify, session-end
- **Swarm Topologies**: Mesh (peer-to-peer), Hierarchical (tree), Ring (circular), Star (centralized)
- **Memory Persistence**: Cross-session memory storage with namespaces and TTL
- **Neural Training**: 27+ neural models for adaptive learning from agent patterns
- **GitHub Integration**: Repository analysis, PR enhancement, issue triage
- **Performance Tracking**: Token usage, execution time, bottleneck analysis

---

## Integration Points

**Used By**:
- [[../architecture/mcp-server]] - Coordinates agent execution via hooks
- [[../features/agent-driven-task-automation]] - Orchestrates specialized agents
- [[../architecture/agent-coordination-layer]] - Manages swarm topology and memory

**Integrates With**:
- [[fastapi]] - MCP server endpoints trigger Claude Flow operations
- [[pyyaml]] - Parses YAML frontmatter for agent rule configurations
- [[obsidian-local-rest-api-plugin]] - Agents read/write vault content

**Enables Features**:
- [[../features/agent-driven-task-automation]] - Multi-agent workflow execution
- [[../features/daily-log-automation]] - Automated daily summaries via agents

---

## Configuration

**NPM Installation** (MVP):
```bash
# Install globally
npm install -g claude-flow@alpha

# Or add as MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

**Environment Variables**:
- `ANTHROPIC_API_KEY`: Claude AI API key (required)
- `CLAUDE_FLOW_MEMORY_DIR`: Memory storage directory (default: `~/.claude-flow/memory`)
- `CLAUDE_FLOW_SESSION_DIR`: Session state directory (default: `~/.claude-flow/sessions`)

**Key Configuration Files**:
- `.claude-flow/config.yml` - Swarm topology and agent configurations
- `.claude-flow/memory/` - Persistent cross-session memory storage

**MCP Server Configuration** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "claude-flow": {
      "command": "npx",
      "args": ["claude-flow@alpha", "mcp", "start"]
    }
  }
}
```

---

## Deployment

**MVP (Phase 5-6)**: NPM package installed globally or via MCP server
**v1.0 (Post-MVP)**: Self-hosted orchestration service with distributed coordination

**Resource Requirements**:
- RAM: 512 MB (memory storage)
- CPU: 1 core (hook processing)
- Storage: 1 GB (session state + memory)

**Health Check**:
```bash
# Verify Claude Flow is available
npx claude-flow@alpha --version

# Check MCP server status
npx claude-flow@alpha mcp status

# Test agent spawn
npx claude-flow@alpha hooks pre-task --description "test"
```

---

## Trade-offs

**Pros** (Why we chose it):
- ✅ **SPARC Methodology**: Built-in support for Specification, Pseudocode, Architecture, Refinement, Completion
- ✅ **Coordination Hooks**: Automatic state management via pre/post-operation hooks
- ✅ **Memory Management**: Cross-session persistent memory for agent context
- ✅ **Performance**: 2.8-4.4x speed improvement over sequential execution
- ✅ **Neural Learning**: Adaptive patterns trained from successful workflows
- ✅ **MCP Integration**: Native MCP server for Claude Desktop integration

**Cons** (What we accepted):
- ⚠️ **Alpha Version**: Still in active development, may have breaking changes - mitigated by pinning to `@alpha` tag
- ⚠️ **API Costs**: Each agent spawn requires Claude API calls - acceptable because enables automation value
- ⚠️ **Complexity**: Coordination hooks require understanding of agent lifecycle - mitigated by clear documentation

---

## Alternatives Considered

**Compared With**:

### [[langchain]]
- **Pros**: Mature ecosystem, multi-LLM support, extensive integrations
- **Cons**: More complex setup, lacks built-in swarm coordination, no SPARC methodology
- **Decision**: Rejected because Claude Flow is purpose-built for Claude AI with better coordination

### [[autogen]]
- **Pros**: Multi-agent conversations, Microsoft backing, flexible agent design
- **Cons**: Complex configuration, less focused on file-based workflows, no native MCP support
- **Decision**: Rejected because Claude Flow's hooks model better fits Obsidian vault automation

### [[crewai]]
- **Pros**: Agent role specialization, task delegation, process automation
- **Cons**: More opinionated framework, harder to customize, less Obsidian-friendly
- **Decision**: Rejected because Claude Flow's lightweight hooks approach better fits MVP needs

---

## Decision History

**Decision Record**: [[../decisions/technical/agent-orchestration-framework]]

**Key Reasoning**:
> Claude Flow was chosen for Phase 5 Day 4 because it provides the best balance of SPARC methodology support, coordination hooks for MCP integration, and cross-session memory management. The hooks model (pre-task, post-edit, post-task) aligns perfectly with Weave-NN's need to coordinate agents around Obsidian vault operations.

**Date Decided**: 2025-10-22
**Decided By**: System Architect

---

## Phase Usage

### Phase 5 (MVP Week 1) - In Use
**Day 4**: Claude Flow integrated into MCP server for agent coordination
- Swarm initialization with mesh topology for peer-to-peer coordination
- Agent spawn hooks for researcher, coder, tester, reviewer types
- Memory storage for cross-agent knowledge sharing
- Pre-task/post-task hooks for automatic state management

### Phase 6 (MVP Week 2) - Planned Expansion
- Neural pattern training from successful agent workflows
- GitHub integration for automated PR reviews
- Performance benchmarking for bottleneck detection
- Advanced swarm topologies (hierarchical for complex tasks)

### Phase 7 (v1.0) - Future Enhancement
- Distributed swarm coordination across multiple MCP servers
- Advanced neural models for task prediction
- Custom agent types for domain-specific automation
- Production-grade orchestration with fault tolerance

---

## Learning Resources

**Official Documentation**:
- [Claude Flow GitHub Repository](https://github.com/ruvnet/claude-flow)
- [MCP Server Documentation](https://github.com/ruvnet/claude-flow/blob/main/docs/mcp-server.md)
- [Hooks API Reference](https://github.com/ruvnet/claude-flow/blob/main/docs/hooks.md)

**Tutorials**:
- [Getting Started with Claude Flow](https://github.com/ruvnet/claude-flow#quick-start)
- [SPARC Methodology Guide](https://github.com/ruvnet/claude-flow/blob/main/docs/sparc.md)
- [Multi-Agent Swarm Coordination](https://github.com/ruvnet/claude-flow/blob/main/docs/swarms.md)

**Best Practices**:
- [Agent Coordination Patterns](https://github.com/ruvnet/claude-flow/blob/main/docs/patterns.md)
- [Memory Management Best Practices](https://github.com/ruvnet/claude-flow/blob/main/docs/memory.md)
- [Production Deployment Guide](https://github.com/ruvnet/claude-flow/blob/main/docs/production.md)

**Community**:
- [GitHub Issues](https://github.com/ruvnet/claude-flow/issues)
- [Discussions Forum](https://github.com/ruvnet/claude-flow/discussions)

---

## Monitoring & Troubleshooting

**Health Checks**:
```bash
# Check if Claude Flow is installed
which claude-flow

# Verify version
npx claude-flow@alpha --version

# Check MCP server status
npx claude-flow@alpha mcp status

# Test agent spawn
npx claude-flow@alpha hooks pre-task --description "test"

# View memory storage
ls -la ~/.claude-flow/memory/

# Check session state
npx claude-flow@alpha hooks session-restore --session-id test
```

**Common Issues**:
1. **Issue**: `ANTHROPIC_API_KEY not set` error
   **Solution**: Set environment variable: `export ANTHROPIC_API_KEY=your-key-here`

2. **Issue**: Agent spawn times out
   **Solution**: Check Claude API rate limits, ensure API key is valid

3. **Issue**: Memory not persisting across sessions
   **Solution**: Verify `CLAUDE_FLOW_MEMORY_DIR` exists and has write permissions

4. **Issue**: Hooks not triggering
   **Solution**: Ensure MCP server is running, check `claude-flow mcp status`

---

## Code Examples

### Basic Swarm Initialization
```bash
# Initialize mesh topology swarm
npx claude-flow@alpha swarm init mesh --max-agents 8

# Spawn specialized agents
npx claude-flow@alpha agent spawn researcher --capabilities "analysis,research"
npx claude-flow@alpha agent spawn coder --capabilities "implementation,testing"
```

### Coordination Hooks
```bash
# Pre-task hook (before agent starts work)
npx claude-flow@alpha hooks pre-task --description "Analyze API requirements"

# Post-edit hook (after file modification)
npx claude-flow@alpha hooks post-edit --file "src/api.py" --memory-key "swarm/coder/api-design"

# Post-task hook (after agent completes)
npx claude-flow@alpha hooks post-task --task-id "task-123"

# Session management
npx claude-flow@alpha hooks session-restore --session-id "swarm-001"
npx claude-flow@alpha hooks session-end --export-metrics true
```

### Memory Operations
```bash
# Store knowledge in memory
npx claude-flow@alpha memory store --key "api/design" --value "REST endpoints with authentication"

# Retrieve from memory
npx claude-flow@alpha memory retrieve --key "api/design"

# List all memory entries
npx claude-flow@alpha memory list --namespace "swarm"
```

### Task Orchestration
```bash
# Orchestrate parallel tasks
npx claude-flow@alpha task orchestrate "Build REST API" --strategy parallel --max-agents 4

# Check task status
npx claude-flow@alpha task status --task-id "task-123"

# Get task results
npx claude-flow@alpha task results --task-id "task-123"
```

---

## Related Nodes

**Architecture**:
- [[../architecture/mcp-server]] - Uses Claude Flow hooks for coordination
- [[../architecture/agent-coordination-layer]] - Manages swarm topology

**Features**:
- [[../features/agent-driven-task-automation]] - Enabled by Claude Flow orchestration
- [[../features/daily-log-automation]] - Uses agents for automated summaries

**Decisions**:
- [[../decisions/technical/agent-orchestration-framework]] - Why we chose Claude Flow

**Other Primitives**:
- [[fastapi]] - MCP server framework that integrates with Claude Flow
- [[pyyaml]] - Parses agent rule configurations
- [[obsidian-local-rest-api-plugin]] - Agents access vault via REST API

---

## Revisit Criteria

**Reconsider this technology if**:
- Agent orchestration latency exceeds 5 seconds per spawn (performance threshold)
- API costs exceed $100/month for typical automation workflows (cost threshold)
- Breaking changes in `@alpha` version cause production issues (stability threshold)
- Better alternative emerges with native Obsidian plugin support (ecosystem improvement)

**Scheduled Review**: 2026-04-01 (6 months after v1.0 launch)

---

**Back to**: [[README|Technical Primitives Index]]
