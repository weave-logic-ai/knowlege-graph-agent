/**
 * Claude AI Agent Integration
 *
 * Provides robust integration with Anthropic's Claude API including:
 * - Client with retry logic and circuit breaker
 * - Fluent prompt builder with templates
 * - Response parsing with error handling
 * - Token counting and cost estimation
 * - Rate limiting
 *
 * @example
 * ```typescript
 * import { ClaudeClient, PromptBuilder } from './agents';
 *
 * const client = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY! });
 *
 * const prompt = new PromptBuilder()
 *   .system('You are a helpful assistant')
 *   .template('EXTRACT_TAGS', { content: 'document text' })
 *   .expectJSON()
 *   .build();
 *
 * const result = await client.sendMessage(prompt.messages, {
 *   systemPrompt: prompt.system,
 *   responseFormat: prompt.responseFormat
 * });
 * ```
 */

export { ClaudeClient, createClaudeClient } from './claude-client.js';
export { PromptBuilder, createPrompt, TEMPLATES } from './prompt-builder.js';
export type {
  ClaudeClientConfig,
  ClaudeRequestOptions,
  ParsedResponse,
  TokenUsage,
  CircuitBreakerState,
  ResponseFormat,
  PromptVariables,
  MessageRole,
  PromptMessage,
  MessageParam
} from './types.js';
