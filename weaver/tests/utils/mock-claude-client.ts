/**
 * Mock Claude Client for Testing
 *
 * Provides a mock implementation of ClaudeClient for testing agents
 * without making actual API calls.
 */

import type { ClaudeResponse, ResponseFormat } from '../../src/agents/types.js';

export interface MockResponse {
  content: string;
  tokens?: { input: number; output: number };
  delay?: number;
}

export class MockClaudeClient {
  private responses: Map<string, MockResponse[]> = new Map();
  private callHistory: Array<{ prompt: string; options?: any }> = [];
  private currentIndex: Map<string, number> = new Map();

  /**
   * Add a mock response for a specific prompt pattern
   */
  addResponse(pattern: string, response: MockResponse): void {
    if (!this.responses.has(pattern)) {
      this.responses.set(pattern, []);
    }
    this.responses.get(pattern)!.push(response);
  }

  /**
   * Add multiple responses for sequential calls
   */
  addSequentialResponses(pattern: string, responses: MockResponse[]): void {
    this.responses.set(pattern, responses);
  }

  /**
   * Send a message and get mock response
   */
  async sendMessage(
    prompt: string,
    options?: { responseFormat?: ResponseFormat }
  ): Promise<ClaudeResponse<any>> {
    this.callHistory.push({ prompt, options });

    // Find matching response
    let matchedPattern: string | undefined;
    let response: MockResponse | undefined;

    for (const [pattern, responses] of this.responses.entries()) {
      if (prompt.includes(pattern) || pattern === '*') {
        matchedPattern = pattern;
        const index = this.currentIndex.get(pattern) || 0;
        response = responses[Math.min(index, responses.length - 1)];
        this.currentIndex.set(pattern, index + 1);
        break;
      }
    }

    if (!response) {
      // Default response
      response = {
        content: 'Mock response',
        tokens: { input: 10, output: 5 },
      };
    }

    // Simulate delay if specified
    if (response.delay) {
      await new Promise(resolve => setTimeout(resolve, response.delay));
    }

    // Parse response based on format
    let data: any = response.content;
    if (options?.responseFormat?.type === 'json') {
      try {
        data = JSON.parse(response.content);
      } catch {
        return {
          success: false,
          error: 'Failed to parse JSON',
          rawResponse: response.content,
        };
      }
    } else if (options?.responseFormat?.type === 'list') {
      data = response.content.split('\n').filter(line => line.trim());
    }

    return {
      success: true,
      data,
      tokens: response.tokens,
      rawResponse: response.content,
    };
  }

  /**
   * Get call history
   */
  getCallHistory(): Array<{ prompt: string; options?: any }> {
    return [...this.callHistory];
  }

  /**
   * Get number of calls made
   */
  getCallCount(): number {
    return this.callHistory.length;
  }

  /**
   * Check if a specific prompt was called
   */
  wasCalledWith(pattern: string): boolean {
    return this.callHistory.some(call => call.prompt.includes(pattern));
  }

  /**
   * Reset mock state
   */
  reset(): void {
    this.responses.clear();
    this.callHistory = [];
    this.currentIndex.clear();
  }

  /**
   * Get configuration (for compatibility)
   */
  getConfig(): any {
    return {
      apiKey: 'mock-api-key',
      model: 'claude-3-5-sonnet-20241022',
      timeout: 30000,
    };
  }
}

/**
 * Create a mock Claude client with common test responses
 */
export function createMockClaudeClient(): MockClaudeClient {
  const client = new MockClaudeClient();

  // Add common responses
  client.addResponse('*', {
    content: 'This is a mock response for testing.',
    tokens: { input: 10, output: 20 },
  });

  client.addResponse('extract tags', {
    content: JSON.stringify({ tags: ['test', 'mock', 'example'] }),
    tokens: { input: 15, output: 10 },
  });

  client.addResponse('summarize', {
    content: 'This is a concise summary of the content.',
    tokens: { input: 100, output: 20 },
  });

  client.addResponse('generate ideas', {
    content: 'idea1\nidea2\nidea3',
    tokens: { input: 20, output: 15 },
  });

  return client;
}

/**
 * Create a mock client that simulates errors
 */
export function createErrorMockClient(): MockClaudeClient {
  const client = new MockClaudeClient();

  client.addResponse('*', {
    content: 'error',
    tokens: { input: 10, output: 5 },
  });

  return client;
}

/**
 * Create a mock client with realistic delays
 */
export function createRealisticMockClient(): MockClaudeClient {
  const client = new MockClaudeClient();

  client.addResponse('*', {
    content: 'Response with realistic timing',
    tokens: { input: 50, output: 100 },
    delay: 500, // 500ms delay
  });

  return client;
}
