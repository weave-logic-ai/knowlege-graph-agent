# Phase 6: Vault Initialization - Implementation Guide

**Target**: 3-5 days with 4-5 agents working in parallel
**Critical Path**: 25 tasks
**Working Directory**: `/home/aepod/dev/weave-nn/weaver`

---

## Prerequisites

### 1. Review Architecture Documents
- [ ] Read `/home/aepod/dev/weave-nn/weaver/docs/PHASE-6-ARCHITECTURE.md`
- [ ] Review `/home/aepod/dev/weave-nn/weaver/docs/PHASE-6-ARCHITECTURE-SUMMARY.md`
- [ ] Study `/home/aepod/dev/weave-nn/weaver/docs/PHASE-6-ARCHITECTURE-DIAGRAM.md`

### 2. Environment Setup
```bash
cd /home/aepod/dev/weave-nn/weaver

# Install new dependencies
bun add @babel/parser @babel/traverse handlebars ora chalk
bun add -d @types/babel__core @types/babel__traverse

# Verify existing dependencies
bun install

# Run type check
bun run typecheck

# Run linter
bun run lint
```

### 3. Create Module Structure
```bash
cd /home/aepod/dev/weave-nn/weaver

# Create vault-init module structure
mkdir -p src/vault-init/{detector,scanner,parser,analyzer,templates,generator,writer,cli}
mkdir -p src/vault-init/templates/{schema,handlebars}
mkdir -p src/mcp-server/tools/vault-init
mkdir -p tests/vault-init/{detector,scanner,parser,analyzer,templates,generator,writer}

# Verify structure
tree src/vault-init -L 2
```

---

## Agent Team Structure

### Agent 1: Backend Developer
**Modules**: Framework Detector, Directory Scanner
**Tasks**: 1, 2, 4, 5, 6
**Duration**: Days 1-2

### Agent 2: Code Analyzer
**Modules**: AST Parser, Code Analyzer
**Tasks**: 3, 11, 12
**Duration**: Days 1-2

### Agent 3: Template Engineer
**Modules**: Template Engine, Node Generator
**Tasks**: 7, 8, 9, 10, 13
**Duration**: Days 2-3

### Agent 4: Integration Engineer
**Modules**: Markdown Writer, CLI, MCP Tool
**Tasks**: 14-21, 24
**Duration**: Days 3-4

### Agent 5: Test Engineer
**Modules**: Unit Tests, E2E Tests
**Tasks**: 22, 23, 25
**Duration**: Days 1-5 (continuous)

---

## Day-by-Day Implementation Plan

### Day 1: Foundation (Tasks 1-6)

#### Morning (4 hours)
**Agent 1**: Framework Detector
```bash
cd /home/aepod/dev/weave-nn/weaver

# Run coordination hook
npx claude-flow@alpha hooks pre-task --description "Implement framework detector"

# Create files
# - src/vault-init/detector/index.ts
# - src/vault-init/detector/frameworks.ts
# - src/vault-init/detector/types.ts
# - tests/vault-init/detector/detector.test.ts

# Post-task hook
npx claude-flow@alpha hooks post-edit --file "src/vault-init/detector/index.ts"
```

**Agent 2**: AST Parser Setup
```bash
# Create files
# - src/vault-init/parser/index.ts
# - src/vault-init/parser/typescript.ts
# - tests/vault-init/parser/parser.test.ts
```

**Agent 5**: Test Infrastructure
```bash
# Setup test fixtures
# - tests/fixtures/nextjs-app/
# - tests/fixtures/react-app/
```

#### Afternoon (4 hours)
**Agent 1**: Directory Scanner
```bash
# Create files
# - src/vault-init/scanner/index.ts
# - src/vault-init/scanner/ignore.ts
# - tests/vault-init/scanner/scanner.test.ts
```

**Agent 2**: Babel AST Parser
```bash
# Implement TypeScript parsing
# - Parse components from .tsx files
# - Extract functions and classes
# - Build dependency graph
```

**Agent 5**: Unit Tests for Scanner + Detector
```bash
# Write comprehensive tests
bun run test -- tests/vault-init/detector
bun run test -- tests/vault-init/scanner
```

#### End of Day 1 Deliverable
- ✅ Framework detector (detects Next.js from package.json)
- ✅ Directory scanner (scans files, respects .gitignore patterns)
- ✅ AST parser skeleton (Babel integration working)
- ✅ 80%+ test coverage for detector and scanner

---

### Day 2: Parsing & Analysis (Tasks 7-12)

#### Morning (4 hours)
**Agent 2**: Code Analyzer
```bash
# Create files
# - src/vault-init/analyzer/index.ts
# - src/vault-init/analyzer/relationships.ts
# - tests/vault-init/analyzer/analyzer.test.ts

# Implement:
# - Component extraction from AST
# - Relationship building (imports, exports)
# - Metadata extraction (package.json, tsconfig.json)
```

