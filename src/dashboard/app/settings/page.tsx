/**
 * Settings page
 * Configure dashboard and system settings
 */
export default function SettingsPage() {
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
          <a href="/workflows" className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <span className="text-lg">&#x26A1;</span>
            <span>Workflows</span>
          </a>
          <a href="/settings" className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-primary">
            <span className="text-lg">&#x2699;</span>
            <span>Settings</span>
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Configure your dashboard and system preferences
          </p>
        </div>

        <div className="max-w-2xl space-y-8">
          {/* Appearance */}
          <div className="dashboard-card">
            <h3 className="font-semibold mb-4">Appearance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Theme</div>
                  <div className="text-sm text-muted-foreground">
                    Choose your preferred color scheme
                  </div>
                </div>
                <select className="rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>

          {/* Graph Settings */}
          <div className="dashboard-card">
            <h3 className="font-semibold mb-4">Graph Visualization</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Default Layout</div>
                  <div className="text-sm text-muted-foreground">
                    Initial layout for graph visualization
                  </div>
                </div>
                <select className="rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value="force">Force-directed</option>
                  <option value="hierarchical">Hierarchical</option>
                  <option value="circular">Circular</option>
                  <option value="grid">Grid</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Show Labels</div>
                  <div className="text-sm text-muted-foreground">
                    Display node labels in the graph
                  </div>
                </div>
                <button className="relative h-6 w-11 rounded-full bg-primary">
                  <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white"></span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Animation</div>
                  <div className="text-sm text-muted-foreground">
                    Enable smooth animations
                  </div>
                </div>
                <button className="relative h-6 w-11 rounded-full bg-primary">
                  <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white"></span>
                </button>
              </div>
            </div>
          </div>

          {/* API Settings */}
          <div className="dashboard-card">
            <h3 className="font-semibold mb-4">API Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">API Endpoint</label>
                <input
                  type="text"
                  defaultValue="http://localhost:3001"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">WebSocket URL</label>
                <input
                  type="text"
                  defaultValue="ws://localhost:3001"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="dashboard-card">
            <h3 className="font-semibold mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Browser Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Receive alerts in your browser
                  </div>
                </div>
                <button className="relative h-6 w-11 rounded-full bg-muted">
                  <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-muted-foreground"></span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-refresh</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically refresh data
                  </div>
                </div>
                <button className="relative h-6 w-11 rounded-full bg-primary">
                  <span className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white"></span>
                </button>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-2">
            <button className="rounded-lg border px-4 py-2 hover:bg-muted">
              Reset to Defaults
            </button>
            <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
              Save Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
