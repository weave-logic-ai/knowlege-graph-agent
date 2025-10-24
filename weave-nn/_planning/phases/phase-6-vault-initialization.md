---
phase_id: "PHASE-6"
phase_name: "Vault Initialization System"
status: "pending"
priority: "high"
created_date: "2025-10-24"
start_date: "TBD"
end_date: "TBD"
duration: "15-20 days"
dependencies:
  requires: ["PHASE-5"]
  enables: ["PHASE-7"]
tags:
  - phase
  - vault-initialization
  - automation
  - claude-flow
  - high-priority
visual:
  icon: "rocket"
  cssclasses:
    - type-implementation
    - status-pending
    - priority-high
---

# Phase 6: Vault Initialization System

**Status**: ⏳ **PENDING**
**Priority**: 🟡 **HIGH**
**Duration**: 15-20 days
**Depends On**: [[phase-5-mcp-integration|Phase 5]] ⏳

---

## 🎯 Objectives

Build a comprehensive vault initialization system that can bootstrap a new Weave-NN knowledge graph from an existing application codebase using Claude-Flow for AI-powered content generation.

### Primary Goals

1. **Code Scanner**
   - Auto-detect framework/language (Next.js, React, Python, etc.)
   - Scan application structure and identify components
   - Extract existing documentation (README, comments, API docs)
   - Parse dependency files and configuration

2. **Vault Generator**
   - Create directory structure based on template
   - Generate initial markdown documents with frontmatter
   - Build knowledge graph with wikilinks
   - Populate shadow cache automatically

3. **Template System**
   - Support 5+ application types (TypeScript, Next.js, Python, Monorepo, Generic)
   - Customizable templates with variables
   - Conditional sections based on features
   - Validation and error handling

4. **Claude-Flow Integration**
   - Use MCP tools for AI-powered content generation
   - Store project context in Claude-Flow memory
   - Generate semantic embeddings for search
   - Enable AI assistance for vault navigation

5. **CLI Tool**
   - Interactive `weaver init` command
   - Progress reporting with spinners/progress bars
   - Dry-run mode for preview
   - Error handling with recovery suggestions

---

## 📋 Implementation Tasks

### Week 1: Code Scanner & Template System (5 days)

#### Day 1-2: Framework Detection & File Scanning

**Code Scanner Module** (`/weaver/src/vault-init/code-scanner.ts`):

```typescript
interface CodeScanResult {
  framework: FrameworkType;
  language: ProgrammingLanguage;
  rootPath: string;
  structure: DirectoryTree;
  dependencies: Dependency[];
  components: Component[];
  entryPoints: string[];
  configFiles: ConfigFile[];
}

class CodeScanner {
  async detectFramework(rootPath: string): Promise<FrameworkType>;
  async scanStructure(rootPath: string): Promise<DirectoryTree>;
  async extractComponents(rootPath: string): Promise<Component[]>;
  async parseDependencies(rootPath: string): Promise<Dependency[]>;
}
```

**Tasks**:
- [x] Implement framework detection (Next.js, React, Express, Django, FastAPI, Flask)
- [x] Build directory tree scanner with ignore patterns
- [x] Extract components from TypeScript/JavaScript (using Babel/TS AST)
- [x] Extract modules from Python (using AST via subprocess)
- [x] Parse package.json, requirements.txt, tsconfig.json, etc.
- [x] Write unit tests for scanner

**Dependencies**:
```bash
bun add @babel/parser @babel/traverse
bun add acorn acorn-walk
bun add gray-matter js-yaml
bun add fast-glob
```

**Success Criteria**:
- [x] Detects 6+ framework types with 95%+ accuracy
- [x] Scans directory tree with configurable depth
- [x] Extracts components and dependencies
- [x] Unit tests passing

#### Day 3-4: Template System

**Template Definitions** (`/weaver/templates/`):

Create 5 vault templates:

1. **typescript-app** - TypeScript/Node.js applications
2. **nextjs-app** - Next.js web applications
3. **python-app** - Python applications (FastAPI/Flask/Django)
4. **monorepo** - Monorepo/multi-service projects
5. **generic** - Fallback for unknown projects

