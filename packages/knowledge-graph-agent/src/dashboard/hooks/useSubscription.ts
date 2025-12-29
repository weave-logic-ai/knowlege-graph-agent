/**
 * useSubscription Hook
 *
 * Hook for managing GraphQL subscriptions and SSE (Server-Sent Events).
 * Provides real-time data updates with automatic reconnection.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribe, type SubscriptionHandler } from '../lib/api/index.js';

// SSE connection states
export type SSEState = 'connecting' | 'open' | 'closed' | 'error';

// SSE options
export interface SSEOptions<T> {
  url: string;
  onMessage: (data: T) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  enabled?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  withCredentials?: boolean;
}

// GraphQL subscription options
export interface SubscriptionOptions<T> {
  query: string;
  variables?: Record<string, unknown>;
  onData: (data: T) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  enabled?: boolean;
}

/**
 * Hook for SSE (Server-Sent Events) subscriptions
 */
export function useSSE<T = unknown>(options: SSEOptions<T>) {
  const {
    url,
    onMessage,
    onError,
    onOpen,
    onClose,
    enabled = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
    withCredentials = false,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [state, setState] = useState<SSEState>('closed');
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState('connecting');

    const eventSource = new EventSource(url, { withCredentials });
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setState('open');
      reconnectAttemptsRef.current = 0;
      onOpen?.();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as T;
        setLastEventTime(new Date());
        onMessage(data);
      } catch (error) {
        console.error('SSE message parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      setState('error');
      onError?.(error);

      // Close the connection
      eventSource.close();
      eventSourceRef.current = null;

      // Attempt reconnection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      } else {
        setState('closed');
        onClose?.();
      }
    };
  }, [url, enabled, onMessage, onError, onOpen, onClose, reconnectDelay, maxReconnectAttempts, withCredentials]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState('closed');
    reconnectAttemptsRef.current = 0;
    onClose?.();
  }, [onClose]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    connect();
  }, [disconnect, connect]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    state,
    isConnected: state === 'open',
    isConnecting: state === 'connecting',
    hasError: state === 'error',
    lastEventTime,
    reconnect,
    disconnect,
  };
}

/**
 * Hook for GraphQL subscriptions via WebSocket
 */
export function useGraphQLSubscription<T = unknown>(options: SubscriptionOptions<T>) {
  const {
    query: subscriptionQuery,
    variables = {},
    onData,
    onError,
    onComplete,
    enabled = true,
  } = options;

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        setIsSubscribed(false);
      }
      return;
    }

    const handler: SubscriptionHandler<T> = {
      onData,
      onError: (error) => {
        setIsSubscribed(false);
        onError?.(error);
      },
      onComplete: () => {
        setIsSubscribed(false);
        onComplete?.();
      },
    };

    unsubscribeRef.current = subscribe<T>(subscriptionQuery, variables, handler);
    setIsSubscribed(true);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        setIsSubscribed(false);
      }
    };
  }, [enabled, subscriptionQuery, JSON.stringify(variables), onData, onError, onComplete]);

  const unsubscribe = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      setIsSubscribed(false);
    }
  }, []);

  return {
    isSubscribed,
    unsubscribe,
  };
}

// Predefined subscription queries
const WORKFLOW_STATUS_SUBSCRIPTION = `
  subscription OnWorkflowStatus($workflowId: ID!) {
    workflowStatus(workflowId: $workflowId) {
      id
      status
      currentStep
      progress
      error
    }
  }
`;

const AGENT_ACTIVITY_SUBSCRIPTION = `
  subscription OnAgentActivity($agentId: ID) {
    agentActivity(agentId: $agentId) {
      id
      agentId
      type
      title
      description
      timestamp
      metadata
    }
  }
`;

const AUDIT_EVENTS_SUBSCRIPTION = `
  subscription OnAuditEvent {
    auditEvent {
      id
      sequence
      envelope {
        id
        hlc {
          physicalMs
          logical
          nodeId
        }
        payload {
          type
          timestamp
          action
        }
      }
      hash
    }
  }
`;

const NOTIFICATIONS_SUBSCRIPTION = `
  subscription OnNotification {
    notification {
      id
      type
      title
      message
      timestamp
      action {
        label
        href
      }
    }
  }
`;

/**
 * Hook for workflow status subscription
 */
export function useWorkflowStatusSubscription(
  workflowId: string,
  options?: {
    enabled?: boolean;
    onStatusChange?: (status: unknown) => void;
  }
) {
  const queryClient = useQueryClient();

  return useGraphQLSubscription({
    query: WORKFLOW_STATUS_SUBSCRIPTION,
    variables: { workflowId },
    enabled: options?.enabled ?? !!workflowId,
    onData: (data) => {
      // Update query cache
      queryClient.setQueryData(['workflow', workflowId, 'execution'], data);
      options?.onStatusChange?.(data);
    },
  });
}

