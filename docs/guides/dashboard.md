# Dashboard Guide

The Knowledge Graph Dashboard provides a visual interface for exploring, managing, and analyzing your knowledge graph. Built with Next.js 14+ and React 18+, it offers interactive graph visualization, search, and management capabilities.

## Overview

The dashboard includes:

1. **Graph Visualization** - Interactive force-directed graph display
2. **Node Explorer** - Browse and manage nodes
3. **Search Interface** - Full-text and semantic search
4. **Analytics** - Statistics and insights
5. **Settings** - Configuration management

## Getting Started

### Installation

```bash
# Install the dashboard package
npm install @knowledge-graph-agent/dashboard

# Or use the CLI
npx kg-dashboard init
```

### Starting the Dashboard

```bash
# Start in development mode
npm run dashboard:dev

# Start in production mode
npm run dashboard:start

# Start with custom port
PORT=3001 npm run dashboard:start
```

### Configuration

Create a `dashboard.config.js` file:

```javascript
module.exports = {
  // API endpoints
  api: {
    graphql: 'http://localhost:4000/graphql',
    ws: 'ws://localhost:4000/subscriptions',
    mcp: 'http://localhost:3100'
  },

  // Graph visualization settings
  graph: {
    physics: {
      enabled: true,
      stabilization: true
    },
    nodes: {
      size: 20,
      font: { size: 12 }
    },
    edges: {
      smooth: true,
      arrows: 'to'
    }
  },

  // Theme settings
  theme: {
    mode: 'system', // 'light' | 'dark' | 'system'
    primary: '#3b82f6',
    accent: '#8b5cf6'
  },

  // Feature flags
  features: {
    realtime: true,
    analytics: true,
    aiAssistant: true
  }
};
```

## Tech Stack

The dashboard is built with:

| Technology | Purpose |
|------------|---------|
| Next.js 14+ | React framework with App Router |
| React 18+ | UI component library |
| shadcn/ui | Component system |
| TanStack Query | Data fetching and caching |
| Zustand | State management |
| react-force-graph-2d | Graph visualization |
| Tailwind CSS | Styling |

## Graph Visualization

### Interactive Features

The graph visualization supports:

- **Pan and Zoom** - Navigate the graph
- **Node Selection** - Click to select and view details
- **Edge Highlighting** - Hover to highlight connections
- **Drag Nodes** - Reposition nodes manually
- **Clustering** - Group related nodes
- **Filtering** - Show/hide by type or status

### Graph Component

```tsx
import { KnowledgeGraphView } from '@knowledge-graph-agent/dashboard';

function MyGraphPage() {
  return (
    <KnowledgeGraphView
      // Data options
      initialNodes={nodes}
      initialEdges={edges}

      // Visualization options
      width={800}
      height={600}
      physics={true}

      // Interaction handlers
      onNodeClick={(node) => console.log('Clicked:', node)}
      onNodeHover={(node) => console.log('Hovered:', node)}
      onEdgeClick={(edge) => console.log('Edge:', edge)}

      // Styling
      nodeColor={(node) => getColorByType(node.type)}
      edgeColor={(edge) => getColorByWeight(edge.weight)}
      nodeSize={(node) => getSizeByConnections(node)}

      // Layout
      layout="force" // 'force' | 'hierarchical' | 'radial'
      gravity={-100}
      linkDistance={100}
    />
  );
}
```

### Layout Options

```tsx
// Force-directed layout (default)
<KnowledgeGraphView layout="force" />

// Hierarchical layout
<KnowledgeGraphView
  layout="hierarchical"
  hierarchyDirection="UD" // 'UD' | 'DU' | 'LR' | 'RL'
/>

// Radial layout
<KnowledgeGraphView
  layout="radial"
  centerNode="root-node-id"
/>
```

### Color Schemes

