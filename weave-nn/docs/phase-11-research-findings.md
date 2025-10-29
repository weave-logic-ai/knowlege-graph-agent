---
title: 'Phase 11: CLI Service Management Research Findings'
type: research
status: complete
created_date: {}
updated_date: '2025-10-28'
tags:
  - phase-11
  - research-findings
  - cli-service-management
  - pm2
  - health-checks
  - hive-mind
category: research
domain: phase-11
scope: module
audience:
  - developers
  - architects
related_concepts:
  - pm2-integration
  - process-lifecycle
  - health-checks
  - graceful-shutdown
  - weaver-hooks
  - service-management
related_files:
  - phase-11-architecture-design.md
  - phase-11-cli-service-management.md
  - WEAVER-COMPLETE-IMPLEMENTATION-GUIDE.md
author: ai-generated
version: '1.0'
phase_id: PHASE-11
swarm_id: swarm-1761579855850-8l8o757iv
priority: medium
visual:
  icon: "\U0001F52C"
  color: '#8B5CF6'
  cssclasses:
    - type-research
    - status-complete
    - priority-medium
    - phase-11
    - domain-phase-11
---

# Phase 11: CLI Service Management Research Findings

**Research Agent**: Hive Mind Swarm (swarm-1761579855850-8l8o757iv)
**Date**: 2025-10-27
**Status**: Complete

---

## Executive Summary

This document contains comprehensive research findings for Phase 11 CLI Service Management & AI Feature Creator implementation. The research covers PM2 integration patterns, process lifecycle management, health check systems, and Weaver hooks architecture.

**Key Recommendations**:
1. **Use PM2** for production Node.js process management with programmatic API
2. **Implement graceful shutdown** with SIGTERM/SIGINT handlers and 30s timeout
3. **Health checks** at `/readyz` and `/livez` endpoints with <200ms response time
4. **Integrate with Weaver workflow engine** for service lifecycle hooks

---

## 1. PM2 Integration Research

### 1.1 PM2 Ecosystem File Configuration

**Best Practice Format**: `ecosystem.config.js` or `pm2.config.js`

```javascript
module.exports = {
  apps: [{
    name: "weaver-mcp-server",
    script: "./dist/mcp-server/bin.js",
    instances: "max",  // or (CPU cores - 1)
    exec_mode: "cluster",
    env: {
      NODE_ENV: "development"
    },
    env_production: {
      NODE_ENV: "production"  // 3x performance boost
    },
    max_memory_restart: "500M",
    autorestart: true,
    watch: false,
    ignore_watch: ["node_modules", ".git", "logs"],
    error_file: "~/.weaver/logs/pm2-error.log",
    out_file: "~/.weaver/logs/pm2-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z"
  }]
};
```

**Key Configuration Options**:
- `instances: "max"` - Spawn worker per CPU core (recommended: cores - 1)
- `exec_mode: "cluster"` - Enable cluster mode for production
- `NODE_ENV: "production"` - Unlocks 3x performance improvement
- `max_memory_restart` - Auto-restart on memory threshold
- `autorestart: true` - Auto-recovery on crashes
- `ignore_watch` - Prevent unnecessary restarts

### 1.2 PM2 Programmatic API

**Connection and Lifecycle**:
```javascript
const pm2 = require('pm2');

// Connect to PM2 daemon
pm2.connect((err) => {
  if (err) {
    console.error(err);
    process.exit(2);
  }

  // Start application
  pm2.start({
    script: 'server.js',
    name: 'weaver',
    instances: 'max',
    exec_mode: 'cluster'
  }, (err, apps) => {
    pm2.disconnect();  // Release connection
    if (err) throw err;
  });
});
```

**noDaemonMode Option**: If `noDaemonMode: true`, PM2 won't run as daemon and will die when script exits.

**Process Status Values**:
- `"online"` - Running normally
- `"stopping"` - Gracefully shutting down
- `"stopped"` - Not running
- `"launching"` - Starting up
- `"errored"` - Error state
- `"one-launch-status"` - Single execution

### 1.3 PM2 Monitoring Capabilities

**Runtime Metrics**:
- CPU usage per process
- Memory consumption
- Event loop latency
- HTTP request metrics (with axm_monitor)
- Active requests
- Garbage collection stats

