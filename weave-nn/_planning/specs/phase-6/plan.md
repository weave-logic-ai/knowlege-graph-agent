# Vault Initialization System - Implementation Plan

**Phase ID**: PHASE-6
**Status**: Planning
**Duration**: 15-20 days (4 weeks)
**Team Size**: 1-2 developers

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Module Design](#module-design)
3. [Data Flow](#data-flow)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Technical Decisions](#technical-decisions)
6. [Testing Strategy](#testing-strategy)
7. [Deployment Plan](#deployment-plan)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Interface                            │
│                     (weaver init command)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VaultInitializer                              │
│                  (Main Orchestrator)                             │
└─┬───────┬────────┬──────────┬──────────┬──────────┬────────────┘
  │       │        │          │          │          │
  ▼       ▼        ▼          ▼          ▼          ▼
┌────┐ ┌────┐  ┌─────┐   ┌──────┐   ┌──────┐  ┌──────┐
│Code│ │Tmpl│  │ Doc │   │Graph │   │  AI  │  │Vault │
│Scan│ │Sys │  │Extr │   │ Gen  │   │ Gen  │  │Final │
└────┘ └────┘  └─────┘   └──────┘   └──────┘  └──────┘
  │       │        │          │          │          │
  └───────┴────────┴──────────┴──────────┴──────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Output: Generated Vault                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Markdown  │  │Shadow    │  │  Git     │  │Wikilinks │       │
│  │Files     │  │Cache     │  │  Repo    │  │& Graph   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Pipeline Architecture

The system follows a **linear pipeline** pattern with 6 distinct phases:

```
Input: App Codebase
    ↓
[1] Code Scanner → CodeScanResult
    ↓
[2] Template Selector → Template
    ↓
[3] Doc Extractor → ExtractedDocs
    ↓
[4] Graph Generator → VaultStructure
    ↓
[5] AI Generator (optional) → EnrichedContent
    ↓
[6] Vault Finalizer → Generated Vault
```

Each phase is **idempotent** and **resumable** for error recovery.

---

## Module Design

### 1. Code Scanner Module

**Location**: `/weaver/src/vault-init/code-scanner.ts`

**Class Structure**:
```typescript
export class CodeScanner {
  constructor(private options: ScanOptions) {}

  async scan(appPath: string): Promise<CodeScanResult> {
    const framework = await this.detectFramework(appPath);
    const structure = await this.scanStructure(appPath);
    const dependencies = await this.parseDependencies(appPath);
    const components = await this.extractComponents(appPath, framework);
    const configFiles = await this.detectConfigFiles(appPath);

    return {
      framework,
      language: this.inferLanguage(framework),
      rootPath: appPath,
      structure,
      dependencies,
      components,
      entryPoints: this.findEntryPoints(structure),
      configFiles,
    };
  }

  private async detectFramework(path: string): Promise<FrameworkType> {
    // Strategy pattern: Try detectors in order of specificity
    const detectors = [
      new NextJsDetector(),
      new DjangoDetector(),
      new FastAPIDetector(),
      new FlaskDetector(),
      new ExpressDetector(),
      new ReactDetector(),
      new GenericDetector(), // Fallback
    ];

    for (const detector of detectors) {
      if (await detector.detect(path)) {
        return detector.frameworkType;
      }
    }

    return 'generic';
  }

  private async scanStructure(path: string): Promise<DirectoryTree> {
    // Use fast-glob for efficient directory traversal
    const patterns = ['**/*'];
    const ignore = [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**',
      '__pycache__/**',
      '*.pyc',
    ];

    const files = await glob(patterns, {
      cwd: path,
      ignore,
      deep: this.options.scanDepth || 3,
      stats: true,
    });

    return this.buildDirectoryTree(files);
  }

  private async extractComponents(
    path: string,
    framework: FrameworkType
  ): Promise<Component[]> {
    // Delegate to language-specific extractors
    const extractor = this.getExtractor(framework);
    return extractor.extract(path);
  }
}
```

**Framework Detectors**:
```typescript
interface FrameworkDetector {
  frameworkType: FrameworkType;
  detect(path: string): Promise<boolean>;
}

class NextJsDetector implements FrameworkDetector {
  frameworkType = 'nextjs';

  async detect(path: string): Promise<boolean> {
    // Check for next.config.js/mjs and package.json with "next"
    const hasNextConfig = await exists(join(path, 'next.config.js')) ||
                         await exists(join(path, 'next.config.mjs'));
    const pkg = await readPackageJson(path);
    const hasNextDep = pkg?.dependencies?.next || pkg?.devDependencies?.next;

    return hasNextConfig && hasNextDep;
  }
}
```

**Component Extractors**:
```typescript
// TypeScript/JavaScript extractor using Babel
class TypeScriptExtractor {
  async extract(path: string): Promise<Component[]> {
    const files = await glob('**/*.{ts,tsx,js,jsx}', { cwd: path });
    const components: Component[] = [];

    for (const file of files) {
      const code = await readFile(join(path, file), 'utf-8');
      const ast = parse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });

      traverse(ast, {
        FunctionDeclaration(path) {
          components.push({
            type: 'function',
            name: path.node.id?.name,
            filePath: file,
            exports: this.extractExports(path),
          });
        },
        ClassDeclaration(path) {
          components.push({
            type: 'class',
            name: path.node.id?.name,
            filePath: file,
            exports: this.extractExports(path),
          });
        },
      });
    }

    return components;
  }
}

// Python extractor using subprocess
class PythonExtractor {
  async extract(path: string): Promise<Component[]> {
    // Run Python script to parse AST
    const script = `
import ast
import json
import sys
from pathlib import Path

def extract_components(file_path):
    with open(file_path) as f:
        tree = ast.parse(f.read())

    components = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            components.append({
                'type': 'function',
                'name': node.name,
                'filePath': str(file_path),
            })
        elif isinstance(node, ast.ClassDef):
            components.append({
                'type': 'class',
                'name': node.name,
                'filePath': str(file_path),
            })

    return components

# Find all .py files
py_files = Path('${path}').rglob('*.py')
all_components = []
for py_file in py_files:
    all_components.extend(extract_components(py_file))

print(json.dumps(all_components))
`;

    const result = await execAsync(`python3 -c "${script}"`);
    return JSON.parse(result.stdout);
  }
}
```

---

### 2. Template System

**Location**: `/weaver/src/vault-init/template-system.ts`

**Template Schema** (Zod):
```typescript
const TemplateSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  detection: z.object({
    required_files: z.array(z.string()),
    optional_files: z.array(z.string()).optional(),
  }),
  scanning: z.object({
    extensions: z.array(z.string()),
    exclude_patterns: z.array(z.string()),
    depth: z.number().default(3),
  }),
  vault_structure: z.object({
    directories: z.array(z.string()),
    templates: z.array(z.object({
      type: z.string(),
      path: z.string(),
      template: z.string(), // Handlebars template file
    })),
  }),
  graph: z.object({
    nodes: z.array(z.object({
      type: z.string(),
      from: z.string(), // Source data path
    })),
    edges: z.array(z.object({
      type: z.string(),
      from: z.string(),
    })),
  }),
});

type Template = z.infer<typeof TemplateSchema>;
```

**Template Loader**:
```typescript
export class TemplateLoader {
  private cache = new Map<string, Template>();

  async load(templateName: string): Promise<Template> {
    if (this.cache.has(templateName)) {
      return this.cache.get(templateName)!;
    }

    const templatePath = join(__dirname, '../../templates', `${templateName}.yaml`);
    const yaml = await readFile(templatePath, 'utf-8');
    const data = YAML.parse(yaml);

    // Validate with Zod
    const template = TemplateSchema.parse(data);

    this.cache.set(templateName, template);
    return template;
  }

  async selectTemplate(scanResult: CodeScanResult): Promise<Template> {
    // Map framework to template
    const mapping: Record<FrameworkType, string> = {
      'nextjs': 'nextjs-app',
      'django': 'python-app',
      'fastapi': 'python-app',
      'flask': 'python-app',
      'express': 'typescript-app',
      'react': 'typescript-app',
      'generic': 'generic',
    };

    const templateName = mapping[scanResult.framework];
    return this.load(templateName);
  }
}
```

**Handlebars Renderer**:
```typescript
export class TemplateRenderer {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  render(templatePath: string, variables: TemplateVariables): string {
    const source = readFileSync(templatePath, 'utf-8');
    const template = this.handlebars.compile(source);
    return template(variables);
  }

  private registerHelpers() {
    // Custom helper: format date
    this.handlebars.registerHelper('formatDate', (date: Date) => {
      return date.toISOString().split('T')[0];
    });

    // Custom helper: wikilink
    this.handlebars.registerHelper('wikilink', (title: string, alias?: string) => {
      return alias ? `[[${title}|${alias}]]` : `[[${title}]]`;
    });
  }
}
```

---

### 3. Documentation Extractor

**Location**: `/weaver/src/vault-init/doc-extractor.ts`

**README Parser**:
```typescript
export class ReadmeParser {
  async parse(readmePath: string): Promise<README> {
    const content = await readFile(readmePath, 'utf-8');
    const parsed = matter(content);

    return {
      frontmatter: parsed.data,
      sections: this.extractSections(parsed.content),
      features: this.extractFeatures(parsed.content),
      technologies: this.extractTechnologies(parsed.content),
    };
  }

  private extractSections(markdown: string): Section[] {
    const sections: Section[] = [];
    const lines = markdown.split('\n');

    let currentSection: Section | null = null;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = {
          title: line.slice(3),
          content: '',
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) sections.push(currentSection);
    return sections;
  }

  private extractFeatures(markdown: string): string[] {
    // Look for "Features" section with bullet points
    const featureSection = markdown.match(/## Features\n([\s\S]*?)(?=\n##|$)/);
    if (!featureSection) return [];

    const bullets = featureSection[1].match(/^- (.+)$/gm);
    return bullets?.map(b => b.slice(2)) || [];
  }
}
```

**JSDoc/Docstring Extractor**:
```typescript
export class CommentExtractor {
  extractJSDoc(filePath: string): CodeComment[] {
    const code = readFileSync(filePath, 'utf-8');
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });

    const comments: CodeComment[] = [];

    traverse(ast, {
      FunctionDeclaration(path) {
        const leadingComments = path.node.leadingComments;
        if (leadingComments) {
          comments.push({
            type: 'function',
            name: path.node.id?.name,
            comment: this.parseJSDoc(leadingComments),
            filePath,
          });
        }
      },
    });

    return comments;
  }

  async extractPythonDocstrings(filePath: string): Promise<CodeComment[]> {
    // Use Python subprocess similar to PythonExtractor
    const script = `
import ast
import json

with open('${filePath}') as f:
    tree = ast.parse(f.read())

comments = []
for node in ast.walk(tree):
    if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
        docstring = ast.get_docstring(node)
        if docstring:
            comments.append({
                'type': 'function' if isinstance(node, ast.FunctionDef) else 'class',
                'name': node.name,
                'comment': docstring,
                'filePath': '${filePath}',
            })

print(json.dumps(comments))
`;

    const result = await execAsync(`python3 -c "${script}"`);
    return JSON.parse(result.stdout);
  }
}
```

---

### 4. Knowledge Graph Generator

**Location**: `/weaver/src/vault-init/graph-generator.ts`

**Taxonomy Mapper**:
```typescript
export class TaxonomyMapper {
  mapToVault(scanResult: CodeScanResult, template: Template): VaultStructure {
    const nodes: GeneratedNode[] = [];

    // Map dependencies to technical nodes
    for (const dep of scanResult.dependencies) {
      nodes.push(this.createTechnicalNode(dep));
    }

    // Map components to component nodes
    for (const component of scanResult.components) {
      nodes.push(this.createComponentNode(component));
    }

    // Infer concepts from README/docs
    const concepts = this.inferConcepts(scanResult);
    for (const concept of concepts) {
      nodes.push(this.createConceptNode(concept));
    }

    // Build relationships
    const relationships = this.buildRelationships(nodes);

    return {
      rootPath: scanResult.rootPath,
      directories: template.vault_structure.directories,
      nodes,
      relationships,
    };
  }

  private createTechnicalNode(dep: Dependency): GeneratedNode {
    return {
      path: `technical/${dep.name}.md`,
      template: 'technical-node-template',
      frontmatter: {
        title: dep.name,
        type: 'technical',
        version: dep.version,
        category: dep.category, // production/dev/peer
        tags: ['dependency', dep.name],
      },
      content: this.generateTechnicalContent(dep),
      links: [],
      tags: ['dependency', dep.name],
    };
  }
}
```

**Wikilink Builder**:
```typescript
export class WikilinkBuilder {
  buildRelationships(nodes: GeneratedNode[]): NodeRelationship[] {
    const relationships: NodeRelationship[] = [];

    // Build dependency relationships
    for (const node of nodes) {
      if (node.frontmatter.type === 'component') {
        // Find dependencies used by this component
        const deps = this.findUsedDependencies(node);
        for (const dep of deps) {
          relationships.push({
            from: node.path,
            to: dep.path,
            type: 'uses',
          });

          // Add wikilink to node content
          node.links.push(`[[${dep.frontmatter.title}]]`);
        }
      }
    }

    return relationships;
  }
}
```

**Mermaid Generator**:
```typescript
export class MermaidGenerator {
  generateArchitectureDiagram(vault: VaultStructure): string {
    const lines = ['graph TD'];

    // Add nodes
    for (const node of vault.nodes) {
      const id = this.sanitizeId(node.path);
      const label = node.frontmatter.title;
      const shape = this.getShape(node.frontmatter.type);
      lines.push(`  ${id}${shape}${label}${shape}`);
    }

    // Add edges
    for (const rel of vault.relationships) {
      const fromId = this.sanitizeId(rel.from);
      const toId = this.sanitizeId(rel.to);
      lines.push(`  ${fromId} -->|${rel.type}| ${toId}`);
    }

    return lines.join('\n');
  }

  private getShape(type: string): string {
    const shapes: Record<string, string> = {
      'concept': '([', // Stadium
      'technical': '[', // Rectangle
      'feature': '[[', // Subroutine
      'component': '{', // Diamond
    };
    return shapes[type] || '[';
  }
}
```

---

### 5. AI Content Generator (Optional)

**Location**: `/weaver/src/vault-init/ai-generator.ts`

**Claude-Flow Integration**:
```typescript
export class AIContentGenerator {
  constructor(
    private mcpClient: MCPClient,
    private cache: ContentCache,
  ) {}

  async generateConceptDescription(
    concept: string,
    context: string,
  ): Promise<string> {
    // Check cache first
    const cacheKey = `concept:${concept}:${hash(context)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    // Call Claude-Flow MCP tool
    const prompt = `
You are documenting a software project. Explain the concept "${concept}"
in the context of this application:

${context}

Provide a clear, concise explanation (2-3 paragraphs) suitable for
a knowledge base. Include:
- What this concept is
- Why it's important in this project
- How it relates to other components

Format in markdown.
`;

    const result = await this.mcpClient.call('mcp__claude-flow__memory_usage', {
      action: 'store',
      key: `concept:${concept}`,
      value: prompt,
      namespace: 'vault-init',
    });

    // Generate content (this would call Claude API)
    const content = await this.generateWithClaude(prompt);

    // Cache result
    await this.cache.set(cacheKey, content, { ttl: 86400 }); // 24h

    return content;
  }

  async generateTechnicalDocs(dep: Dependency): Promise<string> {
    const cacheKey = `tech:${dep.name}:${dep.version}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const prompt = `
Document the dependency "${dep.name}" (version ${dep.version}) for a developer
knowledge base.

Include:
- Purpose and use case
- Key features
- Common usage patterns
- Installation and setup

Format in markdown.
`;

    const content = await this.generateWithClaude(prompt);
    await this.cache.set(cacheKey, content, { ttl: 86400 });

    return content;
  }

  private async generateWithClaude(prompt: string): Promise<string> {
    // This would use Claude API or Claude-Flow MCP
    // Placeholder for now
    return `Generated content for: ${prompt.slice(0, 50)}...`;
  }
}
```

**Content Cache** (SQLite):
```typescript
export class ContentCache {
  constructor(private db: Database) {
    this.initTable();
  }

  private initTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS content_cache (
        key TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        ttl INTEGER NOT NULL
      )
    `);
  }

  async get(key: string): Promise<string | null> {
    const row = this.db.query(`
      SELECT content FROM content_cache
      WHERE key = ? AND created_at + ttl > ?
    `).get(key, Date.now());

    return row ? (row as any).content : null;
  }

  async set(key: string, content: string, options: { ttl: number }) {
    this.db.run(`
      INSERT OR REPLACE INTO content_cache (key, content, created_at, ttl)
      VALUES (?, ?, ?, ?)
    `, [key, content, Date.now(), options.ttl]);
  }
}
```

---

### 6. Vault Finalizer

**Location**: `/weaver/src/vault-init/finalizer.ts`

**File Writer** (Atomic):
```typescript
export class VaultFinalizer {
  async finalize(vaultPath: string, vault: VaultStructure): Promise<void> {
    try {
      // 1. Create directories
      await this.createDirectories(vaultPath, vault.directories);

      // 2. Write markdown files
      await this.writeMarkdownFiles(vaultPath, vault.nodes);

      // 3. Populate shadow cache
      await this.populateShadowCache(vaultPath, vault.nodes);

      // 4. Initialize Git
      await this.initializeGit(vaultPath);

      // 5. Generate README and concept map
      await this.generateREADME(vaultPath, vault);
      await this.generateConceptMap(vaultPath, vault);

    } catch (error) {
      // Rollback on error
      await this.rollback(vaultPath);
      throw error;
    }
  }

  private async writeMarkdownFiles(
    vaultPath: string,
    nodes: GeneratedNode[]
  ): Promise<void> {
    for (const node of nodes) {
      const fullPath = join(vaultPath, node.path);
      const content = this.formatMarkdown(node);

      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, content, 'utf-8');
    }
  }

  private formatMarkdown(node: GeneratedNode): string {
    const frontmatter = YAML.stringify(node.frontmatter);
    return `---\n${frontmatter}---\n\n${node.content}`;
  }

  private async populateShadowCache(
    vaultPath: string,
    nodes: GeneratedNode[]
  ): Promise<void> {
    const db = new Database(join(vaultPath, '.weaver', 'shadow-cache.db'));

    for (const node of nodes) {
      db.run(`
        INSERT INTO files (path, content, frontmatter, links, indexed_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        node.path,
        node.content,
        JSON.stringify(node.frontmatter),
        JSON.stringify(node.links),
        Date.now(),
      ]);
    }

    db.close();
  }

  private async initializeGit(vaultPath: string): Promise<void> {
    const git = simpleGit(vaultPath);

    await git.init();

    // Create .gitignore
    await writeFile(
      join(vaultPath, '.gitignore'),
      [
        '.weaver/shadow-cache.db',
        '.obsidian/',
        'node_modules/',
      ].join('\n'),
      'utf-8'
    );

    // Initial commit
    await git.add('.');
    await git.commit('Initialize vault');
  }
}
```

---

### 7. CLI Tool

**Location**: `/weaver/src/cli/commands/init.ts`

**Command Definition**:
```typescript
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import cliProgress from 'cli-progress';

export function registerInitCommand(program: Command) {
  program
    .command('init [app-path]')
    .description('Initialize vault from application codebase')
    .option('-o, --output <path>', 'Output vault path')
    .option('-t, --template <name>', 'Template to use (typescript-app, nextjs-app, etc.)')
    .option('-d, --scan-depth <number>', 'Directory scan depth', '3')
    .option('--include-tests', 'Include test files in scan')
    .option('--claude-flow', 'Enable Claude-Flow AI content generation')
    .option('--dry-run', 'Preview without creating files')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (appPath, options) => {
      const cli = new InitCLI(options);
      await cli.run(appPath);
    });
}

class InitCLI {
  constructor(private options: any) {}

  async run(appPath?: string): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 Vault Initialization\n'));

    // Interactive prompts if args missing
    const config = await this.gatherConfig(appPath);

    // Confirm before proceeding
    if (!this.options.yes && !this.options.dryRun) {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Initialize vault with these settings?',
        default: true,
      }]);

      if (!confirm) {
        console.log(chalk.yellow('Cancelled.'));
        return;
      }
    }

    // Execute initialization
    await this.execute(config);
  }

  private async gatherConfig(appPath?: string): Promise<InitConfig> {
    const questions: any[] = [];

    if (!appPath) {
      questions.push({
        type: 'input',
        name: 'appPath',
        message: 'Application path:',
        default: process.cwd(),
      });
    }

    if (!this.options.output) {
      questions.push({
        type: 'input',
        name: 'output',
        message: 'Output vault path:',
        default: './vault',
      });
    }

    if (!this.options.template) {
      questions.push({
        type: 'list',
        name: 'template',
        message: 'Select template:',
        choices: [
          { name: 'TypeScript Application', value: 'typescript-app' },
          { name: 'Next.js Application', value: 'nextjs-app' },
          { name: 'Python Application', value: 'python-app' },
          { name: 'Monorepo', value: 'monorepo' },
          { name: 'Generic', value: 'generic' },
        ],
      });
    }

    const answers = await inquirer.prompt(questions);

    return {
      appPath: appPath || answers.appPath,
      outputPath: this.options.output || answers.output,
      template: this.options.template || answers.template,
      scanDepth: parseInt(this.options.scanDepth),
      includeTests: this.options.includeTests,
      claudeFlow: this.options.claudeFlow,
      dryRun: this.options.dryRun,
    };
  }

  private async execute(config: InitConfig): Promise<void> {
    const initializer = new VaultInitializer(config);

    // Phase 1: Scan
    const scanSpinner = ora('Scanning codebase...').start();
    const scanResult = await initializer.scan();
    scanSpinner.succeed(
      `Scanned ${scanResult.components.length} components, ` +
      `${scanResult.dependencies.length} dependencies`
    );

    // Phase 2: Generate
    const genSpinner = ora('Generating vault structure...').start();
    const vault = await initializer.generate(scanResult);
    genSpinner.succeed(`Generated ${vault.nodes.length} nodes`);

    if (config.dryRun) {
      console.log(chalk.yellow('\n📋 Dry run - no files written\n'));
      this.printSummary(vault);
      return;
    }

    // Phase 3: Write
    console.log(chalk.blue('\nWriting files...\n'));
    const progressBar = new cliProgress.SingleBar({
      format: 'Progress |' + chalk.cyan('{bar}') + '| {percentage}% | {value}/{total} files',
    }, cliProgress.Presets.shades_classic);

    progressBar.start(vault.nodes.length, 0);

    await initializer.finalize(vault, (progress) => {
      progressBar.update(progress);
    });

    progressBar.stop();

    console.log(chalk.green('\n✅ Vault initialized successfully!\n'));
    console.log(`Location: ${chalk.cyan(config.outputPath)}`);
  }
}
```

---

## Data Flow

### Complete Pipeline Flow

```typescript
// 1. CLI receives input
const config = {
  appPath: '/path/to/app',
  outputPath: './vault',
  template: 'nextjs-app',
  claudeFlow: true,
};

// 2. VaultInitializer orchestrates pipeline
const initializer = new VaultInitializer(config);

// 3. Code Scanner analyzes codebase
const scanner = new CodeScanner({ scanDepth: 3 });
const scanResult: CodeScanResult = await scanner.scan(config.appPath);
/*
{
  framework: 'nextjs',
  language: 'typescript',
  rootPath: '/path/to/app',
  dependencies: [{ name: 'next', version: '14.0.0', ... }],
  components: [{ type: 'function', name: 'HomePage', ... }],
  ...
}
*/

// 4. Template System selects template
const templateLoader = new TemplateLoader();
const template: Template = await templateLoader.selectTemplate(scanResult);

// 5. Documentation Extractor gets docs
const docExtractor = new DocumentationExtractor();
const docs: ExtractedDocs = await docExtractor.extract(config.appPath);

// 6. Knowledge Graph Generator builds vault structure
const graphGen = new KnowledgeGraphGenerator();
const vault: VaultStructure = graphGen.mapToVault(scanResult, template, docs);
/*
{
  nodes: [
    {
      path: 'technical/next.md',
      frontmatter: { title: 'Next.js', type: 'technical', ... },
      content: '# Next.js\n\n...',
      links: ['[[React]]', '[[TypeScript]]'],
    },
    ...
  ],
  relationships: [
    { from: 'features/home-page.md', to: 'technical/next.md', type: 'uses' },
  ],
}
*/

// 7. AI Generator enriches content (optional)
if (config.claudeFlow) {
  const aiGen = new AIContentGenerator(mcpClient, cache);
  for (const node of vault.nodes) {
    if (node.frontmatter.type === 'concept') {
      node.content = await aiGen.generateConceptDescription(
        node.frontmatter.title,
        scanResult
      );
    }
  }
}

// 8. Vault Finalizer writes everything
const finalizer = new VaultFinalizer();
await finalizer.finalize(config.outputPath, vault);
/*
Writes:
- vault/concepts/authentication.md
- vault/technical/next.md
- vault/features/home-page.md
- vault/.weaver/shadow-cache.db
- vault/.git/
- vault/README.md
- vault/concept-map.md
*/
```

---

## Implementation Roadmap

### Week 1: Foundation (Days 1-5)

#### Day 1: Project Setup
- [ ] Create module structure: `/src/vault-init/`
- [ ] Install dependencies (commander, babel, handlebars, etc.)
- [ ] Setup TypeScript configs
- [ ] Create base interfaces and types
- [ ] Write unit test scaffolding

**Deliverables**:
- Empty module structure
- Dependencies installed
- Types defined

#### Day 2: Code Scanner - Framework Detection
- [ ] Implement `FrameworkDetector` interface
- [ ] Create detectors: NextJs, Django, FastAPI, Flask, Express, React, Generic
- [ ] Unit tests for each detector (50+ test cases)
- [ ] Integration test with real projects

**Deliverables**:
- Framework detection working with 95%+ accuracy
- 50+ unit tests passing

#### Day 3: Code Scanner - File Scanning
- [ ] Implement `scanStructure()` with fast-glob
- [ ] Add ignore patterns and depth limiting
- [ ] Build directory tree representation
- [ ] Performance testing (500 files in < 10s)

**Deliverables**:
- Directory scanning functional
- Performance targets met

#### Day 4: Code Scanner - Component Extraction
- [ ] Implement `TypeScriptExtractor` with Babel
- [ ] Implement `PythonExtractor` with subprocess
- [ ] Extract imports/exports, functions, classes
- [ ] Unit tests for extraction

**Deliverables**:
- Component extraction working for TS and Python
- Unit tests passing

#### Day 5: Code Scanner - Dependency Parsing
- [ ] Parse package.json, requirements.txt
- [ ] Parse config files (tsconfig, jest, next, etc.)
- [ ] Categorize dependencies
- [ ] Integration test: full code scan

**Deliverables**:
- Dependency parsing functional
- Full `CodeScanner` module complete
- Integration tests passing

---

### Week 2: Templates & Graph Generation (Days 6-10)

#### Day 6: Template System - Schema & Loader
- [ ] Define Zod schema for templates
- [ ] Create 5 template YAML files
- [ ] Implement `TemplateLoader` with validation
- [ ] Template caching

**Deliverables**:
- 5 templates defined and validated
- Template loader functional

#### Day 7: Template System - Handlebars Integration
- [ ] Integrate Handlebars
- [ ] Create template files (`.hbs`)
- [ ] Register custom helpers (wikilink, formatDate)
- [ ] Variable extraction from `CodeScanResult`

**Deliverables**:
- Handlebars rendering functional
- Template files created

#### Day 8: Documentation Extractor
- [ ] Implement `ReadmeParser`
- [ ] Implement `CommentExtractor` (JSDoc + docstrings)
- [ ] OpenAPI/Swagger detection
- [ ] Integration tests

**Deliverables**:
- Documentation extraction complete
- Integration tests passing

#### Day 9: Knowledge Graph Generator
- [ ] Implement `TaxonomyMapper`
- [ ] Create node generators (concept, technical, feature, component)
- [ ] Implement `WikilinkBuilder`
- [ ] Implement `MermaidGenerator`

**Deliverables**:
- Graph generation functional
- Wikilinks and Mermaid diagrams working

#### Day 10: Graph Generator - Testing
- [ ] Unit tests for all node types
- [ ] Integration test: scan → graph
- [ ] Validate frontmatter YAML
- [ ] Test graph completeness (all nodes have links)

**Deliverables**:
- Graph generator fully tested
- 85%+ test coverage

---

### Week 3: AI & Finalization (Days 11-15)

#### Day 11: AI Content Generator - Setup
- [ ] Implement `AIContentGenerator`
- [ ] Claude-Flow MCP integration
- [ ] Content cache (SQLite)
- [ ] Offline mode fallback

**Deliverables**:
- AI generator structure complete
- MCP integration working

#### Day 12: AI Content Generator - Prompts
- [ ] Create prompts for concepts, technical, features
- [ ] Test content generation (manual review)
- [ ] Implement caching logic
- [ ] Performance testing (50 nodes in < 30s)

**Deliverables**:
- AI content generation functional
- Content quality validated

#### Day 13: Vault Finalizer - File Writing
- [ ] Implement `writeMarkdownFiles()`
- [ ] Frontmatter formatting
- [ ] Atomic writes with rollback
- [ ] Directory creation

**Deliverables**:
- File writing functional
- Rollback working

#### Day 14: Vault Finalizer - Shadow Cache & Git
- [ ] Implement `populateShadowCache()`
- [ ] Implement `initializeGit()`
- [ ] Generate README and concept map
- [ ] E2E test: full vault generation

**Deliverables**:
- Vault finalizer complete
- E2E test passing

#### Day 15: CLI Tool
- [ ] Implement CLI with Commander
- [ ] Interactive prompts with Inquirer
- [ ] Progress reporting (ora + cli-progress)
- [ ] Dry-run mode
- [ ] Error handling

**Deliverables**:
- CLI functional
- UX tested

---

### Week 4: Testing & Documentation (Days 16-20)

#### Day 16: Integration Testing
- [ ] E2E tests for all 5 templates
- [ ] Test with real projects (TypeScript, Next.js, Python)
- [ ] Performance benchmarking
- [ ] Error recovery testing

**Deliverables**:
- E2E tests passing
- Performance benchmarks met

#### Day 17: Unit Test Coverage
- [ ] Increase coverage to 80%+
- [ ] Edge case testing
- [ ] Mock Claude-Flow for tests
- [ ] CI/CD integration

**Deliverables**:
- 80%+ test coverage
- CI/CD passing

#### Day 18: Documentation - User Guide
- [ ] Write user guide with examples
- [ ] CLI usage documentation
- [ ] Template selection guide
- [ ] Troubleshooting section

**Deliverables**:
- User guide complete

#### Day 19: Documentation - Developer Guide
- [ ] Architecture overview
- [ ] Adding new templates guide
- [ ] Extending code scanner guide
- [ ] API reference

**Deliverables**:
- Developer guide complete

#### Day 20: Example Vaults & Polish
- [ ] Generate 5 example vaults
- [ ] Take screenshots
- [ ] Create comparison guide
- [ ] Final testing and bug fixes

**Deliverables**:
- 5 example vaults
- Documentation polished
- Ready for release

---

## Technical Decisions

### 1. Why Babel for TypeScript/JavaScript Parsing?

**Decision**: Use `@babel/parser` and `@babel/traverse` for AST parsing.

**Rationale**:
- **Mature**: Battle-tested, handles edge cases
- **Fast**: Optimized for large codebases
- **Plugin Support**: Supports TypeScript, JSX, and modern JS features
- **AST Traversal**: `@babel/traverse` provides convenient traversal API

**Alternatives Considered**:
- TypeScript Compiler API: Too heavyweight, slower
- Acorn: Less TypeScript support

### 2. Why Subprocess for Python Parsing?

**Decision**: Use subprocess to run Python AST parser.

**Rationale**:
- **Native**: Python's `ast` module is the standard way to parse Python
- **Accurate**: No third-party parser needed
- **Simple**: Just JSON serialization between processes

**Alternatives Considered**:
- Node.js Python parser: None that are production-ready
- Tree-sitter: Overkill for this use case

### 3. Why Handlebars for Templates?

**Decision**: Use Handlebars for template rendering.

**Rationale**:
- **Logic-less**: Enforces separation of data and presentation
- **Simple**: Easy to write templates
- **Helpers**: Custom helpers for wikilinks, dates, etc.

**Alternatives Considered**:
- Mustache: Less features
- EJS: Too much logic in templates

### 4. Why YAML for Template Schema?

**Decision**: Use YAML for template definitions.

**Rationale**:
- **Human-readable**: Easy to edit
- **Comments**: Support for inline documentation
- **Standard**: Widely used for config files

**Alternatives Considered**:
- JSON: No comments, less readable
- TOML: Less familiar to developers

### 5. Why SQLite for Content Cache?

**Decision**: Use SQLite for AI-generated content caching.

**Rationale**:
- **Embedded**: No separate database server needed
- **Fast**: Efficient for key-value lookups
- **TTL**: Easy to implement expiration
- **Already Used**: Weaver uses SQLite for shadow cache

**Alternatives Considered**:
- File-based cache: Slower, harder to query
- Redis: Overkill, requires separate server

### 6. Why Linear Pipeline Architecture?

**Decision**: Use linear pipeline with 6 sequential phases.

**Rationale**:
- **Simple**: Easy to understand and debug
- **Resumable**: Can restart from any phase
- **Testable**: Each phase can be tested independently

**Alternatives Considered**:
- Event-driven: Too complex for this use case
- Parallel: Dependencies between phases make parallel difficult

---

## Testing Strategy

### Unit Tests (Target: 85% coverage)

**Module**: Code Scanner
- Framework detection (50+ test cases, one per framework × real projects)
- Directory scanning (various depths, ignore patterns)
- Component extraction (TS/JS/Python files)
- Dependency parsing (package.json, requirements.txt)

**Module**: Template System
- Template loading and validation
- Handlebars rendering
- Variable substitution
- Conditional sections

**Module**: Documentation Extractor
- README parsing
- JSDoc/docstring extraction
- OpenAPI detection

**Module**: Graph Generator
- Taxonomy mapping
- Node generation
- Wikilink building
- Mermaid generation

**Module**: AI Generator
- Content caching
- Offline fallback
- Mock Claude-Flow calls

**Module**: Vault Finalizer
- File writing
- Shadow cache population
- Git initialization
- Rollback

### Integration Tests

**Test 1**: Full Pipeline (TypeScript App)
- Input: Real TypeScript project
- Expected: Valid vault with 20+ nodes, shadow cache populated, Git initialized

**Test 2**: Full Pipeline (Next.js App)
- Input: Real Next.js project
- Expected: Next.js template applied, components extracted

**Test 3**: Full Pipeline (Python App)
- Input: Real Python project
- Expected: Python template applied, modules extracted

**Test 4**: Offline Mode
- Input: Any project
- Disable Claude-Flow
- Expected: Basic vault generated without AI content

**Test 5**: Error Recovery
- Simulate write errors
- Expected: Rollback successful, no partial vault

### E2E Tests

**Test 1**: CLI Interactive Mode
- Run `weaver init` without args
- Verify prompts work
- Verify vault generated

**Test 2**: CLI with Options
- Run `weaver init /app --output /vault --template nextjs-app`
- Verify options respected

**Test 3**: Dry Run
- Run with `--dry-run`
- Verify no files written
- Verify summary printed

### Performance Tests

**Benchmark 1**: Small App (50 files)
- Expected: < 30 seconds total

**Benchmark 2**: Medium App (500 files)
- Expected: 1-3 minutes total

**Benchmark 3**: Large App (1000 files)
- Expected: 3-10 minutes total

**Benchmark 4**: Memory Usage
- Monitor peak memory during large app scan
- Expected: < 200 MB

---

## Deployment Plan

### Pre-Deployment Checklist

- [ ] All unit tests passing (85%+ coverage)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Performance benchmarks met
- [ ] TypeScript strict mode (0 errors)
- [ ] Linting (0 errors)
- [ ] User guide complete
- [ ] Developer guide complete
- [ ] 5 example vaults generated

### Deployment Steps

1. **Merge to main branch**
   ```bash
   git checkout -b phase-6-vault-init
   git add .
   git commit -m "feat(phase-6): Implement vault initialization system"
   git push origin phase-6-vault-init
   # Create PR, review, merge
   ```

2. **Version bump**
   ```bash
   npm version minor  # 0.5.0 → 0.6.0
   ```

3. **Build**
   ```bash
   bun run build
   bun run typecheck
   bun run lint
   ```

4. **Test installation**
   ```bash
   bun link
   cd /tmp/test-project
   weaver init
   ```

5. **Documentation deployment**
   - Update README.md with new CLI command
   - Add user guide to `/docs/vault-initialization-guide.md`
   - Add developer guide to `/docs/vault-init-development.md`

6. **Announce**
   - GitHub release notes
   - Update project docs
   - Notify users

---

## Risk Mitigation

### Risk 1: Framework Detection < 95% Accuracy

**Mitigation**:
- Extensive testing with 50+ real projects
- Fallback to "Generic" template
- Allow manual template override via CLI flag

**Contingency**:
- If detection fails, user can specify `--template` explicitly

### Risk 2: AST Parsing Failures

**Mitigation**:
- Graceful error handling (log warning, continue)
- Skip files that fail to parse
- Provide summary of skipped files

**Contingency**:
- Manual review of skipped files
- Report parsing errors for future fixes

### Risk 3: Performance Targets Not Met

**Mitigation**:
- Profile code with `bun:test --prof`
- Optimize hot paths (file I/O, AST parsing)
- Add configurable scan depth to limit scope

**Contingency**:
- Increase time targets (e.g., 5min for medium apps)
- Add progress reporting to improve perceived performance

### Risk 4: Shadow Cache Integration Issues

**Mitigation**:
- Use existing shadow cache schema
- Transaction-based writes
- Rollback on error

**Contingency**:
- If shadow cache fails, vault still usable (just no search)
- Provide manual shadow cache rebuild tool

---

## Next Steps After Planning

1. ✅ Constitution refined
2. ✅ Specification elaborated
3. ✅ Implementation plan created
4. ⏭️ **Break down into tasks** with `/speckit.tasks`
5. ⏭️ Begin implementation with `/speckit.implement`

---

**Generated**: 2025-10-24T02:50:00.000Z
**Status**: Implementation plan complete and ready for task breakdown
**Estimated Duration**: 15-20 days (4 weeks)
**Confidence Level**: 90% (well-researched, clear architecture)
