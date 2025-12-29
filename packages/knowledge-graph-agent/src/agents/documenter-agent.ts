/**
 * Documenter Agent
 *
 * Specialized agent for documentation generation, including API docs,
 * user guides, architecture documentation, and changelog generation.
 * Extends BaseAgent with documentation-specific capabilities.
 *
 * @module agents/documenter-agent
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseAgent } from './base-agent.js';
import {
  AgentType,
  type AgentTask,
  type AgentResult,
  type AgentConfig,
  type ResultArtifact,
} from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Documenter agent configuration
 */
export interface DocumenterAgentConfig extends AgentConfig {
  type: AgentType.DOCUMENTER;
  /** Default documentation format */
  defaultFormat?: 'markdown' | 'openapi' | 'typedoc';
  /** Template directory for documentation */
  templateDir?: string;
  /** Git repository path for changelog generation */
  gitPath?: string;
}

/**
 * Documentation output format
 */
export type DocumentationFormat = 'markdown' | 'openapi' | 'typedoc';

/**
 * Documentation result
 */
export interface DocumentationResult {
  /** Output format */
  format: DocumentationFormat;
  /** Generated content */
  content: string;
  /** Generated files */
  files: Array<{ path: string; content: string }>;
  /** Coverage metrics */
  coverage: {
    /** Number of documented items */
    documented: number;
    /** Total items */
    total: number;
    /** Coverage percentage */
    percentage: number;
  };
}

/**
 * User guide result
 */
export interface UserGuideResult {
  /** Guide title */
  title: string;
  /** Guide sections */
  sections: Array<{
    heading: string;
    content: string;
    examples?: string[];
  }>;
  /** Table of contents */
  toc: string;
}

/**
 * System information for architecture documentation
 */
export interface SystemInfo {
  /** System name */
  name: string;
  /** System description */
  description?: string;
  /** Source directories to analyze */
  sourceDirs: string[];
  /** Entry points */
  entryPoints?: string[];
  /** Architecture pattern (e.g., 'layered', 'microservices', 'monolith') */
  pattern?: string;
}

/**
 * Architecture documentation result
 */
export interface ArchitectureDocResult {
  /** Architecture overview */
  overview: string;
  /** Generated diagrams */
  diagrams: Array<{
    type: 'component' | 'sequence' | 'class' | 'deployment';
    content: string; // Mermaid or PlantUML
  }>;
  /** Component descriptions */
  components: Array<{
    name: string;
    description: string;
    dependencies: string[];
    apis: string[];
  }>;
}

/**
 * Changelog result
 */
export interface ChangelogResult {
  /** Version string */
  version: string;
  /** Release date */
  date: string;
  /** Changelog sections */
  sections: {
    added: string[];
    changed: string[];
    deprecated: string[];
    removed: string[];
    fixed: string[];
    security: string[];
  };
  /** Rendered markdown */
  markdown: string;
}

/**
 * Parsed JSDoc/TSDoc comment
 */
export interface ParsedDocComment {
  /** Description */
  description: string;
  /** Parameter docs */
  params: Array<{ name: string; type?: string; description: string }>;
  /** Return documentation */
  returns?: { type?: string; description: string };
  /** Example code */
  examples: string[];
  /** Tags (deprecated, throws, etc.) */
  tags: Record<string, string>;
}

/**
 * Documented item from source
 */
export interface DocumentedItem {
  /** Item name */
  name: string;
  /** Item kind */
  kind: 'class' | 'function' | 'interface' | 'type' | 'variable' | 'method' | 'property';
  /** File path */
  file: string;
  /** Line number */
  line: number;
  /** Documentation comment */
  doc?: ParsedDocComment;
  /** Whether exported */
  exported: boolean;
  /** Signature */
  signature?: string;
}

/**
 * Git commit for changelog
 */
export interface GitCommit {
  /** Commit hash */
  hash: string;
  /** Commit message */
  message: string;
  /** Commit author */
  author: string;
  /** Commit date */
  date: Date;
  /** Conventional commit type */
  type?: string;
  /** Conventional commit scope */
  scope?: string;
  /** Whether breaking change */
  breaking?: boolean;
}

/**
 * Documenter task type
 */
export type DocumenterTaskType =
  | 'api_docs'
  | 'user_guide'
  | 'architecture'
  | 'changelog'
  | 'format';

// ============================================================================
// Documenter Agent
// ============================================================================

/**
 * Documenter Agent
 *
 * Capabilities:
 * - API documentation generation (markdown, OpenAPI, TypeDoc)
 * - User guide creation with examples
 * - Architecture documentation with diagrams
 * - Changelog generation from git commits
 * - Documentation formatting and linting
 *
 * @example
 * ```typescript
 * const documenter = new DocumenterAgent({
 *   name: 'documenter-agent',
 *   type: AgentType.DOCUMENTER,
 * });
 *
 * const result = await documenter.execute({
 *   id: 'task-1',
 *   description: 'Generate API documentation',
 *   priority: TaskPriority.MEDIUM,
 *   input: {
 *     parameters: { taskType: 'api_docs' },
 *     data: {
 *       files: ['src/index.ts'],
 *       format: 'markdown'
 *     }
 *   },
 *   createdAt: new Date()
 * });
 * ```
 */