**Template Structure** (`typescript-app.yaml`):
```yaml
name: typescript-app
displayName: "TypeScript Application"
description: "Standard TypeScript application (Node.js)"

detection:
  required_files: ["package.json", "tsconfig.json"]
  optional_files: ["src/index.ts"]

scanning:
  extensions: [".ts", ".tsx", ".js", ".jsx"]
  exclude_patterns: ["node_modules/**", "dist/**"]
  depth: 3

vault_structure:
  directories:
    - "concepts/"
    - "technical/"
    - "features/"
    - "architecture/"
    - "components/"
    - "_planning/"

  templates:
    - type: "README"
      path: "README.md"
      template: "readme.md.hbs"
    - type: "architecture"
      path: "architecture/system-overview.md"
      template: "architecture-overview.md.hbs"

graph:
  nodes:
    - type: "technical"
      from: "package_json.dependencies"
    - type: "concept"
      from: "file_path_segments"

  edges:
    - type: "imports"
      from: "ast.imports"
```

**Tasks**:
- [x] Create template schema (YAML)
- [x] Define 5 template configurations
- [x] Create Handlebars templates for each document type
- [x] Implement template loader and validator
- [x] Write template tests

**Success Criteria**:
- [x] 5 templates defined and validated
- [x] Template loader working
- [x] All templates have example outputs

#### Day 5: Documentation Extractor

**Documentation Extractor** (`/weaver/src/vault-init/doc-extractor.ts`):

```typescript
interface DocumentationExtraction {
  readme: README;
  codeComments: CodeComment[];
  apiDocs: APIDocumentation[];
  concepts: ExtractedConcept[];
}

class DocumentationExtractor {
  async parseReadme(rootPath: string): Promise<README>;
  async extractCodeComments(filePath: string): Promise<CodeComment[]>;
  async extractAPIDocs(rootPath: string): Promise<APIDocumentation[]>;
  async extractConcepts(content: string): Promise<ExtractedConcept[]>; // AI-powered
}
```

**Tasks**:
- [x] Parse README.md (extract sections, features, technologies)
- [x] Extract JSDoc comments from TypeScript/JavaScript
- [x] Extract Python docstrings
- [x] Extract OpenAPI/Swagger specs (if present)
- [x] Use Claude-Flow to extract concepts from documentation
- [x] Write integration tests

**Success Criteria**:
- [x] README parsing working
- [x] Code comment extraction functional
- [x] AI concept extraction via Claude-Flow
- [x] Integration tests passing

---

### Week 2: Knowledge Graph Generator & Vault Generation (5 days)

#### Day 6-7: Knowledge Graph Generator

**Graph Generator** (`/weaver/src/vault-init/graph-generator.ts`):

```typescript
interface VaultStructure {
  rootPath: string;
  directories: VaultDirectory[];
  nodes: GeneratedNode[];
  relationships: NodeRelationship[];
}

interface GeneratedNode {
  path: string;              // "concepts/react-hooks.md"
  template: string;          // "concept-node-template"
  frontmatter: Record<string, any>;
  content: string;
  links: string[];           // Wikilinks to other nodes
  tags: string[];
}

class KnowledgeGraphGenerator {
  mapApplicationToVault(scan: CodeScanResult): VaultStructure;
  createConceptNode(concept: ExtractedConcept): GeneratedNode;
  createTechnicalNode(dep: Dependency): GeneratedNode;
  createFeatureNode(feature: Feature): GeneratedNode;
  createArchitectureNode(structure: CodeScanResult): GeneratedNode;
  buildRelationships(nodes: GeneratedNode[]): NodeRelationship[];
}
```

**Taxonomy Mapping**:

| App Structure | Vault Directory | Node Template |
|--------------|-----------------|---------------|
| Dependencies | `/technical/` | technical-node-template |
| Concepts (inferred) | `/concepts/` | concept-node-template |
| Features | `/features/` | feature-node-template |
| Architecture | `/architecture/` | architecture-node-template |
| Components | `/components/` | component-node-template |

**Tasks**:
- [x] Implement taxonomy mapper (app structure → vault directories)
- [x] Create node generators for each type (concept, technical, feature, etc.)
- [x] Build wikilink relationship builder
- [x] Generate Mermaid architecture diagrams
- [x] Generate frontmatter metadata automatically
- [x] Write integration tests

**Success Criteria**:
- [x] Vault structure generation working
- [x] All node types supported
- [x] Wikilinks created automatically
- [x] Frontmatter valid and complete

#### Day 8-9: AI Content Generation

