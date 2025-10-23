---
type: decision
decision_id: D-007
decision_type: technical
title: FastMCP Framework for MCP Server
status: obsolete
created_date: 2025-10-21
decided_date: 2025-10-21
obsolete_date: 2025-10-23
replaced_by: D-021 (JavaScript/TypeScript Stack Pivot)
tags:
  - mcp
  - python
  - framework
  - obsolete
related_concepts:
  - "[[C-001-weave-nn-core]]"
  - "[[C-008-agent-coordination]]"
related_features:
  - "[[F-001-mcp-server]]"
phase: phase-0
priority: high
impact: high
cssclasses:
  - decision
  - obsolete
  - technical
---

# Decision: FastMCP Framework for MCP Server (OBSOLETE)

## Decision Summary

**Framework Chosen**: FastMCP (Python framework for MCP servers)

**Date Decided**: 2025-10-21
**Date Obsoleted**: 2025-10-23
**Status**: ❌ OBSOLETE
**Replaced By**: [[javascript-typescript-stack-pivot|D-021: JavaScript/TypeScript Stack Pivot]]
**Impact**: 🟡 HIGH (at time of decision)

---

## ⚠️ OBSOLESCENCE NOTICE

**This decision is OBSOLETE as of 2025-10-23.**

**Reason**: FastMCP is a Python-only framework, incompatible with the Node.js MCP server architecture adopted in [[javascript-typescript-stack-pivot|D-021]].

**Replacement**: The project now uses `@modelcontextprotocol/sdk` (official TypeScript SDK from Anthropic) instead of FastMCP.

**Why Obsolete**:
1. **Official SDK Available**: Anthropic released official TypeScript SDK (`@modelcontextprotocol/sdk`)
2. **Stack Pivot**: Project pivoted from Python to JavaScript/TypeScript/Node.js stack
3. **Better Integration**: Official SDK provides superior Claude Desktop integration (Electron = Node.js)
4. **Unified Stack**: TypeScript-based MCP server integrates seamlessly with Weaver workflows and other Node.js tooling

**Historical Context**: This decision was made during Phase 3 planning when Python stack was still under consideration. The decision was obsoleted during Phase 4B reorganization when the official TypeScript SDK was discovered and evaluated.

---

## Original Decision Context (2025-10-21)

### The Problem

Weave-NN required an MCP (Model Context Protocol) server implementation to expose Obsidian vault operations to Claude Desktop. The choice was between:
1. **Raw MCP SDK** - Low-level protocol implementation
2. **FastMCP** - High-level Python framework

### Decision

**Adopt FastMCP framework for MCP server implementation.**

### Rationale (At Time of Decision)

**Code Reduction**:
- 60-70% less code compared to raw MCP SDK
- Decorator-based tool registration
- Automatic schema generation from Python type hints

**Developer Experience**:
```python
# FastMCP (simple)
@mcp.tool()
def search_vault(query: str) -> list[str]:
    """Search Obsidian vault for notes matching query."""
    return vault.search(query)

# vs Raw SDK (complex)
server.add_tool(
    name="search_vault",
    description="Search Obsidian vault for notes matching query.",
    input_schema={
        "type": "object",
        "properties": {
            "query": {"type": "string"}
        },
        "required": ["query"]
    },
    handler=search_vault_handler
)
```

**Testing**:
- Built-in testing framework
- <1 second per test execution
- Mock client support

**Enterprise Features**:
- Authentication/authorization support
- Error handling patterns
- Logging and monitoring

**Claude Desktop Integration**:
- CLI command for registration
- Automatic configuration updates

---

## Components Affected (Original Plan)

**Phase 5 (MVP Week 1)**:
1. **MCP Server** (F-001) - FastMCP-based implementation
2. **Tool Registration** - Decorator-based tool definitions
3. **Resource Handlers** - FastMCP resource protocol
4. **Claude Desktop Config** - FastMCP CLI integration

---

## Why This Decision Became Obsolete

### Discovery Timeline

**2025-10-21**: D-007 decided (FastMCP chosen)
**2025-10-21 to 2025-10-23**: Phase 4B reorganization and research
**2025-10-23**: D-021 decided (TypeScript stack pivot), D-007 obsoleted

### Critical Discoveries