/**
 * Hook for agent activity subscription
 */
export function useAgentActivitySubscription(
  agentId?: string,
  options?: {
    enabled?: boolean;
    onActivity?: (activity: unknown) => void;
  }
) {
  const queryClient = useQueryClient();

  return useGraphQLSubscription({
    query: AGENT_ACTIVITY_SUBSCRIPTION,
    variables: agentId ? { agentId } : {},
    enabled: options?.enabled ?? true,
    onData: (data) => {
      // Prepend to activity query cache
      queryClient.setQueryData(
        ['agents', 'activity', agentId],
        (old: { data: unknown[] } | undefined) => {
          if (!old) return { data: [data], hasMore: true };
          return {
            ...old,
            data: [data, ...old.data].slice(0, 100),
          };
        }
      );
      options?.onActivity?.(data);
    },
  });
}

/**
 * Hook for audit events subscription
 */
export function useAuditEventsSubscription(
  options?: {
    enabled?: boolean;
    onEvent?: (event: unknown) => void;
  }
) {
  const queryClient = useQueryClient();

  return useGraphQLSubscription({
    query: AUDIT_EVENTS_SUBSCRIPTION,
    enabled: options?.enabled ?? true,
    onData: (data) => {
      // Prepend to audit events cache
      queryClient.setQueryData(
        ['audit', 'events'],
        (old: { events: unknown[] } | undefined) => {
          if (!old) return { events: [data], hasMore: true };
          return {
            ...old,
            events: [data, ...old.events],
          };
        }
      );
      options?.onEvent?.(data);
    },
  });
}

/**
 * Hook for notifications subscription
 */
export function useNotificationsSubscription(
  options?: {
    enabled?: boolean;
    onNotification?: (notification: unknown) => void;
  }
) {
  return useGraphQLSubscription({
    query: NOTIFICATIONS_SUBSCRIPTION,
    enabled: options?.enabled ?? true,
    onData: (data) => {
      options?.onNotification?.(data);
    },
  });
}

/**
 * Hook for SSE workflow status updates
 */
export function useWorkflowSSE(
  workflowId: string,
  options?: {
    enabled?: boolean;
    onUpdate?: (data: unknown) => void;
  }
) {
  const queryClient = useQueryClient();

  return useSSE({
    url: `/api/workflows/${workflowId}/status`,
    enabled: options?.enabled ?? !!workflowId,
    onMessage: (data) => {
      queryClient.setQueryData(['workflow', workflowId, 'execution'], data);
      options?.onUpdate?.(data);
    },
  });
}

/**
 * Hook for SSE notifications stream
 */
export function useNotificationsSSE(
  options?: {
    enabled?: boolean;
    onNotification?: (notification: unknown) => void;
  }
) {
  return useSSE({
    url: '/api/notifications/stream',
    enabled: options?.enabled ?? true,
    onMessage: (data) => {
      options?.onNotification?.(data);
    },
  });
}

/**
 * Hook for SSE agent activity stream
 */
export function useAgentActivitySSE(
  agentId?: string,
  options?: {
    enabled?: boolean;
    onActivity?: (activity: unknown) => void;
  }
) {
  const queryClient = useQueryClient();
  const url = agentId
    ? `/api/agents/activity/stream?agentId=${agentId}`
    : '/api/agents/activity/stream';

  return useSSE({
    url,
    enabled: options?.enabled ?? true,
    onMessage: (data) => {
      queryClient.setQueryData(
        ['agents', 'activity', agentId],
        (old: { data: unknown[] } | undefined) => {
          if (!old) return { data: [data], hasMore: true };
          return {
            ...old,
            data: [data, ...old.data].slice(0, 100),
          };
        }
      );
      options?.onActivity?.(data);
    },
  });
}

/**
 * Hook for SSE audit events stream
 */
export function useAuditEventsSSE(
  options?: {
    enabled?: boolean;
    onEvent?: (event: unknown) => void;
  }
) {
  const queryClient = useQueryClient();

  return useSSE({
    url: '/api/audit/stream',
    enabled: options?.enabled ?? true,
    onMessage: (data) => {
      queryClient.setQueryData(
        ['audit', 'events'],
        (old: { events: unknown[] } | undefined) => {
          if (!old) return { events: [data], hasMore: true };
          return {
            ...old,
            events: [data, ...old.events],
          };
        }
      );
      options?.onEvent?.(data);
    },
  });
}
