# Feature Gap Analysis: knowledge-graph-agent vs weaver

**Date:** 2025-12-28
**Version:** 0.2.0 (knowledge-graph-agent) vs 1.x (weaver)

## Executive Summary

This document identifies features that exist in the `weaver` codebase but are missing from the `@weavelogic/knowledge-graph-agent` NPM package. The analysis covers CLI commands, core functionality, generators, integrations, database features, and the cultivation system.

---

## 1. CLI Commands Comparison

### knowledge-graph-agent Current Commands (10 commands)
| Command | Description | Status |
|---------|-------------|--------|
| `kg init` | Initialize knowledge graph configuration | EXISTS |
| `kg graph` | Generate knowledge graph from docs | EXISTS |
| `kg docs init` | Initialize docs directory structure | EXISTS |
| `kg claude update` | Update CLAUDE.md | EXISTS |
| `kg sync` | Sync with claude-flow memory | EXISTS |
| `kg stats` | Show knowledge graph statistics | EXISTS |
| `kg search` | Search nodes by title/content | EXISTS |
| `kg convert` | Convert docs to knowledge graph format | EXISTS |
| `kg frontmatter` | Add/validate frontmatter | EXISTS |
| `kg analyze` | Analyze and migrate to knowledge graph | EXISTS |

### Weaver Commands Missing from knowledge-graph-agent

| Command | Description | Priority | Weaver Location |
|---------|-------------|----------|-----------------|
| `weaver init-primitives` | Bootstrap vault with primitive nodes from codebase | **CRITICAL** | `cli/commands/init-primitives.js` |
| `weaver cultivate` | AI-powered seed generation and deep analysis | **CRITICAL** | `cli/commands/cultivate.js` |
| `weaver commit` | AI-powered commit messages | **HIGH** | `cli/commands/commit.js` |
| `weaver learn` | Learning loop for continuous improvement | **HIGH** | `cli/commands/learn.js` |
| `weaver perceive` | Perceive codebase changes | **HIGH** | `cli/commands/perceive.js` |
| `weaver workflow` | Workflow execution and management | **HIGH** | `cli/commands/workflow-new.js` |
| `weaver sop` | Standard Operating Procedures | **HIGH** | `cli/commands/sop/index.js` |
| `weaver agents` | Agent orchestration commands | **HIGH** | `cli/commands/agents.js` |
| `weaver config` | Configuration management | **MEDIUM** | `cli/commands/config.js` |
| `weaver setup` | Setup and configuration | **MEDIUM** | `cli/commands/setup.js` |
| `weaver analyze-standards` | Analyze coding standards | **MEDIUM** | `cli/commands/analyze-standards.js` |
| `weaver service start/stop/status` | Service management | **MEDIUM** | `cli/commands/service/` |
| `weaver database` | Database operations | **LOW** | `cli/commands/ops/database.js` |
| `weaver cache` | Cache management | **LOW** | `cli/commands/ops/cache.js` |
| `weaver diagnose` | Diagnostics | **LOW** | `cli/commands/ops/diagnose.js` |

---

## 2. Core Functions Gap Analysis

### Existing in knowledge-graph-agent
- `KnowledgeGraphManager` - In-memory graph operations
- `KnowledgeGraphDatabase` - SQLite persistence with FTS5
- `ClaudeFlowIntegration` - Basic claude-flow sync
- Node/Edge CRUD operations
- Full-text search
- Tag indexing

### Missing Core Functions

#### CRITICAL Priority
| Feature | Description | Weaver Source |
|---------|-------------|---------------|
| **SeedGenerator** | Analyze codebase and generate primitive nodes | `cultivation/seed-generator.ts` |
| **DeepAnalyzer** | claude-flow agent-powered analysis | `cultivation/deep-analyzer.ts` |
| **SeedEnhancer** | AI-enhanced seed metadata | `cultivation/seed-enhancer.ts` |
| **RulesEngine** | Event-driven automation rules | `agents/rules-engine.ts` |
| **ClaudeClient** | Direct Claude API integration | `agents/claude-client.ts` |

