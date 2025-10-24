# Vault Initialization System - Constitution

**Phase ID**: PHASE-6
**Status**: pending
**Priority**: high
**Duration**: 15-20 days

---

## Project Principles

### 1. **User-Centric Automation**
- Minimize manual work required to bootstrap a vault
- Provide clear progress feedback during initialization
- Support dry-run mode for preview before commitment
- Graceful error handling with actionable recovery suggestions

### 2. **Intelligence & Context Awareness**
- Leverage AI (Claude-Flow) for content generation and concept extraction
- Auto-detect framework and language from codebase structure
- Generate semantic embeddings for intelligent search
- Build meaningful knowledge graph relationships automatically

### 3. **Flexibility & Extensibility**
- Support 5+ application types (TypeScript, Next.js, Python, Monorepo, Generic)
- Template-based system for customization
- Pluggable architecture for adding new frameworks
- Conditional sections based on detected features

### 4. **Quality & Completeness**
- Generate comprehensive documentation from extracted context
- Build valid knowledge graphs with wikilinks
- Populate shadow cache for immediate functionality
- Initialize Git repository for version control

### 5. **Performance & Efficiency**
- Fast initialization (< 30s for small apps, < 3min for medium apps)
- Memory efficient (< 200 MB peak usage)
- Content caching to reduce API costs
- Offline mode fallback when AI unavailable

### 6. **Integration & Compatibility**
- Seamless integration with existing Weaver components
- No breaking changes to current functionality
- Claude-Flow MCP integration (optional but recommended)
- Works with existing shadow cache and workflow systems

## Technical Constraints

### Runtime & Tooling
- **Bun** - Runtime and package manager (already in use)
- **TypeScript strict mode** - Type safety required
- **Node.js compatibility** - AST parsing for JS/TS via Babel
- **Python subprocess** - AST parsing for Python via external process

### Dependencies

#### Existing (Already in Weaver)
- `better-sqlite3` - Shadow cache database
- `chokidar` - File watching (not used in init, but present)
- `simple-git` - Git operations
- `zod` - Schema validation

#### New Required Dependencies
```bash
# CLI & UX
commander inquirer ora chalk cli-progress

# Parsing
@babel/parser @babel/traverse acorn acorn-walk
gray-matter js-yaml fast-glob

# Templates
handlebars

# AI (optional, for offline embeddings)
openai
```

### Architecture Constraints
- **Modular Design** - Separate modules for scanning, extraction, generation, finalization
- **Pipeline Architecture** - Linear flow from code scan → vault generation
- **Template-Driven** - All vault structures defined via YAML templates
- **Database-First** - Shadow cache populated during vault creation

### Code Quality Constraints
- Pass typecheck + lint before completion
- No breaking changes to existing components
- Test coverage > 80% (unit + integration + E2E)
- TypeScript strict mode enabled
- No linting errors
- Complete JSDoc documentation

### Performance Constraints
- Small app (< 50 files): < 30 seconds
- Medium app (50-500 files): 1-3 minutes
- Large app (500+ files): 3-10 minutes
- Memory usage: < 200 MB peak
- Generated vault size: 0.1-5 MB for typical apps

## Success Criteria

### Functional Requirements
✅ **Core Functionality**
- [ ] CLI command `weaver init` working with all options
- [ ] Auto-detects 6+ framework types (Next.js, React, Express, Django, FastAPI, Flask)
- [ ] Generates valid vault structure for all 5 templates
- [ ] Populates shadow cache with 100% of generated files indexed
- [ ] Initializes Git repository with proper .gitignore
- [ ] Supports dry-run mode for preview
- [ ] Interactive prompts for configuration
- [ ] Progress reporting with spinners and progress bars

✅ **Code Scanning**
- [ ] Framework detection with 95%+ accuracy
- [ ] Directory tree scanning with configurable depth
- [ ] Component extraction from TypeScript/JavaScript (via Babel AST)
- [ ] Module extraction from Python (via AST subprocess)
- [ ] Dependency parsing (package.json, requirements.txt, etc.)
- [ ] Config file detection and parsing

✅ **Template System**
- [ ] 5 templates defined and validated (TypeScript, Next.js, Python, Monorepo, Generic)
- [ ] Template loader working with YAML schema validation
- [ ] Handlebars template rendering functional
- [ ] Variable substitution working
- [ ] Conditional sections based on features

✅ **Knowledge Graph Generation**
- [ ] Taxonomy mapping (app structure → vault directories)
- [ ] Node generation for all types (concept, technical, feature, architecture, component)
- [ ] Wikilink relationship building
- [ ] Mermaid architecture diagram generation
- [ ] Frontmatter metadata generation

✅ **AI Integration (Optional but Recommended)**
- [ ] Claude-Flow MCP tools integration working
- [ ] AI-generated content for concept descriptions
- [ ] AI-generated technical documentation
- [ ] Content caching to reduce API costs
- [ ] Offline mode fallback functional

✅ **Documentation & Examples**
- [ ] Complete user guide
- [ ] Complete developer guide
- [ ] All 5 templates documented
- [ ] API reference complete
- [ ] 5 example vaults generated (one per template)
- [ ] Screenshots and comparison guide

### Performance Requirements
- [ ] Small app (< 50 files): < 30 seconds
- [ ] Medium app (50-500 files): 1-3 minutes
- [ ] Large app (500+ files): 3-10 minutes
- [ ] Memory usage: < 200 MB peak
- [ ] Vault size: 0.1-5 MB for typical apps
- [ ] Shadow cache indexing: < 5 seconds for typical vault

### Quality Requirements
- [ ] Test coverage > 80% (unit + integration + E2E)
- [ ] TypeScript strict mode enabled (0 errors)
- [ ] No linting errors (0 warnings)
- [ ] Complete JSDoc documentation for all public APIs
- [ ] E2E tests for all 5 templates
- [ ] Performance benchmarks met and documented

### Integration Requirements
- [ ] Vault initialization workflow registered in workflow engine
- [ ] MCP tool: `trigger_vault_initialization` working
- [ ] Shadow cache integration functional
- [ ] Git initialization working
- [ ] No breaking changes to existing Weaver components
- [ ] Existing tests still passing after integration

## Quality Standards

All code must meet Weave-NN quality standards:

```bash
# Type checking
bun run typecheck  # Must pass with 0 errors

# Linting
bun run lint      # Must pass with 0 errors

# Build
bun run build     # Must complete successfully
```

---

**Generated**: 2025-10-24T02:42:10.613Z
**Source**: Phase planning document for PHASE-6