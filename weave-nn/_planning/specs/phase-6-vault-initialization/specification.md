---
spec_type: "specification"
phase_id: "PHASE-6"
phase_name: "Vault Initialization System"
status: "requirements_elaborated"
priority: "high"
duration: "15-20 days"
generated_date: "2025-10-24"
elaborated_date: "2025-10-24"
task_count: 63
tags:
  - spec-kit
  - specification
  - phase-6
  - elaborated
links:
  phase_document: "[[phase planning document]]"
  constitution: "[[constitution.md]]"
---

# Vault Initialization System - Specification

**Phase ID**: PHASE-6
**Status**: requirements_elaborated
**Last Updated**: 2025-10-24

---

## Executive Summary

The Vault Initialization System automates the creation of knowledge graph vaults from existing codebases. It analyzes application code, extracts components and documentation, and generates an interconnected Obsidian-compatible vault with minimal manual effort.

### Key Capabilities
- **Framework Detection**: Automatically identifies Next.js, React, Express, Django, FastAPI, Flask projects
- **Multi-Language Support**: TypeScript, JavaScript, Python code analysis using AST parsing
- **Template System**: 5 pre-configured templates (Minimal, Standard, Comprehensive, API-First, AI-Optimized)
- **AI-Powered Content**: Claude-Flow MCP integration for rich documentation (with offline fallback)
- **Graph Structure**: Automatic wikilink generation, Mermaid diagrams, YAML frontmatter
- **CLI-Driven**: Interactive prompts, progress reporting, dry-run mode, rollback capability

### Success Metrics
- Initialize medium-sized project (<500 files) in under 60 seconds
- Generate 20-30 interconnected nodes for standard template
- >80% test coverage with E2E validation for all templates
- Zero breaking changes to existing Weaver components

## Overview

This specification details the implementation of the Vault Initialization System, a core feature of the Weave-NN project. The system bridges the gap between application codebases and knowledge graphs by automatically extracting, analyzing, and organizing code into an Obsidian-compatible vault structure.

### Problem Statement
Creating knowledge graph vaults manually is time-consuming and error-prone. Developers must:
1. Analyze codebase structure and dependencies
2. Extract components, features, and technical concepts
3. Create markdown files with proper frontmatter and wikilinks
4. Generate architecture diagrams and documentation
5. Maintain consistency across vault taxonomy

Manual vault creation can take 2-8 hours for medium-sized projects and lacks consistency.

### Solution
The Vault Initialization System automates this entire workflow:
1. **Scan**: Analyze codebase using AST parsing and configuration file extraction
2. **Extract**: Identify components, modules, dependencies, API routes, documentation
3. **Transform**: Map application structure to vault taxonomy using templates
4. **Enhance**: Use Claude-Flow MCP to generate rich, contextual descriptions
5. **Generate**: Write markdown files with wikilinks, frontmatter, and Mermaid diagrams
6. **Initialize**: Populate shadow cache, initialize Git, create concept map

Reduces setup time from hours to minutes (<5 minutes typical).

## Requirements

### Functional Requirements

#### FR-1: Application Analysis & Scanning
- **FR-1.1**: Detect framework type automatically (Next.js, React, Express, Django, FastAPI, Flask)
- **FR-1.2**: Scan directory tree with configurable ignore patterns (.git, node_modules, .env, etc.)
- **FR-1.3**: Extract components, modules, and functions from source code using AST parsing
- **FR-1.4**: Parse configuration files (package.json, requirements.txt, tsconfig.json, etc.)
- **FR-1.5**: Extract dependencies and their relationships
- **FR-1.6**: Identify routing structure and API endpoints
- **FR-1.7**: Support multiple programming languages (TypeScript, JavaScript, Python)

#### FR-2: Template System
- **FR-2.1**: Load template configurations from YAML schema
- **FR-2.2**: Support 5 template types:
  - **Minimal**: Basic vault structure (README, concept-map, 5-10 nodes)
  - **Standard**: Full vault with organized directories (20-30 nodes)
  - **Comprehensive**: Deep analysis with advanced features (50+ nodes)
  - **API-First**: Focus on API documentation and endpoints
  - **AI-Optimized**: Enhanced for Claude-Flow integration with embeddings