**Best Practice**: Use `pm2 monit` or programmatic API to expose metrics endpoint.

---

## 2. Process Lifecycle Management

### 2.1 Graceful Shutdown Pattern

**Signal Handling**:
```javascript
// SIGTERM: Graceful shutdown from Docker/PM2
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown...');
  await gracefulShutdown();
});

// SIGINT: Ctrl+C user interruption
process.on('SIGINT', async () => {
  console.log('SIGINT received, starting graceful shutdown...');
  await gracefulShutdown();
});

async function gracefulShutdown() {
  // 1. Stop accepting new requests
  server.close(() => {
    console.log('HTTP server closed');
  });

  // 2. Wait for existing connections to complete
  // server.close() waits automatically

  // 3. Clean up resources
  await database.disconnect();
  await cache.close();

  // 4. Exit cleanly
  process.exit(0);
}
```

**Shutdown Steps**:
1. Stop accepting new requests
2. `server.close()` waits for existing connections
3. Clean up resources (DB, files, etc)
4. `process.exit(0)` for clean exit

**Docker Considerations**:
- Docker sends SIGTERM, waits 10s, then SIGKILL
- PID 1 processes ignore default signals - must handle explicitly
- Node.js wasn't designed as init process

### 2.2 PID File Management

**Best Practice Pattern**:
```javascript
const fs = require('fs');
const path = require('path');

const PID_FILE = path.join(process.env.HOME, '.weaver/weaver.pid');

function writePidFile() {
  fs.writeFileSync(PID_FILE, process.pid.toString());
}

function removePidFile() {
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
  }
}

function getPid() {
  if (fs.existsSync(PID_FILE)) {
    return parseInt(fs.readFileSync(PID_FILE, 'utf8'));
  }
  return null;
}

// On startup
writePidFile();

// On shutdown
process.on('exit', removePidFile);
```

---

## 3. Health Check System

### 3.1 Health Check Endpoints

**Kubernetes-Compatible Naming**:
- `/readyz` - Readiness probe (can accept traffic?)
- `/livez` - Liveness probe (is process alive?)

**Response Format**:
```json
{
  "status": "ok",
  "uptime": 3600,
  "version": "1.0.0",
  "timestamp": "2025-10-27T15:00:00.000Z",
  "services": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 5
    },
    {
      "name": "redis",
      "status": "healthy",
      "responseTime": 2
    },
    {
      "name": "filesystem",
      "status": "healthy",
      "responseTime": 1
    }
  ]
}
```

### 3.2 Health Check Implementation

**Basic Health Endpoint**:
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});
```

**Advanced Health Checks**:
```javascript
const healthChecks = {
  async database() {
    const start = Date.now();
    await db.query('SELECT 1 FROM tasks LIMIT 1');
    return {
      name: 'database',
      status: 'healthy',
      responseTime: Date.now() - start
    };
  },

  async memory() {
    const usage = process.memoryUsage();
    const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;
    return {
      name: 'memory',
      status: heapPercent > 95 ? 'critical' : heapPercent > 80 ? 'warning' : 'healthy',
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      heapPercent
    };
  },

  async filesystem() {
    const paths = ['~/.weaver/logs', '~/.weaver/config'];
    for (const path of paths) {
      await fs.promises.access(path, fs.constants.R_OK | fs.constants.W_OK);
    }
    return { name: 'filesystem', status: 'healthy' };
  }
};
```

### 3.3 Health Check Best Practices

**Performance Requirements**:
- Target: <200ms response time
- Track p95/p99 latency, not just averages
- Implement timeout on dependency checks

**Traffic Light Status**:
- 🟢 Green: Fully operational
- 🟡 Yellow: Degraded but operational
- 🔴 Red: Unhealthy, cannot serve traffic

**Overload Protection**:
```javascript
const overloadProtection = require('overload-protection');

