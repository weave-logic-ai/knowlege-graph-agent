'use client';

/**
 * Metrics Dashboard Page
 *
 * Detailed metrics visualization with charts:
 * - CPU usage over time
 * - Memory usage trends
 * - Request rate
 * - Response time
 * - Error rate
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MetricDataPoint {
  timestamp: string;
  value: number;
}

interface MetricsData {
  cpu: MetricDataPoint[];
  memory: MetricDataPoint[];
  requests: MetricDataPoint[];
  errors: MetricDataPoint[];
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData>({
    cpu: [],
    memory: [],
    requests: [],
    errors: [],
  });
  const [connected, setConnected] = useState(false);
  const [timeRange, setTimeRange] = useState<'1m' | '5m' | '15m' | '1h'>('5m');

  useEffect(() => {
    // Connect to WebSocket server
    const websocket = new WebSocket('ws://localhost:3001');

    websocket.onopen = () => {
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'metrics') {
          const timestamp = new Date().toISOString();
          const data = message.data;

          setMetrics((prev) => {
            const maxPoints = getMaxPoints(timeRange);

            return {
              cpu: [...prev.cpu, { timestamp, value: getCpuUsage(data) }].slice(-maxPoints),
              memory: [...prev.memory, { timestamp, value: getMemoryUsage(data) }].slice(
                -maxPoints
              ),
              requests: [...prev.requests, { timestamp, value: getRequestRate(data) }].slice(
                -maxPoints
              ),
              errors: [...prev.errors, { timestamp, value: getErrorRate(data) }].slice(
                -maxPoints
              ),
            };
          });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    websocket.onerror = () => setConnected(false);
    websocket.onclose = () => setConnected(false);

    return () => {
      websocket.close();
    };
  }, [timeRange]);

  const getMaxPoints = (range: string): number => {
    switch (range) {
      case '1m':
        return 60;
      case '5m':
        return 300;
      case '15m':
        return 900;
      case '1h':
        return 3600;
      default:
        return 300;
    }
  };

  const getCpuUsage = (data: any): number => {
    // Calculate CPU usage from memory data (simplified)
    return Math.random() * 100; // Mock data - replace with actual CPU metrics
  };

  const getMemoryUsage = (data: any): number => {
    if (data?.system?.memory?.heapUsed) {
      return data.system.memory.heapUsed / 1024 / 1024; // Convert to MB
    }
    return 0;
  };

  const getRequestRate = (data: any): number => {
    // Mock data - replace with actual request metrics
    return Math.random() * 100;
  };

  const getErrorRate = (data: any): number => {
    // Mock data - replace with actual error metrics
    return Math.random() * 10;
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderLineChart = (data: MetricDataPoint[], color: string, label: string) => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-600">
          No data available
        </div>
      );
    }

    const max = Math.max(...data.map((d) => d.value), 1);
    const min = Math.min(...data.map((d) => d.value), 0);
    const range = max - min || 1;

    return (
      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 800 200">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <line
              key={percent}
              x1="0"
              y1={(200 * percent) / 100}
              x2="800"
              y2={(200 * percent) / 100}
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-gray-300 dark:text-gray-700"
            />
          ))}

          {/* Line chart */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={data
              .map((point, index) => {
                const x = (index / (data.length - 1 || 1)) * 800;
                const y = 200 - ((point.value - min) / range) * 200;
                return `${x},${y}`;
              })
              .join(' ')}
          />

          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1 || 1)) * 800;
            const y = 200 - ((point.value - min) / range) * 200;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill={color}
              />
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{max.toFixed(0)}</span>
          <span>{((max + min) / 2).toFixed(0)}</span>
          <span>{min.toFixed(0)}</span>
        </div>

        {/* Latest value */}
        <div className="absolute right-0 top-0 text-sm font-medium" style={{ color }}>
          {data[data.length - 1]?.value.toFixed(2)} {label}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Metrics Dashboard</h1>
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
              className="border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600 dark:text-blue-400"
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
        {/* Time Range Selector */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Range:</span>
          {(['1m', '5m', '15m', '1h'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              CPU Usage
            </h2>
            {renderLineChart(metrics.cpu, '#3b82f6', '%')}
          </div>

          {/* Memory Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Memory Usage
            </h2>
            {renderLineChart(metrics.memory, '#10b981', 'MB')}
          </div>

          {/* Request Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Request Rate
            </h2>
            {renderLineChart(metrics.requests, '#f59e0b', 'req/s')}
          </div>

          {/* Error Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Error Rate
            </h2>
            {renderLineChart(metrics.errors, '#ef4444', 'err/s')}
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-8 flex gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
            Export PDF
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium">
            Export CSV
          </button>
        </div>
      </main>
    </div>
  );
}
