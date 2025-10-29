# Weaver Hybrid Architecture: Next.js + CLI + MCP

## Overview

Weaver now uses a **hybrid architecture** combining:

1. **Next.js Workflow Server** - Runs Vercel Workflow DevKit for durable workflow execution
2. **CLI Interface** - Command-line interface that communicates with the Next.js server via HTTP API
3. **MCP Server** - Model Context Protocol for AI agent integration

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Weaver System                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐      HTTP API      ┌───────────────┐  │
│  │              │◄───────────────────►│               │  │
│  │  CLI Client  │                     │  Next.js App  │  │
│  │  (Commands)  │                     │  (Workflows)  │  │
│  │              │                     │               │  │
│  └──────────────┘                     └───────┬───────┘  │
│         │                                     │          │
│         │                                     │          │
│         │ stdio                               │          │
│         ▼                                     ▼          │
│  ┌──────────────┐                     ┌───────────────┐  │
│  │              │                     │ Workflow      │  │
│  │  MCP Server  │                     │ DevKit        │  │
│  │  (AI Tools)  │                     │ (Durable)     │  │
│  │              │                     │               │  │
│  └──────────────┘                     └───────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. Next.js Workflow Server (Port 3000)

**Location**: `/weaver/app/`, `/weaver/workflows/`

**Purpose**: Runs Vercel Workflow DevKit for durable, long-running workflows

**Features**:
- Automatic workflow discovery in `workflows/` directory
- Durable execution with step-by-step observability
- Workflow DevKit endpoints:
  - `/.well-known/workflow/v1/flow` - Workflow execution
  - `/.well-known/workflow/v1/step` - Step execution
- Custom API endpoints:
  - `POST /api/workflows` - Trigger workflows
  - `GET /api/workflows` - List available workflows

**Configuration**: `next.config.mjs` with `withWorkflow()` wrapper

**Start Commands**:
```bash
npm run dev:web      # Development server
npm run build:web    # Build for production
npm run start:web    # Production server
```

### 2. CLI Client

**Location**: `/weaver/src/cli/`

**Purpose**: User-friendly command-line interface

**Features**:
- `weaver workflow run <name> [path]` - Execute workflow via API
- `weaver workflow list` - List available workflows
- `weaver workflow status` - Check server status
- `weaver workflow test <name> [path]` - Dry-run mode
- `weaver init-vault` - Initialize new vault
- `weaver service start|stop|status` - Service management
- `weaver learn` - Learning loop commands
- `weaver perceive` - Perception commands

**API Client**: `src/cli/commands/workflow-api.ts`
- Communicates with Next.js server via HTTP
- Health checks and auto-connection
- Server URL configuration (`--server` flag)

**Build Commands**:
```bash
npm run build:cli    # Build CLI
npm run dev:cli      # Development mode (tsx)
```

### 3. MCP Server

**Location**: `/weaver/src/mcp-server/`

**Purpose**: Expose tools to AI agents via Model Context Protocol

**Features**:
- File operations (read, write, list)
- Workflow triggers
- Knowledge graph operations
- Context building
- Learning loop integration

**Start Commands**:
```bash
weaver-mcp start     # Start MCP server
```

## Development Workflow

### Running the Full System

**Option 1: All Together (Recommended for Development)**
```bash
npm run dev:all      # Runs both Next.js and CLI in watch mode
```

**Option 2: Separate Terminals**
```bash
# Terminal 1: Start Next.js workflow server
npm run dev:web

# Terminal 2: Use CLI commands
npm run dev:cli workflow status
npm run dev:cli workflow list
npm run dev:cli workflow run document-connection README.md
```

### Testing Workflows

1. **Start the workflow server:**
   ```bash
   npm run dev:web
   # Server starts at http://localhost:3000
   ```

2. **Verify server is running:**
   ```bash
   npm run dev:cli workflow status
   ```

3. **List available workflows:**
   ```bash
   npm run dev:cli workflow list
   ```

4. **Run a workflow:**
   ```bash
   npm run dev:cli workflow run document-connection path/to/file.md
   ```

5. **Test in dry-run mode:**
   ```bash
   npm run dev:cli workflow test document-connection path/to/file.md
   ```

## Workflows

### Document Connection Workflow

**File**: `workflows/document-connection.ts`

**Purpose**: Automatically connects documents based on context similarity

**Workflow Steps**:
1. **Build Context** - Analyze document and directory structure
2. **Find Candidates** - Search for similar documents (top 5)
3. **Update Document** - Add `related_to` frontmatter connections

**Input Parameters**:
```typescript
{
  filePath: string;      // Absolute path to file
  vaultRoot: string;     // Vault root directory
  eventType: 'add' | 'change';
  dryRun?: boolean;      // Preview without changes
}
```