- **FR-2.3**: Use Handlebars for template rendering
- **FR-2.4**: Validate template schema before generation
- **FR-2.5**: Support custom template extensions

#### FR-3: Documentation Extraction
- **FR-3.1**: Parse README.md files (extract sections, features, technologies)
- **FR-3.2**: Extract JSDoc comments from TypeScript/JavaScript files
- **FR-3.3**: Extract Python docstrings from Python modules
- **FR-3.4**: Extract OpenAPI/Swagger specifications (if present)
- **FR-3.5**: Use Claude-Flow MCP tools to extract high-level concepts
- **FR-3.6**: Generate concept descriptions from inline comments
- **FR-3.7**: Identify technical patterns and architectural decisions

#### FR-4: Vault Structure Generation
- **FR-4.1**: Map application structure to vault taxonomy automatically
- **FR-4.2**: Generate nodes for each type:
  - Concepts (business logic, domain models)
  - Technical components (frameworks, libraries, tools)
  - Features (user-facing functionality)
  - Architecture diagrams (system design)
  - Research notes (best practices, decisions)
- **FR-4.3**: Build wikilink relationships between related nodes
- **FR-4.4**: Generate Mermaid architecture diagrams automatically
- **FR-4.5**: Create YAML frontmatter with metadata (tags, links, dates)
- **FR-4.6**: Organize files in appropriate subdirectories

#### FR-5: AI-Powered Content Generation
- **FR-5.1**: Integrate Claude-Flow MCP tools for content enhancement
- **FR-5.2**: Use specialized prompts for each document type
- **FR-5.3**: Generate detailed descriptions from extracted data
- **FR-5.4**: Implement content caching to avoid duplicate API calls
- **FR-5.5**: Support offline mode (use extracted data only, no AI enhancement)
- **FR-5.6**: Rate limit API calls appropriately
- **FR-5.7**: Handle API errors gracefully with fallback strategies

#### FR-6: Vault Initialization
- **FR-6.1**: Write markdown files to disk in organized structure
- **FR-6.2**: Populate shadow cache for fast access
- **FR-6.3**: Initialize Git repository with appropriate .gitignore
- **FR-6.4**: Generate vault README.md with overview and navigation
- **FR-6.5**: Generate concept-map.md with Mermaid diagram of relationships
- **FR-6.6**: Create .obsidian directory with workspace configuration (optional)
- **FR-6.7**: Support dry-run mode (preview without writing files)

#### FR-7: Memory & Knowledge Graph Integration
- **FR-7.1**: Store project overview in Claude-Flow memory (namespace: `project:app-name`)
- **FR-7.2**: Store technical stack information
- **FR-7.3**: Generate embeddings for all nodes using OpenAI text-embedding-ada-002
- **FR-7.4**: Store embeddings in Claude-Flow for semantic search
- **FR-7.5**: Enable neural pattern matching for related concepts
- **FR-7.6**: Support memory synchronization across sessions

#### FR-8: Command-Line Interface
- **FR-8.1**: Implement CLI with Commander.js
- **FR-8.2**: Interactive prompts for configuration (Inquirer.js)
- **FR-8.3**: Progress reporting with spinners and progress bars
- **FR-8.4**: Colorful, user-friendly output (Chalk)
- **FR-8.5**: Support command-line flags and options
- **FR-8.6**: Implement dry-run mode flag (`--dry-run`)
- **FR-8.7**: Error handling with actionable error messages
- **FR-8.8**: Rollback capability if generation fails

#### FR-9: Workflow Integration
- **FR-9.1**: Create vault-initialization workflow in existing workflow engine
- **FR-9.2**: Integrate with n8n-client for workflow orchestration
- **FR-9.3**: Add execution tracking and status reporting
- **FR-9.4**: Create MCP tool: `trigger_vault_initialization`
- **FR-9.5**: Support webhook triggers for automated initialization

### Non-Functional Requirements

