---
spec_type: implementation-plan
phase_id: PHASE-6
phase_name: Vault Initialization System
status: pending
priority: high
duration: 15-20 days
generated_date: '2025-10-24'
tags:
  - spec-kit
  - implementation-plan
  - phase-6
  - vault-initialization
links:
  specification: '[[specification.md]]'
  constitution: '[[constitution.md]]'
  phase_document: '[[../../phases/phase-6-vault-initialization.md]]'
type: planning
visual:
  icon: "\U0001F4CB"
  color: '#3B82F6'
  cssclasses:
    - type-planning
    - status-pending
    - priority-high
    - phase-6
version: '3.0'
updated_date: '2025-10-28'
---

# Vault Initialization System - Implementation Plan

**Phase ID**: PHASE-6
**Status**: Pending
**Priority**: High
**Duration**: 15-20 days (4 weeks)

---

## Executive Summary

This plan details the technical implementation of a comprehensive vault initialization system that bootstraps a new Weave-NN knowledge graph from existing application codebases. The system will scan code, extract documentation, generate knowledge graphs, and leverage Claude-Flow for AI-powered content generation.

**Key Capabilities**:
- Auto-detect frameworks (Next.js, React, Python, etc.)
- Generate structured vault with wikilinks
- AI-powered content generation via Claude-Flow
- Interactive CLI with progress reporting
- Support for 5+ application templates

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLI Entry Point                           │
│              (weaver init <app-path>)                        │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                  VaultInitializer                            │
│           (Orchestrates entire workflow)                     │
└─┬──────────┬──────────┬──────────┬──────────┬──────────┬───┘
  ↓          ↓          ↓          ↓          ↓          ↓
┌───────┐ ┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Code  │ │ Doc  │ │ Graph  │ │   AI   │ │ Vault  │ │Memory  │
│Scanner│ │Extrac│ │Generat │ │Content │ │Finaliz │ │Bootstr │
│       │ │tor   │ │or      │ │Generat │ │er      │ │apper   │
└───────┘ └──────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

---

## Week 1: Foundation (Days 1-5)

### Day 1-2: Code Scanner Module

**File**: `/weaver/src/vault-init/code-scanner.ts`

#### Implementation Details

```typescript
// Core interfaces
interface CodeScanResult {
  framework: FrameworkType;
  language: ProgrammingLanguage;
  rootPath: string;
  structure: DirectoryTree;
  dependencies: Dependency[];
  components: Component[];
  entryPoints: string[];
  configFiles: ConfigFile[];
  metadata: ScanMetadata;
}

enum FrameworkType {
  NEXTJS = 'nextjs',
  REACT = 'react',
  EXPRESS = 'express',
  FASTAPI = 'fastapi',
  DJANGO = 'django',
  FLASK = 'flask',
  GENERIC = 'generic',
}

class CodeScanner {
  /**
   * Detect framework by examining package.json, requirements.txt, etc.
   */
  async detectFramework(rootPath: string): Promise<FrameworkType> {
    // 1. Check for package.json (Node.js projects)
    const pkgPath = join(rootPath, 'package.json');
    if (await exists(pkgPath)) {
      const pkg = await readJSON(pkgPath);
      if (pkg.dependencies?.next || pkg.devDependencies?.next) return FrameworkType.NEXTJS;
      if (pkg.dependencies?.react) return FrameworkType.REACT;
      if (pkg.dependencies?.express) return FrameworkType.EXPRESS;
    }

    // 2. Check for Python projects
    const reqPath = join(rootPath, 'requirements.txt');
    if (await exists(reqPath)) {
      const content = await readFile(reqPath, 'utf-8');
      if (content.includes('fastapi')) return FrameworkType.FASTAPI;
      if (content.includes('django')) return FrameworkType.DJANGO;
      if (content.includes('flask')) return FrameworkType.FLASK;
    }

    return FrameworkType.GENERIC;
  }

  /**
   * Scan directory structure with configurable depth and ignore patterns
   */
  async scanStructure(rootPath: string, options: ScanOptions = {}): Promise<DirectoryTree> {
    const { maxDepth = 3, ignorePatterns = DEFAULT_IGNORE_PATTERNS } = options;

    // Use fast-glob for efficient scanning
    const files = await glob('**/*', {
      cwd: rootPath,
      ignore: ignorePatterns,
      deep: maxDepth,
      onlyFiles: false,
    });

    return this.buildTree(files, rootPath);
  }

  /**
   * Extract components from TypeScript/JavaScript using Babel AST
   */
  async extractComponents(rootPath: string): Promise<Component[]> {
    const files = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: rootPath,
      ignore: ['node_modules/**', 'dist/**', 'build/**'],
    });

    const components: Component[] = [];

    for (const file of files) {
      const code = await readFile(join(rootPath, file), 'utf-8');
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });

      traverse(ast, {
        // Extract React components
        FunctionDeclaration(path) {
          if (this.isReactComponent(path)) {
            components.push(this.extractComponentInfo(path, file));
          }
        },
        // Extract class components
        ClassDeclaration(path) {
          if (this.isReactComponent(path)) {
            components.push(this.extractComponentInfo(path, file));
          }
        },
      });
    }

    return components;
  }

  /**
   * Parse dependencies from package.json, requirements.txt, etc.
   */
  async parseDependencies(rootPath: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];

    // Node.js dependencies
    const pkgPath = join(rootPath, 'package.json');
    if (await exists(pkgPath)) {
      const pkg = await readJSON(pkgPath);
      for (const [name, version] of Object.entries(pkg.dependencies || {})) {
        dependencies.push({
          name,
          version: version as string,
          type: 'runtime',
          ecosystem: 'npm',
        });
      }
      for (const [name, version] of Object.entries(pkg.devDependencies || {})) {
        dependencies.push({
          name,
          version: version as string,
          type: 'development',
          ecosystem: 'npm',
        });
      }
    }

    // Python dependencies
    const reqPath = join(rootPath, 'requirements.txt');
    if (await exists(reqPath)) {
      const content = await readFile(reqPath, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
      for (const line of lines) {
        const [name, version] = line.split('==');
        dependencies.push({
          name: name.trim(),
          version: version?.trim() || 'latest',
          type: 'runtime',
          ecosystem: 'pypi',
        });
      }
    }

    return dependencies;
  }
}
```

**Dependencies to Install**:
```bash
bun add @babel/parser @babel/traverse acorn acorn-walk fast-glob gray-matter js-yaml
```

**Test File**: `/weaver/tests/vault-init/code-scanner.test.ts`