**Output**:
```typescript
{
  success: boolean;
  connections: number;
  filesModified: string[];
  duration: number;
  error?: string;
}
```

## Migration from OLD to NEW Workflows

### OLD System (WorkflowEngine)

- Location: `src/workflow-engine/`
- Pattern: Event-driven with file watchers
- Execution: In-memory, no durability
- Observability: Basic logging

### NEW System (Workflow DevKit)

- Location: `workflows/`
- Pattern: HTTP API-triggered
- Execution: Durable with step checkpoints
- Observability: Full step-by-step tracing

### Migration Steps

1. ✅ Install Next.js and Workflow DevKit
2. ✅ Create Next.js app structure
3. ✅ Move workflows to `workflows/` directory
4. ✅ Configure `withWorkflow()` wrapper
5. ✅ Update CLI to use HTTP API
6. ⏳ Test complete hybrid system
7. ⏳ Add MCP integration for workflows
8. ⏳ Document all workflows

## Adding New Workflows

1. **Create workflow file** in `workflows/` directory:
   ```typescript
   // workflows/my-workflow.ts
   export async function myWorkflow(input: MyInput): Promise<MyResult> {
     'use workflow';

     // Step 1
     const result1 = await step1(input);

     // Step 2
     const result2 = await step2(result1);

     return result2;
   }

   async function step1(input: MyInput) {
     'use step';
     // Step logic
   }

   async function step2(data: any) {
     'use step';
     // Step logic
   }
   ```

2. **Add API endpoint** in `app/api/workflows/route.ts`:
   ```typescript
   import { myWorkflow } from '../../../workflows/my-workflow';

   // Handle workflow-specific input
   if (name === 'my-workflow') {
     const run = await start(myWorkflow, [input]);
     const result = await run.returnValue;
     return NextResponse.json({ runId: run.id, result });
   }
   ```

3. **Add CLI command** (optional):
   ```typescript
   // In workflow-new.ts
   if (name === 'my-workflow') {
     const result = await client.executeMyWorkflow(input);
     // Display results
   }
   ```

4. **Test the workflow**:
   ```bash
   npm run dev:cli workflow run my-workflow
   ```

## Benefits of Hybrid Architecture

### 1. **Durability**
- Workflows survive server restarts
- Automatic retries on failure
- Step-by-step checkpoints

### 2. **Observability**
- Full workflow execution traces
- Step timing and status
- Error tracking per step

### 3. **Scalability**
- Next.js handles multiple concurrent workflows
- Can deploy to Vercel/production
- CLI remains lightweight

### 4. **Developer Experience**
- Simple CLI interface for users
- Powerful workflow engine under the hood
- Easy to test and debug

### 5. **AI Integration**
- MCP exposes workflows to AI agents
- CLI can be called from any system
- HTTP API for external integrations

## Production Deployment

### Building for Production

```bash
npm run build        # Builds both CLI and Next.js
```

### Deploying Next.js App

```bash
# Option 1: Vercel (Recommended)
vercel deploy

# Option 2: Node.js server
npm run build:web
npm run start:web
```

### Installing CLI

```bash
npm install -g @weave-nn/weaver

# Use globally
weaver workflow status
weaver workflow run document-connection
```

## Configuration

### Server URL

Set the workflow server URL via CLI flag:

```bash
weaver workflow status --server http://localhost:3000
weaver workflow run document-connection file.md --server https://workflows.example.com
```

Or via environment variable:

```bash
export WEAVER_WORKFLOW_SERVER=http://localhost:3000
```

### Next.js Configuration

Customize in `next.config.mjs`:

```javascript
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',  // Adjust as needed
    },
  },
};
```

## Troubleshooting

### Workflow Server Not Running

```bash
# Start the server
npm run dev:web

# Check status
npm run dev:cli workflow status
```

### CLI Can't Connect

```bash
# Check server URL
weaver workflow status --server http://localhost:3000

# Verify server is accessible
curl http://localhost:3000/api/workflows
```

### Workflow Execution Fails

```bash
# Test in dry-run mode
weaver workflow test document-connection file.md --verbose

# Check server logs
npm run dev:web
```

## Future Enhancements

- [ ] Add MCP tools for workflow triggering
- [ ] Implement workflow scheduling
- [ ] Add workflow queue management
- [ ] Create workflow monitoring dashboard
- [ ] Add webhook support for external triggers
- [ ] Implement workflow versioning
- [ ] Add workflow templates

## Resources

- [Vercel Workflow DevKit Docs](https://useworkflow.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Weaver Project Documentation](../weave-nn/docs/)
