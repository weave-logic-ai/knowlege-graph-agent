# Knowledge Graph Agent Dashboard Architecture

## System Architecture Overview

This document defines the architecture for a Next.js 14+ dashboard with shadcn/ui that provides a web interface for the knowledge-graph-agent package. The dashboard runs concurrently with the MCP server, GraphQL API, and webhook handlers.

---

## 1. High-Level Architecture (C4 Context)

```
+------------------+     +--------------------+     +------------------+
|   Claude Code    |     |   Web Dashboard    |     |  External APIs   |
|  (MCP Client)    |     |   (This System)    |     |  (Webhooks)      |
+--------+---------+     +---------+----------+     +--------+---------+
         |                         |                         |
         |  MCP Protocol           |  HTTP/WS/SSE            |  HTTP POST
         |                         |                         |
         v                         v                         v
+--------+---------+     +---------+----------+     +--------+---------+
|                  |     |                    |     |                  |
|   MCP Server     +<--->+   API Routes       +<--->+  Webhook Handler |
|   (stdio)        |     |   (Next.js)        |     |                  |
|                  |     |                    |     |                  |
+--------+---------+     +---------+----------+     +--------+---------+
         |                         |                         |
         |                         |                         |
         v                         v                         v
+--------+---------------------------------------------------------+
|                                                                   |
|                     Core Services Layer                           |
|   +-------------+  +-------------+  +-------------+  +---------+  |
|   | Knowledge   |  | Workflow    |  | Audit       |  | Vector  |  |
|   | Graph DB    |  | Service     |  | Chain       |  | Store   |  |
|   +-------------+  +-------------+  +-------------+  +---------+  |
|                                                                   |
+-------------------------------------------------------------------+
```

---

## 2. Technical Stack

### Core Framework
- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **React 18+** with Server Components

### UI Layer
- **shadcn/ui** for component library
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** or **Tremor** for data visualization

### State Management
- **React Server Components** for server-side data fetching
- **TanStack Query (React Query)** for client-side data caching and real-time updates
- **Zustand** for lightweight global state (theme, user preferences)

### Real-Time Communication
- **Server-Sent Events (SSE)** for workflow status updates
- **WebSocket** for bidirectional communication (alerts, metrics)
- **EventSource API** for browser-native SSE handling

### API Integration
- **tRPC** or **Next.js Route Handlers** for type-safe API calls
- Direct integration with knowledge-graph-agent exports

---

## 3. Recommended Folder Structure

