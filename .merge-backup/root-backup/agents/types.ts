/**
 * Type definitions for Claude AI agent integration
 */

import type { MessageParam } from '@anthropic-ai/sdk/resources/messages.js';

/**
 * Configuration for Claude API client
 */
export interface ClaudeClientConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  circuitBreakerThreshold?: number;
}

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  maxRequestsPerMinute: number;
  maxRetries: number;
  retryDelayMs: number;
}

/**
 * Circuit breaker state
 */
export const CircuitBreakerState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
} as const;

export type CircuitBreakerState = typeof CircuitBreakerState[keyof typeof CircuitBreakerState];

/**
 * Response format for JSON parsing
 */
export interface ResponseFormat<T = unknown> {
  type: 'json' | 'text' | 'list';
  schema?: Record<string, unknown>;
  validator?: (data: unknown) => data is T;
}

/**
 * Parsed response from Claude API
 */
export interface ParsedResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rawResponse?: string;
  tokens?: {
    input: number;
    output: number;
  };
}

/**
 * Claude API request options
 */
export interface ClaudeRequestOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
  timeout?: number;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

/**
 * Prompt template variables
 */
export interface PromptVariables {
  [key: string]: string | number | boolean | string[] | undefined;
}

/**
 * Message role types
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * Structured message for prompt building
 */
export interface PromptMessage {
  role: MessageRole;
  content: string;
}

/**
 * Export MessageParam from SDK for external use
 */
export type { MessageParam };

/**
 * Re-export rule engine types
 */
export type {
  RuleTrigger,
  RuleContext,
  AgentRule,
  RuleExecutionLog,
  RuleStatistics,
  RulesEngineConfig,
} from './rules-engine.js';
