/**
 * GraphQL API Client for Knowledge Graph Agent Dashboard
 *
 * Features:
 * - Fetch-based GraphQL client
 * - WebSocket client for subscriptions
 * - Request interceptors for auth
 * - Error handling with retries
 * - Type-safe query/mutation helpers
 */

import type { ApiError } from './types.js';

// Default configuration
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY = 1000;
const DEFAULT_TIMEOUT = 30000;

export interface ClientConfig {
  baseUrl: string;
  wsUrl?: string;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  onError?: (error: ApiError) => void;
  onUnauthorized?: () => void;
}

export interface GraphQLRequest<TVariables = Record<string, unknown>> {
  query: string;
  variables?: TVariables;
  operationName?: string;
}

export interface GraphQLResponse<TData = unknown> {
  data?: TData;
  errors?: Array<{
    message: string;
    path?: (string | number)[];
    extensions?: Record<string, unknown>;
  }>;
}

export interface SubscriptionHandler<TData = unknown> {
  onData: (data: TData) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

type RequestInterceptor = (
  request: RequestInit
) => RequestInit | Promise<RequestInit>;

type ResponseInterceptor = (
  response: Response
) => Response | Promise<Response>;

/**
 * GraphQL Client with retry logic, interceptors, and subscription support
 */
export class GraphQLClient {
  private config: Required<ClientConfig>;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private authToken: string | null = null;
  private wsConnection: WebSocket | null = null;
  private subscriptionId = 0;
  private subscriptions: Map<number, { query: string; handler: SubscriptionHandler }> = new Map();

