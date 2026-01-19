/**
 * Knowledge Graph Agent - CLAUDE.md Generator Types
 * @module @weave-nn/knowledge-graph-agent/claude-md
 */

// =============================================================================
// Project Types
// =============================================================================

/**
 * Project type classification
 */
export type ProjectType =
  | 'nextjs'
  | 'react'
  | 'vue'
  | 'angular'
  | 'svelte'
  | 'node'
  | 'express'
  | 'fastify'
  | 'nestjs'
  | 'typescript'
  | 'python'
  | 'django'
  | 'flask'
  | 'rust'
  | 'go'
  | 'java'
  | 'kotlin'
  | 'unknown';

/**
 * Framework detection result
 */
export interface Framework {
  /** Framework name */
  name: string;

  /** Framework version (if detected) */
  version?: string;

  /** Detection source (package.json, config file, etc.) */
  source: string;

  /** Detection confidence (0-1) */
  confidence: number;

  /** Related dependencies */
  dependencies?: string[];
}

/**
 * Project detection result
 */
export interface ProjectDetectionResult {
  /** Primary project type */
  type: ProjectType;

  /** Detected frameworks */
  frameworks: Framework[];

  /** Package manager (npm, yarn, pnpm, bun) */
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun';

  /** Language(s) used */
  languages: string[];

  /** Build tools detected */
  buildTools: string[];

  /** Test frameworks detected */
  testFrameworks: string[];

  /** Linters detected */
  linters: string[];

  /** Has TypeScript */
  hasTypeScript: boolean;

  /** Has ESLint */
  hasEslint: boolean;

  /** Has Prettier */
  hasPrettier: boolean;

  /** Detection confidence (0-1) */
  confidence: number;
}

// =============================================================================
// CLAUDE.md Content Structure
// =============================================================================

/**
 * CLAUDE.md content structure
 */
export interface ClaudeMdContent {
  /** Header section with project overview */
  header: HeaderSection;

  /** Build and development commands */
  commands: CommandsSection;

  /** Code style and conventions */
  codeStyle: CodeStyleSection;

  /** Project-specific rules */
  rules: RulesSection;

  /** Integration configurations */
  integrations?: IntegrationsSection;

  /** Environment variables documentation */
  environment?: EnvironmentSection;

  /** Custom sections */
  customSections: CustomSection[];

  /** Raw metadata (for serialization) */
  metadata?: ClaudeMdMetadata;
}

/**
 * Header section
 */
export interface HeaderSection {
  /** Project title */
  title: string;

  /** Project description */
  description: string;

  /** Project version */
  version?: string;

  /** Primary project type */
  projectType: ProjectType;

  /** Detected frameworks */
  frameworks: Framework[];

  /** Custom notes */
  notes?: string[];
}

/**
 * Commands section
 */
export interface CommandsSection {
  /** Build commands */
  build: CommandInfo[];

  /** Test commands */
  test: CommandInfo[];

  /** Development commands */
  dev: CommandInfo[];

  /** Lint/format commands */
  lint: CommandInfo[];

  /** Deployment commands */
  deploy?: CommandInfo[];

  /** Custom commands */
  custom: CommandInfo[];
}

/**
 * Command information
 */
export interface CommandInfo {
  /** Command name/alias */
  name: string;

  /** Full command string */
  command: string;

  /** Description of what the command does */
  description: string;

  /** Command category */
  category: 'build' | 'test' | 'dev' | 'lint' | 'deploy' | 'custom';

  /** Prerequisites or notes */
  notes?: string;

  /** Typical use case */
  useCase?: string;
}

/**
 * Code style section
 */
export interface CodeStyleSection {
  /** Primary language */
  language: string;

  /** Style guide reference (airbnb, google, standard, etc.) */
  style?: string;

  /** Coding conventions */
  conventions: string[];

  /** Formatting configuration */
  formatting: FormattingConfig;

  /** Naming conventions */
  naming?: NamingConventions;

  /** File organization guidelines */
  fileOrganization?: string[];
}

/**
 * Formatting configuration
 */
export interface FormattingConfig {
  /** Indentation style */
  indentStyle: 'spaces' | 'tabs';

  /** Indentation size */
  indentSize: number;

  /** Maximum line length */
  maxLineLength: number;

  /** Trailing comma preference */
  trailingComma: 'none' | 'es5' | 'all';

  /** Use semicolons */
  semicolons: boolean;

  /** Quote style */
  quotes: 'single' | 'double';

  /** End of line */
  endOfLine: 'lf' | 'crlf' | 'auto';

  /** Print width for wrapping */
  printWidth?: number;
}

/**
 * Naming conventions
 */
export interface NamingConventions {
  /** Variable naming */
  variables: 'camelCase' | 'snake_case' | 'PascalCase';

  /** Function naming */
  functions: 'camelCase' | 'snake_case' | 'PascalCase';

  /** Class naming */
  classes: 'PascalCase';

  /** Constant naming */
  constants: 'UPPER_SNAKE_CASE' | 'camelCase';

  /** File naming */
  files: 'kebab-case' | 'camelCase' | 'PascalCase' | 'snake_case';

  /** Component naming */
  components?: 'PascalCase';
}

/**
 * Rules section
 */
export interface RulesSection {
  /** Critical rules that must be followed */
  important: Rule[];

  /** General guidelines */
  guidelines: Rule[];

  /** Things to avoid */
  restrictions: Rule[];

