import Handlebars from 'handlebars';
import {
  VaultTemplate,
  VaultTemplateSchema,
  NodeTemplate,
  TemplateContext,
  ValidationResult,
  TemplateMetadata,
} from './types.js';
import { nextjsTemplate } from './nextjs-template.js';
import { reactTemplate } from './react-template.js';

/**
 * Template registry and loader for vault initialization
 */
export class TemplateLoader {
  private templates: Map<string, VaultTemplate> = new Map();
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.registerDefaultTemplates();
    this.registerHandlebarsHelpers();
  }

  /**
   * Register default templates
   */
  private registerDefaultTemplates(): void {
    this.registerTemplate(nextjsTemplate);
    this.registerTemplate(reactTemplate);
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHandlebarsHelpers(): void {
    // Conditional helper
    Handlebars.registerHelper('ifEquals', function (this: any, arg1: any, arg2: any, options: any) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    // Date formatting helper
    Handlebars.registerHelper('formatDate', function (date: string) {
      return new Date(date).toLocaleDateString();
    });

    // Uppercase helper
    Handlebars.registerHelper('uppercase', function (str: string) {
      return str.toUpperCase();
    });

    // Lowercase helper
    Handlebars.registerHelper('lowercase', function (str: string) {
      return str.toLowerCase();
    });

    // Pascal case helper
    Handlebars.registerHelper('pascalCase', function (str: string) {
      return str
        .split(/[-_\s]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    });

    // Camel case helper
    Handlebars.registerHelper('camelCase', function (str: string) {
      const pascal = str
        .split(/[-_\s]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
      return pascal.charAt(0).toLowerCase() + pascal.slice(1);
    });
  }

  /**
   * Register a new template
   */
  registerTemplate(template: VaultTemplate): void {
    const validation = this.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(
        `Invalid template: ${validation.errors.join(', ')}`
      );
    }

    this.templates.set(template.id, template);

    // Pre-compile all node templates
    for (const [key, nodeTemplate] of template.nodeTemplates.entries()) {
      const compiledKey = `${template.id}:${key}`;
      this.compiledTemplates.set(
        compiledKey,
        Handlebars.compile(nodeTemplate.contentTemplate)
      );
    }
  }

  /**
   * Validate template structure using Zod
   */
  validateTemplate(template: VaultTemplate): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Convert Map to object for Zod validation
      const templateForValidation = {
        ...template,
        nodeTemplates: Object.fromEntries(template.nodeTemplates.entries()),
      };

      VaultTemplateSchema.parse(templateForValidation);

      // Additional validation checks
      if (template.nodeTemplates.size === 0) {
        warnings.push('Template has no node templates defined');
      }

      if (Object.keys(template.directories).length === 0) {
        warnings.push('Template has no directories defined');
      }

      // Validate node template types match directory structure
      for (const [key, nodeTemplate] of template.nodeTemplates.entries()) {
        const validTypes = Object.keys(template.directories);
        if (!validTypes.includes(nodeTemplate.type)) {
          warnings.push(
            `Node template "${key}" has type "${nodeTemplate.type}" which doesn't match any directory`
          );
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      } else {
        errors.push('Unknown validation error');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): VaultTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get all registered templates
   */
  getAllTemplates(): VaultTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * List template metadata
   */
  listTemplates(): TemplateMetadata[] {
    return Array.from(this.templates.values()).map((template) => ({
      id: template.id,
      name: template.name,
      framework: template.framework,
      version: template.version,
      description: template.description,
      tags: template.metadata?.tags,
    }));
  }

  /**
   * Get node template from a vault template
   */
  getNodeTemplate(
    templateId: string,
    nodeTemplateKey: string
  ): NodeTemplate | undefined {
    const template = this.templates.get(templateId);
    return template?.nodeTemplates.get(nodeTemplateKey);
  }

  /**
   * Render a node template with context
   */
  renderNodeTemplate(
    templateId: string,
    nodeTemplateKey: string,
    context: TemplateContext
  ): string {
    const compiledKey = `${templateId}:${nodeTemplateKey}`;
    const compiled = this.compiledTemplates.get(compiledKey);

    if (!compiled) {
      throw new Error(
        `Template not found: ${templateId}:${nodeTemplateKey}`
      );
    }

    // Merge default context with timestamp only if not provided
    const fullContext: TemplateContext = {
      ...context,
      timestamp: context.timestamp || new Date().toISOString(),
    };

    return compiled(fullContext);
  }

  /**
   * Get directory structure for a template
   */
  getDirectoryStructure(templateId: string) {
    const template = this.templates.get(templateId);
    return template?.directories;
  }

  /**
   * Check if template exists
   */
  hasTemplate(id: string): boolean {
    return this.templates.has(id);
  }

  /**
   * Search templates by framework
   */
  findByFramework(framework: string): VaultTemplate[] {
    return Array.from(this.templates.values()).filter(
      (template) => template.framework.toLowerCase() === framework.toLowerCase()
    );
  }

  /**
   * Search templates by tag
   */
  findByTag(tag: string): VaultTemplate[] {
    return Array.from(this.templates.values()).filter((template) =>
      template.metadata?.tags?.some(
        (t) => t.toLowerCase() === tag.toLowerCase()
      )
    );
  }

  /**
   * Create a custom template by extending an existing one
   */
  extendTemplate(
    baseTemplateId: string,
    newTemplateId: string,
    overrides: Partial<VaultTemplate>
  ): VaultTemplate {
    const baseTemplate = this.templates.get(baseTemplateId);
    if (!baseTemplate) {
      throw new Error(`Base template not found: ${baseTemplateId}`);
    }

    const extendedTemplate: VaultTemplate = {
      ...baseTemplate,
      ...overrides,
      id: newTemplateId,
      nodeTemplates: new Map([
        ...baseTemplate.nodeTemplates.entries(),
        ...(overrides.nodeTemplates?.entries() ?? []),
      ]),
      directories: {
        ...baseTemplate.directories,
        ...overrides.directories,
      },
    };

    this.registerTemplate(extendedTemplate);
    return extendedTemplate;
  }

  /**
   * Remove a template from the registry
   */
  unregisterTemplate(id: string): boolean {
    // Remove compiled templates
    const keysToRemove = Array.from(this.compiledTemplates.keys()).filter(
      (key) => key.startsWith(`${id}:`)
    );
    keysToRemove.forEach((key) => this.compiledTemplates.delete(key));

    return this.templates.delete(id);
  }

  /**
   * Get template statistics
   */
  getStats() {
    const templates = Array.from(this.templates.values());
    return {
      totalTemplates: templates.length,
      frameworks: [...new Set(templates.map((t) => t.framework))],
      totalNodeTemplates: templates.reduce(
        (sum, t) => sum + t.nodeTemplates.size,
        0
      ),
      compiledTemplates: this.compiledTemplates.size,
    };
  }
}

/**
 * Singleton instance
 */
export const templateLoader = new TemplateLoader();
