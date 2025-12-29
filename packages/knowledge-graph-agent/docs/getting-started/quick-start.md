---
title: Quick Start
description: Get up and running with @weavelogic/knowledge-graph-agent in 5 minutes
category: getting-started
---

# Quick Start

This guide gets you from zero to a working knowledge graph in 5 minutes.

## Prerequisites

Ensure you have:
- Node.js >= 20.0.0 installed
- A project with source code or documentation

See the [Installation Guide](./installation.md) if you need to install the package first.

## Step 1: Initialize Knowledge Graph

Navigate to your project root and initialize:

```bash
cd /path/to/your/project
kg init
```

This creates the `.kg` directory with:
- `config.json` - Configuration file
- `knowledge.db` - SQLite database

You can also use npx without installing globally:

```bash
npx @weavelogic/knowledge-graph-agent init
```

### Init Options

```bash
# Specify custom docs path
kg init --docs-path docs-nn

# Initialize with specific namespace
kg init --namespace myproject

# Dry run to see what would be created
kg init --dry-run
```

## Step 2: Bootstrap from Codebase

Automatically detect your project's frameworks, dependencies, and services:

```bash
kg init-primitives
```

This analyzes your codebase and generates primitive nodes for:
- **Frameworks**: React, Next.js, Express, etc.
- **Dependencies**: From package.json, requirements.txt, etc.
- **Services**: Database connections, APIs, etc.
- **Project Structure**: Source files and documentation

### Supported Ecosystems

| Ecosystem | Detected Files |
|-----------|----------------|
| Node.js | package.json |
| Python | requirements.txt, pyproject.toml |
| PHP | composer.json |
| Rust | Cargo.toml |
| Go | go.mod |
| Java | pom.xml, build.gradle |

## Step 3: Generate Knowledge Graph

Build the knowledge graph from your documentation:

```bash
kg graph
```

This parses all markdown files in your docs directory and creates:
- **Nodes**: Concepts, entities, and documents
- **Edges**: Relationships between nodes
- **Tags**: Categorization metadata

### View Graph Statistics

```bash
kg stats
```

Example output:
```
Knowledge Graph Statistics

Nodes: 156
  Concepts: 45
  Entities: 78
  Documents: 33

Edges: 234
  References: 120
  Contains: 89
  RelatedTo: 25

Tags: 42
```

## Step 4: Start All Servers

Launch the MCP server, GraphQL API, and web dashboard:

```bash
kg serve --all
```

This starts:
- **MCP Server**: stdio-based for Claude integration
- **GraphQL API**: http://localhost:4000/graphql
- **Dashboard**: http://localhost:3001

### Custom Ports

```bash
kg serve --all --port-graphql 8080 --port-dashboard 8081
```

### Start Individual Servers

```bash
# Just the MCP server
kg serve --mcp

# Just GraphQL
kg serve --graphql

# Just the dashboard
kg serve --dashboard
```

## Step 5: Access the Dashboard

Open your browser to:

```
http://localhost:3001
```

The dashboard provides:
- **Graph Visualization**: Interactive node/edge explorer
- **Search**: Full-text and semantic search
- **Data Tables**: Sortable, filterable node lists
- **Agent Monitoring**: View agent status and history
- **Workflow Tracking**: Monitor workflow progress

## Step 6: Query the GraphQL API

Open the GraphQL Playground at http://localhost:4000/graphql and try these queries:

### Get All Nodes

```graphql
query {
  nodes(filter: { type: CONCEPT }, pagination: { first: 10 }) {
    edges {
      node {
        id
        title
        type
        tags
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

### Search Nodes

```graphql
query {
  searchNodes(query: "authentication", options: { limit: 5 }) {
    id
    title
    score
    snippet
  }
}
```

### Get Graph Structure

```graphql
query {
  graph {
    nodes {
      id
      title
      type
    }
    edges {
      source
      target
      type
    }
    stats {
      nodeCount
      edgeCount
    }
  }
}
```

### Real-Time Subscriptions

```graphql
subscription {
  nodeCreated {
    id
    title
    createdAt
  }
}
```

## Step 7: Use the CLI for Common Tasks

### Search the Knowledge Graph

```bash
kg search "authentication patterns"
```

### Analyze Codebase

```bash
kg analyze-codebase
```

### Run Deep Analysis (requires claude-flow)

```bash
kg analyze deep
```

### View Workflow Status

```bash
kg workflow list
kg workflow status <workflow-id>
```

## Quick Reference

| Task | Command |
|------|---------|
| Initialize | `kg init` |
| Bootstrap primitives | `kg init-primitives` |
| Generate graph | `kg graph` |
| Start all servers | `kg serve --all` |
| View stats | `kg stats` |
| Search | `kg search <query>` |
| Analyze codebase | `kg analyze-codebase` |
| Show config | `kg config show` |
| Run diagnostics | `kg diag run` |
| View help | `kg --help` |

## Example Workflow

Here's a complete example for a new TypeScript project:

```bash
# 1. Navigate to project
cd my-typescript-app

# 2. Initialize knowledge graph
kg init --docs-path docs

# 3. Bootstrap from codebase
kg init-primitives

# 4. Generate the graph
kg graph

# 5. Check stats
kg stats

# 6. Start servers
kg serve --all

# 7. Open dashboard
open http://localhost:3001
```

## Next Steps

Now that you have a working knowledge graph:

- **[Configuration Guide](./configuration.md)** - Customize settings for your needs
- **[CLI Commands Reference](/docs/CLI-COMMANDS-REFERENCE.md)** - Full command documentation
- **[Agent System Guide](/docs/guides/agents.md)** - Use AI agents for automation
- **[Plugin Development](/docs/guides/plugins.md)** - Create custom analyzers
- **[GraphQL API Reference](/docs/API.md)** - Complete API documentation

## Troubleshooting

### "No documents found"

Ensure your docs directory contains markdown files:

```bash
ls docs/*.md
```

Or specify a different path:

```bash
kg init --docs-path ./documentation
```

### "Database locked"

Only one process can write to the database at a time. Stop other `kg` processes:

```bash
# Find and kill existing processes
pkill -f "kg serve"
```

### Servers Won't Start

Check if ports are already in use:

```bash
lsof -i :4000  # GraphQL
lsof -i :3001  # Dashboard
```

Use custom ports if needed:

```bash
kg serve --all --port-graphql 4001 --port-dashboard 3002
```

### More Help

Run diagnostics to identify issues:

```bash
kg diag run
kg diag health
```

See the [Installation Guide](./installation.md) for more troubleshooting tips.