```typescript
describe('CodeScanner', () => {
  it('should detect Next.js framework', async () => {
    // Test with fixture
  });

  it('should scan directory structure with depth limit', async () => {
    // Test scanning
  });

  it('should extract React components from TypeScript', async () => {
    // Test component extraction
  });

  it('should parse package.json dependencies', async () => {
    // Test dependency parsing
  });
});
```

**Success Criteria**:
- [ ] Detects 6+ framework types with 95%+ accuracy
- [ ] Scans directory tree with configurable depth
- [ ] Extracts components from TypeScript/JavaScript/Python
- [ ] Parses dependencies from multiple file formats
- [ ] Unit tests passing (80%+ coverage)

---

### Day 3-4: Template System

**Directory**: `/weaver/templates/`

#### Template Structure

Each template consists of:
1. **Configuration** (`<template-name>.yaml`) - Template metadata and settings
2. **Handlebars Templates** (`<template-name>/`) - Document templates

**Example Template Config**: `typescript-app.yaml`

```yaml
name: typescript-app
displayName: "TypeScript Application"
description: "Standard TypeScript application (Node.js)"
version: "1.0.0"

# Framework detection rules
detection:
  required_files:
    - "package.json"
    - "tsconfig.json"
  optional_files:
    - "src/index.ts"
  dependencies:
    any_of: ["typescript", "@types/node"]

# Code scanning configuration
scanning:
  extensions: [".ts", ".tsx", ".js", ".jsx"]
  exclude_patterns:
    - "node_modules/**"
    - "dist/**"
    - "build/**"
    - "coverage/**"
  depth: 3
  max_files: 1000

# Vault directory structure
vault_structure:
  directories:
    - name: "concepts"
      description: "Core concepts and patterns"
    - name: "technical"
      description: "Technical dependencies and tools"
    - name: "features"
      description: "Application features"
    - name: "architecture"
      description: "System architecture documentation"
    - name: "components"
      description: "Reusable components"
    - name: "_planning"
      description: "Planning and tasks"

  # Document templates to generate
  templates:
    - type: "readme"
      path: "README.md"
      template: "readme.md.hbs"
      priority: 1

    - type: "concept-map"
      path: "concept-map.md"
      template: "concept-map.md.hbs"
      priority: 1

    - type: "architecture-overview"
      path: "architecture/system-overview.md"
      template: "architecture/overview.md.hbs"
      priority: 2

    - type: "technical-stack"
      path: "architecture/technical-stack.md"
      template: "architecture/stack.md.hbs"
      priority: 2

# Knowledge graph generation rules
graph:
  # Node generation from scanned data
  nodes:
    - type: "technical"
      from: "dependencies"
      template: "technical-node.md.hbs"
      path_pattern: "technical/{name}.md"

    - type: "concept"
      from: "extracted_concepts"
      template: "concept-node.md.hbs"
      path_pattern: "concepts/{name}.md"

    - type: "component"
      from: "components"
      template: "component-node.md.hbs"
      path_pattern: "components/{name}.md"

  # Relationship/link generation
  edges:
    - type: "imports"
      from: "ast_imports"
      creates_wikilink: true

    - type: "uses_dependency"
      from: "package_imports"
      creates_wikilink: true

# AI content generation settings
ai_generation:
  enabled: true
  prompts:
    concept_description: "Generate a concise description for the concept '{conceptName}' in the context of {projectType}."
    technical_docs: "Explain how {dependencyName} is used in this {projectType} application."
```

**Handlebars Template Example**: `templates/typescript-app/readme.md.hbs`

```handlebars
---
type: vault-readme
project: {{projectName}}
framework: {{framework}}
generated_date: {{generatedDate}}
tags:
  - vault
  - {{framework}}
{{#if tags}}
  {{#each tags}}
  - {{this}}
  {{/each}}
{{/if}}
---

# {{projectName}} Knowledge Graph

> Generated vault for {{framework}} application

## Overview

{{#if description}}
{{description}}
{{else}}
This vault contains the knowledge graph for the {{projectName}} application.
{{/if}}

## Structure

{{#each directories}}
- **{{name}}/** - {{description}}
{{/each}}

## Quick Navigation

- [[concept-map|Concept Map]] - Visual overview of all concepts
- [[architecture/system-overview|Architecture Overview]]
- [[architecture/technical-stack|Technical Stack]]

## Statistics

- **Framework**: {{framework}}
- **Language**: {{language}}
- **Total Nodes**: {{totalNodes}}
- **Dependencies**: {{dependencyCount}}
- **Components**: {{componentCount}}

## Getting Started

1. Review the [[concept-map|Concept Map]] to understand the project structure
2. Explore [[architecture/system-overview|System Architecture]]
3. Browse [[technical/|Technical Documentation]] for dependency details
4. Check [[features/|Features]] for functionality overview

---

*Generated by Weave-NN Vault Initializer on {{generatedDate}}*
```

**Template Loader**: `/weaver/src/vault-init/template-loader.ts`

```typescript
class TemplateLoader {
  private templates: Map<string, VaultTemplate> = new Map();
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Load all templates from the templates directory
   */
  async loadTemplates(templatesDir: string): Promise<void> {
    const configFiles = await glob('*.yaml', { cwd: templatesDir });

    for (const file of configFiles) {
      const config = await this.loadTemplateConfig(join(templatesDir, file));
      await this.validateTemplate(config);
      this.templates.set(config.name, config);
    }
  }

  /**
   * Get template by name or auto-detect from scan result
   */
  async getTemplate(nameOrScanResult: string | CodeScanResult): Promise<VaultTemplate> {
    if (typeof nameOrScanResult === 'string') {
      return this.templates.get(nameOrScanResult) || this.templates.get('generic')!;
    }

    // Auto-detect template from scan result
    return this.detectTemplate(nameOrScanResult);
  }

  /**
   * Render a template with variables
   */
  async render(templatePath: string, variables: Record<string, any>): Promise<string> {
    const source = await readFile(templatePath, 'utf-8');
    const template = this.handlebars.compile(source);
    return template(variables);
  }

  private registerHelpers(): void {
    // Custom Handlebars helpers
    this.handlebars.registerHelper('wikilink', (text: string) => {
      return `[[${text}]]`;
    });

    this.handlebars.registerHelper('slug', (text: string) => {
      return text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    });
  }
}
```

**Success Criteria**:
- [ ] 5 templates created (typescript-app, nextjs-app, python-app, monorepo, generic)
- [ ] Template loader validates and loads all templates
- [ ] Handlebars rendering working with custom helpers
- [ ] Auto-detection selects correct template
- [ ] Unit tests passing

---

### Day 5: Documentation Extractor

**File**: `/weaver/src/vault-init/doc-extractor.ts`

