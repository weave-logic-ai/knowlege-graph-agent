/**
 * Agents management page
 * View and control AI agents
 */
export default function AgentsPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
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
          <a href="/graph" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <span className="text-lg">&#x1F310;</span>
            <span>Graph Explorer</span>
          </a>
          <a href="/agents" className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary">
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Agents</h2>
            <p className="text-muted-foreground">
              Manage and monitor your AI agents
            </p>
          </div>

          <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            Create Agent
          </button>
        </div>

        {/* Agent stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="dashboard-card">
            <div className="text-sm font-medium text-muted-foreground">Total Agents</div>
            <div className="mt-2 text-2xl font-bold">--</div>
          </div>
          <div className="dashboard-card">
            <div className="text-sm font-medium text-muted-foreground">Running</div>
            <div className="mt-2 text-2xl font-bold text-green-500">--</div>
          </div>
          <div className="dashboard-card">
            <div className="text-sm font-medium text-muted-foreground">Idle</div>
            <div className="mt-2 text-2xl font-bold text-yellow-500">--</div>
          </div>
          <div className="dashboard-card">
            <div className="text-sm font-medium text-muted-foreground">Error</div>
            <div className="mt-2 text-2xl font-bold text-red-500">--</div>
          </div>
        </div>

        {/* Agents list */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Agent List</h3>
            <input
              type="search"
              placeholder="Search agents..."
              className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="text-muted-foreground text-center py-8">
            Agent list will be implemented by component agents
          </div>
        </div>

        {/* Agent logs */}
        <div className="mt-8 dashboard-card">
          <h3 className="font-semibold mb-4">Recent Logs</h3>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm">
            <p className="text-muted-foreground">No logs to display</p>
          </div>
        </div>
      </main>
    </div>
  );
}