```tsx
const typeColors: Record<NodeType, string> = {
  concept: '#3b82f6',     // Blue
  technical: '#10b981',   // Green
  feature: '#f59e0b',     // Amber
  primitive: '#8b5cf6',   // Purple
  service: '#ef4444',     // Red
  guide: '#06b6d4',       // Cyan
  standard: '#6366f1',    // Indigo
  integration: '#ec4899'  // Pink
};

<KnowledgeGraphView
  nodeColor={(node) => typeColors[node.type]}
/>
```

## Navigation

### Sidebar Navigation

The dashboard sidebar provides access to:

| Section | Description |
|---------|-------------|
| **Graph** | Interactive graph visualization |
| **Nodes** | Node list and management |
| **Search** | Full-text and semantic search |
| **Tags** | Tag browser and management |
| **Analytics** | Statistics and insights |
| **Agents** | Agent status and control |
| **Settings** | Configuration options |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open search |
| `Cmd/Ctrl + N` | Create new node |
| `Cmd/Ctrl + G` | Focus graph view |
| `Cmd/Ctrl + /` | Show shortcuts |
| `Escape` | Close modal/panel |
| `F` | Fit graph to view |
| `R` | Reset graph layout |

### Breadcrumb Navigation

```tsx
import { Breadcrumb } from '@knowledge-graph-agent/dashboard';

<Breadcrumb
  items={[
    { label: 'Graph', href: '/graph' },
    { label: 'Concepts', href: '/graph?type=concept' },
    { label: 'Event Sourcing', href: '/node/event-sourcing' }
  ]}
/>
```

## Node Management

### Node List View

```tsx
import { NodeList } from '@knowledge-graph-agent/dashboard';

<NodeList
  // Filtering
  type="concept"
  status="active"
  tags={['architecture']}

  // Sorting
  sortBy="lastModified"
  sortOrder="desc"

  // Pagination
  pageSize={20}
  page={1}

  // Actions
  onNodeSelect={(node) => navigateToNode(node.id)}
  onNodeEdit={(node) => openEditModal(node)}
  onNodeDelete={(node) => confirmDelete(node)}
/>
```

### Node Detail View

```tsx
import { NodeDetail } from '@knowledge-graph-agent/dashboard';

<NodeDetail
  nodeId="event-sourcing"

  // Display options
  showContent={true}
  showFrontmatter={true}
  showLinks={true}
  showStats={true}

  // Actions
  onEdit={() => openEditModal()}
  onDelete={() => confirmDelete()}
  onLinkClick={(link) => navigateToLink(link)}
/>
```

### Node Editor

```tsx
import { NodeEditor } from '@knowledge-graph-agent/dashboard';

<NodeEditor
  // Mode
  mode="create" // 'create' | 'edit'
  node={existingNode} // For edit mode

  // Configuration
  defaultType="concept"
  allowedTypes={['concept', 'technical', 'feature']}

  // Callbacks
  onSave={(node) => saveNode(node)}
  onCancel={() => closeEditor()}

  // Features
  enableMarkdownPreview={true}
  enableAutoLink={true}
  enableTagSuggestions={true}
/>
```

## Search Interface

### Search Component

```tsx
import { SearchBox } from '@knowledge-graph-agent/dashboard';

<SearchBox
  // Mode
  mode="fulltext" // 'fulltext' | 'semantic'

  // Options
  placeholder="Search knowledge graph..."
  autoFocus={true}
  debounceMs={300}

  // Filters
  types={['concept', 'technical']}
  status="active"

  // Results
  maxResults={20}
  highlightMatches={true}

  // Callbacks
  onSearch={(query) => performSearch(query)}
  onResultSelect={(result) => navigateToResult(result)}
/>
```

### Advanced Search

```tsx
import { AdvancedSearch } from '@knowledge-graph-agent/dashboard';

<AdvancedSearch
  // Query builder
  enableQueryBuilder={true}

  // Filters
  filters={[
    { field: 'type', operator: 'in', values: ['concept', 'technical'] },
    { field: 'status', operator: 'eq', value: 'active' },
    { field: 'tags', operator: 'contains', value: 'architecture' }
  ]}

  // Date range
  dateRange={{
    field: 'lastModified',
    from: '2024-01-01',
    to: '2024-12-31'
  }}

  // Results
  onResults={(results) => displayResults(results)}
/>
```