```typescript
interface DocumentationExtraction {
  readme: READMEContent | null;
  codeComments: CodeComment[];
  apiDocs: APIDocumentation[];
  concepts: ExtractedConcept[];
}

class DocumentationExtractor {
  /**
   * Parse README.md and extract structured content
   */
  async parseReadme(rootPath: string): Promise<READMEContent | null> {
    const readmePath = join(rootPath, 'README.md');
    if (!await exists(readmePath)) return null;

    const content = await readFile(readmePath, 'utf-8');
    const { data: frontmatter, content: markdown } = matter(content);

    // Parse markdown into sections
    const sections = this.parseMarkdownSections(markdown);

    return {
      frontmatter,
      sections,
      features: this.extractFeatures(sections),
      technologies: this.extractTechnologies(sections),
      installation: this.extractInstallation(sections),
    };
  }

  /**
   * Extract JSDoc comments from TypeScript/JavaScript
   */
  async extractCodeComments(filePath: string): Promise<CodeComment[]> {
    const code = await readFile(filePath, 'utf-8');
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    const comments: CodeComment[] = [];

    traverse(ast, {
      enter(path) {
        if (path.node.leadingComments) {
          for (const comment of path.node.leadingComments) {
            if (comment.type === 'CommentBlock' && comment.value.startsWith('*')) {
              // JSDoc comment
              comments.push({
                type: 'jsdoc',
                content: comment.value,
                location: {
                  file: filePath,
                  line: comment.loc?.start.line || 0,
                },
                parsed: this.parseJSDoc(comment.value),
              });
            }
          }
        }
      },
    });

    return comments;
  }

  /**
   * Extract Python docstrings using AST parsing
   */
  async extractPythonDocstrings(rootPath: string): Promise<CodeComment[]> {
    const files = await glob('**/*.py', {
      cwd: rootPath,
      ignore: ['venv/**', '__pycache__/**', '.venv/**'],
    });

    const comments: CodeComment[] = [];

    for (const file of files) {
      const filePath = join(rootPath, file);
      // Use Python subprocess to parse AST and extract docstrings
      const result = await this.runPythonDocstringExtractor(filePath);
      comments.push(...result);
    }

    return comments;
  }

  /**
   * Extract OpenAPI/Swagger specifications
   */
  async extractAPIDocs(rootPath: string): Promise<APIDocumentation[]> {
    const specs: APIDocumentation[] = [];

    // Look for OpenAPI/Swagger files
    const specFiles = await glob('**/{openapi,swagger}.{json,yaml,yml}', {
      cwd: rootPath,
    });

    for (const file of specFiles) {
      const content = await readFile(join(rootPath, file), 'utf-8');
      const spec = file.endsWith('.json') ? JSON.parse(content) : yaml.load(content);

      specs.push({
        type: 'openapi',
        version: spec.openapi || spec.swagger,
        spec,
        endpoints: this.extractEndpoints(spec),
      });
    }

    return specs;
  }

  /**
   * Use Claude-Flow to extract concepts from documentation
   */
  async extractConcepts(content: string, context: ExtractionContext): Promise<ExtractedConcept[]> {
    // This will be integrated with Claude-Flow MCP tools
    // For now, use simple keyword extraction
    const keywords = this.extractKeywords(content);

    return keywords.map(keyword => ({
      name: keyword,
      description: '', // Will be filled by AI in next phase
      source: 'keyword-extraction',
      confidence: 0.7,
    }));
  }
}
```

**Success Criteria**:
- [ ] README parsing extracts sections, features, technologies
- [ ] JSDoc comment extraction working
- [ ] Python docstring extraction working
- [ ] OpenAPI/Swagger parsing functional
- [ ] Basic concept extraction implemented
- [ ] Integration tests passing

---

## Week 2: Knowledge Graph (Days 6-10)

### Day 6-7: Knowledge Graph Generator

**File**: `/weaver/src/vault-init/graph-generator.ts`

```typescript
interface VaultStructure {
  rootPath: string;
  template: VaultTemplate;
  directories: VaultDirectory[];
  nodes: GeneratedNode[];
  relationships: NodeRelationship[];
  metadata: VaultMetadata;
}

interface GeneratedNode {
  id: string;
  type: NodeType; // 'concept' | 'technical' | 'feature' | 'component' | 'architecture'
  path: string; // Relative path in vault (e.g., "concepts/react-hooks.md")
  template: string; // Handlebars template to use
  frontmatter: Record<string, any>;
  content: string;
  links: WikiLink[]; // Links to other nodes
  tags: string[];
  metadata: NodeMetadata;
}

class KnowledgeGraphGenerator {
  /**
   * Map application structure to vault structure using template
   */
  async mapApplicationToVault(
    scan: CodeScanResult,
    docs: DocumentationExtraction,
    template: VaultTemplate
  ): Promise<VaultStructure> {
    const vault: VaultStructure = {
      rootPath: scan.rootPath,
      template,
      directories: this.createDirectories(template),
      nodes: [],
      relationships: [],
      metadata: this.createMetadata(scan, docs),
    };

    // Generate nodes for each type
    vault.nodes.push(...await this.createTechnicalNodes(scan.dependencies, template));
    vault.nodes.push(...await this.createConceptNodes(docs.concepts, template));
    vault.nodes.push(...await this.createComponentNodes(scan.components, template));
    vault.nodes.push(...await this.createFeatureNodes(docs.readme?.features || [], template));
    vault.nodes.push(...await this.createArchitectureNodes(scan, template));

    // Build relationships between nodes
    vault.relationships = this.buildRelationships(vault.nodes, scan);

    return vault;
  }

  /**
   * Create technical dependency nodes
   */
  private async createTechnicalNodes(
    dependencies: Dependency[],
    template: VaultTemplate
  ): Promise<GeneratedNode[]> {
    const nodes: GeneratedNode[] = [];

    for (const dep of dependencies) {
      const node: GeneratedNode = {
        id: `technical-${dep.name}`,
        type: 'technical',
        path: `technical/${this.slugify(dep.name)}.md`,
        template: 'technical-node.md.hbs',
        frontmatter: {
          type: 'technical',
          name: dep.name,
          version: dep.version,
          ecosystem: dep.ecosystem,
          dependency_type: dep.type,
          tags: ['technical', dep.ecosystem, dep.type],
        },
        content: '', // Will be filled by AI generator
        links: [],
        tags: ['technical', dep.ecosystem],
        metadata: {
          source: 'dependency-scan',
          generatedAt: new Date().toISOString(),
        },
      };

      nodes.push(node);
    }

    return nodes;
  }

  /**
   * Create concept nodes from extracted concepts
   */
  private async createConceptNodes(
    concepts: ExtractedConcept[],
    template: VaultTemplate
  ): Promise<GeneratedNode[]> {
    return concepts.map(concept => ({
      id: `concept-${concept.name}`,
      type: 'concept',
      path: `concepts/${this.slugify(concept.name)}.md`,
      template: 'concept-node.md.hbs',
      frontmatter: {
        type: 'concept',
        name: concept.name,
        confidence: concept.confidence,
        tags: ['concept'],
      },
      content: concept.description,
      links: [],
      tags: ['concept'],
      metadata: {
        source: concept.source,
        generatedAt: new Date().toISOString(),
      },
    }));
  }

  /**
   * Build relationships and wikilinks between nodes
   */
  private buildRelationships(nodes: GeneratedNode[], scan: CodeScanResult): NodeRelationship[] {
    const relationships: NodeRelationship[] = [];

    // Component → Dependency relationships
    for (const component of scan.components) {
      const componentNode = nodes.find(n => n.id === `component-${component.name}`);
      if (!componentNode) continue;

      for (const importPath of component.imports) {
        // Find matching dependency node
        const depName = this.extractDependencyName(importPath);
        const depNode = nodes.find(n => n.id === `technical-${depName}`);

        if (depNode) {
          relationships.push({
            from: componentNode.id,
            to: depNode.id,
            type: 'uses',
          });

          // Add wikilink
          componentNode.links.push({
            target: depNode.path,
            type: 'uses',
          });
        }
      }
    }

    // TODO: Add more relationship types

    return relationships;
  }

  /**
   * Generate Mermaid architecture diagram
   */
  generateArchitectureDiagram(vault: VaultStructure): string {
    const mermaid = ['```mermaid', 'graph TD'];

    // Add nodes
    for (const node of vault.nodes) {
      mermaid.push(`  ${node.id}["${node.frontmatter.name}"]`);
    }

    // Add relationships
    for (const rel of vault.relationships) {
      mermaid.push(`  ${rel.from} -->|${rel.type}| ${rel.to}`);
    }

    mermaid.push('```');
    return mermaid.join('\n');
  }
}
```

**Success Criteria**:
- [ ] Vault structure generation working
- [ ] All node types supported (technical, concept, feature, component, architecture)
- [ ] Wikilinks created automatically based on relationships
- [ ] Frontmatter valid and complete
- [ ] Mermaid diagrams generated
- [ ] Integration tests passing

---

### Day 8-9: AI Content Generation

**File**: `/weaver/src/vault-init/ai-generator.ts`

```typescript
class AIContentGenerator {
  private claudeFlowAvailable: boolean;
  private cache: Map<string, string> = new Map();

