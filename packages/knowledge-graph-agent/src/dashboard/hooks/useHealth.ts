/**
 * useHealth Hook
 *
 * TanStack Query hook for monitoring system health.
 * Provides real-time health status with automatic polling.
 */

import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  query,
  type SystemHealth,
  type ServiceHealth,
  GET_SYSTEM_HEALTH,
  GET_SERVICE_HEALTH,
  type GetSystemHealthResponse,
  type GetServiceHealthResponse,
  type GetServiceHealthVariables,
} from '../lib/api/index.js';

// Query keys for cache management
export const healthKeys = {
  all: ['health'] as const,
  system: () => [...healthKeys.all, 'system'] as const,
  service: (name: string) => [...healthKeys.all, 'service', name] as const,
  services: () => [...healthKeys.all, 'services'] as const,
};

// Known service names
export const KNOWN_SERVICES = [
  'sqlite',
  'vector-store',
  'audit-chain',
  'workflow-engine',
  'agent-registry',
  'cache-layer',
  'mcp-server',
] as const;

export type ServiceName = typeof KNOWN_SERVICES[number];

/**
 * Hook to fetch system health status
 */
export function useSystemHealth(
  options?: Omit<UseQueryOptions<GetSystemHealthResponse, Error, SystemHealth>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: healthKeys.system(),
    queryFn: () => query<GetSystemHealthResponse>(GET_SYSTEM_HEALTH),
    select: (data) => data.systemHealth,
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Poll every 30 seconds
    refetchIntervalInBackground: true, // Keep polling when tab is inactive
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

/**
 * Hook to fetch individual service health
 */
export function useServiceHealth(
  name: string,
  options?: Omit<UseQueryOptions<GetServiceHealthResponse, Error, ServiceHealth>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: healthKeys.service(name),
    queryFn: () => query<GetServiceHealthResponse, GetServiceHealthVariables>(
      GET_SERVICE_HEALTH,
      { name }
    ),
    select: (data) => data.serviceHealth,
    enabled: !!name,
    staleTime: 30000,
    refetchInterval: 30000,
    ...options,
  });
}

/**
 * Hook to fetch all services health individually
 */
export function useAllServicesHealth(
  services: string[] = [...KNOWN_SERVICES]
) {
  const queryClient = useQueryClient();

  const systemHealth = useSystemHealth();

  return {
    ...systemHealth,
    services: systemHealth.data?.services ?? [],
    refetchAll: () => {
      queryClient.invalidateQueries({ queryKey: healthKeys.all });
    },
  };
}

/**
 * Computed health indicators
 */
export function useHealthIndicators() {
  const { data: health, isLoading, isError } = useSystemHealth();

  if (isLoading || !health) {
    return {
      isLoading,
      isError,
      overallStatus: 'unknown' as const,
      healthyCount: 0,
      degradedCount: 0,
      unhealthyCount: 0,
      totalCount: 0,
      uptime: 0,
      uptimeFormatted: '--:--:--',
    };
  }

  const healthyCount = health.services.filter(s => s.status === 'up').length;
  const degradedCount = health.services.filter(s => s.status === 'degraded').length;
  const unhealthyCount = health.services.filter(s => s.status === 'down').length;

  // Format uptime
  const uptimeSeconds = health.uptime;
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  const uptimeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return {
    isLoading,
    isError,
    overallStatus: health.status,
    healthyCount,
    degradedCount,
    unhealthyCount,
    totalCount: health.services.length,
    uptime: health.uptime,
    uptimeFormatted,
    lastCheck: health.lastCheck,
    services: health.services,
  };
}

/**
 * Hook to get service latency trends
 */
export function useServiceLatencies() {
  const { data: health } = useSystemHealth();

  if (!health) {
    return {
      services: [],
      avgLatency: 0,
      maxLatency: 0,
      minLatency: 0,
    };
  }

  const servicesWithLatency = health.services
    .filter(s => s.latency !== undefined)
    .map(s => ({
      name: s.name,
      latency: s.latency!,
      status: s.status,
    }))
    .sort((a, b) => b.latency - a.latency);

  const latencies = servicesWithLatency.map(s => s.latency);
  const avgLatency = latencies.length > 0
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;

  return {
    services: servicesWithLatency,
    avgLatency,
    maxLatency: Math.max(...latencies, 0),
    minLatency: Math.min(...latencies, 0),
  };
}

/**
 * Hook to invalidate health queries
 */
export function useInvalidateHealth() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: healthKeys.all }),
    invalidateSystem: () => queryClient.invalidateQueries({ queryKey: healthKeys.system() }),
    invalidateService: (name: string) =>
      queryClient.invalidateQueries({ queryKey: healthKeys.service(name) }),
  };
}

/**
 * Hook to check if system is healthy
 */
export function useIsSystemHealthy() {
  const { data: health, isLoading } = useSystemHealth();

  return {
    isHealthy: health?.status === 'healthy',
    isLoading,
    status: health?.status ?? 'unknown',
  };
}

/**
 * Hook to get service status by name
 */
export function useServiceStatus(serviceName: string) {
  const { data: health, isLoading } = useSystemHealth();

  const service = health?.services.find(s => s.name === serviceName);

  return {
    service,
    isLoading,
    isUp: service?.status === 'up',
    isDegraded: service?.status === 'degraded',
    isDown: service?.status === 'down',
    status: service?.status ?? 'unknown',
    latency: service?.latency,
    message: service?.message,
  };
}
