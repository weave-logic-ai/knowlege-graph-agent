/**
 * Documenter Agent
 *
 * Specialized agent for documentation generation, including API docs,
 * user guides, architecture documentation, and changelog generation.
 * Extends BaseAgent with documentation-specific capabilities.
 *
 * @module agents/documenter-agent
 */
import { BaseAgent } from './base-agent.js';
import { AgentType, type AgentTask, type AgentResult, type AgentConfig } from './types.js';
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
    files: Array<{
        path: string;
        content: string;
    }>;
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
        content: string;
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
    params: Array<{
        name: string;
        type?: string;
        description: string;
    }>;
    /** Return documentation */
    returns?: {
        type?: string;
        description: string;
    };
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
export type DocumenterTaskType = 'api_docs' | 'user_guide' | 'architecture' | 'changelog' | 'format';
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
export declare class DocumenterAgent extends BaseAgent {
    /** Agent type identifier */
    readonly type = AgentType.DOCUMENTER;
    /** Agent capabilities */
    readonly capabilities: string[];
    /** File patterns for TypeScript/JavaScript */
    private readonly codePatterns;
    /** Conventional commit types */
    private readonly commitTypes;
    constructor(config: Partial<DocumenterAgentConfig> & {
        name: string;
    });
    /**
     * Execute documenter task
     */
    protected executeTask(task: AgentTask): Promise<AgentResult>;
    /**
     * Generate API documentation from source files
     */
    generateApiDocs(files: string[], format?: DocumentationFormat): Promise<DocumentationResult>;
    /**
     * Create user guide for a feature
     */
    createUserGuide(feature: string, codebase: string[]): Promise<UserGuideResult>;
    /**
     * Document system architecture
     */
    documentArchitecture(system: SystemInfo): Promise<ArchitectureDocResult>;
    /**
     * Generate changelog from git commits
     */
    generateChangelog(fromTag: string, toTag: string): Promise<ChangelogResult>;
    /**
     * Format documentation content
     */
    formatDocumentation(content: string, style?: string): Promise<string>;
    private handleApiDocsTask;
    private handleUserGuideTask;
    private handleArchitectureTask;
    private handleChangelogTask;
    private handleFormatTask;
    private parseSourceFile;
    private findDocComment;
    private parseDocComment;
    private extractSignature;
    private generateMarkdownDocs;
    private generateOpenApiDocs;
    private generateTypeDocConfig;
    private findRelevantItems;
    private extractExamples;
    private extractTestBody;
    private generateIntroduction;
    private generateGettingStarted;
    private generateUsageGuide;
    private generateApiReference;
    private generateTableOfContents;
    private renderUserGuide;
    private analyzeDirectory;
    private extractExports;
    private extractImports;
    private inferDescription;
    private generateArchitectureOverview;
    private describePattern;
    private generateComponentDiagram;
    private generateClassDiagram;
    private generateDeploymentDiagram;
    private renderArchitectureDoc;
    private getCommitsBetweenTags;
    private parseConventionalCommit;
    private generateChangelogMarkdown;
    private formatDefaultMarkdown;
    private formatGitHubMarkdown;
    private formatDocusaurusMarkdown;
    private formatObsidianMarkdown;
    private fixMarkdownIssues;
    private ensureConsistentHeaders;
    private formatCodeBlocks;
    private toKebabCase;
    private toMermaidId;
    private formatFeatureTitle;
    private formatDiagramTitle;
}
//# sourceMappingURL=documenter-agent.d.ts.map