```
packages/knowledge-graph-agent/
├── dashboard/                          # Dashboard application root
│   ├── app/                           # Next.js App Router
│   │   ├── (auth)/                    # Auth-related routes (future)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/               # Main dashboard routes
│   │   │   ├── layout.tsx             # Dashboard shell with sidebar
│   │   │   ├── page.tsx               # Dashboard home/overview
│   │   │   │
│   │   │   ├── workflows/             # Workflow monitoring
│   │   │   │   ├── page.tsx           # Workflow list
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx       # Workflow detail
│   │   │   │   └── loading.tsx
│   │   │   │
│   │   │   ├── audit/                 # Exochain audit trail
│   │   │   │   ├── page.tsx           # Audit log viewer
│   │   │   │   ├── checkpoints/
│   │   │   │   │   └── page.tsx       # Checkpoint browser
│   │   │   │   └── events/
│   │   │   │       └── [id]/
│   │   │   │           └── page.tsx   # Event detail with DAG view
│   │   │   │
│   │   │   ├── search/                # Vector search interface
│   │   │   │   ├── page.tsx           # Search UI
│   │   │   │   └── results/
│   │   │   │       └── page.tsx       # Search results
│   │   │   │
│   │   │   ├── graph/                 # Knowledge graph explorer
│   │   │   │   ├── page.tsx           # Graph visualization
│   │   │   │   ├── nodes/
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx   # Node detail
│   │   │   │   └── query/
│   │   │   │       └── page.tsx       # Query builder
│   │   │   │
│   │   │   ├── agents/                # Agent management
│   │   │   │   ├── page.tsx           # Agent list/status
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx       # Agent detail
│   │   │   │   └── spawn/
│   │   │   │       └── page.tsx       # Spawn new agent
│   │   │   │
│   │   │   ├── config/                # Configuration management
│   │   │   │   ├── page.tsx           # Config overview
│   │   │   │   ├── database/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── cache/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── services/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── admin/                 # Admin tools
│   │   │   │   ├── page.tsx           # Admin home
│   │   │   │   ├── health/
│   │   │   │   │   └── page.tsx       # Health checks
│   │   │   │   ├── backup/
│   │   │   │   │   └── page.tsx       # Backup/restore
│   │   │   │   └── sync/
│   │   │   │       └── page.tsx       # Peer sync management
│   │   │   │
│   │   │   └── trajectories/          # Agent trajectory learning
│   │   │       ├── page.tsx           # Trajectory list
│   │   │       └── [id]/
│   │   │           └── page.tsx       # Trajectory detail
│   │   │
│   │   ├── api/                       # API route handlers
│   │   │   ├── workflows/
│   │   │   │   ├── route.ts           # GET/POST workflows
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts       # GET/PATCH/DELETE workflow
│   │   │   │       └── status/
│   │   │   │           └── route.ts   # SSE for workflow status
│   │   │   │
│   │   │   ├── audit/
│   │   │   │   ├── events/
│   │   │   │   │   └── route.ts       # Query audit events
│   │   │   │   ├── checkpoints/
│   │   │   │   │   └── route.ts       # Checkpoint operations
│   │   │   │   └── stream/
│   │   │   │       └── route.ts       # SSE for new events
│   │   │   │
│   │   │   ├── search/
│   │   │   │   ├── vector/
│   │   │   │   │   └── route.ts       # Vector similarity search
│   │   │   │   └── hybrid/
│   │   │   │       └── route.ts       # Hybrid search
│   │   │   │
│   │   │   ├── graph/
│   │   │   │   ├── nodes/
│   │   │   │   │   └── route.ts       # Node CRUD
│   │   │   │   ├── query/
│   │   │   │   │   └── route.ts       # Graph queries
│   │   │   │   └── stats/
│   │   │   │       └── route.ts       # Graph statistics
│   │   │   │
│   │   │   ├── agents/
│   │   │   │   ├── route.ts           # List/spawn agents
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts       # Agent operations
│   │   │   │
│   │   │   ├── health/
│   │   │   │   └── route.ts           # Health check endpoint
│   │   │   │
│   │   │   └── webhooks/
│   │   │       └── route.ts           # Incoming webhook handler
│   │   │
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Landing/redirect to dashboard
│   │   ├── error.tsx                  # Global error boundary
│   │   ├── not-found.tsx              # 404 page
│   │   └── globals.css                # Global styles
│   │
│   ├── components/                    # React components
│   │   ├── ui/                        # shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                    # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   └── footer.tsx
│   │   │
│   │   ├── dashboard/                 # Dashboard-specific components
│   │   │   ├── overview-cards.tsx
│   │   │   ├── activity-feed.tsx
│   │   │   └── quick-actions.tsx
│   │   │
│   │   ├── workflows/                 # Workflow components
│   │   │   ├── workflow-list.tsx
│   │   │   ├── workflow-card.tsx
│   │   │   ├── workflow-timeline.tsx
│   │   │   ├── workflow-dag-view.tsx
│   │   │   └── workflow-status-badge.tsx
│   │   │
│   │   ├── audit/                     # Audit trail components
│   │   │   ├── event-list.tsx
│   │   │   ├── event-detail.tsx
│   │   │   ├── dag-visualizer.tsx     # DAG causality view
│   │   │   ├── checkpoint-card.tsx
│   │   │   ├── merkle-proof-viewer.tsx
│   │   │   └── hlc-timeline.tsx       # Hybrid logical clock timeline
│   │   │
│   │   ├── search/                    # Search components
│   │   │   ├── search-input.tsx
│   │   │   ├── search-results.tsx
│   │   │   ├── filter-panel.tsx
│   │   │   ├── result-card.tsx
│   │   │   └── similarity-score.tsx
│   │   │
│   │   ├── graph/                     # Graph visualization
│   │   │   ├── graph-canvas.tsx       # Force-directed graph
│   │   │   ├── node-inspector.tsx
│   │   │   ├── edge-inspector.tsx
│   │   │   ├── query-builder.tsx
│   │   │   └── graph-stats.tsx
│   │   │
│   │   ├── agents/                    # Agent components
│   │   │   ├── agent-list.tsx
│   │   │   ├── agent-card.tsx
│   │   │   ├── agent-spawn-form.tsx
│   │   │   └── task-queue.tsx
│   │   │
│   │   ├── config/                    # Configuration components
│   │   │   ├── config-editor.tsx
│   │   │   ├── config-diff.tsx
│   │   │   └── validation-status.tsx
│   │   │
│   │   └── shared/                    # Shared components
│   │       ├── loading-skeleton.tsx
│   │       ├── error-display.tsx
│   │       ├── empty-state.tsx
│   │       ├── data-table.tsx
│   │       ├── json-viewer.tsx
│   │       ├── code-block.tsx
│   │       └── realtime-indicator.tsx
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── use-workflow.ts
│   │   ├── use-audit-events.ts
│   │   ├── use-vector-search.ts
│   │   ├── use-graph-query.ts
│   │   ├── use-agents.ts
│   │   ├── use-health.ts
│   │   ├── use-sse.ts                 # SSE subscription hook
│   │   ├── use-websocket.ts           # WebSocket hook
│   │   └── use-debounce.ts
│   │
│   ├── lib/                           # Utility libraries
│   │   ├── api/                       # API client utilities
│   │   │   ├── client.ts              # Fetch wrapper
│   │   │   ├── workflows.ts
│   │   │   ├── audit.ts
│   │   │   ├── search.ts
│   │   │   ├── graph.ts
│   │   │   └── agents.ts
│   │   │
│   │   ├── services/                  # Service integrations
│   │   │   ├── kg-client.ts           # Knowledge graph client
│   │   │   ├── audit-client.ts        # Audit chain client
│   │   │   ├── vector-client.ts       # Vector store client
│   │   │   └── workflow-client.ts     # Workflow service client
│   │   │
│   │   ├── utils/                     # Utility functions
│   │   │   ├── format.ts              # Formatting helpers
│   │   │   ├── date.ts                # Date utilities
│   │   │   ├── hlc.ts                 # HLC utilities
│   │   │   └── cn.ts                  # shadcn class merge utility
│   │   │
│   │   ├── stores/                    # Zustand stores
│   │   │   ├── theme-store.ts
│   │   │   ├── preferences-store.ts
│   │   │   └── notifications-store.ts
│   │   │
│   │   └── constants.ts               # Application constants
│   │
│   ├── types/                         # TypeScript types
│   │   ├── workflow.ts
│   │   ├── audit.ts
│   │   ├── search.ts
│   │   ├── graph.ts
│   │   ├── agent.ts
│   │   └── api.ts
│   │
│   ├── public/                        # Static assets
│   │   ├── favicon.ico
│   │   └── images/
│   │
│   ├── styles/                        # Additional styles
│   │   └── graph.css                  # Graph visualization styles
│   │
│   ├── next.config.js                 # Next.js configuration
│   ├── tailwind.config.ts             # Tailwind configuration
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── components.json                # shadcn/ui configuration
│   └── package.json                   # Dashboard dependencies
```