### Search Results

```tsx
import { SearchResults } from '@knowledge-graph-agent/dashboard';

<SearchResults
  results={searchResults}

  // Display options
  view="list" // 'list' | 'grid' | 'compact'
  showSnippets={true}
  highlightQuery={true}

  // Pagination
  page={1}
  pageSize={20}
  totalCount={100}
  onPageChange={(page) => setPage(page)}

  // Actions
  onResultClick={(result) => navigateToResult(result)}
/>
```

## Analytics

### Statistics Dashboard

```tsx
import { StatsDashboard } from '@knowledge-graph-agent/dashboard';

<StatsDashboard
  // Time range
  timeRange="30d" // '7d' | '30d' | '90d' | 'all'

  // Metrics to display
  metrics={[
    'totalNodes',
    'nodesByType',
    'nodesByStatus',
    'edgeCount',
    'orphanNodes',
    'recentActivity'
  ]}

  // Chart options
  chartType="bar" // 'bar' | 'pie' | 'line'
/>
```

### Graph Analytics

```tsx
import { GraphAnalytics } from '@knowledge-graph-agent/dashboard';

<GraphAnalytics
  // Analysis types
  analyses={[
    'centrality',
    'clustering',
    'pathAnalysis',
    'densityMap'
  ]}

  // Visualization
  highlightOnGraph={true}
  showLegend={true}
/>
```

## State Management

### Zustand Store

The dashboard uses Zustand for state management:

```typescript
import { useGraphStore } from '@knowledge-graph-agent/dashboard';

function MyComponent() {
  const {
    // State
    nodes,
    edges,
    selectedNode,
    filters,

    // Actions
    selectNode,
    setFilters,
    refreshGraph,
    clearSelection
  } = useGraphStore();

  return (
    <button onClick={() => selectNode('node-id')}>
      Select Node
    </button>
  );
}
```

### Query State (TanStack Query)

```typescript
import { useNode, useNodes, useSearch } from '@knowledge-graph-agent/dashboard';

function NodeComponent({ nodeId }) {
  // Single node query
  const { data: node, isLoading, error } = useNode(nodeId);

  // List query with filters
  const { data: nodes } = useNodes({
    type: 'concept',
    status: 'active',
    limit: 20
  });

  // Search query
  const { data: results } = useSearch('event sourcing', {
    types: ['concept'],
    limit: 10
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <NodeCard node={node} />;
}
```

## Real-Time Updates

### Subscription Hooks

```typescript
import { useNodeSubscription, useGraphSubscription } from '@knowledge-graph-agent/dashboard';

function LiveGraph() {
  // Subscribe to all node changes
  useNodeSubscription({
    onNodeCreated: (node) => addNode(node),
    onNodeUpdated: (node) => updateNode(node),
    onNodeDeleted: (nodeId) => removeNode(nodeId)
  });

  // Subscribe to specific node
  useGraphSubscription('event-sourcing', {
    onUpdate: (node) => setNode(node)
  });

  return <KnowledgeGraphView />;
}
```

### Real-Time Indicators

```tsx
import { LiveIndicator } from '@knowledge-graph-agent/dashboard';

<LiveIndicator
  connected={true}
  lastUpdate={new Date()}
/>
```

## Configuration

### Theme Configuration

```tsx
import { ThemeProvider } from '@knowledge-graph-agent/dashboard';

<ThemeProvider
  mode="dark" // 'light' | 'dark' | 'system'
  theme={{
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#8b5cf6',
    background: '#0f172a',
    foreground: '#f8fafc',
    muted: '#1e293b',
    border: '#334155'
  }}
>
  <App />
</ThemeProvider>
```

### API Configuration