export class DocumenterAgent extends BaseAgent {
  /** Agent type identifier */
  readonly type = AgentType.DOCUMENTER;

  /** Agent capabilities */
  readonly capabilities = [
    'api_docs',
    'user_guides',
    'architecture_docs',
    'changelog_generation',
    'format',
  ];

  /** File patterns for TypeScript/JavaScript */
  private readonly codePatterns = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs'];

  /** Conventional commit types */
  private readonly commitTypes: Record<string, keyof ChangelogResult['sections']> = {
    feat: 'added',
    fix: 'fixed',
    docs: 'changed',
    style: 'changed',
    refactor: 'changed',
    perf: 'changed',
    test: 'changed',
    chore: 'changed',
    revert: 'removed',
    security: 'security',
    deprecate: 'deprecated',
  };

  constructor(config: Partial<DocumenterAgentConfig> & { name: string }) {
    super({
      type: AgentType.DOCUMENTER,
      taskTimeout: 300000, // 5 minutes for large codebases
      capabilities: [
        'api_docs',
        'user_guides',
        'architecture_docs',
        'changelog_generation',
        'format',
      ],
      ...config,
    });
  }

  // ==========================================================================
  // Task Execution
  // ==========================================================================

  /**
   * Execute documenter task
   */
  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = new Date();
    const taskType =
      (task.input?.parameters?.taskType as DocumenterTaskType) || 'api_docs';