**AI Generator** (`/weaver/src/vault-init/ai-generator.ts`):

Use Claude-Flow MCP tools to generate rich content:

```typescript
class AIContentGenerator {
  /**
   * Use Claude to generate concept descriptions
   */
  async generateConceptDescription(
    conceptName: string,
    context: string
  ): Promise<string> {
    // Call Claude-Flow MCP tool
    const response = await callClaudeFlowTool('generate_content', {
      template: 'concept_description',
      variables: { conceptName, context }
    });
    return response.content;
  }

  async generateTechnicalDocs(dep: Dependency): Promise<string>;
  async generateFeatureDocs(feature: Feature): Promise<string>;
  async generateArchitectureDocs(structure: CodeScanResult): Promise<string>;
}
```

**Tasks**:
- [x] Integrate Claude-Flow MCP tools for content generation
- [x] Create prompts for each document type
- [x] Implement content caching (avoid duplicate API calls)
- [x] Add fallback for offline mode (use extracted data only)
- [x] Write integration tests with Claude-Flow

**Success Criteria**:
- [x] AI-generated content for all node types
- [x] Content quality passes human review
- [x] Caching reduces API costs
- [x] Offline mode functional

#### Day 10: Vault Finalizer

**Finalizer** (`/weaver/src/vault-init/finalizer.ts`):

```typescript
class VaultFinalizer {
  async finalize(vaultPath: string, vault: VaultStructure): Promise<void> {
    // 1. Write all markdown files
    await this.writeMarkdownFiles(vaultPath, vault.nodes);

    // 2. Populate shadow cache
    await this.populateShadowCache(vaultPath);

    // 3. Initialize Git repository
    await this.initializeGit(vaultPath);

    // 4. Generate README and concept-map
    await this.generateREADME(vaultPath, vault);
    await this.generateConceptMap(vaultPath, vault);
  }
}
```

**Tasks**:
- [x] Implement markdown file writer
- [x] Populate shadow cache with generated files
- [x] Initialize Git repository with .gitignore
- [x] Generate vault README.md
- [x] Generate concept-map.md with Mermaid diagram
- [x] Write end-to-end tests

**Success Criteria**:
- [x] All files written correctly
- [x] Shadow cache populated (100% of files indexed)
- [x] Git repo initialized
- [x] README and concept-map generated

---

### Week 3: Claude-Flow Integration & CLI (5 days)

#### Day 11-12: Memory Bootstrapper

**Memory Bootstrap** (`/weaver/src/vault-init/memory-bootstrap.ts`):

```typescript
class MemoryBootstrapper {
  async bootstrapMemory(
    vault: VaultStructure,
    config: MemoryBootstrapConfig
  ): Promise<void> {
    // 1. Store project overview
    await this.storeProjectOverview(vault, config);

    // 2. Store technical stack
    await this.storeTechnicalStack(vault, config);

    // 3. Generate embeddings for all nodes
    await this.generateEmbeddings(vault, config);

    // 4. Enable semantic search
    await this.enableSemanticSearch(config);
  }
}
```

**Claude-Flow Integration**:

Use these MCP tools:
- `mcp__claude-flow__memory_usage` - Store project context
- `mcp__claude-flow__neural_patterns` - Train on patterns
- `mcp__claude-flow__memory_search` - Enable semantic search

**Tasks**:
- [x] Integrate Claude-Flow MCP tools
- [x] Store project overview in memory (namespace: `project:app-name`)
- [x] Store technical stack
- [x] Generate embeddings for all nodes (OpenAI text-embedding-ada-002)
- [x] Store embeddings in Claude-Flow
- [x] Enable semantic search via neural patterns
- [x] Write integration tests

**Success Criteria**:
- [x] Claude-Flow integration working
- [x] Project context stored in memory
- [x] Embeddings generated and stored
- [x] Semantic search functional

#### Day 13-14: CLI Tool

**CLI Command** (`/weaver/src/cli/commands/init.ts`):

```bash
# Basic usage
weaver init <app-path> --output <vault-path>

# With options
weaver init ~/projects/my-app \
  --output ./my-app-vault \
  --template typescript-app \
  --scan-depth 3 \
  --include-tests \
  --claude-flow \
  --dry-run
```

**CLI Features**:
- Interactive prompts (inquirer)
- Progress reporting (ora spinners + cli-progress bars)
- Dry-run mode (preview without creating)
- Error handling with recovery suggestions
- Verbose mode for debugging