**1. Official TypeScript SDK Available**
- Anthropic released `@modelcontextprotocol/sdk` in TypeScript
- Native TypeScript support with official documentation
- FastMCP is community wrapper, not official

**2. Stack Incompatibility**
- FastMCP requires Python runtime
- Weaver (workflow.dev) is TypeScript-native
- Split stack (Python MCP + Node.js workflows) adds complexity

**3. Claude Desktop Integration**
- Claude Desktop runs on Electron (Node.js runtime)
- TypeScript MCP servers run in same runtime environment
- Lower IPC overhead, better performance

### Comparison: FastMCP vs Official SDK

| Aspect | FastMCP (Python) | Official SDK (TypeScript) | Winner |
|--------|------------------|---------------------------|--------|
| **Maintenance** | Community | Anthropic Official | SDK |
| **Updates** | Lag behind SDK | First-class support | SDK |
| **Documentation** | Community docs | Official docs | SDK |
| **Runtime** | Python 3.11+ | Node.js 20+ | SDK (Electron compat) |
| **Stack** | Separate from workflows | Unified with Weaver | SDK |
| **Type Safety** | Type hints | TypeScript compiler | SDK |
| **Code Reduction** | 60-70% vs raw SDK | 50-60% vs raw SDK | FastMCP (minor) |

**Verdict**: Official SDK advantages outweigh FastMCP's code reduction benefits.

---

## Migration Impact

### Work Not Lost

**Research Value**:
- MCP protocol understanding
- Tool design patterns
- Resource handler architecture
- Testing strategies

**Transferable Concepts**:
- Tool registration patterns → TypeScript decorators
- Resource handlers → TypeScript async handlers
- Testing approach → Vitest/Jest patterns

### Sunk Cost

**Time Investment**:
- ~3 days FastMCP exploration in Phase 3
- ~1 day FastMCP prototyping

**Mitigation**:
- Early pivot (before implementation)
- Knowledge transferred to TypeScript
- No production code to migrate

---

## Replacement: Official TypeScript SDK

### New Implementation Approach

**Server Setup**:
```typescript
// File: src/server/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'weave-nn',
  version: '0.1.0'
}, {
  capabilities: {
    resources: {},
    tools: {}
  }
});
```

**Tool Registration**:
```typescript
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'vault_search',
      description: 'Search Obsidian vault',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        },
        required: ['query']
      }
    }
  ]
}));
```

**Benefits Over FastMCP**:
- ✅ Official Anthropic support
- ✅ TypeScript type safety
- ✅ Unified stack (Node.js)
- ✅ Better Claude Desktop integration
- ✅ Seamless Weaver workflow integration

---

## Lessons Learned

**1. Validate Official Support First**
- Check for official SDKs before choosing community alternatives
- Official support = better long-term maintenance

**2. Consider Full Stack Implications**
- FastMCP looked good in isolation
- Stack incompatibility (Python + Node.js) created friction

**3. Early Pivot is Valuable**
- Decision obsoleted before implementation
- Minimal sunk cost (~3 days research)
- Better than discovering incompatibility mid-implementation

**4. Research Phase Value**
- FastMCP research provided MCP protocol understanding
- Concepts transferred to TypeScript implementation
- Research is never wasted

---

## References

### Original Research
- **[[../../research/fastmcp-research-findings|FastMCP Research Findings]]** - Original evaluation
- **[[../../_planning/research/fastmcp-research-findings|Planning Research]]** - Detailed analysis

### Replacement Decision
- **[[javascript-typescript-stack-pivot|D-021: JavaScript/TypeScript Stack Pivot]]** - Complete rationale for stack change
- **[[adopt-weaver-workflow-proxy|D-020: Weaver Workflow Proxy]]** - TypeScript workflow engine

### Official Documentation
- **MCP SDK**: https://github.com/anthropics/anthropic-sdk-typescript
- **FastMCP**: https://github.com/jlowin/fastmcp (community project)

---

## Change Log

- **2025-10-21**: Decision D-007 made (FastMCP chosen)
- **2025-10-23**: Decision obsoleted by D-021 (TypeScript stack pivot)
- **2025-10-23**: Decision document created and archived

---

**Tags**: #decision #technical #obsolete #mcp #python #fastmcp #replaced