#### HIGH Priority
| Feature | Description | Weaver Source |
|---------|-------------|---------------|
| **VaultMemorySync** | Bidirectional memory sync | `memory/vault-sync.ts` |
| **ClaudeFlowClient** | Full claude-flow integration | `memory/claude-flow-client.ts` |
| **WorkflowRegistry** | Workflow management | `workflow-engine/registry.ts` |
| **SpecGenerator** | Spec file generation | `spec-generator/generator.ts` |
| **AgentCoordinator** | Multi-agent coordination | `agents/coordinator.ts` |
| **ResearcherAgent** | Research agent implementation | `agents/researcher-agent.ts` |
| **CoderAgent** | Coder agent implementation | `agents/coder-agent.ts` |
| **TesterAgent** | Tester agent implementation | `agents/tester-agent.ts` |
| **AnalystAgent** | Analyst agent implementation | `agents/analyst-agent.ts` |
| **ArchitectAgent** | Architect agent implementation | `agents/architect-agent.ts` |

#### MEDIUM Priority
| Feature | Description | Weaver Source |
|---------|-------------|---------------|
| **PromptBuilder** | Dynamic prompt construction | `agents/prompt-builder.ts` |
| **ErrorDetector** | Error detection and recovery | `agents/error-detector.ts` |
| **FileWatcher** | Real-time file watching | `file-watcher/` |
| **ActivityLogger** | Activity logging | `vault-logger/activity-logger.ts` |
| **GitClient** | Git operations | `git/git-client.ts` |
| **AutoCommit** | Automatic git commits | `git/auto-commit.ts` |

---

## 3. Generators Gap Analysis

### Existing in knowledge-graph-agent
- `initDocs()` - Initialize docs directory structure
- `generateMcpConfig()` - Generate MCP configuration
- Basic template system

### Missing Generators

#### CRITICAL Priority
| Generator | Description | Weaver Source |
|-----------|-------------|---------------|
| **SeedGenerator** | Generate primitives from package.json, requirements.txt, Cargo.toml, go.mod, etc. | `cultivation/seed-generator.ts` |
| **NodeGenerator** | Generate knowledge nodes from codebase | `vault-init/generator/node-generator.ts` |
| **FrontmatterGenerator** | Generate frontmatter for files | `vault-init/generator/frontmatter-generator.ts` |
| **WikilinkBuilder** | Build wikilinks between nodes | `vault-init/generator/wikilink-builder.ts` |

#### HIGH Priority
| Generator | Description | Weaver Source |
|-----------|-------------|---------------|
| **ConceptMapGenerator** | Generate concept maps | `vault-init/writer/concept-map-generator.ts` |
| **ReadmeGenerator** | Generate README files | `vault-init/writer/readme-generator.ts` |
| **TaskGenerator** | Generate task files | `spec-generator/task-generator.ts` |
| **SpecGenerator** | Generate specification files | `spec-generator/generator.ts` |

#### MEDIUM Priority
| Generator | Description | Weaver Source |
|-----------|-------------|---------------|
| **ThoughtTreeVisualizer** | Visualize reasoning trees | `reasoning/visualization/thought-tree-visualizer.ts` |
| **TemplateManager** | Template management | `reasoning/template-manager.ts` |

---

## 4. Integrations Gap Analysis

### Existing in knowledge-graph-agent
- Basic claude-flow memory sync
- MCP config generation

### Missing Integrations

#### CRITICAL Priority
| Integration | Description | Weaver Source |
|-------------|-------------|---------------|
| **Full Claude-Flow Integration** | Complete claude-flow client with hooks | `claude-flow/index.ts` |
| **Agent Orchestration** | Multi-agent coordination | `agents/orchestration/` |
| **Agent Coordination** | Agent message bus, consensus | `agents/coordination/` |

#### HIGH Priority
| Integration | Description | Weaver Source |
|-------------|-------------|---------------|
| **MCP Server** | Full MCP server with tools | `mcp-server/` |
| **MCP Tools - Shadow Cache** | Query files, search tags/links | `mcp-server/tools/shadow-cache/` |
| **MCP Tools - Workflow** | Trigger/monitor workflows | `mcp-server/tools/workflow/` |
| **Git Integration** | Git operations and auto-commit | `git/` |