**Agent 3**: Template Schema
```bash
# Create template schemas
# - src/vault-init/templates/schema/concept-node.yaml
# - src/vault-init/templates/schema/technical-node.yaml
# - src/vault-init/templates/schema/component-node.yaml
```

**Agent 5**: Parser Tests
```bash
# Write tests for AST parser
# Test with real Next.js components
bun run test -- tests/vault-init/parser
```

#### Afternoon (4 hours)
**Agent 3**: Template Engine
```bash
# Create files
# - src/vault-init/templates/index.ts
# - src/vault-init/templates/engine.ts
# - src/vault-init/templates/loader.ts
# - src/vault-init/templates/handlebars/concept-node.hbs
# - src/vault-init/templates/handlebars/technical-node.hbs
# - src/vault-init/templates/handlebars/component-node.hbs
# - tests/vault-init/templates/engine.test.ts

# Implement Handlebars engine
# - Load templates from directory
# - Register custom helpers
# - Validate against schema
```

**Agent 2**: Integration with Config
```bash
# Integrate with Weaver config
# - Add vault-init configuration to src/config/index.ts
# - Add default templates path
# - Add ignore patterns
```

**Agent 5**: Analyzer Tests
```bash
# Write comprehensive analyzer tests
bun run test -- tests/vault-init/analyzer
```

#### End of Day 2 Deliverable
- ✅ AST parser extracts components and functions
- ✅ Code analyzer builds relationship graph
- ✅ Template schema defined (3 core types)
- ✅ Handlebars template engine working
- ✅ 80%+ test coverage for parser and analyzer

---

### Day 3: Generation (Tasks 13-17)

#### Morning (4 hours)
**Agent 3**: Node Generator
```bash
# Create files
# - src/vault-init/generator/index.ts
# - src/vault-init/generator/concept.ts
# - src/vault-init/generator/technical.ts
# - src/vault-init/generator/component.ts
# - src/vault-init/generator/wikilinks.ts
# - tests/vault-init/generator/generator.test.ts

# Implement:
# - Generate concept nodes from high-level analysis
# - Generate technical nodes (architecture, API routes)
# - Generate component nodes from AST
# - Build wikilinks between nodes
```

**Agent 4**: Markdown Writer Setup
```bash
# Create files
# - src/vault-init/writer/index.ts
# - src/vault-init/writer/types.ts
# - tests/vault-init/writer/writer.test.ts
```

**Agent 5**: Generator Tests
```bash
# Write tests for node generation
# Verify output structure matches schema
bun run test -- tests/vault-init/generator
```

#### Afternoon (4 hours)
**Agent 3**: Taxonomy Mapper
```bash
# Implement taxonomy mapping
# - Map app structure to vault directories
# - Create concept hierarchy
# - Define wikilink patterns
```

**Agent 4**: Markdown Writer
```bash
# Implement:
# - Write markdown files with frontmatter
# - Create directory structure
# - Generate README.md
# - Generate concept-map.md with Mermaid
```

**Agent 5**: Integration Tests
```bash
# Test end-to-end flow: Scanner → Parser → Analyzer → Generator
# Verify output matches expected structure
```

#### End of Day 3 Deliverable
- ✅ Node generator creates concept/technical/component nodes
- ✅ Wikilinks built between related nodes
- ✅ Markdown writer creates vault structure
- ✅ README.md and concept-map.md generated
- ✅ 80%+ test coverage for generator and writer

---

### Day 4: Output & CLI (Tasks 18-21)

#### Morning (4 hours)
**Agent 4**: Shadow Cache Integration
```bash
# Create files
# - src/vault-init/writer/cache.ts

# Implement:
# - Populate shadow cache after vault generation
# - Use existing ShadowCache from src/shadow-cache
```

**Agent 4**: Git Initialization
```bash
# Create files
# - src/vault-init/writer/git.ts

# Implement:
# - Initialize git repository
# - Create .gitignore (exclude .obsidian workspace)
# - Initial commit with all files
# - Use simple-git (already in dependencies)
```

**Agent 1**: CLI Interface
```bash
# Create files
# - src/vault-init/cli/index.ts
# - src/vault-init/cli/commands.ts
# - src/vault-init/cli/prompts.ts

# Implement:
# - Commander-based CLI
# - Interactive prompts (inquirer-style)
# - Progress reporting with ora
# - Colored output with chalk
```

**Agent 5**: Writer Tests
```bash
# Test markdown writer
# Test shadow cache integration
# Test git initialization
bun run test -- tests/vault-init/writer
```

#### Afternoon (4 hours)
**Agent 1**: CLI Progress Reporting
```bash
# Implement:
# - Spinner for long operations (scanning, parsing)
# - Progress bars for file generation
# - Success/error messages with chalk colors
```