---

## 4. Key Pages and Routes

### Route Mapping

| Route | Purpose | Data Source |
|-------|---------|-------------|
| `/` | Landing/redirect | - |
| `/dashboard` | Overview with metrics | Health, Stats |
| `/dashboard/workflows` | Workflow list | WorkflowService |
| `/dashboard/workflows/[id]` | Workflow detail + timeline | WorkflowService |
| `/dashboard/audit` | Audit event log | AuditChain |
| `/dashboard/audit/checkpoints` | Checkpoint browser | AuditChain |
| `/dashboard/audit/events/[id]` | Event detail + DAG | AuditChain |
| `/dashboard/search` | Vector search interface | VectorStore |
| `/dashboard/graph` | Graph visualization | KnowledgeGraphDB |
| `/dashboard/graph/nodes/[id]` | Node detail | KnowledgeGraphDB |
| `/dashboard/graph/query` | Query builder | KnowledgeGraphDB |
| `/dashboard/agents` | Agent management | AgentRegistry |
| `/dashboard/agents/spawn` | Spawn new agent | AgentRegistry |
| `/dashboard/config` | Configuration management | ConfigManager |
| `/dashboard/admin/health` | Health checks | HealthMonitor |
| `/dashboard/admin/backup` | Backup/restore | BackupManager |
| `/dashboard/trajectories` | Agent learning data | TrajectoryTracker |

---

## 5. Component Architecture

### Component Hierarchy

```
RootLayout
└── DashboardLayout
    ├── Sidebar
    │   ├── Logo
    │   ├── Navigation
    │   │   ├── NavSection (Overview)
    │   │   ├── NavSection (Workflows)
    │   │   ├── NavSection (Audit)
    │   │   ├── NavSection (Search)
    │   │   ├── NavSection (Graph)
    │   │   ├── NavSection (Agents)
    │   │   └── NavSection (Admin)
    │   └── UserMenu
    │
    ├── Header
    │   ├── Breadcrumb
    │   ├── Search (global)
    │   ├── Notifications
    │   └── ThemeToggle
    │
    └── MainContent
        └── [Page Components]
```