#### MEDIUM Priority
| Integration | Description | Weaver Source |
|-------------|-------------|---------------|
| **Service Manager** | Process management | `service-manager/` |
| **Health Check** | System health monitoring | `service-manager/health-check.ts` |
| **Metrics Collector** | Metrics collection | `service-manager/metrics-collector.ts` |

---

## 5. Database Features Gap Analysis

### Existing in knowledge-graph-agent
- SQLite with WAL mode
- FTS5 full-text search
- Nodes, edges, tags tables
- Basic CRUD operations
- Graph statistics

### Missing Database Features

#### CRITICAL Priority
| Feature | Description | Weaver Source |
|---------|-------------|---------------|
| **Shadow Cache Integration** | File metadata caching with vault sync | `shadow-cache/` |
| **Parser Module** | Markdown parsing with link extraction | `shadow-cache/parser.ts` |
| **Content Hash Tracking** | Detect file changes | `shadow-cache/parser.ts` |
| **Directory Scanning** | Recursive vault scanning | `shadow-cache/index.ts` |

#### HIGH Priority
| Feature | Description | Weaver Source |
|---------|-------------|---------------|
| **Links Table (Enhanced)** | Link types: wikilink, markdown | `shadow-cache/schema.sql` |
| **Activity Logging** | Log all operations | `workflow-engine/middleware/activity-logging-middleware.ts` |
| **Execution History** | Track workflow executions | `workflow-engine/registry.ts` |

#### MEDIUM Priority
| Feature | Description | Weaver Source |
|---------|-------------|---------------|
| **Connection Pooling** | Database connection pool | `service-manager/connection-pool.ts` |
| **Database Recovery** | Recovery procedures | `service-manager/database-recovery.ts` |
| **Metrics Cache** | Cache metrics data | `service-manager/metrics-cache.ts` |

---

## 6. Cultivation System Gap Analysis

### Existing in knowledge-graph-agent
- Basic framework detection
- Simple dependency listing
- Template-based docs initialization

### Missing Cultivation Features

#### CRITICAL Priority (Entire cultivation/ directory)
| Feature | Description | Weaver Source |
|---------|-------------|---------------|
| **SeedGenerator** | Multi-language dependency analysis | `cultivation/seed-generator.ts` |
| - | Parse package.json (Node.js) | |
| - | Parse requirements.txt, pyproject.toml (Python) | |
| - | Parse composer.json (PHP) | |
| - | Parse Cargo.toml (Rust) | |
| - | Parse go.mod (Go) | |
| - | Parse pom.xml, build.gradle (Java) | |
| - | Service configuration analysis (docker-compose) | |
| - | Deployment manifest detection | |
| **DeepAnalyzer** | AI-powered codebase analysis | `cultivation/deep-analyzer.ts` |
| - | claude-flow agent integration | |
| - | PRIMITIVES.md taxonomy mapping | |
| - | Priority classification | |
| **SeedEnhancer** | AI enhancement of seed data | `cultivation/seed-enhancer.ts` |
| **StandardsValidator** | Validate against standards | `cultivation/standards-validator.ts` |

---

## 7. SOPs (Standard Operating Procedures) Gap

### Missing Entirely
The knowledge-graph-agent has no SOP system. Weaver has:

| SOP | Description | Weaver Source |
|-----|-------------|---------------|
| **Code Review** | AI-powered code review workflow | `sops/code-review.ts` |
| **Debugging** | Systematic debugging procedures | `sops/debugging.ts` |
| **Documentation** | Documentation generation | `sops/documentation.ts` |
| **Feature Planning** | Feature planning workflow | `sops/feature-planning.ts` |
| **Performance Analysis** | Performance analysis | `sops/performance-analysis.ts` |
| **Phase Planning** | Phase planning | `sops/phase-planning.ts` |
| **Release Management** | Release procedures | `sops/release-management.ts` |
| **Vault Management** | Vault maintenance | `sops/vault-management.ts` |

---

## 8. Reasoning System Gap