app.use(overloadProtection('express', {
  production: true,
  logStatsOnReq: false,
  maxEventLoopDelay: 42,
  maxHeapUsedBytes: 0,
  maxRssBytes: 0
}));
```

---

## 4. Metrics Collection

### 4.1 Key Metrics to Track

**Runtime Metrics**:
- Memory usage (heap used/total)
- CPU usage
- Event loop latency
- Uptime
- Response time (p50, p95, p99)

**Application Metrics**:
- Request count
- Error rate
- Throughput (requests/sec)
- Agent spawn count
- Task completion rate
- Queue depth

**HTTP Metrics**:
- Active requests
- HTTP latency
- Status code distribution

### 4.2 Metrics Implementation Pattern

```javascript
const os = require('os');

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTimes: []
    };
  }

  recordRequest(duration) {
    this.metrics.requests++;
    this.metrics.responseTimes.push(duration);
  }

  recordError() {
    this.metrics.errors++;
  }

  getMetrics() {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.errors / this.metrics.requests,
      avgResponseTime: this.avg(this.metrics.responseTimes),
      p95ResponseTime: this.percentile(this.metrics.responseTimes, 95)
    };
  }

  percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  avg(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}
```

---

## 5. PM2 Alternatives Analysis

### 5.1 Alternative Solutions

| Solution | Best For | Pros | Cons |
|----------|----------|------|------|
| **PM2** | Production Node.js | Full-featured, monitoring, clustering | Adds dependency |
| **systemd** | Linux servers | Native, reliable, no dependencies | Linux-only, complex config |
| **Servicer** | systemd wrapper | Simple CLI, daemonless | Requires systemd |
| **Supervisor** | Multi-language | Generic, basic logging | Less Node.js-specific |
| **Forever** | Simple use cases | Lightweight, minimal | Lacks advanced features |

### 5.2 Recommendation

**For Weaver Phase 11**:
- **Primary**: PM2 with programmatic API
- **Fallback**: Direct Node.js with custom process management
- **Future**: systemd support for Linux production environments

**Rationale**:
1. PM2 provides production-grade features out-of-box
2. Programmatic API allows CLI integration
3. Ecosystem file enables easy configuration
4. Cross-platform support (Windows, macOS, Linux)
5. Built-in monitoring and log management

---

## 6. Weaver Hooks Integration Patterns

### 6.1 Workflow Engine Architecture

**Core Components**:
```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];  // file:add, file:change, manual, etc
  enabled: boolean;
  handler: (context: WorkflowContext) => Promise<void>;
  fileFilter?: string;  // glob pattern
}

interface WorkflowContext {
  workflowId: string;
  trigger: WorkflowTrigger;
  triggeredAt: Date;
  fileEvent?: FileEvent;
  metadata?: Record<string, unknown>;
}
```

**Execution Model**:
- Event-driven architecture
- Async handlers with Promise-based execution
- Parallel workflow execution via `Promise.allSettled`
- Execution tracking (start, complete, failure)

### 6.2 Service Management Hook Integration Points

**Pre-Service Start Hooks**:
```javascript
// Before starting MCP server
async function preServiceStart() {
  // Initialize workflow engine
  workflowEngine.start();

  // Load service configuration
  config.load();

  // Validate environment
  await validateEnvironment();

  // Setup signal handlers
  setupSignalHandlers();
}
```

**Post-Service Start Hooks**:
```javascript
// After MCP server starts
async function postServiceStart() {
  // Write PID file
  writePidFile();

  // Register health check endpoint
  registerHealthCheck();

  // Start metrics collection
  metricsCollector.start();

  // Trigger service-started workflow
  await workflowEngine.triggerManual('service-started');
}
```

**Pre-Service Stop Hooks**:
```javascript
// Before stopping MCP server
async function preServiceStop() {
  // Trigger graceful shutdown workflow
  await workflowEngine.triggerManual('service-stopping');

  // Stop accepting new requests
  server.close();
}
```

**Post-Service Stop Hooks**:
```javascript
// After MCP server stops
async function postServiceStop() {
  // Stop workflow engine
  await workflowEngine.stop();

  // Remove PID file
  removePidFile();

  // Clean up resources
  await cleanup();
}
```

### 6.3 Weaver Workflow Trigger Examples

**Existing Patterns** (from proof-workflows.ts):
- `file:add` - New file created
- `file:change` - File modified
- `file:unlink` - File deleted
- `manual` - Programmatically triggered

**Proposed Service Management Triggers**:
- `service:starting` - Before service start
- `service:started` - After service start
- `service:stopping` - Before service stop
- `service:stopped` - After service stop
- `service:restart` - Service restart initiated
- `service:health-check` - Health check triggered

---

## 7. Implementation Recommendations

### 7.1 Task 1.1: Process Manager Integration

**Architecture**:
```
/src/cli/service/
  ├── process-manager.ts      # PM2 programmatic API wrapper
  ├── lifecycle-hooks.ts      # Pre/post service hooks
  ├── pid-manager.ts          # PID file management
  └── signal-handler.ts       # SIGTERM/SIGINT handlers
