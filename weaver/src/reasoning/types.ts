/**
 * Reasoning System Types
 *
 * Type definitions for Chain-of-Thought reasoning, templates, and multi-step prompts.
 */

export type ReasoningStrategy =
  | 'chain-of-thought'
  | 'self-consistent-cot'
  | 'tree-of-thought'
  | 'react'
  | 'plan-and-solve';

export type TemplateFormat = 'markdown' | 'json' | 'yaml';

/**
 * A single reasoning step in a chain
 */
export interface ReasoningStep {
  step: number;
  description: string;
  thought: string;
  action?: string;
  observation?: string;
  confidence?: number;
}

/**
 * Chain-of-Thought template
 */
export interface CoTTemplate {
  id: string;
  name: string;
  description: string;
  strategy: ReasoningStrategy;
  systemPrompt: string;
  userPromptTemplate: string;
  fewShotExamples?: FewShotExample[];
  variables: TemplateVariable[];
  stepFormat?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Template variable definition
 */
export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default?: unknown;
  validation?: ValidationRule;
}

/**
 * Validation rule for template variables
 */
export interface ValidationRule {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: unknown[];
  custom?: (value: unknown) => boolean | string;
}

/**
 * Few-shot example for CoT
 */
export interface FewShotExample {
  input: Record<string, unknown>;
  reasoning: ReasoningStep[];
  output: string;
  explanation?: string;
}

/**
 * Rendered CoT prompt
 */
export interface RenderedPrompt {
  systemPrompt: string;
  userPrompt: string;
  fewShotText?: string;
  fullPrompt: string;
  variables: Record<string, unknown>;
}

/**
 * CoT reasoning result
 */
export interface CoTReasoningResult {
  templateId: string;
  strategy: ReasoningStrategy;
  steps: ReasoningStep[];
  finalAnswer: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Interface for CoT template manager
 */
export interface ICoTTemplateManager {
  /**
   * Load a template from file or object
   */
  loadTemplate(source: string | CoTTemplate): Promise<CoTTemplate>;

  /**
   * Get a template by ID
   */
  getTemplate(id: string): CoTTemplate | null;

  /**
   * List all templates
   */
  listTemplates(): CoTTemplate[];

  /**
   * Validate a template
   */
  validateTemplate(template: CoTTemplate): TemplateValidationResult;

  /**
   * Render a template with variables
   */
  renderTemplate(
    templateId: string,
    variables: Record<string, unknown>
  ): Promise<RenderedPrompt>;

  /**
   * Add a few-shot example to a template
   */
  addFewShotExample(templateId: string, example: FewShotExample): void;
}

/**
 * Step-by-step reasoning context
 */
export interface ReasoningContext {
  task: string;
  goal: string;
  constraints?: string[];
  context?: Record<string, unknown>;
  priorSteps?: ReasoningStep[];
  availableActions?: string[];
}

/**
 * Reasoning execution options
 */
export interface ReasoningOptions {
  maxSteps?: number;
  temperature?: number;
  stopCondition?: (steps: ReasoningStep[]) => boolean;
  onStep?: (step: ReasoningStep) => void;
}