### shadcn/ui Components to Install

```bash
# Essential components
npx shadcn-ui@latest add button card input table tabs dialog
npx shadcn-ui@latest add dropdown-menu select badge avatar
npx shadcn-ui@latest add toast alert separator skeleton
npx shadcn-ui@latest add form label textarea checkbox
npx shadcn-ui@latest add command popover sheet scroll-area
npx shadcn-ui@latest add navigation-menu breadcrumb collapsible

# Data display
npx shadcn-ui@latest add data-table calendar chart
```

---

## 6. State Management Approach

### Server State (TanStack Query)

```typescript
// hooks/use-workflows.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '@/lib/api/workflows';

export function useWorkflows(filters?: WorkflowFilters) {
  return useQuery({
    queryKey: ['workflows', filters],
    queryFn: () => workflowsApi.list(filters),
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowsApi.get(id),
  });
}

export function useWorkflowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workflowsApi.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });
}
```

### Real-Time Updates (SSE)

```typescript
// hooks/use-sse.ts
import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useSSE<T>(url: string, queryKey: string[]) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data: T = JSON.parse(event.data);
      queryClient.setQueryData(queryKey, (old: T[] | undefined) => {
        // Update or append data
        return updateData(old, data);
      });
    };

    eventSource.onerror = () => {
      eventSource.close();
      // Implement reconnection logic
    };

    return () => {
      eventSource.close();
    };
  }, [url, queryKey, queryClient]);

  return eventSourceRef.current;
}
```

### Client State (Zustand)

```typescript
// lib/stores/preferences-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  refreshInterval: number;
  toggleSidebar: () => void;
  setTheme: (theme: PreferencesState['theme']) => void;
  setRefreshInterval: (interval: number) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'system',
      refreshInterval: 5000,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
    }),
    { name: 'kg-dashboard-preferences' }
  )
);
```

---

## 7. API Integration Pattern

### Service Layer Architecture

```typescript
// lib/services/kg-client.ts
import {
  KnowledgeGraphDatabase,
  createDatabase,
  WorkflowService,
  createWorkflowService,
  AuditChain,
  createAuditChain,
  VectorStore,
  createVectorStore,
  AgentRegistry,
  getRegistry,
} from '@weavelogic/knowledge-graph-agent';

class KnowledgeGraphClient {
  private static instance: KnowledgeGraphClient;

  private database: KnowledgeGraphDatabase;
  private workflowService: WorkflowService;
  private auditChain: AuditChain;
  private vectorStore: VectorStore;
  private agentRegistry: AgentRegistry;

  private constructor(config: ClientConfig) {
    this.database = createDatabase(config.dbPath);
    this.workflowService = createWorkflowService(config.workflow);
    this.auditChain = createAuditChain(config.audit);
    this.vectorStore = createVectorStore(config.vector);
    this.agentRegistry = getRegistry();
  }

  static getInstance(config?: ClientConfig): KnowledgeGraphClient {
    if (!KnowledgeGraphClient.instance) {
      if (!config) throw new Error('Config required for initialization');
      KnowledgeGraphClient.instance = new KnowledgeGraphClient(config);
    }
    return KnowledgeGraphClient.instance;
  }

  // Expose service methods
  get workflows() { return this.workflowService; }
  get audit() { return this.auditChain; }
  get vectors() { return this.vectorStore; }
  get agents() { return this.agentRegistry; }
  get graph() { return this.database; }
}

export const kgClient = KnowledgeGraphClient.getInstance;
```

### API Route Handler Pattern

```typescript
// app/api/workflows/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kgClient } from '@/lib/services/kg-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    const client = kgClient();
    const workflows = await client.workflows.getStatus();

    return NextResponse.json({
      success: true,
      data: workflows,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = kgClient();

    const result = await client.workflows.startCollaborationWorkflow(
      body.graphId,
      body.docPath
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

### SSE Route Handler

```typescript
// app/api/workflows/[id]/status/route.ts
import { NextRequest } from 'next/server';
import { kgClient } from '@/lib/services/kg-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const workflowId = params.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Subscribe to workflow events
      const client = kgClient();
      const registry = client.workflows.getWebhookRegistry();

      const unsubscribe = registry.on('workflow:complete', async (event) => {
        if (event.type === 'workflow:complete' &&
            event.event.workflowId === workflowId) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
      });

      // Send initial status
      const status = client.workflows.getWorkflow(workflowId);
      if (status) {
        const data = `data: ${JSON.stringify({ type: 'status', data: status })}\n\n`;
        controller.enqueue(encoder.encode(data));
      }

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## 8. Concurrent Operation Architecture