#### NFR-1: Performance
- **NFR-1.1**: Initialize vault for medium-sized project (<500 files) in under 60 seconds
- **NFR-1.2**: Process large repositories (>1000 files) in under 5 minutes
- **NFR-1.3**: Minimize API calls to Claude-Flow (use caching aggressively)
- **NFR-1.4**: Support incremental generation (update existing vault)

#### NFR-2: Reliability
- **NFR-2.1**: Handle malformed source code gracefully
- **NFR-2.2**: Recover from network errors automatically
- **NFR-2.3**: Validate all generated markdown files
- **NFR-2.4**: Atomic operations (all or nothing for file writes)
- **NFR-2.5**: Comprehensive error logging

#### NFR-3: Maintainability
- **NFR-3.1**: TypeScript strict mode with 100% type coverage
- **NFR-3.2**: Modular architecture with clear separation of concerns
- **NFR-3.3**: Comprehensive inline documentation (JSDoc)
- **NFR-3.4**: Unit test coverage >80%
- **NFR-3.5**: E2E test coverage for all templates
- **NFR-3.6**: Pass typecheck and lint with 0 errors

#### NFR-4: Usability
- **NFR-4.1**: Clear, actionable error messages
- **NFR-4.2**: Helpful CLI help text and examples
- **NFR-4.3**: Sensible default configurations
- **NFR-4.4**: Easy template customization
- **NFR-4.5**: Comprehensive user documentation

#### NFR-5: Extensibility
- **NFR-5.1**: Plugin architecture for custom analyzers
- **NFR-5.2**: Support for custom template types
- **NFR-5.3**: Configurable taxonomy mappings
- **NFR-5.4**: Extensible prompt library for AI generation

## Initial Task Breakdown

_Note: This is preliminary. Run /speckit.tasks for AI-powered task generation._

### Task 1: Implement framework detection (Next.js, React, Express, Django, FastAPI, Flask)

### Task 2: Build directory tree scanner with ignore patterns

### Task 3: Extract components from TypeScript/JavaScript (using Babel/TS AST)

### Task 4: Extract modules from Python (using AST via subprocess)

### Task 5: Parse package.json, requirements.txt, tsconfig.json, etc.

### Task 6: Write unit tests for scanner

### Task 7: Create template schema (YAML)

### Task 8: Define 5 template configurations

### Task 9: Create Handlebars templates for each document type

### Task 10: Implement template loader and validator

### Task 11: Write template tests

### Task 12: Parse README.md (extract sections, features, technologies)

### Task 13: Extract JSDoc comments from TypeScript/JavaScript

### Task 14: Extract Python docstrings

### Task 15: Extract OpenAPI/Swagger specs (if present)

### Task 16: Use Claude-Flow to extract concepts from documentation

### Task 17: Write integration tests

### Task 18: Implement taxonomy mapper (app structure → vault directories)

### Task 19: Create node generators for each type (concept, technical, feature, etc.)

### Task 20: Build wikilink relationship builder

### Task 21: Generate Mermaid architecture diagrams

### Task 22: Generate frontmatter metadata automatically

### Task 23: Integrate Claude-Flow MCP tools for content generation

### Task 24: Create prompts for each document type

### Task 25: Implement content caching (avoid duplicate API calls)

### Task 26: Add fallback for offline mode (use extracted data only)

### Task 27: Write integration tests with Claude-Flow

### Task 28: Implement markdown file writer

### Task 29: Populate shadow cache with generated files

### Task 30: Initialize Git repository with .gitignore

### Task 31: Generate vault README.md

### Task 32: Generate concept-map.md with Mermaid diagram

### Task 33: Write end-to-end tests

### Task 34: Integrate Claude-Flow MCP tools

### Task 35: Store project overview in memory (namespace: `project:app-name`)

### Task 36: Store technical stack

### Task 37: Generate embeddings for all nodes (OpenAI text-embedding-ada-002)

### Task 38: Store embeddings in Claude-Flow

### Task 39: Enable semantic search via neural patterns

### Task 40: Create CLI command with Commander

### Task 41: Implement interactive prompts

### Task 42: Add progress reporting (spinners + progress bars)

### Task 43: Implement dry-run mode

