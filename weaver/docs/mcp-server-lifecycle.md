# Weaver MCP Server Lifecycle Management

## Overview

Task 4 of Phase 5 MCP Integration implemented comprehensive lifecycle management for the Weaver MCP server, including:

- **Startup Sequence**: Proper initialization with connection checks
- **Health Monitoring**: Real-time health check system for all components
- **Graceful Shutdown**: Clean resource cleanup and shutdown handling

## Implementation

### 1. Health Check System

**File**: `src/mcp-server/tools/health.ts`

The health check system monitors the status of all Weaver components:

```typescript
// Health check tool provides real-time status
{
  overall: 'healthy' | 'degraded' | 'unhealthy',
  timestamp: string,
  uptime: number,
  components: [
    {
      component: 'shadow-cache',
      status: 'healthy',
      message: 'Shadow cache operational',
      details: { totalFiles: 150, totalTags: 45, lastSync: '2025-10-24T...' }
    },
    {
      component: 'workflow-engine',
      status: 'healthy',
      message: 'Workflow engine operational',
      details: { totalWorkflows: 5, totalExecutions: 42 }
    }
  ]
}
```

**Features**:
- Checks shadow cache connectivity and statistics
- Monitors workflow engine status and execution metrics
- Provides uptime tracking
- Returns structured health data for monitoring

### 2. Startup Sequence

**File**: `src/mcp-server/index.ts`

The MCP server implements a robust startup sequence:

1. **Initialization**: Create server instance with configuration
2. **Handler Setup**: Register request handlers for tools
3. **Tool Registration**: Load and register all available tools
4. **Transport Connection**: Connect stdio transport for MCP communication
5. **Ready State**: Server enters running state, ready for requests

```typescript
const server = new WeaverMCPServer(config);
await server.run();
// Server is now ready and listening
```

**Startup Logging**:
```
[timestamp] INFO  WeaverMCPServer initialized { name: 'weaver-mcp-server', version: '0.1.0' }
[timestamp] INFO  Initializing MCP tools...
[timestamp] DEBUG Registered health_check tool
[timestamp] INFO  Initialized 1 tools
[timestamp] INFO  WeaverMCPServer running on stdio transport
[timestamp] INFO  Ready to accept tool requests from MCP clients
```

### 3. Graceful Shutdown

**File**: `src/mcp-server/index.ts`

The server implements graceful shutdown with proper cleanup:

```typescript
// Shutdown sequence
await server.shutdown();
```

**Shutdown Process**:
1. Checks if server is running
2. Closes MCP server connection
3. Marks server as no longer running
4. Logs uptime and request statistics
5. Cleans up resources

**Shutdown Logging**:
```
[timestamp] INFO  WeaverMCPServer shutdown complete { uptime: '42.35s', requestsHandled: 15 }
```

### 4. Tool Registry

**File**: `src/mcp-server/tools/registry.ts`

The tool registry manages all MCP tools with lifecycle integration:

```typescript
// Initialize tools during startup
export function initializeTools(): void {
  // Register health check tool
  import('./health.js').then(({ createHealthCheckTool, HealthChecker }) => {
    const healthChecker = new HealthChecker();
    const healthTool = createHealthCheckTool(healthChecker);
    registerTool(toolDef, healthTool.handler);
  });

  // Additional tools registered here
}
```

## Usage

### Starting the Server

The MCP server is integrated into the main Weaver service:

```bash
# Start the full Weaver service (includes MCP server)
npm run dev

# Or build and run
npm run build
npm start
```

### Health Checks

Use the `health_check` tool via MCP protocol:

```json
{
  "method": "tools/call",
  "params": {
    "name": "health_check",
    "arguments": {}
  }
}
```

### Server Lifecycle

```typescript
import { WeaverMCPServer } from './mcp-server/index.js';

// Create server
const server = new WeaverMCPServer({
  name: 'weaver-mcp-server',
  version: '0.1.0'
});

// Start server
await server.run();

// Check if running
console.log(server.isServerRunning()); // true

// Get health status
const health = server.getHealth();

// Shutdown
await server.shutdown();
```

## Signal Handling

The main Weaver service (`src/index.ts`) handles process signals for graceful shutdown:

- **SIGINT** (Ctrl+C): Triggers graceful shutdown
- **SIGTERM**: Triggers graceful shutdown
- **Uncaught exceptions**: Logged and handled with cleanup

## Monitoring

### Health Check Fields

- `overall`: Overall system health status
- `uptime`: Server uptime in seconds
- `requestCount`: Total MCP requests handled
- `components`: Status of each component
  - `shadow-cache`: Cache connectivity and statistics
  - `workflow-engine`: Engine status and execution metrics

### Metrics

The server tracks:
- Request count per session
- Uptime duration
- Component-specific metrics via health checks

## Architecture

```
┌─────────────────────────────────────────┐
│     WeaverMCPServer                     │
├─────────────────────────────────────────┤
│ Lifecycle:                              │
│  - run() → Initialize & Start           │
│  - shutdown() → Graceful Cleanup        │
│  - getHealth() → Status Check           │
├─────────────────────────────────────────┤
│ Components:                             │
│  - ToolRegistry → Tool Management       │
│  - HealthChecker → Health Monitoring    │
│  - StdioTransport → MCP Communication   │
└─────────────────────────────────────────┘
```

## Files Created/Modified

### New Files
- `src/mcp-server/tools/health.ts` - Health check tool implementation
- `docs/mcp-server-lifecycle.md` - This documentation

### Modified Files
- `src/mcp-server/tools/registry.ts` - Added health tool registration
- `src/mcp-server/tools/index.ts` - Added health exports
- `package.json` - Updated scripts (cleaned up)

## Testing

To test the lifecycle implementation:

```bash
# Type check
cd /home/aepod/dev/weave-nn/weaver
npm run typecheck

# Start server and observe startup logs
npm run dev

# In another terminal, send health check request via MCP
# (requires MCP client like Claude Desktop)

# Stop server with Ctrl+C and observe shutdown logs
```

## Next Steps

The lifecycle implementation is complete. Future enhancements:

1. **Task 5**: Implement shadow cache tools
2. **Task 6**: Implement workflow tools
3. **Task 7**: Add more comprehensive health checks
4. **Task 8**: Implement metrics collection and reporting

## Related Documentation

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Phase 5 MCP Integration Plan](/home/aepod/dev/weave-nn/weave-nn/_planning/phases/phase-5-mcp-integration.md)
- [Weaver Architecture](/home/aepod/dev/weave-nn/weaver/README.md)