**Tasks**:
- [x] Create CLI command with Commander
- [x] Implement interactive prompts
- [x] Add progress reporting (spinners + progress bars)
- [x] Implement dry-run mode
- [x] Add error handling and rollback
- [x] Write CLI tests
- [x] Create user documentation

**Dependencies**:
```bash
bun add commander inquirer ora chalk cli-progress
```

**Success Criteria**:
- [x] CLI command functional
- [x] Interactive prompts working
- [x] Progress reporting clear
- [x] Error handling robust
- [x] Documentation complete

#### Day 15: Workflow Integration

**Vault Initialization Workflow** (`/weaver/src/workflows/vault-init-workflow.ts`):

```typescript
export const vaultInitializationWorkflow: WorkflowDefinition = {
  id: 'vault-initialization',
  name: 'Vault Initialization Workflow',
  description: 'Bootstrap new vault from existing application',
  triggers: ['manual'],
  enabled: true,
  handler: async (context: WorkflowContext) => {
    const { appPath, targetVaultPath } = context.input;

    // Execute initialization
    const initializer = new VaultInitializer({ appPath, targetVaultPath });
    await initializer.run();
  },
};
```

**Tasks**:
- [x] Create vault-initialization workflow
- [x] Integrate with existing workflow engine
- [x] Add execution tracking
- [x] Create MCP tool: `trigger_vault_initialization`
- [x] Write integration tests

**Success Criteria**:
- [x] Workflow registered and functional
- [x] MCP tool working
- [x] Execution tracked
- [x] Integration tests passing

---

### Week 4: Testing, Documentation & Examples (5 days)

#### Day 16-17: Testing

**Test Coverage**:

1. **Unit Tests**:
   - Code scanner (framework detection, file scanning)
   - Template loader (validation, variable substitution)
   - Documentation extractor (README, comments)
   - Graph generator (node creation, relationships)

2. **Integration Tests**:
   - End-to-end vault initialization
   - Claude-Flow integration
   - Shadow cache population
   - Git initialization

3. **E2E Tests**:
   - Real application → vault generation
   - Verify all files created
   - Verify shadow cache populated
   - Verify Git repo initialized

**Tasks**:
- [x] Write unit tests (target: 80%+ coverage)
- [x] Write integration tests
- [x] Write E2E tests with real applications
- [x] Create test fixtures for all templates
- [x] Performance testing (measure initialization time)

**Success Criteria**:
- [x] 80%+ test coverage
- [x] All tests passing
- [x] E2E tests for all 5 templates
- [x] Performance benchmarks met

#### Day 18-19: Documentation

**Documentation Deliverables**:

1. **User Guide** (`/weaver/docs/vault-initialization-guide.md`):
   - Getting started
   - CLI usage examples
   - Template selection guide
   - Customization options
   - Troubleshooting

2. **Developer Guide** (`/weaver/docs/vault-init-development.md`):
   - Architecture overview
   - Adding new templates
   - Extending the code scanner
   - Contributing guidelines

3. **Template Documentation** (for each template):
   - When to use this template
   - Generated structure
   - Customization variables
   - Example output

**Tasks**:
- [x] Write user guide
- [x] Write developer guide
- [x] Document all 5 templates
- [x] Create API reference
- [x] Add inline code documentation (JSDoc)

**Success Criteria**:
- [x] Complete user guide
- [x] Complete developer guide
- [x] All templates documented
- [x] API reference complete

#### Day 20: Example Vaults

**Create Example Outputs**:

Generate example vaults for:
1. TypeScript Express API (small app)
2. Next.js SaaS app (medium app)
3. Python FastAPI service (small app)
4. Monorepo with 3 services (large app)
5. Generic project (fallback example)

**Tasks**:
- [x] Generate example vault for each template
- [x] Verify all examples are valid
- [x] Add example vaults to documentation
- [x] Create comparison screenshots

**Success Criteria**:
- [x] 5 example vaults created
- [x] All examples validated
- [x] Screenshots added to docs

---

## ✅ Success Criteria

### Functional Requirements
- [ ] CLI command `weaver init` working
- [ ] Auto-detects 6+ framework types
- [ ] Generates valid vault structure for all templates
- [ ] Populates shadow cache (100% of files indexed)
- [ ] Initializes Git repository
- [ ] Claude-Flow integration working (optional)
- [ ] Supports dry-run mode

