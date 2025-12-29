/**
 * Workflows management page
 * Define and monitor automated workflows
 */
export default function WorkflowsPage() {
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
          <a href="/agents" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <span className="text-lg">&#x1F916;</span>
            <span>Agents</span>
          </a>
          <a href="/workflows" className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary">
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
            <h2 className="text-3xl font-bold tracking-tight">Workflows</h2>
            <p className="text-muted-foreground">
              Create and manage automated workflows
            </p>
          </div>

          <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            New Workflow
          </button>
        </div>

        {/* Workflow stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="dashboard-card">
            <div className="text-sm font-medium text-muted-foreground">Total Workflows</div>
            <div className="mt-2 text-2xl font-bold">--</div>
          </div>
          <div className="dashboard-card">
            <div className="text-sm font-medium text-muted-foreground">Active</div>
            <div className="mt-2 text-2xl font-bold text-green-500">--</div>
          </div>
          <div className="dashboard-card">
            <div className="text-sm font-medium text-muted-foreground">Runs Today</div>
            <div className="mt-2 text-2xl font-bold">--</div>
          </div>
          <div className="dashboard-card">
            <div className="text-sm font-medium text-muted-foreground">Success Rate</div>
            <div className="mt-2 text-2xl font-bold">--%</div>
          </div>
        </div>

        {/* Workflows list */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Workflow List</h3>
            <div className="flex gap-2">
              <select className="rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="draft">Draft</option>
              </select>
              <input
                type="search"
                placeholder="Search workflows..."
                className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="text-muted-foreground text-center py-8">
            Workflow list will be implemented by component agents
          </div>
        </div>

        {/* Recent runs */}
        <div className="mt-8 dashboard-card">
          <h3 className="font-semibold mb-4">Recent Runs</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-2">Workflow</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2">Started</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  No recent runs
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