### Missing Entirely
| Feature | Description | Weaver Source |
|---------|-------------|---------------|
| **TreeOfThought** | Tree of thought reasoning | `reasoning/tree-of-thought.ts` |
| **SelfConsistentCoT** | Self-consistent chain of thought | `reasoning/self-consistent-cot.ts` |
| **TemplateManager** | Reasoning templates | `reasoning/template-manager.ts` |
| **ThoughtTreeVisualizer** | Visualization | `reasoning/visualization/` |

---

## 9. Chunking System Gap

### Missing Entirely
| Feature | Description | Weaver Source |
|---------|-------------|---------------|
| **DocumentParser** | Parse documents for chunking | `chunking/document-parser.ts` |
| **ChunkManager** | Manage document chunks | `chunking/chunk-manager.ts` |
| **StrategySelector** | Select chunking strategy | `chunking/strategy-selector.ts` |
| **ChunkStorage** | Store chunks | `chunking/chunk-storage.ts` |
| **SemanticBoundaryChunker** | Semantic chunking | `chunking/plugins/semantic-boundary-chunker.ts` |
| **EventBasedChunker** | Event-based chunking | `chunking/plugins/event-based-chunker.ts` |
| **StepBasedChunker** | Step-based chunking | `chunking/plugins/step-based-chunker.ts` |

---

## 10. Priority Implementation Plan

### Phase 1: CRITICAL (Must Have)
1. **SeedGenerator** - Multi-language dependency analysis
2. **DeepAnalyzer** - AI-powered codebase analysis
3. **init-primitives command** - Bootstrap vault with primitives
4. **cultivate command** - Full cultivation workflow
5. **Shadow Cache Integration** - File metadata caching

### Phase 2: HIGH (Should Have)
1. **RulesEngine** - Event-driven automation
2. **Agent implementations** - Researcher, Coder, Tester, Analyst, Architect
3. **VaultMemorySync** - Bidirectional sync
4. **WorkflowRegistry** - Workflow management
5. **commit command** - AI-powered commits
6. **MCP Server** - Full MCP implementation
7. **Git Integration** - Auto-commit, logging

### Phase 3: MEDIUM (Nice to Have)
1. **SOPs System** - Code review, debugging, etc.
2. **Service Management** - Process management
3. **Config Command** - Configuration management
4. **Reasoning System** - Tree of thought, CoT
5. **Health Monitoring** - Health checks, metrics

### Phase 4: LOW (Future Consideration)
1. **Chunking System** - Document chunking
2. **Database Recovery** - Recovery procedures
3. **Advanced Caching** - Connection pooling, metrics cache
4. **Diagnostics** - System diagnostics

---

## 11. File Count Summary

| Category | knowledge-graph-agent | weaver | Gap |
|----------|----------------------|--------|-----|
| CLI Commands | 10 | 25+ | 15+ |
| Core Modules | 4 | 20+ | 16+ |
| Generators | 5 | 10+ | 5+ |
| Integrations | 1 | 5+ | 4+ |
| Agent Types | 0 | 6 | 6 |
| SOPs | 0 | 8 | 8 |
| Reasoning | 0 | 4 | 4 |
| Chunking | 0 | 8 | 8 |
| **TOTAL** | ~20 | ~90+ | ~70+ |

---

## 12. Recommended Next Steps

1. **Immediate**: Port `SeedGenerator` from `cultivation/seed-generator.ts`
2. **This Week**: Add `cultivate` and `init-primitives` commands
3. **Next Week**: Implement `DeepAnalyzer` with claude-flow integration
4. **Month 1**: Add core agents (Researcher, Coder, Tester)
5. **Month 2**: MCP server with shadow-cache tools
6. **Month 3**: SOPs and workflow engine

---

## 13. Technical Dependencies

### Required for Phase 1
- `child_process` (already available)
- `gray-matter` (already in package.json)
- `fast-glob` (already in package.json)
- `better-sqlite3` (already in package.json)

### Required for Phase 2
- `@anthropic-ai/sdk` (already in package.json)
- `simple-git` (already in package.json)
- `chokidar` (for file watching, add to dependencies)

### Required for Phase 3
- `@modelcontextprotocol/sdk` (for MCP server)
- Additional MCP dependencies

---

*Generated by code-analyzer agent for knowledge-graph-agent v0.2.0*