```tsx
import { APIProvider } from '@knowledge-graph-agent/dashboard';

<APIProvider
  graphqlUrl="http://localhost:4000/graphql"
  wsUrl="ws://localhost:4000/subscriptions"
  mcpUrl="http://localhost:3100"
  headers={{
    Authorization: `Bearer ${token}`
  }}
>
  <App />
</APIProvider>
```

### Feature Flags

```tsx
import { FeatureFlagsProvider } from '@knowledge-graph-agent/dashboard';

<FeatureFlagsProvider
  flags={{
    realtime: true,
    analytics: true,
    aiAssistant: false,
    beta: {
      semanticSearch: true,
      autoTagging: false
    }
  }}
>
  <App />
</FeatureFlagsProvider>
```

## Component API Reference

### Core Components

| Component | Purpose |
|-----------|---------|
| `KnowledgeGraphView` | Main graph visualization |
| `NodeList` | Paginated node list |
| `NodeDetail` | Single node view |
| `NodeEditor` | Create/edit nodes |
| `SearchBox` | Search input |
| `SearchResults` | Search results display |
| `StatsDashboard` | Analytics overview |
| `Sidebar` | Navigation sidebar |

### UI Components (shadcn/ui)

| Component | Purpose |
|-----------|---------|
| `Button` | Action buttons |
| `Card` | Content containers |
| `Dialog` | Modal dialogs |
| `Dropdown` | Dropdown menus |
| `Input` | Form inputs |
| `Tabs` | Tabbed content |
| `Toast` | Notifications |
| `Tooltip` | Hover tooltips |

## Customization

### Custom Node Renderer

```tsx
import { KnowledgeGraphView, NodeRenderer } from '@knowledge-graph-agent/dashboard';

const CustomNodeRenderer: NodeRenderer = ({ node, selected }) => (
  <g>
    <circle
      r={selected ? 25 : 20}
      fill={getColorByType(node.type)}
      stroke={selected ? '#fff' : 'none'}
      strokeWidth={2}
    />
    <text textAnchor="middle" dy={30}>
      {node.title}
    </text>
  </g>
);

<KnowledgeGraphView
  nodeRenderer={CustomNodeRenderer}
/>
```

### Custom Sidebar Items

```tsx
import { Sidebar, SidebarItem } from '@knowledge-graph-agent/dashboard';

<Sidebar>
  <SidebarItem icon={<GraphIcon />} href="/graph">
    Graph
  </SidebarItem>
  <SidebarItem icon={<CustomIcon />} href="/custom">
    My Custom Page
  </SidebarItem>
</Sidebar>
```

## Performance

### Optimization Tips

1. **Virtualize large lists** - Use virtual scrolling for 100+ items
2. **Limit graph nodes** - Filter to show relevant subgraph
3. **Use pagination** - Don't load all data at once
4. **Enable caching** - TanStack Query handles this automatically
5. **Debounce search** - Reduce API calls during typing

### Performance Monitoring

```tsx
import { PerformanceMonitor } from '@knowledge-graph-agent/dashboard';

<PerformanceMonitor
  enabled={process.env.NODE_ENV === 'development'}
  metrics={['fps', 'memory', 'networkLatency']}
  onThreshold={(metric, value) => {
    console.warn(`${metric} exceeded threshold: ${value}`);
  }}
/>
```

## Troubleshooting

### Common Issues

**Graph not rendering**
- Check API endpoint configuration
- Verify data is being returned
- Check browser console for errors

**Slow performance**
- Reduce number of visible nodes
- Disable physics simulation
- Use simpler node renderers

**WebSocket not connecting**
- Verify WebSocket URL is correct
- Check for firewall/proxy issues
- Ensure server supports WebSocket

### Debug Mode

```bash
# Enable debug logging
DEBUG=kg:dashboard* npm run dashboard:dev

# Check component renders
REACT_DEVTOOLS=true npm run dashboard:dev
```

## Related Guides

- [GraphQL API Guide](./graphql-api.md) - API for dashboard data
- [Knowledge Graph Guide](./knowledge-graph.md) - Graph concepts
- [MCP Server Guide](./mcp-server.md) - MCP integration
