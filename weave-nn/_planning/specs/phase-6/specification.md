# Vault Initialization System - Specification

**Phase ID**: PHASE-6
**Status**: pending

---

## Overview

Build a comprehensive vault initialization system that can bootstrap a new Weave-NN knowledge graph from an existing application codebase. The system will automatically scan code structure, detect frameworks, extract documentation, generate knowledge graphs, and populate a fully-functional vault with shadow cache and Git initialization.

**Key Capabilities:**
- Auto-detect 6+ framework types (Next.js, React, Express, Django, FastAPI, Flask)
- Extract components, dependencies, and documentation from codebases
- Generate knowledge graphs with wikilinks and relationships
- AI-powered content generation via Claude-Flow (optional)
- Template-based vault generation (5 templates)
- CLI tool with interactive prompts and progress reporting

## Requirements

### 1. Code Scanner Module

**Purpose**: Analyze application codebase to extract structure, dependencies, and components.

**Functional Requirements:**
- **R1.1**: Framework Detection
  - Auto-detect framework type from file structure and dependencies
  - Support: Next.js, React, Express, Django, FastAPI, Flask, Generic
  - Accuracy: 95%+ correct framework identification
  - Fallback to "Generic" when framework cannot be determined

- **R1.2**: Directory Structure Scanning
  - Recursive directory tree traversal with configurable depth (default: 3)
  - Ignore patterns: `node_modules/`, `dist/`, `build/`, `.git/`, `__pycache__/`, `*.pyc`
  - Extract file paths, sizes, and modification times
  - Build hierarchical directory tree representation

- **R1.3**: Component Extraction
  - TypeScript/JavaScript: Parse with Babel AST to extract components, functions, classes
  - Python: Use subprocess to run Python AST parser, extract modules and classes
  - Identify entry points (main.ts, index.js, app.py, etc.)
  - Extract export/import relationships

- **R1.4**: Dependency Parsing
  - Parse `package.json` for npm dependencies
  - Parse `requirements.txt` for Python dependencies
  - Parse `tsconfig.json`, `jest.config.js`, `next.config.js` for configuration
  - Categorize dependencies: production, development, peer

- **R1.5**: Configuration Detection
  - Detect config files: `.env.example`, `.eslintrc`, `.prettierrc`, etc.
  - Parse and extract configuration settings
  - Store config metadata for vault generation

**Non-Functional Requirements:**
- Performance: Scan 500 files in < 10 seconds
- Memory: < 100 MB during scanning phase
- Error Handling: Gracefully handle parse errors, log warnings, continue scan

