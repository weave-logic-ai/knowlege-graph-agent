---
title: Health Monitoring
description: Guide to setting up health checks and alerting
category: guides/enterprise
---

# Health Monitoring

## Overview

The knowledge-graph-agent includes a comprehensive health monitoring system for production deployments. Monitor database health, service status, performance metrics, and receive alerts when issues are detected.

## Prerequisites

- Node.js >= 20.0.0
- @weavelogic/knowledge-graph-agent installed
- (Optional) External monitoring integration

## Quick Start

```bash
# Run health check
kg diag health

# Continuous monitoring
kg diag health --watch --interval 60

# JSON output for monitoring systems
kg diag health --json
```

## Programmatic Usage

```typescript
import { createHealthMonitor } from '@weavelogic/knowledge-graph-agent';

const monitor = createHealthMonitor({
  projectRoot: '/path/to/project',
  checks: ['database', 'services', 'disk', 'memory'],
  alertThresholds: {
    diskUsage: 0.9,      // 90%
    memoryUsage: 0.85,   // 85%
    responseTime: 1000,  // 1 second
  },
});

// Run health check
const health = await monitor.check();

console.log({
  status: health.status,        // 'healthy' | 'degraded' | 'unhealthy'
  checks: health.checks,        // Individual check results
  timestamp: health.timestamp,
});
```

## Health Checks

### Database Health

Checks SQLite database integrity and performance.

```typescript
const dbHealth = await monitor.checkDatabase();

// Returns:
{
  status: 'healthy',
  metrics: {
    connectionTime: 5,       // ms
    queryTime: 12,          // ms (sample query)
    integrityCheck: 'ok',   // PRAGMA integrity_check
    nodeCount: 1250,
    edgeCount: 3400,
    dbSize: 15728640,       // bytes
  },
}
```

### Service Health

Checks running services (MCP, GraphQL, Dashboard).

```typescript
const serviceHealth = await monitor.checkServices();

// Returns:
{
  status: 'healthy',
  services: {
    mcp: { status: 'running', port: 3000, uptime: 3600 },
    graphql: { status: 'running', port: 4000, uptime: 3600 },
    dashboard: { status: 'running', port: 3001, uptime: 3600 },
  },
}
```

### Disk Health

Monitors disk usage and write performance.

```typescript
const diskHealth = await monitor.checkDisk();

// Returns:
{
  status: 'healthy',
  metrics: {
    total: 107374182400,    // 100GB
    used: 53687091200,      // 50GB
    available: 53687091200, // 50GB
    usagePercent: 0.5,
    writeSpeed: 150,        // MB/s
  },
}
```

### Memory Health

Monitors Node.js memory usage.

```typescript
const memoryHealth = await monitor.checkMemory();

// Returns:
{
  status: 'healthy',
  metrics: {
    heapUsed: 52428800,     // 50MB
    heapTotal: 104857600,   // 100MB
    external: 5242880,      // 5MB
    rss: 157286400,         // 150MB
    usagePercent: 0.5,
  },
}
```

### Cache Health

Monitors cache performance and hit rates.

```typescript
const cacheHealth = await monitor.checkCache();

// Returns:
{
  status: 'healthy',
  metrics: {
    hitRate: 0.85,
    size: 2500,
    maxSize: 5000,
    memoryUsage: 10485760,  // 10MB
  },
}
```

## Alert Configuration

### Alert Thresholds

```typescript
const monitor = createHealthMonitor({
  alertThresholds: {
    // Resource thresholds
    diskUsage: 0.9,         // Alert at 90% disk usage
    memoryUsage: 0.85,      // Alert at 85% memory
    cpuUsage: 0.9,          // Alert at 90% CPU

    // Performance thresholds
    queryTime: 1000,        // Alert if queries > 1s
    responseTime: 2000,     // Alert if API response > 2s

    // Health thresholds
    cacheHitRate: 0.5,      // Alert if hit rate < 50%
    errorRate: 0.01,        // Alert if error rate > 1%

    // Freshness thresholds
    backupAge: 86400000,    // Alert if backup > 24h old
    lastSync: 3600000,      // Alert if sync > 1h old
  },
});
```

### Alert Handlers

```typescript
// Email alerts
monitor.addAlertHandler({
  type: 'email',
  config: {
    to: 'ops@example.com',
    smtp: {
      host: 'smtp.example.com',
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },
  severity: ['critical', 'warning'],
});

// Webhook alerts
monitor.addAlertHandler({
  type: 'webhook',
  config: {
    url: 'https://hooks.example.com/alerts',
    headers: {
      'Authorization': `Bearer ${process.env.WEBHOOK_TOKEN}`,
    },
  },
  severity: ['critical'],
});

// Slack alerts
monitor.addAlertHandler({
  type: 'slack',
  config: {
    webhookUrl: process.env.SLACK_WEBHOOK,
    channel: '#kg-alerts',
  },
  severity: ['critical', 'warning'],
});

// Custom handler
monitor.addAlertHandler({
  type: 'custom',
  handler: async (alert) => {
    console.log('Alert:', alert);
    // Custom logic
  },
  severity: ['critical', 'warning', 'info'],
});
```

