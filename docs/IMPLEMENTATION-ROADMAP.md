# @weavelogic/knowledge-graph-agent Implementation Roadmap

## SPARC Development Plan - Comprehensive Feature Implementation

**Version:** 0.3.0 (Target)
**Generated:** 2025-12-28
**Based On:** Parallel Agent Analysis Consensus
**Methodology:** SPARC (Specification, Pseudocode, Architecture, Refinement, Completion)

---

## Executive Summary

This roadmap defines the implementation plan for expanding `@weavelogic/knowledge-graph-agent` from its current v0.2.0 feature set to achieve feature parity with the weaver codebase. The plan is based on consensus from 11 parallel analysis agents that examined:

- **278+ MCP tools** across claude-flow, flow-nexus, and ruv-swarm
- **82,046 lines of code** in weaver vs ~1,500 in knowledge-graph-agent
- **70+ file gap** between the two codebases
- **15+ missing CLI commands**
- **8 major systems** to port (Cultivation, Agents, SOPs, etc.)

---

## Consensus Findings

### Critical Features (Must Have)
All agents agreed these are essential:
1. **SeedGenerator** - Multi-language dependency analysis
2. **DeepAnalyzer** - AI-powered codebase analysis
3. **Shadow Cache** - SQLite-based file metadata caching
4. **cultivate command** - Full cultivation workflow
5. **init-primitives command** - Bootstrap vault with primitives

### High Priority (Should Have)
Majority consensus:
1. **RulesEngine** - Event-driven automation
2. **Agent Implementations** - Researcher, Coder, Tester, Analyst, Architect
3. **MCP Server** - Full MCP tool implementation
4. **Error Taxonomy** - Structured error classification with recovery
5. **Workflow Engine** - Task orchestration

### Medium Priority (Nice to Have)
Partial consensus:
1. **SOPs System** - Standard Operating Procedures
2. **Service Manager** - Process management
3. **Reasoning System** - Tree of thought
4. **Learning Loop** - Feedback and adaptation

---

## SPARC Phase 1: Specification (Week 1)

### 1.1 Requirements Documentation
**Status:** ✅ Complete (via agent analysis)

Created documents:
- `docs/ARCHITECTURE.md` - Full C4 architecture with 8 modules
- `docs/FEATURE-GAP-ANALYSIS.md` - 70+ feature gap identification
- `_files/research/knowledge-graph-agent-requirements.md` - 15-section spec

### 1.2 Interface Definitions

```typescript
// Core interfaces to implement (from agent consensus)

// Cultivation Engine
interface CultivationOptions {
  targetDirectory: string;
  dryRun: boolean;
  force: boolean;
  skipUnmodified: boolean;
  generateMissing: boolean;
  buildFooters: boolean;
  useAgents: boolean;
  agentMode: 'sequential' | 'parallel' | 'adaptive';
  maxAgents: number;
  verbose: boolean;
  seed: boolean;
  projectRoot?: string;
  deepAnalysis: boolean;
}

// Seed Generator
interface SeedAnalysis {
  dependencies: DependencyInfo[];
  services: ServiceInfo[];
  frameworks: DependencyInfo[];
  languages: string[];
  deployments: string[];
  existingConcepts: string[];
  existingFeatures: string[];
}

// Deep Analyzer
interface DeepAnalysisResult {
  primitives: PrimitiveDiscovery[];
  totalCount: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  patterns: PatternDiscovery[];
  gaps: DocumentationGap[];
}

// Error Taxonomy
enum ErrorCategory {
  TRANSIENT = 'transient',
  PERMANENT = 'permanent',
  RATE_LIMIT = 'rate_limit',
  NETWORK = 'network',
  VALIDATION = 'validation',
  RESOURCE = 'resource',
  CONFIGURATION = 'configuration',
}
```

---

## SPARC Phase 2: Pseudocode (Week 2)

### 2.1 SeedGenerator Algorithm