```

**Key Classes**:
```typescript
class ProcessManager {
  async start(config: ServiceConfig): Promise<void>;
  async stop(graceful: boolean = true): Promise<void>;
  async restart(): Promise<void>;
  async status(): Promise<ProcessStatus>;
  getPid(): number | null;
}

class LifecycleHooks {
  async onPreStart(): Promise<void>;
  async onPostStart(): Promise<void>;
  async onPreStop(): Promise<void>;
  async onPostStop(): Promise<void>;
}
```

### 7.2 Task 1.2: Health Check System

**Architecture**:
```
/src/health/
  ├── health-checker.ts       # Main health check orchestrator
  ├── checks/
  │   ├── database-check.ts
  │   ├── filesystem-check.ts
  │   ├── memory-check.ts
  │   └── registry.ts
  └── endpoints.ts            # /readyz and /livez handlers
```

**Health Check Registry Pattern**:
```typescript
class HealthCheckRegistry {
  register(check: HealthCheck): void;
  async runAll(): Promise<HealthStatus>;
  async runCheck(name: string): Promise<CheckResult>;
}
```

### 7.3 Task 1.3: Logging System

**Winston Configuration**:
```javascript
const winston = require('winston');
require('winston-daily-rotate-file');

const transport = new winston.transports.DailyRotateFile({
  filename: '~/.weaver/logs/weaver-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '10d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});

const logger = winston.createLogger({
  level: process.env.WEAVER_LOG_LEVEL || 'info',
  transports: [transport]
});
```

### 7.4 Task 1.4: Metrics Collection

**Prometheus-Compatible Metrics**:
```javascript
const client = require('prom-client');

// Create metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const agentSpawnCount = new client.Counter({
  name: 'weaver_agent_spawn_total',
  help: 'Total number of agents spawned'
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Process Manager Tests**:
- Start/stop/restart lifecycle
- PID file creation/removal
- Signal handler registration
- Error handling (port conflicts, etc)

**Health Check Tests**:
- Individual check execution
- Registry pattern
- Timeout handling
- Degraded state detection

### 8.2 Integration Tests

**Service Lifecycle Tests**:
```javascript
describe('Service Lifecycle', () => {
  it('should start service and write PID file', async () => {
    await processManager.start(config);
    expect(fs.existsSync('~/.weaver/weaver.pid')).toBe(true);
    expect(await healthCheck.status()).toBe('healthy');
  });

  it('should gracefully shutdown on SIGTERM', async () => {
    await processManager.start(config);
    process.kill(processManager.getPid(), 'SIGTERM');
    await sleep(1000);
    expect(await processManager.status()).toBe('stopped');
  });
});
```

### 8.3 E2E Tests

**CLI Command Tests**:
```bash
# Start service
weaver start
# Verify health
curl http://localhost:3000/health
# Check status
weaver status
# View logs
weaver logs --follow
# Stop service
weaver stop
```

---

## 9. Security Considerations

### 9.1 PID File Security

- Store in user home directory `~/.weaver/`
- Set file permissions: `0600` (owner read/write only)
- Validate PID before sending signals

### 9.2 Health Check Security

- No sensitive data in health responses
- Consider authentication for production
- Rate limit health check endpoint

### 9.3 Log Security

- Sanitize sensitive data before logging
- Implement log rotation to prevent disk exhaustion
- Secure log file permissions

---

## 10. Performance Benchmarks

### 10.1 Target Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| Service startup time | <5s | <10s |
| Health check response | <200ms | <500ms |
| Graceful shutdown | <30s | <60s |
| Memory overhead | <50MB | <100MB |
| Metrics collection overhead | <1% CPU | <5% CPU |

