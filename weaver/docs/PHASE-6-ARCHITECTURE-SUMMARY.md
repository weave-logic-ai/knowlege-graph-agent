# Phase 6 Architecture - Executive Summary

**Status**: ✅ Design Complete
**Implementation Target**: 3-5 days with 4-5 agents
**Critical Path**: 25 tasks (vs 63 total spec)

---

## Key Decisions

### 1. MVP Scope Reduction
- **From**: 63 tasks across all frameworks
- **To**: 25 critical path tasks for TypeScript/Next.js
- **Rationale**: Deliver 80% value with 20% effort

### 2. Technology Stack
- **AST Parser**: Babel (@babel/parser + @babel/traverse)
- **Templates**: Handlebars (logic-less, markdown-friendly)
- **Storage**: SQLite shadow cache (existing Weaver infra)
- **CLI**: Commander (already in dependencies)
- **Testing**: Vitest (existing setup)

### 3. Architecture Pattern
```
Input → Analysis → Generation → Output
  ↓         ↓          ↓          ↓
Scanner  Parser   Templates   Writer
  ↓         ↓          ↓          ↓
 Files   Nodes     VaultNodes  Vault
```

### 4. Integration Points
- ✅ Weaver Shadow Cache (metadata storage)
- ✅ Weaver Workflow Engine (orchestration)
- ✅ Weaver MCP Server (tool exposure)
- ✅ Weaver File Watcher (vault monitoring)
- ✅ Git Integration (version control)

---

## Critical Path Tasks (25)

### Phase 1: Foundation (Days 1-2)
1. Framework detector (TypeScript/Next.js)
2. Directory scanner with ignore patterns
3. TypeScript AST parser (Babel)
4. Parse package.json, tsconfig.json
5. Unit tests for scanner
6. Integration with Weaver config

### Phase 2: Content Generation (Days 2-3)
7. Template schema (YAML)
8. 3 core templates (concept, technical, component)
9. Handlebars template engine
10. Template loader and validator
11. Taxonomy mapper (app → vault structure)
12. Node generators (concept, technical, feature)
13. Wikilink relationship builder

### Phase 3: Output & Integration (Days 3-4)
14. Markdown file writer
15. Shadow cache population
16. Git repository initialization
17. Generate vault README.md
18. Generate concept-map.md (Mermaid)
19. CLI command with Commander
20. Interactive prompts
21. Progress reporting (ora + chalk)

### Phase 4: Testing & Polish (Days 4-5)
22. Unit tests (80%+ coverage)
23. E2E tests with real Next.js apps
24. MCP tool: `trigger_vault_initialization`
25. Vault initialization workflow

---

## Module Structure

```
src/vault-init/
├── detector/          # Framework detection
│   ├── index.ts
│   └── frameworks.ts
├── scanner/           # Directory scanning
│   ├── index.ts
│   └── ignore.ts
├── parser/            # AST parsing
│   ├── index.ts
│   ├── typescript.ts
│   └── javascript.ts
├── analyzer/          # Code analysis
│   ├── index.ts
│   └── relationships.ts
├── templates/         # Template engine
│   ├── index.ts
│   ├── schema/
│   └── handlebars/
├── generator/         # Node generation
│   ├── index.ts
│   ├── concept.ts
│   ├── technical.ts
│   └── component.ts
├── writer/            # Markdown writer
│   ├── index.ts
│   └── git.ts
└── cli/               # CLI interface
    └── index.ts
```

---

## Generated Vault Structure

```
vault/
├── README.md                 # Project overview
├── concept-map.md            # Mermaid architecture diagram
├── concepts/                 # High-level concepts
│   ├── authentication.md
│   ├── data-flow.md
│   └── state-management.md
├── technical/                # Technical details
│   ├── architecture.md
│   ├── api-routes.md
│   └── database-schema.md
├── features/                 # Feature documentation
│   ├── user-authentication.md
│   └── dashboard.md
├── components/               # Component documentation
│   ├── ui/
│   │   ├── Button.md
│   │   └── Input.md
│   └── layout/
│       ├── Header.md
│       └── Footer.md
└── .obsidian/                # Obsidian configuration
    ├── graph.json
    └── workspace.json
```

---

## API Design