```
FUNCTION generateSeeds(projectRoot, vaultRoot):
  // Phase 1: Ecosystem Detection
  ecosystems = detectEcosystems(projectRoot)

  FOR EACH ecosystem IN ecosystems:
    IF ecosystem.type == 'nodejs':
      dependencies = parsePackageJson(ecosystem.path)
    ELSE IF ecosystem.type == 'python':
      dependencies = parsePythonDeps(ecosystem.path)
    ELSE IF ecosystem.type == 'rust':
      dependencies = parseCargoToml(ecosystem.path)
    ELSE IF ecosystem.type == 'go':
      dependencies = parseGoMod(ecosystem.path)
    ELSE IF ecosystem.type == 'php':
      dependencies = parseComposerJson(ecosystem.path)
    ELSE IF ecosystem.type == 'java':
      dependencies = parsePomOrGradle(ecosystem.path)

  // Phase 2: Classification
  primitives = classifyDependencies(dependencies):
    frameworks = FILTER by type == 'framework'
    services = FILTER by type == 'service'
    tools = FILTER by type == 'tool'

  // Phase 3: Priority Assignment
  FOR EACH primitive IN primitives:
    IF primitive.usageCount > HIGH_THRESHOLD:
      primitive.priority = 'critical'
    ELSE IF primitive.isCoreDependency:
      primitive.priority = 'high'
    ELSE:
      primitive.priority = 'medium'

  // Phase 4: Document Generation
  FOR EACH primitive IN primitives:
    document = generatePrimitiveDocument(primitive, context)
    writeToVault(vaultRoot, document)

  RETURN generatedDocuments
```

### 2.2 DeepAnalyzer Algorithm

```
FUNCTION deepAnalyze(projectRoot, vaultRoot, timeout = 30000):
  // Check claude-flow availability
  IF NOT claudeFlowAvailable():
    RETURN shallowAnalysis(projectRoot)

  // Create abort controller for timeout
  controller = new AbortController()
  timeoutId = setTimeout(() => controller.abort(), timeout)

  TRY:
    // Spawn analysis agent
    result = claudeFlow.orchestrate({
      task: buildAnalysisPrompt(projectRoot),
      strategy: 'adaptive',
      priority: 'high'
    })

    // Parse JSON response
    analysis = parseAnalysisResult(result)

    // Map to PRIMITIVES taxonomy
    mapped = mapToPrimitivesTaxonomy(analysis)

    RETURN mapped

  CATCH TimeoutError:
    LOG 'Deep analysis timed out, falling back to shallow'
    RETURN shallowAnalysis(projectRoot)

  FINALLY:
    clearTimeout(timeoutId)
```

### 2.3 Error Recovery Algorithm

```
FUNCTION withRetry(operation, options):
  attempts = 0
  lastError = null

  WHILE attempts < options.maxRetries:
    TRY:
      result = await operation()
      RETURN result

    CATCH error:
      lastError = error
      category = classifyError(error)

      IF category == PERMANENT:
        THROW error  // Don't retry permanent errors

      IF category == RATE_LIMIT:
        delay = calculateBackoff(attempts, factor: 2, jitter: true)
        WAIT delay

      IF category == TRANSIENT:
        delay = calculateBackoff(attempts, factor: 1.5)
        WAIT delay

      attempts++

  THROW new RetriesExhaustedError(lastError)
```

---

## SPARC Phase 3: Architecture (Week 3)

### 3.1 Module Structure

```
src/
├── core/                     # Existing + Enhanced
│   ├── graph.ts             # KnowledgeGraphManager
│   ├── database.ts          # SQLite with WAL
│   ├── types.ts             # Core types
│   └── security.ts          # Input validation
│
├── cultivation/              # NEW - Port from weaver
│   ├── engine.ts            # CultivationEngine
│   ├── seed-generator.ts    # Multi-ecosystem analysis
│   ├── seed-enhancer.ts     # AI enhancement
│   ├── deep-analyzer.ts     # claude-flow integration
│   ├── context-loader.ts    # Load vault context
│   ├── document-generator.ts # Gap analysis
│   ├── frontmatter-generator.ts
│   ├── footer-builder.ts
│   ├── agent-orchestrator.ts
│   ├── standards-validator.ts
│   └── types.ts
│
├── shadow-cache/             # NEW - Port from weaver
│   ├── index.ts             # ShadowCache class
│   ├── database.ts          # SQLite operations
│   ├── parser.ts            # Markdown parser
│   ├── schema.sql           # Database schema
│   └── types.ts
│
├── utils/                    # NEW - Port from weaver
│   ├── error-taxonomy.ts    # Error classification
│   ├── error-recovery.ts    # Retry with backoff
│   ├── fallback-chain.ts    # Multi-level fallback
│   ├── logger.ts            # Structured logging
│   └── index.ts
│
├── agents/                   # NEW
│   ├── registry.ts          # Agent type registry
│   ├── spawner.ts           # Agent lifecycle
│   ├── coordinator.ts       # Multi-agent coordination
│   ├── types.ts
│   └── prompts/
│       ├── researcher.ts
│       ├── coder.ts
│       ├── tester.ts
│       ├── analyst.ts
│       └── architect.ts
│
├── integrations/             # Enhanced
│   ├── claude-flow.ts       # Memory/hooks integration
│   ├── mcp-client.ts        # NEW - Direct MCP calls
│   ├── git.ts               # NEW - Git operations
│   ├── package-managers.ts  # NEW - Ecosystem detection
│   └── types.ts
│
├── workflows/                # NEW
│   ├── engine.ts            # WorkflowEngine
│   ├── registry.ts          # Workflow storage
│   └── steps/
│       ├── analyze.ts
│       ├── generate.ts
│       ├── validate.ts
│       └── cultivate.ts
│
├── generators/               # Existing + Enhanced
│   ├── docs-init.ts
│   ├── docs-analyzer.ts
│   ├── primitives.ts        # NEW - PRIMITIVES.md generator
│   ├── moc.ts               # NEW - Map of Content
│   ├── frontmatter.ts
│   ├── footer.ts            # NEW
│   └── template-engine.ts
│
├── cli/
│   ├── bin.ts
│   ├── index.ts
│   └── commands/
│       ├── init.ts          # Existing
│       ├── graph.ts         # Existing
│       ├── cultivate.ts     # NEW - Full cultivation
│       ├── seed.ts          # NEW - init-primitives
│       ├── validate.ts      # NEW - Standards validation
│       ├── agents.ts        # NEW - Agent management
│       ├── workflow.ts      # NEW - Workflow commands
│       └── ...
│
└── index.ts                  # Main exports
```

