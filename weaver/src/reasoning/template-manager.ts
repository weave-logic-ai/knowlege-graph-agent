/**
 * CoT Template Manager
 *
 * Manages Chain-of-Thought templates, validation, and rendering.
 */

import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';
import type {
  CoTTemplate,
  FewShotExample,
  ICoTTemplateManager,
  RenderedPrompt,
  TemplateValidationResult,
  TemplateVariable,
} from './types.js';
import { logger } from '../utils/logger.js';

export interface CoTTemplateManagerOptions {
  templateDir?: string;
  autoLoad?: boolean;
}

/**
 * Chain-of-Thought template manager
 */
export class CoTTemplateManager implements ICoTTemplateManager {
  private templates: Map<string, CoTTemplate> = new Map();
  private options: Required<CoTTemplateManagerOptions>;

  constructor(options: CoTTemplateManagerOptions = {}) {
    this.options = {
      templateDir: options.templateDir || path.join(process.cwd(), 'src', 'templates', 'cot'),
      autoLoad: options.autoLoad ?? false,
    };

    if (this.options.autoLoad) {
      this.loadAllTemplates().catch(error => {
        logger.error('Failed to auto-load templates', error instanceof Error ? error : new Error(String(error)));
      });
    }
  }

  /**
   * Load a template from file or object
   */
  async loadTemplate(source: string | CoTTemplate): Promise<CoTTemplate> {
    let template: CoTTemplate;

    if (typeof source === 'string') {
      // Load from file
      const filePath = path.isAbsolute(source)
        ? source
        : path.join(this.options.templateDir, source);

      const content = await fs.readFile(filePath, 'utf-8');

      // Parse based on file extension
      if (filePath.endsWith('.json')) {
        template = JSON.parse(content);
      } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        // For simplicity, we'll just support JSON for now
        throw new Error('YAML templates not yet supported');
      } else {
        throw new Error(`Unsupported template format: ${filePath}`);
      }
    } else {
      template = source;
    }

    // Validate template
    const validation = this.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // Store template
    this.templates.set(template.id, template);

    logger.debug('Template loaded', { id: template.id, name: template.name });

