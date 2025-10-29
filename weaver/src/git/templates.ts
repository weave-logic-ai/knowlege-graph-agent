/**
 * Commit Message Template System
 *
 * Supports custom commit message templates with variable substitution
 * Compatible with .gitmessage and custom .weaver templates
 *
 * @module git/templates
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { ConventionalCommit } from './conventional.js';
import type { DiffAnalysis } from './diff-analyzer.js';

export interface TemplateContext {
  type: string;
  scope?: string;
  subject?: string;
  body?: string;
  footer?: string;
  breaking?: boolean;

  // File information
  files?: string[];
  filesChanged?: number;
  insertions?: number;
  deletions?: number;

  // Metadata
  branch?: string;
  author?: string;
  date?: string;

  // Issue tracking
  issues?: string[];
}

export interface Template {
  name: string;
  content: string;
  variables: string[];
}

/**
 * Load template from file
 */
export function loadTemplate(templatePath: string): Template {
  const fullPath = resolve(templatePath);

  if (!existsSync(fullPath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const content = readFileSync(fullPath, 'utf-8');
  const variables = extractVariables(content);

  return {
    name: templatePath,
    content,
    variables
  };
}

/**
 * Extract template variables
 */
function extractVariables(template: string): string[] {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variablePattern.exec(template)) !== null) {
    if (match[1]) {
      variables.push(match[1].trim());
    }
  }

  return Array.from(new Set(variables));
}

/**
 * Render template with context
 */
export function renderTemplate(template: string, context: TemplateContext): string {
  let rendered = template;

  // Replace all variables
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined && value !== null) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      rendered = rendered.replace(pattern, String(value));
    }
  }

  // Remove unreplaced variables
  rendered = rendered.replace(/\{\{[^}]+\}\}/g, '');

  // Clean up extra whitespace
  rendered = rendered.replace(/\n{3,}/g, '\n\n').trim();

  return rendered;
}

/**
 * Create context from diff analysis
 */
export function createContextFromDiff(
  analysis: DiffAnalysis,
  additionalContext: Partial<TemplateContext> = {}
): TemplateContext {
  return {
    type: analysis.suggestedType,
    scope: analysis.suggestedScope,
    breaking: analysis.hasBreakingChanges,
    files: analysis.files.map(f => f.path),
    filesChanged: analysis.stats.filesChanged,
    insertions: analysis.stats.insertions,
    deletions: analysis.stats.deletions,
    date: new Date().toISOString(),
    ...additionalContext
  };
}

/**
 * Create context from conventional commit
 */
export function createContextFromCommit(
  commit: ConventionalCommit,
  additionalContext: Partial<TemplateContext> = {}
): TemplateContext {
  return {
    type: commit.type,
    scope: commit.scope,
    subject: commit.subject,
    body: commit.body,
    footer: commit.footer,
    breaking: commit.breaking,
    date: new Date().toISOString(),
    ...additionalContext
  };
}

/**
 * Default commit template
 */
export const DEFAULT_TEMPLATE = `{{type}}{{#if scope}}({{scope}}){{/if}}{{#if breaking}}!{{/if}}: {{subject}}

{{#if body}}
{{body}}
{{/if}}

{{#if footer}}
{{footer}}
{{/if}}

{{#if breaking}}
BREAKING CHANGE: {{breaking}}
{{/if}}`;

/**
 * Detailed commit template
 */
export const DETAILED_TEMPLATE = `{{type}}{{#if scope}}({{scope}}){{/if}}{{#if breaking}}!{{/if}}: {{subject}}

{{#if body}}
{{body}}
{{/if}}

Changes:
{{#each files}}
  - {{this}}
{{/each}}

Statistics:
  Files changed: {{filesChanged}}
  Insertions: {{insertions}}
  Deletions: {{deletions}}

{{#if issues}}
References: {{issues}}
{{/if}}

{{#if footer}}
{{footer}}
{{/if}}

{{#if breaking}}
BREAKING CHANGE: This commit introduces breaking changes
{{/if}}

Date: {{date}}
Author: {{author}}`;

/**
 * Simple template for quick commits
 */
export const SIMPLE_TEMPLATE = `{{type}}: {{subject}}`;

/**
 * Get built-in template by name
 */
export function getBuiltInTemplate(name: string): string {
  const templates: Record<string, string> = {
    default: DEFAULT_TEMPLATE,
    detailed: DETAILED_TEMPLATE,
    simple: SIMPLE_TEMPLATE
  };

  const template = templates[name];
  if (!template) {
    throw new Error(`Unknown built-in template: ${name}`);
  }

  return template;
}

/**
 * Load template from project or system
 */
export function loadProjectTemplate(
  repoPath: string
): Template | null {
  // Check for .weaver commit template
  const weaverTemplate = resolve(repoPath, '.weaver', 'commit-template.md');
  if (existsSync(weaverTemplate)) {
    return loadTemplate(weaverTemplate);
  }

  // Check for .gitmessage
  const gitMessage = resolve(repoPath, '.gitmessage');
  if (existsSync(gitMessage)) {
    return loadTemplate(gitMessage);
  }

  return null;
}

/**
 * Simple variable replacement (for basic templates)
 */
export function simpleRender(template: string, context: TemplateContext): string {
  let result = template;

  // Replace simple variables
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined && value !== null) {
      // Handle arrays
      if (Array.isArray(value)) {
        result = result.replace(
          `{{${key}}}`,
          value.map(v => `  - ${v}`).join('\n')
        );
      } else {
        result = result.replace(`{{${key}}}`, String(value));
      }
    }
  }

  return result;
}

/**
 * Validate template format
 */
export function validateTemplate(template: string): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required variables
  const hasType = template.includes('{{type}}');
  const hasSubject = template.includes('{{subject}}');

  if (!hasType) {
    errors.push('Template must include {{type}} variable');
  }

  if (!hasSubject) {
    errors.push('Template must include {{subject}} variable');
  }

  // Check for unclosed variables
  const openBraces = (template.match(/\{\{/g) || []).length;
  const closeBraces = (template.match(/\}\}/g) || []).length;

  if (openBraces !== closeBraces) {
    errors.push('Template has unmatched braces');
  }

  // Check for unknown variables
  const variables = extractVariables(template);
  const knownVariables = [
    'type', 'scope', 'subject', 'body', 'footer', 'breaking',
    'files', 'filesChanged', 'insertions', 'deletions',
    'branch', 'author', 'date', 'issues'
  ];

  const unknownVars = variables.filter(v => !knownVariables.includes(v));
  if (unknownVars.length > 0) {
    warnings.push(`Unknown variables: ${unknownVars.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