### 3.2 Dependency Graph

```
                    ┌─────────────┐
                    │     CLI     │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌──────▼──────┐   ┌─────▼─────┐
    │ Cultivation│   │  Generators │   │  Agents   │
    └─────┬─────┘   └──────┬──────┘   └─────┬─────┘
          │                │                │
    ┌─────▼─────┐   ┌──────▼──────┐   ┌─────▼─────┐
    │Shadow Cache│   │    Core     │   │Integrations│
    └─────┬─────┘   └──────┬──────┘   └─────┬─────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Utils    │
                    └─────────────┘
```

---

## SPARC Phase 4: Refinement - TDD Implementation (Weeks 4-10)

### Sprint 1: Core Infrastructure (Week 4)

**Files to Create:**
1. `src/utils/error-taxonomy.ts`
2. `src/utils/error-recovery.ts`
3. `src/utils/logger.ts`
4. `tests/utils/error-taxonomy.test.ts`
5. `tests/utils/error-recovery.test.ts`

**Test Coverage Target:** 95%

**Key Test Cases:**
```typescript
describe('ErrorTaxonomy', () => {
  it('should classify network errors as transient', () => {
    const error = new Error('ECONNREFUSED');
    expect(classifyError(error)).toBe(ErrorCategory.TRANSIENT);
  });

  it('should classify 429 as rate limit', () => {
    const error = { status: 429 };
    expect(classifyError(error)).toBe(ErrorCategory.RATE_LIMIT);
  });
});

describe('ErrorRecovery', () => {
  it('should retry transient errors with backoff', async () => {
    let attempts = 0;
    const operation = () => {
      attempts++;
      if (attempts < 3) throw new Error('transient');
      return 'success';
    };

    const result = await withRetry(operation, { maxRetries: 5 });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});
```

### Sprint 2: Shadow Cache (Week 5)

**Files to Create:**
1. `src/shadow-cache/database.ts`
2. `src/shadow-cache/parser.ts`
3. `src/shadow-cache/types.ts`
4. `src/shadow-cache/schema.sql`
5. `src/shadow-cache/index.ts`
6. `tests/shadow-cache/*.test.ts`

**Key Test Cases:**
```typescript
describe('ShadowCache', () => {
  it('should parse wikilinks correctly', () => {
    const content = 'See [[other-doc]] and [[doc|alias]]';
    const links = extractWikilinks(content);
    expect(links).toEqual([
      { target: 'other-doc', text: null },
      { target: 'doc', text: 'alias' }
    ]);
  });

  it('should detect file changes via content hash', async () => {
    const cache = new ShadowCache(':memory:');
    await cache.upsertFile({ path: 'test.md', content: 'v1' });
    const changed = await cache.hasChanged('test.md', 'v2');
    expect(changed).toBe(true);
  });
});
```

### Sprint 3: Seed Generator (Week 6)

**Files to Create:**
1. `src/cultivation/seed-generator.ts`
2. `src/integrations/package-managers.ts`
3. `src/cultivation/types.ts`
4. `tests/cultivation/seed-generator.test.ts`