### 10.2 Load Testing

**Stress Test Scenarios**:
- 100 concurrent health checks
- 1000 agent spawns in 1 minute
- 24-hour continuous operation
- Memory leak detection
- Crash recovery validation

---

## 11. Documentation Requirements

### 11.1 User Documentation

- **Service Management Guide**: CLI commands and workflows
- **Health Monitoring Guide**: Understanding health checks
- **Troubleshooting Guide**: Common issues and solutions
- **Configuration Reference**: All config options

### 11.2 Developer Documentation

- **Architecture Documentation**: System design and components
- **API Reference**: Programmatic API documentation
- **Testing Guide**: How to test service management
- **Contributing Guide**: How to extend the system

---

## 12. Hive Collective Memory Summary

All research findings have been stored in the Hive collective memory under the following keys:

**Memory Namespace**: `hive`

**Stored Research**:
1. `research/pm2-ecosystem` - PM2 configuration and programmatic API patterns
2. `research/graceful-shutdown` - Signal handling and graceful shutdown patterns
3. `research/health-checks` - Health check implementation patterns
4. `research/pm2-alternatives` - Alternative process managers analysis
5. `research/weaver-hooks` - Weaver workflow engine integration patterns

**Access Pattern**:
```bash
# Retrieve research findings
npx claude-flow@alpha hooks session-restore --session-id "swarm-1761579855850-8l8o757iv"
```

---

## 13. Next Steps for Implementation

### 13.1 Immediate Actions (Week 1)

1. **Set up PM2 integration** (Task 1.1)
   - Install `pm2` package
   - Create ecosystem config template
   - Implement ProcessManager class
   - Add PID file management

2. **Implement health checks** (Task 1.2)
   - Create health check registry
   - Implement database check
   - Add filesystem check
   - Expose `/readyz` and `/livez` endpoints

3. **Configure logging** (Task 1.3)
   - Install Winston with rotation
   - Set up log levels
   - Implement `weaver logs` command

### 13.2 Follow-up Actions (Week 2)

4. **Metrics collection** (Task 1.4)
   - Install prom-client
   - Define key metrics
   - Expose `/metrics` endpoint
   - Implement `weaver metrics` command

5. **CLI integration tests** (Task 1.7)
   - Write lifecycle tests
   - Add failure scenario tests
   - Implement cross-platform tests

---

## 14. Coordination with Other Agents

### 14.1 For Coder Agent

**Key Implementation Files**:
- `/src/cli/service/process-manager.ts` - PM2 wrapper
- `/src/health/health-checker.ts` - Health check system
- `/src/logging/logger.ts` - Winston configuration
- `/src/metrics/collector.ts` - Metrics collection

**Use collective memory findings**:
```bash
npx claude-flow@alpha hooks session-restore --session-id "swarm-1761579855850-8l8o757iv"
```

### 14.2 For Tester Agent

**Test Coverage Requirements**:
- 90%+ code coverage for service management
- Integration tests for full lifecycle
- Stress tests for 24-hour operation
- Cross-platform compatibility

**Test Patterns**: Review `/tests/integration/` for existing patterns

### 14.3 For Documenter Agent

**Documentation Needs**:
- CLI command reference
- API documentation
- Troubleshooting guide
- Architecture diagrams (Mermaid)

---

## 15. Conclusion

This research provides a comprehensive foundation for implementing Phase 11 CLI Service Management. The key findings demonstrate that:

1. **PM2 is the optimal choice** for production Node.js process management
2. **Graceful shutdown patterns** are essential for reliability
3. **Health checks must be fast** (<200ms) and comprehensive
4. **Weaver's workflow engine** provides excellent hook integration points
5. **Metrics collection** should use Prometheus-compatible formats

All research has been stored in Hive collective memory for seamless coordination across the swarm.

**Research Status**: ✅ Complete
**Next Phase**: Implementation (Coder Agent)
**Estimated Implementation**: 44 hours (Section 1) + 62 hours (Section 3)

---

**Generated by**: Hive Mind Research Agent
**Swarm ID**: swarm-1761579855850-8l8o757iv
**Coordination Protocol**: Claude Flow Hooks v2.0+