**Agent 4**: Dry Run Mode
```bash
# Implement:
# - Preview vault structure without writing files
# - Show file count and size estimates
# - Display sample markdown output
```

**Agent 2**: Public API
```bash
# Create files
# - src/vault-init/index.ts

# Implement:
# - Export initializeVault() function
# - Type-safe options interface
# - Result interface with stats
```

**Agent 5**: E2E Tests Setup
```bash
# Create real Next.js test fixture
# - Copy a small Next.js app to tests/fixtures/
# - Run full vault initialization
# - Verify vault structure
```

#### End of Day 4 Deliverable
- ✅ CLI interface with Commander
- ✅ Interactive prompts and progress reporting
- ✅ Shadow cache populated after generation
- ✅ Git repository initialized
- ✅ Dry run mode working
- ✅ E2E test infrastructure ready

---

### Day 5: Integration & Testing (Tasks 22-25)

#### Morning (4 hours)
**Agent 4**: MCP Tool
```bash
# Create files
# - src/mcp-server/tools/vault-init/trigger-init.ts
# - src/mcp-server/tools/vault-init/get-status.ts
# - src/mcp-server/tools/vault-init/index.ts

# Register tool in src/mcp-server/tools/registry.ts
```

**Agent 4**: Workflow Integration
```bash
# Create files
# - src/workflows/vault-init-workflow.ts

# Register workflow in src/index.ts
```

**Agent 5**: Comprehensive E2E Tests
```bash
# Create files
# - tests/vault-init/e2e/nextjs-app.e2e.test.ts
# - tests/vault-init/e2e/react-app.e2e.test.ts

# Test scenarios:
# - Full Next.js app initialization
# - Dry run mode
# - Error handling (invalid path, no framework)
# - Shadow cache population
# - Git initialization
```

**Agent 2**: Documentation
```bash
# Create files
# - docs/VAULT-INIT-USER-GUIDE.md
# - docs/VAULT-INIT-API.md

# Document:
# - CLI usage examples
# - MCP tool usage
# - Template customization
# - Troubleshooting
```

#### Afternoon (4 hours)
**Agent 5**: Performance Testing
```bash
# Test performance targets:
# - Analysis time < 30s for 1000 files
# - Generation time < 10s for 100 nodes
# - Memory usage < 200MB

# Create benchmark suite
# - tests/vault-init/benchmarks/performance.bench.ts
```

**Agent 1**: Error Handling & Validation
```bash
# Add comprehensive error handling:
# - Graceful degradation (missing framework)
# - User-friendly error messages
# - Validation for all inputs
# - Rollback on failure
```

**Agent 3**: Template Customization
```bash
# Allow custom templates:
# - Load from custom directory
# - Override built-in templates
# - Validate custom schemas
```

**All Agents**: Code Review & Quality Checks
```bash
# Final quality checks:
bun run typecheck  # Must pass
bun run lint       # Must pass
bun run test       # Must pass (80%+ coverage)
bun run build      # Must succeed

# Review architecture compliance:
# - Verify all modules follow interface contracts
# - Check integration points
# - Validate error handling
```

#### End of Day 5 Deliverable
- ✅ MCP tool registered and working
- ✅ Workflow integration complete
- ✅ Comprehensive E2E tests (80%+ coverage)
- ✅ Performance benchmarks pass targets
- ✅ User documentation complete
- ✅ All quality checks passing
- ✅ Production-ready vault initialization system

---

## Coordination Protocol

### Daily Standup (via Claude-Flow Hooks)
```bash
# Each agent runs at start of day:
npx claude-flow@alpha hooks pre-task --description "Day X: [Module] implementation"

# After each significant edit:
npx claude-flow@alpha hooks post-edit --file "src/vault-init/[module]/[file].ts"

# At end of day:
npx claude-flow@alpha hooks post-task --task-id "[task-id]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

### Integration Checkpoints
**End of Day 1**:
```bash
# Agent 5 verifies:
bun run test -- tests/vault-init/detector
bun run test -- tests/vault-init/scanner
bun run typecheck
```

**End of Day 2**:
```bash
# Agent 5 verifies:
bun run test -- tests/vault-init/parser
bun run test -- tests/vault-init/analyzer
bun run test -- tests/vault-init/templates
bun run typecheck
```

**End of Day 3**:
```bash
# Agent 5 verifies:
bun run test -- tests/vault-init/generator
bun run test -- tests/vault-init/writer
bun run typecheck
```

**End of Day 4**:
```bash
# Agent 5 verifies:
bun run test -- tests/vault-init/cli
bun run test -- tests/vault-init
bun run typecheck
```

**End of Day 5**:
```bash
# Full quality check:
bun run typecheck  # Must pass with 0 errors
bun run lint       # Must pass with 0 errors
bun run test       # Must pass with 80%+ coverage
bun run build      # Must complete successfully

