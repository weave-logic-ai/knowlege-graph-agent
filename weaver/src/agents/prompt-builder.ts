/**
 * Prompt Builder - Fluent API for constructing Claude prompts
 *
 * Provides a type-safe, fluent interface for building prompts with:
 * - System and user messages
 * - Template variables
 * - JSON response formatting
 * - Token counting for cost estimation
 *
 * @example
 * ```typescript
 * const prompt = new PromptBuilder()
 *   .system('You are a helpful assistant')
 *   .user('Extract tags from: {{text}}')
 *   .variable('text', 'sample document')
 *   .expectJSON({ type: 'object', properties: { tags: { type: 'array' } } })
 *   .build();
 * ```
 */

import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.js';
import type { PromptVariables, ResponseFormat } from './types.js';

/**
 * Token pricing for Claude models (per million tokens)
 */
const TOKEN_PRICING = {
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 }
} as const;

/**
 * Common prompt templates
 */
export const TEMPLATES = {
  EXTRACT_TAGS: `Extract relevant tags from the following content. Return only a JSON array of strings.

Content:
{{content}}`,

  EXTRACT_MEMORIES: `Extract key insights, decisions, and learnings from the following content. Return a JSON array of objects with 'type' and 'content' fields.

Content:
{{content}}`,

  SUMMARIZE: `Provide a concise summary of the following content in {{maxWords}} words or less.

Content:
{{content}}`,

  ACTION_ITEMS: `Extract action items from the following content. Return a JSON array of objects with 'task', 'priority', and 'deadline' fields.

Content:
{{content}}`,

  CLASSIFY: `Classify the following content into one of these categories: {{categories}}

Content:
{{content}}

Return only the category name.`
} as const;

/**
 * Fluent prompt builder for Claude API
 */
export class PromptBuilder {
  private systemMessage?: string;
  private messages: MessageParam[] = [];
  private variables: PromptVariables = {};
  private responseFormat?: ResponseFormat;
  private estimatedInputTokens = 0;
  private estimatedOutputTokens = 0;
  private model = 'claude-3-5-sonnet-20241022';

  /**
   * Set the system prompt
   */
  system(content: string): this {
    this.systemMessage = content;
    this.estimatedInputTokens += this.estimateTokens(content);
    return this;
  }

  /**
   * Add a user message
   */
  user(content: string): this {
    this.messages.push({ role: 'user', content });
    this.estimatedInputTokens += this.estimateTokens(content);
    return this;
  }

  /**
   * Add an assistant message (for few-shot examples)
   */
  assistant(content: string): this {
    this.messages.push({ role: 'assistant', content });
    this.estimatedInputTokens += this.estimateTokens(content);
    return this;
  }

  /**
   * Use a predefined template
   */
  template(template: keyof typeof TEMPLATES | string, vars?: PromptVariables): this {
    const templateContent = typeof template === 'string' && template in TEMPLATES
      ? TEMPLATES[template as keyof typeof TEMPLATES]
      : template;

    if (vars) {
      Object.assign(this.variables, vars);
    }

    this.user(templateContent);
    return this;
  }

  /**
   * Set a template variable
   */
  variable(key: string, value: string | number | boolean | string[]): this {
    this.variables[key] = value;
    return this;
  }

  /**
   * Set multiple template variables
   */
  setVariables(vars: PromptVariables): this {
    Object.assign(this.variables, vars);
    return this;
  }

  /**
   * Expect JSON response with optional schema
   */
  expectJSON(schema?: Record<string, unknown>): this {
    this.responseFormat = { type: 'json', schema };

    // Add JSON instruction to system prompt
    const jsonInstruction = schema
      ? `\n\nYou must respond with valid JSON matching this schema:\n${JSON.stringify(schema, null, 2)}`
      : '\n\nYou must respond with valid JSON only.';

    if (this.systemMessage) {
      this.systemMessage += jsonInstruction;
    } else {
      this.systemMessage = jsonInstruction.trim();
    }

    return this;
  }

  /**
   * Expect a list response (array of items)
   */
  expectList(): this {
    this.responseFormat = { type: 'list' };
    return this;
  }

  /**
   * Set expected output tokens for cost estimation
   */
  expectTokens(count: number): this {
    this.estimatedOutputTokens = count;
    return this;
  }

  /**
   * Set the model for token cost estimation
   */
  useModel(model: string): this {
    this.model = model;
    return this;
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Replace variables in content
   */
  private replaceVariables(content: string): string {
    return Object.entries(this.variables).reduce((result, [key, value]) => {
      const placeholder = `{{${key}}}`;
      const replacement = Array.isArray(value) ? value.join(', ') : String(value ?? '');
      return result.replace(new RegExp(placeholder, 'g'), replacement);
    }, content);
  }

  /**
   * Calculate estimated cost in USD
   */
  estimateCost(): number {
    const pricing = TOKEN_PRICING[this.model as keyof typeof TOKEN_PRICING] ??
                   TOKEN_PRICING['claude-3-5-sonnet-20241022'];

    const inputCost = (this.estimatedInputTokens / 1_000_000) * pricing.input;
    const outputCost = (this.estimatedOutputTokens / 1_000_000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Get token usage estimate
   */
  getTokenEstimate(): { input: number; output: number; total: number; cost: number } {
    return {
      input: this.estimatedInputTokens,
      output: this.estimatedOutputTokens,
      total: this.estimatedInputTokens + this.estimatedOutputTokens,
      cost: this.estimateCost()
    };
  }

  /**
   * Build the final prompt
   */
  build(): {
    system?: string;
    messages: MessageParam[];
    responseFormat?: ResponseFormat;
    tokenEstimate: ReturnType<PromptBuilder['getTokenEstimate']>;
  } {
    // Replace variables in all messages
    const processedMessages = this.messages.map(msg => ({
      ...msg,
      content: typeof msg.content === 'string'
        ? this.replaceVariables(msg.content)
        : msg.content
    }));

    const processedSystem = this.systemMessage
      ? this.replaceVariables(this.systemMessage)
      : undefined;

    return {
      system: processedSystem,
      messages: processedMessages,
      responseFormat: this.responseFormat,
      tokenEstimate: this.getTokenEstimate()
    };
  }

  /**
   * Reset the builder for reuse
   */
  reset(): this {
    this.systemMessage = undefined;
    this.messages = [];
    this.variables = {};
    this.responseFormat = undefined;
    this.estimatedInputTokens = 0;
    this.estimatedOutputTokens = 0;
    return this;
  }
}

/**
 * Create a new prompt builder instance
 */
export function createPrompt(): PromptBuilder {
  return new PromptBuilder();
}