### Public API
```typescript
import { initializeVault } from '@weave-nn/weaver/vault-init';

const result = await initializeVault({
  rootPath: '/path/to/nextjs-app',
  outputDir: './vault',
  templateId: 'nextjs',
  dryRun: false,
});

console.log(`Generated ${result.filesGenerated} files`);
console.log(`Created ${result.nodesCreated} knowledge nodes`);
```

### CLI Usage
```bash
# Interactive mode
weaver-init init

# With options
weaver-init init --output ./my-vault --template nextjs

# Dry run (preview)
weaver-init init --dry-run

# Via MCP tool (from AI agents)
# Tool: trigger_vault_initialization
# Args: { rootPath, outputDir, templateId }
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Analysis Time | < 30s for 1000 files | Fast initial scan |
| Generation Time | < 10s for 100 nodes | Responsive CLI |
| Memory Usage | < 200MB | Efficient for laptops |
| Test Coverage | > 80% | High quality |

---

## Implementation Timeline

### Day 1: Foundation
**Team**: Backend Dev, Code Analyzer, Tester
- Setup module structure
- Implement framework detector
- Build directory scanner
- Write unit tests

**Deliverable**: Codebase scanner for Next.js

### Day 2: Parsing
**Team**: Backend Dev, Code Analyzer, Tester
- Implement Babel AST parser
- Extract components/functions
- Build relationship graph
- Write parser tests

**Deliverable**: Code analyzer with AST extraction

### Day 3: Templates
**Team**: Coder, Template Specialist, Tester
- Create template schema
- Build 3 core templates
- Implement Handlebars engine
- Generate nodes with wikilinks

**Deliverable**: Template engine

### Day 4: Output
**Team**: Backend Dev, DevOps, Tester
- Markdown writer
- Shadow cache integration
- Git initialization
- CLI interface
- E2E tests

**Deliverable**: Working vault generation CLI

### Day 5: Integration
**Team**: Integration Specialist, Tester, Reviewer
- MCP tool integration
- Workflow integration
- Comprehensive testing
- Documentation
- Performance optimization

**Deliverable**: Production-ready system

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Babel parsing edge cases | Comprehensive tests, graceful fallback |
| Performance on large projects | Streaming processing, pagination |
| Template engine bugs | Extensive template validation |
| Shadow cache corruption | Transaction-based writes |
| Git conflicts | Check for existing .git, prompt user |

---

## Success Metrics

✅ **Time to First Vault**: < 60 seconds
✅ **Test Coverage**: > 80%
✅ **Documentation**: 100% APIs documented
✅ **Performance**: < 30s for 1000 files
✅ **Error Rate**: < 2% failed initializations

---

## Future Phases

### Phase 2 (Post-MVP)
- Python support (Django, FastAPI, Flask)
- React/Express support
- Vector embeddings for semantic search
- Claude-Flow content generation

### Phase 3
- Additional frameworks (Vue, Angular, Svelte)
- OpenAPI/Swagger extraction
- Custom template creation
- Multi-language documentation

### Phase 4
- Go/Rust support
- Incremental vault updates
- Real-time synchronization
- Advanced graph analytics

---

## Next Steps

1. **Review Architecture** (1 hour)
   - Team review and approval
   - Scope confirmation

2. **Setup Environment** (2 hours)
   - Create module structure
   - Install dependencies
   - Setup test infrastructure

3. **Spawn Development Agents** (Day 1)
   ```bash
   cd /home/aepod/dev/weave-nn/weaver

   # Use Claude Code's Task tool to spawn agents in parallel
   # Agent 1: Backend Developer (detector + scanner)
   # Agent 2: Code Analyzer (parser + analyzer)
   # Agent 3: Template Engineer (templates + generator)
   # Agent 4: Integration Engineer (writer + CLI)
   # Agent 5: Test Engineer (unit + E2E tests)
   ```

4. **Daily Coordination**
   - Morning standup (synchronize via hooks)
   - Integration checks (end of day)
   - Progress tracking (TodoWrite)

---

**Document**: `/home/aepod/dev/weave-nn/weaver/docs/PHASE-6-ARCHITECTURE.md`
**Summary**: `/home/aepod/dev/weave-nn/weaver/docs/PHASE-6-ARCHITECTURE-SUMMARY.md`
**Status**: ✅ Ready for Implementation