    switch (taskType) {
      case 'api_docs':
        return this.handleApiDocsTask(task, startTime);
      case 'user_guide':
        return this.handleUserGuideTask(task, startTime);
      case 'architecture':
        return this.handleArchitectureTask(task, startTime);
      case 'changelog':
        return this.handleChangelogTask(task, startTime);
      case 'format':
        return this.handleFormatTask(task, startTime);
      default:
        return this.createErrorResult(
          'INVALID_TASK_TYPE',
          `Unknown task type: ${taskType}`,
          startTime
        );
    }
  }

  // ==========================================================================
  // Public Methods
  // ==========================================================================

  /**
   * Generate API documentation from source files
   */
  async generateApiDocs(
    files: string[],
    format: DocumentationFormat = 'markdown'
  ): Promise<DocumentationResult> {
    this.logger.info('Generating API documentation', { fileCount: files.length, format });

    const documentedItems: DocumentedItem[] = [];
    const outputFiles: Array<{ path: string; content: string }> = [];

    // Parse source files
    for (const file of files) {
      try {
        const items = await this.parseSourceFile(file);
        documentedItems.push(...items);
      } catch (error) {
        this.logger.warn(`Failed to parse file: ${file}`, { error });
      }
    }

    // Generate documentation based on format
    let content: string;
    switch (format) {
      case 'markdown':
        content = this.generateMarkdownDocs(documentedItems);
        outputFiles.push({ path: 'API.md', content });
        break;
      case 'openapi':
        content = this.generateOpenApiDocs(documentedItems);
        outputFiles.push({ path: 'openapi.yaml', content });
        break;
      case 'typedoc':
        content = this.generateTypeDocConfig(documentedItems, files);
        outputFiles.push({ path: 'typedoc.json', content });
        break;
      default:
        content = this.generateMarkdownDocs(documentedItems);
        outputFiles.push({ path: 'API.md', content });
    }

    // Calculate coverage
    const documented = documentedItems.filter(item => item.doc?.description).length;
    const total = documentedItems.length;

    return {
      format,
      content,
      files: outputFiles,
      coverage: {
        documented,
        total,
        percentage: total > 0 ? Math.round((documented / total) * 100) : 0,
      },
    };
  }

  /**
   * Create user guide for a feature
   */
  async createUserGuide(feature: string, codebase: string[]): Promise<UserGuideResult> {
    this.logger.info('Creating user guide', { feature, fileCount: codebase.length });

    const sections: UserGuideResult['sections'] = [];

    // Analyze codebase to find relevant patterns and examples
    const relevantItems = await this.findRelevantItems(feature, codebase);
    const examples = await this.extractExamples(feature, codebase);

    // Generate introduction section
    sections.push({
      heading: 'Introduction',
      content: this.generateIntroduction(feature, relevantItems),
    });

    // Generate getting started section
    sections.push({
      heading: 'Getting Started',
      content: this.generateGettingStarted(feature, relevantItems),
      examples: examples.slice(0, 2),
    });

    // Generate usage section
    sections.push({
      heading: 'Usage',
      content: this.generateUsageGuide(feature, relevantItems),
      examples: examples.slice(2, 5),
    });

    // Generate API reference section
    if (relevantItems.length > 0) {
      sections.push({
        heading: 'API Reference',
        content: this.generateApiReference(relevantItems),
      });
    }

    // Generate examples section if we have more
    if (examples.length > 5) {
      sections.push({
        heading: 'Examples',
        content: 'Additional code examples:',
        examples: examples.slice(5),
      });
    }

    // Generate table of contents
    const toc = this.generateTableOfContents(sections);

    return {
      title: this.formatFeatureTitle(feature),
      sections,
      toc,
    };
  }

  /**
   * Document system architecture
   */
  async documentArchitecture(system: SystemInfo): Promise<ArchitectureDocResult> {
    this.logger.info('Documenting architecture', { system: system.name });

    const components: ArchitectureDocResult['components'] = [];
    const diagrams: ArchitectureDocResult['diagrams'] = [];

    // Analyze source directories
    for (const dir of system.sourceDirs) {
      try {
        const dirComponents = await this.analyzeDirectory(dir);
        components.push(...dirComponents);
      } catch (error) {
        this.logger.warn(`Failed to analyze directory: ${dir}`, { error });
      }
    }

    // Generate overview
    const overview = this.generateArchitectureOverview(system, components);

    // Generate component diagram
    diagrams.push({
      type: 'component',
      content: this.generateComponentDiagram(components),
    });

    // Generate class diagram for main components
    if (components.length > 0) {
      diagrams.push({
        type: 'class',
        content: this.generateClassDiagram(components),
      });
    }

    // Generate deployment diagram if pattern suggests it
    if (system.pattern === 'microservices' || system.pattern === 'distributed') {
      diagrams.push({
        type: 'deployment',
        content: this.generateDeploymentDiagram(system, components),
      });
    }

    return {
      overview,
      diagrams,
      components,
    };
  }

  /**
   * Generate changelog from git commits
   */
  async generateChangelog(fromTag: string, toTag: string): Promise<ChangelogResult> {
    this.logger.info('Generating changelog', { fromTag, toTag });

    // Parse commits between tags
    const commits = await this.getCommitsBetweenTags(fromTag, toTag);

    // Categorize commits
    const sections: ChangelogResult['sections'] = {
      added: [],
      changed: [],
      deprecated: [],
      removed: [],
      fixed: [],
      security: [],
    };

    for (const commit of commits) {
      const { type, scope, breaking } = this.parseConventionalCommit(commit.message);
      const category = this.commitTypes[type || 'chore'] || 'changed';

      let entry = commit.message;
      if (scope) {
        entry = `**${scope}**: ${commit.message.replace(/^\w+(\([^)]+\))?:\s*/, '')}`;
      } else {
        entry = commit.message.replace(/^\w+:\s*/, '');
      }

      if (breaking) {
        entry = `**BREAKING**: ${entry}`;
      }

      sections[category].push(entry);
    }

    // Generate version from toTag
    const version = toTag.replace(/^v/, '');
    const date = new Date().toISOString().split('T')[0];

    // Generate markdown
    const markdown = this.generateChangelogMarkdown(version, date, sections);

    return {
      version,
      date,
      sections,
      markdown,
    };
  }

  /**
   * Format documentation content
   */
  async formatDocumentation(content: string, style: string = 'default'): Promise<string> {
    this.logger.debug('Formatting documentation', { style, contentLength: content.length });

    let formatted = content;

    // Apply style-specific formatting
    switch (style) {
      case 'github':
        formatted = this.formatGitHubMarkdown(formatted);
        break;
      case 'docusaurus':
        formatted = this.formatDocusaurusMarkdown(formatted);
        break;
      case 'obsidian':
        formatted = this.formatObsidianMarkdown(formatted);
        break;
      default:
        formatted = this.formatDefaultMarkdown(formatted);
    }

    // Common fixes
    formatted = this.fixMarkdownIssues(formatted);
    formatted = this.ensureConsistentHeaders(formatted);
    formatted = this.formatCodeBlocks(formatted);

    return formatted;
  }

  // ==========================================================================
  // Private Task Handlers
  // ==========================================================================

  private async handleApiDocsTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<DocumentationResult>> {
    const input = task.input?.data as
      | { files: string[]; format?: DocumentationFormat }
      | undefined;

    if (!input?.files || input.files.length === 0) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Files array is required for API documentation',
        startTime
      ) as AgentResult<DocumentationResult>;
    }

    try {
      const result = await this.generateApiDocs(input.files, input.format);
      const artifacts: ResultArtifact[] = result.files.map(f => ({
        type: 'file' as const,
        name: f.path,
        content: f.content,
        mimeType: f.path.endsWith('.yaml') ? 'text/yaml' : 'text/markdown',
      }));

      return this.createSuccessResult(result, startTime, artifacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'API_DOCS_ERROR',
        `API documentation generation failed: ${message}`,
        startTime
      ) as AgentResult<DocumentationResult>;
    }
  }

  private async handleUserGuideTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<UserGuideResult>> {
    const input = task.input?.data as
      | { feature: string; codebase: string[] }
      | undefined;

    if (!input?.feature) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Feature name is required for user guide',
        startTime
      ) as AgentResult<UserGuideResult>;
    }

    try {
      const result = await this.createUserGuide(input.feature, input.codebase || []);
      const markdown = this.renderUserGuide(result);
      const artifacts: ResultArtifact[] = [
        {
          type: 'file',
          name: `${this.toKebabCase(result.title)}.md`,
          content: markdown,
          mimeType: 'text/markdown',
        },
      ];

      return this.createSuccessResult(result, startTime, artifacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'USER_GUIDE_ERROR',
        `User guide creation failed: ${message}`,
        startTime
      ) as AgentResult<UserGuideResult>;
    }
  }

  private async handleArchitectureTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<ArchitectureDocResult>> {
    const input = task.input?.data as SystemInfo | undefined;

    if (!input?.name || !input?.sourceDirs) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'System name and source directories are required',
        startTime
      ) as AgentResult<ArchitectureDocResult>;
    }

    try {
      const result = await this.documentArchitecture(input);
      const markdown = this.renderArchitectureDoc(result);
      const artifacts: ResultArtifact[] = [
        {
          type: 'file',
          name: 'ARCHITECTURE.md',
          content: markdown,
          mimeType: 'text/markdown',
        },
      ];

      return this.createSuccessResult(result, startTime, artifacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'ARCHITECTURE_ERROR',
        `Architecture documentation failed: ${message}`,
        startTime
      ) as AgentResult<ArchitectureDocResult>;
    }
  }

  private async handleChangelogTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<ChangelogResult>> {
    const input = task.input?.data as
      | { fromTag: string; toTag: string }
      | undefined;

    if (!input?.fromTag || !input?.toTag) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Both fromTag and toTag are required',
        startTime
      ) as AgentResult<ChangelogResult>;
    }

    try {
      const result = await this.generateChangelog(input.fromTag, input.toTag);
      const artifacts: ResultArtifact[] = [
        {
          type: 'file',
          name: 'CHANGELOG.md',
          content: result.markdown,
          mimeType: 'text/markdown',
        },
      ];

      return this.createSuccessResult(result, startTime, artifacts);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'CHANGELOG_ERROR',
        `Changelog generation failed: ${message}`,
        startTime
      ) as AgentResult<ChangelogResult>;
    }
  }

  private async handleFormatTask(
    task: AgentTask,
    startTime: Date
  ): Promise<AgentResult<string>> {
    const input = task.input?.data as
      | { content: string; style?: string }
      | undefined;

    if (!input?.content) {
      return this.createErrorResult(
        'VALIDATION_ERROR',
        'Content is required for formatting',
        startTime
      ) as AgentResult<string>;
    }

    try {
      const result = await this.formatDocumentation(input.content, input.style);
      return this.createSuccessResult(result, startTime);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResult(
        'FORMAT_ERROR',
        `Documentation formatting failed: ${message}`,
        startTime
      ) as AgentResult<string>;
    }
  }

  // ==========================================================================
  // Source Parsing Methods
  // ==========================================================================

  private async parseSourceFile(filePath: string): Promise<DocumentedItem[]> {
    const items: DocumentedItem[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Parse exports
      const exportMatches = content.matchAll(
        /export\s+(async\s+)?(function|class|interface|type|const|let|var)\s+(\w+)/g
      );

      for (const match of exportMatches) {
        const rawKind = match[2]; // 'function' | 'class' | 'interface' | 'type' | 'const' | 'let' | 'var'
        const name = match[3];
        const line = content.slice(0, match.index).split('\n').length;

        // Map raw kind to DocumentedItem['kind']
        const kind: DocumentedItem['kind'] =
          rawKind === 'const' || rawKind === 'let' || rawKind === 'var'
            ? 'variable'
            : (rawKind as DocumentedItem['kind']);

        // Look for JSDoc comment before the export
        const doc = this.findDocComment(lines, line - 1);

        // Get signature
        const signature = this.extractSignature(content, match.index!, rawKind);

        items.push({
          name,
          kind,
          file: filePath,
          line,
          doc,
          exported: true,
          signature,
        });
      }

      // Parse class members
      const classMatches = content.matchAll(/class\s+(\w+)[^{]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs);
      for (const classMatch of classMatches) {
        const className = classMatch[1];
        const classBody = classMatch[2];

        // Parse methods
        const methodMatches = classBody.matchAll(
          /(async\s+)?(\w+)\s*\([^)]*\)[^{]*\{/g
        );

        for (const methodMatch of methodMatches) {
          const methodName = methodMatch[2];
          if (methodName === 'constructor') continue;

          const methodLine =
            content.slice(0, classMatch.index! + classMatch[0].indexOf(methodMatch[0])).split('\n')
              .length;

          items.push({
            name: `${className}.${methodName}`,
            kind: 'method',
            file: filePath,
            line: methodLine,
            doc: undefined,
            exported: false,
            signature: methodMatch[0].trim(),
          });
        }
      }
    } catch (error) {
      this.logger.warn(`Error parsing source file: ${filePath}`, { error });
    }

    return items;
  }

  private findDocComment(lines: string[], beforeLine: number): ParsedDocComment | undefined {
    // Look backwards for JSDoc comment
    let endIndex = beforeLine - 1;
    while (endIndex >= 0 && lines[endIndex].trim() === '') {
      endIndex--;
    }

    if (endIndex < 0 || !lines[endIndex].trim().endsWith('*/')) {
      return undefined;
    }

    // Find start of comment
    let startIndex = endIndex;
    while (startIndex >= 0 && !lines[startIndex].includes('/**')) {
      startIndex--;
    }

    if (startIndex < 0) {
      return undefined;
    }

    const commentLines = lines.slice(startIndex, endIndex + 1);
    return this.parseDocComment(commentLines.join('\n'));
  }

  private parseDocComment(comment: string): ParsedDocComment {
    const result: ParsedDocComment = {
      description: '',
      params: [],
      returns: undefined,
      examples: [],
      tags: {},
    };

    // Remove comment markers
    const cleaned = comment
      .replace(/^\/\*\*\s*/m, '')
      .replace(/\s*\*\/$/m, '')
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, ''))
      .join('\n');

    // Parse description (text before first @tag)
    const descMatch = cleaned.match(/^([^@]*)/);
    if (descMatch) {
      result.description = descMatch[1].trim();
    }

    // Parse @param tags
    const paramMatches = cleaned.matchAll(/@param\s+(?:\{([^}]+)\}\s+)?(\w+)\s*-?\s*(.+)/g);
    for (const match of paramMatches) {
      result.params.push({
        type: match[1],
        name: match[2],
        description: match[3].trim(),
      });
    }

    // Parse @returns tag
    const returnsMatch = cleaned.match(/@returns?\s+(?:\{([^}]+)\}\s+)?(.+)/);
    if (returnsMatch) {
      result.returns = {
        type: returnsMatch[1],
        description: returnsMatch[2].trim(),
      };
    }

    // Parse @example tags
    const exampleMatches = cleaned.matchAll(/@example\s*\n```[\w]*\n([\s\S]*?)```/g);
    for (const match of exampleMatches) {
      result.examples.push(match[1].trim());
    }

    // Parse other tags
    const tagMatches = cleaned.matchAll(/@(\w+)\s+(.+)/g);
    for (const match of tagMatches) {
      const tagName = match[1];
      if (!['param', 'returns', 'return', 'example'].includes(tagName)) {
        result.tags[tagName] = match[2].trim();
      }
    }

    return result;
  }

  private extractSignature(content: string, index: number, kind: string): string {
    const rest = content.slice(index);

    switch (kind) {
      case 'function': {
        const funcMatch = rest.match(/^export\s+(async\s+)?function\s+\w+[^{]+/);
        return funcMatch ? funcMatch[0].trim() : '';
      }
      case 'class': {
        const classMatch = rest.match(/^export\s+class\s+\w+[^{]*/);
        return classMatch ? classMatch[0].trim() : '';
      }
      case 'interface': {
        const ifaceMatch = rest.match(/^export\s+interface\s+\w+[^{]*/);
        return ifaceMatch ? ifaceMatch[0].trim() : '';
      }
      case 'type': {
        const typeMatch = rest.match(/^export\s+type\s+\w+[^=]*=[^;]+/);
        return typeMatch ? typeMatch[0].trim() : '';
      }
      default:
        return '';
    }
  }

  // ==========================================================================
  // Documentation Generation Methods
  // ==========================================================================

  private generateMarkdownDocs(items: DocumentedItem[]): string {
    const lines: string[] = ['# API Documentation', '', '## Table of Contents', ''];

    // Group by file
    const byFile = new Map<string, DocumentedItem[]>();
    for (const item of items) {
      if (!byFile.has(item.file)) {
        byFile.set(item.file, []);
      }
      byFile.get(item.file)!.push(item);
    }

    // Generate TOC
    for (const [file, fileItems] of byFile) {
      const fileName = path.basename(file);
      lines.push(`- [${fileName}](#${this.toKebabCase(fileName)})`);
      for (const item of fileItems) {
        lines.push(`  - [${item.name}](#${this.toKebabCase(item.name)})`);
      }
    }

    lines.push('', '---', '');

    // Generate documentation
    for (const [file, fileItems] of byFile) {
      const fileName = path.basename(file);
      lines.push(`## ${fileName}`, '');

      for (const item of fileItems) {
        lines.push(`### ${item.name}`, '');

        if (item.doc?.description) {
          lines.push(item.doc.description, '');
        }

        if (item.signature) {
          lines.push('```typescript', item.signature, '```', '');
        }

        if (item.doc?.params.length) {
          lines.push('**Parameters:**', '');
          for (const param of item.doc.params) {
            const type = param.type ? ` \`${param.type}\`` : '';
            lines.push(`- \`${param.name}\`${type}: ${param.description}`);
          }
          lines.push('');
        }

        if (item.doc?.returns) {
          const type = item.doc.returns.type ? ` \`${item.doc.returns.type}\`` : '';
          lines.push(`**Returns:**${type} ${item.doc.returns.description}`, '');
        }

        if (item.doc?.examples.length) {
          lines.push('**Examples:**', '');
          for (const example of item.doc.examples) {
            lines.push('```typescript', example, '```', '');
          }
        }

        lines.push('---', '');
      }
    }

    return lines.join('\n');
  }

  private generateOpenApiDocs(items: DocumentedItem[]): string {
    const spec: Record<string, unknown> = {
      openapi: '3.0.0',
      info: {
        title: 'API Documentation',
        version: '1.0.0',
      },
      paths: {},
      components: {
        schemas: {},
      },
    };

    // Convert interfaces/types to schemas
    const interfaces = items.filter(i => i.kind === 'interface' || i.kind === 'type');
    for (const iface of interfaces) {
      (spec.components as Record<string, Record<string, unknown>>).schemas[iface.name] = {
        type: 'object',
        description: iface.doc?.description || '',
      };
    }

    // Convert functions to paths (simplified)
    const functions = items.filter(i => i.kind === 'function');
    for (const func of functions) {
      (spec.paths as Record<string, unknown>)[`/${this.toKebabCase(func.name)}`] = {
        post: {
          summary: func.doc?.description || func.name,
          operationId: func.name,
          responses: {
            '200': {
              description: func.doc?.returns?.description || 'Success',
            },
          },
        },
      };
    }

    // Use JSON.stringify for YAML-like output (simplified)
    return `# OpenAPI Specification\n${JSON.stringify(spec, null, 2)}`;
  }

  private generateTypeDocConfig(items: DocumentedItem[], files: string[]): string {
    const config = {
      entryPoints: files,
      out: 'docs',
      plugin: ['typedoc-plugin-markdown'],
      excludePrivate: true,
      excludeProtected: false,
      includeVersion: true,
      readme: 'README.md',
    };

    return JSON.stringify(config, null, 2);
  }

  // ==========================================================================
  // User Guide Generation Methods
  // ==========================================================================

  private async findRelevantItems(
    feature: string,
    codebase: string[]
  ): Promise<DocumentedItem[]> {
    const items: DocumentedItem[] = [];
    const featureLower = feature.toLowerCase();

    for (const file of codebase) {
      try {
        const fileItems = await this.parseSourceFile(file);
        const relevant = fileItems.filter(
          item =>
            item.name.toLowerCase().includes(featureLower) ||
            item.doc?.description.toLowerCase().includes(featureLower)
        );
        items.push(...relevant);
      } catch {
        // Skip files that can't be parsed
      }
    }

    return items;
  }

  private async extractExamples(feature: string, codebase: string[]): Promise<string[]> {
    const examples: string[] = [];
    const featureLower = feature.toLowerCase();

    for (const file of codebase) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        // Find example blocks in JSDoc
        const exampleMatches = content.matchAll(/@example\s*\n```[\w]*\n([\s\S]*?)```/g);
        for (const match of exampleMatches) {
          if (match[1].toLowerCase().includes(featureLower)) {
            examples.push(match[1].trim());
          }
        }

        // Find test files with examples
        if (file.includes('.test.') || file.includes('.spec.')) {
          const testMatches = content.matchAll(/it\(['"`]([^'"]+)['"`]/g);
          for (const match of testMatches) {
            if (match[1].toLowerCase().includes(featureLower)) {
              // Extract test body as example
              const testStart = match.index! + match[0].length;
              const testBody = this.extractTestBody(content, testStart);
              if (testBody) {
                examples.push(testBody);
              }
            }
          }
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return examples.slice(0, 10); // Limit examples
  }

  private extractTestBody(content: string, startIndex: number): string | null {
    let braceCount = 0;
    let started = false;
    let bodyStart = -1;

    for (let i = startIndex; i < content.length; i++) {
      const char = content[i];
      if (char === '{') {
        if (!started) {
          started = true;
          bodyStart = i + 1;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (started && braceCount === 0) {
          return content.slice(bodyStart, i).trim();
        }
      }
    }

    return null;
  }

  private generateIntroduction(feature: string, items: DocumentedItem[]): string {
    const title = this.formatFeatureTitle(feature);
    const itemCount = items.length;

    return `${title} provides functionality for ${feature.toLowerCase()} in your application. ` +
      `This guide covers ${itemCount} main component${itemCount !== 1 ? 's' : ''} ` +
      `and explains how to integrate them effectively.`;
  }

  private generateGettingStarted(feature: string, items: DocumentedItem[]): string {
    const lines: string[] = [];

    lines.push(`To get started with ${feature}, follow these steps:`);
    lines.push('');
    lines.push('1. Import the required modules:');
    lines.push('```typescript');

    const exports = items.filter(i => i.exported).slice(0, 3);
    for (const item of exports) {
      lines.push(`import { ${item.name} } from './${path.basename(item.file, path.extname(item.file))}';`);
    }

    lines.push('```');
    lines.push('');
    lines.push('2. Initialize the component:');
    lines.push('```typescript');
    if (exports.length > 0) {
      const mainExport = exports[0];
      if (mainExport.kind === 'class') {
        lines.push(`const instance = new ${mainExport.name}();`);
      } else if (mainExport.kind === 'function') {
        lines.push(`const result = ${mainExport.name}();`);
      }
    } else {
      lines.push(`// Initialize ${feature}`);
    }
    lines.push('```');

    return lines.join('\n');
  }

  private generateUsageGuide(feature: string, items: DocumentedItem[]): string {
    const lines: string[] = [];

    for (const item of items.slice(0, 5)) {
      lines.push(`### ${item.name}`);
      lines.push('');
      if (item.doc?.description) {
        lines.push(item.doc.description);
        lines.push('');
      }
      if (item.signature) {
        lines.push('```typescript');
        lines.push(item.signature);
        lines.push('```');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  private generateApiReference(items: DocumentedItem[]): string {
    const lines: string[] = [];

    for (const item of items) {
      lines.push(`#### ${item.name}`);
      lines.push('');
      lines.push(`- **Kind:** ${item.kind}`);
      lines.push(`- **File:** ${item.file}`);
      if (item.doc?.description) {
        lines.push(`- **Description:** ${item.doc.description}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  private generateTableOfContents(sections: UserGuideResult['sections']): string {
    const lines = ['## Table of Contents', ''];

    for (const section of sections) {
      lines.push(`- [${section.heading}](#${this.toKebabCase(section.heading)})`);
    }

    return lines.join('\n');
  }

  private renderUserGuide(guide: UserGuideResult): string {
    const lines: string[] = [`# ${guide.title}`, '', guide.toc, ''];

    for (const section of guide.sections) {
      lines.push(`## ${section.heading}`, '', section.content, '');

      if (section.examples && section.examples.length > 0) {
        for (const example of section.examples) {
          lines.push('```typescript', example, '```', '');
        }
      }
    }

    return lines.join('\n');
  }

  // ==========================================================================
  // Architecture Documentation Methods
  // ==========================================================================

  private async analyzeDirectory(
    dir: string
  ): Promise<ArchitectureDocResult['components']> {
    const components: ArchitectureDocResult['components'] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const fullPath = path.join(dir, entry.name);
          const indexFile = path.join(fullPath, 'index.ts');

          try {
            const hasIndex = await fs.stat(indexFile).then(() => true).catch(() => false);

            if (hasIndex) {
              const content = await fs.readFile(indexFile, 'utf-8');
              const exports = this.extractExports(content);
              const imports = this.extractImports(content);

              components.push({
                name: entry.name,
                description: this.inferDescription(entry.name, content),
                dependencies: imports.filter(i => !i.startsWith('.')),
                apis: exports,
              });
            }
          } catch {
            // Skip directories without index
          }

          // Recurse into subdirectories
          const subComponents = await this.analyzeDirectory(fullPath);
          components.push(...subComponents);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }

    return components;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];
    const exportMatches = content.matchAll(/export\s+(?:async\s+)?(?:function|class|const|let|type|interface)\s+(\w+)/g);

    for (const match of exportMatches) {
      exports.push(match[1]);
    }

    return exports;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);

    for (const match of importMatches) {
      imports.push(match[1]);
    }

    return imports;
  }

  private inferDescription(name: string, content: string): string {
    // Look for module-level JSDoc
    const docMatch = content.match(/^\/\*\*\s*\n([^*]|\*[^/])*\*\//m);
    if (docMatch) {
      const parsed = this.parseDocComment(docMatch[0]);
      if (parsed.description) {
        return parsed.description.split('\n')[0];
      }
    }

    // Infer from name
    const words = name.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1));
    return `${words.join(' ')} module`;
  }

  private generateArchitectureOverview(
    system: SystemInfo,
    components: ArchitectureDocResult['components']
  ): string {
    const lines: string[] = [];

    lines.push(`# ${system.name} Architecture`);
    lines.push('');
    if (system.description) {
      lines.push(system.description);
      lines.push('');
    }

    lines.push('## Overview');
    lines.push('');
    lines.push(`This system consists of ${components.length} main components:`);
    lines.push('');

    for (const component of components) {
      lines.push(`- **${component.name}**: ${component.description}`);
    }

    if (system.pattern) {
      lines.push('');
      lines.push(`## Architecture Pattern: ${system.pattern}`);
      lines.push('');
      lines.push(this.describePattern(system.pattern));
    }

    return lines.join('\n');
  }

  private describePattern(pattern: string): string {
    const descriptions: Record<string, string> = {
      layered: 'The system follows a layered architecture where each layer has specific responsibilities and communicates only with adjacent layers.',
      microservices: 'The system is composed of loosely coupled microservices that communicate through well-defined APIs.',
      monolith: 'The system is a monolithic application with all components deployed together.',
      distributed: 'The system uses a distributed architecture with components spread across multiple nodes.',
      'event-driven': 'The system uses an event-driven architecture where components communicate through events.',
    };

    return descriptions[pattern] || `The system follows the ${pattern} architecture pattern.`;
  }

  private generateComponentDiagram(
    components: ArchitectureDocResult['components']
  ): string {
    const lines: string[] = ['```mermaid', 'graph TD'];

    for (const component of components) {
      const id = this.toMermaidId(component.name);
      lines.push(`    ${id}[${component.name}]`);

      for (const dep of component.dependencies) {
        const depId = this.toMermaidId(dep);
        lines.push(`    ${id} --> ${depId}`);
      }
    }

    lines.push('```');
    return lines.join('\n');
  }

  private generateClassDiagram(
    components: ArchitectureDocResult['components']
  ): string {
    const lines: string[] = ['```mermaid', 'classDiagram'];

    for (const component of components) {
      lines.push(`    class ${this.toMermaidId(component.name)} {`);
      for (const api of component.apis.slice(0, 5)) {
        lines.push(`        +${api}()`);
      }
      lines.push('    }');
    }

    lines.push('```');
    return lines.join('\n');
  }

  private generateDeploymentDiagram(
    system: SystemInfo,
    components: ArchitectureDocResult['components']
  ): string {
    const lines: string[] = ['```mermaid', 'graph LR'];

    lines.push(`    subgraph ${system.name}`);
    for (const component of components) {
      lines.push(`        ${this.toMermaidId(component.name)}[${component.name}]`);
    }
    lines.push('    end');

    lines.push('```');
    return lines.join('\n');
  }

  private renderArchitectureDoc(doc: ArchitectureDocResult): string {
    const lines: string[] = [doc.overview, ''];

    lines.push('## Diagrams');
    lines.push('');

    for (const diagram of doc.diagrams) {
      lines.push(`### ${this.formatDiagramTitle(diagram.type)}`);
      lines.push('');
      lines.push(diagram.content);
      lines.push('');
    }

    lines.push('## Components');
    lines.push('');

    for (const component of doc.components) {
      lines.push(`### ${component.name}`);
      lines.push('');
      lines.push(component.description);
      lines.push('');

      if (component.dependencies.length > 0) {
        lines.push('**Dependencies:**');
        for (const dep of component.dependencies) {
          lines.push(`- ${dep}`);
        }
        lines.push('');
      }

      if (component.apis.length > 0) {
        lines.push('**Exports:**');
        for (const api of component.apis) {
          lines.push(`- \`${api}\``);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ==========================================================================
  // Changelog Generation Methods
  // ==========================================================================

  private async getCommitsBetweenTags(fromTag: string, toTag: string): Promise<GitCommit[]> {
    // Simulated git log parsing
    // In a real implementation, this would use simple-git or child_process
    const commits: GitCommit[] = [];

    try {
      // For now, return empty array - would integrate with git in production
      this.logger.debug('Getting commits between tags', { fromTag, toTag });
    } catch (error) {
      this.logger.warn('Failed to get git commits', { error });
    }

    return commits;
  }

  private parseConventionalCommit(message: string): {
    type?: string;
    scope?: string;
    breaking?: boolean;
  } {
    const match = message.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)/);

    if (!match) {
      return {};
    }

    return {
      type: match[1],
      scope: match[2],
      breaking: match[3] === '!',
    };
  }

  private generateChangelogMarkdown(
    version: string,
    date: string,
    sections: ChangelogResult['sections']
  ): string {
    const lines: string[] = [`# Changelog`, '', `## [${version}] - ${date}`, ''];

    const sectionTitles: Record<keyof ChangelogResult['sections'], string> = {
      added: 'Added',
      changed: 'Changed',
      deprecated: 'Deprecated',
      removed: 'Removed',
      fixed: 'Fixed',
      security: 'Security',
    };

    for (const [key, title] of Object.entries(sectionTitles)) {
      const items = sections[key as keyof ChangelogResult['sections']];
      if (items.length > 0) {
        lines.push(`### ${title}`, '');
        for (const item of items) {
          lines.push(`- ${item}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  // ==========================================================================
  // Formatting Methods
  // ==========================================================================

  private formatDefaultMarkdown(content: string): string {
    // Standard markdown formatting
    return content
      .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
      .replace(/^\s+$/gm, '') // Remove trailing whitespace
      .trim();
  }

  private formatGitHubMarkdown(content: string): string {
    let formatted = this.formatDefaultMarkdown(content);

    // Add GitHub-specific syntax
    formatted = formatted.replace(/\bNOTE:/g, '> **Note:**');
    formatted = formatted.replace(/\bWARNING:/g, '> **Warning:**');
    formatted = formatted.replace(/\bTIP:/g, '> **Tip:**');

    return formatted;
  }

  private formatDocusaurusMarkdown(content: string): string {
    let formatted = this.formatDefaultMarkdown(content);

    // Add Docusaurus frontmatter if missing
    if (!formatted.startsWith('---')) {
      const titleMatch = formatted.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : 'Documentation';
      formatted = `---\ntitle: ${title}\n---\n\n${formatted}`;
    }

    return formatted;
  }

  private formatObsidianMarkdown(content: string): string {
    let formatted = this.formatDefaultMarkdown(content);

    // Convert standard links to Obsidian wikilinks where appropriate
    formatted = formatted.replace(/\[([^\]]+)\]\(#([^)]+)\)/g, '[[$2|$1]]');

    return formatted;
  }

  private fixMarkdownIssues(content: string): string {
    let fixed = content;

    // Fix missing space after headers
    fixed = fixed.replace(/^(#+)([^#\s])/gm, '$1 $2');

    // Fix unordered list formatting
    fixed = fixed.replace(/^[-*]\s{2,}/gm, '- ');

    // Fix ordered list formatting
    fixed = fixed.replace(/^\d+\.\s{2,}/gm, '1. ');

    // Fix code block language tags
    fixed = fixed.replace(/```(\w+)\n/g, '```$1\n');

    return fixed;
  }

  private ensureConsistentHeaders(content: string): string {
    // Ensure header levels are consistent
    const lines = content.split('\n');
    let lastLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(#+)\s/);
      if (match) {
        const level = match[1].length;

        // Don't skip more than one level
        if (level > lastLevel + 1 && lastLevel > 0) {
          const newLevel = lastLevel + 1;
          lines[i] = '#'.repeat(newLevel) + lines[i].slice(level);
        }

        lastLevel = level;
      }
    }

    return lines.join('\n');
  }

  private formatCodeBlocks(content: string): string {
    // Ensure code blocks have proper language tags
    return content.replace(/```\n([^`]+)```/g, (match, code) => {
      // Try to detect language
      if (code.includes('import ') || code.includes('export ') || code.includes(': ')) {
        return '```typescript\n' + code + '```';
      }
      if (code.includes('function ') || code.includes('const ') || code.includes('let ')) {
        return '```javascript\n' + code + '```';
      }
      return match;
    });
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  private toMermaidId(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private formatFeatureTitle(feature: string): string {
    return feature
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private formatDiagramTitle(type: string): string {
    const titles: Record<string, string> = {
      component: 'Component Diagram',
      sequence: 'Sequence Diagram',
      class: 'Class Diagram',
      deployment: 'Deployment Diagram',
    };
    return titles[type] || type;
  }
}