    return template;
  }

  /**
   * Get a template by ID
   */
  getTemplate(id: string): CoTTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * List all templates
   */
  listTemplates(): CoTTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Validate a template
   */
  validateTemplate(template: CoTTemplate): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!template.id) {
      errors.push('Template ID is required');
    }
    if (!template.name) {
      errors.push('Template name is required');
    }
    if (!template.strategy) {
      errors.push('Reasoning strategy is required');
    }
    if (!template.systemPrompt) {
      errors.push('System prompt is required');
    }
    if (!template.userPromptTemplate) {
      errors.push('User prompt template is required');
    }

    // Validate variables
    if (!template.variables || template.variables.length === 0) {
      warnings.push('Template has no variables defined');
    } else {
      for (const variable of template.variables) {
        if (!variable.name) {
          errors.push('Variable name is required');
        }
        if (!variable.type) {
          errors.push(`Variable ${variable.name} has no type specified`);
        }

        // Validate required variables have no default
        if (variable.required && variable.default !== undefined) {
          warnings.push(`Required variable ${variable.name} has a default value`);
        }
      }
    }

    // Validate template syntax (Handlebars)
    try {
      Handlebars.compile(template.userPromptTemplate);
    } catch (error) {
      errors.push(`Invalid template syntax: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Validate few-shot examples
    if (template.fewShotExamples) {
      for (const example of template.fewShotExamples) {
        if (!example.input || !example.reasoning || !example.output) {
          errors.push('Few-shot example must have input, reasoning, and output');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Render a template with variables
   */
  async renderTemplate(
    templateId: string,
    variables: Record<string, unknown>
  ): Promise<RenderedPrompt> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate variables
    this.validateVariables(template, variables);

    // Fill in defaults for missing optional variables
    const allVariables = { ...this.getDefaultVariables(template), ...variables };

    // Compile and render user prompt
    const userPromptCompiled = Handlebars.compile(template.userPromptTemplate);
    const userPrompt = userPromptCompiled(allVariables);

    // Render few-shot examples if present
    let fewShotText = '';
    if (template.fewShotExamples && template.fewShotExamples.length > 0) {
      fewShotText = this.renderFewShotExamples(template.fewShotExamples);
    }

    // Build full prompt
    const fullPrompt = this.buildFullPrompt(
      template.systemPrompt,
      fewShotText,
      userPrompt
    );

    return {
      systemPrompt: template.systemPrompt,
      userPrompt,
      fewShotText: fewShotText || undefined,
      fullPrompt,
      variables: allVariables,
    };
  }

  /**
   * Add a few-shot example to a template
   */
  addFewShotExample(templateId: string, example: FewShotExample): void {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    if (!template.fewShotExamples) {
      template.fewShotExamples = [];
    }

    template.fewShotExamples.push(example);

    logger.debug('Few-shot example added', { templateId, exampleCount: template.fewShotExamples.length });
  }

  /**
   * Load all templates from template directory
   */
  private async loadAllTemplates(): Promise<void> {
    try {
      const files = await fs.readdir(this.options.templateDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          await this.loadTemplate(file);
        } catch (error) {
          logger.warn('Failed to load template', { file, error });
        }
      }

      logger.info('Templates loaded', { count: this.templates.size });
    } catch (error) {
      logger.error('Failed to load templates directory', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Validate template variables
   */
  private validateVariables(
    template: CoTTemplate,
    variables: Record<string, unknown>
  ): void {
    // Check required variables
    for (const varDef of template.variables) {
      if (varDef.required && !(varDef.name in variables)) {
        throw new Error(`Required variable missing: ${varDef.name}`);
      }

      if (varDef.name in variables) {
        const value = variables[varDef.name];

        // Type checking
        if (!this.checkType(value, varDef.type)) {
          throw new Error(`Variable ${varDef.name} has incorrect type (expected ${varDef.type})`);
        }

        // Validation rules
        if (varDef.validation) {
          this.validateValue(varDef.name, value, varDef.validation);
        }
      }
    }
  }

  /**
   * Check if value matches expected type
   */
  private checkType(value: unknown, expectedType: TemplateVariable['type']): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Validate value against validation rules
   */
  private validateValue(
    name: string,
    value: unknown,
    validation: TemplateVariable['validation']
  ): void {
    if (!validation) return;

    if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
      throw new Error(`Variable ${name} is below minimum value ${validation.min}`);
    }

    if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
      throw new Error(`Variable ${name} exceeds maximum value ${validation.max}`);
    }

    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new Error(`Variable ${name} does not match pattern ${validation.pattern}`);
      }
    }

    if (validation.enum && !validation.enum.includes(value)) {
      throw new Error(`Variable ${name} is not one of allowed values: ${validation.enum.join(', ')}`);
    }

    if (validation.custom) {
      const result = validation.custom(value);
      if (result !== true) {
        throw new Error(`Variable ${name} failed custom validation: ${result}`);
      }
    }
  }

  /**
   * Get default variables from template
   */
  private getDefaultVariables(template: CoTTemplate): Record<string, unknown> {
    const defaults: Record<string, unknown> = {};

    for (const varDef of template.variables) {
      if (varDef.default !== undefined) {
        defaults[varDef.name] = varDef.default;
      }
    }

    return defaults;
  }

  /**
   * Render few-shot examples to text
   */
  private renderFewShotExamples(examples: FewShotExample[]): string {
    const renderedExamples = examples.map((example, index) => {
      const steps = example.reasoning
        .map(step => `${step.step}. ${step.description}\n   Thought: ${step.thought}`)
        .join('\n');

      return `Example ${index + 1}:\nInput: ${JSON.stringify(example.input)}\n\nReasoning:\n${steps}\n\nOutput: ${example.output}`;
    });

    return renderedExamples.join('\n\n---\n\n');
  }

  /**
   * Build full prompt from components
   */
  private buildFullPrompt(
    systemPrompt: string,
    fewShotText: string,
    userPrompt: string
  ): string {
    const parts: string[] = [systemPrompt];

    if (fewShotText) {
      parts.push('\n\n## Examples\n\n' + fewShotText);
    }

    parts.push('\n\n## Task\n\n' + userPrompt);

    return parts.join('');
  }
}