**Key Test Cases:**
```typescript
describe('SeedGenerator', () => {
  it('should parse package.json dependencies', async () => {
    const deps = await parsePackageJson('./fixtures/package.json');
    expect(deps).toContainEqual({
      name: 'express',
      version: '^4.18.0',
      type: 'framework',
      ecosystem: 'nodejs'
    });
  });

  it('should detect Python frameworks', async () => {
    const deps = await parsePythonDeps('./fixtures/requirements.txt');
    expect(deps.some(d => d.name === 'django')).toBe(true);
  });
});
```

### Sprint 4: Deep Analyzer (Week 7)

**Files to Create:**
1. `src/cultivation/deep-analyzer.ts`
2. `src/cultivation/context-loader.ts`
3. `src/cultivation/agent-orchestrator.ts`
4. `tests/cultivation/deep-analyzer.test.ts`

**Key Test Cases:**
```typescript
describe('DeepAnalyzer', () => {
  it('should fall back to shallow analysis on timeout', async () => {
    const analyzer = new DeepAnalyzer(projectRoot, { timeout: 1 });
    const result = await analyzer.analyze();
    expect(result.method).toBe('shallow');
  });

  it('should classify primitives by priority', async () => {
    const result = await analyzer.analyze();
    expect(result.byPriority.critical).toBeGreaterThan(0);
  });
});
```

### Sprint 5: Cultivation Engine (Week 8)

**Files to Create:**
1. `src/cultivation/engine.ts`
2. `src/cultivation/document-generator.ts`
3. `src/cultivation/frontmatter-generator.ts`
4. `src/cultivation/footer-builder.ts`
5. `src/cli/commands/cultivate.ts`
6. `src/cli/commands/seed.ts`
7. `tests/cultivation/engine.test.ts`

**Key Test Cases:**
```typescript
describe('CultivationEngine', () => {
  it('should run full cultivation workflow', async () => {
    const engine = new CultivationEngine(vaultPath);
    const report = await engine.cultivate({
      generateMissing: true,
      buildFooters: true
    });

    expect(report.filesProcessed).toBeGreaterThan(0);
    expect(report.errors).toHaveLength(0);
  });
});
```

### Sprint 6: Agent System (Week 9)

**Files to Create:**
1. `src/agents/registry.ts`
2. `src/agents/spawner.ts`
3. `src/agents/coordinator.ts`
4. `src/agents/prompts/*.ts`
5. `tests/agents/*.test.ts`

### Sprint 7: Workflow Engine & Standards Validator (Week 10)

**Files to Create:**
1. `src/workflows/engine.ts`
2. `src/workflows/registry.ts`
3. `src/cultivation/standards-validator.ts`
4. `src/cli/commands/validate.ts`
5. `tests/workflows/*.test.ts`

---

## SPARC Phase 5: Completion (Week 11-12)

### 5.1 Integration Testing

```typescript
describe('E2E: Full Cultivation Workflow', () => {
  it('should cultivate a real Next.js project', async () => {
    const result = await execCLI('kg cultivate seed ./fixtures/nextjs-app');
    expect(result.exitCode).toBe(0);

    // Verify generated files
    expect(fs.existsSync('./fixtures/nextjs-app/docs/primitives')).toBe(true);
    expect(fs.existsSync('./fixtures/nextjs-app/docs/PRIMITIVES.md')).toBe(true);
  });
});
```

### 5.2 Documentation Updates

- [ ] Update README.md with new commands
- [ ] Add API.md with programmatic usage
- [ ] Add CLI.md with command reference
- [ ] Add MIGRATION.md for weaver users
- [ ] Update CHANGELOG.md

### 5.3 Version Bump

```json
{
  "version": "0.3.0",
  "description": "Knowledge graph agent for Claude Code - now with full cultivation system"
}
```

---

## Implementation Priority Matrix

| Feature | Priority | Effort | Impact | Sprint |
|---------|----------|--------|--------|--------|
| Error Taxonomy | CRITICAL | 1 day | High | 1 |
| Error Recovery | CRITICAL | 1 day | High | 1 |
| Shadow Cache | CRITICAL | 3 days | High | 2 |
| Seed Generator | CRITICAL | 4 days | Critical | 3 |
| Deep Analyzer | CRITICAL | 3 days | High | 4 |
| Cultivation Engine | CRITICAL | 5 days | Critical | 5 |
| Agent System | HIGH | 4 days | Medium | 6 |
| Workflow Engine | HIGH | 3 days | Medium | 7 |
| Standards Validator | HIGH | 2 days | Medium | 7 |
| MCP Server | MEDIUM | 5 days | Medium | Future |
| SOPs System | MEDIUM | 4 days | Low | Future |
| Reasoning System | LOW | 5 days | Low | Future |
| Chunking System | LOW | 4 days | Low | Future |

