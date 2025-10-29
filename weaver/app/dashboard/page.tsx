'use client';

/**
 * Main Monitoring Dashboard
 *
 * Real-time system monitoring with:
 * - Live metrics updates
 * - Health status overview
 * - Recent alerts
 * - System resources
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SystemMetrics {
  timestamp: string;
  system: {
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    uptime: number;
  };
  services?: Record<string, unknown>;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  source: string;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const websocket = new WebSocket('ws://localhost:3001');

    websocket.onopen = () => {
      console.log('Connected to monitoring WebSocket');
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'metrics') {
          setMetrics(message.data);
        } else if (message.type === 'alert') {
          setAlerts((prev) => [...prev, message.data].slice(-10)); // Keep last 10
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number): string => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Weaver Monitoring Dashboard
            </h1>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  connected
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}
                ></span>
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              href="/dashboard"
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 dark:text-blue-400"
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
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Health
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Memory Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Memory Usage
            </h3>
            {metrics ? (
              <>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatBytes(metrics.system.memory.heapUsed)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  of {formatBytes(metrics.system.memory.heapTotal)}
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold text-gray-400">--</p>
            )}
          </div>

          {/* Uptime Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              System Uptime
            </h3>
            {metrics ? (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatUptime(metrics.system.uptime)}
              </p>
            ) : (
              <p className="text-2xl font-bold text-gray-400">--</p>
            )}
          </div>

          {/* Alerts Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Recent Alerts
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {alerts.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {alerts.filter((a) => a.severity === 'critical').length} critical
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              System Status
            </h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              Healthy
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All systems operational</p>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Alerts</h2>
          </div>
          <div className="p-6">
            {alerts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No alerts to display
              </p>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}
                    >
                      {alert.severity}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {alert.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {alert.source} • {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Metrics */}
        {metrics && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                System Metrics
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Memory Details
                  </h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600 dark:text-gray-300">RSS:</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatBytes(metrics.system.memory.rss)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600 dark:text-gray-300">Heap Used:</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatBytes(metrics.system.memory.heapUsed)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600 dark:text-gray-300">Heap Total:</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatBytes(metrics.system.memory.heapTotal)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600 dark:text-gray-300">External:</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatBytes(metrics.system.memory.external)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    Last Updated
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(metrics.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