# Manual verification:
./dist/vault-init/cli/index.js init --help
./dist/vault-init/cli/index.js init --dry-run
```

---

## Testing Checklist

### Unit Tests (Per Module)
- [ ] Framework detector tests (5+ test cases)
- [ ] Directory scanner tests (10+ test cases)
- [ ] AST parser tests (15+ test cases)
- [ ] Code analyzer tests (10+ test cases)
- [ ] Template engine tests (8+ test cases)
- [ ] Node generator tests (12+ test cases)
- [ ] Markdown writer tests (8+ test cases)
- [ ] CLI tests (6+ test cases)

### Integration Tests
- [ ] Scanner → Parser integration
- [ ] Parser → Analyzer integration
- [ ] Analyzer → Generator integration
- [ ] Generator → Writer integration
- [ ] Writer → Shadow Cache integration
- [ ] Writer → Git integration
- [ ] MCP Tool → Workflow integration

### E2E Tests
- [ ] Next.js app initialization (happy path)
- [ ] React app initialization
- [ ] Dry run mode
- [ ] Error handling (invalid path)
- [ ] Error handling (no framework detected)
- [ ] Shadow cache population verification
- [ ] Git initialization verification

### Performance Tests
- [ ] Analysis time < 30s for 1000 files
- [ ] Generation time < 10s for 100 nodes
- [ ] Memory usage < 200MB
- [ ] CLI responsiveness

---

## Quality Gates

### Before Merge
- [ ] All unit tests passing (80%+ coverage)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Performance benchmarks passing
- [ ] TypeScript compilation succeeds (0 errors)
- [ ] ESLint passes (0 errors)
- [ ] Documentation complete
- [ ] Code reviewed by at least 2 agents

### Production Readiness
- [ ] CLI working end-to-end
- [ ] MCP tool registered and functional
- [ ] Workflow integration tested
- [ ] User guide published
- [ ] API documentation published
- [ ] Example vaults generated and verified

---

## Troubleshooting

### Common Issues

**Issue**: Babel parser fails on TypeScript files
```bash
# Solution: Ensure @babel/parser has TypeScript plugin
import { parse } from '@babel/parser';
const ast = parse(code, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx']
});
```

**Issue**: Shadow cache not updating
```bash
# Solution: Ensure shadow cache is imported from existing module
import { createShadowCache } from '../shadow-cache/index.js';
const cache = createShadowCache(config.shadowCache.dbPath, vaultPath);
await cache.syncVault();
```

**Issue**: Git initialization fails
```bash
# Solution: Check if git is available
import simpleGit from 'simple-git';
const git = simpleGit(vaultPath);
await git.init();
```

**Issue**: Template rendering errors
```bash
# Solution: Validate data before rendering
import Handlebars from 'handlebars';
const template = Handlebars.compile(templateSource);
const output = template(validatedData);
```

---

## Success Metrics

Track these metrics throughout implementation:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Test Coverage | > 80% | `bun run test --coverage` |
| Build Time | < 30s | `time bun run build` |
| Type Errors | 0 | `bun run typecheck` |
| Lint Errors | 0 | `bun run lint` |
| E2E Test Time | < 2 min | `time bun run test -- tests/vault-init/e2e` |
| Analysis Time | < 30s | Benchmark suite |
| Generation Time | < 10s | Benchmark suite |
| Memory Usage | < 200MB | `node --max-old-space-size=200 dist/vault-init/cli/index.js` |

---

## Post-Implementation

### Phase 2 Planning (Weeks 2-3)
- Python support (Django, FastAPI, Flask)
- React/Express support
- Vector embeddings integration
- Claude-Flow content generation

### Monitoring
- Track vault initialization success rate
- Monitor performance metrics
- Collect user feedback
- Identify edge cases

### Continuous Improvement
- Add more templates based on user requests
- Optimize performance for large projects
- Enhance error messages
- Improve documentation

---

## Resources

- **Architecture**: `/home/aepod/dev/weave-nn/weaver/docs/PHASE-6-ARCHITECTURE.md`
- **Summary**: `/home/aepod/dev/weave-nn/weaver/docs/PHASE-6-ARCHITECTURE-SUMMARY.md`
- **Diagrams**: `/home/aepod/dev/weave-nn/weaver/docs/PHASE-6-ARCHITECTURE-DIAGRAM.md`
- **Spec**: `/home/aepod/dev/weave-nn/weave-nn/_planning/specs/phase-6-vault-initialization/specification.md`
- **Working Directory**: `/home/aepod/dev/weave-nn/weaver`

---

**Status**: ✅ Ready to Begin Implementation
**Next Action**: Spawn 4-5 agents and begin Day 1