  constructor(private options: AIGeneratorOptions) {
    this.claudeFlowAvailable = this.checkClaudeFlowAvailability();
  }

  /**
   * Generate concept description using Claude-Flow or fallback
   */
  async generateConceptDescription(
    conceptName: string,
    context: GenerationContext
  ): Promise<string> {
    const cacheKey = `concept:${conceptName}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let content: string;

    if (this.claudeFlowAvailable && !this.options.offlineMode) {
      // Use Claude-Flow MCP tool
      content = await this.generateWithClaudeFlow('concept_description', {
        conceptName,
        projectType: context.framework,
        projectDescription: context.description,
      });
    } else {
      // Fallback: Use extracted data only
      content = this.generateFallbackDescription(conceptName, context);
    }

    this.cache.set(cacheKey, content);
    return content;
  }

  /**
   * Generate technical documentation for a dependency
   */
  async generateTechnicalDocs(dep: Dependency, context: GenerationContext): Promise<string> {
    const cacheKey = `technical:${dep.name}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let content: string;

    if (this.claudeFlowAvailable && !this.options.offlineMode) {
      content = await this.generateWithClaudeFlow('technical_docs', {
        dependencyName: dep.name,
        version: dep.version,
        projectType: context.framework,
        usage: this.inferUsage(dep, context),
      });
    } else {
      content = this.generateFallbackTechnicalDocs(dep, context);
    }

    this.cache.set(cacheKey, content);
    return content;
  }

  /**
   * Call Claude-Flow MCP tool for content generation
   */
  private async generateWithClaudeFlow(
    promptType: string,
    variables: Record<string, any>
  ): Promise<string> {
    // This will be implemented to call Claude-Flow MCP tools
    // For now, return placeholder
    const prompt = this.buildPrompt(promptType, variables);

    // TODO: Integrate with Claude-Flow MCP
    // const response = await mcp.call('claude-flow', 'generate_content', { prompt });

    return `[AI-generated content for ${promptType}]\n\nVariables: ${JSON.stringify(variables, null, 2)}`;
  }

  /**
   * Fallback content generation (offline mode)
   */
  private generateFallbackDescription(conceptName: string, context: GenerationContext): string {
    return `# ${conceptName}\n\nA concept used in this ${context.framework} application.\n\n*Note: AI generation unavailable. Edit this file to add details.*`;
  }

  /**
   * Build prompt template
   */
  private buildPrompt(promptType: string, variables: Record<string, any>): string {
    const prompts: Record<string, string> = {
      concept_description: `Generate a concise description (2-3 sentences) for the concept "${variables.conceptName}" in the context of a ${variables.projectType} application. ${variables.projectDescription ? `Project: ${variables.projectDescription}` : ''}`,

      technical_docs: `Explain how ${variables.dependencyName} (version ${variables.version}) is typically used in ${variables.projectType} applications. Include: purpose, key features, and common use cases. Keep it under 200 words.`,

      feature_docs: `Document the feature "${variables.featureName}" for a ${variables.projectType} application. Explain what it does, how users interact with it, and its value. Keep it under 150 words.`,

      architecture_overview: `Generate a system architecture overview for a ${variables.framework} application with ${variables.componentCount} components and ${variables.dependencyCount} dependencies. Describe the overall structure, key layers, and design patterns.`,
    };

    return prompts[promptType] || '';
  }
}
```

**Success Criteria**:
- [ ] AI-generated content for all node types (concept, technical, feature, architecture)
- [ ] Content caching working (avoids duplicate API calls)
- [ ] Offline/fallback mode functional
- [ ] Integration with Claude-Flow MCP tools (when available)
- [ ] Integration tests passing

---

### Day 10: Vault Finalizer

**File**: `/weaver/src/vault-init/finalizer.ts`

```typescript
class VaultFinalizer {
  constructor(
    private shadowCache: ShadowCacheService,
    private git: Git
  ) {}

