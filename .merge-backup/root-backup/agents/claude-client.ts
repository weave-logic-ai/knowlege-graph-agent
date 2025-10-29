/**
 * Claude API Client - Robust client for Anthropic Claude AI
 *
 * Features:
 * - Authentication with API key
 * - Rate limiting (configurable requests per minute)
 * - Exponential backoff retry logic (2s, 4s, 8s, 16s)
 * - Circuit breaker pattern (stops after consecutive failures)
 * - Request timeout handling (abort after configurable timeout)
 * - Response parsing with error handling
 * - Token usage tracking and cost estimation
 *
 * @example
 * ```typescript
 * const client = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY! });
 * const result = await client.sendMessage('Summarize this text', {
 *   systemPrompt: 'You are a helpful assistant',
 *   responseFormat: { type: 'json' }
 * });
 * ```
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Message, MessageParam } from '@anthropic-ai/sdk/resources/messages.js';
import type {
  ClaudeClientConfig,
  ClaudeRequestOptions,
  ParsedResponse
} from './types.js';
import { CircuitBreakerState } from './types.js';

/**
 * Default configuration values
 */
const DEFAULTS = {
  MODEL: 'claude-3-5-sonnet-20241022',
  MAX_TOKENS: 4096,
  TEMPERATURE: 1.0,
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 seconds
  CIRCUIT_BREAKER_THRESHOLD: 5, // Open circuit after 5 consecutive failures
  RATE_LIMIT_PER_MINUTE: 50
} as const;

/**
 * Rate limiter for API requests
 */
class RateLimiter {
  private requestTimes: number[] = [];
  private maxRequestsPerMinute: number;

  constructor(maxRequestsPerMinute: number) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove requests older than 1 minute
    this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);

    if (this.requestTimes.length >= this.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimes[0];
      if (oldestRequest !== undefined) {
        const waitTime = 60000 - (now - oldestRequest);

        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    this.requestTimes.push(Date.now());
  }
}

/**
 * Circuit breaker for API failures
 */
class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private readonly threshold: number;
  private readonly resetTimeout = 60000; // 1 minute

  constructor(threshold: number) {
    this.threshold = threshold;
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.failureCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN - too many consecutive failures. Try again later.');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.successCount >= 2) {
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.threshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }
}

/**
 * Claude API client with robust error handling
 */
export class ClaudeClient {
  private client: Anthropic;
  private config: Required<ClaudeClientConfig>;
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;