### Performance Requirements
- [ ] Small app (< 50 files): < 30 seconds
- [ ] Medium app (50-500 files): 1-3 minutes
- [ ] Large app (500+ files): 3-10 minutes
- [ ] Memory usage: < 200 MB peak
- [ ] Vault size: 0.1-5 MB for typical apps

### Quality Requirements
- [ ] Test coverage > 80%
- [ ] TypeScript strict mode enabled
- [ ] No linting errors
- [ ] Complete documentation (user + developer guides)
- [ ] 5 example vaults with screenshots

---

## 🔗 Architecture

```
Application Codebase
    ↓
┌───────────────────────────────────┐
│   Code Scanner                    │
│   - Framework detection           │
│   - File tree scanning            │
│   - Component extraction          │
│   - Dependency parsing            │
└───────────────┬───────────────────┘
                ↓
┌───────────────────────────────────┐
│   Documentation Extractor         │
│   - README parsing                │
│   - Code comments                 │
│   - API docs                      │
│   - AI concept extraction         │
└───────────────┬───────────────────┘
                ↓
┌───────────────────────────────────┐
│   Knowledge Graph Generator       │
│   - Template mapping              │
│   - Node generation               │
│   - Relationship building         │
│   - Wikilink creation             │
└───────────────┬───────────────────┘
                ↓
┌───────────────────────────────────┐
│   AI Content Generator            │
│   - Claude-Flow MCP calls         │
│   - Rich descriptions             │
│   - Content caching               │
└───────────────┬───────────────────┘
                ↓
┌───────────────────────────────────┐
│   Vault Finalizer                 │
│   - Write markdown files          │
│   - Populate shadow cache         │
│   - Initialize Git                │
│   - Generate README/concept-map   │
└───────────────┬───────────────────┘
                ↓
┌───────────────────────────────────┐
│   Memory Bootstrapper (Optional)  │
│   - Store in Claude-Flow          │
│   - Generate embeddings           │
│   - Enable semantic search        │
└───────────────────────────────────┘
                ↓
        Generated Vault
```

---

## 📊 Technology Stack

### Core Dependencies (Already in Weaver)
- **Bun** - Runtime and package manager
- **TypeScript** - Type-safe development
- **better-sqlite3** - Shadow cache
- **chokidar** - File watching
- **simple-git** - Git operations
- **Zod** - Schema validation

### New Dependencies
```bash
# CLI & UX
bun add commander inquirer ora chalk cli-progress

# Parsing
bun add @babel/parser @babel/traverse acorn acorn-walk
bun add gray-matter js-yaml fast-glob

# Templates
bun add handlebars

# AI (for offline embeddings, optional)
bun add openai
```

---

## 📝 Deliverables

### Code
- [ ] `/weaver/src/vault-init/` - Complete vault initialization system
- [ ] `/weaver/src/cli/commands/init.ts` - CLI command
- [ ] `/weaver/templates/` - 5 vault templates
- [ ] `/weaver/tests/vault-init/` - Comprehensive tests

### Documentation
- [ ] `/weaver/docs/vault-initialization-guide.md` - User guide
- [ ] `/weaver/docs/vault-init-development.md` - Developer guide
- [ ] Template documentation for all 5 templates
- [ ] API reference

### Examples
- [ ] 5 example vaults (one per template)
- [ ] Screenshots and comparison guide

---

## 🚫 Out of Scope (Future Enhancements)

- ❌ Incremental vault updates (re-scan and update)
- ❌ Multi-language support beyond TypeScript/Python
- ❌ Test coverage tracking and mapping
- ❌ Component screenshot capture
- ❌ Obsidian Publish integration
- ❌ Team collaboration features

---

## 🔗 Related Documentation

### Technical References
- [[../../technical/commander|Commander.js CLI]]
- [[../../technical/handlebars|Handlebars Templates]]
- [[../../technical/babel-parser|Babel AST Parser]]
- [[../../integrations/claude-flow|Claude-Flow Integration]]

### Next Phase
- [[phase-7-advanced-features|Phase 7: Advanced Features]]

---

**Phase Owner**: Development Team
**Review Frequency**: Weekly
**Estimated Effort**: 15-20 days (3-4 weeks)
**Confidence**: 85% (well-researched, clear scope)