  /**
   * Finalize vault: write files, populate cache, initialize Git
   */
  async finalize(vaultPath: string, vault: VaultStructure): Promise<VaultFinalizationResult> {
    const result: VaultFinalizationResult = {
      filesCreated: 0,
      cacheEntriesAdded: 0,
      gitInitialized: false,
      errors: [],
    };

    try {
      // 1. Create directory structure
      await this.createDirectories(vaultPath, vault.directories);

      // 2. Write all markdown files
      result.filesCreated = await this.writeMarkdownFiles(vaultPath, vault.nodes);

      // 3. Generate README and concept-map
      await this.generateREADME(vaultPath, vault);
      await this.generateConceptMap(vaultPath, vault);

      // 4. Populate shadow cache
      result.cacheEntriesAdded = await this.populateShadowCache(vaultPath);

      // 5. Initialize Git repository
      result.gitInitialized = await this.initializeGit(vaultPath);

      return result;
    } catch (error) {
      result.errors.push(error as Error);
      throw new VaultFinalizationError('Failed to finalize vault', result);
    }
  }

  /**
   * Write markdown files with frontmatter
   */
  private async writeMarkdownFiles(vaultPath: string, nodes: GeneratedNode[]): Promise<number> {
    let count = 0;

    for (const node of nodes) {
      const filePath = join(vaultPath, node.path);

      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });

      // Generate frontmatter
      const frontmatter = yaml.dump(node.frontmatter);

      // Combine frontmatter + content
      const markdown = `---\n${frontmatter}---\n\n${node.content}\n`;

      await writeFile(filePath, markdown, 'utf-8');
      count++;
    }

    return count;
  }

  /**
   * Populate shadow cache with all vault files
   */
  private async populateShadowCache(vaultPath: string): Promise<number> {
    // Scan all markdown files
    const files = await glob('**/*.md', { cwd: vaultPath });

    let count = 0;
    for (const file of files) {
      const filePath = join(vaultPath, file);
      const content = await readFile(filePath, 'utf-8');
      const { data: frontmatter, content: markdown } = matter(content);

      // Add to shadow cache
      await this.shadowCache.addFile({
        path: filePath,
        frontmatter,
        content: markdown,
        links: this.extractLinks(markdown),
        tags: frontmatter.tags || [],
      });

      count++;
    }

    return count;
  }

  /**
   * Initialize Git repository
   */
  private async initializeGit(vaultPath: string): Promise<boolean> {
    try {
      await this.git.init(vaultPath);

      // Create .gitignore
      const gitignore = [
        '# Weave-NN',
        '.weaver-cache/',
        '.weaver-temp/',
        '',
        '# OS',
        '.DS_Store',
        'Thumbs.db',
      ].join('\n');

      await writeFile(join(vaultPath, '.gitignore'), gitignore);

      // Initial commit
      await this.git.add(vaultPath, '.');
      await this.git.commit(vaultPath, 'chore: Initialize vault with generated content');

      return true;
    } catch (error) {
      console.error('Git initialization failed:', error);
      return false;
    }
  }

  /**
   * Generate vault README.md
   */
  private async generateREADME(vaultPath: string, vault: VaultStructure): Promise<void> {
    const template = await this.loadTemplate('readme.md.hbs');
    const content = template({
      projectName: vault.metadata.projectName,
      framework: vault.metadata.framework,
      description: vault.metadata.description,
      directories: vault.directories,
      totalNodes: vault.nodes.length,
      dependencyCount: vault.nodes.filter(n => n.type === 'technical').length,
      componentCount: vault.nodes.filter(n => n.type === 'component').length,
      generatedDate: new Date().toISOString(),
    });

    await writeFile(join(vaultPath, 'README.md'), content);
  }

  /**
   * Generate concept-map.md with Mermaid diagram
   */
  private async generateConceptMap(vaultPath: string, vault: VaultStructure): Promise<void> {
    const graphGen = new KnowledgeGraphGenerator();
    const diagram = graphGen.generateArchitectureDiagram(vault);

    const content = [
      '---',
      'type: concept-map',
      'generated: true',
      '---',
      '',
      '# Concept Map',
      '',
      'Visual overview of the knowledge graph.',
      '',
      diagram,
    ].join('\n');

    await writeFile(join(vaultPath, 'concept-map.md'), content);
  }
}
```

**Success Criteria**:
- [ ] All markdown files written with correct frontmatter
- [ ] Shadow cache populated (100% of files indexed)
- [ ] Git repository initialized with .gitignore
- [ ] README.md generated from template
- [ ] concept-map.md generated with Mermaid diagram
- [ ] End-to-end tests passing

---

## Week 3: Integration & CLI (Days 11-15)

### Day 11-12: Memory Bootstrapper (Claude-Flow Integration)

**File**: `/weaver/src/vault-init/memory-bootstrap.ts`

```typescript
class MemoryBootstrapper {
  constructor(private claudeFlowClient: ClaudeFlowClient) {}

  /**
   * Bootstrap Claude-Flow memory with vault data
   */
  async bootstrapMemory(
    vault: VaultStructure,
    config: MemoryBootstrapConfig
  ): Promise<MemoryBootstrapResult> {
    const result: MemoryBootstrapResult = {
      projectOverviewStored: false,
      technicalStackStored: false,
      embeddingsGenerated: 0,
      semanticSearchEnabled: false,
    };

    // 1. Store project overview
    await this.storeProjectOverview(vault, config);
    result.projectOverviewStored = true;

    // 2. Store technical stack
    await this.storeTechnicalStack(vault, config);
    result.technicalStackStored = true;

    // 3. Generate and store embeddings
    if (config.enableEmbeddings) {
      result.embeddingsGenerated = await this.generateEmbeddings(vault, config);
    }

    // 4. Enable semantic search
    if (config.enableSemanticSearch) {
      await this.enableSemanticSearch(config);
      result.semanticSearchEnabled = true;
    }

    return result;
  }

  /**
   * Store project overview in Claude-Flow memory
   */
  private async storeProjectOverview(
    vault: VaultStructure,
    config: MemoryBootstrapConfig
  ): Promise<void> {
    const namespace = `project:${vault.metadata.projectName}`;

    await this.claudeFlowClient.memoryStore(namespace, 'overview', {
      name: vault.metadata.projectName,
      framework: vault.metadata.framework,
      language: vault.metadata.language,
      description: vault.metadata.description,
      nodeCount: vault.nodes.length,
      generatedAt: new Date().toISOString(),
    });
  }

