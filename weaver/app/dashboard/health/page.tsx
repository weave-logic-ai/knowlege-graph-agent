'use client';

/**
 * Health Status Dashboard Page
 *
 * Comprehensive health monitoring:
 * - Service health status
 * - Health check history
 * - Dependency status
 * - System resources
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  message?: string;
  duration_ms?: number;
}

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  timestamp: string;
  checks: HealthCheck[];
}

export default function HealthPage() {
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket server
    const websocket = new WebSocket('ws://localhost:3001');

    websocket.onopen = () => {
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'health') {
          setServices((prev) => {
            const existing = prev.find((s) => s.service === message.data.service);
            if (existing) {
              return prev.map((s) =>
                s.service === message.data.service ? { ...s, ...message.data.status } : s
              );
            }
            return [...prev, { service: message.data.service, ...message.data.status }];
          });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    websocket.onerror = () => setConnected(false);
    websocket.onclose = () => setConnected(false);

    // Mock initial data
    setServices([
      {
        service: 'MCP Server',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: [
          { name: 'HTTP Endpoint', status: 'healthy', message: 'HTTP 200 - OK', duration_ms: 45 },
          { name: 'TCP Port', status: 'healthy', message: 'Port 3000 is accessible', duration_ms: 12 },
        ],
      },
      {
        service: 'Workflow Engine',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: [
          { name: 'Process Running', status: 'healthy', message: 'Process active', duration_ms: 5 },
          { name: 'Memory Usage', status: 'healthy', message: 'Within limits', duration_ms: 3 },
        ],
      },
    ]);

    return () => {
      websocket.close();
    };
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'unhealthy':
        return '✗';
      default:
        return '?';
    }
  };

  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const unhealthyCount = services.filter((s) => s.status === 'unhealthy').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Status</h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/dashboard"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/metrics"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Metrics
            </Link>
            <Link
              href="/dashboard/health"
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              Health
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Total Services
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{services.length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Healthy</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {healthyCount}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Degraded</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {degradedCount}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Unhealthy
            </h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{unhealthyCount}</p>
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-6">
          {services.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No services to display</p>
            </div>
          ) : (
            services.map((service) => (
              <div key={service.service} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${getStatusColor(service.status)}`}
                    >
                      {getStatusIcon(service.status)}
                    </span>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {service.service}
                    </h2>
                  </div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}
                  >
                    {service.status}
                  </span>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {service.checks.map((check, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getStatusColor(check.status)}`}
                          >
                            {getStatusIcon(check.status)}
                          </span>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {check.name}
                            </h4>
                            {check.message && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                {check.message}
                              </p>
                            )}
                          </div>
                        </div>
                        {check.duration_ms !== undefined && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {check.duration_ms}ms
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last checked: {new Date(service.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