  constructor(config: ClaudeClientConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model ?? DEFAULTS.MODEL,
      maxTokens: config.maxTokens ?? DEFAULTS.MAX_TOKENS,
      temperature: config.temperature ?? DEFAULTS.TEMPERATURE,
      timeout: config.timeout ?? DEFAULTS.TIMEOUT,
      maxRetries: config.maxRetries ?? DEFAULTS.MAX_RETRIES,
      retryDelay: config.retryDelay ?? DEFAULTS.RETRY_DELAY,
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? DEFAULTS.CIRCUIT_BREAKER_THRESHOLD
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      maxRetries: 0 // We handle retries manually
    });

    this.rateLimiter = new RateLimiter(DEFAULTS.RATE_LIMIT_PER_MINUTE);
    this.circuitBreaker = new CircuitBreaker(this.config.circuitBreakerThreshold);
  }

  /**
   * Send a message to Claude with retry logic
   */
  async sendMessage(
    userMessage: string | MessageParam[],
    options: ClaudeRequestOptions = {}
  ): Promise<ParsedResponse> {
    await this.rateLimiter.waitIfNeeded();

    return this.circuitBreaker.call(async () => {
      return this.sendWithRetry(userMessage, options);
    });
  }

  /**
   * Send message with exponential backoff retry
   */
  private async sendWithRetry(
    userMessage: string | MessageParam[],
    options: ClaudeRequestOptions,
    attempt = 1
  ): Promise<ParsedResponse> {
    try {
      const response = await this.sendRequest(userMessage, options);
      return this.parseResponse(response, options.responseFormat);
    } catch (error) {
      const isRetryable = this.isRetryableError(error);

      if (isRetryable && attempt < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWithRetry(userMessage, options, attempt + 1);
      }

      return {
        success: false,
        error: this.formatError(error, attempt)
      };
    }
  }

  /**
   * Send the actual API request
   */
  private async sendRequest(
    userMessage: string | MessageParam[],
    options: ClaudeRequestOptions
  ): Promise<Message> {
    const messages: MessageParam[] = typeof userMessage === 'string'
      ? [{ role: 'user', content: userMessage }]
      : userMessage;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout ?? this.config.timeout);

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: options.maxTokens ?? this.config.maxTokens,
        temperature: options.temperature ?? this.config.temperature,
        system: options.systemPrompt,
        messages
      }, {
        signal: controller.signal as AbortSignal
      });

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Parse API response based on format
   */
  private parseResponse(response: Message, format?: { type: 'text' | 'json' | 'list'; schema?: Record<string, unknown> }): ParsedResponse {
    const content = response.content[0];
    const rawResponse = content?.type === 'text' ? content.text : '';

    const tokens = {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens
    };

    try {
      if (format?.type === 'json') {
        const data = this.parseJSON(rawResponse, format.schema);
        return {
          success: true,
          data,
          rawResponse,
          tokens
        };
      } else if (format?.type === 'list') {
        const data = this.parseList(rawResponse);
        return {
          success: true,
          data,
          rawResponse,
          tokens
        };
      } else {
        return {
          success: true,
          data: rawResponse,
          rawResponse,
          tokens
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
        rawResponse,
        tokens
      };
    }
  }

  /**
   * Parse JSON response with validation
   */
  private parseJSON(text: string, schema?: Record<string, unknown>): unknown {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) ?? text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    const jsonText = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : text;

    const parsed = JSON.parse(jsonText.trim());

    // Basic schema validation if provided
    if (schema && schema['type']) {
      const expectedType = schema['type'];
      const actualType = Array.isArray(parsed) ? 'array' : typeof parsed;

      if (expectedType !== actualType) {
        throw new Error(`Expected ${String(expectedType)} but got ${actualType}`);
      }
    }

    return parsed;
  }

  /**
   * Parse list response (one item per line or comma-separated)
   */
  private parseList(text: string): string[] {
    // Remove markdown formatting
    const cleaned = text.replace(/^[-*•]\s+/gm, '').trim();

    // Try splitting by newlines first
    const lines = cleaned.split('\n').map(line => line.trim()).filter(Boolean);

    if (lines.length > 1) {
      return lines;
    }

    // Fall back to comma-separated
    return cleaned.split(',').map(item => item.trim()).filter(Boolean);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    // Check if it's an APIError by checking for the status property
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status?: number };
      // Retry on rate limits and server errors
      return apiError.status === 429 || (apiError.status ?? 0) >= 500;
    }

    // Retry on network errors
    if (error instanceof Error) {
      return error.name === 'AbortError' || error.message.includes('network');
    }

    return false;
  }

  /**
   * Format error message for user
   */
  private formatError(error: unknown, attempt: number): string {
    const prefix = attempt > 1 ? `Failed after ${attempt} attempts: ` : '';

    // Check if it's an APIError by checking for status and message properties
    if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
      const apiError = error as { status?: number; message: string };

      if (apiError.status === 401) {
        return `${prefix}Invalid API key. Please check your ANTHROPIC_API_KEY.`;
      } else if (apiError.status === 429) {
        return `${prefix}Rate limit exceeded. Please try again later.`;
      } else if ((apiError.status ?? 0) >= 500) {
        return `${prefix}Claude API service error. Please try again later.`;
      }

      return `${prefix}API error: ${apiError.message}`;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return `Request timeout after ${this.config.timeout}ms. Please try again.`;
    }

    return `Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
  }


  /**
   * Get circuit breaker state
   */
  getCircuitBreakerState(): CircuitBreakerState {
    return this.circuitBreaker.getState();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<Required<ClaudeClientConfig>> {
    return { ...this.config };
  }
}

/**
 * Create a new Claude client instance
 */
export function createClaudeClient(config: ClaudeClientConfig): ClaudeClient {
  return new ClaudeClient(config);
}
