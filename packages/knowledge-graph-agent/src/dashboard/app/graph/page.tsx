/**
 * Graph Explorer page
 * Main visualization interface for the knowledge graph
 */
export default function GraphExplorerPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - same as home */}
      <aside className="w-64 border-r bg-card p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-primary">Knowledge Graph</h1>
          <p className="text-sm text-muted-foreground">Agent Dashboard</p>
        </div>

        <nav className="space-y-2">
          <a href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <span className="text-lg">&#x1F3E0;</span>
            <span>Overview</span>
          </a>
          <a href="/graph" className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary">
            <span className="text-lg">&#x1F310;</span>
            <span>Graph Explorer</span>
          </a>
          <a href="/agents" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <span className="text-lg">&#x1F916;</span>
            <span>Agents</span>
          </a>
          <a href="/workflows" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <span className="text-lg">&#x26A1;</span>
            <span>Workflows</span>
          </a>
          <a href="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <span className="text-lg">&#x2699;</span>
            <span>Settings</span>
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Graph Explorer</h2>
            <p className="text-muted-foreground">
              Visualize and interact with your knowledge graph
            </p>
          </div>

          {/* Toolbar placeholder */}
          <div className="flex gap-2">
            <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
              Add Node
            </button>
            <button className="rounded-lg border px-4 py-2 hover:bg-muted">
              Export
            </button>
          </div>
        </div>

        {/* Graph container */}
        <div className="graph-container h-[calc(100vh-200px)]">
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">Graph Visualization</p>
              <p className="text-sm">Cytoscape.js component will be implemented here</p>
            </div>
          </div>
        </div>

        {/* Node details panel placeholder */}
        <div className="mt-4 dashboard-card">
          <h3 className="font-semibold mb-2">Node Details</h3>
          <p className="text-muted-foreground text-sm">
            Select a node to view its properties and relationships
          </p>
        </div>
      </main>
    </div>
  );
}