## Continuous Monitoring

### Watch Mode

```typescript
// Start continuous monitoring
const watcher = monitor.watch({
  interval: 60000,        // Check every minute
  onHealthChange: (health, previous) => {
    if (health.status !== previous.status) {
      console.log(`Status changed: ${previous.status} -> ${health.status}`);
    }
  },
  onAlert: (alert) => {
    console.log('Alert triggered:', alert);
  },
});

// Stop monitoring
watcher.stop();
```

### Metrics Collection

```typescript
import { MetricsCollector } from '@weavelogic/knowledge-graph-agent';

const metrics = new MetricsCollector({
  projectRoot: '/path/to/project',
  retentionDays: 30,
});

// Record custom metric
metrics.record('custom_metric', 42, { tag: 'value' });

// Get metric history
const history = await metrics.query({
  metric: 'query_time',
  from: new Date(Date.now() - 86400000), // Last 24h
  aggregation: 'avg',
  interval: '1h',
});
```

## Dashboard Integration

### Health Endpoint

```typescript
import { createGraphQLServer } from '@weavelogic/knowledge-graph-agent';

const server = createGraphQLServer({
  db,
  healthMonitor: monitor,
});

// GraphQL query
`
query {
  health {
    status
    timestamp
    checks {
      name
      status
      metrics
    }
  }
}
`
```

### REST Health Endpoint

```typescript
import express from 'express';

const app = express();

// Kubernetes-style health endpoints
app.get('/healthz', async (req, res) => {
  const health = await monitor.check();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

app.get('/readyz', async (req, res) => {
  const ready = await monitor.isReady();
  res.status(ready ? 200 : 503).json({ ready });
});

app.get('/livez', (req, res) => {
  res.status(200).json({ alive: true });
});
```

## CLI Usage

```bash
# Basic health check
kg diag health

# Specific checks
kg diag health --check database
kg diag health --check services
kg diag health --check disk

# Watch mode
kg diag health --watch --interval 30

# JSON output
kg diag health --json

# Repair mode
kg diag repair --auto

# Configure alerts
kg config set health.alertEmail ops@example.com
kg config set health.alertThreshold.diskUsage 0.85
```

## Integration with External Systems

### Prometheus

```typescript
import { PrometheusExporter } from '@weavelogic/knowledge-graph-agent';

const exporter = new PrometheusExporter({
  port: 9090,
  path: '/metrics',
  prefix: 'kg_',
});

// Exposes metrics like:
// kg_database_query_time_seconds
// kg_cache_hit_rate
// kg_node_count
// kg_service_status
```

### Grafana Dashboard

Import the provided Grafana dashboard:

```bash
# Export dashboard JSON
kg diag export-dashboard --output grafana-dashboard.json

# Import to Grafana
curl -X POST \
  -H "Content-Type: application/json" \
  -d @grafana-dashboard.json \
  http://localhost:3000/api/dashboards/db
```

## Best Practices

### 1. Set Appropriate Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Disk Usage | 80% | 90% |
| Memory Usage | 75% | 85% |
| Query Time | 500ms | 1000ms |
| Cache Hit Rate | < 70% | < 50% |
| Error Rate | > 0.5% | > 1% |

### 2. Use Escalating Alerts

```typescript
monitor.addAlertHandler({
  type: 'email',
  severity: ['warning'],
  config: { to: 'dev@example.com' },
});

monitor.addAlertHandler({
  type: 'pagerduty',
  severity: ['critical'],
  config: { serviceKey: process.env.PAGERDUTY_KEY },
});
```

### 3. Monitor Trends

```typescript
// Check for degradation trends
const trend = await metrics.analyzeTrend({
  metric: 'query_time',
  period: '7d',
});

if (trend.direction === 'increasing' && trend.changePercent > 20) {
  console.warn('Query times increasing by', trend.changePercent, '%');
}
```

## Troubleshooting

### Health Check Timeout

Increase timeout for slow systems:
```typescript
const monitor = createHealthMonitor({
  timeout: 30000, // 30 seconds
});
```

### False Alerts

Fine-tune thresholds based on baseline:
```bash
kg diag baseline --period 7d
# Outputs recommended thresholds based on historical data
```

### Missing Metrics

Enable verbose logging:
```bash
DEBUG=kg:health kg diag health
```

## Next Steps

- [Backup and Recovery](./backup-recovery.md)
- [Caching Guide](./caching.md)
- [Performance Optimization](../../architecture/decisions/ADR-010-performance-optimizations.md)