### Task 44: Add error handling and rollback

### Task 45: Write CLI tests

### Task 46: Create user documentation

### Task 47: Create vault-initialization workflow

### Task 48: Integrate with existing workflow engine

### Task 49: Add execution tracking

### Task 50: Create MCP tool: `trigger_vault_initialization`

### Task 51: Write unit tests (target: 80%+ coverage)

### Task 52: Write E2E tests with real applications

### Task 53: Create test fixtures for all templates

### Task 54: Performance testing (measure initialization time)

### Task 55: Write user guide

### Task 56: Write developer guide

### Task 57: Document all 5 templates

### Task 58: Create API reference

### Task 59: Add inline code documentation (JSDoc)

### Task 60: Generate example vault for each template

### Task 61: Verify all examples are valid

### Task 62: Add example vaults to documentation

### Task 63: Create comparison screenshots

## Acceptance Criteria

### AC-1: Application Analysis
- [ ] Successfully detects all supported framework types (Next.js, React, Express, Django, FastAPI, Flask)
- [ ] Scans directory tree and respects all ignore patterns
- [ ] Extracts components from TypeScript/JavaScript using Babel/TS AST
- [ ] Extracts modules from Python using AST
- [ ] Parses all configuration files correctly
- [ ] Identifies dependencies and their versions
- [ ] Extracts API routes and endpoints

### AC-2: Template System
- [ ] All 5 template configurations load successfully
- [ ] Template schema validation works correctly
- [ ] Handlebars templates render without errors
- [ ] Generated output matches template structure
- [ ] Custom templates can be added via configuration

### AC-3: Documentation Extraction
- [ ] README.md is parsed and sections are identified
- [ ] JSDoc comments are extracted from all TypeScript/JavaScript files
- [ ] Python docstrings are extracted from all modules
- [ ] OpenAPI/Swagger specs are detected and parsed (if present)
- [ ] Claude-Flow integration extracts high-level concepts
- [ ] Fallback works when Claude-Flow is unavailable

### AC-4: Vault Structure Generation
- [ ] Application structure maps to vault taxonomy correctly
- [ ] All node types are generated (concepts, technical, features, architecture, research)
- [ ] Wikilinks are created between related nodes
- [ ] Mermaid diagrams are syntactically correct
- [ ] YAML frontmatter is valid and complete
- [ ] Files are organized in correct subdirectories

### AC-5: AI-Powered Content
- [ ] Claude-Flow MCP tools integrate successfully
- [ ] Content caching prevents duplicate API calls
- [ ] Offline mode works without API access
- [ ] Rate limiting prevents API throttling
- [ ] Error handling provides graceful degradation
- [ ] Generated content is coherent and relevant

### AC-6: Vault Initialization
- [ ] Markdown files are written to disk in correct structure
- [ ] Shadow cache is populated correctly
- [ ] Git repository is initialized with appropriate .gitignore
- [ ] Vault README.md provides clear overview
- [ ] concept-map.md includes valid Mermaid diagram
- [ ] Dry-run mode previews without writing files
- [ ] Rollback works if generation fails

### AC-7: Memory & Knowledge Graph
- [ ] Project overview stored in Claude-Flow memory
- [ ] Technical stack information is accessible
- [ ] Embeddings are generated for all nodes
- [ ] Semantic search returns relevant results
- [ ] Neural patterns match related concepts
- [ ] Memory persists across sessions

### AC-8: Command-Line Interface
- [ ] CLI accepts all documented flags and options
- [ ] Interactive prompts guide user through configuration
- [ ] Progress reporting shows accurate status
- [ ] Error messages are clear and actionable
- [ ] Dry-run mode flag works correctly
- [ ] Rollback is triggered on critical errors
- [ ] Help text is comprehensive

### AC-9: Workflow Integration
- [ ] Vault-initialization workflow executes successfully
- [ ] n8n integration works end-to-end
- [ ] Execution tracking reports accurate status
- [ ] MCP tool `trigger_vault_initialization` is accessible
- [ ] Webhook triggers work automatically