  /** Project-specific rules */
  projectSpecific?: Rule[];
}

/**
 * Rule definition
 */
export interface Rule {
  /** Rule text */
  text: string;

  /** Priority/severity */
  priority?: 'low' | 'medium' | 'high' | 'critical';

  /** Category */
  category?: string;

  /** Rationale for the rule */
  rationale?: string;
}

/**
 * Integrations section
 */
export interface IntegrationsSection {
  /** Claude-Flow integration */
  claudeFlow?: ClaudeFlowIntegration;

  /** Git integration */
  git?: GitIntegration;

  /** CI/CD integration */
  cicd?: CICDIntegration;

  /** Other integrations */
  other?: Record<string, unknown>;
}

/**
 * Claude-Flow integration configuration
 */
export interface ClaudeFlowIntegration {
  /** Enabled */
  enabled: boolean;

  /** Memory namespace */
  namespace?: string;

  /** Hooks enabled */
  hooks?: boolean;

  /** Agent types to use */
  agents?: string[];
}

/**
 * Git integration configuration
 */
export interface GitIntegration {
  /** Commit message format */
  commitFormat?: string;

  /** Branch naming convention */
  branchNaming?: string;

  /** Protected branches */
  protectedBranches?: string[];

  /** Pre-commit hooks */
  preCommitHooks?: string[];
}

/**
 * CI/CD integration configuration
 */
export interface CICDIntegration {
  /** CI platform */
  platform?: 'github-actions' | 'gitlab-ci' | 'circleci' | 'jenkins';

  /** Main workflow file */
  workflowFile?: string;

  /** Required checks */
  requiredChecks?: string[];
}

/**
 * Environment section
 */
export interface EnvironmentSection {
  /** Required environment variables */
  required: EnvironmentVariable[];

  /** Optional environment variables */
  optional: EnvironmentVariable[];

  /** Example .env file content */
  example?: string;
}

/**
 * Environment variable definition
 */
export interface EnvironmentVariable {
  /** Variable name */
  name: string;

  /** Description */
  description: string;

  /** Example value */
  example?: string;

  /** Default value */
  default?: string;

  /** Is secret (should not be logged) */
  secret?: boolean;
}

/**
 * Custom section
 */
export interface CustomSection {
  /** Section title */
  title: string;

  /** Section content (markdown) */
  content: string;

  /** Display priority (lower = earlier) */
  priority: number;

  /** Section ID for referencing */
  id?: string;
}

/**
 * CLAUDE.md metadata
 */
export interface ClaudeMdMetadata {
  /** Generation timestamp */
  generatedAt: string;

  /** Generator version */
  generatorVersion: string;

  /** Source template */
  template?: string;

  /** Merged from global */
  mergedGlobal?: boolean;

  /** Last updated */
  lastUpdated?: string;
}

// =============================================================================
// Generation Options
// =============================================================================

/**
 * Generation options
 */
export interface GenerateOptions {
  /** Auto-detect project type and frameworks */
  autoDetect: boolean;

  /** Merge with global CLAUDE.md */
  mergeGlobal: boolean;

  /** Path to global CLAUDE.md */
  globalPath?: string;

  /** Template to use */
  template?: string;

  /** Override sections */
  overrides?: Partial<ClaudeMdContent>;

  /** Include environment section */
  includeEnvironment?: boolean;

  /** Include integrations section */
  includeIntegrations?: boolean;

  /** Custom sections to add */
  customSections?: CustomSection[];

  /** Output format */
  format?: 'markdown' | 'yaml';
}

/**
 * Update options
 */
export interface UpdateOptions {
  /** Sections to update */
  sections?: ('header' | 'commands' | 'codeStyle' | 'rules' | 'integrations' | 'environment')[];

  /** Merge mode (replace or merge) */
  mode: 'replace' | 'merge';

  /** Preserve custom sections */
  preserveCustom?: boolean;

  /** Update metadata timestamp */
  updateTimestamp?: boolean;
}

/**
 * Merge options
 */
export interface MergeOptions {
  /** Base content (lower priority) */
  base: ClaudeMdContent;

  /** Overlay content (higher priority) */
  overlay: Partial<ClaudeMdContent>;

  /** Merge strategy */
  strategy: 'overlay-wins' | 'base-wins' | 'merge-arrays';

  /** Sections to skip merging */
  skipSections?: string[];
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is valid */
  valid: boolean;

  /** Validation errors */
  errors: ValidationError[];

  /** Validation warnings */
  warnings: ValidationError[];

  /** Suggestions for improvement */
  suggestions: string[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error path */
  path: string;

  /** Error message */
  message: string;

  /** Error severity */
  severity: 'error' | 'warning';

  /** Suggested fix */
  fix?: string;
}

// =============================================================================
// Template Types
// =============================================================================

/**
 * Template definition
 */
export interface Template {
  /** Template ID */
  id: string;

  /** Template name */
  name: string;

  /** Description */
  description: string;

  /** Project types this template applies to */
  projectTypes: ProjectType[];

  /** Template content (Handlebars) */
  content: string;

  /** Default values */
  defaults?: Partial<ClaudeMdContent>;
}

/**
 * Template context for rendering
 */
export interface TemplateContext {
  /** Project information */
  project: ProjectDetectionResult;

  /** Content sections */
  content: ClaudeMdContent;

  /** Additional variables */
  variables?: Record<string, unknown>;
}