  /**
   * Generate embeddings for all nodes using OpenAI
   */
  private async generateEmbeddings(
    vault: VaultStructure,
    config: MemoryBootstrapConfig
  ): Promise<number> {
    let count = 0;

    for (const node of vault.nodes) {
      // Create embedding text
      const text = `${node.frontmatter.name}\n\n${node.content}`;

      // Generate embedding (using OpenAI API)
      const embedding = await this.generateEmbedding(text);

      // Store in Claude-Flow
      await this.claudeFlowClient.storeEmbedding(node.id, embedding);

      count++;
    }

    return count;
  }
}
```

**Success Criteria**:
- [ ] Claude-Flow MCP integration working
- [ ] Project context stored in memory (namespace: `project:app-name`)
- [ ] Technical stack stored
- [ ] Embeddings generated for all nodes
- [ ] Semantic search enabled via Claude-Flow
- [ ] Integration tests passing

---

### Day 13-14: CLI Tool

**File**: `/weaver/src/cli/commands/init.ts`

```typescript
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import cliProgress from 'cli-progress';

export function createInitCommand(): Command {
  const cmd = new Command('init');

  cmd
    .description('Initialize a new vault from an existing application')
    .argument('<app-path>', 'Path to application codebase')
    .option('-o, --output <path>', 'Output vault directory')
    .option('-t, --template <name>', 'Template to use (auto-detected if not specified)')
    .option('--scan-depth <number>', 'Maximum directory scan depth', '3')
    .option('--include-tests', 'Include test files in scan', false)
    .option('--claude-flow', 'Enable Claude-Flow AI generation', true)
    .option('--dry-run', 'Preview without creating files', false)
    .option('--offline', 'Offline mode (no AI generation)', false)
    .option('-v, --verbose', 'Verbose output', false)
    .action(async (appPath, options) => {
      await runVaultInit(appPath, options);
    });

  return cmd;
}

async function runVaultInit(appPath: string, options: any): Promise<void> {
  console.log(chalk.bold.cyan('\n🚀 Weave-NN Vault Initializer\n'));

  // Validate app path
  if (!await exists(appPath)) {
    console.error(chalk.red(`Error: Application path not found: ${appPath}`));
    process.exit(1);
  }

  // Interactive prompts (if needed)
  const config = await promptForConfig(appPath, options);

  // Show configuration
  console.log(chalk.gray('\nConfiguration:'));
  console.log(chalk.gray(`  App Path: ${config.appPath}`));
  console.log(chalk.gray(`  Output: ${config.outputPath}`));
  console.log(chalk.gray(`  Template: ${config.template || 'auto-detect'}`));
  console.log(chalk.gray(`  Claude-Flow: ${config.claudeFlow ? 'enabled' : 'disabled'}`));
  console.log();

  if (options.dryRun) {
    console.log(chalk.yellow('⚠️  Dry-run mode: No files will be created\n'));
  }

  // Initialize vault
  const initializer = new VaultInitializer(config);

  try {
    // Progress tracking
    const progressBar = new cliProgress.SingleBar({
      format: 'Progress |{bar}| {percentage}% | {phase}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    });

    progressBar.start(100, 0, { phase: 'Starting...' });

    initializer.on('progress', (event: ProgressEvent) => {
      progressBar.update(event.percentage, { phase: event.phase });
    });

    // Run initialization
    const result = await initializer.run();

    progressBar.stop();

    // Show results
    console.log(chalk.green.bold('\n✅ Vault initialization complete!\n'));
    console.log(chalk.gray('Results:'));
    console.log(chalk.gray(`  Files created: ${result.filesCreated}`));
    console.log(chalk.gray(`  Cache entries: ${result.cacheEntries}`));
    console.log(chalk.gray(`  Nodes generated: ${result.nodeCount}`));
    console.log(chalk.gray(`  Vault path: ${result.vaultPath}`));
    console.log();

    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray(`  1. cd ${result.vaultPath}`));
    console.log(chalk.gray(`  2. Open in Obsidian or your editor`));
    console.log(chalk.gray(`  3. Review and edit generated content`));
    console.log();

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Vault initialization failed\n'));
    console.error(chalk.red((error as Error).message));

    if (options.verbose) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray((error as Error).stack));
    }

    process.exit(1);
  }
}