### AC-10: Testing & Quality
- [ ] All unit tests pass (>80% coverage)
- [ ] All E2E tests pass with real applications
- [ ] Test fixtures cover all templates
- [ ] Performance benchmarks meet requirements (<60s for medium projects)
- [ ] TypeScript strict mode with 0 errors
- [ ] Linting passes with 0 errors
- [ ] Build completes successfully

### AC-11: Documentation
- [ ] User guide is complete and accurate
- [ ] Developer guide covers architecture and extension points
- [ ] All 5 templates are documented with examples
- [ ] API reference is comprehensive
- [ ] Inline JSDoc covers all public APIs
- [ ] Example vaults are generated and validated
- [ ] Comparison screenshots are included

## Out of Scope

Items explicitly excluded from this phase:

### Technical Exclusions
- **Real-time collaboration features**: Multi-user editing, live sync (Future: Phase 8+)
- **Web-based UI**: Browser interface for vault management (Future: Phase 9+)
- **Mobile applications**: iOS/Android vault viewers (Out of scope indefinitely)
- **Version control integration beyond Git init**: Git workflows, branch management, merge strategies
- **Automated testing of generated vault content**: Only structural validation, not content quality checks
- **Custom plugin marketplace**: Plugin discovery and distribution system (Future: Phase 10+)

### Framework/Language Exclusions
- **Java/Kotlin support**: Not in MVP scope (Future: Phase 8+)
- **Ruby/Rails support**: Not in MVP scope (Future: Phase 8+)
- **Go support**: Not in MVP scope (Future: Phase 8+)
- **PHP/Laravel support**: Not in MVP scope (Future: Phase 8+)
- **Rust support**: Not in MVP scope (Future: Phase 9+)
- **C#/.NET support**: Not in MVP scope (Future: Phase 9+)

### AI/ML Exclusions
- **Custom embedding models**: Only OpenAI text-embedding-ada-002 in MVP
- **Local LLM support**: Only cloud-based Claude-Flow in MVP (Future: Phase 9+)
- **Fine-tuned models for domain-specific generation**: Generic prompts only in MVP
- **Automated code generation from vault**: One-way (code → vault) only in MVP
- **Intelligent refactoring suggestions**: Analysis only, no automated refactoring

### Integration Exclusions
- **Slack/Discord notifications**: Not in MVP scope (Future: Phase 8+)
- **Jira/Linear integration**: Not in MVP scope (Future: Phase 8+)
- **CI/CD pipeline integration**: Manual triggers only in MVP
- **Terraform/infrastructure as code analysis**: Not in MVP scope
- **Database schema visualization**: Not in MVP scope (Future: Phase 7+)

### Performance/Scale Exclusions
- **Distributed processing for massive repositories (>10k files)**: Single-threaded in MVP
- **Incremental updates**: Full regeneration only in MVP (Future: Phase 7+)
- **Multi-project workspace support**: Single project only in MVP
- **Cloud storage integration (S3, GCS)**: Local filesystem only in MVP

### User Experience Exclusions
- **GUI desktop application**: CLI only in MVP
- **Interactive vault editing**: Generation only, no editing features in MVP
- **Automated vault maintenance**: Manual regeneration only in MVP
- **Export to other formats (PDF, Word, Confluence)**: Markdown only in MVP
- **Import from other documentation systems**: Code analysis only in MVP

### Security Exclusions
- **Role-based access control**: Not applicable in MVP (single user)
- **Encryption at rest**: Not in MVP scope
- **Audit logging for compliance**: Basic logging only in MVP
- **SAML/OAuth integration**: Not applicable in MVP

### Backward Compatibility
- **Migration from legacy vault formats**: Not in MVP scope
- **Support for Obsidian plugins**: Basic Obsidian compatibility only, no plugin guarantees

## Next Steps

1. Review and refine with `/speckit.constitution`
2. Elaborate requirements with `/speckit.specify`
3. Generate implementation plan with `/speckit.plan`
4. Break down tasks with `/speckit.tasks`
5. Begin implementation with `/speckit.implement`

---

**Generated**: 2025-10-24T05:06:36.053Z
**Source**: Phase planning document for PHASE-6