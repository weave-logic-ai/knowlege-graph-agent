# Dashboard Component Implementation Specification

## Overview

This document provides detailed implementation specifications for all React components in the Knowledge Graph Agent Dashboard. Each component includes props interface, state management approach, API endpoints consumed, and real-time update strategy.

**Tech Stack:**
- Next.js 14+ (App Router)
- React 18+ with Server Components
- shadcn/ui component library
- TanStack Query (React Query) for server state
- Zustand for client state
- react-force-graph-2d for graph visualization
- Tailwind CSS for styling

---

## Table of Contents

1. [Core Layout Components](#1-core-layout-components)
2. [Graph Visualization Component](#2-graph-visualization-component)
3. [Data Table Component](#3-data-table-component)
4. [Real-Time Components](#4-real-time-components)
5. [Search Interface](#5-search-interface)
6. [Metrics Dashboard](#6-metrics-dashboard)
7. [Shared Component Utilities](#7-shared-component-utilities)

---

## 1. Core Layout Components

### 1.1 DashboardLayout

The main layout wrapper providing consistent sidebar navigation and content structure.

**Location:** `dashboard/components/layout/dashboard-layout.tsx`

```typescript
// Props Interface
interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}
```

**State Management:**
- Zustand store for sidebar collapse state (persisted)
- Zustand store for theme preference (persisted)

```typescript
// lib/stores/layout-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarWidth: 280,
      toggleSidebar: () => set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
    }),
    { name: 'kg-layout' }
  )
);
```

**API Endpoints:** None (layout is client-only)

**Real-Time Updates:** None

**Component Structure:**
```
DashboardLayout
+-- Sidebar
|   +-- SidebarHeader (logo, collapse button)
|   +-- SidebarNav (navigation sections)
|   +-- SidebarFooter (user menu, settings)
+-- MainContent
    +-- Header
    |   +-- Breadcrumb
    |   +-- SearchTrigger
    |   +-- NotificationBell
    |   +-- ThemeToggle
    +-- PageContent (children)
```

---

### 1.2 Sidebar

Collapsible navigation sidebar with grouped menu items.

**Location:** `dashboard/components/layout/sidebar.tsx`

```typescript
interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

interface NavSection {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  defaultOpen?: boolean;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
  disabled?: boolean;
}
```

**Navigation Structure:**
```typescript
const NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: LayoutDashboard,
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: Home },
    ],
  },
  {
    id: 'knowledge',
    title: 'Knowledge',
    icon: Brain,
    items: [
      { id: 'graph', label: 'Graph Explorer', href: '/dashboard/graph', icon: Network },
      { id: 'nodes', label: 'Nodes', href: '/dashboard/graph/nodes', icon: Circle },
      { id: 'query', label: 'Query Builder', href: '/dashboard/graph/query', icon: Search },
    ],
  },
  {
    id: 'workflows',
    title: 'Workflows',
    icon: GitBranch,
    items: [
      { id: 'active', label: 'Active Workflows', href: '/dashboard/workflows', icon: Play },
      { id: 'history', label: 'History', href: '/dashboard/workflows/history', icon: History },
    ],
  },
  {
    id: 'audit',
    title: 'Audit',
    icon: Shield,
    items: [
      { id: 'events', label: 'Event Log', href: '/dashboard/audit', icon: FileText },
      { id: 'checkpoints', label: 'Checkpoints', href: '/dashboard/audit/checkpoints', icon: Flag },
      { id: 'dag', label: 'DAG View', href: '/dashboard/audit/dag', icon: GitCommit },
    ],
  },
  {
    id: 'search',
    title: 'Search',
    icon: Search,
    items: [
      { id: 'vector', label: 'Vector Search', href: '/dashboard/search', icon: Compass },
      { id: 'semantic', label: 'Semantic', href: '/dashboard/search/semantic', icon: Sparkles },
    ],
  },
  {
    id: 'agents',
    title: 'Agents',
    icon: Bot,
    items: [
      { id: 'list', label: 'Agent List', href: '/dashboard/agents', icon: Users },
      { id: 'spawn', label: 'Spawn Agent', href: '/dashboard/agents/spawn', icon: Plus },
      { id: 'trajectories', label: 'Trajectories', href: '/dashboard/trajectories', icon: Route },
    ],
  },
  {
    id: 'admin',
    title: 'Admin',
    icon: Settings,
    items: [
      { id: 'config', label: 'Configuration', href: '/dashboard/config', icon: Sliders },
      { id: 'health', label: 'Health', href: '/dashboard/admin/health', icon: Activity },
      { id: 'backup', label: 'Backup/Restore', href: '/dashboard/admin/backup', icon: Database },
    ],
  },
];
```

**State Management:**
- Local state for open/closed sections
- Zustand for collapse state (shared with layout)

**API Endpoints:**
- `GET /api/health` - Badge indicator for system health

**Real-Time Updates:**
- SSE subscription to `/api/notifications/stream` for badge updates

---

### 1.3 Header

Top header with breadcrumb, search, notifications, and theme controls.

**Location:** `dashboard/components/layout/header.tsx`

```typescript
interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  actions?: React.ReactNode;
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}
```

**State Management:**

```typescript
// lib/stores/notifications-store.ts
interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) => set((state) => ({
    notifications: [
      { ...notification, id: crypto.randomUUID(), read: false },
      ...state.notifications,
    ].slice(0, 50), // Keep last 50
    unreadCount: state.unreadCount + 1,
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
    unreadCount: 0,
  })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
```

**API Endpoints:**
- `GET /api/notifications` - Fetch notifications list
- `PATCH /api/notifications/:id/read` - Mark notification read

**Real-Time Updates:**
- SSE subscription to `/api/notifications/stream`

---

### 1.4 Breadcrumb Navigation

Contextual breadcrumb with route-based auto-generation.

**Location:** `dashboard/components/layout/breadcrumb.tsx`

```typescript
interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  autoGenerate?: boolean; // Generate from current route
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  current?: boolean;
}
```

**Implementation Notes:**
- Use `usePathname()` from next/navigation for auto-generation
- Map route segments to human-readable labels
- Support custom overrides via props

---

## 2. Graph Visualization Component

### 2.1 GraphCanvas

Force-directed graph visualization using react-force-graph-2d.

**Location:** `dashboard/components/graph/graph-canvas.tsx`

```typescript
interface GraphCanvasProps {
  // Data
  nodes: GraphNode[];
  edges: GraphEdge[];

  // Selection
  selectedNodeId?: string;
  selectedEdgeId?: string;
  onNodeSelect?: (node: GraphNode | null) => void;
  onEdgeSelect?: (edge: GraphEdge | null) => void;

  // Interaction
  onNodeHover?: (node: GraphNode | null) => void;
  onNodeRightClick?: (node: GraphNode, event: MouseEvent) => void;
  onCanvasClick?: () => void;

  // Display options
  showLabels?: boolean;
  showEdgeLabels?: boolean;
  highlightConnections?: boolean;
  colorScheme?: 'type' | 'status' | 'custom';

  // Layout
  layoutAlgorithm?: 'force' | 'dagre' | 'radial';
  frozen?: boolean;

  // Filters
  visibleTypes?: NodeType[];
  visibleStatuses?: NodeStatus[];

  // Controls
  enableZoom?: boolean;
  enablePan?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

interface GraphNode {
  id: string;
  title: string;
  type: NodeType;
  status: NodeStatus;
  tags: string[];
  connections: number; // For sizing
  x?: number;
  y?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'link' | 'reference' | 'parent' | 'related';
  weight: number;
  label?: string;
}
```

**Node Styling by Type:**

```typescript
const NODE_COLORS: Record<NodeType, string> = {
  concept: '#8B5CF6',      // Purple
  technical: '#3B82F6',    // Blue
  feature: '#10B981',      // Green
  primitive: '#F59E0B',    // Amber
  service: '#EF4444',      // Red
  guide: '#6366F1',        // Indigo
  standard: '#EC4899',     // Pink
  integration: '#14B8A6',  // Teal
};

const NODE_ICONS: Record<NodeType, string> = {
  concept: 'lightbulb',
  technical: 'code',
  feature: 'star',
  primitive: 'cube',
  service: 'server',
  guide: 'book',
  standard: 'shield-check',
  integration: 'plug',
};

const STATUS_OPACITY: Record<NodeStatus, number> = {
  active: 1.0,
  draft: 0.6,
  deprecated: 0.4,
  archived: 0.3,
};
```

**Edge Styling:**

```typescript
const EDGE_COLORS: Record<string, string> = {
  link: '#94A3B8',      // Slate
  reference: '#60A5FA', // Light blue
  parent: '#34D399',    // Emerald
  related: '#F472B6',   // Pink
};
```

**State Management:**

```typescript
// hooks/use-graph-state.ts
import { create } from 'zustand';

interface GraphState {
  // View state
  zoom: number;
  centerX: number;
  centerY: number;

  // Selection
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  hoveredNodeId: string | null;

  // Filters
  visibleTypes: Set<NodeType>;
  visibleStatuses: Set<NodeStatus>;
  searchQuery: string;

  // Display options
  showLabels: boolean;
  showEdgeLabels: boolean;
  highlightConnections: boolean;
  colorScheme: 'type' | 'status' | 'custom';

  // Actions
  setZoom: (zoom: number) => void;
  setCenter: (x: number, y: number) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  setHoveredNode: (id: string | null) => void;
  toggleType: (type: NodeType) => void;
  toggleStatus: (status: NodeStatus) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}
```

**API Endpoints:**
- `GET /api/graph/nodes` - Fetch all graph nodes
- `GET /api/graph/edges` - Fetch all graph edges
- `GET /api/graph/nodes/:id` - Fetch single node details
- `GET /api/graph/nodes/:id/related` - Fetch related nodes
- `GET /api/graph/stats` - Fetch graph statistics

**TanStack Query Hooks:**

```typescript
// hooks/use-graph.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useGraphNodes(filters?: GraphFilters) {
  return useQuery({
    queryKey: ['graph', 'nodes', filters],
    queryFn: () => graphApi.getNodes(filters),
    staleTime: 30000, // 30 seconds
  });
}

export function useGraphEdges() {
  return useQuery({
    queryKey: ['graph', 'edges'],
    queryFn: () => graphApi.getEdges(),
    staleTime: 30000,
  });
}

export function useGraphNode(id: string) {
  return useQuery({
    queryKey: ['graph', 'node', id],
    queryFn: () => graphApi.getNode(id),
    enabled: !!id,
  });
}

export function useRelatedNodes(id: string, maxHops = 2) {
  return useQuery({
    queryKey: ['graph', 'related', id, maxHops],
    queryFn: () => graphApi.getRelatedNodes(id, maxHops),
    enabled: !!id,
  });
}
```

**Real-Time Updates:**
- Polling every 30 seconds for graph changes
- Optional SSE for live collaboration mode

---

### 2.2 NodeInspector

Detail panel for selected node.

**Location:** `dashboard/components/graph/node-inspector.tsx`

```typescript
interface NodeInspectorProps {
  nodeId: string;
  onClose?: () => void;
  onNavigate?: (nodeId: string) => void;
  position?: 'right' | 'bottom' | 'floating';
}

interface NodeDetail extends GraphNode {
  path: string;
  content: string;
  frontmatter: Record<string, unknown>;
  wordCount: number;
  lastModified: Date;
  outgoingLinks: NodeLink[];
  incomingLinks: NodeLink[];
}
```

**Sections:**
1. Header (title, type badge, status badge)
2. Metadata (path, dates, word count)
3. Tags (editable tag list)
4. Frontmatter viewer
5. Content preview (truncated markdown)
6. Outgoing links list
7. Incoming links (backlinks) list
8. Related nodes carousel
9. Actions (edit, delete, open in editor)

**API Endpoints:**
- `GET /api/graph/nodes/:id` - Full node details
- `PATCH /api/graph/nodes/:id` - Update node
- `DELETE /api/graph/nodes/:id` - Delete node

---

### 2.3 GraphControls

Zoom, pan, filter, and layout controls toolbar.

**Location:** `dashboard/components/graph/graph-controls.tsx`

```typescript
interface GraphControlsProps {
  // Zoom
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;

  // Layout
  layout: 'force' | 'dagre' | 'radial';
  onLayoutChange: (layout: string) => void;
  onCenterGraph: () => void;

  // Display
  showLabels: boolean;
  onToggleLabels: () => void;
  colorScheme: 'type' | 'status';
  onColorSchemeChange: (scheme: string) => void;

  // Filters
  filters: GraphFilters;
  onFiltersChange: (filters: GraphFilters) => void;

  // Export
  onExport: (format: 'png' | 'svg' | 'json') => void;
}

interface GraphFilters {
  types: NodeType[];
  statuses: NodeStatus[];
  tags: string[];
  searchQuery: string;
}
```

**Control Groups:**
1. Zoom controls (slider, buttons, fit)
2. Layout selector (force, dagre, radial)
3. Display toggles (labels, edge labels, highlights)
4. Color scheme selector
5. Type filter multi-select
6. Status filter multi-select
7. Tag filter
8. Search input
9. Export dropdown

---

## 3. Data Table Component

### 3.1 DataTable (Generic)

Reusable data table with sorting, filtering, pagination, and row selection.

**Location:** `dashboard/components/shared/data-table.tsx`

```typescript
interface DataTableProps<T> {
  // Data
  data: T[];
  columns: ColumnDef<T>[];

  // Pagination
  pageSize?: number;
  pageIndex?: number;
  totalCount?: number;
  onPaginationChange?: (pagination: PaginationState) => void;

  // Sorting
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;

  // Filtering
  filters?: ColumnFiltersState;
  onFiltersChange?: (filters: ColumnFiltersState) => void;
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;

  // Selection
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  enableRowSelection?: boolean | ((row: Row<T>) => boolean);

  // Row actions
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;

  // Display
  loading?: boolean;
  emptyState?: React.ReactNode;
  stickyHeader?: boolean;
  striped?: boolean;
  dense?: boolean;

  // Toolbar
  toolbar?: React.ReactNode;
  bulkActions?: (selectedRows: T[]) => React.ReactNode;
}

interface ColumnDef<T> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => unknown;
  cell?: (props: CellContext<T>) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'select' | 'multiselect' | 'date' | 'number';
  filterOptions?: FilterOption[];
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
  pinned?: 'left' | 'right';
}

interface FilterOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}
```

**Built-in Features:**
- Column resizing
- Column reordering (drag and drop)
- Column visibility toggle
- Virtual scrolling for large datasets
- Keyboard navigation
- Responsive stacking on mobile

**Implementation with TanStack Table:**

```typescript
// Using @tanstack/react-table
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';

function DataTable<T>({ data, columns, ...props }: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: props.onSortingChange,
    onColumnFiltersChange: props.onFiltersChange,
    onPaginationChange: props.onPaginationChange,
    onRowSelectionChange: props.onRowSelectionChange,
    state: {
      sorting: props.sorting,
      columnFilters: props.filters,
      pagination: { pageIndex: props.pageIndex ?? 0, pageSize: props.pageSize ?? 10 },
      rowSelection: props.rowSelection,
    },
  });

  // Render table...
}
```

---

### 3.2 NodesTable

Specialized table for knowledge graph nodes.

**Location:** `dashboard/components/graph/nodes-table.tsx`

```typescript
interface NodesTableProps {
  onNodeSelect?: (node: KnowledgeNode) => void;
  initialFilters?: NodeFilters;
}

interface NodeFilters {
  types?: NodeType[];
  statuses?: NodeStatus[];
  tags?: string[];
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
```

**Columns:**
1. Checkbox (selection)
2. Title (with icon by type)
3. Type (badge)
4. Status (badge with color)
5. Tags (tag chips, truncated)
6. Connections (incoming + outgoing count)
7. Word Count
8. Last Modified (relative time)
9. Actions (view, edit, delete)

**API Endpoints:**
- `GET /api/graph/nodes?page=&limit=&sort=&filter=` - Paginated nodes
- `DELETE /api/graph/nodes/:id` - Delete node
- `PATCH /api/graph/nodes` - Bulk update

**TanStack Query Hook:**

```typescript
export function useNodesTable(filters: NodeFilters, pagination: PaginationState) {
  return useQuery({
    queryKey: ['nodes', 'table', filters, pagination],
    queryFn: () => graphApi.getNodesPaginated({
      ...filters,
      page: pagination.pageIndex,
      limit: pagination.pageSize,
    }),
    keepPreviousData: true,
  });
}
```

---

## 4. Real-Time Components

### 4.1 WorkflowTimeline

Visual timeline of workflow step executions.

**Location:** `dashboard/components/workflows/workflow-timeline.tsx`

```typescript
interface WorkflowTimelineProps {
  workflowId: string;
  execution?: WorkflowExecution;
  showDetails?: boolean;
  autoScroll?: boolean;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  steps: StepExecution[];
  error?: string;
}

interface StepExecution {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // ms
  progress?: number; // 0-100
  output?: unknown;
  error?: string;
}
```

**Visual Design:**
- Vertical timeline with step cards
- Progress bar within running steps
- Color-coded status indicators
- Expandable step details
- Error display with stack trace

**State Management:**

```typescript
// hooks/use-workflow-execution.ts
export function useWorkflowExecution(workflowId: string) {
  const queryClient = useQueryClient();

  // Initial fetch
  const query = useQuery({
    queryKey: ['workflow', workflowId, 'execution'],
    queryFn: () => workflowApi.getExecution(workflowId),
  });

  // SSE subscription for real-time updates
  useEffect(() => {
    const eventSource = new EventSource(
      `/api/workflows/${workflowId}/status`
    );

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      queryClient.setQueryData(
        ['workflow', workflowId, 'execution'],
        (old: WorkflowExecution) => mergeExecution(old, update)
      );
    };

    return () => eventSource.close();
  }, [workflowId, queryClient]);

  return query;
}
```

**API Endpoints:**
- `GET /api/workflows/:id` - Workflow definition
- `GET /api/workflows/:id/execution` - Current execution status
- `GET /api/workflows/:id/status` - SSE stream for status updates
- `POST /api/workflows/:id/start` - Start workflow
- `POST /api/workflows/:id/cancel` - Cancel workflow

**Real-Time Updates:**
- SSE subscription to `/api/workflows/:id/status`
- Events: `step:started`, `step:progress`, `step:completed`, `step:failed`

---

### 4.2 AgentActivityFeed

Real-time feed of agent activities.

**Location:** `dashboard/components/agents/agent-activity-feed.tsx`

```typescript
interface AgentActivityFeedProps {
  agentId?: string; // Filter to specific agent
  limit?: number;
  showTimestamps?: boolean;
  groupByAgent?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface AgentActivity {
  id: string;
  agentId: string;
  agentType: AgentType;
  agentName: string;
  type: 'task_started' | 'task_completed' | 'task_failed' |
        'spawned' | 'terminated' | 'message' | 'memory_update';
  title: string;
  description?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  relatedTaskId?: string;
  relatedNodeId?: string;
}
```

**Visual Design:**
- Infinite scroll list
- Activity cards with agent avatar/icon
- Activity type icons and colors
- Relative timestamps
- Expandable details
- Links to related tasks/nodes

**State Management:**

```typescript
// hooks/use-agent-activity.ts
export function useAgentActivity(
  agentId?: string,
  options?: { limit?: number; autoRefresh?: boolean }
) {
  const { limit = 50, autoRefresh = true } = options ?? {};

  return useInfiniteQuery({
    queryKey: ['agents', 'activity', agentId],
    queryFn: ({ pageParam = 0 }) =>
      agentApi.getActivity({ agentId, offset: pageParam, limit }),
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore ? pages.length * limit : undefined,
    refetchInterval: autoRefresh ? 5000 : false,
  });
}
```

**API Endpoints:**
- `GET /api/agents/activity?agentId=&limit=&offset=` - Activity feed
- `GET /api/agents/activity/stream` - SSE stream

**Real-Time Updates:**
- SSE subscription to `/api/agents/activity/stream`
- Optional: Polling every 5 seconds as fallback

---

### 4.3 AuditTrailViewer

Exochain audit event log with DAG visualization.

**Location:** `dashboard/components/audit/audit-trail-viewer.tsx`

```typescript
interface AuditTrailViewerProps {
  // Filtering
  workflowId?: string;
  agentId?: string;
  eventTypes?: AuditEventType[];
  dateRange?: { start: Date; end: Date };

  // Display
  view?: 'list' | 'dag' | 'timeline';
  showVerification?: boolean;
  expandAll?: boolean;

  // Interaction
  onEventSelect?: (event: LedgerEvent) => void;
  selectedEventId?: string;
}

interface LedgerEvent {
  id: string;
  sequence: number;
  envelope: {
    id: string;
    hlc: HybridLogicalClock;
    parents: string[];
    payload: AuditPayload;
    signature: string;
  };
  hash: string;
  verified: boolean;
}

interface AuditPayload {
  type: AuditEventType;
  timestamp: Date;
  actor: {
    type: 'agent' | 'user' | 'system';
    id: string;
    name: string;
  };
  action: string;
  target?: {
    type: string;
    id: string;
    name?: string;
  };
  data?: Record<string, unknown>;
  context?: {
    workflowId?: string;
    stepId?: string;
    nodeId?: string;
  };
}

type AuditEventType =
  | 'node:created' | 'node:updated' | 'node:deleted'
  | 'edge:created' | 'edge:deleted'
  | 'workflow:started' | 'workflow:completed' | 'workflow:failed'
  | 'agent:spawned' | 'agent:terminated' | 'agent:task'
  | 'checkpoint:created' | 'sync:completed'
  | 'search:query' | 'config:changed';

interface HybridLogicalClock {
  physicalMs: number;
  logical: number;
  nodeId: string;
}
```

**Views:**

1. **List View:**
   - Chronological event cards
   - Filtering and search
   - Event type badges
   - Actor information
   - Expandable details

2. **DAG View:**
   - D3-based directed acyclic graph
   - Events as nodes, parent relationships as edges
   - Time-based vertical positioning
   - Event type coloring
   - Click to inspect

3. **Timeline View:**
   - Horizontal timeline
   - Grouped by day/hour
   - Zoom and pan
   - Event markers

**State Management:**

```typescript
// hooks/use-audit-events.ts
export function useAuditEvents(filters: AuditFilters) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ['audit', 'events', filters],
    queryFn: ({ pageParam = undefined }) =>
      auditApi.getEvents({ ...filters, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // SSE for new events
  useEffect(() => {
    const eventSource = new EventSource('/api/audit/stream');

    eventSource.onmessage = (event) => {
      const newEvent = JSON.parse(event.data);
      queryClient.setQueryData(
        ['audit', 'events', filters],
        (old: InfiniteData<AuditPage>) => prependEvent(old, newEvent)
      );
    };

    return () => eventSource.close();
  }, [filters, queryClient]);

  return query;
}
```

**API Endpoints:**
- `GET /api/audit/events?type=&actor=&from=&to=&cursor=` - Events list
- `GET /api/audit/events/:id` - Single event details
- `GET /api/audit/stream` - SSE stream for new events
- `GET /api/audit/checkpoints` - List checkpoints
- `GET /api/audit/verify/:id` - Verify event integrity

**Real-Time Updates:**
- SSE subscription to `/api/audit/stream`
- New events prepended to list
- DAG view auto-updates

---

### 4.4 HLCTimeline

Hybrid Logical Clock timeline visualization.

**Location:** `dashboard/components/audit/hlc-timeline.tsx`

```typescript
interface HLCTimelineProps {
  events: LedgerEvent[];
  width?: number;
  height?: number;
  onEventClick?: (event: LedgerEvent) => void;
  selectedEventId?: string;
  showPhysicalTime?: boolean;
  showLogicalTime?: boolean;
  groupByNode?: boolean;
}
```

**Visual Design:**
- X-axis: Physical time
- Y-axis: Logical clock value (per node)
- Event dots with causality arrows
- Hover tooltips with event details
- Color by event type or node

---

## 5. Search Interface

### 5.1 CommandPalette

Global command palette accessible via Cmd+K / Ctrl+K.

**Location:** `dashboard/components/search/command-palette.tsx`

```typescript
interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
  shortcut?: string[];
  category: 'navigation' | 'action' | 'search' | 'recent';
  onSelect: () => void;
  disabled?: boolean;
}

interface SearchResult {
  id: string;
  type: 'node' | 'workflow' | 'agent' | 'event';
  title: string;
  description?: string;
  path?: string;
  score: number;
  highlights?: {
    field: string;
    fragments: string[];
  }[];
}
```

**Categories:**
1. Recent (last 5 visited pages/nodes)
2. Navigation (dashboard pages)
3. Actions (create node, start workflow, spawn agent)
4. Search Results (nodes, workflows, agents)

**Keyboard Shortcuts:**
- `Cmd/Ctrl + K` - Open palette
- `Esc` - Close palette
- `Arrow Up/Down` - Navigate results
- `Enter` - Select item
- `Cmd/Ctrl + Enter` - Open in new tab

**State Management:**

```typescript
// hooks/use-command-palette.ts
import { create } from 'zustand';

interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  recentItems: CommandItem[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  addRecentItem: (item: CommandItem) => void;
}

export const useCommandPalette = create<CommandPaletteState>((set) => ({
  isOpen: false,
  query: '',
  recentItems: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: '' }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setQuery: (query) => set({ query }),
  addRecentItem: (item) => set((state) => ({
    recentItems: [item, ...state.recentItems.filter(i => i.id !== item.id)].slice(0, 5),
  })),
}));
```

**API Endpoints:**
- `GET /api/search?q=&type=&limit=` - Quick search
- `POST /api/search/vector` - Vector similarity search

---

### 5.2 SearchInterface

Full search page with filters and results.

**Location:** `dashboard/components/search/search-interface.tsx`

```typescript
interface SearchInterfaceProps {
  initialQuery?: string;
  initialFilters?: SearchFilters;
}

interface SearchFilters {
  types?: NodeType[];
  statuses?: NodeStatus[];
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  searchMode: 'fulltext' | 'semantic' | 'hybrid';
  includeContent?: boolean;
}

interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: string;
  took: number; // ms
  mode: 'fulltext' | 'semantic' | 'hybrid';
  facets?: {
    types: Record<NodeType, number>;
    statuses: Record<NodeStatus, number>;
    tags: Record<string, number>;
  };
}
```

**Layout:**
- Search input with mode toggle
- Filter sidebar (collapsible)
- Results list with pagination
- Facet counts in filter sidebar

**Search Modes:**
1. **Full-text:** SQLite FTS5 search
2. **Semantic:** Vector similarity search (embeddings)
3. **Hybrid:** Combined scoring

**State Management:**

```typescript
// hooks/use-search.ts
export function useSearch(query: string, filters: SearchFilters) {
  return useQuery({
    queryKey: ['search', query, filters],
    queryFn: () => searchApi.search({ query, ...filters }),
    enabled: query.length > 2,
    staleTime: 60000,
  });
}

export function useVectorSearch(query: string, options?: VectorSearchOptions) {
  return useQuery({
    queryKey: ['search', 'vector', query, options],
    queryFn: () => searchApi.vectorSearch(query, options),
    enabled: query.length > 2,
  });
}
```

**API Endpoints:**
- `GET /api/search?q=&mode=&type=&status=&tags=&from=&to=` - Search
- `POST /api/search/vector` - Vector search with embedding
- `GET /api/search/suggest?q=` - Autocomplete suggestions

---

### 5.3 VectorResultsDisplay

Display for vector similarity search results with scores.

**Location:** `dashboard/components/search/vector-results.tsx`

```typescript
interface VectorResultsDisplayProps {
  results: VectorSearchResult[];
  query: string;
  onResultClick?: (result: VectorSearchResult) => void;
  showSimilarityScore?: boolean;
  showEmbeddingVisualization?: boolean;
}

interface VectorSearchResult {
  id: string;
  nodeId: string;
  title: string;
  type: NodeType;
  content: string;
  similarity: number; // 0-1
  embedding?: number[]; // For visualization
  highlights?: string[];
}
```

**Visual Design:**
- Similarity score bar/badge
- Content snippet with highlights
- Optional: 2D embedding visualization (t-SNE/UMAP reduced)
- "More like this" action

---

## 6. Metrics Dashboard

### 6.1 GraphStatsCards

Overview cards displaying key graph statistics.

**Location:** `dashboard/components/dashboard/graph-stats-cards.tsx`

```typescript
interface GraphStatsCardsProps {
  stats: GraphStats;
  previousStats?: GraphStats; // For trends
  loading?: boolean;
}

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<NodeType, number>;
  nodesByStatus: Record<NodeStatus, number>;
  orphanNodes: number;
  avgLinksPerNode: number;
  mostConnected: Array<{ id: string; title: string; connections: number }>;
}
```

**Cards:**
1. Total Nodes (with trend arrow)
2. Total Edges (with trend arrow)
3. Orphan Nodes (with warning if > 10%)
4. Average Connections (per node)
5. Graph Density
6. Type Distribution (mini chart)

**API Endpoints:**
- `GET /api/graph/stats` - Current statistics
- `GET /api/graph/stats/history?days=7` - Historical stats

**Real-Time Updates:**
- Polling every 60 seconds

---

### 6.2 AgentPerformanceCharts

Charts visualizing agent performance metrics.

**Location:** `dashboard/components/dashboard/agent-performance-charts.tsx`

```typescript
interface AgentPerformanceChartsProps {
  agentId?: string; // All agents if not specified
  timeRange: '1h' | '24h' | '7d' | '30d';
  metrics: ('tasks' | 'latency' | 'success_rate' | 'memory')[];
}

interface AgentMetrics {
  agentId: string;
  agentType: AgentType;
  name: string;
  metrics: {
    timestamp: Date;
    tasksCompleted: number;
    tasksFailed: number;
    avgLatencyMs: number;
    successRate: number;
    memoryUsageMb: number;
  }[];
}
```

**Charts (using Recharts/Tremor):**
1. Tasks Over Time (area chart)
2. Success Rate (line chart with threshold)
3. Latency Distribution (histogram)
4. Agent Comparison (bar chart)
5. Memory Usage (stacked area)

**State Management:**

```typescript
// hooks/use-agent-metrics.ts
export function useAgentMetrics(
  agentId: string | undefined,
  timeRange: string
) {
  return useQuery({
    queryKey: ['agents', 'metrics', agentId, timeRange],
    queryFn: () => agentApi.getMetrics({ agentId, timeRange }),
    refetchInterval: 30000, // 30 seconds
  });
}
```

**API Endpoints:**
- `GET /api/agents/metrics?agentId=&range=&metrics=` - Agent metrics

---

### 6.3 SystemHealthIndicators

System health status indicators.

**Location:** `dashboard/components/dashboard/system-health-indicators.tsx`

```typescript
interface SystemHealthIndicatorsProps {
  showDetails?: boolean;
  onServiceClick?: (service: ServiceHealth) => void;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number; // seconds
  services: ServiceHealth[];
  lastCheck: Date;
}

interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  latency?: number; // ms
  message?: string;
  lastCheck: Date;
  details?: Record<string, unknown>;
}
```

**Services Monitored:**
1. SQLite Database
2. Vector Store (HNSW)
3. Audit Chain (Exochain)
4. Workflow Engine
5. Agent Registry
6. Cache Layer
7. MCP Server

**Visual Design:**
- Status indicator dots (green/yellow/red)
- Uptime percentage
- Latency sparklines
- Expandable details

**API Endpoints:**
- `GET /api/health` - System health status
- `GET /api/health/services` - Detailed service health

**Real-Time Updates:**
- Polling every 30 seconds
- SSE for status changes

---

### 6.4 QuickActions

Action buttons for common operations.

**Location:** `dashboard/components/dashboard/quick-actions.tsx`

```typescript
interface QuickActionsProps {
  variant?: 'grid' | 'list';
  showDescriptions?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'secondary';
  disabled?: boolean;
}
```

**Default Actions:**
1. Create Node
2. Start Workflow
3. Spawn Agent
4. Run Analysis
5. Vector Search
6. Export Graph
7. Create Checkpoint
8. Sync to Claude-Flow

---

## 7. Shared Component Utilities

### 7.1 LoadingSkeleton

Skeleton loading states for components.

**Location:** `dashboard/components/shared/loading-skeleton.tsx`

```typescript
interface LoadingSkeletonProps {
  variant: 'card' | 'table' | 'list' | 'graph' | 'chart' | 'text' | 'avatar';
  count?: number;
  className?: string;
}
```

### 7.2 ErrorDisplay

Error boundary and display component.

**Location:** `dashboard/components/shared/error-display.tsx`

```typescript
interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
  retry?: () => void;
  showDetails?: boolean;
}
```

### 7.3 EmptyState

Empty state placeholder.

**Location:** `dashboard/components/shared/empty-state.tsx`

```typescript
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### 7.4 RealtimeIndicator

Real-time connection status indicator.

**Location:** `dashboard/components/shared/realtime-indicator.tsx`

```typescript
interface RealtimeIndicatorProps {
  connected: boolean;
  lastUpdate?: Date;
  showTimestamp?: boolean;
}
```

### 7.5 JSONViewer

Formatted JSON display with syntax highlighting.

**Location:** `dashboard/components/shared/json-viewer.tsx`

```typescript
interface JSONViewerProps {
  data: unknown;
  collapsed?: boolean | number; // Collapse level
  copyable?: boolean;
  maxHeight?: number | string;
}
```

### 7.6 CodeBlock

Code display with syntax highlighting.

**Location:** `dashboard/components/shared/code-block.tsx`

```typescript
interface CodeBlockProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  copyable?: boolean;
  maxHeight?: number | string;
}
```

---

## API Routes Summary

| Endpoint | Method | Description | Real-Time |
|----------|--------|-------------|-----------|
| `/api/graph/nodes` | GET | List nodes (paginated) | Poll 30s |
| `/api/graph/nodes/:id` | GET | Node details | - |
| `/api/graph/nodes/:id` | PATCH | Update node | - |
| `/api/graph/nodes/:id` | DELETE | Delete node | - |
| `/api/graph/nodes/:id/related` | GET | Related nodes | - |
| `/api/graph/edges` | GET | List edges | Poll 30s |
| `/api/graph/stats` | GET | Graph statistics | Poll 60s |
| `/api/workflows` | GET | List workflows | Poll 10s |
| `/api/workflows/:id` | GET | Workflow details | - |
| `/api/workflows/:id/start` | POST | Start workflow | - |
| `/api/workflows/:id/cancel` | POST | Cancel workflow | - |
| `/api/workflows/:id/status` | GET | SSE workflow status | SSE |
| `/api/audit/events` | GET | List audit events | - |
| `/api/audit/events/:id` | GET | Event details | - |
| `/api/audit/stream` | GET | SSE new events | SSE |
| `/api/audit/checkpoints` | GET | List checkpoints | - |
| `/api/audit/verify/:id` | GET | Verify event | - |
| `/api/search` | GET | Full-text search | - |
| `/api/search/vector` | POST | Vector search | - |
| `/api/search/suggest` | GET | Autocomplete | - |
| `/api/agents` | GET | List agents | Poll 10s |
| `/api/agents/:id` | GET | Agent details | - |
| `/api/agents/spawn` | POST | Spawn agent | - |
| `/api/agents/:id/terminate` | POST | Terminate agent | - |
| `/api/agents/activity` | GET | Activity feed | Poll 5s |
| `/api/agents/activity/stream` | GET | SSE activity | SSE |
| `/api/agents/metrics` | GET | Agent metrics | Poll 30s |
| `/api/health` | GET | System health | Poll 30s |
| `/api/health/services` | GET | Service health | - |
| `/api/notifications` | GET | Notifications list | - |
| `/api/notifications/stream` | GET | SSE notifications | SSE |

---

## State Management Summary

### Zustand Stores (Client State)

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `useLayoutStore` | Sidebar state, preferences | localStorage |
| `useNotificationsStore` | Notification queue | Memory only |
| `useCommandPalette` | Command palette state | Memory only |
| `useGraphState` | Graph view state | Memory only |
| `useThemeStore` | Theme preference | localStorage |

### TanStack Query (Server State)

| Query Key | Purpose | Stale Time | Refetch |
|-----------|---------|------------|---------|
| `['graph', 'nodes']` | Node list | 30s | Poll 30s |
| `['graph', 'edges']` | Edge list | 30s | Poll 30s |
| `['graph', 'stats']` | Statistics | 60s | Poll 60s |
| `['workflow', id]` | Workflow details | 5s | SSE |
| `['audit', 'events']` | Audit events | 30s | SSE prepend |
| `['agents', 'list']` | Agent list | 10s | Poll 10s |
| `['agents', 'activity']` | Activity feed | 5s | Poll 5s / SSE |
| `['search', query]` | Search results | 60s | On demand |
| `['health']` | System health | 30s | Poll 30s |

---

## Real-Time Update Patterns

### SSE (Server-Sent Events)

Used for:
- Workflow status updates
- New audit events
- Agent activity
- Notifications

```typescript
// hooks/use-sse.ts
export function useSSE<T>(
  url: string,
  options?: {
    onMessage?: (data: T) => void;
    onError?: (error: Event) => void;
    enabled?: boolean;
  }
) {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!options?.enabled) return;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as T;
        options?.onMessage?.(data);
      } catch (error) {
        console.error('SSE parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      options?.onError?.(error);
      // Implement exponential backoff reconnection
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [url, options?.enabled]);

  return {
    close: () => eventSourceRef.current?.close(),
    readyState: eventSourceRef.current?.readyState,
  };
}
```

### Polling

Used for:
- Graph data (low-frequency changes)
- Agent metrics
- System health

```typescript
// Polling via TanStack Query refetchInterval
useQuery({
  queryKey: ['health'],
  queryFn: healthApi.getStatus,
  refetchInterval: 30000, // 30 seconds
});
```

---

## Implementation Priority

### Phase 1: Core Layout & Navigation
1. DashboardLayout
2. Sidebar
3. Header
4. Breadcrumb

### Phase 2: Data Display
1. DataTable (generic)
2. NodesTable
3. GraphStatsCards
4. LoadingSkeleton / EmptyState / ErrorDisplay

### Phase 3: Graph Visualization
1. GraphCanvas (basic)
2. GraphControls
3. NodeInspector

### Phase 4: Real-Time Features
1. WorkflowTimeline
2. AgentActivityFeed
3. SSE hooks

### Phase 5: Search & Discovery
1. CommandPalette
2. SearchInterface
3. VectorResultsDisplay

### Phase 6: Advanced Features
1. AuditTrailViewer
2. HLCTimeline
3. AgentPerformanceCharts
4. DAG visualization

---

## Testing Strategy

### Component Testing
- Vitest + React Testing Library
- Mock API responses with MSW
- Snapshot testing for visual regression

### Integration Testing
- Test data flow between components
- Test SSE/polling behavior
- Test error states

### E2E Testing
- Playwright for critical user flows
- Graph interaction testing
- Search functionality

---

*Document Version: 1.0.0*
*Last Updated: 2025-12-29*
*Author: Knowledge Graph Agent Development Team*