---

## MCP Tool Integration Map

Based on agent inventory of 278+ MCP tools:

### Tier 1: Essential (Use Immediately)
| MCP Tool | NPM Feature | Integration Point |
|----------|-------------|-------------------|
| `memory_usage` | Graph persistence | `claude-flow.ts` |
| `memory_search` | Graph querying | `claude-flow.ts` |
| `task_orchestrate` | Agent coordination | `agent-orchestrator.ts` |
| `agents_spawn_parallel` | Parallel analysis | `deep-analyzer.ts` |
| `state_snapshot` | Checkpoint/restore | `cultivation/engine.ts` |

### Tier 2: High Value (Phase 2)
| MCP Tool | NPM Feature | Integration Point |
|----------|-------------|-------------------|
| `daa_knowledge_share` | Cross-agent learning | `agents/coordinator.ts` |
| `neural_patterns` | Pattern learning | `cultivation/deep-analyzer.ts` |
| `workflow_create` | Automation | `workflows/engine.ts` |
| `realtime_subscribe` | Live updates | Future |

### Tier 3: Enhanced (Phase 3+)
| MCP Tool | NPM Feature | Integration Point |
|----------|-------------|-------------------|
| `daa_meta_learning` | Self-improvement | Future |
| `neural_train` | Model training | Future |
| `github_repo_analyze` | Repo analysis | Future |

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Claude-flow unavailable | Medium | High | Fallback to shallow analysis |
| Large vault performance | Medium | Medium | Incremental processing, caching |
| Cross-ecosystem parsing | Low | Medium | Use established parsers per language |
| SQLite concurrency | Low | Low | WAL mode, single-writer pattern |

### Schedule Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep | High | High | Strict priority enforcement |
| Integration complexity | Medium | Medium | TDD, incremental delivery |
| Testing overhead | Medium | Low | Parallel test development |

---

## Success Metrics

### Phase Completion Criteria

| Phase | Criteria |
|-------|----------|
| Specification | All interfaces documented |
| Pseudocode | All algorithms defined |
| Architecture | C4 diagrams complete, modules designed |
| Refinement | 80%+ test coverage, all critical features |
| Completion | E2E tests pass, docs updated, published |

### Quality Metrics

| Metric | Target |
|--------|--------|
| Test Coverage | > 80% |
| TypeScript Strict | Enabled |
| Zero `any` Types | Yes |
| CLI Startup | < 100ms |
| Analysis (1000 files) | < 30s |

---

## Next Steps

1. **Immediate (Today):**
   - Begin Sprint 1: Error infrastructure
   - Create utils directory structure
   - Write first tests

2. **This Week:**
   - Complete error taxonomy and recovery
   - Port shadow cache from weaver
   - Set up CI pipeline

3. **Next Week:**
   - Implement seed generator
   - Add package manager detection
   - Begin deep analyzer

4. **Month 1:**
   - Complete cultivation engine
   - Add cultivate and seed commands
   - Achieve feature parity for core cultivation

5. **Month 2:**
   - Agent system implementation
   - Workflow engine
   - Standards validator

6. **Month 3:**
   - Polish and optimization
   - Documentation
   - v0.3.0 release

---

## Appendix: Agent Consensus Summary

| Agent | Focus | Key Finding |
|-------|-------|-------------|
| aa77e0c | MCP Tools | 278+ tools, 5 critical for knowledge graph |
| a6e6c16 | Codebase Structure | 82K LOC gap, 70+ files to port |
| a759fa3 | Feature Inventory | 22 CLI commands, 4 core modules identified |
| aa5dd80 | Requirements | 15-section spec document created |
| a03da9e | Weaver Analysis | Error handling patterns identified |
| a5b80e9 | PRIMITIVES | 11 node types, taxonomy mapping |
| a83c133 | Claude-Flow | 3 integration patterns, standardization needed |
| a89cbc5 | Cultivation | Engine architecture, 8 sub-modules |
| aab815f | Gap Analysis | FEATURE-GAP-ANALYSIS.md created |
| a21cad9 | Architecture | ARCHITECTURE.md with C4 diagrams |
| ab560dc | SPARC Phases | This roadmap document |

---

*Generated through SPARC methodology with parallel agent analysis*
*Last Updated: 2025-12-28*