  constructor(config: ClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      wsUrl: config.wsUrl ?? config.baseUrl.replace(/^http/, 'ws'),
      timeout: config.timeout ?? DEFAULT_TIMEOUT,
      retryCount: config.retryCount ?? DEFAULT_RETRY_COUNT,
      retryDelay: config.retryDelay ?? DEFAULT_RETRY_DELAY,
      headers: config.headers ?? {},
      onError: config.onError ?? (() => {}),
      onUnauthorized: config.onUnauthorized ?? (() => {}),
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.requestInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor);
      if (index > -1) {
        this.responseInterceptors.splice(index, 1);
      }
    };
  }

  /**
   * Execute a GraphQL query with automatic retry
   */
  async query<TData = unknown, TVariables = Record<string, unknown>>(
    request: GraphQLRequest<TVariables>
  ): Promise<TData> {
    return this.executeWithRetry<TData, TVariables>(request);
  }

  /**
   * Execute a GraphQL mutation with automatic retry
   */
  async mutate<TData = unknown, TVariables = Record<string, unknown>>(
    request: GraphQLRequest<TVariables>
  ): Promise<TData> {
    return this.executeWithRetry<TData, TVariables>(request);
  }

  /**
   * Subscribe to GraphQL subscription via WebSocket
   */
  subscribe<TData = unknown>(
    query: string,
    variables: Record<string, unknown>,
    handler: SubscriptionHandler<TData>
  ): () => void {
    const id = ++this.subscriptionId;

    this.ensureWebSocketConnection();

    const subscriptionData = { query, handler: handler as SubscriptionHandler };
    this.subscriptions.set(id, subscriptionData);

    // Send subscription message
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        id: id.toString(),
        type: 'subscribe',
        payload: { query, variables },
      }));
    }

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(id);
      if (this.wsConnection?.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          id: id.toString(),
          type: 'complete',
        }));
      }
    };
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.subscriptions.clear();
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<TData, TVariables>(
    request: GraphQLRequest<TVariables>,
    attempt = 1
  ): Promise<TData> {
    try {
      return await this.execute<TData, TVariables>(request);
    } catch (error) {
      const apiError = error as ApiError;

      // Don't retry on client errors (4xx) except 429
      if (apiError.status >= 400 && apiError.status < 500 && apiError.status !== 429) {
        throw error;
      }

      // Don't retry on auth errors
      if (apiError.status === 401) {
        this.config.onUnauthorized();
        throw error;
      }

      // Retry if attempts remain
      if (attempt < this.config.retryCount) {
        const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
        await this.sleep(delay);
        return this.executeWithRetry<TData, TVariables>(request, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Execute GraphQL request
   */
  private async execute<TData, TVariables>(
    request: GraphQLRequest<TVariables>
  ): Promise<TData> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      let requestInit: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      };

      // Apply request interceptors
      for (const interceptor of this.requestInterceptors) {
        requestInit = await interceptor(requestInit);
      }

      let response = await fetch(`${this.config.baseUrl}/graphql`, requestInit);

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response);
      }

      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP ${response.status}`;

        try {
          const parsed = JSON.parse(errorBody);
          errorMessage = parsed.message || parsed.error || errorMessage;
        } catch {
          errorMessage = errorBody || errorMessage;
        }

        const apiError: ApiError = {
          code: `HTTP_${response.status}`,
          message: errorMessage,
          status: response.status,
        };

        this.config.onError(apiError);
        throw apiError;
      }

      const result: GraphQLResponse<TData> = await response.json();

      if (result.errors && result.errors.length > 0) {
        const apiError: ApiError = {
          code: 'GRAPHQL_ERROR',
          message: result.errors.map(e => e.message).join(', '),
          details: result.errors,
          status: 200,
        };

        this.config.onError(apiError);
        throw apiError;
      }

      if (!result.data) {
        const apiError: ApiError = {
          code: 'NO_DATA',
          message: 'No data returned from query',
          status: 200,
        };

        this.config.onError(apiError);
        throw apiError;
      }

      return result.data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Ensure WebSocket connection is established
   */
  private ensureWebSocketConnection(): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      return;
    }

    this.wsConnection = new WebSocket(this.config.wsUrl);

    this.wsConnection.onopen = () => {
      // Send connection init with auth token
      this.wsConnection?.send(JSON.stringify({
        type: 'connection_init',
        payload: this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {},
      }));

      // Re-subscribe to all existing subscriptions
      for (const [id, { query }] of this.subscriptions) {
        this.wsConnection?.send(JSON.stringify({
          id: id.toString(),
          type: 'subscribe',
          payload: { query },
        }));
      }
    };

    this.wsConnection.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'next': {
            const id = parseInt(message.id, 10);
            const subscription = this.subscriptions.get(id);
            if (subscription) {
              subscription.handler.onData(message.payload?.data);
            }
            break;
          }
          case 'error': {
            const id = parseInt(message.id, 10);
            const subscription = this.subscriptions.get(id);
            if (subscription?.handler.onError) {
              subscription.handler.onError(new Error(message.payload?.message ?? 'Unknown error'));
            }
            break;
          }
          case 'complete': {
            const id = parseInt(message.id, 10);
            const subscription = this.subscriptions.get(id);
            if (subscription?.handler.onComplete) {
              subscription.handler.onComplete();
            }
            this.subscriptions.delete(id);
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    this.wsConnection.onerror = (event) => {
      console.error('WebSocket error:', event);
      // Notify all subscriptions of the error
      for (const [, { handler }] of this.subscriptions) {
        handler.onError?.(new Error('WebSocket connection error'));
      }
    };

    this.wsConnection.onclose = () => {
      // Attempt to reconnect after delay
      setTimeout(() => {
        if (this.subscriptions.size > 0) {
          this.ensureWebSocketConnection();
        }
      }, this.config.retryDelay);
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Default client instance
let defaultClient: GraphQLClient | null = null;

/**
 * Initialize the default GraphQL client
 */
export function initializeClient(config: ClientConfig): GraphQLClient {
  defaultClient = new GraphQLClient(config);
  return defaultClient;
}

/**
 * Get the default GraphQL client
 */
export function getClient(): GraphQLClient {
  if (!defaultClient) {
    throw new Error(
      'GraphQL client not initialized. Call initializeClient() first.'
    );
  }
  return defaultClient;
}

/**
 * Type-safe query helper
 */
export async function query<TData = unknown, TVariables = Record<string, unknown>>(
  queryString: string,
  variables?: TVariables,
  operationName?: string
): Promise<TData> {
  return getClient().query<TData, TVariables>({
    query: queryString,
    variables,
    operationName,
  });
}

/**
 * Type-safe mutation helper
 */
export async function mutate<TData = unknown, TVariables = Record<string, unknown>>(
  mutation: string,
  variables?: TVariables,
  operationName?: string
): Promise<TData> {
  return getClient().mutate<TData, TVariables>({
    query: mutation,
    variables,
    operationName,
  });
}

/**
 * Type-safe subscription helper
 */
export function subscribe<TData = unknown>(
  subscription: string,
  variables: Record<string, unknown>,
  handler: SubscriptionHandler<TData>
): () => void {
  return getClient().subscribe<TData>(subscription, variables, handler);
}
