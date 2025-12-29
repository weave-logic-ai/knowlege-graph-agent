import Link from 'next/link';

export default function DashboardHome() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar placeholder - will be implemented by layout component agent */}
      <aside className="w-64 border-r bg-card p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-primary">Knowledge Graph</h1>
          <p className="text-sm text-muted-foreground">Agent Dashboard</p>
        </div>

        <nav className="space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary"
          >
            <span className="text-lg">&#x1F3E0;</span>
            <span>Overview</span>
          </Link>
          <Link
            href="/graph"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span className="text-lg">&#x1F310;</span>
            <span>Graph Explorer</span>
          </Link>
          <Link
            href="/agents"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span className="text-lg">&#x1F916;</span>
            <span>Agents</span>
          </Link>
          <Link
            href="/workflows"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span className="text-lg">&#x26A1;</span>
            <span>Workflows</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span className="text-lg">&#x2699;</span>
            <span>Settings</span>
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Monitor and manage your knowledge graph agents
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Nodes"
            value="--"
            description="Entities in the graph"
          />
          <StatsCard
            title="Total Edges"
            value="--"
            description="Relationships mapped"
          />
          <StatsCard
            title="Active Agents"
            value="--"
            description="Currently running"
          />
          <StatsCard
            title="Workflows"
            value="--"
            description="Defined workflows"
          />
        </div>

        {/* Recent activity placeholder */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="dashboard-card">
            <p className="text-muted-foreground text-center py-8">
              Activity feed will be implemented by component agents
            </p>
          </div>
        </div>

        {/* Graph preview placeholder */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Graph Preview</h3>
          <div className="graph-container h-[400px]">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Graph visualization will be implemented by graph component agent
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
}

function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <div className="dashboard-card">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  );
}