async function promptForConfig(appPath: string, options: any): Promise<VaultInitConfig> {
  const questions: any[] = [];

  // Output path
  if (!options.output) {
    questions.push({
      type: 'input',
      name: 'output',
      message: 'Output vault directory:',
      default: join(dirname(appPath), `${basename(appPath)}-vault`),
    });
  }

  // Confirm if output exists
  const outputPath = options.output || join(dirname(appPath), `${basename(appPath)}-vault`);
  if (await exists(outputPath)) {
    questions.push({
      type: 'confirm',
      name: 'overwrite',
      message: `Output directory exists. Overwrite?`,
      default: false,
    });
  }

  const answers = await inquirer.prompt(questions);

  if (answers.overwrite === false) {
    console.log(chalk.yellow('Cancelled'));
    process.exit(0);
  }

  return {
    appPath,
    outputPath: answers.output || outputPath,
    template: options.template,
    scanDepth: parseInt(options.scanDepth),
    includeTests: options.includeTests,
    claudeFlow: options.claudeFlow && !options.offline,
    dryRun: options.dryRun,
    verbose: options.verbose,
  };
}
```

**Dependencies**:
```bash
bun add commander inquirer ora chalk cli-progress
bun add -D @types/inquirer @types/cli-progress
```

**Success Criteria**:
- [ ] CLI command `weaver init` functional
- [ ] Interactive prompts working (if options not provided)
- [ ] Progress reporting with spinners and progress bars
- [ ] Error handling with helpful messages
- [ ] Dry-run mode working
- [ ] Verbose mode for debugging
- [ ] User documentation complete

---

### Day 15: Workflow Integration

**File**: `/weaver/src/workflows/vault-init-workflow.ts`

```typescript
export const vaultInitializationWorkflow: WorkflowDefinition = {
  id: 'vault-initialization',
  name: 'Vault Initialization Workflow',
  description: 'Bootstrap new vault from existing application codebase',
  version: '1.0.0',
  triggers: ['manual', 'mcp-tool'],
  enabled: true,

  inputs: {
    appPath: { type: 'string', required: true },
    outputPath: { type: 'string', required: false },
    template: { type: 'string', required: false },
    claudeFlow: { type: 'boolean', default: true },
  },

  outputs: {
    vaultPath: { type: 'string' },
    filesCreated: { type: 'number' },
    nodeCount: { type: 'number' },
  },

  handler: async (context: WorkflowContext) => {
    const { appPath, outputPath, template, claudeFlow } = context.input;

    // Create initializer
    const initializer = new VaultInitializer({
      appPath,
      outputPath: outputPath || `${appPath}-vault`,
      template,
      claudeFlow,
    });

    // Track progress in workflow context
    initializer.on('progress', (event: ProgressEvent) => {
      context.updateProgress(event.percentage, event.phase);
    });

    // Run initialization
    const result = await initializer.run();

    // Return outputs
    return {
      vaultPath: result.vaultPath,
      filesCreated: result.filesCreated,
      nodeCount: result.nodeCount,
    };
  },
};
```

**MCP Tool**: Create tool for triggering via Claude-Flow

```typescript
// Register MCP tool
export const triggerVaultInitializationTool = {
  name: 'trigger_vault_initialization',
  description: 'Initialize a new Weave-NN vault from an application codebase',

  inputSchema: {
    type: 'object',
    properties: {
      appPath: {
        type: 'string',
        description: 'Path to application codebase',
      },
      outputPath: {
        type: 'string',
        description: 'Output vault directory (optional)',
      },
      template: {
        type: 'string',
        enum: ['typescript-app', 'nextjs-app', 'python-app', 'monorepo', 'generic'],
        description: 'Template to use (auto-detected if not specified)',
      },
    },
    required: ['appPath'],
  },

  handler: async (input: any) => {
    const workflowEngine = new WorkflowEngine();
    const result = await workflowEngine.execute('vault-initialization', input);
    return result;
  },
};
```

**Success Criteria**:
- [ ] Workflow registered and functional
- [ ] MCP tool `trigger_vault_initialization` working
- [ ] Workflow execution tracked
- [ ] Integration with existing workflow engine
- [ ] Integration tests passing

---

## Week 4: Testing & Documentation (Days 16-20)

### Day 16-17: Comprehensive Testing

**Test Coverage Goals**: 80%+ coverage across all modules

#### Unit Tests

**File**: `/weaver/tests/vault-init/code-scanner.test.ts`

```typescript
describe('CodeScanner', () => {
  let scanner: CodeScanner;

  beforeEach(() => {
    scanner = new CodeScanner();
  });

  describe('detectFramework', () => {
    it('should detect Next.js from package.json', async () => {
      const result = await scanner.detectFramework('./fixtures/nextjs-app');
      expect(result).toBe(FrameworkType.NEXTJS);
    });

    it('should detect FastAPI from requirements.txt', async () => {
      const result = await scanner.detectFramework('./fixtures/fastapi-app');
      expect(result).toBe(FrameworkType.FASTAPI);
    });

    it('should return GENERIC for unknown frameworks', async () => {
      const result = await scanner.detectFramework('./fixtures/unknown-app');
      expect(result).toBe(FrameworkType.GENERIC);
    });
  });

  describe('extractComponents', () => {
    it('should extract React function components', async () => {
      const components = await scanner.extractComponents('./fixtures/react-components');
      expect(components).toHaveLength(3);
      expect(components[0].type).toBe('function-component');
    });

    it('should extract React class components', async () => {
      const components = await scanner.extractComponents('./fixtures/class-components');
      expect(components).toHaveLength(2);
      expect(components[0].type).toBe('class-component');
    });
  });
});
```

**File**: `/weaver/tests/vault-init/template-loader.test.ts`
**File**: `/weaver/tests/vault-init/graph-generator.test.ts`
**File**: `/weaver/tests/vault-init/ai-generator.test.ts`

#### Integration Tests

**File**: `/weaver/tests/vault-init/integration/end-to-end.test.ts`

```typescript
describe('Vault Initialization E2E', () => {
  const tempDir = join(__dirname, '../temp');

  beforeEach(async () => {
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  it('should initialize vault for Next.js application', async () => {
    const appPath = './fixtures/nextjs-app';
    const outputPath = join(tempDir, 'nextjs-vault');

    const initializer = new VaultInitializer({
      appPath,
      outputPath,
      claudeFlow: false, // Offline mode for testing
    });

    const result = await initializer.run();

    // Verify vault structure
    expect(await exists(join(outputPath, 'README.md'))).toBe(true);
    expect(await exists(join(outputPath, 'concept-map.md'))).toBe(true);
    expect(await exists(join(outputPath, 'concepts'))).toBe(true);
    expect(await exists(join(outputPath, 'technical'))).toBe(true);

    // Verify files created
    expect(result.filesCreated).toBeGreaterThan(10);

    // Verify shadow cache populated
    expect(result.cacheEntries).toBe(result.filesCreated);

    // Verify Git initialized
    expect(await exists(join(outputPath, '.git'))).toBe(true);
  });

  it('should handle Python FastAPI application', async () => {
    const appPath = './fixtures/fastapi-app';
    const outputPath = join(tempDir, 'fastapi-vault');

    const initializer = new VaultInitializer({
      appPath,
      outputPath,
      template: 'python-app',
      claudeFlow: false,
    });

    const result = await initializer.run();

    // Verify Python-specific nodes created
    const technicalFiles = await glob('technical/*.md', { cwd: outputPath });
    expect(technicalFiles.length).toBeGreaterThan(5); // Dependencies
  });
});
```

#### Performance Tests

**File**: `/weaver/tests/vault-init/performance.test.ts`

```typescript
describe('Performance Benchmarks', () => {
  it('should initialize small app (<50 files) in under 30 seconds', async () => {
    const start = Date.now();

    const initializer = new VaultInitializer({
      appPath: './fixtures/small-app',
      outputPath: './temp/small-vault',
      claudeFlow: false,
    });

    await initializer.run();

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(30000);
  });

  it('should use less than 200MB memory', async () => {
    const before = process.memoryUsage().heapUsed;

    const initializer = new VaultInitializer({
      appPath: './fixtures/medium-app',
      outputPath: './temp/medium-vault',
      claudeFlow: false,
    });

    await initializer.run();

    const after = process.memoryUsage().heapUsed;
    const used = (after - before) / 1024 / 1024; // MB

    expect(used).toBeLessThan(200);
  });
});
```

**Success Criteria**:
- [ ] 80%+ test coverage across all modules
- [ ] All unit tests passing
- [ ] Integration tests for all 5 templates
- [ ] E2E tests passing
- [ ] Performance benchmarks met

---

### Day 18-19: Documentation

#### User Guide

**File**: `/weaver/docs/vault-initialization-guide.md`

**Contents**:
1. Introduction
2. Getting Started
3. CLI Usage Examples
4. Template Selection Guide
5. Customization Options
6. Claude-Flow Integration
7. Troubleshooting
8. FAQ

#### Developer Guide

**File**: `/weaver/docs/vault-init-development.md`

**Contents**:
1. Architecture Overview
2. Module Documentation
3. Adding New Templates
4. Extending the Code Scanner
5. AI Generator Integration
6. Testing Guidelines
7. Contributing Guidelines

#### Template Documentation

For each template:
- **File**: `/weaver/docs/templates/<template-name>.md`
- **Contents**:
  - When to use this template
  - Generated structure
  - Customization variables
  - Example output
  - Screenshots

**Success Criteria**:
- [ ] Complete user guide (with examples and screenshots)
- [ ] Complete developer guide
- [ ] All 5 templates documented
- [ ] API reference generated (JSDoc)
- [ ] Inline code comments complete

---

### Day 20: Example Vaults

**Task**: Generate 5 example vaults showcasing each template

1. **TypeScript Express API** (small app)
   - Simple REST API with 5-10 endpoints
   - ~30 files

2. **Next.js SaaS App** (medium app)
   - Marketing site + app dashboard
   - ~150 files

3. **Python FastAPI Service** (small app)
   - Microservice with database
   - ~40 files

4. **Monorepo with 3 Services** (large app)
   - Frontend + Backend + Shared packages
   - ~400 files

5. **Generic Project** (fallback)
   - Mixed technologies
   - ~50 files

**Success Criteria**:
- [ ] 5 example vaults created (in `/weaver/examples/`)
- [ ] All examples validated (files valid, cache populated, Git initialized)
- [ ] Screenshots added to documentation
- [ ] Comparison guide created

---

## Quality Assurance

### TypeScript & Build Checks

```bash
# Type checking
bun run typecheck  # Must pass with 0 errors

# Linting
bun run lint       # Must pass with 0 errors

# Build
bun run build      # Must complete successfully
```

### Test Execution

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Target: 80%+ coverage
```

### Manual Testing Checklist

- [ ] Test `weaver init` with real applications
- [ ] Verify all 5 templates work correctly
- [ ] Test dry-run mode
- [ ] Test offline mode
- [ ] Test Claude-Flow integration
- [ ] Verify shadow cache population
- [ ] Verify Git initialization
- [ ] Test error handling and recovery
- [ ] Verify progress reporting

---

## Deliverables Checklist

### Code

- [ ] `/weaver/src/vault-init/code-scanner.ts` - Code scanning module
- [ ] `/weaver/src/vault-init/template-loader.ts` - Template system
- [ ] `/weaver/src/vault-init/doc-extractor.ts` - Documentation extractor
- [ ] `/weaver/src/vault-init/graph-generator.ts` - Knowledge graph generator
- [ ] `/weaver/src/vault-init/ai-generator.ts` - AI content generator
- [ ] `/weaver/src/vault-init/finalizer.ts` - Vault finalizer
- [ ] `/weaver/src/vault-init/memory-bootstrap.ts` - Claude-Flow integration
- [ ] `/weaver/src/vault-init/index.ts` - Main orchestrator
- [ ] `/weaver/src/cli/commands/init.ts` - CLI command
- [ ] `/weaver/src/workflows/vault-init-workflow.ts` - Workflow definition

### Templates

- [ ] `/weaver/templates/typescript-app.yaml` + Handlebars templates
- [ ] `/weaver/templates/nextjs-app.yaml` + Handlebars templates
- [ ] `/weaver/templates/python-app.yaml` + Handlebars templates
- [ ] `/weaver/templates/monorepo.yaml` + Handlebars templates
- [ ] `/weaver/templates/generic.yaml` + Handlebars templates

### Tests

- [ ] `/weaver/tests/vault-init/code-scanner.test.ts`
- [ ] `/weaver/tests/vault-init/template-loader.test.ts`
- [ ] `/weaver/tests/vault-init/graph-generator.test.ts`
- [ ] `/weaver/tests/vault-init/ai-generator.test.ts`
- [ ] `/weaver/tests/vault-init/integration/end-to-end.test.ts`
- [ ] `/weaver/tests/vault-init/performance.test.ts`

### Documentation

- [ ] `/weaver/docs/vault-initialization-guide.md` - User guide
- [ ] `/weaver/docs/vault-init-development.md` - Developer guide
- [ ] `/weaver/docs/templates/typescript-app.md` - Template docs (×5)
- [ ] API reference (auto-generated from JSDoc)

### Examples

- [ ] `/weaver/examples/typescript-express-api/` - Example vault
- [ ] `/weaver/examples/nextjs-saas-app/` - Example vault
- [ ] `/weaver/examples/python-fastapi-service/` - Example vault
- [ ] `/weaver/examples/monorepo-multi-service/` - Example vault
- [ ] `/weaver/examples/generic-project/` - Example vault

---

## Dependencies Installation

```bash
# CLI & UX
bun add commander inquirer ora chalk cli-progress

# Parsing
bun add @babel/parser @babel/traverse acorn acorn-walk
bun add gray-matter js-yaml fast-glob

# Templates
bun add handlebars

# AI (optional, for embeddings)
bun add openai

# Dev dependencies
bun add -D @types/inquirer @types/cli-progress
bun add -D @types/babel__parser @types/babel__traverse
```

---

## Risk Mitigation

### Technical Risks

1. **AST Parsing Complexity**
   - Mitigation: Use battle-tested parsers (Babel, Acorn)
   - Fallback: Regex-based extraction if AST fails

2. **Claude-Flow Availability**
   - Mitigation: Implement offline fallback mode
   - Graceful degradation without AI generation

3. **Large Codebases Performance**
   - Mitigation: Configurable scan depth
   - File count limits with warnings
   - Streaming/chunked processing

### Scope Risks

1. **Feature Creep**
   - Stick to defined 5 templates
   - Document future enhancements separately
   - Clear "out of scope" section

2. **Timeline Pressure**
   - Prioritize core functionality first
   - AI generation optional/fallback
   - Defer advanced features to Phase 7

---

## Success Metrics

### Functional

- [ ] CLI command `weaver init` fully functional
- [ ] Auto-detects 6+ framework types with 95%+ accuracy
- [ ] Generates valid vault structure for all 5 templates
- [ ] Shadow cache populated (100% of generated files)
- [ ] Git repository initialized successfully
- [ ] Claude-Flow integration working (when available)
- [ ] Dry-run mode functional

### Performance

- [ ] Small app (<50 files): < 30 seconds
- [ ] Medium app (50-500 files): 1-3 minutes
- [ ] Large app (500+ files): 3-10 minutes
- [ ] Memory usage: < 200 MB peak
- [ ] Vault size: 0.1-5 MB for typical apps

### Quality

- [ ] Test coverage > 80%
- [ ] TypeScript strict mode enabled (0 errors)
- [ ] No linting errors
- [ ] Complete documentation (user + developer)
- [ ] 5 example vaults with screenshots

---

## Next Steps After Completion

1. **User Testing**: Get feedback from real users
2. **Iteration**: Fix bugs and improve based on feedback
3. **Phase 7**: Advanced features (incremental updates, multi-language support)
4. **Integration**: Deep integration with other Weave-NN components

---

**Generated**: 2025-10-24
**Phase**: PHASE-6 - Vault Initialization System
**Estimated Effort**: 15-20 days (4 weeks)
**Confidence**: 85%