### Process Architecture

```
+----------------------------------------------------------+
|                      Node.js Process                      |
+----------------------------------------------------------+
|                                                          |
|  +------------------+  +------------------+              |
|  |   MCP Server     |  |   Next.js Dev    |              |
|  |   (stdio)        |  |   Server         |              |
|  |   Port: N/A      |  |   Port: 3000     |              |
|  +--------+---------+  +--------+---------+              |
|           |                     |                        |
|           |                     |                        |
|           v                     v                        |
|  +------------------+  +------------------+              |
|  |   Tool Handlers  |  |   API Routes     |              |
|  +--------+---------+  +--------+---------+              |
|           |                     |                        |
|           +----------+----------+                        |
|                      |                                   |
|                      v                                   |
|  +--------------------------------------------------+   |
|  |              Shared Service Layer                 |   |
|  |                                                   |   |
|  |  +------------+  +------------+  +------------+  |   |
|  |  | Database   |  | AuditChain |  | VectorStore|  |   |
|  |  | (SQLite)   |  | (Memory)   |  | (HNSW)     |  |   |
|  |  +------------+  +------------+  +------------+  |   |
|  |                                                   |   |
|  |  +------------+  +------------+  +------------+  |   |
|  |  | Workflow   |  | Agent      |  | Webhook    |  |   |
|  |  | Service    |  | Registry   |  | Registry   |  |   |
|  |  +------------+  +------------+  +------------+  |   |
|  |                                                   |   |
|  +--------------------------------------------------+   |
|                                                          |
+----------------------------------------------------------+
```

### Startup Script

```typescript
// dashboard/server.ts
import { spawn } from 'child_process';
import { createMCPServer } from '@weavelogic/knowledge-graph-agent';

async function startServices() {
  // Initialize shared services
  const services = await initializeSharedServices();

  // Start MCP server (handles Claude Code connections)
  const mcpServer = await createMCPServer(
    { name: 'kg-mcp-server' },
    services.database,
    services.cache,
    services.projectRoot
  );

  // Start Next.js dashboard (separate process or same process)
  const nextProcess = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    env: {
      ...process.env,
      KG_SHARED_SERVICES_PORT: '3001', // IPC port for shared services
    },
    stdio: 'inherit',
  });

  // Start WebSocket server for real-time updates
  const wsServer = startWebSocketServer(3002, services);

  console.log('Services started:');
  console.log('  - MCP Server: stdio');
  console.log('  - Dashboard: http://localhost:3000');
  console.log('  - WebSocket: ws://localhost:3002');
}
```

---

## 9. Real-Time Data Visualization

### Exochain DAG Visualization

```typescript
// components/audit/dag-visualizer.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { LedgerEvent } from '@weavelogic/knowledge-graph-agent';

interface DAGVisualizerProps {
  events: LedgerEvent[];
  selectedEventId?: string;
  onEventSelect?: (eventId: string) => void;
}

export function DAGVisualizer({ events, selectedEventId, onEventSelect }: DAGVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || events.length === 0) return;

    // Build DAG structure
    const nodes = events.map(e => ({
      id: e.id,
      type: e.envelope.payload.type,
      hlc: e.envelope.hlc,
    }));

    const links = events.flatMap(e =>
      e.envelope.parents.map(parent => ({
        source: parent,
        target: e.id,
      }))
    );

    // D3 force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('y', d3.forceY(d => d.hlc.physicalMs).strength(0.1));

    // Render with D3
    // ... D3 rendering code

  }, [events, selectedEventId]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-[600px] border rounded-lg"
    />
  );
}
```

### Workflow Timeline Component