**Interfaces:**
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
```

---

### 2. Template System

**Purpose**: Define vault structures for different application types with customizable templates.

**Functional Requirements:**
- **R2.1**: Template Definition
  - YAML-based template schema
  - 5 templates: `typescript-app`, `nextjs-app`, `python-app`, `monorepo`, `generic`
  - Each template defines: directories, document types, graph structure

- **R2.2**: Template Loader
  - Load template from YAML file
  - Validate schema with Zod
  - Support template inheritance (base template + extensions)
  - Cache loaded templates in memory

- **R2.3**: Handlebars Integration
  - Use Handlebars for document template rendering
  - Support variables: `{{projectName}}`, `{{framework}}`, `{{dependencies}}`
  - Support conditionals: `{{#if hasTesting}}...{{/if}}`
  - Support loops: `{{#each dependencies}}...{{/each}}`

- **R2.4**: Variable Substitution
  - Extract variables from CodeScanResult
  - Substitute into template placeholders
  - Support custom variables from CLI flags

- **R2.5**: Conditional Sections
  - Include/exclude sections based on features
  - Example: Include testing section if Jest detected
  - Example: Include API section if Express detected

**Template Schema:**
```yaml
name: typescript-app
displayName: "TypeScript Application"
detection:
  required_files: ["package.json", "tsconfig.json"]
vault_structure:
  directories: ["concepts/", "technical/", "features/"]
  templates:
    - type: "README"
      path: "README.md"
      template: "readme.md.hbs"
```

**Non-Functional Requirements:**
- Template loading: < 100ms per template
- Validation: Catch schema errors with clear messages
- Extensibility: Easy to add new templates without code changes

---

### 3. Documentation Extractor

**Purpose**: Extract existing documentation from codebase (README, comments, API docs).

**Functional Requirements:**
- **R3.1**: README Parsing
  - Parse markdown README.md
  - Extract sections: Features, Technologies, Getting Started, etc.
  - Convert to structured data for vault generation

- **R3.2**: Code Comment Extraction
  - TypeScript/JavaScript: Extract JSDoc comments
  - Python: Extract docstrings from modules and functions
  - Preserve formatting and code examples

- **R3.3**: API Documentation Extraction
  - Detect OpenAPI/Swagger specs (openapi.yaml, swagger.json)
  - Extract API endpoints, parameters, responses
  - Convert to vault documentation format

- **R3.4**: AI Concept Extraction (Optional)
  - Use Claude-Flow MCP tools to extract concepts from documentation
  - Identify key domain concepts (e.g., "User Authentication", "Payment Processing")
  - Generate concept descriptions with AI

**Non-Functional Requirements:**
- Parsing: Handle malformed markdown gracefully
- AI Integration: Fallback to basic extraction if Claude-Flow unavailable
- Performance: Extract docs from 100 files in < 5 seconds

---

### 4. Knowledge Graph Generator

**Purpose**: Map application structure to vault knowledge graph with wikilinks and relationships.

**Functional Requirements:**
- **R4.1**: Taxonomy Mapping
  - Map app structure to vault directories
  - Dependencies → `/technical/` nodes
  - Inferred concepts → `/concepts/` nodes
  - Features → `/features/` nodes
  - Architecture → `/architecture/` nodes

- **R4.2**: Node Generation
  - Generate markdown files with frontmatter for each node
  - Include metadata: tags, type, created date, links
  - Generate content from extracted data + AI (if available)

- **R4.3**: Wikilink Relationship Building
  - Build bidirectional wikilinks between related nodes
  - Example: Feature links to Technical dependencies
  - Example: Concept links to Components that implement it

- **R4.4**: Mermaid Diagram Generation
  - Generate architecture diagram with Mermaid syntax
  - Show relationships between components
  - Include in `architecture/system-overview.md`

- **R4.5**: Frontmatter Generation
  - Auto-generate frontmatter for each node
  - Include: title, type, tags, created, modified, links
  - Ensure valid YAML syntax

**Non-Functional Requirements:**
- Graph completeness: All nodes connected with at least 1 link
- Performance: Generate 100 nodes in < 10 seconds
- Validation: Ensure no broken wikilinks

---

### 5. AI Content Generator (Optional)

**Purpose**: Use Claude-Flow MCP tools to generate rich, context-aware content for vault nodes.

**Functional Requirements:**
- **R5.1**: Claude-Flow Integration
  - Call MCP tools: `mcp__claude-flow__memory_usage`, `mcp__claude-flow__neural_patterns`
  - Store project context in memory namespace: `project:{app-name}`
  - Retrieve context for content generation

- **R5.2**: Content Generation Prompts
  - Concept description prompt: "Explain {concept} in context of {framework}"
  - Technical doc prompt: "Document {dependency} usage in {app-type}"
  - Feature doc prompt: "Describe {feature} functionality and implementation"

- **R5.3**: Content Caching
  - Cache AI-generated content to avoid duplicate API calls
  - Store in SQLite cache with TTL (24 hours)
  - Invalidate cache on template changes

- **R5.4**: Offline Mode Fallback
  - If Claude-Flow unavailable, use extracted data only
  - Generate basic descriptions from code comments
  - Log warning about reduced content quality

**Non-Functional Requirements:**
- API costs: < $0.10 per vault initialization (with caching)
- Performance: Generate content for 50 nodes in < 30 seconds
- Reliability: 100% fallback coverage for offline mode

---

### 6. Vault Finalizer

**Purpose**: Write all generated files, populate shadow cache, initialize Git repository.

**Functional Requirements:**
- **R6.1**: Markdown File Writing
  - Write all generated nodes to disk
  - Ensure correct file paths and directory structure
  - Validate markdown syntax

- **R6.2**: Shadow Cache Population
  - Index all generated files in shadow cache (SQLite)
  - Store metadata: path, content, frontmatter, wikilinks
  - Enable immediate search and query functionality

- **R6.3**: Git Initialization
  - Initialize Git repository with `git init`
  - Create `.gitignore` with sensible defaults
  - Create initial commit: "Initialize vault"

- **R6.4**: Vault README Generation
  - Generate top-level README.md for vault
  - Include project overview, structure, navigation tips
  - Link to key nodes (architecture, features)

- **R6.5**: Concept Map Generation
  - Generate `concept-map.md` with Mermaid diagram
  - Show all major concepts and relationships
  - Provide visual overview of knowledge graph

**Non-Functional Requirements:**
- Atomicity: All files written or none (rollback on error)
- Performance: Write 100 files + index in < 5 seconds
- Validation: 100% of files indexed in shadow cache

---

### 7. CLI Tool

**Purpose**: Provide user-friendly command-line interface for vault initialization.

**Functional Requirements:**
- **R7.1**: Command Interface
  - Command: `weaver init <app-path> --output <vault-path>`
  - Options: `--template`, `--scan-depth`, `--include-tests`, `--claude-flow`, `--dry-run`
  - Help text: `weaver init --help`

- **R7.2**: Interactive Prompts
  - Prompt for missing arguments (app path, output path)
  - Prompt for template selection (list 5 templates)
  - Confirm before writing files (unless --yes flag)

- **R7.3**: Progress Reporting
  - Ora spinners for long-running tasks (scanning, generating)
  - CLI progress bars for file writing
  - Clear status messages: "✓ Scanned 150 files", "✓ Generated 45 nodes"

- **R7.4**: Dry-Run Mode
  - Flag: `--dry-run`
  - Show what would be generated without writing files
  - Output summary: "Would create 45 files in 8 directories"

- **R7.5**: Error Handling
  - Catch all errors with user-friendly messages
  - Suggest recovery actions: "Try --scan-depth 2 to reduce scan scope"
  - Rollback partial writes on error

**CLI Examples:**
```bash
# Basic usage
weaver init ~/projects/my-app --output ./my-app-vault

# With options
weaver init ~/projects/my-app \
  --output ./my-app-vault \
  --template nextjs-app \
  --scan-depth 3 \
  --claude-flow \
  --dry-run

# Interactive mode
weaver init
```

**Non-Functional Requirements:**
- UX: Clear, concise output with emojis for visual clarity
- Performance: Responsive UI, no blocking operations
- Error messages: Actionable and helpful

---

### 8. Workflow Integration

**Purpose**: Integrate vault initialization with existing Weaver workflow engine.

**Functional Requirements:**
- **R8.1**: Workflow Definition
  - Create workflow: `vault-initialization`
  - Trigger: Manual (via CLI or MCP tool)
  - Handler: Execute VaultInitializer class

- **R8.2**: MCP Tool
  - Tool name: `trigger_vault_initialization`
  - Parameters: `appPath`, `outputPath`, `template`, `options`
  - Returns: Execution status, generated file count, errors

- **R8.3**: Execution Tracking
  - Log workflow execution start/end
  - Track progress: scan, extract, generate, finalize
  - Store execution metadata in database

**Non-Functional Requirements:**
- Integration: No breaking changes to existing workflows
- Logging: Detailed logs for debugging
- Idempotency: Can re-run without side effects

## Initial Task Breakdown

_Note: This is preliminary. Run /speckit.tasks for AI-powered task generation._

- [ ] Day 5: Documentation Extractor: **Documentation Extractor** (`/weaver/src/vault-init/doc-extractor.ts`):
- [ ] Day 10: Vault Finalizer: **Finalizer** (`/weaver/src/vault-init/finalizer.ts`):
- [ ] Day 15: Workflow Integration: **Vault Initialization Workflow** (`/weaver/src/workflows/vault-init-workflow.ts`):
- [ ] Day 20: Example Vaults: **Create Example Outputs**:
- [ ] Implement framework detection (Next.js, React, Express, Django, FastAPI, Flask)
- [ ] Build directory tree scanner with ignore patterns
- [ ] Extract components from TypeScript/JavaScript (using Babel/TS AST)
- [ ] Extract modules from Python (using AST via subprocess)
- [ ] Parse package.json, requirements.txt, tsconfig.json, etc.
- [ ] Write unit tests for scanner
- [ ] Detects 6+ framework types with 95%+ accuracy
- [ ] Scans directory tree with configurable depth
- [ ] Extracts components and dependencies
- [ ] Unit tests passing
- [ ] Create template schema (YAML)
- [ ] Define 5 template configurations
- [ ] Create Handlebars templates for each document type
- [ ] Implement template loader and validator
- [ ] Write template tests
- [ ] 5 templates defined and validated
- [ ] Template loader working
- [ ] All templates have example outputs
- [ ] Parse README.md (extract sections, features, technologies)
- [ ] Extract JSDoc comments from TypeScript/JavaScript
- [ ] Extract Python docstrings
- [ ] Extract OpenAPI/Swagger specs (if present)
- [ ] Use Claude-Flow to extract concepts from documentation
- [ ] Write integration tests
- [ ] README parsing working
- [ ] Code comment extraction functional
- [ ] AI concept extraction via Claude-Flow
- [ ] Integration tests passing
- [ ] Implement taxonomy mapper (app structure → vault directories)
- [ ] Create node generators for each type (concept, technical, feature, etc.)
- [ ] Build wikilink relationship builder
- [ ] Generate Mermaid architecture diagrams
- [ ] Generate frontmatter metadata automatically
- [ ] Write integration tests
- [ ] Vault structure generation working
- [ ] All node types supported
- [ ] Wikilinks created automatically
- [ ] Frontmatter valid and complete
- [ ] Integrate Claude-Flow MCP tools for content generation
- [ ] Create prompts for each document type
- [ ] Implement content caching (avoid duplicate API calls)
- [ ] Add fallback for offline mode (use extracted data only)
- [ ] Write integration tests with Claude-Flow
- [ ] AI-generated content for all node types
- [ ] Content quality passes human review
- [ ] Caching reduces API costs
- [ ] Offline mode functional
- [ ] Implement markdown file writer
- [ ] Populate shadow cache with generated files
- [ ] Initialize Git repository with .gitignore
- [ ] Generate vault README.md
- [ ] Generate concept-map.md with Mermaid diagram
- [ ] Write end-to-end tests
- [ ] All files written correctly
- [ ] Shadow cache populated (100% of files indexed)
- [ ] Git repo initialized
- [ ] README and concept-map generated
- [ ] Integrate Claude-Flow MCP tools
- [ ] Store project overview in memory (namespace: `project:app-name`)
- [ ] Store technical stack
- [ ] Generate embeddings for all nodes (OpenAI text-embedding-ada-002)
- [ ] Store embeddings in Claude-Flow
- [ ] Enable semantic search via neural patterns
- [ ] Write integration tests
- [ ] Claude-Flow integration working
- [ ] Project context stored in memory
- [ ] Embeddings generated and stored
- [ ] Semantic search functional
- [ ] Create CLI command with Commander
- [ ] Implement interactive prompts
- [ ] Add progress reporting (spinners + progress bars)
- [ ] Implement dry-run mode
- [ ] Add error handling and rollback
- [ ] Write CLI tests
- [ ] Create user documentation
- [ ] CLI command functional
- [ ] Interactive prompts working
- [ ] Progress reporting clear
- [ ] Error handling robust
- [ ] Documentation complete
- [ ] Create vault-initialization workflow
- [ ] Integrate with existing workflow engine
- [ ] Add execution tracking
- [ ] Create MCP tool: `trigger_vault_initialization`
- [ ] Write integration tests
- [ ] Workflow registered and functional
- [ ] MCP tool working
- [ ] Execution tracked
- [ ] Integration tests passing
- [ ] Write unit tests (target: 80%+ coverage)
- [ ] Write integration tests
- [ ] Write E2E tests with real applications
- [ ] Create test fixtures for all templates
- [ ] Performance testing (measure initialization time)
- [ ] 80%+ test coverage
- [ ] All tests passing
- [ ] E2E tests for all 5 templates
- [ ] Performance benchmarks met
- [ ] Write user guide
- [ ] Write developer guide
- [ ] Document all 5 templates
- [ ] Create API reference
- [ ] Add inline code documentation (JSDoc)
- [ ] Complete user guide
- [ ] Complete developer guide
- [ ] All templates documented
- [ ] API reference complete
- [ ] Generate example vault for each template
- [ ] Verify all examples are valid
- [ ] Add example vaults to documentation
- [ ] Create comparison screenshots
- [ ] 5 example vaults created
- [ ] All examples validated
- [ ] Screenshots added to docs

## Acceptance Criteria

### Module-Level Acceptance Criteria

#### 1. Code Scanner Module
- [ ] **AC1.1**: Correctly identifies framework in 95% of test cases (50+ real projects tested)
- [ ] **AC1.2**: Scans 500-file codebase in < 10 seconds
- [ ] **AC1.3**: Extracts all components with accurate export/import relationships
- [ ] **AC1.4**: Parses all dependency files without errors
- [ ] **AC1.5**: Handles parse errors gracefully (logs warning, continues scan)
- [ ] **AC1.6**: Memory usage stays < 100 MB during scan
- [ ] **AC1.7**: Unit test coverage > 85% for scanner module

#### 2. Template System
- [ ] **AC2.1**: All 5 templates (TypeScript, Next.js, Python, Monorepo, Generic) validate successfully
- [ ] **AC2.2**: Template loading completes in < 100ms per template
- [ ] **AC2.3**: Handlebars rendering produces valid markdown for all templates
- [ ] **AC2.4**: Variable substitution works for 20+ test variables
- [ ] **AC2.5**: Conditional sections include/exclude correctly based on features
- [ ] **AC2.6**: Schema validation catches malformed templates with clear error messages
- [ ] **AC2.7**: Unit test coverage > 90% for template system

#### 3. Documentation Extractor
- [ ] **AC3.1**: README parsing extracts all major sections (Features, Tech Stack, etc.)
- [ ] **AC3.2**: JSDoc extraction preserves formatting and code examples
- [ ] **AC3.3**: Python docstring extraction works for modules and functions
- [ ] **AC3.4**: OpenAPI/Swagger detection and parsing functional
- [ ] **AC3.5**: AI concept extraction generates meaningful concepts (manual review)
- [ ] **AC3.6**: Offline mode fallback produces basic documentation
- [ ] **AC3.7**: Integration test coverage > 80% for extractor

#### 4. Knowledge Graph Generator
- [ ] **AC4.1**: Taxonomy mapping creates correct vault directory structure for all templates
- [ ] **AC4.2**: All generated nodes have valid frontmatter (YAML lint passes)
- [ ] **AC4.3**: Wikilinks are bidirectional and no broken links exist
- [ ] **AC4.4**: Mermaid diagrams render correctly in Obsidian
- [ ] **AC4.5**: All nodes have at least 1 link (graph completeness)
- [ ] **AC4.6**: Generates 100 nodes in < 10 seconds
- [ ] **AC4.7**: Unit test coverage > 85% for graph generator

#### 5. AI Content Generator (Optional)
- [ ] **AC5.1**: Claude-Flow MCP integration works without errors
- [ ] **AC5.2**: Generated content is contextually relevant (manual review of 10+ samples)
- [ ] **AC5.3**: Content caching reduces API calls by 80%+ on second run
- [ ] **AC5.4**: Offline mode produces usable documentation (manual review)
- [ ] **AC5.5**: Total API cost for typical vault < $0.10
- [ ] **AC5.6**: Content generation for 50 nodes completes in < 30 seconds
- [ ] **AC5.7**: Integration test coverage > 75% for AI generator

#### 6. Vault Finalizer
- [ ] **AC6.1**: All generated files written to correct paths
- [ ] **AC6.2**: Shadow cache contains 100% of generated files
- [ ] **AC6.3**: Git repository initialized with valid .gitignore
- [ ] **AC6.4**: Initial commit created successfully
- [ ] **AC6.5**: Vault README is comprehensive and helpful (manual review)
- [ ] **AC6.6**: Concept map Mermaid diagram renders correctly
- [ ] **AC6.7**: Rollback works correctly on write errors
- [ ] **AC6.8**: E2E test coverage > 80% for finalizer

#### 7. CLI Tool
- [ ] **AC7.1**: Command `weaver init` executes without errors for all 5 templates
- [ ] **AC7.2**: Interactive prompts work and accept all inputs
- [ ] **AC7.3**: Progress reporting shows clear status updates
- [ ] **AC7.4**: Dry-run mode shows accurate preview without writing files
- [ ] **AC7.5**: Error messages are actionable and helpful (manual review)
- [ ] **AC7.6**: Help text is comprehensive: `weaver init --help`
- [ ] **AC7.7**: CLI UX tested by 3+ users with positive feedback

#### 8. Workflow Integration
- [ ] **AC8.1**: Workflow `vault-initialization` registered in workflow engine
- [ ] **AC8.2**: MCP tool `trigger_vault_initialization` callable and functional
- [ ] **AC8.3**: Execution tracking logs all phases (scan, extract, generate, finalize)
- [ ] **AC8.4**: Workflow execution metadata stored in database
- [ ] **AC8.5**: No breaking changes to existing workflows (all tests pass)
- [ ] **AC8.6**: Integration test coverage > 80% for workflow

### System-Level Acceptance Criteria

#### Performance
- [ ] **AC-P1**: Small app (< 50 files) initialization completes in < 30 seconds
- [ ] **AC-P2**: Medium app (50-500 files) initialization completes in 1-3 minutes
- [ ] **AC-P3**: Large app (500+ files) initialization completes in 3-10 minutes
- [ ] **AC-P4**: Memory usage peaks at < 200 MB during full initialization
- [ ] **AC-P5**: Generated vault size is 0.1-5 MB for typical apps
- [ ] **AC-P6**: Shadow cache indexing completes in < 5 seconds

#### Quality
- [ ] **AC-Q1**: Overall test coverage > 80% (unit + integration + E2E)
- [ ] **AC-Q2**: TypeScript strict mode enabled with 0 errors
- [ ] **AC-Q3**: Linting passes with 0 errors and 0 warnings
- [ ] **AC-Q4**: All public APIs have complete JSDoc documentation
- [ ] **AC-Q5**: E2E tests exist for all 5 templates
- [ ] **AC-Q6**: Performance benchmarks documented and met

#### Integration
- [ ] **AC-I1**: Existing Weaver tests all pass after integration
- [ ] **AC-I2**: Shadow cache integration works with existing queries
- [ ] **AC-I3**: Git initialization doesn't conflict with existing repos
- [ ] **AC-I4**: CLI command doesn't interfere with other Weaver commands
- [ ] **AC-I5**: MCP tools work alongside existing MCP integrations

#### Documentation
- [ ] **AC-D1**: User guide is complete with 5+ usage examples
- [ ] **AC-D2**: Developer guide covers architecture and extension points
- [ ] **AC-D3**: All 5 templates have documentation (when to use, structure, examples)
- [ ] **AC-D4**: API reference covers all public interfaces
- [ ] **AC-D5**: 5 example vaults generated and validated
- [ ] **AC-D6**: Screenshots and comparison guide included

### User Acceptance Testing

#### Manual Testing Scenarios
- [ ] **UAT1**: Initialize vault from real TypeScript project
- [ ] **UAT2**: Initialize vault from real Next.js project
- [ ] **UAT3**: Initialize vault from real Python project
- [ ] **UAT4**: Initialize vault from monorepo with multiple services
- [ ] **UAT5**: Test dry-run mode and verify accuracy
- [ ] **UAT6**: Test offline mode (without Claude-Flow)
- [ ] **UAT7**: Test error recovery (invalid paths, permission errors)
- [ ] **UAT8**: Verify generated vault is usable in Obsidian
- [ ] **UAT9**: Verify shadow cache queries work immediately
- [ ] **UAT10**: Verify Git repository is valid and has initial commit

## Out of Scope

### Explicitly Excluded from Phase 6

#### Future Enhancements (Phase 7+)
- ❌ **Incremental vault updates** - Re-scan and update existing vault with code changes
- ❌ **Multi-language support beyond TypeScript/Python** - Support for Rust, Go, Java, etc.
- ❌ **Test coverage tracking and mapping** - Map tests to source code in vault
- ❌ **Component screenshot capture** - Auto-capture UI component screenshots
- ❌ **Obsidian Publish integration** - Auto-publish vault to Obsidian Publish
- ❌ **Team collaboration features** - Multi-user vault editing, conflict resolution
- ❌ **Real-time vault updates** - Watch for code changes and auto-update vault
- ❌ **API endpoint testing** - Auto-generate API tests from OpenAPI specs
- ❌ **Dependency vulnerability scanning** - Integrate security scanning into vault
- ❌ **Code quality metrics** - Display code quality scores in vault nodes

#### Technical Debt (Not Addressed)
- ❌ **Legacy codebase support** - Support for codebases without package.json/requirements.txt
- ❌ **Monorepo with > 10 services** - Optimization for very large monorepos
- ❌ **Binary file handling** - Support for images, videos in vault generation
- ❌ **Database schema extraction** - Extract database schemas into vault
- ❌ **CI/CD pipeline visualization** - Map CI/CD pipelines in knowledge graph

#### Platform Limitations (Known)
- ❌ **Windows path handling edge cases** - Focus on Unix-like systems (Linux/macOS)
- ❌ **Non-Git version control** - Support for SVN, Mercurial, etc.
- ❌ **Cloud storage integration** - S3, GCS for vault storage
- ❌ **Mobile app support** - iOS/Android vault viewing apps

#### Performance Trade-offs (Accepted)
- ❌ **Sub-second initialization** - 30-second minimum for small apps is acceptable
- ❌ **Zero memory footprint** - 200 MB peak is acceptable
- ❌ **Infinite scan depth** - Max depth of 10 levels to prevent runaway scans
- ❌ **100% framework detection accuracy** - 95% accuracy is sufficient with Generic fallback

### Rationale for Exclusions

**Incremental Updates**: Requires complex change detection and conflict resolution. Better addressed in Phase 7 after core system is stable.

**Multi-language Support**: TypeScript and Python cover 80%+ of target use cases. Additional languages require significant parser integration work.

**Advanced Features**: Team collaboration, real-time updates, and publishing are valuable but not essential for MVP. Can be added incrementally.

**Performance Optimizations**: Current performance targets (< 3min for medium apps) are acceptable for initial release. Extreme optimizations can be done if user feedback demands it.

**Platform Support**: Focusing on Unix-like systems (Linux/macOS) simplifies development. Windows support can be added based on demand.

## Dependencies & Prerequisites

### External Dependencies
- **Bun** (>= 1.0.0) - Runtime and package manager
- **Node.js** (>= 18.0.0) - Required for Babel and AST parsing
- **Python** (>= 3.8) - Required for Python AST parsing subprocess
- **Git** (>= 2.0) - Required for repository initialization

### Internal Dependencies
- **Shadow Cache System** - Must be functional (from Phase 4)
- **Workflow Engine** - Must be functional (from Phase 5)
- **MCP Integration** - Must be functional (from Phase 5)

### New Package Dependencies
```bash
# CLI & UX (Required)
commander@^11.0.0
inquirer@^9.0.0
ora@^7.0.0
chalk@^5.0.0
cli-progress@^3.12.0

# Parsing (Required)
@babel/parser@^7.23.0
@babel/traverse@^7.23.0
acorn@^8.11.0
acorn-walk@^8.3.0
gray-matter@^4.0.3
js-yaml@^4.1.0
fast-glob@^3.3.0

# Templates (Required)
handlebars@^4.7.8

# AI (Optional)
openai@^4.0.0
```

## Risk Assessment

### High-Risk Areas

#### 1. Framework Detection Accuracy (Risk: Medium)
- **Risk**: Framework detection may not reach 95% accuracy on diverse codebases
- **Mitigation**: Extensive testing with 50+ real projects; fallback to "Generic" template
- **Impact**: Medium - Incorrect framework leads to suboptimal vault structure

#### 2. AST Parsing Failures (Risk: Medium)
- **Risk**: Babel/Python AST parsers may fail on complex or non-standard code
- **Mitigation**: Graceful error handling; log warnings and continue scan
- **Impact**: Low - Missing some components is acceptable; vault still functional

#### 3. Claude-Flow API Availability (Risk: Low)
- **Risk**: Claude-Flow MCP tools may be unavailable or rate-limited
- **Mitigation**: Offline mode fallback; content caching to reduce API calls
- **Impact**: Low - Vault still generated, just with reduced content quality

#### 4. Performance on Large Codebases (Risk: Medium)
- **Risk**: Initialization may exceed 10-minute target for very large codebases (1000+ files)
- **Mitigation**: Configurable scan depth; exclude patterns; progress reporting
- **Impact**: Medium - User experience degraded but still usable

#### 5. Shadow Cache Integration (Risk: Low)
- **Risk**: Shadow cache population may fail or be incomplete
- **Mitigation**: Transaction-based writes; rollback on error
- **Impact**: Medium - Vault unusable without shadow cache

### Low-Risk Areas
- **Template System**: Well-defined schema, easy to validate
- **Git Initialization**: Simple, well-tested library (simple-git)
- **CLI Tool**: Standard patterns, extensive examples available
- **Documentation Extraction**: Parsing markdown is straightforward

## Success Metrics

### Quantitative Metrics
- **Framework Detection Accuracy**: ≥ 95% on test suite of 50+ projects
- **Test Coverage**: ≥ 80% (unit + integration + E2E)
- **Performance**:
  - Small apps: < 30s
  - Medium apps: 1-3 min
  - Large apps: 3-10 min
- **Memory Usage**: < 200 MB peak
- **API Cost**: < $0.10 per vault (with caching)
- **Shadow Cache Completeness**: 100% of files indexed
- **Graph Completeness**: 100% of nodes have ≥ 1 link

### Qualitative Metrics
- **User Feedback**: 3+ users test CLI and report positive experience
- **Content Quality**: Manual review of AI-generated content (10+ samples)
- **Documentation Completeness**: User guide enables new user to initialize vault in < 10 minutes
- **Error Messages**: User can recover from errors without developer intervention
- **Vault Usability**: Generated vaults are immediately usable in Obsidian

## Next Steps

1. ✅ Review and refine with `/speckit.constitution` - **COMPLETED**
2. ✅ Elaborate requirements with `/speckit.specify` - **COMPLETED**
3. ⏭️  Generate implementation plan with `/speckit.plan` - **NEXT**
4. ⏭️  Break down tasks with `/speckit.tasks`
5. ⏭️  Begin implementation with `/speckit.implement`

---

**Generated**: 2025-10-24T02:42:10.613Z
**Updated**: 2025-10-24T02:45:00.000Z
**Source**: Phase planning document for PHASE-6
**Status**: Specification elaborated and ready for planning phase