```typescript
// components/workflows/workflow-timeline.tsx
'use client';

import { useMemo } from 'react';
import type { WorkflowExecution, StepExecution } from '@weavelogic/knowledge-graph-agent';

interface WorkflowTimelineProps {
  execution: WorkflowExecution;
}

export function WorkflowTimeline({ execution }: WorkflowTimelineProps) {
  const timelineData = useMemo(() => {
    return execution.steps.map((step, index) => ({
      ...step,
      relativeStart: step.startedAt.getTime() - execution.startedAt.getTime(),
      duration: step.completedAt
        ? step.completedAt.getTime() - step.startedAt.getTime()
        : Date.now() - step.startedAt.getTime(),
    }));
  }, [execution]);

  return (
    <div className="space-y-2">
      {timelineData.map((step, index) => (
        <div
          key={step.id}
          className="flex items-center gap-4"
        >
          <div className="w-32 text-sm text-muted-foreground">
            {step.name}
          </div>
          <div className="flex-1 h-8 bg-muted rounded relative">
            <div
              className={`absolute h-full rounded ${getStepColor(step.status)}`}
              style={{
                left: `${(step.relativeStart / getTotalDuration(execution)) * 100}%`,
                width: `${(step.duration / getTotalDuration(execution)) * 100}%`,
              }}
            />
          </div>
          <div className="w-20 text-sm">
            {formatDuration(step.duration)}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 10. Security Considerations

### Authentication (Future)
- OAuth 2.0 / OIDC integration
- API key authentication for programmatic access
- Session management with JWT

### Authorization
- Role-based access control (RBAC)
- Admin-only routes protection
- Sensitive operation confirmation

### API Security
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Rate limiting
  const ip = request.ip ?? 'anonymous';
  // ... rate limit logic

  // CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
```

---

## 11. Performance Optimizations

### Server Components
- Use Server Components for data fetching where possible
- Stream responses with Suspense boundaries
- Prefetch critical routes

### Caching Strategy
```typescript
// next.config.js
module.exports = {
  experimental: {
    staleTimes: {
      dynamic: 30,  // Cache dynamic pages for 30 seconds
      static: 180,  // Cache static pages for 3 minutes
    },
  },
};
```

### Bundle Optimization
- Dynamic imports for heavy visualization libraries
- Tree-shaking for unused exports
- Image optimization with next/image

---

## 12. Development Commands

```bash
# Initialize dashboard
cd packages/knowledge-graph-agent
mkdir dashboard && cd dashboard
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false

# Install shadcn/ui
npx shadcn-ui@latest init

# Install dependencies
npm install @tanstack/react-query zustand d3 recharts

# Development
npm run dev

# Build
npm run build

# Start production
npm start
```

---

## 13. Architecture Decision Records

### ADR-001: Next.js App Router
**Decision**: Use Next.js 14+ App Router instead of Pages Router
**Rationale**:
- Server Components reduce client bundle size
- Improved streaming and Suspense support
- Better data fetching patterns
- Future-proof architecture

### ADR-002: shadcn/ui over Other UI Libraries
**Decision**: Use shadcn/ui for component library
**Rationale**:
- Components are copied into project (full control)
- Built on Radix UI primitives (accessibility)
- Tailwind-based styling (consistency with existing)
- No version lock-in

### ADR-003: TanStack Query for Server State
**Decision**: Use TanStack Query instead of SWR or custom hooks
**Rationale**:
- Superior caching and invalidation
- Built-in SSE/WebSocket support patterns
- Excellent DevTools
- Query key-based invalidation

### ADR-004: SSE over WebSocket for Real-Time
**Decision**: Use SSE as primary, WebSocket as fallback
**Rationale**:
- SSE is simpler for one-way updates
- Better HTTP/2 compatibility
- Automatic reconnection
- WebSocket only for bidirectional needs

---

## 14. Integration Points

### MCP Server Integration
The dashboard coexists with the MCP server, sharing:
- Database connection
- Shadow cache
- Agent registry
- Workflow service

### Webhook Integration
Incoming webhooks trigger:
1. Workflow events
2. Audit chain events
3. Real-time dashboard updates

### GraphQL API (Future)
Potential GraphQL layer for:
- Complex graph queries
- Subscriptions for real-time data
- Federated schema for extensions

---

## Summary

This architecture provides a robust, scalable dashboard for the knowledge-graph-agent package with:

1. **Clear separation of concerns** between UI, API, and service layers
2. **Real-time capabilities** via SSE and WebSocket
3. **Type-safe development** with TypeScript throughout
4. **Modern UI patterns** using shadcn/ui and Tailwind
5. **Efficient state management** with TanStack Query and Zustand
6. **Concurrent operation** alongside MCP server and other services
7. **Extensible architecture** for future features (auth, GraphQL)

The folder structure and component architecture are designed for maintainability, testability, and progressive enhancement.
